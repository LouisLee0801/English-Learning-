// 學習進度儲存在 localStorage
const KEY = 'english-survival-progress-v1';

export interface UnitProgress {
  bestQuizScore: number;      // 0-100
  quizTaken: boolean;
  knownWords: string[];       // 單字卡標記「已學會」的字
  visited: boolean;
}

export interface ProgressState {
  units: Record<string, UnitProgress>;
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as ProgressState;
  } catch {
    // 損壞就重置
  }
  return { units: {} };
}

function save(state: ProgressState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function getUnitProgress(unitId: string): UnitProgress {
  const state = load();
  return (
    state.units[unitId] ?? {
      bestQuizScore: 0,
      quizTaken: false,
      knownWords: [],
      visited: false,
    }
  );
}

export function updateUnitProgress(unitId: string, patch: Partial<UnitProgress>) {
  const state = load();
  const current = getUnitProgress(unitId);
  state.units[unitId] = { ...current, ...patch };
  save(state);
}

export function toggleKnownWord(unitId: string, word: string) {
  const current = getUnitProgress(unitId);
  const known = current.knownWords.includes(word)
    ? current.knownWords.filter((w) => w !== word)
    : [...current.knownWords, word];
  updateUnitProgress(unitId, { knownWords: known });
}

export function isUnitComplete(unitId: string): boolean {
  const p = getUnitProgress(unitId);
  return p.quizTaken && p.bestQuizScore >= 70;
}
