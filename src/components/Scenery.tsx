import type React from 'react';
import { useMemo, type SVGProps } from 'react';
import { Avatar } from '../avatar';
import { CatArt, randomLook, type Look } from '../art';
import { tableCount, type Decor } from '../decor';
import type { DayTime, Weather } from '../data';

/* =====================================================================
   v3 — one line language (ART_DIRECTION.md). Every shape: thin ink
   outline (#2b2420, constant on screen via non-scaling-stroke), flat
   fill + one shadow tone + one highlight. No gradients, no blur,
   no SVG filters. Steam = outlined Ghibli clouds.
   ===================================================================== */

const INK = '#2b2420';
const HI = '#fff6e8';
const ink = {
  stroke: INK,
  strokeOpacity: 0.82,
  strokeWidth: 1.3,
  vectorEffect: 'non-scaling-stroke',
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const satisfies SVGProps<SVGElement>;
/** faint interior detail line */
const line = { ...ink, strokeOpacity: 0.28, fill: 'none' } as const;

const C = {
  cream: '#f6efe4',
  creamD: '#dccfbb',
  linen: '#ece2d2',
  sand: '#d9c4a3',
  oak: '#c4935b',
  oakL: '#d8ad78',
  oakD: '#a1764a',
  walnut: '#7b4f2e',
  walnutD: '#5f3c22',
  clay: '#c8553d',
  clayD: '#a3432f',
  clayL: '#d9775f',
  persimmon: '#e8803c',
  matcha: '#7c9a6e',
  matchaD: '#627e56',
  matchaL: '#9bb48a',
  indigo: '#3b4a6b',
  indigoD: '#2f3b56',
  gold: '#d9a441',
  goldD: '#b5862f',
  blush: '#e9b8b2',
  steel: '#c9ced6',
  steelD: '#9aa1aa',
};

/** Outlined steam cloud, centered on (0,0), ~44 wide. */
function Cloud({
  x,
  y,
  s = 1,
  className,
}: {
  x: number;
  y: number;
  s?: number;
  className?: string;
}) {
  return (
    <g className={className} transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M-20 6 C-28 6 -28 -6 -18 -6 C-18 -16 -4 -18 0 -10 C4 -18 18 -16 16 -6 C26 -6 26 6 18 6 Z"
        fill={HI}
        fillOpacity=".92"
        {...ink}
        strokeOpacity=".5"
      />
    </g>
  );
}

export function Rain({ count = 30 }: { count?: number }) {
  return (
    <div className="rain" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 53) % 100}%`,
            animationDelay: `${((i * 0.37) % 1.4).toFixed(2)}s`,
            animationDuration: `${(0.7 + ((i * 13) % 7) / 10).toFixed(2)}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- a single hanging lantern (title + lamps) ---------- */
function RedLanternSvg({ kanji, cord = 40 }: { kanji?: string; cord?: number }) {
  return (
    <svg viewBox={`0 ${40 - cord} 40 ${cord + 60}`} preserveAspectRatio="xMidYMax meet">
      <ellipse cx="20" cy="68" rx="30" ry="34" className="halo" />
      <path d={`M20 ${40 - cord - 600} V40`} {...ink} />
      <rect x="13" y="39" width="14" height="5" rx="1.5" fill={C.walnut} {...ink} />
      <ellipse cx="20" cy="66" rx="16" ry="22" fill={C.clay} {...ink} />
      <path d="M28 48 q10 18 0 36 q6 -18 0 -36z" fill={C.clayD} />
      <path d="M10 52 q-4 14 0 28 M30 52 q4 14 0 28 M20 44 v44" {...line} />
      <ellipse cx="13" cy="54" rx="2.4" ry="4.5" fill={HI} opacity=".55" />
      {kanji && (
        <text x="20" y="71" textAnchor="middle" fontSize="12" fontWeight="700" fill={HI}>
          {kanji}
        </text>
      )}
      <rect x="13" y="87" width="14" height="5" rx="1.5" fill={C.walnut} {...ink} />
      <path d="M20 92 v6" stroke={C.gold} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Lanterns({ count = 4 }: { count?: number }) {
  return (
    <div className="lanterns" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="lantern lantern-svg" style={{ animationDelay: `${i * 0.6}s` }}>
          <RedLanternSvg kanji={['麺', '福', '味', '灯', '湯'][i % 5]} cord={30 + (i % 2) * 14} />
        </div>
      ))}
    </div>
  );
}

/* Legacy backdrop still used by the story screen. */
export function ShopWall({
  rain = false,
  menu = 'ramen • udon • soba',
  cat,
}: {
  rain?: boolean;
  menu?: string;
  cat?: React.ReactNode;
}) {
  return (
    <div className="shop-wall" aria-hidden="true">
      <div className="window">
        <div className="window-city" />
        {rain && <Rain count={18} />}
        <div className="window-frame" />
      </div>
      <div className="menu-board">
        <div>MENÜ</div>
        <small>{menu}</small>
        {cat && <div className="board-cat">{cat}</div>}
      </div>
      <div className="shelf">
        <Ceramics />
      </div>
      <Lanterns count={3} />
    </div>
  );
}

/* =====================================================================
   RESTAURANT — the salon behind the counter
   ===================================================================== */

const GUEST_SEEDS = [4821, 90133, 27719, 61207];

/* ---------- the street outside the window ---------- */

