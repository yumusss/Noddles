// Two-language support (TR / EN). Every visible string goes through here,
// including labels painted onto the canvas.

export type Lang = 'tr' | 'en';
export interface L {
  tr: string;
  en: string;
}

let lang: Lang = 'tr';
const listeners = new Set<() => void>();

try {
  const saved = localStorage.getItem('sushi.lang');
  if (saved === 'tr' || saved === 'en') lang = saved;
} catch {
  /* storage blocked */
}

export function getLang(): Lang {
  return lang;
}

export function setLang(l: Lang) {
  if (l === lang) return;
  lang = l;
  try {
    localStorage.setItem('sushi.lang', l);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = l;
  listeners.forEach((f) => f());
}

export function onLang(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** pick the current language from a bilingual pair, filling {vars} */
export function tx(s: L, vars?: Record<string, string | number>): string {
  let out = s[lang];
  if (vars) for (const k in vars) out = out.split('{' + k + '}').join(String(vars[k]));
  return out;
}

/** money with the right currency sign */
export function money(n: number): string {
  const v = Math.round(n);
  const neg = v < 0 ? '−' : '';
  return lang === 'tr' ? `${neg}${Math.abs(v)} ₺` : `${neg}$${Math.abs(v)}`;
}

export const UI = {
  title: { tr: 'Nami-ya', en: 'Nami-ya' },
  subtitle: { tr: 'Liman Sushi Barı', en: 'Harbor Sushi Bar' },
  play: { tr: 'Oyna', en: 'Play' },
  continue: { tr: 'Devam', en: 'Continue' },
  day: { tr: 'Gün {n}', en: 'Day {n}' },
  act: { tr: 'Perde {n}', en: 'Act {n}' },
  start: { tr: 'Güne başla', en: 'Start the day' },
  next: { tr: 'İleri', en: 'Next' },
  back: { tr: 'Geri', en: 'Back' },
  skip: { tr: 'Geç', en: 'Skip' },
  done: { tr: 'Başla!', en: "Let's go!" },
  close: { tr: 'Kapat', en: 'Close' },
  map: { tr: 'Harita', en: 'Map' },
  decor: { tr: 'Dekor', en: 'Decor' },
  soon: { tr: 'Yakında', en: 'Coming soon' },
  locked: { tr: 'Kilitli', en: 'Locked' },
  stars: { tr: 'Yıldız', en: 'Stars' },
  pause: { tr: 'Mola', en: 'Pause' },
  resume: { tr: 'Devam et', en: 'Resume' },
  howto: { tr: 'Nasıl oynanır?', en: 'How to play' },
  quit: { tr: 'Haritaya dön', en: 'Back to map' },
  restart: { tr: 'Günü baştan al', en: 'Restart day' },
  sound: { tr: 'Ses', en: 'Sound' },
  music: { tr: 'Müzik', en: 'Music' },
  on: { tr: 'Açık', en: 'On' },
  off: { tr: 'Kapalı', en: 'Off' },
  language: { tr: 'Dil', en: 'Language' },
  // stations
  stSalon: { tr: 'Salon', en: 'Dining' },
  stPrep: { tr: 'Tezgâh', en: 'Counter' },
  stCut: { tr: 'Kesme · Isıtma', en: 'Cut · Heat' },
  // actions
  serve: { tr: 'Servis et', en: 'Serve' },
  pack: { tr: 'Pakete koy', en: 'Pack it' },
  apologize: { tr: 'Özür dile', en: 'Apologize' },
  give: { tr: 'Ver', en: 'Give' },
  clear: { tr: 'Temizle', en: 'Clear' },
  changeDue: { tr: 'Para üstü', en: 'Change' },
  youGive: { tr: 'Veriyorsun', en: 'You give' },
  cancel: { tr: 'Bırak', en: 'Drop' },
  inHand: { tr: 'Elinde', en: 'Holding' },
  left: { tr: '{n} kaldı', en: '{n} left' },
  waiting: { tr: 'Sıradaki', en: 'Up next' },
  closed: { tr: 'Kapanış', en: 'Closing' },
  closingSoon: { tr: 'Dükkân kapanıyor', en: 'Closing time' },
  accept: { tr: 'Siparişi al', en: 'Take order' },
  online: { tr: 'Online sipariş', en: 'Online order' },
  tabletRinging: { tr: 'Tablet çalıyor!', en: 'Tablet ringing!' },
  // tablet
  tReviews: { tr: 'Yorumlar', en: 'Reviews' },
  tOrders: { tr: 'Siparişler', en: 'Orders' },
  tIngredients: { tr: 'Malzemeler', en: 'Ingredients' },
  tNoReviews: { tr: 'Henüz yorum yok.', en: 'No reviews yet.' },
  tNoOrders: {
    tr: 'Paket sipariş yok. 10. günden itibaren gelir.',
    en: 'No delivery orders. They start on day 10.',
  },
  tOpen: { tr: 'Açık', en: 'Open' },
  tDelivered: { tr: 'Teslim edildi', en: 'Delivered' },
  // ledger
  ledger: { tr: 'Gün sonu defteri', en: 'End-of-day ledger' },
  sales: { tr: 'Satış', en: 'Sales' },
  tips: { tr: 'Bahşiş', en: 'Tips' },
  ingredients: { tr: 'Malzeme gideri', en: 'Ingredients' },
  waste: { tr: 'İsraf', en: 'Waste' },
  overpaid: { tr: 'Fazla para üstü', en: 'Extra change given' },
  rent: { tr: 'Kira', en: 'Rent' },
  bills: { tr: 'Faturalar', en: 'Utilities' },
  net: { tr: 'Net kâr', en: 'Net profit' },
  satisfaction: { tr: 'Memnuniyet', en: 'Satisfaction' },
  complaints: { tr: 'Şikâyet', en: 'Complaints' },
  walkouts: { tr: 'Kaçan müşteri', en: 'Walk-outs' },
  served: { tr: 'Servis', en: 'Served' },
  wallet: { tr: 'Kasa', en: 'Savings' },
  bonus: { tr: 'Özel misafir bonusu', en: 'Special guest bonus' },
  // decor
  buy: { tr: 'Al', en: 'Buy' },
  owned: { tr: 'Sende', en: 'Owned' },
  equip: { tr: 'Kullan', en: 'Use' },
  inUse: { tr: 'Kullanılıyor', en: 'In use' },
  tipBonus: { tr: '+%{n} bahşiş', en: '+{n}% tips' },
  // feedback
  ok: { tr: 'Tamam', en: 'OK' },
  perfectCut: { tr: 'Kusursuz!', en: 'Perfect!' },
  crooked: { tr: 'Eğri', en: 'Crooked' },
  // gauges (painted on canvas)
  gLess: { tr: 'az', en: 'less' },
  gJust: { tr: 'tam', en: 'just right' },
  gMore: { tr: 'fazla', en: 'too much' },
  gRaw: { tr: 'çiğ', en: 'raw' },
  gDone: { tr: 'tam', en: 'done' },
  gOver: { tr: 'fazla', en: 'over' },
  gBurnt: { tr: 'yanık', en: 'burnt' },
  gThin: { tr: 'ince', en: 'thin' },
  gNormal: { tr: 'tam', en: 'regular' },
  gThick: { tr: 'kalın', en: 'thick' },
  gSlow: { tr: 'yavaş', en: 'slow' },
  gGood: { tr: 'iyi', en: 'good' },
  gFast: { tr: 'hızlı', en: 'fast' },
  tipJar: { tr: 'BAHŞİŞ', en: 'TIPS' },
  // station 2 board
  bNori: { tr: 'Nori koy', en: 'Lay nori' },
  bTemaki: { tr: 'Temaki', en: 'Temaki' },
  bRice: { tr: 'Pirinci yaymak için basılı tut', en: 'Hold to spread rice' },
  bFill: { tr: 'İç malzeme seç', en: 'Pick fillings' },
  bCoat: { tr: 'Dışı', en: 'Outside' },
  bRoll: { tr: 'Hasırı yukarı kaydırarak sar', en: 'Slide the mat up to roll' },
  bRollHold: { tr: 'ya da basılı tut', en: 'or press and hold' },
  bCut: { tr: 'Çizgi yeşildeyken kes!', en: 'Cut when the line is green!' },
  bCutSashimi: {
    tr: 'Kalınlık için doğru anda dokun',
    en: 'Tap at the right moment for thickness',
  },
  bSlices: { tr: '{n} dilim', en: '{n} slices' },
  bPieces: { tr: '{n} parça', en: '{n} pieces' },
  bFish: { tr: 'Sashimi için balık', en: 'Fish for sashimi' },
  bReset: { tr: 'Tahtayı temizle', en: 'Clear board' },
  bCone: { tr: 'Külah yap', en: 'Roll the cone' },
  bTake: { tr: 'Al!', en: 'Take!' },
  hoso: { tr: 'Hoso (ince)', en: 'Hoso (thin)' },
  futo: { tr: 'Futo (kalın)', en: 'Futo (fat)' },
  ura: { tr: 'Ura (ters)', en: 'Ura (inside-out)' },
  squeeze: { tr: 'Basılı tut, tam kıvamda bırak', en: 'Hold, let go when just right' },
  heatTitle: { tr: 'Isıtma', en: 'Heat' },
  boardTitle: { tr: 'Sarma tahtası', en: 'Rolling board' },
  // HUD
  next1: { tr: 'Önce tabağa pirinç topu koy', en: 'Place a rice ball on the plate first' },
  plateFull: { tr: 'Tabak dolu', en: 'Plate is full' },
  onPiece: { tr: 'Bunu bir parçanın üstüne koy', en: 'Put this on top of a piece' },
  noCustomer: { tr: 'Henüz müşteri yok', en: 'No customer yet' },
  plateEmpty: { tr: 'Tabak boş', en: 'The plate is empty' },
  dayOver: { tr: 'Gün bitti!', en: 'Day over!' },
  newIngredient: { tr: 'Yeni malzeme', en: 'New ingredient' },
  newPlate: { tr: 'Yeni tabak', en: 'New plate' },
  newStation: { tr: 'Yeni istasyon', en: 'New station' },
  courier: { tr: 'Kurye geldi', en: 'Courier is here' },
  oops: { tr: 'Hata', en: 'Oops' },
} satisfies Record<string, L>;

export function t(k: keyof typeof UI, vars?: Record<string, string | number>) {
  return tx(UI[k], vars);
}
