// The dining room ("salon") and the service counter, seen from the kitchen side.
// drawSalonBack  → wall, floor, window, door, painting, lamps, plants, tables, diners
// (customer is drawn by the game between the two passes)
// drawSalonFront → counter top + register, tip jar, phone, delivery box, decoration
// drawSalonLight → time-of-day tint, lamp glows, corner shading
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
import type { DecorState } from '../game/decor';
import { tableCount } from '../game/decor';

export interface SalonLayout {
  counterTop: number;
  customer: { x: number; y: number; size: number };
  register: { x: number; y: number; w: number; h: number };
  tipJar: { x: number; y: number; w: number; h: number };
  phone: { x: number; y: number; w: number; h: number };
  deliveryBox: { x: number; y: number; w: number; h: number };
  catSpots: { x: number; y: number }[];
  seats: { x: number; y: number; size: number; table: number }[];
}

export interface Diner {
  seat: number;
  img: HTMLImageElement | null;
  bob: number;
  eating: boolean;
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

const OUT = 'rgba(60,35,20,0.25)';

// ---------- geometry ----------
interface Geo {
  land: boolean;
  counterTop: number;
  counterSurf: number; // bottom of the visible counter-top band (items stand here)
  floorY: number;
  iw: number; // item scale
  win: { x: number; y: number; w: number; h: number };
  door: { x: number; y: number; w: number; h: number };
  painting: { x: number; y: number; w: number; h: number };
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
  const floorY = land ? counterTop - H * 0.17 : counterTop - H * 0.3;
  const iw = 1;
  const win = land
    ? { x: W * 0.6, y: floorY * 0.14, w: W * 0.32, h: floorY * 0.6 }
    : { x: W * 0.42, y: floorY * 0.2, w: W * 0.52, h: floorY * 0.4 };
  const door = land
    ? { x: W * 0.035, y: floorY * 0.2, w: W * 0.1, h: floorY * 0.8 }
    : { x: W * 0.04, y: floorY * 0.42, w: W * 0.18, h: floorY * 0.58 };
  const pw = land ? W * 0.14 : W * 0.26;
  const painting = land
    ? { x: W * 0.31 - pw / 2, y: floorY * 0.22, w: pw, h: pw * 0.74 }
    : { x: W * 0.24 - pw / 2, y: floorY * 0.26, w: pw, h: pw * 0.74 };
  const shelf = land
    ? { x: W * 0.31 - pw * 0.6, y: floorY * 0.74, w: pw * 1.2 }
    : { x: W * 0.24 - pw * 0.6, y: floorY * 0.78, w: pw * 1.2 };
  const lampXs = land ? [0.21, 0.79] : [0.25, 0.75];
  const lamps = lampXs.map((f) => ({ x: W * f, y: floorY * (land ? 0.3 : 0.26) }));
  const depth = counterTop - floorY;
  const plant = { x: W * 0.955, y: floorY + depth * 0.45, h: land ? H * 0.26 : W * 0.3 };
  const tw = land ? W * 0.17 : W * 0.3;
  const n = tableCount(decor);
  const spots: [number, number, number][] = land
    ? [
        [0.19, 0.78, 1],
        [0.81, 0.78, 1],
        [0.36, 0.3, 0.82],
        [0.64, 0.3, 0.82],
      ]
    : [
        [0.17, 0.8, 1],
        [0.83, 0.8, 1],
        [0.3, 0.3, 0.8],
        [0.7, 0.3, 0.8],
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
    iw,
    win,
    door,
    painting,
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
  const pw = 70 * iw;
  const ph = 94 * iw;
  const phone = { x: g.land ? W * 0.17 : W * 0.2, y: base - ph, w: pw, h: ph };
  const bw = 128 * iw;
  const bh = 92 * iw;
  const deliveryBox = { x: 22 * iw, y: base - bh, w: bw, h: bh };
  const depth = counterTop - g.floorY;
  const catSpots = [
    { x: phone.x + pw + 80 * iw, y: base },
    { x: W * 0.9, y: g.floorY + depth * 0.95 },
    { x: W * 0.08, y: g.floorY + depth * 0.98 },
  ];
  const seats: SalonLayout['seats'] = [];
  g.tables.forEach((t, i) => {
    const top = t.ground - t.h;
    const size = (g.land ? 140 : 118) * t.scale;
    seats.push({ x: t.x - t.w * 0.27, y: top + t.h * 0.3, size, table: i });
    seats.push({ x: t.x + t.w * 0.27, y: top + t.h * 0.3, size, table: i });
  });
  return {
    counterTop,
    customer: { x: W / 2, y: counterTop + size * 0.12, size },
    register,
    tipJar,
    phone,
    deliveryBox,
    catSpots,
    seats,
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

// ---------- wall ----------
function drawWall(c: Ctx, W: number, floorY: number, id: string) {
  switch (id) {
    case 'duvar-sage': {
      c.fillStyle = vGrad(c, 0, floorY, '#c9d6b9', '#b3c4a1');
      c.fillRect(0, 0, W, floorY);
      speckle(c, 0, 0, W, floorY, 11, 900, 'rgba(255,255,255,0.18)');
      speckle(c, 0, 0, W, floorY, 12, 500, 'rgba(60,80,40,0.05)');
      break;
    }
    case 'duvar-kiremit': {
      c.fillStyle = vGrad(c, 0, floorY, '#e2a98c', '#cf8f70');
      c.fillRect(0, 0, W, floorY);
      speckle(c, 0, 0, W, floorY, 21, 900, 'rgba(255,240,220,0.18)');
      speckle(c, 0, 0, W, floorY, 22, 500, 'rgba(90,40,20,0.06)');
      break;
    }
    case 'duvar-shoji': {
      c.fillStyle = '#fbf3e4';
      c.fillRect(0, 0, W, floorY);
      speckle(c, 0, 0, W, floorY, 31, 700, 'rgba(200,170,130,0.08)');
      const cell = Math.max(60, W / 16);
      c.strokeStyle = '#b5885c';
      c.lineWidth = 4;
      for (let x = 0; x <= W + 1; x += cell) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, floorY);
        c.stroke();
      }
      c.lineWidth = 3;
      for (let y = floorY * 0.12; y < floorY; y += cell * 0.9) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }
      break;
    }
    case 'duvar-sakura': {
      c.fillStyle = vGrad(c, 0, floorY, '#fbeceb', '#f6dede');
      c.fillRect(0, 0, W, floorY);
      const r = rng(41);
      for (let i = 0; i < W / 9; i++) {
        const px = r() * W;
        const py = r() * floorY;
        const s = 3 + r() * 3;
        c.fillStyle = r() < 0.7 ? 'rgba(233,163,183,0.55)' : 'rgba(255,255,255,0.7)';
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          circle(c, px + Math.cos(a) * s * 0.8, py + Math.sin(a) * s * 0.8, s * 0.55);
          c.fill();
        }
        c.fillStyle = 'rgba(232,179,90,0.7)';
        circle(c, px, py, s * 0.3);
        c.fill();
      }
      break;
    }
    default: {
      // hinoki: pale vertical planks
      c.fillStyle = vGrad(c, 0, floorY, '#f6e7cf', '#eed8b8');
      c.fillRect(0, 0, W, floorY);
      const pw = Math.max(56, W / 20);
      const r = rng(51);
      for (let x = 0; x < W; x += pw) {
        c.fillStyle = `rgba(190,140,90,${0.04 + r() * 0.06})`;
        c.fillRect(x, 0, pw, floorY);
        c.strokeStyle = 'rgba(150,100,60,0.18)';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, floorY);
        c.stroke();
        grainLines(c, x + 4, 0, pw - 8, floorY, 60 + x, 5, 'rgba(150,100,60,0.12)', true);
      }
    }
  }
  // chair rail + baseboard
  c.fillStyle = 'rgba(120,80,45,0.16)';
  c.fillRect(0, floorY - 10, W, 10);
  c.fillStyle = shade(PAL.wood, -0.1);
  c.fillRect(0, floorY - 3, W, 3);
}

