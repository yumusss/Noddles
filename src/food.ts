// Food rendering on Canvas 2D in the v3 "single line language" of ART_DIRECTION.md:
// thin warm-ink outlines, flat fills, exactly one shadow tone and one small
// highlight per shape. No multi-stop gradients, no blur haze, no noise.
// Everything is procedural and cached.

import { INGREDIENTS } from './data';
import { BOWLS, DEFAULT_BOWL, type BowlStyle } from './bowls';

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;

export type Thick = 'ince' | 'orta' | 'kalin';
export const THICK_LABEL: Record<Thick, string> = { ince: 'İnce', orta: 'Orta', kalin: 'Kalın' };
export const THICK_W: Record<Thick, number> = { ince: 2.6, orta: 4.3, kalin: 7.2 };

export interface PieceLike {
  id: string;
  x: number;
  y: number;
  r: number;
  s: number;
  k: number;
}

export interface BowlDraw {
  noodle?: string;
  thick?: Thick;
  liquid?: string;
  fill: number;
  pieces: PieceLike[];
  cook?: 'raw' | 'dente' | 'perfect' | 'soft' | 'burnt';
  takeaway?: boolean;
  style?: string;
}

// ---------- helpers ----------
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function mk(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}
function hex2rgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function tint(h: string, amt: number, alpha = 1) {
  const [r, g, b] = hex2rgb(h);
  const f = (c: number) =>
    Math.round(Math.max(0, Math.min(255, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgba(${f(r)},${f(g)},${f(b)},${alpha})`;
}
function mixHex(a: string, b: string, t: number) {
  const A = hex2rgb(a);
  const B = hex2rgb(b);
  const m = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** warm white highlight / warm ink (never pure white or black) */
const hi = (a: number) => `rgba(255,246,232,${a})`;
const ink = (a: number) => `rgba(43,36,32,${a})`;
const INK = ink(0.85);
/** the single shadow tone of a colour: same hue, 18% darker */
const dark = (col: string) => tint(col, -0.18);

/** ink outline */
function line(c: Ctx, p: Path2D, w: number, a = 0.85) {
  c.strokeStyle = ink(a);
  c.lineWidth = w;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.stroke(p);
}
/**
 * flat fill with one shadow tone on the lower-right side.
 * The shadow is a hard crescent whose inner edge is slightly softened.
 */
function flat(c: Ctx, p: Path2D, col: string, off = 3, soft = 2, shadow = dark(col)) {
  c.fillStyle = shadow;
  c.fill(p);
  c.save();
  c.clip(p);
  c.translate(-off, -off);
  c.fillStyle = col;
  if (soft > 0) {
    c.shadowColor = col;
    c.shadowBlur = soft;
  }
  c.fill(p);
  c.restore();
}
/** flat fill + shadow + outline: the basic "sticker" */
function sticker(c: Ctx, p: Path2D, col: string, lw: number, off = 3, soft = 2, shadow?: string) {
  flat(c, p, col, off, soft, shadow);
  line(c, p, lw);
}
/** the one small highlight: an ellipse of warm white */
function shine(c: Ctx, x: number, y: number, rx: number, ry: number, rot = -0.7, a = 0.6) {
  c.fillStyle = hi(a);
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
  c.fill();
}
function ell(x: number, y: number, rx: number, ry: number, rot = 0) {
  const p = new Path2D();
  p.ellipse(x, y, rx, ry, rot, 0, TAU);
  return p;
}
function rrect(x: number, y: number, w: number, h: number, r: number) {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}
/** smooth closed blob */
function blob(r: () => number, cx: number, cy: number, rad: number, wob: number, n = 14) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = rad * (1 - wob / 2 + r() * wob);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return smoothClosed(pts);
}
function smoothClosed(pts: [number, number][]) {
  const p = new Path2D();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % n];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    if (i === 0) p.moveTo(mx, my);
    else p.quadraticCurveTo(x0, y0, mx, my);
  }
  const [x0, y0] = pts[0];
  const [x1, y1] = pts[1];
  p.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  p.closePath();
  return p;
}
function smoothOpen(pts: [number, number][]) {
  const p = new Path2D();
  p.moveTo(pts[0][0], pts[0][1]);
  for (let k = 1; k < pts.length - 1; k++)
    p.quadraticCurveTo(
      pts[k][0],
      pts[k][1],
      (pts[k][0] + pts[k + 1][0]) / 2,
      (pts[k][1] + pts[k + 1][1]) / 2
    );
  const l = pts[pts.length - 1];
  p.lineTo(l[0], l[1]);
  return p;
}
function spiral(r0: number, step: number, turns: number, sx = 1, sy = 1) {
  const p = new Path2D();
  for (let a = 0, rr = r0; a < TAU * turns; a += 0.1, rr += step * 0.1) {
    const x = Math.cos(a) * rr * sx;
    const y = Math.sin(a) * rr * sy;
    if (a === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}
/** an outlined ribbon (ink under, colour over, thin light line on top) */
function ribbon(c: Ctx, p: Path2D, col: string, w: number, lw: number, hiA = 0.55) {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = INK;
  c.lineWidth = w + lw * 2;
  c.stroke(p);
  c.strokeStyle = col;
  c.lineWidth = w;
  c.stroke(p);
  if (hiA > 0) {
    c.save();
    c.translate(-w * 0.18, -w * 0.22);
    c.strokeStyle = hi(hiA);
    c.lineWidth = Math.max(0.8, w * 0.22);
    c.stroke(p);
    c.restore();
  }
}

// ---------- topping sprites (drawn in a 128x128 space, centred at 64,64) ----------
const S = 128;
const SS = 2; // sprite supersampling
const LW = 2.3; // ≈1.3px once a sprite is scaled into the 300px bowl
type Draw = (c: Ctx, r: () => number) => void;

const egg: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.5);
  const w = ell(0, 0, 50, 40);
  sticker(c, w, '#f8ecd8', LW, 4, 3);
  const y = ell(2, 2, 27, 22);
  sticker(c, y, '#f2a23a', LW * 0.8, 4, 3, '#d87a22');
  shine(c, -8, -8, 7, 4.2, -0.6, 0.7);
  shine(c, -30, -20, 7, 3, -0.5, 0.55);
  c.restore();
};

const chashu: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const outer = blob(r, 0, 0, 52, 0.06, 16);
  sticker(c, outer, '#7b4f2e', LW, 3, 2);
  const inner = blob(r, 0, 0, 44, 0.05, 16);
  flat(c, inner, '#e8ad92', 3, 2);
  line(c, inner, LW * 0.7, 0.6);
  c.save();
  c.clip(inner);
  ribbon(c, spiral(5, 4.9, 2.2, 1.04, 0.96), '#f7e8d9', 7.5, LW * 0.6, 0);
  c.restore();
  shine(c, -16, -18, 9, 4, -0.7, 0.5);
  c.restore();
};

function ring(c: Ctx, x: number, y: number, R: number, col: string, hole: string, lw = LW) {
  const o = ell(x, y, R, R * 0.9);
  sticker(c, o, col, lw, 2, 1.5);
  const i = ell(x + 0.5, y + 0.5, R * 0.5, R * 0.45);
  c.fillStyle = hole;
  c.fill(i);
  line(c, i, lw * 0.8, 0.7);
  shine(c, x - R * 0.45, y - R * 0.4, R * 0.22, R * 0.12, -0.6, 0.6);
}
const greenOnion: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const pos: [number, number, number][] = [
    [-22, -12, 17],
    [12, -20, 15],
    [20, 16, 16],
    [-14, 22, 14],
    [-1, 1, 12],
  ];
  for (const [x, y, R] of pos) ring(c, x, y, R, r() < 0.4 ? '#9dbb79' : '#7c9a6e', '#eef3df');
  c.restore();
};

const nori: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.3);
  const p = new Path2D();
  p.moveTo(-40, -46);
  p.lineTo(40, -44);
  p.lineTo(42, 40);
  p.quadraticCurveTo(14, 30, -22, 46);
  p.lineTo(-42, 44);
  p.closePath();
  sticker(c, p, '#2f4a38', LW, 4, 3, '#1f3326');
  // curled corner: lighter underside
  const f = new Path2D();
  f.moveTo(42, 40);
  f.quadraticCurveTo(14, 30, -22, 46);
  f.quadraticCurveTo(10, 44, 26, 52);
  f.quadraticCurveTo(40, 54, 42, 40);
  c.fillStyle = '#5c7d64';
  c.fill(f);
  line(c, f, LW * 0.8);
  // two faint sheen lines
  c.strokeStyle = hi(0.22);
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-28, -30);
  c.lineTo(-2, -34);
  c.moveTo(-28, -20);
  c.lineTo(-12, -22);
  c.stroke();
  c.restore();
};

function kernel(c: Ctx, x: number, y: number, rot: number, s = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  const p = new Path2D();
  p.moveTo(-12, -11);
  p.quadraticCurveTo(0, -16, 12, -11);
  p.quadraticCurveTo(14, 2, 6, 11);
  p.quadraticCurveTo(0, 15, -6, 11);
  p.quadraticCurveTo(-14, 2, -12, -11);
  sticker(c, p, '#f3c74a', LW, 2.5, 1.5, '#d9a441');
  shine(c, -4, -5, 3.5, 2, -0.6, 0.7);
  c.restore();
}
const corn: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const pos: [number, number][] = [
    [-20, -14],
    [12, -20],
    [22, 12],
    [-12, 20],
    [0, -1],
  ];
  for (const [x, y] of pos) kernel(c, x, y, r() * TAU, 1.05);
  c.restore();
};

const shiitake: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const cap = blob(r, 0, 0, 46, 0.05, 14);
  sticker(c, cap, '#8a5a3a', LW, 4, 3, '#5f3b25');
  // the classic star cut: three cream grooves
  const g = '#f0dfc5';
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    const p = new Path2D();
    p.moveTo(Math.cos(a) * 26, Math.sin(a) * 26);
    p.lineTo(-Math.cos(a) * 26, -Math.sin(a) * 26);
    ribbon(c, p, g, 5, LW * 0.55, 0);
  }
  shine(c, -18, -20, 8, 4, -0.7, 0.45);
  c.restore();
};

const chiliOil: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const big = blob(r, -4, 2, 34, 0.25, 12);
  sticker(c, big, '#e0552c', LW, 3, 2, '#b83a1c');
  const s1 = ell(36, -22, 9, 7);
  sticker(c, s1, '#e0552c', LW * 0.8, 2, 1, '#b83a1c');
  const s2 = ell(-34, 32, 6, 5);
  sticker(c, s2, '#e0552c', LW * 0.8, 2, 1, '#b83a1c');
  // flakes
  c.fillStyle = '#7a1e10';
  for (let i = 0; i < 8; i++) {
    const a = r() * TAU;
    const d = r() * 22;
    c.beginPath();
    c.ellipse(-4 + Math.cos(a) * d, 2 + Math.sin(a) * d, 2.6, 1.6, a, 0, TAU);
    c.fill();
  }
  shine(c, -16, -12, 8, 4, -0.6, 0.6);
  c.restore();
};

const tofu: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.4);
  // two faces of a golden cube
  const top = rrect(-36, -36, 72, 56, 9);
  const front = new Path2D();
  front.moveTo(-36, 10);
  front.lineTo(36, 10);
  front.lineTo(36, 26);
  front.quadraticCurveTo(36, 36, 26, 36);
  front.lineTo(-26, 36);
  front.quadraticCurveTo(-36, 36, -36, 26);
  front.closePath();
  flat(c, front, '#d9a441', 0, 0, '#c38c2e');
  line(c, front, LW);
  sticker(c, top, '#f0d08a', LW, 4, 3, '#dfb866');
  c.strokeStyle = INK;
  c.lineWidth = LW;
  c.beginPath();
  c.moveTo(-36, 20);
  c.lineTo(36, 20);
  c.stroke();
  // crisp fried crust speckles
  c.fillStyle = '#c38c2e';
  for (let i = 0; i < 7; i++) {
    c.beginPath();
    c.arc(-26 + r() * 52, -28 + r() * 40, 1.6, 0, TAU);
    c.fill();
  }
  shine(c, -16, -22, 10, 4, -0.2, 0.6);
  c.restore();
};

const shrimp: Draw = (c, r) => {
  c.save();
  c.translate(60, 66);
  c.rotate(r() * TAU);
  const Rb = 30;
  const a0 = -1.3;
  const a1 = 2.5;
  const N = 20;
  const outer: [number, number][] = [];
  const inner: [number, number][] = [];
  for (let k = 0; k <= N; k++) {
    const t = k / N;
    const a = a0 + (a1 - a0) * t;
    const w = 13 * (1 - 0.6 * t) + 5;
    outer.push([Math.cos(a) * (Rb + w), Math.sin(a) * (Rb + w)]);
    inner.push([Math.cos(a) * (Rb - w), Math.sin(a) * (Rb - w)]);
  }
  const body = new Path2D();
  body.moveTo(outer[0][0], outer[0][1]);
  for (const [x, y] of outer) body.lineTo(x, y);
  for (let k = N; k >= 0; k--) body.lineTo(inner[k][0], inner[k][1]);
  body.closePath();
  // tail fan
  const da = a1 + Math.PI / 2;
  const tx = Math.cos(a1) * Rb + Math.cos(da) * 6;
  const ty = Math.sin(a1) * Rb + Math.sin(da) * 6;
  const tail = new Path2D();
  for (const s of [-1, 1]) {
    tail.moveTo(tx - Math.cos(da) * 6, ty - Math.sin(da) * 6);
    tail.lineTo(tx + Math.cos(da + s * 0.6) * 26, ty + Math.sin(da + s * 0.6) * 26);
    tail.lineTo(tx + Math.cos(da + s * 0.12) * 22, ty + Math.sin(da + s * 0.12) * 22);
    tail.closePath();
  }
  sticker(c, tail, '#d9603a', LW, 2, 1, '#b3482a');
  sticker(c, body, '#f09a6a', LW, 4, 3, '#d9774a');
  // segment lines
  c.strokeStyle = ink(0.5);
  c.lineWidth = LW * 0.8;
  c.lineCap = 'round';
  for (const t of [0.28, 0.46, 0.64, 0.8]) {
    const a = a0 + (a1 - a0) * t;
    const w = 13 * (1 - 0.6 * t) + 5;
    c.beginPath();
    c.moveTo(Math.cos(a) * (Rb + w - 3), Math.sin(a) * (Rb + w - 3));
    c.lineTo(Math.cos(a) * (Rb - w + 3), Math.sin(a) * (Rb - w + 3));
    c.stroke();
  }
  shine(c, Math.cos(a0 + 0.5) * Rb - 4, Math.sin(a0 + 0.5) * Rb - 4, 7, 3.5, a0 + 0.5, 0.6);
  c.restore();
};

const naruto: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  // scalloped edge
  const pts: [number, number][] = [];
  const n = 44;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = 44 + (i % 2 ? 3.5 : -1);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  const p = smoothClosed(pts);
  sticker(c, p, '#fbf5ec', LW, 3, 2, '#e3d6c4');
  c.save();
  c.clip(ell(0, 0, 40, 40));
  ribbon(c, spiral(3, 5.2, 2.1), '#e98aa0', 6.5, LW * 0.55, 0);
  c.restore();
  shine(c, -18, -20, 8, 3.5, -0.7, 0.6);
  c.restore();
};

const bamboo: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const strip = (x: number, y: number, rot: number, len: number) => {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    const p = rrect(-len / 2, -9, len, 18, 5);
    sticker(c, p, '#d9b56a', LW, 2.5, 1.5, '#b8924a');
    c.strokeStyle = ink(0.4);
    c.lineWidth = LW * 0.7;
    c.beginPath();
    c.moveTo(-len / 2 + 8, -1.5);
    c.lineTo(len / 2 - 8, -1.5);
    c.moveTo(-len / 2 + 10, 4);
    c.lineTo(len / 2 - 12, 4);
    c.stroke();
    shine(c, -len / 4, -4, 6, 2, 0, 0.55);
    c.restore();
  };
  strip(-6, -18, -0.25, 72);
  strip(6, 4, -0.1, 80);
  strip(-2, 26, -0.3, 64);
  c.restore();
};

const sesame: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  for (let i = 0; i < 11; i++) {
    const a = r() * TAU;
    const d = 8 + r() * 36;
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const rot = r() * Math.PI;
    const p = ell(x, y, 8, 4.6, rot);
    const black = i % 4 === 3;
    sticker(c, p, black ? '#3b312c' : '#f3e6cc', LW * 0.8, 1.5, 1, black ? '#241d1a' : '#d9c7a3');
    if (!black) {
      c.strokeStyle = ink(0.35);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x - Math.cos(rot) * 5, y - Math.sin(rot) * 5);
      c.lineTo(x + Math.cos(rot) * 5, y + Math.sin(rot) * 5);
      c.stroke();
    }
  }
  c.restore();
};

const pakchoi: Draw = (c, r) => {
  c.save();
  c.translate(64, 66);
  c.rotate((r() - 0.5) * 0.4);
  // white bulb stalk
  const stalk = new Path2D();
  stalk.moveTo(-2, 50);
  stalk.quadraticCurveTo(-28, 48, -24, 18);
  stalk.quadraticCurveTo(-20, -4, 0, -6);
  stalk.quadraticCurveTo(20, -4, 24, 18);
  stalk.quadraticCurveTo(28, 48, 2, 50);
  stalk.closePath();
  sticker(c, stalk, '#f4f0e2', LW, 3, 2, '#ddd5bf');
  // leaf
  const leaf = new Path2D();
  leaf.moveTo(0, 4);
  leaf.quadraticCurveTo(-42, -4, -36, -34);
  leaf.quadraticCurveTo(-24, -56, 0, -54);
  leaf.quadraticCurveTo(26, -56, 36, -34);
  leaf.quadraticCurveTo(44, -4, 0, 4);
  leaf.closePath();
  sticker(c, leaf, '#6f9a62', LW, 4, 3, '#55804c');
  // veins
  c.strokeStyle = ink(0.5);
  c.lineWidth = LW * 0.7;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(0, 2);
  c.quadraticCurveTo(2, -24, 0, -46);
  c.moveTo(0, -14);
  c.lineTo(-16, -26);
  c.moveTo(0, -14);
  c.lineTo(16, -28);
  c.moveTo(0, -30);
  c.lineTo(-10, -40);
  c.moveTo(0, -30);
  c.lineTo(10, -40);
  c.stroke();
  // stalk ribs
  c.strokeStyle = ink(0.3);
  c.beginPath();
  c.moveTo(-10, 12);
  c.quadraticCurveTo(-14, 30, -8, 46);
  c.moveTo(10, 12);
  c.quadraticCurveTo(14, 30, 8, 46);
  c.stroke();
  shine(c, -16, -36, 7, 3, -0.5, 0.5);
  c.restore();
};

const sprouts: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + r() * 0.6;
    const ox = (r() - 0.5) * 24;
    const oy = (r() - 0.5) * 24;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      const u = -36 + t * 72;
      const v = Math.sin(t * 3 + i) * 7;
      pts.push([ox + Math.cos(a) * u - Math.sin(a) * v, oy + Math.sin(a) * u + Math.cos(a) * v]);
    }
    const p = smoothOpen(pts);
    ribbon(c, p, '#f6f1e2', 5.5, LW * 0.5, 0.5);
    // yellow bean head
    const h = pts[0];
    const head = ell(h[0], h[1], 6.5, 5, a);
    sticker(c, head, '#e9cf6a', LW * 0.7, 1.5, 1, '#c9aa44');
  }
  c.restore();
};

const chili: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const pos: [number, number, number][] = [
    [-18, -14, 20],
    [18, -8, 17],
    [-4, 20, 18],
  ];
  for (const [x, y, R] of pos) {
    const o = ell(x, y, R, R * 0.9);
    sticker(c, o, '#d14a3a', LW, 2.5, 1.5, '#a83426');
    const i = ell(x + 0.5, y + 0.5, R * 0.62, R * 0.56);
    c.fillStyle = '#f6e9d8';
    c.fill(i);
    line(c, i, LW * 0.8, 0.6);
    // seeds
    c.fillStyle = '#e9c66a';
    for (let s = 0; s < 4; s++) {
      const a = (s / 4) * TAU + r();
      c.beginPath();
      c.ellipse(x + Math.cos(a) * R * 0.32, y + Math.sin(a) * R * 0.3, 2.6, 1.8, a, 0, TAU);
      c.fill();
    }
    shine(c, x - R * 0.5, y - R * 0.45, R * 0.2, R * 0.1, -0.6, 0.6);
  }
  c.restore();
};

const kimchi: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const leaf = (x: number, y: number, rot: number, s: number) => {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.scale(s, s);
    const p = new Path2D();
    p.moveTo(-30, 10);
    p.quadraticCurveTo(-34, -10, -16, -16);
    p.quadraticCurveTo(-6, -24, 6, -16);
    p.quadraticCurveTo(20, -24, 30, -8);
    p.quadraticCurveTo(36, 8, 22, 16);
    p.quadraticCurveTo(10, 22, -4, 14);
    p.quadraticCurveTo(-18, 22, -30, 10);
    p.closePath();
    sticker(c, p, '#e56f3a', LW, 3, 2, '#c2502a');
    // pale stem vein
    c.strokeStyle = '#f6d9b8';
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-24, 6);
    c.quadraticCurveTo(0, -4, 24, 2);
    c.stroke();
    line(
      c,
      (() => {
        const q = new Path2D();
        q.moveTo(-24, 6);
        q.quadraticCurveTo(0, -4, 24, 2);
        return q;
      })(),
      LW * 0.6,
      0.4
    );
    // chilli flakes
    c.fillStyle = '#8e2412';
    for (let i = 0; i < 5; i++) {
      c.beginPath();
      c.ellipse(-20 + r() * 40, -10 + r() * 20, 2.2, 1.4, r() * 3, 0, TAU);
      c.fill();
    }
    shine(c, -14, -8, 6, 2.6, -0.3, 0.5);
    c.restore();
  };
  leaf(-10, -14, -0.5, 1.05);
  leaf(12, 12, 0.6, 1);
  c.restore();
};

const lime: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  // wedge: half disc with rind
  const R = 46;
  const wedge = new Path2D();
  wedge.moveTo(-R, 0);
  wedge.arc(0, 0, R, Math.PI, TAU);
  wedge.closePath();
  sticker(c, wedge, '#8bb35a', LW, 3, 2, '#6f9444');
  const pith = new Path2D();
  pith.moveTo(-R + 7, -1);
  pith.arc(0, -1, R - 7, Math.PI, TAU);
  pith.closePath();
  c.fillStyle = '#eef3d6';
  c.fill(pith);
  const flesh = new Path2D();
  flesh.moveTo(-R + 11, -4);
  flesh.arc(0, -4, R - 11, Math.PI, TAU);
  flesh.closePath();
  c.fillStyle = '#c8de7a';
  c.fill(flesh);
  line(c, flesh, LW * 0.7, 0.55);
  // segment lines
  c.strokeStyle = '#eef3d6';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  for (let i = 1; i < 5; i++) {
    const a = Math.PI + (i / 5) * Math.PI;
    c.moveTo(0, -4);
    c.lineTo(Math.cos(a) * (R - 13), -4 + Math.sin(a) * (R - 13));
  }
  c.stroke();
  c.strokeStyle = ink(0.4);
  c.lineWidth = LW * 0.6;
  c.stroke();
  shine(c, -14, -24, 6, 3, -0.6, 0.55);
  c.restore();
};

const shallot: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  for (let i = 0; i < 9; i++) {
    const a = r() * TAU;
    const d = r() * 34;
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const rot = r() * TAU;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 4; k++) {
      const t = k / 4 - 0.5;
      pts.push([
        x + Math.cos(rot) * t * 22 - Math.sin(rot) * Math.sin(t * 5) * 5,
        y + Math.sin(rot) * t * 22 + Math.cos(rot) * Math.sin(t * 5) * 5,
      ]);
    }
    const p = smoothOpen(pts);
    ribbon(c, p, i % 3 ? '#c48a46' : '#9a622c', 5.5, LW * 0.55, 0.35);
  }
  c.restore();
};

const DRAW: Record<string, Draw> = {
  yumurta: egg,
  chashu,
  yesil: greenOnion,
  nori,
  misir: corn,
  mantar: shiitake,
  aciyag: chiliOil,
  tofu,
  karides: shrimp,
  naruto,
  bambu: bamboo,
  susam: sesame,
  pakchoi,
  filiz: sprouts,
  biber: chili,
  kimchi,
  lime,
  citir: shallot,
};

const sprites = new Map<string, HTMLCanvasElement>();
export function sprite(id: string, variant = 0): HTMLCanvasElement {
  const key = id + ':' + (variant % 4);
  let cv = sprites.get(key);
  if (cv) return cv;
  cv = mk(S * SS, S * SS);
  const c = cv.getContext('2d')!;
  c.scale(SS, SS);
  (DRAW[id] ?? egg)(c, rng(hash(key)));
  sprites.set(key, cv);
  return cv;
}

export const PIECE_SIZE: Record<string, number> = {
  yumurta: 80,
  chashu: 86,
  yesil: 78,
  nori: 76,
  misir: 56,
  mantar: 64,
  aciyag: 58,
  tofu: 50,
  karides: 96,
  naruto: 66,
  bambu: 64,
  susam: 56,
  pakchoi: 88,
  filiz: 74,
  biber: 58,
  kimchi: 66,
  lime: 58,
  citir: 56,
};

export function drawPiece(c: Ctx, p: PieceLike) {
  const img = sprite(p.id, p.k);
  const size = (PIECE_SIZE[p.id] ?? 60) * p.s;
  c.save();
  c.translate(p.x, p.y);
  c.rotate((p.r * Math.PI) / 180);
  c.shadowColor = ink(0.28);
  c.shadowBlur = 2;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2;
  c.drawImage(img, -size / 2, -size / 2, size, size);
  c.restore();
}

// ---------- noodles ----------
const NOODLE_COL: Record<string, string> = {
  ramen: '#f3d47f',
  udon: '#f8f1e2',
  soba: '#a8835c',
  pirinc: '#faf6ee',
};
const NOODLE_WMUL: Record<string, number> = { ramen: 1, udon: 1.35, soba: 0.9, pirinc: 0.85 };

interface StrandStyle {
  col: string;
  w: number;
  hiA: number;
  lw: number;
}

function strandStyle(noodle: string, thick: Thick, cook: string, sauce?: string): StrandStyle {
  let col = NOODLE_COL[noodle] ?? NOODLE_COL.ramen;
  if (sauce) col = mixHex(col, INGREDIENTS[sauce].color, 0.35);
  let w = THICK_W[thick] * (NOODLE_WMUL[noodle] ?? 1) * 1.55;
  let hiA = noodle === 'soba' ? 0.35 : 0.55;
  let lw = 1.3;
  if (cook === 'raw') {
    col = mixHex(col, '#fff6e8', 0.35);
    hiA *= 0.4;
  }
  if (cook === 'soft') {
    w *= 1.15;
    hiA *= 0.6;
    lw = 1.1;
  }
  if (cook === 'burnt') {
    col = mixHex(col, '#9b7a4a', 0.7);
    w *= 1.2;
    hiA = 0.1;
  }
  return { col, w, hiA, lw };
}

const nests = new Map<string, HTMLCanvasElement>();
/** a tidy nest of 10–14 wavy outlined strands in the 300×300 bowl space */
function nest(
  noodle: string,
  thick: Thick,
  cook: string,
  dry: boolean,
  sauce?: string
): HTMLCanvasElement {
  const key = [noodle, thick, cook, dry, sauce].join('|');
  let cv = nests.get(key);
  if (cv) return cv;
  const R = 2;
  cv = mk(300 * R, 300 * R);
  const c = cv.getContext('2d')!;
  c.scale(R, R);
  const r = rng(hash(noodle + thick + (dry ? 'd' : 's')));
  const st = strandStyle(noodle, thick, cook, sauce);
  const radius = dry ? 104 : 94;
  const count = thick === 'ince' ? 17 : thick === 'orta' ? 14 : 11;
  const wave = cook === 'raw' ? 0.3 : cook === 'soft' ? 0.8 : 1;
  const cx = 150;
  const cy = 150;
  const strands: Path2D[] = [];
  // the nest: overlapping, slightly off-centre loops, each a gently wobbling ring
  for (let i = 0; i < count; i++) {
    const pts: [number, number][] = [];
    const t0 = (i + 0.5) / count;
    const base = radius * (0.26 + 0.68 * t0);
    const ox = (r() - 0.5) * radius * 0.28 * (1 - t0);
    const oy = (r() - 0.5) * radius * 0.28 * (1 - t0);
    const ex = 0.88 + r() * 0.24;
    const turns = 0.7 + r() * 0.45;
    const a0 = r() * TAU;
    const dir = i % 4 === 1 ? -1 : 1;
    const amp = (3 + r() * 4) * wave;
    const freq = 2 + Math.floor(r() * 3);
    const ph = r() * TAU;
    const segs = Math.round(30 * turns);
    for (let k = 0; k <= segs; k++) {
      const t = k / segs;
      const a = a0 + dir * t * TAU * turns;
      const rad = base + Math.sin(t * freq * TAU + ph) * amp;
      const x = ox + Math.cos(a) * rad * ex;
      const y = oy + Math.sin(a) * rad;
      const d = Math.hypot(x, y);
      const lim = radius - st.w / 2 - 2;
      const k2 = d > lim ? lim / d : 1;
      pts.push([cx + x * k2, cy + y * k2]);
    }
    strands.push(smoothOpen(pts));
  }
  // two strands draped across the top
  for (let i = 0; i < 2; i++) {
    const a = r() * TAU;
    const off = (r() - 0.5) * radius * 0.5;
    const len = Math.sqrt(Math.max(0, radius * radius - off * off)) * 1.3;
    const amp = (9 + r() * 7) * wave;
    const ph = r() * TAU;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 16; k++) {
      const t = k / 16 - 0.5;
      const u = t * len;
      const v = off + Math.sin(t * 5 + ph) * amp + Math.cos(t * 2.2) * amp * 0.5;
      const x = Math.cos(a) * u - Math.sin(a) * v;
      const y = Math.sin(a) * u + Math.cos(a) * v;
      const d = Math.hypot(x, y);
      const lim = radius - st.w / 2 - 3;
      const k2 = d > lim ? lim / d : 1;
      pts.push([cx + x * k2, cy + y * k2]);
    }
    strands.push(smoothOpen(pts));
  }
  for (const p of strands) ribbon(c, p, st.col, st.w, st.lw, st.hiA);
  if (cook === 'burnt') {
    // scorch spots
    c.fillStyle = ink(0.45);
    for (let i = 0; i < 22; i++) {
      const a = r() * TAU;
      const d = r() * radius * 0.85;
      c.beginPath();
      c.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3 + r() * 3, 2, a, 0, TAU);
      c.fill();
    }
  }
  nests.set(key, cv);
  return cv;
}

/** a neat folded bundle of noodles (for trays) in a w×h box centred at 0,0 */
function bundle(c: Ctx, noodle: string, thick: Thick, w: number, h: number, seed: number) {
  const r = rng(seed);
  const st = strandStyle(noodle, thick, 'perfect');
  const sw = st.w * 0.8;
  const box = rrect(-w / 2, -h / 2, w, h, h * 0.4);
  c.save();
  c.clip(box);
  c.fillStyle = dark(st.col);
  c.fillRect(-w / 2, -h / 2, w, h);
  const gap = sw * 1.05;
  const n = Math.ceil(h / gap) + 2;
  for (let i = 0; i < n; i++) {
    const y0 = -h / 2 + i * gap + gap * 0.3;
    const ph = r() * TAU;
    const amp = 1.5 + r() * 1.5;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 10; k++) {
      const x = -w / 2 - 6 + (k / 10) * (w + 12);
      pts.push([x, y0 + Math.sin(k * 0.9 + ph) * amp]);
    }
    ribbon(c, smoothOpen(pts), st.col, sw, 1, st.hiA * 0.6);
  }
  c.restore();
  line(c, box, 1.3);
}

// ---------- bowl ----------
export const BOWL_R = 122;

/** glaze patterns drawn as clean line motifs on the rim band (r 131..146) */
function drawRimPattern(c: Ctx, st: BowlStyle) {
  if (st.pattern === 'none') return;
  const cx = 150;
  const cy = 150;
  const col = st.patternColor;
  c.save();
  const band = new Path2D();
  band.arc(cx, cy, 145, 0, TAU);
  band.arc(cx, cy, 133, 0, TAU, true);
  c.clip(band, 'evenodd');
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const rm = 139;
  switch (st.pattern) {
    case 'wave': {
      // seigaiha: overlapping scallop arcs
      c.lineWidth = 1.4;
      for (let row = 0; row < 3; row++) {
        const rr = 146 - row * 4.5;
        const n = 34;
        for (let i = 0; i < n; i++) {
          const a = ((i + (row % 2) * 0.5) / n) * TAU;
          const x = cx + Math.cos(a) * rr;
          const y = cy + Math.sin(a) * rr;
          c.beginPath();
          c.arc(x, y, 6.5, a - Math.PI / 2, a + Math.PI / 2);
          c.stroke();
        }
      }
      break;
    }
    case 'gold': {
      c.lineWidth = 1.6;
      for (const rr of [143.5, 135.5]) {
        c.beginPath();
        c.arc(cx, cy, rr, 0, TAU);
        c.stroke();
      }
      c.lineWidth = 1.2;
      const n = 48;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * 137.5, cy + Math.sin(a) * 137.5);
        c.lineTo(cx + Math.cos(a) * 141.5, cy + Math.sin(a) * 141.5);
        c.stroke();
      }
      break;
    }
    case 'sakura': {
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        const x = cx + Math.cos(a) * rm;
        const y = cy + Math.sin(a) * rm;
        for (let p = 0; p < 5; p++) {
          const pa = a + (p / 5) * TAU;
          const px = x + Math.cos(pa) * 3.2;
          const py = y + Math.sin(pa) * 3.2;
          c.beginPath();
          c.ellipse(px, py, 2.4, 1.8, pa, 0, TAU);
          c.fill();
        }
        c.fillStyle = hi(0.9);
        c.beginPath();
        c.arc(x, y, 1.3, 0, TAU);
        c.fill();
        c.fillStyle = col;
        // small dot between flowers
        const a2 = a + Math.PI / n;
        c.beginPath();
        c.arc(cx + Math.cos(a2) * rm, cy + Math.sin(a2) * rm, 1.2, 0, TAU);
        c.fill();
      }
      break;
    }
    case 'tenmoku': {
      // hare's fur: radiating fine strokes
      const n = 90;
      const r = rng(7);
      c.lineWidth = 1.1;
      c.globalAlpha = 0.85;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + r() * 0.03;
        const r0 = 133 + r() * 4;
        const r1 = 141 + r() * 5;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
        c.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        c.stroke();
      }
      break;
    }
    case 'crackle': {
      const r = rng(11);
      c.lineWidth = 1;
      c.globalAlpha = 0.7;
      const n = 26;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + r() * 0.2;
        let x = cx + Math.cos(a) * 133;
        let y = cy + Math.sin(a) * 133;
        c.beginPath();
        c.moveTo(x, y);
        for (let k = 0; k < 3; k++) {
          const da = a + (r() - 0.5) * 1.2;
          x += Math.cos(da) * 5;
          y += Math.sin(da) * 5;
          c.lineTo(x, y);
        }
        c.stroke();
      }
      break;
    }
    case 'stripes': {
      const n = 36;
      c.lineWidth = 2.2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * 133, cy + Math.sin(a) * 133);
        c.lineTo(cx + Math.cos(a) * 146, cy + Math.sin(a) * 146);
        c.stroke();
      }
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(cx, cy, 135.5, 0, TAU);
      c.stroke();
      break;
    }
    case 'dots': {
      const n = 24;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        c.beginPath();
        c.arc(cx + Math.cos(a) * rm, cy + Math.sin(a) * rm, 2.6, 0, TAU);
        c.fill();
        c.strokeStyle = ink(0.5);
        c.lineWidth = 1;
        c.stroke();
      }
      break;
    }
  }
  c.restore();
}

/** 3–5 big outlined fat rings floating on the broth */
function fatRings(c: Ctx, r: () => number, cx: number, cy: number, rad: number, col: string) {
  const n = 3 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r() * 0.9;
    const d = rad * (0.3 + r() * 0.55);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rr = 7 + r() * 8;
    const p = ell(x, y, rr, rr * 0.86);
    c.fillStyle = tint(col, 0.3, 0.32);
    c.fill(p);
    line(c, p, 1, 0.35);
    shine(c, x - rr * 0.4, y - rr * 0.35, rr * 0.3, rr * 0.16, -0.6, 0.45);
  }
}

export function drawBowl(c: Ctx, b: BowlDraw) {
  const cx = 150;
  const cy = 150;
  c.clearRect(0, 0, 300, 300);
  const st: BowlStyle = BOWLS[b.style ?? DEFAULT_BOWL] ?? BOWLS[DEFAULT_BOWL];
  const glaze = b.takeaway ? '#d2b58a' : st.glaze[1];
  const glazeDark = b.takeaway ? '#a8895e' : st.glaze[2];
  const lip = b.takeaway ? '#efe2c8' : st.lip;
  const ic = b.takeaway ? BOWLS[DEFAULT_BOWL].inner : st.inner;
  // cast shadow: one flat offset disc
  c.fillStyle = ink(0.16);
  c.beginPath();
  c.ellipse(cx + 3, cy + 9, 146, 144, 0, 0, TAU);
  c.fill();
  // outer glaze: flat + one shadow tone + outline
  const rim = ell(cx, cy, 146, 146);
  flat(c, rim, glaze, 6, 4, glazeDark);
  if (!b.takeaway) drawRimPattern(c, st);
  else {
    // kraft ridges
    c.strokeStyle = ink(0.18);
    c.lineWidth = 1.2;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * 134, cy + Math.sin(a) * 134);
      c.lineTo(cx + Math.cos(a) * 145, cy + Math.sin(a) * 145);
      c.stroke();
    }
  }
  line(c, rim, 1.5);
  // one highlight arc on the glaze
  c.strokeStyle = hi(0.6);
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(cx, cy, 140, Math.PI * 1.1, Math.PI * 1.32);
  c.stroke();
  // lip band
  c.beginPath();
  c.arc(cx, cy, 130.5, 0, TAU);
  c.lineWidth = 5;
  c.strokeStyle = lip;
  c.stroke();
  c.lineWidth = 1.2;
  c.strokeStyle = ink(0.7);
  c.beginPath();
  c.arc(cx, cy, 133, 0, TAU);
  c.stroke();
  // interior: flat cream + darker inner ring near the wall + outline
  const inner = ell(cx, cy, 128, 128);
  c.fillStyle = ic[2];
  c.fill(inner);
  c.save();
  c.clip(inner);
  c.fillStyle = ic[1];
  c.shadowColor = ic[1];
  c.shadowBlur = 6;
  c.beginPath();
  c.ellipse(cx - 3, cy - 4, 115, 114, 0, 0, TAU);
  c.fill();
  c.restore();
  line(c, inner, 1.3);
  // one highlight arc on the inner wall
  c.strokeStyle = hi(0.65);
  c.lineWidth = 3.5;
  c.beginPath();
  c.arc(cx, cy, 120, Math.PI * 1.12, Math.PI * 1.38);
  c.stroke();

  const liq = b.liquid ? INGREDIENTS[b.liquid] : null;
  const isSauce = liq?.cat === 'sauce';
  const f = Math.min(1, b.fill);
  c.save();
  c.clip(inner);

  let pool: Path2D | null = null;
  if (liq && !isSauce && f > 0) {
    // broth: single-tone pool with a darker rim tone
    const rad = 64 + 66 * f;
    pool = ell(cx, cy, rad, rad);
    c.fillStyle = dark(liq.color);
    c.fill(pool);
    c.save();
    c.clip(pool);
    c.fillStyle = liq.color;
    c.shadowColor = liq.color;
    c.shadowBlur = 5;
    c.beginPath();
    c.ellipse(cx - 2, cy - 3, rad - 7, rad - 7, 0, 0, TAU);
    c.fill();
    c.restore();
    line(c, pool, 1.3, 0.7);
  }
  if (b.noodle) {
    const dry = isSauce || !liq;
    const img = nest(
      b.noodle,
      b.thick ?? 'orta',
      b.cook ?? 'perfect',
      dry,
      isSauce && f > 0.2 ? b.liquid : undefined
    );
    c.drawImage(img, 0, 0, 300, 300);
  }
  if (liq && pool) {
    // submerge the outer strands under a flat wash of broth, then fat rings
    const rad = 64 + 66 * f;
    c.save();
    c.clip(pool);
    const wash = new Path2D();
    wash.arc(cx, cy, rad, 0, TAU);
    wash.arc(cx, cy, rad * 0.62, 0, TAU, true);
    c.fillStyle = tint(liq.color, 0, 0.62 * f);
    c.fill(wash, 'evenodd');
    c.restore();
    fatRings(c, rng(hash(b.liquid!)), cx, cy, rad, liq.color);
    // one highlight on the surface
    c.strokeStyle = hi(0.5);
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(cx, cy, rad - 9, Math.PI * 1.15, Math.PI * 1.35);
    c.stroke();
  }
  if (liq && isSauce && f > 0) {
    // glossy outlined drizzle ribbons over the noodles
    const r = rng(hash(b.liquid! + 'z'));
    const ribbons = Math.round(2 + f * 2);
    for (let i = 0; i < ribbons; i++) {
      const a = (i / ribbons) * Math.PI + r() * 0.4;
      const pts: [number, number][] = [];
      const amp = 16 + r() * 10;
      const len = 150 + r() * 20;
      const ph = r() * TAU;
      const off = (r() - 0.5) * 30;
      for (let k = 0; k <= 16; k++) {
        const t = k / 16 - 0.5;
        const u = t * len;
        const v = off + Math.sin(t * 2.4 * TAU + ph) * amp;
        pts.push([cx + Math.cos(a) * u - Math.sin(a) * v, cy + Math.sin(a) * u + Math.cos(a) * v]);
      }
      c.globalAlpha = 0.92;
      ribbon(c, smoothOpen(pts), liq.color, 4.5 + r() * 1.5, 1.1, 0.5);
      c.globalAlpha = 1;
    }
    if (b.liquid === 'tatliaci') {
      c.fillStyle = '#8e1e12';
      for (let i = 0; i < 20; i++) {
        c.beginPath();
        c.roundRect(cx - 90 + r() * 180, cy - 90 + r() * 180, 2.6, 1.8, 0.8);
        c.fill();
      }
    }
  }
  c.restore();
  // overflow spill
  if (liq && b.fill > 1.03) {
    c.save();
    c.globalAlpha = Math.min(0.85, (b.fill - 1) * 3);
    const r = rng(9);
    for (let i = 0; i < 6; i++) {
      const a = r() * TAU;
      const p = ell(
        cx + Math.cos(a) * 140,
        cy + Math.sin(a) * 140,
        16 + r() * 10,
        8,
        a + Math.PI / 2
      );
      sticker(c, p, liq.color, 1.2, 2, 1);
    }
    c.restore();
  }
  for (const p of b.pieces) drawPiece(c, p);
}

// ---------- trays (ingredient bins) ----------
const TRAY_W = 240;
const TRAY_H = 170;
const TRAY_SS = 2;

/** how a topping is laid out in its tub: sprite size and a row/col grid */
const TRAY_LAYOUT: Record<string, [number, number, number]> = {
  // id: [size, cols, rows]
  yumurta: [92, 3, 2],
  chashu: [96, 3, 2],
  yesil: [86, 3, 2],
  nori: [84, 3, 2],
  misir: [70, 4, 2],
  mantar: [76, 3, 2],
  aciyag: [78, 3, 2],
  tofu: [64, 4, 2],
  karides: [104, 3, 2],
  naruto: [78, 3, 2],
  bambu: [80, 3, 2],
  susam: [78, 3, 2],
  pakchoi: [100, 3, 2],
  filiz: [86, 3, 2],
  biber: [72, 3, 2],
  kimchi: [80, 3, 2],
  lime: [72, 3, 2],
  citir: [76, 3, 2],
};

const trays = new Map<string, HTMLCanvasElement>();
export function trayImage(id: string, thick: Thick = 'orta'): HTMLCanvasElement {
  const key = id + thick;
  let cv = trays.get(key);
  if (cv) return cv;
  const W = TRAY_W;
  const H = TRAY_H;
  cv = mk(W * TRAY_SS, H * TRAY_SS);
  const c = cv.getContext('2d')!;
  c.scale(TRAY_SS, TRAY_SS);
  const ing = INGREDIENTS[id];
  const r = rng(hash(key));
  const liquid = ing.cat === 'broth' || ing.cat === 'sauce';

  // stainless tub: outer flange + inner well, seen from above
  const M = 8;
  const outer = rrect(M, M + 2, W - M * 2, H - M * 2 - 2, 20);
  c.fillStyle = ink(0.16);
  c.fill(rrect(M + 2, M + 8, W - M * 2, H - M * 2 - 2, 20));
  flat(
    c,
    outer,
    liquid && ing.cat === 'sauce' ? '#efe6d4' : '#d4d9dd',
    5,
    3,
    liquid && ing.cat === 'sauce' ? '#cdbfa5' : '#a9b1b8'
  );
  line(c, outer, 1.5);
  const IM = M + 13;
  const well = rrect(IM, IM + 1, W - IM * 2, H - IM * 2 - 1, 12);
  c.fillStyle = liquid && ing.cat === 'sauce' ? '#d9ccb4' : '#9aa3aa';
  c.fill(well);
  line(c, well, 1.3);
  // one highlight on the flange
  c.strokeStyle = hi(0.7);
  c.lineWidth = 2.5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(M + 26, M + 8);
  c.lineTo(W * 0.46, M + 8);
  c.stroke();

  c.save();
  c.clip(well);
  if (liquid) {
    // liquid filling the well with a darker rim tone, fat rings and a ladle
    const col = ing.color;
    c.fillStyle = dark(col);
    c.fill(well);
    c.fillStyle = col;
    c.shadowColor = col;
    c.shadowBlur = 5;
    c.fill(rrect(IM + 5, IM + 5, W - IM * 2 - 10, H - IM * 2 - 12, 10));
    c.shadowBlur = 0;
    fatRings(c, r, W / 2, H / 2, 70, col);
    c.strokeStyle = hi(0.5);
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(IM + 16, IM + 12);
    c.lineTo(IM + 60, IM + 12);
    c.stroke();
    // ladle
    c.save();
    c.translate(W / 2 + 34, H / 2 + 6);
    c.rotate(-0.5);
    const handle = rrect(-5, -92, 10, 92, 5);
    sticker(c, handle, '#c9ced3', 1.4, 2, 1, '#8f989f');
    const cup = ell(0, 0, 24, 22);
    sticker(c, cup, '#d4d9dd', 1.5, 3, 2, '#9aa3aa');
    const inside = ell(0, 1, 18, 16);
    c.fillStyle = col;
    c.fill(inside);
    line(c, inside, 1.1, 0.6);
    shine(c, -8, -8, 5, 2.4, -0.6, 0.7);
    c.restore();
  } else if (ing.cat === 'noodle') {
    // three neat bundles side by side, slightly fanned
    const bw = 58;
    const bh = H - IM * 2 - 16;
    for (let i = 0; i < 3; i++) {
      c.save();
      c.translate(W / 2 + (i - 1) * 64, H / 2 + (i === 1 ? -2 : 2));
      c.rotate((i - 1) * 0.08);
      bundle(c, id, thick, bw, bh, hash(key) + i);
      c.restore();
    }
  } else {
    // toppings: neat overlapping grid of sprites
    const [size, cols, rows] = TRAY_LAYOUT[id] ?? [80, 3, 2];
    const img = (k: number) => sprite(id, k);
    const x0 = IM + 6;
    const y0 = IM + 4;
    const gx = (W - IM * 2 - 12) / cols;
    const gy = (H - IM * 2 - 8) / rows;
    let k = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = x0 + gx * (col + 0.5) + (row % 2 ? gx * 0.18 : -gx * 0.12) + (r() - 0.5) * 6;
        const y = y0 + gy * (row + 0.5) + (r() - 0.5) * 6;
        c.save();
        c.translate(x, y);
        c.rotate((r() - 0.5) * 0.7);
        c.shadowColor = ink(0.22);
        c.shadowBlur = 2;
        c.shadowOffsetY = 2;
        c.drawImage(img(k++), -size / 2, -size / 2, size, size);
        c.restore();
      }
    }
  }
  c.restore();
  trays.set(key, cv);
  return cv;
}
