import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Save } from '../App';
import { DaySession, type DayResult } from '../game/session';
import { LEVELS } from '../game/data';
import { DENOMS, fmt, sum } from '../game/money';
import { COOK_LABEL } from '../game/bowl';
import { sfx } from '../game/audio';

const STATIONS = ['Salon', 'Tezgâh', 'Ocak'];

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
  onDone: (r: DayResult, tipCoins: number) => void;
  onQuit: () => void;
  onRestart: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<DaySession | null>(null);
  const [paused, setPaused] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const level = LEVELS[levelId - 1];

  useEffect(() => {
    const s = new DaySession(canvasRef.current!, levelId, save.decor, save.cash, save.tipCoins);
    s.onDayEnd = (r) => onDone(r, s.tipJarCoins);
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
    if (paused) session.engine.stop();
    else session.engine.start();
  }, [paused, session]);

  return (
    <div className="screen play">
      <canvas ref={canvasRef} className="game-canvas" />
      {session && (
        <Overlays
          s={session}
          worldRef={worldRef}
          ticketOpen={ticketOpen}
          setTicketOpen={setTicketOpen}
          onPause={() => setPaused(true)}
        />
      )}
      {paused && session && (
        <div className="modal-veil">
          <div className="modal">
            <h2>Mola</h2>
            <p>
              {level.id}. Gün · {level.title}
            </p>
            <div className="modal-row">
              <button className="btn ghost" onClick={() => onToggle('sfx')}>
                {save.sfx ? '🔊 Ses açık' : '🔇 Ses kapalı'}
              </button>
              <button className="btn ghost" onClick={() => onToggle('music')}>
                {save.music ? '🎵 Müzik açık' : '🎵 Müzik kapalı'}
              </button>
            </div>
            <button className="btn big primary" onClick={() => setPaused(false)}>
              Devam
            </button>
            <div className="modal-row">
              <button className="btn" onClick={onRestart}>
                Günü yeniden başlat
              </button>
              <button className="btn danger" onClick={onQuit}>
                Haritaya dön
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
  ticketOpen,
  setTicketOpen,
  onPause,
}: {
  s: DaySession;
  worldRef: React.RefObject<HTMLDivElement | null>;
  ticketOpen: boolean;
  setTicketOpen: (b: boolean) => void;
  onPause: () => void;
}) {
  const ui = useSyncExternalStore(
    (fn) => s.subscribe(fn),
    () => s.snapshot()
  );
  const v = s.engine.view;
  const sc = v.scale;
  const S = s.salL;
  const anchorX = (ui.bubble?.phone ? S.phone.x + S.phone.w / 2 : S.customer.x) * sc;
  const bubbleY = (ui.bubble?.phone ? S.phone.y - 10 : S.customer.y - S.customer.size - 8) * sc;
  const bw = Math.min(v.cssW * 0.78, 460);
  const bubbleX = Math.max(bw / 2 + 8, Math.min(v.cssW - bw / 2 - 8, anchorX));
  // keep the bubble under the HUD: estimate its height from the text length
  const textLen = ui.bubble?.text.length ?? 0;
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
        {COOK_LABEL[ui.cook]}
      </span>
    ) : null;

  return (
    <>
      <div className="world-layer" ref={worldRef}>
        {ui.bubble && (
          <div
            className={`bubble ${ui.bubble.phone ? 'phone' : ''} tone-${ui.bubble.tone ?? 'neutral'}`}
            style={{ left: bubbleX, top: bubbleYc, width: bw, ['--tail' as string]: `${tail}px` }}>
            <span className="bubble-name">
              {ui.bubble.phone ? '📞 ' : ''}
              {ui.bubble.name}
            </span>
            <p>
              {ui.bubble.text.slice(0, ui.bubble.shown)}
              {ui.bubble.shown < ui.bubble.text.length && <span className="caret">▍</span>}
            </p>
          </div>
        )}
      </div>
      <header className="hud">
        <button className="btn ghost small" onClick={onPause} aria-label="Mola">
          ❚❚
        </button>
        <div className="hud-mid">
          <span
            className={`chip clock ${ui.clock > 0.85 ? 'late' : ''}`}
            style={{ ['--p' as string]: `${Math.round(ui.clock * 100)}%` }}>
            <i className="clock-ring" />
            {ui.clockText}
          </span>
          <span className="chip">{ui.served} 🍜</span>
          <span className="chip gold">{fmt(ui.earned)}</span>
          {cookPill}
          {ui.ringing && (
            <button className="chip ring" onClick={() => s.answerPhone()}>
              📞 Telefon!
            </button>
          )}
        </div>
        <nav className="stations">
          {STATIONS.map((n, i) => (
            <button
              key={n}
              className={`dot ${ui.station === i ? 'on' : ''}`}
              onClick={() => s.jumpTo(i)}>
              {n}
            </button>
          ))}
        </nav>
      </header>
      {ui.ticket && (
        <div
          className={`ticket ${ticketOpen ? 'open' : ''}`}
          onClick={() => setTicketOpen(!ticketOpen)}>
          {ui.patience !== null && (
            <div
              className="patience"
              style={{ ['--p' as string]: `${Math.round(ui.patience * 100)}%` }}>
              <i className={ui.patience > 0.5 ? 'ok' : ui.patience > 0.25 ? 'warn' : 'bad'} />
            </div>
          )}
          <div className="ticket-head">
            <span className="ticket-title">
              {ui.ticketPhone ? '📞 Paket' : ui.ticketWho ? `👥 ${ui.ticketWho}` : '📝 Sipariş'}
            </span>
            {!ticketOpen && <span className="ticket-sum">{ui.ticket.slice(0, 4).join(' · ')}</span>}
            <span className="ticket-arrow">{ticketOpen ? '▴' : '▾'}</span>
          </div>
          {ticketOpen && (
            <ul>
              {ui.ticket.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {ui.hint && ui.hint.station === ui.station && <div className="hint-text">{ui.hint.text}</div>}
      {ui.hint && ui.hint.station !== ui.station && (
        <div className="hint-text soft" onClick={() => s.jumpTo(ui.hint!.station)}>
          {ui.hint.station < ui.station ? '◀ ' : ''}
          {STATIONS[ui.hint.station]} bölümüne geç{ui.hint.station > ui.station ? ' ▶' : ''}
        </div>
      )}
      {ui.toast && <div className="toast">{ui.toast}</div>}
      {ui.score !== null &&
        ui.phase !== 'pay' &&
        ui.phase !== 'leave' &&
        ui.phase !== 'cooking' && (
          <div className={`score-pop ${ui.score >= 85 ? 'great' : ui.score >= 55 ? 'ok' : 'bad'}`}>
            %{ui.score}
          </div>
        )}
      {cash && (
        <div className="cash-panel">
          <div className="cash-info">
            <div>
              <small>Hesap</small>
              <strong>{fmt(cash.due)}</strong>
            </div>
            <div>
              <small>Verilen</small>
              <strong>{fmt(sum(cash.given))}</strong>
              <span className="notes">
                {cash.given.map((d, i) => (
                  <i key={i} className={`note n${d}`}>
                    {d}
                  </i>
                ))}
              </span>
            </div>
            <div>
              <small>Para üstü</small>
              <strong
                className={cash.result === 'less' ? 'bad' : cash.result === 'ok' ? 'good' : ''}>
                {fmt(giving)}
              </strong>
            </div>
          </div>
          <div className="drawer">
            {DENOMS.map((d) => (
              <button
                key={d}
                className={`note n${d}`}
                disabled={cash.result === 'ok'}
                onClick={() => s.giveDenom(d)}>
                {d} ₺
              </button>
            ))}
          </div>
          <div className="giving">
            {cash.giving.length === 0 && (
              <span className="muted">
                Çekmeceden para üstünü seç{need === 0 ? ' (tam para verdi!)' : ''}
              </span>
            )}
            {cash.giving.map((d, i) => (
              <button key={i} className={`note n${d} small`} onClick={() => s.takeBack(i)}>
                {d} ₺ ✕
              </button>
            ))}
          </div>
          <button
            className="btn big primary"
            disabled={cash.result === 'ok'}
            onClick={() => s.confirmChange()}>
            {need === 0 ? 'Teşekkürler!' : 'Para üstünü ver'}
          </button>
          {cash.result === 'less' && (
            <div className="cash-msg bad">Eksik oldu, biraz daha ekle.</div>
          )}
        </div>
      )}
      {ui.phase === 'dayEnd' && (
        <div className="modal-veil soft">
          <div className="day-over">Kepenk kapanıyor…</div>
        </div>
      )}
      <PlayHotkeys s={s} />
    </>
  );
}

/** Keyboard helpers for desktop testing: 1/2/3 jump to stations, P answers the phone. */
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
