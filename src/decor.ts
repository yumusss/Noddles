// Restaurant decoration: slots, items, prices and the small tip bonus each item gives.

export type Slot =
  | 'duvar'
  | 'zemin'
  | 'tablo1'
  | 'tablo2'
  | 'lamba'
  | 'masa'
  | 'masaStil'
  | 'masaSus'
  | 'bitki'
  | 'neon'
  | 'tezgah'
  | 'ozel';

export interface DecorItem {
  id: string;
  slot: Slot;
  name: string;
  price: number; // cents
  tip: number; // extra tip percent
}

export const SLOTS: { id: Slot; name: string; icon: string }[] = [
  { id: 'duvar', name: 'Duvar', icon: '🧱' },
  { id: 'zemin', name: 'Zemin', icon: '🟫' },
  { id: 'tablo1', name: 'Büyük tablo', icon: '🖼' },
  { id: 'tablo2', name: 'Küçük tablo', icon: '🎴' },
  { id: 'lamba', name: 'Lambalar', icon: '🏮' },
  { id: 'masa', name: 'Masalar', icon: '🪑' },
  { id: 'masaStil', name: 'Masa stili', icon: '🪵' },
  { id: 'masaSus', name: 'Masa süsü', icon: '💐' },
  { id: 'bitki', name: 'Bitkiler', icon: '🪴' },
  { id: 'neon', name: 'Neon tabela', icon: '✨' },
  { id: 'tezgah', name: 'Tezgâh', icon: '🍶' },
  { id: 'ozel', name: 'Özel', icon: '🐟' },
];

