// AI 對話陪練：使用者自備 Anthropic API key（存在瀏覽器 localStorage），
// 直接從瀏覽器呼叫 Claude API。沒有 key 時模組顯示啟用說明。
import Anthropic from '@anthropic-ai/sdk';

const KEY_STORAGE = 'english-survival-anthropic-key';

export function getApiKey(): string {
  return localStorage.getItem(KEY_STORAGE) ?? '';
}

export function setApiKey(key: string) {
  if (key) localStorage.setItem(KEY_STORAGE, key.trim());
  else localStorage.removeItem(KEY_STORAGE);
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Scenario {
  id: string;
  emoji: string;
  titleZh: string;
  description: string;   // 繁中：情境說明
  aiRole: string;        // AI 扮演的角色（英文描述，給 system prompt 用）
  opening: string;       // AI 的開場白（英文）
}

export const scenarios: Scenario[] = [
  {
    id: 'restaurant',
    emoji: '🍽️',
    titleZh: '餐廳點餐',
    description: '你走進一間美式餐廳，AI 是服務生。從入座到結帳，全程用英文完成點餐。',
    aiRole: 'a friendly server at a casual American restaurant. Greet them, seat them, take their order, handle any special requests, and bring the check at the end.',
    opening: "Hi there! Welcome in. Just the one of you today, or are you expecting someone?",
  },
  {
    id: 'uber',
    emoji: '🚕',
    titleZh: '搭 Uber 聊天',
    description: 'AI 是健談的 Uber 司機，會跟你 small talk。練習接話、聊天氣、聊旅遊。',
    aiRole: "a chatty Uber driver in Los Angeles. Confirm their name, make small talk about weather, traffic, where they're from, and what they're doing in town.",
    opening: "Hey, hop on in! You're... Kevin, right? Heading downtown?",
  },
  {
    id: 'cafe',
    emoji: '☕',
    titleZh: '咖啡店點飲料',
    description: 'AI 是咖啡店店員，尖峰時段語速快。練習客製化點飲料、回答連珠炮問題。',
    aiRole: "a barista at a busy coffee shop. Take their drink order quickly, ask about size, milk, and whether it's for here or to go. Speak casually and a bit fast, like a real barista during rush hour.",
    opening: "Hi, what can I get started for you?",
  },
  {
    id: 'party',
    emoji: '🎉',
    titleZh: '派對搭話',
    description: '你在朋友的派對上誰都不認識，AI 是另一個客人。練習自我介紹與延續話題。',
    aiRole: "a friendly guest at a house party who doesn't know them. Introduce yourself, ask how they know the host, and keep natural small talk going about work, hobbies, and weekend plans.",
    opening: "Hey! I don't think we've met — I'm Jamie. How do you know Sarah?",
  },
  {
    id: 'shopping',
    emoji: '🛍️',
    titleZh: '逛街與退貨',
    description: 'AI 是服飾店店員。練習找尺寸、試穿、以及禮貌地退換貨。',
    aiRole: "a sales associate at a clothing store. Greet them, offer help finding sizes, handle a fitting room request, and process a return politely if they ask.",
    opening: "Hi, welcome in! Let me know if I can help you find anything.",
  },
  {
    id: 'hotel',
    emoji: '🏨',
    titleZh: '旅館入住',
    description: 'AI 是旅館櫃檯人員。練習 check-in、詢問設施、反映房間問題。',
    aiRole: "a hotel front desk agent. Check them in, explain breakfast and wifi, take a deposit, and handle any room complaints professionally.",
    opening: "Good evening! Checking in with us tonight? Can I get the name on the reservation?",
  },
];

function buildSystemPrompt(scenario: Scenario): string {
  return `You are helping a Taiwanese learner practice everyday spoken American English through roleplay.

You play: ${scenario.aiRole}

Rules:
- Stay in character and speak natural, casual American English (contractions, filler words, realistic pacing). Keep each turn to 1-3 sentences, like real conversation.
- After your in-character line, add a coaching note in Traditional Chinese (Taiwan) inside 【教練】...】 ONLY when the learner's previous message had an unnatural phrasing, a grammar slip that matters, or a much more natural alternative. Keep the note to 1-2 short sentences with the better phrasing. If their English was fine, skip the note entirely.
- If the learner writes in Chinese or says they're stuck, briefly suggest in Chinese what they could say in English, then continue in character.
- Never break character otherwise. Never use bullet lists. This is a spoken-style conversation.`;
}

export async function sendChat(
  scenario: Scenario,
  history: ChatMessage[],
): Promise<string> {
  const client = new Anthropic({
    apiKey: getApiKey(),
    dangerouslyAllowBrowser: true,
  });

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    system: buildSystemPrompt(scenario),
    messages: history.map((m) => ({ role: m.role, content: m.content })),
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return text || '(No response)';
}
