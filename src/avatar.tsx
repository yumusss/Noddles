import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as lorelei from '@dicebear/lorelei';
import { CatArt, type Look, type Mood } from './art';

// Character art: "Lorelei" by Lisa Wischofsky (CC0 1.0), rendered through DiceBear.
// Lorelei gives us clean line-illustration heads; clothing, hats, moustache, scarf,
// chopsticks and the other story props are drawn here as SVG overlays so every
// character stays inside the warm cream / terracotta / matcha / indigo palette.

// ---------- palette ----------
const INK = '#2b2420';
const CREAM = '#fff6e8';
const PAL = {
  clay: '#c8553d',
  persimmon: '#e8803c',
  matcha: '#7c9a6e',
  indigo: '#3b4a6b',
  gold: '#d9a441',
  blush: '#e9b8b2',
  oak: '#c4935b',
  walnut: '#7b4f2e',
  sand: '#d9c4a3',
  linen: '#ece2d2',
  slate: '#6b7a8c',
  sage: '#a9b89a',
  rose: '#c97b74',
};
const GARMENT_COLORS = [
  PAL.clay,
  PAL.persimmon,
  PAL.matcha,
  PAL.indigo,
  PAL.gold,
  PAL.blush,
  PAL.oak,
  PAL.sand,
  PAL.linen,
  PAL.slate,
  PAL.sage,
  PAL.rose,
];
const SKIN = ['f7dcc4', 'f1c9a5', 'edb98a', 'd9a273', 'c68642', 'a5673f', '8d5524'];
const HAIR_COLORS = [
  '2b2420',
  '3a2a24',
  '4a312c',
  '7b4f2e',
  'a55728',
  'c4935b',
  'd9c4a3',
  '8a7f78',
];

// hair variants that read as feminine (long / bob / bun) vs the rest
const FEM_HAIR = [
  13, 14, 15, 16, 17, 18, 19, 21, 23, 24, 26, 29, 30, 31, 32, 33, 35, 37, 38, 40, 41, 42, 45, 47,
  48,
];
const MASC_HAIR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 20, 22, 36, 39, 43, 44, 46];
const HAIR_POOL = [...FEM_HAIR, ...MASC_HAIR];
const FEM_SET = new Set(FEM_HAIR);
const GLASSES = ['variant01', 'variant03', 'variant04', 'variant05'];

type Opts = Record<string, unknown>;
type Garment = 'crew' | 'vneck' | 'collar' | 'cardigan' | 'apron' | 'blazer' | 'blouse' | 'jacket';

const v = (n: number) => 'variant' + String(n).padStart(2, '0');

function seeded(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a ^= a << 13;
    a ^= a >>> 17;
    a ^= a << 5;
    return ((a >>> 0) % 100000) / 100000;
  };
}

function pickHair(seed: number) {
  const r = seeded(seed);
  return HAIR_POOL[Math.floor(r() * HAIR_POOL.length)];
}

/** Whether a random look reads as a woman (used to give customers fitting names). */
export function isFeminine(look: Look) {
  return FEM_SET.has(pickHair(look.seed ?? 1));
}

// ---------- colour helpers ----------
function hex(c: string) {
  const s = c.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
}
function mix(a: string, b: string, t: number) {
  const A = hex(a);
  const B = hex(b);
  return (
    '#' +
    A.map((x, i) =>
      Math.round(x + (B[i] - x) * t)
        .toString(16)
        .padStart(2, '0')
    ).join('')
  );
}
const shade = (c: string, t = 0.22) => mix(c, INK, t);
const tint = (c: string, t = 0.25) => mix(c, CREAM, t);

// ---------- face per mood ----------
function face(mood: Mood | 'eating'): Opts {
  switch (mood) {
    case 'love':
      return {
        eyes: ['variant09'],
        eyebrows: ['variant09'],
        mouth: ['happy03'],
        eyesColor: [PAL.clay.slice(1)],
      };
    case 'happy':
      return { eyes: ['variant24'], eyebrows: ['variant09'], mouth: ['happy02'] };
    case 'neutral':
      return { eyes: ['variant16'], eyebrows: ['variant12'], mouth: ['happy13'] };
    case 'worried':
      return { eyes: ['variant16'], eyebrows: ['variant01'], mouth: ['sad05'] };
    case 'angry':
      return { eyes: ['variant22'], eyebrows: ['variant13'], mouth: ['sad04'] };
    case 'eating':
      return { eyes: ['variant19'], eyebrows: ['variant09'], mouth: ['happy08'] };
  }
}

