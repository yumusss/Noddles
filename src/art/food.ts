// Sushi, drawn by hand in code: grains of rice, marbled fish, crinkled nori, glassy tobiko.
// Everything is cached as a sprite per (kind, size), so a full plate costs a few blits.

import type { IngId, PlateId } from '../game/data';
import type { Done, MakiStyle, PieceBody, RiceQ, RollQ, Thick, CutQ } from '../game/plate';
import {
  type Ctx,
  contactShadow,
  darken,
  ellipse,
  lighten,
  lin,
  mix,
  PAL,
  rad,
  rgba,
  rr,
  sheen,
  sprite,
  srand,
  woodGrain,
  speckle,
} from './common';

// ---------- primitives ----------

/** one rice grain with a soft shadow side and a glint */
function grain(c: Ctx, x: number, y: number, len: number, ang: number, tone = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  const w = len * 0.5;
  ellipse(c, 0.25, 0.35, len / 2, w / 2);
  c.fillStyle = rgba('#b9a58a', 0.35);
  c.fill();
  ellipse(c, 0, 0, len / 2, w / 2);
  c.fillStyle = mix('#fffdf7', '#efe4d0', 0.25 + tone * 0.5);
  c.fill();
  c.strokeStyle = rgba('#bba98c', 0.6);
  c.lineWidth = Math.max(0.35, len * 0.06);
  c.stroke();
  ellipse(c, -len * 0.12, -w * 0.15, len * 0.22, w * 0.14);
  c.fillStyle = 'rgba(255,255,255,0.9)';
  c.fill();
  c.restore();
}

/** a heap of rice grains filling an ellipse (cx,cy,rx,ry) */
export function riceBed(
  c: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number,
  density = 1,
  grainLen = 0
) {
  const r = srand(seed);
  const L = grainLen || Math.max(2.2, Math.min(rx, ry) * 0.2);
  // body
  ellipse(c, cx, cy, rx, ry);
  c.fillStyle = rad(c, cx - rx * 0.3, cy - ry * 0.4, 0, Math.max(rx, ry) * 1.2, [
    [0, '#fffdf6'],
    [0.6, '#f3ead9'],
    [1, '#dccbb0'],
  ]);
  c.fill();
  const n = Math.floor(((rx * ry) / (L * L)) * 3.1 * density);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * d * 0.98;
    const y = cy + Math.sin(a) * ry * d * 0.98;
    // grains toward the bottom/right are shaded
    const tone = Math.max(0, ((x - cx) / rx) * 0.25 + ((y - cy) / ry) * 0.45);
    grain(c, x, y, L * (0.85 + r() * 0.3), r() * Math.PI, tone);
  }
  // bumpy edge grains
  const edge = Math.floor((rx + ry) / (L * 0.55));
  for (let i = 0; i < edge; i++) {
    const a = (i / edge) * Math.PI * 2 + r() * 0.2;
    grain(
      c,
      cx + Math.cos(a) * rx * 1.0,
      cy + Math.sin(a) * ry * 1.0,
      L * 0.95,
      a + Math.PI / 2 + (r() - 0.5),
      Math.max(0, Math.sin(a)) * 0.5
    );
  }
}

const FISH: Record<string, { a: string; b: string; fat?: string; gloss: number }> = {
  salmon: { a: '#f07c48', b: '#fba274', fat: '#ffe6d2', gloss: 0.55 },
  tuna: { a: '#b8283a', b: '#de4a55', fat: '#f08a8e', gloss: 0.5 },
  tamago: { a: '#f2c654', b: '#fbe08a', gloss: 0.25 },
  unagi: { a: '#7a3f1f', b: '#a8622f', gloss: 0.7 },
};

/** a fish slice (top view, slightly draped): length along x */
/** butterflied cooked shrimp: white flesh with coral stripes and a red tail fan */
function ebiSlice(c: Ctx, len: number, wid: number, seed: number) {
  const hl = len / 2;
  const hw = wid / 2;
  const body = () => {
    c.beginPath();
    c.moveTo(-hl * 0.95, 0);
    c.bezierCurveTo(-hl * 0.9, -hw * 1.2, hl * 0.55, -hw * 1.15, hl * 0.72, -hw * 0.25);
    c.lineTo(hl * 0.72, hw * 0.25);
    c.bezierCurveTo(hl * 0.55, hw * 1.15, -hl * 0.9, hw * 1.2, -hl * 0.95, 0);
    c.closePath();
  };
  // tail fan
  c.save();
  c.translate(hl * 0.7, 0);
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(hl * 0.25, s * hw * 0.9, hl * 0.42, s * hw * 0.75);
    c.quadraticCurveTo(hl * 0.3, s * hw * 0.2, 0, 0);
    c.fillStyle = lin(c, 0, 0, hl * 0.4, 0, [
      [0, '#f0663f'],
      [1, '#c43a22'],
    ]);
    c.fill();
  }
  c.restore();
  body();
  c.fillStyle = lin(c, 0, -hw, 0, hw, [
    [0, '#fff8f0'],
    [1, '#f3dfd0'],
  ]);
  c.fill();
  c.save();
  body();
  c.clip();
  const r = srand(seed);
  for (let i = 0; i < 6; i++) {
    const x = -hl * 0.75 + i * hl * 0.27 + (r() - 0.5) * 2;
    c.beginPath();
    c.moveTo(x, -hw * 1.3);
    c.quadraticCurveTo(x + hl * 0.08, 0, x, hw * 1.3);
    c.strokeStyle = 'rgba(240,110,70,0.85)';
    c.lineWidth = hl * 0.1;
    c.stroke();
    c.strokeStyle = 'rgba(255,170,130,0.6)';
    c.lineWidth = hl * 0.04;
    c.stroke();
  }
  // the butterflied centre line
  c.beginPath();
  c.moveTo(-hl * 0.9, 0);
  c.quadraticCurveTo(0, hw * 0.08, hl * 0.7, 0);
  c.strokeStyle = 'rgba(200,150,130,0.5)';
  c.lineWidth = 1;
  c.stroke();
  c.restore();
  body();
  c.strokeStyle = 'rgba(190,110,80,0.5)';
  c.lineWidth = 0.7;
  c.stroke();
  sheen(c, -hl * 0.2, -hw * 0.45, hl * 0.4, hw * 0.16, 0.5);
}

