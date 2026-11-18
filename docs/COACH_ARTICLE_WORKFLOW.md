# 教練系統文章：做法

從一個 YouTube 教學頻道的字幕，整理出這位教練的「教學系統」，再拿它寫一篇有主軸的文章。第一篇是〈匹克球新手常犯的錯誤〉（`beginner-mistakes`，2026-11-15 上線，PR #5），本文件就是照那次的實際步驟整理的。

跟知識卡的差別：知識卡是一支影片一張卡的重點整理；這種文章是把一個頻道幾十支影片的觀點串成一條邏輯（先改什麼、為什麼、怎麼自己檢查），每句話都對得回字幕原句。

選題、大綱、上線與追蹤的總流程在 [`ARTICLE_WORKFLOW.md`](ARTICLE_WORKFLOW.md)，這份只講「教練影片當素材」那一段。

方法借自 [cangjie-skill](https://github.com/kangarooking/cangjie-skill)：用它的第 0、1、1.5 段，第 2 到 5 段（打包成 agent skill、壓力測試）網站用不到，不跑。

## 什麼時候用

- 一個頻道或一位教練有 15 支以上影片在講同一類主題（入門錯誤、dink、第三拍、雙打站位…）。
- 題目是技術或策略。**規則題不用這個流程**，規則文章照 USA Pickleball 規則書原文寫（見 CLAUDE.md）。

## 誰在哪裡做

| 步驟 | 在哪裡跑 | 原因 |
|---|---|---|
| 下載字幕、整理逐字稿、萃取、三重驗證、文章查證 | 站主電腦（雲端開 Remote Control session） | 雲端連不到 YouTube；字幕和中間檔都留在萃取端 |
| 寫文章、圖解、build、PR | 雲端 session，這個 repo | 一般改站流程 |

站主電腦上的位置：`C:\Users\USER\Desktop\pickleball-knowledge-extractor\output\`

- `<頻道縮寫>-subs\`：原始 VTT
- `<頻道縮寫>-coach-system\`：所有產出（範例：`bp-coach-system\`）
  - `transcripts\<id>.txt`：整理過的逐字稿，每行 `[mm:ss]`
  - `OVERVIEW.md`：第 0 段整體理解
  - `candidates\<萃取器>.md`：第 1 段候選
  - `verify\`：第 1.5 段驗證紀錄
  - `verified.md`、`reference.md`、`needs-review.md`、`rejected.md`、`STATS.md`
  - `COACH-SYSTEM.md`：中文教練系統文件（寫文章的唯一素材）
  - `article-verify.md`：文章的對抗式查證結果

全程不呼叫 Gemini 或任何付費 API，只用 Claude 訂閱額度。Better Pickleball 28 支影片：萃取＋驗證一個 RC session，文章查證另一個。

## 流程

### 1. 選頻道與影片

- 從 `docs/SOURCES.md` 的頻道挑一個，影片清單在萃取端 `output\channel-lists\<頻道>.json`。
- 挑跟題目有關的 20 到 30 支。

### 2. 下載字幕（站主電腦）

```
yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs "en.*,en" --sub-format vtt -o "%(id)s.%(ext)s" -P <subs 資料夾> <影片網址…>
```

挑字幕的順序：`en-US` → `en` → `en-orig`。

**坑：** 有些影片的 `.en` 其實是「機器翻成別的語言再翻回英文」，跟教練原話差很多（試做時 3 支，相似度只有 0.36 到 0.61）。整理逐字稿時要把 `.en` 和 `.en-orig` 比一下，差很多就用 `en-orig`，舊版移到 `transcripts\_superseded\`。

### 3. 整理逐字稿

每支影片一個 `transcripts\<id>.txt`：第一行 `# <id> | <片名> | source: <用的 vtt 檔>`，接著把自動字幕重複滾動的行去掉，大約每句一行、行首 `[mm:ss]`。另寫一份 `_INDEX.md` 列出 id、片名、講者。

### 4. 第 0 段：整體理解（OVERVIEW.md）

先讀完全部逐字稿，寫出這個頻道的整體教學觀：核心信念、怎麼診斷休閒球友的問題、反覆出現的口訣、影片是給誰看的、**有幾位教練、各是誰**。

### 5. 第 1 段：五個萃取器平行跑

照 cangjie 的 `extractors/*.md`，五個 subagent 各跑一種，互不知道彼此結果：

| 萃取器 | 抽什麼 |
|---|---|
| framework | 教練的步驟、順序、診斷流程 |
| principle | 原則與口訣 |
| case | 具體示範、例子 |
| counter-example | 教練說「不要這樣做」、常見說法哪裡錯、什麼時候不適用 |
| glossary | 術語與教練自己的說法 |

每條候選必須有：`video_id`、`time: [mm:ss]`、`quote:`（從逐字稿逐字複製的英文，最多 25 字）、`claim`。錯誤類加 `mistake / cause / fix / check`。寫到 `candidates\<萃取器>.md`，每條一個 `###` 區塊。

### 6. 第 1.5 段：三重驗證

用**沒參與萃取的新 subagent** 逐條判：

- **V1 來源**：引文真的在那支影片、時間差不多、而且撐得起 claim。沒有多加數字、保留 usually／as a general guideline 這類保留語氣、分清教練個人看法和規則。
- **V2 可執行**：休閒球友在場上做得到、自己檢查得了。
- **V3 有用**：對台灣初中級讀者有幫助。

結果四選一：`verified`（可寫）、`reference`（只當背景）、`needs_review`（待查，不寫）、`rejected`。

**規則類一律 needs_review**：發球合不合法、判界、非截擊區違例、計分。除非教練明講對應 USA Pickleball 現行規則書，而且就算這樣也要對過規則書原文才能寫。試做時有驗證員因為教練提到「規則第 7 條」就放行，後來全部改回 needs_review。

### 7. 引文機檢（cangjie 沒有，我們加的）

```
python -X utf8 scripts\coach-system\check_quotes.py <transcripts 資料夾> candidates\*.md
```

逐條確認引文真的逐字出現在字幕裡、時間差 15 秒內、不超過 25 字。不通過的修掉或刪掉再進下一步。腳本在這個 repo 的 `scripts/coach-system/check_quotes.py`，站主電腦上用 `pickleball-tw-extract` 那份 clone 跑就好。

### 8. 寫 COACH-SYSTEM.md（中文教練系統文件）

只收 verified 的條目，分五段：

- (a) 核心原則
- (b) 錯誤診斷表：症狀 → 教練說的原因 → 教練的修法 → 怎麼自己檢查
- (c) 口訣與練習
- (d) 教練跟常見說法不同的地方
- (e) 術語

每行結尾 `(<id> mm:ss, "英文原句")`。寫完再跑一次 `check_quotes.py`，然後派一個沒參與的審稿員逐行對原文。用字照 `docs/TERMINOLOGY.md`。

**兩個試做時被抓到的錯，寫的時候就要避開：**

1. **把編者自己排的順序寫成教練的邏輯。** 教練沒有給跨影片的排名，排序是我們整理的，要明講「排序是我們整理的」。
2. **把兩位教練寫成同一位。** 一個頻道常有好幾位教練或客座，OVERVIEW 就要先列清楚，引用時分開。

(d) 段只收教練**明講**「大家以為…其實…」的條目，不要自己推。

### 9. 寫文章（雲端，這個 repo）

選題、大綱、寫作規則照 [`ARTICLE_WORKFLOW.md`](ARTICLE_WORKFLOW.md) 第 1、3、4 步。教練影片類另外要注意：

- 素材只用 COACH-SYSTEM.md 的 verified 條目。
- **要有一條主軸**，不是把卡片疊起來。例如「先少丟分 → 再修每一拍的共同毛病 → 最後照擊球順序逐拍檢查」。
- 素材來自哪個頻道、幾支影片，「教練建議」是一種教法、不是唯一標準，這些說明放在文末「這篇怎麼整理的」，不要放開頭。開頭只保留讀懂正文必要的一句，例如「排序是我們整理的」。
- 有多位教練時可以統稱「教練」，但不能把兩人的說法揉成一個人的主張。
- **內文不放時間點**（站主試讀後覺得多餘），關鍵段落結尾放 `VideoEmbed`（嵌入影片，從示範那一秒開始播）。文末放「參考影片」，只列片名和連結。
- 不寫規則斷言，講到發球、判界只談技術和策略，規則部分連到規則文章。

### 10. 對抗式查證（站主電腦，RC）

文章推上分支後，派一個**沒寫過教練系統也沒寫文章**的 subagent，目標是找錯：

- 每一句講教練說了什麼的話（含 description、takeaways），對照 VideoEmbed 的 id＋時間（±20 秒）和逐字稿。
- 有沒有加數字、漏掉保留語氣、把教練看法寫成事實、換算錯誤、偷渡規則斷言、把兩位教練混在一起。

結果寫到 `article-verify.md`，每條標 error 或 minor 和建議修法。試做時抓到 2 個 error、21 個 minor，全部修完才上線。

### 11. 上線

照 `ARTICLE_WORKFLOW.md` 第 6、7 步。

## 給 RC session 的交辦範本

萃取＋驗證（第 3 到 8 步），換掉頻道名、資料夾和影片 id：

> 照 cangjie-skill 的方法（先讀 SKILL.md、methodology/00 到 03、extractors/*.md）替 YouTube 頻道 <頻道> 建教練系統。輸入：<subs 資料夾> 的字幕。所有產出只寫到 <coach-system 資料夾>，不碰其他地方、不用 git、不呼叫付費 API。
> 1. 整理逐字稿（字幕挑選順序與 en-orig 比對見 docs/COACH_ARTICLE_WORKFLOW.md 第 2、3 步）。
> 2. 第 0 段寫 OVERVIEW.md，列出所有教練。
> 3. 五個萃取器各開一個 subagent 平行跑，每條候選帶 video_id、[mm:ss]、逐字英文引文（≤25 字）。特別注意 <題目相關的重點>。
> 4. 用沒參與萃取的新 subagent 做 V1/V2/V3，分成 verified/reference/needs_review/rejected；規則類一律 needs_review。寫 STATS.md。
> 5. 用 check_quotes.py 機檢全部候選。
> 6. 用繁體中文寫 COACH-SYSTEM.md（只收 verified，五段結構），再機檢一次，再派審稿員逐行對原文，修完。
> 7. 回報：COACH-SYSTEM.md 全文、統計、跑了和跳過哪些 cangjie 階段、偏離了哪些指示。

文章查證（第 10 步）：

> 對抗式查證 <slug> 文章。用 `git fetch origin <分支>` 加 `git show FETCH_HEAD:src/content/articles/<slug>.mdx` 取文章，不要 checkout。派一個沒寫過教練系統的 subagent，目標是找錯：（第 10 步的檢查清單）。結果寫到 article-verify.md，回報每個問題的位置、嚴重度（error／minor）、建議修法，以及檢查了幾條、通過幾條。

## 試做數字（Better Pickleball，2026-11-14）

- 28 支影片，兩位主要教練加一位客座。
- 候選 445 條：verified 309、reference 33、needs_review 100（大多是規則）、rejected 3。
- 引文機檢 515 句；COACH-SYSTEM.md 137 條引文 0 錯。
- COACH-SYSTEM 審稿抓到 3 個主要、6 個次要問題；文章查證抓到 2 個 error、21 個 minor。

## 下一篇可以直接用的素材

`bp-coach-system\COACH-SYSTEM.md` 裡還有很多沒用到的條目，dink 專文、第三拍 drop 專文都可以直接寫，從第 9 步開始。換頻道或做多教練比較文的話，從第 1 步開始。
