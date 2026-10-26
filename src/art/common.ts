// Shared drawing helpers: palette, colour maths, soft shadows, cached sprites, textures.

export type Ctx = CanvasRenderingContext2D;

export const PAL = {
  cream: '#fff7ea',
  paper: '#f7ead6',
  rice: '#fbf6ec',
  wood: '#d9b48a',
  woodDark: '#b98a5e',
  hinoki: '#ecd3ad',
  walnut: '#6e4b32',
  ink: '#4a3326', // warm brown "outline" colour (never black)
  inkSoft: '#7a5a46',
  coral: '#ef8f7a',
  salmon: '#f59b6f',
  honey: '#e9b45c',
  matcha: '#a5c48e',
  moss: '#6e8f5e',
  indigo: '#56638c',
  indigoDeep: '#3d4770',
  sakura: '#f3b8c4',
  nori: '#2f3a2c',
  noriHi: '#4a5a44',
};

/** pixels per logical unit — set by the view on resize so sprites stay crisp */
export let PX = 1;
export function setPx(px: number) {
  if (Math.abs(px - PX) > 0.01) {
    PX = px;
    spriteCache.clear();
  }
}

export function hexToRgb(h: string): [number, number, number] {
  const v = h.replace('#', '');
  const n = parseInt(v.length === 3 ? v.replace(/./g, (c) => c + c) : v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(a: string, b: string, t: number): string {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const c = A.map((x, i) => Math.round(x + (B[i] - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
export function rgba(h: string, a: number) {
  const [r, g, b] = hexToRgb(h);
  return `rgba(${r},${g},${b},${a})`;
}
export const lighten = (h: string, t: number) => mix(h, '#ffffff', t);
export const darken = (h: string, t: number) => mix(h, '#2a1810', t);

export function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

export function ellipse(c: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  c.beginPath();
  c.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), rot, 0, Math.PI * 2);
}

/** soft contact shadow under an object */
export function contactShadow(c: Ctx, x: number, y: number, rx: number, ry: number, a = 0.28) {
  const g = c.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(70,40,20,${a})`);
  g.addColorStop(0.6, `rgba(70,40,20,${a * 0.45})`);
  g.addColorStop(1, 'rgba(70,40,20,0)');
  c.save();
  c.translate(x, y);
  c.scale(1, ry / rx);
  c.translate(-x, -y);
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, rx, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export function lin(
  c: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  stops: [number, string][]
) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}
export function rad(
  c: Ctx,
  x: number,
  y: number,
  r0: number,
  r1: number,
  stops: [number, string][],
  x1 = x,
  y1 = y
) {
  const g = c.createRadialGradient(x, y, r0, x1, y1, r1);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  return g;
}

/** deterministic pseudo random from a seed */
export function srand(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// ---------- cached sprites ----------

interface Sprite {
  cv: HTMLCanvasElement | OffscreenCanvas;
  w: number;
  h: number;
  ox: number;
  oy: number;
}
const spriteCache = new Map<string, Sprite>();

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil(w));
  cv.height = Math.max(1, Math.ceil(h));
  return cv;
}

/**
 * Draws `fn` once into an offscreen canvas (logical size w×h, origin at ox,oy)
 * and blits it afterwards. Everything static goes through here.
 */
export function sprite(
  c: Ctx,
  key: string,
  w: number,
  h: number,
  ox: number,
  oy: number,
  fn: (c: Ctx) => void,
  x: number,
  y: number,
  scale = 1
) {
  let s = spriteCache.get(key);
  if (!s) {
    const res = PX * Math.max(1, scale);
    const cv = makeCanvas(w * res, h * res);
    const cc = cv.getContext('2d')!;
    cc.scale(res, res);
    cc.translate(ox, oy);
    fn(cc);
    s = { cv, w, h, ox, oy };
    spriteCache.set(key, s);
    if (spriteCache.size > 900) {
      const first = spriteCache.keys().next().value;
      if (first) spriteCache.delete(first);
    }
  }
  c.drawImage(
    s.cv as CanvasImageSource,
    x - s.ox * scale,
    y - s.oy * scale,
    s.w * scale,
    s.h * scale
  );
}

export function clearSprites(prefix?: string) {
  if (!prefix) return spriteCache.clear();
  for (const k of [...spriteCache.keys()]) if (k.startsWith(prefix)) spriteCache.delete(k);
}

// ---------- textures ----------

/** warm wood grain fill for a rect */
export function woodGrain(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  base: string,
  seed = 1,
  opts: { planks?: number; vertical?: boolean; strength?: number } = {}
) {
  const r = srand(seed);
  const strength = opts.strength ?? 1;
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.fillStyle = lin(c, x, y, x, y + h, [
    [0, lighten(base, 0.08)],
    [1, darken(base, 0.06)],
  ]);
  c.fillRect(x, y, w, h);
  const planks = opts.planks ?? 0;
  const vertical = !!opts.vertical;
  const len = vertical ? h : w;
  const across = vertical ? w : h;
  // grain lines
  const lines = Math.floor(across / 5);
  for (let i = 0; i < lines; i++) {
    const p = (i / lines) * across + r() * 4;
    c.strokeStyle = rgba(darken(base, 0.35), (0.05 + r() * 0.09) * strength);
    c.lineWidth = 0.6 + r() * 1.4;
    c.beginPath();
    const amp = 1 + r() * 3;
    const freq = 0.004 + r() * 0.012;
    const ph = r() * 10;
    for (let s = 0; s <= len; s += 12) {
      const q = p + Math.sin(s * freq + ph) * amp + Math.sin(s * freq * 3.1 + ph) * amp * 0.3;
      if (vertical) {
        if (s === 0) c.moveTo(x + q, y + s);
        else c.lineTo(x + q, y + s);
      } else if (s === 0) c.moveTo(x + s, y + q);
      else c.lineTo(x + s, y + q);
    }
    c.stroke();
  }
  // knots
  const knots = Math.floor((w * h) / 90000);
  for (let i = 0; i < knots; i++) {
    const kx = x + r() * w;
    const ky = y + r() * h;
    for (let k = 4; k > 0; k--) {
      c.strokeStyle = rgba(darken(base, 0.4), 0.06 * strength);
      c.lineWidth = 1;
      ellipse(c, kx, ky, k * 5, k * 1.6, vertical ? Math.PI / 2 : 0);
      c.stroke();
    }
  }
  // planks
  if (planks > 0) {
    for (let i = 1; i < planks; i++) {
      const p = (i / planks) * across;
      c.fillStyle = rgba(darken(base, 0.45), 0.35);
      if (vertical) c.fillRect(x + p - 1, y, 1.6, h);
      else c.fillRect(x, y + p - 1, w, 1.6);
      c.fillStyle = rgba('#ffffff', 0.12);
      if (vertical) c.fillRect(x + p + 0.8, y, 1, h);
      else c.fillRect(x, y + p + 0.8, w, 1);
    }
  }
  c.restore();
}

/** paper / plaster speckle over a rect */
export function speckle(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  col: string,
  n: number,
  seed = 3,
  a = 0.06
) {
  const r = srand(seed);
  c.fillStyle = rgba(col, a);
  for (let i = 0; i < n; i++) {
    const s = 0.5 + r() * 1.6;
    c.fillRect(x + r() * w, y + r() * h, s, s);
  }
}

/** a little highlight sheen ellipse */
export function sheen(c: Ctx, x: number, y: number, rx: number, ry: number, a = 0.5, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.scale(1, ry / rx);
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, rx, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export function text(
  c: Ctx,
  s: string,
  x: number,
  y: number,
  size: number,
  col: string,
  opts: {
    font?: 'display' | 'body' | 'type' | 'brush';
    align?: CanvasTextAlign;
    weight?: number;
    base?: CanvasTextBaseline;
    maxW?: number;
  } = {}
) {
  const fam =
    opts.font === 'type'
      ? '"Courier Prime", "Courier New", monospace'
      : opts.font === 'body'
        ? '"Quicksand", "Nunito", system-ui, sans-serif'
        : opts.font === 'brush'
          ? '"Yuji Syuku", "Fredoka", serif'
          : '"Fredoka", "Quicksand", system-ui, sans-serif';
  c.font = `${opts.weight ?? 600} ${size}px ${fam}`;
  c.textAlign = opts.align ?? 'center';
  c.textBaseline = opts.base ?? 'middle';
  c.fillStyle = col;
  c.fillText(s, x, y, opts.maxW);
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
export const back = (t: number) => {
  const k = 1.70158;
  const x = clamp(t, 0, 1) - 1;
  return x * x * ((k + 1) * x + k) + 1;
};
