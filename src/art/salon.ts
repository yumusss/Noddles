// The dining room ("salon") of a small Japanese noodle café, seen from the kitchen side.
// drawSalonBack  → wall, floor, doorway + noren, window + sakura tree, menu board, scroll,
//                  shelf, lanterns, plants, tables, benches, diners (+ animated petals)
// (the counter customer and the queue are drawn by the game between the two passes)
// drawSalonFront → counter top, slatted front, register, tip jar, tablet, delivery box, decoration
// drawSalonLight → time-of-day tint, window light on the floor, lantern pools, vignette
import {
  PAL,
  TOD_LIGHT,
  type Ctx,
  type Tod,
  circle,
  clamp,
  clearSprites,
  ellipse,
  gloss,
  mix,
  rgba,
  rng,
  roundRect,
  shade,
  softShadow,
  speckle,
  sprite,
  vGrad,
} from './common';
import { drawAvatar, type Look, type Mood } from './avatar';
import type { DecorState } from '../game/decor';
import { tableCount } from '../game/decor';

export interface SalonLayout {
  counterTop: number;
  customer: { x: number; y: number; size: number };
  register: { x: number; y: number; w: number; h: number };
  tipJar: { x: number; y: number; w: number; h: number };
  /** The order tablet (kept under its historical name). */
  phone: { x: number; y: number; w: number; h: number };
  deliveryBox: { x: number; y: number; w: number; h: number };
  catSpots: { x: number; y: number }[];
  seats: { x: number; y: number; size: number; table: number }[];
  /** Standing spots for people waiting in line behind the counter customer. */
  queue: { x: number; y: number; size: number }[];
}

export interface Diner {
  seat: number;
  look: Look;
  mood: Mood;
  bob: number;
  eating: boolean;
  /** Seated but not served yet: shows a small floating ticket instead of a bowl. */
  waiting?: boolean;
}
export interface SalonOpts {
  rain?: boolean;
  diners: Diner[];
  phoneRinging?: boolean;
  boxOpen?: boolean;
  tipCoins: number;
  cashOnCounter?: boolean;
  lampsOn?: boolean;
}

type Rect = { x: number; y: number; w: number; h: number };

const OUT = 'rgba(60,35,20,0.25)';
const INK = 'rgba(58,42,34,0.9)';
const INDIGO = '#2f3a66';
const INDIGO_D = '#232b4f';
const WALNUT = '#5b3f2c';
const WALNUT_L = '#7a573d';
const PINK = '#f4b9c9';
const PINK_L = '#fbd7e0';
const PINK_X = '#fff0f4';

// ---------- geometry ----------
interface Geo {
  land: boolean;
  counterTop: number;
  counterSurf: number; // bottom of the visible counter-top band (items stand here)
  floorY: number;
  depth: number;
  iw: number; // item scale
  beam: number; // ceiling beam height
  win: Rect;
  door: Rect;
  board: Rect;
  scroll: Rect;
  shelf: { x: number; y: number; w: number };
  lamps: { x: number; y: number }[];
  plant: { x: number; y: number; h: number };
  tables: { x: number; ground: number; w: number; h: number; scale: number }[];
  decoX: number;
}

function geo(W: number, H: number, decor: DecorState): Geo {
  const land = W > H;
  const ch = land ? H * 0.28 : clamp(H * 0.19, 200, 300);
  const counterTop = H - ch;
  const floorY = land ? counterTop - H * 0.19 : counterTop - H * 0.3;
  const depth = counterTop - floorY;
  const iw = 1;
  const f = floorY;
  const beam = land ? f * 0.06 : f * 0.04;
  const win = land
    ? { x: W * 0.565, y: f * 0.13, w: W * 0.37, h: f * 0.58 }
    : { x: W * 0.42, y: f * 0.25, w: W * 0.53, h: f * 0.4 };
  const door = land
    ? { x: W * 0.03, y: f * 0.2, w: W * 0.105, h: f * 0.8 }
    : { x: W * 0.04, y: f * 0.44, w: W * 0.2, h: f * 0.56 };
  const board = land
    ? { x: W * 0.19, y: f * 0.1, w: W * 0.215, h: f * 0.2 }
    : { x: W * 0.44, y: f * 0.055, w: W * 0.46, h: f * 0.14 };
  const scroll = land
    ? { x: W * 0.47 - W * 0.035, y: f * 0.085, w: W * 0.07, h: f * 0.41 }
    : { x: W * 0.31 - W * 0.055, y: f * 0.3, w: W * 0.11, h: f * 0.36 };
  const shelf = land
    ? { x: W * 0.19, y: f * 0.7, w: W * 0.215 }
    : { x: W * 0.47, y: f * 0.84, w: W * 0.42 };
  const lampXs = land ? [0.163, 0.535] : [0.14, 0.33];
  const lamps = lampXs.map((fx) => ({ x: W * fx, y: f * (land ? 0.3 : 0.17) }));
  const plant = { x: W * 0.955, y: floorY + depth * 0.5, h: land ? H * 0.27 : W * 0.3 };
  const tw = land ? W * 0.17 : W * 0.3;
  const n = tableCount(decor);
  const spots: [number, number, number][] = land
    ? [
        [0.19, 0.8, 1],
        [0.81, 0.8, 1],
        [0.36, 0.3, 0.8],
        [0.64, 0.3, 0.8],
      ]
    : [
        [0.17, 0.8, 1],
        [0.83, 0.8, 1],
        [0.3, 0.3, 0.78],
        [0.7, 0.3, 0.78],
      ];
  const tables = spots.slice(0, n).map(([fx, d, s]) => ({
    x: W * fx,
    ground: floorY + depth * d,
    w: tw * s,
    h: tw * 0.42 * s,
    scale: s,
  }));
  const decoX = land ? W * 0.7 : W * 0.56;
  return {
    land,
    counterTop,
    counterSurf: counterTop + ch * 0.42,
    floorY,
    depth,
    iw,
    beam,
    win,
    door,
    board,
    scroll,
    shelf,
    lamps,
    plant,
    tables,
    decoX,
  };
}

export function salonLayout(W: number, H: number, decor: DecorState): SalonLayout {
  const g = geo(W, H, decor);
  const { counterTop, iw } = g;
  const base = g.counterSurf - (g.counterSurf - counterTop) * 0.3;
  const size = g.land ? H * 0.52 : W * 0.7;
  const rw = 150 * iw;
  const rh = 108 * iw;
  const register = { x: W - 28 * iw - rw, y: base - rh, w: rw, h: rh };
  const jw = 62 * iw;
  const jh = 82 * iw;
  const tipJar = { x: register.x - 26 * iw - jw, y: base - jh, w: jw, h: jh };
  const pw = 118 * iw;
  const ph = 96 * iw;
  const phone = { x: g.land ? W * 0.165 : W * 0.21, y: base - ph, w: pw, h: ph };
  const bw = 128 * iw;
  const bh = 92 * iw;
  const deliveryBox = { x: 22 * iw, y: base - bh, w: bw, h: bh };
  const catSpots = [
    { x: phone.x + pw + 70 * iw, y: base },
    { x: W * 0.9, y: g.floorY + g.depth * 0.95 },
    { x: W * 0.08, y: g.floorY + g.depth * 0.98 },
  ];
  const seats: SalonLayout['seats'] = [];
  g.tables.forEach((t, i) => {
    const top = t.ground - t.h;
    const sz = (g.land ? 140 : 118) * t.scale;
    seats.push({ x: t.x - t.w * 0.27, y: top + t.h * 0.3, size: sz, table: i });
    seats.push({ x: t.x + t.w * 0.27, y: top + t.h * 0.3, size: sz, table: i });
  });
  const customer = { x: W / 2, y: counterTop + size * 0.12, size };
  const queue: SalonLayout['queue'] = [];
  for (let i = 0; i < 3; i++) {
    if (g.land) {
      const qs = size * (0.78 - i * 0.03);
      queue.push({
        x: customer.x + size * 0.68 + i * qs * 0.44,
        y: customer.y - size * 0.1 - i * 12,
        size: qs,
      });
    } else {
      const qs = size * (0.78 - i * 0.1);
      queue.push({
        x: customer.x + size * (0.26 + i * 0.08),
        y: customer.y - size * (0.14 + i * 0.1),
        size: qs,
      });
    }
  }
  return {
    counterTop,
    customer,
    register,
    tipJar,
    phone,
    deliveryBox,
    catSpots,
    seats,
    queue,
  };
}

// ---------- small shared bits ----------
function stroke(c: Ctx, col = OUT, w = 1.2) {
  c.strokeStyle = col;
  c.lineWidth = w;
  c.stroke();
}

function grainLines(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  n: number,
  col: string,
  vertical = false
) {
  const r = rng(seed);
  c.strokeStyle = col;
  c.lineWidth = 1;
  c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    if (vertical) {
      const gx = x + r() * w;
      const gy = y + r() * h * 0.6;
      const len = h * (0.15 + r() * 0.3);
      c.beginPath();
      c.moveTo(gx, gy);
      c.bezierCurveTo(gx + 1.5, gy + len * 0.3, gx - 1.5, gy + len * 0.6, gx + 0.5, gy + len);
      c.stroke();
    } else {
      const gy = y + r() * h;
      const gx = x + r() * w * 0.6;
      const len = w * (0.15 + r() * 0.3);
      c.beginPath();
      c.moveTo(gx, gy);
      c.bezierCurveTo(gx + len * 0.3, gy + 1.2, gx + len * 0.6, gy - 1.2, gx + len, gy + 0.4);
      c.stroke();
    }
  }
}

/** A single sakura petal: a soft teardrop with a tiny notch at the tip. */
function petal(c: Ctx, x: number, y: number, r: number, rot: number, col: string) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, -r);
  c.bezierCurveTo(r * 0.9, -r * 0.9, r * 0.9, r * 0.5, r * 0.25, r);
  c.lineTo(0, r * 0.75);
  c.lineTo(-r * 0.25, r);
  c.bezierCurveTo(-r * 0.9, r * 0.5, -r * 0.9, -r * 0.9, 0, -r);
  c.closePath();
  c.fill();
  c.restore();
}

/** Five-petal blossom with a honey centre. */
function blossom(c: Ctx, x: number, y: number, r: number, col: string, centre = true) {
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2;
    petal(c, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.6, a + Math.PI / 2, col);
  }
  if (centre) {
    c.fillStyle = 'rgba(232,179,90,0.9)';
    circle(c, x, y, r * 0.22);
    c.fill();
  }
}

/** Soft blossom cluster (distance look): overlapping puffs in three pinks. */
function blossomPuff(c: Ctx, x: number, y: number, r: number, seed: number) {
  const rr = rng(seed);
  c.fillStyle = '#eaa4b9';
  for (let i = 0; i < 5; i++) {
    circle(c, x + (rr() - 0.5) * r * 1.5, y + r * 0.25 + (rr() - 0.5) * r, r * (0.4 + rr() * 0.35));
    c.fill();
  }
  c.fillStyle = PINK;
  for (let i = 0; i < 7; i++) {
    circle(c, x + (rr() - 0.5) * r * 1.6, y + (rr() - 0.5) * r * 1.2, r * (0.45 + rr() * 0.35));
    c.fill();
  }
  c.fillStyle = PINK_L;
  for (let i = 0; i < 5; i++) {
    circle(
      c,
      x + (rr() - 0.5) * r * 1.3,
      y - r * 0.15 + (rr() - 0.5) * r * 0.9,
      r * (0.3 + rr() * 0.3)
    );
    c.fill();
  }
  c.fillStyle = PINK_X;
  for (let i = 0; i < 3; i++) {
    circle(c, x + (rr() - 0.5) * r, y - r * 0.3 + (rr() - 0.5) * r * 0.6, r * (0.15 + rr() * 0.2));
    c.fill();
  }
}

/** Invented brush-calligraphy "character" in a square cell of size s. */
function brushChar(c: Ctx, x: number, y: number, s: number, seed: number, col = INK) {
  const r = rng(seed);
  c.save();
  c.strokeStyle = col;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const n = 4 + Math.floor(r() * 4);
  // pick a "radical" layout: 0 = plain, 1 = boxed, 2 = roofed
  const layout = Math.floor(r() * 3);
  const w0 = s * (0.07 + r() * 0.04);
  c.lineWidth = w0;
  if (layout === 1) {
    c.lineWidth = w0 * 1.1;
    c.strokeRect(x + s * 0.18, y + s * 0.22, s * 0.64, s * 0.56);
  } else if (layout === 2) {
    c.beginPath();
    c.moveTo(x + s * 0.12, y + s * 0.3);
    c.lineTo(x + s * 0.5, y + s * 0.12);
    c.lineTo(x + s * 0.88, y + s * 0.3);
    c.stroke();
  }
  for (let i = 0; i < n; i++) {
    const kind = Math.floor(r() * 7);
    const w = w0 * (0.85 + r() * 0.4);
    c.lineWidth = w;
    c.beginPath();
    switch (kind) {
      case 0:
      case 1: {
        // horizontal with a heavy head
        const yy = y + s * (0.2 + r() * 0.6);
        const x0 = x + s * (0.1 + r() * 0.15);
        const x1 = x + s * (0.7 + r() * 0.2);
        c.moveTo(x0, yy);
        c.quadraticCurveTo((x0 + x1) / 2, yy - s * 0.03, x1, yy - s * 0.02);
        c.stroke();
        c.lineWidth = w * 1.5;
        c.beginPath();
        c.moveTo(x0, yy);
        c.lineTo(x0 + (x1 - x0) * 0.2, yy - s * 0.01);
        c.stroke();
        break;
      }
      case 2: {
        // vertical, slightly tapering
        const xx = x + s * (0.25 + r() * 0.5);
        const y0 = y + s * (0.1 + r() * 0.2);
        c.moveTo(xx, y0);
        c.quadraticCurveTo(
          xx + s * 0.02,
          (y0 + y + s * 0.9) / 2,
          xx - s * 0.01,
          y + s * (0.8 + r() * 0.12)
        );
        c.stroke();
        break;
      }
      case 3: {
        // left sweep
        const x0 = x + s * (0.5 + r() * 0.25);
        c.moveTo(x0, y + s * (0.2 + r() * 0.2));
        c.quadraticCurveTo(x0 - s * 0.1, y + s * 0.65, x + s * 0.1, y + s * 0.9);
        c.stroke();
        break;
      }
      case 4: {
        // right press stroke (thickening)
        const x0 = x + s * (0.35 + r() * 0.2);
        const y0 = y + s * (0.3 + r() * 0.2);
        c.moveTo(x0, y0);
        c.lineTo(x + s * 0.82, y + s * 0.86);
        c.stroke();
        c.lineWidth = w * 1.7;
        c.beginPath();
        c.moveTo(x + s * 0.7, y + s * 0.72);
        c.lineTo(x + s * 0.86, y + s * 0.86);
        c.stroke();
        break;
      }
      case 5: {
        // dot
        c.lineWidth = w * 1.5;
        const dx = x + s * (0.2 + r() * 0.6);
        const dy = y + s * (0.08 + r() * 0.3);
        c.moveTo(dx, dy);
        c.lineTo(dx + s * 0.07, dy + s * 0.09);
        c.stroke();
        break;
      }
      default: {
        // hook
        const xx = x + s * (0.55 + r() * 0.25);
        c.moveTo(xx, y + s * (0.15 + r() * 0.2));
        c.lineTo(xx, y + s * 0.76);
        c.quadraticCurveTo(xx - s * 0.04, y + s * 0.9, xx - s * 0.2, y + s * 0.8);
        c.stroke();
      }
    }
  }
  c.restore();
}

