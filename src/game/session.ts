// One working day at Nami-ya: customers, the plate, the rolling board, heat, money.
// Plain mutable state; the canvas reads it every frame and React listens to `bump()`.

import { sfx, buzz } from './audio';
import {
  type Day,
  type IngId,
  type PlateId,
  type Speaker,
  ING,
  NAMES_EN,
  NAMES_TR,
  hasHeat,
  hasStation2,
  unlockedIngs,
  unlockedPlates,
} from './data';
import { getLang, tx, type L, money, t as tt } from './i18n';
import {
  type Order,
  type Score,
  makeOrder,
  mulberry,
  orderPrice,
  orderSpeech,
  pieceCost,
  REASON_TEXT,
  scorePlate,
  specialOrder,
  STYLE_DAY,
} from './orders';
import {
  type CutQ,
  type Done,
  type Hand,
  type MakiStyle,
  type Piece,
  type PieceBody,
  type PlateState,
  type RiceQ,
  type RollQ,
  type Thick,
  newUid,
  pieceRadius,
} from './plate';
import type { Review } from './save';

export type Mood = 'happy' | 'neutral' | 'worried' | 'angry' | 'love';
export type CState =
  | 'queue'
  | 'enter'
  | 'order'
  | 'wait'
  | 'eat'
  | 'react'
  | 'complain'
  | 'pay'
  | 'toTable'
  | 'table'
  | 'leave';

export interface Customer {
  id: number;
  seed: number;
  kid: boolean;
  female: boolean;
  nameIdx: number;
  special?: Speaker;
  bonus?: number;
  state: CState;
  st: number; // time in state
  x: number; // salon fraction 0..1
  fromX: number;
  toX: number;
  walkDur: number;
  order: Order;
  greet?: L;
  /** speech is rebuilt from this so it follows the language toggle */
  say: () => string;
  sayAt: number;
  patience: number;
  patienceMax: number;
  doorWait: number;
  mood: Mood;
  bill: number;
  cash: number;
  score?: Score;
  sat?: number;
  tip: number;
  table: number;
  eatLeft: number;
  angryLeave?: boolean;
  apologized?: boolean;
}

export interface OnlineOrder {
  id: number;
  nameIdx: number;
  female: boolean;
  order: Order;
  status: 'waiting' | 'ringing' | 'active' | 'packed' | 'delivered';
  age: number;
  stars?: number;
  summary: L;
}

export type Board =
  | { m: 'idle' }
  | {
      m: 'maki';
      style: MakiStyle;
      stage: 'rice' | 'fill' | 'rolling' | 'cut';
      rice: number;
      riceQ?: RiceQ;
      fill: IngId[];
      coat?: IngId;
      prog: number;
      speed: number;
      roll?: RollQ;
      n: 6 | 8;
      cutT: number;
      done?: Done;
    }
  | { m: 'temaki'; stage: 'rice' | 'fill'; rice: number; riceQ?: RiceQ; fill: IngId[]; n: 1 | 2 }
  | { m: 'sashimi'; fish: IngId; n: 3 | 5; cutT: number };

export interface Cook {
  ing: IngId; // raw: shrimp | eel
  t: number; // 0..1+ along the dial
}

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'good' | 'bad' | 'unlock';
  t: number;
}

export interface Ledger {
  sales: number;
  tips: number;
  ing: number;
  waste: number;
  overpaid: number;
  bonus: number;
  served: number;
  complaints: number;
  walkouts: number;
  satSum: number;
  satN: number;
}

export interface Coin {
  x: number;
  y: number;
  vy: number;
  rest: boolean;
  kind: number;
  rot: number;
}

export interface Fx {
  kind: 'sparkle' | 'smoke' | 'grain' | 'heart' | 'steam' | 'puff' | 'drop';
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
  s: number;
  station: number;
}

export interface Courier {
  t: number;
  order: OnlineOrder;
}

/** seats at tables in the back of the dining room, as salon fractions */
export const TABLE_SEATS = [0.14, 0.24, 0.76, 0.86];
export const DOOR_X = -0.04;
export const COUNTER_X = 0.5;
export const QUEUE_X = [0.1, 0.03];

export const RICE_MAX = 1.45;
export function riceQuality(a: number): RiceQ {
  return a < 0.62 ? 'less' : a <= 1.02 ? 'just' : 'more';
}
export const DIAL = { done: 0.45, over: 0.7, burnt: 0.88 };
export function doneness(t: number): Done {
  return t < DIAL.done ? 'raw' : t < DIAL.over ? 'done' : t < DIAL.burnt ? 'over' : 'burnt';
}
/** sashimi cut bar zones */
export const SASHIMI_ZONES: { a: number; b: number; q: Thick | null }[] = [
  { a: 0, b: 0.1, q: null },
  { a: 0.1, b: 0.3, q: 'thin' },
  { a: 0.3, b: 0.38, q: null },
  { a: 0.38, b: 0.62, q: 'normal' },
  { a: 0.62, b: 0.7, q: null },
  { a: 0.7, b: 0.9, q: 'thick' },
  { a: 0.9, b: 1, q: null },
];
export const MAKI_GREEN = { a: 0.38, b: 0.62 };
export function cutMarker(t: number, period: number) {
  const p = (t / period) % 2;
  return p < 1 ? p : 2 - p;
}

export class Session {
  day: Day;
  n: number;
  rng: () => number;
  t = 0;
  started = false;
  over = false;
  paused = false;
  customers: Customer[] = [];
  counter: Customer | null = null;
  plate: PlateState;
  served: { plate: PlateState; cust: Customer | null; t: number } | null = null;
  hand: Hand | null = null;
  board: Board = { m: 'idle' };
  squeeze: { a: number; on: boolean } = { a: 0, on: false };
  heat: { fryer: Cook | null; grill: Cook | null } = { fryer: null, grill: null };
  prepared: Partial<Record<IngId, Done[]>> = {};
  ledger: Ledger = {
    sales: 0,
    tips: 0,
    ing: 0,
    waste: 0,
    overpaid: 0,
    bonus: 0,
    served: 0,
    complaints: 0,
    walkouts: 0,
    satSum: 0,
    satN: 0,
  };
  online: OnlineOrder[] = [];
  activeOnline: OnlineOrder | null = null;
  onlineTimer = 70;
  couriers: Courier[] = [];
  doorBox: OnlineOrder | null = null;
  coins: Coin[] = [];
  fx: Fx[] = [];
  toasts: Toast[] = [];
  reviews: Review[] = [];
  drawer: { open: boolean; given: number[]; warn: number } = { open: false, given: [], warn: 0 };
  spawnTimer = 4;
  nextId = 1;
  have: Set<IngId>;
  plates: PlateId[];
  station2: boolean;
  heatOn: boolean;
  tipBonus: number;
  tutorial: boolean;
  guestsLeft: { who: Speaker; at: number; greet: L; order: string; bonus: number }[];
  /** set by the view: station requested by game logic */
  wantStation: number | null = null;
  /** current station the camera is at (written by the view) */
  station = 0;
  version = 0;
  private listeners = new Set<() => void>();
  private tableUse: (Customer | null)[] = [null, null, null, null];

