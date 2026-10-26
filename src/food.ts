// Food rendering on Canvas 2D in a "Good Pizza, Great Pizza" spirit:
// chunky, juicy, painterly 2D food. Every shape is a clean silhouette with soft
// form shading (light from the top-left, one soft shadow side, one small
// specular). No ink outlines, no noise, no muddy gradients. Everything is
// procedural and cached.

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
/** lighten (amt>0) or darken (amt<0) a hex colour, optionally with alpha */
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

/** warm white highlight / warm shadow (never pure white or black) */
const hi = (a: number) => `rgba(255,246,232,${a})`;
const sh = (a: number) => `rgba(43,36,32,${a})`;

function radial(
  c: Ctx,
  x: number,
  y: number,
  r1: number,
  stops: [number, string][],
  x1 = x,
  y1 = y
) {
  const g = c.createRadialGradient(x, y, 0, x1, y1, r1);
  for (const [t, col] of stops) g.addColorStop(t, col);
  return g;
}
function linear(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [t, col] of stops) g.addColorStop(t, col);
  return g;
}

interface Shade {
  /** highlight strength (0..1) */
  light?: number;
  /** shadow strength (0..1) */
  dark?: number;
  /** light direction, in units of rad */
  lx?: number;
  ly?: number;
  /** soft dark band on the shadow side of the silhouette */
  edge?: number;
  spread?: number;
}
/**
 * The painterly fill: a clean silhouette with a soft three-tone radial
 * (light → base → shadow) lit from the top-left, plus a soft dark band on
 * the lower-right side of the silhouette so the form reads against anything.
 */
function paint(c: Ctx, p: Path2D, col: string, cx: number, cy: number, rad: number, o: Shade = {}) {
  const { light = 0.22, dark = 0.3, lx = -0.38, ly = -0.42, edge = 0.25, spread = 1.5 } = o;
  c.fillStyle = radial(
    c,
    cx + lx * rad,
    cy + ly * rad,
    rad * spread,
    [
      [0, tint(col, light)],
      [0.5, col],
      [1, tint(col, -dark)],
    ],
    cx + lx * rad * 0.25,
    cy + ly * rad * 0.25
  );
  c.fill(p);
  if (edge > 0) {
    c.save();
    c.clip(p);
    const d = tint(col, -0.5, edge);
    c.strokeStyle = d;
    c.lineWidth = rad * 0.14;
    c.shadowColor = d;
    c.shadowBlur = rad * 0.16;
    c.translate(rad * 0.06, rad * 0.07);
    c.stroke(p);
    c.restore();
  }
}
/** one small soft specular */
function spec(
  c: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot = -0.6,
  a = 0.75,
  blur = 1.2
) {
  c.save();
  c.fillStyle = hi(a);
  c.shadowColor = hi(a);
  c.shadowBlur = blur;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
  c.fill();
  c.restore();
}
/** soft contact shadow under a shape */
function drop(c: Ctx, p: Path2D, a = 0.3, blur = 5, dx = 2, dy = 4) {
  c.save();
  c.fillStyle = sh(a);
  c.shadowColor = sh(a);
  c.shadowBlur = blur;
  c.translate(dx, dy);
  c.fill(p);
  c.restore();
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
/** smooth organic disc */
function blob(r: () => number, cx: number, cy: number, rad: number, wob: number, n = 16) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = rad * (1 - wob / 2 + r() * wob);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return smoothClosed(pts);
}
function spiral(r0: number, step: number, turns: number, sx = 1, sy = 1) {
  const p = new Path2D();
  for (let a = 0, rr = r0; a < TAU * turns; a += 0.08, rr += step * 0.08) {
    const x = Math.cos(a) * rr * sx;
    const y = Math.sin(a) * rr * sy;
    if (a === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p;
}
/**
 * A rounded, shaded strand (noodle, ribbon, fat spiral, sauce drizzle):
 * soft cast shadow, darker edge tone, lit body, thin satin highlight.
 */
function strand(c: Ctx, p: Path2D, col: string, w: number, hiA = 0.5, shadowA = 0.22) {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (shadowA > 0) {
    c.save();
    c.strokeStyle = sh(shadowA);
    c.lineWidth = w;
    c.translate(w * 0.22, w * 0.34);
    c.stroke(p);
    c.restore();
  }
  c.strokeStyle = tint(col, -0.3);
  c.lineWidth = w;
  c.stroke(p);
  c.save();
  c.strokeStyle = col;
  c.lineWidth = w * 0.7;
  c.translate(-w * 0.07, -w * 0.1);
  c.stroke(p);
  c.restore();
  if (hiA > 0) {
    c.save();
    c.strokeStyle = hi(hiA);
    c.lineWidth = Math.max(0.7, w * 0.2);
    c.translate(-w * 0.2, -w * 0.26);
    c.stroke(p);
    c.restore();
  }
}

// ---------- topping sprites (128×128 space, centred at 64,64, 2× supersampled) ----------
const S = 128;
const SS = 2;
type Draw = (c: Ctx, r: () => number) => void;

const egg: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.4);
  // egg-shaped white: narrower top, fuller bottom
  const W = new Path2D();
  W.moveTo(0, -50);
  W.bezierCurveTo(30, -50, 50, -26, 50, 4);
  W.bezierCurveTo(50, 34, 26, 52, 0, 52);
  W.bezierCurveTo(-26, 52, -50, 34, -50, 4);
  W.bezierCurveTo(-50, -26, -30, -50, 0, -50);
  W.closePath();
  drop(c, W, 0.25, 6, 2, 4);
  paint(c, W, '#f6ecd8', 0, 0, 52, { light: 0.1, dark: 0.18, edge: 0.2 });
  // soy-marinade tan rim of the white
  c.save();
  c.clip(W);
  c.strokeStyle = 'rgba(176,122,62,.6)';
  c.lineWidth = 7;
  c.shadowColor = 'rgba(176,122,62,.6)';
  c.shadowBlur = 5;
  c.stroke(W);
  c.restore();
  // yolk: slightly low, with a soft socket shadow
  const Y = ell(1, 8, 31, 27);
  c.save();
  c.clip(W);
  c.fillStyle = sh(0.0001);
  c.shadowColor = sh(0.35);
  c.shadowBlur = 6;
  c.shadowOffsetX = -2;
  c.shadowOffsetY = -2;
  c.fill(ell(1, 8, 32, 28));
  c.restore();
  paint(c, Y, '#f0962a', 1, 8, 29, { light: 0.3, dark: 0.36, edge: 0.3 });
  // jammy, darker molten centre
  c.fillStyle = radial(c, 5, 13, 20, [
    [0, 'rgba(214,92,16,.8)'],
    [0.6, 'rgba(214,92,16,.35)'],
    [1, 'rgba(214,92,16,0)'],
  ]);
  c.fill(Y);
  spec(c, -9, -2, 10, 5.5, -0.6, 0.85, 1.5);
  spec(c, 9, -7, 3, 1.8, -0.4, 0.55, 1);
  spec(c, -28, -28, 7, 3, -0.7, 0.6, 1.5);
  c.restore();
};

