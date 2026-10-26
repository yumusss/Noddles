// Static game content: ingredients, plates, decor and the 50-day calendar.
// Phase 1 ships days 1–10 fully playable; days 11–50 are on the map as "coming soon".

import type { L } from './i18n';

export type IngId =
  | 'rice'
  | 'salmon'
  | 'tuna'
  | 'tamago'
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

export type IngRole = 'base' | 'neta' | 'side' | 'topping' | 'filling' | 'heat';

export interface Ingredient {
  id: IngId;
  name: L;
  /** where it lives: prep counter tub, rolling board chip, heat station */
  roles: IngRole[];
  cost: number;
  /** fish/meat → not vegetarian */
  fish?: boolean;
  /** cooked at the heat station; becomes a prepared tub */
  cookedFrom?: IngId;
}

export const ING: Record<IngId, Ingredient> = {
  rice: { id: 'rice', name: { tr: 'Sushi pirinci', en: 'Sushi rice' }, roles: ['base'], cost: 1 },
  salmon: {
    id: 'salmon',
    name: { tr: 'Somon', en: 'Salmon' },
    roles: ['neta', 'filling'],
    cost: 3,
    fish: true,
  },
  tuna: {
    id: 'tuna',
    name: { tr: 'Ton balığı', en: 'Tuna' },
    roles: ['neta', 'filling'],
    cost: 3,
    fish: true,
  },
  tamago: {
    id: 'tamago',
    name: { tr: 'Tamago (omlet)', en: 'Tamago (omelette)' },
    roles: ['neta', 'filling'],
    cost: 1,
  },
  unagi: {
    id: 'unagi',
    name: { tr: 'Izgara yılan balığı', en: 'Grilled eel' },
    roles: ['neta', 'filling'],
    cost: 4,
    fish: true,
    cookedFrom: 'eel',
  },
  wasabi: { id: 'wasabi', name: { tr: 'Wasabi', en: 'Wasabi' }, roles: ['side'], cost: 0.5 },
  ginger: { id: 'ginger', name: { tr: 'Zencefil', en: 'Ginger' }, roles: ['side'], cost: 0.5 },
  soy: { id: 'soy', name: { tr: 'Soya sosu', en: 'Soy sauce' }, roles: ['side'], cost: 0.5 },
  nori: { id: 'nori', name: { tr: 'Nori', en: 'Nori' }, roles: ['base'], cost: 1 },
  cucumber: {
    id: 'cucumber',
    name: { tr: 'Salatalık', en: 'Cucumber' },
    roles: ['filling'],
    cost: 0.5,
  },
  avocado: { id: 'avocado', name: { tr: 'Avokado', en: 'Avocado' }, roles: ['filling'], cost: 1.5 },
  crab: {
    id: 'crab',
    name: { tr: 'Yengeç', en: 'Crab' },
    roles: ['filling'],
    cost: 2,
    fish: true,
  },
  creamcheese: {
    id: 'creamcheese',
    name: { tr: 'Krem peynir', en: 'Cream cheese' },
    roles: ['filling'],
    cost: 1,
  },
  tempura: {
    id: 'tempura',
    name: { tr: 'Tempura karides', en: 'Shrimp tempura' },
    roles: ['filling'],
    cost: 3,
    fish: true,
    cookedFrom: 'shrimp',
  },
  sesame: { id: 'sesame', name: { tr: 'Susam', en: 'Sesame' }, roles: ['topping'], cost: 0.3 },
  tobiko: {
    id: 'tobiko',
    name: { tr: 'Tobiko', en: 'Tobiko' },
    roles: ['topping'],
    cost: 1.5,
    fish: true,
  },
  scallion: {
    id: 'scallion',
    name: { tr: 'Taze soğan', en: 'Scallion' },
    roles: ['topping'],
    cost: 0.3,
  },
  spicymayo: {
    id: 'spicymayo',
    name: { tr: 'Acı mayo', en: 'Spicy mayo' },
    roles: ['topping'],
    cost: 0.5,
  },
  unagisauce: {
    id: 'unagisauce',
    name: { tr: 'Unagi sosu', en: 'Eel sauce' },
    roles: ['topping'],
    cost: 0.5,
  },
  noriband: {
    id: 'noriband',
    name: { tr: 'Nori kuşağı', en: 'Nori belt' },
    roles: ['topping'],
    cost: 0.3,
  },
  shrimp: {
    id: 'shrimp',
    name: { tr: 'Karides (tempura için)', en: 'Shrimp (for tempura)' },
    roles: ['heat'],
    cost: 2,
    fish: true,
  },
  eel: {
    id: 'eel',
    name: { tr: 'Yılan balığı (ızgara)', en: 'Eel (for grilling)' },
    roles: ['heat'],
    cost: 3,
    fish: true,
  },
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
  { id: 'celadon', name: { tr: 'Seladon', en: 'Celadon' }, unlockDay: 14 },
  { id: 'sakura', name: { tr: 'Sakura tabak', en: 'Sakura plate' }, unlockDay: 22 },
];
export const BOX_NAME: L = { tr: 'Paket kutusu', en: 'Takeout box' };