// ---------- floor ----------
function drawFloor(c: Ctx, W: number, floorY: number, bottom: number, id: string) {
  const h = bottom - floorY;
  switch (id) {
    case 'zemin-tatami': {
      c.fillStyle = vGrad(c, floorY, bottom, '#d7cf9f', '#c9bf88');
      c.fillRect(0, floorY, W, h);
      const mw = Math.max(120, W / 7);
      c.strokeStyle = '#5f7a55';
      c.lineWidth = 4;
      for (let x = (W / 2) % mw; x <= W; x += mw) {
        c.beginPath();
        c.moveTo(x, floorY);
        c.lineTo(x, bottom);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(0, floorY + h * 0.5);
      c.lineTo(W, floorY + h * 0.5);
      c.stroke();
      c.strokeStyle = 'rgba(120,110,60,0.18)';
      c.lineWidth = 1;
      for (let y = floorY + 3; y < bottom; y += 4) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }
      break;
    }
    case 'zemin-terrazzo': {
      c.fillStyle = vGrad(c, floorY, bottom, '#f1e9dd', '#e6dccb');
      c.fillRect(0, floorY, W, h);
      const r = rng(71);
      const cols = ['#d9b893', '#b9c9a7', '#e9a3b7', '#8fb7cf', '#6e4b32', '#f6b8b0'];
      for (let i = 0; i < W / 3; i++) {
        c.fillStyle = rgba(cols[Math.floor(r() * cols.length)], 0.7);
        ellipse(c, r() * W, floorY + r() * h, 1.5 + r() * 3, 1 + r() * 2);
        c.fill();
      }
      break;
    }
    case 'zemin-tas': {
      c.fillStyle = vGrad(c, floorY, bottom, '#d9d2c6', '#c5bcae');
      c.fillRect(0, floorY, W, h);
      const r = rng(81);
      const rows = 3;
      for (let i = 0; i < rows; i++) {
        const y0 = floorY + (h * i) / rows;
        const y1 = floorY + (h * (i + 1)) / rows;
        const tw = Math.max(80, W / 10) * (0.7 + i * 0.2);
        let x = -r() * tw;
        while (x < W) {
          c.fillStyle = mix('#ccc4b6', '#b9ae9d', r());
          roundRect(c, x + 2, y0 + 2, tw - 4, y1 - y0 - 4, 4);
          c.fill();
          x += tw;
        }
      }
      break;
    }
    default: {
      // light oak planks with perspective: back rows thinner
      c.fillStyle = vGrad(c, floorY, bottom, '#e3c39c', '#d6ae82');
      c.fillRect(0, floorY, W, h);
      const r = rng(91);
      let y = floorY;
      let i = 0;
      while (y < bottom) {
        const ph = 10 + ((y - floorY) / h) * 26;
        c.fillStyle = `rgba(120,80,40,${0.03 + r() * 0.06})`;
        c.fillRect(0, y, W, ph);
        c.strokeStyle = 'rgba(120,80,40,0.22)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
        // plank ends
        const pl = Math.max(160, W / 6);
        for (let x = (i % 2) * pl * 0.5 - r() * 40; x < W; x += pl) {
          c.beginPath();
          c.moveTo(x, y);
          c.lineTo(x, y + ph);
          c.stroke();
        }
        grainLines(c, 0, y, W, ph, 100 + i, 18, 'rgba(120,80,40,0.1)');
        y += ph;
        i++;
      }
    }
  }
  // soft shadow under the wall junction
  c.fillStyle = vGrad(c, floorY, floorY + 22, 'rgba(60,35,20,0.16)', 'rgba(60,35,20,0)');
  c.fillRect(0, floorY, W, 22);
}

