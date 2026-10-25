// Realistic-ish food rendering on Canvas 2D: layered gradients, soft shadows,
// specular highlights and grain textures. Everything is procedural and cached.

import { INGREDIENTS } from './data';

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

let noiseC: HTMLCanvasElement | null = null;
function noise() {
  if (noiseC) return noiseC;
  noiseC = mk(256, 256);
  const x = noiseC.getContext('2d')!;
  const d = x.createImageData(256, 256);
  const r = rng(7);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = Math.floor(r() * 255);
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return noiseC;
}
function grain(
  c: Ctx,
  clip: Path2D,
  alpha: number,
  mode: GlobalCompositeOperation = 'overlay',
  scale = 1
) {
  c.save();
  c.clip(clip);
  c.globalAlpha = alpha;
  c.globalCompositeOperation = mode;
  const p = c.createPattern(noise(), 'repeat')!;
  if (scale !== 1) p.setTransform(new DOMMatrix().scale(scale));
  c.fillStyle = p;
  c.fillRect(-500, -500, 1500, 1500);
  c.restore();
}
function gloss(c: Ctx, x: number, y: number, rx: number, ry: number, rot = -0.6, a = 0.55) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.scale(1, ry / rx);
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, rx, 0, TAU);
  c.fill();
  c.restore();
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

// ---------- topping sprites (128x128, centered at 64,64) ----------
const S = 128;
type Draw = (c: Ctx, r: () => number) => void;

const egg: Draw = (c, r) => {
  const w = new Path2D();
  w.ellipse(64, 64, 48, 37, (r() - 0.5) * 0.3, 0, TAU);
  const g = c.createRadialGradient(56, 56, 4, 64, 64, 50);
  g.addColorStop(0, '#fffaf1');
  g.addColorStop(0.72, '#f6e7cc');
  g.addColorStop(0.9, '#d9a467');
  g.addColorStop(1, '#a86a30');
  c.fillStyle = g;
  c.fill(w);
  grain(c, w, 0.12);
  const y = new Path2D();
  y.ellipse(66, 66, 25, 21, 0, 0, TAU);
  const yg = c.createRadialGradient(60, 60, 2, 66, 66, 27);
  yg.addColorStop(0, '#ffcf5a');
  yg.addColorStop(0.45, '#ff9c12');
  yg.addColorStop(0.85, '#e46b00');
  yg.addColorStop(1, '#c95a00');
  c.fillStyle = yg;
  c.fill(y);
  c.strokeStyle = 'rgba(255,214,120,.6)';
  c.lineWidth = 2;
  c.stroke(y);
  gloss(c, 58, 57, 10, 5, -0.5, 0.75);
  gloss(c, 46, 48, 18, 8, -0.6, 0.35);
};

