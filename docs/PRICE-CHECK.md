# 查價連結實驗

比照 badminton-tw 的 `docs/specs/2026-11-13-gear-price-check-links.md`：量讀者有沒有購買意圖，決定變現下一步。站主 2026-11-18 核可三站比較文件的順序，包含這一項。

## 做法

- 元件 `src/components/PriceCheck.astro`：連到蝦皮搜尋結果，`rel="nofollow noopener"`，不帶聯盟參數、不指向特定賣場、不寫價格數字。
- 點擊送 GA4 事件 `shop_outbound_click`，參數 `article_slug`、`keyword`、`link_domain`。GA 只在正式網域載入，本機和預覽網址點了不送。
- 目前放在：
  - `paddle-recommendations`：「買之前自己查核可清單」段末，關鍵字「匹克球拍」，附一句提醒對照核可清單。
  - `pickleball-shoes`：「怎麼試穿」段末，關鍵字「匹克球鞋」。
- `how-to-choose-paddle` 先不放，等站主確認可以動那篇再加。

## 怎麼判斷

上線後 4 週（約 2026-12-17）拉 GA4：各篇 `shop_outbound_click` ÷ `page_view`。出站率 ≥ 5% 才考慮下一步（分潤或其他），低於 5% 就收掉連結。
