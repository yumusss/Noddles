// Kamado station: a cosy, dark kitchen nook with a traditional clay stove and
// a wood fire. Static nook is cached in a sprite; fire, glow, sparks and
// shimmer are animated cheaply every frame.
import {
  type Ctx,
  type Tod,
  PAL,
  TOD_LIGHT,
  shade,
  rgba,
  rng,
  roundRect,
  ellipse,
  circle,
  softShadow,
  vGrad,
  speckle,
  sprite,
  blit,
  clamp,
} from './common';
import { ParticleSystem } from './fx';

export interface KamadoLayout {
  bowl: { x: number; y: number; size: number };
  ring: { x: number; y: number; r: number };
  timer: { x: number; y: number; r: number };
  /** clay body geometry (derived; used by the drawers) */
  body: { x: number; y: number; w: number; h: number };
  floorY: number;
}

const TAU = Math.PI * 2;

export function kamadoLayout(W: number, H: number): KamadoLayout {
  if (W >= H) {
    const bodyW = Math.min(560, W * 0.46);
    const floorY = H * 0.78;
    const top = H * 0.4;
    const cx = W * 0.5;
    const body = { x: cx - bodyW / 2, y: top, w: bodyW, h: H - top - 10 };
    const ringR = bodyW * 0.3;
    return {
      bowl: { x: cx, y: top - 6, size: 300 },
      ring: { x: cx, y: top + 4, r: ringR },
      timer: { x: W - 150, y: H * 0.58, r: 92 },
      body,
      floorY,
    };
  }
  const bodyW = Math.min(520, W * 0.7);
  const top = H * 0.47;
  const cx = W / 2;
  const floorY = H * 0.78;
  const body = { x: cx - bodyW / 2, y: top, w: bodyW, h: H - top - 10 };
  return {
    bowl: { x: cx, y: top - 6, size: 280 },
    ring: { x: cx, y: top + 4, r: bodyW * 0.3 },
    timer: { x: cx, y: H * 0.17, r: 96 },
    body,
    floorY,
  };
}

// ---------------------------------------------------------------- static nook

