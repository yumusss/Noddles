import { useId } from 'react';
import { INGREDIENTS } from './data';
import { IngredientShape, shade } from './art';

export interface Piece {
  id: string;
  x: number;
  y: number;
  r: number;
  s: number;
  k: number; // stable seed
}

export type CookState = 'raw' | 'dente' | 'perfect' | 'soft' | 'burnt';

export const BOWL_R = 122; // usable radius inside the 300x300 viewBox
const C = 150;

function nestPath(radius: number, phase: number, waves: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r = radius + Math.sin(a * waves + phase) * 5;
    pts.push(`${(C + Math.cos(a) * r).toFixed(1)},${(C + Math.sin(a) * r).toFixed(1)}`);
  }
  return 'M' + pts.join(' L') + 'Z';
}

function PieceArt({ p }: { p: Piece }) {
  if (p.id === 'yesil') {
    return (
      <g transform={`translate(${p.x} ${p.y}) rotate(${p.r})`}>
        {[
          [-7, -3],
          [6, -5],
          [0, 7],
        ].map(([dx, dy], i) => (
          <g key={i} transform={`translate(${dx} ${dy})`}>
            <circle r="5.4" fill="#b7e3a1" stroke="#3f9a3f" strokeWidth="2.4" />
            <circle r="1.8" fill="#e7f7dc" />
          </g>
        ))}
      </g>
    );
  }
  if (p.id === 'susam') {
    return (
      <g transform={`translate(${p.x} ${p.y}) rotate(${p.r})`}>
        {[
          [-8, -2],
          [-2, -8],
          [6, -4],
          [9, 4],
          [1, 3],
          [-6, 8],
          [4, 10],
        ].map(([dx, dy], i) => (
          <ellipse
            key={i}
            cx={dx}
            cy={dy}
            rx="2.6"
            ry="1.3"
            transform={`rotate(${i * 40} ${dx} ${dy})`}
            fill={i === 3 ? '#2b2420' : '#f8edd2'}
            stroke="#c8b48a"
            strokeWidth=".5"
          />
        ))}
      </g>
    );
  }
  if (p.id === 'aciyag') {
    return (
      <g transform={`translate(${p.x} ${p.y}) rotate(${p.r})`} opacity=".88">
        <ellipse rx="16" ry="10" fill="#d62e17" />
        <ellipse cx="-4" cy="-3" rx="5" ry="2.4" fill="#ff8a6b" opacity=".7" />
        <circle cx="5" cy="3" r="1.8" fill="#6e0f06" />
        <circle cx="-6" cy="4" r="1.4" fill="#6e0f06" />
      </g>
    );
  }
  return (
    <g transform={`translate(${p.x} ${p.y}) rotate(${p.r}) scale(${p.s}) translate(-32 -32)`}>
      <IngredientShape id={p.id} />
    </g>
  );
}

