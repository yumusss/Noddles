// The prep counter: plate in the middle, only unlocked ingredient tubs around it,
// a plate rack and a bin. Layout is computed from the screen size every time.

import { ING, type IngId, type PlateId } from '../game/data';
import { tx, t as tt } from '../game/i18n';
import type { Piece } from '../game/plate';
import { RICE_MAX, type Session } from '../game/session';
import {
  type Ctx,
  contactShadow,
  darken,
  ellipse,
  lighten,
  lin,
  rad,
  rgba,
  rr,
  sheen,
  sprite,
  srand,
  text,
  woodGrain,
  speckle,
  back,
} from './common';
import { drawIngredient, drawPiece, drawPlate, drawPlateMini } from './food';
import { hs, hsCircle, hsOrigin } from './hs';

export interface PrepLayout {
  plate: { x: number; y: number; u: number };
  tubs: { ing: IngId; x: number; y: number; s: number }[];
  rack: { id: PlateId; x: number; y: number; s: number }[];
  trash: { x: number; y: number; s: number };
  float: { x: number; y: number };
}

/**
 * Space kept free (in logical units) for the HUD + paper ticket on top and the serve button below.
 * Set by the view from real CSS sizes, so on small phones nothing on the counter hides under the ticket.
 */
export const RESERVE = { top: 150, bottom: 112 };
export function setReserves(top: number, bottom: number) {
  RESERVE.top = Math.round(top);
  RESERVE.bottom = Math.round(bottom);
}

export function prepLayout(
  W: number,
  H: number,
  portrait: boolean,
  tubs: IngId[],
  plates: PlateId[]
): PrepLayout {
  const top = RESERVE.top;
  const bottom = RESERVE.bottom;
  const N = tubs.length;
  const rackSz = 64;
  const rack = (y: number) =>
    plates.length > 1
      ? plates.map((id, i) => ({ id, x: 24 + rackSz / 2 + i * (rackSz + 10), y, s: rackSz }))
      : [];
  if (!portrait) {
    const availH = H - top - bottom;
    let u = Math.min(W * 0.4, availH * 1.45, 560);
    let T = 128;
    let rows = 0;
    let perSide = 0;
    for (;;) {
      rows = Math.max(1, Math.floor(availH / (T * 1.12)));
      perSide = Math.ceil(N / 2 / rows);
      const need = u + perSide * 2 * T * 1.1 + 40;
      if (need <= W || T <= 74) {
        if (need > W) u = Math.max(300, W - perSide * 2 * T * 1.1 - 40);
        break;
      }
      T -= 4;
    }
    const px = W / 2;
    const py = top + availH / 2;
    const left = tubs.slice(0, Math.ceil(N / 2));
    const right = tubs.slice(Math.ceil(N / 2));
    const out: PrepLayout['tubs'] = [];
    const place = (list: IngId[], side: -1 | 1) => {
      for (let col = 0; col < perSide; col++) {
        const items = list.slice(col * rows, col * rows + rows);
        const colH = items.length * T * 1.12;
        const x = px + side * (u / 2 + 24 + T * 0.55 + col * T * 1.1);
        items.forEach((ing, i) =>
          out.push({ ing, x, y: py - colH / 2 + T * 0.56 + i * T * 1.12, s: T })
        );
      }
    };
    place(left, -1);
    place(right, 1);
    return {
      plate: { x: px, y: py, u },
      tubs: out,
      rack: rack(H - bottom / 2 - 6),
      trash: { x: W - 62, y: H - bottom / 2 - 4, s: 74 },
      float: { x: px - u * 0.34, y: py - u * 0.36 },
    };
  }
  // portrait: plate on top, tubs in a centered grid below; the block is centred vertically
  const availH = H - top - bottom - 20;
  let u = Math.min(W * 0.88, 620);
  let best: { cols: number; T: number; rows: number } | null = null;
  for (let tries = 0; tries < 12 && !best; tries++) {
    for (let cols = 3; cols <= 5; cols++) {
      const T = Math.min(200, (W - 40) / cols / 1.1);
      const rows = Math.ceil(N / cols);
      if (u * 0.6 + 40 + rows * T * 1.16 <= availH) {
        best = { cols, T, rows };
        break;
      }
    }
    if (!best) u *= 0.92;
  }
  const { cols, T, rows } = best ?? { cols: 5, T: (W - 40) / 5 / 1.1, rows: Math.ceil(N / 5) };
  const plateH = u * 0.6;
  const blockH = plateH + 40 + rows * T * 1.16;
  const y0 = top + 10 + Math.max(0, (availH - blockH) / 2);
  const py = y0 + plateH / 2;
  const gridTop = py + plateH / 2 + 40;
  const out: PrepLayout['tubs'] = [];
  for (let r = 0; r < rows; r++) {
    const items = tubs.slice(r * cols, r * cols + cols);
    const rowW = items.length * T * 1.1;
    items.forEach((ing, i) =>
      out.push({
        ing,
        x: W / 2 - rowW / 2 + T * 0.55 + i * T * 1.1,
        y: gridTop + T * 0.52 + r * T * 1.16,
        s: T,
      })
    );
  }
  return {
    plate: { x: W / 2, y: py, u },
    tubs: out,
    rack: rack(H - bottom / 2 - 6),
    trash: { x: W - 62, y: H - bottom / 2 - 4, s: 74 },
    float: { x: W / 2 - u * 0.36, y: py - plateH * 0.62 },
  };
}

