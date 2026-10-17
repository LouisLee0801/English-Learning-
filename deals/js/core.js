// 純邏輯：日期狀態、篩選、排序、品牌比對。瀏覽器與 Node 測試共用。

export const SOURCES = {
  line: { name: 'LINE購物', short: 'LINE', unit: 'LINE POINTS' },
  eva: { name: '長榮 Mileage Mall', short: '長榮', unit: '哩程' },
  cathay: { name: '國泰 Milesback', short: '國泰', unit: '里數' },
  manual: { name: '精選優惠', short: '精選', unit: '' },
  ptt: { name: 'PTT 省錢板', short: 'PTT', unit: '' },
  news: { name: '優惠新聞', short: '新聞', unit: '' },
  supertaste: { name: '食尚玩家券', short: '食尚', unit: '' },
  cosmed: { name: '康是美', short: '康是美', unit: '' },
  seven: { name: '7-ELEVEN', short: '7-11', unit: '' },
  burgerking: { name: '漢堡王', short: '漢堡王', unit: '' },
  mine: { name: '我的券夾', short: '我的', unit: '' },
};

export const KINDS = { rebate: '回饋', coupon: '折價券', promo: '活動' };

export const REWARD_TYPES = {
  percent: '回饋 %',
  miles: '哩程',
  miles_fixed: '每筆哩程',
  amount: '折抵金額',
  percent_off: '折扣 %',
  shipping: '免運',
  gift: '贈品',
};

const pad = (n) => String(n).padStart(2, '0');
export const todayStr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);

/** 進行中 active｜即將到期 ending（≤ endingDays 天）｜尚未開始 upcoming｜已過期 expired */
export function status(deal, today, endingDays = 7) {
  if (deal.startAt && deal.startAt > today) return 'upcoming';
  if (deal.endAt && deal.endAt < today) return 'expired';
  if (deal.endAt && diffDays(today, deal.endAt) <= endingDays) return 'ending';
  return 'active';
}

export function daysLeft(deal, today) {
  return deal.endAt ? diffDays(today, deal.endAt) : null;
}

/** 加碼期間內才算加碼 */
export function activeBoost(deal, today) {
  const b = deal.boost;
  if (!b) return null;
  if (b.startAt && b.startAt > today) return null;
  if (b.endAt && b.endAt < today) return null;
  return b;
}

/**
 * 等值回饋率（%）：讓 LINE POINTS 與哩程可以放在一起比。
 * 哩程以「每 NT$100 得幾哩」儲存，乘上使用者設定的每哩價值。
 */
export function effectiveRate(deal, today, mileValue = 0.5) {
  const r = activeBoost(deal, today) || deal.reward;
  if (!r || typeof r.value !== 'number') return 0;
  const type = r.type || deal.reward?.type;
  if (type === 'percent' || type === 'percent_off') return r.value;
  if (type === 'miles') return r.value * mileValue; // 每 NT$100 得 v 哩 = v × 每哩價值 元，即 v × 每哩價值 %
  if (type === 'amount' && deal.minSpend >= 100) return (r.value / deal.minSpend) * 100; // 無門檻的贈點無法換算 %
  return 0;
}

const norm = (s) => String(s ?? '').toLowerCase();

