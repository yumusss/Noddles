// One five-minute day at Yuki Sushi. Plain mutable state: the canvas reads it every frame,
// React re-renders on `bump()`.

import { buzz, sfx } from './audio';
import {
  CUSTOMER_SPECIES,
  type Day,
  type IngId,
  ING,
  NAMES_EN,
  NAMES_TR,
  type PlateId,
  type Species,
  type Speaker,
  SPEAKER_SPECIES,
  SPEAKERS,
  unlockedIngs,
  unlockedPlates,
  type SpecialGuest,
} from './data';
import { getLang, type L, money, t as tt, tx } from './i18n';
import {
  makeOrder,
  mulberry,
  type Order,
  orderPrice,
  orderSpeech,
  pieceCost,
  type Reason,
  type Score,
  scorePlate,
  specialOrder,
  STYLE_DAY,
} from './orders';
import {
  type CutQ,
  type Done,
  type Hand,
  type MakiStyle,
  newUid,
  type Piece,
  type PieceBody,
  pieceRadius,
  type PlateState,
  type RiceQ,
  type RollQ,
  type Thick,
} from './plate';
import {
  chatFor,
  type Choice,
  HURRY_LINE,
  HURRY_REPLIES,
  ORDER_REPLIES,
  reactLine,
  verdictLine,
  verdictReplies,
  type VerdictReply,
  writeReview,
} from './reviews';
import type { Review } from './save';

export type Mood = 'happy' | 'neutral' | 'worried' | 'angry' | 'love';
export type CState =
  'arrive' | 'order' | 'wait' | 'eat' | 'verdict' | 'react' | 'pay' | 'bye' | 'leave';

export interface Customer {
  id: number;
  seed: number;
  species: Species;
  kid: boolean;
  nameIdx: number;
  special?: Speaker;
  bonus: number;
  state: CState;
  st: number;
  order: Order;
  greet?: L;
  /** what they are saying right now (rebuilt every frame so it follows the language) */
  line: (() => string) | null;
  lineAt: number;
  /** a pending question for the player */
  ask: 'order' | 'hurry' | 'verdict' | null;
  patience: number;
  patienceMax: number;
  mood: Mood;
  bill: number;
  cash: number;
  score?: Score;
  sat: number;
  tip: number;
  chatted: boolean;
  hurried: boolean;
  reply: VerdictReply;
  free: boolean;
  walkout: boolean;
  /** time the player started serving (for "fast service") */
  waited: number;
}

export interface OnlineOrder {
  id: number;
  nameIdx: number;
  species: Species;
  seed: number;
  order: Order;
  status: 'waiting' | 'ringing' | 'active' | 'packed' | 'delivered';
  age: number;
  stars?: number;
}

export type Board =
  | { m: 'idle' }
  | { m: 'pick' }
  | {
      m: 'maki';
      style: MakiStyle;
      stage: 'rice' | 'fill' | 'rolling' | 'cut';
      rice: number;
      riceQ?: RiceQ;
      fill: IngId[];
      coat?: IngId;
      prog: number;
      roll?: RollQ;
      n: 6 | 8;
      cutT: number;
    }
  | { m: 'sashimi'; fish: IngId; n: 3 | 5; cutT: number };

export interface Toast {
  id: number;
  text: string;
  kind: 'info' | 'good' | 'bad';
  t: number;
}

export interface Ledger {
  sales: number;
  tips: number;
  ing: number;
  waste: number;
  overpaid: number;
  freebies: number;
  bonus: number;
  served: number;
  walkouts: number;
}

export interface Coin {
  x: number;
  y: number;
  vy: number;
  rest: boolean;
  kind: number;
}

export interface Fx {
  kind: 'sparkle' | 'heart' | 'grain' | 'flame' | 'smoke' | 'snow';
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
  s: number;
  /** 'scene' coordinates are fractions of the screen; 'plate' are plate-local */
  space: 'scene' | 'plate';
}

export const RICE_MAX = 1.45;
export const riceQuality = (a: number): RiceQ => (a < 0.62 ? 'less' : a <= 1.02 ? 'just' : 'more');
export const DIAL = { done: 0.42, over: 0.7, burnt: 0.88 };
export const doneness = (t: number): Done =>
  t < DIAL.done ? 'raw' : t < DIAL.over ? 'done' : t < DIAL.burnt ? 'over' : 'burnt';
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

let reviewCounter = 0;

export class Session {
  day: Day;
  n: number;
  rng: () => number;
  t = 0;
  started = false;
  over = false;
  paused = false;
  cust: Customer | null = null;
  nextIn = 2.5;
  served: { plate: PlateState; t: number } | null = null;
  plate: PlateState = { id: 'geta', pieces: [] };
  hand: Hand | null = null;
  board: Board = { m: 'idle' };
  squeeze = { a: 0, on: false };
  sear: { uid: number; t: number } | null = null;
  ledger: Ledger = {
    sales: 0,
    tips: 0,
    ing: 0,
    waste: 0,
    overpaid: 0,
    freebies: 0,
    bonus: 0,
    served: 0,
    walkouts: 0,
  };
  online: OnlineOrder[] = [];
  activeOnline: OnlineOrder | null = null;
  onlineTimer = 45;
  courier: { t: number; order: OnlineOrder } | null = null;
  coins: Coin[] = [];
  fx: Fx[] = [];
  toasts: Toast[] = [];
  reviews: Review[] = [];
  drawer = { open: false, given: [] as number[], warn: 0 };
  have: Set<IngId>;
  plates: PlateId[];
  makiOn: boolean;
  sashimiOn: boolean;
  torchOn: boolean;
  tipBonus: number;
  tutorial: boolean;
  guests: SpecialGuest[];
  version = 0;
  nextId = 1;
  /** the last review written, for the little "new review" pop */
  lastReview: Review | null = null;
  private listeners = new Set<() => void>();
  private riceHold = false;
  private rollDrag: { lastY: number; time: number; hold: boolean } | null = null;

