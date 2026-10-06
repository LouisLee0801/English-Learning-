import { esc, fillName, formatDate, minutes, todayStr } from '../util.js';
import { getLesson, LESSONS, TRACKS } from '../data/lessons.js';
import { dayLog, getState, settings } from '../store.js';
import { getPlan, nextLesson, streak, dueCards, isLessonDone } from '../plan.js';
import { icon } from '../icons.js';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function ring(value, goal) {
  const pct = Math.min(1, value / goal);
  const r = 44;
  const c = 2 * Math.PI * r;
  return `
    <svg class="ring" viewBox="0 0 110 110" role="img" aria-label="今日已學習 ${value} 分鐘，目標 ${goal} 分鐘">
      <circle cx="55" cy="55" r="${r}" class="ring-bg"/>
      <circle cx="55" cy="55" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 55 55)"/>
      <text x="55" y="53" text-anchor="middle" class="ring-num">${value}</text>
      <text x="55" y="72" text-anchor="middle" class="ring-sub">/ ${goal} 分鐘</text>
    </svg>`;
}

export function renderToday(root) {
  const date = todayStr();
  const s = settings();
  const plan = getPlan(date);
  const d = dayLog(date);
  const mins = minutes(d.seconds);
  const doneLessons = LESSONS.filter((l) => isLessonDone(l.id)).length;
  const allDone = plan.doneCount === plan.steps.length;

  let focus = '';
  if (plan.mode === 'weekend') {
    const lessons = plan.weekIds.map(getLesson);
    focus = `
      <div class="card focus weekend">
        <div class="eyebrow">${plan.saturday ? 'Saturday · 週末總複習 A' : 'Sunday · 週末總複習 B'}</div>
        <h2>把這週的句子，變成你的反射動作</h2>
        <p class="muted">本週複習範圍（${lessons.length} 課）：</p>
        <div class="chips">${lessons.map((l) => `<a class="chip" href="#/lesson/${l.id}">${esc(l.titleZh)}</a>`).join('')}</div>
      </div>`;
  } else {
    const l = getLesson(plan.lessonId);
    focus = `
      <a class="card focus lesson-hero ${l.track}" href="#/lesson/${l.id}">
        <div class="eyebrow">Week ${l.week} · Day ${l.day} · ${TRACKS[l.track].label}${plan.mode === 'cycle' ? ' · 複習循環' : ''}</div>
        <h2>${esc(l.title)}</h2>
        <div class="title-zh">${esc(l.titleZh)}<span class="loc">📍 ${esc(l.location)}</span></div>
        <p>${esc(fillName(l.scene, s.name))}</p>
        <div class="goal">🎯 ${esc(l.goal)}</div>
      </a>`;
  }

  const lede =
    plan.mode === 'weekend'
      ? '週末不學新課，專心把本週內容練到能脫口而出。'
      : plan.mode === 'cycle'
        ? '20 堂課全部完成！現在進入複習循環，今天重練最久沒碰的一課。'
        : `今天 ${plan.steps.length} 個步驟，約 ${plan.totalMin} 分鐘。先聽懂、再跟讀、最後看中文說英文。`;

  const next = nextLesson();
  const extra = allDone
    ? `
    <section class="card celebrate">
      <div class="big-emoji">🥂</div>
      <h2>今日任務完成，Cheers!</h2>
      <p>你今天累積了 ${mins} 分鐘。想多練一點？</p>
      <div class="btn-row center">
        ${next && plan.mode !== 'weekend' && next.id !== plan.lessonId ? `<a class="btn primary" href="#/lesson/${next.id}">預習下一課：${esc(next.titleZh)}</a>` : ''}
        <a class="btn" href="#/roleplay">角色扮演</a>
        <a class="btn" href="#/notebook">翻翻單字本</a>
      </div>
    </section>`
    : '';

  root.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <div class="eyebrow">${formatDate(date)}${plan.mode === 'weekend' ? ' · Weekend' : ''}</div>
        <h1>${greeting()}, <span class="gold">${esc(s.name)}</span>.</h1>
        <p class="lede">${lede}</p>
      </div>
      ${ring(mins, s.dailyGoal)}
    </section>

    <section class="stat-row">
      <div class="stat"><div class="stat-num">${icon.flame}${streak(date)}</div><div class="stat-label">連續天數</div></div>
      <div class="stat"><div class="stat-num">${doneLessons}<small>/${LESSONS.length}</small></div><div class="stat-label">完成課程</div></div>
      <div class="stat"><div class="stat-num">${dueCards(date).length}</div><div class="stat-label">到期卡片</div></div>
      <div class="stat"><div class="stat-num">${Object.keys(getState().notebook).length}</div><div class="stat-label">單字本</div></div>
    </section>

    ${extra}
    ${focus}

    <section>
      <h2 class="section-title">今日課表 <small>${plan.doneCount} / ${plan.steps.length} 完成 · 約 ${plan.totalMin} 分鐘</small></h2>
      <ol class="steps">
        ${plan.steps
          .map(
            (st, i) => `
          <li class="step ${st.done ? 'done' : ''}">
            <div class="step-num">${st.done ? icon.check : i + 1}</div>
            <div class="step-body">
              <div class="step-title">${esc(st.title)} <span class="min">${st.min} 分鐘</span></div>
              <div class="step-desc">${esc(st.desc)}</div>
            </div>
            <a class="btn ${st.done ? 'ghost' : 'primary'} small" href="${st.href}">${st.done ? '再練' : '開始'}</a>
          </li>`,
          )
          .join('')}
      </ol>
    </section>
  `;
}
