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
| `SingleServe` | 單打發球位置 | pickleball-scoring、pickleball-singles |
| `RespectX` | 中間球誰接（教練的分工建議） | beginner-mistakes |
| `ServeDots` | 發球的三個點（側面） | beginner-mistakes、pickleball-practice-drills |
| `BallTypes` | 室內球與戶外球 | first-time-pickleball |
| `PaddleRack` | 臨打排球拍 | first-time-pickleball |
| `PaddleShapes` | 三種拍型與甜區 | how-to-choose-paddle |
| `CoreThickness` | 芯材厚度剖面 | how-to-choose-paddle |
| `CourtCompare` | 網球場、羽球場、匹克球場大小疊圖（依比例） | pickleball-vs-tennis-badminton |
| `NetCompare` | 三種運動網子中央高度（依比例） | pickleball-vs-tennis-badminton |
| `PointFlow` | 一分球前三拍與站位：接發方上網、發球方留底線 | how-to-play-pickleball |
| `ServeTypes` | 截擊式發球與落地發球的側面對照 | pickleball-serve |
| `ServeLandings` | 發球落點：擦網落進、中線、底線算好球，非截擊區線失誤 | pickleball-serve |
| `ReturnDepth` | 接發球：站底線後、過網高度、落點深度（側面） | pickleball-serve、pickleball-return-of-serve |
| `CourtLines` | 各條線的名稱（底線、邊線、中線、非截擊區線）與發球區 | pickleball-court-size |
| `NetHeight` | 球網正面：邊線處 91.4、中間 86.4 公分，網柱間距 | pickleball-court-size |
| `CourtClearance` | 球場一角：最小與建議的場外空間 | pickleball-court-size |
| `BadmintonCompare` | 羽球前發球線 vs 非截擊區線、兩種網高 | pickleball-court-size |
| `OutCallTiming` | 2026 喊出界的時機：沒回球要馬上喊、回了球要在對方擊球前喊 | pickleball-rules-2026 |
| `RallyVsSideOut` | 接發球方贏球：傳統計分只換發、每球得分制直接得分 | pickleball-rules-2026 |
| `HistoryTimeline` | 匹克球發展時間軸：1965 發明到 2025 美國人數 | what-is-pickleball |
| `HandleLength` | 短柄與長柄：總長相同，握把越長拍面越短（依比例） | paddle-grip |
| `GripShapes` | 握把橫切面：圓形、方形、八角形 | paddle-grip |
| `PadelCourtCompare` | 板式網球場與匹克球場大小疊圖（依比例，含牆） | pickleball-vs-padel |
| `PadelWall` | 側視：板式網球球先落地可彈牆、匹克球碰圍網算失誤 | pickleball-vs-padel |
| `StepBackDrill` | 側視：從非截擊區一步步退到底線的練習，越往後弧度越高 | pickleball-practice-drills |
| `ShoeCompare` | 鞋子正面剖面：慢跑鞋鞋底外擴 vs 球場鞋側邊加強 | pickleball-shoes |
| `SoleCompare` | 戶外鞋底硬耐磨 vs 室內鞋底軟、不留痕 | pickleball-shoes |
| `TransitionReady` | 側視：發球方往前推進時，準備姿勢跟著位置變（過渡區放低→非截擊區線一般姿勢） | pickleball-doubles-strategy |
| `ForehandMiddle` | 三格半場：兩人右手／一右一左時「正手在中間」有沒有答案 | pickleball-doubles-strategy |
| `TargetLine` | 俯視：被針對時斜線回球 vs 改打直線 | pickleball-doubles-strategy |
| `PaddleBudget` | 三支入門拍的價格長條與芯材厚度剖面（依比例） | paddle-recommendations |
| `ApprovedListName` | 賣場上的品牌名 vs 核可清單上登記的名字（Kuikma → DECATHLON） | paddle-recommendations |
| `DinkContact` | push dink 擊球點：俯視兩腳之間的半圓、側面身體前方 30–45 公分與地面到桌面 | pickleball-dink |
| `DinkTargets` | 網前俯視：對手外側腳、內側腳、中間，1·2 外側 → 3 內側 | pickleball-dink |
| `AttackCheck` | speed up 前三個檢查（離網距離、穩不穩、球的高度）與兩種結果 | pickleball-dink |
| `GripClock` | 握把底端時鐘：大陸式 V 靠上偏左、東方式 V 約 1 點、指節約 3 點 | how-to-hold-paddle |
| `GripPressure` | 握力量尺 1–10：兩位教練的 dink 與擋網截擊參考值 | how-to-hold-paddle |
| `VolleyElbow` | 側視兩格：截擊手肘在前有力 ✓ vs 手腕拱成山 ✗ | pickleball-volley |
| `HighLowDecision` | 側視：擊球點高能往下打就攻，低只能往上就 reset | pickleball-volley |
| `BackhandZone` | 俯視：球拍舉在 11 點時，左側到右髖用反手、右髖外側用正手 | pickleball-backhand |
| `DriveRhythm` | 雙手反手抽球節奏：轉身、停、踏步揮拍；力量後腳→轉體→左手 | pickleball-backhand |
| `RollSpectrum` | 反手 roll volley 光譜：純 roll（肩膀）到純 flick（手腕），球低靠肩膀 | pickleball-backhand |
| `ForehandSequence` | 正手抽球四步驟（直式）：整體轉身、快快慢、蓄力、先踏步再揮拍 | pickleball-forehand-drive |
| `DropArc` | 側面：第三拍 drop 最高點在自己這邊、過網留 2 到 3 呎、落到對手腳邊；對照想擦網而過的虛線 | third-shot-drop |
| `ReturnTime` | 側面對照：接發球低又快來不及上網；高一點、軟一點走得到非截擊區線 | pickleball-return-of-serve |
| `ReturnWind` | 接發球站位看風向：沒風底線後約 3 呎、風往臉上吹往後、風從背後吹往前 | pickleball-return-of-serve |
| `WarmupSteps` | 熱身三步（直式）：讓心跳上來、動態伸展、每一種球都熱過 | pickleball-warm-up |
| `MiniSingles` | 迷你單打兩格：兩人都雙數打斜線、一雙一單打直線；淡色半邊出界、中線延伸過非截擊區 | pickleball-singles |
| `RatingSystems` | 總會看 DUPR（NR、2.000–8.000）vs 協會分級辦法四級 | pickleball-tournaments |
| `BallSpec` | 比賽用球規格：直徑、重量、洞數＋彈跳測試 | pickleball-balls |
| `InjuryBars` | 美國急診資料三組水平長條：60 歲以上診斷、骨折原因與部位、眼傷原因 | pickleball-injuries |
| `WallSetup` | 側面：對牆練習的網高線 86.4 公分、目標框，截擊／dink、reset／drop 站離牆多遠 | pickleball-practice-equipment |
| `MachineSpots` | 俯視：發球機兩種擺位（底線後中間、邊線與非截擊區線交叉角落）與你站哪裡 | pickleball-practice-equipment |
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

