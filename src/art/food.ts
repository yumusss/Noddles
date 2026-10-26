// All food drawing: topping pieces, noodles, broths/sauces, the bowl from above,
// ingredient tubs, noodle trays, stock pots, bowl icons and small UI thumbnails.
// Pure Canvas 2D. Everything static is pre-rendered into sprites.
import {
  PAL,
  shade,
  rgba,
  mix,
  rng,
  roundRect,
  ellipse,
  circle,
  softShadow,
  gloss,
  speckle,
  sprite,
  clamp,
  lerp,
} from './common';
import type { Ctx } from './common';
import { bowlStyle } from '../game/data';
import type { Thick, BowlStyle } from '../game/data';
import { cookOf } from '../game/bowl';
import type { BowlState, CookState } from '../game/bowl';

const OUT = 'rgba(60,35,20,0.25)';
const OUT_SOFT = 'rgba(60,35,20,0.16)';
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Toppings
// ---------------------------------------------------------------------------

export const PIECE_SIZE: Record<string, number> = {
  yesil: 22,
  yumurta: 44,
  chashu: 46,
  nori: 52,
  pakchoi: 40,
  filiz: 34,
  misir: 26,
  mantar: 36,
  aciyag: 40,
  biber: 22,
  tofu: 32,
  kimchi: 36,
  karides: 54,
  naruto: 36,
  lime: 32,
  bambu: 40,
  citir: 30,
  susam: 28,
};

export const PIECE_VARIANTS: Record<string, number> = {
  yesil: 3,
  yumurta: 3,
  chashu: 3,
  nori: 3,
  pakchoi: 2,
  filiz: 3,
  misir: 3,
  mantar: 2,
  aciyag: 3,
  biber: 3,
  tofu: 2,
  kimchi: 3,
  karides: 2,
  naruto: 2,
  lime: 2,
  bambu: 3,
  citir: 3,
  susam: 3,
};

/** Irregular organic closed path around (cx,cy) with mean radius r. */
function blobPath(
  c: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rand: () => number,
  wob = 0.18,
  n = 9
) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + (rand() - 0.5) * 2 * wob;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  smoothClosed(c, pts);
}

function smoothClosed(c: Ctx, pts: [number, number][]) {
  const n = pts.length;
  c.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const m = mid(p, q);
    c.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  c.closePath();
}

const mid = (a: [number, number], b: [number, number]): [number, number] => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
];

function radial(c: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][]) {
  const g = c.createRadialGradient(x, y, r0, x, y, r1);
  for (const [t, col] of stops) g.addColorStop(t, col);
  return g;
}

function outline(c: Ctx, w = 1, col = OUT) {
  c.lineWidth = w;
  c.strokeStyle = col;
  c.stroke();
}

type PieceDrawer = (c: Ctx, v: number, rand: () => number) => void;

