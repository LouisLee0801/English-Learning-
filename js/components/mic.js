// 麥克風按鈕：按一下開始說，說完再按一下結束（停頓不會自動關掉）
import { captureSpeech, canRecognize, canRecord, stopSpeaking } from '../speech.js';
import { icon } from '../icons.js';
import { toast } from '../util.js';

export const micSupported = canRecognize || canRecord;

/** 同一時間只允許一個麥克風在收音 */
let current = null;

/**
 * @param {HTMLButtonElement} btn
 * @param {{ onInterim?: (t:string)=>void, onResult: (r:{text:string,audioUrl:string|null})=>void, record?: boolean, label?: string, hint?: string }} opts
 */
export function bindMic(btn, { onInterim, onResult, record = false, label = '開口說', hint = '' }) {
  let active = null;
  const idle = () => {
    btn.classList.remove('recording');
    btn.innerHTML = `${icon.mic}<span>${label}</span>`;
  };
  idle();
  if (!micSupported) {
    btn.disabled = true;
    btn.title = '此瀏覽器不支援麥克風，請改用打字';
    return;
  }

  async function finish() {
    const session = active;
    if (!session) return;
    active = null;
    if (current?.btn === btn) current = null;
    btn.disabled = true;
    btn.innerHTML = `${icon.mic}<span>處理中⋯</span>`;
    const res = await session.stop();
    btn.disabled = false;
    idle();
    if (btn.isConnected) onResult(res);
  }

  btn.addEventListener('click', async () => {
    if (active) return finish();
    if (current && current.btn !== btn) await current.finish();
    stopSpeaking();
    btn.classList.add('recording');
    btn.innerHTML = `${icon.stop}<span>${canRecognize ? '聆聽中⋯說完按這裡' : '錄音中⋯說完按這裡'}</span>`;
    try {
      const session = await captureSpeech({ onInterim, record, hint });
      active = session;
      current = { btn, finish };
      session.failed.then((failed) => {
        if (failed && active === session) {
          toast('麥克風無法使用：請在瀏覽器網址列允許麥克風權限');
          finish();
        }
      });
    } catch {
      active = null;
      idle();
      toast('無法使用麥克風，請確認瀏覽器權限，或改用打字');
    }
  });
}
