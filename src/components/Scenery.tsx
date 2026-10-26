import type React from 'react';
import { useMemo, type SVGProps } from 'react';
import { Avatar } from '../avatar';
import { CatArt, randomLook, type Look } from '../art';
import { tableCount, type Decor } from '../decor';
import type { DayTime, Weather } from '../data';

/* =====================================================================
   v3 — one line language (ART_DIRECTION.md), same weight/flatness as
   Kamado.tsx: thin ink outline (#2b2420 @ .85, ~1px on screen via
   non-scaling-stroke), flat fill + one shadow tone + one highlight.
   No gradients, no blur, no SVG filters. Steam = outlined clouds.

   The salon: "Fener Sokağı" — a 40-year-old ramen-ya. Cedar slat
   walls over an indigo wainscot, a row of red lanterns, a street
   window on the left, the kitchen pass with a noren and hanging menu
   strips on the right, a tansu with sake under the window, stools at
   the pass, tables in the room. Center stays calm for the customer.
   ===================================================================== */

const INK = '#2b2420';
const HI = '#fff6e8';
const ink = {
  stroke: INK,
  strokeOpacity: 0.85,
  strokeWidth: 1.15,
  vectorEffect: 'non-scaling-stroke',
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const satisfies SVGProps<SVGElement>;
/** faint interior detail line */
const line = { ...ink, strokeOpacity: 0.3, fill: 'none' } as const;

const C = {
  cream: '#f6efe4',
  creamD: '#dccfbb',
  linen: '#ece2d2',
  sand: '#d9c4a3',
  oak: '#c4935b',
  oakL: '#d9b07a',
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
  indigoD: '#2e3a55',
  indigoL: '#56689a',
  gold: '#d9a441',
  goldD: '#b5862f',
  blush: '#e9b8b2',
  steel: '#c9ced6',
  steelD: '#9aa1aa',
  copper: '#b87333',
  copperD: '#8a4f22',
  celadon: '#a9d0b8',
  celadonD: '#7fb094',
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

/* ---------- a single hanging red lantern (title + salon lamps) ---------- */
function RedLanternSvg({ kanji, cord = 40 }: { kanji?: string; cord?: number }) {
  return (
    <svg viewBox={`0 ${40 - cord} 40 ${cord + 60}`} preserveAspectRatio="xMidYMax meet">
      <ellipse cx="20" cy="68" rx="30" ry="34" className="halo" />
      <path d={`M20 ${40 - cord - 600} V40`} {...ink} />
      <rect x="12" y="38" width="16" height="6" rx="1.5" fill={C.walnutD} {...ink} />
      <path
        d="M6 66 q0 -22 14 -22 q14 0 14 22 q0 22 -14 22 q-14 0 -14 -22z"
        fill={C.clay}
        {...ink}
      />
      <path d="M26 46 q10 20 0 40 q6 -20 0 -40z" fill={C.clayD} />
      <path d="M9 56 q11 3 22 0 M7 66 q13 3 26 0 M9 76 q11 3 22 0" {...line} strokeOpacity=".4" />
      <path d="M11 54 q1 -6 5 -8" stroke={HI} strokeOpacity=".6" strokeWidth="1.6" fill="none" />
      {kanji && (
        <text
          x="20"
          y="71"
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fontFamily="serif"
          fill={HI}>
          {kanji}
        </text>
      )}
      <rect x="12" y="86" width="16" height="6" rx="1.5" fill={C.walnutD} {...ink} />
      <path d="M20 92 v7" stroke={C.gold} strokeWidth="2.2" strokeLinecap="round" />
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
        <Tansu />
      </div>
      <Lanterns count={3} />
    </div>
  );
}

/* =====================================================================
   RESTAURANT — the salon behind the counter
   ===================================================================== */

const GUEST_SEEDS = [4821, 90133, 27719, 61207];

/* ---------- the lantern-lit street outside the window ---------- */

function StreetScene() {
  return (
    <svg viewBox="0 0 120 160" preserveAspectRatio="xMidYMid slice" className="rw-scene">
      <rect width="120" height="160" className="rw-sky" />
      <rect y="64" width="120" height="76" className="rw-sky2" />
      <g className="rw-clouds">
        <Cloud x={32} y={26} s={0.9} />
        <Cloud x={94} y={44} s={0.7} />
      </g>
      {/* far hills */}
      <path d="M-4 96 q22 -16 44 -4 q20 -14 44 -2 q16 -8 40 -2 V140 H-4z" fill="#cfd5c7" {...ink} />
      {/* shop fronts */}
      <rect x="-4" y="82" width="46" height="54" fill="#ead2c3" {...ink} />
      <rect x="42" y="70" width="40" height="66" fill={C.cream} {...ink} />
      <rect x="82" y="86" width="46" height="50" fill="#d6dccc" {...ink} />
      {/* tiled eaves */}
      <path d="M-6 82 h50 l-3 -7 h-44z" fill={C.walnut} {...ink} />
      <path d="M40 70 h44 l-3 -7 h-38z" fill={C.indigo} {...ink} />
      <path d="M80 86 h50 l-3 -7 h-44z" fill={C.walnut} {...ink} />
      {/* windows */}
      <rect x="4" y="92" width="10" height="12" rx="1" className="rw-win" {...ink} />
      <rect x="24" y="92" width="10" height="12" rx="1" className="rw-win" {...ink} />
      <rect x="48" y="78" width="28" height="16" rx="1.5" className="rw-win" {...ink} />
      <path d="M48 86 h28 M62 78 v16" {...line} strokeOpacity=".45" />
      <rect x="90" y="94" width="10" height="12" rx="1" className="rw-win" {...ink} />
      <rect x="108" y="94" width="10" height="12" rx="1" className="rw-win" {...ink} />
      {/* awnings + noren */}
      <path
        d="M-4 110 h46 v5 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0z"
        fill={C.clay}
        {...ink}
      />
      <path d="M-4 106 h46 v4 h-46z" fill={C.clayD} {...ink} />
      <rect x="44" y="102" width="36" height="5" rx="1" fill={C.walnut} {...ink} />
      <path
        d="M48 107 h12 v14 q-6 3 -12 0z M64 107 h12 v14 q-6 3 -12 0z"
        fill={C.indigo}
        {...ink}
      />
      <path
        d="M82 112 h46 v5 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0 q-2.9 4 -5.75 0z"
        fill={C.matcha}
        {...ink}
      />
      {/* doors / lower windows */}
      <rect x="8" y="118" width="9" height="18" fill={C.walnut} {...ink} />
      <rect x="24" y="118" width="12" height="12" className="rw-win" {...ink} />
      <rect x="50" y="122" width="24" height="14" rx="1" className="rw-win" {...ink} />
      <path d="M62 122 v14" {...line} strokeOpacity=".45" />
      <rect x="92" y="120" width="22" height="16" className="rw-win" {...ink} />
      {/* small street lanterns under the eaves */}
      {[
        [2, 86],
        [38, 86],
        [46, 74],
        [78, 74],
        [86, 90],
        [124, 90],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="8" className="halo" />
          <path d="M0 0 v3" {...ink} />
          <ellipse cy="8" rx="3.2" ry="4.6" fill={C.clay} {...ink} />
          <path d="M1.4 4.5 q2 3.5 0 7 q1 -3.5 0 -7z" fill={C.clayD} />
        </g>
      ))}
      {/* street */}
      <rect x="-4" y="136" width="128" height="30" fill="#bfb3a3" {...ink} />
      <rect x="-4" y="136" width="128" height="4" fill={C.linen} {...ink} />
      <path d="M8 150 h10 M26 150 h10 M44 150 h10 M62 150 h10 M80 150 h10 M98 150 h10" {...line} />
      {/* lamp post */}
      <path d="M22 136 V92" {...ink} strokeWidth="2.2" />
      <path d="M22 92 q0 -6 6 -6" {...ink} fill="none" />
      <circle cx="29" cy="86" r="3.2" className="rw-win" {...ink} />
      {/* tree */}
      <path d="M100 136 q2 -14 0 -26" stroke={C.walnut} strokeWidth="3" strokeLinecap="round" />
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

/* ---------- lamps (decor) ---------- */

export function Lamps({ kind }: { kind: string }) {
  if (kind === 'lamps_paper')
    return (
      <div className="rest-lamps paper">
        {[0, 1].map((i) => (
          <svg key={i} viewBox="0 0 60 100" preserveAspectRatio="xMidYMax meet" className="pend">
            <circle cx="30" cy="60" r="34" className="halo" />
            <path d="M30 -600 V36" {...ink} />
            <rect x="24" y="34" width="12" height="5" rx="1.5" fill={C.walnutD} {...ink} />
            <circle cx="30" cy="60" r="22" fill={C.cream} {...ink} />
            <path d="M44 44 q12 18 -4 34 q6 -18 4 -34z" fill={C.creamD} />
            <path d="M14 60 q16 -4 32 0 M16 52 q14 -3 28 0 M16 68 q14 3 28 0" {...line} />
            <path
              d="M18 52 q2 -6 8 -8"
              stroke={HI}
              strokeOpacity=".7"
              strokeWidth="1.8"
              fill="none"
            />
            <rect x="25" y="80" width="10" height="4" rx="1.5" fill={C.walnutD} {...ink} />
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
            <rect x="14" y="44" width="12" height="10" rx="2" fill={C.walnutD} {...ink} />
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
                <rect x="-4" y="5" width="8" height="3" rx="1" fill={C.walnutD} {...ink} />
                <ellipse cx="0" cy="18" rx="8" ry="10" fill={c} {...ink} />
                <path d="M4 10 q5 8 0 16 q2 -8 0 -16z" fill={INK} opacity=".18" />
                <ellipse cx="-3" cy="13" rx="1.4" ry="2.4" fill={HI} opacity=".6" />
                <rect x="-4" y="27" width="8" height="3" rx="1" fill={C.walnutD} {...ink} />
              </g>
            );
          })}
        </svg>
      </div>
    );
  return (
    <div className="rest-lamps red">
      {[0, 1].map((i) => (
        <div key={i} className="rlamp" style={{ animationDelay: `${i * 0.7}s` }}>
          <RedLanternSvg kanji={['麺', '福'][i]} cord={40} />
        </div>
      ))}
    </div>
  );
}

/* ---------- fixed furniture ---------- */

/** Walnut tansu under the window: drawers with iron pulls, sake and ceramics on top. */
function Tansu() {
  return (
    <svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMax meet" className="tansu-svg">
      {/* chest */}
      <ellipse cx="150" cy="148" rx="150" ry="3" fill={INK} opacity=".16" />
      <rect x="6" y="66" width="288" height="80" rx="2" fill={C.walnut} {...ink} />
      <path d="M238 66 h56 v80 h-56z" fill={C.walnutD} />
      <rect x="2" y="62" width="296" height="8" rx="2" fill={C.oakD} {...ink} />
      <path d="M2 62 h296 v3 H2z" fill={C.oakL} />
      {/* drawers */}
      {[
        [14, 78, 130, 28],
        [152, 78, 134, 28],
        [14, 112, 84, 28],
        [104, 112, 182, 28],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            rx="1.5"
            fill={C.walnut}
            {...ink}
            strokeOpacity=".6"
          />
          <rect x={x + 2} y={y + 2} width={w - 4} height="3" fill={HI} opacity=".12" />
          <path
            d={`M${x + w / 2 - 9} ${y + h / 2} h18`}
            stroke={INK}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <circle cx={x + w / 2} cy={y + h / 2 - 3} r="2.6" fill={INK} />
        </g>
      ))}
      <path d="M12 146 v4 M288 146 v4" {...ink} strokeWidth="2" />
      {/* sake bottles */}
      <path d="M30 62 v-30 q0 -4 4 -4 h4 v-10 h10 v10 h4 q4 0 4 4 v30z" fill={C.indigo} {...ink} />
      <path d="M46 62 v-30 q0 -4 -2 -4 h4 q4 0 4 4 v30z" fill={C.indigoD} />
      <rect x="33" y="40" width="16" height="12" fill={C.cream} {...ink} strokeOpacity=".5" />
      <path d="M36 44 h10 M36 48 h7" stroke={C.clay} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M62 62 v-34 q0 -4 4 -4 h3 v-8 h8 v8 h3 q4 0 4 4 v34z" fill={C.cream} {...ink} />
      <path d="M76 62 v-34 q0 -4 -2 -4 h4 q4 0 4 4 v34z" fill={C.creamD} />
      <rect x="65" y="38" width="14" height="14" fill={C.clay} {...ink} strokeOpacity=".5" />
      <text
        x="72"
        y="49"
        textAnchor="middle"
        fontSize="9"
        fontFamily="serif"
        fontWeight="700"
        fill={HI}>
        酒
      </text>
      {/* tokkuri + cups */}
      <path
        d="M98 62 q-8 -10 -4 -22 q2 -6 8 -8 h4 q6 2 8 8 q4 12 -4 22z"
        fill={C.celadon}
        {...ink}
      />
      <path d="M108 62 q6 -10 2 -22 q-2 -6 -6 -8 h2 q6 2 8 8 q4 12 -4 22z" fill={C.celadonD} />
      <rect x="100" y="28" width="8" height="5" rx="1.5" fill={C.celadonD} {...ink} />
      <path
        d="M118 62 v-9 q0 -3 3 -3 h8 q3 0 3 3 v9z M134 62 v-9 q0 -3 3 -3 h8 q3 0 3 3 v9z"
        fill={C.celadon}
        {...ink}
      />
      {/* stacked bowls */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${-i * 9})`}>
          <path
            d="M168 62 q-2 -14 20 -14 q22 0 20 14z"
            fill={i === 1 ? C.cream : C.linen}
            {...ink}
          />
          <path d="M188 62 q20 -2 20 -14 q-6 10 -20 14z" fill={C.creamD} />
          <path d="M172 52 q16 -3 32 0" stroke={C.indigo} strokeWidth="2" fill="none" />
        </g>
      ))}
      {/* teapot */}
      <ellipse cx="248" cy="48" rx="22" ry="14" fill={C.clay} {...ink} />
      <path d="M258 36 q14 12 0 26 q6 -12 0 -26z" fill={C.clayD} />
      <path
        d="M268 44 q12 -2 10 -14"
        stroke={C.clay}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M268 44 q12 -2 10 -14" {...ink} fill="none" />
      <path d="M238 32 q10 -14 20 0" {...ink} fill="none" strokeWidth="1.6" />
      <rect x="240" y="32" width="16" height="4" rx="2" fill={C.clayD} {...ink} />
      <circle cx="248" cy="31" r="2.6" fill={C.gold} {...ink} />
      <path d="M232 44 q1 -6 5 -8" stroke={HI} strokeOpacity=".6" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Small kamidana shrine shelf with a maneki-neko and two offering cups. */
function Kamidana() {
  return (
    <svg viewBox="0 0 100 92" preserveAspectRatio="xMidYMax meet" className="shrine-svg">
      {/* roof */}
      <path d="M2 24 L50 4 L98 24 L92 28 L50 12 L8 28z" fill={C.walnutD} {...ink} />
      <path d="M12 28 h76 v4 h-76z" fill={C.walnut} {...ink} />
      {/* shimenawa rope */}
      <path
        d="M12 36 q38 10 76 0"
        {...ink}
        stroke={C.oak}
        strokeOpacity="1"
        strokeWidth="3"
        fill="none"
      />
      <path d="M12 36 q38 10 76 0" {...ink} fill="none" />
      {[30, 50, 70].map((x) => (
        <path
          key={x}
          d={`M${x} ${39 + (x === 50 ? 1.5 : 0.5)} l-3 8 h6z`}
          fill={C.cream}
          {...ink}
        />
      ))}
      {/* shelf */}
      <rect x="6" y="80" width="88" height="6" rx="1.5" fill={C.oakL} {...ink} />
      <path d="M6 83 h88 v3 H6z" fill={C.oakD} />
      <path d="M18 86 l-6 6 M82 86 l6 6" {...ink} />
      {/* cups */}
      <path d="M16 80 v-8 q0 -3 3 -3 h7 q3 0 3 3 v8z" fill={C.cream} {...ink} />
      <path d="M71 80 v-8 q0 -3 3 -3 h7 q3 0 3 3 v8z" fill={C.cream} {...ink} />
      {/* maneki-neko */}
      <path d="M34 80 q-4 -22 16 -24 q20 2 16 24z" fill={C.cream} {...ink} />
      <path d="M56 58 q12 4 10 22 h-6 q2 -16 -6 -22z" fill={C.creamD} />
      <g className="maneki-paw">
        <path d="M62 66 q4 -14 2 -22 q-6 2 -7 10 q-2 8 0 12z" fill={C.cream} {...ink} />
        <circle cx="64" cy="43" r="4.5" fill={C.cream} {...ink} />
      </g>
      <circle cx="48" cy="50" r="12" fill={C.cream} {...ink} />
      <path d="M38 44 l1 -10 l8 6z M58 44 l-1 -9 l-8 5z" fill={C.cream} {...ink} />
      <path d="M40 43 l1 -6 l5 4z M56 43 l-1 -5 l-5 3z" fill={C.blush} />
      <path d="M42 49 q2 -2 4 0 M50 49 q2 -2 4 0" {...ink} strokeWidth="1.6" fill="none" />
      <circle cx="48" cy="52" r="1.2" fill={C.clay} />
      <path d="M45 55 q3 2 6 0" {...ink} fill="none" />
      <path d="M38 61 q10 -5 20 0 l-1 3 q-9 -4 -18 0z" fill={C.clay} {...ink} />
      <circle cx="48" cy="63" r="2.4" fill={C.gold} {...ink} />
      <path d="M42 70 h12" stroke={C.gold} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Round walnut wall clock, 7:10 — the quiet dinner hour. */
function WallClock() {
  return (
    <svg viewBox="0 0 60 60" className="clock-svg">
      <ellipse cx="33" cy="33" rx="26" ry="26" fill={INK} opacity=".14" />
      <circle cx="30" cy="30" r="27" fill={C.walnut} {...ink} />
      <path d="M30 3 a27 27 0 0 1 0 54 a22 22 0 0 0 0 -54z" fill={C.walnutD} />
      <circle cx="30" cy="30" r="21" fill={C.cream} {...ink} />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const a = (i / 12) * Math.PI * 2;
        const r0 = i % 3 ? 18.5 : 16.5;
        return (
          <path
            key={i}
            d={`M${30 + Math.sin(a) * r0} ${30 - Math.cos(a) * r0} L${30 + Math.sin(a) * 20} ${30 - Math.cos(a) * 20}`}
            stroke={INK}
            strokeWidth={i % 3 ? 1 : 1.8}
            strokeOpacity=".8"
          />
        );
      })}
      <path d="M30 30 L21 37" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M30 30 L40 20" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M30 30 L30 13" stroke={C.clay} strokeWidth="1" strokeLinecap="round" />
      <circle cx="30" cy="30" r="1.8" fill={C.clay} {...ink} />
      <path d="M14 20 q4 -8 12 -10" stroke={HI} strokeOpacity=".7" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

/** Hanging paper menu strips (tanzaku) on a rail: the day's noodles + kanji marks. */
function Tanzaku({ menu }: { menu: string }) {
  const words = menu
    .split('•')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const strips: { text: string[]; kanji?: string; red?: boolean }[] = [
    { text: [], kanji: '麺' },
    ...words.map((w) => ({ text: w.toUpperCase().split('').slice(0, 6) })),
    { text: [], kanji: '湯', red: true },
    { text: [], kanji: '味' },
  ];
  const n = strips.length;
  return (
    <svg viewBox={`0 0 ${n * 22 + 6} 60`} preserveAspectRatio="xMidYMin meet" className="tz-svg">
      <rect x="0" y="0" width={n * 22 + 6} height="4" rx="1.5" fill={C.walnutD} {...ink} />
      {strips.map((s, i) => {
        const x = 4 + i * 22;
        const h = 36 + (i % 2) * 8 + (s.kanji ? 0 : 6);
        return (
          <g key={i}>
            <path d={`M${x + 9} 4 v3`} {...ink} />
            <rect x={x} y="7" width="18" height={h} fill={s.red ? C.clay : C.cream} {...ink} />
            <rect x={x} y="7" width="18" height="4" fill={s.red ? C.clayD : C.clay} />
            {s.kanji ? (
              <text
                x={x + 9}
                y={7 + h / 2 + 5}
                textAnchor="middle"
                fontSize="12"
                fontFamily="serif"
                fontWeight="700"
                fill={s.red ? HI : INK}>
                {s.kanji}
              </text>
            ) : (
              <text
                x={x + 9}
                y="20"
                textAnchor="middle"
                fontSize="6.2"
                fontWeight="800"
                fill={INK}
                className="tz-word">
                {s.text.map((ch, k) => (
                  <tspan key={k} x={x + 9} dy={k ? 6.6 : 0}>
                    {ch}
                  </tspan>
                ))}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** Kitchen pass: framed opening with a noren, tiles, the copper stock pot steaming, a ledge. */
function PassWindow({ menu }: { menu: string }) {
  return (
    <div className="rest-pass">
      <div className="rp-strips">
        <Tanzaku menu={menu} />
      </div>
      <div className="rp-open">
        <svg viewBox="0 0 160 120" preserveAspectRatio="xMidYMax meet" className="rp-kitchen">
          {/* back shelf with bowls */}
          <rect x="0" y="40" width="160" height="5" fill={C.oakL} {...ink} />
          {[18, 48, 78].map((x) => (
            <g key={x}>
              <path d={`M${x} 40 q-1 -9 12 -9 q13 0 12 9z`} fill={C.cream} {...ink} />
              <path d={`M${x + 2} 34 q10 -2 20 0`} stroke={C.clay} strokeWidth="1.6" fill="none" />
            </g>
          ))}
          <path d="M112 40 v-16 q0 -3 3 -3 h10 q3 0 3 3 v16z" fill={C.indigo} {...ink} />
          <path d="M134 40 v-12 q0 -3 3 -3 h10 q3 0 3 3 v12z" fill={C.celadon} {...ink} />
          {/* ladle on a hook */}
          <path
            d="M22 54 v22 q0 7 7 7 q7 0 7 -7"
            stroke={C.copper}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M22 54 v22 q0 7 7 7 q7 0 7 -7" {...ink} fill="none" />
          {/* pot */}
          <g className="rp-steam">
            <Cloud x={84} y={52} s={0.8} />
            <Cloud x={112} y={44} s={0.62} />
          </g>
          <path d="M50 70 h88 v36 q0 6 -44 6 t-44 -6z" fill={C.copper} {...ink} />
          <path d="M110 72 v38 q28 -2 28 -6 V70z" fill={C.copperD} />
          <path d="M50 70 h88 v36 q0 6 -44 6 t-44 -6z" fill="none" {...ink} />
          <path d="M42 80 h8 M138 80 h8" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path
            d="M42 80 h8 M138 80 h8"
            stroke={C.copperD}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <ellipse cx="94" cy="70" rx="46" ry="7" fill="#ece6d6" {...ink} />
          <ellipse cx="94" cy="70" rx="46" ry="7" fill="none" stroke={C.copper} strokeWidth="2.6" />
          <path
            d="M58 82 v18"
            stroke={HI}
            strokeOpacity=".6"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M60 68 q20 -4 40 -2"
            stroke={HI}
            strokeOpacity=".7"
            strokeWidth="1.8"
            fill="none"
          />
        </svg>
        <div className="rp-light" />
      </div>
      <svg viewBox="0 0 160 70" preserveAspectRatio="none" className="rp-noren">
        <rect x="0" y="0" width="160" height="6" rx="2" fill={C.walnutD} {...ink} />
        <path d="M4 6 h74 v52 q-18 7 -37 2 t-37 -2z" fill={C.indigo} {...ink} />
        <path d="M82 6 h74 v52 q-18 7 -37 2 t-37 -2z" fill={C.indigo} {...ink} />
        <path d="M4 6 h16 v56 q-8 2 -16 0z M82 6 h16 v56 q-8 2 -16 0z" fill={C.indigoD} />
        <circle cx="41" cy="34" r="12" fill="none" stroke={C.cream} strokeWidth="2.6" />
        <circle cx="119" cy="34" r="12" fill="none" stroke={C.cream} strokeWidth="2.6" />
        <text
          x="41"
          y="39"
          textAnchor="middle"
          fontSize="13"
          fontFamily="serif"
          fontWeight="700"
          fill={C.cream}>
          麺
        </text>
        <circle cx="119" cy="34" r="4.5" fill={C.clay} />
      </svg>
      <div className="rp-frame" />
      <div className="rp-ledge">
        <svg viewBox="0 0 24 24" className="rp-bell">
          <path d="M4 16 q0 -10 8 -10 q8 0 8 10z" fill={C.gold} {...ink} />
          <path d="M14 7 q6 2 6 9 h-3 q0 -6 -3 -9z" fill={C.goldD} />
          <rect x="2" y="16" width="20" height="3" rx="1.5" fill={C.walnutD} {...ink} />
          <circle cx="12" cy="5" r="2" fill={C.gold} {...ink} />
        </svg>
      </div>
    </div>
  );
}

/** Three wooden stools at the pass counter. */
function Stools() {
  return (
    <svg viewBox="0 0 200 70" preserveAspectRatio="xMidYMax meet" className="rest-stools">
      {[30, 100, 170].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="67" rx="24" ry="3" fill={INK} opacity=".14" />
          <path
            d={`M${x - 15} 22 l-4 44 M${x + 15} 22 l4 44`}
            stroke={C.walnutD}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d={`M${x - 15} 22 l-4 44 M${x + 15} 22 l4 44`} {...ink} fill="none" />
          <path d={`M${x - 16} 46 h32`} stroke={C.walnutD} strokeWidth="3" />
          <path d={`M${x - 16} 46 h32`} {...ink} />
          <rect x={x - 22} y="12" width="44" height="12" rx="5" fill={C.clay} {...ink} />
          <path d={`M${x + 8} 12 h10 q4 0 4 6 q0 6 -4 6 h-10z`} fill={C.clayD} />
          <path
            d={`M${x - 16} 16 h14`}
            stroke={HI}
            strokeOpacity=".5"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>
      ))}
    </svg>
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

/* flat light wedges under the lantern row (no blur) */
function LightCones() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="rest-light">
      <polygon points="38,22 21,100 55,100" fill="#ffd9a0" />
      <polygon points="61,22 44,100 78,100" fill="#ffd9a0" />
      <polygon points="86,36 70,100 102,100" fill="#ffd9a0" />
    </svg>
  );
}

/* ---------- tables ---------- */

function Table({ look, className, steam }: { look: Look; className?: string; steam?: boolean }) {
  return (
    <div className={`rest-table ${className ?? ''}`}>
      <svg viewBox="0 0 200 60" className="rt-chair">
        <rect x="56" y="6" width="88" height="54" rx="10" fill={C.walnut} {...ink} />
        <path d="M124 6 h10 q10 0 10 10 v44 h-20z" fill={C.walnutD} />
        <rect
          x="64"
          y="14"
          width="72"
          height="34"
          rx="6"
          fill={C.indigo}
          {...ink}
          strokeOpacity=".5"
        />
        <path d="M70 20 q2 -3 6 -3" stroke={HI} strokeOpacity=".5" strokeWidth="1.6" fill="none" />
      </svg>
      <div className="rt-guest">
        <Avatar look={look} mood="happy" size={90} eating />
      </div>
      <svg viewBox="0 0 200 124" className="rt-table">
        <ellipse cx="100" cy="116" rx="76" ry="6" fill={INK} opacity=".14" />
        {/* side stool (right) */}
        <rect x="160" y="44" width="30" height="12" rx="5" fill={C.clay} {...ink} />
        <path d="M180 44 h6 q4 0 4 6 q0 6 -4 6 h-6z" fill={C.clayD} />
        <path
          d="M166 56 l-3 50 M184 56 l3 50"
          stroke={C.walnutD}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path d="M166 56 l-3 50 M184 56 l3 50" {...ink} fill="none" />
        <path d="M165 84 h20" {...ink} strokeWidth="2" />
        {/* pedestal */}
        <rect x="92" y="80" width="16" height="30" fill={C.walnut} {...ink} />
        <path d="M100 80 h8 v30 h-8z" fill={C.walnutD} />
        <ellipse cx="100" cy="110" rx="32" ry="6" fill={C.walnut} {...ink} />
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
          stroke={C.walnut}
          strokeWidth="2"
          strokeLinecap="round"
        />
        {steam && (
          <g className="rt-steam">
            <Cloud x={76} y={44} s={0.42} />
          </g>
        )}
        {/* tokkuri + cup */}
        <path
          d="M138 70 q-6 -8 -3 -18 q1 -5 6 -6 h4 q5 1 6 6 q3 10 -3 18z"
          fill={C.celadon}
          {...ink}
        />
        <path d="M146 70 q5 -8 2 -18 q-1 -5 -4 -6 h2 q5 1 6 6 q3 10 -3 18z" fill={C.celadonD} />
        <rect x="140" y="43" width="6" height="4" rx="1.5" fill={C.celadonD} {...ink} />
        <path d="M118 72 q0 6 6 6 q6 0 6 -6z" fill={C.cream} {...ink} />
        <ellipse cx="124" cy="72" rx="6" ry="2.2" fill={C.matchaL} {...ink} strokeOpacity=".4" />
        {/* small lantern-lit menu card */}
        <path d="M30 66 l8 -12 h14 l-8 12z" fill={C.cream} {...ink} />
        <path d="M36 60 l6 0 M34 63 l6 0" stroke={C.clay} strokeWidth="1" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ---------- ikebana at the counter's right end (rendered by Restaurant) ---------- */

export function CounterFlowers() {
  return (
    <svg viewBox="0 0 110 130" className="rest-counter counter-flowers" aria-hidden="true">
      <ellipse cx="55" cy="126" rx="30" ry="3.5" fill={INK} opacity=".18" />
      {/* branches */}
      <path
        d="M55 92 q-10 -30 -34 -46 M55 92 q6 -38 24 -60 M55 92 q14 -22 42 -30"
        stroke={C.walnut}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M55 92 q-10 -30 -34 -46 M55 92 q6 -38 24 -60 M55 92 q14 -22 42 -30"
        {...ink}
        fill="none"
      />
      <path
        d="M55 92 q-2 -34 4 -62"
        stroke={C.matchaD}
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M55 92 q-2 -34 4 -62" {...ink} fill="none" />
      {/* leaves */}
      <path
        d="M58 48 q12 -10 10 -26 q-10 10 -10 26z M48 70 q-14 -4 -16 -20 q12 4 16 20z M66 70 q14 -8 26 -4 q-12 8 -26 4z"
        fill={C.matcha}
        {...ink}
      />
      <path d="M60 46 q6 -10 7 -20" {...line} strokeOpacity=".5" />
      {/* blossoms */}
      {[
        [21, 46, C.blush],
        [79, 32, C.gold],
        [97, 62, C.blush],
        [59, 30, '#fbf7f0'],
        [34, 60, '#fbf7f0'],
      ].map(([x, y, c], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <ellipse
              key={a}
              cx="0"
              cy="-5.5"
              rx="3.4"
              ry="5.5"
              fill={String(c)}
              {...ink}
              strokeOpacity=".55"
              transform={`rotate(${a})`}
            />
          ))}
          <circle r="2.2" fill={C.persimmon} />
        </g>
      ))}
      {/* vase */}
      <path d="M36 88 h38 q4 0 3 4 l-4 30 h-36 l-4 -30 q-1 -4 3 -4z" fill={C.indigo} {...ink} />
      <path d="M60 88 h14 q4 0 3 4 l-4 30 h-12z" fill={C.indigoD} />
      <path d="M34 98 h42" stroke={C.cream} strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M40 104 q0 8 3 14"
        stroke={HI}
        strokeOpacity=".6"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
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
      {/* ---- wall ---- */}
      <div className={`rest-wall ${decor.wall}`}>
        <div className="rest-wainscot" />
        <div className="rest-dado" />
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
        <div className="rest-tansu">
          <Tansu />
          {cat && <div className="rest-cat">{cat}</div>}
        </div>
        <div className="rest-shrine">
          <Kamidana />
        </div>
        <div className="rest-clock">
          <WallClock />
        </div>
        <div className="rest-bigart">
          {decor.bigart !== 'bigart_none' && (
            <div className="art-frame">
              <BigArt kind={decor.bigart} />
            </div>
          )}
        </div>
        <div className="rest-smallart">
          <SmallArt kind={decor.smallart} />
        </div>
        <PassWindow menu={menu} />
      </div>
      {/* ---- floor ---- */}
      <div className={`rest-floor ${decor.floor}`}>
        <Floor kind={decor.floor} />
      </div>
      <div className="rest-baseboard" />
      <div className="rest-sun" />
      <Stools />
      {n >= 4 && (
        <>
          <Table look={looks[2]} className="far l" />
          <Table look={looks[3]} className="far r" />
        </>
      )}
      <Special kind={decor.special} />
      {n >= 2 && (
        <>
          <Table look={looks[0]} className="near l" steam />
          <Table look={looks[1]} className="near r" steam />
        </>
      )}
      <Plant kind={decor.plants} />
      <div className="rest-shade" />
      <LightCones />
      <Lamps kind={decor.lamps} />
      {/* ---- counter layer (over Play's counter) ---- */}
      <CounterDecor kind={decor.counter} />
      <CounterFlowers />
      <div className="rest-vignette" />
    </div>
  );
}
