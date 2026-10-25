import type React from 'react';
import { useId, useMemo, type CSSProperties } from 'react';
import { Avatar } from '../avatar';
import { CatArt, randomLook, type Look } from '../art';
import { tableCount, type Decor } from '../decor';

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

export function Lanterns({ count = 4 }: { count?: number }) {
  return (
    <div className="lanterns" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="lantern" style={{ animationDelay: `${i * 0.6}s` }}>
          <div className="string" />
          <div className="lamp">
            <span>{['麺', '福', '味', '灯', '湯'][i % 5]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

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
        <svg viewBox="0 0 400 70" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
          <defs>
            <linearGradient id="btl" x1="0" x2="1">
              <stop offset="0" stopColor="#0d2a1a" />
              <stop offset=".45" stopColor="#2f6b47" />
              <stop offset="1" stopColor="#0a1f13" />
            </linearGradient>
            <linearGradient id="btl2" x1="0" x2="1">
              <stop offset="0" stopColor="#3a1a08" />
              <stop offset=".45" stopColor="#8a4a1c" />
              <stop offset="1" stopColor="#2a1206" />
            </linearGradient>
            <linearGradient id="cer" x1="0" x2="1">
              <stop offset="0" stopColor="#c9bfae" />
              <stop offset=".4" stopColor="#fbf6ec" />
              <stop offset="1" stopColor="#a89c88" />
            </linearGradient>
          </defs>
          {[20, 52, 300, 336].map((x, i) => (
            <g key={x} transform={`translate(${x} 0)`}>
              <rect x="6" y="6" width="8" height="14" rx="2" fill={i % 2 ? '#2a1206' : '#0a1f13'} />
              <path
                d="M2 24 q0 -6 8 -6 q8 0 8 6 v38 q0 4 -4 4 h-8 q-4 0 -4 -4z"
                fill={i % 2 ? 'url(#btl2)' : 'url(#btl)'}
              />
              <rect x="4" y="34" width="12" height="14" fill="#f3e6c8" opacity=".85" />
            </g>
          ))}
          {[120, 160, 200].map((x, i) => (
            <g key={x}>
              <path d={`M${x} ${62 - i * 0} q0 -14 22 -14 q22 0 22 14z`} fill="url(#cer)" />
              <path
                d={`M${x + 4} ${50} q18 -6 36 0`}
                stroke="#c0392b"
                strokeWidth="2"
                fill="none"
              />
            </g>
          ))}
          <path d="M250 64 q-4 -26 10 -40 q-2 18 4 26 q2 -22 16 -30 q-6 20 -2 44z" fill="#2f6b2f" />
          <rect x="248" y="56" width="34" height="10" rx="3" fill="#8a5530" />
        </svg>
        <div className="shelf-board" />
      </div>
      <div className="noren">
        {['N', 'O', 'D', 'D', 'L', 'E', 'S'].map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
      <Lanterns count={3} />
    </div>
  );
}

/* =====================================================================
   RESTAURANT — full interior driven by the decoration set.
   Everything below is procedural SVG/CSS; styles live in src/decor.css.
   ===================================================================== */

const GUEST_SEEDS = [4821, 90133, 27719, 61207];

/* ---------- wall art ---------- */

export function BigArt({ kind }: { kind: string }) {
  const id = useId().replace(/:/g, '');
  if (kind === 'bigart_fuji')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <defs>
          <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f7c9a3" />
            <stop offset=".55" stopColor="#e28a7c" />
            <stop offset="1" stopColor="#5a4a8c" />
          </linearGradient>
        </defs>
        <rect width="200" height="150" fill={`url(#${id}s)`} />
        <circle cx="146" cy="46" r="20" fill="#d9412f" />
        <ellipse cx="40" cy="78" rx="26" ry="6" fill="#fff" opacity=".7" />
        <ellipse cx="160" cy="92" rx="30" ry="6" fill="#fff" opacity=".6" />
        <path d="M-10 150 L72 52 Q100 40 128 52 L210 150Z" fill="#3b4f8c" />
        <path
          d="M-10 150 L72 52 Q100 40 128 52 L140 66 L92 80 L60 72Z"
          fill="#2f4078"
          opacity=".6"
        />
        <path d="M72 52 Q100 40 128 52 L122 66 L113 58 L102 70 L90 60 L80 70Z" fill="#fbf8f3" />
        <path d="M-10 150 Q60 122 120 134 T210 150Z" fill="#23343a" />
        <path
          d="M30 150 l6 -16 l6 16z M46 150 l5 -12 l5 12z M160 150 l7 -18 l7 18z"
          fill="#162226"
        />
      </svg>
    );
  if (kind === 'bigart_wave')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <rect width="200" height="150" fill="#ead9b8" />
        <circle cx="158" cy="44" r="15" fill="#e55a3c" opacity=".9" />
        <path d="M60 112 L110 82 L170 112Z" fill="#a9b7c6" opacity=".7" />
        <path d="M0 150 C36 136 82 128 200 150Z" fill="#2e7fb0" />
        <path
          d="M-4 150 V92 C26 60 66 40 116 50 C148 56 170 36 182 20 C170 46 154 60 150 72 C136 68 126 82 118 94 C102 72 72 80 62 102 C42 96 22 122 -4 150Z"
          fill="#1f5f8f"
        />
        <path d="M0 150 V110 C24 92 50 86 74 100 C56 102 34 116 24 150Z" fill="#174a70" />
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
          <circle key={i} cx={x} cy={y} r={r} fill="#f8f4ea" />
        ))}
        <path d="M100 56 q10 10 4 24" stroke="#f8f4ea" strokeWidth="2" fill="none" opacity=".8" />
        <path d="M60 96 q6 8 2 18" stroke="#f8f4ea" strokeWidth="2" fill="none" opacity=".8" />
      </svg>
    );
  if (kind === 'bigart_koi')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <rect width="200" height="150" fill="#0f4c5c" />
        {[
          [50, 50, 30],
          [50, 50, 46],
          [150, 100, 26],
          [150, 100, 40],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#ffffff22" strokeWidth="2" />
        ))}
        <circle cx="166" cy="34" r="20" fill="#2e8b57" />
        <path d="M166 34 L186 26 L186 42Z" fill="#0f4c5c" />
        <circle cx="30" cy="120" r="16" fill="#3a9a63" />
        <path d="M30 120 L46 114 L46 126Z" fill="#0f4c5c" />
        <circle cx="172" cy="30" r="4" fill="#ffb6c1" />
        <g transform="rotate(-22 76 72)">
          <path d="M44 72 q-12 -14 -18 -4 q6 2 6 4 q0 2 -6 4 q6 10 18 -4z" fill="#f4f1ea" />
          <ellipse cx="76" cy="72" rx="30" ry="12" fill="#f4f1ea" />
          <circle cx="68" cy="68" r="7" fill="#e8552e" />
          <circle cx="88" cy="75" r="5" fill="#e8552e" />
          <circle cx="98" cy="70" r="1.8" fill="#222" />
        </g>
        <g transform="rotate(18 128 100)">
          <path d="M100 100 q-10 -12 -16 -3 q5 2 5 3 q0 1 -5 3 q6 9 16 -3z" fill="#f08a24" />
          <ellipse cx="128" cy="100" rx="26" ry="10" fill="#f08a24" />
          <circle cx="124" cy="98" r="5" fill="#f4f1ea" />
          <circle cx="146" cy="98" r="1.6" fill="#222" />
        </g>
        <circle cx="110" cy="40" r="2.5" fill="#ffffff66" />
        <circle cx="118" cy="30" r="1.8" fill="#ffffff55" />
      </svg>
    );
  if (kind === 'bigart_cranes')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <rect width="200" height="150" fill="#f1e2b6" />
        <circle cx="52" cy="52" r="26" fill="#d94a3a" />
        <path
          d="M200 150 q-30 -40 -60 -34 q20 4 32 20 q-24 -6 -40 10 q20 -2 36 10z"
          fill="#6b4a2a"
        />
        {[150, 162, 174, 186].map((x, i) => (
          <circle key={i} cx={x} cy={126 - (i % 2) * 8} r="9" fill="#3f7a4a" />
        ))}
        <g>
          <ellipse cx="110" cy="82" rx="30" ry="12" fill="#fbf9f4" />
          <path d="M84 84 q-16 -2 -26 12 q14 -4 28 -2z" fill="#1b1b1b" />
          <path
            d="M98 76 q-10 -18 10 -30 q6 -4 10 -8"
            stroke="#fbf9f4"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="119" cy="37" r="6" fill="#fbf9f4" />
          <circle cx="118" cy="32" r="2.5" fill="#d94a3a" />
          <path d="M124 38 l12 3 l-12 2z" fill="#1b1b1b" />
          <path d="M112 72 q22 -18 46 -16 q-18 6 -30 22z" fill="#fbf9f4" />
          <path d="M140 60 q10 -4 18 -4 q-8 6 -14 12z" fill="#1b1b1b" />
          <path d="M104 94 v30 M116 94 v30" stroke="#1b1b1b" strokeWidth="2" />
        </g>
        <g transform="translate(-60 30) scale(.7)">
          <ellipse cx="110" cy="82" rx="30" ry="12" fill="#fbf9f4" />
          <path d="M84 84 q-16 -2 -26 12 q14 -4 28 -2z" fill="#1b1b1b" />
          <path
            d="M98 76 q-10 -18 10 -30 q6 -4 10 -8"
            stroke="#fbf9f4"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="119" cy="37" r="6" fill="#fbf9f4" />
          <circle cx="118" cy="32" r="2.5" fill="#d94a3a" />
          <path d="M124 38 l12 3 l-12 2z" fill="#1b1b1b" />
          <path d="M104 94 v30 M116 94 v30" stroke="#1b1b1b" strokeWidth="2" />
        </g>
      </svg>
    );
  return null;
}