  constructor(day: Day, opts: { tipBonus: number; seed?: number }) {
    this.day = day;
    this.n = day.n;
    this.rng = mulberry(opts.seed ?? day.n * 7919 + Math.floor(Math.random() * 1e6));
    this.have = unlockedIngs(day.n);
    this.plates = unlockedPlates(day.n);
    this.station2 = hasStation2(day.n);
    this.heatOn = hasHeat(day.n);
    this.tipBonus = opts.tipBonus;
    this.tutorial = day.n === 1;
    this.plate = { id: 'geta', pieces: [] };
    this.guestsLeft = [...(day.guests ?? [])].sort((a, b) => a.at - b.at);
  }

  // ---------- plumbing ----------

  on(f: () => void) {
    this.listeners.add(f);
    return () => this.listeners.delete(f);
  }
  bump() {
    this.version++;
    this.listeners.forEach((f) => f());
  }
  toast(text: string, kind: Toast['kind'] = 'info') {
    this.toasts.push({ id: this.nextId++, text, kind, t: 0 });
    if (this.toasts.length > 3) this.toasts.shift();
    this.bump();
  }
  goStation(i: number) {
    this.wantStation = i;
  }

  get name() {
    return (c: { nameIdx: number; female: boolean; special?: Speaker }) => {
      const list = getLang() === 'tr' ? NAMES_TR : NAMES_EN;
      return (c.female ? list.f : list.m)[c.nameIdx % 12];
    };
  }

  /** current order on the ticket rail */
  get activeOrder(): Order | null {
    if (this.activeOnline) return this.activeOnline.order;
    const c = this.counter;
    if (c && (c.state === 'wait' || c.state === 'order')) return c.order;
    return null;
  }

