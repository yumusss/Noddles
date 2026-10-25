import { useCallback, useEffect, useRef, useState } from 'react';
import { INGREDIENTS, LEVELS, unlockedUpTo } from '../data';
import { BowlArt, CatArt, Coin, CustomerArt, IngredientIcon, Scooter, type Mood } from '../art';
import { BOWL_R, Donabe, TopBowl, type Piece } from '../bowl';
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

const BIG = new Set([
  'chashu',
  'yumurta',
  'naruto',
  'karides',
  'pakchoi',
  'kimchi',
  'lime',
  'nori',
  'mantar',
  'tofu',
]);
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
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [closing, setClosing] = useState(false);
  const [typed, setTyped] = useState(0);
  const [tab, setTab] = useState<Tab>('noodle');
  const [tool, setTool] = useState<Tool>(null);
  const [bowl, setBowl] = useState<Bowl>(emptyBowl);
  const [stage, setStage] = useState<Stage>('prep');
  const [cookP, setCookP] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [shownScore, setShownScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [nudge, setNudge] = useState<string | null>(null);
  const [orderAt, setOrderAt] = useState(0);

  const pouring = useRef(false);
  const lastPiece = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const seq = useRef(1);
  const cooking = stage === 'pot';

  const c = custs[idx];
  if (typeof window !== 'undefined' && window.location.search.includes('bot'))
    (window as unknown as { __order: unknown }).__order = c.order;
  const speech = phase === 'talk' || phase === 'waiting' ? `${c.greet} ${c.text}` : '';
  const unlocked = unlockedUpTo(levelId);
  const noodles = unlocked.filter((i) => INGREDIENTS[i].cat === 'noodle');
  const broths = unlocked.filter((i) => INGREDIENTS[i].cat === 'broth');
  const toppings = unlocked.filter((i) => INGREDIENTS[i].cat === 'topping');

  const flash = useCallback((msg: string) => {
    setNudge(msg);
    sfx('fail');
    buzz(25);
    window.setTimeout(() => setNudge((m) => (m === msg ? null : m)), 1600);
  }, []);

  const go = (s: number) => {
    if (s === station) return;
    setStation(s);
    sfx('whoosh');
  };

  // ---------- customer flow ----------
  useEffect(() => {
    if (!started || paused) return;
    if (phase === 'walkin') {
      sfx(c.phone ? 'phone' : 'door');
      const t = window.setTimeout(() => {
        setPhase('talk');
        setTyped(0);
      }, 1500);
      return () => window.clearTimeout(t);
    }
    if (phase === 'eating') {
      const t = window.setTimeout(
        () => {
          setPhase('react');
          setShownScore(0);
        },
        c.phone ? 2400 : 2600
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
          }, 2200);
        } else {
          setIdx(idx + 1);
          setPhase('walkin');
          setVerdict(null);
        }
      }, 1100);
      return () => window.clearTimeout(t);
    }
  }, [phase, started, paused, c.phone, idx, custs.length, scores, coins, onDone]);

  // typewriter
  useEffect(() => {
    if (phase !== 'talk') return;
    if (typed >= speech.length) return;
    const t = window.setTimeout(() => setTyped((n) => Math.min(speech.length, n + 2)), 24);
    return () => window.clearTimeout(t);
  }, [phase, typed, speech.length]);

  // score count-up
  useEffect(() => {
    if (phase !== 'react' || !verdict) return;
    if (shownScore >= verdict.score) return;
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
    const r = svgRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 300, y: ((e.clientY - r.top) / r.height) * 300 };
  };

  const addPiece = (x: number, y: number) => {
    if (!tool || tool.kind !== 'topping') return;
    const d = Math.hypot(x - 150, y - 150);
    const max = BOWL_R - 16;
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
        s: BIG.has(id) ? 0.78 + Math.random() * 0.1 : 0.62 + Math.random() * 0.1,
        k: seq.current++,
      };
      return { ...b, pieces: [...b.pieces, p] };
    });
    lastPiece.current = { x, y };
    sfx('pop');
    buzz(6);
  };

  const onDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (stage !== 'prep') return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { x, y } = toBowlCoords(e);
    if (Math.hypot(x - 150, y - 150) > 146) return;
    if (!tool) return flash('Önce aşağıdan bir malzeme seç');
    if (tool.kind === 'noodle') {
      setBowl((b) => ({ ...b, noodle: tool.id }));
      sfx('drop');
      buzz(15);
      if (!bowl.broth) {
        setTab('broth');
        setTool({ kind: 'broth', id: broths[0] });
      }
    } else if (tool.kind === 'broth') {
      setBowl((b) => ({ ...b, broth: tool.id }));
      pouring.current = true;
      sfx('splash');
    } else addPiece(x, y);
  };

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!tool || tool.kind !== 'topping' || !lastPiece.current) return;
    const { x, y } = toBowlCoords(e);
    if (Math.hypot(x - lastPiece.current.x, y - lastPiece.current.y) > 34) addPiece(x, y);
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
    setStation(0);
    sfx('whoosh');
    window.setTimeout(() => sfx(c.phone ? 'door' : 'splash'), 700);
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

  function tutorial(): string | null {
    if (levelId > 2 || !started) return null;
    if (phase === 'talk') return '👂 Müşteriyi dinle, sonra “Siparişi al”a bas.';
    if (phase !== 'waiting') return null;
    if (station === 0) return '➡ Hazırlık istasyonuna geç.';
    if (station === 1) {
      if (stage !== 'prep') return '➡ Kase ocakta! Ocak istasyonuna geç.';
      if (!bowl.noodle) return '1️⃣ Erişteyi seç, sonra kaseye dokun.';
      if (!bowl.broth || bowl.fill < 0.72)
        return '2️⃣ Suyu seç, kaseye BASILI TUT ve çizgiye kadar doldur.';
      if (!bowl.pieces.length) return '3️⃣ Malzeme seç, kaseye dokun ya da parmağını sürükle.';
      return '4️⃣ Sipariş tamamsa “Ocağa koy”a bas.';
    }
    if (stage === 'pot') return '🔥 İbre yeşil “Tam kıvam”a gelince Çıkar!';
    if (stage === 'ready') return '🛎 Servis et!';
    return null;
  }

  return (
    <div className="screen play2">
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
          {L.complexity === 1 && (
            <div className="slip-icons">
              {[c.order.noodle, c.order.broth, ...c.order.reqs.map((r) => r.id)]
                .filter(Boolean)
                .map((id, i) => (
                  <IngredientIcon key={i} id={id!} size={20} />
                ))}
            </div>
          )}
        </div>
      )}

      {/* STATIONS */}
      <div className="stage-window">
        <div className="track" style={{ transform: `translateX(${-station * 100}%)` }}>
          {/* SALON */}
          <section className="station salon2">
            <ShopWall
              rain={L.id === 5}
              menu={noodles.map((n) => INGREDIENTS[n].name).join(' • ')}
              cat={<CatArt size={58} sleepy={phase === 'waiting'} />}
            />
            <div className="door">
              <div className="door-noren">
                <span>麺</span>
                <span>屋</span>
              </div>
            </div>
            {custs.length - idx - 1 > 0 && (
              <div className="queue-chip">👥 Kapıda {custs.length - idx - 1} müşteri</div>
            )}
            {!c.phone && (
              <div key={c.id} className={`guest ph-${phase}`}>
                <CustomerArt look={c.look} mood={mood} size={232} />
              </div>
            )}
            {c.phone && (phase === 'eating' || phase === 'react' || phase === 'leave') && (
              <div className={`guest courier-guest ph-${phase}`}>
                <CustomerArt look={{ ...c.look, special: 'ruzgar' }} mood="happy" size={212} />
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
                  <BowlArt
                    bowl={{
                      noodle: bowl.noodle,
                      broth: bowl.broth,
                      toppings: [...new Set(bowl.pieces.map((p) => p.id))],
                    }}
                    width={150}
                    steam={phase === 'eating'}
                  />
                )}
              </div>
            )}
            {phase === 'eating' && !c.phone && (
              <div className="eat-fx">
                <span>😋</span>
                <span>💨</span>
              </div>
            )}
            {phase === 'eating' && c.phone && (
              <div className="scooter-run">
                <Scooter size={90} />
              </div>
            )}

            {/* dialogue */}
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
            <div className="prep-board">
              {stage === 'prep' ? (
                <>
                  <div className="bowl-wrap">
                    <TopBowl
                      noodle={bowl.noodle}
                      broth={bowl.broth}
                      fill={bowl.fill}
                      pieces={bowl.pieces}
                      takeaway={c.phone}
                      svgRef={svgRef}
                      onDown={onDown}
                      onMove={onMove}
                      onUp={onUp}
                    />
                    {tool?.kind === 'broth' && (
                      <div className="ladle" aria-hidden="true">
                        🥄
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
                          ? 'Taşıyor!'
                          : bowl.fill >= 0.72
                            ? 'Su tamam'
                            : 'Su seviyesi'
                        : 'Su yok'}
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
                      onClick={() => setTab(t)}>
                      {t === 'noodle'
                        ? 'Erişte'
                        : t === 'broth'
                          ? 'Su'
                          : `Malzemeler (${toppings.length})`}
                    </button>
                  ))}
                </div>
                <div className={`bins bins-${tab}`}>
                  {(tab === 'noodle' ? noodles : tab === 'broth' ? broths : toppings).map((id) => {
                    const count = bowl.pieces.filter((p) => p.id === id).length;
                    const inBowl =
                      tab === 'noodle'
                        ? bowl.noodle === id
                        : tab === 'broth'
                          ? bowl.broth === id
                          : count > 0;
                    return (
                      <button
                        key={id}
                        data-id={id}
                        className={`bin ${tool?.id === id ? 'sel' : ''} ${inBowl ? 'in' : ''}`}
                        onClick={() => {
                          setTool({ kind: tab, id });
                          sfx('tap');
                        }}>
                        <IngredientIcon id={id} size={tab === 'topping' ? 34 : 40} />
                        <span>{INGREDIENTS[id].name}</span>
                        {tab === 'topping' && count > 0 && <em>{count}</em>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* STOVE */}
          <section className="station stove2">
            <div className="hood" />
            <div className="donabe-wrap">
              <Donabe
                active={stage === 'pot'}
                lidOff={stage === 'ready'}
                hot={Math.min(1, cookP / 100)}
              />
              {stage === 'ready' && (
                <div className="out-bowl">
                  <TopBowl
                    noodle={bowl.noodle}
                    broth={bowl.broth}
                    fill={bowl.fill}
                    pieces={bowl.pieces}
                    cook={bowl.cook}
                    size={180}
                    takeaway={c.phone}
                  />
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

      {!started && (
        <div className="overlay">
          <div className="card start-card">
            <div className="chapter-heading">Gün {L.id}</div>
            <h2>{L.title}</h2>
            <p>{L.subtitle}</p>
            <p className="start-meta">
              👥 {L.customers} müşteri{L.phone ? ` • 📱 ${L.phone} telefon siparişi` : ''}
            </p>
            <button
              className="btn big primary"
              onClick={() => {
                setStarted(true);
                sfx('door');
              }}>
              Kepengi kaldır!
            </button>
          </div>
        </div>
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
