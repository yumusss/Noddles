// ---------- Ingredients ----------

export type Category = 'noodle' | 'broth' | 'topping';

export interface Ingredient {
  id: string;
  name: string;
  cat: Category;
  color: string;
  price: number;
}

export const INGREDIENTS: Record<string, Ingredient> = {
  // noodles
  ramen: { id: 'ramen', name: 'Ramen', cat: 'noodle', color: '#f6d27a', price: 4 },
  udon: { id: 'udon', name: 'Udon', cat: 'noodle', color: '#fbf0d2', price: 5 },
  soba: { id: 'soba', name: 'Soba', cat: 'noodle', color: '#a8805a', price: 5 },
  pirinc: { id: 'pirinc', name: 'Pirinç Eriştesi', cat: 'noodle', color: '#fffaf0', price: 6 },
  // broths
  shoyu: { id: 'shoyu', name: 'Soya Suyu', cat: 'broth', color: '#9a4f22', price: 3 },
  miso: { id: 'miso', name: 'Miso', cat: 'broth', color: '#d39a4c', price: 4 },
  acili: { id: 'acili', name: 'Acılı Tantan', cat: 'broth', color: '#d8401f', price: 5 },
  tonkotsu: { id: 'tonkotsu', name: 'Kemik Suyu', cat: 'broth', color: '#efdcbc', price: 6 },
  // toppings
  yesil: { id: 'yesil', name: 'Yeşil Soğan', cat: 'topping', color: '#5cb85c', price: 1 },
  yumurta: { id: 'yumurta', name: 'Marine Yumurta', cat: 'topping', color: '#f9a825', price: 2 },
  chashu: { id: 'chashu', name: 'Chashu Et', cat: 'topping', color: '#c97b5a', price: 3 },
  nori: { id: 'nori', name: 'Nori', cat: 'topping', color: '#24402f', price: 1 },
  misir: { id: 'misir', name: 'Mısır', cat: 'topping', color: '#ffd23f', price: 1 },
  mantar: { id: 'mantar', name: 'Shiitake', cat: 'topping', color: '#7a5034', price: 2 },
  aciyag: { id: 'aciyag', name: 'Acı Yağ', cat: 'topping', color: '#e0301e', price: 1 },
  tofu: { id: 'tofu', name: 'Kızarmış Tofu', cat: 'topping', color: '#f1dca7', price: 2 },
  karides: { id: 'karides', name: 'Tempura Karides', cat: 'topping', color: '#ff8a5b', price: 4 },
  naruto: { id: 'naruto', name: 'Naruto', cat: 'topping', color: '#ffffff', price: 2 },
  bambu: { id: 'bambu', name: 'Bambu Filizi', cat: 'topping', color: '#c9a55a', price: 2 },
  susam: { id: 'susam', name: 'Susam', cat: 'topping', color: '#f5ead0', price: 1 },
};

// ---------- Characters ----------

export type CharId = 'hana' | 'sef' | 'miso' | 'ruzgar' | 'baron' | 'lezzetova' | 'mahalle';

export interface Character {
  id: CharId;
  name: string;
  color: string;
}

export const CHARS: Record<CharId, Character> = {
  hana: { id: 'hana', name: 'Hana Nine', color: '#e94f37' },
  sef: { id: 'sef', name: 'Sen', color: '#3ba7ff' },
  miso: { id: 'miso', name: 'Miso (kedi)', color: '#ffb347' },
  ruzgar: { id: 'ruzgar', name: 'Rüzgar', color: '#2ec4b6' },
  baron: { id: 'baron', name: 'Baron Kraker', color: '#8e44ad' },
  lezzetova: { id: 'lezzetova', name: 'Madam Lezzetova', color: '#d4a017' },
  mahalle: { id: 'mahalle', name: 'Mahalleli', color: '#9aa5b1' },
};

export interface Line {
  who: CharId;
  text: string;
}

// ---------- Special customers ----------

export interface SpecialCustomer {
  at: number; // seconds into the day
  look: 'hana' | 'baron' | 'lezzetova' | 'ruzgar';
  name: string;
  order: { noodle: string; broth: string; toppings: string[] };
  greet: string;
  patience?: number;
  bonus: number; // extra coins for a perfect bowl
}

// ---------- Levels ----------

export interface Level {
  id: number;
  title: string;
  subtitle: string;
  duration: number; // seconds
  spawnEvery: [number, number];
  seats: number;
  pots: number;
  patience: number; // base seconds
  maxToppings: [number, number];
  online: number; // 0 = none, otherwise seconds between online orders
  unlock: string[]; // ingredients unlocked this level
  targets: [number, number, number];
  intro: Line[];
  outro: Line[];
  specials?: SpecialCustomer[];
  tip?: string;
}