/** torch marks on top of a slice (aburi) */
export function aburiMarks(c: Ctx, len: number, wid: number, level: Done, seed: number) {
  const r = srand(seed + 77);
  const hl = len / 2;
  const hw = wid / 2;
  const strength = level === 'raw' ? 0.25 : level === 'done' ? 0.6 : level === 'over' ? 0.85 : 1;
  c.save();
  ellipse(c, 0, -hw * 0.1, hl * 0.95, hw * 0.95);
  c.clip();
  const g = c.createLinearGradient(0, -hw, 0, hw);
  g.addColorStop(0, `rgba(120,55,20,${0.55 * strength})`);
  g.addColorStop(1, `rgba(200,110,50,${0.15 * strength})`);
  c.fillStyle = g;
  c.fillRect(-hl, -hw * 1.2, len, wid * 1.2);
  for (let i = 0; i < 14; i++) {
    ellipse(
      c,
      -hl * 0.85 + r() * len * 0.85,
      -hw * 0.6 + r() * hw,
      1.5 + r() * hl * 0.12,
      1 + r() * hw * 0.2,
      r()
    );
    c.fillStyle =
      level === 'burnt' ? 'rgba(30,18,12,0.85)' : `rgba(90,40,15,${0.35 + 0.4 * strength})`;
    c.fill();
  }
  if (level !== 'burnt') sheen(c, -hl * 0.2, -hw * 0.4, hl * 0.5, hw * 0.15, 0.55);
  c.restore();
}

function fishSlice(
  c: Ctx,
  fish: IngId,
  len: number,
  wid: number,
  seed: number,
  opts: { thick?: number; done?: Done; curve?: number } = {}
) {
  const r = srand(seed);
  if (fish === 'ebi') return ebiSlice(c, len, wid, seed);
  const f = FISH[fish] ?? FISH.salmon;
  const th = opts.thick ?? wid * 0.18;
  const curve = opts.curve ?? 0.12;
  const hl = len / 2;
  const hw = wid / 2;
  const shape = (dy = 0) => {
    c.beginPath();
    c.moveTo(-hl, -hw * 0.55 + dy);
    c.bezierCurveTo(
      -hl * 0.6,
      -hw * (1.05 + curve),
      hl * 0.6,
      -hw * (1.05 + curve),
      hl,
      -hw * 0.45 + dy
    );
    c.bezierCurveTo(hl * 1.06, -hw * 0.1 + dy, hl * 1.04, hw * 0.55 + dy, hl * 0.9, hw * 0.7 + dy);
    c.bezierCurveTo(
      hl * 0.4,
      hw * (1.0 + curve) + dy,
      -hl * 0.4,
      hw * (1.0 + curve) + dy,
      -hl * 0.92,
      hw * 0.75 + dy
    );
    c.bezierCurveTo(-hl * 1.05, hw * 0.5 + dy, -hl * 1.06, -hw * 0.2 + dy, -hl, -hw * 0.55 + dy);
    c.closePath();
  };
  if (fish === 'tamago') {
    // layered omelette block
    const h = th * 2.2;
    rr(c, -hl, -hw + h * 0.2, len, wid, wid * 0.12);
    c.fillStyle = darken(f.a, 0.15);
    c.fill();
    rr(c, -hl, -hw, len, wid - h * 0.15, wid * 0.12);
    c.fillStyle = lin(c, 0, -hw, 0, hw, [
      [0, '#e3a33f'],
      [0.12, f.b],
      [1, f.a],
    ]);
    c.fill();
    for (let i = 1; i < 5; i++) {
      c.strokeStyle = rgba('#c98d2e', 0.35);
      c.lineWidth = 0.6;
      c.beginPath();
      const yy = -hw + (wid * i) / 5;
      c.moveTo(-hl + 2, yy + Math.sin(i) * 0.5);
      c.quadraticCurveTo(0, yy + (r() - 0.5) * 1.2, hl - 2, yy);
      c.stroke();
    }
    // browned top spots
    for (let i = 0; i < 6; i++) {
      ellipse(c, -hl + r() * len, -hw + r() * wid * 0.35, 2 + r() * 3, 1 + r());
      c.fillStyle = rgba('#c47a2a', 0.18);
      c.fill();
    }
    sheen(c, -hl * 0.3, -hw * 0.3, len * 0.35, wid * 0.18, 0.35);
    return;
  }
  // underside thickness
  shape(th);
  c.fillStyle = darken(f.a, fish === 'unagi' ? 0.35 : 0.2);
  c.fill();
  shape(0);
  c.save();
  c.clip();
  c.fillStyle = lin(c, -hl, -hw, hl, hw, [
    [0, f.b],
    [0.55, f.a],
    [1, darken(f.a, 0.12)],
  ]);
  c.fillRect(-hl * 1.2, -hw * 1.4, len * 1.2, wid * 1.6);
  if (fish === 'salmon' || fish === 'tuna') {
    // marbling: soft diagonal fat stripes
    const stripes = fish === 'salmon' ? 6 : 4;
    for (let i = 0; i < stripes; i++) {
      const x0 = -hl + (len * (i + 0.6)) / stripes + (r() - 0.5) * 3;
      const w = wid * (fish === 'salmon' ? 0.05 + r() * 0.05 : 0.025 + r() * 0.03);
      c.strokeStyle = rgba(f.fat!, fish === 'salmon' ? 0.75 : 0.35);
      c.lineWidth = w;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x0 - wid * 0.25, -hw * 1.1);
      c.bezierCurveTo(
        x0 + wid * 0.15,
        -hw * 0.3,
        x0 - wid * 0.2,
        hw * 0.3,
        x0 + wid * 0.2,
        hw * 1.2
      );
      c.stroke();
      c.strokeStyle = rgba('#ffffff', 0.25);
      c.lineWidth = w * 0.35;
      c.stroke();
    }
  }
  if (fish === 'unagi') {
    // grill marks and glaze
    const done = opts.done;
    const dark = done === 'over' ? 0.25 : done === 'raw' ? -0.25 : 0;
    c.fillStyle = rgba('#3b1a08', 0.35 + dark);
    for (let i = 0; i < 4; i++) {
      const x0 = -hl + (len * (i + 0.6)) / 4;
      c.beginPath();
      c.ellipse(x0, 0, len * 0.025, wid * 0.55, 0.35, 0, Math.PI * 2);
      c.fill();
    }
    if (done === 'raw') {
      c.fillStyle = rgba('#e7c0a0', 0.55);
      c.fillRect(-hl, -hw, len, wid * 2);
    }
    // skin edge
    c.fillStyle = rgba('#3a2a1c', 0.5);
    c.fillRect(-hl, hw * 0.6, len, wid);
  }
  c.restore();
  // edge definition, warm and thin
  shape(0);
  c.strokeStyle = rgba(darken(f.a, 0.3), 0.45);
  c.lineWidth = 0.7;
  c.stroke();
  // wet gloss
  sheen(c, -hl * 0.25, -hw * 0.45, len * 0.38, wid * 0.16, f.gloss, -0.08);
  sheen(c, hl * 0.45, -hw * 0.1, len * 0.1, wid * 0.08, f.gloss * 0.9);
  for (let i = 0; i < 4; i++) {
    ellipse(c, -hl * 0.6 + r() * len * 0.9, -hw * 0.5 + r() * wid * 0.8, 0.5 + r() * 0.7, 0.4);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.fill();
  }
}