export function TopBowl({
  noodle,
  broth,
  fill,
  pieces,
  cook,
  size = 300,
  takeaway = false,
  svgRef,
  onDown,
  onMove,
  onUp,
}: {
  noodle?: string;
  broth?: string;
  fill: number;
  pieces: Piece[];
  cook?: CookState;
  size?: number;
  takeaway?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
  onDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
}) {
  const uid = useId().replace(/:/g, '');
  const br = broth ? INGREDIENTS[broth] : null;
  const nd = noodle ? INGREDIENTS[noodle] : null;
  const f = Math.min(1, fill);
  const brothR = 54 + 74 * f;
  let ncol = nd?.color ?? '#fff';
  if (cook === 'raw') ncol = shade(ncol, 0.25);
  if (cook === 'soft') ncol = shade(ncol, -0.12);
  if (cook === 'burnt') ncol = shade(ncol, -0.4);
  const thick = noodle === 'udon' ? 9 : noodle === 'pirinc' ? 3.4 : noodle === 'soba' ? 4.6 : 5.4;
  const rimA = takeaway ? '#f4efe6' : '#f7f1e8';
  const rimB = takeaway ? '#d9cdb8' : '#e94f37';
  return (
    <svg
      ref={svgRef}
      viewBox="0 0 300 300"
      width={size}
      height={size}
      className="topbowl"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
      style={{ touchAction: 'none' }}>
      <defs>
        <radialGradient id={`in${uid}`} cx="0.42" cy="0.38" r="0.7">
          <stop offset="0" stopColor="#fffaf2" />
          <stop offset="1" stopColor="#e6dccb" />
        </radialGradient>
        <radialGradient id={`br${uid}`} cx="0.4" cy="0.36" r="0.75">
          <stop offset="0" stopColor={br ? shade(br.color, 0.3) : '#fff'} />
          <stop offset="0.7" stopColor={br ? br.color : '#fff'} />
          <stop offset="1" stopColor={br ? shade(br.color, -0.25) : '#fff'} />
        </radialGradient>
        <clipPath id={`cl${uid}`}>
          <circle cx={C} cy={C} r={BOWL_R + 4} />
        </clipPath>
      </defs>
      {fill > 1.02 && (
        <ellipse
          cx={C + 6}
          cy={C + 10}
          rx={150 + (fill - 1) * 60}
          ry={145 + (fill - 1) * 50}
          fill={br?.color ?? '#9a4f22'}
          opacity=".35"
        />
      )}
      <circle cx={C + 4} cy={C + 8} r="146" fill="#000" opacity=".28" />
      <circle cx={C} cy={C} r="146" fill={rimB} />
      {!takeaway && (
        <circle
          cx={C}
          cy={C}
          r="140"
          fill="none"
          stroke="#fff"
          strokeOpacity=".7"
          strokeWidth="3"
          strokeDasharray="10 8"
        />
      )}
      <circle cx={C} cy={C} r="134" fill={rimA} />
      <circle cx={C} cy={C} r={BOWL_R + 6} fill={`url(#in${uid})`} />
      <g clipPath={`url(#cl${uid})`}>
        {br && f > 0 && (
          <circle cx={C} cy={C} r={brothR} fill={`url(#br${uid})`} className="broth-fill" />
        )}
        {nd &&
          [0, 1, 2, 3, 4, 5].map((k) => (
            <g key={k}>
              <path
                d={nestPath(30 + k * 14, k * 1.7, 7 + (k % 3) * 2)}
                stroke={shade(ncol, -0.32)}
                strokeWidth={thick + 2}
                fill="none"
              />
              <path
                d={nestPath(30 + k * 14, k * 1.7, 7 + (k % 3) * 2)}
                stroke={ncol}
                strokeWidth={thick}
                fill="none"
              />
            </g>
          ))}
        {br && f > 0.3 && nd && (
          <circle cx={C} cy={C} r={brothR} fill={br.color} opacity={0.18 + f * 0.12} />
        )}
        {br && f > 0 && (
          <g opacity=".6">
            <ellipse cx="108" cy="112" rx="7" ry="3" fill="#fff" opacity=".5" />
            <ellipse cx="190" cy="176" rx="5" ry="2" fill="#ffe2a8" opacity=".7" />
            <ellipse cx="172" cy="104" rx="4" ry="2" fill="#ffe2a8" opacity=".7" />
          </g>
        )}
      </g>
      {pieces.map((p) => (
        <g key={p.k} className="piece-drop">
          <PieceArt p={p} />
        </g>
      ))}
      {cook && cook !== 'raw' && br && (
        <g
          className="steam"
          stroke="#fff"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          opacity=".45">
          <path d="M110 120 q-12 -20 0 -40 q12 -20 0 -40" />
          <path d="M150 110 q-12 -20 0 -40 q12 -20 0 -40" />
          <path d="M190 120 q-12 -20 0 -40 q12 -20 0 -40" />
        </g>
      )}
    </svg>
  );
}

