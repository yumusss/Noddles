import { LEVELS } from '../game/data';
import { useMemo } from 'react';
import type { Save } from '../App';
import SceneCanvas from './SceneCanvas';
import { salonScene } from './scenes';
import { fmt } from '../game/money';
import { T } from '../game/i18n';

export default function Ending({ save, onMap }: { save: Save; onMap: () => void }) {
  const scene = useMemo(() => salonScene(save.decor, 'aksam', false), [save.decor]);
  const total = save.stars.reduce((a, b) => a + b, 0);
  return (
    <div className="screen ending">
      <SceneCanvas draw={scene} className="bg" />
      <div className="story-veil" />
      <div className="ending-card">
        <span className="chip gold">{T('end.chip')}</span>
        <h1>{T('end.title')}</h1>
        <p>{T('end.text')}</p>
        <p className="ending-stats">
          ★ {total}/{LEVELS.length * 3} · {T('end.cash', { n: fmt(save.cash) })}
        </p>
        <p className="muted">{T('end.more')}</p>
        <button className="btn big primary" onClick={onMap}>
          {T('play.toMap')}
        </button>
      </div>
    </div>
  );
}
