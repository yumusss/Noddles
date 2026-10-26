// All food drawing: topping pieces, noodles, broths/sauces, the bowl from above,
// ingredient tubs, noodle trays, stock pots, bowl icons and small UI thumbnails.
// Pure Canvas 2D. Everything static is pre-rendered into sprites.
import {
  PAL,
  hexToRgb,
  shade,
  rgba,
  mix,
  rng,
  roundRect,
  ellipse,
  circle,
  softShadow,
  gloss,
  speckle,
  sprite,
  clamp,
  lerp,
} from './common';
import type { Ctx } from './common';
import { bowlStyle } from '../game/data';
import type { Thick, BowlStyle } from '../game/data';
import { cookOf } from '../game/bowl';
import type { BowlState, CookState } from '../game/bowl';

const OUT = 'rgba(60,35,20,0.25)';
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------
// Toppings
// ---------------------------------------------------------------------------
// Pieces are drawn at "real" scale for a 300px bowl: an ajitama half is big,
// a chashu slice covers a good part of the surface. Painterly-realistic:
// soft edges, subsurface colour, contact shadows, no cartoon outlines.

export const PIECE_SIZE: Record<string, number> = {
  yesil: 40,
  yumurta: 68,
  chashu: 74,
  nori: 74,
  pakchoi: 56,
  filiz: 46,
  misir: 36,
  mantar: 48,
  aciyag: 52,
  biber: 30,
  tofu: 42,
  kimchi: 46,
  karides: 74,
  naruto: 46,
  lime: 40,
  bambu: 56,
  citir: 38,
  susam: 36,
};

export const PIECE_VARIANTS: Record<string, number> = {
  yesil: 3,
  yumurta: 3,
  chashu: 3,
  nori: 3,
  pakchoi: 2,
  filiz: 3,
  misir: 3,
  mantar: 2,
  aciyag: 3,
  biber: 3,
  tofu: 2,
  kimchi: 3,
  karides: 2,
  naruto: 2,
  lime: 2,
  bambu: 3,
  citir: 3,
  susam: 3,
};

/** Footprint (w,h) of the solid pieces, for the contact shadow. Scatters draw their own. */
const PIECE_WH: Record<string, [number, number]> = {
  yumurta: [68, 53],
  chashu: [72, 66],
  nori: [74, 47],
  pakchoi: [50, 56],
  mantar: [48, 46],
  tofu: [40, 40],
  kimchi: [46, 40],
  karides: [74, 36],
  naruto: [46, 46],
  lime: [40, 36],
  bambu: [56, 22],
};

/** Irregular organic closed path around (cx,cy) with mean radius r. */
function blobPath(
  c: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rand: () => number,
  wob = 0.18,
  n = 9
) {
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const k = 1 + (rand() - 0.5) * 2 * wob;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  smoothClosed(c, pts);
}

function smoothClosed(c: Ctx, pts: [number, number][]) {
  const n = pts.length;
  c.beginPath();
  const m0 = mid(pts[n - 1], pts[0]);
  c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % n];
    const m = mid(p, q);
    c.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  c.closePath();
}

const mid = (a: [number, number], b: [number, number]): [number, number] => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
];

function radial(c: Ctx, x: number, y: number, r0: number, r1: number, stops: [number, string][]) {
  const g = c.createRadialGradient(x, y, r0, x, y, r1);
  for (const [t, col] of stops) g.addColorStop(t, col);
  return g;
}

function linear(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [t, col] of stops) g.addColorStop(t, col);
  return g;
}

/**
 * Ambient-occlusion band just inside a closed path: clip to the path and stroke
 * it with a wide translucent line (half of it falls inside). Feathered with
 * shadowBlur – fine inside sprites.
 */
function edgeAO(c: Ctx, path: () => void, w: number, col: string, blur = 0) {
  c.save();
  path();
  c.clip();
  path();
  c.lineWidth = w * 2;
  c.strokeStyle = col;
  if (blur > 0) {
    c.shadowColor = col;
    c.shadowBlur = blur;
  }
  c.stroke();
  c.restore();
}

/** Small soft contact shadow for scatter bits. */
function dot(c: Ctx, x: number, y: number, r: number, col: string) {
  circle(c, x, y, r);
  c.fillStyle = col;
  c.fill();
}

function miniShadow(c: Ctx, x: number, y: number, rx: number, ry: number, a = 0.28) {
  c.save();
  c.shadowColor = `rgba(40,25,10,${a})`;
  c.shadowBlur = Math.max(1.5, rx * 0.5);
  c.shadowOffsetY = ry * 0.4;
  c.fillStyle = `rgba(40,25,10,${a * 0.5})`;
  ellipse(c, x, y, rx, ry);
  c.fill();
  c.restore();
}

/** Soft specular blob (elliptical, feathered). */
function spec(c: Ctx, x: number, y: number, rx: number, ry: number, a: number, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, ry / rx);
  c.fillStyle = radial(c, 0, 0, 0, rx, [
    [0, `rgba(255,255,255,${a})`],
    [0.55, `rgba(255,255,255,${a * 0.55})`],
    [1, 'rgba(255,255,255,0)'],
  ]);
  circle(c, 0, 0, rx);
  c.fill();
  c.restore();
}

/** Egg-ish oval: pointed toward +x. */
function eggPath(c: Ctx, rx: number, ry: number, taper = 0.14) {
  c.beginPath();
  const n = 48;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry * (1 - taper * Math.cos(a));
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.closePath();
}

type PieceDrawer = (c: Ctx, v: number, rand: () => number) => void;

