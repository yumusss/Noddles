import { useEffect } from 'react';
import { CatArt, Star } from '../art';
import { BowlSide } from './FoodCanvas';
import { Portrait } from '../avatar';
import { sfx } from '../audio';
import type { Save } from '../App';
import { Lanterns } from './Scenery';

const CAST: { who: string; name: string; mood?: 'happy' | 'neutral' | 'love' }[] = [
  { who: 'hana', name: 'Hana Nine', mood: 'love' },
  { who: 'ruzgar', name: 'Rüzgar' },
  { who: 'sef', name: 'Sen' },
  { who: 'lezzetova', name: 'Madam Lezzetova' },
  { who: 'baron', name: 'Baron Kraker' },
];

export default function Ending({ save, onMap }: { save: Save; onMap: () => void }) {
  const total = save.stars.reduce((a, b) => a + b, 0);
  useEffect(() => {
    sfx('win');
  }, []);
  return (
    <div className="screen ending ending-v2">
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
        {CAST.map((c, k) => (
          <figure
            key={c.who}
            className={`cast-card ${c.who === 'sef' ? 'lead' : ''}`}
            style={{ animationDelay: `${0.15 * k}s` }}>
            <Portrait who={c.who} mood={c.mood ?? 'happy'} size={c.who === 'sef' ? 96 : 72} />
            <figcaption>{c.name}</figcaption>
          </figure>
        ))}
      </div>
      <div className="ending-bowl paper-card">
        <BowlSide
          bowl={{
            noodle: 'ramen',
            thick: 'orta',
            liquid: 'tonkotsu',
            fill: 0.9,
            pieces: [
              { id: 'chashu', x: 112, y: 112, r: 20, s: 0.95, k: 1 },
              { id: 'yumurta', x: 192, y: 138, r: 10, s: 0.95, k: 3 },
              { id: 'karides', x: 150, y: 190, r: 160, s: 0.9, k: 4 },
              { id: 'naruto', x: 112, y: 176, r: 0, s: 0.95, k: 6 },
              { id: 'nori', x: 205, y: 95, r: 30, s: 1, k: 5 },
              { id: 'yesil', x: 150, y: 140, r: 0, s: 0.9, k: 7 },
            ],
          }}
          width={230}
        />
        <div className="ending-cat">
          <CatArt size={74} sleepy />
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
      </div>
      <button className="btn big primary" onClick={onMap}>
        Haritaya dön
      </button>
    </div>
  );
}
