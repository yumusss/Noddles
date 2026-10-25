import { useState, type Dispatch, type SetStateAction } from 'react';
import type { Save } from '../App';
import { sfx } from '../audio';
import { fmt } from '../money';
import {
  DECOR_CATS,
  decorTipBonus,
  itemsOf,
  tableCount,
  type Decor,
  type DecorCat,
  type DecorItem,
} from '../decor';
import { CatArt } from '../art';
import { BigArt, CounterDecor, Neon, Plant, Restaurant, SmallArt, Special } from './Scenery';

const pct = (b: number) => `${(b * 100).toFixed((b * 100) % 1 ? 1 : 0)}%`;

/** Small illustrative preview of an item for its card. */
function ItemPreview({ item }: { item: DecorItem }) {
  const { cat, id } = item;
  const none = id.endsWith('_none') || id === 'tables_0';
  if (cat === 'wall') return <div className={`prev swatch ${id}`} />;
  if (cat === 'floor')
    return (
      <div className={`prev swatch ${id}`}>
        <div className="rest-floor-tex" />
      </div>
    );
  if (none) return <div className="prev empty">—</div>;
  if (cat === 'bigart')
    return (
      <div className="prev frame">
        <BigArt kind={id} />
      </div>
    );
  if (cat === 'smallart')
    return (
      <div className="prev small">
        <SmallArt kind={id} />
      </div>
    );
  if (cat === 'lamps')
    return (
      <div className={`prev lamps ${id}`}>
        <i />
        <i />
        <i />
      </div>
    );
  if (cat === 'tables')
    return (
      <div className="prev tables">
        {Array.from({ length: id === 'tables_4' ? 4 : 2 }, (_, i) => (
          <svg key={i} viewBox="0 0 40 30">
            <ellipse cx="20" cy="11" rx="18" ry="6" fill="#b6834f" />
            <ellipse cx="20" cy="10" rx="18" ry="6" fill="#d4ab78" />
            <rect x="18" y="14" width="4" height="12" fill="#7b4f2e" />
            <ellipse cx="20" cy="26" rx="7" ry="2" fill="#7b4f2e" />
            <ellipse cx="16" cy="9" rx="5" ry="2.2" fill="#f6efe4" />
            <circle cx="27" cy="9" r="2" fill="#7c9a6e" />
          </svg>
        ))}
      </div>
    );
  if (cat === 'plants')
    return (
      <div className="prev plant">
        <Plant kind={id} />
      </div>
    );
  if (cat === 'neon')
    return (
      <div className="prev neon">
        <Neon kind={id} />
      </div>
    );
  if (cat === 'counter')
    return (
      <div className="prev counter">
        <CounterDecor kind={id} />
      </div>
    );
  return (
    <div className="prev special">
      <Special kind={id} />
    </div>
  );
}

export default function Shop({
  save,
  setSave,
  onBack,
}: {
  save: Save;
  setSave: Dispatch<SetStateAction<Save>>;
  onBack: () => void;
}) {
  const [cat, setCat] = useState<DecorCat>('wall');
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
  const bonus = decorTipBonus(save.decor);
  const items = itemsOf(cat);

  const isOwned = (it: DecorItem) => it.price === 0 || save.owned.includes(it.id);

  const equip = (it: DecorItem) => {
    sfx('tap');
    setSave((s) => ({ ...s, decor: { ...s.decor, [it.cat]: it.id } as Decor }));
  };

  const buy = (it: DecorItem) => {
    if (save.cash < it.price) {
      sfx('fail');
      setFlash({ id: it.id, ok: false });
      setTimeout(() => setFlash(null), 700);
      return;
    }
    sfx('coins');
    setFlash({ id: it.id, ok: true });
    setTimeout(() => setFlash(null), 700);
    setSave((s) => ({
      ...s,
      cash: s.cash - it.price,
      owned: s.owned.includes(it.id) ? s.owned : [...s.owned, it.id],
      decor: { ...s.decor, [it.cat]: it.id } as Decor,
    }));
  };

  return (
    <div className="screen shop">
      <div className="map-head shop-head">
        <button
          className="hud-btn"
          onClick={() => {
            sfx('tap');
            onBack();
          }}
          aria-label="Geri">
          ‹
        </button>
        <div className="map-title">Dekorasyon</div>
        <div className="map-stars cash">{fmt(save.cash)}</div>
      </div>

      <div className="shop-preview">
        <Restaurant decor={save.decor} cat={<CatArt size={40} sleepy />} time="noon" />
        <div className="pv-counter" />
        <div className="shop-bonus">
          <b>Bahşiş bonusu</b>
          <span>+{pct(bonus)}</span>
        </div>
        {tableCount(save.decor) === 0 && (
          <div className="shop-hint">Masa alırsan misafirler oturur</div>
        )}
      </div>

      <div className="shop-tabs">
        {DECOR_CATS.map((c) => (
          <button
            key={c.id}
            className={`shop-tab ${c.id === cat ? 'on' : ''}`}
            onClick={() => {
              sfx('tap');
              setCat(c.id);
            }}>
            <span>{c.icon}</span>
            {c.label}
          </button>
        ))}
      </div>

      <div className="shop-grid">
        {items.map((it) => {
          const owned = isOwned(it);
          const equipped = save.decor[it.cat] === it.id;
          const locked = !owned && save.cash < it.price;
          const f = flash?.id === it.id ? (flash.ok ? 'bought' : 'nope') : '';
          return (
            <div
              key={it.id}
              className={`shop-card ${equipped ? 'equipped' : ''} ${locked ? 'locked' : ''} ${f}`}>
              <ItemPreview item={it} />
              <div className="sc-name">{it.name}</div>
              <div className="sc-desc">{it.desc}</div>
              <div className="sc-meta">
                {it.tipBonus > 0 ? (
                  <span className="sc-bonus">bahşiş +{pct(it.tipBonus)}</span>
                ) : (
                  <span />
                )}
                {!owned && <span className="sc-price">{fmt(it.price)}</span>}
                {owned && !equipped && <span className="sc-owned">Senin</span>}
              </div>
              {equipped ? (
                <div className="btn small sc-btn is-eq">Takılı ✓</div>
              ) : owned ? (
                <button className="btn small ghost sc-btn" onClick={() => equip(it)}>
                  Kullan
                </button>
              ) : (
                <button
                  className={`btn small sc-btn ${locked ? 'ghost' : 'primary'}`}
                  onClick={() => buy(it)}>
                  {locked ? 'Para yetmiyor' : 'Satın al'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
