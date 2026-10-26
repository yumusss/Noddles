// End-of-day ledger: money in and out, satisfaction, complaints, stars.

import { useEffect, useState } from 'react';
import { money, t } from '../game/i18n';
import type { Session } from '../game/session';
import { sfx } from '../game/audio';
import { Star } from './icons';
import { useLang } from '../App';

export default function Ledger({
  s,
  wallet,
  onNext,
}: {
  s: Session;
  wallet: number;
  onNext: () => void;
}) {
  useLang();
  const l = s.ledger;
  const [shown, setShown] = useState(0);
  const rows: [string, number, 'in' | 'out'][] = [
    [t('sales'), l.sales, 'in'],
    [t('tips'), l.tips, 'in'],
    ...(l.bonus ? ([[t('bonus'), l.bonus, 'in']] as [string, number, 'in'][]) : []),
    [t('ingredients'), -l.ing, 'out'],
    [t('waste'), -l.waste, 'out'],
    [t('overpaid'), -l.overpaid, 'out'],
    [t('rent'), -s.day.rent, 'out'],
    [t('bills'), -s.day.bills, 'out'],
  ];
  useEffect(() => {
    if (shown > rows.length + 2) return;
    const id = setTimeout(() => {
      setShown((x) => x + 1);
      sfx(shown === rows.length + 1 ? 'star' : 'type');
    }, 260);
    return () => clearTimeout(id);
  }, [shown, rows.length]);
  return (
    <div className="screen ledger-screen">
      <div className="ledger">
        <div className="ledger-binding" />
        <h2>{t('ledger')}</h2>
        <small>{t('day', { n: s.n })}</small>
        <table>
          <tbody>
            {rows.map(([k, v, kind], i) => (
              <tr key={k} className={(i < shown ? 'show ' : '') + kind}>
                <td>{k}</td>
                <td>{money(v)}</td>
              </tr>
            ))}
            <tr className={'total' + (shown > rows.length ? ' show' : '')}>
              <td>{t('net')}</td>
              <td className={s.net >= 0 ? 'pos' : 'neg'}>{money(s.net)}</td>
            </tr>
          </tbody>
        </table>
        <div className="ledger-stats">
          <span>
            {t('served')}: <b>{l.served}</b>
          </span>
          <span>
            {t('satisfaction')}: <b>%{s.avgSat}</b>
          </span>
          <span>
            {t('complaints')}: <b>{l.complaints}</b>
          </span>
          <span>
            {t('walkouts')}: <b>{l.walkouts}</b>
          </span>
        </div>
        <div className={'ledger-stars' + (shown > rows.length + 1 ? ' show' : '')}>
          {[1, 2, 3].map((k) => (
            <Star key={k} on={k <= s.stars} size={52} />
          ))}
        </div>
        <div className="ledger-wallet">
          {t('wallet')}: <b>{money(wallet)}</b>
        </div>
        <button className="btn coral big" onClick={onNext}>
          {t('continue')}
        </button>
      </div>
    </div>
  );
}
