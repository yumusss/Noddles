// Ingredients, bowls, characters and the 10-day story.
import type { Tod } from '../art/common';

// ---------- Ingredients ----------

export type Category = 'noodle' | 'broth' | 'sauce' | 'topping';

export interface Ingredient {
  id: string;
  name: string;
  cat: Category;
  color: string; // key colour (used for UI chips / gauges)
  price: number; // menu contribution in ₺
  cost: number; // what one unit costs the shop in ₺
}

export const INGREDIENTS: Record<string, Ingredient> = {
  // noodles
  ramen: { id: 'ramen', name: 'Ramen', cat: 'noodle', color: '#f3cf7a', price: 18, cost: 4 },
  udon: { id: 'udon', name: 'Udon', cat: 'noodle', color: '#f7ecd4', price: 20, cost: 5 },
  soba: { id: 'soba', name: 'Soba', cat: 'noodle', color: '#a98466', price: 22, cost: 5 },
  pirinc: {
    id: 'pirinc',
    name: 'Pirinç Eriştesi',
    cat: 'noodle',
    color: '#fbf6ec',
    price: 22,
    cost: 5,
  },
  // broths (soups)
  shoyu: { id: 'shoyu', name: 'Soya Suyu', cat: 'broth', color: '#8f4a22', price: 12, cost: 3 },
  miso: { id: 'miso', name: 'Miso', cat: 'broth', color: '#d49a4e', price: 14, cost: 3 },
  tavuk: { id: 'tavuk', name: 'Tavuk Suyu', cat: 'broth', color: '#e5b35a', price: 13, cost: 3 },
  acili: { id: 'acili', name: 'Acılı Tantan', cat: 'broth', color: '#d7432a', price: 16, cost: 4 },
  kori: { id: 'kori', name: 'Köri Suyu', cat: 'broth', color: '#c98a24', price: 15, cost: 4 },
  tonkotsu: {
    id: 'tonkotsu',
    name: 'Kemik Suyu',
    cat: 'broth',
    color: '#eedcc0',
    price: 18,
    cost: 5,
  },
  // sauces (dry noodles)
  teriyaki: {
    id: 'teriyaki',
    name: 'Teriyaki Sos',
    cat: 'sauce',
    color: '#5a2c12',
    price: 12,
    cost: 3,
  },
  fistik: { id: 'fistik', name: 'Fıstık Sosu', cat: 'sauce', color: '#b9814a', price: 13, cost: 3 },
  tatliaci: {
    id: 'tatliaci',
    name: 'Tatlı Acı Sos',
    cat: 'sauce',
    color: '#d6401c',
    price: 13,
    cost: 3,
  },
  yakisoba: {
    id: 'yakisoba',
    name: 'Yakisoba Sosu',
    cat: 'sauce',
    color: '#3f2010',
    price: 14,
    cost: 3,
  },
  // toppings
  yesil: { id: 'yesil', name: 'Yeşil Soğan', cat: 'topping', color: '#6fbf73', price: 3, cost: 1 },
  yumurta: {
    id: 'yumurta',
    name: 'Marine Yumurta',
    cat: 'topping',
    color: '#f4b942',
    price: 8,
    cost: 2,
  },
  chashu: { id: 'chashu', name: 'Chashu', cat: 'topping', color: '#c57c5c', price: 12, cost: 4 },
  nori: { id: 'nori', name: 'Nori', cat: 'topping', color: '#243d2e', price: 4, cost: 1 },
  pakchoi: { id: 'pakchoi', name: 'Pak Choi', cat: 'topping', color: '#5fae5b', price: 5, cost: 1 },
  filiz: {
    id: 'filiz',
    name: 'Fasulye Filizi',
    cat: 'topping',
    color: '#efe9d2',
    price: 4,
    cost: 1,
  },
  misir: { id: 'misir', name: 'Mısır', cat: 'topping', color: '#ffd23f', price: 4, cost: 1 },
  mantar: { id: 'mantar', name: 'Shiitake', cat: 'topping', color: '#7a5034', price: 7, cost: 2 },
  aciyag: { id: 'aciyag', name: 'Acı Yağ', cat: 'topping', color: '#e0301e', price: 3, cost: 1 },
  biber: {
    id: 'biber',
    name: 'Kırmızı Biber',
    cat: 'topping',
    color: '#d62828',
    price: 3,
    cost: 1,
  },
  tofu: { id: 'tofu', name: 'Kızarmış Tofu', cat: 'topping', color: '#eed7a3', price: 7, cost: 2 },
  kimchi: { id: 'kimchi', name: 'Kimchi', cat: 'topping', color: '#e85d2a', price: 6, cost: 2 },
  karides: {
    id: 'karides',
    name: 'Tempura Karides',
    cat: 'topping',
    color: '#ff9a6b',
    price: 14,
    cost: 5,
  },
  naruto: { id: 'naruto', name: 'Naruto', cat: 'topping', color: '#ffd6e0', price: 6, cost: 2 },
  lime: { id: 'lime', name: 'Misket Limonu', cat: 'topping', color: '#9ccc65', price: 3, cost: 1 },
  bambu: { id: 'bambu', name: 'Bambu Filizi', cat: 'topping', color: '#cfae63', price: 6, cost: 2 },
  citir: { id: 'citir', name: 'Çıtır Soğan', cat: 'topping', color: '#c3843a', price: 4, cost: 1 },
  susam: { id: 'susam', name: 'Susam', cat: 'topping', color: '#f2e6cc', price: 3, cost: 1 },
};

