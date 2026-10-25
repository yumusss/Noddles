import { INGREDIENTS, LEVELS, ONLINE_NAMES, unlockedUpTo } from './data';
import { randomLook, type Look } from './art';
import { isFeminine } from './avatar';

const FEMALE = [
  'Ayşe',
  'Elif',
  'Zeynep',
  'Ece',
  'Selin',
  'Defne',
  'Melis',
  'Nil',
  'İpek',
  'Lale',
  'Asya',
  'Nehir',
  'Ada',
  'Duru',
  'Yuki',
  'Mia',
  'Sara',
  'Deniz',
];
const MALE = [
  'Mehmet',
  'Can',
  'Burak',
  'Kaan',
  'Emre',
  'Ozan',
  'Yusuf',
  'Arda',
  'Kerem',
  'Tolga',
  'Barış',
  'Cem',
  'Mert',
  'Efe',
  'Kenji',
  'Leo',
  'Omar',
  'Deniz',
];
import type { CookState, Piece } from './bowl';
import { BOWLS, THICK_LABEL, bowlStyle, type Thick } from './food';

// ---------- order model ----------

export type Mode = 'exact' | 'bol' | 'biraz' | 'var';
export interface Req {
  id: string;
  mode: Mode;
  n?: number;
}
export type Rule =
  | { t: 'no'; id: string }
  | { t: 'spicy' }
  | { t: 'veg' }
  | { t: 'variety'; n: number }
  | { t: 'free' };
export type CookPref = 'dente' | 'perfect' | 'soft';

export interface Order {
  noodle: string | null;
  broth: string | null; // a broth (soup) or a sauce (dry noodles)
  thick?: Thick | null;
  bowl?: string | null;
  reqs: Req[];
  rules: Rule[];
  cook: CookPref;
}

export interface Customer {
  id: number;
  name: string;
  look: Look;
  phone: boolean;
  special?: 'hana' | 'baron' | 'lezzetova';
  greet: string;
  text: string; // what they say (the order)
  order: Order;
  bonus: number;
  reactions?: { great: string; ok: string; bad: string };
}

const MEAT = ['chashu', 'karides', 'naruto'];
const pick = <T>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T>(a: T[]) => [...a].sort(() => Math.random() - 0.5);

const UNIT: Record<string, string> = {
  chashu: 'dilim chashu',
  yumurta: 'yumurta',
  nori: 'yaprak nori',
  karides: 'tempura karides',
  naruto: 'dilim naruto',
  mantar: 'shiitake',
  tofu: 'parça tofu',
  bambu: 'bambu filizi',
  pakchoi: 'pak choi',
  kimchi: 'parça kimchi',
  lime: 'dilim limon',
  misir: 'kaşık mısır',
};

const COUNTABLE = new Set(Object.keys(UNIT));
const lower = (id: string) => INGREDIENTS[id].name.toLocaleLowerCase('tr');

function reqText(r: Req): string {
  if (r.mode === 'exact') return `${r.n} ${UNIT[r.id] ?? lower(r.id)}`;
  if (r.mode === 'bol') return `bol ${lower(r.id)}`;
  if (r.mode === 'biraz') return `biraz ${lower(r.id)}`;
  return lower(r.id);
}

function joinTr(parts: string[]) {
  if (parts.length <= 1) return parts.join('');
  return parts.slice(0, -1).join(', ') + ' ve ' + parts[parts.length - 1];
}

const BROTH_TEXT: Record<string, string> = {
  shoyu: 'soya suyuyla',
  miso: 'miso suyuyla',
  acili: 'acılı tantan suyuyla',
  tonkotsu: 'kemik suyuyla',
  tavuk: 'tavuk suyuyla',
  kori: 'köri suyuyla',
  teriyaki: 'teriyaki soslu, kuru',
  fistik: 'fıstık soslu, kuru',
  tatliaci: 'tatlı acı soslu, kuru',
  yakisoba: 'yakisoba soslu, kuru',
};