// ---------- overlays (screen coordinates of the 980x980 lorelei canvas) ----------
function garment(kind: Garment, color: string, accent = CREAM) {
  const dark = shade(color);
  const light = tint(color, 0.18);
  const body =
    'M150 1000 L190 880 Q205 805 300 780 L385 752 Q470 825 560 742 L640 768 Q720 790 735 880 L775 1000 Z';
  let extra = '';
  switch (kind) {
    case 'vneck':
      extra = `<path d="M385 752 Q470 825 560 742 L470 880 Z" fill="${dark}" opacity=".9"/>`;
      break;
    case 'collar':
      extra = `<path d="M385 752 L470 825 L430 880 L350 790 Z" fill="${accent}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M560 742 L470 825 L515 880 L600 775 Z" fill="${accent}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`;
      break;
    case 'cardigan':
      extra = `<path d="M470 825 L455 1000" stroke="${dark}" stroke-width="7"/>
<path d="M385 752 Q470 825 470 825 L440 1000 L300 1000 L300 785 Z" fill="${light}" opacity=".35"/>
<circle cx="472" cy="890" r="9" fill="${accent}" stroke="${INK}" stroke-width="5"/>
<circle cx="468" cy="960" r="9" fill="${accent}" stroke="${INK}" stroke-width="5"/>`;
      break;
    case 'apron':
      extra = `<path d="M380 850 L560 850 L580 1000 L360 1000 Z" fill="${PAL.walnut}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M400 850 L370 805 M540 850 L570 805" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
      break;
    case 'blazer':
      extra = `<path d="M385 752 Q470 825 470 825 L470 1000 L290 1000 L295 840 Z" fill="${dark}"/>
<path d="M560 742 Q470 825 470 825 L470 1000 L650 1000 L645 840 Z" fill="${dark}"/>
<path d="M385 752 L470 825 L470 1000 L415 1000 L405 860 Z" fill="${accent}"/>
<path d="M385 752 L430 880 L415 1000" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M560 742 L515 880 L530 1000" fill="none" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M505 890 Q545 950 525 1000" fill="none" stroke="${PAL.gold}" stroke-width="6" stroke-linecap="round"/>`;
      break;
    case 'blouse':
      extra = `<path d="M385 752 Q470 825 560 742 Q540 850 470 860 Q395 850 385 752 Z" fill="${dark}" opacity=".75"/>`;
      break;
    case 'jacket':
      extra = `<path d="M470 835 L470 1000" stroke="${INK}" stroke-width="7"/>
<path d="M385 752 L470 835 L320 835 Z" fill="${light}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M560 742 L470 835 L615 835 Z" fill="${light}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`;
      break;
  }
  return `<g>
<path d="${body}" fill="${color}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
<path d="M190 880 Q205 805 300 780 L385 752 Q400 850 380 1000 L150 1000 Z" fill="${dark}" opacity=".28"/>
<path d="M640 768 Q720 790 735 880 L775 1000 L680 1000 Q680 880 640 768 Z" fill="${light}" opacity=".35"/>
${extra}
</g>`;
}

function blush(strong = false) {
  const o = strong ? 0.6 : 0.4;
  return `<g fill="${PAL.rose}" opacity="${o}"><ellipse cx="330" cy="520" rx="34" ry="18"/><ellipse cx="560" cy="500" rx="34" ry="18"/></g>`;
}

function heart(x: number, y: number, s: number, o = 1) {
  return `<path transform="translate(${x} ${y}) scale(${s})" opacity="${o}" fill="${PAL.clay}" d="M0 10 C-14 -2 -18 -14 -8 -18 C-3 -20 0 -16 0 -13 C0 -16 3 -20 8 -18 C18 -14 14 -2 0 10 Z"/>`;
}
const loveHearts = () =>
  heart(650, 170, 2.6) + heart(700, 250, 1.8, 0.85) + heart(610, 120, 1.4, 0.7);

function chopsticks() {
  return `<g stroke-linecap="round">
<path d="M585 640 Q560 680 575 740" fill="none" stroke="${PAL.gold}" stroke-width="7" opacity=".9"/>
<path d="M595 642 Q630 690 640 760" fill="none" stroke="${PAL.gold}" stroke-width="7" opacity=".9"/>
<path d="M820 900 L590 645" stroke="${PAL.walnut}" stroke-width="12"/>
<path d="M840 870 L608 628" stroke="${PAL.walnut}" stroke-width="12"/>
<path d="M820 900 L590 645 M840 870 L608 628" stroke="${INK}" stroke-width="3" opacity=".35"/>
</g>`;
}

