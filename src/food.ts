// Food rendering on Canvas 2D in the "illustrative realism" style described in
// ART_DIRECTION.md: clean shapes, base tone + shadow tone + one soft highlight,
// 2–3 stop gradients, tonal edges instead of outlines, no noise/grain.
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

/** warm white highlight / warm ink shadow (never pure white or black) */
const hi = (a: number) => `rgba(255,246,232,${a})`;
const ink = (a: number) => `rgba(43,36,32,${a})`;

/** soft elliptical highlight */
function gloss(c: Ctx, x: number, y: number, rx: number, ry: number, rot = -0.6, a = 0.55) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, hi(a));
  g.addColorStop(0.55, hi(a * 0.45));
  g.addColorStop(1, hi(0));
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, rx, 0, TAU);
  c.fill();
  c.restore();
}
/** tonal edge: a slightly darker same-hue band just inside the shape */
function edge(c: Ctx, p: Path2D, col: string, w = 2) {
  c.save();
  c.clip(p);
  c.strokeStyle = col;
  c.lineWidth = w * 2;
  c.stroke(p);
  c.restore();
}
function radial(
  c: Ctx,
  x0: number,
  y0: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
  stops: [number, string][]
) {
  const g = c.createRadialGradient(x0, y0, r0, x1, y1, r1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}
function linear(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}
function blob(r: () => number, cx: number, cy: number, rad: number, wob: number, n = 14) {
  const p = new Path2D();
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = rad * (1 - wob / 2 + r() * wob);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
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
function spiralPath(
  c: Ctx,
  r0: number,
  step: number,
  turns: number,
  sx = 1,
  sy = 1,
  ox = 0,
  oy = 0
) {
  c.beginPath();
  for (let a = 0, rr = r0; a < TAU * turns; a += 0.08, rr += step * 0.08) {
    const x = Math.cos(a) * rr * sx + ox;
    const y = Math.sin(a) * rr * sy + oy;
    if (a === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
}

// ---------- topping sprites (drawn in a 128x128 space, centered at 64,64) ----------
const S = 128;
const SS = 2; // sprite supersampling
type Draw = (c: Ctx, r: () => number) => void;

const egg: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.5);
  const w = new Path2D();
  w.ellipse(0, 0, 49, 39, 0, 0, TAU);
  c.fillStyle = radial(c, -10, -12, 6, 0, 0, 50, [
    [0, '#fff8ec'],
    [0.6, '#f8e9d2'],
    [0.86, '#e6c796'],
    [1, '#c99b62'],
  ]);
  c.fill(w);
  edge(c, w, 'rgba(160,112,58,.85)', 2);
  // soft membrane between white and yolk
  const y = new Path2D();
  y.ellipse(3, 3, 26, 22, 0, 0, TAU);
  c.strokeStyle = 'rgba(255,236,205,.9)';
  c.lineWidth = 3.5;
  c.stroke(y);
  c.fillStyle = radial(c, -5, -7, 2, 3, 3, 27, [
    [0, '#ffc657'],
    [0.5, '#f7961f'],
    [0.85, '#e0701a'],
    [1, '#c65c16'],
  ]);
  c.fill(y);
  edge(c, y, 'rgba(170,76,18,.5)', 1.3);
  // jammy sheen + one crisp specular
  gloss(c, -6, -7, 14, 8, -0.55, 0.55);
  c.fillStyle = hi(0.92);
  c.beginPath();
  c.ellipse(-9, -10, 4.2, 2.4, -0.5, 0, TAU);
  c.fill();
  gloss(c, -22, -20, 16, 7, -0.5, 0.3);
  c.restore();
};

const chashu: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const outer = blob(r, 0, 0, 52, 0.08, 18);
  // caramelized seared crust
  c.fillStyle = radial(c, 0, 0, 38, 0, 0, 53, [
    [0, '#9a553a'],
    [0.6, '#73361f'],
    [1, '#4f2314'],
  ]);
  c.fill(outer);
  const inner = blob(r, 0, 0, 45, 0.07, 18);
  c.fillStyle = radial(c, -12, -14, 4, 0, 0, 47, [
    [0, '#e8b89e'],
    [0.65, '#d79c82'],
    [1, '#bd7e62'],
  ]);
  c.fill(inner);
  c.save();
  c.clip(inner);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // rolled belly: spiral band of fat
  spiralPath(c, 6, 5.2, 2.3, 1.05, 0.95, 1.5, 1.5);
  c.strokeStyle = 'rgba(165,98,70,.45)';
  c.lineWidth = 10;
  c.stroke();
  spiralPath(c, 6, 5.2, 2.3, 1.05, 0.95);
  c.strokeStyle = '#f6e6d8';
  c.lineWidth = 8.5;
  c.stroke();
  spiralPath(c, 6, 5.2, 2.3, 1.05, 0.95, -0.8, -0.8);
  c.strokeStyle = 'rgba(255,250,244,.8)';
  c.lineWidth = 2.6;
  c.stroke();
  // a few soft muscle fibres between the turns
  c.strokeStyle = 'rgba(150,80,55,.22)';
  c.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    const a0 = r() * TAU;
    const rr = 12 + r() * 28;
    c.beginPath();
    c.arc(0, 0, rr, a0, a0 + 0.5);
    c.stroke();
  }
  c.restore();
  edge(c, inner, 'rgba(140,70,40,.45)', 1.2);
  gloss(c, -16, -18, 24, 10, -0.7, 0.3);
  c.restore();
};

function onionRing(c: Ctx, r: () => number, x: number, y: number, R: number, white: boolean) {
  const rot = r() * Math.PI;
  const sq = 0.66 + r() * 0.3; // diagonal cut → oval
  const wall = R * 0.34;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, sq);
  const ring = new Path2D();
  ring.arc(0, 0, R, 0, TAU);
  ring.arc(0, 0, R - wall, 0, TAU, true);
  c.save();
  c.shadowColor = ink(0.3);
  c.shadowBlur = 3;
  c.shadowOffsetY = 1.5;
  c.fillStyle = radial(
    c,
    0,
    0,
    R - wall,
    0,
    0,
    R,
    white
      ? [
          [0, '#f6f9ea'],
          [0.6, '#e6eed3'],
          [1, '#c2d6a2'],
        ]
      : [
          [0, '#d3e8ad'],
          [0.45, '#93c46a'],
          [1, '#51903b'],
        ]
  );
  c.fill(ring, 'evenodd');
  c.restore();
  // layered walls
  c.lineWidth = 1.1;
  c.strokeStyle = white ? 'rgba(150,175,110,.5)' : 'rgba(60,110,40,.5)';
  c.beginPath();
  c.arc(0, 0, R - wall * 0.5, 0, TAU);
  c.stroke();
  // outer skin (tonal edge)
  c.lineWidth = 1.4;
  c.strokeStyle = white ? 'rgba(140,170,100,.6)' : 'rgba(40,85,30,.7)';
  c.beginPath();
  c.arc(0, 0, R - 0.7, 0, TAU);
  c.stroke();
  // inner cavity edge
  c.strokeStyle = 'rgba(240,250,225,.9)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, 0, R - wall + 0.6, 0, TAU);
  c.stroke();
  // wet highlight
  c.strokeStyle = hi(0.85);
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 0, R - wall * 0.5, Math.PI * 1.08, Math.PI * 1.42);
  c.stroke();
  c.restore();
}

const greenOnion: Draw = (c, r) => {
  const n = 6;
  onionRing(c, r, 64, 64, 17, false);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r() * 0.5;
    const d = 27 + r() * 8;
    onionRing(c, r, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 14 + r() * 6, i === 2);
  }
};

