# pickleball-tw.com 建站計畫（2026-11-13 草案）

## 決定：開新 repo，不 fork badminton-tw
- badminton-tw 累積 97 條轉址、20 道 CI 閘門、14+ phase 卡片資料、首頁 A/B、訓練紀錄等功能，fork 過來要拆的比要留的多。
- 站主要求新站用 frontend-design 做出不同視覺，fork 等於把舊樣式整套搬來再拆。
- 做法：新 repo `lenny1007/pickleball-tw`，Astro 5 + MDX 從零起；從 badminton-tw **只抄邏輯不抄樣式**：知識卡 schema（5W 欄位、source_video_id、timestamp）、BaseHead 的 JSON-LD、FAQ 萃取、sitemap 設定。
- 萃取端：沿用 badminton-knowledge-extractor（站主本機），換頻道清單與 prompt 詞彙即可。

## 需求形狀 → 內容結構
- 2026-11-13 Trends：「匹克球 規則」35 > 羽球 規則 23；「匹克球拍」46 vs 羽球拍推薦 8；中文技術詞（dink、第三拍）在台灣搜尋量測不到，中文教學內容多是簡中 gitbook、新聞報導。
- 結論：比較像高爾夫（技術詞少）而不是羽球。首批內容押**規則、球拍、入門、哪裡打**；技術卡是長尾，量少而精，掛在規則／入門文章裡當證據。
- 首批（約 12 頁）：規則總整理、廚房區、雙彈跳、計分、發球（低手／落地）、球拍怎麼挑、玻纖 vs 碳纖、入門球拍推薦、球的差異（室內／戶外）、台北／台中哪裡打、第一次臨打、名詞中英對照。
- 技術卡：先萃取 3–4 個英文教學頻道約 30 支影片，200–300 張卡。

## 設計方向（原型：https://claude.ai/artifact/LRp7Q8wAi482tH5oWqcHgJ）
- 球場俯視圖當首頁導覽：廚房區＝小球與網前、後場＝打法戰術、發球區＝發球計分。
- 色彩：硬地球場藍、廚房區淺藍、場外綠、黃綠球色點綴；冷灰底。字體 Huninn（圓體）標題、系統黑體內文。與 badminton-tw 的深綠＋羽球黃、Noto Sans／Space Grotesk 區隔。

## 成本（目標約 NT$300/月）
- 網域 pickleball-tw.com 約 NT$35–40/月（已買）。
- 主機：Vercel Pro（站主已有，2026-11-13 確認），與其他站共用，可商用、上 AdSense 沒問題，新站不增加主機成本。
- Gemini 萃取：首批 30 支影片估幾十元台幣以內（以實際帳單為準）。

## 待站主
1. 在 Vercel 匯入這個 repo（New Project → lenny1007/pickleball-tw），加網域 pickleball-tw.com，照 Vercel 指示設定 DNS。
2. 回覆設計方向 OK 與否。
3. 萃取端：選定 3–4 個英文教學頻道後，在本機跑第一批萃取。
