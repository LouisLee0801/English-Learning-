import {
  PLATFORMS, nowStamp, status, dueText, combine, filterItems, matchesQuery, categoryCounts, timeline, calendarUrl,
  filtersToQuery, queryToFilters,
} from './core.js';
import { CATEGORIES, CATEGORY_KEYS, categoryIcon } from './categories.js';
import { parsePost, taipeiStamp } from './parse.js';
import * as mine from './mine.js';

const $main = document.getElementById('main');
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
// 連結只接受 http(s)：匯入的備份或貼上的網址不能變成 javascript: 連結
const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '')) ? esc(u) : '');
const PAGE = 60;
const REPO = 'https://github.com/LouisLee0801/English-Learning-';

const data = { items: [], meta: null, watch: null, loaded: false, error: null };
let shown = PAGE;

// ---------- 資料 ----------
async function getJson(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

async function load() {
  try {
    data.meta = await getJson('data/meta.json').catch(() => null);
    data.watch = await getJson('data/watchlist.json').catch(() => null);
    const files = data.meta?.files || ['threads.json', 'search.json', 'pages.json', 'instagram.json', 'manual.json'];
    const parts = await Promise.all(files.map((f) => getJson(`data/${f}`).then((j) => ({ file: f, items: j.items || [] })).catch(() => ({ file: f, items: [] }))));
    data.items = combine(parts);
  } catch (e) {
    data.error = e.message;
  }
  data.loaded = true;
  render();
}

const allItems = () => [...mine.addedItems(), ...data.items];

// ---------- 共用片段 ----------
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 1600);
}

const md = (s) => (s ? `${+s.slice(5, 7)}/${+s.slice(8, 10)}${s.length > 10 ? ` ${s.slice(11)}` : ''}` : '');
const fmtTime = (iso) => (iso ? new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '');
const fmtPrice = (n) => `$${Number(n).toLocaleString('zh-TW')}`;

