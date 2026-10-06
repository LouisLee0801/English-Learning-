// 讓 view 可以要求重新渲染目前頁面（每次都換新的根節點，避免重複綁定事件）
let handler = null;
export const setRerender = (fn) => (handler = fn);
export const rerender = () => handler?.();
