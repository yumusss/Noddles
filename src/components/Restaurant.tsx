import { useMemo } from 'react';
import type { DecorState } from '../decor';
import { avatarUri } from '../avatar';
import type { Look } from '../art';

// The dining room behind the counter, drawn as one wide SVG (1600x900) that is cropped
// to fit: phones see the middle, tablets see the whole room. Every decor slot swaps a group.

const W = 1600;
const FLOOR = 600;

function Defs() {
  return (
    <defs>
      <linearGradient id="r-warm" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#000" stopOpacity=".35" />
        <stop offset=".4" stopColor="#000" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity=".25" />
      </linearGradient>
      <radialGradient id="r-glow" cx=".5" cy=".5" r=".5">
        <stop offset="0" stopColor="#ffcf86" stopOpacity=".55" />
        <stop offset="1" stopColor="#ffcf86" stopOpacity="0" />
      </radialGradient>
      <pattern id="p-ahsap" width="70" height="600" patternUnits="userSpaceOnUse">
        <rect width="70" height="600" fill="#7a4428" />
        <rect x="68" width="2" height="600" fill="#4a2414" />
        <path
          d="M14 0 q6 150 -2 300 t4 300 M40 0 q-6 200 4 360 t-3 240"
          stroke="#6a3820"
          strokeWidth="2"
          fill="none"
        />
        <rect width="70" height="600" fill="#ffffff" opacity=".03" />
      </pattern>
      <pattern id="p-washi" width="60" height="104" patternUnits="userSpaceOnUse">
        <rect width="60" height="104" fill="#efe3c8" />
        <path
          d="M0 0 L30 52 L60 0 M0 104 L30 52 L60 104 M30 0 V104 M0 52 H60"
          stroke="#c9b48a"
          strokeWidth="1.4"
          fill="none"
        />
      </pattern>
      <pattern id="p-tugla" width="80" height="40" patternUnits="userSpaceOnUse">
        <rect width="80" height="40" fill="#5a3a2e" />
        <rect x="2" y="2" width="76" height="16" rx="2" fill="#9a5a40" />
        <rect x="-38" y="22" width="76" height="16" rx="2" fill="#8d4f38" />
        <rect x="42" y="22" width="76" height="16" rx="2" fill="#a2634a" />
      </pattern>
      <pattern id="p-lake" width="200" height="600" patternUnits="userSpaceOnUse">
        <rect width="200" height="600" fill="#8e1f17" />
        <rect x="14" y="80" width="172" height="440" fill="none" stroke="#d4a017" strokeWidth="3" />
        <rect x="24" y="90" width="152" height="420" fill="#a3281d" />
      </pattern>
      <pattern id="p-sakura" width="140" height="140" patternUnits="userSpaceOnUse">
        <rect width="140" height="140" fill="#f6dbe2" />
        {[
          [30, 30],
          [100, 90],
          [60, 120],
        ].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse
                key={a}
                cx="0"
                cy="-8"
                rx="5"
                ry="8"
                fill="#f2a7bd"
                transform={`rotate(${a})`}
              />
            ))}
            <circle r="3" fill="#e2557a" />
          </g>
        ))}
      </pattern>
      <pattern id="p-parke" width="120" height="40" patternUnits="userSpaceOnUse">
        <rect width="120" height="40" fill="#9a6338" />
        <rect y="0" width="58" height="19" fill="#a8703f" />
        <rect x="60" y="20" width="58" height="19" fill="#8e5a31" />
        <rect x="60" y="0" width="58" height="19" fill="#b37a47" />
        <rect y="20" width="58" height="19" fill="#9c6537" />
      </pattern>
      <pattern id="p-tatami" width="200" height="100" patternUnits="userSpaceOnUse">
        <rect width="200" height="100" fill="#cfc18a" />
        {Array.from({ length: 20 }, (_, i) => (
          <rect key={i} y={i * 5} width="200" height="2" fill="#b9aa72" />
        ))}
        <rect width="200" height="6" fill="#2b2d24" />
        <rect width="6" height="100" fill="#2b2d24" />
      </pattern>
      <pattern id="p-dama" width="80" height="80" patternUnits="userSpaceOnUse">
        <rect width="80" height="80" fill="#f1ece2" />
        <rect width="40" height="40" fill="#2b2d33" />
        <rect x="40" y="40" width="40" height="40" fill="#2b2d33" />
      </pattern>
      <pattern id="p-tas" width="160" height="90" patternUnits="userSpaceOnUse">
        <rect width="160" height="90" fill="#6d6a64" />
        <path
          d="M4 4 h70 v38 h-70z M80 4 h76 v52 h-76z M4 48 h50 v38 h-50z M60 48 h20 v38 h-20z M86 62 h70 v24 h-70z"
          fill="#8a867e"
        />
      </pattern>
      <filter id="neon" x="-30%" y="-80%" width="160%" height="260%">
        <feGaussianBlur stdDeviation="5" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>
  );
}

