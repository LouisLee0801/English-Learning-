// 探勘模式：測試各團購來源能不能從 GitHub Actions 抓到，並把頁面、JSON 回應、連結存成快照（groupbuy/raw/），供撰寫解析器參考。
// 用法：node scripts/groupbuy/discover.mjs [探勘項目 ...]（不指定 = 全部）
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { openBrowser, loadPage } from '../deals/lib/browser.mjs';

const OUT = 'groupbuy/raw';
const q = encodeURIComponent;
const bing = (s) => `https://www.bing.com/search?format=rss&q=${q(s)}&setlang=zh-Hant&cc=TW&count=50`;

// 名稱 → { mode: 'req' 直接 HTTP 請求 | 'page' 瀏覽器載入, url, headers, follow 起始頁上要跟進的連結, maxFollow }
const PROBES = {
  'ptt-buytogether-atom': { mode: 'req', url: 'https://www.ptt.cc/atom/BuyTogether.xml' },
  'ptt-babymother-atom': { mode: 'req', url: 'https://www.ptt.cc/atom/BabyMother.xml' },
  'ptt-buytogether-index': { mode: 'page', url: 'https://www.ptt.cc/bbs/BuyTogether/index.html', follow: /\/bbs\/BuyTogether\/M\.\d+/, maxFollow: 2 },
  'threads-search': { mode: 'page', url: `https://www.threads.com/search?q=${q('開團')}&serp_type=default&filter=recent` },
  'threads-profile': { mode: 'page', url: 'https://www.threads.com/@instagram' },
  'ig-tag': { mode: 'page', url: `https://www.instagram.com/explore/tags/${q('開團')}/` },
  'ig-profile': { mode: 'page', url: 'https://www.instagram.com/instagram/' },
  'ig-profile-api': { mode: 'req', url: 'https://www.instagram.com/api/v1/users/web_profile_info/?username=instagram', headers: { 'X-IG-App-ID': '936619743392459' } },
  'fb-hashtag': { mode: 'page', url: `https://www.facebook.com/hashtag/${q('開團')}` },
  'fb-page': { mode: 'page', url: 'https://www.facebook.com/instagram' },
  'bing-rss-threads': { mode: 'req', url: bing('site:threads.com 開團') },
  'bing-rss-ig': { mode: 'req', url: bing('site:instagram.com 開團 結單') },
  'bing-rss-fb': { mode: 'req', url: bing('site:facebook.com 開團 團購') },
  'bing-rss-web': { mode: 'req', url: bing('開團 結單 團購') },
  'bing-robots': { mode: 'req', url: 'https://www.bing.com/robots.txt' },
  'ddg-html': { mode: 'req', url: `https://html.duckduckgo.com/html/?q=${q('site:threads.com 開團')}` },
  'yahoo-tw': { mode: 'req', url: `https://tw.search.yahoo.com/search?p=${q('site:threads.com 開團')}` },
  'gnews-rss': { mode: 'req', url: `https://news.google.com/rss/search?q=${q('團購 開團 when:7d')}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant` },
  'pixnet-search': { mode: 'page', url: `https://www.pixnet.net/searcharticle?q=${q('開團')}`, follow: /pixnet\.net\/blog\/post(s)?\//, maxFollow: 2 },
  'pixnet-tag': { mode: 'page', url: `https://www.pixnet.net/tags/${q('團購')}`, follow: /pixnet\.net\/blog\/post(s)?\//, maxFollow: 1 },
  'pixnet-emma': { mode: 'req', url: `https://emma.pixnet.cc/blog/articles/search?key=${q('團購')}&format=json` },
  ihergo: { mode: 'page', url: 'https://www.ihergo.com/', follow: /ihergo\.com\/.*(group|buy|item|product|tuan)/i, maxFollow: 2 },
  portaly: { mode: 'page', url: 'https://portaly.cc/' },
  // 第二輪：Threads「最新」排序與分類關鍵字、DuckDuckGo 近一週、PTT 18 歲驗證、團媽開團日曆頁
  'threads-recent': { mode: 'page', url: `https://www.threads.com/search/?q=${q('開團')}&serp_type=default&filter=recent` },
  'threads-recent-baby': { mode: 'page', url: `https://www.threads.com/search/?q=${q('開團 寶寶')}&serp_type=default&filter=recent` },
  'threads-close': { mode: 'page', url: `https://www.threads.com/search/?q=${q('收單')}&serp_type=default&filter=recent` },
  'ddg-ig-week': { mode: 'req', url: `https://html.duckduckgo.com/html/?q=${q('site:instagram.com 開團')}&df=w` },
  'ddg-threads-week': { mode: 'req', url: `https://html.duckduckgo.com/html/?q=${q('site:threads.com 開團 結單')}&df=w` },
  'ddg-fb-week': { mode: 'req', url: `https://html.duckduckgo.com/html/?q=${q('site:facebook.com 開團 結單')}&df=w` },
  'ptt-buytogether-atom-page': { mode: 'page', url: 'https://www.ptt.cc/atom/BuyTogether.xml' },
  'ptt-buytogether-over18': { mode: 'page', url: 'https://www.ptt.cc/bbs/BuyTogether/index.html', follow: /\/bbs\/BuyTogether\/M\.\d+/, maxFollow: 2 },
  'ptt-babymother-index': { mode: 'page', url: 'https://www.ptt.cc/bbs/BabyMother/index.html' },
  'calendar-page': { mode: 'page', url: 'https://site-4031271-2277-6785.mystrikingly.com/' },
  // 第三輪：連續搜尋會不會被限流（每次間隔 20 秒、各用新的瀏覽器環境）
  'tq-1': { mode: 'page', fresh: true, url: `https://www.threads.com/search/?q=${q('團購')}&serp_type=default` },
  'tq-2': { mode: 'page', fresh: true, wait: 20_000, url: `https://www.threads.com/search/?q=${q('結單')}&serp_type=default` },
  'tq-3': { mode: 'page', fresh: true, wait: 20_000, url: `https://www.threads.com/search/?q=${q('開團 嬰兒')}&serp_type=default` },
  'tq-4': { mode: 'page', fresh: true, wait: 20_000, url: `https://www.threads.com/search/?q=${q('開團啦')}&serp_type=default` },
  'tq-5': { mode: 'page', wait: 20_000, url: `https://www.threads.com/search/?q=${q('團購 家電')}&serp_type=default` },
  'dq-1': { mode: 'req', url: `https://html.duckduckgo.com/html/?q=${q('site:instagram.com 開團 結單')}&df=w` },
  'dq-2': { mode: 'req', wait: 15_000, url: `https://html.duckduckgo.com/html/?q=${q('site:instagram.com 開團 寶寶')}&df=w` },
  'dq-3': { mode: 'req', wait: 15_000, url: `https://html.duckduckgo.com/html/?q=${q('site:instagram.com 開團 家電')}&df=w` },
  'dq-4': { mode: 'req', wait: 15_000, url: `https://html.duckduckgo.com/html/?q=${q('site:facebook.com 開團')}&df=w` },
  'dq-5': { mode: 'req', wait: 15_000, url: `https://lite.duckduckgo.com/lite/?q=${q('site:instagram.com 團購 開團期間')}&df=w` },
  'dq-6': { mode: 'req', wait: 15_000, url: `https://html.duckduckgo.com/html/?q=${q('site:threads.com 開團啦')}&df=w` },
  // 第四輪：親子部落客／團媽的團購預告、行事曆頁
  'gm-adrianne': { mode: 'page', url: 'https://adriannelife.com/blog/groupbuying' },
  'gm-nick': { mode: 'page', url: 'https://nickjufu.tw/6358/' },
  'gm-esther7': { mode: 'page', url: 'https://www.esther7.com/2026/03/GroupBuying-1.html?m=0' },
  'gm-rubee': { mode: 'page', url: 'https://rubeelittle.com/post-228261311/' },
  'gm-weima': { mode: 'page', url: 'https://yujuan162.pixnet.net/blog/posts/8225774197' },
  'gm-bigv': { mode: 'page', url: 'https://bigv.com.tw/shopping/' },
  'gm-eva': { mode: 'page', url: 'https://evalife.tw/groupbuy/' },
  'gm-bobowin': { mode: 'page', url: `https://bobowin.blog/category/life/${q('團購')}/` },
  'gm-kiki': { mode: 'page', url: 'https://kikimami.tw/' },
  'gm-coco': { mode: 'page', url: 'https://shop.obodo.tw/' },
  'gm-chien': { mode: 'page', url: 'https://chienchien99.com/category/smartbuy/' },
  // 團媽 FB 粉專：確認網址與名稱（未登入多半只看得到標題），再交給 RSS 產生器
  'fb-weima': { mode: 'page', fresh: true, wait: 5_000, url: 'https://www.facebook.com/s.smilelife' },
  'fb-esther7': { mode: 'page', fresh: true, wait: 5_000, url: 'https://www.facebook.com/estherhsiao0202/' },
  'fb-eva': { mode: 'page', fresh: true, wait: 5_000, url: 'https://www.facebook.com/evalife.cc/' },
  'fb-kiki': { mode: 'page', fresh: true, wait: 5_000, url: 'https://www.facebook.com/kikimamitw' },
  'fb-rubee': { mode: 'page', fresh: true, wait: 5_000, url: 'https://www.facebook.com/RubeeLittle/' },
  'fb-coco': { mode: 'page', fresh: true, wait: 5_000, url: 'https://www.facebook.com/cutemoonbaby' },
  'rssapp-pricing': { mode: 'page', url: 'https://rss.app/pricing' },
  'fetchrss-prices': { mode: 'page', url: 'https://fetchrss.com/prices' },
  'fetchrss-home': { mode: 'page', url: 'https://fetchrss.com/' },
  'fetchrss-fb': { mode: 'page', url: 'https://fetchrss.com/source/facebook' },
  'rssapp-fb-help': { mode: 'page', url: 'https://help.rss.app/en/articles/11095832-how-to-create-rss-feeds-from-facebook' },
  // 使用者建立的 FetchRSS feed
  'feed-1': { mode: 'req', url: 'https://fetchrss.com/feed/1xI4OdGNFATb1xI4Ou23m1fY.rss' },
  // 比價：各購物網站的搜尋（同一個商品）
  'pc-pchome-v43': { mode: 'req', url: `https://ecshweb.pchome.com.tw/search/v4.3/all/results?q=${q('OXO 保鮮盒')}&page=1&pageCount=20&sort=rnk/dc` },
  'pc-pchome-v33': { mode: 'req', url: `https://ecshweb.pchome.com.tw/search/v3.3/all/results?q=${q('OXO 保鮮盒')}&page=1&sort=rnk/dc` },
  'pc-momo': { mode: 'page', url: `https://www.momoshop.com.tw/search/searchShop.jsp?keyword=${q('OXO 保鮮盒')}&searchType=1&curPage=1` },
  'pc-momo-m': { mode: 'page', url: `https://m.momoshop.com.tw/search.momo?searchKeyword=${q('OXO 保鮮盒')}&cateLevel=-1` },
  'pc-yahoo': { mode: 'page', url: `https://tw.buy.yahoo.com/search/product?p=${q('OXO 保鮮盒')}` },
  'pc-coupang': { mode: 'page', fresh: true, url: `https://www.tw.coupang.com/search?q=${q('OXO 保鮮盒')}` },
  'pc-biggo': { mode: 'page', url: `https://biggo.com.tw/s/${q('OXO 保鮮盒')}/` },
  'pc-momo-req': { mode: 'req', url: `https://www.momoshop.com.tw/search/${q('萬歲牌 甘栗仁')}?searchType=1&curPage=1`, headers: { 'accept-language': 'zh-TW,zh;q=0.9' } },
  'pc-yahoo-req': { mode: 'req', url: `https://tw.buy.yahoo.com/search/product?p=${q('萬歲牌 甘栗仁')}`, headers: { 'accept-language': 'zh-TW,zh;q=0.9' } },
  'pc-biggo-req': { mode: 'req', url: `https://biggo.com.tw/s/${q('萬歲牌 甘栗仁')}/`, headers: { 'accept-language': 'zh-TW,zh;q=0.9' } },
  'pc-pchome-2': { mode: 'req', url: `https://ecshweb.pchome.com.tw/search/v4.3/all/results?q=${q('萬歲牌 甘栗仁')}&page=1&pageCount=20&sort=rnk/dc` },
  'pc-biggo-2': { mode: 'page', url: `https://biggo.com.tw/s/${q('BAGSMART 後背包')}/` },
};

// 第三方網頁偶爾內嵌金鑰；快照寫檔前一律遮蔽，避免進 repo
const SECRET_PATTERNS = [
  /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  /\bAIza[0-9A-Za-z_-]{35}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
  /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/g,
  /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
  /\bEAA[A-Za-z0-9]{40,}\b/g, // Meta access token
  /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
];
const scrub = (s) => SECRET_PATTERNS.reduce((t, re) => t.replace(re, '[REDACTED]'), String(s));
const slug = (u) => u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60);

function dedupeLinks(links) {
  const m = new Map();
  for (const l of links) if (!m.has(l.href) || (!m.get(l.href).text && l.text)) m.set(l.href, l);
  return [...m.values()].slice(0, 2000);
}

async function probe(name, cfg, shared, summary) {
  if (cfg.wait) await new Promise((r) => setTimeout(r, cfg.wait));
  const context = cfg.fresh ? await shared.browser().newContext({ locale: 'zh-TW', timezoneId: 'Asia/Taipei' }) : shared.context;
  try {
    await probeIn(name, cfg, context, summary);
  } finally {
    if (cfg.fresh) await context.close();
  }
}

async function probeIn(name, cfg, context, summary) {
  const dir = join(OUT, name);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  if (cfg.mode === 'req') {
    try {
      const res = await context.request.get(cfg.url, { timeout: 30_000, headers: cfg.headers || {}, maxRedirects: 5 });
      const body = await res.text();
      await writeFile(join(dir, 'response.txt'), scrub(`${res.status()} ${res.url()}\n${JSON.stringify(res.headers())}\n\n${body.slice(0, 800_000)}`));
      summary.push(`- **${name}** req ${cfg.url} → ${res.status()} ${body.length}B ${res.headers()['content-type'] || ''} final ${res.url()}`);
    } catch (e) {
      summary.push(`- **${name}** req ${cfg.url} → ERROR ${String(e.message).split('\n')[0].slice(0, 200)}`);
    }
    return;
  }
  const queue = [cfg.url];
  const seen = new Set();
  for (let n = 0; queue.length && n <= (cfg.maxFollow || 0); n++) {
    const url = queue.shift();
    seen.add(url);
    const p = await loadPage(context, url, { scrolls: 3, wait: 2000 });
    const { html, ...rest } = p;
    const id = String(n).padStart(2, '0');
    await writeFile(join(dir, `${id}.html`), scrub(html.slice(0, 1_500_000)));
    const links = dedupeLinks(rest.links);
    await writeFile(join(dir, `${id}.json`), scrub(JSON.stringify({ ...rest, text: rest.text.slice(0, 60_000), links }, null, 1)));
    summary.push(`- **${name}** [${id}] ${url} → ${p.status} final ${p.finalUrl} title "${p.title}" html ${html.length}B text ${rest.text.length}ch json ${p.json.length} links ${links.length}${p.error ? ` ERROR ${p.error}` : ''}`);
    for (const j of p.json.slice(0, 15)) summary.push(`  - json ${j.status} ${j.bytes}B ${j.url.slice(0, 160)}`);
    summary.push(`  - text: ${rest.text.replace(/\s+/g, ' ').slice(0, 300)}`);
    if (n === 0 && cfg.follow) {
      for (const l of links) {
        if (queue.length >= (cfg.maxFollow || 0)) break;
        if (!seen.has(l.href) && !queue.includes(l.href) && cfg.follow.test(l.href)) queue.push(l.href);
      }
    }
  }
}

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PROBES);
const summary = [`# groupbuy discovery ${new Date().toISOString()}`, ''];
const { browser, context } = await openBrowser();
// PTT 部分看板（合購板）要先點「已滿 18 歲」
await context.addCookies([{ name: 'over18', value: '1', domain: '.ptt.cc', path: '/' }]);
try {
  for (const name of wanted) {
    if (!PROBES[name]) {
      summary.push(`- **${name}** unknown probe`);
      continue;
    }
    try {
      await probe(name, PROBES[name], { context, browser: () => browser }, summary);
    } catch (e) {
      summary.push(`- **${name}** FAILED ${String(e.message).split('\n')[0].slice(0, 200)}`);
    }
  }
} finally {
  await browser.close();
}
await mkdir(OUT, { recursive: true });
await writeFile(join(OUT, `_summary-${wanted.length === Object.keys(PROBES).length ? 'all' : slug(wanted.join('-'))}.md`), summary.join('\n') + '\n');
console.log(summary.join('\n'));
