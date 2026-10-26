// The view through the window: snowy mountains, the harbor with little lit houses,
// a lighthouse, the icy sea, falling snow and — on festival nights — the northern lights.

import type { TimeOfDay } from '../game/data';
import {
  type Ctx,
  darken,
  ellipse,
  lighten,
  lin,
  mix,
  rad,
  rgba,
  rr,
  sprite,
  srand,
} from './common';
import type { Box } from './kit';

export interface Sky {
  top: string;
  mid: string;
  bottom: string;
  sea: string;
  snow: string;
  sun: string;
  night: boolean;
  glow: number; // lantern glow inside the hut
  tint: string;
  tintA: number;
}

export function skyFor(time: TimeOfDay, storm: boolean): Sky {
  const m: Record<TimeOfDay, Sky> = {
    morning: {
      top: '#a9d4ea',
      mid: '#d8ecf2',
      bottom: '#fbe6d4',
      sea: '#6fa9c2',
      snow: '#f7fbfd',
      sun: '#fff1c8',
      night: false,
      glow: 0.25,
      tint: '#fff2de',
      tintA: 0.04,
    },
    noon: {
      top: '#8cc5e6',
      mid: '#cfe6f2',
      bottom: '#eef6f8',
      sea: '#4f97b8',
      snow: '#ffffff',
      sun: '#fffbe9',
      night: false,
      glow: 0.15,
      tint: '#ffffff',
      tintA: 0,
    },
    sunset: {
      top: '#7f86c0',
      mid: '#f0a98e',
      bottom: '#fcd6a0',
      sea: '#8b7fa8',
      snow: '#fde8e0',
      sun: '#ffcf7a',
      night: false,
      glow: 0.6,
      tint: '#ffb98a',
      tintA: 0.08,
    },
    evening: {
      top: '#141c3d',
      mid: '#2a3466',
      bottom: '#4b4e86',
      sea: '#26305a',
      snow: '#c9d2ec',
      sun: '#fff6d6',
      night: true,
      glow: 1,
      tint: '#2d3466',
      tintA: 0.12,
    },
  };
  const s = { ...m[time] };
  if (storm) {
    s.top = mix(s.top, '#9aa6b4', 0.65);
    s.mid = mix(s.mid, '#c3cbd3', 0.6);
    s.bottom = mix(s.bottom, '#dfe4e8', 0.6);
    s.sea = mix(s.sea, '#6f7f8c', 0.5);
    s.glow = Math.max(s.glow, 0.6);
  }
  return s;
}

export function paintOutside(c: Ctx, b: Box, time: TimeOfDay, storm: boolean) {
  sprite(
    c,
    `out:${Math.round(b.w)}x${Math.round(b.h)}:${time}:${storm}`,
    b.w,
    b.h,
    0,
    0,
    (cc) => paint(cc, b.w, b.h, time, storm),
    b.x,
    b.y
  );
}

function mountains(
  c: Ctx,
  w: number,
  base: number,
  amp: number,
  col: string,
  snowCol: string,
  seed: number,
  peaks: number
) {
  const r = srand(seed);
  const pts: [number, number][] = [];
  for (let i = 0; i <= peaks * 2; i++) {
    const x = (i / (peaks * 2)) * w * 1.1 - w * 0.05;
    const y = i % 2 ? base - amp * (0.55 + r() * 0.45) : base - amp * (0.05 + r() * 0.25);
    pts.push([x, y]);
  }
  c.beginPath();
  c.moveTo(-10, base + 400);
  for (const [x, y] of pts) c.lineTo(x, y);
  c.lineTo(w + 10, base + 400);
  c.closePath();
  c.fillStyle = col;
  c.fill();
  // snow caps
  c.save();
  c.clip();
  for (let i = 1; i < pts.length; i += 2) {
    const [px, py] = pts[i];
    const [lx, ly] = pts[i - 1];
    const [rx, ry] = pts[i + 1] ?? pts[i];
    const capY = py + (Math.min(ly, ry) - py) * 0.55;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px + (lx - px) * ((capY - py) / (ly - py || 1)), capY);
    for (let k = 0; k < 4; k++) {
      const t = (k + 0.5) / 4;
      const ax = px + (lx - px) * ((capY - py) / (ly - py || 1));
      const bx = px + (rx - px) * ((capY - py) / (ry - py || 1));
      c.lineTo(ax + (bx - ax) * t, capY + (k % 2 ? -6 : 6));
    }
    c.lineTo(px + (rx - px) * ((capY - py) / (ry - py || 1)), capY);
    c.closePath();
    c.fillStyle = snowCol;
    c.fill();
  }
  c.restore();
}