function Wall({ id }: { id: string }) {
  const fill =
    id === 'duvar-washi'
      ? 'p-washi'
      : id === 'duvar-tugla'
        ? 'p-tugla'
        : id === 'duvar-lake'
          ? 'p-lake'
          : id === 'duvar-sakura'
            ? 'p-sakura'
            : 'p-ahsap';
  return (
    <g>
      <rect width={W} height={FLOOR} fill={`url(#${fill})`} />
      {/* wainscot */}
      <rect y={FLOOR - 120} width={W} height="120" fill="#4a2818" />
      <rect y={FLOOR - 124} width={W} height="8" fill="#2e170c" />
      {Array.from({ length: 16 }, (_, i) => (
        <rect
          key={i}
          x={i * 100 + 10}
          y={FLOOR - 104}
          width="80"
          height="88"
          rx="4"
          fill="#5a3220"
        />
      ))}
      <rect width={W} height={FLOOR} fill="url(#r-warm)" />
    </g>
  );
}

function Floor({ id }: { id: string }) {
  const fill =
    id === 'zemin-tatami'
      ? 'p-tatami'
      : id === 'zemin-dama'
        ? 'p-dama'
        : id === 'zemin-tas'
          ? 'p-tas'
          : 'p-parke';
  return (
    <g>
      <rect y={FLOOR} width={W} height={900 - FLOOR} fill={`url(#${fill})`} />
      <rect y={FLOOR} width={W} height={900 - FLOOR} fill="#000" opacity=".28" />
      <rect y={FLOOR} width={W} height="10" fill="#000" opacity=".35" />
    </g>
  );
}

function Beams() {
  return (
    <g>
      <rect width={W} height="46" fill="#2a160c" />
      <rect y="42" width={W} height="6" fill="#1a0d06" />
      {Array.from({ length: 9 }, (_, i) => (
        <rect key={i} x={i * 200 - 10} y="0" width="22" height="46" fill="#3a2010" />
      ))}
    </g>
  );
}

const LAMP_X = [210, 470, 1130, 1390];

