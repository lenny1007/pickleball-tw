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

字幕檔格式：transcripts/<id>.txt，每行開頭 [mm:ss]。
比對前會把大小寫、標點、多餘空白拿掉；引文可以跨好幾行字幕。
有任何一條不通過時結束碼為 1。
"""
import argparse
import pathlib
import re
import sys


def norm(s: str) -> str:
    s = s.lower().replace("’", "'").replace("‘", "'")
    s = re.sub(r"[^a-z0-9' ]+", " ", s)
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcripts")
    ap.add_argument("files", nargs="+")
    ap.add_argument("--tolerance", type=int, default=15, help="時間誤差上限（秒）")
    ap.add_argument("--max-words", type=int, default=25)
    a = ap.parse_args()

    tdir = pathlib.Path(a.transcripts)
    cache = {}
    total = bad = 0
    for f in a.files:
        for vid, t, q, label in items(pathlib.Path(f)):
            total += 1
            problems = []
            if vid not in cache:
                p = tdir / f"{vid}.txt"
                cache[vid] = load_transcript(p) if p.exists() else None
            tr = cache[vid]
            nq = norm(q)
            if len(nq.split()) > a.max_words:
                problems.append(f"超過 {a.max_words} 字（{len(nq.split())}）")
            if tr is None:
                problems.append("找不到字幕檔")
            else:
                text, marks = tr
                hits = [m.start() for m in re.finditer(re.escape(nq), text)] if nq else []
                if not hits:
                    problems.append("字幕裡找不到這句")
                else:
                    want = secs(t)
                    diff = min(abs(time_at(marks, h) - want) for h in hits)
                    if diff > a.tolerance:
                        problems.append(f"時間差 {diff} 秒")
            if problems:
                bad += 1
                print(f"✗ {pathlib.Path(f).name} {label} {vid} {t}：{'；'.join(problems)}\n    \"{q[:120]}\"")
    print(f"共檢查 {total} 條，{total - bad} 條通過，{bad} 條不通過")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
