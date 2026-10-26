// Reusable canvas widgets for the work table and mini-games: chips, pill buttons,
// the bamboo mat, rice layer, rolled log, gauges and timing bars.

import type { IngId } from '../game/data';
import type { MakiStyle } from '../game/plate';
import {
  type Ctx,
  contactShadow,
  darken,
  ellipse,
  lighten,
  lin,
  rgba,
  rr,
  sheen,
  sprite,
  srand,
  text,
  woodGrain,
} from './common';
import { drawIngredient, riceBed } from './food';
import { hs } from './hs';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---------- chips (canvas buttons with an ingredient picture and a translated label) ----------

export function chip(
  c: Ctx,
  id: string,
  x: number,
  y: number,
  s: number,
  label: string,
  icon: ((c: Ctx, s: number) => void) | null,
  state: 'on' | 'off' | 'dim' = 'off',
  accent = '#ef8f7a'
) {
  const w = s;
  const h = s * 0.86;
  c.save();
  c.globalAlpha = state === 'dim' ? 0.45 : 1;
  contactShadow(c, x, y + h * 0.46, w * 0.45, h * 0.08, 0.25);
  rr(c, x - w / 2, y - h / 2, w, h, 16);
  c.fillStyle = state === 'on' ? lighten(accent, 0.72) : 'rgba(255,250,240,0.96)';
  c.fill();
  c.strokeStyle = state === 'on' ? accent : rgba('#8a6040', 0.35);
  c.lineWidth = state === 'on' ? 3.5 : 1.5;
  c.stroke();
  if (icon) {
    c.save();
    c.translate(x, y - h * 0.1);
    icon(c, s);
    c.restore();
  }
  text(c, label, x, y + h * 0.33, Math.max(12, s * 0.14), '#4a3326', { weight: 700, maxW: w - 10 });
  c.restore();
  if (state !== 'dim') hs(id, x - w / 2, y - h / 2, w, h);
}

export function pillBtn(
  c: Ctx,
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  on: boolean,
  accent = '#ef8f7a'
) {
  rr(c, x - w / 2, y - h / 2, w, h, h / 2);
  c.fillStyle = on ? accent : 'rgba(255,250,240,0.96)';
  c.fill();
  c.strokeStyle = on ? darken(accent, 0.15) : rgba('#8a6040', 0.35);
  c.lineWidth = 1.5;
  c.stroke();
  text(c, label, x, y, Math.min(17, h * 0.42), on ? '#fff' : '#4a3326', {
    weight: 700,
    maxW: w - 12,
  });
  hs(id, x - w / 2, y - h / 2, w, h);
}

export const icon = (i: IngId) => (c: Ctx, s: number) => drawIngredient(c, i, s * 0.6, 3, 'done');

// ---------- board drawing ----------

export function cuttingBoard(c: Ctx, b: Box) {
  sprite(
    c,
    `cboard:${Math.round(b.w)}`,
    b.w + 40,
    b.h + 40,
    20,
    20,
    (cc) => {
      contactShadow(cc, b.w / 2, b.h + 6, b.w * 0.55, 16, 0.35);
      rr(cc, 0, 8, b.w, b.h, 14);
      cc.fillStyle = '#b98a5e';
      cc.fill();
      rr(cc, 0, 0, b.w, b.h, 14);
      cc.save();
      cc.clip();
      woodGrain(cc, 0, 0, b.w, b.h, '#f0d6ae', 91, { strength: 0.7 });
      // knife marks
      const r = srand(4);
      cc.strokeStyle = 'rgba(150,110,70,0.18)';
      cc.lineWidth = 0.8;
      for (let i = 0; i < 26; i++) {
        const x = r() * b.w;
        const y = r() * b.h;
        cc.beginPath();
        cc.moveTo(x, y);
        cc.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 6);
        cc.stroke();
      }
      cc.restore();
    },
    b.x,
    b.y
  );
}

export function makisu(c: Ctx, x: number, y: number, w: number, h: number, rolledFrom = 1) {
  // bamboo mat: horizontal slats, the part below `rolledFrom` (0..1 from top) is rolled away
  const vis = h * rolledFrom;
  c.save();
  rr(c, x, y, w, vis, 4);
  c.clip();
  const slat = 9;
  for (let yy = 0; yy < vis; yy += slat) {
    c.fillStyle = lin(c, 0, y + yy, 0, y + yy + slat, [
      [0, '#e9d3a2'],
      [0.6, '#d6b77e'],
      [1, '#b8935a'],
    ]);
    c.fillRect(x, y + yy, w, slat - 1);
  }
  c.strokeStyle = 'rgba(120,80,40,0.5)';
  c.lineWidth = 1;
  for (const fx of [0.2, 0.5, 0.8]) {
    c.beginPath();
    c.moveTo(x + w * fx, y);
    c.lineTo(x + w * fx, y + vis);
    c.stroke();
  }
  c.restore();
}

export function noriSheet(c: Ctx, x: number, y: number, w: number, h: number) {
  rr(c, x, y, w, h, 3);
  c.save();
  c.clip();
  c.fillStyle = lin(c, x, y, x + w, y + h, [
    [0, '#3c4a38'],
    [1, '#232b20'],
  ]);
  c.fillRect(x, y, w, h);
  const r = srand(17);
  for (let i = 0; i < (w * h) / 60; i++) {
    c.strokeStyle = rgba(r() < 0.5 ? '#5d7050' : '#151a13', 0.3);
    c.lineWidth = 0.6;
    const px = x + r() * w;
    const py = y + r() * h;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px + (r() - 0.5) * 10, py + (r() - 0.5) * 4);
    c.stroke();
  }
  c.restore();
}

