// The work table under the window: a walnut table with a pale hinoki board, ceramic trays of
// unlocked ingredients, the plate in the middle and a row of tools.

import { ING, type IngId, type PlateId } from '../game/data';
import { t as tt, tx } from '../game/i18n';
import type { Piece } from '../game/plate';
import { DIAL, RICE_MAX, type Session } from '../game/session';
import {
  back,
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
  text,
  woodGrain,
} from './common';
import { drawIngredient, drawPiece, drawPlate, drawPlateMini } from './food';
import { hs, hsCircle } from './hs';
import type { Layout } from './layout';

export function drawTable(c: Ctx, L: Layout) {
  sprite(
    c,
    `table:${L.W}x${L.H}`,
    L.W,
    L.work.h,
    0,
    0,
    (cc) => {
      woodGrain(cc, 0, 0, L.W, L.work.h, '#8a5a3c', 81, { planks: 5, strength: 1.1 });
      cc.fillStyle = lin(cc, 0, 0, 0, L.work.h, [
        [0, 'rgba(30,15,5,0.25)'],
        [0.15, 'rgba(30,15,5,0)'],
        [1, 'rgba(30,15,5,0.2)'],
      ]);
      cc.fillRect(0, 0, L.W, L.work.h);
      // a linen runner along the bottom for the tools
      const ry = L.work.h - 92;
      rr(cc, 8, ry, L.W - 16, 86, 14);
      cc.fillStyle = '#efe6d6';
      cc.fill();
      cc.strokeStyle = 'rgba(86,99,140,0.35)';
      cc.lineWidth = 2;
      cc.setLineDash([6, 5]);
      rr(cc, 14, ry + 6, L.W - 28, 74, 10);
      cc.stroke();
      cc.setLineDash([]);
      // an indigo linen placemat under the plate so it stands out
      const P = L.plate;
      const bw = P.u * 1.22;
      const bh = P.u * 0.8;
      const bx = P.x - bw / 2;
      const by = P.y - L.work.y - bh / 2;
      contactShadow(cc, P.x, by + bh + 2, bw * 0.55, 10, 0.3);
      rr(cc, bx, by, bw, bh, 18);
      cc.fillStyle = lin(cc, 0, by, 0, by + bh, [
        [0, '#4a5884'],
        [1, '#3a4570'],
      ]);
      cc.fill();
      cc.save();
      rr(cc, bx, by, bw, bh, 18);
      cc.clip();
      cc.strokeStyle = 'rgba(255,255,255,0.05)';
      cc.lineWidth = 1;
      for (let x = bx; x < bx + bw; x += 4) {
        cc.beginPath();
        cc.moveTo(x, by);
        cc.lineTo(x, by + bh);
        cc.stroke();
      }
      // white wave pattern border (seigaiha)
      cc.strokeStyle = 'rgba(255,250,240,0.35)';
      cc.lineWidth = 2;
      for (let x = bx + 10; x < bx + bw; x += 22)
        for (const yy of [by + 12, by + bh - 12]) {
          cc.beginPath();
          cc.arc(x, yy, 8, Math.PI, 0);
          cc.stroke();
        }
      cc.restore();
      rr(cc, bx + 6, by + 6, bw - 12, bh - 12, 14);
      cc.strokeStyle = 'rgba(255,250,240,0.25)';
      cc.setLineDash([4, 4]);
      cc.stroke();
      cc.setLineDash([]);
    },
    0,
    L.work.y
  );
}

// ---------- trays ----------