// ---------- window ----------
function drawWindow(c: Ctx, g: Geo, tod: Tod, decor: DecorState, rain: boolean) {
  const { x, y, w, h } = g.win;
  const sky = TOD_LIGHT[tod].sky;
  // frame shadow on the wall
  c.fillStyle = 'rgba(60,35,20,0.1)';
  roundRect(c, x - 10, y - 6, w + 20, h + 26, 8);
  c.fill();
  // frame
  c.fillStyle = vGrad(c, y, y + h, shade(PAL.wood, 0.1), PAL.wood);
  roundRect(c, x - 12, y - 12, w + 24, h + 24, 6);
  c.fill();
  stroke(c);
  // glass
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = vGrad(c, y, y + h, sky[0], sky[1]);
  c.fillRect(x, y, w, h);
  const night = tod === 'aksam';
  const dusk = tod === 'gunbatimi';
  if (night) {
    const r = rng(7);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    for (let i = 0; i < 24; i++) {
      circle(c, x + r() * w, y + r() * h * 0.5, 0.6 + r() * 0.9);
      c.fill();
    }
    c.fillStyle = '#fff4cf';
    circle(c, x + w * 0.78, y + h * 0.18, h * 0.07);
    c.fill();
    gloss(c, x + w * 0.78, y + h * 0.18, h * 0.16, 0.35);
  } else if (tod === 'sabah' || tod === 'ogle') {
    // soft clouds
    c.fillStyle = 'rgba(255,255,255,0.75)';
    for (const [cx, cy, s] of [
      [0.2, 0.22, 1],
      [0.65, 0.12, 0.8],
    ]) {
      ellipse(c, x + w * cx, y + h * cy, w * 0.12 * s, h * 0.05 * s);
      c.fill();
      ellipse(c, x + w * cx + w * 0.06 * s, y + h * cy - h * 0.03 * s, w * 0.08 * s, h * 0.05 * s);
      c.fill();
    }
  } else if (dusk) {
    c.fillStyle = '#ffd27a';
    circle(c, x + w * 0.3, y + h * 0.42, h * 0.1);
    c.fill();
    gloss(c, x + w * 0.3, y + h * 0.42, h * 0.3, 0.45);
  }
  // distant buildings
  const bcol = night
    ? '#2a2744'
    : dusk
      ? mix('#7f6a86', sky[1], 0.2)
      : mix('#b7c4cf', sky[1], 0.35);
  c.fillStyle = bcol;
  const r2 = rng(13);
  let bx = x - 10;
  const groundY = y + h * 0.72;
  while (bx < x + w + 10) {
    const bw = w * (0.08 + r2() * 0.12);
    const bh = h * (0.12 + r2() * 0.28);
    roundRect(c, bx, groundY - bh, bw, bh + 10, 3);
    c.fill();
    if (night || dusk) {
      c.fillStyle = night ? 'rgba(255,220,150,0.9)' : 'rgba(255,230,180,0.6)';
      for (let yy = groundY - bh + 8; yy < groundY - 6; yy += 10) {
        for (let xx = bx + 5; xx < bx + bw - 6; xx += 9) if (r2() < 0.55) c.fillRect(xx, yy, 4, 5);
      }
      c.fillStyle = bcol;
    }
    bx += bw + 4 + r2() * 8;
  }
  // roofline/ street
  c.fillStyle = night ? '#1f1d33' : dusk ? '#8a7489' : '#9fb0bb';
  c.fillRect(x, groundY, w, h - (groundY - y));
  c.fillStyle = night ? '#2c2a44' : dusk ? '#a08b9d' : '#c3cfd6';
  c.fillRect(x, groundY + 6, w, 4);
  // small tree
  c.fillStyle = night ? '#2f3f3a' : '#7fa877';
  circle(c, x + w * 0.16, groundY - h * 0.06, h * 0.09);
  c.fill();
  c.fillStyle = '#6e4b32';
  c.fillRect(x + w * 0.16 - 2, groundY - h * 0.02, 4, h * 0.08);
  // lamp post
  c.fillStyle = '#4b4a52';
  c.fillRect(x + w * 0.74, groundY - h * 0.34, 3, h * 0.4);
  c.fillRect(x + w * 0.74 - 7, groundY - h * 0.35, 17, 4);
  c.fillStyle = night || dusk ? '#ffe49a' : '#e7edf0';
  circle(c, x + w * 0.74 + 1.5, groundY - h * 0.3, 5);
  c.fill();
  if (night || dusk) gloss(c, x + w * 0.74 + 1.5, groundY - h * 0.3, h * 0.16, 0.5);
  // rain: static droplets + misty glass (streaks are per frame)
  if (rain) {
    c.fillStyle = 'rgba(200,215,225,0.25)';
    c.fillRect(x, y, w, h);
    const r3 = rng(17);
    for (let i = 0; i < 70; i++) {
      const dx = x + r3() * w;
      const dy = y + r3() * h;
      const s = 1.5 + r3() * 3;
      c.fillStyle = 'rgba(255,255,255,0.45)';
      ellipse(c, dx, dy, s * 0.6, s);
      c.fill();
      c.fillStyle = 'rgba(80,90,110,0.15)';
      ellipse(c, dx, dy + s * 0.5, s * 0.4, s * 0.5);
      c.fill();
    }
  }
  // glass sheen
  c.fillStyle = 'rgba(255,255,255,0.1)';
  c.beginPath();
  c.moveTo(x + w * 0.05, y + h);
  c.lineTo(x + w * 0.3, y);
  c.lineTo(x + w * 0.42, y);
  c.lineTo(x + w * 0.17, y + h);
  c.closePath();
  c.fill();
  c.restore();
  // mullions
  c.strokeStyle = PAL.wood;
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(x + w / 2, y);
  c.lineTo(x + w / 2, y + h);
  c.moveTo(x, y + h * 0.42);
  c.lineTo(x + w, y + h * 0.42);
  c.stroke();
  // sill
  c.fillStyle = shade(PAL.wood, 0.18);
  roundRect(c, x - 18, y + h + 8, w + 36, 12, 3);
  c.fill();
  stroke(c);
  // window extras
  if (decor.pencere === 'pencere-noren') {
    const n = 5;
    const sw = w / n;
    for (let i = 0; i < n; i++) {
      c.fillStyle = i % 2 ? '#3f4b86' : '#4a5a9e';
      roundRect(c, x + i * sw + 2, y - 4, sw - 4, h * 0.3, 3);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = 2;
      c.beginPath();
      for (let k = 0; k <= 6; k++) {
        const px = x + i * sw + 2 + ((sw - 4) * k) / 6;
        const py = y + h * 0.17 + (k % 2 ? 3 : -3);
        if (k === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
    }
    c.fillStyle = PAL.walnut;
    c.fillRect(x - 14, y - 8, w + 28, 6);
  } else if (decor.pencere === 'pencere-cicek') {
    const bw = w * 0.9;
    const bx = x + (w - bw) / 2;
    const by = y + h + 20;
    const r = rng(19);
    for (let i = 0; i < 14; i++) {
      const fx = bx + 8 + r() * (bw - 16);
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
    c.fillStyle = PAL.woodDark;
    roundRect(c, bx, by, bw, 22, 4);
    c.fill();
    stroke(c);
    c.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(c, bx + 4, by + 3, bw - 8, 5, 2);
    c.fill();
  }
}

// ---------- door ----------
function drawDoor(c: Ctx, g: Geo) {
  const { x, y, w, h } = g.door;
  c.fillStyle = 'rgba(60,35,20,0.1)';
  roundRect(c, x - 8, y - 4, w + 16, h + 6, 6);
  c.fill();
  c.fillStyle = vGrad(c, y, y + h, shade(PAL.wood, 0.05), PAL.woodDark);
  roundRect(c, x - 8, y - 8, w + 16, h + 8, 6);
  c.fill();
  stroke(c);
  c.fillStyle = vGrad(c, y, y + h, '#d9ae7f', '#c4925f');
  roundRect(c, x, y, w, h + 2, 4);
  c.fill();
  grainLines(c, x + 4, y, w - 8, h, 23, 10, 'rgba(120,80,40,0.14)', true);
  // glass pane
  c.fillStyle = vGrad(c, y + 12, y + h * 0.5, '#d7e8ee', '#eef5f7');
  roundRect(c, x + w * 0.16, y + 14, w * 0.68, h * 0.42, 6);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.beginPath();
  c.moveTo(x + w * 0.22, y + h * 0.5);
  c.lineTo(x + w * 0.4, y + 18);
  c.lineTo(x + w * 0.5, y + 18);
  c.lineTo(x + w * 0.32, y + h * 0.5);
  c.closePath();
  c.fill();
  // "AÇIK" sign
  c.fillStyle = PAL.tomato;
  roundRect(c, x + w * 0.3, y + h * 0.28, w * 0.4, 16, 3);
  c.fill();
  c.fillStyle = PAL.cream;
  c.font = `800 9px "Baloo 2", system-ui, sans-serif`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('AÇIK', x + w * 0.5, y + h * 0.28 + 8.5);
  // lower panel + handle
  c.fillStyle = 'rgba(60,35,20,0.08)';
  roundRect(c, x + w * 0.16, y + h * 0.64, w * 0.68, h * 0.28, 4);
  c.fill();
  c.fillStyle = '#c9a227';
  roundRect(c, x + w * 0.82, y + h * 0.56, 4, 14, 2);
  c.fill();
}

// ---------- painting ----------
function drawPainting(c: Ctx, g: Geo, id: string) {
  if (id === 'tablo-yok') return;
  const { x, y, w, h } = g.painting;
  c.fillStyle = 'rgba(60,35,20,0.12)';
  roundRect(c, x - 4, y + 2, w + 12, h + 12, 4);
  c.fill();
  c.fillStyle = vGrad(c, y, y + h, PAL.woodDark, PAL.walnut);
  roundRect(c, x - 8, y - 8, w + 16, h + 16, 4);
  c.fill();
  stroke(c);
  c.fillStyle = PAL.cream;
  c.fillRect(x, y, w, h);
  const px = x + w * 0.08;
  const py = y + h * 0.1;
  const pw = w * 0.84;
  const ph = h * 0.8;
  c.save();
  c.beginPath();
  c.rect(px, py, pw, ph);
  c.clip();
  switch (id) {
    case 'tablo-fuji': {
      c.fillStyle = vGrad(c, py, py + ph, '#f6c6c0', '#fde6d6');
      c.fillRect(px, py, pw, ph);
      c.fillStyle = '#f4a8a0';
      circle(c, px + pw * 0.72, py + ph * 0.32, ph * 0.14);
      c.fill();
      c.fillStyle = '#5c6a96';
      c.beginPath();
      c.moveTo(px - 5, py + ph);
      c.lineTo(px + pw * 0.5, py + ph * 0.25);
      c.lineTo(px + pw + 5, py + ph);
      c.closePath();
      c.fill();
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.moveTo(px + pw * 0.5, py + ph * 0.25);
      c.lineTo(px + pw * 0.64, py + ph * 0.45);
      c.lineTo(px + pw * 0.58, py + ph * 0.42);
      c.lineTo(px + pw * 0.53, py + ph * 0.48);
      c.lineTo(px + pw * 0.47, py + ph * 0.43);
      c.lineTo(px + pw * 0.42, py + ph * 0.47);
      c.lineTo(px + pw * 0.36, py + ph * 0.45);
      c.closePath();
      c.fill();
      break;
    }
    case 'tablo-dalga': {
      c.fillStyle = '#f1e6cf';
      c.fillRect(px, py, pw, ph);
      c.fillStyle = '#2f4f86';
      c.beginPath();
      c.moveTo(px, py + ph);
      c.quadraticCurveTo(px + pw * 0.1, py + ph * 0.4, px + pw * 0.45, py + ph * 0.25);
      c.quadraticCurveTo(px + pw * 0.75, py + ph * 0.1, px + pw * 0.7, py + ph * 0.4);
      c.quadraticCurveTo(px + pw * 0.55, py + ph * 0.5, px + pw * 0.6, py + ph * 0.55);
      c.quadraticCurveTo(px + pw, py + ph * 0.6, px + pw, py + ph);
      c.closePath();
      c.fill();
      c.fillStyle = '#ffffff';
      for (let i = 0; i < 8; i++) {
        const fx = px + pw * (0.45 + i * 0.04);
        const fy = py + ph * (0.22 + Math.sin(i) * 0.03);
        circle(c, fx, fy, 2.2);
        c.fill();
      }
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(px + pw * 0.08, py + ph * 0.8);
      c.quadraticCurveTo(px + pw * 0.3, py + ph * 0.5, px + pw * 0.55, py + ph * 0.6);
      c.stroke();
      break;
    }
    case 'tablo-koi': {
      c.fillStyle = vGrad(c, py, py + ph, '#8fb7cf', '#6f9cb8');
      c.fillRect(px, py, pw, ph);
      for (const [fx, fy, col, rot] of [
        [0.35, 0.4, '#ef8a76', -0.5],
        [0.65, 0.6, '#fff6e9', 2.4],
      ] as [number, number, string, number][]) {
        c.save();
        c.translate(px + pw * fx, py + ph * fy);
        c.rotate(rot);
        c.fillStyle = col;
        ellipse(c, 0, 0, pw * 0.09, ph * 0.22);
        c.fill();
        c.beginPath();
        c.moveTo(0, ph * 0.18);
        c.lineTo(-pw * 0.05, ph * 0.34);
        c.lineTo(pw * 0.05, ph * 0.34);
        c.closePath();
        c.fill();
        c.fillStyle = col === '#fff6e9' ? '#ef8a76' : '#ffffff';
        circle(c, 2, -ph * 0.05, 3);
        c.fill();
        c.restore();
      }
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(px + pw * 0.8, py + ph * 0.25, 6 + i * 6, 0, Math.PI * 2);
        c.stroke();
      }
      break;
    }
    case 'tablo-turna': {
      c.fillStyle = vGrad(c, py, py + ph, '#fbf3e4', '#f1dfc4');
      c.fillRect(px, py, pw, ph);
      c.fillStyle = '#e9a3b7';
      circle(c, px + pw * 0.75, py + ph * 0.3, ph * 0.16);
      c.fill();
      for (const [fx, fy, s] of [
        [0.35, 0.5, 1],
        [0.6, 0.62, 0.8],
      ]) {
        c.save();
        c.translate(px + pw * fx, py + ph * fy);
        c.scale(s, s);
        c.fillStyle = '#ffffff';
        ellipse(c, 0, 0, pw * 0.14, ph * 0.08);
        c.fill();
        c.beginPath();
        c.moveTo(-pw * 0.1, -ph * 0.02);
        c.lineTo(-pw * 0.22, -ph * 0.3);
        c.lineTo(pw * 0.02, -ph * 0.05);
        c.closePath();
        c.fill();
        c.strokeStyle = '#3a2a22';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(pw * 0.12, -ph * 0.02);
        c.lineTo(pw * 0.2, -ph * 0.22);
        c.stroke();
        c.fillStyle = '#d9573f';
        circle(c, pw * 0.2, -ph * 0.24, 2.4);
        c.fill();
        c.fillStyle = '#3a2a22';
        c.fillRect(pw * 0.1, -ph * 0.03, pw * 0.07, 2);
        c.beginPath();
        c.moveTo(pw * 0.1, 0);
        c.lineTo(pw * 0.26, -ph * 0.08);
        c.lineTo(pw * 0.3, -ph * 0.06);
        c.closePath();
        c.fill();
        c.restore();
      }
      break;
    }
  }
  c.restore();
}

// ---------- shelf ----------
function drawShelf(c: Ctx, g: Geo) {
  const { x, y, w } = g.shelf;
  c.fillStyle = 'rgba(60,35,20,0.12)';
  roundRect(c, x, y + 4, w, 10, 3);
  c.fill();
  // items
  const items = ['jar', 'bowl', 'cup', 'book', 'plant'];
  const step = w / items.length;
  items.forEach((it, i) => {
    const ix = x + step * (i + 0.5);
    switch (it) {
      case 'jar':
        c.fillStyle = 'rgba(210,230,235,0.8)';
        roundRect(c, ix - 9, y - 26, 18, 26, 4);
        c.fill();
        stroke(c);
        c.fillStyle = PAL.latte;
        c.fillRect(ix - 7, y - 16, 14, 14);
        c.fillStyle = PAL.walnut;
        roundRect(c, ix - 8, y - 29, 16, 5, 2);
        c.fill();
        break;
      case 'bowl':
        c.fillStyle = PAL.tomato;
        c.beginPath();
        c.moveTo(ix - 12, y - 14);
        c.quadraticCurveTo(ix - 10, y, ix, y);
        c.quadraticCurveTo(ix + 10, y, ix + 12, y - 14);
        c.closePath();
        c.fill();
        stroke(c);
        c.fillStyle = PAL.paper;
        ellipse(c, ix, y - 14, 12, 3);
        c.fill();
        break;
      case 'cup':
        c.fillStyle = PAL.blue;
        roundRect(c, ix - 7, y - 16, 14, 16, 3);
        c.fill();
        stroke(c);
        c.fillStyle = PAL.sage;
        roundRect(c, ix - 7 + 18, y - 16, 14, 16, 3);
        c.fill();
        stroke(c);
        break;
      case 'book':
        c.fillStyle = PAL.indigo;
        roundRect(c, ix - 10, y - 22, 7, 22, 1.5);
        c.fill();
        c.fillStyle = PAL.coral;
        roundRect(c, ix - 2, y - 19, 7, 19, 1.5);
        c.fill();
        c.fillStyle = PAL.honey;
        roundRect(c, ix + 6, y - 24, 6, 24, 1.5);
        c.fill();
        break;
      case 'plant':
        c.fillStyle = PAL.paper;
        roundRect(c, ix - 8, y - 14, 16, 14, 3);
        c.fill();
        stroke(c);
        c.fillStyle = PAL.moss;
        for (const [dx, dy] of [
          [-6, -18],
          [0, -24],
          [6, -18],
        ]) {
          ellipse(c, ix + dx, y + dy, 5, 7);
          c.fill();
        }
        break;
    }
  });
  // board
  c.fillStyle = vGrad(c, y, y + 8, shade(PAL.wood, 0.15), PAL.wood);
  roundRect(c, x, y, w, 8, 2);
  c.fill();
  stroke(c);
  c.fillStyle = PAL.woodDark;
  for (const bx of [x + 14, x + w - 14]) {
    c.beginPath();
    c.moveTo(bx - 4, y + 8);
    c.lineTo(bx + 4, y + 8);
    c.lineTo(bx, y + 20);
    c.closePath();
    c.fill();
  }
}

// ---------- lamps ----------
function drawLamp(c: Ctx, x: number, y: number, id: string, on: boolean) {
  // cord
  c.strokeStyle = '#4a3f3b';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, 0);
  c.lineTo(x, y);
  c.stroke();
  const warm = on ? '#ffe3a3' : '#f3efe6';
  switch (id) {
    case 'lamba-kagit': {
      c.fillStyle = on ? '#fff3d6' : '#fbf6ec';
      circle(c, x, y + 24, 26);
      c.fill();
      stroke(c);
      c.strokeStyle = 'rgba(120,90,60,0.2)';
      c.lineWidth = 1;
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.ellipse(x, y + 24, Math.abs(i) * 8 + 2, 26, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.fillStyle = '#4a3f3b';
      roundRect(c, x - 8, y - 4, 16, 7, 3);
      c.fill();
      roundRect(c, x - 8, y + 47, 16, 6, 3);
      c.fill();
      if (on) gloss(c, x - 8, y + 14, 14, 0.5);
      break;
    }
    case 'lamba-chochin': {
      c.fillStyle = on ? '#ef6a52' : '#d9573f';
      ellipse(c, x, y + 30, 20, 30);
      c.fill();
      stroke(c);
      c.strokeStyle = 'rgba(60,20,10,0.25)';
      c.lineWidth = 1;
      for (let i = -3; i <= 3; i++) {
        const yy = y + 30 + i * 8;
        const rx = Math.sqrt(Math.max(0, 1 - ((i * 8) / 30) ** 2)) * 20;
        c.beginPath();
        c.moveTo(x - rx, yy);
        c.lineTo(x + rx, yy);
        c.stroke();
      }
      c.fillStyle = '#2a2320';
      roundRect(c, x - 10, y - 2, 20, 7, 3);
      c.fill();
      roundRect(c, x - 10, y + 56, 20, 6, 3);
      c.fill();
      c.fillStyle = PAL.cream;
      c.font = `800 12px "Baloo 2", system-ui, sans-serif`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('麺', x, y + 30);
      if (on) gloss(c, x - 6, y + 20, 12, 0.35);
      break;
    }
    case 'lamba-pirinc': {
      c.fillStyle = vGrad(c, y, y + 36, '#e6c27a', '#b98b3e');
      c.beginPath();
      c.moveTo(x - 6, y);
      c.lineTo(x + 6, y);
      c.lineTo(x + 26, y + 36);
      c.lineTo(x - 26, y + 36);
      c.closePath();
      c.fill();
      stroke(c);
      c.fillStyle = 'rgba(255,255,255,0.25)';
      c.beginPath();
      c.moveTo(x - 3, y + 2);
      c.lineTo(x + 1, y + 2);
      c.lineTo(x - 10, y + 34);
      c.lineTo(x - 18, y + 34);
      c.closePath();
      c.fill();
      c.fillStyle = warm;
      ellipse(c, x, y + 36, 26, 5);
      c.fill();
      if (on) {
        c.fillStyle = '#fff6d0';
        circle(c, x, y + 32, 7);
        c.fill();
      }
      break;
    }
    default: {
      // bare bulb
      c.fillStyle = '#4a3f3b';
      roundRect(c, x - 7, y - 2, 14, 16, 3);
      c.fill();
      c.fillStyle = on ? '#ffe6a8' : 'rgba(240,236,228,0.95)';
      circle(c, x, y + 30, 17);
      c.fill();
      stroke(c, 'rgba(60,35,20,0.2)');
      c.fillStyle = on ? '#fff8dc' : '#ffffff';
      ellipse(c, x, y + 20, 7, 8);
      c.fill();
      c.strokeStyle = on ? '#f0a860' : '#9a8f86';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(x - 4, y + 36);
      c.lineTo(x - 3, y + 26);
      c.lineTo(x, y + 30);
      c.lineTo(x + 3, y + 26);
      c.lineTo(x + 4, y + 36);
      c.stroke();
      gloss(c, x - 6, y + 23, 8, 0.6);
    }
  }
}

// ---------- plant ----------
function drawPlant(c: Ctx, g: Geo, id: string) {
  if (id === 'bitki-yok') return;
  const { x, y, h } = g.plant;
  const potW = h * 0.34;
  const potH = h * 0.26;
  softShadow(c, x, y, potW * 0.9, potW * 0.22, 0.25);
  c.save();
  c.translate(x, y);
  const k = h / 180;
  c.scale(k, k);
  // foliage first
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
        c.fillStyle = '#8fbf7a';
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
        // splits
        c.fillStyle = '#a3c99a';
        for (const sx of [-1, 1]) {
          for (let i = 0; i < 2; i++) {
            c.beginPath();
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
      c.strokeStyle = '#6e4b32';
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
      for (let i = 0; i < 40; i++) {
        const b = branches[Math.floor(r() * branches.length)];
        const tt = 0.3 + r() * 0.7;
        const bx = b[0] + (b[2] - b[0]) * tt + (r() - 0.5) * 14;
        const by = b[1] + (b[3] - b[1]) * tt + (r() - 0.5) * 14;
        c.fillStyle = r() < 0.6 ? '#f3b6c6' : '#fbd9e2';
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          circle(c, bx + Math.cos(a) * 3.2, by + Math.sin(a) * 3.2, 2.6);
          c.fill();
        }
        c.fillStyle = '#e8b35a';
        circle(c, bx, by, 1.2);
        c.fill();
      }
      break;
    }
  }
  // pot / vase
  if (id === 'bitki-sakura') {
    c.fillStyle = vGrad(c, -60, 0, '#6f7fa8', '#55628a');
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
    c.fillStyle = vGrad(c, -48, 0, '#e3b59a', '#c58b6c');
    c.beginPath();
    c.moveTo(-30, -48);
    c.lineTo(30, -48);
    c.lineTo(24, 0);
    c.lineTo(-24, 0);
    c.closePath();
    c.fill();
    stroke(c);
    c.fillStyle = '#d9a083';
    roundRect(c, -33, -52, 66, 10, 3);
    c.fill();
    stroke(c);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    roundRect(c, -24, -40, 8, 34, 4);
    c.fill();
  }
  c.restore();
  void potH;
}

// ---------- tables ----------
function tableColors(style: string): { top: string; edge: string; leg: string } {
  switch (style) {
    case 'stil-ceviz':
      return { top: '#8a5e3e', edge: '#6e4b32', leg: '#5a3b26' };
    case 'stil-lake':
      return { top: '#c9432f', edge: '#9b2f20', leg: '#3a2a22' };
    case 'stil-mermer':
      return { top: '#f7f3ec', edge: '#d9d2c6', leg: '#9a8f86' };
    default:
      return { top: '#e6c59b', edge: '#c99a6b', leg: '#b98a5c' };
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
    for (const lx of [w * 0.12, w * 0.82]) {
      roundRect(c, lx, topH, w * 0.06, h - topH, 3);
      c.fill();
      stroke(c);
    }
    // top (rounded slab seen from slightly above)
    c.fillStyle = col.edge;
    roundRect(c, 0, topH * 0.45, w, topH * 0.7, topH * 0.3);
    c.fill();
    stroke(c);
    c.fillStyle = vGrad(c, 0, topH, shade(col.top, 0.12), col.top);
    roundRect(c, 0, 0, w, topH * 0.75, topH * 0.35);
    c.fill();
    stroke(c);
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
      c.fillStyle = 'rgba(255,255,255,0.25)';
      roundRect(c, w * 0.06, 3, w * 0.5, topH * 0.18, 4);
      c.fill();
    } else {
      grainLines(c, 4, 2, w - 8, topH * 0.7, Math.round(w) + 3, 8, 'rgba(90,60,30,0.14)');
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
        c.fillStyle = PAL.blue;
        roundRect(c, cx - 6, cy - 18, 12, 18, 4);
        c.fill();
        stroke(c);
        c.strokeStyle = PAL.moss;
        c.lineWidth = 1.5;
        for (const [dx, dy, col] of [
          [-7, -30, PAL.rose],
          [0, -34, PAL.butter],
          [7, -29, PAL.coral],
        ] as [number, number, string][]) {
          c.beginPath();
          c.moveTo(cx, cy - 16);
          c.lineTo(cx + dx, cy + dy + 4);
          c.stroke();
          c.fillStyle = col;
          circle(c, cx + dx, cy + dy, 4.5);
          c.fill();
          c.fillStyle = 'rgba(255,255,255,0.6)';
          circle(c, cx + dx - 1.2, cy + dy - 1.2, 1.4);
          c.fill();
        }
        break;
      }
      case 'sus-bonsai': {
        c.fillStyle = '#7a5a4a';
        roundRect(c, cx - 12, cy - 8, 24, 8, 2);
        c.fill();
        stroke(c);
        c.strokeStyle = '#6e4b32';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(cx, cy - 8);
        c.quadraticCurveTo(cx + 4, cy - 18, cx - 4, cy - 24);
        c.stroke();
        c.fillStyle = PAL.moss;
        ellipse(c, cx - 6, cy - 26, 11, 5);
        c.fill();
        ellipse(c, cx + 7, cy - 20, 8, 4);
        c.fill();
        c.fillStyle = PAL.matcha;
        ellipse(c, cx - 7, cy - 28, 6, 2.5);
        c.fill();
        break;
      }
    }
  });
}