export const DECOR: DecorItem[] = [
  // walls
  { id: 'duvar-ahsap', slot: 'duvar', name: 'Açık hinoki ahşap', price: 0, tip: 0 },
  { id: 'duvar-washi', slot: 'duvar', name: 'Shoji paneller', price: 1500, tip: 2 },
  { id: 'duvar-tugla', slot: 'duvar', name: 'Adaçayı sıva', price: 2000, tip: 2 },
  { id: 'duvar-lake', slot: 'duvar', name: 'Kiremit sıva', price: 3500, tip: 4 },
  { id: 'duvar-sakura', slot: 'duvar', name: 'Sakura desenli kâğıt', price: 4500, tip: 5 },
  // floors
  { id: 'zemin-parke', slot: 'zemin', name: 'Açık meşe', price: 0, tip: 0 },
  { id: 'zemin-tatami', slot: 'zemin', name: 'Tatami', price: 1800, tip: 2 },
  { id: 'zemin-dama', slot: 'zemin', name: 'Terrazzo', price: 2200, tip: 2 },
  { id: 'zemin-tas', slot: 'zemin', name: 'Taş döşeme', price: 3000, tip: 3 },
  // big painting
  { id: 'tablo1-yok', slot: 'tablo1', name: 'Boş', price: 0, tip: 0 },
  { id: 'tablo1-fuji', slot: 'tablo1', name: 'Fuji Dağı', price: 1200, tip: 2 },
  { id: 'tablo1-dalga', slot: 'tablo1', name: 'Büyük Dalga', price: 2500, tip: 3 },
  { id: 'tablo1-koi', slot: 'tablo1', name: 'Koi balıkları', price: 2000, tip: 3 },
  { id: 'tablo1-vinc', slot: 'tablo1', name: 'Turnalar', price: 3200, tip: 4 },
  // small art
  { id: 'tablo2-yok', slot: 'tablo2', name: 'Boş', price: 0, tip: 0 },
  { id: 'tablo2-kaligrafi', slot: 'tablo2', name: 'Kaligrafi "Lezzet"', price: 800, tip: 1 },
  { id: 'tablo2-kedi', slot: 'tablo2', name: 'Mochi posteri', price: 1000, tip: 2 },
  { id: 'tablo2-sakura', slot: 'tablo2', name: 'Sakura dalı', price: 1400, tip: 2 },
  // lamps
  { id: 'lamba-chochin', slot: 'lamba', name: 'Kâğıt fenerler', price: 0, tip: 0 },
  { id: 'lamba-kure', slot: 'lamba', name: 'Akari küreler', price: 1600, tip: 2 },
  { id: 'lamba-ampul', slot: 'lamba', name: 'Hasır sarkıtlar', price: 2400, tip: 3 },
  { id: 'lamba-renkli', slot: 'lamba', name: 'Renkli festival fenerleri', price: 3600, tip: 4 },
  // tables
  { id: 'masa-yok', slot: 'masa', name: 'Sadece tezgâh', price: 0, tip: 0 },
  { id: 'masa-iki', slot: 'masa', name: 'İki masa', price: 0, tip: 0 },
  { id: 'masa-dort', slot: 'masa', name: 'Dört masa', price: 5000, tip: 6 },
  // table style
  { id: 'masaStil-mese', slot: 'masaStil', name: 'Açık meşe', price: 0, tip: 0 },
  { id: 'masaStil-ceviz', slot: 'masaStil', name: 'Koyu ceviz', price: 1500, tip: 1 },
  { id: 'masaStil-mermer', slot: 'masaStil', name: 'Beyaz mermer', price: 2800, tip: 2 },
  { id: 'masaStil-lake', slot: 'masaStil', name: 'Kırmızı lake', price: 3200, tip: 3 },
  // table centerpiece
  { id: 'masaSus-yok', slot: 'masaSus', name: 'Sade', price: 0, tip: 0 },
  { id: 'masaSus-vazo', slot: 'masaSus', name: 'Sakura vazosu', price: 900, tip: 1 },
  { id: 'masaSus-mum', slot: 'masaSus', name: 'Mum ve çay seti', price: 1200, tip: 2 },
  { id: 'masaSus-bonsai', slot: 'masaSus', name: 'Mini bonsai', price: 1600, tip: 2 },
  // plants
  { id: 'bitki-yok', slot: 'bitki', name: 'Yok', price: 0, tip: 0 },
  { id: 'bitki-bambu', slot: 'bitki', name: 'Bambu saksıları', price: 900, tip: 1 },
  { id: 'bitki-bonsai', slot: 'bitki', name: 'Bonsai ve monstera', price: 1800, tip: 2 },
  { id: 'bitki-orman', slot: 'bitki', name: 'Yeşil köşe', price: 3000, tip: 3 },
  // neon
  { id: 'neon-yok', slot: 'neon', name: 'Yok', price: 0, tip: 0 },
  { id: 'neon-ramen', slot: 'neon', name: 'ラーメン neon', price: 2500, tip: 3 },
  { id: 'neon-kase', slot: 'neon', name: 'Kase & çubuk neon', price: 3500, tip: 4 },
  // counter decoration
  { id: 'tezgah-sade', slot: 'tezgah', name: 'Sade', price: 0, tip: 0 },
  { id: 'tezgah-maneki', slot: 'tezgah', name: 'Maneki-neko', price: 1500, tip: 3 },
  { id: 'tezgah-cicek', slot: 'tezgah', name: 'İkebana çiçek', price: 1200, tip: 2 },
  // special
  { id: 'ozel-yok', slot: 'ozel', name: 'Yok', price: 0, tip: 0 },
  { id: 'ozel-akvaryum', slot: 'ozel', name: 'Akvaryum', price: 5000, tip: 5 },
  { id: 'ozel-pikap', slot: 'ozel', name: 'Pikap ve plaklar', price: 4000, tip: 4 },
];

export type DecorState = Record<Slot, string>;

export const DEFAULT_DECOR: DecorState = {
  duvar: 'duvar-ahsap',
  zemin: 'zemin-parke',
  tablo1: 'tablo1-yok',
  tablo2: 'tablo2-yok',
  lamba: 'lamba-chochin',
  masa: 'masa-iki',
  masaStil: 'masaStil-mese',
  masaSus: 'masaSus-yok',
  bitki: 'bitki-yok',
  neon: 'neon-yok',
  tezgah: 'tezgah-sade',
  ozel: 'ozel-yok',
};

export const DEFAULT_OWNED = DECOR.filter((d) => d.price === 0).map((d) => d.id);

/** Fill in slots added after a save was made. */
export function withDefaults(d?: Partial<DecorState>): DecorState {
  return { ...DEFAULT_DECOR, ...(d ?? {}) };
}

export function tipBonus(decor: DecorState): number {
  return Object.values(decor).reduce((s, id) => s + (DECOR.find((d) => d.id === id)?.tip ?? 0), 0);
}
