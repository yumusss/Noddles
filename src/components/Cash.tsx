import { useState } from 'react';
import { DENOMS, denomLabel, fmt } from '../money';
import { sfx, buzz } from '../audio';

/* ------------------------------------------------------------------ */
/* Bills & coins (change panel). Soft paper + metal discs, CSS in decor.css */
/* ------------------------------------------------------------------ */

export function Bill({ v, small = false }: { v: number; small?: boolean }) {
  const n = v / 100;
  return (
    <div className={`bill b${v} ${small ? 'sm' : ''}`}>
      <span className="bill-corner tl">{n}</span>
      <span className="bill-corner br">{n}</span>
      <span className="bill-medal">
        <i />
      </span>
      <span className="bill-val">{denomLabel(v)}</span>
    </div>
  );
}

export function CoinPiece({ v, small = false }: { v: number; small?: boolean }) {
  return (
    <div className={`coinp c${v} ${small ? 'sm' : ''}`}>
      <span>{v}¢</span>
    </div>
  );
}

export function Money({ v, small }: { v: number; small?: boolean }) {
  return v >= 100 ? <Bill v={v} small={small} /> : <CoinPiece v={v} small={small} />;
}

/* ------------------------------------------------------------------ */
/* Cash register: retro brass & walnut, ivory keys, amber display.     */
/* Tonal shading only — no outlines. ~120px wide on phone.             */
/* ------------------------------------------------------------------ */

const KEY_ROWS = [
  { y: 61, xs: [40, 52, 64, 76, 88] },
  { y: 70, xs: [38, 51, 64, 77, 90] },
  { y: 79, xs: [36, 50, 64, 78, 92] },
];