/** Seigaiha (overlapping waves) pattern in a rect, as thin light strokes. */
function seigaiha(c: Ctx, x: number, y: number, w: number, h: number, r: number, col: string) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = col;
  c.lineWidth = 1.1;
  let row = 0;
  for (let yy = y + h; yy > y - r; yy -= r * 0.55) {
    const off = row % 2 ? r : 0;
    for (let xx = x - r + off; xx < x + w + r; xx += r * 2) {
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.arc(xx, yy, r * (1 - k * 0.28), Math.PI, 0);
        c.stroke();
      }
    }
    row++;
  }
  c.restore();
}

// ---------- wall ----------
function drawWall(c: Ctx, W: number, g: Geo, id: string) {
  const f = g.floorY;
  switch (id) {
    case 'duvar-sage': {
      c.fillStyle = vGrad(c, 0, f, '#d3dcc6', '#b9c7a9');
      c.fillRect(0, 0, W, f);
      speckle(c, 0, 0, W, f, 11, 1200, 'rgba(255,255,255,0.2)');
      speckle(c, 0, 0, W, f, 12, 600, 'rgba(60,80,40,0.05)');
      break;
    }
    case 'duvar-kiremit': {
      c.fillStyle = vGrad(c, 0, f, '#e4b098', '#d09274');
      c.fillRect(0, 0, W, f);
      speckle(c, 0, 0, W, f, 21, 1200, 'rgba(255,240,220,0.2)');
      speckle(c, 0, 0, W, f, 22, 600, 'rgba(90,40,20,0.06)');
      break;
    }
    case 'duvar-shoji': {
      c.fillStyle = vGrad(c, 0, f, '#fdf6ea', '#f4e9d6');
      c.fillRect(0, 0, W, f);
      speckle(c, 0, 0, W, f, 31, 900, 'rgba(200,170,130,0.08)');
      // delicate kumiko lattice: tall cells with a thin inner sub-grid
      const cell = Math.max(64, W / 14);
      c.strokeStyle = 'rgba(150,105,65,0.75)';
      c.lineWidth = 3;
      for (let x = (W / 2) % cell; x <= W + 1; x += cell) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, f);
        c.stroke();
      }
      for (let y = f * 0.1; y < f; y += cell * 1.3) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }
      c.strokeStyle = 'rgba(150,105,65,0.28)';
      c.lineWidth = 1;
      for (let x = ((W / 2) % cell) + cell / 2; x <= W + 1; x += cell) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, f);
        c.stroke();
      }
      break;
    }
    case 'duvar-sakura': {
      c.fillStyle = vGrad(c, 0, f, '#fcf0ee', '#f7e0e1');
      c.fillRect(0, 0, W, f);
      const r = rng(41);
      for (let i = 0; i < W / 7; i++) {
        const px = r() * W;
        const py = r() * f;
        const s = 4 + r() * 4;
        const col = r() < 0.65 ? 'rgba(236,170,188,0.55)' : 'rgba(255,255,255,0.75)';
        if (r() < 0.6) blossom(c, px, py, s, col, true);
        else petal(c, px, py, s * 0.5, r() * 6.28, col);
      }
      break;
    }
    default: {
      // hinoki: pale warm planks with gentle grain
      c.fillStyle = vGrad(c, 0, f, '#f7e8d2', '#efd8b8');
      c.fillRect(0, 0, W, f);
      const pw = Math.max(58, W / 18);
      const r = rng(51);
      for (let x = 0; x < W; x += pw) {
        c.fillStyle = `rgba(200,150,95,${0.03 + r() * 0.07})`;
        c.fillRect(x, 0, pw, f);
        c.strokeStyle = 'rgba(150,100,60,0.2)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, f);
        c.stroke();
        grainLines(c, x + 4, 0, pw - 8, f, 60 + x, 6, 'rgba(150,100,60,0.12)', true);
      }
    }
  }
  // ambient darkening toward the floor + light from above
  c.fillStyle = vGrad(c, f * 0.55, f, 'rgba(60,35,20,0)', 'rgba(60,35,20,0.13)');
  c.fillRect(0, f * 0.55, W, f * 0.45);
  c.fillStyle = vGrad(c, 0, f * 0.35, 'rgba(255,245,225,0.22)', 'rgba(255,245,225,0)');
  c.fillRect(0, 0, W, f * 0.35);

  // lower wainscot: vertical hinoki slats (koshi-ita) below the window sill
  const wy = f * 0.79;
  c.fillStyle = vGrad(c, wy, f, '#d9ad7c', '#c3925f');
  c.fillRect(0, wy, W, f - wy);
  const sw = Math.max(10, W / 90);
  for (let x = 0; x < W; x += sw) {
    c.fillStyle = 'rgba(60,35,20,0.14)';
    c.fillRect(x, wy, 1.4, f - wy);
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.fillRect(x + 1.4, wy, 1.2, f - wy);
  }
  // rail on top of the wainscot
  c.fillStyle = vGrad(c, wy - 6, wy + 2, WALNUT_L, WALNUT);
  c.fillRect(0, wy - 6, W, 8);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  c.fillRect(0, wy - 6, W, 1.5);
  c.fillStyle = vGrad(c, wy + 2, wy + 10, 'rgba(60,35,20,0.22)', 'rgba(60,35,20,0)');
  c.fillRect(0, wy + 2, W, 8);
  // baseboard
  c.fillStyle = WALNUT;
  c.fillRect(0, f - 5, W, 5);

  // ceiling beam (hari) with a soft shadow below it
  const b = g.beam;
  c.fillStyle = vGrad(c, 0, b, WALNUT_L, WALNUT);
  c.fillRect(0, 0, W, b);
  grainLines(c, 0, 2, W, b - 4, 77, 30, 'rgba(255,230,200,0.12)');
  c.fillStyle = vGrad(c, b, b + 16, 'rgba(60,35,20,0.28)', 'rgba(60,35,20,0)');
  c.fillRect(0, b, W, 16);
  // corner posts (hashira)
  const pw2 = Math.max(10, W * 0.012);
  for (const px of [0, W - pw2]) {
    c.fillStyle = vGrad(c, 0, f, WALNUT_L, WALNUT);
    c.fillRect(px, 0, pw2, f);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    c.fillRect(px + (px === 0 ? pw2 - 2 : 0), 0, 2, f);
  }
}

// ---------- floor ----------
function drawFloor(c: Ctx, W: number, g: Geo, bottom: number, id: string) {
  const floorY = g.floorY;
  const h = bottom - floorY;
  const cx = W / 2;
  // perspective helper: x converges toward the centre further back
  const px = (x: number, y: number) => cx + (x - cx) * (0.72 + 0.28 * ((y - floorY) / h));
  switch (id) {
    case 'zemin-tatami': {
      c.fillStyle = vGrad(c, floorY, bottom, '#d8cf9e', '#c6bd86');
      c.fillRect(0, floorY, W, h);
      // weave
      c.strokeStyle = 'rgba(120,110,60,0.16)';
      c.lineWidth = 1;
      for (let y = floorY + 3; y < bottom; y += 3.5) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }
      // mat borders (heri) in deep green cloth, converging
      const mw = Math.max(140, W / 5);
      c.strokeStyle = '#4e6b4b';
      c.lineWidth = 5;
      for (let x = cx % mw; x <= W; x += mw) {
        c.beginPath();
        c.moveTo(px(x, floorY), floorY);
        c.lineTo(px(x, bottom), bottom);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(0, floorY + h * 0.52);
      c.lineTo(W, floorY + h * 0.52);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.25)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(0, floorY + h * 0.52 - 3);
      c.lineTo(W, floorY + h * 0.52 - 3);
      c.stroke();
      break;
    }
    case 'zemin-terrazzo': {
      c.fillStyle = vGrad(c, floorY, bottom, '#f2eadf', '#e5dbca');
      c.fillRect(0, floorY, W, h);
      const r = rng(71);
      const cols = ['#d9b893', '#b9c9a7', '#e9a3b7', '#8fb7cf', '#6e4b32', '#f6b8b0'];
      for (let i = 0; i < W / 2.5; i++) {
        const yy = floorY + r() * h;
        const k = 0.6 + ((yy - floorY) / h) * 0.8;
        c.fillStyle = rgba(cols[Math.floor(r() * cols.length)], 0.7);
        ellipse(c, r() * W, yy, (1.5 + r() * 3) * k, (1 + r() * 2) * k);
        c.fill();
      }
      break;
    }
    case 'zemin-tas': {
      c.fillStyle = vGrad(c, floorY, bottom, '#d8d1c4', '#c3b9aa');
      c.fillRect(0, floorY, W, h);
      const r = rng(81);
      const rows = 4;
      let y0 = floorY;
      for (let i = 0; i < rows; i++) {
        const rh = (h / rows) * (0.6 + i * 0.25);
        const y1 = Math.min(bottom, y0 + rh);
        const tw = Math.max(70, W / 11) * (0.7 + i * 0.22);
        let x = -r() * tw;
        while (x < W) {
          c.fillStyle = mix('#cfc7b8', '#b8ad9c', r());
          c.beginPath();
          c.moveTo(px(x + 2, y0), y0 + 2);
          c.lineTo(px(x + tw - 2, y0), y0 + 2);
          c.lineTo(px(x + tw - 2, y1), y1 - 2);
          c.lineTo(px(x + 2, y1), y1 - 2);
          c.closePath();
          c.fill();
          x += tw;
        }
        y0 = y1;
      }
      break;
    }
    default: {
      // light oak planks with perspective: back rows thinner, seams converge
      c.fillStyle = vGrad(c, floorY, bottom, '#e6c7a0', '#d4aa7c');
      c.fillRect(0, floorY, W, h);
      const r = rng(91);
      let y = floorY;
      let i = 0;
      while (y < bottom) {
        const ph = 9 + ((y - floorY) / h) * 30;
        c.fillStyle = `rgba(120,80,40,${0.02 + r() * 0.07})`;
        c.fillRect(0, y, W, ph);
        c.strokeStyle = 'rgba(120,80,40,0.2)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
        c.strokeStyle = 'rgba(255,240,220,0.18)';
        c.beginPath();
        c.moveTo(0, y + 1.2);
        c.lineTo(W, y + 1.2);
        c.stroke();
        const pl = Math.max(170, W / 5.5);
        c.strokeStyle = 'rgba(120,80,40,0.2)';
        for (let x = (i % 2) * pl * 0.5 - r() * 50; x < W + pl; x += pl) {
          c.beginPath();
          c.moveTo(px(x, y), y);
          c.lineTo(px(x, y + ph), y + ph);
          c.stroke();
        }
        grainLines(c, 0, y + 1, W, ph - 2, 100 + i, 16, 'rgba(120,80,40,0.09)');
        y += ph;
        i++;
      }
    }
  }
  // contact shadow under the wall and a soft sheen toward the counter
  c.fillStyle = vGrad(c, floorY, floorY + 30, 'rgba(60,35,20,0.2)', 'rgba(60,35,20,0)');
  c.fillRect(0, floorY, W, 30);
  c.fillStyle = vGrad(c, bottom - h * 0.4, bottom, 'rgba(255,245,230,0)', 'rgba(255,245,230,0.12)');
  c.fillRect(0, bottom - h * 0.4, W, h * 0.4);
}

// ---------- window + sakura tree ----------
function sakuraTree(c: Ctx, x: number, y: number, w: number, h: number, night: boolean) {
  // trunk/branches enter from the top-right corner and reach across the glass
  const bark = night ? '#3b2d2a' : '#5a3f32';
  c.strokeStyle = bark;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const branches: [number, number, number, number, number, number, number][] = [
    // x0,y0, cx,cy, x1,y1, width  (fractions of w/h)
    [1.02, 0.02, 0.82, 0.3, 0.42, 0.38, 9],
    [0.82, 0.28, 0.6, 0.2, 0.3, 0.14, 5.5],
    [0.62, 0.34, 0.5, 0.56, 0.3, 0.62, 5],
    [1.0, 0.3, 0.92, 0.55, 0.74, 0.68, 6],
    [0.88, 0.14, 0.78, 0.04, 0.66, -0.02, 4],
    [0.5, 0.36, 0.4, 0.5, 0.2, 0.5, 3.5],
    [0.42, 0.14, 0.3, 0.06, 0.18, 0.02, 3],
    [0.9, 0.56, 0.7, 0.5, 0.56, 0.52, 3],
  ];
  for (const [x0, y0, cxx, cyy, x1, y1, lw] of branches) {
    c.lineWidth = lw * (w / 470);
    c.beginPath();
    c.moveTo(x + x0 * w, y + y0 * h);
    c.quadraticCurveTo(x + cxx * w, y + cyy * h, x + x1 * w, y + y1 * h);
    c.stroke();
  }
  // blossom clusters along the branches
  const r = rng(505);
  const puffR = w * 0.036;
  let seed = 1;
  for (const [x0, y0, cxx, cyy, x1, y1] of branches) {
    for (let k = 0; k < 7; k++) {
      const tt = 0.1 + r() * 0.9;
      const bx = (1 - tt) * (1 - tt) * x0 + 2 * (1 - tt) * tt * cxx + tt * tt * x1;
      const by = (1 - tt) * (1 - tt) * y0 + 2 * (1 - tt) * tt * cyy + tt * tt * y1;
      if (r() < 0.78)
        blossomPuff(
          c,
          x + bx * w + (r() - 0.5) * puffR,
          y + by * h + (r() - 0.5) * puffR,
          puffR * (0.8 + r() * 0.6),
          seed++
        );
    }
  }
  // a few crisp flowers in front for detail
  for (let i = 0; i < 16; i++) {
    const b = branches[Math.floor(r() * branches.length)];
    const tt = 0.2 + r() * 0.8;
    const bx = (1 - tt) * (1 - tt) * b[0] + 2 * (1 - tt) * tt * b[2] + tt * tt * b[4];
    const by = (1 - tt) * (1 - tt) * b[1] + 2 * (1 - tt) * tt * b[3] + tt * tt * b[5];
    blossom(
      c,
      x + bx * w + (r() - 0.5) * puffR * 2,
      y + by * h + (r() - 0.5) * puffR * 2,
      puffR * 0.5,
      r() < 0.5 ? PINK_L : PINK_X
    );
  }
  if (night) {
    c.fillStyle = 'rgba(40,40,80,0.35)';
    c.fillRect(x, y, w, h);
  }
}

