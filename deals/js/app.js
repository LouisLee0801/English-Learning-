import {
  SOURCES, KINDS, REWARD_TYPES, todayStr, status, daysLeft, activeBoost, effectiveRate,
  filterDeals, compareByBrand, filtersToQuery, queryToFilters, brandKey,
} from './core.js';
import { CATEGORIES, CATEGORY_KEYS, categoryIcon, classify } from './categories.js';
import * as wallet from './wallet.js';

const $main = document.getElementById('main');
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const PAGE = 60;

const data = { deals: [], meta: null, loaded: false, error: null };
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
    const files = data.meta?.files || ['line.json', 'eva.json', 'cathay.json', 'manual.json'];
    const parts = await Promise.all(files.map((f) => getJson(`data/${f}`).catch(() => ({ deals: [] }))));
    data.deals = parts.flatMap((p) => p.deals || []);
    for (const d of data.deals) if (!CATEGORY_KEYS.includes(d.category)) d.category = classify(d);
    buildRebateIndex();
  } catch (e) {
    data.error = e.message;
  }
  data.loaded = true;
  render();
}

const allDeals = () => [...data.deals, ...wallet.myDeals().map((d) => ({ ...d, category: CATEGORY_KEYS.includes(d.category) ? d.category : classify(d) }))];

// 品牌 → 三個回饋平台的最佳回饋，用來在優惠券上提示「結帳先走哪個平台」
let rebateIndex = new Map();
let rebateKeys = [];
function buildRebateIndex() {
  const rows = compareByBrand(data.deals, todayStr(), wallet.getMileValue());
  rebateIndex = new Map(rows.map((r) => [r.key, r]));
  rebateKeys = rows.map((r) => r.key).filter((k) => k.length >= 2);
}
function rebatesFor(merchant) {
  const k = brandKey(merchant);
  if (!k || k.length < 2) return null;
  if (rebateIndex.has(k)) return rebateIndex.get(k);
  // 「全家」對「全家便利」這類：較短的一方是另一方的開頭（中文至少 2 字、英文至少 4 字）
  const min = /^[a-z0-9]+$/.test(k) ? 4 : 2;
  if (k.length < min) return null;
  const hit = rebateKeys.find((x) => x.length >= min && (x.startsWith(k) || k.startsWith(x)));
  return hit ? rebateIndex.get(hit) : null;
}
function portalHint(d, today, mileValue) {
  if (d.kind === 'rebate') return '';
  const r = rebatesFor(d.merchant);
  if (!r) return '';
  const parts = PORTALS.filter((s) => r.by[s]).map((s) => {
    const x = r.by[s];
    const rw = activeBoost(x, today) || x.reward;
    const txt = rw.type === 'miles' ? `${fmtNum(rw.value)} 哩/百元` : rw.type === 'miles_fixed' ? `每筆 ${fmtNum(rw.value)} 哩` : `${fmtNum(rw.value)}%`;
    return `<a href="${esc(x.url)}" target="_blank" rel="noopener" class="${r.best === s ? 'best' : ''}">${SOURCES[s].short} ${txt}</a>`;
  });
  return `<div class="hint">結帳前先走：${parts.join(' · ')}</div>`;
}

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

const fmtDate = (s) => (!s ? '' : s.slice(0, 4) === todayStr().slice(0, 4) ? s.slice(5).replace('-', '/') : s.replaceAll('-', '/'));
const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
const fmtNum = (n) => (Number.isInteger(n) ? n.toLocaleString('zh-TW') : n.toFixed(2).replace(/\.?0+$/, ''));

