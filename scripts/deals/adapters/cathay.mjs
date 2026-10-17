import { makeAdapter } from './valuedynamx.mjs';

export default makeAdapter({
  source: 'cathay',
  base: 'https://shop.asiamiles.com/zh/',
  unit: '里',
  label: '國泰 Milesback',
  expectTitle: /台灣/,
});
