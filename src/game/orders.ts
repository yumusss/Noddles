// Orders: generation, what customers say, the order card rows, and plate scoring.

import {
  ING,
  type IngId,
  type PlateId,
  PLATES,
  unlockedIngs,
  unlockedPlates,
  type Day,
  firstDay,
} from './data';
import { getLang, tx, type L } from './i18n';
import type { MakiStyle, Piece, PieceBody, Thick } from './plate';
import { sameSet } from './plate';

export type OLine =
  | { k: 'nigiri'; fish: IngId; n: number; less: boolean; tops: IngId[]; aburi: boolean }
  | { k: 'maki'; style: MakiStyle; fill: IngId[]; coat?: IngId; n: 6 | 8; tops: IngId[] }
  | { k: 'sashimi'; fish: IngId; n: 3 | 5; thick: Thick };

export interface Order {
  lines: OLine[];
  sides: IngId[];
  forbid: IngId[];
  plate?: PlateId;
  veg?: boolean;
  online?: boolean;
}

export const STYLE_DAY: Record<MakiStyle, number> = { hoso: 3, ura: 6, futo: 9 };

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

export function makeOrder(day: Day, r: Rng, opts: { kid?: boolean; online?: boolean } = {}): Order {
  const n = day.n;
  const tier = day.tier;
  const have = unlockedIngs(n);
  const has = (i: IngId) => have.has(i);
  const veg = tier >= 4 && chance(r, 0.15);
  const ok = (i: IngId) => has(i) && (!veg || !ING[i].fish);

  const netaPool = (['salmon', 'tuna', 'tamago', 'ebi'] as IngId[]).filter(ok);
  const fillPool = (
    ['cucumber', 'avocado', 'salmon', 'tuna', 'crab', 'creamcheese', 'tamago', 'ebi'] as IngId[]
  ).filter(ok);
  const topPool = (['sesame', 'tobiko', 'scallion', 'spicymayo'] as IngId[]).filter(ok);
  const fishPool = (['salmon', 'tuna'] as IngId[]).filter(has);

  const kinds: OLine['k'][] = [];
  if (netaPool.length) kinds.push('nigiri');
  if (n >= STYLE_DAY.hoso && fillPool.length) kinds.push('maki');
  if (n >= firstDay('sashimi') && !veg && fishPool.length) kinds.push('sashimi');

  let lineCount = 1;
  if (tier >= 2 && chance(r, tier >= 4 ? 0.42 : 0.25)) lineCount = 2;
  if (tier >= 6 && chance(r, 0.25)) lineCount = 3;
  if (opts.kid) lineCount = 1;

  const lines: OLine[] = [];
  const used = new Set<string>();
  let budget = 14;
  const fresh = newestKind(n);
  for (let guard = 0; lines.length < lineCount && guard < 30; guard++) {
    const k =
      lines.length === 0 && fresh && kinds.includes(fresh) && chance(r, 0.55)
        ? fresh
        : pick(r, kinds);
    const line = makeLine(k, n, tier, r, {
      netaPool,
      fillPool,
      topPool,
      fishPool,
      kid: !!opts.kid,
    });
    if (!line) continue;
    const key = lineKey(line);
    if (used.has(key) || line.n > budget) continue;
    budget -= line.n;
    used.add(key);
    lines.push(line);
  }
  if (!lines.length)
    lines.push({ k: 'nigiri', fish: 'salmon', n: 2, less: false, tops: [], aburi: false });

  const sides: IngId[] = [];
  const forbid: IngId[] = [];
  if (chance(r, 0.6)) sides.push('soy');
  if (has('ginger') && chance(r, 0.4)) sides.push('ginger');
  if (tier >= 3 && chance(r, 0.3) && !opts.kid) forbid.push('wasabi');
  else if (chance(r, opts.kid ? 0.1 : 0.45)) sides.push('wasabi');

  let plate: PlateId | undefined;
  const plates = unlockedPlates(n);
  if (!opts.online && tier >= 3 && plates.length > 1 && chance(r, 0.3)) plate = pick(r, plates);

  return { lines, sides, forbid, plate, veg: veg || undefined, online: opts.online };
}

