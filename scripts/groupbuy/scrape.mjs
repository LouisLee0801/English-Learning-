// 定期排程：抓各團購來源，輸出 groupbuy/data/<來源>.json 與 meta.json。
// 來源失敗時保留上一次的檔案，只在 meta 標記錯誤；社群來源每次只看得到一小段，結果會累積到結單（或發文後 10 天）。
// 用法：node scripts/groupbuy/scrape.mjs [來源名稱 ...]（不指定 = 全部）
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { openBrowser } from '../deals/lib/browser.mjs';
import { validateItem, mergeItems } from './lib/items.mjs';
import { normalizeWatch } from './lib/watch.mjs';
import { taipeiStamp } from '../../groupbuy/js/parse.js';
import threads from './adapters/threads.mjs';
import search from './adapters/search.mjs';
import pages from './adapters/pages.mjs';
import instagram from './adapters/instagram.mjs';

const DIR = 'groupbuy/data';
const ADAPTERS = { threads, search, pages, instagram };
const FILES = [...Object.keys(ADAPTERS).map((k) => `${k}.json`), 'manual.json'];

const readJson = async (p, fallback) => {
  try {
    return JSON.parse(await readFile(p, 'utf8'));
  } catch {
    return fallback;
  }
};

// 錯誤訊息會寫進公開的 meta.json：遮掉 token
const SECRETS = ['THREADS_ACCESS_TOKEN', 'IG_ACCESS_TOKEN'].map((k) => process.env[k]).filter((v) => v && v.length > 8);
const redact = (s) => SECRETS.reduce((t, v) => t.split(v).join('***'), String(s)).replace(/access_token=[^&\s"]+/g, 'access_token=***');

const now = new Date().toISOString();
const today = taipeiStamp().slice(0, 10);
await mkdir(DIR, { recursive: true });
const meta = await readJson(join(DIR, 'meta.json'), { sources: {} });
meta.sources ||= {};
const watch = normalizeWatch(await readJson(join(DIR, 'watchlist.json'), {}));
const rotation = (meta.runs || 0) + 1;
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ADAPTERS);
const env = process.env;
console.log('watch', JSON.stringify({ threads: watch.threads.length, instagram: watch.instagram.length, pages: watch.pages.length, rotation }));

const { browser, context } = await openBrowser();
let failures = 0;
let ran = 0;
try {
  for (const name of wanted) {
    const A = ADAPTERS[name];
    const file = join(DIR, `${name}.json`);
    const prev = await readJson(file, { items: [] });
    if (A.enabled && !A.enabled(env)) {
      meta.sources[name] = { ok: true, skipped: true, count: prev.items.length, note: A.note, version: A.version ?? 1 };
      console.log(`[${name}] skipped (not configured)`);
      continue;
    }
    ran++;
    const t0 = Date.now();
    const log = (...a) => console.log(`[${name}]`, ...a.map(redact));
    try {
      const { items: raw, stats } = await A.scrape({ context, watch, rotation, env, prev: prev.items, log });
      const seen = new Set();
      const fresh = [];
      for (const it of raw) {
        const errs = validateItem(it);
        if (errs.length) {
          log(`skip ${it.id}: ${errs.join(', ')}`);
          continue;
        }
        if (seen.has(it.id)) continue;
        seen.add(it.id);
        fresh.push(it);
      }
      const items = mergeItems(fresh, prev.items, { now, today, keepPrev: A.accumulate !== false });
      if (items.length < (A.minCount ?? 0)) throw new Error(`只有 ${items.length} 筆，疑似版面變更，保留舊資料`);
      await writeFile(file, JSON.stringify({ source: name, items }, null, 1) + '\n');
      meta.sources[name] = { ok: true, count: items.length, fresh: fresh.length, updatedAt: now, seconds: Math.round((Date.now() - t0) / 1000), note: A.note, version: A.version ?? 1, stats };
      console.log(`[${name}] ok ${fresh.length} fresh, ${items.length} total in ${meta.sources[name].seconds}s`);
    } catch (e) {
      failures++;
      console.error(`[${name}] FAILED`, redact(e.stack || e));
      meta.sources[name] = { ...(meta.sources[name] || {}), ok: false, count: prev.items.length, error: redact(String(e.message || e).split('\n')[0]).replace(/\u001b\[\d+m/g, '').slice(0, 300), failedAt: now };
    }
  }
} finally {
  await browser.close();
}

meta.runs = rotation;
meta.generatedAt = now;
meta.files = FILES;
await writeFile(join(DIR, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
if (ran && failures === ran) process.exitCode = 1;
