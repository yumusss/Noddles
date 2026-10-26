// The dining room of Nami-ya, seen from behind the counter: noren door, calligraphy plaques,
// sake shelf, lanterns, a harbor window whose light follows the time of day, tables in the back.

import type { DecorSlot, TimeOfDay } from '../game/data';
import { tx, t as tt } from '../game/i18n';
import {
  type Ctx,
  contactShadow,
  darken,
  ellipse,
  lighten,
  lin,
  mix,
  rad,
  rgba,
  rr,
  sheen,
  speckle,
  sprite,
  srand,
  text,
  woodGrain,
} from './common';

export interface SalonLayout {
  W: number;
  H: number;
  wallBottom: number; // where the back wall meets the floor
  counterTop: number; // y of the counter's top edge
  counterFront: number; // y where the counter top turns into the front panel
  seatY: number; // customer waist y
  headR: number;
  winX: number;
  winY: number;
  winW: number;
  winH: number;
  doorX: number;
  doorW: number;
  tableY: number;
  register: { x: number; y: number; w: number };
  tablet: { x: number; y: number; w: number; h: number };
  jar: { x: number; y: number; w: number };
  inky: { x: number; y: number; s: number };
  box: { x: number; y: number; w: number };
  servedPlate: { x: number; y: number; u: number };
}

export function salonLayout(W: number, H: number, portrait: boolean): SalonLayout {
  const counterTop = portrait ? H * 0.64 : H * 0.7;
  const wallBottom = portrait ? H * 0.47 : H * 0.5;
  const headR = portrait ? 56 : 54;
  const winW = portrait ? W * 0.5 : Math.min(W * 0.34, 470);
  const winY = portrait ? 168 : 150;
  const winH = portrait
    ? Math.max(150, wallBottom - winY - 170)
    : Math.max(150, wallBottom - winY - 50);
  const k = portrait ? 1.05 : 1;
  return {
    W,
    H,
    wallBottom,
    counterTop,
    counterFront: counterTop + (H - counterTop) * 0.55,
    seatY: counterTop + 6,
    headR,
    winX: W / 2 - winW / 2,
    winY,
    winW,
    winH,
    doorX: portrait ? W * 0.02 : W * 0.035,
    doorW: portrait ? W * 0.2 : Math.min(150, W * 0.12),
    tableY: wallBottom + (counterTop - wallBottom) * 0.42,
    register: {
      x: W * (portrait ? 0.15 : 0.13),
      y: counterTop + 18,
      w: (portrait ? 150 : 165) * k,
    },
    tablet: portrait
      ? { x: W * 0.3, y: counterTop + 70, w: 120, h: 84 }
      : { x: W * 0.28, y: counterTop + 70, w: 132, h: 92 },
    jar: { x: W * (portrait ? 0.84 : 0.8), y: counterTop + 30, w: 76 * k },
    inky: {
      x: W * (portrait ? 0.68 : 0.92),
      y: counterTop + (portrait ? 130 : 20),
      s: portrait ? 100 : 110,
    },
    box: {
      x: W * (portrait ? 0.11 : 0.09),
      y: wallBottom + (counterTop - wallBottom) * 0.62,
      w: 70,
    },
    servedPlate: { x: W / 2, y: counterTop + (H - counterTop) * 0.36, u: portrait ? 330 : 360 },
  };
}

export interface SkyMood {
  top: string;
  bottom: string;
  sea: string;
  sun: string;
  light: string; // tint over the room
  lightA: number;
  lamps: number; // lantern glow 0..1
}

export function skyFor(time: TimeOfDay, rain: boolean): SkyMood {
  const m: Record<TimeOfDay, SkyMood> = {
    morning: {
      top: '#bfe0ee',
      bottom: '#fbe7cf',
      sea: '#8fc2cf',
      sun: '#fff2c9',
      light: '#fff4dc',
      lightA: 0.06,
      lamps: 0.2,
    },
    noon: {
      top: '#9fd0ea',
      bottom: '#e6f3f2',
      sea: '#6eb1c4',
      sun: '#fffbe9',
      light: '#ffffff',
      lightA: 0.03,
      lamps: 0.15,
    },
    sunset: {
      top: '#f0a988',
      bottom: '#fcd9a3',
      sea: '#d99a8a',
      sun: '#ffd27a',
      light: '#ffb98a',
      lightA: 0.12,
      lamps: 0.55,
    },
    evening: {
      top: '#2e3a66',
      bottom: '#6a5f8e',
      sea: '#3c4a78',
      sun: '#fff3c4',
      light: '#3b3f6e',
      lightA: 0.18,
      lamps: 1,
    },
  };
  const s = { ...m[time] };
  if (rain) {
    s.top = mix(s.top, '#8d9aa8', 0.6);
    s.bottom = mix(s.bottom, '#b7bfc6', 0.6);
    s.sea = mix(s.sea, '#6f7f8c', 0.5);
    s.lightA += 0.06;
    s.light = mix(s.light, '#6f7f8c', 0.5);
    s.lamps = Math.max(s.lamps, 0.6);
  }
  return s;
}