function topHat(color = INK) {
  const band = PAL.clay;
  return `<g transform="rotate(-6 400 190)">
<path d="M255 40 Q400 25 555 40 L560 195 L250 195 Z" fill="${shade(color, 0)}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
<path d="M255 40 Q400 25 555 40 L560 70 Q400 50 255 70 Z" fill="${CREAM}" opacity=".12"/>
<path d="M252 150 L558 150 L560 182 L250 182 Z" fill="${band}" stroke="${INK}" stroke-width="6"/>
<ellipse cx="405" cy="198" rx="235" ry="30" fill="${color}" stroke="${INK}" stroke-width="8"/>
<ellipse cx="405" cy="192" rx="195" ry="18" fill="${CREAM}" opacity=".1"/>
</g>`;
}

function moustache(color: string) {
  return `<g fill="none" stroke="${color}" stroke-width="13" stroke-linecap="round">
<path d="M455 500 Q405 478 360 492 Q335 500 338 470"/>
<path d="M455 500 Q500 470 548 478 Q575 484 582 456"/>
</g>
<g fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" opacity=".35">
<path d="M455 500 Q405 478 360 492 Q335 500 338 470"/>
<path d="M455 500 Q500 470 548 478 Q575 484 582 456"/>
</g>`;
}

function monocle() {
  return `<g><circle cx="545" cy="440" r="40" fill="${CREAM}" opacity=".18"/>
<circle cx="545" cy="440" r="40" fill="none" stroke="${PAL.gold}" stroke-width="7"/>
<path d="M560 478 Q585 560 560 640" fill="none" stroke="${PAL.gold}" stroke-width="4"/></g>`;
}

function headband() {
  return `<g>
<path d="M210 300 Q400 230 610 262 L612 300 Q400 268 212 332 Z" fill="${CREAM}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M608 262 Q640 230 672 250 Q650 265 648 300 Q690 300 692 330 Q645 320 612 300 Z" fill="${CREAM}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<circle cx="410" cy="282" r="12" fill="${PAL.clay}"/>
</g>`;
}

function helmet() {
  const c = PAL.matcha;
  return `<g>
<path d="M190 345 Q175 140 400 118 Q640 108 650 330 Q560 305 400 310 Q260 320 190 345 Z" fill="${c}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
<path d="M230 300 Q260 170 400 150 Q500 140 560 185" fill="none" stroke="${CREAM}" stroke-width="12" opacity=".45" stroke-linecap="round"/>
<path d="M330 128 Q400 108 470 128 L470 150 Q400 134 330 150 Z" fill="${CREAM}" opacity=".3"/>
<path d="M560 320 L690 300 Q700 326 680 340 L556 345 Z" fill="${shade(c)}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M235 330 Q250 480 280 600" fill="none" stroke="${INK}" stroke-width="6" opacity=".6"/>
</g>`;
}

function scarf(color = PAL.persimmon, dy = 0) {
  const d = shade(color);
  return `<g transform="translate(0 ${dy})">
<path d="M275 660 Q395 745 525 640 Q540 690 515 712 Q395 790 270 712 Q255 690 275 660 Z" fill="${color}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M290 705 Q240 790 250 880 L320 870 Q330 790 350 745 Z" fill="${color}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M300 760 L312 765 M292 805 L306 810 M290 850 L306 852" stroke="${d}" stroke-width="5" stroke-linecap="round"/>
<path d="M290 690 Q395 760 505 670" fill="none" stroke="${d}" stroke-width="5"/>
</g>`;
}

function pearls() {
  let s = '';
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const x = 302 + (490 - 302) * t;
    const y = 690 + Math.sin(t * Math.PI) * 55 - t * 18;
    s += `<circle cx="${x}" cy="${y}" r="9" fill="${CREAM}" stroke="${PAL.sand}" stroke-width="3"/>`;
  }
  return `<g>${s}</g>`;
}

function notebook() {
  return `<g transform="rotate(-12 690 760)">
<rect x="615" y="680" width="150" height="190" rx="10" fill="${PAL.indigo}" stroke="${INK}" stroke-width="7"/>
<rect x="745" y="680" width="24" height="190" fill="${PAL.gold}" opacity=".9"/>
<path d="M650 730 H725 M650 770 H715 M650 810 H730" stroke="${CREAM}" stroke-width="5" stroke-linecap="round" opacity=".8"/>
<path d="M620 860 L760 690" stroke="${PAL.gold}" stroke-width="10" stroke-linecap="round"/>
<path d="M760 690 L776 670" stroke="${PAL.clay}" stroke-width="10" stroke-linecap="round"/>
</g>`;
}

