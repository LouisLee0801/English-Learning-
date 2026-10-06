import { addDays, esc, formatDate, minutes, mondayOf, parseDate, todayStr } from '../util.js';
import { LESSONS, WEEKS } from '../data/lessons.js';
import { getState, settings } from '../store.js';
import { isActiveDay, streak } from '../plan.js';
import { cardStatus } from '../srs.js';
import { icon } from '../icons.js';

const HEAT_WEEKS = 16;
const BAR_WEEKS = 8;

function level(mins, goal) {
  if (!mins) return 0;
  if (mins < goal / 3) return 1;
  if (mins < goal) return 2;
  if (mins < goal * 1.5) return 3;
  return 4;
}

export function renderProgress(root) {
  const st = getState();
  const today = todayStr();
  const goal = settings().dailyGoal;
  const days = st.days;
  const minsOf = (d) => minutes(days[d]?.seconds);

  const totalMin = Object.values(days).reduce((s, d) => s + minutes(d.seconds), 0);
  const activeDays = Object.values(days).filter(isActiveDay).length;
  const thisMonday = mondayOf(today);
  const weekMin = [...Array(7)].reduce((s, _, i) => s + minsOf(addDays(thisMonday, i)), 0);
  const doneLessons = LESSONS.filter((l) => st.lessons[l.id]?.completedAt).length;
  let tries = 0;
  let good = 0;
  for (let i = 0; i < 7; i++) {
    const d = days[addDays(today, -i)];
    tries += d?.toko?.tries || 0;
    good += d?.toko?.good || 0;
  }
  const cards = Object.values(st.notebook);
  const mastered = cards.filter((c) => cardStatus(c.srs) === 'mastered').length;
  const hwDone = Object.values(st.homework).filter((h) => h.done).length;

  // Heatmap：欄 = 週（週一開始），列 = 星期
  const start = addDays(thisMonday, -(HEAT_WEEKS - 1) * 7);
  const cols = [...Array(HEAT_WEEKS)].map((_, w) =>
    [...Array(7)].map((_, d) => {
      const date = addDays(start, w * 7 + d);
      if (date > today) return '<i class="cell future"></i>';
      const m = minsOf(date);
      return `<i class="cell l${level(m, goal)}" title="${formatDate(date)}：${m} 分鐘" tabindex="0" aria-label="${formatDate(date)} ${m} 分鐘"></i>`;
    }),
  );
  const monthLabels = cols
    .map((_, w) => {
      const d = parseDate(addDays(start, w * 7));
      return d.getDate() <= 7 ? `<span style="grid-column:${w + 1}">${d.getMonth() + 1}月</span>` : '';
    })
    .join('');

  // 每週分鐘數
  const weeks = [...Array(BAR_WEEKS)].map((_, i) => {
    const mon = addDays(thisMonday, -(BAR_WEEKS - 1 - i) * 7);
    const total = [...Array(7)].reduce((s, _, k) => s + minsOf(addDays(mon, k)), 0);
    return { mon, total };
  });
  const weekGoal = goal * 7;
  const maxBar = Math.max(weekGoal, ...weeks.map((w) => w.total)) || 1;

  const recent = [...Array(14)].map((_, i) => addDays(today, -i)).filter((d) => days[d]);

  root.innerHTML = `
    <h1 class="page-title">學習進度</h1>
    <section class="stat-row wide">
      <div class="stat"><div class="stat-num">${icon.flame}${streak(today)}</div><div class="stat-label">連續天數</div></div>
      <div class="stat"><div class="stat-num">${weekMin}<small> 分</small></div><div class="stat-label">本週學習</div></div>
      <div class="stat"><div class="stat-num">${totalMin}<small> 分</small></div><div class="stat-label">累積時數（${activeDays} 天）</div></div>
      <div class="stat"><div class="stat-num">${doneLessons}<small>/${LESSONS.length}</small></div><div class="stat-label">完成課程</div></div>
      <div class="stat"><div class="stat-num">${tries ? Math.round((good / tries) * 100) + '%' : '—'}</div><div class="stat-label">近 7 天 Toko 答對率</div></div>
      <div class="stat"><div class="stat-num">${mastered}<small>/${cards.length}</small></div><div class="stat-label">已熟練片語</div></div>
      <div class="stat"><div class="stat-num">${hwDone}</div><div class="stat-label">完成作業</div></div>
    </section>

    <section class="card chart-card">
      <h2 class="chart-title">每日學習熱度 <small>近 ${HEAT_WEEKS} 週 · 目標每天 ${goal} 分鐘</small></h2>
      <div class="heat-wrap">
        <div class="heat-days"><span>一</span><span></span><span>三</span><span></span><span>五</span><span></span><span>日</span></div>
        <div>
          <div class="heat-months" style="grid-template-columns:repeat(${HEAT_WEEKS},minmax(10px,22px))">${monthLabels}</div>
          <div class="heatmap" style="grid-template-columns:repeat(${HEAT_WEEKS},minmax(10px,22px))">${cols.map((c) => `<div class="heat-col">${c.join('')}</div>`).join('')}</div>
        </div>
      </div>
      <div class="legend"><span>少</span><i class="cell l0"></i><i class="cell l1"></i><i class="cell l2"></i><i class="cell l3"></i><i class="cell l4"></i><span>多</span><span class="muted small">（深綠＝達到每日目標）</span></div>
    </section>

    <section class="card chart-card">
      <h2 class="chart-title">每週學習分鐘 <small>近 ${BAR_WEEKS} 週</small></h2>
      ${
        weeks.some((w) => w.total)
          ? ''
          : '<p class="muted small">還沒有學習時數紀錄，開始上課後這裡會長出長條。</p>'
      }
      <div class="bars" role="img" aria-label="近 ${BAR_WEEKS} 週學習分鐘長條圖">
        <div class="plot">
          <div class="bar-goal" style="bottom:${(weekGoal / maxBar) * 100}%"><span>週目標 ${weekGoal} 分</span></div>
          ${weeks
            .map((w) => {
              const d = parseDate(w.mon);
              const h = (w.total / maxBar) * 100;
              return `<div class="bar-col" title="${d.getMonth() + 1}/${d.getDate()} 那週：${w.total} 分鐘">
                <div class="bar" style="height:${h}%">${w.total ? `<span class="bar-val">${w.total}</span>` : ''}</div>
              </div>`;
            })
            .join('')}
        </div>
        <div class="bar-labels">${weeks
          .map((w) => {
            const d = parseDate(w.mon);
            return `<span>${d.getMonth() + 1}/${d.getDate()}</span>`;
          })
          .join('')}</div>
      </div>
    </section>

    <section class="card">
      <h2 class="chart-title">課程進度</h2>
      ${WEEKS.map((w) => {
        const ls = LESSONS.filter((l) => l.week === w.week);
        return `<div class="course-row">
          <div class="course-week">W${w.week}<span class="muted small">${esc(w.titleZh)}</span></div>
          <div class="dots">${ls
            .map((l) => {
              const log = st.lessons[l.id];
              const cls = log?.completedAt ? 'done' : Object.keys(log?.steps || {}).length ? 'partial' : '';
              return `<a class="dot ${cls}" href="#/lesson/${l.id}" title="${esc(l.titleZh)}${log?.completedAt ? '（完成）' : ''}">${l.day}</a>`;
            })
            .join('')}</div>
        </div>`;
      }).join('')}
      <div class="legend"><span class="dot done mini"></span>完成 <span class="dot partial mini"></span>進行中 <span class="dot mini"></span>未開始</div>
    </section>

    <section class="card">
      <h2 class="chart-title">最近 14 天紀錄</h2>
      ${
        recent.length
          ? `<div class="table-wrap"><table class="log-table">
        <thead><tr><th>日期</th><th>分鐘</th><th>課表</th><th>Toko</th><th>跟讀</th><th>複習</th></tr></thead>
        <tbody>${recent
          .map((date) => {
            const d = days[date];
            const steps = Object.values(d.plan || {}).filter(Boolean).length;
            return `<tr><td>${formatDate(date)}</td><td>${minutes(d.seconds)}</td><td>${steps} 步</td>
              <td>${d.toko?.tries ? `${d.toko.good}/${d.toko.tries}` : '—'}</td><td>${d.shadow || 0} 句</td><td>${d.reviewed || 0} 張</td></tr>`;
          })
          .join('')}</tbody></table></div>`
          : '<p class="muted">還沒有紀錄，今天就開始第一堂課吧！</p>'
      }
    </section>
  `;
}
