// 每日排程：抓回饋平台與全網優惠來源，輸出 deals/data/<source>.json 與 meta.json。
// 某平台失敗時保留上一次成功的檔案，只在 meta 標記錯誤。
// 用法：node scripts/deals/scrape.mjs [來源名稱 ...]（不指定 = 全部）
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { openBrowser } from './lib/browser.mjs';
import { validateDeal } from './lib/normalize.mjs';
import { getFx } from './lib/fx.mjs';
import { classify } from '../../deals/js/categories.js';
import line from './adapters/line.mjs';
import eva from './adapters/eva.mjs';
import cathay from './adapters/cathay.mjs';
import * as couponSources from './adapters/coupon-sources.mjs';

const DIR = 'deals/data';
// 回饋平台（結帳入口）＋ 全網優惠券／優惠情報
const ADAPTERS = { line, eva, cathay, ...couponSources };
const FILES = [...Object.keys(ADAPTERS).map((k) => `${k}.json`), 'manual.json'];

const readJson = async (p, fallback) => {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return fallback;
  }
};

const strip = ({ updatedAt, ...rest }) => JSON.stringify(rest);

/** 內容沒變的優惠保留原本的 updatedAt，讓「最近更新」排序有意義、diff 也乾淨 */
function carryUpdatedAt(next, prev, now) {
  const old = new Map((prev || []).map((d) => [d.id, d]));
  return next.map((d) => {
    const o = old.get(d.id);
    return { ...d, updatedAt: o && strip(o) === strip(d) ? o.updatedAt : now };
  });
}

const now = new Date().toISOString();
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date());
await mkdir(DIR, { recursive: true });
const meta = await readJson(join(DIR, 'meta.json'), { sources: {} });
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ADAPTERS);
const fx = await getFx();
console.log('fx', JSON.stringify(fx));

const { browser, context } = await openBrowser();
let failures = 0;
try {
  for (const name of wanted) {
    const file = join(DIR, `${name}.json`);
    const prev = await readJson(file, { deals: [] });
    const t0 = Date.now();
    try {
      const raw = await ADAPTERS[name].scrape({ context, fx, today, now, log: (...a) => console.log(`[${name}]`, ...a) });
      const seen = new Set();
      const deals = [];
      for (const d of raw) {
        d.category = classify(d); // 各來源分類統一成網站的分類
        const errs = validateDeal(d);
        if (errs.length) {
          console.warn(`[${name}] skip ${d.id || d.merchant}: ${errs.join(', ')}`);
          continue;
        }
        if (seen.has(d.id)) continue;
        seen.add(d.id);
        deals.push(d);
      }
      // 數量驟降通常是版面改了，不覆蓋舊資料
      const min = ADAPTERS[name].minCount ?? 1;
      if (deals.length < min || (prev.deals.length >= 20 && deals.length < prev.deals.length * 0.4)) {
        throw new Error(`只抓到 ${deals.length} 筆（上次 ${prev.deals.length} 筆），疑似版面變更，保留舊資料`);
      }
      deals.sort((a, b) => a.id.localeCompare(b.id));
      await writeFile(file, JSON.stringify({ source: name, deals: carryUpdatedAt(deals, prev.deals, now) }, null, 1) + '\n');
      meta.sources[name] = { ok: true, count: deals.length, updatedAt: now, seconds: Math.round((Date.now() - t0) / 1000), note: ADAPTERS[name].note || '' };
      console.log(`[${name}] ok ${deals.length} deals in ${meta.sources[name].seconds}s`);
    } catch (e) {
      failures++;
      console.error(`[${name}] FAILED`, e);
      meta.sources[name] = { ...(meta.sources[name] || {}), ok: false, count: prev.deals.length, error: String(e.message || e).split('\n')[0].replace(/\u001b\[\d+m/g, '').slice(0, 300), failedAt: now };
    }
  }
} finally {
  await browser.close();
}

meta.generatedAt = now;
meta.fx = fx;
meta.files = FILES;
await writeFile(join(DIR, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
if (failures === wanted.length) process.exitCode = 1;
