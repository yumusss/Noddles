// Progress kept on the device (localStorage). Old saves from earlier versions are reset safely.

import { DECOR, type DecorSlot, type Species, type Speaker, TOTAL_DAYS } from './data';
import type { L } from './i18n';
import type { Reason } from './orders';

export type ReplyKind = 'kind' | 'thanks' | 'rude';

export interface Review {
  id: string;
  day: number;
  species: Species;
  special?: Speaker;
  seed: number;
  nameIdx: number;
  stars: number;
  text: L;
  tags: Reason[];
  /** positive tags like "Fresh fish" */
  good?: L[];
  online: boolean;
  likes: number;
  reply?: ReplyKind;
  /** stars before the owner's reply changed them */
  before?: number;
  /** the reviewer's follow-up after a reply */
  follow?: L;
}

export interface DayStat {
  net: number;
  served: number;
  stars: number;
  /** average stars of that day's reviews */
  dayRating: number;
  /** overall Yumm rating at the end of the day */
  rating: number;
}

export interface Save {
  v: number;
  unlocked: number;
  stars: number[];
  wallet: number;
  owned: string[];
  equipped: Record<DecorSlot, string>;
  reviews: Review[];
  history: (DayStat | null)[];
  seenHowTo: boolean;
  sfx: boolean;
  music: boolean;
}

const KEY = 'yuki.save';
const VERSION = 3;

const OLD: [Species, number, string, string][] = [
  [
    'seal',
    2,
    'Eskiden çok güzeldi ama artık hep kapalı.',
    'Used to be great, but it’s always closed now.',
  ],
  ['otter', 3, 'Balık taze ama bekleme çok uzun.', 'Fresh fish, but the wait is long.'],
  [
    'penguin',
    1,
    'Kapıda yarım saat bekledim, kimse yoktu!',
    'Waited half an hour at the window, nobody came!',
  ],
  ['hare', 2, 'Pirinç soğuktu.', 'The rice was cold.'],
  ['reindeer', 3, 'Mors Dede’nin eski günlerini özledim.', 'I miss Grandpa Tusk’s good old days.'],
  ['puffin', 2, 'Maki dağılıyordu.', 'The maki fell apart.'],
  ['tanuki', 3, 'Manzara harika, sushi idare eder.', 'Great view, the sushi is okay.'],
  ['bear', 2, 'Porsiyonlar ayı için çok küçük.', 'Portions too small for a bear.'],
];

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
    reviews: OLD.map(([species, stars, tr, en], i) => ({
      id: 'old' + i,
      day: 0,
      species,
      seed: 900 + i * 37,
      nameIdx: (i * 5) % 16,
      stars,
      text: { tr, en },
      tags: [],
      online: false,
      likes: 1 + ((i * 7) % 9),
    })),
    history: new Array(TOTAL_DAYS + 1).fill(null),
    seenHowTo: false,
    sfx: true,
    music: true,
  };
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const parsed = JSON.parse(raw) as Partial<Save>;
    if (parsed.v !== VERSION) return fresh();
    const base = fresh();
    const s = { ...base, ...parsed } as Save;
    s.stars = base.stars.map((_, i) => Math.max(0, Math.min(3, (parsed.stars?.[i] ?? 0) | 0)));
    s.history = base.history.map((_, i) => parsed.history?.[i] ?? null);
    s.unlocked = Math.max(1, Math.min(TOTAL_DAYS, s.unlocked | 0));
    for (const k of Object.keys(base.equipped) as DecorSlot[])
      if (!s.equipped?.[k]) s.equipped[k] = base.equipped[k];
    s.reviews = (s.reviews ?? []).slice(-120);
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

export function ratingOf(reviews: Review[]): number {
  if (!reviews.length) return 0;
  return reviews.reduce((a, r) => a + r.stars, 0) / reviews.length;
}

/** owner reply to a review: kind replies can win back a star, rude ones lose one */
export function applyReply(r: Review, kind: ReplyKind) {
  if (r.reply) return;
  r.reply = kind;
  r.before = r.stars;
  if (kind === 'rude') {
    r.stars = Math.max(1, r.stars - 1);
    r.follow = {
      tr: 'Bir de kaba cevap verdi. Bir yıldız daha eksik!',
      en: 'And then a rude reply. One more star off!',
    };
  } else if (kind === 'kind' && r.stars <= 3) {
    r.stars = Math.min(5, r.stars + 1);
    r.follow = {
      tr: 'Sahibi nazikçe cevap verdi, bir şans daha veriyorum.',
      en: 'The owner replied kindly, I’ll give it another chance.',
    };
  } else if (kind === 'thanks') {
    r.likes += 2;
  }
}