export function SmallArt({ kind }: { kind: string }) {
  if (kind === 'smallart_calli')
    return (
      <div className="sart scroll">
        <span className="sart-kanji">麺</span>
        <i className="sart-seal" />
      </div>
    );
  if (kind === 'smallart_miso')
    return (
      <div className="sart poster">
        <CatArt size={46} />
        <b>MISO</b>
      </div>
    );
  if (kind === 'smallart_sakura')
    return (
      <div className="sart paper">
        <svg viewBox="0 0 100 120" className="art-svg">
          <path
            d="M10 112 q30 -40 76 -70"
            stroke="#5a3a2a"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M40 86 q10 -14 8 -26 M62 68 q14 -4 24 -14"
            stroke="#5a3a2a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          {[
            [48, 58],
            [30, 92],
            [66, 50],
            [86, 40],
            [58, 78],
            [78, 62],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <ellipse
                  key={a}
                  cx="0"
                  cy="-6"
                  rx="4"
                  ry="6"
                  fill="#ffb7c5"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle r="2.2" fill="#e94f6a" />
            </g>
          ))}
        </svg>
      </div>
    );
  return null;
}

/* ---------- lamps ---------- */

export function Lamps({ kind }: { kind: string }) {
  if (kind === 'lamps_paper')
    return (
      <div className="rest-lamps paper">
        {[0, 1, 2].map((i) => (
          <div key={i} className="pend lamp-flicker" style={{ animationDelay: `${i * 1.3}s` }}>
            <i className="cord" />
            <b className="globe" />
          </div>
        ))}
      </div>
    );
  if (kind === 'lamps_edison')
    return (
      <div className="rest-lamps edison">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="pend lamp-flicker"
            style={{ animationDelay: `${i * 0.7}s`, height: `${60 + ((i * 37) % 3) * 16}%` }}>
            <i className="cord" />
            <b className="bulb">
              <i />
            </b>
          </div>
        ))}
      </div>
    );
  if (kind === 'lamps_festival')
    return (
      <div className="rest-lamps festival">
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="garland">
          <path d="M0 0 Q50 10 100 0" stroke="#2b1d14" strokeWidth="1" fill="none" />
        </svg>
        {['#e94f37', '#ffd166', '#2ec4b6', '#ff7aa2', '#06d6a0', '#ff9f43', '#9b5de5'].map(
          (c, i) => (
            <div
              key={i}
              className="fest lamp-flicker"
              style={
                {
                  '--c': c,
                  left: `${6 + i * 14.5}%`,
                  animationDelay: `${i * 0.45}s`,
                  marginTop: `${Math.sin((i / 6) * Math.PI) * 9}%`,
                } as CSSProperties
              }
            />
          )
        )}
      </div>
    );
  return <Lanterns count={3} />;
}