const nori: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.25);
  const p = new Path2D();
  p.moveTo(-32, -50);
  p.lineTo(32, -52);
  p.lineTo(33, 50);
  p.lineTo(-32, 52);
  p.closePath();
  c.fillStyle = linear(c, -32, -50, 32, 50, [
    [0, '#2e4b37'],
    [0.45, '#1b2f22'],
    [0.72, '#22392a'],
    [1, '#15251b'],
  ]);
  c.fill(p);
  // subtle diagonal sheen
  c.fillStyle = linear(c, -24, -50, 24, 50, [
    [0, hi(0)],
    [0.38, hi(0.07)],
    [0.5, hi(0.16)],
    [0.62, hi(0.07)],
    [1, hi(0)],
  ]);
  c.fill(p);
  edge(c, p, 'rgba(14,26,18,.75)', 1.2);
  // curled corner
  const cut = new Path2D();
  cut.moveTo(33, 50);
  cut.lineTo(33, 28);
  cut.lineTo(11, 52);
  cut.closePath();
  c.globalCompositeOperation = 'destination-out';
  c.fill(cut);
  c.globalCompositeOperation = 'source-over';
  const flap = new Path2D();
  flap.moveTo(33, 28);
  flap.quadraticCurveTo(20, 34, 11, 52);
  flap.quadraticCurveTo(14, 36, 33, 28);
  flap.closePath();
  c.save();
  c.shadowColor = ink(0.35);
  c.shadowBlur = 3;
  c.shadowOffsetX = -1;
  c.shadowOffsetY = 1;
  c.fillStyle = linear(c, 33, 28, 14, 50, [
    [0, '#5c8263'],
    [1, '#35553f'],
  ]);
  c.fill(flap);
  c.restore();
  c.restore();
};

function kernel(c: Ctx, x: number, y: number, rot: number, s = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  const p = new Path2D();
  p.moveTo(-8, -4);
  p.quadraticCurveTo(-8, -9, -2.5, -9);
  p.lineTo(2.5, -9);
  p.quadraticCurveTo(8, -9, 8, -4);
  p.lineTo(7, 4);
  p.quadraticCurveTo(6, 9, 0, 9);
  p.quadraticCurveTo(-6, 9, -7, 4);
  p.closePath();
  c.fillStyle = radial(c, -2, -3, 1, 0, 0, 11, [
    [0, '#ffe98f'],
    [0.55, '#f9c43a'],
    [1, '#dc9a1c'],
  ]);
  c.fill(p);
  edge(c, p, 'rgba(190,125,20,.6)', 1);
  // dimple
  c.strokeStyle = 'rgba(200,140,30,.5)';
  c.lineWidth = 1.2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-3, -6.5);
  c.quadraticCurveTo(0, -3.5, 3, -6.5);
  c.stroke();
  c.fillStyle = hi(0.8);
  c.beginPath();
  c.ellipse(-3, -2.5, 2.6, 1.5, -0.6, 0, TAU);
  c.fill();
  c.restore();
}
const corn: Draw = (c, r) => {
  for (let i = 0; i < 12; i++) {
    const d = 10.5 * Math.sqrt(i);
    const a = i * 2.4 + r() * 0.3;
    kernel(c, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, r() * TAU, 1.25);
  }
};

const shiitake: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const cap = blob(r, 0, 0, 47, 0.08, 16);
  c.fillStyle = radial(c, -12, -14, 4, 0, 0, 50, [
    [0, '#a26e4a'],
    [0.55, '#7b4b2d'],
    [0.88, '#5b3521'],
    [1, '#46281a'],
  ]);
  c.fill(cap);
  edge(c, cap, 'rgba(60,32,18,.7)', 1.6);
  // decorative cross-scoring showing the pale flesh
  for (let i = 0; i < 3; i++) {
    c.save();
    c.rotate((i / 3) * Math.PI + 0.3);
    const cut = new Path2D();
    cut.moveTo(-28, 0);
    cut.quadraticCurveTo(0, -5.5, 28, 0);
    cut.quadraticCurveTo(0, 5.5, -28, 0);
    cut.closePath();
    c.fillStyle = linear(c, 0, -5, 0, 5, [
      [0, '#d6bf9c'],
      [0.5, '#f4e6cc'],
      [1, '#e8d4b2'],
    ]);
    c.fill(cut);
    c.strokeStyle = 'rgba(60,32,18,.4)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-28, 0);
    c.quadraticCurveTo(0, -5.5, 28, 0);
    c.stroke();
    c.restore();
  }
  gloss(c, -16, -18, 22, 10, -0.7, 0.28);
  c.restore();
};

const chiliOil: Draw = (c, r) => {
  const pools: [number, number, number, number][] = [
    [62, 62, 30, 22],
    [36, 82, 14, 10],
    [94, 44, 12, 9],
    [88, 90, 10, 8],
  ];
  for (const [x, y, rx, ry] of pools) {
    c.save();
    c.translate(x, y);
    c.rotate((r() - 0.5) * 0.8);
    c.fillStyle = radial(c, -rx * 0.3, -ry * 0.3, 1, 0, 0, rx, [
      [0, 'rgba(242,118,66,.85)'],
      [0.6, 'rgba(214,62,30,.8)'],
      [0.9, 'rgba(178,40,20,.72)'],
      [1, 'rgba(150,30,14,0)'],
    ]);
    c.beginPath();
    c.ellipse(0, 0, rx, ry, 0, 0, TAU);
    c.fill();
    gloss(c, -rx * 0.35, -ry * 0.4, rx * 0.45, ry * 0.3, -0.5, 0.6);
    c.restore();
  }
  c.fillStyle = '#8a1d0c';
  for (let i = 0; i < 9; i++) {
    c.save();
    c.translate(64 + (r() - 0.5) * 64, 64 + (r() - 0.5) * 56);
    c.rotate(r() * TAU);
    c.beginPath();
    c.roundRect(-1.8, -1.2, 3.6, 2.4, 1);
    c.fill();
    c.restore();
  }
};

const tofu: Draw = (c, r) => {
  c.save();
  c.translate(62, 62);
  c.rotate((r() - 0.5) * 0.5);
  // side faces give the cube a little height
  const side = new Path2D();
  side.roundRect(-26, -26, 60, 60, 9);
  c.fillStyle = '#a9692b';
  c.fill(side);
  const top = new Path2D();
  top.roundRect(-30, -30, 60, 60, 9);
  c.fillStyle = linear(c, -30, -30, 30, 30, [
    [0, '#f7d690'],
    [0.5, '#e7b45c'],
    [1, '#cf9440'],
  ]);
  c.fill(top);
  edge(c, top, 'rgba(170,105,40,.7)', 1.6);
  // slightly softer, paler centre (the tofu inside the crisp skin)
  const inn = new Path2D();
  inn.roundRect(-20, -20, 40, 40, 6);
  c.fillStyle = 'rgba(255,240,205,.22)';
  c.fill(inn);
  for (let i = 0; i < 4; i++) gloss(c, (r() - 0.5) * 36, (r() - 0.5) * 36, 7, 5, r() * 3, 0.22);
  gloss(c, -12, -14, 16, 8, -0.6, 0.4);
  c.restore();
};

