import { makeAdapter } from './valuedynamx.mjs';

export default makeAdapter({
  source: 'eva',
  base: 'https://mall.brmile.com/zh/',
  unit: '哩',
  label: '長榮 Mileage Mall',
  expectTitle: /EVA Mileage Mall/,
});
