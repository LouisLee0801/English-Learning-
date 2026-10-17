// 外幣 → 台幣匯率（1 外幣 = 幾台幣），用來把外幣計價的哩程換算成每 NT$100。
// 先試臺灣銀行牌告（即期賣出），失敗再用 open.er-api.com，最後用保守的固定值。
const FALLBACK = { USD: 32.5, HKD: 4.15, SGD: 24.5, AUD: 21, NZD: 19, CAD: 23.5, JPY: 0.215, KRW: 0.024, CNY: 4.55, THB: 0.95, MYR: 7.3, GBP: 42, EUR: 35, CHF: 38 };

async function bankOfTaiwan() {
  const res = await fetch('https://rate.bot.com.tw/xrt/flcsv/0/day', { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`BOT ${res.status}`);
  const fx = {};
  for (const line of (await res.text()).split('\n').slice(1)) {
    const c = line.split(',');
    // 幣別,本行買入,現金,即期,...,本行賣出,現金,即期
    const cur = c[0]?.trim();
    const spotSell = Number(c[13]);
    if (cur && spotSell > 0) fx[cur] = spotSell;
  }
  if (!fx.USD) throw new Error('BOT: no USD');
  return { ...fx, _src: '臺灣銀行即期賣出' };
}

async function erApi() {
  const res = await fetch('https://open.er-api.com/v6/latest/TWD', { signal: AbortSignal.timeout(15_000) });
  const j = await res.json();
  if (j.result !== 'success') throw new Error('er-api failed');
  const fx = {};
  for (const [k, v] of Object.entries(j.rates)) if (v > 0) fx[k] = Math.round((1 / v) * 10000) / 10000;
  return { ...fx, _src: 'open.er-api.com' };
}

export async function getFx() {
  for (const f of [bankOfTaiwan, erApi]) {
    try {
      const fx = await f();
      return Object.fromEntries(Object.entries({ ...FALLBACK, ...fx }).filter(([k]) => k === '_src' || k in FALLBACK));
    } catch (e) {
      console.warn('fx source failed:', e.message);
    }
  }
  return { ...FALLBACK, _src: '固定值' };
}