function StreetScene() {
  return (
    <svg viewBox="0 0 120 160" preserveAspectRatio="xMidYMax slice" className="rw-scene">
      <rect width="120" height="160" className="rw-sky" />
      <rect y="70" width="120" height="70" className="rw-sky2" />
      <g className="rw-clouds">
        <Cloud x={30} y={30} s={0.9} />
        <Cloud x={92} y={48} s={0.7} />
      </g>
      {/* far hills */}
      <path d="M-4 96 q22 -16 44 -4 q20 -14 44 -2 q16 -8 40 -2 V140 H-4z" fill="#cfd5c7" {...ink} />
      {/* shop fronts */}
      <g>
        <rect x="-4" y="84" width="46" height="52" fill="#ead2c3" {...ink} />
        <rect x="42" y="74" width="40" height="62" fill={C.cream} {...ink} />
        <rect x="82" y="88" width="46" height="48" fill="#d6dccc" {...ink} />
        {/* windows */}
        <rect x="4" y="94" width="10" height="12" rx="1" className="rw-win" {...ink} />
        <rect x="24" y="94" width="10" height="12" rx="1" className="rw-win" {...ink} />
        <rect x="48" y="82" width="28" height="16" rx="1.5" className="rw-win" {...ink} />
        <path d="M48 90 h28 M62 82 v16" {...line} strokeOpacity=".45" />
        <rect x="90" y="96" width="10" height="12" rx="1" className="rw-win" {...ink} />
        <rect x="108" y="96" width="10" height="12" rx="1" className="rw-win" {...ink} />
        {/* awnings */}
        <path
          d="M-4 110 h46 v5 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0z"
          fill={C.clay}
          {...ink}
        />
        <path d="M-4 110 h46 l0 -4 h-46z" fill={C.clayD} {...ink} />
        <rect x="44" y="104" width="36" height="6" rx="1" fill={C.walnut} {...ink} />
        <path
          d="M82 112 h46 v5 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0z"
          fill={C.matcha}
          {...ink}
        />
        {/* doors / lower windows */}
        <rect x="8" y="118" width="9" height="18" fill={C.walnut} {...ink} />
        <rect x="24" y="118" width="12" height="12" className="rw-win" {...ink} />
        <rect x="50" y="114" width="24" height="22" rx="1" className="rw-win" {...ink} />
        <path d="M62 114 v22" {...line} strokeOpacity=".45" />
        <rect x="92" y="120" width="22" height="16" className="rw-win" {...ink} />
      </g>
      {/* street */}
      <rect x="-4" y="136" width="128" height="30" fill="#bfb3a3" {...ink} />
      <rect x="-4" y="136" width="128" height="4" fill={C.linen} {...ink} />
      <path d="M8 150 h10 M26 150 h10 M44 150 h10 M62 150 h10 M80 150 h10 M98 150 h10" {...line} />
      {/* lamp post */}
      <path d="M22 136 V96" {...ink} strokeWidth="2.2" />
      <path d="M22 96 q0 -6 6 -6" {...ink} fill="none" />
      <circle cx="29" cy="90" r="3.2" className="rw-win" {...ink} />
      {/* tree */}
      <path
        d="M100 136 q2 -14 0 -26"
        {...ink}
        strokeWidth="3"
        stroke={C.walnut}
        strokeOpacity="1"
      />
      <path d="M100 136 q2 -14 0 -26" {...ink} fill="none" />
      <path
        d="M82 112 c-6 -8 2 -16 10 -14 c0 -10 16 -12 20 -2 c10 -4 16 8 8 14 c6 8 -6 14 -12 8 c-6 8 -18 6 -18 -2 c-8 2 -14 -2 -8 -4z"
        fill={C.matcha}
        {...ink}
      />
      <path d="M96 100 c6 -4 14 -2 16 6" fill="none" stroke={C.matchaL} strokeWidth="2.6" />
      {/* dusk / night dimming of the street */}
      <rect width="120" height="160" fill={C.indigoD} className="rw-dim" />
    </svg>
  );
}

/* ---------- wall art ---------- */

export function BigArt({ kind }: { kind: string }) {
  if (kind === 'bigart_fuji')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <rect width="200" height="150" fill="#fbeee0" />
        <circle cx="146" cy="46" r="20" fill={C.clay} {...ink} />
        <path d="M-10 136 L72 46 Q100 32 128 46 L210 136Z" fill="#4a5a80" {...ink} />
        <path d="M100 38 Q114 36 128 46 L210 136 L104 136Z" fill={C.indigo} />
        <path
          d="M72 46 Q100 32 128 46 L122 60 L112 54 L100 64 L89 56 L78 62Z"
          fill="#fbf7f0"
          {...ink}
        />
        <Cloud x={46} y={74} s={0.9} />
        <Cloud x={158} y={92} s={0.7} />
        <path d="M-10 150 Q50 118 120 128 T210 150Z" fill={C.matchaL} {...ink} />
        <path d="M-10 150 Q30 136 70 142 T210 150Z" fill={C.matcha} {...ink} />
        <path
          d="M34 142 l5 -14 l5 14z M48 144 l4 -10 l4 10z M160 140 l6 -16 l6 16z"
          fill={C.matchaD}
          {...ink}
        />
        <rect x="0.5" y="0.5" width="199" height="149" fill="none" {...ink} />
      </svg>
    );
  if (kind === 'bigart_wave')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <rect width="200" height="150" fill={C.linen} />
        <circle cx="152" cy="42" r="14" fill={C.persimmon} {...ink} />
        <path d="M60 110 L110 82 L170 110Z" fill="#c9c2b3" {...ink} />
        <path d="M0 150 C36 136 82 128 200 150Z" fill="#5b6b8f" {...ink} />
        <path
          d="M-4 150 V92 C26 60 66 40 116 50 C148 56 170 36 182 20 C170 46 154 60 150 72 C136 68 126 82 118 94 C102 72 72 80 62 102 C42 96 22 122 -4 150Z"
          fill={C.indigo}
          {...ink}
        />
        <path d="M0 150 V110 C24 92 50 86 74 100 C56 102 34 116 24 150Z" fill={C.indigoD} />
        {[
          [182, 22, 5],
          [170, 36, 6],
          [158, 54, 7],
          [150, 72, 6],
          [134, 72, 5],
          [122, 88, 6],
          [112, 96, 4],
          [96, 78, 5],
          [84, 84, 4],
          [66, 98, 5],
          [52, 110, 4],
          [38, 122, 5],
          [24, 138, 4],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={C.cream} {...ink} />
        ))}
        <path
          d="M100 56 q10 10 4 24 M60 96 q6 8 2 18"
          stroke={C.cream}
          strokeWidth="2"
          fill="none"
        />
        <rect x="0.5" y="0.5" width="199" height="149" fill="none" {...ink} />
      </svg>
    );
  if (kind === 'bigart_koi')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <rect width="200" height="150" fill="#465680" />
        {[
          [50, 50, 30],
          [50, 50, 46],
          [150, 100, 26],
          [150, 100, 40],
        ].map(([x, y, r], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill="none"
            stroke={HI}
            strokeOpacity=".25"
            strokeWidth="1.5"
          />
        ))}
        <circle cx="166" cy="34" r="20" fill={C.matcha} {...ink} />
        <path d="M166 34 L186 26 L186 42Z" fill="#465680" {...ink} />
        <circle cx="30" cy="120" r="16" fill={C.matchaL} {...ink} />
        <path d="M30 120 L46 114 L46 126Z" fill="#465680" {...ink} />
        <circle cx="172" cy="30" r="4" fill={C.blush} {...ink} />
        <g transform="rotate(-22 76 72)">
          <path
            d="M44 72 q-12 -14 -18 -4 q6 2 6 4 q0 2 -6 4 q6 10 18 -4z"
            fill={C.cream}
            {...ink}
          />
          <ellipse cx="76" cy="72" rx="30" ry="12" fill={C.cream} {...ink} />
          <circle cx="68" cy="68" r="7" fill={C.persimmon} {...ink} />
          <circle cx="88" cy="75" r="5" fill={C.persimmon} {...ink} />
          <circle cx="98" cy="70" r="1.8" fill={INK} />
        </g>
        <g transform="rotate(18 128 100)">
          <path
            d="M100 100 q-10 -12 -16 -3 q5 2 5 3 q0 1 -5 3 q6 9 16 -3z"
            fill={C.persimmon}
            {...ink}
          />
          <ellipse cx="128" cy="100" rx="26" ry="10" fill={C.persimmon} {...ink} />
          <circle cx="124" cy="98" r="5" fill={C.cream} {...ink} />
          <circle cx="146" cy="98" r="1.6" fill={INK} />
        </g>
        <rect x="0.5" y="0.5" width="199" height="149" fill="none" {...ink} />
      </svg>
    );
  if (kind === 'bigart_cranes')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <rect width="200" height="150" fill={C.cream} />
        <circle cx="52" cy="52" r="24" fill={C.clay} {...ink} />
        <path
          d="M200 150 q-30 -40 -60 -34 q20 4 32 20 q-24 -6 -40 10 q20 -2 36 10z"
          fill={C.walnut}
          {...ink}
        />
        {[150, 162, 174, 186].map((x, i) => (
          <circle key={i} cx={x} cy={126 - (i % 2) * 8} r="9" fill={C.matcha} {...ink} />
        ))}
        {[
          { t: '', w: true },
          { t: 'translate(-60 30) scale(.7)', w: false },
        ].map((g, i) => (
          <g key={i} transform={g.t || undefined}>
            <ellipse cx="110" cy="82" rx="30" ry="12" fill="#fbf7f0" {...ink} />
            <path d="M84 84 q-16 -2 -26 12 q14 -4 28 -2z" fill={INK} />
            <path
              d="M98 76 q-10 -18 10 -30 q6 -4 10 -8"
              stroke="#fbf7f0"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M98 76 q-10 -18 10 -30 q6 -4 10 -8"
              {...ink}
              fill="none"
              strokeWidth="1"
              strokeOpacity=".5"
            />
            <circle cx="119" cy="37" r="6" fill="#fbf7f0" {...ink} />
            <circle cx="118" cy="32" r="2.5" fill={C.clay} />
            <path d="M124 38 l12 3 l-12 2z" fill={INK} />
            {g.w && <path d="M112 72 q22 -18 46 -16 q-18 6 -30 22z" fill="#fbf7f0" {...ink} />}
            {g.w && <path d="M140 60 q10 -4 18 -4 q-8 6 -14 12z" fill={INK} />}
            <path d="M104 94 v30 M116 94 v30" {...ink} strokeWidth="1.6" />
          </g>
        ))}
        <rect x="0.5" y="0.5" width="199" height="149" fill="none" {...ink} />
      </svg>
    );
  return null;
}

