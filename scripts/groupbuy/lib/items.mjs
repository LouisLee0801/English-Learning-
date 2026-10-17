// 貼文 → 團購項目、累積合併、到期清除、欄位檢查。純函式，方便單元測試。
import { parsePost, splitSchedule, taipeiStamp, addDays } from '../../../groupbuy/js/parse.js';
import { classify, brandOf } from '../../../groupbuy/js/categories.js';

export const PLATFORM = { threads: 'Threads', instagram: 'Instagram', facebook: 'Facebook', pages: '團媽網站', manual: '精選' };
const TTL_DAYS = 10; // 沒寫結單日的貼文，發文後保留幾天
const ymd = (s) => String(s).slice(0, 10);

/**
 * 到期日（YYYY-MM-DD）：有結單日 → 結單隔天；只有開團日 → 開團後 14 天；都沒有 → 發文後 10 天。
 * 過了這天就從資料移除（網站另依時間判斷「已結單」）。
 */
export function expireOf(item) {
  if (item.closeAt) return addDays(ymd(item.closeAt), 1);
  if (item.openAt) return addDays(ymd(item.openAt), 14);
  const base = item.postedAt ? taipeiStamp(item.postedAt) : taipeiStamp();
  return addDays(ymd(base), TTL_DAYS);
}

/**
 * 一篇貼文 → 0～n 筆團購（預告文一篇拆多筆）。
 * minScore：搜尋來的貼文要像開團文才收；追蹤帳號、團媽網站可放寬
 */
export function postToItems(post, { minScore = 4 } = {}) {
  const ref = post.ref || (post.postedAt ? taipeiStamp(post.postedAt) : taipeiStamp());
  const base = {
    source: post.source,
    platform: PLATFORM[post.source] || post.source,
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
  if (post.isReply || r.score < minScore || !r.product) return [];
  const one = {
    ...base,
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
    out.set(it.id, { ...it, firstSeenAt: o?.firstSeenAt || now });
  }
  if (keepPrev) for (const o of prev) if (!out.has(o.id) && (o.expireAt || '9999') >= today) out.set(o.id, o);
  return [...out.values()].filter((x) => (x.expireAt || '9999') >= today).sort((a, b) => a.id.localeCompare(b.id));
}

/** 從清單挑這次要用的關鍵字（每次排程輪替，避免被限流時總是同一組） */
export function rotate(list, n, offset) {
  if (!list.length) return [];
  return Array.from({ length: Math.min(n, list.length) }, (_, i) => list[(offset + i) % list.length]);
}