function flatCap(color = PAL.walnut) {
  return `<g>
<path d="M190 345 Q200 150 430 140 Q640 135 660 320 Q560 290 400 300 Q270 310 190 345 Z" fill="${color}" stroke="${INK}" stroke-width="8" stroke-linejoin="round"/>
<path d="M240 300 Q300 190 430 175 Q540 170 600 230" fill="none" stroke="${CREAM}" stroke-width="8" opacity=".2" stroke-linecap="round"/>
<path d="M560 318 L700 302 Q716 322 700 340 L556 345 Z" fill="${shade(color)}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
<path d="M300 230 L330 290 M420 200 L430 290 M540 215 L520 295" stroke="${INK}" stroke-width="3" opacity=".3"/>
</g>`;
}

function sunglasses() {
  return `<g>
<path d="M330 420 Q395 400 455 420 L448 475 Q395 495 338 475 Z" fill="${INK}" opacity=".92"/>
<path d="M495 410 Q555 392 610 418 L604 470 Q555 488 500 466 Z" fill="${INK}" opacity=".92"/>
<path d="M455 428 Q475 420 495 424" fill="none" stroke="${INK}" stroke-width="9"/>
<path d="M345 428 Q380 418 420 426 M510 418 Q545 406 585 420" fill="none" stroke="${CREAM}" stroke-width="5" opacity=".35"/>
</g>`;
}

function glassesTint(color: string) {
  return color.replace('#', '');
}

// ---------- look -> lorelei options + overlays ----------
interface Composed {
  opts: Opts;
  under: string; // drawn between hair-back and head (garments)
  over: string; // drawn on top of everything
}

function compose(look: Look, mood: Mood, eating: boolean): Composed {
  const m: Mood | 'eating' = eating ? 'eating' : mood;
  const common: Opts = {
    head: ['variant01'],
    glassesProbability: 0,
    earringsProbability: 0,
    beardProbability: 0,
    frecklesProbability: 0,
    hairAccessoriesProbability: 0,
    ...face(m),
  };
  let over = '';
  if (m === 'love') over += loveHearts();
  if (m === 'eating') over += chopsticks();
  if (m === 'love' || m === 'eating' || m === 'happy') over += blush(m !== 'happy');

  switch (look.special) {
    case 'hana':
      return {
        opts: {
          ...common,
          hair: ['variant14'],
          hairColor: ['e8e1e1'],
          skinColor: ['edb98a'],
          glasses: ['variant01'],
          glassesProbability: 100,
          glassesColor: [glassesTint(PAL.walnut)],
          ...(m === 'happy' || m === 'neutral' ? { eyes: ['variant01'], mouth: ['happy01'] } : {}),
        },
        under: garment('cardigan', PAL.clay, PAL.gold),
        over: over + blush(false),
      };
    case 'baron': {
      const disguise = !!look.disguise;
      return {
        opts: {
          ...common,
          hair: ['variant01'],
          hairColor: ['4a312c'],
          skinColor: ['f1c9a5'],
          ...(m === 'happy' || m === 'neutral' ? { mouth: ['happy13'] } : {}),
          ...(m === 'love' ? { eyes: ['variant09'] } : {}),
        },
        under: garment('blazer', disguise ? PAL.slate : PAL.indigo, CREAM),
        over:
          (disguise ? scarf(PAL.walnut, 40) : '') +
          moustache('#4a312c') +
          (disguise ? sunglasses() : monocle()) +
          (disguise ? flatCap() : topHat(INK)) +
          over,
      };
    }
    case 'lezzetova':
      return {
        opts: {
          ...common,
          hair: ['variant21'],
          hairColor: ['2b2420'],
          skinColor: ['f1c9a5'],
          mouthColor: [PAL.clay.slice(1)],
          earrings: ['variant03'],
          earringsProbability: 100,
          earringsColor: ['fff6e8'],
          ...(m === 'neutral' ? { mouth: ['happy02'] } : {}),
        },
        under: garment('blouse', PAL.indigo),
        over: pearls() + notebook() + over,
      };
    case 'ruzgar':
      return {
        opts: {
          ...common,
          hair: ['variant04'],
          hairColor: ['3a2a24'],
          skinColor: ['d9a273'],
          frecklesProbability: 100,
          frecklesColor: ['a5673f'],
        },
        under: garment('jacket', PAL.indigo),
        over: scarf(PAL.persimmon) + helmet() + over,
      };
    case 'sef':
      return {
        opts: {
          ...common,
          hair: ['variant03'],
          hairColor: ['2b2420'],
          skinColor: ['d9a273'],
        },
        under: garment('apron', CREAM, CREAM),
        over: headband() + over,
      };
  }

  const seed = look.seed ?? 1;
  const hairN = pickHair(seed);
  const fem = FEM_SET.has(hairN);
  const r = seeded(seed * 7 + 3);
  const p = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const skin = p(SKIN);
  const hairColor = p(HAIR_COLORS);
  const color = p(GARMENT_COLORS);
  const kinds: Garment[] = fem
    ? ['crew', 'vneck', 'collar', 'cardigan', 'blouse']
    : ['crew', 'vneck', 'collar', 'cardigan', 'jacket'];
  const kind = p(kinds);
  const accent = p([CREAM, PAL.linen, PAL.gold, PAL.sand]);
  const withGlasses = r() < 0.22;
  const withEarrings = fem && r() < 0.35;
  const withFreckles = r() < 0.2;
  const withBeard = !fem && r() < 0.2;
  const extraBlush = look.kid || r() < 0.3;
  return {
    opts: {
      ...common,
      hair: [v(hairN)],
      hairColor: [hairColor],
      skinColor: [skin],
      glasses: [p(GLASSES)],
      glassesProbability: withGlasses ? 100 : 0,
      glassesColor: [p(['2b2420', '7b4f2e', '3b4a6b'])],
      earrings: [p(['variant01', 'variant02', 'variant03'])],
      earringsProbability: withEarrings ? 100 : 0,
      earringsColor: [p(['d9a441', 'fff6e8', 'c8553d'])],
      frecklesProbability: withFreckles ? 100 : 0,
      frecklesColor: [shade('#' + skin, 0.35).slice(1)],
      beard: [p(['variant01', 'variant02'])],
      beardProbability: withBeard ? 100 : 0,
    },
    under: garment(kind, color, accent),
    over:
      over + (extraBlush && m !== 'love' && m !== 'eating' && m !== 'happy' ? blush(false) : ''),
  };
}

