import type { BowlDraw } from '../food';
import { BowlSide } from './FoodCanvas';

// A Good-Pizza style noodle oven: stainless body, glowing glass door, flames, steam
// and an analog timer dial with colored doneness zones.

const ZONES: [number, number, string, string][] = [
  [0, 42, '#9fb7d6', 'Çiğ'],
  [42, 58, '#ffe066', 'Diri'],
  [58, 80, '#38f0b8', 'Tam'],
  [80, 100, '#ffb347', 'Yumuşak'],
  [100, 130, '#ff6b6b', 'Lapa'],
];

function polar(cx: number, cy: number, r: number, t: number) {
  const a = Math.PI + (t / 130) * Math.PI; // left (0) to right (130)
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
}

function Dial({ p }: { p: number }) {
  const cx = 100;
  const cy = 96;
  const arc = (a: number, b: number, r: number) => {
    const [x1, y1] = polar(cx, cy, r, a);
    const [x2, y2] = polar(cx, cy, r, b);
    return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const [nx, ny] = polar(cx, cy, 64, Math.min(130, p));
  return (
    <svg viewBox="0 0 200 110" className="oven-dial">
      <defs>
        <radialGradient id="dial-face" cx=".5" cy=".9" r=".9">
          <stop offset="0" stopColor="#fffdf6" />
          <stop offset="1" stopColor="#d9d2c2" />
        </radialGradient>
      </defs>
      <path d="M8 100 A92 92 0 0 1 192 100 Z" fill="#2b2f36" />
      <path d="M16 98 A84 84 0 0 1 184 98 Z" fill="url(#dial-face)" />
      {ZONES.map(([a, b, col]) => (
        <path key={a} d={arc(a, b, 70)} stroke={col} strokeWidth="16" fill="none" />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const [x1, y1] = polar(cx, cy, 80, i * 10);
        const [x2, y2] = polar(cx, cy, 86, i * 10);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2b2f36" strokeWidth="2" />;
      })}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#c0392b"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="9" fill="#2b2f36" />
      <circle cx={cx} cy={cy} r="4" fill="#c9ced6" />
    </svg>
  );
}

export default function Oven({
  state,
  bowl,
  progress,
  dropHot,
  bowlWidth = 210,
}: {
  state: 'empty' | 'cooking' | 'opening' | 'ready';
  bowl: BowlDraw;
  progress: number;
  dropHot?: boolean;
  bowlWidth?: number;
}) {
  const on = state === 'cooking' || state === 'opening';
  const heat = Math.min(1, progress / 100);
  return (
    <div className={`oven st-${state} ${dropHot ? 'hot' : ''}`}>
      <div className="oven-hood">
        <span>NODDLES</span>
        <small>麺 FIRINI</small>
      </div>
      <div className="oven-body">
        <div className="oven-top">
          <div className="oven-knob" />
          <Dial p={state === 'empty' ? 0 : progress} />
          <div className="oven-knob r" />
        </div>
        <div className="oven-door">
          <div className="oven-window">
            <div className="oven-glow" style={{ opacity: on ? 0.6 + heat * 0.4 : 0.15 }} />
            <div className="oven-rack" />
            {(state === 'cooking' || state === 'opening') && (
              <div className={`oven-bowl ${state === 'opening' ? 'out' : ''}`}>
                <BowlSide bowl={bowl} width={bowlWidth} steam />
              </div>
            )}
            <div className={`oven-flames ${on ? 'on' : ''}`}>
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} style={{ animationDelay: `${i * 0.09}s` }} />
              ))}
            </div>
            {on && (
              <div className="oven-steam">
                <i />
                <i />
                <i />
              </div>
            )}
            <div className="oven-glass" />
            {state === 'empty' && <div className="oven-empty">Kaseyi buraya getir</div>}
          </div>
          <div className="oven-handle" />
        </div>
        <div className="oven-vents">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
      </div>
      <div className="oven-feet">
        <i />
        <i />
      </div>
    </div>
  );
}