const WALLS: Record<string, { base: string; pat: 'plaster' | 'wave' | 'wood' }> = {
  'wall-plain': { base: '#f3e4cc', pat: 'plaster' },
  'wall-wave': { base: '#e8eef0', pat: 'wave' },
  'wall-indigo': { base: '#5c6b94', pat: 'wood' },
};

// ---------- static background (cached) ----------

export function drawSalonBg(
  c: Ctx,
  L: SalonLayout,
  time: TimeOfDay,
  rain: boolean,
  decor: Record<DecorSlot, string>,
  lang: string
) {
  const key = `salon:${L.W}x${L.H}:${time}:${rain}:${Object.values(decor).join(',')}:${lang}`;
  sprite(c, key, L.W, L.H, 0, 0, (cc) => paintSalon(cc, L, time, rain, decor), 0, 0);
}

function paintSalon(
  c: Ctx,
  L: SalonLayout,
  time: TimeOfDay,
  rain: boolean,
  decor: Record<DecorSlot, string>
) {
  const { W } = L;
  const sky = skyFor(time, rain);
  const wall = WALLS[decor.wall] ?? WALLS['wall-plain'];
  // ---- back wall
  c.fillStyle = lin(c, 0, 0, 0, L.wallBottom, [
    [0, darken(wall.base, 0.06)],
    [1, lighten(wall.base, 0.04)],
  ]);
  c.fillRect(0, 0, W, L.wallBottom);
  if (wall.pat === 'plaster')
    speckle(c, 0, 0, W, L.wallBottom, '#a88a66', Math.floor(W * 3), 5, 0.08);
  if (wall.pat === 'wave') {
    // seigaiha waves
    const s = 34;
    for (let row = 0; row * s * 0.5 < L.wallBottom + s; row++)
      for (let col = -1; col * s < W + s; col++) {
        const x = col * s + (row % 2 ? s / 2 : 0);
        const y = row * s * 0.5;
        for (let k = 3; k > 0; k--) {
          c.beginPath();
          c.arc(x, y, (s / 2) * (k / 3), Math.PI, 0);
          c.fillStyle = k % 2 ? '#dfe7ec' : '#c8d5df';
          c.fill();
        }
      }
  }
  if (wall.pat === 'wood')
    woodGrain(c, 0, 0, W, L.wallBottom, wall.base, 31, {
      planks: Math.round(W / 80),
      vertical: true,
      strength: 0.8,
    });
  // ceiling beam and wainscot
  woodGrain(c, 0, 0, W, 26, '#8a6040', 2, { strength: 1.2 });
  c.fillStyle = 'rgba(60,35,20,0.25)';
  c.fillRect(0, 26, W, 5);
  const wainY = L.wallBottom - L.wallBottom * 0.2;
  woodGrain(c, 0, wainY, W, L.wallBottom - wainY, '#c69a6c', 9, {
    planks: Math.round(W / 60),
    vertical: true,
  });
  c.fillStyle = '#8a6040';
  c.fillRect(0, wainY - 6, W, 8);

  // ---- window with harbor view
  paintWindow(c, L, sky, rain);

  // ---- door with noren curtain (left)
  const dX = L.doorX;
  const dY = L.wallBottom * 0.2;
  const dW = L.doorW;
  const dH = L.wallBottom - dY;
  c.fillStyle = '#7a5236';
  rr(c, dX - 8, dY - 8, dW + 16, dH + 8, 4);
  c.fill();
  c.fillStyle = lin(c, 0, dY, 0, dY + dH, [
    [0, mix(sky.bottom, '#ffffff', 0.3)],
    [1, mix(sky.sea, '#e6d6bf', 0.5)],
  ]);
  c.fillRect(dX, dY, dW, dH);
  // street outside
  c.fillStyle = rgba('#a89a8a', 0.45);
  c.fillRect(dX, dY + dH * 0.72, dW, dH * 0.28);
  // noren: indigo panels with a white wave crest
  const nH = dH * 0.42;
  const panels = 3;
  for (let i = 0; i < panels; i++) {
    const px = dX + (dW / panels) * i + 1;
    const pw = dW / panels - 2;
    c.fillStyle = lin(c, px, dY, px + pw, dY, [
      [0, '#4b5884'],
      [0.5, '#56638c'],
      [1, '#434f7a'],
    ]);
    c.beginPath();
    c.moveTo(px, dY);
    c.lineTo(px + pw, dY);
    c.lineTo(px + pw, dY + nH);
    c.quadraticCurveTo(px + pw / 2, dY + nH + 6, px, dY + nH);
    c.closePath();
    c.fill();
  }
  // wave crest motif across panels
  c.strokeStyle = 'rgba(255,250,240,0.9)';
  c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i <= 6; i++) {
    const x = dX + (dW * i) / 6;
    c.arc(x, dY + nH * 0.62, dW / 14, Math.PI, 0);
  }
  c.stroke();
  c.fillStyle = 'rgba(255,250,240,0.92)';
  text(c, '波', dX + dW / 2, dY + nH * 0.3, dW * 0.22, 'rgba(255,250,240,0.95)', {
    font: 'brush',
    weight: 700,
  });
  c.fillStyle = '#6e4b32';
  c.fillRect(dX - 6, dY - 4, dW + 12, 6);

  // ---- calligraphy plaques (menu) on the right of the window
  const plX = L.winX + L.winW + (portraitish(L) ? 20 : 40);
  const plaques = ['鮭', '鮪', '巻', '玉'];
  const pw = 34;
  for (let i = 0; i < plaques.length; i++) {
    const x = plX + i * (pw + 12);
    if (x + pw > W - 20) break;
    const y = L.winY + 8;
    c.strokeStyle = '#6e4b32';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + pw / 2, 26);
    c.lineTo(x + pw / 2, y);
    c.stroke();
    rr(c, x, y, pw, 104, 4);
    c.fillStyle = lin(c, x, y, x + pw, y, [
      [0, '#f2deb8'],
      [1, '#e2c79b'],
    ]);
    c.fill();
    c.strokeStyle = rgba('#8a6040', 0.6);
    c.stroke();
    text(c, plaques[i], x + pw / 2, y + 30, 22, '#3a2a22', { font: 'brush', weight: 700 });
    ellipse(c, x + pw / 2, y + 82, 9, 9);
    c.fillStyle = '#d9573f';
    c.fill();
  }

  // ---- sake shelf (left of the window)
  const shX = Math.max(dX + dW + 30, L.winX - (portraitish(L) ? 150 : 230));
  const shW = Math.min(190, L.winX - shX - 24);
  if (shW > 80) {
    for (let s = 0; s < 2; s++) {
      const y = L.winY + 40 + s * 78;
      woodGrain(c, shX, y, shW, 10, '#9a6a44', 40 + s);
      contactShadow(c, shX + shW / 2, y + 14, shW / 2, 5, 0.25);
      const r = srand(9 + s);
      let x = shX + 8;
      while (x < shX + shW - 20) {
        const kind = r();
        if (kind < 0.45) {
          // sake bottle
          const bw = 16;
          const bh = 46 + r() * 10;
          const col = ['#5a7a5a', '#8a5a3a', '#e8e0d0', '#44506e'][Math.floor(r() * 4)];
          c.fillStyle = lin(c, x, 0, x + bw, 0, [
            [0, darken(col, 0.15)],
            [0.4, lighten(col, 0.15)],
            [1, darken(col, 0.2)],
          ]);
          rr(c, x, y - bh * 0.6, bw, bh * 0.6, 4);
          c.fill();
          rr(c, x + bw * 0.3, y - bh, bw * 0.4, bh * 0.45, 2);
          c.fill();
          c.fillStyle = '#f5ecd8';
          c.fillRect(x + 2, y - bh * 0.45, bw - 4, 14);
          text(c, '酒', x + bw / 2, y - bh * 0.45 + 7, 9, '#3a2a22', { font: 'brush' });
          x += bw + 8;
        } else {
          // ceramic jar / cup
          const jw = 22 + r() * 8;
          const col = ['#c9b089', '#7d8fae', '#e9dcc4', '#b86a4a'][Math.floor(r() * 4)];
          ellipse(c, x + jw / 2, y - jw * 0.45, jw / 2, jw * 0.5);
          c.fillStyle = rad(c, x + jw * 0.35, y - jw * 0.6, 0, jw, [
            [0, lighten(col, 0.25)],
            [1, darken(col, 0.15)],
          ]);
          c.fill();
          x += jw + 8;
        }
      }
    }
  }

  // ---- floor
  const floorIsStone = decor.floor === 'floor-stone';
  if (floorIsStone) {
    c.fillStyle = '#cfc6b8';
    c.fillRect(0, L.wallBottom, W, L.counterTop - L.wallBottom);
    const r = srand(77);
    for (let i = 0; i < W / 9; i++) {
      const x = r() * W;
      const y = L.wallBottom + r() * (L.counterTop - L.wallBottom);
      ellipse(c, x, y, 10 + r() * 16, 5 + r() * 6, r() - 0.5);
      c.fillStyle = mix('#b9ae9c', '#e3dbcd', r());
      c.fill();
    }
  } else {
    woodGrain(c, 0, L.wallBottom, W, L.counterTop - L.wallBottom, '#d9b48a', 12, { planks: 5 });
  }
  c.fillStyle = lin(c, 0, L.wallBottom, 0, L.wallBottom + 30, [
    [0, 'rgba(60,35,20,0.3)'],
    [1, 'rgba(60,35,20,0)'],
  ]);
  c.fillRect(0, L.wallBottom, W, 30);
  // window light on the floor
  c.fillStyle = rgba(sky.sun, time === 'evening' ? 0.05 : 0.18);
  c.beginPath();
  c.moveTo(L.winX, L.wallBottom);
  c.lineTo(L.winX + L.winW, L.wallBottom);
  c.lineTo(L.winX + L.winW * 1.25, L.counterTop);
  c.lineTo(L.winX - L.winW * 0.1, L.counterTop);
  c.closePath();
  c.fill();

  // ---- plant
  if (decor.plant === 'plant-bonsai') paintBonsai(c, W - 70, L.wallBottom + 8, 1);
  if (decor.plant === 'plant-sakura') paintSakura(c, W - 70, L.wallBottom + 8, 1);

  // room tint for the time of day
  c.fillStyle = rgba(sky.light, sky.lightA);
  c.fillRect(0, 0, W, L.counterTop);
}

