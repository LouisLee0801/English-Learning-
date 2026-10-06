import { diffDays, esc, fillName, formatDate, minutes, todayStr } from '../util.js';
import { getLesson, HOT_LESSONS, lessonLabel, LESSONS, TOPICS, TRACKS } from '../data/lessons.js';
import { dayLog, getState, settings } from '../store.js';
import { getPlan, nextLesson, streak, dueCards, isLessonDone, HOT_FRESH_DAYS } from '../plan.js';
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

function hotCards(date, excludeId) {
  const fresh = HOT_LESSONS.filter((l) => l.publishedAt <= date && diffDays(l.publishedAt, date) <= HOT_FRESH_DAYS && l.id !== excludeId)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.day - b.day)
    .slice(0, 5);
  if (!fresh.length) return '';
  return `
    <section>
      <h2 class="section-title">本週熱門話題 <small>每週更新 · 跟美國人聊天的最新梗</small></h2>
      <div class="lesson-grid">
        ${fresh
          .map(
            (l) => `
          <a class="lesson-card card hot ${isLessonDone(l.id) ? 'done' : ''}" href="#/lesson/${l.id}">
            <div class="lesson-card-top"><span class="day">${TOPICS[l.topic]?.emoji || ''} ${esc(TOPICS[l.topic]?.label || '')}</span>${isLessonDone(l.id) ? '<span class="done-badge">完成</span>' : ''}</div>
            <div class="lesson-title">${esc(l.title)}</div>
            <div class="lesson-zh">${esc(l.titleZh)}</div>
          </a>`,
          )
          .join('')}
      </div>
    </section>`;
}

function renderPending(root, plan, s) {
  const days = diffDays(todayStr(), plan.startDate);
  const first = LESSONS[0];
  root.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <div class="eyebrow">Countdown · 課程倒數</div>
        <h1>Almost time, <span class="gold">${esc(s.name)}</span>.</h1>
        <p class="lede">正式課表從 <b>${formatDate(plan.startDate)}</b> 開始，${days === 1 ? '就是明天' : `還有 ${days} 天`}。平日每天約 30 分鐘，週末總複習；週二、週四會插入當週的美國熱門話題。</p>
      </div>
    </section>
    <a class="card focus lesson-hero ${first.track}" href="#/lesson/${first.id}">
      <div class="eyebrow">第一堂課預覽 · ${lessonLabel(first)}</div>
      <h2>${esc(first.title)}</h2>
      <div class="title-zh">${esc(first.titleZh)}<span class="loc">📍 ${esc(first.location)}</span></div>
      <p>${esc(fillName(first.scene, s.name))}</p>
      <div class="goal">🎯 ${esc(first.goal)}</div>
    </a>
    <section class="card">
      <h2 class="chart-title">開課前先做好 3 件事</h2>
      <ol class="prep">
        <li>到 <a href="#/settings">設定</a> 填你的英文名字、選一個好聽的美式語音並試聽</li>
        <li>在課程頁按一次「開口說」，允許瀏覽器使用麥克風</li>
        <li>手機用 Safari／Chrome「加入主畫面」，每天一鍵打開</li>
      </ol>
      <p class="muted small">想改開課日？到「設定」調整開始日期。</p>
    </section>
    ${hotCards(plan.startDate)}
  `;
}

export function renderToday(root) {
  const date = todayStr();
  const s = settings();
  const plan = getPlan(date);
  if (plan.mode === 'pending') return renderPending(root, plan, s);
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
        <div class="eyebrow">${esc(lessonLabel(l))} · ${TRACKS[l.track].label}${plan.mode === 'cycle' ? ' · 複習循環' : ''}</div>
        <h2>${esc(l.title)}</h2>
        <div class="title-zh">${esc(l.titleZh)}<span class="loc">📍 ${esc(l.location)}</span></div>
        <p>${esc(fillName(l.scene, s.name))}</p>
        <div class="goal">🎯 ${esc(l.goal)}</div>
      </a>`;
  }

  const lede =
    plan.mode === 'weekend'
      ? '週末不學新課，專心把本週內容練到能脫口而出。'
      : plan.mode === 'hot'
        ? `今天是熱門話題日：${TOPICS[getLesson(plan.lessonId).topic]?.label || ''}。用美國人這週正在聊的話題練 small talk。`
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
    ${plan.mode === 'weekend' ? '' : hotCards(date, plan.lessonId)}
  `;
}
