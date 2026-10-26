// Draws one frame: the view through the window, the customer, the hut, the order card,
// the work table and the mini-game panel. Registers the tap areas as it goes.

import type { DecorSlot } from '../game/data';
import { getLang, money } from '../game/i18n';
import { cardRows } from '../game/orders';
import type { Customer, Session } from '../game/session';
import { lookOf, drawBust, drawPaws } from './animals';
import { drawCard } from './card';
import { type Ctx, ease, ellipse, rr, setPx, text } from './common';
import { hs, hsBegin, hsEnd } from './hs';
import { drawChangeBox, drawHutFrame, drawJar, drawPip, drawRegister } from './hut';
import { computeLayout, type Layout } from './layout';
import { drawMini } from './mini';
import { outsideLife, paintOutside, skyFor } from './outside';
import {
  drawFloating,
  drawPlateWithPieces,
  drawSearDial,
  drawSqueezeGauge,
  drawTable,
  drawTools,
  drawTrays,
} from './work';

export interface ViewInfo {
  W: number;
  H: number;
  portrait: boolean;
  scale: number;
  dpr: number;
}

/** positions the DOM layer needs, in logical units */
export const anchors = {
  bubble: { x: 0, y: 0, w: 0, h: 0 },
  pip: { x: 0, y: 0 },
  showCard: false,
  layout: null as Layout | null,
};

export function layoutFor(s: Session, v: { W: number; H: number; portrait: boolean }) {
  const tools: ('mat' | 'knife' | 'torch')[] = [];
  if (s.makiOn) tools.push('mat');
  if (s.sashimiOn) tools.push('knife');
  if (s.torchOn) tools.push('torch');
  return computeLayout(v.W, v.H, v.portrait, s.trays(), s.activeOnline ? [] : s.plates, tools);
}

export function bubbleVisible(c: Customer | null) {
  if (!c || !c.line) return false;
  if (c.state === 'wait') return !!c.ask || c.lineAt < 3.2;
  return c.state !== 'arrive' && c.state !== 'eat';
}

