// Decoration shop: categories, purchasable items and the equipped set stored in Save.
// Prices are in cents, tipBonus is a fraction of the tip rate (0.01 = +1%).

export type DecorCat =
  | 'wall'
  | 'floor'
  | 'bigart'
  | 'smallart'
  | 'lamps'
  | 'tables'
  | 'plants'
  | 'neon'
  | 'counter'
  | 'special';

export interface DecorCatInfo {
  id: DecorCat;
  label: string;
  icon: string;
}

export interface DecorItem {
  id: string;
  cat: DecorCat;
  name: string;
  desc: string;
  price: number;
  tipBonus: number;
  /** Visual parameters used by the renderer (free-form). */
  v?: Record<string, string | number>;
}

export const DECOR_CATS: DecorCatInfo[] = [
  { id: 'wall', label: 'Duvar', icon: '🧱' },
  { id: 'floor', label: 'Zemin', icon: '🪵' },
  { id: 'bigart', label: 'Büyük Tablo', icon: '🖼' },
  { id: 'smallart', label: 'Küçük Tablo', icon: '🎴' },
  { id: 'lamps', label: 'Lambalar', icon: '🏮' },
  { id: 'tables', label: 'Masalar', icon: '🪑' },
  { id: 'plants', label: 'Bitkiler', icon: '🪴' },
  { id: 'neon', label: 'Neon', icon: '💡' },
  { id: 'counter', label: 'Tezgâh', icon: '🐱' },
  { id: 'special', label: 'Özel', icon: '✨' },
];

export const DECOR_ITEMS: DecorItem[] = [
  // wall
  {
    id: 'wall_wood',
    cat: 'wall',
    name: 'Ahşap',
    desc: 'Sıcak ahşap kaplama.',
    price: 0,
    tipBonus: 0,
  },
  {
    id: 'wall_washi',
    cat: 'wall',
    name: 'Washi Kâğıdı',
    desc: 'Sade, aydınlık Japon kâğıdı.',
    price: 9000,
    tipBonus: 0.01,
  },
  {
    id: 'wall_brick',
    cat: 'wall',
    name: 'Tuğla',
    desc: 'Şehirli, samimi bir hava.',
    price: 12000,
    tipBonus: 0.01,
  },
  {
    id: 'wall_lacquer',
    cat: 'wall',
    name: 'Kırmızı Lake',
    desc: 'Parlak, şık ve cesur.',
    price: 22000,
    tipBonus: 0.02,
  },
  {
    id: 'wall_sakura',
    cat: 'wall',
    name: 'Sakura',
    desc: 'Pembe çiçekli bahar duvarı.',
    price: 30000,
    tipBonus: 0.025,
  },
  // floor
  {
    id: 'floor_parke',
    cat: 'floor',
    name: 'Parke',
    desc: 'Klasik ahşap zemin.',
    price: 0,
    tipBonus: 0,
  },
  {
    id: 'floor_tatami',
    cat: 'floor',
    name: 'Tatami',
    desc: 'Hasır örgü, huzurlu.',
    price: 11000,
    tipBonus: 0.01,
  },
  {
    id: 'floor_checker',
    cat: 'floor',
    name: 'Dama',
    desc: 'Siyah-beyaz retro kareler.',
    price: 14000,
    tipBonus: 0.015,
  },
  {
    id: 'floor_stone',
    cat: 'floor',
    name: 'Taş',
    desc: 'Serin, doğal taş döşeme.',
    price: 18000,
    tipBonus: 0.02,
  },
  // big art
  {
    id: 'bigart_none',
    cat: 'bigart',
    name: 'Boş Duvar',
    desc: 'Henüz tablo yok.',
    price: 0,
    tipBonus: 0,
  },
  {
    id: 'bigart_fuji',
    cat: 'bigart',
    name: 'Fuji Dağı',
    desc: 'Karlı zirve ve kızıl güneş.',
    price: 15000,
    tipBonus: 0.015,
  },
  {
    id: 'bigart_wave',
    cat: 'bigart',
    name: 'Büyük Dalga',
    desc: 'Köpüklü dev bir dalga.',
    price: 25000,
    tipBonus: 0.02,
  },
  {
    id: 'bigart_koi',
    cat: 'bigart',
    name: 'Koi Havuzu',
    desc: 'Şanslı balıklar.',
    price: 20000,
    tipBonus: 0.02,
  },
  {
    id: 'bigart_cranes',
    cat: 'bigart',
    name: 'Turnalar',
    desc: 'Uzun ömür ve mutluluk.',
    price: 35000,
    tipBonus: 0.03,
  },
  // small art
  {
    id: 'smallart_none',
    cat: 'smallart',
    name: 'Yok',
    desc: 'Küçük tablo yok.',
    price: 0,
    tipBonus: 0,
  },
  {
    id: 'smallart_calli',
    cat: 'smallart',
    name: 'Kaligrafi',
    desc: 'Fırçayla yazılmış "麺".',
    price: 6000,
    tipBonus: 0.005,
  },
  {
    id: 'smallart_miso',
    cat: 'smallart',
    name: 'Miso Posteri',
    desc: 'Dükkânın yıldızı Miso!',
    price: 8000,
    tipBonus: 0.01,
  },
  {
    id: 'smallart_sakura',
    cat: 'smallart',
    name: 'Sakura Dalı',
    desc: 'Narin bir bahar dalı.',
    price: 9500,
    tipBonus: 0.01,
  },
  // lamps
  {
    id: 'lamps_red',
    cat: 'lamps',
    name: 'Kırmızı Fenerler',
    desc: 'Klasik kırmızı fenerler.',
    price: 0,
    tipBonus: 0,
  },
  {
    id: 'lamps_paper',
    cat: 'lamps',
    name: 'Kâğıt Küreler',
    desc: 'Yumuşak beyaz ışık.',
    price: 8000,
    tipBonus: 0.01,
  },
  {
    id: 'lamps_edison',
    cat: 'lamps',
    name: 'Edison Ampuller',
    desc: 'Sıcak, telli ampuller.',
    price: 16000,
    tipBonus: 0.015,
  },
  {
    id: 'lamps_festival',
    cat: 'lamps',
    name: 'Festival Fenerleri',
    desc: 'Rengârenk bayram ışıkları.',
    price: 24000,
    tipBonus: 0.02,
  },
  // tables
  {
    id: 'tables_0',
    cat: 'tables',
    name: 'Sadece Tezgâh',
    desc: 'Müşteriler tezgâhta yer.',
    price: 0,
    tipBonus: 0,
  },
  {
    id: 'tables_2',
    cat: 'tables',
    name: '2 Masa',
    desc: 'Hana Nine’den kalan iki masa.',
    price: 0,
    tipBonus: 0,
  },
  {
    id: 'tables_4',
    cat: 'tables',
    name: '4 Masa',
    desc: 'Dolu dolu bir salon.',
    price: 45000,
    tipBonus: 0.03,
  },
  // plants
  { id: 'plants_none', cat: 'plants', name: 'Yok', desc: 'Bitki yok.', price: 0, tipBonus: 0 },
  {
    id: 'plants_bamboo',
    cat: 'plants',
    name: 'Bambu',
    desc: 'Uzun, şanslı bambular.',
    price: 5000,
    tipBonus: 0.005,
  },
  {
    id: 'plants_bonsai',
    cat: 'plants',
    name: 'Bonsai',
    desc: 'Minik, sabırlı bir ağaç.',
    price: 12000,
    tipBonus: 0.01,
  },
  {
    id: 'plants_monstera',
    cat: 'plants',
    name: 'Monstera',
    desc: 'Kocaman yeşil yapraklar.',
    price: 9000,
    tipBonus: 0.01,
  },
  // neon
  { id: 'neon_none', cat: 'neon', name: 'Yok', desc: 'Neon yok.', price: 0, tipBonus: 0 },
  {
    id: 'neon_ramen',
    cat: 'neon',
    name: '"ラーメン" Neon',
    desc: 'Pembe parlayan yazı.',
    price: 18000,
    tipBonus: 0.015,
  },
  {
    id: 'neon_bowl',
    cat: 'neon',
    name: 'Kase & Çubuk Neon',
    desc: 'Dumanı tüten neon kase.',
    price: 22000,
    tipBonus: 0.02,
  },
  // counter
  { id: 'counter_none', cat: 'counter', name: 'Yok', desc: 'Tezgâh boş.', price: 0, tipBonus: 0 },
  {
    id: 'counter_maneki',
    cat: 'counter',
    name: 'Maneki-neko',
    desc: 'Patisini sallayan şans kedisi.',
    price: 10000,
    tipBonus: 0.015,
  },
  {
    id: 'counter_ikebana',
    cat: 'counter',
    name: 'İkebana',
    desc: 'Zarif çiçek düzenlemesi.',
    price: 7000,
    tipBonus: 0.01,
  },
  // special
  {
    id: 'special_none',
    cat: 'special',
    name: 'Yok',
    desc: 'Özel eşya yok.',
    price: 0,
    tipBonus: 0,
  },
  {
    id: 'special_aquarium',
    cat: 'special',
    name: 'Akvaryum',
    desc: 'Yüzen balıklar, mavi ışık.',
    price: 60000,
    tipBonus: 0.03,
  },
  {
    id: 'special_turntable',
    cat: 'special',
    name: 'Pikap',
    desc: 'Dönen plak, sıcak müzik.',
    price: 40000,
    tipBonus: 0.025,
  },
];

