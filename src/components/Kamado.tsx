import { useEffect, useId, useRef, useState } from 'react';
import { INGREDIENTS } from '../data';
import { THICK_W, type Thick } from '../food';
import '../kamado.css';

// A cinematic Japanese ramen-kitchen corner: indigo plaster + cedar boards, a
// noren, a paper lantern, a cream kamado hearth with a copper-rimmed zundō,
// and the tebo noodle basket on its long handle. Pure SVG + CSS animations.
// Replaces Stove (same props) and adds a brass dial timer in the lower right.

type Mode = 'idle' | 'boil' | 'lift';

interface Props {
  mode: Mode;
  noodle?: string;
  thick?: Thick;
  heat: number; // 0..1.3 cook progress
  dial?: boolean;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
type RGB = [number, number, number];
const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number): RGB =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t)) as RGB;
const css = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`;

/** deterministic strands laid across the basket mouth */
const STRANDS = Array.from({ length: 16 }, (_, i) => {
  const y = -17 + (i / 15) * 34 + Math.sin(i * 1.3) * 1.5;
  const ph = i * 2.3;
  const x = -70 + Math.sin(i * 0.9) * 6;
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
  for (let k = 1; k <= 6; k++) {
    const x0 = x + (k - 0.5) * 24;
    const x1 = x + k * 24;
    const cy = y + Math.sin(k * 1.9 + ph) * 7;
    const ey = y + Math.sin(k * 1.7 + ph + 0.8) * 3;
    d += ` Q${x0.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${ey.toFixed(1)}`;
  }
  return d;
});

export default function Kamado({ mode, noodle, thick = 'orta', heat, dial = true }: Props) {
  const uid = useId().replace(/:/g, '');
  const id = (s: string) => `${uid}-${s}`;
  const url = (s: string) => `url(#${id(s)})`;

  const hot = mode !== 'idle';
  const raw = clamp((0.5 - heat) / 0.35, 0, 1);
  const burnt = clamp((heat - 1) / 0.3, 0, 1);
  const base = hex(INGREDIENTS[noodle ?? '']?.color ?? '#f6d27a');
  const tone = mix(mix(base, hex('#fff6e8'), raw * 0.35), hex('#b39b78'), burnt * 0.55);
  const col = css(tone);
  const shade = css(mix(tone, hex('#7b4f2e'), 0.35));
  const gloss = (0.2 + 0.5 * (1 - raw)) * (1 - burnt * 0.8);
  const sw = THICK_W[thick] * 0.95 * (1 + 0.14 * (1 - raw)) * (1 + 0.25 * burnt);
  const flame = hot ? 0.55 + clamp(heat, 0, 1.3) * 0.45 : 0.14;

  const style = {
    '--heat': clamp(heat, 0, 1.3),
    '--flame': flame,
    '--steam': hot ? 1 : 0.35,
  } as React.CSSProperties;

  // portrait phones: fit the whole hearth (meet); wide screens: fill (slice)
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

  return (
    <div
      className={`kamado kd-${mode} ${portrait ? 'kd-portrait' : ''}`}
      style={style}
      ref={rootRef}>
      <svg
        className="kd-scene"
        viewBox={portrait ? '100 -140 760 700' : '0 0 960 560'}
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true">
        <defs>
          <linearGradient id={id('wall')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4a5a80" />
            <stop offset="1" stopColor="#2a3450" />
          </linearGradient>
          <radialGradient id={id('sun')} cx="0.12" cy="0.22" r="0.75">
            <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.5" />
            <stop offset="0.5" stopColor="#ffb870" stopOpacity="0.12" />
            <stop offset="1" stopColor="#ffb870" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('board')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5a371e" />
            <stop offset="0.12" stopColor="#7b4f2e" />
            <stop offset="0.6" stopColor="#8d5c36" />
            <stop offset="0.92" stopColor="#6a4225" />
            <stop offset="1" stopColor="#4e2e18" />
          </linearGradient>
          <pattern id={id('boards')} width="52" height="300" patternUnits="userSpaceOnUse">
            <rect width="52" height="300" fill={url('board')} />
            <rect x="21" y="0" width="1.2" height="300" fill="#fff6e8" opacity="0.08" />
            <rect x="37" y="0" width="0.8" height="300" fill="#2b2420" opacity="0.25" />
          </pattern>
          <linearGradient id={id('rail')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a8724a" />
            <stop offset="0.5" stopColor="#7b4f2e" />
            <stop offset="1" stopColor="#4a2c17" />
          </linearGradient>
          <linearGradient id={id('floor')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4f4541" />
            <stop offset="0.12" stopColor="#3a312e" />
            <stop offset="1" stopColor="#241d1b" />
          </linearGradient>
          <linearGradient id={id('noren')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b365a" />
            <stop offset="1" stopColor="#3b4a6b" />
          </linearGradient>
          <radialGradient id={id('lamp')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#ffd59a" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ffb870" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('paper')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f3c98e" />
            <stop offset="0.45" stopColor="#ffe6b8" />
            <stop offset="1" stopColor="#d9a060" />
          </linearGradient>
          <linearGradient id={id('cream')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f9f3e8" />
            <stop offset="0.5" stopColor="#ece2d2" />
            <stop offset="1" stopColor="#c9b08c" />
          </linearGradient>
          <linearGradient id={id('creamV')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff6e8" />
            <stop offset="1" stopColor="#d9c4a3" />
          </linearGradient>
          <pattern id={id('tile')} width="60" height="30" patternUnits="userSpaceOnUse">
            <rect width="60" height="30" fill="#5a3a30" />
            <rect x="1.5" y="1.5" width="57" height="27" rx="2" fill="#8a5243" />
            <rect x="1.5" y="1.5" width="57" height="9" rx="2" fill="#a0634f" opacity="0.6" />
          </pattern>
          <linearGradient id={id('pot')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#4a2612" />
            <stop offset="0.16" stopColor="#d08a52" />
            <stop offset="0.36" stopColor="#8f4f24" />
            <stop offset="0.6" stopColor="#b87333" />
            <stop offset="0.84" stopColor="#6e3a18" />
            <stop offset="1" stopColor="#3a1d0c" />
          </linearGradient>
          <linearGradient id={id('copper')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7a4a22" />
            <stop offset="0.3" stopColor="#e0a070" />
            <stop offset="0.55" stopColor="#b87333" />
            <stop offset="1" stopColor="#6b3d1a" />
          </linearGradient>
          <radialGradient id={id('water')} cx="0.38" cy="0.32" r="0.75">
            <stop offset="0" stopColor={hot ? '#f3ecd9' : '#d6dcd6'} />
            <stop offset="0.55" stopColor={hot ? '#d6cbae' : '#a7b5b0'} />
            <stop offset="1" stopColor={hot ? '#8f8468' : '#6b7571'} />
          </radialGradient>
          <radialGradient id={id('steam')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff6e8" stopOpacity="0.5" />
            <stop offset="0.6" stopColor="#fff6e8" stopOpacity="0.18" />
            <stop offset="1" stopColor="#fff6e8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('glow')} cx="0.5" cy="0.6" r="0.5">
            <stop offset="0" stopColor="#ffb14a" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#e8803c" stopOpacity="0.35" />
            <stop offset="1" stopColor="#c8553d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={id('fire')} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff2b0" />
            <stop offset="0.4" stopColor="#f6b24a" />
            <stop offset="1" stopColor="#c8553d" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id={id('lid')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d9b07a" />
            <stop offset="0.5" stopColor="#c4935b" />
            <stop offset="1" stopColor="#8a5a33" />
          </linearGradient>
          <linearGradient id={id('mesh')} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#8b8680" />
            <stop offset="0.5" stopColor="#d8d2c8" />
            <stop offset="1" stopColor="#6f6a64" />
          </linearGradient>
          <linearGradient id={id('vignette')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b2420" stopOpacity="0.35" />
            <stop offset="0.3" stopColor="#2b2420" stopOpacity="0" />
            <stop offset="0.8" stopColor="#2b2420" stopOpacity="0" />
            <stop offset="1" stopColor="#2b2420" stopOpacity="0.4" />
          </linearGradient>
          <clipPath id={id('waterClip')}>
            <ellipse cx="480" cy="300" rx="139" ry="33" />
          </clipPath>
          <clipPath id={id('basketClip')}>
            <ellipse cx="0" cy="0" rx="68" ry="21" />
          </clipPath>
        </defs>

        {/* ---------- back wall ---------- */}
        <rect width="960" height="560" fill={url('wall')} />
        <rect width="960" height="560" fill={url('sun')} />
        <rect y="248" width="960" height="280" fill={url('boards')} />
        <rect y="248" width="960" height="280" fill={url('sun')} opacity="0.7" />
        <rect y="236" width="960" height="14" fill={url('rail')} />
        <rect y="236" width="960" height="2" fill="#fff6e8" opacity="0.25" />

        {/* shelf left with jars + ladles */}
        <rect x="30" y="150" width="240" height="12" rx="2" fill={url('rail')} />
        <rect x="30" y="150" width="240" height="2" fill="#fff6e8" opacity="0.3" />
        <path d="M56 162v22l16-22zM236 162v22l16-22z" fill="#4a2c17" />
        <g>
          <path d="M70 150v-50q0-10 10-10h30q10 0 10 10v50z" fill="#3b4a6b" />
          <path d="M72 150v-46q0-8 8-8h12v54z" fill="#fff6e8" opacity="0.14" />
          <rect x="78" y="86" width="34" height="8" rx="3" fill="#2b2420" opacity="0.6" />
          <path d="M140 150v-34q0-30 32-30t32 30v34z" fill="#ece2d2" />
          <path d="M142 150v-32q0-24 20-27v59z" fill="#fff6e8" opacity="0.5" />
          <path d="M158 86h28q6 0 6 6v4h-40v-4q0-6 6-6z" fill="#7b4f2e" />
          <path d="M140 118h64" stroke="#c8553d" strokeWidth="3" />
          <path d="M212 150v-20h48v20zM216 128h40v-12h-40z" fill="#c4935b" />
          <path d="M214 136h44M218 116h36" stroke="#fff6e8" strokeOpacity="0.35" />
        </g>
        <g strokeLinecap="round">
          <path d="M100 164v52M150 164v58M200 164v48" stroke="#8a5a36" strokeWidth="6" />
          <path
            d="M100 164v52M150 164v58M200 164v48"
            stroke="#fff6e8"
            strokeWidth="1.5"
            opacity="0.3"
          />
          <ellipse cx="100" cy="226" rx="15" ry="10" fill="#c4935b" />
          <ellipse cx="150" cy="232" rx="17" ry="11" fill="#b57a48" />
          <ellipse cx="200" cy="222" rx="13" ry="9" fill="#c4935b" />
          <ellipse cx="98" cy="223" rx="10" ry="5" fill="#7b4f2e" />
          <ellipse cx="148" cy="229" rx="11" ry="6" fill="#6a4226" />
          <ellipse cx="198" cy="219" rx="8" ry="4.5" fill="#7b4f2e" />
        </g>

        {/* shelf right with chopsticks jar + sake jar + bowls */}
        <rect x="640" y="150" width="300" height="12" rx="2" fill={url('rail')} />
        <rect x="640" y="150" width="300" height="2" fill="#fff6e8" opacity="0.3" />
        <path d="M670 162v22l16-22zM900 162v22l16-22z" fill="#4a2c17" />
        <g transform="translate(60 0)">
          <path d="M672 150v-44q0-6 6-6h30q6 0 6 6v44z" fill="#7b4f2e" />
          <path d="M674 150v-42q0-4 4-4h10v46z" fill="#fff6e8" opacity="0.14" />
          <g stroke="#e3c79a" strokeWidth="2.6" strokeLinecap="round">
            <path d="M678 100l2-40M686 100l0-44M694 100l-1-42M702 100l3-40M710 100l-2-45" />
          </g>
          <path d="M740 150v-44q0-40 44-40t44 40v44z" fill="#3b4a6b" />
          <path d="M742 150v-42q0-32 26-36v78z" fill="#fff6e8" opacity="0.12" />
          <path d="M770 68h28q4 0 4 4v3h-36v-3q0-4 4-4z" fill="#2b2420" opacity="0.7" />
          <path d="M740 122h88" stroke="#fff6e8" strokeOpacity="0.4" strokeWidth="2" />
          <path d="M836 150v-14q0-8 8-8h40q8 0 8 8v14z" fill="#ece2d2" />
          <path d="M840 128v-12q0-6 6-6h36q6 0 6 6v12z" fill="#d9c4a3" />
          <path d="M836 134h56M840 118h48" stroke="#c8553d" strokeWidth="2" opacity="0.8" />
        </g>

        {/* noren */}
        <rect x="356" y="26" width="280" height="8" rx="4" fill={url('rail')} />
        <path d="M366 34h128v78q-32 10-64 0t-64 0z" fill={url('noren')} />
        <path d="M498 34h128v78q-32 10-64 0t-64 0z" fill={url('noren')} />
        <path d="M366 34h26v82q-13 4-26 0z" fill="#fff6e8" opacity="0.08" />
        <path d="M498 34h26v82q-13 4-26 0z" fill="#fff6e8" opacity="0.08" />
        <circle cx="430" cy="74" r="17" fill="none" stroke="#f6efe4" strokeWidth="3.5" />
        <circle cx="562" cy="74" r="17" fill="none" stroke="#f6efe4" strokeWidth="3.5" />
        <circle cx="430" cy="74" r="6" fill="#c8553d" />
        <circle cx="562" cy="74" r="6" fill="#c8553d" />

        {/* paper lantern */}
        <g className="kd-lantern" transform="translate(70 0)">
          <ellipse cx="252" cy="140" rx="120" ry="110" fill={url('lamp')} className="kd-lampglow" />
          <path d="M252 0v40" stroke="#2b2420" strokeWidth="2" />
          <rect x="234" y="40" width="36" height="8" rx="2" fill="#2b2420" />
          <path d="M226 50q26-10 52 0v90q-26 10-52 0z" fill={url('paper')} />
          <path d="M226 50q26-10 52 0v90q-26 10-52 0z" fill="#ffe9bb" opacity="0.35" />
          <g fill="none" stroke="#b87333" strokeOpacity="0.45" strokeWidth="1.4">
            <path d="M226 66q26 6 52 0M226 84q26 6 52 0M226 102q26 6 52 0M226 120q26 6 52 0" />
          </g>
          <circle cx="252" cy="92" r="9" fill="#c8553d" />
          <circle cx="252" cy="92" r="4" fill="#fff6e8" />
          <rect x="234" y="140" width="36" height="7" rx="2" fill="#2b2420" />
          <path d="M252 147v14" stroke="#c8553d" strokeWidth="2.5" />
        </g>

        {/* ---------- hearth ---------- */}
        <rect x="0" y="520" width="960" height="40" fill={url('floor')} />
        <ellipse cx="480" cy="522" rx="260" ry="12" fill="#2b2420" opacity="0.45" />
        <rect x="262" y="476" width="436" height="48" rx="3" fill={url('tile')} />
        <rect x="262" y="476" width="436" height="48" rx="3" fill={url('sun')} opacity="0.5" />
        <rect x="258" y="472" width="444" height="7" rx="2" fill="#d9c4a3" />
        <path d="M286 400q0-14 14-14h360q14 0 14 14v74h-388z" fill={url('cream')} />
        <path d="M286 400q0-14 14-14h360q14 0 14 14v8h-388z" fill={url('creamV')} />
        <path d="M300 386h360q14 0 14 14v4h-388v-4q0-14 14-14z" fill="#fff6e8" opacity="0.4" />
        <path d="M286 420h388v54h-388z" fill="#2b2420" opacity="0.08" />
        {/* fire mouth */}
        <path d="M434 474v-32q46-36 92 0v32z" fill="#1a120f" />
        <path d="M440 474v-29q40-30 80 0v29z" fill="#2b1a14" />
        <ellipse cx="480" cy="476" rx="150" ry="36" fill={url('glow')} className="kd-glow" />
        <g className="kd-flames">
          <path
            d="M452 474q-6-22 10-36q2 14 10 20q4-14 14-24q10 14 4 30q8-6 10-16q10 20-4 26z"
            fill={url('fire')}
          />
          <path
            d="M466 474q-2-16 8-24q4 10 10 14q2-10 8-16q6 10 2 26z"
            fill="#fff2b0"
            opacity="0.8"
          />
        </g>
        <ellipse cx="480" cy="474" rx="46" ry="4" fill="#1a120f" />
        {/* top plate + pot hole */}
        <path d="M300 404h360q0-6-6-6h-348q-6 0-6 6z" fill="#d9c4a3" />
        <ellipse cx="480" cy="402" rx="160" ry="22" fill="#3a2a22" />

        {/* lid resting against the hearth */}
        <g transform="translate(262 430) rotate(-14)">
          <ellipse
            cx="0"
            cy="0"
            rx="52"
            ry="78"
            fill="#4a2c17"
            opacity="0.5"
            transform="translate(6 6)"
          />
          <ellipse cx="0" cy="0" rx="52" ry="78" fill={url('lid')} />
          <ellipse
            cx="0"
            cy="0"
            rx="40"
            ry="62"
            fill="none"
            stroke="#7b4f2e"
            strokeOpacity="0.4"
            strokeWidth="2"
          />
          <path
            d="M-20 -30v60M0 -36v72M20 -30v60"
            stroke="#7b4f2e"
            strokeOpacity="0.3"
            strokeWidth="1.5"
          />
          <ellipse cx="0" cy="0" rx="9" ry="12" fill="#7b4f2e" />
          <ellipse cx="-2" cy="-3" rx="4" ry="5" fill="#c4935b" />
        </g>

        {/* ---------- pot (zundō) ---------- */}
        <ellipse
          cx="480"
          cy="300"
          rx="150"
          ry="36"
          fill="#2b2420"
          opacity="0.5"
          transform="translate(0 150)"
        />
        <path d="M330 300v100q0 18 150 18t150-18v-100z" fill={url('pot')} />
        <path d="M330 360v40q0 18 150 18t150-18v-40z" fill="#2b2420" opacity="0.22" />
        <path d="M330 340h300" stroke="#fff6e8" strokeOpacity="0.18" strokeWidth="3" />
        <path d="M330 346h300" stroke="#2b2420" strokeOpacity="0.25" strokeWidth="2" />
        <ellipse cx="400" cy="372" rx="26" ry="40" fill="#fff6e8" opacity="0.07" />
        <path
          d="M330 400q0 18 150 18t150-18"
          fill="none"
          stroke="#e8803c"
          strokeOpacity="0.35"
          strokeWidth="8"
          className="kd-potheat"
        />
        {/* handles */}
        <path
          d="M332 326q-30 0-30 18v12"
          fill="none"
          stroke={url('copper')}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M628 326q30 0 30 18v12"
          fill="none"
          stroke={url('copper')}
          strokeWidth="9"
          strokeLinecap="round"
        />
        {/* water */}
        <ellipse cx="480" cy="300" rx="150" ry="36" fill="#3a2a22" />
        <ellipse cx="480" cy="303" rx="142" ry="33" fill="#2b2420" opacity="0.6" />
        <ellipse cx="480" cy="300" rx="139" ry="33" fill={url('water')} />
        <ellipse
          cx="480"
          cy="300"
          rx="139"
          ry="33"
          fill="none"
          stroke="#2b2420"
          strokeOpacity="0.22"
          strokeWidth="10"
          clipPath={url('waterClip')}
        />
        <path
          d="M380 292q40-18 110-12"
          fill="none"
          stroke="#fff6e8"
          strokeOpacity="0.35"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <g clipPath={url('waterClip')} className="kd-bubbles">
          <ellipse className="kd-bub" cx="430" cy="306" rx="9" ry="5" />
          <ellipse className="kd-bub" cx="520" cy="296" rx="11" ry="6" />
          <ellipse className="kd-bub" cx="478" cy="316" rx="8" ry="4.5" />
          <ellipse className="kd-bub" cx="560" cy="310" rx="10" ry="5.5" />
          <ellipse className="kd-bub" cx="400" cy="290" rx="10" ry="5.5" />
          <ellipse className="kd-foam" cx="470" cy="298" rx="70" ry="14" />
        </g>
        <ellipse
          cx="480"
          cy="300"
          rx="150"
          ry="36"
          fill="none"
          stroke={url('copper')}
          strokeWidth="11"
        />
        <ellipse
          cx="480"
          cy="300"
          rx="150"
          ry="36"
          fill="none"
          stroke="#fff6e8"
          strokeOpacity="0.35"
          strokeWidth="2"
          transform="translate(0 -4)"
        />

        {/* steam */}
        <g className="kd-steam">
          <circle className="kd-puff" cx="440" cy="290" r="46" fill={url('steam')} />
          <circle className="kd-puff" cx="500" cy="286" r="54" fill={url('steam')} />
          <circle className="kd-puff" cx="470" cy="292" r="40" fill={url('steam')} />
          <circle className="kd-puff" cx="530" cy="290" r="48" fill={url('steam')} />
        </g>

        {/* hook for the idle basket */}
        <g className="kd-hook">
          <rect x="662" y="40" width="16" height="14" rx="3" fill="#7b4f2e" />
          <path
            d="M670 50v8q0 8 8 8"
            fill="none"
            stroke="#b87333"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* ---------- tebo basket ---------- */}
        <g className="kd-basket">
          {/* handle: wire + wooden grip (from basket rim to 670,200) */}
          <path d="M556 290L656 206" stroke="#b9b2a8" strokeWidth="7" strokeLinecap="round" />
          <path
            d="M556 290L656 206"
            stroke="#fff6e8"
            strokeOpacity="0.35"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path d="M650 210L708 162" stroke="#5e3519" strokeWidth="14" strokeLinecap="round" />
          <path
            d="M652 206L704 162"
            stroke="#c4935b"
            strokeOpacity="0.5"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <g transform="translate(500 296)">
            {/* body (bowl) */}
            <g className="kd-bbody">
              <path d="M-68 0q-4 46 68 50q72-4 68-50z" fill={url('mesh')} />
              <g stroke="#2b2420" strokeOpacity="0.28" strokeWidth="1">
                <path d="M-60 2L-22 48M-40 4L-10 50M-20 6L0 50M0 6L8 50M20 6L18 50M40 4L28 50M60 2L42 46" />
                <path d="M-62 18q62 14 124 0M-50 34q50 12 100 0" fill="none" />
              </g>
              <g className="kd-drips" fill="#dfe8ee" opacity="0.85">
                <ellipse className="kd-drip" cx="-30" cy="48" rx="2" ry="4" />
                <ellipse className="kd-drip" cx="24" cy="50" rx="2.2" ry="4.5" />
              </g>
            </g>
            {/* mouth + noodles */}
            <ellipse cx="0" cy="0" rx="68" ry="21" fill="#4a443e" opacity="0.55" />
            {noodle && (
              <g
                clipPath={url('basketClip')}
                fill="none"
                strokeLinecap="round"
                className="kd-noodles">
                {STRANDS.map((d, i) => (
                  <g key={i}>
                    <path
                      d={d}
                      stroke={shade}
                      strokeWidth={sw + 1.2}
                      transform="translate(0.6 1.2)"
                    />
                    <path d={d} stroke={col} strokeWidth={sw} />
                    <path
                      d={d}
                      stroke="#fff6e8"
                      strokeOpacity={gloss}
                      strokeWidth={Math.max(0.7, sw * 0.3)}
                      transform={`translate(${-sw * 0.15} ${-sw * 0.25})`}
                    />
                  </g>
                ))}
              </g>
            )}
            {!noodle && (
              <g
                clipPath={url('basketClip')}
                stroke="#2b2420"
                strokeOpacity="0.18"
                strokeWidth="0.8">
                <path d="M-60-20v40M-45-20v40M-30-20v40M-15-20v40M0-20v40M15-20v40M30-20v40M45-20v40M60-20v40" />
                <path d="M-68-10h136M-68 0h136M-68 10h136" />
              </g>
            )}
            <ellipse
              cx="0"
              cy="0"
              rx="68"
              ry="21"
              fill="none"
              stroke={url('mesh')}
              strokeWidth="4"
            />
            <ellipse
              cx="0"
              cy="0"
              rx="68"
              ry="21"
              fill="none"
              stroke="#fff6e8"
              strokeOpacity="0.4"
              strokeWidth="1.2"
              transform="translate(0 -1.5)"
            />
          </g>
        </g>

        <rect width="960" height="560" fill={url('vignette')} pointerEvents="none" />
      </svg>

      {dial && <Dial heat={heat} />}
    </div>
  );
}

// ---------- brass dial timer ----------
const ZONES: [number, number, string, string, string][] = [
  [0, 42, '#9a948c', 'Çiğ', '#2b2420'],
  [42, 58, '#b5cfa3', 'Diri', '#2b2420'],
  [58, 80, '#7c9a6e', 'Tam kıvam', '#fff6e8'],
  [80, 100, '#d9a441', 'Yumuşak', '#2b2420'],
  [100, 130, '#c8553d', 'Lapa', '#fff6e8'],
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
      <defs>
        <linearGradient id={id('brass')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f1d18a" />
          <stop offset="0.45" stopColor="#b8862e" />
          <stop offset="0.7" stopColor="#e3c079" />
          <stop offset="1" stopColor="#6e4b14" />
        </linearGradient>
        <radialGradient id={id('wood')} cx="0.4" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#f6efe4" />
          <stop offset="0.7" stopColor="#ece2d2" />
          <stop offset="1" stopColor="#c9b08c" />
        </radialGradient>
        <radialGradient id={id('cap')} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#f1d18a" />
          <stop offset="1" stopColor="#7a5418" />
        </radialGradient>
      </defs>
      <circle cx="102" cy="106" r="94" fill="#2b2420" opacity="0.45" />
      <circle cx="100" cy="100" r="94" fill={`url(#${id('brass')})`} />
      <circle cx="100" cy="100" r="86" fill="#5a3a1a" />
      <circle cx="100" cy="100" r="83" fill={`url(#${id('wood')})`} />
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
        d={arc(A0, A0 + SWEEP, 76)}
        stroke="#7b4f2e"
        strokeOpacity="0.45"
        fill="none"
        strokeWidth="1"
      />
      <path
        d={arc(A0, A0 + SWEEP, 52)}
        stroke="#7b4f2e"
        strokeOpacity="0.3"
        fill="none"
        strokeWidth="1"
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
            stroke="#7b4f2e"
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
          d="M100 114L95.5 100L100 30L104.5 100z"
          fill="#2b2420"
          opacity="0.25"
          transform="translate(1.5 1.5)"
        />
        <path d="M100 114L95.5 100L100 30L104.5 100z" fill="#c8553d" />
        <path d="M100 114L95.5 100L100 30z" fill="#e8803c" opacity="0.7" />
      </g>
      <circle cx="100" cy="100" r="9" fill={`url(#${id('cap')})`} />
      <circle cx="100" cy="100" r="3" fill="#5a3a1a" />
    </svg>
  );
}
