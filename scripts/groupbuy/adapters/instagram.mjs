// Instagram 官方 API（Business Discovery）：讀 watchlist.json 裡 IG 帳號的最新貼文。
// 需要自己的 IG 專業帳號連結 FB 粉專，並在 repo Secrets 設定 IG_ACCESS_TOKEN、IG_USER_ID；沒設定就略過。
import { postToItems } from '../lib/items.mjs';
import { codeOf } from '../lib/sources.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default {
  version: 1,
  minCount: 0,
  note: 'Instagram 官方 API（Business Discovery）：追蹤帳號最新 12 篇貼文',
  enabled: (env) => Boolean(env.IG_ACCESS_TOKEN && env.IG_USER_ID),
  async scrape({ context, watch, env, log }) {
    const ver = env.GRAPH_API_VERSION || 'v23.0';
    const posts = [];
    const stats = { accounts: [] };
    for (const u of watch.instagram.slice(0, 30)) {
      const fields = `business_discovery.username(${u}){username,name,media.limit(12){caption,permalink,timestamp,media_type}}`;
      const qs = new URLSearchParams({ fields, access_token: env.IG_ACCESS_TOKEN });
      const res = await context.request.get(`https://graph.facebook.com/${ver}/${env.IG_USER_ID}?${qs}`, { timeout: 30_000 });
      const j = await res.json().catch(() => ({}));
      if (j.error) {
        stats.accounts.push({ u, error: j.error.message?.slice(0, 120) });
        log(`@${u}: ${j.error.message}`);
        if (j.error.code === 190) throw new Error('IG_ACCESS_TOKEN 失效或過期（Graph API code 190）');
        continue;
      }
      const bd = j.business_discovery || {};
      for (const m of bd.media?.data || []) {
        const code = codeOf(m.permalink);
        if (!code) continue;
        posts.push({
          source: 'instagram',
          id: `instagram:${code}`,
          url: m.permalink,
          author: bd.username,
          authorName: bd.name || null,
          authorUrl: `https://www.instagram.com/${bd.username}/`,
          title: '',
          text: m.caption || '',
          postedAt: new Date(m.timestamp).toISOString(),
          via: 'api',
        });
      }
      stats.accounts.push({ u, posts: bd.media?.data?.length || 0 });
      await sleep(400);
    }
    const items = posts.flatMap((p) => postToItems(p, { minScore: 2 }));
    stats.items = items.length;
    return { items, stats };
  },
};
