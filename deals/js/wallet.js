// 我的券夾與偏好設定：只存在這台裝置的瀏覽器，可匯出 / 匯入 JSON。
const KEY = 'deal-radar:v1';

const defaults = () => ({ version: 1, mileValue: 0.5, coupons: [] });

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    /* 私密瀏覽或停用儲存時，改用記憶體 */
  }
  return defaults();
}

let state = read();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* 無法寫入時仍可在本次瀏覽使用 */
  }
}

export const getMileValue = () => state.mileValue;
export function setMileValue(v) {
  if (!(v > 0)) return;
  state.mileValue = v;
  save();
}

/** 券夾裡的券轉成與爬蟲資料相同的格式 */
export function myDeals() {
  return state.coupons.map((c) => ({ ...c, source: 'mine', kind: c.kind || 'coupon' }));
}

export function upsertCoupon(c) {
  const id = c.id || `mine:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const next = { ...c, id, updatedAt: new Date().toISOString() };
  const i = state.coupons.findIndex((x) => x.id === id);
  if (i >= 0) state.coupons[i] = next;
  else state.coupons.unshift(next);
  save();
  return next;
}

export function removeCoupon(id) {
  state.coupons = state.coupons.filter((c) => c.id !== id);
  save();
}

export const getCoupon = (id) => state.coupons.find((c) => c.id === id);

export function exportJson() {
  return JSON.stringify(state, null, 2);
}

/** 匯入時合併：同 id 以匯入檔為準 */
export function importJson(text) {
  const data = JSON.parse(text);
  if (!Array.isArray(data.coupons)) throw new Error('檔案格式不符：缺少 coupons');
  const map = new Map(state.coupons.map((c) => [c.id, c]));
  for (const c of data.coupons) if (c && c.id && c.merchant) map.set(c.id, c);
  state = { ...state, ...(data.mileValue > 0 ? { mileValue: data.mileValue } : {}), coupons: [...map.values()] };
  save();
  return data.coupons.length;
}
