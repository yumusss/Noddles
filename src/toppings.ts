// Realistic topping illustrations, drawn procedurally on a 256px canvas
// (designed in a 128-unit space, centre 64,64, then scaled 2x for detail).
// Each one is built from organic shapes, smooth fBm texture, ambient-occlusion
// edges and wet specular highlights so it reads like food photography.

type Ctx = CanvasRenderingContext2D;
export type TDraw = (c: Ctx, r: () => number) => void;
const TAU = Math.PI * 2;

function mk(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// ---------- textures ----------
let fbmC: HTMLCanvasElement | null = null;
/** Smooth tileable fractal noise (grey), used for organic mottling. */
function fbm() {
  if (fbmC) return fbmC;
  const N = 256;
  fbmC = mk(N, N);
  const x = fbmC.getContext('2d')!;
  const img = x.createImageData(N, N);
  let seed = 1234567;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  const acc = new Float32Array(N * N);
  let amp = 1;
  let tot = 0;
  for (const cells of [4, 8, 16, 32, 64]) {
    const g = new Float32Array(cells * cells).map(() => rnd());
    const s = N / cells;
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const fx = i / s;
        const fy = j / s;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fx - x0;
        const ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx);
        const sy = ty * ty * (3 - 2 * ty);
        const a = g[(y0 % cells) * cells + (x0 % cells)];
        const b = g[(y0 % cells) * cells + ((x0 + 1) % cells)];
        const c = g[((y0 + 1) % cells) * cells + (x0 % cells)];
        const d = g[((y0 + 1) % cells) * cells + ((x0 + 1) % cells)];
        acc[j * N + i] += (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy) * amp;
      }
    tot += amp;
    amp *= 0.55;
  }
  for (let k = 0; k < N * N; k++) {
    const v = Math.max(0, Math.min(255, ((acc[k] / tot - 0.5) * 1.9 + 0.5) * 255));
    img.data[k * 4] = img.data[k * 4 + 1] = img.data[k * 4 + 2] = v;
    img.data[k * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return fbmC;
}
let grainC: HTMLCanvasElement | null = null;
function grainTex() {
  if (grainC) return grainC;
  grainC = mk(128, 128);
  const x = grainC.getContext('2d')!;
  const d = x.createImageData(128, 128);
  let seed = 99;
  for (let i = 0; i < d.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const v = (seed >>> 16) & 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return grainC;
}
function tex(
  c: Ctx,
  clip: Path2D,
  which: 'fbm' | 'grain',
  alpha: number,
  mode: GlobalCompositeOperation = 'soft-light',
  scale = 0.5,
  rot = 0,
  ox = 0
) {
  c.save();
  c.clip(clip);
  c.globalAlpha = alpha;
  c.globalCompositeOperation = mode;
  const p = c.createPattern(which === 'fbm' ? fbm() : grainTex(), 'repeat')!;
  p.setTransform(
    new DOMMatrix()
      .translate(ox, ox * 0.7)
      .rotate(rot)
      .scale(scale)
  );
  c.fillStyle = p;
  c.fillRect(-64, -64, 256, 256);
  c.restore();
}
/** Soft darkening just inside an edge, like ambient occlusion. */
function ao(c: Ctx, p: Path2D, color: string, blur: number, width = 2) {
  c.save();
  c.clip(p);
  c.shadowColor = color;
  c.shadowBlur = blur;
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke(p);
  c.restore();
}
/** Wet specular highlight. */
function shine(c: Ctx, x: number, y: number, rx: number, ry: number, rot: number, a: number) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, ry / rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(255,255,255,${a})`);
  g.addColorStop(0.45, `rgba(255,255,255,${a * 0.45})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, rx, 0, TAU);
  c.fill();
  c.restore();
}
function blob(r: () => number, cx: number, cy: number, rad: number, wob: number, n = 16, sy = 1) {
  const p = new Path2D();
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const rr = rad * (1 - wob / 2 + r() * wob);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sy]);
  }
  for (let i = 0; i <= n; i++) {
    const [x0, y0] = pts[i % n];
    const [x1, y1] = pts[(i + 1) % n];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    if (i === 0) p.moveTo(mx, my);
    else p.quadraticCurveTo(x0, y0, mx, my);
  }
  p.closePath();
  return p;
}
function radial(
  c: Ctx,
  x: number,
  y: number,
  r0: number,
  x1: number,
  y1: number,
  r1: number,
  stops: [number, string][]
) {
  const g = c.createRadialGradient(x, y, r0, x1, y1, r1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}
function linear(c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const [o, col] of stops) g.addColorStop(o, col);
  return g;
}
function shadowed(c: Ctx, fn: () => void, blur = 3, oy = 1.5, a = 0.35) {
  c.save();
  c.shadowColor = `rgba(40,18,4,${a})`;
  c.shadowBlur = blur;
  c.shadowOffsetY = oy;
  c.shadowOffsetX = oy * 0.4;
  fn();
  c.restore();
}

