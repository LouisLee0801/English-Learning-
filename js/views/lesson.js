import { esc, fillName } from '../util.js';
import { getLesson, lessonLabel, tokoItems, TRACKS } from '../data/lessons.js';
import { dayLog, lessonLog, save, settings } from '../store.js';
import { completeLessonStep, getPlan } from '../plan.js';
import { icon } from '../icons.js';
import { mountDialogue } from '../components/dialogue.js';
import { mountShadow } from '../components/shadow.js';
import { mountDrill } from '../components/drill.js';
import { mountRoleplay } from '../components/roleplay.js';

const TABS = [
  { key: 'listen', label: '聽懂對話', n: '1' },
  { key: 'shadow', label: '跟讀模仿', n: '2' },
  { key: 'toko', label: 'Toko 中翻英', n: '3' },
  { key: 'roleplay', label: '角色扮演', n: '★' },
];

export function renderLesson(root, [id, tab = 'listen']) {
  const lesson = getLesson(id);
  if (!lesson) {
    root.innerHTML = '<div class="card empty">找不到這堂課。<a href="#/lessons">回課程地圖</a></div>';
    return;
  }
  const log = lessonLog(id);
  const name = settings().name;
  const isToday = getPlan().lessonId === id;

  root.innerHTML = `
    <nav class="crumbs"><a href="#/lessons">課程地圖</a> / ${esc(lessonLabel(lesson))}${isToday ? ' · <span class="gold">今日課程</span>' : ''}</nav>
    <header class="lesson-header ${lesson.track}">
      <div class="eyebrow">${TRACKS[lesson.track].en} · ${esc(lesson.location)}</div>
      <h1>${esc(lesson.title)} <small>${esc(lesson.titleZh)}</small></h1>
      <p>${esc(fillName(lesson.scene, name))}</p>
      <div class="goal">🎯 ${esc(lesson.goal)}</div>
    </header>
    <div class="tabs" role="tablist">
      ${TABS.map(
        (t) => `<a role="tab" class="tab ${t.key === tab ? 'active' : ''} ${log.steps[t.key] ? 'done' : ''}" href="#/lesson/${id}/${t.key}">
          <span class="tab-n">${log.steps[t.key] ? icon.check : t.n}</span>${t.label}</a>`,
      ).join('')}
    </div>
    <div class="tab-panel"></div>
  `;
  const panel = root.querySelector('.tab-panel');
  const go = (t) => (location.hash = `#/lesson/${id}/${t}`);

  if (tab === 'listen') {
    mountDialogue(panel, lesson, {
      done: !!log.steps.listen,
      onComplete: () => {
        completeLessonStep(id, 'listen');
        go('shadow');
      },
    });
  } else if (tab === 'shadow') {
    mountShadow(panel, lesson, {
      done: !!log.steps.shadow,
      onComplete: () => {
        completeLessonStep(id, 'shadow');
        go('toko');
      },
    });
  } else if (tab === 'toko') {
    panel.innerHTML = `<div class="howto card"><b>Toko 模式：</b>看中文 → 不看英文、直接開口說 → 對答案 → 自評。有對方台詞時會先播放，像真的在對話一樣。<span class="muted small">鍵盤：Enter 對答案、1–4 自評。</span></div><div class="drill-host"></div>`;
    mountDrill(panel.querySelector('.drill-host'), {
      items: tokoItems(lesson),
      onRate: (_item, grade) => {
        const d = dayLog();
        d.toko.tries += 1;
        if (grade >= 2) d.toko.good += 1;
        save();
      },
      onDone: (sum) => {
        log.best.toko = Math.max(log.best.toko || 0, sum.avg);
        const justCompleted = completeLessonStep(id, 'toko');
        const lessonDone = !!lessonLog(id).completedAt;
        panel.innerHTML = `
          <div class="card celebrate">
            <div class="big-emoji">${justCompleted ? '🎉' : '👏'}</div>
            <h2>${justCompleted ? '本課完成！' : 'Toko 練習完成'}</h2>
            <p>一次答對 <b>${sum.good}</b> / ${sum.total} 題，平均相似度 <b>${Math.round(sum.avg * 100)}%</b></p>
            ${justCompleted ? '<p class="muted">本課的片語和你的台詞已自動加入單字本，明天開始間隔複習。</p>' : ''}
            ${!lessonDone ? '<p class="muted">還差「聽懂對話」或「跟讀模仿」步驟，完成後這課就算結業。</p>' : ''}
            <div class="btn-row center">
              <a class="btn primary" href="#/homework">寫今日作業</a>
              <a class="btn" href="#/lesson/${id}/roleplay">挑戰角色扮演</a>
              <a class="btn" href="#/lesson/${id}/toko" data-again>再練一次</a>
              <a class="btn ghost" href="#/">回今日課表</a>
            </div>
          </div>`;
        panel.querySelector('[data-again]').addEventListener('click', (e) => {
          e.preventDefault();
          renderLesson(root, [id, 'toko']);
        });
      },
    });
  } else if (tab === 'roleplay') {
    mountRoleplay(panel, lesson, {
      onDone: ({ avg }, stage) => {
        log.steps.roleplay = true;
        log.best.roleplay = Math.max(log.best.roleplay || 0, avg);
        const d = dayLog();
        if (!d.roleplays.includes(id)) d.roleplays.push(id);
        save();
        stage.innerHTML = `
          <div class="card celebrate">
            <div class="big-emoji">🎬</div>
            <h2>That's a wrap!</h2>
            <p>你的台詞平均相似度 <b>${Math.round(avg * 100)}%</b>（最佳紀錄 ${Math.round(log.best.roleplay * 100)}%）</p>
            <div class="btn-row center">
              <a class="btn primary" href="#/lesson/${id}/roleplay" data-again>再演一次</a>
              <a class="btn" href="#/">回今日課表</a>
            </div>
          </div>`;
        stage.querySelector('[data-again]').addEventListener('click', (e) => {
          e.preventDefault();
          renderLesson(root, [id, 'roleplay']);
        });
      },
    });
  }
}
