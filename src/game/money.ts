// Money in whole ₺ — simple enough for kids to make change with.
import { INGREDIENTS } from './data';
import type { BowlState } from './bowl';
import type { Order } from './orders';

export const DENOMS = [200, 100, 50, 20, 10, 5, 1] as const;
export type Denom = (typeof DENOMS)[number];

export const fmt = (v: number) => `${v < 0 ? '−' : ''}${Math.abs(v)} ₺`;

/** Menu price of an order. */
export function price(o: Order): number {
  let p = 10;
  p += o.noodle ? INGREDIENTS[o.noodle].price : 20;
  p += o.broth ? INGREDIENTS[o.broth].price : 14;
  for (const r of o.reqs)
    p +=
      INGREDIENTS[r.id].price *
      (r.mode === 'exact' ? Math.min(3, r.n ?? 1) : r.mode === 'bol' ? 2 : 1);
  if (o.rules.some((r) => r.t === 'variety' || r.t === 'free')) p += 12;
  return Math.round(p);
}

/** What the ingredients that went into a bowl cost the shop. */
export function cost(b: BowlState): number {
  let c = 0;
  if (b.noodle) c += INGREDIENTS[b.noodle].cost;
  if (b.broth) c += Math.round(INGREDIENTS[b.broth].cost * Math.min(1.3, Math.max(0.3, b.fill)));
  for (const p of b.pieces) c += INGREDIENTS[p.id].cost;
  return c;
}

/** How much of the bill a customer actually pays, by satisfaction. */
export function paid(score: number, p: number): number {
  return Math.round(p * (score >= 50 ? 1 : score >= 25 ? 0.6 : 0.3));
}

export function tip(score: number, p: number, bonusPct: number): number {
  const rate =
    score >= 95 ? 0.35 : score >= 85 ? 0.25 : score >= 70 ? 0.15 : score >= 55 ? 0.05 : 0;
  if (!rate) return 0;
  return Math.max(1, Math.round(p * (rate + bonusPct / 100)));
}

/** A realistic set of notes/coins a customer hands over for `due`. Returns denominations (sum ≥ due). */
export function cashGiven(due: number, level: number): Denom[] {
  const roll = Math.random();
  if (roll < 0.08) return breakDown(due); // exact
  const candidates: number[] = [];
  const up = (s: number) => Math.ceil(due / s) * s;
  candidates.push(up(10), up(20), up(50));
  if (due < 100) candidates.push(100);
  if (due < 200 && level >= 4) candidates.push(200);
  if (level >= 6 && due % 10 !== 0) candidates.push(up(50) + (due % 10)); // "so you give me round change"
  const total = candidates[Math.floor(Math.random() * candidates.length)];
  return breakDown(total);
}

export function breakDown(total: number): Denom[] {
  const out: Denom[] = [];
  let left = total;
  for (const d of DENOMS) {
    while (left >= d) {
      out.push(d);
      left -= d;
    }
  }
  return out;
}

export const sum = (a: readonly number[]) => a.reduce((s, v) => s + v, 0);

export interface DayLedger {
  sales: number;
  tips: number;
  bonus: number;
  ingredients: number;
  waste: number;
  overChange: number;
  bowls: number;
  changeMistakes: number;
  rent: number;
  utilities: number;
}

export const RENT = (level: number) => 120 + level * 20;
export const UTILITIES = (level: number) => 40 + level * 8;

export function emptyLedger(level: number): DayLedger {
  return {
    sales: 0,
    tips: 0,
    bonus: 0,
    ingredients: 0,
    waste: 0,
    overChange: 0,
    bowls: 0,
    changeMistakes: 0,
    rent: RENT(level),
    utilities: UTILITIES(level),
  };
}

export function net(l: DayLedger) {
  return l.sales + l.tips + l.bonus - l.ingredients - l.waste - l.overChange - l.rent - l.utilities;
}