export function SmallArt({ kind }: { kind: string }) {
  if (kind === 'smallart_calli')
    return (
      <svg viewBox="0 0 60 100" className="sart art-svg">
        <rect x="8" y="8" width="44" height="84" fill="#fbf7f0" {...ink} />
        <rect x="4" y="4" width="52" height="6" rx="3" fill={C.walnut} {...ink} />
        <rect x="4" y="90" width="52" height="6" rx="3" fill={C.walnut} {...ink} />
        <text
          x="30"
          y="58"
          textAnchor="middle"
          fontFamily="serif"
          fontWeight="900"
          fontSize="30"
          fill={INK}>
          麺
        </text>
        <rect x="38" y="72" width="9" height="9" rx="1" fill={C.clay} {...ink} />
      </svg>
    );
  if (kind === 'smallart_miso')
    return (
      <svg viewBox="0 0 70 100" className="sart art-svg">
        <rect x="2" y="2" width="66" height="96" fill="#f3d9a4" {...ink} />
        <rect x="6" y="6" width="58" height="88" fill="none" stroke="#fbf7f0" strokeWidth="2.5" />
        <g transform="translate(10 14) scale(0.5)">
          <CatArt size={100} />
        </g>
        <text
          x="35"
          y="86"
          textAnchor="middle"
          fontSize="11"
          fill="#5a3a24"
          className="sart-poster-text">
          MOCHI
        </text>
      </svg>
    );
  if (kind === 'smallart_sakura')
    return (
      <svg viewBox="0 0 70 100" className="sart art-svg">
        <rect x="2" y="2" width="66" height="96" fill="#fbf7f0" {...ink} />
        <path
          d="M10 92 q24 -40 52 -66"
          {...ink}
          stroke={C.walnut}
          strokeOpacity="1"
          strokeWidth="3"
          fill="none"
        />
        <path d="M10 92 q24 -40 52 -66" {...ink} fill="none" strokeOpacity=".5" />
        <path
          d="M30 70 q8 -12 6 -22 M46 52 q12 -2 20 -12"
          {...ink}
          stroke={C.walnut}
          strokeOpacity="1"
          strokeWidth="2"
          fill="none"
        />
        {[
          [36, 46],
          [22, 76],
          [48, 38],
          [60, 28],
          [42, 60],
          [56, 50],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx="0"
                cy="-4.5"
                rx="3"
                ry="4.5"
                fill={C.blush}
                {...ink}
                strokeOpacity=".5"
                transform={`rotate(${a})`}
              />
            ))}
            <circle r="1.6" fill={C.clay} />
          </g>
        ))}
      </svg>
    );
  return null;
}

/* ---------- lamps ---------- */

