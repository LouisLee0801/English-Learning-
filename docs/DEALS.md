# 優惠雷達（deals/）

掃描全網現行優惠券與優惠活動，依藥妝美妝、運動戶外、餐飲美食等分類；結帳前再比 LINE購物、長榮 Mileage Mall、國泰 Milesback 哪個回饋最高。

- 網址（合併到 `main` 後）：`https://<帳號>.github.io/English-Learning-/deals/`
- 資料：`deals/data/*.json`，由 GitHub Actions（`.github/workflows/deals.yml`）自動更新：每天台北時間 06:17 全部來源；12:47、18:47、00:47 再更新 PTT 與新聞

## 功能

| 頁面 | 用途 |
|---|---|
| 優惠券（首頁） | 全網掃到的優惠券與優惠活動。上方分類列（藥妝美妝、運動戶外、餐飲美食、外送、超商量販、百貨商場…）附筆數；可搜尋、依來源／狀態／類型／低消篩選，依最新、即將到期、折扣排序。品牌在三個回饋平台有回饋時，卡片會提示「結帳前先走」哪個平台 |
| 回饋平台 | LINE購物、長榮、國泰各商店的回饋率、加碼期間與條件 |
| 品牌比較 | 同一品牌在三個平台的回饋並排，黃底標出最划算的平台；哩程依「1 哩價值」換算成等值 % |
| 我的券夾 | 手動記錄信用卡、App、會員信箱收到的券（只存在本機瀏覽器），可匯出／匯入 JSON |
| 資料狀態 | 各來源最後成功時間、筆數、錯誤訊息 |

## 資料來源與抓法

### 全網優惠券／優惠情報

| 來源 | 內容 | 方式 |
|---|---|---|
| Google 新聞 | 近 7 天優惠報導，依分類下 19 組關鍵字（藥妝、運動、速食、咖啡、超商、外送、3C、服飾、旅遊、信用卡…）；過濾香港／中國與非優惠新聞 | 公開 RSS |
| PTT 省錢板（Lifeismoney） | 網友情報標題、發文時間、內文開頭、推文數 | 官方 Atom 訂閱源；舊頁有 Cloudflare 驗證，因此每次累積 7 天內文章 |
| 食尚玩家優惠券 | 餐飲、旅遊等店家券：省多少、領券期間、店家、分類 | 公開 API |
| 康是美 | 官網最新活動（滿額送點、刷卡禮、會員優惠） | 官網頁面 |
| 7-ELEVEN | 首頁看板、精品集點活動 | 官網頁面 |
| 漢堡王 | 官網線上點餐「優惠券」分類（買一送一、自由配） | 官網頁面 |

期限：有寫活動期間的照寫；論壇與新聞沒寫期限的，以發文日 + 7 天暫定並標「期限見原文」。

試過但被網站擋下（Cloudflare／Akamai）而未納入：Dcard 省錢板、UPTOGO、cashfeel、麥當勞、全家、屈臣氏官網（相關優惠仍會透過新聞與 PTT 出現）。

### 回饋平台

| 來源 | 抓取內容 | 方式 |
|---|---|---|
| LINE購物 | 優惠商店清單、回饋 %、加碼期間、單品回饋上限、點數發放時間、注意事項、折價券、賺點任務（滿額送點、新客限定、截止日） | 在 buy.line.me 頁面內呼叫其 GraphQL API |
| 長榮 Mileage Mall（mall.brmile.com） | 台灣版所有商戶、每 NT$100 哩數、促銷前後哩數、加碼有效期、分品類回饋、購買細則、入帳天數、優惠券（含代碼） | 伺服器端 HTML |
| 國泰 Milesback（shop.asiamiles.com） | 同上（`countryID=200` 台灣版）；優惠券內容需登入，只列商戶與到期日 | 伺服器端 HTML |

- 外幣計價的哩程依當日匯率（open.er-api.com）換算成「每 NT$100 得幾哩」；抓不到時改用備援匯率
- 平台清單上沒標示回饋的商戶（多為暫停中）不列入
- 某來源失敗或筆數驟降（疑似對方改版）時保留上一次成功的資料，`meta.json` 標記錯誤；自己改了 adapter 輸出時把該 adapter 的 `version` 加 1，就不會被誤判
- 請求有併發上限與間隔，只讀公開頁面，不登入

## 資料格式

每個 `deals/data/<source>.json` 為 `{ source, deals: Deal[] }`：

```jsonc
{
  "id": "line:4321335",            // 來源內唯一
  "kind": "rebate",                // rebate 回饋｜coupon 折價券｜promo 活動
  "source": "line",                // line｜eva｜cathay｜news｜ptt｜supertaste｜cosmed｜seven｜burgerking｜manual
  "merchant": "PChome 24h購物",
  "category": "綜合電商",            // 統一分類，見 deals/js/categories.js
  "title": "LINE POINTS 1% 回饋",
  "reward": { "type": "percent", "value": 1, "text": "1%" },
  // type：percent 回饋%｜miles 每 NT$100 哩數｜amount 折抵元｜percent_off 折扣%｜shipping 免運｜gift 其他
  "boost": { "type": "percent", "value": 8, "startAt": "2026-10-10", "endAt": "2026-10-20" }, // 加碼，可為 null
  "code": null,                    // 折扣碼
  "minSpend": null,                // 低消（元）
  "conditions": ["單一商品最高回饋 100 點", "..."],
  "tags": ["新客限定"],
  "startAt": null, "endAt": null,  // YYYY-MM-DD（台灣日期），null 表示長期
  "url": "https://buy.line.me/u/partner/4321335"
}
```

## 手動加精選優惠

編輯 `deals/data/manual.json` 的 `deals` 陣列，`source` 填 `manual`，格式同上。合併後網站即生效；過期的券會自動隱藏（篩選「全部（含過期）」才看得到）。

## 指令

```bash
npm test                                   # 單元測試（含解析器）
npm install --no-save playwright@1.56.1    # 本機爬取需要
npx playwright install chromium
node scripts/deals/scrape.mjs              # 全部來源；可指定 line / eva / cathay
node scripts/deals/discover.mjs            # 版面改了時用：存頁面與 API 快照到 deals/raw/ 方便改解析器
```

Actions 頁面可手動執行「Deals scrape」，勾選 discover 會一併存快照。

## 分類

`deals/js/categories.js` 定義 18 個分類與判斷規則，爬蟲與網站共用：來源自帶分類 → 品牌字典（例：屈臣氏→藥妝美妝、Nike→運動戶外、全家→超商量販）→ 標題／內文關鍵字計分 →「其他」。分錯時在品牌字典或關鍵字補一筆即可。

## 新增來源

1. 在 `scripts/deals/adapters/` 匯出 `{ scrape({ context, fx, today, now, prev, log }) → Deal[], minCount, note }`（全網優惠類放 `coupon-sources.mjs`，會自動登記）
2. 回饋平台類在 `scripts/deals/scrape.mjs` 的 `ADAPTERS` 登記
3. 在 `deals/js/core.js` 的 `SOURCES` 加名稱，`deals/css/deals.css` 加 `.src-<name>` 顏色（回饋平台另在 `deals/js/app.js` 的 `SOURCE_ICONS` 加圖示，顏色要和既有平台明顯不同）
4. 解析邏輯寫成純函式放 `scripts/deals/lib/`（全網優惠類在 `coupons.mjs`），在 `tests/deals-scrape.test.js` 用真實頁面片段測試