const chashu: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const outer = blob(r, 0, 0, 57, 0.05, 18);
  drop(c, outer, 0.28, 6, 2, 4);
  paint(c, outer, '#9a5a32', 0, 0, 57, { light: 0.28, dark: 0.4, edge: 0.35 });
  // caramelised glaze spots on the rind
  c.save();
  c.clip(outer);
  c.fillStyle = 'rgba(80,36,14,.45)';
  for (let i = 0; i < 7; i++) {
    const a = r() * TAU;
    c.beginPath();
    c.ellipse(Math.cos(a) * 54, Math.sin(a) * 54, 6 + r() * 5, 2.4, a + Math.PI / 2, 0, TAU);
    c.fill();
  }
  c.restore();
  const fat = blob(r, 0, 0, 52, 0.05, 18);
  paint(c, fat, '#f4e6d3', 0, 0, 52, { light: 0.08, dark: 0.2, edge: 0.18 });
  const meat = blob(r, 0, 0, 46, 0.06, 18);
  paint(c, meat, '#dc8f7a', 0, 0, 46, { light: 0.22, dark: 0.3, edge: 0.26 });
  c.save();
  c.clip(meat);
  // meat grain: fine arcs following the roll
  c.strokeStyle = 'rgba(150,60,45,.28)';
  c.lineWidth = 1.5;
  c.lineCap = 'round';
  for (let i = 0; i < 26; i++) {
    const a = r() * TAU;
    const d = 8 + r() * 36;
    c.beginPath();
    c.arc(0, 0, d, a, a + 0.35 + r() * 0.5);
    c.stroke();
  }
  // soft rosy centre
  c.fillStyle = radial(c, -4, -4, 30, [
    [0, 'rgba(236,160,140,.55)'],
    [1, 'rgba(236,160,140,0)'],
  ]);
  c.fill(meat);
  // fat spiral
  strand(c, spiral(5, 5.6, 2.05, 1.04, 0.96), '#f7ece0', 8, 0.35, 0.16);
  c.restore();
  spec(c, -18, -20, 11, 5, -0.7, 0.5, 2);
  c.restore();
};

function sring(c: Ctx, x: number, y: number, R: number, col: string) {
  const o = ell(x, y, R, R * 0.92);
  drop(c, o, 0.22, 3, 1, 2);
  paint(c, o, col, x, y, R, { light: 0.28, dark: 0.32, edge: 0.32 });
  // inner layer line
  c.strokeStyle = tint(col, 0.4, 0.6);
  c.lineWidth = 1.4;
  c.beginPath();
  c.ellipse(x, y, R * 0.7, R * 0.64, 0, 0, TAU);
  c.stroke();
  const h = ell(x + R * 0.04, y + R * 0.06, R * 0.44, R * 0.4);
  c.fillStyle = radial(c, x - R * 0.1, y - R * 0.1, R * 0.6, [
    [0, '#f4f8e6'],
    [1, '#cddcb0'],
  ]);
  c.fill(h);
  c.save();
  c.clip(h);
  c.strokeStyle = sh(0.4);
  c.lineWidth = R * 0.22;
  c.shadowColor = sh(0.4);
  c.shadowBlur = R * 0.22;
  c.translate(R * 0.1, R * 0.12);
  c.stroke(h);
  c.restore();
  spec(c, x - R * 0.45, y - R * 0.5, R * 0.24, R * 0.12, -0.5, 0.75, 1);
}
const greenOnion: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const pos: [number, number, number][] = [
    [-26, -14, 21],
    [14, -24, 19],
    [26, 18, 20],
    [-16, 26, 18],
    [-2, 0, 16],
  ];
  for (const [x, y, R] of pos) sring(c, x, y, R, r() < 0.4 ? '#9cc06f' : '#6fa05a');
  c.restore();
};

const nori: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.3);
  const p = new Path2D();
  p.moveTo(-46, -50);
  p.quadraticCurveTo(0, -54, 46, -48);
  p.lineTo(48, 44);
  p.quadraticCurveTo(16, 34, -24, 50);
  p.lineTo(-48, 48);
  p.closePath();
  drop(c, p, 0.3, 6, 2, 4);
  paint(c, p, '#2f4b3a', 0, 0, 56, { light: 0.3, dark: 0.3, edge: 0.3 });
  // satin sheen band
  c.save();
  c.clip(p);
  c.fillStyle = linear(c, -50, -50, 30, 40, [
    [0, 'rgba(255,246,232,0)'],
    [0.32, 'rgba(255,246,232,.2)'],
    [0.42, 'rgba(255,246,232,.06)'],
    [1, 'rgba(255,246,232,0)'],
  ]);
  c.fillRect(-60, -60, 120, 120);
  // fine fibre streaks
  c.strokeStyle = 'rgba(255,246,232,.09)';
  c.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    const y = -40 + i * 12 + r() * 5;
    c.beginPath();
    c.moveTo(-48, y);
    c.lineTo(48, y - 2);
    c.stroke();
  }
  c.restore();
  // curled corner: lighter underside
  const f = new Path2D();
  f.moveTo(48, 44);
  f.quadraticCurveTo(16, 34, -24, 50);
  f.quadraticCurveTo(12, 48, 30, 56);
  f.quadraticCurveTo(44, 58, 48, 44);
  paint(c, f, '#5b7e64', 20, 48, 30, { light: 0.2, dark: 0.25, edge: 0.2 });
  c.restore();
};

function kernel(c: Ctx, x: number, y: number, rot: number, s = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  const p = new Path2D();
  p.moveTo(-13, -12);
  p.quadraticCurveTo(0, -18, 13, -12);
  p.quadraticCurveTo(16, 3, 7, 13);
  p.quadraticCurveTo(0, 17, -7, 13);
  p.quadraticCurveTo(-16, 3, -13, -12);
  drop(c, p, 0.22, 3, 1, 2);
  paint(c, p, '#f6c643', 0, 0, 15, { light: 0.3, dark: 0.32, edge: 0.3 });
  // dimple
  c.fillStyle = 'rgba(190,120,20,.4)';
  c.beginPath();
  c.ellipse(0, -5, 5, 3.4, 0, 0, TAU);
  c.fill();
  c.fillStyle = hi(0.5);
  c.beginPath();
  c.ellipse(0, -2.6, 4, 1.6, 0, 0, TAU);
  c.fill();
  spec(c, -5, -8, 3, 1.8, -0.6, 0.7, 0.8);
  c.restore();
}
const corn: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const pos: [number, number][] = [
    [-24, -16],
    [14, -24],
    [28, 12],
    [-14, 26],
    [0, 0],
    [-30, 10],
  ];
  for (const [x, y] of pos) kernel(c, x, y, r() * TAU, 1.25);
  c.restore();
};

const shiitake: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  // gills peeking out below the cap
  const g = ell(0, 5, 50, 47);
  drop(c, g, 0.28, 6, 2, 4);
  paint(c, g, '#d8b07a', 0, 5, 50, { light: 0.15, dark: 0.3, edge: 0.3 });
  c.save();
  c.clip(g);
  c.strokeStyle = 'rgba(120,80,40,.4)';
  c.lineWidth = 1.3;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    c.beginPath();
    c.moveTo(Math.cos(a) * 20, 5 + Math.sin(a) * 18);
    c.lineTo(Math.cos(a) * 52, 5 + Math.sin(a) * 50);
    c.stroke();
  }
  c.restore();
  const cap = blob(r, 0, -3, 49, 0.05, 16);
  drop(c, cap, 0.3, 4, 1, 3);
  paint(c, cap, '#8e5a36', 0, -3, 49, { light: 0.3, dark: 0.38, edge: 0.3 });
  // cross score: three carved grooves
  c.save();
  c.clip(cap);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI + 0.3;
    const p = new Path2D();
    p.moveTo(Math.cos(a) * 30, -4 + Math.sin(a) * 30);
    p.lineTo(-Math.cos(a) * 30, -4 - Math.sin(a) * 30);
    c.strokeStyle = 'rgba(70,40,20,.55)';
    c.lineWidth = 9;
    c.lineCap = 'round';
    c.stroke(p);
    c.strokeStyle = '#f0dfc0';
    c.lineWidth = 6;
    c.stroke(p);
    c.strokeStyle = 'rgba(200,170,120,.6)';
    c.lineWidth = 2;
    c.save();
    c.translate(1, 1.5);
    c.stroke(p);
    c.restore();
  }
  c.restore();
  spec(c, -20, -24, 12, 5, -0.7, 0.4, 3);
  c.restore();
};

