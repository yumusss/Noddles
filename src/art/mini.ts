// Mini-games that open as a panel over the work table: rolling maki on the bamboo mat, and
// choosing + slicing fish for sashimi.

import { ING, type IngId } from '../game/data';
import { tx, t as tt } from '../game/i18n';
import { type Session, cutMarker, MAKI_GREEN, RICE_MAX, SASHIMI_ZONES } from '../game/session';
import { type Ctx, contactShadow, darken, lighten, lin, rr, sheen, text } from './common';
import { drawIngredient, ingColor } from './food';
import { hs } from './hs';
import {
  type Box,
  chip,
  cuttingBoard,
  icon,
  knife,
  makisu,
  noriSheet,
  pillBtn,
  riceLayer,
  rollLog,
  timingBar,
  verticalGauge,
} from './kit';
import type { Layout } from './layout';

export interface PanelLayout {
  panel: Box;
  board: Box;
  chips: Box;
}

export function panelLayout(L: Layout): PanelLayout {
  const P = L.panel;
  if (!L.portrait) {
    const bw = Math.min(P.w * 0.5, 600, (P.h - 220) / 0.62);
    const bh = bw * 0.62;
    return {
      panel: P,
      board: { x: P.x + 40 + (P.w * 0.55 - 40 - bw) / 2, y: P.y + 86, w: bw, h: bh },
      chips: { x: P.x + P.w * 0.57, y: P.y + 70, w: P.w * 0.41, h: P.h - 86 },
    };
  }
  const bw = Math.min(P.w - 60, 560);
  const bh = bw * 0.6;
  return {
    panel: P,
    board: { x: P.x + (P.w - bw) / 2, y: P.y + 78, w: bw, h: bh },
    chips: { x: P.x + 12, y: P.y + 78 + bh + 120, w: P.w - 24, h: P.h - (78 + bh + 120) - 10 },
  };
}

function grid(n: number, b: Box, max = 112) {
  for (let s = max; s >= 56; s -= 4) {
    const cw = s * 1.06;
    const ch = s * 0.92;
    const cols = Math.max(1, Math.floor(b.w / cw));
    const rows = Math.ceil(n / cols);
    if (rows * ch <= b.h || s === 56) {
      const pos: { x: number; y: number }[] = [];
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / cols);
        const inRow = Math.min(cols, n - r * cols);
        const k = i - r * cols;
        pos.push({
          x: b.x + b.w / 2 - ((inRow - 1) * cw) / 2 + k * cw,
          y: b.y + s * 0.46 + r * ch,
        });
      }
      return { pos, s };
    }
  }
  return { pos: [], s: 56 };
}

function hint(c: Ctx, x: number, y: number, s: string) {
  c.font = '700 15px Fredoka, sans-serif';
  const w = c.measureText(s).width + 30;
  rr(c, x - w / 2, y - 15, w, 30, 15);
  c.fillStyle = 'rgba(58,74,110,0.88)';
  c.fill();
  text(c, s, x, y, 15, '#fff6e9', { weight: 700 });
}