function drawChair(c: Ctx, x: number, bottom: number, size: number, style: string) {
  const col = tableColors(style);
  const w = size * 0.56;
  const h = size * 0.6;
  c.fillStyle = col.leg;
  roundRect(c, x - w / 2, bottom - h, w, h, 8);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(255,255,255,0.12)';
  roundRect(c, x - w / 2 + 6, bottom - h + 6, w - 12, h * 0.3, 5);
  c.fill();
}

function dinerPlaceholder(c: Ctx, x: number, y: number, s: number) {
  c.fillStyle = PAL.sand;
  circle(c, x, y - s * 0.6, s * 0.22);
  c.fill();
  c.beginPath();
  c.moveTo(x - s * 0.4, y);
  c.quadraticCurveTo(x - s * 0.38, y - s * 0.32, x, y - s * 0.34);
  c.quadraticCurveTo(x + s * 0.38, y - s * 0.32, x + s * 0.4, y);
  c.closePath();
  c.fill();
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
    drawWall(c, W, g.floorY, decor.duvar);
    drawFloor(c, W, g.floorY, H, decor.zemin);
    drawDoor(c, g);
    drawWindow(c, g, tod, decor, rain);
    drawPainting(c, g, decor.tablo);
    drawShelf(c, g);
    for (const l of g.lamps) drawLamp(c, l.x, l.y, decor.lamba, lampsOn);
    drawPlant(c, g, decor.bitki);
  });
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
  // rain streaks on the window glass
  if (o.rain) {
    const { x, y, w, h } = g.win;
    c.save();
    c.beginPath();
    c.rect(x, y, w, h);
    c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 1.2;
    c.lineCap = 'round';
    const r = rng(3);
    for (let i = 0; i < 26; i++) {
      const sx = x + r() * w;
      const sp = 0.6 + r() * 0.8;
      const ph = ((t * sp + r()) % 1) * (h + 40) - 20;
      c.beginPath();
      c.moveTo(sx, y + ph);
      c.lineTo(sx - 3, y + ph + 16 + r() * 10);
      c.stroke();
    }
    c.restore();
  }
  // tables + diners, back to front
  const layout = salonLayout(W, H, decor);
  const order = g.tables.map((tb, i) => ({ tb, i })).sort((a, b) => a.tb.ground - b.tb.ground);
  for (const { tb, i } of order) {
    const top = tb.ground - tb.h;
    softShadow(c, tb.x, tb.ground, tb.w * 0.6, tb.w * 0.12, 0.22);
    for (let s = 0; s < 2; s++) {
      const seatIdx = i * 2 + s;
      const seat = layout.seats[seatIdx];
      drawChair(c, seat.x, seat.y + seat.size * 0.12, seat.size, decor.masaStil);
      const d = o.diners.find((dd) => dd.seat === seatIdx);
      if (d) {
        const by = seat.y - d.bob;
        if (d.img) c.drawImage(d.img, seat.x - seat.size / 2, by - seat.size, seat.size, seat.size);
        else dinerPlaceholder(c, seat.x, by, seat.size);
      }
    }
    const sp = tableSprite(tb.w, tb.h, decor.masaStil, decor.masaSus);
    c.drawImage(sp, tb.x - tb.w / 2 - 10, top - 10, tb.w + 20, tb.h + 30);
    // a bowl on the table in front of each eating diner
    for (let s = 0; s < 2; s++) {
      const d = o.diners.find((dd) => dd.seat === i * 2 + s);
      if (d?.eating) {
        const bx = tb.x + (s ? 1 : -1) * tb.w * 0.27;
        const by = top + tb.h * 0.1;
        c.fillStyle = '#c9432f';
        ellipse(c, bx, by, 12 * tb.scale, 6 * tb.scale);
        c.fill();
        stroke(c);
        c.fillStyle = '#e8b35a';
        ellipse(c, bx, by - 1.5 * tb.scale, 9 * tb.scale, 3.5 * tb.scale);
        c.fill();
      }
    }
  }
  c.restore();
}

