// 麥克風按鈕：按一下開始說，再按一下（或停頓）自動結束
import { captureSpeech, canRecognize, canRecord, stopSpeaking } from '../speech.js';
import { icon } from '../icons.js';
import { toast } from '../util.js';

export const micSupported = canRecognize || canRecord;

/**
 * @param {HTMLButtonElement} btn
 * @param {{ onInterim?: (t:string)=>void, onResult: (r:{text:string,audioUrl:string|null})=>void, record?: boolean, label?: string }} opts
 */
export function bindMic(btn, { onInterim, onResult, record = true, label = '開口說' }) {
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
  const finish = async (p) => {
    const cur = active;
    active = null;
    idle();
    if (!cur) return;
    const res = await p;
    onResult(res);
  };
  btn.addEventListener('click', async () => {
    if (active) {
      finish(active.stop());
      return;
    }
    stopSpeaking();
    btn.classList.add('recording');
    btn.innerHTML = `${icon.stop}<span>${canRecognize ? '聆聽中…點此結束' : '錄音中…點此結束'}</span>`;
    try {
      const session = await captureSpeech({ onInterim, record });
      active = session;
      session.done?.then(() => {
        if (active === session) finish(session.stop());
      });
    } catch (e) {
      active = null;
      idle();
      toast('無法使用麥克風，請確認瀏覽器權限，或改用打字');
    }
  });
}