// ---------- ajitama: marinated soft-boiled egg, halved ----------
const egg: TDraw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.4);
  c.translate(-64, -64);
  const white = blob(r, 64, 64, 47, 0.05, 18, 0.8);
  c.fillStyle = radial(c, 60, 60, 4, 64, 64, 50, [
    [0, '#fffaf0'],
    [0.62, '#f8ecd6'],
    [0.82, '#e9c99a'],
    [0.93, '#c98a4c'],
    [1, '#8d5626'],
  ]);
  c.fill(white);
  tex(c, white, 'fbm', 0.35, 'soft-light', 0.45, r() * 90, r() * 50);
  ao(c, white, 'rgba(110,60,20,.55)', 6, 2);
  // the set ring of yolk then the jammy, glossy centre
  const yx = 64 + (r() - 0.5) * 4;
  const yy = 65 + (r() - 0.5) * 3;
  const ring = blob(r, yx, yy, 25, 0.08, 14, 0.9);
  c.fillStyle = radial(c, yx - 4, yy - 4, 2, yx, yy, 26, [
    [0, '#ffb43a'],
    [0.75, '#f6a93b'],
    [1, '#f3c36e'],
  ]);
  c.fill(ring);
  tex(c, ring, 'grain', 0.12, 'overlay', 0.4);
  const jam = blob(r, yx + 1, yy + 1, 18, 0.14, 12, 0.92);
  c.fillStyle = radial(c, yx - 3, yy - 4, 1, yx + 1, yy + 1, 19, [
    [0, '#ffb000'],
    [0.45, '#f58a00'],
    [0.85, '#d85f00'],
    [1, '#c65200'],
  ]);
  c.fill(jam);
  tex(c, jam, 'fbm', 0.25, 'soft-light', 0.3);
  ao(c, jam, 'rgba(150,50,0,.55)', 4, 1.5);
  // soft boundary between white and yolk
  c.strokeStyle = 'rgba(255,236,190,.55)';
  c.lineWidth = 1.2;
  c.stroke(ring);
  shine(c, yx - 6, yy - 7, 7, 3.5, -0.5, 0.9);
  shine(c, yx + 7, yy + 6, 4, 1.6, -0.5, 0.35);
  shine(c, 42, 46, 16, 6, -0.7, 0.35);
  c.restore();
};

// ---------- chashu: rolled, seared pork belly slice ----------
const chashu: TDraw = (c, r) => {
  const outer = blob(r, 64, 64, 53, 0.1, 22);
  c.fillStyle = radial(c, 60, 58, 20, 64, 64, 54, [
    [0, '#7a3a1a'],
    [0.8, '#5a2810'],
    [1, '#3a1606'],
  ]);
  c.fill(outer);
  tex(c, outer, 'fbm', 0.6, 'multiply', 0.35, r() * 90);
  // char specks on the seared edge
  c.save();
  c.clip(outer);
  for (let i = 0; i < 70; i++) {
    const a = r() * TAU;
    const d = 46 + r() * 8;
    c.fillStyle = r() < 0.6 ? 'rgba(30,10,2,.55)' : 'rgba(200,110,50,.45)';
    c.beginPath();
    c.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 0.6 + r() * 1.6, 0, TAU);
    c.fill();
  }
  c.restore();
  const face = blob(r, 64, 64, 45, 0.09, 20);
  c.fillStyle = radial(c, 58, 56, 4, 64, 64, 46, [
    [0, '#e3a68a'],
    [0.55, '#cf8a6a'],
    [1, '#a35b3a'],
  ]);
  c.fill(face);
  c.save();
  c.clip(face);
  // a soft layer of fat just inside the seared skin
  c.save();
  c.shadowColor = 'rgba(250,232,214,.9)';
  c.shadowBlur = 4;
  c.strokeStyle = 'rgba(248,228,208,.85)';
  c.lineWidth = 6;
  c.stroke(blob(r, 64, 64, 40, 0.07, 18));
  c.restore();
  // the rolled belly: a smooth spiral of translucent fat through the meat
  const a0 = r() * TAU;
  c.save();
  c.shadowColor = 'rgba(250,232,214,.9)';
  c.shadowBlur = 5;
  c.strokeStyle = 'rgba(246,226,206,.8)';
  c.lineWidth = 5;
  c.lineCap = 'round';
  c.beginPath();
  for (let a = 0; a < TAU * 1.9; a += 0.06) {
    const rr = 4 + a * 4.4;
    const x = 64 + Math.cos(a + a0) * rr;
    const y = 64 + Math.sin(a + a0) * rr * 0.94;
    if (a === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
  // meat grain
  c.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const a = r() * TAU;
    const d = 4 + r() * 40;
    const x = 64 + Math.cos(a) * d;
    const y = 64 + Math.sin(a) * d;
    const t = a + Math.PI / 2 + (r() - 0.5) * 0.4;
    c.strokeStyle = r() < 0.5 ? 'rgba(120,50,28,.22)' : 'rgba(255,220,200,.18)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(t) * 4, y + Math.sin(t) * 4);
    c.stroke();
  }
  c.restore();
  tex(c, face, 'fbm', 0.35, 'soft-light', 0.4, r() * 90);
  ao(c, face, 'rgba(90,30,10,.6)', 7, 2.5);
  // tare glaze sheen
  shine(c, 46, 44, 22, 8, -0.7, 0.38);
  shine(c, 76, 80, 10, 3, -0.7, 0.2);
};