// ---------- background ----------

export function drawPrepBg(c: Ctx, ox: number, W0: number, H: number) {
  const W = W0 + 4;
  sprite(
    c,
    `prepbg:${W}x${H}`,
    W,
    H,
    0,
    0,
    (cc) => {
      // tiled back wall strip behind the ticket rail
      const wallH = 118;
      cc.fillStyle = '#e9ddc8';
      cc.fillRect(0, 0, W, wallH);
      const s = 30;
      for (let y = 0; y < wallH; y += s)
        for (let x = -((y / s) % 2) * (s / 2); x < W; x += s) {
          rr(cc, x + 1.5, y + 1.5, s - 3, s - 3, 4);
          cc.fillStyle = (Math.floor(x / s) + y / s) % 3 === 0 ? '#e2efe9' : '#f2ece0';
          cc.fill();
        }
      woodGrain(cc, 0, wallH - 12, W, 14, '#8a6040', 4);
      // big hinoki counter
      woodGrain(cc, 0, wallH, W, H - wallH, '#ecd3ad', 71, { planks: 4, strength: 0.9 });
      cc.fillStyle = lin(cc, 0, wallH, 0, H, [
        [0, 'rgba(255,255,255,0.12)'],
        [1, 'rgba(120,70,30,0.12)'],
      ]);
      cc.fillRect(0, wallH, W, H - wallH);
      cc.fillStyle = 'rgba(60,35,20,0.28)';
      cc.fillRect(0, wallH, W, 6);
    },
    ox - 2,
    0
  );
}

// ---------- tubs ----------

