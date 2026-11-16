"""萃取後的忠實性驗證：每張新卡配上字幕片段，交給全新的 Claude 逐句判定，沒根據的內容自動修掉或剔除。

Gemini 萃取時常在 why／check 補教練沒講的原因或數字（2026-11-15 實跑 8 張有 4 張），
光改 prompt 壓不下去，所以萃取後再過一道獨立驗證。驗證者不是產出者（Claude 對 Gemini），
每批都是全新 context，以推翻為目標。

用法（在站主電腦上，用 Claude Code 訂閱額度，不呼叫付費 API）：
  python -X utf8 verify_cards.py <字幕資料夾> <萃取輸出 .json> --out <報告 .json> \
      [--apply <修正後 .json>] [--fields what,why,how,check] [--batch 6] [--runner "claude -p"]

  --apply   把判定結果套用到一份新檔（原檔不動）：fix 的欄位換成驗證者給的版本，
            drop 的卡移除，每張卡加 fidelity_status（verified／fixed；
            沒字幕或驗證失敗的標 unverified，不要讓它進站）。
  --fields  要驗的欄位。羽球卡另有 description_pro、common_failure 等，用逗號加上。
  --dry-run 只把每批的 prompt 寫到報告旁邊，不呼叫 Claude。
  呼叫 claude 前會拿掉 ANTHROPIC_API_KEY／AUTH_TOKEN／BASE_URL，確保用訂閱額度而不是 API 計費。

字幕：<影片 id>.txt（每行 [mm:ss] 開頭）或 <影片 id>*.vtt，與 check_quotes.py 相同。
每張卡取 timestamp 前 20 秒到後 180 秒的字幕給驗證者。
結束碼：有 drop 或無法判定的卡時為 1，全部 pass／fix 為 0。
"""
import argparse
import copy
import json
import os
import pathlib
import re
import shlex
import shutil
import subprocess
import sys

BEFORE, AFTER = 20, 180
CLAIM_BASIS = ["physics", "coach_method", "screen_data", "coach_example"]


def secs(t) -> int:
    if isinstance(t, (int, float)):
        return int(t)
    total = 0
    for p in str(t or "0").split(":"):
        total = total * 60 + int(p or 0)
    return total


def fmt(s: int) -> str:
    return f"{s // 60:02d}:{s % 60:02d}"


VTT_TIME = re.compile(r"(\d+:)?(\d{2}):(\d{2})\.\d{3}\s+-->")


def load_lines(tdir: pathlib.Path, vid: str):
    """回傳 [(秒數, 原文)]，保留大小寫與標點給驗證者看。"""
    p = tdir / f"{vid}.txt"
    out = []
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            m = re.match(r"\[(\d+:\d{2}(?::\d{2})?)\]\s*(.*)", line)
            if m and m.group(2).strip():
                out.append((secs(m.group(1)), m.group(2).strip()))
        return out
    vtts = sorted(tdir.glob(f"{vid}*.vtt"))
    if not vtts:
        return None
    t, last = 0, None
    for line in vtts[0].read_text(encoding="utf-8").splitlines():
        m = VTT_TIME.match(line)
        if m:
            t = int((m.group(1) or "0:")[:-1]) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
            continue
        if not line.strip() or line.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")):
            continue
        text = re.sub(r"<[^>]+>", "", line).strip()
        if text and text != last:
            out.append((t, text))
            last = text
    return out


def walk(node, parent=None):
    """產出 (卡片 dict, 所在 list)。外層格式不一定，有 source_video_id 的 dict 都當卡。"""
    if isinstance(node, dict):
        if "source_video_id" in node:
            yield node, parent
            return
        for v in node.values():
            yield from walk(v, node if isinstance(node, list) else None)
    elif isinstance(node, list):
        for v in node:
            if isinstance(v, dict) and "source_video_id" in v:
                yield v, node
            else:
                yield from walk(v, node)