const PIECES: Record<string, PieceDrawer> = {
  // --- green onion rings ---
  yesil(c, v, rand) {
    const n = 4 + (v % 2);
    const spots: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rand() * 0.8;
      const d = 3 + rand() * 4;
      spots.push([Math.cos(a) * d, Math.sin(a) * d, 4.2 + rand() * 1.6]);
    }
    for (const [x, y, r] of spots) {
      circle(c, x, y, r);
      c.fillStyle = radial(c, x - r * 0.3, y - r * 0.3, 0, r, [
        [0, '#8fd28a'],
        [1, '#5aa55c'],
      ]);
      c.fill();
      outline(c, 0.8);
      // hollow pale centre
      circle(c, x, y, r * 0.55);
      c.fillStyle = radial(c, x, y, 0, r * 0.55, [
        [0, '#f1f7e2'],
        [0.7, '#dcebc6'],
        [1, '#b7d7a4'],
      ]);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)';
      ellipse(c, x - r * 0.35, y - r * 0.4, r * 0.25, r * 0.15);
      c.fill();
    }
  },

  // --- halved marinated egg ---
  yumurta(c, v) {
    const tilt = v === 1 ? 0.45 : v === 2 ? -0.35 : 0;
    c.rotate(tilt);
    const rx = 22;
    const ry = 17.5;
    ellipse(c, 0, 0, rx, ry);
    c.fillStyle = radial(c, -5, -5, 2, rx * 1.2, [
      [0, '#fffdf6'],
      [0.6, '#f7efe0'],
      [1, '#e3d3bb'],
    ]);
    c.fill();
    outline(c, 1, OUT_SOFT);
    // marinade tint along the edge
    c.save();
    ellipse(c, 0, 0, rx, ry);
    c.clip();
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(190,130,60,0.35)';
    ellipse(c, 0, 0, rx + 0.5, ry + 0.5);
    c.stroke();
    c.restore();
    // yolk
    const yx = v === 2 ? -1.5 : 1.5;
    const yy = v === 1 ? -1 : 0.5;
    const yr = 12.5;
    const yry = 10.5;
    ellipse(c, yx, yy, yr + 1.2, yry + 1.2);
    c.fillStyle = 'rgba(200,120,40,0.35)';
    c.fill();
    ellipse(c, yx, yy, yr, yry);
    c.fillStyle = radial(c, yx - 3, yy - 3, 1, yr * 1.15, [
      [0, '#ffc85a'],
      [0.45, '#f7a53a'],
      [0.85, '#e0781e'],
      [1, '#c45f14'],
    ]);
    c.fill();
    // jammy centre glow
    ellipse(c, yx + 1, yy + 1, yr * 0.5, yry * 0.45);
    c.fillStyle = 'rgba(255,170,60,0.55)';
    c.fill();
    // shine
    c.fillStyle = 'rgba(255,255,255,0.7)';
    ellipse(c, yx - 4.5, yy - 4, 3.6, 2.2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    ellipse(c, yx + 3, yy - 6, 1.6, 1);
    c.fill();
    gloss(c, -9, -8, 8, 0.35);
  },

  // --- chashu slice ---
  chashu(c, v, rand) {
    const rx = v === 1 ? 24 : 22.5;
    const ry = v === 1 ? 20 : 22.5;
    c.rotate(v * 0.7);
    blobPath(c, 0, 0, rx, ry, rand, 0.05, 10);
    c.fillStyle = radial(c, -4, -4, 2, rx * 1.3, [
      [0, '#d9a082'],
      [0.6, '#c27d5c'],
      [1, '#a2644a'],
    ]);
    c.fill();
    // seared edge (ring)
    c.save();
    c.clip();
    c.lineWidth = 7;
    c.strokeStyle = 'rgba(120,60,30,0.55)';
    blobPath(c, 0, 0, rx + 1, ry + 1, rng(v + 7), 0.05, 10);
    c.stroke();
    c.lineWidth = 2.5;
    c.strokeStyle = 'rgba(70,32,14,0.6)';
    c.stroke();
    // fat marbling
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(248,228,205,0.9)';
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(-rx * 0.6, -ry * 0.35);
    c.bezierCurveTo(-rx * 0.1, -ry * 0.8, rx * 0.4, -ry * 0.1, rx * 0.55, ry * 0.3);
    c.stroke();
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-rx * 0.5, ry * 0.45);
    c.bezierCurveTo(-rx * 0.1, ry * 0.1, rx * 0.1, ry * 0.5, rx * 0.35, ry * 0.65);
    c.stroke();
    // fat cap crescent
    c.fillStyle = 'rgba(250,232,210,0.85)';
    c.beginPath();
    c.ellipse(rx * 0.45, -ry * 0.45, rx * 0.5, ry * 0.22, -0.7, 0, TAU);
    c.fill();
    // grain
    c.strokeStyle = 'rgba(90,45,25,0.18)';
    c.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const y = -ry * 0.6 + i * ry * 0.25;
      c.beginPath();
      c.moveTo(-rx * 0.7, y + rand() * 3);
      c.quadraticCurveTo(0, y + 2 + rand() * 3, rx * 0.7, y + rand() * 3);
      c.stroke();
    }
    c.restore();
    gloss(c, -7, -8, 10, 0.22);
    blobPath(c, 0, 0, rx, ry, rng(v + 1), 0.05, 10);
    outline(c, 1);
  },

  // --- nori sheet ---
  nori(c, v, rand) {
    const w = v === 1 ? 44 : v === 2 ? 50 : 52;
    const h = v === 1 ? 32 : v === 2 ? 26 : 30;
    const x = -w / 2;
    const y = -h / 2;
    c.beginPath();
    c.moveTo(x + 1, y);
    c.lineTo(x + w - 1.5, y + 0.6);
    c.lineTo(x + w, y + h - 1);
    c.lineTo(x + 0.5, y + h);
    c.closePath();
    c.fillStyle = c.createLinearGradient(x, y, x + w, y + h);
    (c.fillStyle as CanvasGradient).addColorStop(0, '#30563c');
    (c.fillStyle as CanvasGradient).addColorStop(0.5, '#213a2c');
    (c.fillStyle as CanvasGradient).addColorStop(1, '#2a4a34');
    c.fill();
    c.save();
    c.clip();
    // lighter streaks
    c.lineWidth = 1.2;
    for (let i = 0; i < 14; i++) {
      c.strokeStyle = `rgba(150,200,140,${0.08 + rand() * 0.12})`;
      const sx = x + rand() * w;
      const sy = y + rand() * h;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx + (rand() - 0.5) * 18, sy + (rand() - 0.5) * 10);
      c.stroke();
    }
    // sheen band
    const g = c.createLinearGradient(x, y, x + w * 0.6, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.14)');
    g.addColorStop(0.6, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    // tiny holes
    c.fillStyle = 'rgba(255,245,220,0.25)';
    for (let i = 0; i < 6; i++) {
      circle(c, x + rand() * w, y + rand() * h, 0.6 + rand() * 0.8);
      c.fill();
    }
    c.restore();
    c.beginPath();
    c.moveTo(x + 1, y);
    c.lineTo(x + w - 1.5, y + 0.6);
    c.lineTo(x + w, y + h - 1);
    c.lineTo(x + 0.5, y + h);
    c.closePath();
    outline(c, 1, 'rgba(20,40,25,0.4)');
  },

  // --- pak choi half ---
  pakchoi(c, v, rand) {
    c.rotate(v === 1 ? 0.6 : -0.2);
    // leaves
    const leaves = [
      { x: -8, y: -9, rx: 11, ry: 14, a: -0.5 },
      { x: 8, y: -10, rx: 11, ry: 14, a: 0.5 },
      { x: 0, y: -13, rx: 10, ry: 13, a: 0 },
    ];
    for (const l of leaves) {
      c.beginPath();
      c.ellipse(l.x, l.y, l.rx, l.ry, l.a, 0, TAU);
      c.fillStyle = radial(c, l.x - 3, l.y - 4, 1, l.ry * 1.3, [
        [0, '#8ccb7a'],
        [0.7, '#5fa85a'],
        [1, '#3f8a44'],
      ]);
      c.fill();
      outline(c, 0.9);
      // midrib
      c.strokeStyle = 'rgba(235,245,220,0.8)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(l.x + Math.sin(l.a) * l.ry * 0.9, l.y + Math.cos(l.a) * l.ry * 0.9);
      c.lineTo(l.x - Math.sin(l.a) * l.ry * 0.7, l.y - Math.cos(l.a) * l.ry * 0.7);
      c.stroke();
      c.lineWidth = 0.8;
      c.strokeStyle = 'rgba(235,245,220,0.45)';
      for (let i = 0; i < 3; i++) {
        const t = -0.4 + i * 0.4;
        const px = l.x - Math.sin(l.a) * l.ry * t;
        const py = l.y - Math.cos(l.a) * l.ry * t;
        c.beginPath();
        c.moveTo(px, py);
        c.lineTo(px + Math.cos(l.a) * l.rx * 0.7 + rand(), py - Math.sin(l.a) * l.rx * 0.7 - 3);
        c.stroke();
      }
    }
    // white stem base
    c.beginPath();
    c.moveTo(-10, 2);
    c.quadraticCurveTo(-11, 14, -3, 19);
    c.quadraticCurveTo(0, 21, 3, 19);
    c.quadraticCurveTo(11, 14, 10, 2);
    c.quadraticCurveTo(0, 8, -10, 2);
    c.closePath();
    c.fillStyle = radial(c, -2, 8, 1, 16, [
      [0, '#fbfff2'],
      [0.6, '#eef5de'],
      [1, '#cfe1b7'],
    ]);
    c.fill();
    outline(c, 1, OUT_SOFT);
    c.strokeStyle = 'rgba(160,195,140,0.5)';
    c.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(i * 4, 5);
      c.quadraticCurveTo(i * 3.5, 12, i * 1.5, 18);
      c.stroke();
    }
    gloss(c, -3, 9, 6, 0.3);
  },

  // --- bean sprouts ---
  filiz(c, v, rand) {
    c.lineCap = 'round';
    const n = 7 + v;
    for (let i = 0; i < n; i++) {
      const x0 = (rand() - 0.5) * 24;
      const y0 = (rand() - 0.5) * 20;
      const a = rand() * TAU;
      const L = 14 + rand() * 12;
      const bend = (rand() - 0.5) * 14;
      const x1 = x0 + Math.cos(a) * L;
      const y1 = y0 + Math.sin(a) * L;
      const cx = (x0 + x1) / 2 - Math.sin(a) * bend;
      const cy = (y0 + y1) / 2 + Math.cos(a) * bend;
      c.beginPath();
      c.moveTo(x0, y0);
      c.quadraticCurveTo(cx, cy, x1, y1);
      c.lineWidth = 3.6;
      c.strokeStyle = 'rgba(190,170,130,0.35)';
      c.stroke();
      c.lineWidth = 2.4;
      c.strokeStyle = i % 3 === 0 ? '#f3eddb' : '#ebe4cf';
      c.stroke();
      c.lineWidth = 0.9;
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.stroke();
      // bean head
      c.beginPath();
      c.ellipse(x1, y1, 2.8, 2, a, 0, TAU);
      c.fillStyle = radial(c, x1 - 0.6, y1 - 0.6, 0, 3, [
        [0, '#f6ecb8'],
        [1, '#d8c572'],
      ]);
      c.fill();
      outline(c, 0.6, OUT_SOFT);
    }
  },

  // --- corn kernels ---
  misir(c, v, rand) {
    const n = 5 + (v % 3);
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + v;
      const d = i === 0 && n > 5 ? 0 : 6 + rand() * 2.5;
      pts.push([Math.cos(a) * d, Math.sin(a) * d]);
    }
    for (const [x, y] of pts) {
      c.save();
      c.translate(x, y);
      c.rotate(rand() * 1.2);
      roundRect(c, -4.6, -4.2, 9.2, 8.4, 3.2);
      c.fillStyle = radial(c, -1.5, -1.5, 0.5, 7, [
        [0, '#ffe27a'],
        [0.6, '#f7c846'],
        [1, '#dba52a'],
      ]);
      c.fill();
      outline(c, 0.8);
      c.fillStyle = 'rgba(255,255,255,0.65)';
      ellipse(c, -1.6, -1.8, 1.7, 1.1);
      c.fill();
      c.restore();
    }
  },

  // --- shiitake cap ---
  mantar(c, v, rand) {
    c.rotate(v * 0.9);
    const r = 17;
    blobPath(c, 0, 0, r, r * 0.92, rand, 0.06, 10);
    c.fillStyle = radial(c, -4, -5, 2, r * 1.25, [
      [0, '#9b6a44'],
      [0.55, '#774a2d'],
      [1, '#4f2f1b'],
    ]);
    c.fill();
    c.save();
    c.clip();
    // cream gill edge peeking around the rim
    c.lineWidth = 3.5;
    c.strokeStyle = 'rgba(236,214,178,0.75)';
    c.beginPath();
    c.arc(0, 0, r - 0.5, 0.2, 2.6);
    c.stroke();
    // cracks in cap
    c.strokeStyle = 'rgba(240,222,190,0.35)';
    c.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const a = rand() * TAU;
      const d = 7 + rand() * 7;
      c.beginPath();
      c.moveTo(Math.cos(a) * d, Math.sin(a) * d);
      c.lineTo(Math.cos(a + 0.4) * (d + 4), Math.sin(a + 0.4) * (d + 4));
      c.stroke();
    }
    c.restore();
    // cross cut
    c.lineCap = 'round';
    c.lineWidth = 4;
    c.strokeStyle = 'rgba(60,32,16,0.5)';
    for (const a of [0.5, 0.5 + Math.PI / 2]) {
      c.beginPath();
      c.moveTo(Math.cos(a) * -7, Math.sin(a) * -7);
      c.lineTo(Math.cos(a) * 7, Math.sin(a) * 7);
      c.stroke();
    }
    c.lineWidth = 2.4;
    c.strokeStyle = '#f0dcc0';
    for (const a of [0.5, 0.5 + Math.PI / 2]) {
      c.beginPath();
      c.moveTo(Math.cos(a) * -6.5, Math.sin(a) * -6.5);
      c.lineTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5);
      c.stroke();
    }
    gloss(c, -6, -7, 9, 0.28);
    blobPath(c, 0, 0, r, r * 0.92, rng(v + 3), 0.06, 10);
    outline(c, 1);
  },

  // --- chilli oil splash ---
  aciyag(c, v, rand) {
    blobPath(c, 0, 0, 16, 13, rand, 0.3, 9);
    c.fillStyle = radial(c, 0, 0, 2, 18, [
      [0, 'rgba(235,90,40,0.75)'],
      [0.7, 'rgba(215,50,25,0.6)'],
      [1, 'rgba(190,35,20,0.45)'],
    ]);
    c.fill();
    outline(c, 1, 'rgba(150,30,10,0.25)');
    for (let i = 0; i < 6 + v; i++) {
      const a = rand() * TAU;
      const d = 14 + rand() * 7;
      const r = 1.2 + rand() * 2.2;
      circle(c, Math.cos(a) * d, Math.sin(a) * d, r);
      c.fillStyle = 'rgba(220,60,30,0.6)';
      c.fill();
    }
    // pepper flakes
    c.fillStyle = 'rgba(120,20,10,0.6)';
    for (let i = 0; i < 7; i++) {
      c.fillRect((rand() - 0.5) * 24, (rand() - 0.5) * 18, 1.6, 1.1);
    }
    gloss(c, -5, -4, 8, 0.4);
    c.fillStyle = 'rgba(255,255,255,0.5)';
    ellipse(c, 6, 3, 3, 1.4);
    c.fill();
  },

  // --- red chilli rings ---
  biber(c, v, rand) {
    const n = 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + v * 0.7;
      const d = 5.5;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d;
      const r = 5 + rand();
      c.save();
      c.translate(x, y);
      c.rotate(rand() * 0.6);
      ellipse(c, 0, 0, r, r * 0.9);
      c.fillStyle = radial(c, -1.5, -1.5, 0, r * 1.3, [
        [0, '#f06a4a'],
        [0.6, '#d9342c'],
        [1, '#a81f1e'],
      ]);
      c.fill();
      outline(c, 0.9);
      ellipse(c, 0, 0, r * 0.6, r * 0.55);
      c.fillStyle = '#f7c9b4';
      c.fill();
      c.fillStyle = '#f3e6c2';
      for (let k = 0; k < 3; k++) {
        const sa = rand() * TAU;
        ellipse(c, Math.cos(sa) * r * 0.35, Math.sin(sa) * r * 0.3, 1, 0.7);
        c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.55)';
      ellipse(c, -r * 0.45, -r * 0.5, 1.6, 0.9);
      c.fill();
      c.restore();
    }
  },

  // --- fried tofu cube ---
  tofu(c, v, rand) {
    c.rotate(v === 1 ? -0.5 : 0.25);
    const s = 13;
    // side face (slight 3d)
    roundRect(c, -s, -s + 4, s * 2, s * 2, 4);
    c.fillStyle = '#b57c3c';
    c.fill();
    // top face
    roundRect(c, -s, -s, s * 2, s * 2, 4);
    c.fillStyle = radial(c, -4, -5, 1, s * 2.2, [
      [0, '#f6dba4'],
      [0.6, '#e9c27a'],
      [1, '#cf9b4c'],
    ]);
    c.fill();
    c.save();
    c.clip();
    // crisp blistered texture
    for (let i = 0; i < 22; i++) {
      const x = (rand() - 0.5) * s * 1.8;
      const y = (rand() - 0.5) * s * 1.8;
      c.fillStyle = rand() < 0.5 ? 'rgba(170,110,40,0.3)' : 'rgba(255,240,200,0.45)';
      ellipse(c, x, y, 1 + rand() * 1.8, 0.8 + rand() * 1.2);
      c.fill();
    }
    // darker crisp edge
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(160,95,35,0.45)';
    roundRect(c, -s, -s, s * 2, s * 2, 4);
    c.stroke();
    c.restore();
    gloss(c, -5, -6, 8, 0.3);
    roundRect(c, -s, -s, s * 2, s * 2, 4);
    outline(c, 1);
  },

  // --- kimchi ---
  kimchi(c, v, rand) {
    c.rotate(v * 0.8);
    const parts = [
      { x: -6, y: 4, rx: 12, ry: 8, a: 0.4 },
      { x: 6, y: -4, rx: 13, ry: 8, a: -0.5 },
      { x: -2, y: -7, rx: 10, ry: 7, a: 0.9 },
    ];
    for (const p of parts) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.a);
      blobPath(c, 0, 0, p.rx, p.ry, rand, 0.22, 8);
      c.fillStyle = radial(c, -2, -2, 1, p.rx * 1.3, [
        [0, '#f09a62'],
        [0.5, '#e76b3a'],
        [1, '#c6452a'],
      ]);
      c.fill();
      c.save();
      c.clip();
      // pale cabbage interior
      c.fillStyle = 'rgba(250,215,180,0.55)';
      ellipse(c, 1, 0, p.rx * 0.55, p.ry * 0.45);
      c.fill();
      // veins
      c.strokeStyle = 'rgba(255,230,200,0.5)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(-p.rx * 0.8, 0);
      c.lineTo(p.rx * 0.8, 0);
      c.stroke();
      // pepper flakes
      c.fillStyle = 'rgba(150,25,15,0.7)';
      for (let i = 0; i < 6; i++)
        c.fillRect((rand() - 0.5) * p.rx * 1.6, (rand() - 0.5) * p.ry * 1.4, 1.6, 1.1);
      c.restore();
      outline(c, 0.9, 'rgba(120,30,10,0.35)');
      gloss(c, -p.rx * 0.3, -p.ry * 0.4, p.ry * 0.9, 0.35);
      c.restore();
    }
  },

  // --- tempura shrimp ---
  karides(c, v, rand) {
    c.rotate(v === 1 ? Math.PI : 0);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    // body curve: a comma shape from tail (left) to head (right)
    const path = () => {
      c.beginPath();
      c.moveTo(-10, 6);
      c.bezierCurveTo(-4, -14, 16, -16, 24, -2);
      c.bezierCurveTo(28, 6, 22, 12, 16, 8);
    };
    // tail fan
    c.save();
    c.translate(-16, 6);
    c.rotate(0.25);
    for (const [dy, ang] of [
      [0, -0.35],
      [0, 0.35],
    ] as const) {
      c.beginPath();
      c.moveTo(0, dy);
      c.rotate(0);
      c.lineTo(-11 * Math.cos(ang), -11 * Math.sin(ang) + dy);
      c.lineTo(-12 * Math.cos(ang) - 2, -12 * Math.sin(ang) + dy + 2 * Math.sign(ang));
      c.lineTo(-2, dy + 2 * Math.sign(ang));
      c.closePath();
      c.fillStyle = radial(c, -4, 0, 0, 12, [
        [0, '#ffb79b'],
        [1, '#f27552'],
      ]);
      c.fill();
      outline(c, 0.9, 'rgba(160,50,30,0.35)');
      c.strokeStyle = 'rgba(255,255,255,0.45)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(-1, dy + Math.sign(ang));
      c.lineTo(-9 * Math.cos(ang), -9 * Math.sin(ang) + dy);
      c.stroke();
    }
    c.restore();
    // shrimp meat visible near tail
    path();
    c.lineWidth = 11;
    c.strokeStyle = '#f3a07e';
    c.stroke();
    // batter body
    path();
    c.lineWidth = 13;
    c.strokeStyle = 'rgba(150,95,40,0.45)';
    c.stroke();
    path();
    c.lineWidth = 11.5;
    c.strokeStyle = '#e8b86a';
    c.stroke();
    // reveal meat at tail end by overdrawing a pink piece
    c.beginPath();
    c.moveTo(-10, 6);
    c.bezierCurveTo(-8, -1, -5, -5, -2, -7);
    c.lineWidth = 9;
    c.strokeStyle = '#f5a584';
    c.stroke();
    c.strokeStyle = 'rgba(230,110,80,0.7)';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-9, 2);
    c.lineTo(-4, -2);
    c.stroke();
    // crunchy batter bumps
    const bumps = 26;
    for (let i = 0; i < bumps; i++) {
      const t = 0.15 + rand() * 0.85;
      // sample along bezier roughly
      const p = bez(t, [-10, 6], [-4, -14], [16, -16], [24, -2]);
      const off = (rand() - 0.5) * 12;
      const nx = (rand() - 0.5) * 1.5;
      const r = 1.3 + rand() * 2.2;
      circle(c, p[0] + nx + off * 0.4, p[1] + off * 0.6, r);
      c.fillStyle = rand() < 0.45 ? '#f6d48c' : rand() < 0.5 ? '#d9a04e' : '#fbe7b5';
      c.fill();
      outline(c, 0.6, 'rgba(140,85,30,0.35)');
    }
    // head end bumps
    for (let i = 0; i < 8; i++) {
      const a = rand() * TAU;
      circle(c, 22 + Math.cos(a) * 4, 2 + Math.sin(a) * 5, 1.4 + rand() * 1.8);
      c.fillStyle = rand() < 0.5 ? '#f3cd82' : '#d79c4a';
      c.fill();
      outline(c, 0.6, 'rgba(140,85,30,0.35)');
    }
    gloss(c, 6, -10, 9, 0.3);
  },

  // --- naruto fish cake ---
  naruto(c, v, rand) {
    c.rotate(v * 0.5);
    const r = 16;
    const n = 12;
    c.beginPath();
    for (let i = 0; i <= n * 8; i++) {
      const a = (i / (n * 8)) * TAU;
      const rr = r + Math.cos(a * n) * 1.6;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.closePath();
    c.fillStyle = radial(c, -4, -4, 1, r * 1.3, [
      [0, '#ffffff'],
      [0.7, '#fbf2f1'],
      [1, '#ecd6d6'],
    ]);
    c.fill();
    outline(c, 1, 'rgba(180,90,110,0.35)');
    c.save();
    c.clip();
    // pink rim
    c.lineWidth = 3.2;
    c.strokeStyle = 'rgba(240,150,170,0.75)';
    circle(c, 0, 0, r + 0.5);
    c.stroke();
    c.restore();
    // pink spiral
    c.lineCap = 'round';
    c.strokeStyle = '#ee8fa6';
    c.lineWidth = 3.2;
    c.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const a = t * TAU * 1.9;
      const rr = 1 + t * 10.5;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.45)';
    c.lineWidth = 1;
    c.stroke();
    void rand;
    gloss(c, -5, -6, 8, 0.3);
  },

  // --- lime wedge / slice ---
  lime(c, v, rand) {
    void rand;
    if (v === 0) {
      // wedge lying flat
      c.rotate(-0.4);
      const r = 17;
      const a0 = -0.95;
      const a1 = 0.95;
      c.beginPath();
      c.moveTo(-r * 0.55, 0);
      c.arc(-r * 0.55, 0, r * 1.5, a0 * 0.55, a1 * 0.55);
      c.closePath();
      // rind
      c.fillStyle = '#6fa63f';
      c.fill();
      outline(c, 1, 'rgba(50,80,30,0.35)');
      c.save();
      c.clip();
      c.beginPath();
      c.moveTo(-r * 0.55, 0);
      c.arc(-r * 0.55, 0, r * 1.5 - 2.6, a0 * 0.55, a1 * 0.55);
      c.closePath();
      c.fillStyle = '#f3f5dc';
      c.fill();
      c.beginPath();
      c.moveTo(-r * 0.55, 0);
      c.arc(-r * 0.55, 0, r * 1.5 - 4.2, a0 * 0.55, a1 * 0.55);
      c.closePath();
      c.fillStyle = radial(c, -r * 0.3, 0, 1, r * 1.5, [
        [0, '#eef6c8'],
        [1, '#c9df94'],
      ]);
      c.fill();
      // segments
      c.strokeStyle = 'rgba(255,255,255,0.8)';
      c.lineWidth = 1.2;
      for (let i = 0; i < 4; i++) {
        const a = a0 * 0.55 + ((a1 - a0) * 0.55 * (i + 0.5)) / 4;
        c.beginPath();
        c.moveTo(-r * 0.55 + 3, 0);
        c.lineTo(-r * 0.55 + Math.cos(a) * (r * 1.5 - 4), Math.sin(a) * (r * 1.5 - 4));
        c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 10; i++) {
        const a = a0 * 0.5 + (a1 - a0) * 0.5 * ((i * 0.37) % 1);
        const d = 6 + ((i * 0.61) % 1) * (r * 1.5 - 12);
        ellipse(c, -r * 0.55 + Math.cos(a) * d, Math.sin(a) * d, 1.2, 0.7);
        c.fill();
      }
      c.restore();
    } else {
      const r = 15;
      circle(c, 0, 0, r);
      c.fillStyle = '#6fa63f';
      c.fill();
      outline(c, 1, 'rgba(50,80,30,0.35)');
      circle(c, 0, 0, r - 2.2);
      c.fillStyle = '#f3f5dc';
      c.fill();
      circle(c, 0, 0, r - 3.6);
      c.fillStyle = radial(c, 0, 0, 1, r, [
        [0, '#eef6c8'],
        [1, '#c9df94'],
      ]);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.85)';
      c.lineWidth = 1.4;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * (r - 3.6), Math.sin(a) * (r - 3.6));
        c.stroke();
      }
      circle(c, 0, 0, 2);
      c.fillStyle = '#f3f5dc';
      c.fill();
    }
    gloss(c, -4, -5, 7, 0.25);
  },

  // --- menma bamboo strips ---
  bambu(c, v, rand) {
    const n = 2 + (v % 2);
    for (let i = 0; i < n; i++) {
      c.save();
      c.translate((i - (n - 1) / 2) * 7 + (rand() - 0.5) * 3, (rand() - 0.5) * 4);
      c.rotate((rand() - 0.5) * 0.5 + v * 0.3);
      const w = 36 + rand() * 6;
      const h = 9 + rand() * 3;
      roundRect(c, -w / 2, -h / 2, w, h, 3.5);
      c.fillStyle = c.createLinearGradient(0, -h / 2, 0, h / 2);
      (c.fillStyle as CanvasGradient).addColorStop(0, '#e6c87f');
      (c.fillStyle as CanvasGradient).addColorStop(0.6, '#cfa95c');
      (c.fillStyle as CanvasGradient).addColorStop(1, '#b08a44');
      c.fill();
      c.save();
      c.clip();
      c.strokeStyle = 'rgba(120,85,30,0.35)';
      c.lineWidth = 1;
      for (let k = -1; k <= 1; k++) {
        c.beginPath();
        c.moveTo(-w / 2, k * 2.6);
        c.lineTo(w / 2, k * 2.6 + rand());
        c.stroke();
      }
      c.strokeStyle = 'rgba(255,245,210,0.55)';
      c.beginPath();
      c.moveTo(-w / 2 + 3, -h / 2 + 1.6);
      c.lineTo(w / 2 - 3, -h / 2 + 1.6);
      c.stroke();
      c.restore();
      outline(c, 0.9);
      c.restore();
    }
  },

  // --- crispy fried onion bits ---
  citir(c, v, rand) {
    const n = 11 + v;
    for (let i = 0; i < n; i++) {
      const a = rand() * TAU;
      const d = Math.sqrt(rand()) * 11;
      c.save();
      c.translate(Math.cos(a) * d, Math.sin(a) * d);
      c.rotate(rand() * TAU);
      const w = 4 + rand() * 5;
      const h = 2.2 + rand() * 2;
      const cols = ['#d49a4a', '#b8762f', '#8e5420', '#e0b06a'];
      roundRect(c, -w / 2, -h / 2, w, h, 1.5);
      c.fillStyle = cols[Math.floor(rand() * cols.length)];
      c.fill();
      outline(c, 0.6, 'rgba(70,35,10,0.35)');
      c.fillStyle = 'rgba(255,240,200,0.5)';
      c.fillRect(-w / 2 + 1, -h / 2 + 0.5, w * 0.4, 0.9);
      c.restore();
    }
  },

  // --- sesame seeds ---
  susam(c, v, rand) {
    const n = 13 + v * 2;
    for (let i = 0; i < n; i++) {
      const a = rand() * TAU;
      const d = Math.sqrt(rand()) * 11;
      c.save();
      c.translate(Math.cos(a) * d, Math.sin(a) * d);
      c.rotate(rand() * TAU);
      const black = rand() < 0.22;
      ellipse(c, 0, 0, 2.1, 1.25);
      c.fillStyle = black ? '#3a2d28' : '#f3e7cc';
      c.fill();
      outline(c, 0.5, black ? 'rgba(0,0,0,0.3)' : 'rgba(120,90,50,0.35)');
      c.fillStyle = black ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)';
      ellipse(c, -0.5, -0.3, 0.8, 0.4);
      c.fill();
      c.restore();
    }
  },
};

