// One working day: a real-time clock, a queue of customers, up to three open orders at once,
// complaints and apologies, the bowl, the three stations, input and rendering.
import { Engine, type View } from '../core/engine';
import { PAL, TOD_LIGHT, clamp, lerp, rgba, type Ctx } from '../art/common';
import {
  drawBowlTop,
  drawTub,
  drawNoodleTray,
  drawPot,
  drawBowlIcon,
  PIECE_VARIANTS,
  BOWL_PIECE_SCALE,
  drawPiece,
} from '../art/food';
import {
  prepLayout,
  drawPrepBack,
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
import { drawAvatar, preloadAvatar, randomLook, type Look, type Mood } from '../art/avatar';
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
  BOWL_SPACE,
  BOWL_R,
  cookOf,
  inBowl,
  newBowl,
  type BowlState,
  type CookState,
  COOK_LABEL,
} from './bowl';
import {
  makeCustomer,
  judge,
  orderLines,
  reactionLine,
  starsFor,
  type Customer,
  type Member,
} from './orders';
import {
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
import { L, T } from './i18n';

export type Phase = 'idle' | 'enter' | 'greet' | 'order' | 'waiting' | 'toTable' | 'dayEnd';
export type PickPhase = 'pickup' | 'served' | 'react' | 'complain' | 'pay' | 'leave' | 'delivering';

export interface Bubble {
  name: string;
  text: string;
  shown: number;
  phone?: boolean;
  tone?: 'good' | 'bad' | 'neutral';
  at: 'counter' | 'pickup' | 'phone';
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
  served: number;
  lost: number;
  complaints: number;
  reviews: Review[];
}

export interface Review {
  name: string;
  stars: number;
  text: string;
  delivery: boolean;
  day: number;
}

export interface Hint {
  station: number;
  x: number;
  y: number;
  text: string;
}

export interface TicketInfo {
  id: number;
  who: string;
  lines: string[];
  patience: number; // 0..1 remaining
  phone: boolean;
}

export interface UiSnapshot {
  served: number;
  bubble: Bubble | null;
  tickets: TicketInfo[];
  target: number | null; // slot id chosen for the next serve (null = auto)
  cash: CashUI | null;
  complaint: { name: string } | null;
  earned: number;
  cook: CookState | null;
  cookWhere: 'prep' | 'stove' | 'hand' | null;
  score: number | null;
  toast: string | null;
  hint: Hint | null;
  station: number;
  ringing: boolean;
  clock: number;
  clockText: string;
  dayEnd: boolean;
  intro: boolean;
}

/** An open order waiting to be cooked. */
interface Slot {
  id: number;
  cu: Customer;
  mi: number;
  waitT: number;
  lines: string[];
}

interface GroupState {
  pay: number;
  tip: number;
  served: number; // bowls served so far
  complained: boolean;
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
  | {
      kind: 'tub';
      id: string;
      sx: number;
      sy: number;
      moved: boolean;
      x: number;
      y: number;
      v: number;
      rot: number;
    }
  | { kind: 'hold'; id: string }
  | { kind: 'tap'; target: string; sx: number; sy: number };

interface CatState {
  pose: CatPose;
  spot: number;
  x: number;
  y: number;
  tx: number;
  flip: boolean;
  timer: number;
}

type DinerX = Diner & {
  leaveT: number;
  cuId?: number;
  mi?: number;
  seed: number;
  hidden?: boolean;
};

const COOK_RATE = 8.2;
const FILL_RATE = 0.62;
const MAX_OPEN = 2; // one walk-in at the counter + at most one delivery order
const QUEUE_MAX = 2; // customers wait outside; only one is at the counter at a time
const INTRO_LEN = 3.6;

export class DaySession {
  engine: Engine;
  level: Level;
  dayLen: number;
  clock = 0;
  // counter (ordering)
  counter: Customer | null = null;
  mi = 0;
  phase: Phase = 'idle';
  phaseT = 0;
  // line & open orders
  queue: Customer[] = [];
  open: Slot[] = [];
  ringing: Slot | null = null;
  private slotId = 1;
  target: number | null = null;
  // pickup (receiving / paying)
  pick: {
    cu: Customer;
    mi: number;
    phase: PickPhase;
    t: number;
    score: number;
    notes: string[];
    tone: Bubble['tone'];
    bowl: BowlState | null;
  } | null = null;
  groups = new Map<number, GroupState>();
  delivery: { cu: Customer; score: number; tone: Bubble['tone']; t: number } | null = null;
  nextId = 0;
  spawnT = 2;
  ledger: DayLedger;
  scores: number[] = [];
  lost = 0;
  complaints = 0;
  decor: DecorState;
  cashBefore: number;
  bowl: BowlState = newBowl();
  bowlAt: 'prep' | 'stove' | 'hand' | 'counter' | 'box' = 'prep';
  bowlPos = { x: 0, y: 0 };
  bowlLift = 0;
  servedPos = { x: 0, y: 0 };
  bubble: Bubble | null = null;
  cash: CashUI | null = null;
  lastScore: number | null = null;
  toast: string | null = null;
  toastT = 0;
  earned = 0;
  typeT = 0;
  prepL!: PrepLayout;
  kamL!: KamadoLayout;
  salL!: SalonLayout;
  tops: string[];
  noods: string[];
  liqs: string[];
  private drag: Drag | null = null;
  private pointer = { x: 0, y: 0, sx: 0, sy: 0, down: false };
  private fx = new ParticleSystem();
  private cat: CatState = { pose: 'sit', spot: 1, x: 0, y: 0, tx: 0, flip: false, timer: 2 };
  diners: DinerX[] = [];
  private seedCounter = 1;
  private scooter: { x: number; t: number } | null = null;
  private tipCoins: number;
  private heat = 0.15;
  private unlocked: Set<string>;
  private lastCook: CookState = 'raw';
  private listeners = new Set<() => void>();
  private snap: UiSnapshot | null = null;
  private ringT = 0;
  private counterY = 0;
  private leaveTo: { x: number; y: number } | null = null;
  intro = INTRO_LEN;
  private pickY = 0;
  private dayOver = false;
  private tapHintShown = false;
  held: string | null = null; // topping picked from a tub, placed by tapping the bowl
  onDayEnd: ((r: DayResult) => void) | null = null;
  onOpenTablet: (() => void) | null = null;
  /** reviews collected today (name, stars 1–5, line, delivery?) */
  reviews: Review[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    levelId: number,
    decor: DecorState,
    cash: number,
    tipCoins: number
  ) {
    this.engine = new Engine(canvas);
    this.level = LEVELS[levelId - 1];
    this.dayLen = this.level.minutes * 60;
    this.ledger = emptyLedger(levelId);
    this.decor = decor;
    this.cashBefore = cash;
    this.tipCoins = tipCoins;
    this.unlocked = new Set(unlockedUpTo(levelId));
    this.tops = TOPPINGS.filter((t) => this.unlocked.has(t));
    this.noods = NOODLES.filter((t) => this.unlocked.has(t));
    this.liqs = LIQUIDS.filter((t) => this.unlocked.has(t));
    this.layout(this.engine.view);
    this.engine.onResize = (v) => this.layout(v);
    this.engine.onFrame = (c, v, t, dt) => this.frame(c, v, t, dt);
    this.engine.camX = 0;
    this.resetBowl();
    for (let i = 0; i < Math.min(2, this.salL.seats.length); i++)
      this.seatExtra(60 + Math.random() * 60);
    this.cat.x = this.salL.catSpots[1].x;
    this.cat.y = this.salL.catSpots[1].y;
    this.cat.tx = this.cat.x;
    this.bindInput(canvas);
    this.engine.start();
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
    const left = Math.max(0, this.dayLen - this.clock);
    const mm = Math.floor(left / 60);
    const ss = Math.floor(left % 60);
    this.snap = {
      served: this.scores.length,
      bubble: this.bubble ? { ...this.bubble } : null,
      tickets: this.open.map((s) => ({
        id: s.id,
        who: s.cu.members[s.mi].name,
        lines: s.lines,
        patience: clamp(1 - s.waitT / s.cu.patience, 0, 1),
        phone: s.cu.phone,
      })),
      target: this.target,
      cash: this.cash ? { ...this.cash, giving: [...this.cash.giving] } : null,
      complaint:
        this.pick?.phase === 'complain' ? { name: this.pick.cu.members[this.pick.mi].name } : null,
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
      score:
        this.pick &&
        (this.pick.phase === 'react' ||
          this.pick.phase === 'complain' ||
          this.pick.phase === 'served')
          ? this.pick.score
          : null,
      toast: this.toast,
      hint: this.currentHint(),
      station: this.engine.station,
      ringing: !!this.ringing,
      clock: Math.min(1, this.clock / this.dayLen),
      clockText: `${mm}:${String(ss).padStart(2, '0')}`,
      dayEnd: this.phase === 'dayEnd',
      intro: this.intro > 0,
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

  setTarget(id: number | null) {
    this.target = this.target === id ? null : id;
    sfx('tap');
    this.notify();
  }

  get tipJarCoins() {
    return this.tipCoins;
  }

  // ---------- layout ----------
  private layout(v: View) {
    this.prepL = prepLayout(v.W, v.H, {
      tubs: this.tops.length,
      trays: this.noods.length,
      pots: this.liqs.length,
    });
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

  /** standing spots for the queue (from the salon layout, with a fallback) */
  private queueSpots() {
    const S = this.salL as SalonLayout & { queue?: { x: number; y: number; size: number }[] };
    if (S.queue?.length) return S.queue;
    const c = S.customer;
    return [0, 1, 2].map((i) => ({
      x: c.x + c.size * (0.95 + i * 0.5),
      y: c.y - 14 - i * 4,
      size: c.size * 0.78,
    }));
  }

  counterX() {
    const S = this.salL;
    const n = this.counter?.members.length ?? 1;
    let x = S.customer.x - (n - 1) * S.customer.size * 0.22;
    if (this.pick && this.counter) x += S.customer.size * 0.45;
    return x;
  }
  pickupX() {
    return this.counter
      ? this.salL.customer.x - this.salL.customer.size * 0.5
      : this.salL.customer.x;
  }

  // ---------- customers ----------
  private calls: Customer[] = [];

  private spawn() {
    const cu = makeCustomer(this.level.id, this.nextId++);
    for (const m of cu.members)
      preloadAvatar(m.look, ['neutral', 'happy', 'love', 'angry', 'worried']);
    if (cu.phone) {
      // calls wait in a line of their own and ring as soon as the counter is free
      if (this.calls.length < 2) this.calls.push(cu);
      return;
    }
    if (this.queue.length >= QUEUE_MAX) return;
    this.queue.push(cu);
    sfx('door');
    this.notify();
  }

  /** ring the tablet for a waiting call when nobody is at the counter */
  private tryRing() {
    if (!this.calls.length || this.dayOver) return;
    if (this.ringing || this.open.length >= MAX_OPEN || this.counter || this.pick || this.delivery)
      return;
    const cu = this.calls.shift()!;
    const m = cu.members[0];
    this.ringing = { id: this.slotId++, cu, mi: 0, waitT: 0, lines: orderLines(m.order) };
    this.ringT = 0;
    sfx('phone');
    this.notify();
  }

  answerPhone() {
    if (!this.ringing) return;
    const s = this.ringing;
    this.ringing = null;
    s.waitT = 0;
    this.open.push(s);
    const m = s.cu.members[0];
    this.setBubble(m.name, s.cu.greet + ' ' + m.text, 'phone', 'neutral');
    sfx('tap');
    this.notify();
  }

  private setBubble(
    name: string,
    text: string,
    at: Bubble['at'],
    tone: Bubble['tone'] = 'neutral'
  ) {
    this.bubble = { name, text, shown: 0, phone: at === 'phone', tone, at };
    this.typeT = 0;
    this.notify();
  }

  private startOrder() {
    const cu = this.counter!;
    const m = cu.members[this.mi];
    this.phase = 'order';
    this.phaseT = 0;
    const n = cu.members.length;
    const pre =
      n > 1 ? (this.mi === 0 ? T('g.first') : this.mi === n - 1 ? T('g.last') : T('g.mine')) : '';
    this.setBubble(m.name, pre + m.text, 'counter');
  }

  private placeOrder(cu: Customer, mi: number) {
    const m = cu.members[mi];
    this.open.push({ id: this.slotId++, cu, mi, waitT: 0, lines: orderLines(m.order) });
    if (!this.groups.has(cu.id))
      this.groups.set(cu.id, { pay: 0, tip: 0, served: 0, complained: false });
  }

  /** the ordering group walks to a table (or waits standing) */
  private seatGroup(cu: Customer) {
    cu.members.forEach((m, i) => {
      const seat = this.freeSeat();
      this.diners.push({
        seat,
        look: m.look,
        mood: 'neutral',
        bob: 0,
        eating: false,
        waiting: true,
        leaveT: 1e9,
        cuId: cu.id,
        mi: i,
        seed: m.look.seed,
      } as DinerX);
    });
  }

  private freeSeat(): number {
    const used = new Set(this.diners.filter((d) => d.seat >= 0).map((d) => d.seat));
    const free = this.salL.seats.map((_, i) => i).filter((i) => !used.has(i));
    if (!free.length) return -1; // standing
    // prefer seats at the same table as a groupmate
    return free[Math.floor(Math.random() * free.length)];
  }

  private seatExtra(stay: number) {
    const seat = this.freeSeat();
    if (seat < 0) return;
    const seed = (this.seedCounter++ * 7919) % 100000;
    this.diners.push({
      seat,
      look: randomLook(seed),
      mood: 'happy',
      bob: 0,
      eating: true,
      leaveT: stay,
      seed,
    } as DinerX);
  }

  private endDay() {
    if (this.dayOver) return;
    this.dayOver = true;
    this.phase = 'dayEnd';
    const avg = this.scores.length ? sum(this.scores) / this.scores.length : 0;
    const stars = this.scores.length < 3 ? 0 : starsFor(avg);
    const r: DayResult = {
      level: this.level.id,
      ledger: this.ledger,
      scores: this.scores,
      avg,
      stars,
      cashBefore: this.cashBefore,
      cashAfter: this.cashBefore + net(this.ledger),
      served: this.scores.length,
      lost: this.lost,
      complaints: this.complaints,
      reviews: this.reviews,
    };
    this.notify();
    setTimeout(() => this.onDayEnd?.(r), 900);
  }

  /** an open order's customer gives up */
  private giveUp(s: Slot) {
    this.open = this.open.filter((x) => x !== s);
    if (this.target === s.id) this.target = null;
    this.scores.push(0);
    this.lost++;
    const m = s.cu.members[s.mi];
    this.setBubble(
      m.name,
      s.cu.phone ? T('g.waitedPhone') : T('g.waited'),
      s.cu.phone ? 'phone' : 'pickup',
      'bad'
    );
    sfx('angry');
    // the whole group leaves the table
    this.diners = this.diners.filter((d) => d.cuId !== s.cu.id);
    this.open = this.open.filter((x) => x.cu !== s.cu);
    this.notify();
  }

  // ---------- serving ----------
  private pickSlotFor(b: BowlState): Slot | null {
    if (!this.open.length) return null;
    if (this.target !== null) {
      const t = this.open.find((s) => s.id === this.target);
      if (t) return t;
    }
    let best: Slot | null = null;
    let bestScore = -1;
    for (const s of this.open) {
      const sc = judge(s.cu.members[s.mi].order, b, 0).score;
      if (
        sc > bestScore + 0.01 ||
        (Math.abs(sc - bestScore) < 0.01 && best && s.waitT > best.waitT)
      ) {
        best = s;
        bestScore = sc;
      }
    }
    return best;
  }

  private serve(s: Slot, viaBox: boolean) {
    const cu = s.cu;
    const m = cu.members[s.mi];
    const v = judge(m.order, this.bowl, s.waitT / cu.patience);
    const p = price(m.order);
    const pay = paid(v.score, p);
    const tp = tip(v.score, p, tipBonus(this.decor));
    this.open = this.open.filter((x) => x !== s);
    if (this.target === s.id) this.target = null;
    this.scores.push(v.score);
    this.lastScore = v.score;
    this.ledger.ingredients += cost(this.bowl);
    this.ledger.bowls++;
    const g = this.groups.get(cu.id) ?? { pay: 0, tip: 0, served: 0, complained: false };
    g.pay += pay;
    g.served++;
    const complaint = v.score < 70 && v.notes.length > 0;
    if (complaint) {
      g.complained = true;
      this.complaints++;
    } else g.tip += tp;
    this.groups.set(cu.id, g);
    const served = this.bowl;
    this.bowl = newBowl(this.bowl.style);
    this.reviews.push({
      name: m.name,
      stars: Math.max(1, Math.min(5, Math.round(v.score / 20))),
      text: complaint
        ? T('g.complain', {
            notes: v.notes
              .slice(0, 2)
              .map((n) => L(n))
              .join(' · '),
          })
        : reactionLine(cu, v.score),
      delivery: viaBox,
      day: this.level.id,
    });
    const tone: Bubble['tone'] = v.score >= 70 ? 'good' : v.score >= 45 ? 'neutral' : 'bad';
    this.bubble = null;
    if (v.score >= 85) this.fx.emit('sparkle', this.bowlPos.x, this.bowlPos.y - 40, 14, 60);
    if (viaBox) {
      this.bowlAt = 'box';
      this.scooter = { x: this.salL.deliveryBox.x, t: 0 };
      sfx('scooter');
      this.ledger.sales += pay;
      this.ledger.tips += complaint ? 0 : tp;
      this.earned += pay + (complaint ? 0 : tp);
      if (!complaint && tp > 0) this.tipCoins += 1;
      this.delivery = { cu, score: v.score, tone, t: 0 };
      this.groups.delete(cu.id);
      this.resetBowl();
    } else {
      this.servedPos = { ...this.bowlPos };
      this.resetBowl(); // a fresh bowl is ready on the counter immediately
      this.diners = this.diners.filter((d) => !(d.cuId === cu.id && d.mi === s.mi));
      const atCounter = this.counter === cu;
      if (atCounter) {
        this.counter = null;
        this.phase = 'idle';
        this.phaseT = -0.5;
      }
      this.pick = {
        cu,
        mi: s.mi,
        phase: this.counter ? 'pickup' : 'served',
        t: 0,
        score: v.score,
        notes: complaint ? v.notes : v.notes.concat(v.praise),
        tone,
        bowl: served,
      };
      this.pickY = atCounter ? 1 : 0;
      sfx('place');
    }
    this.notify();
  }

  apologize() {
    if (!this.pick || this.pick.phase !== 'complain') return;
    const m = this.pick.cu.members[this.pick.mi];
    this.setBubble(T('g.you'), T('g.sorry'), 'pickup', 'neutral');
    sfx('tap');
    this.pick.phase = 'react';
    this.pick.t = 1.4; // short wait before the reply
    this.pick.notes = [];
    this.pick.tone = 'neutral';
    this.pendingSorryReply = m.name;
    this.notify();
  }
  private pendingSorryReply: string | null = null;

  /** after the reaction: next step for this member/group */
  private afterReaction() {
    const pk = this.pick!;
    const cu = pk.cu;
    const g = this.groups.get(cu.id)!;
    if (g.served < cu.members.length) {
      // this friend goes back to the table and eats; others are still waiting for their bowls
      this.diners.push({
        seat: this.freeSeat(),
        look: cu.members[pk.mi].look,
        mood: 'happy',
        bob: 0,
        eating: true,
        leaveT: 1e9,
        cuId: cu.id,
        mi: pk.mi,
        seed: cu.members[pk.mi].look.seed,
      } as DinerX);
      pk.phase = 'leave';
      pk.t = 0;
      this.notify();
      return;
    }
    // everyone served: pay for the whole group
    pk.phase = 'pay';
    pk.t = 0;
    const pay = g.pay;
    this.ledger.sales += pay;
    this.earned += pay;
    const given = cashGiven(pay, this.level.id);
    const change = sum(given) - pay;
    this.cash = { due: pay, given, giving: [], tipAmount: g.tip };
    const who = cu.members.length > 1 ? T('g.billAll') : '';
    this.setBubble(
      cu.members[pk.mi].name,
      T('g.bill', {
        who,
        p: pay,
        g: sum(given),
        rest: change > 0 ? T('g.changeWillBe', { n: change }) : T('g.exactMoney'),
      }),
      'pickup'
    );
    sfx('coins');
  }

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
    if (!this.cash || this.cash.result === 'ok' || !this.pick) return;
    const need = sum(this.cash.given) - this.cash.due;
    const give = sum(this.cash.giving);
    const pk = this.pick;
    const name = pk.cu.members[pk.mi].name;
    if (give === need) {
      this.cash.result = 'ok';
      sfx('coins');
    } else if (give < need) {
      this.cash.result = 'less';
      this.ledger.changeMistakes++;
      this.setBubble(name, T('g.lessChange', { n: need }), 'pickup', 'bad');
      sfx('fail');
      this.notify();
      return;
    } else {
      this.cash.result = 'ok';
      this.ledger.overChange += give - need;
      this.ledger.changeMistakes++;
      this.setBubble(name, T('g.moreChange'), 'pickup', 'neutral');
      sfx('coins');
    }
    const tp = this.cash.tipAmount;
    const g = this.groups.get(pk.cu.id);
    if (tp > 0) {
      this.tipCoins += 1;
      const j = this.salL.tipJar;
      this.fx.emit('coin', j.x + j.w / 2, j.y - 10, Math.min(6, tp), 20);
      sfx('ding');
      this.setBubble(
        name,
        tp >= 10 ? T('g.tipBig', { n: tp }) : T('g.tipSmall', { n: tp }),
        'pickup',
        'good'
      );
    } else if (g?.complained) this.setBubble(name, T('g.noTip'), 'pickup', 'neutral');
    this.ledger.tips += tp;
    this.earned += tp;
    this.cash = null;
    this.groups.delete(pk.cu.id);
    // the group eats at the table now
    pk.cu.members.forEach((m, i) => {
      if (!this.diners.some((d) => d.cuId === pk.cu.id && d.mi === i))
        this.diners.push({
          seat: this.freeSeat(),
          look: m.look,
          mood: tp > 0 ? 'love' : 'happy',
          bob: 0,
          eating: true,
          leaveT: 1e9,
          cuId: pk.cu.id,
          mi: i,
          seed: m.look.seed,
        } as DinerX);
    });
    for (const d of this.diners) if (d.cuId === pk.cu.id) d.leaveT = 50 + Math.random() * 50;
    const mine = this.diners.find((d) => d.cuId === pk.cu.id && d.mi === pk.mi);
    const sp = mine && mine.seat >= 0 ? this.salL.seats[mine.seat] : null;
    this.leaveTo = sp ? { x: sp.x, y: sp.y } : { x: -200, y: this.salL.customer.y };
    if (mine) mine.hidden = true;
    pk.phase = 'leave';
    pk.t = -1.4;
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
    if (this.intro > 0) return;
    const v = this.engine.view;
    const st = Math.floor(x / v.W);
    const lx = x - st * v.W;
    if (this.bowlAt === 'prep' || this.bowlAt === 'stove') {
      const r = this.bowlAt === 'prep' ? this.prepL.bowl.size / 2 : this.kamL.bowl.size / 2;
      if (Math.hypot(x - this.bowlPos.x, y - this.bowlPos.y) < r + 14) {
        if (this.held && this.bowlAt === 'prep') {
          // a tap places the held topping here; dragging still carries the bowl
          this.drag = { kind: 'tap', target: `placeAt:${x},${y}`, sx, sy };
          return;
        }
        this.drag = { kind: 'bowl', ox: x - this.bowlPos.x, oy: y - this.bowlPos.y };
        this.bowlAt = 'hand';
        sfx('pick');
        buzz(8);
        this.notify();
        return;
      }
    }
    if (st === 1) {
      const Lp = this.prepL;
      for (let i = 0; i < Lp.tubs.length; i++) {
        const id = this.tops[i];
        if (!id || !this.hit(Lp.tubs[i], lx, y, 6)) continue;
        this.drag = {
          kind: 'tub',
          id,
          sx,
          sy,
          moved: false,
          x,
          y,
          v: Math.floor(Math.random() * (PIECE_VARIANTS[id] ?? 1)),
          rot: (Math.random() - 0.5) * 1.2,
        };
        return;
      }
      for (let i = 0; i < Lp.pots.length; i++) {
        const id = this.liqs[i];
        if (!id || !this.hit(Lp.pots[i], lx, y, 6)) continue;
        this.drag = { kind: 'hold', id };
        if (this.bowlAt !== 'prep') return;
        if (this.bowl.broth !== id) {
          if (this.bowl.broth && this.bowl.fill > 0.05) this.ledger.waste += 2;
          this.bowl.broth = id;
          this.bowl.fill = Math.min(this.bowl.fill, 0.25);
        }
        return;
      }
      for (let i = 0; i < Lp.trays.length; i++) {
        if (this.noods[i] && this.hit(Lp.trays[i], lx, y, 6)) {
          this.drag = { kind: 'tap', target: 'tray:' + this.noods[i], sx, sy };
          return;
        }
      }
      for (let i = 0; i < Lp.shelf.slots.length; i++) {
        const s = Lp.shelf.slots[i];
        if (BOWLS[i] && Math.hypot(lx - s.x, y - s.y) < 34) {
          this.drag = { kind: 'tap', target: 'shelf:' + BOWLS[i].id, sx, sy };
          return;
        }
      }
      if (this.hit(Lp.thickChips, lx, y, 4)) {
        const tc = Lp.thickChips;
        const k =
          tc.h > tc.w * 0.8
            ? Math.floor(((y - tc.y) / tc.h) * 3)
            : Math.floor(((lx - tc.x) / tc.w) * 3);
        this.drag = {
          kind: 'tap',
          target: 'thick:' + (['ince', 'orta', 'kalin'] as Thick[])[clamp(k, 0, 2)],
          sx,
          sy,
        };
        return;
      }
      if (this.hit(Lp.trash, lx, y, 6)) {
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
      if (!d.moved && Math.hypot(sx - d.sx, sy - d.sy) > 10) {
        d.moved = true;
        sfx('pick');
        buzz(5);
      }
      d.x = x;
      d.y = y;
    } else if (d.kind === 'tap') {
      if (d.target.startsWith('placeAt:') && Math.hypot(sx - d.sx, sy - d.sy) > 14) {
        this.drag = { kind: 'bowl', ox: x - this.bowlPos.x, oy: y - this.bowlPos.y };
        this.bowlAt = 'hand';
        sfx('pick');
        return;
      }
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
        if (Math.abs(d.vel) > 500) this.engine.snapTo(this.engine.station + (d.vel > 0 ? 1 : -1));
        else this.engine.snapTo(Math.round(this.engine.camX / v.W));
      } else this.engine.snapTo(this.engine.station);
      return;
    }
    if (d.kind === 'bowl') return this.dropBowl();
    if (d.kind === 'hold') return;
    if (d.kind === 'tub') {
      if (!d.moved) {
        this.held = this.held === d.id ? null : d.id;
        if (this.held && !this.tapHintShown) {
          this.tapHintShown = true;
          this.showToast(T('g.tapHint'));
        }
        sfx(this.held ? 'pick' : 'tap');
        this.notify();
        return;
      }
      if (this.bowlAt !== 'prep') {
        sfx('trash');
        return;
      }
      const b = this.bowlSpace(d.x, d.y);
      if (b && inBowl(b.x, b.y, 6)) this.place(d.id, b, d.v, d.rot);
      else {
        this.ledger.waste += INGREDIENTS[d.id].cost;
        sfx('trash');
      }
      return;
    }
    if (d.kind === 'tap') this.tap(d.target);
  }

  private bowlSpace(x: number, y: number) {
    const size = this.bowlSize();
    const k = BOWL_SPACE / size;
    return { x: BOWL_C + (x - this.bowlPos.x) * k, y: BOWL_C + (y - this.bowlPos.y) * k };
  }

  private bowlSize() {
    return this.bowlAt === 'stove' ? this.kamL.bowl.size : this.prepL.bowl.size;
  }

  private place(id: string, at: { x: number; y: number }, v: number, rot: number) {
    if (this.bowl.pieces.length >= 30) return this.showToast(T('g.bowlFull'));
    this.bowl.pieces.push({ id, x: at.x, y: at.y, rot, v, s: 0.92 + Math.random() * 0.16 });
    sfx('place');
    buzz(6);
    this.notify();
  }

  private tap(target: string) {
    if (target.startsWith('placeAt:')) {
      if (!this.held || this.bowlAt !== 'prep') return;
      const [px, py] = target.slice(8).split(',').map(Number);
      const b = this.bowlSpace(px, py);
      if (b && inBowl(b.x, b.y, 6)) {
        // big pieces near the rim are nudged inward so they sit inside the bowl
        const dx = b.x - BOWL_C;
        const dy = b.y - BOWL_C;
        const d = Math.hypot(dx, dy);
        const maxR = BOWL_R - 30;
        if (d > maxR) {
          b.x = BOWL_C + (dx / d) * maxR;
          b.y = BOWL_C + (dy / d) * maxR;
        }
      }
      if (b && inBowl(b.x, b.y, 6))
        this.place(
          this.held,
          b,
          Math.floor(Math.random() * (PIECE_VARIANTS[this.held] ?? 1)),
          (Math.random() - 0.5) * 1.2
        );
      return;
    }
    if (target.startsWith('tray:')) {
      const id = target.slice(5);
      if (this.bowlAt !== 'prep') return this.showToast(T('g.bowlFirst'));
      if (this.bowl.progress > 0) return this.showToast(T('g.noodleLocked'));
      this.bowl.noodle = id;
      this.bowl.progress = 0;
      sfx('place');
      buzz(6);
      this.notify();
      return;
    }
    if (target.startsWith('thick:')) {
      this.bowl.thick = target.slice(6) as Thick;
      sfx('tap');
      this.notify();
      return;
    }
    if (target.startsWith('shelf:')) {
      const id = target.slice(6);
      const b = BOWLS.find((x) => x.id === id)!;
      if (b.unlock > this.level.id)
        return this.showToast(T('g.bowlLocked', { b: L(b.name), n: b.unlock }));
      if (this.bowlAt !== 'prep') return this.showToast(T('g.bowlFirst'));
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
      this.showToast(T('g.binned'));
      return;
    }
    if (target === 'phone') {
      if (this.ringing) this.answerPhone();
      else {
        sfx('tap');
        this.onOpenTablet?.();
      }
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
    }
  }

  private dropBowl() {
    const v = this.engine.view;
    const { x, y } = this.bowlPos;
    const st = Math.floor(x / v.W);
    const lx = x - st * v.W;
    if (
      st === 2 &&
      Math.hypot(lx - this.kamL.ring.x, y - this.kamL.ring.y) < this.kamL.ring.r + 40
    ) {
      this.bowlAt = 'stove';
      this.bowlPos = { x: 2 * v.W + this.kamL.bowl.x, y: this.kamL.bowl.y };
      sfx('place');
      if (this.bowl.noodle) sfx('sizzle');
      this.notify();
      return;
    }
    if (st === 0 && this.bowl.noodle) {
      const S = this.salL;
      const busy = !!this.pick && this.pick.phase !== 'leave' && this.pick.phase !== 'delivering';
      void busy;
      if (this.hit(S.deliveryBox, lx, y, 70)) {
        const phoneSlots = this.open.filter((s) => s.cu.phone);
        const s =
          this.target !== null
            ? (phoneSlots.find((q) => q.id === this.target) ?? this.pickSlotFromList(phoneSlots))
            : this.pickSlotFromList(phoneSlots);
        if (s && !this.delivery) {
          this.bowlPos = {
            x: S.deliveryBox.x + S.deliveryBox.w / 2,
            y: S.deliveryBox.y + S.deliveryBox.h / 2,
          };
          this.serve(s, true);
          return;
        }
        this.showToast(s ? T('g.counterBusy') : T('g.noOrder'));
      } else if (Math.abs(lx - S.customer.x) < v.W * 0.35 && y < S.counterTop + 140) {
        const walkSlots = this.open.filter((s) => !s.cu.phone);
        const s =
          this.target !== null
            ? (walkSlots.find((q) => q.id === this.target) ?? this.pickSlotFromList(walkSlots))
            : this.pickSlotFromList(walkSlots);
        if (s && (!this.pick || this.pick.phase === 'leave')) {
          this.bowlPos = { x: this.pickupX() + S.customer.size * 0.42, y: S.counterTop + 30 };
          this.serve(s, false);
          return;
        }
        this.showToast(s ? T('g.counterBusy') : this.ringing ? T('g.ringFirst') : T('g.noOrder'));
      }
    }
    this.bowlAt = 'prep';
    this.bowlPos = { x: v.W + this.prepL.bowl.x, y: this.prepL.bowl.y };
    sfx('place');
    this.notify();
  }

  private pickSlotFromList(list: Slot[]): Slot | null {
    const saved = this.open;
    this.open = list;
    const s = this.pickSlotFor(this.bowl);
    this.open = saved;
    return s;
  }

  // ---------- cat ----------
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

  // ---------- hints (days 1–2) ----------
  private currentHint(): Hint | null {
    if (this.level.id > 1) return null; // guidance only on day 1
    const v = this.engine.view;
    if (this.ringing)
      return {
        station: 0,
        x: this.salL.phone.x + this.salL.phone.w / 2,
        y: this.salL.phone.y,
        text: T('g.hintRing'),
      };
    const s = this.open[0];
    if (!s) return null;
    const o = s.cu.members[s.mi].order;
    const Lp = this.prepL;
    const thickName = (tk: Thick) => L(THICK_LABEL[tk]);
    if (this.bowlAt === 'prep') {
      if (!this.bowl.noodle) {
        const i = Math.max(0, this.noods.indexOf(o.noodle ?? 'ramen'));
        const t = Lp.trays[i];
        return {
          station: 1,
          x: v.W + t.x + t.w / 2,
          y: t.y + t.h / 2,
          text: T('g.hintNoodle', {
            n: `${o.thick ? thickName(o.thick) + ' ' : ''}${L(INGREDIENTS[o.noodle ?? 'ramen'].name)}`,
          }),
        };
      }
      if (o.thick && this.bowl.thick !== o.thick)
        return {
          station: 1,
          x: v.W + Lp.thickChips.x + Lp.thickChips.w / 2,
          y: Lp.thickChips.y + Lp.thickChips.h / 2,
          text: T('g.hintThick', { n: thickName(o.thick) }),
        };
      if (!this.bowl.broth || this.bowl.fill < 0.72) {
        const i = Math.max(0, this.liqs.indexOf(o.broth ?? 'shoyu'));
        const p = Lp.pots[i];
        return {
          station: 1,
          x: v.W + p.x + p.w / 2,
          y: p.y + p.h / 2,
          text:
            this.bowl.fill > 0
              ? T('g.hintFillMore')
              : T('g.hintFill', { n: L(INGREDIENTS[o.broth ?? 'shoyu'].name) }),
        };
      }
      const cnt = new Map<string, number>();
      for (const p of this.bowl.pieces) cnt.set(p.id, (cnt.get(p.id) ?? 0) + 1);
      for (const r of o.reqs) {
        const have = cnt.get(r.id) ?? 0;
        const need = r.mode === 'exact' ? (r.n ?? 1) : r.mode === 'bol' ? 5 : 1;
        if (have < need) {
          if (this.held === r.id)
            return { station: 1, x: this.bowlPos.x, y: this.bowlPos.y, text: T('g.hintPlace') };
          const tb = Lp.tubs[Math.max(0, this.tops.indexOf(r.id))];
          const nm = L(INGREDIENTS[r.id].name);
          return {
            station: 1,
            x: v.W + tb.x + tb.w / 2,
            y: tb.y + tb.h / 2,
            text:
              r.mode === 'exact'
                ? T('g.hintTopExact', { n: nm, a: have, b: need })
                : T('g.hintTop', { n: (r.mode === 'bol' ? T('g.hintLots') : '') + nm }),
          };
        }
      }
      return { station: 1, x: this.bowlPos.x, y: this.bowlPos.y, text: T('g.hintCarry') };
    }
    if (this.bowlAt === 'stove') {
      const cs = cookOf(this.bowl);
      const want = o.cook;
      if (cs === want || (cs === 'soft' && want !== 'soft') || cs === 'burnt')
        return {
          station: 2,
          x: this.bowlPos.x,
          y: this.bowlPos.y,
          text: cs === want ? T('g.hintTake') : T('g.hintTakeNow'),
        };
      return {
        station: 2,
        x: 2 * v.W + this.kamL.timer.x,
        y: this.kamL.timer.y,
        text: T('g.hintWait', { n: L(COOK_LABEL[want]) }),
      };
    }
    if (this.bowlAt === 'hand' && this.bowl.noodle && cookOf(this.bowl) !== 'raw') {
      return s.cu.phone
        ? {
            station: 0,
            x: this.salL.deliveryBox.x + this.salL.deliveryBox.w / 2,
            y: this.salL.deliveryBox.y,
            text: T('g.hintBox'),
          }
        : {
            station: 0,
            x: this.salL.customer.x,
            y: this.salL.counterTop + 30,
            text: T('g.hintServe'),
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
    const d = this.drag;
    if (d && d.kind === 'tub' && d.moved) {
      const k = this.prepL.bowl.size / BOWL_SPACE;
      c.save();
      c.translate(d.x, d.y - 16);
      c.scale(k * 1.12 * BOWL_PIECE_SCALE, k * 1.12 * BOWL_PIECE_SCALE);
      drawPiece(c, d.id, d.v, 1, d.rot);
      c.restore();
    }
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
    if (this.intro > 0) {
      this.intro -= dt;
      const v2 = this.engine.view;
      const k = clamp(1 - this.intro / INTRO_LEN, 0, 1);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      this.engine.camTarget = null;
      this.engine.camX = lerp(this.engine.maxCam, 0, e);
      if (this.intro <= 0) {
        this.engine.camX = 0;
        this.notify();
      }
      void v2;
    } else if (!this.dayOver) this.clock += dt;
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) {
        this.toast = null;
        this.notify();
      }
    }
    this.bowlLift = lerp(this.bowlLift, this.bowlAt === 'hand' ? 1 : 0, Math.min(1, dt * 12));
    if (this.drag && this.drag.kind === 'bowl') {
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
        this.bowlPos.x += moved;
        this.pointer.x += moved;
      }
    }
    if (this.drag && this.drag.kind === 'hold' && this.bowlAt === 'prep') {
      const before = this.bowl.fill;
      this.bowl.fill = Math.min(1.22, this.bowl.fill + FILL_RATE * dt);
      if (Math.floor(before * 10) !== Math.floor(this.bowl.fill * 10)) {
        sfx('pour');
        this.notify();
      }
      if (this.bowl.fill >= 1.2 && before < 1.2) this.showToast(T('g.overflow'));
    }
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
    // spawning
    if (!this.dayOver && this.intro <= 0 && this.clock < this.dayLen) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawn();
        this.spawnT = this.spawnGap();
      }
    }
    // patience of open orders & the ringing tablet & the queue
    let tick = false;
    for (const s of [...this.open]) {
      s.waitT += dt;
      if (Math.floor(s.waitT) !== Math.floor(s.waitT - dt)) tick = true;
      if (s.waitT >= s.cu.patience) this.giveUp(s);
    }
    if (this.ringing) {
      this.ringT += dt;
      this.ringing.waitT += dt * 0.6;
      if (this.ringT > 2.4) {
        this.ringT = 0;
        sfx('phone');
      }
      if (this.ringing.waitT >= this.ringing.cu.patience) {
        this.lost++;
        this.scores.push(0);
        this.ringing = null;
        this.showToast(T('g.waitedPhone'));
      }
    }
    for (const q of this.queue) q.patience -= dt * 0.35; // waiting in line eats a little patience
    if (tick) this.notify();
    this.tryRing();
    // counter flow
    this.updateCounter(dt);
    // pickup flow
    this.updatePickup(dt);
    this.updateDelivery(dt);
    // diners
    for (const d of this.diners) {
      d.leaveT -= dt;
      d.bob = Math.sin(t * 2 + d.seed) * 3;
    }
    this.diners = this.diners.filter((d) => d.leaveT > 0);
    if (Math.random() < dt / 60) this.seatExtra(50 + Math.random() * 50);
    // end of day
    if (this.clock >= this.dayLen && !this.dayOver) {
      const nothingLeft = !this.counter && !this.pick && !this.open.length && !this.ringing;
      if (nothingLeft || this.clock > this.dayLen + 120) {
        for (const s of this.open) {
          this.scores.push(0);
          this.lost++;
          void s;
        }
        this.queue = [];
        this.endDay();
      } else if (this.queue.length) this.queue = []; // the line goes home
    }
  }

  private updateCounter(dt: number) {
    switch (this.phase) {
      case 'idle':
        if (
          !this.counter &&
          (!this.pick || this.pick.phase === 'delivering') &&
          this.queue.length &&
          !this.open.some((o) => !o.cu.phone) &&
          !this.ringing &&
          !(this.calls.length && this.phaseT < 2.5) &&
          this.phaseT > 0.8
        ) {
          this.counter = this.queue.shift()!;
          this.mi = 0;
          this.counterY = 0;
          this.phase = 'enter';
          this.phaseT = 0;
          this.notify();
        }
        break;
      case 'enter':
        this.counterY = Math.min(1, this.counterY + dt * 1.1);
        if (this.phaseT > 1.0 && this.counter) {
          this.phase = 'greet';
          this.phaseT = 0;
          this.setBubble(this.counter.members[0].name, this.counter.greet, 'counter');
        }
        break;
      case 'greet':
        if (
          this.phaseT > 1.6 &&
          (!this.bubble ||
            this.bubble.at !== 'counter' ||
            this.bubble.shown >= this.bubble.text.length)
        )
          this.startOrder();
        break;
      case 'order':
        if (
          this.phaseT > 1.2 &&
          (!this.bubble ||
            this.bubble.at !== 'counter' ||
            this.bubble.shown >= this.bubble.text.length)
        ) {
          const cu = this.counter!;
          this.placeOrder(cu, this.mi);
          if (this.mi + 1 < cu.members.length) {
            this.mi++;
            this.startOrder();
          } else {
            this.phase = 'waiting';
            this.phaseT = 0;
          }
          this.notify();
        }
        break;
      case 'waiting':
        break; // stands at the counter until the bowl arrives (serve() takes over)
      case 'toTable':
        this.counterY = Math.max(0, this.counterY - dt * 1.4);
        if (this.phaseT > 0.8 && this.counter) {
          this.seatGroup(this.counter);
          this.counter = null;
          this.phase = 'idle';
          this.phaseT = 0;
          this.notify();
        }
        break;
    }
  }

  private updatePickup(dt: number) {
    const pk = this.pick;
    if (!pk) return;
    pk.t += dt;
    const m = pk.cu.members[pk.mi];
    switch (pk.phase) {
      case 'pickup':
        if (!this.counter) {
          pk.phase = 'served';
          pk.t = 0;
        }
        break;
      case 'served':
        this.pickY = Math.min(1, this.pickY + dt * 1.3);
        if (pk.t > 2.4) {
          const sc = pk.score;
          const complaint = pk.score < 70 && pk.notes.length > 0;
          pk.phase = complaint ? 'complain' : 'react';
          pk.t = 0;
          const notes = pk.notes
            .slice(0, 2)
            .map((n) => L(n))
            .join(' · ');
          if (complaint) {
            this.setBubble(m.name, T('g.complain', { notes }), 'pickup', 'bad');
            sfx('angry');
          } else {
            this.setBubble(
              m.name,
              reactionLine(pk.cu, sc) + (notes ? `  (${notes})` : ''),
              'pickup',
              pk.tone
            );
            if (sc >= 85) {
              sfx('perfect');
              this.fx.emit(
                'heart',
                this.pickupX(),
                this.salL.customer.y - this.salL.customer.size,
                5,
                30
              );
            } else sfx('ding');
          }
          this.notify();
        }
        break;
      case 'complain':
        break; // waits for apologize()
      case 'react':
        if (
          this.pendingSorryReply &&
          pk.t > 2.0 &&
          this.bubble &&
          this.bubble.shown >= this.bubble.text.length
        ) {
          this.setBubble(this.pendingSorryReply, T('g.sorryReply'), 'pickup', 'neutral');
          this.pendingSorryReply = null;
          pk.t = 0;
          break;
        }
        if (pk.t > 2.0 && this.bubble && this.bubble.shown >= this.bubble.text.length)
          this.afterReaction();
        break;
      case 'pay':
        break; // cash UI
      case 'leave':
        if (pk.t > 1.0) {
          for (const d of this.diners) if (d.cuId === pk.cu.id) d.hidden = false;
          this.pick = null;
          this.bubble = this.bubble?.at === 'pickup' ? null : this.bubble;
          this.notify();
        }
        break;
      case 'delivering':
        break; // handled by updateDelivery
    }
  }

  private updateDelivery(dt: number) {
    const d = this.delivery;
    if (!d) return;
    d.t += dt;
    if (this.scooter) {
      this.scooter.t += dt;
      this.scooter.x += dt * 420;
    }
    if (d.t > 1.4 && d.t - dt <= 1.4)
      this.setBubble(
        L('Rüzgar'),
        T('g.onTheWay') +
          `${T('g.app')}: "${reactionLine(d.cu, d.score)}" ★${(d.score / 20).toFixed(1)}`,
        'phone',
        d.tone
      );
    if (d.t > 4.2) {
      this.scooter = null;
      this.delivery = null;
      this.notify();
    }
  }

  private spawnGap() {
    const busy = this.level.customers / this.level.minutes;
    return clamp(16 / busy, 3, 12) * (0.6 + Math.random() * 0.8);
  }

  private memberX(base: number, i: number, n: number) {
    const spread = this.salL.customer.size * 0.7;
    return base + (i - (n - 1) / 2) * spread;
  }

  // ---------- drawing ----------
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
    const opts = {
      rain: !!this.level.rain,
      diners: this.diners.filter((d) => d.seat >= 0 && !d.hidden),
      phoneRinging: !!this.ringing,
      boxOpen: this.open.some((s) => s.cu.phone),
      tipCoins: this.tipCoins,
      cashOnCounter: this.pick?.phase === 'pay',
      lampsOn: TOD_LIGHT[tod].lamp > 0,
    };
    drawSalonBack(c, v.W, v.H, this.decor, tod, t, opts);
    // standing-and-waiting diners (no free seat) + the queue, behind the counter people
    const nAtCounter = this.counter ? this.counter.members.length : 1;
    const qshift =
      (nAtCounter - 1) * S.customer.size * 0.32 +
      (this.pick && this.counter ? S.customer.size * 0.4 : 0);
    const qs = this.queueSpots().map((q) => ({ ...q, x: q.x + qshift }));
    const standing = this.diners.filter((d) => d.seat < 0);
    standing.slice(0, 3).forEach((d, i) => {
      const sp = qs[Math.min(2, i)];
      drawAvatar(c, d.look, 'neutral', sp.x + 40 * i, sp.y - 60, sp.size * 0.9, {
        pose: 'queue',
        bob: d.bob,
      });
    });
    this.queue.slice(0, 0).forEach((cu, i) => {
      const sp = qs[Math.min(qs.length - 1, i)];
      cu.members.forEach((m, k) => {
        drawAvatar(
          c,
          m.look,
          'neutral',
          sp.x + k * sp.size * 0.45,
          sp.y + k * 4,
          sp.size * (m.look.kid ? 0.82 : 1),
          { pose: 'queue', bob: Math.sin(t * 1.5 + i + k) * 2 }
        );
      });
    });
    // ordering customer(s)
    if (this.counter && this.counterY > 0) {
      const cu = this.counter;
      const n = cu.members.length;
      const base = this.counterX();
      const order = cu.members
        .map((_, i) => i)
        .sort((a, b) => (a === this.mi ? 1 : b === this.mi ? -1 : 0));
      for (const i of order) {
        const m = cu.members[i];
        const active = i === this.mi;
        const size = S.customer.size * (m.look.kid ? 0.82 : 1) * (n > 1 ? 0.86 : 1);
        c.save();
        const k = this.counterY;
        const ease = 1 - Math.pow(1 - k, 3);
        let px = this.memberX(base, i, n);
        let py = S.customer.y + (active ? 0 : 10);
        let psize = size;
        if (this.phase === 'enter') {
          // walks in from the door (left), bobbing
          px = lerp(-size * 0.7, px, ease);
          py += Math.abs(Math.sin(k * 14)) * -6;
        } else if (this.phase === 'toTable' && this.leaveTo) {
          const g = 1 - k;
          const ge = g * g;
          px = lerp(px, this.leaveTo.x, ge);
          py = lerp(py, this.leaveTo.y + 10, ge);
          psize = lerp(size, size * 0.55, ge);
          c.globalAlpha = 1 - Math.max(0, (ge - 0.75) * 4);
        }
        drawAvatar(
          c,
          m.look,
          active ? 'neutral' : i < this.mi ? 'happy' : 'neutral',
          px,
          py,
          psize,
          {
            pose: 'stand',
            talking:
              active &&
              this.phase === 'order' &&
              !!this.bubble &&
              this.bubble.shown < this.bubble.text.length,
            bob: Math.sin(t * 2 + i) * 2,
          }
        );
        c.restore();
      }
    }
    // pickup customer
    const pk = this.pick;
    if (pk && pk.phase !== 'delivering' && this.pickY > 0) {
      const m = pk.cu.members[pk.mi];
      const mood: Mood =
        pk.phase === 'served'
          ? 'happy'
          : pk.score >= 85
            ? 'love'
            : pk.score >= 70
              ? 'happy'
              : pk.score >= 45
                ? 'worried'
                : 'angry';
      const size = S.customer.size * (m.look.kid ? 0.82 : 1);
      c.save();
      let px = this.pickupX();
      let py = S.customer.y + (1 - this.pickY) * 60;
      let psize = size;
      if (pk.phase === 'leave' && pk.t > 0 && this.leaveTo) {
        // walks off to the table, shrinking into the room
        const g = Math.min(1, pk.t / 0.9);
        const ge = g * g;
        px = lerp(px, this.leaveTo.x, ge);
        py = lerp(py, this.leaveTo.y + 10, ge);
        psize = lerp(size, size * 0.55, ge);
        c.globalAlpha = 1 - Math.max(0, (ge - 0.75) * 4);
      } else c.globalAlpha = this.pickY;
      drawAvatar(
        c,
        m.look,
        pk.phase === 'pay' || pk.phase === 'leave'
          ? this.groups.get(pk.cu.id)?.complained
            ? 'neutral'
            : 'happy'
          : mood,
        px,
        py,
        psize,
        { pose: 'stand', eating: pk.phase === 'served', bob: Math.sin(t * 2) * 2 }
      );
      c.restore();
    }
    if (this.cat.spot !== 0)
      drawCat(c, this.cat.x, this.cat.y, 64, this.cat.pose, t, this.cat.flip);
    drawSalonFront(c, v.W, v.H, this.decor, tod, t, opts);
    if (this.cat.spot === 0)
      drawCat(c, this.cat.x, this.cat.y, 56, this.cat.pose, t, this.cat.flip);
    if (
      pk &&
      pk.bowl &&
      (pk.phase === 'served' || pk.phase === 'react' || pk.phase === 'complain')
    ) {
      c.save();
      c.translate(this.servedPos.x, this.servedPos.y);
      const eaten = pk.phase !== 'served' ? 1 : Math.min(1, pk.t / 2.4);
      drawBowlTop(
        c,
        eaten > 0.6 ? { ...pk.bowl, pieces: [], fill: pk.bowl.fill * 0.2 } : pk.bowl,
        S.customer.size * 0.4,
        t,
        { steam: 0.6 }
      );
      c.restore();
    }
    if (this.scooter)
      drawScooter(c, this.scooter.x, S.counterTop + 40, 120, t, { rider: true, box: true });
    drawSalonLight(c, v.W, v.H, this.decor, tod);
    const h = this.currentHint();
    if (h && h.station === 0) drawPointerHint(c, h.x, h.y, t);
  }

  private drawPrep(c: Ctx, v: View, t: number) {
    const Lp = this.prepL;
    c.save();
    c.translate(v.W, 0);
    drawPrepBack(c, v.W, v.H, this.level.time, t, Lp);
    Lp.shelf.slots.forEach((s, i) => {
      const b = BOWLS[i];
      if (!b || b.unlock > this.level.id) return;
      c.save();
      c.translate(s.x, s.y);
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
    Lp.trays.forEach((r, i) => {
      const id = this.noods[i];
      if (!id) return;
      c.save();
      c.translate(r.x, r.y);
      drawNoodleTray(c, id, this.bowl.thick, r.w, r.h);
      c.restore();
      if (this.bowl.noodle === id) this.ringSlot(c, r);
      this.slotLabel(c, L(INGREDIENTS[id].name), r);
    });
    {
      const r = Lp.thickChips;
      const vertical = r.h > r.w * 0.8;
      const cw = vertical ? r.w : r.w / 3;
      const ch = vertical ? r.h / 3 : r.h;
      (['ince', 'orta', 'kalin'] as Thick[]).forEach((tk, i) => {
        const x = vertical ? r.x : r.x + i * cw;
        const y = vertical ? r.y + i * ch : r.y;
        const on = this.bowl.thick === tk;
        c.fillStyle = on ? PAL.coral : rgba(PAL.white, 0.75);
        c.strokeStyle = rgba(PAL.walnut, 0.35);
        c.lineWidth = 1.5;
        c.beginPath();
        c.roundRect(x + 3, y + 2, cw - 6, ch - 4, (ch - 4) / 2);
        c.fill();
        c.stroke();
        const label = L(THICK_LABEL[tk]);
        let fs = Math.round((ch - 4) * 0.5);
        c.font = `800 ${fs}px "Baloo 2", system-ui`;
        while (fs > 10 && c.measureText(label).width > cw - 18) {
          fs--;
          c.font = `800 ${fs}px "Baloo 2", system-ui`;
        }
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = on ? '#fff' : PAL.ink;
        c.fillText(label, x + cw / 2, y + ch / 2 + 1);
      });
    }
    Lp.pots.forEach((r, i) => {
      const id = this.liqs[i];
      if (!id) return;
      c.save();
      c.translate(r.x, r.y);
      drawPot(c, id, r.w, r.h, t);
      c.restore();
      if (this.bowl.broth === id) this.ringSlot(c, r);
      this.slotLabel(c, L(INGREDIENTS[id].name), r);
    });
    Lp.tubs.forEach((r, i) => {
      const id = this.tops[i];
      if (!id) return;
      c.save();
      c.translate(r.x, r.y);
      drawTub(c, id, r.w, r.h);
      c.restore();
      const n = this.bowl.pieces.filter((p) => p.id === id).length;
      if (n) this.countBadge(c, r, n);
      if (this.held === id) {
        c.save();
        c.strokeStyle = rgba(PAL.coral, 0.95);
        c.lineWidth = 4;
        c.setLineDash([10, 6]);
        c.lineDashOffset = -t * 30;
        c.beginPath();
        c.roundRect(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 18);
        c.stroke();
        c.restore();
      }
    });
    if (this.bowl.broth || this.bowl.fill > 0) {
      const g = Lp.gauge;
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
    c.restore();
    if (this.bowlAt === 'prep') this.drawTheBowl(c, t, Lp.bowl.size);
    if (this.held && this.bowlAt === 'prep') {
      // the picked topping hovers above the bowl so the player knows what the next tap places
      const k = Lp.bowl.size / BOWL_SPACE;
      c.save();
      c.globalAlpha = 0.9;
      c.translate(
        this.bowlPos.x + Lp.bowl.size * 0.36,
        this.bowlPos.y - Lp.bowl.size * 0.46 + Math.sin(t * 3) * 4
      );
      c.scale(k * 1.1 * BOWL_PIECE_SCALE, k * 1.1 * BOWL_PIECE_SCALE);
      drawPiece(c, this.held, 0, 1, 0);
      c.restore();
    }
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

export type { Look, Member };

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
