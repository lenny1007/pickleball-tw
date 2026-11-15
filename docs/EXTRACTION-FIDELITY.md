# 知識卡萃取忠實性：claim_basis 與 source_quote

golfer-tw 在 2026-07 發現，Gemini 萃取影片時最常出的錯有兩種：教練只說「重心偏前腳」，卡片卻寫出「60–70%」；教練說「假設 30 度」，卡片寫成「業餘選手實測平均」。badminton-tw 後來為了同樣的問題，花了一整輪逐卡對字幕（`badminton-tw/docs/CARD-FIDELITY-AUDIT-RUN.md`）。

解法是在萃取那一步就讓每張卡帶兩個欄位，事後用程式對字幕，不再逐張人工查。2026-11-15 起 pickleball 與 badminton 的萃取端比照 golf 加上。

## 兩個欄位

| 欄位 | 值 | 站上怎麼顯示 |
|---|---|---|
| `claim_basis` | `physics`：規則、物理或公認基本功，可當事實寫 | 不標 |
| | `coach_method`：這位教練的做法或偏好，別的教練可能教法不同 | 標「一種教法」 |
| | `screen_data`：影片畫面上顯示的數據 | 不標 |
| | `coach_example`：教練的假設舉例，不是實測 | 標「示範舉例」 |
| `source_quote` | 教練講這一點的英文原話，從字幕逐字複製一段連續的話，25 字以內，不可用「...」拼接兩段 | 不顯示，只給機檢用 |

只能是這四個值。golf 的萃取曾自創 `coach_observation`，流進站上就會讓 build 失敗；觀察與診斷一律歸 `coach_method`。

舊卡（2026-11-15 前的 701 張）都沒有這兩個欄位，站上不顯示任何標籤，不需要回填。

## 萃取端要改的地方

萃取程式在站主電腦上，不在 git 裡：

- `C:\Users\USER\Desktop\pickleball-knowledge-extractor\scripts\extract_knowledge.py`
- `C:\Users\USER\Desktop\badminton-knowledge-extractor\scripts\extract_knowledge.py`

照 `golf-knowledge-extractor\scripts\extract_knowledge.py` 搬四件事進 system prompt（有成人／兒童兩個 prompt 的話兩個都改）：

1. **忠實性鐵則**放在最前面：只寫教練實際說出口、畫面實際顯示的內容；定性描述不換算成數字；保留教練的保留語氣；假設舉例要標成舉例；`why` 只寫教練講出來的原因，沒講就寫「教練未展開」。
2. **拿掉會抹平保留語氣的過濾規則**：如果有「過濾『我覺得／我認為』」這類規則，改成只過濾跟技術無關的閒聊。
3. **輸出 schema 加 `claim_basis` 與 `source_quote`**，並寫明「claim_basis 只能是這四個值其一，禁止自創」。
4. **寧缺勿捏**：抓不到原話的點寧可不出卡。

改之前先備份原檔（`extract_knowledge.py.bak-2026-11-15`）。如果萃取後有正規化或合併腳本，確認它不會把不認得的欄位丟掉。

## 驗收

1. 挑一支已萃取過的影片，用 `--force` 重跑一次（先備份輸出，跑完還原，不留變更）。
2. 每張新卡都要有 `claim_basis` 與 `source_quote`，`why` 沒有補教練沒講的原因，沒有字幕裡找不到的數字。
3. 用機檢對字幕：

   ```
   python -X utf8 scripts/coach-system/check_quotes.py <字幕資料夾> --cards <萃取輸出 .json> --require-quote
   ```

   字幕可以是 `<影片 id>.txt`（每行 `[mm:ss]` 開頭）或 yt-dlp 抓的 `<影片 id>*.vtt`。會檢查原話是否逐字出現（gonna／going to 這類口語縮寫視為相同）、時間點落在卡片 `timestamp` 前 15 秒到後 120 秒之間（卡片時間是這一點開始講的地方，原話常在後面）、25 字以內、`claim_basis` 值域。

之後每一批新卡進站前都跑第 3 步，不通過的卡修掉或刪掉再合併進 `cards.json`。

## 第一次實跑（2026-11-15）

- 匹克球 `IWVu09HFGvY`（Better Pickleball）：4 張卡全帶兩欄、沒有自創值、4 句原話都是真的。機檢不過的 2 條，一條是原話在卡片時間後 36 秒，一條是 Gemini 把字幕的 going to 寫成 gonna；機檢因此改成允許原話晚 120 秒、縮寫視為相同。
- 羽球 `gP71EvGxxH4`（Badminton Famly）：5 張卡全帶兩欄。原話片段都是真的，但有兩句用「...」把不相連的話接起來、一句超過 25 字；prompt 因此加上「只抄一段連續原話」。另外羽球卡的練習頻率欄格式要求「每週 X 次、Y 週、每次 Z 球」，5 張全是捏造數字，已改成教練沒講就留空。
- 兩邊都還有 `why` 補了教練沒講的原因、把教練第一人稱的做法標成 physics 的情形。機檢抓不到這類偏差，新卡進站前仍要抽看。
