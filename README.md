# Yuki Sushi ❄️🍣

Çocuklar (10–14) için tarayıcıda, telefonda ve tablette çalışan hikâyeli bir sushi oyunu.
Karlı Liman’daki küçük sushi kulübesini yaşlı mors **Mors Dede**’den devralıyorsun. Müşterilerin hepsi hayvan:
penguenler, foklar, su samurları, kutup ayıları, tilkiler, kar tavşanları, deniz papağanları…
Kulübenin **Nefis** uygulamasındaki puanı 2,3 yıldız; Kar Festivali’ne (10. gün) kadar **4,2**’ye çıkmazsa
martı **Kaptan Gak** kulübeyi alıp balık-patates büfesi açacak.

**Oyna:** https://yumusss.github.io/Noddles/sushi/

## Nasıl oynanır

Her şey tek ekranda: üstte pencere ve müşteri, altta senin tezgâhın. Her gün **5 dakika**, toplam **10 gün**.

- **Sipariş:** müşteri pencereye gelir ve siparişini söyler. Sipariş, pencerede ip ile asılı resimli bir karta yazılır; altındaki çizgi sabırdır.
- **Konuş:** müşterilere cevap verebilirsin (“Hemen geliyor!”, “Tekrar söyler misin?”, sohbet). Sohbet etmek memnuniyeti artırır.
- **Nigiri:** pirinç kabını basılı tut, “tam”da bırak; tabakta istediğin yere dokun. Balığa dokun, sonra pirinç topuna dokun.
- **Araçlar:** Hasır (maki: pirinç yay, iç malzeme seç, hasırı kaydırarak sar, yeşilde kes), Sashimi (balık seç, doğru anda kes: ince/normal/kalın), Pürmüz (aburi somon: basılı tut, kadran yeşilde bırak).
- **Dürüst müşteriler:** beğenmezlerse açıkça söylerler (“Açıkçası beğenmedim. Pirinç çok fazla…”). Cevabını seçersin: özür dile, ücretsiz ikram et ya da tartış. Hepsi yorumu değiştirir.
- **Para üstü:** müşteri sadece parayı verir. Para üstü kasanın yanındaki küçük kutuda yazar; çekmeceden sen seçersin.
- **Nefis uygulaması:** her müşteri yorum yazar. Tablette puan özeti, yıldız dağılımı, en çok söylenen etiketler, gün gün puan grafiği ve tüm yorumlar var. Yorumlara cevap verebilirsin: nazik cevap bazen puanı düzeltir, kaba cevap düşürür.
- **Gün grafiği:** haritada ve gün sonunda her günün kârı ve Nefis puanı grafikte görünür.
- **Talimatlar:** sadece 1. günde (Pıtırcık adım adım gösterir). Sonra yok.

## Günler

| Gün | Ad                | Yeni                                                   |
| --- | ----------------- | ------------------------------------------------------ |
| 1   | Karlı Liman       | Somon nigiri, wasabi, soya                             |
| 2   | Buzlu iskele      | Ton balığı, zencefil, sabır                            |
| 3   | Dedemin hasırı    | Hoso maki                                              |
| 4   | Ayının iştahı     | Sashimi, avokado, Bulut                                |
| 5   | Yorumlara cevap   | Tamago, nori kuşağı, kayrak tabak                      |
| 6   | Kar fırtınası     | Ura maki, yengeç, tobiko, kılık değiştirmiş Kaptan Gak |
| 7   | Alevli somon      | Aburi (pürmüz), acı mayo                               |
| 8   | Tablet çalıyor    | Online siparişler, krem peynir                         |
| 9   | Eleştirmenin gözü | Futo maki, karides, Baykuş Hanım                       |
| 10  | Kar Festivali     | Kuzey ışıkları, final: puan 4,2 mi?                    |

## Geliştirme

```bash
npm ci
npm run dev        # http://localhost:5173/Noddles/sushi/
npm run lint && npm run format:check && npm run build
```

- React + TypeScript + Vite. Oyun dünyası tek tam ekran `<canvas>` üzerinde; statik her şey offscreen sprite olarak önbellekte. Yazılar ve düğmeler React katmanında.
- Bütün çizimler kodla: `src/art/animals.ts` (hayvanlar), `outside.ts` (liman manzarası), `hut.ts` (kulübe), `work.ts` (tezgâh), `mini.ts` (hasır/bıçak), `food.ts` (sushi).
- Oyun mantığı `src/game/`: `session.ts` (gün), `orders.ts` (sipariş ve puan), `reviews.ts` (müşteri sözleri ve Nefis yorumları), `data.ts` (10 gün, hikâye), `i18n.ts` (TR/EN).
- Test: `window.__session` açık. `tests/sim.mjs` Playwright ile TR/EN × yatay/dikey/iPad tam gün oynar:

```bash
npm run build && npx vite preview --port 4173 &
CHROME=/path/to/chromium npm run test:sim
```

- `sushi` dalına her push’ta GitHub Actions lint + prettier + build yapar ve `gh-pages`’in `sushi/` klasörüne yayınlar.