export const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Açılış Günü',
    subtitle: 'Kırk yıllık kepenk yeniden açılıyor',
    duration: 100,
    spawnEvery: [9, 13],
    seats: 2,
    pots: 2,
    patience: 55,
    maxToppings: [1, 2],
    online: 0,
    unlock: ['ramen', 'shoyu', 'yesil', 'yumurta'],
    targets: [50, 90, 130],
    tip: 'Müşteriye dokun, siparişi al. Mutfakta: erişteyi tencereye at, yeşil bölgede çıkar, suyu dök, malzemeleri koy, servis et!',
    intro: [
      { who: 'hana', text: 'Sonunda geldin evladım! Fener Sokağı seni özledi.' },
      {
        who: 'hana',
        text: 'Kırk yıl bu tezgâhın arkasında durdum. Artık dizlerim eskisi gibi değil.',
      },
      { who: 'sef', text: 'Nine… Noddles’ı gerçekten bana mı bırakıyorsun?' },
      { who: 'hana', text: 'Sana ve Miso’ya. O kedi bu dükkânın asıl patronudur, unutma.' },
      { who: 'miso', text: 'Miyav. (Tezgâhın üstüne kurulur ve seni süzer.)' },
      {
        who: 'hana',
        text: 'Tarif defterimden sadece ilk sayfa kaldı: soya suyu, ramen, yumurta, yeşil soğan.',
      },
      { who: 'hana', text: 'Gerisini… zamanla bulursun. Hadi kepengi kaldır!' },
    ],
    outro: [
      { who: 'hana', text: 'Gördün mü? Mahalle kokuyu alınca koşa koşa geldi.' },
      {
        who: 'mahalle',
        text: '(Kapının altından bir zarf süzülür. Üzerinde mor bir mühür var: “MegaNoodle”.)',
      },
      { who: 'hana', text: 'Hıh. Baron Kraker yine sokağımızı satın almaya çalışıyor. Aldırma.' },
    ],
  },
  {
    id: 2,
    title: 'Mahallenin Tadı',
    subtitle: 'Defterin ikinci sayfası: chashu',
    duration: 110,
    spawnEvery: [8, 11],
    seats: 3,
    pots: 2,
    patience: 52,
    maxToppings: [1, 2],
    online: 0,
    unlock: ['chashu'],
    targets: [65, 115, 170],
    intro: [
      { who: 'sef', text: 'Tezgâhın altında bir sayfa buldum! Yağ lekeleriyle dolu ama okunuyor.' },
      { who: 'hana', text: 'Aaa, chashu tarifim! Bütün gece kısık ateşte… Mahalle buna bayılır.' },
      { who: 'miso', text: 'Miyaaav! (Gözleri chashu’ya kilitlenmiş durumda.)' },
      { who: 'hana', text: 'Bugün tezgâha bir sandalye daha koydum. Kalabalık olacak.' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Manav Sabri: “Çocukluğumun tadı bu! Hana Nine’nin dükkânı geri döndü!”',
      },
      { who: 'hana', text: 'Ağızdan ağıza yayılıyor. Yarın telefon da çalmaya başlar, görürsün.' },
    ],
  },
  {
    id: 3,
    title: 'Rüzgar Geliyor',
    subtitle: 'Online siparişler başlıyor',
    duration: 120,
    spawnEvery: [9, 12],
    seats: 3,
    pots: 2,
    patience: 50,
    maxToppings: [1, 2],
    online: 22,
    unlock: ['nori'],
    targets: [85, 150, 220],
    tip: 'Mutfaktaki telefona dikkat! Online siparişi zamanında kabul et, hazırla ve Rüzgar’a teslim et.',
    intro: [
      {
        who: 'ruzgar',
        text: 'Selaaam! Ben Rüzgar, sokağın en hızlı kuryesi. Motorum vızır vızır!',
      },
      {
        who: 'ruzgar',
        text: 'Uygulamaya dükkânınızı ekledim. Siparişler telefona düşecek, ben kapıyorum!',
      },
      { who: 'sef', text: 'Hem salona hem telefona mı yetişeceğim?' },
      {
        who: 'hana',
        text: 'Ben senin yaşındayken bir elimde kepçe, bir elimde telefon vardı. Yaparsın.',
      },
      { who: 'hana', text: 'Al, üçüncü sayfa: nori. Deniz kokulu yosun yaprakları.' },
    ],
    outro: [
      { who: 'ruzgar', text: 'Bugün şehrin öbür ucuna bile götürdüm! Kaseler sıcacık ulaştı.' },
      {
        who: 'mahalle',
        text: '(Dükkânın karşısına dev bir pano asılıyor: “YAKINDA: MegaNoodle Fabrikası”.)',
      },
      { who: 'hana', text: 'Fabrika mı?! Burası çocukların top oynadığı meydan…' },
    ],
  },
  {
    id: 4,
    title: 'Kalın ve Yumuşak',
    subtitle: 'Udon ve miso menüde',
    duration: 120,
    spawnEvery: [8, 11],
    seats: 3,
    pots: 2,
    patience: 50,
    maxToppings: [1, 3],
    online: 24,
    unlock: ['udon', 'miso'],
    targets: [90, 160, 235],
    intro: [
      { who: 'hana', text: 'Belediye meydanı kimin alacağına festivalde karar verecekmiş.' },
      { who: 'hana', text: 'Mahalle hangi mutfağı severse, meydan onun olacak. Bize oy lazım!' },
      { who: 'sef', text: 'O zaman menüyü büyütelim. Defterin dördüncü sayfası: Udon ve miso!' },
      { who: 'miso', text: 'Miyav? (Adının çorbaya verildiğini öğrenince gururlanır.)' },
    ],
    outro: [
      { who: 'hana', text: 'Kalın udon, kadife gibi miso… Mahalle bu akşam huzurla uyuyacak.' },
      {
        who: 'mahalle',
        text: '(Pencerede bir gölge: silindir şapka, kıvrık bıyık. Not defterine bir şey yazıp kaybolur.)',
      },
    ],
  },
  {
    id: 5,
    title: 'Yağmur Akşamı',
    subtitle: 'Sağanak yağmur, dolup taşan dükkân',
    duration: 130,
    spawnEvery: [7, 10],
    seats: 3,
    pots: 3,
    patience: 48,
    maxToppings: [2, 3],
    online: 20,
    unlock: ['misir', 'mantar'],
    targets: [95, 170, 250],
    tip: 'Üçüncü tencere geldi! Aynı anda birden fazla erişte haşla.',
    intro: [
      { who: 'ruzgar', text: 'Gökyüzü delindi! Bu yağmurda herkes sıcak çorba isteyecek.' },
      {
        who: 'hana',
        text: 'Yağmurlu akşamların kraliçesi: mısırlı, mantarlı miso. Beşinci sayfa!',
      },
      { who: 'hana', text: 'Ocaklara üçüncü tencereyi de koydum. Hızlı ol!' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Islak şemsiyeler, buğulu camlar, kahkahalar… Dükkân hiç bu kadar canlı olmamıştı.',
      },
      { who: 'hana', text: 'Yarın gece Ateş Gecesi. Acı seven herkes buraya gelecek.' },
    ],
  },
  {
    id: 6,
    title: 'Ateşli Gece',
    subtitle: 'Acılı tantan ve gizemli bir misafir',
    duration: 130,
    spawnEvery: [7, 10],
    seats: 3,
    pots: 3,
    patience: 46,
    maxToppings: [2, 3],
    online: 20,
    unlock: ['acili', 'aciyag'],
    targets: [100, 180, 265],
    specials: [
      {
        at: 35,
        look: 'baron',
        name: 'Silindir Şapkalı Bey',
        order: { noodle: 'ramen', broth: 'acili', toppings: ['chashu', 'aciyag', 'yesil'] },
        greet: 'Hmph. En acı kasenizi getirin. Bakalım bu “efsane” neymiş.',
        patience: 60,
        bonus: 25,
      },
    ],
    intro: [
      {
        who: 'hana',
        text: 'Altıncı sayfa! Acılı tantan suyu ve ev yapımı acı yağ. Dikkat, göz yaşartır.',
      },
      {
        who: 'ruzgar',
        text: 'Duydum ki bu gece Baron Kraker kılık değiştirip etrafta dolaşıyormuş…',
      },
      { who: 'sef', text: 'Gelsin. Ona gerçek noodle neymiş göstereceğim.' },
    ],
    outro: [
      {
        who: 'baron',
        text: '(Şapkasını düzeltir.) Fena değil… Ama festivalde MegaNoodle sizi ezecek!',
      },
      { who: 'hana', text: 'Baron?! O silindir şapkayı nereden tanıyacaktım…' },
      { who: 'miso', text: 'Hhhsss! (Baron’un paçasına pati atar.)' },
    ],
  },
  {
    id: 7,
    title: 'Eleştirmen',
    subtitle: 'Madam Lezzetova masada',
    duration: 135,
    spawnEvery: [7, 9.5],
    seats: 3,
    pots: 3,
    patience: 46,
    maxToppings: [2, 3],
    online: 19,
    unlock: ['soba', 'tofu'],
    targets: [105, 185, 275],
    specials: [
      {
        at: 45,
        look: 'lezzetova',
        name: 'Madam Lezzetova',
        order: { noodle: 'soba', broth: 'miso', toppings: ['tofu', 'mantar', 'yesil'] },
        greet: 'Soba. Miso. Tofu, mantar, yeşil soğan. Hepsi kusursuz olsun, şekerim.',
        patience: 70,
        bonus: 40,
      },
    ],
    intro: [
      {
        who: 'ruzgar',
        text: 'Haber var! Şehrin en korkulan eleştirmeni Madam Lezzetova bugün gelecekmiş!',
      },
      {
        who: 'hana',
        text: 'Onun bir yıldızı bütün şehri buraya getirir. Yedinci sayfa: soba ve tofu.',
      },
      { who: 'sef', text: 'Karabuğday eriştesi… Bugün hata yok.' },
    ],
    outro: [
      { who: 'lezzetova', text: 'Mmm. Dürüst bir kase. Ruhu olan bir mutfak. Gazeteye yazacağım.' },
      { who: 'hana', text: '(Gözleri dolar.) Kırk yıldır bunu bekliyordum.' },
      { who: 'baron', text: '(Gazeteyi buruşturur.) Lezzetova bile mi… Festivalde görüşürüz!' },
    ],
  },
  {
    id: 8,
    title: 'Deniz Kenarı',
    subtitle: 'Tempura karides ve naruto',
    duration: 140,
    spawnEvery: [6.5, 9],
    seats: 4,
    pots: 3,
    patience: 45,
    maxToppings: [2, 3],
    online: 18,
    unlock: ['karides', 'naruto'],
    targets: [110, 190, 285],
    tip: 'Tezgâhta dördüncü sandalye var. Salonu ve mutfağı sık sık kontrol et!',
    intro: [
      { who: 'hana', text: 'Sekizinci sayfa dedeninmiş. Balıkçıydı, her sabah karides getirirdi.' },
      { who: 'hana', text: 'Çıtır tempura karides ve pembe sarmal naruto. Liman insanı bayılır.' },
      { who: 'ruzgar', text: 'Gazete çıktı! Kapıda kuyruk var, sandalyeyi dörde çıkardım!' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Balıkçı Remzi: “Dedenin karidesleri! Seni festivalde destekleyeceğiz evlat!”',
      },
      {
        who: 'hana',
        text: 'Son bir sayfa kaldı… En önemlisi. Ama onu nereye sakladığımı unuttum.',
      },
    ],
  },
  {
    id: 9,
    title: 'Kemik Suyu Sırrı',
    subtitle: 'Kayıp son sayfa',
    duration: 140,
    spawnEvery: [6.5, 9],
    seats: 4,
    pots: 3,
    patience: 44,
    maxToppings: [2, 4],
    online: 17,
    unlock: ['tonkotsu', 'bambu'],
    targets: [120, 205, 305],
    specials: [
      {
        at: 30,
        look: 'hana',
        name: 'Hana Nine',
        order: {
          noodle: 'ramen',
          broth: 'tonkotsu',
          toppings: ['chashu', 'yumurta', 'bambu', 'yesil'],
        },
        greet: 'Bu sefer müşteri benim. Bakalım öğrencim sırrı çözmüş mü?',
        patience: 75,
        bonus: 40,
      },
    ],
    intro: [
      { who: 'miso', text: 'Miyav! Miyav! (Tavan arasındaki eski bir sandığı tırmalıyor.)' },
      { who: 'sef', text: 'Sandığın içinde… Son sayfa! “Kemik suyu: 18 saat, sabır ve sevgi.”' },
      { who: 'hana', text: 'Miso bulmuş! Tonkotsu, bu dükkânın kalbidir. Yanına bambu filizi.' },
      { who: 'hana', text: 'Bugün ben de bir kase isteyeceğim. Sınav gibi düşün.' },
    ],
    outro: [
      { who: 'hana', text: 'İşte bu… Benim kasem. Hayır, artık senin kasen.' },
      {
        who: 'baron',
        text: '(Kapıda.) Yarın festival. Benim fabrikam günde on bin paket üretiyor. Sen?',
      },
      {
        who: 'sef',
        text: 'Ben her kaseyi tek tek, bir insan için yapıyorum. Yarın görüşürüz Baron.',
      },
    ],
  },
  {
    id: 10,
    title: 'Büyük Festival',
    subtitle: 'Meydan kimin olacak?',
    duration: 160,
    spawnEvery: [5.5, 8],
    seats: 4,
    pots: 3,
    patience: 44,
    maxToppings: [2, 4],
    online: 15,
    unlock: ['pirinc', 'susam'],
    targets: [165, 290, 430],
    specials: [
      {
        at: 40,
        look: 'lezzetova',
        name: 'Madam Lezzetova',
        order: { noodle: 'udon', broth: 'tonkotsu', toppings: ['karides', 'naruto', 'nori'] },
        greet: 'Jüri başkanı olarak buradayım. Şaşırt beni.',
        patience: 70,
        bonus: 40,
      },
      {
        at: 95,
        look: 'baron',
        name: 'Baron Kraker',
        order: {
          noodle: 'pirinc',
          broth: 'shoyu',
          toppings: ['yumurta', 'susam', 'yesil', 'mantar'],
        },
        greet: '…Bir kase istiyorum. Annemin yaptığı gibi. Sade. Lütfen.',
        patience: 75,
        bonus: 60,
      },
    ],
    intro: [
      {
        who: 'mahalle',
        text: 'Meydan fenerlerle dolu. Bir yanda MegaNoodle’ın dev standı, bir yanda küçük Noddles tezgâhı.',
      },
      {
        who: 'hana',
        text: 'Son hediyem: incecik pirinç eriştesi ve kavrulmuş susam. Artık bütün defter sende.',
      },
      { who: 'ruzgar', text: 'Online sipariş rekoru kırılacak! Motoru ısıttım!' },
      { who: 'sef', text: 'Hadi Noddles. Mahalle için!' },
    ],
    outro: [
      { who: 'baron', text: '(Kaseyi bitirir, uzun süre susar.) Annem… böyle yapardı.' },
      {
        who: 'baron',
        text: 'Fabrikayı başka yere kuracağım. Meydan çocuklarındır. Ve… pazar günleri buraya gelebilir miyim?',
      },
      {
        who: 'lezzetova',
        text: 'Jüri kararı oybirliğiyle: Meydan, Noddles ve Fener Sokağı’nındır!',
      },
      {
        who: 'hana',
        text: 'Kırk yıl önce bu dükkânı tek bir kaseyle açmıştım. Sen onu bir mahalleye çevirdin.',
      },
      { who: 'miso', text: 'Mrrrr. (Kucağına kıvrılır. Bu, Miso’nun en büyük ödülüdür.)' },
    ],
  },
];

