// 全網優惠券／優惠情報來源。皆為公開頁面或公開 API，請求之間有間隔。
import * as C from '../lib/coupons.mjs';
import { pool } from '../lib/pool.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (context, url, headers = {}) => {
  const r = await context.request.get(url, { timeout: 45_000, headers });
  if (!r.ok()) throw new Error(`${url} → HTTP ${r.status()}`);
  return r.text();
};

/** PTT 省錢板：從最新一頁往回翻，收近 7 天的 [情報]／[分享] 標題 */
export const ptt = {
  minCount: 10,
  note: 'PTT Lifeismoney 板近 7 天情報（只取標題；內文有 Cloudflare 驗證）',
  async scrape({ context, today, log }) {
    const cutoff = new Date(Date.parse(`${today}T00:00:00+08:00`) - 7 * 86400000).toISOString().slice(0, 10);
    let url = 'https://www.ptt.cc/bbs/Lifeismoney/index.html';
    const deals = [];
    for (let i = 0; url && i < 25; i++) {
      let html;
      try {
        html = await get(context, url, { Cookie: 'over18=1' });
      } catch (e) {
        if (i === 0) throw e;
        log(`stop at page ${i}: ${e.message}`); // 被擋就保留已抓到的
        break;
      }
      const { posts, prev } = C.parsePttIndex(html, today);
      for (const p of posts) {
        const d = C.pttDeal(p);
        if (d) deals.push(d);
      }
      const dated = posts.filter((p) => p.date);
      if (i > 0 && dated.length && dated.every((p) => p.date < cutoff)) break;
      url = prev;
      await sleep(1500);
    }
    log(`posts ${deals.length}`);
    return deals.filter((d) => (d.publishedAt || '').slice(0, 10) >= cutoff);
  },
};

/** 食尚玩家優惠券：公開 API 分頁 */
export const supertaste = {
  minCount: 20,
  note: '食尚玩家 App 優惠券（需在 App／官網領券）',
  async scrape({ context, log }) {
    const deals = [];
    for (let page = 1, last = 1; page <= last && page <= 20; page++) {
      const j = JSON.parse(await get(context, `https://api.supertaste.tvbs.app/v1/coupons?page=${page}&per_page=24`, { Accept: 'application/json', Referer: 'https://supertaste.tvbs.com.tw/offers' }));
      last = j.meta?.last_page || 1;
      deals.push(...(j.data || []).map(C.supertasteDeal));
      await sleep(500);
    }
    log(`coupons ${deals.length}`);
    return deals;
  },
};

/** 康是美 最新消息（全部活動） */
export const cosmed = {
  minCount: 1,
  note: '康是美官網最新活動',
  async scrape({ context }) {
    const html = await get(context, 'https://www.cosmed.com.tw/news.aspx?c=2');
    return C.parseCosmedNews(html).map(C.cosmedDeal).filter(Boolean);
  },
};

/** 7-ELEVEN 首頁看板與精品集點 */
export const seven = {
  minCount: 1,
  note: '7-ELEVEN 官網首頁看板、精品集點活動',
  async scrape({ context, today }) {
    const html = await get(context, 'https://www.7-11.com.tw/');
    return C.parseSevenHome(html).map((x) => C.sevenDeal(x, today)).filter(Boolean);
  },
};

/** 漢堡王 官網線上點餐的「優惠券」分類 */
export const burgerking = {
  minCount: 3,
  note: '漢堡王官網線上點餐優惠券（官網／App 價格）',
  async scrape({ context }) {
    const page = await context.newPage();
    try {
      await page.goto('https://www.burgerking.com.tw/category/6', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
      return C.parseBurgerKing(await page.content()).map(C.burgerKingDeal);
    } finally {
      await page.close();
    }
  },
};

/** Google 新聞 RSS：依分類關鍵字掃近 7 天的優惠新聞 */
export const news = {
  minCount: 20,
  note: 'Google 新聞近 7 天優惠報導（依分類關鍵字搜尋）',
  async scrape({ context, log }) {
    const seen = new Set();
    const deals = [];
    let failed = 0;
    await pool(
      C.NEWS_QUERIES,
      2,
      async (q) => {
        try {
          for (const item of C.parseRss(await get(context, C.newsUrl(q)))) {
            const d = C.newsDeal(item);
            const key = d && d.title.replace(/[\s\p{P}]/gu, '').slice(0, 24);
            if (!d || seen.has(key)) continue;
            seen.add(key);
            deals.push(d);
          }
        } catch (e) {
          failed++;
          log('query failed', q, e.message);
        }
      },
      { delayMs: 800 },
    );
    if (failed === C.NEWS_QUERIES.length) throw new Error('所有新聞查詢都失敗');
    log(`news ${deals.length} (${failed} queries failed)`);
    return deals;
  },
};
