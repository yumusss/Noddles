import { useMemo } from 'react';
import { withDefaults, type DecorState } from '../decor';
import { avatarUri } from '../avatar';
import type { Look } from '../art';

// The dining room behind the counter, drawn as one wide SVG (1600x900) cropped to fit:
// phones see the middle, tablets the whole room. A calm, daylight Japanese noodle shop:
// light hinoki wood, a big window with a sakura branch, paper lamps, a few tables.

export type TimeOfDay = 'sabah' | 'ogle' | 'gunbatimi' | 'aksam';

const W = 1600;
const FLOOR = 610;

const SKY: Record<TimeOfDay, [string, string, string]> = {
  sabah: ['#ffe8d2', '#fbd9c2', '#cfe6f0'],
  ogle: ['#d4ecf7', '#e8f5fb', '#f7fbfc'],
  gunbatimi: ['#f7b38f', '#f6c9a0', '#f9e2c2'],
  aksam: ['#2c3a66', '#4b4a78', '#7b5e86'],
};
const SUN: Record<TimeOfDay, [number, number, string]> = {
  sabah: [1380, 330, '#fff1d6'],
  ogle: [1500, 170, '#fffbe8'],
  gunbatimi: [1420, 380, '#ffc58a'],
  aksam: [1470, 190, '#f3f0e2'],
};

function Defs({ tod }: { tod: TimeOfDay }) {
  const [a, b, c] = SKY[tod];
  return (
    <defs>
      <linearGradient id="r-sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={a} />
        <stop offset=".55" stopColor={b} />
        <stop offset="1" stopColor={c} />
      </linearGradient>
      <linearGradient id="r-shade" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#3a2414" stopOpacity=".22" />
        <stop offset=".3" stopColor="#3a2414" stopOpacity="0" />
        <stop offset="1" stopColor="#3a2414" stopOpacity=".12" />
      </linearGradient>
      <linearGradient id="r-ray" x1="1" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#fff7e6" stopOpacity={tod === 'aksam' ? 0 : 0.5} />
        <stop offset="1" stopColor="#fff7e6" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="r-lamp" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#ffd9a0" stopOpacity={tod === 'aksam' ? 0.7 : 0.35} />
        <stop offset="1" stopColor="#ffd9a0" stopOpacity="0" />
      </radialGradient>
      <pattern id="p-hinoki" width="56" height="610" patternUnits="userSpaceOnUse">
        <rect width="56" height="610" fill="#e3c9a2" />
        <rect x="54" width="2" height="610" fill="#c9a97c" />
        <path d="M16 0 q5 160 -2 310 t3 300" stroke="#d8bb90" strokeWidth="1.4" fill="none" />
        <path d="M36 0 q-5 220 3 380 t-2 230" stroke="#dcc199" strokeWidth="1.2" fill="none" />
      </pattern>
      <pattern id="p-shoji" width="120" height="150" patternUnits="userSpaceOnUse">
        <rect width="120" height="150" fill="#f6efe2" />
        <rect width="120" height="150" fill="none" stroke="#b9946a" strokeWidth="5" />
        <path d="M40 0 V150 M80 0 V150 M0 50 H120 M0 100 H120" stroke="#c8a77d" strokeWidth="2.4" />
      </pattern>
      <pattern id="p-sage" width="300" height="300" patternUnits="userSpaceOnUse">
        <rect width="300" height="300" fill="#b9c6ad" />
        <circle cx="60" cy="80" r="70" fill="#c3cfb7" opacity=".5" />
        <circle cx="220" cy="210" r="90" fill="#aebd9f" opacity=".45" />
      </pattern>
      <pattern id="p-terra" width="300" height="300" patternUnits="userSpaceOnUse">
        <rect width="300" height="300" fill="#d9a385" />
        <circle cx="80" cy="60" r="80" fill="#e2b195" opacity=".5" />
        <circle cx="230" cy="230" r="90" fill="#cf957a" opacity=".45" />
      </pattern>
      <pattern id="p-sakura" width="150" height="150" patternUnits="userSpaceOnUse">
        <rect width="150" height="150" fill="#f7e6e4" />
        {[
          [30, 34],
          [104, 92],
          [64, 128],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} opacity=".8">
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx="0"
                cy="-7"
                rx="4.4"
                ry="7"
                fill="#efb8c3"
                transform={`rotate(${a})`}
              />
            ))}
            <circle r="2.4" fill="#d9788f" />
          </g>
        ))}
      </pattern>
      <pattern id="p-oak" width="240" height="44" patternUnits="userSpaceOnUse">
        <rect width="240" height="44" fill="#d7b48a" />
        <rect y="0" width="118" height="21" fill="#dcbb93" />
        <rect x="120" y="22" width="118" height="21" fill="#d2ad80" />
        <rect x="120" y="0" width="118" height="21" fill="#e0c19b" />
        <rect y="22" width="118" height="21" fill="#d5b186" />
      </pattern>
      <pattern id="p-tatami" width="220" height="110" patternUnits="userSpaceOnUse">
        <rect width="220" height="110" fill="#d8cf9e" />
        {Array.from({ length: 22 }, (_, i) => (
          <rect key={i} y={i * 5} width="220" height="2" fill="#cbc18c" />
        ))}
        <rect width="220" height="6" fill="#5a6b4b" />
        <rect width="6" height="110" fill="#5a6b4b" />
      </pattern>
      <pattern id="p-terrazzo" width="140" height="140" patternUnits="userSpaceOnUse">
        <rect width="140" height="140" fill="#efe9df" />
        {[
          [20, 30, '#d9a385'],
          [80, 20, '#b9c6ad'],
          [110, 90, '#c9b8a0'],
          [40, 100, '#e7c4b0'],
          [70, 64, '#a9b6c4'],
        ].map(([x, y, c], i) => (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="8"
            ry="5"
            fill={c as string}
            transform={`rotate(${i * 40} ${x} ${y})`}
          />
        ))}
      </pattern>
      <pattern id="p-stone" width="170" height="96" patternUnits="userSpaceOnUse">
        <rect width="170" height="96" fill="#b8b2a8" />
        <path
          d="M4 4 h76 v40 h-76z M86 4 h80 v54 h-80z M4 50 h52 v42 h-52z M62 50 h20 v42 h-20z M88 64 h78 v28 h-78z"
          fill="#ccc7bd"
        />
      </pattern>
      <filter id="r-soft" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id="r-neon" x="-30%" y="-80%" width="160%" height="260%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

