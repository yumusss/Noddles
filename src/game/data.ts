// Static content for Yuki Sushi: ingredients, plates, the animal cast, 10 five-minute days, decor.

import type { L } from './i18n';

export type IngId =
  | 'rice'
  | 'salmon'
  | 'tuna'
  | 'tamago'
  | 'ebi'
  | 'unagi'
  | 'wasabi'
  | 'ginger'
  | 'soy'
  | 'nori'
  | 'cucumber'
  | 'avocado'
  | 'crab'
  | 'creamcheese'
  | 'tempura'
  | 'sesame'
  | 'tobiko'
  | 'scallion'
  | 'spicymayo'
  | 'unagisauce'
  | 'noriband'
  | 'shrimp'
  | 'eel';

export type IngRole = 'base' | 'neta' | 'side' | 'topping' | 'filling';

export interface Ingredient {
  id: IngId;
  name: L;
  roles: IngRole[];
  cost: number;
  fish?: boolean;
}

const I = (
  id: IngId,
  tr: string,
  en: string,
  roles: IngRole[],
  cost: number,
  fish = false
): Ingredient => ({
  id,
  name: { tr, en },
  roles,
  cost,
  fish,
});

export const ING: Record<IngId, Ingredient> = {
  rice: I('rice', 'Sushi pirinci', 'Sushi rice', ['base'], 1),
  salmon: I('salmon', 'Somon', 'Salmon', ['neta', 'filling'], 3, true),
  tuna: I('tuna', 'Ton balığı', 'Tuna', ['neta', 'filling'], 3, true),
  tamago: I('tamago', 'Tamago', 'Tamago', ['neta', 'filling'], 1),
  ebi: I('ebi', 'Karides', 'Shrimp', ['neta', 'filling'], 2, true),
  wasabi: I('wasabi', 'Wasabi', 'Wasabi', ['side'], 0.5),
  ginger: I('ginger', 'Zencefil', 'Ginger', ['side'], 0.5),
  soy: I('soy', 'Soya sosu', 'Soy sauce', ['side'], 0.5),
  nori: I('nori', 'Nori', 'Nori', ['base'], 1),
  cucumber: I('cucumber', 'Salatalık', 'Cucumber', ['filling'], 0.5),
  avocado: I('avocado', 'Avokado', 'Avocado', ['filling'], 1.5),
  crab: I('crab', 'Yengeç', 'Crab', ['filling'], 2, true),
  creamcheese: I('creamcheese', 'Krem peynir', 'Cream cheese', ['filling'], 1),
  sesame: I('sesame', 'Susam', 'Sesame', ['topping'], 0.3),
  tobiko: I('tobiko', 'Tobiko', 'Tobiko', ['topping'], 1.5, true),
  scallion: I('scallion', 'Taze soğan', 'Scallion', ['topping'], 0.3),
  spicymayo: I('spicymayo', 'Acı mayo', 'Spicy mayo', ['topping'], 0.5),
  noriband: I('noriband', 'Nori kuşağı', 'Nori belt', ['topping'], 0.3),
  // kept for the drawing code, not used in this game
  unagi: I('unagi', 'Unagi', 'Eel', [], 4, true),
  tempura: I('tempura', 'Tempura', 'Tempura', [], 3, true),
  unagisauce: I('unagisauce', 'Unagi sosu', 'Eel sauce', [], 0.5),
  shrimp: I('shrimp', 'Karides', 'Shrimp', [], 2, true),
  eel: I('eel', 'Yılan balığı', 'Eel', [], 3, true),
};

export type PlateId = 'geta' | 'slate' | 'porcelain' | 'celadon' | 'sakura' | 'box';
export interface Plate {
  id: PlateId;
  name: L;
  unlockDay: number;
}
export const PLATES: Plate[] = [
  { id: 'geta', name: { tr: 'Ahşap geta', en: 'Wooden geta' }, unlockDay: 1 },
  { id: 'slate', name: { tr: 'Kayrak', en: 'Slate' }, unlockDay: 5 },
  { id: 'porcelain', name: { tr: 'Porselen', en: 'Porcelain' }, unlockDay: 9 },
];