const PIECES: Record<string, PieceDrawer> = {
  // --- green onion: a loose pinch of rings, a few cut on the bias ---
  yesil(c, v, rand) {
    const n = 6 + (v % 3) + (rand() < 0.5 ? 1 : 0);
    const rings: { x: number; y: number; r: number; bias: number; ang: number; white: number }[] =
      [];
    for (let i = 0; i < n; i++) {
      const a = rand() * TAU;
      const d = Math.sqrt(rand()) * 13;
      rings.push({
        x: Math.cos(a) * d,
        y: Math.sin(a) * d,
        r: 4.4 + rand() * 1.8,
        bias: rand() < 0.3 ? 1.5 + rand() * 0.5 : 1,
        ang: rand() * TAU,
        white: rand(), // 0 = dark green top, 1 = white bottom part of the stalk
      });
    }
    rings.sort((p, q) => p.y - q.y);
    for (const g of rings) {
      c.save();
      c.translate(g.x, g.y);
      c.rotate(g.ang);
      const rx = g.r * g.bias;
      const ry = g.r;
      miniShadow(c, 0.6, 1.4, rx, ry, 0.3);
      const outer = g.white > 0.7 ? '#9ccb86' : g.white > 0.4 ? '#5fa454' : '#3f8a44';
      const wall = g.white > 0.7 ? '#eef5de' : g.white > 0.4 ? '#cfe6b8' : '#a9d394';
      const inner = g.white > 0.7 ? '#f7f9ec' : '#e5f1d2';
      // ring wall: pale inside, darker skin outside
      ellipse(c, 0, 0, rx, ry);
      c.fillStyle = radial(c, -rx * 0.15, -ry * 0.2, ry * 0.3, ry * 1.05, [
        [0, inner],
        [0.55, wall],
        [0.85, outer],
        [1, shade(outer, -0.25)],
      ]);
      c.fill();
      // bias cut: a band of wall showing along the long axis
      if (g.bias > 1) {
        ellipse(c, 0, 0, rx * 0.92, ry * 0.62);
        c.fillStyle = linear(c, -rx, 0, rx, 0, [
          [0, shade(wall, -0.08, 0.9)],
          [0.5, inner],
          [1, shade(wall, -0.05, 0.9)],
        ]);
        c.fill();
      }
      // hollow centre: a darker translucent well with a pale lip
      const hr = g.bias > 1 ? 0.42 : 0.5;
      ellipse(c, 0.2, 0.3, rx * hr, ry * hr);
      c.fillStyle = radial(c, 0, 0, 0, ry * hr, [
        [0, 'rgba(60,80,40,0.42)'],
        [0.7, 'rgba(60,80,40,0.3)'],
        [1, 'rgba(60,80,40,0.08)'],
      ]);
      c.fill();
      // membrane layers: faint concentric line
      c.strokeStyle = 'rgba(80,130,70,0.3)';
      c.lineWidth = 0.6;
      ellipse(c, 0, 0, rx * 0.72, ry * 0.72);
      c.stroke();
      // wet highlight on the wall
      spec(c, -rx * 0.3, -ry * 0.45, rx * 0.35, ry * 0.2, 0.75, -0.4);
      // thin skin edge (soft, not an outline)
      c.strokeStyle = rgba(outer, 0.55);
      c.lineWidth = 0.7;
      ellipse(c, 0, 0, rx - 0.3, ry - 0.3);
      c.stroke();
      c.restore();
    }
  },

  // --- halved soy-marinated egg (ajitama) ---
  yumurta(c, v) {
    const tilt = v === 1 ? 0.55 : v === 2 ? -0.4 : 0.08;
    c.rotate(tilt);
    const rx = 32;
    const ry = 25;
    const path = () => eggPath(c, rx, ry, 0.14);
    // white: cut face. Slightly translucent toward the edge, cool grey-blue cut line
    path();
    c.fillStyle = radial(c, -8, -8, 2, rx * 1.25, [
      [0, '#fffefa'],
      [0.45, '#fbf6ec'],
      [0.8, '#efe6d6'],
      [1, '#d9ccba'],
    ]);
    c.fill();
    // subsurface warmth at the bottom (light passing through the white)
    c.save();
    path();
    c.clip();
    c.fillStyle = radial(c, 6, 10, 0, rx, [
      [0, 'rgba(255,214,170,0.3)'],
      [1, 'rgba(255,214,170,0)'],
    ]);
    c.fillRect(-rx, -ry, rx * 2, ry * 2);
    // marinated outer: tan tint on the far (outside) rim, strongest bottom-right
    c.lineWidth = 9;
    c.strokeStyle = 'rgba(170,110,50,0.3)';
    c.shadowColor = 'rgba(170,110,50,0.5)';
    c.shadowBlur = 6;
    eggPath(c, rx + 2.5, ry + 2.5, 0.14);
    c.stroke();
    c.shadowBlur = 0;
    c.lineWidth = 3.5;
    c.strokeStyle = 'rgba(150,95,45,0.4)';
    eggPath(c, rx + 1, ry + 1, 0.14);
    c.stroke();
    c.restore();
    // cool, slightly bluish cut edge
    edgeAO(c, path, 1.6, 'rgba(120,135,150,0.28)', 1.5);
    // yolk cup: dark seam where white meets yolk
    const yx = v === 2 ? -2 : 2;
    const yy = v === 1 ? -0.5 : 1;
    const yr = 19.5;
    const yry = 15.5;
    c.save();
    c.shadowColor = 'rgba(120,70,20,0.55)';
    c.shadowBlur = 4;
    ellipse(c, yx, yy + 0.5, yr + 1.4, yry + 1.3);
    c.fillStyle = 'rgba(160,100,40,0.5)';
    c.fill();
    c.restore();
    // yolk body: deep orange-amber jammy gradient
    ellipse(c, yx, yy, yr, yry);
    c.fillStyle = radial(c, yx - 5, yy - 5, 1, yr * 1.25, [
      [0, '#ffd166'],
      [0.35, '#f9ab35'],
      [0.7, '#e37f1d'],
      [1, '#b65812'],
    ]);
    c.fill();
    // darker liquid centre, slightly off-centre and glossy
    c.save();
    ellipse(c, yx, yy, yr, yry);
    c.clip();
    c.fillStyle = radial(c, yx + 2, yy + 2.5, 0, yr * 0.62, [
      [0, 'rgba(205,95,15,0.75)'],
      [0.6, 'rgba(215,110,20,0.45)'],
      [1, 'rgba(230,140,40,0)'],
    ]);
    c.fillRect(yx - yr, yy - yry, yr * 2, yry * 2);
    // set (cooked) ring just inside the yolk edge: paler yellow
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(255,205,110,0.35)';
    ellipse(c, yx, yy, yr - 1.5, yry - 1.5);
    c.stroke();
    // rim shadow inside the yolk (it sits in a cup)
    c.lineWidth = 5;
    c.strokeStyle = 'rgba(140,70,15,0.28)';
    c.shadowColor = 'rgba(140,70,15,0.5)';
    c.shadowBlur = 4;
    ellipse(c, yx, yy - 1, yr + 2.5, yry + 2.5);
    c.stroke();
    c.restore();
    // rim light on the cut edge of the white
    rimLight(c, path, 1.4, 'rgba(255,255,255,0.8)');
    // specular on the jammy surface
    spec(c, yx - 7, yy - 6, 6.5, 4, 0.9, -0.5);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    ellipse(c, yx - 7.5, yy - 6.5, 3.4, 1.9);
    c.fill();
    spec(c, yx + 6, yy - 8, 2.6, 1.4, 0.5, 0.4);
    // soft sheen on the white
    spec(c, -14, -11, 10, 7, 0.45, -0.6);
  },

  // --- chashu: rolled pork belly slice ---
  chashu(c, v, rand) {
    c.rotate(v * 0.8 - 0.3);
    const rx = 34 - v * 1.5;
    const ry = 30 + v * 1.2;
    const seed = 500 + v * 13;
    const path = () => blobPath(c, 0, 0, rx, ry, rng(seed), 0.07, 12);
    const sx = rx / Math.min(rx, ry);
    const sy = ry / Math.min(rx, ry);
    const rmin = Math.min(rx, ry);
    // meat base
    path();
    c.fillStyle = radial(c, -6, -8, 3, rx * 1.35, [
      [0, '#c98b70'],
      [0.5, '#ad6a52'],
      [0.85, '#8d523c'],
      [1, '#6e3e2b'],
    ]);
    c.fill();
    c.save();
    path();
    c.clip();
    // spiral helper: rolled belly = concentric-ish bands of meat and fat
    const spiralPts = (turns: number, r0: number, r1: number, ph: number, wobA: number) => {
      const pts: [number, number][] = [];
      const N = 110;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const a = ph + t * TAU * turns;
        const wob = Math.sin(t * 23 + v * 2) * wobA + Math.sin(t * 7 + 1) * wobA * 0.6;
        const rr = lerp(r0, r1, t) * rmin + wob;
        pts.push([Math.cos(a) * rr * sx, Math.sin(a) * rr * sy]);
      }
      return pts;
    };
    const strokePts = (pts: [number, number][], w: number, col: string) => {
      c.lineWidth = w;
      c.strokeStyle = col;
      c.beginPath();
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const m = mid(pts[i], pts[i + 1]);
        c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
      c.stroke();
    };
    const ph = -0.6 + v * 0.9;
    const fat = spiralPts(1.7, 0.9, 0.12, ph, 1.4);
    const meatLine = spiralPts(1.7, 0.72, 0.0, ph + 0.35, 1.0);
    // darker meat seam between layers (the roll's layers)
    strokePts(meatLine, 3.6, 'rgba(95,40,25,0.3)');
    strokePts(meatLine, 1.2, 'rgba(60,25,12,0.3)');
    // muscle fibres: short strokes roughly following the spiral tangent
    c.lineCap = 'round';
    for (let i = 0; i < 110; i++) {
      const x = (rand() - 0.5) * rx * 2;
      const y = (rand() - 0.5) * ry * 2;
      const L = 2.5 + rand() * 6;
      const a = Math.atan2(y, x) + Math.PI / 2 + (rand() - 0.5) * 0.6;
      c.lineWidth = 0.6 + rand() * 0.9;
      c.strokeStyle = rand() < 0.55 ? 'rgba(80,32,20,0.26)' : 'rgba(240,190,165,0.22)';
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
      c.stroke();
    }
    // fat band with varying width: drawn as overlapping segments
    const fatBand = (pts: [number, number][], base: number, col: string, wv: number) => {
      c.strokeStyle = col;
      for (let i = 0; i < pts.length - 1; i++) {
        const t = i / pts.length;
        const wmul = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 17 + v * 3)) + Math.sin(t * 41) * 0.15;
        c.lineWidth = Math.max(0.5, base * (wmul * wv + (1 - wv)));
        c.beginPath();
        c.moveTo(pts[i][0], pts[i][1]);
        c.lineTo(pts[i + 1][0], pts[i + 1][1]);
        c.stroke();
      }
    };
    fatBand(fat, 8.5, 'rgba(110,55,35,0.2)', 1);
    fatBand(fat, 7, 'rgba(238,210,192,0.95)', 1);
    fatBand(fat, 5, '#f6e7da', 1);
    fatBand(fat, 1.6, 'rgba(255,250,244,0.7)', 0.6);
    // small intramuscular fat veins
    c.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const p = fat[Math.floor(rand() * fat.length)];
      const a = rand() * TAU;
      const L = 3 + rand() * 6;
      c.lineWidth = 1 + rand() * 1.2;
      c.strokeStyle = 'rgba(245,225,210,0.75)';
      c.beginPath();
      c.moveTo(p[0], p[1]);
      c.quadraticCurveTo(
        p[0] + Math.cos(a) * L * 0.5 + (rand() - 0.5) * 3,
        p[1] + Math.sin(a) * L * 0.5 + (rand() - 0.5) * 3,
        p[0] + Math.cos(a) * L,
        p[1] + Math.sin(a) * L
      );
      c.stroke();
    }
    // fat cap: thick creamy layer along part of the rim (crescent)
    const capA = ph + 0.3;
    c.save();
    c.rotate(capA);
    c.lineCap = 'round';
    c.lineWidth = rmin * 0.22;
    c.strokeStyle = 'rgba(240,220,202,0.92)';
    c.beginPath();
    c.arc(0, 0, rmin * 0.82, -0.9, 0.9);
    c.stroke();
    c.lineWidth = rmin * 0.1;
    c.strokeStyle = 'rgba(255,246,236,0.55)';
    c.beginPath();
    c.arc(0, 0, rmin * 0.84, -0.7, 0.7);
    c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(190,140,120,0.4)';
    c.beginPath();
    c.arc(0, 0, rmin * 0.71, -0.95, 0.95);
    c.stroke();
    c.restore();
    // seared caramel rim with char flecks (thin, mottled)
    c.lineWidth = 5.5;
    c.strokeStyle = 'rgba(105,45,18,0.5)';
    c.shadowColor = 'rgba(90,40,15,0.6)';
    c.shadowBlur = 4;
    blobPath(c, 0, 0, rx + 1.5, ry + 1.5, rng(seed), 0.07, 12);
    c.stroke();
    c.shadowBlur = 0;
    c.lineWidth = 1.8;
    c.strokeStyle = 'rgba(50,20,8,0.55)';
    blobPath(c, 0, 0, rx + 0.4, ry + 0.4, rng(seed), 0.07, 12);
    c.stroke();
    for (let i = 0; i < 22; i++) {
      const a = rand() * TAU;
      const d = 0.84 + rand() * 0.14;
      const x = Math.cos(a) * rx * d;
      const y = Math.sin(a) * ry * d;
      dot(c, x, y, 0.7 + rand() * 1.5, `rgba(35,12,4,${0.3 + rand() * 0.4})`);
      if (rand() < 0.4) dot(c, x + 1, y + 1, 0.6 + rand(), 'rgba(200,120,60,0.4)');
    }
    // soy glaze: broad glossy sheen + sharp streaks
    c.fillStyle = radial(c, -rx * 0.35, -ry * 0.4, 0, rx * 0.9, [
      [0, 'rgba(255,230,210,0.3)'],
      [0.5, 'rgba(255,230,210,0.1)'],
      [1, 'rgba(255,230,210,0)'],
    ]);
    c.fillRect(-rx, -ry, rx * 2, ry * 2);
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,245,235,0.5)';
    for (let i = 0; i < 6; i++) {
      const x = (rand() - 0.5) * rx * 1.2;
      const y = (rand() - 0.5) * ry * 1.2;
      const L = 3 + rand() * 8;
      c.lineWidth = 0.8 + rand();
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + L * 0.8, y - L * 0.45);
      c.stroke();
    }
    c.restore();
    edgeAO(c, path, 2, 'rgba(60,25,10,0.35)', 3);
    rimLight(c, path, 1.2, 'rgba(255,225,200,0.55)');
    // wet glaze pooling: a couple of sharp specular beads
    c.fillStyle = 'rgba(255,250,240,0.8)';
    ellipse(c, -rx * 0.42, -ry * 0.38, 3.2, 1.7);
    c.fill();
    c.fillStyle = 'rgba(255,250,240,0.5)';
    ellipse(c, rx * 0.15, -ry * 0.6, 2, 1);
    c.fill();
  },

  // --- nori sheet ---
  nori(c, v, rand) {
    const w = v === 1 ? 62 : v === 2 ? 70 : 66;
    const h = v === 1 ? 44 : v === 2 ? 40 : 44;
    const x = -w / 2;
    const y = -h / 2;
    const fold = 10 + v * 2;
    // slightly irregular edges (hand-cut sheet)
    const e = (k: number) => (rng(900 + v * 7 + k)() - 0.5) * 1.6;
    const sheet = () => {
      c.beginPath();
      c.moveTo(x + 0.8, y + 0.4);
      c.lineTo(x + w * 0.5, y + e(1));
      c.lineTo(x + w - fold, y);
      c.lineTo(x + w, y + fold);
      c.lineTo(x + w + e(2), y + h * 0.55);
      c.lineTo(x + w - 0.5, y + h - 0.8);
      c.lineTo(x + w * 0.45, y + h + e(3));
      c.lineTo(x + 0.3, y + h);
      c.lineTo(x + e(4), y + h * 0.5);
      c.closePath();
    };
    sheet();
    c.fillStyle = linear(c, x, y, x + w, y + h, [
      [0, '#223527'],
      [0.4, '#141f17'],
      [0.75, '#182a1c'],
      [1, '#233a28'],
    ]);
    c.fill();
    c.save();
    sheet();
    c.clip();
    // mottled density first (dark and lighter patches, soft)
    for (let i = 0; i < 16; i++) {
      const px = x + rand() * w;
      const py = y + rand() * h;
      const rr = 4 + rand() * 9;
      c.fillStyle = radial(c, px, py, 0, rr, [
        [0, rand() < 0.45 ? 'rgba(5,12,8,0.35)' : 'rgba(95,140,80,0.16)'],
        [1, 'rgba(0,0,0,0)'],
      ]);
      circle(c, px, py, rr);
      c.fill();
    }
    // pressed seaweed fibres: tiny, soft, mostly one direction
    c.lineCap = 'round';
    for (let i = 0; i < 220; i++) {
      const sx = x + rand() * w;
      const sy = y + rand() * h;
      const L = 1 + rand() * 2.5;
      const a = -0.3 + (rand() - 0.5) * 1.2 + (rand() < 0.3 ? 1.5 : 0);
      c.lineWidth = 0.35 + rand() * 0.4;
      c.strokeStyle = `rgba(110,160,100,${0.04 + rand() * 0.09})`;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx + Math.cos(a) * L, sy + Math.sin(a) * L);
      c.stroke();
    }
    // purple-ish iridescence (real nori has a faint purple cast)
    c.fillStyle = radial(c, x + w * 0.3, y + h * 0.7, 0, w * 0.5, [
      [0, 'rgba(90,60,90,0.14)'],
      [1, 'rgba(90,60,90,0)'],
    ]);
    c.fillRect(x, y, w, h);
    // tiny holes (thin spots)
    for (let i = 0; i < 7; i++) {
      dot(c, x + rand() * w, y + rand() * h, 0.4 + rand() * 0.7, 'rgba(190,210,170,0.3)');
    }
    // translucent thin edge: lighter rim
    c.lineWidth = 2.4;
    c.strokeStyle = 'rgba(110,160,100,0.2)';
    sheet();
    c.stroke();
    // crinkles: soft diagonal folds, each a dark crease with a lit ridge
    c.lineCap = 'round';
    for (let i = 0; i < 4 + v; i++) {
      const fx = x + w * (0.12 + rand() * 0.7);
      const fy = y + h * (0.1 + rand() * 0.8);
      const L = h * (0.4 + rand() * 0.7);
      const a = -0.9 + (rand() - 0.5) * 0.8;
      const ex = fx + Math.cos(a) * L;
      const ey = fy + Math.sin(a) * L;
      c.save();
      c.shadowColor = 'rgba(0,8,4,0.5)';
      c.shadowBlur = 3;
      c.lineWidth = 1.6;
      c.strokeStyle = 'rgba(0,8,4,0.22)';
      c.beginPath();
      c.moveTo(fx, fy);
      c.quadraticCurveTo((fx + ex) / 2 + 4, (fy + ey) / 2 - 3, ex, ey);
      c.stroke();
      c.restore();
      c.lineWidth = 1.1;
      c.strokeStyle = 'rgba(150,190,150,0.14)';
      c.beginPath();
      c.moveTo(fx - 1.2, fy + 1.2);
      c.quadraticCurveTo((fx + ex) / 2 + 3, (fy + ey) / 2 - 2, ex - 1.2, ey + 1.2);
      c.stroke();
    }
    // sheen band
    c.fillStyle = linear(c, x, y + h, x + w * 0.7, y, [
      [0, 'rgba(255,255,255,0)'],
      [0.4, 'rgba(255,255,255,0.04)'],
      [0.5, 'rgba(255,255,255,0.14)'],
      [0.58, 'rgba(255,255,255,0.04)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    c.fillRect(x, y, w, h);
    c.restore();
    // curled corner (top-right): the flap shows the lighter underside
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.45)';
    c.shadowBlur = 3;
    c.shadowOffsetX = -1;
    c.shadowOffsetY = 1.5;
    c.beginPath();
    c.moveTo(x + w - fold, y);
    c.lineTo(x + w - fold * 0.1, y + fold * 0.9);
    c.quadraticCurveTo(x + w - fold * 0.6, y + fold * 0.35, x + w - fold * 1.05, y + fold * 0.95);
    c.closePath();
    c.fillStyle = linear(c, x + w - fold, y, x + w, y + fold, [
      [0, '#3f6a4a'],
      [0.6, '#2f5439'],
      [1, '#24422c'],
    ]);
    c.fill();
    c.restore();
    c.strokeStyle = 'rgba(190,220,180,0.3)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x + w - fold, y + 0.5);
    c.lineTo(x + w - fold * 0.95, y + fold * 0.9);
    c.stroke();
  },

  // --- pak choi half ---
  pakchoi(c, v, rand) {
    c.rotate(v === 1 ? 0.55 : -0.25);
    const leaves = [
      { x: -12, y: -11, rx: 14, ry: 19, a: -0.55, seed: 11 },
      { x: 12, y: -12, rx: 14, ry: 19, a: 0.55, seed: 23 },
      { x: 0, y: -16, rx: 13, ry: 18, a: 0.02, seed: 37 },
    ];
    // ruffled, slightly irregular leaf outline
    const leafPath = (l: (typeof leaves)[0]) => {
      const r = rng(l.seed + v * 5);
      const pts: [number, number][] = [];
      const n = 16;
      for (let i = 0; i < n; i++) {
        const t = (i / n) * TAU;
        const ruff = 1 + (r() - 0.5) * 0.16 + Math.sin(t * 5) * 0.05;
        // narrow toward the stem end (+y in leaf space)
        const taper = 1 - 0.25 * Math.max(0, Math.sin(t));
        const px = Math.cos(t) * l.rx * ruff * taper;
        const py = Math.sin(t) * l.ry * ruff;
        const ca = Math.cos(l.a);
        const sa = Math.sin(l.a);
        pts.push([l.x + px * ca - py * sa, l.y + px * sa + py * ca]);
      }
      smoothClosed(c, pts);
    };
    for (const l of leaves) {
      miniShadow(c, l.x + 1, l.y + 2, l.rx, l.ry * 0.8, 0.2);
      leafPath(l);
      c.fillStyle = radial(c, l.x - 4, l.y - 6, 1, l.ry * 1.35, [
        [0, '#8fcf78'],
        [0.5, '#5aa652'],
        [0.85, '#39803f'],
        [1, '#27602f'],
      ]);
      c.fill();
      c.save();
      leafPath(l);
      c.clip();
      // crinkle shading: pockets of dark and light
      for (let i = 0; i < 14; i++) {
        const px = l.x + (rand() - 0.5) * l.rx * 1.7;
        const py = l.y + (rand() - 0.5) * l.ry * 1.7;
        const rr = 2.5 + rand() * 6;
        c.fillStyle = radial(c, px, py, 0, rr, [
          [0, rand() < 0.5 ? 'rgba(15,60,25,0.26)' : 'rgba(205,240,170,0.22)'],
          [1, 'rgba(0,0,0,0)'],
        ]);
        circle(c, px, py, rr);
        c.fill();
      }
      // midrib + veins (pale, slightly raised)
      const dx = Math.sin(l.a);
      const dy = Math.cos(l.a);
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(25,80,35,0.35)';
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(l.x + dx * l.ry * 0.95 + 0.6, l.y + dy * l.ry * 0.95 + 0.6);
      c.lineTo(l.x - dx * l.ry * 0.7 + 0.6, l.y - dy * l.ry * 0.7 + 0.6);
      c.stroke();
      c.strokeStyle = 'rgba(228,244,205,0.95)';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(l.x + dx * l.ry * 0.95, l.y + dy * l.ry * 0.95);
      c.lineTo(l.x - dx * l.ry * 0.72, l.y - dy * l.ry * 0.72);
      c.stroke();
      c.lineWidth = 0.9;
      for (let i = 0; i < 5; i++) {
        const t = -0.5 + i * 0.3;
        const px = l.x - dx * l.ry * t;
        const py = l.y - dy * l.ry * t;
        for (const s of [-1, 1]) {
          c.strokeStyle = 'rgba(20,70,30,0.22)';
          c.lineWidth = 1.6;
          c.beginPath();
          c.moveTo(px + 0.5, py + 0.5);
          c.quadraticCurveTo(
            px + s * dy * l.rx * 0.45 - dx * 3 + 0.5,
            py - s * dx * l.rx * 0.45 - dy * 3 + 0.5,
            px + s * dy * l.rx * 0.85 - dx * 7 + 0.5,
            py - s * dx * l.rx * 0.85 - dy * 7 + 0.5
          );
          c.stroke();
          c.strokeStyle = 'rgba(228,244,205,0.6)';
          c.lineWidth = 0.9;
          c.beginPath();
          c.moveTo(px, py);
          c.quadraticCurveTo(
            px + s * dy * l.rx * 0.45 - dx * 3,
            py - s * dx * l.rx * 0.45 - dy * 3,
            px + s * dy * l.rx * 0.85 - dx * 7,
            py - s * dx * l.rx * 0.85 - dy * 7
          );
          c.stroke();
        }
      }
      // glossy wet highlight
      spec(c, l.x - 4, l.y - 7, l.rx * 0.45, l.ry * 0.25, 0.45, l.a - 0.3);
      c.restore();
      edgeAO(c, () => leafPath(l), 1.6, 'rgba(20,60,25,0.35)', 2);
    }
    // white crisp stem base
    const stem = () => {
      c.beginPath();
      c.moveTo(-14, 1);
      c.quadraticCurveTo(-15, 18, -5, 26);
      c.quadraticCurveTo(0, 29, 5, 26);
      c.quadraticCurveTo(15, 18, 14, 1);
      c.quadraticCurveTo(0, 9, -14, 1);
      c.closePath();
    };
    stem();
    c.fillStyle = radial(c, -3, 10, 1, 24, [
      [0, '#fdfff6'],
      [0.5, '#f1f6e3'],
      [0.85, '#d8e5c2'],
      [1, '#bfd3a6'],
    ]);
    c.fill();
    c.save();
    stem();
    c.clip();
    // overlapping stalks: each stalk a pale ridge with a shadow groove
    for (let i = -2; i <= 2; i++) {
      c.strokeStyle = 'rgba(140,175,120,0.5)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(i * 5.2, 3);
      c.quadraticCurveTo(i * 4.6, 14, i * 2.2, 25);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.75)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(i * 5.2 + 1.6, 4);
      c.quadraticCurveTo(i * 4.6 + 1.4, 14, i * 2.2 + 1, 24);
      c.stroke();
    }
    // slight green tint where the stems turn into leaves
    c.fillStyle = linear(c, 0, 0, 0, 10, [
      [0, 'rgba(150,200,120,0.5)'],
      [1, 'rgba(150,200,120,0)'],
    ]);
    c.fillRect(-15, 0, 30, 10);
    spec(c, -4, 12, 7, 4, 0.5, 0.9);
    c.restore();
    edgeAO(c, stem, 1.5, 'rgba(90,120,70,0.3)', 2);
  },

  // --- bean sprouts ---
  filiz(c, v, rand) {
    c.lineCap = 'round';
    const n = 9 + v;
    for (let i = 0; i < n; i++) {
      const x0 = (rand() - 0.5) * 30;
      const y0 = (rand() - 0.5) * 26;
      const a = rand() * TAU;
      const L = 18 + rand() * 16;
      const bend = (rand() - 0.5) * 16;
      const x1 = x0 + Math.cos(a) * L;
      const y1 = y0 + Math.sin(a) * L;
      const cx = (x0 + x1) / 2 - Math.sin(a) * bend;
      const cy = (y0 + y1) / 2 + Math.cos(a) * bend;
      const path = () => {
        c.beginPath();
        c.moveTo(x0, y0);
        c.quadraticCurveTo(cx, cy, x1, y1);
      };
      // soft shadow
      c.save();
      c.translate(0.7, 1.6);
      path();
      c.lineWidth = 3.4;
      c.strokeStyle = 'rgba(60,40,20,0.2)';
      c.stroke();
      c.restore();
      // translucent stem: pale with a cooler core
      path();
      c.lineWidth = 3.2;
      c.strokeStyle = 'rgba(236,230,212,0.85)';
      c.stroke();
      path();
      c.lineWidth = 1.8;
      c.strokeStyle = 'rgba(248,246,236,0.9)';
      c.stroke();
      path();
      c.lineWidth = 0.7;
      c.strokeStyle = 'rgba(255,255,255,0.8)';
      c.stroke();
      // thin root tail
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x0 - Math.cos(a) * 4, y0 - Math.sin(a) * 4 + 1);
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(200,185,150,0.7)';
      c.stroke();
      // yellow bean head (two cotyledons)
      c.save();
      c.translate(x1, y1);
      c.rotate(a);
      miniShadow(c, 0.4, 1.2, 3.6, 2.4, 0.25);
      ellipse(c, 0, 0, 3.8, 2.7);
      c.fillStyle = radial(c, -1, -1, 0, 4.2, [
        [0, '#fbf0b8'],
        [0.6, '#e9d379'],
        [1, '#c4a94c'],
      ]);
      c.fill();
      c.strokeStyle = 'rgba(160,130,50,0.45)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(-3, 0.2);
      c.lineTo(3.2, 0.2);
      c.stroke();
      spec(c, -1.2, -1, 1.5, 0.9, 0.7);
      c.restore();
    }
  },

  // --- sweet corn kernels ---
  misir(c, v, rand) {
    const n = 7 + (v % 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + v * 0.7 + rand() * 0.5;
      const d = i < 2 ? rand() * 4 : 8 + rand() * 6;
      c.save();
      c.translate(Math.cos(a) * d, Math.sin(a) * d);
      c.rotate(rand() * TAU);
      const kw = 5.2 + rand() * 1.2;
      const kh = 4.6 + rand() * 1;
      miniShadow(c, 0.4, 1.3, kw, kh * 0.9, 0.3);
      roundRect(c, -kw, -kh, kw * 2, kh * 2, 3.6);
      c.fillStyle = radial(c, -kw * 0.35, -kh * 0.4, 0.5, kw * 1.7, [
        [0, '#fff0a0'],
        [0.45, '#fbd44c'],
        [0.85, '#e4a92a'],
        [1, '#c3871c'],
      ]);
      c.fill();
      // crease / dimple
      c.strokeStyle = 'rgba(170,110,20,0.45)';
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(kw * 0.1, -kh * 0.3);
      c.quadraticCurveTo(kw * 0.6, 0, kw * 0.15, kh * 0.55);
      c.stroke();
      // skin translucency
      c.fillStyle = 'rgba(255,250,200,0.3)';
      ellipse(c, -kw * 0.1, 0, kw * 0.6, kh * 0.55);
      c.fill();
      spec(c, -kw * 0.4, -kh * 0.45, kw * 0.45, kh * 0.3, 0.85, -0.5);
      c.restore();
    }
  },

  // --- shiitake cap ---
  mantar(c, v, rand) {
    c.rotate(v * 0.9);
    const r = 23;
    const path = () => blobPath(c, 0, 0, r, r * 0.94, rng(77 + v), 0.07, 11);
    path();
    c.fillStyle = radial(c, -6, -7, 2, r * 1.3, [
      [0, '#b48057'],
      [0.45, '#86563a'],
      [0.8, '#5c3722'],
      [1, '#3f2415'],
    ]);
    c.fill();
    c.save();
    path();
    c.clip();
    // velvety mottling
    for (let i = 0; i < 14; i++) {
      const px = (rand() - 0.5) * r * 1.7;
      const py = (rand() - 0.5) * r * 1.7;
      const rr = 3 + rand() * 7;
      c.fillStyle = radial(c, px, py, 0, rr, [
        [0, rand() < 0.5 ? 'rgba(30,14,6,0.28)' : 'rgba(210,160,110,0.18)'],
        [1, 'rgba(0,0,0,0)'],
      ]);
      circle(c, px, py, rr);
      c.fill();
    }
    // lighter cracks (the cap splits as it dries), radiating from centre
    c.lineCap = 'round';
    for (let i = 0; i < 13; i++) {
      const a = rand() * TAU;
      const d0 = 4 + rand() * 7;
      const d1 = d0 + 5 + rand() * 9;
      const jag = (rand() - 0.5) * 0.35;
      c.lineWidth = 1.2 + rand() * 1.4;
      c.strokeStyle = `rgba(236,214,180,${0.3 + rand() * 0.35})`;
      c.beginPath();
      c.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
      c.lineTo(Math.cos(a + jag) * ((d0 + d1) / 2), Math.sin(a + jag) * ((d0 + d1) / 2));
      c.lineTo(Math.cos(a) * d1, Math.sin(a) * d1);
      c.stroke();
      c.lineWidth = 0.5;
      c.strokeStyle = 'rgba(60,30,15,0.5)';
      c.stroke();
    }
    // gills visible around the lower rim: cream band with fine radial lines
    c.lineWidth = 5;
    c.strokeStyle = 'rgba(232,206,166,0.85)';
    c.beginPath();
    c.arc(0, 0, r - 1.2, 0.15, 2.7);
    c.stroke();
    c.lineWidth = 0.7;
    c.strokeStyle = 'rgba(120,80,45,0.55)';
    for (let a = 0.2; a < 2.65; a += 0.09) {
      c.beginPath();
      c.moveTo(Math.cos(a) * (r - 3.8), Math.sin(a) * (r - 3.8));
      c.lineTo(Math.cos(a) * (r + 1), Math.sin(a) * (r + 1));
      c.stroke();
    }
    // cross cut: grooves showing pale flesh
    c.lineCap = 'round';
    for (const a of [0.5, 0.5 + Math.PI / 2]) {
      const ex = Math.cos(a) * 9;
      const ey = Math.sin(a) * 9;
      c.lineWidth = 6;
      c.strokeStyle = 'rgba(45,22,10,0.6)';
      c.beginPath();
      c.moveTo(-ex, -ey);
      c.lineTo(ex, ey);
      c.stroke();
      c.lineWidth = 3.4;
      c.strokeStyle = '#efdcc0';
      c.beginPath();
      c.moveTo(-ex * 0.95, -ey * 0.95);
      c.lineTo(ex * 0.95, ey * 0.95);
      c.stroke();
      c.lineWidth = 1.2;
      c.strokeStyle = 'rgba(120,80,40,0.35)';
      c.beginPath();
      c.moveTo(-ex * 0.9 - Math.sin(a), -ey * 0.9 + Math.cos(a));
      c.lineTo(ex * 0.9 - Math.sin(a), ey * 0.9 + Math.cos(a));
      c.stroke();
    }
    // soft matte sheen
    spec(c, -8, -9, 11, 8, 0.28, -0.6);
    c.restore();
    edgeAO(c, path, 2.2, 'rgba(30,14,6,0.45)', 3);
    rimLight(c, path, 1.1, 'rgba(230,200,170,0.45)');
  },

  // --- chilli oil pool ---
  aciyag(c, v, rand) {
    const path = () => blobPath(c, 0, 0, 22, 17, rng(31 + v), 0.28, 10);
    // feathered translucent red pool
    c.save();
    path();
    c.clip();
    c.fillStyle = radial(c, -2, -1, 2, 25, [
      [0, 'rgba(225,70,25,0.78)'],
      [0.55, 'rgba(205,45,20,0.62)'],
      [0.85, 'rgba(190,35,15,0.4)'],
      [1, 'rgba(180,30,10,0.12)'],
    ]);
    c.fillRect(-26, -22, 52, 44);
    // deeper pooling in the middle
    c.fillStyle = radial(c, 3, 2, 0, 12, [
      [0, 'rgba(150,20,10,0.35)'],
      [1, 'rgba(150,20,10,0)'],
    ]);
    c.fillRect(-26, -22, 52, 44);
    // pepper flakes + sediment
    for (let i = 0; i < 16; i++) {
      c.save();
      c.translate((rand() - 0.5) * 36, (rand() - 0.5) * 26);
      c.rotate(rand() * TAU);
      c.fillStyle = rand() < 0.6 ? 'rgba(110,15,8,0.75)' : 'rgba(190,60,20,0.8)';
      roundRect(c, -1.4, -0.8, 2.8, 1.6, 0.5);
      c.fill();
      c.restore();
    }
    // oily glints
    spec(c, -7, -6, 9, 5, 0.5, -0.5);
    c.fillStyle = 'rgba(255,255,255,0.55)';
    ellipse(c, 8, 4, 3.4, 1.5);
    c.fill();
    c.restore();
    // separated droplets around
    for (let i = 0; i < 7 + v; i++) {
      const a = rand() * TAU;
      const d = 19 + rand() * 6;
      const r = 1.2 + rand() * 2.2;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d;
      circle(c, x, y, r);
      c.fillStyle = radial(c, x - r * 0.3, y - r * 0.3, 0, r, [
        [0, 'rgba(240,110,50,0.8)'],
        [1, 'rgba(200,40,15,0.55)'],
      ]);
      c.fill();
    }
  },

  // --- red chilli rings ---
  biber(c, v, rand) {
    const n = 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + v * 0.7;
      const d = 7.5;
      c.save();
      c.translate(Math.cos(a) * d, Math.sin(a) * d);
      c.rotate(rand() * 0.8);
      const r = 6.2 + rand() * 1.2;
      miniShadow(c, 0.5, 1.4, r, r * 0.85, 0.3);
      ellipse(c, 0, 0, r, r * 0.9);
      c.fillStyle = radial(c, -r * 0.3, -r * 0.35, 0, r * 1.4, [
        [0, '#f57a56'],
        [0.5, '#dc3a2a'],
        [0.85, '#b4241e'],
        [1, '#8a1816'],
      ]);
      c.fill();
      // pale inner flesh ring, translucent
      ellipse(c, 0, 0, r * 0.66, r * 0.6);
      c.fillStyle = radial(c, 0, 0, 0, r * 0.66, [
        [0, 'rgba(250,215,195,0.95)'],
        [0.75, 'rgba(245,190,165,0.9)'],
        [1, 'rgba(225,120,95,0.9)'],
      ]);
      c.fill();
      // hollow with seeds
      ellipse(c, 0.3, 0.3, r * 0.42, r * 0.36);
      c.fillStyle = 'rgba(150,50,35,0.3)';
      c.fill();
      for (let k = 0; k < 3; k++) {
        const sa = rand() * TAU;
        c.save();
        c.translate(Math.cos(sa) * r * 0.3, Math.sin(sa) * r * 0.25);
        c.rotate(rand() * TAU);
        ellipse(c, 0, 0, 1.3, 0.9);
        c.fillStyle = '#f5e8c8';
        c.fill();
        c.restore();
      }
      spec(c, -r * 0.45, -r * 0.5, r * 0.35, r * 0.2, 0.8, -0.6);
      c.restore();
    }
  },

  // --- fried tofu cube ---
  tofu(c, v, rand) {
    c.rotate(v === 1 ? -0.45 : 0.3);
    const s = 17;
    const cut = v === 1; // variant 1 shows the pale cut face on top
    // side faces (3d)
    roundRect(c, -s + 1, -s + 5, s * 2, s * 2, 3.5);
    c.fillStyle = '#9c6530';
    c.fill();
    roundRect(c, -s + 0.5, -s + 2.5, s * 2, s * 2, 3.5);
    c.fillStyle = '#b87a3c';
    c.fill();
    const top = () => roundRect(c, -s, -s, s * 2, s * 2, 3.5);
    top();
    if (cut) {
      c.fillStyle = radial(c, -5, -6, 1, s * 2.3, [
        [0, '#fdf5e4'],
        [0.6, '#f4e6cc'],
        [1, '#e0cba4'],
      ]);
    } else {
      c.fillStyle = radial(c, -5, -6, 1, s * 2.3, [
        [0, '#f6d9a2'],
        [0.5, '#e6bb70'],
        [0.85, '#cf9a4e'],
        [1, '#b27d38'],
      ]);
    }
    c.fill();
    c.save();
    top();
    c.clip();
    if (cut) {
      // porous pale interior
      for (let i = 0; i < 40; i++) {
        dot(
          c,
          (rand() - 0.5) * s * 1.9,
          (rand() - 0.5) * s * 1.9,
          0.5 + rand() * 1.2,
          'rgba(190,160,110,0.3)'
        );
      }
      // golden crust border
      c.lineWidth = 5;
      c.strokeStyle = 'rgba(205,140,60,0.8)';
      top();
      c.stroke();
    } else {
      // blistered porous crust
      for (let i = 0; i < 46; i++) {
        const x = (rand() - 0.5) * s * 1.9;
        const y = (rand() - 0.5) * s * 1.9;
        const rr = 0.8 + rand() * 2;
        c.fillStyle = radial(c, x, y, 0, rr, [
          [0, rand() < 0.55 ? 'rgba(140,80,25,0.45)' : 'rgba(255,240,205,0.5)'],
          [1, 'rgba(0,0,0,0)'],
        ]);
        circle(c, x, y, rr);
        c.fill();
      }
      for (let i = 0; i < 22; i++) {
        dot(
          c,
          (rand() - 0.5) * s * 1.9,
          (rand() - 0.5) * s * 1.9,
          0.5 + rand() * 0.8,
          'rgba(110,60,15,0.45)'
        );
      }
      c.lineWidth = 4;
      c.strokeStyle = 'rgba(150,90,30,0.4)';
      top();
      c.stroke();
    }
    spec(c, -6, -7, 9, 6, 0.3, -0.6);
    c.restore();
    edgeAO(c, top, 1.8, 'rgba(90,50,15,0.35)', 2);
  },

  // --- kimchi ---
  kimchi(c, v, rand) {
    c.rotate(v * 0.8);
    // oily red puddle under the leaves
    c.fillStyle = radial(c, 0, 2, 0, 24, [
      [0, 'rgba(210,60,25,0.35)'],
      [1, 'rgba(210,60,25,0)'],
    ]);
    circle(c, 0, 2, 24);
    c.fill();
    const parts = [
      { x: -7, y: 5, rx: 16, ry: 10, a: 0.4 },
      { x: 8, y: -5, rx: 17, ry: 10, a: -0.5 },
      { x: -2, y: -9, rx: 13, ry: 9, a: 0.95 },
    ];
    for (const p of parts) {
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.a);
      const path = () => blobPath(c, 0, 0, p.rx, p.ry, rng(p.x * 3 + v), 0.22, 9);
      path();
      c.fillStyle = radial(c, -3, -3, 1, p.rx * 1.3, [
        [0, 'rgba(245,160,105,0.95)'],
        [0.5, 'rgba(230,100,55,0.95)'],
        [1, 'rgba(190,60,30,0.95)'],
      ]);
      c.fill();
      c.save();
      path();
      c.clip();
      // pale cabbage rib running through the leaf
      c.fillStyle = linear(c, 0, -p.ry * 0.3, 0, p.ry * 0.3, [
        [0, 'rgba(250,220,190,0)'],
        [0.5, 'rgba(250,225,195,0.7)'],
        [1, 'rgba(250,220,190,0)'],
      ]);
      c.fillRect(-p.rx, -p.ry * 0.35, p.rx * 2, p.ry * 0.7);
      c.strokeStyle = 'rgba(255,235,210,0.55)';
      c.lineWidth = 0.9;
      for (let i = -2; i <= 2; i++) {
        c.beginPath();
        c.moveTo(-p.rx * 0.9, i * p.ry * 0.35);
        c.quadraticCurveTo(0, i * p.ry * 0.35 + 1.5, p.rx * 0.9, i * p.ry * 0.3);
        c.stroke();
      }
      // gochugaru flakes
      for (let i = 0; i < 9; i++) {
        c.save();
        c.translate((rand() - 0.5) * p.rx * 1.7, (rand() - 0.5) * p.ry * 1.5);
        c.rotate(rand() * TAU);
        c.fillStyle = rand() < 0.5 ? 'rgba(140,20,10,0.75)' : 'rgba(200,50,20,0.8)';
        roundRect(c, -1.2, -0.7, 2.4, 1.4, 0.4);
        c.fill();
        c.restore();
      }
      // wet chilli-oil gloss
      spec(c, -p.rx * 0.3, -p.ry * 0.35, p.rx * 0.4, p.ry * 0.35, 0.5, -0.3);
      c.restore();
      edgeAO(c, path, 1.5, 'rgba(120,25,10,0.35)', 2);
      c.restore();
    }
  },

  // --- tempura shrimp ---
  karides(c, v, rand) {
    c.rotate(v === 1 ? Math.PI : 0);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    const P0: [number, number] = [-16, 9];
    const P1: [number, number] = [-6, -20];
    const P2: [number, number] = [24, -22];
    const P3: [number, number] = [33, -1];
    const body = () => {
      c.beginPath();
      c.moveTo(P0[0], P0[1]);
      c.bezierCurveTo(P1[0], P1[1], P2[0], P2[1], P3[0], P3[1]);
      c.bezierCurveTo(37, 9, 29, 16, 21, 11);
    };
    // tail fan
    c.save();
    c.translate(-24, 9);
    c.rotate(0.3);
    for (const ang of [-0.42, 0.42]) {
      const fin = () => {
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(-15 * Math.cos(ang), -15 * Math.sin(ang));
        c.lineTo(-17 * Math.cos(ang) - 2, -17 * Math.sin(ang) + 3 * Math.sign(ang));
        c.lineTo(-3, 3 * Math.sign(ang));
        c.closePath();
      };
      fin();
      c.fillStyle = linear(c, 0, 0, -16 * Math.cos(ang), -16 * Math.sin(ang), [
        [0, '#f8c9b0'],
        [0.5, '#f28f68'],
        [1, '#d9472f'],
      ]);
      c.fill();
      c.strokeStyle = 'rgba(255,230,215,0.55)';
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(-2, 1.5 * Math.sign(ang));
      c.lineTo(-13 * Math.cos(ang), -13 * Math.sin(ang));
      c.stroke();
      edgeAO(c, fin, 1, 'rgba(150,40,20,0.35)', 1);
    }
    c.restore();
    // shrimp meat under the batter
    body();
    c.lineWidth = 14;
    c.strokeStyle = '#f3a78a';
    c.stroke();
    // batter body
    body();
    c.lineWidth = 17;
    c.strokeStyle = 'rgba(150,95,40,0.4)';
    c.stroke();
    body();
    c.lineWidth = 15;
    c.strokeStyle = '#e8b968';
    c.stroke();
    // meat shows at the tail end, with the red stripe of the shrimp
    c.beginPath();
    c.moveTo(P0[0], P0[1]);
    c.bezierCurveTo(-13, -1, -9, -8, -4, -12);
    c.lineWidth = 12;
    c.strokeStyle = '#f6b396';
    c.stroke();
    c.lineWidth = 2;
    c.strokeStyle = 'rgba(225,95,65,0.75)';
    c.beginPath();
    c.moveTo(-15, 4);
    c.quadraticCurveTo(-11, -3, -6, -7);
    c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(255,255,255,0.5)';
    c.beginPath();
    c.moveTo(-12, 8);
    c.quadraticCurveTo(-8, 0, -3, -4);
    c.stroke();
    // crunchy batter: irregular lacy clumps (tenkasu) along the body
    const cols = ['#f1cf84', '#e2ae55', '#c98a38', '#f8e3ae', '#d49a45'];
    const clump = (x: number, y: number, r: number) => {
      const seedR = rand;
      const path = () => blobPath(c, x, y, r, r * (0.7 + seedR() * 0.5), seedR, 0.35, 7);
      c.save();
      c.shadowColor = 'rgba(110,60,15,0.45)';
      c.shadowBlur = 2;
      c.shadowOffsetY = 1.2;
      path();
      c.fillStyle = cols[Math.floor(rand() * cols.length)];
      c.fill();
      c.restore();
      c.save();
      path();
      c.clip();
      c.fillStyle = radial(c, x - r * 0.3, y - r * 0.4, 0, r * 1.3, [
        [0, 'rgba(255,245,215,0.75)'],
        [0.5, 'rgba(255,235,190,0.15)'],
        [1, 'rgba(150,90,30,0.45)'],
      ]);
      c.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
      // pores
      for (let k = 0; k < 4; k++) {
        dot(
          c,
          x + (rand() - 0.5) * r * 1.4,
          y + (rand() - 0.5) * r * 1.4,
          0.4 + rand() * 0.6,
          'rgba(120,70,20,0.5)'
        );
      }
      c.restore();
    };
    for (let i = 0; i < 70; i++) {
      const t = 0.14 + rand() * 0.86;
      const p = bez(t, P0, P1, P2, P3);
      const q = bez(Math.min(1, t + 0.02), P0, P1, P2, P3);
      const nl = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      const nx = -(q[1] - p[1]) / nl;
      const ny = (q[0] - p[0]) / nl;
      const off = (rand() - 0.5) * 17;
      const r = 1.8 + rand() * 3.4;
      clump(p[0] + nx * off + (rand() - 0.5) * 2, p[1] + ny * off + (rand() - 0.5) * 2, r);
    }
    // head end clump
    for (let i = 0; i < 10; i++) {
      const a = rand() * TAU;
      clump(30 + Math.cos(a) * 5, 3 + Math.sin(a) * 7, 2 + rand() * 3);
    }
    // crevices between the clumps: small dark pockets
    for (let i = 0; i < 26; i++) {
      const t = 0.15 + rand() * 0.85;
      const p = bez(t, P0, P1, P2, P3);
      const px = p[0] + (rand() - 0.5) * 12;
      const py = p[1] + (rand() - 0.5) * 12;
      const rr = 0.8 + rand() * 1.4;
      c.fillStyle = radial(c, px, py, 0, rr, [
        [0, 'rgba(90,45,10,0.55)'],
        [1, 'rgba(90,45,10,0)'],
      ]);
      circle(c, px, py, rr);
      c.fill();
    }
    // loose crumbs around
    for (let i = 0; i < 14; i++) {
      const t = rand();
      const p = bez(t, P0, P1, P2, P3);
      dot(
        c,
        p[0] + (rand() - 0.5) * 30,
        p[1] + (rand() - 0.5) * 26,
        0.6 + rand(),
        'rgba(200,140,60,0.75)'
      );
    }
    // overall light
    spec(c, 8, -14, 14, 6, 0.3, -0.2);
  },

  // --- naruto fish cake ---
  naruto(c, v, rand) {
    c.rotate(v * 0.5);
    const r = 22;
    const n = 13;
    const wheel = () => {
      c.beginPath();
      for (let i = 0; i <= n * 8; i++) {
        const a = (i / (n * 8)) * TAU;
        const rr = r + Math.cos(a * n) * 1.5;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
    };
    wheel();
    c.fillStyle = radial(c, -6, -6, 1, r * 1.35, [
      [0, '#fffefc'],
      [0.6, '#faf2f0'],
      [0.9, '#efe0df'],
      [1, '#dcc8c8'],
    ]);
    c.fill();
    c.save();
    wheel();
    c.clip();
    // gelatinous surface: faint dimples
    for (let i = 0; i < 18; i++) {
      dot(
        c,
        (rand() - 0.5) * r * 1.7,
        (rand() - 0.5) * r * 1.7,
        0.6 + rand() * 1.2,
        'rgba(200,170,170,0.25)'
      );
    }
    // pink rim band, soft
    c.lineWidth = 5;
    c.strokeStyle = 'rgba(240,150,172,0.55)';
    c.shadowColor = 'rgba(240,150,172,0.6)';
    c.shadowBlur = 3;
    circle(c, 0, 0, r + 1);
    c.stroke();
    c.shadowBlur = 0;
    // pink spiral with soft edges
    const spiral = (w: number, col: string) => {
      c.lineCap = 'round';
      c.strokeStyle = col;
      c.lineWidth = w;
      c.beginPath();
      for (let i = 0; i <= 90; i++) {
        const t = i / 90;
        const a = t * TAU * 1.95;
        const rr = 1.5 + t * 14.5 + Math.sin(t * 19 + v * 2) * 0.9 + Math.sin(t * 7) * 0.6;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
    };
    spiral(6.5, 'rgba(240,150,172,0.35)');
    spiral(4.6, '#ee92aa');
    spiral(2.4, '#f4a9bc');
    spiral(0.9, 'rgba(255,220,228,0.7)');
    // the rubbery surface: broad soft sheen + one crisp bead
    spec(c, -7, -8, 10, 7, 0.4, -0.6);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    ellipse(c, -9, -10, 2.6, 1.4);
    c.fill();
    c.restore();
    edgeAO(c, wheel, 1.6, 'rgba(150,90,100,0.3)', 2);
    rimLight(c, wheel, 1.1, 'rgba(255,255,255,0.7)');
  },

  // --- lime wedge / slice ---
  lime(c, v, rand) {
    const rindCol = (x: number, y: number, rr: number) =>
      radial(c, x, y, rr * 0.6, rr, [
        [0, '#8ec24f'],
        [0.8, '#6ea53c'],
        [1, '#4f8a2c'],
      ]);
    const fleshCol = (x: number, y: number, rr: number) =>
      radial(c, x, y, 1, rr, [
        [0, '#f4f8d6'],
        [0.5, '#e4efb2'],
        [1, '#c3dd86'],
      ]);
    if (v === 0) {
      // a wedge lying on its side
      c.rotate(-0.35);
      const cx = -11;
      const R = 28;
      const a0 = -0.55;
      const a1 = 0.55;
      const wedge = (rr: number) => {
        c.beginPath();
        c.moveTo(cx, 0);
        c.arc(cx, 0, rr, a0, a1);
        c.closePath();
      };
      wedge(R);
      c.fillStyle = rindCol(cx, 0, R);
      c.fill();
      c.save();
      wedge(R);
      c.clip();
      // rind pores
      for (let i = 0; i < 24; i++) {
        const a = a0 + (a1 - a0) * rand();
        const d = R - rand() * 3;
        dot(c, cx + Math.cos(a) * d, Math.sin(a) * d, 0.5, 'rgba(40,80,20,0.4)');
      }
      // pith
      wedge(R - 2.8);
      c.fillStyle = '#f4f6dc';
      c.fill();
      // flesh
      wedge(R - 4.6);
      c.fillStyle = fleshCol(cx, 0, R);
      c.fill();
      // juice vesicles: fine radiating lines
      c.lineCap = 'round';
      for (let i = 0; i < 60; i++) {
        const a = a0 + (a1 - a0) * rand();
        const d0 = 4 + rand() * (R - 10);
        const L = 2 + rand() * 4;
        c.lineWidth = 0.6;
        c.strokeStyle = rand() < 0.5 ? 'rgba(255,255,240,0.7)' : 'rgba(150,190,90,0.35)';
        c.beginPath();
        c.moveTo(cx + Math.cos(a) * d0, Math.sin(a) * d0);
        c.lineTo(cx + Math.cos(a) * (d0 + L), Math.sin(a) * (d0 + L));
        c.stroke();
      }
      // segment membranes
      c.strokeStyle = 'rgba(255,255,250,0.9)';
      c.lineWidth = 1.3;
      for (let i = 0; i <= 3; i++) {
        const a = a0 + ((a1 - a0) * (i + 0.5)) / 4;
        c.beginPath();
        c.moveTo(cx + 3, 0);
        c.lineTo(cx + Math.cos(a) * (R - 4), Math.sin(a) * (R - 4));
        c.stroke();
      }
      c.beginPath();
      c.moveTo(cx + 1, 0);
      c.lineTo(cx + R - 3, 0);
      c.stroke();
      // juice shine
      spec(c, cx + 14, -5, 7, 3.5, 0.6, -0.3);
      c.restore();
      edgeAO(c, () => wedge(R), 1.4, 'rgba(30,60,15,0.35)', 2);
    } else {
      const R = 19;
      circle(c, 0, 0, R);
      c.fillStyle = rindCol(0, 0, R);
      c.fill();
      for (let i = 0; i < 30; i++) {
        const a = rand() * TAU;
        const d = R - 0.5 - rand() * 2;
        dot(c, Math.cos(a) * d, Math.sin(a) * d, 0.5, 'rgba(40,80,20,0.4)');
      }
      circle(c, 0, 0, R - 2.6);
      c.fillStyle = '#f4f6dc';
      c.fill();
      circle(c, 0, 0, R - 4.2);
      c.fillStyle = fleshCol(0, 0, R);
      c.fill();
      c.save();
      circle(c, 0, 0, R - 4.2);
      c.clip();
      c.lineCap = 'round';
      for (let i = 0; i < 70; i++) {
        const a = rand() * TAU;
        const d0 = 3 + rand() * (R - 9);
        const L = 2 + rand() * 3;
        c.lineWidth = 0.6;
        c.strokeStyle = rand() < 0.5 ? 'rgba(255,255,240,0.7)' : 'rgba(150,190,90,0.35)';
        c.beginPath();
        c.moveTo(Math.cos(a) * d0, Math.sin(a) * d0);
        c.lineTo(Math.cos(a) * (d0 + L), Math.sin(a) * (d0 + L));
        c.stroke();
      }
      c.strokeStyle = 'rgba(255,255,250,0.9)';
      c.lineWidth = 1.4;
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * (R - 4), Math.sin(a) * (R - 4));
        c.stroke();
      }
      circle(c, 0, 0, 2.2);
      c.fillStyle = '#f4f6dc';
      c.fill();
      spec(c, -6, -7, 7, 4, 0.55, -0.6);
      c.restore();
      edgeAO(c, () => circle(c, 0, 0, R), 1.4, 'rgba(30,60,15,0.35)', 2);
    }
  },

  // --- menma bamboo strips ---
  bambu(c, v, rand) {
    const n = 2 + (v % 2);
    for (let i = 0; i < n; i++) {
      c.save();
      c.translate((i - (n - 1) / 2) * 8 + (rand() - 0.5) * 4, (rand() - 0.5) * 5);
      c.rotate((rand() - 0.5) * 0.45 + v * 0.25);
      const w = 48 + rand() * 8;
      const h = 10 + rand() * 3;
      const strip = () => {
        c.beginPath();
        c.moveTo(-w / 2, -h / 2 + 1.5);
        c.quadraticCurveTo(-w / 2 - 2, 0, -w / 2 + 1, h / 2 - 1);
        c.lineTo(w / 2 - 2, h / 2);
        c.quadraticCurveTo(w / 2 + 2, 0, w / 2 - 1, -h / 2);
        c.closePath();
      };
      miniShadow(c, 1, 2, w / 2, h / 2, 0.22);
      strip();
      c.fillStyle = linear(c, 0, -h / 2, 0, h / 2, [
        [0, '#ecd493'],
        [0.5, '#d6b163'],
        [1, '#ad8842'],
      ]);
      c.fill();
      c.save();
      strip();
      c.clip();
      // lengthwise fibres
      c.lineCap = 'round';
      for (let k = 0; k < 14; k++) {
        const y = -h / 2 + rand() * h;
        const x0 = -w / 2 + rand() * w * 0.5;
        const L = w * (0.2 + rand() * 0.5);
        c.lineWidth = 0.5 + rand() * 0.8;
        c.strokeStyle = rand() < 0.6 ? 'rgba(120,80,25,0.35)' : 'rgba(255,240,200,0.5)';
        c.beginPath();
        c.moveTo(x0, y);
        c.lineTo(x0 + L, y + (rand() - 0.5) * 1.2);
        c.stroke();
      }
      // darker marinated patches
      for (let k = 0; k < 3; k++) {
        const px = (rand() - 0.5) * w * 0.8;
        c.fillStyle = radial(c, px, 0, 0, 7, [
          [0, 'rgba(120,70,20,0.22)'],
          [1, 'rgba(120,70,20,0)'],
        ]);
        circle(c, px, 0, 7);
        c.fill();
      }
      // node ridges
      c.strokeStyle = 'rgba(140,100,40,0.35)';
      c.lineWidth = 1;
      for (let k = 0; k < 2; k++) {
        const px = (rand() - 0.5) * w * 0.7;
        c.beginPath();
        c.moveTo(px, -h / 2);
        c.lineTo(px + 1, h / 2);
        c.stroke();
      }
      spec(c, -w * 0.15, -h * 0.2, w * 0.3, h * 0.25, 0.4, 0);
      c.restore();
      edgeAO(c, strip, 1.3, 'rgba(100,65,20,0.35)', 2);
      c.restore();
    }
  },

  // --- crispy fried onion / shallot shards ---
  citir(c, v, rand) {
    const n = 14 + v;
    c.lineCap = 'round';
    const cols = ['#e3b062', '#c98a3c', '#a5641f', '#7c4612', '#f0cc8a'];
    for (let i = 0; i < n; i++) {
      const a = rand() * TAU;
      const d = Math.sqrt(rand()) * 14;
      c.save();
      c.translate(Math.cos(a) * d, Math.sin(a) * d);
      c.rotate(rand() * TAU);
      const L = 5 + rand() * 8;
      const bend = (rand() - 0.5) * 5;
      const w = 1.8 + rand() * 1.6;
      const shard = () => {
        c.beginPath();
        c.moveTo(-L / 2, 0);
        c.quadraticCurveTo(0, bend, L / 2, 0);
      };
      c.save();
      c.translate(0.5, 1.3);
      shard();
      c.lineWidth = w + 0.6;
      c.strokeStyle = 'rgba(60,30,10,0.3)';
      c.stroke();
      c.restore();
      shard();
      c.lineWidth = w;
      c.strokeStyle = cols[Math.floor(rand() * cols.length)];
      c.stroke();
      shard();
      c.lineWidth = w * 0.35;
      c.strokeStyle = 'rgba(255,235,190,0.55)';
      c.stroke();
      // dark burnt tip
      if (rand() < 0.5) dot(c, L / 2, 0, w * 0.45, 'rgba(70,35,8,0.7)');
      c.restore();
    }
    // crumbs
    for (let i = 0; i < 10; i++) {
      const a = rand() * TAU;
      const d = Math.sqrt(rand()) * 16;
      dot(c, Math.cos(a) * d, Math.sin(a) * d, 0.6 + rand() * 0.8, 'rgba(150,95,35,0.7)');
    }
  },

  // --- sesame seeds ---
  susam(c, v, rand) {
    const n = 16 + v * 2;
    for (let i = 0; i < n; i++) {
      const a = rand() * TAU;
      const d = Math.sqrt(rand()) * 14;
      c.save();
      c.translate(Math.cos(a) * d, Math.sin(a) * d);
      c.rotate(rand() * TAU);
      const black = rand() < 0.22;
      miniShadow(c, 0.3, 0.9, 2.4, 1.5, 0.3);
      // teardrop seed shape
      c.beginPath();
      c.moveTo(-2.6, 0);
      c.quadraticCurveTo(-1, -1.7, 1.6, -1.3);
      c.quadraticCurveTo(2.9, -0.6, 2.9, 0);
      c.quadraticCurveTo(2.9, 0.6, 1.6, 1.3);
      c.quadraticCurveTo(-1, 1.7, -2.6, 0);
      c.closePath();
      c.fillStyle = black
        ? radial(c, -0.6, -0.5, 0, 3, [
            [0, '#5a4a44'],
            [1, '#211a18'],
          ])
        : radial(c, -0.6, -0.5, 0, 3, [
            [0, '#fff8e6'],
            [0.6, '#f1e3c4'],
            [1, '#cdb88c'],
          ]);
      c.fill();
      c.strokeStyle = black ? 'rgba(0,0,0,0.3)' : 'rgba(150,120,70,0.35)';
      c.lineWidth = 0.4;
      c.stroke();
      c.fillStyle = black ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.85)';
      ellipse(c, -0.8, -0.4, 0.9, 0.45);
      c.fill();
      c.restore();
    }
  },
};

