// Language state + UI strings. Data strings (ingredients, story, decor…) are Turkish in the
// data files and translated through `L()` using the map in ./i18n-data.
import { DATA_EN } from './i18n-data';

export type Lang = 'tr' | 'en';
let lang: Lang = 'tr';
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return lang;
}
export function setLang(l: Lang) {
  lang = l;
  document.documentElement.lang = l;
  for (const f of listeners) f();
}
export function onLang(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}

/** Translate a Turkish data string (ingredient/bowl/level/story/decor text). Unknown → unchanged. */
export function L(s: string): string {
  if (lang === 'tr') return s;
  return DATA_EN[s] ?? s;
}

/** UI string by key, with {vars}. */
export function T(key: keyof typeof UI, vars?: Record<string, string | number>): string {
  const e = UI[key];
  let s: string = lang === 'tr' ? e[0] : e[1];
  if (vars)
    for (const [k, v] of Object.entries(vars))
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  return s;
}

// [tr, en]
export const UI = {
  // title
  'title.sub': ['Fener Sokağı’nın son noodle dükkânı', 'The last noodle shop on Lantern Street'],
  'title.open': ['Dükkânı Aç', 'Open the Shop'],
  'title.continue': ['Devam Et', 'Continue'],
  'title.credits': [
    'Karakterler ve çizimler: el yapımı canvas',
    'Characters and art: hand-drawn canvas',
  ],
  'title.fullscreen': ['⤢ Tam ekran', '⤢ Full screen'],
  'title.exitFullscreen': ['⤢ Küçült', '⤢ Exit full screen'],
  // map
  'map.back': ['‹ Geri', '‹ Back'],
  'map.day': ['{n}. Gün', 'Day {n}'],
  'map.customers': ['{n} müşteri', '{n} customers'],
  'map.minutes': ['{n} dk', '{n} min'],
  'map.decor': ['🏮 Dükkânı Dekore Et', '🏮 Decorate the Shop'],
  'map.ending': ['🎉 Finali İzle', '🎉 Watch the Ending'],
  'map.reset': ['İlerlemeyi sıfırla', 'Reset progress'],
  'map.sure': ['Emin misin?', 'Are you sure?'],
  'map.yesReset': ['Evet, sıfırla', 'Yes, reset'],
  'map.cancel': ['Vazgeç', 'Cancel'],
  'map.lang': ['🌐 English', '🌐 Türkçe'],
  // story
  'story.dayHead': ['{n}. Gün', 'Day {n}'],
  'story.dayEnd': ['Gün sonu', 'End of day'],
  'story.skip': ['Geç ⏭', 'Skip ⏭'],
  // unlock
  'unlock.page': ['Tarif defteri · Sayfa {n}', 'Recipe book · Page {n}'],
  'unlock.noodle': ['Erişte', 'Noodle'],
  'unlock.broth': ['Çorba', 'Broth'],
  'unlock.sauce': ['Sos', 'Sauce'],
  'unlock.topping': ['Malzeme', 'Topping'],
  'unlock.newBowl': ['Yeni kase', 'New bowl'],
  'unlock.minutes': ['{n} dakikalık gün', '{n}-minute day'],
  'unlock.phone': ['paket siparişler', 'delivery orders'],
  'unlock.open': ['Kepengi Aç!', 'Open Up!'],
  'unlock.satisfied': ['%{n} memnun', '{n}% happy'],
  // play HUD
  'play.pause': ['Mola', 'Break'],
  'play.resume': ['Devam', 'Resume'],
  'play.restart': ['Günü yeniden başlat', 'Restart the day'],
  'play.toMap': ['Haritaya dön', 'Back to map'],
  'play.sfxOn': ['🔊 Ses açık', '🔊 Sound on'],
  'play.sfxOff': ['🔇 Ses kapalı', '🔇 Sound off'],
  'play.musicOn': ['🎵 Müzik açık', '🎵 Music on'],
  'play.musicOff': ['🎵 Müzik kapalı', '🎵 Music off'],
  'play.salon': ['Salon', 'Dining'],
  'play.prep': ['Tezgâh', 'Counter'],
  'play.stove': ['Ocak', 'Stove'],
  'play.phoneChip': ['📱 Sipariş!', '📱 Order!'],
  'play.order': ['📝 Sipariş', '📝 Order'],
  'play.delivery': ['📱 Paket', '📱 Delivery'],
  'play.goTo': ['{s} bölümüne geç', 'Go to {s}'],
  'play.closing': ['Kepenk kapanıyor…', 'Closing up…'],
  'play.pct': ['%{n}', '{n}%'],
  'play.apologize': ['🙏 Özür dile', '🙏 Apologize'],
  'play.serveTo': ['Kime: {n}', 'For: {n}'],
  // cash
  'cash.bill': ['Hesap', 'Bill'],
  'cash.given': ['Verilen', 'Paid'],
  'cash.change': ['Para üstü', 'Change'],
  'cash.pick': ['Çekmeceden para üstünü seç', 'Pick the change from the drawer'],
  'cash.exact': [' (tam para verdi!)', ' (exact amount!)'],
  'cash.give': ['Para üstünü ver', 'Give the change'],
  'cash.thanks': ['Teşekkürler!', 'Thank you!'],
  'cash.less': ['Eksik oldu, biraz daha ekle.', 'Not enough, add a bit more.'],
  // results
  'res.head': ['{n}. Gün · Gün sonu defteri', 'Day {n} · End-of-day ledger'],
  'res.avg': ['Ortalama memnuniyet', 'Average satisfaction'],
  'res.bowls': ['{n} kase', '{n} bowls'],
  'res.lost': ['{n} müşteri beklemeden gitti', '{n} customers left without waiting'],
  'res.complaints': ['{n} şikâyet', '{n} complaints'],
  'res.changeErr': ['{n} para üstü hatası', '{n} change mistakes'],
  'res.changeOk': ['para üstleri kusursuz', 'perfect change every time'],
  'res.sales': ['Satışlar', 'Sales'],
  'res.tips': ['Bahşişler', 'Tips'],
  'res.ingredients': ['Malzeme gideri', 'Ingredient cost'],
  'res.waste': ['İsraf', 'Waste'],
  'res.overChange': ['Fazla verilen para üstü', 'Change given in excess'],
  'res.rent': ['Kira', 'Rent'],
  'res.utilities': ['Faturalar', 'Utilities'],
  'res.net': ['Net kâr', 'Net profit'],
  'res.cash': ['Kasadaki para', 'Cash in the till'],
  'res.retry': ['Tekrar oyna', 'Play again'],
  'res.next': ['Devam ▸', 'Continue ▸'],
  'res.again': ['Bir daha dene', 'Try again'],
  'res.map': ['Harita', 'Map'],
  'res.tip': [
    'En az %55 memnuniyet gerekiyor. Siparişi dikkatle oku, göstergeleri izle!',
    'You need at least 55% satisfaction. Read the order carefully and watch the gauges!',
  ],
  // decor
  'decor.tip': ['Bahşiş +%{n}', 'Tips +{n}%'],
  'decor.using': ['Kullanılıyor', 'In use'],
  'decor.owned': ['Sende var', 'Owned'],
  'decor.tipItem': ['bahşiş +%{n}', 'tips +{n}%'],
  // ending
  'end.chip': ['Meydan kurtarıldı!', 'The square is saved!'],
  'end.title': ['Noddles yaşıyor', 'Noddles lives on'],
  'end.text': [
    'Fener Sokağı’nın son noodle dükkânı, mahallenin kalbi oldu. Mochi tezgâhın üstünde mırlıyor, Hana Nine pencerede gülümsüyor.',
    'The last noodle shop on Lantern Street became the heart of the neighbourhood. Mochi purrs on the counter, Grandma Hana smiles at the window.',
  ],
  'end.cash': ['Kasada {n}', '{n} in the till'],
  'end.more': [
    'Üç yıldız toplamak için günleri tekrar oynayabilir, kazandığın parayla dükkânı dekore edebilirsin.',
    'Replay days to collect three stars and decorate the shop with what you earned.',
  ],
  // in-game lines
  'g.phoneGreet': ['Paket siparişi!', 'Delivery order!'],
  'g.waited': ['Çok bekledim, gidiyorum!', 'I waited too long, I’m leaving!'],
  'g.waitedPhone': [
    'Çok bekledim, siparişi iptal ediyorum!',
    'I waited too long, cancelling the order!',
  ],
  'g.app': ['Uygulama', 'App'],
  'g.onTheWay': ['Paket yolda! ', 'Delivery on its way! '],
  'g.lessChange': ['Hmm, {n} ₺ olmalıydı, eksik geldi…', 'Hmm, it should be {n} ₺, that’s short…'],
  'g.moreChange': ['Fazla verdin ama… teşekkürler!', 'You gave too much but… thanks!'],
  'g.tipBig': [
    'Bahşiş kavanozuna {n} ₺ bıraktım. Harikaydı!',
    'I left {n} ₺ in the tip jar. That was wonderful!',
  ],
  'g.tipSmall': ['Bahşiş: {n} ₺. Teşekkürler şef!', 'Tip: {n} ₺. Thanks, chef!'],
  'g.noTip': ['Bahşiş yok bu sefer.', 'No tip this time.'],
  'g.bill': ['{who}Hesap {p} ₺. Buyur {g} ₺{rest}.', '{who}The bill is {p} ₺. Here’s {g} ₺{rest}.'],
  'g.billAll': ['Hepsi benden. ', 'It’s all on me. '],
  'g.changeWillBe': [', para üstü {n} ₺ olacak', ', change will be {n} ₺'],
  'g.exactMoney': [', tam para', ', exact amount'],
  'g.complain': ['Hmm, bu doğru değil: {notes}', 'Hmm, that’s not right: {notes}'],
  'g.you': ['Sen', 'You'],
  'g.counterBusy': ['Tezgâh dolu, bir saniye…', 'The counter is busy, one second…'],
  'g.sorry': [
    'Özür dilerim, bir dahakine daha dikkatli olacağım.',
    'I’m sorry, I’ll be more careful next time.',
  ],
  'g.sorryReply': ['Peki… ama bahşiş yok.', 'Fine… but no tip.'],
  'g.first': ['Önce ben: ', 'Me first: '],
  'g.last': ['Son olarak ben: ', 'And lastly me: '],
  'g.mine': ['Sıra bende: ', 'My turn: '],
  'g.pickup': ['Benim siparişim hazır mı? Geliyorum!', 'Is my order ready? Coming!'],
  'g.tapHint': [
    'Malzemeyi parmağınla tutup kaseye bırak.',
    'Pick the topping up with your finger and drop it in the bowl.',
  ],
  'g.bowlFull': ['Kase doldu!', 'The bowl is full!'],
  'g.bowlFirst': ['Önce kaseyi tezgâha koy.', 'Put the bowl on the counter first.'],
  'g.noodleLocked': [
    'Pişen erişte değiştirilemez. Kaseyi çöpe at.',
    'Cooked noodles can’t be swapped. Bin the bowl.',
  ],
  'g.bowlLocked': ['{b} kase {n}. günde raftan iner.', 'The {b} bowl arrives on day {n}.'],
  'g.binned': [
    'Kase boşaltıldı (israf deftere yazıldı).',
    'Bowl emptied (waste goes in the ledger).',
  ],
  'g.overflow': ['Taştı!', 'It overflowed!'],
  'g.toBox': [
    'Paket siparişi kapıdaki kutuya bırak.',
    'Put delivery orders in the box by the door.',
  ],
  'g.noOrder': ['Henüz sipariş yok.', 'No open orders yet.'],
  'g.ringFirst': ['Önce tablete bak!', 'Check the tablet first!'],
  'g.hintRing': ['Tablette yeni sipariş! Dokun.', 'New order on the tablet! Tap it.'],
  'g.hintNoodle': ['Erişteyi koy: {n}', 'Add the noodles: {n}'],
  'g.hintThick': ['Kalınlık: {n}', 'Thickness: {n}'],
  'g.hintFillMore': [
    'Basılı tut, göstergeyi “tam”a getir',
    'Hold to pour until the gauge says “full”',
  ],
  'g.hintFill': ['Basılı tut ve doldur: {n}', 'Hold to pour: {n}'],
  'g.hintTopExact': ['{n}: {a}/{b} — sürükleyip kaseye bırak', '{n}: {a}/{b} — drag into the bowl'],
  'g.hintTop': ['{n} — sürükleyip bırak', '{n} — drag and drop'],
  'g.hintLots': ['Bol ', 'Lots of '],
  'g.hintCarry': [
    'Kaseyi tut, sağa kaydırıp ocağa taşı',
    'Grab the bowl, swipe right and carry it to the stove',
  ],
  'g.hintTake': [
    'Tam zamanı! Kaseyi al, sola kaydır, müşteriye götür',
    'Now! Take the bowl, swipe left, bring it to the customer',
  ],
  'g.hintTakeNow': ['Hemen al!', 'Take it now!'],
  'g.hintWait': ['Bekle… “{n}” olunca al', 'Wait… take it when it says “{n}”'],
  'g.hintBox': ['Paket kutusuna bırak', 'Drop it in the delivery box'],
  'g.hintServe': [
    'Tezgâha, müşterinin önüne bırak',
    'Put it on the counter in front of the customer',
  ],
  'g.waitingLabel': ['⏳ sabır', '⏳ patience'],
  'g.hurry': ['😐 acele!', '😐 hurry!'],
  'g.leaving': ['😠 gidiyor!', '😠 leaving!'],
  'g.thin': ['İnce', 'Thin'],
  'g.medium': ['Orta', 'Medium'],
  'g.thick': ['Kalın', 'Thick'],
  'g.raw': ['Çiğ', 'Raw'],
  'g.dente': ['Diri', 'Firm'],
  'g.perfect': ['Tam kıvam', 'Perfect'],
  'g.soft': ['Yumuşak', 'Soft'],
  'g.burnt': ['Lapa', 'Mushy'],
  'g.az': ['az', 'low'],
  'g.tam': ['tam', 'full'],
  'g.tasma': ['taşma', 'over'],
} as const;
