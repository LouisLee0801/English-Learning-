// 全網優惠券／優惠情報來源的解析（純函式）。抓取流程在 adapters/，這裡只處理 HTML／JSON／RSS。
import { clean, parsePeriod, parseDiscount } from './normalize.mjs';
import { hash } from './pool.mjs';
import { brandName } from '../../../deals/js/categories.js';

const decode = (s) =>
  String(s ?? '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
const text = (html) => clean(decode(String(html ?? '').replace(/<[^>]+>/g, ' ')));

const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const taipeiYmd = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(date);

/** 優惠類字詞：新聞／論壇標題至少要有一個，過濾掉非優惠文章 */
export const DEAL_WORDS = /優惠|折扣|折價|現折|折\$|\d折|買一送一|買1送1|第二件|第2件|第二杯|第2杯|半價|免費|送|特價|下殺|回饋|加碼|優惠碼|折扣碼|券|免運|限時|1元|一元|集點|贈|省\d|會員日|週年慶|早鳥/;

/**
 * 共用：把「標題型」情報轉成優惠。沒有期間的情報用發文日 + ttlDays 當作暫定期限並加註。
 */
export function feedDeal({ source, id, title, url, publishedAt, merchant, text: body = '', ttlDays = 7, tags = [], conditions = [] }) {
  const pub = publishedAt ? taipeiYmd(new Date(publishedAt)) : null;
  const ref = pub || taipeiYmd(new Date());
  const period = parsePeriod(title, ref);
  const p2 = period.endAt ? period : parsePeriod(body, ref);
  const { reward, minSpend } = parseDiscount(title);
  const t = [...tags];
  let endAt = p2.endAt;
  if (!endAt && pub) {
    endAt = addDays(pub, ttlDays);
    t.push('期限見原文');
  }
  return {
    id: `${source}:${id}`,
    kind: 'promo',
    source,
    merchant: merchant || brandName(title) || '優惠情報',
    title,
    reward: reward.type === 'gift' ? { ...reward, text: /買一送一|買1送1/.test(title) ? '買一送一' : /半價|第二(杯|件)/.test(title) ? '第二件優惠' : '優惠活動' } : reward,
    minSpend,
    code: null,
    conditions,
    tags: t,
    startAt: p2.startAt,
    endAt,
    publishedAt: publishedAt || null,
    url,
  };
}

// ---------- PTT 省錢板（列表頁；內文頁有 Cloudflare 驗證，只用標題） ----------

/** 解析看板列表頁：回傳 { posts, prev }，日期只有月/日，用 today 推年份 */
export function parsePttIndex(html, today) {
  const h = String(html);
  const posts = [];
  for (const raw of h.split('<div class="r-ent">').slice(1)) {
    const a = raw.match(/<a href="(\/bbs\/[^"]+\.html)">([\s\S]*?)<\/a>/);
    if (!a) continue; // 已刪除的文章
    const date = raw.match(/<div class="date">\s*(\d{1,2})\/(\d{1,2})\s*<\/div>/);
    const nrec = text(raw.match(/<div class="nrec">([\s\S]*?)<\/div>/)?.[1]);
    let ymd = null;
    if (date) {
      const [ty] = today.split('-').map(Number);
      ymd = `${ty}-${date[1].padStart(2, '0')}-${date[2].padStart(2, '0')}`;
      if (ymd > today) ymd = `${ty - 1}${ymd.slice(4)}`; // 年初看到去年 12 月的文章
    }
    posts.push({ url: `https://www.ptt.cc${a[1]}`, title: text(a[2]), date: ymd, pushes: nrec });
  }
  const prev = h.match(/<a class="btn wide" href="([^"]+)">‹ 上頁<\/a>/)?.[1];
  return { posts, prev: prev ? `https://www.ptt.cc${prev}` : null };
}

/** PTT Atom 訂閱源（https://www.ptt.cc/atom/<看板>.xml）：最新約 20 篇，含內文開頭 */
export function parseAtom(xml) {
  const out = [];
  for (const m of String(xml).matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const b = m[1];
    const pick = (tag) => decode(b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] || '').trim();
    const url = decode(b.match(/<link[^>]*href="([^"]+)"/)?.[1] || '');
    // 內文是 HTML（<pre> 包著）：保留換行，去掉標頭「作者／看板／標題／時間」
    const body = decode(pick('content'))
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter((l) => l && !/^(作者|看板|標題|時間)\s/.test(l))
      .join('\n');
    out.push({ url, title: pick('title'), published: pick('published') || pick('updated'), body });
  }
  return out;
}

