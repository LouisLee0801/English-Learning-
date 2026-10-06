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
