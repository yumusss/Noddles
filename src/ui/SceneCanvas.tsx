import { useEffect, useRef } from 'react';
import { SHORT } from '../core/engine';

export type SceneDraw = (c: CanvasRenderingContext2D, W: number, H: number, t: number) => void;

/** A full-size canvas that draws a logical scene (short side = 720 units) each frame (or once). */
export default function SceneCanvas({
  draw,
  animate = true,
  className,
}: {
  draw: SceneDraw;
  animate?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const frameRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (!animate) frameRef.current();
  }, [draw, animate]);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    let raf = 0;
    let running = true;
    const start = performance.now();
    const size = () => {
      const p = cv.parentElement ?? cv;
      const cssW = Math.max(1, p.clientWidth);
      const cssH = Math.max(1, p.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      cv.width = Math.round(cssW * dpr);
      cv.height = Math.round(cssH * dpr);
      cv.style.width = cssW + 'px';
      cv.style.height = cssH + 'px';
      const portrait = cssH > cssW;
      const scale = (portrait ? cssW : cssH) / SHORT;
      return { scale, dpr, W: portrait ? SHORT : cssW / scale, H: portrait ? cssH / scale : SHORT };
    };
    let dims = size();
    const ro = new ResizeObserver(() => {
      dims = size();
      if (!animate) frame();
    });
    ro.observe(cv.parentElement ?? cv);
    const frame = () => {
      if (!running) return;
      ctx.setTransform(dims.dpr * dims.scale, 0, 0, dims.dpr * dims.scale, 0, 0);
      drawRef.current(ctx, dims.W, dims.H, (performance.now() - start) / 1000);
      if (animate) raf = requestAnimationFrame(frame);
    };
    frameRef.current = frame;
    frame();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [animate]);
  return <canvas ref={ref} className={className} />;
}