function tubBody(c: Ctx, ing: IngId, s: number, lang: string) {
  const role = ING[ing].roles;
  const w = s;
  const h = s * 0.74;
  contactShadow(c, 0, h * 0.42, w * 0.56, h * 0.14, 0.32);
  if (ing === 'rice') {
    // hangiri: round wooden tub with copper bands
    ellipse(c, 0, h * 0.2, w * 0.5, h * 0.3);
    c.fillStyle = '#b98a5e';
    c.fill();
    c.fillStyle = lin(c, -w / 2, 0, w / 2, 0, [
      [0, '#c99a6b'],
      [0.5, '#e7c597'],
      [1, '#b9895a'],
    ]);
    c.fillRect(-w * 0.5, -h * 0.12, w, h * 0.32);
    ellipse(c, 0, h * 0.2, w * 0.5, h * 0.3);
    c.fill();
    c.strokeStyle = '#b5703a';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(0, h * 0.05, w * 0.5, h * 0.3, 0, 0, Math.PI);
    c.stroke();
    ellipse(c, 0, -h * 0.12, w * 0.5, h * 0.28);
    c.fillStyle = '#d9b48a';
    c.fill();
    ellipse(c, 0, -h * 0.12, w * 0.44, h * 0.23);
    c.fillStyle = '#a87a50';
    c.fill();
    c.save();
    c.translate(0, -h * 0.13);
    drawIngredient(c, 'rice', s * 0.95, 5);
    c.restore();
  } else if (role.includes('side') || role.includes('topping')) {
    // round ceramic bowl
    const col =
      ing === 'wasabi' || ing === 'scallion' ? '#e9e4da' : ing === 'tobiko' ? '#3d4770' : '#f4efe3';
    ellipse(c, 0, h * 0.12, w * 0.44, h * 0.32);
    c.fillStyle = darken(col, 0.12);
    c.fill();
    c.fillStyle = lin(c, -w / 2, 0, w / 2, 0, [
      [0, darken(col, 0.05)],
      [0.4, lighten(col, 0.1)],
      [1, darken(col, 0.15)],
    ]);
    c.beginPath();
    c.ellipse(0, -h * 0.08, w * 0.44, h * 0.22, 0, 0, Math.PI);
    c.lineTo(w * 0.36, h * 0.22);
    c.quadraticCurveTo(0, h * 0.4, -w * 0.36, h * 0.22);
    c.closePath();
    c.fill();
    ellipse(c, 0, -h * 0.08, w * 0.44, h * 0.22);
    c.fillStyle = darken(col, 0.06);
    c.fill();
    ellipse(c, 0, -h * 0.08, w * 0.39, h * 0.18);
    c.fillStyle = darken(col, 0.18);
    c.fill();
    if (ing !== 'tobiko') {
      c.strokeStyle = rgba('#56638c', 0.7);
      c.lineWidth = 1.6;
      c.beginPath();
      c.ellipse(0, h * 0.05, w * 0.42, h * 0.2, 0, 0.3, Math.PI - 0.3);
      c.stroke();
    }
    c.save();
    c.translate(0, -h * 0.1);
    if (ing === 'soy') {
      c.translate(0, -h * 0.05);
      drawIngredient(c, 'soy', s * 0.62, 3);
    } else drawIngredient(c, ing, s * 0.72, 3);
    c.restore();
  } else {
    // hinoki masu box
    const bw = w * 0.86;
    const bh = h * 0.6;
    rr(c, -bw / 2, -bh / 2 + 6, bw, bh, 6);
    c.fillStyle = '#b9895a';
    c.fill();
    rr(c, -bw / 2, -bh / 2, bw, bh, 6);
    c.save();
    c.clip();
    woodGrain(c, -bw / 2, -bh / 2, bw, bh, '#e2bb8a', ing.length * 7, { strength: 0.8 });
    c.restore();
    rr(c, -bw / 2 + 6, -bh / 2 + 5, bw - 12, bh - 12, 4);
    c.fillStyle = '#c9a070';
    c.fill();
    rr(c, -bw / 2 + 8, -bh / 2 + 7, bw - 16, bh - 16, 3);
    c.fillStyle = lin(c, 0, -bh / 2, 0, bh / 2, [
      [0, '#f3ead9'],
      [1, '#e6dac4'],
    ]);
    c.fill();
    c.save();
    c.translate(0, -2);
    drawIngredient(c, ing, s * 0.66, 2, 'done');
    c.restore();
  }
  // name tag
  const label = tx(ING[ing].name).replace(/ \(.*\)/, '');
  const tw = Math.min(w * 1.04, Math.max(w * 0.6, label.length * s * 0.085 + 16));
  rr(c, -tw / 2, h * 0.36, tw, s * 0.2, 6);
  c.fillStyle = 'rgba(255,250,240,0.94)';
  c.fill();
  c.strokeStyle = rgba('#8a6040', 0.35);
  c.lineWidth = 1;
  c.stroke();
  text(c, label, 0, h * 0.36 + s * 0.1, Math.max(12, s * 0.125), '#4a3326', {
    weight: 600,
    maxW: tw - 8,
  });
  void lang;
}