// ---------- Stove: a big clay pot (donabe) over a fire ----------

export function Donabe({ active, lidOff, hot }: { active: boolean; lidOff: boolean; hot: number }) {
  return (
    <svg viewBox="0 0 320 300" width="100%" className="donabe" aria-hidden="true">
      <defs>
        <radialGradient id="dnb-fire" cx="0.5" cy="1" r="0.9">
          <stop offset="0" stopColor="#fff1a8" />
          <stop offset="0.4" stopColor="#ff9f1c" />
          <stop offset="1" stopColor="#e94f37" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="dnb-body" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#6b3a24" />
          <stop offset="1" stopColor="#3a1d10" />
        </linearGradient>
        <linearGradient id="dnb-lid" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f0e3cc" />
          <stop offset="1" stopColor="#c9b38e" />
        </linearGradient>
      </defs>
      {/* stove frame */}
      <rect x="40" y="236" width="240" height="56" rx="10" fill="#2a2f3a" />
      <rect x="54" y="246" width="212" height="10" rx="5" fill="#141820" />
      {/* fire */}
      <g
        className={active ? 'flames on' : 'flames'}
        style={{ opacity: active ? 0.6 + hot * 0.4 : 0.12 }}>
        <ellipse cx="160" cy="236" rx="110" ry="40" fill="url(#dnb-fire)" />
        {[100, 130, 160, 190, 220].map((x, i) => (
          <path
            key={x}
            d={`M${x - 12} 240 Q${x} ${196 - (i % 2) * 14} ${x + 12} 240z`}
            fill={i % 2 ? '#ffb703' : '#ff7a1c'}
            className="flame"
            style={{ animationDelay: `${i * 0.11}s` }}
          />
        ))}
      </g>
      {/* pot */}
      <ellipse cx="160" cy="232" rx="104" ry="14" fill="#000" opacity=".35" />
      <path d="M44 132 Q40 226 160 230 Q280 226 276 132 Z" fill="url(#dnb-body)" />
      <path
        d="M60 150 Q64 204 120 216"
        stroke="#fff"
        strokeOpacity=".12"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M54 170 q26 -12 52 0 t52 0 t52 0 t52 0"
        stroke="#e9c79a"
        strokeOpacity=".55"
        strokeWidth="4"
        fill="none"
      />
      <rect x="22" y="138" width="30" height="16" rx="8" fill="#3a1d10" />
      <rect x="268" y="138" width="30" height="16" rx="8" fill="#3a1d10" />
      <ellipse cx="160" cy="132" rx="118" ry="24" fill="#2a140a" />
      {active && <ellipse cx="160" cy="134" rx="104" ry="18" fill="#d39a4c" className="simmer" />}
      {/* lid */}
      <g className={`lid ${lidOff ? 'off' : ''} ${active && !lidOff ? 'rattle' : ''}`}>
        <path
          d="M44 128 Q48 74 160 70 Q272 74 276 128 Q160 146 44 128z"
          fill="url(#dnb-lid)"
          stroke="#a88d63"
          strokeWidth="3"
        />
        <path
          d="M70 116 Q90 90 150 84"
          stroke="#fff"
          strokeOpacity=".5"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="160" cy="68" rx="22" ry="10" fill="#8a5530" />
        <rect x="150" y="54" width="20" height="16" rx="6" fill="#8a5530" />
        <circle cx="210" cy="96" r="5" fill="#a88d63" />
      </g>
      {active && (
        <g
          className="steam big"
          stroke="#fff"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          opacity=".5">
          <path d="M120 70 q-14 -22 0 -44 q14 -22 0 -44" />
          <path d="M160 56 q-14 -22 0 -44 q14 -22 0 -44" />
          <path d="M200 70 q-14 -22 0 -44 q14 -22 0 -44" />
        </g>
      )}
    </svg>
  );
}