const GROUP = '<g transform="translate(10 -60)">';

/** Build the final SVG string for a look + mood. */
export function avatarSvg(look: Look, mood: Mood, eating = false): string {
  const { opts, under, over } = compose(look, mood, eating);
  let svg = createAvatar(lorelei, {
    seed: String(look.seed ?? 1),
    backgroundColor: ['transparent'],
    ...opts,
  } as never).toString();
  // warm ink instead of pure black, drop metadata
  svg = svg
    .replace(/<metadata[\s\S]*?<\/metadata>/, '')
    .replace(/fill="#000000"/g, `fill="${INK}"`)
    .replace(/fill="#000"/g, `fill="${INK}"`);
  // garments go right after the skin path: over the bare shoulders, under the
  // facial features and the front hair (so long hair falls over the collar)
  const gi = svg.indexOf(GROUP);
  const skinTag = `fill="#${(opts.skinColor as string[])[0]}"`;
  const si = gi >= 0 ? svg.indexOf(skinTag, gi) : -1;
  if (si >= 0) {
    const pi = svg.indexOf('/>', si) + 2;
    svg = svg.slice(0, pi) + `<g transform="translate(-10 60)">${under}</g>` + svg.slice(pi);
  }
  // our own frame: shoulders-up, a little headroom for hats
  svg = svg.replace(
    /<svg[^>]*>/,
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 20 900 900">'
  );
  svg = svg.replace(/<\/svg>\s*$/, `${over}</svg>`);
  return svg;
}

export function Avatar({
  look,
  mood,
  size = 200,
  eating = false,
}: {
  look: Look;
  mood: Mood;
  size?: number;
  eating?: boolean;
}) {
  const key = JSON.stringify([look.seed, look.special, look.disguise, look.kid, mood, eating]);
  const uri = useMemo(
    () => 'data:image/svg+xml;utf8,' + encodeURIComponent(avatarSvg(look, mood, eating)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  return <img src={uri} width={size} height={size} alt="" className="avatar" draggable={false} />;
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
      <div className="crowd" style={{ width: size * 1.3, height: size }}>
        <Avatar look={{ seed: 11 } as Look} mood="happy" size={size * 0.75} />
        <Avatar look={{ seed: 29 } as Look} mood="neutral" size={size * 0.75} />
      </div>
    );
  return (
    <Avatar look={{ seed: 1, special: who as Look['special'] } as Look} mood={mood} size={size} />
  );
}
