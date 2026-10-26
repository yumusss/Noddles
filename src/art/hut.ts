// The inside of the hut around the window: plank walls, the cloth awning, lanterns, icicles,
// the sill counter, the brass register with its little change box, the tip jar, Pip and charms.

import { t as tt } from '../game/i18n';
import type { Coin } from '../game/session';
import {
  type Ctx,
  contactShadow,
  darken,
  ellipse,
  lighten,
  lin,
  rad,
  rgba,
  rr,
  sheen,
  speckle,
  sprite,
  srand,
  text,
  woodGrain,
} from './common';
import type { Layout } from './layout';
import { CHAR_LOOKS, drawBust, drawPaws } from './animals';
import type { Mood } from '../game/session';

const AWNING: Record<string, [string, string]> = {
  'awning-indigo': ['#46548a', '#3a4677'],
  'awning-coral': ['#e98d7a', '#d9705b'],
  'awning-matcha': ['#8fb37f', '#75996a'],
};

/** walls and the window frame (drawn after the outside view) */
export function drawHutFrame(
  c: Ctx,
  L: Layout,
  decor: Record<string, string>,
  lamps: number,
  t: number
) {
  const { W, win } = L;
  sprite(
    c,
    `hut:${W}x${L.H}:${decor.awning}:${decor.plant}:${decor.charm}`,
    W,
    L.sillY + L.sillH + 10,
    0,
    0,
    (cc) => paintFrame(cc, L, decor),
    0,
    0
  );
  drawLanterns(c, L, decor.lantern, lamps, t);
  void win;
}

