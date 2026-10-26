// Strings for the counter-tablet apps (Turkish, English). Kept apart from game/i18n.ts.
import { getLang } from '../game/i18n';

const S = {
  pct: ['%{n}', '{n}%'],
  // home
  'home.hello.sabah': ['Günaydın, şef!', 'Good morning, chef!'],
  'home.hello.ogle': ['Afiyet olsun, şef!', 'Busy lunch, chef!'],
  'home.hello.gunbatimi': ['İyi akşamüstüleri!', 'Golden hour, chef!'],
  'home.hello.aksam': ['İyi akşamlar, şef!', 'Good evening, chef!'],
  'home.widget': ['Bugün {n} kâse · {m}', '{n} bowls today · {m}'],
  // app names
  'app.reviews': ['Yorumlar', 'Reviews'],
  'app.orders': ['Siparişler', 'Orders'],
  'app.pantry': ['Malzemeler', 'Pantry'],
  'app.cash': ['Kasa', 'Register'],
  'app.cam': ['Mochi Kam', 'Mochi Cam'],
  'app.weather': ['Hava', 'Weather'],
  'app.chat': ['Mesajlar', 'Messages'],
  'app.stars': ['Yıldızlarım', 'My Stars'],
  'app.recipe': ['Tarif Defteri', 'Recipe Book'],
  'app.music': ['Müzik', 'Music'],
  // reviews
  'rev.count': ['{n} yorum', '{n} reviews'],
  'rev.count1': ['1 yorum', '1 review'],
  'rev.all': ['Tümü', 'All'],
  'rev.bad': ['Şikâyetler', 'Complaints'],
  'rev.delivery': ['Paket', 'Delivery'],
  'rev.helpful': ['Faydalı', 'Helpful'],
  'rev.emptyTitle': ['Henüz yorum yok', 'No reviews yet'],
  'rev.emptyText': [
    'Müşterilere güzel bir kâse hazırla — yorumlar burada belirecek.',
    'Serve a lovely bowl — customer reviews will show up here.',
  ],
  'rev.emptyFilter': ['Bu filtrede yorum yok.', 'No reviews match this filter.'],
  'rev.badge': ['Paket', 'Delivery'],
  'rev.today': ['Bugün', 'Today'],
  'rev.great': ['Mahallenin gözdesi!', 'Neighbourhood favourite!'],
  'rev.good': ['Müşteriler memnun', 'Customers are happy'],
  'rev.ok': ['Fena değil, gelişiyor', 'Not bad — getting better'],
  'rev.low': ['Biraz özen lazım', 'Needs some care'],
  // orders
  'ord.open': ['Hazırlanıyor', 'In progress'],
  'ord.done': ['Teslim edildi', 'Delivered'],
  // cash
  'cash.earned': ['Bugünkü kazanç', 'Earned today'],
  'cash.bowls': ['Servis edilen kâse', 'Bowls served'],
  'cash.tips': ['Bahşiş', 'Tips'],
  'cash.jar': ['Kavanozda {n} bahşiş', '{n} tips in the jar'],
  'cash.happy': ['Ortalama memnuniyet', 'Avg. happiness'],
  'cash.complaints': ['Şikâyet', 'Complaints'],
  'cash.lost': ['Kaçan müşteri', 'Walked out'],
  'cash.chart': ['Müşteri memnuniyeti', 'Customer happiness'],
  'cash.noChart': [
    'İlk müşterini servis edince grafik burada çıkacak.',
    'Serve your first customer to see the chart here.',
  ],
  'cash.sales': ['Satış', 'Sales'],
  // cam
  'cam.live': ['CANLI', 'LIVE'],
  'cam.hint': ['Mochi’yi sevmek için dokun', 'Tap to pet Mochi'],
  'cam.pets': ['{n} sevgi', '{n} pets'],
  'cam.room': ['Arka oda · kamera 1', 'Back room · cam 1'],
  // weather
  'w.sabah': ['Sabah', 'Morning'],
  'w.ogle': ['Öğle', 'Noon'],
  'w.gunbatimi': ['Gün batımı', 'Sunset'],
  'w.aksam': ['Akşam', 'Evening'],
  'w.sunny': ['Güneşli', 'Sunny'],
  'w.clear': ['Açık', 'Clear'],
  'w.cloudy': ['Parçalı bulutlu', 'Partly cloudy'],
  'w.rain': ['Yağmurlu', 'Rainy'],
  'w.city': ['Fener Sokağı', 'Lantern Street'],
  'w.feels': ['Hissedilen {n}°', 'Feels like {n}°'],
  'w.hourly': ['Saatlik', 'Hourly'],
  'w.tipRain': [
    'Yağmurda herkes sıcak çorba ister — paket siparişler artabilir!',
    'Rain makes everyone crave hot soup — expect more deliveries!',
  ],
  'w.tipSun': [
    'Güzel bir gün! Kapının önünden çok kişi geçer.',
    'Lovely day! Lots of people will walk past the door.',
  ],
  'w.tipNight': [
    'Akşam yemeği saati: gruplar gelebilir, hazırlıklı ol.',
    'Dinner time: groups may come in — be ready.',
  ],
  'w.humidity': ['Nem', 'Humidity'],
  'w.wind': ['Rüzgâr', 'Wind'],
  'w.soup': ['Çorba endeksi', 'Soup index'],
  // stars
  'st.total': ['{n} / {m} yıldız', '{n} / {m} stars'],
  'st.days': ['{n} gün tamamlandı', '{n} days completed'],
  'st.act': ['{n}. Bölüm', 'Act {n}'],
  'st.perfect': ['{n} gün üç yıldız', '{n} three-star days'],
  'st.tip': [
    'Bir günü tekrar oynayarak yıldızlarını artırabilirsin.',
    'Replay a day to earn more stars.',
  ],
  // recipe
  'rec.title': ['Hana Nine’nin notları', 'Hana’s notes'],
  'rec.sub': ['Mükemmel kâsenin sırları', 'Secrets of a perfect bowl'],
  // music
  'mus.track': ['Fener Sokağı Lo-fi', 'Lantern Street Lo-fi'],
  'mus.artist': ['Noodles Radyo', 'Noodles Radio'],
  'mus.on': ['Çalıyor', 'Playing'],
  'mus.off': ['Durduruldu', 'Paused'],
  'mus.play': ['Çal', 'Play'],
  'mus.pause': ['Durdur', 'Pause'],
  'mus.note': [
    'Mutfakta müzik olunca eriştenin tadı bile güzelleşir. (Öyle derler.)',
    'Noodles taste better with music in the kitchen. (So they say.)',
  ],
  // chat
  'chat.title': ['Mesajlar', 'Messages'],
  'chat.now': ['şimdi', 'now'],
  'chat.read': ['Görüldü', 'Seen'],
  'chat.placeholder': ['Mesaj yaz…', 'Message…'],
  'chat.mahalle': ['Fener Sokağı Grubu', 'Lantern Street Group'],
} as const;