function bez(
  t: number,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number]
): [number, number] {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

const PIECE_PAD = 1.6;
/** Drawers were authored at these sizes; pieces grown since are scaled up. */
const PIECE_AUTHORED: Record<string, number> = { yumurta: 64, chashu: 70, nori: 70 };

/**
 * Rim light: a thin bright crescent along the edge facing the light (top-left).
 * Clip to the shape and stroke it shifted down-right, so only the top-left
 * band of the stroke stays visible.
 */
function rimLight(c: Ctx, path: () => void, w: number, col: string, dx = 1.1, dy = 1.3) {
  c.save();
  path();
  c.clip();
  c.translate(dx * w, dy * w);
  path();
  c.lineWidth = w * 2;
  c.strokeStyle = col;
  c.shadowColor = col;
  c.shadowBlur = w * 1.5;
  c.stroke();
  c.restore();
}

function pieceSprite(id: string, variant: number): HTMLCanvasElement {
  const size = PIECE_SIZE[id] ?? 30;
  const box = Math.ceil(size * PIECE_PAD);
  const nv = PIECE_VARIANTS[id] ?? 1;
  const v = ((variant % nv) + nv) % nv;
  return sprite(
    `piece:${id}:${v}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      c.lineJoin = 'round';
      c.lineCap = 'round';
      const wh = PIECE_WH[id];
      if (wh) {
        // contact shadow: tight dark core + wider soft penumbra
        softShadow(c, 1.5, 3.5, wh[0] * 0.56, wh[1] * 0.5, 0.2);
        softShadow(c, 1, 2.5, wh[0] * 0.5, wh[1] * 0.46, 0.24);
      }
      const draw = PIECES[id];
      const au = PIECE_AUTHORED[id];
      if (au) c.scale(size / au, size / au);
      if (draw) draw(c, v, rng(id.length * 131 + v * 977 + 17));
      else {
        circle(c, 0, 0, size / 2);
        c.fillStyle = PAL.coral;
        c.fill();
      }
    },
    3
  );
}

export function drawPiece(c: Ctx, id: string, variant: number, scale: number, rot: number): void {
  const s = pieceSprite(id, variant);
  const box = Math.ceil((PIECE_SIZE[id] ?? 30) * PIECE_PAD);
  c.save();
  c.rotate(rot);
  c.scale(scale, scale);
  c.drawImage(s, -box / 2, -box / 2, box, box);
  c.restore();
}

// ---------------------------------------------------------------------------
// Noodles
// ---------------------------------------------------------------------------
// Each strand is a lit cylinder: contact shadow (down-right), dark side, body,
// mid-tone (up-left), thin specular. Strands are depth-sorted: back strands
// are cooler/darker, the front ones at the top of the mound bright and wet.

interface NoodleCfg {
  density: number; // strands at r=112, orta
  width: number; // base strand width at orta
  wave: number; // wobble amplitude in widths
  wavelen: number; // wobble wavelength in widths
  sweep: number; // share of long sinuous strands (vs loops)
  len: [number, number]; // strand length range (fraction of r)
  col: Record<CookState, string>;
  dark: string; // shadow-side colour
  cool: string; // back-strand tint
  light: string; // mid-tone colour
  spec: number; // specular strength
  shadow: number; // contact shadow strength
  alpha: number; // body alpha (translucent noodles)
  flecks?: boolean; // soba: buckwheat flecks
}

const NOODLES: Record<string, NoodleCfg> = {
  ramen: {
    density: 96,
    width: 4.6,
    wave: 0.55,
    wavelen: 5.6,
    sweep: 0.5,
    len: [1.4, 2.8],
    col: {
      raw: '#ece2c6',
      dente: '#f5d478',
      perfect: '#f4cc5c',
      soft: '#f4df9e',
      burnt: '#d9d0ae',
    },
    dark: '#a06a1e',
    cool: '#b3903f',
    light: '#fff3bc',
    spec: 1,
    shadow: 1,
    alpha: 0.94,
  },
  udon: {
    density: 40,
    width: 8.8,
    wave: 0.14,
    wavelen: 8,
    sweep: 0.6,
    len: [1.5, 2.8],
    col: {
      raw: '#e6dfd2',
      dente: '#f6f1e8',
      perfect: '#faf6ee',
      soft: '#f3eee4',
      burnt: '#ddd6c8',
    },
    dark: '#8c7a63',
    cool: '#b3a894',
    light: '#ffffff',
    spec: 0.9,
    shadow: 1.25,
    alpha: 1,
  },
  soba: {
    density: 120,
    width: 3.2,
    wave: 0.12,
    wavelen: 9,
    sweep: 0.6,
    len: [1.1, 2.2],
    col: {
      raw: '#c7b6a1',
      dente: '#a88a6d',
      perfect: '#9f7e62',
      soft: '#ac8d72',
      burnt: '#a69a8c',
    },
    dark: '#4a2f1d',
    cool: '#6d5443',
    light: '#c9ae92',
    spec: 0.3,
    shadow: 0.9,
    alpha: 1,
    flecks: true,
  },
  pirinc: {
    density: 120,
    width: 2.4,
    wave: 0.45,
    wavelen: 6,
    sweep: 0.5,
    len: [1.3, 2.6],
    col: {
      raw: '#f1ece2',
      dente: '#f9f6ef',
      perfect: '#fbf9f4',
      soft: '#f5f2eb',
      burnt: '#e3ded5',
    },
    dark: '#a08f74',
    cool: '#c2b8a6',
    light: '#ffffff',
    spec: 1.1,
    shadow: 0.7,
    alpha: 0.8,
  },
};

const THICK_MUL: Record<Thick, number> = { ince: 0.72, orta: 1, kalin: 1.45 };
const COOK_W: Record<CookState, number> = {
  raw: 0.82,
  dente: 0.97,
  perfect: 1.08,
  soft: 1.18,
  burnt: 1.32,
};
const COOK_GLOSS: Record<CookState, number> = {
  raw: 0.0,
  dente: 0.6,
  perfect: 0.9,
  soft: 0.45,
  burnt: 0.1,
};

interface SauceOpt {
  id: string;
  amt: number; // 0..1
}

function noodleSprite(
  noodle: string,
  thick: Thick,
  cook: CookState,
  r: number,
  seed: number,
  sauce?: SauceOpt
): HTMLCanvasElement {
  const R = Math.round(r);
  const key = `nood:${noodle}:${thick}:${cook}:${R}:${seed}:${sauce ? sauce.id + ':' + Math.round(sauce.amt * 10) : ''}`;
  const pad = 6;
  const box = R * 2 + pad * 2;
  return sprite(
    key,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      renderNoodles(c, noodle, thick, cook, R, seed);
      if (sauce) applySauce(c, sauce, R);
    },
    2
  );
}

type Pt = [number, number];

function mixRgb(a: [number, number, number], b: [number, number, number], t: number) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t] as [
    number,
    number,
    number,
  ];
}
const css = (c: [number, number, number], a = 1) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a})`;

function renderNoodles(
  c: Ctx,
  noodle: string,
  thick: Thick,
  cook: CookState,
  r: number,
  seed: number
) {
  const cfg = NOODLES[noodle] ?? NOODLES.ramen;
  const rand = rng(seed * 7919 + noodle.length * 31 + 5);
  const w = cfg.width * THICK_MUL[thick] * COOK_W[cook] * clamp(r / 112, 0.6, 1.6);
  const n = Math.round(
    cfg.density *
      clamp(Math.pow(r / 112, 1.25), 0.25, 1.6) *
      (thick === 'kalin' ? 0.72 : thick === 'ince' ? 1.3 : 1)
  );
  const glossA = COOK_GLOSS[cook] * cfg.spec;
  const sharp = cook === 'raw';
  const limp = cook === 'soft' || cook === 'burnt';
  c.lineCap = 'round';
  c.lineJoin = 'round';

  // nest shadow on the bowl floor: the mound sits in the liquid
  c.fillStyle = radial(c, 2, 4, r * 0.2, r * 1.02, [
    [0, 'rgba(50,30,15,0.26)'],
    [0.6, 'rgba(50,30,15,0.14)'],
    [1, 'rgba(50,30,15,0)'],
  ]);
  circle(c, 2, 4, r * 1.02);
  c.fill();

  interface Strand {
    pts: Pt[];
    depth: number; // 0 back .. 1 front
    rim: boolean; // curling out at the edge
  }
  const strands: Strand[] = [];
  const amp = cfg.wave * w * (sharp ? 1.15 : limp ? 0.55 : 1);
  const wl = cfg.wavelen * w * (sharp ? 1.1 : limp ? 1.3 : 1);
  const margin = amp + w * 0.8;
  const spin = rand() < 0.5 ? 1 : -1;
  const inside = (x: number, y: number, k = 1) => Math.hypot(x, y) <= (r - margin) * k;

  const wobble = (ph0: number, arc: number) => {
    let wob =
      Math.sin(ph0 + (arc / wl) * TAU) * 0.8 + Math.sin(ph0 * 1.7 + (arc / wl) * 2.3) * 0.35;
    if (sharp) wob = Math.sign(wob) * Math.pow(Math.abs(wob), 0.5);
    return amp * wob;
  };

  // loop strands: arcs around a random centre (the folded nest)
  const makeLoop = (): Pt[] => {
    let rho = r * lerp(0.28, 0.78, rand());
    let maxC = r - rho - margin;
    if (maxC < 0) {
      rho = r - margin;
      maxC = 0;
    }
    const ca = rand() * TAU;
    const edgeK = 1 + 0.08 * Math.sin(ca * 3 + seed) + 0.05 * Math.sin(ca * 5 + 1.3);
    const cd = Math.sqrt(rand()) * Math.max(0, maxC - r * (1 - edgeK));
    const cx = Math.cos(ca) * cd;
    const cy = Math.sin(ca) * cd;
    const side = rand() < 0.8 ? spin : -spin;
    const th0 = rand() * TAU;
    const L = r * lerp(cfg.len[0], cfg.len[1], rand());
    const span = Math.min(L / rho, TAU * 0.85) * side;
    const steps = Math.max(10, Math.ceil(L / (sharp ? 5 : 2.5)));
    const ph0 = rand() * TAU;
    const pts: Pt[] = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const th = th0 + span * t;
      const rr = rho + wobble(ph0, t * L) + (rand() - 0.5) * w * 0.25;
      pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]);
    }
    return pts;
  };
  // sweep strands: long sinuous lines crossing the mound. When one reaches the
  // edge of the nest it bends back along the rim instead of ending there.
  const makeSweep = (): Pt[] => {
    const sa = rand() * TAU;
    const sd = Math.sqrt(rand()) * r * 0.7;
    let x = Math.cos(sa) * sd;
    let y = Math.sin(sa) * sd;
    let b = sa + Math.PI + (rand() - 0.5) * 1.8;
    const L = r * lerp(cfg.len[0], cfg.len[1], rand()) * 0.85;
    const step = sharp ? 5 : 2.5;
    const steps = Math.max(10, Math.ceil(L / step));
    const turn = ((rand() - 0.5) * 2.4) / steps;
    const curlSide = rand() < 0.5 ? 1 : -1;
    const ph0 = rand() * TAU;
    const pts: Pt[] = [];
    const lim = r - margin;
    for (let s = 0; s <= steps; s++) {
      const dd = Math.hypot(x, y);
      if (dd > lim * 0.78) {
        // steer toward the tangent (and gently inward) as the strand nears the rim
        const outA = Math.atan2(y, x);
        let dA = b - outA;
        while (dA > Math.PI) dA -= TAU;
        while (dA < -Math.PI) dA += TAU;
        const k = clamp((dd - lim * 0.78) / (lim * 0.22), 0, 1);
        const tgt = outA + (curlSide * Math.PI) / 2 + curlSide * 0.35 * k;
        let want = tgt - b;
        while (want > Math.PI) want -= TAU;
        while (want < -Math.PI) want += TAU;
        b += want * 0.18 * (0.3 + k) * (Math.abs(dA) > 0.2 ? 1 : 0.3);
      }
      b += turn;
      const off = wobble(ph0, L * (s / steps));
      pts.push([x - Math.sin(b) * off, y + Math.cos(b) * off]);
      x += Math.cos(b) * step;
      y += Math.sin(b) * step;
      if (Math.hypot(x, y) > lim * 1.02) break;
    }
    return pts;
  };

  for (let i = 0; i < n; i++) {
    let pts = rand() < cfg.sweep ? makeSweep() : makeLoop();
    if (pts.length < 6) pts = makeLoop();
    // soft/burnt: some strands broken short
    if (cook === 'soft' && rand() < 0.3) pts = pts.slice(0, Math.max(6, (pts.length * 0.5) | 0));
    let cx = 0;
    let cy = 0;
    for (const p of pts) {
      cx += p[0];
      cy += p[1];
    }
    cx /= pts.length;
    cy /= pts.length;
    // mound: strands near the centre are on top (front), the edges are the base
    const d = Math.hypot(cx, cy) / r;
    const depth = clamp(1 - d * 1.15 + (rand() - 0.5) * 0.5, 0, 1);
    strands.push({ pts, depth, rim: false });
  }
  // rim strands: a few curl out of the broth at the edge of the nest, drawn in front
  if (!limp) {
    const nr = Math.round(2 + r / 45);
    for (let i = 0; i < nr; i++) {
      const a = rand() * TAU;
      const d0 = r * (0.5 + rand() * 0.25);
      const L = r * (0.5 + rand() * 0.45);
      const b = a + (rand() < 0.5 ? 1 : -1) * (0.9 + rand() * 0.6);
      const bend = (rand() - 0.5) * L * 0.9;
      const ph0 = rand() * TAU;
      const pts: Pt[] = [];
      const steps = 16;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const off = bend * Math.sin(t * Math.PI) + wobble(ph0, L * t) * 0.8;
        const x = Math.cos(a) * d0 + Math.cos(b) * L * t - Math.sin(b) * off;
        const y = Math.sin(a) * d0 + Math.sin(b) * L * t + Math.cos(b) * off;
        if (!inside(x, y, 1.03)) break;
        pts.push([x, y]);
      }
      if (pts.length >= 6) strands.push({ pts, depth: 1, rim: true });
    }
  }
  strands.sort((p, q) => p.depth - q.depth);

  const path = (pts: Pt[]) => {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    if (sharp) {
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      return;
    }
    for (let i = 1; i < pts.length - 1; i++) {
      const m = mid(pts[i], pts[i + 1]);
      c.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
    }
    const l = pts[pts.length - 1];
    c.lineTo(l[0], l[1]);
  };

  const base = hexToRgb(cfg.col[cook]);
  const cool = hexToRgb(cfg.cool);
  const dark = hexToRgb(cfg.dark);
  const light = hexToRgb(cfg.light);
  const bodyA = cfg.alpha;
  const shA = (cook === 'burnt' ? 0.5 : 1) * cfg.shadow;
  const matte = glossA <= 0.05;

  for (const st of strands) {
    const pts = st.pts;
    const d = st.depth;
    const body = mixRgb(base, cool, (1 - d) * 0.5);
    const edge = mixRgb(body, dark, 0.55 + 0.15 * (1 - d));
    const ww = w * (st.rim ? 0.95 : 1);
    // 1. contact shadow (down-right): wide soft + tighter core, stronger for front strands
    c.save();
    c.translate(ww * 0.32 + d * ww * 0.2, ww * 0.55 + d * ww * 0.3);
    path(pts);
    c.lineWidth = ww * 1.5;
    c.strokeStyle = `rgba(45,28,12,${(0.07 + 0.07 * d) * shA})`;
    c.stroke();
    c.lineWidth = ww * 1.05;
    c.strokeStyle = `rgba(45,28,12,${(0.12 + 0.12 * d) * shA})`;
    c.stroke();
    c.restore();
    // 2. shadow side: the full-width stroke in the dark colour, nudged down-right
    c.save();
    c.translate(ww * 0.2, ww * 0.26);
    path(pts);
    c.lineWidth = ww;
    c.strokeStyle = css(edge, bodyA);
    c.stroke();
    c.restore();
    // 3. body
    path(pts);
    c.lineWidth = ww * 0.86;
    c.strokeStyle = css(body, bodyA);
    c.stroke();
    // 4. mid-tone toward the light (up-left)
    c.save();
    c.translate(-ww * 0.12, -ww * 0.18);
    path(pts);
    c.lineWidth = ww * 0.46;
    c.strokeStyle = css(light, (matte ? 0.22 : 0.32) + 0.38 * d);
    c.stroke();
    // 5. specular: thin broken bright core (wet) or a faint matte centre line (raw)
    c.translate(-ww * 0.08, -ww * 0.12);
    path(pts);
    if (!matte) {
      c.setLineDash([ww * 2.2, ww * 1.1]);
      c.lineDashOffset = d * 9;
      c.lineWidth = Math.max(0.5, ww * 0.17);
      c.strokeStyle = `rgba(255,255,255,${glossA * (0.35 + 0.65 * d)})`;
      c.stroke();
      c.setLineDash([]);
    } else {
      c.lineWidth = Math.max(0.5, ww * 0.24);
      c.strokeStyle = `rgba(255,255,255,${0.16 + 0.12 * d})`;
      c.stroke();
    }
    c.restore();
  }

  // volume: the mound is lit from the top-left and falls into shadow at its base
  c.save();
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = radial(c, -r * 0.15, -r * 0.2, r * 0.1, r * 1.05, [
    [0, 'rgba(255,248,225,0.12)'],
    [0.45, 'rgba(255,248,225,0)'],
    [0.8, 'rgba(70,45,15,0.1)'],
    [1, 'rgba(70,45,15,0.32)'],
  ]);
  c.fillRect(-r - 8, -r - 8, r * 2 + 16, r * 2 + 16);
  if (cfg.flecks) {
    // buckwheat flecks on the strands
    speckle(c, -r, -r, r * 2, r * 2, seed + 9, Math.round(r * 2.5), 'rgba(50,30,15,0.5)');
    speckle(c, -r, -r, r * 2, r * 2, seed + 10, Math.round(r * 1.2), 'rgba(230,215,190,0.35)');
  }
  if (cook === 'raw') {
    // matte wash + flour dusting
    c.fillStyle = 'rgba(245,240,228,0.28)';
    c.fillRect(-r, -r, r * 2, r * 2);
    speckle(c, -r, -r, r * 2, r * 2, seed + 3, Math.round(r * 3.5), 'rgba(255,255,255,0.75)');
  }
  c.restore();

  if (cook === 'burnt') {
    // mushy: strands merge into a pale blob
    const body = cfg.col[cook];
    c.save();
    blobPath(c, 0, 0, r * 0.9, r * 0.85, rand, 0.1, 11);
    c.fillStyle = radial(c, 0, 0, r * 0.2, r * 0.95, [
      [0, shade(body, 0.1, 0.75)],
      [0.7, shade(body, 0.0, 0.55)],
      [1, shade(body, -0.1, 0.1)],
    ]);
    c.fill();
    // broken bits
    c.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const a = rand() * TAU;
      const d = rand() * r * 0.8;
      const x = Math.cos(a) * d;
      const y = Math.sin(a) * d;
      const b = rand() * TAU;
      const L = w * (1 + rand() * 2.5);
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(b) * L, y + Math.sin(b) * L);
      c.lineWidth = w * 0.9;
      c.strokeStyle = shade(body, -0.18, 0.8);
      c.stroke();
    }
    // greyish sheen
    c.fillStyle = 'rgba(120,120,110,0.08)';
    circle(c, 0, 0, r * 0.9);
    c.fill();
    c.restore();
  }
}

