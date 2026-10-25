// Lightweight particle helpers (steam, sparks, smoke, sparkles, hearts, coins,
// drops) and a procedural steam-wisp drawer. Everything is cheap: particles are
// pre-rendered once per kind+size into a sprite and blitted with globalAlpha.
import { type Ctx, sprite, circle, rng, PAL, rgba, shade } from './common';

export type ParticleKind = 'steam' | 'spark' | 'smoke' | 'sparkle' | 'heart' | 'coin' | 'drop';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // seconds lived so far
  max: number; // lifetime in seconds
  size: number; // logical px (diameter-ish)
  kind: ParticleKind;
  seed: number; // 0..1, per-particle variation (wobble phase, spin)
}

const MAX_PARTICLES = 200;
const TAU = Math.PI * 2;

// ---------- sprites ----------

function quant(s: number) {
  return Math.max(4, Math.round(s / 4) * 4);
}

function particleSprite(kind: ParticleKind, size: number): HTMLCanvasElement {
  const s = quant(size);
  const pad = kind === 'sparkle' ? s * 1.4 : s * 1.1;
  const W = Math.ceil(pad * 2);
  return sprite(`fx:${kind}:${s}`, W, W, (c) => {
    const cx = W / 2;
    const cy = W / 2;
    const r = s / 2;
    switch (kind) {
      case 'steam': {
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(255,255,255,0.75)');
        g.addColorStop(0.55, 'rgba(255,252,246,0.35)');
        g.addColorStop(1, 'rgba(255,250,240,0)');
        c.fillStyle = g;
        circle(c, cx, cy, r);
        c.fill();
        break;
      }
      case 'smoke': {
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(120,100,90,0.55)');
        g.addColorStop(0.6, 'rgba(120,100,90,0.22)');
        g.addColorStop(1, 'rgba(120,100,90,0)');
        c.fillStyle = g;
        circle(c, cx, cy, r);
        c.fill();
        break;
      }
      case 'spark': {
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, 'rgba(255,250,220,1)');
        g.addColorStop(0.35, 'rgba(255,200,90,0.95)');
        g.addColorStop(0.7, 'rgba(240,120,50,0.45)');
        g.addColorStop(1, 'rgba(230,90,40,0)');
        c.fillStyle = g;
        circle(c, cx, cy, r);
        c.fill();
        break;
      }
      case 'sparkle': {
        // soft glow + 4-point star
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, r * 1.3);
        g.addColorStop(0, 'rgba(255,245,210,0.6)');
        g.addColorStop(1, 'rgba(255,245,210,0)');
        c.fillStyle = g;
        circle(c, cx, cy, r * 1.3);
        c.fill();
        c.beginPath();
        const ro = r;
        const ri = r * 0.22;
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU - Math.PI / 2;
          const rr = i % 2 === 0 ? ro : ri;
          const px = cx + Math.cos(a) * rr;
          const py = cy + Math.sin(a) * rr;
          if (i === 0) c.moveTo(px, py);
          else c.lineTo(px, py);
        }
        c.closePath();
        const sg = c.createRadialGradient(cx, cy, 0, cx, cy, r);
        sg.addColorStop(0, '#ffffff');
        sg.addColorStop(1, PAL.butter);
        c.fillStyle = sg;
        c.fill();
        break;
      }
      case 'heart': {
        const h = r * 1.8;
        const w = r * 2;
        c.save();
        c.translate(cx, cy - h * 0.05);
        c.beginPath();
        c.moveTo(0, h * 0.45);
        c.bezierCurveTo(-w * 0.55, h * 0.05, -w * 0.5, -h * 0.5, 0, -h * 0.2);
        c.bezierCurveTo(w * 0.5, -h * 0.5, w * 0.55, h * 0.05, 0, h * 0.45);
        c.closePath();
        const hg = c.createLinearGradient(0, -h / 2, 0, h / 2);
        hg.addColorStop(0, shade(PAL.blush, 0.25));
        hg.addColorStop(1, PAL.rose);
        c.fillStyle = hg;
        c.fill();
        c.strokeStyle = 'rgba(60,35,20,0.18)';
        c.lineWidth = Math.max(1, r * 0.12);
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.beginPath();
        c.ellipse(-w * 0.22, -h * 0.22, r * 0.22, r * 0.14, -0.6, 0, TAU);
        c.fill();
        c.restore();
        break;
      }
      case 'coin': {
        // gold disc with rim and a small shine
        const g = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
        g.addColorStop(0, '#fff1b8');
        g.addColorStop(0.6, PAL.honey);
        g.addColorStop(1, '#c48a2e');
        c.fillStyle = g;
        circle(c, cx, cy, r);
        c.fill();
        c.strokeStyle = 'rgba(120,70,20,0.35)';
        c.lineWidth = Math.max(1, r * 0.14);
        circle(c, cx, cy, r * 0.68);
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.75)';
        c.beginPath();
        c.ellipse(cx - r * 0.35, cy - r * 0.4, r * 0.22, r * 0.12, -0.7, 0, TAU);
        c.fill();
        break;
      }
      case 'drop': {
        c.save();
        c.translate(cx, cy);
        c.beginPath();
        c.moveTo(0, -r);
        c.bezierCurveTo(r * 0.9, r * 0.1, r * 0.75, r, 0, r);
        c.bezierCurveTo(-r * 0.75, r, -r * 0.9, r * 0.1, 0, -r);
        c.closePath();
        const dg = c.createLinearGradient(-r, 0, r, 0);
        dg.addColorStop(0, rgba(PAL.sky, 0.9));
        dg.addColorStop(1, rgba(PAL.blue, 0.9));
        c.fillStyle = dg;
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.beginPath();
        c.ellipse(-r * 0.3, r * 0.1, r * 0.16, r * 0.3, 0.2, 0, TAU);
        c.fill();
        c.restore();
        break;
      }
    }
  });
}

