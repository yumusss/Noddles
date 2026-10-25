import { LEVELS, INGREDIENTS } from '../data';
import { CatArt, Star } from '../art';
import { Tray } from './FoodCanvas';
import { sfx } from '../audio';
import { fmt } from '../money';
import type { Save } from '../App';
import { Rain } from './Scenery';

export default function LevelMap({
  save,
  onPick,
  onBack,
  onToggle,
  onEnding,
  onShop,
}: {
  save: Save;
  onPick: (id: number) => void;
  onBack: () => void;
  onToggle: (k: 'sfx' | 'music') => void;
  onEnding: () => void;
  onShop: () => void;
}) {
  const total = save.stars.reduce((a, b) => a + b, 0);
  const current = Math.min(10, save.reached);
  return (
    <div className="screen map">
      <Rain count={16} />
      <div className="map-head">
        <button className="hud-btn" onClick={onBack} aria-label="Geri">
          ‹
        </button>
        <div className="map-title">Fener Sokağı</div>
        <div className="map-stars cash">💵 {fmt(save.cash ?? 4000)}</div>
        <div className="map-stars">
          <Star on size={18} /> {total}/30
        </div>
      </div>
      <div className="map-toggles">
        <button className={`chip ${save.sfx ? 'on' : ''}`} onClick={() => onToggle('sfx')}>
          🔊 Efekt
        </button>
        <button className={`chip ${save.music ? 'on' : ''}`} onClick={() => onToggle('music')}>
          🎵 Müzik
        </button>
        <button
          className="chip on chip-shop"
          onClick={() => {
            sfx('tap');
            onShop();
          }}>
          🛋 Dekorasyon
        </button>
        {save.reached > 10 && (
          <button className="chip on" onClick={onEnding}>
            🏆 Final
          </button>
        )}
      </div>
      <div className="map-path">
        {LEVELS.map((l, i) => {
          const locked = l.id > save.reached;
          const isCur = l.id === current && save.reached <= 10;
          const side = i % 2 === 0 ? 'l' : 'r';
          return (
            <div
              key={l.id}
              className={`map-node ${side} ${locked ? 'locked' : ''} ${isCur ? 'current' : ''}`}>
              <button
                className="node-btn"
                disabled={locked}
                onClick={() => {
                  sfx('tap');
                  onPick(l.id);
                }}>
                <span className="node-num">{locked ? '🔒' : l.id}</span>
              </button>
              <div className="node-info">
                <b>{l.title}</b>
                <small>{l.subtitle}</small>
                <div className="node-stars">
                  {[1, 2, 3].map((s) => (
                    <Star key={s} on={save.stars[i] >= s} size={14} />
                  ))}
                </div>
                <div className="node-unlocks">
                  {l.unlock.map((u) => (
                    <span key={u} title={INGREDIENTS[u].name}>
                      <Tray id={u} width={34} />
                    </span>
                  ))}
                </div>
              </div>
              {isCur && (
                <div className="node-cat">
                  <CatArt size={44} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
