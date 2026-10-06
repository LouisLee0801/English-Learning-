import { esc, todayStr, toast } from '../util.js';
import { exportData, importData, resetAll, settings, update } from '../store.js';
import { genderOf, onVoices, speak, usVoices, canSpeak, canRecognize } from '../speech.js';
import { rerender } from '../router.js';

const SAMPLE = "Hey! It's so nice to finally meet you. What brings you to town?";

export function renderSettings(root) {
  const s = settings();

  const voiceOptions = (gender, selected) => {
    const list = usVoices();
    const sorted = [...list.filter((v) => genderOf(v) === gender), ...list.filter((v) => genderOf(v) !== gender)];
    return `<option value="">自動選擇最佳美式${gender === 'f' ? '女聲' : '男聲'}</option>${sorted
      .map((v) => `<option value="${esc(v.name)}" ${v.name === selected ? 'selected' : ''}>${esc(v.name)}${genderOf(v) === '?' ? '' : genderOf(v) === 'f' ? '（女）' : '（男）'}</option>`)
      .join('')}`;
  };

  root.innerHTML = `
    <h1 class="page-title">設定</h1>

    <section class="card form">
      <h2 class="chart-title">個人</h2>
      <label>你的英文名字（對話中會用到）<input name="name" value="${esc(s.name)}" maxlength="24"></label>
      <label>課表開始日（之前只能預覽）<input type="date" name="startDate" value="${esc(s.startDate || '')}"></label>
      <label>每日學習目標
        <select name="dailyGoal">${[15, 20, 30, 45, 60].map((m) => `<option value="${m}" ${m === s.dailyGoal ? 'selected' : ''}>${m} 分鐘</option>`).join('')}</select>
      </label>
    </section>

    <section class="card form">
      <h2 class="chart-title">美式發音</h2>
      ${!canSpeak ? '<div class="notice">此瀏覽器不支援語音合成，請改用 Chrome、Edge 或 Safari。</div>' : ''}
      <p class="muted small">語音來自你的裝置。最自然的美國腔：<b>Edge</b> 的 Microsoft Aria / Jenny / Guy（Natural）；<b>Mac / iPhone</b> 可到「設定 → 輔助使用 → 朗讀內容 → 聲音 → 英文（美國）」下載 Ava、Evan（進階）；<b>Chrome</b> 有 Google US English。</p>
      <label>女性角色語音<select name="voiceF">${voiceOptions('f', s.voiceF)}</select></label>
      <label>男性角色語音<select name="voiceM">${voiceOptions('m', s.voiceM)}</select></label>
      <label>「你」的台詞使用
        <select name="youGender"><option value="f" ${s.youGender === 'f' ? 'selected' : ''}>女聲</option><option value="m" ${s.youGender === 'm' ? 'selected' : ''}>男聲</option></select>
      </label>
      <label>語速 <span data-rate-val>${s.rate.toFixed(2)}×</span>
        <input type="range" name="rate" min="0.6" max="1.3" step="0.05" value="${s.rate}">
      </label>
      <div class="btn-row">
        <button class="btn" data-test="f">試聽女聲</button>
        <button class="btn" data-test="m">試聽男聲</button>
      </div>
      <p class="muted small">語音辨識（開口說、跟讀）：${canRecognize ? '✅ 此瀏覽器支援' : '⚠️ 此瀏覽器不支援，請改用 Chrome、Edge 或 Safari，或用打字作答'}</p>
    </section>

    <section class="card form">
      <h2 class="chart-title">資料備份</h2>
      <p class="muted small">學習紀錄只存在這台裝置的瀏覽器裡。換裝置或清除瀏覽資料前，記得先匯出備份。</p>
      <div class="btn-row">
        <button class="btn" data-act="export">匯出備份（JSON）</button>
        <label class="btn file-btn">匯入備份<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        <button class="btn danger" data-act="reset">清除所有紀錄</button>
      </div>
    </section>
  `;

  root.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.act === 'import') {
      const file = el.files?.[0];
      if (!file) return;
      file.text().then((txt) => {
        try {
          importData(txt);
          toast('匯入成功');
          rerender();
        } catch (err) {
          toast('匯入失敗：' + err.message);
        }
      });
      return;
    }
    if (!el.name) return;
    update((st) => {
      const v = el.value;
      if (el.name === 'dailyGoal') st.settings.dailyGoal = Number(v);
      else if (el.name === 'rate') st.settings.rate = Number(v);
      else if (el.name === 'name') st.settings.name = v.trim() || 'Alex';
      else st.settings[el.name] = v;
    });
    toast('已儲存');
  });

  root.querySelector('[name="rate"]').addEventListener('input', (e) => {
    root.querySelector('[data-rate-val]').textContent = `${Number(e.target.value).toFixed(2)}×`;
  });

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.test) speak(SAMPLE, { gender: btn.dataset.test });
    else if (btn.dataset.act === 'export') {
      const blob = new Blob([exportData()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `small-talk-society-${todayStr()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } else if (btn.dataset.act === 'reset') {
      if (confirm('確定要清除所有學習紀錄嗎？此動作無法復原（建議先匯出備份）。')) {
        resetAll();
        toast('已清除');
        rerender();
      }
    }
  });

  // 語音清單可能晚一點才載入
  const off = onVoices(() => {
    if (!root.isConnected) return off();
    const st = settings();
    root.querySelector('[name="voiceF"]').innerHTML = voiceOptions('f', st.voiceF);
    root.querySelector('[name="voiceM"]').innerHTML = voiceOptions('m', st.voiceM);
  });
}
