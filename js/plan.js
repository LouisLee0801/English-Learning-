// 每日課表、課程完成判定、單字本與連續天數
import { ALL_LESSONS, HOT_LESSONS, LESSONS, getLesson, tokoItems } from './data/lessons.js';
import { getState, dayLog, lessonLog, save, settings } from './store.js';
import { addDays, diffDays, isWeekend, mondayOf, todayStr, weekday } from './util.js';
import { isDue, newCard } from './srs.js';

/** 一堂課完成的必要步驟（角色扮演是加分題） */
export const LESSON_STEPS = ['listen', 'shadow', 'toko'];

export const isLessonDone = (id) => !!getState().lessons[id]?.completedAt;
export const nextLesson = () => LESSONS.find((l) => !isLessonDone(l.id));

/** 核心課程進行中，週二、週四上熱門話題；核心課全部完成後，平日都上熱門話題 */
export const HOT_DAYS = [2, 4];
/** 熱門話題發布後幾天內會排進課表（之後仍可在課程地圖自由練習） */
export const HOT_FRESH_DAYS = 21;

export function nextHotLesson(date = todayStr()) {
  return HOT_LESSONS.filter((l) => !isLessonDone(l.id) && l.publishedAt <= date && diffDays(l.publishedAt, date) <= HOT_FRESH_DAYS).sort(
    (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.day - b.day,
  )[0];
}

export const isBeforeStart = (date = todayStr()) => !!settings().startDate && date < settings().startDate;

/** 週末複習範圍：本週完成的課；若本週沒上課，往前抓 14 天 */
export function reviewLessonIds(date = todayStr()) {
  const st = getState();
  const inRange = (from) =>
    ALL_LESSONS.filter((l) => {
      const c = st.lessons[l.id]?.completedAt;
      return c && c >= from && c <= date;
    }).map((l) => l.id);
  const thisWeek = inRange(mondayOf(date));
  return thisWeek.length ? thisWeek : inRange(addDays(date, -13));
}

/** 今天指定的課：沿用當天已指派的課，否則取下一堂未完成；全部完成後進入複習循環 */
export function todayLessonId(date = todayStr()) {
  const d = dayLog(date);
  if (d.lessonId && getLesson(d.lessonId)) return d.lessonId;
  const next = nextLesson();
  const hot = nextHotLesson(date);
  let id;
  if (hot && (!next || HOT_DAYS.includes(weekday(date)))) id = hot.id;
  else if (next) id = next.id;
  else {
    const st = getState();
    const last = (l) => st.lessons[l.id]?.lastPracticed || '';
    id = [...ALL_LESSONS].sort((a, b) => last(a).localeCompare(last(b)))[0].id;
  }
  d.lessonId = id;
  save();
  return id;
}

export function dueCards(date = todayStr()) {
  return Object.values(getState().notebook)
    .filter((c) => isDue(c.srs, date))
    .sort((a, b) => a.srs.due.localeCompare(b.srs.due));
}

export function weekCards(date = todayStr()) {
  const ids = new Set(reviewLessonIds(date));
  return Object.values(getState().notebook).filter((c) => ids.has(c.source));
}

export function getPlan(date = todayStr()) {
  if (isBeforeStart(date)) {
    return { date, mode: 'pending', startDate: settings().startDate, steps: [], doneCount: 0, totalMin: 0 };
  }
  const d = dayLog(date);
  const weekIds = isWeekend(date) ? reviewLessonIds(date) : [];
  const due = dueCards(date).length;

  if (weekIds.length) {
    const saturday = weekday(date) === 6;
    const steps = saturday
      ? [
          { key: 'weekReview', title: '本週卡片總複習', desc: `本週 ${weekIds.length} 課的句子與片語全部過一輪`, min: 15, href: '#/review/week' },
          { key: 'challenge', title: 'Toko 全週挑戰', desc: '本週句子隨機出題：看中文、直接說英文', min: 20, href: '#/challenge' },
          { key: 'homework', title: '週末作業：寫一段自己的對話', desc: '把本週片語用在你的真實生活', min: 10, href: '#/homework' },
        ]
      : [
          { key: 'roleplay', title: '角色扮演 × 本週場景', desc: '你演主角，對方由 AI 語音演出，完成 2 個場景', min: 25, href: '#/roleplay' },
          { key: 'review', title: '到期卡片複習', desc: due ? `${due} 張卡片到期` : '今天沒有到期卡片', min: 10, href: '#/review', auto: !due },
          { key: 'homework', title: '週回顧作業', desc: '錄一段 60 秒的英文週回顧', min: 10, href: '#/homework' },
        ];
    return finalize({ date, mode: 'weekend', saturday, weekIds, steps, d });
  }

  const lessonId = todayLessonId(date);
  const lesson = getLesson(lessonId);
  const steps = [
    { key: 'review', title: '暖身複習', desc: due ? `${due} 張卡片到期，看中文說英文` : '今天沒有到期卡片，直接進新課', min: 5, href: '#/review', auto: !due },
    { key: 'listen', title: '聽懂對話', desc: '逐句聽、看中英對照、記下重點片語', min: 7, href: `#/lesson/${lessonId}/listen` },
    { key: 'shadow', title: '跟讀模仿', desc: '模仿美國腔的連音與語調，錄音比對', min: 7, href: `#/lesson/${lessonId}/shadow` },
    { key: 'toko', title: 'Toko 中翻英', desc: '看中文，開口說出整句英文', min: 8, href: `#/lesson/${lessonId}/toko` },
    { key: 'homework', title: '今日作業', desc: lesson.homework.slice(0, 34) + '…', min: 3, href: '#/homework' },
  ];
  const mode = lesson.track === 'trending' ? 'hot' : !nextLesson() && isLessonDone(lessonId) ? 'cycle' : 'weekday';
  return finalize({ date, mode, lessonId, steps, d });
}

function finalize(plan) {
  const { d } = plan;
  plan.steps.forEach((s) => {
    s.done = !!d.plan[s.key] || !!s.auto;
  });
  plan.doneCount = plan.steps.filter((s) => s.done).length;
  plan.totalMin = plan.steps.reduce((sum, s) => sum + s.min, 0);
  delete plan.d;
  return plan;
}

export function markPlan(key, date = todayStr()) {
  dayLog(date).plan[key] = true;
  save();
}

/** 完成課程中的一個步驟。回傳 true 表示整堂課剛好完成 */
export function completeLessonStep(lessonId, step, date = todayStr()) {
  const l = lessonLog(lessonId);
  l.steps[step] = true;
  l.lastPracticed = date;
  const d = dayLog(date);
  if (d.lessonId === lessonId) d.plan[step] = true;
  let justCompleted = false;
  if (!l.completedAt && LESSON_STEPS.every((s) => l.steps[s])) {
    l.completedAt = date;
    addLessonToNotebook(lessonId);
    justCompleted = true;
  }
  save();
  return justCompleted;
}

export function addToNotebook(item, { auto = false, due = todayStr() } = {}) {
  const nb = getState().notebook;
  if (nb[item.id]) return false;
  nb[item.id] = {
    id: item.id,
    en: item.en,
    zh: item.zh,
    note: item.note || '',
    source: item.lessonId || 'custom',
    auto,
    createdAt: todayStr(),
    srs: newCard(due),
  };
  return true;
}

export function toggleNotebook(item) {
  const nb = getState().notebook;
  if (nb[item.id]) delete nb[item.id];
  else addToNotebook(item);
  save();
  return !!nb[item.id];
}

/** 課程完成時，自動把片語與你的台詞加入單字本，明天開始複習 */
export function addLessonToNotebook(lessonId) {
  const lesson = getLesson(lessonId);
  const tomorrow = addDays(todayStr(), 1);
  tokoItems(lesson).forEach((item) => addToNotebook(item, { auto: true, due: tomorrow }));
}

export function isActiveDay(d) {
  return !!d && ((d.seconds || 0) >= 300 || Object.values(d.plan || {}).some(Boolean));
}

export function streak(date = todayStr()) {
  const days = getState().days;
  let cur = isActiveDay(days[date]) ? date : addDays(date, -1);
  let n = 0;
  while (isActiveDay(days[cur])) {
    n += 1;
    cur = addDays(cur, -1);
  }
  return n;
}