function paintFrame(c: Ctx, L: Layout, decor: Record<string, string>) {
  const { W, win } = L;
  // plank walls left/right and above
  const wall = '#a9764e';
  c.save();
  c.beginPath();
  c.rect(0, 0, W, L.sillY);
  c.rect(win.x + win.w, win.y, -win.w, win.h);
  c.clip('evenodd');
  woodGrain(c, 0, 0, W, L.sillY, wall, 21, {
    planks: Math.round(W / 46),
    vertical: true,
    strength: 1,
  });
  c.fillStyle = lin(c, 0, 0, 0, L.sillY, [
    [0, 'rgba(40,20,10,0.25)'],
    [1, 'rgba(40,20,10,0.05)'],
  ]);
  c.fillRect(0, 0, W, L.sillY);
  c.restore();
  // window frame posts
  const fw = 14;
  c.fillStyle = '#6e4630';
  c.fillRect(win.x - fw, win.y - 4, fw, win.h + 4);
  c.fillRect(win.x + win.w, win.y - 4, fw, win.h + 4);
  c.fillStyle = lin(c, win.x - fw, 0, win.x, 0, [
    [0, '#5a3826'],
    [1, '#8a5a3c'],
  ]);
  c.fillRect(win.x - fw + 2, win.y, fw - 4, win.h);
  c.fillRect(win.x + win.w + 2, win.y, fw - 4, win.h);
  // inner shadow along the frame so the outside sits "behind"
  c.fillStyle = lin(c, win.x, 0, win.x + 18, 0, [
    [0, 'rgba(30,20,20,0.25)'],
    [1, 'rgba(30,20,20,0)'],
  ]);
  c.fillRect(win.x, win.y, 18, win.h);
  c.fillStyle = lin(c, win.x + win.w, 0, win.x + win.w - 18, 0, [
    [0, 'rgba(30,20,20,0.25)'],
    [1, 'rgba(30,20,20,0)'],
  ]);
  c.fillRect(win.x + win.w - 18, win.y, 18, win.h);
  // eaves with icicles across the top of the window (outside)
  const r = srand(5);
  c.fillStyle = '#f2f7fb';
  rr(c, win.x - 4, win.y - 2, win.w + 8, 12, 6);
  c.fill();
  for (let x = win.x + 8; x < win.x + win.w - 8; x += 14 + r() * 18) {
    const len = 10 + r() * 26;
    c.beginPath();
    c.moveTo(x - 4, win.y + 8);
    c.lineTo(x, win.y + 8 + len);
    c.lineTo(x + 4, win.y + 8);
    c.fillStyle = lin(c, x, win.y, x, win.y + len, [
      [0, 'rgba(240,248,255,0.95)'],
      [1, 'rgba(200,225,245,0.6)'],
    ]);
    c.fill();
  }
  // the cloth awning (noren) across the top inside
  const [a1, a2] = AWNING[decor.awning] ?? AWNING['awning-indigo'];
  const ay = win.y - 6;
  const ah = Math.min(64, win.h * 0.24);
  const panels = Math.max(4, Math.round(win.w / 120));
  const pw = (win.w + 28) / panels;
  for (let i = 0; i < panels; i++) {
    const x = win.x - 14 + i * pw;
    c.beginPath();
    c.moveTo(x + 1, ay);
    c.lineTo(x + pw - 1, ay);
    c.lineTo(x + pw - 1, ay + ah);
    c.quadraticCurveTo(x + pw / 2, ay + ah + 7, x + 1, ay + ah);
    c.closePath();
    c.fillStyle = lin(c, x, 0, x + pw, 0, [
      [0, a2],
      [0.5, a1],
      [1, a2],
    ]);
    c.fill();
    // soft fabric folds
    c.fillStyle = 'rgba(255,255,255,0.06)';
    c.fillRect(x + pw * 0.3, ay, pw * 0.08, ah);
  }
  // white snowflake crest and the name
  const midX = win.x + win.w / 2;
  text(c, '雪', midX, ay + ah * 0.48, ah * 0.62, 'rgba(255,250,240,0.95)', {
    font: 'brush',
    weight: 700,
  });
  for (const s of [-1, 1])
    snowflake(c, midX + s * pw * 1.2, ay + ah * 0.48, ah * 0.22, 'rgba(255,250,240,0.85)');
  c.fillStyle = '#5a3826';
  rr(c, win.x - 20, ay - 8, win.w + 40, 10, 4);
  c.fill();

  // side walls: a menu board (left) and shelves (right)
  const lw = win.x - 14;
  if (lw > 90) {
    const bx = lw / 2;
    const by = win.y + 60;
    const bw = Math.min(150, lw - 30);
    rr(c, bx - bw / 2 - 6, by - 6, bw + 12, 170, 8);
    c.fillStyle = '#5a3826';
    c.fill();
    rr(c, bx - bw / 2, by, bw, 158, 6);
    c.fillStyle = lin(c, 0, by, 0, by + 158, [
      [0, '#3c4a42'],
      [1, '#2f3a34'],
    ]);
    c.fill();
    speckle(c, bx - bw / 2, by, bw, 158, '#ffffff', 160, 3, 0.06);
    text(c, 'MENU', bx, by + 20, 16, 'rgba(255,250,240,0.9)', { font: 'type', weight: 700 });
    const items = ['鮭', '鮪', '巻', '海老'];
    items.forEach((k, i) => {
      text(c, k, bx - bw / 2 + 24, by + 50 + i * 28, 17, 'rgba(255,250,240,0.85)', {
        font: 'brush',
      });
      c.strokeStyle = 'rgba(255,250,240,0.35)';
      c.setLineDash([3, 4]);
      c.beginPath();
      c.moveTo(bx - bw / 2 + 44, by + 52 + i * 28);
      c.lineTo(bx + bw / 2 - 30, by + 52 + i * 28);
      c.stroke();
      c.setLineDash([]);
      ellipse(c, bx + bw / 2 - 18, by + 50 + i * 28, 6, 4);
      c.fillStyle = ['#f28a55', '#cc3442', '#9fc39a', '#f6a184'][i];
      c.fill();
    });
  }
  const rw = W - (win.x + win.w + 14);
  if (rw > 90) {
    const sx = win.x + win.w + 14 + rw / 2;
    for (let k = 0; k < 2; k++) {
      const y = win.y + 70 + k * 80;
      woodGrain(c, sx - rw * 0.4, y, rw * 0.8, 9, '#7a4e32', 40 + k);
      contactShadow(c, sx, y + 12, rw * 0.4, 4, 0.3);
      // jars and a sake bottle
      const jr = srand(30 + k);
      let x = sx - rw * 0.34;
      while (x < sx + rw * 0.3) {
        const jw = 20 + jr() * 10;
        const col = ['#e9dcc4', '#7d8fae', '#c9a77a', '#9fc39a'][Math.floor(jr() * 4)];
        rr(c, x, y - jw * 1.1, jw, jw * 1.1, 6);
        c.fillStyle = lin(c, x, 0, x + jw, 0, [
          [0, darken(col, 0.1)],
          [0.4, lighten(col, 0.15)],
          [1, darken(col, 0.15)],
        ]);
        c.fill();
        x += jw + 6;
      }
    }
  }
  // the sill counter where plates are served
  const sy = L.sillY;
  c.fillStyle = 'rgba(40,20,10,0.35)';
  c.fillRect(0, sy - 6, W, 8);
  woodGrain(c, 0, sy, W, L.sillH, '#e7c597', 61, { strength: 0.8 });
  c.fillStyle = lin(c, 0, sy, 0, sy + L.sillH, [
    [0, 'rgba(255,255,255,0.35)'],
    [0.2, 'rgba(255,255,255,0.05)'],
    [1, 'rgba(90,50,20,0.15)'],
  ]);
  c.fillRect(0, sy, W, L.sillH);
  c.fillStyle = '#8a5a3c';
  c.fillRect(0, sy + L.sillH - 4, W, 6);
  c.fillStyle = 'rgba(40,20,10,0.35)';
  c.fillRect(0, sy + L.sillH + 2, W, 6);

  // plant and charm on the sill
  if (decor.plant === 'plant-pine') pine(c, win.x + win.w - 40, sy + 4);
  if (decor.plant === 'plant-camellia') camellia(c, win.x + win.w - 40, sy + 4);
  if (decor.charm === 'charm-cat') luckyCat(c, win.x + 46, sy + 4);
  if (decor.charm === 'charm-daruma') daruma(c, win.x + 46, sy + 4);
}