/* ---------- plants, neon, counter, special ---------- */

export function Plant({ kind }: { kind: string }) {
  if (kind === 'plants_bamboo')
    return (
      <svg viewBox="0 0 80 200" className="rest-plant bamboo">
        {[22, 40, 58].map((x, i) => (
          <g key={x}>
            <rect x={x - 4} y={20 + i * 14} width="8" height={150 - i * 14} rx="3" fill="#5f9b4a" />
            {[0, 1, 2, 3].map((k) => (
              <rect
                key={k}
                x={x - 5}
                y={50 + i * 8 + k * 32}
                width="10"
                height="3"
                fill="#3f6f34"
              />
            ))}
            <path d={`M${x} ${40 + i * 20} q14 -10 24 -2 q-12 2 -24 2z`} fill="#7cc15e" />
            <path d={`M${x} ${86 + i * 10} q-16 -10 -26 -2 q12 2 26 2z`} fill="#6bb34f" />
          </g>
        ))}
        <path d="M12 168 h56 l-6 30 h-44z" fill="#8a5530" />
        <rect x="10" y="164" width="60" height="8" rx="2" fill="#b57a48" />
      </svg>
    );
  if (kind === 'plants_bonsai')
    return (
      <svg viewBox="0 0 120 150" className="rest-plant bonsai">
        <rect x="10" y="120" width="100" height="12" rx="3" fill="#3a1f12" />
        <rect x="16" y="132" width="88" height="16" rx="2" fill="#2b1d14" />
        <path d="M30 120 v-14 h60 v14z" fill="#3b5f6b" />
        <path
          d="M58 106 q-4 -24 -18 -40 q10 4 16 14 q0 -20 10 -34 q2 16 -2 30 q8 -10 24 -12 q-14 8 -18 22 q2 10 -4 20z"
          fill="#6b4a2a"
        />
        {[
          [30, 62, 20, 11],
          [66, 36, 22, 12],
          [92, 58, 18, 10],
          [52, 50, 16, 9],
        ].map(([x, y, rx, ry], i) => (
          <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={i % 2 ? '#3f8f4a' : '#2f7a3e'} />
        ))}
      </svg>
    );
  if (kind === 'plants_monstera')
    return (
      <svg viewBox="0 0 140 200" className="rest-plant monstera">
        <path d="M44 160 h52 l-6 38 h-40z" fill="#c96a3a" />
        <rect x="40" y="156" width="60" height="8" rx="2" fill="#e08a52" />
        {[
          [70, 150, 30, 70, -30],
          [70, 150, 110, 80, 30],
          [70, 150, 60, 36, -8],
          [70, 150, 96, 120, 14],
        ].map(([sx, sy, ex, ey, rot], i) => (
          <g key={i}>
            <path
              d={`M${sx} ${sy} Q${(sx + ex) / 2} ${ey + 20} ${ex} ${ey}`}
              stroke="#2f6b2f"
              strokeWidth="4"
              fill="none"
            />
            <g transform={`translate(${ex} ${ey}) rotate(${rot})`}>
              <path
                d="M0 0 q-26 -10 -30 -34 q4 -22 30 -28 q26 6 30 28 q-4 24 -30 34z"
                fill="#2f8f4e"
              />
              <path
                d="M0 -6 q-14 -6 -16 -20 M0 -6 q14 -6 16 -20 M0 -6 v-44"
                stroke="#1f6b38"
                strokeWidth="3"
                fill="none"
              />
              <path
                d="M-20 -22 q8 -2 10 6 q-8 -2 -10 -6z M20 -22 q-8 -2 -10 6 q8 -2 10 -6z"
                fill="#3d1d14"
                opacity=".35"
              />
            </g>
          </g>
        ))}
      </svg>
    );
  return null;
}

