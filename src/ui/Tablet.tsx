// The shop tablet: reviews, delivery orders, ingredient list. The game pauses while it's open.

import { useState } from 'react';
import { ING } from '../game/data';
import { t, tx } from '../game/i18n';
import { linePhrase } from '../game/orders';
import type { Session } from '../game/session';
import type { Save } from '../game/save';
import MiniArt from './MiniArt';
import { Star } from './icons';
import { useLang } from '../App';

export default function Tablet({
  s,
  save,
  onClose,
}: {
  s: Session;
  save: Save;
  onClose: () => void;
}) {
  useLang();
  const [tab, setTab] = useState<'reviews' | 'orders' | 'ings'>('reviews');
  const reviews = [...save.reviews, ...s.reviews].slice(-40).reverse();
  return (
    <div className="modal" onClick={onClose}>
      <div className="tablet-ui" onClick={(e) => e.stopPropagation()}>
        <div className="tablet-cam" />
        <div className="tablet-screen">
          <nav>
            {(
              [
                ['reviews', t('tReviews')],
                ['orders', t('tOrders')],
                ['ings', t('tIngredients')],
              ] as const
            ).map(([k, label]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
            <button className="x" onClick={onClose} aria-label={t('close')}>
              ✕
            </button>
          </nav>
          <div className="tablet-body">
            {tab === 'reviews' &&
              (reviews.length ? (
                reviews.map((r, i) => (
                  <div className="review" key={i}>
                    <div className="review-top">
                      <b>{s.name(r)}</b>
                      <span className="stars">
                        {[1, 2, 3, 4, 5].map((k) => (
                          <Star key={k} on={k <= r.stars} size={16} />
                        ))}
                      </span>
                    </div>
                    <p>{tx(r.text)}</p>
                    <small>
                      {t('day', { n: r.day })}
                      {r.online ? ' · ' + t('online') : ''}
                    </small>
                  </div>
                ))
              ) : (
                <p className="empty">{t('tNoReviews')}</p>
              ))}
            {tab === 'orders' &&
              (s.online.length ? (
                s.online
                  .slice()
                  .reverse()
                  .map((o) => (
                    <div className="review" key={o.id}>
                      <div className="review-top">
                        <b>{s.name(o)}</b>
                        <span className={'tag ' + (o.status === 'delivered' ? 'done' : 'open')}>
                          {o.status === 'delivered' ? t('tDelivered') : t('tOpen')}
                        </span>
                      </div>
                      <p>{o.order.lines.map(linePhrase).join(', ')}</p>
                    </div>
                  ))
              ) : (
                <p className="empty">{t('tNoOrders')}</p>
              ))}
            {tab === 'ings' && (
              <div className="ing-grid">
                {[...s.have].map((i) => (
                  <div className="ing-card" key={i}>
                    <MiniArt kind={{ k: 'ing', ing: i }} size={64} />
                    <span>{tx(ING[i].name)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
