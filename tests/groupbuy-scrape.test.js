import test from 'node:test';
import assert from 'node:assert/strict';
import { parseThreadsHtml, threadsNoResults, threadsPost, parseDdgHtml, ddgBlocked, igPostFromDdg, fbPostFromDdg, threadsPostFromDdg, parseCalendarText, pagePost, codeOf, parseFeed, feedPost, platformOf, htmlToText } from '../scripts/groupbuy/lib/sources.mjs';
import { postToItems, mergeItems, rederive, expireOf, validateItem, rotate } from '../scripts/groupbuy/lib/items.mjs';
import { normalizeWatch, DEFAULT_KEYWORDS } from '../scripts/groupbuy/lib/watch.mjs';
import { pchomeResults, ldItemList, yahooResults } from '../scripts/groupbuy/lib/shops.mjs';

// Threads 未登入搜尋頁：貼文藏在 <script type="application/json" data-sjs>（真實結構，欄位精簡）
const post = (code, username, text, takenAt, reply = null) => ({ code, taken_at: takenAt, like_count: 3, caption: { text }, user: { username, full_name: `${username} 名稱` }, text_post_app_info: { direct_reply_count: 1, reply_to_author: reply } });
const THREADS_HTML = `<html><head></head><body>
<script type="application/json" data-content-len="10" data-sjs>{"require":[["ScheduledServerJS","handle",null,[{"__bbox":{"result":{"data":{"searchResults":{"edges":[{"node":{"thread":{"thread_items":[
{"post":${JSON.stringify(post('Deje-cBGJXr', 'ms.tomato_2026', 'Tangle & Swirlz 扭扭樂開團✨💗\n\n款式整理下來光Swirlz就有46款‼️\nTangle也有快20款\n\n我要趁全館免運多囤幾個起來換著玩！！', 1792152036))}},
{"post":${JSON.stringify(post('DelLKj3gUCs', '_kuromiqzy.7ep', '開團三麗鷗1/$215！ 湊團成功會告知\n萬聖節🎃｜芭蕾🩰小公仔\n\n須先下單賣貨便￼ \n不接受缺A不要B 下單前請三思', 1792208759))}},
{"post":${JSON.stringify(post('DMzLMHpz3nd', 'yenchen_chu', '我是一位團購主，目前經營一個近 8000 人的團購群組，活躍度高、購買力強。\n目前正在尋找 美妝保養品 或 生活小物類商品 的合作廠商，\n若您有合適的品項、願意配合團購開團，歡迎私訊或留言洽談，期待與您合作！', 1754023828))}},
{"post":${JSON.stringify(post('DelSdqEDSQz', '__yzz.20', '▓今天社群限時開團一款波點包包▓\n很適合演唱會帶去拍照~\n只要1XX💰', 1792212669))}},
{"post":${JSON.stringify(post('Reply123', 'someone', '我也想跟團！開團啦', 1792212669, { username: 'x' }))}}
]}}}]}}}}}]]]}</script>
<script type="application/json" data-sjs>not json</script></body></html>`;

test('Threads search page: posts from embedded JSON, replies flagged, empty page detected', () => {
  const posts = parseThreadsHtml(THREADS_HTML);
  assert.equal(posts.length, 5);
  const p = threadsPost(posts[0]);
  assert.equal(p.id, 'threads:Deje-cBGJXr');
  assert.equal(p.url, 'https://www.threads.com/@ms.tomato_2026/post/Deje-cBGJXr');
  assert.equal(p.postedAt, '2026-10-16T12:00:36.000Z');
  assert.equal(threadsPost(posts[4]).isReply, true);
  assert.equal(threadsNoResults(THREADS_HTML), false);
  assert.equal(threadsNoResults('<div>"開團 寶寶" 查無結果。 登入或註冊 Threads</div>'), true);

  const items = posts.map((x) => threadsPost(x)).flatMap((x) => postToItems(x));
  assert.deepEqual(items.map((x) => [x.product, x.category]), [
    ['Tangle & Swirlz 扭扭樂', '育兒親子'],
    ['三麗鷗 小公仔', '文創周邊'],
    ['波點包包', '服飾配件'],
  ]);
  assert.equal(items[1].price, 215);
  assert.equal(items[2].priceText, '只要1XX');
  assert.ok(items.every((x) => !validateItem(x).length));
});

