// ---------- Ingredients ----------

export type Category = 'noodle' | 'broth' | 'sauce' | 'topping';

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
  tavuk: { id: 'tavuk', name: 'Tavuk Suyu', cat: 'broth', color: '#e2b04f', price: 4 },
  kori: { id: 'kori', name: 'Köri Suyu', cat: 'broth', color: '#c9861c', price: 5 },
  // sauces (dry noodles)
  teriyaki: { id: 'teriyaki', name: 'Teriyaki Sos', cat: 'sauce', color: '#5a2a10', price: 4 },
  fistik: { id: 'fistik', name: 'Fıstık Sosu', cat: 'sauce', color: '#b9814a', price: 4 },
  tatliaci: { id: 'tatliaci', name: 'Tatlı Acı Sos', cat: 'sauce', color: '#d6401c', price: 4 },
  yakisoba: { id: 'yakisoba', name: 'Yakisoba Sosu', cat: 'sauce', color: '#3b1d0e', price: 5 },
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
  pakchoi: { id: 'pakchoi', name: 'Pak Choi', cat: 'topping', color: '#4caf50', price: 2 },
  filiz: { id: 'filiz', name: 'Fasulye Filizi', cat: 'topping', color: '#f3f0dc', price: 1 },
  biber: { id: 'biber', name: 'Kırmızı Biber', cat: 'topping', color: '#d62828', price: 1 },
  kimchi: { id: 'kimchi', name: 'Kimchi', cat: 'topping', color: '#e85d2a', price: 2 },
  lime: { id: 'lime', name: 'Misket Limonu', cat: 'topping', color: '#8bc34a', price: 1 },
  citir: { id: 'citir', name: 'Çıtır Soğan', cat: 'topping', color: '#b5732c', price: 1 },
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
  miso: { id: 'miso', name: 'Mochi (kedi)', color: '#a6845f' },
  ruzgar: { id: 'ruzgar', name: 'Rüzgar', color: '#2ec4b6' },
  baron: { id: 'baron', name: 'Baron Kraker', color: '#8e44ad' },
  lezzetova: { id: 'lezzetova', name: 'Madam Lezzetova', color: '#d4a017' },
  mahalle: { id: 'mahalle', name: 'Mahalleli', color: '#9aa5b1' },
};

export interface Line {
  who: CharId;
  text: string;
}

// ---------- Levels ----------

export type DayTime = 'morning' | 'noon' | 'sunset' | 'night';
export type Weather = 'clear' | 'cloudy' | 'rain';

export interface Level {
  id: number;
  time: DayTime;
  weather: Weather;
  title: string;
  subtitle: string;
  customers: number; // customers in the day
  phone: number; // how many of them order by phone
  complexity: number; // 1..4, how tricky orders get
  unlock: string[]; // ingredients unlocked this level
  intro: Line[];
  outro: Line[];
  tip?: string;
}

