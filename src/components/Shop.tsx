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
import {
  BigArt,
  CounterDecor,
  Floor,
  Lamps,
  Neon,
  Plant,
  Restaurant,
  SmallArt,
  Special,
} from './Scenery';

const pct = (b: number) => `${(b * 100).toFixed((b * 100) % 1 ? 1 : 0)}%`;

/* ---------- small line icons for the category chips (no emoji) ---------- */
function CatIcon({ cat }: { cat: DecorCat }) {
  const s = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
  } as const;
  switch (cat) {
    case 'wall':
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18M3 15h18M9 4v6M15 10v5M9 15v5" />
        </svg>
      );
    case 'floor':
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M3 18 L8 6h8l5 12z" />
          <path d="M12 6v12M6.5 10h11M5 14h14" />
        </svg>
      );
    case 'bigart':
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <rect x="3" y="5" width="18" height="14" rx="1.5" />
          <path d="M6 16l4-5 3 3 2-2 3 4" />
          <circle cx="16" cy="9" r="1.4" />
        </svg>
      );
    case 'smallart':
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <rect x="7" y="3" width="10" height="18" rx="1.5" />
          <path d="M10 8h4M10 12h4M12 15v2" />
        </svg>
      );
    case 'lamps':
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M12 2v4" />
          <path d="M8 6h8" />
          <path d="M7.5 6c-2 4-2 8 0 11h9c2-3 2-7 0-11" />
          <path d="M9 17v3h6v-3" />
        </svg>
      );
    case 'tables':
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <ellipse cx="12" cy="8" rx="8" ry="3" />
          <path d="M12 11v9M6 20h12M9 12.5v6M15 12.5v6" />
        </svg>
      );
    case 'plants':
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M12 21v-8" />
          <path d="M12 13c-5 0-7-3-7-7 4 0 7 2 7 7zM12 13c5 0 7-3 7-7-4 0-7 2-7 7z" />
          <path d="M8 21h8" />
        </svg>
      );
    case 'neon':
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M4 14c2-6 5-6 7 0s5 6 7 0" />
          <path d="M4 18c2-6 5-6 7 0s5 6 7 0" opacity=".45" />
        </svg>
      );
    case 'counter':
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M5 11c0-4 3-6 7-6s7 2 7 6-3 9-7 9-7-5-7-9z" />
          <path d="M7 6l1-3 3 2M17 6l-1-3-3 2" />
          <path d="M10 12h.5M13.5 12h.5" strokeWidth="2.4" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" {...s}>
          <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
          <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
        </svg>
      );
  }
}

/* ---------- drawn previews (v3 line art) ---------- */