function paintNook(c: Ctx, W: number, H: number, tod: Tod, L: KamadoLayout) {
  const land = W >= H;
  const floorY = L.floorY;
  // ---- back wall: dark warm plaster with brick courses
  c.fillStyle = '#4a3630';
  c.fillRect(0, 0, W, H);
  const wg = c.createLinearGradient(0, 0, 0, floorY);
  wg.addColorStop(0, '#3d2b27');
  wg.addColorStop(0.6, '#5a4139');
  wg.addColorStop(1, '#6a4d41');
  c.fillStyle = wg;
  c.fillRect(0, 0, W, floorY);
  // bricks
  const bh = land ? 34 : 38;
  const bw = bh * 2.3;
  const r = rng(404);
  for (let row = 0, y = -bh / 2; y < floorY; row++, y += bh) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -bw + off; x < W + bw; x += bw) {
      const v = r();
      const base = v < 0.2 ? '#6b4a3d' : v < 0.5 ? '#5f4337' : '#664839';
      const tone = (r() - 0.5) * 0.1;
      c.fillStyle = shade(base, tone);
      roundRect(c, x + 2, y + 2, bw - 4, bh - 4, 3);
      c.fill();
      c.fillStyle = 'rgba(255,220,190,0.06)';
      roundRect(c, x + 4, y + 3, bw - 8, 4, 2);
      c.fill();
    }
  }
  speckle(c, 0, 0, W, floorY, 12, 1400, 'rgba(0,0,0,0.08)');
  speckle(c, 0, 0, W, floorY, 13, 500, 'rgba(255,230,200,0.05)');
  // darker at the top & corners
  const vg = c.createRadialGradient(W / 2, floorY, Math.min(W, H) * 0.2, W / 2, floorY * 0.6, Math.max(W, H) * 0.85);
  vg.addColorStop(0, 'rgba(20,10,8,0)');
  vg.addColorStop(1, 'rgba(20,10,8,0.6)');
  c.fillStyle = vg;
  c.fillRect(0, 0, W, floorY);

  // ---- window slit (time of day)
  const sky = TOD_LIGHT[tod].sky;
  const win = land ? { x: W * 0.12, y: H * 0.12, w: 150, h: 230 } : { x: W * 0.08, y: H * 0.09, w: 120, h: 190 };
  // deep frame
  c.fillStyle = '#2b1d19';
  roundRect(c, win.x - 12, win.y - 12, win.w + 24, win.h + 24, 8);
  c.fill();
  const sg = c.createLinearGradient(0, win.y, 0, win.y + win.h);
  sg.addColorStop(0, sky[0]);
  sg.addColorStop(1, sky[1]);
  c.fillStyle = sg;
  roundRect(c, win.x, win.y, win.w, win.h, 4);
  c.fill();
  // distant hill + a little tree silhouette
  c.fillStyle = tod === 'aksam' ? 'rgba(30,30,60,0.6)' : 'rgba(111,143,102,0.45)';
  c.beginPath();
  c.moveTo(win.x, win.y + win.h);
  c.quadraticCurveTo(win.x + win.w * 0.3, win.y + win.h * 0.72, win.x + win.w * 0.6, win.y + win.h * 0.8);
  c.quadraticCurveTo(win.x + win.w * 0.85, win.y + win.h * 0.86, win.x + win.w, win.y + win.h * 0.78);
  c.lineTo(win.x + win.w, win.y + win.h);
  c.closePath();
  c.fill();
  if (tod === 'aksam') {
    c.fillStyle = '#fff3c8';
    circle(c, win.x + win.w * 0.68, win.y + win.h * 0.22, 11);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    const sr = rng(8);
    for (let i = 0; i < 14; i++) {
      circle(c, win.x + sr() * win.w, win.y + sr() * win.h * 0.6, 0.8 + sr());
      c.fill();
    }
  } else if (tod === 'gunbatimi') {
    const sun = c.createRadialGradient(win.x + win.w * 0.4, win.y + win.h * 0.62, 2, win.x + win.w * 0.4, win.y + win.h * 0.62, 40);
    sun.addColorStop(0, 'rgba(255,240,200,0.95)');
    sun.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = sun;
    c.fillRect(win.x, win.y, win.w, win.h);
  }
  // mullions
  c.fillStyle = '#2b1d19';
  c.fillRect(win.x + win.w / 2 - 3, win.y, 6, win.h);
  c.fillRect(win.x, win.y + win.h * 0.38 - 3, win.w, 6);
  // sill + light spill on wall
  c.fillStyle = '#5a3f33';
  roundRect(c, win.x - 18, win.y + win.h + 10, win.w + 36, 10, 3);
  c.fill();
  const spill = c.createLinearGradient(win.x, 0, win.x + win.w * 2.2, 0);
  spill.addColorStop(0, rgba(sky[1], 0.16));
  spill.addColorStop(1, rgba(sky[1], 0));
  c.fillStyle = spill;
  c.fillRect(win.x, win.y - 10, win.w * 2.2, win.h + 60);

  // ---- hanging rail with ladle, cloth, bamboo steamer (right side)
  const railY = land ? H * 0.11 : H * 0.3;
  const rx0 = land ? W * 0.74 : W * 0.55;
  const rx1 = land ? W * 0.97 : W * 0.95;
  c.strokeStyle = '#2b2522';
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(rx0, railY);
  c.lineTo(rx1, railY);
  c.stroke();
  for (const hx of [rx0 + 8, rx1 - 8]) {
    c.beginPath();
    c.moveTo(hx, railY);
    c.lineTo(hx, railY - 26);
    c.stroke();
  }
  // ladle
  {
    const lx = rx0 + (rx1 - rx0) * 0.22;
    c.strokeStyle = shade(PAL.walnut, -0.1);
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(lx, railY + 6);
    c.lineTo(lx + 6, railY + 110);
    c.stroke();
    c.strokeStyle = '#2b2522';
    c.lineWidth = 2;
    circle(c, lx, railY + 2, 6);
    c.stroke();
    const bg = c.createRadialGradient(lx + 2, railY + 118, 2, lx + 6, railY + 124, 26);
    bg.addColorStop(0, '#f0ebe3');
    bg.addColorStop(0.6, '#b9b2a8');
    bg.addColorStop(1, '#7e766d');
    c.fillStyle = bg;
    ellipse(c, lx + 6, railY + 126, 24, 18);
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.3)';
    c.lineWidth = 1.5;
    c.stroke();
  }
  // cloth
  {
    const cxp = rx0 + (rx1 - rx0) * 0.5;
    const cw = 64;
    const ch = 120;
    c.fillStyle = vGrad(c, railY, railY + ch, shade(PAL.blush, 0.1), shade(PAL.blush, -0.12));
    c.beginPath();
    c.moveTo(cxp - cw / 2, railY + 2);
    c.lineTo(cxp + cw / 2, railY + 2);
    c.quadraticCurveTo(cxp + cw / 2 + 6, railY + ch * 0.6, cxp + cw / 2 - 6, railY + ch);
    c.quadraticCurveTo(cxp, railY + ch + 10, cxp - cw / 2 + 4, railY + ch);
    c.quadraticCurveTo(cxp - cw / 2 - 8, railY + ch * 0.5, cxp - cw / 2, railY + 2);
    c.closePath();
    c.fill();
    c.save();
    c.clip();
    c.strokeStyle = 'rgba(217,87,63,0.3)';
    c.lineWidth = 3;
    for (let k = 0; k < 5; k++) {
      c.beginPath();
      c.moveTo(cxp - cw, railY + 16 + k * 24);
      c.lineTo(cxp + cw, railY + 16 + k * 24);
      c.stroke();
    }
    for (let k = -1; k < 4; k++) {
      c.beginPath();
      c.moveTo(cxp - cw / 2 + k * 20 + 6, railY);
      c.lineTo(cxp - cw / 2 + k * 20 + 2, railY + ch + 10);
      c.stroke();
    }
    const fold = c.createLinearGradient(cxp - cw / 2, 0, cxp + cw / 2, 0);
    fold.addColorStop(0, 'rgba(60,35,20,0.25)');
    fold.addColorStop(0.3, 'rgba(255,255,255,0.15)');
    fold.addColorStop(0.6, 'rgba(60,35,20,0.1)');
    fold.addColorStop(1, 'rgba(60,35,20,0.3)');
    c.fillStyle = fold;
    c.fillRect(cxp - cw, railY, cw * 2, ch + 20);
    c.restore();
    c.strokeStyle = 'rgba(60,35,20,0.35)';
    c.lineWidth = 1.2;
    c.stroke();
  }
  // bamboo steamer hanging
  {
    const sx = rx0 + (rx1 - rx0) * 0.82;
    const sr = 40;
    c.strokeStyle = '#2b2522';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(sx, railY);
    c.lineTo(sx, railY + 30);
    c.stroke();
    softShadow(c, sx, railY + 30 + sr + 8, sr, sr * 0.3, 0.35);
    c.fillStyle = vGrad(c, railY + 30, railY + 30 + sr * 2, shade(PAL.latte, 0.1), shade(PAL.latte, -0.25));
    circle(c, sx, railY + 30 + sr, sr);
    c.fill();
    c.strokeStyle = 'rgba(60,35,20,0.4)';
    c.lineWidth = 2;
    c.stroke();
    circle(c, sx, railY + 30 + sr, sr * 0.78);
    c.fillStyle = shade(PAL.latte, -0.05);
    c.fill();
    c.stroke();
    // woven lattice
    c.save();
    circle(c, sx, railY + 30 + sr, sr * 0.76);
    c.clip();
    c.strokeStyle = 'rgba(110,75,50,0.35)';
    c.lineWidth = 2.5;
    for (let k = -sr; k <= sr; k += 9) {
      c.beginPath();
      c.moveTo(sx + k, railY + 30);
      c.lineTo(sx + k, railY + 30 + sr * 2);
      c.stroke();
      c.beginPath();
      c.moveTo(sx - sr, railY + 30 + sr + k);
      c.lineTo(sx + sr, railY + 30 + sr + k);
      c.stroke();
    }
    c.restore();
    c.strokeStyle = 'rgba(60,35,20,0.4)';
    c.lineWidth = 3;
    circle(c, sx, railY + 30 + sr, sr * 0.9);
    c.stroke();
  }

  // ---- floor: dark stone tiles
  const fg = c.createLinearGradient(0, floorY, 0, H);
  fg.addColorStop(0, '#4a3f3a');
  fg.addColorStop(1, '#2e2624');
  c.fillStyle = fg;
  c.fillRect(0, floorY, W, H - floorY);
  const fr = rng(99);
  const tw = land ? 120 : 110;
  const th = (H - floorY) / 2;
  for (let row = 0; row < 2; row++) {
    for (let x = -tw + (row ? tw / 2 : 0); x < W + tw; x += tw) {
      c.fillStyle = shade('#4f433d', (fr() - 0.5) * 0.14 - row * 0.1);
      roundRect(c, x + 3, floorY + row * th + 3, tw - 6, th - 6, 6);
      c.fill();
    }
  }
  speckle(c, 0, floorY, W, H - floorY, 44, 600, 'rgba(0,0,0,0.12)');
  // wall/floor junction shadow
  c.fillStyle = vGrad(c, floorY - 2, floorY + 30, 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0)');
  c.fillRect(0, floorY - 2, W, 32);

  // ---- firewood stack (left of kamado)
  {
    const B = L.body;
    const wx = land ? B.x - 150 : Math.max(8, B.x - 110);
    const baseY = H - 24;
    const logs: [number, number, number][] = [
      [0, 0, 26],
      [52, 0, 25],
      [104, 0, 26],
      [26, -42, 24],
      [78, -42, 25],
      [52, -82, 23],
    ];
    for (const [ox, oy, lr] of logs) {
      const lx = wx + ox + lr;
      const ly = baseY + oy - lr;
      softShadow(c, lx, ly + lr, lr * 1.1, lr * 0.3, 0.35);
      // bark side (ellipse body offset) then cut face
      c.fillStyle = shade(PAL.walnut, -0.2);
      ellipse(c, lx + 6, ly + 3, lr, lr);
      c.fill();
      const cg = c.createRadialGradient(lx, ly, 0, lx, ly, lr);
      cg.addColorStop(0, shade(PAL.sand, 0.1));
      cg.addColorStop(0.7, PAL.latte);
      cg.addColorStop(1, shade(PAL.woodDark, -0.1));
      c.fillStyle = cg;
      circle(c, lx, ly, lr);
      c.fill();
      c.strokeStyle = 'rgba(110,75,50,0.4)';
      c.lineWidth = 1.2;
      for (let k = 1; k <= 4; k++) {
        circle(c, lx + (k % 2) * 1.5, ly, lr * (k / 5));
        c.stroke();
      }
      c.strokeStyle = 'rgba(60,35,20,0.5)';
      c.lineWidth = 2;
      circle(c, lx, ly, lr);
      c.stroke();
      // bark crack
      c.beginPath();
      c.moveTo(lx + lr * 0.2, ly - lr * 0.8);
      c.lineTo(lx + lr * 0.6, ly - lr * 0.1);
      c.stroke();
    }
  }

  // ---- kamado body
  drawClayBody(c, L, land);
}