function drawWindow(c: Ctx, g: Geo, tod: Tod, decor: DecorState, rain: boolean) {
  const { x, y, w, h } = g.win;
  const sky = TOD_LIGHT[tod].sky;
  const night = tod === 'aksam';
  const dusk = tod === 'gunbatimi';
  const fr = Math.max(10, w * 0.028);
  // wall shadow around the frame
  c.fillStyle = 'rgba(60,35,20,0.12)';
  roundRect(c, x - fr - 6, y - fr + 2, w + fr * 2 + 12, h + fr * 2 + 12, 6);
  c.fill();
  // frame
  c.fillStyle = vGrad(c, y - fr, y + h + fr, WALNUT_L, WALNUT);
  roundRect(c, x - fr, y - fr, w + fr * 2, h + fr * 2, 4);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.fillRect(x - fr, y - fr, w + fr * 2, 2);
  // glass
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = vGrad(c, y, y + h, sky[0], sky[1]);
  c.fillRect(x, y, w, h);
  if (night) {
    const r = rng(7);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 30; i++) {
      circle(c, x + r() * w, y + r() * h * 0.55, 0.5 + r() * 1);
      c.fill();
    }
    c.fillStyle = '#fff5d6';
    circle(c, x + w * 0.22, y + h * 0.2, h * 0.07);
    c.fill();
    gloss(c, x + w * 0.22, y + h * 0.2, h * 0.2, 0.35);
  } else if (dusk) {
    const gr = c.createRadialGradient(
      x + w * 0.25,
      y + h * 0.5,
      0,
      x + w * 0.25,
      y + h * 0.5,
      w * 0.5
    );
    gr.addColorStop(0, 'rgba(255,230,170,0.9)');
    gr.addColorStop(0.3, 'rgba(255,200,130,0.45)');
    gr.addColorStop(1, 'rgba(255,200,130,0)');
    c.fillStyle = gr;
    c.fillRect(x, y, w, h);
    c.fillStyle = '#fff0c4';
    circle(c, x + w * 0.25, y + h * 0.5, h * 0.09);
    c.fill();
  } else {
    // soft morning/noon clouds
    c.fillStyle = tod === 'sabah' ? 'rgba(255,245,235,0.85)' : 'rgba(255,255,255,0.8)';
    for (const [cxf, cyf, s] of [
      [0.18, 0.2, 1],
      [0.5, 0.1, 0.7],
    ]) {
      ellipse(c, x + w * cxf, y + h * cyf, w * 0.13 * s, h * 0.06 * s);
      c.fill();
      ellipse(
        c,
        x + w * cxf + w * 0.06 * s,
        y + h * cyf - h * 0.04 * s,
        w * 0.08 * s,
        h * 0.06 * s
      );
      c.fill();
      ellipse(
        c,
        x + w * cxf - w * 0.07 * s,
        y + h * cyf - h * 0.02 * s,
        w * 0.07 * s,
        h * 0.05 * s
      );
      c.fill();
    }
  }
  // distant soft hills + little town roofs
  const hillCol = night
    ? '#2a2e4f'
    : dusk
      ? mix('#8d7a9a', sky[1], 0.25)
      : mix('#a9c3b7', sky[1], 0.35);
  c.fillStyle = hillCol;
  c.beginPath();
  c.moveTo(x, y + h * 0.78);
  c.quadraticCurveTo(x + w * 0.2, y + h * 0.55, x + w * 0.42, y + h * 0.7);
  c.quadraticCurveTo(x + w * 0.6, y + h * 0.5, x + w * 0.8, y + h * 0.68);
  c.quadraticCurveTo(x + w * 0.92, y + h * 0.6, x + w, y + h * 0.72);
  c.lineTo(x + w, y + h);
  c.lineTo(x, y + h);
  c.closePath();
  c.fill();
  // roofs (kawara silhouettes) on the ground line
  const r2 = rng(13);
  const groundY = y + h * 0.84;
  const roofCol = night ? '#1d1f36' : dusk ? '#6d5a74' : '#7f8f9a';
  let bx = x - 10;
  while (bx < x + w + 10) {
    const bw = w * (0.07 + r2() * 0.08);
    const bh = h * (0.07 + r2() * 0.1);
    c.fillStyle = roofCol;
    c.beginPath();
    c.moveTo(bx - 4, groundY - bh * 0.55);
    c.quadraticCurveTo(bx + bw * 0.5, groundY - bh * 1.25, bx + bw + 4, groundY - bh * 0.55);
    c.lineTo(bx + bw, groundY - bh * 0.5);
    c.lineTo(bx + bw, groundY + 2);
    c.lineTo(bx, groundY + 2);
    c.lineTo(bx, groundY - bh * 0.5);
    c.closePath();
    c.fill();
    c.fillStyle = night ? '#28294a' : dusk ? '#9a8396' : '#c8d1d6';
    c.fillRect(bx + 2, groundY - bh * 0.5, bw - 4, bh * 0.5);
    if (night || dusk) {
      c.fillStyle = night ? 'rgba(255,214,140,0.95)' : 'rgba(255,230,180,0.7)';
      for (let xx = bx + 5; xx < bx + bw - 6; xx += 8)
        if (r2() < 0.6) c.fillRect(xx, groundY - bh * 0.36, 3.5, 4);
    }
    bx += bw + 3 + r2() * 6;
  }
  c.fillStyle = night ? '#171a2c' : dusk ? '#5e4e66' : '#6f8390';
  c.fillRect(x, groundY, w, h - (groundY - y));
  // the sakura tree
  sakuraTree(c, x, y, w, h, night);
  // rain: misty glass + static droplets (streaks are per frame)
  if (rain) {
    c.fillStyle = 'rgba(190,205,220,0.28)';
    c.fillRect(x, y, w, h);
    const r3 = rng(17);
    for (let i = 0; i < 80; i++) {
      const dx = x + r3() * w;
      const dy = y + r3() * h;
      const s = 1.5 + r3() * 3;
      c.fillStyle = 'rgba(255,255,255,0.5)';
      ellipse(c, dx, dy, s * 0.6, s);
      c.fill();
      c.fillStyle = 'rgba(80,90,110,0.15)';
      ellipse(c, dx, dy + s * 0.5, s * 0.4, s * 0.5);
      c.fill();
    }
  }
  // glass sheen
  c.fillStyle = 'rgba(255,255,255,0.09)';
  c.beginPath();
  c.moveTo(x + w * 0.05, y + h);
  c.lineTo(x + w * 0.28, y);
  c.lineTo(x + w * 0.4, y);
  c.lineTo(x + w * 0.17, y + h);
  c.closePath();
  c.fill();
  c.restore();
  // kumiko lattice: two thin verticals, one horizontal, framed in walnut
  c.strokeStyle = WALNUT;
  c.lineWidth = Math.max(4, w * 0.012);
  c.beginPath();
  for (const fx of [1 / 3, 2 / 3]) {
    c.moveTo(x + w * fx, y);
    c.lineTo(x + w * fx, y + h);
  }
  c.moveTo(x, y + h * 0.3);
  c.lineTo(x + w, y + h * 0.3);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.14)';
  c.lineWidth = 1;
  c.beginPath();
  for (const fx of [1 / 3, 2 / 3]) {
    c.moveTo(x + w * fx + 2.5, y);
    c.lineTo(x + w * fx + 2.5, y + h);
  }
  c.stroke();
  // sill
  c.fillStyle = vGrad(c, y + h + fr, y + h + fr + 12, WALNUT_L, WALNUT);
  roundRect(c, x - fr - 10, y + h + fr - 2, w + fr * 2 + 20, 12, 3);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(255,255,255,0.15)';
  c.fillRect(x - fr - 8, y + h + fr - 1, w + fr * 2 + 16, 2);
  c.fillStyle = vGrad(
    c,
    y + h + fr + 10,
    y + h + fr + 22,
    'rgba(60,35,20,0.22)',
    'rgba(60,35,20,0)'
  );
  c.fillRect(x - fr - 10, y + h + fr + 10, w + fr * 2 + 20, 12);
  // window extras
  if (decor.pencere === 'pencere-noren') {
    // short indigo valance over the top third
    const n = 4;
    const sw = w / n;
    const vh = h * 0.28;
    for (let i = 0; i < n; i++) {
      c.fillStyle = vGrad(c, y, y + vh, i % 2 ? INDIGO : shade(INDIGO, 0.08), INDIGO_D);
      roundRect(c, x + i * sw + 2, y - 2, sw - 4, vh, 3);
      c.fill();
      seigaiha(
        c,
        x + i * sw + 2,
        y + vh * 0.45,
        sw - 4,
        vh * 0.55,
        sw * 0.14,
        'rgba(255,255,255,0.55)'
      );
    }
    c.fillStyle = WALNUT;
    c.fillRect(x - fr, y - 6, w + fr * 2, 6);
  } else if (decor.pencere === 'pencere-cicek') {
    const bw = w * 0.9;
    const bx0 = x + (w - bw) / 2;
    const by = y + h + fr + 18;
    const r = rng(19);
    for (let i = 0; i < 16; i++) {
      const fx = bx0 + 8 + r() * (bw - 16);
      const fy = by - 6 - r() * 14;
      c.fillStyle = '#6f8f66';
      ellipse(c, fx, fy + 8, 4, 7);
      c.fill();
      c.fillStyle = [PAL.rose, PAL.coral, PAL.butter, PAL.lilac][Math.floor(r() * 4)];
      circle(c, fx, fy, 5);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)';
      circle(c, fx - 1.5, fy - 1.5, 1.6);
      c.fill();
    }
    c.fillStyle = vGrad(c, by, by + 22, WALNUT_L, WALNUT);
    roundRect(c, bx0, by, bw, 22, 4);
    c.fill();
    stroke(c);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(c, bx0 + 4, by + 3, bw - 8, 5, 2);
    c.fill();
  } else {
    // rolled bamboo blind (sudare) resting on the top frame
    const ry = y - fr - 9;
    c.fillStyle = 'rgba(60,35,20,0.14)';
    roundRect(c, x - fr + 2, ry + 6, w + fr * 2 - 4, 14, 7);
    c.fill();
    c.fillStyle = vGrad(c, ry, ry + 18, '#dcbb86', '#a9834f');
    roundRect(c, x - fr, ry, w + fr * 2, 18, 9);
    c.fill();
    stroke(c);
    c.strokeStyle = 'rgba(90,60,30,0.35)';
    c.lineWidth = 1;
    for (let sx = x - fr + 6; sx < x + w + fr - 4; sx += 5) {
      c.beginPath();
      c.moveTo(sx, ry + 2);
      c.lineTo(sx, ry + 16);
      c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(c, x - fr + 4, ry + 3, w + fr * 2 - 8, 3, 1.5);
    c.fill();
    for (const fx of [0.22, 0.78]) {
      c.strokeStyle = INDIGO;
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(x + w * fx, ry - 2);
      c.lineTo(x + w * fx, ry + 20);
      c.stroke();
    }
    // a small ceramic cup on the sill
    const sx = x + w * 0.12;
    const sy = y + h + fr - 2;
    softShadow(c, sx, sy, 12, 3, 0.2);
    c.fillStyle = vGrad(c, sy - 14, sy, '#f5efe4', '#d9cfbf');
    roundRect(c, sx - 7, sy - 14, 14, 14, 3);
    c.fill();
    stroke(c);
    c.fillStyle = INDIGO;
    c.fillRect(sx - 7, sy - 10, 14, 2);
  }
}

