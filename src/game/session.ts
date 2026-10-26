// One working day: customers, the bowl, the three stations, input and rendering.
import { Engine, type View } from '../core/engine';
import { PAL, TOD_LIGHT, clamp, lerp, rgba, type Ctx } from '../art/common';
import {
  drawBowlTop,
  drawTub,
  drawNoodleTray,
  drawPot,
  drawBowlIcon,
  PIECE_SIZE,
  PIECE_VARIANTS,
  drawPiece,
} from '../art/food';
import {
  prepLayout,
  drawPrepBack,
  drawSlotLocked,
  drawGauge,
  drawCookRing,
  drawPointerHint,
  type PrepLayout,
} from '../art/prep';
import { kamadoLayout, drawKamadoBack, drawKamadoFront, type KamadoLayout } from '../art/kamado';
import {
  salonLayout,
  drawSalonBack,
  drawSalonFront,
  drawSalonLight,
  type SalonLayout,
  type Diner,
} from '../art/salon';
import { drawAvatar, avatarImage, randomLook, preloadAvatar, type Mood } from '../art/avatar';
import { drawCat, type CatPose } from '../art/cat';
import { drawScooter } from '../art/courier';
import { ParticleSystem } from '../art/fx';
import {
  BOWLS,
  INGREDIENTS,
  LEVELS,
  THICK_LABEL,
  unlockedUpTo,
  type Level,
  type Thick,
} from './data';
import {
  BOWL_C,
  BOWL_R,
  BOWL_SPACE,
  cookOf,
  freeSpot,
  inBowl,
  newBowl,
  type BowlState,
  type CookState,
  COOK_LABEL,
} from './bowl';
import { dayCustomers, judge, orderLines, reactionLine, starsFor, type Customer } from './orders';
import {
  DENOMS,
  cashGiven,
  cost,
  emptyLedger,
  net,
  paid,
  price,
  sum,
  tip,
  type DayLedger,
  type Denom,
} from './money';
import { tipBonus, type DecorState } from './decor';
import { sfx, buzz } from './audio';

export type Phase =
  | 'enter'
  | 'greet'
  | 'order'
  | 'ring'
  | 'cooking'
  | 'served'
  | 'eating'
  | 'react'
  | 'pay'
  | 'delivering'
  | 'leave'
  | 'dayEnd';

export interface Bubble {
  name: string;
  text: string; // full text
  shown: number; // characters revealed
  phone?: boolean;
  tone?: 'good' | 'bad' | 'neutral';
}

export interface CashUI {
  due: number;
  given: Denom[];
  giving: Denom[];
  result?: 'ok' | 'less' | 'more';
  tipAmount: number;
}

export interface DayResult {
  level: number;
  ledger: DayLedger;
  scores: number[];
  avg: number;
  stars: number;
  cashBefore: number;
  cashAfter: number;
}

export interface Hint {
  station: number;
  x: number;
  y: number;
  text: string;
}

export interface UiSnapshot {
  phase: Phase;
  customerIdx: number;
  customerCount: number;
  bubble: Bubble | null;
  ticket: string[] | null;
  ticketPhone: boolean;
  cash: CashUI | null;
  earned: number;
  cook: CookState | null;
  cookWhere: 'prep' | 'stove' | 'hand' | null;
  score: number | null;
  toast: string | null;
  hint: Hint | null;
  station: number;
  ringing: boolean;
}

type Drag =
  | {
      kind: 'pan';
      lastX: number;
      lastT: number;
      vel: number;
      startX: number;
      startY: number;
      moved: boolean;
    }
  | { kind: 'bowl'; ox: number; oy: number }
  | { kind: 'tub'; id: string; sx: number; sy: number; moved: boolean; x: number; y: number }
  | { kind: 'hold'; id: string }
  | { kind: 'tap'; target: string; sx: number; sy: number };

interface Fly {
  id: string;
  v: number;
  x: number;
  y: number;
  tx: number;
  ty: number; // world target
  t: number;
  bx: number;
  by: number; // bowl-space destination
}

interface CatState {
  pose: CatPose;
  spot: number;
  x: number;
  y: number;
  tx: number;
  flip: boolean;
  timer: number;
}

const COOK_RATE = 8.2; // progress units per second on the stove
const FILL_RATE = 0.62; // fill per second while holding a pot

export class DaySession {
  engine: Engine;
  level: Level;
  customers: Customer[];
  idx = -1;
  phase: Phase = 'enter';
  phaseT = 0;
  ledger: DayLedger;
  scores: number[] = [];
  decor: DecorState;
  cashBefore: number;
  bowl: BowlState = newBowl();
  bowlAt: 'prep' | 'stove' | 'hand' | 'counter' | 'box' = 'prep';
  bowlPos = { x: 0, y: 0 };
  bowlLift = 0;
  bubble: Bubble | null = null;
  ticket: string[] | null = null;
  cash: CashUI | null = null;
  lastScore: number | null = null;
  toast: string | null = null;
  toastT = 0;
  earned = 0;
  waitT = 0;
  typeT = 0;
  prepL!: PrepLayout;
  kamL!: KamadoLayout;
  salL!: SalonLayout;
  private drag: Drag | null = null;
  private pointer = { x: 0, y: 0, sx: 0, sy: 0, down: false };
  private flies: Fly[] = [];
  private fx = new ParticleSystem();
  private cat: CatState = { pose: 'sit', spot: 1, x: 0, y: 0, tx: 0, flip: false, timer: 2 };
  diners: (Diner & { leaveT: number; seed: number })[] = [];
  private seedCounter = 1;
  private scooter: { x: number; t: number } | null = null;
  private tipCoins: number;
  private heat = 0.15;
  private tutorialDone = new Set<string>();
  private unlocked: Set<string>;
  private nextUnlock: Set<string>;
  private lastCook: CookState = 'raw';
  private listeners = new Set<() => void>();
  private snap: UiSnapshot | null = null;
  private ringT = 0;
  private customerMood: Mood = 'neutral';
  private customerEating = false;
  private customerY = 0; // 0..1 enter animation
  private servedBowl: BowlState | null = null;
  private dayOver = false;
  onDayEnd: ((r: DayResult) => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    levelId: number,
    decor: DecorState,
    cash: number,
    tipCoins: number
  ) {
    this.engine = new Engine(canvas);
    this.level = LEVELS[levelId - 1];
    this.customers = dayCustomers(levelId);
    this.ledger = emptyLedger(levelId);
    this.decor = decor;
    this.cashBefore = cash;
    this.tipCoins = tipCoins;
    this.unlocked = new Set(unlockedUpTo(levelId));
    this.nextUnlock = new Set(LEVELS[levelId]?.unlock ?? []);
    this.layout(this.engine.view);
    this.engine.onResize = (v) => this.layout(v);
    this.engine.onFrame = (c, v, t, dt) => this.frame(c, v, t, dt);
    this.engine.camX = 0;
    this.resetBowl();
    // pre-seat a couple of diners
    const seats = this.salL.seats.length;
    for (let i = 0; i < Math.min(2, seats); i++) this.seatDiner(60 + Math.random() * 60);
    this.cat.x = this.salL.catSpots[1].x;
    this.cat.y = this.salL.catSpots[1].y;
    this.cat.tx = this.cat.x;
    for (const cu of this.customers) preloadAvatar(cu.look, ['neutral', 'happy']);
    this.bindInput(canvas);
    this.engine.start();
    this.nextCustomer(1.2);
  }

