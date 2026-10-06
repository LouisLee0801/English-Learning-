// 複習（SRS）、Toko 全週挑戰、本週角色扮演
import { esc, shuffle, todayStr } from '../util.js';
import { ALL_LESSONS, getLesson, lessonLabel, tokoItems } from '../data/lessons.js';
import { dayLog, getState, lessonLog, save } from '../store.js';
import { dueCards, markPlan, reviewLessonIds, weekCards, isLessonDone, getPlan } from '../plan.js';
import { review } from '../srs.js';
import { mountDrill } from '../components/drill.js';
import { mountRoleplay } from '../components/roleplay.js';
import { icon } from '../icons.js';
import { rerender } from '../router.js';

const MAX_REVIEW = 30;

const contextIndex = () => {
  const map = new Map();
  ALL_LESSONS.forEach((l) => tokoItems(l).forEach((it) => map.set(it.id, it)));
  return map;
};

function summaryCard(sum, title, links) {
  return `
    <div class="card celebrate">
      <div class="big-emoji">✨</div>
      <h2>${title}</h2>
      <p>答對 <b>${sum.good}</b> / ${sum.total} 題，平均相似度 <b>${Math.round(sum.avg * 100)}%</b></p>
      <div class="btn-row center">${links}</div>
    </div>`;
}

function trackToko(grade) {
  const d = dayLog();
  d.toko.tries += 1;
  if (grade >= 2) d.toko.good += 1;
}

export function renderReview(root, [scope]) {
  const week = scope === 'week';
  const today = todayStr();
  const cards = week ? shuffle(weekCards(today)) : dueCards(today).slice(0, MAX_REVIEW);
  const ctx = contextIndex();
  const items = cards.map((c) => ({ ...(ctx.get(c.id) || {}), id: c.id, en: c.en, zh: c.zh, note: c.note }));

  root.innerHTML = `
    <h1 class="page-title">${week ? '本週卡片總複習' : '間隔複習'} <small>${items.length} 張</small></h1>
    <p class="lede">${week ? '把本週所有句子與片語過一輪，評分會更新下次複習時間。' : '依遺忘曲線安排：答得越輕鬆，下次出現的間隔越長。'}</p>
    <div class="drill-host"></div>`;

  if (!items.length) {
    markPlan(week ? 'weekReview' : 'review');
    root.querySelector('.drill-host').innerHTML = `
      <div class="card empty">
        <div class="big-emoji">☕</div>
        <p>${week ? '本週還沒有完成的課程卡片。' : '今天沒有到期的卡片！'}</p>
        <p class="muted">完成一堂課後，片語與你的台詞會自動加入單字本，隔天開始複習。你也可以在對話中按 ⭐ 收藏任何句子。</p>
        <div class="btn-row center"><a class="btn primary" href="#/">回今日課表</a><a class="btn" href="#/notebook">打開單字本</a></div>
      </div>`;
    return;
  }

  mountDrill(root.querySelector('.drill-host'), {
    items,
    onRate: (item, grade) => {
      const card = getState().notebook[item.id];
      if (card) card.srs = review(card.srs, grade, today);
      dayLog().reviewed += 1;
      trackToko(grade);
      save();
    },
    onDone: (sum) => {
      markPlan(week ? 'weekReview' : 'review');
      root.querySelector('.drill-host').innerHTML = summaryCard(
        sum,
        '複習完成！',
        `<a class="btn primary" href="#/">回今日課表</a><a class="btn" href="#/notebook">看單字本</a>`,
      );
    },
  });
}

