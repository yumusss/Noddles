// End of day: money in and out, the Yumm rating change, stars and the day chart.

import { useEffect, useState } from 'react';
import { GOAL_RATING } from '../game/data';
import { money, t } from '../game/i18n';
import type { Session } from '../game/session';
import type { DayStat } from '../game/save';
import { sfx } from '../game/audio';
import { Star } from './icons';
import { Stars } from './Tablet';
import DayChart from './DayChart';
import { useLang } from '../App';

export default function Ledger({
  s,
  wallet,
  history,
  ratingBefore,
  ratingAfter,
  onNext,
}: {
  s: Session;
  wallet: number;
  history: (DayStat | null)[];
  ratingBefore: number;
  ratingAfter: number;
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
    ...(l.overpaid ? ([[t('overpaid'), -l.overpaid, 'out']] as [string, number, 'out'][]) : []),
    [t('rent'), -s.day.rent, 'out'],
  ];
  useEffect(() => {
    if (shown > rows.length + 2) return;
    const id = setTimeout(() => {
      setShown((x) => x + 1);
      sfx(shown === rows.length + 1 ? 'star' : 'type');
    }, 230);
    return () => clearTimeout(id);
  }, [shown, rows.length]);
  const diff = ratingAfter - ratingBefore;
  return (
    <div className="screen ledger-screen">
      <div className="ledger">
        <div className="ledger-col">
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
              {l.freebies > 0 && (
                <tr className={(shown > rows.length - 1 ? 'show ' : '') + 'muted'}>
                  <td>{t('freebies')}</td>
                  <td>{money(l.freebies)}</td>
                </tr>
              )}
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
              {t('walkouts')}: <b>{l.walkouts}</b>
            </span>
            <span>
              {t('todayRating')}: <b>{s.dayRating.toFixed(1)}★</b>
            </span>
            <span>
              {t('wallet')}: <b>{money(wallet)}</b>
            </span>
          </div>
        </div>
        <div className="ledger-col">
          <div className={'rating-change' + (ratingAfter >= GOAL_RATING ? ' ok' : '')}>
            <small>{t('rating')}</small>
            <div>
              <b>{ratingBefore.toFixed(1)}</b> → <b className="after">{ratingAfter.toFixed(1)}</b>
              <span className={diff >= 0 ? 'up' : 'down'}>
                {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(2)}
              </span>
            </div>
            <Stars n={ratingAfter} size={18} />
            <small>
              {t('goal')}: {GOAL_RATING.toFixed(1)}★
            </small>
          </div>
          <div className={'ledger-stars' + (shown > rows.length + 1 ? ' show' : '')}>
            {[1, 2, 3].map((k) => (
              <Star key={k} on={k <= s.stars} size={50} />
            ))}
          </div>
          <DayChart history={history} highlight={s.n} compact />
        </div>
        <button className="btn coral big" onClick={onNext}>
          {t('continue')}
        </button>
      </div>
    </div>
  );
}