// DuckDuckGo HTML 結果（真實片段）：兩種摘要格式
const DDG_HTML = `<div id="links" class="results">
<div class="result results_links results_links_deep web-result "> <div class="links_main links_deep result__body"> <h2 class="result__title"> <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.instagram.com%2Freel%2FDedSWBMvJ4g%2F&amp;rut=b3f4">初六媽 | 山水 Sansui 輕淨吸無線吸塵器開團啦! ️優惠時間：10/13～10/22 家裡有小孩的媽咪一定懂 地板常常才剛清完 ...</a> </h2> <a class="result__url" href="//duckduckgo.com/l/?uddg=x"> www.instagram.com/reel/DedSWBMvJ4g/ </a> <a class="result__snippet" href="//duckduckgo.com/l/?uddg=x">5 likes, 4 comments - littlesixmom on October 13, 2026: &quot;🧹 山水 SANSUI 輕淨吸無線吸塵器開團啦!</a> </div></div>
<div class="result results_links results_links_deep web-result "> <div class="links_main links_deep result__body"> <h2 class="result__title"> <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.instagram.com%2Fp%2FDeZQHsmzQHo%2F&amp;rut=3000">小尹 | 信食為糧「樂米脆」開團 開團 ... - Instagram</a> </h2> <a class="result__snippet" href="//duckduckgo.com/l/?uddg=x">Follow 13likes peach_1108 🚨🌾 樂米脆｜限時開團啦～～ 🌾🚨大人小孩都喜歡的酥脆米食小點心😋💕🇹🇼 100%國產契作稻米 非油炸・低溫烘焙🚫 ...</a> </div></div>
<div class="result results_links results_links_deep web-result "> <div class="links_main links_deep result__body"> <h2 class="result__title"> <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.threads.com%2F%40iey326%2Fpost%2FDUmM_W2jSAH%2Fabc&amp;rut=1">不用太誇張，真的又來開團</a> </h2> <a class="result__snippet" href="//duckduckgo.com/l/?uddg=x">利莉 (@iey326). 不用太誇張，真的又來開團 商品：台灣辣妹 價格：350</a> </div></div>
<div class="result results_links results_links_deep web-result "> <div class="links_main links_deep result__body"> <h2 class="result__title"> <a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fwww.instagram.com%2Fsomeone%2F&amp;rut=1">someone (@someone) • Instagram</a> </h2> <a class="result__snippet" href="//duckduckgo.com/l/?uddg=x">個人頁不是貼文</a> </div></div>
</div>`;

test('DuckDuckGo results: IG posts with date and handle, Threads posts, profiles skipped', () => {
  const rs = parseDdgHtml(DDG_HTML);
  assert.equal(rs.length, 4);
  assert.equal(rs[0].url, 'https://www.instagram.com/reel/DedSWBMvJ4g/');
  const a = igPostFromDdg(rs[0]);
  assert.equal(a.id, 'instagram:DedSWBMvJ4g');
  assert.equal(a.author, 'littlesixmom');
  assert.equal(a.authorName, '初六媽');
  assert.equal(a.postedAt, '2026-10-13T04:00:00.000Z');
  const [item] = postToItems(a);
  assert.equal(item.product, '山水 Sansui 輕淨吸無線吸塵器');
  assert.equal(item.category, '家電');
  assert.equal(item.openAt, '2026-10-13');
  assert.equal(item.closeAt, '2026-10-22');
  const b = igPostFromDdg(rs[1]);
  assert.equal(b.author, 'peach_1108');
  assert.equal(b.postedAt, null);
  assert.equal(postToItems(b)[0].category, '美食生鮮');
  const t = threadsPostFromDdg(rs[2]);
  assert.equal(t.url, 'https://www.threads.com/@iey326/post/DUmM_W2jSAH');
  assert.equal(postToItems(t)[0].price, 350);
  assert.equal(igPostFromDdg(rs[3]), null);
  assert.equal(fbPostFromDdg({ url: 'https://www.facebook.com/somepage', title: 'x', snippet: '' }), null);
  assert.equal(fbPostFromDdg({ url: 'https://www.facebook.com/abc/posts/123?x=1', title: '小花媽 - 開團 | Facebook', snippet: '開團啦' }).url, 'https://www.facebook.com/abc/posts/123');
  assert.ok(ddgBlocked(202, ''));
  assert.ok(!ddgBlocked(200, DDG_HTML));
  assert.equal(codeOf('https://www.threads.net/@a/post/ABC-1'), 'ABC-1');
});