function drawClayBody(c: Ctx, L: KamadoLayout, land: boolean) {
  const B = L.body;
  const cx = B.x + B.w / 2;
  const top = B.y;
  const bottom = B.y + B.h;
  const ringR = L.ring.r;
  const wTop = ringR * 2 + 36; // shoulder width

  // floor shadow
  softShadow(c, cx, bottom - 4, B.w * 0.62, 26, 0.5);

  // body silhouette: rounded barrel, wider in the middle, slightly narrower at the foot
  const path = () => {
    c.beginPath();
    c.moveTo(cx - wTop / 2, top + 10);
    c.bezierCurveTo(cx - B.w * 0.55, top + B.h * 0.1, cx - B.w * 0.5, bottom - B.h * 0.25, cx - B.w * 0.42, bottom - 16);
    c.quadraticCurveTo(cx - B.w * 0.4, bottom, cx - B.w * 0.36, bottom);
    c.lineTo(cx + B.w * 0.36, bottom);
    c.quadraticCurveTo(cx + B.w * 0.4, bottom, cx + B.w * 0.42, bottom - 16);
    c.bezierCurveTo(cx + B.w * 0.5, bottom - B.h * 0.25, cx + B.w * 0.55, top + B.h * 0.1, cx + wTop / 2, top + 10);
    c.closePath();
  };
  path();
  const cg = c.createLinearGradient(B.x, 0, B.x + B.w, 0);
  cg.addColorStop(0, '#9a6f55');
  cg.addColorStop(0.25, '#d9b08f');
  cg.addColorStop(0.5, '#ead3b8');
  cg.addColorStop(0.78, '#c99a78');
  cg.addColorStop(1, '#8a6048');
  c.fillStyle = cg;
  c.fill();
  c.save();
  c.clip();
  // vertical shading (darker toward foot)
  c.fillStyle = vGrad(c, top, bottom, 'rgba(255,240,220,0.18)', 'rgba(60,30,15,0.35)');
  c.fillRect(B.x - 40, top, B.w + 80, B.h);
  // clay texture
  speckle(c, B.x - 40, top, B.w + 80, B.h, 21, 900, 'rgba(90,50,30,0.08)');
  speckle(c, B.x - 40, top, B.w + 80, B.h, 22, 400, 'rgba(255,240,220,0.12)');
  // horizontal subtle bands (hand-built coils)
  c.strokeStyle = 'rgba(90,50,30,0.12)';
  c.lineWidth = 2;
  for (let k = 1; k < 6; k++) {
    const yy = top + B.h * (0.18 + k * 0.12);
    c.beginPath();
    c.moveTo(B.x - 40, yy);
    c.quadraticCurveTo(cx, yy + 10, B.x + B.w + 40, yy);
    c.stroke();
  }
  // soot near the mouth
  const mouth = mouthRect(L, land);
  const soot = c.createRadialGradient(mouth.x + mouth.w / 2, mouth.y + mouth.h * 0.4, mouth.w * 0.3, mouth.x + mouth.w / 2, mouth.y + mouth.h * 0.4, mouth.w * 1.1);
  soot.addColorStop(0, 'rgba(30,15,10,0.55)');
  soot.addColorStop(1, 'rgba(30,15,10,0)');
  c.fillStyle = soot;
  c.fillRect(B.x - 40, top, B.w + 80, B.h);
  c.restore();
  // outline
  c.strokeStyle = 'rgba(40,20,10,0.45)';
  c.lineWidth = 2;
  path();
  c.stroke();

  // mouth (fire opening): dark arch with a thick clay lip
  {
    const m = mouth;
    const arch = (dx: number, dy: number) => {
      c.beginPath();
      c.moveTo(m.x - dx, m.y + m.h + dy);
      c.lineTo(m.x - dx, m.y + m.h * 0.45);
      c.quadraticCurveTo(m.x - dx, m.y - dy, m.x + m.w / 2, m.y - dy);
      c.quadraticCurveTo(m.x + m.w + dx, m.y - dy, m.x + m.w + dx, m.y + m.h * 0.45);
      c.lineTo(m.x + m.w + dx, m.y + m.h + dy);
      c.closePath();
    };
    arch(12, 6);
    c.fillStyle = vGrad(c, m.y - 6, m.y + m.h, '#6b4a3a', '#3c251c');
    c.fill();
    c.strokeStyle = 'rgba(40,20,10,0.5)';
    c.lineWidth = 2;
    c.stroke();
    arch(0, 0);
    c.fillStyle = '#1a0d09';
    c.fill();
    // iron grate bars at the bottom of the mouth
    c.strokeStyle = '#2a2320';
    c.lineWidth = 4;
    for (let k = 0; k < 4; k++) {
      const gy = m.y + m.h * (0.72 + k * 0.08);
      c.beginPath();
      c.moveTo(m.x + 4, gy);
      c.lineTo(m.x + m.w - 4, gy);
      c.stroke();
    }
  }

  // top plate + iron ring
  {
    const ry = L.ring.y;
    const R = ringR;
    // clay shoulder ellipse
    ellipse(c, cx, ry + 6, wTop / 2, 30);
    c.fillStyle = vGrad(c, ry - 24, ry + 36, '#e6cdb2', '#b78c6c');
    c.fill();
    c.strokeStyle = 'rgba(40,20,10,0.4)';
    c.lineWidth = 2;
    c.stroke();
    // iron ring: dark, with bevel
    ellipse(c, cx, ry, R + 10, (R + 10) * 0.36);
    c.fillStyle = vGrad(c, ry - 18, ry + 18, '#5a5250', '#2a2320');
    c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.5)';
    c.lineWidth = 2;
    c.stroke();
    ellipse(c, cx, ry, R - 2, (R - 2) * 0.36);
    c.fillStyle = '#17100d';
    c.fill();
    // inner glow (fire below seen through the hole) — a soft orange radial
    const ig = c.createRadialGradient(cx, ry, 2, cx, ry, R);
    ig.addColorStop(0, 'rgba(255,120,40,0.45)');
    ig.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = ig;
    ellipse(c, cx, ry, R - 2, (R - 2) * 0.36);
    c.fill();
    // ring highlight
    c.strokeStyle = 'rgba(255,255,255,0.14)';
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(cx, ry - 1, R + 5, (R + 5) * 0.36, 0, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
    // trivet feet
    c.fillStyle = '#2a2320';
    for (const a of [0.3, 0.7]) {
      const fx = cx + Math.cos(Math.PI * a) * (R + 2);
      roundRect(c, fx - 6, ry + (R + 10) * 0.36 - 6, 12, 10, 3);
      c.fill();
    }
  }
}