function newestKind(n: number): OLine['k'] | null {
  if (n === STYLE_DAY.hoso || n === STYLE_DAY.ura || n === STYLE_DAY.futo) return 'maki';
  if (n === firstDay('sashimi')) return 'sashimi';
  if (n === firstDay('torch')) return 'nigiri';
  return null;
}

function lineKey(l: OLine) {
  switch (l.k) {
    case 'nigiri':
      return 'n:' + l.fish + (l.aburi ? 'a' : '');
    case 'sashimi':
      return 's:' + l.fish;
    case 'maki':
      return 'm:' + l.style + [...l.fill].sort().join();
  }
}

function makeLine(
  k: OLine['k'],
  day: number,
  tier: number,
  r: Rng,
  p: { netaPool: IngId[]; fillPool: IngId[]; topPool: IngId[]; fishPool: IngId[]; kid: boolean }
): OLine | null {
  switch (k) {
    case 'nigiri': {
      if (!p.netaPool.length) return null;
      const fish = pick(r, p.netaPool);
      const n = p.kid ? 2 : pick(r, tier <= 1 ? [2, 2, 3, 4] : [2, 3, 4, 4]);
      const aburi =
        fish === 'salmon' &&
        day >= firstDay('torch') &&
        chance(r, day === firstDay('torch') ? 0.7 : 0.35);
      let tops: IngId[] = [];
      if (fish === 'tamago') tops = ['noriband'];
      else if (tier >= 3 && p.topPool.length && chance(r, 0.35)) tops = [pick(r, p.topPool)];
      return { k: 'nigiri', fish, n, less: tier >= 2 && chance(r, 0.15), tops, aburi };
    }
    case 'maki': {
      const styles = (['hoso', 'ura', 'futo'] as MakiStyle[]).filter((s) => day >= STYLE_DAY[s]);
      const style = pick(r, styles);
      const want = style === 'hoso' ? 1 : style === 'ura' ? 2 : 3;
      if (p.fillPool.length < want) return null;
      const fill: IngId[] = [];
      while (fill.length < want) {
        const f = pick(r, p.fillPool);
        if (!fill.includes(f)) fill.push(f);
      }
      let coat: IngId | undefined;
      if (style === 'ura') {
        const coats = (['sesame', 'tobiko'] as IngId[]).filter((c) => p.topPool.includes(c));
        coat = coats.length ? pick(r, coats) : undefined;
      }
      const n: 6 | 8 = style === 'hoso' ? 6 : chance(r, 0.6) ? 8 : 6;
      const sauce = p.topPool.filter((x) => x === 'spicymayo' || x === 'scallion');
      const tops = tier >= 4 && sauce.length && chance(r, 0.35) ? [pick(r, sauce)] : [];
      return { k: 'maki', style, fill, coat, n, tops };
    }
    case 'sashimi': {
      const fish = pick(r, p.fishPool);
      return {
        k: 'sashimi',
        fish,
        n: chance(r, 0.6) ? 3 : 5,
        thick: pick(r, ['normal', 'normal', 'thin', 'thick'] as Thick[]),
      };
    }
  }
}