const chiliOil: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const pool = blob(r, -3, 2, 42, 0.16, 12);
  const dropl = [ell(42, -26, 11, 9), ell(-40, 34, 8, 7), ell(30, 36, 5, 4.5)];
  for (const p of [pool, ...dropl]) {
    c.fillStyle = radial(c, -14, -10, 60, [
      [0, 'rgba(240,110,48,.7)'],
      [0.6, 'rgba(220,70,30,.8)'],
      [1, 'rgba(176,44,20,.88)'],
    ]);
    c.fill(p);
    c.save();
    c.clip(p);
    c.strokeStyle = 'rgba(120,20,8,.35)';
    c.lineWidth = 5;
    c.shadowColor = 'rgba(120,20,8,.4)';
    c.shadowBlur = 5;
    c.translate(2, 3);
    c.stroke(p);
    c.restore();
  }
  // flakes
  for (let i = 0; i < 12; i++) {
    const a = r() * TAU;
    const d = r() * 30;
    c.fillStyle = i % 3 ? '#7e1d0f' : '#b8321a';
    c.beginPath();
    c.ellipse(-3 + Math.cos(a) * d, 2 + Math.sin(a) * d, 2.5 + r() * 2, 1.6, a, 0, TAU);
    c.fill();
  }
  spec(c, -20, -14, 12, 5, -0.6, 0.55, 3);
  spec(c, 10, 14, 5, 2.5, -0.6, 0.4, 2);
  c.restore();
};

const tofu: Draw = (c, r) => {
  c.save();
  c.translate(64, 60);
  c.rotate((r() - 0.5) * 0.35);
  const top = rrect(-40, -36, 80, 54, 9);
  const front = new Path2D();
  front.moveTo(-40, 8);
  front.lineTo(40, 8);
  front.lineTo(40, 30);
  front.quadraticCurveTo(40, 40, 30, 40);
  front.lineTo(-30, 40);
  front.quadraticCurveTo(-40, 40, -40, 30);
  front.closePath();
  drop(c, front, 0.3, 6, 2, 5);
  paint(c, front, '#c98f3a', 0, 24, 42, { light: 0.15, dark: 0.32, edge: 0.3, ly: -0.1 });
  paint(c, top, '#f0d184', 0, -9, 44, { light: 0.22, dark: 0.22, edge: 0.25 });
  // porous crust: soft darker pits + crisp light flecks
  c.save();
  c.clip(top);
  for (let i = 0; i < 16; i++) {
    const x = -34 + r() * 68;
    const y = -30 + r() * 44;
    c.fillStyle = 'rgba(180,120,40,.35)';
    c.beginPath();
    c.ellipse(x, y, 2.4 + r() * 2.2, 1.6 + r() * 1.4, r() * TAU, 0, TAU);
    c.fill();
    c.fillStyle = hi(0.45);
    c.beginPath();
    c.ellipse(x - 1, y - 1.5, 1.4, 0.8, 0, 0, TAU);
    c.fill();
  }
  c.restore();
  c.save();
  c.clip(front);
  c.fillStyle = 'rgba(150,90,30,.35)';
  for (let i = 0; i < 8; i++) {
    c.beginPath();
    c.ellipse(-34 + r() * 68, 12 + r() * 26, 2.4, 1.6, 0, 0, TAU);
    c.fill();
  }
  c.restore();
  spec(c, -18, -24, 12, 4.5, -0.15, 0.55, 2);
  c.restore();
};

const shrimp: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.5);
  c.scale(1.08, 1.08);
  const body = new Path2D();
  body.moveTo(-34, 24);
  body.quadraticCurveTo(-4, -46, 44, 8);
  // tail fan
  c.save();
  c.translate(-34, 24);
  c.rotate(0.95);
  for (const [a, len] of [
    [-0.6, 40],
    [0.1, 46],
    [0.75, 38],
  ]) {
    const p = new Path2D();
    p.moveTo(0, 0);
    p.quadraticCurveTo(
      Math.cos(a - 0.25) * len * 0.7,
      Math.sin(a - 0.25) * len * 0.7,
      Math.cos(a) * len,
      Math.sin(a) * len
    );
    p.quadraticCurveTo(
      Math.cos(a + 0.25) * len * 0.75,
      Math.sin(a + 0.25) * len * 0.75,
      Math.cos(a + 0.45) * len * 0.45,
      Math.sin(a + 0.45) * len * 0.45
    );
    p.closePath();
    drop(c, p, 0.25, 4, 1, 3);
    paint(c, p, '#e2552f', Math.cos(a) * len * 0.5, Math.sin(a) * len * 0.5, len * 0.6, {
      light: 0.3,
      dark: 0.35,
      edge: 0.3,
    });
    c.strokeStyle = 'rgba(255,205,180,.55)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(4, 0);
    c.lineTo(Math.cos(a + 0.1) * len * 0.9, Math.sin(a + 0.1) * len * 0.9);
    c.stroke();
    c.fillStyle = 'rgba(255,225,205,.45)';
    c.beginPath();
    c.ellipse(Math.cos(a + 0.05) * len * 0.4, Math.sin(a + 0.05) * len * 0.4, 6, 2.5, a, 0, TAU);
    c.fill();
  }
  c.restore();
  // batter body: shadow, dark edge, lit body
  c.lineCap = 'round';
  c.save();
  c.strokeStyle = sh(0.3);
  c.shadowColor = sh(0.3);
  c.shadowBlur = 6;
  c.lineWidth = 34;
  c.translate(2, 5);
  c.stroke(body);
  c.restore();
  c.strokeStyle = '#c2862f';
  c.lineWidth = 34;
  c.stroke(body);
  c.save();
  c.translate(-2, -3);
  c.strokeStyle = '#ecbd5e';
  c.lineWidth = 26;
  c.stroke(body);
  c.restore();
  // plump head end
  const head = ell(40, 6, 20, 17, 0.5);
  paint(c, head, '#e3b352', 40, 6, 19, { light: 0.25, dark: 0.35, edge: 0.3 });
  // crispy batter bumps along the body
  for (let i = 0; i < 26; i++) {
    const t = r();
    const x = (1 - t) * (1 - t) * -34 + 2 * (1 - t) * t * -4 + t * t * 44;
    const y = (1 - t) * (1 - t) * 24 + 2 * (1 - t) * t * -46 + t * t * 8;
    const dx = 2 * (1 - t) * (-4 + 34) + 2 * t * (44 + 4);
    const dy = 2 * (1 - t) * (-46 - 24) + 2 * t * (8 + 46);
    const n = Math.hypot(dx, dy);
    const off = (r() - 0.5) * 30;
    const bx = x + (-dy / n) * off;
    const by = y + (dx / n) * off;
    const R = 4 + r() * 5;
    const p = ell(bx, by, R, R * 0.85, r() * TAU);
    paint(c, p, r() < 0.3 ? '#d79a3c' : '#f0c766', bx, by, R, {
      light: 0.3,
      dark: 0.35,
      edge: 0.3,
    });
  }
  spec(c, -4, -22, 10, 4, 0.5, 0.55, 2);
  c.restore();
};

const naruto: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const p = new Path2D();
  const n = 140;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const rr = 48 + 6 * Math.abs(Math.sin(a * 6));
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  drop(c, p, 0.26, 6, 2, 4);
  paint(c, p, '#fbf5ea', 0, 0, 52, { light: 0.06, dark: 0.17, edge: 0.2 });
  c.save();
  c.clip(p);
  strand(c, spiral(3, 6.2, 2.1), '#ef7fa0', 9.5, 0.4, 0.14);
  c.restore();
  spec(c, -18, -20, 11, 5, -0.7, 0.55, 2);
  c.restore();
};