/** nori sheet texture fill inside the current path bounds */
function noriFill(c: Ctx, x: number, y: number, w: number, h: number, seed: number) {
  const r = srand(seed);
  c.fillStyle = lin(c, x, y, x + w, y + h, [
    [0, '#3c4a38'],
    [0.5, PAL.nori],
    [1, '#232b20'],
  ]);
  c.fillRect(x, y, w, h);
  // crinkles and fibres
  for (let i = 0; i < (w * h) / 40; i++) {
    c.strokeStyle = rgba(r() < 0.5 ? '#5d7050' : '#151a13', 0.25 + r() * 0.25);
    c.lineWidth = 0.4 + r() * 0.6;
    const px = x + r() * w;
    const py = y + r() * h;
    c.beginPath();
    c.moveTo(px, py);
    c.quadraticCurveTo(
      px + (r() - 0.5) * 6,
      py + (r() - 0.5) * 6,
      px + (r() - 0.5) * 10,
      py + (r() - 0.5) * 4
    );
    c.stroke();
  }
  for (let i = 0; i < (w * h) / 120; i++) {
    c.fillStyle = rgba('#8aa070', 0.15);
    c.fillRect(x + r() * w, y + r() * h, 1, 1);
  }
}

function tobikoDots(
  c: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  seed: number,
  rr0 = 1.3
) {
  const r = srand(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    const s = rr0 * (0.8 + r() * 0.4);
    c.beginPath();
    c.arc(x, y, s, 0, Math.PI * 2);
    c.fillStyle = rad(c, x - s * 0.35, y - s * 0.35, 0, s * 1.1, [
      [0, '#ffd49a'],
      [0.35, '#ff8a2a'],
      [1, '#c8420e'],
    ]);
    c.fill();
    c.beginPath();
    c.arc(x - s * 0.35, y - s * 0.38, s * 0.28, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.fill();
  }
}

function sesameSeeds(
  c: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  seed: number,
  len = 2.2
) {
  const r = srand(seed);
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * d;
    const y = cy + Math.sin(a) * ry * d;
    const black = r() < 0.3;
    ellipse(c, x, y, len / 2, len / 4, r() * Math.PI);
    c.fillStyle = black ? '#3a2e28' : '#f1dcae';
    c.fill();
    c.strokeStyle = black ? '#1e1814' : rgba('#b08a52', 0.8);
    c.lineWidth = 0.3;
    c.stroke();
  }
}

function drizzle(c: Ctx, w: number, seed: number, col: string, hi: string, y = 0, lw = 1.6) {
  const r = srand(seed);
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // a smooth, slightly irregular wave like sauce from a squeeze bottle
  const amp = w * 0.11;
  const waves = 2.5 + r();
  const ph = r() * 6;
  c.beginPath();
  for (let i = 0; i <= 28; i++) {
    const k = i / 28;
    const x = -w / 2 + w * k;
    const yy = y + Math.sin(k * Math.PI * 2 * waves + ph) * amp * (0.8 + 0.2 * Math.sin(k * 7));
    if (i === 0) c.moveTo(x, yy);
    else c.lineTo(x, yy);
  }
  c.strokeStyle = rgba(darken(col, 0.35), 0.35);
  c.lineWidth = lw * 1.6;
  c.translate(0, lw * 0.4);
  c.stroke();
  c.translate(0, -lw * 0.4);
  c.strokeStyle = col;
  c.lineWidth = lw * 1.25;
  c.stroke();
  c.strokeStyle = hi;
  c.lineWidth = lw * 0.35;
  c.translate(-lw * 0.2, -lw * 0.35);
  c.stroke();
  c.restore();
}

function scallionRings(
  c: Ctx,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  seed: number,
  s = 1.8
) {
  const r = srand(seed);
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - 0.5) * rx * 2;
    const y = cy + (r() - 0.5) * ry * 2;
    ellipse(c, x, y, s, s * 0.8, r());
    c.fillStyle = '#9ccc6a';
    c.fill();
    ellipse(c, x, y, s * 0.55, s * 0.4, r());
    c.fillStyle = '#e6f5c6';
    c.fill();
  }
}

/** toppings layered on top of a piece, within a w×h footprint centered at (0,y) */
export function toppings(c: Ctx, tops: IngId[], w: number, h: number, seed: number, y = 0) {
  for (const t of tops) {
    switch (t) {
      case 'sesame':
        sesameSeeds(c, 0, y, w * 0.4, h * 0.35, 14, seed + 3, Math.max(1.6, w * 0.07));
        break;
      case 'tobiko':
        tobikoDots(c, 0, y - h * 0.05, w * 0.22, h * 0.2, 16, seed + 5, Math.max(1, w * 0.045));
        break;
      case 'scallion':
        scallionRings(c, 0, y, w * 0.25, h * 0.18, 6, seed + 7, Math.max(1.3, w * 0.06));
        break;
      case 'spicymayo':
        drizzle(
          c,
          w * 0.8,
          seed + 9,
          '#f08a5d',
          'rgba(255,235,210,0.9)',
          y,
          Math.max(1.2, w * 0.06)
        );
        break;
      case 'unagisauce':
        drizzle(
          c,
          w * 0.8,
          seed + 11,
          '#5a2a12',
          'rgba(255,220,180,0.7)',
          y + h * 0.1,
          Math.max(1.2, w * 0.06)
        );
        break;
    }
  }
}

// ---------- pieces ----------

const RICE_SCALE: Record<RiceQ, number> = { less: 0.78, just: 1, more: 1.25 };

export function drawNigiri(
  c: Ctx,
  u: number,
  p: { rice: RiceQ; neta?: IngId; band?: boolean; done?: Done; tops: IngId[]; aburi?: Done },
  seed: number
) {
  const k = RICE_SCALE[p.rice];
  const rw = u * 0.092 * k;
  const rh = u * 0.06 * k;
  contactShadow(c, 0, rh * 0.95, rw * 1.3, rh * 0.62, 0.38);
  // the mound has height: a shaded lower layer, then the top
  riceBed(c, 0, rh * 0.28, rw, rh * 0.85, seed + 40, 0.7, u * 0.0135);
  c.fillStyle = 'rgba(150,120,90,0.12)';
  ellipse(c, 0, rh * 0.28, rw, rh * 0.85);
  c.fill();
  riceBed(c, 0, 0, rw * 0.96, rh * 0.8, seed, 1, u * 0.0135);
  if (p.neta) {
    c.save();
    c.translate(0, -rh * 0.62);
    fishSlice(c, p.neta, u * 0.215, u * 0.082, seed + 1, { done: p.done, thick: u * 0.013 });
    if (p.aburi) aburiMarks(c, u * 0.215, u * 0.082, p.aburi, seed);
    if (p.band) {
      // nori belt wrapped over the middle
      c.save();
      c.beginPath();
      c.moveTo(-u * 0.018, -u * 0.05);
      c.lineTo(u * 0.018, -u * 0.05);
      c.lineTo(u * 0.02, u * 0.07);
      c.lineTo(-u * 0.02, u * 0.07);
      c.closePath();
      c.clip();
      noriFill(c, -u * 0.03, -u * 0.06, u * 0.06, u * 0.14, seed + 2);
      c.restore();
    }
    toppings(c, p.tops, u * 0.17, u * 0.07, seed, -u * 0.005);
    c.restore();
  } else if (p.tops.length) toppings(c, p.tops, rw * 1.6, rh * 1.4, seed);
}

