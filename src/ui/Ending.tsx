import { useMemo } from 'react';
import type { Save } from '../App';
import SceneCanvas from './SceneCanvas';
import { salonScene } from './scenes';
import { fmt } from '../game/money';

export default function Ending({ save, onMap }: { save: Save; onMap: () => void }) {
  const scene = useMemo(() => salonScene(save.decor, 'aksam', false), [save.decor]);
  const total = save.stars.reduce((a, b) => a + b, 0);
  return (
    <div className="screen ending">
      <SceneCanvas draw={scene} className="bg" />
      <div className="story-veil" />
      <div className="ending-card">
        <span className="chip gold">Meydan kurtarıldı!</span>
        <h1>Noddles yaşıyor</h1>
        <p>
          Fener Sokağı’nın son noodle dükkânı, mahallenin kalbi oldu. Mochi tezgâhın üstünde
          mırlıyor, Hana Nine pencerede gülümsüyor.
        </p>
        <p className="ending-stats">
          ★ {total}/30 · Kasada {fmt(save.cash)}
        </p>
        <p className="muted">
          Üç yıldız toplamak için günleri tekrar oynayabilir, kazandığın parayla dükkânı dekore
          edebilirsin.
        </p>
        <button className="btn big primary" onClick={onMap}>
          Haritaya dön
        </button>
      </div>
    </div>
  );
}