export function drawTub(
  c: Ctx,
  ing: IngId,
  x: number,
  y: number,
  s: number,
  lang: string,
  sel: boolean,
  t: number,
  stock?: number
) {
  const lift = sel ? -6 - Math.sin(t * 5) * 2 : 0;
  if (sel) {
    rr(c, x - s * 0.56, y - s * 0.5 + lift, s * 1.12, s * 1.0, 18);
    c.fillStyle = 'rgba(239,143,122,0.16)';
    c.fill();
    c.strokeStyle = '#ef8f7a';
    c.lineWidth = 3.5;
    c.stroke();
  }
  sprite(
    c,
    `tub:${ing}:${Math.round(s)}:${lang}`,
    s * 1.3,
    s * 1.1,
    s * 0.65,
    s * 0.5,
    (cc) => tubBody(cc, ing, s, lang),
    x,
    y + lift
  );
  if (stock !== undefined) {
    c.beginPath();
    c.arc(x + s * 0.4, y - s * 0.32 + lift, 13, 0, Math.PI * 2);
    c.fillStyle = stock > 0 ? '#6e8f5e' : '#c9b8a6';
    c.fill();
    text(c, String(stock), x + s * 0.4, y - s * 0.32 + lift, 14, '#fff', { weight: 700 });
  }
}

// ---------- plate with pieces ----------

export function drawPlateWithPieces(
  c: Ctx,
  id: PlateId,
  pieces: Piece[],
  x: number,
  y: number,
  u: number,
  now: number
) {
  c.save();
  c.translate(x, y);
  drawPlate(c, id, u);
  // draw back to front
  const sorted = [...pieces].sort((a, b) => a.y - b.y);
  for (const p of sorted) {
    const age = now - p.born;
    const k = age < 0.25 ? back(age / 0.25) : 1;
    c.save();
    c.translate(p.x * u, p.y * u - (1 - k) * 14);
    c.rotate(p.rot);
    if (k < 1) c.scale(0.85 + k * 0.15, 0.85 + k * 0.15);
    drawPiece(c, u, p, p.uid);
    c.restore();
  }
  c.restore();
}

// ---------- rack and bin ----------

export function drawRack(c: Ctx, L: PrepLayout, current: PlateId, lang: string, disabled: boolean) {
  if (!L.rack.length) return;
  const x0 = L.rack[0].x - L.rack[0].s / 2 - 10;
  const x1 = L.rack[L.rack.length - 1].x + L.rack[0].s / 2 + 10;
  const y = L.rack[0].y;
  woodGrain(c, x0, y + 18, x1 - x0, 12, '#9a6a44', 8);
  for (const r of L.rack) {
    const on = r.id === current;
    c.save();
    c.globalAlpha = disabled ? 0.45 : 1;
    if (on) {
      rr(c, r.x - r.s / 2 - 4, y - r.s / 2 - 2, r.s + 8, r.s + 4, 10);
      c.fillStyle = 'rgba(239,143,122,0.18)';
      c.fill();
      c.strokeStyle = '#ef8f7a';
      c.lineWidth = 3;
      c.stroke();
    }
    c.translate(r.x, y);
    drawPlateMini(c, r.id, r.s * 0.9);
    c.restore();
    if (!disabled) hs('rack:' + r.id, r.x - r.s / 2, y - r.s / 2, r.s, r.s);
  }
  void lang;
}

