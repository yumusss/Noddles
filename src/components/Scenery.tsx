import type React from 'react';

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
