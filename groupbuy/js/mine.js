// 我的團購：收藏的團購、自己貼上的貼文、追蹤的團主。只存在這台裝置（localStorage）；
// 換裝置用「同步連結」（資料壓縮後放在網址 # 後面，不經過伺服器）或匯出／匯入 JSON。
const KEY = 'groupbuy-radar:v1';

const blank = () => ({ saved: {}, added: [], follows: [] });
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

// ---------- 追蹤的團主 ----------

/** 團購項目 → 用來比對追蹤的鍵（帳號、名稱，小寫） */
export const itemKeys = (it) => [it?.author, it?.authorName].filter(Boolean).map((x) => String(x).trim().toLowerCase().replace(/^@/, ''));

/**
 * 輸入的帳號或網址 → { key, name, platform, url }。
 * 認得 IG、Threads、FB 網址，@abc 或 abc 當帳號；中文名稱照存（比對團媽網站、FB 粉專名稱）。
 */
export function parseFollow(input) {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  const m = raw.match(/^https?:\/\/(?:www\.|m\.)?(instagram\.com|threads\.(?:net|com)|facebook\.com)\/@?([^/?#]+)/i);
  if (m) {
    const platform = /instagram/i.test(m[1]) ? 'Instagram' : /threads/i.test(m[1]) ? 'Threads' : 'Facebook';
    const handle = decodeURIComponent(m[2]);
    const url = platform === 'Instagram' ? `https://www.instagram.com/${handle}/` : platform === 'Threads' ? `https://www.threads.com/@${handle}` : `https://www.facebook.com/${handle}`;
    return { key: handle.toLowerCase(), name: platform === 'Facebook' ? handle : `@${handle}`, platform, url };
  }
  if (/^https?:\/\//i.test(raw)) return { key: raw.toLowerCase(), name: raw, platform: null, url: raw };
  const handle = raw.replace(/^@/, '');
  const ascii = /^[A-Za-z0-9._]+$/.test(handle);
  return { key: handle.toLowerCase(), name: ascii ? `@${handle}` : handle, platform: null, url: null };
}

export const follows = () => read().follows || [];
export const isFollowing = (key) => follows().some((f) => f.key === key);
/** 加入或取消追蹤；回傳加入後是否在追蹤中 */
export function toggleFollow(f) {
  if (!f?.key) return false;
  const s = read();
  s.follows ||= [];
  const on = s.follows.some((x) => x.key === f.key);
  s.follows = on ? s.follows.filter((x) => x.key !== f.key) : [{ ...f, addedAt: new Date().toISOString() }, ...s.follows];
  write(s);
  return !on;
}
export const followsItem = (it, list = follows()) => {
  const keys = itemKeys(it);
  return list.some((f) => keys.includes(f.key));
};

// ---------- 備份與同步 ----------

export const exportJson = () => JSON.stringify({ app: 'groupbuy-radar', version: 1, exportedAt: new Date().toISOString(), ...read() }, null, 1);
function merge(j) {
  if (!j || typeof j !== 'object' || (!j.saved && !j.added && !j.follows)) throw new Error('不是團購雷達的備份資料');
  const s = read();
  Object.assign(s.saved, j.saved || {});
  const ids = new Set(s.added.map((x) => x.id));
  s.added = [...s.added, ...(j.added || []).filter((x) => x && x.id && !ids.has(x.id))];
  s.follows ||= [];
  const keys = new Set(s.follows.map((x) => x.key));
  s.follows = [...s.follows, ...(j.follows || []).filter((x) => x && x.key && !keys.has(x.key))];
  write(s);
  return { saved: Object.keys(j.saved || {}).length, added: (j.added || []).length, follows: (j.follows || []).length };
}
export function importJson(text) {
  const n = merge(JSON.parse(text));
  return n.saved + n.added + n.follows;
}

// 同步連結只帶必要欄位，網址才不會太長
const SLIM = ['id', 'source', 'platform', 'product', 'category', 'price', 'priceText', 'openAt', 'closeAt', 'url', 'orderUrl', 'author', 'authorName', 'authorUrl', 'savedAt', 'firstSeenAt'];
const slim = (x) => Object.fromEntries(SLIM.filter((k) => x[k] != null).map((k) => [k, x[k]]));
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
async function pipe(bytes, stream) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());
}

/** 同步連結：收藏、自己加的、追蹤的團主，壓縮後放在 #/mine?sync=… */
export async function syncLink(base) {
  const s = read();
  const data = { v: 1, saved: Object.fromEntries(Object.entries(s.saved).map(([k, v]) => [k, slim(v)])), added: s.added.map((x) => ({ ...slim(x), excerpt: x.excerpt, tags: x.tags })), follows: s.follows || [] };
  const bytes = new TextEncoder().encode(JSON.stringify(data));
  const packed = typeof CompressionStream === 'function' ? `z${b64url(await pipe(bytes, new CompressionStream('deflate-raw')))}` : `j${b64url(bytes)}`;
  return `${base}#/mine?sync=${packed}`;
}
/** 讀同步連結的資料（不寫入）；格式不對丟錯 */
export async function readSync(packed) {
  const kind = String(packed)[0];
  const bytes = unb64url(String(packed).slice(1));
  const text = new TextDecoder().decode(kind === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes);
  return JSON.parse(text);
}
export const mergeSync = (data) => merge(data);