export const MEAT = ['chashu', 'karides', 'naruto'];

export type Thick = 'ince' | 'orta' | 'kalin';
export const THICK_LABEL: Record<Thick, string> = { ince: 'İnce', orta: 'Orta', kalin: 'Kalın' };

// ---------- Bowls ----------

export interface BowlStyle {
  id: string;
  name: string; // used in orders: "... kasede olsun"
  outer: string; // glaze colour outside
  inner: string; // glaze colour inside
  rim: string; // rim / lip colour
  pattern: 'none' | 'ring' | 'wave' | 'dots' | 'sakura' | 'speckle';
  patternColor: string;
  unlock: number; // level at which the bowl appears on the shelf
}

export const BOWLS: BowlStyle[] = [
  {
    id: 'kirmizi',
    name: 'Kırmızı lake',
    outer: '#c9432f',
    inner: '#f8ede0',
    rim: '#2b1b16',
    pattern: 'none',
    patternColor: '#2b1b16',
    unlock: 1,
  },
  {
    id: 'beyaz',
    name: 'Beyaz porselen',
    outer: '#f6f1ea',
    inner: '#fbf8f3',
    rim: '#8fb7cf',
    pattern: 'ring',
    patternColor: '#8fb7cf',
    unlock: 1,
  },
  {
    id: 'indigo',
    name: 'İndigo seramik',
    outer: '#3f4f84',
    inner: '#eef0f6',
    rim: '#e9e6dc',
    pattern: 'wave',
    patternColor: '#dfe6f2',
    unlock: 3,
  },
  {
    id: 'siyah',
    name: 'Siyah mat',
    outer: '#3a332f',
    inner: '#efe4d3',
    rim: '#c99a6b',
    pattern: 'speckle',
    patternColor: '#857a70',
    unlock: 4,
  },
  {
    id: 'seladon',
    name: 'Seladon yeşil',
    outer: '#a8c6b5',
    inner: '#eef5f0',
    rim: '#7fa892',
    pattern: 'dots',
    patternColor: '#7fa892',
    unlock: 6,
  },
  {
    id: 'sakura',
    name: 'Sakura desenli',
    outer: '#fbe3ea',
    inner: '#fff8f6',
    rim: '#e9a3b7',
    pattern: 'sakura',
    patternColor: '#e9a3b7',
    unlock: 8,
  },
];

