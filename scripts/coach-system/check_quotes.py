"""教練系統引文機檢：確認每句英文引文真的出現在字幕裡、時間點對得上、不超過字數上限。

用法（在站主電腦上，transcripts 在萃取端 output 底下）：
  python -X utf8 check_quotes.py <transcripts 資料夾> <要檢查的 .md> [更多 .md ...]
    [--tolerance 15] [--max-words 25]

吃兩種格式：
  1. 候選檔（candidates/*.md、verified.md…）裡的
       - video_id: <id>
       - time: [mm:ss]
       - quote: "..."
  2. COACH-SYSTEM.md 行尾的 (<id> mm:ss, "...")

知識卡模式（萃取端 2026-11 起每張卡帶 source_quote 與 claim_basis）：
  python -X utf8 check_quotes.py <transcripts 資料夾> --cards <cards.json 或萃取輸出 .json> [...]
    每張有 source_quote 的卡都對字幕比一次。卡的時間是這一點開始講的地方，原話常在後面，
    所以允許原話比 timestamp 早 15 秒到晚 120 秒（--tolerance、--after 可調）。
    原話必須是一段連續的字幕，用 ... 拼接兩段會被判找不到。
    另外檢查 claim_basis 只能是 physics／coach_method／screen_data／coach_example，
    golf 的萃取曾自創第五種值，流進站上會讓 build 失敗。
    原話含 I／my 卻標 physics（we 常是泛指，不算） 的卡也會被抓出來（教練講自己的做法應歸 coach_method）。
    沒有 source_quote 的卡只計數、不算失敗（舊卡都沒有）；加 --require-quote 則算失敗。

字幕檔格式：transcripts/<id>.txt，每行開頭 [mm:ss]；找不到時改讀 <id>*.vtt。
比對前會把大小寫、標點、多餘空白拿掉；引文可以跨好幾行字幕。
有任何一條不通過時結束碼為 1。
"""
import json
import argparse
import pathlib
import re
import sys