const FILL_COL: Partial<Record<IngId, string>> = {
  cucumber: '#7fb35d',
  avocado: '#c9d98a',
  salmon: '#f58a55',
  tuna: '#cc3442',
  crab: '#f26b5b',
  creamcheese: '#fbf7ee',
  tamago: '#f4cc5c',
  tempura: '#e4a547',
  unagi: '#8a4a24',
  ebi: '#f6a184',
};

function fillingChunk(c: Ctx, f: IngId, x: number, y: number, s: number, seed: number) {
  const r = srand(seed);
  const col = FILL_COL[f] ?? '#ccc';
  switch (f) {
    case 'cucumber': {
      rr(c, x - s * 0.5, y - s * 0.5, s, s, s * 0.15);
      c.fillStyle = '#3f7a32';
      c.fill();
      rr(c, x - s * 0.38, y - s * 0.38, s * 0.76, s * 0.76, s * 0.12);
      c.fillStyle = lin(c, x, y - s, x, y + s, [
        [0, '#d8eeb0'],
        [1, '#a9d07a'],
      ]);
      c.fill();
      for (let i = 0; i < 3; i++) {
        ellipse(c, x + (r() - 0.5) * s * 0.4, y + (r() - 0.5) * s * 0.3, s * 0.08, s * 0.05, r());
        c.fillStyle = rgba('#f8fbe8', 0.9);
        c.fill();
      }
      break;
    }
    case 'avocado': {
      c.beginPath();
      c.ellipse(x, y, s * 0.6, s * 0.38, r() - 0.5, 0, Math.PI * 2);
      c.fillStyle = rad(c, x, y, 0, s * 0.6, [
        [0, '#e7eeb0'],
        [0.75, '#bcd27a'],
        [1, '#4f7a30'],
      ]);
      c.fill();
      break;
    }
    case 'crab': {
      rr(c, x - s * 0.55, y - s * 0.3, s * 1.1, s * 0.6, s * 0.25);
      c.fillStyle = '#fff5ee';
      c.fill();
      rr(c, x - s * 0.55, y - s * 0.3, s * 1.1, s * 0.25, s * 0.2);
      c.fillStyle = col;
      c.fill();
      break;
    }
    case 'creamcheese': {
      rr(c, x - s * 0.45, y - s * 0.35, s * 0.9, s * 0.7, s * 0.2);
      c.fillStyle = lin(c, x, y - s, x, y + s, [
        [0, '#ffffff'],
        [1, '#e9dcc6'],
      ]);
      c.fill();
      c.strokeStyle = rgba('#b9a07a', 0.55);
      c.lineWidth = Math.max(0.6, s * 0.04);
      c.stroke();
      break;
    }
    case 'tempura': {
      ellipse(c, x, y, s * 0.6, s * 0.48);
      c.fillStyle = rad(c, x - s * 0.2, y - s * 0.2, 0, s * 0.7, [
        [0, '#f8d58a'],
        [1, '#c78630'],
      ]);
      c.fill();
      for (let i = 0; i < 9; i++) {
        ellipse(c, x + (r() - 0.5) * s, y + (r() - 0.5) * s * 0.8, s * 0.1, s * 0.07);
        c.fillStyle = rgba('#fff0c6', 0.7);
        c.fill();
      }
      ellipse(c, x, y, s * 0.22, s * 0.18);
      c.fillStyle = '#f6a18a';
      c.fill();
      break;
    }
    default: {
      rr(c, x - s * 0.48, y - s * 0.4, s * 0.96, s * 0.8, s * 0.18);
      c.fillStyle = lin(c, x - s, y - s, x + s, y + s, [
        [0, lighten(col, 0.18)],
        [1, darken(col, 0.08)],
      ]);
      c.fill();
      if (f === 'salmon') {
        c.strokeStyle = rgba('#ffe6d2', 0.8);
        c.lineWidth = s * 0.08;
        c.beginPath();
        c.moveTo(x - s * 0.3, y - s * 0.4);
        c.lineTo(x - s * 0.05, y + s * 0.4);
        c.moveTo(x + s * 0.15, y - s * 0.4);
        c.lineTo(x + s * 0.35, y + s * 0.4);
        c.stroke();
      }
      sheen(c, x - s * 0.15, y - s * 0.2, s * 0.3, s * 0.12, 0.45);
    }
  }
}

