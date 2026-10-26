import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { INGREDIENTS, LEVELS, unlockedUpTo } from '../data';
import { CatArt, Coin, Scooter, type Mood } from '../art';
import { Avatar } from '../avatar';
import type { Piece } from '../bowl';
import Kamado from './Kamado';
import { BOWLS, bowlsUpTo } from '../bowls';
import { ChangePanel, RegisterDecor, TipJar } from './Cash';
import {
  RENT,
  UTILITIES,
  cashGiven,
  costCents,
  fmt,
  priceCents,
  tipCents,
  type DayLedger,
} from '../money';
import {
  BOWL_R,
  THICK_LABEL,
  THICK_W,
  drawBowl as drawBowlImg,
  type BowlDraw,
  type Thick,
} from '../food';
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
import { Restaurant as RestaurantRaw } from './Scenery';
const Restaurant = memo(RestaurantRaw);
import { decorTipBonus } from '../decor';
import Establishing from './Establishing';
import type { Save } from '../App';

export interface DayResult {
  coins: number;
  ledger: DayLedger;
  cashBefore?: number;
  cashAfter?: number;
  stars: number;
  served: number;
  perfect: number;
  unhappy: number;
  avg: number;
}

type Phase = 'walkin' | 'talk' | 'waiting' | 'eating' | 'react' | 'pay' | 'leave';
type Tool = { kind: 'noodle' | 'broth' | 'topping'; id: string } | null;
type Tab = 'bowl' | 'noodle' | 'broth' | 'topping';

type Stage = 'prep' | 'pot' | 'ready';