export function Lamps({ kind }: { kind: string }) {
  if (kind === 'lamps_paper')
    return (
      <div className="rest-lamps paper">
        {[0, 1].map((i) => (
          <svg key={i} viewBox="0 0 60 100" preserveAspectRatio="xMidYMax meet" className="pend">
            <circle cx="30" cy="60" r="34" className="halo" />
            <path d="M30 -600 V36" {...ink} />
            <circle cx="30" cy="58" r="22" fill={C.cream} {...ink} />
            <path d="M44 42 q12 18 -4 34 q6 -18 4 -34z" fill={C.creamD} />
            <path d="M14 58 q16 -4 32 0 M16 50 q14 -3 28 0 M16 66 q14 3 28 0" {...line} />
            <ellipse cx="22" cy="48" rx="3" ry="5" fill={HI} opacity=".7" />
            <rect x="26" y="78" width="8" height="4" rx="1.5" fill={C.walnut} {...ink} />
          </svg>
        ))}
      </div>
    );
  if (kind === 'lamps_edison')
    return (
      <div className="rest-lamps edison">
        {[0, 1].map((i) => (
          <svg
            key={i}
            viewBox="0 0 40 100"
            preserveAspectRatio="xMidYMax meet"
            className="pend"
            style={{ height: i ? '88%' : '100%' }}>
            <circle cx="20" cy="70" r="26" className="halo" />
            <path d="M20 -600 V44" {...ink} />
            <rect x="14" y="44" width="12" height="10" rx="2" fill={C.walnut} {...ink} />
            <path d="M12 56 q-6 16 2 26 q6 6 12 0 q8 -10 2 -26z" fill="#f4d79a" {...ink} />
            <path d="M24 56 q6 16 2 26 q-2 2 -4 3 q6 -6 4 -14 q-2 -8 -2 -15z" fill="#e2b96a" />
            <path d="M17 60 v12 q3 5 6 0 v-12" fill="none" stroke={C.goldD} strokeWidth="1.2" />
            <ellipse cx="15" cy="64" rx="1.5" ry="3" fill={HI} opacity=".7" />
          </svg>
        ))}
      </div>
    );
  if (kind === 'lamps_festival')
    return (
      <div className="rest-lamps festival">
        <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="garland">
          <path d="M0 4 Q150 40 300 4" {...ink} fill="none" />
        </svg>
        <svg viewBox="0 0 300 60" preserveAspectRatio="xMidYMid meet" className="garland-lamps">
          {[C.clay, C.gold, C.matcha, C.blush, C.indigo, C.persimmon, C.clay].map((c, i) => {
            const x = 24 + i * 42;
            const t = x / 300;
            const y = 4 + 36 * 4 * t * (1 - t) * 0.5;
            return (
              <g key={i} transform={`translate(${x} ${y})`}>
                <circle cx="0" cy="18" r="16" className="halo" fill={c} />
                <path d="M0 0 v5" {...ink} />
                <rect x="-4" y="5" width="8" height="3" rx="1" fill={C.walnut} {...ink} />
                <ellipse cx="0" cy="18" rx="8" ry="10" fill={c} {...ink} />
                <path d="M4 10 q5 8 0 16 q2 -8 0 -16z" fill={INK} opacity=".18" />
                <ellipse cx="-3" cy="13" rx="1.4" ry="2.4" fill={HI} opacity=".6" />
                <rect x="-4" y="27" width="8" height="3" rx="1" fill={C.walnut} {...ink} />
              </g>
            );
          })}
        </svg>
      </div>
    );
  return (
    <div className="rest-lamps red">
      {[0, 1].map((i) => (
        <div key={i} className="rlamp" style={{ animationDelay: `${i * 0.8}s` }}>
          <RedLanternSvg kanji={['麺', '福'][i]} cord={40} />
        </div>
      ))}
    </div>
  );
}

/* ---------- plants ---------- */

export function Plant({ kind }: { kind: string }) {
  if (kind === 'plants_bamboo')
    return (
      <svg viewBox="0 0 80 200" className="rest-plant bamboo">
        <ellipse cx="40" cy="196" rx="30" ry="3" fill={INK} opacity=".16" />
        {[22, 40, 58].map((x, i) => (
          <g key={x}>
            <rect
              x={x - 4}
              y={20 + i * 14}
              width="8"
              height={150 - i * 14}
              rx="3"
              fill={i === 1 ? C.matcha : C.matchaL}
              {...ink}
            />
            <path
              d={`M${x + 2} ${24 + i * 14} v${142 - i * 14}`}
              stroke={C.matchaD}
              strokeWidth="2"
            />
            {[0, 1, 2, 3].map((k) => (
              <path key={k} d={`M${x - 4} ${50 + i * 8 + k * 32} h8`} {...ink} />
            ))}
            <path
              d={`M${x} ${40 + i * 20} q14 -10 26 -2 q-14 4 -26 2z`}
              fill={C.matchaL}
              {...ink}
            />
            <path d={`M${x} ${86 + i * 10} q-16 -10 -28 -2 q14 4 28 2z`} fill={C.matcha} {...ink} />
          </g>
        ))}
        <path d="M14 168 h52 l-5 30 h-42z" fill={C.linen} {...ink} />
        <path d="M46 168 h20 l-5 30 h-18z" fill={C.creamD} />
        <rect x="12" y="164" width="56" height="7" rx="2" fill={C.cream} {...ink} />
      </svg>
    );
  if (kind === 'plants_bonsai')
    return (
      <svg viewBox="0 0 120 150" className="rest-plant bonsai">
        <ellipse cx="60" cy="146" rx="44" ry="3.5" fill={INK} opacity=".16" />
        <path d="M22 118 h76 l-6 24 h-64z" fill={C.indigo} {...ink} />
        <path d="M66 118 h32 l-6 24 h-28z" fill={C.indigoD} />
        <rect x="18" y="112" width="84" height="8" rx="3" fill="#56689a" {...ink} />
        <path
          d="M58 112 q-4 -24 -18 -40 q10 4 16 14 q0 -20 10 -34 q2 16 -2 30 q8 -10 24 -12 q-14 8 -18 22 q2 10 -4 20z"
          fill={C.walnut}
          {...ink}
        />
        {[
          [30, 62, 20, 11, C.matcha],
          [66, 36, 22, 12, C.matchaL],
          [92, 58, 18, 10, C.matcha],
          [52, 50, 16, 9, C.matchaL],
        ].map(([x, y, rx, ry, c], i) => (
          <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={String(c)} {...ink} />
        ))}
        <ellipse cx="60" cy="33" rx="5" ry="2.4" fill={HI} opacity=".6" />
      </svg>
    );
  if (kind === 'plants_monstera')
    return (
      <svg viewBox="0 0 140 200" className="rest-plant monstera">
        <ellipse cx="70" cy="197" rx="36" ry="3" fill={INK} opacity=".16" />
        <path d="M42 160 h56 l-6 38 h-44z" fill={C.clay} {...ink} />
        <path d="M74 160 h24 l-6 38 h-20z" fill={C.clayD} />
        <rect x="38" y="156" width="64" height="8" rx="3" fill={C.clayL} {...ink} />
        {[
          [70, 150, 30, 70, -30],
          [70, 150, 110, 80, 30],
          [70, 150, 60, 36, -8],
          [70, 150, 96, 120, 14],
        ].map(([sx, sy, ex, ey, rot], i) => (
          <g key={i}>
            <path
              d={`M${sx} ${sy} Q${(sx + ex) / 2} ${ey + 20} ${ex} ${ey}`}
              stroke={C.matchaD}
              strokeWidth="3"
              fill="none"
            />
            <g transform={`translate(${ex} ${ey}) rotate(${rot})`}>
              <path
                d="M0 0 q-26 -10 -30 -34 q4 -22 30 -28 q26 6 30 28 q-4 24 -30 34z"
                fill={i % 2 ? C.matchaL : C.matcha}
                {...ink}
              />
              <path
                d="M-18 -30 q6 -4 8 -12 q-6 2 -8 12z M18 -30 q-6 -4 -8 -12 q6 2 8 12z"
                fill={C.linen}
                {...ink}
              />
              <path
                d="M0 -6 q-14 -6 -16 -20 M0 -6 q14 -6 16 -20 M0 -6 v-44"
                {...ink}
                strokeOpacity=".5"
                fill="none"
              />
            </g>
          </g>
        ))}
      </svg>
    );
  return null;
}

/* ---------- neon (sits in the window pane) ---------- */