// ---------- doorway with noren ----------
function drawDoor(c: Ctx, g: Geo, tod: Tod) {
  const { x, y, w, h } = g.door;
  const sky = TOD_LIGHT[tod].sky;
  const night = tod === 'aksam';
  const fr = Math.max(8, w * 0.07);
  c.fillStyle = 'rgba(60,35,20,0.12)';
  roundRect(c, x - fr - 5, y - fr + 2, w + fr * 2 + 10, h + fr + 8, 5);
  c.fill();
  // frame
  c.fillStyle = vGrad(c, y - fr, y + h, WALNUT_L, WALNUT);
  roundRect(c, x - fr, y - fr, w + fr * 2, h + fr, 3);
  c.fill();
  stroke(c);
  // opening: a glimpse outside (street + steps)
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = vGrad(c, y, y + h, sky[0], sky[1]);
  c.fillRect(x, y, w, h);
  c.fillStyle = night ? '#1f2238' : '#8e9aa3';
  c.fillRect(x, y + h * 0.62, w, h * 0.38);
  c.fillStyle = night ? '#2b2d46' : '#b8c1c7';
  c.fillRect(x, y + h * 0.62, w, 6);
  // stone steps
  for (let i = 0; i < 3; i++) {
    c.fillStyle = mix(night ? '#3a3d58' : '#cfc7b8', night ? '#2a2c44' : '#b8ad9c', i / 3);
    c.fillRect(x, y + h * (0.74 + i * 0.09), w, h * 0.09);
    c.fillStyle = 'rgba(255,255,255,0.15)';
    c.fillRect(x, y + h * (0.74 + i * 0.09), w, 2);
  }
  // a small stone lantern silhouette outside
  c.fillStyle = night ? '#2c2f4a' : '#9ca7af';
  c.fillRect(x + w * 0.62, y + h * 0.4, w * 0.12, h * 0.24);
  c.beginPath();
  c.moveTo(x + w * 0.5, y + h * 0.42);
  c.lineTo(x + w * 0.68, y + h * 0.3);
  c.lineTo(x + w * 0.86, y + h * 0.42);
  c.closePath();
  c.fill();
  if (night) {
    c.fillStyle = 'rgba(255,220,150,0.9)';
    c.fillRect(x + w * 0.64, y + h * 0.44, w * 0.08, h * 0.06);
  }
  // noren: indigo split curtain covering the top ~58%
  const nh = h * 0.58;
  const panels = 3;
  const pw = w / panels;
  for (let i = 0; i < panels; i++) {
    const px0 = x + i * pw;
    const fold = c.createLinearGradient(px0, 0, px0 + pw, 0);
    fold.addColorStop(0, INDIGO_D);
    fold.addColorStop(0.3, INDIGO);
    fold.addColorStop(0.7, shade(INDIGO, 0.1));
    fold.addColorStop(1, INDIGO_D);
    c.fillStyle = fold;
    c.beginPath();
    c.moveTo(px0 + 1, y - 2);
    c.lineTo(px0 + pw - 1, y - 2);
    c.lineTo(px0 + pw - 1, y + nh - 4);
    c.quadraticCurveTo(px0 + pw / 2, y + nh + 4, px0 + 1, y + nh - 4);
    c.closePath();
    c.fill();
    // top band shared by panels
    seigaiha(c, px0 + 1, y + nh * 0.58, pw - 2, nh * 0.42, pw * 0.22, 'rgba(255,255,255,0.6)');
  }
  // white brush circle (enso) with a wave on the middle panel
  c.save();
  c.translate(x + w / 2, y + nh * 0.3);
  c.strokeStyle = 'rgba(255,255,255,0.92)';
  c.lineCap = 'round';
  c.lineWidth = Math.max(2.5, w * 0.04);
  c.beginPath();
  c.arc(0, 0, pw * 0.34, -1.2, 4.3);
  c.stroke();
  c.lineWidth = Math.max(1.6, w * 0.022);
  c.beginPath();
  c.moveTo(-pw * 0.2, pw * 0.05);
  c.quadraticCurveTo(-pw * 0.08, -pw * 0.12, 0, pw * 0.04);
  c.quadraticCurveTo(pw * 0.08, pw * 0.16, pw * 0.2, 0);
  c.stroke();
  c.restore();
  c.fillStyle = 'rgba(0,0,0,0.12)';
  c.fillRect(x, y, w, 6);
  c.restore();
  // rod
  c.fillStyle = vGrad(c, y - 7, y + 1, '#8a6a4a', WALNUT);
  roundRect(c, x - fr - 2, y - 7, w + fr * 2 + 4, 8, 3);
  c.fill();
  // little hanging "AÇIK" plaque on the frame
  const sx = x + w + fr * 0.5;
  const sy = y + h * 0.24;
  c.strokeStyle = '#4a3f3b';
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(sx, sy - 14);
  c.lineTo(sx, sy);
  c.stroke();
  c.fillStyle = vGrad(c, sy, sy + 22, '#e9c99c', '#cfa672');
  roundRect(c, sx - 17, sy, 34, 22, 4);
  c.fill();
  stroke(c);
  c.fillStyle = PAL.tomato;
  c.font = `800 10px "Baloo 2", system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('AÇIK', sx, sy + 11.5);
}

// ---------- menu board (brush calligraphy) ----------
function drawMenuBoard(c: Ctx, g: Geo) {
  const { x, y, w, h } = g.board;
  c.fillStyle = 'rgba(60,35,20,0.14)';
  roundRect(c, x - 2, y + 4, w + 6, h + 6, 5);
  c.fill();
  c.fillStyle = vGrad(c, y, y + h, WALNUT_L, WALNUT);
  roundRect(c, x, y, w, h, 5);
  c.fill();
  stroke(c);
  grainLines(c, x + 4, y + 2, w - 8, h - 4, 123, 14, 'rgba(255,230,200,0.1)');
  const pad = Math.max(6, h * 0.1);
  const ix = x + pad;
  const iy = y + pad;
  const iw = w - pad * 2;
  const ih = h - pad * 2;
  c.fillStyle = vGrad(c, iy, iy + ih, '#fbf3e3', '#f3e6d0');
  roundRect(c, ix, iy, iw, ih, 3);
  c.fill();
  speckle(c, ix, iy, iw, ih, 131, 200, 'rgba(180,140,90,0.08)');
  // columns of brush characters with a small price mark under each
  const cols = Math.max(4, Math.floor(iw / (ih * 0.7)));
  const cw = iw / cols;
  const cs = Math.min(cw * 0.6, ih * 0.55);
  for (let i = 0; i < cols; i++) {
    const cx = ix + cw * (i + 0.5);
    brushChar(c, cx - cs / 2, iy + ih * 0.08, cs, 900 + i * 7);
    // small second glyph + price dash in soft red
    brushChar(c, cx - cs * 0.22, iy + ih * 0.66, cs * 0.42, 950 + i * 3, 'rgba(201,67,47,0.85)');
    if (i < cols - 1) {
      c.strokeStyle = 'rgba(120,80,40,0.16)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(ix + cw * (i + 1), iy + ih * 0.1);
      c.lineTo(ix + cw * (i + 1), iy + ih * 0.9);
      c.stroke();
    }
  }
  // hanko seal
  c.fillStyle = '#c9432f';
  roundRect(c, ix + iw - cs * 0.42, iy + ih - cs * 0.42, cs * 0.3, cs * 0.3, 2);
  c.fill();
  c.fillStyle = 'rgba(255,240,230,0.8)';
  c.fillRect(ix + iw - cs * 0.36, iy + ih - cs * 0.36, cs * 0.18, cs * 0.04);
  c.fillRect(ix + iw - cs * 0.36, iy + ih - cs * 0.26, cs * 0.18, cs * 0.04);
  // tiny hanging cords
  c.strokeStyle = '#4a3f3b';
  c.lineWidth = 1.5;
  for (const fx of [0.08, 0.92]) {
    c.beginPath();
    c.moveTo(x + w * fx, y);
    c.lineTo(x + w * fx, g.beam);
    c.stroke();
  }
}

// ---------- hanging scroll (kakejiku) = painting slot ----------
function drawScroll(c: Ctx, g: Geo, id: string) {
  if (id === 'tablo-yok') return;
  const { x, y, w, h } = g.scroll;
  // cord
  c.strokeStyle = '#4a3f3b';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x + w / 2, g.beam);
  c.lineTo(x + w / 2, y);
  c.stroke();
  c.fillStyle = 'rgba(60,35,20,0.12)';
  roundRect(c, x - 1, y + 4, w + 4, h + 6, 3);
  c.fill();
  // silk mount (indigo bands) + paper
  c.fillStyle = vGrad(c, y, y + h, '#44507f', INDIGO_D);
  c.fillRect(x, y, w, h);
  const bandT = h * 0.1;
  const bandB = h * 0.12;
  const px = x + w * 0.1;
  const py = y + bandT;
  const pw = w * 0.8;
  const ph = h - bandT - bandB;
  c.fillStyle = PAL.cream;
  c.fillRect(px, py, pw, ph);
  c.save();
  c.beginPath();
  c.rect(px, py, pw, ph);
  c.clip();
  switch (id) {
    case 'tablo-fuji': {
      c.fillStyle = vGrad(c, py, py + ph, '#f8d6cf', '#fdebdc');
      c.fillRect(px, py, pw, ph);
      c.fillStyle = '#f2a9a0';
      circle(c, px + pw * 0.68, py + ph * 0.25, pw * 0.16);
      c.fill();
      c.fillStyle = '#5c6a96';
      c.beginPath();
      c.moveTo(px - 5, py + ph * 0.8);
      c.lineTo(px + pw * 0.5, py + ph * 0.42);
      c.lineTo(px + pw + 5, py + ph * 0.8);
      c.closePath();
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.moveTo(px + pw * 0.5, py + ph * 0.42);
      c.lineTo(px + pw * 0.66, py + ph * 0.54);
      c.lineTo(px + pw * 0.58, py + ph * 0.52);
      c.lineTo(px + pw * 0.5, py + ph * 0.56);
      c.lineTo(px + pw * 0.42, py + ph * 0.52);
      c.lineTo(px + pw * 0.34, py + ph * 0.54);
      c.closePath();
      c.fill();
      c.fillStyle = '#8fa8c9';
      c.fillRect(px, py + ph * 0.8, pw, ph * 0.2);
      break;
    }
    case 'tablo-dalga': {
      c.fillStyle = '#f1e6cf';
      c.fillRect(px, py, pw, ph);
      c.fillStyle = '#2f4f86';
      c.beginPath();
      c.moveTo(px, py + ph);
      c.quadraticCurveTo(px + pw * 0.1, py + ph * 0.55, px + pw * 0.5, py + ph * 0.42);
      c.quadraticCurveTo(px + pw * 0.85, py + ph * 0.3, px + pw * 0.72, py + ph * 0.55);
      c.quadraticCurveTo(px + pw * 0.55, py + ph * 0.62, px + pw * 0.62, py + ph * 0.68);
      c.quadraticCurveTo(px + pw, py + ph * 0.7, px + pw, py + ph);
      c.closePath();
      c.fill();
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 7; i++) {
        circle(c, px + pw * (0.5 + i * 0.05), py + ph * (0.4 + Math.sin(i) * 0.02), 1.8);
        c.fill();
      }
      c.strokeStyle = 'rgba(255,255,255,0.8)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(px + pw * 0.08, py + ph * 0.85);
      c.quadraticCurveTo(px + pw * 0.3, py + ph * 0.65, px + pw * 0.55, py + ph * 0.72);
      c.stroke();
      break;
    }
    case 'tablo-koi': {
      c.fillStyle = vGrad(c, py, py + ph, '#9fc2d6', '#6f9cb8');
      c.fillRect(px, py, pw, ph);
      for (const [fx, fy, col, rot] of [
        [0.38, 0.38, '#ef8a76', -0.4],
        [0.62, 0.64, '#fff6e9', 2.6],
      ] as [number, number, string, number][]) {
        c.save();
        c.translate(px + pw * fx, py + ph * fy);
        c.rotate(rot);
        c.fillStyle = col;
        ellipse(c, 0, 0, pw * 0.13, ph * 0.12);
        c.fill();
        c.beginPath();
        c.moveTo(0, ph * 0.1);
        c.lineTo(-pw * 0.08, ph * 0.2);
        c.lineTo(pw * 0.08, ph * 0.2);
        c.closePath();
        c.fill();
        c.fillStyle = col === '#fff6e9' ? '#ef8a76' : '#ffffff';
        circle(c, 2, -ph * 0.03, 2.5);
        c.fill();
        c.restore();
      }
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(px + pw * 0.75, py + ph * 0.2, 4 + i * 5, 0, Math.PI * 2);
        c.stroke();
      }
      break;
    }
    case 'tablo-turna': {
      c.fillStyle = vGrad(c, py, py + ph, '#fbf3e4', '#f1dfc4');
      c.fillRect(px, py, pw, ph);
      c.fillStyle = '#e9a3b7';
      circle(c, px + pw * 0.7, py + ph * 0.2, pw * 0.2);
      c.fill();
      for (const [fx, fy, s] of [
        [0.42, 0.5, 1],
        [0.6, 0.68, 0.75],
      ]) {
        c.save();
        c.translate(px + pw * fx, py + ph * fy);
        c.scale(s, s);
        c.fillStyle = '#ffffff';
        ellipse(c, 0, 0, pw * 0.2, ph * 0.045);
        c.fill();
        c.beginPath();
        c.moveTo(-pw * 0.12, -ph * 0.01);
        c.lineTo(-pw * 0.28, -ph * 0.16);
        c.lineTo(pw * 0.04, -ph * 0.03);
        c.closePath();
        c.fill();
        c.strokeStyle = '#3a2a22';
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(pw * 0.16, -ph * 0.01);
        c.lineTo(pw * 0.26, -ph * 0.12);
        c.stroke();
        c.fillStyle = '#d9573f';
        circle(c, pw * 0.26, -ph * 0.13, 2);
        c.fill();
        c.fillStyle = '#3a2a22';
        c.beginPath();
        c.moveTo(pw * 0.14, 0);
        c.lineTo(pw * 0.3, -ph * 0.04);
        c.lineTo(pw * 0.34, -ph * 0.03);
        c.closePath();
        c.fill();
        c.restore();
      }
      break;
    }
  }
  // brush signature + seal
  brushChar(c, px + pw * 0.08, py + ph * 0.82, pw * 0.16, 777, 'rgba(58,42,34,0.7)');
  c.fillStyle = '#c9432f';
  c.fillRect(px + pw * 0.1, py + ph * 0.93, pw * 0.1, pw * 0.1);
  c.restore();
  // rollers
  c.fillStyle = vGrad(c, y + h - 3, y + h + 7, WALNUT_L, '#3f2b1d');
  roundRect(c, x - 4, y + h - 3, w + 8, 10, 5);
  c.fill();
  c.fillStyle = vGrad(c, y - 4, y + 4, WALNUT_L, '#3f2b1d');
  roundRect(c, x - 3, y - 4, w + 6, 8, 4);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.15)';
  c.fillRect(x - 3, y - 3, w + 6, 1.5);
}

// ---------- low shelf: sake bottles & ceramics ----------
function drawShelf(c: Ctx, g: Geo) {
  const { x, y, w } = g.shelf;
  c.fillStyle = 'rgba(60,35,20,0.14)';
  roundRect(c, x + 2, y + 6, w, 10, 3);
  c.fill();
  const k = Math.min(1.25, Math.max(0.8, w / 280));
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  const ww = w / k;
  const items = ['tokkuri', 'bottle', 'bowls', 'cups', 'ikebana', 'teapot'];
  const step = ww / items.length;
  items.forEach((it, i) => {
    const ix = step * (i + 0.5);
    softShadow(c, ix, 0, 14, 3, 0.18);
    switch (it) {
      case 'tokkuri': {
        // sake flask + two ochoko cups
        c.fillStyle = vGrad(c, -36, 0, '#f6efe2', '#d8ccb8');
        c.beginPath();
        c.moveTo(-5 + ix, -36);
        c.lineTo(5 + ix, -36);
        c.quadraticCurveTo(16 + ix, -22, 12 + ix, 0);
        c.lineTo(-12 + ix, 0);
        c.quadraticCurveTo(-16 + ix, -22, -5 + ix, -36);
        c.closePath();
        c.fill();
        stroke(c);
        c.strokeStyle = INDIGO;
        c.lineWidth = 2.2;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(ix - 7, -18);
        c.quadraticCurveTo(ix, -24, ix + 7, -16);
        c.stroke();
        gloss(c, ix - 5, -24, 6, 0.5);
        for (const dx of [-20, 20]) {
          c.fillStyle = '#f6efe2';
          roundRect(c, ix + dx - 5, -9, 10, 9, 2);
          c.fill();
          stroke(c);
        }
        break;
      }
      case 'bottle': {
        c.fillStyle = vGrad(c, -46, 0, '#4d6b4a', '#2f4a2e');
        roundRect(c, ix - 8, -46, 16, 46, 4);
        c.fill();
        c.fillStyle = '#2f4a2e';
        roundRect(c, ix - 4, -56, 8, 12, 2);
        c.fill();
        stroke(c);
        c.fillStyle = PAL.paper;
        roundRect(c, ix - 6, -32, 12, 18, 1.5);
        c.fill();
        brushChar(c, ix - 4, -30, 8, 61);
        c.fillStyle = 'rgba(255,255,255,0.25)';
        roundRect(c, ix - 6, -44, 3, 40, 1.5);
        c.fill();
        break;
      }
      case 'bowls': {
        for (let j = 0; j < 3; j++) {
          const by = -j * 7;
          c.fillStyle = [PAL.tomato, '#3a3f4a', PAL.sage][j];
          c.beginPath();
          c.moveTo(ix - 14, by - 7);
          c.quadraticCurveTo(ix - 12, by, ix, by);
          c.quadraticCurveTo(ix + 12, by, ix + 14, by - 7);
          c.closePath();
          c.fill();
          stroke(c);
          c.fillStyle = PAL.paper;
          ellipse(c, ix, by - 7, 14, 2.5);
          c.fill();
        }
        break;
      }
      case 'cups': {
        for (const [dx, col] of [
          [-10, INDIGO],
          [6, '#b9c9a7'],
        ] as [number, string][]) {
          c.fillStyle = col;
          roundRect(c, ix + dx - 6, -15, 12, 15, 3);
          c.fill();
          stroke(c);
          c.fillStyle = 'rgba(255,255,255,0.3)';
          roundRect(c, ix + dx - 4, -13, 3, 10, 1.5);
          c.fill();
        }
        break;
      }
      case 'ikebana': {
        c.fillStyle = vGrad(c, -14, 0, '#4a5260', '#2d323c');
        roundRect(c, ix - 12, -12, 24, 12, 4);
        c.fill();
        stroke(c);
        c.strokeStyle = '#6e4b32';
        c.lineCap = 'round';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(ix - 2, -12);
        c.quadraticCurveTo(ix - 14, -30, ix - 8, -48);
        c.moveTo(ix + 2, -12);
        c.quadraticCurveTo(ix + 10, -26, ix + 18, -32);
        c.stroke();
        c.fillStyle = '#6f8f66';
        c.save();
        c.translate(ix + 5, -18);
        c.rotate(-0.5);
        ellipse(c, 0, 0, 11, 3);
        c.fill();
        c.restore();
        blossom(c, ix - 8, -48, 5.5, PAL.rose);
        blossom(c, ix + 18, -32, 4.5, PAL.blush);
        blossom(c, ix - 12, -36, 3.5, PINK_L);
        break;
      }
      case 'teapot': {
        c.fillStyle = vGrad(c, -22, 0, '#8c6b5a', '#5f4536');
        ellipse(c, ix, -11, 15, 11);
        c.fill();
        stroke(c);
        c.fillStyle = '#5f4536';
        c.beginPath();
        c.moveTo(ix + 12, -14);
        c.lineTo(ix + 22, -22);
        c.lineTo(ix + 24, -19);
        c.lineTo(ix + 14, -10);
        c.closePath();
        c.fill();
        c.strokeStyle = '#5f4536';
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(ix, -22, 8, Math.PI * 1.05, Math.PI * 1.95);
        c.stroke();
        c.fillStyle = '#5f4536';
        ellipse(c, ix, -22, 7, 2.5);
        c.fill();
        gloss(c, ix - 6, -15, 6, 0.3);
        break;
      }
    }
  });
  c.restore();
  // board + brackets
  c.fillStyle = vGrad(c, y, y + 9, WALNUT_L, WALNUT);
  roundRect(c, x, y, w, 9, 2);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(255,255,255,0.16)';
  c.fillRect(x + 2, y + 1, w - 4, 1.5);
  c.fillStyle = WALNUT;
  for (const bx of [x + 16, x + w - 16]) {
    c.beginPath();
    c.moveTo(bx - 5, y + 9);
    c.lineTo(bx + 5, y + 9);
    c.lineTo(bx, y + 22);
    c.closePath();
    c.fill();
  }
}

// ---------- lamps / lanterns ----------
function drawLamp(c: Ctx, x: number, y: number, id: string, on: boolean, beam: number) {
  c.strokeStyle = 'rgba(50,40,36,0.75)';
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(x, beam);
  c.lineTo(x, y);
  c.stroke();
  // canopy on the beam
  c.fillStyle = '#3f3531';
  roundRect(c, x - 7, beam - 2, 14, 6, 3);
  c.fill();
  switch (id) {
    case 'lamba-kagit': {
      // round white paper lantern with ribs
      const r = 27;
      const cy = y + r;
      c.fillStyle = on
        ? vGrad(c, cy - r, cy + r, '#fff6dd', '#ffe3b0')
        : vGrad(c, cy - r, cy + r, '#fdfaf3', '#e9e2d6');
      circle(c, x, cy, r);
      c.fill();
      stroke(c, 'rgba(60,35,20,0.18)');
      c.strokeStyle = 'rgba(120,90,60,0.22)';
      c.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        c.beginPath();
        c.ellipse(x, cy, Math.max(1, Math.abs(i) * 7.5), r, 0, 0, Math.PI * 2);
        c.stroke();
      }
      for (let i = -2; i <= 2; i++) {
        const yy = cy + i * 10;
        const rx = Math.sqrt(Math.max(0, 1 - ((i * 10) / r) ** 2)) * r;
        c.beginPath();
        c.moveTo(x - rx, yy);
        c.lineTo(x + rx, yy);
        c.stroke();
      }
      c.fillStyle = '#3f3531';
      roundRect(c, x - 8, y - 3, 16, 7, 3);
      c.fill();
      roundRect(c, x - 8, cy + r - 3, 16, 6, 3);
      c.fill();
      gloss(c, x - 9, cy - 10, 13, on ? 0.6 : 0.4);
      break;
    }
    case 'lamba-chochin': {
      const cy = y + 32;
      c.fillStyle = on
        ? vGrad(c, cy - 32, cy + 32, '#ff8468', '#e0553f')
        : vGrad(c, cy - 32, cy + 32, '#e2654d', '#c4432f');
      ellipse(c, x, cy, 22, 32);
      c.fill();
      stroke(c);
      c.strokeStyle = 'rgba(60,20,10,0.22)';
      c.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const yy = cy + i * 8.5;
        const rx = Math.sqrt(Math.max(0, 1 - ((i * 8.5) / 32) ** 2)) * 22;
        c.beginPath();
        c.moveTo(x - rx, yy);
        c.lineTo(x + rx, yy);
        c.stroke();
      }
      c.fillStyle = '#2a2320';
      roundRect(c, x - 10, y - 2, 20, 7, 3);
      c.fill();
      roundRect(c, x - 10, cy + 29, 20, 6, 3);
      c.fill();
      // tassel
      c.strokeStyle = '#2a2320';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x, cy + 35);
      c.lineTo(x, cy + 44);
      c.stroke();
      c.fillStyle = PAL.cream;
      brushChar(c, x - 9, cy - 10, 18, 333, 'rgba(255,246,233,0.95)');
      if (on) gloss(c, x - 7, cy - 12, 13, 0.3);
      break;
    }
    case 'lamba-pirinc': {
      c.fillStyle = vGrad(c, y, y + 38, '#e9c884', '#b48434');
      c.beginPath();
      c.moveTo(x - 6, y);
      c.lineTo(x + 6, y);
      c.lineTo(x + 28, y + 38);
      c.lineTo(x - 28, y + 38);
      c.closePath();
      c.fill();
      stroke(c);
      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.beginPath();
      c.moveTo(x - 3, y + 2);
      c.lineTo(x + 1, y + 2);
      c.lineTo(x - 10, y + 36);
      c.lineTo(x - 18, y + 36);
      c.closePath();
      c.fill();
      c.fillStyle = on ? '#fff0c8' : '#f3efe6';
      ellipse(c, x, y + 38, 28, 5);
      c.fill();
      if (on) {
        c.fillStyle = '#fff8e0';
        circle(c, x, y + 34, 7);
        c.fill();
      }
      break;
    }
    default: {
      // Edison bulb with a brass cap
      c.fillStyle = vGrad(c, y - 2, y + 16, '#d8b56a', '#a67c35');
      roundRect(c, x - 7, y - 2, 14, 16, 3);
      c.fill();
      stroke(c, 'rgba(60,35,20,0.2)');
      c.fillStyle = on
        ? vGrad(c, y + 12, y + 48, '#fff3cf', '#ffd98a')
        : vGrad(c, y + 12, y + 48, '#faf6ee', '#e6ded2');
      c.beginPath();
      c.moveTo(x - 7, y + 14);
      c.quadraticCurveTo(x - 20, y + 20, x - 18, y + 36);
      c.quadraticCurveTo(x - 14, y + 50, x, y + 50);
      c.quadraticCurveTo(x + 14, y + 50, x + 18, y + 36);
      c.quadraticCurveTo(x + 20, y + 20, x + 7, y + 14);
      c.closePath();
      c.fill();
      stroke(c, 'rgba(60,35,20,0.18)');
      c.strokeStyle = on ? '#f0a040' : '#9a8f86';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x - 4, y + 16);
      c.lineTo(x - 5, y + 32);
      c.lineTo(x - 2, y + 26);
      c.lineTo(x, y + 34);
      c.lineTo(x + 2, y + 26);
      c.lineTo(x + 5, y + 32);
      c.lineTo(x + 4, y + 16);
      c.stroke();
      if (on) {
        c.fillStyle = 'rgba(255,230,160,0.5)';
        circle(c, x, y + 32, 9);
        c.fill();
      }
      gloss(c, x - 7, y + 26, 8, 0.6);
    }
  }
}

// ---------- plant ----------
function drawPlant(c: Ctx, g: Geo, id: string) {
  if (id === 'bitki-yok') return;
  const { x, y, h } = g.plant;
  const potW = h * 0.34;
  softShadow(c, x, y, potW * 0.9, potW * 0.22, 0.25);
  c.save();
  c.translate(x, y);
  const k = h / 180;
  c.scale(k, k);
  switch (id) {
    case 'bitki-bambu': {
      for (const [dx, hh, lean] of [
        [-16, 130, -0.08],
        [0, 160, 0.02],
        [16, 120, 0.1],
      ]) {
        c.save();
        c.translate(dx, -40);
        c.rotate(lean);
        c.fillStyle = vGrad(c, -hh, 0, '#a9cf92', '#7fae6c');
        roundRect(c, -4, -hh, 8, hh, 4);
        c.fill();
        stroke(c);
        c.strokeStyle = 'rgba(50,80,40,0.35)';
        c.lineWidth = 2;
        for (let yy = -hh * 0.25; yy > -hh; yy -= hh * 0.25) {
          c.beginPath();
          c.moveTo(-4, yy);
          c.lineTo(4, yy);
          c.stroke();
        }
        c.fillStyle = '#6f9f5e';
        for (let i = 0; i < 4; i++) {
          const ly = -hh * (0.3 + i * 0.2);
          const s = i % 2 ? 1 : -1;
          c.save();
          c.translate(s * 4, ly);
          c.rotate(s * -0.9);
          ellipse(c, 14, 0, 16, 4);
          c.fill();
          c.restore();
        }
        c.restore();
      }
      break;
    }
    case 'bitki-monstera': {
      const leaves: [number, number, number, number][] = [
        [-30, -120, -0.6, 1],
        [34, -130, 0.5, 1.05],
        [-10, -150, -0.1, 1.15],
        [20, -95, 0.9, 0.8],
        [-38, -80, -1.1, 0.8],
      ];
      for (const [lx, ly, rot, s] of leaves) {
        c.strokeStyle = '#5f8a57';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(0, -40);
        c.quadraticCurveTo(lx * 0.3, ly * 0.6, lx, ly);
        c.stroke();
        c.save();
        c.translate(lx, ly);
        c.rotate(rot);
        c.scale(s, s);
        c.fillStyle = '#6f9f5e';
        c.beginPath();
        c.moveTo(0, 10);
        c.bezierCurveTo(-30, 0, -30, -40, 0, -46);
        c.bezierCurveTo(30, -40, 30, 0, 0, 10);
        c.closePath();
        c.fill();
        stroke(c);
        c.fillStyle = '#a3c99a';
        for (const sx of [-1, 1]) {
          for (let i = 0; i < 2; i++) {
            ellipse(c, sx * 16, -12 - i * 14, 7, 2.5);
            c.fill();
          }
        }
        c.strokeStyle = 'rgba(40,70,35,0.35)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(0, 8);
        c.lineTo(0, -42);
        c.stroke();
        c.restore();
      }
      break;
    }
    case 'bitki-sakura': {
      c.strokeStyle = '#5a3f32';
      c.lineCap = 'round';
      const branches: [number, number, number, number][] = [
        [0, -40, -30, -150],
        [0, -40, 28, -140],
        [0, -40, 4, -170],
        [-14, -100, -46, -120],
        [16, -100, 50, -115],
      ];
      for (const [x0, y0, x1, y1] of branches) {
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(x0, y0);
        c.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2, x1, y1);
        c.stroke();
      }
      const r = rng(5);
      for (let i = 0; i < 34; i++) {
        const b = branches[Math.floor(r() * branches.length)];
        const tt = 0.3 + r() * 0.7;
        const bx = b[0] + (b[2] - b[0]) * tt + (r() - 0.5) * 14;
        const by = b[1] + (b[3] - b[1]) * tt + (r() - 0.5) * 14;
        blossom(c, bx, by, 5 + r() * 2, r() < 0.6 ? PINK : PINK_L);
      }
      break;
    }
  }
  // pot / vase
  if (id === 'bitki-sakura') {
    c.fillStyle = vGrad(c, -60, 0, '#6f7fa8', '#44507f');
    c.beginPath();
    c.moveTo(-12, -60);
    c.quadraticCurveTo(-32, -30, -22, 0);
    c.lineTo(22, 0);
    c.quadraticCurveTo(32, -30, 12, -60);
    c.closePath();
    c.fill();
    stroke(c);
    gloss(c, -8, -30, 14, 0.35);
  } else {
    c.fillStyle = vGrad(c, -48, 0, '#e8c3a8', '#c58b6c');
    c.beginPath();
    c.moveTo(-30, -48);
    c.lineTo(30, -48);
    c.lineTo(24, 0);
    c.lineTo(-24, 0);
    c.closePath();
    c.fill();
    stroke(c);
    c.fillStyle = '#dca68a';
    roundRect(c, -33, -52, 66, 10, 3);
    c.fill();
    stroke(c);
    c.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(c, -24, -40, 8, 34, 4);
    c.fill();
  }
  c.restore();
}

// ---------- tables, benches ----------
function tableColors(style: string): { top: string; edge: string; leg: string } {
  switch (style) {
    case 'stil-ceviz':
      return { top: '#8a5e3e', edge: '#6e4b32', leg: '#5a3b26' };
    case 'stil-lake':
      return { top: '#c9432f', edge: '#9b2f20', leg: '#3a2a22' };
    case 'stil-mermer':
      return { top: '#f7f3ec', edge: '#d9d2c6', leg: '#9a8f86' };
    default:
      return { top: '#e9cba3', edge: '#c99a6b', leg: '#b98a5c' };
  }
}

function tableSprite(w: number, h: number, style: string, sus: string): HTMLCanvasElement {
  const key = `salon:table:${Math.round(w)}x${Math.round(h)}:${style}:${sus}`;
  return sprite(key, w + 20, h + 30, (c) => {
    c.translate(10, 10);
    const col = tableColors(style);
    const topH = h * 0.26;
    // legs
    c.fillStyle = col.leg;
    for (const lx of [w * 0.1, w * 0.84]) {
      roundRect(c, lx, topH, w * 0.06, h - topH, 3);
      c.fill();
      stroke(c);
    }
    // apron shadow
    c.fillStyle = 'rgba(60,35,20,0.12)';
    roundRect(c, w * 0.06, topH * 0.9, w * 0.88, topH * 0.5, 4);
    c.fill();
    // slab edge + top
    c.fillStyle = col.edge;
    roundRect(c, 0, topH * 0.45, w, topH * 0.7, topH * 0.3);
    c.fill();
    stroke(c);
    c.fillStyle = vGrad(c, 0, topH, shade(col.top, 0.14), col.top);
    roundRect(c, 0, 0, w, topH * 0.75, topH * 0.35);
    c.fill();
    stroke(c);
    c.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(c, w * 0.04, 2, w * 0.92, 3, 2);
    c.fill();
    if (style === 'stil-mermer') {
      c.strokeStyle = 'rgba(140,140,150,0.35)';
      c.lineWidth = 1;
      const r = rng(Math.round(w));
      for (let i = 0; i < 4; i++) {
        const sx = r() * w;
        c.beginPath();
        c.moveTo(sx, 2);
        c.bezierCurveTo(sx + 20, topH * 0.3, sx - 10, topH * 0.5, sx + 30, topH * 0.7);
        c.stroke();
      }
    } else if (style === 'stil-lake') {
      c.fillStyle = 'rgba(255,255,255,0.22)';
      roundRect(c, w * 0.06, 4, w * 0.5, topH * 0.16, 4);
      c.fill();
    } else {
      grainLines(c, 4, 4, w - 8, topH * 0.65, Math.round(w) + 3, 9, 'rgba(90,60,30,0.14)');
    }
    // table decoration at the centre of the top
    const cx = w / 2;
    const cy = topH * 0.35;
    switch (sus) {
      case 'sus-mum': {
        for (const dx of [-10, 8]) {
          c.fillStyle = '#fbf3e4';
          roundRect(c, cx + dx - 5, cy - 14, 10, 14, 2);
          c.fill();
          stroke(c);
          c.fillStyle = '#ffb347';
          ellipse(c, cx + dx, cy - 18, 2.5, 4.5);
          c.fill();
          c.fillStyle = '#fff2b0';
          ellipse(c, cx + dx, cy - 17, 1.2, 2.4);
          c.fill();
        }
        break;
      }
      case 'sus-cicek': {
        c.fillStyle = vGrad(c, cy - 18, cy, '#7f93b8', INDIGO);
        roundRect(c, cx - 6, cy - 18, 12, 18, 4);
        c.fill();
        stroke(c);
        c.strokeStyle = PAL.moss;
        c.lineWidth = 1.5;
        for (const [dx, dy, col] of [
          [-7, -30, PAL.rose],
          [0, -34, PINK_L],
          [7, -29, PAL.coral],
        ] as [number, number, string][]) {
          c.beginPath();
          c.moveTo(cx, cy - 16);
          c.lineTo(cx + dx, cy + dy + 4);
          c.stroke();
          blossom(c, cx + dx, cy + dy, 4.5, col);
        }
        break;
      }
      case 'sus-bonsai': {
        c.fillStyle = vGrad(c, cy - 8, cy, '#8a6a5a', '#5f4536');
        roundRect(c, cx - 13, cy - 8, 26, 8, 2);
        c.fill();
        stroke(c);
        c.strokeStyle = '#5a3f32';
        c.lineWidth = 3;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(cx, cy - 8);
        c.quadraticCurveTo(cx + 5, cy - 18, cx - 4, cy - 25);
        c.stroke();
        c.fillStyle = PAL.moss;
        ellipse(c, cx - 7, cy - 27, 12, 5);
        c.fill();
        ellipse(c, cx + 7, cy - 21, 9, 4);
        c.fill();
        c.fillStyle = PAL.matcha;
        ellipse(c, cx - 8, cy - 29, 7, 2.5);
        c.fill();
        break;
      }
      default: {
        // a small tray with chopsticks + a soy pot, always lovely
        c.fillStyle = '#3a3f4a';
        roundRect(c, cx - 16, cy - 6, 32, 7, 2);
        c.fill();
        c.fillStyle = vGrad(c, cy - 16, cy - 6, '#f6efe2', '#d8ccb8');
        roundRect(c, cx + 4, cy - 16, 9, 11, 3);
        c.fill();
        stroke(c);
        c.strokeStyle = '#8a5e3e';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(cx - 14, cy - 4);
        c.lineTo(cx + 2, cy - 9);
        c.moveTo(cx - 14, cy - 2);
        c.lineTo(cx + 2, cy - 7);
        c.stroke();
      }
    }
  });
}

/** Low bench with an indigo zabuton cushion. */
function drawBench(c: Ctx, x: number, bottom: number, size: number, style: string) {
  const col = tableColors(style);
  const w = size * 0.62;
  const h = size * 0.22;
  const cushion = size * 0.14;
  softShadow(c, x, bottom, w * 0.6, w * 0.12, 0.2);
  c.fillStyle = col.leg;
  roundRect(c, x - w / 2, bottom - h, w, h, 5);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(c, x - w / 2 + 4, bottom - h + 3, w - 8, 3, 2);
  c.fill();
  // cushion
  c.fillStyle = vGrad(c, bottom - h - cushion, bottom - h + 2, '#4b5a8f', INDIGO_D);
  roundRect(c, x - w / 2 + 4, bottom - h - cushion, w - 8, cushion + 4, cushion * 0.6);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(c, x - w / 2 + 10, bottom - h - cushion + 3, w - 20, cushion * 0.3, 3);
  c.fill();
  // tufts
  c.fillStyle = 'rgba(255,255,255,0.55)';
  for (const fx of [-0.25, 0.25]) {
    circle(c, x + w * fx, bottom - h - cushion * 0.45, 1.5);
    c.fill();
  }
}

/** Steaming noodle bowl on a table in front of a diner (per frame: steam). */
function drawTableBowl(c: Ctx, x: number, y: number, k: number, t: number) {
  const key = `salon:bowl:${Math.round(k * 100)}`;
  const sp = sprite(key, 40 * k, 24 * k, (sc) => {
    sc.translate(20 * k, 12 * k);
    sc.scale(k, k);
    softShadow(sc, 0, 8, 16, 4, 0.22);
    sc.fillStyle = vGrad(sc, -4, 10, '#d9573f', '#a93826');
    sc.beginPath();
    sc.moveTo(-16, -2);
    sc.quadraticCurveTo(-14, 10, 0, 10);
    sc.quadraticCurveTo(14, 10, 16, -2);
    sc.closePath();
    sc.fill();
    stroke(sc);
    sc.fillStyle = '#f4e6cf';
    ellipse(sc, 0, -2, 16, 5);
    sc.fill();
    stroke(sc, 'rgba(60,35,20,0.2)', 1);
    sc.fillStyle = '#e4b95f';
    ellipse(sc, 0, -2, 12.5, 3.6);
    sc.fill();
    // noodles, egg, nori
    sc.strokeStyle = '#f6dc9c';
    sc.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      sc.beginPath();
      sc.moveTo(i * 3 - 2, -1);
      sc.quadraticCurveTo(i * 3, -4, i * 3 + 2, -1);
      sc.stroke();
    }
    sc.fillStyle = '#fff6e9';
    ellipse(sc, -5, -2.5, 3.2, 2.2);
    sc.fill();
    sc.fillStyle = '#f0a33a';
    ellipse(sc, -5, -2.5, 1.6, 1.1);
    sc.fill();
    sc.fillStyle = '#2f4a3a';
    sc.fillRect(4, -5, 5, 4);
    sc.fillStyle = '#9fc39a';
    sc.fillRect(1, -3.5, 2, 1.6);
    // chopsticks
    sc.strokeStyle = '#8a5e3e';
    sc.lineWidth = 1.4;
    sc.beginPath();
    sc.moveTo(8, 2);
    sc.lineTo(20, -8);
    sc.moveTo(10, 3);
    sc.lineTo(21, -6);
    sc.stroke();
  });
  c.drawImage(sp, x - 20 * k, y - 12 * k, 40 * k, 24 * k);
  // steam
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = 2 * k;
  c.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const ph = (t * 0.7 + i * 0.5) % 1;
    const sx = x + (i - 0.5) * 8 * k;
    const sy = y - 4 * k - ph * 22 * k;
    c.globalAlpha = (1 - ph) * 0.8;
    c.beginPath();
    c.moveTo(sx, sy + 8 * k);
    c.quadraticCurveTo(sx + Math.sin(t * 3 + i) * 4 * k, sy + 4 * k, sx, sy);
    c.stroke();
  }
  c.globalAlpha = 1;
}

/** Small floating "waiting" ticket with an hourglass. */
function drawWaitTicket(c: Ctx, x: number, y: number, t: number) {
  const fy = y + Math.sin(t * 2.5) * 3;
  c.save();
  c.translate(x, fy);
  softShadow(c, 0, 16, 14, 4, 0.15);
  c.fillStyle = PAL.cream;
  roundRect(c, -13, -14, 26, 28, 6);
  c.fill();
  stroke(c);
  // hourglass
  c.fillStyle = PAL.honey;
  c.beginPath();
  c.moveTo(-6, -8);
  c.lineTo(6, -8);
  c.lineTo(0.8, 0);
  c.lineTo(6, 8);
  c.lineTo(-6, 8);
  c.lineTo(-0.8, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = PAL.inkSoft;
  c.lineWidth = 1.4;
  c.stroke();
  c.fillStyle = PAL.inkSoft;
  c.fillRect(-7, -10, 14, 2);
  c.fillRect(-7, 8, 14, 2);
  // tiny dots animating like sand
  c.fillStyle = PAL.inkSoft;
  circle(c, 0, (((t * 1.5) % 1) - 0.5) * 8, 1);
  c.fill();
  c.restore();
}

// ---------- back pass ----------
let lastBackKey = '';

function backSprite(
  W: number,
  H: number,
  decor: DecorState,
  tod: Tod,
  rain: boolean,
  lampsOn: boolean
) {
  const key = `salon:back:${W}x${H}:${Object.values(decor).join(',')}:${tod}:${rain ? 1 : 0}:${lampsOn ? 1 : 0}`;
  if (key !== lastBackKey) {
    // keep memory bounded: only one full-screen back sprite alive at a time
    if (lastBackKey) clearSprites('salon:back:');
    lastBackKey = key;
  }
  return sprite(key, W, H, (c) => {
    const g = geo(W, H, decor);
    drawWall(c, W, g, decor.duvar);
    drawFloor(c, W, g, H, decor.zemin);
    drawDoor(c, g, tod);
    drawWindow(c, g, tod, decor, rain);
    drawMenuBoard(c, g);
    drawScroll(c, g, decor.tablo);
    drawShelf(c, g);
    drawPlant(c, g, decor.bitki);
    for (const l of g.lamps) drawLamp(c, l.x, l.y, decor.lamba, lampsOn, g.beam);
  });
}

function drawPetalsOutside(c: Ctx, g: Geo, t: number) {
  const { x, y, w, h } = g.win;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  for (let i = 0; i < 20; i++) {
    const r = rng(900 + i);
    const sy = 14 + r() * 16;
    const sx = 8 + r() * 16;
    const ph = r();
    const size = 2.8 + r() * 2.8;
    const py = y + ((((t * sy) / (h + 30) + ph) % 1) * (h + 30) - 15);
    const px0 = x + w - ((((t * sx) / (w + 30) + r()) % 1) * (w + 30) - 15);
    const px = px0 + Math.sin(t * 1.6 + i) * 7;
    petal(c, px, py, size, t * 2.2 + i, i % 3 ? PINK_L : PINK);
  }
  c.restore();
}

function drawPetalsInside(c: Ctx, g: Geo, W: number, t: number) {
  // a handful of petals drift from the window toward the counter
  const { x, w } = g.win;
  const top = g.win.y + g.win.h * 0.3;
  const bottom = g.counterTop + 20;
  for (let i = 0; i < 6; i++) {
    const r = rng(1200 + i);
    const sy = 10 + r() * 10;
    const sx = 10 + r() * 12;
    const size = 3 + r() * 2.5;
    const prog = ((t * sy) / (bottom - top) + r()) % 1;
    const py = top + prog * (bottom - top);
    const px = x + w * 0.5 - ((t * sx + r() * 400) % (w * 0.5 + 220)) + Math.sin(t * 1.3 + i) * 10;
    if (px < 0 || px > W) continue;
    c.globalAlpha = Math.min(1, (1 - prog) * 2.5) * 0.9;
    petal(c, px, py, size, t * 1.8 + i, i % 2 ? PINK_L : PINK);
  }
  c.globalAlpha = 1;
}

export function drawSalonBack(
  c: Ctx,
  W: number,
  H: number,
  decor: DecorState,
  tod: Tod,
  t: number,
  o: SalonOpts
): void {
  const lampsOn = o.lampsOn ?? TOD_LIGHT[tod].lamp > 0;
  const g = geo(W, H, decor);
  c.save();
  c.drawImage(backSprite(W, H, decor, tod, !!o.rain, lampsOn), 0, 0, W, H);
  if (o.rain) {
    const { x, y, w, h } = g.win;
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.38)';
    c.lineWidth = 1.2;
    c.lineCap = 'round';
    const r = rng(3);
    for (let i = 0; i < 28; i++) {
      const sx = x + r() * w;
      const sp = 0.6 + r() * 0.8;
      const ph = ((t * sp + r()) % 1) * (h + 40) - 20;
      c.beginPath();
      c.moveTo(sx, y + ph);
      c.lineTo(sx - 2, y + ph + 14 + r() * 12);
      c.stroke();
    }
    c.restore();
  } else {
    drawPetalsOutside(c, g, t);
  }
  // tables + diners, back to front
  const layout = salonLayout(W, H, decor);
  const order = g.tables.map((tb, i) => ({ tb, i })).sort((a, b) => a.tb.ground - b.tb.ground);
  for (const { tb, i } of order) {
    const top = tb.ground - tb.h;
    softShadow(c, tb.x, tb.ground, tb.w * 0.62, tb.w * 0.13, 0.24);
    for (let s = 0; s < 2; s++) {
      const seatIdx = i * 2 + s;
      const seat = layout.seats[seatIdx];
      drawBench(c, seat.x, seat.y + seat.size * 0.14, seat.size, decor.masaStil);
      const d = o.diners.find((dd) => dd.seat === seatIdx);
      if (d) {
        const ao = {
          eating: d.eating && !d.waiting,
          bob: d.bob,
          pose: 'sit' as const,
          flip: s === 1,
        };
        drawAvatar(c, d.look, d.mood, seat.x, seat.y, seat.size, ao);
      }
    }
    const sp = tableSprite(tb.w, tb.h, decor.masaStil, decor.masaSus);
    c.drawImage(sp, tb.x - tb.w / 2 - 10, top - 10, tb.w + 20, tb.h + 30);
    for (let s = 0; s < 2; s++) {
      const d = o.diners.find((dd) => dd.seat === i * 2 + s);
      if (!d) continue;
      const bx = tb.x + (s ? 1 : -1) * tb.w * 0.27;
      if (d.waiting) {
        const seat = layout.seats[i * 2 + s];
        drawWaitTicket(c, seat.x, seat.y - seat.size - 22 - d.bob, t + s);
      } else if (d.eating) {
        drawTableBowl(c, bx, top + tb.h * 0.09, tb.scale * (g.land ? 1 : 0.9), t + i + s);
      }
    }
  }
  if (!o.rain) drawPetalsInside(c, g, W, t);
  c.restore();
}

// ---------- counter items ----------
function drawRegister(c: Ctx, r: Rect) {
  const { x, y, w, h } = r;
  softShadow(c, x + w / 2, y + h, w * 0.6, h * 0.1, 0.25);
  c.fillStyle = vGrad(c, y + h * 0.3, y + h, '#f4ece0', '#dccfbb');
  roundRect(c, x, y + h * 0.32, w, h * 0.68, 10);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(60,35,20,0.1)';
  roundRect(c, x + 6, y + h * 0.82, w - 12, h * 0.1, 4);
  c.fill();
  c.fillStyle = PAL.sage;
  roundRect(c, x + w * 0.4, y + h * 0.84, w * 0.2, h * 0.06, 3);
  c.fill();
  const kx = x + w * 0.08;
  const ky = y + h * 0.4;
  const kw = (w * 0.56) / 4;
  const kh = (h * 0.34) / 3;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      c.fillStyle = (i + j) % 2 ? '#fbf7ef' : '#f1dfc4';
      roundRect(c, kx + i * kw + 2, ky + j * kh + 2, kw - 4, kh - 4, 3);
      c.fill();
      stroke(c, 'rgba(60,35,20,0.12)');
    }
  }
  c.fillStyle = PAL.coral;
  roundRect(c, x + w * 0.68, ky + 2, w * 0.24, kh * 1.5 - 4, 4);
  c.fill();
  stroke(c);
  c.fillStyle = PAL.matcha;
  roundRect(c, x + w * 0.68, ky + kh * 1.5 + 2, w * 0.24, kh * 1.5 - 4, 4);
  c.fill();
  stroke(c);
  c.fillStyle = '#3a3d45';
  roundRect(c, x + w * 0.12, y, w * 0.76, h * 0.36, 7);
  c.fill();
  stroke(c);
  c.fillStyle = '#243b33';
  roundRect(c, x + w * 0.18, y + h * 0.06, w * 0.64, h * 0.22, 4);
  c.fill();
  c.fillStyle = '#9ff0b0';
  c.font = `800 ${Math.round(h * 0.13)}px "Baloo 2", system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('NODDLES', x + w / 2, y + h * 0.17);
  c.fillStyle = 'rgba(255,255,255,0.1)';
  roundRect(c, x + w * 0.2, y + h * 0.07, w * 0.2, h * 0.08, 3);
  c.fill();
}