export function orderText(o: Order): string {
  const parts: string[] = [];
  const tk = o.thick ? { ince: 'ince ', orta: 'orta kalınlıkta ', kalin: 'kalın ' }[o.thick] : '';
  const n = o.noodle ? tk + INGREDIENTS[o.noodle].name : null;
  const b = o.broth ? BROTH_TEXT[o.broth] : null;
  if (n && b) parts.push(`${b} bir ${n}`);
  else if (n) parts.push(`bir ${n}, su fark etmez`);
  else if (b) parts.push(`${b} bir kase, erişte sizden`);
  else parts.push('bir kase noodle, erişte de su da sizden');
  let s = parts[0][0].toLocaleUpperCase('tr') + parts[0].slice(1);
  if (o.reqs.length) s += `. Üstüne ${joinTr(o.reqs.map(reqText))}`;
  s += '.';
  for (const r of o.rules) {
    if (r.t === 'no') s += ` Ama ${lower(r.id)} olmasın!`;
    if (r.t === 'spicy') s += ' Acı olsun, gözümden yaş gelsin!';
    if (r.t === 'veg') s += ' Et ve deniz ürünü yemiyorum.';
    if (r.t === 'variety') s += ` Gerisi sende şef, ama en az ${r.n} çeşit malzeme olsun.`;
    if (r.t === 'free') s += ' Gerisini sen süsle şef!';
  }
  if (o.bowl) s += ` ${bowlStyle(o.bowl).name} kasede olsun lütfen.`;
  if (o.cook === 'dente') s += ' Erişte diri kalsın.';
  if (o.cook === 'soft') s += ' Erişte iyice yumuşak olsun.';
  return s;
}

export function randomOrder(levelId: number): Order {
  const L = LEVELS[levelId - 1];
  const cx = L.complexity;
  const un = unlockedUpTo(levelId);
  const fresh = L.unlock;
  const noodles = un.filter((i) => INGREDIENTS[i].cat === 'noodle');
  const broths = un.filter((i) => INGREDIENTS[i].cat === 'broth');
  const sauces = un.filter((i) => INGREDIENTS[i].cat === 'sauce');
  const tops = un.filter((i) => INGREDIENTS[i].cat === 'topping');
  const favour = (list: string[]) => {
    const f = list.filter((x) => fresh.includes(x));
    return f.length && Math.random() < 0.45 ? pick(f) : pick(list);
  };
  const o: Order = {
    noodle: cx >= 3 && Math.random() < 0.12 ? null : favour(noodles),
    broth:
      cx >= 3 && Math.random() < 0.1
        ? null
        : sauces.length && Math.random() < 0.3
          ? favour(sauces)
          : favour(broths),
    thick: pick<Thick>(levelId === 1 ? ['orta'] : ['ince', 'orta', 'kalin']),
    reqs: [],
    rules: [],
    cook: 'perfect',
  };
  if (levelId >= 3 && Math.random() < 0.18) o.bowl = pick(BOWLS).id;
  if (levelId >= 4 && Math.random() < 0.3) o.cook = Math.random() < 0.5 ? 'dente' : 'soft';

  const roll = Math.random();
  if (cx >= 3 && roll < 0.14) {
    o.rules.push({ t: 'variety', n: 3 + Math.floor(Math.random() * 2) });
    return o;
  }
  const count = Math.min(
    tops.length,
    cx === 1
      ? 1 + Math.floor(Math.random() * 2)
      : 2 + Math.floor(Math.random() * (cx >= 3 ? 2 : 1.6))
  );
  const chosen: string[] = [];
  const freshTops = tops.filter((t) => fresh.includes(t));
  if (freshTops.length && Math.random() < 0.55) chosen.push(pick(freshTops));
  for (const t of shuffle(tops)) {
    if (chosen.length >= count) break;
    if (!chosen.includes(t)) chosen.push(t);
  }
  const veg = cx >= 3 && Math.random() < 0.15;
  for (const id of chosen) {
    if (veg && MEAT.includes(id)) continue;
    let mode: Mode;
    if (COUNTABLE.has(id)) {
      mode = Math.random() < 0.75 ? 'exact' : 'var';
    } else {
      mode = cx === 1 ? pick<Mode>(['var', 'bol']) : pick<Mode>(['var', 'bol', 'biraz']);
    }
    const r: Req = { id, mode };
    if (mode === 'exact') r.n = 1 + Math.floor(Math.random() * (cx === 1 ? 3 : 4));
    o.reqs.push(r);
  }
  if (veg) o.rules.push({ t: 'veg' });
  if (cx >= 2 && Math.random() < 0.22) {
    const no = tops.filter((t) => !chosen.includes(t));
    if (no.length) o.rules.push({ t: 'no', id: pick(no) });
  }
  if (cx >= 3 && un.includes('acili') && Math.random() < 0.15 && o.broth !== 'acili')
    o.rules.push({ t: 'spicy' });
  if (cx >= 2 && Math.random() < 0.12) o.rules.push({ t: 'free' });
  if (!o.reqs.length && !o.rules.length) o.reqs.push({ id: pick(tops), mode: 'var' });
  return o;
}

