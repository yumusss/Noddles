import type React from 'react';
import { useId, useMemo, type CSSProperties } from 'react';
import { Avatar } from '../avatar';
import { CatArt, randomLook, type Look } from '../art';
import { tableCount, type Decor } from '../decor';
import type { DayTime, Weather } from '../data';

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
        <div className="shelf-board" />
      </div>
      <Lanterns count={3} />
    </div>
  );
}

/* =====================================================================
   RESTAURANT — the salon behind the counter, driven by the decoration set
   and the level's time of day / weather. Styles live in src/decor.css.
   Palette: see ART_DIRECTION.md (cream, oak, walnut, clay, matcha, indigo).
   ===================================================================== */

const GUEST_SEEDS = [4821, 90133, 27719, 61207];

/* ---------- the street outside the window ---------- */

function StreetScene({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 120 160" preserveAspectRatio="xMidYMax slice" className="rw-scene">
      <defs>
        <linearGradient id={`${id}sky`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--sky-a)' }} />
          <stop offset=".55" style={{ stopColor: 'var(--sky-b)' }} />
          <stop offset="1" style={{ stopColor: 'var(--sky-c)' }} />
        </linearGradient>
        <linearGradient id={`${id}road`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c7b8a3" />
          <stop offset="1" stopColor="#a8998a" />
        </linearGradient>
      </defs>
      <rect width="120" height="160" fill={`url(#${id}sky)`} />
      {/* clouds (only in grey weather) */}
      <g className="rw-clouds" fill="#ffffff" opacity=".85">
        <ellipse cx="30" cy="34" rx="22" ry="8" />
        <ellipse cx="44" cy="30" rx="14" ry="9" />
        <ellipse cx="92" cy="52" rx="20" ry="7" />
        <ellipse cx="82" cy="48" rx="11" ry="8" />
      </g>
      {/* distant pale block */}
      <rect x="-4" y="88" width="130" height="50" fill="#d8cfc4" />
      {/* shop fronts */}
      <g>
        <rect x="-2" y="82" width="42" height="52" fill="#e9c9b7" />
        <rect x="-2" y="82" width="42" height="4" fill="#d9b19d" />
        <rect x="6" y="94" width="10" height="12" rx="1" className="rw-win" />
        <rect x="22" y="94" width="10" height="12" rx="1" className="rw-win" />
        <path
          d="M-2 110 h42 v6 q-3 4 -6 0 q-3 4 -6 0 q-3 4 -6 0 q-3 4 -6 0 q-3 4 -6 0 q-3 4 -6 0 q-3 4 -6 0z"
          fill="#c8553d"
        />
        <rect x="8" y="118" width="8" height="16" fill="#8a6144" />
        <rect x="22" y="118" width="12" height="12" className="rw-win" />

        <rect x="40" y="74" width="40" height="60" fill="#f1e4cc" />
        <rect x="40" y="74" width="40" height="3" fill="#dccbae" />
        <rect x="46" y="84" width="28" height="16" rx="1.5" className="rw-win" />
        <path d="M46 88 h28 M60 84 v16" stroke="#f1e4cc" strokeWidth="1.4" />
        <rect x="44" y="106" width="32" height="5" rx="1" fill="#7b4f2e" />
        <rect x="48" y="116" width="24" height="18" rx="1" className="rw-win" />
        <path d="M60 116 v18" stroke="#f1e4cc" strokeWidth="1.4" />

        <rect x="80" y="86" width="44" height="48" fill="#cfd8c6" />
        <rect x="80" y="86" width="44" height="3" fill="#b9c4ae" />
        <rect x="86" y="96" width="10" height="12" rx="1" className="rw-win" />
        <rect x="104" y="96" width="10" height="12" rx="1" className="rw-win" />
        <path
          d="M80 112 h44 v5 q-2.5 3 -5 0 q-2.5 3 -5 0 q-2.5 3 -5 0 q-2.5 3 -5 0 q-2.5 3 -5 0 q-2.5 3 -5 0 q-2.5 3 -5 0 q-2.5 3 -5 0z"
          fill="#7c9a6e"
        />
        <rect x="90" y="120" width="22" height="14" className="rw-win" />
      </g>
      {/* street */}
      <rect x="0" y="134" width="120" height="26" fill={`url(#${id}road)`} />
      <rect x="0" y="134" width="120" height="3" fill="#e2d8ca" />
      {/* tree */}
      <path
        d="M100 150 q2 -16 -1 -32"
        stroke="#6b4a32"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="98" cy="104" r="18" fill="#6f8a63" />
      <circle cx="90" cy="112" r="12" fill="#8aa57c" />
      <circle cx="108" cy="112" r="11" fill="#7c9a6e" />
      <circle cx="96" cy="96" r="9" fill="#9bb48a" />
      {/* dusk / night dimming of the street */}
      <rect width="120" height="160" fill="#2a2d55" className="rw-dim" />
    </svg>
  );
}

/* ---------- wall art ---------- */

export function BigArt({ kind }: { kind: string }) {
  const id = useId().replace(/:/g, '');
  if (kind === 'bigart_fuji')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <defs>
          <linearGradient id={`${id}s`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fbeee0" />
            <stop offset=".6" stopColor="#f0d3c6" />
            <stop offset="1" stopColor="#e5d8cf" />
          </linearGradient>
        </defs>
        <rect width="200" height="150" fill={`url(#${id}s)`} />
        <circle cx="148" cy="44" r="18" fill="#d9806a" />
        <ellipse cx="44" cy="70" rx="26" ry="5" fill="#fff8ef" opacity=".9" />
        <ellipse cx="156" cy="88" rx="30" ry="5" fill="#fff8ef" opacity=".8" />
        <path d="M-10 134 L74 48 Q100 36 126 48 L210 134Z" fill="#4a5a80" />
        <path d="M100 42 L126 48 L210 134 L100 134Z" fill="#3b4a6b" opacity=".6" />
        <path d="M74 48 Q100 36 126 48 L120 60 L111 54 L100 64 L90 56 L80 62Z" fill="#fbf7f0" />
        <path d="M-10 150 Q50 118 120 128 T210 150Z" fill="#8aa57c" />
        <path d="M-10 150 Q30 136 70 142 T210 150Z" fill="#6f8a63" />
        <path
          d="M34 142 l5 -14 l5 14z M48 144 l4 -10 l4 10z M160 140 l6 -16 l6 16z"
          fill="#4f6e45"
        />
      </svg>
    );
  if (kind === 'bigart_wave')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <rect width="200" height="150" fill="#ece2d2" />
        <circle cx="152" cy="42" r="14" fill="#e8803c" opacity=".85" />
        <path d="M60 110 L110 82 L170 110Z" fill="#c9c2b3" opacity=".8" />
        <path d="M0 150 C36 136 82 128 200 150Z" fill="#5b6b8f" />
        <path
          d="M-4 150 V92 C26 60 66 40 116 50 C148 56 170 36 182 20 C170 46 154 60 150 72 C136 68 126 82 118 94 C102 72 72 80 62 102 C42 96 22 122 -4 150Z"
          fill="#3b4a6b"
        />
        <path d="M0 150 V110 C24 92 50 86 74 100 C56 102 34 116 24 150Z" fill="#2f3c58" />
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
          <circle key={i} cx={x} cy={y} r={r} fill="#f6efe4" />
        ))}
        <path
          d="M100 56 q10 10 4 24 M60 96 q6 8 2 18"
          stroke="#f6efe4"
          strokeWidth="2"
          fill="none"
          opacity=".8"
        />
      </svg>
    );
  if (kind === 'bigart_koi')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <defs>
          <linearGradient id={`${id}p`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#465680" />
            <stop offset="1" stopColor="#2f3b58" />
          </linearGradient>
        </defs>
        <rect width="200" height="150" fill={`url(#${id}p)`} />
        {[
          [50, 50, 30],
          [50, 50, 46],
          [150, 100, 26],
          [150, 100, 40],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="none" stroke="#ffffff1f" strokeWidth="2" />
        ))}
        <circle cx="166" cy="34" r="20" fill="#7c9a6e" />
        <path d="M166 34 L186 26 L186 42Z" fill="#3f4d70" />
        <circle cx="30" cy="120" r="16" fill="#8aa57c" />
        <path d="M30 120 L46 114 L46 126Z" fill="#33405f" />
        <circle cx="172" cy="30" r="4" fill="#e9b8b2" />
        <g transform="rotate(-22 76 72)">
          <path d="M44 72 q-12 -14 -18 -4 q6 2 6 4 q0 2 -6 4 q6 10 18 -4z" fill="#f6efe4" />
          <ellipse cx="76" cy="72" rx="30" ry="12" fill="#f6efe4" />
          <circle cx="68" cy="68" r="7" fill="#e8803c" />
          <circle cx="88" cy="75" r="5" fill="#e8803c" />
          <circle cx="98" cy="70" r="1.8" fill="#2b2420" />
        </g>
        <g transform="rotate(18 128 100)">
          <path d="M100 100 q-10 -12 -16 -3 q5 2 5 3 q0 1 -5 3 q6 9 16 -3z" fill="#e8803c" />
          <ellipse cx="128" cy="100" rx="26" ry="10" fill="#e8803c" />
          <circle cx="124" cy="98" r="5" fill="#f6efe4" />
          <circle cx="146" cy="98" r="1.6" fill="#2b2420" />
        </g>
      </svg>
    );
  if (kind === 'bigart_cranes')
    return (
      <svg viewBox="0 0 200 150" className="art-svg">
        <defs>
          <linearGradient id={`${id}c`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#f6efe4" />
            <stop offset="1" stopColor="#ead9c2" />
          </linearGradient>
        </defs>
        <rect width="200" height="150" fill={`url(#${id}c)`} />
        <circle cx="52" cy="52" r="24" fill="#c8553d" />
        <path
          d="M200 150 q-30 -40 -60 -34 q20 4 32 20 q-24 -6 -40 10 q20 -2 36 10z"
          fill="#7b4f2e"
        />
        {[150, 162, 174, 186].map((x, i) => (
          <circle key={i} cx={x} cy={126 - (i % 2) * 8} r="9" fill="#6f8a63" />
        ))}
        {[
          { t: '', s: 1 },
          { t: 'translate(-60 30) scale(.7)', s: 0.7 },
        ].map((g, i) => (
          <g key={i} transform={g.t || undefined}>
            <ellipse cx="110" cy="82" rx="30" ry="12" fill="#fbf7f0" />
            <path d="M84 84 q-16 -2 -26 12 q14 -4 28 -2z" fill="#2b2420" />
            <path
              d="M98 76 q-10 -18 10 -30 q6 -4 10 -8"
              stroke="#fbf7f0"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="119" cy="37" r="6" fill="#fbf7f0" />
            <circle cx="118" cy="32" r="2.5" fill="#c8553d" />
            <path d="M124 38 l12 3 l-12 2z" fill="#2b2420" />
            {i === 0 && <path d="M112 72 q22 -18 46 -16 q-18 6 -30 22z" fill="#fbf7f0" />}
            {i === 0 && <path d="M140 60 q10 -4 18 -4 q-8 6 -14 12z" fill="#2b2420" />}
            <path d="M104 94 v30 M116 94 v30" stroke="#2b2420" strokeWidth="2" />
          </g>
        ))}
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
      <div
        className="sart poster"
        style={{ background: 'linear-gradient(#f8f1e6, #dfc9ac)', color: '#5c4332' }}>
        <CatArt size={46} />
        <b style={{ color: '#5c4332' }}>MOCHI</b>
      </div>
    );
  if (kind === 'smallart_sakura')
    return (
      <div className="sart paper">
        <svg viewBox="0 0 100 120" className="art-svg">
          <path
            d="M10 112 q30 -40 76 -70"
            stroke="#7b4f2e"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M40 86 q10 -14 8 -26 M62 68 q14 -4 24 -14"
            stroke="#7b4f2e"
            strokeWidth="2.5"
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
                  fill="#e9b8b2"
                  transform={`rotate(${a})`}
                />
              ))}
              <circle r="2" fill="#c8553d" />
            </g>
          ))}
        </svg>
      </div>
    );
  return null;
}