const bamboo: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const strips: [number, number, number][] = [
    [-10, -26, -0.35],
    [8, -10, -0.2],
    [-6, 6, -0.05],
    [10, 22, 0.1],
    [-14, 34, 0.25],
  ];
  for (const [x, y, a] of strips) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    const w = 84;
    const h = 17;
    const p = rrect(-w / 2, -h / 2, w, h, 5);
    drop(c, p, 0.26, 4, 1, 3);
    paint(c, p, '#d6ab58', 0, 0, 40, { light: 0.25, dark: 0.3, edge: 0.3, spread: 2.2 });
    c.save();
    c.clip(p);
    c.strokeStyle = hi(0.4);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-w / 2, -4);
    c.lineTo(w / 2, -4);
    c.stroke();
    c.strokeStyle = 'rgba(140,90,30,.4)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-w / 2, 2);
    c.lineTo(w / 2, 2);
    c.moveTo(-w / 2, 6);
    c.lineTo(w / 2, 6);
    c.stroke();
    c.restore();
    c.restore();
  }
  c.restore();
};

const sesame: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  for (let i = 0; i < 20; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r()) * 42;
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const rot = r() * TAU;
    const p = ell(x, y, 7.5, 4.6, rot);
    drop(c, p, 0.22, 2, 1, 1.5);
    const black = i % 5 === 0;
    paint(c, p, black ? '#3b322c' : '#f4e7c9', x, y, 7, { light: 0.25, dark: 0.3, edge: 0.3 });
    spec(c, x - 2, y - 1.5, 2, 1, rot, 0.7, 0.6);
  }
  c.restore();
};

const pakchoi: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.6);
  const leaf = (dx: number, dy: number, a: number, s: number) => {
    c.save();
    c.translate(dx, dy);
    c.rotate(a);
    c.scale(s, s);
    // white bulbous stem
    const st = new Path2D();
    st.moveTo(-6, 54);
    st.quadraticCurveTo(-24, 40, -18, 10);
    st.quadraticCurveTo(-10, -6, 0, -8);
    st.quadraticCurveTo(10, -6, 18, 10);
    st.quadraticCurveTo(24, 40, 6, 54);
    st.closePath();
    drop(c, st, 0.26, 5, 2, 4);
    paint(c, st, '#eef3dc', 0, 26, 34, { light: 0.08, dark: 0.22, edge: 0.25 });
    // green leaf
    const lf = new Path2D();
    lf.moveTo(-12, 4);
    lf.quadraticCurveTo(-48, -14, -36, -42);
    lf.quadraticCurveTo(-20, -62, 0, -58);
    lf.quadraticCurveTo(22, -62, 36, -42);
    lf.quadraticCurveTo(48, -14, 12, 4);
    lf.closePath();
    drop(c, lf, 0.22, 5, 2, 3);
    paint(c, lf, '#5f9f52', 0, -30, 44, { light: 0.3, dark: 0.35, edge: 0.3 });
    c.save();
    c.clip(lf);
    c.strokeStyle = 'rgba(230,240,200,.55)';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 4);
    c.lineTo(0, -52);
    for (const [y, k] of [
      [-10, 1],
      [-24, 0.85],
      [-38, 0.6],
    ]) {
      c.moveTo(0, y);
      c.quadraticCurveTo(-14 * k, y - 10 * k, -30 * k, y - 10 * k);
      c.moveTo(0, y);
      c.quadraticCurveTo(14 * k, y - 10 * k, 30 * k, y - 10 * k);
    }
    c.stroke();
    c.restore();
    c.restore();
  };
  leaf(-18, 2, -0.55, 0.85);
  leaf(8, 0, 0.18, 1);
  c.restore();
};

const sprouts: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  // a loose pile of plump sprouts, roughly parallel, heads at both ends
  for (let i = 0; i < 9; i++) {
    const a = (r() - 0.5) * 0.9 + (i % 2) * 0.5;
    const off = -40 + i * 10 + (r() - 0.5) * 6;
    const len = 44 + r() * 14;
    const x0 = Math.cos(a) * -len + Math.sin(a) * off;
    const y0 = Math.sin(a) * -len - Math.cos(a) * off;
    const x1 = Math.cos(a) * len + Math.sin(a) * off;
    const y1 = Math.sin(a) * len - Math.cos(a) * off;
    const bend = (r() - 0.5) * 30;
    const cxp = (x0 + x1) / 2 - Math.sin(a) * bend;
    const cyp = (y0 + y1) / 2 + Math.cos(a) * bend;
    const p = new Path2D();
    p.moveTo(x0, y0);
    p.quadraticCurveTo(cxp, cyp, x1, y1);
    strand(c, p, '#f7f2e4', 9, 0.5, 0.26);
    // thin root tail
    const t = new Path2D();
    t.moveTo(x1, y1);
    t.quadraticCurveTo(
      x1 + Math.cos(a + 0.7) * 9,
      y1 + Math.sin(a + 0.7) * 9,
      x1 + Math.cos(a + 0.2) * 14,
      y1 + Math.sin(a + 0.2) * 14
    );
    strand(c, t, '#efe8d4', 2.4, 0.2, 0.15);
    // yellow bean head
    const h = ell(x0, y0, 9, 6.5, a + 0.3);
    drop(c, h, 0.2, 2, 1, 1.5);
    paint(c, h, '#e9cf6e', x0, y0, 8, { light: 0.3, dark: 0.35, edge: 0.3 });
    c.strokeStyle = 'rgba(170,130,40,.45)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x0 - Math.cos(a + 0.3) * 6, y0 - Math.sin(a + 0.3) * 6);
    c.lineTo(x0 + Math.cos(a + 0.3) * 6, y0 + Math.sin(a + 0.3) * 6);
    c.stroke();
    spec(c, x0 - 2.5, y0 - 2.5, 2.4, 1.2, -0.6, 0.7, 0.6);
  }
  c.restore();
};

const chili: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const pos: [number, number, number][] = [
    [-24, -18, 20],
    [20, -20, 19],
    [22, 22, 20],
    [-20, 24, 18],
  ];
  for (const [x, y, R] of pos) {
    const o = ell(x, y, R, R * 0.9);
    drop(c, o, 0.24, 3, 1, 2);
    paint(c, o, '#d93c2b', x, y, R, { light: 0.3, dark: 0.35, edge: 0.32 });
    const inn = ell(x + R * 0.03, y + R * 0.05, R * 0.62, R * 0.55);
    paint(c, inn, '#f4dcc0', x, y, R * 0.6, { light: 0.05, dark: 0.22, edge: 0.3 });
    c.fillStyle = '#efdca8';
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + r();
      c.beginPath();
      c.ellipse(x + Math.cos(a) * R * 0.4, y + Math.sin(a) * R * 0.36, 2.6, 1.8, a, 0, TAU);
      c.fill();
    }
    spec(c, x - R * 0.5, y - R * 0.5, R * 0.22, R * 0.11, -0.6, 0.75, 1);
  }
  c.restore();
};

