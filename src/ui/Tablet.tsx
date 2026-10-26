import { useRef, useState, type ReactNode } from 'react';
import { BOWLS, CHARS, INGREDIENTS, LEVELS, unlockedUpTo } from '../game/data';
import type { Review } from '../game/session';
import { drawIngredientIcon, drawBowlIcon } from '../art/food';
import { drawCat, type CatPose } from '../art/cat';
import { circle, ellipse, roundRect, softShadow, vGrad, type Tod } from '../art/common';
import SceneCanvas from './SceneCanvas';
import { L, T } from '../game/i18n';
import { fmt } from '../game/money';
import { sfx } from '../game/audio';
import { CHAT, RECIPE_TIPS, TT, tl, type ChatWho, type TKey } from './tablet-i18n';
import './tablet.css';

/** Today's numbers for the register app (all optional — the tablet works without them). */
export interface TabletStats {
  earned: number;
  sales: number;
  tips: number;
  bowls: number;
  scores: number[];
  lost: number;
  complaints: number;
  jar: number;
}

type AppId =
  | 'home'
  | 'reviews'
  | 'orders'
  | 'pantry'
  | 'cash'
  | 'cam'
  | 'weather'
  | 'chat'
  | 'stars'
  | 'recipe'
  | 'music';
type Icon = Exclude<AppId, 'home'>;

const CAT_KEY = {
  noodle: 'unlock.noodle',
  broth: 'unlock.broth',
  sauce: 'unlock.sauce',
  topping: 'unlock.topping',
} as const;

const APP_NAME: Record<Icon, TKey> = {
  reviews: 'app.reviews',
  orders: 'app.orders',
  pantry: 'app.pantry',
  cash: 'app.cash',
  cam: 'app.cam',
  weather: 'app.weather',
  chat: 'app.chat',
  stars: 'app.stars',
  recipe: 'app.recipe',
  music: 'app.music',
};

const GRID: Icon[] = ['cash', 'weather', 'cam', 'stars', 'recipe', 'pantry'];
const DOCK: Icon[] = ['reviews', 'orders', 'chat', 'music'];

/* ------------------------------------------------------------------ helpers */

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Pastel avatar colours derived from a name. */
function avatarStyle(name: string) {
  const h = hashStr(name) % 360;
  return {
    background: `linear-gradient(150deg, hsl(${h} 80% 88%), hsl(${(h + 25) % 360} 62% 76%))`,
    color: `hsl(${h} 42% 30%)`,
  };
}

function initials(name: string) {
  const parts = name
    .replace(/[^\p{L}\s]/gu, '')
    .trim()
    .split(/\s+/);
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? (parts[1]?.[0] ?? '') : '')).toUpperCase();
}

const STAR_PATH =
  'M12 2.8c.3 0 .6.2.7.5l2.4 4.9 5.4.8c.7.1 1 .9.5 1.4l-3.9 3.8.9 5.4c.1.7-.6 1.2-1.2.9L12 18l-4.8 2.5c-.6.3-1.3-.2-1.2-.9l.9-5.4L3 10.4c-.5-.5-.2-1.3.5-1.4l5.4-.8 2.4-4.9c.1-.3.4-.5.7-.5z';

