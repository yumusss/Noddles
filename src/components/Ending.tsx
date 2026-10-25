import { useEffect } from 'react';
import { BowlArt, CatArt, Portrait, Star } from '../art';
import { sfx } from '../audio';
import type { Save } from '../App';
import { Lanterns } from './Scenery';

export default function Ending({ save, onMap }: { save: Save; onMap: () => void }) {
  const total = save.stars.reduce((a, b) => a + b, 0);
  useEffect(() => {
    sfx('win');
  }, []);
  return (
    <div className="screen ending">
      <div className="fireworks" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            style={{
              left: `${10 + i * 15}%`,
              top: `${8 + (i % 3) * 10}%`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
      <Lanterns count={5} />
      <div className="ending-title">Fener Sokağı kurtuldu!</div>
      <div className="ending-cast">
        <Portrait who="hana" size={92} />
        <Portrait who="sef" size={104} />
        <Portrait who="baron" mood="happy" size={92} />
      </div>
      <div className="ending-bowl">
        <BowlArt
          bowl={{
            noodle: 'ramen',
            broth: 'tonkotsu',
            toppings: ['chashu', 'yumurta', 'karides', 'naruto', 'nori', 'yesil'],
          }}
          width={250}
        />
        <div className="ending-cat">
          <CatArt size={70} sleepy />
        </div>
      </div>
      <p className="ending-text">
        Meydan çocuklara kaldı, Baron pazar günleri tezgâhta oturuyor, Lezzetova her ay yeniden
        yazıyor. Ve Noddles’ın kepengi her akşam aynı saatte kalkıyor.
      </p>
      <div className="ending-stars">
        <Star on size={22} /> {total} / 30 yıldız
      </div>
      {total < 30 && (
        <div className="ending-sub">Bütün yıldızları toplamak için bölümleri tekrar oyna!</div>
      )}
      <button className="btn big primary" onClick={onMap}>
        Haritaya dön
      </button>
    </div>
  );
}