function mouthRect(L: KamadoLayout, land: boolean) {
  const B = L.body;
  const w = land ? B.w * 0.42 : B.w * 0.46;
  const h = B.h * 0.5;
  return { x: B.x + B.w / 2 - w / 2, y: B.y + B.h * 0.28, w, h };
}

// ---------------------------------------------------------------- fire

const EMBER_SEED = rng(777);
const EMBERS = Array.from({ length: 14 }, () => ({ x: EMBER_SEED(), y: EMBER_SEED(), r: 2 + EMBER_SEED() * 4, ph: EMBER_SEED() * TAU }));
const FLAME_PH = Array.from({ length: 6 }, () => EMBER_SEED() * TAU);

function flameShape(c: Ctx, x: number, baseY: number, w: number, h: number, t: number, ph: number) {
  // a wobbling teardrop with 2 side lobes
  const sw = Math.sin(t * 7 + ph) * w * 0.12;
  const sw2 = Math.sin(t * 11 + ph * 2) * w * 0.1;
  const tipX = x + sw * 1.6 + Math.sin(t * 4.3 + ph) * w * 0.18;
  const tipY = baseY - h * (0.92 + 0.08 * Math.sin(t * 9 + ph));
  c.beginPath();
  c.moveTo(x - w / 2, baseY);
  // fat rounded belly, soft tip
  c.bezierCurveTo(x - w * 0.75 - sw2 * 2, baseY - h * 0.45, x - w * 0.05 + sw, baseY - h * 0.8, tipX, tipY);
  c.bezierCurveTo(x + w * 0.1 + sw, baseY - h * 0.8, x + w * 0.75 + sw2 * 2, baseY - h * 0.45, x + w / 2, baseY);
  c.closePath();
}

