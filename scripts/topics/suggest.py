"""選題用：抓 Google 搜尋框的自動完成建議，看台灣讀者實際怎麼搜。

雲端連不到 Google，請在站主電腦跑：
  python -X utf8 scripts/topics/suggest.py 匹克球 匹克球拍 > suggest.tsv

每個種子詞會再接上常見的延伸字（怎麼、推薦、規則、新手…）各查一次，
輸出 TSV：種子詞、查詢字串、建議詞。只用 Python 標準函式庫，查詢之間停 1 秒。
自動完成只代表「有人這樣搜」，不是搜尋量；要比大小用 Google Trends 或上線後的 Search Console。
"""
import json
import sys
import time
import urllib.parse
import urllib.request

SUFFIXES = ["", " 怎麼", " 推薦", " 規則", " 新手", " 技巧", " 教學", " 價格", " 哪裡", " 是什麼",
            " 為什麼", " 差別", " 比較", " 練習", " 發球", " 場地", " 台北", " 台中", " 高雄"]


def suggest(q: str) -> list[str]:
    url = "https://suggestqueries.google.com/complete/search?" + urllib.parse.urlencode(
        {"client": "firefox", "hl": "zh-TW", "gl": "tw", "q": q})
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode("utf-8", "replace"))[1]


def main():
    seeds = sys.argv[1:] or ["匹克球"]
    seen = set()
    print("seed\tquery\tsuggestion")
    for seed in seeds:
        for suf in SUFFIXES:
            q = seed + suf
            try:
                items = suggest(q)
            except Exception as e:  # 網路問題就跳過這一條
                print(f"# {q} 失敗：{e}", file=sys.stderr)
                items = []
            for s in items:
                if s not in seen:
                    seen.add(s)
                    print(f"{seed}\t{q}\t{s}")
            time.sleep(1)
    print(f"# 共 {len(seen)} 個不重複建議詞", file=sys.stderr)


if __name__ == "__main__":
    main()