def norm(s: str) -> str:
    s = s.lower().replace("’", "'").replace("‘", "'")
    s = re.sub(r"[^a-z0-9' ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    # 字幕和 Gemini 對口語縮寫的寫法常不同（going to／gonna），兩邊都展開再比
    for short, full in (("gonna", "going to"), ("wanna", "want to"), ("gotta", "got to")):
        s = re.sub(rf"\b{short}\b", full, s)
    # 口頭禪：Gemini 抄原話時常省略，兩邊都拿掉
    s = re.sub(r"\b(um|uh|you know)\b", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def secs(t: str) -> int:
    parts = [int(p) for p in t.split(":")]
    total = 0
    for p in parts:
        total = total * 60 + p
    return total


def load_transcript(path: pathlib.Path):
    """回傳 (正規化全文, [(字元起點, 秒數)])。"""
    text, marks = "", []
    for line in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"\[(\d+:\d{2}(?::\d{2})?)\]\s*(.*)", line)
        if not m:
            continue
        piece = norm(m.group(2))
        if not piece:
            continue
        if text:
            text += " "
        marks.append((len(text), secs(m.group(1))))
        text += piece
    return text, marks


VTT_TIME = re.compile(r"(\d+:)?(\d{2}):(\d{2})\.\d{3}\s+-->")


def load_vtt(path: pathlib.Path):
    """YouTube 自動字幕是滾動式，同一行會在下一個 cue 重複出現；連續重複的行只留一次。"""
    text, marks, last, t = "", [], None, 0
    for line in path.read_text(encoding="utf-8").splitlines():
        m = VTT_TIME.match(line)
        if m:
            t = int((m.group(1) or "0:")[:-1]) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
            continue
        if not line.strip() or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")):
            continue
        piece = norm(re.sub(r"<[^>]+>", "", line))
        if not piece or piece == last:
            continue
        last = piece
        if text:
            text += " "
        marks.append((len(text), t))
        text += piece
    return text, marks


def find_transcript(tdir: pathlib.Path, vid: str):
    p = tdir / f"{vid}.txt"
    if p.exists():
        return load_transcript(p)
    vtts = sorted(tdir.glob(f"{vid}*.vtt"))
    return load_vtt(vtts[0]) if vtts else None


CLAIM_BASIS = {"physics", "coach_method", "screen_data", "coach_example"}


def walk_cards(node):
    """萃取輸出的外層格式不一定（list、{"cards": [...]}、{"knowledge": [...]}…），有 source_video_id 的 dict 都當卡。"""
    if isinstance(node, dict):
        if "source_video_id" in node:
            yield node
            return
        for v in node.values():
            yield from walk_cards(v)
    elif isinstance(node, list):
        for v in node:
            yield from walk_cards(v)


def time_at(marks, pos):
    t = marks[0][1] if marks else 0
    for start, s in marks:
        if start > pos:
            break
        t = s
    return t


CAND = re.compile(
    r"video_id:\s*(?P<id>[\w-]{11}).*?time:\s*\[(?P<t>[\d:]+)\].*?quote:\s*[\"“](?P<q>.+?)[\"”]\s*$",
    re.S | re.M,
)
INLINE = re.compile(r"\((?P<id>[\w-]{11})\s+(?P<t>\d+:\d{2}(?::\d{2})?),\s*[\"“](?P<q>.+?)[\"”]\)")


def items(md: pathlib.Path):
    raw = md.read_text(encoding="utf-8")
    # 候選檔一個 ### 區塊一條，避免跨區塊配對
    for block in re.split(r"\n(?=#{2,4} )", raw):
        m = CAND.search(block)
        if m:
            yield m.group("id"), m.group("t"), m.group("q"), block.splitlines()[0][:60]
    for m in INLINE.finditer(raw):
        yield m.group("id"), m.group("t"), m.group("q"), ""


def check_quote(cache, tdir, vid, t, q, tolerance, max_words, after=None):
    """after：原話允許比 t 晚多少秒（知識卡的時間是這一點開始講的地方，原話常在後面）。"""
    problems = []
    if vid not in cache:
        cache[vid] = find_transcript(tdir, vid)
    tr = cache[vid]
    nq = norm(q)
    if len(nq.split()) > max_words:
        problems.append(f"超過 {max_words} 字（{len(nq.split())}）")
    if tr is None:
        problems.append("找不到字幕檔")
    else:
        text, marks = tr
        hits = [m.start() for m in re.finditer(re.escape(nq), text)] if nq else []
        if not hits:
            problems.append("字幕裡找不到這句" + ("（不要用 ... 拼接兩段）" if "..." in q or "…" in q else ""))
        elif t:
            want = secs(t)
            def off(h):
                d = time_at(marks, h) - want
                return max(0, d - after) if after is not None and d > 0 else abs(d)
            diff = min(off(h) for h in hits)
            if diff > tolerance:
                problems.append(f"時間差超出 {diff} 秒")
    return problems


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcripts")
    ap.add_argument("files", nargs="*")
    ap.add_argument("--cards", nargs="+", default=[], help="知識卡 JSON（站上的 cards.json 或萃取輸出）")
    ap.add_argument("--require-quote", action="store_true", help="沒有 source_quote 的卡也算不通過")
    ap.add_argument("--tolerance", type=int, default=None, help="時間誤差上限（秒），預設 15；知識卡另外允許原話比卡片時間晚 --after 秒")
    ap.add_argument("--after", type=int, default=120, help="知識卡原話可比 timestamp 晚多少秒（預設 120）")
    ap.add_argument("--max-words", type=int, default=25)
    a = ap.parse_args()
    if not a.files and not a.cards:
        ap.error("至少要給一個 .md 或 --cards")

    tdir = pathlib.Path(a.transcripts)
    cache = {}
    total = bad = 0
    for f in a.files:
        for vid, t, q, label in items(pathlib.Path(f)):
            total += 1
            problems = check_quote(cache, tdir, vid, t, q, a.tolerance or 15, a.max_words)
            if problems:
                bad += 1
                print(f"✗ {pathlib.Path(f).name} {label} {vid} {t}：{'；'.join(problems)}\n    \"{q[:120]}\"")

    no_quote = 0
    for f in a.cards:
        for card in walk_cards(json.loads(pathlib.Path(f).read_text(encoding="utf-8"))):
            total += 1
            problems = []
            cid = card.get("id") or card.get("title") or "?"
            vid, t = card.get("source_video_id", ""), card.get("timestamp") or ""
            basis, q = card.get("claim_basis"), (card.get("source_quote") or "").strip()
            if basis is not None and basis not in CLAIM_BASIS:
                problems.append(f"claim_basis 不在四個值內：{basis}")
            if basis == "physics" and q and re.search(r"\b(i|i'm|i'll|i've|my|me)\b", norm(q)):
                problems.append("原話是教練用 I／my 講自己的做法，卻標 physics，應該是 coach_method")
            if q:
                problems += check_quote(cache, tdir, vid, t, q, a.tolerance or 15, a.max_words, after=a.after)
            else:
                no_quote += 1
                if a.require_quote:
                    problems.append("沒有 source_quote")
            if problems:
                bad += 1
                print(f"✗ {pathlib.Path(f).name} {cid} {vid} {t}：{'；'.join(problems)}\n    \"{q[:120]}\"")
    if a.cards:
        print(f"（知識卡中沒有 source_quote 的：{no_quote} 張）")
    print(f"共檢查 {total} 條，{total - bad} 條通過，{bad} 條不通過")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