PROMPT = """你是知識卡的忠實性審查員。下面每張卡是 Gemini 從一支英文（或中文）教學影片萃取、翻成繁體中文的。
你的任務是**以推翻為目標**，逐句判斷卡片內容是否有字幕根據。你看不到影片畫面，只看得到字幕片段。

判定規則：
1. 翻譯、改寫、濃縮、合併教練說過的話都算有根據。
2. 教練沒說出口的原因、機制、術語、數字、次數、距離、成功率、語氣加重（例如教練說「如果」卻寫成「最容易」）都算沒根據。
3. 只能從畫面得知的內容（示範動作的姿勢、畫面上的數據）你無法確認：不要刪，列在 visual_only。
4. why 欄：只要原因是教練沒講的就刪掉那部分；整段都沒根據時改成「教練未展開」。教練用 because、so、that's why、the reason 等說明的，就算有講原因，要保留。
5. how／check 等其他欄位：刪掉沒根據的句子或片段，保留有根據的。不要新增任何內容，不要潤飾。
   check 是「怎麼確認做對了」的可觀察結果：能從教練講的內容直接推出的要保留，只刪掉數字和教練沒講的具體後果；除非整欄都跟字幕無關，不要清空。
6. what 本身在字幕裡找不到根據時，整張卡 verdict 為 drop。
7. claim_basis 只能是 physics（規則、物理、公認基本功）、coach_method（這位教練的做法或偏好，含教練用 I／we／my 講自己的做法）、screen_data（畫面數據）、coach_example（假設舉例）。分類錯了就在 claim_basis 填正確值。
8. source_quote 若不是字幕裡的原話或與卡片內容無關，在 notes 註明。

只輸出一個 JSON 陣列，不要任何其他文字，每張卡一個物件：
{{"key": "<卡片 key>", "verdict": "pass" | "fix" | "drop",
  "fixes": {{"<欄位>": <修正後的值，型別與原欄位相同>}},
  "claim_basis": "<正確值>",
  "unsupported": ["<被刪掉的原文片段>"],
  "visual_only": ["<只能從畫面確認的片段>"],
  "notes": "<一句話說明>"}}
pass：全部有根據、claim_basis 正確，fixes 留空物件。fix：有任何欄位要改或 claim_basis 要改。

要審查的卡片：
{cards}
"""


def build_packets(cards, tdir, fields):
    cache, packets = {}, []
    for i, (card, _) in enumerate(cards):
        vid = card.get("source_video_id", "")
        if vid not in cache:
            cache[vid] = load_lines(tdir, vid)
        lines = cache[vid]
        t = secs(card.get("timestamp"))
        window = None
        if lines is not None:
            window = "\n".join(f"[{fmt(s)}] {txt}" for s, txt in lines if t - BEFORE <= s <= t + AFTER)
        packets.append({
            "key": f"{i}:{vid}@{card.get('timestamp', '')}",
            "card": {f: card.get(f) for f in fields + ["title", "claim_basis", "source_quote"] if f in card},
            "transcript": window,
        })
    return packets


# 卡片 id 由這兩欄算出，驗證絕不能改
PROTECTED = {"source_video_id", "timestamp", "id"}


def renumber(val):
    """how 刪掉某一步後，「Step 2:」「2.」這類編號重排，避免從第 2 步開始。"""
    if not isinstance(val, list):
        return val
    out = []
    for i, item in enumerate(val, 1):
        if isinstance(item, str):
            item = re.sub(r"^(\s*[Ss]tep\s*)\d+", lambda m: f"{m.group(1)}{i}", item)
            item = re.sub(r"^(\s*)\d+([.、)）])", lambda m: f"{m.group(1)}{i}{m.group(2)}", item)
        out.append(item)
    return out


def parse_json_array(text: str):
    start, end = text.find("["), text.rfind("]")
    if start < 0 or end <= start:
        raise ValueError("輸出裡沒有 JSON 陣列")
    return json.loads(text[start:end + 1])


# 站主電腦同時有 ANTHROPIC_API_KEY 與 claude.ai 登入時，claude 會優先用 API 金鑰計費；
# 從 Claude 桌面版裡叫 claude -p 還會繼承它的連線設定而 401。拿掉這些變數，一律走訂閱登入。
STRIP_ENV = ("ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_BASE_URL")