export type TKey = keyof typeof S;

/** Tablet UI string with {vars}; format money with `fmt` before passing it. */
export function TT(key: TKey, vars?: Record<string, string | number>): string {
  let s: string = S[key][getLang() === 'tr' ? 0 : 1];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Pick the language half of an inline [tr, en] pair. */
export const tl = (p: readonly [string, string]) => (getLang() === 'tr' ? p[0] : p[1]);

// ---------- longer bilingual content ----------

type Pair = readonly [string, string];

export const RECIPE_TIPS: { icon: string; title: Pair; text: Pair }[] = [
  {
    icon: '🧾',
    title: ['Fişi iki kez oku', 'Read the ticket twice'],
    text: [
      'Erişte, çorba, malzemeler, pişirme — her şey fişte yazar. Acele edip bir şeyi atlama.',
      'Noodles, broth, toppings, cooking — it is all on the ticket. Don’t rush past a line.',
    ],
  },
  {
    icon: '🥢',
    title: ['Doğru erişte, doğru kalınlık', 'Right noodle, right thickness'],
    text: [
      'İnce, orta ya da kalın mı istiyor? Tepsinin yanındaki düğmeden seç.',
      'Thin, medium or thick? Choose it with the buttons next to the tray.',
    ],
  },
  {
    icon: '🫖',
    title: ['Çorba çizgiye kadar', 'Broth up to the line'],
    text: [
      'Tencereyi basılı tut, kasedeki çizgide bırak. Az olursa üzülür, taşarsa israf olur.',
      'Hold the pot and let go at the line. Too little is sad, too much is waste.',
    ],
  },
  {
    icon: '🥚',
    title: ['Sayıya dikkat', 'Count your toppings'],
    text: [
      '“3 dilim” tam 3 demek. “Bol” en az 5 parça. İstemediği şeyi asla koyma!',
      '“3 slices” means exactly 3. “Lots of” means at least 5. Never add what they didn’t ask for!',
    ],
  },
  {
    icon: '🔥',
    title: ['Kıvamı yakala', 'Catch the right doneness'],
    text: [
      'Çiğ → diri → tam → yumuşak → lapa. Fişteki seviyeye gelince hemen al.',
      'Raw → firm → perfect → soft → mushy. Take it off the moment it hits the ticket’s level.',
    ],
  },
  {
    icon: '💴',
    title: ['Para üstünü say', 'Count the change'],
    text: [
      'Sarı kutudaki kadar para üstü ver. Fazlası kasadan gider!',
      'Give exactly the change in the yellow box. Extra comes out of your pocket!',
    ],
  },
  {
    icon: '⏱️',
    title: ['Hız da lezzettir', 'Speed is flavour too'],
    text: [
      'Bekleyen müşterinin mutluluk çubuğu azalır. Hazırlarken bir sonrakini düşün.',
      'A waiting customer’s happiness drains. Plan the next bowl while you cook.',
    ],
  },
  {
    icon: '🙇',
    title: ['Hata olursa özür dile', 'Say sorry when it goes wrong'],
    text: [
      'Şikâyet eden müşteriden özür dile. Güzel bir yorum, bir hatadan daha uzun yaşar.',
      'Apologise when someone complains. A kind review lasts longer than one mistake.',
    ],
  },
];

export type ChatWho = 'hana' | 'ruzgar' | 'mochi' | 'lezzetova' | 'mahalle';

/** Message pools per contact; the day number picks which lines show. `from` = first day it can appear. */
export const CHAT: { who: ChatWho; from: number; lines: Pair[] }[] = [
  {
    who: 'hana',
    from: 1,
    lines: [
      [
        'Evladım, kepengi açtın mı? Çorbayı kısık ateşte unutma 🍜',
        'Did you open the shutters, dear? Keep the broth on a low flame 🍜',
      ],
      [
        'Bugün mahalle sana bakıyor. Gülümse, gerisi gelir.',
        'The street is watching today. Smile — the rest follows.',
      ],
      [
        'Yumurtayı tam kıvamında alırsan dünyalar senin olur.',
        'Get the egg just right and the world is yours.',
      ],
      ['Seninle gurur duyuyorum. Gerçekten.', 'I am proud of you. Truly.'],
      [
        'Yorulursan bir bardak çay iç, sonra devam.',
        'If you get tired, have a cup of tea, then carry on.',
      ],
      [
        'Bir kâse, bir gülümse. Hepsi bu kadar basit.',
        'One bowl, one smile. That is all it takes.',
      ],
    ],
  },
  {
    who: 'ruzgar',
    from: 10,
    lines: [
      [
        'Selam şef! Motor hazır, paketleri sıcak sıcak götürürüm 🛵',
        'Hey chef! Scooter’s ready — I’ll deliver them piping hot 🛵',
      ],
      [
        'Uygulamada puanımız yükseliyor, devam!',
        'Our rating in the app is going up — keep it coming!',
      ],
      ['Yağmur yağsa da gelirim, merak etme ☔', 'Rain or shine, I’ll be there ☔'],
      [
        'Kutunun kapağını sıkı kapat, virajlar sert!',
        'Close the box lid tight — the corners are sharp!',
      ],
      ['Bugün rekor kıralım mı? 😎', 'Shall we break a record today? 😎'],
    ],
  },
  {
    who: 'mochi',
    from: 1,
    lines: [
      ['Miyav.', 'Meow.'],
      ['Miyav miyav? (Balık var mı?)', 'Meow meow? (Is there fish?)'],
      ['Mrrr… 😴', 'Mrrr… 😴'],
      ['Miyav! (Tezgâhın üstü sıcakmış.)', 'Meow! (The counter is warm.)'],
    ],
  },
  {
    who: 'mahalle',
    from: 2,
    lines: [
      [
        'Manav Sabri: Taze yeşil soğan geldi, ayırdım sana!',
        'Sabri the grocer: Fresh spring onions in — I saved you some!',
      ],
      ['Ayşe Teyze: Torunum çorbanıza bayıldı 💕', 'Auntie Ayşe: My grandson loved your soup 💕'],
      ['Berber Cemil: Akşam bir kâse ayırın bana!', 'Cemil the barber: Save me a bowl tonight!'],
      ['Okul çıkışı geliyoruz! 🎒', 'Coming after school! 🎒'],
    ],
  },
  {
    who: 'lezzetova',
    from: 25,
    lines: [
      ['Kâselerinizi izliyorum. Etkileyici.', 'I have been watching your bowls. Impressive.'],
      [
        'Rehberim için not aldım: “samimi ve lezzetli”.',
        'Note for my guide: “warm and delicious”.',
      ],
    ],
  },
];