export const LEVELS: Level[] = [
  {
    id: 1,
    time: 'morning',
    weather: 'clear',
    customers: 5,
    phone: 0,
    complexity: 1,
    title: 'Açılış Günü',
    subtitle: 'Kırk yıllık kepenk yeniden açılıyor',
    unlock: ['ramen', 'shoyu', 'yesil', 'yumurta'],
    tip: 'Müşteriyi dinle, siparişi al. Hazırlıkta erişteyi koy, suyu basılı tutarak dök, malzemeleri parmağınla kaseye serpiştir. Sonra ocakta tam kıvamında çıkar ve servis et!',
    intro: [
      { who: 'hana', text: 'Sonunda geldin evladım! Fener Sokağı seni özledi.' },
      {
        who: 'hana',
        text: 'Kırk yıl bu tezgâhın arkasında durdum. Artık dizlerim eskisi gibi değil.',
      },
      { who: 'sef', text: 'Nine… Noddles’ı gerçekten bana mı bırakıyorsun?' },
      { who: 'hana', text: 'Sana ve Mochi’ye. O kedi bu dükkânın asıl patronudur, unutma.' },
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
    time: 'noon',
    weather: 'clear',
    customers: 6,
    phone: 0,
    complexity: 1,
    title: 'Mahallenin Tadı',
    subtitle: 'Defterin ikinci sayfası: chashu',
    unlock: ['chashu', 'pakchoi', 'teriyaki'],
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
    time: 'noon',
    weather: 'cloudy',
    customers: 7,
    phone: 2,
    complexity: 2,
    title: 'Rüzgar Geliyor',
    subtitle: 'Online siparişler başlıyor',
    unlock: ['nori', 'tavuk'],
    tip: 'Artık telefon da çalıyor! Telefondan gelen siparişi Rüzgar kapıp götürür.',
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
    time: 'morning',
    weather: 'clear',
    customers: 7,
    phone: 2,
    complexity: 2,
    title: 'Kalın ve Yumuşak',
    subtitle: 'Udon ve miso menüde',
    unlock: ['udon', 'miso', 'filiz'],
    tip: 'Bazı müşteriler erişteyi diri ya da iyice yumuşak ister. Siparişi dikkatli oku!',
    intro: [
      { who: 'hana', text: 'Belediye meydanı kimin alacağına festivalde karar verecekmiş.' },
      { who: 'hana', text: 'Mahalle hangi mutfağı severse, meydan onun olacak. Bize oy lazım!' },
      { who: 'sef', text: 'O zaman menüyü büyütelim. Defterin dördüncü sayfası: Udon ve miso!' },
      { who: 'miso', text: 'Miyav? (Miso kokusunu alınca kuyruğunu dikip gururla gerinir.)' },
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
    time: 'sunset',
    weather: 'rain',
    customers: 8,
    phone: 2,
    complexity: 3,
    title: 'Yağmur Akşamı',
    subtitle: 'Sağanak yağmur, dolup taşan dükkân',
    unlock: ['misir', 'mantar', 'fistik'],
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
    time: 'night',
    weather: 'clear',
    customers: 8,
    phone: 2,
    complexity: 3,
    title: 'Ateşli Gece',
    subtitle: 'Acılı tantan ve gizemli bir misafir',
    unlock: ['acili', 'aciyag', 'biber'],
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
    time: 'noon',
    weather: 'clear',
    customers: 8,
    phone: 2,
    complexity: 3,
    title: 'Eleştirmen',
    subtitle: 'Madam Lezzetova masada',
    unlock: ['soba', 'tofu', 'kimchi', 'tatliaci'],
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
    time: 'sunset',
    weather: 'clear',
    customers: 9,
    phone: 3,
    complexity: 4,
    title: 'Deniz Kenarı',
    subtitle: 'Tempura karides ve naruto',
    unlock: ['karides', 'naruto', 'lime'],
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
    time: 'morning',
    weather: 'rain',
    customers: 9,
    phone: 3,
    complexity: 4,
    title: 'Kemik Suyu Sırrı',
    subtitle: 'Kayıp son sayfa',
    unlock: ['tonkotsu', 'bambu', 'citir', 'kori'],
    intro: [
      { who: 'miso', text: 'Miyav! Miyav! (Tavan arasındaki eski bir sandığı tırmalıyor.)' },
      { who: 'sef', text: 'Sandığın içinde… Son sayfa! “Kemik suyu: 18 saat, sabır ve sevgi.”' },
      { who: 'hana', text: 'Mochi bulmuş! Tonkotsu, bu dükkânın kalbidir. Yanına bambu filizi.' },
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
    time: 'night',
    weather: 'clear',
    customers: 10,
    phone: 3,
    complexity: 4,
    title: 'Büyük Festival',
    subtitle: 'Meydan kimin olacak?',
    unlock: ['pirinc', 'susam', 'yakisoba'],
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
      { who: 'miso', text: 'Mrrrr. (Kucağına kıvrılır. Bu, Mochi’nin en büyük ödülüdür.)' },
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
