// The order card: a paper card hanging from the awning by two strings, with a little drawing
// of each dish, check boxes and a patience bar.

import { ING } from '../game/data';
import { t as tt } from '../game/i18n';
import type { CardRow } from '../game/orders';
import type { PieceBody } from '../game/plate';
import { type Ctx, contactShadow, rr, text } from './common';
import { drawIngredient, drawPiece, drawPlateMini } from './food';
import type { Box } from './kit';

function rowPiece(r: CardRow): (PieceBody & { tops: never[] }) | null {
  const l = r.line;
  if (!l) return null;
  if (l.k === 'nigiri')
    return {
      kind: 'nigiri',
      rice: 'just',
      neta: l.fish,
      band: l.fish === 'tamago',
      aburi: l.aburi ? 'done' : undefined,
      tops: [],
    };
  if (l.k === 'maki')
    return {
      kind: 'maki',
      style: l.style,
      fill: l.fill,
      coat: l.coat,
      rice: 'just',
      roll: 'tight',
      cut: 'clean',
      idx: 0,
      tops: [],
    };
  return { kind: 'sashimi', fish: l.fish, thick: l.thick, cut: 'clean', idx: 0, tops: [] };
}

export function drawCard(
  c: Ctx,
  b: Box,
  rows: CardRow[],
  head: string,
  who: string,
  patience: number,
  t: number,
  online: boolean
) {
  const rowH = 46;
  const h = Math.min(b.h, 54 + rows.length * rowH + 26);
  const sway = Math.sin(t * 0.9) * 0.012;
  c.save();
  c.translate(b.x + b.w / 2, b.y);
  c.rotate(sway);
  // strings
  c.strokeStyle = 'rgba(80,60,50,0.6)';
  c.lineWidth = 1.2;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(s * b.w * 0.32, -20);
    c.lineTo(s * b.w * 0.3, 8);
    c.stroke();
  }
  contactShadow(c, 0, h + 8, b.w * 0.45, 8, 0.25);
  rr(c, -b.w / 2, 0, b.w, h, 10);
  c.fillStyle = online ? '#f2f7fd' : '#fffcf4';
  c.fill();
  c.strokeStyle = 'rgba(140,110,80,0.35)';
  c.lineWidth = 1.2;
  c.stroke();
  // clothespins
  for (const s of [-1, 1]) {
    rr(c, s * b.w * 0.3 - 5, -4, 10, 22, 3);
    c.fillStyle = '#d9b48a';
    c.fill();
  }
  // header
  rr(c, -b.w / 2, 0, b.w, 34, 10);
  c.fillStyle = online ? '#7f93c6' : '#3e4a6e';
  c.fill();
  c.fillRect(-b.w / 2, 24, b.w, 10);
  text(c, head, -b.w / 2 + 14, 17, 14, '#fff6e9', { align: 'left', font: 'type', weight: 700 });
  text(c, who, b.w / 2 - 14, 17, 14, '#fff6e9', { align: 'right', weight: 700, maxW: b.w * 0.5 });
  // rows
  rows.forEach((r, i) => {
    const y = 44 + i * rowH + rowH / 2;
    const x0 = -b.w / 2 + 12;
    // icon
    c.save();
    c.translate(x0 + 24, y + 2);
    const p = rowPiece(r);
    if (p) drawPiece(c, 230, p, 3);
    else if (r.side && r.kind !== 'plate') {
      drawIngredient(c, r.side, 40, 2, 'done');
      if (r.kind === 'forbid') {
        c.strokeStyle = '#d9473f';
        c.lineWidth = 3.5;
        c.beginPath();
        c.moveTo(-14, -14);
        c.lineTo(14, 14);
        c.stroke();
        c.beginPath();
        c.arc(0, 0, 18, 0, Math.PI * 2);
        c.stroke();
      }
    } else if (r.kind === 'plate') drawPlateMini(c, 'geta', 38);
    c.restore();
    const tx0 = x0 + 54;
    const col = r.bad ? '#c2412b' : r.kind === 'forbid' ? '#c2412b' : r.ok ? '#4f7a3e' : '#3e2e24';
    text(c, r.text, tx0, r.sub ? y - 8 : y, 15, col, {
      align: 'left',
      weight: 700,
      maxW: b.w - 110,
    });
    if (r.sub)
      text(c, r.sub, tx0, y + 10, 12, '#7a6656', { align: 'left', weight: 600, maxW: b.w - 110 });
    // check box
    const bx = b.w / 2 - 30;
    rr(c, bx, y - 9, 18, 18, 4);
    c.strokeStyle = r.ok ? '#4f7a3e' : '#8a7562';
    c.lineWidth = 2;
    c.stroke();
    if (r.ok) {
      c.strokeStyle = '#4f7a3e';
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(bx + 4, y);
      c.lineTo(bx + 8, y + 5);
      c.lineTo(bx + 15, y - 6);
      c.stroke();
    }
    if (i < rows.length - 1) {
      c.strokeStyle = 'rgba(180,160,130,0.35)';
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(-b.w / 2 + 12, y + rowH / 2);
      c.lineTo(b.w / 2 - 12, y + rowH / 2);
      c.stroke();
      c.setLineDash([]);
    }
  });
  // patience: a melting snowflake bar
  const py = h - 16;
  rr(c, -b.w / 2 + 14, py - 5, b.w - 28, 10, 5);
  c.fillStyle = '#e9e2d6';
  c.fill();
  rr(c, -b.w / 2 + 14, py - 5, (b.w - 28) * Math.max(0, Math.min(1, patience)), 10, 5);
  c.fillStyle = patience > 0.55 ? '#8fbf74' : patience > 0.25 ? '#e9b45c' : '#d9573f';
  c.fill();
  c.restore();
  void ING;
  void tt;
  return h;
}
