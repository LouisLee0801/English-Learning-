const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

export const diffDays = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
export const weekday = (s) => parseDate(s).getDay();
export const isWeekend = (s) => [0, 6].includes(weekday(s));

/** 該日期所在週的週一 */
export function mondayOf(s) {
  const wd = weekday(s);
  return addDays(s, wd === 0 ? -6 : 1 - wd);
}

const WD = ['日', '一', '二', '三', '四', '五', '六'];
export function formatDate(s) {
  const d = parseDate(s);
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日（週${WD[d.getDay()]}）`;
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const fillName = (text, name) => String(text).replaceAll('{name}', name || 'Alex');

export function minutes(seconds) {
  return Math.floor((seconds || 0) / 60);
}

export function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, 2200);
}