export function specialOrder(id: string): Order {
  switch (id) {
    case 'bear-sashimi':
      return {
        lines: [{ k: 'sashimi', fish: 'salmon', n: 5, thick: 'thick' }],
        sides: ['soy'],
        forbid: [],
      };
    case 'gull-ura':
      return {
        lines: [
          { k: 'maki', style: 'ura', fill: ['crab', 'avocado'], coat: 'sesame', n: 8, tops: [] },
        ],
        sides: ['soy'],
        forbid: [],
      };
    case 'owl-plate':
      return {
        lines: [
          { k: 'nigiri', fish: 'salmon', n: 2, less: false, tops: [], aburi: true },
          { k: 'nigiri', fish: 'ebi', n: 2, less: false, tops: [], aburi: false },
        ],
        sides: ['ginger'],
        forbid: ['wasabi'],
        plate: 'porcelain',
      };
    case 'fox-festival':
      return {
        lines: [
          { k: 'maki', style: 'ura', fill: ['salmon', 'avocado'], coat: 'tobiko', n: 6, tops: [] },
          { k: 'nigiri', fish: 'tamago', n: 2, less: false, tops: ['noriband'], aburi: false },
        ],
        sides: ['soy'],
        forbid: [],
        plate: 'slate',
      };
  }
  return {
    lines: [{ k: 'nigiri', fish: 'salmon', n: 2, less: false, tops: [], aburi: false }],
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
  tamago: { tr: 'tamagolu', en: 'tamago' },
  ebi: { tr: 'karidesli', en: 'shrimp' },
  sesame: { tr: 'susamlı', en: 'sesame' },
  tobiko: { tr: 'tobikolu', en: 'tobiko' },
  scallion: { tr: 'taze soğanlı', en: 'scallion' },
  spicymayo: { tr: 'acı mayolu', en: 'spicy mayo' },
};
const NOUN: Partial<Record<IngId, L>> = {
  salmon: { tr: 'somon', en: 'salmon' },
  tuna: { tr: 'ton balığı', en: 'tuna' },
  tamago: { tr: 'tamago', en: 'tamago' },
  ebi: { tr: 'karides', en: 'shrimp' },
};
export const THICK: Record<Thick, L> = {
  thin: { tr: 'ince', en: 'thin' },
  normal: { tr: 'normal', en: 'regular' },
  thick: { tr: 'kalın', en: 'thick' },
};
export const STYLE: Record<MakiStyle, L> = {
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
export const noun = (i: IngId) => tx(NOUN[i] ?? ING[i].name);

export function linePhrase(l: OLine): string {
  const tr = getLang() === 'tr';
  switch (l.k) {
    case 'nigiri': {
      if (tr) {
        const a = [
          ...(l.aburi ? ['aburi'] : []),
          ...(l.less ? ['az pirinçli'] : []),
          ...l.tops.filter((t) => t !== 'noriband').map(adj),
        ];
        return `${l.n} ${a.length ? a.join(', ') + ' ' : ''}${noun(l.fish)} nigiri`;
      }
      const w = l.tops.filter((t) => t !== 'noriband').length
        ? ' with ' + joinWords(l.tops.filter((t) => t !== 'noriband').map(adj))
        : '';
      return `${l.n} ${l.aburi ? 'aburi ' : ''}${noun(l.fish)} nigiri${l.less ? ', light on rice' : ''}${w}`;
    }
    case 'maki': {
      if (tr) {
        const coat = l.coat ? `, dışı ${l.coat === 'sesame' ? 'susamlı' : 'tobikolu'}` : '';
        const t = l.tops.length ? `, üstü ${l.tops.map(adj).join(' ve ')}` : '';
        return `${l.n} dilim ${l.fill.map(adj).join(' ')} ${tx(STYLE[l.style])}${coat}${t}`;
      }
      const coat = l.coat ? `, ${l.coat} outside` : '';
      const t = l.tops.length ? ' with ' + joinWords(l.tops.map(adj)) + ' on top' : '';
      return `${l.n}-piece ${joinWords(l.fill.map(adj))} ${tx(STYLE[l.style])}${coat}${t}`;
    }
    case 'sashimi':
      return `${l.n} ${tx(THICK[l.thick])} ${noun(l.fish)} sashimi`;
  }
}

const GREET: L[] = [
  { tr: 'Merhaba!', en: 'Hi there!' },
  { tr: 'Brr, dışarısı buz gibi!', en: 'Brr, it’s freezing out!' },
  { tr: 'Selam şef!', en: 'Hey chef!' },
  { tr: 'İyi günler!', en: 'Good day!' },
  { tr: 'Kokusu buraya kadar geliyor!', en: 'I could smell it from the pier!' },
];
const KID_GREET: L[] = [
  { tr: 'Merhabaaa!', en: 'Hiii!' },
  { tr: 'Annem bana sushi alabilirsin dedi!', en: 'Mom said I can get sushi!' },
];

export function orderSpeech(o: Order, r: Rng, kid = false, greet?: string): string {
  const tr = getLang() === 'tr';
  const parts: string[] = [greet ?? tx(pick(r, kid ? KID_GREET : GREET))];
  if (o.veg) parts.push(tr ? 'Balık yemiyorum.' : 'I don’t eat fish.');
  const items = o.lines.map(linePhrase);
  parts.push(tr ? `${joinWords(items)} alabilir miyim?` : `Can I get ${joinWords(items)}?`);
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
  return parts.join(' ');
}

// ---------- the order card ----------

export interface CardRow {
  line?: OLine;
  side?: IngId;
  text: string;
  sub?: string;
  ok: boolean;
  bad?: boolean;
  kind: 'line' | 'side' | 'forbid' | 'plate';
}

export function cardRows(o: Order, pieces: Piece[], plateId?: PlateId): CardRow[] {
  const tr = getLang() === 'tr';
  const res = matchLines(o, pieces);
  const rows: CardRow[] = o.lines.map((l, i) => {
    const subs: string[] = [];
    let head = '';
    switch (l.k) {
      case 'nigiri':
        head = `${cap(noun(l.fish))} nigiri`;
        if (l.aburi) subs.push('aburi');
        if (l.less) subs.push(tr ? 'az pirinç' : 'light rice');
        l.tops.forEach((t) => t !== 'noriband' && subs.push(tx(ING[t].name).toLowerCase()));
        break;
      case 'maki':
        head = cap(tx(STYLE[l.style]));
        subs.push(l.fill.map((f) => tx(ING[f].name).toLowerCase()).join(' + '));
        if (l.coat) subs.push((tr ? 'dışı ' : 'outside: ') + tx(ING[l.coat].name).toLowerCase());
        l.tops.forEach((t) => subs.push((tr ? 'üstü ' : 'top: ') + tx(ING[t].name).toLowerCase()));
        break;
      case 'sashimi':
        head = `${cap(noun(l.fish))} sashimi`;
        subs.push(tx(THICK[l.thick]));
        break;
    }
    return {
      line: l,
      text: `${l.n}× ${head}`,
      sub: subs.join(' · '),
      ok: res.lineOk[i],
      kind: 'line',
    };
  });
  const have = new Set(
    pieces.filter((p) => p.kind === 'side').map((p) => (p as { ing: IngId }).ing)
  );
  for (const s of o.sides)
    rows.push({ side: s, text: tx(ING[s].name), ok: have.has(s), kind: 'side' });
  for (const f of o.forbid)
    rows.push({
      side: f,
      text: tr ? `${tx(ING[f].name)} YOK` : `NO ${tx(ING[f].name).toUpperCase()}`,
      ok: !have.has(f),
      bad: have.has(f),
      kind: 'forbid',
    });
  if (o.plate) {
    const p = PLATES.find((x) => x.id === o.plate)!;
    rows.push({
      text: (tr ? 'Tabak: ' : 'Plate: ') + tx(p.name),
      ok: plateId === o.plate,
      kind: 'plate',
    });
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
  }
}

export function matchLines(o: Order, pieces: Piece[]) {
  const pool = pieces.filter((p) => p.kind !== 'side');
  const taken = new Set<number>();
  // aburi and plain nigiri of the same fish: prefer the right kind first
  const assigned: Piece[][] = o.lines.map((l) => {
    const got: Piece[] = [];
    const cands = pool.filter((p) => !taken.has(p.uid) && identity(l, p));
    if (l.k === 'nigiri') cands.sort((a, b) => Number(aburiOk(l, b)) - Number(aburiOk(l, a)));
    for (const p of cands) {
      if (got.length >= l.n) break;
      got.push(p);
      taken.add(p.uid);
    }
    return got;
  });
  const extra = pool.filter((p) => !taken.has(p.uid));
  const lineOk = o.lines.map(
    (l, i) => assigned[i].length === l.n && assigned[i].every((p) => pieceRight(l, p))
  );
  return { assigned, extra, lineOk };
}

function aburiOk(l: OLine, p: Piece) {
  if (l.k !== 'nigiri' || p.kind !== 'nigiri') return true;
  return l.aburi ? p.aburi === 'done' : !p.aburi;
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
        aburiOk(l, p)
      );
    case 'maki':
      return p.kind === 'maki' && p.roll === 'tight' && p.cut === 'clean' && topsEq(l.tops, p);
    case 'sashimi':
      return p.kind === 'sashimi' && p.thick === l.thick && p.cut === 'clean';
  }
}