function rewardHtml(r) {
  if (!r) return '';
  const v = typeof r.value === 'number' ? fmtNum(r.value) : '';
  switch (r.type) {
    case 'percent': return `<span class="big">${v}%</span>`;
    case 'percent_off': return `<span class="big">${v}%</span><span class="unit">off</span>`;
    case 'miles': return `<span class="big">${v}</span><span class="unit">哩 / NT$100</span>`;
    case 'miles_fixed': return `<span class="big">${v}</span><span class="unit">哩 / 每筆</span>`;
    case 'amount':
      if (r.unit === '點') return `<span class="big">${v}</span><span class="unit">點 LINE POINTS</span>`;
      if (r.unit === '省') return `<span class="unit">省</span><span class="big">$${v}</span>`;
      return `<span class="big">$${v}</span><span class="unit">折抵</span>`;
    case 'shipping': return `<span class="big">免運</span>`;
    default: return `<span class="big">${esc(r.text || '優惠')}</span>`;
  }
}

function dueHtml(d, today) {
  const st = status(d, today);
  if (st === 'upcoming') return `<span class="due upcoming">${fmtDate(d.startAt)} 開始</span>`;
  if (st === 'expired') return `<span class="due ending">已過期</span>`;
  const left = daysLeft(d, today);
  if (left === null) return `<span class="due long">${d.kind === 'rebate' ? '長期' : '未標示期限'}</span>`;
  if (left === 0) return `<span class="due ending">今天截止</span>`;
  return `<span class="due ${st === 'ending' ? 'ending' : ''}">剩 ${left} 天 · ${fmtDate(d.endAt)}</span>`;
}

const NUMERIC = new Set(['percent', 'percent_off', 'miles', 'miles_fixed', 'amount']);

