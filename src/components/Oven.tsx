import { useEffect, useRef } from 'react';
import { drawBowl, type BowlDraw } from '../food';

// A cinematic noodle oven drawn on canvas: brushed-steel body, arched glass door,
// the bowl visible inside bathed in orange light, gas flames, steam and a dial timer
// that sweeps Çiğ → Diri → Tam kıvam → Yumuşak → Lapa.

type Mode = 'idle' | 'cook' | 'lift';

interface Props {
  mode: Mode;
  bowl: BowlDraw | null;
  heat: number; // 0..1.3 cook progress
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
interface Spark {
  x: number;
  y: number;
  vy: number;
  t: number;
}

const TAU = Math.PI * 2;
const ZONES: [string, number, string][] = [
  ['Çiğ', 42, '#8fa3b8'],
  ['Diri', 58, '#7bd389'],
  ['Tam', 80, '#36c26b'],
  ['Yumuşak', 100, '#f5b43c'],
  ['Lapa', 130, '#d64530'],
];

export default function Oven(props: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const live = useRef(props);
  live.current = props;

  useEffect(() => {
    const cv = ref.current!;
    const c = cv.getContext('2d')!;
    const bowlCv = document.createElement('canvas');
    bowlCv.width = 600;
    bowlCv.height = 600;
    const bc = bowlCv.getContext('2d')!;
    let bowlKey = '';
    let raf = 0;
    let W = 0;
    let H = 0;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const puffs: Puff[] = [];
    const sparks: Spark[] = [];
    let door = 1; // 0 closed .. 1 open
    let lift = 0; // 0 inside .. 1 pulled out
    let last = performance.now();
    let tAll = 0;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tAll += dt;
      const { mode, bowl, heat } = live.current;
      const cooking = mode === 'cook';
      const targetDoor = cooking ? 0 : 1;
      door += (targetDoor - door) * Math.min(1, dt * 6);
      lift += ((mode === 'lift' ? 1 : 0) - lift) * Math.min(1, dt * 5);

      // ensure bowl sprite is current
      if (bowl) {
        const key = JSON.stringify([
          bowl.style,
          bowl.noodle,
          bowl.thick,
          bowl.liquid,
          Math.round(bowl.fill * 50),
          bowl.pieces.length,
          bowl.cook,
        ]);
        if (key !== bowlKey) {
          bowlKey = key;
          bc.setTransform(2, 0, 0, 2, 0, 0);
          drawBowl(bc, bowl);
        }
      } else bowlKey = '';

      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);

      // ---- layout ----
      const S = Math.min(W / 360, H / 330);
      const ox = (W - 360 * S) / 2;
      const oy = (H - 330 * S) / 2;
      c.save();
      c.translate(ox, oy);
      c.scale(S, S);

      // back wall tiles
      c.fillStyle = '#1b1f28';
      c.fillRect(-ox / S, -oy / S, W / S, H / S);
      c.strokeStyle = 'rgba(255,255,255,.05)';
      c.lineWidth = 1;
      for (let x = -ox / S; x < W / S; x += 34) {
        c.beginPath();
        c.moveTo(x, -oy / S);
        c.lineTo(x, H / S);
        c.stroke();
      }
      for (let y = -oy / S; y < H / S; y += 22) {
        c.beginPath();
        c.moveTo(-ox / S, y);
        c.lineTo(W / S, y);
        c.stroke();
      }

      // ambient glow on wall
      const glow = cooking ? 0.55 + heat * 0.3 : 0.12;
      const wg = c.createRadialGradient(180, 150, 20, 180, 150, 260);
      wg.addColorStop(0, `rgba(255,140,40,${glow * 0.45})`);
      wg.addColorStop(1, 'rgba(255,140,40,0)');
      c.fillStyle = wg;
      c.fillRect(-ox / S, -oy / S, W / S, H / S);

      // ---- oven body ----
      const bx = 22;
      const by = 24;
      const bw = 316;
      const bh = 282;
      c.save();
      c.shadowColor = 'rgba(0,0,0,.6)';
      c.shadowBlur = 30;
      c.shadowOffsetY = 14;
      roundRect(c, bx, by, bw, bh, 18);
      const steel = c.createLinearGradient(bx, 0, bx + bw, 0);
      steel.addColorStop(0, '#6f7784');
      steel.addColorStop(0.18, '#aab2bd');
      steel.addColorStop(0.35, '#7d8592');
      steel.addColorStop(0.6, '#b9c0ca');
      steel.addColorStop(0.82, '#747c89');
      steel.addColorStop(1, '#4d545f');
      c.fillStyle = steel;
      c.fill();
      c.restore();
      // brushed lines
      c.save();
      roundRect(c, bx, by, bw, bh, 18);
      c.clip();
      c.strokeStyle = 'rgba(255,255,255,.06)';
      for (let y = by; y < by + bh; y += 3) {
        c.beginPath();
        c.moveTo(bx, y + ((y * 7) % 3) * 0.3);
        c.lineTo(bx + bw, y);
        c.stroke();
      }
      c.restore();
      // rivets
      c.fillStyle = '#2d323b';
      for (const [rx, ry] of [
        [bx + 14, by + 14],
        [bx + bw - 14, by + 14],
        [bx + 14, by + bh - 14],
        [bx + bw - 14, by + bh - 14],
      ]) {
        c.beginPath();
        c.arc(rx, ry, 4, 0, TAU);
        c.fill();
        c.fillStyle = '#c7cdd6';
        c.beginPath();
        c.arc(rx - 1, ry - 1, 1.6, 0, TAU);
        c.fill();
        c.fillStyle = '#2d323b';
      }
      // brand plate
      c.fillStyle = '#20242b';
      roundRect(c, 130, 34, 100, 18, 5);
      c.fill();
      c.fillStyle = '#e6c15a';
      c.font = '800 10px "Baloo 2", system-ui, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('NODDLES  ·  HANA 40', 180, 43);

      // ---- chamber (behind the door) ----
      const cx0 = 48;
      const cy0 = 62;
      const cw = 264;
      const ch = 156;
      c.save();
      arch(c, cx0, cy0, cw, ch);
      c.clip();
      const chamber = c.createLinearGradient(0, cy0, 0, cy0 + ch);
      chamber.addColorStop(0, cooking ? '#3a1408' : '#17120f');
      chamber.addColorStop(1, cooking ? '#8a2e0a' : '#2a1b12');
      c.fillStyle = chamber;
      c.fillRect(cx0, cy0, cw, ch);
      // inner glow
      const ig = c.createRadialGradient(180, cy0 + ch - 20, 10, 180, cy0 + ch - 20, 200);
      ig.addColorStop(0, `rgba(255,170,60,${cooking ? 0.75 : 0.08})`);
      ig.addColorStop(0.5, `rgba(255,110,30,${cooking ? 0.35 : 0.03})`);
      ig.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = ig;
      c.fillRect(cx0, cy0, cw, ch);
      // heating element bars (back)
      c.strokeStyle = cooking ? `rgba(255,120,40,${0.5 + heat * 0.4})` : '#3d2c22';
      c.lineWidth = 3;
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.moveTo(cx0 + 24, cy0 + 40 + i * 14);
        c.lineTo(cx0 + cw - 24, cy0 + 40 + i * 14);
        c.stroke();
      }
      // rack
      c.strokeStyle = '#5a5f68';
      c.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        const x = cx0 + 20 + i * 28;
        c.beginPath();
        c.moveTo(x, cy0 + ch - 54);
        c.lineTo(x, cy0 + ch - 48);
        c.stroke();
      }
      c.beginPath();
      c.moveTo(cx0 + 14, cy0 + ch - 50);
      c.lineTo(cx0 + cw - 14, cy0 + ch - 50);
      c.stroke();