export function Neon({ kind }: { kind: string }) {
  if (kind === 'neon_ramen')
    return (
      <div className="rest-neon text lamp-flicker">
        <span>ラーメン</span>
      </div>
    );
  if (kind === 'neon_bowl')
    return (
      <div className="rest-neon bowl lamp-flicker">
        <svg viewBox="0 0 120 80">
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M14 40 h92 q-4 30 -46 30 q-42 0 -46 -30z" stroke="#4ff0e0" />
            <path d="M30 40 L96 6 M40 40 L104 14" stroke="#ffd166" />
            <path
              d="M44 28 q-6 -8 0 -16 M60 26 q-6 -8 0 -16 M76 28 q-6 -8 0 -16"
              stroke="#ff7aa2"
            />
          </g>
        </svg>
      </div>
    );
  return null;
}

export function CounterDecor({ kind }: { kind: string }) {
  if (kind === 'counter_maneki')
    return (
      <svg viewBox="0 0 100 110" className="rest-counter maneki">
        <ellipse cx="50" cy="104" rx="34" ry="6" fill="#0006" />
        <path d="M22 100 q-6 -40 28 -42 q34 2 28 42z" fill="#fbf9f4" />
        <ellipse cx="50" cy="82" rx="16" ry="18" fill="#fff" />
        <path d="M22 100 q0 -20 10 -24 q-6 14 -2 24z" fill="#f08a24" />
        <g className="maneki-paw">
          <path d="M70 70 q6 -30 4 -42 q-10 4 -12 16 q-4 14 0 26z" fill="#fbf9f4" />
          <circle cx="73" cy="29" r="8" fill="#fbf9f4" />
          <circle cx="70" cy="26" r="2" fill="#f4b6c2" />
          <circle cx="76" cy="26" r="2" fill="#f4b6c2" />
        </g>
        <circle cx="46" cy="44" r="22" fill="#fbf9f4" />
        <path d="M26 34 l2 -18 l14 10z M66 34 l-2 -18 l-14 10z" fill="#fbf9f4" />
        <path d="M30 32 l1 -10 l8 6z M62 32 l-1 -10 l-8 6z" fill="#f4b6c2" />
        <path
          d="M34 42 q4 -4 8 0 M52 42 q4 -4 8 0"
          stroke="#222"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="46" cy="50" r="2.2" fill="#e94f37" />
        <path d="M40 54 q6 4 12 0" stroke="#222" strokeWidth="1.5" fill="none" />
        <path d="M24 64 q22 -10 44 0 l-2 6 q-20 -8 -40 0z" fill="#c0392b" />
        <circle cx="46" cy="68" r="5" fill="#ffd166" />
        <rect
          x="26"
          y="78"
          width="24"
          height="18"
          rx="4"
          fill="#ffd166"
          transform="rotate(-10 38 87)"
        />
        <text
          x="32"
          y="92"
          fontSize="9"
          fontWeight="800"
          fill="#8a5530"
          transform="rotate(-10 38 87)">
          福
        </text>
      </svg>
    );
  if (kind === 'counter_ikebana')
    return (
      <svg viewBox="0 0 100 120" className="rest-counter ikebana">
        <ellipse cx="50" cy="114" rx="30" ry="5" fill="#0006" />
        <path d="M30 86 h40 l-4 28 h-32z" fill="#1f2a22" />
        <rect x="26" y="82" width="48" height="8" rx="2" fill="#3b4f5c" />
        <path
          d="M50 84 q-6 -30 -24 -48 M50 84 q4 -36 20 -56 M50 84 q10 -20 34 -26"
          stroke="#5a3a2a"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M50 84 q-2 -30 6 -56"
          stroke="#3f8f4a"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M56 40 q10 -8 8 -22 q-8 8 -8 22z M44 60 q-12 -4 -14 -18 q10 4 14 18z"
          fill="#3f8f4a"
        />
        {[
          [26, 38, '#e94f6a'],
          [70, 28, '#ffd166'],
          [84, 58, '#ff7aa2'],
          [56, 26, '#fff'],
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
                transform={`rotate(${a})`}
              />
            ))}
            <circle r="2" fill="#f08a24" />
          </g>
        ))}
      </svg>
    );
  return null;
}