/** a cut slice of maki seen from the cut face (3/4 view) */
export function drawMakiSlice(
  c: Ctx,
  u: number,
  p: {
    style: MakiStyle;
    fill: IngId[];
    coat?: IngId;
    roll: RollQ;
    cut: CutQ;
    rice: RiceQ;
    idx: number;
    tops: IngId[];
  },
  seed: number
) {
  const big = p.style === 'futo' ? 1.3 : p.style === 'ura' ? 1.15 : 0.9;
  const R = u * 0.06 * big;
  const squash = p.roll === 'squashed' ? 0.75 : 1;
  const rx = R * (p.roll === 'squashed' ? 1.18 : 1);
  const ry = R * 0.82 * squash;
  const side = u * 0.035 * (p.cut === 'crooked' ? 1.4 : 1);
  const tilt = p.cut === 'crooked' ? ((seed % 2) - 0.5) * 0.35 : 0;
  const r = srand(seed);
  contactShadow(c, 0, side + ry * 0.5, rx * 1.25, ry * 0.55, 0.35);
  c.save();
  c.rotate(tilt * 0.4);
  // cylinder side
  const outer = p.style === 'ura' ? '#f3ead9' : PAL.nori;
  c.beginPath();
  c.ellipse(0, side, rx, ry, 0, 0, Math.PI);
  c.lineTo(-rx, 0);
  c.ellipse(0, 0, rx, ry, 0, Math.PI, 0, true);
  c.closePath();
  if (p.style === 'ura') {
    c.fillStyle = lin(c, -rx, 0, rx, 0, [
      [0, '#e6dac4'],
      [0.5, '#fffaf0'],
      [1, '#d7c7ab'],
    ]);
    c.fill();
    c.save();
    c.clip();
    if (p.coat === 'tobiko') tobikoDots(c, 0, side * 0.6, rx, side, 26, seed + 4, u * 0.0055);
    else if (p.coat === 'sesame') sesameSeeds(c, 0, side * 0.6, rx, side, 22, seed + 4, u * 0.008);
    else
      for (let i = 0; i < 18; i++)
        grain(c, -rx + r() * rx * 2, r() * side * 1.4, u * 0.013, r() * 3, 0.3);
    c.restore();
  } else {
    c.save();
    c.clip();
    noriFill(c, -rx, -2, rx * 2, side + ry + 4, seed + 1);
    c.restore();
    sheen(c, -rx * 0.45, side * 0.6, rx * 0.25, side * 0.5, 0.18);
  }
  // cut face
  ellipse(c, 0, 0, rx, ry);
  c.fillStyle = outer;
  c.fill();
  if (p.style === 'ura') {
    riceBed(c, 0, 0, rx * 0.98, ry * 0.98, seed + 2, 0.9, u * 0.012);
    if (p.coat === 'tobiko') {
      c.save();
      ellipse(c, 0, 0, rx, ry);
      c.clip();
      c.lineWidth = 0;
      for (let i = 0; i < 30; i++) {
        const a = (i / 30) * Math.PI * 2;
        tobikoDots(
          c,
          Math.cos(a) * rx * 0.96,
          Math.sin(a) * ry * 0.96,
          1.2,
          1.2,
          1,
          seed + i,
          u * 0.0055
        );
      }
      c.restore();
    } else if (p.coat === 'sesame') {
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * Math.PI * 2 + r() * 0.2;
        sesameSeeds(
          c,
          Math.cos(a) * rx * 0.93,
          Math.sin(a) * ry * 0.93,
          1,
          1,
          1,
          seed + i,
          u * 0.008
        );
      }
    }
    // inner nori ring
    ellipse(c, 0, 0, rx * 0.58, ry * 0.58);
    c.strokeStyle = PAL.nori;
    c.lineWidth = u * 0.006;
    c.stroke();
  } else {
    // nori ring then rice
    ellipse(c, 0, 0, rx, ry);
    c.fillStyle = rad(c, -rx * 0.3, -ry * 0.3, 0, rx * 1.2, [
      [0, '#46553f'],
      [1, PAL.nori],
    ]);
    c.fill();
    riceBed(
      c,
      0,
      0,
      rx * 0.86,
      ry * 0.86,
      seed + 2,
      0.9,
      u * (p.style === 'hoso' ? 0.0105 : 0.012)
    );
  }
  // fillings in the middle
  const inner = p.style === 'ura' ? 0.5 : p.style === 'futo' ? 0.62 : 0.42;
  const fs = R * (p.style === 'hoso' ? 0.55 : 0.42);
  const loose = p.roll === 'loose';
  const n = p.fill.length;
  p.fill.forEach((f, i) => {
    const a = n === 1 ? 0 : (i / n) * Math.PI * 2 + 0.4;
    const d = n === 1 ? 0 : rx * inner * 0.45;
    const jx = loose ? (r() - 0.5) * rx * 0.4 : 0;
    const jy = loose ? (r() - 0.5) * ry * 0.4 : 0;
    fillingChunk(c, f, Math.cos(a) * d + jx, Math.sin(a) * d * 0.82 + jy, fs, seed + 10 + i);
  });
  if (loose) {
    // gaps where the roll opened
    for (let i = 0; i < 3; i++) {
      const a = r() * Math.PI * 2;
      ellipse(c, Math.cos(a) * rx * 0.6, Math.sin(a) * ry * 0.6, rx * 0.12, ry * 0.08, a);
      c.fillStyle = rgba('#5a4636', 0.4);
      c.fill();
    }
    // a grain or two fallen off
    for (let i = 0; i < 4; i++)
      grain(c, (r() - 0.5) * rx * 2.6, side + ry * 0.4 + r() * 4, u * 0.012, r() * 3, 0.2);
  }
  // rim definition
  ellipse(c, 0, 0, rx, ry);
  c.strokeStyle = rgba('#3a2a1e', 0.25);
  c.lineWidth = 0.6;
  c.stroke();
  toppings(c, p.tops, rx * 1.6, ry * 1.2, seed + 30, -ry * 0.05);
  c.restore();
}

const THICK_W: Record<Thick, number> = { thin: 0.55, normal: 0.85, thick: 1.25 };
export function drawSashimi(
  c: Ctx,
  u: number,
  p: { fish: IngId; thick: Thick; cut: CutQ; idx: number },
  seed: number
) {
  const w = u * 0.075 * THICK_W[p.thick];
  const len = u * 0.17;
  contactShadow(c, 0, w * 0.55, len * 0.6, w * 0.5, 0.32);
  c.save();
  c.rotate(p.cut === 'crooked' ? 0.35 * ((seed % 3) - 1) : -0.08);
  if (p.cut === 'crooked') c.transform(1, 0.18, -0.12, 1, 0, 0);
  fishSlice(c, p.fish, len, w, seed, { thick: Math.max(1.5, w * 0.35), curve: 0.25 });
  c.restore();
}

export function drawTemaki(
  c: Ctx,
  u: number,
  p: { fill: IngId[]; rice: RiceQ; done?: Done; tops: IngId[] },
  seed: number
) {
  const L = u * 0.3;
  const W = u * 0.15;
  const r = srand(seed);
  contactShadow(c, 0, W * 0.4, L * 0.55, W * 0.35, 0.35);
  c.save();
  c.rotate(-0.25);
  // filling spilling from the open top (left)
  const top = -L * 0.32;
  riceBed(c, top + W * 0.08, -W * 0.05, W * 0.46, W * 0.4, seed + 1, 0.9, u * 0.012);
  p.fill.forEach((f, i) => {
    const a = -1.2 + i * 1.1;
    fillingChunk(
      c,
      f,
      top - W * 0.05 + Math.cos(a) * W * 0.18,
      Math.sin(a) * W * 0.22 - W * 0.1,
      W * 0.36,
      seed + 5 + i
    );
  });
  // cone
  c.beginPath();
  c.moveTo(top + W * 0.25, -W * 0.5);
  c.quadraticCurveTo(L * 0.25, -W * 0.25, L * 0.55, W * 0.08);
  c.quadraticCurveTo(L * 0.25, W * 0.45, top + W * 0.22, W * 0.5);
  c.quadraticCurveTo(top + W * 0.52, 0, top + W * 0.25, -W * 0.5);
  c.closePath();
  c.save();
  c.clip();
  noriFill(c, top, -W * 0.6, L, W * 1.2, seed + 2);
  // wrap fold line
  c.strokeStyle = rgba('#5e7052', 0.6);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(top + W * 0.5, -W * 0.4);
  c.quadraticCurveTo(L * 0.2, W * 0.05, L * 0.5, W * 0.06);
  c.stroke();
  c.restore();
  sheen(c, L * 0.05, -W * 0.18, L * 0.2, W * 0.06, 0.18, 0.3);
  c.restore();
  void r;
  toppings(c, p.tops, W * 0.9, W * 0.6, seed + 9, -W * 0.15);
}

