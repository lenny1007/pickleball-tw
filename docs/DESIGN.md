# 設計方向

球場就是地圖。首頁用一張直式的匹克球場俯視圖當導覽，點區域進到該區的技術卡（後場＝打法戰術、非截擊區＝小球與網前、發球區＝發球計分）。直式剛好跟手機同方向。

## Token（`src/styles/global.css`）
| token | 淺色 | 用途 |
|---|---|---|
| `--paper` | #EDF2F3 | 冷灰底，像水泥場邊 |
| `--ink` | #14293A | 深藍字色 |
| `--court` | #2D6E8E | 硬地球場藍 |
| `--kitchen` | #4F97B4 | 非截擊區淺藍 |
| `--apron` | #6E9A6A | 場外綠 |
| `--ball` | #D9E244 | 黃綠球色，只當點綴與 focus 外框，不當文字色 |

字體：標題 Huninn（圓體，Google Fonts），內文用系統黑體（PingFang TC／微軟正黑體），不載入 Noto Sans TC 以省流量。

## 與 badminton-tw 的區隔
badminton-tw：深綠＋羽球黃、Noto Sans TC／Space Grotesk、Tailwind。本站：球場藍＋黃綠、圓體、純 CSS token，不用 Tailwind。

## 原則
- 大膽只用在球場圖一處，其他區塊用排版和留白處理。
- 卡片外框只給知識卡（各自是獨立物件、有來源），規則問答用清單、球拍用規格表。
- 動畫只有球落地一次，尊重 reduced-motion。

## 圖解與封面（`src/components/fig/`）
- 全站圖片都用同一套「球場俯視」語言畫成 SVG，不用 AI 產圖、不用照片：顏色只用 token，深色模式自動跟著換。
- 球場底圖 `Court.astro`：橫式，1 呎 = 10 單位，網在 x=220。球員記號：深色實心＝我方、白色空心＝對方；黃綠虛線＝球路，圓環＝落地點；綠勾／紅叉＝合法／失誤。
- 規則圖：`CourtDimensions`、`ServeDiagram`、`TwoBounce`、`NvzCases`。裝備圖：`PaddleShapes`、`CoreThickness`、`BallTypes`。入門：`PaddleRack`。
- 文章封面 `ArticleCover`：依 slug 選一個球場畫面，文章頁頂與文章列表縮圖共用。新文章沒對到時用球場角落當預設。
- 知識卡的 `ZoneMark`：小直式球場標出卡片所在區域。
- 圖說寫成一句完整的話；裝備圖標「示意」。圖裡的數字（尺寸、網高）要跟文章、規則條文一致。