      // flames along the floor
      const flameA = cooking ? 0.5 + Math.min(1, heat) * 0.5 : door < 0.5 ? 0.2 : 0.08;
      for (let i = 0; i < 11; i++) {
        const x = cx0 + 22 + i * 22;
        const h = (18 + Math.sin(tAll * 11 + i * 1.7) * 6 + Math.sin(tAll * 23 + i) * 3) * flameA;
        const fg = c.createLinearGradient(0, cy0 + ch, 0, cy0 + ch - h * 2);
        fg.addColorStop(0, 'rgba(90,160,255,.9)');
        fg.addColorStop(0.35, 'rgba(255,190,60,.9)');
        fg.addColorStop(1, 'rgba(255,90,20,0)');
        c.fillStyle = fg;
        c.beginPath();
        c.moveTo(x - 9, cy0 + ch);
        c.quadraticCurveTo(x - 4, cy0 + ch - h, x, cy0 + ch - h * 2);
        c.quadraticCurveTo(x + 4, cy0 + ch - h, x + 9, cy0 + ch);
        c.fill();
      }

      // the bowl inside, in 3/4 view
      if (bowl && bowlKey) {
        const bwid = 150;
        const bxC = 180;
        const byC = cy0 + ch - 54 - lift * 160;
        c.save();
        c.globalAlpha = 1 - lift * 0.3;
        // body
        c.shadowColor = 'rgba(0,0,0,.5)';
        c.shadowBlur = 14;
        c.shadowOffsetY = 8;
        const bodyG = c.createLinearGradient(bxC - bwid / 2, 0, bxC + bwid / 2, 0);
        bodyG.addColorStop(0, '#000');
        bodyG.addColorStop(0.4, 'rgba(255,255,255,.25)');
        bodyG.addColorStop(1, '#000');
        c.fillStyle = '#2b1a12';
        c.beginPath();
        c.ellipse(bxC, byC + 4, bwid * 0.48, 30, 0, 0, Math.PI);
        c.fill();
        c.shadowColor = 'transparent';
        c.fillStyle = bodyG;
        c.globalAlpha *= 0.55;
        c.beginPath();
        c.ellipse(bxC, byC + 4, bwid * 0.48, 30, 0, 0, Math.PI);
        c.fill();
        c.globalAlpha = 1 - lift * 0.3;
        // top (tilted)
        c.save();
        c.translate(bxC, byC);
        c.scale(1, 0.52);
        c.drawImage(bowlCv, -bwid / 2, -bwid / 2, bwid, bwid);
        c.restore();
        // warm tint when cooking
        if (cooking) {
          c.globalCompositeOperation = 'multiply';
          c.fillStyle = `rgba(255,170,90,${0.25 + heat * 0.2})`;
          c.beginPath();
          c.ellipse(bxC, byC, bwid / 2, bwid * 0.26, 0, 0, TAU);
          c.fill();
          c.globalCompositeOperation = 'source-over';
        }
        c.restore();
        // steam puffs
        if (cooking && heat > 0.25 && Math.random() < 0.5) {
          puffs.push({
            x: bxC + (Math.random() - 0.5) * 70,
            y: byC - 20,
            r: 6 + Math.random() * 8,
            vx: (Math.random() - 0.5) * 12,
            vy: -26 - Math.random() * 18,
            t: 0,
            life: 1.6 + Math.random(),
          });
        }
        if (cooking && heat > 0.9 && Math.random() < 0.3) {
          sparks.push({
            x: cx0 + 20 + Math.random() * (cw - 40),
            y: cy0 + ch - 8,
            vy: -40 - Math.random() * 60,
            t: 0,
          });
        }
      }
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.t += dt;
        if (p.t > p.life) {
          puffs.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += 9 * dt;
        const a = Math.sin((p.t / p.life) * Math.PI) * 0.35;
        c.fillStyle = `rgba(255,245,230,${a})`;
        c.beginPath();
        c.arc(p.x, p.y, p.r, 0, TAU);
        c.fill();
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.t += dt;
        s.y += s.vy * dt;
        if (s.t > 1.2) {
          sparks.splice(i, 1);
          continue;
        }
        c.fillStyle = `rgba(255,220,120,${1 - s.t / 1.2})`;
        c.beginPath();
        c.arc(s.x, s.y, 1.4, 0, TAU);
        c.fill();
      }
      c.restore(); // chamber clip

