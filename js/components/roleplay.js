// 角色扮演：對方由語音演出，輪到你時只看中文、開口說英文（情境版 Toko）
import { esc, fillName } from '../util.js';
import { speak, stopSpeaking } from '../speech.js';
import { compare, scoreLabel } from '../text.js';
import { settings } from '../store.js';
import { speakerGender } from '../data/lessons.js';
import { icon } from '../icons.js';
import { bindMic } from './mic.js';

export function mountRoleplay(root, lesson, { onDone }) {
  const name = settings().name;
  const fill = (s) => fillName(s, name);
  let blind = false;
  let idx = 0;
  let answer = '';
  const scores = [];

  root.innerHTML = `
    <div class="card roleplay-intro">
      <h3>${esc(lesson.title)} <small>${esc(lesson.titleZh)}</small></h3>
      <p class="muted">${esc(lesson.scene)}</p>
      <p>你是主角。對方的台詞會自動播放，輪到你時只會看到中文提示，請直接開口說英文。</p>
      <label class="switch"><input type="checkbox" data-blind><span>盲聽模式（隱藏對方英文字幕，訓練聽力）</span></label>
      <div class="btn-row"><button class="btn primary big" data-start>開始角色扮演 ${icon.arrow}</button></div>
    </div>`;

  root.querySelector('[data-start]').addEventListener('click', () => {
    blind = root.querySelector('[data-blind]').checked;
    root.innerHTML = `<div class="chat roleplay-chat"></div><div class="rp-stage"></div>`;
    step();
  });

  const chat = () => root.querySelector('.roleplay-chat');
  const stage = () => root.querySelector('.rp-stage');

  function addBubble(line, extra = '') {
    const row = document.createElement('div');
    row.className = `bubble-row ${line.you ? 'me' : ''}`;
    const hideEn = blind && !line.you;
    row.innerHTML = `
      <div class="bubble ${hideEn ? 'blind' : ''}">
        <div class="who">${line.you ? 'You' : esc(line.speaker)}</div>
        <div class="en">${hideEn ? '<span class="muted">🎧 用聽的⋯</span>' : esc(fill(line.en))}</div>
        ${hideEn ? `<button class="link" data-reveal>顯示字幕</button><div class="en hidden-en" hidden>${esc(fill(line.en))}</div>` : ''}
        ${extra}
      </div>
      <div class="bubble-tools"><button class="icon-btn" title="再聽一次">${icon.play}</button></div>`;
    row.querySelector('.icon-btn').addEventListener('click', () =>
      speak(fill(line.en), { gender: line.you ? settings().youGender : speakerGender(lesson, line.speaker) }),
    );
    row.querySelector('[data-reveal]')?.addEventListener('click', (e) => {
      row.querySelector('.hidden-en').hidden = false;
      e.target.remove();
    });
    chat().appendChild(row);
    row.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }

  async function step() {
    if (idx >= lesson.lines.length) return finish();
    const line = lesson.lines[idx];
    if (!line.you) {
      addBubble(line);
      stage().innerHTML = `<div class="rp-wait muted">${esc(line.speaker)} 正在說話⋯ <button class="link" data-skip>略過</button></div>`;
      let skipped = false;
      stage().querySelector('[data-skip]').addEventListener('click', () => {
        skipped = true;
        stopSpeaking();
        idx += 1;
        step();
      });
      await speak(fill(line.en), { gender: speakerGender(lesson, line.speaker) });
      if (skipped || !root.isConnected) return;
      idx += 1;
      step();
      return;
    }
    answer = '';
    stage().innerHTML = `
      <div class="card rp-turn">
        <div class="prompt-label">輪到你了，用英文說：</div>
        <div class="prompt-zh">${esc(fill(line.zh))}</div>
        <textarea class="drill-input" rows="2" placeholder="按「開口說」，說完再按一次結束；辨識結果可以直接修改⋯"></textarea>
        <div class="btn-row">
          <button class="btn mic" data-mic></button>
          <button class="btn primary" data-check>對答案 ${icon.arrow}</button>
        </div>
      </div>`;
    const input = stage().querySelector('textarea');
    input.addEventListener('input', () => (answer = input.value));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        check(line);
      }
    });
    bindMic(stage().querySelector('[data-mic]'), {
      hint: fill(line.en),
      onInterim: (t) => {
        answer = t;
        input.value = t;
      },
      onResult: ({ text }) => {
        answer = text || answer;
        input.value = answer;
        input.focus();
      },
    });
    stage().querySelector('[data-check]').addEventListener('click', () => check(line));
  }

  function check(line) {
    const target = fill(line.en);
    const c = answer.trim() ? compare(target, answer) : null;
    scores.push(c ? c.score : 0);
    const lbl = c ? scoreLabel(c.score) : null;
    stage().innerHTML = `
      <div class="card rp-turn">
        <div class="label">標準說法</div>
        <div class="target">${c ? c.targetHtml : esc(target)}</div>
        <div class="label">你的回答</div>
        <div class="yours">${c ? c.answerHtml : '<span class="muted">（沒有作答）</span>'}</div>
        ${lbl ? `<div class="score ${lbl.cls}">${lbl.text}<b>${Math.round(c.score * 100)}%</b></div>` : ''}
        <div class="btn-row">
          <button class="btn" data-replay>${icon.play}<span>再聽一次</span></button>
          <button class="btn primary" data-next>繼續對話 ${icon.arrow}</button>
        </div>
      </div>`;
    speak(target, { gender: settings().youGender });
    stage().querySelector('[data-replay]').addEventListener('click', () => speak(target, { gender: settings().youGender }));
    stage().querySelector('[data-next]').addEventListener('click', () => {
      stopSpeaking();
      addBubble(line, c ? `<div class="mini-score ${lbl.cls}">${Math.round(c.score * 100)}%</div>` : '');
      idx += 1;
      step();
    });
  }

  function finish() {
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    stage().innerHTML = '';
    onDone?.({ avg, count: scores.length }, stage());
  }
}
