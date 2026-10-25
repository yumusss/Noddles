import { CatArt } from '../art';
import { BowlSide } from './FoodCanvas';
import { Lanterns } from './Scenery';

export default function Title({ hasSave, onPlay }: { hasSave: boolean; onPlay: () => void }) {
  return (
    <div className="screen title-screen">
      <div className="sky">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="twinkle"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 23) % 45}%`,
              animationDelay: `${(i % 7) * 0.4}s`,
            }}
          />
        ))}
      </div>
      <div className="skyline" />
      <Lanterns count={5} />
      <div className="title-wrap">
        <div className="logo">
          {'Noddles'.split('').map((ch, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.09}s` }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="tagline">Fener Sokağı’nın son noodle dükkânı</div>
      </div>
      <div className="title-bowl">
        <div className="bowl-glow" />
        <BowlSide
          bowl={{
            noodle: 'ramen',
            thick: 'orta',
            liquid: 'tonkotsu',
            fill: 0.9,
            cook: 'perfect',
            pieces: [
              { id: 'chashu', x: 112, y: 112, r: 20, s: 0.95, k: 1 },
              { id: 'chashu', x: 140, y: 98, r: 80, s: 0.95, k: 2 },
              { id: 'yumurta', x: 192, y: 138, r: 10, s: 0.95, k: 3 },
              { id: 'yumurta', x: 178, y: 178, r: 150, s: 0.95, k: 4 },
              { id: 'nori', x: 210, y: 92, r: 30, s: 1, k: 5 },
              { id: 'naruto', x: 112, y: 182, r: 0, s: 0.95, k: 6 },
              { id: 'yesil', x: 150, y: 150, r: 0, s: 0.9, k: 7 },
              { id: 'yesil', x: 128, y: 146, r: 90, s: 0.8, k: 8 },
              { id: 'bambu', x: 86, y: 146, r: 70, s: 0.9, k: 9 },
            ],
          }}
          width={290}
        />
        <div className="title-cat">
          <CatArt size={86} />
        </div>
      </div>
      <button className="btn big primary pulse" onClick={onPlay}>
        {hasSave ? 'Devam Et' : 'Dükkânı Aç'}
      </button>
      <div className="title-foot">10 bölüm • 32 malzeme • bir mahalleyi kurtar</div>
    </div>
  );
}