export function Special({ kind }: { kind: string }) {
  if (kind === 'special_aquarium')
    return (
      <div className="rest-special aquarium">
        <div className="aq-glow" />
        <div className="aq-tank">
          <div className="aq-water" />
          {[0, 1, 2].map((i) => (
            <svg
              key={i}
              viewBox="0 0 40 20"
              className={`aq-fish f${i}`}
              style={{ animationDelay: `${i * -3.1}s`, top: `${18 + i * 24}%` }}>
              <path
                d="M4 10 q10 -10 22 0 q-12 10 -22 0z"
                fill={['#ff9f43', '#4ff0e0', '#ff7aa2'][i]}
              />
              <path d="M26 10 l10 -7 v14z" fill={['#ff9f43', '#4ff0e0', '#ff7aa2'][i]} />
              <circle cx="10" cy="8" r="1.5" fill="#222" />
            </svg>
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <i
              key={i}
              className="aq-bubble"
              style={{ left: `${15 + i * 17}%`, animationDelay: `${i * 0.9}s` }}
            />
          ))}
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="aq-floor">
            <path d="M0 30 V18 q20 -8 40 0 q20 8 60 -4 V30z" fill="#c8a86b" />
            <path
              d="M10 20 q4 -14 8 0 M18 22 q4 -18 8 0 M80 16 q4 -12 8 0"
              stroke="#2f8f4e"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <div className="aq-glass" />
        </div>
        <div className="aq-stand" />
      </div>
    );
  if (kind === 'special_turntable')
    return (
      <div className="rest-special turntable">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="tt-note"
            style={{ animationDelay: `${i * 1.1}s`, left: `${20 + i * 25}%` }}>
            {['♪', '♫', '♩'][i]}
          </span>
        ))}
        <div className="tt-deck">
          <div className="tt-disc">
            <i />
          </div>
          <div className="tt-arm" />
        </div>
        <div className="tt-stand" />
      </div>
    );
  return null;
}