def run_claude(runner, prompt, keep_api_env=False):
    args = shlex.split(runner, posix=(sys.platform != "win32"))
    exe = shutil.which(args[0]) or args[0]
    env = dict(os.environ)
    if not keep_api_env:
        for k in STRIP_ENV:
            env.pop(k, None)
    r = subprocess.run([exe] + args[1:], input=prompt, capture_output=True, text=True, encoding="utf-8", env=env)
    if r.returncode != 0:
        raise RuntimeError(f"runner 結束碼 {r.returncode}：{r.stderr[:300]}")
    return r.stdout


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transcripts")
    ap.add_argument("cards")
    ap.add_argument("--out", required=True)
    ap.add_argument("--apply")
    ap.add_argument("--fields", default="what,why,how,check")
    ap.add_argument("--batch", type=int, default=6)
    ap.add_argument("--runner", default="claude -p")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--keep-api-env", action="store_true", help="保留 ANTHROPIC_API_KEY 等變數（會改用 API 計費）")
    a = ap.parse_args()

    fields = [f.strip() for f in a.fields.split(",") if f.strip() and f.strip() not in PROTECTED]
    root = json.loads(pathlib.Path(a.cards).read_text(encoding="utf-8"))
    cards = list(walk(root))
    packets = build_packets(cards, pathlib.Path(a.transcripts), fields)
    out = pathlib.Path(a.out)

    results, problems = {}, []
    todo = []
    for p in packets:
        if p["transcript"] is None:
            problems.append({"key": p["key"], "error": "找不到字幕檔"})
        elif not p["transcript"].strip():
            problems.append({"key": p["key"], "error": "卡片時間附近沒有字幕"})
        else:
            todo.append(p)

    for n in range(0, len(todo), a.batch):
        chunk = todo[n:n + a.batch]
        prompt = PROMPT.format(cards=json.dumps(chunk, ensure_ascii=False, indent=1))
        if a.dry_run:
            out.with_name(f"{out.stem}.prompt-{n // a.batch + 1}.txt").write_text(prompt, encoding="utf-8")
            continue
        verdicts = None
        for attempt in range(2):
            try:
                verdicts = parse_json_array(run_claude(a.runner, prompt, a.keep_api_env))
                break
            except (ValueError, RuntimeError, json.JSONDecodeError) as e:
                err = str(e)
        if verdicts is None:
            problems += [{"key": p["key"], "error": f"驗證失敗：{err}"} for p in chunk]
            continue
        got = {v.get("key"): v for v in verdicts if isinstance(v, dict)}
        for p in chunk:
            v = got.get(p["key"])
            if not v or v.get("verdict") not in ("pass", "fix", "drop"):
                problems.append({"key": p["key"], "error": "驗證者漏判或判定值不合法"})
            elif v.get("claim_basis") and v["claim_basis"] not in CLAIM_BASIS:
                problems.append({"key": p["key"], "error": f"驗證者給了不合法的 claim_basis：{v['claim_basis']}"})
            else:
                results[p["key"]] = v
        print(f"批次 {n // a.batch + 1}：{len(chunk)} 張完成", file=sys.stderr)

    if a.dry_run:
        print(f"已寫出 prompt，共 {len(todo)} 張卡、{len(problems)} 張無字幕")
        return

    counts = {"pass": 0, "fix": 0, "drop": 0}
    for v in results.values():
        counts[v["verdict"]] += 1
    report = {"counts": counts, "problems": problems, "results": results}
    out.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")

    if a.apply:
        new_root = copy.deepcopy(root)
        new_cards = list(walk(new_root))
        drops = []
        for p, (card, parent) in zip(packets, new_cards):
            v = results.get(p["key"])
            if not v:
                card["fidelity_status"] = "unverified"
                continue
            if v["verdict"] == "drop":
                drops.append((card, parent))
                continue
            for f, val in (v.get("fixes") or {}).items():
                if f in fields and f in card and f not in PROTECTED:
                    card[f] = renumber(None if val == "" else val)
            if v.get("claim_basis") and v["claim_basis"] != card.get("claim_basis"):
                card["claim_basis"] = v["claim_basis"]
            changed = bool(v.get("fixes")) or v["verdict"] == "fix"
            card["fidelity_status"] = "fixed" if changed else "verified"
        for card, parent in drops:
            if isinstance(parent, list):
                idx = next(i for i, x in enumerate(parent) if x is card)
                del parent[idx]
            else:
                card["fidelity_status"] = "rejected"
        pathlib.Path(a.apply).write_text(json.dumps(new_root, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"pass {counts['pass']}、fix {counts['fix']}、drop {counts['drop']}、無法判定 {len(problems)}（報告：{out}）")
    for pr in problems:
        print(f"✗ {pr['key']}：{pr['error']}")
    sys.exit(1 if problems or counts["drop"] else 0)


if __name__ == "__main__":
    main()
