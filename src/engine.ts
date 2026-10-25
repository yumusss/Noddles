import {
  FIRST_NAMES,
  GREETINGS,
  INGREDIENTS,
  LEVELS,
  ONLINE_NAMES,
  unlockedUpTo,
  type Level,
  type SpecialCustomer,
} from './data';
import { randomLook, type Look, type Mood } from './art';

export interface Order {
  noodle: string;
  broth: string;
  toppings: string[];
}

export type Grade = 'perfect' | 'good' | 'meh' | 'bad';

export interface Customer {
  id: number;
  name: string;
  look: Look;
  seat: number;
  state: 'arriving' | 'ordering' | 'waiting' | 'eating' | 'leaving';
  stateT: number;
  patience: number;
  maxPatience: number;
  order: Order;
  greet: string;
  special?: SpecialCustomer;
  ticketId?: number;
  result?: Grade | 'gone';
  bubble?: string;
}

export interface Ticket {
  id: number;
  customerId?: number;
  online?: string;
  name: string;
  order: Order;
  patience: number;
  maxPatience: number;
  special?: boolean;
}

export interface Bowl {
  ticketId: number;
  noodle?: string;
  quality?: 'perfect' | 'under' | 'over';
  broth?: string;
  toppings: string[];
}

export interface Pot {
  noodle?: string;
  t: number;
}

export interface Offer {
  id: number;
  name: string;
  order: Order;
  expires: number;
  total: number;
}

export interface Floater {
  id: number;
  text: string;
  color: string;
  view: 'salon' | 'kitchen';
  x: number;
  y: number;
  born: number;
}

export interface Courier {
  id: number;
  born: number;
}

export interface GameState {
  level: Level;
  unlocked: string[];
  time: number;
  coins: number;
  served: number;
  perfect: number;
  lost: number;
  combo: number;
  bestCombo: number;
  customers: Customer[];
  tickets: Ticket[];
  bowls: Bowl[];
  activeTicket?: number;
  pots: Pot[];
  offers: Offer[];
  nextSpawn: number;
  nextOnline: number;
  floaters: Floater[];
  couriers: Courier[];
  specialsSpawned: number[];
  salonAlert: boolean;
  phoneAlert: boolean;
  ended: boolean;
  seq: number;
}

export const COOK: Record<string, { ready: number; over: number }> = {
  ramen: { ready: 3.6, over: 8 },
  udon: { ready: 4.6, over: 9.5 },
  soba: { ready: 4, over: 8 },
  pirinc: { ready: 2.8, over: 6.5 },
};

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export function newGame(levelId: number): GameState {
  const level = LEVELS[levelId - 1];
  return {
    level,
    unlocked: unlockedUpTo(levelId),
    time: 0,
    coins: 0,
    served: 0,
    perfect: 0,
    lost: 0,
    combo: 0,
    bestCombo: 0,
    customers: [],
    tickets: [],
    bowls: [],
    pots: Array.from({ length: level.pots }, () => ({ t: 0 })),
    offers: [],
    nextSpawn: 1.2,
    nextOnline: level.online ? 14 : Infinity,
    floaters: [],
    couriers: [],
    specialsSpawned: [],
    salonAlert: false,
    phoneAlert: false,
    ended: false,
    seq: 1,
  };
}

function byCat(g: GameState, cat: string) {
  return g.unlocked.filter((id) => INGREDIENTS[id].cat === cat);
}

export function randomOrder(g: GameState): Order {
  const fresh = g.level.unlock;
  const noodles = byCat(g, 'noodle');
  const broths = byCat(g, 'broth');
  const tops = byCat(g, 'topping');
  const preferFresh = (list: string[]) => {
    const f = list.filter((x) => fresh.includes(x));
    return f.length && Math.random() < 0.45 ? pick(f) : pick(list);
  };
  const [mn, mx] = g.level.maxToppings;
  const n = Math.min(tops.length, Math.round(rnd(mn, mx)));
  const chosen = new Set<string>();
  const freshTops = tops.filter((t) => fresh.includes(t));
  if (freshTops.length && Math.random() < 0.55) chosen.add(pick(freshTops));
  while (chosen.size < n) chosen.add(pick(tops));
  return { noodle: preferFresh(noodles), broth: preferFresh(broths), toppings: [...chosen] };
}

export function orderPrice(o: Order) {
  return (
    3 +
    INGREDIENTS[o.noodle].price +
    INGREDIENTS[o.broth].price +
    o.toppings.reduce((s, t) => s + INGREDIENTS[t].price, 0)
  );
}