const GREETS = [
  'Merhaba şef!',
  'Selam! Kokusu sokağın başından geliyordu.',
  'İyi akşamlar!',
  'Açlıktan bayılmak üzereyim.',
  'Arkadaşım burayı çok övdü.',
  'Uzun bir gündü…',
  'Yağmurda en iyisi sıcak bir kase!',
  'Bugün kendimi şımartıyorum.',
  'Sınavdan çıktım, hak ettim.',
  'İlk defa geliyorum, heyecanlıyım!',
];

const PHONE_GREETS = [
  'Alo, Noddles mı?',
  'Alo! Paket servis var mı?',
  'Merhaba, sipariş vermek istiyorum.',
];

interface SpecialDef {
  at: number; // customer index in the day
  look: 'hana' | 'baron' | 'lezzetova';
  name: string;
  greet: string;
  text: string;
  order: Order;
  bonus: number;
  reactions: { great: string; ok: string; bad: string };
}

const SPECIALS: Record<number, SpecialDef[]> = {
  6: [
    {
      at: 3,
      look: 'baron',
      name: 'Silindir Şapkalı Bey',
      greet: 'Hmph. Burası mı meşhur dükkân?',
      text: 'Acılı tantan suyuyla bir ince ramen. Tam 3 dilim chashu, bol acı yağ ve yeşil soğan. Bakalım bu “efsane” neymiş.',
      order: {
        thick: 'ince',
        noodle: 'ramen',
        broth: 'acili',
        reqs: [
          { id: 'chashu', mode: 'exact', n: 3 },
          { id: 'aciyag', mode: 'bol' },
          { id: 'yesil', mode: 'var' },
        ],
        rules: [],
        cook: 'perfect',
      },
      bonus: 25,
      reactions: {
        great: '…Fena değil. Hiç de fena değil. (Şapkasını indirip yüzünü saklar.)',
        ok: 'Hmph. MegaNoodle bundan iyisini yapar.',
        bad: 'İşte! Ben demiştim, bu dükkân bitmiş!',
      },
    },
  ],
  7: [
    {
      at: 4,
      look: 'lezzetova',
      name: 'Madam Lezzetova',
      greet: 'Not defterim hazır, şekerim.',
      text: 'Miso suyuyla bir ince soba. Tam 4 parça tofu, 3 shiitake ve biraz yeşil soğan. Erişte diri kalsın. Kusursuz olsun.',
      order: {
        thick: 'ince',
        noodle: 'soba',
        broth: 'miso',
        reqs: [
          { id: 'tofu', mode: 'exact', n: 4 },
          { id: 'mantar', mode: 'exact', n: 3 },
          { id: 'yesil', mode: 'biraz' },
        ],
        rules: [],
        cook: 'dente',
      },
      bonus: 40,
      reactions: {
        great: 'Dürüst bir kase. Ruhu olan bir mutfak. Beş yıldız!',
        ok: 'İyi… ama unutulmaz değil. Üç yıldız.',
        bad: 'Hayal kırıklığı. Bunu yazmak zorundayım.',
      },
    },
  ],
  9: [
    {
      at: 2,
      look: 'hana',
      name: 'Hana Nine',
      greet: 'Bu sefer müşteri benim evladım.',
      text: 'Kemik suyuyla bir orta kalınlıkta ramen. 2 dilim chashu, 2 yumurta, bambu filizi ve bol yeşil soğan. Tam kıvamında. Sınav gibi düşün!',
      order: {
        thick: 'orta',
        noodle: 'ramen',
        broth: 'tonkotsu',
        reqs: [
          { id: 'chashu', mode: 'exact', n: 2 },
          { id: 'yumurta', mode: 'exact', n: 2 },
          { id: 'bambu', mode: 'var' },
          { id: 'yesil', mode: 'bol' },
        ],
        rules: [],
        cook: 'perfect',
      },
      bonus: 40,
      reactions: {
        great: 'İşte bu… benim kasem. Hayır, artık senin kasen.',
        ok: 'Güzel, ama bir şey eksik. Tekrar dene, sen yaparsın.',
        bad: 'Evladım… Defteri bir daha okumalısın.',
      },
    },
  ],
  10: [
    {
      at: 3,
      look: 'lezzetova',
      name: 'Madam Lezzetova',
      greet: 'Jüri başkanı olarak buradayım.',
      text: 'Kemik suyuyla bir kalın udon. Tam 2 tempura karides, 3 dilim naruto ve 2 yaprak nori. Şaşırt beni.',
      order: {
        thick: 'kalin',
        noodle: 'udon',
        broth: 'tonkotsu',
        reqs: [
          { id: 'karides', mode: 'exact', n: 2 },
          { id: 'naruto', mode: 'exact', n: 3 },
          { id: 'nori', mode: 'exact', n: 2 },
        ],
        rules: [],
        cook: 'perfect',
      },
      bonus: 40,
      reactions: {
        great: 'Jüri notu: on üzerinden on!',
        ok: 'Jüri notu: yedi. Fena değil.',
        bad: 'Jüri notu: üç. Üzgünüm.',
      },
    },
    {
      at: 8,
      look: 'baron',
      name: 'Baron Kraker',
      greet: '…Merhaba. Bu sefer kılık yok.',
      text: 'Soya suyuyla bir ince pirinç eriştesi. 1 yumurta, bol susam, biraz yeşil soğan ve 2 shiitake. Annemin yaptığı gibi. Sade. Lütfen.',
      order: {
        thick: 'ince',
        noodle: 'pirinc',
        broth: 'shoyu',
        reqs: [
          { id: 'yumurta', mode: 'exact', n: 1 },
          { id: 'susam', mode: 'bol' },
          { id: 'yesil', mode: 'biraz' },
          { id: 'mantar', mode: 'exact', n: 2 },
        ],
        rules: [],
        cook: 'perfect',
      },
      bonus: 60,
      reactions: {
        great: 'Annem… tam böyle yapardı. (Gözlerini siler.)',
        ok: 'Güzel. Ama annemin ki daha sıcaktı.',
        bad: 'Sanırım bazı tatlar geri gelmiyor.',
      },
    },
  ],
};

