import { TOPPINGS } from './toppings';
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
  style?: string;
}

// ---------- Japanese bowl styles ----------
export interface BowlStyle {
  id: string;
  name: string;
  rim: [string, string, string]; // light, mid, dark glaze
  lip: string;
  inner: [string, string, string];
  pattern: 'dash' | 'wave' | 'sakura' | 'gold' | 'speckle' | 'none' | 'ring';
  body: string; // css gradient for the side view
}

export const BOWLS: BowlStyle[] = [
  {
    id: 'kirmizi',
    name: 'Kırmızı lake',
    rim: ['#e2553d', '#a8301f', '#6e1a10'],
    lip: '#f4ebdd',
    inner: ['#fbf7f0', '#e9e0d2', '#a39380'],
    pattern: 'dash',
    body: 'linear-gradient(90deg,#5e150c,#b8341f 30%,#d9452b 45%,#a52c1b 70%,#4e110a)',
  },
  {
    id: 'dalga',
    name: 'Mavi dalga',
    rim: ['#f4f6fa', '#d8e0ec', '#9fb0c8'],
    lip: '#1f3c88',
    inner: ['#ffffff', '#eef2f8', '#aab6c8'],
    pattern: 'wave',
    body: 'radial-gradient(18px 10px at 20px 100%, transparent 60%, #1f3c88 62% 72%, transparent 74%) 0 0/40px 20px, linear-gradient(90deg,#9fb0c8,#f4f6fa 40%,#ffffff 50%,#d8e0ec 70%,#8796ad)',
  },
  {
    id: 'siyah',
    name: 'Siyah & altın',
    rim: ['#3a3a40', '#1a1a1e', '#050507'],
    lip: '#d4a017',
    inner: ['#c0392b', '#9e2a1c', '#5e150c'],
    pattern: 'gold',
    body: 'linear-gradient(90deg,#050507,#2a2a30 30%,#4a4a52 45%,#1a1a1e 70%,#050507)',
  },
  {
    id: 'seladon',
    name: 'Seladon yeşili',
    rim: ['#cfe3cf', '#9cc2a5', '#5f8f6c'],
    lip: '#e6f0e2',
    inner: ['#eef6ec', '#d4e6d2', '#93b39a'],
    pattern: 'ring',
    body: 'linear-gradient(90deg,#4f7a5b,#9cc2a5 30%,#cfe3cf 45%,#8fb898 70%,#3f6a4c)',
  },
  {
    id: 'sakura',
    name: 'Sakura',
    rim: ['#fde4ea', '#f6c1cf', '#d98aa0'],
    lip: '#ffffff',
    inner: ['#fffafa', '#fbecef', '#d9b5bf'],
    pattern: 'sakura',
    body: 'radial-gradient(circle at 30% 40%, #e2557a 0 3px, transparent 4px) 0 0/34px 30px, linear-gradient(90deg,#d98aa0,#f6c1cf 30%,#fde4ea 45%,#f2b3c3 70%,#c97a90)',
  },
  {
    id: 'tenmoku',
    name: 'Tenmoku',
    rim: ['#8a5a32', '#4e2c16', '#24130a'],
    lip: '#c98a4a',
    inner: ['#5a3a22', '#3a2414', '#1a0f08'],
    pattern: 'speckle',
    body: 'linear-gradient(180deg,#c98a4a 0 8%,transparent 14%), linear-gradient(90deg,#1a0f08,#4e2c16 30%,#8a5a32 45%,#3a2414 70%,#140a05)',
  },
  {
    id: 'beyaz',
    name: 'Sade beyaz',
    rim: ['#ffffff', '#efe9df', '#c9bfae'],
    lip: '#c0392b',
    inner: ['#ffffff', '#f3eee6', '#bdb2a2'],
    pattern: 'none',
    body: 'linear-gradient(90deg,#b9ae9c,#efe9df 30%,#ffffff 45%,#e6dfd3 70%,#a99d8a)',
  },
];