/* ---------- lamps (glow follows --glow, 0 by day, 1 at night) ---------- */

export function Lamps({ kind }: { kind: string }) {
  if (kind === 'lamps_paper')
    return (
      <div className="rest-lamps paper">
        {[0, 1].map((i) => (
          <div key={i} className="pend" style={{ animationDelay: `${i * 1.3}s` }}>
            <i className="cord" />
            <b className="globe">
              <i className="glow" />
            </b>
          </div>
        ))}
      </div>
    );
  if (kind === 'lamps_edison')
    return (
      <div className="rest-lamps edison">
        {[0, 1].map((i) => (
          <div key={i} className="pend" style={{ height: `${i === 1 ? 62 : 72}%` }}>
            <i className="cord" />
            <b className="bulb">
              <i className="glow" />
            </b>
          </div>
        ))}
      </div>
    );
  if (kind === 'lamps_festival')
    return (
      <div className="rest-lamps festival">
        <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="garland">
          <path d="M0 0 Q50 10 100 0" stroke="#5a4a3a" strokeWidth=".6" fill="none" />
        </svg>
        {['#c8553d', '#d9a441', '#7c9a6e', '#e9b8b2', '#3b4a6b', '#e8803c', '#c8553d'].map(
          (c, i) => (
            <div
              key={i}
              className="fest"
              style={
                {
                  '--c': c,
                  left: `${7 + i * 14.2}%`,
                  marginTop: `${Math.sin((i / 6) * Math.PI) * 7}%`,
                } as CSSProperties
              }>
              <i className="glow" />
            </div>
          )
        )}
      </div>
    );
  return (
    <div className="rest-lamps red">
      {[0, 1].map((i) => (
        <div key={i} className="rlamp" style={{ animationDelay: `${i * 0.8}s` }}>
          <i className="cord" />
          <b className="paper">
            <span>{['麺', '福'][i]}</span>
            <i className="glow" />
          </b>
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
        {[22, 40, 58].map((x, i) => (
          <g key={x}>
            <rect
              x={x - 4}
              y={20 + i * 14}
              width="8"
              height={150 - i * 14}
              rx="3"
              fill={i === 1 ? '#86a176' : '#9bb48a'}
            />
            {[0, 1, 2, 3].map((k) => (
              <rect
                key={k}
                x={x - 5}
                y={50 + i * 8 + k * 32}
                width="10"
                height="2.5"
                rx="1"
                fill="#6f8a63"
              />
            ))}
            <path d={`M${x} ${40 + i * 20} q14 -10 24 -2 q-12 2 -24 2z`} fill="#8aa57c" />
            <path d={`M${x} ${86 + i * 10} q-16 -10 -26 -2 q12 2 26 2z`} fill="#7c9a6e" />
          </g>
        ))}
        <path d="M14 168 h52 l-5 30 h-42z" fill="#e9dcc6" />
        <path d="M14 168 h52 l-5 30 h-20z" fill="#d9c4a3" opacity=".5" />
        <rect x="12" y="164" width="56" height="7" rx="2" fill="#f6efe4" />
      </svg>
    );
  if (kind === 'plants_bonsai')
    return (
      <svg viewBox="0 0 120 150" className="rest-plant bonsai">
        <path d="M22 118 h76 l-6 24 h-64z" fill="#3b4a6b" />
        <path d="M60 118 h38 l-6 24 h-32z" fill="#2f3b58" opacity=".6" />
        <rect x="18" y="112" width="84" height="8" rx="3" fill="#56689a" />
        <path
          d="M58 112 q-4 -24 -18 -40 q10 4 16 14 q0 -20 10 -34 q2 16 -2 30 q8 -10 24 -12 q-14 8 -18 22 q2 10 -4 20z"
          fill="#7b4f2e"
        />
        {[
          [30, 62, 20, 11, '#6f8a63'],
          [66, 36, 22, 12, '#7c9a6e'],
          [92, 58, 18, 10, '#6f8a63'],
          [52, 50, 16, 9, '#8aa57c'],
        ].map(([x, y, rx, ry, c], i) => (
          <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={String(c)} />
        ))}
      </svg>
    );
  if (kind === 'plants_monstera')
    return (
      <svg viewBox="0 0 140 200" className="rest-plant monstera">
        <path d="M42 160 h56 l-6 38 h-44z" fill="#c8553d" />
        <path d="M70 160 h28 l-6 38 h-22z" fill="#a8452f" opacity=".5" />
        <rect x="38" y="156" width="64" height="8" rx="3" fill="#dc7a62" />
        {[
          [70, 150, 30, 70, -30],
          [70, 150, 110, 80, 30],
          [70, 150, 60, 36, -8],
          [70, 150, 96, 120, 14],
        ].map(([sx, sy, ex, ey, rot], i) => (
          <g key={i}>
            <path
              d={`M${sx} ${sy} Q${(sx + ex) / 2} ${ey + 20} ${ex} ${ey}`}
              stroke="#5f7f58"
              strokeWidth="3.5"
              fill="none"
            />
            <g transform={`translate(${ex} ${ey}) rotate(${rot})`}>
              <path
                d="M0 0 q-26 -10 -30 -34 q4 -22 30 -28 q26 6 30 28 q-4 24 -30 34z"
                fill={i % 2 ? '#7c9a6e' : '#6f8a63'}
              />
              <path
                d="M0 -6 q-14 -6 -16 -20 M0 -6 q14 -6 16 -20 M0 -6 v-44"
                stroke="#4f6e45"
                strokeWidth="2.5"
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
          <g fill="none" strokeWidth="4" strokeLinecap="round">
            <path d="M14 40 h92 q-4 30 -46 30 q-42 0 -46 -30z" stroke="#ffd3a1" />
            <path d="M30 40 L96 6 M40 40 L104 14" stroke="#ff9fbf" />
            <path
              d="M44 28 q-6 -8 0 -16 M60 26 q-6 -8 0 -16 M76 28 q-6 -8 0 -16"
              stroke="#ffd3a1"
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
        <ellipse cx="50" cy="105" rx="30" ry="4" fill="#2b242033" />
        <path d="M22 100 q-6 -40 28 -42 q34 2 28 42z" fill="#f6efe4" />
        <path d="M50 58 q34 2 28 42 h-22 q4 -30 -6 -42z" fill="#e6dac7" opacity=".7" />
        <ellipse cx="50" cy="82" rx="15" ry="17" fill="#fff8ee" />
        <g className="maneki-paw">
          <path d="M70 70 q6 -30 4 -42 q-10 4 -12 16 q-4 14 0 26z" fill="#f6efe4" />
          <circle cx="73" cy="29" r="8" fill="#f6efe4" />
          <circle cx="70" cy="26" r="2" fill="#e9b8b2" />
          <circle cx="76" cy="26" r="2" fill="#e9b8b2" />
        </g>
        <circle cx="46" cy="44" r="22" fill="#f6efe4" />
        <path d="M26 34 l2 -18 l14 10z M66 34 l-2 -16 l-14 8z" fill="#f6efe4" />
        <path d="M30 32 l1 -10 l8 6z M62 31 l-1 -9 l-8 5z" fill="#e9b8b2" />
        <path d="M24 60 q22 -8 44 0 q-2 -10 -22 -10 q-20 0 -22 10z" fill="#e6dac7" opacity=".6" />
        <path
          d="M34 42 q4 -4 8 0 M52 42 q4 -4 8 0"
          stroke="#2b2420"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="46" cy="50" r="2" fill="#c8553d" />
        <path d="M40 54 q6 4 12 0" stroke="#2b2420" strokeWidth="1.4" fill="none" />
        <path d="M24 64 q22 -10 44 0 l-2 6 q-20 -8 -40 0z" fill="#c8553d" />
        <circle cx="46" cy="68" r="4.5" fill="#d9a441" />
        <rect
          x="26"
          y="78"
          width="24"
          height="18"
          rx="4"
          fill="#d9a441"
          transform="rotate(-10 38 87)"
        />
        <text
          x="32"
          y="92"
          fontSize="9"
          fontWeight="800"
          fill="#7b4f2e"
          transform="rotate(-10 38 87)">
          福
        </text>
      </svg>
    );
  if (kind === 'counter_ikebana')
    return (
      <svg viewBox="0 0 100 120" className="rest-counter ikebana">
        <ellipse cx="50" cy="115" rx="26" ry="3.5" fill="#2b242033" />
        <path d="M30 86 h40 l-4 28 h-32z" fill="#3b4a6b" />
        <path d="M52 86 h18 l-4 28 h-14z" fill="#2f3b58" opacity=".6" />
        <rect x="26" y="82" width="48" height="7" rx="2" fill="#56689a" />
        <path
          d="M50 84 q-6 -30 -24 -48 M50 84 q4 -36 20 -56 M50 84 q10 -20 34 -26"
          stroke="#7b4f2e"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M50 84 q-2 -30 6 -56"
          stroke="#6f8a63"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M56 40 q10 -8 8 -22 q-8 8 -8 22z M44 60 q-12 -4 -14 -18 q10 4 14 18z"
          fill="#7c9a6e"
        />
        {[
          [26, 38, '#e9b8b2'],
          [70, 28, '#d9a441'],
          [84, 58, '#e9b8b2'],
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
                transform={`rotate(${a})`}
              />
            ))}
            <circle r="2" fill="#e8803c" />
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
                fill={['#e8803c', '#f6efe4', '#e9b8b2'][i]}
              />
              <path d="M26 10 l10 -7 v14z" fill={['#e8803c', '#f6efe4', '#e9b8b2'][i]} />
              <circle cx="10" cy="8" r="1.5" fill="#2b2420" />
            </svg>
          ))}
          {[0, 1, 2, 3].map((i) => (
            <i
              key={i}
              className="aq-bubble"
              style={{ left: `${18 + i * 20}%`, animationDelay: `${i * 0.9}s` }}
            />
          ))}
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="aq-floor">
            <path d="M0 30 V18 q20 -8 40 0 q20 8 60 -4 V30z" fill="#d9c4a3" />
            <path
              d="M10 20 q4 -14 8 0 M18 22 q4 -18 8 0 M80 16 q4 -12 8 0"
              stroke="#7c9a6e"
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

/* ---------- fixed furniture: shelf, pass, menu, window ---------- */

function Ceramics() {
  return (
    <svg viewBox="0 0 300 90" preserveAspectRatio="xMidYMax meet" className="shelf-svg">
      {/* tall vase */}
      <path d="M34 78 q-14 -10 -10 -36 q2 -14 12 -20 h6 q10 6 12 20 q4 26 -10 36z" fill="#7c9a6e" />
      <path d="M44 78 q10 -10 8 -36 q-2 -14 -10 -20 h-2 q10 6 12 20 q4 26 -10 36z" fill="#6f8a63" />
      <rect x="34" y="18" width="12" height="5" rx="1.5" fill="#8aa57c" />
      {/* stacked bowls */}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(0 ${-i * 11})`}>
          <path d="M96 78 q-2 -16 22 -16 q24 0 22 16z" fill={i === 1 ? '#f6efe4' : '#ece2d2'} />
          <path d="M98 64 q20 -4 40 0" stroke="#3b4a6b" strokeWidth="2.4" fill="none" />
          <path d="M118 78 q22 -2 22 -16 q-6 10 -22 16z" fill="#d9c4a3" opacity=".45" />
        </g>
      ))}
      {/* teapot */}
      <ellipse cx="186" cy="64" rx="22" ry="15" fill="#c8553d" />
      <ellipse cx="180" cy="60" rx="12" ry="8" fill="#dc7a62" opacity=".6" />
      <path
        d="M206 58 q12 -2 10 -14"
        stroke="#c8553d"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M176 46 q10 -14 20 0" stroke="#c8553d" strokeWidth="4" fill="none" />
      <rect x="178" y="46" width="16" height="5" rx="2" fill="#a8452f" />
      <circle cx="186" cy="45" r="3" fill="#d9a441" />
      {/* small bottle */}
      <path d="M246 78 v-30 q0 -6 6 -6 h8 q6 0 6 6 v30z" fill="#3b4a6b" />
      <path d="M258 78 v-30 q0 -6 -2 -6 h4 q6 0 6 6 v30z" fill="#2f3b58" opacity=".7" />
      <rect x="250" y="34" width="12" height="9" rx="2" fill="#56689a" />
      <rect x="248" y="56" width="12" height="12" fill="#f6efe4" opacity=".9" />
    </svg>
  );
}

function PassWindow() {
  return (
    <div className="rest-pass">
      <div className="rp-open">
        <div className="rp-light" />
        <svg viewBox="0 0 140 100" preserveAspectRatio="xMidYMax meet" className="rp-pot">
          <defs>
            <linearGradient id="rp-steel" x1="0" x2="1">
              <stop offset="0" stopColor="#8f949a" />
              <stop offset=".4" stopColor="#d6d9dc" />
              <stop offset="1" stopColor="#9a9fa5" />
            </linearGradient>
          </defs>
          <g className="rp-steam">
            <path
              d="M58 40 q-6 -10 0 -20 q6 -10 0 -20"
              stroke="#fff"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M80 44 q-6 -10 0 -20 q6 -10 0 -20"
              stroke="#fff"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          </g>
          <rect x="30" y="46" width="80" height="48" rx="8" fill="url(#rp-steel)" />
          <rect x="30" y="46" width="80" height="6" rx="3" fill="#e8eaec" />
          <path d="M22 56 h8 M110 56 h8" stroke="#8f949a" strokeWidth="6" strokeLinecap="round" />
          <ellipse cx="70" cy="46" rx="40" ry="6" fill="#c4c8cc" />
          <path
            d="M14 20 v40 q0 8 8 8 q8 0 8 -8"
            stroke="#7b4f2e"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div className="rp-tiles" />
      </div>
      <div className="rp-rail">
        <i />
        <i />
        <i />
      </div>
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
          stroke="#f6efe4"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <small>{menu}</small>
      <svg viewBox="0 0 60 34" className="rm-doodle">
        <g fill="none" stroke="#f6efe4" strokeWidth="2" strokeLinecap="round">
          <path d="M8 16 h44 q-2 14 -22 14 q-20 0 -22 -14z" />
          <path d="M18 16 l24 -12 M24 16 l24 -10" />
          <path d="M24 10 q-3 -4 0 -8 M32 8 q-3 -4 0 -8" opacity=".7" />
        </g>
      </svg>
    </div>
  );
}

/* ---------- tables ---------- */

function Table({ look, className }: { look: Look; className?: string }) {
  return (
    <div className={`rest-table ${className ?? ''}`}>
      <svg viewBox="0 0 200 60" className="rt-chair">
        <rect x="52" y="4" width="96" height="48" rx="12" fill="#8a6144" />
        <rect x="60" y="10" width="80" height="36" rx="9" fill="#9d7050" />
      </svg>
      <div className="rt-guest">
        <Avatar look={look} mood="happy" size={90} eating />
      </div>
      <svg viewBox="0 0 200 120" className="rt-table">
        <defs>
          <linearGradient id="rt-top" x1="0" x2="1">
            <stop offset="0" stopColor="#dcb98c" />
            <stop offset=".6" stopColor="#c99a66" />
            <stop offset="1" stopColor="#b6834f" />
          </linearGradient>
        </defs>
        {/* side chair (right) */}
        <rect x="156" y="40" width="34" height="50" rx="6" fill="#8a6144" />
        <rect x="160" y="70" width="26" height="6" rx="2" fill="#6b4a32" />
        <path d="M160 90 v18 M186 90 v18" stroke="#6b4a32" strokeWidth="3" strokeLinecap="round" />
        {/* table */}
        <ellipse cx="100" cy="70" rx="88" ry="22" fill="#9a6f44" />
        <ellipse cx="100" cy="66" rx="88" ry="22" fill="url(#rt-top)" />
        <rect x="92" y="84" width="16" height="26" fill="#7b4f2e" />
        <ellipse cx="100" cy="110" rx="30" ry="6" fill="#6b4a32" />
        <ellipse cx="100" cy="108" rx="30" ry="5" fill="#8a6144" />
        {/* bowl */}
        <ellipse cx="76" cy="64" rx="22" ry="8" fill="#2b242022" />
        <path d="M54 58 q0 12 22 12 q22 0 22 -12z" fill="#ece2d2" />
        <path d="M76 70 q22 0 22 -12 q-6 8 -22 12z" fill="#d9c4a3" opacity=".5" />
        <ellipse cx="76" cy="58" rx="22" ry="7" fill="#f6efe4" />
        <ellipse cx="76" cy="58" rx="18" ry="5" fill="#e3b96b" />
        <path d="M62 58 q14 -4 28 0" stroke="#3b4a6b" strokeWidth="1.6" fill="none" />
        <path
          d="M86 60 l26 -14 M90 62 l26 -12"
          stroke="#7b4f2e"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <g className="rt-steam">
          <path
            d="M70 50 q-3 -6 0 -12 M78 50 q-3 -6 0 -12"
            stroke="#fff"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </g>
        {/* teapot + cup */}
        <ellipse cx="128" cy="58" rx="11" ry="9" fill="#7c9a6e" />
        <ellipse cx="125" cy="55" rx="5" ry="3.5" fill="#9bb48a" opacity=".7" />
        <path
          d="M138 56 q6 -2 5 -8"
          stroke="#7c9a6e"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M122 50 q6 -8 12 0" stroke="#7c9a6e" strokeWidth="2.6" fill="none" />
        <circle cx="128" cy="49" r="1.8" fill="#d9a441" />
        <path d="M144 66 q0 6 6 6 q6 0 6 -6z" fill="#f6efe4" />
        <ellipse cx="150" cy="66" rx="6" ry="2.2" fill="#9bb48a" />
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
  const id = useId().replace(/:/g, '');
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
          <StreetScene id={id} />
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
          <div className="shelf-board" />
          {cat && <div className="rest-cat">{cat}</div>}
        </div>
        <div className="rest-smallart">
          <SmallArt kind={decor.smallart} />
        </div>
        <MenuBoard menu={menu} />
        <PassWindow />
      </div>
      <div className={`rest-floor ${decor.floor}`}>
        <div className="rest-floor-tex" />
        <div className="rest-floor-shade" />
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
          <Table look={looks[0]} className="near l" />
          <Table look={looks[1]} className="near r" />
        </>
      )}
      <Plant kind={decor.plants} />
      <Special kind={decor.special} />
      <div className="rest-tint" />
      <div className="rest-pools" />
      <Lamps kind={decor.lamps} />
      <CounterDecor kind={decor.counter} />
      <div className="rest-vignette" />
    </div>
  );
}
