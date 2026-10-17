// 團購貼文解析（純函式）：開團／結單時間、價格、商品名、是否為開團文。
// 爬蟲與網站「我的團購 → 貼上貼文」共用，只用標準 JS，瀏覽器與 Node 都能跑。
// 時間一律是台灣時間字串：'YYYY-MM-DD' 或 'YYYY-MM-DD HH:mm'。

import { classify, brandOf, findTerms } from './categories.js';

const pad = (n) => String(n).padStart(2, '0');
const TPE = 8 * 3600 * 1000;

/** Date / ISO 字串 / 毫秒 → 台灣時間 'YYYY-MM-DD HH:mm' */
export function taipeiStamp(t = new Date()) {
  const d = new Date(new Date(t).getTime() + TPE);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

const ymdOf = (stamp) => String(stamp).slice(0, 10);
const utcOf = (ymd) => Date.UTC(+ymd.slice(0, 4), +ymd.slice(5, 7) - 1, +ymd.slice(8, 10));
export function addDays(ymd, n) {
  const d = new Date(utcOf(ymd) + n * 86400000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
const diffDays = (a, b) => Math.round((utcOf(b) - utcOf(a)) / 86400000);
const isoWeekday = (ymd) => new Date(utcOf(ymd)).getUTCDay() || 7; // 週一 = 1 … 週日 = 7
const validDay = (y, m, d) => m >= 1 && m <= 12 && d >= 1 && d <= new Date(Date.UTC(y, m, 0)).getUTCDate();

/** 沒寫年份的日期：以參考日推年份（早於參考日 60 天以上算明年，晚 300 天以上算去年） */
function withYear(m, d, refYmd) {
  const ry = +refYmd.slice(0, 4);
  let y = ry;
  const cand = (yy) => `${yy}-${pad(m)}-${pad(d)}`;
  const diff = diffDays(refYmd, cand(ry));
  if (diff < -60) y = ry + 1;
  else if (diff > 300) y = ry - 1;
  return validDay(y, m, d) ? cand(y) : null;
}

const CN_NUM = { 一: 1, 二: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
const num = (s) => (/^\d+$/.test(s) ? Number(s) : s === '十' ? 10 : s.length === 2 && s[0] === '十' ? 10 + CN_NUM[s[1]] : CN_NUM[s] ?? NaN);
const WEEK = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };

/** 時刻：「20:00」「晚上8點」「8點半」「中午12點」→ 'HH:mm'；晚上 12 點視為當天 23:59 */
function toTime(period, h, m, half) {
  let hh = Number(h);
  let mm = half ? 30 : Number(m || 0);
  if (hh > 24 || mm > 59) return null;
  const p = (period || '').toLowerCase();
  if (/下午|晚上|晚間|傍晚|夜間|pm/.test(p) && hh < 12) hh += 12;
  if (/中午/.test(p) && hh < 5) hh += 12;
  if ((/晚上|晚間|半夜|夜間/.test(p) && hh === 12) || hh === 24) return '23:59';
  return `${pad(hh)}:${pad(mm)}`;
}

const TIME = String.raw`(?:\s*(上午|早上|中午|下午|晚上|晚間|傍晚|凌晨|半夜|夜間|AM|PM|am|pm)?\s*(\d{1,2})(?:\s*[:：]\s*(\d{2})|\s*點\s*(?:(\d{1,2})\s*分|(半))?))`;
const WD = String.raw`(?:\s*[(（]\s*(?:週|周|星期)?[一二三四五六日天]\s*[)）])?`;
// 有年份（2026/10/20、2026-10-20、115/10/20、2026年10月20日）或沒年份（10/20、10.20、10月20日）
const DATE_RE = new RegExp(
  String.raw`(?:(\d{4}|1\d{2})\s*([/.\-年])\s*(\d{1,2})\s*[/.\-月]\s*(\d{1,2})\s*日?|(\d{1,2})\s*([/.月])\s*(\d{1,2})\s*日?)${WD}(?:${TIME})?`,
  'g',
);
const TIME_ONLY = new RegExp(String.raw`^\s*(?:[~～〜\-–—－至到]|起至|起到)\s*${TIME}`);
const REL_RE = new RegExp(String.raw`(今天|今日|今晚|今夜|明天|明日|明晚|後天)${TIME}?|(本|這|下個?)?(?:週|周|星期|禮拜)([一二三四五六日天])${TIME}?`, 'g');
// 日期後面接這些單位就是規格、價格，不是日期
const UNIT_AFTER = /^\s*(?:[%％折倍吋寸件入包盒組罐片顆個條瓶支袋份]|公[斤克升分]|毫|元|塊|歲|號|碼|(?:[kK][gG]?|[gG]|[mM][lLmM]|[lL]|[cC][mMcC])(?![a-zA-Z]))/;

/** 掃出所有日期（含星期、時刻），回傳 [{ start, end, ymd, time, dot }] */
export function scanDates(text, refYmd) {
  const t = String(text ?? '');
  const out = [];
  for (const m of t.matchAll(DATE_RE)) {
    const hasYear = m[1] != null;
    let y = hasYear ? Number(m[1]) : null;
    if (y && y < 1911) y += 1911; // 民國年
    const mo = Number(hasYear ? m[3] : m[5]);
    const d = Number(hasYear ? m[4] : m[7]);
    const sep = hasYear ? m[2] : m[6];
    const start = m.index;
    let end = m.index + m[0].length;
    // 前後緊接數字（電話、金額）就不是日期
    if (/[\d$＄]/.test(t[start - 1] || '') || /^\d/.test(t.slice(end))) continue;
    if (!hasYear && UNIT_AFTER.test(t.slice(end))) continue;
    const ymd = hasYear ? (validDay(y, mo, d) ? `${y}-${pad(mo)}-${pad(d)}` : null) : withYear(mo, d, refYmd);
    if (!ymd) continue;
    const time = m[9] != null ? toTime(m[8], m[9], m[10] || m[11], m[12]) : null;
    const tok = { start, end, ymd, time, dot: !hasYear && sep === '.' };
    // 「10/13~19」：同月份的期間
    const sameMonth = !time && t.slice(end).match(/^\s*[~～〜\-–—至到]\s*(\d{1,2})\s*(?:日|號)?(?![\d/.月:：])/);
    if (sameMonth && Number(sameMonth[1]) > d && validDay(+ymd.slice(0, 4), mo, Number(sameMonth[1]))) {
      tok.endYmd = `${ymd.slice(0, 8)}${pad(sameMonth[1])}`;
      end += sameMonth[0].length;
      tok.end = end;
    }
    // 「10/20 10:00~22:00」：同一天的時段
    const tail = time && t.slice(end).match(TIME_ONLY);
    if (tail) {
      tok.endTime = toTime(tail[1], tail[2], tail[3] || tail[4], tail[5]);
      end += tail[0].length;
      tok.end = end;
    }
    out.push(tok);
  }
  // 相對日期：今晚 8 點、明天、週日、下週三
  const ref = ymdOf(refYmd);
  for (const m of t.matchAll(REL_RE)) {
    if (out.some((o) => m.index >= o.start && m.index < o.end)) continue;
    let ymd;
    if (m[1]) ymd = addDays(ref, /明/.test(m[1]) ? 1 : /後/.test(m[1]) ? 2 : 0);
    else {
      const target = WEEK[m[8]];
      const iso = isoWeekday(ref);
      if (/下/.test(m[7] || '')) ymd = addDays(ref, 8 - iso + target - 1);
      else {
        ymd = addDays(ref, target - iso);
        if (ymd < ref) ymd = addDays(ymd, 7);
      }
    }
    const [p, h, mm, mm2, half] = m[1] ? [m[2] || (/晚|夜/.test(m[1]) ? '晚上' : ''), m[3], m[4], m[5], m[6]] : [m[9], m[10], m[11], m[12], m[13]];
    const time = h != null ? toTime(p, h, mm || mm2, half) : null;
    out.push({ start: m.index, end: m.index + m[0].length, ymd, time, rel: true });
  }
  return out.sort((a, b) => a.start - b.start);
}

const OPEN_W = '開團|開賣|開搶|開放|開始|上架|開單|開跑|首賣|啟動|起跑|開放下單|開放訂購|預購開始';
const CLOSE_W = '結單|收單|截單|結團|截止|結束|收團|關團|下架|收單日|結單日|最後下單';
const AFTER_OPEN = new RegExp(String.raw`^\s*(?:[(（][^)）]{0,4}[)）])?\s*(?:準時|正式|晚上|中午|早上)?\s*(?:${OPEN_W})`);
const AFTER_CLOSE = new RegExp(String.raw`^\s*(?:[(（][^)）]{0,4}[)）])?\s*(?:準時|晚上|中午|早上)?\s*(?:${CLOSE_W}|止|為止|前(?:下單|結單|收單)?)`);
const BEFORE_OPEN = new RegExp(String.raw`(?:${OPEN_W}|即日起|從)(?:時間|日期|日)?\s*[:：]?\s*$`);
const BEFORE_CLOSE = new RegExp(String.raw`(?:${CLOSE_W}|最後|期限|截至|到|至)(?:時間|日期|日)?\s*[:：]?\s*$`);
const BEFORE_RANGE = /(?:團購|開團|活動|販售|銷售|預購|優惠|下單|訂購)?(?:時間|期間|日期|檔期)\s*[:：]?\s*$/;
// 出貨、到貨等日期不是開團期間
const SHIP = /出貨|到貨|寄出|發貨|取貨|配送|寄送|預計|製作|到台|抵台|面交|領貨|生日|演唱會|活動日/;
const RANGE_SEP = /^\s*(?:[~～〜\-–—－至到]|起至|起到|起\s*[~～〜\-]|開始到|到)\s*$/;

const stampOf = (tok, which) => (tok.time && which !== 'endTime' ? `${tok.ymd} ${tok.time}` : which === 'endTime' && tok.endTime ? `${tok.ymd} ${tok.endTime}` : tok.ymd);
// 日期前面同一個子句的文字（遇到換行、逗號、句號為止）
const clauseBefore = (t, i) => {
  const head = t.slice(Math.max(0, i - 20), i);
  const cut = Math.max(...['\n', '，', ',', '。', '；', ';', '！', '!', '、'].map((c) => head.lastIndexOf(c)));
  return head.slice(cut + 1);
};

/**
 * 開團期間：「開團時間：10/20(一) 20:00 ~ 10/26(日) 23:59」「即日起至10/31」「10/23收單」「今晚8點開團」「限時3天」。
 * ref 為發文時間（台灣 'YYYY-MM-DD HH:mm' 或 'YYYY-MM-DD'），用來推年份與相對日期。
 * 回傳 { openAt, closeAt, timeText }，找不到的欄位為 null。
 */
export function parseWindow(text, ref) {
  const t = String(text ?? '').replace(/\r/g, '');
  const refYmd = ymdOf(ref);
  const toks = scanDates(t, refYmd).filter((k) => {
    const before = clauseBefore(t, k.start);
    const after = t.slice(k.end, k.end + 8);
    if (SHIP.test(before) || SHIP.test(after.slice(0, 5))) return false;
    // 太久以前的日期多半是舊資訊
    return diffDays(refYmd, k.ymd) >= -45;
  });
  const label = (k) => {
    const before = clauseBefore(t, k.start).slice(-12);
    const after = t.slice(k.end, k.end + 10);
    if (AFTER_CLOSE.test(after)) return 'close';
    if (AFTER_OPEN.test(after)) return 'open';
    if (BEFORE_CLOSE.test(before)) return 'close';
    if (BEFORE_OPEN.test(before)) return 'open';
    if (BEFORE_RANGE.test(before)) return 'range';
    return null;
  };
  // 沒有年份、以「.」分隔的日期（10.20）容易和規格、價格混淆：要成對出現或有開團／結單字樣才採用
  const usable = toks.filter((k, i) => {
    if (!k.dot) return true;
    const nb = toks[i + 1] || toks[i - 1];
    return label(k) || (nb && nb.dot && RANGE_SEP.test(t.slice(Math.min(k.end, nb.end), Math.max(k.start, nb.start))));
  });

  let open = null;
  let close = null;
  let span = null;
  // 1. 期間（A ~ B）
  for (let i = 0; i + 1 < usable.length; i++) {
    const a = usable[i];
    const b = usable[i + 1];
    if (!RANGE_SEP.test(t.slice(a.end, b.start))) continue;
    let bYmd = b.ymd;
    if (bYmd < a.ymd && +a.ymd.slice(5, 7) >= 11 && +b.ymd.slice(5, 7) <= 2) bYmd = `${+b.ymd.slice(0, 4) + 1}${b.ymd.slice(4)}`; // 跨年 12/28~1/3
    if (bYmd < a.ymd) continue;
    open = stampOf(a);
    close = b.time ? `${bYmd} ${b.time}` : bYmd;
    span = [a.start, b.end];
    break;
  }
  // 2. 同一天時段（10/20 10:00~22:00）、同月份期間（10/13~19）
  if (!open) {
    const k = usable.find((x) => x.endTime || x.endYmd);
    if (k) {
      open = stampOf(k);
      close = k.endYmd || stampOf(k, 'endTime');
      span = [k.start, k.end];
    }
  }
  // 3. 個別標示的開團日、結單日
  if (!open && !close) {
    const o = usable.find((k) => ['open', 'range'].includes(label(k)));
    const c = usable.find((k) => label(k) === 'close' && (!o || k.ymd >= o.ymd));
    if (o) open = stampOf(o);
    if (c) close = stampOf(c);
    const used = [o, c].filter(Boolean);
    if (used.length) span = [Math.min(...used.map((k) => k.start)), Math.max(...used.map((k) => k.end))];
    // 沒標示的單一日期：文中有結單字樣當結單日，否則未來日期當開團日
    if (!used.length && usable.length === 1) {
      const k = usable[0];
      if (new RegExp(CLOSE_W).test(t)) close = stampOf(k);
      else if (k.ymd >= refYmd && !k.rel) open = stampOf(k);
      if (open || close) span = [k.start, k.end];
    }
  }
  // 4. 限時 N 天／倒數 N 天／N 小時
  if (!close) {
    const m = t.match(/(?:限時|只開|只有|倒數|僅限|開團)\s*(\d{1,2}|[一二兩三四五六七八九十]{1,2})\s*(天|日|小時|hr|h|H)/);
    if (m) {
      const n = num(m[1]);
      const base = open || ref;
      if (n > 0 && /天|日/.test(m[2])) close = addDays(ymdOf(base), n - 1);
      else if (n > 0) close = taipeiStamp(Date.parse(`${String(base).length > 10 ? base.replace(' ', 'T') : `${base}T00:00`}:00+08:00`) + n * 3600000);
      span = span || [m.index, m.index + m[0].length];
    } else if (/今晚結單|今天結單|今日結單|最後一天|今晚收單|今天收單/.test(t)) close = refYmd;
  }
  if (open && close && close < open) close = null;
  const timeText = span ? t.slice(span[0], span[1]).replace(/\s+/g, ' ').trim().slice(0, 60) : null;
  return { openAt: open, closeAt: close, timeText };
}

// ---------- 價格 ----------
const AMOUNT = String.raw`(?:NT\s*\$?|\$|＄|台幣\s*)?\s*(\d{1,3}(?:,\d{3})+|\d{2,6})(?:\s*(?:元|塊|起))?`;
const LABELED = [
  ['團購', new RegExp(String.raw`(?:團購|開團|團媽|粉絲|獨家|直播|限時)(?:優惠)?(?:價|價格|只要)\s*[:：]?\s*${AMOUNT}`)],
  ['優惠', new RegExp(String.raw`(?:優惠價|特價|活動價|下殺|超值價|驚喜價|破盤價|會員價|折扣價|最優惠|最低價)\s*[:：]?\s*${AMOUNT}`)],
  ['售價', new RegExp(String.raw`(?:只要|售價|價格|價錢|單價|每組|每盒|每包|每件|每入|一組|一盒|一包|一件|價)\s*[:：]?\s*${AMOUNT}`)],
];
const ORIGINAL = new RegExp(String.raw`(?:原價|市價|定價|專櫃價|官網價|建議售價)\s*[:：]?\s*${AMOUNT}`);
const ANY_AMOUNT = new RegExp(String.raw`(?:(?:NT\s*\$|\$|＄)\s*(\d{1,3}(?:,\d{3})+|\d{2,6})|(\d{1,3}(?:,\d{3})+|\d{2,6})\s*元)(?:\s*起)?`, 'g');
const toNum = (s) => Number(String(s).replace(/,/g, ''));

/** 價格：團購價 > 優惠價 > 只要／售價 > 第一個金額（排除「滿 $1500」「運費 $60」） */
export function parsePrice(text) {
  const t = String(text ?? '');
  const original = toNum(t.match(ORIGINAL)?.[1] || '') || null;
  for (const [, re] of LABELED) {
    const m = t.match(re);
    if (m) {
      const v = toNum(m[1]);
      if (v >= 10 && v !== original) return { price: v, originalPrice: original, priceText: m[0].trim().slice(0, 30) };
    }
  }
  for (const m of t.matchAll(ANY_AMOUNT)) {
    const v = toNum(m[1] || m[2]);
    const before = t.slice(Math.max(0, m.index - 6), m.index);
    const after = t.slice(m.index + m[0].length, m.index + m[0].length + 4);
    if (/滿|運費|運|門檻|超過|回饋|折抵|現折|省|贈|原價|市價|定價|還要|要價|原本|一般|專櫃/.test(before) || /免運|折|回饋|以上/.test(after)) continue;
    if (v < 10 || v === original) continue;
    return { price: v, originalPrice: original, priceText: m[0].trim() };
  }
  // 「只要1XX」這種隱藏價格
  const hidden = t.match(/(?:只要|售價|價格|團購價)\s*[:：]?\s*\$?\s*(\d[\dXx]{1,4}[Xx])/);
  return { price: null, originalPrice: original, priceText: hidden ? hidden[0].trim() : null };
}

// ---------- 是否為開團文 ----------
const POS = [
  [/開團\s*(?:啦|囉|喇|嚕|了|中|！|!|～|~|\p{Extended_Pictographic})|限時開團|正式開團|準時開團|開團時間|開團日期|開團期間|團購開跑|開團價|團購價|開團資訊/u, 4],
  [/開團|揪團|團購|合購|預購|開這團|開此團|跟團/, 2],
  [/收單|結單|截單|結團|收團/, 3],
  [/下單|訂購|購買|表單|賣貨便|一頁|商店|蝦皮|連結|網址|私訊下單|留言\+1|\+1|喊單|進群|小盒子|留言[「『"]|留言.{0,6}(?:傳|私訊|連結|給你)/, 2],
  [/\$\s*\d|NT\s*\$?\s*\d|\d\s*元|價格|售價|只要|特價|優惠價/, 2],
  [/款式|規格|尺寸|顏色|口味|容量|組合|現貨|免運|贈品|加購|限量|數量有限|宅配|超取/, 1],
];
const NEG = [
  /(?:找|徵|尋找|尋求|洽談|歡迎|願意).{0,10}(?:廠商|合作|貨源|商品|品項)|合作廠商|廠商.{0,6}(?:私訊|聯繫|洽談|自薦)|自薦|有沒有人|^請問|請問(?:有|大家|各位|一下)|推薦.{0,6}給我|經營.{0,10}群|我是.{0,8}團(?:購)?主|團購新手|想詢問|怎麼開團|如何開團|開團教學/,
  /洗版|情勒|詐騙|避雷|靠北|抱怨|退款|客訴|糾紛|跑路|延遲出貨|還沒出貨|沒收到|退貨|雷團|爛團|不推/,
  /代購賺|副業|兼職|賺錢|被動收入|加盟|招募團[媽爸]|徵團[媽爸]|分潤|抽成/,
  /新團品|找.{0,4}團品|拓展.{0,6}通路|有沒有.{0,8}(?:商家|廠商|店家)|找團[爸媽]|供應商/,
  /招募|VIP\s*群|加入.{0,6}(?:群組|社群|VIP)|群組招生/,
];
// 香港、澳門、中國的團購（廣東話、港幣、順豐）不收
const NOT_TW = /港幣|HK\$|HKD|香港|澳門|順豐|緊貼|[佢嘅咗冇睇嘢啲唔俾攞噉]|喇$|喇[！!🎉]|人民幣|淘寶代購|大陸/;
// 簡體字（三個以上）多半是中國的貼文
const SIMPLIFIED = /[们这个说对时会为发买卖团购单价钱货经还见长东车马门问听观历亲汇总号丝爱宝儿鲜鸡猪鱼虾礼盒装订]/g;

/** 開團文判斷：正向字詞加分、找廠商／抱怨文扣分。回傳 { score, isGroupBuy } */
export function groupBuyScore(text) {
  const t = String(text ?? '');
  let score = 0;
  for (const [re, pts] of POS) if (re.test(t)) score += pts;
  for (const re of NEG) if (re.test(t)) score -= 4;
  if (NOT_TW.test(t) || (t.match(SIMPLIFIED) || []).length >= 3) score -= 10;
  return { score, isGroupBuy: score >= 4 };
}

// ---------- 商品名 ----------
const TAG_BRACKET = /[【\[「『〔(（《]\s*([^】\]」』〕)）》]{0,24})\s*[】\]」』〕)）》]/g;
const GROUP_WORDS = /開團|團購|合購|預購|限時|現貨|代購|徵|揪|免運|結單|收單|情報|分享|限量|快閃|販售|活動|優惠|期間|時間|售/;
const NOISE = [
  /#[^\s#]+/g,
  /https?:\/\/\S+/g,
  /(?:限時|正式|準時|即將|今晚|明天|本週|下週|重新|終於可以|終於|決定)?(?:開團|揪團|團購|合購|預購|開賣|常態團|首發團)(?:啦|囉|喇|嚕|了|中|囉|開跑|資訊|預告|通知|價|時間|期間)?[！!～~。.]*/g,
  /第\s*[\dNn一二三四五六七八九十]+\s*[團波]/g,
  /(?:收單|結單|截單|結團)(?:時間|日)?\s*[:：]?/g,
  /(?:現貨|免運|限量|最後|加開|首團|回購|快閃|搶購|好物|推薦|分享|必買|爆款|熱銷|新品|上市|到貨)[！!～~]*/g,
  /(?:只要|售價|價格|團購價|特價|優惠價)\s*[:：]?\s*(?:NT\s*\$?|\$|＄)?\s*[\dXx,]+\s*(?:元|起)?/g,
  /\d+\s*[/／]\s*(?:NT\s*\$|\$|＄)?\s*\d+/g,
  /(?:原價|市價|定價|專櫃價|官網價)?\s*(?:NT\s*\$|\$|＄)\s*[\d,]+\s*(?:元|起)?|\d[\d,]*\s*元/g,
  /(?:來了|來囉|來啦|駕到|登場|報到|賣爆|開搶)(?=$|\s|[!！~～⋯…])/g,
  /(?:已|去年)?賣爆\s*[\d一二三四五六七八九十兩百千萬]*\s*[台隻組件個份盒包]?(?:以上)?/g,
  /文末抽獎|留言抽獎|抽獎/g,
];
// 只留中日韓文字、英數與少數商品名常用符號（表情、顏文字、注音一律拿掉）
const KEEP = /[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}A-Za-z0-9\s&+\-/.()（）｜|・·'’%×_ー]/gu;
const LABEL_LINE = /(?:品名|商品名稱|商品|團購商品|團購品項|品項|產品|本次開團|開團商品|這次開團)\s*[:：]\s*([^\n]{2,50})/;
const STRIP_EDGE = /^[\s\-–—－‐−~～:：|｜/、,，.。!！?？>＞》»⋯…&+]+|[\s\-–—－‐−~～:：|｜/、,，.。!！?？<＜《«⋯…&+(（]+$/g;
// 開頭的贅字：「今天社群限時開團一款波點包包」→「波點包包」、「主婦們最愛的BRUNO」→「BRUNO」
const FILLER = /^(?:(?:今天|今晚|明天|社群|這次|本次|這週|本週|一款|一個|這款|這個|大家|我們|我|是|來自|終於|又來|再度|再次|手刀|超美|超好用|必收|老闆|小編|來了|的|新款|超夯|超人氣|最近|爆紅|全網|大品牌好安心|.{0,8}(?:最愛|超紅|最紅|爆紅|人氣|必買|熱賣)的)\s*)+/u;
const PRONOUN = /^(?:我|你|妳|您|他|她|大家|這|那|今天|最近|謝謝|感謝|終於|為了|因為|如果|聽說|於是|知道|想|有沒有|要不要)/;
// 下單方式、規則類的句子不是商品名
const INSTRUCTION = /湊團|成團|告知|下單|私訊|小盒子|匯款|付款|運費|賣貨便|出貨|取貨|注意|規則|不接受|三思|備註|截圖|留言|\+1|進群|喊單|併單|基本資料|詳情|連結|網址|點我|底下|下方|主頁|首頁|訂購|搶購|購買方式/;
const ANNOUNCE = /開團|團購|開賣|預購|合購|上架|首發/;
const width = (s) => [...s].reduce((n, c) => n + (/[\x00-\xff]/.test(c) ? 1 : 2), 0);

function cleanLine(line, refYmd) {
  let s = String(line);
  // （括號）多半是備註：（10/31收單）（老朋友新朋友看過來）
  s = s.replace(/[(（][^()（）]{0,30}[)）]/g, ' ');
  s = s.replace(TAG_BRACKET, (all, inner) => (GROUP_WORDS.test(inner) ? ' ' : ` ${inner} `));
  // 日期期間
  for (const k of scanDates(s, refYmd).reverse()) s = s.slice(0, k.start) + ' ' + s.slice(k.end);
  for (const re of NOISE) s = s.replace(re, ' ');
  s = s.replace(/[(（][^)）]*$/, ' ');
  s = s.replace(KEEP, ' ').replace(/\s+/g, ' ').replace(STRIP_EDGE, '').trim();
  return s.replace(FILLER, '').replace(STRIP_EDGE, '').trim();
}

/** 子句分數：品牌、分類關鍵字、開團字樣加分；代名詞開頭、太長、沒有關鍵字扣分 */
function clauseScore(raw, clean, lineIndex) {
  const hits = findTerms(clean);
  let sc = 0;
  if (hits.some((h) => h.brand)) sc += 3;
  sc += Math.min(hits.filter((h) => !h.brand).length, 2) * 2;
  if (!hits.length) sc -= 2;
  if (ANNOUNCE.test(raw)) sc += 2;
  if (lineIndex === 0) sc += 1;
  if (PRONOUN.test(clean)) sc -= 2;
  // 以商品名常見字結尾（…組、…機、…包）多半是商品名
  if (/[組機器包袋鍋墊椅車衣褲鞋膜霜乳液粉罐瓶杯盒套枕被燈扇架筆卡貼劑棒刷梳夾鏡錶板盤碗壺桶箱櫃凳傘帽襪]$/.test(clean)) sc += 1;
  if (/抽\s*\d*\s*位|送同款|抽獎|文末/.test(raw) && !hits.some((h) => h.brand)) sc -= 3;
  if (clean.length > 20) sc -= Math.ceil((clean.length - 20) / 10);
  return sc;
}

/**
 * 商品名：「品名：」行優先；否則把標題與前幾行切成子句，挑分數最高的一句（品牌、商品關鍵字、開團字樣），
 * 太短時接上同篇下一個有商品關鍵字的子句。也會從「留言「氣炸鍋」」這類關鍵字取候選。
 */
export function extractProduct({ title, text, ref } = {}) {
  const refYmd = ymdOf(ref || taipeiStamp());
  const body = String(text ?? '');
  const m = body.match(LABEL_LINE);
  if (m) {
    const v = cleanLine(m[1], refYmd);
    if (v.length >= 2) return v.slice(0, 40);
  }
  const lines = [title, ...body.split(/\n+/)].map((l) => String(l ?? '').trim()).filter(Boolean).slice(0, 8);
  const cands = [];
  lines.forEach((l, i) => {
    for (let raw of l.split(/[。！!？?，,；;]+|(?<!\d)\s*[~～]+\s*(?!\d)|\s{2,}|\s[/\-–—]\s|\p{Extended_Pictographic}+/u)) {
      if (!raw.trim()) continue;
      // 句子後半是下單方式：「購物包開團 底下任意留言」只取前半
      const cut = raw.search(INSTRUCTION);
      if (cut > 3) raw = raw.slice(0, cut);
      else if (cut >= 0) {
        // 「留言「氣炸鍋」我傳資訊給你」：引號裡常是商品名
        const q = raw.match(/[「『"]([^」』"]{2,12})[」』"]/);
        if (q) cands.push({ text: cleanLine(q[1], refYmd), score: findTerms(q[1]).length ? 1 : -3, order: cands.length });
        continue;
      }
      let c = cleanLine(raw, refYmd);
      // 太長的子句以「｜」再切、「 - 」一律再切，取商品字詞最多的一段
      const pickPart = (parts) => parts.map((x) => x.replace(STRIP_EDGE, '').trim()).filter((x) => width(x) >= 4).sort((x, y) => findTerms(y).length - findTerms(x).length || x.length - y.length)[0];
      if (/\s[-–—－]\s/.test(c)) c = pickPart(c.split(/\s[-–—－]\s/)) || c;
      if (width(c) > 30 && /[｜|]/.test(c)) c = pickPart(c.split(/\s*[｜|]\s*/)) || c;
      if (width(c) < 4) {
        if (c.length >= 2 && ANNOUNCE.test(raw)) cands.push({ text: c, score: clauseScore(raw, c, i), order: cands.length, short: true });
        continue;
      }
      cands.push({ text: c, score: clauseScore(raw, c, i), order: cands.length });
    }
  });
  if (!cands.length) return '';
  const best = [...cands].sort((a, b) => b.score - a.score || a.order - b.order)[0];
  let out = best.text;
  // 「三麗鷗」太短：接上後面有商品關鍵字的子句（萬聖節｜芭蕾小公仔）
  if (width(out) < 8) {
    const cat = classify({ product: out });
    const more = cands.find((c) => c.order > best.order && findTerms(c.text).length && !c.short && width(c.text) <= 24 && !c.text.includes(out) && !out.includes(c.text));
    if (more && (cat === '其他' || classify({ product: more.text }) === cat)) out = `${out} ${more.text}`;
  }
  return out.slice(0, 40).trim();
}

// ---------- 其他欄位 ----------
const ORDER_HOSTS = /1shop\.tw|shopline|cyberbiz|waca\.|meepshop|forms\.gle|docs\.google\.com\/forms|lin\.ee|line\.me|portaly\.cc|pse\.is|reurl\.cc|bit\.ly|tinyurl|myship\.7-11|shopee\.tw|shp\.ee|easystore|mysubline|pinkoi|iopenmall|ecpay|surveycake|typeform|beacons\.ai|linktr\.ee/i;
export function extractOrderUrl(text) {
  const urls = String(text ?? '').match(/https?:\/\/[^\s<>"'，。）)】]+/g) || [];
  return urls.find((u) => ORDER_HOSTS.test(u)) || null;
}

const TAG_WORDS = ['預購', '現貨', '免運', '限量', '贈品', '加開', '首團', '回購', '直播', '超取', '宅配', '面交', '分期'];
export function extractTags(text) {
  const t = String(text ?? '');
  return TAG_WORDS.filter((w) => t.includes(w));
}

export function excerptOf(text, max = 220) {
  return String(text ?? '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/#[^\s#]+/g, '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s*\n\s*/g, ' / ')
    .replace(/\s+/g, ' ')
    .replace(/(?:\s*\/\s*){2,}/g, ' / ')
    .replace(/^\s*\/\s*|\s*\/\s*$/g, '')
    .trim()
    .slice(0, max);
}

/**
 * 預告文（一篇列多檔）：「10/20 Combi 推車」「10/22 ② 童裝」三行以上，或兩行以上且有「預告／行事曆」字樣。
 * 回傳 [{ product, openAt, closeAt, line }]；不是預告文回傳 []
 */
export function splitSchedule(text, ref) {
  const refYmd = ymdOf(ref);
  const lines = String(text ?? '').split(/\n+/);
  const rows = [];
  for (const line of lines) {
    const toks = scanDates(line, refYmd).filter((k) => !k.rel);
    if (!toks.length || toks[0].start > 6) continue;
    const w = parseWindow(line, ref);
    const product = cleanLine(line.slice(toks[0].start), refYmd).replace(/^[①-⑳\d]+[.、)\s]*/, '').trim();
    if (product.length < 2 || SHIP.test(line)) continue;
    rows.push({ product: product.slice(0, 40), openAt: w.openAt || stampOf(toks[0]), closeAt: w.closeAt, line: line.trim().slice(0, 80) });
  }
  const isPlan = /預告|行事曆|開團表|開團日曆|團購表|本週|下週|這週|本月|下個?月|排程|清單/.test(text);
  return rows.length >= 3 || (rows.length >= 2 && isPlan) ? rows : [];
}

/**
 * 整篇解析：開團文判斷、商品、品牌、分類、價格、期間、下單連結、標籤、摘要。
 * ref：發文時間（台灣時間字串），沒有就用現在
 */
export function parsePost({ text, title = '', ref } = {}) {
  const r = ref || taipeiStamp();
  const all = [title, text].filter(Boolean).join('\n');
  const win = parseWindow(all, r);
  // 有寫開團期間或收單日，多半是真的開團文
  let { score } = groupBuyScore(all);
  if (win.openAt || win.closeAt) score += 2;
  const isGroupBuy = score >= 4;
  const product = extractProduct({ title, text, ref: r });
  const price = parsePrice(all);
  return {
    isGroupBuy,
    score,
    product,
    brand: brandOf(`${product} ${title}`) || brandOf(String(text ?? '').slice(0, 200)),
    category: classify({ product, title, text }),
    ...price,
    ...win,
    orderUrl: extractOrderUrl(all),
    tags: extractTags(all),
    excerpt: excerptOf(text || title),
  };
}