const shrimp: Draw = (c, r) => {
  c.save();
  c.translate(58, 66);
  c.rotate((r() - 0.5) * 0.4);
  const P: [number, number][] = [
    [-44, 16],
    [-52, -36],
    [28, -42],
    [40, 0],
  ];
  const pt = (t: number): [number, number] => {
    const u = 1 - t;
    return [
      u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0],
      u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1],
    ];
  };
  const N = 56;
  const L: [number, number][] = [];
  const Rt: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [x, y] = pt(t);
    const [x2, y2] = pt(Math.min(1, t + 0.01));
    let nx = -(y2 - y);
    let ny = x2 - x;
    const len = Math.hypot(nx, ny) || 1;
    nx /= len;
    ny /= len;
    const w = 5 + 11 * Math.pow(Math.sin(Math.PI * t), 0.6);
    const bL = 2.2 * Math.abs(Math.sin(t * 26));
    const bR = 2.2 * Math.abs(Math.sin(t * 26 + 1.3));
    L.push([x + nx * (w + bL), y + ny * (w + bL)]);
    Rt.push([x - nx * (w + bR), y - ny * (w + bR)]);
  }
  const body = new Path2D();
  body.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < L.length; i++) body.lineTo(L[i][0], L[i][1]);
  for (let i = Rt.length - 1; i >= 0; i--) body.lineTo(Rt[i][0], Rt[i][1]);
  body.closePath();
  // tail first (sits under the batter)
  const [tx, ty] = pt(1);
  const [px, py] = pt(0.97);
  c.save();
  c.translate(tx, ty);
  c.rotate(Math.atan2(ty - py, tx - px));
  for (const a of [-0.55, 0.35]) {
    c.save();
    c.rotate(a);
    const fin = new Path2D();
    fin.moveTo(-2, -4);
    fin.lineTo(24, -9);
    fin.quadraticCurveTo(27, 0, 23, 7);
    fin.lineTo(-2, 4);
    fin.closePath();
    c.fillStyle = linear(c, 0, 0, 26, 0, [
      [0, '#f3a98f'],
      [0.5, '#e66a47'],
      [1, '#c84a2e'],
    ]);
    c.fill(fin);
    c.strokeStyle = 'rgba(255,230,215,.55)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(2, 0);
    c.lineTo(22, -3);
    c.moveTo(2, 1);
    c.lineTo(21, 4);
    c.stroke();
    c.restore();
  }
  c.fillStyle = '#f2a68c';
  c.beginPath();
  c.ellipse(-1, 0, 7, 5.5, 0, 0, TAU);
  c.fill();
  c.restore();
  // golden batter
  c.fillStyle = radial(c, -10, -20, 6, -4, -8, 60, [
    [0, '#f6cf7c'],
    [0.6, '#e2a84c'],
    [1, '#c3822f'],
  ]);
  c.fill(body);
  edge(c, body, 'rgba(160,100,35,.65)', 1.8);
  c.save();
  c.clip(body);
  // soft crisp bumps
  for (let i = 0; i < 9; i++) {
    const [x, y] = pt(0.08 + r() * 0.84);
    gloss(c, x + (r() - 0.5) * 14, y + (r() - 0.5) * 14, 6, 4.5, r() * 3, 0.3);
  }
  c.restore();
  gloss(c, -16, -18, 24, 8, -0.2, 0.3);
  c.restore();
};

const naruto: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const p = new Path2D();
  const n = 16;
  for (let i = 0; i <= n * 8; i++) {
    const a = (i / (n * 8)) * TAU;
    const rr = 40.5 + 3.2 * Math.cos(a * n);
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  c.fillStyle = radial(c, -8, -10, 4, 0, 0, 44, [
    [0, '#ffffff'],
    [0.7, '#faf5ec'],
    [1, '#e8ddce'],
  ]);
  c.fill(p);
  edge(c, p, 'rgba(205,190,170,.8)', 1.6);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  spiralPath(c, 1, 2.1, 2.5);
  c.strokeStyle = '#ef9db5';
  c.lineWidth = 6.5;
  c.stroke();
  spiralPath(c, 1, 2.1, 2.5, 1, 1, -0.7, -0.7);
  c.strokeStyle = 'rgba(250,200,215,.7)';
  c.lineWidth = 2.4;
  c.stroke();
  c.fillStyle = '#ef9db5';
  c.beginPath();
  c.arc(0, 0, 4, 0, TAU);
  c.fill();
  gloss(c, -14, -16, 18, 8, -0.6, 0.35);
  c.restore();
};

const bamboo: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.4);
  for (let i = 0; i < 4; i++) {
    c.save();
    c.translate(-27 + i * 18, (r() - 0.5) * 6);
    c.rotate((r() - 0.5) * 0.22);
    const p = new Path2D();
    p.roundRect(-8, -42, 16, 84, 6);
    c.fillStyle = linear(c, -8, 0, 8, 0, [
      [0, '#b7873f'],
      [0.45, '#e2bb6f'],
      [1, '#c79a4c'],
    ]);
    c.fill(p);
    edge(c, p, 'rgba(140,95,35,.7)', 1.4);
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,238,195,.5)';
    c.lineWidth = 1.3;
    for (const x of [-3, 1]) {
      c.beginPath();
      c.moveTo(x, -34);
      c.quadraticCurveTo(x + 1, 0, x, 34);
      c.stroke();
    }
    c.strokeStyle = 'rgba(140,95,35,.35)';
    c.beginPath();
    c.moveTo(4.5, -32);
    c.quadraticCurveTo(3.5, 0, 4.5, 32);
    c.stroke();
    gloss(c, -2, -22, 5, 16, 0, 0.28);
    c.restore();
  }
  c.restore();
};

const sesame: Draw = (c, r) => {
  for (let i = 0; i < 24; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r()) * 42;
    const black = r() < 0.2;
    c.save();
    c.translate(64 + Math.cos(a) * d, 64 + Math.sin(a) * d);
    c.rotate(r() * TAU);
    c.scale(1.6, 1.6);
    const p = new Path2D();
    p.moveTo(-5.5, 0);
    p.quadraticCurveTo(-2, -3.4, 3, -3);
    p.quadraticCurveTo(6, -1.5, 6, 0);
    p.quadraticCurveTo(6, 1.5, 3, 3);
    p.quadraticCurveTo(-2, 3.4, -5.5, 0);
    p.closePath();
    c.fillStyle = linear(
      c,
      -4,
      -3,
      4,
      3,
      black
        ? [
            [0, '#4e4440'],
            [1, '#1d1816'],
          ]
        : [
            [0, '#fff9ea'],
            [0.6, '#f1e3c4'],
            [1, '#d3bb8e'],
          ]
    );
    c.fill(p);
    c.strokeStyle = black ? 'rgba(90,80,75,.6)' : 'rgba(170,140,95,.45)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(-4.5, 0);
    c.lineTo(5, 0);
    c.stroke();
    c.restore();
  }
};

