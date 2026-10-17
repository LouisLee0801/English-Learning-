// 團媽網站／開團日曆：watchlist.json 的 pages。每次整頁重抓（頁面就是最新清單），抓失敗的頁面沿用上次資料。
import * as S from '../lib/sources.mjs';
import { postToItems } from '../lib/items.mjs';
import { taipeiStamp } from '../../../groupbuy/js/parse.js';

export default {
  version: 1,
  minCount: 0,
  accumulate: false,
  note: '團媽網站／開團日曆（watchlist.json 的 pages，每次整頁重抓）',
  async scrape({ context, watch, prev = [], log }) {
    const items = [];
    const stats = { pages: [] };
    for (const p of watch.pages) {
      const page = await context.newPage();
      try {
        const res = await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
        if ((res?.status() ?? 0) >= 400) throw new Error(`HTTP ${res.status()}`);
        // 部落格的清單常是「商品名＝超連結」，網址不會出現在文字裡，所以連結一起帶出來比對
        const { text, links } = await page.evaluate(() => ({
          text: document.body?.innerText || '',
          links: [...document.querySelectorAll('a[href]')].map((a) => ({ text: (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 200), href: a.href })).filter((l) => l.text && /^https?:/.test(l.href)),
        }));
        const ref = taipeiStamp();
        const rows = S.parseCalendarText(text, { ref, pageUrl: p.url, links });
        items.push(...rows.flatMap((r) => postToItems(S.pagePost(p, r, ref))));
        stats.pages.push({ name: p.name, items: rows.length });
        log(`${p.name || p.url} → ${rows.length} items`);
      } catch (e) {
        const kept = prev.filter((x) => x.authorUrl === p.url);
        items.push(...kept);
        stats.pages.push({ name: p.name, error: String(e.message).split('\n')[0].slice(0, 120), kept: kept.length });
        log(`${p.name || p.url} failed, kept ${kept.length}: ${e.message}`);
      } finally {
        await page.close();
      }
    }
    stats.items = items.length;
    return { items, stats };
  },
};
