import type { VideoRef } from './types';

// 各單元精選影片（YouTube ID 均需經 oEmbed 驗證真實存在）
// 尚未補齊的單元會顯示「影片正在補充中」
export const unitVideos: Record<string, VideoRef[]> = {};
