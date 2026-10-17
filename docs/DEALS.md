# 優惠雷達（deals/）

一頁查詢 LINE購物、長榮 Mileage Mall、國泰 Milesback 的品牌回饋，以及現行優惠券的條件與期限。

- 網址（合併到 `main` 後）：`https://<帳號>.github.io/English-Learning-/deals/`
- 資料：`deals/data/*.json`，由 GitHub Actions（`.github/workflows/deals.yml`）每天台北時間 06:17 自動更新

## 功能

| 頁面 | 用途 |
|---|---|
| 全部優惠 | 搜尋品牌／條件／折扣碼；依來源、狀態（進行中、7 天內到期、尚未開始）、分類、類型、回饋形式、只看加碼、有折扣碼、排除新客限定、低消上限篩選；依回饋、到期日、品牌、更新時間排序。篩選條件會寫進網址，可直接分享 |
| 品牌比較 | 同一品牌在三個平台的回饋並排，黃底標出最划算的平台；哩程依「1 哩價值」換算成等值 % |
| 我的券夾 | 手動記錄信用卡、App、會員信箱收到的券（只存在本機瀏覽器），可匯出／匯入 JSON |
| 資料狀態 | 各來源最後成功時間、筆數、錯誤訊息 |

## 資料來源與抓法

| 來源 | 抓取內容 | 方式 |
|---|---|---|
| LINE購物 | 優惠商店清單、回饋 %、加碼期間、單品回饋上限、點數發放時間、注意事項、折價券、賺點任務（滿額送點、新客限定、截止日） | 在 buy.line.me 頁面內呼叫其 GraphQL API |
| 長榮 Mileage Mall（mall.brmile.com） | 台灣版所有商戶、每 NT$100 哩數、促銷前後哩數、加碼有效期、分品類回饋、購買細則、入帳天數、優惠券（含代碼） | 伺服器端 HTML |
| 國泰 Milesback（shop.asiamiles.com） | 同上（`countryID=200` 台灣版）；優惠券內容需登入，只列商戶與到期日 | 伺服器端 HTML |

- 外幣計價的哩程依臺灣銀行即期賣出匯率換算成「每 NT$100 得幾哩」；抓不到時改用備援匯率
- 某來源失敗或筆數驟降（疑似改版）時保留上一次成功的資料，`meta.json` 標記錯誤
- 請求有併發上限與間隔，只讀公開頁面，不登入

## 資料格式

每個 `deals/data/<source>.json` 為 `{ source, deals: Deal[] }`：

```jsonc
{
  "id": "line:4321335",            // 來源內唯一
  "kind": "rebate",                // rebate 回饋｜coupon 折價券｜promo 活動
  "source": "line",                // line｜eva｜cathay｜manual
  "merchant": "PChome 24h購物",
  "category": "綜合電商",
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

## 新增來源

1. `scripts/deals/adapters/<name>.mjs` 匯出 `{ scrape({ context, fx, today, now, log }) → Deal[], minCount }`
2. 在 `scripts/deals/scrape.mjs` 的 `ADAPTERS` 與 `FILES` 登記
3. 在 `deals/js/core.js` 的 `SOURCES` 加名稱，`deals/css/deals.css` 加 `.src-<name>` 顏色
4. 解析邏輯寫成純函式放 `scripts/deals/lib/`，在 `tests/deals-scrape.test.js` 用真實頁面片段測試
