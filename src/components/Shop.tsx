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

/* ---------- drawn previews ---------- */

const LAMP_COLORS: Record<string, string[]> = {
  lamps_red: ['#c8553d', '#c8553d', '#c8553d'],
  lamps_paper: ['#f6efe4', '#f6efe4', '#f6efe4'],
  lamps_edison: ['#e8b86e', '#e8b86e', '#e8b86e'],
  lamps_festival: ['#c8553d', '#d9a441', '#7c9a6e'],
};

function LampPreview({ id }: { id: string }) {
  const cols = LAMP_COLORS[id] ?? LAMP_COLORS.lamps_red;
  const xs = [34, 80, 126];
  const ys = id === 'lamps_edison' ? [40, 56, 46] : [42, 50, 42];
  return (
    <svg viewBox="0 0 160 120" className="pv-svg">
      <defs>
        <linearGradient id={`pl-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4a3a5e" />
          <stop offset="1" stopColor="#2f2838" />
        </linearGradient>
        {cols.map((c, i) => (
          <radialGradient key={i} id={`pl-${id}-${i}`} cx=".42" cy=".36" r=".75">
            <stop offset="0" stopColor="#fff6e8" stopOpacity=".95" />
            <stop offset=".35" stopColor={c} />
            <stop offset="1" stopColor={c} stopOpacity=".55" />
          </radialGradient>
        ))}
      </defs>
      <rect width="160" height="120" fill={`url(#pl-${id})`} />
      {xs.map((x, i) => {
        const c = cols[i];
        const y = ys[i];
        return (
          <g key={i}>
            <circle cx={x} cy={y + 10} r="30" fill={c} opacity=".16" />
            <circle cx={x} cy={y + 10} r="18" fill={c} opacity=".2" />
            <path d={`M${x} 0 v${y - 14}`} stroke="#8a7a66" strokeWidth="1.4" />
            {id === 'lamps_paper' ? (
              <circle cx={x} cy={y + 2} r="16" fill={`url(#pl-${id}-${i})`} />
            ) : id === 'lamps_edison' ? (
              <g>
                <rect x={x - 4} y={y - 15} width="8" height="7" rx="2" fill="#a97a4c" />
                <path
                  d={`M${x - 7} ${y - 6} q-5 12 2 20 q5 5 10 0 q7 -8 2 -20z`}
                  fill={`url(#pl-${id}-${i})`}
                />
                <path
                  d={`M${x - 3} ${y + 2} q3 -6 6 0 q-3 6 -6 0`}
                  fill="none"
                  stroke="#fff1c6"
                  strokeWidth="1"
                />
              </g>
            ) : (
              <g>
                <rect x={x - 9} y={y - 16} width="18" height="4" rx="2" fill="#5a4030" />
                <path
                  d={`M${x - 14} ${y - 10} q0 -5 14 -5 q14 0 14 5 v18 q0 5 -14 5 q-14 0 -14 -5z`}
                  fill={`url(#pl-${id}-${i})`}
                />
                <path
                  d={`M${x - 14} ${y - 4} h28 M${x - 14} ${y + 3} h28`}
                  stroke="#2b2420"
                  strokeWidth=".8"
                  opacity=".22"
                />
                <rect x={x - 9} y={y + 10} width="18" height="4" rx="2" fill="#5a4030" />
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function TablePreview({ id }: { id: string }) {
  const n = id === 'tables_4' ? 4 : id === 'tables_2' ? 2 : 0;
  const spots =
    n === 4
      ? [
          [44, 70],
          [116, 70],
          [62, 46],
          [98, 46],
        ]
      : n === 2
        ? [
            [48, 62],
            [112, 62],
          ]
        : [];
  return (
    <svg viewBox="0 0 160 120" className="pv-svg">
      <defs>
        <linearGradient id={`pt-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ece2d2" />
          <stop offset="1" stopColor="#d6b48a" />
        </linearGradient>
      </defs>
      <rect width="160" height="120" fill={`url(#pt-${id})`} />
      <rect y="78" width="160" height="42" fill="#c89a68" />
      <rect y="78" width="160" height="3" fill="#e2c093" />
      {n === 0 && (
        <g>
          {[40, 80, 120].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="100" rx="13" ry="4" fill="#2b2420" opacity=".15" />
              <rect x={x - 9} y="70" width="18" height="24" rx="4" fill="#8d5d3a" />
              <ellipse cx={x} cy="70" rx="11" ry="4" fill="#c08d5e" />
            </g>
          ))}
        </g>
      )}
      {spots.map(([x, y], i) => {
        const far = y < 60;
        const r = far ? 15 : 20;
        return (
          <g key={i}>
            <ellipse cx={x + 3} cy={y + 24} rx={r} ry={5} fill="#2b2420" opacity=".15" />
            <rect x={x - 2} y={y} width="4" height={far ? 16 : 22} fill="#7b4f2e" />
            <ellipse cx={x} cy={y + (far ? 17 : 23)} rx={far ? 7 : 9} ry="2.5" fill="#7b4f2e" />
            <ellipse cx={x} cy={y + 1.5} rx={r} ry={r * 0.38} fill="#a97a4c" />
            <ellipse cx={x} cy={y} rx={r} ry={r * 0.38} fill="#dcb98c" />
            <ellipse cx={x - r * 0.3} cy={y - 1} rx={r * 0.28} ry={r * 0.12} fill="#f6efe4" />
            <ellipse cx={x - r * 0.3} cy={y - 1.6} rx={r * 0.18} ry={r * 0.07} fill="#e8b86e" />
            <circle cx={x + r * 0.4} cy={y - 1} r={r * 0.12} fill="#7c9a6e" />
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
        <div className="rest-floor-tex" />
      </div>
    );
  if (cat === 'lamps')
    return (
      <div className="prev">
        <LampPreview id={id} />
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