export function drawSide(c: Ctx, u: number, ing: IngId, seed: number) {
  const r = srand(seed);
  if (ing === 'wasabi') {
    const s = u * 0.052;
    contactShadow(c, 0, s * 0.5, s * 1.4, s * 0.55, 0.3);
    // a soft piped dollop with ridges
    for (let i = 3; i >= 0; i--) {
      ellipse(c, 0, -i * s * 0.28, s * (1 - i * 0.2), s * (0.6 - i * 0.1));
      c.fillStyle = rad(c, -s * 0.3, -i * s * 0.3 - s * 0.2, 0, s * 1.2, [
        [0, '#d6eaa0'],
        [0.6, '#9cc25a'],
        [1, '#6e9a3b'],
      ]);
      c.fill();
    }
    for (let i = 0; i < 12; i++) {
      c.fillStyle = rgba('#5a7e2e', 0.5);
      c.fillRect((r() - 0.5) * s * 1.4, (r() - 0.8) * s * 0.9, 0.7, 0.7);
    }
    sheen(c, -s * 0.25, -s * 0.85, s * 0.3, s * 0.12, 0.6);
    return;
  }
  if (ing === 'ginger') {
    const s = u * 0.068;
    contactShadow(c, 0, s * 0.35, s * 1.2, s * 0.45, 0.25);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + r();
      c.save();
      c.translate(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.2 - i * 0.6);
      c.rotate(a);
      c.beginPath();
      c.ellipse(0, 0, s * 0.55, s * 0.28, 0, 0, Math.PI * 2);
      c.fillStyle = rgba(i % 2 ? '#f6b8a8' : '#f9cdbd', 0.85);
      c.fill();
      c.strokeStyle = rgba('#e39a87', 0.8);
      c.lineWidth = 0.5;
      c.stroke();
      sheen(c, -s * 0.1, -s * 0.08, s * 0.25, s * 0.06, 0.5);
      c.restore();
    }
    return;
  }
  if (ing === 'soy') {
    const s = u * 0.065;
    contactShadow(c, 0, s * 0.35, s * 1.15, s * 0.5, 0.35);
    ellipse(c, 0, s * 0.12, s, s * 0.52);
    c.fillStyle = '#d9d3c4';
    c.fill();
    ellipse(c, 0, 0, s, s * 0.5);
    c.fillStyle = lin(c, -s, 0, s, 0, [
      [0, '#ffffff'],
      [1, '#e4ddcd'],
    ]);
    c.fill();
    ellipse(c, 0, s * 0.04, s * 0.84, s * 0.4);
    c.fillStyle = rad(c, -s * 0.3, -s * 0.1, 0, s, [
      [0, '#6b3a1c'],
      [0.5, '#3e1d0c'],
      [1, '#2a1206'],
    ]);
    c.fill();
    sheen(c, -s * 0.35, -s * 0.06, s * 0.3, s * 0.08, 0.55);
    ellipse(c, 0, 0, s, s * 0.5);
    c.strokeStyle = rgba('#5872a8', 0.6);
    c.lineWidth = 1;
    c.stroke();
  }
}

/** draws any piece body at the origin; cached */
export function drawPiece(c: Ctx, u: number, p: PieceBody & { tops: IngId[] }, seed: number) {
  const key = 'pc:' + pieceKey(p) + ':' + (seed % 7) + ':' + Math.round(u);
  const S = u * 0.34;
  sprite(
    c,
    key,
    S * 2,
    S * 2,
    S,
    S,
    (cc) => {
      switch (p.kind) {
        case 'nigiri':
          drawNigiri(cc, u, p, seed % 7);
          break;
        case 'maki':
          drawMakiSlice(cc, u, p, seed % 7);
          break;
        case 'sashimi':
          drawSashimi(cc, u, p, seed % 7);
          break;
        case 'temaki':
          drawTemaki(cc, u, p, seed % 7);
          break;
        case 'side':
          drawSide(cc, u, p.ing, seed % 7);
          break;
      }
    },
    0,
    0
  );
}

function pieceKey(p: PieceBody & { tops: IngId[] }): string {
  const t = p.tops.join('+');
  switch (p.kind) {
    case 'nigiri':
      return `n.${p.rice}.${p.neta ?? '-'}.${p.band ? 1 : 0}.${p.done ?? ''}.${p.aburi ?? ''}.${t}`;
    case 'maki':
      return `m.${p.style}.${p.fill.join('+')}.${p.coat ?? ''}.${p.roll}.${p.cut}.${p.rice}.${t}`;
    case 'sashimi':
      return `s.${p.fish}.${p.thick}.${p.cut}`;
    case 'temaki':
      return `t.${p.fill.join('+')}.${p.rice}.${t}`;
    case 'side':
      return `d.${p.ing}`;
  }
}

// ---------- plates ----------

/** plate size: u = width in logical px. Origin at plate center. */
export function drawPlate(c: Ctx, id: PlateId, u: number) {
  sprite(
    c,
    `plate:${id}:${Math.round(u)}`,
    u * 1.3,
    u * 0.9,
    u * 0.65,
    u * 0.42,
    (cc) => plateBody(cc, id, u),
    0,
    0
  );
}

