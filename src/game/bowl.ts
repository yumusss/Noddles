// The bowl the player builds. Contents live in a 300×300 "bowl space" whose
// centre is (150,150); BOWL_R is the radius of the usable inner area.
import type { Thick } from './data';

export const BOWL_SPACE = 300;
export const BOWL_C = 150;
export const BOWL_R = 112;

export type CookState = 'raw' | 'dente' | 'perfect' | 'soft' | 'mushy' | 'burnt';

export const COOK_LABEL: Record<CookState, string> = {
  raw: 'Çiğ',
  dente: 'Diri',
  perfect: 'Tam kıvam',
  soft: 'Yumuşak',
  mushy: 'Lapa',
  burnt: 'Yanık',
};

/** Cooking progress 0..COOK_MAX → state. After mushy the noodles burn. */
export const COOK_MAX = 140;
export function cookStateAt(p: number): CookState {
  if (p < 40) return 'raw';
  if (p < 58) return 'dente';
  if (p < 82) return 'perfect';
  if (p < 102) return 'soft';
  if (p < 120) return 'mushy';
  return 'burnt';
}

export interface Piece {
  id: string; // ingredient id
  x: number; // bowl space
  y: number;
  rot: number; // radians
  v: number; // variant 0..N (drawing variation)
  s: number; // scale multiplier ~0.85..1.15
}

export interface BowlState {
  style: string; // bowl style id
  noodle?: string;
  thick: Thick;
  broth?: string; // broth or sauce id
  fill: number; // 0..1.2 (over 1 = overflow)
  pieces: Piece[];
  progress: number; // cooking progress 0..COOK_MAX
}

export function newBowl(style = 'kirmizi'): BowlState {
  return { style, thick: 'orta', fill: 0, pieces: [], progress: 0 };
}

export const cookOf = (b: BowlState): CookState => (b.noodle ? cookStateAt(b.progress) : 'raw');

/** A random free-ish spot inside the bowl for a new piece. */
export function freeSpot(b: BowlState, rand: () => number, radius = 24): { x: number; y: number } {
  let best = { x: BOWL_C, y: BOWL_C };
  let bestD = -1;
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (BOWL_R - radius);
    const x = BOWL_C + Math.cos(a) * r;
    const y = BOWL_C + Math.sin(a) * r;
    let d = 1e9;
    for (const p of b.pieces) d = Math.min(d, Math.hypot(p.x - x, p.y - y));
    if (d > bestD) {
      bestD = d;
      best = { x, y };
    }
    if (bestD > radius * 1.6) break;
  }
  return best;
}

export const inBowl = (x: number, y: number, pad = 0) =>
  Math.hypot(x - BOWL_C, y - BOWL_C) <= BOWL_R + pad;
