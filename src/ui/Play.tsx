import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Save } from '../App';
import { DaySession, type DayResult } from '../game/session';
import { LEVELS } from '../game/data';
import { DENOMS, fmt, sum } from '../game/money';
import { COOK_LABEL } from '../game/bowl';
import { sfx } from '../game/audio';
import Tablet from './Tablet';
import HowTo from './HowTo';
import { L, T } from '../game/i18n';

export default function Play({
  levelId,
  save,
  onToggle,
  onLang,
  onDone,
  onQuit,
  onRestart,
}: {
  levelId: number;
  save: Save;
  onToggle: (k: 'sfx' | 'music') => void;
  onLang: () => void;
  onDone: (r: DayResult, tipCoins: number) => void;
  onQuit: () => void;
  onRestart: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<DaySession | null>(null);
  const [paused, setPaused] = useState(false);
  const [tablet, setTablet] = useState(false);
  const [howto, setHowto] = useState(levelId === 1);
  const level = LEVELS[levelId - 1];

  useEffect(() => {
    const s = new DaySession(canvasRef.current!, levelId, save.decor, save.cash, save.tipCoins);
    s.onDayEnd = (r) => onDone(r, s.tipJarCoins);
    s.onOpenTablet = () => setTablet(true);
    (window as unknown as { __session?: DaySession }).__session = s; // for automated testing
    setSession(s);
    let raf = 0;
    const tick = () => {
      if (worldRef.current)
        worldRef.current.style.transform = `translateX(${-s.engine.camX * s.engine.view.scale}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      s.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId]);

  useEffect(() => {
    if (!session) return;
    if (paused || tablet || howto) session.engine.stop();
    else session.engine.start();
  }, [paused, tablet, howto, session]);

  return (
    <div className="screen play">
      <canvas ref={canvasRef} className="game-canvas" />
      {session && <Overlays s={session} worldRef={worldRef} onPause={() => setPaused(true)} />}
      {howto && <HowTo onClose={() => setHowto(false)} />}
      {tablet && session && (
        <Tablet
          levelId={levelId}
          reviews={[...(save.reviews ?? []), ...session.reviews]}
          openOrders={session.open.map((o) => ({
            who: o.cu.members[o.mi].name,
            lines: o.lines,
            phone: o.cu.phone,
          }))}
          stats={{
            earned: session.earned,
            sales: session.ledger.sales,
            tips: session.ledger.tips,
            bowls: session.ledger.bowls,
            scores: [...session.scores],
            lost: session.lost,
            complaints: session.complaints,
            jar: session.tipJarCoins,
          }}
          stars={save.stars}
          music={save.music}
          onToggleMusic={() => onToggle('music')}
          onClose={() => setTablet(false)}
        />
      )}
      {paused && session && (
        <div className="modal-veil">
          <div className="modal">
            <h2>{T('play.pause')}</h2>
            <p>
              {T('map.day', { n: level.id })} · {L(level.title)}
            </p>
            <div className="modal-row">
              <button className="btn ghost" onClick={() => onToggle('sfx')}>
                {save.sfx ? T('play.sfxOn') : T('play.sfxOff')}
              </button>
              <button className="btn ghost" onClick={() => onToggle('music')}>
                {save.music ? T('play.musicOn') : T('play.musicOff')}
              </button>
              <button className="btn ghost" onClick={onLang}>
                {T('map.lang')}
              </button>
            </div>
            {levelId === 1 && (
              <button
                className="btn ghost"
                onClick={() => {
                  setPaused(false);
                  setHowto(true);
                }}>
                {T('play.howto')}
              </button>
            )}
            <button className="btn big primary" onClick={() => setPaused(false)}>
              {T('play.resume')}
            </button>
            <div className="modal-row">
              <button className="btn" onClick={onRestart}>
                {T('play.restart')}
              </button>
              <button className="btn danger" onClick={onQuit}>
                {T('play.toMap')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Overlays({
  s,
  worldRef,
  onPause,
}: {
  s: DaySession;
  worldRef: React.RefObject<HTMLDivElement | null>;
  onPause: () => void;
}) {
  const ui = useSyncExternalStore(
    (fn) => s.subscribe(fn),
    () => s.snapshot()
  );
  const [open, setOpen] = useState<number | null>(null);
  const v = s.engine.view;
  const sc = v.scale;
  const S = s.salL;
  const stations = [T('play.salon'), T('play.prep'), T('play.stove')];
  const stationIcons = ['🍽️', '🥣', '🔥'];
  const b = ui.bubble;
  const anchorXw =
    b?.at === 'phone' ? S.phone.x + S.phone.w / 2 : b?.at === 'pickup' ? s.pickupX() : s.counterX();
  const anchorX = anchorXw * sc;
  const bubbleY = (b?.at === 'phone' ? S.phone.y - 10 : S.customer.y - S.customer.size - 8) * sc;
  const bw = Math.min(v.cssW * 0.78, 460);
  const bubbleX = Math.max(bw / 2 + 8, Math.min(v.cssW - bw / 2 - 8, anchorX));
  const textLen = b?.text.length ?? 0;
  const lines = Math.max(1, Math.ceil((textLen * 9.5) / (bw - 32)));
  const estH = 46 + lines * 24;
  const bubbleYc = Math.max(bubbleY, 54 + estH);
  const tail = Math.max(24, Math.min(bw - 24, anchorX - (bubbleX - bw / 2)));
  const cash = ui.cash;
  const need = cash ? sum(cash.given) - cash.due : 0;
  const giving = cash ? sum(cash.giving) : 0;
  const cookPill =
    ui.cook && ui.cookWhere ? (
      <span className={`chip cook cook-${ui.cook}`}>
        {ui.cookWhere === 'stove' ? '🔥 ' : '🍜 '}
        {L(COOK_LABEL[ui.cook])}
      </span>
    ) : null;

  return (
    <>
      <div className="world-layer" ref={worldRef}>
        {b && (
          <div
            className={`bubble ${b.phone ? 'phone' : ''} tone-${b.tone ?? 'neutral'}`}
            style={{ left: bubbleX, top: bubbleYc, width: bw, ['--tail' as string]: `${tail}px` }}>
            <span className="bubble-name">
              {b.phone ? '📱 ' : ''}
              {b.name}
            </span>
            <p>
              {b.text.slice(0, b.shown)}
              {b.shown < b.text.length && <span className="caret">▍</span>}
            </p>
          </div>
        )}
      </div>
      <header className="hud">
        <button className="btn ghost small" onClick={onPause} aria-label={T('play.pause')}>
          ❚❚
        </button>
        <div className="hud-mid">
          <span
            className={`day-dial ${ui.clock > 0.85 ? 'late' : ''}`}
            style={{
              ['--p' as string]: `${(ui.clock * 100).toFixed(1)}%`,
              ['--a' as string]: `${(ui.clock * 360).toFixed(1)}deg`,
            }}
            title={ui.clockText}>
            <i className="dial-sun" />
            <span className="dial-face">
              <small>{T('play.dayShort')}</small>
              <b>{s.level.id}</b>
              <em>{ui.clockText}</em>
            </span>
          </span>
          <span className="chip served">{ui.served} 🍜</span>
          <span className="chip gold">{fmt(ui.earned)}</span>
          {cookPill}
          {ui.ringing && (
            <button className="chip ring" onClick={() => s.answerPhone()}>
              {T('play.phoneChip')}
            </button>
          )}
        </div>
        <nav className="stations">
          {stations.map((n, i) => (
            <button
              key={n}
              className={`dot ${ui.station === i ? 'on' : ''}`}
              onClick={() => s.jumpTo(i)}>
              <span className="icon">{stationIcons[i]}</span>
              <span className="label">{n}</span>
            </button>
          ))}
        </nav>
      </header>
      {ui.reply && (
        <div className="reply-row">
          <button className="reply-chip" onClick={() => s.reply('ok')}>
            {T('g.replyOk')}
          </button>
          <button className="reply-chip" onClick={() => s.reply('soon')}>
            {T('g.replySoon')}
          </button>
          <button className="reply-chip ghost" onClick={() => s.reply('again')}>
            {T('g.replyAgain')}
          </button>
        </div>
      )}
      {ui.tickets.length > 0 && (
        <div className={`ticket-rail ${ui.station === 0 && b ? 'tucked' : ''}`}>
          <div className="rail-bar" />
          {ui.tickets.map((tk, idx) => {
            const isOpen = open !== tk.id; // tickets are open by default; tap folds one up
            const isTarget = ui.target === tk.id;
            return (
              <div
                key={tk.id}
                className={`chit ${isOpen ? 'open' : ''} ${isTarget ? 'target' : ''}`}
                style={{ ['--tilt' as string]: `${idx % 2 ? 1.2 : -1.4}deg` }}
                onClick={() => setOpen(isOpen ? tk.id : null)}>
                <i className="chit-clip" />
                {(() => {
                  const m = ui.moods.find((q) => q.id === tk.id);
                  if (!m) return null;
                  const cls = m.free ? 'free' : m.v > 0.6 ? 'good' : m.v > 0.3 ? 'mid' : 'low';
                  return (
                    <div
                      className={`chit-mood ${cls}`}
                      style={{ ['--v' as string]: `${(m.v * 100).toFixed(1)}%` }}
                      aria-label={T('play.happy')}>
                      <span className="mood-face">
                        {m.free
                          ? '😠'
                          : m.v > 0.66
                            ? '🙂'
                            : m.v > 0.4
                              ? '😐'
                              : m.v > 0.2
                                ? '😟'
                                : '😣'}
                      </span>
                      <span className="mood-bar">
                        <i />
                      </span>
                    </div>
                  );
                })()}
                {ui.moods.find((q) => q.id === tk.id)?.free && (
                  <span className="chit-stamp">{T('play.free')}</span>
                )}
                <div className="chit-head">
                  <span>
                    {tk.phone ? '🛵' : '#'}
                    {String(tk.id).padStart(2, '0')}
                  </span>
                  <strong>{tk.who}</strong>
                  {ui.tickets.length > 1 && (
                    <button
                      className={`ticket-pin ${isTarget ? 'on' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        s.setTarget(tk.id);
                      }}
                      aria-label={T('play.serveTo', { n: tk.who })}>
                      {isTarget ? '📌' : '○'}
                    </button>
                  )}
                </div>
                {isOpen ? (
                  <ul>
                    {tk.lines.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="chit-sum">{tk.lines.slice(0, 2).join(' · ')}…</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {ui.hint && ui.hint.station === ui.station && <div className="hint-text">{ui.hint.text}</div>}
      {ui.hint && ui.hint.station !== ui.station && (
        <div className="hint-text soft" onClick={() => s.jumpTo(ui.hint!.station)}>
          {ui.hint.station < ui.station ? '◀ ' : ''}
          {T('play.goTo', { s: stations[ui.hint.station] })}
          {ui.hint.station > ui.station ? ' ▶' : ''}
        </div>
      )}
      {ui.toast && <div className="toast">{ui.toast}</div>}
      {ui.score !== null && (
        <div className={`score-pop ${ui.score >= 85 ? 'great' : ui.score >= 55 ? 'ok' : 'bad'}`}>
          {T('play.pct', { n: ui.score })}
        </div>
      )}
      {ui.complaint && (
        <button className="btn big primary apologize" onClick={() => s.apologize()}>
          {T('play.apologize')}
        </button>
      )}
      {cash && (
        <div className="cash-panel">
          <div className="cash-info">
            <div>
              <small>{T('cash.bill')}</small>
              <strong>{fmt(cash.due)}</strong>
              {cash.full > cash.due && (
                <span className="discount">
                  <s>{fmt(cash.full)}</s> −{fmt(cash.full - cash.due)} {T('cash.discount')}
                </span>
              )}
            </div>
            <div>
              <small>{T('cash.given')}</small>
              <strong>{fmt(sum(cash.given))}</strong>
              <span className="notes">
                {cash.given.map((d, i) => (
                  <i key={i} className={`note n${d}`}>
                    {d}
                  </i>
                ))}
              </span>
            </div>
            <div className="change-due">
              <small>{T('cash.change')}</small>
              <strong>{fmt(need)}</strong>
              <span
                className={`giving-sum ${cash.result === 'less' ? 'bad' : cash.result === 'ok' ? 'good' : ''}`}>
                {T('cash.giving')}: {fmt(giving)}
              </span>
            </div>
          </div>
          <div className="drawer">
            {DENOMS.map((d) => (
              <button
                key={d}
                className={`note n${d}`}
                disabled={cash.result === 'ok'}
                onClick={() => s.giveDenom(d)}>
                {fmt(d)}
              </button>
            ))}
          </div>
          <div className="giving">
            {cash.giving.length === 0 && (
              <span className="muted">
                {T('cash.pick')}
                {need === 0 ? T('cash.exact') : ''}
              </span>
            )}
            {cash.giving.map((d, i) => (
              <button key={i} className={`note n${d} small`} onClick={() => s.takeBack(i)}>
                {fmt(d)} ✕
              </button>
            ))}
          </div>
          <button
            className="btn big primary"
            disabled={cash.result === 'ok'}
            onClick={() => s.confirmChange()}>
            {need === 0 ? T('cash.thanks') : T('cash.give')}
          </button>
          {cash.result === 'less' && <div className="cash-msg bad">{T('cash.less')}</div>}
        </div>
      )}
      {ui.intro && (
        <div className="cine">
          <div className="cine-bar top" />
          <div className="cine-bar bottom" />
          <div className="cine-title">
            <span className="chip">{T('map.day', { n: s.level.id })}</span>
            <h1>{L(s.level.title)}</h1>
            <p>{L(s.level.subtitle)}</p>
          </div>
        </div>
      )}
      {ui.dayEnd && (
        <div className="modal-veil soft">
          <div className="day-over">{T('play.closing')}</div>
        </div>
      )}
      <PlayHotkeys s={s} />
    </>
  );
}

/** Keyboard helpers for desktop testing: 1/2/3 jump to stations, P answers the tablet. */
function PlayHotkeys({ s }: { s: DaySession }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === '2' || e.key === '3') s.jumpTo(Number(e.key) - 1);
      if (e.key.toLowerCase() === 'p') s.answerPhone();
      if (e.key === 'ArrowLeft') s.jumpTo(s.engine.station - 1);
      if (e.key === 'ArrowRight') s.jumpTo(s.engine.station + 1);
      if (e.key === 's') sfx('tap');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [s]);
  return null;
}