      // ---- glass door (slides up when open) ----
      const doorY = cy0 - door * (ch + 10);
      c.save();
      arch(c, cx0, cy0, cw, ch);
      c.clip();
      c.save();
      c.translate(0, doorY - cy0);
      arch(c, cx0, cy0, cw, ch);
      const gl = c.createLinearGradient(cx0, cy0, cx0 + cw, cy0 + ch);
      gl.addColorStop(0, 'rgba(255,255,255,.22)');
      gl.addColorStop(0.35, 'rgba(255,255,255,.04)');
      gl.addColorStop(0.5, 'rgba(255,255,255,.16)');
      gl.addColorStop(0.7, 'rgba(255,255,255,.03)');
      gl.addColorStop(1, 'rgba(255,255,255,.12)');
      c.fillStyle = gl;
      c.fill();
      // heat haze on glass
      if (cooking) {
        c.fillStyle = `rgba(255,150,60,${0.08 + heat * 0.08})`;
        c.fill();
      }
      // reflection streak
      c.strokeStyle = 'rgba(255,255,255,.35)';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(cx0 + 36, cy0 + 150);
      c.lineTo(cx0 + 120, cy0 + 26);
      c.stroke();
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx0 + 60, cy0 + 160);
      c.lineTo(cx0 + 150, cy0 + 30);
      c.stroke();
      c.restore();
      c.restore();
      // door frame
      c.save();
      c.translate(0, doorY - cy0);
      arch(c, cx0 - 6, cy0 - 6, cw + 12, ch + 12);
      c.lineWidth = 12;
      c.strokeStyle = '#2b2f37';
      c.stroke();
      arch(c, cx0 - 6, cy0 - 6, cw + 12, ch + 12);
      c.lineWidth = 4;
      c.strokeStyle = '#9aa2ae';
      c.stroke();
      // handle
      c.fillStyle = '#d7dde6';
      roundRect(c, 120, cy0 + ch - 8, 120, 10, 5);
      c.fill();
      c.restore();
      // frame opening (fixed)
      arch(c, cx0 - 6, cy0 - 6, cw + 12, ch + 12);
      c.lineWidth = 2;
      c.strokeStyle = 'rgba(0,0,0,.6)';
      c.stroke();

      // ---- dial timer ----
      const dx = 180;
      const dy = 286;
      const dr = 30;
      c.save();
      c.shadowColor = 'rgba(0,0,0,.5)';
      c.shadowBlur = 8;
      c.beginPath();
      c.arc(dx, dy, dr + 6, 0, TAU);
      c.fillStyle = '#1c2027';
      c.fill();
      c.restore();
      let start = -Math.PI * 1.25;
      const span = Math.PI * 1.5;
      let prev = 0;
      for (const [, end, col] of ZONES) {
        const a0 = start + (prev / 130) * span;
        const a1 = start + (end / 130) * span;
        c.beginPath();
        c.arc(dx, dy, dr, a0, a1);
        c.lineWidth = 8;
        c.strokeStyle = col;
        c.stroke();
        prev = end;
      }
      // tick labels
      c.fillStyle = '#e8ecf2';
      c.font = '800 7px "Nunito", system-ui, sans-serif';
      prev = 0;
      for (const [label, end] of ZONES) {
        const mid = start + ((prev + end) / 2 / 130) * span;
        c.fillText(label, dx + Math.cos(mid) * (dr + 14), dy + Math.sin(mid) * (dr + 14));
        prev = end;
      }
      // needle
      const na = start + (Math.min(130, Math.max(0, heat * 100)) / 130) * span;
      c.strokeStyle = '#fff';
      c.lineWidth = 2.4;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(dx, dy);
      c.lineTo(dx + Math.cos(na) * (dr - 4), dy + Math.sin(na) * (dr - 4));
      c.stroke();
      c.fillStyle = '#e6c15a';
      c.beginPath();
      c.arc(dx, dy, 3.5, 0, TAU);
      c.fill();
      start = 0;

      // knobs
      for (const kx of [80, 280]) {
        c.fillStyle = '#2b2f37';
        c.beginPath();
        c.arc(kx, 282, 14, 0, TAU);
        c.fill();
        c.fillStyle = '#9aa2ae';
        c.beginPath();
        c.arc(kx, 282, 10, 0, TAU);
        c.fill();
        c.strokeStyle = '#2b2f37';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(kx, 282);
        c.lineTo(
          kx + Math.cos(-1 + (cooking ? 1.5 : 0)) * 8,
          282 + Math.sin(-1 + (cooking ? 1.5 : 0)) * 8
        );
        c.stroke();
      }
      // indicator lamp
      c.fillStyle = cooking ? '#ff6a3d' : '#3b4049';
      c.shadowColor = cooking ? '#ff6a3d' : 'transparent';
      c.shadowBlur = 10;
      c.beginPath();
      c.arc(120, 282, 4, 0, TAU);
      c.fill();
      c.shadowBlur = 0;

      c.restore();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="oven-cv" />;
}

function roundRect(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function arch(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x, y + r);
  c.arc(x + r, y + r, r, Math.PI, 0);
  c.lineTo(x + w, y + h);
  c.closePath();
}