export function RegisterDecor({ display, open }: { display: string; open: boolean }) {
  return (
    <div className={`register ${open ? 'open' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 150 124" className="reg-svg">
        <defs>
          <linearGradient id="rg-brass" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f0d79a" />
            <stop offset=".35" stopColor="#d9b164" />
            <stop offset="1" stopColor="#a67c36" />
          </linearGradient>
          <linearGradient id="rg-brass-h" x1="0" x2="1">
            <stop offset="0" stopColor="#fff2c6" stopOpacity=".55" />
            <stop offset=".3" stopColor="#ffffff" stopOpacity="0" />
            <stop offset=".8" stopColor="#5a3f14" stopOpacity="0" />
            <stop offset="1" stopColor="#5a3f14" stopOpacity=".35" />
          </linearGradient>
          <linearGradient id="rg-walnut" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#8d5d3a" />
            <stop offset="1" stopColor="#5f3b22" />
          </linearGradient>
          <linearGradient id="rg-walnut-top" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#a8744a" />
            <stop offset="1" stopColor="#7f5231" />
          </linearGradient>
          <linearGradient id="rg-walnut-h" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".18" />
            <stop offset=".5" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#2b2420" stopOpacity=".28" />
          </linearGradient>
          <linearGradient id="rg-amber" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#3a2410" />
            <stop offset="1" stopColor="#1f1206" />
          </linearGradient>
          <radialGradient id="rg-ivory" cx=".4" cy=".35" r=".75">
            <stop offset="0" stopColor="#fffdf6" />
            <stop offset=".7" stopColor="#efe4cf" />
            <stop offset="1" stopColor="#cdbb9c" />
          </radialGradient>
          <linearGradient id="rg-tray" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#5b4a3d" />
            <stop offset="1" stopColor="#3e3129" />
          </linearGradient>
        </defs>

        {/* ground shadow */}
        <ellipse cx="75" cy="119" rx="60" ry="3.6" fill="#2b2420" opacity=".22" />

        {/* base body: a shallow plinth around the drawer */}
        <path d="M18 85 q0 -3 3 -3 h108 q3 0 3 3 v33 h-114z" fill="url(#rg-walnut)" />
        <path d="M18 85 q0 -3 3 -3 h108 q3 0 3 3 v33 h-114z" fill="url(#rg-walnut-h)" />
        <rect x="18" y="82" width="114" height="2" fill="#c08d5e" opacity=".8" />
        {/* drawer opening (dark gap) + lower lip */}
        <rect x="22" y="100" width="106" height="17" rx="2.5" fill="#2b2420" opacity=".55" />
        <rect x="18" y="116" width="114" height="2.5" fill="#2b2420" opacity=".3" />

        {/* drawer: tray + front panel, slides forward (down) when open */}
        <g className="reg-drawer">
          <g className="reg-tray">
            <rect x="24" y="90" width="102" height="26" rx="3" fill="url(#rg-tray)" />
            {/* bill slots */}
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`translate(${29 + i * 18} 93)`}>
                <rect width="15" height="12" rx="1.5" fill="#2b2420" opacity=".35" />
                <rect
                  x="1.5"
                  y="2"
                  width="12"
                  height="8"
                  rx="1"
                  fill={['#d7dfc6', '#cfd8dc', '#e4d2a6', '#c9d9c2'][i]}
                />
                <rect x="1.5" y="2" width="12" height="2" fill="#ffffff" opacity=".35" />
              </g>
            ))}
            {/* coin cups */}
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(107 ${96 + i * 6.5})`}>
                <ellipse rx="11" ry="2.6" fill="#2b2420" opacity=".4" />
                <ellipse cx="-3" cy="-.6" rx="3" ry="1.5" fill="#d9a441" />
                <ellipse cx="2" cy="-1" rx="3" ry="1.5" fill="#c9ced6" />
                <ellipse cx="5.5" cy="-.4" rx="3" ry="1.5" fill="#e0b34f" />
              </g>
            ))}
            <rect x="29" y="107" width="69" height="8" rx="1.5" fill="#2b2420" opacity=".3" />
          </g>
          {/* drawer face (flush with the base when closed) */}
          <rect x="22" y="101" width="106" height="15" rx="2.5" fill="url(#rg-walnut)" />
          <rect x="22" y="101" width="106" height="15" rx="2.5" fill="url(#rg-walnut-h)" />
          <rect x="22" y="101" width="106" height="1.4" fill="#ffffff" opacity=".2" />
          <rect x="66" y="106.5" width="18" height="4" rx="2" fill="url(#rg-brass)" />
          <rect x="66" y="106.5" width="18" height="1.4" rx="1" fill="#fff2c6" opacity=".6" />
        </g>

        {/* sloped key deck (walnut) */}
        <path d="M30 52 h90 l12 32 h-114z" fill="url(#rg-walnut-top)" />
        <path d="M30 52 h90 l12 32 h-114z" fill="url(#rg-walnut-h)" />
        <path d="M30 52 h90 l1.5 4 h-93z" fill="#ffffff" opacity=".16" />

        {/* ivory keys */}
        {KEY_ROWS.map((row, r) =>
          row.xs.map((x) => (
            <g key={`${r}-${x}`}>
              <circle cx={x} cy={row.y + 1.4} r={3.6 + r * 0.25} fill="#2b2420" opacity=".35" />
              <circle cx={x} cy={row.y} r={3.6 + r * 0.25} fill="url(#rg-ivory)" />
              <circle cx={x - 1} cy={row.y - 1} r={1.1} fill="#ffffff" opacity=".7" />
            </g>
          ))
        )}
        {/* total bar key: terracotta */}
        <rect x="100" y="59" width="12" height="21" rx="3" fill="#2b2420" opacity=".3" />
        <rect x="100" y="57.5" width="12" height="21" rx="3" fill="#c8553d" />
        <rect x="101.5" y="59" width="9" height="6" rx="2.5" fill="#e8846c" opacity=".75" />

        {/* upper brass housing */}
        <path d="M34 54 v-30 q0 -16 16 -16 h50 q16 0 16 16 v30z" fill="url(#rg-brass)" />
        <path d="M34 54 v-30 q0 -16 16 -16 h50 q16 0 16 16 v30z" fill="url(#rg-brass-h)" />
        {/* engraved trims */}
        <path d="M40 48 h70" stroke="#6a4c16" strokeWidth=".8" opacity=".45" />
        <path d="M40 49.2 h70" stroke="#fff2c6" strokeWidth=".8" opacity=".5" />
        <path
          d="M50 11.5 h50"
          stroke="#fff2c6"
          strokeWidth="1"
          opacity=".55"
          strokeLinecap="round"
        />
        {/* display window */}
        <rect x="43" y="19" width="64" height="22" rx="4" fill="#6a4c16" opacity=".55" />
        <rect x="44" y="20" width="62" height="20" rx="3.5" fill="url(#rg-amber)" />
        <rect x="44" y="20" width="62" height="7" rx="3.5" fill="#ffffff" opacity=".07" />
        <text x="101" y="34.6" textAnchor="end" className="reg-digits">
          {display}
        </text>
        {/* tiny brass plaque under display */}
        <rect x="62" y="43" width="26" height="3" rx="1.5" fill="#8a6520" opacity=".6" />
        <rect x="62" y="42.4" width="26" height="1.2" rx=".6" fill="#fff2c6" opacity=".5" />

        {/* side crank */}
        <rect x="116" y="30" width="4" height="12" rx="2" fill="#a67c36" />
        <path d="M118 36 h12" stroke="#d9b164" strokeWidth="3" strokeLinecap="round" />
        <path d="M130 36 v12" stroke="#c9a456" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="130" cy="50" rx="3.2" ry="4.2" fill="#8d5d3a" />
        <ellipse cx="129.2" cy="49" rx="1.2" ry="2" fill="#c08d5e" opacity=".7" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tip bowl: handmade celadon ceramic bowl, kraft tag on twine.        */
