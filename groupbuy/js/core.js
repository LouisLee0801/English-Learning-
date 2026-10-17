// 純邏輯：開團狀態、篩選、搜尋、排序、結單時間軸、行事曆連結。瀏覽器與 Node 測試共用。
import { CATEGORY_KEYS, CATEGORY_ALIASES } from './categories.js';
import { taipeiStamp, addDays } from './parse.js';

export const PLATFORMS = {
  Instagram: { short: 'IG', cls: 'ig' },
  Threads: { short: 'Threads', cls: 'th' },
  Facebook: { short: 'FB', cls: 'fb' },
  團媽網站: { short: '團媽網站', cls: 'web' },
  精選: { short: '精選', cls: 'manual' },
  我的: { short: '我的', cls: 'mine' },
};

// 同一篇在多個來源都抓到時，以前面的為準（官方 API 的內文最完整）
export const FILE_PRIORITY = ['manual.json', 'instagram.json', 'threads.json', 'pages.json', 'search.json'];

export const nowStamp = (d = new Date()) => taipeiStamp(d);
const startOf = (s) => (!s ? null : s.length === 10 ? `${s} 00:00` : s);
const endOf = (s) => (!s ? null : s.length === 10 ? `${s} 23:59` : s);
const minutes = (stamp) => Date.parse(`${stamp.replace(' ', 'T')}:00+08:00`) / 60000;

/**
 * 狀態：upcoming 即將開團｜closing 即將結單（closingHours 內）｜open 開團中｜closed 已結單。
 * 沒寫結單日的：過了 expireAt（發文後 10 天）視為已結單。
 */
export function status(item, now = nowStamp(), closingHours = 48) {
  const open = startOf(item.openAt);
  const close = endOf(item.closeAt);
  if (close && close < now) return 'closed';
  if (!close && item.expireAt && item.expireAt < now.slice(0, 10)) return 'closed';
  if (open && open > now) return 'upcoming';
  if (close && minutes(close) - minutes(now) <= closingHours * 60) return 'closing';
  return 'open';
}

/** 剩餘時間文字：「今晚 23:59 結單」「剩 3 天」「10/20 20:00 開團」 */
export function dueText(item, now = nowStamp()) {
  const st = status(item, now);
  const md = (s) => `${+s.slice(5, 7)}/${+s.slice(8, 10)}`;
  const hm = (s) => (s.length > 10 ? ` ${s.slice(11)}` : '');
  if (st === 'closed') return '已結單';
  if (st === 'upcoming') {
    const days = dayDiff(now.slice(0, 10), item.openAt.slice(0, 10));
    return `${days === 0 ? '今天' : days === 1 ? '明天' : md(item.openAt)}${hm(item.openAt)} 開團`;
  }
  if (!item.closeAt) return '結單日見原文';
  const days = dayDiff(now.slice(0, 10), item.closeAt.slice(0, 10));
  const time = item.closeAt.length > 10 ? item.closeAt.slice(11) : '';
  if (days === 0) return time ? `今天 ${time} 結單` : '今天結單';
  if (days === 1) return time ? `明天 ${time} 結單` : '明天結單';
  return `剩 ${days} 天 · ${md(item.closeAt)} 結單`;
}

export const dayDiff = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

const norm = (s) => String(s ?? '').toLowerCase().normalize('NFKC').replace(/\s+/g, ' ');

/** 合併各檔案：依 FILE_PRIORITY 去重（同 id 或同網址），分類不認得就歸「其他」 */
export function combine(parts) {
  const seen = new Set();
  const out = [];
  const ordered = [...parts].sort((a, b) => rank(a.file) - rank(b.file));
  for (const p of ordered) {
    for (const it of p.items || []) {
      const keys = [it.id, it.url && it.url !== it.authorUrl ? `${it.url}#${it.product}` : null].filter(Boolean);
      if (keys.some((k) => seen.has(k))) continue;
      keys.forEach((k) => seen.add(k));
      out.push({ ...it, category: CATEGORY_KEYS.includes(it.category) ? it.category : '其他' });
    }
  }
  return out;
}
const rank = (f) => (FILE_PRIORITY.indexOf(f) + 1 || 99);

export const defaultFilters = () => ({
  q: '',
  category: '',
  platforms: [], // 空 = 全部
  status: 'live', // live 開團中＋即將結單｜closing｜upcoming｜all
  hasClose: false,
  hasPrice: false,
  sort: 'closing',
});

/** 搜尋：每個字都要出現（商品、品牌、團主、分類、摘要、標籤）；「衣服」「育兒」這類字也比對分類 */
export function matchesQuery(item, q) {
  const terms = norm(q).split(' ').filter(Boolean);
  if (!terms.length) return true;
  const hay = norm([item.product, item.brand, item.author, item.authorName, item.category, item.platform, item.excerpt, item.priceText, ...(item.tags || [])].join(' '));
  return terms.every((t) => hay.includes(t) || CATEGORY_ALIASES[t] === item.category);
}

export function matches(item, f, now = nowStamp()) {
  if (f.category && item.category !== f.category) return false;
  if (f.platforms.length && !f.platforms.includes(item.platform)) return false;
  const st = status(item, now);
  if (f.status === 'live' && !(st === 'open' || st === 'closing')) return false;
  if (f.status === 'closing' && st !== 'closing') return false;
  if (f.status === 'upcoming' && st !== 'upcoming') return false;
  if (f.hasClose && !item.closeAt) return false;
  if (f.hasPrice && !item.price) return false;
  return matchesQuery(item, f.q);
}

