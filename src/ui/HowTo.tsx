import { useState } from 'react';
import { getLang } from '../game/i18n';

/** Day-1-only "how to play" walkthrough. Pages are bilingual inline. */
type Page = { icon: string; tr: [string, string[]]; en: [string, string[]] };

const PAGES: Page[] = [
  {
    icon: '🍜',
    tr: [
      'Dükkânına hoş geldin!',
      [
        'Müşteriler tek tek gelir, ne istediklerini söyler.',
        'Görevin: siparişi aynen hazırlamak, pişirmek ve servis etmek.',
        'Gün bir saatle ilerler — saat dolunca dükkân kapanır.',
      ],
    ],
    en: [
      'Welcome to your shop!',
      [
        'Customers come in one at a time and tell you what they want.',
        'Your job: make the order exactly, cook it and serve it.',
        'The day runs on a clock — when it fills up, the shop closes.',
      ],
    ],
  },
  {
    icon: '🧾',
    tr: [
      'Siparişi dinle',
      [
        'Müşteri konuşurken baloncuktaki cümleyi oku.',
        'Sipariş bir fiş olarak üstteki askıya asılır — her şey orada yazar.',
        'Fişin altındaki çizgi müşterinin sabrı: yeşilden kırmızıya iner. Acele et!',
      ],
    ],
    en: [
      'Listen to the order',
      [
        'Read the speech bubble while the customer talks.',
        'The order is pinned as a ticket on the rail at the top — everything is written there.',
        'The bar under the ticket is the customer’s patience: green turns red. Hurry!',
      ],
    ],
  },
  {
    icon: '👉',
    tr: [
      'Üç bölüm: Salon · Tezgâh · Ocak',
      [
        'Ekranı sağa-sola kaydırarak bölümler arasında geç.',
        'Ya da üstteki 🍽️ 🥣 🔥 düğmelerine dokun.',
        'Salon: müşteriler ve kasa. Tezgâh: kaseyi hazırla. Ocak: pişir.',
      ],
    ],
    en: [
      'Three areas: Salon · Counter · Stove',
      [
        'Swipe left and right to move between areas.',
        'Or tap the 🍽️ 🥣 🔥 buttons at the top.',
        'Salon: customers and the register. Counter: build the bowl. Stove: cook it.',
      ],
    ],
  },
  {
    icon: '🥢',
    tr: [
      'Erişte',
      [
        'Tezgâhta fişteki erişte tepsisine dokun — kaseye girer.',
        'Fişte kalınlık yazıyorsa (ince / orta / kalın) yandaki düğmelerden seç.',
      ],
    ],
    en: [
      'Noodles',
      [
        'At the counter, tap the noodle tray from the ticket — it goes into the bowl.',
        'If the ticket says a thickness (thin / medium / thick), pick it with the buttons next to it.',
      ],
    ],
  },
  {
    icon: '🫖',
    tr: [
      'Çorba',
      [
        'Doğru çorba tenceresine BASILI TUT, kase dolsun.',
        'Kasedeki çizgiye kadar doldur — az olursa müşteri üzülür, taşırma!',
      ],
    ],
    en: [
      'Broth',
      [
        'Press and HOLD the right broth pot to pour.',
        'Fill up to the line in the bowl — too little makes them sad, don’t overflow!',
      ],
    ],
  },
  {
    icon: '🥚',
    tr: [
      'Malzemeler — sen yerleştir',
      [
        'Önce malzeme kabına dokun (seçilir), sonra kasede istediğin yere dokun.',
        'Her dokunuş bir parça koyar. "3 dilim" diyorsa tam 3 tane koy.',
        '"Bol" diyorsa en az 5 parça. İstemediği şeyi koyma!',
        'Yanlış olduysa çöp kutusu kaseyi boşaltır.',
      ],
    ],
    en: [
      'Toppings — you place them',
      [
        'First tap a topping tub (it gets picked), then tap where you want it in the bowl.',
        'Every tap adds one piece. If it says "3 slices", add exactly 3.',
        '"Lots of" means at least 5 pieces. Don’t add things they didn’t ask for!',
        'Made a mistake? The trash bin empties the bowl.',
      ],
    ],
  },
  {
    icon: '🔥',
    tr: [
      'Pişirme',
      [
        'Hazır kaseye dokun, sonra Ocak’a git ve kaseyi ocağa koy.',
        'Saat ilerler: çiğ → diri → tam kıvam → yumuşak → lapa.',
        'Fişteki pişirme seviyesine gelince kaseye dokunup al. Geç kalırsan lapa olur!',
      ],
    ],
    en: [
      'Cooking',
      [
        'Tap the finished bowl, go to the Stove and put it on the fire.',
        'The dial moves: raw → firm → perfect → soft → mushy.',
        'When it reaches the level on the ticket, tap the bowl to take it. Too late and it turns to mush!',
      ],
    ],
  },
  {
    icon: '💴',
    tr: [
      'Servis ve kasa',
      [
        'Kaseyi Salon’da müşterinin önüne bırak.',
        'Müşteri parayı verir: kasadan doğru para üstünü seç ve "Para üstünü ver"e dokun.',
        'Mutlu müşteri bahşiş kavanozuna bahşiş atar. Bahşişler dekor için birikir.',
        'Bir şey yanlışsa müşteri şikâyet eder — "Özür dile"ye dokun (o zaman bahşiş yok).',
      ],
    ],
    en: [
      'Serving and the register',
      [
        'Drop the bowl in front of the customer in the Salon.',
        'They pay: pick the correct change from the register and tap "Give the change".',
        'Happy customers drop a tip in the tip jar. Tips add up for decorations.',
        'If something is wrong they complain — tap "Apologize" (and no tip then).',
      ],
    ],
  },
  {
    icon: '📱',
    tr: [
      'Tablet ve yıldızlar',
      [
        'Tablette yorumlar, açık siparişler ve malzeme listesi var.',
        'İleride (10. gün) online siparişler de tabletten gelecek.',
        'Hızlı ve doğru servis = çok yıldız. Hadi, ilk müşterin geliyor!',
      ],
    ],
    en: [
      'Tablet and stars',
      [
        'The tablet has reviews, open orders and a list of ingredients.',
        'Later on (day 10) online orders will arrive on the tablet too.',
        'Fast and correct service = lots of stars. Go — your first customer is coming!',
      ],
    ],
  },
];