const WALL_FILL: Record<string, string> = {
  'duvar-ahsap': 'p-hinoki',
  'duvar-washi': 'p-shoji',
  'duvar-tugla': 'p-sage',
  'duvar-lake': 'p-terra',
  'duvar-sakura': 'p-sakura',
};
const FLOOR_FILL: Record<string, string> = {
  'zemin-parke': 'p-oak',
  'zemin-tatami': 'p-tatami',
  'zemin-dama': 'p-terrazzo',
  'zemin-tas': 'p-stone',
};

function Room({ decor }: { decor: DecorState }) {
  return (
    <g>
      <rect width={W} height={FLOOR} fill={`url(#${WALL_FILL[decor.duvar] ?? 'p-hinoki'})`} />
      <rect y={FLOOR - 120} width={W} height="120" fill="#b98d63" />
      <rect y={FLOOR - 126} width={W} height="8" fill="#8f6542" />
      {Array.from({ length: 20 }, (_, i) => (
        <rect
          key={i}
          x={i * 80 + 2}
          y={FLOOR - 112}
          width="76"
          height="104"
          rx="3"
          fill="#c39a70"
        />
      ))}
      <rect
        y={FLOOR}
        width={W}
        height={900 - FLOOR}
        fill={`url(#${FLOOR_FILL[decor.zemin] ?? 'p-oak'})`}
      />
      <rect y={FLOOR} width={W} height="12" fill="#6e4a2e" opacity=".35" />
      <rect width={W} height="30" fill="#a77b52" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={i * 200 - 8} width="16" height="30" fill="#8f6542" />
      ))}
      <rect width={W} height={FLOOR} fill="url(#r-shade)" />
    </g>
  );
}