function bez(
  t: number,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): [number, number] {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

const PIECE_PAD = 1.6;

function pieceSprite(id: string, variant: number): HTMLCanvasElement {
  const size = PIECE_SIZE[id] ?? 30;
  const box = Math.ceil(size * PIECE_PAD);
  const nv = PIECE_VARIANTS[id] ?? 1;
  const v = ((variant % nv) + nv) % nv;
  return sprite(
    `piece:${id}:${v}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      c.lineJoin = 'round';
      c.lineCap = 'round';
      softShadow(c, 1.5, 3.5, size * 0.52, size * 0.42, 0.22);
      const draw = PIECES[id];
      if (draw) draw(c, v, rng(id.length * 131 + v * 977 + 17));
      else {
        circle(c, 0, 0, size / 2);
        c.fillStyle = PAL.coral;
        c.fill();
      }
    },
    3
  );
}

export function drawPiece(c: Ctx, id: string, variant: number, scale: number, rot: number): void {
  const s = pieceSprite(id, variant);
  const box = Math.ceil((PIECE_SIZE[id] ?? 30) * PIECE_PAD);
  c.save();
  c.rotate(rot);
  c.scale(scale, scale);
  c.drawImage(s, -box / 2, -box / 2, box, box);
  c.restore();
}

// ---------------------------------------------------------------------------
// Noodles
// ---------------------------------------------------------------------------

interface NoodleCfg {
  density: number; // strands at r=112, orta
  width: number; // base strand width at orta
  wave: number; // wobble amplitude in widths
  wavelen: number; // wobble wavelength in widths
  rhoMin: number; // arc radius range (fraction of r)
  rhoMax: number;
  len: [number, number]; // strand length range (fraction of r)
  col: Record<CookState, string>;
  outline: string;
  alpha: number; // body alpha (pirinc translucent)
}

const NOODLES: Record<string, NoodleCfg> = {
  ramen: {
    density: 46,
    width: 3.3,
    wave: 0.85,
    wavelen: 5.2,
    rhoMin: 0.3,
    rhoMax: 0.8,
    len: [1.2, 2.4],
    col: {
      raw: '#efe3bc',
      dente: '#f4d98c',
      perfect: '#f3cb62',
      soft: '#f1d894',
      burnt: '#d9d0ad',
    },
    outline: 'rgba(160,110,40,0.5)',
    alpha: 1,
  },
  udon: {
    density: 30,
    width: 7.4,
    wave: 0.22,
    wavelen: 6,
    rhoMin: 0.3,
    rhoMax: 0.8,
    len: [1.4, 2.6],
    col: {
      raw: '#f0e9dc',
      dente: '#f8f3e8',
      perfect: '#fbf6ec',
      soft: '#f6f1e6',
      burnt: '#e3dcce',
    },
    outline: 'rgba(150,120,80,0.55)',
    alpha: 1,
  },
  soba: {
    density: 70,
    width: 2.9,
    wave: 0.15,
    wavelen: 8,
    rhoMin: 0.6,
    rhoMax: 1.0,
    len: [1.0, 1.9],
    col: {
      raw: '#bba58d',
      dente: '#ad8c6e',
      perfect: '#a88466',
      soft: '#b29176',
      burnt: '#a59a8d',
    },
    outline: 'rgba(80,50,30,0.5)',
    alpha: 1,
  },
  pirinc: {
    density: 80,
    width: 2.0,
    wave: 0.5,
    wavelen: 6,
    rhoMin: 0.35,
    rhoMax: 0.85,
    len: [1.2, 2.4],
    col: {
      raw: '#f4efe4',
      dente: '#faf6ee',
      perfect: '#fbf8f2',
      soft: '#f6f2ea',
      burnt: '#e6e1d8',
    },
    outline: 'rgba(160,140,105,0.6)',
    alpha: 0.88,
  },
};

const THICK_MUL: Record<Thick, number> = { ince: 0.72, orta: 1, kalin: 1.45 };
const COOK_W: Record<CookState, number> = {
  raw: 0.9,
  dente: 0.97,
  perfect: 1.05,
  soft: 1.18,
  burnt: 1.32,
};
const COOK_GLOSS: Record<CookState, number> = {
  raw: 0.12,
  dente: 0.4,
  perfect: 0.6,
  soft: 0.35,
  burnt: 0.12,
};

interface SauceOpt {
  id: string;
  amt: number; // 0..1
}

function noodleSprite(
  noodle: string,
  thick: Thick,
  cook: CookState,
  r: number,
  seed: number,
  sauce?: SauceOpt
): HTMLCanvasElement {
  const R = Math.round(r);
  const key = `nood:${noodle}:${thick}:${cook}:${R}:${seed}:${sauce ? sauce.id + ':' + Math.round(sauce.amt * 10) : ''}`;
  const pad = 6;
  const box = R * 2 + pad * 2;
  return sprite(
    key,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      renderNoodles(c, noodle, thick, cook, R, seed);
      if (sauce) applySauce(c, sauce, R);
    },
    2
  );
}

function renderNoodles(
  c: Ctx,
  noodle: string,
  thick: Thick,
  cook: CookState,
  r: number,
  seed: number
) {
  const cfg = NOODLES[noodle] ?? NOODLES.ramen;
  const rand = rng(seed * 7919 + noodle.length * 31 + 5);
  const w = cfg.width * THICK_MUL[thick] * COOK_W[cook] * clamp(r / 112, 0.6, 1.6);
  const n = Math.round(
    cfg.density *
      clamp(Math.pow(r / 112, 1.6), 0.25, 1.6) *
      (thick === 'kalin' ? 0.72 : thick === 'ince' ? 1.3 : 1)
  );
  const body = cfg.col[cook];
  const glossA = COOK_GLOSS[cook];
  const sharp = cook === 'raw';
  const limp = cook === 'soft' || cook === 'burnt';
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // faint nest shadow on the bowl floor
  c.fillStyle = radial(c, 0, 2, r * 0.3, r * 0.98, [
    [0, 'rgba(60,35,20,0.16)'],
    [1, 'rgba(60,35,20,0)'],
  ]);
  circle(c, 0, 2, r);
  c.fill();

  const strands: [number, number][][] = [];
  const amp = cfg.wave * w * (sharp ? 0.8 : limp ? 0.6 : 1);
  const wl = cfg.wavelen * w * (sharp ? 1.3 : 1);
  const spin = rand() < 0.5 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    let rho = r * lerp(cfg.rhoMin, cfg.rhoMax, rand());
    const margin = amp + w * 0.9;
    let maxC = r - rho - margin;
    if (maxC < 0) {
      rho = r - margin;
      maxC = 0;
    }
    const ca = rand() * TAU;
    const cd = Math.sqrt(rand()) * maxC;
    const cx = Math.cos(ca) * cd;
    const cy = Math.sin(ca) * cd;
    const side = rand() < 0.8 ? spin : -spin;
    const th0 = rand() * TAU;
    const L = r * lerp(cfg.len[0], cfg.len[1], rand());
    const span = Math.min(L / rho, TAU * 0.9) * side;
    const steps = Math.max(8, Math.ceil(L / (sharp ? 5 : 3)));
    const ph0 = rand() * TAU;
    const pts: [number, number][] = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const th = th0 + span * t;
      const arc = t * L;
      let wob = Math.sin(ph0 + (arc / wl) * TAU);
      if (sharp) wob = Math.sign(wob) * Math.pow(Math.abs(wob), 0.5);
      const rr = rho + amp * wob + (rand() - 0.5) * w * 0.3;
      pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
    }
    strands.push(pts);
  }

  const path = (pts: [number, number][], smooth: boolean) => {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    if (!smooth) {
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      return;
    }
    for (let i = 1; i < pts.length - 1; i++) {
      const m = mid(pts[i], pts[i + 1]);
      c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    const l = pts[pts.length - 1];
    c.lineTo(l[0], l[1]);
  };

  const hiCol = `rgba(255,255,255,${glossA})`;
  const shadeCol = cook === 'burnt' ? 'rgba(90,80,60,0.35)' : cfg.outline;
  c.globalAlpha = cfg.alpha;
  for (const pts of strands) {
    path(pts, !sharp);
    c.lineWidth = w + 1.6;
    c.strokeStyle = shadeCol;
    c.stroke();
    c.lineWidth = w;
    c.strokeStyle = body;
    c.stroke();
    // highlight line, offset up-left
    c.save();
    c.translate(-w * 0.16, -w * 0.22);
    path(pts, !sharp);
    c.lineWidth = Math.max(0.8, w * 0.28);
    c.strokeStyle = hiCol;
    c.stroke();
    c.restore();
  }
  c.globalAlpha = 1;

  if (cook === 'raw') {
    // flour dusting
    c.save();
    circle(c, 0, 0, r);
    c.clip();
    speckle(c, -r, -r, r * 2, r * 2, seed + 3, Math.round(r * 2.5), 'rgba(255,255,255,0.55)');
    c.restore();
  }
  if (cook === 'burnt') {
    // mushy: strands merge into a pale blob
    c.save();
    blobPath(c, 0, 0, r * 0.9, r * 0.85, rand, 0.1, 11);
    c.fillStyle = radial(c, 0, 0, r * 0.2, r * 0.95, [
      [0, shade(body, 0.1, 0.72)],
      [0.7, shade(body, 0.0, 0.5)],
      [1, shade(body, -0.1, 0.1)],
    ]);
    c.fill();
    // broken bits
    c.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const a = rand() * TAU;
      const d = rand() * r * 0.8;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d;
      const b = rand() * TAU;
      const L = w * (1 + rand() * 2.5);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(b) * L, y + Math.sin(b) * L);
      c.lineWidth = w * 0.9;
      c.strokeStyle = shade(body, -0.18, 0.8);
      c.stroke();
    }
    // greyish sheen
    c.fillStyle = 'rgba(120,120,110,0.08)';
    circle(c, 0, 0, r * 0.9);
    c.fill();
    c.restore();
  }
}

/** Noodles faded toward the edge: the part of the nest that floats above the broth surface. */
function noodleFloatSprite(
  noodle: string,
  thick: Thick,
  cook: CookState,
  r: number,
  seed: number
): HTMLCanvasElement {
  const R = Math.round(r);
  const pad = 6;
  const box = R * 2 + pad * 2;
  return sprite(
    `noodfloat:${noodle}:${thick}:${cook}:${R}:${seed}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      const base = noodleSprite(noodle, thick, cook, r, seed);
      c.drawImage(base, -box / 2, -box / 2, box, box);
      c.globalCompositeOperation = 'destination-in';
      c.fillStyle = radial(c, 0, 0, 0, R, [
        [0, 'rgba(0,0,0,0.9)'],
        [0.45, 'rgba(0,0,0,0.85)'],
        [0.8, 'rgba(0,0,0,0.35)'],
        [1, 'rgba(0,0,0,0)'],
      ]);
      c.fillRect(-box / 2, -box / 2, box, box);
    },
    2
  );
}