function snowflake(c: Ctx, x: number, y: number, s: number, col: string) {
  c.strokeStyle = col;
  c.lineWidth = Math.max(1.2, s * 0.14);
  c.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
    c.moveTo(x + Math.cos(a) * s * 0.55, y + Math.sin(a) * s * 0.55);
    c.lineTo(x + Math.cos(a + 0.5) * s * 0.8, y + Math.sin(a + 0.5) * s * 0.8);
    c.stroke();
  }
}

function drawLanterns(c: Ctx, L: Layout, style: string, glow: number, t: number) {
  const xs = [L.win.x - 34, L.win.x + L.win.w + 34];
  for (const [i, x] of xs.entries()) {
    if (x < 30 || x > L.W - 30) continue;
    const sway = Math.sin(t * 0.8 + i) * 2;
    const y = L.win.y + 30;
    c.strokeStyle = '#3a2a22';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x + sway, y - 24);
    c.stroke();
    if (glow > 0.15) {
      c.fillStyle = rad(c, x + sway, y, 0, 90, [
        [0, rgba('#ffd98a', 0.32 * glow)],
        [1, 'rgba(255,217,138,0)'],
      ]);
      c.fillRect(x - 90, y - 90, 180, 180);
    }
    if (style === 'lantern-fish') {
      // a koi-shaped paper lantern
      c.save();
      c.translate(x + sway, y);
      c.rotate(Math.sin(t + i) * 0.05);
      ellipse(c, 0, 0, 28, 17);
      c.fillStyle = rad(c, -6, -4, 2, 30, [
        [0, '#ffe3cf'],
        [1, '#ef8f6a'],
      ]);
      c.fill();
      c.beginPath();
      c.moveTo(24, 0);
      c.lineTo(40, -12);
      c.lineTo(40, 12);
      c.fillStyle = '#e46a4a';
      c.fill();
      ellipse(c, -16, -4, 3, 3);
      c.fillStyle = '#3a2a22';
      c.fill();
      c.restore();
      continue;
    }
    if (style === 'lantern-star') {
      for (let k = 0; k < 7; k++) {
        const sx = x + sway + Math.sin(k * 1.7) * 18;
        const sy = y - 20 + k * 9;
        c.fillStyle = `rgba(255,236,160,${0.7 + Math.sin(t * 3 + k) * 0.3})`;
        star(c, sx, sy, 5);
      }
      continue;
    }
    ellipse(c, x + sway, y, 20, 26);
    c.fillStyle = rad(c, x + sway - 5, y - 5, 2, 28, [
      [0, lighten('#f6e7c8', 0.3 + glow * 0.3)],
      [1, darken('#e9c98a', 0.1 - glow * 0.1)],
    ]);
    c.fill();
    c.strokeStyle = 'rgba(120,80,40,0.45)';
    c.lineWidth = 1;
    for (let k = -16; k <= 16; k += 8) {
      const hw = Math.sqrt(Math.max(0, 1 - (k / 26) ** 2)) * 20;
      c.beginPath();
      c.moveTo(x + sway - hw, y + k);
      c.lineTo(x + sway + hw, y + k);
      c.stroke();
    }
    c.fillStyle = '#3a2a22';
    rr(c, x + sway - 9, y - 28, 18, 5, 2);
    c.fill();
    rr(c, x + sway - 9, y + 23, 18, 5, 2);
    c.fill();
    text(c, '雪', x + sway, y + 1, 13, rgba('#d9573f', 0.85), { font: 'brush', weight: 700 });
  }
}

