import { useCallback, useEffect, useRef, useState } from 'react';
import { INGREDIENTS, LEVELS, unlockedUpTo } from '../data';
import { CatArt, Coin, Scooter, type Mood } from '../art';
import { Avatar } from '../avatar';
import { Donabe, type Piece } from '../bowl';
import { BOWL_R, THICK_LABEL, THICK_W, type Thick } from '../food';
import { BowlCanvas, BowlSide, Tray } from './FoodCanvas';
import {
  COOK_LABEL,
  cookStateAt,
  dayCustomers,
  judge,
  reactionLine,
  starsFor,
  type Bowl,
  type Customer,
  type Verdict,
} from '../orders';
import { buzz, sfx } from '../audio';
import { ShopWall } from './Scenery';
import Establishing from './Establishing';
import type { Save } from '../App';

export interface DayResult {
  coins: number;
  stars: number;
  served: number;
  perfect: number;
  unhappy: number;
  avg: number;
}

type Phase = 'walkin' | 'talk' | 'waiting' | 'eating' | 'react' | 'leave';
type Tool = { kind: 'noodle' | 'broth' | 'topping'; id: string } | null;
type Tab = 'noodle' | 'broth' | 'topping';
type Stage = 'prep' | 'pot' | 'ready';

const SCATTER = new Set(['yesil', 'susam', 'citir', 'filiz', 'misir', 'aciyag', 'biber']);
const COOK_SPEED = 100 / 7.5; // progress units per second
const STATIONS = ['Salon', 'Hazırlık', 'Ocak'];