// ---------- counter items ----------
function drawRegister(c: Ctx, r: { x: number; y: number; w: number; h: number }) {
  const { x, y, w, h } = r;
  softShadow(c, x + w / 2, y + h, w * 0.6, h * 0.1, 0.25);
  // body
  c.fillStyle = vGrad(c, y + h * 0.3, y + h, '#f3ebdd', '#ddd1bd');
  roundRect(c, x, y + h * 0.32, w, h * 0.68, 10);
  c.fill();
  stroke(c);
  // drawer line
  c.fillStyle = 'rgba(60,35,20,0.1)';
  roundRect(c, x + 6, y + h * 0.82, w - 12, h * 0.1, 4);
  c.fill();
  c.fillStyle = PAL.sage;
  roundRect(c, x + w * 0.4, y + h * 0.84, w * 0.2, h * 0.06, 3);
  c.fill();
  // keypad
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
  // display
  c.fillStyle = '#4a4a55';
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

function drawTipJar(c: Ctx, j: { x: number; y: number; w: number; h: number }, coins: number) {
  const { x, y, w, h } = j;
  softShadow(c, x + w / 2, y + h, w * 0.55, w * 0.14, 0.22);
  // coins inside (drawn first, glass over)
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
  // glass
  c.fillStyle = 'rgba(215,235,240,0.35)';
  roundRect(c, x, y + h * 0.12, w, h * 0.88, w * 0.22);
  c.fill();
  stroke(c, 'rgba(60,35,20,0.3)');
  c.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(c, x + w * 0.12, y + h * 0.2, w * 0.14, h * 0.6, 4);
  c.fill();
  // lid
  c.fillStyle = PAL.woodDark;
  roundRect(c, x - 2, y + h * 0.04, w + 4, h * 0.12, 4);
  c.fill();
  stroke(c);
  c.fillStyle = PAL.walnut;
  roundRect(c, x + w * 0.35, y, w * 0.3, h * 0.08, 3);
  c.fill();
  // label
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

function drawPhone(
  c: Ctx,
  p: { x: number; y: number; w: number; h: number },
  ringing: boolean,
  t: number
) {
  const { x, y, w, h } = p;
  softShadow(c, x + w / 2, y + h, w * 0.6, w * 0.14, 0.22);
  // base
  c.fillStyle = vGrad(c, y + h * 0.72, y + h, '#f1e9dc', '#d8ccb8');
  roundRect(c, x, y + h * 0.72, w, h * 0.28, 8);
  c.fill();
  stroke(c);
  c.fillStyle = ringing && Math.sin(t * 18) > 0 ? PAL.coral : PAL.sage;
  circle(c, x + w * 0.8, y + h * 0.86, 3);
  c.fill();
  // handset
  c.save();
  const shake = ringing ? Math.sin(t * 40) * 1.6 : 0;
  c.translate(x + w * 0.4 + shake, y + h * 0.74 + (ringing ? -Math.abs(Math.sin(t * 20)) * 3 : 0));
  c.rotate(ringing ? Math.sin(t * 40) * 0.05 : 0);
  const hw = w * 0.42;
  const hh = h * 0.72;
  c.fillStyle = vGrad(c, -hh, 0, '#5a6270', '#3a3f4a');
  roundRect(c, -hw / 2, -hh, hw, hh, hw * 0.4);
  c.fill();
  stroke(c);
  c.fillStyle = '#2a3340';
  roundRect(c, -hw * 0.3, -hh * 0.82, hw * 0.6, hh * 0.22, 3);
  c.fill();
  c.fillStyle = '#9ff0b0';
  roundRect(c, -hw * 0.22, -hh * 0.78, hw * 0.44, hh * 0.1, 2);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.5)';
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      circle(c, -hw * 0.25 + i * hw * 0.25, -hh * 0.5 + j * hh * 0.12, hw * 0.07);
      c.fill();
    }
  c.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(c, -hw * 0.42, -hh * 0.95, hw * 0.16, hh * 0.7, 3);
  c.fill();
  // antenna
  c.fillStyle = '#3a3f4a';
  roundRect(c, hw * 0.2, -hh - h * 0.14, 3, h * 0.16, 1.5);
  c.fill();
  c.restore();
  if (ringing) {
    c.strokeStyle = `rgba(239,138,118,${0.5 + Math.sin(t * 12) * 0.3})`;
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    for (const s of [-1, 1]) {
      for (let i = 0; i < 2; i++) {
        c.beginPath();
        c.arc(
          x + w * 0.4 + s * w * 0.3,
          y + h * 0.3,
          8 + i * 8,
          s > 0 ? -0.6 : Math.PI - 0.6,
          s > 0 ? 0.6 : Math.PI + 0.6
        );
        c.stroke();
      }
    }
  }
}

