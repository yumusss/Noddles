import { useEffect, useRef } from 'react';
import { INGREDIENTS } from '../data';
import { THICK_W, type Thick } from '../food';

// A professional ramen boiler drawn on canvas: tiled wall, stainless stock pot,
// rolling boil, noodle basket (tebo) on a long handle, blue gas flame and steam.

type Mode = 'idle' | 'boil' | 'lift';

interface Props {
  mode: Mode;
  noodle?: string;
  thick?: Thick;
  heat: number; // 0..1.3 cook progress
}

interface Bubble {
  x: number;
  y: number;
  r: number;
  t: number;
  life: number;
}
interface Puff {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  t: number;
  life: number;
}
interface Drop {
  x: number;
  y: number;
  vy: number;
}

const TAU = Math.PI * 2;

export default function Stove(props: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  live.current = props;

  useEffect(() => {
    const cv = ref.current!;
    const c = cv.getContext('2d')!;
    let raf = 0;
    let W = 0;
    let H = 0;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const bubbles: Bubble[] = [];
    const puffs: Puff[] = [];
    const drops: Drop[] = [];
    let lift = 0; // 0 in pot .. 1 lifted
    let last = performance.now();
    let tAll = 0;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    // static background, cached
    let bg: HTMLCanvasElement | null = null;
    let bgKey = '';
    const drawBg = () => {
      const key = `${W}x${H}`;
      if (bg && bgKey === key) return bg;
      bg = document.createElement('canvas');
      bg.width = Math.round(W * dpr);
      bg.height = Math.round(H * dpr);
      const b = bg.getContext('2d')!;
      b.scale(dpr, dpr);
      // subway tiles
      b.fillStyle = '#d9d6cf';
      b.fillRect(0, 0, W, H);
      const tw = 46;
      const th = 22;
      for (let y = 0, row = 0; y < H * 0.6; y += th, row++) {
        for (let x = row % 2 ? -tw / 2 : 0; x < W; x += tw) {
          const g = b.createLinearGradient(x, y, x, y + th);
          g.addColorStop(0, '#f4f2ec');
          g.addColorStop(1, '#d6d2c8');
          b.fillStyle = g;
          b.beginPath();
          b.roundRect(x + 1, y + 1, tw - 2, th - 2, 3);
          b.fill();
          b.fillStyle = 'rgba(255,255,255,.55)';
          b.fillRect(x + 4, y + 3, tw - 14, 2);
        }
      }
      // grease and warm light
      const lg = b.createRadialGradient(W * 0.5, H * 0.45, 20, W * 0.5, H * 0.45, W * 0.8);
      lg.addColorStop(0, 'rgba(255,190,110,.18)');
      lg.addColorStop(1, 'rgba(40,20,10,.55)');
      b.fillStyle = lg;
      b.fillRect(0, 0, W, H);
      // hood
      const hg = b.createLinearGradient(0, 0, 0, 48);
      hg.addColorStop(0, '#5d646e');
      hg.addColorStop(0.6, '#b9c0c9');
      hg.addColorStop(1, '#6c737d');
      b.fillStyle = hg;
      b.beginPath();
      b.moveTo(W * 0.04, 0);
      b.lineTo(W * 0.96, 0);
      b.lineTo(W, 44);
      b.lineTo(0, 44);
      b.closePath();
      b.fill();
      b.fillStyle = '#2b2f36';
      b.fillRect(0, 44, W, 5);
      for (let x = 14; x < W; x += 12) {
        b.fillStyle = 'rgba(0,0,0,.25)';
        b.fillRect(x, 10, 6, 28);
      }
      // range top (stainless)
      const top = H * 0.6;
      const rg = b.createLinearGradient(0, top, 0, H);
      rg.addColorStop(0, '#9aa3ae');
      rg.addColorStop(0.08, '#e3e8ee');
      rg.addColorStop(0.2, '#8b939e');
      rg.addColorStop(1, '#2d3238');
      b.fillStyle = rg;
      b.fillRect(0, top, W, H - top);
      for (let i = 0; i < 160; i++) {
        b.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
        b.fillRect(Math.random() * W, top + Math.random() * (H - top), Math.random() * 40, 1);
      }
      // knobs
      for (let i = 0; i < 3; i++) {
        const kx = W * (0.25 + i * 0.25);
        const ky = top + (H - top) * 0.3;
        const kg = b.createRadialGradient(kx - 4, ky - 4, 2, kx, ky, 14);
        kg.addColorStop(0, '#4a4f57');
        kg.addColorStop(1, '#111316');
        b.fillStyle = kg;
        b.beginPath();
        b.arc(kx, ky, 13, 0, TAU);
        b.fill();
        b.fillStyle = '#e94f37';
        b.fillRect(kx - 1.5, ky - 11, 3, 9);
      }
      bgKey = key;
      return bg;
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tAll += dt;
      const p = live.current;
      const boiling = p.mode === 'boil';
      const target = p.mode === 'lift' ? 1 : 0;
      lift += (target - lift) * Math.min(1, dt * 4);

      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.drawImage(drawBg(), 0, 0, W, H);

      const cx = W / 2;
      const potW = Math.min(W * 0.78, 330);
      const rimY = H * 0.33;
      const baseY = H * 0.6;
      const rx = potW / 2;
      const ry = rx * 0.26;

      // burner + flame
      const flameOn = boiling || p.mode === 'lift';
      const fl = flameOn ? 0.75 + Math.min(0.25, p.heat * 0.25) : 0.15;
      c.save();
      const glow = c.createRadialGradient(cx, baseY + 4, 4, cx, baseY + 4, rx * 1.1);
      glow.addColorStop(0, `rgba(90,140,255,${0.45 * fl})`);
      glow.addColorStop(1, 'rgba(90,140,255,0)');
      c.fillStyle = glow;
      c.fillRect(cx - rx * 1.2, baseY - 40, rx * 2.4, 90);
      c.restore();
      c.fillStyle = '#1b1e23';
      c.beginPath();
      c.ellipse(cx, baseY + 12, rx * 0.86, 12, 0, 0, TAU);
      c.fill();
      // pot body
      c.save();
      c.shadowColor = 'rgba(0,0,0,.55)';
      c.shadowBlur = 24;
      c.shadowOffsetY = 12;
      const body = new Path2D();
      body.moveTo(cx - rx, rimY);
      body.lineTo(cx - rx * 0.96, baseY);
      body.ellipse(cx, baseY, rx * 0.96, ry * 0.9, 0, Math.PI, 0, true);
      body.lineTo(cx + rx, rimY);
      body.closePath();
      const sg = c.createLinearGradient(cx - rx, 0, cx + rx, 0);
      sg.addColorStop(0, '#5b626c');
      sg.addColorStop(0.12, '#d9dfe6');
      sg.addColorStop(0.24, '#8c949f');
      sg.addColorStop(0.45, '#f3f6f9');
      sg.addColorStop(0.58, '#a4acb6');
      sg.addColorStop(0.8, '#e2e7ec');
      sg.addColorStop(1, '#4c525a');
      c.fillStyle = sg;
      c.fill(body);
      c.restore();
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI;
        const fx = cx - Math.cos(a) * rx * 0.78;
        const fy = baseY + ry * 0.9 + 6 + Math.sin(a) * 4;
        const h = (18 + Math.sin(tAll * 22 + i * 1.7) * 5 + Math.random() * 4) * fl;
        const g = c.createLinearGradient(fx, fy, fx, fy - h);
        g.addColorStop(0, `rgba(60,110,255,${0.95 * fl})`);
        g.addColorStop(0.55, `rgba(120,180,255,${0.7 * fl})`);
        g.addColorStop(1, 'rgba(255,220,140,0)');
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(fx - 4, fy);
        c.quadraticCurveTo(fx - 2, fy - h * 0.6, fx + Math.sin(tAll * 9 + i) * 1.5, fy - h);
        c.quadraticCurveTo(fx + 2, fy - h * 0.6, fx + 4, fy);
        c.closePath();
        c.fill();
      }

      // heat tint at bottom
      const ht = c.createLinearGradient(0, baseY - 50, 0, baseY + ry);
      ht.addColorStop(0, 'rgba(0,0,0,0)');
      ht.addColorStop(1, `rgba(90,60,140,${0.25 * fl})`);
      c.fillStyle = ht;
      c.fill(body);
      // brushed lines
      c.save();
      c.clip(body);
      c.globalAlpha = 0.08;
      for (let y = rimY; y < baseY + ry; y += 3) {
        c.fillStyle = y % 6 ? '#fff' : '#000';
        c.fillRect(cx - rx, y, potW, 1);
      }
      c.restore();
      // handles
      for (const s of [-1, 1]) {
        c.fillStyle = '#6c737d';
        c.beginPath();
        c.roundRect(cx + s * rx - (s > 0 ? 0 : 26), rimY + 20, 26, 12, 6);
        c.fill();
      }
      // label band
      c.fillStyle = 'rgba(40,44,52,.35)';
      c.fillRect(cx - rx * 0.99, rimY + ry + 10, potW * 0.99, 3);

      // water surface
      const wy = rimY + 8;
      const inner = new Path2D();
      inner.ellipse(cx, wy, rx * 0.95, ry * 0.88, 0, 0, TAU);
      c.fillStyle = '#3b3f45';
      c.beginPath();
      c.ellipse(cx, rimY, rx, ry, 0, 0, TAU);
      c.fill();
      const wg = c.createRadialGradient(cx - rx * 0.3, wy - ry * 0.4, 10, cx, wy, rx);
      wg.addColorStop(0, boiling ? '#f4f1e4' : '#d9e6ea');
      wg.addColorStop(0.6, boiling ? '#cfc7ae' : '#a9bcc3');
      wg.addColorStop(1, '#6f6a5c');
      c.fillStyle = wg;
      c.fill(inner);

      // basket in the water
      const basketR = rx * 0.5;
      const bx = cx + rx * 0.05;
      const by =
        wy -
        lift * (rimY - 40 - basketR * 0.2) -
        (p.mode === 'lift' ? Math.sin(tAll * 26) * 2.5 * (1 - lift * 0.4) : 0);
      const drawBasketTop = () => {
        c.save();
        const bp = new Path2D();
        bp.ellipse(bx, by, basketR, basketR * 0.34, 0, 0, TAU);
        c.fillStyle = 'rgba(30,30,30,.25)';
        c.fill(bp);
        c.clip(bp);
        if (p.noodle) {
          const col = INGREDIENTS[p.noodle]?.color ?? '#efcf7e';
          const w = THICK_W[p.thick ?? 'orta'] * 0.9;
          c.lineCap = 'round';
          for (let i = 0; i < 30; i++) {
            const y0 = by - basketR * 0.3 + (i / 26) * basketR * 0.6;
            c.beginPath();
            c.moveTo(bx - basketR, y0);
            for (let k = 0; k <= 8; k++) {
              const x = bx - basketR + (k / 8) * basketR * 2;
              c.lineTo(x, y0 + Math.sin(k * 1.7 + i * 2.3 + (boiling ? tAll * 3 : 0)) * 3);
            }
            c.strokeStyle = 'rgba(60,40,10,.35)';
            c.lineWidth = w + 1.5;
            c.stroke();
            c.strokeStyle = col;
            c.lineWidth = w;
            c.stroke();
          }
        }
        // mesh
        c.strokeStyle = 'rgba(70,74,80,.28)';
        c.lineWidth = 0.6;
        for (let x = bx - basketR; x < bx + basketR; x += 6) {
          c.beginPath();
          c.moveTo(x, by - basketR);
          c.lineTo(x, by + basketR);
          c.stroke();
        }
        c.restore();
        c.strokeStyle = '#c8cdd3';
        c.lineWidth = 3;
        c.beginPath();
        c.ellipse(bx, by, basketR, basketR * 0.34, 0, 0, TAU);
        c.stroke();
      };
      const drawBasketBody = () => {
        if (lift < 0.05) return;
        const depth = basketR * 0.9 * Math.min(1, lift * 1.4);
        c.save();
        const mg = c.createLinearGradient(bx - basketR, 0, bx + basketR, 0);
        mg.addColorStop(0, 'rgba(120,126,134,.85)');
        mg.addColorStop(0.5, 'rgba(220,226,232,.85)');
        mg.addColorStop(1, 'rgba(110,116,124,.85)');
        c.fillStyle = mg;
        c.beginPath();
        c.moveTo(bx - basketR, by);
        c.quadraticCurveTo(bx - basketR * 0.9, by + depth, bx, by + depth);
        c.quadraticCurveTo(bx + basketR * 0.9, by + depth, bx + basketR, by);
        c.closePath();
        c.fill();
        c.strokeStyle = 'rgba(60,64,70,.35)';
        c.lineWidth = 0.8;
        for (let i = -6; i <= 6; i++) {
          c.beginPath();
          c.moveTo(bx + (i / 6) * basketR, by);
          c.lineTo(bx + (i / 6) * basketR * 0.4, by + depth * 0.95);
          c.stroke();
        }
        c.restore();
      };
      // water clipped basket (submerged) vs lifted
      if (lift < 0.5) {
        c.save();
        c.clip(inner);
        drawBasketTop();
        c.restore();
      }

      // boiling bubbles
      if (boiling) {
        const rate = 18 + p.heat * 40;
        for (let i = 0; i < rate * dt; i++) {
          const a = Math.random() * TAU;
          const d = Math.sqrt(Math.random());
          bubbles.push({
            x: cx + Math.cos(a) * d * rx * 0.88,
            y: wy + Math.sin(a) * d * ry * 0.8,
            r: 2 + Math.random() * (4 + p.heat * 4),
            t: 0,
            life: 0.25 + Math.random() * 0.4,
          });
        }
      }
      c.save();
      c.clip(inner);
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.t += dt;
        if (b.t > b.life) {
          bubbles.splice(i, 1);
          continue;
        }
        const k = b.t / b.life;
        const r = b.r * (0.5 + k * 0.7);
        c.strokeStyle = `rgba(255,255,255,${0.85 * (1 - k)})`;
        c.lineWidth = 1.2;
        c.beginPath();
        c.ellipse(b.x, b.y, r, r * 0.7, 0, 0, TAU);
        c.stroke();
        c.fillStyle = `rgba(255,255,255,${0.35 * (1 - k)})`;
        c.beginPath();
        c.ellipse(b.x - r * 0.3, b.y - r * 0.25, r * 0.35, r * 0.2, 0, 0, TAU);
        c.fill();
      }
      if (boiling) {
        c.fillStyle = 'rgba(255,255,255,.12)';
        c.beginPath();
        c.ellipse(cx + Math.sin(tAll * 3) * 10, wy, rx * 0.5, ry * 0.3, 0, 0, TAU);
        c.fill();
      }
      c.restore();

      // rim ring
      c.lineWidth = 5;
      const rr = c.createLinearGradient(cx - rx, 0, cx + rx, 0);
      rr.addColorStop(0, '#80878f');
      rr.addColorStop(0.45, '#ffffff');
      rr.addColorStop(1, '#6c737d');
      c.strokeStyle = rr;
      c.beginPath();
      c.ellipse(cx, rimY, rx, ry, 0, 0, TAU);
      c.stroke();

      // basket handle
      const hx = bx + basketR * 0.7;
      const hy = by - basketR * 0.12;
      const ex = Math.min(W - 10, cx + rx * 1.25);
      const ey = by - basketR * 1.35 - 20;
      c.strokeStyle = '#a9b0b9';
      c.lineWidth = 6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(hx, hy);
      c.lineTo(ex - 24, ey + 10);
      c.stroke();
      c.strokeStyle = '#5e3519';
      c.lineWidth = 11;
      c.beginPath();
      c.moveTo(ex - 24, ey + 10);
      c.lineTo(ex, ey);
      c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.25)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(ex - 22, ey + 7);
      c.lineTo(ex - 2, ey - 2);
      c.stroke();

      if (lift >= 0.5) {
        drawBasketBody();
        drawBasketTop();
        if (Math.random() < 0.7)
          drops.push({
            x: bx + (Math.random() - 0.5) * basketR * 1.2,
            y: by + basketR * 0.8 * lift,
            vy: 40,
          });
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy += 900 * dt;
        d.y += d.vy * dt;
        if (d.y > wy) {
          drops.splice(i, 1);
          continue;
        }
        c.fillStyle = 'rgba(220,240,255,.8)';
        c.beginPath();
        c.ellipse(d.x, d.y, 1.6, 3, 0, 0, TAU);
        c.fill();
      }

      // steam
      const steamRate = boiling ? 10 + p.heat * 18 : p.mode === 'lift' ? 16 : 1.5;
      for (let i = 0; i < steamRate * dt; i++) {
        puffs.push({
          x: cx + (Math.random() - 0.5) * rx * 1.4,
          y: (p.mode === 'lift' ? by : wy) - 4,
          r: 10 + Math.random() * 16,
          vx: (Math.random() - 0.5) * 14,
          vy: -(30 + Math.random() * 40),
          t: 0,
          life: 1.8 + Math.random() * 1.6,
        });
      }
      for (let i = puffs.length - 1; i >= 0; i--) {
        const s = puffs[i];
        s.t += dt;
        if (s.t > s.life) {
          puffs.splice(i, 1);
          continue;
        }
        s.x += (s.vx + Math.sin(tAll * 1.3 + i) * 8) * dt;
        s.y += s.vy * dt;
        const k = s.t / s.life;
        const r = s.r * (1 + k * 2.4);
        const a = 0.22 * Math.sin(Math.PI * k);
        const g = c.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.beginPath();
        c.arc(s.x, s.y, r, 0, TAU);
        c.fill();
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="stove-cv" />;
}
