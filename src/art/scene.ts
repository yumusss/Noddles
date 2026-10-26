// Draws one frame of the whole world (three stations side by side) and registers hotspots.

import type { DecorSlot } from '../game/data';
import { getLang, money } from '../game/i18n';
import { type Customer, type Session, COUNTER_X, TABLE_SEATS } from '../game/session';
import { type Ctx, contactShadow, ellipse, rgba, setPx, text, clamp } from './common';
import { drawBoardStation } from './board';
import { hs, hsBegin, hsEnd, hsOrigin } from './hs';
import {
  type Look,
  lookFromSeed,
  SPECIAL_LOOKS,
  drawSeated,
  drawStanding,
  drawAtTable,
  drawInky,
  drawCourier,
  drawHands,
} from './people';
import { drawPrep, drawPlateWithPieces } from './prep';
import {
  type SalonLayout,
  drawCoin,
  drawCounter,
  drawDoorBox,
  drawJarBack,
  drawJarFront,
  drawLanterns,
  drawRegister,
  drawSalonBg,
  drawTable,
  drawTableFood,
  drawTabletProp,
  drawWindowLife,
  salonLayout,
  skyFor,
} from './salon';

export interface ViewInfo {
  W: number;
  H: number;
  portrait: boolean;
  scale: number;
  dpr: number;
}

const lookCache = new Map<number, Look>();
export function lookOf(c: {
  id: number;
  seed: number;
  kid: boolean;
  female: boolean;
  special?: string;
}): Look {
  if (c.special && SPECIAL_LOOKS[c.special as keyof typeof SPECIAL_LOOKS])
    return SPECIAL_LOOKS[c.special as keyof typeof SPECIAL_LOOKS]!;
  let l = lookCache.get(c.seed);
  if (!l) {
    l = lookFromSeed(c.seed, c.kid, c.female);
    lookCache.set(c.seed, l);
  }
  return l;
}

/** screen anchor points the React layer needs (speech bubble, plate, etc.), in world coords */
export const anchors = {
  head: { x: 0, y: 0 },
  plate: { x: 0, y: 0 },
  register: { x: 0, y: 0 },
  tablet: { x: 0, y: 0 },
  tubs: new Map<string, { x: number; y: number }>(),
  serveSpot: { x: 0, y: 0 },
};

export function renderWorld(
  c: Ctx,
  v: ViewInfo,
  camX: number,
  s: Session,
  t: number,
  decor: Record<DecorSlot, string>,
  stations: number
) {
  setPx(v.scale * v.dpr);
  const lang = getLang();
  hsBegin();
  c.save();
  c.translate(-camX, 0);
  for (let i = 0; i < stations; i++) {
    const ox = i * v.W;
    if (ox + v.W < camX - 2 || ox > camX + v.W + 2) continue;
    if (i === 0) drawSalon(c, s, ox, v, t, decor, lang);
    if (i === 1) {
      const L = drawPrep(c, s, ox, v.W, v.H, v.portrait, t, lang);
      anchors.plate = { x: ox + L.plate.x, y: L.plate.y };
      anchors.tubs.clear();
      for (const tb of L.tubs) anchors.tubs.set(tb.ing, { x: ox + tb.x, y: tb.y });
    }
    if (i === 2) drawBoardStation(c, s, ox, v.W, v.H, v.portrait, t, lang);
  }
  drawFx(c, s, v);
  c.restore();
  hsEnd();
}

function salonX(L: SalonLayout, f: number) {
  return f * L.W;
}