function BigWindow({ tod, rain }: { tod: TimeOfDay; rain: boolean }) {
  const [sx, sy, sc] = SUN[tod];
  return (
    <g>
      <rect x="1290" y="100" width="280" height="380" rx="6" fill="#8f6542" />
      <svg x="1302" y="112" width="256" height="356" viewBox="1302 112 256 356">
        <rect x="1302" y="112" width="256" height="356" fill="url(#r-sky)" />
        <circle cx={sx} cy={sy} r={tod === 'aksam' ? 22 : 36} fill={sc} opacity=".95" />
        {tod === 'aksam' &&
          [
            [1330, 150],
            [1400, 200],
            [1520, 140],
            [1360, 260],
          ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" opacity=".8" />)}
        <path
          d="M1302 400 Q1380 350 1460 380 T1560 360 V470 H1302z"
          fill={tod === 'aksam' ? '#3b3d5e' : '#b8cfb0'}
        />
        <path
          d="M1302 430 h90 l20 -26 h70 l20 26 h58 V470 H1302z"
          fill={tod === 'aksam' ? '#2a2b45' : '#8f9d8a'}
        />
        <path
          d="M1560 150 Q1500 170 1450 220 T1360 260"
          stroke="#6b4a36"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M1470 205 q-10 -30 4 -50"
          stroke="#6b4a36"
          strokeWidth="3.4"
          fill="none"
          strokeLinecap="round"
        />
        {[
          [1540, 156],
          [1500, 176],
          [1470, 206],
          [1474, 158],
          [1430, 236],
          [1390, 252],
          [1366, 262],
          [1520, 186],
          [1450, 222],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx="0"
                cy="-6"
                rx="4.2"
                ry="6.4"
                fill="#f6c2cf"
                transform={`rotate(${a + i * 17})`}
              />
            ))}
            <circle r="2" fill="#e27f98" />
          </g>
        ))}
        {rain &&
          Array.from({ length: 26 }, (_, i) => (
            <line
              key={i}
              x1={1310 + ((i * 47) % 240)}
              y1={120 + ((i * 83) % 330)}
              x2={1306 + ((i * 47) % 240)}
              y2={140 + ((i * 83) % 330)}
              stroke="#8fb3c9"
              strokeOpacity=".7"
              strokeWidth="1.5"
              className="rain-svg"
              style={{ animationDelay: `${(i % 7) * 0.12}s` }}
            />
          ))}
      </svg>
      <rect
        x="1302"
        y="112"
        width="256"
        height="356"
        fill="none"
        stroke="#a77b52"
        strokeWidth="6"
      />
      <path d="M1430 112 V468 M1302 290 H1558" stroke="#a77b52" strokeWidth="6" />
      <path d="M1310 118 L1380 118 L1318 230z" fill="#fff" opacity=".18" />
      <rect x="1296" y="104" width="268" height="60" fill="#d8bf8f" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x="1296" y={106 + i * 6} width="268" height="1.5" fill="#bfa06c" />
      ))}
      <rect x="1292" y="476" width="288" height="14" rx="3" fill="#8f6542" />
      <path d="M1300 130 L1300 470 L900 900 L1180 900z" fill="url(#r-ray)" className="ray" />
    </g>
  );
}

function KitchenPass({ tod }: { tod: TimeOfDay }) {
  return (
    <g>
      <rect x="90" y="140" width="360" height="300" rx="4" fill="#8f6542" />
      <rect x="102" y="152" width="336" height="276" fill="#f3e6cf" />
      <rect
        x="102"
        y="152"
        width="336"
        height="276"
        fill={tod === 'aksam' ? '#ffcf86' : '#fff2da'}
        opacity=".55"
      />
      <rect x="110" y="292" width="320" height="8" fill="#b98d63" />
      {[130, 176, 222].map((x, i) => (
        <path
          key={x}
          d={`M${x} 292 q0 -24 20 -24 q20 0 20 24z`}
          fill={['#f4f1ea', '#2f4a6d', '#c96a4a'][i]}
        />
      ))}
      <rect x="300" y="240" width="64" height="52" rx="8" fill="#c9ced3" />
      <ellipse cx="332" cy="240" rx="32" ry="6" fill="#e3e6ea" />
      <path
        d="M318 230 q-6 -16 4 -30 M344 230 q-6 -16 4 -30"
        stroke="#fff"
        strokeOpacity=".7"
        strokeWidth="5"
        fill="none"
        className="steam-svg"
      />
      <rect x="380" y="200" width="6" height="70" fill="#8f6542" />
      <ellipse cx="383" cy="276" rx="14" ry="6" fill="#c9ced3" />
      <ellipse cx="240" cy="402" rx="46" ry="36" fill="#cbb49a" />
      <circle cx="240" cy="352" r="22" fill="#cbb49a" />
      <path d="M220 336 q20 -24 40 0z" fill="#fff" />
      <rect x="84" y="430" width="372" height="16" rx="3" fill="#a77b52" />
      {[0, 1, 2, 3].map((i) => (
        <g
          key={i}
          className="noren-g"
          style={{ transformOrigin: `${130 + i * 82}px 140px`, animationDelay: `${i * 0.4}s` }}>
          <rect x={108 + i * 82} y="140" width="78" height="96" fill="#2f4a6d" />
        </g>
      ))}
      <circle cx="270" cy="186" r="26" fill="none" stroke="#f6efe2" strokeWidth="4" />
      <text x="270" y="196" textAnchor="middle" fontSize="26" fill="#f6efe2" fontWeight="700">
        麺
      </text>
      <rect x="98" y="132" width="344" height="10" rx="3" fill="#8f6542" />
    </g>
  );
}

function Frame({
  x,
  y,
  w,
  h,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
}) {
  return (
    <g>
      <rect
        x={x - 2}
        y={y + 10}
        width={w + 4}
        height={h + 4}
        fill="#3a2414"
        opacity=".18"
        filter="url(#r-soft)"
      />
      <rect x={x - 9} y={y - 9} width={w + 18} height={h + 18} rx="2" fill="#8f6542" />
      <rect x={x - 4} y={y - 4} width={w + 8} height={h + 8} fill="#f6efe2" />
      <svg
        x={x}
        y={y}
        width={w}
        height={h}
        viewBox="0 0 300 180"
        preserveAspectRatio="xMidYMid slice">
        {children}
      </svg>
    </g>
  );
}

