import { dayLog, save, settings, subscribe } from './store.js';
import { minutes, todayStr } from './util.js';
import { stopSpeaking } from './speech.js';
import { setRerender } from './router.js';
import { renderToday } from './views/today.js';
import { renderLessons } from './views/lessons.js';
import { renderLesson } from './views/lesson.js';
import { renderReview, renderChallenge, renderRoleplayHub } from './views/practice.js';
import { renderNotebook } from './views/notebook.js';
import { renderHomework } from './views/homework.js';
import { renderProgress } from './views/progress.js';
import { renderSettings } from './views/settings.js';

const ROUTES = {
  '': [renderToday, 'today'],
  lessons: [renderLessons, 'lessons'],
  lesson: [renderLesson, 'lessons'],
  review: [renderReview, 'review'],
  challenge: [renderChallenge, 'review'],
  roleplay: [renderRoleplayHub, 'review'],
  notebook: [renderNotebook, 'notebook'],
  homework: [renderHomework, 'today'],
  progress: [renderProgress, 'progress'],
  settings: [renderSettings, 'settings'],
};

const main = document.getElementById('main');

function route() {
  stopSpeaking();
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [name = '', ...params] = parts;
  const [render, nav] = ROUTES[name] || ROUTES[''];
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === nav));
  const view = document.createElement('div');
  view.className = 'view';
  main.replaceChildren(view);
  try {
    render(view, params.map(decodeURIComponent));
  } catch (e) {
    console.error(e);
    view.innerHTML = `<div class="card empty">頁面載入失敗：${e.message}<br><a href="#/">回首頁</a></div>`;
  }
  window.scrollTo(0, 0);
  updateClock();
}

setRerender(route);
window.addEventListener('hashchange', route);

// ---------- 學習時間追蹤：頁面可見且 2 分鐘內有互動才計時 ----------
const TICK = 10;
let lastActive = Date.now();
['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) =>
  window.addEventListener(ev, () => (lastActive = Date.now()), { passive: true, capture: true }),
);
setInterval(() => {
  if (document.visibilityState !== 'visible') return;
  const speaking = window.speechSynthesis?.speaking;
  if (Date.now() - lastActive > 120000 && !speaking) return;
  dayLog(todayStr()).seconds += TICK;
  save();
}, TICK * 1000);

const clock = document.getElementById('clock');
function updateClock() {
  const m = minutes(dayLog(todayStr()).seconds);
  const goal = settings().dailyGoal;
  clock.textContent = `今日 ${m} / ${goal} 分`;
  clock.classList.toggle('met', m >= goal);
}
subscribe(updateClock);

route();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
