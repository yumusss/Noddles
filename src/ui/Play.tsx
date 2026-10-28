// The playing screen: one canvas for the world (window + work table), React for words and buttons.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Engine } from '../core/engine';
import { type Day, type DecorSlot, GOAL_RATING } from '../game/data';
import { money, t, tx } from '../game/i18n';
import { Session } from '../game/session';
import { applyReply, ratingOf, type ReplyKind, type Save } from '../game/save';
import { sfx, unlockAudio } from '../game/audio';
import { anchors, bubbleVisible, renderWorld } from '../art/scene';
import { findHot, hitTest, type Hot } from '../art/hs';
import { panelLayout } from '../art/mini';
import { useLang } from '../App';
import Tablet, { Stars } from './Tablet';
import PauseMenu from './PauseMenu';
import { Avatar } from './Avatar';
import { PointerHand } from './icons';

interface Props {
  day: Day;
  save: Save;
  tipBonus: number;
  onDone: (s: Session) => void;
  onQuit: () => void;
  onRestart: () => void;
  onToggle: (k: 'sfx' | 'music') => void;
  onReplySaved: (id: string, kind: ReplyKind) => void;
}

declare global {
  interface Window {
    __session?: Session;
    __hot?: (id: string) => { x: number; y: number; w: number; h: number } | null;
  }
}

const OPEN_TIME = 3.2;

