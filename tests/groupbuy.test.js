import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWindow, parsePrice, groupBuyScore, extractProduct, parsePost, splitSchedule, taipeiStamp } from '../groupbuy/js/parse.js';
import { classify, brandOf } from '../groupbuy/js/categories.js';
import { status, dueText, combine, filterItems, defaultFilters, matchesQuery, timeline, calendarUrl, filtersToQuery, queryToFilters } from '../groupbuy/js/core.js';
import { compareQuery, matchScore, pickOffers, cheapest, priceVerdict, SHOPS } from '../groupbuy/js/compare.js';

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
  assert.equal(dueText(item({ closeAt: '2026-10-18' }), now), '明天結單');
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

// 團媽 FB 粉專長文（七先生與艾小姐，節錄）：《》標商品、「糰」寫法、文末 hashtag 品牌
const FB_CHESTNUT = `當天下單，隔天中午前就到貨！！萬歲牌真的是光速模範生！
我自己之前有次在官網訂都還要等兩、三天，所以後來都趁自己開糰補好補滿。
這檔是年度最後一糰，很難得有從過年後就一路缺貨的《甘栗仁》，成分單純僅栗子本人，已做去殼處理吃起來很方便。
滿 888元的卡迪那薯條造型食物封口夾也很棒，一組 12支有專屬薯條紙盒盛裝，還附磁鐵方便吸附在冰箱上。
雖然這糰一路開到 10/22，下單禮跟滿額禮都是有限量的，有興趣的朋友請盡量早早出手呦～感恩。`;
const FB_CHESTNUT_REEL = `過年後就缺貨的香甜甘栗終於重出江湖啦！
成份單純僅栗子本身，還通過安心履歷認證，大小朋友都能放心吃。
萬歲牌限時～10/22：
https://linkgoods.com/tw/sevenesther
#七先生與艾小姐 #萬歲牌 #萬歲牌堅果`;
const FB_BLENDER = `超美的《麗克特調理機》首度降價！一台直接降 300元，五色現貨有限量。（留 言「調理機」傳限量優惠給您）
如果平常喜歡自己下廚，又不想為了處理不同食材買一堆廚房工具，這台真的很實用！
《電動研磨罐》也是我的心頭好，一組兩支還附專屬木質磁吸底座，限量降價只要 990元！
#七先生與艾小姐 #麗克特 #麗克特調理機`;
const FB_BAG = `業績太好老闆龍心大悅，超強旅人擴充後背包 38L一咖省 600元！！
👉限時：https://citiesocial.co/p14EX
我平常出門很怕跟別人撞衫、撞包，唯一例外，就是我有開糰的包包！
《BAGSMART 旅人休閒擴充後背包》是我很推薦的旅行好物。
BAGSMART 旅人休閒後背包 38L 擴充款，五色現貨，官網售價 2,399 元/個，我們糰價限時只要 1,799 元，一咖直接省 600 元！
#七先生與艾小姐 #旅行包包`;

test('團媽 FB long posts: 《》 product names, 糰, hashtag brands, own-line prices', () => {
  const a = parsePost({ text: FB_CHESTNUT, ref });
  assert.equal(a.product, '萬歲牌 甘栗仁');
  assert.equal(a.category, '美食生鮮');
  assert.equal(a.closeAt, '2026-10-22');
  assert.equal(a.price, null, '「一組 12支」「滿 888元」不是價格');
  assert.ok(a.isGroupBuy);

  const b = parsePost({ text: FB_CHESTNUT_REEL, ref });
  assert.equal(b.product, '萬歲牌 甘栗');
  assert.equal(b.closeAt, '2026-10-22', '「限時～10/22」是結單日');
  assert.equal(b.openAt, null);
  assert.equal(b.orderUrl, 'https://linkgoods.com/tw/sevenesther');

  const c = parsePost({ text: FB_BLENDER, ref });
  assert.equal(c.product, '麗克特調理機');
  assert.equal(c.category, '家電');
  assert.equal(c.price, null, '990 元是另一個商品（研磨罐）的價格');

  const d = parsePost({ text: FB_BAG, ref });
  assert.equal(d.product, 'BAGSMART 旅人休閒擴充後背包');
  assert.equal(d.price, 1799);
  assert.equal(d.originalPrice, 2399);
  assert.equal(d.orderUrl, 'https://citiesocial.co/p14EX');
  assert.equal(d.category, '服飾配件');

  assert.ok(groupBuyScore('開糰囉！跟糰價只要 $990，10/22 結單').isGroupBuy);
  assert.equal(parsePrice('一組 12支有專屬紙盒').price, null);
  assert.equal(parsePrice('一組 $590，兩組更便宜').price, 590);
  assert.equal(parseWindow('即日起～10/31', ref).closeAt, '2026-10-31');
});

