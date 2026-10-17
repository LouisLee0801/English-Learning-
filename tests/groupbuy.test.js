import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWindow, parsePrice, groupBuyScore, extractProduct, parsePost, splitSchedule, taipeiStamp } from '../groupbuy/js/parse.js';
import { classify, brandOf } from '../groupbuy/js/categories.js';
import { status, dueText, combine, filterItems, defaultFilters, matchesQuery, timeline, calendarUrl, filtersToQuery, queryToFilters } from '../groupbuy/js/core.js';

const ref = '2026-10-17 12:00'; // 週六

test('time window: ranges, labeled open/close, relative days, same-month shorthand', () => {
  const cases = [
    ['開團時間：10/20(一) 20:00 ~ 10/26(日) 23:59', '2026-10-20 20:00', '2026-10-26 23:59'],
    ['團購期間 10.20-10.26 限量100組', '2026-10-20', '2026-10-26'],
    ['即日起至10/31止', null, '2026-10-31'],
    ['接到10/23收單！', null, '2026-10-23'],
    ['今晚8點開團，限時3天', '2026-10-17 20:00', '2026-10-19'],
    ['這週日晚上12點結單', null, '2026-10-18 23:59'],
    ['2026/10/20~2026/11/02', '2026-10-20', '2026-11-02'],
    ['12/28-1/3 年末團', '2026-12-28', '2027-01-03'],
    ['預計11/15出貨，10/25收單', null, '2026-10-25'],
    ['10/20 10:00~22:00 快閃一天', '2026-10-20 10:00', '2026-10-20 22:00'],
    ['「小花點讀筆_小鼠梅西新書首發團 10/13~19」', '2026-10-13', '2026-10-19'],
    ['10/20 Combi推車開團', '2026-10-20', null],
    ['下週三開團', '2026-10-21', null],
    ['♦️ 開團期間 《2026/10/12～10/18》', '2026-10-12', '2026-10-18'],
    ['🔺10月15日中午結單，到貨通知🔺', null, '2026-10-15'],
  ];
  for (const [t, open, close] of cases) {
    const w = parseWindow(t, ref);
    assert.equal(w.openAt, open, `${t} open`);
    assert.equal(w.closeAt, close, `${t} close`);
  }
  // 規格、粉絲數、價格不是日期
  for (const t of ['尺寸23.5~26.5cm', '1.5K Followers', '原價$1,280', '10/20 10cm', 'MIT｜F碼(23.5~26.5cm)']) assert.deepEqual(parseWindow(t, ref), { openAt: null, closeAt: null, timeText: null }, t);
});

test('price: group-buy price first, skip thresholds and comparison prices, keep hidden prices as text', () => {
  assert.deepEqual(parsePrice('團購價 $1,280（原價 $2,000）'), { price: 1280, originalPrice: 2000, priceText: '團購價 $1,280' });
  assert.equal(parsePrice('開團三麗鷗1/$215！').price, 215);
  assert.equal(parsePrice('價格：350').price, 350);
  assert.equal(parsePrice('滿$1500免運，特價$990').price, 990);
  assert.equal(parsePrice('出國當地一條還要259元 💥全台超值最優惠＄189元💥').price, 189);
  assert.deepEqual(parsePrice('只要1XX💰'), { price: null, originalPrice: null, priceText: '只要1XX' });
  assert.equal(parsePrice('NT$ 3,980 起').priceText, 'NT$ 3,980 起');
});

test('group-buy detection: real listings pass, vendor-seeking / complaints / HK / China posts fail', () => {
  const yes = [
    'Tangle & Swirlz 扭扭樂開團✨💗\n款式整理下來光Swirlz就有46款‼️\n我要趁全館免運多囤幾個起來換著玩！！',
    '開團三麗鷗1/$215！ 湊團成功會告知\n須先下單賣貨便',
    '▓今天社群限時開團一款波點包包▓\n只要1XX💰',
    '開團李濬榮的2027-2028年曆！\n接到10/23收單！',
    '物料書開團！超過100本會降價\n進群喊',
    '超好用的購物包開團 底下任意留言，分享給你!',
  ];
  const no = [
    '請問有團購商品可以賣嗎\n我是擁有4000多人群組的團主',
    '我是一位團購主，目前經營一個近 8000 人的團購群組。\n目前正在尋找 美妝保養品 的合作廠商，\n若您有合適的品項、願意配合團購開團，歡迎私訊或留言洽談，期待與您合作！',
    '想找無壓力開團的合作的廠商☺️',
    '老闆叫我十月底前至少要找到五樣新團品\n有沒有中部地區的商家\n想拓展團購、企業禮品的通路呀',
    '這個常上脆的的母嬰二手版主媽媽到底是多缺錢\n卻不斷的在發自己開團的罐頭訊息洗版\n每次團購超愛情勒',
    'ʕ•ᴥ•ʔ 開團喇🎉\n韓國🇰🇷爆紅Cellology薏仁泡泡淨化潔面膜\n好多KOL推薦用佢👍🏻',
    '不能一直看演唱会了 那就买同款咯 偶然刷到的jin同款粉膜 就马上买了 团购价',
  ];
  for (const t of yes) assert.ok(groupBuyScore(t).isGroupBuy, t);
  for (const t of no) assert.ok(!groupBuyScore(t).isGroupBuy, t);
});

