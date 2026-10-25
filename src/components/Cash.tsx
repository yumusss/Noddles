import { useState } from 'react';
import { DENOMS, denomLabel, fmt } from '../money';
import { sfx, buzz } from '../audio';

export function Bill({ v, small = false }: { v: number; small?: boolean }) {
  return (
    <div className={`bill b${v} ${small ? 'sm' : ''}`}>
      <span className="bill-corner tl">{v / 100}</span>
      <span className="bill-seal" />
      <span className="bill-face">
        <i />
      </span>
      <span className="bill-val">{denomLabel(v)}</span>
      <span className="bill-corner br">{v / 100}</span>
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

/** The cash register sitting on the counter: vintage cream enamel, copper keys. */
export function RegisterDecor({ display, open }: { display: string; open: boolean }) {
  return (
    <div className={`register ${open ? 'open' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 120 104" className="reg-svg">
        <defs>
          <linearGradient id="reg-enamel" x1="0" x2="1">
            <stop offset="0" stopColor="#fbf6ec" />
            <stop offset=".55" stopColor="#f1e7d6" />
            <stop offset="1" stopColor="#d9ccb6" />
          </linearGradient>
          <linearGradient id="reg-enamel2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f6efe4" />
            <stop offset="1" stopColor="#dccfb9" />
          </linearGradient>
          <linearGradient id="reg-copper" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#e0a06e" />
            <stop offset="1" stopColor="#a96a3e" />
          </linearGradient>
          <linearGradient id="reg-amber" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#5a3a1c" />
            <stop offset="1" stopColor="#3a2410" />
          </linearGradient>
        </defs>
        {/* drawer (slides out when open) */}
        <g className="reg-drawer">
          <rect x="8" y="74" width="104" height="22" rx="4" fill="url(#reg-enamel2)" />
          <rect x="8" y="74" width="104" height="22" rx="4" fill="#2b242014" />
          <rect x="18" y="80" width="84" height="10" rx="2" fill="#7b4f2e" opacity=".55" />
          <rect x="52" y="82" width="16" height="3" rx="1.5" fill="url(#reg-copper)" />
        </g>
        {/* body */}
        <path d="M10 50 q0 -10 10 -10 h80 q10 0 10 10 v28 h-100z" fill="url(#reg-enamel)" />
        <path d="M10 70 h100 v8 h-100z" fill="#2b24200f" />
        {/* rounded top with display */}
        <path d="M22 44 v-20 q0 -12 12 -12 h52 q12 0 12 12 v20z" fill="url(#reg-enamel)" />
        <path d="M22 44 v-20 q0 -12 12 -12 h8 q-12 0 -12 12 v20z" fill="#ffffff" opacity=".5" />
        <rect x="31" y="18" width="58" height="18" rx="4" fill="url(#reg-amber)" />
        <text x="84" y="31.5" textAnchor="end" className="reg-digits">
          {display}
        </text>
        {/* keys: three rows of copper buttons */}
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3, 4].map((c) => (
            <circle
              key={`${r}${c}`}
              cx={36 + c * 12}
              cy={52 + r * 8}
              r="2.9"
              fill="url(#reg-copper)"
            />
          ))
        )}
        <rect x="94" y="49" width="10" height="22" rx="3" fill="#c8553d" />
        <rect x="94" y="49" width="10" height="4" rx="2" fill="#e2745a" />
        {/* thin drawer line + brass plaque */}
        <path d="M10 73 h100" stroke="#2b242022" strokeWidth="1" />
        <rect x="46" y="9" width="28" height="4" rx="2" fill="url(#reg-copper)" />
        {/* soft shadow under the whole unit */}
        <ellipse cx="60" cy="99" rx="54" ry="3" fill="#2b242026" />
      </svg>
    </div>
  );
}

const TIP_COINS = [
  [20, 86, -14],
  [40, 88, 8],
  [58, 85, -6],
  [30, 78, 20],
  [50, 79, -18],
  [22, 70, 4],
  [44, 71, 14],
  [60, 72, -10],
  [34, 62, -22],
  [52, 63, 6],
  [26, 54, 12],
  [46, 55, -8],
  [38, 46, 18],
  [56, 47, -4],
] as const;

export function TipJar({ amount, bump }: { amount: number; bump: number }) {
  const coins = Math.min(TIP_COINS.length, Math.ceil(amount / 250));
  return (
    <div className="tipjar" aria-hidden="true">
      <div key={bump} className={`tj-glass ${bump ? 'bump' : ''}`}>
        <svg viewBox="0 0 80 104" className="tj-svg">
          <defs>
            <linearGradient id="tj-glass-g" x1="0" x2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
              <stop offset=".3" stopColor="#ffffff" stopOpacity=".1" />
              <stop offset=".75" stopColor="#ffffff" stopOpacity=".08" />
              <stop offset="1" stopColor="#ffffff" stopOpacity=".45" />
            </linearGradient>
            <radialGradient id="tj-coin" cx=".35" cy=".35" r=".8">
              <stop offset="0" stopColor="#f6d98a" />
              <stop offset=".6" stopColor="#d9a441" />
              <stop offset="1" stopColor="#a67a2a" />
            </radialGradient>
            <clipPath id="tj-clip">
              <path d="M12 26 q-4 6 -4 14 v46 q0 12 12 12 h40 q12 0 12 -12 v-46 q0 -8 -4 -14z" />
            </clipPath>
          </defs>
          <ellipse cx="40" cy="100" rx="30" ry="3" fill="#2b242026" />
          {/* tinted glass body */}
          <path
            d="M12 26 q-4 6 -4 14 v46 q0 12 12 12 h40 q12 0 12 -12 v-46 q0 -8 -4 -14z"
            fill="#dfe9ea"
            opacity=".35"
          />
          {/* coins */}
          <g clipPath="url(#tj-clip)">
            {TIP_COINS.slice(0, coins).map(([x, y, rot], i) => (
              <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
                <ellipse rx="9" ry="4" fill="#a67a2a" />
                <ellipse cy="-1.5" rx="9" ry="4" fill="url(#tj-coin)" />
                <ellipse
                  cy="-1.5"
                  rx="5"
                  ry="2"
                  fill="none"
                  stroke="#fff6e8"
                  strokeWidth=".8"
                  opacity=".6"
                />
              </g>
            ))}
          </g>
          {/* kraft label */}
          <rect x="18" y="48" width="44" height="22" rx="3" fill="#d9c4a3" />
          <rect x="18" y="48" width="44" height="22" rx="3" fill="url(#tj-glass-g)" opacity=".3" />
          <text x="40" y="63" textAnchor="middle" className="tj-text">
            bahşiş
          </text>
          {/* glass highlights + lid */}
          <path
            d="M12 26 q-4 6 -4 14 v46 q0 12 12 12 h40 q12 0 12 -12 v-46 q0 -8 -4 -14z"
            fill="url(#tj-glass-g)"
          />
          <path
            d="M16 40 v42 q0 6 6 6"
            stroke="#ffffff"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
            opacity=".8"
          />
          <path
            d="M64 44 v30"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity=".5"
          />
          <rect x="10" y="18" width="60" height="10" rx="3" fill="#e4d2b4" />
          <rect x="10" y="18" width="60" height="4" rx="2" fill="#f1e4cc" />
          <rect x="10" y="26" width="60" height="3" fill="#b89c72" opacity=".6" />
        </svg>
      </div>
      <div className="tj-amount">{fmt(amount)}</div>
    </div>
  );
}

/** Make change: the player picks bills and coins from the open drawer. */
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
