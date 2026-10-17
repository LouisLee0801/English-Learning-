// 各來源頁面的解析（純函式）：Threads 搜尋／個人頁、DuckDuckGo 搜尋結果（IG／FB／Threads 貼文）、團媽網站的開團日曆。
// 抓取流程在 adapters/，這裡只把 HTML／文字轉成統一的貼文格式：
// { source, id, url, author, authorName, authorUrl, title, text, postedAt(ISO), via }
import { parseWindow, extractProduct, extractOrderUrl, taipeiStamp } from '../../../groupbuy/js/parse.js';

const decode = (s) =>
  String(s ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
const stripTags = (h) => decode(String(h ?? '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

// ---------- Threads（未登入的搜尋頁與個人頁，資料在 <script type="application/json" data-sjs> 裡） ----------

/** 從 Threads 頁面 HTML 取出所有貼文（含引用的貼文），依 code 去重 */
export function parseThreadsHtml(html) {
  const posts = new Map();
  const walk = (o, depth = 0) => {
    if (!o || typeof o !== 'object' || depth > 60) return;
    if (Array.isArray(o)) {
      for (const v of o) walk(v, depth + 1);
      return;
    }
    if (o.code && o.taken_at && o.user?.username && 'caption' in o) {
      const text = o.caption?.text || '';
      if (!posts.has(o.code))
        posts.set(o.code, {
          code: o.code,
          username: o.user.username,
          fullName: o.user.full_name || null,
          takenAt: Number(o.taken_at),
          text,
          likes: o.like_count ?? null,
          replies: o.text_post_app_info?.direct_reply_count ?? null,
          isReply: Boolean(o.text_post_app_info?.reply_to_author),
        });
    }
    for (const v of Object.values(o)) walk(v, depth + 1);
  };
  for (const m of String(html).matchAll(/<script type="application\/json"[^>]*data-sjs[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      walk(JSON.parse(m[1]));
    } catch {
      /* 非 JSON 的區塊略過 */
    }
  }
  return [...posts.values()];
}

/** 搜尋頁「查無結果」：未登入時偶爾被限流，回傳空頁 */
export const threadsNoResults = (html) => /查無結果|No results/.test(String(html)) && !/"thread_items"/.test(String(html));

export function threadsPost(p, via = 'search') {
  return {
    source: 'threads',
    id: `threads:${p.code}`,
    url: `https://www.threads.com/@${p.username}/post/${p.code}`,
    author: p.username,
    authorName: p.fullName && p.fullName !== p.username ? p.fullName : null,
    authorUrl: `https://www.threads.com/@${p.username}`,
    title: '',
    text: p.text,
    postedAt: new Date(p.takenAt * 1000).toISOString(),
    via,
    isReply: p.isReply,
  };
}

// ---------- DuckDuckGo HTML 搜尋結果（找 IG／FB／Threads 的公開貼文） ----------

export function parseDdgHtml(html) {
  const out = [];
  for (const block of String(html).split(/<div class="result results_links/).slice(1)) {
    const a = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!a) continue;
    const href = decode(a[1]);
    const real = href.includes('uddg=') ? decodeURIComponent(href.split('uddg=')[1].split('&')[0]) : href;
    const snippet = stripTags(block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/)?.[1]);
    out.push({ url: real.startsWith('//') ? `https:${real}` : real, title: stripTags(a[2]), snippet });
  }
  return out;
}

/** DuckDuckGo 擋下時回 202 或驗證頁 */
export const ddgBlocked = (status, html) => status === 202 || /anomaly|challenge-form|Unfortunately, bots/i.test(String(html).slice(0, 20_000));

const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };

/**
 * IG 搜尋結果 → 貼文。摘要常見格式：「721 likes, 175 comments - xian_xian_tsai on October 12, 2026: "超好用的購物包開團…"」
 * 標題格式：「Xian Xian Tsai | 超好用的購物包開團 底下任意 ... - Instagram」
 */
export function igPostFromDdg(r) {
  const m = r.url.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/);
  if (!m) return null;
  const code = m[2];
  const head = r.snippet.match(/^(?:[\d,.]+[KkMm萬]?\s*likes?,\s*[\d,.]+[KkMm萬]?\s*comments?\s*-\s*)?([\w.]+)\s+on\s+([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})\s*:\s*["“]?([\s\S]*)$/);
  // 另一種摘要：「Follow 13likes peach_1108 🚨🌾 樂米脆｜限時開團啦～」
  const follow = !head && r.snippet.match(/^Follow\s+[\d,.]+[KkMm萬]?\s*likes?\s+([\w.]+)\s+([\s\S]*)$/);
  const [titleName, ...titleRest] = r.title.replace(/\s*[-|]\s*Instagram\s*$/i, '').split(' | ');
  let author = head?.[1] || follow?.[1] || null;
  let postedAt = null;
  if (head && MONTHS[head[2].toLowerCase()]) postedAt = new Date(`${head[4]}-${String(MONTHS[head[2].toLowerCase()]).padStart(2, '0')}-${head[3].padStart(2, '0')}T12:00:00+08:00`).toISOString();
  const caption = (head ? head[5] : follow ? follow[2] : r.snippet).replace(/["”]\.?\s*$/, '').replace(/\s*\.\.\.\s*$/, '…');
  const titleText = titleRest.join(' | ').replace(/\s*\.\.\.\s*$/, '…');
  return {
    source: 'instagram',
    id: `instagram:${code}`,
    url: `https://www.instagram.com/${m[1] === 'p' ? 'p' : 'reel'}/${code}/`,
    author: author || null,
    authorName: titleName && titleName !== author ? titleName.trim() : null,
    authorUrl: author ? `https://www.instagram.com/${author}/` : null,
    title: titleText,
    text: caption.length >= titleText.length ? caption : `${titleText}\n${caption}`,
    postedAt,
    via: 'search',
  };
}

/** FB 搜尋結果 → 貼文（只收貼文、影片、Reels，不收粉專首頁） */
export function fbPostFromDdg(r) {
  if (!/facebook\.com\/(?:[^/]+\/(?:posts|videos)\/|reel\/|groups\/[^/]+\/posts\/|permalink\.php|story\.php|share\/[pv]\/)/.test(r.url)) return null;
  const id = r.url.replace(/[?#].*$/, '').replace(/\/$/, '').split('/').slice(-1)[0] || r.url;
  const name = r.title.split(/\s*[-|｜]\s*/)[0];
  return {
    source: 'facebook',
    id: `facebook:${id}`,
    url: r.url.replace(/[?#].*$/, ''),
    author: null,
    authorName: name || null,
    authorUrl: null,
    title: r.title.replace(/\s*[-|｜]\s*Facebook\s*$/i, ''),
    text: r.snippet,
    postedAt: null,
    via: 'search',
  };
}

// ---------- 團媽網站的開團日曆（Strikingly、Portaly、部落格頁面…） ----------

const BULLET = /^[\s]*(?:[🌟⭐✨🔥✅🔸🔹▶►•●◆◇■□★☆➤➜👉🎀💕💖🆕🌸🍼]|[-*]\s|\d{1,2}[.、)]\s?|[①-⑳])/u;
const HEADING = /^(?:正在開團|開團日曆|本月開團|團購清單|開團清單|近期開團|即將開團|copyright|cookie)/i;
const ORDER_LINE = /(?:搶購|購買|下單|訂購|團購|商品)?(?:網址|連結|link)\s*[→:：>＞]|^\s*🛒|^\s*https?:\/\//i;

/**
 * 開團日曆頁的文字 → 每檔一筆：「🌟recolte 無線萬用調理機(10/31收單)」＋下一行「🛒搶購網址→https://…」。
 * 只收有期間、有收單日，或下一兩行附下單連結的項目。
 */
export function parseCalendarText(text, { ref = taipeiStamp(), pageUrl = null } = {}) {
  const lines = String(text ?? '').split(/\n/).map((l) => l.trim()).filter(Boolean);
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (HEADING.test(line.replace(BULLET, '')) || ORDER_LINE.test(line) || line.length < 4 || line.length > 160) continue;
    const next = lines.slice(i + 1, i + 3).find((l) => ORDER_LINE.test(l) || /https?:\/\//.test(l));
    const orderUrl = extractOrderUrl(line) || (next && (next.match(/https?:\/\/[^\s<>"'，。）)】]+/) || [])[0]) || null;
    const win = parseWindow(line, ref);
    const hasDeal = win.openAt || win.closeAt || /開團|團購|收單|結單|開賣|現貨|預購/.test(line);
    if (!(BULLET.test(line) || win.closeAt || orderUrl) || !(hasDeal || orderUrl)) continue;
    const product = extractProduct({ title: line.replace(BULLET, ''), ref });
    if (product.length < 2) continue;
    items.push({ line, product, ...win, orderUrl, index: items.length });
  }
  return items;
}

export function pagePost(page, item, ref) {
  return {
    source: 'pages',
    id: `pages:${page.id || page.url}#${item.product.slice(0, 30)}`,
    url: item.orderUrl || page.url,
    pageUrl: page.url,
    author: null,
    authorName: page.name || null,
    authorUrl: page.url,
    title: item.product,
    text: item.line,
    postedAt: null,
    via: 'watch',
    parsed: item,
    ref,
  };
}

/** Threads 搜尋結果（DuckDuckGo）→ 貼文：網址形如 threads.com/@user/post/CODE */
export function threadsPostFromDdg(r) {
  const m = r.url.match(/threads\.(?:com|net)\/@([\w.]+)\/post\/([\w-]+)/);
  if (!m) return null;
  const text = r.snippet.replace(/^.{0,40}\(@[\w.]+\)\.\s*/, '').replace(/^\d+\s+Replies?\.\s*/i, '');
  return {
    source: 'threads',
    id: `threads:${m[2]}`,
    url: `https://www.threads.com/@${m[1]}/post/${m[2]}`,
    author: m[1],
    authorName: null,
    authorUrl: `https://www.threads.com/@${m[1]}`,
    title: '',
    text: text || r.title,
    postedAt: null,
    via: 'search',
  };
}

/** 官方 API 回傳的 permalink → 貼文代碼（和網頁抓到的同一篇能對上） */
export const codeOf = (permalink) => String(permalink || '').match(/\/(?:post|p|reel|reels|tv)\/([\w-]+)/)?.[1] || null;