function drawFire(c: Ctx, L: KamadoLayout, land: boolean, t: number, heat: number) {
  const m = mouthRect(L, land);
  const cx = m.x + m.w / 2;
  const baseY = m.y + m.h * 0.74;
  c.save();
  // clip to the mouth arch
  c.beginPath();
  c.moveTo(m.x, m.y + m.h);
  c.lineTo(m.x, m.y + m.h * 0.45);
  c.quadraticCurveTo(m.x, m.y, cx, m.y);
  c.quadraticCurveTo(m.x + m.w, m.y, m.x + m.w, m.y + m.h * 0.45);
  c.lineTo(m.x + m.w, m.y + m.h);
  c.closePath();
  c.clip();
  // background glow inside the mouth
  const gl = c.createRadialGradient(cx, baseY, 4, cx, baseY, m.w * 0.7);
  const ga = 0.45 + heat * 0.5 + Math.sin(t * 6) * 0.04;
  gl.addColorStop(0, `rgba(255,140,50,${ga})`);
  gl.addColorStop(0.5, `rgba(200,70,30,${ga * 0.5})`);
  gl.addColorStop(1, 'rgba(120,30,20,0)');
  c.fillStyle = gl;
  c.fillRect(m.x, m.y, m.w, m.h);
  // burning logs
  c.lineCap = 'round';
  for (const [dx, dy, ang, len] of [
    [-0.22, 0.02, 0.18, 0.62],
    [0.2, 0.0, -0.22, 0.6],
    [0, -0.06, 0.03, 0.5],
  ] as [number, number, number, number][]) {
    c.save();
    c.translate(cx + dx * m.w, baseY + dy * m.h);
    c.rotate(ang);
    const lg = c.createLinearGradient(0, -8, 0, 8);
    lg.addColorStop(0, '#5b3a28');
    lg.addColorStop(1, '#2a1711');
    c.fillStyle = lg;
    roundRect(c, (-len * m.w) / 2, -8, len * m.w, 16, 8);
    c.fill();
    // glowing cracks
    c.strokeStyle = `rgba(255,${120 + heat * 60},40,${0.5 + heat * 0.5})`;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-len * m.w * 0.3, -2);
    c.lineTo(-len * m.w * 0.1, 3);
    c.lineTo(len * m.w * 0.15, -1);
    c.lineTo(len * m.w * 0.35, 3);
    c.stroke();
    c.restore();
  }
  // embers
  for (let i = 0; i < EMBERS.length; i++) {
    const e = EMBERS[i];
    const pulse = 0.55 + 0.45 * Math.sin(t * 3 + e.ph);
    const a = (0.35 + heat * 0.65) * pulse;
    const ex = m.x + m.w * (0.15 + e.x * 0.7);
    const ey = baseY + 4 + e.y * m.h * 0.14;
    const eg = c.createRadialGradient(ex, ey, 0, ex, ey, e.r * 2.2);
    eg.addColorStop(0, `rgba(255,220,120,${a})`);
    eg.addColorStop(0.4, `rgba(255,120,40,${a * 0.8})`);
    eg.addColorStop(1, 'rgba(255,80,30,0)');
    c.fillStyle = eg;
    circle(c, ex, ey, e.r * 2.2);
    c.fill();
  }
  // flames
  if (heat > 0.05) {
    const n = heat > 0.6 ? 5 : heat > 0.3 ? 4 : 3;
    const hmax = m.h * (0.36 + heat * 0.36);
    const layers: [string, string, string, number][] = [
      ['rgba(200,50,30,0.0)', 'rgba(225,80,40,0.8)', 'rgba(245,130,55,0.95)', 1],
      ['rgba(250,140,50,0.0)', 'rgba(255,170,60,0.9)', 'rgba(255,215,110,1)', 0.66],
      ['rgba(255,220,130,0)', 'rgba(255,240,180,0.95)', 'rgba(255,255,230,1)', 0.36],
    ];
    for (let i = 0; i < n; i++) {
      const fx = cx + (i - (n - 1) / 2) * (m.w * 0.15) + Math.sin(t * 2 + i) * 4;
      const fw = m.w * (0.3 + 0.08 * Math.sin(t * 5 + FLAME_PH[i]));
      const fh = hmax * (0.7 + 0.3 * Math.abs(Math.sin(t * 3.3 + FLAME_PH[i] * 1.7))) * (i === Math.floor(n / 2) ? 1.15 : 0.85);
      for (const [c0, c1, c2, sc] of layers) {
        flameShape(c, fx, baseY + 2, fw * sc, fh * sc, t, FLAME_PH[i] + sc * 3);
        const g = c.createLinearGradient(0, baseY - fh * sc, 0, baseY);
        g.addColorStop(0, c0);
        g.addColorStop(0.45, c1);
        g.addColorStop(1, c2);
        c.fillStyle = g;
        c.fill();
      }
    }
  }
  c.restore();
}

