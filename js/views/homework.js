import { esc, fillName, formatDate, todayStr, toast, weekday } from '../util.js';
import { getLesson } from '../data/lessons.js';
import { getState, save, settings } from '../store.js';
import { getPlan, markPlan } from '../plan.js';
import { listen, canRecognize } from '../speech.js';
import { icon } from '../icons.js';
import { rerender } from '../router.js';

const WEEKEND_PROMPTS = {
  6: '週末作業 A：用本週至少 5 個片語，寫一段 6–8 句、發生在你真實生活中的英文對話（例如：跟外國同事午餐、帶客戶逛台北、在國外餐廳點餐）。寫完後大聲念 3 遍。',
  0: '週回顧作業：用英文錄一段 60 秒的語音（用手機錄就好），內容是「這週學到最有用的 3 個片語，以及你打算在什麼場合用」。把講稿寫在下面。',
};

function todayHomework(date) {
  const plan = getPlan(date);
  if (plan.mode === 'weekend') {
    const phrases = plan.weekIds.flatMap((id) => getLesson(id).phrases.map((p) => p.en));
    return { prompt: WEEKEND_PROMPTS[weekday(date)], lessonId: null, phrases };
  }
  const lesson = getLesson(plan.lessonId);
  return { prompt: lesson.homework, lessonId: lesson.id, phrases: lesson.phrases.map((p) => p.en), lesson };
}

export function renderHomework(root) {
  const date = todayStr();
  const st = getState();
  const hw = todayHomework(date);
  const entry = (st.homework[date] ||= { prompt: hw.prompt, lessonId: hw.lessonId, text: '', done: false });
  entry.prompt = hw.prompt;
  entry.lessonId = hw.lessonId;

  const history = Object.entries(st.homework)
    .filter(([d, h]) => d !== date && (h.text || h.done))
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 14);

  root.innerHTML = `
    <h1 class="page-title">今日作業 <small>${formatDate(date)}</small></h1>
    <div class="card homework">
      ${hw.lesson ? `<div class="eyebrow">${esc(hw.lesson.title)} · ${esc(hw.lesson.titleZh)}</div>` : '<div class="eyebrow">Weekend Assignment</div>'}
      <p class="hw-prompt">${esc(fillName(hw.prompt, settings().name))}</p>
      <details class="hw-ref"><summary>可以用的片語（${hw.phrases.length}）</summary>
        <div class="chips">${hw.phrases.map((p) => `<span class="chip">${esc(p)}</span>`).join('')}</div>
      </details>
      <label class="sr-only" for="hw-text">作業內容</label>
      <textarea id="hw-text" rows="8" placeholder="在這裡寫下你的英文⋯也可以按「口述輸入」用說的。">${esc(entry.text)}</textarea>
      <div class="btn-row">
        ${canRecognize ? `<button class="btn" data-act="dictate">${icon.mic}<span>口述輸入</span></button>` : ''}
        <button class="btn primary" data-act="done">${entry.done ? `${icon.check}<span>已完成（更新內容）</span>` : '完成作業'}</button>
        <span class="muted small" data-saved></span>
      </div>
    </div>

    ${
      history.length
        ? `<h2 class="section-title">作業紀錄 <small>最近 ${history.length} 筆</small></h2>
      <div class="hw-history">
        ${history
          .map(
            ([d, h]) => `
          <details class="card hw-past">
            <summary><span>${formatDate(d)}</span>${h.done ? `<span class="done-badge">${icon.check}完成</span>` : '<span class="muted small">未完成</span>'}</summary>
            <p class="muted small">${esc(h.prompt)}</p>
            <div class="hw-text">${esc(h.text) || '<span class="muted">（沒有內容）</span>'}</div>
          </details>`,
          )
          .join('')}
      </div>`
        : ''
    }
  `;

  const ta = root.querySelector('#hw-text');
  const savedEl = root.querySelector('[data-saved]');
  let timer;
  ta.addEventListener('input', () => {
    entry.text = ta.value;
    clearTimeout(timer);
    timer = setTimeout(() => {
      save();
      savedEl.textContent = '已自動儲存';
    }, 600);
  });

  let session = null;
  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.act === 'done') {
      entry.text = ta.value;
      entry.done = true;
      save();
      markPlan('homework', date);
      toast('作業完成！Great job 🎉');
      rerender();
    } else if (btn.dataset.act === 'dictate') {
      if (session) {
        session.stop();
        return;
      }
      const base = ta.value ? ta.value.replace(/\s*$/, ' ') : '';
      btn.classList.add('recording');
      btn.innerHTML = `${icon.stop}<span>聆聽中⋯點此結束</span>`;
      session = listen({ onInterim: (t) => (ta.value = base + t) });
      try {
        const text = await session.promise;
        ta.value = base + text;
      } catch {
        toast('無法使用麥克風，請確認權限');
      }
      session = null;
      entry.text = ta.value;
      save();
      btn.classList.remove('recording');
      btn.innerHTML = `${icon.mic}<span>口述輸入</span>`;
    }
  });
}
