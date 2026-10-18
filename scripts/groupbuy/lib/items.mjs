// 貼文 → 團購項目、累積合併、到期清除、欄位檢查。純函式，方便單元測試。
import { parsePost, splitSchedule, taipeiStamp, addDays } from '../../../groupbuy/js/parse.js';
import { classify, brandOf } from '../../../groupbuy/js/categories.js';

export const PLATFORM = { threads: 'Threads', instagram: 'Instagram', facebook: 'Facebook', rss: 'Facebook', pages: '團媽網站', manual: '精選' };
const TTL_DAYS = 10; // 沒寫結單日的貼文，發文後保留幾天
// 抓不出具體商品（只剩「服飾」「好物」這種字）就不收
const GENERIC = /^(?:服飾|衣服|家電|美食|零食|保養|美妝|好物|商品|優惠|團購|生活用品|日用品|用品|新品|現貨|預購|代購|韓國|日本|泰國|各式|多款|系列)$/;
export const isGeneric = (p) => !p || [...String(p)].length < 2 || GENERIC.test(String(p).trim());
const ymd = (s) => String(s).slice(0, 10);

/**
 * 到期日（YYYY-MM-DD）：有結單日 → 結單隔天；只有開團日 → 開團後 14 天；都沒有 → 發文後 10 天。
 * 過了這天就從資料移除（網站另依時間判斷「已結單」）。
 */
export function expireOf(item) {
  if (item.closeAt) return addDays(ymd(item.closeAt), 1);
  if (item.openAt) return addDays(ymd(item.openAt), 14);
  // 搜尋摘要沒有發文日的，從第一次抓到算起
  const base = item.postedAt || item.firstSeenAt;
  return addDays(ymd(base ? taipeiStamp(base) : taipeiStamp()), TTL_DAYS);
}

// 存一份精簡原文在項目上，之後解析規則改進時，累積中的舊貼文能重新解析
const keepPost = (p) => ({ source: p.source, platform: p.platform || null, id: p.id, url: p.url, author: p.author || null, authorName: p.authorName || null, authorUrl: p.authorUrl || null, title: p.title || '', text: String(p.text || '').slice(0, 2000), postedAt: p.postedAt || null, via: p.via || null, isReply: Boolean(p.isReply) });

/**
 * 一篇貼文 → 0～n 筆團購（預告文一篇拆多筆）。
 * minScore：搜尋來的貼文要像開團文才收（4 分）；追蹤帳號、官方 API 讀的團主貼文放寬（2 分）
 */
export function postToItems(post, { minScore = post.via === 'search' ? 4 : 2 } = {}) {
  const ref = post.ref || (post.postedAt ? taipeiStamp(post.postedAt) : taipeiStamp());
  const base = {
    source: post.source,
    // RSS 的貼文自己帶平台（feed 可能是 FB 粉專，也可能是 IG）
    platform: post.platform || PLATFORM[post.source] || post.source,
    via: post.via || null,
    author: post.author || null,
    authorName: post.authorName || null,
    authorUrl: post.authorUrl || null,
    url: post.url,
    postedAt: post.postedAt || null,
  };
  // 團媽網站：每一行已解析好
  if (post.parsed) {
    const p = post.parsed;
    const item = {
      ...base,
      id: post.id,
      product: p.product,
      brand: brandOf(p.product),
      category: classify({ product: p.product, text: p.line }),
      price: null,
      originalPrice: null,
      priceText: null,
      openAt: p.openAt,
      closeAt: p.closeAt,
      timeText: p.timeText,
      orderUrl: p.orderUrl,
      tags: [],
      excerpt: p.line.slice(0, 160),
    };
    return [{ ...item, expireAt: expireOf(item) }];
  }
  const r = parsePost({ title: post.title, text: post.text, ref });
  if (post.isReply || r.score < minScore || isGeneric(r.product)) return [];
  const one = {
    ...base,
    post: keepPost(post),
    id: post.id,
    product: r.product,
    brand: r.brand,
    category: r.category,
    price: r.price,
    originalPrice: r.originalPrice,
    priceText: r.priceText,
    openAt: r.openAt,
    closeAt: r.closeAt,
    timeText: r.timeText,
    orderUrl: r.orderUrl,
    tags: r.tags,
    excerpt: r.excerpt,
  };
  const rows = splitSchedule(post.text, ref);
  if (!rows.length) return [{ ...one, expireAt: expireOf(one) }];
  // 預告文：每一檔一筆，共用貼文連結
  return rows.map((row, i) => {
    const it = {
      ...one,
      id: `${post.id}#${i + 1}`,
      product: row.product,
      brand: brandOf(row.product),
      category: classify({ product: row.product }),
      price: null,
      priceText: null,
      openAt: row.openAt,
      closeAt: row.closeAt,
      timeText: row.line,
      excerpt: row.line,
    };
    return { ...it, expireAt: expireOf(it) };
  });
}

/** 必要欄位檢查；回傳錯誤訊息陣列 */
export function validateItem(it) {
  const errs = [];
  for (const k of ['id', 'source', 'platform', 'product', 'url']) if (!it[k]) errs.push(`missing ${k}`);
  for (const k of ['openAt', 'closeAt']) if (it[k] && !/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2})?$/.test(it[k])) errs.push(`bad ${k} ${it[k]}`);
  if (it.url && !/^https?:\/\//.test(it.url)) errs.push(`bad url ${it.url}`);
  return errs;
}

/**
 * 累積：這次抓到的覆蓋同 id 的舊資料（保留 firstSeenAt）；這次沒抓到、還沒到期的舊資料留著。
 * 社群搜尋每次只看得到一小段，靠累積才完整。
 */
export function mergeItems(fresh, prev = [], { now = new Date().toISOString(), today = ymd(taipeiStamp()), keepPrev = true } = {}) {
  const old = new Map(prev.map((x) => [x.id, x]));
  const out = new Map();
  for (const it of fresh) {
    const o = old.get(it.id);
    out.set(it.id, { ...it, firstSeenAt: o?.firstSeenAt || it.firstSeenAt || now });
  }
  if (keepPrev) for (const o of prev) if (!out.has(o.id)) out.set(o.id, o);
  return [...out.values()]
    .map((x) => ({ ...x, expireAt: expireOf(x) }))
    .filter((x) => x.expireAt >= today)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * 用目前的解析規則重新整理累積中的舊資料（有存原文的才重算）；同一篇拆成多筆的只算一次。
 * 重算後不再算開團文的就移除。
 */
export function rederive(items = []) {
  const out = [];
  const done = new Set();
  for (const it of items) {
    if (!it.post) {
      out.push(it);
      continue;
    }
    if (done.has(it.post.id)) continue;
    done.add(it.post.id);
    const seen = new Map(items.filter((x) => x.post?.id === it.post.id).map((x) => [x.id, x.firstSeenAt]));
    for (const x of postToItems(it.post)) out.push({ ...x, firstSeenAt: seen.get(x.id) || it.firstSeenAt });
  }
  return out;
}

/** 從清單挑這次要用的關鍵字（每次排程輪替，避免被限流時總是同一組） */
export function rotate(list, n, offset) {
  if (!list.length) return [];
  return Array.from({ length: Math.min(n, list.length) }, (_, i) => list[(offset + i) % list.length]);
}