export function unlockedUpTo(levelId: number): string[] {
  const out: string[] = [];
  for (const l of LEVELS) {
    if (l.id > levelId) break;
    out.push(...l.unlock);
  }
  return out;
}

// ---------- Random customers ----------

export const FIRST_NAMES = [
  'Ayşe',
  'Mehmet',
  'Elif',
  'Can',
  'Zeynep',
  'Burak',
  'Deniz',
  'Ece',
  'Kaan',
  'Selin',
  'Emre',
  'Defne',
  'Ozan',
  'Melis',
  'Yusuf',
  'Nil',
  'Arda',
  'İpek',
  'Kerem',
  'Lale',
  'Tolga',
  'Asya',
  'Barış',
  'Nehir',
  'Cem',
  'Ada',
  'Mert',
  'Su',
  'Efe',
  'Duru',
  'Kenji',
  'Yuki',
  'Leo',
  'Mia',
  'Omar',
  'Sara',
];

export const GREETINGS = [
  'Merhaba! Şunu alabilir miyim:',
  'Açlıktan ölüyorum, hemen şunu istiyorum:',
  'Annem burayı övdü, ben de şunu deneyeceğim:',
  'İş çıkışı tek tesellim:',
  'Yağmurda en iyisi bu:',
  'Bugün canım şunu çekiyor:',
  'Arkadaşım tavsiye etti:',
  'Her zamankinden lütfen:',
  'Sınavdan çıktım, hak ettim:',
  'Lütfen biraz acele, molam bitiyor:',
  'Kokusu sokağın başından geliyordu!',
  'İlk randevum burada olacak, harika olsun:',
];

export const ONLINE_NAMES = [
  'Ofis • Kat 4',
  'Yurt Odası 212',
  'Liman Sitesi B3',
  'Kütüphane',
  'Gece Vardiyası',
  'Stüdyo Daire',
  'Hastane Nöbeti',
  'Ev • Film Gecesi',
  'Fırın Ustası',
  'Kuaför Salonu',
];
