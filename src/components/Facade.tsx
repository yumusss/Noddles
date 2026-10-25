import type { TimeOfDay } from './Restaurant';

// The Noddles shop from the street: a little Kyoto-style machiya with a tiled roof,
// wooden lattice, indigo noren, a hanging sign, plants, a bench and a sakura tree.

const SKY: Record<TimeOfDay, [string, string, string]> = {
  sabah: ['#bfe0f0', '#e6f1f2', '#fbe7d4'],
  ogle: ['#8fc6ea', '#c6e4f2', '#eef6f4'],
  gunbatimi: ['#b7a0cf', '#f2a98b', '#fbd9a6'],
  aksam: ['#28305c', '#5b5a92', '#d99a86'],
};

export default function Facade({
  tod = 'ogle',
  rain = false,
}: {
  tod?: TimeOfDay;
  rain?: boolean;
}) {
  const [s0, s1, s2] = SKY[tod];
  const night = tod === 'aksam';
  const glow = night ? 1 : tod === 'gunbatimi' ? 0.75 : 0.35;
  const sunY = tod === 'sabah' ? 250 : tod === 'ogle' ? 150 : tod === 'gunbatimi' ? 380 : 140;
  return (
    <svg className="facade" viewBox="0 0 800 900" preserveAspectRatio="xMidYMax slice">
      <defs>
        <linearGradient id="f-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={rain ? '#9aa7b4' : s0} />
          <stop offset=".55" stopColor={rain ? '#c3ccd3' : s1} />
          <stop offset="1" stopColor={rain ? '#dfe3e4' : s2} />
        </linearGradient>
        <linearGradient id="f-plaster" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fbf4e6" />
          <stop offset="1" stopColor="#efe2cc" />
        </linearGradient>
        <linearGradient id="f-wood" x1="0" x2="1">
          <stop offset="0" stopColor="#8a5e3e" />
          <stop offset=".5" stopColor="#a5744e" />
          <stop offset="1" stopColor="#875b3b" />
        </linearGradient>
        <radialGradient id="f-glow" cx=".5" cy=".6" r=".7">
          <stop offset="0" stopColor="#ffe2a8" />
          <stop offset="1" stopColor="#f2b56b" />
        </radialGradient>
        <linearGradient id="f-street" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={night ? '#6d6478' : '#d9cbb6'} />
          <stop offset="1" stopColor={night ? '#4a4356' : '#bfae96'} />
        </linearGradient>
        <pattern id="f-tile" width="34" height="22" patternUnits="userSpaceOnUse">
          <rect width="34" height="22" fill="#56606e" />
          <path d="M0 22 Q17 6 34 22" fill="#6b7686" />
          <path d="M0 22 Q17 6 34 22" stroke="#3f4752" strokeWidth="2" fill="none" />
        </pattern>
        <pattern id="f-lattice" width="12" height="40" patternUnits="userSpaceOnUse">
          <rect width="12" height="40" fill="#0000" />
          <rect x="0" width="6" height="40" fill="#8a5e3e" />
        </pattern>
        <pattern id="f-cobble" width="46" height="24" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="44" height="10" rx="4" fill="#fff" opacity=".12" />
          <rect x="-22" y="13" width="44" height="10" rx="4" fill="#fff" opacity=".1" />
          <rect x="24" y="13" width="44" height="10" rx="4" fill="#fff" opacity=".1" />
        </pattern>
      </defs>

      <rect width="800" height="900" fill="url(#f-sky)" />
      {/* sun / moon */}
      {!rain && (
        <g>
          <circle
            cx={night ? 620 : 600}
            cy={sunY}
            r="70"
            fill={night ? '#fff6dc' : '#fff4d6'}
            opacity=".25"
          />
          <circle
            cx={night ? 620 : 600}
            cy={sunY}
            r="40"
            fill={night ? '#fff3cf' : tod === 'gunbatimi' ? '#ffd18a' : '#fff8e4'}
          />
        </g>
      )}
      {night &&
        [
          [90, 80],
          [210, 150],
          [330, 60],
          [460, 120],
          [720, 220],
          [150, 260],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill="#fff" opacity=".8" className="f-star" />
        ))}
      {/* soft clouds */}
      {!night &&
        [
          [140, 170, 1],
          [420, 110, 0.8],
          [700, 300, 0.7],
        ].map(([x, y, k], i) => (
          <g
            key={i}
            className={`f-cloud c${i}`}
            opacity=".85"
            transform={`translate(${x} ${y}) scale(${k})`}>
            <ellipse cx="0" cy="0" rx="70" ry="20" fill="#fff" />
            <ellipse cx="-24" cy="-14" rx="34" ry="22" fill="#fff" />
            <ellipse cx="22" cy="-18" rx="30" ry="22" fill="#fff" />
          </g>
        ))}
      {/* distant hills + neighbour houses */}
      <path
        d="M0 520 Q140 440 300 500 T600 470 T800 500 V640 H0z"
        fill={night ? '#3e3f6b' : '#b9cdbf'}
        opacity=".8"
      />
      <g opacity=".95">
        <rect x="-10" y="430" width="150" height="230" fill={night ? '#5a5070' : '#e8d9c4'} />
        <path d="M-20 440 L65 390 L150 440z" fill={night ? '#3c3550' : '#7c8794'} />
        <rect
          x="30"
          y="480"
          width="50"
          height="60"
          fill={night ? '#f2c37a' : '#a9c4dc'}
          opacity=".8"
        />
        <rect x="660" y="420" width="160" height="240" fill={night ? '#5a5070' : '#efe0cb'} />
        <path d="M650 432 L740 380 L830 432z" fill={night ? '#3c3550' : '#7c8794'} />
        <rect
          x="700"
          y="470"
          width="56"
          height="70"
          fill={night ? '#f2c37a' : '#a9c4dc'}
          opacity=".8"
        />
      </g>

      {/* sakura tree on the left */}
      <g>
        <path
          d="M118 700 Q112 600 140 540 Q160 500 210 470"
          stroke="#6b4a36"
          strokeWidth="16"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M140 560 Q100 520 70 500"
          stroke="#6b4a36"
          strokeWidth="9"
          fill="none"
          strokeLinecap="round"
        />
        {[
          [210, 460, 54],
          [160, 470, 46],
          [80, 490, 44],
          [120, 430, 50],
          [250, 500, 38],
          [40, 530, 34],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? '#f7c6cf' : '#f3b3c0'} opacity=".95" />
        ))}
        {[...Array(14)].map((_, i) => (
          <circle
            key={'d' + i}
            cx={40 + ((i * 37) % 220)}
            cy={420 + ((i * 53) % 120)}
            r="5"
            fill="#fde3e8"
          />
        ))}
      </g>

      {/* the shop */}
      <g transform="translate(400 0)">
        {/* upper floor */}
        <rect x="-250" y="300" width="500" height="120" fill="url(#f-plaster)" />
        <rect x="-170" y="330" width="340" height="62" fill="url(#f-lattice)" opacity=".9" />
        <rect
          x="-170"
          y="330"
          width="340"
          height="62"
          fill="none"
          stroke="#6b4a36"
          strokeWidth="6"
        />
        {/* top roof */}
        <path
          d="M-290 312 Q-200 250 0 238 Q200 250 290 312 Q240 300 0 296 Q-240 300 -290 312z"
          fill="#3f4752"
        />
        <path
          d="M-270 306 Q-190 262 0 252 Q190 262 270 306 L250 312 Q0 300 -250 312z"
          fill="url(#f-tile)"
        />
        {/* hanging sign */}
        <g className="f-sign">
          <rect x="-112" y="268" width="224" height="58" rx="8" fill="#3b2a20" />
          <rect x="-104" y="274" width="208" height="46" rx="6" fill="#f6ead8" />
          <text
            x="0"
            y="308"
            textAnchor="middle"
            fontFamily="Fredoka, Nunito, sans-serif"
            fontWeight="800"
            fontSize="34"
            letterSpacing="6"
            fill="#c96a5a">
            NODDLES
          </text>
        </g>
        {/* lower eave */}
        <path d="M-300 440 Q0 404 300 440 L300 452 Q0 420 -300 452z" fill="#3f4752" />
        <path d="M-290 436 Q0 400 290 436 L280 420 Q0 392 -280 420z" fill="url(#f-tile)" />
        {/* ground floor */}
        <rect x="-250" y="446" width="500" height="254" fill="url(#f-plaster)" />
        <rect x="-250" y="446" width="14" height="254" fill="url(#f-wood)" />
        <rect x="236" y="446" width="14" height="254" fill="url(#f-wood)" />
        {/* left window with lattice */}
        <rect
          x="-222"
          y="480"
          width="140"
          height="150"
          fill="url(#f-glow)"
          opacity={0.55 + glow * 0.45}
        />
        <rect x="-222" y="480" width="140" height="150" fill="url(#f-lattice)" />
        <rect
          x="-222"
          y="480"
          width="140"
          height="150"
          fill="none"
          stroke="#6b4a36"
          strokeWidth="7"
        />
        {/* right window: steam & bowl silhouettes */}
        <rect
          x="82"
          y="480"
          width="140"
          height="150"
          fill="url(#f-glow)"
          opacity={0.55 + glow * 0.45}
        />
        <g opacity=".5">
          <path d="M110 600 q42 30 84 0z" fill="#8a5e3e" />
          <path
            d="M130 580 q8 -20 0 -40 M152 580 q8 -20 0 -40 M174 580 q8 -20 0 -40"
            stroke="#fff"
            strokeWidth="5"
            fill="none"
            className="f-steam"
          />
        </g>
        <rect x="82" y="480" width="140" height="150" fill="url(#f-lattice)" opacity=".6" />
        <rect
          x="82"
          y="480"
          width="140"
          height="150"
          fill="none"
          stroke="#6b4a36"
          strokeWidth="7"
        />
        {/* door + noren */}
        <rect
          x="-62"
          y="470"
          width="124"
          height="230"
          fill="url(#f-glow)"
          opacity={0.75 + glow * 0.25}
        />
        <rect
          x="-62"
          y="470"
          width="124"
          height="230"
          fill="none"
          stroke="#6b4a36"
          strokeWidth="8"
        />
        <g className="f-noren">
          {[-58, -18, 22].map((x, i) => (
            <g key={x}>
              <rect x={x} y="470" width="36" height="104" fill="#2f4a6b" />
              <text
                x={x + 18}
                y="530"
                textAnchor="middle"
                fontSize="24"
                fontWeight="900"
                fill="#f6ead8">
                {['麺', '処', '屋'][i]}
              </text>
            </g>
          ))}
          <rect x="-62" y="466" width="124" height="8" fill="#6b4a36" />
        </g>
        {/* paper lanterns */}
        {[-150, 150].map((x, i) => (
          <g key={x} className={`f-lantern l${i}`}>
            <line x1={x} y1="440" x2={x} y2="460" stroke="#3b2a20" strokeWidth="2" />
            <rect x={x - 22} y="458" width="44" height="6" rx="2" fill="#3b2a20" />
            <ellipse cx={x} cy="490" rx="26" ry="32" fill={night ? '#ffb37a' : '#f08a6c'} />
            <ellipse
              cx={x}
              cy="490"
              rx="26"
              ry="32"
              fill="none"
              stroke="#c9604c"
              strokeWidth="1.5"
              strokeDasharray="1 6"
            />
            <rect x={x - 22} y="518" width="44" height="6" rx="2" fill="#3b2a20" />
            {night && <ellipse cx={x} cy="490" rx="46" ry="52" fill="#ffb37a" opacity=".25" />}
          </g>
        ))}
        {/* menu chalkboard */}
        <g transform="translate(-200 600)">
          <path d="M0 100 L14 0 H86 L100 100" stroke="#6b4a36" strokeWidth="6" fill="none" />
          <rect
            x="10"
            y="4"
            width="80"
            height="62"
            rx="4"
            fill="#3d4a44"
            stroke="#8a5e3e"
            strokeWidth="5"
          />
          <text x="50" y="26" textAnchor="middle" fontSize="12" fontWeight="800" fill="#f6ead8">
            MENÜ
          </text>
          <path
            d="M22 38 h56 M22 50 h40"
            stroke="#f6ead8"
            strokeWidth="3"
            strokeLinecap="round"
            opacity=".8"
          />
        </g>
        {/* bench + plants */}
        <rect x="90" y="650" width="130" height="12" rx="3" fill="#8a5e3e" />
        <rect x="100" y="662" width="8" height="34" fill="#6b4a36" />
        <rect x="202" y="662" width="8" height="34" fill="#6b4a36" />
        {[248, -268].map((x) => (
          <g key={x} transform={`translate(${x} 640)`}>
            <path d="M-26 20 L-20 60 H20 L26 20z" fill="#c69c72" />
            {[-16, -6, 4, 14].map((d, i) => (
              <path
                key={d}
                d={`M${d / 2} 22 Q${d * 1.6} ${-10 - i * 6} ${d * 2} ${-30 - (i % 2) * 18}`}
                stroke="#5f8f6a"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
              />
            ))}
          </g>
        ))}
        {/* Mochi sitting by the door */}
        <g transform="translate(86 664)">
          <ellipse cx="0" cy="34" rx="22" ry="6" fill="#0002" />
          <path d="M-16 32 Q-20 4 0 0 Q20 4 16 32z" fill="#8a6a50" />
          <path d="M-8 32 Q-6 12 0 10 Q6 12 8 32z" fill="#fbf6ee" />
          <circle cx="0" cy="-6" r="13" fill="#8a6a50" />
          <path d="M-12 -12 L-10 -26 L-2 -16z M12 -12 L10 -26 L2 -16z" fill="#8a6a50" />
          <path d="M-5 -12 v5 M0 -13 v5 M5 -12 v5" stroke="#4f3a2b" strokeWidth="1.6" />
          <ellipse cx="0" cy="-1" rx="6" ry="4" fill="#fbf6ee" />
          <circle cx="-5" cy="-6" r="1.8" fill="#3b2a20" />
          <circle cx="5" cy="-6" r="1.8" fill="#3b2a20" />
          <path
            d="M16 28 Q34 24 28 6"
            stroke="#8a6a50"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            className="f-tail"
          />
        </g>
      </g>
      {/* street */}
      <rect x="0" y="700" width="800" height="200" fill="url(#f-street)" />
      <rect x="0" y="700" width="800" height="200" fill="url(#f-cobble)" />
      <rect x="0" y="698" width="800" height="6" fill="#a89478" />
      {[...Array(8)].map((_, i) => (
        <ellipse
          key={i}
          className="f-petal"
          style={{ animationDelay: `${i * 0.9}s` }}
          cx={60 + i * 95}
          cy={-10}
          rx="5"
          ry="3"
          fill="#f7c6cf"
        />
      ))}
    </svg>
  );
}