export default function Play({
  day,
  save,
  tipBonus,
  onDone,
  onQuit,
  onRestart,
  onToggle,
  onReplySaved,
}: Props) {
  const lang = useLang();
  const session = useMemo(() => new Session(day, { tipBonus }), [day, tipBonus]);
  useSyncExternalStore(
    (f) => session.on(f),
    () => session.version
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const pipRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ scale: 1, portrait: false });
  const [paused, setPaused] = useState(false);
  const [tablet, setTablet] = useState(false);
  const [opening, setOpening] = useState(true);
  const [pop, setPop] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const decor = save.equipped as Record<DecorSlot, string>;
  const pausedRef = useRef(false);
  pausedRef.current = paused || tablet;

  // ---------- engine ----------
  useEffect(() => {
    const eng = new Engine(canvasRef.current!);
    engineRef.current = eng;
    eng.stations = 1;
    window.__session = session;
    eng.onResize = (v) => setView({ scale: v.scale, portrait: v.portrait });
    eng.resize();
    const t0 = performance.now();
    eng.onFrame = (c, v, time, dt) => {
      if (!session.started && (performance.now() - t0) / 1000 > OPEN_TIME) {
        session.started = true;
        setOpening(false);
      }
      if (!pausedRef.current) session.tick(dt);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      c.fillStyle = '#2b2230';
      c.fillRect(0, 0, v.W, v.H);
      renderWorld(
        c,
        { W: v.W, H: v.H, portrait: v.portrait, scale: v.scale, dpr },
        session,
        time,
        decor
      );
      place(eng);
    };
    eng.start();
    const tick = setInterval(() => setTick((x) => x + 1), 90);
    return () => {
      clearInterval(tick);
      eng.destroy();
      if (window.__session === session) delete window.__session;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // the day is over: show the banner, then go to the ledger (once)
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const over = session.over;
  useEffect(() => {
    if (!over) return;
    // no cleanup on re-render: the timer must survive the banner's own state change
    const id = window.setTimeout(() => doneRef.current(session), 1800);
    return () => window.clearTimeout(id);
  }, [over, session]);

  // little "new review" pop when a review is posted
  const lastId = session.lastReview?.id;
  useEffect(() => {
    if (!lastId) return;
    setPop(lastId);
    sfx('star');
    const id = setTimeout(() => setPop(null), 3200);
    return () => clearTimeout(id);
  }, [lastId]);

  // ---------- DOM overlays follow the canvas ----------
  function place(eng: Engine) {
    const v = eng.view;
    const sc = v.scale;
    const b = bubbleRef.current;
    if (b) {
      const a = anchors.bubble;
      b.style.transform = `translate(${a.x * sc}px, ${a.y * sc}px)`;
      b.style.width = `${a.w * sc}px`;
    }
    const p = pipRef.current;
    if (p) {
      const L = anchors.layout;
      const right = L ? L.pip.x * sc : 0;
      p.style.right = `${Math.max(8, v.cssW - right - 30)}px`;
      p.style.top = `${((anchors.layout?.sillY ?? 0) + (anchors.layout?.sillH ?? 0) + 8) * sc}px`;
    }
    const ptr = pointerRef.current;
    if (ptr) {
      const target = ptr.dataset.target ?? '';
      let pt: { x: number; y: number } | null = null;
      if (target.startsWith('tray:') || target === 'plate') {
        const h = findHot(target);
        if (h) pt = { x: (h.x + h.w / 2) * sc, y: (h.y + h.h * 0.45) * sc };
      } else if (target) {
        const el = document.getElementById('hint-' + target);
        const wr = wrapRef.current?.getBoundingClientRect();
        if (el && wr) {
          const r = el.getBoundingClientRect();
          pt = { x: r.left - wr.left + r.width / 2, y: r.top - wr.top + r.height / 2 };
        }
      }
      ptr.style.opacity = pt ? '1' : '0';
      if (pt) ptr.style.transform = `translate(${pt.x - 10}px, ${pt.y + 4}px)`;
    }
  }

  // ---------- input ----------
  const g = useRef<{
    id: number;
    hot: Hot | null;
    hold: 'rice' | 'boardRice' | 'roll' | 'sear' | null;
  } | null>(null);

  const world = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    const sc = engineRef.current!.view.scale;
    return { x: (e.clientX - r.left) / sc, y: (e.clientY - r.top) / sc };
  };
  const plateLocal = (w: { x: number; y: number }) => {
    const L = anchors.layout!;
    return { x: (w.x - L.plate.x) / L.plate.u, y: (w.y - L.plate.y) / L.plate.u };
  };
  const matUnits = () => panelLayout(anchors.layout!).board.h;

  const onDown = (e: React.PointerEvent) => {
    if (opening || paused || tablet || session.over) return;
    unlockAudio();
    const w = world(e);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const hot = hitTest(w.x, w.y);
    let hold: 'rice' | 'boardRice' | 'roll' | 'sear' | null = null;
    if (hot?.id === 'mini:mat') {
      const b = session.board;
      if (b.m === 'maki' && b.stage === 'rice') {
        session.boardRiceStart();
        hold = 'boardRice';
      } else if (b.m === 'maki' && b.stage === 'fill') {
        if (session.rollStart(w.y / matUnits(), true)) hold = 'roll';
      }
    } else if (hot?.id === 'plate' && session.hand?.k === 'torch') {
      const p = plateLocal(w);
      if (session.searStart(p.x, p.y)) hold = 'sear';
    }
    g.current = { id: e.pointerId, hot, hold };
  };
  const onMove = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s || s.id !== e.pointerId) return;
    if (s.hold === 'roll') session.rollMove(world(e).y / matUnits());
  };
  const onUp = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s || s.id !== e.pointerId) return;
    g.current = null;
    if (s.hold === 'rice') return session.squeezeEnd();
    if (s.hold === 'boardRice') return session.boardRiceEnd();
    if (s.hold === 'roll') return session.rollEnd();
    if (s.hold === 'sear') return session.searEnd();
    if (s.hot) tap(s.hot, world(e));
  };

  function tap(h: Hot, w: { x: number; y: number }) {
    const [a, b, c] = h.id.split(':');
    switch (a) {
      case 'plate': {
        const p = plateLocal(w);
        session.tapPlate(p.x, p.y);
        break;
      }
      case 'tray':
        session.pickTray(b as never);
        break;
      case 'hand':
        session.dropHand();
        sfx('tap');
        break;
      case 'tool':
        if (b === 'mat') session.openMaki();
        if (b === 'knife') session.openSashimi();
        if (b === 'torch') session.pickTorch();
        break;
      case 'rack':
        session.setPlate(b as never);
        break;
      case 'trash':
        session.trash();
        break;
      case 'pip':
        sfx('bubble');
        break;
      case 'mini':
        if (b === 'close') session.closeBoard();
        else if (b === 'fish') session.pickFish(c as never);
        else if (b === 'style') session.boardStyle(c as never);
        else if (b === 'fill') session.toggleFill(c as never);
        else if (b === 'coat') session.setCoat(c as never);
        else if (b === 'count') session.setCount(Number(c));
        else if (b === 'cut') session.cutTap();
        break;
    }
  }

  useEffect(() => {
    window.__hot = (id: string) => {
      const h = findHot(id);
      const eng = engineRef.current;
      if (!h || !eng) return null;
      const r = canvasRef.current!.getBoundingClientRect();
      const sc = eng.view.scale;
      return {
        x: r.left + (h.x + h.w / 2) * sc,
        y: r.top + (h.y + h.h / 2) * sc,
        w: h.w * sc,
        h: h.h * sc,
      };
    };
    return () => {
      delete window.__hot;
    };
  }, []);

  // ---------- derived ----------
  const cu = session.cust;
  const showBubble = bubbleVisible(cu);
  const typed = cu?.line ? cu.line().slice(0, session.shown(cu)) : '';
  const choices = cu && showBubble && session.lineDone(cu) ? session.choices() : [];
  const hint = session.hint();
  const allReviews = [...save.reviews, ...session.reviews];
  const rating = ratingOf(allReviews);
  const ringing = session.ringing;
  const L = anchors.layout;
  const serveBox = L?.serve;
  const canServe = session.canServe() && session.board.m === 'idle';
  const left = session.timeLeft;
  const popReview = pop ? session.reviews.find((r) => r.id === pop) : null;

  const replyFromTablet = (id: string, kind: ReplyKind) => {
    const r = session.reviews.find((x) => x.id === id);
    if (r) {
      applyReply(r, kind);
      session.bump();
    } else onReplySaved(id, kind);
  };

  return (
    <div
      className={'screen play' + (view.portrait ? ' portrait' : ' landscape')}
      ref={wrapRef}
      style={{ ['--k' as string]: String(Math.max(0.72, Math.min(1.05, view.scale * 1.15))) }}>
      <canvas
        ref={canvasRef}
        className="world"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      {/* HUD */}
      <div className={'hud' + (opening ? ' hide' : '')}>
        <div className="hud-left">
          <div className="chip-day">{t('day', { n: day.n })}</div>
          <div className="chip-clock">
            <span className="clock-dot" /> {session.clock}
            <i className="time-bar">
              <b style={{ width: `${(left / day.duration) * 100}%` }} />
            </i>
          </div>
        </div>
        <div className="hud-right">
          <div className="chip-money">
            {money(session.ledger.sales + session.ledger.tips + session.ledger.bonus)}
          </div>
          <button
            className={'chip-rating' + (rating >= GOAL_RATING ? ' ok' : '')}
            onClick={() => setTablet(true)}
            id="hint-tablet">
            <span className="yumm-dot">N</span>
            <b>{rating.toFixed(1)}</b>
            <Stars n={rating} size={13} />
            {ringing && <i className="ring-dot" />}
          </button>
          <button className="round-btn" onClick={() => setPaused(true)} aria-label={t('pause')}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* speech bubble with reply buttons */}
      <div
        ref={bubbleRef}
        className={
          'bubble' +
          (showBubble && !opening ? '' : ' hide') +
          (cu && cu.sat < 55 && cu.state !== 'wait' && cu.state !== 'order' ? ' sad' : '')
        }>
        {cu && (
          <div className="bubble-head">
            <b>{session.nameOf(cu)}</b>
          </div>
        )}
        <p>{typed}</p>
        {choices.length > 0 && (
          <div className="choices" id="hint-choices">
            {choices.map((ch) => (
              <button
                key={ch.id}
                className={'choice ' + ch.id}
                onClick={() => session.answer(ch.id)}>
                {tx(ch.label)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* tablet ringing */}
      {ringing && !tablet && (
        <div className="ring-bubble">
          <b>{t('tabletRinging')}</b>
          <button className="btn coral small" onClick={() => session.acceptOnline()}>
            {t('accept')}
          </button>
        </div>
      )}

      {/* serve */}
      {serveBox && !opening && session.board.m === 'idle' && (
        <button
          id="hint-serve"
          className={'serve-btn' + (canServe ? ' ready' : '')}
          disabled={!canServe}
          style={{
            left: (serveBox.x - serveBox.w / 2) * view.scale,
            top: (serveBox.y - serveBox.h / 2) * view.scale,
            width: serveBox.w * view.scale,
            height: serveBox.h * view.scale,
          }}
          onClick={() => session.serve()}>
          {session.activeOnline ? t('pack') : t('serve')}
        </button>
      )}

      {/* toasts */}
      <div className="toasts">
        {session.toasts.map((x) => (
          <div key={x.id} className={'toast ' + x.kind}>
            {x.text}
          </div>
        ))}
      </div>

      {/* a new review pops up from the rating chip */}
      {popReview && (
        <div
          className={'review-pop' + (popReview.stars <= 2 ? ' bad' : '')}
          onClick={() => setTablet(true)}>
          <Avatar
            species={popReview.species}
            seed={popReview.seed}
            special={popReview.special}
            size={38}
            mood={popReview.stars >= 4 ? 'happy' : popReview.stars <= 2 ? 'angry' : 'neutral'}
          />
          <div>
            <small>{t('newReview')}</small>
            <Stars n={popReview.stars} size={13} />
            <p>{tx(popReview.text)}</p>
          </div>
        </div>
      )}

      {/* Pip's tips on day 1 */}
      {hint && !opening && !paused && !tablet && (
        <>
          <div ref={pipRef} className="pip-bubble">
            {tx(hint.text)}
          </div>
          <div ref={pointerRef} className="pointer" data-target={hint.target ?? ''}>
            <PointerHand />
          </div>
        </>
      )}

      {/* opening: wooden shutters slide apart */}
      <div className={'shutters' + (opening ? ' closed' : '')}>
        <div className="shutter l" />
        <div className="shutter r" />
        <div className="shutter-title">
          <small>{t('day', { n: day.n })}</small>
          <h1>{tx(day.title)}</h1>
        </div>
      </div>

      {session.over && (
        <div className="over-banner">
          <h2>{t('dayOver')}</h2>
        </div>
      )}

      {tablet && (
        <Tablet
          reviews={allReviews}
          history={save.history}
          session={session}
          onReply={replyFromTablet}
          onClose={() => setTablet(false)}
        />
      )}
      {paused && (
        <PauseMenu
          save={save}
          onResume={() => setPaused(false)}
          onQuit={onQuit}
          onRestart={onRestart}
          onToggle={onToggle}
          lang={lang}
        />
      )}
    </div>
  );
}
