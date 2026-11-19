# AGENTS.md — pickleball-tw 協作規則

Codex 與 Claude Code 都會讀這份。只寫讀程式看不出來的事。

## 基本
- 回覆、PR 說明、commit 訊息一律繁體中文。
- 2026-11-19 起本站有獨立的 Claude 專案。接手先讀 `docs/HANDOFF-2026-11-19.md`（現況、等站主的事、排程、站主偏好、站主電腦的路徑）。
- 正式站 https://pickleball-tw.com 。推到 `main` = Vercel 自動部署上線。
- Astro 5 靜態站，沒有後端。驗收順序：`npm run check`（0 errors）→ `npm run build`。動到文章時先跑 `npm run check:articles`。CI 跑同樣兩步。

## 定位
- 把國內外匹克球教學影片整理成繁中知識卡與文章；變現走 AdSense，低人力。
- 台灣需求以**規則、球拍**為主，中文技術詞搜尋量很低。內容先做規則／球拍／入門／哪裡打，技術卡是長尾。計畫見 `docs/PLAN.md`。

## 設計
- 視覺必須跟 badminton-tw 不同，見 `docs/DESIGN.md`。顏色只用 `src/styles/global.css` 的 token，不寫死色碼。
- 首頁的球場圖是唯一的重點裝飾，其他區塊保持安靜。

## 內容可信度（從 golfer-tw、badminton-tw 學到的）
- 新文章上線前要經過獨立查證：規則對照 USA Pickleball 官方規則原文，球拍數字對照廠商規格。
- 型號、店名、場館、組織名稱查不到就不寫。
- 精確數字與價格要有來源，但**內文不放規則條號、查證日期、來源括號**，開頭也不放資料說明；全部集中在文末「資料來源」段（站主 2026-11-15：影響閱讀的都拿掉）。條號與日期記在 `docs/briefs/` 的選題卡和查證紀錄。
- 粗體 `**…**` 的結尾 `**` 前面不能是全形標點（例如「（低手發球）**要」），否則整段會變成字面星號。標點移到粗體外。build 後 `grep -rlF "**" dist --include=index.html` 應該沒有結果。
- 寫新文章照 `docs/ARTICLE_WORKFLOW.md`：選題卡（`docs/briefs/`）→ 素材 → 大綱 → 寫作 → 獨立查證 → `npm run check:articles` → 上線後第 4、8 週追蹤。用教練影片當素材時另看 `docs/COACH_ARTICLE_WORKFLOW.md`。新討論串先照 ARTICLE_WORKFLOW 最前面的「開工清單」：`npm run topics:status` 看誰在寫什麼、改選題卡狀態認領、一篇一個 PR。
- 圖解先看 `docs/FIGURES.md` 有沒有現成的；畫完跑 `npm run shoot -- <slug>` 截圖並抓手機上太小的字。
- 用字照 `docs/TERMINOLOGY.md`：台灣球友怎麼說就怎麼寫，台灣習慣講英文的（dink、drop、reset、Erne）就寫英文。

## 知識卡
- 資料在 `src/content/knowledge/cards.json`，來自站主本機的萃取端（沿用 badminton-knowledge-extractor）。
- 2026-11-15 起新卡帶 `claim_basis`（`coach_method` 站上標「一種教法」）與 `source_quote`（教練英文原話）。新卡進站前用 `scripts/coach-system/check_quotes.py --cards` 對字幕機檢，再用 `verify_cards.py` 讓 Claude 逐句刪掉沒根據的內容，見 `docs/EXTRACTION-FIDELITY.md`。
- 卡片預設 `index: false`：不進 sitemap、頁面 noindex。有搜尋需求的卡才開。理由：badminton-tw 卡片全開時 sitemap 88% 是卡、77% 零曝光。

## 分支
- Claude 雲端 session 用系統指定的 `claude/*` 分支，開 draft PR。不直接推 `main`。