/**
 * The part of the nest above the broth surface. The centre of the mound is
 * fully visible; toward the rim the strands sink under the liquid.
 */
function noodleFloatSprite(
  noodle: string,
  thick: Thick,
  cook: CookState,
  r: number,
  seed: number
): HTMLCanvasElement {
  const R = Math.round(r);
  const pad = 6;
  const box = R * 2 + pad * 2;
  return sprite(
    `noodfloat:${noodle}:${thick}:${cook}:${R}:${seed}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      const base = noodleSprite(noodle, thick, cook, r, seed);
      c.drawImage(base, -box / 2, -box / 2, box, box);
      // surface strands: warm, bright and wet (the submerged ones under the
      // broth disc stay cooler and dimmer)
      c.globalCompositeOperation = 'source-atop';
      c.fillStyle = radial(c, -R * 0.25, -R * 0.3, 0, R * 0.95, [
        [0, 'rgba(255,238,190,0.3)'],
        [0.6, 'rgba(255,232,180,0.14)'],
        [1, 'rgba(255,232,180,0)'],
      ]);
      c.fillRect(-box / 2, -box / 2, box, box);
      c.globalCompositeOperation = 'destination-in';
      const irr = (a: number) => 1 + 0.06 * Math.sin(a * 3 + seed) + 0.04 * Math.sin(a * 7 + 2);
      // irregular waterline: an angular wobble on the fade radius
      c.fillStyle = radial(c, 0, 0, 0, R, [
        [0, 'rgba(0,0,0,1)'],
        [0.62, 'rgba(0,0,0,1)'],
        [0.8, 'rgba(0,0,0,0.6)'],
        [0.93, 'rgba(0,0,0,0.15)'],
        [1, 'rgba(0,0,0,0)'],
      ]);
      c.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * TAU;
        const rr = R * irr(a) * 1.05;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      c.fill();
    },
    2
  );
}

export function drawNoodles(
  c: Ctx,
  noodle: string,
  thick: Thick,
  cook: CookState,
  r: number,
  seed: number
): void {
  const s = noodleSprite(noodle, thick, cook, r, seed);
  const R = Math.round(r);
  const box = R * 2 + 12;
  c.save();
  c.drawImage(s, -box / 2, -box / 2, box, box);
  c.restore();
}

// ---------------------------------------------------------------------------
// Broths & sauces
// ---------------------------------------------------------------------------

interface BrothCfg {
  col: string;
  alpha: number;
  creamy: number; // 0 clear .. 1 opaque creamy
  oil?: string; // fat droplets / rings colour
  oilN?: number;
  chilli?: boolean; // chilli-oil marbling
  sesame?: boolean;
  particles?: string; // fine suspended particles (miso)
  thick?: boolean; // curry: thick, slow surface
}

const BROTHS: Record<string, BrothCfg> = {
  shoyu: { col: '#7a3d14', alpha: 0.72, creamy: 0, oil: '#f3b84a', oilN: 16 },
  miso: { col: '#c98d44', alpha: 0.94, creamy: 0.7, particles: '#8a5a24', oil: '#f0c66a', oilN: 5 },
  tavuk: { col: '#dcac52', alpha: 0.66, creamy: 0.08, oil: '#fbe08a', oilN: 14 },
  acili: {
    col: '#c43f24',
    alpha: 0.9,
    creamy: 0.25,
    oil: '#ff7a2a',
    oilN: 6,
    chilli: true,
    sesame: true,
  },
  kori: { col: '#d19a2c', alpha: 0.95, creamy: 0.5, thick: true, oil: '#f4c75a', oilN: 4 },
  tonkotsu: { col: '#efe3cc', alpha: 0.98, creamy: 1, oil: '#fff3d6', oilN: 8 },
};

const SAUCES: Record<string, string> = {
  teriyaki: '#5a2c12',
  fistik: '#b9814a',
  tatliaci: '#d6401c',
  yakisoba: '#3f2010',
};

export const isSauce = (id?: string) => !!id && id in SAUCES;

/** Static liquid disc (gradient, oil droplets, swirls) cached per (broth, radius). */
function brothDisc(broth: string, rad: number): HTMLCanvasElement {
  const R = Math.round(rad);
  const box = R * 2 + 4;
  return sprite(
    `broth:${broth}:${R}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      renderLiquid(c, broth, R, 1);
    },
    2
  );
}

