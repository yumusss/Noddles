// The hut window painted behind menus and story screens (same art as the game).

import { useEffect, useRef } from 'react';
import type { DecorSlot, TimeOfDay } from '../game/data';
import { setPx } from '../art/common';
import { computeLayout } from '../art/layout';
import { outsideLife, paintOutside, skyFor } from '../art/outside';
import { drawHutFrame } from '../art/hut';

export default function Backdrop({
  time,
  snow,
  decor,
  aurora = false,
}: {
  time: TimeOfDay;
  snow: 'light' | 'storm' | 'none';
  decor: Record<DecorSlot, string>;
  aurora?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = cv.clientWidth;
      const ch = cv.clientHeight;
      if (!cw || !ch) {
        raf = requestAnimationFrame(draw);
        return;
      }
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) {
        cv.width = Math.round(cw * dpr);
        cv.height = Math.round(ch * dpr);
      }
      const portrait = ch > cw;
      const scale = (portrait ? cw : ch) / 720;
      const W = portrait ? 720 : Math.round(cw / scale);
      const H = portrait ? Math.round(ch / scale) : 720;
      const c = cv.getContext('2d')!;
      c.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      setPx(dpr * scale);
      const t = (performance.now() - t0) / 1000;
      const L = computeLayout(W, H, portrait, [], [], []);
      // stretch the window down to the bottom for a big view
      const win = { ...L.win, h: H - L.win.y, w: L.win.w };
      paintOutside(c, win, time, snow === 'storm');
      outsideLife(c, win, t, time, snow === 'storm', snow !== 'none', aurora);
      drawHutFrame(c, { ...L, win, sillY: H + 2 }, decor, skyFor(time, snow === 'storm').glow, t);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [time, snow, decor, aurora]);
  return <canvas ref={ref} className="backdrop" />;
}