/* ------------------------------------------------------------------ */

const TIP_COINS: ReadonlyArray<readonly [number, number, number, 'g' | 's']> = [
  [36, 44, -8, 'g'],
  [52, 45, 10, 's'],
  [44, 41, 4, 'g'],
  [30, 41, 14, 's'],
  [58, 41, -12, 'g'],
  [38, 38, -4, 's'],
  [50, 37.5, 8, 'g'],
  [44, 35, -10, 'g'],
  [33, 36, 6, 'g'],
  [56, 36.5, -4, 's'],
  [40, 33, 12, 's'],
  [49, 32.5, -6, 'g'],
];

function TipCoin({ kind, drop = false }: { kind: 'g' | 's'; drop?: boolean }) {
  const top = kind === 'g' ? 'url(#tb-gold)' : 'url(#tb-silver)';
  const rim = kind === 'g' ? '#a67a2a' : '#8d949c';
  return (
    <g className={drop ? 'tb-drop' : undefined}>
      <ellipse cy="1.3" rx="6.5" ry="2.6" fill={rim} />
      <ellipse rx="6.5" ry="2.6" fill={top} />
      <ellipse rx="3.6" ry="1.3" fill="none" stroke="#fff6e8" strokeWidth=".6" opacity=".55" />
    </g>
  );
}