export default function HowTo({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const en = getLang() === 'en';
  const p = PAGES[i];
  const [title, lines] = en ? p.en : p.tr;
  const last = i === PAGES.length - 1;
  return (
    <div className="modal-veil howto-veil">
      <div className="modal howto">
        <div className="howto-top">
          <small>
            {en ? 'How to play' : 'Nasıl oynanır?'} · {i + 1}/{PAGES.length}
          </small>
          <button className="btn ghost small" onClick={onClose}>
            {en ? 'Skip' : 'Geç'}
          </button>
        </div>
        <div className="howto-icon" key={i}>
          {p.icon}
        </div>
        <h2>{title}</h2>
        <ul>
          {lines.map((l, k) => (
            <li key={k}>{l}</li>
          ))}
        </ul>
        <div className="howto-dots">
          {PAGES.map((_, k) => (
            <i key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} />
          ))}
        </div>
        <div className="modal-row">
          {i > 0 && (
            <button className="btn" onClick={() => setI(i - 1)}>
              ◀ {en ? 'Back' : 'Geri'}
            </button>
          )}
          <button className="btn big primary" onClick={() => (last ? onClose() : setI(i + 1))}>
            {last ? (en ? 'Let’s cook!' : 'Hadi başlayalım!') : en ? 'Next ▶' : 'İleri ▶'}
          </button>
        </div>
      </div>
    </div>
  );
}
