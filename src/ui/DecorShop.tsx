// Decorate the hut: awning, lights, a lucky charm, a plant. Each adds a little to tips.

import { DECOR, DECOR_SLOTS, type DecorSlot } from '../game/data';
import { money, t, tx } from '../game/i18n';
import { tipBonus, type Save } from '../game/save';
import { sfx } from '../game/audio';
import Backdrop from './Backdrop';
import { useLang } from '../App';

const SWATCH: Record<string, string> = {
  'awning-indigo': 'linear-gradient(90deg,#3a4677,#46548a,#3a4677)',
  'awning-coral': 'linear-gradient(90deg,#d9705b,#e98d7a,#d9705b)',
  'awning-matcha': 'linear-gradient(90deg,#75996a,#8fb37f,#75996a)',
  'lantern-paper': 'radial-gradient(circle,#fff3d8,#e9c98a)',
  'lantern-fish': 'radial-gradient(circle,#ffe3cf,#ef8f6a)',
  'lantern-star': 'radial-gradient(circle,#fff6c8 10%,#2a3466 70%)',
  'charm-none': '#f4efe3',
  'charm-cat': 'radial-gradient(circle,#ffffff,#f1e6d6)',
  'charm-daruma': 'radial-gradient(circle,#ee6a5a,#c23a2e)',
  'plant-none': '#f4efe3',
  'plant-pine': 'radial-gradient(circle,#9fc39a,#5f8a52)',
  'plant-camellia': 'radial-gradient(circle,#f3a9b9,#d94a5a)',
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
      <div className="decor-preview">
        <Backdrop time="sunset" snow="light" decor={save.equipped as Record<DecorSlot, string>} />
      </div>
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
                return (
                  <div key={d.id} className={'decor-card' + (using ? ' using' : '')}>
                    <div className="swatch" style={{ background: SWATCH[d.id] }} />
                    <b>{tx(d.name)}</b>
                    {d.tip > 0 && <small>{t('tipBonus', { n: d.tip })}</small>}
                    {using ? (
                      <span className="tag good">{t('inUse')}</span>
                    ) : owned ? (
                      <button
                        className="btn small"
                        onClick={() => (
                          sfx('tap'),
                          update((s) => ({ ...s, equipped: { ...s.equipped, [d.slot]: d.id } }))
                        )}>
                        {t('equip')}
                      </button>
                    ) : (
                      <button
                        className="btn small coral"
                        disabled={save.wallet < d.price}
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
