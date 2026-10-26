// "Nefis / Yumm": Hazel's review app on the hut tablet. Overall rating, star breakdown,
// what people mention, day-by-day chart, every review with tags — and you can reply.

import { useMemo, useState } from 'react';
import { GOAL_RATING, NAMES_EN, NAMES_TR, SPECIES_NAME, SPEAKERS } from '../game/data';
import { getLang, t, tx, type L } from '../game/i18n';
import { REASON_TAG, linePhrase, type Reason } from '../game/orders';
import { ratingOf, type DayStat, type ReplyKind, type Review } from '../game/save';
import type { Session } from '../game/session';
import { sfx } from '../game/audio';
import { Avatar } from './Avatar';
import DayChart from './DayChart';
import { Star } from './icons';
import { useLang } from '../App';

type Tab = 'summary' | 'reviews' | 'orders' | 'days';
type Filter = 'all' | 'good' | 'bad' | 'open';

export function reviewerName(r: Review) {
  if (r.special) return tx(SPEAKERS[r.special]);
  return (getLang() === 'tr' ? NAMES_TR : NAMES_EN)[((r.nameIdx % 16) + 16) % 16];
}

export function Stars({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${n}/5`}>
      {[1, 2, 3, 4, 5].map((k) => (
        <Star key={k} on={k <= Math.round(n)} size={size} />
      ))}
    </span>
  );
}

export default function Tablet({
  reviews,
  history,
  session,
  onReply,
  onClose,
  startTab = 'summary',
}: {
  reviews: Review[];
  history: (DayStat | null)[];
  session?: Session | null;
  onReply: (id: string, kind: ReplyKind) => void;
  onClose: () => void;
  startTab?: Tab;
}) {
  useLang();
  const [tab, setTab] = useState<Tab>(startTab);
  const [filter, setFilter] = useState<Filter>('all');
  const [replying, setReplying] = useState<string | null>(null);
  const [, force] = useState(0);
  const rating = ratingOf(reviews);
  const counts = [5, 4, 3, 2, 1].map((s) => reviews.filter((r) => r.stars === s).length);
  const maxCount = Math.max(1, ...counts);
  const tagStats = useMemo(() => {
    const bad = new Map<Reason, number>();
    const good = new Map<string, { l: L; n: number }>();
    for (const r of reviews) {
      r.tags.forEach((k) => bad.set(k, (bad.get(k) ?? 0) + 1));
      (r.good ?? []).forEach((g) => {
        const e = good.get(g.en) ?? { l: g, n: 0 };
        e.n++;
        good.set(g.en, e);
      });
    }
    return {
      bad: [...bad.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4),
      good: [...good.values()].sort((a, b) => b.n - a.n).slice(0, 4),
    };
  }, [reviews]);
  const shown = reviews
    .slice()
    .reverse()
    .filter((r) =>
      filter === 'good'
        ? r.stars >= 4
        : filter === 'bad'
          ? r.stars <= 2
          : filter === 'open'
            ? !r.reply && r.day > 0
            : true
    );
  const progress = Math.max(0, Math.min(1, (rating - 1) / (GOAL_RATING - 1)));

  const reply = (r: Review, kind: ReplyKind) => {
    onReply(r.id, kind);
    setReplying(null);
    sfx(kind === 'rude' ? 'fail' : 'pop');
    force((x) => x + 1);
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="tablet-ui" onClick={(e) => e.stopPropagation()}>
        <div className="tablet-cam" />
        <div className="tablet-screen yumm">
          <header className="yumm-top">
            <div className="yumm-logo">
              <Avatar species="fox" seed={1} special="hazel" size={34} />
              <b>{t('app')}</b>
            </div>
            <div className="yumm-place">
              <span>Yuki Sushi</span>
              <small>
                <Stars n={rating} size={13} /> {rating.toFixed(1)} ·{' '}
                {t('reviewsN', { n: reviews.length })}
              </small>
            </div>
            <button className="x" onClick={onClose} aria-label={t('close')}>
              ✕
            </button>
          </header>
          <nav className="yumm-tabs">
            {(
              [
                ['summary', t('appSummary')],
                ['reviews', t('appReviews')],
                ...(session?.day.online || (session == null && false)
                  ? [['orders', t('appOrders')]]
                  : []),
                ['days', t('appDays')],
              ] as [Tab, string][]
            ).map(([k, label]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                {label}
              </button>
            ))}
          </nav>
          <div className="yumm-body">
            {tab === 'summary' && (
              <div className="yumm-summary">
                <section className="big-rating">
                  <div className="num">{rating.toFixed(1)}</div>
                  <Stars n={rating} size={22} />
                  <small>{t('reviewsN', { n: reviews.length })}</small>
                  <div className="goal-bar">
                    <i
                      style={{ width: `${progress * 100}%` }}
                      className={rating >= GOAL_RATING ? 'ok' : ''}
                    />
                    <span>
                      {t('goal')}: {GOAL_RATING.toFixed(1)}★
                    </span>
                  </div>
                </section>
                <section className="histogram">
                  {[5, 4, 3, 2, 1].map((s, i) => (
                    <div key={s} className="hist-row">
                      <span>{s}★</span>
                      <div className="hist-bar">
                        <i
                          style={{ width: `${(counts[i] / maxCount) * 100}%` }}
                          className={'s' + s}
                        />
                      </div>
                      <b>{counts[i]}</b>
                    </div>
                  ))}
                </section>
                <section className="tags-box">
                  <h4>{t('topTags')}</h4>
                  <div className="tag-cloud">
                    {tagStats.good.map((g) => (
                      <span key={g.l.en} className="tag good">
                        {tx(g.l)} ×{g.n}
                      </span>
                    ))}
                    {tagStats.bad.map(([k, n]) => (
                      <span key={k} className="tag bad">
                        {tx(REASON_TAG[k])} ×{n}
                      </span>
                    ))}
                  </div>
                </section>
                <section className="latest">
                  {reviews
                    .slice(-3)
                    .reverse()
                    .map((r) => (
                      <ReviewCard key={r.id} r={r} compact />
                    ))}
                </section>
              </div>
            )}
            {tab === 'reviews' && (
              <>
                <div className="filters">
                  {(
                    [
                      ['all', t('fAll')],
                      ['good', t('fGood')],
                      ['bad', t('fBad')],
                      ['open', t('fOpen')],
                    ] as [Filter, string][]
                  ).map(([k, label]) => (
                    <button
                      key={k}
                      className={filter === k ? 'on' : ''}
                      onClick={() => setFilter(k)}>
                      {label}
                    </button>
                  ))}
                </div>
                {shown.map((r) => (
                  <ReviewCard key={r.id} r={r}>
                    {!r.reply && r.day > 0 && (
                      <div className="reply-zone">
                        {replying === r.id ? (
                          <div className="reply-options">
                            <button onClick={() => reply(r, 'kind')}>{t('replyKind')}</button>
                            <button onClick={() => reply(r, 'thanks')}>{t('replyThanks')}</button>
                            <button className="rude" onClick={() => reply(r, 'rude')}>
                              {t('replyRude')}
                            </button>
                          </div>
                        ) : (
                          <button className="btn small ghost" onClick={() => setReplying(r.id)}>
                            {t('replyBtn')}
                          </button>
                        )}
                      </div>
                    )}
                  </ReviewCard>
                ))}
              </>
            )}
            {tab === 'orders' && session && (
              <div className="orders">
                {session.online.length ? (
                  session.online
                    .slice()
                    .reverse()
                    .map((o) => (
                      <div className="review" key={o.id}>
                        <div className="review-top">
                          <Avatar species={o.species} seed={o.seed} size={40} />
                          <b>{session.nameOf(o)}</b>
                          <span
                            className={
                              'tag ' +
                              (o.status === 'delivered' || o.status === 'packed' ? 'good' : 'warn')
                            }>
                            {o.status === 'delivered' || o.status === 'packed'
                              ? t('delivered')
                              : t('open')}
                          </span>
                        </div>
                        <p>{o.order.lines.map(linePhrase).join(', ')}</p>
                      </div>
                    ))
                ) : (
                  <p className="empty">{t('noOrders')}</p>
                )}
              </div>
            )}
            {tab === 'days' && (
              <div className="days-tab">
                <h4>{t('trend')}</h4>
                <DayChart history={history} highlight={session?.n} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({
  r,
  compact = false,
  children,
}: {
  r: Review;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={'review' + (r.stars <= 2 ? ' low' : r.stars >= 4 ? ' high' : '')}>
      <div className="review-top">
        <Avatar
          species={r.species}
          seed={r.seed}
          special={r.special}
          size={compact ? 36 : 44}
          mood={r.stars >= 4 ? 'happy' : r.stars <= 2 ? 'angry' : 'neutral'}
        />
        <div className="who">
          <b>{reviewerName(r)}</b>
          <small>
            {tx(SPECIES_NAME[r.species])} · {r.day > 0 ? t('day', { n: r.day }) : '—'}
            {r.online ? ' · ' + t('online') : ''}
          </small>
        </div>
        <div className="rate">
          {r.before !== undefined && r.before !== r.stars && <s className="before">{r.before}★</s>}
          <Stars n={r.stars} size={compact ? 13 : 15} />
        </div>
      </div>
      <p>{tx(r.text)}</p>
      {!compact && (r.tags.length > 0 || (r.good?.length ?? 0) > 0) && (
        <div className="tag-cloud">
          {(r.good ?? []).map((g) => (
            <span key={g.en} className="tag good">
              {tx(g)}
            </span>
          ))}
          {r.tags.map((k) => (
            <span key={k} className="tag bad">
              {tx(REASON_TAG[k])}
            </span>
          ))}
        </div>
      )}
      {r.reply && (
        <div className={'owner-reply' + (r.reply === 'rude' ? ' rude' : '')}>
          <b>{t('ownerReply')}</b>
          <p>
            {r.reply === 'kind'
              ? t('replyKind')
              : r.reply === 'thanks'
                ? t('replyThanks')
                : t('replyRude')}
          </p>
          {r.follow && <em>“{tx(r.follow)}”</em>}
        </div>
      )}
      {!compact && <small className="likes">♥ {t('liked', { n: r.likes })}</small>}
      {children}
    </div>
  );
}