  destroy() {
    this.engine.destroy();
  }

  // ---------- React bridge ----------
  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private notify() {
    this.snap = null;
    for (const l of this.listeners) l();
  }
  snapshot(): UiSnapshot {
    if (this.snap) return this.snap;
    const cu = this.customers[this.idx];
    this.snap = {
      phase: this.phase,
      customerIdx: this.idx,
      customerCount: this.customers.length,
      bubble: this.bubble ? { ...this.bubble } : null,
      ticket: this.ticket,
      ticketPhone: !!cu?.phone,
      cash: this.cash ? { ...this.cash, giving: [...this.cash.giving] } : null,
      earned: this.earned,
      cook: this.bowl.noodle ? cookOf(this.bowl) : null,
      cookWhere:
        this.bowlAt === 'stove'
          ? 'stove'
          : this.bowlAt === 'hand'
            ? 'hand'
            : this.bowlAt === 'prep'
              ? 'prep'
              : null,
      score: this.lastScore,
      toast: this.toast,
      hint: this.currentHint(),
      station: this.engine.station,
      ringing: this.phase === 'ring',
    };
    return this.snap;
  }

  jumpTo(i: number) {
    this.engine.snapTo(i);
    sfx('whoosh');
  }

  showToast(t: string) {
    this.toast = t;
    this.toastT = 2.4;
    this.notify();
  }

  // ---------- layout ----------
  private layout(v: View) {
    this.prepL = prepLayout(v.W, v.H);
    this.kamL = kamadoLayout(v.W, v.H);
    this.salL = salonLayout(v.W, v.H, this.decor);
    if (this.bowlAt === 'prep') this.bowlPos = { x: v.W + this.prepL.bowl.x, y: this.prepL.bowl.y };
    if (this.bowlAt === 'stove')
      this.bowlPos = { x: 2 * v.W + this.kamL.bowl.x, y: this.kamL.bowl.y };
    this.notify();
  }

  private resetBowl(style?: string) {
    this.bowl = newBowl(style ?? this.bowl.style ?? 'kirmizi');
    this.bowlAt = 'prep';
    const v = this.engine.view;
    this.bowlPos = { x: v.W + this.prepL.bowl.x, y: this.prepL.bowl.y };
    this.bowlLift = 0;
    this.lastCook = 'raw';
  }

  // ---------- customers ----------
  private get customer(): Customer | undefined {
    return this.customers[this.idx];
  }

  private nextCustomer(delay: number) {
    this.phase = 'leave';
    this.phaseT = -delay;
    this.bubble = null;
    this.ticket = null;
    this.cash = null;
    this.notify();
  }

  private startCustomer() {
    this.idx++;
    if (this.idx >= this.customers.length) {
      this.endDay();
      return;
    }
    const cu = this.customer!;
    this.customerMood = 'neutral';
    this.customerEating = false;
    this.customerY = 0;
    this.lastScore = null;
    this.waitT = 0;
    if (cu.phone) {
      this.phase = 'ring';
      this.ringT = 0;
      sfx('phone');
    } else {
      this.phase = 'enter';
      sfx('door');
    }
    this.phaseT = 0;
    this.notify();
  }

  answerPhone() {
    if (this.phase !== 'ring') return;
    const cu = this.customer!;
    this.setBubble(cu.name, cu.greet + ' ' + cu.text, true);
    this.ticket = orderLines(cu.order);
    this.phase = 'cooking';
    this.phaseT = 0;
    sfx('tap');
    this.notify();
  }

  private setBubble(name: string, text: string, phone = false, tone: Bubble['tone'] = 'neutral') {
    this.bubble = { name, text, shown: 0, phone, tone };
    this.typeT = 0;
    this.notify();
  }

  private endDay() {
    if (this.dayOver) return;
    this.dayOver = true;
    this.phase = 'dayEnd';
    const avg = this.scores.length ? sum(this.scores) / this.scores.length : 0;
    const stars = starsFor(avg);
    const r: DayResult = {
      level: this.level.id,
      ledger: this.ledger,
      scores: this.scores,
      avg,
      stars,
      cashBefore: this.cashBefore,
      cashAfter: this.cashBefore + net(this.ledger),
    };
    this.notify();
    setTimeout(() => this.onDayEnd?.(r), 900);
  }

  get tipJarCoins() {
    return this.tipCoins;
  }

  // ---------- serving ----------
  private serve(viaBox: boolean) {
    const cu = this.customer!;
    const v = judge(cu.order, this.bowl, this.waitT);
    const p = price(cu.order);
    const pay = paid(v.score, p);
    const bonus = tipBonus(this.decor);
    const tp = tip(v.score, p, bonus);
    this.scores.push(v.score);
    this.lastScore = v.score;
    this.ledger.ingredients += cost(this.bowl);
    this.ledger.bowls++;
    this.servedBowl = this.bowl;
    this.bowl = newBowl(this.bowl.style);
    if (viaBox) {
      this.bowlAt = 'box';
      this.phase = 'delivering';
      this.phaseT = 0;
      this.scooter = { x: this.salL.deliveryBox.x, t: 0 };
      sfx('scooter');
      this.ledger.sales += pay;
      this.ledger.tips += tp;
      this.earned += pay + tp;
      this.tipCoins += tp > 0 ? 1 : 0;
      this.pendingReaction = {
        text: `Uygulama: "${reactionLine(cu, v.score)}" ★${(v.score / 20).toFixed(1)}`,
        tone: v.score >= 70 ? 'good' : v.score >= 45 ? 'neutral' : 'bad',
        notes: v.notes,
      };
      this.pendingPay = { pay, tp };
    } else {
      this.bowlAt = 'counter';
      this.phase = 'served';
      this.phaseT = 0;
      this.customerMood = 'happy';
      this.customerEating = true;
      sfx('place');
      this.pendingReaction = {
        text: reactionLine(cu, v.score),
        tone: v.score >= 70 ? 'good' : v.score >= 45 ? 'neutral' : 'bad',
        notes: v.notes.concat(v.praise),
      };
      this.pendingPay = { pay, tp };
    }
    this.bubble = null;
    this.ticket = null;
    if (v.score >= 85) this.fx.emit('sparkle', this.bowlPos.x, this.bowlPos.y - 40, 14, 60);
    this.notify();
  }
  private pendingReaction: { text: string; tone: Bubble['tone']; notes: string[] } | null = null;
  private pendingPay: { pay: number; tp: number } | null = null;