const pakchoi: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.6);
  const leaf = new Path2D();
  leaf.moveTo(0, 52);
  leaf.bezierCurveTo(-42, 34, -46, -30, -4, -56);
  leaf.bezierCurveTo(42, -34, 44, 30, 0, 52);
  c.fillStyle = radial(c, -10, -24, 4, 0, -8, 62, [
    [0, '#7ab85d'],
    [0.6, '#4f8f44'],
    [1, '#2e6330'],
  ]);
  c.fill(leaf);
  edge(c, leaf, 'rgba(38,85,40,.6)', 1.6);
  // soft veins
  c.strokeStyle = 'rgba(200,232,170,.45)';
  c.lineWidth = 1.4;
  c.lineCap = 'round';
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    c.beginPath();
    c.moveTo(0, -4 + Math.abs(i) * 10);
    c.quadraticCurveTo(i * 9, Math.abs(i) * 6 - 8, i * 13, Math.abs(i) * 5 - 24);
    c.stroke();
  }
  const stem = new Path2D();
  stem.moveTo(-12, 58);
  stem.bezierCurveTo(-19, 20, -12, -12, 0, -30);
  stem.bezierCurveTo(12, -12, 19, 20, 12, 58);
  stem.closePath();
  c.fillStyle = linear(c, -14, 0, 14, 0, [
    [0, '#cde2b2'],
    [0.5, '#f3f9e6'],
    [1, '#c4dba8'],
  ]);
  c.fill(stem);
  edge(c, stem, 'rgba(150,185,120,.6)', 1.2);
  c.strokeStyle = 'rgba(160,195,130,.45)';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-3, 54);
  c.quadraticCurveTo(-6, 10, 0, -22);
  c.moveTo(4, 54);
  c.quadraticCurveTo(7, 12, 2, -18);
  c.stroke();
  gloss(c, -16, -20, 18, 8, -1, 0.3);
  c.restore();
};

const sprouts: Draw = (c, r) => {
  c.lineCap = 'round';
  const base = r() * TAU;
  for (let i = 0; i < 8; i++) {
    // a loose, roughly parallel handful that crosses a little
    const a = base + (r() - 0.5) * 0.9;
    const off = (i - 3.5) * 9 + (r() - 0.5) * 6;
    const along = (r() - 0.5) * 18;
    const len = 62 + r() * 16;
    const cxp = 64 + Math.cos(a + Math.PI / 2) * off + Math.cos(a) * along;
    const cyp = 64 + Math.sin(a + Math.PI / 2) * off + Math.sin(a) * along;
    const dir = r() < 0.5 ? 1 : -1;
    const x0 = cxp - (Math.cos(a) * len * dir) / 2;
    const y0 = cyp - (Math.sin(a) * len * dir) / 2;
    const x1 = cxp + (Math.cos(a) * len * dir) / 2;
    const y1 = cyp + (Math.sin(a) * len * dir) / 2;
    const bow = (r() - 0.5) * 20;
    const mx = cxp + Math.cos(a + Math.PI / 2) * bow;
    const my = cyp + Math.sin(a + Math.PI / 2) * bow;
    const stroke = (col: string, w: number, ox = 0, oy = 0) => {
      c.strokeStyle = col;
      c.lineWidth = w;
      c.beginPath();
      c.moveTo(x0 + ox, y0 + oy);
      c.quadraticCurveTo(mx + ox, my + oy, x1 + ox, y1 + oy);
      c.stroke();
    };
    stroke(ink(0.18), 5.5, 0.8, 1.4);
    stroke('#d9cfb4', 5);
    stroke('#f4eedc', 3.6);
    stroke(hi(0.85), 1.2, -0.6, -0.8);
    // bean head
    c.save();
    c.translate(x1, y1);
    c.rotate(a);
    c.fillStyle = radial(c, -1.5, -1.5, 0.5, 0, 0, 6, [
      [0, '#f6e49a'],
      [0.6, '#e2c86a'],
      [1, '#b9983c'],
    ]);
    c.beginPath();
    c.ellipse(1, 0, 6, 4.2, 0, 0, TAU);
    c.fill();
    c.fillStyle = hi(0.8);
    c.beginPath();
    c.ellipse(-1, -1.3, 2, 1.1, -0.3, 0, TAU);
    c.fill();
    c.restore();
  }
};

const chili: Draw = (c, r) => {
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU + 0.4;
    const x = 64 + Math.cos(a) * (i === 0 ? 0 : 26);
    const y = 64 + Math.sin(a) * (i === 0 ? 0 : 26);
    const R = 11 + r() * 3;
    const wall = 3.4;
    c.save();
    c.translate(x, y);
    c.rotate(r() * Math.PI);
    c.scale(1, 0.8 + r() * 0.15);
    // translucent inner flesh
    c.fillStyle = 'rgba(248,222,196,.55)';
    c.beginPath();
    c.arc(0, 0, R - wall + 0.5, 0, TAU);
    c.fill();
    const ring = new Path2D();
    ring.arc(0, 0, R, 0, TAU);
    ring.arc(0, 0, R - wall, 0, TAU, true);
    c.fillStyle = radial(c, -R * 0.3, -R * 0.4, 1, 0, 0, R, [
      [0, '#f26a4a'],
      [0.6, '#d8402a'],
      [1, '#a8261a'],
    ]);
    c.fill(ring, 'evenodd');
    c.strokeStyle = 'rgba(130,28,18,.7)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(0, 0, R - 0.6, 0, TAU);
    c.stroke();
    c.strokeStyle = 'rgba(255,215,190,.7)';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(0, 0, R - wall + 0.5, 0, TAU);
    c.stroke();
    // seeds
    c.fillStyle = '#f3dc9e';
    for (let k = 0; k < 3; k++) {
      const sa = r() * TAU;
      c.beginPath();
      c.ellipse(Math.cos(sa) * 3.5, Math.sin(sa) * 3.5, 2, 1.3, sa, 0, TAU);
      c.fill();
    }
    c.strokeStyle = hi(0.8);
    c.lineWidth = 1.8;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(0, 0, R - wall * 0.5, Math.PI * 1.1, Math.PI * 1.4);
    c.stroke();
    c.restore();
  }
};

const kimchi: Draw = (c, r) => {
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * TAU + 0.5;
    const x = 64 + Math.cos(a) * 16;
    const y = 64 + Math.sin(a) * 16;
    const rad = 22 + r() * 8;
    const p = blob(r, x, y, rad, 0.4, 9);
    // pale cabbage under the paste
    c.fillStyle = '#f1d6b4';
    c.fill(p);
    c.fillStyle = radial(c, x - 8, y - 8, 2, x, y, rad + 4, [
      [0, 'rgba(240,128,84,.95)'],
      [0.55, 'rgba(212,78,42,.95)'],
      [1, 'rgba(165,56,28,.95)'],
    ]);
    c.fill(p);
    edge(c, p, 'rgba(130,40,20,.5)', 1.4);
    c.save();
    c.clip(p);
    // white rib of the leaf
    c.strokeStyle = 'rgba(250,226,195,.75)';
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - rad, y + 4);
    c.quadraticCurveTo(x, y - 8, x + rad, y + 2);
    c.stroke();
    c.strokeStyle = 'rgba(250,226,195,.4)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x - rad, y + 12);
    c.quadraticCurveTo(x - 4, y + 2, x + rad, y + 10);
    c.stroke();
    c.restore();
    c.fillStyle = '#7e1a0a';
    for (let k = 0; k < 5; k++) {
      c.beginPath();
      c.roundRect(x + (r() - 0.5) * 28, y + (r() - 0.5) * 22, 2.4, 1.8, 0.8);
      c.fill();
    }
    gloss(c, x - 7, y - 8, 11, 5, -0.6, 0.5);
  }
};