// ---------- negi: finely sliced scallion rings ----------
function ring(c: Ctx, r: () => number, x: number, y: number, R: number, whiteish: boolean) {
  const rot = r() * Math.PI;
  const sq = 0.55 + r() * 0.42;
  const wall = R * (whiteish ? 0.42 : 0.34 + r() * 0.06);
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, sq);
  const p = new Path2D();
  p.arc(0, 0, R, 0, TAU);
  p.moveTo(R - wall, 0);
  p.arc(0, 0, R - wall, 0, TAU, true);
  shadowed(
    c,
    () => {
      c.fillStyle = whiteish
        ? radial(c, -R * 0.3, -R * 0.3, R * 0.2, 0, 0, R, [
            [0, '#fbfdf0'],
            [0.7, '#e7f1cf'],
            [1, '#b7d38e'],
          ])
        : radial(c, -R * 0.3, -R * 0.3, R * 0.2, 0, 0, R, [
            [0, '#bfe89a'],
            [0.6, '#6dbb45'],
            [1, '#2f7d22'],
          ]);
      c.fill(p, 'evenodd');
      // translucent membrane over the hollow
      c.fillStyle = whiteish ? 'rgba(240,248,215,.55)' : 'rgba(200,235,160,.42)';
      c.beginPath();
      c.arc(0, 0, R - wall, 0, TAU);
      c.fill();
    },
    2.5,
    1.2,
    0.4
  );
  // translucent inner membrane and darker skin
  c.lineWidth = 0.9;
  c.strokeStyle = whiteish ? 'rgba(140,170,100,.7)' : 'rgba(25,80,20,.85)';
  c.beginPath();
  c.arc(0, 0, R - 0.3, 0, TAU);
  c.stroke();
  c.strokeStyle = 'rgba(235,252,215,.85)';
  c.lineWidth = 0.9;
  c.beginPath();
  c.arc(0, 0, R - wall + 0.3, 0, TAU);
  c.stroke();
  c.strokeStyle = 'rgba(255,255,255,.85)';
  c.lineWidth = 1.1;
  c.lineCap = 'round';
  c.beginPath();
  c.arc(0, 0, R - wall * 0.45, Math.PI * 1.1, Math.PI * 1.5);
  c.stroke();
  c.restore();
}
const scallion: TDraw = (c, r) => {
  const n = 16 + Math.floor(r() * 6);
  for (let i = 0; i < n; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r()) * 30;
    ring(c, r, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 6 + r() * 3, r() < 0.2);
  }
};

// ---------- nori: toasted seaweed sheet, its lower edge soaked ----------
const nori: TDraw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.2);
  const p = new Path2D();
  const jag = () => (r() - 0.5) * 1.6;
  p.moveTo(-30 + jag(), -52);
  for (let x = -30; x <= 30; x += 6) p.lineTo(x, -52 + jag());
  for (let y = -52; y <= 52; y += 6) p.lineTo(31 + jag(), y);
  for (let x = 30; x >= -30; x -= 6) p.lineTo(x, 53 + jag());
  for (let y = 52; y >= -52; y -= 6) p.lineTo(-31 + jag(), y);
  p.closePath();
  c.fillStyle = linear(c, -30, -52, 30, 52, [
    [0, '#1d3122'],
    [0.5, '#142219'],
    [1, '#0d1711'],
  ]);
  c.fill(p);
  c.save();
  c.clip(p);
  // pressed fibres
  for (let i = 0; i < 260; i++) {
    const x = -32 + r() * 64;
    const y = -54 + r() * 108;
    const a = r() * TAU;
    const l = 1.5 + r() * 4;
    c.strokeStyle = r() < 0.5 ? 'rgba(90,130,95,.35)' : 'rgba(0,0,0,.4)';
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  // soaked, glossy lower part
  c.fillStyle = linear(c, 0, 10, 0, 54, [
    [0, 'rgba(5,10,6,0)'],
    [1, 'rgba(5,10,6,.55)'],
  ]);
  c.fillRect(-40, 10, 80, 50);
  c.restore();
  tex(c, p, 'fbm', 0.4, 'soft-light', 0.3);
  // green-violet sheen like real nori
  c.save();
  c.clip(p);
  c.globalCompositeOperation = 'screen';
  c.fillStyle = linear(c, -30, -50, 30, 10, [
    [0, 'rgba(70,120,90,.0)'],
    [0.45, 'rgba(90,150,110,.28)'],
    [0.6, 'rgba(120,110,160,.12)'],
    [1, 'rgba(70,120,90,0)'],
  ]);
  c.fillRect(-40, -60, 80, 120);
  c.restore();
  shine(c, -8, 30, 18, 4, 0, 0.18);
  c.restore();
};