function house(
  c: Ctx,
  x: number,
  y: number,
  s: number,
  col: string,
  roof: string,
  night: boolean,
  snow: string,
  seed: number
) {
  const r = srand(seed);
  const w = s;
  const h = s * 0.7;
  c.fillStyle = col;
  c.fillRect(x - w / 2, y - h, w, h);
  c.fillStyle = darken(col, 0.18);
  c.fillRect(x - w / 2, y - h, w * 0.18, h);
  // windows
  for (let i = 0; i < 2; i++) {
    const wx = x - w * 0.22 + i * w * 0.32;
    c.fillStyle = night ? (r() < 0.8 ? '#ffd889' : '#3a3f60') : r() < 0.3 ? '#ffe9b8' : '#7a8fa8';
    rr(c, wx, y - h * 0.62, w * 0.16, h * 0.28, 2);
    c.fill();
    if (night) {
      c.fillStyle = 'rgba(255,210,130,0.25)';
      c.beginPath();
      c.arc(wx + w * 0.08, y - h * 0.48, w * 0.25, 0, Math.PI * 2);
      c.fill();
    }
  }
  // roof with snow
  c.beginPath();
  c.moveTo(x - w * 0.62, y - h + 2);
  c.lineTo(x, y - h - s * 0.42);
  c.lineTo(x + w * 0.62, y - h + 2);
  c.closePath();
  c.fillStyle = roof;
  c.fill();
  c.beginPath();
  c.moveTo(x - w * 0.64, y - h + 1);
  c.lineTo(x, y - h - s * 0.45);
  c.lineTo(x + w * 0.64, y - h + 1);
  c.quadraticCurveTo(x + w * 0.4, y - h - s * 0.05, x + w * 0.2, y - h - s * 0.12);
  c.quadraticCurveTo(x, y - h - s * 0.05, x - w * 0.25, y - h - s * 0.1);
  c.quadraticCurveTo(x - w * 0.45, y - h - s * 0.02, x - w * 0.64, y - h + 1);
  c.fillStyle = snow;
  c.fill();
  // chimney
  c.fillStyle = darken(roof, 0.1);
  c.fillRect(x + w * 0.2, y - h - s * 0.4, s * 0.1, s * 0.22);
  c.fillStyle = snow;
  c.fillRect(x + w * 0.19, y - h - s * 0.42, s * 0.12, s * 0.04);
}