function card(d, today, mileValue) {
  if (d.kind !== 'rebate') return couponCard(d, today, mileValue);
  const src = SOURCES[d.source] || { name: d.source };
  const boost = activeBoost(d, today);
  const eq = effectiveRate(d, today, mileValue);
  const conds = d.conditions || [];
  const st = status(d, today);
  const extra = [d.minSpend ? `低消 NT$${fmtNum(d.minSpend)}` : '', ...(d.tags || [])].filter(Boolean);
  return `<article class="card ${st}">
    <div class="card-top">
      <div class="badges">
        <span class="badge src src-${esc(d.source)}">${esc(src.name)}</span>
        ${d.category ? `<span class="badge">${categoryIcon(d.category)} ${esc(d.category)}</span>` : ''}
        ${d.kind && d.kind !== 'rebate' ? `<span class="badge">${esc(KINDS[d.kind] || d.kind)}</span>` : ''}
      </div>
      ${dueHtml(d, today)}
    </div>
    <div class="merchant">
      ${d.logo ? `<img src="${esc(d.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : ''}
      <div style="min-width:0">
        <h3 title="${esc(d.merchant)}">${esc(d.merchant)}</h3>
        ${d.title ? `<div class="sub">${esc(d.title)}</div>` : ''}
      </div>
    </div>
    <div class="reward">
      ${boost ? `${rewardHtml({ ...d.reward, ...boost })}<s>${esc(d.reward?.text || '')}</s>` : rewardHtml(d.reward)}
      ${boost ? `<span class="boost">加碼${boost.endAt ? ` 至 ${fmtDate(boost.endAt)}` : ''}</span>` : ''}
    </div>
    ${d.reward?.type === 'miles' ? `<div class="eq">≈ ${fmtNum(eq)}% 等值回饋（1 哩 = NT$${mileValue}）</div>` : ''}
    ${extra.length ? `<div class="badges">${extra.map((t) => `<span class="badge">${esc(t)}</span>`).join('')}</div>` : ''}
    ${portalHint(d, today, mileValue)}
    ${conds.length ? `<details><summary>條件 ${conds.length} 項</summary><ul class="conds">${conds.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></details>` : ''}
    <div class="card-actions">
      ${d.code ? `<button class="btn code" data-copy="${esc(d.code)}" title="複製折扣碼">${esc(d.code)} ⧉</button>` : ''}
      ${d.source === 'mine' ? `<a class="btn" href="#/wallet?edit=${encodeURIComponent(d.id)}">編輯</a>` : ''}
      ${d.url ? `<a class="btn primary" href="${esc(d.url)}" target="_blank" rel="noopener">前往 →</a>` : ''}
    </div>
  </article>`;
}

/** 優惠券／活動：標題就是優惠內容；有金額、折數才放大顯示 */
function couponCard(d, today, mileValue) {
  const src = SOURCES[d.source] || { name: d.source };
  const conds = d.conditions || [];
  const st = status(d, today);
  const r = d.reward || {};
  const numeric = NUMERIC.has(r.type) && typeof r.value === 'number';
  const extra = [d.minSpend ? `低消 NT$${fmtNum(d.minSpend)}` : '', ...(d.tags || [])].filter(Boolean);
  return `<article class="card coupon ${st}">
    <div class="card-top">
      <div class="badges">
        <span class="badge src src-${esc(d.source)}">${esc(src.name)}</span>
        ${d.category ? `<span class="badge">${categoryIcon(d.category)} ${esc(d.category)}</span>` : ''}
      </div>
      ${dueHtml(d, today)}
    </div>
    <div class="merchant">
      ${d.logo ? `<img src="${esc(d.logo)}" alt="" loading="lazy" referrerpolicy="no-referrer" />` : ''}
      <div style="min-width:0">
        <div class="sub">${esc(d.merchant)}${d.publishedAt ? ` · ${fmtTime(d.publishedAt)}` : ''}</div>
        <h3 class="deal-title" title="${esc(d.title)}">${esc(d.title || d.merchant)}</h3>
      </div>
    </div>
    ${numeric ? `<div class="reward">${rewardHtml(r)}</div>` : r.text && !/^優惠(活動)?$/.test(r.text) ? `<div><span class="pill">${esc(r.text)}</span></div>` : ''}
    ${extra.length ? `<div class="badges">${extra.map((t) => `<span class="badge">${esc(t)}</span>`).join('')}</div>` : ''}
    ${portalHint(d, today, mileValue)}
    ${conds.length ? `<details><summary>條件與說明 ${conds.length} 項</summary><ul class="conds">${conds.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></details>` : ''}
    <div class="card-actions">
      ${d.code ? `<button class="btn code" data-copy="${esc(d.code)}" title="複製折扣碼">${esc(d.code)} ⧉</button>` : ''}
      ${d.source === 'mine' ? `<a class="btn" href="#/wallet?edit=${encodeURIComponent(d.id)}">編輯</a>` : ''}
      ${d.url ? `<a class="btn primary" href="${esc(d.url)}" target="_blank" rel="noopener">${d.source === 'news' || d.source === 'ptt' ? '看原文' : '前往'} →</a>` : ''}
    </div>
  </article>`;
}

function chip(group, value, label, on, dotClass = '') {
  return `<button type="button" class="chip" data-group="${group}" data-value="${esc(value)}" aria-pressed="${on}">${dotClass ? `<span class="dot ${dotClass}"></span>` : ''}${esc(label)}</button>`;
}

function emptyState() {
  if (!data.loaded) return `<div class="empty"><b>載入中…</b></div>`;
  if (!data.deals.length)
    return `<div class="empty"><b>還沒有抓到資料</b>排程每天早上 6 點自動更新；也可以先到「我的券夾」新增手上的券。<br/><a href="#/status">查看資料狀態 →</a></div>`;
  return `<div class="empty"><b>沒有符合條件的優惠</b>試著放寬篩選或清除搜尋。</div>`;
}

// ---------- 優惠券／回饋平台（同一個清單元件，兩種模式） ----------
const PORTALS = ['line', 'eva', 'cathay'];
const MODES = {
  coupons: { path: '#/', sort: 'new', pick: (d) => d.kind !== 'rebate', placeholder: '搜尋品牌、優惠、折扣碼…（例：屈臣氏、買一送一、免運）' },
  portals: { path: '#/portals', sort: 'rate', pick: (d) => d.kind === 'rebate', placeholder: '搜尋商店（例：momo、Agoda、Nike）' },
};
const SORTS = {
  coupons: [['new', '最新上架'], ['ending', '即將到期優先'], ['rate', '折扣高 → 低'], ['brand', '品牌名稱']],
  portals: [['rate', '回饋高 → 低'], ['ending', '加碼即將結束'], ['brand', '品牌名稱'], ['updated', '最近更新']],
};

function categoryBar(f, live) {
  const counts = new Map();
  for (const d of live) counts.set(d.category, (counts.get(d.category) || 0) + 1);
  const items = CATEGORIES.filter((c) => counts.get(c.key));
  return `<div class="catbar" role="tablist" aria-label="分類">
    <button type="button" class="cat" data-cat="" aria-pressed="${!f.category}"><span>全部</span><b>${live.length}</b></button>
    ${items.map((c) => `<button type="button" class="cat" data-cat="${esc(c.key)}" aria-pressed="${f.category === c.key}"><span>${c.icon} ${esc(c.key)}</span><b>${counts.get(c.key)}</b></button>`).join('')}
  </div>`;
}

function viewList(qs, mode = 'coupons') {
  const M = MODES[mode];
  const f = queryToFilters(qs, M.sort);
  const today = todayStr();
  const mileValue = wallet.getMileValue();
  const deals = allDeals().filter(M.pick);
  const list = filterDeals(deals, f, today, mileValue);
  const live = deals.filter((d) => ['active', 'ending'].includes(status(d, today)));
  const liveInSources = live.filter((d) => !f.sources.length || f.sources.includes(d.source));
  const counts = {};
  for (const d of live) counts[d.source] = (counts[d.source] || 0) + 1;
  const sourceKeys = mode === 'portals' ? PORTALS : Object.keys(SOURCES).filter((k) => counts[k] || k === 'mine');
  const on = (arr, v) => arr.includes(v);
  const ending = list.filter((d) => status(d, today) === 'ending').length;
  const boosted = list.filter((d) => activeBoost(d, today)).length;
  const moreOpen = f.kinds.length || f.rewardTypes.length || f.boostOnly || f.codeOnly || f.noNewbie || f.maxMinSpend != null;

  $main.innerHTML = `
    <form class="search" id="q-form" role="search">
      <input id="q" type="search" placeholder="${M.placeholder}" value="${esc(f.q)}" autocomplete="off" />
    </form>
    ${categoryBar(f, liveInSources)}
    <div class="filters">
      <div class="group"><span class="label">來源</span>
        ${sourceKeys.map((k) => chip('sources', k, `${SOURCES[k].short} ${counts[k] || 0}`, on(f.sources, k), `src-${k}`)).join('')}
      </div>
      <div class="group"><span class="label">狀態</span>
        <select class="sel" data-field="status">
          ${[['live', '進行中'], ['ending', '7 天內到期'], ['upcoming', '尚未開始'], ['all', '全部（含過期）']].map(([v, l]) => `<option value="${v}" ${f.status === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </div>
    </div>
    <details class="more" ${moreOpen ? 'open' : ''}>
      <summary>＋ 更多篩選</summary>
      <div class="filters">
        ${mode === 'coupons' ? `<div class="group"><span class="label">類型</span>${['coupon', 'promo'].map((k) => chip('kinds', k, KINDS[k], on(f.kinds, k))).join('')}</div>` : ''}
        <div class="group"><span class="label">形式</span>${Object.entries(REWARD_TYPES)
          .filter(([k]) => (mode === 'portals' ? ['percent', 'miles', 'miles_fixed'] : ['amount', 'percent_off', 'shipping', 'gift']).includes(k))
          .map(([k, l]) => chip('rewardTypes', k, l, on(f.rewardTypes, k)))
          .join('')}</div>
        <div class="group">
          ${mode === 'portals' ? chip('boostOnly', 'true', '只看加碼中', f.boostOnly) : chip('codeOnly', 'true', '有折扣碼', f.codeOnly)}
          ${chip('noNewbie', 'true', '排除新客限定', f.noNewbie)}
        </div>
        ${mode === 'coupons' ? `<div class="group"><span class="label">低消上限 NT$</span>
          <input class="sel" type="number" min="0" step="100" inputmode="numeric" data-field="maxMinSpend" value="${f.maxMinSpend ?? ''}" placeholder="不限" />
        </div>` : `<div class="group"><span class="label">1 哩價值 NT$</span>
          <input class="sel" type="number" min="0.1" step="0.05" inputmode="decimal" id="mile-value" value="${mileValue}" />
        </div>`}
      </div>
    </details>
    <div class="toolbar">
      <div class="stats"><span><b class="num">${list.length}</b> 筆</span>${boosted ? `<span>加碼中 ${boosted}</span>` : ''}${ending ? `<span>7 天內到期 ${ending}</span>` : ''}${data.meta?.generatedAt ? `<span class="muted">更新於 ${esc(fmtTime(data.meta.generatedAt))}</span>` : ''}</div>
      <div class="row">
        <select class="sel" data-field="sort" aria-label="排序">
          ${SORTS[mode].map(([v, l]) => `<option value="${v}" ${f.sort === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        ${filtersToQuery(f, M.sort) ? `<a class="btn" href="${M.path}">清除篩選</a>` : ''}
      </div>
    </div>
    ${list.length ? `<div class="grid">${list.slice(0, shown).map((d) => card(d, today, mileValue)).join('')}</div>` : emptyState()}
    ${list.length > shown ? `<button class="btn more-btn" id="more">再顯示 ${Math.min(PAGE, list.length - shown)} 筆（共 ${list.length}）</button>` : ''}
  `;

  const rerender = (q) => viewList(q, mode);
  const update = (patch) => {
    shown = PAGE;
    const q = filtersToQuery({ ...f, ...patch }, M.sort);
    history.replaceState(null, '', q ? `${M.path}?${q}` : M.path);
    rerender(q);
  };
  const qInput = document.getElementById('q');
  let timer;
  qInput.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const pos = qInput.selectionStart;
      update({ q: qInput.value.trim() });
      const el = document.getElementById('q');
      el.focus();
      el.setSelectionRange(pos, pos);
    }, 250);
  });
  document.getElementById('q-form').addEventListener('submit', (e) => e.preventDefault());
  $main.querySelectorAll('.cat').forEach((b) => b.addEventListener('click', () => update({ category: b.dataset.cat })));
  $main.querySelectorAll('.chip').forEach((b) =>
    b.addEventListener('click', () => {
      const { group, value } = b.dataset;
      if (typeof f[group] === 'boolean') return update({ [group]: !f[group] });
      const arr = f[group].includes(value) ? f[group].filter((x) => x !== value) : [...f[group], value];
      update({ [group]: arr });
    }),
  );
  $main.querySelectorAll('[data-field]').forEach((el) =>
    el.addEventListener('change', () => {
      const k = el.dataset.field;
      update({ [k]: k === 'maxMinSpend' ? (el.value === '' ? null : Number(el.value)) : el.value });
    }),
  );
  document.getElementById('mile-value')?.addEventListener('change', (e) => {
    wallet.setMileValue(Number(e.target.value));
    rerender(filtersToQuery(f, M.sort));
  });
  document.getElementById('more')?.addEventListener('click', () => {
    shown += PAGE;
    rerender(filtersToQuery(f, M.sort));
  });
}

// ---------- 品牌比較 ----------
function viewCompare(qs) {
  const p = new URLSearchParams(qs);
  const q = (p.get('q') || '').trim().toLowerCase();
  const multi = p.get('multi') === 'true';
  const today = todayStr();
  const mileValue = wallet.getMileValue();
  const portals = ['line', 'eva', 'cathay'];
  let rows = compareByBrand(data.deals, today, mileValue);
  const total = rows.length;
  if (multi) rows = rows.filter((r) => r.count > 1);
  if (q) rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.key.includes(q.replace(/\s+/g, '')));
  rows.sort((a, b) => b.count - a.count || b.bestRate - a.bestRate);
  const cell = (r, s) => {
    const d = r.by[s];
    if (!d) return `<td class="muted">—</td>`;
    const b = activeBoost(d, today);
    const rw = b ? { ...d.reward, ...b } : d.reward;
    const txt =
      rw.type === 'miles' ? `${fmtNum(rw.value)} 哩/百元` : rw.type === 'miles_fixed' ? `每筆 ${fmtNum(rw.value)} 哩` : rw.type === 'percent' ? `${fmtNum(rw.value)}%` : esc(rw.text || '');
    const eq = rw.type === 'miles' ? ` <span class="muted">≈${fmtNum(effectiveRate(d, today, mileValue))}%</span>` : '';
    return `<td class="${r.best === s && r.count > 1 ? 'best' : ''}"><a href="${esc(d.url || '#')}" target="_blank" rel="noopener"><span class="rate">${txt}</span>${eq}${b ? ' <span class="boost">加碼</span>' : ''}</a></td>`;
  };
  $main.innerHTML = `
    <form class="search" id="c-form" role="search">
      <input id="cq" type="search" placeholder="搜尋品牌（例：Apple、Agoda、Nike）" value="${esc(p.get('q') || '')}" autocomplete="off" />
    </form>
    <div class="toolbar">
      <div class="stats"><span><b class="num">${rows.length}</b> / ${total} 個品牌</span><span>黃底 = 該品牌目前最划算的平台</span></div>
      <div class="row">
        ${chip('multi', 'true', '只看 2 個以上平台都有', multi)}
        <span class="label muted">1 哩 = NT$</span><input class="sel" type="number" min="0.1" step="0.05" id="mile-value" value="${mileValue}" />
      </div>
    </div>
    ${rows.length ? `<div class="table-wrap"><table>
      <thead><tr><th>品牌</th><th>分類</th>${portals.map((s) => `<th>${SOURCES[s].name}</th>`).join('')}</tr></thead>
      <tbody>${rows.slice(0, 500).map((r) => `<tr><td><b>${esc(r.name)}</b></td><td class="muted">${esc(r.category || '')}</td>${portals.map((s) => cell(r, s)).join('')}</tr>`).join('')}</tbody>
    </table></div>` : emptyState()}
  `;
  const go = (patch) => {
    const n = new URLSearchParams({ ...(q ? { q: p.get('q') } : {}), ...(multi ? { multi: 'true' } : {}), ...patch });
    for (const [k, v] of [...n]) if (!v || v === 'false') n.delete(k);
    history.replaceState(null, '', `#/compare${n.toString() ? `?${n}` : ''}`);
    viewCompare(n.toString());
  };
  const input = document.getElementById('cq');
  let t;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      go({ q: input.value.trim() });
      const el = document.getElementById('cq');
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }, 250);
  });
  document.getElementById('c-form').addEventListener('submit', (e) => e.preventDefault());
  $main.querySelector('.chip[data-group="multi"]').addEventListener('click', () => go({ multi: multi ? '' : 'true' }));
  document.getElementById('mile-value').addEventListener('change', (e) => {
    wallet.setMileValue(Number(e.target.value));
    viewCompare(qs);
  });
}