const chashu: Draw = (c, r) => {
  const outer = blob(r, 64, 64, 52, 0.12, 16);
  c.fillStyle = '#4b2312';
  c.fill(outer);
  grain(c, outer, 0.5, 'overlay');
  const inner = blob(r, 64, 64, 45, 0.1, 16);
  const g = c.createRadialGradient(58, 58, 4, 64, 64, 48);
  g.addColorStop(0, '#e9b59c');
  g.addColorStop(0.6, '#d08f70');
  g.addColorStop(1, '#a8603f');
  c.fillStyle = g;
  c.fill(inner);
  c.save();
  c.clip(inner);
  c.strokeStyle = 'rgba(250,228,212,.92)';
  c.lineCap = 'round';
  c.lineWidth = 7;
  c.beginPath();
  for (let a = 0, rr = 4; a < TAU * 2.6; a += 0.15, rr += 0.32) {
    const x = 64 + Math.cos(a) * rr;
    const y = 64 + Math.sin(a) * rr;
    if (a === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.strokeStyle = 'rgba(255,240,230,.35)';
  c.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    const a = r() * TAU;
    const rr = r() * 38;
    c.beginPath();
    c.moveTo(64 + Math.cos(a) * rr, 64 + Math.sin(a) * rr);
    c.lineTo(64 + Math.cos(a + 0.2) * (rr + 6), 64 + Math.sin(a + 0.2) * (rr + 6));
    c.stroke();
  }
  c.restore();
  grain(c, inner, 0.22);
  gloss(c, 50, 48, 22, 9, -0.7, 0.3);
};

function onionRing(c: Ctx, r: () => number, x: number, y: number, R: number, white: boolean) {
  const rot = r() * Math.PI;
  const sq = 0.62 + r() * 0.36; // diagonal cuts look oval
  const wall = R * (white ? 0.4 : 0.27 + r() * 0.06);
  const broken = r() < 0.18;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, sq);
  const ring = new Path2D();
  const a0 = broken ? r() * TAU : 0;
  const a1 = broken ? a0 + TAU * (0.55 + r() * 0.25) : TAU;
  ring.arc(0, 0, R, a0, a1);
  if (broken) ring.arc(0, 0, R - wall, a1, a0, true);
  else {
    ring.moveTo(R - wall, 0);
    ring.arc(0, 0, R - wall, 0, TAU, true);
  }
  ring.closePath();
  // soft drop shadow so the ring sits on the food
  c.save();
  c.shadowColor = 'rgba(20,40,10,.45)';
  c.shadowBlur = 4;
  c.shadowOffsetY = 2;
  const g = c.createRadialGradient(-R * 0.25, -R * 0.3, R * 0.2, 0, 0, R);
  if (white) {
    g.addColorStop(0, '#fbfdf2');
    g.addColorStop(0.7, '#e6f1cf');
    g.addColorStop(1, '#bcd79a');
  } else {
    g.addColorStop(0, '#c9eca6');
    g.addColorStop(0.55, '#7cc455');
    g.addColorStop(1, '#3c8a2a');
  }
  c.fillStyle = g;
  c.fill(ring, 'evenodd');
  c.restore();
  // translucent inner membrane + outer skin line
  c.lineWidth = 1.6;
  c.strokeStyle = white ? 'rgba(150,180,110,.7)' : 'rgba(30,90,25,.75)';
  c.beginPath();
  c.arc(0, 0, R - 0.4, a0, a1);
  c.stroke();
  c.strokeStyle = 'rgba(245,255,230,.85)';
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(0, 0, R - wall + 0.5, a0, a1);
  c.stroke();
  // inner layer line (scallions are layered)
  if (!white) {
    c.strokeStyle = 'rgba(210,245,180,.6)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(0, 0, R - wall * 0.5, a0, a1);
    c.stroke();
  }
  // wet highlight
  c.strokeStyle = 'rgba(255,255,255,.8)';
  c.lineWidth = 2.2;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 0, R - wall * 0.35, Math.PI * 1.1, Math.PI * 1.45);
  c.stroke();
  c.restore();
}

const greenOnion: Draw = (c, r) => {
  const n = 5 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r() * 0.6;
    const d = i === 0 ? 0 : 26 + r() * 12;
    onionRing(c, r, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 15 + r() * 7, r() < 0.15);
  }
};

const nori: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.3);
  const p = new Path2D();
  p.moveTo(-30, -50);
  p.lineTo(30, -52);
  p.lineTo(32, 50);
  p.lineTo(-31, 52);
  p.closePath();
  c.fillStyle = '#13241a';
  c.fill(p);
  grain(c, p, 0.55, 'overlay', 0.5);
  const g = c.createLinearGradient(-30, -50, 30, 50);
  g.addColorStop(0, 'rgba(120,170,130,.18)');
  g.addColorStop(0.5, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(60,110,80,.2)');
  c.fillStyle = g;
  c.fill(p);
  c.strokeStyle = 'rgba(0,0,0,.5)';
  c.lineWidth = 1.5;
  c.stroke(p);
  c.restore();
};

function kernel(c: Ctx, x: number, y: number, rot: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const p = new Path2D();
  p.roundRect(-7, -6, 14, 12, 5);
  const g = c.createRadialGradient(-2, -3, 1, 0, 0, 9);
  g.addColorStop(0, '#fff2a6');
  g.addColorStop(0.5, '#ffd23a');
  g.addColorStop(1, '#d99a00');
  c.fillStyle = g;
  c.fill(p);
  c.fillStyle = 'rgba(255,255,255,.7)';
  c.beginPath();
  c.ellipse(-2.5, -2.5, 2.4, 1.4, -0.5, 0, TAU);
  c.fill();
  c.restore();
}
const corn: Draw = (c, r) => {
  for (let i = 0; i < 16; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r()) * 34;
    kernel(c, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, r() * TAU);
  }
};

const shiitake: Draw = (c, r) => {
  const cap = blob(r, 64, 64, 46, 0.12, 14);
  const g = c.createRadialGradient(56, 54, 4, 64, 64, 50);
  g.addColorStop(0, '#9b6b44');
  g.addColorStop(0.7, '#6a4126');
  g.addColorStop(1, '#3f2414');
  c.fillStyle = g;
  c.fill(cap);
  grain(c, cap, 0.35);
  c.strokeStyle = '#efdcb8';
  c.lineCap = 'round';
  c.lineWidth = 6;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI + r() * 0.2;
    c.beginPath();
    c.moveTo(64 + Math.cos(a) * 26, 64 + Math.sin(a) * 26);
    c.lineTo(64 - Math.cos(a) * 26, 64 - Math.sin(a) * 26);
    c.stroke();
  }
  gloss(c, 50, 46, 20, 9, -0.6, 0.3);
};