const seenAt = (x) => x.postedAt || x.firstSeenAt || '';

export function sortItems(list, sort, now = nowStamp()) {
  const by = {
    // 即將結單優先：有結單日的依結單時間；沒寫的排後面、依發現時間新到舊
    closing: (a, b) => (!a.closeAt - !b.closeAt) || endOf(a.closeAt || '9999-12-31').localeCompare(endOf(b.closeAt || '9999-12-31')) || seenAt(b).localeCompare(seenAt(a)),
    new: (a, b) => seenAt(b).localeCompare(seenAt(a)),
    open: (a, b) => startOf(a.openAt || '0000-01-01').localeCompare(startOf(b.openAt || '0000-01-01')) * -1,
    price: (a, b) => (!a.price - !b.price) || (a.price || 0) - (b.price || 0),
  }[sort] || (() => 0);
  const order = { closing: 0, open: 1, upcoming: 2, closed: 3 };
  return [...list].sort((a, b) => (sort === 'closing' ? order[status(a, now)] - order[status(b, now)] : 0) || by(a, b) || a.product.localeCompare(b.product, 'zh-Hant'));
}

export const filterItems = (items, f, now = nowStamp()) => sortItems(items.filter((x) => matches(x, f, now)), f.sort, now);

export function categoryCounts(items) {
  const c = new Map();
  for (const it of items) c.set(it.category, (c.get(it.category) || 0) + 1);
  return c;
}

/**
 * 結單時間軸：今天、明天、之後 14 天逐日；即將開團依開團日；沒寫結單日的另成一組。
 * 回傳 [{ key, title, items }]（空的組不回傳）
 */
export function timeline(items, now = nowStamp(), days = 14) {
  const today = now.slice(0, 10);
  const groups = new Map();
  const add = (key, title, it) => {
    if (!groups.has(key)) groups.set(key, { key, title, items: [] });
    groups.get(key).items.push(it);
  };
  const WD = '日一二三四五六';
  const label = (d) => `${+d.slice(5, 7)}/${+d.slice(8, 10)}（${WD[new Date(`${d}T00:00:00Z`).getUTCDay()]}）`;
  for (const it of items) {
    const st = status(it, now);
    if (st === 'closed') continue;
    if (st === 'upcoming') {
      add(`u-${it.openAt.slice(0, 10)}`, `${label(it.openAt.slice(0, 10))} 開團`, it);
      continue;
    }
    if (!it.closeAt) {
      add('z-noclose', '開團中・結單日見原文', it);
      continue;
    }
    const d = it.closeAt.slice(0, 10);
    const diff = dayDiff(today, d);
    if (diff > days) add('y-later', `${days} 天後結單`, it);
    else add(`c-${d}`, `${diff === 0 ? '今天' : diff === 1 ? '明天' : diff === 2 ? '後天' : ''}${diff <= 2 ? ' ' : ''}${label(d)} 結單`, it);
  }
  const sorted = [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const g of sorted) g.items = sortItems(g.items, 'closing', now);
  // 結單（c-）在前，再來即將開團（u-）、更晚（y-）、沒寫結單日（z-）
  return [...sorted.filter((g) => g.key.startsWith('c-')), ...sorted.filter((g) => g.key.startsWith('u-')), ...sorted.filter((g) => /^[yz]-/.test(g.key))];
}

/** Google 日曆「新增活動」連結：結單前提醒自己 */
export function calendarUrl(item, site = '') {
  if (!item.closeAt) return null;
  const end = endOf(item.closeAt);
  const startStamp = item.closeAt.length > 10 ? taipeiStamp(Date.parse(`${end.replace(' ', 'T')}:00+08:00`) - 3600000) : `${item.closeAt} 00:00`;
  const g = (s, allDay) => (allDay ? s.slice(0, 10).replaceAll('-', '') : `${s.slice(0, 10).replaceAll('-', '')}T${s.slice(11, 13)}${s.slice(14, 16)}00`);
  const allDay = item.closeAt.length === 10;
  const dates = allDay ? `${g(item.closeAt, true)}/${g(addDays(item.closeAt, 1), true)}` : `${g(startStamp)}/${g(end)}`;
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `結單｜${item.product}`,
    dates,
    ctz: 'Asia/Taipei',
    details: [item.authorName || item.author ? `團主：${item.authorName || item.author}` : '', item.priceText || '', item.orderUrl ? `下單：${item.orderUrl}` : '', `原文：${item.url}`, site].filter(Boolean).join('\n'),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

/** 篩選條件 ↔ URL hash 查詢字串 */
export function filtersToQuery(f) {
  const d = defaultFilters();
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (JSON.stringify(v) === JSON.stringify(d[k])) continue;
    p.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  return p.toString();
}

export function queryToFilters(qs) {
  const f = defaultFilters();
  for (const [k, v] of new URLSearchParams(qs)) {
    if (!(k in f)) continue;
    if (Array.isArray(f[k])) f[k] = v ? v.split(',') : [];
    else if (typeof f[k] === 'boolean') f[k] = v === 'true';
    else f[k] = v;
  }
  return f;
}