// ---------- 我的券夾 ----------
function viewWallet(qs) {
  const editId = new URLSearchParams(qs).get('edit');
  const c = (editId && wallet.getCoupon(editId)) || {};
  const r = c.reward || {};
  const today = todayStr();
  const mine = wallet.myDeals().sort((a, b) => (a.endAt || '9999').localeCompare(b.endAt || '9999'));
  const field = (name, label, html, wide = false) => `<label class="field ${wide ? 'wide' : ''}"><span>${label}</span>${html}</label>`;
  $main.innerHTML = `
    <section class="panel">
      <h2>${editId ? '編輯優惠券' : '新增優惠券'}</h2>
      <p class="muted" style="margin-top:0">把信用卡、App、會員信箱收到的券集中管理；只存在這台裝置，換裝置請用「匯出 / 匯入」。</p>
      <form id="w-form" class="form">
        ${field('merchant', '品牌 / 商店 *', `<input name="merchant" required value="${esc(c.merchant || '')}" placeholder="例：momo購物網" />`)}
        ${field('title', '優惠內容', `<input name="title" value="${esc(c.title || '')}" placeholder="例：滿 1,500 折 150" />`)}
        ${field('type', '優惠形式', `<select name="type">${Object.entries(REWARD_TYPES).map(([k, l]) => `<option value="${k}" ${(r.type || 'amount') === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`)}
        ${field('value', '數值（元 / % / 哩）', `<input name="value" type="number" step="any" min="0" value="${r.value ?? ''}" />`)}
        ${field('code', '折扣碼', `<input name="code" value="${esc(c.code || '')}" autocapitalize="characters" />`)}
        ${field('minSpend', '低消 NT$', `<input name="minSpend" type="number" min="0" value="${c.minSpend ?? ''}" />`)}
        ${field('category', '分類', `<input name="category" value="${esc(c.category || '')}" placeholder="例：美食外送" />`)}
        ${field('startAt', '開始日', `<input name="startAt" type="date" value="${esc(c.startAt || '')}" />`)}
        ${field('endAt', '到期日', `<input name="endAt" type="date" value="${esc(c.endAt || '')}" />`)}
        ${field('tags', '標籤（逗號分隔）', `<input name="tags" value="${esc((c.tags || []).join(', '))}" placeholder="例：新客限定, App 限定" />`)}
        ${field('url', '連結', `<input name="url" type="url" value="${esc(c.url || '')}" placeholder="https://" />`, true)}
        ${field('conditions', '使用條件（一行一項）', `<textarea name="conditions" rows="3">${esc((c.conditions || []).join('\n'))}</textarea>`, true)}
        <div class="row field wide">
          <button class="btn primary" style="margin-left:0" type="submit">${editId ? '儲存' : '加入券夾'}</button>
          ${editId ? `<a class="btn" href="#/wallet">取消</a><button class="btn danger" type="button" id="w-del">刪除</button>` : ''}
        </div>
      </form>
    </section>
    <div class="toolbar">
      <div class="stats"><span><b class="num">${mine.length}</b> 張券</span><span>${mine.filter((d) => status(d, today) === 'ending').length} 張 7 天內到期</span></div>
      <div class="row">
        <button class="btn" id="w-export">匯出備份</button>
        <label class="btn">匯入備份<input type="file" id="w-import" accept="application/json" hidden /></label>
      </div>
    </div>
    ${mine.length ? `<div class="grid">${mine.map((d) => card(d, today, wallet.getMileValue())).join('')}</div>` : `<div class="empty"><b>券夾是空的</b>新增第一張券，到期前會排在最上面。</div>`}
  `;
  document.getElementById('w-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const g = (k) => String(fd.get(k) || '').trim();
    const value = g('value') === '' ? null : Number(g('value'));
    wallet.upsertCoupon({
      ...(editId ? { id: editId } : {}),
      kind: 'coupon',
      merchant: g('merchant'),
      title: g('title'),
      reward: { type: g('type'), value, text: g('title') },
      code: g('code') || null,
      minSpend: g('minSpend') === '' ? null : Number(g('minSpend')),
      category: g('category'),
      startAt: g('startAt') || null,
      endAt: g('endAt') || null,
      tags: g('tags').split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      url: g('url') || null,
      conditions: g('conditions').split('\n').map((s) => s.trim()).filter(Boolean),
    });
    toast(editId ? '已儲存' : '已加入券夾');
    location.hash = '#/wallet';
    if (!editId) viewWallet('');
  });
  document.getElementById('w-del')?.addEventListener('click', () => {
    if (!confirm('確定刪除這張券？')) return;
    wallet.removeCoupon(editId);
    location.hash = '#/wallet';
  });
  document.getElementById('w-export').addEventListener('click', () => {
    const blob = new Blob([wallet.exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `deal-radar-${today}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('w-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      toast(`已匯入 ${wallet.importJson(await file.text())} 張券`);
      viewWallet('');
    } catch (err) {
      alert(`匯入失敗：${err.message}`);
    }
  });
}