export function moodFor(c: Customer): Mood {
  if (c.state === 'eating' || c.state === 'leaving') {
    if (c.result === 'perfect') return 'love';
    if (c.result === 'good') return 'happy';
    if (c.result === 'meh') return 'worried';
    return 'angry';
  }
  if (c.special?.look === 'baron' && c.state !== 'arriving')
    return c.patience / c.maxPatience > 0.4 ? 'neutral' : 'angry';
  const r = c.patience / c.maxPatience;
  if (r > 0.6) return 'happy';
  if (r > 0.35) return 'neutral';
  if (r > 0.15) return 'worried';
  return 'angry';
}

function floater(
  g: GameState,
  text: string,
  color: string,
  view: 'salon' | 'kitchen',
  x = 50,
  y = 40
) {
  g.floaters.push({ id: g.seq++, text, color, view, x, y, born: g.time });
}

function freeSeat(g: GameState): number {
  for (let s = 0; s < g.level.seats; s++) if (!g.customers.some((c) => c.seat === s)) return s;
  return -1;
}

function spawn(g: GameState, special?: SpecialCustomer) {
  const seat = freeSeat(g);
  if (seat < 0) return false;
  const look: Look = special ? { ...randomLook(), special: special.look } : randomLook();
  const hasty = !special && Math.random() < 0.18;
  const base = special?.patience ?? g.level.patience * (hasty ? 0.72 : rnd(0.9, 1.15));
  g.customers.push({
    id: g.seq++,
    name: special ? special.name : pick(FIRST_NAMES) + (hasty ? ' ⚡' : ''),
    look,
    seat,
    state: 'arriving',
    stateT: 0,
    patience: base,
    maxPatience: base,
    order: special ? special.order : randomOrder(g),
    greet: special ? special.greet : hasty ? 'Acelem var, çabuk lütfen!' : pick(GREETINGS),
    special,
  });
  g.salonAlert = true;
  return true;
}

export type GameEvent =
  'arrive' | 'leave-angry' | 'phone' | 'offer-missed' | 'ready' | 'over' | 'end' | 'warn';

export function tick(g: GameState, dt: number, view: 'salon' | 'kitchen'): GameEvent[] {
  const ev: GameEvent[] = [];
  if (g.ended) return ev;
  g.time += dt;
  const L = g.level;
  const closing = g.time >= L.duration - 6;

  // specials first
  L.specials?.forEach((s, i) => {
    if (!g.specialsSpawned.includes(i) && g.time >= s.at && !closing) {
      if (spawn(g, s)) {
        g.specialsSpawned.push(i);
        ev.push('arrive');
      }
    }
  });

  if (!closing && g.time >= g.nextSpawn) {
    if (spawn(g)) {
      ev.push('arrive');
      g.nextSpawn = g.time + rnd(L.spawnEvery[0], L.spawnEvery[1]);
    } else g.nextSpawn = g.time + 1;
  }

  if (L.online && !closing && g.time >= g.nextOnline) {
    const order = randomOrder(g);
    g.offers.push({
      id: g.seq++,
      name: pick(ONLINE_NAMES),
      order,
      expires: g.time + 16,
      total: 16,
    });
    g.phoneAlert = true;
    g.nextOnline = g.time + L.online * rnd(0.8, 1.25);
    ev.push('phone');
  }

  // offers expire
  g.offers = g.offers.filter((o) => {
    if (g.time > o.expires) {
      g.lost++;
      g.combo = 0;
      floater(g, 'Online sipariş kaçtı', '#ff6b6b', 'kitchen', 80, 20);
      ev.push('offer-missed');
      return false;
    }
    return true;
  });
  if (!g.offers.length) g.phoneAlert = false;

  // customers
  for (const c of g.customers) {
    c.stateT += dt;
    if (c.state === 'arriving' && c.stateT > 0.9) {
      c.state = 'ordering';
      c.stateT = 0;
    }
    if (c.state === 'ordering' || c.state === 'waiting') {
      c.patience -= dt;
      if (c.patience < c.maxPatience * 0.25 && c.patience + dt >= c.maxPatience * 0.25)
        ev.push('warn');
      if (c.patience <= 0) {
        c.state = 'leaving';
        c.stateT = 0;
        c.result = 'gone';
        c.bubble = pick(['Ben gidiyorum!', 'Bu kadar beklenmez!', 'Hıh!', 'Başka yere gidiyorum.']);
        g.lost++;
        g.combo = 0;
        if (c.ticketId) removeTicket(g, c.ticketId);
        floater(g, 'Müşteri kızıp gitti', '#ff6b6b', view, 50, 30);
        ev.push('leave-angry');
      }
    }
    if (c.state === 'eating' && c.stateT > 2.6) {
      c.state = 'leaving';
      c.stateT = 0;
    }
  }
  g.customers = g.customers.filter((c) => !(c.state === 'leaving' && c.stateT > 1.2));

  // online tickets patience
  for (const t of [...g.tickets]) {
    if (!t.online) continue;
    t.patience -= dt;
    if (t.patience <= 0) {
      removeTicket(g, t.id);
      g.lost++;
      g.combo = 0;
      floater(g, 'Online sipariş iptal!', '#ff6b6b', 'kitchen', 50, 20);
      ev.push('leave-angry');
    }
  }
  for (const t of g.tickets) {
    if (t.customerId) {
      const c = g.customers.find((x) => x.id === t.customerId);
      if (c) t.patience = c.patience;
    }
  }

  // pots
  for (const p of g.pots) {
    if (!p.noodle) continue;
    const before = p.t;
    p.t += dt;
    const cook = COOK[p.noodle];
    if (before < cook.ready && p.t >= cook.ready) ev.push('ready');
    if (before < cook.over && p.t >= cook.over) ev.push('over');
  }

  g.floaters = g.floaters.filter((f) => g.time - f.born < 1.6);
  g.couriers = g.couriers.filter((c) => g.time - c.born < 2.5);

  if (!g.activeTicket || !g.tickets.some((t) => t.id === g.activeTicket)) {
    g.activeTicket = g.tickets[0]?.id;
  }

  if (g.time >= L.duration) {
    g.ended = true;
    ev.push('end');
  }
  return ev;
}

