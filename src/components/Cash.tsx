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

/** A vintage mint-and-brass cash register sitting on the counter. */
export function RegisterDecor({ display, open }: { display: string; open: boolean }) {
  return (
    <div className={`register2 ${open ? 'open' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 160 150">
        <defs>
          <linearGradient id="reg-body" x1="0" x2="1">
            <stop offset="0" stopColor="#8fbfae" />
            <stop offset=".45" stopColor="#b9dccd" />
            <stop offset="1" stopColor="#7aa996" />
          </linearGradient>
          <linearGradient id="reg-brass" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f3d58b" />
            <stop offset="1" stopColor="#b88a3a" />
          </linearGradient>
          <linearGradient id="reg-wood" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#b98d63" />
            <stop offset="1" stopColor="#7d5434" />
          </linearGradient>
        </defs>
        <ellipse cx="80" cy="146" rx="70" ry="4" fill="#3a2414" opacity=".25" />
        {/* drawer */}
        <g className="reg-drawer2">
          <rect x="14" y="118" width="132" height="26" rx="4" fill="url(#reg-wood)" />
          <rect x="66" y="126" width="28" height="6" rx="3" fill="url(#reg-brass)" />
        </g>
        {/* body */}
        <path d="M22 120 L30 62 Q32 54 40 54 H120 Q128 54 130 62 L138 120z" fill="url(#reg-body)" />
        <path
          d="M30 62 Q32 54 40 54 H120 Q128 54 130 62"
          stroke="url(#reg-brass)"
          strokeWidth="4"
          fill="none"
        />
        <rect x="22" y="114" width="116" height="7" rx="2" fill="url(#reg-brass)" />
        {/* keys */}
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3, 4].map((k) => (
            <g key={`${r}-${k}`}>
              <circle cx={46 + k * 17 + r * 2} cy={72 + r * 14} r="5.6" fill="#5e7f72" />
              <circle
                cx={46 + k * 17 + r * 2}
                cy={71 + r * 14}
                r="5"
                fill={r === 2 && k === 4 ? '#e8a27a' : '#fbf4e4'}
              />
            </g>
          ))
        )}
        {/* crank */}
        <path
          d="M138 90 h12 v-18"
          stroke="url(#reg-brass)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="150" cy="70" r="5" fill="#e8a27a" />
        {/* display tower */}
        <path d="M44 54 L48 16 Q50 10 56 10 H104 Q110 10 112 16 L116 54z" fill="url(#reg-body)" />
        <rect
          x="52"
          y="18"
          width="56"
          height="26"
          rx="5"
          fill="#fbf4e4"
          stroke="url(#reg-brass)"
          strokeWidth="3"
        />
        <text
          x="80"
          y="37"
          textAnchor="middle"
          fontSize="15"
          fontWeight="800"
          fill="#3a2414"
          fontFamily="ui-monospace, Menlo, monospace">
          {display}
        </text>
        <rect x="70" y="2" width="20" height="10" rx="3" fill="url(#reg-brass)" />
      </svg>
    </div>
  );
}

/** A glass mason jar with a cork lid and a kraft tag: the tips jar. */
export function TipJar({ amount, bump }: { amount: number; bump: number }) {
  const fill = Math.min(1, amount / 5000);
  const n = Math.min(18, Math.ceil(amount / 250));
  return (
    <div className="tipjar2" aria-hidden="true">
      <svg viewBox="0 0 100 130" key={bump} className={bump ? 'bump' : ''}>
        <defs>
          <linearGradient id="jar-glass" x1="0" x2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
            <stop offset=".25" stopColor="#ffffff" stopOpacity=".12" />
            <stop offset=".7" stopColor="#ffffff" stopOpacity=".08" />
            <stop offset="1" stopColor="#ffffff" stopOpacity=".4" />
          </linearGradient>
          <clipPath id="jar-in">
            <path d="M18 34 Q14 40 14 50 V112 Q14 122 26 122 H74 Q86 122 86 112 V50 Q86 40 82 34z" />
          </clipPath>
        </defs>
        <ellipse cx="50" cy="126" rx="38" ry="4" fill="#3a2414" opacity=".25" />
        <g clipPath="url(#jar-in)">
          <rect
            x="0"
            y={122 - fill * 80 - 6}
            width="100"
            height="100"
            fill="#e9dcc4"
            opacity=".35"
          />
          {Array.from({ length: n }, (_, i) => {
            const x = 22 + ((i * 37) % 56);
            const y = 116 - Math.floor(i / 4) * 9 - (i % 2) * 3;
            return i % 3 === 0 ? (
              <rect
                key={i}
                x={x - 9}
                y={y - 5}
                width="20"
                height="10"
                rx="1.5"
                fill="#a9c79a"
                stroke="#7d9a70"
                strokeWidth="1"
                transform={`rotate(${((i * 29) % 40) - 20} ${x} ${y})`}
              />
            ) : (
              <g key={i}>
                <ellipse cx={x} cy={y} rx="7" ry="3.4" fill="#d9b25a" />
                <ellipse cx={x} cy={y - 1} rx="7" ry="3.4" fill="#f2d27c" />
              </g>
            );
          })}
        </g>
        <path
          d="M18 34 Q14 40 14 50 V112 Q14 122 26 122 H74 Q86 122 86 112 V50 Q86 40 82 34z"
          fill="url(#jar-glass)"
          stroke="#ffffff"
          strokeOpacity=".7"
          strokeWidth="2"
        />
        <path
          d="M22 50 V108"
          stroke="#fff"
          strokeOpacity=".7"
          strokeWidth="4"
          strokeLinecap="round"
        />
        {/* neck + cork */}
        <rect
          x="20"
          y="26"
          width="60"
          height="10"
          rx="3"
          fill="#ffffff"
          fillOpacity=".35"
          stroke="#fff"
          strokeOpacity=".6"
        />
        <rect x="24" y="12" width="52" height="16" rx="4" fill="#c9a06a" />
        <path
          d="M28 16 h4 M40 20 h4 M54 15 h4 M64 21 h4"
          stroke="#a77b52"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* twine + tag */}
        <path d="M20 33 Q50 38 80 33" stroke="#b98d63" strokeWidth="2" fill="none" />
        <path d="M62 36 L66 54" stroke="#b98d63" strokeWidth="1.6" />
        <g transform="rotate(8 70 66)">
          <path
            d="M56 54 h26 v22 h-26 l-6 -11z"
            fill="#e8d2ad"
            stroke="#c8a77d"
            strokeWidth="1.2"
          />
          <circle cx="56" cy="65" r="1.6" fill="#b98d63" />
          <text
            x="69"
            y="63"
            textAnchor="middle"
            fontSize="8"
            fontWeight="900"
            fill="#6b4a36"
            fontFamily="Nunito, sans-serif">
            TIPS
          </text>
          <text x="69" y="72" textAnchor="middle" fontSize="8" fill="#c96a5a">
            ♡
          </text>
        </g>
      </svg>
      <div className="tj-amount2">{fmt(amount)}</div>
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