const INK = '#2b2420';
const ink = {
  stroke: INK,
  strokeOpacity: 0.82,
  strokeWidth: 1.3,
  vectorEffect: 'non-scaling-stroke',
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

function TablePreview({ id }: { id: string }) {
  const n = id === 'tables_4' ? 4 : id === 'tables_2' ? 2 : 0;
  const spots =
    n === 4
      ? [
          [62, 50],
          [98, 50],
          [44, 76],
          [116, 76],
        ]
      : n === 2
        ? [
            [48, 68],
            [112, 68],
          ]
        : [];
  return (
    <svg viewBox="0 0 160 120" className="pv-svg">
      <rect width="160" height="120" fill="#ece2d2" />
      <rect y="40" width="160" height="80" fill="#cfa273" />
      <path d="M0 40 h160" {...ink} />
      <path
        d="M20 120 L48 40 M60 120 L72 40 M100 120 L88 40 M140 120 L112 40"
        {...ink}
        strokeOpacity=".2"
      />
      {n === 0 && (
        <g>
          <rect x="0" y="86" width="160" height="34" fill="#c4935b" />
          <rect x="0" y="80" width="160" height="8" fill="#e2c093" {...ink} />
          {[40, 80, 120].map((x) => (
            <g key={x}>
              <rect x={x - 9} y="60" width="18" height="22" rx="4" fill="#8d5d3a" {...ink} />
              <ellipse cx={x} cy="60" rx="11" ry="4" fill="#c08d5e" {...ink} />
            </g>
          ))}
        </g>
      )}
      {spots.map(([x, y], i) => {
        const far = y < 60;
        const r = far ? 15 : 20;
        return (
          <g key={i}>
            <ellipse cx={x} cy={y + (far ? 18 : 24)} rx={r * 0.9} ry={3} fill={INK} opacity=".14" />
            <rect x={x - 2} y={y} width="4" height={far ? 16 : 22} fill="#7b4f2e" {...ink} />
            <ellipse
              cx={x}
              cy={y + (far ? 17 : 23)}
              rx={far ? 7 : 9}
              ry="2.5"
              fill="#7b4f2e"
              {...ink}
            />
            <ellipse cx={x} cy={y + 2.5} rx={r} ry={r * 0.38} fill="#a1764a" {...ink} />
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.38} fill="#d8ad78" {...ink} />
            <ellipse
              cx={x - r * 0.3}
              cy={y - 1}
              rx={r * 0.28}
              ry={r * 0.12}
              fill="#f6efe4"
              {...ink}
            />
            <ellipse cx={x - r * 0.3} cy={y - 1.6} rx={r * 0.18} ry={r * 0.07} fill="#e3b96b" />
            <circle cx={x + r * 0.4} cy={y - 1} r={r * 0.12} fill="#7c9a6e" {...ink} />
          </g>
        );
      })}
    </svg>
  );
}

function EmptyPreview({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 160 120" className="pv-svg">
      <rect width="160" height="120" fill="#ece2d2" />
      <rect
        x="34"
        y="26"
        width="92"
        height="68"
        rx="8"
        fill="none"
        stroke="#c9b79c"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
      <text
        x="80"
        y="65"
        textAnchor="middle"
        fontFamily="Nunito, sans-serif"
        fontSize="12"
        fontWeight="800"
        fill="#a08868">
        {label}
      </text>
    </svg>
  );
}

/** Illustrative preview of an item for its card. */
function ItemPreview({ item }: { item: DecorItem }) {
  const { cat, id } = item;
  const none = id.endsWith('_none');
  if (cat === 'wall') return <div className={`prev swatch ${id}`} />;
  if (cat === 'floor')
    return (
      <div className={`prev swatch floor ${id}`}>
        <Floor kind={id} />
      </div>
    );
  if (cat === 'lamps')
    return (
      <div className="prev lamps">
        <Lamps kind={id} />
      </div>
    );
  if (cat === 'tables')
    return (
      <div className="prev">
        <TablePreview id={id} />
      </div>
    );
  if (none)
    return (
      <div className="prev">
        <EmptyPreview label="boş" />
      </div>
    );
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
        <div className="map-title">
          <small>Noddles</small>
          Dekorasyon
        </div>
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
            <CatIcon cat={c.id} />
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
              {equipped ? (
                <span className="sc-badge eq">Takılı</span>
              ) : owned ? (
                <span className="sc-badge own">Sahip</span>
              ) : locked ? (
                <span className="sc-badge lock">Kilitli</span>
              ) : null}
              <ItemPreview item={it} />
              <div className="sc-name">{it.name}</div>
              <div className="sc-desc">{it.desc}</div>
              <div className="sc-meta">
                {it.tipBonus > 0 ? (
                  <span className="sc-bonus">+{pct(it.tipBonus)} bahşiş</span>
                ) : (
                  <span />
                )}
                {!owned && <span className="sc-price">{fmt(it.price)}</span>}
              </div>
              {equipped ? (
                <div className="btn small sc-btn is-eq">Takılı ✓</div>
              ) : owned ? (
                <button className="btn small ghost sc-btn" onClick={() => equip(it)}>
                  Kullan
                </button>
              ) : locked ? (
                <button className="btn small sc-btn is-lock" onClick={() => buy(it)}>
                  Para yetmiyor
                </button>
              ) : (
                <button className="btn small primary sc-btn" onClick={() => buy(it)}>
                  Satın al
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
