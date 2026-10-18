// 比價：每次排程挑還沒比過（或超過 3 天）的開團中商品，到 PChome、momo、Yahoo購物中心搜尋同款，輸出 groupbuy/data/prices.json。
// 酷澎擋自動連線（GitHub 機房 IP 一律 403，比價網 BigGo 也限流），網站上只提供搜尋連結。
// 用法：node scripts/groupbuy/compare.mjs（環境變數 COMPARE_PER_RUN 可改每次比幾個商品，預設 20）
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { openBrowser } from '../deals/lib/browser.mjs';
import { combine, status, nowStamp } from '../../groupbuy/js/core.js';
import { compareQuery, pickOffers } from '../../groupbuy/js/compare.js';
import { pchomeResults, ldItemList, yahooResults } from './lib/shops.mjs';

const DIR = 'groupbuy/data';
const PER_RUN = Number(process.env.COMPARE_PER_RUN || 20);
const FRESH_MS = 3 * 86400000; // 比過的商品 3 天後再比一次
const KEEP_MS = 7 * 86400000; // 已不在開團清單上的商品，結果保留 7 天
const SHOPS = {
  pchome: { url: (q) => `https://ecshweb.pchome.com.tw/search/v4.3/all/results?q=${encodeURIComponent(q)}&page=1&pageCount=20&sort=rnk/dc`, parse: pchomeResults },
  momo: { url: (q) => `https://www.momoshop.com.tw/search/${encodeURIComponent(q)}?searchType=1&curPage=1`, parse: ldItemList },
  yahoo: { url: (q) => `https://tw.buy.yahoo.com/search/product?p=${encodeURIComponent(q)}`, parse: yahooResults },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = async (p, fallback) => {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return fallback;
  }
};

const meta = await readJson(join(DIR, 'meta.json'), { sources: {} });
const files = (meta.files || []).filter((f) => f.endsWith('.json'));
const parts = await Promise.all(files.map(async (file) => ({ file, items: (await readJson(join(DIR, file), { items: [] })).items || [] })));
const now = nowStamp();
// 快結單的先比
const live = combine(parts)
  .filter((x) => status(x, now) !== 'closed')
  .sort((a, b) => (a.closeAt || '9999').localeCompare(b.closeAt || '9999'));
const wanted = [...new Set(live.map(compareQuery).filter(Boolean))];

const prices = await readJson(join(DIR, 'prices.json'), { queries: {} });
prices.queries ||= {};
const t = Date.now();
const due = wanted.filter((q) => !prices.queries[q] || t - Date.parse(prices.queries[q].checkedAt) > FRESH_MS).slice(0, PER_RUN);
console.log(`compare: ${wanted.length} products, ${due.length} due this run`);

const blocked = {};
const stats = { checked: 0, matched: 0, errors: {} };
const { browser, context } = await openBrowser();
try {
  for (const q of due) {
    const offers = {};
    const errors = {};
    for (const [shop, S] of Object.entries(SHOPS)) {
      if (blocked[shop]) continue;
      try {
        const res = await context.request.get(S.url(q), { timeout: 25_000, headers: { 'accept-language': 'zh-TW,zh;q=0.9' } });
        // 被擋就這次排程不再查這個網站
        if ([403, 429].includes(res.status())) {
          blocked[shop] = res.status();
          throw new Error(`HTTP ${res.status()}`);
        }
        if (!res.ok()) throw new Error(`HTTP ${res.status()}`);
        offers[shop] = pickOffers(q, S.parse(await res.text()));
      } catch (e) {
        errors[shop] = String(e.message).split('\n')[0].slice(0, 80);
        stats.errors[shop] = (stats.errors[shop] || 0) + 1;
      }
      await sleep(1500);
    }
    // 全部網站都失敗：不記錄，下次再比
    if (!Object.keys(offers).length) continue;
    prices.queries[q] = { checkedAt: new Date().toISOString(), offers, ...(Object.keys(errors).length ? { errors } : {}) };
    stats.checked++;
    if (Object.values(offers).some((o) => o.length)) stats.matched++;
    console.log(`[compare] ${q} → ${Object.entries(offers).map(([k, v]) => `${k} ${v.length ? `$${v[0].price}` : '-'}`).join(', ')}`);
  }
} finally {
  await browser.close();
}

// 清掉已經不在清單上、也超過保留期的
const keep = new Set(wanted);
for (const [q, v] of Object.entries(prices.queries)) if (!keep.has(q) && t - Date.parse(v.checkedAt) > KEEP_MS) delete prices.queries[q];
prices.updatedAt = new Date().toISOString();
await writeFile(join(DIR, 'prices.json'), JSON.stringify(prices, null, 1) + '\n');

const fresh = await readJson(join(DIR, 'meta.json'), meta);
fresh.sources ||= {};
fresh.sources.compare = { ok: true, count: Object.keys(prices.queries).length, fresh: stats.checked, updatedAt: prices.updatedAt, note: '比價（PChome、momo、Yahoo購物中心；每次比 20 個商品，3 天更新一次）', stats: { ...stats, pending: Math.max(0, wanted.filter((q) => !prices.queries[q]).length), blocked } };
await writeFile(join(DIR, 'meta.json'), JSON.stringify(fresh, null, 1) + '\n');
