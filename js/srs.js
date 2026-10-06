// 簡化版 SM-2 間隔重複。grade: 0 再一次 / 1 有點卡 / 2 答對 / 3 太簡單
import { addDays, todayStr } from './util.js';

export const GRADES = [
  { grade: 0, label: '再練一次', key: '1' },
  { grade: 1, label: '有點卡', key: '2' },
  { grade: 2, label: '答對了', key: '3' },
  { grade: 3, label: '太簡單', key: '4' },
];

export function newCard(due = todayStr()) {
  return { due, interval: 0, ease: 2.5, reps: 0, lapses: 0 };
}

export function review(card, grade, today = todayStr()) {
  const c = { ...newCard(today), ...card };
  if (grade === 0) {
    c.reps = 0;
    c.lapses += 1;
    c.interval = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.due = today;
    c.last = today;
    return c;
  }
  if (c.reps === 0) c.interval = grade === 3 ? 4 : 1;
  else if (c.reps === 1) c.interval = grade === 3 ? 7 : grade === 2 ? 3 : 2;
  else {
    const mult = grade === 1 ? 1.2 : grade === 2 ? c.ease : c.ease * 1.3;
    c.interval = Math.max(c.interval + 1, Math.round(c.interval * mult));
  }
  if (grade === 1) c.ease = Math.max(1.3, c.ease - 0.15);
  if (grade === 3) c.ease += 0.15;
  c.reps += 1;
  c.due = addDays(today, c.interval);
  c.last = today;
  return c;
}

export const isDue = (card, today = todayStr()) => !!card && card.due <= today;

export function cardStatus(card) {
  if (!card || (!card.reps && !card.lapses && !card.last)) return 'new';
  if (card.interval >= 21) return 'mastered';
  return 'learning';
}

export const STATUS_LABEL = { new: '新卡', learning: '學習中', mastered: '已熟練' };