// ---------- cast ----------

export type Species =
  | 'penguin'
  | 'seal'
  | 'otter'
  | 'bear'
  | 'arcticfox'
  | 'hare'
  | 'puffin'
  | 'redpanda'
  | 'tanuki'
  | 'owl'
  | 'walrus'
  | 'reindeer'
  | 'fox'
  | 'gull';

/** species that walk in as everyday customers */
export const CUSTOMER_SPECIES: Species[] = [
  'penguin',
  'seal',
  'otter',
  'bear',
  'arcticfox',
  'hare',
  'puffin',
  'redpanda',
  'tanuki',
  'reindeer',
];

export const SPECIES_NAME: Record<Species, L> = {
  penguin: { tr: 'Penguen', en: 'Penguin' },
  seal: { tr: 'Fok', en: 'Seal' },
  otter: { tr: 'Su samuru', en: 'Otter' },
  bear: { tr: 'Kutup ayısı', en: 'Polar bear' },
  arcticfox: { tr: 'Kutup tilkisi', en: 'Arctic fox' },
  hare: { tr: 'Kar tavşanı', en: 'Snow hare' },
  puffin: { tr: 'Deniz papağanı', en: 'Puffin' },
  redpanda: { tr: 'Kızıl panda', en: 'Red panda' },
  tanuki: { tr: 'Rakun köpeği', en: 'Tanuki' },
  owl: { tr: 'Kar baykuşu', en: 'Snowy owl' },
  walrus: { tr: 'Mors', en: 'Walrus' },
  reindeer: { tr: 'Ren geyiği', en: 'Reindeer' },
  fox: { tr: 'Tilki', en: 'Fox' },
  gull: { tr: 'Martı', en: 'Seagull' },
};

export type Speaker = 'tusk' | 'pip' | 'hazel' | 'squawk' | 'bulut' | 'hoot';
export const SPEAKERS: Record<Speaker, L> = {
  tusk: { tr: 'Mors Dede', en: 'Grandpa Tusk' },
  pip: { tr: 'Pıtırcık', en: 'Pip' },
  hazel: { tr: 'Fındık', en: 'Hazel' },
  squawk: { tr: 'Kaptan Gak', en: 'Captain Squawk' },
  bulut: { tr: 'Bulut', en: 'Cloud' },
  hoot: { tr: 'Baykuş Hanım', en: 'Madame Hoot' },
};
export const SPEAKER_SPECIES: Record<Speaker, Species> = {
  tusk: 'walrus',
  pip: 'penguin',
  hazel: 'fox',
  squawk: 'gull',
  bulut: 'bear',
  hoot: 'owl',
};

export interface Line {
  who: Speaker;
  text: L;
}

export interface SpecialGuest {
  who: Speaker;
  /** fraction of the day when they arrive (they take the next free turn) */
  at: number;
  greet: L;
  order: string;
  bonus: number;
}

// ---------- the ten days ----------

export type TimeOfDay = 'morning' | 'noon' | 'sunset' | 'evening';

export interface Day {
  n: number;
  title: L;
  time: TimeOfDay;
  snow: 'light' | 'storm' | 'none';
  /** real seconds — every day is five minutes */
  duration: number;
  /** patience in seconds */
  patience: number;
  /** order complexity tier 1..6 */
  tier: number;
  unlock: IngId[];
  plates?: PlateId[];
  maki?: boolean;
  sashimi?: boolean;
  torch?: boolean;
  online?: boolean;
  guests?: SpecialGuest[];
  /** a short line under the day on the map: what's new */
  news: L;
  intro: Line[];
  outro: Line[];
  rent: number;
}

export const DAY_SECONDS = 300;

const D = (d: Omit<Day, 'duration'>): Day => ({ ...d, duration: DAY_SECONDS });

