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

test('activity period parser handles common Taiwanese date wording', async () => {
  const { parsePeriod } = await import('../scripts/deals/lib/normalize.mjs');
  const ref = '2026-10-17';
  const cases = [
    ['活動期間：2026/10/17(五)~2026/10/20(一)', '2026-10-17', '2026-10-20'],
    ['10/17(五)-10/20(一) 咖啡第二杯半價', '2026-10-17', '2026-10-20'],
    ['即日起～10/31', null, '2026-10-31'],
    ['即日起至 2026/11/30 止', null, '2026-11-30'],
    ['10月17日至10月20日', '2026-10-17', '2026-10-20'],
    ['優惠期限 10/31止', null, '2026-10-31'],
    ['1/5~1/10 新年活動', '2027-01-05', '2027-01-10'],
    ['10/18 當天限定', '2026-10-18', '2026-10-18'],
    ['活動時間 10/17 11:00 ~ 10/19 23:59', '2026-10-17', '2026-10-19'],
    ['中午12:30開賣 單價1.5元', null, null],
  ];
  for (const [t, s, e] of cases) assert.deepEqual(parsePeriod(t, ref), { startAt: s, endAt: e }, t);
});

test('coupon sources: PTT index, supertaste, Cosmed, RSS', async () => {
  const C = await import('../scripts/deals/lib/coupons.mjs');
  const { classify } = await import('../deals/js/categories.js');
  const ptt = C.parsePttIndex(
    `<div class="r-ent"><div class="nrec"><span class="hl f2">12</span></div><div class="title"><a href="/bbs/Lifeismoney/M.1792200000.A.1AB.html">[情報] 全家 咖啡第二杯半價 10/17-10/20</a></div><div class="meta"><div class="date">10/17</div></div></div>
     <div class="r-ent"><div class="nrec"></div><div class="title"><a href="/bbs/Lifeismoney/M.1792100000.A.2CD.html">[公告] 板規</a></div><div class="meta"><div class="date">10/16</div></div></div>
     <div class="r-ent"><div class="nrec"></div><div class="title">(本文已被刪除)</div><div class="meta"><div class="date">10/16</div></div></div>
     <a class="btn wide" href="/bbs/Lifeismoney/index4002.html">‹ 上頁</a>`,
    '2026-10-17',
  );
  assert.equal(ptt.posts.length, 2);
  assert.equal(ptt.prev, 'https://www.ptt.cc/bbs/Lifeismoney/index4002.html');
  const d = C.pttDeal(ptt.posts[0]);
  assert.equal(d.merchant, '全家');
  assert.equal(classify(d), '超商量販');
  assert.deepEqual([d.startAt, d.endAt], ['2026-10-17', '2026-10-20']);
  assert.deepEqual(d.tags, ['推 12']);
  assert.equal(C.pttDeal(ptt.posts[1]), null); // 公告不收

  const st = C.supertasteDeal({ id: 14376, flagship: '免費送果香氣泡飲', description: '現省79元', start_time: '2026-10-13T10:00:00+08:00', end_time: '2026-11-01T23:59:00+08:00', is_exclusive: true, category: { name: '這鍋超有料' }, store: { name: '賴山嶼麻辣燙', area: '連鎖門市' } });
  assert.deepEqual(st.reward, { type: 'amount', value: 79, unit: '省', text: '現省79元' });
  assert.equal(classify(st), '餐飲美食');
  assert.deepEqual([st.startAt, st.endAt], ['2026-10-13', '2026-11-01']);

  const cos = C.parseCosmedNews(`<li class="list--1"><div class="tab-box"><span>2026-10-12</span><div class="tab tab--1" runat="server">門市活動</div></div><p>10/12-10/22icash Pay滿$2,000送100點OPENPOINT</p><a href="news_detail.aspx?id=3120"></a></li>
    <li class="list--1"><div class="tab-box"><span>2026-09-23</span><div class="tab tab--1">門市活動</div></div><p>THE ORDINARY限店販售門市</p><a href="news_detail.aspx?id=3100"></a></li>`);
  const cd = cos.map(C.cosmedDeal).filter(Boolean);
  assert.equal(cd.length, 1);
  assert.deepEqual([cd[0].startAt, cd[0].endAt, cd[0].category, cd[0].url], ['2026-10-12', '2026-10-22', '藥妝美妝', 'https://www.cosmed.com.tw/news_detail.aspx?id=3120']);

  const rss = C.parseRss(`<rss><channel><item><title>屈臣氏會員日全館85折 10/20起連3天 - ETtoday</title><link>https://news.google.com/rss/articles/abc</link><guid>abc</guid><pubDate>Fri, 16 Oct 2026 02:00:00 GMT</pubDate><source url="https://www.ettoday.net">ETtoday</source></item>
    <item><title>某公司第三季營收創新高 - 經濟日報</title><link>x</link><guid>x</guid><pubDate>Fri, 16 Oct 2026 02:00:00 GMT</pubDate><source url="y">經濟日報</source></item></rss>`);
  const nd = rss.map(C.newsDeal).filter(Boolean);
  assert.equal(nd.length, 1);
  assert.equal(nd[0].title, '屈臣氏會員日全館85折 10/20起連3天');
  assert.equal(nd[0].merchant, '屈臣氏');
  assert.equal(classify(nd[0]), '藥妝美妝');
  assert.deepEqual(nd[0].reward, { type: 'percent_off', value: 15, text: '85折' });
  assert.equal(nd[0].endAt, '2026-10-23'); // 無明確迄日 → 發文日 + 7 天
  assert.ok(nd[0].tags.includes('期限見原文'));
});

test('news filter drops Hong Kong items, finance/politics and non-deal questions', async () => {
  const { newsDeal } = await import('../scripts/deals/lib/coupons.mjs');
  const item = (title, source = 'ETtoday') => ({ title: `${title} - ${source}`, link: 'x', guid: title, pubDate: 'Fri, 16 Oct 2026 02:00:00 GMT', source });
  assert.ok(newsDeal(item('本周咖啡優惠！7-11買2送2、全家拿鐵半價')));
  assert.ok(newsDeal(item('韓國旅遊用LINE Pay 最高25%回饋抽666點')));
  assert.equal(newsDeal(item('百佳優惠｜百佳即日起買滿$150送$18優惠券')), null); // 香港
  assert.equal(newsDeal(item('Sephora 必買｜指定產品低至4折', 'U Lifestyle')), null); // 香港媒體
  assert.equal(newsDeal(item('不是普發1萬！ 政府加碼發錢了')), null);
  assert.equal(newsDeal(item('foodpanda變Grab？外送費和優惠會變嗎？')), null);
  assert.equal(newsDeal(item('某公司第三季營收創新高')), null);
});
