// 課程內容資料結構定義
// 所有中文欄位一律使用繁體中文（台灣用語）

export interface VocabItem {
  word: string;        // 英文單字或片語，例如 "medium rare"
  ipa?: string;        // KK/IPA 音標，可省略
  zh: string;          // 繁中意思，例如「五分熟」
  example: string;     // 英文例句
  exampleZh: string;   // 例句繁中翻譯
}

export interface DialogueLine {
  speaker: string;     // 說話者，例如 "Server" / "You"
  en: string;          // 英文台詞（用自然口語，包含縮讀如 gonna）
  zh: string;          // 繁中翻譯
  note?: string;       // 繁中解說：為什麼這樣說、語氣、替代講法、文化眉角
}

export interface Dialogue {
  title: string;       // 英文標題
  titleZh: string;     // 繁中標題
  scene: string;       // 繁中情境描述（一兩句）
  lines: DialogueLine[];
}

export interface Phrase {
  en: string;          // 句型或接話模板，例如 "How's your ___ going?"
  zh: string;          // 繁中意思
  usage: string;       // 繁中使用時機與注意事項
}

export interface QuizQuestion {
  question: string;    // 題目（情境用繁中描述、選項考英文，或反之）
  options: string[];   // 4 個選項
  answer: number;      // 正確選項 index（0-3）
  explanation: string; // 繁中詳解
}

export interface CultureNote {
  title: string;       // 繁中標題
  body: string;        // 繁中內容，可含英文例句
}

export interface ListenForItem {
  en: string;          // 影片中會聽到／該注意的英文句子或用法
  zh: string;          // 繁中解說
}

export interface VideoRef {
  youtubeId: string;   // YouTube 影片 ID（11 碼），必須是真實存在、已驗證的影片
  title: string;       // 影片標題
  channel: string;     // 頻道名稱
  year?: number;       // 發布年份（2000 年後）
  duration?: string;   // 長度，例如 "4:12"
  whyWatch: string;    // 繁中：為什麼推薦看這部
  listenFor: ListenForItem[]; // 觀看重點（3-6 個）
}

export type UnitCategory = '飲食' | '交通' | '社交' | '購物' | '旅行' | '生活';

export interface Unit {
  id: string;          // kebab-case，例如 "ordering-restaurant"
  emoji: string;       // 代表 emoji
  title: string;       // 英文標題
  titleZh: string;     // 繁中標題
  tagline: string;     // 繁中一句話描述學完能做什麼
  category: UnitCategory;
  dialogues: Dialogue[];      // 至少 2 段
  vocab: VocabItem[];         // 至少 24 個
  phrases: Phrase[];          // 至少 10 個（含接話句型）
  quiz: QuizQuestion[];       // 8 題
  culture: CultureNote[];     // 2-3 則
  videos: VideoRef[];         // 由 videos.ts 合併，單元檔內留空陣列
}