export function drawTrash(c: Ctx, x: number, y: number, s: number, hot: boolean) {
  contactShadow(c, x, y + s * 0.42, s * 0.42, s * 0.1, 0.3);
  c.save();
  c.translate(x, y);
  // bamboo basket bin
  c.beginPath();
  c.moveTo(-s * 0.38, -s * 0.3);
  c.lineTo(s * 0.38, -s * 0.3);
  c.lineTo(s * 0.3, s * 0.42);
  c.lineTo(-s * 0.3, s * 0.42);
  c.closePath();
  c.fillStyle = lin(c, -s / 2, 0, s / 2, 0, [
    [0, '#a87a50'],
    [0.5, '#d9b48a'],
    [1, '#9a6a44'],
  ]);
  c.fill();
  c.strokeStyle = rgba('#6e4b32', 0.5);
  c.lineWidth = 1;
  for (let i = 1; i < 6; i++) {
    c.beginPath();
    c.moveTo(-s * 0.38 + i * s * 0.02, -s * 0.3 + i * s * 0.12);
    c.lineTo(s * 0.38 - i * s * 0.02, -s * 0.3 + i * s * 0.12);
    c.stroke();
  }
  ellipse(c, 0, -s * 0.3, s * 0.4, s * 0.1);
  c.fillStyle = hot ? '#ef8f7a' : '#6e4b32';
  c.fill();
  ellipse(c, 0, -s * 0.3, s * 0.34, s * 0.07);
  c.fillStyle = '#3a2a22';
  c.fill();
  c.restore();
  hs('trash', x - s / 2, y - s / 2, s, s);
}

/** rice squeeze gauge: a horizontal bar under the plate with the rice ball growing beside it */
export function drawSqueezeGauge(c: Ctx, x: number, y: number, a: number, lang: string) {
  const w = 300;
  const h = 26;
  const gx = x - w / 2 + 40;
  c.save();
  rr(c, gx - 96, y - 36, w + 120, 74, 22);
  c.fillStyle = 'rgba(255,250,240,0.96)';
  c.fill();
  c.strokeStyle = rgba('#8a6040', 0.35);
  c.lineWidth = 1.5;
  c.stroke();
  // the rice ball being shaped
  c.save();
  c.translate(gx - 50, y + 4);
  const k = 0.5 + Math.min(a, RICE_MAX) * 0.45;
  c.scale(k, k);
  drawPiece(
    c,
    300,
    { kind: 'nigiri', rice: a < 0.62 ? 'less' : a <= 1.02 ? 'just' : 'more', tops: [] },
    3
  );
  c.restore();
  const zone = (a0: number, a1: number, col: string, label: string) => {
    const x0 = gx + (a0 / RICE_MAX) * w;
    const x1 = gx + (a1 / RICE_MAX) * w;
    c.fillStyle = col;
    c.fillRect(x0, y - h / 2 - 4, x1 - x0, h);
    text(c, label, (x0 + x1) / 2, y + h / 2 + 8, 14, '#4a3326', { weight: 700 });
  };
  zone(0, 0.62, '#f3e0c0', tt('gLess'));
  zone(0.62, 1.02, '#b9d99a', tt('gJust'));
  zone(1.02, RICE_MAX, '#f2b3a3', tt('gMore'));
  const fx = gx + (Math.min(a, RICE_MAX) / RICE_MAX) * w;
  c.fillStyle = 'rgba(255,255,255,0.45)';
  c.fillRect(fx, y - h / 2 - 4, gx + w - fx, h);
  c.fillStyle = '#4a3326';
  rr(c, fx - 3, y - h / 2 - 10, 6, h + 12, 3);
  c.fill();
  c.restore();
  void lang;
}