function trayBody(c: Ctx, ing: IngId, s: number) {
  const roles = ING[ing].roles;
  const w = s * 0.9;
  const h = s * 0.62;
  contactShadow(c, 0, h * 0.42, w * 0.55, h * 0.13, 0.4);
  if (ing === 'rice') {
    // hangiri: round wooden rice tub with copper bands
    ellipse(c, 0, h * 0.15, w * 0.52, h * 0.34);
    c.fillStyle = '#9a6a44';
    c.fill();
    c.fillStyle = lin(c, -w / 2, 0, w / 2, 0, [
      [0, '#b9895a'],
      [0.5, '#e7c597'],
      [1, '#a87a50'],
    ]);
    c.fillRect(-w * 0.52, -h * 0.15, w * 1.04, h * 0.3);
    ellipse(c, 0, h * 0.15, w * 0.52, h * 0.3);
    c.fill();
    c.strokeStyle = '#c47a3a';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(0, h * 0.02, w * 0.52, h * 0.3, 0, 0, Math.PI);
    c.stroke();
    ellipse(c, 0, -h * 0.15, w * 0.52, h * 0.3);
    c.fillStyle = '#d9b48a';
    c.fill();
    c.save();
    c.translate(0, -h * 0.16);
    drawIngredient(c, 'rice', s * 1.0, 5);
    c.restore();
  } else if (roles.includes('neta') && ing !== 'noriband') {
    // a slate slab with the fish laid out
    rr(c, -w / 2, -h / 2 + 5, w, h * 0.9, 8);
    c.fillStyle = '#2b2f35';
    c.fill();
    rr(c, -w / 2, -h / 2, w, h * 0.9, 8);
    c.fillStyle = lin(c, -w / 2, -h / 2, w / 2, h / 2, [
      [0, '#5b6168'],
      [1, '#3d4248'],
    ]);
    c.fill();
    // crushed ice under the fish
    for (let i = 0; i < 22; i++) {
      ellipse(
        c,
        -w * 0.4 + (((i * 37) % 100) / 100) * w * 0.8,
        -h * 0.3 + (((i * 53) % 100) / 100) * h * 0.6,
        3,
        2
      );
      c.fillStyle = 'rgba(230,242,250,0.55)';
      c.fill();
    }
    c.save();
    c.translate(0, -h * 0.05);
    drawIngredient(c, ing, s * 0.72, 2, 'done');
    c.restore();
  } else {
    // a ceramic bowl with an indigo rim
    const col = ing === 'tobiko' ? '#3d4770' : '#f4efe3';
    ellipse(c, 0, h * 0.1, w * 0.46, h * 0.34);
    c.fillStyle = darken(col, 0.15);
    c.fill();
    c.fillStyle = lin(c, -w / 2, 0, w / 2, 0, [
      [0, darken(col, 0.05)],
      [0.4, lighten(col, 0.1)],
      [1, darken(col, 0.15)],
    ]);
    c.beginPath();
    c.ellipse(0, -h * 0.1, w * 0.46, h * 0.24, 0, 0, Math.PI);
    c.lineTo(w * 0.38, h * 0.24);
    c.quadraticCurveTo(0, h * 0.42, -w * 0.38, h * 0.24);
    c.closePath();
    c.fill();
    ellipse(c, 0, -h * 0.1, w * 0.46, h * 0.24);
    c.fillStyle = darken(col, 0.06);
    c.fill();
    ellipse(c, 0, -h * 0.1, w * 0.4, h * 0.19);
    c.fillStyle = darken(col, 0.18);
    c.fill();
    if (ing !== 'tobiko') {
      c.strokeStyle = 'rgba(86,99,140,0.75)';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(0, h * 0.06, w * 0.44, h * 0.2, 0, 0.3, Math.PI - 0.3);
      c.stroke();
    }
    c.save();
    c.translate(0, -h * 0.13);
    drawIngredient(c, ing, s * (ing === 'soy' ? 0.6 : 0.74), 3, 'done');
    c.restore();
  }
  // label
  const label = tx(ING[ing].name);
  const tw = Math.min(s * 1.0, label.length * s * 0.085 + 18);
  rr(c, -tw / 2, h * 0.36, tw, s * 0.2, 7);
  c.fillStyle = 'rgba(255,250,240,0.95)';
  c.fill();
  text(c, label, 0, h * 0.36 + s * 0.1, Math.max(11, s * 0.125), '#4a3326', {
    weight: 700,
    maxW: tw - 8,
  });
}

export function drawTrays(c: Ctx, s: Session, L: Layout, t: number, lang: string) {
  for (const tr of L.trays) {
    const sel =
      (s.hand?.k === 'tub' && s.hand.ing === tr.ing) ||
      (tr.ing === 'rice' && (s.squeeze.on || s.hand?.k === 'rice'));
    const lift = sel ? -5 - Math.sin(t * 5) * 2 : 0;
    if (sel) {
      rr(c, tr.x - tr.s * 0.5, tr.y - tr.s * 0.48 + lift, tr.s, tr.s * 0.96, 16);
      c.fillStyle = 'rgba(255,214,120,0.22)';
      c.fill();
      c.strokeStyle = '#f2c766';
      c.lineWidth = 3.5;
      c.stroke();
    }
    sprite(
      c,
      `tray:${tr.ing}:${Math.round(tr.s)}:${lang}`,
      tr.s * 1.2,
      tr.s * 1.1,
      tr.s * 0.6,
      tr.s * 0.5,
      (cc) => trayBody(cc, tr.ing, tr.s),
      tr.x,
      tr.y + lift
    );
    hs(
      'tray:' + tr.ing,
      tr.x - tr.s * 0.5,
      tr.y - tr.s * 0.48,
      tr.s,
      tr.s * 0.96,
      tr.ing === 'rice'
    );
  }
}

