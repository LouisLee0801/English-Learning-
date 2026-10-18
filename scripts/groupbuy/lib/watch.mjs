// watchlist.json：追蹤的團主帳號、團媽網站、FB 粉專的 RSS、搜尋關鍵字。帳號可寫 @abc、abc 或完整網址。

// 沒有在 watchlist.json 設定關鍵字時用這些
export const DEFAULT_KEYWORDS = {
  threads: ['開團', '限時開團', '開團啦', '收單'],
  search: [
    'site:instagram.com 開團 結單',
    'site:instagram.com 開團 寶寶',
    'site:instagram.com 開團 家電',
    'site:instagram.com 開團啦',
    'site:instagram.com 開團 童裝',
    'site:instagram.com 團購 開團期間',
    'site:instagram.com 開團 嬰兒',
    'site:instagram.com 開團 收納',
    'site:facebook.com 開團 結單',
    'site:instagram.com 開團 保養',
    'site:instagram.com 開團 居家',
    'site:instagram.com 開團 零食',
  ],
};

const handle = (s) =>
  String(s ?? '')
    .trim()
    .replace(/^https?:\/\/(www\.)?(threads\.(com|net)|instagram\.com)\/@?/i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '');

const isHttp = (u) => /^https?:\/\//.test(String(u ?? '').trim());

/** 整理 watchlist.json：帳號去掉 @ 與網址、去重；沒設定關鍵字就用預設 */
export function normalizeWatch(w = {}) {
  const list = (a) => [...new Set((Array.isArray(a) ? a : []).map(handle).filter(Boolean))];
  return {
    threads: list(w.threads),
    instagram: list(w.instagram),
    pages: (Array.isArray(w.pages) ? w.pages : []).map((p) => (typeof p === 'string' ? { url: p } : p)).filter((p) => /^https?:\/\//.test(p?.url || '')),
    // FB 粉專（RSS）：{ name, page, feed }；feed 是 RSS.app／FetchRSS 產生的網址，留空＝還沒建立
    rss: (Array.isArray(w.rss) ? w.rss : [])
      .map((r) => (typeof r === 'string' ? { feed: r } : r))
      .filter((r) => r && (isHttp(r.feed) || isHttp(r.page)))
      .map((r) => ({ name: r.name || '', page: isHttp(r.page) ? r.page.trim() : '', feed: isHttp(r.feed) ? r.feed.trim() : '', ...(r.platform ? { platform: r.platform } : {}) })),
    keywords: {
      threads: w.keywords?.threads?.length ? w.keywords.threads : DEFAULT_KEYWORDS.threads,
      search: w.keywords?.search?.length ? w.keywords.search : DEFAULT_KEYWORDS.search,
    },
  };
}
