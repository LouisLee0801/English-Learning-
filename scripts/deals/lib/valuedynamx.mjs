// 長榮 Mileage Mall 與國泰 Milesback 都是 Valuedynamx 平台，版型相近，共用解析。
import { clean, toYmd } from './normalize.mjs';

/** 平台分類 → 統一分類（台灣用語） */
export const CATEGORY = {
  'department-stores': '綜合電商',
  'clothes-and-fashion': '時尚服飾',
  'health-and-beauty': '美妝保健',
  electricals: '3C家電',
  'home-and-garden': '居家生活',
  'staying-at-home': '居家生活',
  'children-and-family': '親子',
  'toys-and-games': '親子',
  'food-and-drink': '食品餐飲',
  'sport-and-fitness': '運動休閒',
  'entertainment-and-leisure': '運動休閒',
  travel: '旅遊',
  luxury: '精品',
  'office-and-business': '生活服務',
  'gifts-and-flowers': '生活服務',
  'utilities-and-telecoms': '生活服務',
};

const decodeOnce = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
/** 解 HTML 實體；平台的 title 屬性有時被編碼兩次，所以解到不再變化為止 */
const decode = (s) => {
  let t = String(s ?? '');
  for (let i = 0; i < 3; i++) {
    const n = decodeOnce(t);
    if (n === t) break;
    t = n;
  }
  return t;
};
export const text = (html) => clean(decode(String(html ?? '').replace(/<[^>]+>/g, ' ')));

/** 取出某個 class 元素的文字：從該 class 起算到下一個同系列 class 為止（內含巢狀 span） */
function section(block, cls) {
  const i = block.search(new RegExp(`class="${cls}[\\s"]`));
  if (i < 0) return null;
  const start = block.indexOf('>', i) + 1;
  const rest = block.slice(start);
  const j = rest.search(/class="merch(?:ant)?-(?:rates-was|icons|title|banner|summary|full|item)|class="(?:label-space|spec-until|merchant-offer-expdate)|<\/a>/);
  return j < 0 ? rest : rest.slice(0, j).replace(/<[^>]*$/, '');
}
const ariaOf = (block, cls) => {
  const m = block.match(new RegExp(`class="${cls}(?:\\s[^"]*)?"[^>]*aria-label="([^"]+)"`, 'i'));
  return m ? clean(decode(m[1])) : null;
};

/**
 * 解析商戶清單頁（所有商戶 / 分類 / 額外賞哩），回傳商戶陣列。
 * baseUrl 例：https://mall.brmile.com/zh/
 */
export function parseMerchantList(html, baseUrl) {
  const blocks = String(html).split(/<div class="merch(?:ant)?-item[\s"]/).slice(1);
  const out = [];
  for (const raw of blocks) {
    const b = raw.slice(0, 6000);
    const id = b.match(/rel="(\d+)"/)?.[1];
    const href = decode(b.match(/<a href="([^"]+)"[^>]*class="(?:link-to-merchant|merchant-link)/)?.[1] || '');
    if (!id || !href) continue;
    const url = new URL(href, baseUrl);
    url.search = '';
    const slugCat = url.pathname.split('/').filter(Boolean).at(-2);
    const name = text(b.match(/class="merch-title"[^>]*>\s*(?:<span>)?([^<]+)/)?.[1] ?? b.match(/class="merchant-link[^>]*>([^<]+)</)?.[1]);
    const rate = ariaOf(b, 'merchant-rates') || text(section(b, 'merch-rates')) || text(section(b, 'merchant-rates'));
    const was = (ariaOf(b, 'merchant-rates-was') || text(section(b, 'merch-rates-was')) || text(section(b, 'merchant-rates-was')) || '').replace(/^(非促銷期間|非推廣期|Was)\s*/, '');
    out.push({
      id,
      name,
      url: url.href,
      category: CATEGORY[slugCat] || null,
      categorySlug: slugCat,
      rateText: rate || '',
      wasText: was || '',
      featured: /merchant-with-offer|ico-offer/.test(b),
      hasVoucher: /merchant-with-voucher|ico-voucher/.test(b),
      logo: b.match(/<img src="(https:\/\/[^"]+)"/)?.[1] || null,
    });
  }
  return out;
}

