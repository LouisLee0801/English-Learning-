// LINE購物：在 buy.line.me 頁面內呼叫它自己的 GraphQL API（沿用頁面的標頭與 cookie）。
// 1) 優惠商店清單（調大 limit 取全部）2) 分批查各商店詳情（條件、加碼期間、折價券）3) 賺點任務
import { collectMerchants, merchantDeal, couponDeals, missionDeal } from '../lib/line.mjs';

const ORIGIN = 'https://buy.line.me';
const SHOPPING_CODES = [101, 1, 2, 4, 102, 5, 3, 7, 6, 19, 8, 10, 20, 21, 28];
const TRAVEL_CODES = [11, 12, 13, 14, 26, 27];
const BATCH = 15; // 每家約 27 個欄位；LINE 限制單次查詢複雜度 500

const LIST_QUERY = `query ($queryCodes: [Int]!, $limit: Int, $filter: SpecialOfferMerchantListFilter, $merchantGroup: SpecialOfferTab) {
  merchantList: specialOfferMerchantList(queryCodes: $queryCodes, limit: $limit, filter: $filter, merchantGroup: $merchantGroup) {
    classification { queryCode name }
    merchants {
      merchantId shopId name url imageUrl
      point { amount previousAmount eventMessage bonusAmountForApp calculatedAmount }
      displayPoints showPointAmount rewardRaised coupon opening vendorTypes
    }
  }
}`;

const MISSION_QUERY = `{
  rewardMissions: merchantRewardMissions {
    shopId merchantName merchantImageUrl merchantDisplay contractId contractName description campaignUrl
    rewardType userPoint userPointRate expectedDepositTime endTime memberIdentity orderMinimalCharge
    clientPlatform paymentMethod deliveryMethod
  }
  rebateEvents: allAvailableRebateEvents { orderMissionId title startTime endTime pointRate userPointsUpperLimit relatedShopIds }
}`;

// 詳情欄位分兩層：基本欄位一定有；進階欄位（折價券等）若 schema 不認得就退回基本
const BASIC_FIELDS = `merchantId name description url imageUrl point { limit calculatedAmount } displayPoints showPointAmount physicalStore disabled
  merchantReward { rewardStartTime rewardEndTime currentPoint previousPoint }`;
const EXTRA_FIELDS = `coupons { title description discountCode endTime exclusive cooperativeBank creditCardBin }
  settlementDaysDescription`;

const detailQuery = (ids, extra) =>
  `{ ${ids.map((id, i) => `m${i}: merchant(merchantId: ${Number(id)}) { ${BASIC_FIELDS} ${extra ? EXTRA_FIELDS : ''} }`).join('\n')} }`;

export default {
  minCount: 100,
  note: 'LINE POINTS 回饋 %；加碼期間、折價券、賺點任務來自 LINE購物 官方 API',
  async scrape({ context, log, now }) {
    const page = await context.newPage();
    let headers = null;
    page.on('request', (req) => {
      if (!headers && req.url().includes('/api/graphql') && req.method() === 'POST') {
        headers = Object.fromEntries(
          Object.entries(req.headers()).filter(([k]) => k === 'content-type' || k === 'accept' || k.startsWith('x-') || k.startsWith('apollo')),
        );
      }
    });
    await page.goto(`${ORIGIN}/specialoffer`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    if (!headers) headers = { 'content-type': 'application/json' };

    const gql = async (query, variables = {}) => {
      const res = await page.evaluate(
        async ({ query, variables, headers }) => {
          const r = await fetch('/api/graphql', { method: 'POST', headers, body: JSON.stringify({ query, variables }), credentials: 'include' });
          return { status: r.status, body: await r.text() };
        },
        { query, variables, headers },
      );
      if (res.status !== 200) throw new Error(`graphql HTTP ${res.status}: ${res.body.slice(0, 200)}`);
      return JSON.parse(res.body);
    };

    try {
      // 1) 商店清單
      const entries = new Map();
      for (const [codes, group, travel] of [[SHOPPING_CODES, 'SHOPPING', false], [TRAVEL_CODES, 'ALL', true]]) {
        const r = await gql(LIST_QUERY, { queryCodes: codes, limit: 3000, filter: null, merchantGroup: group });
        if (!r.data?.merchantList) throw new Error(`merchantList 失敗：${JSON.stringify(r.errors || r).slice(0, 300)}`);
        collectMerchants(r.data.merchantList, entries, travel);
      }
      log(`merchants ${entries.size}`);

      // 2) 商店詳情（分批）
      const ids = [...entries.keys()];
      const details = new Map();
      let extra = true;
      for (let i = 0; i < ids.length; i += BATCH) {
        const chunk = ids.slice(i, i + BATCH);
        let r = await gql(detailQuery(chunk, extra));
        if (extra && !r.data && r.errors) {
          log('extra fields rejected, falling back:', JSON.stringify(r.errors).slice(0, 300));
          extra = false;
          r = await gql(detailQuery(chunk, false));
        }
        chunk.forEach((id, j) => r.data?.[`m${j}`] && details.set(id, r.data[`m${j}`]));
        await page.waitForTimeout(300);
      }
      log(`details ${details.size}/${ids.length}${extra ? '' : ' (basic fields only)'}`);

      // 3) 賺點任務、回饋加碼活動
      const mr = await gql(MISSION_QUERY);
      const missions = mr.data?.rewardMissions || [];
      const events = mr.data?.rebateEvents || [];
      log(`missions ${missions.length}, rebate events ${events.length}`);

      const byShop = new Map([...entries.values()].map((e) => [e.m.shopId, e]));
      for (const ev of events) {
        for (const shopId of ev.relatedShopIds || []) {
          const e = byShop.get(shopId);
          if (e) e.event = ev;
        }
      }

      const deals = [];
      for (const [id, e] of entries) {
        const d = merchantDeal(e, details.get(id), now);
        if (d) deals.push(d);
        deals.push(...couponDeals(details.get(id), e, now));
      }
      for (const mi of missions) {
        const e = byShop.get(mi.shopId);
        const d = missionDeal(mi, e?.m, now);
        if (d) deals.push({ ...d, category: e ? [...e.categories][0] || null : null });
      }
      return deals;
    } finally {
      await page.close();
    }
  },
};