const chiliOil: Draw = (c, r) => {
  for (let i = 0; i < 6; i++) {
    const x = 64 + (r() - 0.5) * 60;
    const y = 64 + (r() - 0.5) * 50;
    const rr = 8 + r() * 14;
    const g = c.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 1, x, y, rr);
    g.addColorStop(0, 'rgba(255,140,80,.9)');
    g.addColorStop(0.6, 'rgba(214,46,23,.85)');
    g.addColorStop(1, 'rgba(150,20,8,.6)');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x, y, rr, rr * 0.75, r() * 3, 0, TAU);
    c.fill();
    gloss(c, x - rr * 0.3, y - rr * 0.3, rr * 0.4, rr * 0.2, -0.5, 0.7);
  }
  c.fillStyle = '#5e0b04';
  for (let i = 0; i < 14; i++) c.fillRect(64 + (r() - 0.5) * 70, 64 + (r() - 0.5) * 60, 2.5, 2);
};

const tofu: Draw = (c, r) => {
  for (let i = 0; i < 1; i++) {
    c.save();
    c.translate(64, 64);
    c.rotate((r() - 0.5) * 0.6);
    const p = new Path2D();
    p.roundRect(-30, -30, 60, 60, 9);
    const g = c.createLinearGradient(-30, -30, 30, 30);
    g.addColorStop(0, '#f6cf8a');
    g.addColorStop(0.55, '#d99a45');
    g.addColorStop(1, '#a8661f');
    c.shadowColor = 'rgba(0,0,0,.35)';
    c.shadowBlur = 6;
    c.shadowOffsetY = 3;
    c.fillStyle = g;
    c.fill(p);
    c.shadowColor = 'transparent';
    grain(c, p, 0.6, 'overlay', 0.6);
    const inner = new Path2D();
    inner.roundRect(-20, -20, 38, 38, 6);
    c.fillStyle = 'rgba(255,236,190,.28)';
    c.fill(inner);
    gloss(c, -12, -14, 16, 7, -0.6, 0.35);
    c.restore();
  }
};

const shrimp: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.4);
  // tail
  c.fillStyle = '#e2401f';
  c.beginPath();
  c.moveTo(38, -4);
  c.lineTo(58, -18);
  c.lineTo(54, 2);
  c.lineTo(60, 18);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(255,150,110,.6)';
  c.beginPath();
  c.moveTo(40, 0);
  c.lineTo(54, -10);
  c.lineTo(52, 2);
  c.closePath();
  c.fill();
  // batter body
  const body = new Path2D();
  body.moveTo(-52, 4);
  body.bezierCurveTo(-50, -24, 10, -26, 40, -8);
  body.bezierCurveTo(46, -2, 46, 8, 38, 12);
  body.bezierCurveTo(10, 26, -46, 30, -52, 4);
  c.fillStyle = '#c98536';
  c.fill(body);
  c.save();
  c.clip(body);
  for (let i = 0; i < 46; i++) {
    const x = -52 + r() * 96;
    const y = -22 + r() * 46;
    const rr = 3 + r() * 6;
    const g = c.createRadialGradient(x - 1, y - 1, 0.5, x, y, rr);
    g.addColorStop(0, '#ffe3a0');
    g.addColorStop(1, 'rgba(214,150,60,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, rr, 0, TAU);
    c.fill();
  }
  c.restore();
  grain(c, body, 0.45, 'overlay', 0.6);
  for (let i = 0; i < 16; i++) {
    const t = r();
    c.fillStyle = 'rgba(240,190,100,.9)';
    c.beginPath();
    c.arc(-50 + t * 90, (t < 0.5 ? -16 : 16) + (r() - 0.5) * 10, 2.5 + r() * 3, 0, TAU);
    c.fill();
  }
  gloss(c, -14, -10, 26, 7, -0.15, 0.25);
  c.restore();
};

