import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMiles, milesPer100Twd, parsePercent, toYmd, validateDeal } from '../scripts/deals/lib/normalize.mjs';
import { parseMerchantList, parsePager, parseVouchers } from '../scripts/deals/lib/valuedynamx.mjs';
import { apolloState, collectMerchants, merchantDeal, missionDeal, splitConditions, taipeiDate } from '../scripts/deals/lib/line.mjs';

const fx = { USD: 32, HKD: 4.1, JPY: 0.21 };

test('miles parser handles EVA, Cathay and common wording', () => {
  const cases = [
    ['最多 12 哩程 / TWD100', 12, true],
    ['最少 1 哩程 / TWD100', 1, false],
    ['12 哩程 / HKD50', 5.85, false],
    ['最多 USD1 = 2.25 里數', 7.03, true],
    ['¥1000 = 6.25', 2.98, false],
    ['NT$25 = 1 哩', 4, false],
    ['Earn 3 miles per US$1', 9.38, false],
  ];
  for (const [t, per100, upTo] of cases) {
    const p = parseMiles(t);
    assert.ok(p, t);
    assert.equal(milesPer100Twd(p, fx), per100, t);
    assert.equal(p.upTo, upTo, t);
  }
  assert.equal(parseMiles('沒有數字'), null);
  assert.equal(milesPer100Twd(parseMiles('3 miles / GBP1'), fx), null); // 沒有匯率就不亂算
  assert.equal(parsePercent('最高 5.5% 回饋'), 5.5);
  assert.equal(toYmd('2026/1/5'), '2026-01-05');
  assert.equal(toYmd('31 Oct 2026'), '2026-10-31');
});

const EVA_HTML = `
<div class="merch-item   with-icons merchant-with-offer merchant-with-voucher " rel="178368">
  <a href="travel/klook-taiwan?&amp;placement=page-az_block_1_list_p_3" class="link-to-merchant">
    <span class="merch-banner"><img src="https://cdn.rewardengine.com/upload/klook.png" alt=""></span>
    <span class="merch-title"><span>KLOOK Taiwan</span></span>
    <span class="merch-rates">
<span class="upto">最多</span> 10 哩程 / TWD100
</span>
    <span class="merch-rates-was"><span class="label-was">非促銷期間</span>
<span class="upto">最多</span> 7 哩程 / TWD100</span>
    <span class="merch-icons icons-incorner"></span>
  </a>
</div>
<div class="merch-item   with-icons " rel="1640031">
  <a href="department-stores/coupang-taiwan?&amp;placement=x" class="link-to-merchant">
    <span class="merch-title"><span>Coupang Taiwan</span></span>
    <span class="merch-rates"> 4 哩程 / TWD100 </span>
  </a>
</div>
<div class="ajaxloader-text">您已瀏覽 24 共 <span class="total">219</span> 商家</div>
<button data-href="az?orderBy=popular&amp;letter=&amp;page=2" class="btn loadmore">更多資訊</button>`;

const CX_HTML = `
<div class="merchant-item h-100 with-border with-icons merchant-with-offer " rel="379875">
  <div class="merchant-title"><a href="travel/trip-com-us?&amp;placement=p1" class="merchant-link" data-fixed-rate="n">Trip.com US</a></div>
  <div class="merchant-rates" aria-label="最多 USD1 =   2.25 里數" role="math"><span class="label-earn">最多</span> USD1 = <strong>2.25</strong></div>
  <div class="merchant-rates-was" aria-label="非推廣期 最多 USD1 =   1.5 里數" role="math"></div>
</div>`;