const lime: Draw = (c, r) => {
  c.save();
  c.translate(64, 74);
  c.rotate((r() - 0.5) * 0.8);
  const rind = new Path2D();
  rind.arc(0, 0, 45, Math.PI, TAU);
  rind.closePath();
  c.fillStyle = radial(c, -10, -30, 4, 0, 0, 46, [
    [0, '#8cc24c'],
    [0.75, '#68a238'],
    [1, '#477f27'],
  ]);
  c.fill(rind);
  edge(c, rind, 'rgba(60,110,30,.7)', 1.4);
  const pith = new Path2D();
  pith.arc(0, 0, 41, Math.PI, TAU);
  pith.closePath();
  c.fillStyle = '#f1f6dc';
  c.fill(pith);
  const pulp = new Path2D();
  pulp.arc(0, -1, 37.5, Math.PI, TAU);
  pulp.closePath();
  c.fillStyle = radial(c, 0, -8, 2, 0, -4, 40, [
    [0, '#eef8bf'],
    [0.7, '#cfe88a'],
    [1, '#b5d868'],
  ]);
  c.fill(pulp);
  edge(c, pulp, 'rgba(150,190,80,.5)', 1);
  c.lineCap = 'round';
  for (let i = 1; i < 6; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    c.strokeStyle = 'rgba(255,255,240,.95)';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(0, -1);
    c.lineTo(Math.cos(a) * 37, Math.sin(a) * 37 - 1);
    c.stroke();
  }
  gloss(c, -14, -20, 16, 8, -0.4, 0.4);
  c.restore();
};

const shallot: Draw = (c, r) => {
  c.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const a0 = r() * TAU;
    const d = Math.sqrt(r()) * 40;
    c.save();
    c.translate(64 + Math.cos(a0) * d, 64 + Math.sin(a0) * d);
    c.rotate(r() * TAU);
    const R = 6 + r() * 4;
    const span = Math.PI * (0.8 + r() * 0.7);
    const dark = r() < 0.5;
    c.strokeStyle = ink(0.2);
    c.lineWidth = 3.8;
    c.beginPath();
    c.arc(0.8, 1.2, R, 0, span);
    c.stroke();
    c.strokeStyle = dark ? '#a86b2c' : '#cf923f';
    c.lineWidth = 3.4;
    c.beginPath();
    c.arc(0, 0, R, 0, span);
    c.stroke();
    c.strokeStyle = 'rgba(255,224,160,.65)';
    c.lineWidth = 1.1;
    c.beginPath();
    c.arc(-0.5, -0.6, R, 0.1, span * 0.7);
    c.stroke();
    c.restore();
  }
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
  c.shadowColor = ink(0.38);
  c.shadowBlur = 4;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 2.2;
  c.drawImage(img, -size / 2, -size / 2, size, size);
  c.restore();
}

// ---------- noodles ----------
const NOODLE_COL: Record<string, string> = {
  ramen: '#f0d283',
  udon: '#f6eddb',
  soba: '#a2845f',
  pirinc: '#f8f3ea',
};
const NOODLE_WMUL: Record<string, number> = { ramen: 1, udon: 1.3, soba: 0.9, pirinc: 0.85 };

interface StrandStyle {
  col: string;
  w: number;
  shadowA: number;
  hiA: number;
  alpha: number;
}

/** draws one strand with shadow / dark base / lit base / satin highlight */
function strokeStrand(c: Ctx, pts: [number, number][], st: StrandStyle) {
  const path = (ox = 0, oy = 0) => {
    c.beginPath();
    c.moveTo(pts[0][0] + ox, pts[0][1] + oy);
    for (let k = 1; k < pts.length - 1; k++) {
      const mx = (pts[k][0] + pts[k + 1][0]) / 2;
      const my = (pts[k][1] + pts[k + 1][1]) / 2;
      c.quadraticCurveTo(pts[k][0] + ox, pts[k][1] + oy, mx + ox, my + oy);
    }
    const l = pts[pts.length - 1];
    c.lineTo(l[0] + ox, l[1] + oy);
  };
  const w = st.w;
  c.globalAlpha = st.alpha;
  path(0.8, 1.5);
  c.strokeStyle = ink(st.shadowA);
  c.lineWidth = w + 1.4;
  c.stroke();
  path();
  c.strokeStyle = tint(st.col, -0.2);
  c.lineWidth = w;
  c.stroke();
  path(-w * 0.08, -w * 0.1);
  c.strokeStyle = st.col;
  c.lineWidth = w * 0.72;
  c.stroke();
  path(-w * 0.2, -w * 0.24);
  c.strokeStyle = hi(st.hiA);
  c.lineWidth = Math.max(0.7, w * 0.26);
  c.stroke();
  c.globalAlpha = 1;
}

function strandStyle(noodle: string, thick: Thick, cook: string, sauce?: string): StrandStyle {
  let col = NOODLE_COL[noodle] ?? NOODLE_COL.ramen;
  if (sauce) col = mixHex(col, INGREDIENTS[sauce].color, 0.4);
  let w = THICK_W[thick] * (NOODLE_WMUL[noodle] ?? 1);
  let shadowA = 0.22;
  let hiA = noodle === 'soba' ? 0.4 : 0.6;
  if (cook === 'raw') {
    col = mixHex(col, '#fff6e8', 0.3);
    hiA *= 0.45;
    shadowA = 0.16;
  }
  if (cook === 'soft') {
    w *= 1.12;
    hiA = Math.min(0.85, hiA + 0.15);
  }
  if (cook === 'burnt') {
    col = mixHex(col, '#b39b78', 0.55);
    w *= 1.3;
    hiA = 0.18;
    shadowA = 0.12;
  }
  return { col, w, shadowA, hiA, alpha: noodle === 'pirinc' ? 0.9 : 1 };
}

const nests = new Map<string, HTMLCanvasElement>();
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
  const R = 2; // render at 2x of the 300 space
  cv = mk(300 * R, 300 * R);
  const c = cv.getContext('2d')!;
  c.scale(R, R);
  const r = rng(hash(noodle + thick + (dry ? 'd' : 's')));
  const st = strandStyle(noodle, thick, cook, sauce);
  const radius = dry ? 108 : 88;
  const count = Math.round((dry ? 1.3 : 1) * (thick === 'ince' ? 120 : thick === 'orta' ? 82 : 48));
  const wave = cook === 'raw' ? 0.35 : 1;
  const strands: [number, number][][] = [];
  for (let i = 0; i < count; i++) {
    const pts: [number, number][] = [];
    if (r() < 0.3) {
      // a strand laid across the nest with a gentle wave
      const a = r() * TAU;
      const off = (r() - 0.5) * radius * 1.2;
      const len = Math.sqrt(Math.max(0, radius * radius - off * off)) * 2;
      const n = Math.max(4, Math.round(len / 10));
      const ph = r() * TAU;
      const amp = (3 + r() * 5) * wave;
      for (let k = 0; k <= n; k++) {
        const t = k / n - 0.5;
        const u = t * len;
        const v = off + Math.sin(k * 0.9 + ph) * amp;
        pts.push([
          150 + Math.cos(a) * u - Math.sin(a) * v,
          150 + Math.sin(a) * u + Math.cos(a) * v,
        ]);
      }
    } else {
      // a strand following the swirl of the nest
      let rad = radius * (0.2 + 0.8 * Math.sqrt(r()));
      let ang = r() * TAU;
      const dir = r() < 0.5 ? 1 : -1;
      const segs = 10 + Math.floor(r() * 10);
      const ph = r() * TAU;
      const amp = (2 + r() * 4) * wave;
      for (let k = 0; k <= segs; k++) {
        pts.push([150 + Math.cos(ang) * rad, 150 + Math.sin(ang) * rad]);
        ang += (dir * 11) / Math.max(28, rad);
        rad += (r() - 0.5) * 3 + Math.sin(k * 1.1 + ph) * amp * 0.6;
        rad = Math.max(10, Math.min(radius, rad));
      }
    }
    strands.push(pts);
  }
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (const s of strands) strokeStrand(c, s, st);
  if (cook === 'burnt') {
    // strands melt together: flatten the contrast
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = 'rgba(176,154,118,.28)';
    c.fillRect(0, 0, 300, 300);
    c.globalCompositeOperation = 'source-over';
  }
  if (cook === 'soft') {
    c.globalCompositeOperation = 'source-atop';
    gloss(c, 130, 125, 70, 40, -0.5, 0.16);
    c.globalCompositeOperation = 'source-over';
  }
  nests.set(key, cv);
  return cv;
}