const emptyBowl = (): Bowl => ({ fill: 0, pieces: [] });

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
  const L = LEVELS[levelId - 1];
  const [custs] = useState<Customer[]>(() => dayCustomers(levelId));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('walkin');
  const [station, setStation] = useState(0);
  const [panning, setPanning] = useState(false);
  const [started, setStarted] = useState(false);
  const [intro, setIntro] = useState(true);
  const [paused, setPaused] = useState(false);
  const [closing, setClosing] = useState(false);
  const [typed, setTyped] = useState(0);
  const [tab, setTab] = useState<Tab>('noodle');
  const [tool, setTool] = useState<Tool>(null);
  const [thick, setThick] = useState<Thick>('orta');
  const [bowl, setBowl] = useState<Bowl>(emptyBowl);
  const [stage, setStage] = useState<Stage>('prep');
  const [cookP, setCookP] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [shownScore, setShownScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [nudge, setNudge] = useState<string | null>(null);
  const [orderAt, setOrderAt] = useState(0);
  const [bowlSize, setBowlSize] = useState(300);

  const pouring = useRef(false);
  const lastPiece = useRef<{ x: number; y: number } | null>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const seq = useRef(1);
  const cooking = stage === 'pot';

  const c = custs[idx];
  if (typeof window !== 'undefined' && window.location.search.includes('bot'))
    (window as unknown as { __order: unknown }).__order = c.order;
  const speech = phase === 'talk' || phase === 'waiting' ? `${c.greet} ${c.text}` : '';
  const unlocked = unlockedUpTo(levelId);
  const noodles = unlocked.filter((i) => INGREDIENTS[i].cat === 'noodle');
  const broths = unlocked.filter((i) => INGREDIENTS[i].cat === 'broth');
  const sauces = unlocked.filter((i) => INGREDIENTS[i].cat === 'sauce');
  const toppings = unlocked.filter((i) => INGREDIENTS[i].cat === 'topping');

  // size the bowl to the space the prep board actually has
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setBowlSize(Math.max(180, Math.min(r.width - 28, r.height - 92, 360)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const flash = useCallback((msg: string) => {
    setNudge(msg);
    sfx('fail');
    buzz(25);
    window.setTimeout(() => setNudge((m) => (m === msg ? null : m)), 1600);
  }, []);

  const go = (s: number) => {
    setStation((cur) => {
      if (cur === s) return cur;
      setPanning(true);
      window.setTimeout(() => setPanning(false), 820);
      sfx('whoosh');
      return s;
    });
  };

  // ---------- customer flow ----------
  useEffect(() => {
    if (!started || paused) return;
    if (phase === 'walkin') {
      sfx(c.phone ? 'phone' : 'door');
      const t = window.setTimeout(() => {
        setPhase('talk');
        setTyped(0);
      }, 1600);
      return () => window.clearTimeout(t);
    }
    if (phase === 'eating') {
      const t = window.setTimeout(
        () => {
          setPhase('react');
          setShownScore(0);
        },
        c.phone ? 2600 : 3000
      );
      return () => window.clearTimeout(t);
    }
    if (phase === 'leave') {
      const t = window.setTimeout(() => {
        if (idx + 1 >= custs.length) {
          setClosing(true);
          sfx('win');
          window.setTimeout(() => {
            const all = scores;
            const avg = all.length ? Math.round(all.reduce((a, b) => a + b, 0) / all.length) : 0;
            onDone({
              coins,
              stars: starsFor(avg),
              served: all.length,
              perfect: all.filter((s) => s >= 90).length,
              unhappy: all.filter((s) => s < 55).length,
              avg,
            });
          }, 2400);
        } else {
          setIdx(idx + 1);
          setPhase('walkin');
          setVerdict(null);
        }
      }, 1100);
      return () => window.clearTimeout(t);
    }
  }, [phase, started, paused, c.phone, idx, custs.length, scores, coins, onDone]);

  useEffect(() => {
    if (phase !== 'talk' || typed >= speech.length) return;
    const t = window.setTimeout(() => setTyped((n) => Math.min(speech.length, n + 2)), 24);
    return () => window.clearTimeout(t);
  }, [phase, typed, speech.length]);

  useEffect(() => {
    if (phase !== 'react' || !verdict || shownScore >= verdict.score) return;
    const t = window.setTimeout(() => setShownScore((s) => Math.min(verdict.score, s + 3)), 18);
    return () => window.clearTimeout(t);
  }, [phase, verdict, shownScore]);

  // main loop: pouring + cooking
  useEffect(() => {
    if (!started || paused) return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      acc += dt;
      if (pouring.current) {
        setBowl((b) => ({ ...b, fill: Math.min(1.25, b.fill + dt * 0.42) }));
        if (acc > 0.14) {
          acc = 0;
          sfx('bubble');
        }
      }
      if (cooking) {
        setCookP((p) => {
          const n = p + dt * COOK_SPEED;
          if (p < 58 && n >= 58) sfx('ding');
          if (p < 100 && n >= 100) sfx('fail');
          return Math.min(130, n);
        });
        if (acc > 0.3) {
          acc = 0;
          sfx('bubble');
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, paused, cooking]);

  useEffect(() => {
    const h = () => {
      if (document.hidden && started) setPaused(true);
    };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [started]);

  // ---------- actions ----------
  const takeOrder = () => {
    if (typed < speech.length) {
      setTyped(speech.length);
      return;
    }
    setPhase('waiting');
    setOrderAt(performance.now());
    setBowl(emptyBowl());
    setStage('prep');
    setCookP(0);
    setTab('noodle');
    setTool(null);
    sfx('ding');
    window.setTimeout(() => go(1), 350);
  };

  const toBowlCoords = (e: React.PointerEvent) => {
    const r = cvRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 300, y: ((e.clientY - r.top) / r.height) * 300 };
  };

  const addPiece = (x: number, y: number) => {
    if (!tool || tool.kind !== 'topping') return;
    const d = Math.hypot(x - 150, y - 150);
    const max = BOWL_R - 18;
    if (d > max) {
      x = 150 + ((x - 150) / d) * max;
      y = 150 + ((y - 150) / d) * max;
    }
    const id = tool.id;
    setBowl((b) => {
      if (b.pieces.filter((p) => p.id === id).length >= 16 || b.pieces.length >= 90) return b;
      const p: Piece = {
        id,
        x,
        y,
        r: Math.random() * 360,
        s: SCATTER.has(id) ? 0.7 + Math.random() * 0.15 : 0.82 + Math.random() * 0.12,
        k: seq.current++,
      };
      return { ...b, pieces: [...b.pieces, p] };
    });
    lastPiece.current = { x, y };
    sfx('pop');
    buzz(6);
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stage !== 'prep') return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { x, y } = toBowlCoords(e);
    if (Math.hypot(x - 150, y - 150) > 146) return;
    if (!tool) return flash('Önce aşağıdaki küvetlerden birini seç');
    if (tool.kind === 'noodle') {
      setBowl((b) => ({ ...b, noodle: tool.id, thick }));
      sfx('drop');
      buzz(15);
      if (!bowl.broth) {
        setTab('broth');
        setTool(null);
      }
    } else if (tool.kind === 'broth') {
      setBowl((b) => ({ ...b, broth: tool.id, fill: b.broth && b.broth !== tool.id ? 0 : b.fill }));
      pouring.current = true;
      sfx('splash');
    } else addPiece(x, y);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!tool || tool.kind !== 'topping' || !lastPiece.current) return;
    const { x, y } = toBowlCoords(e);
    if (Math.hypot(x - lastPiece.current.x, y - lastPiece.current.y) > 30) addPiece(x, y);
  };

  const onUp = () => {
    lastPiece.current = null;
    if (pouring.current) {
      pouring.current = false;
      if (bowl.fill >= 0.7) {
        setTab('topping');
        setTool(null);
      }
    }
  };

  const undo = () => {
    setBowl((b) => ({ ...b, pieces: b.pieces.slice(0, -1) }));
    sfx('tap');
  };
  const trash = () => {
    setBowl(emptyBowl());
    setTab('noodle');
    setTool(null);
    sfx('trash');
  };

  const toPot = () => {
    if (phase !== 'waiting') return flash('Önce salondan sipariş al');
    if (!bowl.noodle) return flash('Kasede erişte yok!');
    setStage('pot');
    setCookP(0);
    sfx('drop');
    go(2);
  };

  const takeOut = () => {
    const cs = cookStateAt(cookP);
    setBowl((b) => ({ ...b, cook: cs }));
    setStage('ready');
    sfx(cs === 'perfect' || cs === 'dente' ? 'perfect' : cs === 'soft' ? 'coins' : 'fail');
    buzz(20);
  };

  const serveIt = () => {
    const wait = (performance.now() - orderAt) / 1000;
    const v = judge(c.order, bowl, wait, c.bonus);
    setVerdict(v);
    setPhase('eating');
    setScores((s) => [...s, v.score]);
    setCoins((m) => m + v.price + v.tip + v.bonus);
    go(0);
    window.setTimeout(() => sfx(c.phone ? 'door' : 'splash'), 800);
  };

  const nextCustomer = () => {
    setPhase('leave');
    sfx('coins');
  };

  // ---------- derived ----------
  const mood: Mood =
    phase === 'react' && verdict
      ? verdict.score >= 90
        ? 'love'
        : verdict.score >= 70
          ? 'happy'
          : verdict.score >= 45
            ? 'worried'
            : 'angry'
      : phase === 'waiting'
        ? 'neutral'
        : 'happy';
  const cookNow = cookStateAt(cookP);
  const hint = tutorial();
  const drawBowl = { ...bowl, liquid: bowl.broth, takeaway: c.phone };
  const closeUp = station === 0 && (phase === 'talk' || phase === 'react');
  const liquidIsSauce = bowl.broth ? INGREDIENTS[bowl.broth].cat === 'sauce' : false;

  function tutorial(): string | null {
    if (levelId > 2 || !started) return null;
    if (phase === 'talk') return '👂 Müşteriyi dinle, sonra “Siparişi al”a bas.';
    if (phase !== 'waiting') return null;
    if (station === 0) return '➡ Hazırlık istasyonuna geç.';
    if (station === 1) {
      if (stage !== 'prep') return '➡ Kase ocakta! Ocak istasyonuna geç.';
      if (!bowl.noodle) return '1️⃣ Kalınlığı seç, erişte küvetine dokun, sonra kaseye dokun.';
      if (!bowl.broth || bowl.fill < 0.72)
        return '2️⃣ Suyu ya da sosu seç, kaseye BASILI TUT, çizgiye kadar doldur.';
      if (!bowl.pieces.length)
        return '3️⃣ Malzeme küvetini seç, kaseye dokun ya da parmağını sürükle.';
      return '4️⃣ Sipariş tamamsa “Ocağa koy”a bas.';
    }
    if (stage === 'pot') return '🔥 İbre yeşil “Tam kıvam”a gelince Çıkar!';
    if (stage === 'ready') return '🛎 Servis et!';
    return null;
  }

  return (
    <div className={`screen play2 ${closeUp ? 'closeup' : ''}`}>
      {/* HUD */}
      <div className="hud">
        <button className="hud-btn" onClick={() => setPaused(true)} aria-label="Duraklat">
          ❚❚
        </button>
        <div className="hud-mid">
          <div className="hud-title">
            Gün {L.id} • {L.title}
          </div>
          <div className="hud-queue">
            {custs.map((x, i) => (
              <span
                key={x.id}
                className={`qdot ${i < idx ? 'done' : i === idx ? 'now' : ''} ${scores[i] !== undefined ? (scores[i] >= 85 ? 'good' : scores[i] >= 55 ? 'mid' : 'bad') : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="hud-coins">
          <Coin size={18} />
          <b key={coins} className="bump">
            {coins}
          </b>
        </div>
      </div>

      {/* TICKET */}
      {phase === 'waiting' && station !== 0 && (
        <div className="slip">
          <div className="slip-head">
            {c.phone ? '📱' : '🪑'} {c.name}
            {c.special && <span className="slip-vip">ÖZEL MİSAFİR</span>}
          </div>
          <div className="slip-text">{c.text}</div>
        </div>
      )}

      {/* STATIONS */}
      <div className="stage-window">
        <div
          className={`track ${panning ? 'panning' : ''}`}
          style={{ transform: `translateX(${-station * 100}%)` }}>
          {/* SALON */}
          <section className="station salon2">
            <div className="salon-cam">
              <ShopWall
                rain={L.id === 5}
                menu={noodles.map((n) => INGREDIENTS[n].name).join(' • ')}
                cat={<CatArt size={58} sleepy={phase === 'waiting'} />}
              />
              <div className="light-cone a" />
              <div className="light-cone b" />
              {custs.length - idx - 1 > 0 && (
                <div className="queue-chip">👥 Kapıda {custs.length - idx - 1} müşteri</div>
              )}
              {!c.phone && (
                <div key={c.id} className={`guest ph-${phase}`}>
                  <Avatar look={c.look} mood={mood} size={250} eating={phase === 'eating'} />
                </div>
              )}
              {c.phone && (phase === 'eating' || phase === 'react' || phase === 'leave') && (
                <div className={`guest courier-guest ph-${phase}`}>
                  <Avatar look={{ ...c.look, special: 'ruzgar' }} mood="happy" size={230} />
                </div>
              )}
              <div className="counter2">
                <div className="counter2-top" />
                <div className="counter2-front">
                  <span>NODDLES</span>
                </div>
              </div>
              {c.phone && (phase === 'walkin' || phase === 'talk' || phase === 'waiting') && (
                <div className={`phone-stand ${phase === 'walkin' ? 'ringing' : ''}`}>📱</div>
              )}
              {(phase === 'eating' || phase === 'react') && (
                <div className={`served2 ${c.phone ? 'bag' : ''}`}>
                  {c.phone ? (
                    <div className="takeaway-bag">
                      <span>Noddles</span>
                    </div>
                  ) : (
                    <BowlSide bowl={drawBowl} width={170} steam={phase === 'eating'} />
                  )}
                </div>
              )}
              {phase === 'eating' && c.phone && (
                <div className="scooter-run">
                  <Scooter size={90} />
                </div>
              )}
            </div>
            <div className="letterbox top" />
            <div className="letterbox bottom" />

            {(phase === 'talk' || (phase === 'waiting' && station === 0)) && (
              <div
                className={`talk ${c.phone ? 'on-phone' : ''}`}
                onClick={phase === 'talk' ? takeOrder : undefined}>
                <div className="talk-name">
                  {c.phone ? '📞 ' : ''}
                  {c.name}
                </div>
                <div className="talk-text">
                  {phase === 'talk' ? speech.slice(0, typed) : speech}
                </div>
                {phase === 'talk' && typed >= speech.length && (
                  <button
                    className="btn primary talk-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      takeOrder();
                    }}>
                    Siparişi al ✓
                  </button>
                )}
                {phase === 'waiting' && (
                  <button className="btn ghost talk-btn" onClick={() => go(1)}>
                    Mutfağa geç →
                  </button>
                )}
              </div>
            )}
            {phase === 'react' && verdict && (
              <div className="verdict">
                <div className="talk-name">{c.phone ? `💬 ${c.name}` : c.name}</div>
                <div className="talk-text">{reactionLine(c, verdict)}</div>
                <div className="meter">
                  <div
                    className={`meter-fill ${verdict.score >= 85 ? 'g' : verdict.score >= 55 ? 'm' : 'b'}`}
                    style={{ width: `${shownScore}%` }}
                  />
                  <span>{shownScore}% memnun</span>
                </div>
                <div className="pay-row">
                  <span>
                    <Coin size={16} /> {verdict.price}
                  </span>
                  <span className={verdict.tip ? 'tip-on' : 'tip-off'}>Bahşiş +{verdict.tip}</span>
                  {verdict.bonus > 0 && <span className="tip-on">⭐ +{verdict.bonus}</span>}
                </div>
                {(verdict.praise.length > 0 || verdict.notes.length > 0) && (
                  <ul className="notes">
                    {verdict.praise.slice(0, 2).map((p) => (
                      <li key={p} className="ok">
                        {p}
                      </li>
                    ))}
                    {verdict.notes.slice(0, 3).map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
                <button className="btn primary talk-btn" onClick={nextCustomer}>
                  {idx + 1 >= custs.length ? 'Günü bitir' : 'Sıradaki müşteri →'}
                </button>
              </div>
            )}
          </section>

          {/* PREP */}
          <section className="station prep">
            <div className="prep-board" ref={boardRef}>
              {stage === 'prep' ? (
                <>
                  <div className={`bowl-wrap ${tool?.kind === 'broth' ? 'pour' : ''}`}>
                    <BowlCanvas
                      bowl={drawBowl}
                      size={bowlSize}
                      className="bowl-cv"
                      canvasRef={cvRef}
                      onDown={onDown}
                      onMove={onMove}
                      onUp={onUp}
                    />
                    {tool && (
                      <div className="tool-chip">
                        {tool.kind === 'noodle'
                          ? `${THICK_LABEL[thick]} ${INGREDIENTS[tool.id].name}: kaseye dokun`
                          : tool.kind === 'broth'
                            ? `${INGREDIENTS[tool.id].name}: basılı tut`
                            : `${INGREDIENTS[tool.id].name}: dokun ya da sürükle`}
                      </div>
                    )}
                  </div>
                  <div className="fill-gauge">
                    <div className="fg-band" />
                    <div
                      className="fg-fill"
                      style={{
                        width: `${Math.min(100, (bowl.fill / 1.25) * 100)}%`,
                        background: bowl.broth ? INGREDIENTS[bowl.broth].color : '#888',
                      }}
                    />
                    <span>
                      {bowl.broth
                        ? bowl.fill > 1.03
                          ? liquidIsSauce
                            ? 'Sos çok fazla!'
                            : 'Taşıyor!'
                          : bowl.fill >= 0.72
                            ? liquidIsSauce
                              ? 'Sos tamam'
                              : 'Su tamam'
                            : liquidIsSauce
                              ? 'Sos miktarı'
                              : 'Su seviyesi'
                        : 'Su / sos yok'}
                    </span>
                  </div>
                  <div className="prep-tools">
                    <button className="tool-btn" onClick={undo} disabled={!bowl.pieces.length}>
                      ↶ Geri al
                    </button>
                    <button className="tool-btn" onClick={trash}>
                      🗑 Boşalt
                    </button>
                    <button
                      className={`tool-btn go ${bowl.noodle && bowl.fill >= 0.5 ? 'ready' : ''}`}
                      onClick={toPot}>
                      Ocağa koy 🔥
                    </button>
                  </div>
                </>
              ) : (
                <div className="prep-empty">
                  <p>{stage === 'pot' ? 'Kase ocakta pişiyor!' : 'Kase hazır, servis bekliyor.'}</p>
                  <button className="btn primary" onClick={() => go(2)}>
                    Ocağa git →
                  </button>
                </div>
              )}
            </div>
            {stage === 'prep' && (
              <div className="pantry2">
                <div className="tabs">
                  {(['noodle', 'broth', 'topping'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      className={`tab ${tab === t ? 'on' : ''}`}
                      onClick={() => {
                        setTab(t);
                        sfx('tap');
                      }}>
                      {t === 'noodle'
                        ? 'Erişte'
                        : t === 'broth'
                          ? 'Su & Sos'
                          : `Malzemeler (${toppings.length})`}
                    </button>
                  ))}
                </div>
                {tab === 'noodle' && (
                  <div className="thick-row">
                    {(['ince', 'orta', 'kalin'] as Thick[]).map((t) => (
                      <button
                        key={t}
                        className={`thick ${thick === t ? 'on' : ''}`}
                        onClick={() => {
                          setThick(t);
                          sfx('tap');
                        }}>
                        <i style={{ height: THICK_W[t] * 1.4 }} />
                        <i style={{ height: THICK_W[t] * 1.4 }} />
                        <span>{THICK_LABEL[t]}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className={`bins bins-${tab}`}>
                  {tab === 'broth' && <div className="bin-group">Çorba (su)</div>}
                  {(tab === 'noodle' ? noodles : tab === 'broth' ? broths : toppings).map((id) => (
                    <BinButton
                      key={id}
                      id={id}
                      tab={tab}
                      bowl={bowl}
                      tool={tool}
                      thick={thick}
                      onPick={(kind) => setTool({ kind, id })}
                    />
                  ))}
                  {tab === 'broth' && sauces.length > 0 && (
                    <div className="bin-group">Kuru noodle (sos)</div>
                  )}
                  {tab === 'broth' &&
                    sauces.map((id) => (
                      <BinButton
                        key={id}
                        id={id}
                        tab={tab}
                        bowl={bowl}
                        tool={tool}
                        thick={thick}
                        onPick={(kind) => setTool({ kind, id })}
                      />
                    ))}
                </div>
              </div>
            )}
          </section>

          {/* STOVE */}
          <section className="station stove2">
            <div className="hood" />
            <div className="tiles" />
            <div className="donabe-wrap">
              <Donabe
                active={stage === 'pot'}
                lidOff={stage === 'ready'}
                hot={Math.min(1, cookP / 100)}
              />
              {stage === 'ready' && (
                <div className="out-bowl">
                  <BowlCanvas bowl={drawBowl} size={190} />
                  <div className={`cook-badge cb-${bowl.cook}`}>
                    {COOK_LABEL[bowl.cook ?? 'raw']}
                  </div>
                </div>
              )}
            </div>
            {stage === 'pot' && (
              <div className="cook-panel">
                <div className="cook-gauge">
                  <i className="cz raw" style={{ width: '32.3%' }}>
                    Çiğ
                  </i>
                  <i className="cz dente" style={{ width: '12.3%' }}>
                    Diri
                  </i>
                  <i className="cz perfect" style={{ width: '16.9%' }}>
                    Tam
                  </i>
                  <i className="cz soft" style={{ width: '15.4%' }}>
                    Yumuşak
                  </i>
                  <i className="cz burnt" style={{ flex: 1 }}>
                    Lapa
                  </i>
                  <b style={{ left: `${Math.min(100, (cookP / 130) * 100)}%` }} />
                </div>
                <div className={`cook-now cb-${cookNow}`}>{COOK_LABEL[cookNow]}</div>
                <button className="btn big primary" onClick={takeOut}>
                  Çıkar!
                </button>
              </div>
            )}
            {stage === 'ready' && (
              <div className="cook-panel">
                <button className="btn big primary pulse" onClick={serveIt}>
                  {c.phone ? 'Paketle, Rüzgar’a ver 🛵' : 'Servis et 🛎'}
                </button>
              </div>
            )}
            {stage === 'prep' && (
              <div className="cook-panel idle">
                <p>
                  {phase === 'waiting'
                    ? 'Kaseyi hazırlıkta hazırla, sonra ocağa koy.'
                    : 'Ocak boşta.'}
                </p>
                {phase === 'waiting' && (
                  <button className="btn ghost" onClick={() => go(1)}>
                    ← Hazırlığa dön
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
        <div className="vignette" />
        <div className="film-grain" />
      </div>

      {hint && (
        <div className={`hint2 ${station !== 0 && phase === 'waiting' ? 'k' : ''}`}>{hint}</div>
      )}
      {nudge && <div className="nudge2">{nudge}</div>}

      {/* NAV */}
      <div className="nav">
        {STATIONS.map((s, i) => (
          <button key={s} className={`nav-btn ${station === i ? 'on' : ''}`} onClick={() => go(i)}>
            {['🏮', '🔪', '🔥'][i]} {s}
            {i === 0 && phase === 'talk' && station !== 0 && (
              <span className="badge pulse-badge">!</span>
            )}
            {i === 2 && stage === 'pot' && station !== 2 && (
              <span className={`badge ${cookP > 80 ? 'pulse-badge' : ''}`}>
                {Math.round(cookP)}
              </span>
            )}
          </button>
        ))}
      </div>

      {intro && (
        <Establishing
          day={L.id}
          title={L.title}
          subtitle={L.subtitle}
          meta={`${L.customers} müşteri${L.phone ? ` • ${L.phone} telefon siparişi` : ''}`}
          rain={L.id === 3 || L.id === 5 || L.id === 9}
          onDone={() => {
            setIntro(false);
            setStarted(true);
          }}
        />
      )}

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
              Günü baştan başlat
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

function BinButton({
  id,
  tab,
  bowl,
  tool,
  thick,
  onPick,
}: {
  id: string;
  tab: Tab;
  bowl: Bowl;
  tool: Tool;
  thick: Thick;
  onPick: (kind: Tab) => void;
}) {
  const count = bowl.pieces.filter((p) => p.id === id).length;
  const inBowl =
    tab === 'noodle' ? bowl.noodle === id : tab === 'broth' ? bowl.broth === id : count > 0;
  return (
    <button
      data-id={id}
      className={`bin ${tool?.id === id ? 'sel' : ''} ${inBowl ? 'in' : ''}`}
      onClick={() => {
        onPick(tab);
        sfx('tap');
      }}>
      <Tray id={id} thick={thick} width={tab === 'topping' ? 92 : 120} />
      <span>{INGREDIENTS[id].name}</span>
      {tab === 'topping' && count > 0 && <em>{count}</em>}
    </button>
  );
}
