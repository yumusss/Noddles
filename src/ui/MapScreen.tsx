// The ten days as an advent-style row of cards along the harbor, plus the Yumm rating
// and the day chart.

import { useState } from 'react';
import { DAYS, GOAL_RATING, type DecorSlot } from '../game/data';
import { money, t, tx } from '../game/i18n';
import { ratingOf, type ReplyKind, type Save } from '../game/save';
import { sfx } from '../game/audio';
import Backdrop from './Backdrop';
import DayChart from './DayChart';
import Tablet, { Stars } from './Tablet';
import { Lock, Star } from './icons';
import { LangToggle } from './PauseMenu';
import { useLang } from '../App';

const TIME_ICON: Record<string, string> = {
  morning: '#f6c77a',
  noon: '#8cc5e6',
  sunset: '#f0a98e',
  evening: '#2a3466',
};

export default function MapScreen({
  save,
  onDay,
  onDecor,
  onTitle,
  onReply,
}: {
  save: Save;
  onDay: (n: number) => void;
  onDecor: () => void;
  onTitle: () => void;
  onReply: (id: string, kind: ReplyKind) => void;
}) {
  const lang = useLang();
  const [tablet, setTablet] = useState(false);
  const rating = ratingOf(save.reviews);
  const daysLeft = Math.max(0, 10 - save.unlocked);
  return (
    <div className="screen map">
      <Backdrop time="morning" snow="light" decor={save.equipped as Record<DecorSlot, string>} />
      <div className="map-veil" />
      <header className="map-head">
        <button className="btn ghost small" onClick={onTitle}>
          ←
        </button>
        <button
          className={'rating-card' + (rating >= GOAL_RATING ? ' ok' : '')}
          onClick={() => setTablet(true)}>
          <span className="yumm-dot">N</span>
          <div>
            <small>{t('rating')}</small>
            <b>{rating.toFixed(1)}</b> <Stars n={rating} size={14} />
          </div>
          <div className="goal-mini">
            <small>
              {t('goal')} {GOAL_RATING.toFixed(1)}★ · {t('daysLeft', { n: daysLeft })}
            </small>
            <i>
              <b
                style={{
                  width: `${Math.max(0, Math.min(1, (rating - 1) / (GOAL_RATING - 1))) * 100}%`,
                }}
              />
            </i>
          </div>
        </button>
        <span className="pill">
          {t('wallet')}: {money(save.wallet)}
        </span>
        <div className="map-tools">
          <button className="btn small" onClick={onDecor}>
            {t('decor')}
          </button>
          <LangToggle lang={lang} />
        </div>
      </header>
      <div className="map-scroll">
        <div className="day-cards">
          {DAYS.map((d) => {
            const open = d.n <= save.unlocked;
            const today = d.n === save.unlocked;
            const h = save.history[d.n];
            return (
              <button
                key={d.n}
                className={
                  'day-card' +
                  (open ? ' open' : '') +
                  (today ? ' today' : '') +
                  (d.n === 10 ? ' finale' : '')
                }
                disabled={!open}
                onClick={() => {
                  sfx('tap');
                  onDay(d.n);
                }}>
                <div className="dc-top" style={{ background: TIME_ICON[d.time] }}>
                  <span className="dc-n">{d.n}</span>
                  {d.snow !== 'none' && <span className={'dc-snow ' + d.snow} />}
                </div>
                <div className="dc-body">
                  <b>{open ? tx(d.title) : t('locked')}</b>
                  <small>{open ? tx(d.news) : ''}</small>
                  {!open && <Lock />}
                  <div className="dc-stars">
                    {[1, 2, 3].map((k) => (
                      <Star key={k} on={save.stars[d.n] >= k} size={15} />
                    ))}
                  </div>
                  {h && (
                    <small className="dc-res">
                      {money(h.net)} · {h.dayRating.toFixed(1)}★
                    </small>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <section className="chart-card">
          <h3>{t('chart')}</h3>
          <DayChart history={save.history} highlight={save.unlocked} />
        </section>
      </div>
      {tablet && (
        <Tablet
          reviews={save.reviews}
          history={save.history}
          onReply={onReply}
          onClose={() => setTablet(false)}
        />
      )}
    </div>
  );
}
