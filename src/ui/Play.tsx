// The playing screen: one full-screen canvas for the world, React layers for text and buttons.

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Engine } from '../core/engine';
import { type Day, type DecorSlot, SPEAKERS } from '../game/data';
import { money, t, tx } from '../game/i18n';
import { ticketRows } from '../game/orders';
import { Session } from '../game/session';
import type { Save } from '../game/save';
import { sfx, unlockAudio, buzz } from '../game/audio';
import { anchors, renderWorld } from '../art/scene';
import { findHot, hitTest, type Hot } from '../art/hs';
import { boardLayout } from '../art/board';
import { prepLayout } from '../art/prep';
import { useLang } from '../App';
import Tablet from './Tablet';
import PauseMenu from './PauseMenu';
import { StationIcon, PointerHand } from './icons';

interface Props {
  day: Day;
  save: Save;
  tipBonus: number;
  onDone: (s: Session) => void;
  onQuit: () => void;
  onRestart: () => void;
  onToggle: (k: 'sfx' | 'music') => void;
}

declare global {
  interface Window {
    __session?: Session;
    __engine?: Engine;
    __tap?: (id: string, lx?: number, ly?: number) => void;
    __hot?: (id: string) => { x: number; y: number } | null;
  }
}

const CINE = 3.4;