function drawSalon(
  c: Ctx,
  s: Session,
  ox: number,
  v: ViewInfo,
  t: number,
  decor: Record<DecorSlot, string>,
  lang: string
) {
  const L = salonLayout(v.W, v.H, v.portrait);
  const sky = skyFor(s.day.time, s.day.rain);
  c.save();
  c.translate(ox, 0);
  hsOrigin(ox);
  drawSalonBg(c, L, s.day.time, s.day.rain, decor, lang);
  drawWindowLife(c, L, t, s.day.time, s.day.rain);
  drawLanterns(c, L, t, sky.lamps, decor.lamp);

  // tables in the back with people eating
  const tableS = v.portrait ? 96 : 110;
  const R = v.portrait ? 19 : 21;
  // two tables, two seats each
  for (const pair of [
    [0, 1],
    [2, 3],
  ]) {
    const xa = salonX(L, TABLE_SEATS[pair[0]]);
    const xb = salonX(L, TABLE_SEATS[pair[1]]);
    const diners = pair.map((i) =>
      s.customers.find((c0) => c0.state === 'table' && c0.table === i)
    );
    diners.forEach((d, k) => {
      if (!d) return;
      c.save();
      c.translate(k ? xb : xa, L.tableY - 6);
      drawAtTable(c, lookOf(d), R, t, pair[k]);
      c.restore();
    });
    drawTable(c, (xa + xb) / 2, L.tableY, (xb - xa) * 0.95 + tableS * 0.4, decor.table);
    diners.forEach((d, k) => d && drawTableFood(c, k ? xb : xa, L.tableY, tableS));
  }

  // door box for takeout
  drawDoorBox(c, L.box.x, L.box.y, L.box.w, !!s.doorBox);

  // walkers (queue, entering, going to tables, leaving)
  const walkY = L.tableY + (L.counterTop - L.tableY) * 0.62;
  const walkers = s.customers.filter((c0) =>
    ['queue', 'enter', 'toTable', 'leave'].includes(c0.state)
  );
  walkers.sort((a, b) => a.x - b.x);
  for (const w of walkers) {
    const look = lookOf(w);
    const moving = Math.abs(w.x - w.toX) > 0.002;
    // entering: grow toward the counter
    const k = w.state === 'enter' ? clamp((w.x - 0.1) / (COUNTER_X - 0.1), 0, 1) : 0;
    const Rw = (v.portrait ? 24 : 26) * (1 + k * 0.25) * (look.kid ? 0.86 : 1);
    const y = walkY + k * 18;
    const x = salonX(L, w.x);
    if (x < -80 || x > L.W + 80) continue;
    contactShadow(c, x, y, Rw * 1.3, Rw * 0.3, 0.25);
    c.save();
    c.translate(x, y);
    if (w.toX < w.x) c.scale(-1, 1);
    drawStanding(c, look, Rw, {
      mood:
        w.state === 'leave' && w.angryLeave
          ? 'angry'
          : w.mood === 'love'
            ? 'happy'
            : w.state === 'queue'
              ? 'neutral'
              : w.mood,
      talk: 0,
      t: t + w.id,
      walk: moving ? (t * 1.6 + w.id * 0.3) % 1 : undefined,
    });
    c.restore();
    if (w.state === 'queue' && w.doorWait > 40 && !w.special) {
      // impatient dots
      text(c, '…', x + Rw, y - Rw * 7.2, 24, '#6e4b32', { weight: 700 });
    }
  }

  // the customer at the counter
  const cu = s.counter;
  const seated =
    cu && ['order', 'wait', 'eat', 'react', 'complain', 'pay'].includes(cu.state) ? cu : null;
  const cx = L.W / 2;
  if (seated) {
    const look = lookOf(seated);
    const R0 = L.headR * (look.kid ? 0.88 : 1);
    const talking = isTalking(s, seated, t);
    const eat = seated.state === 'eat' ? (seated.st * 1.3) % 1 : undefined;
    const sitDrop = look.kid ? 22 : 0;
    c.save();
    c.translate(cx, L.seatY + sitDrop);
    drawSeated(c, look, R0, {
      mood: seated.state === 'eat' ? 'neutral' : seated.mood,
      talk: talking,
      t: t + seated.id,
      eat,
    });
    c.restore();
    anchors.head = { x: ox + cx, y: L.seatY + sitDrop - R0 * (look.kid ? 2.85 : 3.25) - R0 * 1.1 };
    hs('customer', cx - R0 * 1.6, L.seatY - R0 * 4.5, R0 * 3.2, R0 * 4.5);
  } else {
    anchors.head = { x: ox + cx, y: L.seatY - 200 };
  }

  // counter (foreground)
  drawCounter(c, L);
  if (seated) {
    const look = lookOf(seated);
    const R0 = L.headR * (look.kid ? 0.88 : 1);
    drawHands(c, look, R0, cx, L.counterTop + 16, seated.state === 'eat' ? t : 0);
  }

  // served plate in front of the customer
  const SP = L.servedPlate;
  anchors.serveSpot = { x: ox + SP.x, y: SP.y };
  if (s.served) {
    const eatK =
      seated?.state === 'eat'
        ? Math.min(1, seated.st / 2.4)
        : seated && seated.state !== 'wait'
          ? 1
          : 0;
    const visible = s.served.plate.pieces.filter((_, i, arr) => i >= Math.floor(arr.length * eatK));
    const slide = Math.min(1, s.served.t / 0.35);
    c.save();
    c.translate(0, (1 - slide) * 40);
    drawPlateWithPieces(c, s.served.plate.id, visible, SP.x, SP.y, SP.u, s.t + 10);
    c.restore();
  } else if (s.hand?.k === 'plate' && seated?.state === 'wait') {
    // a soft target where the plate will go
    ellipse(c, SP.x, SP.y, SP.u * 0.5, SP.u * 0.25);
    c.fillStyle = `rgba(239,143,122,${0.15 + Math.sin(t * 5) * 0.08})`;
    c.fill();
    c.setLineDash([8, 6]);
    c.strokeStyle = '#ef8f7a';
    c.lineWidth = 3;
    c.stroke();
    c.setLineDash([]);
    hs('customer', SP.x - SP.u * 0.5, SP.y - SP.u * 0.3, SP.u, SP.u * 0.6);
  }

  // register
  const RG = L.register;
  const paying = cu?.state === 'pay';
  drawRegister(
    c,
    RG.x,
    RG.y + RG.w * 0.55,
    RG.w,
    paying ? money(cu!.bill) : money(0),
    s.drawer.open ? 1 : 0,
    t
  );
  anchors.register = { x: ox + RG.x, y: RG.y };
  hs('register', RG.x - RG.w / 2, RG.y - RG.w * 0.3, RG.w, RG.w * 0.9);

  // tablet (day 10+)
  if (s.day.online) {
    const TB = L.tablet;
    const ring = !!s.ringing;
    const open = s.online.filter((o) => o.status === 'waiting').length;
    drawTabletProp(c, TB.x, TB.y, TB.w, TB.h, ring, t, open);
    anchors.tablet = { x: ox + TB.x, y: TB.y - TB.h };
    hs('tablet', TB.x - TB.w / 2 - 10, TB.y - TB.h * 1.1, TB.w + 20, TB.h * 1.2);
  } else if (s.n >= 1) {
    // before day 10 the tablet still lives on the counter (reviews, ingredients)
    const TB = L.tablet;
    drawTabletProp(c, TB.x, TB.y, TB.w, TB.h, false, t, 0);
    anchors.tablet = { x: ox + TB.x, y: TB.y - TB.h };
    hs('tablet', TB.x - TB.w / 2 - 10, TB.y - TB.h * 1.1, TB.w + 20, TB.h * 1.2);
  }

  // tip jar
  const J = L.jar;
  drawJarBack(c, J.x, J.y + J.w * 1.25, J.w);
  for (const coin of s.coins) {
    const y = J.y + J.w * 1.25 - 10 - (1 - coin.y) * J.w * 0.9;
    if (coin.y < -0.2) continue;
    drawCoin(
      c,
      J.x + coin.x * J.w * 0.55,
      Math.min(y, J.y + J.w * 1.2),
      J.w * 0.12,
      coin.kind,
      coin.rot
    );
  }
  drawJarFront(c, J.x, J.y + J.w * 1.25, J.w);

  // Inky
  const I = L.inky;
  c.save();
  c.translate(I.x, I.y + I.s * 0.45);
  const inkyMood =
    s.served && seated && (seated.mood === 'love' || seated.mood === 'happy')
      ? 'happy'
      : seated?.state === 'order'
        ? 'wave'
        : 'idle';
  drawInky(c, I.s, t, inkyMood);
  c.restore();
  hs('inky', I.x - I.s / 2, I.y, I.s, I.s * 0.9);

  // courier
  for (const cr of s.couriers) {
    const k = cr.t;
    const bx = L.box.x;
    let x: number;
    if (k < 2.6) x = -160 + (bx + 60 + 160) * Math.min(1, k / 2.6);
    else if (k < 4) x = bx + 60;
    else x = bx + 60 - (k - 4) * 220;
    c.save();
    c.translate(x, L.box.y + 60);
    if (k >= 4) c.scale(-1, 1);
    drawCourier(c, 80, t);
    c.restore();
  }

  // a warm rim light for evening
  if (sky.lamps >= 1) {
    c.fillStyle = rgba('#ffcf8a', 0.06);
    c.fillRect(0, L.counterTop, L.W, L.H - L.counterTop);
  }
  c.restore();
  hsOrigin(0);
}

