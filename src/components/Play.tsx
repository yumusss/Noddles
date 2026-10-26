import { useCallback, useEffect, useRef, useState } from 'react';
import { INGREDIENTS, LEVELS, unlockedUpTo } from '../data';
import { CatArt, Coin, Scooter, type Mood } from '../art';
import { Avatar } from '../avatar';
import type { Piece } from '../bowl';
import { ChangePanel, RegisterDecor, TipJar } from './Cash';
import { CounterDeco } from './CounterDeco';
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
import { BOWLS, THICK_LABEL, THICK_W, isBigTopping, platePiece, type Thick } from '../food';
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
import Restaurant from './Restaurant';
import Kamado, { TimerPlaque } from './Kamado';
import FullscreenButton from './Fullscreen';
import { tipBonus, withDefaults } from '../decor';
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
type Tool = { kind: Kind; id: string } | null;
type Kind = 'noodle' | 'broth' | 'topping';
type Stage = 'prep' | 'pot' | 'ready';

const COOK_SPEED = 100 / 7.5; // progress units per second
const STATIONS = ['Salon', 'Hazırlık', 'Ocak'];
type DragSrc = 'prep' | 'ready';

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
  const [intro, setIntro] = useState(true);
  const [paused, setPaused] = useState(false);
  const [closing, setClosing] = useState(false);
  const [typed, setTyped] = useState(0);
  const [kasePick, setKasePick] = useState(false);
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
  const [kase, setKase] = useState('kirmizi');
  const [drag, setDrag] = useState<{
    x: number;
    y: number;
    over: boolean;
    src: DragSrc;
    moved: boolean;
  } | null>(null);
  const dragRef = useRef<{ sx: number; sy: number; x: number; y: number; src: DragSrc } | null>(
    null
  );
  const autoRef = useRef(0);
  const [stageH, setStageH] = useState(600);
  const [stageW, setStageW] = useState(400);
  const [slipPad, setSlipPad] = useState(80);
  const slipRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const stationRef = useRef(0);
  const decor = withDefaults(save.decor);
  const decorTip = tipBonus(decor);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setStageH(r.height);
      setStageW(r.width);
      const w = worldRef.current;
      if (w) w.scrollLeft = stationRef.current * w.clientWidth;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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

  // keep the kitchen content below the order ticket, however many lines it has
  const slipOn = phase === 'waiting' && station !== 0;
  useEffect(() => {
    const el = slipRef.current;
    const st = stageRef.current;
    if (!el || !st) return;
    const ro = new ResizeObserver(() =>
      setSlipPad(Math.round(el.getBoundingClientRect().bottom - st.getBoundingClientRect().top + 6))
    );
    ro.observe(el);
    const t = window.setTimeout(
      () =>
        setSlipPad(
          Math.round(el.getBoundingClientRect().bottom - st.getBoundingClientRect().top + 6)
        ),
      700
    );
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [slipOn, idx]);

  // size the bowl to the space the prep board actually has
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setBowlSize(Math.max(170, Math.min(r.width - 8, r.height - 64, 400)));
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
    const w = worldRef.current;
    if (!w) return;
    if (stationRef.current !== s) sfx('whoosh');
    w.scrollTo({ left: s * w.clientWidth, behavior: 'smooth' });
  };
  const onWorldScroll = () => {
    const w = worldRef.current;
    if (!w || !w.clientWidth) return;
    const s = Math.round(w.scrollLeft / w.clientWidth);
    if (s !== stationRef.current) {
      stationRef.current = s;
      setStation(s);
      setKasePick(false);
    }
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
    const id = tool.id;
    setBowl((b) => {
      if (b.pieces.filter((p) => p.id === id).length >= 200 || b.pieces.length >= 450) return b;
      const p: Piece = platePiece(id, x, y, b.pieces, seq.current++);
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
    if (!tool) return flash('Önce kenardaki kaplardan birini seç');
    if (tool.kind === 'noodle') {
      setBowl((b) => ({ ...b, noodle: tool.id, thick }));
      sfx('drop');
      buzz(15);
      if (!bowl.broth) setTool(null);
    } else if (tool.kind === 'broth') {
      setBowl((b) => ({ ...b, broth: tool.id, fill: b.broth && b.broth !== tool.id ? 0 : b.fill }));
      pouring.current = true;
      sfx('splash');
    } else addPiece(x, y);
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!tool || tool.kind !== 'topping' || !lastPiece.current) return;
    const { x, y } = toBowlCoords(e);
    if (
      Math.hypot(x - lastPiece.current.x, y - lastPiece.current.y) >
      (isBigTopping(tool.id) ? 46 : 26)
    )
      addPiece(x, y);
  };

  const onUp = () => {
    lastPiece.current = null;
    if (pouring.current) {
      pouring.current = false;
      if (bowl.fill >= 0.7) setTool(null);
    }
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
    if (stage !== 'prep') return;
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
    if (stage !== 'ready' || phase !== 'waiting') return;
    const wait = (performance.now() - orderAt) / 1000;
    const v = judge(c.order, { ...bowl, style: kase }, wait, c.bonus);
    setVerdict(v);
    setPhase('eating');
    setScores((s) => [...s, v.score]);
    const due = priceCents(c.order);
    const paid = v.score >= 30;
    const tip = paid ? Math.round((tipCents(v.score, due) * (1 + decorTip / 100)) / 25) * 25 : 0;
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

  // ---------- carrying the bowl (Good Pizza style) ----------
  const zoneRect = (src: DragSrc) =>
    document.querySelector(src === 'prep' ? '.kamado' : '.serve-zone')?.getBoundingClientRect();
  const isOver = (src: DragSrc, x: number, y: number) => {
    const z = zoneRect(src);
    return (
      !!z &&
      z.width > 0 &&
      z.right > 0 &&
      z.left < window.innerWidth &&
      x >= z.left - 24 &&
      x <= z.right + 24 &&
      y >= z.top - 50 &&
      y <= z.bottom + 50
    );
  };
  const stopAuto = () => {
    cancelAnimationFrame(autoRef.current);
    autoRef.current = 0;
  };
  const startAuto = () => {
    if (autoRef.current) return;
    const tick = () => {
      const d = dragRef.current;
      const w = worldRef.current;
      if (!d || !w) {
        autoRef.current = 0;
        return;
      }
      const edge = Math.max(48, window.innerWidth * 0.08);
      const over = isOver(d.src, d.x, d.y);
      const v = over ? 0 : d.x > window.innerWidth - edge ? 18 : d.x < edge ? -18 : 0;
      if (v) {
        w.scrollLeft += v;
        setDrag((g) => (g ? { ...g, over: isOver(d.src, d.x, d.y) } : g));
      }
      autoRef.current = requestAnimationFrame(tick);
    };
    autoRef.current = requestAnimationFrame(tick);
  };
  const grip = (src: DragSrc) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      dragRef.current = { sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, src };
      setDrag({ x: e.clientX, y: e.clientY, over: false, src, moved: false });
      setKasePick(false);
      sfx('tap');
      startAuto();
    },
    onPointerMove: (e: React.PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      d.x = e.clientX;
      d.y = e.clientY;
      const moved = Math.hypot(d.x - d.sx, d.y - d.sy) > 12;
      setDrag({ x: d.x, y: d.y, over: isOver(src, d.x, d.y), src, moved });
    },
    onPointerUp: (e: React.PointerEvent) => {
      const d = dragRef.current;
      dragRef.current = null;
      stopAuto();
      setDrag(null);
      if (!d) return;
      const moved = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
      if (moved < 12 || isOver(src, e.clientX, e.clientY)) {
        if (src === 'prep') toPot();
        else serveIt();
      } else {
        sfx('tap');
        go(src === 'prep' ? 1 : 2);
      }
    },
    onPointerCancel: () => {
      dragRef.current = null;
      stopAuto();
      setDrag(null);
    },
  });

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
  const drawBowl = { ...bowl, liquid: bowl.broth, takeaway: c.phone, style: kase };
  const guestSize = Math.round(Math.max(220, Math.min(420, stageH * 0.47)));
  const wide = stageW >= 760;
  const trayW = wide ? 84 : 58;
  const half = Math.ceil(toppings.length / 2);
  const kamadoW = Math.round(
    Math.min(stageW * 0.94, wide ? (stageH - 110) / 1.0 : (stageH - slipPad - 260) / 0.95, 720)
  );
  const tod = L.time ?? 'ogle';
  const rain = !!L.rain;
  const ovenState = lifting
    ? 'opening'
    : stage === 'pot'
      ? 'cooking'
      : stage === 'ready'
        ? 'ready'
        : 'empty';
  const closeUp = station === 0 && (phase === 'talk' || phase === 'react');
  const liquidIsSauce = bowl.broth ? INGREDIENTS[bowl.broth].cat === 'sauce' : false;

  function tutorial(): string | null {
    if (levelId > 2 || !started) return null;
    if (phase === 'talk') return '👂 Müşteriyi dinle, sonra “Siparişi al”a bas.';
    if (phase === 'pay') return '💵 Verilen paradan hesabı çıkar, para üstünü çekmeceden seç.';
    if (phase !== 'waiting') return null;
    if (stage === 'ready') return '🛎 Kaseyi tut, sola, müşteriye taşı!';
    if (stage === 'pot') return station === 2 ? '🔥 İbre yeşile gelince Çıkar!' : '➡ Ocağa kaydır.';
    if (station === 0) return '👉 Ekranı sola kaydır: mutfak orada.';
    if (station === 1) {
      if (!bowl.noodle) return '1️⃣ Kalınlığı seç, sepetteki erişteye dokun, sonra kaseye dokun.';
      if (!bowl.broth || bowl.fill < 0.72)
        return '2️⃣ Sağdan suyu ya da sosu seç, kaseye BASILI TUT.';
      if (!bowl.pieces.length) return '3️⃣ Kenardaki kaplardan malzeme seç, kaseye dokun.';
      return '4️⃣ Kasenin altındaki tahtayı tut, sağa, ocağa taşı!';
    }
    return null;
  }

  return (
    <div className={`screen play2 play3 ${closeUp ? 'closeup' : ''} tod-${tod}`}>
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
        <FullscreenButton className="in-hud" />
        <div className="hud-coins">
          <Coin size={18} />
          <b key={coins} className="bump">
            {fmt(coins)}
          </b>
        </div>
      </div>

      {/* TICKET pinned on the kitchen rail */}
      {phase === 'waiting' && station !== 0 && (
        <div className="slip slip3" ref={slipRef}>
          <div className="slip-head">
            {c.phone ? '📱' : '🪑'} {c.name}
            {c.special && <span className="slip-vip">ÖZEL MİSAFİR</span>}
          </div>
          <div className="slip-text">{c.text}</div>
          {hint && <div className="slip-hint">{hint}</div>}
        </div>
      )}

      {/* ONE CONTINUOUS WORLD: salon | prep counter | kamado */}
      <div className="stage-window" ref={stageRef}>
        <div className={`world ${drag ? 'dragging' : ''}`} ref={worldRef} onScroll={onWorldScroll}>
          {/* SALON */}
          <section className="station salon2">
            <div className="salon-cam">
              <Restaurant
                decor={decor}
                rain={rain}
                tod={tod}
                menu={[...noodles.map((n) => INGREDIENTS[n].name), 'Kuru noodle']}
              />
              <div className="salon-cat">
                <CatArt size={64} sleepy={phase === 'waiting'} />
              </div>
              {custs.length - idx - 1 > 0 && (
                <div className="queue-chip">👥 Kapıda {custs.length - idx - 1} müşteri</div>
              )}
              {!c.phone && (
                <div key={c.id} className={`guest ph-${phase}`}>
                  <Avatar look={c.look} mood={mood} size={guestSize} eating={phase === 'eating'} />
                </div>
              )}
              {c.phone && (phase === 'eating' || phase === 'react' || phase === 'leave') && (
                <div className={`guest courier-guest ph-${phase}`}>
                  <Avatar
                    look={{ ...c.look, special: 'ruzgar' }}
                    mood="happy"
                    size={Math.round(guestSize * 0.92)}
                  />
                </div>
              )}
              <div className="counter2">
                <div className="counter2-top" />
                <div className="counter2-front">
                  <span>NODDLES</span>
                </div>
              </div>
              <RegisterDecor
                open={phase === 'pay'}
                display={bill && (phase === 'react' || phase === 'pay') ? fmt(bill.due) : '0.00'}
              />
              <TipJar amount={jar} bump={jarBump} />
              <CounterDeco decor={decor} />
              {stage === 'ready' && phase === 'waiting' && (
                <div
                  className={`serve-zone ${drag?.src === 'ready' ? 'armed' : ''} ${drag?.src === 'ready' && drag.over ? 'over' : ''}`}
                  onClick={serveIt}>
                  <span>{c.phone ? '🛵 Paketi buraya bırak' : '🛎 Kaseyi buraya bırak'}</span>
                </div>
              )}
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

            {(phase === 'talk' || (phase === 'waiting' && station === 0 && stage !== 'ready')) && (
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

          {/* PREP COUNTER: the bowl in the middle, every container around its rim */}
          <section className="station prep3">
            <div className="kitchen-wall" />
            <div
              className={`prep-grid ${wide ? 'wide' : ''}`}
              style={{ paddingTop: Math.max(10, slipPad) }}>
              <div className="pg-top bins-row">
                {toppings.slice(0, half).map((id) => (
                  <BinButton
                    key={id}
                    id={id}
                    kind="topping"
                    bowl={bowl}
                    tool={tool}
                    thick={thick}
                    w={trayW}
                    onPick={(kind) => setTool({ kind, id })}
                  />
                ))}
              </div>
              <div className="pg-left">
                <button
                  className={`kase-btn ${kasePick ? 'on' : ''}`}
                  onClick={() => {
                    setKasePick((v) => !v);
                    sfx('tap');
                  }}>
                  <BowlCanvas bowl={{ fill: 0, pieces: [], style: kase }} size={wide ? 56 : 40} />
                  <span>Kase</span>
                </button>
                <div className="thick3">
                  {(['ince', 'orta', 'kalin'] as Thick[]).map((t) => (
                    <button
                      key={t}
                      className={`thick ${thick === t ? 'on' : ''}`}
                      onClick={() => {
                        setThick(t);
                        sfx('tap');
                      }}>
                      <i style={{ height: THICK_W[t] * 1.3 }} />
                      <span>{THICK_LABEL[t]}</span>
                    </button>
                  ))}
                </div>
                {noodles.map((id) => (
                  <BinButton
                    key={id}
                    id={id}
                    kind="noodle"
                    bowl={bowl}
                    tool={tool}
                    thick={thick}
                    w={trayW + 6}
                    onPick={(kind) => setTool({ kind, id })}
                  />
                ))}
              </div>
              <div className="pg-bowl" ref={boardRef}>
                {stage === 'prep' ? (
                  <>
                    <div
                      className={`bowl-wrap ${tool?.kind === 'broth' ? 'pour' : ''} ${drag?.src === 'prep' && drag.moved ? 'lifted' : ''}`}>
                      <div className="bowl-mat" />
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
                      <button
                        className="tool-btn round"
                        onClick={undo}
                        disabled={!bowl.pieces.length}
                        aria-label="Geri al">
                        ↶
                      </button>
                      <button
                        className={`grip ${bowl.noodle && bowl.fill >= 0.5 ? 'ready' : ''}`}
                        style={{ touchAction: 'none' }}
                        {...grip('prep')}>
                        <i className="grip-board" />
                        <span>✋ Tut, ocağa taşı →</span>
                      </button>
                      <button className="tool-btn round" onClick={trash} aria-label="Boşalt">
                        🗑
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="prep-empty">
                    <div className="bowl-mat empty" />
                    <p>
                      {stage === 'pot' ? 'Kase ocakta pişiyor…' : 'Kase hazır, servis bekliyor.'}
                    </p>
                    <button className="btn ghost" onClick={() => go(2)}>
                      Ocağa kaydır →
                    </button>
                  </div>
                )}
              </div>
              <div className="pg-right">
                <div className="bin-group">Çorba</div>
                {broths.map((id) => (
                  <BinButton
                    key={id}
                    id={id}
                    kind="broth"
                    bowl={bowl}
                    tool={tool}
                    thick={thick}
                    w={trayW}
                    onPick={(kind) => setTool({ kind, id })}
                  />
                ))}
                {sauces.length > 0 && <div className="bin-group">Sos</div>}
                {sauces.map((id) => (
                  <BinButton
                    key={id}
                    id={id}
                    kind="broth"
                    bowl={bowl}
                    tool={tool}
                    thick={thick}
                    w={trayW}
                    onPick={(kind) => setTool({ kind, id })}
                  />
                ))}
              </div>
              <div className="pg-bot bins-row">
                {toppings.slice(half).map((id) => (
                  <BinButton
                    key={id}
                    id={id}
                    kind="topping"
                    bowl={bowl}
                    tool={tool}
                    thick={thick}
                    w={trayW}
                    onPick={(kind) => setTool({ kind, id })}
                  />
                ))}
              </div>
            </div>
            {kasePick && (
              <div className="kase-pop">
                <div className="kase-pop-title">Japon kaseleri</div>
                <div className="kase-pop-grid">
                  {BOWLS.map((bs) => (
                    <button
                      key={bs.id}
                      data-id={bs.id}
                      className={`bin bowlpick ${kase === bs.id ? 'sel in' : ''}`}
                      onClick={() => {
                        setKase(bs.id);
                        setKasePick(false);
                        sfx('pop');
                      }}>
                      <BowlCanvas bowl={{ fill: 0, pieces: [], style: bs.id }} size={64} />
                      <span>{bs.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* KAMADO */}
          <section className={`station stove3 ${wide ? 'wide' : ''}`}>
            <div className="stove-wall">
              <div className="stove-noren">
                <i>火</i>
              </div>
              <div className="stove-shelf">
                <i />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div className="stove-timer" style={wide ? undefined : { top: Math.max(10, slipPad) }}>
              <TimerPlaque
                p={ovenState === 'empty' ? 0 : cookP}
                label={
                  stage === 'pot'
                    ? COOK_LABEL[cookNow]
                    : stage === 'ready'
                      ? COOK_LABEL[bowl.cook ?? 'raw']
                      : 'Ocak hazır'
                }
              />
            </div>
            <div className="kamado-wrap" style={{ width: kamadoW }}>
              <Kamado
                state={ovenState}
                bowl={drawBowl}
                bowlWidth={Math.round(kamadoW * 0.27)}
                hot={drag?.src === 'prep' && drag.over}
              />
              {stage === 'ready' && (
                <div
                  className={`out-bowl grip-bowl ${drag?.src === 'ready' && drag.moved ? 'lifted' : ''}`}
                  style={{ touchAction: 'none' }}
                  {...grip('ready')}>
                  <div className={`cook-badge cb-${bowl.cook}`}>
                    {COOK_LABEL[bowl.cook ?? 'raw']}
                  </div>
                  <BowlSide bowl={drawBowl} width={Math.round(kamadoW * 0.36)} />
                  <span className="grip-hint">✋ Tut, ← müşteriye taşı</span>
                </div>
              )}
            </div>
            {stage === 'pot' && (
              <div className="cook-panel">
                <button className="btn big primary" onClick={takeOut}>
                  Çıkar!
                </button>
              </div>
            )}
            {stage === 'ready' && (
              <div className="cook-panel">
                <button className="btn primary" onClick={serveIt}>
                  {c.phone ? 'Paketle, Rüzgar’a ver 🛵' : 'Servis et 🛎'}
                </button>
              </div>
            )}
            {stage === 'prep' && (
              <div className="cook-panel idle">
                <p>
                  {phase === 'waiting'
                    ? 'Kaseyi tezgahta hazırla, tut ve buraya taşı.'
                    : 'Ocak tıkır tıkır yanıyor.'}
                </p>
              </div>
            )}
          </section>
        </div>
        <div className="vignette" />
      </div>

      {hint && !(station !== 0 && phase === 'waiting') && <div className="hint2">{hint}</div>}
      {nudge && <div className="nudge2">{nudge}</div>}
      {drag && drag.moved && (
        <div
          className={`drag-ghost ${drag.over ? 'over' : ''}`}
          style={{ left: drag.x, top: drag.y }}>
          {drag.src === 'prep' ? (
            <BowlCanvas bowl={drawBowl} size={Math.min(190, bowlSize * 0.7)} />
          ) : (
            <BowlSide bowl={drawBowl} width={170} steam={false} />
          )}
        </div>
      )}

      {/* slim position indicator instead of pages */}
      <div
        className={`pager ${phase === 'talk' || phase === 'react' || phase === 'pay' ? 'hide' : ''}`}>
        {STATIONS.map((s, i) => (
          <button key={s} className={station === i ? 'on' : ''} onClick={() => go(i)}>
            <i />
            <span>{s}</span>
            {i === 0 && phase === 'talk' && station !== 0 && <em className="pulse-badge">!</em>}
            {i === 2 && stage === 'pot' && station !== 2 && (
              <em className={cookP > 58 ? 'pulse-badge' : ''}>{Math.round(cookP)}</em>
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
          rain={rain}
          tod={tod}
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
  kind,
  bowl,
  tool,
  thick,
  w,
  onPick,
}: {
  id: string;
  kind: Kind;
  bowl: Bowl;
  tool: Tool;
  thick: Thick;
  w: number;
  onPick: (kind: Kind) => void;
}) {
  const count = bowl.pieces.filter((p) => p.id === id).length;
  const inBowl =
    kind === 'noodle' ? bowl.noodle === id : kind === 'broth' ? bowl.broth === id : count > 0;
  return (
    <button
      data-id={id}
      className={`bin bin3 k-${kind} ${tool?.id === id ? 'sel' : ''} ${inBowl ? 'in' : ''}`}
      style={{ '--tw': `${w}px` } as React.CSSProperties}
      onClick={() => {
        onPick(kind);
        sfx('tap');
      }}>
      <Tray id={id} thick={thick} width={w} />
      <span>{INGREDIENTS[id].name}</span>
      {kind === 'topping' && count > 0 && <em>{count}</em>}
    </button>
  );
}
