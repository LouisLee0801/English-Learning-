// 美式發音（Web Speech API 語音合成）、語音辨識、錄音
import { settings } from './store.js';
import { matchCount } from './text.js';

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
let voices = [];
const voiceListeners = new Set();

const FEMALE = /aria|jenny|ava|samantha|allison|susan|zira|emma|michelle|ana\b|nicky|joanna|salli|kendra|kimberly|ivy|nancy|sara|libby|elizabeth|female|google us english/i;
const MALE = /guy|davis|tony|jason|alex\b|fred|tom\b|aaron|christopher|eric|roger|steffan|andrew|brian|matthew|justin|joey|ryan|evan|nathan|\bmale/i;
const QUALITY = [/natural/i, /neural/i, /premium/i, /enhanced/i, /online/i, /google us english/i, /aria|jenny|guy|ava|andrew|brian|emma/i, /samantha|alex\b/i];

export function genderOf(v) {
  if (FEMALE.test(v.name)) return 'f';
  if (MALE.test(v.name)) return 'm';
  return '?';
}

function quality(v) {
  let s = 0;
  QUALITY.forEach((re, i) => {
    if (re.test(v.name)) s += QUALITY.length - i;
  });
  if (!v.localService) s += 1;
  return s;
}

function refresh() {
  if (!synth) return;
  const all = synth.getVoices();
  voices = all
    .filter((v) => /^en[-_]US/i.test(v.lang))
    .sort((a, b) => quality(b) - quality(a));
  voiceListeners.forEach((fn) => fn(voices));
}

if (synth) {
  refresh();
  synth.addEventListener?.('voiceschanged', refresh);
  setTimeout(refresh, 800);
}

export const canSpeak = !!synth;
export const usVoices = () => voices;
export const onVoices = (fn) => {
  voiceListeners.add(fn);
  return () => voiceListeners.delete(fn);
};

export function pickVoice(gender = 'f') {
  if (!voices.length) refresh();
  const s = settings();
  const chosen = gender === 'm' ? s.voiceM : s.voiceF;
  if (chosen) {
    const v = voices.find((x) => x.name === chosen);
    if (v) return v;
  }
  return voices.find((v) => genderOf(v) === gender) || voices[0] || null;
}

let seq = 0;
let playToken = 0;

function utter(text, { gender = 'f', rateMul = 1 } = {}) {
  if (!synth) return Promise.resolve();
  const id = ++seq;
  synth.cancel();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(gender);
    if (v) u.voice = v;
    u.lang = 'en-US';
    u.rate = Math.min(2, Math.max(0.4, (settings().rate || 1) * rateMul));
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(id === seq);
    };
    u.onend = finish;
    u.onerror = finish;
    // 有些瀏覽器不會觸發 onend，用估算時間保底
    setTimeout(finish, 2500 + (text.length * 110) / u.rate);
    synth.speak(u);
  });
}

/** 念一句英文（會中斷正在播放的內容）。rateMul 用於慢速練習，例如 0.7 */
export function speak(text, opts) {
  playToken++;
  return utter(text, opts);
}

export function stopSpeaking() {
  playToken++;
  seq++;
  synth?.cancel();
}

/** 依序播放多句；任何新的 speak / stopSpeaking 都會中斷。完整播完回傳 true */
export async function speakSequence(items, onItem) {
  stopSpeaking();
  const token = playToken;
  for (let i = 0; i < items.length; i++) {
    if (token !== playToken) return false;
    onItem?.(i);
    await utter(items[i].text, items[i]);
    if (token !== playToken) return false;
    await new Promise((r) => setTimeout(r, 350));
  }
  if (token !== playToken) return false;
  onItem?.(-1);
  return true;
}

// ---------- 語音辨識 ----------
const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
export const canRecognize = !!SR;
const MAX_LISTEN_MS = 90000; // 忘了按結束時的保險

let phrasesUnsupported = false;