export function isTalking(s: Session, cu: Customer, t: number): number {
  if (cu.state === 'order') {
    const shown = cu.sayAt * 32;
    if (shown < cu.say().length) return (Math.sin(t * 22) + 1) / 2;
  }
  if ((cu.state === 'react' || cu.state === 'complain' || cu.state === 'pay') && cu.st < 1.4)
    return (Math.sin(t * 22) + 1) / 2;
  void s;
  return 0;
}

function heart(c: Ctx, x: number, y: number, s: number) {
  c.beginPath();
  c.moveTo(x, y + s * 0.9);
  c.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.5, y - s * 1.4, x, y - s * 0.4);
  c.bezierCurveTo(x + s * 0.5, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
  c.fillStyle = '#e2475a';
  c.fill();
  ellipse(c, x - s * 0.45, y - s * 0.45, s * 0.25, s * 0.15, -0.5);
  c.fillStyle = 'rgba(255,255,255,0.7)';
  c.fill();
}

function sparkle(c: Ctx, x: number, y: number, s: number) {
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const r = i % 2 ? s * 0.3 : s;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
  c.fillStyle = '#f2c766';
  c.fill();
}

function drawFx(c: Ctx, s: Session, v: ViewInfo) {
  for (const f of s.fx) {
    const k = f.t / f.life;
    const ox = f.station * v.W;
    let x: number;
    let y: number;
    if (f.station === 0) {
      x = ox + f.x * v.W;
      y = f.y * v.H;
    } else if (f.station === 1) {
      x = anchors.plate.x + f.x * 300;
      y = anchors.plate.y + f.y * 300;
    } else {
      x = ox + f.x * v.W;
      y = f.y * v.H;
    }
    c.globalAlpha = 1 - k;
    switch (f.kind) {
      case 'heart':
        heart(c, x, y - k * 60, 11 * f.s);
        break;
      case 'sparkle':
        sparkle(c, x, y - k * 40, 9 * f.s);
        break;
      case 'grain':
        ellipse(c, x, y, 2.4, 1.3, f.t * 6);
        c.fillStyle = '#fffaf0';
        c.fill();
        break;
      case 'smoke':
      case 'steam':
        ellipse(c, x + Math.sin(f.t * 3) * 6, y, 10 + k * 18, 8 + k * 14);
        c.fillStyle = f.kind === 'smoke' ? 'rgba(80,70,65,0.35)' : 'rgba(255,255,255,0.45)';
        c.fill();
        break;
      default:
        break;
    }
    c.globalAlpha = 1;
  }
}
