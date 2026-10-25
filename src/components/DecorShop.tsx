import { useState } from 'react';
import {
  DECOR,
  withDefaults,
  DEFAULT_OWNED,
  SLOTS,
  tipBonus,
  type DecorState,
  type Slot,
} from '../decor';
import { fmt } from '../money';
import { sfx } from '../audio';
import type { Save } from '../App';
import Restaurant from './Restaurant';

export default function DecorShop({
  save,
  onChange,
  onBack,
}: {
  save: Save;
  onChange: (cash: number, decor: DecorState, owned: string[]) => void;
  onBack: () => void;
}) {
  const decor = withDefaults(save.decor);
  const owned = [...new Set([...(save.owned ?? []), ...DEFAULT_OWNED])];
  const [slot, setSlot] = useState<Slot>('duvar');
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const shown: DecorState = preview ? { ...decor, [slot]: preview } : decor;
  const items = DECOR.filter((d) => d.slot === slot);

  const pick = (id: string) => {
    const it = DECOR.find((d) => d.id === id)!;
    if (owned.includes(id)) {
      onChange(save.cash, { ...decor, [slot]: id }, owned);
      setPreview(null);
      sfx('pop');
      return;
    }
    if (preview !== id) {
      setPreview(id);
      setMsg(null);
      sfx('tap');
      return;
    }
    if (save.cash < it.price) {
      setMsg(`Kasada yeterli para yok. ${fmt(it.price - save.cash)} daha lazım.`);
      sfx('fail');
      return;
    }
    onChange(save.cash - it.price, { ...decor, [slot]: id }, [...owned, id]);
    setPreview(null);
    setMsg(`${it.name} satın alındı!`);
    sfx('coins');
  };

  return (
    <div className="screen decor-shop">
      <div className="ds-head">
        <button className="hud-btn" onClick={onBack} aria-label="Geri">
          ‹
        </button>
        <div className="ds-title">Dükkânı Dekore Et</div>
        <div className="map-stars cash">💵 {fmt(save.cash)}</div>
      </div>
      <div className="ds-preview">
        <Restaurant
          decor={shown}
          menu={['Ramen', 'Udon', 'Soba', 'Pirinç Eriştesi']}
          rain={false}
        />
        <div className="ds-counter" />
        <div className="ds-bonus">Bahşiş bonusu: +%{tipBonus(shown)}</div>
        {preview && <div className="ds-tag">Önizleme</div>}
      </div>
      <div className="ds-slots">
        {SLOTS.map((s) => (
          <button
            key={s.id}
            className={`ds-slot ${slot === s.id ? 'on' : ''}`}
            onClick={() => {
              setSlot(s.id);
              setPreview(null);
              setMsg(null);
              sfx('tap');
            }}>
            <span>{s.icon}</span>
            {s.name}
          </button>
        ))}
      </div>
      {msg && <div className="ds-msg">{msg}</div>}
      <div className="ds-items">
        {items.map((it) => {
          const have = owned.includes(it.id);
          const on = decor[slot] === it.id;
          return (
            <button
              key={it.id}
              className={`ds-item ${on ? 'on' : ''} ${preview === it.id ? 'prev' : ''}`}
              onClick={() => pick(it.id)}>
              <b>{it.name}</b>
              <small>{it.tip ? `+%${it.tip} bahşiş` : 'Bonus yok'}</small>
              <em>
                {on
                  ? '✓ Kullanılıyor'
                  : have
                    ? 'Kullan'
                    : preview === it.id
                      ? `Satın al ${fmt(it.price)}`
                      : fmt(it.price)}
              </em>
            </button>
          );
        })}
      </div>
    </div>
  );
}