function Lamps({ id }: { id: string }) {
  return (
    <g>
      {LAMP_X.map((x, i) => (
        <g
          key={x}
          className="sway-g"
          style={{ transformOrigin: `${x}px 46px`, animationDelay: `${i * 0.7}s` }}>
          <line x1={x} y1="46" x2={x} y2="80" stroke="#1a0d06" strokeWidth="2" />
          <circle cx={x} cy="130" r="80" fill="url(#r-glow)" />
          {id === 'lamba-kure' ? (
            <g>
              <circle cx={x} cy="120" r="36" fill="#fff6e2" />
              <circle cx={x} cy="120" r="36" fill="none" stroke="#e8d6b0" strokeWidth="1.5" />
              {[-24, -12, 0, 12, 24].map((d) => (
                <ellipse
                  key={d}
                  cx={x}
                  cy={120 + d}
                  rx={Math.sqrt(36 * 36 - d * d)}
                  ry="2"
                  fill="none"
                  stroke="#e8d6b0"
                  strokeWidth="1"
                />
              ))}
            </g>
          ) : id === 'lamba-ampul' ? (
            <g>
              <rect x={x - 6} y="80" width="12" height="14" fill="#5a4a2a" />
              <path
                d={`M${x - 16} 110 a16 18 0 1 1 32 0 q0 14 -10 22 h-12 q-10 -8 -10 -22z`}
                fill="#ffd27a"
                opacity=".85"
              />
              <path d={`M${x - 6} 118 q6 -12 12 0`} stroke="#fff3c4" strokeWidth="2" fill="none" />
            </g>
          ) : (
            <g>
              <rect x={x - 22} y="78" width="44" height="8" rx="2" fill="#151515" />
              <ellipse
                cx={x}
                cy="124"
                rx="34"
                ry="42"
                fill={
                  id === 'lamba-renkli'
                    ? ['#e94f37', '#2a9d8f', '#f4a261', '#8e44ad'][i % 4]
                    : '#d8352a'
                }
              />
              {[-30, -18, -6, 6, 18, 30].map((d) => (
                <ellipse
                  key={d}
                  cx={x}
                  cy={124 + d}
                  rx={Math.sqrt(1 - (d / 42) ** 2) * 34}
                  ry="1.6"
                  fill="#00000030"
                />
              ))}
              <ellipse cx={x - 10} cy="108" rx="8" ry="16" fill="#ffffff30" />
              <rect x={x - 22} y="162" width="44" height="8" rx="2" fill="#151515" />
              <text x={x} y="134" textAnchor="middle" fontSize="28" fill="#1a0d06" fontWeight="700">
                {['麺', '福', '味', '湯'][i]}
              </text>
              <line x1={x} y1="170" x2={x} y2="190" stroke="#d4a017" strokeWidth="2" />
            </g>
          )}
        </g>
      ))}
    </g>
  );
}