export function dayCustomers(levelId: number): Customer[] {
  const L = LEVELS[levelId - 1];
  const out: Customer[] = [];
  const specials = SPECIALS[levelId] ?? [];
  const phoneSlots = new Set<number>();
  while (phoneSlots.size < L.phone) {
    const i = 1 + Math.floor(Math.random() * (L.customers - 1));
    if (!specials.some((s) => s.at === i)) phoneSlots.add(i);
  }
  for (let i = 0; i < L.customers; i++) {
    const sp = specials.find((s) => s.at === i);
    if (sp) {
      out.push({
        id: i,
        name: sp.name,
        look: { ...randomLook(), special: sp.look },
        phone: false,
        special: sp.look,
        greet: sp.greet,
        text: sp.text,
        order: sp.order,
        bonus: sp.bonus,
        reactions: sp.reactions,
      });
      continue;
    }
    const order = randomOrder(levelId);
    const phone = phoneSlots.has(i);
    const look = randomLook();
    out.push({
      id: i,
      name: phone ? pick(ONLINE_NAMES) : pick(isFeminine(look) ? FEMALE : MALE),
      look,
      phone,
      greet: phone ? pick(PHONE_GREETS) : pick(GREETS),
      text: orderText(order),
      order,
      bonus: 0,
    });
  }
  return out;
}

// ---------- judging ----------

export interface Bowl {
  noodle?: string;
  thick?: Thick;
  style?: string;
  broth?: string;
  fill: number;
  pieces: Piece[];
  cook?: CookState;
}

export interface Verdict {
  score: number;
  price: number;
  tip: number;
  bonus: number;
  notes: string[];
  praise: string[];
}

export function cookStateAt(p: number): CookState {
  if (p < 42) return 'raw';
  if (p < 58) return 'dente';
  if (p < 80) return 'perfect';
  if (p < 100) return 'soft';
  return 'burnt';
}

export const COOK_LABEL: Record<CookState, string> = {
  raw: 'Çiğ',
  dente: 'Diri',
  perfect: 'Tam kıvam',
  soft: 'Yumuşak',
  burnt: 'Lapa',
};

