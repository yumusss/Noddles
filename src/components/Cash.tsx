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
/* Cash register: v3 line art — a big vintage brass-and-cream till.     */
/* Thin ink outline, flat fills, one shadow tone, one highlight.       */
/* ------------------------------------------------------------------ */

const INK = '#2b2420';
const HI = '#fff6e8';
const ink = {
  stroke: INK,
  strokeOpacity: 0.85,
  strokeWidth: 1.15,
  vectorEffect: 'non-scaling-stroke',
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const;

const KEY_ROWS = [
  { y: 70, xs: [46, 60, 74, 88, 102] },
  { y: 81, xs: [44, 59, 74, 89, 104] },
  { y: 92, xs: [42, 58, 74, 90, 106] },
];

export function RegisterDecor({ display, open }: { display: string; open: boolean }) {
  return (
    <div className={`register ${open ? 'open' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 170 140" className="reg-svg">
        <ellipse cx="85" cy="136" rx="70" ry="3.6" fill={INK} opacity=".16" />

        {/* base plinth */}
        <path d="M18 98 q0 -3 3 -3 h128 q3 0 3 3 v36 h-134z" fill="#7b4f2e" {...ink} />
        <path d="M128 95 h21 q3 0 3 3 v36 h-24z" fill="#5f3c22" />
        <rect x="22" y="114" width="126" height="18" rx="2.5" fill={INK} opacity=".45" />

        {/* drawer: tray + face, slides forward when open */}
        <g className="reg-drawer">
          <g className="reg-tray">
            <rect x="24" y="104" width="122" height="28" rx="3" fill="#4a3b31" {...ink} />
            {[0, 1, 2, 3].map((i) => (
              <g key={i} transform={`translate(${29 + i * 21} 107)`}>
                <rect width="18" height="13" rx="1.5" fill={INK} opacity=".3" />
                <rect
                  x="1.5"
                  y="2"
                  width="15"
                  height="9"
                  rx="1"
                  fill={['#d7dfc6', '#cfd8dc', '#e4d2a6', '#e9c9c2'][i]}
                  {...ink}
                  strokeOpacity=".5"
                />
              </g>
            ))}
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(126 ${110 + i * 7})`}>
                <ellipse rx="12" ry="2.8" fill={INK} opacity=".35" />
                <ellipse
                  cx="-3.5"
                  cy="-.6"
                  rx="3.2"
                  ry="1.6"
                  fill="#d9a441"
                  {...ink}
                  strokeOpacity=".5"
                />
                <ellipse
                  cx="2"
                  cy="-1"
                  rx="3.2"
                  ry="1.6"
                  fill="#c9ced6"
                  {...ink}
                  strokeOpacity=".5"
                />
                <ellipse
                  cx="6"
                  cy="-.4"
                  rx="3.2"
                  ry="1.6"
                  fill="#d9a441"
                  {...ink}
                  strokeOpacity=".5"
                />
              </g>
            ))}
          </g>
          <rect x="22" y="115" width="126" height="17" rx="2.5" fill="#8d5d3a" {...ink} />
          <rect x="22" y="115" width="126" height="2.5" fill={HI} opacity=".25" />
          <rect x="74" y="121" width="22" height="5.5" rx="2.75" fill="#d9a441" {...ink} />
          <path d="M34 123.5 h16 M120 123.5 h16" {...ink} strokeOpacity=".35" />
        </g>

        {/* sloped key deck */}
        <path d="M30 60 h110 l12 37 h-134z" fill="#a1764a" {...ink} />
        <path d="M118 60 h22 l12 37 h-30z" fill="#8a6144" />
        <path d="M30 60 h110" stroke={HI} strokeWidth="1.6" opacity=".35" />

        {/* cream keys */}
        {KEY_ROWS.map((row, r) =>
          row.xs.map((x) => (
            <g key={`${r}-${x}`}>
              <circle cx={x} cy={row.y + 1.6} r={4.2 + r * 0.3} fill={INK} opacity=".3" />
              <circle cx={x} cy={row.y} r={4.2 + r * 0.3} fill="#f1e6d2" {...ink} />
              <circle cx={x - 1.3} cy={row.y - 1.3} r={1.1} fill={HI} />
            </g>
          ))
        )}
        <rect x="116" y="66" width="14" height="26" rx="3.5" fill="#c8553d" {...ink} />
        <rect x="118.5" y="68.5" width="4.5" height="7" rx="2.25" fill={HI} opacity=".55" />

        {/* upper housing (brass band + cream) */}
        <path d="M34 62 v-36 q0 -18 18 -18 h60 q18 0 18 18 v36z" fill="#f6efe4" {...ink} />
        <path d="M108 8 h4 q18 0 18 18 v36 h-16 v-36 q0 -14 -6 -18z" fill="#dccfbb" />
        <path d="M34 56 h96" {...ink} strokeOpacity=".3" />
        <path d="M34 26 q0 -18 18 -18 h60 q18 0 18 18 v4 h-96z" fill="#d9a441" {...ink} />
        <path d="M112 8 q18 0 18 18 v4 h-14 v-4 q0 -14 -8 -18z" fill="#b5862f" />
        <path
          d="M44 16 q3 -6 10 -6"
          stroke={HI}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="82" cy="19" r="4" fill="#c8553d" {...ink} />
        {/* display */}
        <rect x="44" y="34" width="76" height="20" rx="3.5" fill="#2b2420" {...ink} />
        <rect x="46" y="36" width="72" height="3" rx="1.5" fill={HI} opacity=".08" />
        <text x="115" y="48.6" textAnchor="end" className="reg-digits">
          {display}
        </text>
        {/* receipt slot + paper */}
        <rect x="66" y="-6" width="32" height="14" rx="1.5" fill={HI} {...ink} />
        <path d="M70 -1 h20 M70 3 h14" {...ink} strokeOpacity=".35" />
        <rect x="62" y="6" width="40" height="4" rx="1.5" fill="#b5862f" {...ink} />

        {/* side crank */}
        <rect x="130" y="34" width="5" height="14" rx="2.5" fill="#b5862f" {...ink} />
        <path
          d="M132 41 h14 v14"
          stroke="#d9a441"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M132 41 h14 v14" {...ink} fill="none" />
        <ellipse cx="146" cy="58" rx="3.6" ry="4.8" fill="#8d5d3a" {...ink} />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tip box: a small wooden saisen-style box with a coin slot, beside   */