test('Valuedynamx list parser reads both EVA and Cathay markup', () => {
  const eva = parseMerchantList(EVA_HTML, 'https://mall.brmile.com/zh/');
  assert.equal(eva.length, 2);
  assert.deepEqual(
    { ...eva[0], logo: undefined },
    {
      id: '178368', name: 'KLOOK Taiwan', url: 'https://mall.brmile.com/zh/travel/klook-taiwan', category: '旅遊',
      categorySlug: 'travel', rateText: '最多 10 哩程 / TWD100', wasText: '最多 7 哩程 / TWD100', featured: true, hasVoucher: true, logo: undefined,
    },
  );
  assert.equal(eva[1].wasText, '');
  assert.equal(eva[1].category, '綜合電商');
  assert.deepEqual(parsePager(EVA_HTML, 'https://mall.brmile.com/zh/az'), { total: 219, next: 'https://mall.brmile.com/zh/az?orderBy=popular&letter=&page=2' });

  const v = parseVouchers(
    `<div class="voucher-item"><a href="fashion/the-doublef-asia?&amp;placement=x#box" title="x"></a><span class="merchant-title">The DoubleF Asia</span>
     <span class="item-txt" title="Sale | Valid Worldwide &amp;#x28;Italy Excluded&amp;#x29;!"></span>
     <span class="voucher-code">優惠代碼: <strong>no code required</strong></span><span class="voucher-expdate">到期日 <span class="date">2026/10/31</span></span></div>`,
    'https://mall.brmile.com/zh/',
  );
  assert.deepEqual(v, [{ merchant: 'The DoubleF Asia', merchantUrl: 'https://mall.brmile.com/zh/fashion/the-doublef-asia', title: 'Sale | Valid Worldwide (Italy Excluded)!', code: null, endAt: '2026-10-31', hidden: false }]);

  const cx = parseMerchantList(CX_HTML, 'https://shop.asiamiles.com/zh/');
  assert.equal(cx[0].name, 'Trip.com US');
  assert.equal(cx[0].rateText, '最多 USD1 = 2.25 里數');
  assert.equal(cx[0].wasText, '最多 USD1 = 1.5 里數');
});

test('LINE: Apollo state, merchant rebate with boost, conditions', () => {
  const html = `<script>window.__APOLLO_STATE__ = {"ROOT_QUERY":{"merchant({\\"merchantId\\":1})":{"merchantId":1,"name":"Lancome蘭蔻官網","description":"注意事項：\\n《1》需透過LINE購物前往，24小時內結帳。\\n《2》運費不回饋。","point":{"limit":200}}}};</script>`;
  const st = apolloState(html);
  const detail = st.ROOT_QUERY['merchant({"merchantId":1})'];
  const entries = collectMerchants([
    {
      classification: { name: '美妝保養' },
      merchants: [{ merchantId: 1, name: 'Lancome蘭蔻官網', url: 'https://buy.line.me/u/partner/1', point: { amount: 8, previousAmount: 2 }, displayPoints: [8], showPointAmount: true, rewardRaised: true }],
    },
    { classification: { name: '專屬推薦' }, merchants: [{ merchantId: 1 }] },
  ]);
  const d = merchantDeal(entries.get(1), detail, 'now');
  assert.equal(d.category, '美妝保健');
  assert.deepEqual(d.reward, { type: 'percent', value: 2, text: '2%' });
  assert.equal(d.boost.value, 8);
  assert.deepEqual(d.conditions, ['單一商品最高回饋 200 點', '需透過LINE購物前往，24小時內結帳。', '運費不回饋。']);
  assert.deepEqual(validateDeal(d), []);
  assert.deepEqual(splitConditions('不含運費\n\n限 App'), ['不含運費', '限 App']);
});

test('LINE: reward mission becomes a promo with min spend, newbie tag and Taipei end date', () => {
  const d = missionDeal(
    { shopId: 616, merchantName: '翔仔居家 ', contractId: 11120, contractName: '翔仔居家：10月首購滿額贈100點', description: '滿$3200贈100點(上限50名)', rewardType: 'FIXED_POINT', userPoint: 100, endTime: 1793462399000, memberIdentity: 'NEW_ACCOUNT', orderMinimalCharge: 3200 },
    { merchantId: 99, url: 'https://buy.line.me/u/partner/99' },
    'now',
  );
  assert.equal(d.merchant, '翔仔居家');
  assert.equal(d.minSpend, 3200);
  assert.deepEqual(d.tags, ['新客限定']);
  assert.equal(d.endAt, '2026-10-31');
  assert.equal(d.url, 'https://buy.line.me/u/partner/99');
  assert.deepEqual(validateDeal(d), []);
  assert.equal(taipeiDate(Date.UTC(2026, 9, 31, 16, 0)), '2026-11-01');
});