export type Reason =
  | 'missing'
  | 'extra'
  | 'riceMore'
  | 'riceLess'
  | 'tops'
  | 'loose'
  | 'squashed'
  | 'crooked'
  | 'thick'
  | 'noAburi'
  | 'burnt'
  | 'forbid'
  | 'plate'
  | 'side'
  | 'empty'
  | 'slow';

export interface Score {
  score: number;
  complaint: boolean;
  reasons: Reason[];
}

export function scorePlate(o: Order, pieces: Piece[], plate: PlateId): Score {
  const reasons: Reason[] = [];
  const add = (r: Reason) => !reasons.includes(r) && reasons.push(r);
  let s = 100;
  let complaint = false;
  if (!pieces.some((p) => p.kind !== 'side'))
    return { score: 0, complaint: true, reasons: ['empty'] };
  const m = matchLines(o, pieces);

  o.lines.forEach((l, i) => {
    const got = m.assigned[i];
    const miss = l.n - got.length;
    if (miss > 0) {
      s -= 16 * miss;
      add('missing');
      complaint = true;
    }
    let topsBad = 0;
    for (const p of got) {
      if (p.kind === 'nigiri' && l.k === 'nigiri') {
        const want = l.less ? 'less' : 'just';
        if (p.rice !== want) {
          s -= 5;
          add(p.rice === 'more' ? 'riceMore' : 'riceLess');
        }
        if (l.aburi && p.aburi !== 'done') {
          s -= p.aburi === 'burnt' || p.aburi === 'over' ? 9 : 8;
          add(p.aburi === 'burnt' || p.aburi === 'over' ? 'burnt' : 'noAburi');
          complaint = true;
        }
        if (!l.aburi && p.aburi) {
          s -= 6;
          add(p.aburi === 'burnt' ? 'burnt' : 'tops');
        }
      }
      if ('tops' in l && !topsEq(l.tops, p)) {
        topsBad++;
        s -= 5;
      }
      if (p.kind === 'maki') {
        if (p.roll === 'loose') s -= 9;
        if (p.roll === 'squashed') s -= 5;
        if (p.cut === 'crooked') s -= 4;
        if (p.rice === 'more') s -= 2;
      }
      if (p.kind === 'sashimi') {
        if (l.k === 'sashimi' && p.thick !== l.thick) s -= 6;
        if (p.cut === 'crooked') s -= 5;
      }
    }
    if (topsBad && topsBad * 2 >= got.length) {
      add('tops');
      complaint = true;
    }
    if (got.some((p) => p.kind === 'maki' && p.roll === 'loose')) {
      add('loose');
      complaint = true;
    }
    if (got.some((p) => p.kind === 'maki' && p.roll === 'squashed')) add('squashed');
    const crooked = got.filter((p) => 'cut' in p && p.cut === 'crooked').length;
    if (crooked) {
      add('crooked');
      if (crooked * 2 >= got.length) complaint = true;
    }
    if (
      l.k === 'sashimi' &&
      got.filter((p) => p.kind === 'sashimi' && p.thick !== l.thick).length * 2 >= got.length &&
      got.length
    ) {
      add('thick');
      complaint = true;
    }
  });
  if (m.extra.length) {
    s -= 6 * m.extra.length;
    add('extra');
    complaint = true;
  }
  const sides = pieces.filter((p) => p.kind === 'side').map((p) => (p as { ing: IngId }).ing);
  for (const f of o.forbid)
    if (sides.includes(f)) {
      s -= 25;
      add('forbid');
      complaint = true;
    }
  for (const want of o.sides)
    if (!sides.includes(want)) {
      s -= 6;
      add('side');
    }
  s -= 3 * new Set(sides.filter((x) => !o.sides.includes(x) && !o.forbid.includes(x))).size;
  if (o.plate && plate !== o.plate) {
    s -= 15;
    add('plate');
    complaint = true;
  }
  return { score: Math.max(0, Math.min(100, Math.round(s))), complaint, reasons };
}

