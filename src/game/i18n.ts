// Language state + UI strings. Data strings (ingredients, story, decor…) are Turkish in the
// data files and translated through `L()` using the map in ./i18n-data.
import { DATA_EN } from './i18n-data';
import { clearSprites } from '../art/common';
import { SALON_LABELS } from '../art/salon';
import { PREP_LABELS } from '../art/prep';
import { fmt } from './money';

export type Lang = 'tr' | 'en';
let lang: Lang = 'tr';
const listeners = new Set<() => void>();

export function getLang(): Lang {
  return lang;
}
export function setLang(l: Lang) {
  lang = l;
  document.documentElement.lang = l;
  // labels painted into cached canvas scenes
  SALON_LABELS.open = l === 'tr' ? 'AÇIK' : 'OPEN';
  SALON_LABELS.tips = l === 'tr' ? 'bahşiş' : 'tips';
  SALON_LABELS.newOrder = l === 'tr' ? 'Yeni sipariş!' : 'New order!';
  PREP_LABELS.zones = l === 'tr' ? null : ['Raw', 'Firm', 'Perfect', 'Soft', 'Mushy', 'Burnt'];
  PREP_LABELS.gauge = l === 'tr' ? null : ['low', 'full', 'over'];
  clearSprites('salon:');
  clearSprites('prep:');
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
  // an entry may hold several variants per language: one is picked at random each time
  const e = UI[key] as readonly (string | readonly string[])[];
  const v = lang === 'tr' ? e[0] : e[1];
  let s: string = typeof v === 'string' ? v : v[Math.floor(Math.random() * v.length)];
  if (vars)
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\$\\{${k}\\}`, 'g'), fmt(Number(v))); // ${x} = money
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
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
  'play.howto': ['❓ Nasıl oynanır?', '❓ How to play'],
  'play.apologize': ['🙏 Özür dile', '🙏 Apologize'],
  'play.serveTo': ['Kime: {n}', 'For: {n}'],
  // cash
  'cash.bill': ['Hesap', 'Bill'],
  'cash.given': ['Verilen', 'Paid'],
  'cash.change': ['Para üstü', 'Change'],
  'cash.giving': ['Verdiğin', 'You give'],
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
  'end.title': ['Noodles yaşıyor', 'Noodles lives on'],
  'end.text': [
    'Fener Sokağı’nın son noodle dükkânı, mahallenin kalbi oldu. Mochi tezgâhın üstünde mırlıyor, Hana Nine pencerede gülümsüyor.',
    'The last noodle shop on Lantern Street became the heart of the neighbourhood. Mochi purrs on the counter, Grandma Hana smiles at the window.',
  ],
  'end.cash': ['Kasada {n}', '{n} in the till'],
  'end.more': [
    'Üç yıldız toplamak için günleri tekrar oynayabilir, kazandığın parayla dükkânı dekore edebilirsin.',
    'Replay days to collect three stars and decorate the shop with what you earned.',
  ],
  // tablet
  'tab.home': ['Ana ekran', 'Home'],
  'tab.day': ['{n}. Gün', 'Day {n}'],
  'tab.reviews': ['Yorumlar', 'Reviews'],
  'tab.orders': ['Siparişler', 'Orders'],
  'tab.pantry': ['Malzemeler', 'Pantry'],
  'tab.none': ['Henüz yorum yok', 'No reviews yet'],
  'tab.noReviews': [
    'Henüz kimse yorum yazmadı. İlk kaseyi servis et!',
    'Nobody has written a review yet. Serve the first bowl!',
  ],
  'tab.openN': ['{n} hazırlanıyor', '{n} in progress'],
  'tab.deliveredN': ['{n} teslim edildi', '{n} delivered'],
  'tab.itemsN': ['{n} malzeme', '{n} items'],
  'tab.openOrders': ['Hazırlanan siparişler', 'Orders in progress'],
  'tab.noOpen': ['Şu an açık paket siparişi yok.', 'No open delivery orders right now.'],
  'tab.pastOrders': ['Teslim edilenler', 'Delivered'],
  'tab.noPast': ['Henüz paket siparişi teslim edilmedi.', 'No deliveries yet.'],
  'tab.preparing': ['hazırlanıyor…', 'preparing…'],
  'tab.bowls': ['Kaseler', 'Bowls'],
  // in-game lines
  'g.phoneGreet': ['Paket siparişi!', 'Delivery order!'],
  'g.waited': [
    [
      'Ben gidiyorum, çok bekledim.',
      'Kusura bakma, daha fazla bekleyemem.',
      'Off… Başka zaman artık.',
    ],
    [
      'I’m going, I’ve waited too long.',
      'Sorry, I can’t wait any longer.',
      'Ugh… maybe another time.',
    ],
  ],
  'g.waitedPhone': [
    'Çok bekledim, siparişi iptal ediyorum!',
    'I waited too long, cancelling the order!',
  ],
  'g.app': ['Uygulama', 'App'],
  'g.onTheWay': ['Paket yolda! ', 'Delivery on its way! '],
  'g.lessChange': [
    [
      'Bir saniye… para üstü eksik galiba.',
      'Hmm, bu eksik sanki.',
      'Tekrar sayar mısın? Eksik geldi.',
    ],
    [
      'Hang on… I think the change is short.',
      'Hmm, this looks short.',
      'Could you count again? It’s short.',
    ],
  ],
  'g.moreChange': [
    ['Bu biraz fazla oldu ama… peki, sağ ol.', 'Fazla verdin galiba. Neyse, teşekkürler.'],
    ['That’s a bit much, but… okay, thanks.', 'I think you gave me extra. Well, thanks.'],
  ],
  'g.tipBig': [
    [
      'Üstü kalsın. Gerçekten güzeldi.',
      'Şunu da kavanoza atayım. Eline sağlık.',
      'Kalsın, hak ettin.',
    ],
    [
      'Keep the change. That was really good.',
      'Let me drop this in the jar. Well done.',
      'Keep it, you earned it.',
    ],
  ],

  'g.tipSmall': [
    ['Bozukluklar kavanoza.', 'Şu da bahşiş olsun.', 'Küçük bir şey bırakayım.'],
    ['The coins go in the jar.', 'Here’s a little tip.', 'I’ll leave a little something.'],
  ],
  'g.noTip': [
    ['Neyse, kolay gelsin.', 'Hadi iyi günler.', 'Bu sefer bahşiş yok, kusura bakma.'],
    ['Anyway, take care.', 'Have a good day.', 'No tip this time, sorry.'],
  ],
  'g.bill': ['{who}Hesap ${p}. Buyur ${g}{rest}.', '{who}The bill is ${p}. Here’s ${g}{rest}.'],
  'g.billDiscount': [
    '{who}Biraz eksikti, ${off} indirim yap. Hesap ${p}, buyur ${g}.',
    '{who}It wasn’t quite right, take ${off} off. That’s ${p}, here’s ${g}.',
  ],
  'g.freeNow': [
    'Çok bekledim… Bu yemeğin parasını vermem artık!',
    'I’ve waited so long… I’m not paying for this one!',
  ],
  'g.freeToast': [
    '{n} çok bekledi: yemeği bedava olacak',
    '{n} waited too long: their meal is free',
  ],
  'g.freeMeal': [
    'Bu kadar bekledikten sonra ödemiyorum. Paramı geri alıyorum!',
    'After that wait, I’m not paying. I’m keeping my money!',
  ],
  'g.replyOk': [
    ['👍 Tamam!', '👍 Anlaşıldı!', '👍 Olur!', '👍 Not aldım.', '👍 Hemen hallediyorum.'],
    ['👍 Okay!', '👍 Got it!', '👍 Sure!', '👍 Noted.', '👍 On it.'],
  ],
  'g.replySoon': [
    ['⏱️ Hemen geliyor!', '⏱️ Birkaç dakikaya hazır.', '⏱️ Hemen başlıyorum!', '⏱️ Çok bekletmem.'],
    [
      '⏱️ Coming right up!',
      '⏱️ Ready in a few minutes.',
      '⏱️ Starting right now!',
      '⏱️ Won’t keep you long.',
    ],
  ],
  'g.replyAgain': [
    [
      '🔁 Tekrar söyler misin?',
      '🔁 Pardon, bir daha?',
      '🔁 Kaçırdım, tekrar alabilir miyim?',
      '🔁 Bir daha söyler misiniz?',
    ],
    [
      '🔁 Say that again?',
      '🔁 Sorry, once more?',
      '🔁 I missed that, again please?',
      '🔁 Could you repeat that?',
    ],
  ],
  'g.replyThanks': [
    ['Sağ ol.', 'Tamamdır.', 'Peki, bekliyorum.', 'Teşekkürler.', 'Tamam.'],
    ['Thanks.', 'Alright.', 'Okay, I’ll wait.', 'Thank you.', 'Okay.'],
  ],
  'g.replyYay': [
    ['İyi, çok acıktım.', 'Süper, bekliyorum.', 'Acelem yok ama iyi olur.', 'Tamam, sağ ol.'],
    ['Good, I’m starving.', 'Great, I’ll wait.', 'No rush, but that’d be nice.', 'Okay, thanks.'],
  ],
  'g.repeatPre': [
    ['Peki, bir daha: ', 'Hmm, tamam. ', 'Dikkatli dinle o zaman: ', 'Az önce söyledim ama… '],
    ['Okay, once more: ', 'Hmm, fine. ', 'Listen carefully then: ', 'I just said it, but… '],
  ],
  'g.react5': [
    [
      'Çok iyiydi, gerçekten.',
      'Bunu yine yerim.',
      'Ellerine sağlık, tam istediğim gibi.',
      'Vay, beklediğimden iyi.',
    ],
    [
      'That was really good.',
      'I’d eat this again.',
      'Well done, just how I wanted it.',
      'Wow, better than I expected.',
    ],
  ],
  'g.react4': [
    ['Güzel olmuş.', 'Lezzetli, sağ ol.', 'İyiydi.', 'Beğendim.'],
    ['That’s nice.', 'Tasty, thanks.', 'It was good.', 'I liked it.'],
  ],
  'g.react3': [
    ['Fena değil.', 'İdare eder.', 'Eh, olmuş sayılır.', 'Normal.'],
    ['Not bad.', 'It’ll do.', 'Eh, close enough.', 'It’s okay.'],
  ],
  'g.react2': [
    ['Pek beğenmedim.', 'Hmm… olmamış biraz.', 'Ben bunu böyle istememiştim.'],
    ['I didn’t really like it.', 'Hmm… not quite right.', 'That’s not how I asked for it.'],
  ],
  'g.react1': [
    ['Bu ne şimdi?', 'Bunu yiyemem.', 'Hiç olmamış, kusura bakma.'],
    ['What is this?', 'I can’t eat this.', 'This is all wrong, sorry.'],
  ],
  'cash.discount': ['indirim', 'discount'],
  'play.dayShort': ['GÜN', 'DAY'],
  'play.happy': ['Mutluluk', 'Happiness'],
  'play.free': ['Bedava!', 'Free!'],
  'g.billAll': ['Hepsi benden. ', 'It’s all on me. '],
  'g.changeWillBe': [', para üstü ${n} olacak', ', change will be ${n}'],
  'g.exactMoney': [', tam para', ', exact amount'],
  'g.complain': [
    ['Şey… {notes}', 'Pardon ama {notes}', 'Hmm. {notes}', 'Bu pek olmamış: {notes}'],
    ['Um… {notes}', 'Excuse me, but {notes}', 'Hmm. {notes}', 'This isn’t quite right: {notes}'],
  ],
  'g.you': ['Sen', 'You'],
  'g.counterBusy': ['Tezgâh dolu, bir saniye…', 'The counter is busy, one second…'],
  'g.sorry': [
    [
      'Çok özür dilerim, hemen not alıyorum.',
      'Haklısınız, kusura bakmayın.',
      'Özür dilerim, bir daha olmayacak.',
    ],
    [
      'I’m so sorry, I’ll remember that.',
      'You’re right, I apologise.',
      'Sorry, it won’t happen again.',
    ],
  ],

  'g.sorryReply': [
    [
      'Olur öyle şeyler. Ama bu sefer bahşiş yok.',
      'Peki… bir dahakine dikkat et.',
      'Tamam, sorun değil. Ama bahşişi unut.',
    ],
    [
      'These things happen. But no tip this time.',
      'Okay… be careful next time.',
      'Fine, no problem. But forget the tip.',
    ],
  ],
  'g.first': ['Önce ben: ', 'Me first: '],
  'g.last': ['Son olarak ben: ', 'And lastly me: '],
  'g.mine': ['Sıra bende: ', 'My turn: '],
  'g.pickup': ['Benim siparişim hazır mı? Geliyorum!', 'Is my order ready? Coming!'],
  'g.tapHint': [
    'Malzemeyi seçtin. Şimdi kasede istediğin yere dokun; her dokunuş bir parça koyar.',
    'Topping selected. Now tap anywhere in the bowl; each tap places one piece.',
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
  'g.hintTopExact': [
    '{n}: {a}/{b} — kaba dokun, sonra kaseye dokun',
    '{n}: {a}/{b} — tap the tub, then tap the bowl',
  ],
  'g.hintTop': ['{n} — kaba dokun, sonra kaseye dokun', '{n} — tap the tub, then tap the bowl'],
  'g.hintPlace': ['Şimdi kasede istediğin yere dokun', 'Now tap where you want it in the bowl'],
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
  'g.mushy': ['Lapa', 'Mushy'],
  'g.burnt': ['Yanık', 'Burnt'],
  'g.burntToast': ['Eyvah, erişte yandı!', 'Oh no, the noodles burned!'],
  'g.az': ['az', 'low'],
  'g.tam': ['tam', 'full'],
  'g.tasma': ['taşma', 'over'],
} as const;
