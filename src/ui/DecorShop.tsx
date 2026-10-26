import { useMemo, useState } from 'react';
import type { Save } from '../App';
import { DECOR, SLOTS, type DecorState, type Slot, tipBonus } from '../game/decor';
import { fmt } from '../game/money';
import SceneCanvas from './SceneCanvas';
import { salonScene } from './scenes';
import { sfx } from '../game/audio';
import { L, T } from '../game/i18n';

export default function DecorShop({
  save,
  onChange,
  onBack,
}: {
  save: Save;
  onChange: (cash: number, decor: DecorState, owned: string[]) => void;
  onBack: () => void;
}) {
  const [slot, setSlot] = useState<Slot>('duvar');
  const scene = useMemo(() => salonScene(save.decor, 'ogle', false), [save.decor]);
  const items = DECOR.filter((d) => d.slot === slot);
  return (
    <div className="screen decor">
      <div className="decor-preview">
        <SceneCanvas draw={scene} animate={false} />
        <header className="bar overlay">
          <button className="btn ghost small" onClick={onBack}>
            {T('map.back')}
          </button>
          <div className="bar-mid">
            <span className="chip">{fmt(save.cash)}</span>
            <span className="chip gold">{T('decor.tip', { n: tipBonus(save.decor) })}</span>
          </div>
        </header>
      </div>
      <div className="decor-panel">
        <div className="slot-tabs">
          {SLOTS.map((s) => (
            <button
              key={s.id}
              className={`tab ${slot === s.id ? 'on' : ''}`}
              onClick={() => setSlot(s.id)}>
              {L(s.name)}
            </button>
          ))}
        </div>
        <div className="items">
          {items.map((it) => {
            const owned = save.owned.includes(it.id);
            const on = save.decor[slot] === it.id;
            const can = save.cash >= it.price;
            return (
              <button
                key={it.id}
                className={`item ${on ? 'on' : ''} ${!owned && !can ? 'cant' : ''}`}
                onClick={() => {
                  if (on) return;
                  if (owned) {
                    sfx('pop');
                    onChange(save.cash, { ...save.decor, [slot]: it.id }, save.owned);
                  } else if (can) {
                    sfx('coins');
                    onChange(save.cash - it.price, { ...save.decor, [slot]: it.id }, [
                      ...save.owned,
                      it.id,
                    ]);
                  } else sfx('fail');
                }}>
                <strong>{L(it.name)}</strong>
                <small>{owned ? (on ? T('decor.using') : T('decor.owned')) : fmt(it.price)}</small>
                {it.tip > 0 && <em>{T('decor.tipItem', { n: it.tip })}</em>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
