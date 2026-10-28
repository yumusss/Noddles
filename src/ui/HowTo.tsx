// How to play — only on day 1 (and from the pause menu).

import { useEffect, useRef, useState } from 'react';
import { t, tx, type L } from '../game/i18n';
import { sfx } from '../game/audio';
import { setPx } from '../art/common';
import { drawPiece, drawIngredient } from '../art/food';
import { CHAR_LOOKS, drawAvatar } from '../art/animals';
import { useLang } from '../App';

type Pic = 'customer' | 'nigiri' | 'tap' | 'maki' | 'reply' | 'change' | 'yumm';

const PAGES: { pic: Pic; title: L; points: L[] }[] = [
  {
    pic: 'customer',
    title: { tr: 'Pencereye gelen müşteri', en: 'Customers at the window' },
    points: [
      {
        tr: 'Her seferinde pencereye tek bir müşteri gelir ve siparişini söyler.',
        en: 'One customer at a time comes to the window and says the order.',
      },
      {
        tr: 'Sipariş, pencerede asılı karta resimli olarak yazılır. Altındaki çizgi sabırdır.',
        en: 'The order hangs on a card in the window, with pictures. The bar under it is patience.',
      },
    ],
  },
  {
    pic: 'nigiri',
    title: { tr: 'Nigiri', en: 'Nigiri' },
    points: [
      {
        tr: 'Pirinç kabına dokun, sonra tabakta istediğin yere dokun.',
        en: 'Tap the rice tub, then tap the plate where you want it.',
      },
      {
        tr: 'Her dokunuş bir pirinç topu koyar. Sonra balığa, sonra pirinç topuna dokun.',
        en: 'Each tap places a rice ball. Then tap the fish, then the rice ball.',
      },
    ],
  },
  {
    pic: 'tap',
    title: { tr: 'Dokun ve koy', en: 'Tap to place' },
    points: [
      {
        tr: 'Bir kaba bir kez dokun, sonra tabakta istediğin yere dokun. Sürükleme yok.',
        en: 'Tap a tray once, then tap anywhere on the plate. No dragging.',
      },
      {
        tr: 'Sos ve susam bir parçanın üstüne konur. ✕ ile elindekini bırakırsın.',
        en: 'Sauces and sesame go on top of a piece. ✕ puts it back.',
      },
    ],
  },
  {
    pic: 'maki',
    title: { tr: 'Hasır, bıçak, pürmüz', en: 'Mat, knife, torch' },
    points: [
      {
        tr: 'Alttaki araçlar küçük oyunlar açar: hasırla maki sar, bıçakla sashimi kes.',
        en: 'The tools below open little games: roll maki with the mat, slice sashimi with the knife.',
      },
      {
        tr: 'Doğru anda dokun: çizgi yeşildeyken kes, kadran yeşildeyken bırak.',
        en: 'Timing matters: cut when the line is green, let go when the dial is green.',
      },
    ],
  },
  {
    pic: 'reply',
    title: { tr: 'Müşteriyle konuş', en: 'Talk to customers' },
    points: [
      {
        tr: 'Müşterilere cevap verebilirsin. Sohbet etmek onları mutlu eder.',
        en: 'You can answer customers. A little chat makes them happy.',
      },
      {
        tr: 'Beğenmezlerse dürüstçe söylerler. Özür dilemek ya da ikram etmek yorumu yumuşatır; tartışmak kötüleştirir.',
        en: 'If they don’t like it, they’ll say so. Apologizing or treating them softens the review; arguing makes it worse.',
      },
    ],
  },
  {
    pic: 'change',
    title: { tr: 'Ödeme ve bahşiş', en: 'Paying and tips' },
    points: [
      {
        tr: 'Müşteri yedikten sonra öder, para kendiliğinden kasaya girer.',
        en: 'After eating the customer pays; the money goes into the register by itself.',
      },
      {
        tr: 'Mutlu müşteriler bahşiş kavanozuna bahşiş bırakır.',
        en: 'Happy customers drop a tip in the jar.',
      },
    ],
  },
  {
    pic: 'yumm',
    title: { tr: 'Nefis puanı', en: 'Yumm rating' },
    points: [
      {
        tr: 'Her müşteri Nefis uygulamasına yorum yazar. Üstteki puana dokunarak tableti aç.',
        en: 'Every customer posts a review on Yumm. Tap the rating on top to open the tablet.',
      },
      {
        tr: 'Kar Festivali’ne kadar puanı 4,2’ye çıkar! Her gün 5 dakika sürer.',
        en: 'Get the rating to 4.2 by the Snow Festival! Each day lasts 5 minutes.',
      },
    ],
  },
];

function PicCanvas({ pic }: { pic: Pic }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const size = 140;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = size * dpr;
    cv.height = size * dpr;
    const c = cv.getContext('2d')!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    setPx(dpr);
    c.clearRect(0, 0, size, size);
    c.translate(size / 2, size / 2);
    switch (pic) {
      case 'customer':
        drawAvatar(c, CHAR_LOOKS.bulut, 130, 'happy', '#d8ecf2');
        break;
      case 'nigiri':
        drawPiece(c, 420, { kind: 'nigiri', rice: 'just', neta: 'salmon', tops: [] }, 2);
        break;
      case 'tap':
        drawIngredient(c, 'wasabi', 110, 2);
        break;
      case 'maki':
        drawPiece(
          c,
          380,
          {
            kind: 'maki',
            style: 'ura',
            fill: ['crab', 'avocado'],
            coat: 'tobiko',
            rice: 'just',
            roll: 'tight',
            cut: 'clean',
            idx: 0,
            tops: [],
          },
          3
        );
        break;
      case 'reply':
        drawAvatar(c, CHAR_LOOKS.hazel, 130, 'love', '#fde2d8');
        break;
      case 'change':
        drawAvatar(c, CHAR_LOOKS.tusk, 130, 'happy', '#f2e6cf');
        break;
      case 'yumm':
        drawAvatar(c, CHAR_LOOKS.pip, 130, 'happy', '#e6eefb');
        break;
    }
  }, [pic]);
  return <canvas ref={ref} style={{ width: 140, height: 140 }} />;
}

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
          <PicCanvas pic={p.pic} />
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
