// Mochi, the shop cat: a round brown-and-white tabby, drawn procedurally.
// Static body parts per pose are cached as sprites; only the tail, legs, eyes
// (blink) and the sleeping "breath" are animated per frame.
import { circle, ellipse, roundRect, softShadow, sprite, type Ctx } from './common';

export type CatPose = 'sit' | 'walk' | 'loaf' | 'sleep' | 'stretch';

const FUR = '#c08f63';
const STRIPE = '#7b5236';
const WHITE = '#fff8ef';
const WHITE_D = '#eadbc8';
const EYE = '#e3a63a';
const NOSE = '#f0a0a6';
const OUT = 'rgba(60,35,20,0.28)';
const EAR_IN = '#f4bfb8';

// Drawing happens in "cat units": a 100-wide box, ground at y = 0, up is negative.
const U = 60; // body height of the sitting pose in units

function outline(c: Ctx) {
  c.strokeStyle = OUT;
  c.lineWidth = 1.2;
  c.stroke();
}

/** Tabby back stripes along a body: short curved dark strokes. */
function stripes(c: Ctx, pts: [number, number, number][]) {
  c.strokeStyle = STRIPE;
  c.lineCap = 'round';
  c.lineWidth = 2.4;
  for (const [x, y, w] of pts) {
    c.beginPath();
    c.moveTo(x - w / 2, y + 1.5);
    c.quadraticCurveTo(x, y - 2.5, x + w / 2, y + 1.5);
    c.stroke();
  }
}

/** Head centred at (x,y) with radius r. `eyes`: 0 closed .. 1 open. */
function head(c: Ctx, x: number, y: number, r: number, eyes: number, asleep = false) {
  // ears
  c.fillStyle = FUR;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * r * 0.35, y - r * 0.55);
    c.lineTo(x + s * r * 0.95, y - r * 1.25);
    c.lineTo(x + s * r * 0.98, y - r * 0.35);
    c.closePath();
    c.fill();
    outline(c);
    c.fillStyle = EAR_IN;
    c.beginPath();
    c.moveTo(x + s * r * 0.5, y - r * 0.6);
    c.lineTo(x + s * r * 0.85, y - r * 1.05);
    c.lineTo(x + s * r * 0.88, y - r * 0.5);
    c.closePath();
    c.fill();
    c.fillStyle = FUR;
  }
  // head
  c.fillStyle = FUR;
  ellipse(c, x, y, r * 1.08, r);
  c.fill();
  outline(c);
  // forehead "M" stripes
  c.strokeStyle = STRIPE;
  c.lineWidth = 1.8;
  c.lineCap = 'round';
  for (const dx of [-0.3, 0, 0.3]) {
    c.beginPath();
    c.moveTo(x + dx * r, y - r * 0.92);
    c.lineTo(x + dx * r * 0.8, y - r * 0.5);
    c.stroke();
  }
  // cheek stripes
  c.lineWidth = 1.5;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * r * 1.02, y - r * 0.15);
    c.lineTo(x + s * r * 0.7, y - r * 0.05);
    c.stroke();
  }
  // white muzzle
  c.fillStyle = WHITE;
  ellipse(c, x, y + r * 0.42, r * 0.62, r * 0.46);
  c.fill();
  // eyes
  const ey = y - r * 0.08;
  for (const s of [-1, 1]) {
    const ex = x + s * r * 0.42;
    if (asleep || eyes < 0.15) {
      c.strokeStyle = STRIPE;
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(ex - r * 0.18, ey);
      c.quadraticCurveTo(ex, ey + r * 0.14, ex + r * 0.18, ey);
      c.stroke();
    } else {
      c.fillStyle = EYE;
      ellipse(c, ex, ey, r * 0.19, r * 0.22 * eyes);
      c.fill();
      c.fillStyle = '#3a2a22';
      ellipse(c, ex, ey + r * 0.02, r * 0.07, r * 0.17 * eyes);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)';
      circle(c, ex - r * 0.07, ey - r * 0.08 * eyes, r * 0.05);
      c.fill();
    }
  }
  // nose + mouth
  c.fillStyle = NOSE;
  c.beginPath();
  c.moveTo(x - r * 0.11, y + r * 0.3);
  c.lineTo(x + r * 0.11, y + r * 0.3);
  c.lineTo(x, y + r * 0.43);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(80,50,40,0.55)';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x, y + r * 0.43);
  c.lineTo(x, y + r * 0.52);
  c.moveTo(x - r * 0.16, y + r * 0.6);
  c.quadraticCurveTo(x, y + r * 0.7, x, y + r * 0.52);
  c.quadraticCurveTo(x, y + r * 0.7, x + r * 0.16, y + r * 0.6);
  c.stroke();
  // whiskers
  c.strokeStyle = 'rgba(80,50,40,0.35)';
  c.lineWidth = 0.9;
  for (const s of [-1, 1]) {
    for (const dy of [-0.05, 0.1]) {
      c.beginPath();
      c.moveTo(x + s * r * 0.55, y + r * (0.4 + dy));
      c.lineTo(x + s * r * 1.35, y + r * (0.3 + dy * 2.2));
      c.stroke();
    }
  }
}

