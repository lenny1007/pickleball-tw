# 選題卡：匹克球的球怎麼挑：比賽用球規格、核可清單、台灣哪裡買

- slug：pickleball-balls
- 分類：paddles
- 狀態：已上線（2026-11-19）

## 讀者與需求

- 讀者是誰：打了一陣子、想自己買一盒球，或準備報名第一場比賽的球友
- 他搜這個想解決什麼：該買哪種球、比賽用什麼球、台灣哪裡買得到
- 主關鍵字：匹克球 球
- 相關說法：匹克球 球 推薦、匹克球 比賽用球、匹克球 迪卡儂 球、USAPA 認證 球（2026-11-15 建議詞「裝備：球」）
- 站內有沒有已經回答的文章：first-time-pickleball 講室內球 vs 戶外球。本篇不重複，專講比賽用球、核可清單、台灣通路（站主 2026-11-18 選題卡選「受傷預防+匹克球的球+比賽」）

## 素材

研究原檔在萃取端 `output\research\balls-tournaments\`（A1a–A5b），暫存分支 `claude/pb-research-bt` 的 `docs/research/balls-tournaments/`。

- USA Pickleball 2026 規則書（Pickleball Canada PDF）：3.C、3.C.1–3.C.5、16.G、10.G、10.G.1、20.F、20.F.1
- Equipment Standards Manual Rev 3.0（2025-01）2.D.1–2.D.8；器材網站首頁簡介與 FAQ；EQUIPMENT SPECIFICATIONS 段「strongly recommend … recreational play」
- 核可球清單（2026-11-18 全 399 列）：Franklin X-40 多色 Out、DUOPRO 1.0 I/O、JOOLA HC-40 Out、JOOLA Primo Out、INFMARC TW-40 Out、BLAZESTAR PRO-X4 I/O、Selkirk Q1 Quiet Ball I/O、DECATHLON 3 Out＋1 Ind；查無 KUIKMA、ARTENGO、KASACA
- 迪卡儂台灣商品頁（A3a–A3k）、joola.tw（A4，NT$100 疑似佔位價，不引用）、Selkirk 亞洲官網（A5a，跨境）、Franklin／Onix／HEAD 查無台灣代理（A5b）
- 比賽簡章：CTPF 臺北公開賽／港都盃／中正盃「大會指定用球：DUOPRO」；臺中國際公開賽「比賽用球：JOOLA HC-40」
- 不寫的部分：DUOPRO「全球唯一雙認證」宣稱；Selkirk S2 Pro（清單查不到但官網稱全部核可，不點名）；硬度對溫度的影響（無來源）

## 大綱

- 標題：匹克球的球怎麼挑：比賽用球規格、核可清單、台灣哪裡買
- H2：先看結論（表）／一顆比賽用球長什麼樣（BallSpec＋表）／比賽用哪一顆球（表）／核可清單怎麼查（表）／台灣買得到哪些球（表）／球裂了怎麼辦
- 圖解：新畫 `BallSpec`；封面 kind `balls`
- 往內連：first-time-pickleball、paddle-recommendations、how-to-choose-paddle

## 查證

- 2026-11-18，獨立 subagent。規則書用線上原文，其他來源用站主電腦抄錄檔（A*、B*）。檢查約 90 句，通過約 73 句；error 2、minor 15。
- E1：把 USA Pickleball 16.G 套到所有比賽。主控對 B3（總會規則頁「本會各級賽事採用 GPF 正式規則」）與 B1d–f 確認後改：description、takeaway、正文補「總會採 GPF、臺中採 USAP，兩邊指定球都在清單上」。
- E2：「迪卡儂的球登記在 DECATHLON 名下」等於把 KUIKMA 當成清單上的球。主控對 A1a、A3a 確認後改成「商品頁沒寫對應哪一款，沒辦法確認是同一顆」。
- minor 全改：彈跳加「約、球頂」與溫度範圍；顏色例外；製造商或供應商；清單也標室內戶外；「四百款」改「四百列」；DUOPRO 型號是推論；單價範圍限迪卡儂、補 Selkirk；「幾乎都是戶外球」限我們查到的；「大型通路」改迪卡儂；刪「比較快」；球裂補沒共識與變軟（10.G.1、10.G.2）、裁判改為球員請求（20.F）；衣服顏色補主辦人可要求換（18.B.3）；器材手冊建議是對製造時；Franklin 補「頁面沒寫是不是代理」；X-40 標特價。

## 追蹤

- 第 4 週：2026-12-17
- 第 8 週：2027-01-14