// ---------- calendar ----------

export type TimeOfDay = 'morning' | 'noon' | 'sunset' | 'evening';

export type Speaker = 'ume' | 'tuna' | 'gleam' | 'mina' | 'stranger' | 'critic' | 'inky' | 'me';
export const SPEAKERS: Record<Speaker, L> = {
  ume: { tr: 'Ume Nine', en: 'Grandma Ume' },
  tuna: { tr: 'Kaptan Tuna', en: 'Captain Tuna' },
  gleam: { tr: 'Bay Parlak', en: 'Mr. Gleam' },
  mina: { tr: 'Mina', en: 'Mina' },
  stranger: { tr: 'Yağmurluklu yabancı', en: 'Stranger in a raincoat' },
  critic: { tr: 'Eleştirmen Kalem Hanım', en: 'Critic Ms. Quill' },
  inky: { tr: 'Mürekkep', en: 'Inky' },
  me: { tr: 'Sen', en: 'You' },
};

export interface Line {
  who: Speaker;
  text: L;
}

/** a hand-written order for a special guest; uses only what is unlocked that day */
export interface SpecialGuest {
  who: Speaker;
  /** at which fraction of the day they arrive */
  at: number;
  greet: L;
  /** order template id understood by orders.ts */
  order: string;
  bonus: number;
}

export interface Day {
  n: number;
  act: number;
  title: L;
  time: TimeOfDay;
  rain: boolean;
  /** real seconds */
  duration: number;
  /** seconds between walk-in arrivals */
  spawn: number;
  /** patience in seconds while seated */
  patience: number;
  /** order complexity tier 1..6 */
  tier: number;
  unlock: IngId[];
  plates?: PlateId[];
  station2?: boolean;
  heat?: boolean;
  online?: boolean;
  guests?: SpecialGuest[];
  intro: Line[];
  outro: Line[];
  rent: number;
  bills: number;
}

const D = (d: Day) => d;