/** 搜尋字標黃（先跳脫再標記） */
function hl(text, q) {
  const s = esc(text);
  const terms = String(q || '').trim().split(/\s+/).filter((t) => t.length >= 1).map((t) => esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return terms.length ? s.replace(new RegExp(`(${terms.join('|')})`, 'gi'), '<mark>$1</mark>') : s;
}

function windowText(it) {
  if (it.openAt && it.closeAt) return `開團 ${md(it.openAt)} → 結單 ${md(it.closeAt)}`;
  if (it.closeAt) return `結單 ${md(it.closeAt)}`;
  if (it.openAt) return `開團 ${md(it.openAt)}・結單日見原文`;
  return '';
}

function byline(it) {
  const name = it.authorName || (it.author ? `@${it.author}` : '');
  const handle = it.authorName && it.author ? ` @${it.author}` : '';
  const who = name ? (safeUrl(it.authorUrl) ? `<a href="${safeUrl(it.authorUrl)}" target="_blank" rel="noopener">${esc(name)}${esc(handle)}</a>` : esc(name + handle)) : '';
  const when = it.postedAt ? `${fmtTime(it.postedAt)} 發文` : it.firstSeenAt ? `${fmtTime(it.firstSeenAt)} 收錄` : '';
  return [who, when].filter(Boolean).join(' · ');
}

function card(it, now, q = '') {
  const st = status(it, now);
  const pf = PLATFORMS[it.platform] || { short: it.platform, cls: 'web' };
  const due = !it.closeAt && st === 'open' ? 'noclose' : st;
  const cal = calendarUrl(it, location.href.split('#')[0]);
  const saved = mine.isSaved(it.id);
  const win = windowText(it);
  return `<article class="card st-${st}">
    <div class="card-top">
      <div class="badges">
        <span class="badge pf pf-${pf.cls}">${esc(pf.short)}</span>
        <span class="badge">${categoryIcon(it.category)} ${esc(it.category)}</span>
        ${(it.tags || []).slice(0, 2).map((t) => `<span class="badge">${esc(t)}</span>`).join('')}
      </div>
      <span class="due ${due}">${esc(dueText(it, now))}</span>
    </div>
    <h3 class="product" title="${esc(it.product)}">${hl(it.product, q)}</h3>
    <div class="by">${byline(it)}</div>
    ${it.price ? `<div class="price"><span class="big">${fmtPrice(it.price)}</span>${it.originalPrice ? `<s>原價 ${fmtPrice(it.originalPrice)}</s>` : ''}</div>` : it.priceText ? `<div class="price"><span class="hint">${esc(it.priceText)}</span></div>` : ''}
    ${win ? `<div class="window">${esc(win)}</div>` : ''}
    ${it.excerpt && it.excerpt !== it.product ? `<details><summary>貼文摘要</summary><p class="excerpt">${hl(it.excerpt, q)}</p></details>` : ''}
    <div class="card-actions">
      <button type="button" class="btn save" data-save="${esc(it.id)}" aria-pressed="${saved}">${saved ? '★ 已收藏' : '☆ 收藏'}</button>
      ${cal && st !== 'closed' ? `<a class="btn" href="${esc(cal)}" target="_blank" rel="noopener" title="加到 Google 日曆，結單前提醒">📅 提醒</a>` : ''}
      ${it.source === 'mine' ? `<button type="button" class="btn danger" data-remove="${esc(it.id)}">刪除</button>` : ''}
      ${safeUrl(it.orderUrl) ? `<a class="btn order" href="${safeUrl(it.orderUrl)}" target="_blank" rel="noopener">下單</a>` : ''}
      ${safeUrl(it.url) ? `<a class="btn primary" href="${safeUrl(it.url)}" target="_blank" rel="noopener">看原文 →</a>` : ''}
    </div>
  </article>`;
}

function chip(group, value, label, on, dotClass = '') {
  return `<button type="button" class="chip" data-group="${group}" data-value="${esc(value)}" aria-pressed="${on}">${dotClass ? `<span class="dot ${dotClass}"></span>` : ''}${esc(label)}</button>`;
}

function emptyState(hasFilter) {
  if (!data.loaded) return `<div class="empty"><b>載入中…</b></div>`;
  if (!data.items.length && !mine.addedItems().length)
    return `<div class="empty"><b>還沒有抓到資料</b>排程每 2 小時自動整理一次；也可以先到「我的團購」貼上看到的開團文。<br/><a href="#/sources">查看資料狀態 →</a></div>`;
  return `<div class="empty"><b>沒有符合條件的團購</b>${hasFilter ? '試著放寬篩選、改搜尋其他字，或把狀態改成「全部（含已結單）」。' : ''}</div>`;
}

function categoryBar(f, pool, path) {
  const counts = categoryCounts(pool);
  const items = CATEGORIES.filter((c) => counts.get(c.key));
  return `<div class="catbar" role="tablist" aria-label="分類">
    <button type="button" class="cat" data-cat="" aria-pressed="${!f.category}"><span>全部</span><b>${pool.length}</b></button>
    ${items.map((c) => `<button type="button" class="cat" data-cat="${esc(c.key)}" aria-pressed="${f.category === c.key}"><span>${c.icon} ${esc(c.key)}</span><b>${counts.get(c.key)}</b></button>`).join('')}
  </div>`;
}

// 同一頁重繪時保留搜尋框、只換下方內容：注音／拼音選字途中輸入框被換掉，選字框會被打斷、方向鍵無法選字
let mounted = null;
const currentQs = () => location.hash.split('?')[1] || '';

/** 篩選改變：以目前網址為準套上變更，寫回網址並重畫 */
function setFilters(path, rerender, patch) {
  shown = PAGE;
  const q = filtersToQuery({ ...queryToFilters(currentQs()), ...patch });
  history.replaceState(null, '', q ? `${path}?${q}` : path);
  rerender(q);
}

/** 建立（或沿用）搜尋框，回傳下方內容區 */
function mount(view, f, path, rerender) {
  if (mounted?.view === view && mounted.body.isConnected) {
    // 上一頁、清除篩選改了網址：輸入框跟著網址（正在打字、選字時不動）
    if (!mounted.typing && mounted.input.value.trim() !== f.q) mounted.input.value = f.q;
    return mounted.body;
  }
  $main.innerHTML = `
    <form class="search" role="search">
      <input id="q" type="search" placeholder="${SEARCH_HINT}" value="${esc(f.q)}" autocomplete="off" enterkeyhint="search" />
    </form>
    <div class="view-body"></div>`;
  const input = document.getElementById('q');
  const m = { view, input, body: $main.querySelector('.view-body'), typing: false };
  let timer;
  const run = () => {
    clearTimeout(timer);
    m.typing = true;
    timer = setTimeout(() => {
      m.typing = false;
      setFilters(path, rerender, { q: input.value.trim() });
    }, 250);
  };
  // 選字中不搜尋，選定（compositionend）才搜
  input.addEventListener('input', (e) => (e.isComposing ? (m.typing = true) : run()));
  input.addEventListener('compositionstart', () => {
    clearTimeout(timer);
    m.typing = true;
  });
  input.addEventListener('compositionend', run);
  $main.querySelector('.search').addEventListener('submit', (e) => e.preventDefault());
  mounted = m;
  return m.body;
}

/** 換掉內容但保留分類列的水平捲動位置；選中的分類被切到時才捲到看得見 */
function paint(body, html) {
  const x = body.querySelector('.catbar')?.scrollLeft || 0;
  body.innerHTML = html;
  const bar = body.querySelector('.catbar');
  if (!bar) return;
  bar.scrollLeft = x;
  const on = bar.querySelector('[aria-pressed="true"]');
  if (!on) return;
  const b = bar.getBoundingClientRect();
  const r = on.getBoundingClientRect();
  if (r.left < b.left) bar.scrollLeft -= b.left - r.left + 16;
  else if (r.right > b.right) bar.scrollLeft += r.right - b.right + 16;
}

/** 分類、篩選的共用事件 */
function bindFilters(f, path, rerender) {
  const update = (patch) => setFilters(path, rerender, patch);
  $main.querySelectorAll('.cat').forEach((b) => b.addEventListener('click', () => update({ category: b.dataset.cat })));
  $main.querySelectorAll('.chip[data-group]').forEach((b) =>
    b.addEventListener('click', () => {
      const { group, value } = b.dataset;
      if (typeof f[group] === 'boolean') return update({ [group]: !f[group] });
      update({ [group]: f[group].includes(value) ? f[group].filter((x) => x !== value) : [...f[group], value] });
    }),
  );
  $main.querySelectorAll('[data-field]').forEach((el) => el.addEventListener('change', () => update({ [el.dataset.field]: el.value })));
  return update;
}

const SEARCH_HINT = '搜尋商品、品牌、團主（例：吸塵器、童裝）';

// ---------- 團購清單 ----------
function viewList(qs) {
  const f = queryToFilters(qs);
  const now = nowStamp();
  const items = allItems();
  const list = filterItems(items, f, now);
  const live = items.filter((x) => ['open', 'closing'].includes(status(x, now)));
  const pool = live.filter((x) => (!f.platforms.length || f.platforms.includes(x.platform)) && matchesQuery(x, f.q));
  const pfCounts = {};
  for (const x of live) pfCounts[x.platform] = (pfCounts[x.platform] || 0) + 1;
  const closing = items.filter((x) => status(x, now) === 'closing').length;
  const upcoming = items.filter((x) => status(x, now) === 'upcoming').length;
  const hasFilter = Boolean(filtersToQuery(f));

  paint(mount('list', f, '#/', viewList), `
    ${categoryBar(f, pool, '#/')}
    <div class="filters">
      <div class="group"><span class="label">平台</span>
        ${Object.entries(PLATFORMS).filter(([k]) => pfCounts[k]).map(([k, p]) => chip('platforms', k, `${p.short} ${pfCounts[k]}`, f.platforms.includes(k), `pf-${p.cls}`)).join('')}
      </div>
      <div class="group"><span class="label">狀態</span>
        <select class="sel" data-field="status" aria-label="狀態">
          ${[['live', '開團中'], ['closing', '48 小時內結單'], ['upcoming', '即將開團'], ['all', '全部（含已結單）']].map(([v, l]) => `<option value="${v}" ${f.status === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        ${chip('hasClose', 'true', '有寫結單日', f.hasClose)}
        ${chip('hasPrice', 'true', '有標價', f.hasPrice)}
      </div>
    </div>
    <div class="toolbar">
      <div class="stats"><span><b class="num">${list.length}</b> 筆</span>${closing ? `<a href="#/?status=closing" class="muted">48 小時內結單 ${closing}</a>` : ''}${upcoming ? `<a href="#/?status=upcoming" class="muted">即將開團 ${upcoming}</a>` : ''}${data.meta?.generatedAt ? `<span class="muted">更新於 ${esc(fmtTime(data.meta.generatedAt))}</span>` : ''}</div>
      <div class="row">
        <select class="sel" data-field="sort" aria-label="排序">
          ${[['closing', '即將結單優先'], ['new', '最新發文'], ['open', '開團時間'], ['price', '價格低 → 高']].map(([v, l]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        ${hasFilter ? `<a class="btn" href="#/">清除篩選</a>` : ''}
      </div>
    </div>
    ${list.length ? `<div class="grid">${list.slice(0, shown).map((x) => card(x, now, f.q)).join('')}</div>` : emptyState(hasFilter)}
    ${list.length > shown ? `<button class="btn more-btn" id="more">再顯示 ${Math.min(PAGE, list.length - shown)} 筆（共 ${list.length}）</button>` : ''}
  `);
  bindFilters(f, '#/', viewList);
  document.getElementById('more')?.addEventListener('click', () => {
    shown += PAGE;
    viewList(filtersToQuery(f));
  });
}

// ---------- 結單時間軸 ----------
function viewCalendar(qs) {
  const f = queryToFilters(qs);
  const now = nowStamp();
  const pool = allItems().filter((x) => status(x, now) !== 'closed' && matchesQuery(x, f.q) && (!f.platforms.length || f.platforms.includes(x.platform)));
  const groups = timeline(pool.filter((x) => !f.category || x.category === f.category), now);
  const row = (it) => {
    const pf = PLATFORMS[it.platform] || { short: it.platform, cls: 'web' };
    const st = status(it, now);
    const t = st === 'upcoming' ? (it.openAt.length > 10 ? it.openAt.slice(11) : '開團') : it.closeAt ? (it.closeAt.length > 10 ? it.closeAt.slice(11) : '全天') : '—';
    return `<a class="tl-row" href="${safeUrl(it.url) || '#/calendar'}" target="_blank" rel="noopener">
      <span class="tl-time">${esc(t)}</span>
      <span class="tl-main"><b>${hl(it.product, f.q)}</b><span><span class="pf-text">${esc(pf.short)} · </span>${categoryIcon(it.category)} ${esc(it.category)}${it.authorName || it.author ? ` · ${esc(it.authorName || `@${it.author}`)}` : ''}${it.price ? ` · ${fmtPrice(it.price)}` : ''}</span></span>
      <span class="tl-side"><span class="badge pf pf-${pf.cls}">${esc(pf.short)}</span></span>
    </a>`;
  };
  paint(mount('calendar', f, '#/calendar', viewCalendar), `
    ${categoryBar(f, pool, '#/calendar')}
    ${groups.length ? groups.map((g) => `<section class="tl-group ${g.title.startsWith('今天') ? 'today' : ''}"><h2>${esc(g.title)} <small>${g.items.length} 筆</small></h2><div class="tl-list">${g.items.map(row).join('')}</div></section>`).join('') : emptyState(Boolean(f.q || f.category))}
    <p class="muted" style="font-size:12px">時間軸只列還沒結單的團；點一列開原文。想在結單前被提醒，可在「團購」卡片按「📅 提醒」加到 Google 日曆。</p>
  `);
  bindFilters(f, '#/calendar', viewCalendar);
}

// ---------- 我的團購 ----------
let draft = null;
function viewMine() {
  const now = nowStamp();
  const saved = mine.savedItems().sort((a, b) => (a.closeAt || '9999').localeCompare(b.closeAt || '9999'));
  const added = mine.addedItems();
  const field = (label, html, wide = false) => `<label class="field ${wide ? 'wide' : ''}"><span>${label}</span>${html}</label>`;
  const d = draft || {};
  const toLocal = (s) => (!s ? '' : s.length === 10 ? `${s}T23:59` : s.replace(' ', 'T'));
  $main.innerHTML = `
    <section class="panel">
      <h2>貼上開團文，自動整理</h2>
      <p class="muted" style="margin-top:0">在 IG、FB 社團、LINE 社群看到的開團文，整段複製貼上，系統會抓出商品、價格、開團與結單時間、分類；確認後存到這台裝置。</p>
      <form id="p-form" class="form">
        ${field('貼文內容 *', `<textarea name="text" rows="6" required placeholder="例：【限時團購】Combi 嬰兒推車 團購價 $8,990（原價 $12,800）開團時間 10/20 20:00 ~ 10/26 23:59">${esc(d.text || '')}</textarea>`, true)}
        ${field('原文網址', `<input name="url" type="url" value="${esc(d.url || '')}" placeholder="https://www.instagram.com/p/…" />`, true)}
        <div class="form-actions"><button class="btn primary" type="submit">解析</button>${draft ? '<button class="btn" type="button" id="p-clear">清除</button>' : ''}</div>
      </form>
      ${draft ? `<form id="d-form" class="form preview">
        ${field('商品 *', `<input name="product" required value="${esc(d.product || '')}" />`, true)}
        ${field('分類', `<select name="category">${CATEGORY_KEYS.map((k) => `<option ${d.category === k ? 'selected' : ''}>${k}</option>`).join('')}</select>`)}
        ${field('團購價 NT$', `<input name="price" type="number" min="0" value="${d.price ?? ''}" />`)}
        ${field('開團時間', `<input name="openAt" type="datetime-local" value="${esc(toLocal(d.openAt))}" />`)}
        ${field('結單時間', `<input name="closeAt" type="datetime-local" value="${esc(toLocal(d.closeAt))}" />`)}
        ${field('團主', `<input name="authorName" value="${esc(d.authorName || '')}" placeholder="例：初六媽" />`)}
        ${field('下單連結', `<input name="orderUrl" type="url" value="${esc(d.orderUrl || '')}" />`)}
        <div class="form-actions"><button class="btn primary" type="submit">加入我的團購</button><span class="muted">${d.isGroupBuy ? '看起來是開團文' : '不太像開團文，請確認欄位'}</span></div>
      </form>` : ''}
    </section>
    <div class="toolbar">
      <div class="stats"><span><b class="num">${saved.length}</b> 個收藏</span><span><b class="num">${added.length}</b> 筆自己加的</span></div>
      <div class="row">
        <button class="btn" id="m-export">匯出備份</button>
        <label class="btn">匯入備份<input type="file" id="m-import" accept="application/json" hidden /></label>
      </div>
    </div>
    <h2 style="font-size:16px">收藏的團購</h2>
    ${saved.length ? `<div class="grid">${saved.map((x) => card(x, now)).join('')}</div>` : `<div class="empty"><b>還沒有收藏</b>在團購卡片按「☆ 收藏」，結單前都排在這裡。</div>`}
    <h2 style="font-size:16px;margin-top:18px">自己加的團購</h2>
    ${added.length ? `<div class="grid">${added.map((x) => card(x, now)).join('')}</div>` : `<div class="empty"><b>還沒有自己加的團購</b>用上方「貼上開團文」新增。</div>`}
  `;
  document.getElementById('p-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const text = String(fd.get('text') || '').trim();
    const url = String(fd.get('url') || '').trim();
    const r = parsePost({ text, ref: taipeiStamp() });
    draft = { ...r, text, url };
    viewMine();
    document.getElementById('d-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.getElementById('p-clear')?.addEventListener('click', () => {
    draft = null;
    viewMine();
  });
  document.getElementById('d-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const g = (k) => String(fd.get(k) || '').trim();
    const fromLocal = (s) => (s ? s.replace('T', ' ').slice(0, 16) : null);
    mine.upsertAdded({
      product: g('product'),
      category: g('category'),
      price: g('price') ? Number(g('price')) : null,
      priceText: draft.priceText,
      openAt: fromLocal(g('openAt')),
      closeAt: fromLocal(g('closeAt')),
      authorName: g('authorName') || null,
      orderUrl: g('orderUrl') || draft.orderUrl || null,
      url: draft.url || g('orderUrl') || location.href.split('#')[0],
      excerpt: draft.excerpt,
      tags: draft.tags || [],
      firstSeenAt: new Date().toISOString(),
    });
    draft = null;
    toast('已加入我的團購');
    viewMine();
  });
  document.getElementById('m-export').addEventListener('click', () => {
    const blob = new Blob([mine.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `groupbuy-radar-${now.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('m-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      toast(`已匯入 ${mine.importJson(await file.text())} 筆`);
      viewMine();
    } catch (err) {
      toast(`匯入失敗：${err.message}`);
    }
  });
}

// ---------- 來源與追蹤 ----------
const SOURCE_NAMES = { threads: 'Threads', search: '搜尋引擎（IG／FB／Threads）', pages: '團媽網站', instagram: 'Instagram 官方 API', manual: '精選' };
function viewSources() {
  const m = data.meta;
  const rows = Object.entries(m?.sources || {});
  const w = data.watch || {};
  const list = (arr, fmt) => (arr?.length ? `<ul class="list">${arr.map(fmt).join('')}</ul>` : '<p class="muted" style="margin:4px 0">（尚未設定）</p>');
  const stat = (s) => (s.skipped ? '<span class="skip">未啟用</span>' : s.ok ? '<span class="ok">正常</span>' : '<span class="err">失敗</span>');
  $main.innerHTML = `
    <section class="panel">
      <h2>資料來源</h2>
      <p class="muted" style="margin-top:0">GitHub Actions 每 2 小時跑一次；某個來源失敗時保留上一次的資料。社群搜尋每次只看得到一小段，資料會累積到結單（沒寫結單日的保留 10 天）。</p>
      ${rows.length ? `<div class="table-wrap"><table>
        <thead><tr><th>來源</th><th>狀態</th><th>筆數</th><th>本次新抓</th><th>最後成功</th><th>說明</th></tr></thead>
        <tbody>${rows.map(([k, s]) => `<tr>
          <td><b>${esc(SOURCE_NAMES[k] || k)}</b></td><td class="nowrap">${stat(s)}</td><td class="num">${s.count ?? 0}</td><td class="num">${s.fresh ?? '—'}</td>
          <td class="num">${esc(fmtTime(s.updatedAt))}</td>
          <td class="muted">${esc(s.error || s.note || '')}${s.skipped ? '（未設定金鑰，略過）' : ''}</td></tr>`).join('')}</tbody>
      </table></div>` : `<div class="notice">尚未產生資料狀態檔（data/meta.json）。排程第一次執行後就會出現。</div>`}
    </section>
    <section class="panel">
      <h2>追蹤清單</h2>
      <p class="muted" style="margin-top:0">想固定追某位團媽，把帳號或網站加到 <a href="${REPO}/edit/main/groupbuy/data/watchlist.json" target="_blank" rel="noopener"><code>groupbuy/data/watchlist.json</code></a>（GitHub 網頁直接編輯、Commit 即可），下一次排程就會開始抓。</p>
      <div class="form">
        <div class="field"><span>Threads 帳號（${w.threads?.length || 0}）</span>${list(w.threads, (u) => `<li><a href="https://www.threads.com/@${esc(u)}" target="_blank" rel="noopener">@${esc(u)}</a></li>`)}</div>
        <div class="field"><span>Instagram 帳號（${w.instagram?.length || 0}，需官方 API）</span>${list(w.instagram, (u) => `<li><a href="https://www.instagram.com/${esc(u)}/" target="_blank" rel="noopener">@${esc(u)}</a></li>`)}</div>
        <div class="field"><span>團媽網站（${w.pages?.length || 0}）</span>${list(w.pages, (p) => `<li><a href="${safeUrl(p.url)}" target="_blank" rel="noopener">${esc(p.name || p.url)}</a></li>`)}</div>
        <div class="field wide"><span>搜尋關鍵字（每次排程輪替）</span><div class="kw">${[...(w.keywords?.threads || []).map((k) => `Threads：${k}`), ...(w.keywords?.search || [])].map((k) => `<span class="badge">${esc(k)}</span>`).join('') || '<span class="muted">（使用預設）</span>'}</div></div>
      </div>
    </section>
    <section class="panel">
      <h2>各平台怎麼抓、有什麼限制</h2>
      <ul class="list">
        <li><b>Threads</b>：未登入的公開搜尋，每次排程只能搜 1 個關鍵字（之後會被限流），所以輪流搜、累積結果；追蹤帳號另外抓最新貼文。在 repo Secrets 設定 <code>THREADS_ACCESS_TOKEN</code>（官方 API，需申請 threads_keyword_search 權限）後，每次可搜 5 組。</li>
        <li><b>Instagram</b>：未登入會被擋，改從搜尋引擎（DuckDuckGo 近一週）找公開的開團貼文，每次 2 組關鍵字。要固定追特定團媽，設定 <code>IG_ACCESS_TOKEN</code>＋<code>IG_USER_ID</code>（官方 Business Discovery API，需自己的 IG 專業帳號）。</li>
        <li><b>Facebook</b>：社團與粉專需要登入、官方 API 不開放社團，只能從搜尋引擎找到少量公開貼文；FB 社團、LINE 社群的團，請用「我的團購」貼上。</li>
        <li><b>團媽網站</b>：Strikingly、Portaly、部落格上的開團日曆，每次整頁重抓。</li>
        <li>只讀公開頁面、不登入、每次請求間隔數秒；商品圖片不轉存，點「看原文」回到團主頁面。</li>
      </ul>
    </section>
    <section class="panel">
      <h2>判斷規則</h2>
      <ul class="list">
        <li>開團文：有「開團／團購價／收單／結單／下單連結／價格」等字樣才收；找廠商、找團品、抱怨文、香港與中國的貼文不收。</li>
        <li>時間：認得「10/20(一) 20:00 ~ 10/26 23:59」「即日起至10/31」「10/23收單」「今晚8點開團」「限時3天」「這週日結單」，以發文日推年份；出貨日不算。</li>
        <li>狀態：開團日在未來 = 即將開團；結單前 48 小時內 = 即將結單；過了結單時間 = 已結單。沒寫結單日的顯示「結單日見原文」。</li>
        <li>分類：品牌字典（Combi→育兒、Dyson→家電…）加關鍵字計分，以最長的字為準（「氣炸鍋」算家電，不算「鍋」）；分錯時可用搜尋補足。</li>
      </ul>
    </section>`;
}

// ---------- 路由 ----------
function render() {
  const [path, qs = ''] = location.hash.replace(/^#/, '').split('?');
  const route = path.replace(/^\//, '') || 'list';
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === route));
  if (route === 'calendar') viewCalendar(qs);
  else if (route === 'mine') viewMine();
  else if (route === 'sources') viewSources();
  else viewList(qs);
}

$main.addEventListener('click', (e) => {
  const s = e.target.closest('[data-save]');
  if (s) {
    const it = allItems().find((x) => x.id === s.dataset.save) || mine.savedItems().find((x) => x.id === s.dataset.save);
    if (!it) return;
    const on = mine.toggleSave(it);
    s.setAttribute('aria-pressed', on);
    s.textContent = on ? '★ 已收藏' : '☆ 收藏';
    toast(on ? '已收藏，到「我的團購」查看' : '已取消收藏');
    return;
  }
  // 刪除要按兩次（內嵌瀏覽器常擋 confirm 對話框）
  const r = e.target.closest('[data-remove]');
  if (!r) return;
  if (r.dataset.armed) {
    mine.removeAdded(r.dataset.remove);
    toast('已刪除');
    render();
    return;
  }
  r.dataset.armed = '1';
  r.textContent = '再按一次刪除';
  setTimeout(() => {
    if (!r.isConnected) return;
    delete r.dataset.armed;
    r.textContent = '刪除';
  }, 3000);
});

let lastRoute = '';
window.addEventListener('hashchange', () => {
  const route = location.hash.split('?')[0];
  if (route !== lastRoute) {
    shown = PAGE;
    window.scrollTo(0, 0);
  }
  lastRoute = route;
  render();
});

lastRoute = location.hash.split('?')[0];
render();
load();
