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
  hGrad,
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

/** Translatable labels painted into the scene; the game sets them from its language. */
export const SALON_LABELS = { open: 'AÇIK', tips: 'bahşiş', newOrder: 'Yeni sipariş!' };

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

const AO = (a: number) => `rgba(45,28,18,${a})`;
const AO0 = 'rgba(45,28,18,0)';

/** Soft contact shadow fading downward from a horizontal edge (under shelves, lips, sills). */
function dropAO(c: Ctx, x: number, y: number, w: number, size: number, alpha: number) {
  c.fillStyle = vGrad(c, y, y + size, AO(alpha), AO0);
  c.fillRect(x, y, w, size);
}

/** Ambient occlusion creeping in from the four inside edges of a rect (window reveals, frames). */
function innerAO(c: Ctx, x: number, y: number, w: number, h: number, size: number, alpha: number) {
  c.fillStyle = vGrad(c, y, y + size, AO(alpha), AO0);
  c.fillRect(x, y, w, size);
  c.fillStyle = vGrad(c, y + h - size, y + h, AO0, AO(alpha * 0.7));
  c.fillRect(x, y + h - size, w, size);
  c.fillStyle = hGrad(c, x, x + size, AO(alpha * 0.8), AO0);
  c.fillRect(x, y, size, h);
  c.fillStyle = hGrad(c, x + w - size, x + w, AO0, AO(alpha * 0.8));
  c.fillRect(x + w - size, y, size, h);
}

/** Soft radial glow (lamp light on a wall, sun haze). */
function glow(c: Ctx, x: number, y: number, r: number, rgb: string, alpha: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(0.45, `rgba(${rgb},${alpha * 0.4})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Thin highlight line along a lit edge. */
function hiLine(c: Ctx, x: number, y: number, w: number, alpha = 0.3, h = 1.5) {
  c.fillStyle = `rgba(255,250,240,${alpha})`;
  c.fillRect(x, y, w, h);
}

/** Satin sheen: a soft horizontal light band across a surface (lacquer, glass, wood). */
function sheen(c: Ctx, x: number, y: number, w: number, h: number, alpha: number) {
  const g = c.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.35, `rgba(255,255,255,${alpha})`);
  g.addColorStop(0.55, `rgba(255,255,255,${alpha * 0.6})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
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

/** Five-petal blossom: shaded petals (darker base, lighter tip), white heart, tiny stamens. */
function blossom(c: Ctx, x: number, y: number, r: number, col: string, centre = true, rot = 0) {
  const dark = mix(col.startsWith('#') ? col : '#f4b9c9', '#c97d9a', 0.35);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 - Math.PI / 2 + rot;
    const px = x + Math.cos(a) * r * 0.55;
    const py = y + Math.sin(a) * r * 0.55;
    petal(c, px, py, r * 0.62, a + Math.PI / 2, dark);
    petal(
      c,
      px + Math.cos(a) * r * 0.06,
      py + Math.sin(a) * r * 0.06,
      r * 0.52,
      a + Math.PI / 2,
      col
    );
  }
  if (centre) {
    const g = c.createRadialGradient(x, y, 0, x, y, r * 0.42);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    circle(c, x, y, r * 0.42);
    c.fill();
    c.fillStyle = 'rgba(214,120,90,0.75)';
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3 + rot;
      circle(c, x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2, r * 0.06);
      c.fill();
    }
  }
}

/** Soft blossom cluster (distance look): shaded puffs in three pinks, lit from top-left. */
function blossomPuff(c: Ctx, x: number, y: number, r: number, seed: number) {
  const rr = rng(seed);
  // a loose cloud of small shaded florets (each a radial gradient lit from top-left)
  const n = 16 + Math.floor(rr() * 8);
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = rr() * Math.PI * 2;
    const d = Math.sqrt(rr()) * r;
    pts.push([x + Math.cos(a) * d * 1.3, y + Math.sin(a) * d * 0.85, r * (0.15 + rr() * 0.17)]);
  }
  // soft shadow mass under the cloud
  c.fillStyle = 'rgba(200,120,150,0.3)';
  for (const [px, py, pr] of pts) {
    circle(c, px + pr * 0.3, py + pr * 0.5, pr * 1.15);
    c.fill();
  }
  // florets: subtle top-left light, deeper rose underneath
  for (const [px, py, pr] of pts) {
    const gr = c.createRadialGradient(px - pr * 0.3, py - pr * 0.35, pr * 0.1, px, py, pr * 1.1);
    gr.addColorStop(0, '#fde4ec');
    gr.addColorStop(0.55, PINK);
    gr.addColorStop(1, '#e6a0b8');
    c.fillStyle = gr;
    circle(c, px, py, pr);
    c.fill();
  }
  // crisp five-petal flowers scattered over the lit side, a few white hearts
  for (let i = 0; i < 6; i++) {
    const [px, py, pr] = pts[Math.floor(rr() * pts.length)];
    blossom(
      c,
      px - pr * 0.1,
      py - pr * 0.2,
      pr * 1.15,
      i % 3 === 0 ? PINK_X : i % 3 === 1 ? PINK_L : PINK,
      true,
      rr() * 1.2
    );
  }
  c.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 5; i++) {
    const [px, py, pr] = pts[Math.floor(rr() * pts.length)];
    circle(c, px - pr * 0.2, py - pr * 0.25, pr * 0.18);
    c.fill();
  }
}