function drawTipJar(c: Ctx, j: Rect, coins: number) {
  const { x, y, w, h } = j;
  softShadow(c, x + w / 2, y + h, w * 0.55, w * 0.14, 0.22);
  const n = clamp(Math.floor(coins), 0, 14);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const cy = y + h - 6 - row * 7;
    const cx = x + w * (0.33 + col * 0.34) + (row % 2) * 4;
    c.fillStyle = i % 3 === 0 ? '#e8b35a' : '#f3cf7a';
    ellipse(c, cx, cy, w * 0.19, 4);
    c.fill();
    stroke(c, 'rgba(120,80,20,0.35)', 1);
    c.fillStyle = 'rgba(255,255,255,0.4)';
    ellipse(c, cx - 2, cy - 1, w * 0.08, 1.5);
    c.fill();
  }
  c.fillStyle = 'rgba(215,235,240,0.35)';
  roundRect(c, x, y + h * 0.12, w, h * 0.88, w * 0.22);
  c.fill();
  stroke(c, 'rgba(60,35,20,0.3)');
  c.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(c, x + w * 0.12, y + h * 0.2, w * 0.14, h * 0.6, 4);
  c.fill();
  c.fillStyle = WALNUT_L;
  roundRect(c, x - 2, y + h * 0.04, w + 4, h * 0.12, 4);
  c.fill();
  stroke(c);
  c.fillStyle = WALNUT;
  roundRect(c, x + w * 0.35, y, w * 0.3, h * 0.08, 3);
  c.fill();
  c.fillStyle = PAL.paper;
  roundRect(c, x + w * 0.16, y + h * 0.4, w * 0.68, h * 0.22, 3);
  c.fill();
  stroke(c, 'rgba(60,35,20,0.2)', 1);
  c.fillStyle = PAL.tomato;
  c.font = `800 ${Math.round(h * 0.11)}px "Baloo 2", system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('bahşiş', x + w / 2, y + h * 0.51);
}

/** Sleek tablet on a small wooden stand, showing the order app. */
function drawTablet(c: Ctx, p: Rect, ringing: boolean, t: number) {
  const { x, y, w, h } = p;
  const pulse = ringing ? 0.5 + 0.5 * Math.sin(t * 9) : 0;
  softShadow(c, x + w / 2, y + h, w * 0.55, w * 0.1, 0.24);
  if (ringing) {
    const gr = c.createRadialGradient(
      x + w / 2,
      y + h * 0.45,
      w * 0.1,
      x + w / 2,
      y + h * 0.45,
      w * 0.85
    );
    gr.addColorStop(0, `rgba(255,170,140,${0.28 + pulse * 0.22})`);
    gr.addColorStop(1, 'rgba(255,170,140,0)');
    c.fillStyle = gr;
    c.fillRect(x - w * 0.5, y - h * 0.5, w * 2, h * 2);
  }
  // stand: back support + base plank with a lip
  c.fillStyle = vGrad(c, y + h * 0.3, y + h * 0.9, WALNUT_L, WALNUT);
  roundRect(c, x + w * 0.3, y + h * 0.3, w * 0.4, h * 0.6, 4);
  c.fill();
  c.fillStyle = vGrad(c, y + h * 0.84, y + h, '#8a6648', WALNUT);
  roundRect(c, x + w * 0.06, y + h * 0.84, w * 0.88, h * 0.16, 5);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(c, x + w * 0.08, y + h * 0.85, w * 0.84, 2, 1);
  c.fill();
  // body, slightly leaning back (drawn as a rounded slab with a thin lit top edge)
  const bx = x + w * 0.04;
  const by = y;
  const bw = w * 0.92;
  const bh = h * 0.8;
  c.fillStyle = vGrad(c, by, by + bh, '#4a4e58', '#20232a');
  roundRect(c, bx, by, bw, bh, 7);
  c.fill();
  stroke(c, 'rgba(60,35,20,0.35)');
  c.fillStyle = 'rgba(255,255,255,0.28)';
  roundRect(c, bx + 4, by + 1, bw - 8, 1.6, 1);
  c.fill();
  // screen
  const sx = bx + 5;
  const sy = by + 5;
  const sw = bw - 10;
  const sh = bh - 10;
  c.save();
  roundRect(c, sx, sy, sw, sh, 4);
  c.clip();
  c.fillStyle = vGrad(c, sy, sy + sh, '#fff9f0', '#fdebdd');
  c.fillRect(sx, sy, sw, sh);
  // top app bar with the wordmark
  c.fillStyle = vGrad(c, sy, sy + sh * 0.26, '#f08a76', '#e3705c');
  c.fillRect(sx, sy, sw, sh * 0.26);
  c.fillStyle = '#fff6e9';
  c.font = `800 ${Math.round(sh * 0.17)}px "Baloo 2", system-ui, sans-serif`;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText('Noddles', sx + sw * 0.08, sy + sh * 0.135);
  // tiny bowl icon right of the bar
  c.fillStyle = '#fff6e9';
  ellipse(c, sx + sw * 0.88, sy + sh * 0.14, sw * 0.055, sh * 0.06);
  c.fill();
  c.fillStyle = '#e3705c';
  ellipse(c, sx + sw * 0.88, sy + sh * 0.125, sw * 0.04, sh * 0.03);
  c.fill();
  // order rows
  for (let i = 0; i < 3; i++) {
    const ry = sy + sh * (0.34 + i * 0.2);
    c.fillStyle = i === 0 ? '#fde3d8' : '#f6ece0';
    roundRect(c, sx + sw * 0.06, ry, sw * 0.88, sh * 0.15, 3);
    c.fill();
    c.fillStyle = [PAL.matcha, PAL.butter, PAL.blue][i];
    circle(c, sx + sw * 0.13, ry + sh * 0.075, sh * 0.045);
    c.fill();
    c.fillStyle = 'rgba(60,35,20,0.35)';
    roundRect(c, sx + sw * 0.21, ry + sh * 0.04, sw * (0.3 + i * 0.08), sh * 0.03, 1.5);
    c.fill();
    c.fillStyle = 'rgba(60,35,20,0.18)';
    roundRect(c, sx + sw * 0.21, ry + sh * 0.09, sw * 0.22, sh * 0.025, 1.5);
    c.fill();
    c.fillStyle = i === 0 ? PAL.coral : PAL.sage;
    roundRect(c, sx + sw * 0.78, ry + sh * 0.04, sw * 0.13, sh * 0.07, 3);
    c.fill();
  }
  if (ringing) {
    // bright pulse + notification card sliding in
    c.fillStyle = `rgba(255,255,255,${0.1 + pulse * 0.18})`;
    c.fillRect(sx, sy, sw, sh);
    const slide = Math.min(1, (t % 1.6) * 3);
    const ny = sy + sh * 0.3 - (1 - slide) * sh * 0.3;
    c.fillStyle = 'rgba(60,35,20,0.18)';
    roundRect(c, sx + sw * 0.1, ny + 3, sw * 0.8, sh * 0.36, 5);
    c.fill();
    c.fillStyle = '#ffffff';
    roundRect(c, sx + sw * 0.1, ny, sw * 0.8, sh * 0.36, 5);
    c.fill();
    stroke(c, 'rgba(60,35,20,0.18)', 1);
    c.fillStyle = PAL.coral;
    circle(c, sx + sw * 0.2, ny + sh * 0.18, sh * 0.08);
    c.fill();
    c.fillStyle = '#fff';
    // bell
    c.beginPath();
    c.arc(sx + sw * 0.2, ny + sh * 0.18, sh * 0.04, Math.PI, 0);
    c.lineTo(sx + sw * 0.2 + sh * 0.05, ny + sh * 0.22);
    c.lineTo(sx + sw * 0.2 - sh * 0.05, ny + sh * 0.22);
    c.closePath();
    c.fill();
    c.fillStyle = PAL.ink;
    c.font = `800 ${Math.round(sh * 0.11)}px "Baloo 2", system-ui, sans-serif`;
    c.textAlign = 'left';
    c.fillText('Yeni sipariş!', sx + sw * 0.3, ny + sh * 0.13);
    c.fillStyle = 'rgba(60,35,20,0.3)';
    roundRect(c, sx + sw * 0.3, ny + sh * 0.22, sw * 0.42, sh * 0.035, 1.5);
    c.fill();
  } else {
    // soft screen sheen
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.beginPath();
    c.moveTo(sx, sy + sh);
    c.lineTo(sx + sw * 0.35, sy);
    c.lineTo(sx + sw * 0.5, sy);
    c.lineTo(sx + sw * 0.15, sy + sh);
    c.closePath();
    c.fill();
  }
  c.restore();
  // home dot + camera
  c.fillStyle = 'rgba(255,255,255,0.35)';
  circle(c, bx + bw / 2, by + bh - 2.4, 1.3);
  c.fill();
  if (ringing) {
    c.strokeStyle = `rgba(239,138,118,${0.45 + pulse * 0.4})`;
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    for (const s of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        c.beginPath();
        c.arc(
          x + w / 2 + s * (w * 0.5 + 4),
          y + h * 0.35,
          7 + i * 7 + pulse * 2,
          s > 0 ? -0.6 : Math.PI - 0.6,
          s > 0 ? 0.6 : Math.PI + 0.6
        );
        c.stroke();
      }
    }
  }
}

function drawDeliveryBox(c: Ctx, b: Rect, open: boolean) {
  const { x, y, w, h } = b;
  softShadow(c, x + w / 2, y + h, w * 0.6, w * 0.1, 0.25);
  const top = y + h * 0.3;
  c.fillStyle = vGrad(c, top, y + h, '#dcb993', '#bf9568');
  roundRect(c, x, top, w, h - (top - y), 6);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(60,35,20,0.08)';
  c.fillRect(x + w * 0.5 - 1, top + 6, 2, h - (top - y) - 12);
  c.save();
  c.translate(x + w * 0.5, y + h * 0.68);
  c.rotate(-0.06);
  c.strokeStyle = 'rgba(217,87,63,0.8)';
  c.lineWidth = 1.6;
  roundRect(c, -w * 0.3, -h * 0.11, w * 0.6, h * 0.22, 4);
  c.stroke();
  c.fillStyle = 'rgba(217,87,63,0.9)';
  c.font = `800 ${Math.round(h * 0.13)}px "Baloo 2", system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('NODDLES', 0, 0.5);
  c.restore();
  if (open) {
    c.fillStyle = '#efdcc0';
    roundRect(c, x + w * 0.25, y + h * 0.05, w * 0.5, h * 0.3, 4);
    c.fill();
    stroke(c);
    c.strokeStyle = 'rgba(60,35,20,0.3)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + w * 0.37, y + h * 0.05);
    c.lineTo(x + w * 0.37, y + h * 0.18);
    c.moveTo(x + w * 0.63, y + h * 0.05);
    c.lineTo(x + w * 0.63, y + h * 0.18);
    c.stroke();
    c.fillStyle = '#d7b58f';
    roundRect(c, x + w * 0.35, y + h * 0.02, w * 0.3, h * 0.06, 3);
    c.fill();
  }
  c.save();
  if (open) {
    c.translate(x, top);
    c.rotate(-1.15);
    c.fillStyle = vGrad(c, -h * 0.3, 0, '#c9a07a', '#bf9568');
    roundRect(c, 0, -h * 0.22, w, h * 0.22, 5);
    c.fill();
    stroke(c);
  } else {
    c.fillStyle = vGrad(c, top - h * 0.2, top, '#e6c8a4', '#cfa77d');
    roundRect(c, x - 3, top - h * 0.2, w + 6, h * 0.22, 5);
    c.fill();
    stroke(c);
    c.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(c, x + 6, top - h * 0.17, w * 0.4, h * 0.05, 2);
    c.fill();
    c.fillStyle = 'rgba(60,35,20,0.3)';
    roundRect(c, x + w * 0.38, top - h * 0.1, w * 0.24, h * 0.05, 3);
    c.fill();
  }
  c.restore();
}

