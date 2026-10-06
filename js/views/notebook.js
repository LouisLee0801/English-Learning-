import { esc, fillName, formatDate, todayStr, toast } from '../util.js';
import { getLesson } from '../data/lessons.js';
import { getState, save, settings } from '../store.js';
import { addToNotebook } from '../plan.js';
import { cardStatus, isDue, STATUS_LABEL } from '../srs.js';
import { speak } from '../speech.js';
import { icon } from '../icons.js';

const FILTERS = [
  ['all', '全部'],
  ['due', '到期'],
  ['new', '新卡'],
  ['learning', '學習中'],
  ['mastered', '已熟練'],
  ['mine', '我的收藏'],
];

export function renderNotebook(root) {
  let filter = 'all';
  let query = '';
  const today = todayStr();
  const name = settings().name;

  function entries() {
    return Object.values(getState().notebook)
      .filter((c) => {
        if (filter === 'due') return isDue(c.srs, today);
        if (filter === 'mine') return !c.auto;
        if (['new', 'learning', 'mastered'].includes(filter)) return cardStatus(c.srs) === filter;
        return true;
      })
      .filter((c) => !query || `${c.en} ${c.zh} ${c.note}`.toLowerCase().includes(query))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '') || a.id.localeCompare(b.id));
  }

  function counts() {
    const all = Object.values(getState().notebook);
    return {
      all: all.length,
      due: all.filter((c) => isDue(c.srs, today)).length,
      mastered: all.filter((c) => cardStatus(c.srs) === 'mastered').length,
    };
  }

  function listHtml() {
    const list = entries();
    if (!list.length) {
      return `<div class="card empty"><p>${getState().notebook && Object.keys(getState().notebook).length ? '沒有符合條件的項目。' : '單字本還是空的。'}</p><p class="muted">完成課程會自動加入片語；在對話中按 ⭐ 也能收藏，或在上方自己新增。</p></div>`;
    }
    return list
      .map((c) => {
        const st = cardStatus(c.srs);
        const src = c.source === 'custom' ? '自訂' : getLesson(c.source)?.titleZh || '';
        return `
        <div class="nb-item card">
          <div class="nb-main">
            <div class="en">${esc(fillName(c.en, name))}</div>
            <div class="zh">${esc(fillName(c.zh, name))}</div>
            ${c.note ? `<div class="note">${esc(c.note)}</div>` : ''}
            <div class="nb-meta">
              <span class="badge ${st}">${STATUS_LABEL[st]}</span>
              <span>${esc(src)}</span>
              <span>${isDue(c.srs, today) ? '今天複習' : `下次：${formatDate(c.srs.due)}`}</span>
            </div>
          </div>
          <div class="nb-tools">
            <button class="icon-btn" data-play="${esc(c.id)}" title="播放">${icon.play}</button>
            <button class="icon-btn" data-del="${esc(c.id)}" title="刪除">${icon.trash}</button>
          </div>
        </div>`;
      })
      .join('');
  }

  function render() {
    const n = counts();
    root.innerHTML = `
      <h1 class="page-title">單字本 <small>${n.all} 條 · ${n.mastered} 已熟練</small></h1>
      <div class="btn-row">
        <a class="btn primary" href="#/review">${icon.cards}<span>複習到期卡片（${n.due}）</span></a>
        <button class="btn" data-act="toggle-add">${icon.pencil}<span>新增單字／片語</span></button>
      </div>
      <form class="card add-form" hidden>
        <label>英文<input name="en" required placeholder="e.g. That's right up my alley."></label>
        <label>中文<input name="zh" required placeholder="例：那正好是我的專長。"></label>
        <label>筆記（選填）<input name="note" placeholder="在哪裡聽到、怎麼用⋯"></label>
        <div class="btn-row"><button class="btn primary" type="submit">加入單字本</button></div>
      </form>
      <div class="filters">
        <input class="search" type="search" placeholder="搜尋英文、中文或筆記⋯" value="${esc(query)}">
        <div class="chips">${FILTERS.map(([k, label]) => `<button class="chip ${filter === k ? 'active' : ''}" data-filter="${k}">${label}</button>`).join('')}</div>
      </div>
      <div class="nb-list">${listHtml()}</div>`;

    const search = root.querySelector('.search');
    search.addEventListener('input', () => {
      query = search.value.trim().toLowerCase();
      root.querySelector('.nb-list').innerHTML = listHtml();
    });
    const form = root.querySelector('.add-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(form);
      addToNotebook({ id: `custom-${Date.now()}`, en: f.get('en').trim(), zh: f.get('zh').trim(), note: f.get('note').trim() });
      save();
      toast('已加入單字本');
      render();
    });
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const d = btn.dataset;
    if (d.act === 'toggle-add') {
      const form = root.querySelector('.add-form');
      form.hidden = !form.hidden;
      if (!form.hidden) form.querySelector('input').focus();
    } else if (d.filter) {
      filter = d.filter;
      render();
    } else if (d.play) {
      const c = getState().notebook[d.play];
      if (c) speak(fillName(c.en, name).replace(/\.\.\./g, ''), { gender: settings().youGender });
    } else if (d.del) {
      if (!confirm('確定要從單字本刪除這一條嗎？')) return;
      delete getState().notebook[d.del];
      save();
      render();
    }
  });

  render();
}