const kimchi: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate(r() * TAU);
  const piece = (dx: number, dy: number, a: number, s: number) => {
    c.save();
    c.translate(dx, dy);
    c.rotate(a);
    c.scale(s, s);
    const p = new Path2D();
    p.moveTo(-44, 6);
    p.quadraticCurveTo(-40, -20, -14, -22);
    p.quadraticCurveTo(10, -30, 34, -18);
    p.quadraticCurveTo(50, -6, 40, 12);
    p.quadraticCurveTo(20, 28, -10, 22);
    p.quadraticCurveTo(-36, 24, -44, 6);
    p.closePath();
    drop(c, p, 0.26, 5, 2, 4);
    paint(c, p, '#e2592f', 0, 0, 46, { light: 0.28, dark: 0.36, edge: 0.3, spread: 1.8 });
    c.save();
    c.clip(p);
    // pale stem end
    c.fillStyle = linear(c, -44, 0, 4, 0, [
      [0, 'rgba(246,222,190,.9)'],
      [1, 'rgba(246,222,190,0)'],
    ]);
    c.fillRect(-50, -40, 60, 80);
    // wrinkles
    c.strokeStyle = 'rgba(150,40,20,.4)';
    c.lineWidth = 2;
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const y = -14 + i * 8;
      c.beginPath();
      c.moveTo(-30, y);
      c.quadraticCurveTo(0, y + (r() - 0.5) * 10, 36, y - 4);
      c.stroke();
    }
    c.fillStyle = '#8a1f10';
    for (let i = 0; i < 10; i++) {
      c.beginPath();
      c.ellipse(-30 + r() * 70, -16 + r() * 30, 2.2, 1.4, r() * TAU, 0, TAU);
      c.fill();
    }
    c.restore();
    spec(c, -8, -12, 10, 4, -0.3, 0.45, 2);
    c.restore();
  };
  piece(-6, -16, -0.3, 1);
  piece(8, 18, 0.35, 0.95);
  c.restore();
};

const lime: Draw = (c, r) => {
  c.save();
  c.translate(64, 70);
  c.rotate((r() - 0.5) * 0.4);
  const R = 56;
  const cy0 = 14;
  const a0 = Math.PI + 0.42;
  const a1 = TAU - 0.42;
  const w = new Path2D();
  w.arc(0, cy0, R, a0, a1);
  w.closePath();
  drop(c, w, 0.26, 6, 2, 4);
  paint(c, w, '#79a63d', 0, cy0 - 20, 56, { light: 0.25, dark: 0.3, edge: 0.3 });
  const pith = new Path2D();
  pith.arc(0, cy0, R - 6, a0 + 0.06, a1 - 0.06);
  pith.closePath();
  c.fillStyle = '#eef3cf';
  c.fill(pith);
  const flesh = new Path2D();
  flesh.arc(0, cy0, R - 11, a0 + 0.12, a1 - 0.12);
  flesh.lineTo(0, cy0 - 2);
  flesh.closePath();
  paint(c, flesh, '#c3dc62', 0, cy0 - 20, 48, { light: 0.2, dark: 0.22, edge: 0.15 });
  c.save();
  c.clip(flesh);
  // segments + juicy vesicles
  c.strokeStyle = 'rgba(240,246,210,.9)';
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  for (let i = 1; i < 4; i++) {
    const a = a0 + ((a1 - a0) * i) / 4;
    c.beginPath();
    c.moveTo(0, cy0);
    c.lineTo(Math.cos(a) * R, cy0 + Math.sin(a) * R);
    c.stroke();
  }
  c.strokeStyle = 'rgba(255,250,220,.45)';
  c.lineWidth = 1.3;
  for (let i = 0; i < 40; i++) {
    const a = a0 + 0.1 + r() * (a1 - a0 - 0.2);
    const d0 = 10 + r() * 24;
    c.beginPath();
    c.moveTo(Math.cos(a) * d0, cy0 + Math.sin(a) * d0);
    c.lineTo(Math.cos(a) * (d0 + 8), cy0 + Math.sin(a) * (d0 + 8));
    c.stroke();
  }
  c.restore();
  spec(c, -20, cy0 - 26, 7, 3, -0.5, 0.6, 1.5);
  c.restore();
};

const shallot: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  for (let i = 0; i < 14; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r()) * 38;
    const x = Math.cos(a) * d;
    const y = Math.sin(a) * d;
    const R = 8 + r() * 7;
    const s0 = r() * TAU;
    const p = new Path2D();
    p.arc(x, y, R, s0, s0 + 2.6 + r() * 1.5);
    strand(c, p, r() < 0.4 ? '#c98a3c' : '#a86526', 5 + r() * 2, 0.45, 0.26);
  }
  // crumbs
  for (let i = 0; i < 10; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r()) * 46;
    const p = ell(Math.cos(a) * d, Math.sin(a) * d, 2.4, 1.8, a);
    paint(c, p, '#b4732c', Math.cos(a) * d, Math.sin(a) * d, 2.4, { edge: 0.2 });
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

/** size of a piece (sprite box) in the 300×300 bowl space */
export const PIECE_SIZE: Record<string, number> = {
  yumurta: 120,
  chashu: 125,
  yesil: 86,
  nori: 110,
  misir: 80,
  mantar: 100,
  aciyag: 88,
  tofu: 80,
  karides: 135,
  naruto: 95,
  bambu: 96,
  susam: 76,
  pakchoi: 120,
  filiz: 104,
  biber: 84,
  kimchi: 100,
  lime: 92,
  citir: 84,
};

export function drawPiece(c: Ctx, p: PieceLike) {
  const img = sprite(p.id, p.k);
  const size = (PIECE_SIZE[p.id] ?? 80) * p.s;
  c.save();
  c.translate(p.x, p.y);
  c.rotate((p.r * Math.PI) / 180);
  c.shadowColor = sh(0.3);
  c.shadowBlur = 5;
  c.shadowOffsetX = 1;
  c.shadowOffsetY = 3;
  c.drawImage(img, -size / 2, -size / 2, size, size);
  c.restore();
}

// ---------- noodles ----------
const NOODLE_COL: Record<string, string> = {
  ramen: '#f0c75c',
  udon: '#f6eedd',
  soba: '#9a7a52',
  pirinc: '#f9f3e8',
};
const NOODLE_WMUL: Record<string, number> = { ramen: 1, udon: 1.4, soba: 0.9, pirinc: 0.85 };

interface StrandStyle {
  col: string;
  w: number;
  hiA: number;
  alpha: number;
}

function strandStyle(noodle: string, thick: Thick, cook: string, sauce?: string): StrandStyle {
  let col = NOODLE_COL[noodle] ?? NOODLE_COL.ramen;
  if (sauce) col = mixHex(col, INGREDIENTS[sauce].color, 0.38);
  let w = THICK_W[thick] * (NOODLE_WMUL[noodle] ?? 1) * 1.6;
  let hiA = noodle === 'soba' ? 0.3 : 0.5;
  const alpha = noodle === 'pirinc' ? 0.82 : 1;
  if (cook === 'raw') {
    col = mixHex(col, '#fff6e8', 0.3);
    hiA *= 0.3;
    w *= 0.92;
  }
  if (cook === 'soft') {
    w *= 1.18;
    hiA *= 0.5;
  }
  if (cook === 'burnt') {
    col = mixHex(col, '#7a5a30', 0.72);
    w *= 1.15;
    hiA = 0.12;
  }
  return { col, w, hiA, alpha };
}

