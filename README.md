# 生活英語生存包 🇺🇸 English Survival Kit

給台灣人的「國外日常生活英文」學習網站。目標不是商業英文，而是**真的能在國外生存**：
點餐、叫車、超市採買、small talk 接話、聽懂俚語、看醫生、處理緊急狀況。

## 功能

- **16 個生活主題單元**，涵蓋飲食、交通、社交、購物、旅行、生活六大類
- 每單元包含：
  - 📖 情境對話（自然美式口語＋繁中逐句解說，解釋語氣與文化眉角）
  - 🃏 單字卡（翻牌練習＋列表模式，進度存在瀏覽器）
  - 💬 句型模板（怎麼開口、怎麼接話、怎麼委婉拒絕）
  - 🎬 精選 YouTube 真實影片（3–8 分鐘、2000 年後發布），附「觀看重點」中文解說
  - ✏️ 情境反應測驗（8 題，70 分以上標記單元完成）
  - 💡 文化小知識（小費、禁忌話題等）
- **🤖 AI 對話陪練**（選配）：AI 扮演服務生、Uber 司機、派對陌生人陪你實戰對話，
  並用中文講評你的說法自不自然。需自備 [Anthropic API key](https://console.anthropic.com/)，
  key 只存在你自己的瀏覽器 localStorage。

## 開發

```bash
npm install
npm run dev      # 開發伺服器
npm run build    # 產出靜態網站到 dist/
```

純前端靜態網站（Vite + React + TypeScript），無後端。可直接部署到 GitHub Pages、Vercel、
Netlify 等任何靜態網站服務。

## 專案結構

- `src/data/units/*.ts` — 各單元課程內容（格式規範見 `docs/CONTENT_SPEC.md`）
- `src/data/videos.ts` — 各單元精選影片（YouTube ID 均經過 oEmbed 驗證）
- `src/components/` — 頁面元件
- `src/lib/progress.ts` — 學習進度（localStorage）
- `src/lib/ai.ts` — AI 陪練模組（Claude API）
