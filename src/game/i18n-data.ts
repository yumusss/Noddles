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

  // ---------- story & specials: 50-day arc (days 2–50 additions) ----------
  'Defterin ikinci sayfası: chashu ve teriyaki': 'Page two of the recipe book: chashu and teriyaki',
  'Ağızdan ağıza yayılıyor. Yakında bütün şehir duyacak, görürsün.':
    'Word is spreading. Soon the whole city will hear about us, you’ll see.',
  'Yeni Bir Dost': 'A New Friend',
  'Tavuk suyu, nori ve indigo kase': 'Chicken broth, nori and the indigo bowl',
  'Bazı müşteriler belirli bir kase ister. Hazırlıkta raftan doğru kaseyi seç!':
    'Some customers want a particular bowl. At the counter, pick the right one from the shelf!',
  'Bir de uygulama yazıyorum: mahallenin bütün lezzetleri tek tuşla kapında! Az kaldı.':
    'I’m also building an app: every tasty thing in the neighbourhood, at your door with one tap! It’s almost ready.',
  'Paket servis mi? Önce salona yetişeyim, sonra konuşuruz.':
    'Delivery? Let me keep up with the dining room first, then we’ll talk.',
  'Al, üçüncü sayfa: tavuk suyu ve nori. Üşüyene yorgan, yorulana kuvvet.':
    'Here, page three: chicken broth and nori. A blanket when you’re cold, a boost when you’re tired.',
  'Rafa indigo kasemi de koydum. Bazıları kasesini seçerek gelir, dikkat et.':
    'I put my indigo bowl on the shelf too. Some people come in wanting a certain bowl, so pay attention.',
  'Uygulama hazır olunca Noodles’ı en başa koyacağım. Söz!':
    'When the app is ready, I’ll put Noodles right at the top. Promise!',
  'Sağanak yağmur • Mısır ve shiitake menüde': 'Pouring rain • Corn and shiitake on the menu',
  'Müşteriler artık daha seçici: “olmasın” dedikleri malzemeyi sakın kaseye koyma!':
    'Customers are getting pickier: never put in a topping they said “no” to!',
  'Lezzetova masada • Soba ve tofu menüde': 'Lezzetova takes a table • Soba and tofu on the menu',
  'Kayıp son sayfa: kemik suyu ve bambu filizi': 'The lost last page: bone broth and bamboo shoots',
  '(Kapıda.) Sayfaları toplamışsın, ha? Benim fabrikam günde on bin paket üretiyor. Sen?':
    '(At the door.) Collected all the pages, have you? My factory makes ten thousand packets a day. And you?',
  'Ben her kaseyi tek tek, bir insan için yapıyorum. Festivalde görüşürüz Baron.':
    'I make every bowl one at a time, for one person. See you at the festival, Baron.',
  'Uygulama Yayında!': 'The App Is Live!',
  'Paket siparişler başlıyor • Fasulye filizi menüde':
    'Delivery orders begin • Bean sprouts on the menu',
  'Üç, iki, bir… YAYINDA! Noodles artık uygulamada!':
    'Three, two, one… LIVE! Noodles is on the app!',
  'Manav Sabri: “Paketlere koyarsın diye taze fasulye filizi getirdim. Çıtır çıtır!”':
    'Sabri the greengrocer: “I brought fresh bean sprouts for your delivery bowls. Super crunchy!”',
  'Artık ağızdan ağıza değil, telefondan telefona yayılıyoruz!':
    'We’re not spreading by word of mouth anymore — we’re spreading phone to phone!',
  'Sabah Kuşları': 'Early Birds',
  'Pak choi ve siyah mat kase geldi': 'Pak choi and the matte black bowl arrive',
  'Miyav! Miyav! (Sabahın köründe yüzüne pati atıyor.)':
    'Meow! Meow! (Pawing at your face at the crack of dawn.)',
  'Erken kalkan kase doldurur! Fırıncı Nuri işe giderken uğrayacakmış.':
    'The early bird gets the bowl! Nuri the baker is stopping by on his way to work.',
  'Manav Sabri: “Bahçemden pak choi! Yemyeşil, taptaze.”':
    'Sabri the greengrocer: “Pak choi from my garden! Green and super fresh.”',
  'Rafa siyah mat kaseler de koydum. Şık müşteriler bayılır.':
    'I put matte black bowls on the shelf too. Stylish customers love them.',
  'Sabah teslimatlarında rekor! Ofisler bizi konuşuyor.':
    'A record for morning deliveries! The offices are all talking about us.',
  '(Kapıya kocaman bir afiş asılmış: “MegaNoodle — 3 paket 1 lira!”)':
    '(A huge poster is stuck on the door: “MegaNoodle — 3 packets for 1 lira!”)',
  'Bir lira mı? O paketlerin içinde tat değil, tuz var.':
    'One lira? Those packets are full of salt, not flavour.',
  'Okul Çıkışı': 'After School',
  'Fıstık sosu menüde': 'Peanut sauce on the menu',
  'Bugün okul erken bitiyor. Çocuklar fıstık sosuna bayılır!':
    'School finishes early today. Kids go crazy for peanut sauce!',
  'Defterde bir not buldum: “Fıstık sosu: tatlı, tuzlu, biraz da sabır.”':
    'I found a note in the book: “Peanut sauce: sweet, salty, and a little patience.”',
  'Öğretmen Selma: “Bütün sınıfı getiriyorum, hazır mısınız?”':
    'Ms Selma the teacher: “I’m bringing the whole class. Are you ready?”',
  'Miyav. (Çocuklar gelmeden en yüksek rafa saklanır.)':
    'Meow. (Hides on the highest shelf before the kids arrive.)',
  'Küçük Efe: “Büyüyünce ben de noodle şefi olacağım!”':
    'Little Efe: “When I grow up, I’m going to be a noodle chef too!”',
  'Duydun mu? Bu dükkân sadece çorba değil, hayal de pişiriyor.':
    'Did you hear that? This shop doesn’t just cook soup, it cooks dreams.',
  'Beş Yıldıza Doğru': 'Reaching for Five Stars',
  'Kırmızı biber menüde': 'Red chili on the menu',
  'Uygulamada puanımız 4,9! Yorumlara bak: “Kasesi sıcak, kuryesi hızlı!”':
    'Our rating on the app is 4.9! Look at the reviews: “Hot bowls, speedy courier!”',
  'Kuryesi hızlı mı? Bunu sen yazmışsın Rüzgar.': 'Speedy courier? You wrote that one, Ruzgar.',
  '(Kulaklarına kadar kızarır.) Belki bir tanesini…':
    '(Turns red right up to his ears.) Maybe just one of them…',
  'Acı sevenlere müjde: taze kırmızı biber geldi. İnce kıy, cesurca serp.':
    'Good news for spice lovers: fresh red chilies are here. Chop them fine, sprinkle them bravely.',
  'Balıkçı Remzi: “Bu biber denizdeki fırtınadan beter! Bir kase daha!”':
    'Remzi the fisherman: “This chili is wilder than a storm at sea! Another bowl, please!”',
  'Mahalle her gün biraz büyüyor. Ben de her gün biraz daha gururlanıyorum.':
    'The neighbourhood grows a little every day. And every day I get a little prouder.',
  'Komşu Sofrası': 'Neighbours’ Table',
  'Kimchi menüde': 'Kimchi on the menu',
  'Üst kattan Min-ji Hanım: “Annemin kimchi kavanozunu getirdim. Ekşi, acı, çıtır!”':
    'Mrs Min-ji from upstairs: “I brought my mother’s kimchi jar. Sour, spicy and crunchy!”',
  'Bir mahalle böyle kurulur: herkes sofraya bir şey getirir.':
    'This is how a neighbourhood is built: everyone brings something to the table.',
  'Defterin arkasına yeni bir başlık açıyorum: “Mahalle Sayfaları”.':
    'I’m starting a new section at the back of the book: “Neighbourhood Pages”.',
  'Hapşu! (Kimchi’yi kokladı. Büyük hata.)': 'Achoo! (Sniffed the kimchi. Big mistake.)',
  'Min-ji Hanım: “Annem görse çok sevinirdi. Tam onun tadı!”':
    'Mrs Min-ji: “My mother would be so happy. It tastes just like hers!”',
  'Siparişler ikiye katlandı! Bir motor daha mı alsam?':
    'Orders have doubled! Should I get a second scooter?',
  'Zor Müşteriler': 'Tricky Customers',
  'Tatlı acı sos menüde': 'Sweet chili sauce on the menu',
  'Yeni istekler var! “Et yemiyorum” diyene et ve deniz ürünü koyma; “acı olsun” diyene acı bir şey ekle; “en az 3 çeşit” diyene çeşit çeşit malzeme koy.':
    'New requests! If someone says “I don’t eat meat”, leave out meat and seafood; if they want it “spicy”, add something hot; if they ask for “at least 3 kinds”, pile on lots of different toppings.',
  'Artık müşteriler bizi tanıyor, istekleri de büyüyor. Kulağını dört aç!':
    'Customers know us now, and their wishes are getting bigger. Keep your ears open!',
  'Spor Hocası Kemal: “Et yok, bol sebze! Bugün maratona hazırlanıyorum.”':
    'Coach Kemal: “No meat, lots of veggies! I’m training for a marathon today.”',
  'Bir de tatlı acı sos denedim. Hem tatlı hem acı… tıpkı Baron gibi.':
    'I tried a sweet chili sauce too. Sweet and spicy at the same time… just like the Baron.',
  '(Kıkırdar.) Ağzına sağlık. Hadi, kepenk yukarı!':
    '(Giggles.) Well done, dear. Come on, shutter up!',
  'Haber var: Madam Lezzetova yeni bir rehber yazıyormuş. “Şehrin En İyi On Kasesi”!':
    'Big news: Madame Lezzetova is writing a new guide. “The City’s Ten Best Bowls”!',
  'O listeye girersek… Fener Sokağı’nı bütün şehir öğrenir.':
    'If we make that list… the whole city will know about Lantern Street.',
  'Liman Rüzgarı': 'Harbour Breeze',
  'Misket limonu menüde': 'Lime on the menu',
  'Balıkçı Remzi: “Gemiden misket limonu geldi! Karidesin üstüne bir sıkım, oh!”':
    'Remzi the fisherman: “Limes just came in off the ship! One squeeze over shrimp — ahh!”',
  'Dedenin en sevdiği: karides, limon, bir tutam yeşillik.':
    'Your grandfather’s favourite: shrimp, lime and a pinch of greens.',
  'Limandaki gemiciler bile uygulamadan sipariş veriyor!':
    'Even the sailors down at the harbour are ordering on the app!',
  'Balıkçı Remzi: “Lezzetova’nın listesine girmezsen o listeyi denize atarım!”':
    'Remzi the fisherman: “If you don’t make Lezzetova’s list, I’ll throw that list into the sea!”',
  '(Güler.) Ağır ol Remzi, daha yolumuz uzun.':
    '(Laughs.) Easy, Remzi, we’ve still got a long way to go.',
  'Fırtınalı Gün': 'Stormy Day',
  'Çıtır soğan menüde': 'Crispy onion on the menu',
  'Bana boşuna Rüzgar demiyorlar! Ama bugünkü rüzgar benden de hızlı…':
    'They don’t call me Ruzgar — “Wind” — for nothing! But today’s wind is even faster than me…',
  'Yağmurda en iyisi çıtır soğan. Çorbanın üstünde çıtır çıtır, içinde mutluluk.':
    'Crispy onion is the best thing on a rainy day. Crunchy on top of the soup, happiness inside.',
  'Kokusu bütün sokağa yayıldı bile.': 'The smell has already spread down the whole street.',
  'Kapının önünde ıslak şemsiyeler sıralanmış. Kimse dışarı çıkmak istemiyor.':
    'Wet umbrellas are lined up by the door. Nobody wants to go back outside.',
  'Mrrr. (Ocağın yanındaki sıcak köşeye kıvrılır.)':
    'Purrr. (Curls up in the warm corner next to the stove.)',
  'Bıyıklı Turist': 'The Moustached Tourist',
  'Kılık değiştirmiş bir müşteri daha': 'Another customer in disguise',
  'Uygulamaya garip bir yorum düştü: “MegaNoodle daha iyi. İmza: Kesinlikle Baron Değil.”':
    'A weird review just popped up on the app: “MegaNoodle is better. Signed: Definitely Not the Baron.”',
  '(Gülmemek için dudağını ısırır.) Kesinlikle Baron değil, ha?':
    '(Biting back a laugh.) Definitely not the Baron, huh?',
  'Bugün gözünü dört aç. Takma bıyıklar ışıkta parlar.':
    'Keep your eyes peeled today. Fake moustaches shine in the light.',
  '(Takma bıyığı düşer.) Hmph! Bu sadece… bir keşif ziyaretiydi!':
    '(His fake moustache falls off.) Hmph! This was just… a scouting visit!',
  '(Bıyığı kapıp koşarak kaçar. Artık o onun oyuncağı.)':
    '(Grabs the moustache and dashes off. It’s Mochi’s toy now.)',
  'Kırk yıldır bu kadar güldüğümü hatırlamıyorum.':
    'I don’t remember laughing this much in forty years.',
  'Mahalle Bizimle': 'The Neighbourhood’s With Us',
  'Köri suyu menüde': 'Curry broth on the menu',
  'Bütün mahalle fırçalarla geldi! Tabelayı yeniden boyuyorlar: “NOODLES – Fener Sokağı’nın Kalbi”.':
    'The whole neighbourhood showed up with paintbrushes! They’re repainting the sign: “NOODLES – The Heart of Lantern Street”.',
  'Bu güzelliğe bir kase köri suyu yakışır. Sarı sarı, güneş gibi.':
    'Something this lovely deserves a bowl of curry broth. Golden yellow, like the sun.',
  'Fırıncı Nuri: “Boyacılara bedava kase yok mu şef?” (Göz kırpar.)':
    'Nuri the baker: “No free bowls for the painters, chef?” (Winks.)',
  'Önce müşteriler, sonra boyacılar! Hadi, herkes yerine!':
    'Customers first, painters second! Come on, everyone to your places!',
  'Şu tabelaya bak. Kırk yıl önce onu tek başıma asmıştım.':
    'Look at that sign. Forty years ago I hung it up all by myself.',
  'Kötü haber… MegaNoodle da uygulamaya girmiş. Üstelik yarı fiyatına!':
    'Bad news… MegaNoodle has joined the app too. And at half price!',
  'Demek savaş başlıyor.': 'So the war begins.',
  'Fiyat Savaşı': 'Price War',
  'MegaNoodle yarı fiyatına': 'MegaNoodle at half price',
  'MegaNoodle uygulamada: “Bir kase alana bir kase bedava!” Herkes onu konuşuyor.':
    'MegaNoodle on the app: “Buy one bowl, get one free!” Everyone’s talking about it.',
  'Biz de fiyatı düşürsek mi Nine?': 'Should we lower our prices too, Grandma?',
  'Fiyatı değil, çıtayı yükselt. İnsan ucuzu bir kez alır, güzeli her gün.':
    'Don’t lower the price, raise the bar. People buy cheap once, but they buy good every day.',
  'Miyav. (Kuyruğuyla menüyü gösterir. Aynen öyle demek istiyor.)':
    'Meow. (Points at the menu with her tail. That’s exactly what she means.)',
  'Manav Sabri: “Bedava kaseyi denedim. Karton gibi! Ben buraya devam.”':
    'Sabri the greengrocer: “I tried the free bowl. Tasted like cardboard! I’m sticking with you.”',
  'Gördün mü? Tat yalan söylemez.': 'See? Flavour never lies.',
  'Gece Pazarı': 'Night Market',
  'Yakisoba sosu menüde': 'Yakisoba sauce on the menu',
  'Gençken gece pazarında yakisoba yapardım. Tavada cız cız, sosu koyu koyu!':
    'When I was young, I made yakisoba at the night market. Sizzling in the pan, sauce thick and dark!',
  'Ama bu tarif defterde yok ki.': 'But that recipe isn’t in the book.',
  'Bazı tarifler defterde değil, buradadır. (Kalbini gösterir.) Yaz bakalım.':
    'Some recipes aren’t in the book, they’re in here. (Points to her heart.) Go on, write it down.',
  'Uygulamada bir tuhaflık var… Bir gecede yüz tane bir yıldızlı yorum gelmiş!':
    'Something weird is happening on the app… A hundred one-star reviews came in overnight!',
  'Yüz tane mi? Bugün dükkâna yüz kişi bile gelmedi!':
    'A hundred? Not even a hundred people came into the shop today!',
  'Sahte Yorumlar': 'Fake Reviews',
  'Bir yıldızlı yorum yağmuru': 'A flood of one-star reviews',
  'Yorumlara bak: “Çorbada kedi tüyü var!” “Erişte plastik!” Hepsi aynı dakikada yazılmış.':
    'Look at these reviews: “Cat hair in the soup!” “The noodles are plastic!” All written in the same minute.',
  'Hhhsss! (Kedi tüyü iftirasına çok bozuldu.)': 'Hssss! (Deeply offended by the cat hair lie.)',
  'Yalanın ömrü kısadır. Biz işimizi yapalım; gerçek müşteri gerçeği yazar.':
    'Lies don’t last long. Let’s just do our job; real customers write the truth.',
  'O zaman bugün her kase bir cevap olsun.': 'Then let every bowl today be our answer.',
  'Mahalle harekete geçti! Herkes kendi yorumunu yazıyor: “Hayatımın kasesi!”':
    'The neighbourhood is fighting back! Everyone’s writing their own review: “Bowl of my life!”',
  'Küçük Efe: “Ben de yazdım! Beş yıldız, yanına bir de kedi resmi çizdim.”':
    'Little Efe: “I wrote one too! Five stars, and I drew a cat next to it.”',
  'İşte mahalle budur.': 'That’s what a neighbourhood is.',
  'Gizli Müfettiş': 'The Secret Inspector',
  'Rehber için gizli tadım': 'A secret tasting for the guide',
  'Duyduğuma göre Lezzetova’nın rehberi için şehirde gizli tadımlar yapılıyormuş.':
    'I heard there are secret tastings happening around the city for Lezzetova’s guide.',
  'Rehbere girmek için tek bir kase yeter. Kaybetmek için de tek bir hata.':
    'One bowl is all it takes to get into the guide. And one mistake is all it takes to miss out.',
  'O zaman her müşteriye müfettişmiş gibi davranacağım.':
    'Then I’ll treat every customer like an inspector.',
  '(Peçesini kaldırır.) Sürpriz, şekerim. Müfettiş bendim. Notlarım… gizli.':
    '(Lifts her veil.) Surprise, darling. I was the inspector. My notes are… top secret.',
  'Yüzündeki o minik gülümseme… Bence iyi geçti.':
    'That tiny smile on her face… I think it went well.',
  'Seladon Kaseler': 'Celadon Bowls',
  'Seladon yeşil kase rafta': 'The celadon green bowl is on the shelf',
  'Dolabın dibinde seladon kaselerimi buldum. Yeşil, çay yaprağı gibi.':
    'I found my celadon bowls at the back of the cupboard. Green, like tea leaves.',
  'Bunları bana çok eski bir dostum hediye etmişti. Lale… Ah, neyse.':
    'A very old friend gave me these. Lale… Oh, never mind.',
  'Lale kim Nine?': 'Who’s Lale, Grandma?',
  'Başka zaman anlatırım evladım. Müşteriler bekliyor!':
    'I’ll tell you another time, dear. Customers are waiting!',
  '(Gece yarısı arka kapıdan bir tıkırtı geliyor. Mochi kulaklarını dikmiş, karanlığa bakıyor.)':
    '(At midnight, there’s a tap-tap-tap at the back door. Mochi’s ears are up as she stares into the dark.)',
  'Hrrr… (Kuyruğu fırça gibi kabarmış.)': 'Hrrr… (Her tail is puffed up like a bottle brush.)',
  'Çalınan Sayfa': 'The Stolen Page',
  'Kemik suyu tarifi kayıp!': 'The bone broth recipe is missing!',
  'Nine! Defterden kemik suyu sayfası koparılmış!':
    'Grandma! Someone tore the bone broth page out of the book!',
  'Arka kapıda mor bir eldiven buldum. Kimin olabilir ki? (Göz kırpar.)':
    'I found a purple glove by the back door. Whose could it be? (Winks.)',
  'Sayfayı alabilirler, ama on sekiz saatlik sabrı çalamazlar.':
    'They can take the page, but they can’t steal eighteen hours of patience.',
  'Tarifi ezbere biliyorum zaten. Kemik suyu bugün her zamankinden güzel olacak!':
    'I know the recipe by heart anyway. Today’s bone broth will be the best ever!',
  'MegaNoodle bugün “Yeni! Kemik Suyu Paketi” çıkarmış. Tadına baktım… Bulaşık suyu gibi!':
    'MegaNoodle just launched a “New! Bone Broth Packet”. I tasted it… Like dishwater!',
  'Gördün mü? Tarif kâğıtta değil, ellerde yaşar.':
    'See? A recipe doesn’t live on paper, it lives in your hands.',
  'Karanlık Gece': 'Dark Night',
  'Fırtına ve elektrik kesintisi': 'A storm and a power cut',
  '(Gök gürler. Bütün sokağın ışıkları bir anda söner!)':
    '(Thunder rumbles. Every light on the street goes out at once!)',
  'Elektrik gitti! Ama ocak gazla yanıyor, devam!':
    'The power’s gone! But the stove runs on gas, keep going!',
  'Fenerleri yakın! Bu sokağa Fener Sokağı boşuna denmedi.':
    'Light the lanterns! They don’t call this Lantern Street for nothing.',
  'Miyav! (Gözleri karanlıkta iki küçük fener gibi parlıyor.)':
    'Meow! (Her eyes glow in the dark like two tiny lanterns.)',
  'Elektrikçi Hasan: “Kabloyu biri bilerek kesmiş. Yanında da mor bir düğme buldum.”':
    'Hasan the electrician: “Someone cut the cable on purpose. And I found a purple button next to it.”',
  'Mor düğme, mor eldiven, mor mühür… Hmm, kim olabilir acaba?':
    'Purple button, purple glove, purple seal… Hmm, who could it possibly be?',
  'Baron Masada': 'The Baron at the Table',
  'Bu sefer kılık yok': 'No disguise this time',
  'Alarm! Kapının önünde simsiyah bir limuzin durdu!':
    'Alert! A jet-black limousine just pulled up outside!',
  'Baron bizzat gelmiş. Bu sefer ne takma bıyık var ne kılık.':
    'The Baron came in person. No fake moustache, no disguise this time.',
  'Sakin olalım. Ona da herkese yaptığımızı yapacağız: en güzel kaseyi.':
    'Let’s stay calm. We’ll do for him what we do for everyone: make the best bowl we can.',
  'Söyleyin bakalım… Bu sokakta neden kimse benim paketlerimi istemiyor?':
    'Tell me… why does nobody on this street want my packets?',
  'Çünkü sen paket satıyorsun, Baron. Biz sofra kuruyoruz.':
    'Because you sell packets, Baron. We set a table.',
  '(Bir an susar. Sonra şapkasını takıp hızla çıkar.)':
    '(He goes quiet for a moment. Then he puts on his hat and hurries out.)',
  'Rehber Çıktı': 'The Guide Is Out',
  'Şehrin En İyi On Kasesi': 'The City’s Ten Best Bowls',
  'Gazete! Gazete! “Şehrin En İyi On Kasesi” çıktı!':
    'Extra! Extra! “The City’s Ten Best Bowls” is out!',
  '(Titreyen ellerle sayfayı çevirir.) Onuncu… dokuzuncu… yok… yok…':
    '(Turns the page with shaking hands.) Tenth… ninth… not there… not there…',
  'BİRİNCİ! “Noodles, Fener Sokağı: Ruhu olan bir mutfak.” BİRİNCİYİZ!':
    'NUMBER ONE! “Noodles, Lantern Street: a kitchen with soul.” WE’RE NUMBER ONE!',
  'Miyaaav! (Gazetenin üstüne oturur. Artık bu onun gazetesi.)':
    'Meooow! (Sits on the newspaper. It’s her newspaper now.)',
  '(Telefonda.) Tebrikler şekerim. Ama unutma: tepeye çıkmak kolay, orada kalmak zor.':
    '(On the phone.) Congratulations, darling. But remember: getting to the top is easy, staying there is hard.',
  'Kırk yıl… Kırk yıl sonra birinci. (Gözlerini siler.)':
    'Forty years… Forty years, and now number one. (Wipes her eyes.)',
  'Ustalık Sınavı': 'The Master’s Exam',
  'Hana Nine’nin önlüğü': 'Grandma Hana’s apron',
  'Birinci olduk, ama bir şef asıl sınavı kendine verir.':
    'We’re number one, but a real chef’s toughest exam is the one they set themselves.',
  'Bugün senden zor bir kase isteyeceğim. Geçersen önlüğüm senin.':
    'Today I’ll order a tricky bowl. Pass, and my apron is yours.',
  'O önlüğü kırk yıldır senden başkası giymedi…':
    'Nobody but you has worn that apron in forty years…',
  'Mrr. (Önlüğün cebinde uyuyor. Önce onu çıkarmak lazım.)':
    'Mrr. (Asleep in the apron pocket. You’ll have to get her out first.)',
  '(Önlüğü omzuna koyar.) Artık bu dükkânın şefi sensin. Ben sadece Hana Nine’yim.':
    '(Places the apron on your shoulders.) You’re the chef of this shop now. I’m just Grandma Hana.',
  'Alkışlar! Bütün kurye grubu canlı izliyordu!':
    'Applause! The whole courier group was watching live!',
  'Son Hediye': 'The Last Gift',
  'Pirinç eriştesi ve susam menüde': 'Rice noodles and sesame on the menu',
  'Bütün defter mi? Ama Nine, sen hep burada olacaksın, değil mi?':
    'The whole book? But Grandma, you’ll always be here, right?',
  '(Gülümser.) Elbette. Sadece biraz daha az ayakta, biraz daha çok oturarak.':
    '(Smiles.) Of course. Just a bit less standing, and a bit more sitting.',
  'Festival afişleri asılmaya başladı! Yirmi gün kaldı!':
    'The festival posters are going up! Twenty days to go!',
  'Biraz yoruldum evladım. Yarın evde dinleneceğim, dükkân sana emanet.':
    'I’m a little tired, dear. I’ll rest at home tomorrow — the shop is in your hands.',
  'Miyav… (Hana Nine’nin peşinden kapıya kadar yürür.)':
    'Meow… (Follows Grandma Hana all the way to the door.)',
  'Tek Başına': 'On Your Own',
  'Hana Nine evde dinleniyor': 'Grandma Hana is resting at home',
  'İlk kez Nine olmadan açıyorum. Ellerim titriyor.':
    'First time opening without Grandma. My hands are shaking.',
  'Hana Nine iyi, sadece biraz dinlenmesi lazım. Ona her gün sıcak bir kase götüreceğim!':
    'Grandma Hana is fine, she just needs a little rest. I’ll bring her a hot bowl every day!',
  'Manav Sabri: “Merak etme evlat, hepimiz buradayız. Bulaşıklar bende!”':
    'Sabri the greengrocer: “Don’t worry, kid, we’re all here. I’ll do the dishes!”',
  'Miyav. (Hana Nine’nin taburesine oturur, yerini korur.)':
    'Meow. (Sits on Grandma Hana’s stool, saving her spot.)',
  'Kaseyi götürdüm. Hana Nine bir kaşık aldı ve “Tuzu tam yerinde” dedi!':
    'I delivered the bowl. Grandma Hana took one spoonful and said, “The salt is just right”!',
  'Yarın daha da iyisini yapacağım.': 'Tomorrow I’ll make it even better.',
  'Mahalle Mutfakta': 'The Neighbourhood Cooks',
  'Komşular yardıma koşuyor': 'The neighbours rush to help',
  'Min-ji Hanım önlüğünü bağlamış, Fırıncı Nuri kasaları taşıyor, Küçük Efe peçeteleri katlıyor!':
    'Mrs Min-ji has tied on an apron, Nuri the baker is carrying crates, Little Efe is folding napkins!',
  'Siz… hepiniz mi geldiniz?': 'You… you all came?',
  'Öğretmen Selma: “Hana Nine bize kırk yıl çorba verdi. Şimdi sıra bizde.”':
    'Ms Selma the teacher: “Grandma Hana gave us soup for forty years. Now it’s our turn.”',
  'Mrrr. (Küçük Efe’nin kucağında uyuyakalmış.)': 'Purrr. (Fell asleep in Little Efe’s lap.)',
  'Hana Nine’ye bugünün fotoğrafını götürdüm. Gülümsedi, sonra mışıl mışıl uyudu.':
    'I took Grandma Hana a photo of today. She smiled, then drifted off to sleep.',
  'Sel Gecesi': 'Flood Night',
  'Fırtına dükkânı su bastı': 'The storm floods the shop',
  '(Sokak dereye dönmüş! Çamurlu su kapının altından içeri sızıyor!)':
    '(The street has turned into a river! Muddy water is seeping in under the door!)',
  'Kum torbalarını getirin! Kasaları yükseğe kaldırın!':
    'Bring the sandbags! Lift the crates up high!',
  'Motorumla kum torbası taşıyorum! Sağanak beni durduramaz!':
    'I’m hauling sandbags on my scooter! No downpour can stop me!',
  '(Telefonda.) Sakin ol evladım. O dükkân kırk fırtına gördü, bunu da atlatır.':
    '(On the phone.) Stay calm, dear. That shop has seen forty storms; it’ll get through this one too.',
  'Su çekildi ama dolapların altı perişan. Yarın her yeri silmemiz lazım.':
    'The water’s gone, but the bottoms of the cupboards are a mess. We’ll need to scrub everything tomorrow.',
  '(Mochi ortalıkta yok. Ne mama kabının başında, ne en sevdiği rafta…)':
    '(Mochi is nowhere to be seen. Not by her food bowl, not on her favourite shelf…)',
  'Mochi Nerede?': 'Where’s Mochi?',
  'Dükkânın patronu kayıp': 'The boss of the shop is missing',
  'Mochi! Mochi! Sabahtan beri ortada yok…': 'Mochi! Mochi! She’s been gone since this morning…',
  'Bütün kuryelere fotoğrafını gönderdim: “Kahverengi beyaz tekir, çok havalı, chashu sever.”':
    'I sent her photo to every courier: “Brown and white tabby, very cool, loves chashu.”',
  'Küçük Efe: “Her sokağa ‘Mochi kayıp’ afişi astım. Kalpli çizdim!”':
    'Little Efe: “I put up ‘Mochi is missing’ posters on every street. I drew hearts on them!”',
  'Dükkânı açık tutalım. Belki kokuyu alıp geri gelir.':
    'Let’s keep the shop open. Maybe she’ll smell the food and come back.',
  'Miyav! (Kapıda belirir. Ağzında tozlu, eski bir zarf var!)':
    'Meow! (Appears at the door. There’s a dusty old envelope in her mouth!)',
  'Mochi! Nereye gittin sen? Ve bu… bu zarf da ne?':
    'Mochi! Where did you go? And this… what’s this envelope?',
  '(Zarfta eski bir fotoğraf: genç Hana, yanında bir kadın, ortada silindir şapkalı minik bir çocuk.)':
    '(Inside is an old photo: young Hana, a woman beside her, and a tiny boy in a top hat between them.)',
  'Hana Dönüyor': 'Hana Returns',
  'Eski bir fotoğrafın sırrı': 'The secret of an old photo',
  'Döndüm! Bu fotoğraf da ne? Mochi selden sonra açılan eski duvar dolabında mı bulmuş?':
    'I’m back! What’s this photo? Did Mochi find it in the old wall cupboard that the flood opened up?',
  'Bu Lale. En yakın dostum. Bu tezgâhı birlikte açmıştık. Kucağındaki de oğlu…':
    'This is Lale. My best friend. We opened this counter together. And the little one on her lap is her son…',
  'Silindir şapkalı çocuk… Baron Kraker mı?!': 'The boy in the top hat… Baron Kraker?!',
  'Lale uzaklara taşınınca birbirimizi kaybettik. Oğlu da annesinin tadını kaybetti galiba.':
    'When Lale moved far away, we lost touch. I think her son lost the taste of his mother’s cooking, too.',
  'Karar verdim: Festivalde Baron’a Lale’nin tarifini pişireceğiz.':
    'I’ve decided: at the festival, we’ll cook Lale’s recipe for the Baron.',
  'Ama tarif nerede?': 'But where’s the recipe?',
  'Fotoğrafın arkasına bak, evladım.': 'Look on the back of the photo, dear.',
  'Fotoğrafın Arkası': 'The Back of the Photo',
  'Lale’nin el yazısı': 'Lale’s handwriting',
  '(Fotoğrafı çevirir.) “Pazar çorbası: soya suyu, ince pirinç eriştesi, bir yumurta, bol susam, iki shiitake. Bir tutam da sevgi. — Lale”':
    '(Turns the photo over.) “Sunday soup: soy broth, thin rice noodles, one egg, lots of sesame, two shiitake. And a pinch of love. — Lale”',
  'Pazar çorbası! Lale her pazar oğluna bunu yapardı.':
    'Sunday soup! Lale made this for her son every Sunday.',
  'Yani Baron’un kalbine giden yol bir kase çorbadan mı geçiyor?':
    'So the way to the Baron’s heart is through a bowl of soup?',
  'Herkesin kalbine giden yol bir kase çorbadan geçer.':
    'The way to everyone’s heart is through a bowl of soup.',
  'Manav Sabri: “Dükkân selden sonra pırıl pırıl oldu. Sanki yeni açılmış gibi!”':
    'Sabri the greengrocer: “After the flood, the shop is sparkling clean. It’s like it just opened!”',
  'Bazen bir fırtına, tozlu köşeleri temizlemek için gelir.':
    'Sometimes a storm comes along just to clean out the dusty corners.',
  'Baron’un Teklifi': 'The Baron’s Offer',
  'Bir çanta dolusu para': 'A suitcase full of money',
  '(Bir çanta dolusu parayla gelir.) Dükkânı bana satın. Bu parayla on dükkân açarsınız!':
    '(Arrives with a suitcase full of money.) Sell me the shop. With this money you could open ten shops!',
  'Ama o on dükkânın hiçbiri Fener Sokağı’nda olmaz.':
    'But none of those ten shops would be on Lantern Street.',
  'Bu dükkân satılık değil, Baron. Ama bir kase çorba sana her zaman bedava.':
    'This shop isn’t for sale, Baron. But a bowl of soup is always free for you.',
  'Hmph! Festivalde görüşürüz! (Çanta kapanır, kapı çarpar.)':
    'Hmph! See you at the festival! (The suitcase snaps shut, the door slams.)',
  'Paraya hayır dediniz… Siz bu sokağın kahramanlarısınız!':
    'You said no to all that money… You’re the heroes of this street!',
  'Miyav. (Çantanın bıraktığı izi koklar ve hapşırır.)':
    'Meow. (Sniffs where the suitcase was and sneezes.)',
  'Yeniden Ayakta': 'Back on Our Feet',
  'Selden sonra büyük açılış': 'The grand reopening after the flood',
  'Bugün ikinci açılışımız! Kepengi birlikte kaldıralım mı?':
    'Today is our second opening! Shall we lift the shutter together?',
  'Bütün mahalle kapıda alkışlıyor. Fırıncı Nuri kocaman bir pasta getirmiş!':
    'The whole neighbourhood is cheering at the door. Nuri the baker brought a giant cake!',
  'Bir… iki… üç… Kepenk yukarı!': 'One… two… three… Shutter up!',
  'Bugün uygulamada rekor kırdık! Tam yüz paket!':
    'We broke the app record today! A hundred deliveries exactly!',
  'Fırtına geldi, geçti. Biz hâlâ buradayız.': 'The storm came and went. And we’re still here.',
  'Festival Daveti': 'The Festival Invitation',
  'Belediyeden mühürlü bir mektup': 'A sealed letter from the town hall',
  'Postacı bir mektup getirdi! Üstünde belediye mührü var!':
    'The postman brought a letter! It has the town hall seal on it!',
  '“Fener Festivali’nde meydan, jürinin seçeceği mutfağa verilecektir. Jüri başkanı: Madam Lezzetova.”':
    '“At the Lantern Festival, the square will be awarded to the kitchen chosen by the jury. Head of the jury: Madame Lezzetova.”',
  'On bir gün kaldı. Her günü bir antrenman gibi düşün.':
    'Eleven days to go. Think of every day as practice.',
  'Miyav! (Mektubu kemirmeye çalışır.)': 'Meow! (Tries to nibble the letter.)',
  '(Karşı kaldırımdan seslenir.) Festivalde fabrikanın temelini atacağım! Meydan benim olacak!':
    '(Calling from across the street.) At the festival I’ll lay the factory’s first stone! The square will be mine!',
  'Göreceğiz Baron. Göreceğiz.': 'We’ll see, Baron. We’ll see.',
  'Sakura Kaseler': 'Sakura Bowls',
  'Sakura desenli kase rafta': 'The sakura pattern bowl is on the shelf',
  'Festival için en güzel kaselerimi çıkarıyorum: sakura desenliler!':
    'I’m bringing out my prettiest bowls for the festival: the sakura ones!',
  'Çiçek açmış gibi duruyorlar!': 'They look like they’re in full bloom!',
  'Uygulamaya “Festival Menüsü” sekmesi ekledim. Siparişler şimdiden yağıyor!':
    'I added a “Festival Menu” tab to the app. Orders are already pouring in!',
  'Öğretmen Selma: “Sınıfça festival için fener yapıyoruz. Her fenere bir kase çizdik!”':
    'Ms Selma the teacher: “Our class is making lanterns for the festival. We drew a bowl on every one!”',
  'Fener Sokağı yine fenerlerle dolacak.': 'Lantern Street will be full of lanterns again.',
  'Fener Yapımı': 'Lantern Making',
  'Mahalle festivale hazırlanıyor': 'The neighbourhood gets ready for the festival',
  'Sokak baştan sona kâğıt fenerlerle süsleniyor. Kırmızı, sarı, turuncu!':
    'The whole street is being decorated with paper lanterns. Red, yellow, orange!',
  'Miyav! (Bir fenerin ipini yakalamış, bırakmıyor.)':
    'Meow! (Has caught a lantern string and won’t let go.)',
  'Mochi, o fener festival için! Oyuncak değil!':
    'Mochi, that lantern is for the festival! It’s not a toy!',
  '(Kahkaha atar.) Bırak oynasın. Bu sokağın her şeyi biraz da onun.':
    '(Bursts out laughing.) Let her play. Everything on this street belongs to her a little bit, too.',
  'Haber: MegaNoodle meydana dev bir sahne kuruyor. Üstünde de dev bir Baron heykeli!':
    'News: MegaNoodle is building a giant stage on the square. With a giant statue of the Baron on top!',
  'Dev heykel mi? Biz de küçük ama sıcacık bir tezgâh kuracağız.':
    'A giant statue? We’ll set up a small but cosy counter.',
  'Jüri Provası': 'Jury Rehearsal',
  'Lezzetova festivalden önce uğruyor': 'Lezzetova drops by before the festival',
  'Madam Lezzetova yola çıkmış! Jüri başkanı olarak tarafsız olması lazım ama…':
    'Madame Lezzetova is on her way! As head of the jury she has to be fair, but…',
  'Tarafsız olsun. Biz kayırılmak değil, tadılmak istiyoruz.':
    'Let her be fair. We don’t want favours, we want to be tasted.',
  'Bugün her kase bir festival kasesi.': 'Every bowl today is a festival bowl.',
  'Jüri başkanı olarak bir şey söyleyemem. Ama bir insan olarak… bu kaseyi unutmayacağım.':
    'As head of the jury, I can’t say a thing. But as a person… I will never forget this bowl.',
  'Ondan bu söz, bin yıldıza bedel.': 'Those words, from her, are worth a thousand stars.',
  'Pazar Çorbası': 'Sunday Soup',
  'Lale’nin tarifinin eksik parçası': 'The missing piece of Lale’s recipe',
  'Lale’nin pazar çorbasını deneyelim. Tadı doğru olmalı, tam doğru.':
    'Let’s try Lale’s Sunday soup. The taste has to be right, exactly right.',
  'Soya suyu, ince pirinç eriştesi, bir yumurta, bol susam, iki shiitake… Bir şey eksik.':
    'Soy broth, thin rice noodles, one egg, lots of sesame, two shiitake… Something’s missing.',
  'Bir tutam sevgi… Yani biraz yeşil soğan! Lale onu hep en son, gülümseyerek serperdi.':
    'A pinch of love… That means a little green onion! Lale always sprinkled it on last, with a smile.',
  'Miyav. (Onaylar gibi yavaşça göz kırpar.)': 'Meow. (Blinks slowly, as if to say yes.)',
  '(Bir kaşık tadar, gözleri dolar.) İşte… Lale’nin çorbası.':
    '(Takes a sip, and her eyes fill with tears.) That’s it… Lale’s soup.',
  'Festivalde Baron’a bunu pişireceğiz. Söz.':
    'We’ll cook this for the Baron at the festival. Promise.',
  'Son Fırtına': 'The Last Storm',
  'Festival süsleri tehlikede': 'The festival decorations are in danger',
  'Fırtına geri döndü! Fenerler uçuşuyor!': 'The storm is back! The lanterns are flying away!',
  'Bütün mahalle fenerleri toplayıp dükkânın tavanına asıyor. İçerisi masal gibi oldu!':
    'The whole neighbourhood is gathering the lanterns and hanging them from the shop ceiling. It’s like a fairy tale in here!',
  'Yağmur da bizi durduramaz. Sıcak kaseler hazır!':
    'Rain can’t stop us either. Hot bowls coming up!',
  '(Kapıya mor bir şemsiye bırakılmış. Üstünde bir not: “Fenerleriniz ıslanmasın. — B.K.”)':
    '(Someone has left a purple umbrella at the door. There’s a note on it: “Don’t let your lanterns get wet. — B.K.”)',
  'B.K.… Baron Kraker mı? Demek o buz dağı erimeye başladı.':
    'B.K.… Baron Kraker? So that iceberg is starting to melt.',
  'Kurye Maratonu': 'Courier Marathon',
  'Rüzgar’ın en uzun gecesi': 'Ruzgar’s longest night',
  'Festival öncesi şehir çıldırdı! Uygulamada sipariş üstüne sipariş!':
    'The whole city’s gone wild before the festival! Order after order on the app!',
  'Bugün telefonu sık dinle şef. Paket kutusu hiç boş kalmasın!':
    'Listen out for the phone today, chef. Don’t let the delivery box sit empty!',
  'Salon dolu, telefon çalıyor, Mochi ayağımın dibinde… Harika!':
    'Dining room’s full, phone’s ringing, Mochi’s at my feet… Perfect!',
  'Bin kilometre! Motor yoruldu, ben yorulmadım! (Kanepeye yığılır.)':
    'A thousand kilometres! The scooter’s tired, but I’m not! (Collapses onto the sofa.)',
  '(Üstüne battaniye örter.) Kahramanların da uykusu gelir.':
    '(Tucks a blanket over him.) Even heroes need their sleep.',
  'Sahte Balıkçı': 'The Fake Fisherman',
  'Baron’un son kılığı': 'The Baron’s last disguise',
  'Balıkçı Remzi: “Limanda benim gibi giyinmiş biri dolaşıyor! Sakalı yamuk, bıyığı mor!”':
    'Remzi the fisherman: “There’s someone at the harbour dressed just like me! Wonky beard, purple moustache!”',
  'Mor bıyık mı? Kim olabilir acaba…': 'A purple moustache? I wonder who that could be…',
  'Bırak gelsin. Belki bu sefer sadece acıkmıştır.':
    'Let him come. Maybe this time he’s just hungry.',
  '(Kapıda durur.) Neden… neden bana hep güzel kaseler yapıyorsunuz? Ben size kötülük ettim.':
    '(Stops at the door.) Why… why do you always make me such lovely bowls? I’ve been so mean to you.',
  'Çünkü aç gelen herkese güzel bir kase yapılır, Baron. Bu dükkânın tek kuralı bu.':
    'Because everyone who comes in hungry gets a lovely bowl, Baron. That’s this shop’s only rule.',
  'Hazırlık Günü': 'Getting Ready',
  'Yarın tezgâh meydana taşınıyor': 'Tomorrow the counter moves to the square',
  'Yarın tezgâhı meydana taşıyoruz. Bugün son normal gün!':
    'Tomorrow we move the counter to the square. Today is our last normal day!',
  'Fırıncı Nuri: “Masalar benden!” Manav Sabri: “Sebzeler benden!”':
    'Nuri the baker: “I’ve got the tables!” Sabri the greengrocer: “I’ve got the veggies!”',
  'Kırk yıl önce de böyleydi. Herkes bir ucundan tutardı.':
    'It was just like this forty years ago. Everyone grabbed a corner and lifted.',
  'Rehberdeki birinciliğimizi duyan herkes geliyor. Festival dolup taşacak!':
    'Everyone who heard we’re number one in the guide is coming. The festival will be packed!',
  'Miyav! (Paket kutusunun içine girmiş. Festivale gitmeye hazır.)':
    'Meow! (Has climbed into a delivery box. Ready to go to the festival.)',
  'Festival Başlıyor': 'The Festival Begins',
  'Birinci gün: meydan fenerlerle dolu': 'Day one: the square is full of lanterns',
  'Festival üç gün sürecek. Her gün bir kase, her kase bir oy.':
    'The festival lasts three days. Every day a bowl, every bowl a vote.',
  'Birinci günün sonunda puanlar başa baş: Noodles ve MegaNoodle!':
    'At the end of day one, the scores are neck and neck: Noodles and MegaNoodle!',
  '(Kendi standında tek başına oturuyor. Arada bir Noodles tezgâhına bakıyor.)':
    '(Sitting alone at his own stand. Every now and then, he glances over at the Noodles counter.)',
  'Başa Baş': 'Neck and Neck',
  'İkinci gün: kuyruk meydanı sardı': 'Day two: the queue wraps around the square',
  'İkinci gün! Kuyruk meydanı iki kez sardı!': 'Day two! The queue wraps around the square twice!',
  'Bugün ben de müşteriyim. Festivalde şef de acıkır, nine de.':
    'Today I’m a customer too. Even chefs get hungry at festivals — and grandmas too.',
  'O zaman sıranı bekle Nine! (Göz kırpar.)': 'Then wait your turn, Grandma! (Winks.)',
  'İkinci günün sonunda puanlar… yine başa baş! Karar yarın, final kasesiyle verilecek.':
    'At the end of day two, the scores are… still neck and neck! The decision comes tomorrow, with the final bowl.',
  'Yarın Baron’a Lale’nin çorbasını pişireceğiz. Ne olursa olsun.':
    'Tomorrow we cook Lale’s soup for the Baron. No matter what.',
  'Final gecesi! Bütün şehir meydanda, fenerler gökyüzüne yükseliyor.':
    'The final night! The whole city is in the square, and lanterns are rising into the sky.',
  'Bütün defter sende, bütün mahalle arkanda. Gerisi sadece bir kase.':
    'The whole book is yours, the whole neighbourhood is behind you. The rest is just one bowl.',
  'Bu gece telefon da susmayacak! Son tur, motor hazır!':
    'The phone won’t stop ringing tonight either! Last round, scooter ready!',
  'Hadi Noodles. Fener Sokağı için!': 'Come on, Noodles. For Lantern Street!',
  'Bonjour! Ben… çok uzaklardan gelen bir turistim. Kesinlikle Baron değilim. Hmph.':
    'Bonjour! I am… a tourist from very far away. Definitely not the Baron. Hmph.',
  'Fıstık soslu, çorbasız bir kalın udon. Tam 2 dilim chashu, bol fasulye filizi ve biraz kırmızı biber. Erişte diri kalsın.':
    'A thick udon with peanut sauce, no broth. Exactly 2 slices of chashu, lots of bean sprouts and a little red chili. Keep the noodles firm.',
  'Magnifique! Yani… Hmph. İdare eder. (Bıyığı titrer.)':
    'Magnifique! I mean… Hmph. It’ll do. (His moustache twitches.)',
  'Hmph. Turistler daha iyisini hak eder.': 'Hmph. Tourists deserve better.',
  'Ha! Bunu bütün turist arkadaşlarıma anlatacağım!':
    'Ha! I’ll tell all my tourist friends about this!',
  'Peçeli Hanım': 'The Veiled Lady',
  'Bir masa lütfen. Ve… soru sormayın, şekerim.': 'A table, please. And… no questions, darling.',
  'Köri suyuyla bir kalın udon. Tam 2 tempura karides, 3 pak choi, biraz çıtır soğan ve 2 dilim limon. Erişte iyice yumuşak olsun.':
    'A thick udon in curry broth. Exactly 2 tempura shrimp, 3 pak choi, a little crispy onion and 2 lime wedges. Make the noodles nice and soft.',
  'Hmm. (Not defterine uzun uzun bir şey yazar ve gülümser.)':
    'Hmm. (Writes something long in her notebook, and smiles.)',
  'Hmm. (Not defterine kısa bir şey yazar.)': 'Hmm. (Writes something short in her notebook.)',
  'Hmm. (Not defterini sertçe kapatır.)': 'Hmm. (Snaps her notebook shut.)',
  'Baron Kraker': 'Baron Kraker',
  'Hmph! Hâlâ açık mısınız? İnatçı dükkân.': 'Hmph! Still open? Stubborn little shop.',
  'Tatlı acı soslu, çorbasız bir ince soba. Tam 3 parça kimchi, 2 parça tofu ve bol yeşil soğan. Ama mısır olmasın! Hmph.':
    'A thin soba with sweet chili sauce, no broth. Exactly 3 pieces of kimchi, 2 pieces of tofu and lots of green onion. But no corn! Hmph.',
  'Hmph… Bu da nesi? Neden bu kadar güzel?! (Hızla kaşığını bırakır.)':
    'Hmph… What is this? Why is it so good?! (Quickly puts down his spoon.)',
  'Hmph. Görüyorsunuz, sonunuz yakın.': 'Hmph. You see? Your days are numbered.',
  'Ha! Fabrikam bundan iyisini uykusunda yapar!':
    'Ha! My factory makes better than this in its sleep!',
  'Önlüğümü getirdim. Bakalım hak edecek misin?': 'I brought my apron. Let’s see if you earn it.',
  'Kemik suyuyla bir kalın ramen. Tam 3 dilim chashu, 2 yumurta, 2 yaprak nori, biraz bambu filizi ve bol yeşil soğan. Erişte diri kalsın. Bir usta gibi!':
    'A thick ramen in bone broth. Exactly 3 slices of chashu, 2 eggs, 2 sheets of nori, a few bamboo shoots and lots of green onion. Keep the noodles firm. Like a true master!',
  'İşte gerçek bir şef! Önlük senin, evladım.': 'Now that’s a real chef! The apron is yours, dear.',
  'Neredeyse… Bir dahakine kesin olacak.': 'Almost… Next time you’ll get it for sure.',
  'Acele etme. Usta olmak zaman ister.': 'Don’t rush. Becoming a master takes time.',
  'Bakalım ben yokken neler öğrendin, evladım?':
    'Let’s see what you learned while I was away, dear.',
  'Tavuk suyuyla bir orta kalınlıkta udon. 1 yumurta, 2 pak choi, biraz susam ve yeşil soğan. Erişte iyice yumuşak olsun; dişlerim eskisi gibi değil.':
    'A medium udon in chicken broth. 1 egg, 2 pak choi, a little sesame and some green onion. Make the noodles nice and soft; my teeth aren’t what they used to be.',
  'Mmm… Şifa gibi. Ben yokken büyümüşsün sen.':
    'Mmm… Like medicine for the heart. You’ve grown up while I was away.',
  'Güzel evladım. Biraz daha sevgi ekle.': 'Lovely, dear. Add a little more love.',
  'Olsun. Yorgunsun, biliyorum. Yarın daha iyi olur.':
    'That’s alright. You’re tired, I know. Tomorrow will be better.',
  'Jüri başkanı olmadan önce bir kez daha tatmalıyım, şekerim.':
    'Before I become head of the jury, I must taste it once more, darling.',
  'Miso suyuyla bir kalın soba. Tam 3 shiitake, 2 parça tofu, 2 tutam mısır, biraz çıtır soğan ve bol fasulye filizi. Seladon yeşil kasede olsun lütfen. Erişte diri kalsın.':
    'A thick soba in miso broth. Exactly 3 shiitake, 2 pieces of tofu, 2 pinches of corn, a little crispy onion and lots of bean sprouts. In the celadon green bowl, please. Keep the noodles firm.',
  'Mükemmel. Festivalde de böyle şaşırt beni.':
    'Perfect. Keep surprising me like this at the festival.',
  'İyi… ama festivalde “iyi” yetmez.': 'Good… but at the festival, “good” isn’t enough.',
  'Endişeliyim şekerim. Çok endişeliyim.': 'I’m worried, darling. Very worried.',
  'Ahoy! Ben… balıkçıyım. Gerçek bir balıkçı. Hmph.':
    'Ahoy! I am… a fisherman. A real fisherman. Hmph.',
  'Tavuk suyuyla bir ince ramen. Tam 2 tempura karides, 2 dilim naruto, 1 dilim limon ve bol yeşil soğan. Siyah mat kasede olsun lütfen.':
    'A thin ramen in chicken broth. Exactly 2 tempura shrimp, 2 slices of naruto, 1 lime wedge and lots of green onion. In the matte black bowl, please.',
  '(Takma sakalı düşer.) …Bunu da mı beceriyorsunuz? Hmph. Çok lezzetli.':
    '(His fake beard falls off.) …You can do this too? Hmph. Very tasty.',
  'Hmph. Bir balıkçı bundan fazlasını bekler.': 'Hmph. A fisherman expects more than this.',
  'Ha! Karides bile üzgün görünüyor!': 'Ha! Even the shrimp look sad!',
  'Sıra bende! Festivalde nineler de acıkır.': 'My turn! Grandmas get hungry at festivals too.',
  'Köri suyuyla bir orta kalınlıkta pirinç eriştesi. Tam 2 tempura karides, 2 dilim limon, bol fasulye filizi, biraz kırmızı biber ve susam. Sakura desenli kasede olsun lütfen.':
    'Medium rice noodles in curry broth. Exactly 2 tempura shrimp, 2 lime wedges, lots of bean sprouts, a little red chili and some sesame. In the sakura pattern bowl, please.',
  'Mmm… Bu kaseyle festival kazanılır, evladım!': 'Mmm… A bowl like this wins festivals, dear!',
  'Güzel. Yarın biraz daha dikkat, olur mu?': 'Nice. A little more care tomorrow, alright?',
  'Yorgunsun. Derin bir nefes al; yarın büyük gün.':
    'You’re tired. Take a deep breath; tomorrow is the big day.',

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