/** the selected thing floats beside the plate */
export function drawFloating(c: Ctx, s: Session, x: number, y: number, u: number, t: number) {
  const h = s.hand;
  if (!h || h.k === 'plate') return;
  const bob = Math.sin(t * 3) * 5;
  hsCircle('hand:drop', x - 52, y - 40, 22);
  c.save();
  c.translate(x, y + bob);
  rr(c, -58, -46, 116, 92, 22);
  c.fillStyle = 'rgba(255,250,240,0.82)';
  c.fill();
  c.strokeStyle = 'rgba(239,143,122,0.8)';
  c.lineWidth = 2.5;
  c.setLineDash([6, 5]);
  c.stroke();
  c.setLineDash([]);
  if (h.k === 'rice') drawPiece(c, u * 0.9, { kind: 'nigiri', rice: h.q, tops: [] }, 1);
  else if (h.k === 'batch' && h.pieces[0]) {
    drawPiece(c, u * 0.85, { ...h.pieces[0], tops: [] }, 2);
    c.beginPath();
    c.arc(42, -34, 15, 0, Math.PI * 2);
    c.fillStyle = '#ef8f7a';
    c.fill();
    text(c, String(h.pieces.length), 42, -34, 15, '#fff', { weight: 700 });
  } else if (h.k === 'tub') drawIngredient(c, h.ing, 70, 4, 'done');
  // little ✕ to put it back
  c.beginPath();
  c.arc(-52, -40, 16, 0, Math.PI * 2);
  c.fillStyle = '#fff6e9';
  c.fill();
  c.strokeStyle = '#8a6040';
  c.lineWidth = 1.5;
  c.stroke();
  text(c, '✕', -52, -40, 16, '#8a3b2a', { weight: 700 });
  c.restore();
}

export function drawPrep(
  c: Ctx,
  s: Session,
  ox: number,
  W: number,
  H: number,
  portrait: boolean,
  t: number,
  lang: string
) {
  drawPrepBg(c, ox, W, H);
  const L = prepLayout(W, H, portrait, s.prepTubs(), s.activeOnline ? [] : s.plates);
  c.save();
  c.translate(ox, 0);
  hsOrigin(ox);
  // plate
  const P = L.plate;
  const lifted = s.hand?.k === 'plate';
  if (lifted) {
    c.save();
    c.translate(0, -16 + Math.sin(t * 4) * 3);
  }
  drawPlateWithPieces(c, s.plate.id, s.plate.pieces, P.x, P.y, P.u, s.t);
  if (lifted) c.restore();
  // hotspot over the plate (a little larger than the plate so edge taps get pulled in)
  hs('plate', P.x - P.u * 0.62, P.y - P.u * 0.38, P.u * 1.24, P.u * 0.76);
  // tubs
  for (const tb of L.tubs) {
    const sel = s.hand?.k === 'tub' && s.hand.ing === tb.ing;
    const stock = ING[tb.ing].cookedFrom ? s.stock(tb.ing) : undefined;
    drawTub(
      c,
      tb.ing,
      tb.x,
      tb.y,
      tb.s,
      lang,
      sel || (tb.ing === 'rice' && (s.squeeze.on || s.hand?.k === 'rice')),
      t,
      stock
    );
    hs(
      'tub:' + tb.ing,
      tb.x - tb.s * 0.55,
      tb.y - tb.s * 0.5,
      tb.s * 1.1,
      tb.s * 1.02,
      tb.ing === 'rice'
    );
  }
  drawRack(c, L, s.plate.id, lang, !!s.activeOnline);
  drawTrash(c, L.trash.x, L.trash.y, L.trash.s, false);
  const rice = L.tubs.find((x) => x.ing === 'rice');
  if (rice && (s.squeeze.on || s.squeeze.a > 0)) {
    const gy = portrait
      ? P.y + P.u * 0.3 - 10
      : Math.min(H - RESERVE.bottom - 30, P.y + P.u * 0.3 + 44);
    drawSqueezeGauge(c, P.x, gy, s.squeeze.a, lang);
  }
  drawFloating(c, s, L.float.x, L.float.y, P.u, t);
  c.restore();
  hsOrigin(0);
  return L;
}

export const _x = { rad, sheen, srand, speckle };
