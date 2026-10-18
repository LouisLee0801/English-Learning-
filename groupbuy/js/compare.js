// 比價：團購商品 → 購物網站搜尋字、搜尋結果是不是同款、各平台搜尋連結。瀏覽器與排程（scripts/groupbuy/compare.mjs）共用。
import { brandOf, findTerms } from './categories.js';

export const SHOPS = {
  coupang: { name: '酷澎', search: (q) => `https://www.tw.coupang.com/search?q=${encodeURIComponent(q)}` },
  momo: { name: 'momo', search: (q) => `https://www.momoshop.com.tw/search/searchShop.jsp?keyword=${encodeURIComponent(q)}` },
  pchome: { name: 'PChome', search: (q) => `https://24h.pchome.com.tw/search/?q=${encodeURIComponent(q)}` },
  yahoo: { name: 'Yahoo', search: (q) => `https://tw.buy.yahoo.com/search/product?p=${encodeURIComponent(q)}` },
};
export const SHOP_KEYS = Object.keys(SHOPS);

const width = (s) => [...s].reduce((n, c) => n + (/[\x00-\xff]/.test(c) ? 1 : 2), 0);
const pairsOf = (s) => {
  const out = new Set();
  for (const run of s.match(/\p{Script=Han}{2,}/gu) || []) for (let i = 0; i + 1 < run.length; i++) out.add(run.slice(i, i + 2));
  return out;
};
// 住宿、票券、包車這類購物網站不賣
const SKIP_CATEGORY = new Set(['旅遊票券']);

/**
 * 團購商品 → 搜尋字；商品名太籠統（沒有品牌也沒有商品字）回 null。
 * 去掉括號備註、符號，保留品牌、型號、容量（比對同款用）。
 */
export function compareQuery(item) {
  if (!item?.product || SKIP_CATEGORY.has(item.category)) return null;
  const q = String(item.product)
    .normalize('NFKC')
    .replace(/[(（【\[][^)）】\]]*[)）】\]]/g, ' ')
    // 「8 件組」「3入」：組數不同照樣搜得到，比價時再看名稱
    .replace(/\d+\s*(?:件|入|組|包|盒|罐|瓶|支|片|顆|袋)組?/g, ' ')
    .replace(/[^\p{Script=Han}A-Za-z0-9\s.+\-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (width(q) < 6) return null;
  if (!brandOf(q) && !findTerms(q).length) return null;
  // 沒有品牌時要夠具體：開頭有英文名（MOODO），或至少 4 個中文字（「小帳篷」太籠統）
  if (!brandOf(q) && !/^[A-Za-z]{3,}/.test(q) && pairsOf(q).size < 3) return null;
  return [...q].slice(0, 24).join('').trim();
}

const wordsOf = (s) => new Set((s.match(/[a-z0-9]{2,}/g) || []).filter((w) => !/^\d+$/.test(w) || w.length >= 3));
// 配件、耗材：搜尋字沒提到卻出現，就不是同款
const ACCESSORY = /配件|替換|濾網|濾芯|耗材|刀頭|刷頭|吸頭|集塵袋|專用|適用|副廠|保護套|收納包|貼膜|延長線/;

/**
 * 搜尋結果和搜尋字有多像（0～1）：有品牌時結果一定要有同一個品牌；
 * 字典裡沒有的品牌，以開頭的英文名或前兩個中文字當品牌（「波琳小姐蝴蝶酥」的結果要有「波琳」）；
 * 其餘看中文兩字組合、英數字詞重疊的比例；搜尋字沒提到的配件、耗材一律 0。
 */
export function matchScore(query, name) {
  const q = String(query).normalize('NFKC').toLowerCase();
  const n = String(name).normalize('NFKC').toLowerCase();
  const brand = brandOf(q)?.toLowerCase();
  if (brand && !n.includes(brand)) return 0;
  const anchor = brand ? null : q.match(/^[a-z]{3,}/)?.[0] || q.match(/\p{Script=Han}{2}/u)?.[0];
  if (anchor && !n.includes(anchor)) return 0;
  const rest = brand ? q.split(brand).join(' ') : q;
  const want = [...pairsOf(rest), ...wordsOf(rest)];
  if (!want.length) return brand ? 0.6 : 0;
  if (ACCESSORY.test(n) && !ACCESSORY.test(q)) return 0;
  const have = new Set([...pairsOf(n), ...wordsOf(n)]);
  return Math.round((want.filter((x) => have.has(x)).length / want.length) * 100) / 100;
}

/**
 * 某個平台的搜尋結果 → 最像同款的前 n 個，價格低到高。
 * 門檻 min（有品牌時品牌已對上，放低）；只留和最像的那個差不多像的（差 0.15 內），避免拿到不同款的低價品。
 */
export function pickOffers(query, results, { min = brandOf(query) ? 0.3 : 0.5, n = 3 } = {}) {
  const rows = (results || [])
    .filter((r) => r && r.price > 0 && r.name && /^https?:\/\//.test(r.url || ''))
    .map((r) => ({ name: String(r.name).slice(0, 80), price: Math.round(r.price), url: r.url, score: matchScore(query, r.name) }))
    .filter((r) => r.score >= min);
  const top = Math.max(0, ...rows.map((r) => r.score));
  return rows
    .filter((r) => r.score >= top - 0.15)
    .sort((a, b) => a.price - b.price || b.score - a.score)
    .slice(0, n);
}

/** 各平台最便宜的同款 → [{ shop, name, price, url }]，價格低到高 */
export function cheapest(offers = {}) {
  return SHOP_KEYS.map((shop) => (offers[shop]?.[0] ? { shop, ...offers[shop][0] } : null))
    .filter(Boolean)
    .sort((a, b) => a.price - b.price);
}

/** 團購價和網路最低價比：good 團購比較便宜｜warn 網路比較便宜｜same 一樣；沒有團購價或沒有比價結果回 null */
export function priceVerdict(item, offers) {
  const [best] = cheapest(offers);
  if (!best || !item?.price) return null;
  const diff = best.price - item.price;
  const shop = SHOPS[best.shop].name;
  if (diff > 0) return { kind: 'good', diff, shop, text: `團購價比網路最低（${shop}）便宜 $${diff.toLocaleString('zh-TW')}` };
  if (diff < 0) return { kind: 'warn', diff: -diff, shop, text: `${shop} 比團購價便宜 $${(-diff).toLocaleString('zh-TW')}` };
  return { kind: 'same', diff: 0, shop, text: `和${shop}同價` };
}