const naruto: Draw = (c) => {
  const p = new Path2D();
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * TAU;
    const rr = 40 + (i % 2 ? 4 : 0);
    const x = 64 + Math.cos(a) * rr;
    const y = 64 + Math.sin(a) * rr;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  const g = c.createRadialGradient(58, 58, 4, 64, 64, 46);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.8, '#f5efe6');
  g.addColorStop(1, '#ddd3c6');
  c.fillStyle = g;
  c.fill(p);
  grain(c, p, 0.12);
  c.strokeStyle = '#f2569a';
  c.lineWidth = 5.5;
  c.lineCap = 'round';
  c.beginPath();
  for (let a = 0, rr = 2; a < TAU * 2.7; a += 0.12, rr += 0.21) {
    const x = 64 + Math.cos(a) * rr;
    const y = 64 + Math.sin(a) * rr;
    if (a === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  gloss(c, 50, 48, 16, 7, -0.6, 0.4);
};

const bamboo: Draw = (c, r) => {
  for (let i = 0; i < 4; i++) {
    c.save();
    c.translate(36 + i * 18, 64);
    c.rotate((r() - 0.5) * 0.5);
    const p = new Path2D();
    p.roundRect(-7, -40, 14, 80, 5);
    const g = c.createLinearGradient(-7, 0, 7, 0);
    g.addColorStop(0, '#9a6f2e');
    g.addColorStop(0.5, '#d9b06a');
    g.addColorStop(1, '#a8793a');
    c.fillStyle = g;
    c.fill(p);
    c.strokeStyle = 'rgba(110,70,20,.5)';
    c.lineWidth = 1;
    for (let y = -34; y < 36; y += 6 + r() * 6) {
      c.beginPath();
      c.moveTo(-5, y);
      c.lineTo(5, y + 1);
      c.stroke();
    }
    gloss(c, -2, -20, 5, 18, 0, 0.3);
    c.restore();
  }
};

const sesame: Draw = (c, r) => {
  for (let i = 0; i < 30; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r()) * 44;
    const x = 64 + Math.cos(a) * d;
    const y = 64 + Math.sin(a) * d;
    const black = r() < 0.18;
    c.save();
    c.translate(x, y);
    c.rotate(r() * TAU);
    const g = c.createLinearGradient(-4, -2, 4, 2);
    g.addColorStop(0, black ? '#4a403a' : '#fff8e6');
    g.addColorStop(1, black ? '#141010' : '#d8c08f');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(0, 0, 4.4, 2.4, 0, 0, TAU);
    c.fill();
    c.restore();
  }
};

const pakchoi: Draw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.6);
  const leaf = new Path2D();
  leaf.moveTo(0, 54);
  leaf.bezierCurveTo(-44, 30, -46, -40, 0, -56);
  leaf.bezierCurveTo(46, -40, 44, 30, 0, 54);
  const lg = c.createRadialGradient(-8, -20, 4, 0, -6, 60);
  lg.addColorStop(0, '#5fb04a');
  lg.addColorStop(1, '#1f5a1d');
  c.fillStyle = lg;
  c.fill(leaf);
  grain(c, leaf, 0.25);
  c.strokeStyle = 'rgba(190,230,160,.5)';
  c.lineWidth = 1.5;
  for (let i = -3; i <= 3; i++) {
    c.beginPath();
    c.moveTo(0, 10 + i * 10);
    c.quadraticCurveTo(i * 8, i * 10 - 6, i * 14, i * 10 - 18);
    c.stroke();
  }
  const stem = new Path2D();
  stem.moveTo(-10, 58);
  stem.bezierCurveTo(-18, 20, -10, -20, 0, -36);
  stem.bezierCurveTo(10, -20, 18, 20, 10, 58);
  stem.closePath();
  const sg = c.createLinearGradient(-14, 0, 14, 0);
  sg.addColorStop(0, '#c9e3b0');
  sg.addColorStop(0.5, '#f4fbe9');
  sg.addColorStop(1, '#b7d89a');
  c.fillStyle = sg;
  c.fill(stem);
  gloss(c, -14, -18, 18, 8, -1, 0.35);
  c.restore();
};

const sprouts: Draw = (c, r) => {
  for (let i = 0; i < 9; i++) {
    const x0 = 20 + r() * 88;
    const y0 = 20 + r() * 88;
    const a = r() * TAU;
    const len = 34 + r() * 22;
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len;
    const mx = (x0 + x1) / 2 + (r() - 0.5) * 24;
    const my = (y0 + y1) / 2 + (r() - 0.5) * 24;
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(160,150,110,.55)';
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(x0, y0);
    c.quadraticCurveTo(mx, my, x1, y1);
    c.stroke();
    c.strokeStyle = 'rgba(250,248,236,.95)';
    c.lineWidth = 4;
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.8)';
    c.lineWidth = 1.4;
    c.stroke();
    const g = c.createRadialGradient(x1 - 1, y1 - 1, 0.5, x1, y1, 5);
    g.addColorStop(0, '#fff3a0');
    g.addColorStop(1, '#c9b23a');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(x1, y1, 5, 3.6, a, 0, TAU);
    c.fill();
  }
};