/** short, honest phrases a customer uses to say what was wrong */
export const REASON_TEXT: Record<Reason, L> = {
  missing: { tr: 'eksik parça var', en: 'pieces are missing' },
  extra: { tr: 'istemediğim şeyler var', en: 'there’s stuff I didn’t order' },
  riceMore: { tr: 'pirinç çok fazla', en: 'way too much rice' },
  riceLess: { tr: 'pirinç çok az', en: 'too little rice' },
  tops: { tr: 'üstü istediğim gibi değil', en: 'the topping is wrong' },
  loose: { tr: 'rulo dağılıyor', en: 'the roll falls apart' },
  squashed: { tr: 'rulo ezilmiş', en: 'the roll is squashed' },
  crooked: { tr: 'dilimler eğri', en: 'the slices are crooked' },
  thick: { tr: 'kalınlık yanlış', en: 'the thickness is wrong' },
  noAburi: { tr: 'aburi değil, hiç yakılmamış', en: 'it isn’t seared at all' },
  burnt: { tr: 'somon yanmış', en: 'the salmon is burnt' },
  forbid: { tr: 'wasabi olmasın demiştim', en: 'I said no wasabi' },
  plate: { tr: 'başka tabak istemiştim', en: 'I asked for another plate' },
  side: { tr: 'yan ürünü unutmuşsun', en: 'you forgot my side' },
  empty: { tr: 'tabak bomboş', en: 'the plate is empty' },
  slow: { tr: 'çok bekledim', en: 'I waited forever' },
};