/** a neat folded bundle of noodles (for trays) in a w×h box centred at 0,0 */
function bundle(c: Ctx, noodle: string, thick: Thick, w: number, h: number, seed: number) {
  const r = rng(seed);
  const st = { ...strandStyle(noodle, thick, 'perfect'), shadowA: 0.1 };
  const box = new Path2D();
  box.roundRect(-w / 2, -h / 2, w, h, h * 0.45);
  c.save();
  c.clip(box);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const gap = st.w * 0.95;
  const n = Math.ceil(h / gap) + 2;
  for (let i = 0; i < n; i++) {
    const y0 = -h / 2 + i * gap + (r() - 0.5) * gap * 0.4;
    const ph = r() * TAU;
    const amp = 1.5 + r() * 1.5;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 12; k++) {
      const x = -w / 2 - 6 + (k / 12) * (w + 12);
      pts.push([x, y0 + Math.sin(k * 0.8 + ph) * amp]);
    }
    strokeStrand(c, pts, st);
  }
  c.restore();
  // rounded ends read as folded strands
  c.strokeStyle = ink(0.12);
  c.lineWidth = 1.5;
  c.stroke(box);
}

// ---------- bowl ----------
export const BOWL_R = 122;

function drawRimPattern(c: Ctx, st: BowlStyle) {
  if (st.pattern === 'none') return;
  const cx = 150;
  const cy = 150;
  c.save();
  const band = new Path2D();
  band.arc(cx, cy, 146, 0, TAU);
  band.arc(cx, cy, 133, 0, TAU, true);
  c.clip(band, 'evenodd');
  const r = rng(hash(st.id));
  c.strokeStyle = st.patternColor;
  c.fillStyle = st.patternColor;
  c.lineCap = 'round';
  if (st.pattern === 'wave') {
    // seigaiha: overlapping scallops around the ring
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU;
      const x = cx + Math.cos(a) * 139;
      const y = cy + Math.sin(a) * 139;
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.arc(x, y, 9 - k * 2.6, a + Math.PI * 0.5, a + Math.PI * 1.5);
        c.lineWidth = 1.3;
        c.globalAlpha = 0.85 - k * 0.15;
        c.stroke();
      }
    }
    c.globalAlpha = 1;
    c.beginPath();
    c.arc(cx, cy, 145, 0, TAU);
    c.lineWidth = 2.4;
    c.stroke();
  } else if (st.pattern === 'gold') {
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(cx, cy, 141, 0, TAU);
    c.stroke();
    c.lineWidth = 1;
    c.beginPath();
    c.arc(cx, cy, 136, 0, TAU);
    c.stroke();
    // a few gold leaf flecks, deliberate rather than noisy
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU + r() * 0.2;
      const d = 135 + r() * 9;
      c.globalAlpha = 0.5 + r() * 0.4;
      c.beginPath();
      c.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.6 + r(), 1, a, 0, TAU);
      c.fill();
    }
  } else if (st.pattern === 'sakura') {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU + 0.2;
      const x = cx + Math.cos(a) * 139.5;
      const y = cy + Math.sin(a) * 139.5;
      for (let p = 0; p < 5; p++) {
        const pa = (p / 5) * TAU + a;
        c.globalAlpha = 0.9;
        c.beginPath();
        c.ellipse(x + Math.cos(pa) * 3.2, y + Math.sin(pa) * 3.2, 2.6, 1.7, pa, 0, TAU);
        c.fill();
      }
      c.fillStyle = '#fff6c2';
      c.beginPath();
      c.arc(x, y, 1.3, 0, TAU);
      c.fill();
      c.globalAlpha = 0.55;
      c.fillStyle = '#7fb069';
      c.beginPath();
      c.ellipse(x + Math.cos(a + 1.3) * 6, y + Math.sin(a + 1.3) * 6, 3, 1.3, a + 1.3, 0, TAU);
      c.fill();
      c.fillStyle = st.patternColor;
    }
  } else if (st.pattern === 'tenmoku') {
    // hare's-fur: soft, evenly spaced streaks radiating outward
    c.lineWidth = 1.2;
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU + (r() - 0.5) * 0.04;
      const d0 = 133 + r() * 3;
      const d1 = d0 + 6 + r() * 7;
      c.globalAlpha = 0.25 + r() * 0.35;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0);
      c.lineTo(cx + Math.cos(a) * d1, cy + Math.sin(a) * d1);
      c.stroke();
    }
  } else if (st.pattern === 'crackle') {
    c.lineWidth = 0.8;
    c.globalAlpha = 0.45;
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU + r() * 0.1;
      let x = cx + Math.cos(a) * (134 + r() * 11);
      let y = cy + Math.sin(a) * (134 + r() * 11);
      c.beginPath();
      c.moveTo(x, y);
      let dir = r() * TAU;
      for (let k = 0; k < 3; k++) {
        dir += (r() - 0.5) * 2.2;
        x += Math.cos(dir) * (4 + r() * 5);
        y += Math.sin(dir) * (4 + r() * 5);
        c.lineTo(x, y);
      }
      c.stroke();
    }
  } else if (st.pattern === 'stripes') {
    c.lineWidth = 2.6;
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * TAU;
      c.globalAlpha = i % 2 ? 0.95 : 0.55;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * 133, cy + Math.sin(a) * 133);
      c.lineTo(cx + Math.cos(a) * 146, cy + Math.sin(a) * 146);
      c.stroke();
    }
  } else if (st.pattern === 'dots') {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU;
      c.globalAlpha = 0.9;
      c.beginPath();
      c.arc(cx + Math.cos(a) * 139.5, cy + Math.sin(a) * 139.5, 3, 0, TAU);
      c.fill();
    }
  }
  c.restore();
}

/** a few large, soft fat rings floating on broth */
function fatRings(c: Ctx, r: () => number, cx: number, cy: number, rad: number, spicy: boolean) {
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r() * 0.5;
    const d = rad * (0.25 + r() * 0.6);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rr = 5 + r() * 9;
    const col = spicy ? '255,130,70' : '255,226,160';
    c.fillStyle = radial(c, x, y, rr * 0.5, x, y, rr, [
      [0, `rgba(${col},0)`],
      [0.72, `rgba(${col},.4)`],
      [1, `rgba(${col},0)`],
    ]);
    c.beginPath();
    c.arc(x, y, rr, 0, TAU);
    c.fill();
    c.fillStyle = hi(0.5);
    c.beginPath();
    c.ellipse(x - rr * 0.45, y - rr * 0.45, rr * 0.22, rr * 0.14, -0.6, 0, TAU);
    c.fill();
  }
}

