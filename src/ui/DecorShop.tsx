// Decor shop: walls, floors, lamps, tables, plants. Each item gives a small tip bonus.

import { DECOR, DECOR_SLOTS } from '../game/data';
import { money, t, tx } from '../game/i18n';
import type { Save } from '../game/save';
import { tipBonus } from '../game/save';
import { sfx } from '../game/audio';
import { useLang } from '../App';

const SWATCH: Record<string, string> = {
  'wall-plain': '#f3e4cc',
  'wall-wave': 'repeating-radial-gradient(circle at 50% 100%, #dfe7ec 0 6px, #c8d5df 6px 12px)',
  'wall-indigo': '#5c6b94',
  'floor-plank': 'repeating-linear-gradient(0deg, #d9b48a 0 14px, #c99a6b 14px 16px)',
  'floor-stone': 'radial-gradient(circle at 30% 30%, #e3dbcd, #b9ae9c)',
  'lamp-paper': 'radial-gradient(circle, #fff3d8, #f6e7c8)',
  'lamp-coral': 'radial-gradient(circle, #ffd2c6, #ef8f7a)',
  'lamp-brass': 'linear-gradient(90deg, #a87a2e, #f0c870, #8a6020)',
  'table-pine': '#d6ae80',
  'table-walnut': '#7a5236',
  'plant-none': '#f4efe3',
  'plant-bonsai': 'radial-gradient(circle, #a9c98e, #5f8a52)',
  'plant-sakura': 'radial-gradient(circle, #f6c2cc, #f3a9b9)',
};

export default function DecorShop({
  save,
  update,
  onBack,
}: {
  save: Save;
  update: (f: (s: Save) => Save) => void;
  onBack: () => void;
}) {
  useLang();
  return (
    <div className="screen decor">
      <header className="map-head">
        <button className="btn ghost small" onClick={onBack}>
          ←
        </button>
        <h2>{t('decor')}</h2>
        <span className="pill">
          {t('wallet')}: {money(save.wallet)} ·{' '}
          {t('tipBonus', { n: Math.round(tipBonus(save) * 100) })}
        </span>
      </header>
      <div className="decor-list">
        {DECOR_SLOTS.map((sl) => (
          <section key={sl.slot}>
            <h3>{tx(sl.name)}</h3>
            <div className="decor-row">
              {DECOR.filter((d) => d.slot === sl.slot).map((d) => {
                const owned = save.owned.includes(d.id);
                const using = save.equipped[d.slot] === d.id;
                const afford = save.wallet >= d.price;
                return (
                  <div key={d.id} className={'decor-card' + (using ? ' using' : '')}>
                    <div className="swatch" style={{ background: SWATCH[d.id] }} />
                    <b>{tx(d.name)}</b>
                    {d.tip > 0 && <small>{t('tipBonus', { n: d.tip })}</small>}
                    {using ? (
                      <span className="tag done">{t('inUse')}</span>
                    ) : owned ? (
                      <button
                        className="btn small"
                        onClick={() => {
                          sfx('tap');
                          update((s) => ({ ...s, equipped: { ...s.equipped, [d.slot]: d.id } }));
                        }}>
                        {t('equip')}
                      </button>
                    ) : (
                      <button
                        className="btn small coral"
                        disabled={!afford}
                        onClick={() => {
                          sfx('coins');
                          update((s) => ({
                            ...s,
                            wallet: s.wallet - d.price,
                            owned: [...s.owned, d.id],
                            equipped: { ...s.equipped, [d.slot]: d.id },
                          }));
                        }}>
                        {t('buy')} · {money(d.price)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