## AI 封面

封面情境圖由 `scripts/covers/generate_scenes.py` 在站主電腦產（prompt 在 `scripts/covers/prompts.json`）。AI 畫的人和手常出錯，所以：

1. **只畫靜態構圖**：準備姿勢、站位、器材靜物。不畫擊球瞬間、動態模糊、畫出來的球路線、文字、商標。
2. **prompt 寫死約束**：每人只拿一支球拍、球是有洞的匹克球、雙手握在同一支拍上、網子和兩隊的位置。
3. **一次產 3 張挑一張**：golfer-tw 的經驗是三張常有兩張不能用。
4. **逐張放大看**：手指數量、哪隻手握拍、是不是真的握住；左右腳和面向；球拍和球的數量；網子位置、隊友在同一邊；有沒有文字、商標、網球。
5. **驗不過就重產**，不要用圖說去解釋一張畫錯的圖。
6. **人體動作的圖解先不做**：握法、手腕角度這類要畫人體才講得清楚的，AI 會畫錯、SVG 也容易誤導。用文字加影片時間點（`VideoEmbed`）。

## 檢查

```
npm run build
npm run shoot -- <slug> [slug…]
```

會把封面和每張圖截成桌機、手機、手機深色三種，放在 `.tmp/shots/<slug>/`，並列出手機橫向捲動和太小的字。指令沒報錯之後，還是要**自己打開截圖看一次**：字有沒有互相壓到、圖是不是放在讀到那裡剛好需要的位置。