// 團媽網站開團日曆（Strikingly 頁面的真實文字）
const CALENDAR = `餅皮媽團團Buy

寶寶用品。廚房。家電。生活好物團購

正在開團ing
開團日曆
正在開團ing

🌟recolte Cordless Bonne無線萬用調理機(10/31收單)

🛒搶購網址→https://gbf.tw/exrau

🌟GOLDLIFE​頂級厚切高密度不吸水木纖維砧板開團(10/19收單)

🛒搶購網址→https://lihi1.me/sbGY8

🌟主婦們最愛的BRUNO 真空封口機來了!!(10/20收單)

🛒搶購網址→https://shop.labebe.tw/astb3

🌟現貨到!!周歲禮物首選~奧地利Scoot&Ride二合一滑板車開團(10/31收單)

🛒搶購網址→https://gbf.tw/dnupr

🌟萬聖節不給糖就搗蛋來了!!ACE軟糖/HIPP果泥

🛒搶購網址→https://gbf.tw/k8nh4

本月開團日曆

(不定期都會再安插團喔)

Copyright 2019`;

test('group-buy calendar page: one item per line with close date and order link', () => {
  const rows = parseCalendarText(CALENDAR, { ref: '2026-10-17 20:00' });
  assert.deepEqual(rows.map((r) => [r.product, r.closeAt, r.orderUrl]), [
    ['recolte Cordless Bonne無線萬用調理機', '2026-10-31', 'https://gbf.tw/exrau'],
    ['GOLDLIFE 頂級厚切高密度不吸水木纖維砧板', '2026-10-19', 'https://lihi1.me/sbGY8'],
    ['BRUNO 真空封口機', '2026-10-20', 'https://shop.labebe.tw/astb3'],
    ['奧地利Scoot&Ride二合一滑板車', '2026-10-31', 'https://gbf.tw/dnupr'],
    ['ACE軟糖/HIPP果泥', null, 'https://gbf.tw/k8nh4'],
  ]);
  const page = { name: '餅皮媽團團Buy', url: 'https://example.mystrikingly.com/' };
  const [it] = postToItems(pagePost(page, rows[3], '2026-10-17 20:00'));
  assert.equal(it.platform, '團媽網站');
  assert.equal(it.category, '育兒親子');
  assert.equal(it.url, 'https://gbf.tw/dnupr');
  assert.equal(it.authorUrl, page.url);
  assert.equal(it.expireAt, '2026-11-01');
});

// 部落客團購預告（倩兒☓魯蛋 Adrianne Life 真實片段）：「10/23止！商品」＋「►跟團去：網址」「⭕圖文心得：網址」
const BLOG_PREVIEW = `▍現正開團中 ▍
10/23止！ 從寶寶第一顆牙開始顧！齒妍堂兒童口腔保健全系列健齒噴霧／清潔棉棒／兒童漱口水／牙膏
►跟團去：https://lab52.tw/luvadrianne2610
⭕圖文心得：https://reurl.cc/XxAGAg
10/30止！ Cofit大餐救援包｜飲食管理神隊友
►跟團去：https://hi.cofit.me/pfmio
⭕圖文心得：https://reurl.cc/xeNapZ
▍2026/11 團購排程
11/5 monbear X crywolf 冬季外套｜換季添新衣、冬天出遊先準備！想幫孩子挑外套的，這團先記下來！
►跟團去：
⭕圖文心得：https://pse.is/9qqz9p
⭕媞妍型+光潤型圖文心得：https://reurl.cc/WqQo55
加倩兒官方LINE HTTPS://LIN.EE/SYBB8GL
看限時動態加IG HTTPS://REURL.CC/GXNZRV`;