function drawDeliveryBox(c: Ctx, b: { x: number; y: number; w: number; h: number }, open: boolean) {
  const { x, y, w, h } = b;
  softShadow(c, x + w / 2, y + h, w * 0.6, w * 0.1, 0.25);
  const top = y + h * 0.3;
  // kraft box body
  c.fillStyle = vGrad(c, top, y + h, '#d9b690', '#bf9568');
  roundRect(c, x, top, w, h - (top - y), 6);
  c.fill();
  stroke(c);
  c.fillStyle = 'rgba(60,35,20,0.08)';
  c.fillRect(x + w * 0.5 - 1, top + 6, 2, h - (top - y) - 12);
  // stamp
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
  // paper bag inside (visible when open)
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
  // lid
  c.save();
  if (open) {
    c.translate(x, top);
    c.rotate(-1.15);
    c.fillStyle = vGrad(c, -h * 0.3, 0, '#c9a07a', '#bf9568');
    roundRect(c, 0, -h * 0.22, w, h * 0.22, 5);
    c.fill();
    stroke(c);
  } else {
    c.fillStyle = vGrad(c, top - h * 0.2, top, '#e4c5a1', '#cfa77d');
    roundRect(c, x - 3, top - h * 0.2, w + 6, h * 0.22, 5);
    c.fill();
    stroke(c);
    c.fillStyle = 'rgba(255,255,255,0.2)';
    roundRect(c, x + 6, top - h * 0.17, w * 0.4, h * 0.05, 2);
    c.fill();
    // handle slot
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
      // body
      c.beginPath();
      c.moveTo(-22, 0);
      c.quadraticCurveTo(-26, -34, -8, -42);
      c.quadraticCurveTo(0, -44, 8, -42);
      c.quadraticCurveTo(26, -34, 22, 0);
      c.closePath();
      c.fill();
      stroke(c);
      // head
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
      // orange patches
      c.fillStyle = '#f0a860';
      ellipse(c, -11, -60, 6, 4.5);
      c.fill();
      ellipse(c, 12, -26, 7, 9);
      c.fill();
      // face
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
      // collar + bell
      c.fillStyle = PAL.tomato;
      roundRect(c, -14, -38, 28, 5, 2.5);
      c.fill();
      c.fillStyle = '#e8b35a';
      circle(c, 0, -32, 4);
      c.fill();
      stroke(c);
      // raised paw
      c.fillStyle = '#fbf7ef';
      roundRect(c, 12, -66, 10, 26, 5);
      c.fill();
      stroke(c);
      // koban coin
      c.fillStyle = '#e8b35a';
      ellipse(c, -14, -22, 9, 12);
      c.fill();
      stroke(c);
      c.fillStyle = 'rgba(120,80,20,0.6)';
      c.font = '800 9px "Baloo 2", system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('福', -14, -22);
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
      // eyes (one painted = wish made)
      c.strokeStyle = '#3a2a22';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(-6, -36, 4, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = '#3a2a22';
      circle(c, 6, -36, 4);
      c.fill();
      // eyebrows + beard flourishes
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-11, -44);
      c.quadraticCurveTo(-6, -47, -2, -43);
      c.moveTo(2, -43);
      c.quadraticCurveTo(6, -47, 11, -44);
      c.stroke();
      c.fillStyle = '#e8b35a';
      c.font = '800 10px "Baloo 2", system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('福', 0, -10);
      break;
    }
    case 'tezgah-ikebana': {
      c.fillStyle = '#3a3f4a';
      ellipse(c, 0, -6, 30, 7);
      c.fill();
      stroke(c);
      c.fillStyle = '#4a5260';
      ellipse(c, 0, -8, 26, 4.5);
      c.fill();
      c.strokeStyle = '#6e4b32';
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
      for (const [bx, by, col, r] of [
        [-10, -70, PAL.rose, 7],
        [-15, -52, PAL.blush, 5],
        [26, -42, PAL.butter, 6],
      ] as [number, number, string, number][]) {
        c.fillStyle = col;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          circle(c, bx + Math.cos(a) * r * 0.7, by + Math.sin(a) * r * 0.7, r * 0.55);
          c.fill();
        }
        c.fillStyle = '#e8b35a';
        circle(c, bx, by, r * 0.3);
        c.fill();
      }
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

function counterSprite(W: number, H: number, g: Geo) {
  return sprite(`salon:counter:${W}x${H}`, W, H - g.counterTop + 10, (c) => {
    c.translate(0, -g.counterTop + 10);
    const top = g.counterTop;
    const band = g.counterSurf - top;
    const h = H - top;
    // front panel
    c.fillStyle = vGrad(c, top + band, H, '#f4e6d2', '#e3cfb2');
    c.fillRect(0, top + band, W, h - band);
    const pw = Math.max(70, W / 14);
    for (let x = 0; x < W; x += pw) {
      c.strokeStyle = 'rgba(150,100,60,0.14)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x, top + band + 14);
      c.lineTo(x, H);
      c.stroke();
      grainLines(
        c,
        x + 4,
        top + band + 16,
        pw - 8,
        h - band - 20,
        300 + x,
        5,
        'rgba(150,100,60,0.1)',
        true
      );
    }
    // wood trim under the top
    c.fillStyle = vGrad(c, top + band, top + band + 14, shade(PAL.woodDark, 0.1), PAL.woodDark);
    c.fillRect(0, top + band, W, 14);
    c.fillStyle = 'rgba(60,35,20,0.18)';
    c.fillRect(0, top + band + 14, W, 8);
    // wood top (perspective band) with lacquer edge
    c.fillStyle = vGrad(c, top, top + band, '#dcae7c', '#c7955f');
    c.fillRect(0, top, W, band);
    grainLines(c, 0, top + 3, W, band - 6, 311, 40, 'rgba(120,70,30,0.16)');
    c.fillStyle = 'rgba(255,255,255,0.25)';
    c.fillRect(0, top, W, 3);
    c.fillStyle = 'rgba(255,240,220,0.12)';
    c.fillRect(0, top + 3, W, band * 0.4);
    c.fillStyle = vGrad(c, top + band - 6, top + band, 'rgba(60,35,20,0)', 'rgba(60,35,20,0.25)');
    c.fillRect(0, top + band - 6, W, 6);
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
  c.drawImage(counterSprite(W, H, g), 0, g.counterTop - 10, W, H - g.counterTop + 10);
  drawDeliveryBox(c, L.deliveryBox, !!o.boxOpen);
  drawPhone(c, L.phone, !!o.phoneRinging, t);
  drawCounterDeco(c, g.decoX, L.register.y + L.register.h, g.iw, decor.tezgah);
  drawTipJar(c, L.tipJar, o.tipCoins);
  drawRegister(c, L.register);
  if (o.cashOnCounter) drawCash(c, L.customer.x + 60 * g.iw, g.counterSurf - 14 * g.iw, g.iw);
  c.restore();
}

export function drawSalonLight(c: Ctx, W: number, H: number, decor: DecorState, tod: Tod): void {
  const L = TOD_LIGHT[tod];
  const g = geo(W, H, decor);
  const key = `salon:light:${W}x${H}:${tod}:${decor.lamba}:${g.lamps.length}`;
  const sp = sprite(
    key,
    W,
    H,
    (lc) => {
      if (L.alpha > 0) {
        lc.fillStyle = rgba(L.tint, L.alpha);
        lc.fillRect(0, 0, W, H);
      }
      if (L.lamp > 0) {
        // cool corners
        for (const [cx, cy] of [
          [0, 0],
          [W, 0],
          [0, H],
          [W, H],
        ]) {
          const gr = lc.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.7);
          gr.addColorStop(0, `rgba(40,45,90,${0.2 * L.lamp})`);
          gr.addColorStop(1, 'rgba(40,45,90,0)');
          lc.fillStyle = gr;
          lc.fillRect(0, 0, W, H);
        }
        // warm lamp pools
        for (const l of g.lamps) {
          const ly = l.y + 30;
          const r = Math.min(W, H) * 0.42;
          const gr = lc.createRadialGradient(l.x, ly, 0, l.x, ly, r);
          gr.addColorStop(0, `rgba(255,214,140,${0.55 * L.lamp})`);
          gr.addColorStop(0.5, `rgba(255,200,120,${0.14 * L.lamp})`);
          gr.addColorStop(1, 'rgba(255,200,120,0)');
          lc.fillStyle = gr;
          lc.fillRect(0, 0, W, H);
        }
      }
      // gentle vignette always
      const v = lc.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.5,
        W / 2,
        H / 2,
        Math.max(W, H) * 0.8
      );
      v.addColorStop(0, 'rgba(60,35,20,0)');
      v.addColorStop(1, 'rgba(60,35,20,0.16)');
      lc.fillStyle = v;
      lc.fillRect(0, 0, W, H);
    },
    0.25
  );
  c.save();
  c.drawImage(sp, 0, 0, W, H);
  c.restore();
}