function star(c: Ctx, x: number, y: number, s: number) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? s * 0.45 : s;
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  c.closePath();
  c.fill();
}

function pine(c: Ctx, x: number, y: number) {
  rr(c, x - 18, y - 16, 36, 18, 4);
  c.fillStyle = '#56638c';
  c.fill();
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(x - 22 + i * 4, y - 16 - i * 14);
    c.lineTo(x, y - 40 - i * 14);
    c.lineTo(x + 22 - i * 4, y - 16 - i * 14);
    c.fillStyle = ['#5f8a52', '#6e9a5e', '#7fab6c'][i];
    c.fill();
    ellipse(c, x - 4, y - 30 - i * 14, 8, 3);
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.fill();
  }
}

function camellia(c: Ctx, x: number, y: number) {
  ellipse(c, x, y - 14, 14, 18);
  c.fillStyle = '#e9e4da';
  c.fill();
  c.strokeStyle = '#5f8a52';
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(x, y - 26);
  c.quadraticCurveTo(x - 10, y - 50, x - 18, y - 64);
  c.moveTo(x, y - 30);
  c.quadraticCurveTo(x + 12, y - 48, x + 16, y - 62);
  c.stroke();
  for (const [dx, dy] of [
    [-18, -64],
    [16, -62],
    [-4, -48],
  ]) {
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      ellipse(c, x + dx + Math.cos(a) * 5, y + dy + Math.sin(a) * 5, 5, 5);
      c.fillStyle = '#d94a5a';
      c.fill();
    }
    ellipse(c, x + dx, y + dy, 3, 3);
    c.fillStyle = '#f2c230';
    c.fill();
  }
}

function luckyCat(c: Ctx, x: number, y: number) {
  rr(c, x - 16, y - 34, 32, 34, 12);
  c.fillStyle = '#fbf8f2';
  c.fill();
  ellipse(c, x, y - 42, 15, 13);
  c.fill();
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(x + s * 12, y - 48);
    c.lineTo(x + s * 13, y - 60);
    c.lineTo(x + s * 4, y - 53);
    c.fill();
  }
  rr(c, x + 10, y - 62, 9, 20, 4);
  c.fill();
  c.fillStyle = '#d9473f';
  rr(c, x - 12, y - 32, 24, 4, 2);
  c.fill();
  ellipse(c, x, y - 26, 4, 4);
  c.fillStyle = '#f2c230';
  c.fill();
  c.strokeStyle = '#3a2a22';
  c.lineWidth = 1.4;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.arc(x + s * 5, y - 43, 2.5, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
  }
}