/** Tapered branch with bark shading: dark core, lit top edge. */
function branch(
  c: Ctx,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  w: number,
  bark: string,
  lit: string
) {
  c.lineCap = 'round';
  c.strokeStyle = bark;
  // tapered: the curve is walked as a polyline with the width shrinking toward the tip
  const N = 10;
  const q = (t: number): [number, number] => [
    (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1,
    (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1,
  ];
  for (let i = 0; i < N; i++) {
    const [ax, ay] = q(i / N);
    const [bx, by] = q((i + 1) / N);
    c.lineWidth = w * (0.85 - (i / N) * 0.5);
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(bx, by);
    c.stroke();
  }
  c.strokeStyle = lit;
  c.lineWidth = Math.max(0.8, w * 0.22);
  c.beginPath();
  c.moveTo(x0, y0 - w * 0.3);
  c.quadraticCurveTo(cx, cy - w * 0.3, x1, y1 - w * 0.2);
  c.stroke();
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
function drawWall(c: Ctx, W: number, g: Geo, id: string, tod: Tod, lampsOn: boolean) {
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
      // delicate kumiko lattice: tall cells with a thin inner sub-grid, each bar casting
      // a faint soft shadow onto the paper
      const cell = Math.max(64, W / 14);
      const bars: [number, number, number, number][] = [];
      for (let x = (W / 2) % cell; x <= W + 1; x += cell) bars.push([x - 1.5, 0, 3, f]);
      for (let y = f * 0.1; y < f; y += cell * 1.3) bars.push([0, y - 1.5, W, 3]);
      for (const [bx, by, bw, bh] of bars) {
        c.fillStyle = 'rgba(90,60,35,0.12)';
        c.fillRect(bx + 2, by + 3, bw, bh);
        c.fillStyle = 'rgba(90,60,35,0.06)';
        c.fillRect(bx + 4, by + 6, bw, bh);
      }
      for (const [bx, by, bw, bh] of bars) {
        c.fillStyle = bh > bw ? hGrad(c, bx, bx + bw, '#b08556', '#8a6340') : '#a07a4e';
        c.fillRect(bx, by, bw, bh);
        hiLine(c, bx, by, bh > bw ? 1 : bw, 0.25, bh > bw ? bh : 1);
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
  // plaster feel: faint large-scale mottling + fine tooth
  const mr = rng(301);
  for (let i = 0; i < 14; i++) {
    const mx = mr() * W;
    const my = mr() * f;
    const rr = f * (0.18 + mr() * 0.3);
    const gr = c.createRadialGradient(mx, my, 0, mx, my, rr);
    const light = mr() < 0.5;
    gr.addColorStop(0, light ? 'rgba(255,250,240,0.07)' : 'rgba(120,80,50,0.045)');
    gr.addColorStop(1, light ? 'rgba(255,250,240,0)' : 'rgba(120,80,50,0)');
    c.fillStyle = gr;
    c.fillRect(mx - rr, my - rr, rr * 2, rr * 2);
  }
  speckle(c, 0, 0, W, f, 302, Math.round(W * 1.2), 'rgba(90,60,35,0.035)');
  // ambient darkening toward the floor + light from above + side vignette
  c.fillStyle = vGrad(c, f * 0.5, f, 'rgba(45,28,18,0)', 'rgba(45,28,18,0.16)');
  c.fillRect(0, f * 0.5, W, f * 0.5);
  c.fillStyle = vGrad(c, 0, f * 0.4, 'rgba(255,245,225,0.2)', 'rgba(255,245,225,0)');
  c.fillRect(0, 0, W, f * 0.4);
  c.fillStyle = hGrad(c, 0, W * 0.18, 'rgba(45,28,18,0.14)', 'rgba(45,28,18,0)');
  c.fillRect(0, 0, W * 0.18, f);
  c.fillStyle = hGrad(c, W * 0.82, W, 'rgba(45,28,18,0)', 'rgba(45,28,18,0.14)');
  c.fillRect(W * 0.82, 0, W * 0.18, f);
  // atmospheric perspective: the back wall sits a little lighter / less saturated
  c.fillStyle = vGrad(c, 0, f, 'rgba(245,238,228,0.16)', 'rgba(245,238,228,0.06)');
  c.fillRect(0, 0, W, f);
  // warm halos around the lamps when lit, a soft cool-white bloom when not
  for (const l of g.lamps) {
    if (lampsOn) {
      glow(c, l.x, l.y + 36, Math.min(W, f) * 0.34, '255,214,150', 0.34);
    } else if (tod === 'sabah' || tod === 'ogle') {
      glow(c, l.x, l.y + 30, f * 0.16, '255,255,250', 0.12);
    }
  }

  // lower wainscot: vertical hinoki slats (koshi-ita) below the window sill
  const wy = f * 0.79;
  c.fillStyle = vGrad(c, wy, f, '#dcb283', '#bf8d5a');
  c.fillRect(0, wy, W, f - wy);
  const sw = Math.max(10, W / 90);
  const wr = rng(303);
  for (let x = 0; x < W; x += sw) {
    c.fillStyle = `rgba(120,75,35,${0.02 + wr() * 0.07})`;
    c.fillRect(x, wy, sw, f - wy);
    c.fillStyle = 'rgba(45,28,18,0.2)';
    c.fillRect(x, wy, 1.4, f - wy);
    c.fillStyle = 'rgba(255,245,230,0.16)';
    c.fillRect(x + 1.4, wy, 1.2, f - wy);
  }
  sheen(c, 0, wy, W, f - wy, 0.07);
  // rail on top of the wainscot
  c.fillStyle = vGrad(c, wy - 7, wy + 2, '#8a6446', WALNUT);
  c.fillRect(0, wy - 7, W, 9);
  hiLine(c, 0, wy - 7, W, 0.28);
  dropAO(c, 0, wy + 2, W, 12, 0.26);
  // baseboard with its contact shadow onto the wainscot
  dropAO(c, 0, f - 14, W, 9, 0.12);
  c.fillStyle = vGrad(c, f - 6, f, WALNUT_L, '#4a3222');
  c.fillRect(0, f - 6, W, 6);

  // ceiling beam (hari) with a soft shadow below it
  const b = g.beam;
  c.fillStyle = vGrad(c, 0, b, '#5a3f2d', '#6e4f38');
  c.fillRect(0, 0, W, b);
  grainLines(c, 0, 2, W, b - 4, 77, 30, 'rgba(255,230,200,0.12)');
  c.fillStyle = vGrad(c, b - 4, b, 'rgba(255,230,200,0)', 'rgba(255,230,200,0.14)');
  c.fillRect(0, b - 4, W, 4);
  dropAO(c, 0, b, W, 22, 0.32);
  // corner posts (hashira)
  const pw2 = Math.max(10, W * 0.012);
  for (const px of [0, W - pw2]) {
    c.fillStyle = hGrad(
      c,
      px,
      px + pw2,
      px === 0 ? '#4e3626' : WALNUT_L,
      px === 0 ? WALNUT_L : '#4e3626'
    );
    c.fillRect(px, 0, pw2, f);
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.fillRect(px + (px === 0 ? pw2 - 2 : 0), 0, 2, f);
    // post shadow onto the wall
    if (px === 0) c.fillStyle = hGrad(c, pw2, pw2 + 10, AO(0.18), AO0);
    else c.fillStyle = hGrad(c, px - 10, px, AO0, AO(0.18));
    c.fillRect(px === 0 ? pw2 : px - 10, 0, 10, f);
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
      // light oak planks with perspective: back rows thinner, seams converge and fade
      c.fillStyle = vGrad(c, floorY, bottom, '#e4c7a3', '#d2a677');
      c.fillRect(0, floorY, W, h);
      const r = rng(91);
      let y = floorY;
      let i = 0;
      while (y < bottom) {
        const d = (y - floorY) / h; // 0 = far, 1 = near
        const ph = 9 + d * 30;
        c.fillStyle = `rgba(120,80,40,${0.02 + r() * 0.07})`;
        c.fillRect(0, y, W, ph);
        const seamA = 0.08 + d * 0.16;
        c.strokeStyle = `rgba(110,70,35,${seamA})`;
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
        c.strokeStyle = `rgba(255,240,220,${0.08 + d * 0.14})`;
        c.beginPath();
        c.moveTo(0, y + 1.2);
        c.lineTo(W, y + 1.2);
        c.stroke();
        const pl = Math.max(170, W / 5.5);
        c.strokeStyle = `rgba(110,70,35,${seamA})`;
        for (let x = (i % 2) * pl * 0.5 - r() * 50; x < W + pl; x += pl) {
          c.beginPath();
          c.moveTo(px(x, y), y);
          c.lineTo(px(x, y + ph), y + ph);
          c.stroke();
        }
        grainLines(c, 0, y + 1, W, ph - 2, 100 + i, 16, `rgba(120,80,40,${0.04 + d * 0.07})`);
        y += ph;
        i++;
      }
    }
  }
  // contact shadow under the wall, atmospheric lightening at the back,
  // and a soft lacquer sheen toward the counter
  c.fillStyle = vGrad(c, floorY, floorY + 36, 'rgba(45,28,18,0.26)', 'rgba(45,28,18,0)');
  c.fillRect(0, floorY, W, 36);
  c.fillStyle = vGrad(c, floorY, floorY + h * 0.6, 'rgba(240,232,222,0.16)', 'rgba(240,232,222,0)');
  c.fillRect(0, floorY, W, h * 0.6);
  c.fillStyle = vGrad(c, bottom - h * 0.45, bottom, 'rgba(255,245,230,0)', 'rgba(255,245,230,0.1)');
  c.fillRect(0, bottom - h * 0.45, W, h * 0.45);
  sheen(c, W * 0.1, floorY, W * 0.8, h, 0.05);
}

// ---------- window + sakura tree ----------
function sakuraTree(c: Ctx, x: number, y: number, w: number, h: number, night: boolean) {
  // trunk/branches enter from the top-right corner and reach across the glass
  const bark = night ? '#3b2d2a' : '#55392c';
  const barkLit = night ? 'rgba(120,100,110,0.35)' : 'rgba(170,130,105,0.55)';
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
  // a soft pink haze behind the canopy so the clusters sit in depth
  const r = rng(505);
  const puffR = w * 0.036;
  for (const [x0, y0, cxx, cyy, x1, y1] of branches) {
    for (let k = 0; k < 3; k++) {
      const tt = 0.15 + r() * 0.8;
      const bx = (1 - tt) * (1 - tt) * x0 + 2 * (1 - tt) * tt * cxx + tt * tt * x1;
      const by = (1 - tt) * (1 - tt) * y0 + 2 * (1 - tt) * tt * cyy + tt * tt * y1;
      glow(c, x + bx * w, y + by * h, puffR * 3.2, night ? '150,110,140' : '240,170,195', 0.35);
    }
  }
  for (const [x0, y0, cxx, cyy, x1, y1, lw] of branches) {
    branch(
      c,
      x + x0 * w,
      y + y0 * h,
      x + cxx * w,
      y + cyy * h,
      x + x1 * w,
      y + y1 * h,
      lw * (w / 470),
      bark,
      barkLit
    );
  }
  // twigs
  c.strokeStyle = bark;
  c.lineWidth = Math.max(1, w / 400);
  for (let i = 0; i < 14; i++) {
    const b = branches[Math.floor(r() * branches.length)];
    const tt = 0.2 + r() * 0.7;
    const bx = x + ((1 - tt) * (1 - tt) * b[0] + 2 * (1 - tt) * tt * b[2] + tt * tt * b[4]) * w;
    const by = y + ((1 - tt) * (1 - tt) * b[1] + 2 * (1 - tt) * tt * b[3] + tt * tt * b[5]) * h;
    const a = r() * Math.PI * 2;
    const len = puffR * (1.2 + r() * 1.5);
    c.beginPath();
    c.moveTo(bx, by);
    c.quadraticCurveTo(
      bx + Math.cos(a) * len * 0.5,
      by + Math.sin(a) * len * 0.5 - len * 0.3,
      bx + Math.cos(a) * len,
      by + Math.sin(a) * len - len * 0.2
    );
    c.stroke();
  }
  // blossom clusters along the branches
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
  // crisp flowers + buds in front for detail
  for (let i = 0; i < 22; i++) {
    const b = branches[Math.floor(r() * branches.length)];
    const tt = 0.2 + r() * 0.8;
    const bx = (1 - tt) * (1 - tt) * b[0] + 2 * (1 - tt) * tt * b[2] + tt * tt * b[4];
    const by = (1 - tt) * (1 - tt) * b[1] + 2 * (1 - tt) * tt * b[3] + tt * tt * b[5];
    const fx = x + bx * w + (r() - 0.5) * puffR * 2.2;
    const fy = y + by * h + (r() - 0.5) * puffR * 2.2;
    const k = r();
    if (k < 0.2) {
      // bud: a small deep-pink drop
      c.fillStyle = '#e48aa6';
      ellipse(c, fx, fy, puffR * 0.14, puffR * 0.2);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)';
      ellipse(c, fx - puffR * 0.04, fy - puffR * 0.06, puffR * 0.05, puffR * 0.07);
      c.fill();
    } else {
      blossom(c, fx, fy, puffR * (0.42 + r() * 0.2), k < 0.6 ? PINK_L : PINK, true, r() * 1.2);
    }
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
  // wall shadow around the frame: soft, offset down-right, two layers
  c.fillStyle = 'rgba(45,28,18,0.07)';
  roundRect(c, x - fr - 14, y - fr - 4, w + fr * 2 + 28, h + fr * 2 + 26, 10);
  c.fill();
  c.fillStyle = 'rgba(45,28,18,0.12)';
  roundRect(c, x - fr - 6, y - fr + 2, w + fr * 2 + 12, h + fr * 2 + 12, 6);
  c.fill();
  // daylight spill onto the wall around the window (the wall is lit by it)
  if (!night) glow(c, x + w / 2, y + h / 2, w * 0.75, '255,250,240', 0.16);
  // frame with wood grain + lit top edge
  c.fillStyle = vGrad(c, y - fr, y + h + fr, '#7f5b40', '#52382a');
  roundRect(c, x - fr, y - fr, w + fr * 2, h + fr * 2, 4);
  c.fill();
  stroke(c);
  grainLines(c, x - fr, y - fr + 2, w + fr * 2, fr - 4, 401, 10, 'rgba(255,230,200,0.12)');
  grainLines(c, x - fr, y + h + 2, w + fr * 2, fr - 4, 402, 10, 'rgba(255,230,200,0.1)');
  hiLine(c, x - fr, y - fr, w + fr * 2, 0.22);
  c.fillStyle = 'rgba(255,255,255,0.08)';
  c.fillRect(x - fr, y - fr, 2, h + fr * 2);
  // glass
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = vGrad(c, y, y + h, sky[0], sky[1]);
  c.fillRect(x, y, w, h);
  if (tod === 'sabah') {
    // cool-pink dawn: soft horizon warmth
    c.fillStyle = vGrad(c, y + h * 0.35, y + h, 'rgba(255,214,210,0)', 'rgba(255,214,210,0.55)');
    c.fillRect(x, y, w, h);
  }
  if (night) {
    const r = rng(7);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 30; i++) {
      circle(c, x + r() * w, y + r() * h * 0.55, 0.5 + r() * 1);
      c.fill();
    }
    glow(c, x + w * 0.22, y + h * 0.2, h * 0.45, '220,225,255', 0.3);
    c.fillStyle = '#fff5d6';
    circle(c, x + w * 0.22, y + h * 0.2, h * 0.07);
    c.fill();
    gloss(c, x + w * 0.22, y + h * 0.2, h * 0.2, 0.35);
    // city glow on the horizon
    c.fillStyle = vGrad(
      c,
      y + h * 0.55,
      y + h * 0.85,
      'rgba(255,190,130,0)',
      'rgba(255,190,130,0.22)'
    );
    c.fillRect(x, y + h * 0.55, w, h * 0.3);
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
  const hillBase = night ? '#2a2e4f' : dusk ? '#8d7a9a' : '#a9c3b7';
  const hillCol = night ? hillBase : mix(hillBase, sky[1], dusk ? 0.25 : 0.35);
  // far ridge (hazier) then the near hills
  c.fillStyle = mix(hillBase, sky[1], night ? 0.25 : 0.6);
  c.beginPath();
  c.moveTo(x, y + h * 0.7);
  c.quadraticCurveTo(x + w * 0.25, y + h * 0.48, x + w * 0.5, y + h * 0.62);
  c.quadraticCurveTo(x + w * 0.75, y + h * 0.42, x + w, y + h * 0.6);
  c.lineTo(x + w, y + h);
  c.lineTo(x, y + h);
  c.closePath();
  c.fill();
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
  // haze between hills and town
  c.fillStyle = vGrad(
    c,
    y + h * 0.6,
    y + h * 0.84,
    rgba('#ffffff', 0),
    rgba('#ffffff', night ? 0.04 : 0.22)
  );
  c.fillRect(x, y + h * 0.6, w, h * 0.24);
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
  // rain: misty glass, wet streaks that catch the light, static droplets (moving streaks are per frame)
  if (rain) {
    c.fillStyle = 'rgba(180,195,212,0.3)';
    c.fillRect(x, y, w, h);
    const r3 = rng(17);
    // long wet trails with a bright edge
    for (let i = 0; i < 18; i++) {
      const tx = x + r3() * w;
      const ty = y + r3() * h * 0.6;
      const len = h * (0.15 + r3() * 0.35);
      c.strokeStyle = 'rgba(255,255,255,0.18)';
      c.lineWidth = 1.5 + r3() * 1.5;
      c.beginPath();
      c.moveTo(tx, ty);
      c.quadraticCurveTo(tx + (r3() - 0.5) * 6, ty + len * 0.5, tx + (r3() - 0.5) * 4, ty + len);
      c.stroke();
    }
    for (let i = 0; i < 90; i++) {
      const dx = x + r3() * w;
      const dy = y + r3() * h;
      const s = 1.5 + r3() * 3;
      // refraction-ish: dark rim, bright core, small highlight
      c.fillStyle = 'rgba(70,80,105,0.22)';
      ellipse(c, dx, dy + s * 0.3, s * 0.65, s * 0.9);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.45)';
      ellipse(c, dx, dy, s * 0.55, s * 0.8);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      ellipse(c, dx - s * 0.2, dy - s * 0.35, s * 0.18, s * 0.25);
      c.fill();
    }
  }
  // glass: faint sky tint on the whole pane + two diagonal reflections
  c.fillStyle = night ? 'rgba(120,140,200,0.06)' : 'rgba(205,228,240,0.1)';
  c.fillRect(x, y, w, h);
  const refl = (x0: number, x1: number, a: number) => {
    const gr = c.createLinearGradient(x + w * x0, y + h, x + w * x1, y);
    gr.addColorStop(0, 'rgba(255,255,255,0)');
    gr.addColorStop(0.5, `rgba(255,255,255,${a})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gr;
    c.beginPath();
    c.moveTo(x + w * x0, y + h);
    c.lineTo(x + w * (x0 + 0.23), y);
    c.lineTo(x + w * (x0 + 0.33), y);
    c.lineTo(x + w * (x0 + 0.1), y + h);
    c.closePath();
    c.fill();
  };
  refl(0.02, 0.35, rain ? 0.2 : 0.13);
  refl(0.52, 0.85, rain ? 0.12 : 0.07);
  // the pane darkens slightly toward the frame (reveal occlusion)
  innerAO(c, x, y, w, h, Math.max(14, w * 0.05), night ? 0.3 : 0.2);
  c.restore();
  // kumiko lattice: two thin verticals, one horizontal, each casting a soft shadow on the glass
  const lw = Math.max(4, w * 0.012);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = 'rgba(45,28,18,0.13)';
  c.lineWidth = lw * 2.4;
  c.lineCap = 'butt';
  c.beginPath();
  for (const fx of [1 / 3, 2 / 3]) {
    c.moveTo(x + w * fx + lw * 0.6, y);
    c.lineTo(x + w * fx + lw * 0.6, y + h);
  }
  c.moveTo(x, y + h * 0.3 + lw * 0.8);
  c.lineTo(x + w, y + h * 0.3 + lw * 0.8);
  c.stroke();
  c.restore();
  c.strokeStyle = '#4e3626';
  c.lineWidth = lw;
  c.beginPath();
  for (const fx of [1 / 3, 2 / 3]) {
    c.moveTo(x + w * fx, y);
    c.lineTo(x + w * fx, y + h);
  }
  c.moveTo(x, y + h * 0.3);
  c.lineTo(x + w, y + h * 0.3);
  c.stroke();
  c.strokeStyle = 'rgba(255,235,210,0.3)';
  c.lineWidth = 1;
  c.beginPath();
  for (const fx of [1 / 3, 2 / 3]) {
    c.moveTo(x + w * fx - lw * 0.5 + 0.5, y);
    c.lineTo(x + w * fx - lw * 0.5 + 0.5, y + h);
  }
  c.moveTo(x, y + h * 0.3 - lw * 0.5 + 0.5);
  c.lineTo(x + w, y + h * 0.3 - lw * 0.5 + 0.5);
  c.stroke();
  // sill: a thick lit plank with grain, a shadow beneath, and a few fallen petals
  const sy0 = y + h + fr - 2;
  c.fillStyle = vGrad(c, sy0, sy0 + 13, '#8a6446', '#5b3f2c');
  roundRect(c, x - fr - 10, sy0, w + fr * 2 + 20, 13, 3);
  c.fill();
  stroke(c);
  grainLines(c, x - fr - 6, sy0 + 2, w + fr * 2 + 12, 8, 403, 14, 'rgba(255,230,200,0.14)');
  hiLine(c, x - fr - 8, sy0 + 0.5, w + fr * 2 + 16, 0.28, 2);
  dropAO(c, x - fr - 10, sy0 + 13, w + fr * 2 + 20, 16, 0.26);
  const spr = rng(404);
  for (let i = 0; i < 5; i++) {
    const ppx = x + w * (0.25 + spr() * 0.7);
    c.fillStyle = 'rgba(45,28,18,0.15)';
    ellipse(c, ppx + 1, sy0 + 1.5, 3.2, 1.2);
    c.fill();
    petal(c, ppx, sy0 + 0.5, 2.6 + spr() * 1.2, spr() * 6.28, i % 2 ? PINK_L : PINK);
  }
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
    const bg = c.createLinearGradient(0, ry, 0, ry + 18);
    bg.addColorStop(0, '#c9a46f');
    bg.addColorStop(0.3, '#e4c48f');
    bg.addColorStop(0.7, '#b58b55');
    bg.addColorStop(1, '#8a6436');
    c.fillStyle = bg;
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
  c.fillStyle = 'rgba(45,28,18,0.07)';
  roundRect(c, x - fr - 12, y - fr - 4, w + fr * 2 + 24, h + fr + 14, 8);
  c.fill();
  c.fillStyle = 'rgba(45,28,18,0.12)';
  roundRect(c, x - fr - 5, y - fr + 2, w + fr * 2 + 10, h + fr + 8, 5);
  c.fill();
  // frame
  c.fillStyle = vGrad(c, y - fr, y + h, '#7f5b40', '#52382a');
  roundRect(c, x - fr, y - fr, w + fr * 2, h + fr, 3);
  c.fill();
  stroke(c);
  grainLines(c, x - fr + 2, y - fr, fr - 4, h + fr, 405, 8, 'rgba(255,230,200,0.12)', true);
  grainLines(c, x + w + 2, y - fr, fr - 4, h + fr, 406, 8, 'rgba(255,230,200,0.12)', true);
  hiLine(c, x - fr, y - fr, w + fr * 2, 0.2);
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
    glow(c, x + w * 0.68, y + h * 0.47, w * 0.3, '255,210,140', 0.4);
  }
  innerAO(c, x, y, w, h, Math.max(8, w * 0.12), 0.25);
  // noren: indigo split curtain covering the top ~58%, cloth with soft vertical folds
  const nh = h * 0.58;
  const panels = 3;
  const pw = w / panels;
  // the curtain's shadow on the scene behind
  c.fillStyle = 'rgba(20,20,40,0.25)';
  c.fillRect(x, y + nh - 2, w, 8);
  for (let i = 0; i < panels; i++) {
    const px0 = x + i * pw;
    const fold = c.createLinearGradient(px0, 0, px0 + pw, 0);
    fold.addColorStop(0, '#1e2546');
    fold.addColorStop(0.18, INDIGO);
    fold.addColorStop(0.36, '#3a4675');
    fold.addColorStop(0.5, INDIGO_D);
    fold.addColorStop(0.68, '#3c4878');
    fold.addColorStop(0.85, INDIGO);
    fold.addColorStop(1, '#1e2546');
    c.fillStyle = fold;
    c.beginPath();
    c.moveTo(px0 + 1, y - 2);
    c.lineTo(px0 + pw - 1, y - 2);
    c.lineTo(px0 + pw - 1, y + nh - 4);
    c.quadraticCurveTo(px0 + pw * 0.75, y + nh + 3, px0 + pw / 2, y + nh - 1);
    c.quadraticCurveTo(px0 + pw * 0.25, y + nh + 4, px0 + 1, y + nh - 4);
    c.closePath();
    c.fill();
    // cloth weave + a hem line
    speckle(c, px0 + 1, y, pw - 2, nh, 500 + i, 90, 'rgba(255,255,255,0.05)');
    c.fillStyle = 'rgba(255,255,255,0.1)';
    c.fillRect(px0 + 1, y + nh - 9, pw - 2, 1);
    seigaiha(c, px0 + 1, y + nh * 0.58, pw - 2, nh * 0.42, pw * 0.22, 'rgba(255,255,255,0.55)');
    // the fold shading also dims the pattern
    c.fillStyle = fold;
    c.globalAlpha = 0.35;
    c.fillRect(px0 + 1, y + nh * 0.58, pw - 2, nh * 0.42);
    c.globalAlpha = 1;
  }
  // light from above catches the top of the cloth
  c.fillStyle = vGrad(c, y, y + nh * 0.25, 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0)');
  c.fillRect(x, y, w, nh * 0.25);
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
  c.fillText(SALON_LABELS.open, sx, sy + 11.5);
}

// ---------- menu board (brush calligraphy) ----------
function drawMenuBoard(c: Ctx, g: Geo) {
  const { x, y, w, h } = g.board;
  c.fillStyle = 'rgba(45,28,18,0.07)';
  roundRect(c, x - 6, y + 6, w + 14, h + 16, 8);
  c.fill();
  c.fillStyle = 'rgba(45,28,18,0.14)';
  roundRect(c, x - 1, y + 4, w + 4, h + 6, 5);
  c.fill();
  c.fillStyle = vGrad(c, y, y + h, '#7f5b40', '#52382a');
  roundRect(c, x, y, w, h, 5);
  c.fill();
  stroke(c);
  grainLines(c, x + 4, y + 2, w - 8, h - 4, 123, 14, 'rgba(255,230,200,0.1)');
  hiLine(c, x + 3, y + 1, w - 6, 0.22);
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
  c.fillStyle = 'rgba(45,28,18,0.07)';
  roundRect(c, x - 5, y + 6, w + 12, h + 14, 6);
  c.fill();
  c.fillStyle = 'rgba(45,28,18,0.12)';
  roundRect(c, x - 1, y + 4, w + 4, h + 6, 3);
  c.fill();
  // silk mount (indigo bands with a satin sheen) + paper
  c.fillStyle = vGrad(c, y, y + h, '#44507f', INDIGO_D);
  c.fillRect(x, y, w, h);
  sheen(c, x, y, w, h, 0.14);
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
  // shadow of the board on the wall (soft, two layers) + the AO band under it
  c.fillStyle = 'rgba(45,28,18,0.08)';
  roundRect(c, x - 2, y + 8, w + 6, 22, 4);
  c.fill();
  c.fillStyle = 'rgba(45,28,18,0.14)';
  roundRect(c, x + 1, y + 6, w + 2, 11, 3);
  c.fill();
  dropAO(c, x - 4, y + 9, w + 8, 26, 0.2);
  const k = Math.min(1.25, Math.max(0.8, w / 280));
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  const ww = w / k;
  const items = ['tokkuri', 'bottle', 'bowls', 'cups', 'ikebana', 'teapot'];
  const step = ww / items.length;
  items.forEach((it, i) => {
    const ix = step * (i + 0.5);
    softShadow(c, ix, 0, 16, 3.5, 0.26);
    switch (it) {
      case 'tokkuri': {
        // sake flask + two ochoko cups: glazed stoneware (side-lit, soft rim light)
        c.fillStyle = hGrad(c, ix - 14, ix + 14, '#fbf6ec', '#cfc2ad');
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
        c.fillStyle = 'rgba(255,255,255,0.55)';
        roundRect(c, ix - 9, -28, 2.5, 20, 1.5);
        c.fill();
        gloss(c, ix - 5, -24, 6, 0.45);
        for (const dx of [-20, 20]) {
          c.fillStyle = hGrad(c, ix + dx - 5, ix + dx + 5, '#fbf6ec', '#d4c7b2');
          roundRect(c, ix + dx - 5, -9, 10, 9, 2);
          c.fill();
          stroke(c);
          hiLine(c, ix + dx - 4, -8.5, 8, 0.5, 1);
        }
        break;
      }
      case 'bottle': {
        // green glass: dark body, bright edge reflections, translucent shoulder
        c.fillStyle = hGrad(c, ix - 8, ix + 8, '#5d7f58', '#243d24');
        roundRect(c, ix - 8, -46, 16, 46, 4);
        c.fill();
        c.fillStyle = hGrad(c, ix - 4, ix + 4, '#4d6b4a', '#1f341f');
        roundRect(c, ix - 4, -56, 8, 12, 2);
        c.fill();
        stroke(c);
        c.fillStyle = '#c9432f';
        roundRect(c, ix - 4.5, -57, 9, 4, 1.5);
        c.fill();
        c.fillStyle = PAL.paper;
        roundRect(c, ix - 6, -32, 12, 18, 1.5);
        c.fill();
        brushChar(c, ix - 4, -30, 8, 61);
        c.fillStyle = 'rgba(255,255,255,0.45)';
        roundRect(c, ix - 6.5, -44, 2.2, 40, 1.2);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.18)';
        roundRect(c, ix + 4, -42, 1.5, 36, 1);
        c.fill();
        break;
      }
      case 'bowls': {
        for (let j = 0; j < 3; j++) {
          const by = -j * 7;
          const base = [PAL.tomato, '#3a3f4a', PAL.sage][j];
          c.fillStyle = hGrad(c, ix - 14, ix + 14, shade(base, 0.18), shade(base, -0.25));
          c.beginPath();
          c.moveTo(ix - 14, by - 7);
          c.quadraticCurveTo(ix - 12, by, ix, by);
          c.quadraticCurveTo(ix + 12, by, ix + 14, by - 7);
          c.closePath();
          c.fill();
          stroke(c);
          c.fillStyle = vGrad(c, by - 9, by - 5, '#fdf8ee', '#e3d8c6');
          ellipse(c, ix, by - 7, 14, 2.5);
          c.fill();
          hiLine(c, ix - 10, by - 5.5, 7, 0.5, 1);
        }
        break;
      }
      case 'cups': {
        for (const [dx, col] of [
          [-10, INDIGO],
          [6, '#b9c9a7'],
        ] as [number, string][]) {
          c.fillStyle = hGrad(c, ix + dx - 6, ix + dx + 6, shade(col, 0.15), shade(col, -0.3));
          roundRect(c, ix + dx - 6, -15, 12, 15, 3);
          c.fill();
          stroke(c);
          c.fillStyle = 'rgba(255,255,255,0.4)';
          roundRect(c, ix + dx - 4, -13, 2.2, 10, 1.2);
          c.fill();
          c.fillStyle = shade(col, 0.25);
          ellipse(c, ix + dx, -14.5, 5.5, 1.6);
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
        const tg = c.createRadialGradient(ix - 6, -16, 2, ix, -11, 18);
        tg.addColorStop(0, '#a38374');
        tg.addColorStop(0.6, '#6e5040');
        tg.addColorStop(1, '#4a3328');
        c.fillStyle = tg;
        ellipse(c, ix, -11, 15, 11);
        c.fill();
        stroke(c);
        c.fillStyle = 'rgba(255,240,220,0.18)';
        ellipse(c, ix + 7, -6, 4, 6);
        c.fill();
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
      // round white paper lantern with ribs; lit from inside when on
      const r = 27;
      const cy = y + r;
      if (on) glow(c, x, cy, r * 2.6, '255,225,170', 0.5);
      const lg = c.createRadialGradient(x - r * 0.1, cy - r * 0.05, r * 0.1, x, cy, r);
      if (on) {
        lg.addColorStop(0, '#fffaf0');
        lg.addColorStop(0.55, '#ffeec8');
        lg.addColorStop(1, '#f4c98a');
      } else {
        lg.addColorStop(0, '#fffdf8');
        lg.addColorStop(0.6, '#f3ece0');
        lg.addColorStop(1, '#d9d0c2');
      }
      c.fillStyle = lg;
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
      if (on) glow(c, x, cy, 70, '255,150,110', 0.45);
      const cg = c.createRadialGradient(x - 4, cy - 4, 4, x, cy, 32);
      if (on) {
        cg.addColorStop(0, '#ffb08f');
        cg.addColorStop(0.5, '#ff7a5c');
        cg.addColorStop(1, '#c94530');
      } else {
        cg.addColorStop(0, '#ee7a62');
        cg.addColorStop(0.6, '#d8533d');
        cg.addColorStop(1, '#a8392a');
      }
      c.fillStyle = cg;
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
      if (on) glow(c, x, y + 44, 60, '255,225,160', 0.45);
      c.fillStyle = hGrad(c, x - 28, x + 28, '#8d6a2a', '#f0d496');
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
      if (on) glow(c, x, y + 32, 52, '255,220,150', 0.5);
      c.fillStyle = hGrad(c, x - 7, x + 7, '#8f6a2c', '#e6c67e');
      roundRect(c, x - 7, y - 2, 14, 16, 3);
      c.fill();
      stroke(c, 'rgba(60,35,20,0.2)');
      c.strokeStyle = 'rgba(80,55,20,0.3)';
      c.lineWidth = 1;
      for (let yy = y + 2; yy < y + 13; yy += 3) {
        c.beginPath();
        c.moveTo(x - 6, yy);
        c.lineTo(x + 6, yy);
        c.stroke();
      }
      const bg = c.createRadialGradient(x - 5, y + 26, 2, x, y + 32, 20);
      if (on) {
        bg.addColorStop(0, '#fffbea');
        bg.addColorStop(0.6, '#ffe9b4');
        bg.addColorStop(1, '#f2c470');
      } else {
        bg.addColorStop(0, '#fdfbf6');
        bg.addColorStop(0.7, '#ece6da');
        bg.addColorStop(1, '#d5ccc0');
      }
      c.fillStyle = bg;
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
    const vg = c.createLinearGradient(-30, 0, 30, 0);
    vg.addColorStop(0, '#3a4573');
    vg.addColorStop(0.3, '#7d8db8');
    vg.addColorStop(0.7, '#4c598c');
    vg.addColorStop(1, '#2d365e');
    c.fillStyle = vg;
    c.beginPath();
    c.moveTo(-12, -60);
    c.quadraticCurveTo(-32, -30, -22, 0);
    c.lineTo(22, 0);
    c.quadraticCurveTo(32, -30, 12, -60);
    c.closePath();
    c.fill();
    stroke(c);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    roundRect(c, -16, -50, 4, 36, 2);
    c.fill();
    gloss(c, -8, -30, 14, 0.25);
  } else {
    const pg = c.createLinearGradient(-30, 0, 30, 0);
    pg.addColorStop(0, '#b97f62');
    pg.addColorStop(0.3, '#e6bea2');
    pg.addColorStop(0.75, '#d19c7c');
    pg.addColorStop(1, '#a86f52');
    c.fillStyle = pg;
    c.beginPath();
    c.moveTo(-30, -48);
    c.lineTo(30, -48);
    c.lineTo(24, 0);
    c.lineTo(-24, 0);
    c.closePath();
    c.fill();
    stroke(c);
    c.fillStyle = vGrad(c, -52, -42, '#e9c4a9', '#c88f70');
    roundRect(c, -33, -52, 66, 10, 3);
    c.fill();
    stroke(c);
    dropAO(c, -30, -42, 60, 8, 0.2);
    c.fillStyle = 'rgba(255,255,255,0.22)';
    roundRect(c, -22, -40, 6, 34, 3);
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
    // legs (rounded, lit on the left)
    for (const lx of [w * 0.1, w * 0.84]) {
      c.fillStyle = hGrad(c, lx, lx + w * 0.06, shade(col.leg, 0.12), shade(col.leg, -0.25));
      roundRect(c, lx, topH, w * 0.06, h - topH, 3);
      c.fill();
      stroke(c);
    }
    // apron shadow (the underside of the top is in shade)
    c.fillStyle = vGrad(c, topH * 0.9, topH * 1.5, AO(0.24), AO0);
    roundRect(c, w * 0.04, topH * 0.9, w * 0.92, topH * 0.6, 4);
    c.fill();
    // slab edge + top
    c.fillStyle = vGrad(c, topH * 0.45, topH * 1.15, shade(col.edge, 0.05), shade(col.edge, -0.2));
    roundRect(c, 0, topH * 0.45, w, topH * 0.7, topH * 0.3);
    c.fill();
    stroke(c);
    c.fillStyle = vGrad(c, 0, topH, shade(col.top, 0.16), shade(col.top, -0.04));
    roundRect(c, 0, 0, w, topH * 0.75, topH * 0.35);
    c.fill();
    stroke(c);
    sheen(c, w * 0.1, 0, w * 0.8, topH * 0.75, style === 'stil-lake' ? 0.3 : 0.16);
    c.fillStyle = 'rgba(255,255,255,0.26)';
    roundRect(c, w * 0.04, 1.5, w * 0.92, 2.5, 2);
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
function paintBench(c: Ctx, x: number, bottom: number, size: number, style: string) {
  const col = tableColors(style);
  const w = size * 0.62;
  const h = size * 0.22;
  const cushion = size * 0.14;
  softShadow(c, x, bottom, w * 0.62, w * 0.13, 0.28);
  c.fillStyle = vGrad(c, bottom - h, bottom, shade(col.leg, 0.08), shade(col.leg, -0.22));
  roundRect(c, x - w / 2, bottom - h, w, h, 5);
  c.fill();
  stroke(c);
  grainLines(
    c,
    x - w / 2 + 3,
    bottom - h + 4,
    w - 6,
    h - 8,
    Math.round(x),
    6,
    'rgba(60,35,20,0.12)'
  );
  c.fillStyle = 'rgba(255,255,255,0.16)';
  roundRect(c, x - w / 2 + 4, bottom - h + 2, w - 8, 2.5, 2);
  c.fill();
  // cushion: soft puffed zabuton with a shaded underside
  dropAO(c, x - w / 2 + 4, bottom - h, w - 8, 8, 0.22);
  const cg = c.createLinearGradient(0, bottom - h - cushion, 0, bottom - h + 2);
  cg.addColorStop(0, '#5a6ba3');
  cg.addColorStop(0.5, '#3d4a80');
  cg.addColorStop(1, INDIGO_D);
  c.fillStyle = cg;
  roundRect(c, x - w / 2 + 4, bottom - h - cushion, w - 8, cushion + 4, cushion * 0.6);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(255,255,255,0.2)';
  roundRect(c, x - w / 2 + 10, bottom - h - cushion + 3, w - 20, cushion * 0.28, 3);
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
    drawWall(c, W, g, decor.duvar, tod, lampsOn);
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
    softShadow(c, tb.x, tb.ground + 2, tb.w * 0.8, tb.w * 0.2, 0.14);
    softShadow(c, tb.x, tb.ground, tb.w * 0.62, tb.w * 0.13, 0.26);
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
function paintRegister(c: Ctx, r: Rect) {
  const { x, y, w, h } = r;
  softShadow(c, x + w / 2, y + h, w * 0.62, h * 0.11, 0.3);
  // cream enamel body: lit from the top-left, darker on the right and underneath
  const body = c.createLinearGradient(x, y + h * 0.3, x + w, y + h);
  body.addColorStop(0, '#f8f1e6');
  body.addColorStop(0.5, '#efe4d3');
  body.addColorStop(1, '#d2c2ab');
  c.fillStyle = body;
  roundRect(c, x, y + h * 0.32, w, h * 0.68, 10);
  c.fill();
  stroke(c);
  hiLine(c, x + 10, y + h * 0.32 + 1, w - 20, 0.5, 2);
  c.fillStyle = hGrad(c, x, x + 8, 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)');
  roundRect(c, x, y + h * 0.32, 8, h * 0.68, 10);
  c.fill();
  dropAO(c, x + 2, y + h - 10, w - 4, 10, 0.1);
  // drawer line + a brass drawer pull
  c.fillStyle = 'rgba(45,28,18,0.1)';
  roundRect(c, x + 6, y + h * 0.82, w - 12, h * 0.1, 4);
  c.fill();
  c.fillStyle = hGrad(c, x + w * 0.4, x + w * 0.6, '#f0d496', '#b48434');
  roundRect(c, x + w * 0.4, y + h * 0.84, w * 0.2, h * 0.06, 3);
  c.fill();
  // keys with a lit top edge and a shadow below each
  const kx = x + w * 0.08;
  const ky = y + h * 0.4;
  const kw = (w * 0.56) / 4;
  const kh = (h * 0.34) / 3;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const kxx = kx + i * kw + 2;
      const kyy = ky + j * kh + 2;
      c.fillStyle = 'rgba(45,28,18,0.14)';
      roundRect(c, kxx, kyy + 2, kw - 4, kh - 4, 3);
      c.fill();
      c.fillStyle = vGrad(c, kyy, kyy + kh - 4, '#fffaf2', (i + j) % 2 ? '#efe5d6' : '#e9d6ba');
      roundRect(c, kxx, kyy, kw - 4, kh - 4, 3);
      c.fill();
      stroke(c, 'rgba(60,35,20,0.12)');
    }
  }
  for (const [ky2, col] of [
    [ky + 2, PAL.coral],
    [ky + kh * 1.5 + 2, PAL.matcha],
  ] as [number, string][]) {
    c.fillStyle = 'rgba(45,28,18,0.14)';
    roundRect(c, x + w * 0.68, ky2 + 2, w * 0.24, kh * 1.5 - 4, 4);
    c.fill();
    c.fillStyle = vGrad(c, ky2, ky2 + kh * 1.5, shade(col, 0.22), shade(col, -0.1));
    roundRect(c, x + w * 0.68, ky2, w * 0.24, kh * 1.5 - 4, 4);
    c.fill();
    stroke(c);
    hiLine(c, x + w * 0.7, ky2 + 1.5, w * 0.2, 0.35, 1.5);
  }
  // display head: dark slate with a glossy glass pane
  c.fillStyle = vGrad(c, y, y + h * 0.36, '#4a4e58', '#2a2d35');
  roundRect(c, x + w * 0.12, y, w * 0.76, h * 0.36, 7);
  c.fill();
  stroke(c);
  hiLine(c, x + w * 0.15, y + 1, w * 0.7, 0.28, 1.5);
  c.fillStyle = vGrad(c, y + h * 0.06, y + h * 0.28, '#2a4a3f', '#1c3029');
  roundRect(c, x + w * 0.18, y + h * 0.06, w * 0.64, h * 0.22, 4);
  c.fill();
  c.fillStyle = '#9ff0b0';
  c.font = `800 ${Math.round(h * 0.13)}px "Baloo 2", system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('NOODLES', x + w / 2, y + h * 0.17);
  c.fillStyle = 'rgba(159,240,176,0.25)';
  c.fillText('NOODLES', x + w / 2, y + h * 0.17);
  c.save();
  roundRect(c, x + w * 0.18, y + h * 0.06, w * 0.64, h * 0.22, 4);
  c.clip();
  c.fillStyle = 'rgba(255,255,255,0.12)';
  c.beginPath();
  c.moveTo(x + w * 0.18, y + h * 0.28);
  c.lineTo(x + w * 0.36, y + h * 0.06);
  c.lineTo(x + w * 0.48, y + h * 0.06);
  c.lineTo(x + w * 0.3, y + h * 0.28);
  c.closePath();
  c.fill();
  c.restore();
}

function paintTipJar(c: Ctx, j: Rect, coins: number) {
  const { x, y, w, h } = j;
  softShadow(c, x + w / 2, y + h, w * 0.58, w * 0.15, 0.26);
  // the glass bends light: a bright caustic patch on the counter in front of the jar
  const cau = c.createRadialGradient(x + w * 0.55, y + h + 2, 0, x + w * 0.55, y + h + 2, w * 0.4);
  cau.addColorStop(0, 'rgba(255,250,235,0.35)');
  cau.addColorStop(1, 'rgba(255,250,235,0)');
  c.fillStyle = cau;
  ellipse(c, x + w * 0.55, y + h + 2, w * 0.4, w * 0.12);
  c.fill();
  // inside shading of the glass body (back wall of the jar)
  const gy = y + h * 0.12;
  const gh = h * 0.88;
  c.fillStyle = hGrad(c, x, x + w, 'rgba(190,215,225,0.3)', 'rgba(120,150,165,0.32)');
  roundRect(c, x, gy, w, gh, w * 0.22);
  c.fill();
  const n = clamp(Math.floor(coins), 0, 14);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const cy = y + h - 6 - row * 7;
    const cx = x + w * (0.33 + col * 0.34) + (row % 2) * 4;
    c.fillStyle = 'rgba(100,65,15,0.3)';
    ellipse(c, cx, cy + 1.5, w * 0.19, 4);
    c.fill();
    c.fillStyle = hGrad(
      c,
      cx - w * 0.19,
      cx + w * 0.19,
      '#f6dc96',
      i % 3 === 0 ? '#d9a240' : '#e9b957'
    );
    ellipse(c, cx, cy, w * 0.19, 4);
    c.fill();
    stroke(c, 'rgba(120,80,20,0.35)', 1);
    c.fillStyle = 'rgba(255,255,255,0.55)';
    ellipse(c, cx - 2, cy - 1.2, w * 0.08, 1.3);
    c.fill();
  }
  // front glass: faint sky tint, dark rim on the right, long bright reflection on the left
  c.fillStyle = vGrad(c, gy, gy + gh, 'rgba(225,240,245,0.22)', 'rgba(200,225,235,0.3)');
  roundRect(c, x, gy, w, gh, w * 0.22);
  c.fill();
  c.save();
  roundRect(c, x, gy, w, gh, w * 0.22);
  c.clip();
  c.fillStyle = hGrad(c, x + w * 0.75, x + w, 'rgba(60,80,95,0)', 'rgba(60,80,95,0.22)');
  c.fillRect(x + w * 0.75, gy, w * 0.25, gh);
  c.fillStyle = hGrad(c, x, x + w * 0.12, 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)');
  c.fillRect(x, gy, w * 0.12, gh);
  const rf = c.createLinearGradient(0, gy, 0, gy + gh);
  rf.addColorStop(0, 'rgba(255,255,255,0.65)');
  rf.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  rf.addColorStop(1, 'rgba(255,255,255,0.05)');
  c.fillStyle = rf;
  roundRect(c, x + w * 0.12, gy + h * 0.08, w * 0.13, gh * 0.7, 4);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(c, x + w * 0.3, gy + h * 0.1, w * 0.04, gh * 0.35, 2);
  c.fill();
  // bottom refraction: a bright crescent where the glass thickens
  c.fillStyle = 'rgba(255,255,255,0.28)';
  c.beginPath();
  c.ellipse(x + w / 2, y + h - 3, w * 0.42, 4, 0, 0, Math.PI);
  c.fill();
  c.restore();
  stroke(c, 'rgba(60,35,20,0.3)');
  // wooden lid with a knob
  c.fillStyle = vGrad(c, y + h * 0.04, y + h * 0.16, '#8f6a4c', '#5b3f2c');
  roundRect(c, x - 2, y + h * 0.04, w + 4, h * 0.12, 4);
  c.fill();
  stroke(c);
  hiLine(c, x, y + h * 0.04 + 1, w, 0.3, 1.5);
  dropAO(c, x, y + h * 0.16, w, 8, 0.2);
  c.fillStyle = hGrad(c, x + w * 0.35, x + w * 0.65, '#8f6a4c', '#4e3626');
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
  c.fillText(SALON_LABELS.tips, x + w / 2, y + h * 0.51);
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
  c.fillStyle = vGrad(c, y + h * 0.84, y + h, '#9a7452', '#54392a');
  roundRect(c, x + w * 0.06, y + h * 0.84, w * 0.88, h * 0.16, 5);
  c.fill();
  stroke(c);
  grainLines(c, x + w * 0.08, y + h * 0.86, w * 0.84, h * 0.12, 707, 8, 'rgba(255,230,200,0.14)');
  hiLine(c, x + w * 0.08, y + h * 0.85, w * 0.84, 0.3, 2);
  dropAO(c, x + w * 0.1, y + h * 0.8, w * 0.8, h * 0.06, 0.2);
  // body, slightly leaning back (drawn as a rounded slab with a thin lit top edge)
  const bx = x + w * 0.04;
  const by = y;
  const bw = w * 0.92;
  const bh = h * 0.8;
  const bodyG = c.createLinearGradient(bx, by, bx + bw, by + bh);
  bodyG.addColorStop(0, '#565b66');
  bodyG.addColorStop(0.5, '#2e323a');
  bodyG.addColorStop(1, '#1b1d23');
  c.fillStyle = bodyG;
  roundRect(c, bx, by, bw, bh, 7);
  c.fill();
  stroke(c, 'rgba(60,35,20,0.35)');
  c.fillStyle = 'rgba(255,255,255,0.32)';
  roundRect(c, bx + 4, by + 1, bw - 8, 1.6, 1);
  c.fill();
  c.fillStyle = hGrad(c, bx, bx + 3, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0)');
  roundRect(c, bx, by, 3, bh, 7);
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
  c.fillText('Noodles', sx + sw * 0.08, sy + sh * 0.135);
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
    c.fillText(SALON_LABELS.newOrder, sx + sw * 0.3, ny + sh * 0.13);
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

function paintDeliveryBox(c: Ctx, b: Rect, open: boolean) {
  const { x, y, w, h } = b;
  softShadow(c, x + w / 2, y + h, w * 0.62, w * 0.11, 0.3);
  const top = y + h * 0.3;
  const bh = h - (top - y);
  // kraft cardboard: warm tan, lit on the left, fibrous speckle + faint corrugation lines
  const kg = c.createLinearGradient(x, top, x + w, y + h);
  kg.addColorStop(0, '#e0bf98');
  kg.addColorStop(0.55, '#cfa87c');
  kg.addColorStop(1, '#b58a5c');
  c.fillStyle = kg;
  roundRect(c, x, top, w, bh, 6);
  c.fill();
  stroke(c);
  c.save();
  roundRect(c, x, top, w, bh, 6);
  c.clip();
  speckle(c, x, top, w, bh, 611, 260, 'rgba(90,55,25,0.07)');
  speckle(c, x, top, w, bh, 612, 160, 'rgba(255,240,220,0.18)');
  c.strokeStyle = 'rgba(90,55,25,0.06)';
  c.lineWidth = 1;
  for (let yy = top + 5; yy < y + h; yy += 4) {
    c.beginPath();
    c.moveTo(x, yy);
    c.lineTo(x + w, yy);
    c.stroke();
  }
  // packing tape strip down the middle, slightly glossy
  c.fillStyle = 'rgba(230,205,170,0.5)';
  c.fillRect(x + w * 0.5 - 7, top, 14, bh);
  c.fillStyle = 'rgba(255,255,255,0.22)';
  c.fillRect(x + w * 0.5 - 6, top, 3, bh);
  c.fillStyle = 'rgba(60,35,20,0.1)';
  c.fillRect(x + w * 0.5 + 6, top, 1, bh);
  // the front face reads as slightly folded: a darker right-hand side
  c.fillStyle = hGrad(c, x + w * 0.8, x + w, 'rgba(60,35,20,0)', 'rgba(60,35,20,0.12)');
  c.fillRect(x + w * 0.8, top, w * 0.2, bh);
  c.restore();
  hiLine(c, x + 4, top + 1, w - 8, 0.3, 1.5);
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
  c.fillText('NOODLES', 0, 0.5);
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
    dropAO(c, x, top, w, 10, 0.2);
    c.fillStyle = vGrad(c, top - h * 0.2, top, '#ead0ad', '#c89d70');
    roundRect(c, x - 3, top - h * 0.2, w + 6, h * 0.22, 5);
    c.fill();
    stroke(c);
    speckle(c, x - 3, top - h * 0.2, w + 6, h * 0.22, 613, 60, 'rgba(90,55,25,0.07)');
    hiLine(c, x + 2, top - h * 0.2 + 1, w - 4, 0.4, 2);
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

/** Static counter props are painted once into sprites (padding leaves room for shadows/lids). */
function cachedProp(
  key: string,
  r: Rect,
  pad: number,
  paint: (c: Ctx, r: Rect) => void
): HTMLCanvasElement {
  return sprite(`${key}:${Math.round(r.w)}x${Math.round(r.h)}`, r.w + pad * 2, r.h + pad * 2, (c) =>
    paint(c, { x: pad, y: pad, w: r.w, h: r.h })
  );
}

function drawRegister(c: Ctx, r: Rect) {
  const pad = 20;
  c.drawImage(
    cachedProp('salon:register', r, pad, paintRegister),
    r.x - pad,
    r.y - pad,
    r.w + pad * 2,
    r.h + pad * 2
  );
}

function drawTipJar(c: Ctx, j: Rect, coins: number) {
  const pad = 24;
  const n = clamp(Math.floor(coins), 0, 14);
  c.drawImage(
    cachedProp(`salon:tipjar:${n}`, j, pad, (cc, r) => paintTipJar(cc, r, n)),
    j.x - pad,
    j.y - pad,
    j.w + pad * 2,
    j.h + pad * 2
  );
}

function drawDeliveryBox(c: Ctx, b: Rect, open: boolean) {
  const pad = Math.round(b.h * 0.9);
  c.drawImage(
    cachedProp(`salon:box:${open ? 1 : 0}`, b, pad, (cc, r) => paintDeliveryBox(cc, r, open)),
    b.x - pad,
    b.y - pad,
    b.w + pad * 2,
    b.h + pad * 2
  );
}

function drawBench(c: Ctx, x: number, bottom: number, size: number, style: string) {
  const w = size * 0.62;
  const h = size * 0.4;
  const padB = size * 0.1;
  const key = `salon:bench:${Math.round(size)}:${style}`;
  const sp = sprite(key, w + 24, h + padB, (cc) => paintBench(cc, w / 2 + 12, h, size, style));
  c.drawImage(sp, x - w / 2 - 12, bottom - h, w + 24, h + padB);
}

function counterSprite(W: number, H: number, g: Geo, L: SalonLayout) {
  return sprite(`salon:counter:${W}x${H}`, W, H - g.counterTop + 10, (c) => {
    c.translate(0, -g.counterTop + 10);
    const top = g.counterTop;
    const band = g.counterSurf - top;
    // front: vertical hinoki slats (tambour) with soft gaps, warmer and darker toward the floor
    c.fillStyle = vGrad(c, top + band, H, '#e4c6a0', '#c49a6c');
    c.fillRect(0, top + band, W, H - top - band);
    const sw = Math.max(14, W / 70);
    const r = rng(300);
    for (let x = 0; x < W; x += sw) {
      c.fillStyle = hGrad(
        c,
        x,
        x + sw,
        `rgba(255,240,220,${0.04 + r() * 0.06})`,
        `rgba(120,80,40,${0.04 + r() * 0.08})`
      );
      c.fillRect(x, top + band, sw, H - top - band);
      c.fillStyle = 'rgba(45,28,18,0.22)';
      c.fillRect(x, top + band + 10, 1.8, H);
      c.fillStyle = 'rgba(255,245,230,0.28)';
      c.fillRect(x + 1.8, top + band + 10, 1.4, H);
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
    // a broad satin light band across the slats (the room's light catches the front)
    sheen(c, W * 0.05, top + band, W * 0.9, H - top - band, 0.07);
    // kick plinth at the very bottom + its shadow line
    dropAO(c, 0, H - 26, W, 8, 0.12);
    c.fillStyle = vGrad(c, H - 18, H, '#7a563d', '#4a3222');
    c.fillRect(0, H - 18, W, 18);
    hiLine(c, 0, H - 18, W, 0.16);
    // dark trim under the top + the deep AO it casts on the slats
    c.fillStyle = vGrad(c, top + band, top + band + 12, '#7f5b40', '#4e3626');
    c.fillRect(0, top + band, W, 12);
    hiLine(c, 0, top + band, W, 0.14, 1);
    dropAO(c, 0, top + band + 12, W, 30, 0.36);
    // oak top (perspective band): grain gradient, lacquer sheen, crisp lit front edge
    c.fillStyle = vGrad(c, top, top + band, '#e6bf90', '#c8945c');
    c.fillRect(0, top, W, band);
    grainLines(c, 0, top + 3, W, band - 6, 311, 44, 'rgba(120,70,30,0.15)');
    grainLines(c, 0, top + 3, W, band - 6, 312, 30, 'rgba(255,235,210,0.14)');
    const lac = c.createLinearGradient(0, top, 0, top + band);
    lac.addColorStop(0, 'rgba(255,245,230,0.32)');
    lac.addColorStop(0.35, 'rgba(255,245,230,0.1)');
    lac.addColorStop(0.7, 'rgba(255,245,230,0)');
    lac.addColorStop(1, 'rgba(45,28,18,0.3)');
    c.fillStyle = lac;
    c.fillRect(0, top, W, band);
    sheen(c, W * 0.2, top, W * 0.6, band, 0.12);
    hiLine(c, 0, top, W, 0.5, 2.5);
    c.fillStyle = 'rgba(45,28,18,0.1)';
    c.fillRect(0, top - 1, W, 1);
    // a few landed sakura petals with contact shadows near the tablet and by the jar
    const pr = rng(515);
    for (let i = 0; i < 6; i++) {
      const ppx = i < 4 ? L.phone.x + L.phone.w + 10 + pr() * 70 : L.tipJar.x - 90 + pr() * 40;
      const ppy = top + band * (0.3 + pr() * 0.55);
      c.fillStyle = 'rgba(45,28,18,0.14)';
      ellipse(c, ppx + 1, ppy + 1.2, 3.6, 1.3);
      c.fill();
      petal(c, ppx, ppy, 3 + pr() * 1.5, pr() * 6.28, i % 2 ? PINK_L : PINK);
    }
    // a small bamboo tray with chopsticks beside the register
    const tx = L.tipJar.x - 50;
    const ty = L.register.y + L.register.h;
    softShadow(c, tx, ty, 26, 5, 0.22);
    c.fillStyle = vGrad(c, ty - 8, ty, '#dcb67f', '#ad8347');
    roundRect(c, tx - 24, ty - 8, 48, 8, 2);
    c.fill();
    stroke(c);
    hiLine(c, tx - 22, ty - 7.5, 44, 0.3, 1);
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

/** The window's light patch on the floor/counter: a trapezoid from the sill, split by the lattice bars. */
function lightPatch(
  lc: Ctx,
  g: Geo,
  H: number,
  col: string,
  spread: number,
  shift: number,
  barAlpha: number
) {
  const { x, y, w, h } = g.win;
  const top = y + h;
  const bl = x - w * spread + w * shift;
  const br = x + w + w * spread + w * shift;
  // the patch fades with distance from the window (softer near the counter)
  const a = Number(/([\d.]+)\)$/.exec(col)?.[1] ?? '0.2');
  const rgb = col.slice(0, col.lastIndexOf(','));
  const gr = lc.createLinearGradient(0, top, 0, H);
  gr.addColorStop(0, `${rgb},${a})`);
  gr.addColorStop(0.55, `${rgb},${a * 0.6})`);
  gr.addColorStop(1, `${rgb},${a * 0.15})`);
  lc.fillStyle = gr;
  lc.beginPath();
  lc.moveTo(x, top);
  lc.lineTo(x + w, top);
  lc.lineTo(br, H);
  lc.lineTo(bl, H);
  lc.closePath();
  lc.fill();
  if (barAlpha > 0) {
    // shadows of the two vertical bars and the horizontal one
    lc.strokeStyle = `rgba(45,28,18,${barAlpha})`;
    lc.lineWidth = w * 0.014;
    for (const fx of [1 / 3, 2 / 3]) {
      lc.beginPath();
      lc.moveTo(x + w * fx, top);
      lc.lineTo(bl + (br - bl) * fx, H);
      lc.stroke();
    }
    const hy = top + (H - top) * 0.45;
    lc.lineWidth = w * 0.01;
    lc.beginPath();
    lc.moveTo(x + (bl - x) * 0.45, hy);
    lc.lineTo(x + w + (br - x - w) * 0.45, hy);
    lc.stroke();
  }
}

export function drawSalonLight(c: Ctx, W: number, H: number, decor: DecorState, tod: Tod): void {
  const L = TOD_LIGHT[tod];
  const g = geo(W, H, decor);
  const base = `salon:light:${W}x${H}:${tod}:${decor.lamba}:${g.lamps.length}`;
  const dark = tod === 'aksam' || tod === 'gunbatimi';
  const { x, y, w, h } = g.win;
  // layer 1 (multiply): ambient colour + cool corners at dusk/night, lantern pools kept bright
  const mul = dark
    ? sprite(
        base + ':mul',
        W,
        H,
        (lc) => {
          lc.fillStyle = tod === 'aksam' ? '#737cb3' : '#f5cfae';
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
          for (const l of g.lamps) {
            const ly = l.y + 30;
            const gr = lc.createRadialGradient(l.x, ly, 0, l.x, ly, Math.min(W, H) * 0.6);
            gr.addColorStop(0, `rgba(255,236,205,${0.98 * L.lamp})`);
            gr.addColorStop(0.35, `rgba(255,230,195,${0.6 * L.lamp})`);
            gr.addColorStop(0.7, `rgba(255,225,190,${0.2 * L.lamp})`);
            gr.addColorStop(1, 'rgba(255,225,190,0)');
            lc.fillStyle = gr;
            lc.fillRect(0, 0, W, H);
          }
          if (tod === 'gunbatimi') {
            // the sun patch stays fully bright in the multiply layer
            lightPatch(lc, g, H, 'rgba(255,250,235,0.9)', 0.65, -0.55, 0);
          }
        },
        0.25
      )
    : null;
  // layer 2 (normal): window light patch, god-rays, warm glows, vignette
  const over = sprite(
    base + ':over',
    W,
    H,
    (lc) => {
      if (tod === 'sabah') {
        // cool-pink morning: a pale tint, soft long light from the window
        lc.fillStyle = 'rgba(255,228,222,0.1)';
        lc.fillRect(0, 0, W, H);
        lightPatch(lc, g, H, 'rgba(255,236,215,0.24)', 0.45, -0.25, 0.035);
      } else if (tod === 'ogle') {
        lightPatch(lc, g, H, 'rgba(255,255,248,0.14)', 0.12, 0, 0.04);
      } else if (tod === 'gunbatimi') {
        lightPatch(lc, g, H, 'rgba(255,196,130,0.34)', 0.65, -0.55, 0.08);
        // god-rays: soft golden shafts from the pane, through the lattice, into the room
        lc.save();
        lc.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          const fx0 = i / 3 + 0.03;
          const fx1 = (i + 1) / 3 - 0.03;
          const gr = lc.createLinearGradient(x + w * 0.5, y + h * 0.3, x - w * 0.9, H);
          gr.addColorStop(0, 'rgba(255,210,150,0.2)');
          gr.addColorStop(0.5, 'rgba(255,195,125,0.09)');
          gr.addColorStop(1, 'rgba(255,190,120,0)');
          lc.fillStyle = gr;
          lc.beginPath();
          lc.moveTo(x + w * fx0, y + h * 0.3);
          lc.lineTo(x + w * fx1, y + h * 0.3);
          lc.lineTo(x + w * fx1 - w * 1.0, H);
          lc.lineTo(x + w * fx0 - w * 1.25, H);
          lc.closePath();
          lc.fill();
        }
        lc.restore();
        glow(lc, x + w * 0.25, y + h * 0.5, w * 0.6, '255,220,170', 0.22);
      } else {
        lightPatch(lc, g, H, 'rgba(150,180,235,0.1)', 0.2, -0.1, 0);
      }
      if (L.lamp > 0) {
        for (const l of g.lamps) {
          const ly = l.y + 30;
          const gr = lc.createRadialGradient(l.x, ly, 0, l.x, ly, Math.min(W, H) * 0.36);
          gr.addColorStop(0, `rgba(255,224,165,${0.6 * L.lamp})`);
          gr.addColorStop(0.35, `rgba(255,212,145,${0.24 * L.lamp})`);
          gr.addColorStop(1, 'rgba(255,200,120,0)');
          lc.fillStyle = gr;
          lc.fillRect(0, 0, W, H);
          // warm pool on the floor / counter below the lamp (an elongated ellipse)
          const py = g.floorY + g.depth * 0.7;
          lc.save();
          lc.translate(l.x, py);
          lc.scale(1, 0.45);
          const pg = lc.createRadialGradient(0, 0, 0, 0, 0, W * 0.26);
          pg.addColorStop(0, `rgba(255,218,155,${0.3 * L.lamp})`);
          pg.addColorStop(1, 'rgba(255,218,155,0)');
          lc.fillStyle = pg;
          lc.fillRect(-W * 0.3, -W * 0.3, W * 0.6, W * 0.6);
          lc.restore();
        }
      }
      lc.fillStyle = vGrad(lc, 0, H * 0.4, 'rgba(255,240,215,0.08)', 'rgba(255,240,215,0)');
      lc.fillRect(0, 0, W, H * 0.4);
      const v = lc.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.42,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.8
      );
      v.addColorStop(0, 'rgba(45,28,18,0)');
      v.addColorStop(1, `rgba(45,28,18,${dark ? 0.34 : 0.22})`);
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