function removeTicket(g: GameState, id: number) {
  g.tickets = g.tickets.filter((t) => t.id !== id);
  g.bowls = g.bowls.filter((b) => b.ticketId !== id);
  if (g.activeTicket === id) g.activeTicket = g.tickets[0]?.id;
}

// ---------- player actions ----------

export function takeOrder(g: GameState, customerId: number): boolean {
  const c = g.customers.find((x) => x.id === customerId);
  if (!c || c.state !== 'ordering') return false;
  c.state = 'waiting';
  c.stateT = 0;
  c.patience = Math.min(c.maxPatience, c.patience + c.maxPatience * 0.15);
  const t: Ticket = {
    id: g.seq++,
    customerId: c.id,
    name: c.name,
    order: c.order,
    patience: c.patience,
    maxPatience: c.maxPatience,
    special: !!c.special,
  };
  c.ticketId = t.id;
  g.tickets.push(t);
  if (!g.activeTicket) g.activeTicket = t.id;
  return true;
}

export function acceptOffer(g: GameState, offerId: number) {
  const o = g.offers.find((x) => x.id === offerId);
  if (!o) return;
  g.offers = g.offers.filter((x) => x.id !== offerId);
  const patience = 62 + o.order.toppings.length * 6;
  g.tickets.push({
    id: g.seq++,
    online: o.name,
    name: o.name,
    order: o.order,
    patience,
    maxPatience: patience,
  });
  if (!g.activeTicket) g.activeTicket = g.tickets[g.tickets.length - 1].id;
}

export function activeBowl(g: GameState, create = false): Bowl | undefined {
  if (!g.activeTicket) return undefined;
  let b = g.bowls.find((x) => x.ticketId === g.activeTicket);
  if (!b && create) {
    b = { ticketId: g.activeTicket, toppings: [] };
    g.bowls.push(b);
  }
  return b;
}

export function selectTicket(g: GameState, id: number) {
  g.activeTicket = id;
}

export function dropNoodle(g: GameState, noodle: string): boolean {
  const p = g.pots.find((x) => !x.noodle);
  if (!p) return false;
  p.noodle = noodle;
  p.t = 0;
  return true;
}

export type PotResult = 'moved' | 'not-ready' | 'no-bowl' | 'has-noodle' | 'empty';

export function takeFromPot(g: GameState, idx: number): PotResult {
  const p = g.pots[idx];
  if (!p.noodle) return 'empty';
  const cook = COOK[p.noodle];
  const b = activeBowl(g, true);
  if (!b) return 'no-bowl';
  if (b.noodle) return 'has-noodle';
  b.noodle = p.noodle;
  b.quality = p.t < cook.ready ? 'under' : p.t > cook.over ? 'over' : 'perfect';
  p.noodle = undefined;
  p.t = 0;
  return 'moved';
}

