import { useMemo, useState } from 'react';
import SceneCanvas from './SceneCanvas';
import { salonScene } from './scenes';
import { DEFAULT_DECOR } from '../game/decor';
import { drawBowlTop } from '../art/food';
import type { BowlState } from '../game/bowl';
import Fullscreen from './Fullscreen';

const HERO: BowlState = {
  style: 'kirmizi',
  noodle: 'ramen',
  thick: 'orta',
  broth: 'shoyu',
  fill: 0.95,
  progress: 70,
  pieces: [
    { id: 'chashu', x: 112, y: 118, rot: 0.2, v: 0, s: 1 },
    { id: 'chashu', x: 150, y: 100, rot: -0.3, v: 1, s: 1 },
    { id: 'yumurta', x: 196, y: 150, rot: 0.6, v: 0, s: 1 },
    { id: 'nori', x: 104, y: 178, rot: -0.9, v: 0, s: 1 },
    { id: 'naruto', x: 172, y: 198, rot: 0.1, v: 0, s: 1 },
    { id: 'yesil', x: 150, y: 150, rot: 0, v: 0, s: 1 },
    { id: 'yesil', x: 170, y: 132, rot: 0, v: 1, s: 0.9 },
    { id: 'bambu', x: 120, y: 150, rot: 0.4, v: 0, s: 1 },
  ],
};

export default function Title({ hasSave, onPlay }: { hasSave: boolean; onPlay: () => void }) {
  const [pressed, setPressed] = useState(false);
  const scene = useMemo(
    () =>
      salonScene(
        { ...DEFAULT_DECOR, lamba: 'lamba-kagit', bitki: 'bitki-bambu', tablo: 'tablo-fuji' },
        'gunbatimi'
      ),
    []
  );
  return (
    <div className="screen title">
      <SceneCanvas draw={scene} className="bg" />
      <div className="title-veil" />
      <Fullscreen />
      <div className="title-body">
        <h1 className="logo">
          Noddles
          <span className="logo-sub">Fener Sokağı’nın son noodle dükkânı</span>
        </h1>
        <div className="hero-bowl">
          <SceneCanvas
            animate
            draw={(c, W, H, t) => {
              c.clearRect(0, 0, W, H);
              c.save();
              c.translate(W / 2, H / 2 + Math.sin(t * 1.3) * 4);
              drawBowlTop(c, HERO, Math.min(W, H) * 0.92, t, { steam: 0.8 });
              c.restore();
            }}
          />
        </div>
        <button
          className={`btn big primary ${pressed ? 'pressed' : ''}`}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onClick={onPlay}>
          {hasSave ? 'Devam Et' : 'Dükkânı Aç'}
        </button>
        <p className="credits">Karakterler: “Toon Head” — Johan Melin, CC BY 4.0 · DiceBear</p>
      </div>
    </div>
  );
}