function plateBody(c: Ctx, id: PlateId, u: number) {
  const w = u;
  const h = u * 0.6;
  switch (id) {
    case 'geta': {
      contactShadow(c, 0, h * 0.42, w * 0.58, h * 0.22, 0.4);
      // feet
      c.fillStyle = '#a87a4e';
      rr(c, -w * 0.38, h * 0.22, w * 0.1, h * 0.2, 3);
      c.fill();
      rr(c, w * 0.28, h * 0.22, w * 0.1, h * 0.2, 3);
      c.fill();
      // board edge
      rr(c, -w / 2, -h / 2 + 6, w, h, 10);
      c.fillStyle = '#b9895a';
      c.fill();
      c.save();
      rr(c, -w / 2, -h / 2, w, h, 10);
      c.clip();
      woodGrain(c, -w / 2, -h / 2, w, h, '#e2bb8a', 11, { strength: 0.9 });
      c.fillStyle = lin(c, 0, -h / 2, 0, h / 2, [
        [0, 'rgba(255,255,255,0.18)'],
        [1, 'rgba(120,70,30,0.12)'],
      ]);
      c.fillRect(-w / 2, -h / 2, w, h);
      c.restore();
      rr(c, -w / 2, -h / 2, w, h, 10);
      c.strokeStyle = rgba('#8a5a32', 0.5);
      c.lineWidth = 1.2;
      c.stroke();
      break;
    }
    case 'slate': {
      contactShadow(c, 0, h * 0.32, w * 0.6, h * 0.24, 0.45);
      const path = () => {
        c.beginPath();
        c.moveTo(-w * 0.5, -h * 0.46);
        c.lineTo(w * 0.47, -h * 0.5);
        c.lineTo(w * 0.51, h * 0.42);
        c.lineTo(-w * 0.48, h * 0.47);
        c.closePath();
      };
      c.save();
      c.translate(0, 5);
      path();
      c.fillStyle = '#2f3236';
      c.fill();
      c.restore();
      path();
      c.fillStyle = lin(c, -w / 2, -h / 2, w / 2, h / 2, [
        [0, '#5b6168'],
        [0.5, '#474c53'],
        [1, '#3a3e44'],
      ]);
      c.fill();
      c.save();
      path();
      c.clip();
      speckle(c, -w / 2, -h / 2, w, h, '#9aa2ab', 400, 21, 0.25);
      for (let i = 0; i < 6; i++) {
        c.strokeStyle = rgba('#8e959d', 0.15);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(-w / 2, -h * 0.4 + i * h * 0.16);
        c.lineTo(w / 2, -h * 0.45 + i * h * 0.17);
        c.stroke();
      }
      c.restore();
      break;
    }
    case 'porcelain': {
      contactShadow(c, 0, h * 0.3, w * 0.56, h * 0.26, 0.35);
      ellipse(c, 0, 5, w * 0.52, h * 0.52);
      c.fillStyle = '#d8d6d0';
      c.fill();
      ellipse(c, 0, 0, w * 0.52, h * 0.52);
      c.fillStyle = lin(c, -w / 2, -h / 2, w / 2, h / 2, [
        [0, '#ffffff'],
        [1, '#ece9e2'],
      ]);
      c.fill();
      // indigo rim pattern
      ellipse(c, 0, 0, w * 0.47, h * 0.46);
      c.strokeStyle = rgba('#3f5592', 0.9);
      c.lineWidth = 2;
      c.stroke();
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const x = Math.cos(a) * w * 0.495;
        const y = Math.sin(a) * h * 0.49;
        c.beginPath();
        c.arc(x, y, 2.2, 0, Math.PI * 2);
        c.fillStyle = rgba('#4a64a8', 0.75);
        c.fill();
      }
      ellipse(c, 0, 0, w * 0.4, h * 0.38);
      c.fillStyle = rad(c, -w * 0.1, -h * 0.1, 0, w * 0.45, [
        [0, 'rgba(255,255,255,0.7)'],
        [1, 'rgba(230,226,218,0.2)'],
      ]);
      c.fill();
      break;
    }
    case 'celadon': {
      contactShadow(c, 0, h * 0.3, w * 0.56, h * 0.26, 0.35);
      ellipse(c, 0, 0, w * 0.52, h * 0.52);
      c.fillStyle = lin(c, 0, -h / 2, 0, h / 2, [
        [0, '#cfe3cf'],
        [1, '#9fc0a4'],
      ]);
      c.fill();
      break;
    }
    case 'sakura': {
      contactShadow(c, 0, h * 0.3, w * 0.56, h * 0.26, 0.35);
      ellipse(c, 0, 0, w * 0.52, h * 0.52);
      c.fillStyle = '#fbe6ea';
      c.fill();
      break;
    }
    case 'box': {
      // kraft takeout box with a lid hinge
      contactShadow(c, 0, h * 0.42, w * 0.58, h * 0.2, 0.4);
      rr(c, -w * 0.5, -h * 0.46 + 8, w, h * 0.92, 8);
      c.fillStyle = '#a97c50';
      c.fill();
      rr(c, -w * 0.5, -h * 0.46, w, h * 0.92, 8);
      c.fillStyle = lin(c, 0, -h / 2, 0, h / 2, [
        [0, '#dcb486'],
        [1, '#c99d6c'],
      ]);
      c.fill();
      speckle(c, -w * 0.5, -h * 0.46, w, h * 0.92, '#7a5532', 300, 5, 0.18);
      rr(c, -w * 0.46, -h * 0.42, w * 0.92, h * 0.84, 6);
      c.fillStyle = '#2c2420';
      c.fill();
      rr(c, -w * 0.45, -h * 0.41, w * 0.9, h * 0.82, 5);
      c.fillStyle = lin(c, 0, -h / 2, 0, h / 2, [
        [0, '#3a302a'],
        [1, '#241d19'],
      ]);
      c.fill();
      // a little leaf divider
      c.fillStyle = rgba('#6aa04f', 0.9);
      c.beginPath();
      c.ellipse(w * 0.36, -h * 0.28, w * 0.07, h * 0.04, -0.6, 0, Math.PI * 2);
      c.fill();
      break;
    }
  }
}

/** plate-local bounds for tap mapping, x,y as fraction of width */
export const PLATE_ASPECT = 0.6;

// ---------- raw/prepared ingredient art for tubs and chips ----------

