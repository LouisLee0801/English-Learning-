// 探勘模式：把三個平台的頁面、JSON 回應、連結存成快照，供撰寫解析器時參考。
// 用法：node scripts/deals/discover.mjs [line|eva|cathay ...]
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { openBrowser, loadPage } from './lib/browser.mjs';

const OUT = 'deals/raw';

const SOURCES = {
  line: {
    host: 'buy.line.me',
    start: [
      'https://buy.line.me/',
      'https://buy.line.me/u/partner/4321335',
      'https://buy.line.me/u/partner/4747560',
    ],
    follow: /商店|品牌|全部|回饋|優惠|活動|折價|coupon|campaign|shop|store|brand|merchant|event/i,
    skip: /\/u\/partner\/\d+|\/product\/|login|logout|help|faq|privacy|terms/i,
    robots: ['https://buy.line.me/robots.txt', 'https://buy.line.me/sitemap.xml'],
  },
  eva: {
    host: 'mall.brmile.com',
    start: ['https://mall.brmile.com/', 'https://mall.brmile.com/en/', 'https://mall.brmile.com/en/travel/easy-travel'],
    follow: /tw|zh|taiwan|台灣|中文|all|merchant|store|categor|offer|promo|bonus|活動|全部|商店/i,
    skip: /login|logout|signin|register|faq|privacy|terms|cookie/i,
    robots: ['https://mall.brmile.com/robots.txt', 'https://mall.brmile.com/sitemap.xml'],
  },
  cathay: {
    host: 'shop.asiamiles.com',
    start: [
      'https://shop.asiamiles.com/',
      'https://shop.asiamiles.com/en/',
      'https://shop.asiamiles.com/en/department-stores?orderBy=amount',
    ],
    follow: /tw|zh|taiwan|台灣|中文|all|merchant|store|categor|offer|promo|bonus|活動|全部|商店/i,
    skip: /login|logout|signin|register|faq|privacy|terms|cookie/i,
    robots: ['https://shop.asiamiles.com/robots.txt', 'https://shop.asiamiles.com/sitemap.xml'],
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

  for (const u of cfg.robots) {
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
  while (queue.length && n < cfg.start.length + MAX_FOLLOW) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const p = await loadPage(context, url);
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
    for (const j of p.json) summary.push(`  - json ${j.status} ${j.bytes}B ${j.url.slice(0, 200)}`);
    // 只在起始頁擴散，避免爬太深
    if (cfg.start.includes(url)) {
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
        if (cfg.follow.test(l.text) || cfg.follow.test(h.pathname + h.search)) queue.push(href);
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