export const bowlStyle = (id?: string) => BOWLS.find((b) => b.id === id) ?? BOWLS[0];

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

// ---------- topping sprites: see toppings.ts (256px, 128-unit design space) ----------
const S = 256;
const sprites = new Map<string, HTMLCanvasElement>();
export function sprite(id: string, variant = 0): HTMLCanvasElement {
  const key = id + ':' + (variant % 4);
  let cv = sprites.get(key);
  if (cv) return cv;
  const raw = mk(S, S);
  const rc = raw.getContext('2d')!;
  rc.scale(S / 128, S / 128);
  (TOPPINGS[id] ?? TOPPINGS.yumurta)(rc, rng(hash(key)));
  // bake a soft contact shadow into the sprite so hundreds of pieces stay cheap to draw
  cv = mk(S, S);
  const c = cv.getContext('2d')!;
  c.shadowColor = 'rgba(30,12,0,.42)';
  c.shadowBlur = 9;
  c.shadowOffsetX = 3;
  c.shadowOffsetY = 5;
  c.drawImage(raw, S * 0.06, S * 0.06, S * 0.88, S * 0.88);
  sprites.set(key, cv);
  return cv;
}

export const PIECE_SIZE: Record<string, number> = {
  yumurta: 80,
  chashu: 86,
  yesil: 76,
  nori: 76,
  misir: 62,
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

// ---------- plating: how a topping settles in the bowl ----------
// Big toppings sit around the rim like a real ramen bowl, turned to face the centre and
// fanned against each other; small sprinkles land where they are dropped, on top.
const BIG = new Set([
  'chashu',
  'yumurta',
  'naruto',
  'nori',
  'pakchoi',
  'karides',
  'tofu',
  'bambu',
  'mantar',
  'lime',
  'kimchi',
]);
export const isBigTopping = (id: string) => BIG.has(id);

export function platePiece(
  id: string,
  x: number,
  y: number,
  pieces: PieceLike[],
  k: number,
  rand: () => number = Math.random
): PieceLike {
  const cx = 150;
  const cy = 150;
  const max = BOWL_R - 20;
  let dx = x - cx;
  let dy = y - cy;
  let d = Math.hypot(dx, dy);
  if (d < 1) {
    const a = rand() * TAU;
    dx = Math.cos(a);
    dy = Math.sin(a);
    d = 1;
  }
  let a = Math.atan2(dy, dx);
  if (!BIG.has(id)) {
    const dd = Math.min(d, max);
    return {
      id,
      x: cx + Math.cos(a) * dd,
      y: cy + Math.sin(a) * dd,
      r: rand() * 360,
      s: 0.84 + rand() * 0.14,
      k,
    };
  }
  const size = PIECE_SIZE[id] ?? 60;
  const s = 0.9 + rand() * 0.08;
  // the ring where toppings rest: inside the rim, leaving the middle for the noodles
  const inner = id === 'nori' ? max * 0.86 : max * 0.5;
  const outer = id === 'nori' ? max * 0.92 : max - size * 0.32;
  d = Math.max(inner, Math.min(outer, d));
  // fan against the closest piece of the same kind
  let best: PieceLike | null = null;
  let bestD = size * 0.9;
  for (const p of pieces) {
    if (p.id !== id) continue;
    const q = Math.hypot(p.x - (cx + Math.cos(a) * d), p.y - (cy + Math.sin(a) * d));
    if (q < bestD) {
      bestD = q;
      best = p;
    }
  }
  if (best) {
    const pa = Math.atan2(best.y - cy, best.x - cx);
    const pd = Math.hypot(best.x - cx, best.y - cy);
    let diff = a - pa;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    const step = (size * s * 0.52) / Math.max(30, pd);
    a = pa + (diff >= 0 ? step : -step);
    d = pd;
  }
  const facing = (a * 180) / Math.PI + 90; // turned to face the centre
  return {
    id,
    x: cx + Math.cos(a) * d,
    y: cy + Math.sin(a) * d,
    r: facing + (rand() - 0.5) * 14,
    s,
    k,
  };
}

export function drawPiece(c: Ctx, p: PieceLike) {
  const img = sprite(p.id, p.k);
  const size = (PIECE_SIZE[p.id] ?? 60) * p.s;
  c.save();
  c.translate(p.x, p.y);
  c.rotate((p.r * Math.PI) / 180);
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
  // Neat, folded bundles of parallel strands (the classic illustrated ramen look).
  const radius = dry ? 112 : 92;
  const crinkle =
    noodle === 'ramen' ? 1 : noodle === 'soba' ? 0.25 : noodle === 'pirinc' ? 0.15 : 0.35;
  const spacing = w * 1.18;
  // each bundle is a set of parallel arcs: noodles folded into a neat swirl
  const bundles = dry
    ? [
        { cx: -18, cy: -10, rr: 62, a0: 2.6, span: 3.6 },
        { cx: 20, cy: 14, rr: 58, a0: -0.6, span: 3.4 },
        { cx: 0, cy: 0, rr: 30, a0: 0.8, span: 4.2 },
        { cx: -6, cy: 26, rr: 74, a0: 3.6, span: 2.2 },
        { cx: 4, cy: -4, rr: 14, a0: 3.2, span: 6 },
      ]
    : [
        { cx: -14, cy: -8, rr: 54, a0: 2.4, span: 3.4 },
        { cx: 16, cy: 12, rr: 52, a0: -0.8, span: 3.3 },
        { cx: 6, cy: -6, rr: 30, a0: 3.6, span: 3.4 },
        { cx: -4, cy: 6, rr: 22, a0: 0.4, span: 3.6 },
        { cx: 0, cy: 0, rr: 8, a0: 0, span: 6.2 },
      ];
  const perBundle = Math.round(
    (thick === 'ince' ? 15 : thick === 'orta' ? 10 : 6) * (cook === 'burnt' ? 1.2 : 1)
  );
  c.save();
  c.beginPath();
  c.arc(150, 150, radius, 0, TAU);
  c.clip();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const amp = (cook === 'raw' ? 1.2 : 2.1) * crinkle + (noodle === 'udon' ? 0.6 : 0);
  for (const bd of bundles) {
    const ox = 150 + bd.cx;
    const oy = 150 + bd.cy;
    // soft contact shadow under the bundle
    c.save();
    c.globalAlpha = 0.2;
    c.strokeStyle = '#3a2208';
    c.lineWidth = perBundle * spacing + 8;
    c.beginPath();
    c.arc(ox + 2, oy + 4, bd.rr, bd.a0, bd.a0 + bd.span);
    c.stroke();
    c.restore();
    for (let k = 0; k < perBundle; k++) {
      const lane = (k - (perBundle - 1) / 2) * spacing;
      const R0 = Math.max(4, bd.rr + lane);
      const ph = r() * TAU;
      const freq = (noodle === 'ramen' ? 22 : 8) + r() * 3;
      const a0 = bd.a0 + (r() - 0.5) * 0.25;
      const a1 = bd.a0 + bd.span + (r() - 0.5) * 0.35;
      const pts: [number, number][] = [];
      for (let a = a0; a <= a1; a += 0.03) {
        const rr = R0 + Math.sin(a * freq + ph) * amp;
        pts.push([ox + Math.cos(a) * rr, oy + Math.sin(a) * rr]);
      }
      const stroke = (width: number, style: string, dx = 0, dy = 0) => {
        c.beginPath();
        c.moveTo(pts[0][0] + dx, pts[0][1] + dy);
        for (let q = 1; q < pts.length; q++) c.lineTo(pts[q][0] + dx, pts[q][1] + dy);
        c.strokeStyle = style;
        c.lineWidth = width;
        c.stroke();
      };
      stroke(w + 1.2, tint(col, -0.26));
      stroke(w, col);
      stroke(
        Math.max(0.6, w * 0.32),
        sauce ? 'rgba(255,236,200,.55)' : 'rgba(255,253,244,.72)',
        -w * 0.16,
        -w * 0.2
      );
    }
  }
  c.restore();
  if (noodle === 'pirinc') {
    c.globalCompositeOperation = 'source-atop';
    c.fillStyle = 'rgba(255,255,255,.18)';
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

function rimPattern(c: Ctx, st: BowlStyle) {
  const cx = 150;
  const cy = 150;
  c.save();
  if (st.pattern === 'dash') {
    c.strokeStyle = 'rgba(30,40,70,.55)';
    c.lineWidth = 1.4;
    c.setLineDash([6, 5]);
    c.beginPath();
    c.arc(cx, cy, 142, 0, TAU);
    c.stroke();
  } else if (st.pattern === 'wave') {
    c.strokeStyle = '#1f3c88';
    c.lineWidth = 1.6;
    for (let i = 0; i < 44; i++) {
      const a = (i / 44) * TAU;
      const x = cx + Math.cos(a) * 141;
      const y = cy + Math.sin(a) * 141;
      for (const r of [5.5, 3.2]) {
        c.beginPath();
        c.arc(x, y, r, a + Math.PI * 0.05, a + Math.PI * 0.95);
        c.stroke();
      }
    }
  } else if (st.pattern === 'gold') {
    c.strokeStyle = '#d4a017';
    c.lineWidth = 2;
    for (const r of [140, 144]) {
      c.beginPath();
      c.arc(cx, cy, r, 0, TAU);
      c.stroke();
    }
    c.fillStyle = '#e9c46a';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      c.beginPath();
      c.arc(cx + Math.cos(a) * 142, cy + Math.sin(a) * 142, 2.2, 0, TAU);
      c.fill();
    }
  } else if (st.pattern === 'sakura') {
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      const x = cx + Math.cos(a) * 141;
      const y = cy + Math.sin(a) * 141;
      for (let k = 0; k < 5; k++) {
        const pa = (k / 5) * TAU + a;
        c.fillStyle = '#e2557a';
        c.beginPath();
        c.ellipse(x + Math.cos(pa) * 2.6, y + Math.sin(pa) * 2.6, 2.4, 1.4, pa, 0, TAU);
        c.fill();
      }
    }
  } else if (st.pattern === 'speckle') {
    const r = rng(42);
    for (let i = 0; i < 140; i++) {
      const a = r() * TAU;
      const d = 137 + r() * 9;
      c.fillStyle = r() < 0.5 ? 'rgba(220,160,90,.6)' : 'rgba(0,0,0,.4)';
      c.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1.6, 1.6);
    }
  } else if (st.pattern === 'ring') {
    c.strokeStyle = 'rgba(60,100,70,.5)';
    c.lineWidth = 1.2;
    for (const r of [139, 143]) {
      c.beginPath();
      c.arc(cx, cy, r, 0, TAU);
      c.stroke();
    }
  }
  c.restore();
}

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
  const st = bowlStyle(b.style);
  c.fillStyle = b.takeaway ? '#cdb48a' : st.rim[2];
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
    rg.addColorStop(0, st.rim[0]);
    rg.addColorStop(0.7, st.rim[1]);
    rg.addColorStop(1, st.rim[2]);
  }
  c.fillStyle = rg;
  c.fill(rim);
  grain(c, rim, b.takeaway ? 0.35 : 0.12);
  // lip ring
  c.beginPath();
  c.arc(cx, cy, 136, 0, TAU);
  c.lineWidth = 8;
  c.strokeStyle = b.takeaway ? '#f6ecd8' : st.lip;
  c.stroke();
  if (!b.takeaway) rimPattern(c, st);
  // interior with depth
  const inner = new Path2D();
  inner.arc(cx, cy, 132, 0, TAU);
  const ig = c.createRadialGradient(cx + 10, cy + 14, 10, cx, cy, 134);
  const inn = b.takeaway ? ['#fbf7f0', '#e9e0d2', '#a39380'] : st.inner;
  ig.addColorStop(0, inn[0]);
  ig.addColorStop(0.8, inn[1]);
  ig.addColorStop(1, inn[2]);
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
    for (let i = 0; i < 90; i++) {
      const a = r() * TAU;
      const d = rad * (0.6 + r() * 0.38);
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      const rr = 0.6 + r() * r() * 3.2;
      c.fillStyle = b.liquid === 'acili' ? 'rgba(255,120,60,.45)' : 'rgba(255,226,150,.32)';
      c.beginPath();
      c.arc(x, y, rr, 0, TAU);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)';
      c.beginPath();
      c.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.3, 0, TAU);
      c.fill();
    }
    gloss(c, cx - 40, cy - 46, 46, 16, -0.6, 0.22);
  }
  if (liq && isSauce && f > 0) {
    // glossy sauce drizzle over the noodles
    const r = rng(hash(b.liquid! + 'z'));
    c.lineCap = 'round';
    // glossy sauce pooled between the folds
    for (let i = 0; i < Math.round(4 + f * 6); i++) {
      const a = r() * TAU;
      const d = 20 + r() * 80;
      const x = cx + Math.cos(a) * d;
      const y = cy + Math.sin(a) * d;
      const rr = 6 + r() * 10;
      const g = c.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 1, x, y, rr);
      g.addColorStop(0, tint(liq.color, 0.35, 0.85));
      g.addColorStop(1, tint(liq.color, -0.1, 0));
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x, y, rr, rr * 0.7, a, 0, TAU);
      c.fill();
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
  // big toppings first, sprinkles on top; within a layer keep placing order
  for (const p of b.pieces) if (BIG.has(p.id)) drawPiece(c, p);
  for (const p of b.pieces) if (!BIG.has(p.id)) drawPiece(c, p);
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
  // ceramic dish (toppings) or bamboo zaru basket (noodles), seen from above
  const basket = ing.cat === 'noodle';
  const pan = new Path2D();
  pan.roundRect(8, 8, W - 16, H - 16, basket ? 60 : 26);
  c.save();
  c.shadowColor = 'rgba(80,50,30,.35)';
  c.shadowBlur = 10;
  c.shadowOffsetY = 5;
  c.fillStyle = basket ? '#b08a55' : '#e4d6c2';
  c.fill(pan);
  c.restore();
  const pg = c.createLinearGradient(0, 8, 0, H - 8);
  if (basket) {
    pg.addColorStop(0, '#e6c891');
    pg.addColorStop(1, '#b98f57');
  } else {
    pg.addColorStop(0, '#fffdf8');
    pg.addColorStop(0.6, '#f1e7d8');
    pg.addColorStop(1, '#dccbb3');
  }
  c.fillStyle = pg;
  c.fill(pan);
  const well = new Path2D();
  well.roundRect(20, 20, W - 40, H - 40, basket ? 50 : 18);
  const wg = c.createLinearGradient(0, 20, 0, H - 20);
  if (basket) {
    wg.addColorStop(0, '#c9a46b');
    wg.addColorStop(1, '#e2c58f');
  } else {
    wg.addColorStop(0, '#e2d5c1');
    wg.addColorStop(0.3, '#f4ecdf');
    wg.addColorStop(1, '#fbf6ee');
  }
  c.fillStyle = wg;
  c.fill(well);
  if (basket) {
    c.save();
    c.clip(well);
    c.strokeStyle = 'rgba(120,85,40,.35)';
    c.lineWidth = 2;
    for (let x = -H; x < W + H; x += 9) {
      c.beginPath();
      c.moveTo(x, 20);
      c.lineTo(x + H, H);
      c.stroke();
      c.beginPath();
      c.moveTo(x + H, 20);
      c.lineTo(x, H);
      c.stroke();
    }
    c.restore();
  } else {
    // a thin indigo line on the rim, like a Japanese dish
    const rim = new Path2D();
    rim.roundRect(14, 14, W - 28, H - 28, 22);
    c.strokeStyle = 'rgba(47,74,107,.55)';
    c.lineWidth = 2;
    c.stroke(rim);
  }
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