export function dumpPot(g: GameState, idx: number) {
  g.pots[idx].noodle = undefined;
  g.pots[idx].t = 0;
}

export function pourBroth(g: GameState, broth: string): boolean {
  const b = activeBowl(g, true);
  if (!b) return false;
  b.broth = broth;
  return true;
}

export function toggleTopping(g: GameState, t: string): 'added' | 'removed' | 'none' {
  const b = activeBowl(g, true);
  if (!b) return 'none';
  if (b.toppings.includes(t)) {
    b.toppings = b.toppings.filter((x) => x !== t);
    return 'removed';
  }
  b.toppings.push(t);
  return 'added';
}

export function trashBowl(g: GameState) {
  if (!g.activeTicket) return;
  g.bowls = g.bowls.filter((b) => b.ticketId !== g.activeTicket);
}

export interface ServeResult {
  grade: Grade;
  pay: number;
  tip: number;
  bonus: number;
  notes: string[];
  online: boolean;
}

export function grade(order: Order, b: Bowl): { score: number; notes: string[] } {
  let score = 0;
  const notes: string[] = [];
  if (b.noodle === order.noodle) {
    score += 30;
    if (b.quality === 'perfect') score += 10;
    else if (b.quality === 'under') notes.push('Erişte çiğ kalmış');
    else notes.push('Erişte lapa olmuş');
  } else notes.push(b.noodle ? 'Yanlış erişte' : 'Erişte yok!');
  if (b.broth === order.broth) score += 25;
  else notes.push(b.broth ? 'Yanlış su' : 'Su yok!');
  const req = new Set(order.toppings);
  const have = new Set(b.toppings);
  const correct = [...have].filter((x) => req.has(x)).length;
  const extra = [...have].filter((x) => !req.has(x)).length;
  const missing = req.size - correct;
  score += Math.max(0, (35 * (correct - extra * 0.6)) / req.size);
  if (missing) notes.push(`${missing} malzeme eksik`);
  if (extra) notes.push(`${extra} fazla malzeme`);
  return { score: Math.round(score), notes };
}

export function serve(g: GameState): ServeResult | null {
  const t = g.tickets.find((x) => x.id === g.activeTicket);
  const b = activeBowl(g);
  if (!t || !b) return null;
  const { score, notes } = grade(t.order, b);
  const gr: Grade = score >= 92 ? 'perfect' : score >= 66 ? 'good' : score >= 38 ? 'meh' : 'bad';
  const price = orderPrice(t.order);
  const mult = gr === 'perfect' ? 1 : gr === 'good' ? 0.8 : gr === 'meh' ? 0.45 : 0;
  const ratio = Math.max(0, t.patience / t.maxPatience);
  if (gr === 'perfect') {
    g.combo++;
    g.perfect++;
  } else g.combo = 0;
  g.bestCombo = Math.max(g.bestCombo, g.combo);
  const comboMult = 1 + Math.min(g.combo, 6) * 0.1;
  const tip = gr === 'perfect' || gr === 'good' ? Math.round(price * 0.6 * ratio * comboMult) : 0;
  let bonus = 0;
  const pay = Math.round(price * mult);
  const online = !!t.online;

  if (t.customerId) {
    const c = g.customers.find((x) => x.id === t.customerId);
    if (c) {
      c.state = 'eating';
      c.stateT = 0;
      c.result = gr;
      c.ticketId = undefined;
      if (c.special && gr === 'perfect') bonus = c.special.bonus;
      c.bubble =
        gr === 'perfect'
          ? pick(['Muhteşem!', 'Tam kıvamında!', 'Efsane!', 'Aşık oldum!'])
          : gr === 'good'
            ? pick(['Güzel olmuş!', 'Teşekkürler!', 'Lezzetli!'])
            : gr === 'meh'
              ? pick(['Hmm… idare eder.', 'Bu biraz farklı…'])
              : pick(['Ben bunu istemedim!', 'Bu ne böyle?!']);
    }
  } else {
    g.couriers.push({ id: g.seq++, born: g.time });
  }
  g.served++;
  g.coins += pay + tip + bonus;
  removeTicket(g, t.id);
  return { grade: gr, pay, tip, bonus, notes, online };
}

export function stars(g: GameState) {
  const [a, b, c] = g.level.targets;
  return g.coins >= c ? 3 : g.coins >= b ? 2 : g.coins >= a ? 1 : 0;
}