// ---------- plate ----------

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
  for (const p of [...pieces].sort((a, b) => a.y - b.y)) {
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

// ---------- tools row ----------

function toolBody(c: Ctx, id: 'mat' | 'knife' | 'torch', s: number) {
  if (id === 'mat') {
    // a rolled bamboo mat
    for (let i = 0; i < 9; i++) {
      rr(c, -s * 0.36, -s * 0.3 + i * s * 0.06, s * 0.72, s * 0.05, 2);
      c.fillStyle = i % 2 ? '#d6b77e' : '#e9d3a2';
      c.fill();
    }
    c.strokeStyle = 'rgba(120,80,40,0.5)';
    for (const fx of [-0.2, 0, 0.2]) {
      c.beginPath();
      c.moveTo(fx * s, -s * 0.3);
      c.lineTo(fx * s, s * 0.24);
      c.stroke();
    }
  } else if (id === 'knife') {
    c.save();
    c.rotate(-0.5);
    rr(c, -s * 0.06, -s * 0.38, s * 0.12, s * 0.5, s * 0.03);
    c.fillStyle = lin(c, -s * 0.06, 0, s * 0.06, 0, [
      [0, '#e8eef2'],
      [0.5, '#ffffff'],
      [1, '#9aa4ac'],
    ]);
    c.fill();
    rr(c, -s * 0.05, s * 0.1, s * 0.1, s * 0.26, 3);
    c.fillStyle = '#6e4b32';
    c.fill();
    c.restore();
    c.save();
    c.translate(s * 0.14, s * 0.1);
    drawIngredient(c, 'salmon', s * 0.42, 1);
    c.restore();
  } else {
    // kitchen blowtorch
    rr(c, -s * 0.14, -s * 0.12, s * 0.28, s * 0.42, s * 0.08);
    c.fillStyle = lin(c, -s * 0.14, 0, s * 0.14, 0, [
      [0, '#c23a2e'],
      [0.5, '#ef6a5a'],
      [1, '#a82f25'],
    ]);
    c.fill();
    rr(c, -s * 0.06, -s * 0.3, s * 0.12, s * 0.2, 3);
    c.fillStyle = '#3a3f4e';
    c.fill();
    rr(c, -s * 0.03, -s * 0.4, s * 0.3, s * 0.08, 3);
    c.fillStyle = '#8a8f96';
    c.fill();
    c.beginPath();
    c.moveTo(s * 0.28, -s * 0.36);
    c.quadraticCurveTo(s * 0.42, -s * 0.44, s * 0.46, -s * 0.36);
    c.quadraticCurveTo(s * 0.42, -s * 0.3, s * 0.28, -s * 0.36);
    c.fillStyle = '#5aa8f0';
    c.fill();
  }
}

export function drawTools(c: Ctx, s: Session, L: Layout, t: number, lang: string) {
  for (const tl of L.tools) {
    const on =
      (tl.id === 'torch' && s.hand?.k === 'torch') ||
      (tl.id === 'mat' && s.board.m === 'maki') ||
      (tl.id === 'knife' && (s.board.m === 'sashimi' || s.board.m === 'pick'));
    rr(c, tl.x - tl.s / 2, tl.y - tl.s / 2, tl.s, tl.s, 16);
    c.fillStyle = on ? '#fff3cf' : '#fffaf2';
    c.fill();
    c.strokeStyle = on ? '#f2c766' : 'rgba(110,75,50,0.25)';
    c.lineWidth = on ? 3 : 1.5;
    c.stroke();
    sprite(
      c,
      `tool:${tl.id}:${tl.s}`,
      tl.s,
      tl.s,
      tl.s / 2,
      tl.s / 2,
      (cc) => toolBody(cc, tl.id, tl.s * 0.9),
      tl.x,
      tl.y - tl.s * 0.1
    );
    const label =
      tl.id === 'mat' ? tt('toolMat') : tl.id === 'knife' ? tt('toolKnife') : tt('toolTorch');
    text(c, label, tl.x, tl.y + tl.s * 0.36, 12, '#4a3326', { weight: 700, maxW: tl.s - 6 });
    hs('tool:' + tl.id, tl.x - tl.s / 2, tl.y - tl.s / 2, tl.s, tl.s);
  }
  // plate rack
  for (const r of L.rack) {
    const cur = s.plate.id === r.id;
    c.save();
    c.globalAlpha = s.activeOnline ? 0.4 : 1;
    if (cur) {
      rr(c, r.x - r.s / 2 - 3, r.y - r.s / 2 - 3, r.s + 6, r.s + 6, 12);
      c.fillStyle = '#fff3cf';
      c.fill();
      c.strokeStyle = '#f2c766';
      c.lineWidth = 3;
      c.stroke();
    }
    c.translate(r.x, r.y);
    drawPlateMini(c, r.id, r.s * 0.9);
    c.restore();
    if (!s.activeOnline) hs('rack:' + r.id, r.x - r.s / 2, r.y - r.s / 2, r.s, r.s);
  }
  // bin
  const T = L.trash;
  c.save();
  c.translate(T.x, T.y);
  c.beginPath();
  c.moveTo(-T.s * 0.32, -T.s * 0.28);
  c.lineTo(T.s * 0.32, -T.s * 0.28);
  c.lineTo(T.s * 0.26, T.s * 0.36);
  c.lineTo(-T.s * 0.26, T.s * 0.36);
  c.closePath();
  c.fillStyle = lin(c, -T.s / 2, 0, T.s / 2, 0, [
    [0, '#7d8a96'],
    [0.5, '#b9c3cc'],
    [1, '#6e7a86'],
  ]);
  c.fill();
  ellipse(c, 0, -T.s * 0.28, T.s * 0.34, T.s * 0.08);
  c.fillStyle = '#3a3f4e';
  c.fill();
  c.restore();
  text(c, tt('toolTrash'), T.x, T.y + T.s * 0.5, 12, '#f4efe3', { weight: 700 });
  hs('trash', T.x - T.s / 2, T.y - T.s / 2, T.s, T.s);
  void t;
  void lang;
}

// ---------- gauges & hand ----------

export function drawSqueezeGauge(c: Ctx, x: number, y: number, a: number) {
  const w = 280;
  const h = 24;
  const gx = x - w / 2 + 36;
  rr(c, gx - 86, y - 34, w + 110, 70, 22);
  c.fillStyle = 'rgba(255,250,240,0.97)';
  c.fill();
  c.save();
  c.translate(gx - 44, y + 4);
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
    text(c, label, (x0 + x1) / 2, y + h / 2 + 8, 13, '#4a3326', { weight: 700 });
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
}

export function drawSearDial(c: Ctx, x: number, y: number, v: number) {
  const r = 34;
  c.beginPath();
  c.arc(x, y, r + 14, Math.PI, 0);
  c.closePath();
  c.fillStyle = 'rgba(255,250,240,0.96)';
  c.fill();
  const seg = (a: number, b: number, col: string) => {
    c.beginPath();
    c.arc(x, y, r, Math.PI + a * Math.PI, Math.PI + b * Math.PI);
    c.strokeStyle = col;
    c.lineWidth = 12;
    c.stroke();
  };
  seg(0, DIAL.done, '#f3e0c0');
  seg(DIAL.done, DIAL.over, '#9fcf86');
  seg(DIAL.over, DIAL.burnt, '#f2c48a');
  seg(DIAL.burnt, 1, '#d9735f');
  const a = Math.PI + Math.min(1, v) * Math.PI;
  c.strokeStyle = '#4a3326';
  c.lineWidth = 3.5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + Math.cos(a) * (r - 3), y + Math.sin(a) * (r - 3));
  c.stroke();
  text(
    c,
    v < DIAL.done
      ? tt('gRaw')
      : v < DIAL.over
        ? tt('gDone')
        : v < DIAL.burnt
          ? tt('gOver')
          : tt('gBurnt'),
    x,
    y + 12,
    13,
    '#4a3326',
    { weight: 700 }
  );
}