export const DAYS: Day[] = [
  D({
    n: 1,
    act: 1,
    title: { tr: 'Feribottan inen', en: 'Off the ferry' },
    time: 'morning',
    rain: false,
    duration: 300,
    spawn: 50,
    patience: 999,
    tier: 1,
    unlock: ['rice', 'salmon', 'wasabi', 'soy'],
    rent: 20,
    bills: 5,
    intro: [
      {
        who: 'ume',
        text: {
          tr: 'Hoş geldin torunum! Kirazlı Liman seni özlemiş. Ben de… ama bileğim incindi, bıçağı tutamıyorum.',
          en: 'Welcome, dear! Cherry Harbor has missed you. So have I… but I hurt my wrist and can’t hold a knife.',
        },
      },
      {
        who: 'ume',
        text: {
          tr: 'Nami-ya kırk yıldır bu tezgâhta. Bu yaz tezgâh senin. Önce nigiri: pirinç topu, üstüne somon.',
          en: 'Nami-ya has stood at this counter for forty years. This summer it’s yours. First, nigiri: a rice ball with salmon on top.',
        },
      },
      {
        who: 'inky',
        text: {
          tr: '*Akvaryumdan bir dokunaç el sallıyor*',
          en: '*A tentacle waves from the fish bowl*',
        },
      },
      {
        who: 'ume',
        text: {
          tr: 'Bu da Mürekkep. Tezgâhın bekçisi. Ona balık verme, şımarıyor.',
          en: 'That’s Inky, guardian of the counter. Don’t feed him fish, it spoils him.',
        },
      },
    ],
    outro: [
      {
        who: 'ume',
        text: {
          tr: 'İlk günün için hiç fena değil! Pirinç elinde konuşmaya başladı bile.',
          en: 'Not bad at all for a first day! The rice is already listening to your hands.',
        },
      },
    ],
  }),
  D({
    n: 2,
    act: 1,
    title: { tr: 'Sabah balık hali', en: 'The dawn fish market' },
    time: 'morning',
    rain: false,
    duration: 300,
    spawn: 46,
    patience: 95,
    tier: 1,
    unlock: ['tuna', 'ginger'],
    rent: 20,
    bills: 5,
    intro: [
      {
        who: 'tuna',
        text: {
          tr: 'Günaydın! Kaptan Tuna, balık halinin en erkencisi. Ume Hanım’ın torunu sen misin? Al, bugünün ton balığı.',
          en: 'Morning! Captain Tuna, first boat at the market. You’re Ume’s grandkid? Here, today’s tuna.',
        },
      },
      {
        who: 'ume',
        text: {
          tr: 'Tuna’nın balığı limanın en tazesi. Zencefili de unutma; ağzı tazeler.',
          en: 'Tuna’s fish is the freshest in the harbor. And don’t forget ginger; it refreshes the mouth.',
        },
      },
    ],
    outro: [
      {
        who: 'tuna',
        text: {
          tr: 'Bugün tezgâhın önünden geçerken kuyruk gördüm. Eski günler gibi!',
          en: 'Saw a line outside your counter today. Just like the old days!',
        },
      },
    ],
  }),
  D({
    n: 3,
    act: 1,
    title: { tr: 'Ninemin hasırı', en: 'Grandma’s bamboo mat' },
    time: 'noon',
    rain: false,
    duration: 300,
    spawn: 46,
    patience: 100,
    tier: 2,
    unlock: ['nori', 'cucumber'],
    station2: true,
    rent: 20,
    bills: 6,
    intro: [
      {
        who: 'ume',
        text: {
          tr: 'Bugün maki öğreniyorsun. Bu hasır benim ustamındı. Nori, ince bir kat pirinç, ortaya salatalık… sonra sar.',
          en: 'Today you learn maki. This mat belonged to my master. Nori, a thin layer of rice, cucumber in the middle… then roll.',
        },
      },
      {
        who: 'ume',
        text: {
          tr: 'Yan taraftaki kesme tahtasına geç. Ne çok hızlı, ne çok yavaş. Rulo nefes almalı.',
          en: 'Head to the cutting board on the side. Not too fast, not too slow. A roll should breathe.',
        },
      },
    ],
    outro: [
      {
        who: 'ume',
        text: {
          tr: 'Ustam Hayato da böyle sarardı. Bir gün gitti… ve bıçağıyla birlikte kayboldu.',
          en: 'My master Hayato rolled just like that. One day he left… and vanished with his knife.',
        },
      },
    ],
  }),
  D({
    n: 4,
    act: 1,
    title: { tr: 'Bıçak dersi', en: 'The knife lesson' },
    time: 'noon',
    rain: false,
    duration: 330,
    spawn: 44,
    patience: 95,
    tier: 2,
    unlock: ['avocado'],
    rent: 22,
    bills: 6,
    guests: [
      {
        who: 'tuna',
        at: 0.45,
        greet: {
          tr: 'Kendi balığımı bir de senin bıçağından tadayım! 3 ince ton sashimi, lütfen.',
          en: 'Let me taste my own fish off your knife! 3 thin tuna sashimi, please.',
        },
        order: 'tuna-sashimi',
        bonus: 15,
      },
    ],
    intro: [
      {
        who: 'ume',
        text: {
          tr: 'Sashimi pirinçsiz, sadece balık. Kesme tahtasında balığı seç, doğru anda kes: ince, tam ya da kalın.',
          en: 'Sashimi is fish alone, no rice. Pick the fish on the cutting board and slice at the right moment: thin, regular or thick.',
        },
      },
      {
        who: 'ume',
        text: {
          tr: 'Bu bıçak körleşti ama idare eder. Asıl bıçak… neyse. Avokado da geldi!',
          en: 'This knife is dull but it’ll do. The real knife… never mind. Avocados arrived too!',
        },
      },
    ],
    outro: [
      {
        who: 'tuna',
        text: {
          tr: 'Ume, bu çocuk Hayato gibi kesiyor. Söyleyeyim dedim.',
          en: 'Ume, this kid cuts like Hayato. Just saying.',
        },
      },
      {
        who: 'ume',
        text: { tr: '…Biliyorum, Tuna. Biliyorum.', en: '…I know, Tuna. I know.' },
      },
    ],
  }),
  D({
    n: 5,
    act: 1,
    title: { tr: 'Mürekkep’in suçu', en: 'Inky’s crime' },
    time: 'sunset',
    rain: false,
    duration: 330,
    spawn: 42,
    patience: 90,
    tier: 3,
    unlock: ['sesame'],
    plates: ['slate'],
    rent: 22,
    bills: 6,
    intro: [
      {
        who: 'mina',
        text: {
          tr: 'Merhaba! Ben Mina, karşıdaki dondurmacının kızıyım. Ahtapotun dün bizim salatalığı çaldı!',
          en: 'Hi! I’m Mina from the ice-cream shop across the street. Your octopus stole our cucumber yesterday!',
        },
      },
      {
        who: 'inky',
        text: { tr: '*Masum masum baloncuk üflüyor*', en: '*Blows innocent little bubbles*' },
      },
      {
        who: 'ume',
        text: {
          tr: 'Artık müşteriler “şu olmasın” da diyecek. Fişi iyi oku. Bir de kayrak tabağımız var, bazıları onu ister.',
          en: 'Now customers will say “no this, no that”. Read the ticket carefully. We also have a slate plate; some will ask for it.',
        },
      },
    ],
    outro: [
      {
        who: 'mina',
        text: {
          tr: 'Yarın arkadaşlarımı getireceğim. Söz, Mürekkep’e balık vermeyeceğiz!',
          en: 'I’ll bring my friends tomorrow. Promise we won’t feed Inky fish!',
        },
      },
    ],
  }),
  D({
    n: 6,
    act: 1,
    title: { tr: 'Yağmurlu yabancı', en: 'Stranger in the rain' },
    time: 'noon',
    rain: true,
    duration: 360,
    spawn: 42,
    patience: 90,
    tier: 3,
    unlock: ['crab', 'tobiko'],
    rent: 24,
    bills: 7,
    guests: [
      {
        who: 'stranger',
        at: 0.55,
        greet: {
          tr: '…Bir ura maki. Yengeçli, avokadolu. Dışı susamlı. Hayato’nun tarifi gibi.',
          en: '…One uramaki. Crab and avocado. Sesame outside. Like Hayato’s recipe.',
        },
        order: 'stranger-ura',
        bonus: 20,
      },
    ],
    intro: [
      {
        who: 'ume',
        text: {
          tr: 'Yağmur yağınca liman sakinleşir ama sıcak bir tezgâh arayanlar gelir. Bugün ura maki: pirinç dışarıda!',
          en: 'Rain quiets the harbor, but people come looking for a warm counter. Today: uramaki, rice on the outside!',
        },
      },
    ],
    outro: [
      {
        who: 'ume',
        text: {
          tr: 'O yağmurluklu adam tabağın altına bir şey bırakmış… bir bıçak çizimi. Bu… Hayato’nun bıçağı!',
          en: 'That man in the raincoat left something under the plate… a drawing of a knife. That’s… Hayato’s knife!',
        },
      },
    ],
  }),
  D({
    n: 7,
    act: 1,
    title: { tr: 'Tavanın sesi', en: 'The sound of the fryer' },
    time: 'sunset',
    rain: false,
    duration: 360,
    spawn: 40,
    patience: 88,
    tier: 4,
    unlock: ['shrimp', 'tempura', 'creamcheese'],
    heat: true,
    rent: 24,
    bills: 8,
    intro: [
      {
        who: 'tuna',
        text: {
          tr: 'Eski fritözü tamir ettim! Karidesleri at, kadrana bak, tam kızarınca al. Yanarsa çöpe!',
          en: 'Fixed the old fryer! Drop the shrimp in, watch the dial, take them out when they’re golden. Burnt ones go in the bin!',
        },
      },
      {
        who: 'tuna',
        text: {
          tr: 'Bu arada… limana bir afiş astılar. “DönDön Sushi — Çok yakında!” Konveyör bantlı zincir.',
          en: 'By the way… someone put up a poster at the harbor. “SpinSushi — Coming soon!” A conveyor-belt chain.',
        },
      },
    ],
    outro: [
      {
        who: 'ume',
        text: {
          tr: 'Bant üstünde dönen sushi… Pirinç el ister, makine değil. Endişelenme.',
          en: 'Sushi spinning on a belt… Rice wants hands, not machines. Don’t worry.',
        },
      },
    ],
  }),
  D({
    n: 8,
    act: 1,
    title: { tr: 'Parlak bir teklif', en: 'A shiny offer' },
    time: 'noon',
    rain: false,
    duration: 390,
    spawn: 40,
    patience: 85,
    tier: 4,
    unlock: ['scallion', 'spicymayo'],
    rent: 26,
    bills: 8,
    guests: [
      {
        who: 'gleam',
        at: 0.5,
        greet: {
          tr: 'Merhaba merhaba! İki acılı somon temaki. Hızlı olsun, zaman paradır.',
          en: 'Hello, hello! Two spicy salmon temaki. Make it quick, time is money.',
        },
        order: 'gleam-temaki',
        bonus: 20,
      },
    ],
    intro: [
      {
        who: 'ume',
        text: {
          tr: 'Temaki: yarım nori, pirinç, iç malzeme, sonra külah gibi sar. Elle yenir, çocuklar bayılır.',
          en: 'Temaki: half a nori sheet, rice, filling, then roll it into a cone. Eaten by hand; kids love it.',
        },
      },
    ],
    outro: [
      {
        who: 'gleam',
        text: {
          tr: 'Hoş dükkân. Satarsanız iyi para veririm. DönDön Sushi burayı… bekleme salonu yapar.',
          en: 'Cute shop. I’d pay well if you sold. SpinSushi could make this place… a waiting room.',
        },
      },
      {
        who: 'ume',
        text: {
          tr: 'Nami-ya satılık değil, Bay Parlak. Kapı orada.',
          en: 'Nami-ya is not for sale, Mr. Gleam. The door is right there.',
        },
      },
    ],
  }),
  D({
    n: 9,
    act: 1,
    title: { tr: 'Eleştirmenin kalemi', en: 'The critic’s pen' },
    time: 'evening',
    rain: false,
    duration: 390,
    spawn: 38,
    patience: 85,
    tier: 5,
    unlock: ['tamago', 'noriband'],
    plates: ['porcelain'],
    rent: 26,
    bills: 9,
    guests: [
      {
        who: 'critic',
        at: 0.5,
        greet: {
          tr: 'Kalem Hanım, Liman Gazetesi. Porselen tabakta: 2 somon nigiri, 2 tamago nigiri ve zencefil. Wasabi istemem.',
          en: 'Ms. Quill, Harbor Gazette. On a porcelain plate: 2 salmon nigiri, 2 tamago nigiri and ginger. No wasabi.',
        },
        order: 'critic-plate',
        bonus: 30,
      },
    ],
    intro: [
      {
        who: 'ume',
        text: {
          tr: 'Bu akşam Liman Gazetesi’nden eleştirmen gelecek. Tamago’yu nori kuşağıyla bağla; ustam öyle yapardı.',
          en: 'A critic from the Harbor Gazette is coming tonight. Tie the tamago with a nori belt; that’s how my master did it.',
        },
      },
    ],
    outro: [
      {
        who: 'critic',
        text: {
          tr: '“Nami-ya, limanın unutulmuş incisi.” Yarınki gazeteye böyle yazacağım.',
          en: '“Nami-ya, the harbor’s forgotten pearl.” That’s what tomorrow’s paper will say.',
        },
      },
      {
        who: 'ume',
        text: {
          tr: 'Bak! Limanın karşısında neon yandı: DönDön Sushi açıldı. Daha çok müşteriye ihtiyacımız var…',
          en: 'Look! A neon sign just lit up across the harbor: SpinSushi is open. We need more customers…',
        },
      },
    ],
  }),
  D({
    n: 10,
    act: 2,
    title: { tr: 'Tablet çalıyor', en: 'The tablet rings' },
    time: 'noon',
    rain: false,
    duration: 420,
    spawn: 40,
    patience: 85,
    tier: 5,
    unlock: ['eel', 'unagi', 'unagisauce'],
    online: true,
    rent: 28,
    bills: 10,
    intro: [
      {
        who: 'mina',
        text: {
          tr: 'Sürpriz! Annem eski tabletini verdi. Nami-ya artık online sipariş alıyor! Paketleri kapıdaki kutuya koy, kurye alır.',
          en: 'Surprise! Mom gave us her old tablet. Nami-ya takes online orders now! Put packages in the box by the door; the courier picks them up.',
        },
      },
      {
        who: 'ume',
        text: {
          tr: 'Izgara da hazır: yılan balığını kızart, unagi sosuyla parlat. Futo maki de yapabilirsin artık, bol malzemeli.',
          en: 'The grill is ready too: grill the eel, glaze it with eel sauce. You can make futomaki now as well, packed with fillings.',
        },
      },
    ],
    outro: [
      {
        who: 'ume',
        text: {
          tr: 'Paketler limanın her köşesine gitti. DönDön’ün neonu parlak olabilir… ama bizim pirincimiz sıcak.',
          en: 'Our packages reached every corner of the harbor. SpinSushi’s neon may be bright… but our rice is warm.',
        },
      },
    ],
  }),
];