export function TipJar({ amount, bump }: { amount: number; bump: number }) {
  const coins = Math.min(TIP_COINS.length, Math.ceil(amount / 200));
  const bill = amount >= 900;
  return (
    <div className="tipjar" aria-hidden="true">
      <div key={bump} className={`tj-bowl ${bump ? 'bump' : ''}`}>
        <svg viewBox="0 0 90 92" className="tj-svg">
          <defs>
            <linearGradient id="tb-glaze" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#dcefe2" />
              <stop offset=".45" stopColor="#a9d0b8" />
              <stop offset="1" stopColor="#5f9579" />
            </linearGradient>
            <linearGradient id="tb-inner" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#4f7f66" />
              <stop offset="1" stopColor="#7fb094" />
            </linearGradient>
            <radialGradient id="tb-gold" cx=".35" cy=".3" r=".8">
              <stop offset="0" stopColor="#f8dd8f" />
              <stop offset=".6" stopColor="#d9a441" />
              <stop offset="1" stopColor="#b3832c" />
            </radialGradient>
            <radialGradient id="tb-silver" cx=".35" cy=".3" r=".8">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset=".6" stopColor="#cfd4da" />
              <stop offset="1" stopColor="#9aa1aa" />
            </radialGradient>
            <clipPath id="tb-clip">
              <ellipse cx="45" cy="40" rx="30" ry="9" />
            </clipPath>
          </defs>
          <ellipse cx="45" cy="86" rx="28" ry="3.4" fill="#2b2420" opacity=".24" />
          {/* body */}
          <path d="M12 40 q2 30 18 40 q15 5 30 0 q16 -10 18 -40z" fill="url(#tb-glaze)" />
          {/* glaze drip edge + unglazed foot */}
          <path d="M22 70 q23 9 46 0 q-4 7 -8 10 q-15 5 -30 0 q-4 -3 -8 -10z" fill="#c9a784" />
          <path d="M26 74 q19 6 38 0 q-2 3 -4 5 q-15 4 -30 0 q-2 -2 -4 -5z" fill="#b08c68" />
          {/* highlight sheen on the body */}
          <path
            d="M19 46 q2 18 10 26"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            opacity=".45"
          />
          {/* mouth: dark interior */}
          <ellipse cx="45" cy="40" rx="33" ry="10.5" fill="#86b79b" />
          <ellipse cx="45" cy="40" rx="30" ry="9" fill="url(#tb-inner)" />
          {/* coins + bill inside the mouth */}
          <g clipPath="url(#tb-clip)">
            {bill && (
              <g transform="translate(45 40) rotate(-14)">
                <rect x="-13" y="-6" width="26" height="11" rx="1.5" fill="#b9c9a6" />
                <rect x="-13" y="-6" width="26" height="4" rx="1" fill="#d3dfc3" />
                <rect x="-13" y="-1.5" width="26" height="1" fill="#8fa37c" opacity=".6" />
              </g>
            )}
            {TIP_COINS.slice(0, coins).map(([x, y, rot, k], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
                <TipCoin kind={k} drop={bump > 0 && i === coins - 1} />
              </g>
            ))}
          </g>
          {/* rim: thin lip highlight */}
          <ellipse
            cx="45"
            cy="40"
            rx="33"
            ry="10.5"
            fill="none"
            stroke="#eef8f0"
            strokeWidth="1.6"
            opacity=".8"
          />
          <ellipse
            cx="45"
            cy="40.8"
            rx="33"
            ry="10.5"
            fill="none"
            stroke="#4f7f66"
            strokeWidth="1"
            opacity=".35"
          />
          {/* twine + kraft tag hanging on the near-left side */}
          <path
            d="M18 46 q-3 5 -1 10"
            stroke="#b89a6e"
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
          <g transform="translate(17 56) rotate(-9)">
            <path
              d="M-9 0 h14 l5 5 v12 h-19z"
              fill="#2b2420"
              opacity=".18"
              transform="translate(0 1.5)"
            />
            <path d="M-9 0 h14 l5 5 v12 h-19z" fill="#d9c4a3" />
            <path d="M-9 0 h14 l5 5 h-19z" fill="#e7d6ba" />
            <circle cx="-4.5" cy="4" r="1.1" fill="#8d7250" />
            <text x="0.5" y="13" textAnchor="middle" className="tj-text">
              bahşiş
            </text>
          </g>
        </svg>
      </div>
      <div className="tj-amount">{fmt(amount)}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Make change: the player picks bills and coins from the open drawer. */
/* ------------------------------------------------------------------ */

export function ChangePanel({
  name,
  due,
  given,
  showAnswer,
  onDone,
}: {
  name: string;
  due: number;
  given: number;
  showAnswer: boolean;
  onDone: (gave: number, mistakes: number) => void;
}) {
  const [tray, setTray] = useState<number[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const need = given - due;
  const sum = tray.reduce((a, b) => a + b, 0);

  const give = () => {
    if (sum < need) {
      setMistakes((m) => m + 1);
      setMsg(`“Eksik verdin şef, ${fmt(need - sum)} daha lazım!”`);
      sfx('fail');
      buzz(40);
      return;
    }
    sfx('coins');
    onDone(sum, mistakes + (sum > need ? 1 : 0));
  };

  return (
    <div className="change-panel">
      <div className="cp-head">
        <div>
          <small>Hesap</small>
          <b>{fmt(due)}</b>
        </div>
        <div className="cp-given">
          <small>{name} verdi</small>
          <div className="cp-cash">
            {splitCash(given).map((d, i) => (
              <Money key={i} v={d} small />
            ))}
          </div>
          <b>{fmt(given)}</b>
        </div>
        <div>
          <small>Para üstü</small>
          <b className={showAnswer ? '' : 'q'}>{showAnswer ? fmt(need) : '?'}</b>
        </div>
      </div>
      <div className="cp-tray">
        <div className="cp-tray-items">
          {tray.length === 0 && (
            <span className="cp-empty">
              {need === 0 ? 'Tam para, para üstü yok.' : 'Çekmeceden para üstünü seç'}
            </span>
          )}
          {tray.map((d, i) => (
            <button
              key={i}
              className="cp-item"
              onClick={() => {
                setTray((t) => t.filter((_, k) => k !== i));
                sfx('tap');
              }}>
              <Money v={d} small />
            </button>
          ))}
        </div>
        <div className="cp-sum">{fmt(sum)}</div>
      </div>
      {msg && <div className="cp-msg">{msg}</div>}
      <div className="drawer">
        {DENOMS.map((d) => (
          <button
            key={d}
            data-denom={d}
            className={`slot ${d >= 100 ? 'note' : 'coin'}`}
            onClick={() => {
              setTray((t) => [...t, d]);
              setMsg(null);
              sfx(d >= 100 ? 'whoosh' : 'tap');
              buzz(6);
            }}>
            <Money v={d} />
          </button>
        ))}
      </div>
      <div className="cp-actions">
        <button
          className="btn ghost"
          onClick={() => {
            setTray([]);
            sfx('trash');
          }}>
          Temizle
        </button>
        <button className="btn primary" onClick={give}>
          Para üstünü ver ✓
        </button>
      </div>
    </div>
  );
}

function splitCash(c: number): number[] {
  const out: number[] = [];
  for (const d of DENOMS) {
    while (c >= d && out.length < 8) {
      out.push(d);
      c -= d;
    }
  }
  return out;
}
