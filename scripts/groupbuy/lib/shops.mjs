// 購物網站搜尋結果 → [{ name, price, url }]（純函式，不連網）。抓取流程在 scripts/groupbuy/compare.mjs。

/** PChome 24h 搜尋 API（ecshweb.pchome.com.tw/search/v4.3）的 JSON */
export function pchomeResults(body) {
  const j = typeof body === 'string' ? JSON.parse(body) : body;
  return (j?.Prods || []).filter((p) => p?.Id && p?.Name).map((p) => ({ name: p.Name, price: Number(p.Price), url: `https://24h.pchome.com.tw/prod/${p.Id}` }));
}

// momo 商品網址只留 i_code，去掉搜尋追蹤參數
const cleanUrl = (u) => {
  try {
    const url = new URL(u);
    if (/momoshop\.com\.tw$/.test(url.hostname) && url.searchParams.get('i_code')) return `https://www.momoshop.com.tw/goods/GoodsDetail.jsp?i_code=${url.searchParams.get('i_code')}`;
    return url.href;
  } catch {
    return null;
  }
};

/** 頁面裡 JSON-LD 的 ItemList（momo 搜尋頁；Yahoo 用瀏覽器開時也有） */
export function ldItemList(html) {
  const out = [];
  for (const m of String(html ?? '').matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)) {
    let j;
    try {
      j = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const nodes = [j].flat().flatMap((x) => (x && x['@graph'] ? x['@graph'] : [x]));
    for (const node of nodes) {
      if (node?.['@type'] !== 'ItemList') continue;
      for (const el of node.itemListElement || []) {
        const it = el?.item || el;
        const offer = [it?.offers].flat()[0] || {};
        const url = cleanUrl(offer.url || it?.url || '');
        const price = Number(offer.price ?? offer.lowPrice);
        if (it?.name && url && price > 0) out.push({ name: it.name, price, url });
      }
    }
  }
  return out;
}

/** Yahoo購物中心搜尋頁：伺服器版的資料在 <script id="isoredux-data">，沒有時退回 JSON-LD */
export function yahooResults(html) {
  const m = String(html ?? '').match(/<script[^>]*id="isoredux-data"[^>]*>([\s\S]*?)<\/script>/);
  if (m) {
    try {
      const hits = JSON.parse(m[1])?.search?.ecsearch?.hits || [];
      const rows = hits
        .filter((h) => h?.ec_title && h?.ec_item_url)
        .map((h) => ({ name: h.ec_title, price: Number(h.ec_price), url: String(h.ec_item_url).replace(/^http:/, 'https:') }))
        .filter((r) => r.price > 0);
      if (rows.length) return rows;
    } catch {
      // 版面改了：退回 JSON-LD
    }
  }
  return ldItemList(html);
}
