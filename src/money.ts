import { INGREDIENTS } from './data';
import type { Bowl, Order } from './orders';

// All money is handled in cents to avoid floating point surprises.

export const DENOMS = [2000, 1000, 500, 100, 25, 10, 5, 1] as const;
export type Denom = (typeof DENOMS)[number];

export const fmt = (cents: number) => {
  const neg = cents < 0;
  const v = Math.abs(cents);
  return `${neg ? '−' : ''}$${Math.floor(v / 100)}.${String(v % 100).padStart(2, '0')}`;
};

export const denomLabel = (d: number) => (d >= 100 ? `$${d / 100}` : `${d}¢`);

const round25 = (c: number) => Math.round(c / 25) * 25;

/** Menu price of an order. */
export function priceCents(o: Order): number {
  let c = 450;
  if (o.noodle) c += (INGREDIENTS[o.noodle].price - 4) * 25;
  else c += 25;
  if (o.broth) c += (INGREDIENTS[o.broth].price - 3) * 25;
  for (const r of o.reqs) c += INGREDIENTS[r.id].price * 25;
  if (o.rules.some((r) => r.t === 'variety' || r.t === 'free')) c += 150;
  return round25(c);
}

/** What the ingredients that went into a bowl cost the shop. */
export function costCents(b: Bowl): number {
  let c = 0;
  if (b.noodle) c += 55;
  if (b.broth) c += Math.round(35 * Math.min(1.25, b.fill));
  for (const p of b.pieces) c += INGREDIENTS[p.id].price * 6;
  return c;
}

/**
 * Tip for a bowl. `bonus` is an optional multiplier on the rate coming from
 * shop decorations (0.03 = +3% → rate * 1.03).
 */
export function tipCents(score: number, price: number, bonus = 0): number {
  const rate =
    score >= 95 ? 0.35 : score >= 85 ? 0.25 : score >= 70 ? 0.15 : score >= 55 ? 0.05 : 0;
  return round25(price * rate * (1 + bonus));
}

export const tipCentsWithBonus = (score: number, price: number, bonus: number) =>
  tipCents(score, price, bonus);

/** How a customer pays: a realistic bill (or bill + coins) for the amount due. */
export function cashGiven(due: number, level: number): number {
  const opts: number[] = [];
  const up = (step: number) => Math.ceil(due / step) * step;
  if (due % 500 !== 0) opts.push(up(500));
  if (up(1000) !== up(500)) opts.push(up(1000));
  opts.push(up(1000));
  if (due < 2000) opts.push(2000);
  if (level >= 5) {
    // "Here's $10.25 so you can give me round change"
    const coins = due % 100;
    if (coins) opts.push(up(500) + coins, up(1000) + coins);
  }
  if (Math.random() < 0.06) return due;
  return opts[Math.floor(Math.random() * opts.length)];
}

export interface DayLedger {
  sales: number;
  tips: number;
  bonus: number;
  ingredients: number;
  waste: number;
  overChange: number;
  unpaid: number;
  bowls: number;
  changeMistakes: number;
  rent: number;
  utilities: number;
}

export const RENT = (level: number) => 1200 + level * 200;
export const UTILITIES = (level: number) => 300 + level * 50;

export function net(l: DayLedger) {
  return l.sales + l.tips + l.bonus - l.ingredients - l.waste - l.overChange - l.rent - l.utilities;
}