function portraitish(L: SalonLayout) {
  return L.H > L.W;
}

function paintWindow(c: Ctx, L: SalonLayout, sky: SkyMood, rain: boolean) {
  const { winX: x, winY: y, winW: w, winH: h } = L;
  // frame
  rr(c, x - 12, y - 12, w + 24, h + 24, 6);
  c.fillStyle = '#7a5236';
  c.fill();
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = lin(c, 0, y, 0, y + h * 0.62, [
    [0, sky.top],
    [1, sky.bottom],
  ]);
  c.fillRect(x, y, w, h);
  // sun or moon
  const night = sky.lamps >= 1;
  ellipse(c, x + w * 0.75, y + h * (night ? 0.22 : 0.3), night ? 12 : 22, night ? 12 : 22);
  c.fillStyle = rad(c, x + w * 0.75, y + h * 0.3, 0, 40, [
    [0, sky.sun],
    [1, rgba(sky.sun, 0)],
  ]);
  c.fill();
  if (night) {
    const r = srand(4);
    for (let i = 0; i < 26; i++) {
      c.fillStyle = `rgba(255,255,240,${0.4 + r() * 0.5})`;
      c.fillRect(x + r() * w, y + r() * h * 0.45, 1.4, 1.4);
    }
  }
  // far hills
  c.fillStyle = mix(sky.bottom, '#7c9a8a', 0.45);
  c.beginPath();
  c.moveTo(x, y + h * 0.58);
  c.quadraticCurveTo(x + w * 0.2, y + h * 0.36, x + w * 0.42, y + h * 0.55);
  c.quadraticCurveTo(x + w * 0.6, y + h * 0.42, x + w * 0.85, y + h * 0.56);
  c.lineTo(x + w, y + h * 0.55);
  c.lineTo(x + w, y + h);
  c.lineTo(x, y + h);
  c.fill();
  // lighthouse
  const lx = x + w * 0.16;
  const ly = y + h * 0.5;
  c.fillStyle = '#f4efe3';
  c.beginPath();
  c.moveTo(lx - 5, ly + 10);
  c.lineTo(lx - 3, ly - 22);
  c.lineTo(lx + 3, ly - 22);
  c.lineTo(lx + 5, ly + 10);
  c.fill();
  c.fillStyle = '#d9573f';
  c.fillRect(lx - 4, ly - 10, 8, 5);
  c.fillRect(lx - 4, ly - 26, 8, 4);
  if (night) {
    c.fillStyle = 'rgba(255,240,170,0.35)';
    c.beginPath();
    c.moveTo(lx, ly - 24);
    c.lineTo(lx + 70, ly - 34);
    c.lineTo(lx + 70, ly - 14);
    c.fill();
  }
  // sea
  c.fillStyle = lin(c, 0, y + h * 0.58, 0, y + h, [
    [0, sky.sea],
    [1, darken(sky.sea, 0.15)],
  ]);
  c.fillRect(x, y + h * 0.6, w, h * 0.4);
  c.strokeStyle = 'rgba(255,255,255,0.35)';
  c.lineWidth = 1;
  const r = srand(12);
  for (let i = 0; i < 14; i++) {
    const wx = x + r() * w;
    const wy = y + h * 0.65 + r() * h * 0.3;
    c.beginPath();
    c.moveTo(wx, wy);
    c.quadraticCurveTo(wx + 6, wy - 2, wx + 12, wy);
    c.stroke();
  }
  // pier with cherry tree
  c.fillStyle = '#8a6040';
  c.fillRect(x + w * 0.55, y + h * 0.82, w * 0.45, 5);
  for (let i = 0; i < 4; i++) c.fillRect(x + w * (0.6 + i * 0.1), y + h * 0.82, 3, h * 0.2);
  c.restore();
  // shoji lattice
  c.strokeStyle = '#8a6040';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x + w / 2, y);
  c.lineTo(x + w / 2, y + h);
  c.moveTo(x, y + h * 0.34);
  c.lineTo(x + w, y + h * 0.34);
  c.stroke();
  c.lineWidth = 1.4;
  c.strokeStyle = rgba('#8a6040', 0.7);
  c.beginPath();
  for (let i = 1; i < 4; i++) {
    c.moveTo(x + (w / 4) * i, y);
    c.lineTo(x + (w / 4) * i, y + h * 0.34);
  }
  c.stroke();
  // glass sheen
  c.fillStyle = 'rgba(255,255,255,0.08)';
  c.beginPath();
  c.moveTo(x + w * 0.1, y);
  c.lineTo(x + w * 0.3, y);
  c.lineTo(x + w * 0.1, y + h);
  c.lineTo(x - w * 0.1, y + h);
  c.fill();
  // sill
  woodGrain(c, x - 18, y + h + 8, w + 36, 12, '#b98a5e', 3);
  void rain;
}