export function renderWorld(
  c: Ctx,
  v: ViewInfo,
  s: Session,
  t: number,
  decor: Record<DecorSlot, string>
) {
  setPx(v.scale * v.dpr);
  const L = layoutFor(s, v);
  anchors.layout = L;
  const lang = getLang();
  const sky = skyFor(s.day.time, s.day.snow === 'storm');
  hsBegin();

  // ---- outside
  paintOutside(c, L.win, s.day.time, s.day.snow === 'storm');
  outsideLife(
    c,
    L.win,
    t,
    s.day.time,
    s.day.snow === 'storm',
    s.day.snow !== 'none',
    s.n === 10 || (s.day.time === 'evening' && s.n >= 9)
  );
  drawCourier(c, s, L, t);

  // ---- customer (outside the window, behind the frame)
  const cu = s.cust;
  let custX = L.cust.x;
  if (cu) {
    const look = lookOf(cu.species, cu.seed, cu.kid, cu.special);
    const R = L.cust.R * (cu.kid ? 0.84 : 1) * (cu.special === 'bulut' ? 1.12 : 1);
    let off = 0;
    if (cu.state === 'arrive')
      off = -(1 - ease(Math.min(1, cu.st / 1.5))) * (L.cust.x - L.win.x + R * 3);
    if (cu.state === 'leave')
      off = ease(Math.min(1, cu.st / 1.3)) * (L.win.x + L.win.w - L.cust.x + R * 3);
    custX = L.cust.x + off;
    const walking = cu.state === 'arrive' || cu.state === 'leave';
    const bob = walking ? Math.abs(Math.sin(t * 9)) * 6 : 0;
    const talk = s.lineDone(cu) || !cu.line ? 0 : (Math.sin(t * 22) + 1) / 2;
    const eat = cu.state === 'eat' ? (cu.st * 1.3) % 1 : undefined;
    c.save();
    c.beginPath();
    c.rect(L.win.x, L.win.y, L.win.w, L.sillY - L.win.y + 2);
    c.clip();
    c.save();
    c.translate(custX, L.sillY + 6 - bob + (cu.kid ? 16 : 0));
    drawBust(c, look, R, {
      mood: cu.state === 'eat' ? 'neutral' : cu.mood,
      talk,
      t: t + cu.id,
      eat,
    });
    c.restore();
    c.restore();
  }

  // ---- the hut around the window
  drawHutFrame(c, L, decor, sky.glow, t);

  // paws on the sill and the served plate
  if (cu && cu.state !== 'arrive' && cu.state !== 'leave') {
    const look = lookOf(cu.species, cu.seed, cu.kid, cu.special);
    const R = L.cust.R * (cu.kid ? 0.84 : 1) * (cu.special === 'bulut' ? 1.12 : 1);
    drawPaws(c, look, R, custX, L.sillY + 4, t, cu.state === 'eat');
    hs('customer', custX - R * 1.6, L.sillY - R * 4.2, R * 3.2, R * 4.2);
  }
  if (s.served && cu) {
    const total = s.served.plate.pieces.length;
    const eatK = cu.state === 'eat' ? Math.min(1, cu.st / 2.4) : cu.state === 'wait' ? 0 : 1;
    const left = s.served.plate.pieces.filter((_, i) => i >= Math.floor(total * eatK));
    const slide = Math.min(1, s.served.t / 0.35);
    drawPlateWithPieces(
      c,
      s.served.plate.id,
      left,
      custX,
      L.sillY + 4 + (1 - slide) * 40,
      L.portrait ? 150 : 160,
      s.t + 10
    );
  }

  // register, change box, tip jar, Pip
  const RG = L.register;
  const paying = cu?.state === 'pay';
  drawRegister(c, RG.x, RG.y, RG.w, paying ? money(cu!.bill) : money(0), s.drawer.open ? 1 : 0, t);
  hs('register', RG.x - RG.w / 2, RG.y - RG.w * 0.8, RG.w, RG.w * 0.9);
  if (paying && cu && cu.cash > cu.bill) {
    const bx = L.portrait ? L.W * 0.56 : RG.x + RG.w * 0.55;
    const by = L.portrait ? L.win.y + 30 : L.sillY - 120;
    drawChangeBox(
      c,
      bx,
      by,
      money(cu.bill),
      money(cu.cash),
      money(cu.cash - cu.bill),
      s.drawer.warn > 0
    );
  }
  drawJar(c, L.jar.x, L.jar.y, L.jar.w, s.coins);
  const pipTalk = !!s.hint();
  drawPip(
    c,
    L.pip.x,
    L.pip.y,
    L.pip.s,
    t,
    cu?.mood === 'love' || cu?.mood === 'happy' ? 'happy' : 'neutral',
    pipTalk && Math.sin(t * 0.7) > 0
  );
  anchors.pip = { x: L.pip.x, y: L.pip.y - L.pip.s * 1.6 };
  hs('pip', L.pip.x - L.pip.s * 0.5, L.pip.y - L.pip.s * 1.6, L.pip.s, L.pip.s * 1.6);

  // the order card hangs from the awning while the customer waits (or for a delivery)
  const order = s.activeOrder;
  const bubble = bubbleVisible(cu);
  anchors.showCard = !!order && !bubble;
  anchors.bubble = { x: L.card.x, y: L.card.y, w: L.card.w, h: L.card.h };
  if (order && !bubble) {
    const rows = cardRows(order, s.plate.pieces, s.plate.id);
    const head = s.activeOnline
      ? 'NEFIS · ' + (lang === 'tr' ? 'PAKET' : 'DELIVERY')
      : (lang === 'tr' ? 'SİPARİŞ #' : 'ORDER #') + String((cu?.id ?? 0) % 100).padStart(2, '0');
    const who = s.activeOnline ? s.nameOf(s.activeOnline) : cu ? s.nameOf(cu) : '';
    const patience = s.activeOnline
      ? Math.max(0, 1 - s.activeOnline.age / 200)
      : cu
        ? cu.patience / cu.patienceMax
        : 1;
    drawCard(c, L.card, rows, head, who, patience, t, !!s.activeOnline);
  }

  // ---- the work table
  drawTable(c, L);
  drawTrays(c, s, L, t, lang);
  const P = L.plate;
  drawPlateWithPieces(c, s.plate.id, s.plate.pieces, P.x, P.y, P.u, s.t);
  hs('plate', P.x - P.u * 0.6, P.y - P.u * 0.36, P.u * 1.2, P.u * 0.72, s.hand?.k === 'torch');
  if (s.sear) {
    const p = s.plate.pieces.find((x) => x.uid === s.sear!.uid);
    if (p) drawSearDial(c, P.x + p.x * P.u, P.y + p.y * P.u - 70, s.sear.t);
  }
  drawTools(c, s, L, t, lang);
  if (s.squeeze.on || (s.squeeze.a > 0 && s.hand?.k !== 'rice'))
    drawSqueezeGauge(c, P.x, Math.min(L.H - 130, P.y + P.u * 0.3 + 40), s.squeeze.a);
  drawFloating(c, s, L.float.x, L.float.y, P.u, t);
  drawFx(c, s, L);

  // ---- mini-games on top
  drawMini(c, s, L, t);
  hsEnd();
}

