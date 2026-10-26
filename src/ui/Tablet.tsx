import { useState } from 'react';
import { BOWLS, INGREDIENTS, unlockedUpTo } from '../game/data';
import type { Review } from '../game/session';
import { drawIngredientIcon, drawBowlIcon } from '../art/food';
import SceneCanvas from './SceneCanvas';
import { L, T } from '../game/i18n';
import { sfx } from '../game/audio';

type AppId = 'home' | 'reviews' | 'orders' | 'pantry';

const CAT_KEY = {
  noodle: 'unlock.noodle',
  broth: 'unlock.broth',
  sauce: 'unlock.sauce',
  topping: 'unlock.topping',
} as const;

/** The counter tablet: shop reviews, delivery orders and an illustrated pantry list. */
export default function Tablet({
  levelId,
  reviews,
  openOrders,
  onClose,
}: {
  levelId: number;
  reviews: Review[];
  openOrders: { who: string; lines: string[]; phone: boolean }[];
  onClose: () => void;
}) {
  const [app, setApp] = useState<AppId>('home');
  const go = (a: AppId) => {
    sfx('tap');
    setApp(a);
  };
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;
  const unlocked = unlockedUpTo(levelId);
  const cats = ['noodle', 'broth', 'sauce', 'topping'] as const;
  const deliveries = reviews.filter((r) => r.delivery);

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="tablet" onClick={(e) => e.stopPropagation()}>
        <div className="tablet-bar">
          {app !== 'home' ? (
            <button className="tablet-back" onClick={() => go('home')}>
              ‹ {T('tab.home')}
            </button>
          ) : (
            <span className="tablet-brand">Noodles</span>
          )}
          <span className="tablet-clock">{T('tab.day', { n: levelId })}</span>
          <button className="tablet-close" onClick={onClose} aria-label="×">
            ✕
          </button>
        </div>
        <div className="tablet-screen">
          {app === 'home' && (
            <div className="tablet-home">
              <button className="tapp reviews" onClick={() => go('reviews')}>
                <i>★</i>
                <strong>{T('tab.reviews')}</strong>
                <small>
                  {reviews.length ? `${avg.toFixed(1)} / 5 · ${reviews.length}` : T('tab.none')}
                </small>
              </button>
              <button className="tapp orders" onClick={() => go('orders')}>
                <i>🛵</i>
                <strong>{T('tab.orders')}</strong>
                <small>
                  {openOrders.filter((o) => o.phone).length
                    ? T('tab.openN', { n: openOrders.filter((o) => o.phone).length })
                    : T('tab.deliveredN', { n: deliveries.length })}
                </small>
              </button>
              <button className="tapp pantry" onClick={() => go('pantry')}>
                <i>🧺</i>
                <strong>{T('tab.pantry')}</strong>
                <small>{T('tab.itemsN', { n: unlocked.length })}</small>
              </button>
            </div>
          )}
          {app === 'reviews' && (
            <div className="tablet-list">
              <div className="tablet-head">
                <h3>{T('tab.reviews')}</h3>
                <span className="big-stars">
                  {[1, 2, 3, 4, 5].map((k) => (
                    <i key={k} className={k <= Math.round(avg) ? '' : 'off'}>
                      ★
                    </i>
                  ))}{' '}
                  <b>{reviews.length ? avg.toFixed(1) : '–'}</b>
                </span>
              </div>
              {reviews.length === 0 && <p className="muted">{T('tab.noReviews')}</p>}
              {[...reviews].reverse().map((r, i) => (
                <div className="review" key={i}>
                  <div className="review-top">
                    <strong>{r.name}</strong>
                    <span className="stars">
                      {[1, 2, 3, 4, 5].map((k) => (
                        <i key={k} className={k <= r.stars ? '' : 'off'}>
                          ★
                        </i>
                      ))}
                    </span>
                    <small>
                      {r.delivery ? '🛵 ' : ''}
                      {T('tab.day', { n: r.day })}
                    </small>
                  </div>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>
          )}
          {app === 'orders' && (
            <div className="tablet-list">
              <div className="tablet-head">
                <h3>{T('tab.orders')}</h3>
              </div>
              <h4>{T('tab.openOrders')}</h4>
              {openOrders.filter((o) => o.phone).length === 0 && (
                <p className="muted">{T('tab.noOpen')}</p>
              )}
              {openOrders
                .filter((o) => o.phone)
                .map((o, i) => (
                  <div className="review open-order" key={i}>
                    <div className="review-top">
                      <strong>🛵 {o.who}</strong>
                      <small>{T('tab.preparing')}</small>
                    </div>
                    <p>{o.lines.join(' · ')}</p>
                  </div>
                ))}
              <h4>{T('tab.pastOrders')}</h4>
              {deliveries.length === 0 && <p className="muted">{T('tab.noPast')}</p>}
              {[...deliveries].reverse().map((r, i) => (
                <div className="review" key={i}>
                  <div className="review-top">
                    <strong>{r.name}</strong>
                    <span className="stars">
                      {[1, 2, 3, 4, 5].map((k) => (
                        <i key={k} className={k <= r.stars ? '' : 'off'}>
                          ★
                        </i>
                      ))}
                    </span>
                    <small>{T('tab.day', { n: r.day })}</small>
                  </div>
                  <p>{r.text}</p>
                </div>
              ))}
            </div>
          )}
          {app === 'pantry' && (
            <div className="tablet-list">
              <div className="tablet-head">
                <h3>{T('tab.pantry')}</h3>
              </div>
              {cats.map((cat) => {
                const ids = unlocked.filter((id) => INGREDIENTS[id].cat === cat);
                if (!ids.length) return null;
                return (
                  <div key={cat}>
                    <h4>{T(CAT_KEY[cat])}</h4>
                    <div className="pantry-grid">
                      {ids.map((id) => (
                        <div className="pantry-item" key={id}>
                          <div className="icon">
                            <SceneCanvas
                              animate={false}
                              draw={(c, W, H) => {
                                c.clearRect(0, 0, W, H);
                                c.save();
                                c.translate(W / 2, H / 2);
                                drawIngredientIcon(c, id, Math.min(W, H) * 0.92);
                                c.restore();
                              }}
                            />
                          </div>
                          <strong>{L(INGREDIENTS[id].name)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              <h4>{T('tab.bowls')}</h4>
              <div className="pantry-grid">
                {BOWLS.filter((b) => b.unlock <= levelId).map((b) => (
                  <div className="pantry-item" key={b.id}>
                    <div className="icon">
                      <SceneCanvas
                        animate={false}
                        draw={(c, W, H) => {
                          c.clearRect(0, 0, W, H);
                          c.save();
                          c.translate(W / 2, H / 2);
                          drawBowlIcon(c, b.id, Math.min(W, H) * 0.92);
                          c.restore();
                        }}
                      />
                    </div>
                    <strong>{L(b.name)}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