/** short tags shown on reviews in the Yumm app */
export const REASON_TAG: Record<Reason, L> = {
  missing: { tr: 'Eksik sipariş', en: 'Missing items' },
  extra: { tr: 'Yanlış sipariş', en: 'Wrong order' },
  riceMore: { tr: 'Çok pirinç', en: 'Too much rice' },
  riceLess: { tr: 'Az pirinç', en: 'Too little rice' },
  tops: { tr: 'Yanlış sos', en: 'Wrong topping' },
  loose: { tr: 'Dağılan rulo', en: 'Loose roll' },
  squashed: { tr: 'Ezik rulo', en: 'Squashed roll' },
  crooked: { tr: 'Eğri kesim', en: 'Crooked cut' },
  thick: { tr: 'Kalınlık', en: 'Thickness' },
  noAburi: { tr: 'Çiğ aburi', en: 'Unseared' },
  burnt: { tr: 'Yanık', en: 'Burnt' },
  forbid: { tr: 'Wasabi!', en: 'Wasabi!' },
  plate: { tr: 'Yanlış tabak', en: 'Wrong plate' },
  side: { tr: 'Unutulan yan ürün', en: 'Forgot the side' },
  empty: { tr: 'Boş tabak', en: 'Empty plate' },
  slow: { tr: 'Yavaş servis', en: 'Slow service' },
};

// ---------- price & cost ----------

const NETA_PRICE: Partial<Record<IngId, number>> = { salmon: 8, tuna: 9, tamago: 6, ebi: 8 };
export function orderPrice(o: Order): number {
  let p = 0;
  for (const l of o.lines) {
    if (l.k === 'nigiri') p += ((NETA_PRICE[l.fish] ?? 7) + (l.aburi ? 2 : 0)) * l.n;
    if (l.k === 'maki')
      p += (l.style === 'hoso' ? 3 : l.style === 'ura' ? 4 : 5) * l.n + l.fill.length * 2;
    if (l.k === 'sashimi') p += (l.fish === 'tuna' ? 9 : 8) * l.n;
    if ('tops' in l) p += l.tops.filter((t) => t !== 'noriband').length * 2;
  }
  return Math.max(10, Math.round(p));
}

export function pieceCost(p: PieceBody, tops: IngId[]): number {
  let c = tops.reduce((a, t) => a + ING[t].cost, 0);
  if (p.kind === 'nigiri')
    c += ING.rice.cost * 0.5 + (p.neta ? ING[p.neta].cost * 0.5 : 0) + (p.band ? 0.2 : 0);
  if (p.kind === 'side') c += ING[p.ing].cost;
  return c;
}
