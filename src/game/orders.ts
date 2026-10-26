// Order generation, the words customers say, the paper ticket, and plate scoring.

import {
  ING,
  type IngId,
  type PlateId,
  PLATES,
  unlockedIngs,
  unlockedPlates,
  type Day,
} from './data';
import { getLang, tx, type L } from './i18n';
import type { MakiStyle, Piece, PieceBody, Thick } from './plate';
import { sameSet } from './plate';

export type OLine =
  | { k: 'nigiri'; fish: IngId; n: number; less: boolean; tops: IngId[] }
  | { k: 'maki'; style: MakiStyle; fill: IngId[]; coat?: IngId; n: 6 | 8; tops: IngId[] }
  | { k: 'sashimi'; fish: IngId; n: 3 | 5; thick: Thick }
  | { k: 'temaki'; fill: IngId[]; n: number; tops: IngId[] };

export interface Order {
  lines: OLine[];
  sides: IngId[];
  forbid: IngId[];
  plate?: PlateId;
  veg?: boolean;
  variety?: number;
  online?: boolean;
}

// ---------- helpers ----------

export const STYLE_DAY: Record<MakiStyle, number> = { hoso: 3, ura: 6, futo: 10 };
const SASHIMI_DAY = 4;
const TEMAKI_DAY = 8;

