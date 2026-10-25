import { useEffect } from 'react';
import { INGREDIENTS, type Level } from '../data';
import { Coin, IngredientIcon, Star } from '../art';
import { sfx } from '../audio';

export default function Unlock({ level, onDone }: { level: Level; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(() => sfx('star'), 350);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="screen unlock">
      <div className="recipe-page">
        <div className="page-tag">Tarif Defteri • Sayfa {level.id}</div>
        <h2>{level.id === 1 ? 'Hana Nine’nin ilk sayfası' : 'Yeni malzemeler!'}</h2>
        <div className="unlock-grid">
          {level.unlock.map((id, i) => (
            <div key={id} className="unlock-item" style={{ animationDelay: `${0.2 + i * 0.15}s` }}>
              <div className="unlock-icon">
                <IngredientIcon id={id} size={62} />
              </div>
              <div className="unlock-name">{INGREDIENTS[id].name}</div>
              <div className="unlock-cat">
                {INGREDIENTS[id].cat === 'noodle'
                  ? 'Erişte'
                  : INGREDIENTS[id].cat === 'broth'
                    ? 'Su'
                    : 'Malzeme'}
              </div>
            </div>
          ))}
        </div>
        <div className="goals">
          {level.targets.map((t, i) => (
            <div key={i} className="goal">
              <span className="goal-stars">
                {[0, 1, 2].map((s) => (
                  <Star key={s} on={s <= i} size={16} />
                ))}
              </span>
              <span className="goal-coins">
                <Coin size={16} /> {t}
              </span>
            </div>
          ))}
        </div>
        <div className="unlock-meta">
          <span>
            ⏱ {Math.floor(level.duration / 60)}:{String(level.duration % 60).padStart(2, '0')}
          </span>
          <span>🪑 {level.seats} sandalye</span>
          <span>🍲 {level.pots} tencere</span>
          {level.online > 0 && <span>📱 Online sipariş</span>}
        </div>
        {level.tip && <div className="tip">💡 {level.tip}</div>}
        <button
          className="btn big primary"
          onClick={() => {
            sfx('door');
            onDone();
          }}>
          Kepengi Aç!
        </button>
      </div>
    </div>
  );
}
