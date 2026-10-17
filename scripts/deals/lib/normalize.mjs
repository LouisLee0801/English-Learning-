// 把各平台的回饋文字轉成統一數值。純函式，方便單元測試。

/** 擷取百分比：「最高 5.5% 回饋」→ 5.5 */
export function parsePercent(text) {
  const m = String(text ?? '').match(/(\d+(?:\.\d+)?)\s*[%％]/);
  return m ? Number(m[1]) : null;
}

const CUR = {
  'NT$': 'TWD', NTD: 'TWD', '台幣': 'TWD', '新台幣': 'TWD', '元': 'TWD',
  'US$': 'USD', 'HK$': 'HKD', 'S$': 'SGD', 'A$': 'AUD', '¥': 'JPY', '円': 'JPY', '£': 'GBP', '€': 'EUR',
};
const CUR_RE = '(NT\\$|NTD|新台幣|台幣|US\\$|HK\\$|S\\$|A\\$|[A-Z]{3}|¥|円|£|€|元)';
const NUM = '(\\d+(?:[.,]\\d+)*)';
const UNIT = '(?:哩程|里數|哩|里|miles?|Asia Miles)';
const num = (s) => Number(String(s).replace(/,/g, ''));

/**
 * 擷取哩程回饋，回傳 { miles, per, currency, upTo, atLeast }：每 per 單位 currency 得 miles 哩。
 * 支援：「每NT$100 得 3 哩」「NT$25 = 1 哩」「USD1 = 2.25」「12 哩程 / TWD100」「Earn 3 miles per US$1」
 */
export function parseMiles(text) {
  const t = String(text ?? '').replace(/\s+/g, ' ');
  const pats = [
    // 哩數在前：12 哩程 / TWD100、3 miles per US$1
    [new RegExp(`${NUM}\\s*${UNIT}\\s*(?:per|/|每|for every|every)\\s*${CUR_RE}\\s?${NUM}`, 'i'), (m) => ({ miles: num(m[1]), currency: m[2], per: num(m[3]) })],
    // 金額在前：USD1 = 2.25、NT$25 = 1 哩、每 NT$100 得 3 哩
    [new RegExp(`${CUR_RE}\\s?${NUM}\\s*(?:=|:|：)\\s*${NUM}`, 'i'), (m) => ({ currency: m[1], per: num(m[2]), miles: num(m[3]) })],
    [new RegExp(`${CUR_RE}\\s?${NUM}\\s*(?:可得|得|賺|earns?|get)\\s*(?:最高|最多|up to)?\\s*${NUM}\\s*${UNIT}`, 'i'), (m) => ({ currency: m[1], per: num(m[2]), miles: num(m[3]) })],
    // 3 miles per $1（無幣別）
    [new RegExp(`${NUM}\\s*${UNIT}\\s*(?:per|/|每)\\s*\\$\\s?${NUM}`, 'i'), (m) => ({ miles: num(m[1]), currency: '$', per: num(m[2]) })],
  ];
  for (const [re, f] of pats) {
    const m = t.match(re);
    if (m) {
      const r = f(m);
      return {
        ...r,
        currency: CUR[r.currency] || r.currency.toUpperCase(),
        upTo: /最多|最高|up to/i.test(t),
        atLeast: /最少|至少|at least|from/i.test(t),
      };
    }
  }
  return null;
}

/** 換算成「每 NT$100 得幾哩」；fx 為 1 單位外幣 = 幾台幣 */
export function milesPer100Twd(parsed, fx = {}) {
  if (!parsed || !parsed.per) return null;
  const rate = parsed.currency === 'TWD' ? 1 : fx[parsed.currency];
  if (!rate) return null;
  return Math.round(((parsed.miles / parsed.per / rate) * 100) * 100) / 100;
}

/** 各式日期 → YYYY-MM-DD；認不得回傳 null */
export function toYmd(s, refYear = new Date().getFullYear()) {
  if (!s) return null;
  if (typeof s === 'number') s = new Date(s > 1e12 ? s : s * 1000).toISOString();
  const t = String(s).trim();
  let m = t.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  // 日/月/年（國泰 Milesback 的格式，例：31/10/2026）
  m = t.match(/(\d{1,2})[/.](\d{1,2})[/.](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = t.match(/(?:^|\D)(\d{1,2})[/.月](\d{1,2})日?(?:\D|$)/);
  if (m) return `${refYear}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}`;
  const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  m = t.match(/(\d{1,2})\s+([a-z]{3})[a-z]*\.?,?\s+(\d{4})/i) || t.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i);
  if (m) {
    const [d, mon, y] = /^\d/.test(m[1]) ? [m[1], m[2], m[3]] : [m[2], m[1], m[3]];
    const mm = months[mon.toLowerCase()];
    if (mm) return `${y}-${String(mm).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return null;
}

export const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** 必要欄位檢查；回傳錯誤訊息陣列 */
export function validateDeal(d) {
  const errs = [];
  if (!d.id) errs.push('missing id');
  if (!d.source) errs.push('missing source');
  if (!d.merchant) errs.push('missing merchant');
  if (!['rebate', 'coupon', 'promo'].includes(d.kind)) errs.push(`bad kind ${d.kind}`);
  if (!d.reward || !d.reward.type) errs.push('missing reward');
  for (const k of ['startAt', 'endAt']) if (d[k] && !/^\d{4}-\d{2}-\d{2}$/.test(d[k])) errs.push(`bad ${k} ${d[k]}`);
  return errs;
}

/**
 * 從優惠文字猜折扣形式：「92折」「85折」「6折起」「現折 $100」「滿 NT$3,500」「免運」。
 * 認不出來就當贈品／活動，保留原文。
 */
export function parseDiscount(text) {
  const t = clean(text);
  const minSpend = Number(t.match(/滿\s*(?:NT)?\$?\s*([\d,]{3,})/i)?.[1]?.replace(/,/g, '')) || null;
  let m = t.match(/(\d{1,2}(?:\.\d)?)\s*折/);
  if (m && !/折(?:抵|價|扣)/.test(t.slice(m.index, m.index + 4))) {
    const v = Number(m[1]);
    const off = v >= 10 ? 100 - v : Math.round((10 - v) * 10);
    if (off > 0 && off < 100) return { reward: { type: 'percent_off', value: off, text: `${m[1]}折${t[m.index + m[0].length] === '起' ? '起' : ''}` }, minSpend };
  }
  m = t.match(/(\d{1,2})\s*%\s*off/i);
  if (m) return { reward: { type: 'percent_off', value: Number(m[1]), text: `${m[1]}% off` }, minSpend };
  m = t.match(/(?:現折|折抵|折價|立折|折)\s*(?:NT)?\$?\s*([\d,]{2,})\s*元?/i);
  if (m) return { reward: { type: 'amount', value: Number(m[1].replace(/,/g, '')), text: `折 $${m[1]}` }, minSpend };
  if (/免運/.test(t)) return { reward: { type: 'shipping', value: null, text: '免運' }, minSpend };
  return { reward: { type: 'gift', value: null, text: '優惠' }, minSpend };
}

/** 每筆固定哩數（訂閱、訂房等）：「最多 42 哩程」「100.75 里數」 */
export function parseFixedMiles(text) {
  const m = String(text ?? '').match(/(\d+(?:[.,]\d+)*)\s*(?:哩程|里數|哩|里|miles?)(?!\s*(?:\/|per|每))/i);
  return m ? { miles: Number(m[1].replace(/,/g, '')), upTo: /最多|最高|up to/i.test(text) } : null;
}