function BigPainting({ id }: { id: string }) {
  if (id === 'tablo1-yok') return null;
  return (
    <Frame x={630} y={84} w={340} h={190}>
      {id === 'tablo1-fuji' && (
        <g>
          <rect width="300" height="180" fill="#f6e7d2" />
          <circle cx="226" cy="54" r="24" fill="#e58f73" />
          <path d="M40 150 L140 48 Q150 40 160 48 L260 150z" fill="#7d93ad" />
          <path
            d="M118 72 L140 48 Q150 40 160 48 L182 72 L170 68 L160 78 L148 66 L136 78 L126 68z"
            fill="#fbf7ef"
          />
          <path d="M0 150 q30 -12 60 0 t60 0 t60 0 t60 0 t60 0 V180 H0z" fill="#a9c4cf" />
        </g>
      )}
      {id === 'tablo1-dalga' && (
        <g>
          <rect width="300" height="180" fill="#f1e6cf" />
          <path d="M212 150 L240 120 L268 150z" fill="#7d93ad" />
          <path
            d="M0 180 V122 Q40 44 120 44 Q186 44 194 98 Q170 68 142 82 Q170 98 150 130 Q120 112 96 140 Q70 160 40 160 Q20 170 0 180z"
            fill="#3e5f80"
          />
          <path d="M120 44 Q186 44 194 98 Q178 74 156 76 Q168 58 150 52z" fill="#6f8fae" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${140 + i * 8} ${50 + i * 6} q6 -8 10 2 q-4 -2 -6 4`}
              fill="#fbf7ef"
            />
          ))}
          <path
            d="M0 160 Q60 124 120 150 Q170 170 220 150 Q260 140 300 156 V180 H0z"
            fill="#6f8fae"
          />
        </g>
      )}
      {id === 'tablo1-koi' && (
        <g>
          <rect width="300" height="180" fill="#bcd3d6" />
          {[
            [64, 46],
            [236, 134],
            [54, 148],
          ].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="20" fill="#8fb3a0" />
          ))}
          <g transform="translate(150 90) rotate(-20)">
            <path d="M-60 0 Q-20 -22 30 -6 Q50 0 30 6 Q-20 22 -60 0z" fill="#e8a27a" />
            <path d="M30 0 L56 -16 L50 0 L56 16z" fill="#e8a27a" />
            <circle cx="-10" cy="-4" r="8" fill="#fbf7ef" />
          </g>
          <g transform="translate(150 90) rotate(160)">
            <path d="M-56 0 Q-18 -20 28 -6 Q46 0 28 6 Q-18 20 -56 0z" fill="#fbf7ef" />
            <path d="M28 0 L52 -14 L46 0 L52 14z" fill="#fbf7ef" />
            <circle cx="-14" cy="0" r="9" fill="#d97a6a" />
          </g>
        </g>
      )}
      {id === 'tablo1-vinc' && (
        <g>
          <rect width="300" height="180" fill="#e9d6a8" />
          <circle cx="240" cy="40" r="20" fill="#d97a6a" />
          {[
            [90, 100, 1],
            [190, 80, -1],
          ].map(([x, y, sc], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${sc} 1)`}>
              <path d="M0 0 Q-50 -50 -90 -30 Q-50 -20 -20 10z" fill="#fbf7ef" />
              <path d="M0 0 Q50 -60 90 -40 Q50 -20 20 10z" fill="#fbf7ef" />
              <path d="M10 4 L34 -16" stroke="#3a3a3a" strokeWidth="4" strokeLinecap="round" />
              <circle cx="36" cy="-20" r="3" fill="#d97a6a" />
            </g>
          ))}
        </g>
      )}
    </Frame>
  );
}