export type Decor = Record<DecorCat, string>;

export const DEFAULT_DECOR: Decor = {
  wall: 'wall_wood',
  floor: 'floor_parke',
  bigart: 'bigart_none',
  smallart: 'smallart_none',
  lamps: 'lamps_red',
  tables: 'tables_2',
  plants: 'plants_none',
  neon: 'neon_none',
  counter: 'counter_none',
  special: 'special_none',
};

const BY_ID = new Map(DECOR_ITEMS.map((i) => [i.id, i]));

export const decorItem = (id: string) => BY_ID.get(id);

export const itemsOf = (cat: DecorCat) => DECOR_ITEMS.filter((i) => i.cat === cat);

/** Sum of tip bonuses of everything equipped (e.g. 0.035 = +3.5%). */
export function decorTipBonus(decor: Decor): number {
  let b = 0;
  for (const cat of Object.keys(DEFAULT_DECOR) as DecorCat[])
    b += BY_ID.get(decor[cat])?.tipBonus ?? 0;
  return Math.round(b * 1000) / 1000;
}

/** Merge a (possibly partial / old) saved decor with defaults, dropping unknown ids. */
export function applyDecor(saved?: Partial<Decor> | null): Decor {
  const d: Decor = { ...DEFAULT_DECOR };
  if (!saved) return d;
  for (const cat of Object.keys(DEFAULT_DECOR) as DecorCat[]) {
    const id = saved[cat];
    if (id && BY_ID.get(id)?.cat === cat) d[cat] = id;
  }
  return d;
}

/** Number of tables for a decor set. */
export const tableCount = (decor: Decor) =>
  decor.tables === 'tables_4' ? 4 : decor.tables === 'tables_2' ? 2 : 0;