export default function Play({ day, save, tipBonus, onDone, onQuit, onRestart, onToggle }: Props) {
  const lang = useLang();
  const session = useMemo(() => new Session(day, { tipBonus }), [day, tipBonus]);
  useSyncExternalStore(
    (f) => session.on(f),
    () => session.version
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const tabletBubbleRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [portrait, setPortrait] = useState(false);
  const [station, setStation] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tablet, setTablet] = useState(false);
  const [cine, setCine] = useState(true);
  const [ticketFold, setTicketFold] = useState(false);
  const [overShown, setOverShown] = useState(false);
  const decor = save.equipped as Record<DecorSlot, string>;
  const stations = session.station2 ? 3 : 2;
  const pausedRef = useRef(false);
  pausedRef.current = paused || tablet;

  // ---------- engine & frame loop ----------
  useEffect(() => {
    const cv = canvasRef.current!;
    const eng = new Engine(cv);
    engineRef.current = eng;
    eng.stations = stations;
    window.__session = session;
    window.__engine = eng;
    const dpr = () => Math.min(window.devicePixelRatio || 1, 2.5);
    eng.onResize = (v) => {
      setScale(v.scale);
      setPortrait(v.portrait);
    };
    eng.resize();
    // opening shot: from the kitchen to the dining room
    eng.camX = eng.maxCam;
    const t0 = performance.now();
    let lastStation = -1;
    eng.onFrame = (c, v, time, dt) => {
      const el = (performance.now() - t0) / 1000;
      if (el < CINE) {
        const k = Math.min(1, Math.max(0, (el - 0.5) / 2.2));
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        eng.camX = eng.maxCam * (1 - e);
        eng.camTarget = null;
      } else if (!session.started) {
        session.started = true;
        setCine(false);
      }
      if (!pausedRef.current) session.tick(dt);
      if (session.wantStation !== null) {
        eng.snapTo(session.wantStation);
        session.wantStation = null;
      }
      const st = eng.station;
      session.station = st;
      if (st !== lastStation) {
        lastStation = st;
        setStation(st);
      }
      c.fillStyle = '#f7ead6';
      c.fillRect(0, 0, v.W, v.H);
      renderWorld(
        c,
        { W: v.W, H: v.H, portrait: v.portrait, scale: v.scale, dpr: dpr() },
        eng.camX,
        session,
        time,
        decor,
        stations
      );
      placeOverlays(eng);
    };
    eng.start();
    return () => {
      eng.destroy();
      if (window.__session === session) delete window.__session;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // light re-render ticker: typewriter speech, clock and patience bar
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 90);
    return () => clearInterval(id);
  }, []);

  // the day ends → show a banner, then the ledger
  useEffect(() => {
    if (session.over && !overShown) {
      setOverShown(true);
      const id = setTimeout(() => onDone(session), 1800);
      return () => clearTimeout(id);
    }
  }, [session.over, overShown, onDone, session]);

  // re-snap the camera when the orientation flips
  useEffect(() => {
    const eng = engineRef.current;
    if (eng && !cine) eng.snapTo(eng.station);
  }, [portrait, cine]);

  // ---------- DOM overlays positioned from world anchors ----------
  function placeOverlays(eng: Engine) {
    const v = eng.view;
    const b = bubbleRef.current;
    if (b) {
      const x = (anchors.head.x - eng.camX) * v.scale;
      const y = anchors.head.y * v.scale;
      const w = b.offsetWidth;
      const right = x + 70 * v.scale + w < v.cssW - 8;
      const left = right ? x + 62 * v.scale : x - 62 * v.scale - w;
      b.style.transform = `translate(${Math.max(8, Math.min(v.cssW - w - 8, left))}px, ${Math.max(150 * v.scale, y - b.offsetHeight * 0.5)}px)`;
      b.dataset.side = right ? 'r' : 'l';
    }
    const tb = tabletBubbleRef.current;
    if (tb) {
      const x = (anchors.tablet.x - eng.camX) * v.scale;
      const y = anchors.tablet.y * v.scale;
      tb.style.transform = `translate(${x - tb.offsetWidth / 2}px, ${y - tb.offsetHeight - 14}px)`;
    }
    const p = pointerRef.current;
    if (p) {
      const target = p.dataset.target ?? '';
      let pt: { x: number; y: number } | null = null;
      if (target.startsWith('tub:') || target === 'plate') {
        const h = findHot(target);
        if (h) pt = { x: (h.x + h.w / 2 - eng.camX) * v.scale, y: (h.y + h.h * 0.45) * v.scale };
      } else if (target) {
        const el = document.getElementById('hint-' + target);
        const wr = wrapRef.current?.getBoundingClientRect();
        if (el && wr) {
          const r = el.getBoundingClientRect();
          pt = { x: r.left - wr.left + r.width / 2, y: r.top - wr.top + r.height / 2 };
        }
      }
      if (pt) {
        p.style.opacity = '1';
        p.style.transform = `translate(${pt.x - 10}px, ${pt.y + 4}px)`;
      } else p.style.opacity = '0';
    }
  }

  // ---------- input ----------
  const g = useRef<{
    id: number;
    sx: number;
    sy: number;
    hot: Hot | null;
    cam: number;
    swipe: boolean;
    hold: 'rice' | 'boardRice' | 'roll' | null;
    lastX: number;
    lastT: number;
    vx: number;
  } | null>(null);

  const toWorld = (e: React.PointerEvent) => {
    const eng = engineRef.current!;
    const r = canvasRef.current!.getBoundingClientRect();
    return { ...eng.toWorld(e.clientX - r.left, e.clientY - r.top), px: e.clientX, py: e.clientY };
  };

  const boardH = () => {
    const v = engineRef.current!.view;
    return boardLayout(v.W, v.H, v.portrait, session.heatOn).board.h;
  };

  const onDown = (e: React.PointerEvent) => {
    if (cine || paused || tablet) return;
    unlockAudio();
    const eng = engineRef.current!;
    const w = toWorld(e);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const hot = hitTest(w.x, w.y);
    let hold: 'rice' | 'boardRice' | 'roll' | null = null;
    if (hot?.hold) {
      if (hot.id === 'tub:rice') {
        session.squeezeStart();
        hold = 'rice';
      } else if (hot.id === 'board:mat') {
        const b = session.board;
        if ((b.m === 'maki' || b.m === 'temaki') && b.stage === 'rice') {
          session.boardRiceStart();
          hold = 'boardRice';
        } else if (b.m === 'maki' && b.stage === 'fill') {
          if (session.rollStart(w.y / boardH(), true)) hold = 'roll';
        }
      }
    }
    g.current = {
      id: e.pointerId,
      sx: w.px,
      sy: w.py,
      hot,
      cam: eng.camX,
      swipe: false,
      hold,
      lastX: w.px,
      lastT: performance.now(),
      vx: 0,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s || s.id !== e.pointerId) return;
    const eng = engineRef.current!;
    const w = toWorld(e);
    if (s.hold === 'roll') {
      session.rollMove(w.y / boardH());
      return;
    }
    if (s.hold) return;
    const dx = w.px - s.sx;
    if (!s.swipe && Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(w.py - s.sy)) s.swipe = true;
    if (s.swipe) {
      eng.camTarget = null;
      eng.camVel = 0;
      eng.camX = Math.max(0, Math.min(eng.maxCam, s.cam - dx / eng.view.scale));
      const now = performance.now();
      const dt = Math.max(1, now - s.lastT);
      s.vx = (-(w.px - s.lastX) / eng.view.scale / dt) * 1000;
      s.lastX = w.px;
      s.lastT = now;
    }
  };

  const onUp = (e: React.PointerEvent) => {
    const s = g.current;
    if (!s || s.id !== e.pointerId) return;
    g.current = null;
    const eng = engineRef.current!;
    if (s.hold === 'rice') return session.squeezeEnd();
    if (s.hold === 'boardRice') return session.boardRiceEnd();
    if (s.hold === 'roll') return session.rollEnd();
    if (s.swipe) {
      // fling to the next station
      const v = eng.view;
      const frac = eng.camX / v.W;
      let target = Math.round(frac);
      if (s.vx > 400) target = Math.ceil(frac);
      if (s.vx < -400) target = Math.floor(frac);
      eng.snapTo(target);
      return;
    }
    const w = toWorld(e);
    if (s.hot) tap(s.hot, w.x, w.y);
  };

  function tap(h: Hot, wx: number, wy: number) {
    const id = h.id;
    const v = engineRef.current!.view;
    if (id === 'plate') {
      const L = prepLayout(v.W, v.H, v.portrait, session.prepTubs(), session.plates);
      const ox = v.W;
      session.tapPlate((wx - ox - L.plate.x) / L.plate.u, (wy - L.plate.y) / L.plate.u);
      return;
    }
    act(id);
  }

  function act(id: string) {
    const [a, b, c] = id.split(':');
    switch (a) {
      case 'tub':
        session.pickTub(b as never);
        break;
      case 'hand':
        session.dropHand();
        sfx('tap');
        break;
      case 'rack':
        session.setPlate(b as never);
        break;
      case 'trash':
        session.trash();
        break;
      case 'board':
        if (b === 'maki' || b === 'temaki') session.boardStart(b);
        else if (b === 'fish') session.boardFish(c as never);
        else if (b === 'style') session.boardStyle(c as never);
        else if (b === 'fill') session.toggleFill(c as never);
        else if (b === 'coat') session.setCoat(c as never);
        else if (b === 'count') session.setCount(Number(c));
        else if (b === 'cut') session.cutTap();
        else if (b === 'reset') session.boardReset();
        else if (b === 'cone') session.temakiMake();
        break;
      case 'heat': {
        const dev = b as 'fryer' | 'grill';
        if (c === 'start') session.heatStart(dev);
        else if (c === 'take') session.heatTake(dev);
        else if (session.heat[dev]) session.heatTake(dev);
        else session.heatStart(dev);
        break;
      }
      case 'customer':
        if (session.hand?.k === 'plate') session.serve();
        break;
      case 'tablet':
        if (session.ringing) session.acceptOnline();
        else {
          setTablet(true);
          sfx('tap');
        }
        break;
      case 'inky':
        sfx('bubble');
        buzz(8);
        break;
    }
  }

  // test hook: tap a hotspot by id (or plate-local coordinates)
  useEffect(() => {
    // test hook: screen (CSS px, relative to the canvas) center of a hotspot
    window.__hot = (id: string) => {
      const h = findHot(id);
      const eng = engineRef.current;
      if (!h || !eng) return null;
      const r = canvasRef.current!.getBoundingClientRect();
      return {
        x: r.left + (h.x + h.w / 2 - eng.camX) * eng.view.scale,
        y: r.top + (h.y + h.h / 2) * eng.view.scale,
      };
    };
    window.__tap = (id: string, lx?: number, ly?: number) => {
      if (id === 'plate') session.tapPlate(lx ?? 0, ly ?? 0);
      else act(id);
    };
    return () => {
      delete window.__tap;
    };
  });

  const go = (i: number) => {
    sfx('whoosh');
    engineRef.current?.snapTo(i);
  };

  // ---------- derived UI state ----------
  const cu = session.counter;
  const order = session.activeOrder;
  const rows = order ? ticketRows(order, session.plate.pieces, session.plate.id) : [];
  const showTicket = !!order && (session.activeOnline || cu?.state === 'wait');
  const patience = session.activeOnline
    ? Math.max(0, 1 - session.activeOnline.age / 240)
    : cu
      ? Math.max(0, cu.patience / cu.patienceMax)
      : 1;
  let speech = '';
  if (cu && station === 0) {
    if (cu.state === 'order') speech = cu.say().slice(0, Math.floor(cu.sayAt * 32));
    else if (cu.state === 'react' || cu.state === 'complain') speech = session.reactSpeech(cu);
    else if (cu.state === 'pay') {
      speech =
        session.drawer.warn > 0
          ? tx({
              tr: `Eksik oldu! ${money(cu.cash - cu.bill)} olacaktı.`,
              en: `That’s short! It should be ${money(cu.cash - cu.bill)}.`,
            })
          : session.paySpeech(cu);
    }
  }
  const hint = session.hint();
  const canServe = session.canServe() && (station === 1 || session.hand?.k === 'plate');
  const ringing = session.ringing;
  const salonAlert =
    !!ringing || cu?.state === 'pay' || cu?.state === 'complain' || cu?.state === 'order';

  return (
    <div className="screen play" ref={wrapRef} style={{ ['--u' as string]: `${scale}px` }}>
      <canvas
        ref={canvasRef}
        className="world"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      {/* top HUD */}
      <div className={'hud' + (cine ? ' hide' : '')}>
        <div className="hud-left">
          <div className="chip-day">{t('day', { n: day.n })}</div>
          <div className="chip-clock">
            <span className="clock-dot" /> {session.clock}
          </div>
        </div>
        <div className={'stations' + (portrait ? ' icons' : '')}>
          {Array.from({ length: stations }, (_, i) => (
            <button
              key={i}
              id={'hint-st' + i}
              className={'st-btn' + (station === i ? ' on' : '')}
              onClick={() => go(i)}
              aria-label={[t('stSalon'), t('stPrep'), t('stCut')][i]}>
              <StationIcon i={i} />
              {!portrait && <span>{[t('stSalon'), t('stPrep'), t('stCut')][i]}</span>}
              {i === 0 && salonAlert && station !== 0 && <i className="dot" />}
            </button>
          ))}
        </div>
        <div className="hud-right">
          <div className="chip-money">{money(session.ledger.sales + session.ledger.tips)}</div>
          <button className="round-btn" onClick={() => setPaused(true)} aria-label={t('pause')}>
            <svg viewBox="0 0 24 24" width="20" height="20">
              <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
              <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* ticket rail with the paper order */}
      <div className={'rail' + (cine ? ' hide' : '')}>
        <div className="rail-bar" />
        {showTicket && order && (
          <div
            className={
              'ticket' + (ticketFold ? ' fold' : '') + (session.activeOnline ? ' online' : '')
            }
            onClick={() => setTicketFold((f) => !f)}>
            <div className="clip" />
            <div className="ticket-head">
              <span>
                {session.activeOnline
                  ? t('online')
                  : '#' + String((cu?.id ?? 0) % 1000).padStart(3, '0')}
              </span>
              <span>
                {session.activeOnline
                  ? session.name(session.activeOnline)
                  : cu
                    ? cu.special
                      ? tx(SPEAKERS[cu.special])
                      : session.name(cu)
                    : ''}
              </span>
            </div>
            {!ticketFold ? (
              <ul>
                {rows.map((r, i) => (
                  <li key={i} className={(r.ok ? 'ok' : '') + (r.bad ? ' bad' : '')}>
                    <span className="box">{r.ok ? '☑' : '☐'}</span>
                    <span className="txt">
                      {r.text}
                      {r.sub && <em>{r.sub}</em>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="fold-line">{rows.map((r) => r.text).join(' · ')}</div>
            )}
            <div className="patience">
              <i
                style={{
                  width: `${patience * 100}%`,
                  background: patience > 0.6 ? '#8fbf74' : patience > 0.3 ? '#e9b45c' : '#d9573f',
                }}
              />
            </div>
            <div className="tear" />
          </div>
        )}
      </div>

      {/* speech bubble */}
      <div
        ref={bubbleRef}
        className={'bubble' + (speech ? '' : ' hide') + (cu?.state === 'complain' ? ' angry' : '')}>
        {cu && <b>{cu.special ? tx(SPEAKERS[cu.special]) : session.name(cu)}</b>}
        <p>{speech}</p>
        {cu?.state === 'complain' && (
          <button id="hint-apologize" className="btn coral" onClick={() => session.apologize()}>
            {t('apologize')}
          </button>
        )}
      </div>

      {/* tablet ringing */}
      <div
        ref={tabletBubbleRef}
        className={'tablet-bubble' + (ringing && station === 0 && !cine ? '' : ' hide')}>
        <b>{t('tabletRinging')}</b>
        <button className="btn coral" onClick={() => session.acceptOnline()}>
          {t('accept')}
        </button>
      </div>

      {/* cash drawer */}
      {cu?.state === 'pay' && session.drawer.open && station === 0 && (
        <div className="drawer" id="hint-drawer">
          <div className="drawer-sum">
            {t('youGive')}: <b>{money(session.givenTotal)}</b>
          </div>
          <div className="drawer-money">
            {[1, 5, 10, 20, 50, 100].map((v) => (
              <button
                key={v}
                className={'cash ' + (v < 5 ? 'coin' : 'note n' + v)}
                onClick={() => session.addMoney(v)}>
                {money(v)}
              </button>
            ))}
          </div>
          <div className="drawer-act">
            <button className="btn ghost" onClick={() => session.clearMoney()}>
              {t('clear')}
            </button>
            <button className="btn green" onClick={() => session.giveChange()}>
              {t('give')}
            </button>
          </div>
        </div>
      )}

      {/* serve */}
      {canServe && !cine && (
        <button id="hint-serve" className="serve-btn" onClick={() => session.serve()}>
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

      {/* day-1 hints */}
      {hint && !cine && !paused && !tablet && (
        <>
          <div
            className={
              'hint-bar' +
              (session.drawer.open ? ' up' : '') +
              (station > 0 && !canServe ? ' top' : '')
            }>
            {tx(hint.text)}
          </div>
          <div ref={pointerRef} className="pointer" data-target={hint.target ?? ''}>
            <PointerHand />
          </div>
        </>
      )}

      {/* cinematic bars and title */}
      <div className={'cine' + (cine ? ' on' : '')}>
        <div className="bar top" />
        <div className="bar bottom" />
        <div className="cine-title">
          <small>{t('day', { n: day.n })}</small>
          <h1>{tx(day.title)}</h1>
        </div>
      </div>

      {session.over && (
        <div className="over-banner">
          <h2>{t('dayOver')}</h2>
        </div>
      )}

      {tablet && <Tablet s={session} save={save} onClose={() => setTablet(false)} />}
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
