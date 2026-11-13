# AGENTS.md — pickleball-tw 協作規則

Codex 與 Claude Code 都會讀這份。只寫讀程式看不出來的事。

## 基本
- 回覆、PR 說明、commit 訊息一律繁體中文。
- 正式站 https://pickleball-tw.com 。推到 `main` = Vercel 自動部署上線。
- Astro 5 靜態站，沒有後端。驗收順序：`npm run check`（0 errors）→ `npm run build`。CI 跑同樣兩步。

## 定位
- 把國內外匹克球教學影片整理成繁中知識卡與文章；變現走 AdSense，低人力。
- 台灣需求以**規則、球拍**為主，中文技術詞搜尋量很低。內容先做規則／球拍／入門／哪裡打，技術卡是長尾。計畫見 `docs/PLAN.md`。

## 設計
- 視覺必須跟 badminton-tw 不同，見 `docs/DESIGN.md`。顏色只用 `src/styles/global.css` 的 token，不寫死色碼。
- 首頁的球場圖是唯一的重點裝飾，其他區塊保持安靜。

## 內容可信度（從 golfer-tw、badminton-tw 學到的）
- 新文章上線前要經過獨立查證：規則對照 USA Pickleball 官方規則原文，球拍數字對照廠商規格。
- 型號、店名、場館、組織名稱查不到就不寫。
- 價格與精確數字行內標「（來源、YYYY-MM 查證）」。
- 用字照 `docs/TERMINOLOGY.md`：台灣球友怎麼說就怎麼寫，台灣習慣講英文的（dink、drop、reset、Erne）就寫英文。

## 知識卡
- 資料在 `src/content/knowledge/cards.json`，來自站主本機的萃取端（沿用 badminton-knowledge-extractor）。
- 卡片預設 `index: false`：不進 sitemap、頁面 noindex。有搜尋需求的卡才開。理由：badminton-tw 卡片全開時 sitemap 88% 是卡、77% 零曝光。

## 分支
- Claude 雲端 session 用系統指定的 `claude/*` 分支，開 draft PR。不直接推 `main`。
