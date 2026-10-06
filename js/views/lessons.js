import { esc } from '../util.js';
import { LESSONS, WEEKS, TRACKS } from '../data/lessons.js';
import { getState } from '../store.js';
import { LESSON_STEPS, nextLesson } from '../plan.js';
import { icon } from '../icons.js';

export function renderLessons(root) {
  const st = getState();
  const next = nextLesson();
  root.innerHTML = `
    <h1 class="page-title">課程地圖 <small>4 週 · 20 堂情境課</small></h1>
    <p class="lede">週一到週五各一堂新課，週末總複習。課程會自動接續你上次的進度，漏掉一天也不會跳課。</p>
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