const nests = new Map<string, HTMLCanvasElement>();
/** a dense, tidy nest of 20–30 glossy strands in the 300×300 bowl space */
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
  const radius = dry ? 106 : 96;
  const count = thick === 'ince' ? 32 : thick === 'orta' ? 28 : 22;
  const wave = cook === 'raw' ? 0.35 : cook === 'soft' ? 1.15 : 1;
  const cx = 150;
  const cy = 150;
  c.globalAlpha = st.alpha;
  // dense base: a soft dark disc so no gaps show between strands
  c.fillStyle = radial(c, cx, cy, radius, [
    [0, tint(st.col, -0.26, 0.85)],
    [0.85, tint(st.col, -0.34, 0.75)],
    [1, tint(st.col, -0.34, 0)],
  ]);
  c.beginPath();
  c.ellipse(cx, cy, radius * 0.97, radius * 0.95, 0, 0, TAU);
  c.fill();
  const strands: Path2D[] = [];
  for (let i = 0; i < count; i++) {
    const pts: [number, number][] = [];
    const t0 = (i + 0.5) / count;
    const base = radius * (0.2 + 0.74 * t0);
    const ox = (r() - 0.5) * radius * 0.3 * (1 - t0);
    const oy = (r() - 0.5) * radius * 0.3 * (1 - t0);
    const ex = 0.9 + r() * 0.2;
    const turns = 0.75 + r() * 0.5;
    const a0 = r() * TAU;
    const dir = i % 3 === 1 ? -1 : 1;
    const amp = (2.5 + r() * 4) * wave;
    const freq = 2 + Math.floor(r() * 3);
    const ph = r() * TAU;
    const segs = Math.round(34 * turns);
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
  // draped top strands catch the satin light
  const tops: Path2D[] = [];
  for (let i = 0; i < 4; i++) {
    const a = r() * TAU;
    const off = (r() - 0.5) * radius * 0.6;
    const len = Math.sqrt(Math.max(0, radius * radius - off * off)) * 1.4;
    const amp = (8 + r() * 8) * wave;
    const ph = r() * TAU;
    const pts: [number, number][] = [];
    for (let k = 0; k <= 18; k++) {
      const t = k / 18 - 0.5;
      const u = t * len;
      const v = off + Math.sin(t * 5 + ph) * amp + Math.cos(t * 2.2) * amp * 0.5;
      const x = Math.cos(a) * u - Math.sin(a) * v;
      const y = Math.sin(a) * u + Math.cos(a) * v;
      const d = Math.hypot(x, y);
      const lim = radius - st.w / 2 - 3;
      const k2 = d > lim ? lim / d : 1;
      pts.push([cx + x * k2, cy + y * k2]);
    }
    tops.push(smoothOpen(pts));
  }
  for (const p of strands) strand(c, p, st.col, st.w, st.hiA * 0.8, 0.2);
  for (const p of tops) strand(c, p, st.col, st.w, st.hiA * 1.4, 0.3);
  c.globalAlpha = 1;
  if (cook === 'burnt') {
    c.fillStyle = 'rgba(60,30,12,.55)';
    for (let i = 0; i < 24; i++) {
      const a = r() * TAU;
      const d = r() * radius * 0.85;
      c.save();
      c.shadowColor = 'rgba(60,30,12,.5)';
      c.shadowBlur = 3;
      c.beginPath();
      c.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 4 + r() * 4, 2.4, a, 0, TAU);
      c.fill();
      c.restore();
    }
  }
  if (cook === 'raw') {
    // dusting of flour
    c.fillStyle = hi(0.35);
    for (let i = 0; i < 30; i++) {
      const a = r() * TAU;
      const d = r() * radius * 0.9;
      c.beginPath();
      c.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1 + r() * 1.2, 0, TAU);
      c.fill();
    }
  }
  nests.set(key, cv);
  return cv;
}

/** a coiled round bundle of noodles (for containers), radius R centred at 0,0 */
function coil(c: Ctx, noodle: string, thick: Thick, R: number, seed: number) {
  const r = rng(seed);
  const st = strandStyle(noodle, thick, 'perfect');
  const w = st.w * 0.95;
  c.save();
  c.globalAlpha = st.alpha;
  const base = ell(0, 0, R, R * 0.94);
  drop(c, base, 0.35, 8, 2, 5);
  c.fillStyle = tint(st.col, -0.4, 0.9);
  c.fill(base);
  const n = Math.max(7, Math.round(R / (w * 0.75)));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const rad = R * (0.12 + 0.86 * t) - w / 2;
    const a0 = r() * TAU;
    const turns = 0.8 + r() * 0.35;
    const pts: [number, number][] = [];
    const segs = 30;
    const ph = r() * TAU;
    for (let k = 0; k <= segs; k++) {
      const u = k / segs;
      const a = a0 + u * TAU * turns;
      const rr = rad + Math.sin(u * 7 + ph) * 1.5 - u * w * 0.6;
      pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.94]);
    }
    strand(c, smoothOpen(pts), st.col, w, st.hiA * 0.9, 0.18);
  }
  // one strand draped across the top
  const pts: [number, number][] = [];
  const a = r() * TAU;
  for (let k = 0; k <= 12; k++) {
    const u = k / 12 - 0.5;
    const x = u * R * 1.5;
    const y = Math.sin(u * 6) * R * 0.18 + (r() - 0.5) * 2;
    const d = Math.hypot(x, y);
    const lim = R - w;
    const k2 = d > lim ? lim / d : 1;
    pts.push([(Math.cos(a) * x - Math.sin(a) * y) * k2, (Math.sin(a) * x + Math.cos(a) * y) * k2]);
  }
  strand(c, smoothOpen(pts), st.col, w, st.hiA * 1.4, 0.3);
  c.restore();
}

// ---------- bowl ----------
export const BOWL_R = 122;

/** glaze patterns drawn as clean motifs on the rim band (r 131..146) */
function drawRimPattern(c: Ctx, st: BowlStyle) {
  if (st.pattern === 'none') return;
  const cx = 150;
  const cy = 150;
  const col = st.patternColor;
  c.save();
  const band = new Path2D();
  band.arc(cx, cy, 145.5, 0, TAU);
  band.arc(cx, cy, 133, 0, TAU, true);
  c.clip(band, 'evenodd');
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const rm = 139;
  switch (st.pattern) {
    case 'wave': {
      c.lineWidth = 1.5;
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
      c.lineWidth = 1.8;
      for (const rr of [143.5, 135.5]) {
        c.beginPath();
        c.arc(cx, cy, rr, 0, TAU);
        c.stroke();
      }
      c.lineWidth = 1.3;
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
          c.beginPath();
          c.ellipse(x + Math.cos(pa) * 3.2, y + Math.sin(pa) * 3.2, 2.5, 1.9, pa, 0, TAU);
          c.fill();
        }
        c.fillStyle = hi(0.9);
        c.beginPath();
        c.arc(x, y, 1.4, 0, TAU);
        c.fill();
        c.fillStyle = col;
        const a2 = a + Math.PI / n;
        c.beginPath();
        c.arc(cx + Math.cos(a2) * rm, cy + Math.sin(a2) * rm, 1.3, 0, TAU);
        c.fill();
      }
      break;
    }
    case 'tenmoku': {
      const n = 90;
      const r = rng(7);
      c.lineWidth = 1.2;
      c.globalAlpha = 0.8;
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
      c.globalAlpha = 0.6;
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
      c.lineWidth = 2.4;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * 133, cy + Math.sin(a) * 133);
        c.lineTo(cx + Math.cos(a) * 146, cy + Math.sin(a) * 146);
        c.stroke();
      }
      c.lineWidth = 1.3;
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
        c.arc(cx + Math.cos(a) * rm, cy + Math.sin(a) * rm, 2.8, 0, TAU);
        c.fill();
      }
      break;
    }
  }
  c.restore();
}

/** big soft oil rings floating on the broth */
function fatRings(c: Ctx, r: () => number, cx: number, cy: number, rad: number, col: string) {
  const n = 4 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r() * 0.9;
    const d = rad * (0.25 + r() * 0.6);
    const x = cx + Math.cos(a) * d;
    const y = cy + Math.sin(a) * d;
    const rr = 9 + r() * 11;
    const p = ell(x, y, rr, rr * 0.88);
    c.fillStyle = radial(c, x, y, rr, [
      [0, tint(col, 0.35, 0.04)],
      [0.7, tint(col, 0.4, 0.14)],
      [1, tint(col, 0.6, 0.42)],
    ]);
    c.fill(p);
    c.strokeStyle = tint(col, -0.25, 0.14);
    c.lineWidth = 0.8;
    c.stroke(p);
    spec(c, x - rr * 0.4, y - rr * 0.38, rr * 0.3, rr * 0.14, -0.6, 0.32, 1.5);
  }
}

