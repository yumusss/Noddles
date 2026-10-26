// Shared drawing helpers and the game's pastel palette.
// Every art module draws with Canvas 2D into a context that is already scaled
// to logical units (the game's logical short side is always 720).

export type Ctx = CanvasRenderingContext2D;

// ---------- palette ----------
// Warm, pastel, "Pinterest café" look. Keep saturation low, contrast soft.
export const PAL = {
  cream: '#fff6e9',
  paper: '#fbeedc',
  sand: '#f1dfc4',
  latte: '#d9b893',
  wood: '#c99a6b',
  woodDark: '#9d6f47',
  walnut: '#6e4b32',
  ink: '#3a2a22',
  inkSoft: '#6b5143',
  blush: '#f6b8b0',
  coral: '#ef8a76',
  tomato: '#d9573f',
  butter: '#f8d98a',
  honey: '#e8b35a',
  matcha: '#9fc39a',
  sage: '#b9c9a7',
  moss: '#6f8f66',
  sky: '#cfe3ec',
  blue: '#8fb7cf',
  indigo: '#55628a',
  lilac: '#d6c4e3',
  rose: '#e9a3b7',
  white: '#ffffff',
  shadow: 'rgba(60,35,20,0.18)',
};

export type Tod = 'sabah' | 'ogle' | 'gunbatimi' | 'aksam';

/** Ambient light for each time of day: a tint drawn over the scene and a lamp strength. */
export const TOD_LIGHT: Record<
  Tod,
  { tint: string; alpha: number; lamp: number; sky: [string, string] }
> = {
  sabah: { tint: '#ffe9c2', alpha: 0.12, lamp: 0, sky: ['#bfe0f2', '#fff1d6'] },
  ogle: { tint: '#ffffff', alpha: 0.0, lamp: 0, sky: ['#9ccbe6', '#dff0f7'] },
  gunbatimi: { tint: '#ff9a62', alpha: 0.18, lamp: 0.5, sky: ['#f6a56b', '#ffd9a6'] },
  aksam: { tint: '#3b3f7a', alpha: 0.28, lamp: 1, sky: ['#2b2f5e', '#5a4a7e'] },
};

// ---------- colour helpers ----------
export function hexToRgb(h: string): [number, number, number] {
  const s = h.replace('#', '');
  const n = parseInt(
    s.length === 3
      ? s
          .split('')
          .map((c) => c + c)
          .join('')
      : s,
    16
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour; amt in -1..1. */
export function shade(h: string, amt: number, alpha = 1): string {
  const [r, g, b] = hexToRgb(h);
  const f = (c: number) => Math.round(amt >= 0 ? c + (255 - c) * amt : c * (1 + amt));
  return `rgba(${f(r)},${f(g)},${f(b)},${alpha})`;
}

export function rgba(h: string, alpha: number): string {
  const [r, g, b] = hexToRgb(h);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const m = A.map((v, i) => Math.round(v + (B[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

// ---------- randomness ----------
/** Small deterministic PRNG (mulberry32). Use for stable textures. */
export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------- path helpers ----------
export function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

export function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.closePath();
}

export function circle(c: Ctx, x: number, y: number, r: number) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.closePath();
}

/** Soft drop shadow under an object (an ellipse of blurred darkness). */
export function softShadow(c: Ctx, x: number, y: number, rx: number, ry: number, alpha = 0.22) {
  const g = c.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(50,30,15,${alpha})`);
  g.addColorStop(1, 'rgba(50,30,15,0)');
  c.save();
  c.scale(1, ry / rx);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, (y * rx) / ry, rx, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Linear gradient from top (c0) to bottom (c1) over a rect. */
export function vGrad(c: Ctx, y0: number, y1: number, c0: string, c1: string) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

export function hGrad(c: Ctx, x0: number, x1: number, c0: string, c1: string) {
  const g = c.createLinearGradient(x0, 0, x1, 0);
  g.addColorStop(0, c0);
  g.addColorStop(1, c1);
  return g;
}

/** Radial highlight (glossy spot). */
export function gloss(c: Ctx, x: number, y: number, r: number, alpha = 0.5) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${alpha})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  circle(c, x, y, r);
  c.fill();
}

/** Subtle paper/wood grain noise: a few translucent speckles. */
export function speckle(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  n: number,
  color = 'rgba(0,0,0,0.05)'
) {
  const r = rng(seed);
  c.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const px = x + r() * w;
    const py = y + r() * h;
    const s = 0.6 + r() * 1.6;
    c.fillRect(px, py, s, s);
  }
}

// ---------- offscreen sprite cache ----------
const cache = new Map<string, HTMLCanvasElement>();

/**
 * Draw once into an offscreen canvas and reuse. `draw` receives a context whose
 * origin is the top-left of a w×h box, already scaled by `res` for crispness.
 */
export function sprite(
  key: string,
  w: number,
  h: number,
  draw: (c: Ctx) => void,
  res = 2
): HTMLCanvasElement {
  let cv = cache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w * res));
  cv.height = Math.max(1, Math.ceil(h * res));
  const c = cv.getContext('2d')!;
  c.scale(res, res);
  draw(c);
  cache.set(key, cv);
  return cv;
}

export function clearSprites(prefix?: string) {
  if (!prefix) return cache.clear();
  for (const k of [...cache.keys()]) if (k.startsWith(prefix)) cache.delete(k);
}

/** Draw a cached sprite at (x,y) with logical size w×h. */
export function blit(c: Ctx, s: HTMLCanvasElement, x: number, y: number, w: number, h: number) {
  c.drawImage(s, x, y, w, h);
}

// ---------- text ----------
export const FONT_DISPLAY = '"Baloo 2", "Nunito", system-ui, sans-serif';
export const FONT_BODY = '"Nunito", system-ui, sans-serif';

export function label(
  c: Ctx,
  text: string,
  x: number,
  y: number,
  size: number,
  color = PAL.ink,
  weight = 800,
  align: CanvasTextAlign = 'center'
) {
  c.font = `${weight} ${size}px ${FONT_DISPLAY}`;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillStyle = color;
  c.fillText(text, x, y);
}