function KitchenPass() {
  return (
    <g>
      <rect x="110" y="160" width="330" height="290" fill="#2a160c" />
      <rect x="122" y="172" width="306" height="266" fill="#1b120c" />
      <rect x="122" y="172" width="306" height="266" fill="url(#r-glow)" opacity=".7" />
      {/* shelf with bowls & pots inside */}
      <rect x="130" y="300" width="290" height="8" fill="#5a3220" />
      {[150, 196, 242].map((x) => (
        <path
          key={x}
          d={`M${x} 300 q0 -26 20 -26 q20 0 20 26z`}
          fill="#f4ede2"
          stroke="#c0392b"
          strokeWidth="2"
        />
      ))}
      <rect x="300" y="250" width="60" height="50" rx="6" fill="#9aa3ae" />
      <ellipse cx="330" cy="250" rx="30" ry="6" fill="#c9ced6" />
      <path
        d="M318 240 q-6 -16 4 -30 M340 240 q-6 -16 4 -30"
        stroke="#fff"
        strokeOpacity=".4"
        strokeWidth="4"
        fill="none"
        className="steam-svg"
      />
      {/* cook silhouette */}
      <ellipse cx="240" cy="400" rx="44" ry="38" fill="#0d0805" />
      <circle cx="240" cy="352" r="22" fill="#0d0805" />
      <path d="M220 334 q20 -22 40 0z" fill="#e8e1d4" opacity=".7" />
      {/* pass counter */}
      <rect x="100" y="438" width="350" height="14" fill="#7a4428" />
      {/* noren */}
      {[0, 1, 2, 3].map((i) => (
        <g
          key={i}
          className="noren-g"
          style={{ transformOrigin: `${132 + i * 76}px 160px`, animationDelay: `${i * 0.4}s` }}>
          <rect x={124 + i * 76} y="160" width="72" height="92" fill="#1f3c88" />
          <text
            x={160 + i * 76}
            y="218"
            textAnchor="middle"
            fontSize="34"
            fill="#fff"
            fontWeight="700">
            {['ら', 'ー', 'め', 'ん'][i]}
          </text>
        </g>
      ))}
      <rect x="114" y="152" width="322" height="10" fill="#3a2010" />
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
        x={x - 4}
        y={y + 8}
        width={w + 8}
        height={h + 8}
        fill="#000"
        opacity=".35"
        filter="url(#soft)"
      />
      <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} fill="#2a160c" />
      <rect x={x - 6} y={y - 6} width={w + 12} height={h + 12} fill="#c9a227" />
      <rect x={x} y={y} width={w} height={h} fill="#f3ead6" />
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
  const x = 620;
  const y = 74;
  return (
    <Frame x={x} y={y} w={360} h={200}>
      {id === 'tablo1-fuji' && (
        <g>
          <rect width="300" height="180" fill="#f6e2c4" />
          <circle cx="220" cy="54" r="26" fill="#e94f37" />
          <path d="M40 150 L140 44 Q150 36 160 44 L260 150z" fill="#3d5a80" />
          <path
            d="M116 70 L140 44 Q150 36 160 44 L184 70 L172 66 L160 76 L148 64 L136 76 L126 66z"
            fill="#fff"
          />
          <path d="M0 150 q30 -14 60 0 t60 0 t60 0 t60 0 t60 0 V180 H0z" fill="#98c1d9" />
          <path
            d="M0 162 q30 -12 60 0 t60 0 t60 0 t60 0 t60 0"
            stroke="#fff"
            strokeWidth="3"
            fill="none"
          />
        </g>
      )}
      {id === 'tablo1-dalga' && (
        <g>
          <rect width="300" height="180" fill="#efe2c2" />
          <path d="M210 150 L240 118 L270 150z" fill="#3d5a80" />
          <path d="M236 122 L240 118 L244 122z" fill="#fff" />
          <path
            d="M0 180 V120 Q40 40 120 40 Q190 40 196 96 Q170 64 140 80 Q170 96 150 130 Q120 110 96 140 Q70 160 40 160 Q20 170 0 180z"
            fill="#1d3557"
          />
          <path
            d="M120 40 Q190 40 196 96 Q178 72 154 74 Q168 56 150 50 Q140 44 120 40z"
            fill="#457b9d"
          />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M${140 + i * 8} ${46 + i * 6} q6 -8 10 2 q-4 -2 -6 4`} fill="#fff" />
          ))}
          <path
            d="M0 160 Q60 120 120 150 Q170 170 220 150 Q260 140 300 156 V180 H0z"
            fill="#457b9d"
          />
          <path
            d="M0 168 Q60 136 120 160 Q170 178 220 160 Q260 150 300 166"
            stroke="#fff"
            strokeWidth="2.4"
            fill="none"
          />
        </g>
      )}
      {id === 'tablo1-koi' && (
        <g>
          <rect width="300" height="180" fill="#2a6f97" />
          {[
            [70, 50],
            [230, 130],
            [60, 150],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r="20" fill="#52b788" />
              <path
                d={`M${cx} ${cy} L${cx + 20} ${cy - 6} L${cx + 18} ${cy + 6}z`}
                fill="#2a6f97"
              />
            </g>
          ))}
          <g transform="translate(150 90) rotate(-20)">
            <path d="M-60 0 Q-20 -22 30 -6 Q50 0 30 6 Q-20 22 -60 0z" fill="#f4a261" />
            <path d="M30 0 L56 -16 L50 0 L56 16z" fill="#f4a261" />
            <circle cx="-10" cy="-4" r="8" fill="#fff" />
            <circle cx="-48" cy="-2" r="2" fill="#111" />
          </g>
          <g transform="translate(150 90) rotate(160)">
            <path d="M-56 0 Q-18 -20 28 -6 Q46 0 28 6 Q-18 20 -56 0z" fill="#fff" />
            <path d="M28 0 L52 -14 L46 0 L52 14z" fill="#fff" />
            <circle cx="-14" cy="0" r="9" fill="#e63946" />
            <circle cx="-44" cy="-2" r="2" fill="#111" />
          </g>
        </g>
      )}
      {id === 'tablo1-vinc' && (
        <g>
          <rect width="300" height="180" fill="#d4a017" />
          <rect width="300" height="180" fill="#fff" opacity=".18" />
          <circle cx="240" cy="40" r="22" fill="#e94f37" />
          {[
            [90, 100, 1],
            [190, 80, -1],
          ].map(([x, y, s], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${s} 1)`}>
              <path d="M0 0 Q-50 -50 -90 -30 Q-50 -20 -20 10z" fill="#fff" />
              <path d="M0 0 Q50 -60 90 -40 Q50 -20 20 10z" fill="#fff" />
              <path d="M-10 6 Q0 -6 14 6 Q4 14 -10 6z" fill="#fff" />
              <path d="M10 4 L34 -16" stroke="#111" strokeWidth="5" strokeLinecap="round" />
              <circle cx="36" cy="-18" r="5" fill="#111" />
              <circle cx="36" cy="-22" r="3" fill="#e63946" />
              <path d="M-80 -30 l-8 -4 M-84 -28 l-8 0" stroke="#111" strokeWidth="3" />
              <path d="M-14 10 L-30 40 M-6 10 L-18 42" stroke="#111" strokeWidth="2" />
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
        <rect x={x - 6} y={y - 10} width="112" height="10" rx="4" fill="#5a3220" />
        <rect x={x} y={y} width="100" height="220" fill="#f6ecd6" />
        <rect x={x} y={y} width="100" height="220" fill="none" stroke="#b9a37a" strokeWidth="6" />
        <text
          x={x + 50}
          y={y + 130}
          textAnchor="middle"
          fontSize="92"
          fill="#1a1a1a"
          fontFamily="serif">
          味
        </text>
        <rect x={x + 38} y={y + 180} width="24" height="24" fill="#c0392b" />
        <rect x={x - 6} y={y + 220} width="112" height="12" rx="5" fill="#5a3220" />
      </g>
    );
  return (
    <Frame x={x} y={y} w={100} h={140}>
      {id === 'tablo2-kedi' ? (
        <g>
          <rect width="300" height="180" fill="#ffd166" />
          <g transform="translate(150 96) scale(1.6)">
            <circle r="34" fill="#ffa94d" />
            <path d="M-30 -14 L-26 -46 L-6 -30z M30 -14 L26 -46 L6 -30z" fill="#ffa94d" />
            <circle cx="-12" cy="-4" r="5" fill="#2b1d14" />
            <circle cx="12" cy="-4" r="5" fill="#2b1d14" />
            <path d="M-4 8 l4 4 l4 -4z" fill="#ff7aa2" />
          </g>
          <text x="150" y="30" textAnchor="middle" fontSize="28" fontWeight="900" fill="#c0392b">
            MISO
          </text>
        </g>
      ) : (
        <g>
          <rect width="300" height="180" fill="#f6ecd6" />
          <path d="M0 160 Q90 120 160 90 T300 20" stroke="#3a2010" strokeWidth="10" fill="none" />
          <path d="M120 106 Q150 130 170 150" stroke="#3a2010" strokeWidth="6" fill="none" />
          {[
            [80, 128],
            [140, 96],
            [200, 64],
            [250, 40],
            [168, 148],
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
                  fill="#f2a7bd"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle r="4" fill="#e2557a" />
            </g>
          ))}
        </g>
      )}
    </Frame>
  );
}