function paintBonsai(c: Ctx, x: number, y: number, k: number) {
  rr(c, x - 30 * k, y - 18 * k, 60 * k, 20 * k, 4);
  c.fillStyle = '#56638c';
  c.fill();
  c.strokeStyle = '#6e4b32';
  c.lineWidth = 5 * k;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y - 18 * k);
  c.quadraticCurveTo(x - 14 * k, y - 40 * k, x + 6 * k, y - 60 * k);
  c.stroke();
  for (const [dx, dy, s] of [
    [-22, -58, 20],
    [10, -72, 24],
    [24, -52, 16],
  ]) {
    ellipse(c, x + dx * k, y + dy * k, s * k, s * 0.6 * k);
    c.fillStyle = rad(c, x + dx * k, y + (dy - 5) * k, 0, s * k, [
      [0, '#a9c98e'],
      [1, '#5f8a52'],
    ]);
    c.fill();
  }
}

function paintSakura(c: Ctx, x: number, y: number, k: number) {
  ellipse(c, x, y - 22 * k, 16 * k, 24 * k);
  c.fillStyle = lin(c, x - 16, 0, x + 16, 0, [
    [0, '#d9cdb8'],
    [1, '#f4efe3'],
  ]);
  c.fill();
  c.strokeStyle = '#6e4b32';
  c.lineWidth = 2.5 * k;
  c.beginPath();
  c.moveTo(x, y - 40 * k);
  c.quadraticCurveTo(x - 20 * k, y - 90 * k, x - 50 * k, y - 110 * k);
  c.moveTo(x - 20 * k, y - 80 * k);
  c.quadraticCurveTo(x + 10 * k, y - 110 * k, x + 30 * k, y - 120 * k);
  c.stroke();
  const r = srand(3);
  for (let i = 0; i < 26; i++) {
    const t = r();
    const bx = x - 50 * k * t + (r() - 0.3) * 40 * k;
    const by = y - 70 * k - t * 50 * k + (r() - 0.5) * 20 * k;
    ellipse(c, bx, by, 5 * k, 4 * k);
    c.fillStyle = r() < 0.5 ? '#f6c2cc' : '#f3a9b9';
    c.fill();
  }
}

