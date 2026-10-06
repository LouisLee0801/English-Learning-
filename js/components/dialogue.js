// 「聽懂對話」：逐句播放、中英對照、收藏、片語、美式發音重點
import { esc, fillName, toast } from '../util.js';
import { speak, speakSequence, stopSpeaking } from '../speech.js';
import { getState, settings, update } from '../store.js';
import { speakerGender, tokoItems } from '../data/lessons.js';
import { toggleNotebook } from '../plan.js';
import { icon } from '../icons.js';

export function mountDialogue(root, lesson, { onComplete, done }) {
  const name = settings().name;
  const fill = (s) => fillName(s, name);
  const gender = (line) => (line.you ? settings().youGender : speakerGender(lesson, line.speaker));
  const saved = (id) => !!getState().notebook[id];
  const itemsById = new Map(tokoItems(lesson).map((it) => [it.id, it]));

  const star = (id) =>
    `<button class="icon-btn star ${saved(id) ? 'on' : ''}" data-star="${id}" title="收藏到單字本">${saved(id) ? icon.starFill : icon.star}</button>`;

  root.innerHTML = `
    <div class="toolbar">
      <button class="btn primary" data-act="all">${icon.headphones}<span>播放整段</span></button>
      <button class="btn" data-act="all-slow">${icon.slow}<span>慢速整段</span></button>
      <label class="switch"><input type="checkbox" data-act="zh" ${settings().showZh ? 'checked' : ''}><span>顯示中文</span></label>
    </div>
    <div class="chat ${settings().showZh ? '' : 'hide-zh'}">
      ${lesson.lines
        .map(
          (l, i) => `
        <div class="bubble-row ${l.you ? 'me' : ''}" data-line="${i}">
          <div class="bubble">
            <div class="who">${l.you ? `You（${esc(name)}）` : esc(l.speaker)}</div>
            <div class="en">${esc(fill(l.en))}</div>
            <div class="zh">${esc(fill(l.zh))}</div>
          </div>
          <div class="bubble-tools">
            <button class="icon-btn" data-play="${i}" title="播放">${icon.play}</button>
            <button class="icon-btn" data-slow="${i}" title="慢速">${icon.slow}</button>
            ${l.you ? star(l.id) : ''}
          </div>
        </div>`,
        )
        .join('')}
    </div>

    <h3 class="section-title">重點片語 <small>Key Phrases</small></h3>
    <div class="phrase-grid">
      ${lesson.phrases
        .map(
          (p, i) => `
        <div class="phrase card">
          <div class="phrase-head">
            <div class="en">${esc(p.en)}</div>
            <div class="tools"><button class="icon-btn" data-pplay="${i}" title="播放">${icon.play}</button>${star(p.id)}</div>
          </div>
          <div class="zh">${esc(p.zh)}</div>
          <div class="note">${esc(p.note)}</div>
        </div>`,
        )
        .join('')}
    </div>

    <h3 class="section-title">美式發音重點 <small>Sound American</small></h3>
    <div class="accent-list">
      ${lesson.accent
        .map(
          (a, i) => `
        <div class="accent card">
          <button class="icon-btn" data-aplay="${i}" title="播放">${icon.play}</button>
          <div><div class="accent-word">${esc(a.word)} <span class="sound">/${esc(a.sound)}/</span></div>
          <div class="note">${esc(a.note)}</div></div>
        </div>`,
        )
        .join('')}
    </div>

    <div class="insider card">
      <div class="insider-title">Insider Tip · 在地人才知道</div>
      <p>${esc(lesson.tip)}</p>
    </div>

    <div class="complete-bar">
      ${done ? `<span class="done-badge">${icon.check} 已完成「聽懂對話」</span>` : ''}
      <button class="btn primary big" data-act="complete">${done ? '前往下一步：跟讀' : '我聽懂了，完成此步驟'}</button>
    </div>
  `;

  const chat = root.querySelector('.chat');
  const highlight = (i) => {
    chat.querySelectorAll('.bubble-row').forEach((el) => el.classList.toggle('playing', Number(el.dataset.line) === i));
    const el = chat.querySelector(`[data-line="${i}"]`);
    if (el && i >= 0) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const playAll = (rateMul) =>
    speakSequence(
      lesson.lines.map((l) => ({ text: fill(l.en), gender: gender(l), rateMul })),
      highlight,
    ).then(() => highlight(-1));

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button, input');
    if (!btn) return;
    const d = btn.dataset;
    if (d.act === 'all') playAll(1);
    else if (d.act === 'all-slow') playAll(0.75);
    else if (d.act === 'complete') {
      stopSpeaking();
      onComplete();
    } else if (d.play || d.slow) {
      const i = Number(d.play ?? d.slow);
      const l = lesson.lines[i];
      highlight(i);
      speak(fill(l.en), { gender: gender(l), rateMul: d.slow ? 0.7 : 1 }).then(() => highlight(-1));
    } else if (d.pplay) speak(lesson.phrases[Number(d.pplay)].en.replace(/\.\.\./g, ''), { gender: settings().youGender });
    else if (d.aplay) speak(lesson.accent[Number(d.aplay)].word, { gender: settings().youGender, rateMul: 0.85 });
    else if (d.star) {
      const item = itemsById.get(d.star);
      const on = toggleNotebook(item);
      root.querySelectorAll(`[data-star="${d.star}"]`).forEach((b) => {
        b.classList.toggle('on', on);
        b.innerHTML = on ? icon.starFill : icon.star;
      });
      toast(on ? '已加入單字本 ⭐' : '已從單字本移除');
    }
  });

  root.querySelector('[data-act="zh"]').addEventListener('change', (e) => {
    update((s) => (s.settings.showZh = e.target.checked));
    chat.classList.toggle('hide-zh', !e.target.checked);
  });
}