  get clock(): string {
    const ranges: Record<string, [number, number]> = {
      morning: [8 * 60, 11 * 60 + 30],
      noon: [11 * 60 + 30, 15 * 60],
      sunset: [16 * 60 + 30, 20 * 60],
      evening: [19 * 60, 22 * 60 + 30],
    };
    const [a, b] = ranges[this.day.time];
    const m = Math.round(a + (b - a) * Math.min(1, this.t / this.day.duration));
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  get open() {
    return this.t < this.day.duration;
  }

  // ---------- main tick ----------

  tick(dt: number) {
    if (!this.started || this.over || this.paused) return;
    this.t += dt;

    this.toasts.forEach((x) => (x.t += dt));
    const before = this.toasts.length;
    this.toasts = this.toasts.filter((x) => x.t < 3.2);
    if (this.toasts.length !== before) this.bump();

    this.tickSpawns(dt);
    this.tickOnline(dt);
    for (const c of [...this.customers]) this.tickCustomer(c, dt);
    this.tickHeat(dt);
    this.tickBoard(dt);
    this.tickSqueeze(dt);
    this.tickCoins(dt);
    this.tickFx(dt);
    if (this.served) this.served.t += dt;
    this.couriers.forEach((c) => (c.t += dt));
    const leaving = this.couriers.filter((c) => c.t > 9);
    if (leaving.length) {
      this.couriers = this.couriers.filter((c) => c.t <= 9);
    }
    for (const c of this.couriers)
      if (c.t > 3.2 && this.doorBox === c.order) {
        this.doorBox = null;
        this.deliver(c.order);
      }
    this.drawer.warn = Math.max(0, this.drawer.warn - dt);

    if (!this.open && !this.over) this.checkEnd();
  }

  private checkEnd() {
    const busy =
      this.counter ||
      this.activeOnline ||
      this.doorBox ||
      this.customers.some((c) => c.state === 'queue' || c.state === 'enter');
    if (!busy) {
      // anyone still calling is told we're closed
      this.online
        .filter((o) => o.status === 'waiting' || o.status === 'ringing')
        .forEach((o) => {
          o.status = 'delivered';
          o.stars = 0;
        });
      this.over = true;
      sfx('win');
      this.bump();
    }
  }

  private tickSpawns(dt: number) {
    if (!this.open) return;
    // special guests arrive at their moment and jump the queue
    const g = this.guestsLeft[0];
    if (g && this.t >= g.at * this.day.duration) {
      if (this.queue.length < 2) {
        this.guestsLeft.shift();
        this.spawn({
          special: g.who,
          greet: g.greet,
          order: specialOrder(g.order),
          bonus: g.bonus,
        });
      }
      return;
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const q = this.queue.length;
    if (this.tutorial && (this.counter || q > 0)) {
      this.spawnTimer = 2;
      return;
    }
    if (q >= 2) {
      this.spawnTimer = 4;
      return;
    }
    this.spawn({});
    const jitter = 0.75 + this.rng() * 0.5;
    this.spawnTimer = this.day.spawn * jitter * (this.customers.length === 1 ? 0.6 : 1);
  }

  get queue() {
    return this.customers.filter((c) => c.state === 'queue');
  }

  private spawn(o: { special?: Speaker; greet?: L; order?: Order; bonus?: number }) {
    const kid = !o.special && this.n >= 2 && this.rng() < 0.2;
    const female = this.rng() < 0.5;
    const order = o.order ?? makeOrder(this.day, this.rng, { kid });
    const seed = Math.floor(this.rng() * 1e9);
    const r2 = mulberry(seed);
    const c: Customer = {
      id: this.nextId++,
      seed,
      kid,
      female,
      nameIdx: Math.floor(this.rng() * 12),
      special: o.special,
      bonus: o.bonus,
      state: 'queue',
      st: 0,
      x: DOOR_X,
      fromX: DOOR_X,
      toX: QUEUE_X[Math.min(1, this.queue.length)],
      walkDur: 1.6,
      order,
      greet: o.greet,
      say: () => (o.greet ? tx(o.greet) : orderSpeech(order, mulberry(seed), kid)),
      sayAt: 0,
      patience: this.day.patience,
      patienceMax: this.day.patience,
      doorWait: 0,
      mood: 'neutral',
      bill: orderPrice(order),
      cash: 0,
      tip: 0,
      table: -1,
      eatLeft: 0,
    };
    void r2;
    if (o.special) {
      // special guests go to the front of the line
      this.customers.unshift(c);
    } else this.customers.push(c);
    this.reflowQueue();
    sfx('door');
  }

  private reflowQueue() {
    this.queue.forEach((c, i) => {
      const target = QUEUE_X[Math.min(1, i)];
      if (Math.abs(c.toX - target) > 0.001) this.walk(c, target, 1.2);
    });
  }

  private walk(c: Customer, to: number, dur: number) {
    c.fromX = c.x;
    c.toX = to;
    c.walkDur = dur;
    c.st = 0;
  }

  private setState(c: Customer, s: CState) {
    c.state = s;
    c.st = 0;
    this.bump();
  }

  private tickCustomer(c: Customer, dt: number) {
    c.st += dt;
    // walking
    if (c.x !== c.toX) {
      const k = Math.min(1, c.st / c.walkDur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      c.x = c.fromX + (c.toX - c.fromX) * e;
      if (k >= 1) c.x = c.toX;
    }
    switch (c.state) {
      case 'queue': {
        c.doorWait += dt;
        const first = this.queue[0] === c;
        const ringBlock = this.online.some((o) => o.status === 'ringing') && c.doorWait < 15;
        if (first && !this.counter && !this.activeOnline && !ringBlock) {
          this.counter = c;
          this.walk(c, COUNTER_X, 2.2);
          this.setState(c, 'enter');
          this.reflowQueue();
        } else if (c.doorWait > 75 && !c.special) {
          this.ledger.walkouts++;
          c.angryLeave = true;
          c.mood = 'angry';
          this.walk(c, DOOR_X - 0.1, 1.6);
          this.setState(c, 'leave');
          this.reflowQueue();
        }
        break;
      }
      case 'enter':
        if (c.x === c.toX && c.st > 2.2) {
          this.setState(c, 'order');
          c.sayAt = 0;
          sfx('bubble');
        }
        break;
      case 'order': {
        c.sayAt += dt;
        const len = c.say().length;
        // typing speed ~32 chars/s, then the ticket drops
        if (c.sayAt * 32 >= len + 10) {
          this.setState(c, 'wait');
          sfx('ding');
          if (this.tutorial) this.goStation(1);
        }
        break;
      }
      case 'wait': {
        if (!this.tutorial) c.patience -= dt;
        const f = c.patience / c.patienceMax;
        c.mood = f > 0.6 ? 'neutral' : f > 0.3 ? 'worried' : 'angry';
        if (c.patience <= 0) {
          c.angryLeave = true;
          c.mood = 'angry';
          c.sat = 0;
          this.ledger.walkouts++;
          this.ledger.satN++;
          this.counter = null;
          this.walk(c, DOOR_X - 0.1, 2.4);
          this.setState(c, 'leave');
          sfx('angry');
          this.addReview(c.nameIdx, c.female, 1, false);
          this.toast(
            getLang() === 'tr' ? 'Müşteri bekleyemedi, gitti!' : 'The customer gave up and left!',
            'bad'
          );
        }
        break;
      }
      case 'eat':
        if (c.st > 2.6) this.finishEating(c);
        break;
      case 'react':
        if (c.st > 2.2) this.startPay(c);
        break;
      case 'complain':
        break;
      case 'pay':
        break;
      case 'toTable':
        if (c.x === c.toX && c.st >= c.walkDur) this.setState(c, 'table');
        break;
      case 'table':
        if (c.st > c.eatLeft) {
          this.tableUse[c.table] = null;
          this.walk(c, DOOR_X - 0.1, 2.6);
          this.setState(c, 'leave');
        }
        break;
      case 'leave':
        if (c.x === c.toX) this.customers = this.customers.filter((x) => x !== c);
        break;
    }
  }

  // ---------- serving ----------

  canServe() {
    const c = this.counter;
    if (this.activeOnline) return this.plate.pieces.length > 0;
    return !!c && c.state === 'wait' && this.plate.pieces.length > 0;
  }

  serve() {
    if (!this.canServe()) {
      if (!this.plate.pieces.length) this.toast(t2('plateEmpty'));
      else this.toast(t2('noCustomer'));
      return;
    }
    if (this.activeOnline) return this.pack();
    const c = this.counter!;
    this.hand = this.hand?.k === 'plate' ? null : this.hand;
    c.score = scorePlate(c.order, this.plate.pieces, this.plate.id);
    this.served = { plate: this.plate, cust: c, t: 0 };
    this.plate = { id: this.plate.id, pieces: [] };
    this.setState(c, 'eat');
    this.goStation(0);
    sfx('place');
    buzz(12);
  }

  private finishEating(c: Customer) {
    const sc = c.score!;
    const pf = Math.max(0, c.patience / c.patienceMax);
    const sat = this.tutorial ? sc.score : Math.round(sc.score - (1 - pf) * 12);
    c.sat = Math.max(0, Math.min(100, sat));
    c.mood =
      c.sat >= 95
        ? 'love'
        : c.sat >= 78
          ? 'happy'
          : c.sat >= 58
            ? 'neutral'
            : c.sat >= 38
              ? 'worried'
              : 'angry';
    this.ledger.satSum += c.sat;
    this.ledger.satN++;
    this.ledger.served++;
    if (c.mood === 'love' || c.mood === 'happy') sfx('perfect');
    else if (sc.complaint) sfx('fail');
    for (let i = 0; i < (c.mood === 'love' ? 8 : 3); i++)
      this.addFx(
        c.mood === 'love' ? 'heart' : 'sparkle',
        COUNTER_X + (this.rng() - 0.5) * 0.12,
        0.42,
        0
      );
    if (sc.complaint) {
      this.ledger.complaints++;
      this.setState(c, 'complain');
    } else this.setState(c, 'react');
  }

  apologize() {
    const c = this.counter;
    if (!c || c.state !== 'complain') return;
    c.apologized = true;
    sfx('tap');
    this.setState(c, 'react');
  }

  private startPay(c: Customer) {
    // the customer pays cash and says the change out loud
    const notes = [5, 10, 20, 50, 100, 200];
    const i = notes.findIndex((x) => x >= c.bill);
    const idx = Math.min(notes.length - 1, i + (this.rng() < 0.3 ? 1 : 0));
    c.cash = notes[idx];
    if (c.cash < c.bill) c.cash = Math.ceil(c.bill / 10) * 10;
    const pf = Math.max(0, c.patience / c.patienceMax);
    const speed = this.tutorial ? 1.2 : pf > 0.6 ? 1.4 : pf > 0.3 ? 1 : 0.7;
    const base = c.bill * Math.pow((c.sat ?? 0) / 100, 2) * 0.22;
    c.tip = c.apologized || c.score?.complaint ? 0 : Math.round(base * speed * (1 + this.tipBonus));
    if (c.special && (c.sat ?? 0) >= 70 && !c.score?.complaint) {
      this.ledger.bonus += c.bonus ?? 0;
      this.toast(
        (getLang() === 'tr' ? 'Özel misafir bonusu ' : 'Special guest bonus ') +
          money(c.bonus ?? 0),
        'good'
      );
    }
    this.ledger.sales += c.bill;
    this.drawer = { open: c.cash > c.bill, given: [], warn: 0 };
    this.setState(c, 'pay');
    c.sayAt = 0;
    if (c.cash === c.bill) setTimeout(() => this.finishPay(c), 1400);
    else if (this.tutorial) this.goStation(0);
  }

  /** words while paying */
  paySpeech(c: Customer): string {
    const tr = getLang() === 'tr';
    const change = c.cash - c.bill;
    if (change === 0)
      return tr
        ? `Hesap ${money(c.bill)}, tam para. Buyur!`
        : `That’s ${money(c.bill)}, exact change. Here!`;
    return tr
      ? `Hesap ${money(c.bill)}, buyur ${money(c.cash)}. ${money(change)} üstü.`
      : `That’s ${money(c.bill)}, here’s ${money(c.cash)}. ${money(change)} change, please.`;
  }

  reactSpeech(c: Customer): string {
    const tr = getLang() === 'tr';
    if (c.state === 'complain') {
      const r = c.score?.reasons[0] ?? 'missing';
      return tx(REASON_TEXT[r]);
    }
    if (c.apologized) return tr ? 'Peki… ama bahşiş yok.' : 'Fine… but no tip.';
    const m = c.mood;
    const pool: Record<Mood, L[]> = {
      love: [
        { tr: 'Bu… muhteşem! Ağzımda eriyor!', en: 'This is… amazing! It melts in my mouth!' },
        { tr: 'Hayatımın en güzel sushisi!', en: 'Best sushi of my life!' },
      ],
      happy: [
        { tr: 'Çok lezzetli, eline sağlık!', en: 'Delicious, great job!' },
        { tr: 'Mmm, tam istediğim gibi.', en: 'Mmm, just how I wanted it.' },
      ],
      neutral: [
        { tr: 'Fena değil.', en: 'Not bad.' },
        { tr: 'İdare eder.', en: 'It’s okay.' },
      ],
      worried: [
        { tr: 'Hmm… daha iyisini beklerdim.', en: 'Hmm… I expected better.' },
        { tr: 'Biraz bekledim ama…', en: 'I waited a while, but…' },
      ],
      angry: [{ tr: 'Hiç memnun kalmadım.', en: 'I’m not happy at all.' }],
    };
    return tx(pool[m][c.id % pool[m].length]);
  }

  addMoney(v: number) {
    if (!this.drawer.open) return;
    this.drawer.given.push(v);
    sfx('coins');
    this.bump();
  }
  clearMoney() {
    this.drawer.given = [];
    this.bump();
  }
  get givenTotal() {
    return this.drawer.given.reduce((a, b) => a + b, 0);
  }

  giveChange() {
    const c = this.counter;
    if (!c || c.state !== 'pay') return;
    const due = c.cash - c.bill;
    const g = this.givenTotal;
    if (g < due) {
      this.drawer.warn = 2.5;
      sfx('fail');
      this.bump();
      return;
    }
    if (g > due) {
      this.ledger.overpaid += g - due;
      this.toast(
        getLang() === 'tr' ? 'Sağ ol! (fazla verdin)' : 'Thanks! (you gave too much)',
        'bad'
      );
    }
    this.finishPay(c);
  }

  private finishPay(c: Customer) {
    if (c.state !== 'pay') return;
    this.drawer = { open: false, given: [], warn: 0 };
    if (c.tip > 0) {
      this.ledger.tips += c.tip;
      this.dropCoins(Math.min(8, Math.ceil(c.tip / 2)));
      sfx('coins');
    }
    const stars = c.sat! >= 90 ? 5 : c.sat! >= 75 ? 4 : c.sat! >= 55 ? 3 : c.sat! >= 35 ? 2 : 1;
    if (!c.special) this.addReview(c.nameIdx, c.female, stars, false);
    this.served = null;
    this.counter = null;
    const seat = this.tableUse.findIndex((x) => x === null);
    if (seat >= 0) {
      this.tableUse[seat] = c;
      c.table = seat;
      c.eatLeft = 18 + this.rng() * 18;
      this.walk(c, TABLE_SEATS[seat], 2.4);
      this.setState(c, 'toTable');
    } else {
      this.walk(c, DOOR_X - 0.1, 2.4);
      this.setState(c, 'leave');
    }
  }

  // ---------- online orders (day 10+) ----------

  private tickOnline(dt: number) {
    if (!this.day.online) return;
    for (const o of this.online) if (o.status !== 'delivered') o.age += dt;
    if (this.open) {
      this.onlineTimer -= dt;
      if (this.onlineTimer <= 0) {
        this.onlineTimer = 80 + this.rng() * 50;
        const order = makeOrder(this.day, this.rng, { online: true });
        this.online.push({
          id: this.nextId++,
          nameIdx: Math.floor(this.rng() * 12),
          female: this.rng() < 0.5,
          order,
          status: 'waiting',
          age: 0,
          summary: summaryOf(order),
        });
      }
    }
    // a call only rings when the counter is free; nothing is ever dropped
    const ringing = this.online.find((o) => o.status === 'ringing');
    if (!ringing && !this.counter && !this.activeOnline) {
      const next = this.online.find((o) => o.status === 'waiting');
      if (next) {
        next.status = 'ringing';
        sfx('phone');
        this.bump();
      }
    } else if (ringing && this.counter) {
      ringing.status = 'waiting';
      this.bump();
    }
    if (ringing && Math.floor(this.t * 0.5) !== Math.floor((this.t - dt) * 0.5)) sfx('phone');
  }

  get ringing() {
    return this.online.find((o) => o.status === 'ringing') ?? null;
  }

  acceptOnline() {
    const o = this.ringing;
    if (!o || this.counter) return;
    o.status = 'active';
    this.activeOnline = o;
    this.plate = { id: 'box', pieces: this.plate.pieces };
    this.goStation(1);
    sfx('ding');
    this.bump();
  }

  private pack() {
    const o = this.activeOnline!;
    const sc = scorePlate(o.order, this.plate.pieces, 'box');
    const lateness = Math.max(0, o.age - 150) / 120;
    const s = Math.max(0, sc.score - lateness * 30);
    o.stars = s >= 90 ? 5 : s >= 75 ? 4 : s >= 55 ? 3 : s >= 35 ? 2 : 1;
    o.status = 'packed';
    const bill = orderPrice(o.order);
    this.ledger.sales += bill;
    const tip = sc.complaint
      ? 0
      : Math.round(bill * Math.pow(s / 100, 2) * 0.15 * (1 + this.tipBonus));
    this.ledger.tips += tip;
    this.ledger.satSum += s;
    this.ledger.satN++;
    this.ledger.served++;
    if (sc.complaint) this.ledger.complaints++;
    this.doorBox = o;
    this.activeOnline = null;
    this.plate = { id: 'geta', pieces: [] };
    this.couriers.push({ t: 0, order: o });
    this.goStation(0);
    sfx('scooter');
    this.toast(t2('courier'));
    this.bump();
  }

  private deliver(o: OnlineOrder) {
    o.status = 'delivered';
    this.addReview(o.nameIdx, o.female, o.stars ?? 3, true);
    this.bump();
  }

  private addReview(nameIdx: number, female: boolean, stars: number, online: boolean) {
    const pools: Record<number, L[]> = {
      5: [
        { tr: 'Limanın en iyisi! Pirinç sıcacık.', en: 'Best in the harbor! The rice is so warm.' },
        { tr: 'Mükemmel, yine geleceğim.', en: 'Perfect, I’ll be back.' },
        {
          tr: 'Mürekkep bana el salladı, sushi de harikaydı!',
          en: 'Inky waved at me, and the sushi was great!',
        },
      ],
      4: [
        { tr: 'Çok güzeldi, tavsiye ederim.', en: 'Really good, recommended.' },
        { tr: 'Taze ve özenli.', en: 'Fresh and careful.' },
      ],
      3: [
        { tr: 'Fena değil, biraz bekledim.', en: 'Not bad, waited a bit.' },
        { tr: 'Ortalama bir tabak.', en: 'An average plate.' },
      ],
      2: [{ tr: 'Siparişim tam değildi.', en: 'My order wasn’t quite right.' }],
      1: [{ tr: 'Çok bekledim, memnun kalmadım.', en: 'Waited too long, not happy.' }],
    };
    const p = pools[Math.max(1, Math.min(5, stars))];
    this.reviews.push({
      day: this.n,
      nameIdx,
      female,
      stars,
      text: p[Math.floor(this.rng() * p.length)],
      online,
    });
  }

  // ---------- prep counter ----------

  /** prepared stock for cooked ingredients */
  stock(i: IngId) {
    return this.prepared[i]?.length ?? 0;
  }
  private takeStock(i: IngId): Done | undefined {
    return this.prepared[i]?.shift();
  }

  /** prep tubs visible right now (only unlocked, cooked ones only when stocked) */
  prepTubs(): IngId[] {
    const order: IngId[] = [
      'rice',
      'salmon',
      'tuna',
      'tamago',
      'unagi',
      'wasabi',
      'ginger',
      'soy',
      'sesame',
      'tobiko',
      'scallion',
      'spicymayo',
      'unagisauce',
      'noriband',
    ];
    return order.filter((i) => {
      if (!this.have.has(i)) return false;
      // cooked things only get a tub while there is something in it
      if (ING[i].cookedFrom) return this.stock(i) > 0;
      if (i === 'noriband') return this.have.has('noriband');
      return true;
    });
  }

  pickTub(i: IngId) {
    if (i === 'rice') return; // rice is squeezed with a hold
    if (ING[i].cookedFrom && this.stock(i) <= 0) {
      this.toast(
        getLang() === 'tr'
          ? `Önce ${tx(ING[i].name).toLowerCase()} hazırla (Isıtma)`
          : `Cook ${tx(ING[i].name).toLowerCase()} first (Heat)`,
        'info'
      );
      return;
    }
    if (this.hand?.k === 'tub' && this.hand.ing === i) {
      this.hand = null;
    } else {
      this.dropHand();
      this.hand = { k: 'tub', ing: i };
    }
    sfx('pick');
    this.bump();
  }

  squeezeStart() {
    this.dropHand();
    this.squeeze = { a: 0, on: true };
    this.bump();
  }
  squeezeEnd() {
    if (!this.squeeze.on) return;
    const a = this.squeeze.a;
    this.squeeze.on = false;
    if (a < 0.18) {
      this.squeeze.a = 0;
      this.toast(
        tx({ tr: 'Pirinci sıkmak için basılı tut', en: 'Press and hold to shape the rice' })
      );
      return;
    }
    this.hand = { k: 'rice', q: riceQuality(a) };
    sfx('pick');
    this.bump();
  }
  private tickSqueeze(dt: number) {
    if (this.squeeze.on) this.squeeze.a = Math.min(RICE_MAX, this.squeeze.a + dt * 0.62);
    else if (this.squeeze.a > 0 && this.hand?.k !== 'rice')
      this.squeeze.a = Math.max(0, this.squeeze.a - dt * 2);
  }

  dropHand() {
    const h = this.hand;
    if (!h) return;
    if (h.k === 'batch' && h.pieces.length) {
      // unused slices are thrown away
      this.waste(h.pieces.reduce((a, p) => a + bodyCost(p), 0));
    }
    this.hand = null;
    this.bump();
  }

  setPlate(id: PlateId) {
    if (this.activeOnline) return;
    this.plate.id = id;
    sfx('place');
    this.bump();
  }

  private waste(v: number) {
    this.ledger.waste += v;
  }
  private spend(v: number) {
    this.ledger.ing += v;
  }

  trash() {
    if (this.hand && this.hand.k !== 'plate') {
      this.dropHand();
      sfx('trash');
      return;
    }
    if (this.plate.pieces.length) {
      this.waste(this.plate.pieces.reduce((a, p) => a + pieceCost(p, p.tops) + bodyCost(p), 0));
      this.plate.pieces = [];
      this.hand = null;
      sfx('trash');
      this.bump();
    }
  }

  pieceAt(x: number, y: number): Piece | null {
    let best: Piece | null = null;
    let bd = 1e9;
    for (const p of this.plate.pieces) {
      const d = Math.hypot(p.x - x, (p.y - y) * 1.1);
      if (d < pieceRadius(p) * 1.5 && d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  /** a tap on the plate in plate-local coordinates (x: -0.5..0.5, y: -0.3..0.3) */
  tapPlate(x: number, y: number) {
    const h = this.hand;
    if (!h) {
      if (this.plate.pieces.length && this.activeOrder) {
        this.hand = { k: 'plate' };
        sfx('pick');
        this.bump();
      }
      return;
    }
    if (h.k === 'plate') {
      this.hand = null;
      this.bump();
      return;
    }
    // edge taps are pulled inside the plate
    const lim = this.plate.id === 'porcelain' ? { x: 0.42, y: 0.24 } : { x: 0.44, y: 0.25 };
    x = Math.max(-lim.x, Math.min(lim.x, x));
    y = Math.max(-lim.y, Math.min(lim.y, y));
    if (this.plate.pieces.length >= 22) {
      this.toast(t2('plateFull'));
      return;
    }
    const add = (body: PieceBody, tops: IngId[] = []) => {
      const p = {
        ...body,
        uid: newUid(),
        x,
        y,
        rot: (this.rng() - 0.5) * 0.25,
        tops,
        born: this.t,
      } as Piece;
      this.plate.pieces.push(p);
      this.spend(pieceCost(body, tops));
      sfx('place');
      this.bump();
      return p;
    };

    if (h.k === 'rice') {
      add({ kind: 'nigiri', rice: h.q });
      for (let i = 0; i < 4; i++) this.addFx('grain', x, y, 1);
      return;
    }
    if (h.k === 'batch') {
      const body = h.pieces.shift()!;
      add(body);
      if (!h.pieces.length) this.hand = null;
      this.bump();
      return;
    }
    // tub in hand
    const ing = h.ing;
    const roles = ING[ing].roles;
    if (roles.includes('side')) {
      add({ kind: 'side', ing });
      return;
    }
    const target = this.pieceAt(x, y);
    if (roles.includes('neta') && ing !== 'noriband') {
      if (!target || target.kind !== 'nigiri' || target.neta) {
        this.toast(t2('next1'));
        sfx('fail');
        return;
      }
      let done: Done | undefined;
      if (ING[ing].cookedFrom) {
        if (this.stock(ing) <= 0) {
          this.toast(tx({ tr: 'Hazır stok bitti', en: 'Out of cooked stock' }));
          this.hand = null;
          this.bump();
          return;
        }
        done = this.takeStock(ing);
        if (this.stock(ing) <= 0) this.hand = null;
      } else this.spend(ING[ing].cost * 0.5);
      target.neta = ing;
      target.done = done;
      target.born = this.t;
      sfx('place');
      this.bump();
      return;
    }
    if (roles.includes('topping')) {
      if (!target || target.kind === 'side') {
        this.toast(t2('onPiece'));
        sfx('fail');
        return;
      }
      if (ing === 'noriband') {
        if (target.kind !== 'nigiri') {
          this.toast(
            tx({ tr: 'Nori kuşağı nigiriye sarılır', en: 'The nori belt goes on a nigiri' })
          );
          return;
        }
        target.band = true;
      } else if (!target.tops.includes(ing)) target.tops.push(ing);
      this.spend(ING[ing].cost);
      target.born = this.t;
      sfx('pop');
      this.bump();
    }
  }

  // ---------- rolling board & cutting (station 2) ----------

  boardStart(m: 'maki' | 'temaki') {
    if (this.board.m !== 'idle') return;
    if (m === 'maki') {
      this.board = {
        m: 'maki',
        style: 'hoso',
        stage: 'rice',
        rice: 0,
        fill: [],
        prog: 0,
        speed: 0,
        n: 6,
        cutT: 0,
      };
      this.spend(ING.nori.cost);
    } else {
      this.board = { m: 'temaki', stage: 'rice', rice: 0, fill: [], n: 1 };
      this.spend(ING.nori.cost * 0.5);
    }
    sfx('place');
    this.bump();
  }

  boardFish(fish: IngId) {
    if (this.board.m !== 'idle') return;
    this.board = { m: 'sashimi', fish, n: 3, cutT: 0 };
    sfx('place');
    this.bump();
  }

  boardStyle(s: MakiStyle) {
    const b = this.board;
    if (b.m !== 'maki' || b.stage === 'rolling' || b.stage === 'cut') return;
    b.style = s;
    if (s !== 'ura') b.coat = undefined;
    if (s === 'hoso') b.n = 6;
    else b.n = 8;
    sfx('tap');
    this.bump();
  }

  availableStyles(): MakiStyle[] {
    return (['hoso', 'ura', 'futo'] as MakiStyle[]).filter((s) => this.n >= STYLE_DAY[s]);
  }

  /** fillings shown as chips on the board */
  fillChips(): IngId[] {
    const all: IngId[] = [
      'cucumber',
      'avocado',
      'salmon',
      'tuna',
      'crab',
      'creamcheese',
      'tamago',
      'tempura',
      'unagi',
    ];
    return all.filter((i) => this.have.has(i));
  }
  coatChips(): IngId[] {
    return (['sesame', 'tobiko'] as IngId[]).filter((i) => this.have.has(i));
  }

  private riceHold = false;
  boardRiceStart() {
    const b = this.board;
    if ((b.m === 'maki' || b.m === 'temaki') && b.stage === 'rice') {
      this.riceHold = true;
      this.bump();
    }
  }
  boardRiceEnd() {
    const b = this.board;
    if (!this.riceHold) return;
    this.riceHold = false;
    if ((b.m === 'maki' || b.m === 'temaki') && b.stage === 'rice') {
      if (b.rice < 0.15) {
        this.toast(
          tx({ tr: 'Pirinci yaymak için basılı tut', en: 'Press and hold to spread the rice' })
        );
        return;
      }
      b.riceQ = riceQuality(b.rice);
      b.stage = 'fill';
      this.spend(ING.rice.cost);
      sfx('pour');
      this.bump();
    }
  }
  get riceHolding() {
    return this.riceHold;
  }

  toggleFill(i: IngId) {
    const b = this.board;
    if ((b.m !== 'maki' && b.m !== 'temaki') || b.stage !== 'fill') return;
    if (b.fill.includes(i)) {
      b.fill = b.fill.filter((x) => x !== i);
      sfx('tap');
    } else {
      if (b.fill.length >= 4) return;
      if (ING[i].cookedFrom && this.stock(i) <= 0) {
        this.toast(
          getLang() === 'tr'
            ? `Önce ${tx(ING[i].name).toLowerCase()} pişir`
            : `Cook ${tx(ING[i].name).toLowerCase()} first`
        );
        return;
      }
      b.fill.push(i);
      sfx('place');
    }
    this.bump();
  }

  setCoat(i: IngId) {
    const b = this.board;
    if (b.m !== 'maki' || b.style !== 'ura' || b.stage !== 'fill') return;
    b.coat = b.coat === i ? undefined : i;
    sfx('pop');
    this.bump();
  }

  setCount(n: number) {
    const b = this.board;
    if (b.m === 'maki' && (n === 6 || n === 8)) b.n = n;
    if (b.m === 'sashimi' && (n === 3 || n === 5)) b.n = n;
    if (b.m === 'temaki' && (n === 1 || n === 2)) b.n = n;
    sfx('tap');
    this.bump();
  }

  private rollDrag: {
    lastY: number;
    lastT: number;
    dist: number;
    time: number;
    hold: boolean;
  } | null = null;
  rollStart(y: number, hold: boolean) {
    const b = this.board;
    if (b.m !== 'maki' || b.stage !== 'fill') return false;
    if (!b.fill.length) {
      this.toast(tx({ tr: 'Önce iç malzeme koy', en: 'Add a filling first' }));
      return false;
    }
    b.stage = 'rolling';
    b.prog = 0;
    b.speed = 0;
    this.rollDrag = { lastY: y, lastT: this.t, dist: 0, time: 0, hold };
    // cooked fillings are taken from stock now
    let worst: Done | undefined;
    for (const f of b.fill) {
      this.spend(ING[f].cookedFrom ? 0 : ING[f].cost);
      if (ING[f].cookedFrom) {
        const d = this.takeStock(f);
        if (d === 'raw' || (d === 'over' && worst !== 'raw')) worst = d;
        else if (!worst) worst = d;
      }
    }
    b.done = worst;
    if (b.coat) this.spend(ING[b.coat].cost);
    this.bump();
    return true;
  }
  /** y in board-local units: 1 = full mat height; dragging up decreases y */
  rollMove(y: number) {
    const b = this.board;
    const d = this.rollDrag;
    if (b.m !== 'maki' || b.stage !== 'rolling' || !d) return;
    const dy = d.lastY - y;
    d.lastY = y;
    if (Math.abs(dy) > 0.004) d.hold = false; // the finger is dragging now
    if (dy > 0) {
      b.prog = Math.min(1, b.prog + dy);
      d.dist += dy;
    }
    if (b.prog >= 1) this.rollFinish();
  }
  rollEnd() {
    const b = this.board;
    const d = this.rollDrag;
    if (b.m !== 'maki' || b.stage !== 'rolling' || !d) return;
    if (!d.hold) {
      d.hold = true; // let go mid-roll: the mat keeps rolling slowly by itself
    }
  }
  private rollFinish() {
    const b = this.board;
    const d = this.rollDrag;
    if (b.m !== 'maki' || !d) return;
    const avg = d.time > 0 ? 1 / d.time : 1;
    b.speed = avg;
    b.roll = avg > 2.6 ? 'loose' : avg < 0.32 ? 'squashed' : 'tight';
    b.stage = 'cut';
    b.cutT = 0;
    this.rollDrag = null;
    sfx('whoosh');
    if (b.roll === 'loose')
      this.toast(
        tx({ tr: 'Çok hızlı sardın, rulo gevşek!', en: 'Rolled too fast, it’s loose!' }),
        'bad'
      );
    else if (b.roll === 'squashed')
      this.toast(
        tx({ tr: 'Çok yavaş, rulo ezildi', en: 'Too slow, the roll got squashed' }),
        'bad'
      );
    this.bump();
  }

  /** live roll speed for the meter (progress per second) */
  get rollSpeed() {
    const d = this.rollDrag;
    if (!d || d.time <= 0) return 0;
    const b = this.board;
    return b.m === 'maki' ? b.prog / d.time : 0;
  }

  temakiMake() {
    const b = this.board;
    if (b.m !== 'temaki' || b.stage !== 'fill') return;
    if (!b.fill.length) {
      this.toast(tx({ tr: 'Önce iç malzeme koy', en: 'Add a filling first' }));
      return;
    }
    if (this.hand && this.hand.k !== 'plate') this.dropHand();
    const pieces: PieceBody[] = [];
    for (let i = 0; i < b.n; i++) {
      let done: Done | undefined;
      for (const f of b.fill) {
        if (ING[f].cookedFrom) {
          const d = this.takeStock(f);
          if (d && (!done || d === 'raw')) done = d;
        } else this.spend(ING[f].cost * 0.5);
      }
      if (i > 0) this.spend(ING.nori.cost * 0.5 + ING.rice.cost * 0.5);
      pieces.push({ kind: 'temaki', fill: [...b.fill], rice: b.riceQ ?? 'just', done });
    }
    this.hand = { k: 'batch', pieces, label: 'temaki' };
    this.board = { m: 'idle' };
    sfx('whoosh');
    this.goStation(1);
    this.bump();
  }

  cutTap() {
    const b = this.board;
    if (b.m === 'maki' && b.stage === 'cut') {
      const pos = cutMarker(b.cutT, 1.5);
      const cut: CutQ = pos >= MAKI_GREEN.a && pos <= MAKI_GREEN.b ? 'clean' : 'crooked';
      const pieces: PieceBody[] = [];
      for (let i = 0; i < b.n; i++)
        pieces.push({
          kind: 'maki',
          style: b.style,
          fill: [...b.fill],
          coat: b.coat,
          rice: b.riceQ ?? 'just',
          roll: b.roll ?? 'tight',
          cut,
          done: b.done,
          idx: i,
        });
      this.giveBatch(pieces, 'maki', cut);
      return;
    }
    if (b.m === 'sashimi') {
      const pos = cutMarker(b.cutT, 1.9);
      const z = SASHIMI_ZONES.find((z) => pos >= z.a && pos <= z.b)!;
      let thick: Thick;
      let cut: CutQ = 'clean';
      if (z.q) thick = z.q;
      else {
        cut = 'crooked';
        thick = pos < 0.34 ? 'thin' : pos < 0.66 ? 'normal' : 'thick';
      }
      this.spend(ING[b.fish].cost * 0.5 * b.n);
      const pieces: PieceBody[] = [];
      for (let i = 0; i < b.n; i++)
        pieces.push({ kind: 'sashimi', fish: b.fish, thick, cut, idx: i });
      this.giveBatch(pieces, b.fish, cut);
    }
  }

  private giveBatch(pieces: PieceBody[], label: IngId | 'maki', cut: CutQ) {
    if (this.hand && this.hand.k !== 'plate') this.dropHand();
    this.hand = { k: 'batch', pieces, label };
    this.board = { m: 'idle' };
    sfx(cut === 'clean' ? 'perfect' : 'fail');
    buzz(cut === 'clean' ? 10 : 30);
    this.toast(
      cut === 'clean' ? t2('perfectCut') : t2('crooked'),
      cut === 'clean' ? 'good' : 'bad'
    );
    this.goStation(1);
    this.bump();
  }

  boardReset() {
    const b = this.board;
    if (b.m === 'idle') return;
    let c = 0;
    if (b.m === 'maki') c = ING.nori.cost + (b.riceQ ? ING.rice.cost : 0);
    if (b.m === 'temaki') c = ING.nori.cost * 0.5;
    this.waste(c);
    this.board = { m: 'idle' };
    sfx('trash');
    this.bump();
  }

  private tickBoard(dt: number) {
    const b = this.board;
    if ((b.m === 'maki' || b.m === 'temaki') && b.stage === 'rice' && this.riceHold) {
      b.rice = Math.min(RICE_MAX, b.rice + dt * 0.6);
      if (Math.random() < dt * 6) sfx('pour');
    }
    if (b.m === 'maki' && b.stage === 'rolling' && this.rollDrag) {
      this.rollDrag.time += dt;
      if (this.rollDrag.hold) {
        b.prog = Math.min(1, b.prog + dt * 0.62);
        if (b.prog >= 1) this.rollFinish();
      }
    }
    if (b.m === 'maki' && b.stage === 'cut') b.cutT += dt;
    if (b.m === 'sashimi') b.cutT += dt;
  }

  // ---------- heat station ----------

  heatStart(dev: 'fryer' | 'grill') {
    if (this.heat[dev]) return;
    const ing: IngId = dev === 'fryer' ? 'shrimp' : 'eel';
    if (!this.have.has(ing)) return;
    this.heat[dev] = { ing, t: 0 };
    this.spend(ING[ing].cost * 2);
    sfx('sizzle');
    this.bump();
  }

  heatTake(dev: 'fryer' | 'grill') {
    const c = this.heat[dev];
    if (!c) return;
    const d = doneness(c.t);
    const out: IngId = c.ing === 'shrimp' ? 'tempura' : 'unagi';
    this.heat[dev] = null;
    if (d === 'burnt') {
      this.waste(ING[c.ing].cost * 2);
      this.toast(tx({ tr: 'Yandı! Çöpe gitti.', en: 'Burnt! Into the bin.' }), 'bad');
      sfx('trash');
    } else {
      const list = (this.prepared[out] ??= []);
      for (let i = 0; i < 4; i++) list.push(d);
      if (out === 'unagi' && d !== 'raw')
        this.toast(
          getLang() === 'tr'
            ? 'Unagi tezgâhta ve tahtada hazır'
            : 'Eel is ready on the counter and board',
          'good'
        );
      if (d === 'raw')
        this.toast(tx({ tr: 'Daha pişmemişti…', en: 'It wasn’t cooked yet…' }), 'bad');
      else if (d === 'done') this.toast(t2('perfectCut'), 'good');
      sfx(d === 'done' ? 'perfect' : 'pop');
    }
    this.bump();
  }

  private tickHeat(dt: number) {
    for (const dev of ['fryer', 'grill'] as const) {
      const c = this.heat[dev];
      if (!c) continue;
      const before = c.t;
      c.t = Math.min(1.05, c.t + dt / 11);
      if (before < DIAL.done && c.t >= DIAL.done) sfx('ding');
      if (Math.random() < dt * (c.t > DIAL.burnt ? 10 : 3))
        this.addFx(c.t > DIAL.burnt ? 'smoke' : 'steam', dev === 'fryer' ? 0.62 : 0.86, 0.5, 2);
    }
  }

  // ---------- fx ----------

  addFx(kind: Fx['kind'], x: number, y: number, station: number) {
    if (this.fx.length > 120) return;
    const r = Math.random;
    this.fx.push({
      kind,
      x,
      y,
      vx: (r() - 0.5) * (kind === 'grain' ? 0.25 : 0.06),
      vy:
        kind === 'smoke' || kind === 'steam' || kind === 'heart'
          ? -0.08 - r() * 0.05
          : -0.2 - r() * 0.2,
      t: 0,
      life: kind === 'grain' ? 0.5 : kind === 'smoke' ? 2.2 : 1.4,
      s: 0.6 + r() * 0.6,
      station,
    });
  }
  private tickFx(dt: number) {
    for (const f of this.fx) {
      f.t += dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      if (f.kind === 'grain') f.vy += dt * 1.6;
    }
    this.fx = this.fx.filter((f) => f.t < f.life);
  }

  private dropCoins(n: number) {
    for (let i = 0; i < n; i++)
      this.coins.push({
        x: (Math.random() - 0.5) * 0.6,
        y: -1.2 - i * 0.35,
        vy: 0,
        rest: false,
        kind: Math.floor(Math.random() * 3),
        rot: Math.random() * Math.PI,
      });
    if (this.coins.length > 60) this.coins.splice(0, this.coins.length - 60);
  }
  private tickCoins(dt: number) {
    // coins fall into the jar and settle on the pile; settled coins never move again
    const rested = this.coins.filter((c) => c.rest);
    for (const c of this.coins) {
      if (c.rest) continue;
      c.vy += dt * 6;
      c.y += c.vy * dt;
      const floor =
        1 - Math.min(0.9, rested.filter((o) => Math.abs(o.x - c.x) < 0.3).length * 0.09);
      if (c.y >= floor) {
        c.y = floor;
        c.rest = true;
        rested.push(c);
      }
    }
  }

  // ---------- results ----------

  get net() {
    const l = this.ledger;
    return (
      l.sales + l.tips + l.bonus - l.ing - l.waste - l.overpaid - this.day.rent - this.day.bills
    );
  }
  get avgSat() {
    return this.ledger.satN ? Math.round(this.ledger.satSum / this.ledger.satN) : 0;
  }
  get stars() {
    const a = this.avgSat;
    const served = this.ledger.served;
    if (!served) return 1;
    if (a >= 82 && this.net > 0 && this.ledger.walkouts === 0) return 3;
    if (a >= 60) return 2;
    return 1;
  }

  // ---------- day-1 hints ----------

  hint(): { text: L; target?: string } | null {
    if (!this.tutorial || this.over) return null;
    const c = this.counter;
    if (this.drawer.open && c?.state === 'pay')
      return {
        text: {
          tr: 'Çekmeceden para üstünü seç, sonra “Ver”e bas.',
          en: 'Pick the change from the drawer, then tap “Give”.',
        },
        target: 'drawer',
      };
    if (c?.state === 'complain')
      return {
        text: {
          tr: 'Hata olmuş. “Özür dile”ye bas.',
          en: 'Something went wrong. Tap “Apologize”.',
        },
        target: 'apologize',
      };
    if (!c || c.state === 'enter' || c.state === 'queue')
      return { text: { tr: 'Müşteri geliyor…', en: 'A customer is coming…' } };
    if (c.state === 'order')
      return {
        text: {
          tr: 'Müşteriyi dinle. Sipariş fişe yazılıyor.',
          en: 'Listen to the customer. The order goes on the ticket.',
        },
      };
    if (c.state !== 'wait') return null;
    if (this.station === 0 && this.hand?.k !== 'plate')
      return {
        text: {
          tr: 'Tezgâha geç: sola kaydır ya da yukarıdaki düğmeye bas.',
          en: 'Go to the counter: swipe or tap the button on top.',
        },
        target: 'st1',
      };
    if (this.hand?.k === 'plate')
      return {
        text: {
          tr: 'Tabağı müşterinin önüne bırak: “Servis et”.',
          en: 'Put the plate in front of the customer: “Serve”.',
        },
        target: 'serve',
      };
    const o = c.order;
    const nig = this.plate.pieces.filter((p) => p.kind === 'nigiri');
    const want = o.lines.reduce((a, l) => a + (l.k === 'nigiri' ? l.n : 0), 0);
    if (nig.length < want) {
      if (this.hand?.k === 'rice')
        return {
          text: {
            tr: 'Tabakta istediğin yere dokun: her dokunuş bir pirinç topu.',
            en: 'Tap the plate where you want it: each tap is one rice ball.',
          },
          target: 'plate',
        };
      return {
        text: {
          tr: 'Pirinç kabını basılı tut, gösterge “tam”dayken bırak.',
          en: 'Hold the rice tub, let go when the gauge says “just right”.',
        },
        target: 'tub:rice',
      };
    }
    const bare = nig.filter((p) => !p.neta);
    if (bare.length) {
      const fish = o.lines.find((l) => l.k === 'nigiri');
      const f = fish && fish.k === 'nigiri' ? fish.fish : 'salmon';
      if (this.hand?.k === 'tub' && this.hand.ing === f)
        return {
          text: {
            tr: 'Şimdi her pirinç topuna dokun, balık üstüne konsun.',
            en: 'Now tap each rice ball to lay the fish on top.',
          },
          target: 'plate',
        };
      return {
        text: { tr: 'Balık kabına bir kez dokun.', en: 'Tap the fish tub once.' },
        target: 'tub:' + f,
      };
    }
    const sides = new Set(
      this.plate.pieces.filter((p) => p.kind === 'side').map((p) => (p as { ing: IngId }).ing)
    );
    const miss = o.sides.find((s) => !sides.has(s));
    if (miss) {
      if (this.hand?.k === 'tub' && this.hand.ing === miss)
        return {
          text: { tr: 'Tabağın boş bir köşesine dokun.', en: 'Tap an empty corner of the plate.' },
          target: 'plate',
        };
      return {
        text: {
          tr: `Yan ürün: ${ING[miss].name.tr} kabına dokun.`,
          en: `Side: tap the ${ING[miss].name.en.toLowerCase()} tub.`,
        },
        target: 'tub:' + miss,
      };
    }
    return { text: { tr: 'Hazır! “Servis et”e bas.', en: 'Ready! Tap “Serve”.' }, target: 'serve' };
  }
}

function bodyCost(p: PieceBody): number {
  switch (p.kind) {
    case 'maki':
      return 0.6;
    case 'sashimi':
      return ING[p.fish].cost * 0.5;
    case 'temaki':
      return 1.5;
    default:
      return 0;
  }
}

function summaryOf(o: Order): L {
  const tr = o.lines.map((l) => `${l.n}× ${l.k}`).join(', ');
  return { tr, en: tr };
}

function t2(k: Parameters<typeof tt>[0]) {
  return tt(k);
}