export function drawMini(c: Ctx, s: Session, L: Layout, t: number) {
  const b = s.board;
  if (b.m === 'idle') return;
  const PL = panelLayout(L);
  const P = PL.panel;
  const B = PL.board;
  // dim the table, then the panel
  c.fillStyle = 'rgba(30,22,18,0.35)';
  c.fillRect(0, P.y - 10, L.W, L.H - P.y + 10);
  hs('mini:block', 0, P.y - 10, L.W, L.H - P.y + 10);
  contactShadow(c, P.x + P.w / 2, P.y + P.h + 6, P.w * 0.5, 16, 0.4);
  rr(c, P.x, P.y, P.w, P.h, 26);
  c.fillStyle = lin(c, 0, P.y, 0, P.y + P.h, [
    [0, '#fbf3e6'],
    [1, '#efe2cc'],
  ]);
  c.fill();
  c.strokeStyle = 'rgba(110,75,50,0.25)';
  c.lineWidth = 2;
  c.stroke();
  const title = b.m === 'maki' ? tt('mMaki') : tt('mSashimi');
  text(c, title, P.x + 30, P.y + 30, 22, '#6e4b32', { weight: 700, align: 'left' });
  pillBtn(c, 'mini:close', P.x + P.w - 34, P.y + 30, 44, 44, '✕', false);

  if (b.m === 'pick') {
    const fish = (['salmon', 'tuna'] as IngId[]).filter((f) => s.have.has(f));
    text(c, tt('bPickFish'), P.x + P.w / 2, P.y + 84, 18, '#4a3326', { weight: 700 });
    const sz = Math.min(170, (P.w - 60) / fish.length - 20);
    fish.forEach((f, i) =>
      chip(
        c,
        'mini:fish:' + f,
        P.x + P.w / 2 + (i - (fish.length - 1) / 2) * (sz + 24),
        P.y + 104 + sz * 0.5,
        sz,
        tx(ING[f].name),
        icon(f)
      )
    );
    return;
  }

  cuttingBoard(c, B);

  if (b.m === 'maki') {
    const mat = { x: B.x + B.w * 0.1, y: B.y + B.h * 0.08, w: B.w * 0.8, h: B.h * 0.84 };
    const sheet = {
      x: mat.x + mat.w * 0.05,
      y: mat.y + mat.h * 0.06,
      w: mat.w * 0.9,
      h: mat.h * 0.86,
    };
    const prog = b.stage === 'cut' ? 1 : b.stage === 'rolling' ? b.prog : 0;
    // style pills
    if (b.stage === 'rice' || b.stage === 'fill') {
      const styles = s.availableStyles();
      const pw = Math.min(120, B.w / 3 - 8);
      styles.forEach((st, i) =>
        pillBtn(
          c,
          'mini:style:' + st,
          B.x + B.w / 2 + (i - (styles.length - 1) / 2) * (pw + 8),
          B.y - 26,
          pw,
          38,
          tt(st),
          b.style === st
        )
      );
    }
    if (prog < 1) {
      makisu(c, mat.x, mat.y, mat.w, mat.h, 1 - prog * 0.85);
      const sh = sheet.h * (1 - prog);
      if (sh > 2) {
        c.save();
        c.beginPath();
        c.rect(sheet.x - 4, sheet.y - 4, sheet.w + 8, sh + 4);
        c.clip();
        if (b.style === 'ura' && b.stage !== 'rice') {
          riceLayer(c, sheet.x, sheet.y, sheet.w, sheet.h, 1, 11);
          if (b.coat) {
            for (let i = 0; i < 110; i++) {
              const px = sheet.x + (((i * 37) % 100) / 100) * sheet.w;
              const py = sheet.y + (((i * 61) % 100) / 100) * sheet.h;
              c.beginPath();
              if (b.coat === 'tobiko') {
                c.arc(px, py, 2.4, 0, Math.PI * 2);
                c.fillStyle = '#ff8a2a';
              } else {
                c.ellipse(px, py, 2.4, 1.2, i, 0, Math.PI * 2);
                c.fillStyle = i % 3 ? '#f1dcae' : '#3a2e28';
              }
              c.fill();
            }
          }
        } else {
          noriSheet(c, sheet.x, sheet.y, sheet.w, sheet.h);
          riceLayer(c, sheet.x, sheet.y, sheet.w, sheet.h * 0.92, b.rice, 11);
        }
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
      if (b.stage === 'rolling')
        rollLog(c, sheet.x + sheet.w / 2, sheet.y + sh, sheet.w, 30 + prog * 30, b.style, b.coat);
    }
    hs('mini:mat', B.x, B.y, B.w, B.h, true);
    const below = B.y + B.h + 40;
    if (b.stage === 'rice') {
      verticalGauge(c, B.x + B.w + 30, B.y + 10, B.h - 20, b.rice, RICE_MAX, [
        [0, 0.62, '#f3e0c0', tt('gLess')],
        [0.62, 1.02, '#b9d99a', tt('gJust')],
        [1.02, RICE_MAX, '#f2b3a3', tt('gMore')],
      ]);
      hint(c, B.x + B.w / 2, below, tt('bRice'));
    }
    if (b.stage === 'fill') {
      const coats = b.style === 'ura' ? s.coatChips() : [];
      const list = [
        ...s
          .fillChips()
          .map((f) => ({ id: 'mini:fill:' + f, ing: f, on: b.fill.includes(f), coat: false })),
        ...coats.map((f) => ({ id: 'mini:coat:' + f, ing: f, on: b.coat === f, coat: true })),
      ];
      const g = grid(list.length, PL.chips, L.portrait ? 104 : 108);
      list.forEach((it, i) =>
        chip(
          c,
          it.id,
          g.pos[i].x,
          g.pos[i].y,
          g.s,
          (it.coat ? tt('bCoat') + ': ' : '') + tx(ING[it.ing].name),
          icon(it.ing),
          it.on ? 'on' : 'off',
          it.coat ? '#56638c' : '#ef8f7a'
        )
      );
      hint(c, B.x + B.w / 2, below, b.fill.length ? tt('bRoll') : tt('bFill'));
    }
    if (b.stage === 'rolling') {
      const v = Math.min(1, s.rollSpeed / 3.2);
      timingBar(c, B.x + B.w * 0.1, below - 12, B.w * 0.8, v, [
        { a: 0, b: 0.1, col: '#f3e0c0', label: tt('gSlow') },
        { a: 0.1, b: 0.81, col: '#b9d99a', label: tt('gGood') },
        { a: 0.81, b: 1, col: '#f2b3a3', label: tt('gFast') },
      ]);
    }
    if (b.stage === 'cut') {
      rollLog(
        c,
        B.x + B.w / 2,
        B.y + B.h * 0.5,
        B.w * 0.78,
        64,
        b.style,
        b.coat,
        b.roll === 'loose'
      );
      c.strokeStyle = 'rgba(74,51,38,0.35)';
      c.setLineDash([4, 4]);
      c.lineWidth = 1.5;
      for (let i = 1; i < b.n; i++) {
        const x = B.x + B.w * 0.11 + (B.w * 0.78 * i) / b.n;
        c.beginPath();
        c.moveTo(x, B.y + B.h * 0.5 - 40);
        c.lineTo(x, B.y + B.h * 0.5 + 40);
        c.stroke();
      }
      c.setLineDash([]);
      const pos = cutMarker(b.cutT, 1.5);
      knife(c, B.x + B.w * 0.11 + pos * B.w * 0.78, B.y + B.h * 0.5 - 72);
      timingBar(c, B.x + B.w * 0.1, below - 12, B.w * 0.8, pos, [
        { a: 0, b: MAKI_GREEN.a, col: '#f2d0c3' },
        { a: MAKI_GREEN.a, b: MAKI_GREEN.b, col: '#9fcf86' },
        { a: MAKI_GREEN.b, b: 1, col: '#f2d0c3' },
      ]);
      hs('mini:cut', B.x, B.y, B.w, B.h);
      hint(c, B.x + B.w / 2, below + 44, tt('bCut'));
      const cx = L.portrait ? PL.chips.x + PL.chips.w / 2 : PL.chips.x + PL.chips.w / 2;
      const cy = L.portrait ? PL.chips.y + 40 : PL.chips.y + 80;
      [6, 8].forEach((n, i) =>
        pillBtn(
          c,
          'mini:count:' + n,
          cx - 66 + i * 132,
          cy,
          120,
          50,
          tt('bSlices', { n }),
          b.n === n
        )
      );
    }
  }

  if (b.m === 'sashimi') {
    c.save();
    c.translate(B.x + B.w / 2, B.y + B.h * 0.52);
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
    hs('mini:cut', B.x, B.y, B.w, B.h);
    hint(c, B.x + B.w / 2, B.y + B.h + 92, tt('bCutSashimi'));
    const cx = PL.chips.x + PL.chips.w / 2;
    const cy = L.portrait ? PL.chips.y + 40 : PL.chips.y + 80;
    [3, 5].forEach((n, i) =>
      pillBtn(c, 'mini:count:' + n, cx - 66 + i * 132, cy, 120, 50, tt('bPieces', { n }), b.n === n)
    );
  }
  void t;
}
