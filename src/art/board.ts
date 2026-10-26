// Station 3: the rolling board (maki, temaki, sashimi cutting) and the heat corner (fryer, grill).

import { ING, type IngId } from '../game/data';
import { tx, t as tt } from '../game/i18n';
import type { MakiStyle } from '../game/plate';
import {
  type Session,
  cutMarker,
  DIAL,
  MAKI_GREEN,
  RICE_MAX,
  SASHIMI_ZONES,
} from '../game/session';
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
} from './common';
import { drawIngredient, riceBed, ingColor } from './food';
import { hs, hsOrigin } from './hs';
import { RESERVE, drawPrepBg } from './prep';

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BoardLayout {
  area: Box;
  board: Box;
  heat: Box | null;
  chipS: number;
  portrait: boolean;
}

export function boardLayout(W: number, H: number, portrait: boolean, heatOn: boolean): BoardLayout {
  const top = RESERVE.top;
  const bottom = RESERVE.bottom;
  if (!portrait) {
    const areaW = heatOn ? W * 0.6 : W;
    const area = { x: 0, y: top, w: areaW, h: H - top - bottom };
    const bw = Math.min(areaW * 0.52, 470, area.h * 1.15);
    const bh = bw * 0.72;
    const board = { x: areaW / 2 - bw / 2, y: top + area.h / 2 - bh / 2 + 6, w: bw, h: bh };
    return {
      area,
      board,
      heat: heatOn ? { x: areaW, y: top, w: W - areaW, h: H - top - bottom } : null,
      chipS: Math.min(104, (areaW - bw) / 2 - 30),
      portrait,
    };
  }
  const areaH = heatOn ? (H - top - bottom) * 0.72 : H - top - bottom;
  const area = { x: 0, y: top, w: W, h: areaH };
  const bw = Math.max(300, Math.min(W * 0.7, 500, (areaH - 420) / 0.62));
  const bh = bw * 0.62;
  const board = { x: W / 2 - bw / 2, y: top + 58, w: bw, h: bh };
  return {
    area,
    board,
    heat: heatOn ? { x: 0, y: top + areaH, w: W, h: H - top - bottom - areaH } : null,
    chipS: Math.min(108, (W - bw) / 2 - 22),
    portrait,
  };
}

// ---------- chips (canvas buttons with an ingredient picture and a translated label) ----------

function chip(
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

function pillBtn(
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

const icon = (i: IngId) => (c: Ctx, s: number) => drawIngredient(c, i, s * 0.6, 3, 'done');

/**
 * Places n chips on both sides of the board, inner columns first, shrinking chips until they fit.
 * Returns positions and the chip size.
 */
function chipGrid(
  n: number,
  L: BoardLayout,
  W: number
): { pos: { x: number; y: number }[]; s: number } {
  const B = L.board;
  if (L.portrait) {
    // phones held upright: a tray of chips under the board
    const y0 = B.y + B.h + 124;
    const y1 = L.area.y + L.area.h - 4;
    for (let cs = 124; cs >= 60; cs -= 4) {
      const cw = cs * 1.06;
      const ch = cs * 0.92;
      const cols = Math.max(1, Math.min(n, Math.floor((W - 24) / cw)));
      const rows = Math.ceil(n / cols);
      if (rows * ch > y1 - y0 && cs > 60) continue;
      const pos: { x: number; y: number }[] = [];
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / cols);
        const inRow = Math.min(cols, n - r * cols);
        const k = i - r * cols;
        pos.push({ x: W / 2 - ((inRow - 1) * cw) / 2 + k * cw, y: y0 + cs * 0.43 + r * ch });
      }
      return { pos, s: cs };
    }
  }
  const areaX0 = L.area.x + 10;
  const areaX1 = L.area.x + L.area.w - 10;
  const y0 = L.area.y + 6;
  const y1 = L.area.y + L.area.h - 6;
  for (let cs = Math.min(104, L.chipS + 10); cs >= 64; cs -= 4) {
    const gap = cs * 0.08;
    const cw = cs + gap;
    const ch = cs * 0.86 + gap;
    const leftCols = Math.floor((B.x - 14 - areaX0) / cw);
    const rightCols = Math.floor((areaX1 - (B.x + B.w + 14)) / cw);
    const rows = Math.floor((y1 - y0) / ch);
    if (leftCols < 1 || rightCols < 1 || rows < 1) continue;
    const half = Math.ceil(n / 2);
    const leftN = half;
    const rightN = n - half;
    if (Math.ceil(leftN / rows) > leftCols || Math.ceil(rightN / rows) > rightCols) continue;
    const pos: { x: number; y: number }[] = [];
    const side = (count: number, dir: -1 | 1) => {
      const cols = Math.max(1, Math.ceil(count / rows));
      const perCol = Math.ceil(count / cols);
      for (let i = 0; i < count; i++) {
        const col = Math.floor(i / perCol);
        const row = i % perCol;
        const inCol = Math.min(perCol, count - col * perCol);
        const x = dir < 0 ? B.x - 14 - cw / 2 - col * cw : B.x + B.w + 14 + cw / 2 + col * cw;
        const yc = B.y + B.h / 2;
        pos.push({ x, y: yc - ((inCol - 1) * ch) / 2 + row * ch });
      }
    };
    side(leftN, -1);
    side(rightN, 1);
    // keep inside the vertical band
    for (const p of pos) p.y = Math.max(y0 + cs * 0.43, Math.min(y1 - cs * 0.43, p.y));
    return { pos, s: cs };
  }
  void W;
  // last resort: tiny chips in a row under the board
  return {
    pos: Array.from({ length: n }, (_, i) => ({
      x: B.x + ((i + 0.5) * B.w) / n,
      y: B.y + B.h + 50,
    })),
    s: Math.min(64, B.w / n - 4),
  };
}

