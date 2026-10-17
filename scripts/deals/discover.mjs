// 探勘模式：把三個平台的頁面、JSON 回應、連結存成快照，供撰寫解析器時參考。
// 用法：node scripts/deals/discover.mjs [line|eva|cathay ...]
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { openBrowser, loadPage } from './lib/browser.mjs';

const OUT = 'deals/raw';

// 第二輪探勘：指定頁面＋少量跟隨，確認分頁、詳情頁與台灣版
const SOURCES = {
  line: {
    host: 'buy.line.me',
    start: [
      'https://buy.line.me/brand',
      'https://buy.line.me/specialoffer',
      'https://buy.line.me/specialoffer?filter=discount',
      'https://buy.line.me/specialoffer/travel',
      'https://buy.line.me/campaigns',
      'https://buy.line.me/u/partner/4747361',
    ],
    clickMore: /^(查看)?(更多|全部)/,
    follow: /\/brand\/|\/specialoffer\/\d+|classification=/i,
    skip: /\/u\/partner\/\d+|\/product\/|login|logout|help|faq|privacy|terms|rest-api|\/s\/|\/t\/\?/i,
    maxFollow: 4,
    requests: [],
  },
  eva: {
    host: 'mall.brmile.com',
    setup: 'https://mall.brmile.com/zh/?countryID=200',
    start: [
      'https://mall.brmile.com/zh/az',
      'https://mall.brmile.com/zh/department-stores/shopee-taiwan',
      'https://mall.brmile.com/zh/travel/klook-taiwan',
      'https://mall.brmile.com/zh/top/vouchers',
    ],
    follow: null,
    requests: [
      ['https://mall.brmile.com/zh/az?orderBy=popular&letter=&page=2', { 'X-Requested-With': 'XMLHttpRequest' }],
      ['https://mall.brmile.com/zh/az?orderBy=popular&letter=&page=2', {}],
    ],
  },
  cathay: {
    host: 'shop.asiamiles.com',
    setup: 'https://shop.asiamiles.com/zh/?countryID=200',
    start: [
      'https://shop.asiamiles.com/zh/az',
      'https://shop.asiamiles.com/zh/top/special-offers',
      'https://shop.asiamiles.com/zh/top/vouchers',
    ],
    // 從所有商戶頁挑前幾個商戶詳情頁
    follow: /^https:\/\/shop\.asiamiles\.com\/zh\/[a-z-]+\/[a-z0-9-]+\?/i,
    skip: /login|logout|signin|register|faq|privacy|terms|cookie|\/top\/|\/az|how-it-works/i,
    maxFollow: 3,
    requests: [
      ['https://shop.asiamiles.com/zh/az?orderBy=popular&letter=&page=2', { 'X-Requested-With': 'XMLHttpRequest' }],
    ],
  },
};

const MAX_FOLLOW = 10;
const slug = (u) =>
  u
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

async function discover(name, cfg, context) {
  const dir = join(OUT, name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const summary = [`# ${name} discovery ${new Date().toISOString()}`, ''];

  if (cfg.setup) {
    const p = await loadPage(context, cfg.setup, { scrolls: 0, wait: 500 });
    summary.push(`- setup ${cfg.setup} → ${p.status} ${p.finalUrl} "${p.title}"`);
  }
  for (const [u, headers] of cfg.requests || []) {
    try {
      const res = await context.request.get(u, { timeout: 30_000, headers });
      const body = await res.text();
      await writeFile(join(dir, `_req-${slug(u)}-${headers['X-Requested-With'] ? 'xhr' : 'plain'}.txt`), `${res.status()} ${res.headers()['content-type']}\n${body.slice(0, 600_000)}`);
      summary.push(`- request ${u} ${JSON.stringify(headers)} → ${res.status()} ${body.length}B`);
    } catch (e) {
      summary.push(`- request ${u} → ERROR ${String(e.message).slice(0, 200)}`);
    }
  }
  for (const u of cfg.robots || []) {
    try {
      const res = await context.request.get(u, { timeout: 30_000 });
      await writeFile(join(dir, `_${slug(u)}.txt`), `${res.status()}\n${(await res.text()).slice(0, 200_000)}`);
      summary.push(`- ${u} → ${res.status()}`);
    } catch (e) {
      summary.push(`- ${u} → ERROR ${String(e.message).slice(0, 200)}`);
    }
  }

  const seen = new Set();
  const queue = [...cfg.start];
  let n = 0;
  let followed = 0;
  while (queue.length && n < cfg.start.length + (cfg.maxFollow ?? MAX_FOLLOW)) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const p = await loadPage(context, url, { clickMore: cfg.clickMore, maxClicks: cfg.clickMore ? 8 : 0 });
    const id = `${String(n++).padStart(2, '0')}-${slug(url)}`;
    const { html, ...rest } = p;
    await writeFile(join(dir, `${id}.html`), html.slice(0, 1_500_000));
    await writeFile(
      join(dir, `${id}.json`),
      JSON.stringify({ ...rest, text: rest.text.slice(0, 60_000), links: dedupeLinks(rest.links) }, null, 1),
    );
    summary.push(
      `- [${id}] ${url} → status ${p.status} final ${p.finalUrl} title "${p.title}" html ${html.length}B json ${p.json.length} links ${p.links.length}${p.error ? ` ERROR ${p.error}` : ''}`,
    );
    for (const j of p.json) summary.push(`  - json ${j.status} ${j.bytes}B ${j.url.slice(0, 200)} ${(j.request || '').slice(0, 160)}`);
    // 只在起始頁擴散，避免爬太深
    if (cfg.follow && cfg.start.includes(url)) {
      for (const l of dedupeLinks(p.links)) {
        let h;
        try {
          h = new URL(l.href);
        } catch {
          continue;
        }
        if (!h.hostname.endsWith(cfg.host)) continue;
        const href = h.href.replace(/#.*$/, '');
        if (seen.has(href) || queue.includes(href) || cfg.skip.test(href)) continue;
        if (followed >= (cfg.maxFollow ?? MAX_FOLLOW)) break;
        if (cfg.follow.test(href) || cfg.follow.test(l.text)) {
          queue.push(href);
          followed++;
        }
      }
    }
  }
  await writeFile(join(dir, '_summary.md'), summary.join('\n') + '\n');
  console.log(summary.join('\n'));
}

function dedupeLinks(links) {
  const m = new Map();
  for (const l of links) if (!m.has(l.href) || (!m.get(l.href).text && l.text)) m.set(l.href, l);
  return [...m.values()].slice(0, 3000);
}

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SOURCES);
const { browser, context } = await openBrowser();
try {
  for (const name of wanted) {
    try {
      await discover(name, SOURCES[name], context);
    } catch (e) {
      console.error(`[${name}] discovery failed:`, e);
    }
  }
} finally {
  await browser.close();
}