// ---------- system ----------

export class ParticleSystem {
  parts: Particle[] = [];
  private rand = rng(1234);

  /** Emit `n` particles of `kind` around (x,y); `spread` is the spawn radius. */
  emit(kind: ParticleKind, x: number, y: number, n = 1, spread = 6): void {
    const r = this.rand;
    for (let i = 0; i < n; i++) {
      if (this.parts.length >= MAX_PARTICLES) this.parts.shift();
      const a = r() * TAU;
      const d = Math.sqrt(r()) * spread;
      const px = x + Math.cos(a) * d;
      const py = y + Math.sin(a) * d * 0.5;
      const seed = r();
      let p: Particle;
      switch (kind) {
        case 'steam':
          p = { x: px, y: py, vx: (r() - 0.5) * 8, vy: -(26 + r() * 22), life: 0, max: 1.6 + r() * 1.2, size: 18 + r() * 18, kind, seed };
          break;
        case 'smoke':
          p = { x: px, y: py, vx: (r() - 0.5) * 10, vy: -(18 + r() * 16), life: 0, max: 2 + r() * 1.5, size: 16 + r() * 16, kind, seed };
          break;
        case 'spark':
          p = { x: px, y: py, vx: (r() - 0.5) * 40, vy: -(70 + r() * 110), life: 0, max: 0.5 + r() * 0.9, size: 5 + r() * 5, kind, seed };
          break;
        case 'sparkle':
          p = { x: px, y: py, vx: (r() - 0.5) * 24, vy: -(6 + r() * 18), life: 0, max: 0.7 + r() * 0.7, size: 14 + r() * 14, kind, seed };
          break;
        case 'heart':
          p = { x: px, y: py, vx: (r() - 0.5) * 16, vy: -(30 + r() * 25), life: 0, max: 1.2 + r() * 0.8, size: 12 + r() * 10, kind, seed };
          break;
        case 'coin':
          p = { x: px, y: py, vx: (r() - 0.5) * 160, vy: -(140 + r() * 120), life: 0, max: 1.1 + r() * 0.4, size: 12 + r() * 6, kind, seed };
          break;
        case 'drop':
        default:
          p = { x: px, y: py, vx: (r() - 0.5) * 20, vy: 10 + r() * 30, life: 0, max: 0.6 + r() * 0.5, size: 6 + r() * 5, kind, seed };
          break;
      }
      this.parts.push(p);
    }
  }