// 中文店名 → 英文品牌（以開頭比對）
const ZH_ALIASES = [
  ['蝦皮', 'shopee'], ['酷澎', 'coupang'], ['淘寶', 'taobao'], ['天貓', 'tmall'], ['樂天市場', 'rakutenichiba'], ['樂天旅遊', 'rakutentravel'],
  ['雅虎', 'yahoo'], ['家樂福', 'carrefour'], ['屈臣氏', 'watsons'], ['康是美', 'cosmed'], ['博客來', 'books'], ['蘭蔻', 'lancome'],
  ['雅詩蘭黛', 'esteelauder'], ['海洋拉娜', 'lamer'], ['契爾氏', 'kiehls'], ['倩碧', 'clinique'], ['資生堂', 'shiseido'], ['迪奧', 'dior'],
  ['戴森', 'dyson'], ['三星', 'samsung'], ['華碩', 'asus'], ['宏碁', 'acer'], ['羅技', 'logitech'], ['飛利浦', 'philips'], ['國際牌', 'panasonic'],
  ['萬豪', 'marriott'], ['洲際', 'ihg'], ['希爾頓', 'hilton'], ['雅高', 'accor'], ['凱悅', 'hyatt'], ['迪士尼', 'disney'], ['卡巴斯基', 'kaspersky'],
  ['優衣庫', 'uniqlo'], ['耐吉', 'nike'], ['愛迪達', 'adidas'], ['客路', 'klook'], ['攜程', 'trip'],
];
// 英文全名 → 簡稱（完全相同才換，避免 Apple Music 被併進 Apple）
const EN_ALIASES = {
  applestoreonline: 'apple', applestore: 'apple', maccosmetics: 'mac', jomalonelondon: 'jomalone', yahooshopping: 'yahoo',
  allaccorlivelimitless: 'accor', allaccor: 'accor', ihghotelsresorts: 'ihg', rakutenichiba: 'rakutenichiba', esteelaudercompanies: 'esteelauder',
};
const GENERIC_ZH = /官方購物網站|官方購物網|官方網路商店|官方網站|官方商城|官方旗艦店|旗艦館|旗艦店|購物網站|購物網|購物中心|網路商店|線上商店|線上商城|官網|官方|直營|商城|台灣|臺灣|-?\s*line旅遊/g;

