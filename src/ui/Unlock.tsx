import { INGREDIENTS, BOWLS, type Level } from '../game/data';
import { drawIngredientIcon, drawBowlIcon } from '../art/food';
import SceneCanvas from './SceneCanvas';
import { sfx } from '../game/audio';

const CAT_NAME: Record<string, string> = { noodle: 'Erişte', broth: 'Çorba', sauce: 'Sos', topping: 'Malzeme' };

/** "Recipe book page": what opens this day, the star targets and a tip. */
export default function Unlock({ level, onDone }: { level: Level; onDone: () => void }) {
  const bowls = BOWLS.filter((b) => b.unlock === level.id);
  return (
    <div className="screen unlock">
      <div className="page">
        <div className="page-head">
          <span className="chip">Tarif defteri · Sayfa {level.id}</span>
          <h2>{level.subtitle}</h2>
        </div>
        <div className="unlock-row">
          {level.unlock.map((id) => (
            <div className="unlock-card" key={id}>
              <div className="icon">
                <SceneCanvas
                  animate={false}
                  draw={(c, W, H) => {
                    c.clearRect(0, 0, W, H);
                    c.save();
                    c.translate(W / 2, H / 2);
                    drawIngredientIcon(c, id, Math.min(W, H) * 0.9);
                    c.restore();
                  }}
                />
              </div>
              <strong>{INGREDIENTS[id].name}</strong>
              <small>{CAT_NAME[INGREDIENTS[id].cat]}</small>
            </div>
          ))}
          {bowls.map((b) => (
            <div className="unlock-card" key={b.id}>
              <div className="icon">
                <SceneCanvas
                  animate={false}
                  draw={(c, W, H) => {
                    c.clearRect(0, 0, W, H);
                    c.save();
                    c.translate(W / 2, H / 2);
                    drawBowlIcon(c, b.id, Math.min(W, H) * 0.9);
                    c.restore();
                  }}
                />
              </div>
              <strong>{b.name}</strong>
              <small>Yeni kase</small>
            </div>
          ))}
        </div>
        <div className="targets">
          <span>
            <i>★</i>
            <i className="off">★</i>
            <i className="off">★</i> %55
          </span>
          <span>
            <i>★</i>
            <i>★</i>
            <i className="off">★</i> %75
          </span>
          <span>
            <i>★</i>
            <i>★</i>
            <i>★</i> %90
          </span>
          <em>
            {level.customers} müşteri{level.phone ? ` · ${level.phone} paket` : ''}
          </em>
        </div>
        {level.tip && <p className="tip">💡 {level.tip}</p>}
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