export function Neon({ kind }: { kind: string }) {
  if (kind === 'neon_ramen')
    return (
      <div className="rest-neon text">
        <span>ラーメン</span>
      </div>
    );
  if (kind === 'neon_bowl')
    return (
      <div className="rest-neon bowl">
        <svg viewBox="0 0 120 80">
          <g fill="none" strokeWidth="9" strokeLinecap="round" opacity=".35">
            <path d="M14 40 h92 q-4 30 -46 30 q-42 0 -46 -30z" stroke="#ffd3a1" />
            <path d="M30 40 L96 6 M40 40 L104 14" stroke="#ff9fbf" />
          </g>
          <g fill="none" strokeWidth="3.5" strokeLinecap="round">
            <path d="M14 40 h92 q-4 30 -46 30 q-42 0 -46 -30z" stroke="#ffe6c8" />
            <path d="M30 40 L96 6 M40 40 L104 14" stroke="#ffc3d6" />
            <path
              d="M44 28 q-6 -8 0 -16 M60 26 q-6 -8 0 -16 M76 28 q-6 -8 0 -16"
              stroke="#ffe6c8"
            />
          </g>
        </svg>
      </div>
    );
  return null;
}

/* ---------- counter decor ---------- */

export function CounterDecor({ kind }: { kind: string }) {
  if (kind === 'counter_maneki')
    return (
      <svg viewBox="0 0 100 110" className="rest-counter maneki">
        <ellipse cx="50" cy="106" rx="30" ry="3.5" fill={INK} opacity=".18" />
        <path d="M22 102 q-6 -40 28 -42 q34 2 28 42z" fill={C.cream} {...ink} />
        <path d="M58 62 q22 6 20 40 h-8 q2 -30 -12 -40z" fill={C.creamD} />
        <ellipse cx="48" cy="84" rx="14" ry="15" fill="#fff8ee" {...ink} strokeOpacity=".35" />
        <g className="maneki-paw">
          <path d="M70 72 q6 -30 4 -42 q-10 4 -12 16 q-4 14 0 26z" fill={C.cream} {...ink} />
          <circle cx="73" cy="29" r="8" fill={C.cream} {...ink} />
          <circle cx="70" cy="26" r="2" fill={C.blush} />
          <circle cx="76" cy="26" r="2" fill={C.blush} />
        </g>
        <circle cx="46" cy="44" r="22" fill={C.cream} {...ink} />
        <path d="M26 34 l2 -18 l14 10z M66 34 l-2 -16 l-14 8z" fill={C.cream} {...ink} />
        <path d="M30 32 l1 -10 l8 6z M62 31 l-1 -9 l-8 5z" fill={C.blush} />
        <path d="M34 42 q4 -4 8 0 M52 42 q4 -4 8 0" {...ink} strokeWidth="2" fill="none" />
        <circle cx="46" cy="50" r="2" fill={C.clay} />
        <path d="M40 54 q6 4 12 0" {...ink} fill="none" />
        <path d="M24 64 q22 -10 44 0 l-2 6 q-20 -8 -40 0z" fill={C.clay} {...ink} />
        <circle cx="46" cy="68" r="4.5" fill={C.gold} {...ink} />
        <g transform="rotate(-10 38 87)">
          <rect x="26" y="78" width="24" height="18" rx="4" fill={C.gold} {...ink} />
          <text x="32" y="92" fontSize="9" fontWeight="800" fill={C.walnut}>
            福
          </text>
        </g>
        <ellipse cx="38" cy="36" rx="3" ry="4" fill={HI} opacity=".6" />
      </svg>
    );
  if (kind === 'counter_ikebana')
    return (
      <svg viewBox="0 0 100 120" className="rest-counter ikebana">
        <ellipse cx="50" cy="116" rx="26" ry="3.5" fill={INK} opacity=".18" />
        <path d="M30 86 h40 l-4 28 h-32z" fill={C.indigo} {...ink} />
        <path d="M56 86 h14 l-4 28 h-12z" fill={C.indigoD} />
        <rect x="26" y="82" width="48" height="7" rx="2" fill="#56689a" {...ink} />
        <path
          d="M50 84 q-6 -30 -24 -48 M50 84 q4 -36 20 -56 M50 84 q10 -20 34 -26"
          {...ink}
          stroke={C.walnut}
          strokeOpacity="1"
          strokeWidth="2.4"
          fill="none"
        />
        <path
          d="M50 84 q-2 -30 6 -56"
          {...ink}
          stroke={C.matchaD}
          strokeOpacity="1"
          strokeWidth="2.4"
          fill="none"
        />
        <path
          d="M56 40 q10 -8 8 -22 q-8 8 -8 22z M44 60 q-12 -4 -14 -18 q10 4 14 18z"
          fill={C.matcha}
          {...ink}
        />
        {[
          [26, 38, C.blush],
          [70, 28, C.gold],
          [84, 58, C.blush],
          [56, 26, '#fbf7f0'],
        ].map(([x, y, c], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse
                key={a}
                cx="0"
                cy="-5"
                rx="3"
                ry="5"
                fill={String(c)}
                {...ink}
                strokeOpacity=".55"
                transform={`rotate(${a})`}
              />
            ))}
            <circle r="2" fill={C.persimmon} />
          </g>
        ))}
      </svg>
    );
  return null;
}

/* ---------- specials ---------- */

