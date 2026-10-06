import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, tokenize, hint } from '../js/text.js';

test('tokenize expands contractions and ignores punctuation', () => {
  assert.deepEqual(tokenize("I'm starving!"), ['i', 'am', 'starving']);
  assert.deepEqual(tokenize('I’ll go with that.'), ['i', 'will', 'go', 'with', 'that']);
  assert.deepEqual(tokenize("I'm gonna try"), ['i', 'am', 'going', 'to', 'try']);
});

test('compare: identical meaning with contraction differences scores 100%', () => {
  const r = compare("That's so kind of you.", 'that is so kind of you');
  assert.equal(r.score, 1);
  assert.ok(!r.targetHtml.includes('mark'));
});

test('compare: marks missing words in target and extra words in answer', () => {
  const r = compare('Can I get a large iced latte, please?', 'can I get large hot latte');
  assert.ok(r.score > 0.5 && r.score < 1);
  assert.match(r.targetHtml, /<mark class="miss">a<\/mark>/);
  assert.match(r.targetHtml, /<mark class="miss">iced<\/mark>/);
  assert.match(r.answerHtml, /<mark class="extra">hot<\/mark>/);
});

test('compare: empty answer scores 0 and escapes html', () => {
  const r = compare('<b>Hi</b>', '');
  assert.equal(r.score, 0);
  assert.ok(!r.targetHtml.includes('<b>'));
});

test('hint keeps first letter of each word', () => {
  assert.equal(hint('Sounds like a plan!'), 'S_____ l___ a p___!');
});
