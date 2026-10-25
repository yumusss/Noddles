# Noddles — Sanat Yönü (v2 estetik geçişi)

Hedef: "Pinterest'ten çıkmış" bir Japon noodle dükkânı. Sıcak, sakin, temiz, el çizimi hissi
veren **illüstratif gerçekçilik**. Ne fotoğraf taklidi ne de "AI çizimi" gibi gürültülü/noise'lu
dokular. Tutarlılık her şeyden önemli: tüm ekranlar aynı palet, aynı ışık, aynı çizgi dilini kullanır.

## Palet (CSS değişkenleri, `src/index.css :root`'a eklendi)
- `--cream: #f6efe4` (kâğıt/duvar), `--linen: #ece2d2`, `--sand: #d9c4a3`
- `--oak: #c4935b`, `--walnut: #7b4f2e`, `--ink: #2b2420` (koyu kahve-siyah, saf siyah yok)
- `--clay: #c8553d` (terracotta), `--persimmon: #e8803c`, `--matcha: #7c9a6e`, `--indigo: #3b4a6b`
- `--gold: #d9a441`, `--blush: #e9b8b2`
- Gölgeler: saf siyah yerine `#2b2420` alfa; parlamalar sıcak beyaz `#fff6e8`.
- Doygunluk orta; neon/parlak saf renk yok. Gradyanlar yumuşak, 2–3 durak.

## Işık ve zaman
- Her bölümün `time` (morning/noon/sunset/night) ve `weather` (clear/cloudy/rain) alanı var (`src/data.ts`).
- Varsayılan **gündüz, sıcak güneş**; yağmur sadece 5 (Yağmur Akşamı) ve 9'da. Gece sadece 6 ve 10.
- Gündüz: pencereden krem-sarı ışık, uzun yumuşak gölgeler. Gün batımı: turuncu-pembe. Gece: lacivert + sıcak fener ışığı.

## Yemek (Canvas, `src/food.ts`)
- Gürültü/grain dokusu YOK. Şekiller temiz, kenarlar hafif koyu (ink) kontur yerine **tonal kenar** (2–3 ton).
- Her malzeme: ana ton + gölge tonu + 1 parlama; yumuşak iç gradyan. Kesim yüzeyleri (chashu, yumurta, naruto, limon) net, okunaklı.
- Erişteler tel tel ama düzenli; sarı-krem, yarı mat parlama. Su: yumuşak yağ halkaları, büyük/az, pastel.
- Küvetler: mat paslanmaz, ince kenar; içindeki malzeme büyük, okunur, "food styling" gibi dizili.
- Referans hissi: ramen illüstrasyonları (poster/çıkartma tarzı), Japon kafe menü illüstrasyonları.

## Salon ve dekor (`src/components/Scenery.tsx`, `src/decor.css`, `src/components/Cash.tsx`)
- Tezgâhın arkasında gerçek bir salon derinliği: zemin perspektifi, 2–4 masa, oturan misafirler, duvar tabloları, raf, bitki, pencere.
- Kasa: vintage/minimal — krem gövde, bakır tuşlar, küçük ekran; yanında bahşiş kavanozu (cam, ince), sos şişeleri.
- Tezgâh: açık meşe, ince kenar; üstünde az eşya. Gereksiz şerit/yazı yok.
- Her şey SVG; kalın outline yok, tonal kenarlar.

## Karakterler (`src/avatar.tsx`)
- Temiz, hoş, illüstratif; omuzdan yukarı. Yüz ifadeleri memnuniyete göre.
- Yumuşak palet (üstteki palete uyumlu kıyafet renkleri). Çocukların seveceği ama "sevimli-estetik", komik değil.

## UI
- Yazı: başlıklar `Baloo 2` (az), gövde `Nunito`. Az sayıda overlay; kartlar krem kâğıt, köşe 18px, 1px ince kenar.
- Düğmeler: terracotta dolu / krem hayalet. Gölge tek, yumuşak. Emojiler mümkün olduğunca SVG ikona çevrilir.
- Sinematik dokunuşlar kalır ama hafif: vinyet %25, grain %4.

## v3 — TEK ÇİZGİ DİLİ (zorunlu, tüm görseller için)
Sahibin geri bildirimi: "Çizimler kötü, baştan yap, çok daha estetik olsun." Önceki "gerçekçi gradyan" yaklaşımı terk edildi.
Yeni ortak dil, karakterlerin (DiceBear Lorelei) çizgi diliyle BİREBİR uyumludur:
- **İnce ink kontur**: her şeklin kenarında `#2b2420` (alfa .75–.9) 1.2–1.6px (300px kase ölçeğinde ~1.3) tek çizgi. Kapalı, temiz, köşeleri yumuşatılmış.
- **Flat dolgu + 1 gölge tonu + 1 ışık tonu**. Gölge aynı hue'nun %18 koyusu, sert-yumuşak karışık kenarlı (flat ama bir kenarda hafif yumuşama). Çok duraklı gradyan YOK, radial blur YOK, noise YOK.
- **Parlama**: sadece 1 küçük parlak beyaz (#fff6e8) şekil (yay/elips), %60 alfa.
- **Palet** aynı (krem/ceviz/kil/matcha/indigo/altın). Doygunluk orta.
- **Oran**: büyük, okunur, yuvarlak-dost şekiller; Japon kafe menü illüstrasyonu (poster/çıkartma) hissi. Kawaii değil, şık.
- **Yemek**: her malzeme 2–4 şekilden oluşan ikonik bir "çıkartma": chashu = pembe disk + beyaz spiral + koyu kenar konturu; yumurta = krem yarım + turuncu sarı + parlama; nori = koyu yeşil dikdörtgen + hafif kıvrık köşe; yeşil soğan = içi boş halkalar (çizgi konturlu); naruto = beyaz disk + pembe spiral + tırtıklı kenar; mısır = 3–5 sarı boncuk; tofu = altın küp 2 yüz; karides = kıvrık turuncu + kuyruk; shiitake = kahverengi şapka + 3 kesik; bambu = sarı çubuklar; susam = minik oval çizgi; pak choi = yeşil yaprak + beyaz sap; filiz = beyaz tel + sarı uç; biber = kırmızı halka + beyaz iç; kimchi = turuncu-kırmızı yaprak; limon = yeşil dilim + açık segment çizgileri; çıtır soğan = kahverengi kıvrımlar.
- **Erişte**: 10–14 düzenli dalga tel, her tel ince konturlu krem/sarı şerit (çizgi çizim gibi). Çorba: tek ton havuz + kenarda koyu ton + 3–5 büyük yağ halkası (konturlu). Kase: kontur + flat sır + 1 parlama; desenler çizgisel.
- **Küvetler**: çizgi konturlu paslanmaz tepsi, içindeki malzeme dizili "çıkartmalar".
- **Sahne (salon, ocak, dükkân önü, kasa)**: aynı dil; SVG, ince kontur, flat alanlar, az ama büyük öğe. Işık = tek flat ışık alanı (polygon) + gölge alanı. Buhar/duman = kontürlü yumuşak bulut şekilleri (Ghibli çizgi filmi gibi).
- Her şey tutarlı; bir şey bu dile uymuyorsa yeniden çizilir.
