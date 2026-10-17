# 團購雷達（groupbuy/）

自動整理 Instagram、Threads、Facebook 與團媽網站「正在開團」的商品、開團／結單時間，依育兒、家電、服飾、家居等 13 類分類，支援關鍵字搜尋。

- 網址（合併到 `main` 後）：`https://<帳號>.github.io/English-Learning-/groupbuy/`
- 資料：`groupbuy/data/*.json`，由 GitHub Actions（`.github/workflows/groupbuy.yml`）每 2 小時自動更新

## 功能

| 頁面 | 用途 |
|---|---|
| 團購（首頁） | 搜尋框（商品、品牌、團主、分類都能搜，「衣服」「育兒」會對到分類）；分類列附筆數；依平台、狀態（開團中／48 小時內結單／即將開團）、有結單日、有標價篩選；依即將結單、最新發文、開團時間、價格排序。卡片可收藏、「📅 提醒」一鍵加到 Google 日曆（結單前 1 小時） |
| 結單時間軸 | 今天、明天、之後 14 天逐日列出要結單的團，再列即將開團、沒寫結單日的團 |
| 我的團購 | 收藏的團；把 FB 社團、LINE 社群看到的開團文整段貼上，自動抓商品、價格、時間、分類，確認後存在本機（可匯出／匯入） |
| 來源與追蹤 | 各來源最後成功時間、筆數、錯誤；目前追蹤的帳號、網站與關鍵字 |

## 資料來源與限制

| 來源 | 抓法 | 限制 |
|---|---|---|
| Threads 搜尋 | 未登入的公開搜尋頁（資料在頁面內嵌 JSON） | 每台機器每次只能搜 1 個關鍵字，之後回「查無結果」；每次排程輪替 `keywords.threads` |
| Threads 追蹤帳號 | 團主個人頁最新貼文 | 未登入時每頁約 4 篇；門檻放寬（追蹤的團主大多是開團文） |
| IG／FB／Threads（搜尋引擎） | DuckDuckGo 近一週索引（`site:instagram.com 開團 結單` 這類查詢），從標題與摘要解析帳號、日期、內文 | 連查 2 次就回 202，每次排程輪替 2 組 `keywords.search`；摘要約 300 字 |
| 團媽網站 | `watchlist.json` 的 `pages`，每次整頁重抓：餅皮媽團團Buy、主夫尼克團購（約 90 檔）、倩兒☓魯蛋 Adrianne Life 團購預告（約 40 檔，含未來兩個月排程） | 抓失敗時沿用上次資料 |
| Instagram 官方 API（選用） | Business Discovery：`watchlist.json` 的 IG 帳號最新 12 篇 | 需設定 Secrets，見下方 |
| Threads 官方 API（選用） | `keyword_search`，每次 5 組關鍵字 | 需設定 Secrets；未通過 `threads_keyword_search` 審核前只能搜自己的貼文 |
| 精選 | `groupbuy/data/manual.json` 手動維護 | — |

試過但不納入：IG 標籤頁與個人頁（未登入一律導到登入頁、API 回 429）、FB 主題標籤與粉專（登入牆）、PTT 合購板（2021 年起唯讀停用）、愛合購（Cloudflare 封鎖）、痞客邦站內搜尋（網址已失效）、Bing RSS（中文查詢結果錯亂）。

團媽網站另外評估過：七先生與艾小姐（整理頁多為已結團商品）、依娃的團購行事曆與維媽育兒年度預告（只有團名、沒有開團或結團日期，無法判斷還在不在開）、rubeelittle（6 月後未更新）、KiKi媽咪（首頁是文章列表，不是清單）、大V生活與寶寶溫旅行（Cloudflare 封鎖）。

- 社群來源每次只看得到一小段，結果會**累積**：有結單日的留到結單隔天，只有開團日的留 14 天，都沒寫的發文後留 10 天
- 只讀公開頁面、不登入、請求之間有間隔；不轉存圖片，點「看原文」回到團主頁面
- Meta 的使用條款限制自動化收集資料；本工具只在未登入狀態低頻讀取公開頁面供個人查詢。要長期穩定使用，建議改走下方官方 API

## 追蹤清單：`groupbuy/data/watchlist.json`

在 GitHub 網頁直接編輯、Commit 到 `main`，排程會自動重抓：

```jsonc
{
  "threads": ["團主帳號", "@也可以加小老鼠", "https://www.threads.com/@或貼網址"],
  "instagram": ["ig帳號"],          // 需官方 API 才會抓
  "pages": [{ "name": "餅皮媽團團Buy", "url": "https://site-4031271-2277-6785.mystrikingly.com/" }],
  "keywords": {
    "threads": ["開團", "限時開團", "開團啦", "收單"],      // 每次輪替 1 個
    "search": ["site:instagram.com 開團 結單", "..."]     // 每次輪替 2 組
  }
}
```