function daruma(c: Ctx, x: number, y: number) {
  ellipse(c, x, y - 22, 20, 23);
  c.fillStyle = rad(c, x - 6, y - 30, 2, 26, [
    [0, '#ee6a5a'],
    [1, '#c23a2e'],
  ]);
  c.fill();
  ellipse(c, x, y - 28, 12, 10);
  c.fillStyle = '#fbf3e6';
  c.fill();
  ellipse(c, x - 4, y - 29, 2.6, 2.6);
  c.fillStyle = '#2a2026';
  c.fill();
  c.strokeStyle = '#e9b45c';
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(x, y - 14, 9, 0.2, Math.PI - 0.2);
  c.stroke();
}

/** brass register; the change box is a little paper slip next to it */
export function drawRegister(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  amount: string,
  open: number,
  t: number
) {
  const h = w * 0.72;
  contactShadow(c, x, y + h * 0.15, w * 0.6, h * 0.1, 0.4);
  c.save();
  c.translate(x, y + h * 0.1);
  const d = open * w * 0.12;
  rr(c, -w * 0.48, -h * 0.2 + d, w * 0.96, h * 0.24, 6);
  c.fillStyle = lin(c, 0, -h * 0.2, 0, h * 0.1, [
    [0, '#b98b45'],
    [1, '#7a5a22'],
  ]);
  c.fill();
  c.beginPath();
  c.moveTo(-w * 0.46, -h * 0.2);
  c.lineTo(-w * 0.38, -h * 0.78);
  c.lineTo(w * 0.38, -h * 0.78);
  c.lineTo(w * 0.46, -h * 0.2);
  c.closePath();
  c.fillStyle = lin(c, -w / 2, 0, w / 2, 0, [
    [0, '#8a6020'],
    [0.3, '#ecd08a'],
    [0.55, '#c99a45'],
    [1, '#7a5216'],
  ]);
  c.fill();
  for (let r = 0; r < 2; r++)
    for (let k = 0; k < 5; k++) {
      const kx = -w * 0.28 + k * w * 0.14;
      const ky = -h * 0.34 - r * h * 0.14;
      ellipse(c, kx, ky + 2, w * 0.045, w * 0.03);
      c.fillStyle = '#5a3e18';
      c.fill();
      ellipse(c, kx, ky, w * 0.045, w * 0.03);
      c.fillStyle = r === 0 && k === 4 ? '#ef8f7a' : '#f8efe0';
      c.fill();
    }
  rr(c, -w * 0.3, -h * 1.1, w * 0.6, h * 0.34, 6);
  c.fillStyle = lin(c, 0, -h * 1.1, 0, -h * 0.76, [
    [0, '#ecd08a'],
    [1, '#9a6e28'],
  ]);
  c.fill();
  rr(c, -w * 0.24, -h * 1.04, w * 0.48, h * 0.2, 4);
  c.fillStyle = '#2c2a26';
  c.fill();
  c.fillStyle = rad(c, 0, -h * 0.94, 0, w * 0.3, [
    [0, rgba('#ffd98a', 0.25 + Math.sin(t * 3) * 0.03)],
    [1, 'rgba(255,217,138,0)'],
  ]);
  c.fillRect(-w * 0.3, -h * 1.15, w * 0.6, h * 0.3);
  text(c, amount, 0, -h * 0.94, w * 0.13, '#ffcf6a', { font: 'type', weight: 700 });
  sheen(c, -w * 0.2, -h * 0.6, w * 0.08, h * 0.12, 0.45);
  c.restore();
}