/* ---------- tables ---------- */

function Table({
  look,
  className,
  style,
}: {
  look: Look;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`rest-table ${className ?? ''}`} style={style}>
      <div className="rt-guest">
        <Avatar look={look} mood="happy" size={90} eating />
      </div>
      <svg viewBox="0 0 160 90" className="rt-table">
        <ellipse cx="80" cy="84" rx="40" ry="5" fill="#0007" />
        <rect x="74" y="40" width="12" height="44" fill="#3a1f12" />
        <path d="M50 84 h60 l-6 -8 h-48z" fill="#2b1d14" />
        <ellipse cx="80" cy="34" rx="76" ry="18" fill="#5e3519" />
        <ellipse cx="80" cy="30" rx="76" ry="18" fill="#b57a48" />
        <ellipse cx="80" cy="30" rx="70" ry="15" fill="#c98f5a" />
        <path d="M56 26 q24 14 48 0 q-4 12 -24 12 q-20 0 -24 -12z" fill="#2b1d14" />
        <path d="M58 25 q22 10 44 0 q-3 7 -22 7 q-19 0 -22 -7z" fill="#f7e0b0" />
        <path d="M64 24 q8 4 16 0" stroke="#e94f37" strokeWidth="2" fill="none" />
        <path
          d="M100 22 l20 -12 M104 24 l22 -10"
          stroke="#3a1f12"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="48" cy="28" r="6" fill="#4ff0e0" opacity=".8" />
        <g className="rt-steam">
          <path
            d="M74 14 q-4 -6 0 -12 M82 16 q-4 -6 0 -12 M90 14 q-4 -6 0 -12"
            stroke="#fff"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity=".7"
          />
        </g>
      </svg>
    </div>
  );
}

/* ---------- the restaurant ---------- */