// ---------- sweet corn kernels ----------
function kernel(c: Ctx, r: () => number, x: number, y: number, s: number) {
  c.save();
  c.translate(x, y);
  c.rotate(r() * TAU);
  c.scale(s, s);
  const p = new Path2D();
  p.moveTo(-5.5, -4);
  p.quadraticCurveTo(0, -7.5, 5.5, -4);
  p.quadraticCurveTo(7, 2, 3, 6);
  p.quadraticCurveTo(0, 7.5, -3, 6);
  p.quadraticCurveTo(-7, 2, -5.5, -4);
  shadowed(
    c,
    () => {
      c.fillStyle = radial(c, -1.5, -2.5, 0.5, 0, 0, 8, [
        [0, '#fff3b0'],
        [0.5, '#ffd43e'],
        [1, '#d99400'],
      ]);
      c.fill(p);
    },
    2,
    1,
    0.45
  );
  c.strokeStyle = 'rgba(190,120,0,.4)';
  c.lineWidth = 0.5;
  c.stroke(p);
  c.fillStyle = 'rgba(235,170,40,.5)';
  c.beginPath();
  c.ellipse(0, 4.6, 2, 1, 0, 0, TAU);
  c.fill();
  shine(c, -1.8, -2.2, 2.6, 1.3, -0.4, 0.95);
  c.restore();
}
const corn: TDraw = (c, r) => {
  for (let i = 0; i < 22; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r()) * 30;
    kernel(c, r, 64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 0.9 + r() * 0.25);
  }
};

// ---------- simmered shiitake with a decorative star cut ----------
const shiitake: TDraw = (c, r) => {
  const cap = blob(r, 64, 64, 46, 0.1, 18);
  shadowed(
    c,
    () => {
      c.fillStyle = radial(c, 58, 56, 4, 64, 64, 48, [
        [0, '#6e4428'],
        [0.75, '#55321c'],
        [0.92, '#7d5434'],
        [1, '#9a7048'],
      ]);
      c.fill(cap);
    },
    4,
    2,
    0.4
  );
  tex(c, cap, 'fbm', 0.55, 'multiply', 0.35, r() * 90);
  tex(c, cap, 'grain', 0.12, 'overlay', 0.5);
  // star-shaped incision exposing the pale flesh
  const ang = r() * Math.PI;
  for (let i = 0; i < 3; i++) {
    const a = ang + (i * Math.PI) / 3;
    const groove = new Path2D();
    const L = 27;
    const w = 3.2;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    groove.moveTo(64 - dx * L, 64 - dy * L);
    groove.quadraticCurveTo(64 - dy * w, 64 + dx * w, 64 + dx * L, 64 + dy * L);
    groove.quadraticCurveTo(64 + dy * w, 64 - dx * w, 64 - dx * L, 64 - dy * L);
    c.fillStyle = linear(c, 64 - dy * w, 64 + dx * w, 64 + dy * w, 64 - dx * w, [
      [0, '#b8996c'],
      [0.5, '#f2e3c4'],
      [1, '#d5bd92'],
    ]);
    c.fill(groove);
    ao(c, groove, 'rgba(70,40,15,.6)', 2, 1);
  }
  ao(c, cap, 'rgba(40,20,5,.5)', 6, 2);
  shine(c, 46, 44, 20, 8, -0.7, 0.4);
  shine(c, 80, 78, 8, 3, -0.7, 0.18);
};

// ---------- rayu: chili oil with flakes and seeds ----------
const chiliOil: TDraw = (c, r) => {
  for (let i = 0; i < 7; i++) {
    const x = 64 + (r() - 0.5) * 58;
    const y = 64 + (r() - 0.5) * 48;
    const rr = 9 + r() * 14;
    const p = blob(r, x, y, rr, 0.45, 14, 0.7);
    c.fillStyle = radial(c, x, y, 1, x, y, rr, [
      [0, 'rgba(255,120,40,.28)'],
      [0.75, 'rgba(230,70,15,.42)'],
      [1, 'rgba(170,30,5,.62)'],
    ]);
    c.fill(p);
    c.strokeStyle = 'rgba(190,40,10,.55)';
    c.lineWidth = 0.7;
    c.stroke(p);
    shine(c, x - rr * 0.3, y - rr * 0.25, rr * 0.5, rr * 0.12, -0.4, 0.55);
  }
  for (let i = 0; i < 44; i++) {
    const x = 64 + (r() - 0.5) * 66;
    const y = 64 + (r() - 0.5) * 56;
    c.save();
    c.translate(x, y);
    c.rotate(r() * TAU);
    if (r() < 0.7) {
      c.fillStyle = r() < 0.5 ? '#7a1004' : '#a8200a';
      c.beginPath();
      c.moveTo(-2.2, -1);
      c.lineTo(1.5, -1.8);
      c.lineTo(2.4, 1.2);
      c.lineTo(-1.2, 1.8);
      c.closePath();
      c.fill();
    } else {
      c.fillStyle = '#f2d98a';
      c.beginPath();
      c.ellipse(0, 0, 1.6, 0.9, 0, 0, TAU);
      c.fill();
    }
    c.restore();
  }
};