export function Special({ kind }: { kind: string }) {
  if (kind === 'special_aquarium')
    return (
      <div className="rest-special aquarium">
        <svg viewBox="0 0 120 90" className="sp-svg">
          <ellipse cx="60" cy="88" rx="50" ry="2.5" fill={INK} opacity=".16" />
          {/* stand */}
          <rect x="8" y="60" width="104" height="26" fill={C.walnut} {...ink} />
          <rect x="92" y="60" width="20" height="26" fill={C.walnutD} />
          <rect x="4" y="56" width="112" height="6" rx="1.5" fill={C.oakL} {...ink} />
          {/* tank */}
          <rect x="12" y="8" width="96" height="48" rx="2" fill="#7fb4c3" {...ink} />
          <rect x="12" y="8" width="96" height="6" fill="#a9d1dc" />
          <path d="M12 56 v-10 q20 -8 40 0 q20 8 56 -4 v14z" fill={C.sand} {...ink} />
          <path
            d="M26 46 q4 -14 8 0 M34 48 q4 -18 8 0 M90 42 q4 -12 8 0"
            fill="none"
            {...ink}
            stroke={C.matcha}
            strokeWidth="2.2"
            strokeOpacity="1"
          />
          <g className="aq-fish f0">
            <path d="M4 10 q10 -10 22 0 q-12 10 -22 0z" fill={C.persimmon} {...ink} />
            <path d="M26 10 l10 -7 v14z" fill={C.persimmon} {...ink} />
            <circle cx="10" cy="8" r="1.4" fill={INK} />
          </g>
          <g className="aq-fish f1">
            <path d="M4 10 q10 -10 22 0 q-12 10 -22 0z" fill={C.cream} {...ink} />
            <path d="M26 10 l10 -7 v14z" fill={C.cream} {...ink} />
            <circle cx="10" cy="8" r="1.4" fill={INK} />
          </g>
          <path
            d="M20 16 q10 -4 20 0"
            {...ink}
            stroke={HI}
            strokeOpacity=".8"
            strokeWidth="2"
            fill="none"
          />
          <rect x="12" y="8" width="96" height="48" rx="2" fill="none" {...ink} />
        </svg>
      </div>
    );
  if (kind === 'special_turntable')
    return (
      <div className="rest-special turntable">
        <svg viewBox="0 0 120 90" className="sp-svg">
          <ellipse cx="60" cy="88" rx="46" ry="2.5" fill={INK} opacity=".16" />
          <rect x="14" y="56" width="92" height="30" fill={C.walnut} {...ink} />
          <rect x="86" y="56" width="20" height="30" fill={C.walnutD} />
          <rect x="30" y="64" width="22" height="14" rx="1.5" fill={C.cream} {...ink} />
          <rect x="56" y="64" width="12" height="14" rx="1.5" fill={C.clay} {...ink} />
          <rect x="10" y="50" width="100" height="8" rx="1.5" fill={C.oakL} {...ink} />
          {/* deck */}
          <rect x="18" y="30" width="84" height="20" rx="3" fill={C.oak} {...ink} />
          <g className="tt-disc">
            <circle cx="48" cy="38" r="17" fill={INK} opacity=".9" />
            <circle cx="48" cy="38" r="17" fill="none" {...ink} />
            <circle
              cx="48"
              cy="38"
              r="11"
              fill="none"
              stroke={HI}
              strokeOpacity=".25"
              strokeWidth="1"
            />
            <circle cx="48" cy="38" r="6" fill={C.clay} {...ink} />
            <circle cx="48" cy="38" r="1.5" fill={INK} />
          </g>
          <circle cx="88" cy="26" r="4" fill={C.steelD} {...ink} />
          <path d="M88 26 L70 40" {...ink} stroke={C.steel} strokeOpacity="1" strokeWidth="3" />
          <path d="M88 26 L70 40" {...ink} fill="none" />
          <text x="98" y="18" fontSize="9" fill={C.gold} className="tt-note">
            ♪
          </text>
        </svg>
      </div>
    );
  return null;
}

/* ---------- fixed furniture: shelf, pass, menu, window ---------- */

