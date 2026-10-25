import { useEffect, useState } from 'react';
import type { Level } from '../game/data';
import type { DayResult } from '../game/session';
import { fmt, net } from '../game/money';
import { sfx } from '../game/audio';

export default function Results({ level, result, onRetry, onNext, onMap }: { level: Level; result: DayResult; onRetry: () => void; onNext: () => void; onMap: () => void }) {
  const [shown, setShown] = useState(0);
  const l = result.ledger;
  const n = net(l);
  useEffect(() => {
    const id = setInterval(() => {
      setShown((s) => {
        if (s >= 12) {
          clearInterval(id);
          return s;
        }
        if (s === 9 && result.stars > 0) sfx('win');
        else if (s < 9) sfx('tap');
        return s + 1;
      });
    }, 170);
    return () => clearInterval(id);
  }, [result.stars]);
  const rows: [string, number, boolean][] = [
    ['Satışlar', l.sales, true],
    ['Bahşişler', l.tips, true],
    ['Malzeme gideri', -l.ingredients, false],
    ['İsraf', -l.waste, false],
    ['Fazla verilen para üstü', -l.overChange, false],
    ['Kira', -l.rent, false],
    ['Faturalar', -l.utilities, false],
  ];
  return (
    <div className="screen results">
      <div className="page ledger">
        <div className="page-head">
          <span className="chip">{level.id}. Gün · Gün sonu defteri</span>
          <h2>{level.title}</h2>
        </div>
        <div className="stars-big">
          {[0, 1, 2].map((k) => (
            <i key={k} className={shown >= 9 + k && k < result.stars ? 'on' : 'off'}>
              ★
            </i>
          ))}
        </div>
        <p className="avg">
          Ortalama memnuniyet <strong>%{Math.round(result.avg)}</strong> · {l.bowls} kase · {l.changeMistakes ? `${l.changeMistakes} para üstü hatası` : 'para üstleri kusursuz'}
        </p>
        <table>
          <tbody>
            {rows.map(([k, v, good], i) => (
              <tr key={k} className={shown > i ? 'in' : ''}>
                <td>{k}</td>
                <td className={v === 0 ? 'muted' : good ? 'good' : 'bad'}>{v === 0 ? '—' : fmt(v)}</td>
              </tr>
            ))}
            <tr className={`total ${shown > 7 ? 'in' : ''}`}>
              <td>Net kâr</td>
              <td className={n >= 0 ? 'good' : 'bad'}>{fmt(n)}</td>
            </tr>
            <tr className={`total ${shown > 8 ? 'in' : ''}`}>
              <td>Kasadaki para</td>
              <td>
                {fmt(result.cashBefore)} → <strong>{fmt(result.cashAfter)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="modal-row">
          <button className="btn" onClick={onRetry}>
            Tekrar oyna
          </button>
          {result.stars > 0 ? (
            <button className="btn big primary" onClick={onNext}>
              Devam ▸
            </button>
          ) : (
            <button className="btn big primary" onClick={onRetry}>
              Bir daha dene
            </button>
          )}
          <button className="btn ghost" onClick={onMap}>
            Harita
          </button>
        </div>
        {result.stars === 0 && <p className="tip">En az %55 memnuniyet gerekiyor. Siparişi dikkatle oku, göstergeleri izle!</p>}
      </div>
    </div>
  );
}
