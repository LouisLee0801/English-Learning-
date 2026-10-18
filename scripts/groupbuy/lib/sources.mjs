// 各來源頁面的解析（純函式）：Threads 搜尋／個人頁、DuckDuckGo 搜尋結果（IG／FB／Threads 貼文）、團媽網站的開團日曆、RSS feed（FB 粉專）。
// 抓取流程在 adapters/，這裡只把 HTML／文字轉成統一的貼文格式：
// { source, id, url, author, authorName, authorUrl, title, text, postedAt(ISO), via, platform? }
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
const HEADING = /^(?:▍|▼|正在開團|開團日曆|本月開團|團購清單|開團清單|近期開團|即將開團|目前開團中|本週新開團|現正開團中|長期團購|copyright|cookie)|團購排程|開團行事曆/i;
const ORDER_LINE = /(?:搶購|購買|下單|訂購|團購|商品)?(?:網址|連結|link)\s*[→:：>＞]|^\s*🛒|^\s*https?:\/\//i;
// 不是商品的行：連結說明、心得文、客服、文章資訊（最後更新、發文日期）
const SKIP_LINE = /^[►⭕▶︎→➜👉\s]*(?:跟團去|圖文心得|心得|開箱文?|商品介紹|介紹|參考更多|客服|訂閱連結|延伸閱讀|最後更新|更新|發布|發佈|作者|分類|標籤|留言|上一篇|下一篇)|^\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日|私訊|版規|碎碎念|群組|社群|客服|line\s*@|line\s*通知|官方\s*line|加入|粉絲團|粉專|限時動態|追蹤我|(?:圖文)?心得\s*[:：]?\s*(?:https?:|$)|介紹\s*[:：]?\s*(?:https?:|$)/i;
// 「商品名」下一行只有「10/25結團」這種日期：併回上一行
const DATE_ONLY = /^\d{1,2}[/.]\d{1,2}\s*(?:[(（][一二三四五六日天][)）])?\s*(?:結團|收單|結單|截止|止|開團|開賣)\s*$/;
const URL_IN = /https?:\/\/[^\s<>"'，。）)】]+/i;
const bigrams = (s) => new Set((String(s).match(/\p{Script=Han}{2,}/gu) || []).flatMap((run) => [...run].slice(1).map((c, i) => run[i] + c)));
function sharedBigrams(a, b) {
  const x = bigrams(a);
  let n = 0;
  for (const g of bigrams(b)) if (x.has(g)) n++;
  return n;
}

/**
 * 開團日曆頁的文字 → 每檔一筆。認得的格式：
 * - 「🌟recolte 無線萬用調理機(10/31收單)」＋下一行「🛒搶購網址→https://…」（Strikingly）
 * - 「10/23止！齒妍堂兒童口腔保健…」＋「►跟團去：https://…」「⭕圖文心得：https://…」（部落格團購預告）
 * - 「Mistifi噴油瓶.油醋壺」＋下一行「10/25結團」，商品名是超連結（部落格團購總覽）
 * links：頁面上的超連結 [{ text, href }]，用來補文字裡沒有的網址。同一頁同一檔只收一次。
 */
export function parseCalendarText(text, { ref = taipeiStamp(), pageUrl = null, links = [] } = {}) {
  // 文字對應到的超連結：連結文字出現在這一行裡（取最長的），站內選單連結不算
  const usable = links.filter((l) => l.text.length >= 3 && !/^(首頁|home|關於|聯絡|隱私|上一篇|下一篇|more|read more|繼續閱讀)$/i.test(l.text));
  const linkFor = (line) => usable.filter((l) => line.includes(l.text)).sort((a, b) => b.text.length - a.text.length)[0] || null;
  const lines = [];
  for (const l of String(text ?? '').split(/\n/).map((x) => x.trim()).filter(Boolean)) {
    if (DATE_ONLY.test(l) && lines.length) lines[lines.length - 1] += `（${l}）`;
    else lines.push(l);
  }
  const items = [];
  const seen = new Set();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (HEADING.test(line.replace(BULLET, '')) || ORDER_LINE.test(line) || SKIP_LINE.test(line) || line.length < 4 || line.length > 160) continue;
    // 後面兩行的網址：「跟團去／搶購」是下單連結，「心得／介紹」是文章
    let nextOrder = null;
    let nextPost = null;
    for (const n of lines.slice(i + 1, i + 4)) {
      const u = n.match(URL_IN)?.[0];
      if (!u) continue;
      if (!nextOrder && /跟團|搶購|下單|購買|訂購|團購|🛒|網址|連結/.test(n)) nextOrder = u;
      else if (!nextPost && /心得|開箱|介紹|分享|參考/.test(n)) nextPost = u;
      else if (!nextOrder && !nextPost && URL_IN.test(n.slice(0, 12))) nextOrder = u;
    }
    const link = linkFor(line);
    const orderUrl = extractOrderUrl(line) || nextOrder || (link && extractOrderUrl(link.href)) || null;
    const win = parseWindow(line, ref);
    const hasDeal = win.openAt || win.closeAt || /開團|團購|收單|結單|開賣|現貨|預購/.test(line);
    if (!(BULLET.test(line) || win.closeAt || win.openAt || orderUrl) || !(hasDeal || orderUrl)) continue;
    const product = extractProduct({ title: line.replace(BULLET, ''), ref, strict: false });
    if (product.length < 2) continue;
    const linkUrl = link?.href || nextPost || null;
    const when = win.closeAt || win.openAt || '';
    const keys = [orderUrl, linkUrl, `${when}|${product.slice(0, 6)}`].filter(Boolean);
    if (keys.some((k) => seen.has(k))) continue;
    // 同頁的「總覽」和「詳細介紹」常寫成不同名字（小v鬆餅機 vs 日本Vitantonio鬆餅機）：沒有連結的那筆，同一天又有兩組相同中文字就算重複
    if (!orderUrl && !linkUrl && items.some((x) => (x.closeAt || x.openAt || '') === when && sharedBigrams(x.product, product) >= 2)) continue;
    keys.forEach((k) => seen.add(k));
    items.push({ line, product, ...win, orderUrl, linkUrl, index: items.length });
  }
  // 清單大多附連結（商品名是超連結或下一行有網址）時，沒連結的多半是下面詳細介紹的重複或說明文字
  const linked = items.filter((x) => x.orderUrl || x.linkUrl).length;
  return linked >= items.length * 0.6 ? items.filter((x) => x.orderUrl || x.linkUrl) : items;
}