/** PTT 文章 → 優惠；只收 [情報]／[分享]，排除置底公告與集中文 */
export function pttDeal(post) {
  const m = post.title.match(/^\[(情報|分享|限時|好康)\]\s*(.+)$/);
  if (!m || !(post.date || post.published)) return null;
  const title = m[2].replace(/^\s*[-–]\s*/, '');
  const id = post.url.match(/M\.(\d+\.A\.[0-9A-F]+)/)?.[1] || hash(post.url);
  const pushes = post.pushes === '爆' ? 100 : Number(post.pushes) || 0;
  const tags = pushes >= 100 ? ['推文爆'] : pushes >= 10 ? [`推 ${pushes}`] : [];
  // 發文時間：M.<unix 秒>.A.xxx
  const ts = Number(id.split('.')[0]);
  const body = clean(post.body || '');
  // 內文開頭幾句當作重點（網址與簽名檔不要）
  const lines = String(post.body || '')
    .split(/\n+/)
    .map(clean)
    .filter((l) => l.length > 3 && !/https?:|^--$|^※|^◆|發信站|文章網址/.test(l))
    .slice(0, 4)
    .map((l) => l.slice(0, 90));
  return feedDeal({
    source: 'ptt',
    id,
    title,
    url: post.url,
    publishedAt: ts > 1e9 ? new Date(ts * 1000).toISOString() : post.published || `${post.date}T12:00:00+08:00`,
    text: body,
    merchant: brandName(title) || brandName(body.slice(0, 200)) || null,
    tags,
    conditions: [...lines, 'PTT 省錢板網友情報，完整條件請點「前往」看原文'],
  });
}

// ---------- 食尚玩家優惠券（api.supertaste.tvbs.app） ----------

/** API 一筆 → 優惠 */
export function supertasteDeal(c) {
  const title = clean(c.flagship);
  const saved = Number(String(c.description || '').match(/省\s*([\d,]+)\s*元/)?.[1]?.replace(/,/g, '')) || null;
  const store = clean(c.store?.name);
  const parsed = parseDiscount(title);
  const reward = saved ? { type: 'amount', value: saved, unit: '省', text: clean(c.description) } : parsed.reward;
  const tags = [];
  if (c.is_exclusive) tags.push('食尚獨家');
  if (/最多|最高|起/.test(c.description || '')) tags.push('依品項不同');
  const area = clean(c.store?.area);
  return {
    id: `supertaste:${c.id}`,
    kind: 'coupon',
    source: 'supertaste',
    merchant: store || brandName(title) || '食尚玩家優惠',
    category: c.category?.name || null,
    title,
    code: null,
    reward,
    minSpend: parsed.minSpend,
    conditions: ['需在「食尚玩家」App 或官網登入領券，再到店家兌換', area && area !== '連鎖門市' ? `地點：${area}` : '全台連鎖門市', '每位會員每種券限領一次，數量有限'],
    tags,
    startAt: c.start_time ? c.start_time.slice(0, 10) : null,
    endAt: c.end_time ? c.end_time.slice(0, 10) : null,
    url: `https://supertaste.tvbs.com.tw/offers/${c.id}`,
    logo: c.image || null,
  };
}

// ---------- 康是美 最新消息 ----------

export function parseCosmedNews(html) {
  const out = [];
  for (const raw of String(html).split(/<li class="list--\d+"/).slice(1)) {
    const b = raw.slice(0, 2000);
    const date = b.match(/<span>(\d{4}-\d{2}-\d{2})<\/span>/)?.[1];
    const type = text(b.match(/class="tab tab--\d+"[^>]*>([\s\S]*?)<\/div>/)?.[1]);
    const title = text(b.match(/<p>([\s\S]*?)<\/p>/)?.[1]);
    const href = decode(b.match(/<a href="([^"]+)"/)?.[1] || '');
    if (!title || !href) continue;
    out.push({ date, type, title, url: new URL(href, 'https://www.cosmed.com.tw/').href });
  }
  return out;
}

export function cosmedDeal(n) {
  // 只留真正的優惠：要有優惠字詞或活動期間；排除公告、說明、限店販售、專櫃資訊、徵才
  if (/注意事項|上線通知|中獎|公告|徵才|招募|儲備|說明|停用|限店販售|專櫃|服務門市|處方箋|防詐騙/.test(n.title)) return null;
  if (!DEAL_WORDS.test(n.title) && !/^\d{1,2}\/\d{1,2}\s*[-~～]/.test(n.title)) return null;
  // 「9/22 icash Pay 滿額回饋」這種開頭單一日期 = 當天活動
  const single = n.title.match(/^(\d{1,2})\/(\d{1,2})\s+(?![-~～])/);
  const d = feedDeal({
    source: 'cosmed',
    id: n.url.match(/id=(\d+)/)?.[1] || hash(n.url),
    title: n.title,
    url: n.url,
    publishedAt: n.date ? `${n.date}T09:00:00+08:00` : null,
    merchant: '康是美',
    ttlDays: 30,
    tags: n.type ? [n.type] : [],
  });
  if (single && !d.startAt && d.tags.includes('期限見原文') && n.date) {
    const day = `${n.date.slice(0, 4)}-${single[1].padStart(2, '0')}-${single[2].padStart(2, '0')}`;
    return { ...d, startAt: day, endAt: day, tags: d.tags.filter((t) => t !== '期限見原文'), category: '藥妝美妝' };
  }
  return { ...d, category: '藥妝美妝' };
}