export function drawNoodles(
  c: Ctx,
  noodle: string,
  thick: Thick,
  cook: CookState,
  r: number,
  seed: number
): void {
  const s = noodleSprite(noodle, thick, cook, r, seed);
  const R = Math.round(r);
  const box = R * 2 + 12;
  c.save();
  c.drawImage(s, -box / 2, -box / 2, box, box);
  c.restore();
}

// ---------------------------------------------------------------------------
// Broths & sauces
// ---------------------------------------------------------------------------

interface BrothCfg {
  col: string;
  alpha: number;
  creamy: number; // 0 clear .. 1 opaque creamy
  oil?: string;
  chilli?: boolean;
  sesame?: boolean;
}

const BROTHS: Record<string, BrothCfg> = {
  shoyu: { col: '#8c4a1c', alpha: 0.72, creamy: 0, oil: '#f5bd55' },
  miso: { col: '#d19546', alpha: 0.92, creamy: 0.65 },
  tavuk: { col: '#e2ae57', alpha: 0.66, creamy: 0.05, oil: '#fbe08a' },
  acili: { col: '#c9412a', alpha: 0.88, creamy: 0.2, oil: '#f0712f', chilli: true, sesame: true },
  kori: { col: '#d49a2a', alpha: 0.92, creamy: 0.45 },
  tonkotsu: { col: '#efe1c8', alpha: 0.97, creamy: 1 },
};