// ---------- atsuage: fried tofu cube ----------
const tofu: TDraw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.8);
  // visible side faces give the cube depth
  const side = new Path2D();
  side.roundRect(-27, -24, 56, 56, 8);
  shadowed(
    c,
    () => {
      c.fillStyle = '#9a5c1c';
      c.fill(side);
    },
    5,
    3,
    0.45
  );
  const top = new Path2D();
  top.roundRect(-28, -28, 54, 52, 9);
  c.fillStyle = radial(c, -10, -12, 4, 0, 0, 40, [
    [0, '#f4c777'],
    [0.6, '#dd9d48'],
    [1, '#b8742a'],
  ]);
  c.fill(top);
  tex(c, top, 'fbm', 0.22, 'soft-light', 0.25);
  // crisp pores
  c.save();
  c.clip(top);
  for (let i = 0; i < 70; i++) {
    const x = -28 + r() * 54;
    const y = -28 + r() * 52;
    c.fillStyle = 'rgba(120,60,10,.45)';
    c.beginPath();
    c.ellipse(x, y, 0.6 + r() * 1.2, 0.5 + r() * 0.8, r() * 3, 0, TAU);
    c.fill();
    c.fillStyle = 'rgba(255,230,170,.5)';
    c.beginPath();
    c.arc(x - 0.6, y - 0.6, 0.4, 0, TAU);
    c.fill();
  }
  c.restore();
  ao(c, top, 'rgba(110,50,5,.5)', 5, 2);
  shine(c, -10, -14, 16, 6, -0.6, 0.4);
  c.restore();
};

// ---------- ebi tempura ----------
const shrimp: TDraw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.4 - 0.5);
  // tail
  const tail = new Path2D();
  tail.moveTo(36, -2);
  tail.quadraticCurveTo(50, -20, 60, -16);
  tail.quadraticCurveTo(54, -2, 62, 14);
  tail.quadraticCurveTo(48, 14, 36, 4);
  tail.closePath();
  c.fillStyle = linear(c, 36, 0, 62, 0, [
    [0, '#c2361a'],
    [0.6, '#ec5a2a'],
    [1, '#ff9a6a'],
  ]);
  c.fill(tail);
  c.strokeStyle = 'rgba(120,20,5,.6)';
  c.lineWidth = 0.8;
  for (const t of [-8, 0, 8]) {
    c.beginPath();
    c.moveTo(40, t * 0.4);
    c.lineTo(58, t * 1.6);
    c.stroke();
  }
  // batter body: jagged, crunchy outline
  const body = new Path2D();
  const pts: [number, number][] = [];
  for (let i = 0; i < 60; i++) {
    const t = i / 60;
    const a = t * TAU;
    const rx = 48;
    const ry = 18 + Math.cos(a) * 3;
    const j = 1 + (r() - 0.5) * 0.16;
    pts.push([Math.cos(a) * rx * j - 8, Math.sin(a) * ry * j + Math.cos(a * 2) * 3]);
  }
  pts.forEach(([x, y], i) => (i ? body.lineTo(x, y) : body.moveTo(x, y)));
  body.closePath();
  shadowed(
    c,
    () => {
      c.fillStyle = radial(c, -14, -6, 4, -8, 0, 50, [
        [0, '#f1c27a'],
        [0.6, '#d9973f'],
        [1, '#b06a22'],
      ]);
      c.fill(body);
    },
    5,
    3,
    0.45
  );
  c.save();
  c.clip(body);
  for (let i = 0; i < 120; i++) {
    const x = -56 + r() * 96;
    const y = -22 + r() * 44;
    const rr = 1.2 + r() * 3.4;
    c.fillStyle = 'rgba(110,55,10,.35)';
    c.beginPath();
    c.arc(x + 0.8, y + 0.9, rr, 0, TAU);
    c.fill();
    c.fillStyle = radial(c, x - rr * 0.3, y - rr * 0.3, 0.2, x, y, rr, [
      [0, '#fff0c4'],
      [1, 'rgba(230,170,80,.9)'],
    ]);
    c.beginPath();
    c.arc(x, y, rr, 0, TAU);
    c.fill();
  }
  c.restore();
  tex(c, body, 'fbm', 0.35, 'soft-light', 0.3);
  ao(c, body, 'rgba(120,60,10,.5)', 5, 2);
  shine(c, -18, -8, 22, 5, -0.1, 0.3);
  c.restore();
};

