import { useEffect, useState } from 'react';
import type { Level } from '../game/data';
import type { DayResult } from '../game/session';
import { fmt, net } from '../game/money';
import { sfx } from '../game/audio';
import { L, T } from '../game/i18n';

export default function Results({
  level,
  result,
  onRetry,
  onNext,
  onMap,
}: {
  level: Level;
  result: DayResult;
  onRetry: () => void;
  onNext: () => void;
  onMap: () => void;
}) {
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
    [T('res.sales'), l.sales, true],
    [T('res.tips'), l.tips, true],
    [T('res.ingredients'), -l.ingredients, false],
    [T('res.waste'), -l.waste, false],
    [T('res.overChange'), -l.overChange, false],
    [T('res.rent'), -l.rent, false],
    [T('res.utilities'), -l.utilities, false],
  ];
  return (
    <div className="screen results">
      <div className="page ledger">
        <div className="page-head">
          <span className="chip">{T('res.head', { n: level.id })}</span>
          <h2>{L(level.title)}</h2>
        </div>
        <div className="stars-big">
          {[0, 1, 2].map((k) => (
            <i key={k} className={shown >= 9 + k && k < result.stars ? 'on' : 'off'}>
              ★
            </i>
          ))}
        </div>
        <p className="avg">
          {T('res.avg')} <strong>%{Math.round(result.avg)}</strong> ·{' '}
          {T('res.bowls', { n: l.bowls })}
          {result.lost ? ` · ${T('res.lost', { n: result.lost })}` : ''}
          {result.complaints ? ` · ${T('res.complaints', { n: result.complaints })}` : ''} ·{' '}
          {l.changeMistakes ? T('res.changeErr', { n: l.changeMistakes }) : T('res.changeOk')}
        </p>
        <table>
          <tbody>
            {rows.map(([k, v, good], i) => (
              <tr key={k} className={shown > i ? 'in' : ''}>
                <td>{k}</td>
                <td className={v === 0 ? 'muted' : good ? 'good' : 'bad'}>
                  {v === 0 ? '—' : fmt(v)}
                </td>
              </tr>
            ))}
            <tr className={`total ${shown > 7 ? 'in' : ''}`}>
              <td>{T('res.net')}</td>
              <td className={n >= 0 ? 'good' : 'bad'}>{fmt(n)}</td>
            </tr>
            <tr className={`total ${shown > 8 ? 'in' : ''}`}>
              <td>{T('res.cash')}</td>
              <td>
                {fmt(result.cashBefore)} → <strong>{fmt(result.cashAfter)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="modal-row">
          <button className="btn" onClick={onRetry}>
            {T('res.retry')}
          </button>
          {result.stars > 0 ? (
            <button className="btn big primary" onClick={onNext}>
              {T('res.next')}
            </button>
          ) : (
            <button className="btn big primary" onClick={onRetry}>
              {T('res.again')}
            </button>
          )}
          <button className="btn ghost" onClick={onMap}>
            {T('res.map')}
          </button>
        </div>
        {result.stars === 0 && <p className="tip">{T('res.tip')}</p>}
      </div>
    </div>
  );
}
