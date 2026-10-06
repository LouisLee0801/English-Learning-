import week1 from './week1.js';
import week2 from './week2.js';
import week3 from './week3.js';
import week4 from './week4.js';

export const WEEKS = [
  { week: 1, track: 'travel', title: 'From New York to Singapore', titleZh: '旅行 I：吃喝與移動', desc: '咖啡店、早午餐、問路、飛機上的閒聊、小販中心。' },
  { week: 2, track: 'travel', title: 'Crazy Rich Weekend', titleZh: '旅行 II：社交與派對', desc: '精品酒店、頂樓酒吧、豪門家宴、逛街、世紀婚宴。' },
  { week: 3, track: 'business', title: 'Before the Meeting', titleZh: '商務 I：會議前的閒聊', desc: '電梯閒聊、視訊開場、產業交流、新同事、客戶晚宴。' },
  { week: 4, track: 'business', title: 'In the Room', titleZh: '商務 II：會議中與會後', desc: '切入正題、表達立場、專業收尾、會後檢討、Happy Hour。' },
];

export const TRACKS = {
  travel: { label: '旅行', en: 'Travel' },
  business: { label: '商務', en: 'Business' },
};

function normalize(raw) {
  return {
    ...raw,
    lines: raw.lines.map(([speaker, en, zh], i) => ({ id: `${raw.id}-L${i}`, speaker, en, zh, you: speaker === 'You' })),
    phrases: raw.phrases.map(([en, zh, note], i) => ({ id: `${raw.id}-P${i}`, en, zh, note })),
    accent: raw.accent.map(([word, sound, note]) => ({ word, sound, note })),
  };
}

export const LESSONS = [...week1, ...week2, ...week3, ...week4].map(normalize);

const byId = new Map(LESSONS.map((l) => [l.id, l]));
export const getLesson = (id) => byId.get(id);

/** Toko 練習題：你的台詞（附上一句對方的話當情境）+ 本課片語 */
export function tokoItems(lesson) {
  const items = [];
  lesson.lines.forEach((line, i) => {
    if (!line.you) return;
    const prev = lesson.lines[i - 1];
    items.push({
      id: line.id,
      en: line.en,
      zh: line.zh,
      lessonId: lesson.id,
      context: prev && !prev.you ? { speaker: prev.speaker, en: prev.en, zh: prev.zh, gender: speakerGender(lesson, prev.speaker) } : null,
    });
  });
  lesson.phrases.forEach((p) => items.push({ id: p.id, en: p.en, zh: p.zh, note: p.note, lessonId: lesson.id, phrase: true }));
  return items;
}

export function speakerGender(lesson, speaker) {
  return lesson.cast?.[speaker] || 'f';
}
