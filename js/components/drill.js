// Toko 式練習：看中文 → 開口說（或打字）英文 → 對答案 → 自評
import { esc, fillName } from '../util.js';
import { compare, hint, scoreLabel, suggestedGrade } from '../text.js';
import { GRADES } from '../srs.js';
import { speak, stopSpeaking } from '../speech.js';
import { settings } from '../store.js';
import { icon } from '../icons.js';
import { bindMic } from './mic.js';

/**
 * @param {HTMLElement} root
 * @param {object} o
 * @param {Array} o.items      { id, en, zh, note?, context?, phrase? }
 * @param {(item, grade, score) => void} [o.onRate]
 * @param {(summary) => void} o.onDone
 * @param {string} [o.emptyText]
 */
export function mountDrill(root, { items, onRate, onDone, emptyText = '目前沒有需要練習的句子。' }) {
  const name = settings().name;
  const queue = items.map((it) => ({ ...it, en: fillName(it.en, name), zh: fillName(it.zh, name), tries: 0 }));
  const total = queue.length;
  const results = new Map();
  let idx = 0;
  let phase = 'ask';
  let answer = '';
  let showHint = false;
  let lastCompare = null;

  if (!total) {
    root.innerHTML = `<div class="card empty">${esc(emptyText)}</div>`;
    onDone?.({ total: 0, good: 0, avg: 0, empty: true });
    return;
  }

  const youGender = () => settings().youGender || 'f';

  function render() {
    const item = queue[idx];
    const progress = Math.round((Math.min(results.size, total) / total) * 100);
    const ctx = item.context
      ? `<div class="ctx">
          <button class="icon-btn" data-act="ctx" title="播放對方的話">${icon.play}</button>
          <div><span class="who">${esc(item.context.speaker)}</span>
          <span class="ctx-en">${esc(fillName(item.context.en, name))}</span>
          <div class="ctx-zh">${esc(fillName(item.context.zh, name))}</div></div>
        </div>`
      : '';
    let body;
    if (phase === 'ask') {
      body = `
        <label class="sr-only" for="drill-input">你的英文</label>
        <textarea id="drill-input" class="drill-input" rows="2" placeholder="按「開口說」，說完再按一次結束；也可以打字（Enter 對答案）">${esc(answer)}</textarea>
        <div class="mic-tip muted small" hidden>辨識結果可以直接修改，確認後按「對答案」或 Enter。</div>
        ${showHint ? `<div class="hint">${esc(hint(item.en))}</div>` : ''}
        <div class="btn-row">
          <button class="btn mic" data-act="mic"></button>
          <button class="btn ghost" data-act="hint">${showHint ? '隱藏提示' : '首字母提示'}</button>
          <button class="btn primary" data-act="reveal">對答案 ${icon.arrow}</button>
        </div>`;
    } else {
      const c = lastCompare;
      const lbl = c ? scoreLabel(c.score) : null;
      const sug = c ? suggestedGrade(c.score) : 2;
      body = `
        <div class="reveal">
          <div class="label">標準說法</div>
          <div class="target">${c ? c.targetHtml : esc(item.en)}</div>
          <div class="btn-row tight">
            <button class="btn small" data-act="play">${icon.play}<span>播放</span></button>
            <button class="btn small" data-act="slow">${icon.slow}<span>慢速</span></button>
          </div>
          ${item.note ? `<p class="note">💡 ${esc(item.note)}</p>` : ''}
          <div class="label">你的回答</div>
          <div class="yours">${c ? c.answerHtml || '<span class="muted">（沒有作答）</span>' : '<span class="muted">（沒有作答，直接看答案）</span>'}</div>
          ${lbl ? `<div class="score ${lbl.cls}">${lbl.text}<b>${Math.round(c.score * 100)}%</b></div>` : ''}
          <div class="label">自評這一題（會決定下次複習時間）</div>
          <div class="grades">
            ${GRADES.map((g) => `<button class="grade g${g.grade} ${g.grade === sug ? 'suggested' : ''}" data-grade="${g.grade}"><kbd>${g.key}</kbd>${g.label}</button>`).join('')}
          </div>
        </div>`;
    }
    root.innerHTML = `
      <div class="drill">
        <div class="drill-top">
          <span class="pill">${Math.min(results.size + 1, total)} / ${total}</span>
          <div class="bar"><i style="width:${progress}%"></i></div>
        </div>
        <div class="card drill-card">
          ${ctx}
          <div class="prompt-label">${item.phrase ? '片語／句型' : '你要說'}</div>
          <div class="prompt-zh">${esc(item.zh)}</div>
          ${body}
        </div>
      </div>`;

    const input = root.querySelector('#drill-input');
    if (input) {
      input.addEventListener('input', () => (answer = input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
          e.preventDefault();
          reveal();
        }
      });
      if (window.matchMedia('(pointer: fine)').matches) input.focus();
    }
    const micBtn = root.querySelector('[data-act="mic"]');
    if (micBtn) {
      bindMic(micBtn, {
        hint: queue[idx].en,
        onInterim: (t) => {
          answer = t;
          if (input) input.value = t;
        },
        onResult: ({ text }) => {
          answer = text || answer;
          if (input) {
            input.value = answer;
            input.focus();
          }
          const tip = root.querySelector('.mic-tip');
          if (tip) tip.hidden = !text;
        },
      });
    }
  }

  function reveal() {
    const item = queue[idx];
    lastCompare = answer.trim() ? compare(item.en, answer) : null;
    phase = 'reveal';
    render();
    speak(item.en, { gender: youGender() });
  }

  function rate(grade) {
    const item = queue[idx];
    const score = lastCompare ? lastCompare.score : 0;
    if (!results.has(item.id)) results.set(item.id, { grade, score });
    onRate?.(item, grade, score);
    if (grade === 0 && item.tries < 2) queue.push({ ...item, tries: item.tries + 1 });
    idx += 1;
    answer = '';
    showHint = false;
    lastCompare = null;
    phase = 'ask';
    if (idx >= queue.length) return finish();
    render();
    const next = queue[idx];
    if (next.context) speak(fillName(next.context.en, name), { gender: next.context.gender });
    else stopSpeaking();
  }

  function finish() {
    stopSpeaking();
    document.removeEventListener('keydown', onKey);
    const vals = [...results.values()];
    const good = vals.filter((r) => r.grade >= 2).length;
    const avg = vals.length ? vals.reduce((s, r) => s + r.score, 0) / vals.length : 0;
    onDone?.({ total, good, avg });
  }

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || !root.contains(btn)) return;
    const item = queue[idx];
    if (!item) return;
    const act = btn.dataset.act;
    if (act === 'reveal') reveal();
    else if (act === 'hint') {
      showHint = !showHint;
      render();
    } else if (act === 'play') speak(item.en, { gender: youGender() });
    else if (act === 'slow') speak(item.en, { gender: youGender(), rateMul: 0.7 });
    else if (act === 'ctx') speak(fillName(item.context.en, name), { gender: item.context.gender });
    else if (btn.dataset.grade) rate(Number(btn.dataset.grade));
  });

  function onKey(e) {
    if (!root.isConnected) {
      document.removeEventListener('keydown', onKey);
      return;
    }
    if (phase !== 'reveal' || e.target.closest?.('textarea,input')) return;
    const g = GRADES.find((x) => x.key === e.key);
    if (g) rate(g.grade);
  }
  document.addEventListener('keydown', onKey);

  render();
  if (queue[0].context) speak(fillName(queue[0].context.en, name), { gender: queue[0].context.gender });
}