const chili: Draw = (c, r) => {
  for (let i = 0; i < 6; i++) {
    const x = 64 + (r() - 0.5) * 64;
    const y = 64 + (r() - 0.5) * 64;
    const rr = 9 + r() * 4;
    c.save();
    c.translate(x, y);
    c.scale(1, 0.85);
    c.beginPath();
    c.arc(0, 0, rr, 0, TAU);
    c.lineWidth = 3.4;
    const g = c.createLinearGradient(-rr, -rr, rr, rr);
    g.addColorStop(0, '#ff4d3a');
    g.addColorStop(1, '#8e0e0e');
    c.strokeStyle = g;
    c.stroke();
    c.fillStyle = 'rgba(255,220,180,.35)';
    c.fill();
    c.fillStyle = '#f2d98a';
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.ellipse((r() - 0.5) * rr, (r() - 0.5) * rr, 1.8, 1.1, r() * 3, 0, TAU);
      c.fill();
    }
    c.restore();
  }
};

const kimchi: Draw = (c, r) => {
  for (let i = 0; i < 3; i++) {
    const x = 44 + r() * 40;
    const y = 44 + r() * 40;
    const p = blob(r, x, y, 18 + r() * 10, 0.5, 9);
    const g = c.createRadialGradient(x - 6, y - 6, 2, x, y, 30);
    g.addColorStop(0, '#ff9a5c');
    g.addColorStop(0.6, '#e2502a');
    g.addColorStop(1, '#a82c12');
    c.fillStyle = g;
    c.fill(p);
    c.save();
    c.clip(p);
    c.strokeStyle = 'rgba(255,215,170,.55)';
    c.lineWidth = 2.5;
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(x - 20, y - 10 + k * 8);
      c.quadraticCurveTo(x, y - 16 + k * 8, x + 20, y - 8 + k * 8);
      c.stroke();
    }
    c.restore();
    c.fillStyle = '#7a1606';
    for (let k = 0; k < 6; k++) c.fillRect(x + (r() - 0.5) * 30, y + (r() - 0.5) * 24, 2, 2);
    gloss(c, x - 6, y - 6, 10, 4, -0.6, 0.55);
  }
};

const lime: Draw = (c, r) => {
  c.save();
  c.translate(64, 70);
  c.rotate((r() - 0.5) * 0.8);
  const rind = new Path2D();
  rind.arc(0, 0, 44, Math.PI, TAU);
  rind.closePath();
  c.fillStyle = '#3f7d1f';
  c.fill(rind);
  const pulp = new Path2D();
  pulp.arc(0, -1, 38, Math.PI, TAU);
  pulp.closePath();
  const g = c.createRadialGradient(0, -6, 2, 0, -6, 40);
  g.addColorStop(0, '#f2ffcf');
  g.addColorStop(1, '#a9d65a');
  c.fillStyle = g;
  c.fill(pulp);
  c.strokeStyle = 'rgba(255,255,235,.9)';
  c.lineWidth = 2;
  for (let i = 1; i < 6; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    c.beginPath();
    c.moveTo(0, -1);
    c.lineTo(Math.cos(a) * 37, Math.sin(a) * 37 - 1);
    c.stroke();
  }
  grain(c, pulp, 0.18);
  gloss(c, -14, -20, 16, 7, -0.4, 0.45);
  c.restore();
};

