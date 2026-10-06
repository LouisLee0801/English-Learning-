import test from 'node:test';
import assert from 'node:assert/strict';
import { _setState, defaults, getState } from '../js/store.js';
import { getPlan, completeLessonStep, nextLesson, streak, reviewLessonIds, dueCards } from '../js/plan.js';
import { LESSONS, tokoItems } from '../js/data/lessons.js';
import { todayStr, addDays, isWeekend } from '../js/util.js';

const fresh = () => _setState(defaults());

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