// ---------- naruto: fishcake with a scalloped edge ----------
const naruto: TDraw = (c, r) => {
  const p = new Path2D();
  const n = 26;
  for (let i = 0; i <= n * 4; i++) {
    const a = (i / (n * 4)) * TAU;
    const rr = 40 + Math.abs(Math.sin((a * n) / 2)) * 3.2;
    const x = 64 + Math.cos(a) * rr;
    const y = 64 + Math.sin(a) * rr;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  shadowed(
    c,
    () => {
      c.fillStyle = radial(c, 58, 56, 4, 64, 64, 44, [
        [0, '#ffffff'],
        [0.75, '#f7f2ea'],
        [1, '#e2d8ca'],
      ]);
      c.fill(p);
    },
    4,
    2,
    0.35
  );
  tex(c, p, 'fbm', 0.18, 'soft-light', 0.5);
  c.save();
  c.clip(p);
  c.shadowColor = 'rgba(236,80,140,.8)';
  c.shadowBlur = 3;
  c.strokeStyle = '#ec5a96';
  c.lineWidth = 4.6;
  c.lineCap = 'round';
  c.beginPath();
  const a0 = r() * TAU;
  for (let a = 0, rr = 1.5; a < TAU * 2.8; a += 0.08, rr += 0.18) {
    const x = 64 + Math.cos(a + a0) * rr;
    const y = 64 + Math.sin(a + a0) * rr;
    if (a === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
  ao(c, p, 'rgba(150,130,110,.5)', 4, 1.5);
  shine(c, 50, 48, 16, 6, -0.6, 0.5);
};

// ---------- menma: fermented bamboo shoots ----------
const bamboo: TDraw = (c, r) => {
  const n = 5;
  for (let i = 0; i < n; i++) {
    c.save();
    c.translate(30 + i * 17 + (r() - 0.5) * 4, 64 + (r() - 0.5) * 10);
    c.rotate((r() - 0.5) * 0.6);
    const w = 6 + r() * 3;
    const L = 34 + r() * 10;
    const p = new Path2D();
    p.moveTo(-w, -L);
    p.quadraticCurveTo(0, -L - 3, w, -L + 1);
    p.lineTo(w * 0.85, L);
    p.quadraticCurveTo(0, L + 2, -w * 0.9, L - 1);
    p.closePath();
    shadowed(
      c,
      () => {
        c.fillStyle = linear(c, -w, 0, w, 0, [
          [0, '#8f5f22'],
          [0.45, '#d6a75d'],
          [0.7, '#c8934a'],
          [1, '#9a6a2a'],
        ]);
        c.fill(p);
      },
      3,
      1.5,
      0.4
    );
    c.save();
    c.clip(p);
    for (let k = 0; k < 9; k++) {
      const x = -w + (k / 8) * w * 2 + (r() - 0.5);
      c.strokeStyle = r() < 0.5 ? 'rgba(110,65,15,.35)' : 'rgba(255,225,160,.35)';
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(x, -L);
      c.lineTo(x + (r() - 0.5) * 2, L);
      c.stroke();
    }
    c.restore();
    tex(c, p, 'fbm', 0.3, 'soft-light', 0.3, r() * 90);
    shine(c, -w * 0.25, -L * 0.3, 2.4, L * 0.5, 0, 0.45);
    c.restore();
  }
};

// ---------- toasted sesame seeds ----------
const sesame: TDraw = (c, r) => {
  for (let i = 0; i < 34; i++) {
    const a = r() * TAU;
    const d = Math.sqrt(r()) * 40;
    const black = r() < 0.15;
    c.save();
    c.translate(64 + Math.cos(a) * d, 64 + Math.sin(a) * d);
    c.rotate(r() * TAU);
    const p = new Path2D();
    p.moveTo(-4, 0);
    p.quadraticCurveTo(-1, -2.6, 4, 0);
    p.quadraticCurveTo(-1, 2.6, -4, 0);
    shadowed(
      c,
      () => {
        c.fillStyle = black
          ? linear(c, -4, -2, 4, 2, [
              [0, '#4a403a'],
              [1, '#141010'],
            ])
          : linear(c, -4, -2, 4, 2, [
              [0, '#fff6de'],
              [0.6, '#ecd5a0'],
              [1, '#c9a865'],
            ]);
        c.fill(p);
      },
      1.2,
      0.6,
      0.35
    );
    c.strokeStyle = black ? 'rgba(255,255,255,.15)' : 'rgba(170,130,60,.5)';
    c.lineWidth = 0.4;
    c.beginPath();
    c.moveTo(-3, 0);
    c.lineTo(3.4, 0);
    c.stroke();
    c.restore();
  }
};

// ---------- blanched baby bok choy ----------
const pakchoi: TDraw = (c, r) => {
  c.save();
  c.translate(64, 64);
  c.rotate((r() - 0.5) * 0.5);
  const leaf = new Path2D();
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    const a = Math.PI * (0.05 + t * 0.9) + Math.PI;
    const rr = 46 + Math.sin(t * 38) * 2.4 + (r() - 0.5) * 2;
    pts.push([Math.cos(a) * rr * 0.86, Math.sin(a) * rr + 8]);
  }
  leaf.moveTo(-14, 52);
  pts.forEach(([x, y]) => leaf.lineTo(x, y));
  leaf.lineTo(14, 52);
  leaf.closePath();
  shadowed(
    c,
    () => {
      c.fillStyle = radial(c, -6, -20, 4, 0, -6, 56, [
        [0, '#5fae49'],
        [0.6, '#2f7a2a'],
        [1, '#174a16'],
      ]);
      c.fill(leaf);
    },
    4,
    2,
    0.4
  );
  tex(c, leaf, 'fbm', 0.45, 'soft-light', 0.35);
  c.save();
  c.clip(leaf);
  c.strokeStyle = 'rgba(200,235,170,.45)';
  c.lineWidth = 1;
  for (let i = -4; i <= 4; i++) {
    c.beginPath();
    c.moveTo(0, 20);
    c.quadraticCurveTo(i * 6, -4, i * 11, -30 - Math.abs(i) * 1.5);
    c.stroke();
  }
  c.restore();
  // pale, ribbed stem
  const stem = new Path2D();
  stem.moveTo(-15, 56);
  stem.bezierCurveTo(-22, 20, -12, -14, 0, -26);
  stem.bezierCurveTo(12, -14, 22, 20, 15, 56);
  stem.quadraticCurveTo(0, 60, -15, 56);
  c.fillStyle = linear(c, -18, 0, 18, 0, [
    [0, '#b9d898'],
    [0.35, '#eef8dc'],
    [0.6, '#f8fdee'],
    [1, '#b2d48e'],
  ]);
  c.fill(stem);
  c.save();
  c.clip(stem);
  c.strokeStyle = 'rgba(150,190,110,.45)';
  c.lineWidth = 0.8;
  for (let i = -3; i <= 3; i++) {
    c.beginPath();
    c.moveTo(i * 4, 58);
    c.quadraticCurveTo(i * 3.4, 20, i * 1.2, -22);
    c.stroke();
  }
  c.restore();
  ao(c, stem, 'rgba(90,130,60,.45)', 3, 1);
  shine(c, -6, 10, 4, 22, 0.08, 0.55);
  shine(c, -18, -20, 14, 5, -0.9, 0.3);
  c.restore();
};

// ---------- moyashi: bean sprouts ----------
const sprouts: TDraw = (c, r) => {
  for (let i = 0; i < 12; i++) {
    const x0 = 34 + r() * 60;
    const y0 = 34 + r() * 60;
    const a = r() * TAU;
    const len = 22 + r() * 16;
    const x1 = x0 + Math.cos(a) * len;
    const y1 = y0 + Math.sin(a) * len;
    const mx = (x0 + x1) / 2 + (r() - 0.5) * 22;
    const my = (y0 + y1) / 2 + (r() - 0.5) * 22;
    const path = new Path2D();
    path.moveTo(x0, y0);
    path.quadraticCurveTo(mx, my, x1, y1);
    c.lineCap = 'round';
    shadowed(
      c,
      () => {
        c.strokeStyle = 'rgba(205,200,170,.9)';
        c.lineWidth = 4.6;
        c.stroke(path);
      },
      2,
      1,
      0.3
    );
    c.strokeStyle = 'rgba(248,246,232,.95)';
    c.lineWidth = 3.4;
    c.stroke(path);
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = 1;
    c.stroke(path);
    // little root tail
    c.strokeStyle = 'rgba(190,180,150,.8)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x0 - Math.cos(a) * 6 + (r() - 0.5) * 3, y0 - Math.sin(a) * 6 + (r() - 0.5) * 3);
    c.stroke();
    // split yellow head
    c.save();
    c.translate(x1, y1);
    c.rotate(a);
    for (const s of [-1, 1]) {
      c.fillStyle = radial(c, 1, s * 1, 0.3, 1, s * 1.4, 4, [
        [0, '#fff6b8'],
        [1, '#d9c24a'],
      ]);
      c.beginPath();
      c.ellipse(2, s * 1.4, 4, 2.2, s * 0.25, 0, TAU);
      c.fill();
    }
    c.restore();
  }
};

// ---------- fresh red chili rings ----------
const chili: TDraw = (c, r) => {
  for (let i = 0; i < 8; i++) {
    const x = 64 + (r() - 0.5) * 62;
    const y = 64 + (r() - 0.5) * 62;
    const R = 7 + r() * 3.5;
    c.save();
    c.translate(x, y);
    c.rotate(r() * TAU);
    c.scale(1, 0.75 + r() * 0.25);
    const p = new Path2D();
    p.arc(0, 0, R, 0, TAU);
    p.moveTo(R - 1.8, 0);
    p.arc(0, 0, R - 1.8, 0, TAU, true);
    shadowed(
      c,
      () => {
        c.fillStyle = radial(c, -R * 0.3, -R * 0.3, 1, 0, 0, R, [
          [0, '#ff6a48'],
          [0.7, '#d81e10'],
          [1, '#8a0a06'],
        ]);
        c.fill(p, 'evenodd');
      },
      2,
      1,
      0.4
    );
    // pale pith and seeds inside
    c.fillStyle = 'rgba(255,215,180,.35)';
    c.beginPath();
    c.arc(0, 0, R - 1.8, 0, TAU);
    c.fill();
    c.fillStyle = '#f3df9a';
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.ellipse((r() - 0.5) * R * 0.9, (r() - 0.5) * R * 0.9, 1.4, 0.9, r() * 3, 0, TAU);
      c.fill();
    }
    shine(c, -R * 0.45, -R * 0.45, 2.2, 1, -0.6, 0.9);
    c.restore();
  }
};

// ---------- kimchi: napa cabbage in chili paste ----------
const kimchi: TDraw = (c, r) => {
  for (let i = 0; i < 3; i++) {
    const x = 42 + r() * 44;
    const y = 42 + r() * 44;
    c.save();
    c.translate(x, y);
    c.rotate(r() * TAU);
    // ruffled leafy part
    const leaf = blob(r, 6, 0, 20, 0.55, 14, 0.8);
    shadowed(
      c,
      () => {
        c.fillStyle = radial(c, 2, -4, 2, 6, 0, 24, [
          [0, '#f07040'],
          [0.6, '#cf3a1a'],
          [1, '#8e1e08'],
        ]);
        c.fill(leaf);
      },
      3,
      1.5,
      0.4
    );
    // thick rib, white showing through the paste
    const rib = new Path2D();
    rib.moveTo(-16, -6);
    rib.quadraticCurveTo(0, -10, 12, -4);
    rib.lineTo(12, 5);
    rib.quadraticCurveTo(0, 2, -16, 6);
    rib.closePath();
    c.fillStyle = linear(c, 0, -9, 0, 6, [
      [0, '#f8c9a3'],
      [0.5, '#ff9d6a'],
      [1, '#e05a2a'],
    ]);
    c.fill(rib);
    tex(c, leaf, 'fbm', 0.4, 'soft-light', 0.3);
    c.fillStyle = '#6e1204';
    for (let k = 0; k < 10; k++) {
      c.beginPath();
      c.arc((r() - 0.5) * 34, (r() - 0.5) * 26, 0.5 + r() * 0.9, 0, TAU);
      c.fill();
    }
    shine(c, -2, -5, 8, 2.4, -0.1, 0.65);
    shine(c, 10, 6, 6, 2, -0.6, 0.35);
    c.restore();
  }
};

// ---------- lime wedge ----------
const lime: TDraw = (c, r) => {
  c.save();
  c.translate(64, 72);
  c.rotate((r() - 0.5) * 0.8);
  const rind = new Path2D();
  rind.arc(0, 0, 44, Math.PI, TAU);
  rind.quadraticCurveTo(0, 6, -44, 0);
  shadowed(
    c,
    () => {
      c.fillStyle = linear(c, 0, -44, 0, 0, [
        [0, '#4f8f25'],
        [1, '#2f6614'],
      ]);
      c.fill(rind);
    },
    4,
    2,
    0.4
  );
  const pith = new Path2D();
  pith.arc(0, -1, 40, Math.PI, TAU);
  pith.closePath();
  c.fillStyle = '#eef6d6';
  c.fill(pith);
  const pulp = new Path2D();
  pulp.arc(0, -1.5, 36.5, Math.PI, TAU);
  pulp.closePath();
  c.fillStyle = radial(c, 0, -8, 2, 0, -6, 40, [
    [0, '#f4ffd4'],
    [0.6, '#c9ec7a'],
    [1, '#9ccf45'],
  ]);
  c.fill(pulp);
  c.save();
  c.clip(pulp);
  // juice vesicles
  for (let i = 0; i < 160; i++) {
    const a = Math.PI + r() * Math.PI;
    const d = 4 + r() * 32;
    c.save();
    c.translate(Math.cos(a) * d, Math.sin(a) * d - 1.5);
    c.rotate(a);
    c.strokeStyle = r() < 0.5 ? 'rgba(255,255,230,.55)' : 'rgba(110,160,40,.35)';
    c.lineWidth = 0.7;
    c.beginPath();
    c.ellipse(0, 0, 2.6, 0.8, 0, 0, TAU);
    c.stroke();
    c.restore();
  }
  // segment membranes
  c.strokeStyle = 'rgba(250,255,235,.95)';
  c.lineWidth = 1.4;
  for (let i = 1; i < 6; i++) {
    const a = Math.PI + (i / 6) * Math.PI;
    c.beginPath();
    c.moveTo(0, -1.5);
    c.lineTo(Math.cos(a) * 36, Math.sin(a) * 36 - 1.5);
    c.stroke();
  }
  c.restore();
  shine(c, -12, -22, 16, 6, -0.4, 0.5);
  c.restore();
};

// ---------- crispy fried shallots ----------
const shallot: TDraw = (c, r) => {
  c.lineCap = 'round';
  for (let i = 0; i < 22; i++) {
    const x = 64 + (r() - 0.5) * 76;
    const y = 64 + (r() - 0.5) * 76;
    c.save();
    c.translate(x, y);
    c.rotate(r() * TAU);
    const R = 4.5 + r() * 4.5;
    const sweep = Math.PI * (0.7 + r() * 0.8);
    const path = new Path2D();
    path.arc(0, 0, R, 0, sweep);
    shadowed(
      c,
      () => {
        c.strokeStyle = r() < 0.4 ? '#7a3f10' : '#a8601e';
        c.lineWidth = 3;
        c.stroke(path);
      },
      1.5,
      0.8,
      0.4
    );
    c.strokeStyle = 'rgba(240,180,90,.85)';
    c.lineWidth = 1.3;
    c.stroke(path);
    c.strokeStyle = 'rgba(255,235,180,.7)';
    c.lineWidth = 0.5;
    c.stroke(path);
    c.restore();
  }
};

export const TOPPINGS: Record<string, TDraw> = {
  yumurta: egg,
  chashu,
  yesil: scallion,
  nori,
  misir: corn,
  mantar: shiitake,
  aciyag: chiliOil,
  tofu,
  karides: shrimp,
  naruto,
  bambu: bamboo,
  susam: sesame,
  pakchoi,
  filiz: sprouts,
  biber: chili,
  kimchi,
  lime,
  citir: shallot,
};