// 部落客團購總覽（主夫尼克真實片段）：商品名是超連結，下一行只有結團日；後面的詳細介紹沒有連結、名稱不同
const BLOG_INDEX = `有問題直接私訊找我（⚠️避免訊息、貼圖洗版）
Line@一對一客服： https://lin.ee/bNH5N8h
目前開團中總覽
本週新開團
小v鬆餅機.熱壓吐司機
10/22結團
BALMUDA The Range S微波爐
10/26結團
伯尼寢具天絲床包
10/31結團
本週新開團
10/22 結團 小v鬆餅機團購》日本Vitantonio熱壓吐司機.鬆餅機評價.食譜
10/26 結團 BALMUDA團購》百慕達微波爐`;
const BLOG_INDEX_LINKS = [
  { text: '小v鬆餅機.熱壓吐司機', href: 'https://nickjufu.tw/vitantonio-waffle/' },
  { text: 'BALMUDA The Range S微波爐', href: 'https://nickjufu.tw/balmuda-s/' },
  { text: '伯尼寢具天絲床包', href: 'https://nickjufu.tw/bonybed/' },
];

test('blog group-buy previews and indexes: close dates, order vs article links, no duplicates or rules text', () => {
  const a = parseCalendarText(BLOG_PREVIEW, { ref: '2026-10-17 20:00' });
  assert.deepEqual(a.map((r) => [r.product, r.openAt, r.closeAt, r.orderUrl, r.linkUrl]), [
    ['齒妍堂兒童口腔保健全系列健齒噴霧 清潔棉棒 兒童漱口水 牙膏', null, '2026-10-23', 'https://lab52.tw/luvadrianne2610', 'https://reurl.cc/XxAGAg'],
    ['Cofit大餐救援包', null, '2026-10-30', 'https://hi.cofit.me/pfmio', 'https://reurl.cc/xeNapZ'],
    ['monbear X crywolf 冬季外套', '2026-11-05', null, null, 'https://pse.is/9qqz9p'],
  ]);
  const b = parseCalendarText(BLOG_INDEX, { ref: '2026-10-17 20:00', links: BLOG_INDEX_LINKS });
  assert.deepEqual(b.map((r) => [r.product, r.closeAt, r.linkUrl]), [
    ['小v鬆餅機.熱壓吐司機', '2026-10-22', 'https://nickjufu.tw/vitantonio-waffle/'],
    ['BALMUDA The Range S微波爐', '2026-10-26', 'https://nickjufu.tw/balmuda-s/'],
    ['伯尼寢具天絲床包', '2026-10-31', 'https://nickjufu.tw/bonybed/'],
  ]);
  const [it] = postToItems(pagePost({ name: '主夫尼克團購', url: 'https://nickjufu.tw/6358/' }, b[1], '2026-10-17 20:00'));
  assert.equal(it.url, 'https://nickjufu.tw/balmuda-s/');
  assert.equal(it.category, '家電');
});

test('accumulate across runs: keep unexpired items, keep firstSeenAt, drop expired ones', () => {
  const prev = [
    { id: 'a', product: '還沒結單', closeAt: '2026-10-20', firstSeenAt: '2026-10-10T00:00:00Z' },
    { id: 'b', product: '已過結單隔天', closeAt: '2026-10-15', firstSeenAt: '2026-10-01T00:00:00Z' },
    { id: 'c', product: '這次又抓到', firstSeenAt: '2026-10-12T00:00:00Z' },
    { id: 'e', product: '沒日期、11 天前抓到', firstSeenAt: '2026-10-06T00:00:00Z' },
  ];
  const fresh = [{ id: 'c', product: '這次又抓到（新內文）' }, { id: 'd', product: '新的', postedAt: '2026-10-16T04:00:00Z' }];
  const out = mergeItems(fresh, prev, { now: '2026-10-17T04:00:00Z', today: '2026-10-17' });
  assert.deepEqual(out.map((x) => x.id), ['a', 'c', 'd']);
  assert.equal(out.find((x) => x.id === 'c').firstSeenAt, '2026-10-12T00:00:00Z');
  assert.equal(out.find((x) => x.id === 'c').product, '這次又抓到（新內文）');
  assert.equal(out.find((x) => x.id === 'c').expireAt, '2026-10-22'); // 沒有發文日：第一次抓到 + 10 天
  assert.equal(out.find((x) => x.id === 'd').firstSeenAt, '2026-10-17T04:00:00Z');
  assert.deepEqual(mergeItems(fresh, prev, { today: '2026-10-17', keepPrev: false }).map((x) => x.id), ['c', 'd']);
  assert.equal(expireOf({ closeAt: '2026-10-26 23:59' }), '2026-10-27');
  assert.equal(expireOf({ openAt: '2026-10-20' }), '2026-11-03');
  assert.equal(expireOf({ postedAt: '2026-10-17T04:00:00Z' }), '2026-10-27');
});