function MenuBoard({ items }: { items: string[] }) {
  return (
    <g>
      <rect x="1020" y="150" width="250" height="260" rx="8" fill="#3a2010" />
      <rect x="1032" y="162" width="226" height="236" rx="4" fill="#1f2a22" />
      <text
        x="1145"
        y="206"
        textAnchor="middle"
        fontSize="34"
        fontWeight="800"
        fill="#f8f1d8"
        fontFamily="Baloo 2, sans-serif">
        MENÜ
      </text>
      {items.slice(0, 6).map((t, i) => (
        <g key={t}>
          <text
            x="1050"
            y={248 + i * 26}
            fontSize="19"
            fill="#f8f1d8"
            fontFamily="Nunito, sans-serif"
            fontWeight="700">
            {t}
          </text>
          <text
            x="1240"
            y={248 + i * 26}
            fontSize="17"
            textAnchor="end"
            fill="#ffd166"
            fontFamily="Nunito, sans-serif"
            fontWeight="800">
            ${(4.5 + i * 0.5).toFixed(2)}
          </text>
        </g>
      ))}
      <path
        d="M1052 228 h186"
        stroke="#f8f1d8"
        strokeOpacity=".3"
        strokeWidth="2"
        strokeDasharray="6 5"
      />
    </g>
  );
}

