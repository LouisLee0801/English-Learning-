/** 限制同時請求數，並在每個請求之間稍作停頓，避免對來源網站造成負擔 */
export async function pool(items, concurrency, fn, { delayMs = 250 } = {}) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
      if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

/** 短雜湊：用來替沒有 id 的優惠券產生穩定 id */
export function hash(s) {
  let h = 5381;
  for (const c of String(s)) h = ((h << 5) + h + c.codePointAt(0)) >>> 0;
  return h.toString(36);
}