export const TOTAL_DAYS = 50;
export const PLAYABLE_DAYS = DAYS.length;

export function dayDef(n: number): Day {
  return DAYS[Math.min(n, DAYS.length) - 1];
}

/** everything unlocked up to and including day n */
export function unlockedIngs(n: number): Set<IngId> {
  const s = new Set<IngId>();
  for (const d of DAYS) if (d.n <= n) d.unlock.forEach((i) => s.add(i));
  return s;
}
export function unlockedPlates(n: number): PlateId[] {
  return PLATES.filter((p) => p.unlockDay <= n).map((p) => p.id);
}
export function hasStation2(n: number) {
  return DAYS.some((d) => d.n <= n && d.station2);
}
export function hasHeat(n: number) {
  return DAYS.some((d) => d.n <= n && d.heat);
}

export const ACTS: L[] = [
  { tr: 'Açılış', en: 'Opening' },
  { tr: 'Büyüme', en: 'Growing' },
  { tr: 'Rakibin oyunları', en: 'The rival’s games' },
  { tr: 'Fırtına ve sır', en: 'Storm and secret' },
  { tr: 'Liman Festivali', en: 'Harbor Festival' },
];

// ---------- decor ----------

export type DecorSlot = 'wall' | 'floor' | 'lamp' | 'table' | 'plant';
export interface DecorItem {
  id: string;
  slot: DecorSlot;
  name: L;
  price: number;
  tip: number; // % tip bonus
}
export const DECOR: DecorItem[] = [
  {
    id: 'wall-plain',
    slot: 'wall',
    name: { tr: 'Krem sıva', en: 'Cream plaster' },
    price: 0,
    tip: 0,
  },
  {
    id: 'wall-wave',
    slot: 'wall',
    name: { tr: 'Dalga kâğıdı', en: 'Wave paper' },
    price: 120,
    tip: 3,
  },
  {
    id: 'wall-indigo',
    slot: 'wall',
    name: { tr: 'İndigo ahşap', en: 'Indigo wood' },
    price: 220,
    tip: 5,
  },
  {
    id: 'floor-plank',
    slot: 'floor',
    name: { tr: 'Çam döşeme', en: 'Pine planks' },
    price: 0,
    tip: 0,
  },
  {
    id: 'floor-stone',
    slot: 'floor',
    name: { tr: 'Dere taşı', en: 'River stone' },
    price: 140,
    tip: 3,
  },
  {
    id: 'lamp-paper',
    slot: 'lamp',
    name: { tr: 'Kâğıt fener', en: 'Paper lantern' },
    price: 0,
    tip: 0,
  },
  {
    id: 'lamp-coral',
    slot: 'lamp',
    name: { tr: 'Mercan fenerler', en: 'Coral lanterns' },
    price: 90,
    tip: 2,
  },
  {
    id: 'lamp-brass',
    slot: 'lamp',
    name: { tr: 'Pirinç lamba', en: 'Brass lamp' },
    price: 180,
    tip: 4,
  },
  { id: 'table-pine', slot: 'table', name: { tr: 'Çam masa', en: 'Pine table' }, price: 0, tip: 0 },
  {
    id: 'table-walnut',
    slot: 'table',
    name: { tr: 'Ceviz masa', en: 'Walnut table' },
    price: 160,
    tip: 3,
  },
  { id: 'plant-none', slot: 'plant', name: { tr: 'Bitki yok', en: 'No plant' }, price: 0, tip: 0 },
  { id: 'plant-bonsai', slot: 'plant', name: { tr: 'Bonsai', en: 'Bonsai' }, price: 80, tip: 2 },
  {
    id: 'plant-sakura',
    slot: 'plant',
    name: { tr: 'Sakura dalı', en: 'Sakura branch' },
    price: 150,
    tip: 4,
  },
];
export const DECOR_SLOTS: { slot: DecorSlot; name: L }[] = [
  { slot: 'wall', name: { tr: 'Duvar', en: 'Wall' } },
  { slot: 'floor', name: { tr: 'Zemin', en: 'Floor' } },
  { slot: 'lamp', name: { tr: 'Lamba', en: 'Lamp' } },
  { slot: 'table', name: { tr: 'Masa', en: 'Table' } },
  { slot: 'plant', name: { tr: 'Bitki', en: 'Plant' } },
];

// ---------- names ----------

export const NAMES_TR = {
  f: [
    'Elif',
    'Zeynep',
    'Defne',
    'Ece',
    'Selin',
    'Nehir',
    'Ada',
    'Melis',
    'Aylin',
    'Derya',
    'Sevgi',
    'Gül',
  ],
  m: [
    'Can',
    'Emre',
    'Kerem',
    'Baran',
    'Ozan',
    'Mert',
    'Arda',
    'Deniz',
    'Umut',
    'Hakan',
    'Kaan',
    'Rüzgar',
  ],
};
export const NAMES_EN = {
  f: [
    'Emma',
    'Olivia',
    'Ava',
    'Mia',
    'Chloe',
    'Grace',
    'Lily',
    'Ruby',
    'Hannah',
    'Zoe',
    'Nora',
    'Ella',
  ],
  m: [
    'Liam',
    'Noah',
    'Oliver',
    'Ethan',
    'Leo',
    'Jack',
    'Lucas',
    'Henry',
    'Owen',
    'Sam',
    'Theo',
    'Max',
  ],
};