function StreetWindow({ rain }: { rain: boolean }) {
  return (
    <g>
      <rect x="1310" y="130" width="250" height="320" fill="#2a160c" />
      <rect x="1322" y="142" width="226" height="296" fill="#161034" />
      <rect x="1322" y="300" width="226" height="138" fill="#0e0a20" />
      {[1335, 1380, 1440, 1500].map((x, i) => (
        <rect key={x} x={x} y={250 - i * 20} width="40" height={200 + i * 20} fill="#22183f" />
      ))}
      {[
        [1350, 280],
        [1395, 300],
        [1455, 260],
        [1515, 320],
        [1460, 340],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="8" height="10" fill="#ffd166" opacity=".8" />
      ))}
      <text x="1470" y="200" fontSize="22" fill="#ff5fa2" filter="url(#neon)" fontWeight="800">
        BAR
      </text>
      {rain &&
        Array.from({ length: 22 }, (_, i) => (
          <line
            key={i}
            x1={1330 + ((i * 47) % 210)}
            y1={150 + ((i * 83) % 260)}
            x2={1326 + ((i * 47) % 210)}
            y2={170 + ((i * 83) % 260)}
            stroke="#9fd3ff"
            strokeOpacity=".7"
            strokeWidth="1.5"
            className="rain-svg"
            style={{ animationDelay: `${(i % 7) * 0.12}s` }}
          />
        ))}
      <rect x="1430" y="142" width="8" height="296" fill="#2a160c" />
      <rect x="1322" y="286" width="226" height="8" fill="#2a160c" />
      <path d="M1330 150 L1400 150 L1340 260z" fill="#fff" opacity=".07" />
      <rect x="1300" y="446" width="270" height="14" fill="#5a3220" />
    </g>
  );
}

function Shelf() {
  return (
    <g>
      <rect x="1010" y="440" width="270" height="10" fill="#5a3220" />
      {[1024, 1052, 1080].map((x, i) => (
        <g key={x}>
          <rect x={x + 6} y={386} width="8" height="12" fill={i === 1 ? '#3a1a08' : '#0a1f13'} />
          <path
            d={`M${x} 404 q0 -8 10 -8 q10 0 10 8 v34 h-20z`}
            fill={i === 1 ? '#8a4a1c' : '#2f6b47'}
          />
          <rect x={x + 3} y="414" width="14" height="12" fill="#f3e6c8" />
        </g>
      ))}
      {[1120, 1170, 1220].map((x) => (
        <path
          key={x}
          d={`M${x} 440 q0 -22 22 -22 q22 0 22 22z`}
          fill="#f4ede2"
          stroke="#1f3c88"
          strokeWidth="2"
        />
      ))}
    </g>
  );
}

function Neon({ id }: { id: string }) {
  if (id === 'neon-yok') return null;
  if (id === 'neon-ramen')
    return (
      <g className="neon-g">
        <rect x="660" y="300" width="280" height="70" rx="10" fill="#0a0612" opacity=".6" />
        <text
          x="800"
          y="352"
          textAnchor="middle"
          fontSize="48"
          fill="#ff7ab8"
          filter="url(#neon)"
          fontWeight="800">
          ラーメン
        </text>
      </g>
    );
  return (
    <g className="neon-g" filter="url(#neon)">
      <path
        d="M720 330 h160 q-8 40 -80 44 q-72 -4 -80 -44z"
        fill="none"
        stroke="#5ff0ff"
        strokeWidth="5"
      />
      <path
        d="M760 326 q10 -20 0 -40 M800 326 q10 -20 0 -40 M840 326 q10 -20 0 -40"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
      />
      <path
        d="M850 300 L900 270 M856 308 L906 278"
        stroke="#ffd166"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </g>
  );
}