/** glossy pool of broth or sauce, radius rad, centred at cx,cy */
function pool(c: Ctx, p: Path2D, col: string, cx: number, cy: number, rad: number) {
  c.fillStyle = radial(
    c,
    cx - rad * 0.2,
    cy - rad * 0.25,
    rad * 1.25,
    [
      [0, tint(col, 0.14)],
      [0.55, col],
      [1, tint(col, -0.22)],
    ],
    cx,
    cy
  );
  c.fill(p);
  // wall shadow on the top-left of the surface
  c.save();
  c.clip(p);
  c.strokeStyle = sh(0.32);
  c.lineWidth = rad * 0.14;
  c.shadowColor = sh(0.35);
  c.shadowBlur = rad * 0.14;
  c.translate(rad * 0.07, rad * 0.08);
  c.stroke(p);
  c.restore();
}

export function drawBowl(c: Ctx, b: BowlDraw) {
  const cx = 150;
  const cy = 150;
  c.clearRect(0, 0, 300, 300);
  const st: BowlStyle = BOWLS[b.style ?? DEFAULT_BOWL] ?? BOWLS[DEFAULT_BOWL];
  const glaze: [string, string, string] = b.takeaway ? ['#e6cfa6', '#cfae80', '#a3825a'] : st.glaze;
  const lip = b.takeaway ? '#f2e6cf' : st.lip;
  const ic = b.takeaway ? BOWLS[DEFAULT_BOWL].inner : st.inner;

  // cast shadow
  const rim = ell(cx, cy, 146, 146);
  drop(c, rim, 0.3, 12, 3, 9);
  // outer glaze: soft three-tone ceramic
  c.fillStyle = radial(
    c,
    cx - 60,
    cy - 70,
    215,
    [
      [0, glaze[0]],
      [0.5, glaze[1]],
      [1, glaze[2]],
    ],
    cx - 20,
    cy - 20
  );
  c.fill(rim);
  if (!b.takeaway) drawRimPattern(c, st);
  else {
    c.strokeStyle = sh(0.14);
    c.lineWidth = 1.6;
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * 134, cy + Math.sin(a) * 134);
      c.lineTo(cx + Math.cos(a) * 145, cy + Math.sin(a) * 145);
      c.stroke();
    }
  }
  // glaze specular + rim-light
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = hi(0.55);
  c.shadowColor = hi(0.6);
  c.shadowBlur = 4;
  c.lineWidth = 4;
  c.beginPath();
  c.arc(cx, cy, 140, Math.PI * 1.08, Math.PI * 1.36);
  c.stroke();
  c.strokeStyle = hi(0.22);
  c.lineWidth = 2.5;
  c.beginPath();
  c.arc(cx, cy, 141, Math.PI * 0.12, Math.PI * 0.36);
  c.stroke();
  c.restore();
  // lip band
  c.beginPath();
  c.arc(cx, cy, 130.5, 0, TAU);
  c.lineWidth = 6;
  c.strokeStyle = lip;
  c.stroke();
  c.save();
  c.lineWidth = 6;
  c.strokeStyle = sh(0.16);
  c.beginPath();
  c.arc(cx, cy, 130.5, Math.PI * 1.7, Math.PI * 2.75);
  c.stroke();
  c.restore();
  // interior: gentle depth, lit far wall (bottom-right), shaded near wall (top-left)
  const inner = ell(cx, cy, 127.5, 127.5);
  c.fillStyle = radial(
    c,
    cx + 28,
    cy + 34,
    190,
    [
      [0, ic[0]],
      [0.45, ic[1]],
      [0.8, ic[2]],
      [1, ic[3]],
    ],
    cx + 10,
    cy + 12
  );
  c.fill(inner);
  c.save();
  c.clip(inner);
  c.strokeStyle = sh(0.3);
  c.lineWidth = 20;
  c.shadowColor = sh(0.3);
  c.shadowBlur = 16;
  c.translate(8, 10);
  c.stroke(inner);
  c.restore();
  // inner wall highlight
  c.save();
  c.strokeStyle = hi(0.5);
  c.shadowColor = hi(0.5);
  c.shadowBlur = 3;
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(cx, cy, 121, Math.PI * 1.1, Math.PI * 1.4);
  c.stroke();
  c.restore();

  const liq = b.liquid ? INGREDIENTS[b.liquid] : null;
  const isSauce = liq?.cat === 'sauce';
  const f = Math.min(1, b.fill);
  c.save();
  c.clip(inner);

  let pl: Path2D | null = null;
  let rad = 0;
  if (liq && !isSauce && f > 0) {
    rad = 64 + 66 * f;
    pl = ell(cx, cy, rad, rad);
    pool(c, pl, liq.color, cx, cy, rad);
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
  if (liq && pl) {
    // submerge the outer strands under the broth, then oil rings and sheen
    c.save();
    c.clip(pl);
    c.fillStyle = radial(c, cx, cy, rad, [
      [0, tint(liq.color, 0, 0)],
      [0.6, tint(liq.color, 0, 0.08 * f)],
      [0.8, tint(liq.color, 0, 0.5 * f)],
      [1, tint(liq.color, -0.12, 0.8 * f)],
    ]);
    c.fill(pl);
    c.restore();
    fatRings(c, rng(hash(b.liquid!)), cx, cy, rad, liq.color);
    c.save();
    c.strokeStyle = hi(0.35);
    c.shadowColor = hi(0.4);
    c.shadowBlur = 6;
    c.lineWidth = 4;
    c.lineCap = 'round';
    c.beginPath();
    c.arc(cx, cy, rad - 11, Math.PI * 1.14, Math.PI * 1.36);
    c.stroke();
    c.restore();
  }
  if (liq && isSauce && f > 0) {
    // glossy satin drizzle ribbons over the noodles
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
      c.globalAlpha = 0.9;
      strand(c, smoothOpen(pts), mixHex(liq.color, '#ffffff', 0.1), 4.2 + r() * 1.2, 0.7, 0.2);
      c.globalAlpha = 1;
    }
    if (b.liquid === 'tatliaci') {
      c.fillStyle = '#8e1e12';
      for (let i = 0; i < 20; i++) {
        c.beginPath();
        c.roundRect(cx - 90 + r() * 180, cy - 90 + r() * 180, 2.8, 2, 0.8);
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
      const x = cx + Math.cos(a) * 140;
      const y = cy + Math.sin(a) * 140;
      const p = ell(x, y, 16 + r() * 10, 8, a + Math.PI / 2);
      paint(c, p, liq.color, x, y, 14, { light: 0.2, dark: 0.25, edge: 0.3 });
      spec(c, x - 4, y - 3, 4, 2, -0.5, 0.5, 1);
    }
    c.restore();
  }
  for (const p of b.pieces) drawPiece(c, p);
}

// ---------- ingredient containers: square gastronorm pans, edge to edge ----------
export const TRAY_W = 200;
export const TRAY_H = 200;
const TRAY_SS = 2;

/** how a topping is heaped in its pan: [piece size (px of 200), piece count] */
const TRAY_LAYOUT: Record<string, [number, number]> = {
  yumurta: [118, 5],
  chashu: [122, 4],
  yesil: [104, 9],
  nori: [112, 4],
  misir: [100, 9],
  mantar: [112, 4],
  aciyag: [112, 5],
  tofu: [106, 5],
  karides: [124, 4],
  naruto: [108, 5],
  bambu: [120, 5],
  susam: [120, 9],
  pakchoi: [124, 4],
  filiz: [118, 9],
  biber: [100, 9],
  kimchi: [118, 4],
  lime: [108, 5],
  citir: [108, 9],
};

