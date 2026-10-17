// 長榮 Mileage Mall／國泰 Milesback 共用流程：切台灣版 → 所有商戶（分頁）→ 各商戶詳情 → 優惠券。
import { parseMerchantList, parsePager, parseDetail, parseVouchers } from '../lib/valuedynamx.mjs';
import { parseMiles, milesPer100Twd, parseFixedMiles, parseDiscount, clean } from '../lib/normalize.mjs';
import { pool, hash } from '../lib/pool.mjs';

const TW_COUNTRY_ID = 200;
const MAX_PAGES = 40;
const md = (ymd) => (ymd ? ymd.slice(5).replace('-', '/') : '');
const displayName = (n) => clean(n).replace(/\s+Taiwan$/i, '');
const NEWBIE = /首次訂閱|首次購買|首購|新客|新會員|新用戶|first[- ]time|new customer/i;

function commonConditions(d, unit) {
  const conditions = [];
  for (const t of d?.tiers?.slice(0, 6) || []) {
    conditions.push(`${t.label || '一般商品'}：${t.rate}${t.endAt ? `（${md(t.startAt)}–${md(t.endAt)}）` : ''}`);
  }
  conditions.push(...(d?.conditions || []).slice(0, 8));
  if (d?.creditDays) conditions.push(`${unit}約 ${d.creditDays} 天內入帳`);
  return conditions;
}

/** 每筆固定哩數的商戶（訂閱、訂房）：無法換算成每 NT$100，單獨標示 */
function fixedDeal(m, d, { source, unit, now }) {
  const f = parseFixedMiles(m.rateText);
  if (!f) return null;
  return {
    id: `${source}:${m.id}`,
    kind: 'rebate',
    source,
    merchant: displayName(m.name),
    merchantId: m.id,
    category: m.category,
    title: `每筆${f.upTo ? '最高 ' : ''}${f.miles} ${unit}`,
    reward: { type: 'miles_fixed', value: f.miles, text: m.rateText },
    boost: null,
    conditions: commonConditions(d, unit),
    tags: ['每筆固定', ...((d?.conditions || []).some((c) => NEWBIE.test(c)) ? ['新客條件'] : [])],
    startAt: null,
    endAt: null,
    url: m.url,
    logo: m.logo,
    updatedAt: now,
  };
}

function rebateDeal(m, d, ctx) {
  const { source, unit, fx, now } = ctx;
  const cur = parseMiles(m.rateText);
  const curV = milesPer100Twd(cur, fx);
  if (curV == null) return fixedDeal(m, d, ctx);
  const was = m.wasText ? parseMiles(m.wasText) : null;
  const wasV = was ? milesPer100Twd(was, fx) : null;
  const boosted = wasV != null && wasV < curV;
  const foreign = cur.currency !== 'TWD';
  const conditions = commonConditions(d, unit);
  if (foreign) conditions.unshift(`原始回饋 ${m.rateText}，以 1 ${cur.currency} ≈ NT$${fx[cur.currency]} 換算`);
  const tags = [];
  if (conditions.some((c) => NEWBIE.test(c))) tags.push('新客條件');
  if (cur.upTo) tags.push('依品類不同');
  if (cur.atLeast) tags.push('最低保證');
  if (foreign) tags.push('外幣計價');
  if (m.hasVoucher) tags.push('有折價券');
  return {
    id: `${source}:${m.id}`,
    kind: 'rebate',
    source,
    merchant: displayName(m.name),
    merchantId: m.id,
    category: m.category,
    title: `每 NT$100 ${cur.upTo ? '最高 ' : ''}${curV} ${unit}`,
    reward: { type: 'miles', value: boosted ? wasV : curV, text: boosted ? m.wasText : m.rateText },
    boost: boosted ? { type: 'miles', value: curV, text: m.rateText, endAt: d?.boostEndAt || null } : null,
    conditions,
    tags,
    startAt: null,
    endAt: null,
    url: m.url,
    logo: m.logo,
    updatedAt: now,
  };
}