function paint(c: Ctx, w: number, h: number, time: TimeOfDay, storm: boolean) {
  const sky = skyFor(time, storm);
  const horizon = h * 0.52;
  c.fillStyle = lin(c, 0, 0, 0, horizon, [
    [0, sky.top],
    [0.6, sky.mid],
    [1, sky.bottom],
  ]);
  c.fillRect(0, 0, w, h);
  // sun / moon
  const sx = w * 0.78;
  const sy = sky.night ? h * 0.16 : time === 'sunset' ? horizon * 0.82 : h * 0.18;
  c.fillStyle = rad(c, sx, sy, 0, sky.night ? 70 : 120, [
    [0, rgba(sky.sun, sky.night ? 0.35 : 0.6)],
    [1, rgba(sky.sun, 0)],
  ]);
  c.fillRect(0, 0, w, h);
  ellipse(c, sx, sy, sky.night ? 16 : 26, sky.night ? 16 : 26);
  c.fillStyle = sky.sun;
  c.fill();
  if (sky.night) {
    ellipse(c, sx + 6, sy - 4, 13, 13);
    c.fillStyle = sky.top;
    c.fill();
    const r = srand(3);
    for (let i = 0; i < 90; i++) {
      const a = 0.3 + r() * 0.7;
      c.fillStyle = `rgba(255,255,240,${a})`;
      const s = r() < 0.1 ? 2 : 1.2;
      c.fillRect(r() * w, r() * horizon * 0.85, s, s);
    }
  }
  // mountains: far, mid
  mountains(c, w, horizon - 4, h * 0.3, mix(sky.mid, '#8ea6bf', 0.5), lighten(sky.snow, 0.2), 4, 4);
  mountains(c, w, horizon + 4, h * 0.2, mix(sky.mid, '#6f89a6', 0.6), sky.snow, 9, 6);
  // sea with ice floes
  c.fillStyle = lin(c, 0, horizon, 0, h, [
    [0, lighten(sky.sea, 0.15)],
    [1, darken(sky.sea, 0.15)],
  ]);
  c.fillRect(0, horizon, w, h - horizon);
  const r = srand(11);
  for (let i = 0; i < 16; i++) {
    const fx = r() * w;
    const fy = horizon + 8 + r() * h * 0.18;
    const fw = 10 + r() * 34 * (fy / horizon);
    ellipse(c, fx, fy, fw, fw * 0.22);
    c.fillStyle = rgba(sky.snow, 0.9);
    c.fill();
    ellipse(c, fx, fy + fw * 0.08, fw, fw * 0.18);
    c.fillStyle = rgba('#9bb8cc', 0.3);
    c.fill();
  }
  c.strokeStyle = rgba('#ffffff', 0.25);
  c.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    const x = r() * w;
    const y = horizon + 4 + r() * h * 0.25;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 8 + r() * 14, y);
    c.stroke();
  }
  // lighthouse on a rock
  const lx = w * 0.88;
  const ly = horizon + h * 0.07;
  ellipse(c, lx, ly + 6, 40, 12);
  c.fillStyle = mix(sky.mid, '#5a6b80', 0.6);
  c.fill();
  ellipse(c, lx - 4, ly + 2, 30, 7);
  c.fillStyle = sky.snow;
  c.fill();
  c.fillStyle = '#f4efe3';
  c.beginPath();
  c.moveTo(lx - 9, ly + 2);
  c.lineTo(lx - 6, ly - 50);
  c.lineTo(lx + 6, ly - 50);
  c.lineTo(lx + 9, ly + 2);
  c.fill();
  c.fillStyle = '#d9573f';
  c.fillRect(lx - 8, ly - 18, 16, 8);
  c.fillRect(lx - 7, ly - 40, 14, 7);
  c.fillStyle = sky.night ? '#ffe7a0' : '#fff6d6';
  c.fillRect(lx - 5, ly - 58, 10, 8);
  c.fillStyle = '#3a3f4e';
  c.beginPath();
  c.moveTo(lx - 8, ly - 58);
  c.lineTo(lx, ly - 66);
  c.lineTo(lx + 8, ly - 58);
  c.fill();
  // harbor town on the left shore
  const shoreY = horizon + h * 0.12;
  c.fillStyle = mix(sky.snow, '#c9d6e2', 0.4);
  c.beginPath();
  c.moveTo(-10, shoreY + 30);
  c.quadraticCurveTo(w * 0.15, shoreY - 14, w * 0.42, shoreY + 6);
  c.lineTo(w * 0.42, h);
  c.lineTo(-10, h);
  c.fill();
  const cols = ['#c95d5d', '#e9b45c', '#7f93c6', '#9fc39a', '#e7a3b6', '#78b3b0'];
  for (let i = 0; i < 7; i++) {
    const hx = w * 0.03 + i * w * 0.055 + (i % 2) * 6;
    const hy = shoreY + 6 - Math.sin((i / 7) * Math.PI) * 10;
    house(
      c,
      hx,
      hy,
      26 + (i % 3) * 4,
      mix(cols[i % cols.length], '#f4efe3', 0.25),
      darken(cols[(i + 2) % cols.length], 0.2),
      sky.night,
      sky.snow,
      i + 3
    );
  }
  // pier in the foreground where customers stand
  const pierY = h * 0.8;
  c.fillStyle = lin(c, 0, pierY - 10, 0, h, [
    [0, lighten(sky.snow, 0.05)],
    [1, mix(sky.snow, '#b9c8d6', 0.5)],
  ]);
  c.beginPath();
  c.moveTo(0, pierY);
  c.quadraticCurveTo(w * 0.5, pierY - 16, w, pierY + 4);
  c.lineTo(w, h);
  c.lineTo(0, h);
  c.fill();
  // footprints and a snowy lamp post
  for (let i = 0; i < 9; i++) {
    ellipse(c, w * 0.08 + i * w * 0.06, pierY + 14 + (i % 2) * 8, 4, 2);
    c.fillStyle = rgba('#9fb2c6', 0.5);
    c.fill();
  }
  const px = w * 0.06;
  c.fillStyle = '#3a3f4e';
  c.fillRect(px - 3, pierY - 90, 6, 92);
  rr(c, px - 12, pierY - 112, 24, 26, 5);
  c.fill();
  c.fillStyle = sky.night ? '#ffe39a' : '#f6efe0';
  rr(c, px - 8, pierY - 108, 16, 18, 3);
  c.fill();
  ellipse(c, px, pierY - 113, 15, 5);
  c.fillStyle = sky.snow;
  c.fill();
  if (sky.night) {
    c.fillStyle = rad(c, px, pierY - 98, 0, 80, [
      [0, 'rgba(255,220,140,0.35)'],
      [1, 'rgba(255,220,140,0)'],
    ]);
    c.fillRect(px - 80, pierY - 180, 160, 200);
  }
  // snowbanks in front
  for (let i = 0; i < 6; i++) {
    ellipse(c, (i / 5) * w, h + 6, 70 + (i % 3) * 20, 26);
    c.fillStyle = lighten(sky.snow, 0.1);
    c.fill();
  }
  // gentle overall tint
  c.fillStyle = rgba(sky.tint, sky.tintA);
  c.fillRect(0, 0, w, h);
}