/** Five stars; `value` may be fractional (the gold row is clipped). */
function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const row = (cls: string) => (
    <span className={cls}>
      {[0, 1, 2, 3, 4].map((k) => (
        <svg key={k} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
  return (
    <span className="tstars" role="img" aria-label={`${value.toFixed(1)} / 5`}>
      {row('tstars-off')}
      <span
        className="tstars-on"
        style={{ width: `${(Math.max(0, Math.min(5, value)) / 5) * 100}%` }}>
        {row('')}
      </span>
    </span>
  );
}

function AppIconGlyph({ id }: { id: Icon }) {
  const w = '#fff';
  const s = {
    fill: 'none',
    stroke: w,
    strokeWidth: 3.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  let g: ReactNode = null;
  switch (id) {
    case 'reviews':
      g = (
        <>
          <path
            d="M24 7.5l5 10.4 11.3 1.6-8.2 8 2 11.3L24 33.4l-10.1 5.4 2-11.3-8.2-8 11.3-1.6z"
            fill={w}
            stroke={w}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <circle cx="20" cy="21" r="2.2" fill="rgba(240,160,40,.55)" />
        </>
      );
      break;
    case 'orders':
      g = (
        <>
          <rect x="7" y="12" width="15" height="13" rx="3" fill={w} />
          <path
            d="M11 18.5h7"
            stroke="rgba(30,120,110,.45)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path {...s} d="M9 29.5h17l4.5-14H36M33 15.5l3.5 14" />
          <circle cx="13" cy="34.5" r="5" {...s} />
          <circle cx="36" cy="34.5" r="5" {...s} />
        </>
      );
      break;
    case 'pantry':
      g = (
        <>
          <path {...s} d="M15.5 22c0-7 3.8-11.5 8.5-11.5S32.5 15 32.5 22" />
          <path d="M8 21.5h32l-3.6 15.6a3 3 0 0 1-2.9 2.4H14.5a3 3 0 0 1-2.9-2.4z" fill={w} />
          <path
            d="M18 26.5v8M24 26.5v8M30 26.5v8"
            stroke="rgba(150,95,40,.4)"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      );
      break;
    case 'cash':
      g = (
        <>
          <rect x="6" y="12" width="29" height="18" rx="3.5" fill="rgba(255,255,255,.75)" />
          <circle cx="20.5" cy="21" r="4.2" fill="rgba(40,130,95,.35)" />
          <circle cx="33" cy="31" r="9.5" fill={w} />
          <circle cx="33" cy="31" r="6.4" fill="none" stroke="rgba(40,130,95,.4)" strokeWidth="2" />
        </>
      );
      break;
    case 'cam':
      g = (
        <>
          <path
            d="M11 19l2.6-8.5 6.4 6.8zM37 19l-2.6-8.5-6.4 6.8z"
            fill={w}
            strokeLinejoin="round"
          />
          <rect x="7" y="16" width="34" height="23" rx="8" fill={w} />
          <circle cx="24" cy="27.5" r="7.2" fill="#8a5a36" />
          <circle cx="24" cy="27.5" r="4.4" fill="#3f2b20" />
          <circle cx="26" cy="25.4" r="1.7" fill="#fff" />
          <circle cx="35" cy="21" r="1.6" fill="#ef8a76" />
        </>
      );
      break;
    case 'weather':
      g = (
        <>
          <circle cx="18" cy="18" r="8" fill="#ffe27a" />
          <path
            d="M14 38h20.5a7.5 7.5 0 0 0 .4-15A9.5 9.5 0 0 0 16.6 25 6.6 6.6 0 0 0 14 38z"
            fill={w}
          />
        </>
      );
      break;
    case 'chat':
      g = (
        <>
          <path
            d="M11 10.5h26a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5H23l-8.5 6.5v-6.5H11a5 5 0 0 1-5-5v-13a5 5 0 0 1 5-5z"
            fill={w}
          />
          <circle cx="16.5" cy="22" r="2.4" fill="rgba(120,95,190,.55)" />
          <circle cx="24" cy="22" r="2.4" fill="rgba(120,95,190,.55)" />
          <circle cx="31.5" cy="22" r="2.4" fill="rgba(120,95,190,.55)" />
        </>
      );
      break;
    case 'stars':
      g = (
        <>
          {(
            [
              [12, 27, 0.55],
              [24, 20, 0.85],
              [36, 27, 0.55],
            ] as const
          ).map(([x, y, k], i) => (
            <path
              key={i}
              d={STAR_PATH}
              transform={`translate(${x - 12 * k * 1.25} ${y - 12 * k * 1.25}) scale(${k * 1.25})`}
              fill="#ffd66b"
              stroke="#fff3cf"
              strokeWidth={1.6 / k}
            />
          ))}
          <path {...s} strokeWidth={2.6} d="M14 40h20" opacity={0.7} />
        </>
      );
      break;
    case 'recipe':
      g = (
        <>
          <path
            d="M7 13c6.5-2.4 12-1.6 17 2 5-3.6 10.5-4.4 17-2v24c-6.5-2.4-12-1.6-17 2-5-3.6-10.5-4.4-17-2z"
            fill={w}
          />
          <path d="M24 15v24" stroke="rgba(200,90,120,.45)" strokeWidth="2" />
          <path
            d="M11.5 20c3-.8 6-.6 8.5.6M11.5 26c3-.8 6-.6 8.5.6M28 20.6c2.5-1.2 5.5-1.4 8.5-.6"
            stroke="rgba(200,90,120,.4)"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        </>
      );
      break;
    case 'music':
      g = (
        <>
          <path {...s} d="M19 34V14.5l17-4.5v19" />
          <path d="M19 14.5l17-4.5v5.5L19 20z" fill={w} />
          <ellipse cx="14.5" cy="34" rx="5.5" ry="4.6" fill={w} />
          <ellipse cx="31.5" cy="29.5" rx="5.5" ry="4.6" fill={w} />
        </>
      );
      break;
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      {g}
    </svg>
  );
}

function AppIcon({
  id,
  onOpen,
  badge,
  label = true,
  off,
}: {
  id: Icon;
  onOpen: (a: Icon) => void;
  badge?: number;
  label?: boolean;
  off?: boolean;
}) {
  return (
    <button
      className={`tico ${off ? 'is-off' : ''}`}
      onClick={() => onOpen(id)}
      aria-label={TT(APP_NAME[id])}>
      <span className={`tico-tile t-${id}`}>
        <AppIconGlyph id={id} />
        {badge ? <b className="tico-badge">{badge > 9 ? '9+' : badge}</b> : null}
      </span>
      {label && <span className="tico-label">{TT(APP_NAME[id])}</span>}
    </button>
  );
}

/* ------------------------------------------------------------------ main */

/** The counter tablet: a little iPad-style home screen with shop apps. */
export default function Tablet({
  levelId,
  reviews,
  openOrders,
  stats,
  stars,
  music,
  onToggleMusic,
  onClose,
}: {
  levelId: number;
  reviews: Review[];
  openOrders: { who: string; lines: string[]; phone: boolean }[];
  stats?: TabletStats;
  stars?: number[];
  music?: boolean;
  onToggleMusic?: () => void;
  onClose: () => void;
}) {
  const [app, setApp] = useState<AppId>('home');
  const [seenChat, setSeenChat] = useState(false);
  const go = (a: AppId) => {
    sfx('tap');
    if (a === 'chat') setSeenChat(true);
    setApp(a);
  };
  const level = LEVELS[levelId - 1] ?? LEVELS[0];
  const phoneOrders = openOrders.filter((o) => o.phone);
  const todayReviews = reviews.filter((r) => r.day === levelId).length;
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.stars, 0) / reviews.length : 0;
  const contacts = CHAT.filter((c) => c.from <= levelId);

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="tablet2" onClick={(e) => e.stopPropagation()}>
        <div className="tablet2-screen">
          <div className={`tstatus ${app === 'home' && level.time === 'aksam' ? 'dark' : ''}`}>
            <span>{T('tab.day', { n: levelId })}</span>
            <span className="tstatus-mid">Noodles</span>
            <span className="tstatus-right">
              <svg viewBox="0 0 20 14" aria-hidden>
                <path d="M1 5a13 13 0 0 1 18 0M4 8.2a8.5 8.5 0 0 1 12 0M7.2 11.2a4 4 0 0 1 5.6 0" />
              </svg>
              <i className="tbatt">
                <i />
              </i>
              <button className="tclose" onClick={onClose} aria-label="×">
                ✕
              </button>
            </span>
          </div>

          {app === 'home' ? (
            <Home
              levelId={levelId}
              time={level.time}
              rain={!!level.rain}
              avg={avg}
              count={reviews.length}
              bowls={stats?.bowls ?? 0}
              earned={stats?.earned ?? 0}
              music={!!music}
              badges={{
                orders: phoneOrders.length,
                reviews: todayReviews,
                chat: seenChat ? 0 : contacts.length,
              }}
              onOpen={go}
            />
          ) : (
            <div className="tapp2" key={app}>
              <div className="tnav">
                <button className="tnav-back" onClick={() => go('home')}>
                  <svg viewBox="0 0 12 20" aria-hidden>
                    <path d="M10 2L2 10l8 8" />
                  </svg>
                  {T('tab.home')}
                </button>
                <h3>{TT(APP_NAME[app])}</h3>
                <span className="tnav-spacer" />
              </div>
              <div className="tapp2-body">
                {app === 'reviews' && <ReviewsApp reviews={reviews} levelId={levelId} />}
                {app === 'orders' && (
                  <OrdersApp open={phoneOrders} reviews={reviews} levelId={levelId} />
                )}
                {app === 'pantry' && <PantryApp levelId={levelId} />}
                {app === 'cash' && <CashApp stats={stats} />}
                {app === 'cam' && <CamApp />}
                {app === 'weather' && (
                  <WeatherApp levelId={levelId} time={level.time} rain={!!level.rain} />
                )}
                {app === 'chat' && <ChatApp levelId={levelId} />}
                {app === 'stars' && <StarsApp stars={stars ?? []} levelId={levelId} />}
                {app === 'recipe' && <RecipeApp />}
                {app === 'music' && <MusicApp on={!!music} onToggle={onToggleMusic} />}
              </div>
            </div>
          )}
          <button
            className="thome-bar"
            onClick={() => app !== 'home' && go('home')}
            aria-label={T('tab.home')}>
            <i />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ home */

function Home({
  levelId,
  time,
  rain,
  avg,
  count,
  bowls,
  earned,
  music,
  badges,
  onOpen,
}: {
  levelId: number;
  time: Tod;
  rain: boolean;
  avg: number;
  count: number;
  bowls: number;
  earned: number;
  music: boolean;
  badges: Partial<Record<Icon, number>>;
  onOpen: (a: Icon) => void;
}) {
  return (
    <div className={`thome wall-${time}`}>
      <div className="thome-widgets">
        <button
          className={`twidget tw-weather sky-${rain ? 'rain' : time}`}
          onClick={() => onOpen('weather')}>
          <span className="tw-glyph">
            <WeatherGlyph time={time} rain={rain} />
          </span>
          <span className="tw-text">
            <b>{TT(`home.hello.${time}` as TKey)}</b>
            <small>
              {T('tab.day', { n: levelId })} · {tempOf(levelId, time, rain)}°{' '}
              {TT(condKey(time, rain))}
            </small>
          </span>
        </button>
        <button className="twidget tw-rating" onClick={() => onOpen('reviews')}>
          <span className="tw-big">{count ? avg.toFixed(1) : '–'}</span>
          <span className="tw-text">
            <Stars value={avg} size={14} />
            <small>
              {count ? TT('home.widget', { n: bowls, m: fmt(earned) }) : TT('rev.emptyTitle')}
            </small>
          </span>
        </button>
      </div>
      <div className="thome-grid">
        {GRID.map((id) => (
          <AppIcon key={id} id={id} onOpen={onOpen} badge={badges[id]} />
        ))}
      </div>
      <div className="thome-dock">
        {DOCK.map((id) => (
          <AppIcon
            key={id}
            id={id}
            onOpen={onOpen}
            badge={badges[id]}
            off={id === 'music' && !music}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ reviews */

type Filter = 'all' | 5 | 4 | 'bad' | 'delivery';

function ReviewsApp({ reviews, levelId }: { reviews: Review[]; levelId: number }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [helpful, setHelpful] = useState<Record<number, boolean>>({});
  const n = reviews.length;
  const avg = n ? reviews.reduce((s, r) => s + r.stars, 0) / n : 0;
  const hist = [5, 4, 3, 2, 1].map((k) => reviews.filter((r) => r.stars === k).length);
  const maxH = Math.max(1, ...hist);
  const verdict: TKey =
    avg >= 4.5 ? 'rev.great' : avg >= 3.8 ? 'rev.good' : avg >= 3 ? 'rev.ok' : 'rev.low';

  const list = reviews
    .map((r, i) => ({ r, i }))
    .filter(({ r }) =>
      filter === 'all'
        ? true
        : filter === 'bad'
          ? r.stars <= 2
          : filter === 'delivery'
            ? r.delivery
            : r.stars === filter
    )
    .reverse();

  const chips: { id: Filter; label: ReactNode; n: number }[] = [
    { id: 'all', label: TT('rev.all'), n },
    { id: 5, label: '5 ★', n: hist[0] },
    { id: 4, label: '4 ★', n: hist[1] },
    { id: 'bad', label: `${TT('rev.bad')} ≤2★`, n: hist[3] + hist[4] },
    {
      id: 'delivery',
      label: `${TT('rev.delivery')} 🛵`,
      n: reviews.filter((r) => r.delivery).length,
    },
  ];

  if (!n)
    return (
      <div className="tempty">
        <div className="tempty-art">
          <Stars value={0} size={30} />
          <span>🍜</span>
        </div>
        <h4>{TT('rev.emptyTitle')}</h4>
        <p>{TT('rev.emptyText')}</p>
      </div>
    );

  return (
    <div className="rv">
      <div className="rv-summary">
        <div className="rv-score">
          <b>{avg.toFixed(1)}</b>
          <Stars value={avg} size={18} />
          <small>{n === 1 ? TT('rev.count1') : TT('rev.count', { n })}</small>
          <em>{TT(verdict)}</em>
        </div>
        <div className="rv-hist">
          {hist.map((c, i) => (
            <button
              key={i}
              className="rv-hrow"
              onClick={() => {
                const k = 5 - i;
                setFilter(k === 5 || k === 4 ? (k as 5 | 4) : k <= 2 ? 'bad' : 'all');
              }}>
              <span>{5 - i}</span>
              <i className="rv-bar">
                <i style={{ width: `${(c / maxH) * 100}%` }} />
              </i>
              <small>{c}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="rv-chips">
        {chips.map((c) => (
          <button
            key={String(c.id)}
            className={`rv-chip ${filter === c.id ? 'on' : ''}`}
            onClick={() => {
              sfx('tap');
              setFilter(c.id);
            }}>
            {c.label}
            <small>{c.n}</small>
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="tmuted center">{TT('rev.emptyFilter')}</p>}
      <div className="rv-list">
        {list.map(({ r, i }) => {
          const base = hashStr(r.name + r.text) % 5;
          const on = !!helpful[i];
          return (
            <article className={`rv-card ${r.stars <= 2 ? 'is-bad' : ''}`} key={i}>
              <span className="rv-avatar" style={avatarStyle(r.name)}>
                {initials(r.name)}
              </span>
              <div className="rv-main">
                <div className="rv-top">
                  <strong>{r.name}</strong>
                  {r.delivery && <span className="rv-badge">🛵 {TT('rev.badge')}</span>}
                </div>
                <div className="rv-meta">
                  <Stars value={r.stars} size={13} />
                  <small>{r.day === levelId ? TT('rev.today') : T('tab.day', { n: r.day })}</small>
                </div>
                <p>{r.text}</p>
                <button
                  className={`rv-help ${on ? 'on' : ''}`}
                  onClick={() => {
                    sfx(on ? 'tap' : 'pop');
                    setHelpful((h) => ({ ...h, [i]: !on }));
                  }}>
                  👍 {TT('rev.helpful')}
                  {base + (on ? 1 : 0) > 0 && <b>{base + (on ? 1 : 0)}</b>}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ orders */

function OrdersApp({
  open,
  reviews,
  levelId,
}: {
  open: { who: string; lines: string[] }[];
  reviews: Review[];
  levelId: number;
}) {
  const done = reviews.filter((r) => r.delivery).reverse();
  return (
    <div className="tpad">
      <h4 className="tsec">
        {T('tab.openOrders')} <small>{open.length}</small>
      </h4>
      {open.length === 0 && <p className="tmuted">{T('tab.noOpen')}</p>}
      {open.map((o, i) => (
        <div className="ord-card is-open" key={i}>
          <span className="ord-ico">🛵</span>
          <div className="ord-main">
            <div className="ord-top">
              <strong>{o.who}</strong>
              <span className="ord-pill live">{TT('ord.open')}</span>
            </div>
            <div className="ord-lines">
              {o.lines.map((l, k) => (
                <span key={k}>{l}</span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <h4 className="tsec">
        {T('tab.pastOrders')} <small>{done.length}</small>
      </h4>
      {done.length === 0 && <p className="tmuted">{T('tab.noPast')}</p>}
      {done.map((r, i) => (
        <div className="ord-card" key={i}>
          <span className="rv-avatar sm" style={avatarStyle(r.name)}>
            {initials(r.name)}
          </span>
          <div className="ord-main">
            <div className="ord-top">
              <strong>{r.name}</strong>
              <Stars value={r.stars} size={12} />
              <span className="ord-pill">
                ✓ {r.day === levelId ? TT('rev.today') : T('tab.day', { n: r.day })}
              </span>
            </div>
            <p>{r.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ pantry */

function PantryApp({ levelId }: { levelId: number }) {
  const unlocked = unlockedUpTo(levelId);
  const cats = ['noodle', 'broth', 'sauce', 'topping'] as const;
  return (
    <div className="tpad">
      {cats.map((cat) => {
        const ids = unlocked.filter((id) => INGREDIENTS[id].cat === cat);
        if (!ids.length) return null;
        return (
          <div key={cat}>
            <h4 className="tsec">
              {T(CAT_KEY[cat])} <small>{ids.length}</small>
            </h4>
            <div className="pan-grid">
              {ids.map((id) => (
                <div className="pan-item" key={id}>
                  <div className="pan-icon">
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
      <h4 className="tsec">{T('tab.bowls')}</h4>
      <div className="pan-grid">
        {BOWLS.filter((b) => b.unlock <= levelId).map((b) => (
          <div className="pan-item" key={b.id}>
            <div className="pan-icon">
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
  );
}

/* ------------------------------------------------------------------ register */

function CashApp({ stats }: { stats?: TabletStats }) {
  const s: TabletStats = stats ?? {
    earned: 0,
    sales: 0,
    tips: 0,
    bowls: 0,
    scores: [],
    lost: 0,
    complaints: 0,
    jar: 0,
  };
  const happy = s.scores.length
    ? Math.round(s.scores.reduce((a, b) => a + b, 0) / s.scores.length)
    : 0;
  const tiles: { k: TKey; v: string; ico: string; tone: string }[] = [
    { k: 'cash.bowls', v: String(s.bowls), ico: '🍜', tone: 'peach' },
    { k: 'cash.tips', v: fmt(s.tips), ico: '🫙', tone: 'butter' },
    { k: 'cash.complaints', v: String(s.complaints), ico: '😣', tone: 'rose' },
    { k: 'cash.lost', v: String(s.lost), ico: '🚪', tone: 'lilac' },
  ];
  return (
    <div className="tpad cash">
      <div className="cash-hero">
        <small>{TT('cash.earned')}</small>
        <b>{fmt(s.earned)}</b>
        <span>
          {TT('cash.sales')} {fmt(s.sales)} · {TT('cash.jar', { n: s.jar })}
        </span>
        <div className="cash-happy">
          <i style={{ width: `${happy}%` }} />
          <em>
            {TT('cash.happy')} · {s.scores.length ? TT('pct', { n: happy }) : '–'}
          </em>
        </div>
      </div>
      <div className="cash-tiles">
        {tiles.map((t) => (
          <div className={`cash-tile ${t.tone}`} key={t.k}>
            <span>{t.ico}</span>
            <b>{t.v}</b>
            <small>{TT(t.k)}</small>
          </div>
        ))}
      </div>
      <h4 className="tsec">{TT('cash.chart')}</h4>
      {s.scores.length === 0 ? (
        <p className="tmuted">{TT('cash.noChart')}</p>
      ) : (
        <div className="cash-chart">
          {s.scores.map((v, i) => (
            <i
              key={i}
              className={v >= 75 ? 'good' : v >= 45 ? 'mid' : 'bad'}
              style={{ height: `${Math.max(6, v)}%` }}
              title={String(v)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ cat cam */

function heartPath(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.beginPath();
  c.moveTo(x, y + s * 0.3);
  c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.78, x, y + s);
  c.bezierCurveTo(x, y + s * 0.78, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
  c.closePath();
}

function drawRoom(c: CanvasRenderingContext2D, W: number, H: number, t: number) {
  const floorY = H * 0.64;
  c.fillStyle = vGrad(c, 0, floorY, '#f9e6d2', '#f0cfb6');
  c.fillRect(0, 0, W, floorY);
  // soft wallpaper dots
  c.fillStyle = 'rgba(214,150,120,0.12)';
  for (let y = 40, row = 0; y < floorY - 20; y += 70, row++)
    for (let x = (row % 2) * 45 + 20; x < W; x += 90) circle(c, x, y, 5);
  // window with morning light
  const wx = W * 0.1;
  const ww = Math.min(220, W * 0.26);
  const wy = H * 0.1;
  const wh = floorY * 0.62;
  c.fillStyle = '#c99566';
  roundRect(c, wx - 10, wy - 10, ww + 20, wh + 20, 14);
  c.fill();
  c.fillStyle = vGrad(c, wy, wy + wh, '#bfe3f5', '#fde7cf');
  roundRect(c, wx, wy, ww, wh, 8);
  c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)';
  ellipse(c, wx + ww * 0.3, wy + wh * 0.35, ww * 0.18, wh * 0.06);
  c.fill();
  c.strokeStyle = '#c99566';
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(wx + ww / 2, wy);
  c.lineTo(wx + ww / 2, wy + wh);
  c.moveTo(wx, wy + wh / 2);
  c.lineTo(wx + ww, wy + wh / 2);
  c.stroke();
  // floor
  c.fillStyle = vGrad(c, floorY, H, '#d9a678', '#b98257');
  c.fillRect(0, floorY, W, H - floorY);
  c.strokeStyle = 'rgba(110,70,40,0.18)';
  c.lineWidth = 3;
  for (let y = floorY + 34; y < H; y += 46) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(W, y);
    c.stroke();
  }
  c.fillStyle = 'rgba(110,70,40,0.25)';
  c.fillRect(0, floorY, W, 8);
  // light patch from the window
  c.fillStyle = 'rgba(255,240,200,0.3)';
  c.beginPath();
  c.moveTo(wx + 20, floorY + 8);
  c.lineTo(wx + ww + 40, floorY + 8);
  c.lineTo(wx + ww + 150, H);
  c.lineTo(wx + 60, H);
  c.closePath();
  c.fill();
  // paper lantern
  const lx = W * 0.7;
  const sway = Math.sin(t * 1.2) * 0.04;
  c.save();
  c.translate(lx, 0);
  c.rotate(sway);
  c.strokeStyle = '#6e4b32';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 70);
  c.stroke();
  const glow = c.createRadialGradient(0, 140, 10, 0, 140, 170);
  glow.addColorStop(0, 'rgba(255,200,140,0.45)');
  glow.addColorStop(1, 'rgba(255,200,140,0)');
  c.fillStyle = glow;
  circle(c, 0, 140, 170);
  c.fillStyle = '#3a2a22';
  roundRect(c, -28, 66, 56, 12, 4);
  c.fill();
  roundRect(c, -28, 200, 56, 12, 4);
  c.fill();
  const lg = c.createRadialGradient(-14, 120, 6, 0, 140, 72);
  lg.addColorStop(0, '#ffb39a');
  lg.addColorStop(1, '#e0614c');
  c.fillStyle = lg;
  ellipse(c, 0, 139, 58, 64);
  c.fill();
  c.strokeStyle = 'rgba(120,40,30,0.3)';
  c.lineWidth = 2;
  for (let k = -2; k <= 2; k++) {
    c.beginPath();
    c.ellipse(0, 139, Math.abs(k) * 20 + 4, 64, 0, -Math.PI / 2, Math.PI / 2, k < 0);
    c.stroke();
  }
  c.restore();
}

function CamApp() {
  const hearts = useRef<{ t: number; dx: number }[]>([]);
  const lastPet = useRef(-100);
  const [pets, setPets] = useState(0);
  const pet = () => {
    const now = performance.now() / 1000;
    lastPet.current = now;
    hearts.current = [
      ...hearts.current.filter((h) => now - h.t < 2),
      { t: now, dx: ((pets * 37) % 90) - 45 },
    ];
    setPets((p) => p + 1);
    sfx('cat');
  };
  return (
    <div className="tpad cam">
      <div className="cam-view" onClick={pet}>
        <SceneCanvas
          draw={(c, W, H, t) => {
            const now = performance.now() / 1000;
            drawRoom(c, W, H, t);
            const cx = W * 0.52;
            const gy = H * 0.86;
            const size = Math.min(W, H) * 0.34;
            // cushion
            softShadow(c, cx, gy + 8, size * 1.25, size * 0.2, 0.25);
            c.fillStyle = vGrad(c, gy - size * 0.2, gy + size * 0.18, '#f6a99a', '#df7f6e');
            ellipse(c, cx, gy, size * 1.15, size * 0.22);
            c.fill();
            c.fillStyle = 'rgba(255,255,255,0.35)';
            ellipse(c, cx - size * 0.3, gy - size * 0.08, size * 0.45, size * 0.06);
            c.fill();
            // food bowl with kibble
            const bx = Math.min(cx + size * 1.6, W - size * 0.42);
            const br = size * 0.3;
            const bt = gy - size * 0.2;
            softShadow(c, bx, gy + 3, br * 1.1, size * 0.06, 0.22);
            c.fillStyle = vGrad(c, bt, gy, '#a9cdee', '#5f88b8');
            c.beginPath();
            c.moveTo(bx - br, bt);
            c.quadraticCurveTo(bx - br * 0.95, gy, bx - br * 0.6, gy);
            c.lineTo(bx + br * 0.6, gy);
            c.quadraticCurveTo(bx + br * 0.95, gy, bx + br, bt);
            c.closePath();
            c.fill();
            c.fillStyle = 'rgba(255,255,255,0.35)';
            ellipse(c, bx - br * 0.45, bt + size * 0.08, br * 0.12, size * 0.04);
            c.fill();
            c.fillStyle = '#d6e8f8';
            ellipse(c, bx, bt, br, size * 0.07);
            c.fill();
            c.fillStyle = '#c78a55';
            ellipse(c, bx, bt + 1, br * 0.82, size * 0.05);
            c.fill();
            c.fillStyle = '#a86d3f';
            for (let k = 0; k < 7; k++)
              circle(c, bx - br * 0.6 + k * br * 0.2, bt - 2 + (k % 2) * 5, size * 0.025);
            // Mochi
            const since = now - lastPet.current;
            const pose: CatPose =
              since < 3 ? 'sit' : Math.floor(t / 10) % 2 === 0 ? 'sleep' : 'loaf';
            drawCat(c, cx, gy - size * 0.06, size, pose, t, false);
            // hearts
            for (const h of hearts.current) {
              const a = (now - h.t) / 1.8;
              if (a < 0 || a > 1) continue;
              const hs = size * (0.22 + a * 0.12);
              c.save();
              c.globalAlpha = 1 - a * a;
              c.fillStyle = a < 0.5 ? '#ff7f96' : '#ff9eb0';
              heartPath(
                c,
                cx + h.dx + Math.sin(a * 6 + h.dx) * 14,
                gy - size * 1.3 - a * size * 1.1,
                hs
              );
              c.fill();
              c.fillStyle = 'rgba(255,255,255,0.6)';
              circle(
                c,
                cx + h.dx - hs * 0.22 + Math.sin(a * 6 + h.dx) * 14,
                gy - size * 1.3 - a * size * 1.1 + hs * 0.28,
                hs * 0.08
              );
              c.restore();
            }
            // gentle vignette
            const v = c.createRadialGradient(
              W / 2,
              H / 2,
              Math.min(W, H) * 0.35,
              W / 2,
              H / 2,
              Math.max(W, H) * 0.75
            );
            v.addColorStop(0, 'rgba(60,35,20,0)');
            v.addColorStop(1, 'rgba(60,35,20,0.28)');
            c.fillStyle = v;
            c.fillRect(0, 0, W, H);
          }}
        />
        <span className="cam-live">
          <i /> {TT('cam.live')}
        </span>
        <span className="cam-room">{TT('cam.room')}</span>
        <span className="cam-corners" aria-hidden />
        <span className="cam-hint">
          {pets ? `💗 ${TT('cam.pets', { n: pets })}` : `👆 ${TT('cam.hint')}`}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ weather */

const tempOf = (day: number, time: Tod, rain: boolean) =>
  ({ sabah: 15, ogle: 22, gunbatimi: 19, aksam: 14 })[time] + ((day * 7) % 5) - (rain ? 5 : 0);

const condKey = (time: Tod, rain: boolean): TKey =>
  rain ? 'w.rain' : time === 'aksam' ? 'w.clear' : time === 'gunbatimi' ? 'w.cloudy' : 'w.sunny';

function WeatherGlyph({ time, rain, big }: { time: Tod; rain: boolean; big?: boolean }) {
  const night = time === 'aksam';
  return (
    <svg viewBox="0 0 64 64" className={big ? 'wx-big' : ''} aria-hidden>
      {night ? (
        <path d="M40 10a20 20 0 1 0 14 30A17 17 0 0 1 40 10z" fill="#fff1b8" />
      ) : (
        <g className="wx-sun">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => (
            <rect
              key={k}
              x="29.5"
              y="2"
              width="5"
              height="9"
              rx="2.5"
              fill={time === 'gunbatimi' ? '#ffc48a' : '#ffd96b'}
              transform={`rotate(${k * 45} 32 28)`}
              opacity={rain ? 0 : 1}
            />
          ))}
          <circle cx="32" cy="28" r="13" fill={time === 'gunbatimi' ? '#ffb27a' : '#ffd24f'} />
        </g>
      )}
      {(rain || time !== 'ogle') && (
        <path
          d="M14 52h32a10 10 0 0 0 .6-20A13 13 0 0 0 21 34a9 9 0 0 0-7 18z"
          fill={rain ? '#e9eef7' : '#fff'}
          opacity={rain ? 1 : 0.92}
        />
      )}
      {rain &&
        [0, 1, 2].map((k) => (
          <path
            key={k}
            className="wx-drop"
            style={{ animationDelay: `${k * 0.25}s` }}
            d={`M${22 + k * 10} 55l-2.5 6`}
            stroke="#8ab8ea"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
        ))}
    </svg>
  );
}

function WeatherApp({ levelId, time, rain }: { levelId: number; time: Tod; rain: boolean }) {
  const temp = tempOf(levelId, time, rain);
  const order: Tod[] = ['sabah', 'ogle', 'gunbatimi', 'aksam'];
  const start = { sabah: 8, ogle: 12, gunbatimi: 17, aksam: 20 }[time];
  const hours = [0, 1, 2, 3, 4].map((k) => {
    const h = (start + k * 2) % 24;
    const tod: Tod = h < 6 || h >= 19 ? 'aksam' : h < 11 ? 'sabah' : h < 16 ? 'ogle' : 'gunbatimi';
    return { h, tod, t: temp + ([0, 2, 1, -1, -3][k] ?? 0) - (order.indexOf(tod) > 2 ? 2 : 0) };
  });
  const soup = Math.min(10, Math.max(3, Math.round((26 - temp) / 2) + (rain ? 3 : 0)));
  const tip: TKey = rain ? 'w.tipRain' : time === 'aksam' ? 'w.tipNight' : 'w.tipSun';
  return (
    <div className={`wx sky-${rain ? 'rain' : time}`}>
      <div className="wx-hero">
        <div>
          <small>{TT('w.city')}</small>
          <b>{temp}°</b>
          <span>
            {TT(condKey(time, rain))} · {TT(`w.${time}` as TKey)}
          </span>
          <em>{TT('w.feels', { n: temp - (rain ? 2 : 1) })}</em>
        </div>
        <WeatherGlyph time={time} rain={rain} big />
      </div>
      <div className="wx-card">
        <small>{TT('w.hourly')}</small>
        <div className="wx-hours">
          {hours.map((h, i) => (
            <div key={i} className={i === 0 ? 'now' : ''}>
              <small>{String(h.h).padStart(2, '0')}:00</small>
              <WeatherGlyph time={h.tod} rain={rain && i < 3} />
              <b>{h.t}°</b>
            </div>
          ))}
        </div>
      </div>
      <div className="wx-row">
        <div className="wx-card mini">
          <small>{TT('w.humidity')}</small>
          <b>{TT('pct', { n: rain ? 86 : 48 + ((levelId * 11) % 20) })}</b>
        </div>
        <div className="wx-card mini">
          <small>{TT('w.wind')}</small>
          <b>{6 + ((levelId * 5) % 12)} km/h</b>
        </div>
        <div className="wx-card mini">
          <small>{TT('w.soup')}</small>
          <b>🍜 {soup}/10</b>
        </div>
      </div>
      <div className="wx-card tip">💡 {TT(tip)}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ messages */

const contactName = (who: ChatWho) => (who === 'mahalle' ? TT('chat.mahalle') : L(CHARS[who].name));

function pickLines(lines: readonly (readonly [string, string])[], day: number, n: number) {
  const out: (readonly [string, string])[] = [];
  for (let k = 0; k < Math.min(n, lines.length); k++) out.push(lines[(day + k * 2) % lines.length]);
  return [...new Set(out)];
}

function ChatAvatar({ who }: { who: ChatWho }) {
  return (
    <span className="ch-avatar" style={{ background: CHARS[who].color }}>
      {who === 'mochi' ? '🐱' : who === 'mahalle' ? '🏮' : contactName(who)[0]}
    </span>
  );
}

function ChatApp({ levelId }: { levelId: number }) {
  const [open, setOpen] = useState<ChatWho | null>(null);
  const [sent, setSent] = useState<Partial<Record<ChatWho, string[]>>>({});
  const endRef = useRef<HTMLElement>(null);
  const contacts = CHAT.filter((c) => c.from <= levelId);
  const times = ['09:12', '10:40', '11:05', '08:30', '12:20'];

  if (!open)
    return (
      <div className="ch-list">
        {contacts.map((c, i) => {
          const lines = pickLines(c.lines, levelId, 3);
          return (
            <button
              key={c.who}
              className="ch-row"
              onClick={() => {
                sfx('tap');
                setOpen(c.who);
              }}>
              <ChatAvatar who={c.who} />
              <span className="ch-row-main">
                <span className="ch-row-top">
                  <strong>{contactName(c.who)}</strong>
                  <small>{i === 0 ? TT('chat.now') : times[i % times.length]}</small>
                </span>
                <span className="ch-preview">{tl(lines[lines.length - 1])}</span>
              </span>
              <i className="ch-dot" />
            </button>
          );
        })}
      </div>
    );

  const c = contacts.find((x) => x.who === open)!;
  const lines = pickLines(c.lines, levelId, 3);
  const mine = sent[open] ?? [];
  const replies = ['❤️', '👍', tl(['Teşekkürler!', 'Thank you!']), '🍜'];
  return (
    <div className="ch-thread">
      <div className="ch-head">
        <button className="ch-back" onClick={() => setOpen(null)} aria-label="‹">
          ‹
        </button>
        <ChatAvatar who={open} />
        <strong>{contactName(open)}</strong>
      </div>
      <div className="ch-msgs">
        <small className="ch-daytag">{T('tab.day', { n: levelId })}</small>
        {lines.map((l, i) => (
          <p key={i} className="ch-b them">
            {tl(l)}
          </p>
        ))}
        {mine.map((m, i) => (
          <p key={'m' + i} className={`ch-b me ${[...m].length <= 2 ? 'emoji' : ''}`}>
            {m}
          </p>
        ))}
        {mine.length > 0 && <small className="ch-seen">{TT('chat.read')}</small>}
        <i ref={endRef} />
      </div>
      <div className="ch-replies">
        {replies.map((r) => (
          <button
            key={r}
            onClick={() => {
              sfx('bubble');
              setSent((s) => ({ ...s, [open]: [...(s[open] ?? []), r].slice(-6) }));
              setTimeout(
                () => endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }),
                30
              );
            }}>
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ stars */

function StarsApp({ stars, levelId }: { stars: number[]; levelId: number }) {
  const max = LEVELS.length * 3;
  const total = stars.reduce((a, b) => a + (b || 0), 0);
  const done = stars.filter((s) => s > 0).length;
  const perfect = stars.filter((s) => s >= 3).length;
  const R = 44;
  const C = 2 * Math.PI * R;
  const acts = Math.ceil(LEVELS.length / 10);
  return (
    <div className="tpad st">
      <div className="st-hero">
        <svg viewBox="0 0 110 110" className="st-ring" aria-hidden>
          <circle cx="55" cy="55" r={R} className="st-track" />
          <circle
            cx="55"
            cy="55"
            r={R}
            className="st-fill"
            strokeDasharray={`${(total / max) * C} ${C}`}
            transform="rotate(-90 55 55)"
          />
          <text x="55" y="53" textAnchor="middle">
            {total}
          </text>
          <text x="55" y="72" textAnchor="middle" className="st-sub">
            / {max}
          </text>
        </svg>
        <div className="st-facts">
          <b>{TT('st.total', { n: total, m: max })}</b>
          <span>✅ {TT('st.days', { n: done })}</span>
          <span>🌟 {TT('st.perfect', { n: perfect })}</span>
          <small>{TT('st.tip')}</small>
        </div>
      </div>
      {Array.from({ length: acts }, (_, a) => (
        <div key={a}>
          <h4 className="tsec">{TT('st.act', { n: a + 1 })}</h4>
          <div className="st-grid">
            {LEVELS.slice(a * 10, a * 10 + 10).map((lv) => {
              const s = stars[lv.id - 1] ?? 0;
              return (
                <div
                  key={lv.id}
                  className={`st-day ${lv.id === levelId ? 'cur' : ''} ${s === 0 && lv.id > levelId ? 'locked' : ''}`}
                  title={L(lv.title)}>
                  <b>{lv.id}</b>
                  <span>
                    {[1, 2, 3].map((k) => (
                      <i key={k} className={k <= s ? 'on' : ''} />
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ recipe */

function RecipeApp() {
  return (
    <div className="tpad rec">
      <div className="rec-paper">
        <span className="rec-tape" aria-hidden />
        <h4>{TT('rec.title')}</h4>
        <small>{TT('rec.sub')}</small>
        <ol>
          {RECIPE_TIPS.map((r, i) => (
            <li key={i}>
              <span className="rec-ico">{r.icon}</span>
              <div>
                <b>{tl(r.title)}</b>
                <p>{tl(r.text)}</p>
              </div>
            </li>
          ))}
        </ol>
        <span className="rec-sign">— Hana 🍜</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ music */

function MusicApp({ on, onToggle }: { on: boolean; onToggle?: () => void }) {
  return (
    <div className={`tpad mus ${on ? 'on' : ''}`}>
      <div className="mus-deck">
        <div className="mus-disc">
          <i className="mus-label">
            <b>🏮</b>
          </i>
        </div>
        <i className="mus-arm" />
      </div>
      <div className="mus-info">
        <b>{TT('mus.track')}</b>
        <small>{TT('mus.artist')}</small>
        <div className="mus-eq" aria-hidden>
          {[0, 1, 2, 3, 4, 5, 6].map((k) => (
            <i key={k} style={{ animationDelay: `${k * 0.13}s` }} />
          ))}
        </div>
        <button
          className="mus-play"
          onClick={() => {
            sfx('tap');
            onToggle?.();
          }}
          disabled={!onToggle}>
          {on ? (
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="6" y="5" width="4" height="14" rx="1.5" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.7l-10-6.5A1 1 0 0 0 8 5.5z" />
            </svg>
          )}
          <span>{on ? TT('mus.pause') : TT('mus.play')}</span>
        </button>
        <em>{on ? `♪ ${TT('mus.on')}` : TT('mus.off')}</em>
        <p>{TT('mus.note')}</p>
      </div>
    </div>
  );
}
