// Restaurant decoration: slots, items, prices (₺) and the small tip bonus each item gives.

export type Slot =
  | 'duvar'
  | 'zemin'
  | 'tablo'
  | 'lamba'
  | 'masaSayi'
  | 'masaStil'
  | 'masaSus'
  | 'bitki'
  | 'tezgah'
  | 'pencere';

export interface DecorItem {
  id: string;
  slot: Slot;
  name: string;
  price: number; // ₺
  tip: number; // extra tip percent
}

export const SLOTS: { id: Slot; name: string }[] = [
  { id: 'duvar', name: 'Duvar' },
  { id: 'zemin', name: 'Zemin' },
  { id: 'tablo', name: 'Tablo' },
  { id: 'lamba', name: 'Lambalar' },
  { id: 'masaSayi', name: 'Masa sayısı' },
  { id: 'masaStil', name: 'Masa stili' },
  { id: 'masaSus', name: 'Masa süsü' },
  { id: 'bitki', name: 'Bitkiler' },
  { id: 'tezgah', name: 'Tezgâh süsü' },
  { id: 'pencere', name: 'Pencere' },
];

export const DECOR: DecorItem[] = [
  // walls
  { id: 'duvar-hinoki', slot: 'duvar', name: 'Açık hinoki ahşap', price: 0, tip: 0 },
  { id: 'duvar-sage', slot: 'duvar', name: 'Adaçayı sıva', price: 600, tip: 2 },
  { id: 'duvar-shoji', slot: 'duvar', name: 'Shoji paneller', price: 900, tip: 3 },
  { id: 'duvar-kiremit', slot: 'duvar', name: 'Kiremit sıva', price: 1200, tip: 4 },
  { id: 'duvar-sakura', slot: 'duvar', name: 'Sakura desenli kâğıt', price: 1800, tip: 5 },
  // floors
  { id: 'zemin-mese', slot: 'zemin', name: 'Açık meşe', price: 0, tip: 0 },
  { id: 'zemin-tatami', slot: 'zemin', name: 'Tatami', price: 700, tip: 2 },
  { id: 'zemin-terrazzo', slot: 'zemin', name: 'Terrazzo', price: 1000, tip: 3 },
  { id: 'zemin-tas', slot: 'zemin', name: 'Taş döşeme', price: 1400, tip: 4 },
  // painting on the back wall
  { id: 'tablo-yok', slot: 'tablo', name: 'Boş duvar', price: 0, tip: 0 },
  { id: 'tablo-fuji', slot: 'tablo', name: 'Fuji Dağı', price: 500, tip: 2 },
  { id: 'tablo-dalga', slot: 'tablo', name: 'Büyük Dalga', price: 900, tip: 3 },
  { id: 'tablo-koi', slot: 'tablo', name: 'Koi balıkları', price: 800, tip: 3 },
  { id: 'tablo-turna', slot: 'tablo', name: 'Turnalar', price: 1300, tip: 4 },
  // lamps
  { id: 'lamba-ampul', slot: 'lamba', name: 'Sade ampuller', price: 0, tip: 0 },
  { id: 'lamba-kagit', slot: 'lamba', name: 'Kâğıt fenerler', price: 600, tip: 2 },
  { id: 'lamba-chochin', slot: 'lamba', name: 'Kırmızı chochin', price: 1000, tip: 3 },
  { id: 'lamba-pirinc', slot: 'lamba', name: 'Pirinç sarkıtlar', price: 1500, tip: 4 },
  // table count
  { id: 'masa-2', slot: 'masaSayi', name: '2 masa', price: 0, tip: 0 },
  { id: 'masa-3', slot: 'masaSayi', name: '3 masa', price: 800, tip: 2 },
  { id: 'masa-4', slot: 'masaSayi', name: '4 masa', price: 1600, tip: 4 },
  // table style
  { id: 'stil-cam', slot: 'masaStil', name: 'Çam ahşap', price: 0, tip: 0 },
  { id: 'stil-ceviz', slot: 'masaStil', name: 'Koyu ceviz', price: 700, tip: 2 },
  { id: 'stil-lake', slot: 'masaStil', name: 'Kırmızı lake', price: 1100, tip: 3 },
  { id: 'stil-mermer', slot: 'masaStil', name: 'Beyaz mermer', price: 1500, tip: 4 },
  // table deco
  { id: 'sus-yok', slot: 'masaSus', name: 'Sade', price: 0, tip: 0 },
  { id: 'sus-mum', slot: 'masaSus', name: 'Küçük mumlar', price: 300, tip: 1 },
  { id: 'sus-cicek', slot: 'masaSus', name: 'Vazoda çiçek', price: 500, tip: 2 },
  { id: 'sus-bonsai', slot: 'masaSus', name: 'Mini bonsai', price: 900, tip: 3 },
  // plants
  { id: 'bitki-yok', slot: 'bitki', name: 'Yok', price: 0, tip: 0 },
  { id: 'bitki-bambu', slot: 'bitki', name: 'Bambu saksı', price: 400, tip: 1 },
  { id: 'bitki-monstera', slot: 'bitki', name: 'Monstera', price: 800, tip: 2 },
  { id: 'bitki-sakura', slot: 'bitki', name: 'Sakura dalları', price: 1200, tip: 3 },
  // counter deco
  { id: 'tezgah-sade', slot: 'tezgah', name: 'Sade', price: 0, tip: 0 },
  { id: 'tezgah-maneki', slot: 'tezgah', name: 'Maneki-neko', price: 500, tip: 2 },
  { id: 'tezgah-daruma', slot: 'tezgah', name: 'Daruma', price: 700, tip: 2 },
  { id: 'tezgah-ikebana', slot: 'tezgah', name: 'İkebana', price: 1000, tip: 3 },
  // window
  { id: 'pencere-sade', slot: 'pencere', name: 'Sade cam', price: 0, tip: 0 },
  { id: 'pencere-noren', slot: 'pencere', name: 'Noren perde', price: 600, tip: 2 },
  { id: 'pencere-cicek', slot: 'pencere', name: 'Pencere çiçekliği', price: 900, tip: 3 },
];

export type DecorState = Record<Slot, string>;

export const DEFAULT_DECOR: DecorState = {
  duvar: 'duvar-hinoki',
  zemin: 'zemin-mese',
  tablo: 'tablo-yok',
  lamba: 'lamba-ampul',
  masaSayi: 'masa-2',
  masaStil: 'stil-cam',
  masaSus: 'sus-yok',
  bitki: 'bitki-yok',
  tezgah: 'tezgah-sade',
  pencere: 'pencere-sade',
};

export const DEFAULT_OWNED = DECOR.filter((d) => d.price === 0).map((d) => d.id);

export function withDefaults(d?: Partial<DecorState>): DecorState {
  return { ...DEFAULT_DECOR, ...(d ?? {}) };
}

/** Total extra tip percent from all equipped items. */
export function tipBonus(decor: DecorState): number {
  let t = 0;
  for (const id of Object.values(decor)) t += DECOR.find((d) => d.id === id)?.tip ?? 0;
  return t;
}

export const tableCount = (decor: DecorState) => Number(decor.masaSayi.split('-')[1] ?? 2);