// ---------- dynamic layers ----------

/** clouds, a gull and rain on the window — cheap per-frame overlay */
export function drawWindowLife(c: Ctx, L: SalonLayout, t: number, time: TimeOfDay, rain: boolean) {
  const { winX: x, winY: y, winW: w, winH: h } = L;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  if (time !== 'evening') {
    for (let i = 0; i < 3; i++) {
      const cx = x + (((t * (6 + i * 2) + i * 170) % (w + 160)) - 80);
      const cy = y + h * (0.12 + i * 0.08);
      c.fillStyle = rain ? 'rgba(200,205,210,0.8)' : 'rgba(255,255,255,0.75)';
      ellipse(c, cx, cy, 34, 10);
      c.fill();
      ellipse(c, cx + 16, cy - 6, 20, 10);
      c.fill();
    }
    // gull
    const gx = x + ((t * 22) % (w + 100)) - 50;
    const gy = y + h * 0.25 + Math.sin(t) * 6;
    const f = Math.sin(t * 7) * 4;
    c.strokeStyle = '#5a5a60';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(gx - 9, gy - f);
    c.quadraticCurveTo(gx - 4, gy - 4, gx, gy);
    c.quadraticCurveTo(gx + 4, gy - 4, gx + 9, gy - f);
    c.stroke();
  }
  // bobbing boat
  const bx = x + w * 0.35 + Math.sin(t * 0.2) * 20;
  const by = y + h * 0.74 + Math.sin(t * 1.6) * 1.5;
  c.fillStyle = '#d9573f';
  c.beginPath();
  c.moveTo(bx - 18, by);
  c.lineTo(bx + 18, by);
  c.lineTo(bx + 12, by + 7);
  c.lineTo(bx - 12, by + 7);
  c.fill();
  c.fillStyle = '#f4efe3';
  c.beginPath();
  c.moveTo(bx, by - 22);
  c.lineTo(bx, by - 2);
  c.lineTo(bx + 12, by - 4);
  c.fill();
  if (rain) {
    c.strokeStyle = 'rgba(230,240,250,0.55)';
    c.lineWidth = 1;
    for (let i = 0; i < 40; i++) {
      const rx = x + ((i * 53 + t * 40) % w);
      const ry = y + ((i * 97 + t * 520) % (h + 20)) - 20;
      c.beginPath();
      c.moveTo(rx, ry);
      c.lineTo(rx - 3, ry + 12);
      c.stroke();
    }
    // drops on the glass
    for (let i = 0; i < 12; i++) {
      const dx = x + ((i * 71) % w);
      const dy = y + ((i * 43 + t * 12 * (1 + (i % 3))) % h);
      ellipse(c, dx, dy, 2, 3);
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.fill();
    }
  }
  c.restore();
}

