// Turkish → English map for every user-facing data string (ingredients, bowls, characters,
// levels, story, tips, decor, customer lines, judge notes). Keys are the exact Turkish strings
// as they appear in the code. Used by `L()` in ./i18n.

export const DATA_EN: Record<string, string> = {
  // ---------- ingredients ----------
  'Pirinç Eriştesi': 'Rice Noodles',
  'Soya Suyu': 'Soy Broth',
  'Tavuk Suyu': 'Chicken Broth',
  'Acılı Tantan': 'Spicy Tantan',
  'Köri Suyu': 'Curry Broth',
  'Kemik Suyu': 'Bone Broth',
  'Teriyaki Sos': 'Teriyaki Sauce',
  'Fıstık Sosu': 'Peanut Sauce',
  'Tatlı Acı Sos': 'Sweet Chili Sauce',
  'Yakisoba Sosu': 'Yakisoba Sauce',
  'Yeşil Soğan': 'Green Onion',
  'Marine Yumurta': 'Marinated Egg',
  'Fasulye Filizi': 'Bean Sprouts',
  Mısır: 'Corn',
  'Acı Yağ': 'Chili Oil',
  'Kırmızı Biber': 'Red Chili',
  'Kızarmış Tofu': 'Fried Tofu',
  'Tempura Karides': 'Tempura Shrimp',
  'Misket Limonu': 'Lime',
  'Bambu Filizi': 'Bamboo Shoots',
  'Çıtır Soğan': 'Crispy Onion',
  Susam: 'Sesame',

  // thickness / cook labels
  İnce: 'Thin',
  Orta: 'Medium',
  Kalın: 'Thick',
  Çiğ: 'Raw',
  Diri: 'Firm',
  'Tam kıvam': 'Perfect',
  Yumuşak: 'Soft',
  Lapa: 'Mushy',

  // ---------- bowls ----------
  'Kırmızı lake': 'Red lacquer',
  'Beyaz porselen': 'White porcelain',
  'İndigo seramik': 'Indigo ceramic',
  'Siyah mat': 'Matte black',
  'Seladon yeşil': 'Celadon green',
  'Sakura desenli': 'Sakura pattern',

  // ---------- characters ----------
  'Hana Nine': 'Grandma Hana',
  Sen: 'You',
  Rüzgar: 'Ruzgar',
  'Madam Lezzetova': 'Madame Lezzetova',
  Mahalleli: 'Neighbours',
  'Silindir Şapkalı Bey': 'Gentleman in a Top Hat',

  // ---------- phone customer names ----------
  'Ofis • Kat 4': 'Office • Floor 4',
  'Yurt Odası 212': 'Dorm Room 212',
  'Liman Sitesi B3': 'Harbour Flats B3',
  Kütüphane: 'Library',
  'Gece Vardiyası': 'Night Shift',
  'Stüdyo Daire': 'Studio Flat',
  'Hastane Nöbeti': 'Hospital Night Shift',
  'Ev • Film Gecesi': 'Home • Movie Night',
  'Fırın Ustası': 'The Baker',
  'Kuaför Salonu': 'Hair Salon',

  // ---------- levels: titles, subtitles, tips ----------
  'Açılış Günü': 'Opening Day',
  'Kırk yıllık kepenk yeniden açılıyor': 'The forty-year-old shutter opens again',
  'Müşteriyi dinle. Hazırlıkta kaseyi seç, erişteyi koy, suyu basılı tutarak doldur, malzemeleri serp. Kaseyi ocağa taşı, tam kıvamında al, müşteriye götür.':
    'Listen to the customer. At the counter, pick a bowl, add the noodles, hold to pour the broth, sprinkle on the toppings. Carry the bowl to the stove, take it off when it’s perfect, and bring it to the customer.',
  'Mahallenin Tadı': 'Taste of the Neighbourhood',
  'Defterin ikinci sayfası: chashu': 'Page two of the recipe book: chashu',
  'Sos isteyen müşteriye su değil sos koy. Sosu da aynı şekilde basılı tutarak dök.':
    'If a customer asks for sauce, pour sauce, not broth. Hold to pour the sauce the same way.',
  'Rüzgar Geliyor': 'Here Comes Ruzgar',
  'Paket siparişler başlıyor': 'Delivery orders begin',
  'Telefon çalınca siparişi oku. Hazır kaseyi kapıdaki paket kutusuna bırak; Rüzgar götürür.':
    'When the phone rings, read the order. Put the finished bowl in the delivery box by the door; Ruzgar takes it from there.',
  'Kalın ve Yumuşak': 'Thick and Soft',
  'Udon ve miso menüde': 'Udon and miso join the menu',
  'Bazı müşteriler erişteyi diri ya da iyice yumuşak ister. Ocaktaki göstergeyi dikkatle izle!':
    'Some customers want their noodles firm or extra soft. Keep a close eye on the stove gauge!',
  'Yağmurlu Öğle': 'Rainy Noon',
  'Sağanak yağmur, dolup taşan dükkân': 'Pouring rain, a packed shop',
  'Ateşli Gece': 'Night of Fire',
  'Acılı tantan ve gizemli bir misafir': 'Spicy tantan and a mysterious guest',
  Eleştirmen: 'The Critic',
  'Madam Lezzetova masada': 'Madame Lezzetova takes a table',
  'Deniz Kenarı': 'By the Sea',
  'Tempura karides ve naruto': 'Tempura shrimp and naruto',
  'Kemik Suyu Sırrı': 'The Bone Broth Secret',
  'Kayıp son sayfa': 'The lost last page',
  'Büyük Festival': 'The Big Festival',
  'Meydan kimin olacak?': 'Who gets the square?',

  // ---------- story: day 1 ----------
  'Sonunda geldin evladım! Fener Sokağı seni özledi.':
    'You finally made it, dear! Lantern Street has missed you.',
  'Kırk yıl bu tezgâhın arkasında durdum. Artık dizlerim eskisi gibi değil.':
    'Forty years I stood behind this counter. My knees aren’t what they used to be.',
  'Nine… Noodles’ı gerçekten bana mı bırakıyorsun?':
    'Grandma… are you really leaving Noodles to me?',
  'Sana ve Mochi’ye. O kedi bu dükkânın asıl patronudur, unutma.':
    'To you and Mochi. Don’t forget, that cat is the real boss of this shop.',
  'Miyav. (Tezgâhın üstüne kurulur ve seni süzer.)':
    'Meow. (Settles on the counter and looks you up and down.)',
  'Tarif defterimden sadece ilk sayfa kaldı: soya suyu, ramen, yumurta, yeşil soğan.':
    'Only the first page of my recipe book is left: soy broth, ramen, egg, green onion.',
  'Gerisini zamanla bulursun. Hadi, kepengi kaldır!':
    'You’ll find the rest in time. Go on, lift the shutter!',
  'Gördün mü? Mahalle kokuyu alınca koşa koşa geldi.':
    'See? The neighbourhood caught the smell and came running.',
  '(Kapının altından bir zarf süzülür. Üzerinde mor bir mühür var: “MegaNoodle”.)':
    '(An envelope slides under the door. It carries a purple seal: “MegaNoodle”.)',
  'Hıh. Baron Kraker yine sokağımızı satın almaya çalışıyor. Aldırma.':
    'Hmph. Baron Kraker is trying to buy our street again. Pay him no mind.',

  // ---------- story: day 2 ----------
  'Tezgâhın altında bir sayfa buldum! Yağ lekeleriyle dolu ama okunuyor.':
    'I found a page under the counter! It’s covered in grease stains, but I can read it.',
  'Aaa, chashu tarifim! Bütün gece kısık ateşte… Mahalle buna bayılır.':
    'Oh, my chashu recipe! Simmered all night long… The neighbourhood adores it.',
  'Miyaaav! (Gözleri chashu’ya kilitlenmiş durumda.)': 'Meooow! (Eyes locked on the chashu.)',
  'Bugün salona bir masa daha koydum. Kalabalık olacak.':
    'I put one more table in the dining room today. It’s going to be busy.',
  'Manav Sabri: “Çocukluğumun tadı bu! Hana Nine’nin dükkânı geri döndü!”':
    'Sabri the greengrocer: “This is the taste of my childhood! Grandma Hana’s shop is back!”',
  'Ağızdan ağıza yayılıyor. Yarın telefon da çalmaya başlar, görürsün.':
    'Word is spreading. Tomorrow the phone will start ringing too, you’ll see.',

  // ---------- story: day 3 ----------
  'Selaaam! Ben Rüzgar, sokağın en hızlı kuryesi. Motorum vızır vızır!':
    'Heyyy! I’m Ruzgar, the fastest courier on the street. My scooter goes zoom!',
  'Uygulamaya dükkânınızı ekledim. Siparişler telefona düşecek, ben kapıyorum!':
    'I added your shop to the app. Orders will land on the phone, and I’ll whisk them away!',
  'Hem salona hem telefona mı yetişeceğim?':
    'I have to keep up with the dining room and the phone?',
  'Ben senin yaşındayken bir elimde kepçe, bir elimde telefon vardı. Yaparsın.':
    'When I was your age I had a ladle in one hand and a phone in the other. You can do it.',
  'Al, üçüncü sayfa: nori. Deniz kokulu yosun yaprakları.':
    'Here, page three: nori. Sheets of seaweed that smell of the sea.',
  'Bugün şehrin öbür ucuna bile götürdüm! Kaseler sıcacık ulaştı.':
    'Today I even rode to the far end of the city! The bowls arrived piping hot.',
  '(Dükkânın karşısına dev bir pano asılıyor: “YAKINDA: MegaNoodle Fabrikası”.)':
    '(A giant billboard goes up across from the shop: “COMING SOON: MegaNoodle Factory”.)',
  'Fabrika mı?! Burası çocukların top oynadığı meydan…':
    'A factory?! That’s the square where the kids play football…',

  // ---------- story: day 4 ----------
  'Belediye meydanı kimin alacağına festivalde karar verecekmiş.':
    'The town council will decide who gets the square at the festival.',
  'Mahalle hangi mutfağı severse, meydan onun olacak. Bize oy lazım!':
    'Whichever kitchen the neighbourhood loves wins the square. We need votes!',
  'O zaman menüyü büyütelim. Defterin dördüncü sayfası: udon ve miso!':
    'Then let’s grow the menu. Page four of the book: udon and miso!',
  'Miyav? (Miso kokusunu alınca kuyruğu dikleşir.)':
    'Meow? (Tail shoots straight up at the smell of miso.)',
  'Kalın udon, kadife gibi miso… Mahalle bu akşam huzurla uyuyacak.':
    'Thick udon, velvety miso… The neighbourhood will sleep well tonight.',
  '(Pencerede bir gölge: silindir şapka, kıvrık bıyık. Not defterine bir şey yazıp kaybolur.)':
    '(A shadow at the window: a top hat, a curly moustache. It scribbles something in a notebook and vanishes.)',

  // ---------- story: day 5 ----------
  'Gökyüzü delindi! Bu yağmurda herkes sıcak çorba isteyecek.':
    'The sky has burst open! Everyone will want hot soup in this rain.',
  'Yağmurlu günlerin kraliçesi: mısırlı, mantarlı miso. Beşinci sayfa!':
    'The queen of rainy days: miso with corn and mushrooms. Page five!',
  'Bugün hızlı ol; ıslak müşteri sabırsız müşteridir.':
    'Be quick today; a wet customer is an impatient customer.',
  'Islak şemsiyeler, buğulu camlar, kahkahalar… Dükkân hiç bu kadar canlı olmamıştı.':
    'Wet umbrellas, steamed-up windows, laughter… The shop has never felt so alive.',
  'Yarın gece Ateş Gecesi. Acı seven herkes buraya gelecek.':
    'Tomorrow is the Night of Fire. Everyone who loves spice will come here.',

  // ---------- story: day 6 ----------
  'Altıncı sayfa! Acılı tantan suyu ve ev yapımı acı yağ. Dikkat, göz yaşartır.':
    'Page six! Spicy tantan broth and homemade chili oil. Careful, it brings tears to your eyes.',
  'Duydum ki bu gece Baron Kraker kılık değiştirip etrafta dolaşıyormuş…':
    'I heard Baron Kraker is sneaking around in disguise tonight…',
  'Gelsin. Ona gerçek noodle neymiş göstereceğim.':
    'Let him come. I’ll show him what real noodles are.',
  '(Şapkasını düzeltir.) Fena değil… Ama festivalde MegaNoodle sizi ezecek!':
    '(Straightens his hat.) Not bad… But MegaNoodle will crush you at the festival!',
  'Baron?! O silindir şapkayı nereden tanıyacaktım…':
    'The Baron?! How was I supposed to recognise that top hat…',
  'Hhhsss! (Baron’un paçasına pati atar.)': 'Hsssss! (Swipes a paw at the Baron’s trouser leg.)',

  // ---------- story: day 7 ----------
  'Haber var! Şehrin en korkulan eleştirmeni Madam Lezzetova bugün gelecekmiş!':
    'Big news! Madame Lezzetova, the most feared critic in the city, is coming today!',
  'Onun bir yıldızı bütün şehri buraya getirir. Yedinci sayfa: soba ve tofu.':
    'One star from her brings the whole city here. Page seven: soba and tofu.',
  'Karabuğday eriştesi… Bugün hata yok.': 'Buckwheat noodles… No mistakes today.',
  'Mmm. Dürüst bir kase. Ruhu olan bir mutfak. Gazeteye yazacağım.':
    'Mmm. An honest bowl. A kitchen with soul. I shall write about it in the paper.',
  '(Gözleri dolar.) Kırk yıldır bunu bekliyordum.':
    '(Eyes welling up.) I’ve waited forty years for this.',
  '(Gazeteyi buruşturur.) Lezzetova bile mi… Festivalde görüşürüz!':
    '(Crumples the newspaper.) Even Lezzetova… See you at the festival!',

  // ---------- story: day 8 ----------
  'Sekizinci sayfa dedeninmiş. Balıkçıydı, her sabah karides getirirdi.':
    'Page eight was your grandfather’s. He was a fisherman; he brought shrimp every morning.',
  'Çıtır tempura karides ve pembe sarmal naruto. Liman insanı bayılır.':
    'Crispy tempura shrimp and pink swirly naruto. Harbour folk love it.',
  'Gazete çıktı! Kapıda kuyruk var!': 'The paper is out! There’s a queue at the door!',
  'Balıkçı Remzi: “Dedenin karidesleri! Seni festivalde destekleyeceğiz evlat!”':
    'Remzi the fisherman: “Your grandfather’s shrimp! We’ll back you at the festival, kid!”',
  'Son bir sayfa kaldı… En önemlisi. Ama onu nereye sakladığımı unuttum.':
    'One last page remains… The most important one. But I forgot where I hid it.',

  // ---------- story: day 9 ----------
  'Miyav! Miyav! (Tavan arasındaki eski bir sandığı tırmalıyor.)':
    'Meow! Meow! (Scratching at an old chest in the attic.)',
  'Sandığın içinde… Son sayfa! “Kemik suyu: 18 saat, sabır ve sevgi.”':
    'Inside the chest… The last page! “Bone broth: 18 hours, patience and love.”',
  'Mochi bulmuş! Tonkotsu, bu dükkânın kalbidir. Yanına bambu filizi.':
    'Mochi found it! Tonkotsu is the heart of this shop. Bamboo shoots on the side.',
  'Bugün ben de bir kase isteyeceğim. Sınav gibi düşün.':
    'Today I’ll order a bowl myself. Think of it as an exam.',
  'İşte bu… Benim kasem. Hayır, artık senin kasen.': 'That’s it… My bowl. No, it’s your bowl now.',
  '(Kapıda.) Yarın festival. Benim fabrikam günde on bin paket üretiyor. Sen?':
    '(At the door.) The festival is tomorrow. My factory makes ten thousand packets a day. And you?',
  'Ben her kaseyi tek tek, bir insan için yapıyorum. Yarın görüşürüz Baron.':
    'I make every bowl one at a time, for one person. See you tomorrow, Baron.',

  // ---------- story: day 10 ----------
  'Meydan fenerlerle dolu. Bir yanda MegaNoodle’ın dev standı, bir yanda küçük Noodles tezgâhı.':
    'The square is full of lanterns. On one side, MegaNoodle’s giant stand; on the other, the little Noodles counter.',
  'Son hediyem: incecik pirinç eriştesi ve kavrulmuş susam. Artık bütün defter sende.':
    'My last gift: delicate rice noodles and toasted sesame. The whole book is yours now.',
  'Paket sipariş rekoru kırılacak! Motoru ısıttım!':
    'We’re going to break the delivery record! The scooter’s warmed up!',
  'Hadi Noodles. Mahalle için!': 'Come on, Noodles. For the neighbourhood!',
  '(Kaseyi bitirir, uzun süre susar.) Annem… böyle yapardı.':
    '(Finishes the bowl, silent for a long while.) My mother… used to make it like this.',
  'Fabrikayı başka yere kuracağım. Meydan çocuklarındır. Ve… pazar günleri buraya gelebilir miyim?':
    'I’ll build the factory somewhere else. The square belongs to the children. And… may I come here on Sundays?',
  'Jüri kararı oybirliğiyle: Meydan, Noodles ve Fener Sokağı’nındır!':
    'The jury’s decision is unanimous: the square belongs to Noodles and Lantern Street!',
  'Kırk yıl önce bu dükkânı tek bir kaseyle açmıştım. Sen onu bir mahalleye çevirdin.':
    'Forty years ago I opened this shop with a single bowl. You turned it into a neighbourhood.',
  'Mrrrr. (Kucağına kıvrılır. Bu, Mochi’nin en büyük ödülüdür.)':
    'Purrrr. (Curls up in your lap. This is Mochi’s highest honour.)',

  // ---------- decor: slots ----------
  Duvar: 'Wall',
  Zemin: 'Floor',
  Tablo: 'Painting',
  Lambalar: 'Lamps',
  'Masa sayısı': 'Tables',
  'Masa stili': 'Table style',
  'Masa süsü': 'Table decor',
  Bitkiler: 'Plants',
  'Tezgâh süsü': 'Counter decor',
  Pencere: 'Window',

  // ---------- decor: items ----------
  'Açık hinoki ahşap': 'Light hinoki wood',
  'Adaçayı sıva': 'Sage plaster',
  'Shoji paneller': 'Shoji panels',
  'Kiremit sıva': 'Terracotta plaster',
  'Sakura desenli kâğıt': 'Sakura wallpaper',
  'Açık meşe': 'Light oak',
  'Taş döşeme': 'Stone tiles',
  'Boş duvar': 'Bare wall',
  'Fuji Dağı': 'Mount Fuji',
  'Büyük Dalga': 'The Great Wave',
  'Koi balıkları': 'Koi fish',
  Turnalar: 'Cranes',
  'Sade ampuller': 'Plain bulbs',
  'Kâğıt fenerler': 'Paper lanterns',
  'Kırmızı chochin': 'Red chochin',
  'Pirinç sarkıtlar': 'Brass pendants',
  '2 masa': '2 tables',
  '3 masa': '3 tables',
  '4 masa': '4 tables',
  'Çam ahşap': 'Pine wood',
  'Koyu ceviz': 'Dark walnut',
  'Beyaz mermer': 'White marble',
  Sade: 'Plain',
  'Küçük mumlar': 'Little candles',
  'Vazoda çiçek': 'Flowers in a vase',
  'Mini bonsai': 'Mini bonsai',
  Yok: 'None',
  'Bambu saksı': 'Potted bamboo',
  'Sakura dalları': 'Sakura branches',
  İkebana: 'Ikebana',
  'Sade cam': 'Plain glass',
  'Noren perde': 'Noren curtain',
  'Pencere çiçekliği': 'Window flower box',

  // ---------- customers: greetings ----------
  'Merhaba şef!': 'Hi, chef!',
  'Selam! Kokusu sokağın başından geliyordu.': 'Hey! I could smell it from the top of the street.',
  'İyi günler!': 'Good day!',
  'Açlıktan bayılmak üzereyim.': 'I’m about to faint from hunger.',
  'Arkadaşım burayı çok övdü.': 'My friend couldn’t stop praising this place.',
  'Uzun bir gündü…': 'It’s been a long day…',
  'Bugün kendimi şımartıyorum.': 'I’m treating myself today.',
  'Sınavdan çıktım, hak ettim.': 'Just finished an exam, I’ve earned this.',
  'İlk defa geliyorum, heyecanlıyım!': 'It’s my first time here, I’m so excited!',
  'Annem burayı anlata anlata bitiremedi.': 'My mum wouldn’t stop talking about this place.',
  'Yağmurda en iyisi sıcak bir kase!': 'Nothing beats a hot bowl in the rain!',
  'Sırılsıklam oldum, ısınmam lazım.': 'I’m soaked through, I need to warm up.',
  'Alo, Noodles mı?': 'Hello, is this Noodles?',
  'Alo! Paket servis var mı?': 'Hello! Do you do delivery?',
  'Merhaba, sipariş vermek istiyorum.': 'Hi, I’d like to place an order.',
  'Selam şef! Arkadaşlarımla geldik, hepimiz açız.':
    'Hey chef! I brought my friends, and we’re all starving.',
  'Üç kişiyiz, masa var mı? Siparişleri sırayla verelim.':
    'There are three of us, got a table? We’ll order one at a time.',
  'Ekip olarak geldik! Herkes kendi kasesini söylesin.':
    'The whole crew is here! Everyone, say your own bowl.',

  // ---------- special customers ----------
  'Hmph. Burası mı meşhur dükkân?': 'Hmph. So this is the famous shop?',
  'Acılı tantan suyuyla bir ince ramen. Tam 3 dilim chashu, bol acı yağ ve yeşil soğan. Bakalım bu “efsane” neymiş.':
    'A thin ramen in spicy tantan broth. Exactly 3 slices of chashu, lots of chili oil and some green onion. Let’s see what this “legend” is about.',
  '…Fena değil. Hiç de fena değil. (Şapkasını indirip yüzünü saklar.)':
    '…Not bad. Not bad at all. (Pulls his hat down to hide his face.)',
  'Hmph. MegaNoodle bundan iyisini yapar.': 'Hmph. MegaNoodle makes better than this.',
  'İşte! Ben demiştim, bu dükkân bitmiş!': 'There! I told you, this shop is finished!',
  'Not defterim hazır, şekerim.': 'My notebook is ready, darling.',
  'Miso suyuyla bir ince soba. Tam 4 parça tofu, 3 shiitake ve biraz yeşil soğan. Erişte diri kalsın. Kusursuz olsun.':
    'A thin soba in miso broth. Exactly 4 pieces of tofu, 3 shiitake and a little green onion. Keep the noodles firm. Make it flawless.',
  'Dürüst bir kase. Ruhu olan bir mutfak. Beş yıldız!':
    'An honest bowl. A kitchen with soul. Five stars!',
  'İyi… ama unutulmaz değil. Üç yıldız.': 'Good… but not unforgettable. Three stars.',
  'Hayal kırıklığı. Bunu yazmak zorundayım.': 'A disappointment. I shall have to write that.',
  'Bu sefer müşteri benim evladım.': 'This time I’m the customer, dear.',
  'Kemik suyuyla bir orta kalınlıkta ramen. 2 dilim chashu, 2 yumurta, bambu filizi ve bol yeşil soğan. Tam kıvamında. Sınav gibi düşün!':
    'A medium ramen in bone broth. 2 slices of chashu, 2 eggs, some bamboo shoots and lots of green onion. Cooked just right. Think of it as an exam!',
  'İşte bu… benim kasem. Hayır, artık senin kasen.': 'That’s it… my bowl. No, it’s your bowl now.',
  'Güzel, ama bir şey eksik. Tekrar dene, sen yaparsın.':
    'Lovely, but something’s missing. Try again, you can do it.',
  'Evladım… Defteri bir daha okumalısın.': 'Dear… you should read the book again.',
  'Jüri başkanı olarak buradayım.': 'I am here as head of the jury.',
  'Kemik suyuyla bir kalın udon. Tam 2 tempura karides, 3 dilim naruto ve 2 yaprak nori. Şaşırt beni.':
    'A thick udon in bone broth. Exactly 2 tempura shrimp, 3 slices of naruto and 2 sheets of nori. Surprise me.',
  'Jüri notu: on üzerinden on!': 'Jury score: ten out of ten!',
  'Jüri notu: yedi. Fena değil.': 'Jury score: seven. Not bad.',
  'Jüri notu: üç. Üzgünüm.': 'Jury score: three. I’m sorry.',
  '…Merhaba. Bu sefer kılık yok.': '…Hello. No disguise this time.',
  'Soya suyuyla bir ince pirinç eriştesi. 1 yumurta, bol susam, biraz yeşil soğan ve 2 shiitake. Annemin yaptığı gibi. Sade. Lütfen.':
    'Thin rice noodles in soy broth. 1 egg, lots of sesame, a little green onion and 2 shiitake. The way my mother made it. Simple. Please.',
  'Annem… tam böyle yapardı. (Gözlerini siler.)':
    'My mother… made it exactly like this. (Wipes his eyes.)',
  'Güzel. Ama anneminki daha sıcaktı.': 'Nice. But my mother’s was warmer.',
  'Sanırım bazı tatlar geri gelmiyor.': 'I suppose some tastes never come back.',

  // ---------- reactions ----------
  'Bu hayatımda yediğim en iyi noodle!': 'Best noodles I’ve ever had in my life!',
  'Aşık oldum! Her gün geleceğim!': 'I’m in love! I’m coming every day!',
  'Mükemmel! Ellerine sağlık şef!': 'Perfect! Hats off to you, chef!',
  'Çok lezzetli, teşekkürler!': 'So delicious, thank you!',
  'Harika olmuş!': 'That turned out great!',
  'Tam aradığım tat!': 'Exactly the taste I was after!',
  'Fena değil.': 'Not bad.',
  'İdare eder.': 'It’ll do.',
  'Güzel ama…': 'Nice, but…',
  'Hmm… ben bunu istememiştim.': 'Hmm… this isn’t what I ordered.',
  'Bu biraz farklı olmuş.': 'This came out a bit different.',
  'Bu ne böyle?!': 'What is this?!',
  'Bir daha gelmem!': 'I’m never coming back!',
  'Ciddi misin şef?': 'Are you serious, chef?',

  // ---------- order ticket ----------
  'Erişte: sen seç': 'Noodles: you pick',
  'Çorba: sen seç': 'Broth: you pick',
  'Acı olsun': 'Spicy',
  'Et yok': 'No meat',
  'Sen süsle': 'Decorate it',
  'Erişte diri': 'Noodles firm',
  'Erişte yumuşak': 'Noodles soft',

  // ---------- judge notes ----------
  'Erişte yok!': 'No noodles!',
  'Sos yok!': 'No sauce!',
  'Çorba yok!': 'No broth!',
  'Sos çok fazla': 'Way too much sauce',
  'Çorba taşmış': 'The broth overflowed',
  'Sos az kalmış': 'Not enough sauce',
  'Çorba az kalmış': 'Not enough broth',
  'Neredeyse çorba yok': 'Almost no broth',
  'Et yemiyorum demiştim!': 'I said I don’t eat meat!',
  'Hiç acı değil!': 'Not spicy at all!',
  'Tam istediğim gibi acı!': 'Spicy, just how I wanted!',
  'Rengârenk olmuş!': 'So colourful!',
  'Erişte lapa olmuş': 'The noodles went mushy',
  'Erişte çiğ kalmış': 'The noodles are still raw',
  'Erişte tam kıvamında!': 'The noodles are perfect!',
  'Erişte tam istediğim gibi!': 'The noodles are just how I like them!',
  'Erişte biraz fazla pişmiş': 'The noodles are a bit overcooked',
  'Biraz daha yumuşak olmalıydı': 'Should have been a bit softer',
  'Malzemeler bir kenara yığılmış': 'The toppings are all piled to one side',
  'Malzemeler çok güzel dağılmış': 'The toppings are beautifully arranged',
  'Çok bekledim!': 'I waited so long!',
  'Biraz uzun sürdü': 'That took a while',
  'Çok hızlıydı!': 'That was fast!',
  'Kusursuz!': 'Flawless!',
};