function Ceramics() {
  return (
    <svg viewBox="0 0 300 100" preserveAspectRatio="xMidYMax meet" className="shelf-svg">
      {/* board */}
      <rect x="0" y="82" width="300" height="9" rx="2" fill={C.oakL} {...ink} />
      <rect x="0" y="86" width="300" height="5" fill={C.oakD} />
      <path d="M0 92 v12 M300 92 v12" {...ink} />
      <path d="M30 92 l-10 10 M270 92 l10 10" {...ink} />
      {/* tall vase */}
      <path
        d="M34 82 q-14 -10 -10 -36 q2 -14 12 -20 h6 q10 6 12 20 q4 26 -10 36z"
        fill={C.matcha}
        {...ink}
      />
      <path
        d="M44 82 q10 -10 8 -36 q-2 -14 -10 -20 h-2 q10 6 12 20 q4 26 -10 36z"
        fill={C.matchaD}
      />
      <rect x="34" y="21" width="12" height="5" rx="1.5" fill={C.matchaL} {...ink} />
      <ellipse cx="33" cy="44" rx="2.5" ry="6" fill={HI} opacity=".6" />
      {/* stacked bowls */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${-i * 11})`}>
          <path
            d="M96 82 q-2 -16 22 -16 q24 0 22 16z"
            fill={i === 1 ? C.cream : C.linen}
            {...ink}
          />
          <path d="M118 82 q22 -2 22 -16 q-6 10 -22 16z" fill={C.creamD} />
          <path d="M100 70 q18 -3 36 0" stroke={C.indigo} strokeWidth="2.2" fill="none" />
        </g>
      ))}
      {/* teapot */}
      <ellipse cx="186" cy="68" rx="22" ry="15" fill={C.clay} {...ink} />
      <path d="M196 54 q14 14 0 28 q6 -14 0 -28z" fill={C.clayD} />
      <path
        d="M206 62 q12 -2 10 -14"
        {...ink}
        stroke={C.clay}
        strokeOpacity="1"
        strokeWidth="5"
        fill="none"
      />
      <path d="M206 62 q12 -2 10 -14" {...ink} fill="none" />
      <path d="M176 50 q10 -14 20 0" {...ink} fill="none" strokeWidth="1.6" />
      <rect x="178" y="50" width="16" height="5" rx="2" fill={C.clayD} {...ink} />
      <circle cx="186" cy="49" r="3" fill={C.gold} {...ink} />
      <ellipse cx="176" cy="62" rx="3" ry="4.5" fill={HI} opacity=".55" />
      {/* bottle */}
      <path d="M246 82 v-30 q0 -6 6 -6 h8 q6 0 6 6 v30z" fill={C.indigo} {...ink} />
      <path d="M258 82 v-30 q0 -6 -2 -6 h4 q6 0 6 6 v30z" fill={C.indigoD} />
      <rect x="250" y="38" width="12" height="9" rx="2" fill="#56689a" {...ink} />
      <rect x="249" y="60" width="12" height="12" fill={C.cream} {...ink} />
    </svg>
  );
}

function PassWindow() {
  return (
    <div className="rest-pass">
      <div className="rp-open">
        <svg viewBox="0 0 140 100" preserveAspectRatio="xMidYMax meet" className="rp-pot">
          <g className="rp-steam">
            <Cloud x={56} y={30} s={0.75} />
            <Cloud x={88} y={20} s={0.6} />
          </g>
          <rect x="30" y="50" width="80" height="44" rx="6" fill={C.steel} {...ink} />
          <path d="M92 50 h18 v44 h-18z" fill={C.steelD} />
          <rect x="30" y="50" width="80" height="44" rx="6" fill="none" {...ink} />
          <path
            d="M22 60 h8 M110 60 h8"
            {...ink}
            strokeWidth="5"
            stroke={C.steelD}
            strokeOpacity="1"
          />
          <path d="M22 60 h8 M110 60 h8" {...ink} fill="none" />
          <ellipse cx="70" cy="50" rx="40" ry="6" fill="#e3e6ea" {...ink} />
          <rect x="64" y="40" width="12" height="5" rx="2" fill={C.walnut} {...ink} />
          <path d="M40 60 v24" stroke={HI} strokeWidth="3" opacity=".6" strokeLinecap="round" />
          <path
            d="M12 24 v38 q0 8 8 8 q8 0 8 -8"
            {...ink}
            stroke={C.walnut}
            strokeOpacity="1"
            strokeWidth="3"
            fill="none"
          />
          <path d="M12 24 v38 q0 8 8 8 q8 0 8 -8" {...ink} fill="none" />
        </svg>
      </div>
      <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="rp-rail">
        <rect x="0" y="0" width="100" height="2.5" fill={C.oakD} />
        {[6, 38, 70].map((x, i) => (
          <path
            key={x}
            d={`M${x} 2 h24 v${[20, 15, 18][i]} q-6 3 -12 0 q-6 3 -12 0z`}
            fill={C.cream}
            {...ink}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {[6, 38, 70].map((x) => (
          <rect key={x} x={x} y="2" width="24" height="3" fill={C.clay} />
        ))}
      </svg>
      <div className="rp-ledge" />
    </div>
  );
}

function MenuBoard({ menu }: { menu: string }) {
  return (
    <div className="rest-menu">
      <div className="rm-title">Menü</div>
      <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="rm-line">
        <path
          d="M2 3 q25 -3 50 0 t46 0"
          stroke={C.cream}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <small>{menu}</small>
      <svg viewBox="0 0 60 34" className="rm-doodle">
        <g fill="none" stroke={C.cream} strokeWidth="2" strokeLinecap="round">
          <path d="M8 16 h44 q-2 14 -22 14 q-20 0 -22 -14z" />
          <path d="M18 16 l24 -12 M24 16 l24 -10" />
          <path d="M24 10 q-3 -4 0 -8 M32 8 q-3 -4 0 -8" opacity=".7" />
        </g>
      </svg>
    </div>
  );
}

/* ---------- floor in perspective (viewBox 0..100, stretched) ---------- */

const fz = (t: number) => (1.35 * t) / (t + 0.35);
const py = (t: number) => 100 - 100 * fz(t);
const px = (u: number, t: number) => 50 + u * 50 * (1.8 - 1.4 * fz(t));
const quad = (u0: number, u1: number, t0: number, t1: number) =>
  `${px(u0, t0)},${py(t0)} ${px(u1, t0)},${py(t0)} ${px(u1, t1)},${py(t1)} ${px(u0, t1)},${py(t1)}`;

function floorShapes(kind: string) {
  const out: React.ReactNode[] = [];
  if (kind === 'floor_tatami') {
    out.push(<rect key="bg" width="100" height="100" fill="#d2c48f" />);
    const us = [-1.3, -0.45, 0.45, 1.3];
    const ts = [0, 0.3, 1];
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 2; k++) {
        out.push(
          <polygon
            key={`m${i}${k}`}
            points={quad(us[i], us[i + 1], ts[k], ts[k + 1])}
            fill={(i + k) % 2 ? '#d2c48f' : '#c8b981'}
            stroke="#5a4a3a"
            strokeWidth="2.2"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
        );
        for (let w = 1; w < 6; w++) {
          const t = ts[k] + ((ts[k + 1] - ts[k]) * w) / 6;
          out.push(
            <path
              key={`w${i}${k}${w}`}
              d={`M${px(us[i], t)} ${py(t)} L${px(us[i + 1], t)} ${py(t)}`}
              {...line}
              strokeOpacity=".1"
            />
          );
        }
      }
  } else if (kind === 'floor_checker') {
    const ts = [0, 0.06, 0.13, 0.21, 0.31, 0.43, 0.57, 0.75, 1];
    for (let k = 0; k < ts.length - 1; k++)
      for (let i = 0; i < 12; i++) {
        const u0 = -1.5 + i * 0.25;
        out.push(
          <polygon
            key={`c${i}${k}`}
            points={quad(u0, u0 + 0.25, ts[k], ts[k + 1])}
            fill={(i + k) % 2 ? '#f3ecdf' : '#3a332f'}
            {...ink}
            strokeOpacity=".35"
          />
        );
      }
  } else if (kind === 'floor_stone') {
    out.push(<rect key="bg" width="100" height="100" fill="#9a9085" />);
    const ts = [0.02, 0.1, 0.2, 0.33, 0.49, 0.68, 0.9];
    const fills = ['#b3aba0', '#a69d92', '#bbb3a8'];
    ts.forEach((t, k) => {
      const sc = 1.8 - 1.4 * fz(t);
      const rx = 5.2 * sc;
      const ry = rx * 0.5 * (1 - 0.55 * fz(t));
      for (let j = 0; j < 14; j++) {
        const u = -1.6 + j * 0.24 + (k % 2) * 0.12;
        out.push(
          <ellipse
            key={`s${k}${j}`}
            cx={px(u, t)}
            cy={py(t)}
            rx={rx}
            ry={ry}
            fill={fills[(j + k) % 3]}
            {...ink}
            strokeOpacity=".45"
          />
        );
      }
    });
  } else {
    out.push(<rect key="bg" width="100" height="100" fill="#cfa273" />);
    const n = 12;
    for (let i = 0; i < n; i++) {
      const u0 = -1.5 + i * 0.25;
      if (i % 3 === 0)
        out.push(<polygon key={`p${i}`} points={quad(u0, u0 + 0.25, 0, 1)} fill="#c3945f" />);
      out.push(
        <path key={`l${i}`} d={`M${px(u0, 0)} 100 L${px(u0, 1)} 0`} {...line} strokeOpacity=".32" />
      );
      const rows = i % 2 ? [0.06, 0.2, 0.4, 0.66] : [0.12, 0.3, 0.52, 0.8];
      rows.forEach((t) =>
        out.push(
          <path
            key={`r${i}${t}`}
            d={`M${px(u0, t)} ${py(t)} L${px(u0 + 0.25, t)} ${py(t)}`}
            {...line}
            strokeOpacity=".32"
          />
        )
      );
    }
  }
  out.push(<rect key="ao" width="100" height="7" fill={INK} opacity=".14" />);
  return out;
}

export function Floor({ kind }: { kind: string }) {
  const shapes = useMemo(() => floorShapes(kind), [kind]);
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="rest-floor-svg">
      {shapes}
    </svg>
  );
}

/* flat light cones under the two lamps + the pass (no blur) */
function LightCones() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="rest-light">
      <polygon points="29,18 8,100 50,100" fill="#ffd9a0" />
      <polygon points="71,18 50,100 92,100" fill="#ffd9a0" />
    </svg>
  );
}

/* ---------- tables ---------- */

function Table({ look, className, steam }: { look: Look; className?: string; steam?: boolean }) {
  return (
    <div className={`rest-table ${className ?? ''}`}>
      <svg viewBox="0 0 200 60" className="rt-chair">
        <rect x="56" y="6" width="88" height="54" rx="12" fill={C.walnut} {...ink} />
        <rect
          x="64"
          y="14"
          width="72"
          height="38"
          rx="8"
          fill={C.oakD}
          {...ink}
          strokeOpacity=".4"
        />
      </svg>
      <div className="rt-guest">
        <Avatar look={look} mood="happy" size={90} eating />
      </div>
      <svg viewBox="0 0 200 124" className="rt-table">
        <ellipse cx="100" cy="116" rx="72" ry="6" fill={INK} opacity=".14" />
        {/* side chair (right) */}
        <rect x="156" y="40" width="34" height="50" rx="6" fill={C.walnut} {...ink} />
        <rect x="160" y="70" width="26" height="6" rx="2" fill={C.walnutD} />
        <path d="M160 90 v18 M186 90 v18" {...ink} strokeWidth="2.4" />
        {/* pedestal */}
        <rect x="92" y="80" width="16" height="30" fill={C.walnut} {...ink} />
        <ellipse cx="100" cy="110" rx="30" ry="6" fill={C.walnut} {...ink} />
        {/* top: shade edge, then face */}
        <ellipse cx="100" cy="74" rx="88" ry="22" fill={C.oakD} {...ink} />
        <ellipse cx="100" cy="68" rx="88" ry="22" fill={C.oakL} {...ink} />
        <path
          d="M26 62 q30 -14 70 -12"
          stroke={HI}
          strokeWidth="2.2"
          opacity=".55"
          fill="none"
          strokeLinecap="round"
        />
        {/* bowl */}
        <ellipse cx="76" cy="68" rx="24" ry="7" fill={INK} opacity=".12" />
        <path d="M54 60 q0 12 22 12 q22 0 22 -12z" fill={C.linen} {...ink} />
        <path d="M80 72 q18 -2 18 -12 q-4 8 -18 12z" fill={C.creamD} />
        <path d="M56 65 q20 3 40 0" stroke={C.indigo} strokeWidth="1.6" fill="none" />
        <ellipse cx="76" cy="60" rx="22" ry="7" fill={C.cream} {...ink} />
        <ellipse cx="76" cy="60" rx="18" ry="5" fill="#e3b96b" {...ink} strokeOpacity=".4" />
        <path d="M62 60 q4 -3 8 0 t8 0 t8 0" stroke="#fbf0d2" strokeWidth="1.6" fill="none" />
        <path
          d="M62 60 q4 -3 8 0 t8 0 t8 0"
          {...ink}
          strokeWidth=".7"
          strokeOpacity=".45"
          fill="none"
        />
        <circle cx="68" cy="59" r="3" fill={C.blush} {...ink} strokeOpacity=".5" />
        <circle cx="84" cy="61" r="1.6" fill="none" stroke={C.matchaD} strokeWidth=".8" />
        <circle cx="80" cy="58" r="1.4" fill="none" stroke={C.matchaD} strokeWidth=".8" />
        <path
          d="M86 62 l26 -14 M90 64 l26 -12"
          {...ink}
          stroke={C.walnut}
          strokeOpacity="1"
          strokeWidth="2"
        />
        {steam && (
          <g className="rt-steam">
            <Cloud x={76} y={44} s={0.42} />
          </g>
        )}
        {/* teapot + cup */}
        <ellipse cx="146" cy="60" rx="11" ry="9" fill={C.matcha} {...ink} />
        <path d="M152 52 q6 8 0 16 q3 -8 0 -16z" fill={C.matchaD} />
        <path
          d="M156 58 q6 -2 5 -8"
          {...ink}
          stroke={C.matcha}
          strokeOpacity="1"
          strokeWidth="3"
          fill="none"
        />
        <path d="M156 58 q6 -2 5 -8" {...ink} fill="none" />
        <path d="M140 52 q6 -8 12 0" {...ink} fill="none" strokeWidth="1.2" />
        <circle cx="146" cy="51" r="1.8" fill={C.gold} />
        <ellipse cx="141" cy="56" rx="1.6" ry="2.6" fill={HI} opacity=".6" />
        <path d="M118 70 q0 6 6 6 q6 0 6 -6z" fill={C.cream} {...ink} />
        <ellipse cx="124" cy="70" rx="6" ry="2.2" fill={C.matchaL} {...ink} strokeOpacity=".4" />
      </svg>
    </div>
  );
}

/* ---------- the restaurant ---------- */

export type RestaurantTime = DayTime | number;

function normTime(t?: RestaurantTime): DayTime {
  if (t == null) return 'noon';
  if (typeof t === 'string') return t;
  return t >= 0.7 ? 'night' : t >= 0.4 ? 'sunset' : 'noon';
}

export function Restaurant({
  decor,
  rain = false,
  menu = 'ramen • udon • soba',
  cat,
  time,
  weather = 'clear',
}: {
  decor: Decor;
  rain?: boolean;
  menu?: string;
  cat?: React.ReactNode;
  /** Level time of day. A legacy 0..1 "night" number is still accepted. */
  time?: RestaurantTime;
  weather?: Weather;
}) {
  const looks = useMemo(
    () => GUEST_SEEDS.map((seed) => ({ ...randomLook(), seed, kid: false })),
    []
  );
  const n = tableCount(decor);
  const t = normTime(time);
  const wet = rain || weather === 'rain';
  const w: Weather = wet ? 'rain' : weather;
  return (
    <div className={`rest t-${t} w-${w}`} aria-hidden="true">
      <div className={`rest-wall ${decor.wall}`}>
        <div className="rest-sunwall" />
        <div className="rest-window">
          <StreetScene />
          {wet && <Rain count={16} />}
          <div className="rest-neon-slot">
            <Neon kind={decor.neon} />
          </div>
          <div className="rw-frame" />
          <div className="rw-sill" />
        </div>
        <div className="rest-bigart">
          {decor.bigart !== 'bigart_none' && (
            <div className="art-frame">
              <BigArt kind={decor.bigart} />
            </div>
          )}
        </div>
        <div className="rest-shelf">
          <Ceramics />
          {cat && <div className="rest-cat">{cat}</div>}
        </div>
        <div className="rest-smallart">
          <SmallArt kind={decor.smallart} />
        </div>
        <MenuBoard menu={menu} />
        <PassWindow />
      </div>
      <div className={`rest-floor ${decor.floor}`}>
        <Floor kind={decor.floor} />
      </div>
      <div className="rest-baseboard" />
      <div className="rest-sun" />
      {n >= 4 && (
        <>
          <Table look={looks[2]} className="far l" />
          <Table look={looks[3]} className="far r" />
        </>
      )}
      {n >= 2 && (
        <>
          <Table look={looks[0]} className="near l" steam />
          <Table look={looks[1]} className="near r" steam />
        </>
      )}
      <Plant kind={decor.plants} />
      <Special kind={decor.special} />
      <div className="rest-shade" />
      <LightCones />
      <Lamps kind={decor.lamps} />
      <CounterDecor kind={decor.counter} />
      <div className="rest-vignette" />
    </div>
  );
}
