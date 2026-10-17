import { chromium } from 'playwright';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

/** 以台灣使用者身分開一個瀏覽器環境 */
export async function openBrowser() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: UA,
    locale: 'zh-TW',
    timezoneId: 'Asia/Taipei',
    viewport: { width: 1366, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8' },
  });
  return { browser, context };
}

const isJson = (res) => /json/i.test(res.headers()['content-type'] || '');

/**
 * 載入頁面並收集：HTML、所有 JSON 回應、連結。
 * jsonFilter 可略過不相關的追蹤 API。
 */
export async function loadPage(context, url, { scrolls = 4, maxJsonBytes = 400_000, wait = 2500, clickMore = null, maxClicks = 0 } = {}) {
  const page = await context.newPage();
  const json = [];
  page.on('response', async (res) => {
    try {
      if (!isJson(res)) return;
      const body = await res.text();
      const request = res.request().postData();
      json.push({ url: res.url(), status: res.status(), request: request?.slice(0, 20_000), bytes: body.length, body: body.slice(0, maxJsonBytes) });
    } catch {
      /* 頁面關閉後的回應讀不到，忽略 */
    }
  });
  let status = null;
  let error = null;
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    status = res?.status() ?? null;
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    for (let i = 0; i < scrolls; i++) {
      await page.mouse.wheel(0, 4000);
      await page.waitForTimeout(800);
    }
    // 點「更多」按鈕載入完整清單
    for (let i = 0; clickMore && i < maxClicks; i++) {
      const btn = page.getByRole('button', { name: clickMore }).or(page.getByText(clickMore)).first();
      if (!(await btn.isVisible().catch(() => false))) break;
      await btn.click({ timeout: 5_000 }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(600);
    }
    await page.waitForTimeout(wait);
  } catch (e) {
    error = String(e.message || e).slice(0, 500);
  }
  const snapshot = await page
    .evaluate(() => ({
      title: document.title,
      finalUrl: location.href,
      html: document.documentElement.outerHTML,
      text: document.body?.innerText || '',
      links: [...document.querySelectorAll('a[href]')].map((a) => ({
        href: a.href,
        text: (a.innerText || a.getAttribute('aria-label') || a.title || '').trim().slice(0, 120),
      })),
    }))
    .catch((e) => ({ title: '', finalUrl: url, html: '', text: '', links: [], evalError: String(e) }));
  await page.close();
  return { url, status, error, json, ...snapshot };
}