function Plants({ id }: { id: string }) {
  if (id === 'bitki-yok') return null;
  const bamboo = (x: number) => (
    <g key={'b' + x}>
      <path d={`M${x - 30} ${FLOOR + 40} h60 l-8 50 h-44z`} fill="#3a3a3a" />
      {[-14, 0, 14].map((d, i) => (
        <g key={d}>
          <rect
            x={x + d - 4}
            y={FLOOR - 230 + i * 30}
            width="8"
            height={270 - i * 30}
            fill="#6a994e"
          />
          {[0, 1, 2, 3, 4].map((k) => (
            <rect
              key={k}
              x={x + d - 5}
              y={FLOOR - 200 + i * 30 + k * 50}
              width="10"
              height="3"
              fill="#386641"
            />
          ))}
          <path
            d={`M${x + d} ${FLOOR - 220 + i * 30} q30 -10 50 6 q-30 2 -50 -6z`}
            fill="#a7c957"
          />
          <path
            d={`M${x + d} ${FLOOR - 160 + i * 30} q-30 -10 -50 6 q30 2 50 -6z`}
            fill="#a7c957"
          />
        </g>
      ))}
    </g>
  );
  const monstera = (x: number) => (
    <g key={'m' + x}>
      <path d={`M${x - 36} ${FLOOR + 30} h72 l-10 60 h-52z`} fill="#c0392b" />
      {[-60, -20, 20, 60].map((a, i) => (
        <g key={a} transform={`translate(${x} ${FLOOR + 30}) rotate(${a})`}>
          <path d={`M0 0 L0 ${-120 - i * 10}`} stroke="#386641" strokeWidth="4" />
          <path
            d={`M0 ${-120 - i * 10} q-46 -20 -40 -70 q30 10 40 40 q10 -30 40 -40 q6 50 -40 70z`}
            fill="#2d6a4f"
          />
          <path d={`M0 ${-125 - i * 10} v-50`} stroke="#52b788" strokeWidth="2" />
        </g>
      ))}
    </g>
  );
  if (id === 'bitki-bambu') return <g>{[60, 1540].map(bamboo)}</g>;
  if (id === 'bitki-bonsai')
    return (
      <g>
        {monstera(70)}
        <g>
          <rect x="1180" y="418" width="60" height="22" rx="4" fill="#1f3c88" />
          <path
            d="M1210 418 q-4 -30 -20 -40 M1210 418 q6 -26 22 -36"
            stroke="#5a3220"
            strokeWidth="6"
            fill="none"
          />
          <ellipse cx="1186" cy="372" rx="26" ry="14" fill="#386641" />
          <ellipse cx="1234" cy="378" rx="24" ry="12" fill="#2d6a4f" />
          <ellipse cx="1210" cy="360" rx="20" ry="11" fill="#52b788" />
        </g>
      </g>
    );
  return <g>{[monstera(60), bamboo(1545), monstera(1480)]}</g>;
}

function Special({ id }: { id: string }) {
  if (id === 'ozel-yok') return null;
  if (id === 'ozel-akvaryum')
    return (
      <g>
        <rect x="470" y="420" width="140" height="60" fill="#3a2010" />
        <rect x="476" y="330" width="128" height="92" fill="#4ea8de" opacity=".65" />
        <rect x="476" y="330" width="128" height="10" fill="#cfe8ff" opacity=".7" />
        <rect x="476" y="400" width="128" height="22" fill="#c9a66b" />
        <path
          d="M500 400 q-4 -30 4 -50 M512 400 q6 -24 -2 -44 M580 400 q-6 -26 2 -40"
          stroke="#2d6a4f"
          strokeWidth="4"
          fill="none"
        />
        <g className="fish-a">
          <path d="M520 370 q14 -10 26 0 q-12 10 -26 0z M546 370 l8 -6 v12z" fill="#f4a261" />
        </g>
        <g className="fish-b">
          <path d="M560 386 q-12 -8 -22 0 q10 8 22 0z M538 386 l-7 -5 v10z" fill="#ffd166" />
        </g>
        <rect
          x="476"
          y="330"
          width="128"
          height="92"
          fill="none"
          stroke="#2a160c"
          strokeWidth="5"
        />
        <path d="M486 336 L520 336 L490 380z" fill="#fff" opacity=".18" />
      </g>
    );
  return (
    <g>
      <rect x="470" y="420" width="140" height="60" fill="#3a2010" />
      <rect x="480" y="396" width="120" height="26" rx="4" fill="#5a3220" />
      <g className="spin-g" style={{ transformOrigin: '530px 396px' }}>
        <ellipse cx="530" cy="396" rx="40" ry="10" fill="#111" />
        <ellipse cx="530" cy="396" rx="12" ry="3" fill="#e94f37" />
      </g>
      <path d="M582 384 L566 398" stroke="#c9ced6" strokeWidth="3" />
      {[0, 1, 2].map((i) => (
        <text
          key={i}
          x={560 + i * 14}
          y={360 - i * 12}
          fontSize="20"
          fill="#ffd166"
          className="note-svg"
          style={{ animationDelay: `${i * 0.6}s` }}>
          ♪
        </text>
      ))}
    </g>
  );
}