/** 清單頁的總數與下一頁連結 */
export function parsePager(html, baseUrl) {
  const total = Number(String(html).match(/(?:共|of)\s*<span class="total">(\d+)<\/span>/)?.[1] || String(html).match(/(\d+)\s*商家\s*顯示/)?.[1] || String(html).match(/全部的\s*(\d+)\s*商家/)?.[1] || 0);
  const next = String(html).match(/data-href="([^"]*page=\d+[^"]*)"[^>]*class="[^"]*loadmore/)?.[1];
  return { total, next: next ? new URL(decode(next), baseUrl).href : null };
}

/** 「2026年4月1日至4月30日…」這類已過期的期間說明，對使用者沒有意義，略過 */
function isStalePeriod(line, today) {
  const m = line.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*(?:至|到|-|–)\s*(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日/);
  if (!m) return false;
  const end = `${m[4] || m[1]}-${m[5].padStart(2, '0')}-${m[6].padStart(2, '0')}`;
  return end < today;
}

const GENERIC = /^\*+$|使用非本網站提供的優惠代碼|不接受任何漏單查詢|請勿直接聯絡/;

/** 商戶詳情頁：加碼有效期、購買細則、入帳天數、分品類回饋 */
export function parseDetail(html, today) {
  const h = String(html);
  const until = h.match(/有效期至\s*([\d/.-]+)/)?.[1];
  const pc = h.match(/<div class="merchant-pc-cnt">([\s\S]*?)<\/div>/)?.[1] || '';
  const conditions = [];
  for (const line of pc.split(/<br\s*\/?>/i).map(text)) {
    if (!line || GENERIC.test(line) || isStalePeriod(line, today) || conditions.includes(line)) continue;
    conditions.push(line);
  }
  // 中英並列時只留中文
  const cjk = (l) => /[\u4e00-\u9fff]/.test(l);
  if (conditions.some(cjk)) for (let i = conditions.length - 1; i >= 0; i--) if (!cjk(conditions[i])) conditions.splice(i, 1);
  const creditDays = Number(h.match(/(?:計入所需時間|平均存入時間)[\s\S]{0,400}?<small>\s*(\d+)\s*天/)?.[1]) || null;
  // 分品類回饋（TIERS 區塊）：只留期間內的
  const tiers = [];
  for (const row of h.split(/class="tiers-item[\s"]/).slice(1)) {
    const b = row.slice(0, 4000);
    const rate = text(b.match(/class="tiers-value merchant-rates[^"]*">([\s\S]*?)<\/div>/)?.[1]);
    const period = text(b.match(/class="tiers-value tiers-period">([\s\S]*?)<\/div>/)?.[1]);
    const label = text(b.match(/class="tiers-value tiers-title">([\s\S]*?)<\/div>/)?.[1]);
    const dates = [...period.matchAll(/(\d{1,4}[/.]\d{1,2}[/.]\d{1,4})/g)].map((x) => toYmd(x[1]));
    if (!rate || (dates[1] && dates[1] < today)) continue;
    tiers.push({ rate, label: label.slice(0, 80), startAt: dates[0] || null, endAt: dates[1] || null });
  }
  return { boostEndAt: until ? toYmd(until) : null, conditions, creditDays, tiers };
}

/** 優惠券頁（長榮可看到代碼；國泰未登入只看得到商戶與到期日） */
export function parseVouchers(html, baseUrl) {
  const out = [];
  for (const raw of String(html).split(/<div class="voucher-item[\s"]/).slice(1)) {
    const b = raw.slice(0, 5000);
    const href = decode(b.match(/<a href="([^"]+)"/)?.[1] || '');
    if (!href) continue;
    const url = new URL(href, baseUrl);
    url.search = '';
    url.hash = '';
    const titleAttr = decode(b.match(/<a [^>]*title="([^"]*)"/)?.[1] || '');
    const merchant = text(b.match(/class="merchant-title"[^>]*>([^<]+)</)?.[1]) || clean(titleAttr.split(' - ')[0]);
    const full = decode(b.match(/class="item-txt" title="([^"]*)"/)?.[1] || '');
    const title = clean(full) || text(b.match(/class="voucher-txt"[^>]*>([^<]*)</)?.[1]);
    const codeRaw = text(b.match(/class="voucher-code">[\s\S]*?<strong[^>]*>([\s\S]*?)<\/strong>/)?.[1]);
    const code = !codeRaw || /no code|無需|不需/i.test(codeRaw) ? null : codeRaw;
    const endAt = toYmd(b.match(/class="date">([^<]+)</)?.[1]);
    const hidden = /voucher-hide-content|請登入查看/.test(b);
    out.push({ merchant, merchantUrl: url.href, title, code, endAt, hidden });
  }
  return out;
}
