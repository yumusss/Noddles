import { BowlArt, CatArt } from '../art';
import { Rain, Lanterns } from './Scenery';

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
      <Rain count={40} />
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
        <BowlArt
          bowl={{
            noodle: 'ramen',
            broth: 'tonkotsu',
            toppings: ['chashu', 'yumurta', 'nori', 'naruto', 'yesil'],
            quality: 'perfect',
          }}
          width={300}
        />
        <div className="title-cat">
          <CatArt size={86} />
        </div>
      </div>
      <button className="btn big primary pulse" onClick={onPlay}>
        {hasSave ? 'Devam Et' : 'Dükkânı Aç'}
      </button>
      <div className="title-foot">10 bölüm • 26 malzeme • bir mahalleyi kurtar</div>
    </div>
  );
}