function drawCounterDeco(c: Ctx, x: number, bottom: number, iw: number, id: string) {
  if (id === 'tezgah-sade') return;
  c.save();
  c.translate(x, bottom);
  c.scale(iw, iw);
  softShadow(c, 0, 0, 30, 7, 0.22);
  switch (id) {
    case 'tezgah-maneki': {
      c.fillStyle = '#fbf7ef';
      c.beginPath();
      c.moveTo(-22, 0);
      c.quadraticCurveTo(-26, -34, -8, -42);
      c.quadraticCurveTo(0, -44, 8, -42);
      c.quadraticCurveTo(26, -34, 22, 0);
      c.closePath();
      c.fill();
      stroke(c);
      ellipse(c, 0, -52, 20, 17);
      c.fill();
      stroke(c);
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * 8, -64);
        c.lineTo(s * 17, -76);
        c.lineTo(s * 19, -60);
        c.closePath();
        c.fill();
        stroke(c);
      }
      c.fillStyle = '#f0a860';
      ellipse(c, -11, -60, 6, 4.5);
      c.fill();
      ellipse(c, 12, -26, 7, 9);
      c.fill();
      c.strokeStyle = '#3a2a22';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-9, -54);
      c.quadraticCurveTo(-6, -58, -3, -54);
      c.moveTo(3, -54);
      c.quadraticCurveTo(6, -58, 9, -54);
      c.stroke();
      c.fillStyle = PAL.coral;
      circle(c, 0, -48, 1.6);
      c.fill();
      c.fillStyle = PAL.tomato;
      roundRect(c, -14, -38, 28, 5, 2.5);
      c.fill();
      c.fillStyle = '#e8b35a';
      circle(c, 0, -32, 4);
      c.fill();
      stroke(c);
      c.fillStyle = '#fbf7ef';
      roundRect(c, 12, -66, 10, 26, 5);
      c.fill();
      stroke(c);
      c.fillStyle = '#e8b35a';
      ellipse(c, -14, -22, 9, 12);
      c.fill();
      stroke(c);
      brushChar(c, -19, -28, 10, 88, 'rgba(120,80,20,0.7)');
      break;
    }
    case 'tezgah-daruma': {
      c.fillStyle = vGrad(c, -60, 0, '#e85a44', '#c9432f');
      c.beginPath();
      c.moveTo(-24, -4);
      c.quadraticCurveTo(-30, -60, 0, -62);
      c.quadraticCurveTo(30, -60, 24, -4);
      c.quadraticCurveTo(0, 4, -24, -4);
      c.closePath();
      c.fill();
      stroke(c);
      gloss(c, -10, -46, 12, 0.35);
      c.fillStyle = '#fbf3e4';
      c.beginPath();
      c.moveTo(-15, -22);
      c.quadraticCurveTo(-16, -48, 0, -50);
      c.quadraticCurveTo(16, -48, 15, -22);
      c.quadraticCurveTo(0, -16, -15, -22);
      c.closePath();
      c.fill();
      c.strokeStyle = '#3a2a22';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(-6, -36, 4, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#3a2a22';
      circle(c, 6, -36, 4);
      c.fill();
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-11, -44);
      c.quadraticCurveTo(-6, -47, -2, -43);
      c.moveTo(2, -43);
      c.quadraticCurveTo(6, -47, 11, -44);
      c.stroke();
      brushChar(c, -5, -15, 10, 89, 'rgba(232,179,90,0.95)');
      break;
    }
    case 'tezgah-ikebana': {
      c.fillStyle = vGrad(c, -14, 0, '#4a5260', '#2d323c');
      ellipse(c, 0, -6, 30, 7);
      c.fill();
      stroke(c);
      c.fillStyle = '#4a5260';
      ellipse(c, 0, -8, 26, 4.5);
      c.fill();
      c.strokeStyle = '#5a3f32';
      c.lineCap = 'round';
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(-4, -8);
      c.quadraticCurveTo(-20, -40, -10, -70);
      c.moveTo(0, -8);
      c.quadraticCurveTo(14, -30, 26, -42);
      c.stroke();
      c.fillStyle = '#6f8f66';
      c.save();
      c.translate(6, -16);
      c.rotate(-0.6);
      ellipse(c, 0, 0, 16, 4);
      c.fill();
      c.restore();
      blossom(c, -10, -70, 7, PAL.rose);
      blossom(c, -15, -52, 5, PAL.blush);
      blossom(c, 26, -42, 6, PAL.butter);
      break;
    }
  }
  c.restore();
}

