// Ingredients, bowls, characters and the 50-day story.
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
    unlock: 11,
  },
  {
    id: 'seladon',
    name: 'Seladon yeşil',
    outer: '#a8c6b5',
    inner: '#eef5f0',
    rim: '#7fa892',
    pattern: 'dots',
    patternColor: '#7fa892',
    unlock: 24,
  },
  {
    id: 'sakura',
    name: 'Sakura desenli',
    outer: '#fbe3ea',
    inner: '#fff8f6',
    rim: '#e9a3b7',
    pattern: 'sakura',
    patternColor: '#e9a3b7',
    unlock: 40,
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

// 50 days in five acts:
//   Act 1 (1–9)   Reopening — the recipe-book pages come back one by one.
//   Act 2 (10–19) Growth — Rüzgar's app launches, deliveries begin, the neighbourhood rallies.
//   Act 3 (20–29) The Baron's schemes — price war, fake reviews, a stolen page, a blackout; Lezzetova's guide.
//   Act 4 (30–39) Setback & comeback — Hana rests, a flood, Mochi goes missing and finds an old photo.
//   Act 5 (40–50) The Lantern Festival — and the Baron's mother's Sunday soup.
export const LEVELS: Level[] = [
  // ===================== ACT 1 — Reopening =====================
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
      { who: 'sef', text: 'Nine… Noodles’ı gerçekten bana mı bırakıyorsun?' },
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
    minutes: 5,
    phone: 0,
    complexity: 1,
    title: 'Mahallenin Tadı',
    subtitle: 'Defterin ikinci sayfası: chashu ve teriyaki',
    unlock: ['chashu', 'teriyaki'],
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
      { who: 'hana', text: 'Ağızdan ağıza yayılıyor. Yakında bütün şehir duyacak, görürsün.' },
    ],
  },
  {
    id: 3,
    time: 'gunbatimi',
    customers: 6,
    minutes: 6,
    phone: 0,
    complexity: 1,
    title: 'Yeni Bir Dost',
    subtitle: 'Tavuk suyu, nori ve indigo kase',
    unlock: ['nori', 'tavuk'],
    tip: 'Bazı müşteriler belirli bir kase ister. Hazırlıkta raftan doğru kaseyi seç!',
    intro: [
      {
        who: 'ruzgar',
        text: 'Selaaam! Ben Rüzgar, sokağın en hızlı kuryesi. Motorum vızır vızır!',
      },
      {
        who: 'ruzgar',
        text: 'Bir de uygulama yazıyorum: mahallenin bütün lezzetleri tek tuşla kapında! Az kaldı.',
      },
      { who: 'sef', text: 'Paket servis mi? Önce salona yetişeyim, sonra konuşuruz.' },
      {
        who: 'hana',
        text: 'Al, üçüncü sayfa: tavuk suyu ve nori. Üşüyene yorgan, yorulana kuvvet.',
      },
      {
        who: 'hana',
        text: 'Rafa indigo kasemi de koydum. Bazıları kasesini seçerek gelir, dikkat et.',
      },
    ],
    outro: [
      { who: 'ruzgar', text: 'Uygulama hazır olunca Noodles’ı en başa koyacağım. Söz!' },
      {
        who: 'mahalle',
        text: '(Dükkânın karşısına dev bir pano asılıyor: “YAKINDA: MegaNoodle Fabrikası”.)',
      },
      { who: 'hana', text: 'Fabrika mı?! Burası çocukların top oynadığı meydan…' },
    ],
  },
  {
    id: 4,
    time: 'aksam',
    customers: 7,
    minutes: 6,
    phone: 0,
    complexity: 1,
    title: 'Kalın ve Yumuşak',
    subtitle: 'Udon ve miso menüde',
    unlock: ['udon', 'miso'],
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
    customers: 7,
    minutes: 6,
    phone: 0,
    complexity: 2,
    title: 'Yağmurlu Öğle',
    subtitle: 'Sağanak yağmur • Mısır ve shiitake menüde',
    unlock: ['misir', 'mantar'],
    tip: 'Müşteriler artık daha seçici: “olmasın” dedikleri malzemeyi sakın kaseye koyma!',
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
    customers: 7,
    minutes: 7,
    phone: 0,
    complexity: 2,
    title: 'Ateşli Gece',
    subtitle: 'Acılı tantan ve gizemli bir misafir',
    unlock: ['acili', 'aciyag'],
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
    time: 'gunbatimi',
    customers: 8,
    minutes: 7,
    phone: 0,
    complexity: 2,
    title: 'Eleştirmen',
    subtitle: 'Lezzetova masada • Soba ve tofu menüde',
    unlock: ['soba', 'tofu'],
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
    customers: 8,
    minutes: 7,
    phone: 0,
    complexity: 2,
    title: 'Deniz Kenarı',
    subtitle: 'Tempura karides ve naruto',
    unlock: ['karides', 'naruto'],
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
    customers: 8,
    minutes: 8,
    phone: 0,
    complexity: 2,
    title: 'Kemik Suyu Sırrı',
    subtitle: 'Kayıp son sayfa: kemik suyu ve bambu filizi',
    unlock: ['tonkotsu', 'bambu'],
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
        text: '(Kapıda.) Sayfaları toplamışsın, ha? Benim fabrikam günde on bin paket üretiyor. Sen?',
      },
      {
        who: 'sef',
        text: 'Ben her kaseyi tek tek, bir insan için yapıyorum. Festivalde görüşürüz Baron.',
      },
    ],
  },

  // ===================== ACT 2 — Growth & deliveries =====================
  {
    id: 10,
    time: 'aksam',
    customers: 9,
    minutes: 8,
    phone: 1,
    complexity: 2,
    title: 'Uygulama Yayında!',
    subtitle: 'Paket siparişler başlıyor • Fasulye filizi menüde',
    unlock: ['filiz'],
    tip: 'Telefon çalınca siparişi oku. Hazır kaseyi kapıdaki paket kutusuna bırak; Rüzgar götürür.',
    intro: [
      { who: 'ruzgar', text: 'Üç, iki, bir… YAYINDA! Noodles artık uygulamada!' },
      {
        who: 'ruzgar',
        text: 'Uygulamaya dükkânınızı ekledim. Siparişler telefona düşecek, ben kapıyorum!',
      },
      { who: 'sef', text: 'Hem salona hem telefona mı yetişeceğim?' },
      {
        who: 'hana',
        text: 'Ben senin yaşındayken bir elimde kepçe, bir elimde telefon vardı. Yaparsın.',
      },
      {
        who: 'mahalle',
        text: 'Manav Sabri: “Paketlere koyarsın diye taze fasulye filizi getirdim. Çıtır çıtır!”',
      },
    ],
    outro: [
      { who: 'ruzgar', text: 'Bugün şehrin öbür ucuna bile götürdüm! Kaseler sıcacık ulaştı.' },
      { who: 'hana', text: 'Artık ağızdan ağıza değil, telefondan telefona yayılıyoruz!' },
    ],
  },
  {
    id: 11,
    time: 'sabah',
    customers: 9,
    minutes: 8,
    phone: 1,
    complexity: 2,
    title: 'Sabah Kuşları',
    subtitle: 'Pak choi ve siyah mat kase geldi',
    unlock: ['pakchoi'],
    intro: [
      { who: 'mochi', text: 'Miyav! Miyav! (Sabahın köründe yüzüne pati atıyor.)' },
      { who: 'hana', text: 'Erken kalkan kase doldurur! Fırıncı Nuri işe giderken uğrayacakmış.' },
      { who: 'mahalle', text: 'Manav Sabri: “Bahçemden pak choi! Yemyeşil, taptaze.”' },
      { who: 'hana', text: 'Rafa siyah mat kaseler de koydum. Şık müşteriler bayılır.' },
    ],
    outro: [
      { who: 'ruzgar', text: 'Sabah teslimatlarında rekor! Ofisler bizi konuşuyor.' },
      { who: 'mahalle', text: '(Kapıya kocaman bir afiş asılmış: “MegaNoodle — 3 paket 1 lira!”)' },
      { who: 'hana', text: 'Bir lira mı? O paketlerin içinde tat değil, tuz var.' },
    ],
  },
  {
    id: 12,
    time: 'ogle',
    customers: 9,
    minutes: 8,
    phone: 1,
    complexity: 2,
    title: 'Okul Çıkışı',
    subtitle: 'Fıstık sosu menüde',
    unlock: ['fistik'],
    intro: [
      { who: 'hana', text: 'Bugün okul erken bitiyor. Çocuklar fıstık sosuna bayılır!' },
      { who: 'sef', text: 'Defterde bir not buldum: “Fıstık sosu: tatlı, tuzlu, biraz da sabır.”' },
      { who: 'mahalle', text: 'Öğretmen Selma: “Bütün sınıfı getiriyorum, hazır mısınız?”' },
      { who: 'mochi', text: 'Miyav. (Çocuklar gelmeden en yüksek rafa saklanır.)' },
    ],
    outro: [
      { who: 'mahalle', text: 'Küçük Efe: “Büyüyünce ben de noodle şefi olacağım!”' },
      { who: 'hana', text: 'Duydun mu? Bu dükkân sadece çorba değil, hayal de pişiriyor.' },
    ],
  },
  {
    id: 13,
    time: 'gunbatimi',
    customers: 9,
    minutes: 9,
    phone: 2,
    complexity: 2,
    title: 'Beş Yıldıza Doğru',
    subtitle: 'Kırmızı biber menüde',
    unlock: ['biber'],
    intro: [
      {
        who: 'ruzgar',
        text: 'Uygulamada puanımız 4,9! Yorumlara bak: “Kasesi sıcak, kuryesi hızlı!”',
      },
      { who: 'sef', text: 'Kuryesi hızlı mı? Bunu sen yazmışsın Rüzgar.' },
      { who: 'ruzgar', text: '(Kulaklarına kadar kızarır.) Belki bir tanesini…' },
      {
        who: 'hana',
        text: 'Acı sevenlere müjde: taze kırmızı biber geldi. İnce kıy, cesurca serp.',
      },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Balıkçı Remzi: “Bu biber denizdeki fırtınadan beter! Bir kase daha!”',
      },
      {
        who: 'hana',
        text: 'Mahalle her gün biraz büyüyor. Ben de her gün biraz daha gururlanıyorum.',
      },
    ],
  },
  {
    id: 14,
    time: 'aksam',
    customers: 10,
    minutes: 9,
    phone: 1,
    complexity: 2,
    title: 'Komşu Sofrası',
    subtitle: 'Kimchi menüde',
    unlock: ['kimchi'],
    intro: [
      {
        who: 'mahalle',
        text: 'Üst kattan Min-ji Hanım: “Annemin kimchi kavanozunu getirdim. Ekşi, acı, çıtır!”',
      },
      { who: 'hana', text: 'Bir mahalle böyle kurulur: herkes sofraya bir şey getirir.' },
      { who: 'sef', text: 'Defterin arkasına yeni bir başlık açıyorum: “Mahalle Sayfaları”.' },
      { who: 'mochi', text: 'Hapşu! (Kimchi’yi kokladı. Büyük hata.)' },
    ],
    outro: [
      { who: 'mahalle', text: 'Min-ji Hanım: “Annem görse çok sevinirdi. Tam onun tadı!”' },
      { who: 'ruzgar', text: 'Siparişler ikiye katlandı! Bir motor daha mı alsam?' },
    ],
  },
  {
    id: 15,
    time: 'sabah',
    customers: 10,
    minutes: 9,
    phone: 2,
    complexity: 3,
    title: 'Zor Müşteriler',
    subtitle: 'Tatlı acı sos menüde',
    unlock: ['tatliaci'],
    tip: 'Yeni istekler var! “Et yemiyorum” diyene et ve deniz ürünü koyma; “acı olsun” diyene acı bir şey ekle; “en az 3 çeşit” diyene çeşit çeşit malzeme koy.',
    intro: [
      {
        who: 'hana',
        text: 'Artık müşteriler bizi tanıyor, istekleri de büyüyor. Kulağını dört aç!',
      },
      {
        who: 'mahalle',
        text: 'Spor Hocası Kemal: “Et yok, bol sebze! Bugün maratona hazırlanıyorum.”',
      },
      { who: 'sef', text: 'Bir de tatlı acı sos denedim. Hem tatlı hem acı… tıpkı Baron gibi.' },
      { who: 'hana', text: '(Kıkırdar.) Ağzına sağlık. Hadi, kepenk yukarı!' },
    ],
    outro: [
      {
        who: 'ruzgar',
        text: 'Haber var: Madam Lezzetova yeni bir rehber yazıyormuş. “Şehrin En İyi On Kasesi”!',
      },
      { who: 'hana', text: 'O listeye girersek… Fener Sokağı’nı bütün şehir öğrenir.' },
    ],
  },
  {
    id: 16,
    time: 'ogle',
    customers: 10,
    minutes: 9,
    phone: 2,
    complexity: 3,
    title: 'Liman Rüzgarı',
    subtitle: 'Misket limonu menüde',
    unlock: ['lime'],
    intro: [
      {
        who: 'mahalle',
        text: 'Balıkçı Remzi: “Gemiden misket limonu geldi! Karidesin üstüne bir sıkım, oh!”',
      },
      { who: 'hana', text: 'Dedenin en sevdiği: karides, limon, bir tutam yeşillik.' },
      { who: 'ruzgar', text: 'Limandaki gemiciler bile uygulamadan sipariş veriyor!' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Balıkçı Remzi: “Lezzetova’nın listesine girmezsen o listeyi denize atarım!”',
      },
      { who: 'hana', text: '(Güler.) Ağır ol Remzi, daha yolumuz uzun.' },
    ],
  },
  {
    id: 17,
    time: 'gunbatimi',
    rain: true,
    customers: 10,
    minutes: 9,
    phone: 2,
    complexity: 3,
    title: 'Fırtınalı Gün',
    subtitle: 'Çıtır soğan menüde',
    unlock: ['citir'],
    intro: [
      { who: 'ruzgar', text: 'Bana boşuna Rüzgar demiyorlar! Ama bugünkü rüzgar benden de hızlı…' },
      {
        who: 'hana',
        text: 'Yağmurda en iyisi çıtır soğan. Çorbanın üstünde çıtır çıtır, içinde mutluluk.',
      },
      { who: 'sef', text: 'Kokusu bütün sokağa yayıldı bile.' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Kapının önünde ıslak şemsiyeler sıralanmış. Kimse dışarı çıkmak istemiyor.',
      },
      { who: 'mochi', text: 'Mrrr. (Ocağın yanındaki sıcak köşeye kıvrılır.)' },
    ],
  },
  {
    id: 18,
    time: 'aksam',
    customers: 11,
    minutes: 10,
    phone: 2,
    complexity: 3,
    title: 'Bıyıklı Turist',
    subtitle: 'Kılık değiştirmiş bir müşteri daha',
    unlock: [],
    intro: [
      {
        who: 'ruzgar',
        text: 'Uygulamaya garip bir yorum düştü: “MegaNoodle daha iyi. İmza: Kesinlikle Baron Değil.”',
      },
      { who: 'sef', text: '(Gülmemek için dudağını ısırır.) Kesinlikle Baron değil, ha?' },
      { who: 'hana', text: 'Bugün gözünü dört aç. Takma bıyıklar ışıkta parlar.' },
    ],
    outro: [
      { who: 'baron', text: '(Takma bıyığı düşer.) Hmph! Bu sadece… bir keşif ziyaretiydi!' },
      { who: 'mochi', text: '(Bıyığı kapıp koşarak kaçar. Artık o onun oyuncağı.)' },
      { who: 'hana', text: 'Kırk yıldır bu kadar güldüğümü hatırlamıyorum.' },
    ],
  },
  {
    id: 19,
    time: 'sabah',
    customers: 11,
    minutes: 10,
    phone: 2,
    complexity: 3,
    title: 'Mahalle Bizimle',
    subtitle: 'Köri suyu menüde',
    unlock: ['kori'],
    intro: [
      {
        who: 'mahalle',
        text: 'Bütün mahalle fırçalarla geldi! Tabelayı yeniden boyuyorlar: “NOODLES – Fener Sokağı’nın Kalbi”.',
      },
      { who: 'hana', text: 'Bu güzelliğe bir kase köri suyu yakışır. Sarı sarı, güneş gibi.' },
      { who: 'mahalle', text: 'Fırıncı Nuri: “Boyacılara bedava kase yok mu şef?” (Göz kırpar.)' },
      { who: 'sef', text: 'Önce müşteriler, sonra boyacılar! Hadi, herkes yerine!' },
    ],
    outro: [
      { who: 'hana', text: 'Şu tabelaya bak. Kırk yıl önce onu tek başıma asmıştım.' },
      {
        who: 'ruzgar',
        text: 'Kötü haber… MegaNoodle da uygulamaya girmiş. Üstelik yarı fiyatına!',
      },
      { who: 'sef', text: 'Demek savaş başlıyor.' },
    ],
  },

  // ===================== ACT 3 — The Baron's schemes =====================
  {
    id: 20,
    time: 'ogle',
    customers: 11,
    minutes: 10,
    phone: 2,
    complexity: 3,
    title: 'Fiyat Savaşı',
    subtitle: 'MegaNoodle yarı fiyatına',
    unlock: [],
    intro: [
      {
        who: 'ruzgar',
        text: 'MegaNoodle uygulamada: “Bir kase alana bir kase bedava!” Herkes onu konuşuyor.',
      },
      { who: 'sef', text: 'Biz de fiyatı düşürsek mi Nine?' },
      {
        who: 'hana',
        text: 'Fiyatı değil, çıtayı yükselt. İnsan ucuzu bir kez alır, güzeli her gün.',
      },
      { who: 'mochi', text: 'Miyav. (Kuyruğuyla menüyü gösterir. Aynen öyle demek istiyor.)' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Manav Sabri: “Bedava kaseyi denedim. Karton gibi! Ben buraya devam.”',
      },
      { who: 'hana', text: 'Gördün mü? Tat yalan söylemez.' },
    ],
  },
  {
    id: 21,
    time: 'gunbatimi',
    customers: 11,
    minutes: 10,
    phone: 2,
    complexity: 3,
    title: 'Gece Pazarı',
    subtitle: 'Yakisoba sosu menüde',
    unlock: ['yakisoba'],
    intro: [
      {
        who: 'hana',
        text: 'Gençken gece pazarında yakisoba yapardım. Tavada cız cız, sosu koyu koyu!',
      },
      { who: 'sef', text: 'Ama bu tarif defterde yok ki.' },
      {
        who: 'hana',
        text: 'Bazı tarifler defterde değil, buradadır. (Kalbini gösterir.) Yaz bakalım.',
      },
    ],
    outro: [
      {
        who: 'ruzgar',
        text: 'Uygulamada bir tuhaflık var… Bir gecede yüz tane bir yıldızlı yorum gelmiş!',
      },
      { who: 'sef', text: 'Yüz tane mi? Bugün dükkâna yüz kişi bile gelmedi!' },
    ],
  },
  {
    id: 22,
    time: 'aksam',
    customers: 11,
    minutes: 10,
    phone: 2,
    complexity: 3,
    title: 'Sahte Yorumlar',
    subtitle: 'Bir yıldızlı yorum yağmuru',
    unlock: [],
    intro: [
      {
        who: 'ruzgar',
        text: 'Yorumlara bak: “Çorbada kedi tüyü var!” “Erişte plastik!” Hepsi aynı dakikada yazılmış.',
      },
      { who: 'mochi', text: 'Hhhsss! (Kedi tüyü iftirasına çok bozuldu.)' },
      {
        who: 'hana',
        text: 'Yalanın ömrü kısadır. Biz işimizi yapalım; gerçek müşteri gerçeği yazar.',
      },
      { who: 'sef', text: 'O zaman bugün her kase bir cevap olsun.' },
    ],
    outro: [
      {
        who: 'ruzgar',
        text: 'Mahalle harekete geçti! Herkes kendi yorumunu yazıyor: “Hayatımın kasesi!”',
      },
      {
        who: 'mahalle',
        text: 'Küçük Efe: “Ben de yazdım! Beş yıldız, yanına bir de kedi resmi çizdim.”',
      },
      { who: 'hana', text: 'İşte mahalle budur.' },
    ],
  },
  {
    id: 23,
    time: 'sabah',
    customers: 12,
    minutes: 10,
    phone: 2,
    complexity: 3,
    title: 'Gizli Müfettiş',
    subtitle: 'Rehber için gizli tadım',
    unlock: [],
    intro: [
      {
        who: 'ruzgar',
        text: 'Duyduğuma göre Lezzetova’nın rehberi için şehirde gizli tadımlar yapılıyormuş.',
      },
      {
        who: 'hana',
        text: 'Rehbere girmek için tek bir kase yeter. Kaybetmek için de tek bir hata.',
      },
      { who: 'sef', text: 'O zaman her müşteriye müfettişmiş gibi davranacağım.' },
    ],
    outro: [
      {
        who: 'lezzetova',
        text: '(Peçesini kaldırır.) Sürpriz, şekerim. Müfettiş bendim. Notlarım… gizli.',
      },
      { who: 'hana', text: 'Yüzündeki o minik gülümseme… Bence iyi geçti.' },
    ],
  },
  {
    id: 24,
    time: 'ogle',
    customers: 12,
    minutes: 10,
    phone: 3,
    complexity: 3,
    title: 'Seladon Kaseler',
    subtitle: 'Seladon yeşil kase rafta',
    unlock: [],
    intro: [
      { who: 'hana', text: 'Dolabın dibinde seladon kaselerimi buldum. Yeşil, çay yaprağı gibi.' },
      { who: 'hana', text: 'Bunları bana çok eski bir dostum hediye etmişti. Lale… Ah, neyse.' },
      { who: 'sef', text: 'Lale kim Nine?' },
      { who: 'hana', text: 'Başka zaman anlatırım evladım. Müşteriler bekliyor!' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: '(Gece yarısı arka kapıdan bir tıkırtı geliyor. Mochi kulaklarını dikmiş, karanlığa bakıyor.)',
      },
      { who: 'mochi', text: 'Hrrr… (Kuyruğu fırça gibi kabarmış.)' },
    ],
  },
  {
    id: 25,
    time: 'gunbatimi',
    customers: 12,
    minutes: 10,
    phone: 2,
    complexity: 3,
    title: 'Çalınan Sayfa',
    subtitle: 'Kemik suyu tarifi kayıp!',
    unlock: [],
    intro: [
      { who: 'sef', text: 'Nine! Defterden kemik suyu sayfası koparılmış!' },
      {
        who: 'ruzgar',
        text: 'Arka kapıda mor bir eldiven buldum. Kimin olabilir ki? (Göz kırpar.)',
      },
      { who: 'hana', text: 'Sayfayı alabilirler, ama on sekiz saatlik sabrı çalamazlar.' },
      {
        who: 'sef',
        text: 'Tarifi ezbere biliyorum zaten. Kemik suyu bugün her zamankinden güzel olacak!',
      },
    ],
    outro: [
      {
        who: 'ruzgar',
        text: 'MegaNoodle bugün “Yeni! Kemik Suyu Paketi” çıkarmış. Tadına baktım… Bulaşık suyu gibi!',
      },
      { who: 'hana', text: 'Gördün mü? Tarif kâğıtta değil, ellerde yaşar.' },
    ],
  },
  {
    id: 26,
    time: 'aksam',
    rain: true,
    customers: 12,
    minutes: 10,
    phone: 3,
    complexity: 3,
    title: 'Karanlık Gece',
    subtitle: 'Fırtına ve elektrik kesintisi',
    unlock: [],
    intro: [
      { who: 'mahalle', text: '(Gök gürler. Bütün sokağın ışıkları bir anda söner!)' },
      { who: 'sef', text: 'Elektrik gitti! Ama ocak gazla yanıyor, devam!' },
      { who: 'hana', text: 'Fenerleri yakın! Bu sokağa Fener Sokağı boşuna denmedi.' },
      { who: 'mochi', text: 'Miyav! (Gözleri karanlıkta iki küçük fener gibi parlıyor.)' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Elektrikçi Hasan: “Kabloyu biri bilerek kesmiş. Yanında da mor bir düğme buldum.”',
      },
      { who: 'ruzgar', text: 'Mor düğme, mor eldiven, mor mühür… Hmm, kim olabilir acaba?' },
    ],
  },
  {
    id: 27,
    time: 'sabah',
    customers: 12,
    minutes: 10,
    phone: 2,
    complexity: 3,
    title: 'Baron Masada',
    subtitle: 'Bu sefer kılık yok',
    unlock: [],
    intro: [
      { who: 'ruzgar', text: 'Alarm! Kapının önünde simsiyah bir limuzin durdu!' },
      { who: 'hana', text: 'Baron bizzat gelmiş. Bu sefer ne takma bıyık var ne kılık.' },
      { who: 'sef', text: 'Sakin olalım. Ona da herkese yaptığımızı yapacağız: en güzel kaseyi.' },
    ],
    outro: [
      {
        who: 'baron',
        text: 'Söyleyin bakalım… Bu sokakta neden kimse benim paketlerimi istemiyor?',
      },
      { who: 'hana', text: 'Çünkü sen paket satıyorsun, Baron. Biz sofra kuruyoruz.' },
      { who: 'baron', text: '(Bir an susar. Sonra şapkasını takıp hızla çıkar.)' },
    ],
  },
  {
    id: 28,
    time: 'ogle',
    customers: 12,
    minutes: 10,
    phone: 3,
    complexity: 3,
    title: 'Rehber Çıktı',
    subtitle: 'Şehrin En İyi On Kasesi',
    unlock: [],
    intro: [
      { who: 'ruzgar', text: 'Gazete! Gazete! “Şehrin En İyi On Kasesi” çıktı!' },
      { who: 'sef', text: '(Titreyen ellerle sayfayı çevirir.) Onuncu… dokuzuncu… yok… yok…' },
      {
        who: 'ruzgar',
        text: 'BİRİNCİ! “Noodles, Fener Sokağı: Ruhu olan bir mutfak.” BİRİNCİYİZ!',
      },
      { who: 'mochi', text: 'Miyaaav! (Gazetenin üstüne oturur. Artık bu onun gazetesi.)' },
    ],
    outro: [
      {
        who: 'lezzetova',
        text: '(Telefonda.) Tebrikler şekerim. Ama unutma: tepeye çıkmak kolay, orada kalmak zor.',
      },
      { who: 'hana', text: 'Kırk yıl… Kırk yıl sonra birinci. (Gözlerini siler.)' },
    ],
  },
  {
    id: 29,
    time: 'gunbatimi',
    customers: 12,
    minutes: 10,
    phone: 2,
    complexity: 3,
    title: 'Ustalık Sınavı',
    subtitle: 'Hana Nine’nin önlüğü',
    unlock: [],
    intro: [
      { who: 'hana', text: 'Birinci olduk, ama bir şef asıl sınavı kendine verir.' },
      { who: 'hana', text: 'Bugün senden zor bir kase isteyeceğim. Geçersen önlüğüm senin.' },
      { who: 'sef', text: 'O önlüğü kırk yıldır senden başkası giymedi…' },
      { who: 'mochi', text: 'Mrr. (Önlüğün cebinde uyuyor. Önce onu çıkarmak lazım.)' },
    ],
    outro: [
      {
        who: 'hana',
        text: '(Önlüğü omzuna koyar.) Artık bu dükkânın şefi sensin. Ben sadece Hana Nine’yim.',
      },
      { who: 'ruzgar', text: 'Alkışlar! Bütün kurye grubu canlı izliyordu!' },
    ],
  },

  // ===================== ACT 4 — Setback & comeback =====================
  {
    id: 30,
    time: 'sabah',
    customers: 12,
    minutes: 10,
    phone: 2,
    complexity: 4,
    title: 'Son Hediye',
    subtitle: 'Pirinç eriştesi ve susam menüde',
    unlock: ['pirinc', 'susam'],
    intro: [
      {
        who: 'hana',
        text: 'Son hediyem: incecik pirinç eriştesi ve kavrulmuş susam. Artık bütün defter sende.',
      },
      { who: 'sef', text: 'Bütün defter mi? Ama Nine, sen hep burada olacaksın, değil mi?' },
      {
        who: 'hana',
        text: '(Gülümser.) Elbette. Sadece biraz daha az ayakta, biraz daha çok oturarak.',
      },
      { who: 'ruzgar', text: 'Festival afişleri asılmaya başladı! Yirmi gün kaldı!' },
    ],
    outro: [
      { who: 'hana', text: 'Biraz yoruldum evladım. Yarın evde dinleneceğim, dükkân sana emanet.' },
      { who: 'mochi', text: 'Miyav… (Hana Nine’nin peşinden kapıya kadar yürür.)' },
    ],
  },
  {
    id: 31,
    time: 'ogle',
    customers: 12,
    minutes: 10,
    phone: 2,
    complexity: 4,
    title: 'Tek Başına',
    subtitle: 'Hana Nine evde dinleniyor',
    unlock: [],
    intro: [
      { who: 'sef', text: 'İlk kez Nine olmadan açıyorum. Ellerim titriyor.' },
      {
        who: 'ruzgar',
        text: 'Hana Nine iyi, sadece biraz dinlenmesi lazım. Ona her gün sıcak bir kase götüreceğim!',
      },
      {
        who: 'mahalle',
        text: 'Manav Sabri: “Merak etme evlat, hepimiz buradayız. Bulaşıklar bende!”',
      },
      { who: 'mochi', text: 'Miyav. (Hana Nine’nin taburesine oturur, yerini korur.)' },
    ],
    outro: [
      {
        who: 'ruzgar',
        text: 'Kaseyi götürdüm. Hana Nine bir kaşık aldı ve “Tuzu tam yerinde” dedi!',
      },
      { who: 'sef', text: 'Yarın daha da iyisini yapacağım.' },
    ],
  },
  {
    id: 32,
    time: 'gunbatimi',
    customers: 12,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Mahalle Mutfakta',
    subtitle: 'Komşular yardıma koşuyor',
    unlock: [],
    intro: [
      {
        who: 'mahalle',
        text: 'Min-ji Hanım önlüğünü bağlamış, Fırıncı Nuri kasaları taşıyor, Küçük Efe peçeteleri katlıyor!',
      },
      { who: 'sef', text: 'Siz… hepiniz mi geldiniz?' },
      {
        who: 'mahalle',
        text: 'Öğretmen Selma: “Hana Nine bize kırk yıl çorba verdi. Şimdi sıra bizde.”',
      },
    ],
    outro: [
      { who: 'mochi', text: 'Mrrr. (Küçük Efe’nin kucağında uyuyakalmış.)' },
      {
        who: 'ruzgar',
        text: 'Hana Nine’ye bugünün fotoğrafını götürdüm. Gülümsedi, sonra mışıl mışıl uyudu.',
      },
    ],
  },
  {
    id: 33,
    time: 'aksam',
    rain: true,
    customers: 13,
    minutes: 10,
    phone: 2,
    complexity: 4,
    title: 'Sel Gecesi',
    subtitle: 'Fırtına dükkânı su bastı',
    unlock: [],
    intro: [
      { who: 'mahalle', text: '(Sokak dereye dönmüş! Çamurlu su kapının altından içeri sızıyor!)' },
      { who: 'sef', text: 'Kum torbalarını getirin! Kasaları yükseğe kaldırın!' },
      { who: 'ruzgar', text: 'Motorumla kum torbası taşıyorum! Sağanak beni durduramaz!' },
      {
        who: 'hana',
        text: '(Telefonda.) Sakin ol evladım. O dükkân kırk fırtına gördü, bunu da atlatır.',
      },
    ],
    outro: [
      {
        who: 'sef',
        text: 'Su çekildi ama dolapların altı perişan. Yarın her yeri silmemiz lazım.',
      },
      {
        who: 'mochi',
        text: '(Mochi ortalıkta yok. Ne mama kabının başında, ne en sevdiği rafta…)',
      },
    ],
  },
  {
    id: 34,
    time: 'sabah',
    customers: 13,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Mochi Nerede?',
    subtitle: 'Dükkânın patronu kayıp',
    unlock: [],
    intro: [
      { who: 'sef', text: 'Mochi! Mochi! Sabahtan beri ortada yok…' },
      {
        who: 'ruzgar',
        text: 'Bütün kuryelere fotoğrafını gönderdim: “Kahverengi beyaz tekir, çok havalı, chashu sever.”',
      },
      { who: 'mahalle', text: 'Küçük Efe: “Her sokağa ‘Mochi kayıp’ afişi astım. Kalpli çizdim!”' },
      { who: 'sef', text: 'Dükkânı açık tutalım. Belki kokuyu alıp geri gelir.' },
    ],
    outro: [
      { who: 'mochi', text: 'Miyav! (Kapıda belirir. Ağzında tozlu, eski bir zarf var!)' },
      { who: 'sef', text: 'Mochi! Nereye gittin sen? Ve bu… bu zarf da ne?' },
      {
        who: 'mahalle',
        text: '(Zarfta eski bir fotoğraf: genç Hana, yanında bir kadın, ortada silindir şapkalı minik bir çocuk.)',
      },
    ],
  },
  {
    id: 35,
    time: 'ogle',
    customers: 13,
    minutes: 10,
    phone: 2,
    complexity: 4,
    title: 'Hana Dönüyor',
    subtitle: 'Eski bir fotoğrafın sırrı',
    unlock: [],
    intro: [
      {
        who: 'hana',
        text: 'Döndüm! Bu fotoğraf da ne? Mochi selden sonra açılan eski duvar dolabında mı bulmuş?',
      },
      {
        who: 'hana',
        text: 'Bu Lale. En yakın dostum. Bu tezgâhı birlikte açmıştık. Kucağındaki de oğlu…',
      },
      { who: 'sef', text: 'Silindir şapkalı çocuk… Baron Kraker mı?!' },
      {
        who: 'hana',
        text: 'Lale uzaklara taşınınca birbirimizi kaybettik. Oğlu da annesinin tadını kaybetti galiba.',
      },
    ],
    outro: [
      { who: 'hana', text: 'Karar verdim: Festivalde Baron’a Lale’nin tarifini pişireceğiz.' },
      { who: 'sef', text: 'Ama tarif nerede?' },
      { who: 'hana', text: 'Fotoğrafın arkasına bak, evladım.' },
    ],
  },
  {
    id: 36,
    time: 'gunbatimi',
    customers: 13,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Fotoğrafın Arkası',
    subtitle: 'Lale’nin el yazısı',
    unlock: [],
    intro: [
      {
        who: 'sef',
        text: '(Fotoğrafı çevirir.) “Pazar çorbası: soya suyu, ince pirinç eriştesi, bir yumurta, bol susam, iki shiitake. Bir tutam da sevgi. — Lale”',
      },
      { who: 'hana', text: 'Pazar çorbası! Lale her pazar oğluna bunu yapardı.' },
      { who: 'ruzgar', text: 'Yani Baron’un kalbine giden yol bir kase çorbadan mı geçiyor?' },
      { who: 'hana', text: 'Herkesin kalbine giden yol bir kase çorbadan geçer.' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Manav Sabri: “Dükkân selden sonra pırıl pırıl oldu. Sanki yeni açılmış gibi!”',
      },
      { who: 'hana', text: 'Bazen bir fırtına, tozlu köşeleri temizlemek için gelir.' },
    ],
  },
  {
    id: 37,
    time: 'aksam',
    customers: 13,
    minutes: 10,
    phone: 2,
    complexity: 4,
    title: 'Baron’un Teklifi',
    subtitle: 'Bir çanta dolusu para',
    unlock: [],
    intro: [
      {
        who: 'baron',
        text: '(Bir çanta dolusu parayla gelir.) Dükkânı bana satın. Bu parayla on dükkân açarsınız!',
      },
      { who: 'sef', text: 'Ama o on dükkânın hiçbiri Fener Sokağı’nda olmaz.' },
      {
        who: 'hana',
        text: 'Bu dükkân satılık değil, Baron. Ama bir kase çorba sana her zaman bedava.',
      },
      { who: 'baron', text: 'Hmph! Festivalde görüşürüz! (Çanta kapanır, kapı çarpar.)' },
    ],
    outro: [
      { who: 'ruzgar', text: 'Paraya hayır dediniz… Siz bu sokağın kahramanlarısınız!' },
      { who: 'mochi', text: 'Miyav. (Çantanın bıraktığı izi koklar ve hapşırır.)' },
    ],
  },
  {
    id: 38,
    time: 'sabah',
    customers: 13,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Yeniden Ayakta',
    subtitle: 'Selden sonra büyük açılış',
    unlock: [],
    intro: [
      { who: 'hana', text: 'Bugün ikinci açılışımız! Kepengi birlikte kaldıralım mı?' },
      {
        who: 'mahalle',
        text: 'Bütün mahalle kapıda alkışlıyor. Fırıncı Nuri kocaman bir pasta getirmiş!',
      },
      { who: 'sef', text: 'Bir… iki… üç… Kepenk yukarı!' },
    ],
    outro: [
      { who: 'ruzgar', text: 'Bugün uygulamada rekor kırdık! Tam yüz paket!' },
      { who: 'hana', text: 'Fırtına geldi, geçti. Biz hâlâ buradayız.' },
    ],
  },
  {
    id: 39,
    time: 'ogle',
    customers: 13,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Festival Daveti',
    subtitle: 'Belediyeden mühürlü bir mektup',
    unlock: [],
    intro: [
      { who: 'ruzgar', text: 'Postacı bir mektup getirdi! Üstünde belediye mührü var!' },
      {
        who: 'sef',
        text: '“Fener Festivali’nde meydan, jürinin seçeceği mutfağa verilecektir. Jüri başkanı: Madam Lezzetova.”',
      },
      { who: 'hana', text: 'On bir gün kaldı. Her günü bir antrenman gibi düşün.' },
      { who: 'mochi', text: 'Miyav! (Mektubu kemirmeye çalışır.)' },
    ],
    outro: [
      {
        who: 'baron',
        text: '(Karşı kaldırımdan seslenir.) Festivalde fabrikanın temelini atacağım! Meydan benim olacak!',
      },
      { who: 'sef', text: 'Göreceğiz Baron. Göreceğiz.' },
    ],
  },

  // ===================== ACT 5 — The Lantern Festival =====================
  {
    id: 40,
    time: 'gunbatimi',
    customers: 13,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Sakura Kaseler',
    subtitle: 'Sakura desenli kase rafta',
    unlock: [],
    intro: [
      { who: 'hana', text: 'Festival için en güzel kaselerimi çıkarıyorum: sakura desenliler!' },
      { who: 'sef', text: 'Çiçek açmış gibi duruyorlar!' },
      {
        who: 'ruzgar',
        text: 'Uygulamaya “Festival Menüsü” sekmesi ekledim. Siparişler şimdiden yağıyor!',
      },
    ],
    outro: [
      {
        who: 'mahalle',
        text: 'Öğretmen Selma: “Sınıfça festival için fener yapıyoruz. Her fenere bir kase çizdik!”',
      },
      { who: 'hana', text: 'Fener Sokağı yine fenerlerle dolacak.' },
    ],
  },
  {
    id: 41,
    time: 'aksam',
    customers: 13,
    minutes: 10,
    phone: 2,
    complexity: 4,
    title: 'Fener Yapımı',
    subtitle: 'Mahalle festivale hazırlanıyor',
    unlock: [],
    intro: [
      {
        who: 'mahalle',
        text: 'Sokak baştan sona kâğıt fenerlerle süsleniyor. Kırmızı, sarı, turuncu!',
      },
      { who: 'mochi', text: 'Miyav! (Bir fenerin ipini yakalamış, bırakmıyor.)' },
      { who: 'sef', text: 'Mochi, o fener festival için! Oyuncak değil!' },
      { who: 'hana', text: '(Kahkaha atar.) Bırak oynasın. Bu sokağın her şeyi biraz da onun.' },
    ],
    outro: [
      {
        who: 'ruzgar',
        text: 'Haber: MegaNoodle meydana dev bir sahne kuruyor. Üstünde de dev bir Baron heykeli!',
      },
      { who: 'sef', text: 'Dev heykel mi? Biz de küçük ama sıcacık bir tezgâh kuracağız.' },
    ],
  },
  {
    id: 42,
    time: 'sabah',
    customers: 13,
    minutes: 10,
    phone: 2,
    complexity: 4,
    title: 'Jüri Provası',
    subtitle: 'Lezzetova festivalden önce uğruyor',
    unlock: [],
    intro: [
      {
        who: 'ruzgar',
        text: 'Madam Lezzetova yola çıkmış! Jüri başkanı olarak tarafsız olması lazım ama…',
      },
      { who: 'hana', text: 'Tarafsız olsun. Biz kayırılmak değil, tadılmak istiyoruz.' },
      { who: 'sef', text: 'Bugün her kase bir festival kasesi.' },
    ],
    outro: [
      {
        who: 'lezzetova',
        text: 'Jüri başkanı olarak bir şey söyleyemem. Ama bir insan olarak… bu kaseyi unutmayacağım.',
      },
      { who: 'hana', text: 'Ondan bu söz, bin yıldıza bedel.' },
    ],
  },
  {
    id: 43,
    time: 'ogle',
    customers: 14,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Pazar Çorbası',
    subtitle: 'Lale’nin tarifinin eksik parçası',
    unlock: [],
    intro: [
      { who: 'hana', text: 'Lale’nin pazar çorbasını deneyelim. Tadı doğru olmalı, tam doğru.' },
      {
        who: 'sef',
        text: 'Soya suyu, ince pirinç eriştesi, bir yumurta, bol susam, iki shiitake… Bir şey eksik.',
      },
      {
        who: 'hana',
        text: 'Bir tutam sevgi… Yani biraz yeşil soğan! Lale onu hep en son, gülümseyerek serperdi.',
      },
      { who: 'mochi', text: 'Miyav. (Onaylar gibi yavaşça göz kırpar.)' },
    ],
    outro: [
      { who: 'hana', text: '(Bir kaşık tadar, gözleri dolar.) İşte… Lale’nin çorbası.' },
      { who: 'sef', text: 'Festivalde Baron’a bunu pişireceğiz. Söz.' },
    ],
  },
  {
    id: 44,
    time: 'gunbatimi',
    rain: true,
    customers: 14,
    minutes: 10,
    phone: 2,
    complexity: 4,
    title: 'Son Fırtına',
    subtitle: 'Festival süsleri tehlikede',
    unlock: [],
    intro: [
      { who: 'ruzgar', text: 'Fırtına geri döndü! Fenerler uçuşuyor!' },
      {
        who: 'mahalle',
        text: 'Bütün mahalle fenerleri toplayıp dükkânın tavanına asıyor. İçerisi masal gibi oldu!',
      },
      { who: 'sef', text: 'Yağmur da bizi durduramaz. Sıcak kaseler hazır!' },
    ],
    outro: [
      {
        who: 'mahalle',
        text: '(Kapıya mor bir şemsiye bırakılmış. Üstünde bir not: “Fenerleriniz ıslanmasın. — B.K.”)',
      },
      { who: 'hana', text: 'B.K.… Baron Kraker mı? Demek o buz dağı erimeye başladı.' },
    ],
  },
  {
    id: 45,
    time: 'aksam',
    customers: 14,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Kurye Maratonu',
    subtitle: 'Rüzgar’ın en uzun gecesi',
    unlock: [],
    intro: [
      { who: 'ruzgar', text: 'Festival öncesi şehir çıldırdı! Uygulamada sipariş üstüne sipariş!' },
      { who: 'ruzgar', text: 'Bugün telefonu sık dinle şef. Paket kutusu hiç boş kalmasın!' },
      { who: 'sef', text: 'Salon dolu, telefon çalıyor, Mochi ayağımın dibinde… Harika!' },
    ],
    outro: [
      { who: 'ruzgar', text: 'Bin kilometre! Motor yoruldu, ben yorulmadım! (Kanepeye yığılır.)' },
      { who: 'hana', text: '(Üstüne battaniye örter.) Kahramanların da uykusu gelir.' },
    ],
  },
  {
    id: 46,
    time: 'sabah',
    customers: 14,
    minutes: 10,
    phone: 2,
    complexity: 4,
    title: 'Sahte Balıkçı',
    subtitle: 'Baron’un son kılığı',
    unlock: [],
    intro: [
      {
        who: 'mahalle',
        text: 'Balıkçı Remzi: “Limanda benim gibi giyinmiş biri dolaşıyor! Sakalı yamuk, bıyığı mor!”',
      },
      { who: 'sef', text: 'Mor bıyık mı? Kim olabilir acaba…' },
      { who: 'hana', text: 'Bırak gelsin. Belki bu sefer sadece acıkmıştır.' },
    ],
    outro: [
      {
        who: 'baron',
        text: '(Kapıda durur.) Neden… neden bana hep güzel kaseler yapıyorsunuz? Ben size kötülük ettim.',
      },
      {
        who: 'hana',
        text: 'Çünkü aç gelen herkese güzel bir kase yapılır, Baron. Bu dükkânın tek kuralı bu.',
      },
    ],
  },
  {
    id: 47,
    time: 'ogle',
    customers: 14,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Hazırlık Günü',
    subtitle: 'Yarın tezgâh meydana taşınıyor',
    unlock: [],
    intro: [
      { who: 'sef', text: 'Yarın tezgâhı meydana taşıyoruz. Bugün son normal gün!' },
      { who: 'mahalle', text: 'Fırıncı Nuri: “Masalar benden!” Manav Sabri: “Sebzeler benden!”' },
      { who: 'hana', text: 'Kırk yıl önce de böyleydi. Herkes bir ucundan tutardı.' },
    ],
    outro: [
      {
        who: 'ruzgar',
        text: 'Rehberdeki birinciliğimizi duyan herkes geliyor. Festival dolup taşacak!',
      },
      { who: 'mochi', text: 'Miyav! (Paket kutusunun içine girmiş. Festivale gitmeye hazır.)' },
    ],
  },
  {
    id: 48,
    time: 'gunbatimi',
    customers: 14,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Festival Başlıyor',
    subtitle: 'Birinci gün: meydan fenerlerle dolu',
    unlock: [],
    intro: [
      {
        who: 'mahalle',
        text: 'Meydan fenerlerle dolu. Bir yanda MegaNoodle’ın dev standı, bir yanda küçük Noodles tezgâhı.',
      },
      { who: 'ruzgar', text: 'Paket sipariş rekoru kırılacak! Motoru ısıttım!' },
      { who: 'hana', text: 'Festival üç gün sürecek. Her gün bir kase, her kase bir oy.' },
      { who: 'sef', text: 'Hadi Noodles. Mahalle için!' },
    ],
    outro: [
      { who: 'lezzetova', text: 'Birinci günün sonunda puanlar başa baş: Noodles ve MegaNoodle!' },
      {
        who: 'baron',
        text: '(Kendi standında tek başına oturuyor. Arada bir Noodles tezgâhına bakıyor.)',
      },
    ],
  },
  {
    id: 49,
    time: 'aksam',
    customers: 14,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Başa Baş',
    subtitle: 'İkinci gün: kuyruk meydanı sardı',
    unlock: [],
    intro: [
      { who: 'ruzgar', text: 'İkinci gün! Kuyruk meydanı iki kez sardı!' },
      { who: 'hana', text: 'Bugün ben de müşteriyim. Festivalde şef de acıkır, nine de.' },
      { who: 'sef', text: 'O zaman sıranı bekle Nine! (Göz kırpar.)' },
    ],
    outro: [
      {
        who: 'lezzetova',
        text: 'İkinci günün sonunda puanlar… yine başa baş! Karar yarın, final kasesiyle verilecek.',
      },
      { who: 'hana', text: 'Yarın Baron’a Lale’nin çorbasını pişireceğiz. Ne olursa olsun.' },
    ],
  },
  {
    id: 50,
    time: 'aksam',
    customers: 14,
    minutes: 10,
    phone: 3,
    complexity: 4,
    title: 'Büyük Festival',
    subtitle: 'Meydan kimin olacak?',
    unlock: [],
    intro: [
      {
        who: 'mahalle',
        text: 'Final gecesi! Bütün şehir meydanda, fenerler gökyüzüne yükseliyor.',
      },
      { who: 'hana', text: 'Bütün defter sende, bütün mahalle arkanda. Gerisi sadece bir kase.' },
      { who: 'ruzgar', text: 'Bu gece telefon da susmayacak! Son tur, motor hazır!' },
      { who: 'sef', text: 'Hadi Noodles. Fener Sokağı için!' },
    ],
    outro: [
      { who: 'baron', text: '(Kaseyi bitirir, uzun süre susar.) Annem… böyle yapardı.' },
      {
        who: 'baron',
        text: 'Fabrikayı başka yere kuracağım. Meydan çocuklarındır. Ve… pazar günleri buraya gelebilir miyim?',
      },
      {
        who: 'lezzetova',
        text: 'Jüri kararı oybirliğiyle: Meydan, Noodles ve Fener Sokağı’nındır!',
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
