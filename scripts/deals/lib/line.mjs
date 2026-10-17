// LINE購物：解析 GraphQL 回應與商店頁的 Apollo SSR 資料。純函式，方便測試。
import { clean, parseDiscount } from './normalize.mjs';

/** LINE 分類 → 統一分類 */
export const CATEGORY = {
  網購平台: '綜合電商',
  通路門市: '門市通路',
  流行時尚: '時尚服飾',
  旗艦品牌: '品牌旗艦',
  美妝保養: '美妝保健',
  纖體保健: '美妝保健',
  '3C家電': '3C家電',
  居家生活: '居家生活',
  親子婦幼: '親子',
  生鮮食品: '食品餐飲',
  運動休閒: '運動休閒',
  生活服務: '生活服務',
  全球直送: '跨境購物',
  特色店家: '特色店家',
};
const SKIP_CLASS = new Set(['專屬推薦', '推薦']);

/** 毫秒時間戳 → 台北日期 YYYY-MM-DD */
export function taipeiDate(ms) {
  if (!ms) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}

/** 商店頁 HTML 內的 window.__APOLLO_STATE__ */
export function apolloState(html) {
  const i = String(html).indexOf('__APOLLO_STATE__');
  if (i < 0) return null;
  const start = html.indexOf('{', i);
  const end = html.indexOf('</script>', start);
  const raw = html.slice(start, end).trim().replace(/;$/, '');
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** merchantList / restMerchantList 等分類清單 → Map(merchantId → { m, categories }) */
export function collectMerchants(lists, into = new Map(), travel = false) {
  for (const group of lists || []) {
    const cls = group.classification?.name || '';
    for (const m of group.merchants || []) {
      if (!m?.merchantId) continue;
      const cur = into.get(m.merchantId) || { m, categories: new Set() };
      cur.m = { ...cur.m, ...m };
      const cat = travel ? '旅遊' : CATEGORY[cls];
      if (cat && !SKIP_CLASS.has(cls)) cur.categories.add(cat);
      into.set(m.merchantId, cur);
    }
  }
  return into;
}

/** 「注意事項：《1》…《2》…」拆成條列 */
export function splitConditions(desc) {
  const t = String(desc || '').replace(/^\s*注意事項[:：]?\s*/, '');
  const parts = t
    .split(/\n+|(?=《\d+》)|(?=\(\d+\))|(?=（\d+）)|(?=^\d+[.、])/m)
    .map((s) => clean(s.replace(/^《\d+》|^\(\d+\)|^（\d+）|^\d+[.、]/, '')))
    .filter((s) => s.length > 1);
  return parts.slice(0, 12);
}

const pct = (n) => (typeof n === 'number' ? Math.round(n * 100) / 100 : null);

/**
 * 商店（清單的 ConciseMerchant + 詳情 Merchant）→ 回饋優惠。
 * 加碼期間優先用 merchantReward（有起訖時間），其次用清單的 rewardRaised。
 */
export function merchantDeal(entry, detail, now) {
  const m = { ...entry.m, ...(detail || {}) };
  if (m.disabled || !m.showPointAmount) return null;
  const p = { ...(entry.m.point || {}), ...(detail?.point || {}) };
  const shown = m.displayPoints?.length ? Math.max(...m.displayPoints) : p.calculatedAmount ?? p.amount;
  if (typeof shown !== 'number') return null;
  const mr = detail?.merchantReward;
  let base = shown;
  let boost = null;
  if (mr && typeof mr.previousPoint === 'number' && mr.previousPoint < mr.currentPoint) {
    base = mr.previousPoint;
    boost = { type: 'percent', value: pct(mr.currentPoint), text: `${pct(mr.currentPoint)}%`, startAt: taipeiDate(mr.rewardStartTime), endAt: taipeiDate(mr.rewardEndTime) };
  } else if (entry.m.rewardRaised && typeof p.previousAmount === 'number' && p.previousAmount < shown) {
    base = p.previousAmount;
    boost = { type: 'percent', value: pct(shown), text: `${pct(shown)}%`, startAt: taipeiDate(entry.event?.startTime), endAt: taipeiDate(entry.event?.endTime) };
  }
  const conditions = [];
  if (p.limit > 0) conditions.push(`單一商品最高回饋 ${p.limit} 點`);
  if (detail?.settlementDaysDescription) conditions.push(`點數發放：${detail.settlementDaysDescription}`);
  conditions.push(...splitConditions(m.description));
  const tags = [];
  if (p.bonusAmountForApp) tags.push(`App 再加 ${pct(p.bonusAmountForApp)}%`);
  if (entry.m.opening) tags.push('開幕慶');
  if (entry.m.coupon || detail?.coupons?.length) tags.push('有折價券');
  if (m.physicalStore) tags.push('門市可用');
  const upTo = (m.displayPoints?.length || 0) > 1;
  return {
    id: `line:${m.merchantId}`,
    kind: 'rebate',
    source: 'line',
    merchant: clean(m.name),
    merchantId: String(m.merchantId),
    category: [...entry.categories][0] || null,
    title: `LINE POINTS ${upTo ? '最高 ' : ''}${pct(shown)}% 回饋`,
    reward: { type: 'percent', value: pct(base), text: `${pct(base)}%` },
    boost,
    conditions,
    tags,
    startAt: null,
    endAt: null,
    url: m.url || `https://buy.line.me/u/partner/${m.merchantId}`,
    logo: m.imageUrl || null,
    updatedAt: now,
  };
}

/** 商店的折價券（LINE購物獨家碼、銀行卡友優惠） */
export function couponDeals(detail, entry, now) {
  const out = [];
  for (const c of detail?.coupons || []) {
    const title = clean(c.title || c.description);
    if (!title) continue;
    const { reward, minSpend } = parseDiscount(`${c.title || ''} ${c.description || ''}`);
    const tags = [];
    if (c.exclusive) tags.push('LINE購物獨家');
    if (c.cooperativeBank) tags.push(`限 ${clean(c.cooperativeBank)}`);
    if (c.creditCardBin) tags.push('限指定卡別');
    out.push({
      id: `line:coupon:${detail.merchantId}:${c.discountCode || title}`,
      kind: 'coupon',
      source: 'line',
      merchant: clean(detail.name),
      merchantId: String(detail.merchantId),
      category: entry ? [...entry.categories][0] || null : null,
      title,
      code: c.discountCode || null,
      reward: reward.type === 'gift' ? { ...reward, text: '優惠' } : reward,
      minSpend,
      conditions: c.description && clean(c.description) !== title ? splitConditions(c.description) : [],
      tags,
      startAt: null,
      endAt: taipeiDate(c.endTime),
      url: detail.url || `https://buy.line.me/u/partner/${detail.merchantId}`,
      logo: detail.imageUrl || null,
      updatedAt: now,
    });
  }
  return out;
}

/** 賺點任務（滿額贈點、首購送點）→ 活動優惠 */
export function missionDeal(mi, merchant, now) {
  const fixed = mi.rewardType === 'FIXED_POINT' || typeof mi.userPoint === 'number';
  const reward = fixed
    ? { type: 'amount', value: mi.userPoint, unit: '點', text: `送 ${mi.userPoint} 點` }
    : { type: 'percent', value: pct(mi.userPointRate), text: `${pct(mi.userPointRate)}%` };
  if (reward.value == null) return null;
  const tags = [];
  if (mi.memberIdentity === 'NEW_ACCOUNT') tags.push('新客限定');
  if (mi.clientPlatform === 'APP') tags.push('App 限定');
  const conditions = [clean(mi.description)];
  if (mi.paymentMethod) conditions.push(`限付款方式：${mi.paymentMethod}`);
  if (mi.deliveryMethod) conditions.push(`限配送方式：${mi.deliveryMethod}`);
  if (mi.expectedDepositTime) conditions.push(`預計 ${taipeiDate(mi.expectedDepositTime)} 前發放點數`);
  return {
    id: `line:mission:${mi.contractId}`,
    kind: 'promo',
    source: 'line',
    merchant: clean(mi.merchantName),
    merchantId: merchant ? String(merchant.merchantId) : null,
    category: null,
    title: clean(mi.contractName),
    reward,
    minSpend: mi.orderMinimalCharge || null,
    conditions: conditions.filter(Boolean),
    tags,
    startAt: null,
    endAt: taipeiDate(mi.endTime),
    url: mi.campaignUrl || merchant?.url || 'https://buy.line.me/specialoffer?filter=rewardMission',
    logo: mi.merchantImageUrl || null,
    updatedAt: now,
  };
}
