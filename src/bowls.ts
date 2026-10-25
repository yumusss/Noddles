// Japanese bowl styles the player picks before building an order.

export type Pattern =
  'none' | 'wave' | 'gold' | 'sakura' | 'tenmoku' | 'crackle' | 'stripes' | 'dots';

export interface BowlStyle {
  id: string;
  name: string;
  /** outer glaze gradient: highlight, mid, shadow */
  glaze: [string, string, string];
  lip: string;
  inner: [string, string, string, string];
  pattern: Pattern;
  patternColor: string;
  /** level from which this style is available */
  level: number;
}

export const BOWLS: Record<string, BowlStyle> = {
  kirmizi: {
    id: 'kirmizi',
    name: 'Kırmızı Lake',
    glaze: ['#e2553d', '#a8301f', '#6e1a10'],
    lip: '#f4ebdd',
    inner: ['#fbf7f0', '#e9e0d2', '#c6b9a6', '#a39380'],
    pattern: 'none',
    patternColor: '#000',
    level: 1,
  },
  dalga: {
    id: 'dalga',
    name: 'Mavi Dalga',
    glaze: ['#f3f6fb', '#dbe4f0', '#9fb0c8'],
    lip: '#1f3f7a',
    inner: ['#fdfefe', '#eef3f8', '#c9d4e2', '#a1b0c3'],
    pattern: 'wave',
    patternColor: '#1f3f7a',
    level: 1,
  },
  siyahaltin: {
    id: 'siyahaltin',
    name: 'Siyah & Altın',
    glaze: ['#4a4a52', '#1d1d22', '#07070a'],
    lip: '#d9b24c',
    inner: ['#fbf4e6', '#eadfca', '#c5b396', '#9a8766'],
    pattern: 'gold',
    patternColor: '#e7c565',
    level: 2,
  },
  seladon: {
    id: 'seladon',
    name: 'Seladon Yeşili',
    glaze: ['#cfe6d6', '#9ec9ad', '#5e9478'],
    lip: '#e6f1e8',
    inner: ['#f1f8f2', '#dcebdf', '#b7cdbb', '#8faa95'],
    pattern: 'crackle',
    patternColor: '#5e8d70',
    level: 3,
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura',
    glaze: ['#fff0f4', '#f6d3dd', '#d79aad'],
    lip: '#f7c8d6',
    inner: ['#fffafb', '#f8eef1', '#dcc9cf', '#b89aa4'],
    pattern: 'sakura',
    patternColor: '#e76f8f',
    level: 4,
  },
  tenmoku: {
    id: 'tenmoku',
    name: 'Tenmoku',
    glaze: ['#6b4a2b', '#2e1a0c', '#140a04'],
    lip: '#8a6a3c',
    inner: ['#4a3420', '#2c1a0c', '#1a0f06', '#0d0702'],
    pattern: 'tenmoku',
    patternColor: '#c99a55',
    level: 5,
  },
  indigo: {
    id: 'indigo',
    name: 'İndigo Çizgili',
    glaze: ['#ffffff', '#f1f1f1', '#c9c9c9'],
    lip: '#24335c',
    inner: ['#ffffff', '#f3f4f7', '#d1d5de', '#a9afbd'],
    pattern: 'stripes',
    patternColor: '#24335c',
    level: 6,
  },
  hurma: {
    id: 'hurma',
    name: 'Hurma Turuncusu',
    glaze: ['#ffb067', '#e87a2a', '#9c4512'],
    lip: '#fff1dc',
    inner: ['#fff8ee', '#f4e6d2', '#d6c2a4', '#b09877'],
    pattern: 'dots',
    patternColor: '#fff1dc',
    level: 8,
  },
};

export const BOWL_IDS = Object.keys(BOWLS);
export const DEFAULT_BOWL = 'kirmizi';

export function bowlsUpTo(level: number) {
  return BOWL_IDS.filter((id) => BOWLS[id].level <= level);
}