/** the little box that shows the bill, what was paid and the change */
export function drawChangeBox(
  c: Ctx,
  x: number,
  y: number,
  bill: string,
  paid: string,
  change: string,
  flash: boolean
) {
  const w = 170;
  const h = 88;
  c.save();
  c.translate(x, y);
  c.rotate(-0.03);
  contactShadow(c, w / 2, h + 4, w * 0.5, 6, 0.3);
  rr(c, 0, 0, w, h, 8);
  c.fillStyle = flash ? '#fff1ec' : '#fffdf6';
  c.fill();
  c.strokeStyle = flash ? '#d9573f' : rgba('#8a6040', 0.4);
  c.lineWidth = flash ? 2.5 : 1.2;
  c.stroke();
  const row = (k: string, v: string, yy: number, big = false) => {
    text(c, k, 12, yy, big ? 15 : 13, big ? '#3e2e24' : '#7a6656', {
      align: 'left',
      font: 'type',
      weight: big ? 700 : 400,
    });
    text(c, v, w - 12, yy, big ? 18 : 13, big ? '#4f7a3e' : '#3e2e24', {
      align: 'right',
      font: 'type',
      weight: 700,
    });
  };
  row(tt('bill'), bill, 18);
  row(tt('paid'), paid, 38);
  c.strokeStyle = '#cdbda6';
  c.setLineDash([4, 3]);
  c.beginPath();
  c.moveTo(10, 52);
  c.lineTo(w - 10, 52);
  c.stroke();
  c.setLineDash([]);
  row(tt('change'), change, 70, true);
  c.restore();
}

export function drawJar(c: Ctx, x: number, y: number, w: number, coins: Coin[]) {
  const h = w * 1.25;
  contactShadow(c, x, y + 2, w * 0.6, w * 0.12, 0.3);
  ellipse(c, x, y - h * 0.5, w * 0.5, h * 0.5);
  c.fillStyle = 'rgba(210,230,240,0.3)';
  c.fill();
  for (const coin of coins) {
    if (coin.y < -0.2) continue;
    const cy = Math.min(y - 8 - (1 - coin.y) * h * 0.75, y - 6);
    const col = coin.kind === 0 ? '#e9c25a' : coin.kind === 1 ? '#d8d2c4' : '#c98a52';
    ellipse(c, x + coin.x * w * 0.5, cy, w * 0.12, w * 0.055);
    c.fillStyle = darken(col, 0.25);
    c.fill();
    ellipse(c, x + coin.x * w * 0.5, cy - 1.5, w * 0.12, w * 0.05);
    c.fillStyle = lighten(col, 0.2);
    c.fill();
  }
  ellipse(c, x, y - h * 0.5, w * 0.5, h * 0.5);
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.lineWidth = 2;
  c.stroke();
  sheen(c, x - w * 0.25, y - h * 0.55, w * 0.08, h * 0.3, 0.55);
  rr(c, x - w * 0.26, y - h * 1.05, w * 0.52, h * 0.14, 4);
  c.fillStyle = '#c99a6b';
  c.fill();
  rr(c, x - w * 0.34, y - h * 0.62, w * 0.68, h * 0.22, 3);
  c.fillStyle = '#f7ecd6';
  c.fill();
  text(c, tt('tipJar'), x, y - h * 0.51, w * 0.15, '#8a3b2a', {
    font: 'type',
    weight: 700,
    maxW: w * 0.62,
  });
}

/** Pip the penguin helper standing on the sill corner */
export function drawPip(
  c: Ctx,
  x: number,
  y: number,
  s: number,
  t: number,
  mood: Mood,
  talking: boolean
) {
  const L = CHAR_LOOKS.pip;
  const bob = Math.abs(Math.sin(t * 2.2)) * 3;
  c.save();
  c.translate(x, y - bob);
  drawBust(c, L, s * 0.42, { mood, talk: talking ? (Math.sin(t * 22) + 1) / 2 : 0, t });
  c.restore();
  drawPaws(c, L, s * 0.42, x, y + 2, t, false);
  // little feet
  for (const k of [-1, 1]) {
    ellipse(c, x + k * s * 0.18, y + 4, s * 0.12, s * 0.05);
    c.fillStyle = '#f0a23a';
    c.fill();
  }
}