想多抓某一類（例：育兒），在 `keywords.search` 加 `site:instagram.com 開團 嬰兒`、`site:instagram.com 開團 童裝` 這類組合即可。

## 官方 API（選用，資料更完整穩定）

在 repo **Settings → Secrets and variables → Actions** 新增：

| Secret | 用途 | 取得方式 |
|---|---|---|
| `THREADS_ACCESS_TOKEN` | Threads 關鍵字搜尋（每天上限 2,200 次） | developers.facebook.com 建立 App → 加入 Threads API 使用案例 → 權限 `threads_basic`、`threads_keyword_search`（搜別人的貼文需通過審核）→ 產生長效 token（60 天，需定期更新） |
| `IG_ACCESS_TOKEN`、`IG_USER_ID` | Instagram Business Discovery，讀 `watchlist.json` 裡 IG 團主的最新貼文 | 自己的 IG 專業帳號連結 FB 粉專 → Graph API Explorer 取得含 `instagram_basic`、`pages_show_list` 的長效 token → 查 `me/accounts?fields=instagram_business_account` 得到 IG_USER_ID |

可另外在 Variables 設 `GRAPH_API_VERSION`（預設 `v23.0`）。這兩個 adapter 尚未用真實 token 驗證，第一次設定後請到「來源與追蹤」頁確認狀態。

## 資料格式

每個 `groupbuy/data/<來源>.json` 為 `{ source, items: Item[] }`：

```jsonc
{
  "id": "instagram:DedSWBMvJ4g",       // 來源內唯一；預告文一篇拆多筆時加 #1、#2
  "source": "search",                  // threads｜search｜pages｜instagram｜manual
  "platform": "Instagram",             // Instagram｜Threads｜Facebook｜團媽網站｜精選
  "via": "search",                     // search 搜尋｜watch 追蹤｜api 官方 API
  "author": "littlesixmom", "authorName": "初六媽", "authorUrl": "https://www.instagram.com/littlesixmom/",
  "product": "山水 Sansui 輕淨吸無線吸塵器",
  "brand": "Sansui",
  "category": "家電",                   // 見 groupbuy/js/categories.js
  "price": 1280, "originalPrice": 2000, "priceText": "團購價 $1,280",
  "openAt": "2026-10-13", "closeAt": "2026-10-22 23:59",   // 台灣時間；只有日期表示全天
  "timeText": "10/13～10/22",            // 原文時間片段
  "orderUrl": "https://…", "url": "https://www.instagram.com/reel/DedSWBMvJ4g/",
  "tags": ["免運"], "excerpt": "貼文摘要…",
  "postedAt": "2026-10-13T04:00:00.000Z", "firstSeenAt": "…", "expireAt": "2026-10-23"
}
```

手動精選：編輯 `groupbuy/data/manual.json` 的 `items`，`source` 填 `manual`、`platform` 填 `精選`，至少要有 `id`、`product`、`url`。

## 解析規則（`groupbuy/js/parse.js`，網站「貼上開團文」也用同一套）

- **開團文判斷**：「開團啦／限時開團／團購價／收單／結單／下單連結／價格」加分；找廠商、找團品、抱怨、香港（廣東話、港幣）、中國（簡體字）貼文扣分
- **時間**：`10/20(一) 20:00 ~ 10/26(日) 23:59`、`10.20-10.26`、`2026/10/20~11/02`、`10/13~19`、`即日起至10/31`、`10/23收單`、`今晚8點開團`、`限時3天`、`這週日結單`、`下週三開團`、`12/28-1/3`（跨年）；出貨日、規格（23.5cm）不算
- **商品名**：「品名：」優先；否則把標題與前幾行切成子句，挑品牌、商品關鍵字最多、含「開團」字樣的一句，去掉表情、價格、日期與贅字
- **預告文**：三行以上「日期＋商品」（或兩行以上且有「預告／行事曆」）拆成多筆
- **團媽網站清單**：認得「🌟商品(10/31收單)＋🛒搶購網址」「10/23止！商品＋►跟團去／⭕圖文心得」「商品名（超連結）＋下一行 10/25結團」三種寫法；「跟團去／搶購」當下單連結、「心得／介紹」當文章連結；版規、客服、私訊說明不收；同頁總覽和詳細介紹重複的只收一次
- **分類**：品牌字典 6 分＋關鍵字依長度 1～4 分，標題加倍，同一段文字以最長的字為準；分錯時在 `categories.js` 的 `BRANDS`／`KEYWORDS` 補一筆

## 指令

```bash
npm test                                   # 單元測試（含真實頁面片段）
npm install --no-save playwright@1.56.1    # 本機爬取需要
npx playwright install chromium
node scripts/groupbuy/scrape.mjs           # 全部來源；可指定 threads / search / pages / instagram
node scripts/groupbuy/discover.mjs         # 探勘新來源：存頁面快照到 groupbuy/raw/
```

Actions 頁面可手動執行「Group-buy scrape」；commit 訊息含 `[discover:項目1,項目2]` 時只做探勘。