export const DAYS: Day[] = [
  D({
    n: 1,
    title: { tr: 'Karlı Liman', en: 'Snowy Harbor' },
    time: 'morning',
    snow: 'light',
    patience: 999,
    tier: 1,
    unlock: ['rice', 'salmon', 'wasabi', 'soy'],
    rent: 15,
    news: { tr: 'Somon nigiri', en: 'Salmon nigiri' },
    intro: [
      {
        who: 'tusk',
        text: {
          tr: 'Hoş geldin evlat! Kırk kış bu kulübede sushi yaptım. Ama yüzgeçlerim artık bu soğuğa dayanmıyor.',
          en: 'Welcome, kiddo! Forty winters I made sushi in this hut. But my flippers can’t take the cold anymore.',
        },
      },
      {
        who: 'pip',
        text: {
          tr: 'Ben Pıtırcık! Tezgâhın yardımcısıyım. Bugün sana her şeyi adım adım göstereceğim!',
          en: 'I’m Pip! The counter helper. Today I’ll show you everything, step by step!',
        },
      },
      {
        who: 'hazel',
        text: {
          tr: 'Selam! Ben Fındık, Nefis uygulamasını ben yaptım. Yuki Sushi’nin puanı şu an 2,3 yıldız… Epey düşük.',
          en: 'Hi! I’m Hazel, I made the Yumm app. Yuki Sushi is rated 2.3 stars right now… pretty low.',
        },
      },
      {
        who: 'squawk',
        text: {
          tr: 'GAK! Kar Festivali’ne kadar puanınız 4,2 olmazsa bu kulübe benim! Yerine Gak Gak Balık-Patates açacağım!',
          en: 'SQUAWK! If your rating isn’t 4.2 by the Snow Festival, this hut is mine! I’ll open Squawk’s Fish & Chips!',
        },
      },
      {
        who: 'tusk',
        text: {
          tr: 'Kulak asma o martıya. Her müşteriyi mutlu et, gerisi gelir. Hadi, pencereyi aç!',
          en: 'Don’t mind that gull. Make every customer happy and the rest will follow. Go on, open the window!',
        },
      },
    ],
    outro: [
      {
        who: 'pip',
        text: {
          tr: 'İlk gün bitti! Tablete bak: yeni yorumlar geldi. Her yorum puanı değiştiriyor.',
          en: 'First day done! Check the tablet: new reviews came in. Every review moves the rating.',
        },
      },
    ],
  }),
  D({
    n: 2,
    title: { tr: 'Buzlu iskele', en: 'The icy pier' },
    time: 'morning',
    snow: 'none',
    patience: 90,
    tier: 1,
    unlock: ['tuna', 'ginger'],
    rent: 15,
    news: { tr: 'Ton balığı, zencefil', en: 'Tuna, ginger' },
    intro: [
      {
        who: 'bulut',
        text: {
          tr: 'Günaydın! Ben Bulut. Buzun altından ton balığı tuttum, kulübeye getirdim. Karşılığında… bir tabak sushi?',
          en: 'Morning! I’m Cloud. Caught some tuna under the ice and brought it over. In return… a plate of sushi?',
        },
      },
      {
        who: 'pip',
        text: {
          tr: 'Bugünden itibaren müşteriler sabırsız. Sipariş kartının altındaki çizgiye dikkat!',
          en: 'From today customers get impatient. Watch the bar under the order card!',
        },
      },
    ],
    outro: [
      {
        who: 'tusk',
        text: {
          tr: 'Müşterilerle konuşmayı unutma. Güzel bir söz, soğuk bir günü ısıtır.',
          en: 'Don’t forget to talk to your customers. A kind word warms a cold day.',
        },
      },
    ],
  }),
  D({
    n: 3,
    title: { tr: 'Dedemin hasırı', en: 'Grandpa’s mat' },
    time: 'noon',
    snow: 'light',
    patience: 95,
    tier: 2,
    unlock: ['nori', 'cucumber'],
    maki: true,
    rent: 16,
    news: { tr: 'Hoso maki (hasır)', en: 'Hosomaki (bamboo mat)' },
    intro: [
      {
        who: 'tusk',
        text: {
          tr: 'Bu bambu hasır benden de yaşlı. Nori koy, pirinci yay, salatalığı ortaya diz… ve sar!',
          en: 'This bamboo mat is older than me. Lay the nori, spread the rice, line up the cucumber… and roll!',
        },
      },
      {
        who: 'pip',
        text: {
          tr: 'Tezgâhın altındaki “Hasır”a dokun. Çok hızlı sararsan rulo dağılır, dikkat!',
          en: 'Tap “Mat” under the counter. Roll too fast and it falls apart, careful!',
        },
      },
    ],
    outro: [
      {
        who: 'hazel',
        text: {
          tr: 'Nefis’te biri “Maki’ler çok düzgün!” yazmış. Puan yavaş yavaş kıpırdıyor!',
          en: 'Someone on Yumm wrote “The maki are so neat!” The rating is starting to move!',
        },
      },
    ],
  }),
  D({
    n: 4,
    title: { tr: 'Ayının iştahı', en: 'A bear’s appetite' },
    time: 'noon',
    snow: 'none',
    patience: 90,
    tier: 2,
    unlock: ['avocado'],
    sashimi: true,
    rent: 16,
    news: { tr: 'Sashimi, avokado', en: 'Sashimi, avocado' },
    guests: [
      {
        who: 'bulut',
        at: 0.45,
        greet: {
          tr: 'Ben geldim! Beş tane kalın somon sashimi. Kalın ama, ayı kalınlığında!',
          en: 'It’s me! Five thick salmon sashimi. Thick, bear-sized thick!',
        },
        order: 'bear-sashimi',
        bonus: 15,
      },
    ],
    intro: [
      {
        who: 'tusk',
        text: {
          tr: 'Sashimi pirinçsizdir, sadece balık. Bıçağın doğru anda inerse dilim ince, tam ya da kalın olur.',
          en: 'Sashimi is just fish, no rice. Drop the knife at the right moment for thin, regular or thick slices.',
        },
      },
    ],
    outro: [
      {
        who: 'bulut',
        text: {
          tr: 'Mmm! Bunu bütün iskeleye anlatacağım. Nefis’e beş yıldız bırakıyorum!',
          en: 'Mmm! I’m telling the whole pier. Leaving five stars on Yumm!',
        },
      },
    ],
  }),
  D({
    n: 5,
    title: { tr: 'Yorumlara cevap', en: 'Answering reviews' },
    time: 'sunset',
    snow: 'light',
    patience: 85,
    tier: 3,
    unlock: ['tamago', 'noriband', 'sesame'],
    plates: ['slate'],
    rent: 17,
    news: {
      tr: 'Tamago, kayrak tabak, “olmasın” istekleri',
      en: 'Tamago, slate plate, “no …” requests',
    },
    intro: [
      {
        who: 'hazel',
        text: {
          tr: 'Bir ipucu: Nefis’te kötü yorumlara nazikçe cevap verirsen bazıları puanını düzeltir. Kaba cevap verirsen… tersi olur.',
          en: 'A tip: reply kindly to bad reviews on Yumm and some will raise their score. Reply rudely and… the opposite.',
        },
      },
      {
        who: 'pip',
        text: {
          tr: 'Artık “wasabi olmasın” diyenler var. Kartta kırmızı yazar, iyi oku!',
          en: 'Now some say “no wasabi”. It’s written in red on the card, read carefully!',
        },
      },
    ],
    outro: [
      {
        who: 'tusk',
        text: {
          tr: 'Gün batımında liman ne güzel, değil mi? Bu kulübeyi o martıya bırakmayalım.',
          en: 'The harbor is lovely at sunset, isn’t it? Let’s not leave this hut to that gull.',
        },
      },
    ],
  }),
  D({
    n: 6,
    title: { tr: 'Kar fırtınası', en: 'Snowstorm' },
    time: 'noon',
    snow: 'storm',
    patience: 85,
    tier: 3,
    unlock: ['crab', 'tobiko'],
    rent: 17,
    news: { tr: 'Ura maki, yengeç, tobiko', en: 'Uramaki, crab, tobiko' },
    guests: [
      {
        who: 'squawk',
        at: 0.5,
        greet: {
          tr: 'Gak! Ben… ehem… sıradan bir müşteriyim. Bir ura maki: yengeçli, avokadolu, dışı susamlı. Hata ararım!',
          en: 'Squawk! I’m… ahem… a regular customer. One uramaki: crab, avocado, sesame outside. I WILL find a mistake!',
        },
        order: 'gull-ura',
        bonus: 25,
      },
    ],
    intro: [
      {
        who: 'tusk',
        text: {
          tr: 'Fırtınada az müşteri gelir ama gelenler sıcak bir tabak ister. Bugün ura maki: pirinç dışarıda!',
          en: 'Few come in a storm, but those who do want a warm plate. Today: uramaki, rice on the outside!',
        },
      },
    ],
    outro: [
      {
        who: 'hazel',
        text: {
          tr: 'Kaptan Gak kılık değiştirip gelmiş! Kötü yorum yazmaya çalıştı ama tabak o kadar iyiydi ki…',
          en: 'Captain Squawk came in disguise! He tried to post a bad review, but the plate was so good…',
        },
      },
    ],
  }),
  D({
    n: 7,
    title: { tr: 'Alevli somon', en: 'Flame-kissed salmon' },
    time: 'sunset',
    snow: 'none',
    patience: 80,
    tier: 4,
    unlock: ['scallion', 'spicymayo'],
    torch: true,
    rent: 18,
    news: { tr: 'Aburi (pürmüz), acı mayo', en: 'Aburi (torch), spicy mayo' },
    intro: [
      {
        who: 'tusk',
        text: {
          tr: 'Aburi: somonun üstünü pürmüzle hafifçe yak. Basılı tut, kadran yeşildeyken bırak. Fazlası kömür olur!',
          en: 'Aburi: lightly sear the top of the salmon with a torch. Hold, let go when the dial is green. Any more and it’s charcoal!',
        },
      },
    ],
    outro: [
      {
        who: 'pip',
        text: {
          tr: 'Kulübe mis gibi yanık somon kokuyor. Yarın tablet de çalacak, hazır ol!',
          en: 'The hut smells of seared salmon. Tomorrow the tablet will ring too, get ready!',
        },
      },
    ],
  }),
  D({
    n: 8,
    title: { tr: 'Tablet çalıyor', en: 'The tablet rings' },
    time: 'noon',
    snow: 'light',
    patience: 80,
    tier: 4,
    unlock: ['creamcheese'],
    online: true,
    rent: 18,
    news: { tr: 'Online siparişler, krem peynir', en: 'Online orders, cream cheese' },
    intro: [
      {
        who: 'hazel',
        text: {
          tr: 'Nefis’e sipariş özelliği ekledim! Tablet çalınca siparişi al, paket kutusuna hazırla, kızak kurye götürsün.',
          en: 'I added ordering to Yumm! When the tablet rings, take the order, pack it in a box, and the sled courier delivers it.',
        },
      },
    ],
    outro: [
      {
        who: 'hazel',
        text: {
          tr: 'Paket yorumları da puana sayılıyor. Kaptan Gak’ın büfesine kimse sipariş vermemiş, hi hi!',
          en: 'Delivery reviews count toward the rating too. Nobody ordered from Squawk’s stand, hee hee!',
        },
      },
    ],
  }),
  D({
    n: 9,
    title: { tr: 'Eleştirmenin gözü', en: 'The critic’s eye' },
    time: 'evening',
    snow: 'light',
    patience: 80,
    tier: 5,
    unlock: ['ebi'],
    plates: ['porcelain'],
    rent: 19,
    news: { tr: 'Futo maki, karides, porselen tabak', en: 'Futomaki, shrimp, porcelain plate' },
    guests: [
      {
        who: 'hoot',
        at: 0.5,
        greet: {
          tr: 'Hu-hu. Baykuş Hanım, Kuzey Gazetesi. Porselen tabakta: iki aburi somon, iki karides nigiri ve zencefil. Wasabi istemem.',
          en: 'Hoo-hoo. Madame Hoot, Northern Gazette. On porcelain: two aburi salmon, two shrimp nigiri and ginger. No wasabi.',
        },
        order: 'owl-plate',
        bonus: 35,
      },
    ],
    intro: [
      {
        who: 'tusk',
        text: {
          tr: 'Futo maki kalın bir rulodur, en az üç malzeme ister. Bu gece de eleştirmen geliyor; gözünü dört aç.',
          en: 'Futomaki is a fat roll with at least three fillings. And tonight a critic is coming; stay sharp.',
        },
      },
    ],
    outro: [
      {
        who: 'hoot',
        text: {
          tr: '“Karlı Liman’ın saklı hazinesi.” Yarınki gazeteye böyle yazacağım. Hu-hu.',
          en: '“Snowy Harbor’s hidden treasure.” That’s what tomorrow’s paper will say. Hoo-hoo.',
        },
      },
    ],
  }),
  D({
    n: 10,
    title: { tr: 'Kar Festivali', en: 'Snow Festival' },
    time: 'evening',
    snow: 'light',
    patience: 85,
    tier: 6,
    unlock: [],
    rent: 20,
    news: {
      tr: 'Final: kuzey ışıkları, büyük siparişler',
      en: 'Finale: northern lights, big orders',
    },
    guests: [
      {
        who: 'hazel',
        at: 0.6,
        greet: {
          tr: 'Festival tabağı benden! Kayrakta: altı ura maki (somon, avokado, dışı tobiko) ve iki tamago. Soya sosu da lütfen!',
          en: 'Festival plate’s on me! On slate: six uramaki (salmon, avocado, tobiko outside) and two tamago. Soy sauce too, please!',
        },
        order: 'fox-festival',
        bonus: 40,
      },
    ],
    intro: [
      {
        who: 'tusk',
        text: {
          tr: 'Bu gece kuzey ışıkları var ve bütün liman burada. Gün sonunda Nefis puanı belli olacak.',
          en: 'Northern lights tonight and the whole harbor is here. At the end of the day the Yumm rating decides.',
        },
      },
      {
        who: 'squawk',
        text: {
          tr: 'Gak gak! Kâğıtlar hazır, imzalamak için bekliyorum!',
          en: 'Squawk squawk! The papers are ready, I’m waiting to sign!',
        },
      },
    ],
    outro: [],
  }),
];

