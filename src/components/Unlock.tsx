import { useEffect } from 'react';
import { INGREDIENTS, type Level } from '../data';
import { IngredientIcon, Star } from '../art';
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
          {[55, 75, 90].map((t, i) => (
            <div key={i} className="goal">
              <span className="goal-stars">
                {[0, 1, 2].map((st) => (
                  <Star key={st} on={st <= i} size={16} />
                ))}
              </span>
              <span className="goal-coins">%{t} memnun</span>
            </div>
          ))}
        </div>
        <div className="unlock-meta">
          <span>👥 {level.customers} müşteri</span>
          {level.phone > 0 && <span>📱 {level.phone} telefon siparişi</span>}
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
