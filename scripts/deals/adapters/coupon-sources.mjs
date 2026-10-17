// 全網優惠券／優惠情報來源。皆為公開頁面或公開 API，請求之間有間隔。
import * as C from '../lib/coupons.mjs';
import { pool } from '../lib/pool.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 用瀏覽器載入（需要 JS 渲染或有機器人驗證的網站） */
async function render(page, url) {
  const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
  // Cloudflare 檢查頁會自動跳轉，多等一下
  if (/請稍候|Just a moment/i.test(await page.title())) await page.waitForTimeout(8000);
  const status = res?.status() ?? 0;
  const html = await page.content();
  if (status >= 400 && !/r-ent|list--|gaLogOpenWin/.test(html)) throw new Error(`${url} → HTTP ${status}`);
  return html;
}
const get = async (context, url, headers = {}) => {
  const r = await context.request.get(url, { timeout: 45_000, headers });
  if (!r.ok()) throw new Error(`${url} → HTTP ${r.status()}`);
  return r.text();
};

/**
 * PTT 省錢板：Atom 訂閱源（含內文開頭）＋ 最新一頁列表（推文數）。
 * 舊頁有 Cloudflare 驗證抓不到，所以每次合併上次已抓、7 天內的文章，排程每 6 小時跑一次補齊。
 */
export const ptt = {
  minCount: 5,
  note: 'PTT Lifeismoney 板近 7 天情報（Atom 訂閱源，每 6 小時累積）',
  async scrape({ context, today, prev = [], log }) {
    const cutoff = new Date(Date.parse(`${today}T00:00:00+08:00`) - 7 * 86400000).toISOString().slice(0, 10);
    const page = await context.newPage();
    let entries = [];
    const pushes = new Map();
    try {
      try {
        entries = C.parseAtom(await get(context, 'https://www.ptt.cc/atom/Lifeismoney.xml'));
      } catch (e) {
        log('atom via request failed, retry in browser:', e.message);
        await page.goto('https://www.ptt.cc/atom/Lifeismoney.xml', { timeout: 60_000 });
        entries = C.parseAtom(await page.content());
      }
      try {
        for (const p of C.parsePttIndex(await render(page, 'https://www.ptt.cc/bbs/Lifeismoney/index.html'), today).posts) pushes.set(p.url, p.pushes);
      } catch (e) {
        log('index failed (push counts skipped):', e.message);
      }
    } finally {
      await page.close();
    }
    const fresh = entries.map((e) => C.pttDeal({ ...e, pushes: pushes.get(e.url) })).filter(Boolean);
    const ids = new Set(fresh.map((d) => d.id));
    const kept = prev.filter((d) => !ids.has(d.id) && (d.publishedAt || '').slice(0, 10) >= cutoff);
    log(`atom ${entries.length}, deals ${fresh.length}, kept from previous runs ${kept.length}`);
    if (!fresh.length && !kept.length) throw new Error('Atom 訂閱源沒有資料');
    return [...fresh, ...kept].filter((d) => (d.publishedAt || '').slice(0, 10) >= cutoff);
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
    const page = await context.newPage();
    try {
      return C.parseCosmedNews(await render(page, 'https://www.cosmed.com.tw/news.aspx?c=2')).map(C.cosmedDeal).filter(Boolean);
    } finally {
      await page.close();
    }
  },
};

/** 7-ELEVEN 首頁看板與精品集點 */
export const seven = {
  minCount: 1,
  note: '7-ELEVEN 官網首頁看板、精品集點活動',
  async scrape({ context, today }) {
    const page = await context.newPage();
    try {
      const items = C.parseSevenHome(await render(page, 'https://www.7-11.com.tw/'));
      return [...items.map((x) => C.sevenDeal(x, today)), C.sevenCollectDeal(items, today)].filter(Boolean);
    } finally {
      await page.close();
    }
  },
};

/** 漢堡王 官網線上點餐的「優惠券」分類 */
export const burgerking = {
  minCount: 3,
  note: '漢堡王官網線上點餐優惠券（官網／App 價格）',
  async scrape({ context }) {
    const page = await context.newPage();
    try {
      return C.parseBurgerKing(await render(page, 'https://www.burgerking.com.tw/category/6')).map(C.burgerKingDeal);
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