export function Restaurant({
  decor,
  rain = false,
  menu = 'ramen • udon • soba',
  cat,
  time,
}: {
  decor: Decor;
  rain?: boolean;
  menu?: string;
  cat?: React.ReactNode;
  time?: number;
}) {
  const looks = useMemo(
    () => GUEST_SEEDS.map((seed) => ({ ...randomLook(), seed, kid: false })),
    []
  );
  const n = tableCount(decor);
  const night = time == null ? 0.55 : Math.min(1, Math.max(0, time));
  return (
    <div className="rest" aria-hidden="true" style={{ '--night': night } as CSSProperties}>
      <div className={`rest-wall ${decor.wall}`}>
        <div className="rest-window">
          <div className="rw-sky" />
          <div className="window-city" />
          <div className="rw-night" />
          {rain && <Rain count={18} />}
          <div className="window-frame" />
          <div className="rw-sill" />
        </div>
        <div className="rest-bigart">
          {decor.bigart !== 'bigart_none' && <BigArt kind={decor.bigart} />}
        </div>
        <div className="rest-menu">
          <div>MENÜ</div>
          <small>{menu}</small>
        </div>
        <div className="rest-pass">
          <div className="rp-light" />
          <div className="rp-pots">
            <i />
            <i />
          </div>
          <div className="rp-steam">
            <i />
            <i />
          </div>
          <div className="rp-ledge" />
          <div className="rp-tickets">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="rest-smallart">
          <SmallArt kind={decor.smallart} />
        </div>
        <div className="rest-neon-slot">
          <Neon kind={decor.neon} />
        </div>
        <div className="shelf rest-shelf">
          <svg viewBox="0 0 400 70" preserveAspectRatio="xMidYMax meet">
            {[20, 52, 84, 300, 336].map((x, i) => (
              <g key={x} transform={`translate(${x} 0)`}>
                <rect
                  x="6"
                  y="6"
                  width="8"
                  height="14"
                  rx="2"
                  fill={i % 2 ? '#2a1206' : '#0a1f13'}
                />
                <path
                  d="M2 24 q0 -6 8 -6 q8 0 8 6 v38 q0 4 -4 4 h-8 q-4 0 -4 -4z"
                  fill={i % 2 ? '#8a4a1c' : '#2f6b47'}
                />
                <path d="M4 26 v34" stroke="#ffffff33" strokeWidth="2" />
                <rect x="4" y="34" width="12" height="14" fill="#f3e6c8" opacity=".85" />
              </g>
            ))}
            {[130, 170, 210].map((x, i) => (
              <g key={x}>
                <path
                  d={`M${x} 62 q0 -14 22 -14 q22 0 22 14z`}
                  fill={i === 1 ? '#f5efe4' : '#e8dcc8'}
                />
                <path d={`M${x + 4} 50 q18 -6 36 0`} stroke="#c0392b" strokeWidth="2" fill="none" />
              </g>
            ))}
            <rect x="250" y="40" width="30" height="26" rx="3" fill="#1f3c88" />
            <rect x="254" y="46" width="22" height="10" fill="#f3e6c8" />
          </svg>
          <div className="shelf-board" />
          {cat && <div className="rest-cat">{cat}</div>}
        </div>
        <div className="rest-wall-shade" />
      </div>
      <div className={`rest-floor ${decor.floor}`}>
        <div className="rest-floor-tex" />
        <div className="rest-floor-shade" />
      </div>
      <div className="rest-baseboard" />
      <div className="noren rest-noren">
        {['N', 'O', 'D', 'D', 'L', 'E', 'S'].map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </div>
      <Lamps kind={decor.lamps} />
      {n >= 4 && (
        <>
          <Table look={looks[2]} className="far l" />
          <Table look={looks[3]} className="far r" />
        </>
      )}
      <Plant kind={decor.plants} />
      <Special kind={decor.special} />
      {n >= 2 && (
        <>
          <Table look={looks[0]} className="near l" />
          <Table look={looks[1]} className="near r" />
        </>
      )}
      <CounterDecor kind={decor.counter} />
      <div className="rest-vignette" />
    </div>
  );
}
