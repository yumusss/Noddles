import { useCallback, useEffect, useRef, useState } from 'react';
import { INGREDIENTS } from '../data';
import {
  COOK,
  acceptOffer,
  activeBowl,
  dropNoodle,
  dumpPot,
  grade,
  moodFor,
  newGame,
  pourBroth,
  selectTicket,
  serve,
  stars as starsOf,
  takeFromPot,
  takeOrder,
  tick,
  toggleTopping,
  trashBowl,
  type Customer,
  type GameState,
  type Order,
  type ServeResult,
  type Ticket,
} from '../engine';
import { BowlArt, CatArt, Coin, CustomerArt, IngredientIcon, PotArt, Scooter, Star } from '../art';
import { buzz, sfx } from '../audio';
import { ShopWall } from './Scenery';
import type { Save } from '../App';

export interface DayResult {
  coins: number;
  stars: number;
  served: number;
  perfect: number;
  lost: number;
  bestCombo: number;
}

type View = 'salon' | 'kitchen';

interface Toast {
  id: number;
  res: ServeResult;
}

const GRADE_TEXT = { perfect: 'MÜKEMMEL!', good: 'GÜZEL!', meh: 'İDARE EDER', bad: 'OLMAMIŞ…' };

export default function Play({
  levelId,
  save,
  onToggle,
  onDone,
  onQuit,
  onRestart,
}: {
  levelId: number;
  save: Save;
  onToggle: (k: 'sfx' | 'music') => void;
  onDone: (r: DayResult) => void;
  onQuit: () => void;
  onRestart: () => void;
}) {
  const [g] = useState<GameState>(() => newGame(levelId));
  const [, setFrame] = useState(0);
  const [view, setView] = useState<View>('salon');
  const viewRef = useRef<View>('salon');
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [closing, setClosing] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);
  const render = useCallback(() => setFrame((f) => f + 1), []);

  const L = g.level;

  const go = (v: View) => {
    viewRef.current = v;
    setView(v);
    if (v === 'salon') g.salonAlert = false;
    sfx('whoosh');
  };

  // main loop
  useEffect(() => {
    if (!started || paused || g.ended) return;
    let last = performance.now();
    let raf = 0;
    let acc = 0;
    let bubbleT = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const ev = tick(g, dt, viewRef.current);
      for (const e of ev) {
        if (e === 'arrive') sfx('door');
        else if (e === 'phone') {
          sfx('phone');
          buzz(40);
        } else if (e === 'leave-angry' || e === 'offer-missed') {
          sfx('angry');
          buzz(60);
        } else if (e === 'ready') sfx('ding');
        else if (e === 'over') sfx('fail');
      }
      bubbleT += dt;
      if (bubbleT > 0.25 && g.pots.some((p) => p.noodle)) {
        bubbleT = 0;
        if (Math.random() < 0.5) sfx('bubble');
      }
      acc += dt;
      if (acc > 0.05 || ev.length) {
        acc = 0;
        render();
      }
      if (g.ended) {
        setClosing(true);
        sfx('win');
        window.setTimeout(() => {
          onDone({
            coins: g.coins,
            stars: starsOf(g),
            served: g.served,
            perfect: g.perfect,
            lost: g.lost,
            bestCombo: g.bestCombo,
          });
        }, 2200);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, paused, g, render, onDone]);

  useEffect(() => {
    const h = () => {
      if (document.hidden && started && !g.ended) setPaused(true);
    };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [started, g]);

  const flash = (msg: string) => {
    setNudge(msg);
    sfx('fail');
    buzz(30);
    window.setTimeout(() => setNudge((m) => (m === msg ? null : m)), 1400);
  };

  // ---------- actions ----------
  const onCustomer = (c: Customer) => {
    if (c.state === 'ordering') {
      takeOrder(g, c.id);
      sfx('ding');
      buzz(10);
      render();
    }
  };

  const needTicket = () => {
    if (!g.activeTicket) {
      flash(g.offers.length ? 'Önce telefondaki siparişi kabul et!' : 'Önce salondan sipariş al!');
      return true;
    }
    return false;
  };

  const onNoodle = (id: string) => {
    if (!dropNoodle(g, id)) return flash('Tencereler dolu!');
    sfx('drop');
    buzz(10);
    render();
  };

  const onPot = (i: number) => {
    const p = g.pots[i];
    if (!p.noodle) return flash('Önce bir erişte seç, tencereye atılsın');
    if (needTicket()) return;
    const r = takeFromPot(g, i);
    if (r === 'has-noodle') return flash('Bu kasede zaten erişte var');
    if (r === 'moved') {
      sfx('splash');
      buzz(15);
    }
    render();
  };

  const onBroth = (id: string) => {
    if (needTicket()) return;
    pourBroth(g, id);
    sfx('splash');
    buzz(10);
    render();
  };

  const onTopping = (id: string) => {
    if (needTicket()) return;
    const r = toggleTopping(g, id);
    sfx(r === 'removed' ? 'tap' : 'pop');
    buzz(8);
    render();
  };

  const onServe = () => {
    const b = activeBowl(g);
    if (!b || (!b.noodle && !b.broth && !b.toppings.length)) return flash('Kase boş!');
    const res = serve(g);
    if (!res) return;
    if (res.grade === 'perfect') sfx('perfect');
    else if (res.grade === 'bad') sfx('fail');
    else sfx('coins');
    if (res.online) sfx('whoosh');
    window.setTimeout(() => sfx('coins'), 250);
    buzz(res.grade === 'perfect' ? 40 : 20);
    setToast({ id: Date.now(), res });
    window.setTimeout(() => setToast((t) => (t && Date.now() - t.id > 1500 ? null : t)), 1700);
    render();
  };

  const onTrash = () => {
    trashBowl(g);
    sfx('trash');
    render();
  };

  // ---------- derived ----------
  const ordering = g.customers.filter((c) => c.state === 'ordering').length;
  const remaining = Math.max(0, L.duration - g.time);
  const [t1, t2, t3] = L.targets;
  const maxBar = t3 * 1.08;
  const bowl = activeBowl(g);
  const active = g.tickets.find((t) => t.id === g.activeTicket);
  const noodles = g.unlocked.filter((i) => INGREDIENTS[i].cat === 'noodle');
  const broths = g.unlocked.filter((i) => INGREDIENTS[i].cat === 'broth');
  const toppings = g.unlocked.filter((i) => INGREDIENTS[i].cat === 'topping');
  const matchScore = active && bowl ? grade(active.order, bowl).score : 0;

  const hint = tutorialHint(g, view, levelId);

  return (
    <div className={`screen play v-${view}`}>
      {/* HUD */}
      <div className="hud">
        <button className="hud-btn" onClick={() => setPaused(true)} aria-label="Duraklat">
          ❚❚
        </button>
        <div className="hud-mid">
          <div className="hud-title">
            {L.id}. {L.title}
          </div>
          <div className="coinbar">
            <div
              className="coinbar-fill"
              style={{ width: `${Math.min(100, (g.coins / maxBar) * 100)}%` }}
            />
            {[t1, t2, t3].map((t, i) => (
              <div
                key={i}
                className={`coinbar-star ${g.coins >= t ? 'on' : ''}`}
                style={{ left: `${(t / maxBar) * 100}%` }}>
                <Star on={g.coins >= t} size={16} />
              </div>
            ))}
          </div>
        </div>
        <div className="hud-coins">
          <Coin size={18} />
          <b key={g.coins} className="bump">
            {g.coins}
          </b>
        </div>
        <div className={`hud-time ${remaining < 15 ? 'low' : ''}`}>
          {Math.floor(remaining / 60)}:{String(Math.floor(remaining % 60)).padStart(2, '0')}
        </div>
        {L.online > 0 && (
          <button
            className={`phone-btn ${g.offers.length ? 'ringing' : ''}`}
            onClick={() => setPhoneOpen(true)}
            aria-label="Telefon">
            📱{g.offers.length > 0 && <span className="badge">{g.offers.length}</span>}
          </button>
        )}
      </div>
      {g.combo >= 2 && <div className="combo">🔥 {g.combo}x seri</div>}
      {hint && <div className="hint">{hint}</div>}
      {nudge && <div className="nudge">{nudge}</div>}

      {/* SALON */}
      {view === 'salon' && (
        <div className="salon">
          <ShopWall
            rain={L.id === 5}
            menu={noodles.map((n) => INGREDIENTS[n].name).join(' • ')}
            cat={<CatArt size={60} sleepy={ordering === 0 && g.tickets.length === 0} />}
          />
          <div className="seats" style={{ gridTemplateColumns: `repeat(${L.seats}, 1fr)` }}>
            {Array.from({ length: L.seats }, (_, s) => {
              const c = g.customers.find((x) => x.seat === s);
              return (
                <div
                  key={s}
                  className={`seat ${s === 0 ? 'first' : ''} ${s === L.seats - 1 ? 'last' : ''}`}>
                  {c && <CustomerView c={c} big={L.seats <= 3} onTap={() => onCustomer(c)} />}
                </div>
              );
            })}
          </div>
          <div className="counter">
            <div className="counter-top" />
            <div className="counter-deco">
              <Condiments />
            </div>
            <div className="counter-sign">NODDLES</div>
            <div className="stools">
              {Array.from({ length: L.seats }, (_, s) => (
                <div key={s} className="stool" />
              ))}
            </div>
          </div>
          {g.customers
            .filter((c) => c.state === 'eating')
            .map((c) => (
              <div
                key={c.id}
                className="served-bowl"
                style={{ left: `${((c.seat + 0.5) / L.seats) * 100}%` }}>
                <BowlArt
                  bowl={{
                    noodle: c.order.noodle,
                    broth: c.order.broth,
                    toppings: c.order.toppings,
                  }}
                  width={78}
                />
              </div>
            ))}
          <Floaters g={g} view="salon" />
        </div>
      )}

      {/* KITCHEN */}
      {view === 'kitchen' && (
        <div className="kitchen">
          <div className="rail">
            {g.tickets.length === 0 && (
              <div className="rail-empty">
                Fiş yok. Salondan sipariş al{L.online ? ' ya da telefona bak' : ''}.
              </div>
            )}
            {g.tickets.map((t) => (
              <TicketCard
                key={t.id}
                t={t}
                active={t.id === g.activeTicket}
                bowl={g.bowls.find((b) => b.ticketId === t.id)}
                onTap={() => {
                  selectTicket(g, t.id);
                  sfx('tap');
                  render();
                }}
              />
            ))}
          </div>

          <div className="stove">
            {g.pots.map((p, i) => {
              const cook = p.noodle ? COOK[p.noodle] : null;
              const state =
                !p.noodle || !cook
                  ? 'empty'
                  : p.t < cook.ready
                    ? 'cooking'
                    : p.t > cook.over
                      ? 'over'
                      : 'ready';
              const scale = cook ? cook.over * 1.25 : 1;
              return (
                <div key={i} className={`pot pot-${state}`}>
                  <button className="pot-main" onClick={() => onPot(i)}>
                    <div className="burner" />
                    <PotArt noodle={p.noodle} state={state} />
                    <div className="pot-label">
                      {state === 'empty'
                        ? 'Boş tencere'
                        : state === 'cooking'
                          ? 'Pişiyor…'
                          : state === 'ready'
                            ? 'HAZIR! Dokun'
                            : 'Lapa oldu!'}
                    </div>
                  </button>
                  {cook && (
                    <div className="cookbar">
                      <i className="z1" style={{ width: `${(cook.ready / scale) * 100}%` }} />
                      <i
                        className="z2"
                        style={{ width: `${((cook.over - cook.ready) / scale) * 100}%` }}
                      />
                      <i className="z3" />
                      <b style={{ left: `${Math.min(100, (p.t / scale) * 100)}%` }} />
                    </div>
                  )}
                  {p.noodle && (
                    <button
                      className="pot-dump"
                      onClick={() => {
                        dumpPot(g, i);
                        sfx('trash');
                        render();
                      }}
                      aria-label="Tencereyi boşalt">
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pantry">
            <div className="pantry-row">
              <span className="pantry-label">Erişte</span>
              {noodles.map((id) => (
                <button
                  key={id}
                  className={`tile ${active?.order.noodle === id ? 'want' : ''}`}
                  onClick={() => onNoodle(id)}>
                  <IngredientIcon id={id} size={34} />
                  <span>{INGREDIENTS[id].name}</span>
                </button>
              ))}
            </div>
            <div className="pantry-row">
              <span className="pantry-label">Su</span>
              {broths.map((id) => (
                <button
                  key={id}
                  className={`tile ${active?.order.broth === id ? 'want' : ''} ${bowl?.broth === id ? 'in' : ''}`}
                  onClick={() => onBroth(id)}>
                  <IngredientIcon id={id} size={34} />
                  <span>{INGREDIENTS[id].name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="board">
            <button className="board-btn trash" onClick={onTrash} disabled={!bowl}>
              🗑<span>Çöp</span>
            </button>
            <div className="board-bowl">
              {active ? (
                <>
                  <div className="board-for">
                    {active.online ? '🛵 ' : '🪑 '}
                    {active.name}
                  </div>
                  <BowlArt bowl={bowl ?? { toppings: [] }} width={190} takeaway={!!active.online} />
                </>
              ) : (
                <div className="board-empty">Sipariş fişi seç</div>
              )}
            </div>
            <button
              className={`board-btn serve ${matchScore >= 92 ? 'ready' : ''}`}
              onClick={onServe}
              disabled={!active}>
              {active?.online ? '📦' : '🛎'}
              <span>{active?.online ? 'Paketle' : 'Servis'}</span>
            </button>
          </div>

          <div
            className="toppings"
            style={{
              gridTemplateColumns: `repeat(${Math.min(6, Math.max(4, Math.ceil(toppings.length / 2)))}, 1fr)`,
            }}>
            {toppings.map((id) => (
              <button
                key={id}
                className={`tile tbin ${active?.order.toppings.includes(id) ? 'want' : ''} ${bowl?.toppings.includes(id) ? 'in' : ''}`}
                onClick={() => onTopping(id)}>
                <IngredientIcon id={id} size={34} />
                <span>{INGREDIENTS[id].name}</span>
              </button>
            ))}
          </div>

          {g.couriers.map((c) => (
            <div key={c.id} className="courier">
              <Scooter size={70} />
            </div>
          ))}
          <Floaters g={g} view="kitchen" />
          {toast && (
            <div key={toast.id} className={`serve-toast g-${toast.res.grade}`}>
              <div className="st-grade">{GRADE_TEXT[toast.res.grade]}</div>
              <div className="st-coins">
                <Coin size={20} /> +{toast.res.pay + toast.res.tip + toast.res.bonus}
                {toast.res.tip > 0 && <small> (bahşiş {toast.res.tip})</small>}
              </div>
              {toast.res.bonus > 0 && (
                <div className="st-bonus">⭐ Özel misafir bonusu +{toast.res.bonus}</div>
              )}
              {toast.res.notes.length > 0 && (
                <div className="st-notes">{toast.res.notes.join(' • ')}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* NAV */}
      <div className="nav">
        <button className={`nav-btn ${view === 'salon' ? 'on' : ''}`} onClick={() => go('salon')}>
          🏮 Salon {ordering > 0 && <span className="badge pulse-badge">{ordering}</span>}
        </button>
        <button
          className={`nav-btn ${view === 'kitchen' ? 'on' : ''}`}
          onClick={() => go('kitchen')}>
          🔥 Mutfak {g.tickets.length > 0 && <span className="badge">{g.tickets.length}</span>}
        </button>
      </div>

      {/* PHONE */}
      {phoneOpen && (
        <div className="overlay" onClick={() => setPhoneOpen(false)}>
          <div className="phone" onClick={(e) => e.stopPropagation()}>
            <div className="phone-notch" />
            <div className="phone-head">NoddlesGo • Siparişler</div>
            {g.offers.length === 0 && <div className="phone-empty">Şu an yeni sipariş yok.</div>}
            {g.offers.map((o) => (
              <div key={o.id} className="offer">
                <div className="offer-top">
                  <b>🛵 {o.name}</b>
                  <span>{Math.ceil(o.expires - g.time)} sn</span>
                </div>
                <div className="pbar">
                  <i style={{ width: `${((o.expires - g.time) / o.total) * 100}%` }} />
                </div>
                <OrderIcons order={o.order} size={26} />
                <button
                  className="btn primary small"
                  onClick={() => {
                    acceptOffer(g, o.id);
                    sfx('ding');
                    render();
                    if (g.offers.length === 0) setPhoneOpen(false);
                  }}>
                  Kabul et
                </button>
              </div>
            ))}
            <button className="btn ghost small" onClick={() => setPhoneOpen(false)}>
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* START */}
      {!started && (
        <div className="overlay">
          <div className="card start-card">
            <div className="chapter-heading">Bölüm {L.id}</div>
            <h2>{L.title}</h2>
            <p>{L.subtitle}</p>
            <div className="goals inline">
              {L.targets.map((t, i) => (
                <span key={i}>
                  <Star on size={14} /> {t}
                </span>
              ))}
            </div>
            <button
              className="btn big primary"
              onClick={() => {
                setStarted(true);
                sfx('door');
              }}>
              Başla!
            </button>
          </div>
        </div>
      )}

      {/* PAUSE */}
      {paused && (
        <div className="overlay">
          <div className="card">
            <h2>Mola</h2>
            <div className="toggles">
              <button className="btn ghost" onClick={() => onToggle('sfx')}>
                Efektler: {save.sfx ? 'Açık' : 'Kapalı'}
              </button>
              <button className="btn ghost" onClick={() => onToggle('music')}>
                Müzik: {save.music ? 'Açık' : 'Kapalı'}
              </button>
            </div>
            <button className="btn big primary" onClick={() => setPaused(false)}>
              Devam
            </button>
            <button className="btn ghost" onClick={onRestart}>
              Baştan başla
            </button>
            <button className="btn ghost" onClick={onQuit}>
              Haritaya dön
            </button>
          </div>
        </div>
      )}

      {closing && (
        <div className="overlay closing">
          <div className="closing-text">Kapanış saati!</div>
          <div className="closing-sub">Kepenk iniyor…</div>
        </div>
      )}
    </div>
  );
}

// ---------- pieces ----------

function OrderIcons({
  order,
  size = 22,
  bowl,
}: {
  order: Order;
  size?: number;
  bowl?: { noodle?: string; broth?: string; toppings: string[] };
}) {
  const items = [order.noodle, order.broth, ...order.toppings];
  return (
    <div className="order-icons">
      {items.map((id, i) => {
        const done = bowl
          ? i === 0
            ? bowl.noodle === id
            : i === 1
              ? bowl.broth === id
              : bowl.toppings.includes(id)
          : false;
        return (
          <span key={id + i} className={`oi ${done ? 'done' : ''}`} title={INGREDIENTS[id].name}>
            <IngredientIcon id={id} size={size} />
            {done && <em>✓</em>}
          </span>
        );
      })}
    </div>
  );
}

function TicketCard({
  t,
  active,
  bowl,
  onTap,
}: {
  t: Ticket;
  active: boolean;
  bowl?: { noodle?: string; broth?: string; toppings: string[] };
  onTap: () => void;
}) {
  const r = Math.max(0, t.patience / t.maxPatience);
  return (
    <button
      className={`ticket ${active ? 'active' : ''} ${t.online ? 'online' : ''} ${t.special ? 'special' : ''} ${r < 0.25 ? 'urgent' : ''}`}
      onClick={onTap}>
      <div className="ticket-head">
        <span>{t.online ? '🛵' : t.special ? '⭐' : '🪑'}</span>
        <b>{t.name}</b>
      </div>
      <div className="pbar">
        <i className={r < 0.25 ? 'red' : r < 0.5 ? 'amber' : ''} style={{ width: `${r * 100}%` }} />
      </div>
      <OrderIcons order={t.order} size={22} bowl={bowl} />
      <div className="ticket-names">
        {INGREDIENTS[t.order.noodle].name} • {INGREDIENTS[t.order.broth].name}
      </div>
    </button>
  );
}

function CustomerView({ c, onTap, big }: { c: Customer; onTap: () => void; big: boolean }) {
  const mood = moodFor(c);
  const r = Math.max(0, c.patience / c.maxPatience);
  return (
    <div className={`cust st-${c.state} ${c.special ? 'vip' : ''}`} onClick={onTap}>
      {c.state === 'ordering' && (
        <div className="bubble ask">
          <b>!</b>
          <span>Sipariş</span>
        </div>
      )}
      {c.state === 'waiting' && (
        <div className="bubble order">
          {c.stateT < 3.2 && <div className="greet">{c.greet}</div>}
          <OrderIcons order={c.order} size={20} />
        </div>
      )}
      {(c.state === 'eating' || c.state === 'leaving') && c.bubble && (
        <div className={`bubble say ${c.result === 'gone' || c.result === 'bad' ? 'mad' : ''}`}>
          {c.bubble}
        </div>
      )}
      {c.state === 'eating' && c.result === 'perfect' && (
        <div className="hearts">
          <span>❤</span>
          <span>❤</span>
          <span>❤</span>
        </div>
      )}
      <div className="cust-body">
        <CustomerArt look={c.look} mood={mood} size={big ? 128 : 108} />
      </div>
      <div className="cust-tag">
        <span>{c.name}</span>
        {(c.state === 'ordering' || c.state === 'waiting') && (
          <div className="pbar small">
            <i
              className={r < 0.25 ? 'red' : r < 0.5 ? 'amber' : ''}
              style={{ width: `${r * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Floaters({ g, view }: { g: GameState; view: View }) {
  return (
    <>
      {g.floaters
        .filter((f) => f.view === view)
        .map((f) => (
          <div
            key={f.id}
            className="floater"
            style={{ left: `${f.x}%`, top: `${f.y}%`, color: f.color }}>
            {f.text}
          </div>
        ))}
    </>
  );
}

function tutorialHint(g: GameState, view: View, levelId: number): string | null {
  if (levelId === 3 || levelId === 4) {
    if (g.offers.length) return '📱 Telefon çalıyor! Sağ üstten online siparişi kabul et.';
  }
  if (levelId > 2) return null;
  const ordering = g.customers.some((c) => c.state === 'ordering');
  if (view === 'salon') {
    if (ordering) return '👆 Ünlemli müşteriye dokun, siparişini al.';
    if (g.tickets.length) return '🔥 Alttan Mutfak’a geç ve kaseyi hazırla.';
    if (g.customers.some((c) => c.state === 'eating'))
      return levelId === 1 ? '😋 Afiyet olsun! Yeni müşteriler geliyor…' : null;
    return null;
  }
  const t = g.tickets.find((x) => x.id === g.activeTicket);
  if (!t) return ordering ? '🏮 Salonda bekleyen müşteri var!' : null;
  const b = g.bowls.find((x) => x.ticketId === t.id);
  if (!b?.noodle) {
    const pot = g.pots.find((p) => p.noodle === t.order.noodle);
    if (!pot) return `1️⃣ “${INGREDIENTS[t.order.noodle].name}” kutusuna dokun, tencereye atılsın.`;
    if (pot.t < COOK[pot.noodle!].ready)
      return '⏳ Erişte pişiyor… çubuk yeşile gelince tencereye dokun.';
    return '✅ Hazır! Şimdi tencereye dokun, erişte kaseye geçsin.';
  }
  if (b.broth !== t.order.broth)
    return `2️⃣ “${INGREDIENTS[t.order.broth].name}” tenceresine dokun, suyu dök.`;
  const missing = t.order.toppings.filter((x) => !b.toppings.includes(x));
  if (missing.length)
    return `3️⃣ Malzeme ekle: ${missing.map((m) => INGREDIENTS[m].name).join(', ')}`;
  return '🛎 Mükemmel görünüyor! Servis’e bas.';
}

function Condiments() {
  return (
    <svg viewBox="0 0 120 40" width="110" height="37" aria-hidden="true">
      <rect x="4" y="8" width="12" height="30" rx="3" fill="#3a1f12" />
      <rect x="6" y="2" width="8" height="8" rx="2" fill="#e94f37" />
      <rect x="20" y="14" width="12" height="24" rx="3" fill="#c0392b" />
      <rect x="22" y="9" width="8" height="6" rx="2" fill="#f4ede4" />
      <path d="M40 18 h20 l-3 20 h-14z" fill="#8a5530" />
      {[44, 48, 52, 56].map((x) => (
        <rect key={x} x={x} y={2} width="2.4" height="18" rx="1" fill="#e8c07d" />
      ))}
      <ellipse cx="86" cy="36" rx="14" ry="3" fill="#000" opacity=".25" />
      <path d="M76 30 q10 -26 20 0z" fill="#5cb85c" />
      <rect x="78" y="28" width="16" height="10" rx="3" fill="#f4ede4" />
    </svg>
  );
}