const shallot: Draw = (c, r) => {
  c.lineCap = 'round';
  for (let i = 0; i < 18; i++) {
    const x = 64 + (r() - 0.5) * 80;
    const y = 64 + (r() - 0.5) * 80;
    const a = r() * TAU;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.strokeStyle = r() < 0.5 ? '#9a5418' : '#c98a3c';
    c.lineWidth = 3.2;
    c.beginPath();
    c.arc(0, 0, 6 + r() * 4, 0, Math.PI * (0.8 + r() * 0.6));
    c.stroke();
    c.strokeStyle = 'rgba(255,220,150,.6)';
    c.lineWidth = 1;
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
  cv = mk(S, S);
  const c = cv.getContext('2d')!;
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
  c.shadowColor = 'rgba(30,12,0,.45)';
  c.shadowBlur = 5;
  c.shadowOffsetX = 1.5;
  c.shadowOffsetY = 2.5;
  c.drawImage(img, -size / 2, -size / 2, size, size);
  c.restore();
}

// ---------- noodles ----------
const NOODLE_COL: Record<string, string> = {
  ramen: '#efcf7e',
  udon: '#f3e8cf',
  soba: '#9a7c5e',
  pirinc: '#f6f1e6',
};

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
  let col = NOODLE_COL[noodle] ?? '#efcf7e';
  if (sauce) col = mixHex(col, INGREDIENTS[sauce].color, 0.42);
  let w = THICK_W[thick];
  if (cook === 'raw') col = mixHex(col, '#ffffff', 0.25);
  if (cook === 'soft') w *= 1.12;
  if (cook === 'burnt') {
    col = mixHex(col, '#b9a88a', 0.4);
    w *= 1.35;
  }
  const radius = dry ? 108 : 86;
  const count = Math.round(
    (dry ? 1.35 : 1) * (thick === 'ince' ? 150 : thick === 'orta' ? 100 : 56)
  );
  const curl = cook === 'raw' ? 0.18 : 0.42;
  const strands: [number, number][][] = [];
  for (let i = 0; i < count; i++) {
    let a = r() * TAU;
    const d = Math.sqrt(r()) * radius * 0.85;
    let x = 150 + Math.cos(a) * d;
    let y = 150 + Math.sin(a) * d;
    let dir = r() * TAU;
    const pts: [number, number][] = [[x, y]];
    const segs = 9 + Math.floor(r() * 6);
    for (let k = 0; k < segs; k++) {
      dir += (r() - 0.5) * curl * 2;
      x += Math.cos(dir) * 12;
      y += Math.sin(dir) * 12;
      const dd = Math.hypot(x - 150, y - 150);
      if (dd > radius) {
        a = Math.atan2(y - 150, x - 150);
        dir = a + Math.PI + (r() - 0.5);
        x = 150 + Math.cos(a) * radius;
        y = 150 + Math.sin(a) * radius;
      }
      pts.push([x, y]);
    }
    strands.push(pts);
  }
  const path = (pts: [number, number][], ox = 0, oy = 0) => {
    c.beginPath();
    c.moveTo(pts[0][0] + ox, pts[0][1] + oy);
    for (let k = 1; k < pts.length - 1; k++) {
      const mx = (pts[k][0] + pts[k + 1][0]) / 2;
      const my = (pts[k][1] + pts[k + 1][1]) / 2;
      c.quadraticCurveTo(pts[k][0] + ox, pts[k][1] + oy, mx + ox, my + oy);
    }
  };
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (const s of strands) {
    path(s, 0.8, 1.6);
    c.strokeStyle = 'rgba(40,20,0,.28)';
    c.lineWidth = w + 1.8;
    c.stroke();
    path(s);
    c.strokeStyle = tint(col, -0.18);
    c.lineWidth = w;
    c.stroke();
    path(s);
    c.strokeStyle = col;
    c.lineWidth = w * 0.7;
    c.stroke();
    path(s, -w * 0.18, -w * 0.22);
    c.strokeStyle = sauce ? 'rgba(255,240,210,.55)' : 'rgba(255,252,240,.6)';
    c.lineWidth = Math.max(0.7, w * 0.26);
    c.stroke();
  }
  if (noodle === 'pirinc') {
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = 'rgba(255,255,255,.15)';
    c.fillRect(0, 0, 300, 300);
    c.globalCompositeOperation = 'source-over';
  }
  nests.set(key, cv);
  return cv;
}

