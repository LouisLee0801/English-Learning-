import test from 'node:test';
import assert from 'node:assert/strict';
import { _setState, defaults, getState } from '../js/store.js';
import { getPlan, completeLessonStep, nextLesson, nextHotLesson, streak, reviewLessonIds, dueCards } from '../js/plan.js';
import { LESSONS, HOT_LESSONS, HOT_WEEKS, TOPICS, tokoItems } from '../js/data/lessons.js';
import { todayStr, addDays, isWeekend } from '../js/util.js';

// 預設不設開課日；個別測試再設定
const fresh = (startDate = '') => {
  const s = defaults();
  s.settings.startDate = startDate;
  _setState(s);
};
const finish = (id, day) => ['listen', 'shadow', 'toko'].forEach((step) => completeLessonStep(id, step, day));

test('curriculum: 20 lessons, every lesson has You lines, phrases and accent tips', () => {
  assert.equal(LESSONS.length, 20);
  const ids = new Set();
  for (const l of LESSONS) {
    assert.ok(!ids.has(l.id), `duplicate id ${l.id}`);
    ids.add(l.id);
    assert.ok(l.lines.filter((x) => x.you).length >= 4, `${l.id} needs >= 4 You lines`);
    assert.ok(l.lines.every((x) => x.speaker === 'You' || l.cast[x.speaker]), `${l.id} has a speaker missing from cast`);
    assert.ok(l.phrases.length >= 6, `${l.id} phrases`);
    assert.ok(l.accent.length >= 2, `${l.id} accent`);
    assert.ok(l.homework && l.tip && l.goal && l.scene);
    assert.ok(tokoItems(l).length >= 10);
  }
});

test('weekday plan assigns the next unfinished lesson and is stable for the day', () => {
  fresh();
  const monday = '2026-10-05';
  const plan = getPlan(monday);
  assert.equal(plan.mode, 'weekday');
  assert.equal(plan.lessonId, 'w1d1');
  assert.equal(plan.steps.length, 5);
  assert.equal(plan.totalMin, 30);
  // review step is auto-done when nothing is due
  assert.equal(plan.steps[0].done, true);
  assert.equal(getPlan(monday).lessonId, 'w1d1');
});

test('completing listen + shadow + toko finishes the lesson and seeds the notebook for tomorrow', () => {
  fresh();
  const day = '2026-10-05';
  getPlan(day);
  assert.equal(completeLessonStep('w1d1', 'listen', day), false);
  assert.equal(completeLessonStep('w1d1', 'shadow', day), false);
  assert.equal(completeLessonStep('w1d1', 'toko', day), true);
  assert.equal(nextLesson().id, 'w1d2');
  const nb = Object.values(getState().notebook);
  assert.equal(nb.length, tokoItems(LESSONS[0]).length);
  assert.equal(getPlan(day).doneCount, 4);
  // cards due from tomorrow (relative to the real today used when seeding)
  assert.equal(dueCards(todayStr()).length, 0);
  assert.equal(dueCards(addDays(todayStr(), 1)).length, nb.length);
});

test('weekend plan reviews lessons finished this week; falls back to a lesson when nothing was learned', () => {
  fresh();
  const sat = '2026-10-10';
  assert.ok(isWeekend(sat));
  assert.equal(getPlan(sat).mode, 'weekday');

  fresh();
  ['listen', 'shadow', 'toko'].forEach((s) => completeLessonStep('w1d1', s, '2026-10-06'));
  getState().lessons.w1d1.completedAt = '2026-10-06';
  assert.deepEqual(reviewLessonIds(sat), ['w1d1']);
  const p = getPlan(sat);
  assert.equal(p.mode, 'weekend');
  assert.deepEqual(p.steps.map((s) => s.key), ['weekReview', 'challenge', 'homework']);
  const sun = getPlan('2026-10-11');
  assert.deepEqual(sun.steps.map((s) => s.key), ['roleplay', 'review', 'homework']);
});

test('streak counts consecutive active days', () => {
  fresh();
  const st = getState();
  const t = todayStr();
  st.days[t] = { seconds: 600, plan: {} };
  st.days[addDays(t, -1)] = { seconds: 0, plan: { listen: true } };
  st.days[addDays(t, -2)] = { seconds: 400, plan: {} };
  st.days[addDays(t, -4)] = { seconds: 900, plan: {} };
  assert.equal(streak(t), 3);
});

test('hot topic weeks: valid content, unique ids, sources and known topics', () => {
  assert.ok(HOT_WEEKS.length >= 1);
  const ids = new Set(LESSONS.map((l) => l.id));
  for (const w of HOT_WEEKS) {
    assert.match(w.id, /^\d{4}-W\d{2}$/);
    assert.match(w.publishedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(w.lessons.length >= 3, `${w.id} needs >= 3 lessons`);
  }
  for (const l of HOT_LESSONS) {
    assert.ok(!ids.has(l.id), `duplicate id ${l.id}`);
    ids.add(l.id);
    assert.ok(TOPICS[l.topic], `${l.id} unknown topic ${l.topic}`);
    assert.ok(l.sources.length >= 1 && l.sources.every((s) => /^https:\/\//.test(s.url)), `${l.id} needs https sources`);
    assert.ok(l.lines.filter((x) => x.you).length >= 4, `${l.id} needs >= 4 You lines`);
    assert.ok(l.lines.every((x) => x.speaker === 'You' || l.cast[x.speaker]), `${l.id} speaker missing from cast`);
    assert.ok(l.phrases.length >= 6 && l.accent.length >= 2 && l.homework && l.tip && l.goal && l.scene, `${l.id} incomplete`);
  }
});

test('before the start date the plan is pending', () => {
  fresh('2026-10-07');
  assert.equal(getPlan('2026-10-06').mode, 'pending');
  assert.notEqual(getPlan('2026-10-07').mode, 'pending');
});

test('hot topics run on Tue/Thu while core lessons are in progress', () => {
  fresh('2026-10-07');
  const hot = HOT_LESSONS.find((l) => l.hotWeek === '2026-W41');
  assert.equal(getPlan('2026-10-07').lessonId, 'w1d1'); // Wed -> core
  const thu = getPlan('2026-10-08');
  assert.equal(thu.mode, 'hot');
  assert.equal(thu.lessonId, hot.id);
  finish(hot.id, '2026-10-08');
  assert.equal(getPlan('2026-10-09').lessonId, 'w1d1'); // Fri -> core again
  assert.notEqual(nextHotLesson('2026-10-13').id, hot.id); // next Tue -> next hot lesson
});

test('hot topics expire from the schedule after 3 weeks and fill every weekday after the core course', () => {
  fresh();
  assert.equal(nextHotLesson('2026-11-30'), undefined);
  LESSONS.forEach((l) => finish(l.id, '2026-10-07'));
  assert.equal(getPlan('2026-10-12').mode, 'hot'); // Monday, core done
});
