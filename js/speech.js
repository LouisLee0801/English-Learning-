// 美式發音（Web Speech API 語音合成）、語音辨識、錄音
import { settings } from './store.js';

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

export function listen({ onInterim } = {}) {
  if (!SR) return { promise: Promise.reject(new Error('unsupported')), stop() {} };
  const rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let text = '';
  const promise = new Promise((resolve, reject) => {
    rec.onresult = (e) => {
      text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      onInterim?.(text);
    };
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') resolve(text);
      else reject(new Error(e.error));
    };
    rec.onend = () => resolve(text);
  });
  try {
    rec.start();
  } catch (e) {
    return { promise: Promise.reject(e), stop() {} };
  }
  return { promise, stop: () => rec.stop() };
}

// ---------- 錄音（聽自己的發音） ----------
export const canRecord = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

/**
 * 同時辨識 + 錄音，任一功能不支援時自動降級。
 * stop() 手動結束；done 在辨識因靜音自動結束時 resolve（不支援辨識時為 null）。
 */
export async function captureSpeech({ onInterim, record = true } = {}) {
  let recorder = null;
  if (record && canRecord) {
    try {
      recorder = await startRecording();
    } catch {
      recorder = null;
    }
  }
  const session = canRecognize ? listen({ onInterim }) : null;
  if (!session && !recorder) throw new Error('unsupported');
  let result = null;
  const finish = () =>
    (result ||= (async () => {
      let text = '';
      if (session) text = await session.promise.catch(() => '');
      const audioUrl = recorder ? await recorder.stop() : null;
      return { text, audioUrl };
    })());
  return {
    stop: () => {
      session?.stop();
      return finish();
    },
    done: session ? session.promise.catch(() => '').then(finish) : null,
  };
}