// ---------- board drawing ----------

function cuttingBoard(c: Ctx, b: Box) {
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

function makisu(c: Ctx, x: number, y: number, w: number, h: number, rolledFrom = 1) {
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

function noriSheet(c: Ctx, x: number, y: number, w: number, h: number) {
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
function riceLayer(
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

function verticalGauge(
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

function timingBar(
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

function rollLog(
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

export function drawBoardStation(
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
  const L = boardLayout(W, H, portrait, s.heatOn);
  c.save();
  c.translate(ox, 0);
  hsOrigin(ox);
  const B = L.board;
  const cs = L.chipS;
  text(c, tt('boardTitle'), B.x + B.w / 2, B.y - 52, 20, '#6e4b32', { weight: 700 });
  cuttingBoard(c, B);
  const b = s.board;
  const leftX = B.x - cs / 2 - 18;
  const rightX = B.x + B.w + cs / 2 + 18;
  const colY = (i: number, n: number) => B.y + B.h / 2 - ((n - 1) * cs * 0.95) / 2 + i * cs * 0.95;

  if (b.m === 'idle') {
    // start options
    const starts: { id: string; label: string; ic: ((c: Ctx, s: number) => void) | null }[] = [
      { id: 'board:maki', label: tt('bNori'), ic: icon('nori') },
    ];
    if (s.n >= 8) starts.push({ id: 'board:temaki', label: tt('bTemaki'), ic: icon('nori') });
    const fishList = s.n >= 4 ? (['salmon', 'tuna'] as IngId[]).filter((f) => s.have.has(f)) : [];
    if (L.portrait) {
      const all = [
        ...starts,
        ...fishList.map((f) => ({
          id: 'board:fish:' + f,
          label: 'Sashimi · ' + tx(ING[f].name),
          ic: icon(f),
        })),
      ];
      const g = chipGrid(all.length, L, W);
      all.forEach((st, i) => chip(c, st.id, g.pos[i].x, g.pos[i].y - 40, g.s, st.label, st.ic));
    } else
      starts.forEach((st, i) => chip(c, st.id, leftX, colY(i, starts.length), cs, st.label, st.ic));
    if (s.n >= 4 && !L.portrait) {
      const fish = (['salmon', 'tuna'] as IngId[]).filter((f) => s.have.has(f));
      text(c, tt('bFish'), rightX, colY(0, fish.length) - cs * 0.62, 14, '#6e4b32', {
        weight: 700,
        maxW: cs + 30,
      });
      fish.forEach((f, i) =>
        chip(c, 'board:fish:' + f, rightX, colY(i, fish.length), cs, tx(ING[f].name), icon(f))
      );
    }
    // a rolled-up mat resting on the board
    makisu(c, B.x + B.w * 0.18, B.y + B.h * 0.35, B.w * 0.64, B.h * 0.3);
  }

  if (b.m === 'maki' || b.m === 'temaki') {
    const mat = { x: B.x + B.w * 0.12, y: B.y + B.h * 0.1, w: B.w * 0.76, h: B.h * 0.8 };
    const half = b.m === 'temaki';
    const sheet = {
      x: mat.x + mat.w * 0.06,
      y: mat.y + mat.h * (half ? 0.45 : 0.08),
      w: mat.w * (half ? 0.55 : 0.88),
      h: mat.h * (half ? 0.48 : 0.84),
    };
    if (half) sheet.x = mat.x + mat.w / 2 - sheet.w / 2;
    const rolled = b.m === 'maki' && (b.stage === 'rolling' || b.stage === 'cut');
    const prog = b.m === 'maki' ? (b.stage === 'cut' ? 1 : b.stage === 'rolling' ? b.prog : 0) : 0;
    if (!rolled || prog < 1) {
      makisu(c, mat.x, mat.y, mat.w, mat.h, 1 - prog * 0.85);
      const sh = sheet.h * (1 - prog);
      if (sh > 2) {
        c.save();
        c.beginPath();
        c.rect(sheet.x - 4, sheet.y - 4, sheet.w + 8, sh + 4);
        c.clip();
        if (b.m === 'maki' && b.style === 'ura' && b.stage !== 'rice') {
          // inside-out: rice faces down, the coating faces up
          riceLayer(c, sheet.x, sheet.y, sheet.w, sheet.h, 1, 11);
          if (b.coat) {
            c.save();
            c.translate(sheet.x + sheet.w / 2, sheet.y + sheet.h / 2);
            const r = srand(5);
            for (let i = 0; i < 90; i++) {
              const px = (r() - 0.5) * sheet.w * 0.92;
              const py = (r() - 0.5) * sheet.h * 0.92;
              if (b.coat === 'tobiko') {
                c.beginPath();
                c.arc(px, py, 2.4, 0, Math.PI * 2);
                c.fillStyle = '#ff8a2a';
                c.fill();
              } else {
                ellipse(c, px, py, 2.4, 1.2, r() * 3);
                c.fillStyle = r() < 0.3 ? '#3a2e28' : '#f1dcae';
                c.fill();
              }
            }
            c.restore();
          }
        } else {
          noriSheet(c, sheet.x, sheet.y, sheet.w, sheet.h);
          riceLayer(c, sheet.x, sheet.y, sheet.w, sheet.h * 0.92, b.rice, 11);
        }
        // filling strips
        b.fill.forEach((f, i) => {
          const fy = sheet.y + sheet.h * (0.72 - i * 0.08);
          rr(c, sheet.x + sheet.w * 0.05, fy, sheet.w * 0.9, sheet.h * 0.07, 6);
          c.fillStyle = lin(c, 0, fy, 0, fy + sheet.h * 0.07, [
            [0, lighten(ingColor(f), 0.2)],
            [1, darken(ingColor(f), 0.1)],
          ]);
          c.fill();
          sheen(
            c,
            sheet.x + sheet.w * 0.4,
            fy + sheet.h * 0.02,
            sheet.w * 0.3,
            sheet.h * 0.015,
            0.4
          );
        });
        c.restore();
      }
      if (b.m === 'maki' && b.stage === 'rolling') {
        // the log forming at the roll line
        const ly = sheet.y + sh;
        const d = 30 + prog * 30;
        rollLog(c, sheet.x + sheet.w / 2, ly, sheet.w, d, b.style, b.coat);
      }
    }
    // hold / drag surface
    hs('board:mat', B.x, B.y, B.w, B.h, true);

    // style chips (maki) on top
    if (b.m === 'maki' && (b.stage === 'rice' || b.stage === 'fill')) {
      const styles = s.availableStyles();
      const pw = Math.min(150, B.w / Math.max(1, styles.length) - 8);
      styles.forEach((st, i) =>
        pillBtn(
          c,
          'board:style:' + st,
          B.x + B.w / 2 + (i - (styles.length - 1) / 2) * (pw + 8),
          B.y - 22,
          pw,
          36,
          tt(st),
          b.style === st
        )
      );
    }
    // rice gauge
    if (b.stage === 'rice') {
      verticalGauge(
        c,
        L.portrait ? B.x + B.w - 30 : rightX - cs * 0.2,
        B.y + 10,
        B.h - 20,
        b.rice,
        RICE_MAX,
        [
          [0, 0.62, '#f3e0c0', tt('gLess')],
          [0.62, 1.02, '#b9d99a', tt('gJust')],
          [1.02, RICE_MAX, '#f2b3a3', tt('gMore')],
        ]
      );
      hint(c, B, tt('bRice'));
    }
    // fillings (and the outside coating for uramaki), split on both sides of the board
    if (b.stage === 'fill') {
      const coats = b.m === 'maki' && b.style === 'ura' ? s.coatChips() : [];
      const list: { id: string; ing: IngId; on: boolean; coat?: boolean }[] = [
        ...s.fillChips().map((f) => ({ id: 'board:fill:' + f, ing: f, on: b.fill.includes(f) })),
        ...coats.map((f) => ({
          id: 'board:coat:' + f,
          ing: f,
          on: b.m === 'maki' && b.coat === f,
          coat: true,
        })),
      ];
      const grid = chipGrid(list.length, L, W);
      list.forEach((it, i) => {
        const cooked = !!ING[it.ing].cookedFrom;
        const st = it.on ? 'on' : cooked && s.stock(it.ing) <= 0 ? 'dim' : 'off';
        const label =
          (it.coat ? tt('bCoat') + ': ' : '') + tx(ING[it.ing].name).replace(/ \(.*\)/, '');
        chip(
          c,
          it.id,
          grid.pos[i].x,
          grid.pos[i].y,
          grid.s,
          label,
          icon(it.ing),
          st,
          it.coat ? '#56638c' : '#ef8f7a'
        );
      });
      if (b.m === 'maki') {
        hint(c, B, b.fill.length ? tt('bRoll') + ' · ' + tt('bRollHold') : tt('bFill'));
      } else {
        // temaki: count + make the cone
        const pw = 70;
        [1, 2].forEach((n, i) =>
          pillBtn(
            c,
            'board:count:' + n,
            B.x + B.w / 2 - 120 + i * (pw + 8),
            B.y + B.h + 34,
            pw,
            40,
            tt('bPieces', { n }),
            b.n === n
          )
        );
        pillBtn(
          c,
          'board:cone',
          B.x + B.w / 2 + 90,
          B.y + B.h + 34,
          170,
          46,
          tt('bCone'),
          true,
          '#6e8f5e'
        );
        hint(c, B, tt('bFill'));
      }
    }
    if (b.m === 'maki' && b.stage === 'rolling') {
      // speed meter
      const sp = s.rollSpeed;
      const v = Math.min(1, sp / 3.2);
      timingBar(c, B.x + B.w * 0.1, B.y + B.h + 28, B.w * 0.8, v, [
        { a: 0, b: 0.1, col: '#f3e0c0', label: tt('gSlow') },
        { a: 0.1, b: 0.81, col: '#b9d99a', label: tt('gGood') },
        { a: 0.81, b: 1, col: '#f2b3a3', label: tt('gFast') },
      ]);
    }
    if (b.m === 'maki' && b.stage === 'cut') {
      rollLog(
        c,
        B.x + B.w / 2,
        B.y + B.h * 0.48,
        B.w * 0.78,
        64,
        b.style,
        b.coat,
        b.roll === 'loose'
      );
      // slice guide lines
      const n = b.n;
      c.strokeStyle = 'rgba(74,51,38,0.35)';
      c.setLineDash([4, 4]);
      c.lineWidth = 1.5;
      for (let i = 1; i < n; i++) {
        const x = B.x + B.w * 0.11 + (B.w * 0.78 * i) / n;
        c.beginPath();
        c.moveTo(x, B.y + B.h * 0.48 - 40);
        c.lineTo(x, B.y + B.h * 0.48 + 40);
        c.stroke();
      }
      c.setLineDash([]);
      const pos = cutMarker(b.cutT, 1.5);
      knife(c, B.x + B.w * 0.11 + pos * B.w * 0.78, B.y + B.h * 0.48 - 70);
      timingBar(c, B.x + B.w * 0.1, B.y + B.h + 26, B.w * 0.8, pos, [
        { a: 0, b: MAKI_GREEN.a, col: '#f2d0c3' },
        { a: MAKI_GREEN.a, b: MAKI_GREEN.b, col: '#9fcf86' },
        { a: MAKI_GREEN.b, b: 1, col: '#f2d0c3' },
      ]);
      const pw = 96;
      [6, 8].forEach((n, i) =>
        pillBtn(
          c,
          'board:count:' + n,
          L.portrait ? W / 2 - 62 + i * 124 : leftX,
          L.portrait ? B.y + B.h + 150 : B.y + B.h * 0.3 + i * 54,
          Math.min(pw, cs + 10),
          44,
          tt('bSlices', { n }),
          b.n === n
        )
      );
      hs('board:cut', B.x, B.y, B.w, B.h);
      hint(c, B, tt('bCut'), 18);
    }
    pillBtn(c, 'board:reset', B.x + B.w - 24, B.y + 14, 40, 40, '✕', false);
  }

  if (b.m === 'sashimi') {
    // fish block
    c.save();
    c.translate(B.x + B.w / 2, B.y + B.h * 0.5);
    drawIngredient(c, b.fish, B.w * 0.7, 9);
    c.restore();
    const pos = cutMarker(b.cutT, 1.9);
    knife(c, B.x + B.w * 0.1 + pos * B.w * 0.8, B.y + B.h * 0.5 - 80);
    const labels: Record<string, string> = {
      thin: tt('gThin'),
      normal: tt('gNormal'),
      thick: tt('gThick'),
    };
    timingBar(
      c,
      B.x + B.w * 0.05,
      B.y + B.h + 26,
      B.w * 0.9,
      pos,
      SASHIMI_ZONES.map((z) => ({
        a: z.a,
        b: z.b,
        col: z.q ? (z.q === 'normal' ? '#9fcf86' : '#c9e3b0') : '#f2d0c3',
        label: z.q ? labels[z.q] : undefined,
      }))
    );
    [3, 5].forEach((n, i) =>
      pillBtn(
        c,
        'board:count:' + n,
        L.portrait ? W / 2 - 62 + i * 124 : leftX,
        L.portrait ? B.y + B.h + 150 : B.y + B.h * 0.3 + i * 54,
        Math.min(96, cs + 10),
        44,
        tt('bPieces', { n }),
        b.n === n
      )
    );
    hs('board:cut', B.x, B.y, B.w, B.h);
    hint(c, B, tt('bCutSashimi'), 30);
    pillBtn(c, 'board:reset', B.x + B.w - 24, B.y + 14, 40, 40, '✕', false);
  }

  if (L.heat) drawHeat(c, s, L, t, lang);
  c.restore();
  hsOrigin(0);
  return L;
}

function hint(c: Ctx, B: Box, s: string, dy = 0) {
  const y = B.y + B.h + 78 + dy;
  c.font = '700 16px Fredoka, sans-serif';
  const w = Math.min(B.w + 120, c.measureText(s).width + 30);
  rr(c, B.x + B.w / 2 - w / 2, y - 16, w, 32, 16);
  c.fillStyle = 'rgba(74,51,38,0.78)';
  c.fill();
  text(c, s, B.x + B.w / 2, y, 16, '#fff6e9', { weight: 700, maxW: w - 16 });
}

function knife(c: Ctx, x: number, y: number) {
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

// ---------- heat corner ----------

function dial(c: Ctx, x: number, y: number, r: number, v: number) {
  const a0 = Math.PI;
  const span = Math.PI;
  const seg = (a: number, b: number, col: string, label: string) => {
    c.beginPath();
    c.arc(x, y, r, a0 + a * span, a0 + b * span);
    c.strokeStyle = col;
    c.lineWidth = 16;
    c.stroke();
    const m = a0 + ((a + b) / 2) * span;
    text(c, label, x + Math.cos(m) * (r + 30), y + Math.sin(m) * (r + 22) - 2, 13, '#4a3326', {
      weight: 700,
    });
  };
  c.beginPath();
  c.arc(x, y, r + 12, Math.PI, 0);
  c.closePath();
  c.fillStyle = 'rgba(255,250,240,0.95)';
  c.fill();
  seg(0, DIAL.done, '#f3e0c0', tt('gRaw'));
  seg(DIAL.done, DIAL.over, '#9fcf86', tt('gDone'));
  seg(DIAL.over, DIAL.burnt, '#f2c48a', tt('gOver'));
  seg(DIAL.burnt, 1, '#d9735f', tt('gBurnt'));
  const a = a0 + Math.min(1, v) * span;
  c.strokeStyle = '#4a3326';
  c.lineWidth = 4;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4));
  c.stroke();
  c.beginPath();
  c.arc(x, y, 7, 0, Math.PI * 2);
  c.fillStyle = '#4a3326';
  c.fill();
}

function fryer(c: Ctx, x: number, y: number, w: number, cooking: { t: number } | null, t: number) {
  contactShadow(c, x, y + w * 0.3, w * 0.55, w * 0.1, 0.35);
  // pot
  c.fillStyle = lin(c, x - w / 2, 0, x + w / 2, 0, [
    [0, '#3a3e44'],
    [0.4, '#6a7078'],
    [1, '#2e3136'],
  ]);
  rr(c, x - w * 0.45, y - w * 0.12, w * 0.9, w * 0.42, 16);
  c.fill();
  ellipse(c, x, y - w * 0.12, w * 0.45, w * 0.12);
  c.fillStyle = '#25282c';
  c.fill();
  ellipse(c, x, y - w * 0.11, w * 0.4, w * 0.095);
  c.fillStyle = rad(c, x, y - w * 0.12, 0, w * 0.4, [
    [0, '#f2c25a'],
    [1, '#b37a1e'],
  ]);
  c.fill();
  if (cooking) {
    const k = Math.min(1, cooking.t);
    const col =
      k < DIAL.done
        ? '#f5e0b0'
        : k < DIAL.over
          ? '#efbf62'
          : k < DIAL.burnt
            ? '#b87628'
            : '#5a3a1a';
    for (let i = 0; i < 4; i++) {
      ellipse(c, x - w * 0.24 + i * w * 0.16, y - w * 0.12, w * 0.07, w * 0.03, 0.3);
      c.fillStyle = col;
      c.fill();
    }
    // bubbles
    for (let i = 0; i < 10; i++) {
      const p = (t * 2 + i * 0.37) % 1;
      c.beginPath();
      c.arc(
        x - w * 0.34 + (((i * 37) % 100) / 100) * w * 0.68,
        y - w * 0.12 + Math.sin(i) * 3,
        1.5 + p * 2,
        0,
        Math.PI * 2
      );
      c.strokeStyle = `rgba(255,240,200,${0.8 - p * 0.8})`;
      c.lineWidth = 1;
      c.stroke();
    }
  }
  // handles
  rr(c, x - w * 0.58, y - w * 0.05, w * 0.14, w * 0.06, 3);
  c.fillStyle = '#6e4b32';
  c.fill();
  rr(c, x + w * 0.44, y - w * 0.05, w * 0.14, w * 0.06, 3);
  c.fill();
}

function grill(c: Ctx, x: number, y: number, w: number, cooking: { t: number } | null, t: number) {
  contactShadow(c, x, y + w * 0.3, w * 0.55, w * 0.1, 0.35);
  // clay konro box
  rr(c, x - w * 0.48, y - w * 0.1, w * 0.96, w * 0.38, 8);
  c.fillStyle = lin(c, 0, y - w * 0.1, 0, y + w * 0.3, [
    [0, '#e2c4a0'],
    [1, '#b8906a'],
  ]);
  c.fill();
  rr(c, x - w * 0.44, y - w * 0.14, w * 0.88, w * 0.1, 4);
  c.fillStyle = '#3a2a22';
  c.fill();
  // coals glow
  const g = 0.6 + Math.sin(t * 3) * 0.2;
  for (let i = 0; i < 7; i++) {
    ellipse(c, x - w * 0.36 + i * w * 0.12, y - w * 0.1, w * 0.06, w * 0.025);
    c.fillStyle = `rgba(255,${120 + i * 10},60,${g})`;
    c.fill();
  }
  // grate
  c.strokeStyle = '#8a8f96';
  c.lineWidth = 2;
  for (let i = 0; i < 9; i++) {
    c.beginPath();
    c.moveTo(x - w * 0.44 + i * w * 0.11, y - w * 0.17);
    c.lineTo(x - w * 0.44 + i * w * 0.11, y - w * 0.07);
    c.stroke();
  }
  if (cooking) {
    const k = Math.min(1, cooking.t);
    const col =
      k < DIAL.done
        ? '#e8d4bc'
        : k < DIAL.over
          ? '#9a5a2a'
          : k < DIAL.burnt
            ? '#6a3612'
            : '#2a1a0e';
    for (let i = 0; i < 2; i++) {
      rr(c, x - w * 0.34, y - w * 0.2 + i * w * 0.07, w * 0.68, w * 0.06, 6);
      c.fillStyle = col;
      c.fill();
      sheen(c, x, y - w * 0.19 + i * w * 0.07, w * 0.2, w * 0.01, k > DIAL.done ? 0.5 : 0.2);
    }
  }
}

function drawHeat(c: Ctx, s: Session, L: BoardLayout, t: number, lang: string) {
  const A = L.heat!;
  text(c, tt('heatTitle'), A.x + A.w / 2, A.y + (L.portrait ? 4 : 18), 20, '#6e4b32', {
    weight: 700,
  });
  const devs: ('fryer' | 'grill')[] = [];
  if (s.have.has('shrimp')) devs.push('fryer');
  if (s.have.has('eel')) devs.push('grill');
  const n = devs.length;
  devs.forEach((dev, i) => {
    // each device gets a cell: the pot/grill on the left, its controls on the right
    const cell = L.portrait
      ? { x: A.x + (A.w / n) * i, y: A.y + 24, w: A.w / n, h: A.h - 24 }
      : { x: A.x, y: A.y + 40 + ((A.h - 40) / n) * i, w: A.w, h: (A.h - 40) / n };
    const vertical = L.portrait && n > 1;
    const w = Math.min(
      vertical ? cell.w * 0.66 : cell.w * 0.46,
      230,
      cell.h * (vertical ? 0.62 : 1.05)
    );
    const cx = vertical ? cell.x + cell.w / 2 : cell.x + cell.w * 0.34;
    const cy = vertical ? cell.y + cell.h * 0.34 : cell.y + cell.h * 0.52;
    const kx = vertical ? cx : cell.x + cell.w * 0.78;
    const ky = vertical ? cell.y + cell.h * 0.78 : cy;
    const cook = s.heat[dev];
    if (dev === 'fryer') fryer(c, cx, cy, w, cook, t);
    else grill(c, cx, cy, w, cook, t);
    const raw: IngId = dev === 'fryer' ? 'shrimp' : 'eel';
    if (!cook) {
      chip(
        c,
        `heat:${dev}:start`,
        kx,
        ky,
        Math.min(100, L.chipS + 6),
        tx(ING[raw].name).replace(/ \(.*\)/, ''),
        icon(raw)
      );
    } else {
      const r = Math.min(46, cell.w * 0.1, cell.h * 0.2);
      dial(c, kx, ky - (vertical ? r * 0.2 : r * 0.15), r, cook.t);
      pillBtn(c, `heat:${dev}:take`, kx, ky + r * 0.75 + 20, 104, 46, tt('bTake'), true, '#6e8f5e');
    }
    hs(`heat:${dev}:dev`, cx - w / 2, cy - w * 0.25, w, w * 0.55);
  });
  void lang;
}