test('product name from real posts', () => {
  const cases = [
    [{ text: 'Tangle & Swirlz 扭扭樂開團✨💗\n\n款式整理下來光Swirlz就有46款‼️' }, 'Tangle & Swirlz 扭扭樂'],
    [{ text: '▓今天社群限時開團一款波點包包▓\n很適合演唱會帶去拍照~\n只要1XX💰' }, '波點包包'],
    [{ text: '謝謝大家喜歡 ๑ᵒᗨᵒ)و♥\n刺繡襪子開團！開團！\n\n不能跟第一批併單🙅🏻‍♀️' }, '刺繡襪子'],
    [{ text: '開團李濬榮的2027-2028年曆！\n想抽親簽小卡所以開團～\n接到10/23收單！' }, '李濬榮的2027-2028年曆'],
    [{ title: '初六媽', text: '🧹 山水 SANSUI 輕淨吸無線吸塵器開團啦! ️優惠時間：10/13～10/22 家裡有小孩的媽咪一定懂' }, '山水 SANSUI 輕淨吸無線吸塵器'],
    [{ text: '【 噴寶噴霧油 】開團啦 ️ 訂購連結 https://reurl.cc/lnOv9v' }, '噴寶噴霧油'],
    [{ text: '🇰🇷 Parnell 氣墊終於開團啦🤍Olive Young 氣墊類 NO.1🏆 累積狂銷200萬顆!' }, 'Parnell 氣墊'],
    [{ text: '留言「氣炸鍋」我把這次開團資訊傳給你們' }, '氣炸鍋'],
    [{ text: '品名：Combi 雙向嬰兒推車\n團購價 $8,990' }, 'Combi 雙向嬰兒推車'],
  ];
  for (const [input, want] of cases) assert.equal(extractProduct({ ...input, ref }), want, input.text);
});

test('categories: brands and the longest keyword win', () => {
  const cases = [
    ['Dyson V15 無線吸塵器', '家電'],
    ['日本 Combi 嬰兒推車', '育兒親子'],
    ['氣炸鍋', '家電'],
    ['不沾鍋三件組', '居家生活'],
    ['飛利浦電動牙刷', '家電'],
    ['刺繡襪子', '服飾配件'],
    ['涼感床包', '居家生活'],
    ['葉黃素', '保健營養'],
    ['貓砂 團購', '寵物用品'],
    ['麵包超人玩具', '育兒親子'],
    ['三麗鷗 萬聖節小公仔', '文創周邊'],
    ['台灣辣妹 辣椒醬', '美食生鮮'],
    ['Parnell 氣墊', '美妝保養'],
    ['精臣標籤機B21S', '3C數位'],
    ['完全看不出是什麼', '其他'],
  ];
  for (const [t, want] of cases) assert.equal(classify({ product: t }), want, t);
  assert.equal(brandOf('日本 Combi 嬰兒推車'), 'Combi');
  assert.equal(brandOf('gu 與 lg 只在整個字時算品牌：guava'), 'gu');
});

test('schedule posts split into one item per line', () => {
  const text = '本週開團預告🔥\n10/20 Combi 推車\n10/22 ② 童裝外套\n10/24 Dyson 吹風機（10/27收單）\n預計11月中出貨';
  const rows = splitSchedule(text, ref);
  assert.deepEqual(rows.map((r) => [r.product, r.openAt]), [['Combi 推車', '2026-10-20'], ['童裝外套', '2026-10-22'], ['Dyson 吹風機', '2026-10-24']]);
  assert.equal(rows[2].closeAt, '2026-10-27');
  assert.deepEqual(splitSchedule('10/20 開團\n其他說明', ref), []);
});

test('parsePost puts it together', () => {
  const r = parsePost({ text: '【限時團購】日本Combi嬰兒推車\n團購價 $8,990（原價 $12,800）\n開團時間 10/20 20:00 ~ 10/26 23:59\n下單：https://xx.1shop.tw/abc', ref });
  assert.equal(r.isGroupBuy, true);
  assert.equal(r.product, '日本Combi嬰兒推車');
  assert.equal(r.brand, 'Combi');
  assert.equal(r.category, '育兒親子');
  assert.equal(r.price, 8990);
  assert.equal(r.originalPrice, 12800);
  assert.equal(r.openAt, '2026-10-20 20:00');
  assert.equal(r.closeAt, '2026-10-26 23:59');
  assert.equal(r.orderUrl, 'https://xx.1shop.tw/abc');
  assert.equal(taipeiStamp('2026-10-17T04:00:00Z'), '2026-10-17 12:00');
});

