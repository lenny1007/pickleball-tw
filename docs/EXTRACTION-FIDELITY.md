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

   字幕可以是 `<影片 id>.txt`（每行 `[mm:ss]` 開頭）或 yt-dlp 抓的 `<影片 id>*.vtt`。會檢查原話是否逐字出現（gonna／going to 這類口語縮寫視為相同）、時間點落在卡片 `timestamp` 前 15 秒到後 120 秒之間（卡片時間是這一點開始講的地方，原話常在後面）、25 字以內、`claim_basis` 值域，以及原話含 I／my 卻標 physics 的卡（we 常是泛指，不算）。口頭禪 um、uh、you know 比對時忽略。

4. 用 Claude 逐句驗證內容有沒有字幕根據（自動修正）：

   ```
   python -X utf8 scripts/coach-system/verify_cards.py <字幕資料夾> <萃取輸出 .json> --out <報告 .json> --apply <修正後 .json>
   ```

   每張卡配上 timestamp 前 20 秒到後 180 秒的字幕，交給全新的 `claude -p`（Claude Code 訂閱額度，不呼叫付費 API）以推翻為目標判定：教練沒講的原因、數字、術語、加重的語氣都刪掉，`why` 整段沒根據就改成「教練未展開」，`claim_basis` 分錯就改，`what` 本身沒根據的卡整張剔除。修正寫到新檔，原檔不動，每張卡加 `fidelity_status`（verified／fixed／unverified）。羽球卡要多驗的欄位用 `--fields what,why,how,check,description_pro,common_failure` 加上。

之後每一批新卡進站前都跑第 3、4 步，用第 4 步的修正檔進站；`unverified` 的卡（沒字幕或驗證失敗）不進站。

## 第一次實跑（2026-11-15）

- 匹克球 `IWVu09HFGvY`（Better Pickleball）：4 張卡全帶兩欄、沒有自創值、4 句原話都是真的。機檢不過的 2 條，一條是原話在卡片時間後 36 秒，一條是 Gemini 把字幕的 going to 寫成 gonna；機檢因此改成允許原話晚 120 秒、縮寫視為相同。
- 羽球 `gP71EvGxxH4`（Badminton Famly）：5 張卡全帶兩欄。原話片段都是真的，但有兩句用「...」把不相連的話接起來、一句超過 25 字；prompt 因此加上「只抄一段連續原話」。另外羽球卡的練習頻率欄格式要求「每週 X 次、Y 週、每次 Z 球」，5 張全是捏造數字，已改成教練沒講就留空。
- 兩邊都還有 `why` 補了教練沒講的原因、把教練第一人稱的做法標成 physics 的情形。機檢抓不到這類偏差，新卡進站前仍要抽看。

## 第二輪（2026-11-15）

prompt 加上「原話只抄一段連續的話」「教練用 I／we 講的做法歸 coach_method」「why 不准補字幕沒有的因果與術語」，羽球練習頻率改成沒講就留空，羽球改用新版 Gemini SDK（舊模型已停用，原程式其實跑不動）。同兩支影片重跑：

- 原話機檢：匹克球 4/4、羽球 3/4（一句 31 字超長）。羽球練習頻率 4 張全部留空，上次 5 張全是編的。
- 仍壓不下去的：8 張裡 4 張的 `why` 或 `check` 補了教練沒講的原因或數字（例如教練沒解釋為什麼用七成力，卡片卻寫了理由）；1 張教練第一人稱講的做法被標成 physics。
- 結論：規則型指示 Gemini 大多照做，判斷型指示不穩，繼續加字效果有限。第一人稱標 physics 已改由機檢抓；`why` 有沒有補料仍要新卡進站前抽看。

## 第三道：Claude 逐句驗證（2026-11-16）

第二輪後 `why`／`check` 仍會補料，站主決定改成自動處理，不靠人工抽看。新增 `verify_cards.py`（見上方驗收第 4 步）。雲端用模擬卡實測：教練只說「我切球用七成力」，Gemini 卡片的 why「七成力能精確控制切削角度」與 check「連續 10 次落在前發球線」都被刪掉，why 改成「教練未展開」，claim_basis 由 physics 改成 coach_method。

### 實跑（2026-11-16，站主電腦、訂閱額度）

匹克球 4 張、羽球 5 張全部判 fix、0 drop；一批約 20–80 秒，100 張卡約 15–20 分鐘。上一輪列的補料（七成力的理由、10 次落點、速度、語氣加重）全部被刪，另外抓到兩處 Gemini 把教練的意思講反或講錯並改正。偏嚴：3 張的 check 被整欄清空、1 張教練有講的原因被改成「教練未展開」。已在 prompt 補上「check 能從教練講的直接推出就保留」「教練用 because／so 說明的算有講原因」，並在套用時重排 how 的步驟編號、禁止改 `timestamp`／`source_video_id`。

### 接進萃取流程（2026-11-16）

兩邊萃取端各加了 `scripts/verify_new_videos.py`（一鍵：匯出新卡 → 找字幕 → check_quotes → verify_cards → 寫回萃取資料庫）與 `apply_verified.py`（寫回；有卡沒驗完、`timestamp`／`source_video_id`／`title` 被改、資料庫在送驗後變動的影片整支不寫回）。匹克球 `to_site_cards.py` 跳過 `fidelity_status` 為 unverified／rejected 的卡。羽球腳本在呼叫 Claude 前擋掉已上站的影片，且必須在該批新卡第一次 `reconcile:apply` 之前跑。

```
cd C:\Users\USER\Desktop\pickleball-knowledge-extractor; python -X utf8 scripts/verify_new_videos.py --target <target> --video-id <id> [<id> ...]
cd C:\Users\USER\Desktop\badminton-knowledge-extractor; python -X utf8 scripts/verify_new_videos.py --target <target> --video-id <id> [<id> ...]
```

腳本預設從 `C:\Users\USER\Desktop\pickleball-tw-extract\scripts\coach-system` 讀 check_quotes.py 與 verify_cards.py，那個 clone 要更新到含這兩支檔的 main。第二次實跑後再補兩點：驗證者可把拼接或超長的 `source_quote` 換成字幕裡一段連續原話，刪減後的殘句改寫成通順短句（不新增內容）。