export function renderChallenge(root) {
  const today = todayStr();
  let ids = reviewLessonIds(today);
  let scopeText = '本週';
  if (!ids.length) {
    ids = ALL_LESSONS.filter((l) => isLessonDone(l.id)).map((l) => l.id);
    scopeText = '已完成課程';
  }
  const items = shuffle(ids.flatMap((id) => tokoItems(getLesson(id)).filter((it) => !it.phrase))).slice(0, 20);

  root.innerHTML = `
    <h1 class="page-title">Toko 全週挑戰 <small>${scopeText} · ${items.length} 題</small></h1>
    <p class="lede">句子打散、隨機出題。不看英文，聽完對方的話直接用英文接下去。</p>
    <div class="drill-host"></div>`;

  mountDrill(root.querySelector('.drill-host'), {
    items,
    emptyText: '還沒有完成任何課程，先完成第一課再來挑戰吧！',
    onRate: (_item, grade) => {
      trackToko(grade);
      save();
    },
    onDone: (sum) => {
      if (sum.empty) return;
      markPlan('challenge');
      root.querySelector('.drill-host').innerHTML = summaryCard(
        sum,
        '挑戰完成！',
        `<a class="btn primary" href="#/">回今日課表</a><button class="btn" data-again>再挑戰一次</button>`,
      );
      root.querySelector('[data-again]').addEventListener('click', rerender);
    },
  });
}

export function renderRoleplayHub(root, [id]) {
  const today = todayStr();
  const plan = getPlan(today);
  const weekIds = plan.mode === 'weekend' ? plan.weekIds : reviewLessonIds(today);
  const d = dayLog(today);
  const needed = Math.min(2, weekIds.length || 1);

  if (id && getLesson(id)) {
    const lesson = getLesson(id);
    root.innerHTML = `<nav class="crumbs"><a href="#/roleplay">角色扮演</a> / ${esc(lesson.titleZh)}</nav><div class="rp-host"></div>`;
    mountRoleplay(root.querySelector('.rp-host'), lesson, {
      onDone: ({ avg }, stage) => {
        const log = lessonLog(id);
        log.steps.roleplay = true;
        log.best.roleplay = Math.max(log.best.roleplay || 0, avg);
        if (!d.roleplays.includes(id)) d.roleplays.push(id);
        const countDone = d.roleplays.filter((x) => weekIds.includes(x)).length;
        if (countDone >= needed) d.plan.roleplay = true;
        save();
        stage.innerHTML = `
          <div class="card celebrate">
            <div class="big-emoji">🎬</div>
            <h2>That's a wrap!</h2>
            <p>平均相似度 <b>${Math.round(avg * 100)}%</b>。${d.plan.roleplay ? '今日角色扮演任務已完成！' : `再完成 ${needed - countDone} 個場景就達標。`}</p>
            <div class="btn-row center"><a class="btn primary" href="#/roleplay">選下一個場景</a><a class="btn" href="#/">回今日課表</a></div>
          </div>`;
      },
    });
    return;
  }

  const pool = weekIds.length ? weekIds : ALL_LESSONS.map((l) => l.id);
  root.innerHTML = `
    <h1 class="page-title">角色扮演 <small>你是主角</small></h1>
    <p class="lede">${weekIds.length ? `本週場景（完成 ${needed} 個即達成今日任務）` : '還沒有本週完成的課程，可以先挑任何一課試試。'}</p>
    <div class="lesson-grid">
      ${pool
        .map((lid) => {
          const l = getLesson(lid);
          const played = d.roleplays.includes(lid);
          const best = getState().lessons[lid]?.best?.roleplay;
          return `
          <a class="lesson-card card ${played ? 'done' : ''}" href="#/roleplay/${lid}">
            <div class="lesson-card-top"><span class="day">${esc(lessonLabel(l))}</span>${played ? `<span class="done-badge">${icon.check}今天演過</span>` : ''}</div>
            <div class="lesson-title">${esc(l.title)}</div>
            <div class="lesson-zh">${esc(l.titleZh)}</div>
            ${best != null ? `<div class="muted small">最佳 ${Math.round(best * 100)}%</div>` : ''}
          </a>`;
        })
        .join('')}
    </div>`;
}