function renderLiquid(c: Ctx, broth: string, R: number, alphaMul: number) {
  const cfg = BROTHS[broth] ?? BROTHS.shoyu;
  const rand = rng(broth.length * 977 + R);
  const base = cfg.col;
  const a = cfg.alpha * alphaMul;
  circle(c, 0, 0, R);
  // clear broths: deeper (darker) in the middle, thinner at the wall.
  // creamy broths: nearly flat, slightly brighter in the middle.
  const deep = 0.16 * (1 - cfg.creamy);
  c.fillStyle = radial(c, -R * 0.1, -R * 0.1, R * 0.1, R * 1.05, [
    [0, shade(base, -deep + cfg.creamy * 0.08, a)],
    [0.5, shade(base, 0.0, a)],
    [0.8, shade(base, -0.06, a)],
    [1, shade(base, -0.26, a)],
  ]);
  c.fill();
  c.save();
  circle(c, 0, 0, R);
  c.clip();
  if (cfg.creamy > 0) {
    // cloudy swirls: emulsion patches, lighter and darker
    for (let i = 0; i < 9; i++) {
      const x = (rand() - 0.5) * R * 1.4;
      const y = (rand() - 0.5) * R * 1.4;
      const rr = R * (0.2 + rand() * 0.35);
      const light = rand() < 0.6;
      c.fillStyle = radial(c, x, y, 0, rr, [
        [0, shade(base, light ? 0.22 : -0.1, (light ? 0.35 : 0.2) * cfg.creamy)],
        [1, shade(base, 0.18, 0)],
      ]);
      circle(c, x, y, rr);
      c.fill();
    }
  }
  if (cfg.particles) {
    // miso: fine suspended particles
    speckle(c, -R, -R, R * 2, R * 2, R + 1, Math.round(R * 14), rgba(cfg.particles, 0.2));
    speckle(c, -R, -R, R * 2, R * 2, R + 3, Math.round(R * 5), rgba(cfg.particles, 0.4));
    speckle(c, -R, -R, R * 2, R * 2, R + 2, Math.round(R * 6), 'rgba(255,240,210,0.2)');
  }
  if (cfg.thick) {
    // curry: slow thick surface, soft ridges
    c.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const a0 = rand() * TAU;
      const rr = R * (0.25 + rand() * 0.6);
      c.lineWidth = R * (0.03 + rand() * 0.03);
      c.strokeStyle = shade(base, 0.2, 0.3);
      c.beginPath();
      c.arc(0, 0, rr, a0, a0 + 0.5 + rand() * 1.0);
      c.stroke();
      c.lineWidth = R * 0.015;
      c.strokeStyle = shade(base, -0.25, 0.25);
      c.beginPath();
      c.arc(0, 0, rr + c.lineWidth * 2, a0 + 0.1, a0 + 0.4 + rand() * 0.8);
      c.stroke();
    }
  }
  if (cfg.chilli) {
    // chilli oil marbling: translucent orange-red streaks with a bright edge
    c.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a0 = rand() * TAU;
      const rr = R * (0.25 + rand() * 0.62);
      const span = 0.6 + rand() * 1.6;
      c.lineWidth = R * (0.05 + rand() * 0.05);
      c.strokeStyle = 'rgba(240,80,25,0.55)';
      c.beginPath();
      c.arc(0, 0, rr, a0, a0 + span);
      c.stroke();
      c.lineWidth = R * 0.018;
      c.strokeStyle = 'rgba(255,170,80,0.5)';
      c.beginPath();
      c.arc(0, 0, rr - R * 0.02, a0 + 0.1, a0 + span * 0.8);
      c.stroke();
    }
    // darker red pools
    for (let i = 0; i < 4; i++) {
      const x = (rand() - 0.5) * R * 1.3;
      const y = (rand() - 0.5) * R * 1.3;
      const rr = R * (0.12 + rand() * 0.2);
      c.fillStyle = radial(c, x, y, 0, rr, [
        [0, 'rgba(150,25,10,0.35)'],
        [1, 'rgba(150,25,10,0)'],
      ]);
      circle(c, x, y, rr);
      c.fill();
    }
  }
  if (cfg.oil) {
    // fat: flat translucent rings (clear broths) with a bright meniscus, a few
    // merged pairs; creamy broths get only a thin sheen and small beads
    const nOil = cfg.oilN ?? 10;
    const clear = cfg.creamy < 0.5;
    for (let i = 0; i < nOil; i++) {
      const ang = rand() * TAU;
      const d = Math.sqrt(rand()) * R * 0.92;
      const rr = R * (clear ? 0.015 + rand() * 0.045 : 0.01 + rand() * 0.022);
      const x = Math.cos(ang) * d;
      const y = Math.sin(ang) * d;
      const sq = 0.85 + rand() * 0.3;
      c.save();
      c.translate(x, y);
      c.scale(sq, 1 / sq);
      circle(c, 0, 0, rr);
      // a fat ring is mostly see-through: the broth shows, the edge is bright
      c.fillStyle = radial(c, -rr * 0.25, -rr * 0.3, 0, rr, [
        [0, rgba(cfg.oil, clear ? 0.35 : 0.8)],
        [0.7, rgba(cfg.oil, clear ? 0.3 : 0.55)],
        [0.92, rgba(cfg.oil, clear ? 0.75 : 0.4)],
        [1, rgba(cfg.oil, 0.15)],
      ]);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.lineWidth = Math.max(0.5, rr * 0.14);
      circle(c, 0, 0, rr * 0.9);
      c.stroke();
      c.strokeStyle = 'rgba(80,40,10,0.18)';
      c.lineWidth = Math.max(0.4, rr * 0.1);
      circle(c, rr * 0.08, rr * 0.1, rr);
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.75)';
      ellipse(c, -rr * 0.35, -rr * 0.4, rr * 0.22, rr * 0.13);
      c.fill();
      c.restore();
    }
    if (cfg.creamy > 0.8) {
      // thin fat sheen on the creamy surface
      c.fillStyle = radial(c, -R * 0.1, -R * 0.2, 0, R * 0.9, [
        [0, 'rgba(255,245,215,0.3)'],
        [0.6, 'rgba(255,245,215,0.1)'],
        [1, 'rgba(255,245,215,0)'],
      ]);
      circle(c, 0, 0, R);
      c.fill();
    }
  }
  if (cfg.sesame) {
    for (let i = 0; i < 14; i++) {
      const ang = rand() * TAU;
      const d = Math.sqrt(rand()) * R * 0.9;
      c.save();
      c.translate(Math.cos(ang) * d, Math.sin(ang) * d);
      c.rotate(rand() * TAU);
      ellipse(c, 0, 0, R * 0.018, R * 0.011);
      c.fillStyle = 'rgba(245,232,205,0.9)';
      c.fill();
      c.restore();
    }
  }
  // soft meniscus at the wall
  c.lineWidth = Math.max(1.5, R * 0.03);
  c.strokeStyle = shade(base, -0.3, 0.3);
  circle(c, 0, 0, R - c.lineWidth / 2);
  c.stroke();
  // wall shadow: the bowl wall casts a soft shadow onto the liquid near the edge (top-left stronger)
  c.fillStyle = radial(c, R * 0.12, R * 0.14, R * 0.55, R * 1.02, [
    [0, 'rgba(40,20,10,0)'],
    [0.7, 'rgba(40,20,10,0.1)'],
    [0.9, 'rgba(40,20,10,0.28)'],
    [1, 'rgba(40,20,10,0.5)'],
  ]);
  circle(c, 0, 0, R);
  c.fill();
  // ambient sheen (static); the moving one is drawn per frame
  c.fillStyle = radial(c, -R * 0.35, -R * 0.4, 0, R * 0.8, [
    [0, `rgba(255,255,255,${0.14 + cfg.creamy * 0.1})`],
    [1, 'rgba(255,255,255,0)'],
  ]);
  circle(c, 0, 0, R);
  c.fill();
  c.restore();
}