export const bowlStyle = (id?: string | null) => BOWLS.find((b) => b.id === id) ?? BOWLS[0];

// ---------- Characters ----------

export type CharId = 'hana' | 'sef' | 'mochi' | 'ruzgar' | 'baron' | 'lezzetova' | 'mahalle';

export const CHARS: Record<CharId, { name: string; color: string }> = {
  hana: { name: 'Hana Nine', color: '#d9573f' },
  sef: { name: 'Sen', color: '#55628a' },
  mochi: { name: 'Mochi', color: '#9d6f47' },
  ruzgar: { name: 'Rüzgar', color: '#2fa89b' },
  baron: { name: 'Baron Kraker', color: '#6a3b8f' },
  lezzetova: { name: 'Madam Lezzetova', color: '#b8860b' },
  mahalle: { name: 'Mahalleli', color: '#7c8a99' },
};

export interface Line {
  who: CharId;
  text: string;
}

// ---------- Levels ----------

export interface Level {
  id: number;
  title: string;
  subtitle: string;
  customers: number; // roughly how many fit in the day (display only)
  minutes: number; // real-time length of the day
  phone: number; // how many of them order by phone (sets the phone ratio)
  complexity: number; // 1..4
  unlock: string[];
  intro: Line[];
  outro: Line[];
  tip?: string;
  time: Tod;
  rain?: boolean;
}

