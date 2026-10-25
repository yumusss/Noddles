import type { DecorState } from '../decor';

/** Little things that sit on the counter: a beckoning cat or an ikebana vase. */
export function CounterDeco({ decor }: { decor: DecorState }) {
  return (
    <>
      {decor.tezgah === 'tezgah-maneki' && (
        <div className="counter-deco2">
          <svg viewBox="0 0 80 100">
            <ellipse cx="40" cy="70" rx="28" ry="26" fill="#fff" stroke="#e0d6c8" strokeWidth="2" />
            <circle cx="40" cy="38" r="24" fill="#fff" stroke="#e0d6c8" strokeWidth="2" />
            <path
              d="M20 26 L22 8 L34 18z M60 26 L58 8 L46 18z"
              fill="#fff"
              stroke="#e0d6c8"
              strokeWidth="2"
            />
            <path d="M24 22 L24 13 L31 19z M56 22 L56 13 L49 19z" fill="#ffb3c6" />
            <path
              d="M30 38 q4 -4 8 0 M42 38 q4 -4 8 0"
              stroke="#222"
              strokeWidth="2.4"
              fill="none"
            />
            <path d="M37 46 l3 3 l3 -3" stroke="#222" strokeWidth="1.6" fill="none" />
            <path d="M18 58 h44" stroke="#c0392b" strokeWidth="5" />
            <circle cx="40" cy="64" r="6" fill="#ffd166" stroke="#c9a227" strokeWidth="1.5" />
            <ellipse
              cx="40"
              cy="82"
              rx="14"
              ry="10"
              fill="#ffd166"
              stroke="#c9a227"
              strokeWidth="2"
            />
            <text x="40" y="86" textAnchor="middle" fontSize="9" fontWeight="900" fill="#8a6a00">
              福
            </text>
            <g className="maneki-arm">
              <path
                d="M58 56 q12 -10 8 -30"
                stroke="#fff"
                strokeWidth="11"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M58 56 q12 -10 8 -30"
                stroke="#e0d6c8"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </svg>
        </div>
      )}
      {decor.tezgah === 'tezgah-cicek' && (
        <div className="counter-deco2">
          <svg viewBox="0 0 80 100">
            <path
              d="M40 92 L36 40 M40 92 L50 30 M40 92 L26 48"
              stroke="#2d6a4f"
              strokeWidth="3"
              fill="none"
            />
            {[
              [36, 38, '#e2557a'],
              [50, 28, '#f4a261'],
              [26, 46, '#ffffff'],
            ].map(([x, y, col], i) => (
              <g key={i} transform={`translate(${x} ${y})`}>
                {[0, 72, 144, 216, 288].map((a) => (
                  <ellipse
                    key={a}
                    cx="0"
                    cy="-7"
                    rx="5"
                    ry="8"
                    fill={col as string}
                    transform={`rotate(${a})`}
                  />
                ))}
                <circle r="3.5" fill="#ffd166" />
              </g>
            ))}
            <path d="M16 78 h48 l-6 20 h-36z" fill="#1f3c88" />
            <path d="M16 78 h48" stroke="#d4a017" strokeWidth="3" />
          </svg>
        </div>
      )}
    </>
  );
}
