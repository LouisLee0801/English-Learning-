// 英文答案比對：展開縮寫、忽略大小寫與標點，用 LCS 算出相似度與逐字標示
import { esc } from './util.js';

const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are',
  "it's": 'it is', "that's": 'that is', "there's": 'there is', "what's": 'what is',
  "here's": 'here is', "he's": 'he is', "she's": 'she is', "who's": 'who is',
  "how's": 'how is', "where's": 'where is', "let's": 'let us', "everyone's": 'everyone is',
  "i'll": 'i will', "you'll": 'you will', "we'll": 'we will', "they'll": 'they will',
  "it'll": 'it will', "that'll": 'that will', "i'd": 'i would', "you'd": 'you would',
  "we'd": 'we would', "that'd": 'that would', "i've": 'i have', "you've": 'you have',
  "we've": 'we have', "they've": 'they have', "can't": 'can not', cannot: 'can not',
  "won't": 'will not', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not',
  "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not',
  "couldn't": 'could not', "wouldn't": 'would not', "shouldn't": 'should not',
  "haven't": 'have not', "hasn't": 'has not', gonna: 'going to', wanna: 'want to',
  gotta: 'got to', ok: 'okay', 'o.k.': 'okay', "y'all": 'you all',
};

const NUMBERS = {
  '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '10': 'ten',
  '15': 'fifteen', '20': 'twenty', '22': 'twenty two',
};

export function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\.\.\.|…/g, ' ')
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => {
      const word = w.replace(/^'+|'+$/g, '');
      const expanded = CONTRACTIONS[word] || NUMBERS[word] || word;
      return expanded.split(' ');
    })
    .filter(Boolean);
}

function lcsMatches(a, b) {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const hitA = new Array(n).fill(false);
  const hitB = new Array(m).fill(false);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      hitA[i] = hitB[j] = true;
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return { count: dp[0][0], hitA, hitB };
}

/** 目標句與回答之間有幾個字對得上（用來挑語音辨識的最佳候選） */
export function matchCount(target, answer) {
  const a = tokenize(target);
  const b = tokenize(answer);
  return { count: lcsMatches(a, b).count, answerLen: b.length };
}

/**
 * 比對使用者答案與標準答案。
 * 回傳 { score: 0–1, targetHtml, answerHtml }，標準答案中沒說到的字會被標示。
 */
export function compare(target, answer) {
  const words = String(target).split(/\s+/).filter(Boolean);
  const targetTokens = [];
  const owner = [];
  words.forEach((w, wi) => {
    tokenize(w).forEach((t) => {
      targetTokens.push(t);
      owner.push(wi);
    });
  });
  const answerWords = String(answer || '').split(/\s+/).filter(Boolean);
  const answerTokens = [];
  const answerOwner = [];
  answerWords.forEach((w, wi) => {
    tokenize(w).forEach((t) => {
      answerTokens.push(t);
      answerOwner.push(wi);
    });
  });

  const { count, hitA, hitB } = lcsMatches(targetTokens, answerTokens);
  const total = targetTokens.length + answerTokens.length;
  const score = total ? (2 * count) / total : 0;

  const wordHit = words.map(() => true);
  const wordHasToken = words.map(() => false);
  owner.forEach((wi, ti) => {
    wordHasToken[wi] = true;
    if (!hitA[ti]) wordHit[wi] = false;
  });
  const targetHtml = words
    .map((w, wi) => (!wordHasToken[wi] || wordHit[wi] ? esc(w) : `<mark class="miss">${esc(w)}</mark>`))
    .join(' ');

  const ansHit = answerWords.map(() => true);
  answerOwner.forEach((wi, ti) => {
    if (!hitB[ti]) ansHit[wi] = false;
  });
  const answerHtml = answerWords
    .map((w, wi) => (ansHit[wi] ? esc(w) : `<mark class="extra">${esc(w)}</mark>`))
    .join(' ');

  return { score, targetHtml, answerHtml };
}

export function scoreLabel(score) {
  if (score >= 0.9) return { text: 'Nailed it! 幾乎完美', cls: 'great' };
  if (score >= 0.7) return { text: 'So close! 很接近了', cls: 'good' };
  if (score >= 0.4) return { text: 'Getting there 方向對了', cls: 'ok' };
  return { text: 'Keep going 再聽一次', cls: 'low' };
}

/** 提示：每個字只顯示第一個字母（Toko 式提示） */
export function hint(text) {
  return String(text)
    .split(/\s+/)
    .map((w) => w.replace(/([A-Za-z])([A-Za-z'’]*)/, (_, first, rest) => first + rest.replace(/[A-Za-z]/g, '_')))
    .join(' ');
}

/** 由分數建議的評分等級 */
export function suggestedGrade(score) {
  if (score >= 0.95) return 3;
  if (score >= 0.75) return 2;
  if (score >= 0.5) return 1;
  return 0;
}