/** hanging lanterns with a glow that follows the time of day */
export function drawLanterns(c: Ctx, L: SalonLayout, t: number, glow: number, style: string) {
  const xs = L.W > L.H ? [L.winX - 40, L.winX + L.winW + 40] : [L.W * 0.12, L.W * 0.88];
  for (const [i, x] of xs.entries()) {
    const sway = Math.sin(t * 0.8 + i) * 2;
    const y = 104 + (i % 2) * 14;
    c.strokeStyle = '#6e4b32';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x, 26);
    c.lineTo(x + sway, y - 26);
    c.stroke();
    const col = style === 'lamp-coral' ? '#ef8f7a' : style === 'lamp-brass' ? '#e9b45c' : '#f6e7c8';
    if (glow > 0.2) {
      c.fillStyle = rad(c, x + sway, y, 0, 90, [
        [0, rgba('#ffd98a', 0.28 * glow)],
        [1, 'rgba(255,217,138,0)'],
      ]);
      c.fillRect(x - 90, y - 90, 180, 180);
    }
    if (style === 'lamp-brass') {
      c.fillStyle = lin(c, x - 22, 0, x + 22, 0, [
        [0, '#a87a2e'],
        [0.5, '#f0c870'],
        [1, '#8a6020'],
      ]);
      c.beginPath();
      c.moveTo(x + sway - 24, y + 6);
      c.quadraticCurveTo(x + sway, y - 34, x + sway + 24, y + 6);
      c.closePath();
      c.fill();
      ellipse(c, x + sway, y + 8, 10, 6);
      c.fillStyle = rgba('#fff3c4', 0.6 + glow * 0.4);
      c.fill();
      continue;
    }
    ellipse(c, x + sway, y, 22, 28);
    c.fillStyle = rad(c, x + sway - 6, y - 6, 2, 30, [
      [0, lighten(col, 0.3 + glow * 0.3)],
      [1, darken(col, 0.12 - glow * 0.1)],
    ]);
    c.fill();
    c.strokeStyle = rgba(darken(col, 0.3), 0.5);
    c.lineWidth = 1;
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.ellipse(x + sway, y, 22, 28 * (1 - Math.abs(k) * 0.0), 0, 0, Math.PI * 2);
    }
    for (let k = -18; k <= 18; k += 9) {
      c.beginPath();
      c.moveTo(x + sway - Math.sqrt(Math.max(0, 1 - (k / 28) ** 2)) * 22, y + k);
      c.lineTo(x + sway + Math.sqrt(Math.max(0, 1 - (k / 28) ** 2)) * 22, y + k);
      c.stroke();
    }
    c.fillStyle = '#3a2a22';
    rr(c, x + sway - 10, y - 30, 20, 5, 2);
    c.fill();
    rr(c, x + sway - 10, y + 25, 20, 5, 2);
    c.fill();
    if (style !== 'lamp-coral')
      text(c, '寿司', x + sway, y, 12, rgba('#d9573f', 0.85), { font: 'brush', weight: 700 });
  }
}

/** a small table in the back with a bench; seat x given as salon fraction */
export function drawTable(c: Ctx, x: number, y: number, s: number, style: string) {
  const col = style === 'table-walnut' ? '#7a5236' : '#d6ae80';
  contactShadow(c, x, y + s * 0.62, s * 0.75, s * 0.12, 0.3);
  // legs
  c.fillStyle = darken(col, 0.2);
  c.fillRect(x - s * 0.55, y, s * 0.07, s * 0.6);
  c.fillRect(x + s * 0.48, y, s * 0.07, s * 0.6);
  // top
  rr(c, x - s * 0.65, y - s * 0.08, s * 1.3, s * 0.14, 4);
  c.fillStyle = darken(col, 0.12);
  c.fill();
  rr(c, x - s * 0.65, y - s * 0.12, s * 1.3, s * 0.1, 4);
  c.fillStyle = lighten(col, 0.08);
  c.fill();
}

/** the bowls and tea cups on a table where someone eats */
export function drawTableFood(c: Ctx, x: number, y: number, s: number) {
  ellipse(c, x - s * 0.18, y - s * 0.12, s * 0.2, s * 0.05);
  c.fillStyle = '#3a3e44';
  c.fill();
  for (let i = 0; i < 3; i++) {
    ellipse(c, x - s * 0.28 + i * s * 0.1, y - s * 0.15, s * 0.04, s * 0.03);
    c.fillStyle = i % 2 ? '#f58c5a' : '#f6efe2';
    c.fill();
  }
  rr(c, x + s * 0.2, y - s * 0.24, s * 0.1, s * 0.12, 3);
  c.fillStyle = '#a5c48e';
  c.fill();
}

// ---------- the counter (foreground) ----------

export function drawCounter(c: Ctx, L: SalonLayout) {
  sprite(
    c,
    `counter:${L.W}x${L.H}`,
    L.W,
    L.H - L.counterTop + 20,
    0,
    20,
    (cc) => {
      const top = 0;
      const front = L.counterFront - L.counterTop;
      const h = L.H - L.counterTop;
      // slab top in light hinoki
      cc.fillStyle = 'rgba(60,35,20,0.35)';
      cc.fillRect(0, -10, L.W, 12);
      woodGrain(cc, 0, top, L.W, front, '#efd3a6', 51, { strength: 0.9 });
      cc.fillStyle = lin(cc, 0, top, 0, front, [
        [0, 'rgba(255,255,255,0.22)'],
        [0.15, 'rgba(255,255,255,0.05)'],
        [1, 'rgba(120,70,30,0.08)'],
      ]);
      cc.fillRect(0, top, L.W, front);
      // a strip of light along the far edge
      cc.fillStyle = 'rgba(255,255,255,0.35)';
      cc.fillRect(0, top, L.W, 2);
      // front edge and panel
      cc.fillStyle = '#c99a6b';
      cc.fillRect(0, front, L.W, 8);
      woodGrain(cc, 0, front + 8, L.W, h - front, '#a87a50', 52, { planks: 0, strength: 1 });
      cc.fillStyle = 'rgba(60,35,20,0.25)';
      cc.fillRect(0, front + 8, L.W, 6);
    },
    0,
    L.counterTop
  );
}