  // ---------- cash ----------
  giveDenom(d: Denom) {
    if (!this.cash || this.cash.result === 'ok') return;
    this.cash.giving.push(d);
    this.cash.result = undefined;
    sfx('tap');
    this.notify();
  }
  takeBack(i: number) {
    if (!this.cash || this.cash.result === 'ok') return;
    this.cash.giving.splice(i, 1);
    this.cash.result = undefined;
    sfx('tap');
    this.notify();
  }
  confirmChange() {
    if (!this.cash || this.cash.result === 'ok') return;
    const need = sum(this.cash.given) - this.cash.due;
    const give = sum(this.cash.giving);
    const cu = this.customer!;
    if (give === need) {
      this.cash.result = 'ok';
      sfx('coins');
    } else if (give < need) {
      this.cash.result = 'less';
      this.ledger.changeMistakes++;
      this.setBubble(cu.name, 'Hmm, para üstü eksik geldi…', false, 'bad');
      sfx('fail');
      this.notify();
      return;
    } else {
      this.cash.result = 'ok';
      this.ledger.overChange += give - need;
      this.ledger.changeMistakes++;
      this.setBubble(cu.name, 'Fazla verdin ama… teşekkürler!', false, 'neutral');
      sfx('coins');
    }
    // tip & leave
    const tp = this.cash.tipAmount;
    if (tp > 0) {
      this.tipCoins += 1;
      const j = this.salL.tipJar;
      this.fx.emit('coin', j.x + j.w / 2, j.y - 10, Math.min(6, tp), 20);
      sfx('ding');
      this.setBubble(
        cu.name,
        tp >= 10
          ? `Bahşiş kavanozuna ${tp} ₺ bıraktım. Harikaydı!`
          : `Bahşiş: ${tp} ₺. Teşekkürler şef!`,
        false,
        'good'
      );
    }
    this.ledger.tips += tp;
    this.earned += tp;
    this.customerMood = tp > 0 ? 'love' : this.customerMood;
    this.cash = null;
    this.phase = 'leave';
    this.phaseT = -1.6;
    this.notify();
  }