// ---------- 7-ELEVEN 首頁活動 ----------

/** 首頁連結形如 javascript:gaLogOpenWin('區塊','標題','網址',...)，內文常含「活動期間:115/9/30~10/27」 */
export function parseSevenHome(html) {
  const out = [];
  const seen = new Set();
  for (const m of String(html).matchAll(/<a href="javascript:gaLogOpenWin\('([^']*)','([^']*)','\s*([^']*)'[^"]*"[^>]*>([\s\S]*?)<\/a>/g)) {
    const [, block, title, url, inner] = m;
    const body = text(inner);
    const t = clean(decodeURIComponent(title.replace(/%(?![0-9A-F]{2})/gi, '%25')));
    if (!t || seen.has(t) || /詐騙|徵才|招募|會員條款|隱私/.test(t + body)) continue;
    seen.add(t);
    out.push({ block: clean(decodeURIComponent(block.replace(/%(?![0-9A-F]{2})/gi, '%25'))), title: t, body, url: url.startsWith('http') ? url : new URL(url, 'https://www.7-11.com.tw/').href });
  }
  return out;
}

/** 精品集點檔期很多，合併成一張卡，名稱列在條件裡 */
export function sevenCollectDeal(items, today) {
  const names = items.filter((x) => x.block === '精品集點送').map((x) => x.title.replace(/精品集點活動$|集點活動$/, '').trim());
  if (!names.length) return null;
  return {
    id: 'seven:collect',
    kind: 'promo',
    source: 'seven',
    merchant: '7-ELEVEN',
    category: '超商量販',
    title: `精品集點 ${names.length} 檔進行中`,
    reward: { type: 'gift', value: null, text: '集點換購' },
    minSpend: null,
    code: null,
    conditions: [...names.slice(0, 15), names.length > 15 ? `…等 ${names.length} 檔，詳見官網` : ''].filter(Boolean),
    tags: ['集點'],
    startAt: null,
    endAt: null,
    publishedAt: null,
    url: 'https://www.7-11.com.tw/special/collection.aspx',
  };
}

export function sevenDeal(item, today) {
  if (item.block === '精品集點送') return null; // 由 sevenCollectDeal 合併
  const all = `${item.title} ${item.body}`;
  // 只收首頁大看板、精品集點，以及內文寫了活動期間的項目（其餘是選單連結）
  if (!['大看板', '精品集點送'].includes(item.block) && !/活動期間/.test(all)) return null;
  if (/永續|公益|捐贈|找回來|觀光公社|uniopen-ace/i.test(item.title)) return null;
  const desc = clean(item.body.replace(item.title, '').replace(/活動期間[:：]?.*$/, ''));
  const d = feedDeal({
    source: 'seven',
    id: hash(item.title),
    title: desc ? `${item.title}｜${desc}` : item.title,
    url: item.url,
    publishedAt: `${today}T08:00:00+08:00`,
    merchant: '7-ELEVEN',
    text: item.body,
    ttlDays: 14,
  });
  return { ...d, category: '超商量販', publishedAt: null }; // 官網沒有上架時間，不參與「最新」排序
}

// ---------- 漢堡王 線上優惠券（官網點餐頁的「優惠券」分類） ----------

export function parseBurgerKing(html) {
  const out = [];
  for (const sec of String(html).split(/<section>/).slice(1)) {
    const group = text(sec.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]);
    for (const a of sec.matchAll(/<a href="(\/product\/\d+)">([\s\S]*?)<\/a>/g)) {
      const parts = [...a[2].matchAll(/<div class="[^"]*text-center[^"]*">([\s\S]*?)<\/div>/g)].map((x) => text(x[1]));
      const name = parts[0];
      const price = Number(a[2].match(/\$\s*([\d,]+)/)?.[1]?.replace(/,/g, '')) || null;
      if (name) out.push({ group, name, price, url: `https://www.burgerking.com.tw${a[1]}` });
    }
  }
  return out;
}

export function burgerKingDeal(item) {
  return {
    id: `burgerking:${item.url.match(/\d+$/)[0]}`,
    kind: 'coupon',
    source: 'burgerking',
    merchant: '漢堡王',
    category: '餐飲美食',
    title: item.name,
    code: null,
    reward: { type: 'gift', value: null, text: item.price ? `$${item.price}` : '優惠' },
    minSpend: null,
    conditions: ['官網／App 線上點餐專屬價；門市臨櫃請出示優惠券', item.group ? `優惠類型：${item.group}` : ''].filter(Boolean),
    tags: [item.group].filter(Boolean),
    startAt: null,
    endAt: null,
    url: item.url,
  };
}