// ---------- 資料狀態 ----------
function viewStatus() {
  const m = data.meta;
  const rows = Object.entries(m?.sources || {});
  $main.innerHTML = `
    <section class="panel">
      <h2>資料來源</h2>
      <p class="muted" style="margin-top:0">GitHub Actions 每天台北時間 06:17 抓全部來源，12:47、18:47、00:47 再更新 PTT 與新聞；某個來源失敗時保留上一次成功的資料，不會清空。</p>
      ${rows.length ? `<div class="table-wrap"><table>
        <thead><tr><th>平台</th><th>狀態</th><th>筆數</th><th>最後成功</th><th>說明</th></tr></thead>
        <tbody>${rows.map(([k, s]) => `<tr>
          <td><span class="badge src src-${esc(k)}">${esc(SOURCES[k]?.name || k)}</span></td>
          <td>${s.ok ? '<span class="ok">正常</span>' : '<span class="err">失敗</span>'}</td>
          <td class="num">${s.count ?? 0}</td>
          <td class="num">${esc(fmtTime(s.updatedAt))}</td>
          <td class="muted" style="white-space:normal">${esc(s.error || s.note || '')}</td></tr>`).join('')}</tbody>
      </table></div>` : `<div class="notice">尚未產生資料狀態檔（data/meta.json）。排程第一次執行後就會出現。</div>`}
    </section>
    <section class="panel">
      <h2>計算方式</h2>
      <ul class="conds">
        <li>哩程統一換算成「每 NT$100 可得幾哩」，外幣計價依抓取當日匯率換算；訂閱、訂房等「每筆固定哩數」另外標示，不參與 % 比較。</li>
        <li>等值回饋 % = 每百元哩數 × 1 哩價值（預設 NT$0.5，可在篩選區調整）。</li>
        <li>加碼只在活動期間內計入；過期加碼自動回到基本回饋。</li>
        <li>「回饋高 → 低」先排回饋類，再排折價券與活動（折扣幅度與回饋率不能直接相比）；無門檻的贈點不換算 %。</li>
        <li>「7 天內到期」以台灣日期計算，含到期當天。</li>
        <li>新聞與 PTT 情報沒寫期限的，以發文日 + 7 天暫定，並標「期限見原文」。</li>
        <li>分類由品牌字典與關鍵字判斷，少數可能分錯；可用搜尋補足。</li>
      </ul>
    </section>`;
}

// ---------- 路由 ----------
function render() {
  const [path, qs = ''] = location.hash.replace(/^#/, '').split('?');
  const route = path.replace(/^\//, '') || 'coupons';
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === route));
  if (route === 'compare') viewCompare(qs);
  else if (route === 'wallet') viewWallet(qs);
  else if (route === 'status') viewStatus();
  else if (route === 'portals') viewList(qs, 'portals');
  else viewList(qs, 'coupons');
}

$main.addEventListener('click', (e) => {
  const b = e.target.closest('[data-copy]');
  if (!b) return;
  navigator.clipboard?.writeText(b.dataset.copy).then(
    () => toast(`已複製 ${b.dataset.copy}`),
    () => toast('無法複製，請手動選取'),
  );
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