export const TOTAL_DAYS = DAYS.length;
export const GOAL_RATING = 4.2;

export function dayDef(n: number): Day {
  return DAYS[Math.max(1, Math.min(n, DAYS.length)) - 1];
}

export function unlockedIngs(n: number): Set<IngId> {
  const s = new Set<IngId>();
  for (const d of DAYS) if (d.n <= n) d.unlock.forEach((i) => s.add(i));
  return s;
}
export function unlockedPlates(n: number): PlateId[] {
  return PLATES.filter((p) => p.unlockDay <= n).map((p) => p.id);
}
export const firstDay = (k: 'maki' | 'sashimi' | 'torch' | 'online') =>
  DAYS.find((d) => d[k])?.n ?? 99;

/** the finale: the outro depends on the Yumm rating */
export function finaleLines(rating: number): Line[] {
  if (rating >= GOAL_RATING)
    return [
      {
        who: 'hazel',
        text: {
          tr: `Nefis puanı: ${rating.toFixed(1).replace('.', ',')} yıldız! Hedef geçildi! Yuki Sushi limanın en sevilen yeri oldu!`,
          en: `Yumm rating: ${rating.toFixed(1)} stars! Goal beaten! Yuki Sushi is the harbor’s favorite spot!`,
        },
      },
      {
        who: 'squawk',
        text: {
          tr: 'Gak… peki, kaybettim. Ama… bir tabak somon nigiri alabilir miyim? Wasabisiz.',
          en: 'Squawk… fine, I lost. But… could I get a plate of salmon nigiri? No wasabi.',
        },
      },
      {
        who: 'tusk',
        text: {
          tr: 'Aferin evlat. Kulübe artık gerçekten senin. Kırk kış daha!',
          en: 'Well done, kiddo. The hut is truly yours now. Forty more winters!',
        },
      },
    ];
  return [
    {
      who: 'hazel',
      text: {
        tr: `Nefis puanı: ${rating.toFixed(1).replace('.', ',')} yıldız. Hedef ${GOAL_RATING.toFixed(1).replace('.', ',')}… az kaldı!`,
        en: `Yumm rating: ${rating.toFixed(1)} stars. The goal is ${GOAL_RATING.toFixed(1)}… so close!`,
      },
    },
    {
      who: 'tusk',
      text: {
        tr: 'Üzülme. Festivali bir kez daha oynayabilirsin; yorumlara cevap vermeyi ve müşterilerle konuşmayı unutma.',
        en: 'Don’t worry. You can play the festival again; remember to answer reviews and talk to your customers.',
      },
    },
  ];
}

