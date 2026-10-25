// Canvas engine: sizing (logical short side = 720), frame loop and camera.

export const SHORT = 720;

export interface View {
  W: number; // logical width (= station width)
  H: number; // logical height
  scale: number; // CSS px per logical unit
  portrait: boolean;
  cssW: number;
  cssH: number;
}

export type FrameFn = (c: CanvasRenderingContext2D, v: View, t: number, dt: number) => void;

export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  view: View = { W: 1280, H: 720, scale: 1, portrait: false, cssW: 1280, cssH: 720 };
  /** camera x in world units (world x of the left screen edge) */
  camX = 0;
  camTarget: number | null = null;
  camVel = 0;
  stations = 3;
  time = 0;
  private raf = 0;
  private last = 0;
  private running = false;
  onFrame: FrameFn | null = null;
  onResize: ((v: View) => void) | null = null;
  private ro: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 150));
  }

  resize() {
    const parent = this.canvas.parentElement ?? document.body;
    const cssW = Math.max(1, parent.clientWidth);
    const cssH = Math.max(1, parent.clientHeight);
    const portrait = cssH > cssW;
    const scale = (portrait ? cssW : cssH) / SHORT;
    const W = portrait ? SHORT : Math.round(cssW / scale);
    const H = portrait ? Math.round(cssH / scale) : SHORT;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';
    this.ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    this.view = { W, H, scale, portrait, cssW, cssH };
    this.camX = Math.max(0, Math.min(this.maxCam, this.camX));
    this.onResize?.(this.view);
  }

  get maxCam() {
    return (this.stations - 1) * this.view.W;
  }

  /** world x of station i */
  stationX(i: number) {
    return i * this.view.W;
  }

  /** which station the camera is (mostly) looking at */
  get station() {
    return Math.round(this.camX / this.view.W);
  }

  snapTo(i: number) {
    this.camTarget = Math.max(0, Math.min(this.stations - 1, i)) * this.view.W;
    this.camVel = 0;
  }

  /** screen (CSS px, relative to canvas) → world coords */
  toWorld(px: number, py: number) {
    return { x: px / this.view.scale + this.camX, y: py / this.view.scale };
  }

  toScreen(wx: number, wy: number) {
    return { x: (wx - this.camX) * this.view.scale, y: wy * this.view.scale };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.time += dt;
      this.stepCamera(dt);
      const c = this.ctx;
      c.save();
      this.onFrame?.(c, this.view, this.time, dt);
      c.restore();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    this.ro?.disconnect();
  }

  private stepCamera(dt: number) {
    if (this.camTarget !== null) {
      const d = this.camTarget - this.camX;
      if (Math.abs(d) < 0.5) {
        this.camX = this.camTarget;
        this.camTarget = null;
      } else this.camX += d * Math.min(1, dt * 9);
    } else if (this.camVel !== 0) {
      this.camX += this.camVel * dt;
      this.camVel *= Math.pow(0.02, dt); // friction
      if (Math.abs(this.camVel) < 40) {
        this.camVel = 0;
        this.snapTo(this.station);
      }
    }
    if (this.camX < 0) {
      this.camX = 0;
      this.camVel = 0;
    }
    if (this.camX > this.maxCam) {
      this.camX = this.maxCam;
      this.camVel = 0;
    }
  }
}