export function drawBowl(c: Ctx, b: BowlDraw) {
  const cx = 150;
  const cy = 150;
  c.clearRect(0, 0, 300, 300);
  const st: BowlStyle = BOWLS[b.style ?? DEFAULT_BOWL] ?? BOWLS[DEFAULT_BOWL];
  // drop shadow
  c.save();
  c.shadowColor = ink(0.38);
  c.shadowBlur = 18;
  c.shadowOffsetY = 8;
  c.beginPath();
  c.arc(cx, cy, 146, 0, TAU);
  c.fillStyle = b.takeaway ? '#cdb48a' : st.glaze[2];
  c.fill();
  c.restore();
  // rim (outer glaze)
  const rim = new Path2D();
  rim.arc(cx, cy, 146, 0, TAU);
  c.fillStyle = radial(
    c,
    cx - 50,
    cy - 60,
    20,
    cx,
    cy,
    150,
    b.takeaway
      ? [
          [0, '#eedfc4'],
          [0.7, '#d6bf98'],
          [1, '#b8996a'],
        ]
      : [
          [0, st.glaze[0]],
          [0.68, st.glaze[1]],
          [1, st.glaze[2]],
        ]
  );
  c.fill(rim);
  if (!b.takeaway) drawRimPattern(c, st);
  // glaze highlight on the rim
  gloss(c, cx - 92, cy - 100, 26, 7, -0.78, 0.4);
  // lip ring
  c.beginPath();
  c.arc(cx, cy, 131, 0, TAU);
  c.lineWidth = 5;
  c.strokeStyle = b.takeaway ? '#f6ecd8' : st.lip;
  c.stroke();
  // interior with soft light fall-off
  const inner = new Path2D();
  inner.arc(cx, cy, 128, 0, TAU);
  const ic = b.takeaway ? BOWLS[DEFAULT_BOWL].inner : st.inner;
  c.fillStyle = radial(c, cx + 8, cy + 12, 10, cx, cy, 130, [
    [0, ic[0]],
    [0.7, ic[1]],
    [0.92, ic[2]],
    [1, ic[3]],
  ]);
  c.fill(inner);
  // wall depth: inner shadow near the lip
  c.fillStyle = radial(c, cx, cy, 104, cx, cy, 128, [
    [0, ink(0)],
    [1, ink(0.22)],
  ]);
  c.fill(inner);
  // one elegant highlight on the upper-left wall
  c.save();
  c.clip(inner);
  c.strokeStyle = hi(0.55);
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.shadowColor = hi(0.7);
  c.shadowBlur = 8;
  c.beginPath();
  c.arc(cx, cy, 118, Math.PI * 1.12, Math.PI * 1.42);
  c.stroke();
  c.restore();

  const liq = b.liquid ? INGREDIENTS[b.liquid] : null;
  const isSauce = liq?.cat === 'sauce';
  const f = Math.min(1, b.fill);
  c.save();
  c.clip(inner);

  if (liq && !isSauce && f > 0) {
    // broth pool
    const rad = 64 + 66 * f;
    const op = b.liquid === 'shoyu' || b.liquid === 'tavuk' ? 0.9 : 0.97;
    c.fillStyle = radial(c, cx - 28, cy - 32, 8, cx, cy, rad, [
      [0, tint(liq.color, 0.24, op)],
      [0.55, tint(liq.color, 0, op)],
      [0.92, tint(liq.color, -0.14, op)],
      [1, tint(liq.color, -0.3, op)],
    ]);
    c.beginPath();
    c.arc(cx, cy, rad, 0, TAU);
    c.fill();
    c.strokeStyle = tint(liq.color, -0.32, 0.55);
    c.lineWidth = 2;
    c.stroke();
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
  if (liq && !isSauce && f > 0) {
    // submerge noodle edges, vignette toward the rim, fat rings, sheen
    const rad = 64 + 66 * f;
    c.fillStyle = radial(c, cx, cy, rad * 0.5, cx, cy, rad, [
      [0, tint(liq.color, 0, 0)],
      [0.62, tint(liq.color, 0.05, 0.22 * f)],
      [0.8, tint(liq.color, 0, 0.55 * f)],
      [1, tint(liq.color, -0.18, 0.85 * f)],
    ]);
    c.beginPath();
    c.arc(cx, cy, rad, 0, TAU);
    c.fill();
    fatRings(c, rng(hash(b.liquid!)), cx, cy, rad, b.liquid === 'acili');
    gloss(c, cx - 42, cy - 50, 54, 18, -0.6, 0.2);
  }
  if (liq && isSauce && f > 0) {
    // glossy satin drizzle over the noodles
    const r = rng(hash(b.liquid! + 'z'));
    c.lineCap = 'round';
    c.lineJoin = 'round';
    // long smooth zigzag ribbons, the way sauce is drizzled from a spoon
    const ribbons = Math.round(2 + f * 2);
    for (let i = 0; i < ribbons; i++) {
      const a = (i / ribbons) * Math.PI + r() * 0.5;
      const pts: [number, number][] = [];
      const n = 7 + Math.floor(r() * 3);
      const amp = 22 + r() * 14;
      const len = 170;
      for (let k = 0; k <= n; k++) {
        const u = (k / n - 0.5) * len;
        const v = (k % 2 ? 1 : -1) * amp * (0.6 + r() * 0.4);
        pts.push([cx + Math.cos(a) * u - Math.sin(a) * v, cy + Math.sin(a) * u + Math.cos(a) * v]);
      }
      const path = (ox = 0, oy = 0) => {
        c.beginPath();
        c.moveTo(pts[0][0] + ox, pts[0][1] + oy);
        for (let k = 1; k < pts.length - 1; k++)
          c.quadraticCurveTo(
            pts[k][0] + ox,
            pts[k][1] + oy,
            (pts[k][0] + pts[k + 1][0]) / 2 + ox,
            (pts[k][1] + pts[k + 1][1]) / 2 + oy
          );
      };
      const w = 7 + r() * 3;
      path();
      c.strokeStyle = tint(liq.color, 0, 0.38);
      c.lineWidth = w;
      c.stroke();
      path(-0.8, -1.2);
      c.strokeStyle = tint(liq.color, 0.35, 0.3);
      c.lineWidth = w * 0.45;
      c.stroke();
      path(-1.3, -1.9);
      c.strokeStyle = hi(0.4);
      c.lineWidth = 1.4;
      c.stroke();
    }
    gloss(c, cx - 36, cy - 40, 50, 18, -0.6, 0.16);
    // soft pools of sauce caught between strands
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + r() * 0.8;
      const d = 40 + r() * 60;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      const rr = 12 + r() * 10;
      c.fillStyle = radial(c, x, y, 0, x, y, rr, [
        [0, tint(liq.color, 0, 0.5 * f)],
        [1, tint(liq.color, 0, 0)],
      ]);
      c.beginPath();
      c.ellipse(x, y, rr, rr * 0.7, a, 0, TAU);
      c.fill();
    }
    if (b.liquid === 'tatliaci') {
      c.fillStyle = '#8e1e12';
      for (let i = 0; i < 24; i++) {
        c.beginPath();
        c.roundRect(cx - 90 + r() * 180, cy - 90 + r() * 180, 2.4, 1.8, 0.8);
        c.fill();
      }
    }
  }
  c.restore();
  // overflow spill
  if (liq && b.fill > 1.03) {
    c.save();
    c.globalAlpha = Math.min(0.7, (b.fill - 1) * 3);
    c.fillStyle = tint(liq.color, -0.1, 0.8);
    const r = rng(9);
    for (let i = 0; i < 6; i++) {
      const a = r() * TAU;
      c.beginPath();
      c.ellipse(
        cx + Math.cos(a) * 140,
        cy + Math.sin(a) * 140,
        16 + r() * 10,
        8,
        a + Math.PI / 2,
        0,
        TAU
      );
      c.fill();
    }
    c.restore();
  }
  for (const p of b.pieces) drawPiece(c, p);
}