/** Tint noodle pixels with sauce (sprite-internal; context already has noodles drawn). */
function applySauce(c: Ctx, sauce: SauceOpt, R: number) {
  const col = SAUCES[sauce.id] ?? '#5a2c12';
  c.save();
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = rgba(col, 0.12 + 0.2 * sauce.amt);
  c.fillRect(-R - 6, -R - 6, R * 2 + 12, R * 2 + 12);
  // darker pooling near centre
  c.fillStyle = radial(c, 0, 0, 0, R, [
    [0, rgba(col, 0.35 * sauce.amt)],
    [1, rgba(col, 0)],
  ]);
  c.fillRect(-R, -R, R * 2, R * 2);
  // glaze shine: diagonal highlight streaks
  c.globalCompositeOperation = 'source-atop';
  c.lineCap = 'round';
  c.strokeStyle = 'rgba(255,255,255,0.45)';
  c.lineWidth = R * 0.04;
  const rand = rng(sauce.id.length * 11);
  for (let i = 0; i < 14; i++) {
    const x = (rand() - 0.5) * R * 1.4;
    const y = (rand() - 0.5) * R * 1.4;
    const L = R * (0.12 + rand() * 0.25);
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + L * 0.8, y - L * 0.5);
    c.stroke();
  }
  c.fillStyle = radial(c, -R * 0.3, -R * 0.35, 0, R * 0.7, [
    [0, 'rgba(255,255,255,0.3)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  c.fillRect(-R, -R, R * 2, R * 2);
  c.restore();
}

// ---------------------------------------------------------------------------
// Bowl from above
// ---------------------------------------------------------------------------

function drawRimPattern(c: Ctx, st: BowlStyle, R: number, inner: number) {
  const midR = (R + inner) / 2;
  const ringW = R - inner;
  c.save();
  c.lineCap = 'round';
  switch (st.pattern) {
    case 'ring': {
      c.strokeStyle = st.patternColor;
      c.lineWidth = ringW * 0.16;
      circle(c, 0, 0, midR + ringW * 0.12);
      c.stroke();
      c.lineWidth = ringW * 0.07;
      circle(c, 0, 0, inner + ringW * 0.22);
      c.stroke();
      break;
    }
    case 'wave': {
      c.strokeStyle = st.patternColor;
      c.lineWidth = ringW * 0.13;
      c.beginPath();
      const n = 22;
      for (let i = 0; i <= n * 10; i++) {
        const a = (i / (n * 10)) * TAU;
        const rr = midR + Math.sin(a * n) * ringW * 0.22;
        const x = Math.cos(a) * rr;
        const y = Math.sin(a) * rr;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      c.stroke();
      break;
    }
    case 'dots': {
      c.fillStyle = st.patternColor;
      const n = 28;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU;
        circle(c, Math.cos(a) * midR, Math.sin(a) * midR, ringW * 0.13);
        c.fill();
      }
      break;
    }
    case 'sakura': {
      const n = 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + 0.4;
        const x = Math.cos(a) * midR;
        const y = Math.sin(a) * midR;
        c.save();
        c.translate(x, y);
        c.rotate(a);
        const pr = ringW * 0.17;
        c.fillStyle = st.patternColor;
        for (let k = 0; k < 5; k++) {
          const pa = (k / 5) * TAU;
          ellipse(c, Math.cos(pa) * pr, Math.sin(pa) * pr, pr * 0.75, pr * 0.55);
          c.fill();
        }
        c.fillStyle = '#fff3c2';
        circle(c, 0, 0, pr * 0.4);
        c.fill();
        c.restore();
        // small leaf between
        const b = a + TAU / n / 2;
        c.fillStyle = rgba(st.patternColor, 0.6);
        circle(c, Math.cos(b) * midR, Math.sin(b) * midR, ringW * 0.07);
        c.fill();
      }
      break;
    }
    case 'speckle': {
      c.beginPath();
      c.arc(0, 0, R - 1, 0, TAU);
      c.arc(0, 0, inner + 1, 0, TAU, true);
      c.clip();
      speckle(c, -R, -R, R * 2, R * 2, 99, Math.round(R * 6), rgba(st.patternColor, 0.55));
      speckle(c, -R, -R, R * 2, R * 2, 7, Math.round(R * 2), 'rgba(255,255,255,0.35)');
      break;
    }
    default:
      break;
  }
  c.restore();
}

function bowlBaseSprite(styleId: string, S: number): HTMLCanvasElement {
  const st = bowlStyle(styleId);
  const box = Math.ceil(S * 1.24);
  return sprite(
    `bowlbase:${st.id}:${Math.round(S)}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      const R = S / 2;
      const inner = R - S * 0.09;
      // ground shadow
      softShadow(c, 0, S * 0.045, R * 1.08, R * 0.95, 0.28);
      // outer glaze ring
      circle(c, 0, 0, R);
      c.fillStyle = radial(c, -R * 0.35, -R * 0.4, R * 0.1, R * 1.5, [
        [0, shade(st.outer, 0.22)],
        [0.5, st.outer],
        [1, shade(st.outer, -0.28)],
      ]);
      c.fill();
      // ring inner edge shading (rim curvature)
      c.save();
      circle(c, 0, 0, R);
      c.clip();
      c.strokeStyle = 'rgba(0,0,0,0.12)';
      c.lineWidth = S * 0.02;
      circle(c, 0, 0, R - S * 0.005);
      c.stroke();
      c.restore();
      drawRimPattern(c, st, R, inner);
      // lip
      c.lineWidth = Math.max(1.2, S * 0.012);
      c.strokeStyle = rgba(st.rim, 0.85);
      circle(c, 0, 0, inner + c.lineWidth / 2);
      c.stroke();
      // outline
      c.lineWidth = 1.2;
      c.strokeStyle = OUT;
      circle(c, 0, 0, R);
      c.stroke();
      // inside glaze
      circle(c, 0, 0, inner);
      c.fillStyle = st.inner;
      c.fill();
      // concave shading: deeper centre darker, cast shadow under the top-left rim
      circle(c, 0, 0, inner);
      c.fillStyle = radial(c, inner * 0.14, inner * 0.16, 0, inner * 1.05, [
        [0, 'rgba(60,35,20,0.14)'],
        [0.5, 'rgba(60,35,20,0.04)'],
        [0.8, 'rgba(60,35,20,0.14)'],
        [0.93, 'rgba(60,35,20,0.32)'],
        [1, 'rgba(60,35,20,0.5)'],
      ]);
      c.fill();
      // cast shadow of the near (top-left) rim onto the inside wall
      c.save();
      circle(c, 0, 0, inner);
      c.clip();
      c.fillStyle = 'rgba(40,22,10,0.28)';
      c.shadowColor = 'rgba(40,22,10,0.5)';
      c.shadowBlur = S * 0.035;
      c.beginPath();
      c.arc(0, 0, inner + S * 0.02, 0, TAU);
      c.arc(inner * 0.07, inner * 0.08, inner * 0.98, 0, TAU, true);
      c.fill();
      c.restore();
      // reflected light on the bottom-right wall
      circle(c, 0, 0, inner);
      c.fillStyle = radial(c, inner * 0.5, inner * 0.55, inner * 0.2, inner * 0.9, [
        [0, 'rgba(255,255,255,0.22)'],
        [1, 'rgba(255,255,255,0)'],
      ]);
      c.fill();
      // inner edge line
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(60,35,20,0.18)';
      circle(c, 0, 0, inner);
      c.stroke();
    },
    2
  );
}

function overflowSprite(broth: string, S: number, fill: number): HTMLCanvasElement {
  const f = Math.round(clamp(fill, 1.03, 1.2) * 50) / 50;
  const box = Math.ceil(S * 1.3);
  return sprite(
    `overflow:${broth}:${Math.round(S)}:${f}`,
    box,
    box,
    (c) => {
      c.translate(box / 2, box / 2);
      const R = S / 2;
      const inner = R - S * 0.09;
      const cfg = BROTHS[broth] ?? BROTHS.shoyu;
      const rand = rng(broth.length * 13 + Math.round(f * 100));
      const k = (f - 1.03) / 0.17; // 0..1
      const col = shade(cfg.col, 0.04, Math.min(0.95, cfg.alpha + 0.15));
      c.fillStyle = col;
      // thin film creeping over the rim ring
      c.save();
      c.globalAlpha = 0.45 + 0.3 * k;
      blobPath(
        c,
        0,
        0,
        inner + (R - inner) * (0.5 + 0.5 * k),
        inner + (R - inner) * (0.45 + 0.5 * k),
        rand,
        0.03,
        16
      );
      c.fill();
      c.restore();
      // tongues pouring over the rim, mostly on the lower half
      const nt = 3 + Math.round(k * 2);
      for (let i = 0; i < nt; i++) {
        const a = Math.PI * 0.15 + (i / nt) * Math.PI * 0.75 + rand() * 0.3;
        const wdt = R * (0.1 + rand() * 0.08) * (0.7 + k * 0.5);
        const out = R * (0.035 + rand() * 0.04 + k * 0.05);
        c.save();
        c.rotate(a);
        c.beginPath();
        c.moveTo(inner - 2, -wdt);
        c.bezierCurveTo(R + out * 1.3, -wdt * 1.1, R + out * 1.3, wdt * 1.1, inner - 2, wdt);
        c.closePath();
        c.fill();
        // drip hanging from the tongue
        if (rand() < 0.6) {
          const dl = R * (0.04 + rand() * 0.07) * (0.6 + k);
          const dw = R * 0.022;
          const dy = (rand() - 0.5) * wdt;
          c.beginPath();
          c.moveTo(R + out * 0.5, dy - dw);
          c.quadraticCurveTo(R + out * 0.5 + dl, dy - dw, R + out * 0.5 + dl + dw, dy);
          c.quadraticCurveTo(R + out * 0.5 + dl, dy + dw, R + out * 0.5, dy + dw);
          c.closePath();
          c.fill();
        }
        // sheen on the tongue
        c.fillStyle = 'rgba(255,255,255,0.22)';
        ellipse(c, R + out * 0.3, -wdt * 0.3, out * 0.4, wdt * 0.25);
        c.fill();
        c.fillStyle = col;
        c.restore();
      }
    },
    2
  );
}

function drawSteam(c: Ctx, S: number, t: number, amt: number) {
  const R = S / 2;
  c.save();
  c.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ph = t * 0.35 + i * 0.37;
    const rise = ((ph % 1) + 1) % 1; // 0..1 looping
    const x0 = (i - 1) * R * 0.4 + Math.sin(ph * 2.3 + i) * R * 0.06;
    const y0 = -R * 0.1 - rise * R * 0.8;
    const alpha = amt * 0.5 * Math.sin(rise * Math.PI);
    if (alpha <= 0.01) continue;
    const sway = Math.sin(t * 1.3 + i * 2) * R * 0.08;
    const wave = (x: number, y: number) => {
      c.beginPath();
      c.moveTo(x, y + R * 0.45);
      c.bezierCurveTo(
        x - R * 0.1 + sway,
        y + R * 0.3,
        x + R * 0.12 - sway,
        y + R * 0.15,
        x + sway * 0.5,
        y
      );
      c.bezierCurveTo(
        x - R * 0.08,
        y - R * 0.08,
        x + R * 0.04,
        y - R * 0.16,
        x - R * 0.03,
        y - R * 0.24
      );
    };
    wave(x0, y0);
    c.lineWidth = S * 0.07;
    c.strokeStyle = `rgba(255,255,255,${alpha * 0.25})`;
    c.stroke();
    c.lineWidth = S * 0.035;
    c.strokeStyle = `rgba(255,255,255,${alpha * 0.5})`;
    c.stroke();
  }
  c.restore();
}

export function drawBowlTop(
  c: Ctx,
  b: BowlState,
  size: number,
  t: number,
  opts?: { cook?: CookState; steam?: number }
): void {
  const S = size;
  const R = S / 2;
  const inner = R - S * 0.09;
  const k = S / 300;
  const cook = opts?.cook ?? cookOf(b);
  const noodleR = inner * 0.8;
  const sauce = isSauce(b.broth);
  const fill = clamp(b.fill, 0, 1.2);

  c.save();
  // 1. base (shadow + ceramic + inner shading)
  const base = bowlBaseSprite(b.style, S);
  const bb = Math.ceil(S * 1.24);
  c.drawImage(base, -bb / 2, -bb / 2, bb, bb);

  // 2. noodles (+ sauce)
  if (b.noodle) {
    if (sauce && b.broth && fill > 0.02) {
      // puddle of sauce under the nest
      c.fillStyle = radial(c, 0, 0, 0, noodleR * 0.9, [
        [0, rgba(SAUCES[b.broth], 0.5 * Math.min(1, fill))],
        [0.7, rgba(SAUCES[b.broth], 0.35 * Math.min(1, fill))],
        [1, rgba(SAUCES[b.broth], 0)],
      ]);
      circle(c, 0, 0, noodleR * 0.9);
      c.fill();
      const s = noodleSprite(b.noodle, b.thick, cook, noodleR, 11, {
        id: b.broth,
        amt: Math.min(1, fill),
      });
      const box = Math.round(noodleR) * 2 + 12;
      c.drawImage(s, -box / 2, -box / 2, box, box);
    } else {
      drawNoodles(c, b.noodle, b.thick, cook, noodleR, 11);
    }
  }

  // 3. broth
  if (b.broth && !sauce && fill > 0.02) {
    const f1 = Math.min(fill, 1);
    const rad = inner * (0.3 + 0.7 * f1);
    const disc = brothDisc(b.broth, rad);
    const db = Math.round(rad) * 2 + 4;
    c.drawImage(disc, -db / 2, -db / 2, db, db);
    if (fill > 1.03) {
      const ov = overflowSprite(b.broth, S, fill);
      const ob = Math.ceil(S * 1.3);
      c.drawImage(ov, -ob / 2, -ob / 2, ob, ob);
    }
    // the nest floats: redraw its centre over the liquid
    if (b.noodle && fill > 0.25) {
      const fs = noodleFloatSprite(b.noodle, b.thick, cook, noodleR, 11);
      const box = Math.round(noodleR) * 2 + 12;
      c.save();
      c.globalAlpha = cook === 'burnt' ? 0.6 : 1;
      c.drawImage(fs, -box / 2, -box / 2, box, box);
      c.restore();
    }
    // moving shimmer: one soft highlight arc
    const ph = t * 0.8;
    const hx = Math.cos(ph) * rad * 0.25 - rad * 0.3;
    const hy = Math.sin(ph * 1.3) * rad * 0.2 - rad * 0.3;
    c.save();
    circle(c, 0, 0, rad);
    c.clip();
    c.fillStyle = radial(c, hx, hy, 0, rad * 0.5, [
      [0, 'rgba(255,255,255,0.16)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    c.fillRect(-rad, -rad, rad * 2, rad * 2);
    c.restore();
  }

  // 4. pieces
  for (const p of b.pieces) {
    c.save();
    c.translate((p.x - 150) * k, (p.y - 150) * k);
    drawPiece(c, p.id, p.v, p.s * k, p.rot);
    c.restore();
  }

  // 5. rim specular: a crisp glaze reflection on the lip, soft broad + sharp core
  c.lineCap = 'round';
  c.lineWidth = S * 0.04;
  c.strokeStyle = 'rgba(255,255,255,0.28)';
  c.beginPath();
  c.arc(0, 0, R - S * 0.045, Math.PI * 1.0, Math.PI * 1.5);
  c.stroke();
  c.lineWidth = S * 0.012;
  c.strokeStyle = 'rgba(255,255,255,0.85)';
  c.beginPath();
  c.arc(0, 0, R - S * 0.035, Math.PI * 1.08, Math.PI * 1.42);
  c.stroke();
  c.lineWidth = S * 0.018;
  c.strokeStyle = 'rgba(255,255,255,0.22)';
  c.beginPath();
  c.arc(0, 0, R - S * 0.045, Math.PI * 0.12, Math.PI * 0.35);
  c.stroke();
  c.lineWidth = S * 0.007;
  c.strokeStyle = 'rgba(255,255,255,0.5)';
  c.beginPath();
  c.arc(0, 0, R - S * 0.035, Math.PI * 0.16, Math.PI * 0.3);
  c.stroke();

  // 6. steam
  if (opts?.steam && opts.steam > 0.01) drawSteam(c, S, t, opts.steam);
  c.restore();
}

// ---------------------------------------------------------------------------
// Containers: tubs, trays, pots
// ---------------------------------------------------------------------------

function stonewareBody(c: Ctx, w: number, h: number, r: number, seed: number) {
  // soft shadow, a little heavier under the near edge
  softShadow(c, w / 2, h * 0.6, w * 0.6, h * 0.52, 0.26);
  roundRect(c, 0, 0, w, h, r);
  c.fillStyle = linear(c, 0, 0, w * 0.35, h, [
    [0, '#f8f2e8'],
    [0.5, '#ede3d2'],
    [1, '#d9cbb4'],
  ]);
  c.fill();
  c.save();
  c.clip();
  // speckled stoneware: iron flecks in two sizes plus a few pale ones
  speckle(c, 0, 0, w, h, seed, Math.round(w * h * 0.035), 'rgba(110,80,50,0.14)');
  speckle(c, 0, 0, w, h, seed + 1, Math.round(w * h * 0.006), 'rgba(80,55,35,0.3)');
  speckle(c, 0, 0, w, h, seed + 2, Math.round(w * h * 0.01), 'rgba(255,255,255,0.4)');
  // glaze: a soft diagonal sheen across the top-left
  c.fillStyle = linear(c, 0, 0, w * 0.6, h * 0.6, [
    [0, 'rgba(255,255,255,0.35)'],
    [0.35, 'rgba(255,255,255,0.08)'],
    [1, 'rgba(255,255,255,0)'],
  ]);
  c.fillRect(0, 0, w, h);
  // underside: slightly darker toward the bottom edge
  c.fillStyle = linear(c, 0, h * 0.7, 0, h, [
    [0, 'rgba(90,60,35,0)'],
    [1, 'rgba(90,60,35,0.14)'],
  ]);
  c.fillRect(0, 0, w, h);
  c.restore();
  c.lineWidth = 1.2;
  c.strokeStyle = OUT;
  c.stroke();
}

function tubCavity(c: Ctx, x: number, y: number, w: number, h: number, r: number, floor: string) {
  roundRect(c, x, y, w, h, r);
  c.fillStyle = floor;
  c.fill();
  // inner wall shadow: dark at the top-left wall, lit at the bottom-right
  roundRect(c, x, y, w, h, r);
  c.fillStyle = linear(c, x, y, x + w * 0.55, y + h, [
    [0, 'rgba(60,35,20,0.42)'],
    [0.3, 'rgba(60,35,20,0.12)'],
    [1, 'rgba(60,35,20,0.0)'],
  ]);
  c.fill();
  // ambient occlusion all round the inner wall
  edgeAO(c, () => roundRect(c, x, y, w, h, r), Math.min(w, h) * 0.07, 'rgba(60,35,20,0.3)', 4);
  c.lineWidth = 1;
  c.strokeStyle = 'rgba(60,35,20,0.35)';
  roundRect(c, x, y, w, h, r);
  c.stroke();
}

export function drawTub(c: Ctx, id: string, w: number, h: number): void {
  const s = sprite(
    `tub:${id}:${Math.round(w)}x${Math.round(h)}`,
    w + 8,
    h + 10,
    (cc) => {
      cc.translate(4, 3);
      const r = Math.min(w, h) * 0.16;
      stonewareBody(cc, w, h, r, id.length * 7);
      const inset = Math.min(w, h) * 0.085;
      const iw = w - inset * 2;
      const ih = h - inset * 2;
      const cr = r * 0.7;
      tubCavity(cc, inset, inset, iw, ih, cr, '#e3d6c2');
      // the heap: a real mound. Pieces are scaled so the biggest ones span
      // ~55% of the cavity, scattered densely with the centre on top.
      const ps = PIECE_SIZE[id] ?? 30;
      const minSide = Math.min(iw, ih);
      const scale = clamp((minSide * 0.6) / ps, 0.5, 1.5);
      const footprint = ps * scale;
      const n = clamp(Math.round(((iw * ih) / (footprint * footprint)) * 3.2), 7, 26);
      const rand = rng(id.length * 97 + 3);
      const nv = PIECE_VARIANTS[id] ?? 1;
      const pts: { x: number; y: number; v: number; rot: number; s: number; d: number }[] = [];
      for (let i = 0; i < n; i++) {
        const a = rand() * TAU;
        const d = Math.pow(rand(), 0.55);
        pts.push({
          x: inset + iw / 2 + Math.cos(a) * d * iw * 0.42,
          y: inset + ih / 2 + Math.sin(a) * d * ih * 0.4,
          v: Math.floor(rand() * nv),
          rot: rand() * TAU,
          s: scale * (0.82 + rand() * 0.32),
          d,
        });
      }
      // edges first (base of the mound), centre last (top)
      pts.sort((p, q) => q.d - p.d || p.y - q.y);
      cc.save();
      roundRect(cc, inset, inset, iw, ih, cr);
      cc.clip();
      // mound shadow on the tub floor
      cc.fillStyle = radial(cc, inset + iw / 2, inset + ih * 0.58, 0, minSide * 0.6, [
        [0, 'rgba(50,30,15,0.4)'],
        [0.7, 'rgba(50,30,15,0.18)'],
        [1, 'rgba(50,30,15,0)'],
      ]);
      cc.fillRect(inset, inset, iw, ih);
      for (const p of pts) {
        cc.save();
        cc.translate(p.x, p.y);
        drawPiece(cc, id, p.v, p.s, p.rot);
        cc.restore();
      }
      // the wall shadows the heap along the top-left
      roundRect(cc, inset, inset, iw, ih, cr);
      cc.fillStyle = linear(cc, inset, inset, inset + iw * 0.4, inset + ih * 0.55, [
        [0, 'rgba(50,30,15,0.34)'],
        [0.5, 'rgba(50,30,15,0.08)'],
        [1, 'rgba(50,30,15,0)'],
      ]);
      cc.fill();
      // light catching the top of the mound
      cc.fillStyle = radial(cc, inset + iw * 0.42, inset + ih * 0.4, 0, minSide * 0.45, [
        [0, 'rgba(255,245,225,0.16)'],
        [1, 'rgba(255,245,225,0)'],
      ]);
      cc.fillRect(inset, inset, iw, ih);
      cc.restore();
      // bright glazed rim: a pale band between the wall and the cavity
      cc.lineWidth = Math.max(1.4, inset * 0.32);
      cc.strokeStyle = 'rgba(255,252,245,0.75)';
      roundRect(
        cc,
        inset - cc.lineWidth * 0.7,
        inset - cc.lineWidth * 0.7,
        iw + cc.lineWidth * 1.4,
        ih + cc.lineWidth * 1.4,
        cr + 1
      );
      cc.stroke();
      // tub top-edge specular
      cc.lineCap = 'round';
      cc.lineWidth = 1.6;
      cc.strokeStyle = 'rgba(255,255,255,0.7)';
      cc.beginPath();
      cc.moveTo(r, 1.3);
      cc.lineTo(w - r, 1.3);
      cc.stroke();
      cc.lineWidth = 1.1;
      cc.strokeStyle = 'rgba(255,255,255,0.45)';
      cc.beginPath();
      cc.moveTo(1.3, r);
      cc.lineTo(1.3, h - r);
      cc.stroke();
    },
    2
  );
  c.save();
  c.drawImage(s, -4, -3, w + 8, h + 10);
  c.restore();
}

export function drawNoodleTray(c: Ctx, noodle: string, thick: Thick, w: number, h: number): void {
  const s = sprite(
    `tray:${noodle}:${thick}:${Math.round(w)}x${Math.round(h)}`,
    w + 8,
    h + 10,
    (cc) => {
      cc.translate(4, 3);
      softShadow(cc, w / 2, h * 0.56, w * 0.56, h * 0.5, 0.22);
      const r = Math.min(w, h) * 0.12;
      // frame
      roundRect(cc, 0, 0, w, h, r);
      cc.fillStyle = cc.createLinearGradient(0, 0, 0, h);
      (cc.fillStyle as CanvasGradient).addColorStop(0, '#d2a874');
      (cc.fillStyle as CanvasGradient).addColorStop(1, '#b4855a');
      cc.fill();
      cc.lineWidth = 1.2;
      cc.strokeStyle = OUT;
      cc.stroke();
      // bamboo slats
      const inset = Math.min(w, h) * 0.09;
      cc.save();
      roundRect(cc, inset, inset, w - inset * 2, h - inset * 2, r * 0.5);
      cc.clip();
      cc.fillStyle = '#d4b07a';
      cc.fillRect(inset, inset, w - inset * 2, h - inset * 2);
      const slat = Math.max(5, w * 0.075);
      const rand = rng(noodle.length * 5 + w);
      for (let x = inset; x < w - inset; x += slat) {
        cc.fillStyle = mix('#cfa86f', '#e2c48f', rand());
        cc.fillRect(x, inset, slat - 1.2, h - inset * 2);
        cc.fillStyle = 'rgba(120,80,40,0.25)';
        cc.fillRect(x + slat - 1.6, inset, 1.2, h - inset * 2);
        // bamboo node
        cc.fillStyle = 'rgba(120,80,40,0.18)';
        cc.fillRect(x, inset + (h - inset * 2) * (0.3 + rand() * 0.4), slat - 1.2, 1.3);
      }
      // inner shadow
      cc.fillStyle = cc.createLinearGradient(0, inset, 0, inset + h * 0.3);
      (cc.fillStyle as CanvasGradient).addColorStop(0, 'rgba(60,35,20,0.28)');
      (cc.fillStyle as CanvasGradient).addColorStop(1, 'rgba(60,35,20,0)');
      cc.fillRect(inset, inset, w - inset * 2, h - inset * 2);
      cc.restore();
      roundRect(cc, inset, inset, w - inset * 2, h - inset * 2, r * 0.5);
      cc.lineWidth = 1;
      cc.strokeStyle = 'rgba(60,35,20,0.3)';
      cc.stroke();
      // dry nest
      cc.save();
      cc.translate(w / 2, h / 2 + 1);
      const nr = Math.min(w, h) * 0.4;
      const kk = 0.72;
      cc.scale(Math.min(1.25, (w * 0.45) / nr) * kk, kk);
      drawNoodles(cc, noodle, thick, 'raw', Math.round(nr / kk), 5);
      cc.restore();
    },
    2
  );
  c.save();
  c.drawImage(s, -4, -3, w + 8, h + 10);
  c.restore();
}

function potBaseSprite(broth: string, w: number, h: number): HTMLCanvasElement {
  return sprite(
    `pot:${broth}:${Math.round(w)}x${Math.round(h)}`,
    w + 12,
    h + 12,
    (c) => {
      c.translate(w / 2 + 6, h / 2 + 6);
      const S = Math.min(w, h);
      const R = S * 0.42;
      if (isSauce(broth)) {
        // squat ceramic jar from above with a spoon
        softShadow(c, 0, S * 0.05, R * 1.15, R * 1.0, 0.25);
        circle(c, 0, 0, R);
        c.fillStyle = radial(c, -R * 0.3, -R * 0.3, R * 0.1, R * 1.4, [
          [0, '#fbf5ea'],
          [0.6, '#eadfcc'],
          [1, '#cbbba2'],
        ]);
        c.fill();
        c.lineWidth = 1.2;
        c.strokeStyle = OUT;
        c.stroke();
        const ir = R * 0.74;
        const col = SAUCES[broth];
        circle(c, 0, 0, ir);
        c.fillStyle = radial(c, 0, 0, ir * 0.2, ir, [
          [0, shade(col, -0.1)],
          [0.85, col],
          [1, shade(col, 0.15)],
        ]);
        c.fill();
        c.lineWidth = Math.max(1.5, ir * 0.06);
        c.strokeStyle = 'rgba(60,35,20,0.35)';
        c.stroke();
        // glaze gloss
        c.fillStyle = radial(c, -ir * 0.35, -ir * 0.4, 0, ir * 0.7, [
          [0, 'rgba(255,255,255,0.35)'],
          [1, 'rgba(255,255,255,0)'],
        ]);
        circle(c, 0, 0, ir);
        c.fill();
        // spoon across
        c.save();
        c.rotate(-0.6);
        c.lineCap = 'round';
        c.lineWidth = S * 0.05;
        c.strokeStyle = '#c99a6b';
        c.beginPath();
        c.moveTo(-R * 0.15, 0);
        c.lineTo(R * 1.15, 0);
        c.stroke();
        c.lineWidth = S * 0.02;
        c.strokeStyle = 'rgba(255,240,210,0.5)';
        c.beginPath();
        c.moveTo(-R * 0.1, -S * 0.012);
        c.lineTo(R * 1.1, -S * 0.012);
        c.stroke();
        ellipse(c, -R * 0.3, 0, S * 0.1, S * 0.07);
        c.fillStyle = '#d8ad7c';
        c.fill();
        c.lineWidth = 1;
        c.strokeStyle = OUT;
        c.stroke();
        ellipse(c, -R * 0.3, 0, S * 0.07, S * 0.045);
        c.fillStyle = shade(col, 0.05);
        c.fill();
        c.restore();
        return;
      }
      // metal stock pot
      softShadow(c, 0, S * 0.05, R * 1.2, R * 1.05, 0.28);
      // handles
      c.lineCap = 'round';
      c.lineWidth = S * 0.055;
      c.strokeStyle = '#4a4a50';
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.arc(
          sx * R * 1.02,
          0,
          S * 0.1,
          sx > 0 ? -1.2 : Math.PI - 1.2,
          sx > 0 ? 1.2 : Math.PI + 1.2
        );
        c.stroke();
      }
      c.lineWidth = S * 0.02;
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.arc(
          sx * R * 1.02,
          -S * 0.012,
          S * 0.1,
          sx > 0 ? -1.0 : Math.PI - 1.0,
          sx > 0 ? 0.6 : Math.PI + 0.6
        );
        c.stroke();
      }
      circle(c, 0, 0, R);
      c.fillStyle = radial(c, -R * 0.4, -R * 0.45, R * 0.1, R * 1.5, [
        [0, '#b9bcc4'],
        [0.4, '#80848e'],
        [1, '#454851'],
      ]);
      c.fill();
      c.lineWidth = 1.2;
      c.strokeStyle = 'rgba(20,20,30,0.4)';
      c.stroke();
      // rim ring highlight
      c.lineWidth = R * 0.05;
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.beginPath();
      c.arc(0, 0, R * 0.95, Math.PI * 1.05, Math.PI * 1.5);
      c.stroke();
      const ir = R * 0.86;
      // dark inner wall
      circle(c, 0, 0, ir);
      c.fillStyle = '#2d2f36';
      c.fill();
      // broth
      renderLiquid(c, broth, ir * 0.97, 1);
      // ladle
      c.save();
      c.rotate(0.75);
      c.lineCap = 'round';
      c.lineWidth = S * 0.045;
      c.strokeStyle = '#8a8d96';
      c.beginPath();
      c.moveTo(R * 0.25, 0);
      c.lineTo(R * 1.25, 0);
      c.stroke();
      c.lineWidth = S * 0.015;
      c.strokeStyle = 'rgba(255,255,255,0.5)';
      c.beginPath();
      c.moveTo(R * 0.3, -S * 0.01);
      c.lineTo(R * 1.2, -S * 0.01);
      c.stroke();
      circle(c, R * 0.22, 0, S * 0.12);
      c.fillStyle = radial(c, R * 0.18, -S * 0.04, 0, S * 0.16, [
        [0, '#c9ccd3'],
        [1, '#6d707a'],
      ]);
      c.fill();
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(20,20,30,0.4)';
      c.stroke();
      circle(c, R * 0.22, 0, S * 0.085);
      c.fillStyle = shade((BROTHS[broth] ?? BROTHS.shoyu).col, 0.05, 0.9);
      c.fill();
      c.restore();
    },
    2
  );
}

export function drawPot(c: Ctx, broth: string, w: number, h: number, t: number): void {
  const s = potBaseSprite(broth, w, h);
  c.save();
  c.drawImage(s, -6, -6, w + 12, h + 12);
  if (!isSauce(broth)) {
    const S = Math.min(w, h);
    const ir = S * 0.42 * 0.86;
    const ph = t * 0.7;
    const hx = w / 2 + Math.cos(ph) * ir * 0.3 - ir * 0.2;
    const hy = h / 2 + Math.sin(ph * 1.4) * ir * 0.25 - ir * 0.2;
    c.save();
    circle(c, w / 2, h / 2, ir);
    c.clip();
    c.fillStyle = radial(c, hx, hy, 0, ir * 0.5, [
      [0, 'rgba(255,255,255,0.2)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    c.fillRect(0, 0, w, h);
    // faint bubbles ring
    c.strokeStyle = 'rgba(255,255,255,0.18)';
    c.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const bt = (t * 0.5 + i * 0.33) % 1;
      circle(
        c,
        w / 2 + Math.cos(i * 2.1) * ir * 0.45,
        h / 2 + Math.sin(i * 2.1) * ir * 0.45,
        ir * 0.06 + bt * ir * 0.12
      );
      c.globalAlpha = 1 - bt;
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// Bowl icon (3/4 view) and ingredient thumbnails
// ---------------------------------------------------------------------------

export function drawBowlIcon(c: Ctx, style: string, size: number): void {
  const st = bowlStyle(style);
  const s = sprite(
    `bowlicon:${st.id}:${Math.round(size)}`,
    size * 1.2,
    size * 1.2,
    (cc) => {
      cc.translate(size * 0.6, size * 0.6);
      const W = size * 0.46; // half width
      const topY = -size * 0.14;
      const ry = W * 0.42;
      softShadow(cc, 0, size * 0.36, W * 1.05, W * 0.3, 0.26);
      // body
      cc.beginPath();
      cc.moveTo(-W, topY);
      cc.bezierCurveTo(-W * 0.95, size * 0.28, -W * 0.5, size * 0.36, 0, size * 0.36);
      cc.bezierCurveTo(W * 0.5, size * 0.36, W * 0.95, size * 0.28, W, topY);
      cc.closePath();
      cc.fillStyle = cc.createLinearGradient(-W, 0, W, 0);
      (cc.fillStyle as CanvasGradient).addColorStop(0, shade(st.outer, -0.12));
      (cc.fillStyle as CanvasGradient).addColorStop(0.3, shade(st.outer, 0.18));
      (cc.fillStyle as CanvasGradient).addColorStop(0.7, st.outer);
      (cc.fillStyle as CanvasGradient).addColorStop(1, shade(st.outer, -0.3));
      cc.fill();
      cc.save();
      cc.clip();
      // pattern band near the top
      cc.save();
      cc.translate(0, topY + ry * 0.9);
      cc.scale(1, 0.42);
      drawRimPattern(cc, st, W * 1.02, W * 0.78);
      cc.restore();
      // bottom darkening
      cc.fillStyle = cc.createLinearGradient(0, 0, 0, size * 0.36);
      (cc.fillStyle as CanvasGradient).addColorStop(0, 'rgba(0,0,0,0)');
      (cc.fillStyle as CanvasGradient).addColorStop(1, 'rgba(40,20,10,0.25)');
      cc.fillRect(-W, 0, W * 2, size * 0.4);
      cc.restore();
      cc.lineWidth = 1.1;
      cc.strokeStyle = OUT;
      cc.stroke();
      // foot
      cc.fillStyle = shade(st.outer, -0.25);
      ellipse(cc, 0, size * 0.37, W * 0.38, W * 0.07);
      cc.fill();
      // opening
      ellipse(cc, 0, topY, W, ry);
      cc.fillStyle = st.inner;
      cc.fill();
      ellipse(cc, 0, topY, W, ry);
      cc.fillStyle = radial(cc, 0, topY + ry * 0.3, 0, W, [
        [0, 'rgba(60,35,20,0.12)'],
        [0.7, 'rgba(60,35,20,0.05)'],
        [1, 'rgba(60,35,20,0.28)'],
      ]);
      cc.fill();
      // cast shadow from far rim
      cc.save();
      ellipse(cc, 0, topY, W, ry);
      cc.clip();
      cc.fillStyle = 'rgba(60,35,20,0.22)';
      ellipse(cc, 0, topY - ry * 0.5, W * 0.95, ry * 0.7);
      cc.fill();
      cc.restore();
      // lip
      cc.lineWidth = Math.max(1.2, size * 0.028);
      cc.strokeStyle = st.rim;
      ellipse(cc, 0, topY, W, ry);
      cc.stroke();
      cc.lineWidth = 1;
      cc.strokeStyle = OUT;
      cc.stroke();
      // gloss
      cc.strokeStyle = 'rgba(255,255,255,0.5)';
      cc.lineWidth = Math.max(1, size * 0.02);
      cc.beginPath();
      cc.ellipse(0, topY, W * 0.92, ry * 0.85, 0, Math.PI * 1.1, Math.PI * 1.5);
      cc.stroke();
      cc.beginPath();
      cc.moveTo(-W * 0.72, topY + ry * 1.4);
      cc.quadraticCurveTo(-W * 0.7, size * 0.2, -W * 0.45, size * 0.28);
      cc.strokeStyle = 'rgba(255,255,255,0.35)';
      cc.stroke();
    },
    2
  );
  c.save();
  c.drawImage(s, -size * 0.6, -size * 0.6, size * 1.2, size * 1.2);
  c.restore();
}

export function drawIngredientIcon(c: Ctx, id: string, size: number): void {
  const s = sprite(
    `icon:${id}:${Math.round(size)}`,
    size,
    size,
    (cc) => {
      cc.translate(size / 2, size / 2);
      if (id in PIECE_SIZE) {
        const sc = (size * 0.78) / PIECE_SIZE[id];
        drawPiece(cc, id, 0, sc, id === 'nori' || id === 'karides' || id === 'bambu' ? -0.35 : 0);
      } else if (id in NOODLES) {
        drawNoodles(cc, id, 'orta', 'perfect', size * 0.42, 3);
      } else if (id in SAUCES) {
        // small jar
        const R = size * 0.4;
        softShadow(cc, 0, size * 0.06, R * 1.1, R, 0.22);
        circle(cc, 0, 0, R);
        cc.fillStyle = radial(cc, -R * 0.3, -R * 0.3, 0, R * 1.4, [
          [0, '#fbf5ea'],
          [1, '#cbbba2'],
        ]);
        cc.fill();
        cc.lineWidth = 1;
        cc.strokeStyle = OUT;
        cc.stroke();
        const ir = R * 0.72;
        circle(cc, 0, 0, ir);
        cc.fillStyle = radial(cc, 0, 0, 0, ir, [
          [0, shade(SAUCES[id], -0.1)],
          [1, shade(SAUCES[id], 0.12)],
        ]);
        cc.fill();
        cc.strokeStyle = 'rgba(60,35,20,0.35)';
        cc.stroke();
        gloss(cc, -ir * 0.35, -ir * 0.4, ir * 0.6, 0.4);
      } else if (id in BROTHS) {
        // small cup of liquid
        const R = size * 0.42;
        softShadow(cc, 0, size * 0.06, R * 1.1, R, 0.22);
        circle(cc, 0, 0, R);
        cc.fillStyle = radial(cc, -R * 0.3, -R * 0.3, 0, R * 1.4, [
          [0, '#ffffff'],
          [1, '#d9cfc0'],
        ]);
        cc.fill();
        cc.lineWidth = 1;
        cc.strokeStyle = OUT;
        cc.stroke();
        circle(cc, 0, 0, R * 0.8);
        cc.fillStyle = 'rgba(60,35,20,0.1)';
        cc.fill();
        renderLiquid(cc, id, R * 0.78, 1);
      } else {
        circle(cc, 0, 0, size * 0.35);
        cc.fillStyle = PAL.sand;
        cc.fill();
      }
    },
    2
  );
  c.save();
  c.drawImage(s, -size / 2, -size / 2, size, size);
  c.restore();
}
