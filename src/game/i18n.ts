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
  const saved = localStorage.getItem('yuki.lang');
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
    localStorage.setItem('yuki.lang', l);
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
  title: { tr: 'Yuki Sushi', en: 'Yuki Sushi' },
  subtitle: { tr: 'Karlı Liman’da bir sushi kulübesi', en: 'A sushi hut on Snowy Harbor' },
  play: { tr: 'Oyna', en: 'Play' },
  continue: { tr: 'Devam', en: 'Continue' },
  day: { tr: 'Gün {n}', en: 'Day {n}' },
  start: { tr: 'Pencereyi aç', en: 'Open the window' },
  next: { tr: 'İleri', en: 'Next' },
  back: { tr: 'Geri', en: 'Back' },
  skip: { tr: 'Geç', en: 'Skip' },
  done: { tr: 'Başla!', en: "Let's go!" },
  close: { tr: 'Kapat', en: 'Close' },
  decor: { tr: 'Süsle', en: 'Decorate' },
  chart: { tr: 'Gün grafiği', en: 'Day chart' },
  locked: { tr: 'Kilitli', en: 'Locked' },
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
  // work table
  serve: { tr: 'Servis et', en: 'Serve' },
  pack: { tr: 'Paketle', en: 'Pack it' },
  give: { tr: 'Ver', en: 'Give' },
  clear: { tr: 'Temizle', en: 'Clear' },
  bill: { tr: 'Hesap', en: 'Bill' },
  paid: { tr: 'Verilen', en: 'Paid' },
  change: { tr: 'Para üstü', en: 'Change' },
  youGive: { tr: 'Senin verdiğin', en: 'You give' },
  toolMat: { tr: 'Hasır', en: 'Mat' },
  toolKnife: { tr: 'Sashimi', en: 'Sashimi' },
  toolTorch: { tr: 'Pürmüz', en: 'Torch' },
  toolTrash: { tr: 'Çöp', en: 'Bin' },
  plates: { tr: 'Tabak', en: 'Plate' },
  online: { tr: 'Online sipariş', en: 'Online order' },
  tabletRinging: { tr: 'Nefis’ten sipariş!', en: 'Order on Yumm!' },
  accept: { tr: 'Siparişi al', en: 'Take order' },
  // mini games
  mMaki: { tr: 'Maki sar', en: 'Roll maki' },
  mSashimi: { tr: 'Sashimi kes', en: 'Cut sashimi' },
  bRice: { tr: 'Pirinci yaymak için basılı tut', en: 'Hold to spread rice' },
  bFill: {
    tr: 'İç malzemeleri seç, sonra hasırı yukarı kaydır',
    en: 'Pick fillings, then slide the mat up',
  },
  bRoll: { tr: 'Hasırı yukarı kaydır ya da basılı tut', en: 'Slide the mat up or press and hold' },
  bCut: { tr: 'Çizgi yeşildeyken dokun!', en: 'Tap when the line is green!' },
  bCutSashimi: {
    tr: 'Kalınlık için doğru anda dokun',
    en: 'Tap at the right moment for thickness',
  },
  bPickFish: { tr: 'Hangi balık?', en: 'Which fish?' },
  bSlices: { tr: '{n} dilim', en: '{n} slices' },
  bPieces: { tr: '{n} parça', en: '{n} pieces' },
  bCoat: { tr: 'Dışı', en: 'Outside' },
  hoso: { tr: 'Hoso', en: 'Hoso' },
  futo: { tr: 'Futo', en: 'Futo' },
  ura: { tr: 'Ura', en: 'Ura' },
  torchHint: { tr: 'Somon nigiriye basılı tut', en: 'Press and hold on a salmon nigiri' },
  // gauges (painted on canvas)
  gLess: { tr: 'az', en: 'less' },
  gJust: { tr: 'tam', en: 'just right' },
  gMore: { tr: 'fazla', en: 'too much' },
  gRaw: { tr: 'çiğ', en: 'raw' },
  gDone: { tr: 'tam', en: 'done' },
  gOver: { tr: 'fazla', en: 'over' },
  gBurnt: { tr: 'yanık', en: 'burnt' },
  gThin: { tr: 'ince', en: 'thin' },
  gNormal: { tr: 'normal', en: 'regular' },
  gThick: { tr: 'kalın', en: 'thick' },
  gSlow: { tr: 'yavaş', en: 'slow' },
  gGood: { tr: 'iyi', en: 'good' },
  gFast: { tr: 'hızlı', en: 'fast' },
  tipJar: { tr: 'BAHŞİŞ', en: 'TIPS' },
  order: { tr: 'SİPARİŞ', en: 'ORDER' },
  // feedback
  perfectCut: { tr: 'Kusursuz!', en: 'Perfect!' },
  crooked: { tr: 'Eğri', en: 'Crooked' },
  next1: { tr: 'Önce tabağa pirinç topu koy', en: 'Place a rice ball on the plate first' },
  plateFull: { tr: 'Tabak dolu', en: 'Plate is full' },
  onPiece: { tr: 'Bunu bir parçanın üstüne koy', en: 'Put this on top of a piece' },
  noCustomer: { tr: 'Henüz sipariş yok', en: 'No order yet' },
  plateEmpty: { tr: 'Tabak boş', en: 'The plate is empty' },
  dayOver: { tr: 'Kulübe kapandı!', en: 'Hut closed!' },
  courier: { tr: 'Kızak kurye geldi', en: 'The sled courier is here' },
  newReview: { tr: 'Yeni yorum', en: 'New review' },
  // ledger & chart
  ledger: { tr: 'Gün sonu', en: 'End of day' },
  sales: { tr: 'Satış', en: 'Sales' },
  tips: { tr: 'Bahşiş', en: 'Tips' },
  ingredients: { tr: 'Malzeme', en: 'Ingredients' },
  waste: { tr: 'İsraf', en: 'Waste' },
  overpaid: { tr: 'Fazla para üstü', en: 'Extra change' },
  freebies: { tr: 'İkramlar', en: 'On the house' },
  rent: { tr: 'Kulübe kirası', en: 'Hut rent' },
  bonus: { tr: 'Özel misafir', en: 'Special guest' },
  net: { tr: 'Net kâr', en: 'Net profit' },
  served: { tr: 'Müşteri', en: 'Customers' },
  walkouts: { tr: 'Kaçan', en: 'Walk-outs' },
  wallet: { tr: 'Kumbara', en: 'Savings' },
  rating: { tr: 'Nefis puanı', en: 'Yumm rating' },
  goal: { tr: 'Festival hedefi', en: 'Festival goal' },
  todayRating: { tr: 'Bugünün ortalaması', en: 'Today’s average' },
  profit: { tr: 'Kâr', en: 'Profit' },
  // decor
  buy: { tr: 'Al', en: 'Buy' },
  equip: { tr: 'Kullan', en: 'Use' },
  inUse: { tr: 'Kullanılıyor', en: 'In use' },
  tipBonus: { tr: '+%{n} bahşiş', en: '+{n}% tips' },
  // Yumm app
  app: { tr: 'Nefis', en: 'Yumm' },
  appSummary: { tr: 'Özet', en: 'Summary' },
  appReviews: { tr: 'Yorumlar', en: 'Reviews' },
  appOrders: { tr: 'Siparişler', en: 'Orders' },
  appDays: { tr: 'Günler', en: 'Days' },
  fAll: { tr: 'Tümü', en: 'All' },
  fGood: { tr: 'Olumlu', en: 'Positive' },
  fBad: { tr: 'Olumsuz', en: 'Negative' },
  fOpen: { tr: 'Cevapsız', en: 'Unanswered' },
  reviewsN: { tr: '{n} yorum', en: '{n} reviews' },
  replyBtn: { tr: 'Cevap ver', en: 'Reply' },
  ownerReply: { tr: 'Yuki Sushi’nin cevabı', en: 'Reply from Yuki Sushi' },
  replyKind: {
    tr: 'Haklısınız, özür dileriz. Bir dahakine çok daha iyisini yapacağız!',
    en: 'You’re right, we’re sorry. We’ll do much better next time!',
  },
  replyThanks: { tr: 'Çok teşekkürler, yine bekleriz!', en: 'Thank you so much, see you again!' },
  replyRude: {
    tr: 'Bence gayet güzeldi, siz anlamamışsınız.',
    en: 'I think it was great, you just didn’t get it.',
  },
  noOrders: { tr: 'Online siparişler 8. günde başlar.', en: 'Online orders start on day 8.' },
  delivered: { tr: 'Teslim edildi', en: 'Delivered' },
  open: { tr: 'Bekliyor', en: 'Waiting' },
  topTags: { tr: 'En çok söylenenler', en: 'What people mention' },
  trend: { tr: 'Gün gün puan', en: 'Rating by day' },
  liked: { tr: '{n} kişi faydalı buldu', en: '{n} found this helpful' },
  before: { tr: 'Önceden', en: 'Before' },
  daysLeft: { tr: 'Festivale {n} gün', en: '{n} days to festival' },
} satisfies Record<string, L>;

export function t(k: keyof typeof UI, vars?: Record<string, string | number>) {
  return tx(UI[k], vars);
}