function drawCash(c: Ctx, x: number, y: number, iw: number) {
  c.save();
  c.translate(x, y);
  c.scale(iw, iw);
  softShadow(c, 0, 4, 40, 6, 0.18);
  for (const [dx, dy, rot, col] of [
    [0, 0, -0.12, '#cfd9b4'],
    [8, -3, 0.08, '#d6c4e3'],
  ] as [number, number, number, string][]) {
    c.save();
    c.translate(dx, dy);
    c.rotate(rot);
    c.fillStyle = col;
    roundRect(c, -30, -11, 60, 22, 3);
    c.fill();
    stroke(c);
    c.strokeStyle = 'rgba(60,35,20,0.25)';
    c.lineWidth = 1;
    roundRect(c, -26, -8, 52, 16, 2);
    c.stroke();
    c.fillStyle = 'rgba(60,35,20,0.25)';
    circle(c, 0, 0, 5);
    c.fill();
    c.restore();
  }
  for (const [cx, cy] of [
    [34, 6],
    [42, 2],
    [-34, 6],
  ]) {
    c.fillStyle = '#e8b35a';
    ellipse(c, cx, cy, 6, 4);
    c.fill();
    stroke(c, 'rgba(120,80,20,0.4)', 1);
  }
  c.restore();
}

function counterSprite(W: number, H: number, g: Geo, L: SalonLayout) {
  return sprite(`salon:counter:${W}x${H}`, W, H - g.counterTop + 10, (c) => {
    c.translate(0, -g.counterTop + 10);
    const top = g.counterTop;
    const band = g.counterSurf - top;
    // front: vertical hinoki slats (tambour) with soft gaps
    c.fillStyle = vGrad(c, top + band, H, '#e6c9a4', '#cfa97c');
    c.fillRect(0, top + band, W, H - top - band);
    const sw = Math.max(14, W / 70);
    const r = rng(300);
    for (let x = 0; x < W; x += sw) {
      c.fillStyle = `rgba(120,80,40,${0.02 + r() * 0.06})`;
      c.fillRect(x, top + band, sw, H - top - band);
      c.fillStyle = 'rgba(60,35,20,0.2)';
      c.fillRect(x, top + band + 10, 1.6, H);
      c.fillStyle = 'rgba(255,245,230,0.22)';
      c.fillRect(x + 1.6, top + band + 10, 1.6, H);
      grainLines(
        c,
        x + 3,
        top + band + 16,
        sw - 6,
        H - top - band - 20,
        300 + x,
        3,
        'rgba(120,80,40,0.1)',
        true
      );
    }
    // kick plinth at the very bottom + a thin rail line
    c.fillStyle = vGrad(c, H - 18, H, WALNUT_L, WALNUT);
    c.fillRect(0, H - 18, W, 18);
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.fillRect(0, H - 18, W, 1.5);
    // dark trim under the top + its shadow
    c.fillStyle = vGrad(c, top + band, top + band + 12, WALNUT_L, WALNUT);
    c.fillRect(0, top + band, W, 12);
    c.fillStyle = vGrad(
      c,
      top + band + 12,
      top + band + 26,
      'rgba(60,35,20,0.3)',
      'rgba(60,35,20,0)'
    );
    c.fillRect(0, top + band + 12, W, 14);
    // oak top (perspective band) with a lacquered edge
    c.fillStyle = vGrad(c, top, top + band, '#e2b687', '#c9975f');
    c.fillRect(0, top, W, band);
    grainLines(c, 0, top + 3, W, band - 6, 311, 44, 'rgba(120,70,30,0.15)');
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fillRect(0, top, W, 3);
    c.fillStyle = 'rgba(255,240,220,0.14)';
    c.fillRect(0, top + 3, W, band * 0.4);
    c.fillStyle = vGrad(c, top + band - 8, top + band, 'rgba(60,35,20,0)', 'rgba(60,35,20,0.28)');
    c.fillRect(0, top + band - 8, W, 8);
    // a few landed sakura petals near the tablet
    const pr = rng(515);
    for (let i = 0; i < 4; i++) {
      petal(
        c,
        L.phone.x + L.phone.w + 10 + pr() * 60,
        top + band * (0.35 + pr() * 0.5),
        3 + pr() * 1.5,
        pr() * 6.28,
        i % 2 ? PINK_L : PINK
      );
    }
    // a small bamboo tray with chopsticks beside the register
    const tx = L.tipJar.x - 50;
    const ty = L.register.y + L.register.h;
    softShadow(c, tx, ty, 26, 5, 0.18);
    c.fillStyle = vGrad(c, ty - 8, ty, '#d9b07a', '#b58b4e');
    roundRect(c, tx - 24, ty - 8, 48, 8, 2);
    c.fill();
    stroke(c);
    c.strokeStyle = '#8a5e3e';
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(tx - 16 + i * 7, ty - 8);
      c.lineTo(tx - 10 + i * 7, ty - 30);
      c.stroke();
    }
  });
}

