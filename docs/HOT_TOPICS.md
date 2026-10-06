# Hot Topics：每週熱門話題撰寫規範

每週新增一個檔案 `js/data/trending/YYYY-Www.js`（ISO 週次，以「下週一」所在週命名），收錄 5 堂課，讓學習者能跟 20–40 歲的美國人聊當週正在發生的話題。

## 排課規則（程式已實作，見 `js/plan.js`）

- 核心 20 堂課進行中：**週二、週四**上熱門話題，其他平日上核心課
- 核心課全部完成後：平日都上熱門話題
- 只會排入**發布後 21 天內**的熱門課，順序是新的週次優先、同一週依課次排；過期的課仍可在課程地圖自由練習
- `publishedAt` 設為該週的週一（YYYY-MM-DD），在那天之前不會出現在課表

## 題材

`topic` 必須是以下之一（定義在 `js/data/lessons.js` 的 `TOPICS`）：

| key | 題材 | key | 題材 |
|---|---|---|---|
| `sports` | 比賽（MLB、NFL、NBA、F1、世界盃等） | `cars` | 汽車 |
| `wine` | 紅酒 | `travel` | 旅行 |
| `golf` | 高爾夫 | `tech` | 科技 |
| `muaythai` | 泰拳／格鬥 | `investing` | 投資 |
| `music` | 熱門歌曲 | `pop` | 流行文化、網路梗、影集 |

**輪替**：每週 5 堂課要涵蓋 5 個不同 topic。優先選前兩週沒出現過的 topic，確保 9 大題材每 2 週左右輪完一次；當週若有大事件（冠軍賽、大型發表會、爆紅的梗），可以優先排入。

## 找題材：Reddit 熱門討論

Reddit 是美國 20–40 歲族群最集中的討論區，用來找「大家正在聊什麼、用什麼梗」。

抓取方式：用 **RSS**（雲端主機呼叫 `.json` 會被 Reddit 擋，回 403），且要帶瀏覽器 User-Agent，並設定重試，因為偶爾會回 429：

```bash
curl -s --retry 3 --retry-delay 8 --retry-all-errors \
  -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36" \
  "https://www.reddit.com/r/<sub>/top/.rss?t=week" | grep -o "<title>[^<]*</title>"
```

每個 subreddit 之間間隔幾秒，避免被限流。

| 題材 | 建議 subreddit |
|---|---|
| 綜合、梗 | r/popular、r/OutOfTheLoop、r/popculturechat、r/television |
| 比賽 | r/sports、r/nfl、r/baseball、r/nba、r/formula1 |
| 紅酒 | r/wine |
| 高爾夫 | r/golf |
| 泰拳 | r/MuayThai、r/MMA |
| 音樂 | r/popheads、r/Music |
| 汽車 | r/cars、r/electricvehicles |
| 旅行 | r/travel、r/TravelHacks |
| 科技 | r/technology、r/gadgets |
| 投資 | r/investing、r/stocks、r/personalfinance |

- Reddit 只用來**挑題材、抓語氣與流行語**；事實細節一律再用可信來源查證（見下節）
- 可以把 Reddit 討論串放進 `sources`，標題寫明「Reddit r/xxx 討論」，但每課至少還要 1 個非 Reddit 的可信來源
- 不要直接照抄網友留言；改寫成自然的對話
- 如果 Reddit 連不上，改搜尋報導 Reddit 熱門話題的新聞，或直接用其他來源，並在 PR 說明

## 事實查核（最重要）

1. 每個時事細節（賽事、日期、排行榜、新聞）都必須用網路搜尋確認，且至少有 1 個可信來源：大型媒體、官方網站、產業媒體。不要用內容農場、預測市場頁面，或 AI 生成的彙整頁當來源
2. 找不到可靠來源的細節就不要寫進台詞。改寫成「個人經驗、意見」式對話，例如 *My team got knocked out early*，而不是斷言某隊戰績
3. 每堂課 `sources` 至少 1 筆 `[中文標題, https 網址]`
4. 不要引用歌詞或劇本台詞（著作權），只能提歌名、歌手、劇名
5. 投資課不得給具體買賣建議，可以加 *Not financial advice*

## 語言風格

- 美式口語，20–40 歲上班族、朋友之間的語氣；適度使用流行語（例如 *hits different*、*I'm in my ___ era*），並在 `phrases` 解釋
- 每堂課：10–12 句對話、至少 4 句 `You`、6–9 個片語、2 個美式發音重點、1 則 Insider Tip、1 份作業
- 中文用台灣用語（專案、行銷、數據、影集…）
- `cast` 列出所有非 You 的角色與性別（`'f'` / `'m'`），名字不要和核心課重複使用 Marcus、Olivia、Ethan

## 檔案格式

```js
export default {
  id: '2026-W42',
  publishedAt: '2026-10-12',
  title: 'Hot Topics · Oct 12–16',
  lessons: [
    {
      id: 'h2026w42-1',            // h + 年 + w + 週次 + - + 序號，全站唯一
      topic: 'music',
      title: 'English title',
      titleZh: '中文標題',
      location: 'City · 場景',
      scene: '情境描述（中文）',
      goal: '學習目標（中文）',
      cast: { Sam: 'm' },
      lines: [['Sam', 'English', '中文'], ['You', 'English', '中文']],
      phrases: [['English', '中文', '用法筆記']],
      accent: [['word', 'SOUND-out', '說明']],
      tip: '在地文化小知識',
      homework: '作業',
      sources: [['來源標題', 'https://...']],
    },
  ],
};
```

接著在 `js/data/trending/index.js` 加上 import，並把新週次加進 `TRENDING_WEEKS` 陣列。

## 驗收

```bash
npm test   # 會檢查 id 唯一、topic 合法、sources、句數、角色等
```