const DINER_SEEDS = [301, 517, 733, 919, 1103, 1291, 1447, 1601];

function Tables({ id }: { id: string }) {
  const diners = useMemo(
    () =>
      DINER_SEEDS.map((s, i) =>
        avatarUri({ seed: s } as Look, i % 3 ? 'happy' : 'love', i % 2 === 0)
      ),
    []
  );
  if (id === 'masa-yok') return null;
  const spots = id === 'masa-dort' ? [180, 470, 1130, 1420] : [200, 1400];
  return (
    <g>
      {spots.map((x, i) => (
        <g key={x}>
          {/* diners behind the table */}
          <image
            href={diners[i * 2]}
            x={x - 120}
            y={FLOOR - 170}
            width="130"
            height="130"
            className="diner"
            style={{ animationDelay: `${i * 0.3}s` }}
          />
          <image
            href={diners[i * 2 + 1]}
            x={x - 10}
            y={FLOOR - 170}
            width="130"
            height="130"
            className="diner"
            style={{ animationDelay: `${i * 0.3 + 0.5}s` }}
          />
          {/* table */}
          <ellipse cx={x} cy={FLOOR + 70} rx="120" ry="14" fill="#000" opacity=".3" />
          <rect x={x - 10} y={FLOOR - 40} width="20" height="110" fill="#3a2010" />
          <rect x={x - 120} y={FLOOR - 64} width="240" height="26" rx="6" fill="#8a5530" />
          <rect x={x - 120} y={FLOOR - 64} width="240" height="8" rx="4" fill="#b57a48" />
          {/* bowls + chopsticks on table */}
          <path d={`M${x - 80} ${FLOOR - 64} q0 -24 30 -24 q30 0 30 24z`} fill="#c0392b" />
          <path d={`M${x + 20} ${FLOOR - 64} q0 -24 30 -24 q30 0 30 24z`} fill="#1f3c88" />
          <path
            d={`M${x - 74} ${FLOOR - 78} q4 -24 -2 -40 M${x + 30} ${FLOOR - 78} q4 -24 -2 -40`}
            stroke="#fff"
            strokeOpacity=".35"
            strokeWidth="5"
            fill="none"
            className="steam-svg"
          />
          <path
            d={`M${x - 10} ${FLOOR - 70} L${x + 10} ${FLOOR - 108}`}
            stroke="#d9b38c"
            strokeWidth="3"
          />
          {/* stools */}
          {[-90, 90].map((d) => (
            <g key={d}>
              <rect x={x + d - 6} y={FLOOR - 4} width="12" height="74" fill="#2a160c" />
              <ellipse cx={x + d} cy={FLOOR - 4} rx="30" ry="9" fill="#c0392b" />
            </g>
          ))}
        </g>
      ))}
    </g>
  );
}

export default function Restaurant({
  decor,
  menu,
  rain,
}: {
  decor: DecorState;
  menu: string[];
  rain: boolean;
}) {
  return (
    <svg
      className="restaurant"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true">
      <Defs />
      <Wall id={decor.duvar} />
      <Floor id={decor.zemin} />
      <KitchenPass />
      <SmallArt id={decor.tablo2} />
      <BigPainting id={decor.tablo1} />
      <MenuBoard items={menu} />
      <Shelf />
      <StreetWindow rain={rain} />
      <Special id={decor.ozel} />
      <Neon id={decor.neon} />
      <Beams />
      <Lamps id={decor.lamba} />
      <Plants id={decor.bitki} />
      <Tables id={decor.masa} />
    </svg>
  );
}
