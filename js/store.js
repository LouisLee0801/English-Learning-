// 所有學習資料存在瀏覽器 localStorage；可在「設定」匯出 / 匯入備份
import { todayStr } from './util.js';

const KEY = 'small-talk-society:v1';
const hasStorage = typeof localStorage !== 'undefined';

export const defaults = () => ({
  version: 1,
  createdAt: todayStr(),
  settings: {
    name: 'Alex',
    dailyGoal: 30,
    rate: 0.95,
    voiceF: '',
    voiceM: '',
    youGender: 'f',
    showZh: true,
  },
  lessons: {}, // id -> { steps: {listen, shadow, toko, roleplay}, completedAt, best }
  days: {}, // 'YYYY-MM-DD' -> { seconds, plan, lessonId, toko, shadow, reviewed, roleplays }
  notebook: {}, // id -> { id, en, zh, note, source, auto, createdAt, srs }
  homework: {}, // 'YYYY-MM-DD' -> { prompt, lessonId, text, done }
});

let state = load();
const listeners = new Set();

function load() {
  if (!hasStorage) return defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return merge(JSON.parse(raw));
  } catch (e) {
    console.warn('無法讀取學習紀錄', e);
  }
  return defaults();
}

function merge(saved) {
  const base = defaults();
  return {
    ...base,
    ...saved,
    settings: { ...base.settings, ...(saved.settings || {}) },
  };
}

export const getState = () => state;
export const settings = () => state.settings;

export function save() {
  if (hasStorage) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('無法儲存學習紀錄', e);
    }
  }
  listeners.forEach((fn) => fn(state));
}

export function update(fn) {
  fn(state);
  save();
}

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function dayLog(date = todayStr()) {
  if (!state.days[date]) {
    state.days[date] = { seconds: 0, plan: {}, toko: { tries: 0, good: 0 }, shadow: 0, reviewed: 0, roleplays: [] };
  }
  const d = state.days[date];
  d.plan ||= {};
  d.toko ||= { tries: 0, good: 0 };
  d.roleplays ||= [];
  return d;
}

export function lessonLog(id) {
  if (!state.lessons[id]) state.lessons[id] = { steps: {}, best: {} };
  state.lessons[id].best ||= {};
  return state.lessons[id];
}

export function exportData() {
  return JSON.stringify(state, null, 2);
}

export function importData(json) {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== 'object' || !parsed.settings) throw new Error('檔案格式不正確');
  state = merge(parsed);
  save();
}

export function resetAll() {
  state = defaults();
  save();
}

/** 測試用：直接替換 state（不寫入 localStorage） */
export function _setState(s) {
  state = merge(s);
}