function voucherDeals(vouchers, merchantsByUrl, { source, label, now }) {
  const out = [];
  const hidden = new Map();
  for (const v of vouchers) {
    const m = merchantsByUrl.get(v.merchantUrl);
    const base = {
      source,
      merchant: displayName(v.merchant || m?.name || ''),
      merchantId: m?.id || null,
      category: m?.category || null,
      url: v.merchantUrl,
      logo: m?.logo || null,
      updatedAt: now,
    };
    if (!base.merchant) continue;
    if (v.hidden) {
      // 未登入看不到內容：同一商戶合併成一筆，列出各張到期日
      const h = hidden.get(v.merchantUrl) || { ...base, dates: [] };
      if (v.endAt) h.dates.push(v.endAt);
      hidden.set(v.merchantUrl, h);
      continue;
    }
    const { reward, minSpend } = parseDiscount(v.title);
    out.push({
      ...base,
      id: `${source}:v:${hash(`${v.merchantUrl}|${v.title}|${v.code}|${v.endAt}`)}`,
      kind: 'coupon',
      title: v.title,
      code: v.code,
      reward: reward.type === 'gift' ? { ...reward, text: '優惠活動' } : reward,
      minSpend,
      conditions: [`從${label}連結進入並使用此優惠，才能同時累積哩程`],
      tags: [],
      startAt: null,
      endAt: v.endAt,
    });
  }
  for (const [url, h] of hidden) {
    const dates = [...new Set(h.dates)].sort();
    const { dates: _, ...base } = h;
    out.push({
      ...base,
      id: `${source}:v:${hash(url)}`,
      kind: 'coupon',
      title: `${dates.length} 張會員專屬優惠券（登入${label}後查看內容）`,
      code: null,
      reward: { type: 'gift', value: null, text: '會員券' },
      minSpend: null,
      conditions: [`各張到期日：${dates.map(md).join('、')}`],
      tags: ['需登入'],
      startAt: null,
      endAt: dates.at(-1) || null,
    });
  }
  return out;
}

export function makeAdapter({ source, base, unit, label, expectTitle }) {
  return {
    minCount: 30,
    note: `${label}台灣版；外幣計價依當日匯率換算成每 NT$100`,
    async scrape({ context, fx, log, today, now }) {
      // 切換到台灣版（設定 cookie）
      const page = await context.newPage();
      await page.goto(`${base}?countryID=${TW_COUNTRY_ID}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      const title = await page.title();
      await page.close();
      if (expectTitle && !expectTitle.test(title)) throw new Error(`不是台灣版頁面：「${title}」`);

      const get = async (url) => {
        const r = await context.request.get(url, { timeout: 45_000 });
        if (!r.ok()) throw new Error(`${url} → HTTP ${r.status()}`);
        return r.text();
      };

      const merchants = new Map();
      let url = `${base}az?orderBy=popular&letter=&page=1`;
      let total = 0;
      for (let i = 0; url && i < MAX_PAGES; i++) {
        const html = await get(url);
        for (const m of parseMerchantList(html, base)) if (!merchants.has(m.id)) merchants.set(m.id, m);
        const p = parsePager(html, base);
        total = p.total || total;
        if (total && merchants.size >= total) break;
        url = p.next;
      }
      log(`list ${merchants.size}/${total}`);

      const details = new Map();
      let failed = 0;
      await pool([...merchants.values()], 3, async (m) => {
        try {
          details.set(m.id, parseDetail(await get(m.url), today));
        } catch (e) {
          failed++;
          log('detail failed', m.name, e.message);
        }
      });
      log(`details ${details.size} ok, ${failed} failed`);

      const vouchers = [];
      url = `${base}top/vouchers?orderBy=voucherSoonToExpire&page=1`;
      for (let i = 0; url && i < 20; i++) {
        const html = await get(url);
        vouchers.push(...parseVouchers(html, base));
        const p = parsePager(html, base);
        if (p.total && vouchers.length >= p.total) break;
        url = p.next;
      }
      log(`vouchers ${vouchers.length}`);

      const ctx = { source, unit, label, fx, now };
      const deals = [];
      const noRate = [];
      for (const m of merchants.values()) {
        const d = rebateDeal(m, details.get(m.id), ctx);
        if (d) deals.push(d);
        else if (!m.rateText) noRate.push(m.name); // 平台目前未標示回饋（暫停中），不列入
        else log('unparsed rate', m.name, JSON.stringify(m.rateText));
      }
      if (noRate.length) log(`no rate shown (skipped) ${noRate.length}: ${noRate.join(', ')}`);
      const byUrl = new Map([...merchants.values()].map((m) => [m.url, m]));
      deals.push(...voucherDeals(vouchers, byUrl, ctx));
      return deals;
    },
  };
}
