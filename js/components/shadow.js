// 「跟讀模仿」：聽一句 → 模仿 → 錄音辨識 → 比對 → 聽自己的聲音
import { esc, fillName } from '../util.js';
import { speak, canRecognize, canRecord } from '../speech.js';
import { compare, scoreLabel } from '../text.js';
import { dayLog, lessonLog, save, settings } from '../store.js';
import { speakerGender } from '../data/lessons.js';
import { icon } from '../icons.js';
import { bindMic, micSupported } from './mic.js';

export function mountShadow(root, lesson, { onComplete, done }) {
  const name = settings().name;
  const fill = (s) => fillName(s, name);
  const gender = (line) => (line.you ? settings().youGender : speakerGender(lesson, line.speaker));
  const shadowed = new Set();
  const best = lessonLog(lesson.id).best;

  const support = !micSupported
    ? '<div class="notice">此瀏覽器不支援麥克風。你仍可以「聽一句、暫停、大聲跟讀」，完成後按下方按鈕。建議使用 Chrome、Edge 或 Safari。</div>'
    : !canRecognize
      ? '<div class="notice">此瀏覽器不支援語音辨識，但可以錄音回放，和原音對照。</div>'
      : '';

  root.innerHTML = `
    <div class="howto card">
      <b>跟讀 4 步驟：</b>① 按 ${icon.play} 聽原音 → ② 不看字、模仿語調與連音 → ③ 按「跟讀」說一次 → ④ 看比對結果、播放自己的聲音和原音對照。
      <div class="muted small">技巧：模仿「節奏」比每個字都念清楚更重要。美國人會把不重要的字念得又輕又快。</div>
    </div>
    ${support}
    <div class="shadow-list">
      ${lesson.lines
        .map((l, i) => {
          const b = best['shadow-' + i];
          return `
        <div class="shadow-row card ${l.you ? 'me' : ''}" data-row="${i}">
          <div class="shadow-text">
            <div class="who">${l.you ? 'You' : esc(l.speaker)} ${b != null ? `<span class="best">最佳 ${Math.round(b * 100)}%</span>` : ''}</div>
            <div class="en">${esc(fill(l.en))}</div>
            <div class="zh">${esc(fill(l.zh))}</div>
            <div class="result" data-result="${i}"></div>
          </div>
          <div class="shadow-tools">
            <button class="icon-btn" data-play="${i}" title="播放">${icon.play}</button>
            <button class="icon-btn" data-slow="${i}" title="慢速">${icon.slow}</button>
            <button class="btn mic small" data-mic="${i}"></button>
          </div>
        </div>`;
        })
        .join('')}
    </div>
    <div class="complete-bar">
      <span class="muted" data-count>已跟讀 0 / ${lesson.lines.length} 句</span>
      <button class="btn primary big" data-act="complete">${done ? '前往下一步：Toko 中翻英' : '完成跟讀'}</button>
    </div>
  `;

  const countEl = root.querySelector('[data-count]');
  const mark = (i) => {
    shadowed.add(i);
    countEl.textContent = `已跟讀 ${shadowed.size} / ${lesson.lines.length} 句`;
    root.querySelector(`[data-row="${i}"]`).classList.add('shadowed');
  };

  root.querySelectorAll('[data-mic]').forEach((btn) => {
    const i = Number(btn.dataset.mic);
    const l = lesson.lines[i];
    const out = root.querySelector(`[data-result="${i}"]`);
    bindMic(btn, {
      label: '跟讀',
      record: canRecord,
      onInterim: (t) => (out.innerHTML = `<span class="muted">${esc(t)}</span>`),
      onResult: ({ text, audioUrl }) => {
        let html = '';
        if (text) {
          const c = compare(fill(l.en), text);
          const lbl = scoreLabel(c.score);
          html += `<div class="score ${lbl.cls}">${lbl.text}<b>${Math.round(c.score * 100)}%</b></div>
            <div class="diff">${c.targetHtml}</div>
            <div class="heard">系統聽到：${c.answerHtml}</div>`;
          const key = 'shadow-' + i;
          best[key] = Math.max(best[key] || 0, c.score);
        } else if (canRecognize) {
          html += '<div class="muted">沒有聽到聲音，再試一次（說話時靠近麥克風）。</div>';
        }
        if (audioUrl) html += `<div class="my-audio"><span class="muted small">我的錄音：</span><audio controls src="${audioUrl}"></audio></div>`;
        out.innerHTML = html;
        if (text || audioUrl) {
          mark(i);
          dayLog().shadow += 1;
          save();
        }
      },
    });
  });

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const d = btn.dataset;
    if (d.play || d.slow) {
      const i = Number(d.play ?? d.slow);
      const l = lesson.lines[i];
      speak(fill(l.en), { gender: gender(l), rateMul: d.slow ? 0.7 : 1 });
      if (!micSupported) mark(i);
    } else if (d.act === 'complete') onComplete();
  });
}
