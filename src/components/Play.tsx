import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { INGREDIENTS, LEVELS, unlockedUpTo } from '../data';
import { CatArt, Coin, Scooter, type Mood } from '../art';
import { Avatar } from '../avatar';
import type { Piece } from '../bowl';
import Stove from './Stove';
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
import { Restaurant } from './Scenery';
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
const STATIONS = ['Salon', 'Hazırlık', 'Ocak'];
const MAX_PIECES = 600;
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
  const [tab, setTab] = useState<Tab>('bowl');
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
    (window as unknown as { __order: unknown }).__order = c.order;
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

  const stageRef = useRef<HTMLDivElement>(null);
  const go = (s: number) => {
    const el = stageRef.current;
    if (!el) return;
    const cur = Math.round(el.scrollLeft / el.clientWidth);
    if (cur === s) return;
    setPanning(true);
    window.setTimeout(() => setPanning(false), 820);
    sfx('whoosh');
    el.scrollTo({ left: s * el.clientWidth, behavior: 'smooth' });
  };
  // keep `station` in sync with the swipe position
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const s = Math.round(el.scrollLeft / el.clientWidth);
        setStation((cur) => (cur === s ? cur : s));
      });
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

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
    setTab('bowl');
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
        setTab('topping');
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
    setDrag({ x: e.clientX, y: e.clientY, over: false });
    sfx('tap');
    buzz(10);
  };
  const edgeTimer = useRef(0);
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
    // carrying the bowl to the edge of the screen pans the kitchen
    const el = stageRef.current;
    if (el) {
      const w = el.clientWidth;
      const now = performance.now();
      const cur = Math.round(el.scrollLeft / w);
      if (e.clientX > window.innerWidth * 0.88 && now > edgeTimer.current && cur < 2) {
        edgeTimer.current = now + 900;
        go(cur + 1);
      } else if (e.clientX < window.innerWidth * 0.12 && now > edgeTimer.current && cur > 0) {
        edgeTimer.current = now + 900;
        go(cur - 1);
      }
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
    setTab('bowl');
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
  const drawBowl = { ...bowl, liquid: bowl.broth, takeaway: c.phone, style: bowl.style };
  const closeUp = station === 0 && (phase === 'talk' || phase === 'react');
  const liquidIsSauce = bowl.broth ? INGREDIENTS[bowl.broth].cat === 'sauce' : false;

  function tutorial(): string | null {
    if (levelId > 2 || !started) return null;
    if (phase === 'talk') return '👂 Müşteriyi dinle, sonra “Siparişi al”a bas.';
    if (phase === 'pay') return '💵 Verilen paradan hesabı çıkar, para üstünü çekmeceden seç.';
    if (phase !== 'waiting') return null;
    if (station === 0) return '👉 Sağa kaydır: mutfak orada.';
    if (station === 1) {
      if (stage !== 'prep') return '👉 Erişte kaynıyor! Ocağa kaydır.';
      if (!bowl.style) return '🥣 Önce bir kase seç.';
      if (!bowl.noodle) return '1️⃣ Kalınlığı seç, erişte küvetine dokun, sonra kaseye dokun.';
      if (!bowl.broth || bowl.fill < 0.72)
        return '2️⃣ Suyu ya da sosu seç, kaseye BASILI TUT, çizgiye kadar doldur.';
      if (!bowl.pieces.length)
        return '3️⃣ Malzeme küvetini seç, kaseye dokun ya da parmağını sürükle.';
      return '4️⃣ Sipariş tamamsa kaseyi tut, sağa taşı, kaynar suya bırak.';
    }
    if (stage === 'pot') return '🔥 Kadran yeşil “Tam”a gelince Çıkar!';
    if (stage === 'ready') return '✋ Kaseyi tut, salona taşı, tezgâha bırak.';
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
      <div className={`stage-window scroller ${drag ? 'dragging' : ''}`} ref={stageRef}>
        <div className={`track ${panning ? 'panning' : ''}`}>
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
                    Mutfağa kaydır →
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
                      onPointerDown={startDrag}
                      onPointerMove={moveDrag}
                      onPointerUp={endDrag}
                      onPointerCancel={endDrag}>
                      ✋ Ocağa sürükle
                    </button>
                  </div>
                  {drag &&
                    createPortal(
                      <div className="drag-ghost" style={{ left: drag.x, top: drag.y }}>
                        <BowlCanvas bowl={drawBowl} size={Math.round(bowlSize * 0.6)} />
                      </div>,
                      document.body
                    )}
                </>
              ) : (
                <div className="prep-empty">
                  <p>{stage === 'pot' ? 'Erişte kaynar suda!' : 'Kase hazır, servis bekliyor.'}</p>
                  <button className="btn primary" onClick={() => go(2)}>
                    Ocağa git →
                  </button>
                </div>
              )}
            </div>
            {stage === 'prep' && (
              <div className="pantry2">
                <div className="tabs">
                  {(['bowl', 'noodle', 'broth', 'topping'] as Tab[]).map((t) => (
                    <button
                      key={t}
                      className={`tab ${tab === t ? 'on' : ''}`}
                      onClick={() => {
                        setTab(t);
                        sfx('tap');
                      }}>
                      {t === 'bowl'
                        ? 'Kase'
                        : t === 'noodle'
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
                {tab === 'bowl' && (
                  <div className="bowl-picker">
                    {bowlStyles.map((id) => (
                      <button
                        key={id}
                        className={`bowl-opt ${bowl.style === id ? 'on' : ''}`}
                        onClick={() => {
                          setBowl((b) => ({ ...b, style: id }));
                          setTab('noodle');
                          sfx('drop');
                          buzz(10);
                        }}>
                        <BowlCanvas bowl={{ fill: 0, pieces: [], style: id }} size={84} />
                        <span>{BOWLS[id].name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className={`bins bins-${tab}`}>
                  {tab === 'broth' && <div className="bin-group">Çorba (su)</div>}
                  {(tab === 'noodle'
                    ? noodles
                    : tab === 'broth'
                      ? broths
                      : tab === 'bowl'
                        ? []
                        : toppings
                  ).map((id) => (
                    <BinButton
                      key={id}
                      id={id}
                      tab={tab}
                      bowl={bowl}
                      tool={tool}
                      thick={thick}
                      onPick={(kind) => kind !== 'bowl' && setTool({ kind, id })}
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
                        onPick={(kind) => kind !== 'bowl' && setTool({ kind, id })}
                      />
                    ))}
                </div>
              </div>
            )}
          </section>

          {/* STOVE */}
          <section className="station stove2">
            <div className="donabe-wrap">
              <Stove
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
              {stage === 'ready' && (
                <div
                  className={`out-bowl carry ${drag ? 'lifted' : ''}`}
                  onPointerDown={startCarry}
                  onPointerMove={moveDrag}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}>
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
              <div className="cook-panel idle">
                <p>
                  {c.phone
                    ? 'Kaseyi tut, salona taşı ve paketle.'
                    : 'Kaseyi tut, salona taşı ve tezgâha bırak.'}
                </p>
              </div>
            )}
            {stage === 'prep' && (
              <div className="cook-panel idle">
                <p>
                  {phase === 'waiting'
                    ? 'Kaseyi hazırlıkta hazırla, sonra kaynar suya sürükle.'
                    : 'Ocak boşta.'}
                </p>
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

      {/* swipe indicator */}
      <div className="kdots">
        {STATIONS.map((s, i) => (
          <button
            key={s}
            className={`kdot ${station === i ? 'on' : ''} ${
              (i === 0 && phase === 'talk' && station !== 0) ||
              (i === 2 && stage === 'pot' && station !== 2 && cookP > 70)
                ? 'alert'
                : ''
            }`}
            aria-label={s}
            onClick={() => go(i)}>
            <i />
            <span>{s}</span>
          </button>
        ))}
      </div>

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
      <Tray id={id} thick={thick} width={tab === 'topping' ? 92 : 120} />
      <span>{INGREDIENTS[id].name}</span>
      {tab === 'topping' && count > 0 && <em>{count}</em>}
    </button>
  );
}