  // ---------- input ----------
  private bindInput(el: HTMLElement) {
    el.style.touchAction = 'none';
    const pos = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { sx: e.clientX - r.left, sy: e.clientY - r.top };
    };
    el.addEventListener('pointerdown', (e) => {
      if (this.pointer.down) return;
      el.setPointerCapture(e.pointerId);
      const { sx, sy } = pos(e);
      const w = this.engine.toWorld(sx, sy);
      this.pointer = { x: w.x, y: w.y, sx, sy, down: true };
      this.onDown(w.x, w.y, sx, sy);
    });
    el.addEventListener('pointermove', (e) => {
      if (!this.pointer.down) return;
      const { sx, sy } = pos(e);
      const w = this.engine.toWorld(sx, sy);
      this.pointer.x = w.x;
      this.pointer.y = w.y;
      this.pointer.sx = sx;
      this.pointer.sy = sy;
      this.onMove(w.x, w.y, sx, sy);
    });
    const up = (e: PointerEvent) => {
      if (!this.pointer.down) return;
      this.pointer.down = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      this.onUp();
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  private hit(r: { x: number; y: number; w: number; h: number }, x: number, y: number, pad = 0) {
    return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
  }

  private onDown(x: number, y: number, sx: number, sy: number) {
    const v = this.engine.view;
    const st = Math.floor(x / v.W);
    const lx = x - st * v.W;
    // the bowl (any station) first
    if (this.bowlAt === 'prep' || this.bowlAt === 'stove') {
      const r = this.bowlAt === 'prep' ? this.prepL.bowl.size / 2 : this.kamL.bowl.size / 2;
      if (Math.hypot(x - this.bowlPos.x, y - this.bowlPos.y) < r + 14) {
        this.drag = { kind: 'bowl', ox: x - this.bowlPos.x, oy: y - this.bowlPos.y };
        this.bowlAt = 'hand';
        sfx('pick');
        buzz(8);
        this.notify();
        return;
      }
    }
    if (st === 1) {
      const L = this.prepL;
      for (let i = 0; i < L.tubs.length; i++) {
        const id = TOPPINGS[i];
        if (!id || !this.hit(L.tubs[i], lx, y, 6)) continue;
        if (!this.unlocked.has(id)) {
          if (this.nextUnlock.has(id)) this.drag = { kind: 'tap', target: 'locked', sx, sy };
          else continue;
          return;
        }
        this.drag = { kind: 'tub', id, sx, sy, moved: false, x, y };
        return;
      }
      for (let i = 0; i < L.pots.length; i++) {
        const id = LIQUIDS[i];
        if (!id || !this.hit(L.pots[i], lx, y, 6)) continue;
        if (!this.unlocked.has(id)) continue;
        this.drag = { kind: 'hold', id };
        if (this.bowl.broth !== id) {
          if (this.bowl.broth && this.bowl.fill > 0.05) this.ledger.waste += 2;
          this.bowl.broth = id;
          this.bowl.fill = Math.min(this.bowl.fill, 0.25);
        }
        return;
      }
      for (let i = 0; i < L.trays.length; i++) {
        if (this.hit(L.trays[i], lx, y, 6)) {
          this.drag = { kind: 'tap', target: 'tray:' + NOODLES[i], sx, sy };
          return;
        }
      }
      for (let i = 0; i < L.shelf.slots.length; i++) {
        const s = L.shelf.slots[i];
        if (Math.hypot(lx - s.x, y - s.y) < 34) {
          this.drag = { kind: 'tap', target: 'shelf:' + BOWLS[i].id, sx, sy };
          return;
        }
      }
      if (this.hit(L.thickChips, lx, y, 4)) {
        const k = Math.floor(((lx - L.thickChips.x) / L.thickChips.w) * 3);
        this.drag = {
          kind: 'tap',
          target: 'thick:' + (['ince', 'orta', 'kalin'] as Thick[])[clamp(k, 0, 2)],
          sx,
          sy,
        };
        return;
      }
      if (this.hit(L.trash, lx, y, 6)) {
        this.drag = { kind: 'tap', target: 'trash', sx, sy };
        return;
      }
    }
    if (st === 0) {
      const S = this.salL;
      if (this.hit(S.phone, lx, y, 14)) {
        this.drag = { kind: 'tap', target: 'phone', sx, sy };
        return;
      }
      if (this.hit(S.tipJar, lx, y, 10)) {
        this.drag = { kind: 'tap', target: 'jar', sx, sy };
        return;
      }
      if (Math.hypot(lx - this.cat.x, y - this.cat.y + 30) < 60) {
        this.drag = { kind: 'tap', target: 'cat', sx, sy };
        return;
      }
    }
    this.drag = {
      kind: 'pan',
      lastX: sx,
      lastT: performance.now(),
      vel: 0,
      startX: sx,
      startY: sy,
      moved: false,
    };
    this.engine.camTarget = null;
    this.engine.camVel = 0;
  }

  private onMove(x: number, y: number, sx: number, sy: number) {
    const d = this.drag;
    if (!d) return;
    const v = this.engine.view;
    if (d.kind === 'pan') {
      const now = performance.now();
      const dx = sx - d.lastX;
      if (Math.abs(sx - d.startX) > 6 || Math.abs(sy - d.startY) > 6) d.moved = true;
      this.engine.camX = clamp(this.engine.camX - dx / v.scale, -40, this.engine.maxCam + 40);
      const dt = Math.max(1, now - d.lastT) / 1000;
      d.vel = lerp(d.vel, -dx / v.scale / dt, 0.5);
      d.lastX = sx;
      d.lastT = now;
    } else if (d.kind === 'bowl') {
      this.bowlPos = { x: x - d.ox, y: y - d.oy };
    } else if (d.kind === 'tub') {
      if (!d.moved && Math.hypot(sx - d.sx, sy - d.sy) > 12) {
        d.moved = true;
        sfx('pick');
      }
      d.x = x;
      d.y = y;
    } else if (d.kind === 'tap') {
      if (Math.hypot(sx - d.sx, sy - d.sy) > 14) {
        this.drag = {
          kind: 'pan',
          lastX: sx,
          lastT: performance.now(),
          vel: 0,
          startX: d.sx,
          startY: d.sy,
          moved: true,
        };
        this.engine.camTarget = null;
      }
    }
  }

  private onUp() {
    const d = this.drag;
    this.drag = null;
    if (!d) return;
    const v = this.engine.view;
    if (d.kind === 'pan') {
      if (d.moved) {
        const vel = d.vel;
        if (Math.abs(vel) > 500) this.engine.snapTo(this.engine.station + (vel > 0 ? 1 : -1));
        else this.engine.snapTo(Math.round(this.engine.camX / v.W));
      } else this.engine.snapTo(this.engine.station);
      return;
    }
    if (d.kind === 'bowl') return this.dropBowl();
    if (d.kind === 'hold') return;
    if (d.kind === 'tub') {
      if (!d.moved) return this.addPiece(d.id, null);
      // dropped: inside the bowl?
      const b = this.bowlSpace(d.x, d.y);
      if (b && inBowl(b.x, b.y, 6)) this.addPiece(d.id, b);
      else {
        this.ledger.waste += INGREDIENTS[d.id].cost;
        sfx('trash');
      }
      return;
    }
    if (d.kind === 'tap') this.tap(d.target);
  }

  /** world → bowl space (if the bowl is at prep/stove/hand) */
  private bowlSpace(x: number, y: number) {
    const size = this.bowlSize();
    const k = BOWL_SPACE / size;
    return { x: BOWL_C + (x - this.bowlPos.x) * k, y: BOWL_C + (y - this.bowlPos.y) * k };
  }

  private bowlSize() {
    return this.bowlAt === 'stove' ? this.kamL.bowl.size : this.prepL.bowl.size;
  }

  private tap(target: string) {
    const v = this.engine.view;
    if (target === 'locked')
      return this.showToast('Bu malzeme henüz defterde yok. İlerleyen günlerde açılacak!');
    if (target.startsWith('tray:')) {
      const id = target.slice(5);
      if (!this.unlocked.has(id)) return this.showToast('Bu erişte henüz menüde değil.');
      if (this.bowlAt !== 'prep') return this.showToast('Önce kaseyi tezgâha koy.');
      if (this.bowl.progress > 0)
        return this.showToast('Pişen erişte değiştirilemez. Kaseyi çöpe at.');
      this.bowl.noodle = id;
      this.bowl.progress = 0;
      this.tutorialDone.add('noodle');
      sfx('place');
      buzz(6);
      this.notify();
      return;
    }
    if (target.startsWith('thick:')) {
      const t = target.slice(6) as Thick;
      this.bowl.thick = t;
      sfx('tap');
      this.notify();
      return;
    }
    if (target.startsWith('shelf:')) {
      const id = target.slice(6);
      const b = BOWLS.find((x) => x.id === id)!;
      if (b.unlock > this.level.id)
        return this.showToast(`${b.name} kase ${b.unlock}. günde raftan iner.`);
      if (this.bowlAt !== 'prep') return this.showToast('Önce kaseyi tezgâha koy.');
      this.bowl.style = id;
      sfx('pop');
      this.notify();
      return;
    }
    if (target === 'trash') {
      if (this.bowlAt !== 'prep') return;
      if (!this.bowl.noodle && !this.bowl.broth && !this.bowl.pieces.length) return;
      this.ledger.waste += cost(this.bowl);
      this.resetBowl();
      sfx('trash');
      this.showToast('Kase boşaltıldı (israf deftere yazıldı).');
      return;
    }
    if (target === 'phone') {
      if (this.phase === 'ring') this.answerPhone();
      else sfx('tap');
      return;
    }
    if (target === 'jar') {
      const j = this.salL.tipJar;
      this.fx.emit('sparkle', j.x + j.w / 2, j.y + j.h / 2, 6, 24);
      sfx('coins');
      return;
    }
    if (target === 'cat') {
      sfx('cat');
      this.fx.emit('heart', this.cat.x, this.cat.y - 60, 3, 16);
      if (this.cat.pose === 'sleep') this.cat.pose = 'sit';
      return;
    }
    void v;
  }

  private addPiece(id: string, at: { x: number; y: number } | null) {
    if (this.bowlAt !== 'prep') return this.showToast('Önce kaseyi tezgâha koy.');
    if (this.bowl.pieces.length >= 28) return this.showToast('Kase doldu!');
    const i = TOPPINGS.indexOf(id);
    const tub = this.prepL.tubs[i];
    const rand = Math.random;
    const dest = at ?? freeSpot(this.bowl, rand, (PIECE_SIZE[id] ?? 30) / 2);
    const v = this.engine.view;
    const size = this.prepL.bowl.size;
    const k = size / BOWL_SPACE;
    this.flies.push({
      id,
      v: Math.floor(rand() * (PIECE_VARIANTS[id] ?? 1)),
      x: v.W + tub.x + tub.w / 2,
      y: tub.y + tub.h / 2,
      tx: this.bowlPos.x + (dest.x - BOWL_C) * k,
      ty: this.bowlPos.y + (dest.y - BOWL_C) * k,
      t: at ? 1 : 0,
      bx: dest.x,
      by: dest.y,
    });
    sfx('pop');
    buzz(5);
    this.tutorialDone.add('topping');
  }

  private landFly(f: Fly) {
    this.bowl.pieces.push({
      id: f.id,
      x: f.bx,
      y: f.by,
      rot: Math.random() * Math.PI * 2,
      v: f.v,
      s: 0.9 + Math.random() * 0.2,
    });
    sfx('place');
    this.notify();
  }

  private dropBowl() {
    const v = this.engine.view;
    const { x, y } = this.bowlPos;
    const st = Math.floor(x / v.W);
    const lx = x - st * v.W;
    // stove
    if (
      st === 2 &&
      Math.hypot(lx - this.kamL.ring.x, y - this.kamL.ring.y) < this.kamL.ring.r + 40
    ) {
      this.bowlAt = 'stove';
      this.bowlPos = { x: 2 * v.W + this.kamL.bowl.x, y: this.kamL.bowl.y };
      sfx('place');
      if (this.bowl.noodle) sfx('sizzle');
      this.tutorialDone.add('stove');
      this.notify();
      return;
    }
    if (st === 0 && this.phase === 'cooking') {
      const cu = this.customer!;
      const S = this.salL;
      if (cu.phone) {
        if (this.hit(S.deliveryBox, lx, y, 70)) {
          this.bowlPos = {
            x: S.deliveryBox.x + S.deliveryBox.w / 2,
            y: S.deliveryBox.y + S.deliveryBox.h / 2,
          };
          this.serve(true);
          return;
        }
        this.showToast('Paket siparişi kapıdaki kutuya bırak.');
      } else if (Math.abs(lx - S.customer.x) < v.W * 0.3 && y < S.counterTop + 140) {
        this.bowlPos = { x: S.customer.x + S.customer.size * 0.42, y: S.counterTop + 30 };
        this.serve(false);
        return;
      }
    } else if (st === 0 && this.bowl.noodle)
      this.showToast(
        this.phase === 'ring' ? 'Önce telefona bak!' : 'Müşteri henüz sipariş vermedi.'
      );
    // back to prep
    this.bowlAt = 'prep';
    this.bowlPos = { x: v.W + this.prepL.bowl.x, y: this.prepL.bowl.y };
    sfx('place');
    this.notify();
  }

  // ---------- diners & cat ----------
  private seatDiner(stay: number) {
    const used = new Set(this.diners.map((d) => d.seat));
    const free = this.salL.seats.map((_, i) => i).filter((i) => !used.has(i));
    if (!free.length) return;
    const seat = free[Math.floor(Math.random() * free.length)];
    const seed = (this.seedCounter++ * 7919) % 100000;
    this.diners.push({ seat, img: null, bob: Math.random() * 6, eating: true, leaveT: stay, seed });
  }

  private updateCat(dt: number) {
    const c = this.cat;
    c.timer -= dt;
    if (c.pose === 'walk') {
      const dir = Math.sign(c.tx - c.x);
      c.x += dir * 70 * dt;
      c.flip = dir < 0;
      if (Math.abs(c.tx - c.x) < 4) {
        c.x = c.tx;
        c.pose = (['sit', 'loaf', 'sleep', 'sit', 'stretch'] as CatPose[])[
          Math.floor(Math.random() * 5)
        ];
        c.timer = 4 + Math.random() * 7;
      }
    } else if (c.timer <= 0) {
      const spots = this.salL.catSpots;
      const i = Math.floor(Math.random() * spots.length);
      const s = spots[i];
      if (i !== c.spot && (i === 0 || c.spot === 0)) {
        // hop between counter and floor: teleport-ish with a little jump
        c.x = s.x;
        c.y = s.y;
        c.tx = s.x;
        c.spot = i;
        c.pose = 'sit';
        c.timer = 5 + Math.random() * 6;
        sfx('cat');
        return;
      }
      c.spot = i;
      c.tx = s.x;
      c.y = s.y;
      c.pose = 'walk';
    }
  }

  // ---------- hints ----------
  private currentHint(): Hint | null {
    if (this.level.id > 2) return null;
    const v = this.engine.view;
    const cu = this.customer;
    if (this.phase === 'ring')
      return {
        station: 0,
        x: this.salL.phone.x + this.salL.phone.w / 2,
        y: this.salL.phone.y,
        text: 'Telefon çalıyor! Dokun.',
      };
    if (this.phase !== 'cooking' || !cu) return null;
    const o = cu.order;
    const L = this.prepL;
    if (this.bowlAt === 'prep') {
      if (!this.bowl.noodle) {
        const i = NOODLES.indexOf(o.noodle ?? 'ramen');
        const t = L.trays[Math.max(0, i)];
        return {
          station: 1,
          x: v.W + t.x + t.w / 2,
          y: t.y + t.h / 2,
          text: `Erişteyi koy: ${o.thick ? THICK_LABEL[o.thick] + ' ' : ''}${INGREDIENTS[o.noodle ?? 'ramen'].name}`,
        };
      }
      if (o.thick && this.bowl.thick !== o.thick && this.level.id === 1) {
        return {
          station: 1,
          x: v.W + L.thickChips.x + L.thickChips.w / 2,
          y: L.thickChips.y + L.thickChips.h / 2,
          text: `Kalınlık: ${THICK_LABEL[o.thick]}`,
        };
      }
      if (!this.bowl.broth || this.bowl.fill < 0.72) {
        const i = LIQUIDS.indexOf(o.broth ?? 'shoyu');
        const p = L.pots[Math.max(0, i)];
        return {
          station: 1,
          x: v.W + p.x + p.w / 2,
          y: p.y + p.h / 2,
          text:
            this.bowl.fill > 0
              ? 'Basılı tut, göstergeyi “tam”a getir'
              : `Basılı tut ve doldur: ${INGREDIENTS[o.broth ?? 'shoyu'].name}`,
        };
      }
      const cnt = new Map<string, number>();
      for (const p of this.bowl.pieces) cnt.set(p.id, (cnt.get(p.id) ?? 0) + 1);
      for (const r of o.reqs) {
        const have = cnt.get(r.id) ?? 0;
        const need = r.mode === 'exact' ? (r.n ?? 1) : r.mode === 'bol' ? 5 : 1;
        if (have < need) {
          const i = TOPPINGS.indexOf(r.id);
          const tb = L.tubs[i];
          return {
            station: 1,
            x: v.W + tb.x + tb.w / 2,
            y: tb.y + tb.h / 2,
            text:
              r.mode === 'exact'
                ? `${INGREDIENTS[r.id].name}: ${have}/${need} (dokun)`
                : `${r.mode === 'bol' ? 'Bol ' : ''}${INGREDIENTS[r.id].name} ekle (dokun)`,
          };
        }
      }
      return {
        station: 1,
        x: this.bowlPos.x,
        y: this.bowlPos.y,
        text: 'Kaseyi tut, sağa kaydırıp ocağa taşı',
      };
    }
    if (this.bowlAt === 'stove') {
      const cs = cookOf(this.bowl);
      const want = o.cook;
      if (cs === want || (cs === 'soft' && want !== 'soft') || cs === 'burnt')
        return {
          station: 2,
          x: this.bowlPos.x,
          y: this.bowlPos.y,
          text: cs === want ? 'Tam zamanı! Kaseyi al, sola kaydır, müşteriye götür' : 'Hemen al!',
        };
      return {
        station: 2,
        x: 2 * v.W + this.kamL.timer.x,
        y: this.kamL.timer.y,
        text: `Bekle… “${COOK_LABEL[want]}” olunca al`,
      };
    }
    if (this.bowlAt === 'hand' && this.bowl.noodle && cookOf(this.bowl) !== 'raw') {
      return cu.phone
        ? {
            station: 0,
            x: this.salL.deliveryBox.x + this.salL.deliveryBox.w / 2,
            y: this.salL.deliveryBox.y,
            text: 'Paket kutusuna bırak',
          }
        : {
            station: 0,
            x: this.salL.customer.x,
            y: this.salL.counterTop + 30,
            text: 'Tezgâha, müşterinin önüne bırak',
          };
    }
    return null;
  }

  // ---------- frame ----------
  private frame(c: Ctx, v: View, t: number, dt: number) {
    this.update(dt, t);
    const e = this.engine;
    c.fillStyle = PAL.paper;
    c.fillRect(0, 0, v.W, v.H);
    c.save();
    c.translate(-e.camX, 0);
    const vis = (i: number) => e.camX < (i + 1) * v.W && e.camX + v.W > i * v.W;
    if (vis(0)) this.drawSalon(c, v, t);
    if (vis(1)) this.drawPrep(c, v, t);
    if (vis(2)) this.drawStove(c, v, t);
    // flying pieces (prep station space)
    for (const f of this.flies) {
      const k = this.prepL.bowl.size / BOWL_SPACE;
      const p = f.t;
      const x = lerp(f.x, f.tx, p);
      const y = lerp(f.y, f.ty, p) - Math.sin(p * Math.PI) * 60;
      c.save();
      c.translate(x, y);
      c.scale(k, k);
      drawPiece(c, f.id, f.v, 1 + Math.sin(p * Math.PI) * 0.25, p * 2);
      c.restore();
    }
    // dragged piece
    const d = this.drag;
    if (d && d.kind === 'tub' && d.moved) {
      const k = this.prepL.bowl.size / BOWL_SPACE;
      c.save();
      c.translate(d.x, d.y - 18);
      c.scale(k * 1.15, k * 1.15);
      drawPiece(c, d.id, 0, 1, 0);
      c.restore();
    }
    // bowl in hand on top of everything
    if (this.bowlAt === 'hand')
      this.drawTheBowl(c, t, this.prepL.bowl.size * (1 + 0.08 * this.bowlLift), 0.5);
    this.fx.draw(c);
    c.restore();
  }

  private update(dt: number, t: number) {
    const v = this.engine.view;
    this.phaseT += dt;
    this.fx.update(dt);
    this.updateCat(dt);
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) {
        this.toast = null;
        this.notify();
      }
    }
    // bowl lift anim
    this.bowlLift = lerp(this.bowlLift, this.bowlAt === 'hand' ? 1 : 0, Math.min(1, dt * 12));
    // edge scroll while dragging
    if (this.drag && (this.drag.kind === 'bowl' || (this.drag.kind === 'tub' && this.drag.moved))) {
      const edge = v.cssW * 0.13;
      const sx = this.pointer.sx;
      let dir = 0;
      if (sx < edge) dir = -1 - (edge - sx) / edge;
      else if (sx > v.cssW - edge) dir = 1 + (sx - (v.cssW - edge)) / edge;
      if (dir) {
        const before = this.engine.camX;
        this.engine.camTarget = null;
        this.engine.camX = clamp(this.engine.camX + dir * 520 * dt, 0, this.engine.maxCam);
        const moved = this.engine.camX - before;
        if (this.drag.kind === 'bowl') this.bowlPos.x += moved;
        else {
          this.drag.x += moved;
        }
        this.pointer.x += moved;
      }
    }
    // hold-fill
    if (this.drag && this.drag.kind === 'hold' && this.bowlAt === 'prep') {
      const before = this.bowl.fill;
      this.bowl.fill = Math.min(1.22, this.bowl.fill + FILL_RATE * dt);
      if (Math.floor(before * 10) !== Math.floor(this.bowl.fill * 10)) {
        sfx('pour');
        this.notify();
      }
      if (this.bowl.fill >= 1.2 && before < 1.2) this.showToast('Taştı!');
      this.tutorialDone.add('broth');
    }
    // flies
    for (const f of this.flies) f.t = Math.min(1, f.t + dt * 2.6);
    const landed = this.flies.filter((f) => f.t >= 1);
    if (landed.length) {
      this.flies = this.flies.filter((f) => f.t < 1);
      for (const f of landed) this.landFly(f);
    }
    // cooking
    if (this.bowlAt === 'stove' && this.bowl.noodle) {
      this.bowl.progress = Math.min(120, this.bowl.progress + COOK_RATE * dt);
      const cs = cookOf(this.bowl);
      if (cs !== this.lastCook) {
        this.lastCook = cs;
        sfx(cs === 'burnt' ? 'fail' : 'bubble');
        if (cs === 'perfect') buzz(12);
        this.notify();
      }
      if (Math.random() < dt * 6)
        this.fx.emit(
          'steam',
          this.bowlPos.x + (Math.random() - 0.5) * 80,
          this.bowlPos.y - 40,
          1,
          10
        );
    }
    this.heat = lerp(this.heat, this.bowlAt === 'stove' ? 1 : 0.18, Math.min(1, dt * 2));
    // waiting time
    if (this.phase === 'cooking') this.waitT += dt;
    // typewriter
    if (this.bubble && this.bubble.shown < this.bubble.text.length) {
      this.typeT += dt;
      const n = Math.min(this.bubble.text.length, Math.floor(this.typeT * 34));
      if (n !== this.bubble.shown) {
        this.bubble.shown = n;
        if (n % 3 === 0) sfx('type');
        this.notify();
      }
    }
    // phases
    const cu = this.customer;
    switch (this.phase) {
      case 'enter':
        this.customerY = Math.min(1, this.customerY + dt * 1.6);
        if (this.phaseT > 0.7 && cu) {
          this.phase = 'greet';
          this.phaseT = 0;
          this.setBubble(cu.name, cu.greet);
        }
        break;
      case 'greet':
        if (
          this.bubble &&
          this.bubble.shown >= this.bubble.text.length &&
          this.phaseT > 1.4 &&
          cu
        ) {
          this.phase = 'order';
          this.phaseT = 0;
          this.setBubble(cu.name, cu.text);
          this.ticket = orderLines(cu.order);
        }
        break;
      case 'order':
        if (this.bubble && this.bubble.shown >= this.bubble.text.length) {
          this.phase = 'cooking';
          this.phaseT = 0;
          this.notify();
        }
        break;
      case 'ring':
        this.ringT += dt;
        if (this.ringT > 2.4) {
          this.ringT = 0;
          sfx('phone');
        }
        break;
      case 'served':
        if (this.phaseT > 2.2 && cu && this.pendingReaction) {
          this.phase = 'react';
          this.phaseT = 0;
          this.customerEating = false;
          const sc = this.lastScore ?? 0;
          this.customerMood =
            sc >= 85 ? 'love' : sc >= 55 ? 'happy' : sc >= 30 ? 'worried' : 'angry';
          const notes = this.pendingReaction.notes.slice(0, 2).join(' · ');
          this.setBubble(
            cu.name,
            this.pendingReaction.text + (notes ? `  (${notes})` : ''),
            false,
            this.pendingReaction.tone
          );
          if (sc >= 85) {
            sfx('perfect');
            this.fx.emit(
              'heart',
              this.salL.customer.x,
              this.salL.customer.y - this.salL.customer.size,
              5,
              30
            );
          } else if (sc < 30) sfx('angry');
          else sfx('ding');
        }
        break;
      case 'react':
        if (
          this.bubble &&
          this.bubble.shown >= this.bubble.text.length &&
          this.phaseT > 2.2 &&
          cu &&
          this.pendingPay
        ) {
          this.phase = 'pay';
          this.phaseT = 0;
          const { pay, tp } = this.pendingPay;
          this.ledger.sales += pay;
          this.earned += pay;
          this.cash = { due: pay, given: cashGiven(pay, this.level.id), giving: [], tipAmount: tp };
          this.setBubble(cu.name, `Hesap ${pay} ₺ mi? Buyur, ${sum(this.cash.given)} ₺.`);
          sfx('coins');
        }
        break;
      case 'delivering':
        if (this.scooter) {
          this.scooter.t += dt;
          this.scooter.x += dt * 420;
        }
        if (this.phaseT > 1.4 && this.pendingReaction && this.bubble === null) {
          this.setBubble(
            'Rüzgar',
            'Paket yolda! ' + this.pendingReaction.text,
            true,
            this.pendingReaction.tone
          );
        }
        if (this.phaseT > 4.2) {
          this.scooter = null;
          this.servedBowl = null;
          this.resetBowl();
          this.nextCustomer(1.0);
        }
        break;
      case 'leave':
        if (this.phaseT > 0 && this.idx >= 0 && this.phaseT < dt * 2) {
          // moment of leaving
          if (cu && !cu.phone && this.lastScore !== null && this.lastScore >= 55)
            this.seatDiner(40 + Math.random() * 60);
          this.servedBowl = null;
          this.bowlAt = 'prep';
          this.resetBowl();
        }
        if (this.phaseT > 0) this.customerY = Math.max(0, this.customerY - dt * 2.2);
        if (this.phaseT > 0.9) this.startCustomer();
        break;
    }
    // diners
    for (const d of this.diners) {
      d.leaveT -= dt;
      if (!d.img) d.img = avatarImage(randomLook(d.seed), 'happy', true);
      d.bob = Math.sin(t * 2 + d.seed) * 3;
    }
    this.diners = this.diners.filter((d) => d.leaveT > 0);
    if (Math.random() < dt / 45) this.seatDiner(50 + Math.random() * 50);
  }

  // ---------- station drawing ----------
  private drawTheBowl(c: Ctx, t: number, size: number, shadow = 0) {
    const { x, y } = this.bowlPos;
    c.save();
    c.translate(x, y - this.bowlLift * 22);
    if (shadow) {
      c.save();
      c.globalAlpha = 0.25 * this.bowlLift;
      c.fillStyle = '#3a2a22';
      c.beginPath();
      c.ellipse(0, size * 0.52 + 20, size * 0.5, size * 0.16, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    drawBowlTop(c, this.bowl, size, t, {
      steam: this.bowlAt === 'stove' ? 1 : cookOf(this.bowl) !== 'raw' ? 0.5 : 0,
    });
    c.restore();
  }

  private drawSalon(c: Ctx, v: View, t: number) {
    const S = this.salL;
    const tod = this.level.time;
    const cu = this.customer;
    const opts = {
      rain: !!this.level.rain,
      diners: this.diners,
      phoneRinging: this.phase === 'ring',
      boxOpen: !!cu?.phone && this.phase === 'cooking',
      tipCoins: this.tipCoins,
      cashOnCounter: this.phase === 'pay',
      lampsOn: TOD_LIGHT[tod].lamp > 0,
    };
    drawSalonBack(c, v.W, v.H, this.decor, tod, t, opts);
    // customer
    if (
      cu &&
      !cu.phone &&
      this.idx >= 0 &&
      this.phase !== 'leave' &&
      this.phase !== 'dayEnd' &&
      this.customerY > 0
    ) {
      const size = S.customer.size * (cu.look.kid ? 0.82 : 1);
      const y = S.customer.y + (1 - this.customerY) * 90;
      c.save();
      c.globalAlpha = this.customerY;
      drawAvatar(c, cu.look, this.customerMood, S.customer.x, y, size, {
        eating: this.customerEating,
        bob: Math.sin(t * 2) * 2,
      });
      c.restore();
    } else if (cu && !cu.phone && this.phase === 'leave' && this.customerY > 0) {
      c.save();
      c.globalAlpha = this.customerY;
      drawAvatar(
        c,
        cu.look,
        this.customerMood,
        S.customer.x + (1 - this.customerY) * 120,
        S.customer.y,
        S.customer.size,
        {}
      );
      c.restore();
    }
    if (this.cat.spot !== 0)
      drawCat(c, this.cat.x, this.cat.y, 64, this.cat.pose, t, this.cat.flip);
    drawSalonFront(c, v.W, v.H, this.decor, tod, t, opts);
    if (this.cat.spot === 0)
      drawCat(c, this.cat.x, this.cat.y, 56, this.cat.pose, t, this.cat.flip);
    // served bowl on the counter
    if (
      this.servedBowl &&
      (this.bowlAt === 'counter' || this.bowlAt === 'box') &&
      this.phase !== 'delivering'
    ) {
      c.save();
      c.translate(this.bowlPos.x, this.bowlPos.y);
      const eaten =
        this.phase !== 'served' && this.phase !== 'react'
          ? 0
          : this.phase === 'react'
            ? 1
            : Math.min(1, this.phaseT / 2.2);
      drawBowlTop(
        c,
        eaten > 0.6
          ? { ...this.servedBowl, pieces: [], fill: this.servedBowl.fill * 0.2 }
          : this.servedBowl,
        S.customer.size * 0.4,
        t,
        { steam: 0.6 }
      );
      c.restore();
    }
    // scooter
    if (this.scooter)
      drawScooter(c, this.scooter.x, S.counterTop + 40, 120, t, { rider: true, box: true });
    drawSalonLight(c, v.W, v.H, this.decor, tod);
    // hint pointer
    const h = this.currentHint();
    if (h && h.station === 0) drawPointerHint(c, h.x, h.y, t);
  }

  private drawPrep(c: Ctx, v: View, t: number) {
    const L = this.prepL;
    c.save();
    c.translate(v.W, 0);
    drawPrepBack(c, v.W, v.H, this.level.time, t, L);
    // shelf bowls
    L.shelf.slots.forEach((s, i) => {
      const b = BOWLS[i];
      if (!b) return;
      c.save();
      c.translate(s.x, s.y);
      if (b.unlock > this.level.id) c.globalAlpha = 0.35;
      drawBowlIcon(c, b.id, 54);
      if (this.bowl.style === b.id) {
        c.strokeStyle = rgba(PAL.coral, 0.9);
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(0, 6, 32, 20, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    });
    // trays
    L.trays.forEach((r, i) => {
      const id = NOODLES[i];
      if (!id) return;
      if (!this.unlocked.has(id)) return;
      c.save();
      c.translate(r.x, r.y);
      drawNoodleTray(c, id, this.bowl.thick, r.w, r.h);
      c.restore();
      if (this.bowl.noodle === id) this.ringSlot(c, r);
      this.slotLabel(c, INGREDIENTS[id].name, r);
    });
    // thickness chips
    {
      const r = L.thickChips;
      const cw = r.w / 3;
      (['ince', 'orta', 'kalin'] as Thick[]).forEach((tk, i) => {
        const x = r.x + i * cw;
        const on = this.bowl.thick === tk;
        c.fillStyle = on ? PAL.coral : rgba(PAL.white, 0.75);
        c.strokeStyle = rgba(PAL.walnut, 0.35);
        c.lineWidth = 1.5;
        c.beginPath();
        c.roundRect(x + 3, r.y, cw - 6, r.h, r.h / 2);
        c.fill();
        c.stroke();
        c.font = `800 ${Math.round(r.h * 0.5)}px "Baloo 2", system-ui`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = on ? '#fff' : PAL.ink;
        c.fillText(THICK_LABEL[tk], x + cw / 2, r.y + r.h / 2 + 1);
      });
    }
    // pots
    L.pots.forEach((r, i) => {
      const id = LIQUIDS[i];
      if (!id) return;
      if (!this.unlocked.has(id)) return;
      c.save();
      c.translate(r.x, r.y);
      drawPot(c, id, r.w, r.h, t);
      c.restore();
      if (this.bowl.broth === id) this.ringSlot(c, r);
      this.slotLabel(c, INGREDIENTS[id].name, r);
    });
    // tubs
    L.tubs.forEach((r, i) => {
      const id = TOPPINGS[i];
      if (!id) return;
      if (!this.unlocked.has(id)) {
        if (this.nextUnlock.has(id)) drawSlotLocked(c, r.x, r.y, r.w, r.h);
        return;
      }
      c.save();
      c.translate(r.x, r.y);
      drawTub(c, id, r.w, r.h);
      c.restore();
      const n = this.bowl.pieces.filter((p) => p.id === id).length;
      if (n) this.countBadge(c, r, n);
    });
    // gauge
    if (this.bowl.broth || this.bowl.fill > 0) {
      const g = L.gauge;
      drawGauge(
        c,
        g.x,
        g.y,
        g.w,
        g.h,
        this.bowl.fill,
        this.bowl.broth ? INGREDIENTS[this.bowl.broth].color : PAL.honey,
        [0.72, 1.0]
      );
    }
    // bowl
    c.restore();
    if (this.bowlAt === 'prep') this.drawTheBowl(c, t, L.bowl.size);
    const h = this.currentHint();
    if (h && h.station === 1) drawPointerHint(c, h.x, h.y, t);
  }

  private ringSlot(c: Ctx, r: { x: number; y: number; w: number; h: number }) {
    c.save();
    c.strokeStyle = rgba(PAL.coral, 0.9);
    c.lineWidth = 3;
    c.beginPath();
    c.roundRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8, 16);
    c.stroke();
    c.restore();
  }

  private slotLabel(c: Ctx, text: string, r: { x: number; y: number; w: number; h: number }) {
    c.save();
    c.font = `700 12px "Nunito", system-ui`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const w = c.measureText(text).width + 12;
    c.fillStyle = rgba(PAL.white, 0.85);
    c.beginPath();
    c.roundRect(r.x + r.w / 2 - w / 2, r.y + r.h - 9, w, 18, 9);
    c.fill();
    c.fillStyle = PAL.ink;
    c.fillText(text, r.x + r.w / 2, r.y + r.h);
    c.restore();
  }

  private countBadge(c: Ctx, r: { x: number; y: number; w: number; h: number }, n: number) {
    c.save();
    c.fillStyle = PAL.coral;
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(r.x + r.w - 6, r.y + 6, 12, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    c.font = `800 13px "Baloo 2", system-ui`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#fff';
    c.fillText(String(n), r.x + r.w - 6, r.y + 7);
    c.restore();
  }

  private drawStove(c: Ctx, v: View, t: number) {
    const K = this.kamL;
    c.save();
    c.translate(2 * v.W, 0);
    drawKamadoBack(c, v.W, v.H, this.level.time, t, { heat: this.heat });
    c.restore();
    if (this.bowlAt === 'stove') this.drawTheBowl(c, t, K.bowl.size);
    c.save();
    c.translate(2 * v.W, 0);
    drawKamadoFront(c, v.W, v.H, this.level.time, t, {
      heat: this.heat,
      cooking: this.bowlAt === 'stove' && !!this.bowl.noodle,
    });
    if (this.bowlAt === 'stove' && this.bowl.noodle)
      drawCookRing(c, K.timer.x, K.timer.y, K.timer.r, this.bowl.progress);
    c.restore();
    const h = this.currentHint();
    if (h && h.station === 2) drawPointerHint(c, h.x, h.y, t);
  }
}

// slot orders (index → ingredient id); unlocked ones become usable
export const NOODLES = ['ramen', 'udon', 'soba', 'pirinc'];
export const LIQUIDS = [
  'shoyu',
  'miso',
  'tavuk',
  'acili',
  'kori',
  'tonkotsu',
  'teriyaki',
  'fistik',
  'tatliaci',
  'yakisoba',
];
export const TOPPINGS = [
  'yesil',
  'yumurta',
  'chashu',
  'pakchoi',
  'nori',
  'filiz',
  'misir',
  'mantar',
  'aciyag',
  'biber',
  'tofu',
  'kimchi',
  'karides',
  'naruto',
  'lime',
  'bambu',
  'citir',
  'susam',
];

export { DENOMS, BOWL_R };