/** moving bits drawn every frame over the cached view */
export function outsideLife(
  c: Ctx,
  b: Box,
  t: number,
  time: TimeOfDay,
  storm: boolean,
  snowy: boolean,
  aurora: boolean
) {
  const sky = skyFor(time, storm);
  c.save();
  c.beginPath();
  c.rect(b.x, b.y, b.w, b.h);
  c.clip();
  const horizon = b.y + b.h * 0.52;
  if (aurora) {
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      const base = b.y + b.h * (0.16 + k * 0.06);
      for (let i = 0; i <= 40; i++) {
        const x = b.x + (i / 40) * b.w;
        const y = base + Math.sin(i * 0.35 + t * 0.6 + k) * 14 + Math.sin(i * 0.11 + t * 0.3) * 18;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      for (let i = 40; i >= 0; i--) {
        const x = b.x + (i / 40) * b.w;
        const y = base + 46 + Math.sin(i * 0.3 + t * 0.5 + k * 2) * 10;
        c.lineTo(x, y);
      }
      c.closePath();
      const g = c.createLinearGradient(0, base - 20, 0, base + 60);
      const col = k === 1 ? '#c58cf0' : '#7cf0c0';
      g.addColorStop(0, rgba(col, 0));
      g.addColorStop(0.5, rgba(col, 0.28 + Math.sin(t + k) * 0.08));
      g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g;
      c.fill();
    }
  }
  // clouds drifting by day
  if (!sky.night) {
    for (let i = 0; i < 3; i++) {
      const cx = b.x + (((t * (5 + i * 2) + i * 230) % (b.w + 200)) - 100);
      const cy = b.y + b.h * (0.1 + i * 0.07);
      c.fillStyle = storm ? 'rgba(210,215,222,0.85)' : 'rgba(255,255,255,0.78)';
      ellipse(c, cx, cy, 38, 11);
      c.fill();
      ellipse(c, cx + 18, cy - 7, 22, 11);
      c.fill();
      ellipse(c, cx - 16, cy - 4, 16, 8);
      c.fill();
    }
  }
  // a fishing boat bobbing
  const bx = b.x + b.w * 0.55 + Math.sin(t * 0.15) * 30;
  const by = horizon + b.h * 0.06 + Math.sin(t * 1.5) * 1.5;
  c.fillStyle = '#c95d5d';
  c.beginPath();
  c.moveTo(bx - 20, by);
  c.lineTo(bx + 20, by);
  c.lineTo(bx + 13, by + 8);
  c.lineTo(bx - 13, by + 8);
  c.fill();
  c.fillStyle = '#f4efe3';
  c.fillRect(bx - 6, by - 12, 12, 12);
  c.fillStyle = sky.night ? '#ffe39a' : '#7a8fa8';
  c.fillRect(bx - 3, by - 9, 6, 5);
  // chimney smoke from the town
  for (let i = 0; i < 4; i++) {
    const hx = b.x + b.w * (0.05 + i * 0.11);
    const hy = b.y + b.h * 0.56;
    for (let k = 0; k < 4; k++) {
      const p = (t * 0.25 + k * 0.25 + i * 0.1) % 1;
      ellipse(c, hx + Math.sin(p * 6 + i) * 5 + p * 10, hy - p * 40, 4 + p * 8, 3 + p * 6);
      c.fillStyle = `rgba(240,244,250,${0.45 * (1 - p)})`;
      c.fill();
    }
  }
  // seagull silhouettes
  if (!sky.night) {
    for (let i = 0; i < 2; i++) {
      const gx = b.x + ((t * (16 + i * 6) + i * 300) % (b.w + 80)) - 40;
      const gy = b.y + b.h * (0.22 + i * 0.06) + Math.sin(t + i) * 5;
      const f = Math.sin(t * 6 + i) * 4;
      c.strokeStyle = 'rgba(70,80,95,0.7)';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(gx - 8, gy - f);
      c.quadraticCurveTo(gx - 4, gy - 4, gx, gy);
      c.quadraticCurveTo(gx + 4, gy - 4, gx + 8, gy - f);
      c.stroke();
    }
  }
  // falling snow (two depths)
  if (snowy || storm) {
    const n = storm ? 170 : 70;
    const wind = storm ? 90 : 14;
    for (let i = 0; i < n; i++) {
      const depth = i % 3 === 0 ? 1.6 : 1;
      const speed = (storm ? 120 : 34) * depth;
      const x =
        b.x +
        ((((((i * 97.3) % b.w) + t * wind * depth + Math.sin(t * 0.8 + i) * 10) % b.w) + b.w) %
          b.w);
      const y = b.y + ((i * 53.7 + t * speed) % (b.h + 10)) - 5;
      c.fillStyle = `rgba(255,255,255,${depth > 1 ? 0.95 : 0.7})`;
      c.beginPath();
      c.arc(x, y, depth > 1 ? 2.4 : 1.4, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}