function mixHex(a: string, b: string, t: number) {
  const A = hex2rgb(a);
  const B = hex2rgb(b);
  const m = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return '#' + m.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ---------- bowl ----------
export const BOWL_R = 122;

export function drawBowl(c: Ctx, b: BowlDraw) {
  const cx = 150;
  const cy = 150;
  c.clearRect(0, 0, 300, 300);
  // drop shadow
  c.save();
  c.shadowColor = 'rgba(0,0,0,.45)';
  c.shadowBlur = 22;
  c.shadowOffsetY = 10;
  c.beginPath();
  c.arc(cx, cy, 146, 0, TAU);
  c.fillStyle = b.takeaway ? '#cdb48a' : '#7a1c12';
  c.fill();
  c.restore();
  // rim (outer glaze)
  const rim = new Path2D();
  rim.arc(cx, cy, 146, 0, TAU);
  const rg = c.createRadialGradient(cx - 50, cy - 60, 20, cx, cy, 150);
  if (b.takeaway) {
    rg.addColorStop(0, '#efe2c8');
    rg.addColorStop(1, '#b8996a');
  } else {
    rg.addColorStop(0, '#e2553d');
    rg.addColorStop(0.7, '#a8301f');
    rg.addColorStop(1, '#6e1a10');
  }
  c.fillStyle = rg;
  c.fill(rim);
  grain(c, rim, b.takeaway ? 0.35 : 0.12);
  // lip ring
  c.beginPath();
  c.arc(cx, cy, 136, 0, TAU);
  c.lineWidth = 8;
  c.strokeStyle = b.takeaway ? '#f6ecd8' : '#f4ebdd';
  c.stroke();
  if (!b.takeaway) {
    c.strokeStyle = 'rgba(30,40,70,.55)';
    c.lineWidth = 1.4;
    c.setLineDash([6, 5]);
    c.beginPath();
    c.arc(cx, cy, 142, 0, TAU);
    c.stroke();
    c.setLineDash([]);
  }
  // interior with depth
  const inner = new Path2D();
  inner.arc(cx, cy, 132, 0, TAU);
  const ig = c.createRadialGradient(cx + 10, cy + 14, 10, cx, cy, 134);
  ig.addColorStop(0, '#fbf7f0');
  ig.addColorStop(0.75, '#e9e0d2');
  ig.addColorStop(0.93, '#c6b9a6');
  ig.addColorStop(1, '#a39380');
  c.fillStyle = ig;
  c.fill(inner);
  gloss(c, cx - 70, cy - 78, 40, 14, -0.7, 0.55);

  const liq = b.liquid ? INGREDIENTS[b.liquid] : null;
  const isSauce = liq?.cat === 'sauce';
  const f = Math.min(1, b.fill);
  c.save();
  c.clip(inner);

  if (liq && !isSauce && f > 0) {
    // broth pool
    const rad = 64 + 66 * f;
    const bg = c.createRadialGradient(cx - 30, cy - 34, 10, cx, cy, rad);
    const op = b.liquid === 'shoyu' || b.liquid === 'tavuk' ? 0.88 : 0.97;
    bg.addColorStop(0, tint(liq.color, 0.28, op));
    bg.addColorStop(0.7, tint(liq.color, 0, op));
    bg.addColorStop(1, tint(liq.color, -0.3, op));
    c.fillStyle = bg;
    c.beginPath();
    c.arc(cx, cy, rad, 0, TAU);
    c.fill();
    c.strokeStyle = tint(liq.color, -0.35, 0.6);
    c.lineWidth = 2.5;
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
    // submerge noodle edges in broth + fat droplets + sheen
    const rad = 64 + 66 * f;
    const og = c.createRadialGradient(cx, cy, rad * 0.35, cx, cy, rad);
    og.addColorStop(0, tint(liq.color, 0, 0));
    og.addColorStop(0.75, tint(liq.color, 0, 0.42 * f));
    og.addColorStop(1, tint(liq.color, -0.1, 0.8 * f));
    c.fillStyle = og;
    c.beginPath();
    c.arc(cx, cy, rad, 0, TAU);
    c.fill();
    const r = rng(hash(b.liquid!));
    for (let i = 0; i < 46; i++) {
      const a = r() * TAU;
      const d = rad * (0.55 + r() * 0.42);
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      const rr = 1 + r() * 4.5;
      c.fillStyle = b.liquid === 'acili' ? 'rgba(255,120,60,.55)' : 'rgba(255,226,150,.42)';
      c.beginPath();
      c.arc(x, y, rr, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.55)';
      c.beginPath();
      c.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.35, 0, TAU);
      c.fill();
    }
    gloss(c, cx - 40, cy - 46, 46, 16, -0.6, 0.22);
  }
  if (liq && isSauce && f > 0) {
    // glossy sauce drizzle over the noodles
    const r = rng(hash(b.liquid! + 'z'));
    c.lineCap = 'round';
    const lines = Math.round(6 + f * 10);
    for (let i = 0; i < lines; i++) {
      let x = cx + (r() - 0.5) * 150;
      let y = cy + (r() - 0.5) * 150;
      let dir = r() * TAU;
      c.beginPath();
      c.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        dir += (r() - 0.5) * 1.6;
        const nx = x + Math.cos(dir) * 14;
        const ny = y + Math.sin(dir) * 14;
        c.quadraticCurveTo(x + Math.cos(dir + 0.8) * 8, y + Math.sin(dir + 0.8) * 8, nx, ny);
        x = nx;
        y = ny;
      }
      c.strokeStyle = tint(liq.color, 0.05, 0.55);
      c.lineWidth = 1.8 + r() * 1.4;
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.4)';
      c.lineWidth = 0.9;
      c.stroke();
    }
    gloss(c, cx - 36, cy - 40, 50, 18, -0.6, 0.18);
    c.fillStyle = tint(liq.color, -0.2, 0.55 * f);
    for (let i = 0; i < 8; i++) {
      const a = r() * TAU;
      c.beginPath();
      c.ellipse(cx + Math.cos(a) * 112, cy + Math.sin(a) * 112, 14, 6, a + Math.PI / 2, 0, TAU);
      c.fill();
    }
    if (b.liquid === 'tatliaci') {
      c.fillStyle = '#8e0e0e';
      for (let i = 0; i < 30; i++) c.fillRect(cx - 90 + r() * 180, cy - 90 + r() * 180, 2.2, 1.6);
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
const trays = new Map<string, HTMLCanvasElement>();
export function trayImage(id: string, thick: Thick = 'orta'): HTMLCanvasElement {
  const key = id + thick;
  let cv = trays.get(key);
  if (cv) return cv;
  const W = 240;
  const H = 170;
  cv = mk(W, H);
  const c = cv.getContext('2d')!;
  const ing = INGREDIENTS[id];
  const r = rng(hash(key));
  if (ing.cat === 'broth' || ing.cat === 'sauce') {
    // pot (broth) or ramekin (sauce), seen from above
    const big = ing.cat === 'broth';
    const R = big ? 74 : 62;
    c.save();
    c.shadowColor = 'rgba(0,0,0,.5)';
    c.shadowBlur = 12;
    c.shadowOffsetY = 6;
    c.beginPath();
    c.arc(W / 2, H / 2, R, 0, TAU);
    c.fillStyle = big ? '#7f8894' : '#efe6d6';
    c.fill();
    c.restore();
    const og = c.createLinearGradient(0, H / 2 - R, 0, H / 2 + R);
    og.addColorStop(0, big ? '#dfe5ec' : '#fffaf2');
    og.addColorStop(1, big ? '#6c7581' : '#c9bca6');
    c.beginPath();
    c.arc(W / 2, H / 2, R, 0, TAU);
    c.fillStyle = og;
    c.fill();
    const lg = c.createRadialGradient(W / 2 - 20, H / 2 - 22, 4, W / 2, H / 2, R - 8);
    lg.addColorStop(0, tint(ing.color, 0.3));
    lg.addColorStop(0.7, ing.color);
    lg.addColorStop(1, tint(ing.color, -0.35));
    c.beginPath();
    c.arc(W / 2, H / 2, R - 9, 0, TAU);
    c.fillStyle = lg;
    c.fill();
    if (big)
      for (let i = 0; i < 22; i++) {
        const a = r() * TAU;
        const d = Math.sqrt(r()) * (R - 16);
        c.fillStyle = 'rgba(255,230,160,.4)';
        c.beginPath();
        c.arc(W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, 1 + r() * 3, 0, TAU);
        c.fill();
      }
    gloss(c, W / 2 - 22, H / 2 - 24, 26, 10, -0.6, 0.45);
    // ladle / spoon handle
    c.save();
    c.translate(W / 2 + 18, H / 2 + 6);
    c.rotate(-0.7);
    c.fillStyle = big ? '#c9ced6' : '#e8dcc6';
    c.beginPath();
    c.ellipse(0, 0, big ? 20 : 14, big ? 16 : 11, 0, 0, TAU);
    c.fill();
    c.fillStyle = tint(ing.color, -0.1);
    c.beginPath();
    c.ellipse(0, 0, big ? 15 : 10, big ? 11 : 7, 0, 0, TAU);
    c.fill();
    c.fillStyle = big ? '#aab1bb' : '#d5c4a6';
    c.fillRect(-4, 10, 8, 70);
    c.restore();
    trays.set(key, cv);
    return cv;
  }
  // steel hotel pan
  const pan = new Path2D();
  pan.roundRect(8, 8, W - 16, H - 16, 18);
  c.save();
  c.shadowColor = 'rgba(0,0,0,.55)';
  c.shadowBlur = 10;
  c.shadowOffsetY = 5;
  c.fillStyle = '#8b949f';
  c.fill(pan);
  c.restore();
  const pg = c.createLinearGradient(0, 8, 0, H - 8);
  pg.addColorStop(0, '#eef2f6');
  pg.addColorStop(0.5, '#aab3be');
  pg.addColorStop(1, '#7d8692');
  c.fillStyle = pg;
  c.fill(pan);
  const well = new Path2D();
  well.roundRect(20, 20, W - 40, H - 40, 12);
  const wg = c.createLinearGradient(0, 20, 0, H - 20);
  wg.addColorStop(0, '#59616c');
  wg.addColorStop(0.25, '#8d96a2');
  wg.addColorStop(1, '#b8c0ca');
  c.fillStyle = wg;
  c.fill(well);
  c.save();
  c.clip(well);
  if (ing.cat === 'noodle') {
    const img = nest(id, thick, 'raw', true);
    for (let i = 0; i < 3; i++) c.drawImage(img, 6 + i * 62, 4 + (i % 2) * 14, 110, 110);
  } else {
    const size = (PIECE_SIZE[id] ?? 60) * 0.85;
    const n = Math.min(70, Math.round(((W - 40) * (H - 40) * 2.2) / (size * size)));
    for (let i = 0; i < n; i++) {
      const x = 32 + r() * (W - 64);
      const y = 32 + r() * (H - 64);
      c.save();
      c.translate(x, y);
      c.rotate(r() * TAU);
      c.shadowColor = 'rgba(0,0,0,.4)';
      c.shadowBlur = 5;
      c.shadowOffsetY = 2;
      c.drawImage(sprite(id, i), -size / 2, -size / 2, size, size);
      c.restore();
    }
  }
  c.restore();
  c.strokeStyle = 'rgba(255,255,255,.7)';
  c.lineWidth = 2;
  c.stroke(well);
  trays.set(key, cv);
  return cv;
}