// ---------- Google 新聞 RSS（依分類關鍵字掃全網優惠新聞） ----------

export function parseRss(xml) {
  const items = [];
  for (const m of String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    const pick = (tag) => decode(b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1] || '').trim();
    items.push({
      title: pick('title'),
      link: pick('link'),
      pubDate: pick('pubDate'),
      source: pick('source'),
      guid: pick('guid'),
    });
  }
  return items;
}

// 台灣以外的優惠（Google 新聞繁中結果常混進香港、中國）
const NOT_TW = /港幣|HK\$|HKD|香港|港九|新界|九龍|尖沙咀|灣仔|荃灣|銅鑼灣|旺角|觀塘|沙田|元朗|強積金|MPF|百佳|惠康|HKTVmall|八達通|澳門|深圳|廣州|上海|北京|大陸|內地|人民幣|新加坡|星國|馬來西亞|國泰假期/;
const HK_MEDIA = /HK01|香港01|星島|明報|東方日報|on\.cc|am730|U Lifestyle|ulifestyle|晴報|TOPick|Yahoo新聞香港|頭條日報|經濟一週|港生活|新假期|MoneyHero/i;
// 不是優惠：財經、政治、分析、問句
const NOT_DEAL = /詐騙|股價|營收|財報|法說|ETF|股東|裁員|判決|檢舉|罰款|業績|考題|選舉|立委|市長|議員|政府|普發|補助|退稅|會不會|會變嗎|怎麼辦|為何|為什麼/;
const STRONG = /\d+(\.\d+)?\s*[%％]|買一送一|買1送1|買\d送\d|第二(杯|件)|第2(杯|件)|半價|\d+(\.\d)?折|折扣碼|優惠碼|折價券|優惠券|現折|折\$?\d|免費|特價|下殺|\$\d|\d+元|1元|一元|免運|送[^出貨達]|週年慶|會員日/;

/** 新聞標題常是「全家咖啡買一送一！10/17起…｜ETtoday」：去掉媒體名與裝飾 */
export function newsDeal(item) {
  let title = item.title.replace(/\s+[-–|｜]\s+[^-–|｜]+$/, '').trim();
  if (item.source) title = title.replace(new RegExp(`\\s*[-–|｜]\\s*${item.source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '');
  title = title.replace(/\s*[|｜]\s*[^|｜]{2,6}\s*[|｜]\s*地方新聞$/, ''); // 「| 記者名 | 地方新聞」
  if (!DEAL_WORDS.test(title) || !STRONG.test(title)) return null;
  if (NOT_DEAL.test(title) || NOT_TW.test(title) || HK_MEDIA.test(item.source || '')) return null;
  if (/[？?]$/.test(title) && !/買一送一|折|免費/.test(title)) return null;
  const pub = item.pubDate ? new Date(item.pubDate).toISOString() : null;
  return feedDeal({
    source: 'news',
    id: hash(item.guid || item.link || title),
    title,
    url: item.link,
    publishedAt: pub,
    tags: item.source ? [item.source] : [],
    conditions: ['新聞報導的優惠情報，活動條件以品牌公告為準'],
  });
}

/** 依網站分類各下一組搜尋字（近 7 天） */
export const NEWS_QUERIES = [
  '優惠 買一送一',
  '折扣碼 OR 優惠碼',
  '藥妝 優惠 OR 屈臣氏 OR 康是美 OR 寶雅',
  '美妝 週年慶 OR 保養品 優惠',
  '運動 品牌 折扣 OR Nike OR adidas OR 迪卡儂 優惠',
  '速食 優惠券 OR 麥當勞 OR 肯德基 OR 漢堡王',
  '咖啡 飲料 買一送一 OR 第二杯半價',
  '餐廳 吃到飽 優惠',
  '超商 優惠 OR 7-11 OR 全家 OR 萊爾富',
  '全聯 OR 家樂福 OR 好市多 優惠',
  'Uber Eats OR foodpanda 優惠',
  '3C 家電 優惠 OR 特價',
  '服飾 折扣 OR UNIQLO OR GU 優惠',
  'IKEA OR 宜得利 OR 居家 優惠',
  '寵物 OR 親子 優惠',
  '旅遊 住宿 優惠 OR 機票 優惠',
  '電影 優惠 OR 影城 OR 串流 優惠',
  '信用卡 回饋 優惠 OR 行動支付 回饋',
  'momo OR 蝦皮 OR PChome 優惠',
];
export const newsUrl = (q) => `https://news.google.com/rss/search?q=${encodeURIComponent(`${q} when:7d`)}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
