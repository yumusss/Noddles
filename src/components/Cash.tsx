import { useState } from 'react';
import { DENOMS, denomLabel, fmt } from '../money';
import { sfx, buzz } from '../audio';

/* ------------------------------------------------------------------ */
/* Bills & coins (change panel). Line-art paper + discs, CSS in decor.css  */
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
/* Cash register: v3 line art — cream body, walnut deck, copper keys.  */
/* Thin ink outline, flat fills, one shadow tone, one highlight.       */
/* ------------------------------------------------------------------ */

const INK = '#2b2420';
const HI = '#fff6e8';
const ink = {
  stroke: INK,
  strokeOpacity: 0.82,
  strokeWidth: 1.3,
  vectorEffect: 'non-scaling-stroke',
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

const KEY_ROWS = [
  { y: 61, xs: [40, 52, 64, 76, 88] },
  { y: 70, xs: [38, 51, 64, 77, 90] },
  { y: 79, xs: [36, 50, 64, 78, 92] },
];

export function RegisterDecor({ display, open }: { display: string; open: boolean }) {
  return (
    <div className={`register ${open ? 'open' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 150 124" className="reg-svg">
        <ellipse cx="75" cy="120" rx="60" ry="3.4" fill={INK} opacity=".16" />

        {/* base plinth */}
        <path d="M18 85 q0 -3 3 -3 h108 q3 0 3 3 v33 h-114z" fill="#7b4f2e" {...ink} />
        <path d="M112 82 h17 q3 0 3 3 v33 h-20z" fill="#5f3c22" />
        <rect x="22" y="100" width="106" height="17" rx="2.5" fill={INK} opacity=".45" />

        {/* drawer: tray + face, slides forward when open */}
        <g className="reg-drawer">
          <g className="reg-tray">
            <rect x="24" y="90" width="102" height="26" rx="3" fill="#4a3b31" {...ink} />
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`translate(${29 + i * 18} 93)`}>
                <rect width="15" height="12" rx="1.5" fill={INK} opacity=".3" />
                <rect
                  x="1.5"
                  y="2"
                  width="12"
                  height="8"
                  rx="1"
                  fill={['#d7dfc6', '#cfd8dc', '#e4d2a6', '#e9c9c2'][i]}
                  {...ink}
                  strokeOpacity=".5"
                />
              </g>
            ))}
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(107 ${96 + i * 6.5})`}>
                <ellipse rx="11" ry="2.6" fill={INK} opacity=".35" />
                <ellipse
                  cx="-3"
                  cy="-.6"
                  rx="3"
                  ry="1.5"
                  fill="#d9a441"
                  {...ink}
                  strokeOpacity=".5"
                />
                <ellipse
                  cx="2"
                  cy="-1"
                  rx="3"
                  ry="1.5"
                  fill="#c9ced6"
                  {...ink}
                  strokeOpacity=".5"
                />
                <ellipse
                  cx="5.5"
                  cy="-.4"
                  rx="3"
                  ry="1.5"
                  fill="#d9a441"
                  {...ink}
                  strokeOpacity=".5"
                />
              </g>
            ))}
          </g>
          <rect x="22" y="101" width="106" height="15" rx="2.5" fill="#8d5d3a" {...ink} />
          <rect x="22" y="101" width="106" height="2" fill={HI} opacity=".25" />
          <rect x="66" y="106" width="18" height="5" rx="2.5" fill="#d9a441" {...ink} />
        </g>

        {/* sloped key deck */}
        <path d="M30 52 h90 l12 32 h-114z" fill="#a1764a" {...ink} />
        <path d="M100 52 h20 l12 32 h-26z" fill="#8a6144" />
        <path d="M30 52 h90" stroke={HI} strokeWidth="1.6" opacity=".35" />

        {/* copper keys */}
        {KEY_ROWS.map((row, r) =>
          row.xs.map((x) => (
            <g key={`${r}-${x}`}>
              <circle cx={x} cy={row.y + 1.4} r={3.6 + r * 0.25} fill={INK} opacity=".3" />
              <circle cx={x} cy={row.y} r={3.6 + r * 0.25} fill="#f1e6d2" {...ink} />
              <circle cx={x - 1.1} cy={row.y - 1.1} r={1} fill={HI} />
            </g>
          ))
        )}
        <rect x="100" y="57.5" width="12" height="21" rx="3" fill="#c8553d" {...ink} />
        <rect x="102" y="59.5" width="4" height="6" rx="2" fill={HI} opacity=".55" />

        {/* upper housing */}
        <path d="M34 54 v-30 q0 -16 16 -16 h50 q16 0 16 16 v30z" fill="#f6efe4" {...ink} />
        <path d="M96 8 h4 q16 0 16 16 v30 h-14 v-30 q0 -12 -6 -16z" fill="#dccfbb" />
        <path d="M40 48 h70" {...ink} strokeOpacity=".3" />
        <path d="M44 14 q2 -6 8 -6" stroke={HI} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* display */}
        <rect x="44" y="20" width="62" height="20" rx="3.5" fill="#2b2420" {...ink} />
        <rect x="46" y="22" width="58" height="3" rx="1.5" fill={HI} opacity=".08" />
        <text x="101" y="34.6" textAnchor="end" className="reg-digits">
          {display}
        </text>
        <rect
          x="62"
          y="43"
          width="26"
          height="3"
          rx="1.5"
          fill="#d9a441"
          {...ink}
          strokeOpacity=".5"
        />

        {/* side crank */}
        <rect x="116" y="30" width="4" height="12" rx="2" fill="#b5862f" {...ink} />
        <path
          d="M118 36 h12 v12"
          {...ink}
          stroke="#d9a441"
          strokeOpacity="1"
          strokeWidth="3"
          fill="none"
        />
        <path d="M118 36 h12 v12" {...ink} fill="none" />
        <ellipse cx="130" cy="51" rx="3.2" ry="4.2" fill="#8d5d3a" {...ink} />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tip bowl: celadon ceramic bowl in line art, kraft tag on twine.     */
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
  const top = kind === 'g' ? '#d9a441' : '#c9ced6';
  const rim = kind === 'g' ? '#b5862f' : '#9aa1aa';
  return (
    <g className={drop ? 'tb-drop' : undefined}>
      <ellipse cy="1.4" rx="6.5" ry="2.6" fill={rim} {...ink} strokeOpacity=".6" />
      <ellipse rx="6.5" ry="2.6" fill={top} {...ink} strokeOpacity=".6" />
      <ellipse cx="-2" cy="-.6" rx="1.8" ry=".7" fill={HI} opacity=".7" />
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
            <clipPath id="tb-clip">
              <ellipse cx="45" cy="40" rx="30" ry="9" />
            </clipPath>
          </defs>
          <ellipse cx="45" cy="86" rx="28" ry="3.2" fill={INK} opacity=".16" />
          {/* body */}
          <path d="M12 40 q2 30 18 40 q15 5 30 0 q16 -10 18 -40z" fill="#a9d0b8" {...ink} />
          <path
            d="M60 40 h18 q-2 30 -18 40 q-6 4 -14 4 q10 -6 14 -14 q4 -14 0 -30z"
            fill="#7fb094"
          />
          <path
            d="M26 74 q19 6 38 0 q-2 3 -4 5 q-15 4 -30 0 q-2 -2 -4 -5z"
            fill="#c9a784"
            {...ink}
          />
          <path
            d="M20 46 q2 16 9 24"
            stroke={HI}
            strokeWidth="2.6"
            strokeLinecap="round"
            fill="none"
            opacity=".75"
          />
          {/* mouth */}
          <ellipse cx="45" cy="40" rx="33" ry="10.5" fill="#86b79b" {...ink} />
          <ellipse cx="45" cy="40" rx="30" ry="9" fill="#4f7f66" {...ink} strokeOpacity=".5" />
          <g clipPath="url(#tb-clip)">
            {bill && (
              <g transform="translate(45 40) rotate(-14)">
                <rect
                  x="-13"
                  y="-6"
                  width="26"
                  height="11"
                  rx="1.5"
                  fill="#c3d4ad"
                  {...ink}
                  strokeOpacity=".6"
                />
                <circle r="2.6" fill="none" stroke="#7f9a6e" strokeWidth=".8" />
              </g>
            )}
            {TIP_COINS.slice(0, coins).map(([x, y, rot, k], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
                <TipCoin kind={k} drop={bump > 0 && i === coins - 1} />
              </g>
            ))}
          </g>
          {/* twine + kraft tag */}
          <path d="M18 46 q-3 5 -1 10" {...ink} fill="none" />
          <g transform="translate(17 56) rotate(-9)">
            <path d="M-9 0 h14 l5 5 v12 h-19z" fill="#d9c4a3" {...ink} />
            <circle cx="-4.5" cy="4" r="1.1" fill={INK} opacity=".6" />
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