test('re-derive stored posts with the current rules, keep firstSeenAt, drop posts that no longer qualify', () => {
  const post = { source: 'threads', id: 'threads:P1', url: 'https://www.threads.com/@a/post/P1', author: 'a', text: '刺繡襪子開團！\n售價 $280\n10/25收單', postedAt: '2026-10-16T04:00:00Z', via: 'search' };
  const [item] = postToItems(post);
  assert.equal(item.post.text, post.text);
  // 舊版解析出來的商品名不好，重算後更新；找廠商文重算後移除；沒存原文的舊資料照留
  const stale = [
    { ...item, product: '舊的錯誤商品名', firstSeenAt: '2026-10-16T05:00:00Z' },
    { ...item, id: 'threads:P2', post: { ...post, id: 'threads:P2', text: '我是團購主，想找合作廠商' }, firstSeenAt: '2026-10-16T05:00:00Z' },
    { id: 'legacy', product: '沒有原文', firstSeenAt: '2026-10-16T05:00:00Z' },
  ];
  const out = rederive(stale);
  assert.deepEqual(out.map((x) => [x.id, x.product]), [['threads:P1', '刺繡襪子'], ['legacy', '沒有原文']]);
  assert.equal(out[0].firstSeenAt, '2026-10-16T05:00:00Z');
  assert.equal(out[0].closeAt, '2026-10-25');
});

test('schedule post becomes several items with their own ids', () => {
  const items = postToItems({ source: 'threads', id: 'threads:X', url: 'https://www.threads.com/@a/post/X', text: '本週開團預告🔥\n10/20 Combi 推車\n10/22 童裝外套\n10/24 Dyson 吹風機（10/27收單）', postedAt: '2026-10-17T04:00:00Z' });
  assert.deepEqual(items.map((x) => [x.id, x.product, x.category]), [
    ['threads:X#1', 'Combi 推車', '育兒親子'],
    ['threads:X#2', '童裝外套', '育兒親子'],
    ['threads:X#3', 'Dyson 吹風機', '家電'],
  ]);
});

test('watchlist: handles from URLs, dedupe, default keywords, keyword rotation', () => {
  const w = normalizeWatch({ threads: ['@abc', 'https://www.threads.com/@abc', 'def/'], instagram: ['https://www.instagram.com/mia_1101_/'], pages: ['https://x.tw/', { name: 'y', url: 'ftp://no' }] });
  assert.deepEqual(w.threads, ['abc', 'def']);
  assert.deepEqual(w.instagram, ['mia_1101_']);
  assert.deepEqual(w.pages, [{ url: 'https://x.tw/' }]);
  assert.deepEqual(w.keywords, DEFAULT_KEYWORDS);
  assert.deepEqual(rotate(['a', 'b', 'c'], 2, 2), ['c', 'a']);
  assert.deepEqual(rotate([], 2, 0), []);
});

