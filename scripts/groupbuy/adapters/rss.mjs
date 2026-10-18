// FB 粉專（RSS）：watchlist.json 的 rss，每個 feed 是 RSS.app／FetchRSS 免費版把團媽粉專轉成的 RSS。
// 免費版每 24 小時更新一次、每個 feed 只有最新 5 則，所以結果和其他社群來源一樣累積（有結單日留到結單隔天）。
import * as S from '../lib/sources.mjs';
import { postToItems } from '../lib/items.mjs';

const feeds = (watch) => watch.rss.filter((r) => r.feed);

export default {
  version: 1,
  minCount: 0,
  note: 'FB 粉專（RSS.app／FetchRSS 免費 feed，每天更新、結果累積）',
  // 還沒填任何 feed 網址就略過，不產生空檔案
  enabled: (env, watch) => feeds(watch).length > 0,
  async scrape({ context, watch, log }) {
    const items = [];
    const stats = { feeds: [] };
    for (const r of feeds(watch)) {
      try {
        const res = await context.request.get(r.feed, {
          timeout: 30_000,
          headers: { accept: 'application/rss+xml, application/atom+xml, application/feed+json, application/xml;q=0.9, */*;q=0.8' },
        });
        if (!res.ok()) throw new Error(`HTTP ${res.status()}`);
        const posts = S.parseFeed(await res.text()).items.map((it) => S.feedPost(r, it));
        // 團媽自己的粉專，門檻比照追蹤帳號（postToItems 對 via=rss 用 2 分）
        const got = posts.flatMap((p) => postToItems(p));
        items.push(...got);
        // latest：feed 裡最新一則的時間，太舊代表 feed 停止更新
        stats.feeds.push({ name: r.name, posts: posts.length, items: got.length, latest: posts.map((p) => p.postedAt).filter(Boolean).sort().pop() || null });
        log(`${r.name || r.feed} → ${posts.length} posts, ${got.length} items`);
      } catch (e) {
        stats.feeds.push({ name: r.name, error: String(e.message).split('\n')[0].slice(0, 120) });
        log(`${r.name || r.feed} failed: ${e.message}`);
      }
    }
    // 全部 feed 都失敗才算來源失敗（保留上一次的資料）
    if (stats.feeds.length && stats.feeds.every((f) => f.error)) throw new Error(`${stats.feeds.length} 個 feed 都讀取失敗：${stats.feeds[0].error}`);
    stats.items = items.length;
    return { items, stats };
  },
};