function drawCourier(c: Ctx, s: Session, L: Layout, t: number) {
  const cr = s.courier;
  if (!cr) return;
  const k = cr.t / 7;
  const x = L.win.x + L.win.w * (k < 0.5 ? k * 2 * 0.55 : 0.55 + (k - 0.5) * 2 * 0.6) - 40;
  const y = L.win.y + L.win.h * 0.8;
  c.save();
  c.beginPath();
  c.rect(L.win.x, L.win.y, L.win.w, L.win.h);
  c.clip();
  // sled
  rr(c, x - 30, y - 4, 60, 10, 4);
  c.fillStyle = '#c95d5d';
  c.fill();
  c.strokeStyle = '#6e4b32';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - 34, y + 9);
  c.lineTo(x + 30, y + 9);
  c.quadraticCurveTo(x + 38, y + 9, x + 36, y + 2);
  c.stroke();
  rr(c, x - 22, y - 26, 26, 22, 3);
  c.fillStyle = '#e2c08e';
  c.fill();
  text(c, '雪', x - 9, y - 15, 12, '#6e4b32', { font: 'brush', weight: 700 });
  // the penguin courier
  ellipse(c, x + 18, y - 18, 11, 15);
  c.fillStyle = '#2f3644';
  c.fill();
  ellipse(c, x + 20, y - 15, 7, 10);
  c.fillStyle = '#fbf8f2';
  c.fill();
  c.beginPath();
  c.moveTo(x + 27, y - 24);
  c.lineTo(x + 34, y - 22);
  c.lineTo(x + 27, y - 20);
  c.fillStyle = '#f0a23a';
  c.fill();
  c.restore();
  void t;
}

function drawFx(c: Ctx, s: Session, L: Layout) {
  for (const f of s.fx) {
    const k = f.t / f.life;
    let x: number;
    let y: number;
    if (f.space === 'plate') {
      x = L.plate.x + f.x * L.plate.u;
      y = L.plate.y + f.y * L.plate.u;
    } else {
      x = L.cust.x + (f.x - 0.4) * L.W;
      y = f.y * L.H;
    }
    c.globalAlpha = Math.max(0, 1 - k);
    switch (f.kind) {
      case 'heart': {
        const sz = 11 * f.s;
        const yy = y - k * 60;
        c.beginPath();
        c.moveTo(x, yy + sz * 0.9);
        c.bezierCurveTo(x - sz * 1.6, yy - sz * 0.2, x - sz * 0.5, yy - sz * 1.4, x, yy - sz * 0.4);
        c.bezierCurveTo(x + sz * 0.5, yy - sz * 1.4, x + sz * 1.6, yy - sz * 0.2, x, yy + sz * 0.9);
        c.fillStyle = '#e2475a';
        c.fill();
        break;
      }
      case 'sparkle': {
        const sz = 9 * f.s;
        const yy = y - k * 40;
        c.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const r = i % 2 ? sz * 0.3 : sz;
          c.lineTo(x + Math.cos(a) * r, yy + Math.sin(a) * r);
        }
        c.closePath();
        c.fillStyle = '#f2c766';
        c.fill();
        break;
      }
      case 'grain':
        ellipse(c, x, y, 2.4, 1.3, f.t * 6);
        c.fillStyle = '#fffaf0';
        c.fill();
        break;
      case 'flame':
        ellipse(c, x, y - k * 16, 6 * (1 - k) + 2, 10 * (1 - k) + 2);
        c.fillStyle = k < 0.4 ? '#9fd0ff' : '#ffb347';
        c.fill();
        break;
      case 'smoke':
        ellipse(c, x, y - k * 30, 8 + k * 14, 6 + k * 10);
        c.fillStyle = 'rgba(80,70,65,0.4)';
        c.fill();
        break;
      default:
        break;
    }
    c.globalAlpha = 1;
  }
}