type Rng = () => number;
export function mulberry(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(r: Rng, a: T[]): T => a[Math.floor(r() * a.length)];
const chance = (r: Rng, p: number) => r() < p;

// ---------- generation ----------

/** builds a random order that only uses what is unlocked on this day */
export function makeOrder(day: Day, r: Rng, opts: { kid?: boolean; online?: boolean } = {}): Order {
  const n = day.n;
  const tier = day.tier;
  const have = unlockedIngs(n);
  const has = (i: IngId) => have.has(i);
  const veg = tier >= 4 && chance(r, 0.18);

  const netaPool = (['salmon', 'tuna', 'tamago', 'unagi'] as IngId[]).filter(
    (i) => has(i) && (!veg || !ING[i].fish)
  );
  const fillPool = (
    [
      'cucumber',
      'avocado',
      'salmon',
      'tuna',
      'crab',
      'creamcheese',
      'tempura',
      'tamago',
      'unagi',
    ] as IngId[]
  ).filter((i) => has(i) && (!veg || !ING[i].fish));
  const topPool = (['sesame', 'tobiko', 'scallion', 'spicymayo'] as IngId[]).filter(
    (i) => has(i) && (!veg || !ING[i].fish)
  );
  const fishPool = (['salmon', 'tuna'] as IngId[]).filter(has);

  const kinds: OLine['k'][] = [];
  if (netaPool.length) kinds.push('nigiri');
  if (n >= STYLE_DAY.hoso && fillPool.length) kinds.push('maki');
  if (n >= SASHIMI_DAY && !veg && fishPool.length) kinds.push('sashimi');
  if (n >= TEMAKI_DAY && fillPool.length) kinds.push('temaki');

  let lineCount = 1;
  let variety: number | undefined;
  if (tier >= 2 && chance(r, tier >= 4 ? 0.4 : 0.22)) lineCount = 2;
  if (tier >= 5 && chance(r, 0.25) && kinds.length >= 3) {
    lineCount = 3;
    variety = 3;
  }
  if (opts.kid) lineCount = 1;
  if (opts.online) lineCount = Math.min(2, Math.max(lineCount, 1));

  const lines: OLine[] = [];
  const used = new Set<string>();
  let budget = 12;
  let guard = 0;
  // the newest dish of the day shows up more often so the new thing gets practiced
  const fresh = newestKind(n);
  while (lines.length < lineCount && guard++ < 30) {
    const k =
      lines.length === 0 && fresh && kinds.includes(fresh) && chance(r, 0.5)
        ? fresh
        : pick(r, kinds);
    if (variety && used.has(k)) continue;
    const line = makeLine(k, n, tier, r, {
      netaPool,
      fillPool,
      topPool,
      fishPool,
      kid: !!opts.kid,
    });
    if (!line) continue;
    const key = lineKey(line);
    if (used.has(key)) continue;
    const size = line.n;
    if (size > budget) continue;
    budget -= size;
    used.add(key);
    if (variety) used.add(k);
    lines.push(line);
  }
  if (!lines.length) lines.push({ k: 'nigiri', fish: 'salmon', n: 2, less: false, tops: [] });

  // sides
  const sides: IngId[] = [];
  const forbid: IngId[] = [];
  if (chance(r, 0.6)) sides.push('soy');
  if (has('ginger') && chance(r, 0.45)) sides.push('ginger');
  if (tier >= 3 && chance(r, 0.3) && !opts.kid) forbid.push('wasabi');
  else if (chance(r, opts.kid ? 0.1 : 0.5)) sides.push('wasabi');

  let plate: PlateId | undefined;
  const plates = unlockedPlates(n);
  if (!opts.online && tier >= 3 && plates.length > 1 && chance(r, 0.3)) plate = pick(r, plates);

  return { lines, sides, forbid, plate, veg: veg || undefined, variety, online: opts.online };
}

function newestKind(n: number): OLine['k'] | null {
  if (n === STYLE_DAY.hoso || n === STYLE_DAY.ura || n === STYLE_DAY.futo) return 'maki';
  if (n === SASHIMI_DAY) return 'sashimi';
  if (n === TEMAKI_DAY) return 'temaki';
  return null;
}

function lineKey(l: OLine) {
  switch (l.k) {
    case 'nigiri':
      return 'n:' + l.fish;
    case 'sashimi':
      return 's:' + l.fish;
    case 'maki':
      return 'm:' + l.style + [...l.fill].sort().join();
    case 'temaki':
      return 't:' + [...l.fill].sort().join();
  }
}

function makeLine(
  k: OLine['k'],
  day: number,
  tier: number,
  r: Rng,
  p: { netaPool: IngId[]; fillPool: IngId[]; topPool: IngId[]; fishPool: IngId[]; kid: boolean }
): OLine | null {
  const tops = (max: number, pool = p.topPool): IngId[] => {
    if (tier < 3 || !pool.length) return [];
    const out: IngId[] = [];
    if (chance(r, 0.35)) out.push(pick(r, pool));
    if (max > 1 && tier >= 5 && chance(r, 0.15)) {
      const b = pick(r, pool);
      if (!out.includes(b)) out.push(b);
    }
    return out;
  };
  switch (k) {
    case 'nigiri': {
      if (!p.netaPool.length) return null;
      const fish = pick(r, p.netaPool);
      const n = p.kid ? 2 : pick(r, tier <= 1 ? [2, 2, 3, 4] : [2, 3, 4, 4]);
      const t =
        fish === 'tamago'
          ? ['noriband' as IngId]
          : fish === 'unagi'
            ? ['unagisauce' as IngId]
            : tops(1);
      return { k: 'nigiri', fish, n, less: tier >= 2 && chance(r, 0.15), tops: t };
    }
    case 'maki': {
      const styles = (['hoso', 'ura', 'futo'] as MakiStyle[]).filter((s) => day >= STYLE_DAY[s]);
      const style = pick(r, styles);
      const pool = [...p.fillPool];
      const fill: IngId[] = [];
      const want = style === 'hoso' ? 1 : style === 'ura' ? 2 : 3;
      if (pool.length < want) return null;
      while (fill.length < want) {
        const f = pick(r, pool);
        if (!fill.includes(f)) fill.push(f);
      }
      let coat: IngId | undefined;
      if (style === 'ura') {
        const coats = (['sesame', 'tobiko'] as IngId[]).filter((c) => p.topPool.includes(c));
        coat = coats.length ? pick(r, coats) : undefined;
      }
      const n: 6 | 8 = style === 'hoso' ? 6 : chance(r, 0.6) ? 8 : 6;
      const t =
        tier >= 4
          ? tops(
              1,
              p.topPool.filter((x) => x === 'spicymayo' || x === 'scallion')
            )
          : [];
      return { k: 'maki', style, fill, coat, n, tops: t };
    }
    case 'sashimi': {
      const fish = pick(r, p.fishPool);
      const thick = pick(r, ['normal', 'normal', 'thin', 'thick'] as Thick[]);
      return { k: 'sashimi', fish, n: chance(r, 0.6) ? 3 : 5, thick };
    }
    case 'temaki': {
      const fill: IngId[] = [pick(r, p.fillPool)];
      if (chance(r, 0.5)) {
        const b = pick(r, p.fillPool);
        if (!fill.includes(b)) fill.push(b);
      }
      return { k: 'temaki', fill, n: p.kid ? 1 : chance(r, 0.5) ? 1 : 2, tops: tops(1) };
    }
  }
}

/** hand-written orders for special guests */
export function specialOrder(id: string): Order {
  switch (id) {
    case 'tuna-sashimi':
      return {
        lines: [{ k: 'sashimi', fish: 'tuna', n: 3, thick: 'thin' }],
        sides: ['soy'],
        forbid: [],
      };
    case 'stranger-ura':
      return {
        lines: [
          { k: 'maki', style: 'ura', fill: ['crab', 'avocado'], coat: 'sesame', n: 8, tops: [] },
        ],
        sides: ['soy', 'ginger'],
        forbid: [],
      };
    case 'gleam-temaki':
      return {
        lines: [{ k: 'temaki', fill: ['salmon'], n: 2, tops: ['spicymayo'] }],
        sides: [],
        forbid: [],
      };
    case 'critic-plate':
      return {
        lines: [
          { k: 'nigiri', fish: 'salmon', n: 2, less: false, tops: [] },
          { k: 'nigiri', fish: 'tamago', n: 2, less: false, tops: ['noriband'] },
        ],
        sides: ['ginger'],
        forbid: ['wasabi'],
        plate: 'porcelain',
      };
  }
  return {
    lines: [{ k: 'nigiri', fish: 'salmon', n: 2, less: false, tops: [] }],
    sides: [],
    forbid: [],
  };
}

// ---------- words ----------

const ADJ: Partial<Record<IngId, L>> = {
  salmon: { tr: 'somonlu', en: 'salmon' },
  tuna: { tr: 'ton balıklı', en: 'tuna' },
  cucumber: { tr: 'salatalıklı', en: 'cucumber' },
  avocado: { tr: 'avokadolu', en: 'avocado' },
  crab: { tr: 'yengeçli', en: 'crab' },
  creamcheese: { tr: 'krem peynirli', en: 'cream cheese' },
  tempura: { tr: 'tempuralı', en: 'tempura' },
  tamago: { tr: 'tamagolu', en: 'tamago' },
  unagi: { tr: 'unagili', en: 'eel' },
  sesame: { tr: 'susamlı', en: 'sesame' },
  tobiko: { tr: 'tobikolu', en: 'tobiko' },
  scallion: { tr: 'taze soğanlı', en: 'scallion' },
  spicymayo: { tr: 'acı mayolu', en: 'spicy mayo' },
  unagisauce: { tr: 'unagi soslu', en: 'eel sauce' },
  noriband: { tr: 'nori kuşaklı', en: 'nori belt' },
};
const NOUN: Partial<Record<IngId, L>> = {
  salmon: { tr: 'somon', en: 'salmon' },
  tuna: { tr: 'ton balığı', en: 'tuna' },
  tamago: { tr: 'tamago', en: 'tamago' },
  unagi: { tr: 'unagi', en: 'eel' },
};
const THICK: Record<Thick, L> = {
  thin: { tr: 'ince', en: 'thin' },
  normal: { tr: 'normal', en: 'regular' },
  thick: { tr: 'kalın', en: 'thick' },
};
const STYLE: Record<MakiStyle, L> = {
  hoso: { tr: 'hoso maki', en: 'hosomaki' },
  futo: { tr: 'futo maki', en: 'futomaki' },
  ura: { tr: 'ura maki', en: 'uramaki' },
};

function joinWords(a: string[]) {
  const and = getLang() === 'tr' ? ' ve ' : ' and ';
  if (a.length <= 1) return a.join('');
  return a.slice(0, -1).join(', ') + and + a[a.length - 1];
}
const adj = (i: IngId) => tx(ADJ[i] ?? ING[i].name);
const noun = (i: IngId) => tx(NOUN[i] ?? ING[i].name);
const suffix6 = (n: number) => (n === 6 ? "6'lık" : "8'lik");

export function linePhrase(l: OLine): string {
  const tr = getLang() === 'tr';
  switch (l.k) {
    case 'nigiri': {
      if (tr) {
        const a = [...(l.less ? ['az pirinçli'] : []), ...l.tops.map(adj)];
        return `${l.n} ${a.length ? a.join(', ') + ' ' : ''}${noun(l.fish)} nigiri`;
      }
      const w = l.tops.length ? ' with ' + joinWords(l.tops.map(adj)) : '';
      return `${l.n} ${noun(l.fish)} nigiri${l.less ? ', light on rice' : ''}${w}`;
    }
    case 'maki': {
      if (tr) {
        const a = [...l.fill.map(adj)];
        const coat = l.coat ? `, dışı ${l.coat === 'sesame' ? 'susamlı' : 'tobikolu'}` : '';
        const t = l.tops.length ? `, üstü ${l.tops.map(adj).join(' ve ')}` : '';
        return `${suffix6(l.n)} ${a.join(' ')} ${tx(STYLE[l.style])}${coat}${t}`;
      }
      const coat = l.coat ? `, ${l.coat === 'sesame' ? 'sesame' : 'tobiko'} outside` : '';
      const t = l.tops.length ? ' with ' + joinWords(l.tops.map(adj)) + ' on top' : '';
      return `${l.n}-piece ${joinWords(l.fill.map(adj))} ${tx(STYLE[l.style])}${coat}${t}`;
    }
    case 'sashimi':
      return tr
        ? `${l.n} ${tx(THICK[l.thick])} ${noun(l.fish)} sashimi`
        : `${l.n} ${tx(THICK[l.thick])} ${noun(l.fish)} sashimi`;
    case 'temaki': {
      if (tr) {
        const t = l.tops.length ? l.tops.map(adj).join(', ') + ' ' : '';
        return `${l.n} ${t}${l.fill.map(adj).join(' ')} temaki`;
      }
      const t = l.tops.length ? ' with ' + joinWords(l.tops.map(adj)) : '';
      return `${l.n} ${joinWords(l.fill.map(adj))} temaki${t}`;
    }
  }
}

const GREET_TR = ['Merhaba!', 'Selam!', 'İyi günler!', 'Kolay gelsin!', 'Merhabalar!'];
const GREET_EN = ['Hi there!', 'Hello!', 'Good day!', 'Hey!', 'Hiya!'];
const KID_TR = ['Merhabaaa!', 'Selam şef!', 'Ben de sushi istiyorum!'];
const KID_EN = ['Hiii!', 'Hey chef!', 'I want sushi too!'];

/** what the customer says out loud — complete and unambiguous */
export function orderSpeech(o: Order, r: Rng, kid = false, greet?: string): string {
  const tr = getLang() === 'tr';
  const parts: string[] = [];
  parts.push(greet ?? (kid ? pick(r, tr ? KID_TR : KID_EN) : pick(r, tr ? GREET_TR : GREET_EN)));
  if (o.veg) parts.push(tr ? 'Balık yemiyorum.' : 'I don’t eat fish.');
  const items = o.lines.map(linePhrase);
  if (o.variety)
    parts.push(
      tr
        ? `Karışık bir tabak, en az ${o.variety} çeşit: ${joinWords(items)}.`
        : `A mixed plate, at least ${o.variety} kinds: ${joinWords(items)}.`
    );
  else parts.push(tr ? `${joinWords(items)} alayım.` : `I’ll have ${joinWords(items)}.`);
  if (o.sides.length) {
    const s = joinWords(o.sides.map((i) => tx(ING[i].name).toLowerCase()));
    parts.push(tr ? `Yanında ${s} olsun.` : `With ${s} on the side.`);
  }
  if (o.forbid.length) {
    const s = joinWords(o.forbid.map((i) => tx(ING[i].name)));
    parts.push(tr ? `${s} olmasın lütfen!` : `No ${s.toLowerCase()}, please!`);
  }
  if (o.plate) {
    const p = PLATES.find((x) => x.id === o.plate)!;
    parts.push(tr ? `${tx(p.name)} tabakta olsun.` : `On the ${tx(p.name).toLowerCase()} plate.`);
  }
  if (o.lines.some((l) => 'tops' in l && l.tops.includes('spicymayo')))
    parts.push(tr ? 'Acı olsun!' : 'Make it spicy!');
  return parts.join(' ');
}

/** compact rows for the paper ticket */
export interface TicketRow {
  text: string;
  sub?: string;
  ok: boolean;
  bad?: boolean;
}
export function ticketRows(o: Order, pieces: Piece[], plateId?: PlateId): TicketRow[] {
  const tr = getLang() === 'tr';
  const rows: TicketRow[] = [];
  const res = matchLines(o, pieces);
  o.lines.forEach((l, i) => {
    const subs: string[] = [];
    let head = '';
    switch (l.k) {
      case 'nigiri':
        head = `${l.n}× ${cap(noun(l.fish))} nigiri`;
        if (l.less) subs.push(tr ? 'az pirinç' : 'light rice');
        l.tops.forEach((t) => subs.push(tx(ING[t].name).toLowerCase()));
        break;
      case 'maki':
        head = `${l.n}× ${cap(tx(STYLE[l.style]))}`;
        subs.push(l.fill.map((f) => tx(ING[f].name).toLowerCase()).join(' + '));
        if (l.coat) subs.push((tr ? 'dışı ' : 'outside: ') + tx(ING[l.coat].name).toLowerCase());
        l.tops.forEach((t) => subs.push((tr ? 'üstü ' : 'top: ') + tx(ING[t].name).toLowerCase()));
        break;
      case 'sashimi':
        head = `${l.n}× ${cap(noun(l.fish))} sashimi`;
        subs.push(tx(THICK[l.thick]));
        break;
      case 'temaki':
        head = `${l.n}× Temaki`;
        subs.push(l.fill.map((f) => tx(ING[f].name).toLowerCase()).join(' + '));
        l.tops.forEach((t) => subs.push(tx(ING[t].name).toLowerCase()));
        break;
    }
    rows.push({ text: head, sub: subs.join(' · '), ok: res.lineOk[i] });
  });
  if (o.sides.length) {
    const have = new Set(
      pieces.filter((p) => p.kind === 'side').map((p) => (p as { ing: IngId }).ing)
    );
    rows.push({
      text: o.sides.map((s) => tx(ING[s].name)).join(' · '),
      ok: o.sides.every((s) => have.has(s)),
    });
  }
  o.forbid.forEach((f) => {
    const bad = pieces.some((p) => p.kind === 'side' && p.ing === f);
    rows.push({
      text: tr ? `${tx(ING[f].name)} YOK` : `NO ${tx(ING[f].name).toUpperCase()}`,
      ok: !bad,
      bad,
    });
  });
  if (o.plate) {
    const p = PLATES.find((x) => x.id === o.plate)!;
    rows.push({ text: (tr ? 'Tabak: ' : 'Plate: ') + tx(p.name), ok: plateId === o.plate });
  }
  return rows;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- matching & scoring ----------

function identity(l: OLine, p: PieceBody): boolean {
  switch (l.k) {
    case 'nigiri':
      return p.kind === 'nigiri' && p.neta === l.fish;
    case 'maki':
      return (
        p.kind === 'maki' &&
        p.style === l.style &&
        sameSet(p.fill, l.fill) &&
        (p.coat ?? null) === (l.coat ?? null)
      );
    case 'sashimi':
      return p.kind === 'sashimi' && p.fish === l.fish;
    case 'temaki':
      return p.kind === 'temaki' && sameSet(p.fill, l.fill);
  }
}

interface MatchResult {
  assigned: Piece[][];
  extra: Piece[];
  lineOk: boolean[];
}

export function matchLines(o: Order, pieces: Piece[]): MatchResult {
  const pool = pieces.filter((p) => p.kind !== 'side');
  const taken = new Set<number>();
  const assigned: Piece[][] = o.lines.map((l) => {
    const got: Piece[] = [];
    for (const p of pool) {
      if (got.length >= l.n) break;
      if (taken.has(p.uid)) continue;
      if (identity(l, p)) {
        got.push(p);
        taken.add(p.uid);
      }
    }
    return got;
  });
  const extra = pool.filter((p) => !taken.has(p.uid));
  const lineOk = o.lines.map(
    (l, i) => assigned[i].length === l.n && assigned[i].every((p) => pieceRight(l, p))
  );
  return { assigned, extra, lineOk };
}

const topsEq = (want: IngId[], p: Piece) => {
  const have = p.kind === 'nigiri' && p.band ? [...p.tops, 'noriband' as IngId] : p.tops;
  return sameSet(want, have);
};

function pieceRight(l: OLine, p: Piece): boolean {
  switch (l.k) {
    case 'nigiri':
      return (
        p.kind === 'nigiri' &&
        p.rice === (l.less ? 'less' : 'just') &&
        topsEq(l.tops, p) &&
        p.done !== 'raw'
      );
    case 'maki':
      return p.kind === 'maki' && p.roll === 'tight' && p.cut === 'clean' && topsEq(l.tops, p);
    case 'sashimi':
      return p.kind === 'sashimi' && p.thick === l.thick && p.cut === 'clean';
    case 'temaki':
      return p.kind === 'temaki' && topsEq(l.tops, p) && p.rice !== 'more';
  }
}

export type Reason =
  | 'missing'
  | 'extra'
  | 'rice'
  | 'tops'
  | 'loose'
  | 'crooked'
  | 'thick'
  | 'raw'
  | 'over'
  | 'forbid'
  | 'plate'
  | 'side'
  | 'empty';

export interface Score {
  score: number;
  complaint: boolean;
  reasons: Reason[];
}

export function scorePlate(o: Order, pieces: Piece[], plate: PlateId): Score {
  const reasons = new Set<Reason>();
  let s = 100;
  let complaint = false;
  const m = matchLines(o, pieces);
  if (!pieces.some((p) => p.kind !== 'side'))
    return { score: 0, complaint: true, reasons: ['empty'] };

  o.lines.forEach((l, i) => {
    const got = m.assigned[i];
    const miss = l.n - got.length;
    if (miss > 0) {
      s -= 12 * miss;
      reasons.add('missing');
      complaint = true;
    }
    let topsBad = 0;
    let thickBad = 0;
    for (const p of got) {
      if (p.kind === 'nigiri') {
        if (p.rice !== (l.k === 'nigiri' && l.less ? 'less' : 'just')) {
          s -= 4;
          reasons.add('rice');
        }
      }
      if (p.kind === 'temaki' && p.rice === 'more') {
        s -= 4;
        reasons.add('rice');
      }
      if ('tops' in l && !topsEq(l.tops, p)) {
        topsBad++;
        s -= 5;
      }
      if (p.kind === 'maki') {
        if (p.roll === 'loose') s -= 9;
        if (p.roll === 'squashed') s -= 4;
        if (p.cut === 'crooked') s -= 4;
        if (p.rice !== 'just') s -= 1;
      }
      if (p.kind === 'sashimi') {
        if (l.k === 'sashimi' && p.thick !== l.thick) {
          thickBad++;
          s -= 6;
        }
        if (p.cut === 'crooked') s -= 5;
      }
      const done = 'done' in p ? p.done : undefined;
      if (done === 'raw') {
        s -= 10;
        reasons.add('raw');
        complaint = true;
      } else if (done === 'over') {
        s -= 4;
        reasons.add('over');
      }
    }
    if (topsBad && topsBad * 2 >= got.length) {
      reasons.add('tops');
      complaint = true;
    }
    if (got.some((p) => p.kind === 'maki' && p.roll === 'loose')) {
      reasons.add('loose');
      complaint = true;
    }
    if (got.some((p) => (p.kind === 'maki' || p.kind === 'sashimi') && p.cut === 'crooked')) {
      reasons.add('crooked');
      if (got.filter((p) => 'cut' in p && p.cut === 'crooked').length * 2 >= got.length)
        complaint = true;
    }
    if (thickBad && thickBad * 2 >= got.length) {
      reasons.add('thick');
      complaint = true;
    }
  });
  if (m.extra.length) {
    s -= 6 * m.extra.length;
    reasons.add('extra');
    complaint = true;
  }
  const sides = pieces.filter((p) => p.kind === 'side').map((p) => (p as { ing: IngId }).ing);
  for (const f of o.forbid)
    if (sides.includes(f)) {
      s -= 25;
      reasons.add('forbid');
      complaint = true;
    }
  for (const want of o.sides)
    if (!sides.includes(want)) {
      s -= 6;
      reasons.add('side');
    }
  const extraSides = new Set(sides.filter((x) => !o.sides.includes(x) && !o.forbid.includes(x)));
  s -= 3 * extraSides.size;
  if (o.plate && plate !== o.plate) {
    s -= 15;
    reasons.add('plate');
    complaint = true;
  }
  return { score: Math.max(0, Math.min(100, Math.round(s))), complaint, reasons: [...reasons] };
}

/** what a complaining customer says */
export const REASON_TEXT: Record<Reason, L> = {
  missing: {
    tr: 'Eksik var! Ben daha fazlasını istemiştim.',
    en: 'Something’s missing! I ordered more than this.',
  },
  extra: {
    tr: 'Bunu ben istemedim, tabakta fazlalık var.',
    en: 'I didn’t order this, there’s extra on the plate.',
  },
  rice: { tr: 'Pirinç tam olmamış.', en: 'The rice isn’t quite right.' },
  tops: { tr: 'Üstü dediğim gibi değil!', en: 'The topping isn’t what I asked for!' },
  loose: { tr: 'Rulo dağılıyor!', en: 'The roll is falling apart!' },
  crooked: { tr: 'Dilimler eğri kesilmiş.', en: 'The slices are cut crooked.' },
  thick: { tr: 'Kalınlığı istediğim gibi değil.', en: 'That’s not the thickness I asked for.' },
  raw: { tr: 'Bu pişmemiş!', en: 'This isn’t cooked!' },
  over: { tr: 'Biraz fazla pişmiş.', en: 'A bit overcooked.' },
  forbid: { tr: 'Wasabi koyma dedim!', en: 'I said no wasabi!' },
  plate: { tr: 'Başka tabakta istemiştim.', en: 'I asked for a different plate.' },
  side: { tr: 'Yan ürünü unutmuşsun.', en: 'You forgot the side.' },
  empty: { tr: 'Tabak bomboş!', en: 'The plate is empty!' },
};

// ---------- price & cost ----------

const NETA_PRICE: Partial<Record<IngId, number>> = { salmon: 8, tuna: 9, tamago: 6, unagi: 11 };
export function orderPrice(o: Order): number {
  let p = 0;
  for (const l of o.lines) {
    switch (l.k) {
      case 'nigiri':
        p += (NETA_PRICE[l.fish] ?? 7) * l.n;
        break;
      case 'maki':
        p += (l.style === 'hoso' ? 3 : l.style === 'ura' ? 4 : 5) * l.n + l.fill.length * 2;
        break;
      case 'sashimi':
        p += (l.fish === 'tuna' ? 9 : 8) * l.n;
        break;
      case 'temaki':
        p += 14 * l.n + l.fill.length * 2;
        break;
    }
    if ('tops' in l) p += l.tops.length * 2;
  }
  return Math.max(10, Math.round(p));
}

export function pieceCost(p: PieceBody, tops: IngId[]): number {
  let c = tops.reduce((a, t) => a + ING[t].cost, 0);
  switch (p.kind) {
    case 'nigiri':
      c += ING.rice.cost * 0.5 + (p.neta ? ING[p.neta].cost * 0.5 : 0) + (p.band ? 0.2 : 0);
      break;
    case 'side':
      c += ING[p.ing].cost;
      break;
    default:
      break; // maki/sashimi/temaki costs are paid when the roll/block is made
  }
  return c;
}
