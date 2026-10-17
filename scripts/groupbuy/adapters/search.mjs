// 搜尋引擎索引：用 DuckDuckGo（近一週）找 Instagram、Facebook、Threads 的公開開團貼文。
// DuckDuckGo 每台機器連續查 2 次左右就回 202，所以每次排程輪替 2 組關鍵字、遇到 202 就停。
import * as S from '../lib/sources.mjs';
import { postToItems, rotate } from '../lib/items.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  version: 1,
  minCount: 0,
  note: 'DuckDuckGo 近一週索引：IG／FB／Threads 公開開團貼文（每次輪替 2 組關鍵字，累積 10 天）',
  async scrape({ context, watch, rotation, log }) {
    const queries = rotate(watch.keywords.search, 2, rotation * 2);
    const posts = [];
    const stats = { queries: [] };
    for (const [i, q] of queries.entries()) {
      if (i) await sleep(12_000);
      const res = await context.request.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&df=w`, {
        timeout: 30_000,
        headers: { Referer: 'https://html.duckduckgo.com/', 'Accept-Language': 'zh-TW,zh;q=0.9' },
      });
      const html = await res.text();
      if (S.ddgBlocked(res.status(), html)) {
        stats.queries.push({ q, status: res.status(), blocked: true });
        log(`"${q}" → ${res.status()} blocked, stop`);
        break;
      }
      const results = S.parseDdgHtml(html);
      const found = results.map((r) => S.igPostFromDdg(r) || S.fbPostFromDdg(r) || S.threadsPostFromDdg(r)).filter(Boolean);
      stats.queries.push({ q, status: res.status(), results: results.length, posts: found.length });
      log(`"${q}" → ${results.length} results, ${found.length} posts`);
      posts.push(...found);
    }
    if (queries.length && stats.queries.every((x) => x.blocked)) throw new Error('DuckDuckGo 擋下所有查詢（202），保留舊資料');
    const items = posts.flatMap((p) => postToItems(p));
    stats.items = items.length;
    return { items, stats };
  },
};