function paw(c: Ctx, x: number, y: number, r: number) {
  c.fillStyle = WHITE;
  ellipse(c, x, y, r, r * 0.7);
  c.fill();
  outline(c);
}

/** Animated tail: base at (x,y), length L, pointing dir (±1), sway s in -1..1. */
function tail(c: Ctx, x: number, y: number, L: number, dir: number, s: number, up = true) {
  c.lineCap = 'round';
  const cx = x + dir * L * 0.6;
  const cy = up ? y - L * 0.9 : y + L * 0.1;
  const ex = x + dir * L * (0.5 + s * 0.25);
  const ey = up ? y - L * 1.25 + s * L * 0.1 : y - L * 0.1;
  c.strokeStyle = FUR;
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(cx, cy, ex, ey);
  c.stroke();
  c.strokeStyle = OUT;
  c.lineWidth = 8.4;
  c.globalCompositeOperation = 'destination-over';
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(cx, cy, ex, ey);
  c.stroke();
  c.globalCompositeOperation = 'source-over';
  // rings
  c.strokeStyle = STRIPE;
  c.lineWidth = 7;
  c.setLineDash([2.2, 6]);
  c.lineDashOffset = -4;
  c.beginPath();
  c.moveTo(x, y);
  c.quadraticCurveTo(cx, cy, ex, ey);
  c.stroke();
  c.setLineDash([]);
  // white tip
  c.fillStyle = WHITE;
  circle(c, ex, ey, 3.6);
  c.fill();
}

type Body = (c: Ctx, eyes: number, phase: number) => void;

const sit: Body = (c, eyes) => {
  // body (pear)
  c.fillStyle = FUR;
  c.beginPath();
  c.moveTo(-20, 0);
  c.quadraticCurveTo(-24, -30, -8, -42);
  c.quadraticCurveTo(0, -46, 8, -42);
  c.quadraticCurveTo(24, -30, 20, 0);
  c.closePath();
  c.fill();
  outline(c);
  stripes(c, [
    [-14, -30, 7],
    [14, -30, 7],
    [-15, -20, 8],
    [15, -20, 8],
    [-17, -10, 7],
    [17, -10, 7],
  ]);
  // white chest/belly
  c.fillStyle = WHITE;
  c.beginPath();
  c.moveTo(-11, 0);
  c.quadraticCurveTo(-13, -26, 0, -30);
  c.quadraticCurveTo(13, -26, 11, 0);
  c.closePath();
  c.fill();
  // front legs
  c.fillStyle = WHITE;
  roundRect(c, -11, -18, 7.5, 18, 3.5);
  c.fill();
  outline(c);
  roundRect(c, 3.5, -18, 7.5, 18, 3.5);
  c.fill();
  outline(c);
  paw(c, -7, -1.5, 5);
  paw(c, 7.5, -1.5, 5);
  head(c, 0, -46, 15, eyes);
};

const loaf: Body = (c, eyes) => {
  c.fillStyle = FUR;
  roundRect(c, -27, -28, 54, 28, 14);
  c.fill();
  outline(c);
  stripes(c, [
    [-14, -22, 9],
    [0, -24, 9],
    [14, -22, 9],
    [-18, -14, 7],
    [18, -14, 7],
  ]);
  c.fillStyle = WHITE_D;
  roundRect(c, -22, -7, 44, 7, 3.5);
  c.fill();
  paw(c, -10, -2, 5.5);
  paw(c, 10, -2, 5.5);
  head(c, 0, -32, 14.5, eyes);
};

const sleep: Body = (c) => {
  c.fillStyle = FUR;
  ellipse(c, 0, -14, 30, 14);
  c.fill();
  outline(c);
  stripes(c, [
    [-12, -22, 9],
    [2, -24, 9],
    [16, -20, 8],
    [-20, -14, 7],
  ]);
  c.fillStyle = WHITE_D;
  ellipse(c, 6, -6, 20, 5);
  c.fill();
  paw(c, 20, -4, 5);
  // head lying on the side, lower
  head(c, -14, -17, 13, 0, true);
};

const walk: Body = (c, eyes) => {
  c.fillStyle = FUR;
  roundRect(c, -24, -36, 48, 22, 11);
  c.fill();
  outline(c);
  stripes(c, [
    [-12, -31, 8],
    [2, -32, 8],
    [15, -30, 8],
    [-16, -22, 7],
    [8, -22, 7],
  ]);
  c.fillStyle = WHITE_D;
  roundRect(c, -18, -19, 36, 5, 2.5);
  c.fill();
  head(c, 20, -42, 14, eyes);
};

