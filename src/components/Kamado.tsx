import { useEffect, useId, useRef, useState } from 'react';
import { INGREDIENTS } from '../data';
import { THICK_W, type Thick } from '../food';
import '../kamado.css';

// v3 line-art Japanese kitchen corner: cream plaster wall, indigo wainscot, a
// noren and a paper lantern, a clay kamado hearth with a big copper pot of
// rolling water, and the tebo noodle basket on its long handle. Thin ink
// outlines, flat fills, one shadow tone + one highlight per shape. No
// gradients, no filters. Same props as before; brass dial in the lower right.

type Mode = 'idle' | 'boil' | 'lift';

interface Props {
  mode: Mode;
  noodle?: string;
  thick?: Thick;
  heat: number; // 0..1.3 cook progress
  dial?: boolean;
}

const INK = '#2b2420';
const CREAM = '#fff6e8';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
type RGB = [number, number, number];
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number): RGB =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
const css = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

/** deterministic strands laid across the basket mouth (12 regular waves) */
const STRANDS = Array.from({ length: 9 }, (_, i) => {
  const y = -14 + (i / 8) * 28;
  const ph = i * 1.1;
  let d = `M-70 ${y.toFixed(1)}`;
  for (let k = 1; k <= 5; k++) {
    const x0 = -70 + (k - 0.5) * 28;
    const x1 = -70 + k * 28;
    const cy = y + Math.sin(k * 2.1 + ph) * 6;
    d += ` Q${x0.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
});

/** outlined Ghibli-style steam cloud, centred on 0,0 (about 110 wide) */
const CLOUD =
  'M-48 12C-66 12-66-14-44-14C-40-40-4-44 8-24C28-40 60-22 52-2C70 2 66 24 46 22H-38C-58 22-60 14-48 12Z';

/** outlined flame tongue, tip at 0,-h, base on y=0 */
const flame = (h: number, w: number) =>
  `M${-w} 0C${-w * 1.3} ${-h * 0.35} ${-w * 0.5} ${-h * 0.55} 0 ${-h}C${w * 0.5} ${-h * 0.55} ${w * 1.3} ${-h * 0.35} ${w} 0Z`;

export default function Kamado({ mode, noodle, thick = 'orta', heat, dial = true }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (s: string) => `${uid}-${s}`;
  const url = (s: string) => `url(#${id(s)})`;

  const hot = mode !== 'idle';
  const raw = clamp((0.5 - heat) / 0.35, 0, 1);
  const burnt = clamp((heat - 1) / 0.3, 0, 1);
  const base = hex(INGREDIENTS[noodle ?? '']?.color ?? '#f6d27a');
  const tone = mix(mix(base, hex(CREAM), raw * 0.35), hex('#b39b78'), burnt * 0.55);
  const col = css(tone);
  const sw = THICK_W[thick] * 0.9 * (1 + 0.14 * (1 - raw)) * (1 + 0.25 * burnt);
  const flameA = hot ? 0.6 + clamp(heat, 0, 1.3) * 0.4 : 0.18;

  const style = {
    '--heat': clamp(heat, 0, 1.3),
    '--flame': flameA,
    '--steam': hot ? 1 : 0.4,
  } as React.CSSProperties;

  // portrait tablets: show more wall above the hearth; wide screens: fill
  const rootRef = useRef<HTMLDivElement>(null);
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setPortrait(r.width / Math.max(1, r.height) < 1.25);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const water = hot ? '#ece6d6' : '#cfd6cf';
  const waterEdge = hot ? '#c9bfa6' : '#9fada6';

  return (
    <div
      className={`kamado kd-${mode} ${portrait ? 'kd-portrait' : ''}`}
      style={style}
      ref={rootRef}>
      <svg
        className="kd-scene"
        viewBox={portrait ? '0 -200 960 760' : '0 0 960 560'}
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true">
        <defs>
          <clipPath id={id('waterClip')}>
            <ellipse cx="480" cy="290" rx="146" ry="31" />
          </clipPath>
          <clipPath id={id('basketClip')}>
            <ellipse cx="0" cy="0" rx="64" ry="19" />
          </clipPath>
        </defs>

        {/* ---------- wall ---------- */}
        <rect x="0" y="-200" width="960" height="760" fill="#ece2d2" />
        {/* one flat light area from the window on the left */}
        <path d="M0-200h470L300 250H0z" fill="#f6efe4" />
        {/* wainscot (indigo boards) */}
        <rect x="0" y="250" width="960" height="276" fill="#3b4a6b" />
        <path d="M0 250h960v22H0z" fill="#2e3a55" />
        <g stroke={INK} strokeOpacity="0.5" strokeWidth="1.4">
          <path d="M80 272v250M180 272v250M280 272v250M680 272v250M780 272v250M880 272v250" />
        </g>
        {/* dado rail */}
        <rect x="0" y="240" width="960" height="14" fill="#c4935b" />
        <rect x="0" y="240" width="960" height="4" fill="#d9b07a" />
        <rect
          x="0"
          y="240"
          width="960"
          height="14"
          fill="none"
          stroke={INK}
          strokeOpacity="0.85"
          strokeWidth="2"
        />
        {/* ceiling beam (only seen on portrait) */}
        <rect x="0" y="-40" width="960" height="30" fill="#7b4f2e" />
        <rect x="0" y="-40" width="960" height="8" fill="#9a6a44" />
        <path d="M0-10h960" stroke={INK} strokeOpacity="0.85" strokeWidth="2" />

        {/* floor */}
        <rect x="0" y="520" width="960" height="40" fill="#4a3a30" />
        <path d="M0 520h960" stroke={INK} strokeOpacity="0.85" strokeWidth="2" />
        <ellipse cx="480" cy="526" rx="270" ry="10" fill={INK} opacity="0.3" />

        {/* ---------- noren ---------- */}
        <g stroke={INK} strokeOpacity="0.85" strokeWidth="2" strokeLinejoin="round">
          <rect x="326" y="18" width="308" height="10" rx="5" fill="#7b4f2e" />
          <path d="M340 28h136v82q-22 10-44 2t-48 4t-44-6z" fill="#3b4a6b" />
          <path d="M484 28h136v82q-22 10-44 2t-48 4t-44-6z" fill="#3b4a6b" />
          <path d="M340 28h30v88q-15 4-30 0z" fill="#2e3a55" stroke="none" />
          <path d="M484 28h30v88q-15 4-30 0z" fill="#2e3a55" stroke="none" />
          <circle cx="412" cy="68" r="17" fill="none" stroke="#f6efe4" strokeWidth="3.5" />
          <circle cx="552" cy="68" r="17" fill="none" stroke="#f6efe4" strokeWidth="3.5" />
          <circle cx="412" cy="68" r="6" fill="#c8553d" stroke="none" />
          <circle cx="552" cy="68" r="6" fill="#c8553d" stroke="none" />
        </g>

        {/* ---------- paper lantern ---------- */}
        <g className="kd-lantern" transform="translate(30 0)">
          <ellipse cx="230" cy="92" rx="70" ry="64" fill="#ffd98a" className="kd-lampglow" />
          <g stroke={INK} strokeOpacity="0.85" strokeWidth="2" strokeLinejoin="round">
            <path d="M230-10v42" />
            <rect x="214" y="32" width="32" height="8" rx="2" fill="#c8553d" />
            <path d="M203 46q27-10 54 0v86q-27 10-54 0z" fill="#f6efe4" />
            <path d="M239 44q18 0 18 4v84q0 4-18 6z" fill="#e3cfae" stroke="none" />
            <path
              d="M203 62q27 6 54 0M203 80q27 6 54 0M203 98q27 6 54 0M203 116q27 6 54 0"
              fill="none"
              strokeOpacity="0.5"
              strokeWidth="1.4"
            />
            <circle cx="230" cy="90" r="8" fill="#c8553d" />
            <rect x="214" y="132" width="32" height="8" rx="2" fill="#c8553d" />
            <path d="M230 140v12" stroke="#c8553d" strokeOpacity="1" strokeWidth="2.5" />
            <path d="M210 52q4-2 8-2v78" fill="none" stroke={CREAM} strokeOpacity="0.6" />
          </g>
        </g>

        {/* ---------- shelf (right) ---------- */}
        <g
          transform="translate(0 14)"
          stroke={INK}
          strokeOpacity="0.85"
          strokeWidth="2"
          strokeLinejoin="round">
          {/* sake jug */}
          <path d="M712 192v-36q0-28 26-28t26 28v36z" fill="#3b4a6b" />
          <path d="M748 134q16 6 16 22v36h-16z" fill="#2e3a55" stroke="none" />
          <path d="M730 130h16q4 0 4 4v4h-24v-4q0-4 4-4z" fill={INK} />
          <path d="M716 164h44" strokeOpacity="0.5" />
          <path d="M720 160v-10q2-10 10-14" fill="none" stroke={CREAM} strokeOpacity="0.6" />
          {/* stacked bowls */}
          <path d="M782 192v-12q0-6 6-6h44q6 0 6 6v12z" fill="#f6efe4" />
          <path d="M788 174v-12q0-6 6-6h32q6 0 6 6v12z" fill="#f6efe4" />
          <path d="M794 156v-10q0-6 6-6h20q6 0 6 6v10z" fill="#f6efe4" />
          <path d="M782 182h56M788 164h44M794 146h32" stroke="#c8553d" strokeWidth="2.4" />
          {/* chopstick jar */}
          <path d="M854 192v-30q0-4 4-4h18q4 0 4 4v30z" fill="#c4935b" />
          <path d="M870 158h6q4 0 4 4v30h-10z" fill="#a06f40" stroke="none" />
          <path d="M860 158l2-30M866 158l0-32M872 158l-2-30" strokeWidth="2.6" />
          {/* plank */}
          <rect x="700" y="192" width="240" height="12" rx="2" fill="#c4935b" />
          <path d="M700 192h240v4H700z" fill="#d9b07a" stroke="none" />
          <path d="M724 204v20l18-20zM906 204v20l18-20z" fill="#7b4f2e" />
        </g>

        {/* ---------- hearth (kamado) ---------- */}
        <g stroke={INK} strokeOpacity="0.85" strokeWidth="2" strokeLinejoin="round">
          {/* brick base */}
          <rect x="270" y="478" width="420" height="44" fill="#9c5a48" />
          <path d="M270 478h420v10H270z" fill="#b06d59" stroke="none" />
          <path d="M270 500h420M330 478v22M430 478v22M530 478v22M630 478v22M380 500v22M480 500v22M580 500v22" />
          {/* clay body */}
          <path d="M290 394q0-14 14-14h352q14 0 14 14v84H290z" fill="#ece2d2" />
          <path d="M560 380h96q14 0 14 14v84H560z" fill="#d9c4a3" stroke="none" />
          <path d="M300 380h352q14 0 14 14v4H290v-4q0-14 10-14z" fill="#f6efe4" stroke="none" />
          <path d="M290 394q0-14 14-14h352q14 0 14 14v84H290z" fill="none" />
          <path d="M290 404h380" strokeOpacity="0.5" />
          {/* fire mouth */}
          <path d="M432 478v-36q48-36 96 0v36z" fill={INK} />
          <path d="M432 478v-36q48-36 96 0v36z" fill="#1a1210" stroke="none" />
          {/* flames */}
          <g transform="translate(480 476)">
            <g className="kd-flames">
              <g fill="#e8803c">
                <path d={flame(44, 15)} />
                <path d={flame(30, 11)} transform="translate(-24 0)" />
                <path d={flame(28, 10)} transform="translate(26 0)" />
              </g>
              <g fill="#d9a441" stroke="none">
                <path d={flame(24, 7)} />
                <path d={flame(14, 5)} transform="translate(-24 0)" />
                <path d={flame(13, 4.5)} transform="translate(26 0)" />
              </g>
              <path d={flame(10, 3)} fill={CREAM} opacity="0.7" stroke="none" />
            </g>
          </g>
          <path d="M424 478h112" strokeWidth="3" />
          {/* top plate + pot socket */}
          <ellipse cx="480" cy="392" rx="178" ry="24" fill="#d9c4a3" />
          <ellipse cx="480" cy="392" rx="178" ry="24" fill="none" />
        </g>

        {/* ---------- pot ---------- */}
        <g stroke={INK} strokeOpacity="0.85" strokeWidth="2" strokeLinejoin="round">
          {/* handles (behind body) */}
          <path d="M322 320q-32 0-32 20v14" fill="none" strokeWidth="12" />
          <path d="M638 320q32 0 32 20v14" fill="none" strokeWidth="12" />
          <path d="M322 320q-32 0-32 20v14" fill="none" stroke="#8a4f22" strokeWidth="7" />
          <path d="M638 320q32 0 32 20v14" fill="none" stroke="#8a4f22" strokeWidth="7" />
          {/* body */}
          <path d="M320 290v100q0 18 160 18t160-18V290z" fill="#b87333" />
          <path d="M530 300v108q110-6 110-18V290z" fill="#8a4f22" stroke="none" />
          <path d="M320 290v100q0 18 160 18t160-18V290z" fill="none" />
          <path d="M320 338h320" strokeOpacity="0.6" />
          <path d="M320 344h320" strokeOpacity="0.6" />
          <path
            d="M346 304v76"
            stroke={CREAM}
            strokeOpacity="0.6"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* water */}
          <ellipse cx="480" cy="290" rx="160" ry="36" fill="#3a2a22" />
          <ellipse cx="480" cy="290" rx="146" ry="31" fill={waterEdge} />
          <ellipse cx="480" cy="287" rx="132" ry="24" fill={water} stroke="none" />
          <g clipPath={url('waterClip')} stroke="none">
            <g className="kd-bub">
              <ellipse cx="420" cy="296" rx="12" ry="6" />
            </g>
            <g className="kd-bub">
              <ellipse cx="520" cy="286" rx="14" ry="7" />
            </g>
            <g className="kd-bub">
              <ellipse cx="470" cy="304" rx="10" ry="5" />
            </g>
            <g className="kd-bub">
              <ellipse cx="560" cy="298" rx="12" ry="6" />
            </g>
            <g className="kd-bub">
              <ellipse cx="400" cy="282" rx="11" ry="5.5" />
            </g>
          </g>
          <path
            d="M380 282q50-14 120-10"
            fill="none"
            stroke={CREAM}
            strokeOpacity="0.7"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* rim */}
          <ellipse cx="480" cy="290" rx="160" ry="36" fill="none" strokeWidth="14" />
          <ellipse
            cx="480"
            cy="290"
            rx="160"
            ry="36"
            fill="none"
            stroke="#b87333"
            strokeWidth="9"
          />
          <path
            d="M340 272q60-18 140-18"
            fill="none"
            stroke={CREAM}
            strokeOpacity="0.6"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>

        {/* ---------- steam ---------- */}
        <g className="kd-steam" stroke={INK} strokeOpacity="0.5" strokeWidth="1.6">
          <g transform="translate(430 270)">
            <path className="kd-puff" d={CLOUD} fill={CREAM} />
          </g>
          <g transform="translate(520 262)">
            <path className="kd-puff" d={CLOUD} fill={CREAM} />
          </g>
          <g transform="translate(470 276)">
            <path className="kd-puff" d={CLOUD} fill={CREAM} />
          </g>
          <g transform="translate(560 270)">
            <path className="kd-puff" d={CLOUD} fill={CREAM} />
          </g>
        </g>

        {/* ---------- hook for the idle basket ---------- */}
        <g className="kd-hook" stroke={INK} strokeOpacity="0.85" strokeWidth="2">
          <rect x="128" y="62" width="24" height="12" rx="3" fill="#7b4f2e" />
          <path d="M140 74v8q0 6 6 6" fill="none" strokeWidth="7" />
          <path d="M140 74v8q0 6 6 6" fill="none" stroke="#b87333" strokeWidth="3.5" />
        </g>

        {/* ---------- tebo basket ---------- */}
        <g className="kd-basket">
          <g transform="translate(500 296)">
            {/* handle: wire + wooden grip */}
            <path
              d="M58-6L200-130"
              stroke={INK}
              strokeOpacity="0.85"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path d="M58-6L200-130" stroke="#b9b2a8" strokeWidth="5" strokeLinecap="round" />
            <path
              d="M188-120L250-172"
              stroke={INK}
              strokeOpacity="0.85"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path d="M188-120L250-172" stroke="#7b4f2e" strokeWidth="14" strokeLinecap="round" />
            <path d="M192-126L242-168" stroke="#9a6a44" strokeWidth="4" strokeLinecap="round" />
            {/* body */}
            <g className="kd-bbody">
              <path
                d="M-66 0q-4 44 66 48q70-4 66-48z"
                fill="#b9b2a8"
                stroke={INK}
                strokeOpacity="0.85"
                strokeWidth="2"
              />
              <path d="M30 2q10 40-20 46q50 0 56-48z" fill="#8f8880" />
              <g stroke={INK} strokeOpacity="0.45" strokeWidth="1.2" fill="none">
                <path d="M-58 4L-22 46M-38 6L-8 48M-18 6L2 48M2 6L10 48M22 6L20 48M42 4L30 48M58 2L44 44" />
                <path d="M-60 18q60 14 120 0M-48 34q48 12 96 0" />
              </g>
              <g fill="#cfd6cf" stroke={INK} strokeOpacity="0.6" strokeWidth="1.2">
                <path className="kd-drip" d="M-30 44q-4 8 0 12q4-4 0-12z" />
                <path className="kd-drip" d="M24 46q-4 8 0 12q4-4 0-12z" />
              </g>
            </g>
            {/* mouth + noodles */}
            <ellipse cx="0" cy="0" rx="64" ry="19" fill="#6f6a64" />
            {noodle ? (
              <g
                clipPath={url('basketClip')}
                fill="none"
                strokeLinecap="round"
                className="kd-noodles">
                {STRANDS.map((d, i) => (
                  <g key={i}>
                    <path d={d} stroke={INK} strokeOpacity="0.8" strokeWidth={sw + 2} />
                    <path d={d} stroke={col} strokeWidth={sw} />
                  </g>
                ))}
              </g>
            ) : (
              <g clipPath={url('basketClip')} stroke={INK} strokeOpacity="0.3" strokeWidth="1">
                <path d="M-60-20v40M-45-20v40M-30-20v40M-15-20v40M0-20v40M15-20v40M30-20v40M45-20v40M60-20v40" />
                <path d="M-68-10h136M-68 0h136M-68 10h136" />
              </g>
            )}
            <ellipse
              cx="0"
              cy="0"
              rx="64"
              ry="19"
              fill="none"
              stroke={INK}
              strokeOpacity="0.85"
              strokeWidth="7"
            />
            <ellipse cx="0" cy="0" rx="64" ry="19" fill="none" stroke="#b9b2a8" strokeWidth="3.5" />
            <path
              d="M-50-10q30-10 70-6"
              fill="none"
              stroke={CREAM}
              strokeOpacity="0.6"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </g>
        </g>
      </svg>

      {dial && <Dial heat={heat} />}
    </div>
  );
}

// ---------- brass dial timer ----------
const ZONES: [number, number, string, string, string][] = [
  [0, 42, '#b9b2a8', 'Çiğ', INK],
  [42, 58, '#b5cfa3', 'Diri', INK],
  [58, 80, '#7c9a6e', 'Tam kıvam', CREAM],
  [80, 100, '#d9a441', 'Yumuşak', INK],
  [100, 130, '#c8553d', 'Lapa', CREAM],
];
const A0 = -130;
const SWEEP = 260;
const ang = (v: number) => A0 + (v / 130) * SWEEP;
const pol = (a: number, r: number) => {
  const t = ((a - 90) * Math.PI) / 180;
  return [100 + Math.cos(t) * r, 100 + Math.sin(t) * r];
};
const arc = (a: number, b: number, r: number) => {
  const [x0, y0] = pol(a, r);
  const [x1, y1] = pol(b, r);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${b - a > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};

function Dial({ heat }: { heat: number }) {
  const uid = useId().replace(/:/g, '');
  const id = (s: string) => `${uid}-${s}`;
  const needle = ang(clamp(heat * 100, 0, 130));
  return (
    <svg className="kd-dial" viewBox="0 0 200 200" aria-hidden="true">
      <circle
        cx="100"
        cy="100"
        r="94"
        fill="#d9a441"
        stroke={INK}
        strokeOpacity="0.85"
        strokeWidth="2"
      />
      <path d="M100 194a94 94 0 0 0 94-94h-8a86 86 0 0 1-86 86z" fill="#b8862e" />
      <path
        d="M40 46a80 80 0 0 1 60-26"
        fill="none"
        stroke={CREAM}
        strokeOpacity="0.6"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle
        cx="100"
        cy="100"
        r="82"
        fill="#f6efe4"
        stroke={INK}
        strokeOpacity="0.85"
        strokeWidth="2"
      />
      {ZONES.map(([a, b, c]) => (
        <path
          key={a}
          d={arc(ang(a) + 0.5, ang(b) - 0.5, 64)}
          stroke={c}
          strokeWidth="22"
          fill="none"
        />
      ))}
      <path
        d={arc(A0, A0 + SWEEP, 75)}
        stroke={INK}
        strokeOpacity="0.7"
        fill="none"
        strokeWidth="1.4"
      />
      <path
        d={arc(A0, A0 + SWEEP, 53)}
        stroke={INK}
        strokeOpacity="0.7"
        fill="none"
        strokeWidth="1.4"
      />
      {Array.from({ length: 14 }, (_, i) => {
        const [x0, y0] = pol(ang(i * 10), 50);
        const [x1, y1] = pol(ang(i * 10), i % 5 ? 46 : 43);
        return (
          <line
            key={i}
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            stroke={INK}
            strokeOpacity="0.7"
            strokeWidth={i % 5 ? 1 : 2}
          />
        );
      })}
      {ZONES.map(([a, b, , label]) => (
        <path key={label} id={id('z' + a)} d={arc(ang(a), ang(b), 61)} fill="none" />
      ))}
      {ZONES.map(([a, , , label, fg]) => (
        <text key={label} className="kd-dlabel" fill={fg}>
          <textPath href={`#${id('z' + a)}`} startOffset="50%" textAnchor="middle">
            {label}
          </textPath>
        </text>
      ))}
      <text x="100" y="146" className="kd-dtitle" textAnchor="middle">
        kıvam
      </text>
      <g className="kd-needle" style={{ transform: `rotate(${needle}deg)` }}>
        <path
          d="M100 114L95 100L100 30L105 100z"
          fill="#c8553d"
          stroke={INK}
          strokeOpacity="0.85"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </g>
      <circle
        cx="100"
        cy="100"
        r="9"
        fill="#d9a441"
        stroke={INK}
        strokeOpacity="0.85"
        strokeWidth="1.6"
      />
      <circle cx="97" cy="97" r="2.5" fill={CREAM} opacity="0.7" />
    </svg>
  );
}