const SAUCES: Record<string, string> = {
  teriyaki: '#5a2c12',
  fistik: '#b9814a',
  tatliaci: '#d6401c',
  yakisoba: '#3f2010',
};

export const isSauce = (id?: string) => !!id && id in SAUCES;

/** Static liquid disc (gradient, oil droplets, swirls) cached per (broth, radius). */
function brothDisc(broth: string, rad: number): HTMLCanvasElement {
  const R = Math.round(rad);
  const box = R * 2 + 4;
  return sprite(
    `broth:${broth}:${R}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      renderLiquid(c, broth, R, 1);
    },
    2
  );
}

function renderLiquid(c: Ctx, broth: string, R: number, alphaMul: number) {
  const cfg = BROTHS[broth] ?? BROTHS.shoyu;
  const rand = rng(broth.length * 977 + R);
  const base = cfg.col;
  const a = cfg.alpha * alphaMul;
  circle(c, 0, 0, R);
  // deeper (darker) in the middle, thinner at the wall
  c.fillStyle = radial(c, 0, 0, R * 0.1, R, [
    [0, shade(base, -0.18 * (1 - cfg.creamy * 0.6), a)],
    [0.6, shade(base, -0.02, a)],
    [0.93, shade(base, 0.12, a)],
    [1, shade(base, 0.2, a * 0.9)],
  ]);
  c.fill();
  c.save();
  circle(c, 0, 0, R);
  c.clip();
  if (cfg.creamy > 0) {
    // cloudy swirls
    for (let i = 0; i < 6; i++) {
      const x = (rand() - 0.5) * R * 1.2;
      const y = (rand() - 0.5) * R * 1.2;
      const rr = R * (0.25 + rand() * 0.35);
      c.fillStyle = radial(c, x, y, 0, rr, [
        [0, shade(base, 0.18, 0.35 * cfg.creamy)],
        [1, shade(base, 0.18, 0)],
      ]);
      circle(c, x, y, rr);
      c.fill();
    }
  }
  if (cfg.chilli) {
    c.lineCap = 'round';
    c.lineWidth = R * 0.07;
    c.strokeStyle = 'rgba(230,70,25,0.6)';
    for (let i = 0; i < 4; i++) {
      const a0 = rand() * TAU;
      const rr = R * (0.3 + rand() * 0.55);
      c.beginPath();
      c.arc(0, 0, rr, a0, a0 + 0.8 + rand() * 1.4);
      c.stroke();
    }
    c.lineWidth = R * 0.03;
    c.strokeStyle = 'rgba(255,150,70,0.45)';
    for (let i = 0; i < 4; i++) {
      const a0 = rand() * TAU;
      const rr = R * (0.3 + rand() * 0.55);
      c.beginPath();
      c.arc(0, 0, rr, a0, a0 + 0.6 + rand() * 1.2);
      c.stroke();
    }
  }
  if (cfg.oil) {
    for (let i = 0; i < 16; i++) {
      const ang = rand() * TAU;
      const d = Math.sqrt(rand()) * R * 0.92;
      const rr = R * (0.015 + rand() * 0.035);
      const x = Math.cos(ang) * d;
      const y = Math.sin(ang) * d;
      circle(c, x, y, rr);
      c.fillStyle = radial(c, x - rr * 0.3, y - rr * 0.3, 0, rr, [
        [0, rgba(cfg.oil, 0.85)],
        [0.7, rgba(cfg.oil, 0.6)],
        [1, rgba(cfg.oil, 0.2)],
      ]);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 0.6;
      c.stroke();
    }
  }
  if (cfg.sesame) {
    for (let i = 0; i < 14; i++) {
      const ang = rand() * TAU;
      const d = Math.sqrt(rand()) * R * 0.9;
      c.save();
      c.translate(Math.cos(ang) * d, Math.sin(ang) * d);
      c.rotate(rand() * TAU);
      ellipse(c, 0, 0, R * 0.018, R * 0.011);
      c.fillStyle = 'rgba(245,232,205,0.9)';
      c.fill();
      c.restore();
    }
  }
  // soft meniscus at the wall
  c.lineWidth = Math.max(1.5, R * 0.03);
  c.strokeStyle = shade(base, -0.3, 0.3);
  circle(c, 0, 0, R - c.lineWidth / 2);
  c.stroke();
  // wall shadow: the bowl wall casts a soft shadow onto the liquid near the edge (top-left stronger)
  c.fillStyle = radial(c, R * 0.1, R * 0.12, R * 0.6, R * 1.02, [
    [0, 'rgba(40,20,10,0)'],
    [0.75, 'rgba(40,20,10,0.1)'],
    [1, 'rgba(40,20,10,0.4)'],
  ]);
  circle(c, 0, 0, R);
  c.fill();
  // ambient sheen (static); the moving one is drawn per frame
  c.fillStyle = radial(c, -R * 0.35, -R * 0.4, 0, R * 0.8, [
    [0, 'rgba(255,255,255,0.22)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  circle(c, 0, 0, R);
  c.fill();
  c.restore();
}

/** Tint noodle pixels with sauce (sprite-internal; context already has noodles drawn). */
function applySauce(c: Ctx, sauce: SauceOpt, R: number) {
  const col = SAUCES[sauce.id] ?? '#5a2c12';
  c.save();
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = rgba(col, 0.22 + 0.3 * sauce.amt);
  c.fillRect(-R - 6, -R - 6, R * 2 + 12, R * 2 + 12);
  // darker pooling near centre
  c.fillStyle = radial(c, 0, 0, 0, R, [
    [0, rgba(col, 0.35 * sauce.amt)],
    [1, rgba(col, 0)],
  ]);
  c.fillRect(-R, -R, R * 2, R * 2);
  // glaze shine: diagonal highlight streaks
  c.globalCompositeOperation = 'source-atop';
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = R * 0.04;
  const rand = rng(sauce.id.length * 11);
  for (let i = 0; i < 14; i++) {
    const x = (rand() - 0.5) * R * 1.4;
    const y = (rand() - 0.5) * R * 1.4;
    const L = R * (0.12 + rand() * 0.25);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + L * 0.8, y - L * 0.5);
    c.stroke();
  }
  c.fillStyle = radial(c, -R * 0.3, -R * 0.35, 0, R * 0.7, [
    [0, 'rgba(255,255,255,0.3)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  c.fillRect(-R, -R, R * 2, R * 2);
  c.restore();
}

// ---------------------------------------------------------------------------
// Bowl from above
// ---------------------------------------------------------------------------

function drawRimPattern(c: Ctx, st: BowlStyle, R: number, inner: number) {
  const midR = (R + inner) / 2;
  const ringW = R - inner;
  c.save();
  c.lineCap = 'round';
  switch (st.pattern) {
    case 'ring': {
      c.strokeStyle = st.patternColor;
      c.lineWidth = ringW * 0.16;
      circle(c, 0, 0, midR + ringW * 0.12);
      c.stroke();
      c.lineWidth = ringW * 0.07;
      circle(c, 0, 0, inner + ringW * 0.22);
      c.stroke();
      break;
    }
    case 'wave': {
      c.strokeStyle = st.patternColor;
      c.lineWidth = ringW * 0.13;
      c.beginPath();
      const n = 22;
      for (let i = 0; i <= n * 10; i++) {
        const a = (i / (n * 10)) * TAU;
        const rr = midR + Math.sin(a * n) * ringW * 0.22;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      c.stroke();
      break;
    }
    case 'dots': {
      c.fillStyle = st.patternColor;
      const n = 28;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        circle(c, Math.cos(a) * midR, Math.sin(a) * midR, ringW * 0.13);
        c.fill();
      }
      break;
    }
    case 'sakura': {
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.4;
        const x = Math.cos(a) * midR;
        const y = Math.sin(a) * midR;
        c.save();
        c.translate(x, y);
        c.rotate(a);
        const pr = ringW * 0.17;
        c.fillStyle = st.patternColor;
        for (let k = 0; k < 5; k++) {
          const pa = (k / 5) * TAU;
          ellipse(c, Math.cos(pa) * pr, Math.sin(pa) * pr, pr * 0.75, pr * 0.55);
          c.fill();
        }
        c.fillStyle = '#fff3c2';
        circle(c, 0, 0, pr * 0.4);
        c.fill();
        c.restore();
        // small leaf between
        const b = a + TAU / n / 2;
        c.fillStyle = rgba(st.patternColor, 0.6);
        circle(c, Math.cos(b) * midR, Math.sin(b) * midR, ringW * 0.07);
        c.fill();
      }
      break;
    }
    case 'speckle': {
      c.beginPath();
      c.arc(0, 0, R - 1, 0, TAU);
      c.arc(0, 0, inner + 1, 0, TAU, true);
      c.clip();
      speckle(c, -R, -R, R * 2, R * 2, 99, Math.round(R * 6), rgba(st.patternColor, 0.55));
      speckle(c, -R, -R, R * 2, R * 2, 7, Math.round(R * 2), 'rgba(255,255,255,0.35)');
      break;
    }
    default:
      break;
  }
  c.restore();
}

function bowlBaseSprite(styleId: string, S: number): HTMLCanvasElement {
  const st = bowlStyle(styleId);
  const box = Math.ceil(S * 1.24);
  return sprite(
    `bowlbase:${st.id}:${Math.round(S)}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      const R = S / 2;
      const inner = R - S * 0.09;
      // ground shadow
      softShadow(c, 0, S * 0.045, R * 1.08, R * 0.95, 0.28);
      // outer glaze ring
      circle(c, 0, 0, R);
      c.fillStyle = radial(c, -R * 0.35, -R * 0.4, R * 0.1, R * 1.5, [
        [0, shade(st.outer, 0.22)],
        [0.5, st.outer],
        [1, shade(st.outer, -0.28)],
      ]);
      c.fill();
      // ring inner edge shading (rim curvature)
      c.save();
      circle(c, 0, 0, R);
      c.clip();
      c.strokeStyle = 'rgba(0,0,0,0.12)';
      c.lineWidth = S * 0.02;
      circle(c, 0, 0, R - S * 0.005);
      c.stroke();
      c.restore();
      drawRimPattern(c, st, R, inner);
      // lip
      c.lineWidth = Math.max(1.2, S * 0.012);
      c.strokeStyle = rgba(st.rim, 0.85);
      circle(c, 0, 0, inner + c.lineWidth / 2);
      c.stroke();
      // outline
      c.lineWidth = 1.2;
      c.strokeStyle = OUT;
      circle(c, 0, 0, R);
      c.stroke();
      // inside glaze
      circle(c, 0, 0, inner);
      c.fillStyle = st.inner;
      c.fill();
      // concave shading: deeper centre darker, cast shadow under the top-left rim
      circle(c, 0, 0, inner);
      c.fillStyle = radial(c, inner * 0.12, inner * 0.14, 0, inner * 1.05, [
        [0, 'rgba(60,35,20,0.10)'],
        [0.55, 'rgba(60,35,20,0.03)'],
        [0.85, 'rgba(60,35,20,0.08)'],
        [1, 'rgba(60,35,20,0.26)'],
      ]);
      c.fill();
      // reflected light on the bottom-right wall
      circle(c, 0, 0, inner);
      c.fillStyle = radial(c, inner * 0.5, inner * 0.55, inner * 0.2, inner * 0.9, [
        [0, 'rgba(255,255,255,0.22)'],
        [1, 'rgba(255,255,255,0)'],
      ]);
      c.fill();
      // inner edge line
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(60,35,20,0.18)';
      circle(c, 0, 0, inner);
      c.stroke();
    },
    2
  );
}