/** rice layer covering part of the sheet; amount 0..RICE_MAX */
export function riceLayer(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  amount: number,
  seed: number
) {
  const cover = Math.min(1, amount / 1.0);
  if (cover <= 0.02) return;
  const ch = h * cover;
  const key = `ricelayer:${Math.round(w)}:${Math.round(ch)}:${amount > 1.02 ? 1 : 0}`;
  sprite(
    c,
    key,
    w + 20,
    ch + 20,
    10,
    10,
    (cc) => {
      cc.save();
      rr(cc, 0, 0, w, ch, 6);
      cc.clip();
      riceBed(cc, w / 2, ch / 2, w * 0.62, ch * 0.75, seed, 1.2, 7);
      cc.restore();
      if (amount > 1.02) {
        // too much: lumpy pile
        riceBed(cc, w * 0.5, ch * 0.5, w * 0.25, ch * 0.25, seed + 3, 1, 7);
      }
    },
    x,
    y + h - ch
  );
}

export function verticalGauge(
  c: Ctx,
  x: number,
  y: number,
  h: number,
  v: number,
  max: number,
  zones: [number, number, string, string][]
) {
  const w = 30;
  rr(c, x - w / 2 - 6, y - 6, w + 12, h + 12, 14);
  c.fillStyle = 'rgba(255,250,240,0.96)';
  c.fill();
  for (const [a, b, col, label] of zones) {
    const y0 = y + h - (b / max) * h;
    const y1 = y + h - (a / max) * h;
    c.fillStyle = col;
    c.fillRect(x - w / 2, y0, w, y1 - y0);
    text(c, label, x + w / 2 + 10, (y0 + y1) / 2, 14, '#4a3326', { align: 'left', weight: 700 });
  }
  const fy = y + h - (Math.min(v, max) / max) * h;
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.fillRect(x - w / 2, fy, w, y + h - fy);
  c.fillStyle = '#4a3326';
  rr(c, x - w / 2 - 8, fy - 3, w + 16, 6, 3);
  c.fill();
}

export function timingBar(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  pos: number,
  zones: { a: number; b: number; col: string; label?: string }[]
) {
  const h = 26;
  rr(c, x - 6, y - 6, w + 12, h + 12, 14);
  c.fillStyle = 'rgba(255,250,240,0.96)';
  c.fill();
  for (const z of zones) {
    c.fillStyle = z.col;
    c.fillRect(x + z.a * w, y, (z.b - z.a) * w, h);
    if (z.label)
      text(c, z.label, x + ((z.a + z.b) / 2) * w, y + h + 16, 14, '#4a3326', { weight: 700 });
  }
  const mx = x + pos * w;
  c.fillStyle = '#4a3326';
  c.beginPath();
  c.moveTo(mx - 8, y - 12);
  c.lineTo(mx + 8, y - 12);
  c.lineTo(mx, y - 2);
  c.fill();
  c.fillRect(mx - 2, y - 2, 4, h + 4);
}

export function rollLog(
  c: Ctx,
  x: number,
  y: number,
  len: number,
  d: number,
  style: MakiStyle,
  coat?: IngId,
  loose?: boolean
) {
  contactShadow(c, x, y + d * 0.5, len * 0.55, d * 0.16, 0.35);
  rr(c, x - len / 2, y - d / 2, len, d, d / 2);
  if (style === 'ura') {
    c.fillStyle = lin(c, 0, y - d / 2, 0, y + d / 2, [
      [0, '#fffaf0'],
      [1, '#d9c9ad'],
    ]);
    c.fill();
    const r = srand(8);
    for (let i = 0; i < len / 3; i++) {
      const px = x - len / 2 + r() * len;
      const py = y - d / 2 + r() * d;
      if (coat === 'tobiko') {
        c.beginPath();
        c.arc(px, py, 2, 0, Math.PI * 2);
        c.fillStyle = '#ff8a2a';
        c.fill();
      } else if (coat === 'sesame') {
        ellipse(c, px, py, 2, 1, r() * 3);
        c.fillStyle = r() < 0.3 ? '#3a2e28' : '#f1dcae';
        c.fill();
      } else {
        ellipse(c, px, py, 2.6, 1.4, r() * 3);
        c.fillStyle = '#fffdf6';
        c.fill();
      }
    }
  } else {
    c.save();
    c.clip();
    noriSheet(c, x - len / 2, y - d / 2, len, d);
    c.restore();
  }
  sheen(c, x, y - d * 0.25, len * 0.4, d * 0.1, 0.22);
  if (loose) {
    c.strokeStyle = 'rgba(255,253,246,0.9)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - len * 0.3, y + d * 0.3);
    c.quadraticCurveTo(x, y + d * 0.55, x + len * 0.25, y + d * 0.35);
    c.stroke();
  }
  // cut faces at the ends
  for (const s of [-1, 1]) {
    ellipse(c, x + s * len * 0.5 - s * d * 0.1, y, d * 0.18, d * 0.48);
    c.fillStyle = style === 'ura' ? '#f3ead9' : '#2f3a2c';
    c.fill();
    ellipse(c, x + s * len * 0.5 - s * d * 0.1, y, d * 0.13, d * 0.38);
    c.fillStyle = '#fbf6ec';
    c.fill();
  }
}

export function knife(c: Ctx, x: number, y: number) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(-3, 0);
  c.lineTo(3, 0);
  c.lineTo(2, 46);
  c.lineTo(-4, 40);
  c.closePath();
  c.fillStyle = lin(c, -4, 0, 4, 0, [
    [0, '#e8eef2'],
    [0.5, '#ffffff'],
    [1, '#aab4bc'],
  ]);
  c.fill();
  rr(c, -4, -36, 8, 36, 3);
  c.fillStyle = '#6e4b32';
  c.fill();
  c.restore();
}
