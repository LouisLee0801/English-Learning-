// 我的團購：收藏的團購、自己貼上的貼文。只存在這台裝置（localStorage），可匯出／匯入 JSON。
const KEY = 'groupbuy-radar:v1';

const blank = () => ({ saved: {}, added: [] });
function read() {
  try {
    return { ...blank(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return blank();
  }
}
function write(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* 無痕模式或空間不足：本次瀏覽仍可用 */
  }
}

/** 收藏：存一份快照，來源資料過期後仍看得到 */
export const isSaved = (id) => Boolean(read().saved[id]);
export function toggleSave(item) {
  const s = read();
  if (s.saved[item.id]) delete s.saved[item.id];
  else s.saved[item.id] = { ...item, savedAt: new Date().toISOString() };
  write(s);
  return Boolean(s.saved[item.id]);
}
export const savedItems = () => Object.values(read().saved);

/** 自己貼上的團購 */
export const addedItems = () => read().added;
export function upsertAdded(item) {
  const s = read();
  const id = item.id || `mine:${Date.now().toString(36)}`;
  const next = { ...item, id, source: 'mine', platform: '我的' };
  s.added = [next, ...s.added.filter((x) => x.id !== id)];
  write(s);
  return next;
}
export function removeAdded(id) {
  const s = read();
  s.added = s.added.filter((x) => x.id !== id);
  delete s.saved[id];
  write(s);
}

export const exportJson = () => JSON.stringify({ app: 'groupbuy-radar', version: 1, exportedAt: new Date().toISOString(), ...read() }, null, 1);
export function importJson(text) {
  const j = JSON.parse(text);
  if (!j || typeof j !== 'object' || (!j.saved && !j.added)) throw new Error('不是團購雷達的備份檔');
  const s = read();
  Object.assign(s.saved, j.saved || {});
  const ids = new Set(s.added.map((x) => x.id));
  s.added = [...s.added, ...(j.added || []).filter((x) => x && x.id && !ids.has(x.id))];
  write(s);
  return Object.keys(j.saved || {}).length + (j.added || []).length;
}