// ---------------------------------------------------------------- public drawers

const sparks = new ParticleSystem();
let lastT = -1;
let sparkAcc = 0;

export function drawKamadoBack(c: Ctx, W: number, H: number, tod: Tod, t: number, o: { heat: number }): void {
  const L = kamadoLayout(W, H);
  const land = W >= H;
  const heat = clamp(o.heat, 0, 1);
  const nook = sprite(`kamado:nook:${W}x${H}:${tod}`, W, H, (g) => paintNook(g, W, H, tod, L), 2);
  c.save();
  blit(c, nook, 0, 0, W, H);
  // fire light on the wall and floor (pulsing)
  const m = mouthRect(L, land);
  const fx = m.x + m.w / 2;
  const fy = m.y + m.h * 0.6;
  const flick = 1 + Math.sin(t * 8.3) * 0.05 + Math.sin(t * 13.7) * 0.03;
  const rad = (Math.min(W, H) * 0.55 + heat * Math.min(W, H) * 0.35) * flick;
  const lg = c.createRadialGradient(fx, fy, 10, fx, fy, rad);
  const la = 0.18 + heat * 0.3;
  lg.addColorStop(0, `rgba(255,150,70,${la})`);
  lg.addColorStop(0.4, `rgba(255,120,50,${la * 0.45})`);
  lg.addColorStop(1, 'rgba(255,100,40,0)');
  c.fillStyle = lg;
  c.fillRect(0, 0, W, H);
  // fire itself
  drawFire(c, L, land, t, heat);
  // light cast onto the clay around the mouth + floor in front
  const mg = c.createRadialGradient(fx, m.y + m.h, 8, fx, m.y + m.h, m.w * 1.3);
  mg.addColorStop(0, `rgba(255,160,70,${(0.25 + heat * 0.3) * flick})`);
  mg.addColorStop(1, 'rgba(255,140,60,0)');
  c.fillStyle = mg;
  c.fillRect(m.x - m.w, m.y, m.w * 3, H - m.y);
  // glow leaking from the top ring onto the bowl's underside is drawn by the game; add a faint hot rim here
  const rg = c.createRadialGradient(L.ring.x, L.ring.y, L.ring.r * 0.5, L.ring.x, L.ring.y, L.ring.r * 1.4);
  rg.addColorStop(0, `rgba(255,140,60,${0.1 + heat * 0.25})`);
  rg.addColorStop(1, 'rgba(255,140,60,0)');
  c.fillStyle = rg;
  ellipse(c, L.ring.x, L.ring.y, L.ring.r * 1.4, L.ring.r * 0.6);
  c.fill();
  c.restore();
}