function overflowSprite(broth: string, S: number, fill: number): HTMLCanvasElement {
  const f = Math.round(clamp(fill, 1.03, 1.2) * 50) / 50;
  const box = Math.ceil(S * 1.3);
  return sprite(
    `overflow:${broth}:${Math.round(S)}:${f}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      const R = S / 2;
      const inner = R - S * 0.09;
      const cfg = BROTHS[broth] ?? BROTHS.shoyu;
      const rand = rng(broth.length * 13 + Math.round(f * 100));
      const k = (f - 1.03) / 0.17; // 0..1
      const col = shade(cfg.col, 0.04, Math.min(0.95, cfg.alpha + 0.15));
      c.fillStyle = col;
      // thin film creeping over the rim ring
      c.save();
      c.globalAlpha = 0.45 + 0.3 * k;
      blobPath(
        c,
        0,
        0,
        inner + (R - inner) * (0.5 + 0.5 * k),
        inner + (R - inner) * (0.45 + 0.5 * k),
        rand,
        0.03,
        16
      );
      c.fill();
      c.restore();
      // tongues pouring over the rim, mostly on the lower half
      const nt = 3 + Math.round(k * 2);
      for (let i = 0; i < nt; i++) {
        const a = Math.PI * 0.15 + (i / nt) * Math.PI * 0.75 + rand() * 0.3;
        const wdt = R * (0.1 + rand() * 0.08) * (0.7 + k * 0.5);
        const out = R * (0.035 + rand() * 0.04 + k * 0.05);
        c.save();
        c.rotate(a);
        c.beginPath();
        c.moveTo(inner - 2, -wdt);
        c.bezierCurveTo(R + out * 1.3, -wdt * 1.1, R + out * 1.3, wdt * 1.1, inner - 2, wdt);
        c.closePath();
        c.fill();
        // drip hanging from the tongue
        if (rand() < 0.6) {
          const dl = R * (0.04 + rand() * 0.07) * (0.6 + k);
          const dw = R * 0.022;
          const dy = (rand() - 0.5) * wdt;
          c.beginPath();
          c.moveTo(R + out * 0.5, dy - dw);
          c.quadraticCurveTo(R + out * 0.5 + dl, dy - dw, R + out * 0.5 + dl + dw, dy);
          c.quadraticCurveTo(R + out * 0.5 + dl, dy + dw, R + out * 0.5, dy + dw);
          c.closePath();
          c.fill();
        }
        // sheen on the tongue
        c.fillStyle = 'rgba(255,255,255,0.22)';
        ellipse(c, R + out * 0.3, -wdt * 0.3, out * 0.4, wdt * 0.25);
        c.fill();
        c.fillStyle = col;
        c.restore();
      }
    },
    2
  );
}

function drawSteam(c: Ctx, S: number, t: number, amt: number) {
  const R = S / 2;
  c.save();
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ph = t * 0.35 + i * 0.37;
    const rise = ((ph % 1) + 1) % 1; // 0..1 looping
    const x0 = (i - 1) * R * 0.4 + Math.sin(ph * 2.3 + i) * R * 0.06;
    const y0 = -R * 0.1 - rise * R * 0.8;
    const alpha = amt * 0.5 * Math.sin(rise * Math.PI);
    if (alpha <= 0.01) continue;
    const sway = Math.sin(t * 1.3 + i * 2) * R * 0.08;
    const wave = (x: number, y: number) => {
      c.beginPath();
      c.moveTo(x, y + R * 0.45);
      c.bezierCurveTo(
        x - R * 0.1 + sway,
        y + R * 0.3,
        x + R * 0.12 - sway,
        y + R * 0.15,
        x + sway * 0.5,
        y
      );
      c.bezierCurveTo(
        x - R * 0.08,
        y - R * 0.08,
        x + R * 0.04,
        y - R * 0.16,
        x - R * 0.03,
        y - R * 0.24
      );
    };
    wave(x0, y0);
    c.lineWidth = S * 0.07;
    c.strokeStyle = `rgba(255,255,255,${alpha * 0.25})`;
    c.stroke();
    c.lineWidth = S * 0.035;
    c.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
    c.stroke();
  }
  c.restore();
}

export function drawBowlTop(
  c: Ctx,
  b: BowlState,
  size: number,
  t: number,
  opts?: { cook?: CookState; steam?: number }
): void {
  const S = size;
  const R = S / 2;
  const inner = R - S * 0.09;
  const k = S / 300;
  const cook = opts?.cook ?? cookOf(b);
  const noodleR = inner * 0.8;
  const sauce = isSauce(b.broth);
  const fill = clamp(b.fill, 0, 1.2);

  c.save();
  // 1. base (shadow + ceramic + inner shading)
  const base = bowlBaseSprite(b.style, S);
  const bb = Math.ceil(S * 1.24);
  c.drawImage(base, -bb / 2, -bb / 2, bb, bb);

  // 2. noodles (+ sauce)
  if (b.noodle) {
    if (sauce && b.broth && fill > 0.02) {
      // puddle of sauce under the nest
      c.fillStyle = radial(c, 0, 0, 0, noodleR * 0.9, [
        [0, rgba(SAUCES[b.broth], 0.5 * Math.min(1, fill))],
        [0.7, rgba(SAUCES[b.broth], 0.35 * Math.min(1, fill))],
        [1, rgba(SAUCES[b.broth], 0)],
      ]);
      circle(c, 0, 0, noodleR * 0.9);
      c.fill();
      const s = noodleSprite(b.noodle, b.thick, cook, noodleR, 11, {
        id: b.broth,
        amt: Math.min(1, fill),
      });
      const box = Math.round(noodleR) * 2 + 12;
      c.drawImage(s, -box / 2, -box / 2, box, box);
    } else {
      drawNoodles(c, b.noodle, b.thick, cook, noodleR, 11);
    }
  }

  // 3. broth
  if (b.broth && !sauce && fill > 0.02) {
    const f1 = Math.min(fill, 1);
    const rad = inner * (0.3 + 0.7 * f1);
    const disc = brothDisc(b.broth, rad);
    const db = Math.round(rad) * 2 + 4;
    c.drawImage(disc, -db / 2, -db / 2, db, db);
    if (fill > 1.03) {
      const ov = overflowSprite(b.broth, S, fill);
      const ob = Math.ceil(S * 1.3);
      c.drawImage(ov, -ob / 2, -ob / 2, ob, ob);
    }
    // the nest floats: redraw its centre over the liquid
    if (b.noodle && fill > 0.25) {
      const fs = noodleFloatSprite(b.noodle, b.thick, cook, noodleR, 11);
      const box = Math.round(noodleR) * 2 + 12;
      c.save();
      c.globalAlpha = cook === 'burnt' ? 0.55 : 0.9;
      c.drawImage(fs, -box / 2, -box / 2, box, box);
      c.restore();
    }
    // moving shimmer: one soft highlight arc
    const ph = t * 0.8;
    const hx = Math.cos(ph) * rad * 0.25 - rad * 0.3;
    const hy = Math.sin(ph * 1.3) * rad * 0.2 - rad * 0.3;
    c.save();
    circle(c, 0, 0, rad);
    c.clip();
    c.fillStyle = radial(c, hx, hy, 0, rad * 0.5, [
      [0, 'rgba(255,255,255,0.16)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    c.fillRect(-rad, -rad, rad * 2, rad * 2);
    c.restore();
  }

  // 4. pieces
  for (const p of b.pieces) {
    c.save();
    c.translate((p.x - 150) * k, (p.y - 150) * k);
    drawPiece(c, p.id, p.v, p.s * k, p.rot);
    c.restore();
  }

  // 5. rim highlight
  c.lineCap = 'round';
  c.lineWidth = S * 0.035;
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.beginPath();
  c.arc(0, 0, R - S * 0.045, Math.PI * 1.05, Math.PI * 1.45);
  c.stroke();
  c.lineWidth = S * 0.018;
  c.strokeStyle = 'rgba(255,255,255,0.22)';
  c.beginPath();
  c.arc(0, 0, R - S * 0.045, Math.PI * 0.12, Math.PI * 0.35);
  c.stroke();

  // 6. steam
  if (opts?.steam && opts.steam > 0.01) drawSteam(c, S, t, opts.steam);
  c.restore();
}

// ---------------------------------------------------------------------------
// Containers: tubs, trays, pots
// ---------------------------------------------------------------------------

function stonewareBody(c: Ctx, w: number, h: number, r: number, seed: number) {
  // soft shadow
  softShadow(c, w / 2, h * 0.56, w * 0.56, h * 0.5, 0.22);
  roundRect(c, 0, 0, w, h, r);
  c.fillStyle = c.createLinearGradient(0, 0, w * 0.3, h);
  (c.fillStyle as CanvasGradient).addColorStop(0, '#f6efe3');
  (c.fillStyle as CanvasGradient).addColorStop(1, '#e4d7c3');
  c.fill();
  c.save();
  c.clip();
  speckle(c, 0, 0, w, h, seed, Math.round(w * h * 0.02), 'rgba(110,80,50,0.16)');
  c.restore();
  c.lineWidth = 1.2;
  c.strokeStyle = OUT;
  c.stroke();
}

function tubCavity(c: Ctx, x: number, y: number, w: number, h: number, r: number, floor: string) {
  roundRect(c, x, y, w, h, r);
  c.fillStyle = floor;
  c.fill();
  // inner wall shadow: dark at top-left, lit at bottom-right
  roundRect(c, x, y, w, h, r);
  c.fillStyle = c.createLinearGradient(x, y, x + w * 0.6, y + h);
  (c.fillStyle as CanvasGradient).addColorStop(0, 'rgba(60,35,20,0.32)');
  (c.fillStyle as CanvasGradient).addColorStop(0.35, 'rgba(60,35,20,0.08)');
  (c.fillStyle as CanvasGradient).addColorStop(1, 'rgba(60,35,20,0.0)');
  c.fill();
  c.lineWidth = 1;
  c.strokeStyle = 'rgba(60,35,20,0.3)';
  c.stroke();
}

export function drawTub(c: Ctx, id: string, w: number, h: number): void {
  const s = sprite(
    `tub:${id}:${Math.round(w)}x${Math.round(h)}`,
    w + 8,
    h + 10,
    (cc) => {
      cc.translate(4, 3);
      const r = Math.min(w, h) * 0.16;
      stonewareBody(cc, w, h, r, id.length * 7);
      const inset = Math.min(w, h) * 0.1;
      const iw = w - inset * 2;
      const ih = h - inset * 2;
      tubCavity(cc, inset, inset, iw, ih, r * 0.7, '#e7dccb');
      // the pile
      const ps = PIECE_SIZE[id] ?? 30;
      const scale = clamp((Math.min(iw, ih) * 0.46) / ps, 0.45, 1.25);
      const n = clamp(Math.round(16 * Math.pow(30 / ps, 0.7) * (Math.min(iw, ih) / 70)), 8, 20);
      const rand = rng(id.length * 97 + 3);
      const nv = PIECE_VARIANTS[id] ?? 1;
      const pts: { x: number; y: number; v: number; rot: number; s: number }[] = [];
      for (let i = 0; i < n; i++) {
        const a = rand() * TAU;
        const d = Math.pow(rand(), 0.6);
        pts.push({
          x: inset + iw / 2 + Math.cos(a) * d * iw * 0.36,
          y: inset + ih / 2 + Math.sin(a) * d * ih * 0.34,
          v: Math.floor(rand() * nv),
          rot: rand() * TAU,
          s: scale * (0.85 + rand() * 0.3),
        });
      }
      pts.sort((p, q) => p.y - q.y);
      cc.save();
      roundRect(cc, inset, inset, iw, ih, r * 0.7);
      cc.clip();
      for (const p of pts) {
        cc.save();
        cc.translate(p.x, p.y);
        drawPiece(cc, id, p.v, p.s, p.rot);
        cc.restore();
      }
      // wall shadow over the pile at the top edge
      roundRect(cc, inset, inset, iw, ih, r * 0.7);
      cc.fillStyle = cc.createLinearGradient(0, inset, 0, inset + ih * 0.35);
      (cc.fillStyle as CanvasGradient).addColorStop(0, 'rgba(60,35,20,0.22)');
      (cc.fillStyle as CanvasGradient).addColorStop(1, 'rgba(60,35,20,0)');
      cc.fill();
      cc.restore();
      // tub top-edge highlight
      cc.lineWidth = 1.5;
      cc.strokeStyle = 'rgba(255,255,255,0.6)';
      cc.beginPath();
      cc.moveTo(r, 1.2);
      cc.lineTo(w - r, 1.2);
      cc.stroke();
    },
    2
  );
  c.save();
  c.drawImage(s, -4, -3, w + 8, h + 10);
  c.restore();
}

export function drawNoodleTray(c: Ctx, noodle: string, thick: Thick, w: number, h: number): void {
  const s = sprite(
    `tray:${noodle}:${thick}:${Math.round(w)}x${Math.round(h)}`,
    w + 8,
    h + 10,
    (cc) => {
      cc.translate(4, 3);
      softShadow(cc, w / 2, h * 0.56, w * 0.56, h * 0.5, 0.22);
      const r = Math.min(w, h) * 0.12;
      // frame
      roundRect(cc, 0, 0, w, h, r);
      cc.fillStyle = cc.createLinearGradient(0, 0, 0, h);
      (cc.fillStyle as CanvasGradient).addColorStop(0, '#d2a874');
      (cc.fillStyle as CanvasGradient).addColorStop(1, '#b4855a');
      cc.fill();
      cc.lineWidth = 1.2;
      cc.strokeStyle = OUT;
      cc.stroke();
      // bamboo slats
      const inset = Math.min(w, h) * 0.09;
      cc.save();
      roundRect(cc, inset, inset, w - inset * 2, h - inset * 2, r * 0.5);
      cc.clip();
      cc.fillStyle = '#d4b07a';
      cc.fillRect(inset, inset, w - inset * 2, h - inset * 2);
      const slat = Math.max(5, w * 0.075);
      const rand = rng(noodle.length * 5 + w);
      for (let x = inset; x < w - inset; x += slat) {
        cc.fillStyle = mix('#cfa86f', '#e2c48f', rand());
        cc.fillRect(x, inset, slat - 1.2, h - inset * 2);
        cc.fillStyle = 'rgba(120,80,40,0.25)';
        cc.fillRect(x + slat - 1.6, inset, 1.2, h - inset * 2);
        // bamboo node
        cc.fillStyle = 'rgba(120,80,40,0.18)';
        cc.fillRect(x, inset + (h - inset * 2) * (0.3 + rand() * 0.4), slat - 1.2, 1.3);
      }
      // inner shadow
      cc.fillStyle = cc.createLinearGradient(0, inset, 0, inset + h * 0.3);
      (cc.fillStyle as CanvasGradient).addColorStop(0, 'rgba(60,35,20,0.28)');
      (cc.fillStyle as CanvasGradient).addColorStop(1, 'rgba(60,35,20,0)');
      cc.fillRect(inset, inset, w - inset * 2, h - inset * 2);
      cc.restore();
      roundRect(cc, inset, inset, w - inset * 2, h - inset * 2, r * 0.5);
      cc.lineWidth = 1;
      cc.strokeStyle = 'rgba(60,35,20,0.3)';
      cc.stroke();
      // dry nest
      cc.save();
      cc.translate(w / 2, h / 2 + 1);
      const nr = Math.min(w, h) * 0.4;
      const kk = 0.72;
      cc.scale(Math.min(1.25, (w * 0.45) / nr) * kk, kk);
      drawNoodles(cc, noodle, thick, 'raw', Math.round(nr / kk), 5);
      cc.restore();
    },
    2
  );
  c.save();
  c.drawImage(s, -4, -3, w + 8, h + 10);
  c.restore();
}

function potBaseSprite(broth: string, w: number, h: number): HTMLCanvasElement {
  return sprite(
    `pot:${broth}:${Math.round(w)}x${Math.round(h)}`,
    w + 12,
    h + 12,
    (c) => {
      c.translate(w / 2 + 6, h / 2 + 6);
      const S = Math.min(w, h);
      const R = S * 0.42;
      if (isSauce(broth)) {
        // squat ceramic jar from above with a spoon
        softShadow(c, 0, S * 0.05, R * 1.15, R * 1.0, 0.25);
        circle(c, 0, 0, R);
        c.fillStyle = radial(c, -R * 0.3, -R * 0.3, R * 0.1, R * 1.4, [
          [0, '#fbf5ea'],
          [0.6, '#eadfcc'],
          [1, '#cbbba2'],
        ]);
        c.fill();
        c.lineWidth = 1.2;
        c.strokeStyle = OUT;
        c.stroke();
        const ir = R * 0.74;
        const col = SAUCES[broth];
        circle(c, 0, 0, ir);
        c.fillStyle = radial(c, 0, 0, ir * 0.2, ir, [
          [0, shade(col, -0.1)],
          [0.85, col],
          [1, shade(col, 0.15)],
        ]);
        c.fill();
        c.lineWidth = Math.max(1.5, ir * 0.06);
        c.strokeStyle = 'rgba(60,35,20,0.35)';
        c.stroke();
        // glaze gloss
        c.fillStyle = radial(c, -ir * 0.35, -ir * 0.4, 0, ir * 0.7, [
          [0, 'rgba(255,255,255,0.35)'],
          [1, 'rgba(255,255,255,0)'],
        ]);
        circle(c, 0, 0, ir);
        c.fill();
        // spoon across
        c.save();
        c.rotate(-0.6);
        c.lineCap = 'round';
        c.lineWidth = S * 0.05;
        c.strokeStyle = '#c99a6b';
        c.beginPath();
        c.moveTo(-R * 0.15, 0);
        c.lineTo(R * 1.15, 0);
        c.stroke();
        c.lineWidth = S * 0.02;
        c.strokeStyle = 'rgba(255,240,210,0.5)';
        c.beginPath();
        c.moveTo(-R * 0.1, -S * 0.012);
        c.lineTo(R * 1.1, -S * 0.012);
        c.stroke();
        ellipse(c, -R * 0.3, 0, S * 0.1, S * 0.07);
        c.fillStyle = '#d8ad7c';
        c.fill();
        c.lineWidth = 1;
        c.strokeStyle = OUT;
        c.stroke();
        ellipse(c, -R * 0.3, 0, S * 0.07, S * 0.045);
        c.fillStyle = shade(col, 0.05);
        c.fill();
        c.restore();
        return;
      }
      // metal stock pot
      softShadow(c, 0, S * 0.05, R * 1.2, R * 1.05, 0.28);
      // handles
      c.lineCap = 'round';
      c.lineWidth = S * 0.055;
      c.strokeStyle = '#4a4a50';
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.arc(
          sx * R * 1.02,
          0,
          S * 0.1,
          sx > 0 ? -1.2 : Math.PI - 1.2,
          sx > 0 ? 1.2 : Math.PI + 1.2
        );
        c.stroke();
      }
      c.lineWidth = S * 0.02;
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.arc(
          sx * R * 1.02,
          -S * 0.012,
          S * 0.1,
          sx > 0 ? -1.0 : Math.PI - 1.0,
          sx > 0 ? 0.6 : Math.PI + 0.6
        );
        c.stroke();
      }
      circle(c, 0, 0, R);
      c.fillStyle = radial(c, -R * 0.4, -R * 0.45, R * 0.1, R * 1.5, [
        [0, '#b9bcc4'],
        [0.4, '#80848e'],
        [1, '#454851'],
      ]);
      c.fill();
      c.lineWidth = 1.2;
      c.strokeStyle = 'rgba(20,20,30,0.4)';
      c.stroke();
      // rim ring highlight
      c.lineWidth = R * 0.05;
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.beginPath();
      c.arc(0, 0, R * 0.95, Math.PI * 1.05, Math.PI * 1.5);
      c.stroke();
      const ir = R * 0.86;
      // dark inner wall
      circle(c, 0, 0, ir);
      c.fillStyle = '#2d2f36';
      c.fill();
      // broth
      renderLiquid(c, broth, ir * 0.97, 1);
      // ladle
      c.save();
      c.rotate(0.75);
      c.lineCap = 'round';
      c.lineWidth = S * 0.045;
      c.strokeStyle = '#8a8d96';
      c.beginPath();
      c.moveTo(R * 0.25, 0);
      c.lineTo(R * 1.25, 0);
      c.stroke();
      c.lineWidth = S * 0.015;
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.beginPath();
      c.moveTo(R * 0.3, -S * 0.01);
      c.lineTo(R * 1.2, -S * 0.01);
      c.stroke();
      circle(c, R * 0.22, 0, S * 0.12);
      c.fillStyle = radial(c, R * 0.18, -S * 0.04, 0, S * 0.16, [
        [0, '#c9ccd3'],
        [1, '#6d707a'],
      ]);
      c.fill();
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(20,20,30,0.4)';
      c.stroke();
      circle(c, R * 0.22, 0, S * 0.085);
      c.fillStyle = shade((BROTHS[broth] ?? BROTHS.shoyu).col, 0.05, 0.9);
      c.fill();
      c.restore();
    },
    2
  );
}

export function drawPot(c: Ctx, broth: string, w: number, h: number, t: number): void {
  const s = potBaseSprite(broth, w, h);
  c.save();
  c.drawImage(s, -6, -6, w + 12, h + 12);
  if (!isSauce(broth)) {
    const S = Math.min(w, h);
    const ir = S * 0.42 * 0.86;
    const ph = t * 0.7;
    const hx = w / 2 + Math.cos(ph) * ir * 0.3 - ir * 0.2;
    const hy = h / 2 + Math.sin(ph * 1.4) * ir * 0.25 - ir * 0.2;
    c.save();
    circle(c, w / 2, h / 2, ir);
    c.clip();
    c.fillStyle = radial(c, hx, hy, 0, ir * 0.5, [
      [0, 'rgba(255,255,255,0.2)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    c.fillRect(0, 0, w, h);
    // faint bubbles ring
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const bt = (t * 0.5 + i * 0.33) % 1;
      circle(
        c,
        w / 2 + Math.cos(i * 2.1) * ir * 0.45,
        h / 2 + Math.sin(i * 2.1) * ir * 0.45,
        ir * 0.06 + bt * ir * 0.12
      );
      c.globalAlpha = 1 - bt;
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// Bowl icon (3/4 view) and ingredient thumbnails
// ---------------------------------------------------------------------------

export function drawBowlIcon(c: Ctx, style: string, size: number): void {
  const st = bowlStyle(style);
  const s = sprite(
    `bowlicon:${st.id}:${Math.round(size)}`,
    size * 1.2,
    size * 1.2,
    (cc) => {
      cc.translate(size * 0.6, size * 0.6);
      const W = size * 0.46; // half width
      const topY = -size * 0.14;
      const ry = W * 0.42;
      softShadow(cc, 0, size * 0.36, W * 1.05, W * 0.3, 0.26);
      // body
      cc.beginPath();
      cc.moveTo(-W, topY);
      cc.bezierCurveTo(-W * 0.95, size * 0.28, -W * 0.5, size * 0.36, 0, size * 0.36);
      cc.bezierCurveTo(W * 0.5, size * 0.36, W * 0.95, size * 0.28, W, topY);
      cc.closePath();
      cc.fillStyle = cc.createLinearGradient(-W, 0, W, 0);
      (cc.fillStyle as CanvasGradient).addColorStop(0, shade(st.outer, -0.12));
      (cc.fillStyle as CanvasGradient).addColorStop(0.3, shade(st.outer, 0.18));
      (cc.fillStyle as CanvasGradient).addColorStop(0.7, st.outer);
      (cc.fillStyle as CanvasGradient).addColorStop(1, shade(st.outer, -0.3));
      cc.fill();
      cc.save();
      cc.clip();
      // pattern band near the top
      cc.save();
      cc.translate(0, topY + ry * 0.9);
      cc.scale(1, 0.42);
      drawRimPattern(cc, st, W * 1.02, W * 0.78);
      cc.restore();
      // bottom darkening
      cc.fillStyle = cc.createLinearGradient(0, 0, 0, size * 0.36);
      (cc.fillStyle as CanvasGradient).addColorStop(0, 'rgba(0,0,0,0)');
      (cc.fillStyle as CanvasGradient).addColorStop(1, 'rgba(40,20,10,0.25)');
      cc.fillRect(-W, 0, W * 2, size * 0.4);
      cc.restore();
      cc.lineWidth = 1.1;
      cc.strokeStyle = OUT;
      cc.stroke();
      // foot
      cc.fillStyle = shade(st.outer, -0.25);
      ellipse(cc, 0, size * 0.37, W * 0.38, W * 0.07);
      cc.fill();
      // opening
      ellipse(cc, 0, topY, W, ry);
      cc.fillStyle = st.inner;
      cc.fill();
      ellipse(cc, 0, topY, W, ry);
      cc.fillStyle = radial(cc, 0, topY + ry * 0.3, 0, W, [
        [0, 'rgba(60,35,20,0.12)'],
        [0.7, 'rgba(60,35,20,0.05)'],
        [1, 'rgba(60,35,20,0.28)'],
      ]);
      cc.fill();
      // cast shadow from far rim
      cc.save();
      ellipse(cc, 0, topY, W, ry);
      cc.clip();
      cc.fillStyle = 'rgba(60,35,20,0.22)';
      ellipse(cc, 0, topY - ry * 0.5, W * 0.95, ry * 0.7);
      cc.fill();
      cc.restore();
      // lip
      cc.lineWidth = Math.max(1.2, size * 0.028);
      cc.strokeStyle = st.rim;
      ellipse(cc, 0, topY, W, ry);
      cc.stroke();
      cc.lineWidth = 1;
      cc.strokeStyle = OUT;
      cc.stroke();
      // gloss
      cc.strokeStyle = 'rgba(255,255,255,0.5)';
      cc.lineWidth = Math.max(1, size * 0.02);
      cc.beginPath();
      cc.ellipse(0, topY, W * 0.92, ry * 0.85, 0, Math.PI * 1.1, Math.PI * 1.5);
      cc.stroke();
      cc.beginPath();
      cc.moveTo(-W * 0.72, topY + ry * 1.4);
      cc.quadraticCurveTo(-W * 0.7, size * 0.2, -W * 0.45, size * 0.28);
      cc.strokeStyle = 'rgba(255,255,255,0.35)';
      cc.stroke();
    },
    2
  );
  c.save();
  c.drawImage(s, -size * 0.6, -size * 0.6, size * 1.2, size * 1.2);
  c.restore();
}

export function drawIngredientIcon(c: Ctx, id: string, size: number): void {
  const s = sprite(
    `icon:${id}:${Math.round(size)}`,
    size,
    size,
    (cc) => {
      cc.translate(size / 2, size / 2);
      if (id in PIECE_SIZE) {
        const sc = (size * 0.78) / PIECE_SIZE[id];
        drawPiece(cc, id, 0, sc, id === 'nori' || id === 'karides' || id === 'bambu' ? -0.35 : 0);
      } else if (id in NOODLES) {
        drawNoodles(cc, id, 'orta', 'perfect', size * 0.42, 3);
      } else if (id in SAUCES) {
        // small jar
        const R = size * 0.4;
        softShadow(cc, 0, size * 0.06, R * 1.1, R, 0.22);
        circle(cc, 0, 0, R);
        cc.fillStyle = radial(cc, -R * 0.3, -R * 0.3, 0, R * 1.4, [
          [0, '#fbf5ea'],
          [1, '#cbbba2'],
        ]);
        cc.fill();
        cc.lineWidth = 1;
        cc.strokeStyle = OUT;
        cc.stroke();
        const ir = R * 0.72;
        circle(cc, 0, 0, ir);
        cc.fillStyle = radial(cc, 0, 0, 0, ir, [
          [0, shade(SAUCES[id], -0.1)],
          [1, shade(SAUCES[id], 0.12)],
        ]);
        cc.fill();
        cc.strokeStyle = 'rgba(60,35,20,0.35)';
        cc.stroke();
        gloss(cc, -ir * 0.35, -ir * 0.4, ir * 0.6, 0.4);
      } else if (id in BROTHS) {
        // small cup of liquid
        const R = size * 0.42;
        softShadow(cc, 0, size * 0.06, R * 1.1, R, 0.22);
        circle(cc, 0, 0, R);
        cc.fillStyle = radial(cc, -R * 0.3, -R * 0.3, 0, R * 1.4, [
          [0, '#ffffff'],
          [1, '#d9cfc0'],
        ]);
        cc.fill();
        cc.lineWidth = 1;
        cc.strokeStyle = OUT;
        cc.stroke();
        circle(cc, 0, 0, R * 0.8);
        cc.fillStyle = 'rgba(60,35,20,0.1)';
        cc.fill();
        renderLiquid(cc, id, R * 0.78, 1);
      } else {
        circle(cc, 0, 0, size * 0.35);
        cc.fillStyle = PAL.sand;
        cc.fill();
      }
    },
    2
  );
  c.save();
  c.drawImage(s, -size / 2, -size / 2, size, size);
  c.restore();
}