function SmallArt({ id }: { id: string }) {
  if (id === 'tablo2-yok') return null;
  const x = 490;
  const y = 140;
  if (id === 'tablo2-kaligrafi')
    return (
      <g>
        <rect x={x - 6} y={y - 10} width="112" height="10" rx="4" fill="#8f6542" />
        <rect x={x} y={y} width="100" height="220" fill="#f6efe2" />
        <rect
          x={x + 6}
          y={y + 6}
          width="88"
          height="208"
          fill="none"
          stroke="#d8c29c"
          strokeWidth="2"
        />
        <text
          x={x + 50}
          y={y + 130}
          textAnchor="middle"
          fontSize="90"
          fill="#2b2b2b"
          fontFamily="serif">
          味
        </text>
        <rect x={x + 40} y={y + 178} width="20" height="20" fill="#c96a5a" />
        <rect x={x - 6} y={y + 220} width="112" height="12" rx="5" fill="#8f6542" />
      </g>
    );
  return (
    <Frame x={x} y={y} w={100} h={130}>
      {id === 'tablo2-kedi' ? (
        <g>
          <rect width="300" height="180" fill="#f3d9b0" />
          <g transform="translate(150 100) scale(1.6)">
            <circle r="32" fill="#8a6a50" />
            <path d="M-28 -12 L-24 -44 L-6 -28z M28 -12 L24 -44 L6 -28z" fill="#8a6a50" />
            <path
              d="M0 -10 q-8 14 -18 22 q8 14 18 14 q10 0 18 -14 q-10 -8 -18 -22z"
              fill="#fbf6ee"
            />
            <circle cx="-11" cy="-4" r="4" fill="#2b1d14" />
            <circle cx="11" cy="-4" r="4" fill="#2b1d14" />
          </g>
          <text x="150" y="32" textAnchor="middle" fontSize="26" fontWeight="900" fill="#8f6542">
            MOCHI
          </text>
        </g>
      ) : (
        <g>
          <rect width="300" height="180" fill="#f6efe2" />
          <path d="M0 160 Q90 120 160 90 T300 20" stroke="#6b4a36" strokeWidth="9" fill="none" />
          {[
            [80, 128],
            [140, 96],
            [200, 64],
            [250, 40],
            [108, 112],
          ].map(([cx, cy], i) => (
            <g key={i} transform={`translate(${cx} ${cy})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse
                  key={a}
                  cx="0"
                  cy="-10"
                  rx="7"
                  ry="11"
                  fill="#f2b8c6"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle r="4" fill="#d9788f" />
            </g>
          ))}
        </g>
      )}
    </Frame>
  );
}

function MenuTags({ items }: { items: string[] }) {
  const tags = items.slice(0, 5);
  return (
    <g>
      <rect x="1010" y="118" width="260" height="10" rx="4" fill="#8f6542" />
      {tags.map((t, i) => (
        <g
          key={t}
          className="tag-g"
          style={{ transformOrigin: `${1036 + i * 52}px 128px`, animationDelay: `${i * 0.3}s` }}>
          <line
            x1={1036 + i * 52}
            y1="128"
            x2={1036 + i * 52}
            y2="140"
            stroke="#6b4a36"
            strokeWidth="2"
          />
          <rect
            x={1016 + i * 52}
            y="140"
            width="40"
            height="190"
            rx="3"
            fill={i % 2 ? '#f6efe2' : '#efe2c8'}
            stroke="#c8a77d"
            strokeWidth="2"
          />
          <text
            x={1036 + i * 52}
            y="156"
            fontSize="17"
            fontWeight="800"
            fill="#3a2414"
            fontFamily="Nunito, sans-serif"
            style={{ writingMode: 'vertical-rl' }}>
            {t}
          </text>
          <circle cx={1036 + i * 52} cy="314" r="9" fill="#c96a5a" />
        </g>
      ))}
    </g>
  );
}

function Shelf() {
  return (
    <g>
      <rect x="1004" y="402" width="276" height="10" rx="3" fill="#a77b52" />
      {[1024, 1050].map((x, i) => (
        <g key={x}>
          <rect x={x + 6} y="350" width="8" height="12" fill={i ? '#6b4a36' : '#5a7a5e'} />
          <path d={`M${x} 368 q0 -8 10 -8 q10 0 10 8 v34 h-20z`} fill={i ? '#b9835a' : '#7d9a80'} />
        </g>
      ))}
      {[1090, 1136].map((x, i) => (
        <path key={x} d={`M${x} 402 q0 -22 22 -22 q22 0 22 22z`} fill={i ? '#2f4a6d' : '#f4f1ea'} />
      ))}
      <rect x="1196" y="378" width="56" height="24" rx="5" fill="#c96a5a" />
      <path
        d="M1224 378 q-6 -26 -20 -34 M1224 378 q4 -26 18 -32"
        stroke="#6b4a36"
        strokeWidth="4"
        fill="none"
      />
      <ellipse cx="1202" cy="340" rx="20" ry="11" fill="#7d9a80" />
      <ellipse cx="1244" cy="344" rx="18" ry="10" fill="#6a8a6e" />
      <ellipse cx="1224" cy="330" rx="16" ry="9" fill="#93b195" />
    </g>
  );
}

const LAMP_X = [230, 520, 1080, 1360];

function Lamps({ id, tod }: { id: string; tod: TimeOfDay }) {
  return (
    <g>
      {LAMP_X.map((x, i) => (
        <g
          key={x}
          className="sway-g"
          style={{ transformOrigin: `${x}px 30px`, animationDelay: `${i * 0.7}s` }}>
          <line x1={x} y1="30" x2={x} y2="70" stroke="#6b4a36" strokeWidth="2" />
          <circle cx={x} cy="110" r="90" fill="url(#r-lamp)" />
          {id === 'lamba-kure' ? (
            <g>
              <circle cx={x} cy="104" r="34" fill="#fbf4e4" />
              {[-22, -11, 0, 11, 22].map((d) => (
                <ellipse
                  key={d}
                  cx={x}
                  cy={104 + d}
                  rx={Math.sqrt(34 * 34 - d * d)}
                  ry="1.6"
                  fill="none"
                  stroke="#e5d4b2"
                  strokeWidth="1"
                />
              ))}
            </g>
          ) : id === 'lamba-ampul' ? (
            <g>
              <path d={`M${x - 40} 112 Q${x} 50 ${x + 40} 112z`} fill="#c9a06a" />
              {Array.from({ length: 7 }, (_, k) => (
                <path
                  key={k}
                  d={`M${x - 36 + k * 12} 110 Q${x} 56 ${x} 62`}
                  stroke="#a77b52"
                  strokeWidth="1"
                  fill="none"
                />
              ))}
              <circle cx={x} cy="116" r="9" fill="#ffe7b0" />
            </g>
          ) : (
            <g>
              <rect x={x - 18} y="68" width="36" height="7" rx="2" fill="#3a2a22" />
              <ellipse
                cx={x}
                cy="108"
                rx="28"
                ry="36"
                fill={
                  id === 'lamba-renkli'
                    ? ['#e7a38f', '#9fc1b5', '#f2c38b', '#b9a7c9'][i % 4]
                    : '#f6ead4'
                }
              />
              {[-24, -12, 0, 12, 24].map((d) => (
                <ellipse
                  key={d}
                  cx={x}
                  cy={108 + d}
                  rx={Math.sqrt(1 - (d / 36) ** 2) * 28}
                  ry="1.4"
                  fill="#00000018"
                />
              ))}
              <rect x={x - 18} y="141" width="36" height="7" rx="2" fill="#3a2a22" />
              {tod === 'aksam' && (
                <ellipse cx={x} cy="108" rx="20" ry="26" fill="#ffd58a" opacity=".45" />
              )}
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

function Neon({ id, tod }: { id: string; tod: TimeOfDay }) {
  if (id === 'neon-yok') return null;
  const op = tod === 'aksam' ? 1 : 0.75;
  if (id === 'neon-ramen')
    return (
      <g className="neon-g" opacity={op}>
        <text
          x="800"
          y="352"
          textAnchor="middle"
          fontSize="44"
          fill="#f28fb0"
          filter="url(#r-neon)"
          fontWeight="800">
          ラーメン
        </text>
      </g>
    );
  return (
    <g className="neon-g" filter="url(#r-neon)" opacity={op}>
      <path
        d="M730 330 h140 q-8 36 -70 40 q-62 -4 -70 -40z"
        fill="none"
        stroke="#8fd9e6"
        strokeWidth="5"
      />
      <path
        d="M770 326 q8 -18 0 -36 M800 326 q8 -18 0 -36 M830 326 q8 -18 0 -36"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
      />
    </g>
  );
}

function Plants({ id }: { id: string }) {
  if (id === 'bitki-yok') return null;
  const fiddle = (x: number) => (
    <g key={'f' + x}>
      <ellipse cx={x} cy={FLOOR + 98} rx="44" ry="8" fill="#3a2414" opacity=".15" />
      <path d={`M${x - 32} ${FLOOR + 30} h64 l-8 66 h-48z`} fill="#efe5d6" />
      <path d={`M${x - 32} ${FLOOR + 30} h64`} stroke="#d8c8b0" strokeWidth="4" />
      <path d={`M${x} ${FLOOR + 30} V${FLOOR - 160}`} stroke="#6b4a36" strokeWidth="5" />
      {[
        [-30, -150, -30],
        [30, -120, 30],
        [-26, -90, -40],
        [28, -60, 40],
        [-20, -30, -30],
        [0, -180, 0],
      ].map(([dx, dy, a], i) => (
        <ellipse
          key={i}
          cx={x + dx}
          cy={FLOOR + dy}
          rx="20"
          ry="30"
          fill={i % 2 ? '#6f9a72' : '#7fae80'}
          transform={`rotate(${a} ${x + dx} ${FLOOR + dy})`}
        />
      ))}
    </g>
  );
  const bamboo = (x: number) => (
    <g key={'b' + x}>
      <path d={`M${x - 28} ${FLOOR + 40} h56 l-6 50 h-44z`} fill="#5a6b4b" />
      {[-12, 0, 12].map((d, i) => (
        <g key={d}>
          <rect
            x={x + d - 3}
            y={FLOOR - 220 + i * 30}
            width="6"
            height={260 - i * 30}
            fill="#93ae78"
          />
          {[0, 1, 2, 3].map((k) => (
            <rect
              key={k}
              x={x + d - 4}
              y={FLOOR - 190 + i * 30 + k * 56}
              width="8"
              height="3"
              fill="#6f8a58"
            />
          ))}
          <path
            d={`M${x + d} ${FLOOR - 210 + i * 30} q28 -10 46 6 q-28 2 -46 -6z`}
            fill="#a9c48a"
          />
          <path
            d={`M${x + d} ${FLOOR - 150 + i * 30} q-28 -10 -46 6 q28 2 46 -6z`}
            fill="#a9c48a"
          />
        </g>
      ))}
    </g>
  );
  if (id === 'bitki-bambu') return <g>{[56, 1548].map(bamboo)}</g>;
  if (id === 'bitki-bonsai') return <g>{fiddle(60)}</g>;
  return <g>{[fiddle(60), bamboo(1548)]}</g>;
}

function Special({ id }: { id: string }) {
  if (id === 'ozel-yok') return null;
  if (id === 'ozel-akvaryum')
    return (
      <g>
        <rect x="470" y="420" width="140" height="70" rx="4" fill="#a77b52" />
        <rect x="476" y="334" width="128" height="88" rx="4" fill="#bfe1e6" opacity=".85" />
        <rect x="476" y="398" width="128" height="24" fill="#e6d2ae" />
        <path
          d="M500 398 q-4 -26 4 -44 M512 398 q6 -22 -2 -40 M580 398 q-6 -24 2 -36"
          stroke="#6f9a72"
          strokeWidth="4"
          fill="none"
        />
        <g className="fish-a">
          <path d="M520 370 q14 -10 26 0 q-12 10 -26 0z M546 370 l8 -6 v12z" fill="#e8a27a" />
        </g>
        <g className="fish-b">
          <path d="M560 384 q-12 -8 -22 0 q10 8 22 0z M538 384 l-7 -5 v10z" fill="#f2c38b" />
        </g>
        <rect
          x="476"
          y="334"
          width="128"
          height="88"
          rx="4"
          fill="none"
          stroke="#8f6542"
          strokeWidth="4"
        />
      </g>
    );
  return (
    <g>
      <rect x="470" y="420" width="140" height="70" rx="4" fill="#a77b52" />
      <rect x="482" y="398" width="116" height="24" rx="4" fill="#c39a70" />
      <g className="spin-g" style={{ transformOrigin: '530px 398px' }}>
        <ellipse cx="530" cy="398" rx="38" ry="9" fill="#2b2b2b" />
        <ellipse cx="530" cy="398" rx="10" ry="2.6" fill="#c96a5a" />
      </g>
      <path d="M580 386 L566 398" stroke="#c9ced3" strokeWidth="3" />
      {[0, 1, 2].map((i) => (
        <text
          key={i}
          x={560 + i * 14}
          y={364 - i * 12}
          fontSize="20"
          fill="#8f6542"
          className="note-svg"
          style={{ animationDelay: `${i * 0.6}s` }}>
          ♪
        </text>
      ))}
    </g>
  );
}

const TABLE: Record<string, [string, string, string]> = {
  'masaStil-mese': ['#d9b48a', '#c39a70', '#a77b52'],
  'masaStil-ceviz': ['#8a5e3e', '#6e4a2e', '#4f3420'],
  'masaStil-mermer': ['#f4f1ec', '#dcd6cc', '#b9b2a6'],
  'masaStil-lake': ['#c0503c', '#9e3a2a', '#6e2418'],
};

const DINER_SEEDS = [301, 517, 733, 919, 1103, 1291, 1447, 1601];

function Centerpiece({ id, x, y }: { id: string; x: number; y: number }) {
  if (id === 'masaSus-vazo')
    return (
      <g>
        <path
          d={`M${x - 8} ${y} q-4 -16 4 -26 h8 q8 10 4 26z`}
          fill="#f4f1ea"
          stroke="#d8cfc0"
          strokeWidth="1.5"
        />
        <path
          d={`M${x} ${y - 26} q-10 -20 -22 -24 M${x} ${y - 26} q8 -24 22 -26`}
          stroke="#6b4a36"
          strokeWidth="2"
          fill="none"
        />
        {[
          [x - 22, y - 50],
          [x + 22, y - 52],
          [x - 8, y - 44],
          [x + 10, y - 40],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill="#f2b8c6" />
        ))}
      </g>
    );
  if (id === 'masaSus-mum')
    return (
      <g>
        <rect x={x - 26} y={y - 22} width="12" height="22" rx="2" fill="#fbf4e4" />
        <path d={`M${x - 20} ${y - 30} q4 6 0 8 q-4 -2 0 -8z`} fill="#ffbf5a" />
        <path d={`M${x} ${y} q0 -18 16 -18 q16 0 16 18z`} fill="#5a7a5e" />
        <rect x={x + 30} y={y - 12} width="8" height="12" rx="2" fill="#f4f1ea" />
      </g>
    );
  if (id === 'masaSus-bonsai')
    return (
      <g>
        <rect x={x - 16} y={y - 12} width="32" height="12" rx="3" fill="#2f4a6d" />
        <path
          d={`M${x} ${y - 12} q-4 -14 -12 -20 M${x} ${y - 12} q4 -14 12 -18`}
          stroke="#6b4a36"
          strokeWidth="3"
          fill="none"
        />
        <ellipse cx={x - 12} cy={y - 34} rx="12" ry="7" fill="#7d9a80" />
        <ellipse cx={x + 12} cy={y - 32} rx="11" ry="6" fill="#6a8a6e" />
      </g>
    );
  return null;
}

function Tables({ decor }: { decor: DecorState }) {
  const diners = useMemo(
    () =>
      DINER_SEEDS.map((s, i) =>
        avatarUri({ seed: s } as Look, i % 3 ? 'happy' : 'love', i % 2 === 0)
      ),
    []
  );
  if (decor.masa === 'masa-yok') return null;
  const spots = decor.masa === 'masa-dort' ? [190, 470, 1130, 1410] : [230, 1370];
  const [top, mid, leg] = TABLE[decor.masaStil] ?? TABLE['masaStil-mese'];
  return (
    <g>
      {spots.map((x, i) => (
        <g key={x}>
          <image
            href={diners[i * 2]}
            x={x - 118}
            y={FLOOR - 176}
            width="128"
            height="128"
            className="diner"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
          <image
            href={diners[i * 2 + 1]}
            x={x - 8}
            y={FLOOR - 176}
            width="128"
            height="128"
            className="diner"
            style={{ animationDelay: `${i * 0.3 + 0.5}s` }}
          />
          <ellipse cx={x} cy={FLOOR + 80} rx="130" ry="14" fill="#3a2414" opacity=".14" />
          <rect x={x - 8} y={FLOOR - 40} width="16" height="118" fill={leg} />
          <rect x={x - 124} y={FLOOR - 66} width="248" height="22" rx="8" fill={mid} />
          <rect x={x - 124} y={FLOOR - 66} width="248" height="9" rx="5" fill={top} />
          <path d={`M${x - 84} ${FLOOR - 66} q0 -22 28 -22 q28 0 28 22z`} fill="#f4f1ea" />
          <path d={`M${x + 30} ${FLOOR - 66} q0 -22 28 -22 q28 0 28 22z`} fill="#2f4a6d" />
          <path
            d={`M${x - 70} ${FLOOR - 82} q4 -22 -2 -36 M${x + 44} ${FLOOR - 82} q4 -22 -2 -36`}
            stroke="#fff"
            strokeOpacity=".6"
            strokeWidth="5"
            fill="none"
            className="steam-svg"
          />
          <Centerpiece id={decor.masaSus} x={x} y={FLOOR - 66} />
          {[-92, 92].map((d) => (
            <g key={d}>
              <rect x={x + d - 5} y={FLOOR - 4} width="10" height="80" fill={leg} />
              <ellipse cx={x + d} cy={FLOOR - 4} rx="30" ry="9" fill="#e8d6b8" />
              <ellipse cx={x + d} cy={FLOOR - 7} rx="26" ry="6" fill="#f3e6cf" />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

export default function Restaurant({
  decor: raw,
  menu,
  rain = false,
  tod = 'ogle',
}: {
  decor?: Partial<DecorState>;
  menu: string[];
  rain?: boolean;
  tod?: TimeOfDay;
}) {
  const decor = withDefaults(raw);
  return (
    <svg
      className={`restaurant tod-${tod}`}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true">
      <Defs tod={tod} />
      <Room decor={decor} />
      <KitchenPass tod={tod} />
      <SmallArt id={decor.tablo2} />
      <BigPainting id={decor.tablo1} />
      <MenuTags items={menu} />
      <Shelf />
      <BigWindow tod={tod} rain={rain} />
      <Special id={decor.ozel} />
      <Neon id={decor.neon} tod={tod} />
      <Lamps id={decor.lamba} tod={tod} />
      <Plants id={decor.bitki} />
      <Tables decor={decor} />
      {tod === 'aksam' && <rect width={W} height="900" fill="#1a1838" opacity=".18" />}
      {tod === 'gunbatimi' && <rect width={W} height="900" fill="#f39a5e" opacity=".08" />}
    </svg>
  );
}