  update(dt: number): void {
    if (dt > 0.1) dt = 0.1;
    const ps = this.parts;
    let w = 0;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      p.life += dt;
      if (p.life >= p.max) continue;
      switch (p.kind) {
        case 'steam':
          p.x += (p.vx + Math.sin((p.life + p.seed * 6) * 2.2) * 10) * dt;
          p.y += p.vy * dt;
          p.vy *= 1 - 0.3 * dt;
          p.size += 14 * dt;
          break;
        case 'smoke':
          p.x += (p.vx + Math.sin((p.life + p.seed * 6) * 1.6) * 7) * dt;
          p.y += p.vy * dt;
          p.size += 12 * dt;
          break;
        case 'spark':
          p.x += (p.vx + Math.sin((p.life + p.seed * 9) * 7) * 12) * dt;
          p.y += p.vy * dt;
          p.vy *= 1 - 1.4 * dt;
          break;
        case 'sparkle':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        case 'heart':
          p.x += (p.vx + Math.sin((p.life + p.seed * 6) * 3) * 12) * dt;
          p.y += p.vy * dt;
          p.vy *= 1 - 0.5 * dt;
          break;
        case 'coin':
          p.vy += 420 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
        case 'drop':
          p.vy += 520 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          break;
      }
      ps[w++] = p;
    }
    ps.length = w;
  }

  draw(c: Ctx): void {
    const ps = this.parts;
    if (!ps.length) return;
    c.save();
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const u = p.life / p.max;
      let alpha: number;
      let scale = 1;
      switch (p.kind) {
        case 'steam':
        case 'smoke':
          alpha = u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85;
          alpha *= p.kind === 'steam' ? 0.9 : 0.8;
          break;
        case 'spark':
          alpha = 1 - u * u;
          scale = 1 - u * 0.5;
          break;
        case 'sparkle': {
          const tw = 0.75 + 0.25 * Math.sin((p.life + p.seed) * 22);
          alpha = (u < 0.15 ? u / 0.15 : 1 - (u - 0.15) / 0.85) * tw;
          scale = 0.7 + 0.5 * Math.sin(u * Math.PI);
          break;
        }
        case 'heart':
          alpha = u < 0.1 ? u / 0.1 : 1 - Math.pow((u - 0.1) / 0.9, 2);
          scale = 0.8 + 0.3 * Math.sin(u * Math.PI);
          break;
        case 'coin':
          alpha = u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1;
          break;
        case 'drop':
        default:
          alpha = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
          break;
      }
      if (alpha <= 0.01) continue;
      const sp = particleSprite(p.kind, p.size);
      const s = (sp.width / 2) * scale;
      c.globalAlpha = Math.min(1, alpha);
      if (p.kind === 'coin') {
        // spinning coin: squash horizontally
        const sq = Math.abs(Math.cos((p.life + p.seed) * 9)) * 0.85 + 0.15;
        c.drawImage(sp, p.x - (s * sq) / 2, p.y - s / 2, s * sq, s);
      } else if (p.kind === 'drop') {
        c.drawImage(sp, p.x - s / 2, p.y - s / 2, s, s * 1.15);
      } else {
        c.drawImage(sp, p.x - s / 2, p.y - s / 2, s, s);
      }
    }
    c.restore();
  }

  clear(): void {
    this.parts.length = 0;
  }
}

// ---------- procedural steam ----------

/**
 * Soft steam wisps rising from a w-wide base at (x,y) up to height h.
 * `t` animates, `strength` 0..1 scales opacity and count. No particle state.
 */
export function drawSteam(c: Ctx, x: number, y: number, w: number, h: number, t: number, strength = 1): void {
  if (strength <= 0.01) return;
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const n = strength > 0.6 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const ph = i * 2.1 + 0.7;
    const sp = 0.55 + i * 0.12;
    const bx = x + (i - (n - 1) / 2) * (w * 0.3) + Math.sin(t * sp + ph) * w * 0.08;
    const drift = Math.sin(t * 0.8 + ph) * w * 0.25;
    const top = y - h * (0.85 + 0.15 * Math.sin(t * 1.3 + ph * 2));
    const lw = w * (0.22 + 0.08 * Math.sin(t * 1.7 + ph));
    const g = c.createLinearGradient(0, y, 0, top);
    const a = strength * 0.42;
    g.addColorStop(0, `rgba(255,255,255,0)`);
    g.addColorStop(0.25, `rgba(255,255,255,${a})`);
    g.addColorStop(0.75, `rgba(255,252,246,${a * 0.55})`);
    g.addColorStop(1, `rgba(255,252,246,0)`);
    c.strokeStyle = g;
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(bx, y);
    c.bezierCurveTo(
      bx + Math.sin(t * 1.1 + ph) * w * 0.35,
      y - h * 0.35,
      bx + drift + Math.cos(t * 0.9 + ph) * w * 0.3,
      y - h * 0.7,
      bx + drift * 1.4,
      top,
    );
    c.stroke();
  }
  c.restore();
}