/** 從多個辨識候選中，挑出最接近目標句的那一個 */
function pickAlternative(result, hint) {
  if (!hint || result.length < 2) return result[0].transcript;
  let best = result[0].transcript;
  let bestScore = -Infinity;
  for (let k = 0; k < result.length; k++) {
    const t = result[k].transcript;
    const { count, answerLen } = matchCount(hint, t);
    const score = count - 0.5 * (answerLen - count) + (result[k].confidence || 0) * 0.1;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

/**
 * 開始聆聽，直到呼叫 stop() 才結束（中途停頓不會自動關掉）。
 * hint：預期要說的句子，用來從候選結果中挑最接近的，並在支援的瀏覽器上加強辨識。
 */
export function listen({ onInterim, hint = '' } = {}) {
  if (!SR) return { promise: Promise.reject(new Error('unsupported')), stop() {} };
  let stopped = false;
  let carried = ''; // 前幾次（瀏覽器自動中斷後重啟）累積的文字
  let finals = [];
  let interim = '';
  let rec = null;
  let restarts = 0;
  let resolveFn;
  let rejectFn;
  const promise = new Promise((res, rej) => {
    resolveFn = res;
    rejectFn = rej;
  });
  const text = () => [carried, ...finals, interim].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  const finalText = () => [carried, ...finals].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  const timer = setTimeout(() => stop(), MAX_LISTEN_MS);

  function start() {
    rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 5;
    if (hint && !phrasesUnsupported && 'phrases' in rec && typeof window.SpeechRecognitionPhrase === 'function') {
      try {
        rec.phrases = [new window.SpeechRecognitionPhrase(hint, 5)];
      } catch {
        phrasesUnsupported = true;
      }
    }
    finals = [];
    interim = '';
    rec.onresult = (e) => {
      finals = [];
      interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals.push(pickAlternative(r, hint));
        else interim += ' ' + r[0].transcript;
      }
      onInterim?.(text());
    };
    rec.onerror = (e) => {
      if (e.error === 'phrases-not-supported') {
        phrasesUnsupported = true;
        return; // onend 會以不帶 phrases 的方式重啟
      }
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') {
        stopped = true;
        clearTimeout(timer);
        rejectFn(new Error(e.error));
      }
      // no-speech、network、aborted：交給 onend 決定要不要重啟
    };
    rec.onend = () => {
      carried = finalText() || carried;
      if (interim) carried = [carried, interim].filter(Boolean).join(' ');
      finals = [];
      interim = '';
      if (!stopped && restarts < 30) {
        restarts += 1;
        try {
          start();
          return;
        } catch {
          /* 重啟失敗就直接結束 */
        }
      }
      clearTimeout(timer);
      resolveFn(carried.replace(/\s+/g, ' ').trim());
    };
    rec.start();
  }

  function stop() {
    if (stopped) return;
    stopped = true;
    try {
      rec?.stop();
    } catch {
      resolveFn(text());
    }
  }

  try {
    start();
  } catch (e) {
    clearTimeout(timer);
    return { promise: Promise.reject(e), stop() {} };
  }
  return { promise, stop };
}

// ---------- 錄音（聽自己的發音） ----------
export const canRecord = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

/** iPhone / iPad 同時錄音與辨識會互搶麥克風，辨識品質明顯變差 */
export const isIOS =
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

/** 跟讀時是否同時錄音：設定為 on/off，或 auto（iOS 關閉、其他開啟） */
export function shouldRecord() {
  const pref = settings().recordVoice || 'auto';
  if (pref === 'on') return canRecord;
  if (pref === 'off') return false;
  return canRecord && !isIOS;
}

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  const mr = new MediaRecorder(stream);
  const chunks = [];
  mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  mr.start();
  return {
    stop: () =>
      new Promise((resolve) => {
        mr.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(chunks.length ? URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })) : null);
        };
        if (mr.state !== 'inactive') mr.stop();
        else mr.onstop();
      }),
  };
}

/** 辨識 + （選擇性）錄音，任一功能不支援時自動降級。只有 stop() 會結束。 */
export async function captureSpeech({ onInterim, record = false, hint = '' } = {}) {
  const session = canRecognize ? listen({ onInterim, hint }) : null;
  let recorder = null;
  if (record && canRecord) {
    try {
      recorder = await startRecording();
    } catch {
      recorder = null;
    }
  }
  if (!session && !recorder) throw new Error('unsupported');
  let result = null;
  return {
    stop: () => {
      session?.stop();
      return (result ||= (async () => {
        const text = session ? await session.promise.catch(() => '') : '';
        const audioUrl = recorder ? await recorder.stop() : null;
        return { text, audioUrl };
      })());
    },
    failed: session ? session.promise.then(() => false, () => true) : Promise.resolve(false),
  };
}