// RSS.app 把 FB 粉專轉成的 RSS（CDATA 包 HTML，標題是內文第一行截斷）
const RSSAPP_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" version="2.0">
<channel>
<title><![CDATA[維媽育兒生活 Smile Life | Facebook]]></title>
<description><![CDATA[維媽育兒生活 Smile Life]]></description>
<link>https://www.facebook.com/s.smilelife</link>
<generator>RSS.app</generator>
<atom:link href="https://rss.app/feeds/abc123.xml" rel="self" type="application/rss+xml"/>
<item>
<title><![CDATA[【開團】OXO 按壓保鮮盒 8 件組 ⏰10/20(二) 20:00 ~ 10/26(一) 23:59...]]></title>
<description><![CDATA[<div><img src="https://scontent.xx.fbcdn.net/a.jpg" style="width: 100%;" /><div>【開團】OXO 按壓保鮮盒 8 件組<br/>⏰10/20(二) 20:00 ~ 10/26(一) 23:59<br/>💰團購價 $1,280（原價 $1,980）<br/>👉下單連結：https://reurl.cc/abc123</div></div>]]></description>
<link>https://www.facebook.com/s.smilelife/posts/pfbid02AbCdEf</link>
<guid isPermaLink="false">1a2b3c</guid>
<dc:creator><![CDATA[維媽育兒生活 Smile Life]]></dc:creator>
<pubDate>Thu, 15 Oct 2026 12:00:00 GMT</pubDate>
<media:content medium="image" url="https://scontent.xx.fbcdn.net/a.jpg"/>
</item>
<item>
<title><![CDATA[週末帶寶寶去宜蘭玩，分享我們住的親子飯店]]></title>
<description><![CDATA[<div>週末帶寶寶去宜蘭玩，分享我們住的親子飯店<br/>房間超大、有溜滑梯</div>]]></description>
<link>https://www.facebook.com/s.smilelife/posts/pfbid0XyZ</link>
<guid isPermaLink="false">4d5e6f</guid>
<pubDate>Wed, 14 Oct 2026 03:00:00 GMT</pubDate>
</item>
</channel></rss>`;

// FetchRSS：HTML 以實體跳脫、內文帶浮水印，連結是 permalink.php
const FETCHRSS_FEED = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
<title>七先生與艾小姐</title>
<link>https://www.facebook.com/estherhsiao0202/</link>
<description>七先生與艾小姐 (Feed generated with FetchRSS)</description>
<generator>FetchRSS</generator>
<item>
<title>限時開團｜Mistifi 噴油瓶 10/23收單 團購價 $399</title>
<link>https://www.facebook.com/permalink.php?story_fbid=pfbid0QwErTy&amp;id=100063</link>
<description>&lt;span&gt;限時開團｜Mistifi 噴油瓶&lt;/span&gt;&lt;br/&gt;10/23收單 團購價 $399&lt;br/&gt;&lt;br/&gt;&lt;img src="https://x.example/y.jpg"&gt;&lt;br/&gt;&lt;br/&gt;(Feed generated with FetchRSS)</description>
<pubDate>Sat, 17 Oct 2026 01:30:00 +0000</pubDate>
<guid isPermaLink="false">https://www.facebook.com/permalink.php?story_fbid=pfbid0QwErTy&amp;id=100063</guid>
</item>
</channel></rss>`;

test('RSS feeds of FB pages: RSS.app and FetchRSS items become posts with stable ids', () => {
  const a = parseFeed(RSSAPP_FEED);
  assert.equal(a.title, '維媽育兒生活 Smile Life | Facebook');
  assert.equal(a.link, 'https://www.facebook.com/s.smilelife');
  assert.equal(a.items.length, 2);
  const entry = { name: '維媽育兒生活', page: 'https://www.facebook.com/s.smilelife', feed: 'https://rss.app/feeds/abc123.xml' };
  const p = feedPost(entry, a.items[0]);
  assert.equal(p.id, 'facebook:pfbid02AbCdEf');
  assert.equal(p.platform, 'Facebook');
  assert.equal(p.author, 's.smilelife');
  assert.equal(p.authorName, '維媽育兒生活');
  assert.equal(p.postedAt, '2026-10-15T12:00:00.000Z');
  // 標題是內文開頭的截斷：不重複
  assert.equal(p.text.split('\n')[0], '【開團】OXO 按壓保鮮盒 8 件組');
  assert.ok(!p.text.includes('<'));

  const items = a.items.map((x) => feedPost(entry, x)).flatMap((x) => postToItems(x));
  assert.equal(items.length, 1, '心得文不收');
  const [it] = items;
  assert.equal(it.platform, 'Facebook');
  assert.equal(it.source, 'rss');
  assert.match(it.product, /OXO 按壓保鮮盒/);
  assert.equal(it.openAt, '2026-10-20 20:00');
  assert.equal(it.closeAt, '2026-10-26 23:59');
  assert.equal(it.price, 1280);
  assert.equal(it.orderUrl, 'https://reurl.cc/abc123');
  assert.equal(it.post.platform, 'Facebook');
  assert.deepEqual(validateItem(it), []);
  // 累積中的舊資料重算時，平台不會變回來源名稱
  assert.equal(rederive(items)[0].platform, 'Facebook');

  const f = parseFeed(FETCHRSS_FEED);
  const q = feedPost({ name: '七先生與艾小姐', page: 'https://www.facebook.com/estherhsiao0202/' }, f.items[0]);
  assert.equal(q.url, 'https://www.facebook.com/permalink.php?story_fbid=pfbid0QwErTy&id=100063');
  assert.equal(q.id, 'facebook:pfbid0QwErTy');
  assert.equal(q.author, 'estherhsiao0202');
  assert.ok(!/FetchRSS/.test(q.text));
  const [m] = postToItems(q);
  assert.match(m.product, /Mistifi/);
  assert.equal(m.closeAt, '2026-10-23');
  assert.equal(m.price, 399);
  assert.equal(m.category, '居家生活');
});

test('Atom and JSON Feed entries; platform from link; non-FB feeds', () => {
  const atom = parseFeed(`<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title type="text">團媽 IG</title>
<link rel="self" href="https://rss.app/feeds/x.atom"/><link rel="alternate" href="https://www.instagram.com/mama/"/>
<entry><title>開團啦 寶寶餐椅 10/30結單</title><link rel="alternate" href="https://www.instagram.com/p/DAbC123/"/><id>urn:1</id>
<updated>2026-10-16T08:00:00Z</updated><content type="html">&lt;p&gt;開團啦 寶寶餐椅&lt;/p&gt;&lt;p&gt;10/30結單&lt;/p&gt;</content></entry></feed>`);
  assert.equal(atom.link, 'https://www.instagram.com/mama/');
  assert.equal(atom.items[0].link, 'https://www.instagram.com/p/DAbC123/');
  assert.equal(atom.items[0].text, '開團啦 寶寶餐椅\n10/30結單');
  const ig = feedPost({ name: '團媽', page: 'https://www.instagram.com/mama/' }, atom.items[0]);
  assert.equal(ig.platform, 'Instagram');
  assert.equal(ig.id, `instagram:${codeOf(ig.url)}`);

  const json = parseFeed(JSON.stringify({ version: 'https://jsonfeed.org/version/1.1', title: 'x', home_page_url: 'https://www.facebook.com/x', items: [{ id: '9', url: 'https://www.facebook.com/x/videos/123456/', content_html: '<p>開團 兒童雨衣</p>', date_published: '2026-10-16T08:00:00Z' }] }));
  assert.equal(json.items[0].text, '開團 兒童雨衣');
  assert.equal(feedPost({ page: 'https://www.facebook.com/x' }, json.items[0]).id, 'facebook:123456');
  assert.equal(platformOf('https://m.facebook.com/x'), 'Facebook');
  assert.equal(platformOf('https://www.threads.com/@a/post/B'), 'Threads');
  assert.equal(platformOf('https://example.com/'), null);
  assert.equal(htmlToText('a&nbsp;&amp;&nbsp;b<br>c'), 'a & b\nc');
  assert.equal(htmlToText('開團<br/><br/>Generated with FetchRSS'), '開團');
  // FetchRSS 的 FB 介面字不算內文
  const ui = feedPost({ name: '七先生與艾小姐', page: 'https://www.facebook.com/estherhsiao0202' }, { link: 'https://www.facebook.com/823373055816761/posts/1678956853591706', title: "Photos from 七先生與艾小姐's post", text: "Photos from 七先生與艾小姐's post\n超美的《麗克特調理機》首度降價！", date: '2026-10-16T04:49:49Z' });
  assert.equal(ui.text, '超美的《麗克特調理機》首度降價！');
  assert.equal(ui.id, 'facebook:1678956853591706');
});

test('watchlist rss: feeds and pages kept, blanks and junk dropped', () => {
  const w = normalizeWatch({ rss: ['https://rss.app/feeds/a.xml', { name: '依娃', page: 'https://www.facebook.com/evalife.cc/', feed: '' }, { name: 'x', feed: 'javascript:alert(1)' }, null] });
  assert.deepEqual(w.rss, [
    { name: '', page: '', feed: 'https://rss.app/feeds/a.xml' },
    { name: '依娃', page: 'https://www.facebook.com/evalife.cc/', feed: '' },
  ]);
  assert.deepEqual(normalizeWatch({}).rss, []);
});

// 比價：購物網站搜尋結果（真實格式，節錄）
const PCHOME_JSON = JSON.stringify({ TotalRows: 155, Prods: [
  { Id: 'DEBM5Q-A900IAVWJ', Name: 'OXO POP按壓保鮮盒正方超值3入組-1Lx3(密封罐儲物罐)', Price: 1527, OriginPrice: 1527 },
  { Id: 'DEBM5Q-A900I9A26', Name: 'OXO POP 不鏽鋼按壓保鮮盒-小正方0.2L', Price: 399, OriginPrice: 399 },
] });
const MOMO_HTML = `<html><body><script type="application/ld+json">{ "@context": "https://schema.org", "@type": "WebPage", "@graph": [ { "@type": "BreadcrumbList", "itemListElement": [] }, { "@type": "ItemList", "name": "萬歲牌 甘栗仁", "numberOfItems": 2, "itemListElement": [
 { "@type": "Product", "name": "【萬歲牌】萬歲牌 特選甘栗 (30gX5包) 甘栗仁 全素", "position": 1, "url": "https://www.momoshop.com.tw/TP/TP0001571/goodsDetail/TP00015710000935", "offers": { "@type": "Offer", "price": 125, "priceCurrency": "TWD" } },
 { "@type": "Product", "name": "【Glasslock】強化玻璃保鮮盒", "position": 2, "url": "https://www.momoshop.com.tw/goods/GoodsDetail.jsp?i_code=15118862&Area=search&mdiv=403&oid=1_1&kw=x", "offers": { "@type": "Offer", "price": 499 } }
] } ] }</script></body></html>`;
const YAHOO_HTML = `<html><head><title>萬歲牌 甘栗仁-優惠推薦 | Yahoo購物中心</title></head><body>
<script id="isoredux-data" type="mime/invalid">{"pjaxLoading":false,"search":{"searched":true,"count":1,"ecsearch":{"hits":[{"ec_title":"萬歲牌特選甘栗30g*5包【愛買】","ec_price":"99.0","ec_productid":"p0830264781396","ec_item_url":"https://tw.buy.yahoo.com/gdsale/gdsale.asp?gdid=p0830264781396"},{"ec_title":"沒有價格的商品","ec_price":"","ec_item_url":"https://tw.buy.yahoo.com/gdsale/x.html"}]}}}</script></body></html>`;
const YAHOO_LD = `<script type="application/ld+json">[{"@type":"Organization","name":"Yahoo購物中心"},{"@type":"ItemList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@type":"Product","name":"美國OXO POP 長方三件組按壓保鮮盒","offers":{"@type":"Offer","url":"https://tw.buy.yahoo.com/gdsale/8816886.html","priceCurrency":"TWD","price":"1590"}}}]}]</script>`;

test('shop search results: PChome API, momo JSON-LD, Yahoo isoredux and JSON-LD', () => {
  const pc = pchomeResults(PCHOME_JSON);
  assert.deepEqual(pc[0], { name: 'OXO POP按壓保鮮盒正方超值3入組-1Lx3(密封罐儲物罐)', price: 1527, url: 'https://24h.pchome.com.tw/prod/DEBM5Q-A900IAVWJ' });
  const momo = ldItemList(MOMO_HTML);
  assert.equal(momo.length, 2);
  assert.equal(momo[0].price, 125);
  assert.equal(momo[1].url, 'https://www.momoshop.com.tw/goods/GoodsDetail.jsp?i_code=15118862', '去掉搜尋追蹤參數');
  assert.deepEqual(yahooResults(YAHOO_HTML), [{ name: '萬歲牌特選甘栗30g*5包【愛買】', price: 99, url: 'https://tw.buy.yahoo.com/gdsale/gdsale.asp?gdid=p0830264781396' }]);
  assert.deepEqual(yahooResults(YAHOO_LD), [{ name: '美國OXO POP 長方三件組按壓保鮮盒', price: 1590, url: 'https://tw.buy.yahoo.com/gdsale/8816886.html' }]);
  assert.deepEqual(ldItemList('<html>沒有資料</html>'), []);
});