test('combine merges two posts about the same 團 from one 團媽', () => {
  const base = { source: 'rss', platform: 'Facebook', authorName: '七先生與艾小姐', closeAt: '2026-10-22', url: 'https://www.facebook.com/x/posts/1' };
  const out = combine([
    { file: 'rss.json', items: [
      item({ ...base, id: 'facebook:1', product: '萬歲牌 甘栗仁' }),
      item({ ...base, id: 'facebook:2', url: 'https://www.facebook.com/reel/2', product: '萬歲牌 甘栗', orderUrl: 'https://linkgoods.com/tw/sevenesther' }),
      item({ ...base, id: 'facebook:3', url: 'https://www.facebook.com/x/posts/3', product: '麗克特調理機' }),
    ] },
    // 團媽網站同一天結單的相關商品不合併
    { file: 'pages.json', items: [item({ source: 'pages', id: 'p:1', authorName: '主夫尼克團購', closeAt: '2026-10-20', product: 'Nespresso膠囊' }), item({ source: 'pages', id: 'p:2', authorName: '主夫尼克團購', closeAt: '2026-10-20', product: 'Nespresso膠囊咖啡機', url: 'https://x/2' })] },
  ]);
  const fb = out.filter((x) => x.source === 'rss');
  assert.equal(fb.length, 2);
  assert.equal(fb[0].product, '萬歲牌 甘栗仁');
  assert.equal(fb[0].orderUrl, 'https://linkgoods.com/tw/sevenesther');
  assert.equal(out.filter((x) => x.source === 'pages').length, 2);
});

test('price comparison: search words, same-product matching, verdict', () => {
  assert.equal(compareQuery({ product: 'OXO 按壓保鮮盒 8 件組', category: '居家生活' }), 'OXO 按壓保鮮盒');
  assert.equal(compareQuery({ product: '萬歲牌 甘栗仁', category: '美食生鮮' }), '萬歲牌 甘栗仁');
  assert.equal(compareQuery({ product: '飯店住宿券', category: '旅遊票券' }), null, '票券不比價');
  assert.equal(compareQuery({ product: '好物', category: '其他' }), null, '太籠統不比價');

  const q = 'OXO 按壓保鮮盒';
  assert.equal(matchScore(q, '【Glasslock】強化玻璃保鮮盒'), 0, '品牌不同');
  assert.equal(matchScore(q, '美國OXO POP 按壓保鮮盒專用配件-米飯匙'), 0, '配件不算');
  assert.ok(matchScore(q, '【美國OXO】POP 按壓密封收納保鮮盒-正方0.4L') >= 0.5);
  const offers = pickOffers(q, [
    { name: '美國OXO POP 正方按壓保鮮盒0.4L', price: 349, url: 'https://tw.buy.yahoo.com/a' },
    { name: '美國OXO POP 小正方按壓保鮮盒0.2L', price: 249, url: 'https://tw.buy.yahoo.com/b' },
    { name: 'OXO 好好握矽膠刮刀', price: 99, url: 'https://tw.buy.yahoo.com/c' },
    { name: '沒有網址', price: 1, url: '' },
  ]);
  assert.deepEqual(offers.map((o) => o.price), [249, 349]);

  const all = { pchome: [], momo: [{ name: 'x', price: 125, url: 'https://m/1' }], yahoo: [{ name: 'y', price: 99, url: 'https://y/1' }] };
  assert.deepEqual(cheapest(all).map((o) => o.shop), ['yahoo', 'momo']);
  assert.deepEqual(priceVerdict({ price: 89 }, all), { kind: 'good', diff: 10, shop: 'Yahoo', text: '團購價比網路最低（Yahoo）便宜 $10' });
  assert.equal(priceVerdict({ price: 150 }, all).kind, 'warn');
  assert.equal(priceVerdict({ price: null }, all), null);
  assert.match(SHOPS.coupang.search('萬歲牌 甘栗仁'), /^https:\/\/www\.tw\.coupang\.com\/search\?q=/);
});

test('price comparison without a dictionary brand: anchors and vague names', () => {
  assert.equal(compareQuery({ product: '小帳篷', category: '運動戶外' }), null, '太籠統');
  assert.equal(matchScore('波琳小姐蝴蝶酥', '【HERA 赫拉】熊熊小姐蝴蝶結髮夾'), 0, '沒有「波琳」');
  assert.ok(matchScore('源鮮生菜', '【源鮮智慧農場】地中海蔬食生菜箱180g x 4袋') >= 0.5);
  assert.equal(matchScore('MOODO浴巾 內衣 乾髮帽', '【FUN HOUSE】加厚珊瑚絨乾髮帽-任選2入組'), 0, '開頭英文名要對上');
  assert.equal(matchScore('沛樂保鮮盒', '【AKWATEK】304全防水智能音樂保溫杯 加贈保鮮盒'), 0, '沛樂是品牌');
  assert.ok(matchScore('沛樂保鮮盒', '【Prepara沛樂生活】Latchlok 系列 TRITAN 保鮮盒 4件') >= 0.3);
});