const item = (o) => ({ id: o.id || Math.random().toString(36).slice(2), product: '測試商品', category: '家電', platform: 'Threads', url: 'https://example.com/p', tags: [], ...o });
const now = '2026-10-17 12:00';

test('status: upcoming, closing within 48h, open, closed, and expiry for posts without a close date', () => {
  assert.equal(status(item({ openAt: '2026-10-18 20:00' }), now), 'upcoming');
  assert.equal(status(item({ closeAt: '2026-10-17' }), now), 'closing'); // 當天 23:59 前
  assert.equal(status(item({ closeAt: '2026-10-19 11:59' }), now), 'closing');
  assert.equal(status(item({ closeAt: '2026-10-19 12:01' }), now), 'open');
  assert.equal(status(item({ closeAt: '2026-10-16' }), now), 'closed');
  assert.equal(status(item({ closeAt: '2026-10-17 11:00' }), now), 'closed');
  assert.equal(status(item({ expireAt: '2026-10-16' }), now), 'closed');
  assert.equal(status(item({}), now), 'open');
  assert.equal(dueText(item({ closeAt: '2026-10-17 23:59' }), now), '今天 23:59 結單');
  assert.equal(dueText(item({ closeAt: '2026-10-18' }), now), '明天 結單');
  assert.equal(dueText(item({ closeAt: '2026-10-26' }), now), '剩 9 天 · 10/26 結單');
  assert.equal(dueText(item({ openAt: '2026-10-20 20:00' }), now), '10/20 20:00 開團');
  assert.equal(dueText(item({}), now), '結單日見原文');
});

test('search: every term must match; category words like 衣服 and 育兒 match the category', () => {
  const a = item({ product: 'Combi 嬰兒推車', category: '育兒親子', author: 'mia_1101_' });
  const b = item({ product: '刺繡襪子', category: '服飾配件' });
  assert.ok(matchesQuery(a, 'combi 推車'));
  assert.ok(matchesQuery(a, '育兒'));
  assert.ok(matchesQuery(a, 'mia'));
  assert.ok(!matchesQuery(a, 'combi 襪子'));
  assert.ok(matchesQuery(b, '衣服'));
  const list = filterItems([a, b, item({ product: '已結單', closeAt: '2026-10-01' })], { ...defaultFilters(), q: '' }, now);
  assert.equal(list.length, 2);
  assert.equal(filterItems([a, b], { ...defaultFilters(), category: '服飾配件' }, now)[0].product, '刺繡襪子');
});

test('sorting by closing time puts the soonest deadline first and undated posts last', () => {
  const list = filterItems(
    [item({ product: 'C', closeAt: '2026-10-25' }), item({ product: 'X' }), item({ product: 'A', closeAt: '2026-10-17 20:00' }), item({ product: 'B', closeAt: '2026-10-20' })],
    defaultFilters(),
    now,
  );
  assert.deepEqual(list.map((x) => x.product), ['A', 'B', 'C', 'X']);
});

test('timeline groups by close day, then upcoming, then undated', () => {
  const g = timeline([item({ product: 'today', closeAt: '2026-10-17 23:59' }), item({ product: 'tue', closeAt: '2026-10-20' }), item({ product: 'soon', openAt: '2026-10-19' }), item({ product: 'nodate' }), item({ product: 'gone', closeAt: '2026-10-10' })], now);
  assert.deepEqual(g.map((x) => x.title), ['今天 10/17（六） 結單', '10/20（二） 結單', '10/19（一） 開團', '開團中・結單日見原文']);
});

test('combine dedupes the same post across files by priority', () => {
  const out = combine([
    { file: 'search.json', items: [item({ id: 'instagram:abc', product: '搜尋版', category: '不存在的分類' })] },
    { file: 'instagram.json', items: [item({ id: 'instagram:abc', product: 'API 版' })] },
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].product, 'API 版');
  assert.equal(combine([{ file: 'x.json', items: [item({ category: '亂寫' })] }])[0].category, '其他');
});

test('Google Calendar link and filter round-trip', () => {
  const u = new URL(calendarUrl(item({ product: '吸塵器', closeAt: '2026-10-26 23:59', url: 'https://ig/p/1' })));
  assert.equal(u.searchParams.get('dates'), '20261026T225900/20261026T235900');
  assert.equal(u.searchParams.get('ctz'), 'Asia/Taipei');
  assert.equal(new URL(calendarUrl(item({ closeAt: '2026-10-26' }))).searchParams.get('dates'), '20261026/20261027');
  assert.equal(calendarUrl(item({})), null);
  const f = { ...defaultFilters(), q: '童裝', platforms: ['Instagram'], hasClose: true };
  assert.deepEqual(queryToFilters(filtersToQuery(f)), f);
  assert.equal(filtersToQuery(defaultFilters()), '');
});