// ---------- decor for the hut ----------

export type DecorSlot = 'awning' | 'lantern' | 'charm' | 'plant';
export interface DecorItem {
  id: string;
  slot: DecorSlot;
  name: L;
  price: number;
  tip: number;
}
export const DECOR: DecorItem[] = [
  {
    id: 'awning-indigo',
    slot: 'awning',
    name: { tr: 'Lacivert perde', en: 'Indigo awning' },
    price: 0,
    tip: 0,
  },
  {
    id: 'awning-coral',
    slot: 'awning',
    name: { tr: 'Mercan perde', en: 'Coral awning' },
    price: 120,
    tip: 3,
  },
  {
    id: 'awning-matcha',
    slot: 'awning',
    name: { tr: 'Matcha perde', en: 'Matcha awning' },
    price: 160,
    tip: 4,
  },
  {
    id: 'lantern-paper',
    slot: 'lantern',
    name: { tr: 'Kâğıt fener', en: 'Paper lanterns' },
    price: 0,
    tip: 0,
  },
  {
    id: 'lantern-fish',
    slot: 'lantern',
    name: { tr: 'Balık fenerler', en: 'Fish lanterns' },
    price: 140,
    tip: 3,
  },
  {
    id: 'lantern-star',
    slot: 'lantern',
    name: { tr: 'Yıldız ışıklar', en: 'Star lights' },
    price: 200,
    tip: 5,
  },
  { id: 'charm-none', slot: 'charm', name: { tr: 'Süs yok', en: 'No charm' }, price: 0, tip: 0 },
  {
    id: 'charm-cat',
    slot: 'charm',
    name: { tr: 'Maneki-neko', en: 'Lucky cat' },
    price: 100,
    tip: 2,
  },
  {
    id: 'charm-daruma',
    slot: 'charm',
    name: { tr: 'Daruma bebeği', en: 'Daruma doll' },
    price: 150,
    tip: 3,
  },
  { id: 'plant-none', slot: 'plant', name: { tr: 'Bitki yok', en: 'No plant' }, price: 0, tip: 0 },
  {
    id: 'plant-pine',
    slot: 'plant',
    name: { tr: 'Minik çam', en: 'Little pine' },
    price: 90,
    tip: 2,
  },
  {
    id: 'plant-camellia',
    slot: 'plant',
    name: { tr: 'Kamelya', en: 'Camellia' },
    price: 170,
    tip: 4,
  },
];
export const DECOR_SLOTS: { slot: DecorSlot; name: L }[] = [
  { slot: 'awning', name: { tr: 'Perde', en: 'Awning' } },
  { slot: 'lantern', name: { tr: 'Işıklar', en: 'Lights' } },
  { slot: 'charm', name: { tr: 'Uğur', en: 'Charm' } },
  { slot: 'plant', name: { tr: 'Bitki', en: 'Plant' } },
];

// ---------- names ----------

export const NAMES_TR = [
  'Pamuk',
  'Fıstık',
  'Kartopu',
  'Minnoş',
  'Bıdık',
  'Lokum',
  'Tarçın',
  'Zeytin',
  'Poğaça',
  'Badem',
  'Kestane',
  'Boncuk',
  'Mısır',
  'Pufidik',
  'Çilek',
  'Kurabiye',
];
export const NAMES_EN = [
  'Snowball',
  'Peanut',
  'Biscuit',
  'Maple',
  'Pebble',
  'Muffin',
  'Cinnamon',
  'Olive',
  'Pretzel',
  'Almond',
  'Chestnut',
  'Button',
  'Popcorn',
  'Puffin',
  'Berry',
  'Cookie',
];