/* the register. Coins pile up behind the glass front.                 */
/* ------------------------------------------------------------------ */

const TIP_COINS: ReadonlyArray<readonly [number, number, number, 'g' | 's']> = [
  [22, 64, -8, 'g'],
  [38, 65, 10, 's'],
  [54, 64, 4, 'g'],
  [30, 59, 14, 's'],
  [46, 59, -12, 'g'],
  [24, 54, -4, 's'],
  [40, 53, 8, 'g'],
  [56, 54, -10, 'g'],
  [32, 48, 6, 'g'],
  [48, 48, -4, 's'],
  [26, 43, 12, 's'],
  [42, 42, -6, 'g'],
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
        <svg viewBox="0 0 80 84" className="tj-svg">
          <defs>
            <clipPath id="tb-clip">
              <rect x="14" y="30" width="52" height="40" />
            </clipPath>
          </defs>
          <ellipse cx="40" cy="80" rx="30" ry="3" fill={INK} opacity=".16" />
          {/* box body */}
          <rect x="8" y="24" width="64" height="52" rx="3" fill="#7b4f2e" {...ink} />
          <path d="M60 24 h9 q3 0 3 3 v49 h-12z" fill="#5f3c22" />
          {/* glass front with coins */}
          <rect x="14" y="30" width="52" height="40" rx="2" fill="#d7e3e6" {...ink} />
          <g clipPath="url(#tb-clip)">
            {bill && (
              <g transform="translate(40 60) rotate(-12)">
                <rect
                  x="-14"
                  y="-6"
                  width="28"
                  height="12"
                  rx="1.5"
                  fill="#c3d4ad"
                  {...ink}
                  strokeOpacity=".6"
                />
                <circle r="2.8" fill="none" stroke="#7f9a6e" strokeWidth=".8" />
              </g>
            )}
            {TIP_COINS.slice(0, coins).map(([x, y, rot, k], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
                <TipCoin kind={k} drop={bump > 0 && i === coins - 1} />
              </g>
            ))}
          </g>
          <path
            d="M18 34 v26"
            stroke={HI}
            strokeOpacity=".7"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <rect x="14" y="30" width="52" height="40" rx="2" fill="none" {...ink} />
          {/* lid with slot */}
          <path d="M6 24 q0 -4 4 -4 h60 q4 0 4 4 v3 H6z" fill="#8d5d3a" {...ink} />
          <rect x="4" y="16" width="72" height="6" rx="2" fill="#a1764a" {...ink} />
          <rect x="26" y="17.5" width="28" height="3" rx="1.5" fill={INK} />
          <path
            d="M8 18 h12"
            stroke={HI}
            strokeOpacity=".4"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* kraft label */}
          <rect x="20" y="4" width="40" height="12" rx="2" fill="#d9c4a3" {...ink} />
          <text x="40" y="12.6" textAnchor="middle" className="tj-text">
            bahşiş
          </text>
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