/** vintage brass cash register with a glowing display */
export function drawRegister(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  amount: string,
  open: number,
  t: number
) {
  const h = w * 0.78;
  contactShadow(c, x, y + h * 0.12, w * 0.62, h * 0.12, 0.38);
  c.save();
  c.translate(x, y);
  // drawer
  const dOut = open * w * 0.12;
  rr(c, -w * 0.5, -h * 0.18 + dOut, w, h * 0.24, 6);
  c.fillStyle = lin(c, 0, -h * 0.2, 0, h * 0.1, [
    [0, '#b98b45'],
    [1, '#7a5a22'],
  ]);
  c.fill();
  rr(c, -w * 0.08, -h * 0.08 + dOut, w * 0.16, h * 0.05, 3);
  c.fillStyle = '#e9c97a';
  c.fill();
  // body
  c.beginPath();
  c.moveTo(-w * 0.48, -h * 0.18);
  c.lineTo(-w * 0.4, -h * 0.75);
  c.lineTo(w * 0.4, -h * 0.75);
  c.lineTo(w * 0.48, -h * 0.18);
  c.closePath();
  c.fillStyle = lin(c, -w / 2, 0, w / 2, 0, [
    [0, '#8a6020'],
    [0.3, '#e9c97a'],
    [0.55, '#c99a45'],
    [1, '#7a5216'],
  ]);
  c.fill();
  // engraving
  c.strokeStyle = 'rgba(90,60,20,0.5)';
  c.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(0, -h * 0.47, w * (0.08 + i * 0.05), Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
  }
  // keys
  for (let r0 = 0; r0 < 2; r0++)
    for (let k = 0; k < 5; k++) {
      const kx = -w * 0.3 + k * w * 0.15;
      const ky = -h * 0.32 - r0 * h * 0.12;
      ellipse(c, kx, ky + 2, w * 0.045, w * 0.03);
      c.fillStyle = '#5a3e18';
      c.fill();
      ellipse(c, kx, ky, w * 0.045, w * 0.03);
      c.fillStyle = r0 === 0 && k === 4 ? '#ef8f7a' : '#f8efe0';
      c.fill();
    }
  // display tower
  rr(c, -w * 0.3, -h * 1.05, w * 0.6, h * 0.32, 6);
  c.fillStyle = lin(c, 0, -h * 1.05, 0, -h * 0.73, [
    [0, '#e9c97a'],
    [1, '#9a6e28'],
  ]);
  c.fill();
  rr(c, -w * 0.24, -h * 0.99, w * 0.48, h * 0.18, 4);
  c.fillStyle = '#2c2a26';
  c.fill();
  c.fillStyle = rad(c, 0, -h * 0.9, 0, w * 0.3, [
    [0, rgba('#ffd98a', 0.25 + Math.sin(t * 3) * 0.03)],
    [1, 'rgba(255,217,138,0)'],
  ]);
  c.fillRect(-w * 0.3, -h * 1.1, w * 0.6, h * 0.3);
  text(c, amount, 0, -h * 0.9, w * 0.13, '#ffcf6a', { font: 'type', weight: 700 });
  sheen(c, -w * 0.2, -h * 0.6, w * 0.08, h * 0.12, 0.45);
  c.restore();
}

/** glass tip jar with a cork lid and paper label; coins are drawn by the caller inside */
export function drawJarBack(c: Ctx, x: number, y: number, w: number) {
  const h = w * 1.25;
  contactShadow(c, x, y + 2, w * 0.6, w * 0.12, 0.3);
  ellipse(c, x, y - h * 0.5, w * 0.5, h * 0.5);
  c.fillStyle = 'rgba(210,230,235,0.25)';
  c.fill();
}
export function drawJarFront(c: Ctx, x: number, y: number, w: number) {
  const h = w * 1.25;
  c.save();
  ellipse(c, x, y - h * 0.5, w * 0.5, h * 0.5);
  c.strokeStyle = 'rgba(255,255,255,0.7)';
  c.lineWidth = 2;
  c.stroke();
  sheen(c, x - w * 0.25, y - h * 0.55, w * 0.08, h * 0.3, 0.55);
  // cork
  rr(c, x - w * 0.26, y - h * 1.05, w * 0.52, h * 0.14, 4);
  c.fillStyle = lin(c, 0, y - h * 1.05, 0, y - h * 0.9, [
    [0, '#d9b48a'],
    [1, '#a87a50'],
  ]);
  c.fill();
  speckle(c, x - w * 0.26, y - h * 1.05, w * 0.52, h * 0.14, '#6e4b32', 40, 3, 0.4);
  // label
  rr(c, x - w * 0.32, y - h * 0.62, w * 0.64, h * 0.22, 3);
  c.fillStyle = '#f7ecd6';
  c.fill();
  c.strokeStyle = rgba('#d9573f', 0.6);
  c.lineWidth = 1;
  c.stroke();
  text(c, tt('tipJar'), x, y - h * 0.51, w * 0.13, '#8a3b2a', {
    font: 'type',
    weight: 700,
    maxW: w * 0.6,
  });
  c.restore();
}

