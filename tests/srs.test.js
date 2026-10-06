import test from 'node:test';
import assert from 'node:assert/strict';
import { newCard, review, cardStatus, isDue } from '../js/srs.js';

const T = '2026-10-06';

test('new card good -> due tomorrow, then 3 days, then grows', () => {
  let c = newCard(T);
  assert.equal(cardStatus(c), 'new');
  c = review(c, 2, T);
  assert.equal(c.due, '2026-10-07');
  c = review(c, 2, '2026-10-07');
  assert.equal(c.interval, 3);
  c = review(c, 2, '2026-10-10');
  assert.ok(c.interval >= 7);
  assert.equal(cardStatus(c), 'learning');
});

test('again resets and keeps the card due today', () => {
  let c = review(review(newCard(T), 3, T), 0, T);
  assert.equal(c.reps, 0);
  assert.equal(c.lapses, 1);
  assert.ok(isDue(c, T));
  assert.ok(c.ease < 2.6);
});

test('ease never drops below 1.3', () => {
  let c = newCard(T);
  for (let i = 0; i < 20; i++) c = review(c, 0, T);
  assert.equal(c.ease, 1.3);
});

test('card becomes mastered after long interval', () => {
  let c = newCard(T);
  let day = T;
  for (let i = 0; i < 6; i++) {
    c = review(c, 3, day);
    day = c.due;
  }
  assert.equal(cardStatus(c), 'mastered');
});
