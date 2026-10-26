// Progress kept on the device (localStorage). Old saves are migrated forward.

import { DECOR, type DecorSlot, TOTAL_DAYS } from './data';

export interface Review {
  day: number;
  /** names and texts are kept in both languages so the tablet follows the language toggle */
  nameIdx: number;
  female: boolean;
  stars: number;
  text: { tr: string; en: string };
  online: boolean;
}
export interface Delivery {
  day: number;
  name: string;
  summary: string;
  stars: number;
}

export interface Save {
  v: number;
  /** highest day the player may start */
  unlocked: number;
  stars: number[]; // index = day
  wallet: number;
  owned: string[];
  equipped: Record<DecorSlot, string>;
  reviews: Review[];
  deliveries: Delivery[];
  seenHowTo: boolean;
  sfx: boolean;
  music: boolean;
}

const KEY = 'sushi.save';
const VERSION = 2;

function fresh(): Save {
  const equipped = {} as Record<DecorSlot, string>;
  for (const d of DECOR) if (d.price === 0) equipped[d.slot] = d.id;
  return {
    v: VERSION,
    unlocked: 1,
    stars: new Array(TOTAL_DAYS + 1).fill(0),
    wallet: 0,
    owned: DECOR.filter((d) => d.price === 0).map((d) => d.id),
    equipped,
    reviews: [],
    deliveries: [],
    seenHowTo: false,
    sfx: true,
    music: true,
  };
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const s = { ...fresh(), ...(JSON.parse(raw) as Partial<Save>) } as Save;
    // migrate: stretch/shrink the star list to the current number of days
    const stars = new Array(TOTAL_DAYS + 1).fill(0);
    (s.stars ?? []).forEach((v, i) => {
      if (i <= TOTAL_DAYS) stars[i] = Math.max(0, Math.min(3, v | 0));
    });
    s.stars = stars;
    s.unlocked = Math.max(1, Math.min(TOTAL_DAYS, s.unlocked | 0));
    const base = fresh();
    for (const k of Object.keys(base.equipped) as DecorSlot[])
      if (!s.equipped[k]) s.equipped[k] = base.equipped[k];
    s.reviews = (s.reviews ?? []).filter((r) => r && typeof r.text === 'object').slice(-40);
    s.deliveries = (s.deliveries ?? []).slice(-40);
    s.v = VERSION;
    return s;
  } catch {
    return fresh();
  }
}

export function writeSave(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked */
  }
}

export function tipBonus(s: Save): number {
  let b = 0;
  for (const id of Object.values(s.equipped)) b += DECOR.find((d) => d.id === id)?.tip ?? 0;
  return b / 100;
}