export function drawIngredient(c: Ctx, ing: IngId, s: number, seed = 1, done?: Done) {
  const r = srand(seed);
  switch (ing) {
    case 'rice':
      riceBed(c, 0, 0, s * 0.42, s * 0.26, seed, 1, s * 0.07);
      return;
    case 'salmon':
    case 'tuna':
    case 'unagi':
      for (let i = 2; i >= 0; i--) {
        c.save();
        c.translate((i - 1) * s * 0.08, (i - 1) * s * 0.12);
        c.rotate(-0.1 + i * 0.05);
        fishSlice(c, ing, s * 0.7, s * 0.3, seed + i, { done, thick: s * 0.04 });
        c.restore();
      }
      return;
    case 'ebi':
      for (let i = 2; i >= 0; i--) {
        c.save();
        c.translate((i - 1) * s * 0.06, (i - 1) * s * 0.13);
        c.rotate(-0.08 + i * 0.05);
        ebiSlice(c, s * 0.68, s * 0.28, seed + i);
        c.restore();
      }
      return;
    case 'tamago':
      for (let i = 1; i >= 0; i--) {
        c.save();
        c.translate(0, (i - 0.5) * s * 0.2);
        fishSlice(c, 'tamago', s * 0.6, s * 0.26, seed + i, { thick: s * 0.04 });
        c.restore();
      }
      return;
    case 'wasabi':
      drawSide(c, s * 7, 'wasabi', seed);
      return;
    case 'ginger':
      drawSide(c, s * 5.5, 'ginger', seed);
      return;
    case 'soy': {
      // a little bottle
      rr(c, -s * 0.14, -s * 0.3, s * 0.28, s * 0.56, s * 0.1);
      c.fillStyle = lin(c, -s * 0.14, 0, s * 0.14, 0, [
        [0, '#5a2c14'],
        [0.4, '#7c4220'],
        [1, '#3a1a0a'],
      ]);
      c.fill();
      rr(c, -s * 0.07, -s * 0.42, s * 0.14, s * 0.14, 3);
      c.fillStyle = '#c7372f';
      c.fill();
      rr(c, -s * 0.12, -s * 0.12, s * 0.24, s * 0.16, 2);
      c.fillStyle = '#f5ecd8';
      c.fill();
      sheen(c, -s * 0.06, -s * 0.1, s * 0.03, s * 0.18, 0.5);
      return;
    }
    case 'nori':
      rr(c, -s * 0.36, -s * 0.28, s * 0.72, s * 0.56, 3);
      c.save();
      c.clip();
      noriFill(c, -s * 0.4, -s * 0.3, s * 0.8, s * 0.6, seed);
      c.restore();
      return;
    case 'noriband':
      for (let i = 0; i < 4; i++) {
        c.save();
        c.translate((i - 1.5) * s * 0.14, 0);
        c.rotate((r() - 0.5) * 0.2);
        rr(c, -s * 0.05, -s * 0.3, s * 0.1, s * 0.6, 2);
        c.clip();
        noriFill(c, -s * 0.1, -s * 0.35, s * 0.2, s * 0.7, seed + i);
        c.restore();
      }
      return;
    case 'cucumber':
    case 'avocado':
    case 'crab':
    case 'creamcheese':
    case 'tempura':
      for (let i = 0; i < 5; i++)
        fillingChunk(c, ing, (r() - 0.5) * s * 0.5, (r() - 0.5) * s * 0.35, s * 0.3, seed + i);
      if (ing === 'tempura') {
        // a crunchy shrimp with its tail
        c.save();
        c.rotate(-0.4);
        ellipse(c, 0, 0, s * 0.36, s * 0.13);
        c.fillStyle = rad(c, -s * 0.1, -s * 0.05, 0, s * 0.4, [
          [0, done === 'over' ? '#c98a3a' : done === 'raw' ? '#f5e0b0' : '#f7d088'],
          [1, done === 'over' ? '#8a5216' : done === 'raw' ? '#e8c890' : '#c9862e'],
        ]);
        c.fill();
        c.beginPath();
        c.moveTo(s * 0.32, 0);
        c.lineTo(s * 0.46, -s * 0.1);
        c.lineTo(s * 0.44, s * 0.1);
        c.closePath();
        c.fillStyle = '#e8644a';
        c.fill();
        c.restore();
      }
      return;
    case 'sesame':
      sesameSeeds(c, 0, 0, s * 0.36, s * 0.22, 60, seed, s * 0.06);
      return;
    case 'tobiko':
      tobikoDots(c, 0, 0, s * 0.34, s * 0.22, 70, seed, s * 0.035);
      return;
    case 'scallion':
      scallionRings(c, 0, 0, s * 0.32, s * 0.2, 26, seed, s * 0.045);
      return;
    case 'spicymayo':
    case 'unagisauce': {
      const col = ing === 'spicymayo' ? '#f08a5d' : '#4a200c';
      ellipse(c, 0, 0, s * 0.36, s * 0.22);
      c.fillStyle = rad(c, -s * 0.1, -s * 0.06, 0, s * 0.4, [
        [0, lighten(col, 0.3)],
        [1, col],
      ]);
      c.fill();
      c.strokeStyle = rgba(lighten(col, 0.4), 0.7);
      c.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(0, 0, s * (0.08 + i * 0.08), 0.3, 2.4);
        c.stroke();
      }
      sheen(c, -s * 0.12, -s * 0.08, s * 0.12, s * 0.05, 0.7);
      return;
    }
    case 'shrimp':
      for (let i = 0; i < 3; i++) {
        c.save();
        c.translate((i - 1) * s * 0.24, (i % 2) * s * 0.08 - s * 0.04);
        c.rotate(-0.5 + i * 0.3);
        // curled body, segment by segment, tail last
        for (let k = 0; k < 6; k++) {
          const a = Math.PI * 0.9 - k * 0.32;
          const rr0 = s * (0.13 - k * 0.012);
          ellipse(
            c,
            Math.cos(a) * s * 0.1,
            Math.sin(a) * s * 0.1,
            rr0 * 0.75,
            rr0 * 0.55,
            a + Math.PI / 2
          );
          c.fillStyle = rad(c, 0, -s * 0.05, 0, s * 0.25, [
            [0, '#fde3d6'],
            [1, '#f2a28c'],
          ]);
          c.fill();
          c.strokeStyle = rgba('#e0806a', 0.6);
          c.lineWidth = 0.6;
          c.stroke();
        }
        c.beginPath();
        const ta = Math.PI * 0.9 - 6 * 0.32;
        const tx0 = Math.cos(ta) * s * 0.1;
        const ty0 = Math.sin(ta) * s * 0.1;
        c.moveTo(tx0, ty0);
        c.lineTo(tx0 + s * 0.1, ty0 - s * 0.07);
        c.lineTo(tx0 + s * 0.09, ty0 + s * 0.06);
        c.closePath();
        c.fillStyle = '#e8644a';
        c.fill();
        c.restore();
      }
      return;
    case 'eel':
      for (let i = 0; i < 3; i++) {
        c.save();
        c.translate(0, (i - 1) * s * 0.16);
        c.rotate(-0.12 + i * 0.06);
        rr(c, -s * 0.38, -s * 0.09, s * 0.76, s * 0.2, s * 0.08);
        c.fillStyle = '#4a3a2c';
        c.fill();
        rr(c, -s * 0.38, -s * 0.11, s * 0.76, s * 0.16, s * 0.08);
        c.fillStyle = lin(c, 0, -s * 0.11, 0, s * 0.05, [
          [0, '#f7eadb'],
          [1, '#e2c7ab'],
        ]);
        c.fill();
        for (let k = 0; k < 5; k++) {
          c.strokeStyle = rgba('#c9a585', 0.6);
          c.lineWidth = 0.6;
          c.beginPath();
          c.moveTo(-s * 0.3 + k * s * 0.15, -s * 0.1);
          c.lineTo(-s * 0.34 + k * s * 0.15, s * 0.04);
          c.stroke();
        }
        sheen(c, -s * 0.1, -s * 0.07, s * 0.2, s * 0.03, 0.6);
        c.restore();
      }
      return;
  }
}

/** a tiny plate silhouette for the rack buttons */
export function drawPlateMini(c: Ctx, id: PlateId, s: number) {
  c.save();
  c.scale(s / 100, s / 100);
  plateBody(c, id, 100);
  c.restore();
}

/** colour that represents an ingredient (chips, labels) */
export function ingColor(i: IngId): string {
  return (
    FILL_COL[i] ??
    (
      {
        rice: '#f4ead6',
        wasabi: '#9cc25a',
        ginger: '#f6b8a8',
        soy: '#5a2c14',
        sesame: '#e8d1a0',
        tobiko: '#ff8a2a',
        scallion: '#9ccc6a',
        spicymayo: '#f08a5d',
        unagisauce: '#5a2a12',
        noriband: PAL.nori,
        nori: PAL.nori,
        shrimp: '#f6b2a0',
        eel: '#8a6a4a',
      } as Partial<Record<IngId, string>>
    )[i] ??
    '#ccc'
  );
}
