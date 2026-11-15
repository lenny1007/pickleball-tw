# 圖解目錄與畫圖規則

寫文章前先看這裡有沒有現成的圖可以用，沒有再畫新的。元件都在 `src/components/fig/`，在 MDX 裡 `import X from '../../components/fig/X.astro';` 再放 `<X />`。

## 現成的圖

| 元件 | 畫什麼 | 用在 |
|---|---|---|
| `CourtDimensions` | 全場俯視與尺寸（公尺＋呎），非截擊區 | pickleball-rules |
| `ServeDiagram` | 發球往對角、要越過非截擊區，壓非截擊區線算失誤 | pickleball-rules |
| `TwoBounce` | 雙彈跳三格：發球、接發球要落地，第 3 拍起可截擊 | pickleball-rules |
| `NvzCases` | 非截擊區四種情況（線外截擊、踩線、區內打彈地球、衝進去） | pickleball-rules、non-volley-zone |
| `NvzSideView` | 側面：非截擊區只算地面，上空不算 | non-volley-zone |
| `NvzFeet` | 腳印：兩腳都退出才能截擊 | non-volley-zone |
| `LineCall` | 壓線算界內、有空隙才出界、發球壓非截擊區線算失誤 | pickleball-rules |
| `ScoreCall` | 報分「4－2－1」三個數字各是什麼 | pickleball-rules、pickleball-scoring |
| `ScorePositions` | 雙打用分數檢查站位（雙數右、單數左） | pickleball-scoring |
| `SideOutLoop` | 雙打發球權輪轉 | pickleball-scoring |
| `SingleServe` | 單打發球位置 | pickleball-scoring |
| `RespectX` | 中間球誰接（教練的分工建議） | beginner-mistakes |
| `ServeDots` | 發球的三個點（側面） | beginner-mistakes |
| `BallTypes` | 室內球與戶外球 | first-time-pickleball |
| `PaddleRack` | 臨打排球拍 | first-time-pickleball |
| `PaddleShapes` | 三種拍型與甜區 | how-to-choose-paddle |
| `CoreThickness` | 芯材厚度剖面 | how-to-choose-paddle |
| `ArticleCover` | 每篇的封面，依 slug 關鍵字選畫面 | 全部 |

畫新圖用的零件：

| 零件 | 說明 |
|---|---|
| `Figure` | 外框與圖說，`caption` 必填 |
| `Court` | 俯視球場底圖，可用 `x0 x1 y0 y1`（呎）裁切範圍 |
| `Player` | 球員圓點，`side="us/them"`、`label`、`mark="ok/fault"` |
| `Path` | 球的飛行弧線，`bend` 控制彎曲、`num` 標拍數 |
| `Bounce`、`Ball` | 落地點、球 |

新圖畫好要加進上面的表。

## 座標

- `Court` 俯視：1 呎 = 10 單位。球場 440 × 200，網在 x=220，非截擊區線在 x=150、290，中線 y=100。
- 球員面向 +x（往右）時，他的右手邊是 y 大的那一側（圖的下方）。畫左右站位時先對這一條。
- 側面圖自己定比例，在元件開頭註解寫清楚（例：`NvzSideView` 1 呎 = 20 單位）。

## 規則

1. **顏色只用 token**：`var(--court)`、`--kitchen`、`--apron`、`--line`、`--ball`、`--ink`、`--muted`、`--ok`、`--fault` 等，不寫死色碼。深色模式會自動換色。
2. **字要夠大**：手機上圖會整張縮小。viewBox 寬 480 到 560 的圖，字用 `class="lab"`（手機自動放大到 18）或 `lab big`。自訂字級時，手機實際顯示要 ≥ 11px，`npm run shoot` 會抓。
3. **不要在圖上寫長句**：圖上只放 2 到 8 個字的標籤，說明寫在圖說。長句在手機上一定會擠到。
4. **一張圖只講一件事**：要講兩件事就分兩列或兩格，上下排（手機上左右並排會太小）。
5. **圖說**：先說是什麼圖（「俯視示意圖」「側面示意圖」），再一兩句講重點。不放規則條號。
6. **合法／失誤**用 `mark="ok/fault"` 或同樣的綠勾、紅叉，全站一致。

## 檢查

```
npm run build
npm run shoot -- <slug> [slug…]
```

會把封面和每張圖截成桌機、手機、手機深色三種，放在 `.tmp/shots/<slug>/`，並列出手機橫向捲動和太小的字。指令沒報錯之後，還是要**自己打開截圖看一次**：字有沒有互相壓到、圖是不是放在讀到那裡剛好需要的位置。