const SCATTER = new Set(['yesil', 'susam', 'citir', 'filiz', 'misir', 'aciyag', 'biber']);
const COOK_SPEED = 100 / 7.5; // progress units per second
const MAX_PIECES = 600;
const BOWL_THUMB: Record<string, BowlDraw> = Object.fromEntries(
  Object.keys(BOWLS).map((id) => [id, { fill: 0, pieces: [], style: id }])
);
const CAT_SPOTS = [
  { left: '6%', bottom: '44%' },
  { left: '72%', bottom: '21%' },
  { left: '38%', bottom: '58%' },
  { left: '14%', bottom: '20%' },
];

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
  const [tool, setTool] = useState<Tool>(null);
  const [thick, setThick] = useState<Thick>('orta');
  const [bowl, setBowl] = useState<Bowl>(emptyBowl);
  const [stage, setStage] = useState<Stage>('prep');
  const [cookP, setCookP] = useState(0);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [shownScore, setShownScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [ledger, setLedger] = useState<DayLedger>(() => ({
    sales: 0,
    tips: 0,
    bonus: 0,
    ingredients: 0,
    waste: 0,
    overChange: 0,
    unpaid: 0,
    bowls: 0,
    changeMistakes: 0,
    rent: RENT(levelId),
    utilities: UTILITIES(levelId),
  }));
  const [jar, setJar] = useState(0);
  const [jarBump, setJarBump] = useState(0);
  const [bill, setBill] = useState<{
    due: number;
    given: number;
    tip: number;
    bonus: number;
    paid: boolean;
  } | null>(null);
  const [lifting, setLifting] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [nudge, setNudge] = useState<string | null>(null);
  const [orderAt, setOrderAt] = useState(0);
  const [bowlSize, setBowlSize] = useState(300);
  const [drag, setDrag] = useState<{ x: number; y: number; over: boolean } | null>(null);
  const ghostImg = useRef<string>('');
  const [catSpot, setCatSpot] = useState(0);

  const pouring = useRef(false);
  const lastPiece = useRef<{ x: number; y: number } | null>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const seq = useRef(1);
  const cooking = stage === 'pot';
  const dragRef = useRef<{ sx: number; sy: number; on: boolean } | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const serveRef = useRef<HTMLDivElement>(null);

  const c = custs[idx];
  if (typeof window !== 'undefined' && window.location.search.includes('bot'))
    (window as unknown as { __order: unknown; __dbg: unknown }).__order = c.order;
  if (typeof window !== 'undefined' && window.location.search.includes('bot'))
    (window as unknown as { __dbg: unknown }).__dbg = { phase, stage, station, typed };
  const speech = phase === 'talk' || phase === 'waiting' ? `${c.greet} ${c.text}` : '';
  const unlocked = unlockedUpTo(levelId);
  const noodles = unlocked.filter((i) => INGREDIENTS[i].cat === 'noodle');
  const broths = unlocked.filter((i) => INGREDIENTS[i].cat === 'broth');
  const sauces = unlocked.filter((i) => INGREDIENTS[i].cat === 'sauce');
  const toppings = unlocked.filter((i) => INGREDIENTS[i].cat === 'topping');
  const bowlStyles = bowlsUpTo(levelId);

  // Miso wanders around the salon
  useEffect(() => {
    const t = window.setInterval(() => setCatSpot((n) => (n + 1) % CAT_SPOTS.length), 14000);
    return () => window.clearInterval(t);
  }, []);

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
    const v = s > 0 ? 1 : 0;
    setStation((cur) => {
      if (cur === v) return cur;
      setPanning(true);
      window.setTimeout(() => setPanning(false), 820);
      sfx('whoosh');
      return v;
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
              ledger,
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
  }, [phase, started, paused, c.phone, idx, custs.length, scores, coins, ledger, onDone]);

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
    let frame = 0;
    let cookAcc = 0;
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
      frame++;
      cookAcc += dt;
      if (cooking && frame % 2 === 0) {
        const step = cookAcc;
        cookAcc = 0;
        setCookP((p) => {
          const n = p + step * COOK_SPEED;
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
    const max = BOWL_R - 36;
    if (d > max) {
      x = 150 + ((x - 150) / d) * max;
      y = 150 + ((y - 150) / d) * max;
    }
    const id = tool.id;
    setBowl((b) => {
      if (b.pieces.length >= MAX_PIECES) return b;
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
    if (!bowl.style) return flash('Önce bir kase seç');
    if (!tool) {
      if (bowl.noodle) return startDrag(e);
      return flash('Önce aşağıdaki küvetlerden birini seç');
    }
    if (tool.kind === 'noodle') {
      setBowl((b) => ({ ...b, noodle: tool.id, thick }));
      sfx('drop');
      buzz(15);
      if (!bowl.broth) {
        setTool(null);
      }
    } else if (tool.kind === 'broth') {
      setBowl((b) => ({ ...b, broth: tool.id, fill: b.broth && b.broth !== tool.id ? 0 : b.fill }));
      pouring.current = true;
      sfx('splash');
    } else addPiece(x, y);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragRef.current) return moveDrag(e);
    if (!tool || tool.kind !== 'topping' || !lastPiece.current) return;
    const { x, y } = toBowlCoords(e);
    if (Math.hypot(x - lastPiece.current.x, y - lastPiece.current.y) > 30) addPiece(x, y);
  };

  const onUp = () => {
    if (dragRef.current) return endDrag();
    lastPiece.current = null;
    if (pouring.current) {
      pouring.current = false;
      if (bowl.fill >= 0.7) {
        setTool(null);
      }
    }
  };

  // ---- drag the finished bowl to the oven ----
  const startDrag = (e: React.PointerEvent) => {
    if (stage !== 'prep') return;
    if (!bowl.noodle) return flash('Kasede erişte yok!');
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, on: false };
    ghostImg.current = snapshotBowl();
    setDrag({ x: e.clientX, y: e.clientY, over: false });
    sfx('tap');
    buzz(10);
  };
  /** one cheap raster of the bowl for the drag ghost (no per-frame redraws) */
  const snapshotBowl = () => {
    const cv = document.createElement('canvas');
    cv.width = 300;
    cv.height = 300;
    const ctx = cv.getContext('2d')!;
    drawBowlImg(ctx, drawBowl);
    return cv.toDataURL();
  };
  const moveDrag = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const target = stage === 'ready' ? serveRef.current : dropRef.current;
    const r = target?.getBoundingClientRect();
    const over =
      !!r &&
      r.width > 0 &&
      e.clientX >= r.left - 24 &&
      e.clientX <= r.right + 24 &&
      e.clientY >= r.top - 24 &&
      e.clientY <= r.bottom + 24;
    if (over !== d.on) {
      d.on = over;
      if (over) buzz(12);
    }
    setDrag({ x: e.clientX, y: e.clientY, over });
  };
  const endDrag = () => {
    const d = dragRef.current;
    dragRef.current = null;
    setDrag(null);
    if (!d?.on) return;
    if (stage === 'ready') serveIt();
    else toPot();
  };
  const startCarry = (e: React.PointerEvent) => {
    if (stage !== 'ready') return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { sx: e.clientX, sy: e.clientY, on: false };
    ghostImg.current = snapshotBowl();
    setDrag({ x: e.clientX, y: e.clientY, over: false });
    sfx('tap');
    buzz(10);
  };

  const undo = () => {
    setBowl((b) => ({ ...b, pieces: b.pieces.slice(0, -1) }));
    sfx('tap');
  };
  const trash = () => {
    const wasted = costCents(bowl);
    if (wasted > 0) setLedger((l) => ({ ...l, waste: l.waste + wasted }));
    setBowl(emptyBowl());
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
    if (lifting) return;
    const cs = cookStateAt(cookP);
    setLifting(true);
    sfx('splash');
    buzz(20);
    window.setTimeout(() => {
      setBowl((b) => ({ ...b, cook: cs }));
      setStage('ready');
      setLifting(false);
      sfx(cs === 'perfect' || cs === 'dente' ? 'perfect' : cs === 'soft' ? 'coins' : 'fail');
    }, 1150);
  };

  const serveIt = () => {
    const wait = (performance.now() - orderAt) / 1000;
    const v = judge(c.order, bowl, wait, c.bonus);
    setVerdict(v);
    setPhase('eating');
    setScores((s) => [...s, v.score]);
    const due = priceCents(c.order);
    const paid = v.score >= 30;
    const tip = paid ? tipCents(v.score, due, decorTipBonus(save.decor)) : 0;
    const bonus = paid ? v.bonus * 10 : 0;
    setBill({ due, given: c.phone ? due : cashGiven(due, levelId), tip, bonus, paid });
    const cost = costCents(bowl);
    setLedger((l) => ({
      ...l,
      ingredients: l.ingredients + cost,
      bowls: l.bowls + 1,
      unpaid: l.unpaid + (paid ? 0 : 1),
      // phone orders are prepaid by card
      sales: l.sales + (c.phone && paid ? due : 0),
      tips: l.tips + (c.phone ? tip : 0),
      bonus: l.bonus + (c.phone ? bonus : 0),
    }));
    if (c.phone && paid) setCoins((m) => m + due + tip + bonus);
    go(0);
    window.setTimeout(() => sfx(c.phone ? 'door' : 'splash'), 800);
  };

  const nextCustomer = () => {
    if (bill && bill.paid && !c.phone) {
      setPhase('pay');
      sfx('ding');
      return;
    }
    if (bill && c.phone && bill.tip) {
      setJar((j) => j + bill.tip + bill.bonus);
      setJarBump((n) => n + 1);
    }
    setPhase('leave');
    sfx('coins');
  };

  const finishPayment = (gave: number, mistakes: number) => {
    if (!bill) return;
    const over = Math.max(0, gave - (bill.given - bill.due));
    setLedger((l) => ({
      ...l,
      sales: l.sales + bill.due,
      tips: l.tips + bill.tip,
      bonus: l.bonus + bill.bonus,
      overChange: l.overChange + over,
      changeMistakes: l.changeMistakes + mistakes,
    }));
    setCoins((m) => m + bill.due + bill.tip + bill.bonus - over);
    if (bill.tip || bill.bonus) {
      setJar((j) => j + bill.tip + bill.bonus);
      setJarBump((n) => n + 1);
      window.setTimeout(() => sfx('coins'), 300);
    }
    if (over) flash(`Fazla para üstü verdin: ${fmt(over)} kaybettin`);
    setPhase('leave');
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
  const drawBowl = useMemo(
    () => ({ ...bowl, liquid: bowl.broth, takeaway: c.phone, style: bowl.style }),
    [bowl, c.phone]
  );
  const closeUp = station === 0 && (phase === 'talk' || phase === 'react');
  const liquidIsSauce = bowl.broth ? INGREDIENTS[bowl.broth].cat === 'sauce' : false;

  function tutorial(): string | null {
    if (levelId > 1 || !started) return null;
    if (phase === 'pay') return '💵 Verilen paradan hesabı çıkar, para üstünü çekmeceden seç.';
    if (phase !== 'waiting') return null;
    if (station === 1) {
      if (stage === 'pot') return 'Kadran “Tam”a gelince Çıkar!';
      if (stage === 'ready') return 'Kaseyi tut, servis penceresine bırak.';
      if (!bowl.style) return 'Sağdan bir kase seç.';
      if (!bowl.noodle) return 'Kalınlığı seç, erişte küvetine dokun, sonra kaseye dokun.';
      if (!bowl.broth || bowl.fill < 0.72) return 'Suyu seç, kaseye basılı tutarak doldur.';
      if (!bowl.pieces.length) return 'Malzeme küvetini seç, kaseye serpiştir.';
      return 'Kaseyi tutup kaynar suya bırak.';
    }
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
            {fmt(coins)}
          </b>
        </div>
      </div>

      {/* STATIONS */}
      <div className="stage-window">
        <div
          className={`track ${panning ? 'panning' : ''}`}
          style={{ transform: `translateX(${-station * 100}%)` }}>
          {/* SALON */}
          <section className="station salon2">
            <div className="salon-cam">
              <Restaurant
                decor={save.decor}
                time={L.time}
                weather={L.weather}
                menu={noodles.map((n) => INGREDIENTS[n].name).join(' • ')}
              />
              <div className="miso-roam" style={CAT_SPOTS[catSpot]}>
                <CatArt size={58} sleepy={phase === 'waiting'} />
              </div>
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
              <div
                ref={serveRef}
                className={`serve-drop ${drag && stage === 'ready' ? 'show' : ''} ${drag?.over && stage === 'ready' ? 'hot' : ''}`}>
                <span>🛎</span>
                <b>{c.phone ? 'Paketle' : 'Servis'}</b>
              </div>
              <RegisterDecor
                open={phase === 'pay'}
                display={bill && (phase === 'react' || phase === 'pay') ? fmt(bill.due) : '$0.00'}
              />
              <TipJar amount={jar} bump={jarBump} />
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
                {bill && (
                  <div className="pay-row">
                    {bill.paid ? (
                      <span>
                        <Coin size={16} /> Hesap {fmt(bill.due)}
                        {c.phone ? ' (kartla ödendi)' : ''}
                      </span>
                    ) : (
                      <span className="tip-off">Ödemeyi reddetti</span>
                    )}
                    <span className={bill.tip ? 'tip-on' : 'tip-off'}>Bahşiş {fmt(bill.tip)}</span>
                    {bill.bonus > 0 && <span className="tip-on">⭐ Bonus {fmt(bill.bonus)}</span>}
                  </div>
                )}
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
                  {bill && bill.paid && !c.phone
                    ? 'Kasaya geç 💵'
                    : idx + 1 >= custs.length
                      ? 'Günü bitir'
                      : 'Sıradaki müşteri →'}
                </button>
              </div>
            )}
            {phase === 'pay' && bill && (
              <ChangePanel
                key={c.id}
                name={c.name}
                due={bill.due}
                given={bill.given}
                showAnswer={levelId <= 2}
                onDone={finishPayment}
              />
            )}
          </section>

          {/* KITCHEN */}
          <section className="station kitchen">
            <div className="pot-area">
              <Kamado
                mode={lifting ? 'lift' : stage === 'pot' ? 'boil' : 'idle'}
                noodle={stage === 'ready' ? undefined : bowl.noodle}
                thick={bowl.thick}
                heat={Math.min(1.3, cookP / 100)}
              />
              <div
                ref={dropRef}
                className={`pot-drop ${drag && stage === 'prep' ? 'show' : ''} ${drag?.over && stage === 'prep' ? 'hot' : ''}`}>
                <span>♨</span>
                <b>Kaynar su</b>
              </div>
              <div
                ref={serveRef}
                className={`hatch ${stage === 'ready' ? 'open' : ''} ${drag && stage === 'ready' ? 'show' : ''} ${drag?.over && stage === 'ready' ? 'hot' : ''}`}>
                <i />
                <b>{c.phone ? 'Paket' : 'Servis'}</b>
              </div>
              {stage === 'pot' && (
                <div className="cook-ctl">
                  <div className={`cook-now cb-${cookNow}`}>{COOK_LABEL[cookNow]}</div>
                  <button className="btn big primary" onClick={takeOut}>
                    Çıkar!
                  </button>
                </div>
              )}
              {stage === 'ready' && (
                <div
                  className={`out-bowl carry ${drag ? 'lifted' : ''}`}
                  onPointerDown={startCarry}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}>
                  <BowlCanvas bowl={drawBowl} size={150} />
                  <div className={`cook-badge cb-${bowl.cook}`}>
                    {COOK_LABEL[bowl.cook ?? 'raw']}
                  </div>
                </div>
              )}
            </div>

            <div className="prep-area">
              {phase === 'waiting' && (
                <div className="slip">
                  <div className="slip-head">
                    {c.phone ? '📱' : '🪑'} {c.name}
                    {c.special && <span className="slip-vip">ÖZEL MİSAFİR</span>}
                  </div>
                  <div className="slip-text">{c.text}</div>
                </div>
              )}
              {hint && station === 1 && <div className="hint3">{hint}</div>}
              <div className="prep-board" ref={boardRef}>
                {stage === 'prep' ? (
                  <>
                    {tool && (
                      <div className="tool-chip">
                        {tool.kind === 'noodle'
                          ? `${THICK_LABEL[thick]} ${INGREDIENTS[tool.id].name}`
                          : INGREDIENTS[tool.id].name}
                      </div>
                    )}
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
                              ? 'Sos çok fazla'
                              : 'Taşıyor'
                            : bowl.fill >= 0.72
                              ? liquidIsSauce
                                ? 'Sos tamam'
                                : 'Su tamam'
                              : liquidIsSauce
                                ? 'Sos'
                                : 'Su'
                          : ''}
                      </span>
                    </div>
                    <div className="prep-tools">
                      <button className="tool-btn" onClick={undo} disabled={!bowl.pieces.length}>
                        ↶
                      </button>
                      <button className="tool-btn" onClick={trash}>
                        🗑
                      </button>
                      <button
                        className={`tool-btn go ${bowl.noodle && bowl.fill >= 0.5 ? 'ready' : ''}`}
                        onPointerDown={startDrag}
                        onPointerMove={moveDrag}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}>
                        ✋ Kaseyi tut
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="prep-empty" />
                )}
              </div>
            </div>

            <aside className="panel">
              <div className="panel-top">
                <div className="style-row">
                  {bowlStyles.map((id) => (
                    <button
                      key={id}
                      className={`bowl-opt ${bowl.style === id ? 'on' : ''}`}
                      onClick={() => {
                        setBowl((b) => ({ ...b, style: id }));
                        sfx('drop');
                        buzz(10);
                      }}
                      aria-label={BOWLS[id].name}>
                      <BowlCanvas bowl={BOWL_THUMB[id]} size={36} />
                    </button>
                  ))}
                </div>
                <div className="thick-row">
                  {(['ince', 'orta', 'kalin'] as Thick[]).map((t) => (
                    <button
                      key={t}
                      className={`thick ${thick === t ? 'on' : ''}`}
                      onClick={() => {
                        setThick(t);
                        sfx('tap');
                      }}>
                      <i style={{ height: THICK_W[t] * 1.2 }} />
                      <span>{THICK_LABEL[t]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="tubs base">
                {noodles.map((id) => (
                  <BinButton
                    key={id}
                    id={id}
                    tab="noodle"
                    bowl={bowl}
                    tool={tool}
                    thick={thick}
                    onPick={(kind) => kind !== 'bowl' && setTool({ kind, id })}
                  />
                ))}
                {[...broths, ...sauces].map((id) => (
                  <BinButton
                    key={id}
                    id={id}
                    tab="broth"
                    bowl={bowl}
                    tool={tool}
                    thick={thick}
                    onPick={(kind) => kind !== 'bowl' && setTool({ kind, id })}
                  />
                ))}
              </div>
              <div className="tubs tops">
                {toppings.map((id) => (
                  <BinButton
                    key={id}
                    id={id}
                    tab="topping"
                    bowl={bowl}
                    tool={tool}
                    thick={thick}
                    onPick={(kind) => kind !== 'bowl' && setTool({ kind, id })}
                  />
                ))}
              </div>
            </aside>
          </section>
        </div>
        <div className="vignette" />
      </div>
      {drag &&
        createPortal(
          <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
            <img src={ghostImg.current} alt="" width={Math.round(bowlSize * 0.55)} />
          </div>,
          document.body
        )}

      {nudge && <div className="nudge2">{nudge}</div>}

      {/* front ⇄ kitchen */}
      <button
        className={`flip ${station === 0 ? 'to-kitchen' : 'to-front'} ${
          (station !== 0 && phase === 'talk') ||
          (station === 0 && phase === 'waiting' && stage === 'prep')
            ? 'alert'
            : ''
        }`}
        onClick={() => go(station === 0 ? 1 : 0)}
        aria-label={station === 0 ? 'Mutfağa geç' : 'Salona geç'}>
        {station === 0 ? 'Mutfak ›' : '‹ Salon'}
      </button>

      {intro && (
        <Establishing
          day={L.id}
          title={L.title}
          subtitle={L.subtitle}
          meta={`${L.customers} müşteri${L.phone ? ` • ${L.phone} telefon siparişi` : ''}`}
          time={L.time}
          weather={L.weather}
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
      <Tray id={id} thick={thick} width={64} />
      {tab === 'topping' && count > 0 && <em>{count}</em>}
    </button>
  );
}