// ---------- trays (ingredient bins) ----------
const TRAY_W = 240;
const TRAY_H = 170;
const TRAY_SS = 2;
/** ids whose sprite is already a scattered pile */
const PILE = new Set(['misir', 'susam', 'citir', 'yesil', 'biber', 'filiz']);

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
  if (ing.cat === 'broth' || ing.cat === 'sauce') {
    // stock pot (broth) or ceramic ramekin (sauce), seen from above
    const big = ing.cat === 'broth';
    const R = big ? 74 : 60;
    const mx = W / 2;
    const my = H / 2;
    c.save();
    c.shadowColor = ink(0.4);
    c.shadowBlur = 12;
    c.shadowOffsetY = 6;
    c.beginPath();
    c.arc(mx, my, R, 0, TAU);
    c.fillStyle = big ? '#8d969f' : '#e6dcc8';
    c.fill();
    c.restore();
    c.beginPath();
    c.arc(mx, my, R, 0, TAU);
    c.fillStyle = linear(
      c,
      0,
      my - R,
      0,
      my + R,
      big
        ? [
            [0, '#dde2e8'],
            [0.5, '#b4bcc5'],
            [1, '#848d97'],
          ]
        : [
            [0, '#fbf5ea'],
            [0.6, '#e9dfcb'],
            [1, '#c9bba0'],
          ]
    );
    c.fill();
    // inner wall shadow
    const wall = R - 8;
    c.beginPath();
    c.arc(mx, my, wall, 0, TAU);
    c.fillStyle = radial(c, mx, my - 4, wall - 10, mx, my, wall, [
      [0, tint(ing.color, -0.25)],
      [1, tint(ing.color, -0.45)],
    ]);
    c.fill();
    // liquid surface
    const lr = wall - 2;
    c.beginPath();
    c.arc(mx, my + 1, lr, 0, TAU);
    c.fillStyle = radial(c, mx - 20, my - 20, 4, mx, my, lr, [
      [0, tint(ing.color, 0.26)],
      [0.6, ing.color],
      [1, tint(ing.color, -0.3)],
    ]);
    c.fill();
    if (big) fatRings(c, r, mx, my, lr, id === 'acili');
    gloss(c, mx - 22, my - 24, 28, 11, -0.6, 0.4);
    // ladle / spoon
    c.save();
    c.translate(mx + 16, my + 8);
    c.rotate(-0.7);
    c.shadowColor = ink(0.3);
    c.shadowBlur = 4;
    c.shadowOffsetY = 2;
    c.fillStyle = big ? '#b9c0c8' : '#d8ccb4';
    c.beginPath();
    c.roundRect(-4, 8, 8, big ? 78 : 60, 4);
    c.fill();
    c.beginPath();
    c.ellipse(0, 0, big ? 20 : 14, big ? 16 : 11, 0, 0, TAU);
    c.fillStyle = linear(c, -20, -16, 20, 16, [
      [0, big ? '#e6eaee' : '#f4ecdc'],
      [1, big ? '#9aa3ad' : '#c6b89c'],
    ]);
    c.fill();
    c.shadowColor = 'transparent';
    c.fillStyle = tint(ing.color, -0.05);
    c.beginPath();
    c.ellipse(0, 1, big ? 15 : 10, big ? 11 : 7, 0, 0, TAU);
    c.fill();
    gloss(c, -5, -3, big ? 7 : 5, big ? 3 : 2, -0.4, 0.6);
    c.restore();
    // crisp crescent highlight on the pot rim
    c.strokeStyle = hi(0.75);
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(mx, my, R - 3, Math.PI * 1.1, Math.PI * 1.45);
    c.stroke();
    trays.set(key, cv);
    return cv;
  }
  // matte stainless hotel pan
  const pan = new Path2D();
  pan.roundRect(8, 8, W - 16, H - 16, 16);
  c.save();
  c.shadowColor = ink(0.45);
  c.shadowBlur = 10;
  c.shadowOffsetY = 5;
  c.fillStyle = '#9aa3ad';
  c.fill(pan);
  c.restore();
  c.fillStyle = linear(c, 0, 8, 0, H - 8, [
    [0, '#dde2e7'],
    [0.5, '#b9c1c9'],
    [1, '#98a1aa'],
  ]);
  c.fill(pan);
  // thin lighter lip
  c.strokeStyle = hi(0.7);
  c.lineWidth = 1.5;
  c.stroke(pan);
  const well = new Path2D();
  well.roundRect(18, 18, W - 36, H - 36, 11);
  c.fillStyle = linear(c, 0, 18, 0, H - 18, [
    [0, '#6f7883'],
    [0.3, '#99a2ac'],
    [1, '#b7bfc8'],
  ]);
  c.fill(well);
  c.save();
  c.clip(well);
  if (ing.cat === 'noodle') {
    // tidy bundles laid side by side
    for (let i = 0; i < 3; i++) {
      c.save();
      c.translate(56 + i * 64, 86 + (i % 2) * 6);
      c.rotate(-0.28 + (r() - 0.5) * 0.12);
      c.shadowColor = ink(0.35);
      c.shadowBlur = 6;
      c.shadowOffsetY = 3;
      bundle(c, id, thick, 132, 58, hash(key) + i);
      c.restore();
    }
  } else if (id === 'aciyag') {
    // a pool of chili oil
    c.fillStyle = radial(c, W / 2 - 40, H / 2 - 30, 10, W / 2, H / 2, 130, [
      [0, '#e8603a'],
      [0.6, '#c93d22'],
      [1, '#8f2514'],
    ]);
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#7a170a';
    for (let i = 0; i < 40; i++) {
      c.save();
      c.translate(22 + r() * (W - 44), 22 + r() * (H - 44));
      c.rotate(r() * TAU);
      c.beginPath();
      c.roundRect(-2, -1.4, 4, 2.8, 1);
      c.fill();
      c.restore();
    }
    gloss(c, W / 2 - 50, H / 2 - 34, 60, 20, -0.35, 0.3);
  } else {
    // shingled rows, back to front, ~40% of each piece visible
    const size = Math.min(92, (PIECE_SIZE[id] ?? 60) * (PILE.has(id) ? 1.05 : 0.95));
    const loose = id === 'susam' || id === 'citir';
    const sx = size * (loose ? 0.6 : PILE.has(id) ? 0.42 : 0.55);
    const sy = size * (loose ? 0.55 : PILE.has(id) ? 0.4 : 0.48);
    const cols = Math.ceil((W - 36) / sx) + 1;
    const rows = Math.ceil((H - 36) / sy) + 1;
    const baseRot = PILE.has(id) ? 0 : -0.35 + r() * 0.3;
    let k = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = 18 + (col + 0.5 + (row % 2) * 0.5) * sx + (r() - 0.5) * sx * 0.3 - sx * 0.5;
        const y = 18 + (row + 0.5) * sy + (r() - 0.5) * sy * 0.3;
        c.save();
        c.translate(x, y);
        c.rotate(PILE.has(id) ? r() * TAU : baseRot + (r() - 0.5) * 0.4);
        c.shadowColor = ink(0.32);
        c.shadowBlur = 4;
        c.shadowOffsetY = 2;
        c.drawImage(sprite(id, k++), -size / 2, -size / 2, size, size);
        c.restore();
      }
    }
  }
  c.restore();
  // inner shadow at the top of the well + thin lighter lip
  c.save();
  c.clip(well);
  c.fillStyle = linear(c, 0, 18, 0, 34, [
    [0, ink(0.3)],
    [1, ink(0)],
  ]);
  c.fillRect(0, 18, W, 16);
  c.restore();
  c.strokeStyle = hi(0.65);
  c.lineWidth = 1.5;
  c.stroke(well);
  trays.set(key, cv);
  return cv;
}