export function drawCoin(c: Ctx, x: number, y: number, s: number, kind: number, rot: number) {
  const col = kind === 0 ? '#e9c25a' : kind === 1 ? '#d8d2c4' : '#c98a52';
  ellipse(c, x, y, s, s * 0.45, rot * 0.2);
  c.fillStyle = darken(col, 0.25);
  c.fill();
  ellipse(c, x, y - s * 0.12, s, s * 0.42, rot * 0.2);
  c.fillStyle = rad(c, x - s * 0.3, y - s * 0.3, 0, s * 1.2, [
    [0, lighten(col, 0.4)],
    [1, col],
  ]);
  c.fill();
}

/** the shop tablet on a little stand; ringing makes it glow and wiggle */
export function drawTabletProp(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  ringing: boolean,
  t: number,
  badge: number
) {
  const wig = ringing ? Math.sin(t * 30) * 0.03 : 0;
  contactShadow(c, x, y + h * 0.05, w * 0.55, h * 0.1, 0.3);
  c.save();
  c.translate(x, y);
  c.rotate(wig);
  // stand
  c.fillStyle = '#8a6040';
  c.beginPath();
  c.moveTo(-w * 0.15, 0);
  c.lineTo(w * 0.15, 0);
  c.lineTo(w * 0.08, -h * 0.3);
  c.lineTo(-w * 0.08, -h * 0.3);
  c.fill();
  c.rotate(-0.12);
  rr(c, -w / 2, -h * 1.05, w, h, 10);
  c.fillStyle = '#e9e4da';
  c.fill();
  rr(c, -w / 2 + 6, -h * 1.05 + 6, w - 12, h - 12, 6);
  c.fillStyle = ringing
    ? lin(c, 0, -h, 0, 0, [
        [0, '#ffd9a0'],
        [1, '#ef8f7a'],
      ])
    : lin(c, 0, -h, 0, 0, [
        [0, '#cfe3ec'],
        [1, '#9fb6d0'],
      ]);
  c.fill();
  if (ringing) {
    text(c, '☎', 0, -h * 0.58, h * 0.38, '#fff6e9', { weight: 700 });
    for (let i = 0; i < 2; i++) {
      c.strokeStyle = `rgba(239,143,122,${0.6 - ((t * 1.5 + i * 0.5) % 1) * 0.6})`;
      c.lineWidth = 2;
      rr(
        c,
        -w / 2 - 4 - ((t * 1.5 + i * 0.5) % 1) * 14,
        -h * 1.05 - 4 - ((t * 1.5 + i * 0.5) % 1) * 14,
        w + 8 + ((t * 1.5 + i * 0.5) % 1) * 28,
        h + 8 + ((t * 1.5 + i * 0.5) % 1) * 28,
        14
      );
      c.stroke();
    }
  } else {
    // a few app tiles
    const cols = ['#ef8f7a', '#a5c48e', '#e9b45c'];
    for (let i = 0; i < 3; i++) {
      rr(c, -w * 0.32 + i * w * 0.23, -h * 0.72, w * 0.18, w * 0.18, 4);
      c.fillStyle = cols[i];
      c.fill();
    }
  }
  if (badge > 0) {
    c.beginPath();
    c.arc(w * 0.45, -h * 1.02, 11, 0, Math.PI * 2);
    c.fillStyle = '#d9573f';
    c.fill();
    text(c, String(badge), w * 0.45, -h * 1.02, 13, '#fff', { weight: 700 });
  }
  c.restore();
}

/** takeout box waiting on the shelf by the door */
export function drawDoorBox(c: Ctx, x: number, y: number, w: number, full: boolean) {
  // small wooden shelf
  woodGrain(c, x - w * 0.7, y, w * 1.4, 8, '#9a6a44', 61);
  c.fillStyle = '#7a5236';
  c.fillRect(x - w * 0.6, y + 8, 6, 30);
  c.fillRect(x + w * 0.6 - 6, y + 8, 6, 30);
  if (!full) {
    // an empty paper bag folded flat
    rr(c, x - w * 0.35, y - 6, w * 0.7, 6, 2);
    c.fillStyle = '#d9b48a';
    c.fill();
    return;
  }
  rr(c, x - w * 0.45, y - w * 0.62, w * 0.9, w * 0.62, 4);
  c.fillStyle = lin(c, 0, y - w * 0.6, 0, y, [
    [0, '#e2c08e'],
    [1, '#c9a06c'],
  ]);
  c.fill();
  c.fillStyle = '#d9573f';
  c.fillRect(x - w * 0.06, y - w * 0.62, w * 0.12, w * 0.62);
  text(c, '波', x, y - w * 0.3, w * 0.28, '#6e4b32', { font: 'brush', weight: 700 });
}

export const _unused = tx;