/** 品牌名稱正規化：去掉地區、「官方網站」「旗艦店」、括號註記、空白與標點，再套中英對照 */
export function brandKey(name) {
  let k = norm(name)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFKC')
    .replace(/[（(【\[].*?[)）】\]]/g, '')
    .replace(GENERIC_ZH, '')
    .replace(/\s+(taiwan|asia|global|us|usa|uk|hk|international|japan|apac)\b/g, '')
    .replace(/\b(official|online|store|shop)\b/g, '')
    .replace(/\.com(\.tw)?\b|\.tw\b/g, '')
    .replace(/[\s\-_.,:;'"!?&+/|·・｜’]/g, '');
  // 中英混排（「lancome蘭蔻」「屈臣氏watsons」）取英文部分
  const en = k.match(/^[a-z0-9]{3,}(?=[^a-z0-9])/)?.[0] || k.match(/(?<=[^a-z0-9])[a-z0-9]{3,}$/)?.[0];
  if (en && /[^\x00-\x7f]/.test(k)) k = en;
  if (EN_ALIASES[k]) return EN_ALIASES[k];
  for (const [p, c] of ZH_ALIASES) if (k.startsWith(p)) return c;
  return k;
}

export const defaultFilters = (sort = 'rate') => ({
  q: '',
  sources: [], // 空 = 全部
  kinds: [],
  rewardTypes: [],
  category: '',
  status: 'live', // live = 進行中＋即將到期｜ending｜upcoming｜all
  boostOnly: false,
  codeOnly: false,
  noNewbie: false,
  maxMinSpend: null,
  sort,
});

export function matches(deal, f, today) {
  if (f.sources.length && !f.sources.includes(deal.source)) return false;
  if (f.kinds.length && !f.kinds.includes(deal.kind)) return false;
  if (f.rewardTypes.length && !f.rewardTypes.includes(deal.reward?.type)) return false;
  if (f.category && deal.category !== f.category) return false;
  const st = status(deal, today);
  if (f.status === 'live' && !(st === 'active' || st === 'ending')) return false;
  if (f.status === 'ending' && st !== 'ending') return false;
  if (f.status === 'upcoming' && st !== 'upcoming') return false;
  if (f.boostOnly && !activeBoost(deal, today)) return false;
  if (f.codeOnly && !deal.code) return false;
  if (f.noNewbie && (deal.tags || []).some((t) => /新客|新會員|首購/.test(t))) return false;
  if (f.maxMinSpend != null && (deal.minSpend || 0) > f.maxMinSpend) return false;
  if (f.q) {
    const hay = norm([deal.merchant, deal.title, deal.category, deal.code, ...(deal.conditions || []), ...(deal.tags || [])].join(' '));
    const keyHay = brandKey(deal.merchant);
    const terms = norm(f.q).split(/\s+/).filter(Boolean);
    if (!terms.every((t) => hay.includes(t) || keyHay.includes(brandKey(t)))) return false;
  }
  return true;
}

export function sortDeals(list, sort, today, mileValue) {
  const by = {
    // 回饋與折扣不可直接比：回饋類在前，各組內依等值 % 排
    rate: (a, b) => (a.kind !== 'rebate') - (b.kind !== 'rebate') || effectiveRate(b, today, mileValue) - effectiveRate(a, today, mileValue),
    ending: (a, b) => (a.endAt || '9999').localeCompare(b.endAt || '9999'),
    brand: (a, b) => a.merchant.localeCompare(b.merchant, 'zh-Hant'),
    updated: (a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''),
    // 最新上架：論壇／情報站用發文時間，其他用資料更新時間
    new: (a, b) => (b.publishedAt || b.updatedAt || '').localeCompare(a.publishedAt || a.updatedAt || ''),
  }[sort] || (() => 0);
  return [...list].sort((a, b) => by(a, b) || a.merchant.localeCompare(b.merchant, 'zh-Hant'));
}

export function filterDeals(deals, f, today, mileValue = 0.5) {
  return sortDeals(
    deals.filter((d) => matches(d, f, today)),
    f.sort,
    today,
    mileValue,
  );
}

/** 跨平台品牌比較：同一品牌在各平台的最佳回饋 */
export function compareByBrand(deals, today, mileValue = 0.5) {
  const groups = new Map();
  for (const d of deals) {
    if (d.kind !== 'rebate' || !['line', 'eva', 'cathay'].includes(d.source)) continue;
    const st = status(d, today);
    if (st === 'expired' || st === 'upcoming') continue;
    const key = brandKey(d.merchant);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { key, name: d.merchant, category: d.category, by: {} });
    const g = groups.get(key);
    const prev = g.by[d.source];
    if (!prev || effectiveRate(d, today, mileValue) > effectiveRate(prev, today, mileValue)) g.by[d.source] = d;
    if (d.source === 'line') g.name = d.merchant; // 以中文名稱為主
  }
  return [...groups.values()].map((g) => {
    const rates = Object.entries(g.by).map(([s, d]) => [s, effectiveRate(d, today, mileValue)]);
    const best = rates.sort((a, b) => b[1] - a[1])[0];
    return { ...g, count: rates.length, best: best?.[0], bestRate: best?.[1] || 0 };
  });
}

export function categories(deals) {
  const c = new Map();
  for (const d of deals) if (d.category) c.set(d.category, (c.get(d.category) || 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
}

/** 篩選條件 ↔ URL hash 查詢字串，方便分享與保留 */
export function filtersToQuery(f, sort = 'rate') {
  const d = defaultFilters(sort);
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (JSON.stringify(v) === JSON.stringify(d[k])) continue;
    p.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  return p.toString();
}

export function queryToFilters(qs, sort = 'rate') {
  const f = defaultFilters(sort);
  const p = new URLSearchParams(qs);
  for (const [k, v] of p) {
    if (!(k in f)) continue;
    if (Array.isArray(f[k])) f[k] = v ? v.split(',') : [];
    else if (typeof f[k] === 'boolean') f[k] = v === 'true';
    else if (k === 'maxMinSpend') f[k] = v === '' || v === 'null' ? null : Number(v);
    else f[k] = v;
  }
  return f;
}