export function drawKamadoFront(c: Ctx, W: number, H: number, tod: Tod, t: number, o: { heat: number; cooking: boolean }): void {
  const L = kamadoLayout(W, H);
  const land = W >= H;
  const heat = clamp(o.heat, 0, 1);
  const m = mouthRect(L, land);
  // particles: time step from t
  const dt = lastT < 0 ? 1 / 60 : clamp(t - lastT, 0, 0.1);
  lastT = t;
  if (dt > 0) {
    // sparks per second: 3 at embers, ~20 roaring
    sparkAcc += (3 + heat * 17) * dt;
    const n = Math.floor(sparkAcc);
    sparkAcc -= n;
    if (n > 0) sparks.emit('spark', m.x + m.w / 2, m.y + m.h * 0.6, n, m.w * 0.3);
    sparks.update(dt);
  }
  c.save();
  sparks.draw(c);
  // heat shimmer above the ring: faint wavy translucent bands
  if (heat > 0.2) {
    c.save();
    c.globalAlpha *= (heat - 0.2) * 0.35;
    c.strokeStyle = 'rgba(255,230,200,0.5)';
    c.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const yy = L.ring.y - L.ring.r * 0.4 - k * 16 - ((t * 30 + k * 17) % 48);
      const w = L.ring.r * 0.9;
      c.beginPath();
      for (let x = -w; x <= w; x += 8) {
        const py = yy + Math.sin(x * 0.08 + t * 6 + k) * 3;
        if (x === -w) c.moveTo(L.ring.x + x, py);
        else c.lineTo(L.ring.x + x, py);
      }
      c.stroke();
    }
    c.restore();
  }
  // warm tint over everything (bottom-weighted), stronger when cooking
  const tl = TOD_LIGHT[tod];
  const tint = c.createLinearGradient(0, 0, 0, H);
  tint.addColorStop(0, `rgba(255,150,80,${0.02 + heat * 0.03})`);
  tint.addColorStop(1, `rgba(255,140,70,${0.08 + heat * 0.1 + (o.cooking ? 0.03 : 0)})`);
  c.fillStyle = tint;
  c.fillRect(0, 0, W, H);
  if (tod === 'aksam') {
    c.fillStyle = rgba(tl.tint, 0.1);
    c.fillRect(0, 0, W, H);
  }
  // vignette
  const vg = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.45, W / 2, H * 0.55, Math.max(W, H) * 0.8);
  vg.addColorStop(0, 'rgba(20,10,8,0)');
  vg.addColorStop(1, 'rgba(20,10,8,0.45)');
  c.fillStyle = vg;
  c.fillRect(0, 0, W, H);
  c.restore();
}