export const LEVELS: Level[] = [
  {
    id: 1,
    time: 'sabah',
    customers: 5,
    minutes: 5,
    phone: 0,
    complexity: 1,
    title: 'Açılış Günü',
    subtitle: 'Kırk yıllık kepenk yeniden açılıyor',
    unlock: ['ramen', 'shoyu', 'yesil', 'yumurta'],
    tip: 'Müşteriyi dinle. Hazırlıkta kaseyi seç, erişteyi koy, suyu basılı tutarak doldur, malzemeleri serp. Kaseyi ocağa taşı, tam kıvamında al, müşteriye götür.',
    intro: [
      { who: 'hana', text: 'Sonunda geldin evladım! Fener Sokağı seni özledi.' },
      {
        who: 'hana',
        text: 'Kırk yıl bu tezgâhın arkasında durdum. Artık dizlerim eskisi gibi değil.',
      },
      { who: 'sef', text: 'Nine… Noddles’ı gerçekten bana mı bırakıyorsun?' },
      { who: 'hana', text: 'Sana ve Mochi’ye. O kedi bu dükkânın asıl patronudur, unutma.' },
      { who: 'mochi', text: 'Miyav. (Tezgâhın üstüne kurulur ve seni süzer.)' },
      {
        who: 'hana',
        text: 'Tarif defterimden sadece ilk sayfa kaldı: soya suyu, ramen, yumurta, yeşil soğan.',
      },
      { who: 'hana', text: 'Gerisini zamanla bulursun. Hadi, kepengi kaldır!' },
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
    time: 'ogle',
    customers: 6,
    minutes: 6,
    phone: 0,
    complexity: 1,
    title: 'Mahallenin Tadı',
    subtitle: 'Defterin ikinci sayfası: chashu',
    unlock: ['chashu', 'pakchoi', 'teriyaki'],
    tip: 'Sos isteyen müşteriye su değil sos koy. Sosu da aynı şekilde basılı tutarak dök.',
    intro: [
      { who: 'sef', text: 'Tezgâhın altında bir sayfa buldum! Yağ lekeleriyle dolu ama okunuyor.' },
      { who: 'hana', text: 'Aaa, chashu tarifim! Bütün gece kısık ateşte… Mahalle buna bayılır.' },
      { who: 'mochi', text: 'Miyaaav! (Gözleri chashu’ya kilitlenmiş durumda.)' },
      { who: 'hana', text: 'Bugün salona bir masa daha koydum. Kalabalık olacak.' },
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
    time: 'ogle',
    customers: 7,
    minutes: 6,
    phone: 2,
    complexity: 2,
    title: 'Rüzgar Geliyor',
    subtitle: 'Paket siparişler başlıyor',
    unlock: ['nori', 'tavuk'],
    tip: 'Telefon çalınca siparişi oku. Hazır kaseyi kapıdaki paket kutusuna bırak; Rüzgar götürür.',
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
    time: 'gunbatimi',
    customers: 7,
    minutes: 7,
    phone: 2,
    complexity: 2,
    title: 'Kalın ve Yumuşak',
    subtitle: 'Udon ve miso menüde',
    unlock: ['udon', 'miso', 'filiz'],
    tip: 'Bazı müşteriler erişteyi diri ya da iyice yumuşak ister. Ocaktaki göstergeyi dikkatle izle!',
    intro: [
      { who: 'hana', text: 'Belediye meydanı kimin alacağına festivalde karar verecekmiş.' },
      { who: 'hana', text: 'Mahalle hangi mutfağı severse, meydan onun olacak. Bize oy lazım!' },
      { who: 'sef', text: 'O zaman menüyü büyütelim. Defterin dördüncü sayfası: udon ve miso!' },
      { who: 'mochi', text: 'Miyav? (Miso kokusunu alınca kuyruğu dikleşir.)' },
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
    time: 'ogle',
    rain: true,
    customers: 8,
    minutes: 7,
    phone: 2,
    complexity: 3,
    title: 'Yağmurlu Öğle',
    subtitle: 'Sağanak yağmur, dolup taşan dükkân',
    unlock: ['misir', 'mantar', 'fistik'],
    intro: [
      { who: 'ruzgar', text: 'Gökyüzü delindi! Bu yağmurda herkes sıcak çorba isteyecek.' },
      { who: 'hana', text: 'Yağmurlu günlerin kraliçesi: mısırlı, mantarlı miso. Beşinci sayfa!' },
      { who: 'hana', text: 'Bugün hızlı ol; ıslak müşteri sabırsız müşteridir.' },
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
    time: 'aksam',
    customers: 8,
    minutes: 8,
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
      { who: 'mochi', text: 'Hhhsss! (Baron’un paçasına pati atar.)' },
    ],
  },
  {
    id: 7,
    time: 'ogle',
    customers: 8,
    minutes: 8,
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
    time: 'sabah',
    customers: 9,
    minutes: 9,
    phone: 3,
    complexity: 4,
    title: 'Deniz Kenarı',
    subtitle: 'Tempura karides ve naruto',
    unlock: ['karides', 'naruto', 'lime'],
    intro: [
      { who: 'hana', text: 'Sekizinci sayfa dedeninmiş. Balıkçıydı, her sabah karides getirirdi.' },
      { who: 'hana', text: 'Çıtır tempura karides ve pembe sarmal naruto. Liman insanı bayılır.' },
      { who: 'ruzgar', text: 'Gazete çıktı! Kapıda kuyruk var!' },
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
    time: 'gunbatimi',
    customers: 9,
    minutes: 9,
    phone: 3,
    complexity: 4,
    title: 'Kemik Suyu Sırrı',
    subtitle: 'Kayıp son sayfa',
    unlock: ['tonkotsu', 'bambu', 'citir', 'kori'],
    intro: [
      { who: 'mochi', text: 'Miyav! Miyav! (Tavan arasındaki eski bir sandığı tırmalıyor.)' },
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
    time: 'aksam',
    customers: 10,
    minutes: 10,
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
      { who: 'ruzgar', text: 'Paket sipariş rekoru kırılacak! Motoru ısıttım!' },
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
      { who: 'mochi', text: 'Mrrrr. (Kucağına kıvrılır. Bu, Mochi’nin en büyük ödülüdür.)' },
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
