import { esc } from '../util.js';
import { HOT_WEEKS, LESSONS, WEEKS, TRACKS, TOPICS, getLesson } from '../data/lessons.js';
import { getState } from '../store.js';
import { LESSON_STEPS, nextLesson } from '../plan.js';
import { icon } from '../icons.js';

function hotSection(st) {
  if (!HOT_WEEKS.length) return '';
  return `
    <section class="week-block">
      <div class="week-head trending">
        <div class="eyebrow">Hot Topics · 每週更新</div>
        <h2>What Everyone's Talking About</h2>
        <div class="muted">美國 20–40 歲的人這週在聊什麼：比賽、紅酒、高爾夫、泰拳、音樂、汽車、旅行、科技、投資。</div>
      </div>
      ${[...HOT_WEEKS]
        .reverse()
        .map(
          (w) => `
        <h3 class="hot-week-title">${esc(w.title)} <small class="muted">${esc(w.id)}</small></h3>
        <div class="lesson-grid">
          ${w.lessons
            .map((raw) => {
              const l = getLesson(raw.id);
              const done = !!st.lessons[l.id]?.completedAt;
              return `
            <a class="lesson-card card hot ${done ? 'done' : ''}" href="#/lesson/${l.id}">
              <div class="lesson-card-top"><span class="day">${TOPICS[l.topic]?.emoji || ''} ${esc(TOPICS[l.topic]?.label || '')}</span>${done ? `<span class="done-badge">${icon.check}完成</span>` : ''}</div>
              <div class="lesson-title">${esc(l.title)}</div>
              <div class="lesson-zh">${esc(l.titleZh)}</div>
            </a>`;
            })
            .join('')}
        </div>`,
        )
        .join('')}
    </section>`;
}

export function renderLessons(root) {
  const st = getState();
  const next = nextLesson();
  root.innerHTML = `
    <h1 class="page-title">課程地圖 <small>4 週核心課 + 每週熱門話題</small></h1>
    <p class="lede">平日每天一堂課（週二、週四是熱門話題日），週末總複習。課程會自動接續你上次的進度，漏掉一天也不會跳課。</p>
    ${hotSection(st)}
    ${WEEKS.map((w) => {
      const lessons = LESSONS.filter((l) => l.week === w.week);
      return `
      <section class="week-block">
        <div class="week-head ${w.track}">
          <div class="eyebrow">Week ${w.week} · ${TRACKS[w.track].label}</div>
          <h2>${esc(w.title)}</h2>
          <div class="muted">${esc(w.titleZh)}｜${esc(w.desc)}</div>
        </div>
        <div class="lesson-grid">
          ${lessons
            .map((l) => {
              const log = st.lessons[l.id];
              const steps = LESSON_STEPS.filter((s) => log?.steps?.[s]).length;
              const done = !!log?.completedAt;
              const isNext = next?.id === l.id;
              return `
              <a class="lesson-card card ${done ? 'done' : ''} ${isNext ? 'next' : ''}" href="#/lesson/${l.id}">
                <div class="lesson-card-top">
                  <span class="day">Day ${l.day}</span>
                  ${done ? `<span class="done-badge">${icon.check}完成</span>` : isNext ? '<span class="next-badge">下一課</span>' : steps ? `<span class="muted small">${steps}/3</span>` : ''}
                </div>
                <div class="lesson-title">${esc(l.title)}</div>
                <div class="lesson-zh">${esc(l.titleZh)}</div>
                <div class="muted small">📍 ${esc(l.location)}</div>
              </a>`;
            })
            .join('')}
        </div>
      </section>`;
    }).join('')}
  `;
}