const stretch: Body = (c, eyes) => {
  // front down, rear up
  c.fillStyle = FUR;
  c.beginPath();
  c.moveTo(-26, 0);
  c.quadraticCurveTo(-32, -40, -14, -40);
  c.quadraticCurveTo(0, -36, 14, -22);
  c.quadraticCurveTo(28, -12, 26, 0);
  c.closePath();
  c.fill();
  outline(c);
  stripes(c, [
    [-18, -32, 8],
    [-6, -32, 8],
    [6, -26, 7],
    [16, -18, 7],
  ]);
  c.fillStyle = WHITE;
  roundRect(c, 14, -14, 7, 14, 3.5);
  c.fill();
  outline(c);
  roundRect(c, 24, -12, 7, 12, 3.5);
  c.fill();
  outline(c);
  paw(c, 18, -1.5, 5);
  paw(c, 28, -1.5, 5);
  c.fillStyle = WHITE;
  roundRect(c, -24, -14, 7, 14, 3.5);
  c.fill();
  outline(c);
  paw(c, -20, -1.5, 5);
  head(c, 24, -22, 13, eyes);
};

const BODIES: Record<CatPose, Body> = { sit, loaf, sleep, walk, stretch };

function blinkAmount(t: number) {
  const ph = (t % 4.1) / 4.1;
  if (ph < 0.95) return 1;
  const k = (ph - 0.95) / 0.05;
  return Math.abs(k - 0.5) * 2;
}

/**
 * Draw Mochi. x = horizontal centre, y = ground (bottom), size = body height in
 * logical px; t = seconds (tail sway, blink every ~4 s, walking legs, breathing).
 */
export function drawCat(
  c: Ctx,
  x: number,
  y: number,
  size: number,
  pose: CatPose,
  t: number,
  flip = false
): void {
  const k = size / U;
  const blink = blinkAmount(t + 1.3);
  const eyeKey = blink < 0.15 ? 0 : 1;
  c.save();
  c.translate(x, y);
  softShadow(c, 0, 0, 30 * k, 7 * k, 0.2);
  if (flip) c.scale(-1, 1);
  c.scale(k, k);
  c.lineJoin = 'round';
  c.lineCap = 'round';

  const breath = pose === 'sleep' ? 1 + Math.sin(t * 2.2) * 0.02 : 1;
  const sway = Math.sin(t * 1.6) * (pose === 'sleep' ? 0.3 : 1);

  // tail behind the body
  switch (pose) {
    case 'sit':
      tail(c, -16, -6, 24, -1, sway);
      break;
    case 'loaf':
      tail(c, -24, -8, 22, -1, sway, false);
      break;
    case 'sleep':
      tail(c, 26, -8, 18, 1, sway * 0.5, false);
      break;
    case 'walk':
      tail(c, -22, -30, 24, -1, sway);
      break;
    case 'stretch':
      tail(c, -24, -38, 22, -1, sway);
      break;
  }

  // animated legs for walking (behind the body sprite)
  if (pose === 'walk') {
    const ph = t * 7;
    const legs: [number, number][] = [
      [-15, 0],
      [15, Math.PI],
      [-9, Math.PI],
      [9, 0],
    ];
    legs.forEach(([lx, off], i) => {
      const sw = Math.sin(ph + off);
      const lift = Math.max(0, Math.cos(ph + off)) * 3;
      c.fillStyle = i < 2 ? WHITE_D : WHITE;
      roundRect(c, lx + sw * 4 - 3.5, -22, 7, 22 - lift, 3.5);
      c.fill();
      outline(c);
      paw(c, lx + sw * 4, -1.5 - lift, 4.6);
    });
  }

  // body sprite
  const sp = sprite(
    `cat:${pose}:${eyeKey}`,
    100,
    70,
    (sc) => {
      sc.translate(50, 66);
      sc.lineJoin = 'round';
      sc.lineCap = 'round';
      BODIES[pose](sc, eyeKey, 0);
    },
    3
  );
  c.save();
  if (pose === 'sleep') c.scale(1, breath);
  c.drawImage(sp, -50, -66, 100, 70);
  c.restore();

  if (pose === 'sleep') {
    // little "z"s
    const zt = (t * 0.6) % 1;
    c.fillStyle = `rgba(90,98,138,${0.7 * (1 - zt)})`;
    c.font = '800 9px "Baloo 2", system-ui, sans-serif';
    c.textAlign = 'center';
    c.fillText('z', -6 + zt * 6, -36 - zt * 12);
    c.font = '800 6px "Baloo 2", system-ui, sans-serif';
    c.fillStyle = `rgba(90,98,138,${0.7 * (1 - ((zt + 0.5) % 1))})`;
    c.fillText('z', -10 + ((zt + 0.5) % 1) * 6, -38 - ((zt + 0.5) % 1) * 12);
  }
  c.restore();
}
