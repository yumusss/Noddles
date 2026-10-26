# Nami-ya · Liman Sushi Barı 🍣

Çocuklar (10–14) için tarayıcıda, telefonda ve tablette çalışan hikâyeli bir Japon sushi barı oyunu.
Kirazlı Liman’daki kırk yıllık sushi barı Nami-ya’yı, bileği incinen Ume Nine’den devralıyorsun.
Tezgâhın bekçisi ahtapot **Mürekkep**, sabah balık halinden **Kaptan Tuna**, limanın karşısında açılan
konveyör bantlı zincir **DönDön Sushi** ve kaybolan bıçak ustası **Hayato**’nun sırrı seni bekliyor.

**Oyna:** https://yumusss.github.io/Noddles/sushi/

> Bu, noodle oyununun (`main` dalı, https://yumusss.github.io/Noddles/) sushi kardeşi. Kod `sushi` dalında yaşar.

## Nasıl oynanır

Tek bir dünya: **Salon · Tezgâh · Kesme/Isıtma** yan yana durur; parmakla kaydır ya da üstteki düğmelere bas.

1. **Müşteriyi dinle.** Tezgâhta her zaman tek müşteri olur. Siparişini konuşarak söyler: tür (nigiri, hoso / futo / ura maki, temaki, sashimi), balık ve adet, pirinç ya da kalınlık, sos ve yan ürünler. Sipariş üstteki metal askıya kâğıt fiş olarak asılır; fişe dokununca katlanır. Fişin altındaki çizgi sabırdır.
2. **Nigiri:** pirinç kabını **basılı tut**, gösterge “tam”dayken bırak. Tabakta her dokunuş bir pirinç topu koyar. Balık kabına dokun, sonra pirinç topuna dokun.
3. **Malzeme koyma — sürükleme yok:** kaba bir kez dokun (seçilir, tabağın yanında süzülür), sonra tabakta istediğin yere dokun. Sos, susam, tobiko gibi şeyler bir parçanın üstüne konur. ✕ ile elindekini bırakırsın.
4. **Maki ve temaki (Kesme istasyonu):** nori koy, pirinci basılı tutarak yay, iç malzemeleri seç (ura makide dışını da), sonra **hasırı yukarı kaydırarak sar** ya da basılı tut. Çok hızlı sararsan rulo dağılır. Çizgi yeşildeyken **kes**; 6 ya da 8 dilim.
5. **Sashimi:** tahtada balığı seç; doğru anda dokunarak ince / tam / kalın kes. Erken ya da geç kesersen dilimler eğri olur.
6. **Isıtma:** fritöze karides (tempura), ızgaraya yılan balığı (unagi). Kadran: çiğ → tam → fazla → yanık. Doğru anda **Al!**
7. **Servis et.** Müşteri yer, tepki verir ve memnuniyet çıkar. Hata varsa şikâyet eder: **Özür dile** → “Peki… ama bahşiş yok.”
8. **Para üstü:** müşteri nakit verir ve para üstünü söyler. Çekmeceden doğru parayı sen seçersin. Eksik verirsen uyarır, fazla verirsen deftere zarar yazılır.
9. **10. günden itibaren** tezgâhtaki tablet çalar: online siparişler sıraya girer, tezgâh boşalınca çalar, paket kapıdaki kutuya konur, kurye götürür.
10. **Gün sonu defteri:** satış, bahşiş, malzeme, israf, fazla para üstü, kira, faturalar → net kâr ve 1–3 yıldız. Kazandığın parayla dekor dükkânından duvar, zemin, lamba, masa ve bitki al; her biri bahşişi biraz artırır.

1\. gün sayfa sayfa “Nasıl oynanır?” ve işaret eden el ile başlar; mola menüsünden yeniden açılabilir. 2. günden sonra ipucu yok.

## Durum

- **1. aşama (bu sürüm):** tüm mekanikler + 1–10. günler (1. perde “Açılış” ve 2. perdenin ilk günü). Haritada 50 gün var; 11–50 “Yakında”.
- **2. aşama:** 11–50. günler, perde 2–5 (rakibin oyunları, fırtına ve sır, Liman Festivali), aburi torç, seladon ve sakura tabaklar.
- Türkçe / İngilizce tek tıkla değişir (TR’de ₺, EN’de $; İngilizce modda müşteri isimleri de İngilizce). İlerleme cihazda saklanır.

## Geliştirme

```bash
npm ci
npm run dev        # http://localhost:5173/Noddles/sushi/
npm run lint && npm run format:check && npm run build
```

- React + TypeScript + Vite. Oyun dünyası tek tam ekran `<canvas>` üzerinde çizilir; statik her şey offscreen sprite olarak önbelleğe alınır, yazılar React katmanında.
- Bütün çizimler kodla yapılır (görsel dosya yok): `src/art/food.ts` (sushi), `people.ts` (karakterler), `salon.ts`, `prep.ts`, `board.ts`.
- Oyun mantığı `src/game/` altında: `session.ts` (gün), `orders.ts` (sipariş, konuşma, puan), `data.ts` (malzemeler, 50 günlük takvim, hikâye), `i18n.ts`.
- Dokunmatik öncelikli (pointer events). PWA: çevrimdışı çalışır, ana ekrana eklenir. Eski iOS Safari için polyfill ve ekranda hata katmanı var.
- Otomatik test: oturum `window.__session` olarak açılır. `tests/sim.mjs` Playwright ile TR/EN × yatay/dikey/iPad tam gün oynar ve ekran görüntüsü alır:

```bash
npm run build && npx vite preview --port 4173 &
CHROME=/path/to/chromium npm run test:sim
```

- GitHub Actions: `sushi` dalına her push’ta lint + prettier + build, sonra `gh-pages` dalının `sushi/` klasörüne yayın.