/** steel or ceramic square pan filling the canvas; returns the inner well path */
function pan(c: Ctx, ceramic: boolean, accent: string) {
  const W = TRAY_W;
  const outer = rrect(0, 0, W, W, 12);
  const LIP = 9;
  const well = rrect(LIP, LIP, W - LIP * 2, W - LIP * 2, 6);
  if (ceramic) {
    c.fillStyle = linear(c, 0, 0, W, W, [
      [0, '#fbf5ea'],
      [0.5, '#efe5d2'],
      [1, '#c9b899'],
    ]);
    c.fill(outer);
    c.strokeStyle = accent;
    c.lineWidth = 2.5;
    c.stroke(rrect(LIP - 4, LIP - 4, W - LIP * 2 + 8, W - LIP * 2 + 8, 8));
  } else {
    c.fillStyle = linear(c, 0, 0, W, W, [
      [0, '#f2f4f5'],
      [0.35, '#cdd3d7'],
      [0.7, '#aab2b8'],
      [1, '#7f888f'],
    ]);
    c.fill(outer);
    // brushed sheen band on the lip
    c.fillStyle = linear(c, 0, 0, W, W * 0.6, [
      [0.2, 'rgba(255,246,232,0)'],
      [0.3, 'rgba(255,246,232,.35)'],
      [0.36, 'rgba(255,246,232,0)'],
    ]);
    c.fill(outer);
  }
  // well
  const wc = ceramic ? '#d7c7a9' : '#5f686f';
  c.fillStyle = linear(c, LIP, LIP, W - LIP, W - LIP, [
    [0, tint(wc, -0.25)],
    [0.5, wc],
    [1, tint(wc, 0.08)],
  ]);
  c.fill(well);
  // lip edge: light bevel top-left, dark bevel bottom-right
  c.save();
  c.clip(well);
  c.strokeStyle = sh(0.55);
  c.lineWidth = 14;
  c.shadowColor = sh(0.55);
  c.shadowBlur = 14;
  c.translate(5, 7);
  c.stroke(well);
  c.restore();
  c.strokeStyle = ceramic ? 'rgba(120,95,60,.35)' : sh(0.35);
  c.lineWidth = 1.2;
  c.stroke(well);
  c.strokeStyle = hi(0.6);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(LIP - 1, W - LIP + 2);
  c.lineTo(LIP - 1, LIP - 1);
  c.lineTo(W - LIP + 2, LIP - 1);
  c.stroke();
  return well;
}

/** wooden ladle resting diagonally on the pan, cup at lower-left, handle out top-right */
function ladle(c: Ctx, col: string) {
  c.save();
  c.translate(84, 118);
  c.rotate(-Math.PI / 4);
  // shadow of the whole ladle
  const handle = rrect(-9, -150, 18, 150, 9);
  const cup = ell(0, 0, 36, 33);
  drop(c, handle, 0.35, 6, 3, 5);
  drop(c, cup, 0.35, 6, 3, 5);
  // handle: warm wood with grain
  paint(c, handle, '#b57a3c', 0, -75, 80, { light: 0.3, dark: 0.35, edge: 0.3, spread: 2.6 });
  c.save();
  c.clip(handle);
  c.strokeStyle = 'rgba(110,60,20,.35)';
  c.lineWidth = 1.4;
  for (const x of [-4, 1, 5]) {
    c.beginPath();
    c.moveTo(x, -148);
    c.lineTo(x + 1, 0);
    c.stroke();
  }
  c.restore();
  // steel band where handle meets cup
  const band = rrect(-10, -46, 20, 12, 3);
  paint(c, band, '#c9ced3', 0, -40, 14, { light: 0.3, dark: 0.35, edge: 0.3 });
  // cup
  paint(c, cup, '#d8dde1', 0, 0, 36, { light: 0.3, dark: 0.38, edge: 0.35 });
  const inside = ell(0, 2, 28, 25);
  pool(c, inside, col, 0, 2, 28);
  spec(c, -12, -11, 8, 3.6, -0.6, 0.8, 1.2);
  spec(c, -4, -120, 3, 40, 0, 0.25, 2);
  c.restore();
}

const trays = new Map<string, HTMLCanvasElement>();
export function trayImage(id: string, thick: Thick = 'orta'): HTMLCanvasElement {
  const key = id + thick;
  let cv = trays.get(key);
  if (cv) return cv;
  const W = TRAY_W;
  cv = mk(W * TRAY_SS, W * TRAY_SS);
  const c = cv.getContext('2d')!;
  c.scale(TRAY_SS, TRAY_SS);
  const ing = INGREDIENTS[id];
  const r = rng(hash(key));
  const liquid = ing.cat === 'broth' || ing.cat === 'sauce';
  const well = pan(c, liquid, ing.cat === 'sauce' ? '#8a5a3a' : '#3b4a6b');
  const cx = W / 2;
  const cy = W / 2;

  c.save();
  c.clip(well);
  if (liquid) {
    const col = ing.color;
    const p = rrect(11, 11, W - 22, W - 22, 5);
    pool(c, p, col, cx, cy, 92);
    fatRings(c, r, cx, cy, 80, col);
    // surface sheen
    c.save();
    c.strokeStyle = hi(0.4);
    c.shadowColor = hi(0.4);
    c.shadowBlur = 6;
    c.lineWidth = 5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(30, 60);
    c.quadraticCurveTo(34, 34, 62, 28);
    c.stroke();
    c.restore();
    c.restore();
    // ladle sits on the rim, outside the clip so the handle crosses the lip
    ladle(c, col);
  } else if (ing.cat === 'noodle') {
    const spots: [number, number, number][] = [
      [-42, -40, 56],
      [46, -30, 54],
      [-30, 48, 54],
      [40, 50, 50],
    ];
    spots.forEach(([dx, dy, R], i) => {
      c.save();
      c.translate(cx + dx, cy + dy);
      coil(c, id, thick, R, hash(key) + i * 7);
      c.restore();
    });
    c.save();
    c.translate(cx + 2, cy + 4);
    coil(c, id, thick, 60, hash(key) + 99);
    c.restore();
    c.restore();
  } else {
    // large overlapping pieces heaped to the edges; last ones on top in the middle
    const [size, n] = TRAY_LAYOUT[id] ?? [110, 4];
    const grid: [number, number][] = [];
    if (n === 9)
      for (let gy = -1; gy <= 1; gy++)
        for (let gx = -1; gx <= 1; gx++) if (gx || gy) grid.push([gx * 60, gy * 60]);
    if (n === 9) grid.push([0, 0]);
    const spots: [number, number][] =
      n === 9
        ? grid
        : n === 3
          ? [
              [-44, -40],
              [46, 30],
              [-30, 46],
            ]
          : n === 4
            ? [
                [-48, -46],
                [50, -42],
                [-46, 50],
                [48, 48],
              ]
            : [
                [-50, -48],
                [52, -44],
                [-48, 52],
                [50, 50],
                [2, 4],
              ];
    // corners first so the upper pieces overlap the lower ones
    spots.forEach(([dx, dy], i) => {
      c.save();
      c.translate(cx + dx + (r() - 0.5) * 8, cy + dy + (r() - 0.5) * 8);
      c.rotate((r() - 0.5) * 1.2);
      c.shadowColor = sh(0.35);
      c.shadowBlur = 7;
      c.shadowOffsetY = 4;
      const s = i === spots.length - 1 && n !== 4 ? 1.04 : 0.98;
      c.drawImage(sprite(id, i), (-size * s) / 2, (-size * s) / 2, size * s, size * s);
      c.restore();
    });
    if (n === 4) {
      // a fifth piece in the middle, on top, slightly smaller so corners stay readable
      c.save();
      c.translate(cx + 2, cy + 2);
      c.rotate((r() - 0.5) * 1.2);
      c.shadowColor = sh(0.4);
      c.shadowBlur = 8;
      c.shadowOffsetY = 5;
      c.drawImage(sprite(id, 1), -size * 0.46, -size * 0.46, size * 0.92, size * 0.92);
      c.restore();
    }
    c.restore();
  }
  trays.set(key, cv);
  return cv;
}
