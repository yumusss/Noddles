import type { BowlDraw } from '../food';
import { BowlSide } from './FoodCanvas';

// A traditional Japanese kamado: white plaster body, black tile top, two arched
// fire mouths with crackling wood fire, an iron trivet where the bowl sits under a
// wooden lid, and a washi timer plaque with soft doneness zones.

const ZONES: [number, number, string][] = [
  [0, 42, '#b9cbd9'],
  [42, 58, '#f2d58b'],
  [58, 80, '#9fcf9f'],
  [80, 100, '#f2b98b'],
  [100, 130, '#e48f80'],
];

function polar(cx: number, cy: number, r: number, t: number) {
  const a = Math.PI + (t / 130) * Math.PI;
  return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
}

export function TimerPlaque({ p, label }: { p: number; label: string }) {
  const cx = 100;
  const cy = 92;
  const arc = (a: number, b: number, r: number) => {
    const [x1, y1] = polar(cx, cy, r, a);
    const [x2, y2] = polar(cx, cy, r, b);
    return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`;
  };
  const [nx, ny] = polar(cx, cy, 58, Math.min(130, p));
  return (
    <svg viewBox="0 0 200 128" className="timer-plaque">
      <line x1="60" y1="0" x2="70" y2="18" stroke="#6b4a36" strokeWidth="2" />
      <line x1="140" y1="0" x2="130" y2="18" stroke="#6b4a36" strokeWidth="2" />
      <rect x="8" y="16" width="184" height="108" rx="14" fill="#a77b52" />
      <rect x="14" y="22" width="172" height="96" rx="10" fill="#f6efe2" />
      {ZONES.map(([a, b, col]) => (
        <path
          key={a}
          d={arc(a, b, 66)}
          stroke={col}
          strokeWidth="14"
          fill="none"
          strokeLinecap="butt"
        />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const [x1, y1] = polar(cx, cy, 74, i * 10);
        const [x2, y2] = polar(cx, cy, 78, i * 10);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c8a77d" strokeWidth="1.6" />;
      })}
      <line
        x1={cx}
        y1={cy}
        x2={nx}
        y2={ny}
        stroke="#c96a5a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx={cx} cy={cy} r="7" fill="#6b4a36" />
      <text
        x={cx}
        y="114"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fill="#6b4a36"
        fontFamily="Nunito, sans-serif">
        {label}
      </text>
    </svg>
  );
}

function Fire({ on }: { on: boolean }) {
  return (
    <g className={`k-fire ${on ? 'on' : ''}`}>
      <rect x="-60" y="-10" width="120" height="70" fill="url(#k-glow)" />
      {/* logs */}
      <rect x="-46" y="40" width="92" height="12" rx="6" fill="#5a3a22" transform="rotate(-8)" />
      <rect x="-44" y="42" width="88" height="12" rx="6" fill="#6b4a36" transform="rotate(10)" />
      <circle cx="-30" cy="46" r="4" fill="#ffb36b" className="ember" />
      <circle cx="18" cy="48" r="3" fill="#ffd27a" className="ember e2" />
      {/* flames */}
      {[-26, -8, 10, 26].map((x, i) => (
        <path
          key={x}
          className="k-flame"
          style={{ animationDelay: `${i * 0.13}s` }}
          d={`M${x - 12} 46 Q${x - 14} 20 ${x} ${-6 - (i % 2) * 10} Q${x + 14} 20 ${x + 12} 46z`}
          fill={i % 2 ? '#ffb347' : '#ff8a3c'}
        />
      ))}
      {[-16, 4, 20].map((x, i) => (
        <path
          key={'c' + x}
          className="k-flame"
          style={{ animationDelay: `${0.2 + i * 0.1}s` }}
          d={`M${x - 6} 46 Q${x - 8} 30 ${x} 14 Q${x + 8} 30 ${x + 6} 46z`}
          fill="#ffe7a0"
        />
      ))}
    </g>
  );
}

export default function Kamado({
  state,
  bowl,
  bowlWidth,
  hot,
}: {
  state: 'empty' | 'cooking' | 'opening' | 'ready';
  bowl: BowlDraw;
  bowlWidth: number;
  hot?: boolean;
}) {
  const on = state === 'cooking' || state === 'opening';
  return (
    <div className={`kamado st-${state} ${hot ? 'hot' : ''}`}>
      <svg viewBox="0 0 600 420" className="kamado-svg">
        <defs>
          <linearGradient id="k-plaster" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fbf7ef" />
            <stop offset="1" stopColor="#e9dfcf" />
          </linearGradient>
          <linearGradient id="k-tile" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#4a4a50" />
            <stop offset="1" stopColor="#2b2b30" />
          </linearGradient>
          <radialGradient id="k-glow" cx=".5" cy=".75" r=".7">
            <stop offset="0" stopColor="#ffcf86" stopOpacity=".95" />
            <stop offset=".5" stopColor="#ff8a3c" stopOpacity=".6" />
            <stop offset="1" stopColor="#7a2a10" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="k-mouth" cx=".5" cy=".8" r=".8">
            <stop offset="0" stopColor="#3a1a0c" />
            <stop offset="1" stopColor="#120806" />
          </radialGradient>
        </defs>
        <ellipse cx="300" cy="414" rx="270" ry="10" fill="#3a2414" opacity=".2" />
        {/* body */}
        <path
          d="M40 120 Q40 96 64 96 H536 Q560 96 560 120 V392 Q560 408 544 408 H56 Q40 408 40 392z"
          fill="url(#k-plaster)"
        />
        <path
          d="M40 300 H560 V392 Q560 408 544 408 H56 Q40 408 40 392z"
          fill="#d9cdb8"
          opacity=".55"
        />
        {/* tile top */}
        <path d="M28 104 Q28 82 52 82 H548 Q572 82 572 104 V118 H28z" fill="url(#k-tile)" />
        {Array.from({ length: 13 }, (_, i) => (
          <rect key={i} x={36 + i * 41} y="86" width="38" height="28" rx="3" fill="#3f3f45" />
        ))}
        {/* burner holes with iron rings */}
        <ellipse cx="190" cy="92" rx="96" ry="14" fill="#1a1a1e" />
        <ellipse cx="190" cy="90" rx="88" ry="11" fill={on ? '#5a2a14' : '#26262b'} />
        <ellipse cx="430" cy="92" rx="80" ry="12" fill="#1a1a1e" />
        {/* arched fire mouths */}
        {[190, 430].map((x, i) => (
          <g key={x} transform={`translate(${x} 250)`}>
            <path d="M-80 70 V0 Q-80 -70 0 -70 Q80 -70 80 0 V70z" fill="#6b4a36" />
            <path d="M-66 70 V2 Q-66 -56 0 -56 Q66 -56 66 2 V70z" fill="url(#k-mouth)" />
            <g transform="translate(0 6)">
              <Fire on={i === 0 ? on : true} />
            </g>
          </g>
        ))}
        {/* right burner: a clay pot of simmering stock, purely atmospheric */}
        <g>
          <path d="M370 86 Q366 40 430 36 Q494 40 490 86z" fill="#8a5e3e" />
          <ellipse cx="430" cy="40" rx="58" ry="10" fill="#6b4a36" />
          <ellipse cx="430" cy="22" rx="14" ry="6" fill="#4f3420" />
          <path d="M376 70 Q430 80 484 70" stroke="#b98d63" strokeWidth="3" fill="none" />
        </g>
        {/* little stool and a fan for character */}
        <path d="M546 300 q20 -30 44 -14 q-10 24 -44 14z" fill="#d9a385" />
        <path d="M548 300 l-10 22" stroke="#6b4a36" strokeWidth="3" />
      </svg>

      {/* the bowl sits on the left burner */}
      {(state === 'cooking' || state === 'opening') && (
        <div className={`k-bowl ${state === 'opening' ? 'lift' : ''}`}>
          <BowlSide bowl={bowl} width={bowlWidth} steam />
        </div>
      )}
      {state === 'empty' && (
        <div className="k-drop-hint">
          <span>Kaseyi buraya getir</span>
        </div>
      )}
      {on && (
        <div className="k-steam">
          <i />
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}
