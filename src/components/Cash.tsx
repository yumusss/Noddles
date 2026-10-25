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

/** The cash register sitting on the counter. */
export function RegisterDecor({ display, open }: { display: string; open: boolean }) {
  return (
    <div className={`register ${open ? 'open' : ''}`} aria-hidden="true">
      <div className="reg-screen">
        <span>{display}</span>
      </div>
      <div className="reg-body">
        <div className="reg-keys">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <div className="reg-drawer" />
    </div>
  );
}

export function TipJar({ amount, bump }: { amount: number; bump: number }) {
  const fill = Math.min(1, amount / 6000);
  return (
    <div className="tipjar" aria-hidden="true">
      <div key={bump} className={`tj-glass ${bump ? 'bump' : ''}`}>
        <div className="tj-fill" style={{ height: `${8 + fill * 70}%` }}>
          {Array.from({ length: Math.min(14, Math.ceil(amount / 300)) }, (_, i) => (
            <i
              key={i}
              className={i % 3 === 0 ? 'note' : 'coin'}
              style={{ left: `${(i * 37) % 80}%`, bottom: `${(i * 11) % 70}%` }}
            />
          ))}
        </div>
        <div className="tj-label">BAHŞİŞ</div>
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