export function pagePost(page, item, ref) {
  return {
    source: 'pages',
    id: `pages:${page.id || page.url}#${item.product.slice(0, 30)}`,
    url: item.orderUrl || item.linkUrl || page.url,
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

// ---------- RSS（RSS.app、FetchRSS 把 FB 粉專轉成的 feed；也收 Atom、JSON Feed） ----------

// CDATA 裡是原始 HTML；沒包 CDATA 的是跳脫過的 HTML，先還原一次
const xmlText = (s) => (/<!\[CDATA\[/.test(s) ? s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') : decode(s));
function tag(block, name) {
  const m = String(block).match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? xmlText(m[1]).trim() : '';
}
// Atom：<link rel="alternate" href="…"/>
function atomLink(block) {
  const attrs = [...String(block).matchAll(/<link\b([^>]*?)\/?>/gi)].map((m) => m[1]);
  const pick = attrs.find((a) => !/\brel\s*=/i.test(a) || /\brel\s*=\s*["']alternate["']/i.test(a));
  return pick ? decode(pick.match(/\bhref\s*=\s*["']([^"']*)["']/i)?.[1] || '') : '';
}

/** HTML → 純文字：保留換行（br、段落），去掉 FetchRSS 浮水印 */
export function htmlToText(html) {
  return decode(
    String(html ?? '')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|li|h[1-6]|blockquote|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\(?\s*(?:Feed\s+)?generated\s+with\s+FetchRSS\s*\)?/gi, '')
    .split('\n')
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** RSS 2.0／Atom／JSON Feed → { title, link, items: [{ id, link, title, text, date }] } */
export function parseFeed(body) {
  const s = String(body ?? '').trim();
  if (s.startsWith('{')) {
    const j = JSON.parse(s);
    return {
      title: j.title || '',
      link: j.home_page_url || '',
      items: (j.items || []).map((it) => ({
        id: String(it.id ?? it.url ?? ''),
        link: it.url || it.external_url || '',
        title: htmlToText(it.title || ''),
        text: it.content_text ? String(it.content_text).trim() : htmlToText(it.content_html || it.summary || ''),
        date: it.date_published || it.date_modified || null,
      })),
    };
  }
  const atom = /<feed[\s>]/i.test(s) && !/<rss[\s>]/i.test(s);
  const first = s.search(atom ? /<entry[\s>]/i : /<item[\s>]/i);
  const head = first >= 0 ? s.slice(0, first) : s;
  const blocks = [...s.matchAll(atom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi)].map((m) => m[0]);
  return {
    title: htmlToText(tag(head, 'title')),
    link: tag(head, 'link') || atomLink(head),
    items: blocks.map((b) => {
      const link = tag(b, 'link') || atomLink(b);
      return {
        id: tag(b, 'guid') || tag(b, 'id') || link,
        link,
        title: htmlToText(tag(b, 'title')),
        text: htmlToText(tag(b, 'content:encoded') || tag(b, 'description') || tag(b, 'content') || tag(b, 'summary')),
        date: tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date') || null,
      };
    }),
  };
}

const hostOf = (u) => {
  try {
    return new URL(u).hostname.toLowerCase();
  } catch {
    return '';
  }
};
/** 網址 → 平台名稱（Facebook／Instagram／Threads），認不得回 null */
export function platformOf(url) {
  const h = hostOf(url);
  if (/(?:^|\.)(?:facebook\.com|fb\.com|fb\.watch)$/.test(h)) return 'Facebook';
  if (/(?:^|\.)instagram\.com$/.test(h)) return 'Instagram';
  if (/(?:^|\.)threads\.(?:net|com)$/.test(h)) return 'Threads';
  return null;
}
const fnv = (s) => {
  let h = 0x811c9dc5;
  for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 0x01000193) >>> 0;
  return h.toString(16);
};
// 貼文網址 → 穩定的 id：story_fbid／fbid 參數，或路徑最後一段（posts/pfbid…、reel/123、IG 的 p/CODE）
function postKey(link, fallback) {
  try {
    const u = new URL(link);
    const q = u.searchParams.get('story_fbid') || u.searchParams.get('fbid') || u.searchParams.get('v');
    if (q) return q;
    const last = u.pathname.replace(/\/+$/, '').split('/').pop();
    if (last && !/\.(?:php|html?)$/i.test(last) && !/^(?:watch|photo|photos|videos|posts|reel|reels|p|post)$/i.test(last)) return last;
  } catch {
    // 不是網址：用 guid
  }
  return fnv(fallback || link);
}
const pageHandle = (page) => {
  try {
    const u = new URL(page);
    return u.searchParams.get('id') || decodeURIComponent(u.pathname.split('/').filter(Boolean)[0] || '') || null;
  } catch {
    return null;
  }
};

const FB_UI_LINE = /^(?:(?:Photos?|Videos?|Reels?) from .{1,80}'s (?:post|reel|video)|.{1,80} (?:added|shared|updated) .{0,40}(?:photos?|videos?|post|cover photo|profile picture))\.?$/i;

/**
 * feed 的一則 → 貼文。entry 是 watchlist.json 的 { name, page, feed }。
 * RSS.app、FetchRSS 的標題多半是內文第一行截斷；內文開頭就是標題時不重複。
 */
export function feedPost(entry, it) {
  const link = /^https?:\/\//.test(it.link || '') ? it.link : entry.page || entry.feed;
  const platform = entry.platform || platformOf(link) || platformOf(entry.page) || '團媽網站';
  const key = { Facebook: 'facebook', Instagram: 'instagram', Threads: 'threads' }[platform] || 'rss';
  const title = String(it.title || '').replace(/\s*(?:\.{3}|…)$/, '').trim();
  const flat = (s) => String(s).replace(/\s+/g, '');
  // FetchRSS 會在內文前加「Photos from 某某's post」這類 FB 介面字
  const body = String(it.text || '').split('\n').filter((l) => !FB_UI_LINE.test(l)).join('\n');
  const head = FB_UI_LINE.test(title) ? '' : title;
  const text = !head || flat(body).startsWith(flat(head).slice(0, 20)) ? body : `${head}\n${body}`;
  const t = Date.parse(it.date || '');
  return {
    source: 'rss',
    platform,
    id: `${key}:${postKey(link, it.id)}`,
    url: link,
    author: pageHandle(entry.page),
    authorName: entry.name || null,
    authorUrl: entry.page || null,
    title: '',
    text: text || head,
    postedAt: Number.isNaN(t) ? null : new Date(t).toISOString(),
    via: 'rss',
  };
}
