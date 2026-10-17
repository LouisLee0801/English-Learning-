import test from 'node:test';
import assert from 'node:assert/strict';
import {
  status, daysLeft, activeBoost, effectiveRate, brandKey, defaultFilters, filterDeals,
  compareByBrand, filtersToQuery, queryToFilters,
} from '../deals/js/core.js';

const today = '2026-10-17';
const deal = (o) => ({
  id: o.id || Math.random().toString(36),
  kind: 'rebate',
  source: 'line',
  merchant: 'PChome 24h購物',
  category: '綜合電商',
  reward: { type: 'percent', value: 3, text: '3%' },
  conditions: [],
  tags: [],
  ...o,
});

test('status: upcoming, expired, ending (inclusive of end day), active, long-term', () => {
  assert.equal(status(deal({ startAt: '2026-10-18' }), today), 'upcoming');
  assert.equal(status(deal({ endAt: '2026-10-16' }), today), 'expired');
  assert.equal(status(deal({ endAt: '2026-10-17' }), today), 'ending');
  assert.equal(status(deal({ endAt: '2026-10-24' }), today), 'ending');
  assert.equal(status(deal({ endAt: '2026-10-25' }), today), 'active');
  assert.equal(status(deal({}), today), 'active');
  assert.equal(daysLeft(deal({ endAt: '2026-10-20' }), today), 3);
  assert.equal(daysLeft(deal({}), today), null);
});

test('boost only counts inside its window', () => {
  const d = deal({ boost: { value: 8, startAt: '2026-10-10', endAt: '2026-10-20' } });
  assert.equal(activeBoost(d, today).value, 8);
  assert.equal(effectiveRate(d, today), 8);
  assert.equal(activeBoost(d, '2026-10-21'), null);
  assert.equal(effectiveRate(d, '2026-10-21'), 3);
});

test('miles convert to an equivalent % using the mile value', () => {
  const d = deal({ source: 'eva', reward: { type: 'miles', value: 4 } }); // 每 NT$100 得 4 哩
  assert.equal(effectiveRate(d, today, 0.5), 2);
  assert.equal(effectiveRate(d, today, 0.4), 1.6);
});

test('brandKey matches the same brand across portals', () => {
  assert.equal(brandKey('Apple 官方網站'), brandKey('Apple'));
  assert.equal(brandKey('Agoda (旅遊)'), brandKey('agoda'));
  assert.equal(brandKey('Nike 台灣官方網站'), brandKey('NIKE'));
  assert.equal(brandKey('Booking.com'), brandKey('Booking'));
  assert.notEqual(brandKey('momo購物網'), brandKey('PChome 24h購物'));
  // 中英文店名對照
  assert.equal(brandKey('蝦皮直營_最快當日到'), brandKey('Shopee Taiwan'));
  assert.equal(brandKey('Lancome蘭蔻官網'), brandKey('Lancôme Taiwan'));
  assert.equal(brandKey('雅詩蘭黛 Estée Lauder 官網'), brandKey('Estee Lauder Taiwan'));
  assert.equal(brandKey('Trip.com'), brandKey('Trip.com US'));
  assert.equal(brandKey('M.A.C 官網'), brandKey('MAC Cosmetics Taiwan'));
  assert.equal(brandKey('Apple 官方網站'), brandKey('Apple Store Online Taiwan'));
  assert.equal(brandKey('PUMA台灣官方購物網站'), 'puma');
  assert.equal(brandKey('Bulgari'), 'bulgari');
  assert.equal(brandKey('Yahoo奇摩購物中心'), brandKey('Yahoo Shopping Taiwan'));
  assert.equal(brandKey('KKday (體驗與票券) - LINE旅遊'), brandKey('KKday Taiwan'));
  assert.equal(brandKey('樂天旅遊(住宿)-LINE旅遊'), brandKey('Rakuten Travel Taiwan'));
  assert.equal(brandKey('ALL-Accor Live Limitless Asia'), 'accor');
  assert.equal(brandKey('Marriott International Asia'), 'marriott');
  // 不該合併的
  assert.notEqual(brandKey('Apple Music'), brandKey('Apple 官方網站'));
  assert.notEqual(brandKey('Momocat Taiwan'), brandKey('momo購物網'));
});

test('filters: source, status, search, newbie, min spend, code; sorted by rate', () => {
  const list = [
    deal({ id: 'a', reward: { type: 'percent', value: 2 } }),
    deal({ id: 'b', merchant: 'Pinkoi', reward: { type: 'percent', value: 6 }, endAt: '2026-10-19' }),
    deal({ id: 'c', source: 'eva', merchant: 'Agoda', reward: { type: 'miles', value: 10 } }), // ≈ 5%
    deal({ id: 'd', merchant: 'Old', endAt: '2026-10-01' }),
    deal({ id: 'e', kind: 'coupon', source: 'manual', merchant: 'foodpanda', code: 'EAT100', minSpend: 300, tags: ['新客限定'], reward: { type: 'amount', value: 100 } }),
    deal({ id: 'f', kind: 'promo', merchant: 'Coupang', reward: { type: 'amount', value: 200, unit: '點' } }), // 無門檻贈點，不換算 %
  ];
  const f = defaultFilters();
  // 滿 300 折 100 ≈ 33% 折扣率，排最前
  assert.deepEqual(filterDeals(list, f, today).map((d) => d.id), ['e', 'b', 'c', 'a', 'f']);
  assert.deepEqual(filterDeals(list, { ...f, sources: ['eva'] }, today).map((d) => d.id), ['c']);
  assert.deepEqual(filterDeals(list, { ...f, status: 'ending' }, today).map((d) => d.id), ['b']);
  assert.deepEqual(filterDeals(list, { ...f, status: 'all' }, today).length, 6);
  assert.deepEqual(filterDeals(list, { ...f, q: 'pink' }, today).map((d) => d.id), ['b']);
  assert.deepEqual(filterDeals(list, { ...f, codeOnly: true }, today).map((d) => d.id), ['e']);
  assert.deepEqual(filterDeals(list, { ...f, noNewbie: true }, today).map((d) => d.id), ['b', 'c', 'a', 'f']);
  assert.deepEqual(filterDeals(list, { ...f, maxMinSpend: 100 }, today).map((d) => d.id), ['b', 'c', 'a', 'f']);
  assert.deepEqual(filterDeals(list, { ...f, sort: 'ending' }, today)[0].id, 'b');
});

test('compareByBrand picks the best live portal per brand', () => {
  const rows = compareByBrand(
    [
      deal({ source: 'line', merchant: 'Agoda', reward: { type: 'percent', value: 4 } }),
      deal({ source: 'eva', merchant: 'Agoda 官方網站', reward: { type: 'miles', value: 10 } }),
      deal({ source: 'cathay', merchant: 'agoda', reward: { type: 'miles', value: 6 }, endAt: '2026-10-01' }),
    ],
    today,
    0.5,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].count, 2);
  assert.equal(rows[0].best, 'eva');
  assert.equal(rows[0].name, 'Agoda');
});

test('filters round-trip through the URL query', () => {
  const f = { ...defaultFilters(), q: 'apple', sources: ['line', 'eva'], boostOnly: true, maxMinSpend: 500, sort: 'ending' };
  assert.deepEqual(queryToFilters(filtersToQuery(f)), f);
  assert.equal(filtersToQuery(defaultFilters()), '');
});
