import { useId } from 'react';
import { INGREDIENTS } from './data';

// ---------- color helpers ----------
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  r = f(r);
  g = f(g);
  b = f(b);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// ---------- Ingredient shapes (64x64 box, centered at 32,32) ----------

function NoodleBundle({ color, thick }: { color: string; thick: number }) {
  const dark = shade(color, -0.35);
  const paths = Array.from({ length: 6 }, (_, i) => {
    const x = 13 + i * 7.5;
    return `M${x} 8 q 5 5 0 10 q -5 5 0 10 q 5 5 0 10 q -5 5 0 10 q 5 5 0 10`;
  });
  return (
    <g>
      {paths.map((d, i) => (
        <path
          key={'o' + i}
          d={d}
          stroke={dark}
          strokeWidth={thick + 2.2}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      {paths.map((d, i) => (
        <path
          key={'i' + i}
          d={d}
          stroke={color}
          strokeWidth={thick}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <rect
        x="9"
        y="28"
        width="46"
        height="9"
        rx="3"
        fill="#e94f37"
        stroke="#8c2416"
        strokeWidth="1.5"
      />
      <rect x="27" y="28" width="10" height="9" fill="#ffd166" />
    </g>
  );
}

function BrothPot({ color }: { color: string }) {
  return (
    <g>
      <path
        d="M18 14 q-2 -6 2 -10 M32 13 q-3 -6 1 -11 M46 14 q-2 -6 2 -10"
        stroke="#fff"
        strokeOpacity=".55"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        className="steam-mini"
      />
      <rect x="4" y="26" width="8" height="6" rx="3" fill="#5b6270" />
      <rect x="52" y="26" width="8" height="6" rx="3" fill="#5b6270" />
      <path
        d="M10 22 h44 v24 q0 12 -12 12 h-20 q-12 0 -12 -12z"
        fill="#8d97a8"
        stroke="#4a5160"
        strokeWidth="2"
      />
      <path
        d="M14 30 v14 q0 8 8 8"
        stroke="#c9d1dc"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="32" cy="22" rx="22" ry="6" fill={color} stroke="#4a5160" strokeWidth="2" />
      <ellipse cx="25" cy="21" rx="7" ry="1.8" fill="#fff" opacity=".35" />
    </g>
  );
}

function GreenOnion({ scale = 1 }: { scale?: number }) {
  const pts: [number, number][] = [
    [20, 22],
    [36, 18],
    [46, 30],
    [28, 34],
    [16, 40],
    [40, 44],
    [26, 48],
  ];
  return (
    <g>
      {pts.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${scale})`}>
          <circle r="6" fill="#b7e3a1" stroke="#3f9a3f" strokeWidth="2.6" />
          <circle r="2" fill="#e7f7dc" />
        </g>
      ))}
    </g>
  );
}

function Egg() {
  return (
    <g>
      <ellipse cx="32" cy="33" rx="24" ry="19" fill="#c98642" />
      <ellipse cx="32" cy="33" rx="21" ry="16.5" fill="#fff8ec" />
      <ellipse cx="33" cy="34" rx="12" ry="10" fill="#f5a300" />
      <ellipse cx="33" cy="35" rx="8" ry="6.5" fill="#ffc94a" />
      <ellipse cx="29" cy="31" rx="3" ry="2" fill="#fff" opacity=".7" />
    </g>
  );
}

function Chashu() {
  return (
    <g>
      <circle cx="32" cy="32" r="24" fill="#7a3a20" />
      <circle cx="32" cy="32" r="20.5" fill="#d9907a" />
      <path
        d="M32 14 a18 18 0 1 1 -17 12 a12 12 0 1 0 17 -3 a6 6 0 1 1 -5 7"
        fill="none"
        stroke="#f6d6c6"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M14 22 q6 -8 14 -9"
        stroke="#fff"
        strokeOpacity=".4"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function Nori() {
  return (
    <g transform="rotate(-12 32 32)">
      <rect
        x="16"
        y="6"
        width="32"
        height="50"
        rx="2"
        fill="#1b3326"
        stroke="#0e1f16"
        strokeWidth="2"
      />
      {[14, 22, 30, 38, 46].map((y) => (
        <path key={y} d={`M18 ${y} q14 3 28 0`} stroke="#2f5a42" strokeWidth="1.5" fill="none" />
      ))}
      <rect x="18" y="8" width="6" height="46" fill="#ffffff" opacity=".07" />
    </g>
  );
}

function Corn() {
  const k: [number, number][] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++) k.push([14 + c * 10 + (r % 2) * 4, 14 + r * 10]);
  return (
    <g>
      {k.map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 4.5} y={y - 4} width="9" height="8.5" rx="3.5" fill="#f5b700" />
          <rect x={x - 3.5} y={y - 3.5} width="6" height="5" rx="2.5" fill="#ffe066" />
        </g>
      ))}
    </g>
  );
}

function Mushroom() {
  return (
    <g>
      <rect
        x="27"
        y="34"
        width="10"
        height="18"
        rx="4"
        fill="#efe0c8"
        stroke="#b9a07e"
        strokeWidth="1.5"
      />
      <ellipse cx="32" cy="32" rx="24" ry="17" fill="#6b4226" stroke="#3e2414" strokeWidth="2" />
      <path
        d="M32 18 v28 M19 26 l26 12 M45 26 l-26 12"
        stroke="#e8cfa6"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <ellipse cx="24" cy="24" rx="6" ry="2.5" fill="#fff" opacity=".2" />
    </g>
  );
}

function ChiliOil() {
  return (
    <g>
      <path
        d="M32 6 C 44 24 50 32 50 40 a18 18 0 0 1 -36 0 C 14 32 20 24 32 6z"
        fill="#d62e17"
        stroke="#8a1508"
        strokeWidth="2"
      />
      <circle cx="26" cy="38" r="3" fill="#7a1006" />
      <circle cx="36" cy="44" r="2.4" fill="#7a1006" />
      <circle cx="38" cy="34" r="1.8" fill="#ffcc80" />
      <path
        d="M24 26 q-4 8 -2 14"
        stroke="#fff"
        strokeOpacity=".5"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

function Tofu() {
  const cube = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0 6 l10 -6 l10 6 l-10 6z" fill="#ffe7a6" />
      <path d="M0 6 v12 l10 6 v-12z" fill="#e2a64b" />
      <path d="M20 6 v12 l-10 6 v-12z" fill="#c9862f" />
    </g>
  );
  return (
    <g>
      {cube(8, 26)}
      {cube(34, 26)}
      {cube(21, 10)}
    </g>
  );
}

function Shrimp() {
  return (
    <g>
      <path d="M48 44 l10 -4 l-2 10 z M48 44 l8 8 l-10 2z" fill="#e2401f" />
      <path
        d="M48 46 C 46 26 32 14 16 22 C 8 26 10 36 18 36"
        fill="none"
        stroke="#c46a2a"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path
        d="M48 46 C 46 26 32 14 16 22 C 8 26 10 36 18 36"
        fill="none"
        stroke="#f3b24f"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {[
        [22, 20],
        [32, 18],
        [40, 24],
        [44, 32],
        [46, 40],
        [14, 30],
        [17, 24],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.2" fill="#ffd27a" />
      ))}
    </g>
  );
}

function Naruto() {
  const scallop = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `${32 + Math.cos(a) * 22},${32 + Math.sin(a) * 22}`;
  }).join(' ');
  return (
    <g>
      <polygon
        points={scallop}
        fill="#fff"
        stroke="#e7d6da"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M32 32 m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -9 -1 a9 9 0 1 1 15 7 a13 13 0 1 1 -21 -12"
        fill="none"
        stroke="#ff5d8f"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
    </g>
  );
}

function Bamboo() {
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`rotate(${-20 + i * 12} 32 32) translate(${8 + i * 11} 10)`}>
          <rect width="9" height="40" rx="3" fill="#d7b46a" stroke="#9c7a35" strokeWidth="1.5" />
          <path d="M2 10 h5 M2 22 h5 M2 32 h5" stroke="#9c7a35" strokeWidth="1.2" />
        </g>
      ))}
    </g>
  );
}

function Sesame() {
  const pts: [number, number, number, boolean][] = [];
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 5; c++) {
      const i = r * 5 + c;
      const jx = ((i * 37) % 7) - 3;
      const jy = ((i * 53) % 7) - 3;
      if ((r === 0 || r === 4) && (c === 0 || c === 4)) continue;
      pts.push([12 + c * 10 + jx, 12 + r * 10 + jy, (i * 67) % 180, i % 6 === 0]);
    }
  return (
    <g>
      {pts.map(([x, y, rot, black], i) => (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="3.4"
          ry="1.8"
          transform={`rotate(${rot} ${x} ${y})`}
          fill={black ? '#2b2420' : '#f8edd2'}
          stroke={black ? '#000' : '#c8b48a'}
          strokeWidth=".8"
        />
      ))}
    </g>
  );
}

function PakChoi() {
  return (
    <g>
      <path
        d="M32 58 C 18 50 8 30 18 12 C 26 4 38 4 46 12 C 56 30 46 50 32 58z"
        fill="#3f9a3f"
        stroke="#2a6b2a"
        strokeWidth="2"
      />
      <path
        d="M32 58 C 26 44 26 26 32 10 C 38 26 38 44 32 58z"
        fill="#e9f5d8"
        stroke="#b9d9a0"
        strokeWidth="1.5"
      />
      <path
        d="M32 50 L20 30 M32 40 L44 24 M32 30 L22 18"
        stroke="#6cc46c"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}

function Sprouts() {
  return (
    <g>
      {[
        [10, 40, 30, 14],
        [16, 50, 44, 20],
        [24, 54, 50, 34],
        [12, 26, 40, 42],
        [30, 12, 52, 48],
      ].map(([x1, y1, x2, y2], i) => (
        <g key={i}>
          <path
            d={`M${x1} ${y1} Q ${(x1 + x2) / 2 + 6} ${(y1 + y2) / 2 - 8} ${x2} ${y2}`}
            stroke="#d8d2b0"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={`M${x1} ${y1} Q ${(x1 + x2) / 2 + 6} ${(y1 + y2) / 2 - 8} ${x2} ${y2}`}
            stroke="#fbf8ea"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse cx={x2} cy={y2} rx="4" ry="3" fill="#e8d35a" />
        </g>
      ))}
    </g>
  );
}

function ChiliSlices() {
  return (
    <g>
      {[
        [20, 22],
        [42, 20],
        [30, 40],
        [48, 42],
        [16, 44],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <circle r="8" fill="#b51d1d" />
          <circle r="5.2" fill="#f4e7c9" />
          <circle cx="-1.5" cy="-1" r="1.2" fill="#e8c76a" />
          <circle cx="1.8" cy="1.2" r="1.2" fill="#e8c76a" />
        </g>
      ))}
    </g>
  );
}

function Kimchi() {
  return (
    <g>
      <path
        d="M10 30 Q14 12 32 14 Q50 10 54 28 Q58 44 42 50 Q26 58 14 46 Q6 40 10 30z"
        fill="#e2552a"
        stroke="#a8341a"
        strokeWidth="2"
      />
      <path
        d="M18 24 Q30 30 46 22 M16 36 Q30 42 50 34 M22 46 Q32 48 40 44"
        stroke="#ffb38a"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="26" cy="30" r="1.6" fill="#7a1f0e" />
      <circle cx="40" cy="38" r="1.6" fill="#7a1f0e" />
    </g>
  );
}

function Lime() {
  return (
    <g>
      <path d="M8 36 A 24 24 0 0 1 56 36 Z" fill="#5c9e2e" />
      <path d="M12 36 A 20 20 0 0 1 52 36 Z" fill="#d8f0a0" />
      <path
        d="M32 36 L16 26 M32 36 L24 18 M32 36 L32 16 M32 36 L40 18 M32 36 L48 26"
        stroke="#f4ffd8"
        strokeWidth="2"
      />
      <path d="M8 36 h48" stroke="#4a8424" strokeWidth="3" />
    </g>
  );
}

function CrispyShallot() {
  const bits: [number, number, number][] = [
    [18, 20, 10],
    [32, 16, 60],
    [46, 22, 120],
    [22, 34, 200],
    [38, 32, 30],
    [50, 38, 150],
    [26, 48, 80],
    [42, 48, 250],
    [14, 42, 300],
  ];
  return (
    <g>
      {bits.map(([x, y, r], i) => (
        <path
          key={i}
          d="M-6 0 q3 -6 6 0 q3 6 6 0"
          transform={`translate(${x} ${y}) rotate(${r})`}
          stroke={i % 2 ? '#a55f1f' : '#c98a3c'}
          strokeWidth="3.6"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}

export function IngredientShape({ id }: { id: string }) {
  const ing = INGREDIENTS[id];
  switch (id) {
    case 'ramen':
      return <NoodleBundle color={ing.color} thick={3} />;
    case 'udon':
      return <NoodleBundle color={ing.color} thick={5.2} />;
    case 'soba':
      return <NoodleBundle color={ing.color} thick={2.8} />;
    case 'pirinc':
      return <NoodleBundle color={ing.color} thick={2} />;
    case 'shoyu':
    case 'miso':
    case 'acili':
    case 'tonkotsu':
      return <BrothPot color={ing.color} />;
    case 'yesil':
      return <GreenOnion />;
    case 'yumurta':
      return <Egg />;
    case 'chashu':
      return <Chashu />;
    case 'nori':
      return <Nori />;
    case 'misir':
      return <Corn />;
    case 'mantar':
      return <Mushroom />;
    case 'aciyag':
      return <ChiliOil />;
    case 'tofu':
      return <Tofu />;
    case 'karides':
      return <Shrimp />;
    case 'naruto':
      return <Naruto />;
    case 'bambu':
      return <Bamboo />;
    case 'susam':
      return <Sesame />;
    case 'pakchoi':
      return <PakChoi />;
    case 'filiz':
      return <Sprouts />;
    case 'biber':
      return <ChiliSlices />;
    case 'kimchi':
      return <Kimchi />;
    case 'lime':
      return <Lime />;
    case 'citir':
      return <CrispyShallot />;
    default:
      return <circle cx="32" cy="32" r="20" fill="#ccc" />;
  }
}

export function IngredientIcon({ id, size = 44 }: { id: string; size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <IngredientShape id={id} />
    </svg>
  );
}

// ---------- Bowl ----------

const SLOTS: [number, number, number][] = [
  [76, 54, -10],
  [162, 52, 14],
  [120, 74, 4],
  [58, 70, -18],
  [184, 70, 20],
  [104, 44, 0],
  [142, 44, -6],
];

const SCATTER = new Set(['yesil', 'susam', 'aciyag']);

export interface BowlContent {
  noodle?: string;
  broth?: string;
  toppings: string[];
  quality?: 'perfect' | 'under' | 'over';
}

export function BowlArt({
  bowl,
  width = 220,
  steam = true,
  color = '#e94f37',
  takeaway = false,
}: {
  bowl: BowlContent;
  width?: number;
  steam?: boolean;
  color?: string;
  takeaway?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const broth = bowl.broth ? INGREDIENTS[bowl.broth] : null;
  const noodle = bowl.noodle ? INGREDIENTS[bowl.noodle] : null;
  const solid = bowl.toppings.filter((t) => !SCATTER.has(t));
  const scatter = bowl.toppings.filter((t) => SCATTER.has(t));
  const thick = bowl.noodle === 'udon' ? 6 : bowl.noodle === 'pirinc' ? 2.4 : 3.6;
  const noodleColor = noodle
    ? bowl.quality === 'over'
      ? shade(noodle.color, -0.25)
      : bowl.quality === 'under'
        ? shade(noodle.color, 0.25)
        : noodle.color
    : '#000';
  const bodyA = takeaway ? '#f4efe6' : color;
  const bodyB = takeaway ? '#cfc6b6' : shade(color, -0.45);
  return (
    <svg
      viewBox="0 0 240 170"
      width={width}
      height={(width * 170) / 240}
      className="bowl-svg"
      aria-hidden="true">
      <defs>
        <linearGradient id={`b${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={bodyA} />
          <stop offset="1" stopColor={bodyB} />
        </linearGradient>
        <radialGradient id={`br${uid}`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor={broth ? shade(broth.color, 0.35) : '#fff'} />
          <stop offset="0.6" stopColor={broth ? broth.color : '#f3ebe0'} />
          <stop offset="1" stopColor={broth ? shade(broth.color, -0.3) : '#d8cdbd'} />
        </radialGradient>
        <clipPath id={`c${uid}`}>
          <ellipse cx="120" cy="62" rx="97" ry="27" />
        </clipPath>
      </defs>
      <ellipse cx="120" cy="160" rx="88" ry="8" fill="#000" opacity=".25" />
      <ellipse cx="120" cy="150" rx="44" ry="8" fill={bodyB} />
      <path d="M14 62 Q18 150 120 152 Q222 150 226 62 Z" fill={`url(#b${uid})`} />
      {!takeaway && (
        <path
          d="M30 96 q15 -10 30 0 t30 0 t30 0 t30 0 t30 0 t30 0"
          stroke="#fff"
          strokeOpacity=".75"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {takeaway && (
        <g>
          <rect x="88" y="96" width="64" height="26" rx="6" fill="#e94f37" />
          <text
            x="120"
            y="114"
            textAnchor="middle"
            fontSize="15"
            fontWeight="800"
            fill="#fff"
            fontFamily="Baloo 2, sans-serif">
            Noddles
          </text>
        </g>
      )}
      <path
        d="M26 74 Q34 128 84 140"
        stroke="#fff"
        strokeOpacity=".25"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="120" cy="62" rx="106" ry="31" fill={takeaway ? '#e6ddcc' : '#f7f1e8'} />
      <ellipse cx="120" cy="63" rx="98" ry="27.5" fill={`url(#br${uid})`} />
      <g clipPath={`url(#c${uid})`}>
        {broth && (
          <g opacity=".55">
            <ellipse cx="78" cy="55" rx="5" ry="2" fill="#fff" opacity=".45" />
            <ellipse cx="150" cy="70" rx="3.5" ry="1.4" fill="#fff" opacity=".4" />
            <ellipse cx="170" cy="56" rx="4" ry="1.6" fill="#ffd27a" opacity=".6" />
            <ellipse cx="96" cy="78" rx="3" ry="1.2" fill="#ffd27a" opacity=".6" />
          </g>
        )}
        {noodle && (
          <g>
            {Array.from({ length: 9 }, (_, i) => {
              const y = 48 + i * 4.2;
              const d = `M30 ${y} q 12 -7 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0 t 24 0`;
              return (
                <g key={i}>
                  <path
                    d={d}
                    stroke={shade(noodleColor, -0.3)}
                    strokeWidth={thick + 1.6}
                    fill="none"
                    strokeLinecap="round"
                  />
                  <path
                    d={d}
                    stroke={noodleColor}
                    strokeWidth={thick}
                    fill="none"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
            {broth && (
              <ellipse cx="120" cy="63" rx="98" ry="27.5" fill={broth.color} opacity=".22" />
            )}
          </g>
        )}
        {scatter.includes('aciyag') && (
          <g>
            {[
              [70, 60, 8],
              [150, 64, 10],
              [112, 52, 6],
              [180, 58, 6],
              [92, 72, 7],
              [136, 78, 5],
            ].map(([x, y, r], i) => (
              <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.45} fill="#d62e17" opacity=".85" />
            ))}
          </g>
        )}
      </g>
      {solid.map((t, i) => {
        const [x, y, rot] = SLOTS[i % SLOTS.length];
        return (
          <g
            key={t}
            transform={`translate(${x} ${y}) rotate(${rot}) scale(0.92 0.72) translate(-32 -32)`}
            className="topping-drop">
            <IngredientShape id={t} />
          </g>
        );
      })}
      {scatter.includes('yesil') &&
        [
          [96, 58],
          [132, 64],
          [150, 46],
          [86, 70],
          [116, 50],
          [170, 62],
          [70, 62],
          [124, 80],
          [100, 80],
        ].map(([x, y], i) => (
          <g
            key={'y' + i}
            transform={`translate(${x} ${y}) scale(.7 .55)`}
            className="topping-drop">
            <circle r="6" fill="#b7e3a1" stroke="#3f9a3f" strokeWidth="2.6" />
            <circle r="2" fill="#e7f7dc" />
          </g>
        ))}
      {scatter.includes('susam') &&
        Array.from({ length: 26 }, (_, i) => {
          const a = i * 2.39;
          const r = 10 + (i % 9) * 9;
          const x = 120 + Math.cos(a) * r;
          const y = 63 + Math.sin(a) * r * 0.27;
          return (
            <ellipse
              key={'s' + i}
              cx={x}
              cy={y}
              rx="2.6"
              ry="1.2"
              transform={`rotate(${(i * 47) % 180} ${x} ${y})`}
              fill={i % 5 === 0 ? '#2b2420' : '#f8edd2'}
              className="topping-drop"
            />
          );
        })}
      {steam && broth && (
        <g
          className="steam"
          stroke="#fff"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          opacity=".5">
          <path d="M90 34 q-8 -12 0 -22 q8 -10 0 -22" />
          <path d="M122 30 q-8 -12 0 -22 q8 -10 0 -22" />
          <path d="M154 34 q-8 -12 0 -22 q8 -10 0 -22" />
        </g>
      )}
    </svg>
  );
}

// ---------- Pot ----------

export function PotArt({
  noodle,
  state,
}: {
  noodle?: string;
  state: 'empty' | 'cooking' | 'ready' | 'over';
}) {
  const ing = noodle ? INGREDIENTS[noodle] : null;
  const water = state === 'over' ? '#c9b48a' : '#bfe3f2';
  return (
    <svg viewBox="0 0 100 86" width="100%" aria-hidden="true">
      <ellipse cx="50" cy="80" rx="40" ry="5" fill="#000" opacity=".3" />
      <rect x="2" y="30" width="12" height="7" rx="3.5" fill="#333a46" />
      <rect x="86" y="30" width="12" height="7" rx="3.5" fill="#333a46" />
      <path
        d="M10 26 h80 v36 q0 16 -16 16 h-48 q-16 0 -16 -16z"
        fill="#9aa4b4"
        stroke="#4a5160"
        strokeWidth="2.5"
      />
      <path
        d="M16 36 v24 q0 10 10 10"
        stroke="#d4dbe5"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="50" cy="26" rx="40" ry="10" fill="#4a5160" />
      <ellipse cx="50" cy="27" rx="36" ry="8" fill={water} />
      {ing && (
        <g className={state === 'cooking' ? 'swirl' : ''} style={{ transformOrigin: '50px 27px' }}>
          {[-14, -6, 2, 10].map((dx, i) => (
            <path
              key={i}
              d={`M${30 + dx} 27 q 6 -5 12 0 t 12 0 t 12 0`}
              stroke={state === 'over' ? shade(ing.color, -0.3) : ing.color}
              strokeWidth={noodle === 'udon' ? 4.5 : 2.8}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </g>
      )}
      {state !== 'empty' && (
        <g className="bubbles" fill="#fff" opacity=".85">
          <circle cx="32" cy="26" r="2.2" />
          <circle cx="62" cy="24" r="1.8" />
          <circle cx="48" cy="30" r="1.6" />
          <circle cx="70" cy="29" r="2" />
        </g>
      )}
      {state !== 'empty' && (
        <g
          className="steam"
          stroke="#fff"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          opacity={state === 'over' ? 0.8 : 0.45}>
          <path d="M34 16 q-6 -8 0 -14" />
          <path d="M66 16 q-6 -8 0 -14" />
        </g>
      )}
    </svg>
  );
}

// ---------- Customers ----------

export type Mood = 'happy' | 'neutral' | 'worried' | 'angry' | 'love';

export interface Look {
  skin: string;
  hair: number;
  hairColor: string;
  shirt: string;
  acc: number;
  accColor: string;
  kid?: boolean;
  special?: 'hana' | 'baron' | 'lezzetova' | 'ruzgar' | 'sef';
}

const SKINS = ['#ffdbb5', '#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffe0c4', '#d9a273'];
const HAIRS = [
  '#2b1d14',
  '#5a3825',
  '#a0522d',
  '#e8c07d',
  '#111',
  '#8b2e16',
  '#c0c0c0',
  '#3d2b5a',
  '#d86a9a',
];
const SHIRTS = [
  '#3ba7ff',
  '#ff7aa2',
  '#2ec4b6',
  '#ffb347',
  '#8e7dff',
  '#5cb85c',
  '#ef476f',
  '#118ab2',
  '#f4d35e',
  '#6c757d',
];

export function randomLook(): Look {
  const p = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  return {
    skin: p(SKINS),
    hair: Math.floor(Math.random() * 7),
    hairColor: p(HAIRS),
    shirt: p(SHIRTS),
    acc: Math.floor(Math.random() * 8),
    accColor: p(SHIRTS),
    kid: Math.random() < 0.14,
  };
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'happy' || mood === 'love') {
    if (mood === 'love')
      return (
        <g fill="#ff3b6b">
          <path d="M42 54 c-4 -6 -10 0 0 7 c10 -7 4 -13 0 -7z" />
          <path d="M78 54 c-4 -6 -10 0 0 7 c10 -7 4 -13 0 -7z" />
        </g>
      );
    return (
      <g stroke="#2b1d14" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M36 57 q6 -7 12 0" />
        <path d="M72 57 q6 -7 12 0" />
      </g>
    );
  }
  return (
    <g>
      <ellipse cx="42" cy="56" rx="4" ry="5" fill="#2b1d14" />
      <ellipse cx="78" cy="56" rx="4" ry="5" fill="#2b1d14" />
      <circle cx="43.5" cy="54" r="1.4" fill="#fff" />
      <circle cx="79.5" cy="54" r="1.4" fill="#fff" />
      {mood === 'worried' && (
        <g stroke="#2b1d14" strokeWidth="2.6" strokeLinecap="round">
          <path d="M35 46 l12 -3" />
          <path d="M85 46 l-12 -3" />
        </g>
      )}
      {mood === 'angry' && (
        <g stroke="#2b1d14" strokeWidth="3.2" strokeLinecap="round">
          <path d="M34 44 l13 5" />
          <path d="M86 44 l-13 5" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'happy':
    case 'love':
      return (
        <path
          d="M48 70 q12 12 24 0 z"
          fill="#8a2c2c"
          stroke="#2b1d14"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      );
    case 'neutral':
      return (
        <path
          d="M52 72 q8 3 16 0"
          stroke="#2b1d14"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
      );
    case 'worried':
      return (
        <path
          d="M50 74 q5 -4 10 0 t10 0"
          stroke="#2b1d14"
          strokeWidth="2.6"
          fill="none"
          strokeLinecap="round"
        />
      );
    case 'angry':
      return (
        <path
          d="M50 76 q10 -9 20 0"
          stroke="#2b1d14"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      );
  }
}

function Hair({ style, color, back }: { style: number; color: string; back: boolean }) {
  if (back) {
    if (style === 1)
      return (
        <path
          d="M26 54 Q22 100 34 104 L86 104 Q98 100 94 54 Q94 20 60 20 Q26 20 26 54z"
          fill={color}
        />
      );
    if (style === 5)
      return <path d="M84 40 q22 10 14 44 q-4 10 -10 6 q6 -24 -8 -40z" fill={color} />;
    return null;
  }
  switch (style) {
    case 0:
      return (
        <path
          d="M28 54 Q26 20 60 20 Q94 20 92 54 Q88 36 70 34 Q58 40 40 36 Q30 42 28 54z"
          fill={color}
        />
      );
    case 1:
      return <path d="M28 56 Q26 20 60 20 Q94 20 92 56 Q86 34 60 32 Q38 32 28 56z" fill={color} />;
    case 2:
      return (
        <g fill={color}>
          <circle cx="60" cy="18" r="13" />
          <path d="M28 54 Q26 24 60 24 Q94 24 92 54 Q84 34 60 34 Q36 34 28 54z" />
        </g>
      );
    case 3:
      return (
        <g fill={color}>
          {[
            [34, 38],
            [44, 28],
            [58, 24],
            [72, 27],
            [84, 36],
            [90, 48],
            [30, 50],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="11" />
          ))}
        </g>
      );
    case 4:
      return (
        <path
          d="M31 46 Q34 24 60 24 Q86 24 89 46 Q78 34 60 34 Q42 34 31 46z"
          fill={color}
          opacity=".85"
        />
      );
    case 5:
      return <path d="M28 54 Q26 20 60 20 Q94 20 92 54 Q80 30 50 36 Q36 40 28 54z" fill={color} />;
    default:
      return (
        <path d="M30 50 Q30 22 60 22 Q90 22 90 50 L90 40 Q76 30 60 30 Q44 30 30 40z" fill={color} />
      );
  }
}

function Accessory({ acc, color }: { acc: number; color: string }) {
  switch (acc) {
    case 1:
      return (
        <g fill="none" stroke="#222" strokeWidth="2.6">
          <circle cx="42" cy="56" r="9" fill="#fff" fillOpacity=".15" />
          <circle cx="78" cy="56" r="9" fill="#fff" fillOpacity=".15" />
          <path d="M51 56 h18" />
        </g>
      );
    case 2:
      return (
        <g>
          <path d="M26 40 Q30 14 60 14 Q90 14 94 40 Q60 30 26 40z" fill={color} />
          <path d="M60 36 Q90 34 110 42 Q92 46 60 42z" fill={shade(color, -0.25)} />
        </g>
      );
    case 3:
      return (
        <g>
          <path d="M26 46 Q26 14 60 14 Q94 14 94 46 Q60 36 26 46z" fill={color} />
          <rect x="24" y="40" width="72" height="9" rx="4.5" fill={shade(color, -0.25)} />
          <circle cx="60" cy="12" r="6" fill={shade(color, 0.3)} />
        </g>
      );
    case 4:
      return (
        <g>
          <path d="M26 56 Q26 18 60 18 Q94 18 94 56" stroke="#333" strokeWidth="5" fill="none" />
          <rect x="18" y="48" width="13" height="20" rx="5" fill={color} />
          <rect x="89" y="48" width="13" height="20" rx="5" fill={color} />
        </g>
      );
    case 5:
      return (
        <g fill={color}>
          <path d="M70 22 l12 -8 l2 14z" />
          <path d="M94 22 l-12 -8 l-2 14z" />
          <circle cx="82" cy="21" r="4" fill={shade(color, -0.3)} />
        </g>
      );
    case 6:
      return (
        <g fill={color}>
          <circle cx="30" cy="70" r="3" />
          <circle cx="90" cy="70" r="3" />
        </g>
      );
    default:
      return null;
  }
}

export function CustomerArt({ look, mood, size = 96 }: { look: Look; mood: Mood; size?: number }) {
  const sp = look.special;
  const skin =
    sp === 'hana'
      ? '#f3cfae'
      : sp === 'baron'
        ? '#f0c8a8'
        : sp === 'lezzetova'
          ? '#f5d3b8'
          : sp === 'sef'
            ? '#e8b48a'
            : look.skin;
  const shirt =
    sp === 'hana'
      ? '#c0392b'
      : sp === 'baron'
        ? '#4a235a'
        : sp === 'lezzetova'
          ? '#1d1d2c'
          : sp === 'ruzgar'
            ? '#2ec4b6'
            : sp === 'sef'
              ? '#ffffff'
              : look.shirt;
  const k = look.kid && !sp ? 0.85 : 1;
  return (
    <svg
      viewBox="0 0 120 130"
      width={size}
      height={(size * 130) / 120}
      aria-hidden="true"
      className="cust-svg">
      <g transform={k !== 1 ? `translate(9 18) scale(${k})` : undefined}>
        {!sp && <Hair style={look.hair} color={look.hairColor} back />}
        {sp === 'hana' && (
          <path
            d="M26 56 Q24 30 60 26 Q96 30 94 56 Q100 76 88 84 L32 84 Q20 76 26 56z"
            fill="#cfcfd6"
          />
        )}
        {sp === 'lezzetova' && (
          <path d="M24 56 Q20 104 36 108 L84 108 Q100 104 96 56z" fill="#2a1a12" />
        )}
        <path d="M12 130 Q14 94 60 90 Q106 94 108 130 Z" fill={shirt} />
        {sp === 'baron' && (
          <g>
            <path d="M60 92 L46 130 L74 130z" fill="#fff" />
            <path d="M54 94 L60 102 L66 94 L60 98z" fill="#c0392b" />
          </g>
        )}
        {sp === 'lezzetova' && (
          <path d="M30 100 Q60 112 90 100 Q86 112 60 116 Q34 112 30 100z" fill="#d4a017" />
        )}
        {sp === 'sef' && (
          <g>
            <path d="M48 92 L60 106 L72 92z" fill="#e94f37" />
            <circle cx="52" cy="114" r="2" fill="#bbb" />
            <circle cx="68" cy="114" r="2" fill="#bbb" />
          </g>
        )}
        {sp === 'hana' && (
          <path d="M40 94 v36 M80 94 v36" stroke="#ffd166" strokeWidth="3" strokeDasharray="3 4" />
        )}
        <rect x="52" y="80" width="16" height="14" rx="6" fill={shade(skin, -0.12)} />
        <circle cx="28" cy="60" r="7" fill={shade(skin, -0.06)} />
        <circle cx="92" cy="60" r="7" fill={shade(skin, -0.06)} />
        <ellipse cx="60" cy="58" rx="32" ry="31" fill={skin} />
        <circle cx="36" cy="68" r="6" fill="#ff7aa2" opacity=".35" />
        <circle cx="84" cy="68" r="6" fill="#ff7aa2" opacity=".35" />
        <Eyes mood={mood} />
        {sp === 'baron' ? (
          <g>
            <path
              d="M42 70 q8 -8 18 -2 q10 -6 18 2 q6 6 12 0 q-2 10 -14 6 q-8 -2 -16 -2 q-8 0 -16 2 q-12 4 -14 -6 q6 6 12 0z"
              fill="#3b2316"
            />
            <path
              d="M52 78 q8 4 16 0"
              stroke="#2b1d14"
              strokeWidth="2.4"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <Mouth mood={mood} />
        )}
        {!sp && <Hair style={look.hair} color={look.hairColor} back={false} />}
        {!sp && <Accessory acc={look.acc} color={look.accColor} />}
        {sp === 'hana' && (
          <g>
            <path d="M28 52 Q30 24 60 24 Q90 24 92 52 Q80 36 60 36 Q40 36 28 52z" fill="#dcdce3" />
            <circle cx="60" cy="20" r="13" fill="#dcdce3" />
            <path d="M54 12 l14 14" stroke="#c0392b" strokeWidth="3" strokeLinecap="round" />
            <g fill="none" stroke="#7a5034" strokeWidth="2.4">
              <circle cx="42" cy="57" r="9" />
              <circle cx="78" cy="57" r="9" />
              <path d="M51 57 h18" />
            </g>
          </g>
        )}
        {sp === 'baron' && (
          <g>
            <rect x="34" y="-2" width="52" height="30" rx="3" fill="#1d1d1d" />
            <rect x="34" y="20" width="52" height="7" fill="#8e44ad" />
            <ellipse cx="60" cy="28" rx="40" ry="6" fill="#1d1d1d" />
            <path
              d="M30 48 Q36 40 46 44 M90 48 Q84 40 74 44"
              stroke="#5a3825"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
        {sp === 'lezzetova' && (
          <g>
            <path d="M24 52 Q26 22 60 22 Q94 22 96 52 Q80 34 60 38 Q40 34 24 52z" fill="#2a1a12" />
            <ellipse cx="66" cy="22" rx="36" ry="10" fill="#9b1c31" transform="rotate(-10 66 22)" />
            <circle cx="88" cy="14" r="4" fill="#9b1c31" />
            <g fill="#fff" fillOpacity=".2" stroke="#d4a017" strokeWidth="2.6">
              <path d="M30 52 q12 -6 22 2 q-2 10 -12 10 q-10 0 -10 -12z" />
              <path d="M90 52 q-12 -6 -22 2 q2 10 12 10 q10 0 10 -12z" />
            </g>
            <circle cx="76" cy="74" r="1.8" fill="#2b1d14" />
          </g>
        )}
        {sp === 'ruzgar' && (
          <g>
            <path
              d="M24 56 Q22 16 60 16 Q98 16 96 56 L92 56 Q88 34 60 34 Q32 34 28 56z"
              fill="#0b7a70"
            />
            <path d="M30 40 Q60 28 90 40 L88 30 Q60 20 32 30z" fill="#a8f0e8" opacity=".8" />
            <path d="M44 18 h32" stroke="#ffd166" strokeWidth="4" />
          </g>
        )}
        {sp === 'sef' && (
          <g>
            <path
              d="M32 36 Q22 22 34 12 Q40 0 54 6 Q62 -4 74 6 Q90 2 90 18 Q100 28 88 38z"
              fill="#fff"
              stroke="#d8d8d8"
              strokeWidth="2"
            />
            <rect
              x="32"
              y="30"
              width="56"
              height="12"
              rx="3"
              fill="#fff"
              stroke="#d8d8d8"
              strokeWidth="2"
            />
            <path d="M34 50 Q40 44 48 46" stroke="#2b1d14" strokeWidth="2.5" fill="none" />
            <path d="M28 46 Q30 38 36 40" fill="#2b1d14" />
          </g>
        )}
      </g>
    </svg>
  );
}

export function CatArt({ size = 70, sleepy = false }: { size?: number; sleepy?: boolean }) {
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9} aria-hidden="true">
      <path
        className="cat-tail"
        d="M76 74 q22 -4 18 -26 q-2 -8 -8 -6"
        stroke="#e8892f"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
        style={{ transformOrigin: '76px 74px' }}
      />
      <ellipse cx="54" cy="66" rx="28" ry="20" fill="#ffa94d" />
      <ellipse cx="54" cy="72" rx="16" ry="12" fill="#fff1dc" />
      <path d="M30 62 q6 4 10 0 M68 56 q6 4 10 0" stroke="#e8892f" strokeWidth="3" fill="none" />
      <circle cx="44" cy="38" r="22" fill="#ffa94d" />
      <path d="M26 30 L22 8 L40 20z" fill="#ffa94d" />
      <path d="M62 30 L66 8 L48 20z" fill="#ffa94d" />
      <path d="M27 26 L25 14 L35 21z" fill="#ffc9d6" />
      <path d="M61 26 L63 14 L53 21z" fill="#ffc9d6" />
      <path
        d="M36 20 l2 8 M44 18 v9 M52 20 l-2 8"
        stroke="#e8892f"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {sleepy ? (
        <g stroke="#2b1d14" strokeWidth="2.4" fill="none" strokeLinecap="round">
          <path d="M32 40 q4 3 8 0" />
          <path d="M48 40 q4 3 8 0" />
        </g>
      ) : (
        <g className="cat-eyes">
          <ellipse cx="36" cy="39" rx="3.6" ry="5" fill="#2b1d14" />
          <ellipse cx="52" cy="39" rx="3.6" ry="5" fill="#2b1d14" />
          <circle cx="37" cy="37" r="1.3" fill="#fff" />
          <circle cx="53" cy="37" r="1.3" fill="#fff" />
        </g>
      )}
      <path d="M41 46 l3 3 l3 -3z" fill="#ff7aa2" />
      <path
        d="M44 49 q-3 4 -6 2 M44 49 q3 4 6 2"
        stroke="#2b1d14"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M22 46 h-12 M22 50 l-11 3 M66 46 h12 M66 50 l11 3"
        stroke="#fff"
        strokeWidth="1.4"
        opacity=".8"
      />
    </svg>
  );
}

export function Portrait({
  who,
  mood = 'happy',
  size = 120,
}: {
  who: string;
  mood?: Mood;
  size?: number;
}) {
  if (who === 'miso') return <CatArt size={size} />;
  if (who === 'mahalle')
    return (
      <div className="crowd" style={{ width: size, height: size }}>
        <CustomerArt look={{ ...randomLookSeed(1) }} mood="happy" size={size * 0.6} />
        <CustomerArt look={{ ...randomLookSeed(2) }} mood="neutral" size={size * 0.6} />
      </div>
    );
  const special = (who === 'sef' ? 'sef' : who) as Look['special'];
  return (
    <CustomerArt
      look={{
        skin: '#f1c27d',
        hair: 0,
        hairColor: '#222',
        shirt: '#fff',
        acc: 0,
        accColor: '#fff',
        special,
      }}
      mood={mood}
      size={size}
    />
  );
}

function randomLookSeed(s: number): Look {
  return s === 1
    ? {
        skin: '#e0ac69',
        hair: 3,
        hairColor: '#2b1d14',
        shirt: '#2ec4b6',
        acc: 3,
        accColor: '#ffb347',
      }
    : {
        skin: '#ffdbb5',
        hair: 1,
        hairColor: '#a0522d',
        shirt: '#ff7aa2',
        acc: 1,
        accColor: '#333',
      };
}

// ---------- Small icons ----------

export function Coin({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#f5b700" stroke="#b07d00" strokeWidth="2" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="#ffe066" strokeWidth="1.6" />
      <rect x="10" y="9" width="4" height="6" rx="1" fill="#b07d00" />
    </svg>
  );
}

export function Star({ on, size = 32 }: { on: boolean; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z"
        fill={on ? '#ffd166' : '#3b3150'}
        stroke={on ? '#e09a00' : '#2a2238'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Scooter({ size = 60 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 70" width={size} height={size * 0.7} aria-hidden="true">
      <circle cx="22" cy="54" r="12" fill="#222" />
      <circle cx="22" cy="54" r="5" fill="#999" />
      <circle cx="80" cy="54" r="12" fill="#222" />
      <circle cx="80" cy="54" r="5" fill="#999" />
      <path
        d="M14 46 Q20 30 44 32 L66 32 L74 20 L82 20 L80 30 Q92 38 90 48 L14 48z"
        fill="#2ec4b6"
      />
      <rect x="20" y="14" width="26" height="20" rx="4" fill="#e94f37" />
      <text
        x="33"
        y="28"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill="#fff"
        fontFamily="Baloo 2, sans-serif">
        N
      </text>
      <path d="M74 20 l6 -12 h8" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
