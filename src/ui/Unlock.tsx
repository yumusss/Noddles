import { INGREDIENTS, BOWLS, dayMinutes, type Level } from '../game/data';
import { drawIngredientIcon, drawBowlIcon } from '../art/food';
import SceneCanvas from './SceneCanvas';
import { sfx } from '../game/audio';
import { L, T } from '../game/i18n';

const CAT_NAME = {
  noodle: 'unlock.noodle',
  broth: 'unlock.broth',
  sauce: 'unlock.sauce',
  topping: 'unlock.topping',
} as const;

/** "Recipe book page": what opens this day, the star targets and a tip. */
export default function Unlock({ level, onDone }: { level: Level; onDone: () => void }) {
  const bowls = BOWLS.filter((b) => b.unlock === level.id);
  return (
    <div className="screen unlock">
      <div className="page">
        <div className="page-head">
          <span className="chip">{T('unlock.page', { n: level.id })}</span>
          <h2>{L(level.subtitle)}</h2>
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
              <strong>{L(INGREDIENTS[id].name)}</strong>
              <small>{T(CAT_NAME[INGREDIENTS[id].cat as keyof typeof CAT_NAME])}</small>
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
              <strong>{L(b.name)}</strong>
              <small>{T('unlock.newBowl')}</small>
            </div>
          ))}
        </div>
        <div className="targets">
          <span>
            <i>★</i>
            <i className="off">★</i>
            <i className="off">★</i> 55%
          </span>
          <span>
            <i>★</i>
            <i>★</i>
            <i className="off">★</i> 75%
          </span>
          <span>
            <i>★</i>
            <i>★</i>
            <i>★</i> 90%
          </span>
          <em>
            {T('unlock.minutes', { n: dayMinutes(level) })}
            {level.phone ? ` · ${T('unlock.phone')}` : ''}
          </em>
        </div>
        {level.tip && <p className="tip">💡 {L(level.tip)}</p>}
        <button
          className="btn big primary"
          onClick={() => {
            sfx('door');
            onDone();
          }}>
          {T('unlock.open')}
        </button>
      </div>
    </div>
  );
}