export function drawFloating(c: Ctx, s: Session, x: number, y: number, u: number, t: number) {
  const h = s.hand;
  if (!h || h.k === 'plate') return;
  const bob = Math.sin(t * 3) * 4;
  hsCircle('hand:drop', x - 50, y - 38, 22);
  c.save();
  c.translate(x, y + bob);
  rr(c, -56, -44, 112, 88, 22);
  c.fillStyle = 'rgba(255,250,240,0.88)';
  c.fill();
  c.strokeStyle = '#f2c766';
  c.lineWidth = 2.5;
  c.setLineDash([6, 5]);
  c.stroke();
  c.setLineDash([]);
  if (h.k === 'rice') drawPiece(c, u * 0.9, { kind: 'nigiri', rice: h.q, tops: [] }, 1);
  else if (h.k === 'batch' && h.pieces[0]) {
    drawPiece(c, u * 0.85, { ...h.pieces[0], tops: [] }, 2);
    c.beginPath();
    c.arc(40, -32, 15, 0, Math.PI * 2);
    c.fillStyle = '#ef8f7a';
    c.fill();
    text(c, String(h.pieces.length), 40, -32, 15, '#fff', { weight: 700 });
  } else if (h.k === 'tub') drawIngredient(c, h.ing, 66, 4, 'done');
  else if (h.k === 'torch') {
    c.save();
    c.scale(1.1, 1.1);
    toolBody(c, 'torch', 70);
    c.restore();
  }
  c.beginPath();
  c.arc(-50, -38, 15, 0, Math.PI * 2);
  c.fillStyle = '#fff6e9';
  c.fill();
  c.strokeStyle = '#8a6040';
  c.lineWidth = 1.5;
  c.stroke();
  text(c, '✕', -50, -38, 15, '#8a3b2a', { weight: 700 });
  c.restore();
}

export const _w = { rad, rgba, sheen };