function countOf(b: Bowl) {
  const m = new Map<string, number>();
  for (const p of b.pieces) m.set(p.id, (m.get(p.id) ?? 0) + 1);
  return m;
}

export function judge(o: Order, b: Bowl, waitSec: number, bonus: number): Verdict {
  const notes: string[] = [];
  const praise: string[] = [];
  let score = 0;
  // noodle 20
  if (!b.noodle) notes.push('Erişte yok!');
  else if (o.noodle && b.noodle !== o.noodle)
    notes.push(`${INGREDIENTS[o.noodle].name} istemiştim`);
  else score += 20;
  if (b.noodle && o.thick && b.thick !== o.thick) {
    score -= 8;
    notes.push(`${THICK_LABEL[o.thick]} erişte istemiştim`);
  }
  if (o.bowl && (b.style ?? 'kirmizi') !== o.bowl) {
    score -= 8;
    notes.push(`${bowlStyle(o.bowl).name} kase istemiştim`);
  }
  // broth 15 + fill 10
  const wantCat = o.broth ? INGREDIENTS[o.broth].cat : 'broth';
  if (!b.broth || b.fill < 0.15) notes.push(wantCat === 'sauce' ? 'Sos yok!' : 'Su yok!');
  else if (o.broth && b.broth !== o.broth) notes.push(`${INGREDIENTS[o.broth].name} istemiştim`);
  else score += 15;
  if (b.broth) {
    if (b.fill >= 0.72 && b.fill <= 1.03) {
      score += 10;
    } else if (b.fill > 1.03) {
      score += 3;
      notes.push(INGREDIENTS[b.broth].cat === 'sauce' ? 'Sos çok fazla' : 'Su taşmış');
    } else if (b.fill >= 0.45) {
      score += 5;
      notes.push(INGREDIENTS[b.broth].cat === 'sauce' ? 'Sos az kalmış' : 'Su az kalmış');
    } else notes.push('Neredeyse su yok');
  }
  // toppings 35
  const cnt = countOf(b);
  const reqIds = new Set(o.reqs.map((r) => r.id));
  let topScore = 0;
  if (o.reqs.length) {
    let sum = 0;
    for (const r of o.reqs) {
      const have = cnt.get(r.id) ?? 0;
      const name = INGREDIENTS[r.id].name;
      let v = 0;
      if (r.mode === 'exact') {
        const n = r.n ?? 1;
        v = have === n ? 1 : Math.max(0, 1 - Math.abs(have - n) / n);
        if (have === 0) notes.push(`${name} yok`);
        else if (have < n) notes.push(`${name} eksik (${have}/${n})`);
        else if (have > n) notes.push(`${name} fazla (${have}/${n})`);
      } else if (r.mode === 'bol') {
        v = Math.min(1, have / 6);
        if (have === 0) notes.push(`${name} yok`);
        else if (have < 6) notes.push(`Daha bol ${name.toLocaleLowerCase('tr')} olmalıydı`);
      } else if (r.mode === 'biraz') {
        v = have === 0 ? 0 : have <= 3 ? 1 : Math.max(0.4, 1 - (have - 3) * 0.15);
        if (have === 0) notes.push(`${name} yok`);
        else if (have > 3) notes.push(`${name} biraz fazla`);
      } else {
        v = have > 0 ? 1 : 0;
        if (!have) notes.push(`${name} yok`);
      }
      sum += v;
    }
    topScore = (35 * sum) / o.reqs.length;
  } else {
    topScore = cnt.size >= 2 ? 35 : cnt.size * 15;
  }
  const allowExtra = o.rules.some((r) => r.t === 'free' || r.t === 'variety');
  if (!allowExtra) {
    const extras = [...cnt.keys()].filter((k) => !reqIds.has(k));
    if (extras.length) {
      topScore -= Math.min(24, extras.length * 8);
      notes.push(`İstemediğim şeyler var (${extras.map((e) => INGREDIENTS[e].name).join(', ')})`);
    }
  }
  score += Math.max(0, topScore);
  for (const r of o.rules) {
    if (r.t === 'no' && (cnt.get(r.id) ?? 0) > 0) {
      score -= 30;
      notes.push(`${INGREDIENTS[r.id].name} olmasın demiştim!`);
    }
    if (r.t === 'veg' && MEAT.some((m) => cnt.has(m))) {
      score -= 30;
      notes.push('Et yemiyorum demiştim!');
    }
    if (r.t === 'spicy') {
      const spicy =
        b.broth === 'acili' || cnt.has('aciyag') || cnt.has('biber') || cnt.has('kimchi');
      if (!spicy) {
        score -= 20;
        notes.push('Hiç acı değil!');
      } else praise.push('Tam istediğim gibi acı!');
    }
    if (r.t === 'variety') {
      if (cnt.size < r.n) {
        score -= 10 * (r.n - cnt.size);
        notes.push(`${r.n} çeşit istemiştim`);
      } else praise.push('Rengârenk olmuş!');
    }
  }
  // cook 20
  const cs = b.cook ?? 'raw';
  const want: CookState = o.cook;
  const order: CookState[] = ['raw', 'dente', 'perfect', 'soft', 'burnt'];
  const d = Math.abs(order.indexOf(cs) - order.indexOf(want));
  if (cs === 'burnt') notes.push('Erişte lapa olmuş');
  else if (cs === 'raw') notes.push('Erişte çiğ kalmış');
  else if (d === 0) {
    score += 20;
    praise.push(want === 'perfect' ? 'Erişte tam kıvamında!' : 'Erişte tam istediğim gibi!');
  } else if (d === 1) {
    score += 10;
    notes.push(
      want === 'dente'
        ? 'Erişte biraz fazla pişmiş'
        : want === 'soft'
          ? 'Biraz daha yumuşak olmalıydı'
          : `Erişte ${COOK_LABEL[cs].toLocaleLowerCase('tr')} olmuş`
    );
  }
  // distribution bonus/penalty
  const tp = b.pieces;
  if (tp.length >= 4) {
    const cx = tp.reduce((s, p) => s + p.x, 0) / tp.length;
    const cy = tp.reduce((s, p) => s + p.y, 0) / tp.length;
    const off = Math.hypot(cx - 150, cy - 150);
    if (off > 55) {
      score -= 5;
      notes.push('Malzemeler bir kenara yığılmış');
    } else if (off < 25) praise.push('Malzemeler çok güzel dağılmış');
  }
  if (waitSec > 75) {
    score -= Math.min(10, (waitSec - 75) / 6);
    notes.push('Biraz uzun sürdü');
  }
  score = Math.round(Math.max(0, Math.min(100, score)));
  if (score >= 95 && !praise.length) praise.push('Kusursuz!');
  const price =
    3 +
    (o.noodle ? INGREDIENTS[o.noodle].price : 5) +
    (o.broth ? INGREDIENTS[o.broth].price : 4) +
    o.reqs.reduce((s, r) => s + INGREDIENTS[r.id].price, 0) +
    (allowExtra ? 4 : 0);
  const pay = Math.round(price * (score >= 50 ? 1 : score >= 25 ? 0.6 : 0.3));
  const tipRate =
    score >= 95 ? 0.8 : score >= 85 ? 0.55 : score >= 70 ? 0.3 : score >= 55 ? 0.1 : 0;
  return {
    score,
    price: pay,
    tip: Math.round(price * tipRate),
    bonus: score >= 85 ? bonus : 0,
    notes,
    praise,
  };
}

export function reactionLine(c: Customer, v: Verdict): string {
  if (c.reactions)
    return v.score >= 85 ? c.reactions.great : v.score >= 55 ? c.reactions.ok : c.reactions.bad;
  if (v.score >= 95)
    return pick([
      'Bu hayatımda yediğim en iyi noodle!',
      'Aşık oldum! Her gün geleceğim!',
      'Mükemmel! Ellerine sağlık şef!',
    ]);
  if (v.score >= 80)
    return pick(['Çok lezzetli, teşekkürler!', 'Harika olmuş!', 'Tam aradığım tat!']);
  if (v.score >= 55) return pick(['Fena değil.', 'İdare eder.', 'Güzel ama…']);
  if (v.score >= 30) return pick(['Hmm… ben bunu istememiştim.', 'Bu biraz farklı olmuş.']);
  return pick(['Bu ne böyle?!', 'Bir daha gelmem!', 'Ciddi misin şef?']);
}

export function starsFor(avg: number) {
  return avg >= 90 ? 3 : avg >= 75 ? 2 : avg >= 55 ? 1 : 0;
}