  constructor(day: Day, opts: { tipBonus: number; seed?: number }) {
    this.day = day;
    this.n = day.n;
    this.rng = mulberry(opts.seed ?? day.n * 7919 + Math.floor(Math.random() * 1e6));
    this.have = unlockedIngs(day.n);
    this.plates = unlockedPlates(day.n);
    this.makiOn = day.n >= STYLE_DAY.hoso;
    this.sashimiOn = this.n >= 4;
    this.torchOn = this.n >= 7;
    this.tipBonus = opts.tipBonus;
    this.tutorial = day.n === 1;
    this.guests = [...(day.guests ?? [])].sort((a, b) => a.at - b.at);
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

  nameOf(c: { nameIdx: number; special?: Speaker }) {
    if (c.special) return tx(SPEAKERS[c.special]);
    return (getLang() === 'tr' ? NAMES_TR : NAMES_EN)[c.nameIdx % 16];
  }

  get activeOrder(): Order | null {
    if (this.activeOnline) return this.activeOnline.order;
    const c = this.cust;
    return c && c.state === 'wait' ? c.order : null;
  }

  get clock(): string {
    const start: Record<string, number> = {
      morning: 8 * 60,
      noon: 12 * 60,
      sunset: 16 * 60 + 30,
      evening: 19 * 60,
    };
    const m = Math.round(start[this.day.time] + 180 * Math.min(1, this.t / this.day.duration));
    return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  }
  get open() {
    return this.t < this.day.duration;
  }
  get timeLeft() {
    return Math.max(0, this.day.duration - this.t);
  }

  // ---------- main tick ----------

  tick(dt: number) {
    if (!this.started || this.over || this.paused) return;
    this.t += dt;
    for (const x of this.toasts) x.t += dt;
    const n0 = this.toasts.length;
    this.toasts = this.toasts.filter((x) => x.t < 3);
    if (this.toasts.length !== n0) this.bump();

    this.tickArrivals(dt);
    this.tickOnline(dt);
    if (this.cust) this.tickCustomer(this.cust, dt);
    this.tickPrep(dt);
    this.tickCoins(dt);
    this.tickFx(dt);
    if (this.served) this.served.t += dt;
    if (this.courier) {
      this.courier.t += dt;
      if (this.courier.t > 3 && this.courier.order.status === 'packed')
        this.deliver(this.courier.order);
      if (this.courier.t > 7) this.courier = null;
    }
    this.drawer.warn = Math.max(0, this.drawer.warn - dt);
    if (!this.open && !this.cust && !this.activeOnline && !this.courier) {
      // anyone still waiting to call is told the hut is closed
      for (const o of this.online)
        if (o.status === 'waiting' || o.status === 'ringing') o.status = 'delivered';
      this.over = true;
      sfx('win');
      this.bump();
    }
  }

  private tickArrivals(dt: number) {
    if (this.cust || !this.open || this.ringing || this.activeOnline) return;
    this.nextIn -= dt;
    if (this.nextIn > 0) return;
    const g = this.guests[0];
    if (g && this.t >= g.at * this.day.duration) {
      this.guests.shift();
      this.spawn({ special: g.who, greet: g.greet, order: specialOrder(g.order), bonus: g.bonus });
    } else this.spawn({});
  }

  private spawn(o: { special?: Speaker; greet?: L; order?: Order; bonus?: number }) {
    const kid = !o.special && this.n >= 2 && this.rng() < 0.2;
    const seed = Math.floor(this.rng() * 1e9);
    const species = o.special
      ? SPEAKER_SPECIES[o.special]
      : CUSTOMER_SPECIES[Math.floor(this.rng() * CUSTOMER_SPECIES.length)];
    const order = o.order ?? makeOrder(this.day, this.rng, { kid });
    const c: Customer = {
      id: this.nextId++,
      seed,
      species,
      kid,
      nameIdx: Math.floor(this.rng() * 16),
      special: o.special,
      bonus: o.bonus ?? 0,
      state: 'arrive',
      st: 0,
      order,
      greet: o.greet,
      line: null,
      lineAt: 0,
      ask: null,
      patience: this.day.patience,
      patienceMax: this.day.patience,
      mood: 'neutral',
      bill: orderPrice(order),
      cash: 0,
      sat: 0,
      tip: 0,
      chatted: false,
      hurried: false,
      reply: 'none',
      free: false,
      walkout: false,
      waited: 0,
    };
    this.cust = c;
    sfx('door');
    this.bump();
  }

  /** speech of the current customer */
  orderText(c: Customer) {
    return c.greet ? tx(c.greet) : orderSpeech(c.order, mulberry(c.seed), c.kid);
  }

  private say(c: Customer, f: () => string) {
    c.line = f;
    c.lineAt = 0;
    sfx('bubble');
  }

  /** characters of the current line already typed out */
  shown(c: Customer) {
    return c.line ? Math.floor(c.lineAt * 34) : 0;
  }
  lineDone(c: Customer) {
    return !c.line || this.shown(c) >= c.line().length;
  }

  private setState(c: Customer, s: CState) {
    c.state = s;
    c.st = 0;
    this.bump();
  }

  private tickCustomer(c: Customer, dt: number) {
    c.st += dt;
    c.lineAt += dt;
    switch (c.state) {
      case 'arrive':
        if (c.st > 1.6) {
          this.setState(c, 'order');
          this.say(c, () => this.orderText(c));
        }
        break;
      case 'order':
        if (this.lineDone(c) && c.lineAt * 34 > c.line!().length + 14) {
          this.setState(c, 'wait');
          c.ask = 'order';
          sfx('ding');
        }
        break;
      case 'wait': {
        if (!this.tutorial) c.patience -= dt;
        else if (!this.open) c.patience = Math.min(c.patience, 60) - dt;
        c.waited += dt;
        const f = c.patience / c.patienceMax;
        c.mood = f > 0.55 ? 'neutral' : f > 0.25 ? 'worried' : 'angry';
        if (f < 0.32 && !c.hurried && !c.ask) {
          c.hurried = true;
          c.ask = 'hurry';
          this.say(c, () => tx(HURRY_LINE));
          this.bump();
        }
        if (c.patience <= 0) this.walkOut(c);
        break;
      }
      case 'eat':
        if (c.st > 2.6) this.verdict(c);
        break;
      case 'verdict':
        // an answer is optional; after a while they carry on
        if (c.st > 10) this.answer('none');
        break;
      case 'react':
        if ((c.st > 2.4 && this.lineDone(c)) || c.st > 6) this.startPay(c);
        break;
      case 'pay':
        if (c.st > 1.3) this.finishPay(c);
        break;
      case 'bye':
        if (c.st > 1.6) this.setState(c, 'leave');
        break;
      case 'leave':
        if (c.st > 1.4) {
          this.cust = null;
          this.served = null;
          this.nextIn = 2 + this.rng() * 3;
          this.bump();
        }
        break;
    }
  }

  private walkOut(c: Customer) {
    c.walkout = true;
    c.mood = 'angry';
    c.ask = null;
    this.ledger.walkouts++;
    this.say(c, () =>
      tx({ tr: 'Çok bekledim, gidiyorum!', en: 'I’ve waited too long, I’m leaving!' })
    );
    sfx('angry');
    this.postReview(
      c,
      writeReview({
        sat: 0,
        reasons: ['slow'],
        reply: 'none',
        chatted: false,
        fast: false,
        walkout: true,
        seed: c.seed,
      }),
      ['slow']
    );
    this.setState(c, 'bye');
  }

  // ---------- talking back ----------

  choices(): Choice[] {
    const c = this.cust;
    if (!c || !c.ask) return [];
    if (c.ask === 'order') {
      const [q] = chatFor(c.seed);
      return [...ORDER_REPLIES, { id: 'chat', label: q }];
    }
    if (c.ask === 'hurry') return HURRY_REPLIES;
    if (c.ask === 'verdict') {
      const good = !c.score?.complaint && c.sat >= 75;
      const bad = !!c.score?.complaint || c.sat < 55;
      return verdictReplies(good, bad);
    }
    return [];
  }

  answer(id: string) {
    const c = this.cust;
    if (!c) return;
    sfx('tap');
    if (c.ask === 'order') {
      c.ask = null;
      if (id === 'ok') this.say(c, () => tx({ tr: 'Süper, bekliyorum!', en: 'Great, I’ll wait!' }));
      if (id === 'repeat') {
        c.patience = Math.max(5, c.patience - 6);
        this.say(c, () => this.orderText(c));
      }
      if (id === 'chat') {
        c.chatted = true;
        c.patience = Math.max(5, c.patience - 3);
        this.say(c, () => tx(chatFor(c.seed)[1]));
      }
    } else if (c.ask === 'hurry') {
      c.ask = null;
      if (id === 'soon') {
        c.patience = Math.min(c.patienceMax, c.patience + 14);
        this.say(c, () =>
          tx({ tr: 'Tamam, biraz daha beklerim.', en: 'Okay, I’ll wait a bit more.' })
        );
      } else
        this.say(c, () => tx({ tr: 'Hmph. Umarım değer.', en: 'Hmph. I hope it’s worth it.' }));
    } else if (c.state === 'verdict') {
      c.ask = null;
      c.reply = id as VerdictReply;
      const good = !c.score?.complaint && c.sat >= 75;
      if (id === 'free') c.free = true;
      if (id === 'argue') {
        c.mood = 'angry';
        sfx('angry');
      }
      if (id === 'sorry' || id === 'free') c.mood = 'neutral';
      this.say(c, () => tx(reactLine(c.reply, good)));
      this.setState(c, 'react');
    }
    this.bump();
  }

  /** leaves the pending question unanswered (the player went to work) */
  dismissAsk() {
    const c = this.cust;
    if (c && (c.ask === 'order' || c.ask === 'hurry')) {
      c.ask = null;
      c.line = null;
      this.bump();
    }
  }

  // ---------- serving ----------

  canServe() {
    if (!this.plate.pieces.length) return false;
    if (this.activeOnline) return true;
    return this.cust?.state === 'wait';
  }

  serve() {
    if (!this.canServe()) {
      this.toast(this.plate.pieces.length ? tt('noCustomer') : tt('plateEmpty'));
      return;
    }
    if (this.activeOnline) return this.pack();
    const c = this.cust!;
    c.ask = null;
    c.line = null;
    c.score = scorePlate(c.order, this.plate.pieces, this.plate.id);
    this.served = { plate: this.plate, t: 0 };
    this.plate = { id: this.plate.id, pieces: [] };
    this.hand = null;
    this.board = { m: 'idle' };
    this.setState(c, 'eat');
    sfx('place');
    buzz(12);
  }

  private verdict(c: Customer) {
    const sc = c.score!;
    const pf = Math.max(0, c.patience / c.patienceMax);
    let sat = sc.score - (this.tutorial ? 0 : (1 - pf) * 14) + (c.chatted ? 4 : 0);
    if (c.hurried && pf < 0.2) sat -= 4;
    c.sat = Math.max(0, Math.min(100, Math.round(sat)));
    c.mood =
      c.sat >= 92
        ? 'love'
        : c.sat >= 75
          ? 'happy'
          : c.sat >= 55
            ? 'neutral'
            : c.sat >= 38
              ? 'worried'
              : 'angry';
    this.ledger.served++;
    const reasons: Reason[] = [...sc.reasons];
    if (!this.tutorial && pf < 0.25) reasons.push('slow');
    sc.reasons = reasons;
    if (c.mood === 'love' || c.mood === 'happy') sfx('perfect');
    else if (c.sat < 55) sfx('fail');
    for (let i = 0; i < (c.mood === 'love' ? 8 : 3); i++)
      this.addFx(
        c.mood === 'love' ? 'heart' : 'sparkle',
        0.4 + (this.rng() - 0.5) * 0.12,
        0.3,
        'scene'
      );
    this.say(c, () => tx(verdictLine(c.sat, reasons, c.seed, sc.complaint)));
    c.ask = 'verdict';
    this.setState(c, 'verdict');
  }

  private startPay(c: Customer) {
    if (c.free) {
      this.ledger.freebies += c.bill;
      this.finishPay(c);
      return;
    }
    const notes = [5, 10, 20, 50, 100, 200];
    const i = notes.findIndex((x) => x >= c.bill);
    c.cash = notes[Math.min(notes.length - 1, i + (this.rng() < 0.35 ? 1 : 0))];
    if (c.cash < c.bill) c.cash = Math.ceil(c.bill / 10) * 10;
    const pf = Math.max(0, c.patience / c.patienceMax);
    const speed = this.tutorial ? 1.2 : pf > 0.6 ? 1.4 : pf > 0.3 ? 1 : 0.6;
    const good = !c.score?.complaint && c.reply !== 'argue' && c.reply !== 'sorry';
    c.tip = good
      ? Math.round(
          c.bill * Math.pow(c.sat / 100, 2) * 0.22 * speed * (1 + this.tipBonus) +
            (c.chatted ? 1 : 0)
        )
      : 0;
    if (c.special && c.sat >= 70 && !c.score?.complaint) {
      this.ledger.bonus += c.bonus;
      this.toast(`${tt('bonus')} +${money(c.bonus)}`, 'good');
    }
    this.ledger.sales += c.bill;
    // the customer pays and the money goes into the register by itself — no change to count
    c.cash = c.bill;
    this.drawer = { open: false, given: [], warn: 0 };
    this.say(c, () =>
      tx({ tr: `Buyrun, ${money(c.bill)}.`, en: `Here you go, ${money(c.bill)}.` })
    );
    sfx('coins');
    this.setState(c, 'pay');
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
    const c = this.cust;
    if (!c || c.state !== 'pay') return;
    const due = c.cash - c.bill;
    const g = this.givenTotal;
    if (g < due) {
      this.drawer.warn = 2.5;
      this.say(c, () => tx({ tr: 'Hmm, bu eksik galiba?', en: 'Hmm, isn’t this short?' }));
      sfx('fail');
      this.bump();
      return;
    }
    if (g > due) {
      this.ledger.overpaid += g - due;
      this.toast(tx({ tr: 'Fazla para üstü verdin', en: 'You gave too much change' }), 'bad');
    }
    this.finishPay(c);
  }

  private finishPay(c: Customer) {
    if (c.state !== 'pay' && c.state !== 'react') return;
    this.drawer = { open: false, given: [], warn: 0 };
    if (c.tip > 0) {
      this.ledger.tips += c.tip;
      this.dropCoins(Math.min(8, Math.ceil(c.tip / 2)));
      sfx('coins');
    }
    const draft = writeReview({
      sat: c.sat,
      reasons: c.score?.reasons ?? [],
      reply: c.reply,
      chatted: c.chatted,
      fast: c.waited < c.patienceMax * 0.45,
      seed: c.seed,
      special: c.special,
    });
    this.postReview(c, draft, c.score?.reasons ?? []);
    const happy = draft.stars >= 4;
    this.say(c, () =>
      tx(
        happy
          ? { tr: 'Görüşürüz! Nefis’e yazacağım!', en: 'See you! I’m posting on Yumm!' }
          : draft.stars <= 2
            ? { tr: 'Hoşça kal…', en: 'Bye…' }
            : { tr: 'Görüşürüz.', en: 'See you.' }
      )
    );
    this.setState(c, 'bye');
  }

  private postReview(
    c: { seed: number; species: Species; nameIdx: number; special?: Speaker },
    d: { stars: number; text: L; good: L[] },
    tags: Reason[],
    online = false
  ) {
    const r: Review = {
      id: `d${this.n}-${Date.now().toString(36)}-${reviewCounter++}`,
      day: this.n,
      species: c.species,
      seed: c.seed,
      nameIdx: c.special ? -1 : c.nameIdx,
      stars: d.stars,
      text: d.text,
      tags: tags.slice(0, 3),
      good: d.good,
      online,
      likes: Math.floor(this.rng() * 5),
    };
    if (c.special) r.special = c.special;
    this.reviews.push(r);
    this.lastReview = r;
    this.bump();
  }

  // ---------- online orders (day 8+) ----------

  private tickOnline(dt: number) {
    if (!this.day.online) return;
    for (const o of this.online) if (o.status !== 'delivered') o.age += dt;
    if (this.open) {
      this.onlineTimer -= dt;
      if (this.onlineTimer <= 0) {
        this.onlineTimer = 70 + this.rng() * 40;
        this.online.push({
          id: this.nextId++,
          nameIdx: Math.floor(this.rng() * 16),
          species: CUSTOMER_SPECIES[Math.floor(this.rng() * CUSTOMER_SPECIES.length)],
          seed: Math.floor(this.rng() * 1e9),
          order: makeOrder(this.day, this.rng, { online: true }),
          status: 'waiting',
          age: 0,
        });
      }
    }
    // it rings only when nobody is at the window; nothing is ever dropped
    if (!this.cust && !this.activeOnline && !this.ringing) {
      const next = this.online.find((o) => o.status === 'waiting');
      if (next) {
        next.status = 'ringing';
        sfx('phone');
        this.bump();
      }
    }
    if (this.ringing && Math.floor(this.t * 0.6) !== Math.floor((this.t - dt) * 0.6)) sfx('phone');
  }

  get ringing() {
    return this.online.find((o) => o.status === 'ringing') ?? null;
  }

  acceptOnline() {
    const o = this.ringing;
    if (!o || this.cust) return;
    o.status = 'active';
    this.activeOnline = o;
    this.plate = { id: 'box', pieces: this.plate.pieces };
    sfx('ding');
    this.bump();
  }

  private pack() {
    const o = this.activeOnline!;
    const sc = scorePlate(o.order, this.plate.pieces, 'box');
    const late = Math.max(0, o.age - 120) / 100;
    const sat = Math.max(0, sc.score - late * 25);
    this.ledger.sales += orderPrice(o.order);
    this.ledger.served++;
    const d = writeReview({
      sat,
      reasons: sc.reasons,
      reply: 'none',
      chatted: false,
      fast: o.age < 80,
      online: true,
      seed: o.seed,
    });
    o.stars = d.stars;
    o.status = 'packed';
    this.postReview(o, d, sc.reasons, true);
    this.activeOnline = null;
    this.plate = { id: 'geta', pieces: [] };
    this.hand = null;
    this.courier = { t: 0, order: o };
    sfx('scooter');
    this.toast(tt('courier'));
    this.nextIn = 3;
    this.bump();
  }

  private deliver(o: OnlineOrder) {
    o.status = 'delivered';
    this.bump();
  }

  // ---------- the work table ----------

  stock() {
    return 0;
  }

  /** trays on the table: only unlocked ones */
  trays(): IngId[] {
    const order: IngId[] = [
      'rice',
      'salmon',
      'tuna',
      'tamago',
      'ebi',
      'wasabi',
      'ginger',
      'soy',
      'sesame',
      'tobiko',
      'scallion',
      'spicymayo',
      'noriband',
    ];
    return order.filter((i) => this.have.has(i));
  }

  pickTray(i: IngId) {
    this.dismissAsk();
    if (i === 'rice') {
      if (this.hand?.k === 'rice') this.hand = null;
      else {
        this.dropHand();
        this.hand = { k: 'rice', q: 'just' };
      }
      sfx('pick');
      this.bump();
      return;
    }
    if (this.hand?.k === 'tub' && this.hand.ing === i) this.hand = null;
    else {
      this.dropHand();
      this.hand = { k: 'tub', ing: i };
    }
    sfx('pick');
    this.bump();
  }

  pickTorch() {
    this.dismissAsk();
    if (this.hand?.k === 'torch') this.hand = null;
    else {
      this.dropHand();
      this.hand = { k: 'torch' };
      this.toast(tt('torchHint'));
    }
    sfx('pick');
    this.bump();
  }

  squeezeStart() {
    this.dismissAsk();
    this.dropHand();
    this.squeeze = { a: 0, on: true };
    this.bump();
  }
  squeezeEnd() {
    if (!this.squeeze.on) return;
    const a = this.squeeze.a;
    this.squeeze.on = false;
    if (a < 0.15) {
      this.squeeze.a = 0;
      this.toast(
        tx({ tr: 'Pirinci şekillendirmek için basılı tut', en: 'Press and hold to shape the rice' })
      );
      return;
    }
    this.hand = { k: 'rice', q: riceQuality(a) };
    sfx('pick');
    this.bump();
  }

  dropHand() {
    const h = this.hand;
    if (!h) return;
    if (h.k === 'batch' && h.pieces.length) this.ledger.waste += h.pieces.length * 0.6;
    this.hand = null;
    this.bump();
  }

  setPlate(id: PlateId) {
    if (this.activeOnline) return;
    this.plate.id = id;
    sfx('place');
    this.bump();
  }

  trash() {
    if (this.hand && this.hand.k !== 'plate' && this.hand.k !== 'torch') {
      this.dropHand();
      sfx('trash');
      return;
    }
    if (this.plate.pieces.length) {
      this.ledger.waste += this.plate.pieces.reduce((a, p) => a + pieceCost(p, p.tops) + 0.5, 0);
      this.plate.pieces = [];
      sfx('trash');
      this.bump();
    }
  }

  pieceAt(x: number, y: number): Piece | null {
    let best: Piece | null = null;
    let bd = 1e9;
    for (const p of this.plate.pieces) {
      const d = Math.hypot(p.x - x, (p.y - y) * 1.1);
      if (d < pieceRadius(p) * 1.6 && d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  /** a tap on the plate in plate-local coordinates (x: -0.5..0.5, y: -0.3..0.3) */
  tapPlate(x: number, y: number) {
    this.dismissAsk();
    const h = this.hand;
    if (!h || h.k === 'plate' || h.k === 'torch') return;
    x = Math.max(-0.43, Math.min(0.43, x));
    y = Math.max(-0.24, Math.min(0.24, y));
    if (this.plate.pieces.length >= 24) {
      this.toast(tt('plateFull'));
      return;
    }
    const add = (body: PieceBody, tops: IngId[] = []) => {
      const p = {
        ...body,
        uid: newUid(),
        x,
        y,
        rot: (this.rng() - 0.5) * 0.22,
        tops,
        born: this.t,
      } as Piece;
      this.plate.pieces.push(p);
      this.ledger.ing += pieceCost(body, tops);
      sfx('place');
      this.bump();
      return p;
    };
    if (h.k === 'rice') {
      add({ kind: 'nigiri', rice: h.q });
      for (let i = 0; i < 4; i++) this.addFx('grain', x, y, 'plate');
      return;
    }
    if (h.k === 'batch') {
      add(h.pieces.shift()!);
      if (!h.pieces.length) this.hand = null;
      this.bump();
      return;
    }
    const ing = h.ing;
    const roles = ING[ing].roles;
    if (roles.includes('side')) {
      add({ kind: 'side', ing });
      return;
    }
    const target = this.pieceAt(x, y);
    if (roles.includes('neta') && ing !== 'noriband') {
      if (!target || target.kind !== 'nigiri' || target.neta) {
        this.toast(tt('next1'));
        sfx('fail');
        return;
      }
      target.neta = ing;
      target.born = this.t;
      this.ledger.ing += ING[ing].cost * 0.5;
      sfx('place');
      this.bump();
      return;
    }
    if (roles.includes('topping')) {
      if (!target || target.kind === 'side') {
        this.toast(tt('onPiece'));
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
      this.ledger.ing += ING[ing].cost;
      target.born = this.t;
      sfx('pop');
      this.bump();
    }
  }

  // ---------- torch (aburi) ----------

  searStart(x: number, y: number): boolean {
    if (this.hand?.k !== 'torch') return false;
    const p = this.pieceAt(x, y);
    if (!p || p.kind !== 'nigiri' || !p.neta) {
      this.toast(tt('torchHint'));
      return false;
    }
    const prev = p.aburi ? { raw: 0.2, done: 0.55, over: 0.78, burnt: 0.95 }[p.aburi] : 0;
    this.sear = { uid: p.uid, t: prev };
    sfx('sizzle');
    return true;
  }
  searEnd() {
    const s = this.sear;
    if (!s) return;
    this.sear = null;
    const p = this.plate.pieces.find((x) => x.uid === s.uid);
    if (p && p.kind === 'nigiri' && s.t > 0.06) {
      p.aburi = doneness(s.t);
      if (p.aburi === 'done') this.toast(tt('perfectCut'), 'good');
      if (p.aburi === 'burnt') this.toast(tx({ tr: 'Yandı!', en: 'Burnt!' }), 'bad');
    }
    this.bump();
  }

  // ---------- mini-games: maki mat and sashimi knife ----------

  openMaki() {
    if (this.board.m !== 'idle') return;
    this.dismissAsk();
    this.dropHand();
    this.board = {
      m: 'maki',
      style: 'hoso',
      stage: 'rice',
      rice: 0,
      fill: [],
      prog: 0,
      n: 6,
      cutT: 0,
    };
    this.ledger.ing += ING.nori.cost;
    sfx('place');
    this.bump();
  }
  openSashimi() {
    if (this.board.m !== 'idle') return;
    this.dismissAsk();
    this.dropHand();
    this.board = { m: 'pick' };
    sfx('tap');
    this.bump();
  }
  pickFish(fish: IngId) {
    if (this.board.m !== 'pick') return;
    this.board = { m: 'sashimi', fish, n: 3, cutT: 0 };
    sfx('place');
    this.bump();
  }
  closeBoard() {
    const b = this.board;
    if (b.m === 'maki') this.ledger.waste += ING.nori.cost + (b.riceQ ? ING.rice.cost : 0);
    this.board = { m: 'idle' };
    this.riceHold = false;
    this.rollDrag = null;
    sfx('trash');
    this.bump();
  }

  availableStyles(): MakiStyle[] {
    return (['hoso', 'ura', 'futo'] as MakiStyle[]).filter((s) => this.n >= STYLE_DAY[s]);
  }
  fillChips(): IngId[] {
    return (
      ['cucumber', 'avocado', 'salmon', 'tuna', 'crab', 'creamcheese', 'tamago', 'ebi'] as IngId[]
    ).filter((i) => this.have.has(i));
  }
  coatChips(): IngId[] {
    return (['sesame', 'tobiko'] as IngId[]).filter((i) => this.have.has(i));
  }

  boardStyle(s: MakiStyle) {
    const b = this.board;
    if (b.m !== 'maki' || b.stage === 'rolling' || b.stage === 'cut') return;
    b.style = s;
    if (s !== 'ura') b.coat = undefined;
    b.n = s === 'hoso' ? 6 : 8;
    sfx('tap');
    this.bump();
  }
  boardRiceStart() {
    const b = this.board;
    if (b.m === 'maki' && b.stage === 'rice') {
      this.riceHold = true;
      this.bump();
    }
  }
  boardRiceEnd() {
    const b = this.board;
    if (!this.riceHold) return;
    this.riceHold = false;
    if (b.m === 'maki' && b.stage === 'rice') {
      if (b.rice < 0.15) {
        this.toast(tt('bRice'));
        return;
      }
      b.riceQ = riceQuality(b.rice);
      b.stage = 'fill';
      this.ledger.ing += ING.rice.cost;
      sfx('pour');
      this.bump();
    }
  }
  get riceHolding() {
    return this.riceHold;
  }
  toggleFill(i: IngId) {
    const b = this.board;
    if (b.m !== 'maki' || b.stage !== 'fill') return;
    if (b.fill.includes(i)) b.fill = b.fill.filter((x) => x !== i);
    else if (b.fill.length < 4) b.fill.push(i);
    sfx(b.fill.includes(i) ? 'place' : 'tap');
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
    sfx('tap');
    this.bump();
  }

  /** y in mat units (1 = full mat height) */
  rollStart(y: number, hold: boolean) {
    const b = this.board;
    if (b.m !== 'maki' || b.stage !== 'fill') return false;
    if (!b.fill.length) {
      this.toast(tx({ tr: 'Önce iç malzeme seç', en: 'Pick a filling first' }));
      return false;
    }
    b.stage = 'rolling';
    b.prog = 0;
    this.rollDrag = { lastY: y, time: 0, hold };
    for (const f of b.fill) this.ledger.ing += ING[f].cost;
    if (b.coat) this.ledger.ing += ING[b.coat].cost;
    this.bump();
    return true;
  }
  rollMove(y: number) {
    const b = this.board;
    const d = this.rollDrag;
    if (b.m !== 'maki' || b.stage !== 'rolling' || !d) return;
    const dy = d.lastY - y;
    d.lastY = y;
    if (Math.abs(dy) > 0.004) d.hold = false;
    if (dy > 0) b.prog = Math.min(1, b.prog + dy);
    if (b.prog >= 1) this.rollFinish();
  }
  rollEnd() {
    if (this.rollDrag) this.rollDrag.hold = true;
  }
  private rollFinish() {
    const b = this.board;
    const d = this.rollDrag;
    if (b.m !== 'maki' || !d) return;
    const speed = d.time > 0 ? 1 / d.time : 1;
    b.roll = speed > 2.6 ? 'loose' : speed < 0.32 ? 'squashed' : 'tight';
    b.stage = 'cut';
    b.cutT = 0;
    this.rollDrag = null;
    sfx('whoosh');
    if (b.roll === 'loose')
      this.toast(
        tx({ tr: 'Çok hızlı sardın, rulo gevşek!', en: 'Rolled too fast, it’s loose!' }),
        'bad'
      );
    if (b.roll === 'squashed')
      this.toast(
        tx({ tr: 'Çok yavaş, rulo ezildi', en: 'Too slow, the roll got squashed' }),
        'bad'
      );
    this.bump();
  }
  get rollSpeed() {
    const d = this.rollDrag;
    const b = this.board;
    return d && d.time > 0 && b.m === 'maki' ? b.prog / d.time : 0;
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
          idx: i,
        });
      this.giveBatch(pieces, 'maki', cut);
    } else if (b.m === 'sashimi') {
      const pos = cutMarker(b.cutT, 1.9);
      const z = SASHIMI_ZONES.find((q) => pos >= q.a && pos <= q.b)!;
      const cut: CutQ = z.q ? 'clean' : 'crooked';
      const thick: Thick = z.q ?? (pos < 0.34 ? 'thin' : pos < 0.66 ? 'normal' : 'thick');
      this.ledger.ing += ING[b.fish].cost * 0.5 * b.n;
      const pieces: PieceBody[] = [];
      for (let i = 0; i < b.n; i++)
        pieces.push({ kind: 'sashimi', fish: b.fish, thick, cut, idx: i });
      this.giveBatch(pieces, b.fish, cut);
    }
  }

  private giveBatch(pieces: PieceBody[], label: IngId | 'maki', cut: CutQ) {
    this.hand = { k: 'batch', pieces, label };
    this.board = { m: 'idle' };
    sfx(cut === 'clean' ? 'perfect' : 'fail');
    buzz(cut === 'clean' ? 10 : 30);
    this.toast(
      cut === 'clean' ? tt('perfectCut') : tt('crooked'),
      cut === 'clean' ? 'good' : 'bad'
    );
    this.bump();
  }

  private tickPrep(dt: number) {
    if (this.squeeze.on) this.squeeze.a = Math.min(RICE_MAX, this.squeeze.a + dt * 0.62);
    else if (this.squeeze.a > 0 && this.hand?.k !== 'rice')
      this.squeeze.a = Math.max(0, this.squeeze.a - dt * 2);
    const b = this.board;
    if (b.m === 'maki' && b.stage === 'rice' && this.riceHold) {
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
    if (this.sear) {
      const before = this.sear.t;
      this.sear.t = Math.min(1.02, this.sear.t + dt / 2.6);
      if (before < DIAL.done && this.sear.t >= DIAL.done) sfx('ding');
      const p = this.plate.pieces.find((x) => x.uid === this.sear!.uid);
      if (p && Math.random() < dt * 14)
        this.addFx(this.sear.t > DIAL.burnt ? 'smoke' : 'flame', p.x, p.y - 0.06, 'plate');
    }
  }

  // ---------- fx ----------

  addFx(kind: Fx['kind'], x: number, y: number, space: Fx['space']) {
    if (this.fx.length > 140) return;
    const r = Math.random;
    this.fx.push({
      kind,
      x,
      y,
      vx: (r() - 0.5) * (kind === 'grain' ? 0.25 : 0.05),
      vy: kind === 'grain' ? -0.2 - r() * 0.2 : -0.05 - r() * 0.06,
      t: 0,
      life: kind === 'grain' ? 0.5 : kind === 'flame' ? 0.45 : 1.4,
      s: 0.6 + r() * 0.6,
      space,
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
      });
    if (this.coins.length > 50) this.coins.splice(0, this.coins.length - 50);
  }
  private tickCoins(dt: number) {
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
    return l.sales + l.tips + l.bonus - l.ing - l.waste - l.overpaid - this.day.rent;
  }
  get dayRating() {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((a, r) => a + r.stars, 0) / this.reviews.length;
  }
  get stars() {
    const r = this.dayRating;
    if (!this.ledger.served) return 1;
    if (r >= 4.4 && this.net > 0 && !this.ledger.walkouts) return 3;
    if (r >= 3.4) return 2;
    return 1;
  }

  // ---------- day-1 hints from Pip ----------

  hint(): { text: L; target?: string } | null {
    if (!this.tutorial || this.over) return null;
    const c = this.cust;
    if (c?.state === 'verdict' && c.ask)
      return {
        text: {
          tr: 'Müşteriye cevap ver! Cevabın yorumu değiştirir.',
          en: 'Answer the customer! Your reply changes the review.',
        },
        target: 'choices',
      };
    if (!c || c.state === 'arrive')
      return { text: { tr: 'Biri geliyor…', en: 'Someone’s coming…' } };
    if (c.state === 'order')
      return {
        text: {
          tr: 'Dinle! Siparişi karta yazıyorum.',
          en: 'Listen! I’m writing the order on the card.',
        },
      };
    if (c.state !== 'wait') return null;
    if (c.ask === 'order')
      return {
        text: {
          tr: 'İstersen müşteriye bir cevap ver, sonra işe koyul.',
          en: 'Say something back if you like, then get to work.',
        },
        target: 'choices',
      };
    const o = c.order;
    const nig = this.plate.pieces.filter((p) => p.kind === 'nigiri');
    const want = o.lines.reduce((a, l) => a + (l.k === 'nigiri' ? l.n : 0), 0);
    if (nig.length < want) {
      if (this.hand?.k === 'rice')
        return {
          text: {
            tr: 'Tabakta istediğin yere dokun: her dokunuş bir pirinç topu.',
            en: 'Tap the plate where you want: each tap is one rice ball.',
          },
          target: 'plate',
        };
      return {
        text: { tr: 'Pirinç kabına dokun.', en: 'Tap the rice tub.' },
        target: 'tray:rice',
      };
    }
    const bare = nig.filter((p) => !p.neta);
    if (bare.length) {
      const line = o.lines.find((l) => l.k === 'nigiri');
      const f = line && line.k === 'nigiri' ? line.fish : 'salmon';
      if (this.hand?.k === 'tub' && this.hand.ing === f)
        return {
          text: { tr: 'Şimdi her pirinç topuna dokun.', en: 'Now tap each rice ball.' },
          target: 'plate',
        };
      return {
        text: { tr: 'Balık kabına bir kez dokun.', en: 'Tap the fish tray once.' },
        target: 'tray:' + f,
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
          en: `Side: tap the ${ING[miss].name.en.toLowerCase()} tray.`,
        },
        target: 'tray:' + miss,
      };
    }
    return { text: { tr: 'Hazır! “Servis et”e bas.', en: 'Ready! Tap “Serve”.' }, target: 'serve' };
  }
}
