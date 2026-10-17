// Threads：未登入的公開搜尋＋追蹤帳號的個人頁。
// 未登入搜尋每台機器每次只給搜 1 次（之後回「查無結果」），所以每次排程輪替一個關鍵字、靠累積補齊。
// 設定 THREADS_ACCESS_TOKEN（官方 API，需 threads_keyword_search 權限）後改用官方關鍵字搜尋，每次可搜多組。
import * as S from '../lib/sources.mjs';
import { postToItems, rotate } from '../lib/items.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function loadHtml(context, url) {
  const page = await context.newPage();
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    return { status: res?.status() ?? 0, html: await page.content() };
  } finally {
    await page.close();
  }
}

async function apiSearch(context, token, keywords, log) {
  const posts = [];
  for (const q of keywords) {
    const qs = new URLSearchParams({ q, search_type: 'RECENT', fields: 'id,text,media_type,permalink,timestamp,username,is_reply', limit: '50', access_token: token });
    const res = await context.request.get(`https://graph.threads.net/v1.0/keyword_search?${qs}`, { timeout: 30_000 });
    const j = await res.json().catch(() => ({}));
    if (!res.ok() || j.error) throw new Error(`Threads API ${res.status()} ${j.error?.message || ''}`.trim());
    for (const m of j.data || []) {
      const code = S.codeOf(m.permalink);
      if (!code || !m.username) continue;
      posts.push({
        source: 'threads',
        id: `threads:${code}`,
        url: `https://www.threads.com/@${m.username}/post/${code}`,
        author: m.username,
        authorName: null,
        authorUrl: `https://www.threads.com/@${m.username}`,
        title: '',
        text: m.text || '',
        postedAt: new Date(m.timestamp).toISOString(),
        via: 'api',
        isReply: Boolean(m.is_reply),
      });
    }
    log(`api "${q}" → ${j.data?.length || 0}`);
    await sleep(500);
  }
  return posts;
}

export default {
  version: 1,
  minCount: 0,
  note: 'Threads 公開搜尋（每次輪替 1 個關鍵字，累積 10 天）＋追蹤帳號',
  async scrape({ context, watch, rotation, env, log }) {
    const posts = [];
    const stats = {};
    if (env.THREADS_ACCESS_TOKEN) {
      const kws = rotate(watch.keywords.threads, 5, rotation);
      posts.push(...(await apiSearch(context, env.THREADS_ACCESS_TOKEN, kws, log)));
      stats.api = { keywords: kws, posts: posts.length };
    } else {
      // 輪到的關鍵字查無結果時，改用第一個（通常是「開團」）再試一次
      const [kw] = rotate(watch.keywords.threads, 1, rotation);
      stats.search = [];
      for (const q of [...new Set([kw, watch.keywords.threads[0]])]) {
        const { status, html } = await loadHtml(context, `https://www.threads.com/search/?q=${encodeURIComponent(q)}&serp_type=default&filter=recent`);
        const found = S.parseThreadsHtml(html);
        const limited = !found.length && S.threadsNoResults(html);
        stats.search.push({ keyword: q, status, posts: found.length, limited });
        log(`search "${q}" → ${status}, ${found.length} posts${limited ? '（查無結果／限流）' : ''}`);
        posts.push(...found.map((p) => S.threadsPost(p, 'search')));
        if (found.length) break;
        await sleep(5000);
      }
    }
    let watched = 0;
    for (const u of watch.threads.slice(0, 20)) {
      await sleep(4000);
      try {
        const { html } = await loadHtml(context, `https://www.threads.com/@${encodeURIComponent(u)}`);
        const found = S.parseThreadsHtml(html).filter((p) => p.username.toLowerCase() === u.toLowerCase());
        watched += found.length;
        posts.push(...found.map((p) => S.threadsPost(p, 'watch')));
      } catch (e) {
        log(`@${u} failed: ${String(e.message).split('\n')[0]}`);
      }
    }
    stats.watch = { accounts: Math.min(watch.threads.length, 20), posts: watched };
    // 追蹤的團主每篇都可能是開團文，postToItems 對 watch／api 來源門檻放寬
    const items = posts.flatMap((p) => postToItems(p));
    stats.items = items.length;
    return { items, stats };
  },
};
