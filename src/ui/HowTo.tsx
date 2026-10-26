// Page-by-page "How to play" (opens on day 1 and from the pause menu).

import { useState } from 'react';
import { t, tx, type L } from '../game/i18n';
import { sfx } from '../game/audio';
import MiniArt, { type MiniKind } from './MiniArt';
import { useLang } from '../App';

interface Page {
  icon: MiniKind;
  title: L;
  points: L[];
}

const PAGES: Page[] = [
  {
    icon: { k: 'face' },
    title: { tr: 'Müşteriyi dinle', en: 'Listen to the customer' },
    points: [
      {
        tr: 'Müşteri tezgâha oturur ve siparişini söyler.',
        en: 'A customer sits at the counter and says the order.',
      },
      {
        tr: 'Sipariş üstteki askıya kâğıt fiş olarak asılır. Fişe dokunursan katlanır.',
        en: 'The order hangs on the rail at the top as a paper ticket. Tap it to fold it.',
      },
      {
        tr: 'Fişin altındaki çizgi sabırdır: yeşil → sarı → kırmızı.',
        en: 'The bar under the ticket is patience: green → yellow → red.',
      },
    ],
  },
  {
    icon: { k: 'plate' },
    title: { tr: 'İstasyonlar', en: 'Stations' },
    points: [
      {
        tr: 'Salon · Tezgâh · Kesme/Isıtma yan yana durur.',
        en: 'Dining · Counter · Cut/Heat sit side by side.',
      },
      {
        tr: 'Parmağınla sağa-sola kaydır ya da üstteki düğmelere bas.',
        en: 'Swipe left and right, or tap the buttons on top.',
      },
    ],
  },
  {
    icon: { k: 'nigiri' },
    title: { tr: 'Pirinç ve nigiri', en: 'Rice and nigiri' },
    points: [
      {
        tr: 'Pirinç kabını basılı tut. Gösterge “tam”dayken bırak.',
        en: 'Hold the rice tub. Let go when the gauge says “just right”.',
      },
      {
        tr: 'Tabakta her dokunuş bir pirinç topu koyar.',
        en: 'Each tap on the plate places one rice ball.',
      },
      {
        tr: 'Balık kabına dokun, sonra pirinç topuna dokun: nigiri hazır!',
        en: 'Tap a fish tub, then tap a rice ball: nigiri done!',
      },
    ],
  },
  {
    icon: { k: 'maki' },
    title: { tr: 'Sarma ve kesme', en: 'Rolling and cutting' },
    points: [
      {
        tr: 'Kesme tahtasında nori koy, pirinci basılı tutarak yay.',
        en: 'On the board, lay nori and hold to spread the rice.',
      },
      {
        tr: 'İç malzemeleri seç, hasırı yukarı kaydırarak sar. Çok hızlı sararsan dağılır.',
        en: 'Pick fillings, slide the mat up to roll. Too fast and it falls apart.',
      },
      {
        tr: 'Çizgi yeşildeyken kes. Sashimide anı seçerek kalınlığı belirlersin.',
        en: 'Cut while the line is green. For sashimi the moment sets the thickness.',
      },
    ],
  },
  {
    icon: { k: 'ing', ing: 'wasabi' },
    title: { tr: 'Dokunarak koy', en: 'Place by tapping' },
    points: [
      {
        tr: 'Kaba bir kez dokun: seçilir ve tabağın yanında süzülür.',
        en: 'Tap a tub once: it’s picked and floats by the plate.',
      },
      {
        tr: 'Tabakta istediğin yere dokun: tam oraya bir parça konur.',
        en: 'Tap anywhere on the plate: a piece goes exactly there.',
      },
      {
        tr: 'Sos ve susam gibi şeyler bir parçanın üstüne konur. ✕ ile bırakırsın.',
        en: 'Sauces and sesame go on top of a piece. ✕ puts it back.',
      },
    ],
  },
  {
    icon: { k: 'tempura' },
    title: { tr: 'Isıtma', en: 'Heat' },
    points: [
      {
        tr: 'Fritöze karides, ızgaraya yılan balığı koy.',
        en: 'Shrimp go in the fryer, eel on the grill.',
      },
      {
        tr: 'Kadranı izle: çiğ → tam → fazla → yanık. Doğru anda “Al!”',
        en: 'Watch the dial: raw → done → over → burnt. Tap “Take!” at the right moment.',
      },
      {
        tr: 'Hazır olanlar tezgâhta ve tahtada kullanılır.',
        en: 'Cooked pieces are used on the counter and the board.',
      },
    ],
  },
  {
    icon: { k: 'coin' },
    title: { tr: 'Servis, para üstü, bahşiş', en: 'Serve, change, tips' },
    points: [
      {
        tr: '“Servis et” ile tabağı müşterinin önüne bırak.',
        en: 'Tap “Serve” to put the plate in front of the customer.',
      },
      {
        tr: 'Müşteri para üstünü söyler; çekmeceden doğru parayı seç.',
        en: 'The customer says the change; pick the right money from the drawer.',
      },
      {
        tr: 'Mutlu müşteri bahşiş bırakır. Hata olursa “Özür dile”.',
        en: 'Happy customers tip. If something’s wrong, “Apologize”.',
      },
    ],
  },
  {
    icon: { k: 'tablet' },
    title: { tr: 'Tablet ve yıldızlar', en: 'Tablet and stars' },
    points: [
      {
        tr: 'Tablette yorumlar, siparişler ve malzemeler var.',
        en: 'The tablet has reviews, orders and ingredients.',
      },
      {
        tr: '10. günden itibaren online siparişler tabletten gelir.',
        en: 'From day 10 online orders come in on the tablet.',
      },
      {
        tr: 'Gün sonunda defter: 1–3 yıldız ve dekor için para.',
        en: 'At day’s end, the ledger: 1–3 stars and money for decor.',
      },
    ],
  },
];

export default function HowTo({ onDone }: { onDone: () => void }) {
  useLang();
  const [i, setI] = useState(0);
  const p = PAGES[i];
  const last = i === PAGES.length - 1;
  return (
    <div className="screen howto">
      <div className="howto-card">
        <div className="howto-top">
          <h2>{t('howto')}</h2>
          <button className="skip inline" onClick={onDone}>
            {t('skip')}
          </button>
        </div>
        <div className="howto-icon">
          <MiniArt kind={p.icon} size={120} />
        </div>
        <h3>{tx(p.title)}</h3>
        <ul>
          {p.points.map((x, k) => (
            <li key={k}>{tx(x)}</li>
          ))}
        </ul>
        <div className="dots">
          {PAGES.map((_, k) => (
            <i key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} />
          ))}
        </div>
        <div className="howto-nav">
          <button
            className="btn ghost"
            disabled={i === 0}
            onClick={() => (sfx('tap'), setI(i - 1))}>
            {t('back')}
          </button>
          <button className="btn coral" onClick={() => (sfx('tap'), last ? onDone() : setI(i + 1))}>
            {last ? t('done') : t('next')}
          </button>
        </div>
      </div>
    </div>
  );
}