export function drawSalonFront(
  c: Ctx,
  W: number,
  H: number,
  decor: DecorState,
  tod: Tod,
  t: number,
  o: SalonOpts
): void {
  void tod;
  const g = geo(W, H, decor);
  const L = salonLayout(W, H, decor);
  c.save();
  c.drawImage(counterSprite(W, H, g, L), 0, g.counterTop - 10, W, H - g.counterTop + 10);
  drawDeliveryBox(c, L.deliveryBox, !!o.boxOpen);
  drawTablet(c, L.phone, !!o.phoneRinging, t);
  drawCounterDeco(c, g.decoX, L.register.y + L.register.h, g.iw, decor.tezgah);
  drawTipJar(c, L.tipJar, o.tipCoins);
  drawRegister(c, L.register);
  if (o.cashOnCounter) drawCash(c, L.customer.x + 60 * g.iw, g.counterSurf - 14 * g.iw, g.iw);
  c.restore();
}

export function drawSalonLight(c: Ctx, W: number, H: number, decor: DecorState, tod: Tod): void {
  const L = TOD_LIGHT[tod];
  const g = geo(W, H, decor);
  const base = `salon:light:${W}x${H}:${tod}:${decor.lamba}:${g.lamps.length}`;
  const dark = tod === 'aksam' || tod === 'gunbatimi';
  // layer 1 (multiply): ambient colour + cool corners at dusk/night
  const mul = dark
    ? sprite(
        base + ':mul',
        W,
        H,
        (lc) => {
          lc.fillStyle = tod === 'aksam' ? '#8f97c9' : '#f3c9a5';
          lc.fillRect(0, 0, W, H);
          for (const [cx, cy] of [
            [0, 0],
            [W, 0],
            [0, H],
            [W, H],
          ]) {
            const gr = lc.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.7);
            gr.addColorStop(0, `rgba(70,75,130,${0.45 * L.lamp})`);
            gr.addColorStop(1, 'rgba(70,75,130,0)');
            lc.fillStyle = gr;
            lc.fillRect(0, 0, W, H);
          }
          // the lantern pools stay bright in the multiply layer
          for (const l of g.lamps) {
            const ly = l.y + 30;
            const gr = lc.createRadialGradient(l.x, ly, 0, l.x, ly, Math.min(W, H) * 0.5);
            gr.addColorStop(0, `rgba(255,240,215,${0.9 * L.lamp})`);
            gr.addColorStop(0.5, `rgba(255,235,205,${0.35 * L.lamp})`);
            gr.addColorStop(1, 'rgba(255,235,205,0)');
            lc.fillStyle = gr;
            lc.fillRect(0, 0, W, H);
          }
        },
        0.25
      )
    : null;
  // layer 2 (normal): window light patch, warm glows, vignette
  const over = sprite(
    base + ':over',
    W,
    H,
    (lc) => {
      if (tod === 'sabah') {
        lc.fillStyle = rgba(L.tint, L.alpha * 0.8);
        lc.fillRect(0, 0, W, H);
      }
      const { x, y, w, h } = g.win;
      const patch: Record<Tod, [string, number, number]> = {
        sabah: ['rgba(255,236,200,0.22)', 0.25, 0.0],
        ogle: ['rgba(255,255,245,0.14)', 0.1, 0.0],
        gunbatimi: ['rgba(255,190,120,0.32)', 0.65, -0.55],
        aksam: ['rgba(150,180,235,0.12)', 0.2, -0.1],
      };
      const [pc, spread, shift] = patch[tod];
      lc.fillStyle = pc;
      lc.beginPath();
      lc.moveTo(x, y + h);
      lc.lineTo(x + w, y + h);
      lc.lineTo(x + w + w * spread + w * shift, H);
      lc.lineTo(x - w * spread + w * shift, H);
      lc.closePath();
      lc.fill();
      if (tod === 'gunbatimi' || tod === 'sabah') {
        lc.strokeStyle = 'rgba(60,35,20,0.08)';
        lc.lineWidth = w * 0.012;
        for (const fx of [1 / 3, 2 / 3]) {
          lc.beginPath();
          lc.moveTo(x + w * fx, y + h);
          lc.lineTo(x + w * fx + (w * shift + (fx - 0.5) * w * spread * 2), H);
          lc.stroke();
        }
      }
      if (L.lamp > 0) {
        for (const l of g.lamps) {
          const ly = l.y + 30;
          const gr = lc.createRadialGradient(l.x, ly, 0, l.x, ly, Math.min(W, H) * 0.32);
          gr.addColorStop(0, `rgba(255,220,150,${0.5 * L.lamp})`);
          gr.addColorStop(0.4, `rgba(255,210,140,${0.18 * L.lamp})`);
          gr.addColorStop(1, 'rgba(255,200,120,0)');
          lc.fillStyle = gr;
          lc.fillRect(0, 0, W, H);
        }
      }
      lc.fillStyle = vGrad(lc, 0, H * 0.4, 'rgba(255,240,215,0.08)', 'rgba(255,240,215,0)');
      lc.fillRect(0, 0, W, H * 0.4);
      const v = lc.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.45,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.78
      );
      v.addColorStop(0, 'rgba(60,35,20,0)');
      v.addColorStop(1, `rgba(60,35,20,${dark ? 0.3 : 0.2})`);
      lc.fillStyle = v;
      lc.fillRect(0, 0, W, H);
    },
    0.25
  );
  c.save();
  if (mul) {
    c.globalCompositeOperation = 'multiply';
    c.drawImage(mul, 0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  }
  c.drawImage(over, 0, 0, W, H);
  c.restore();
}
