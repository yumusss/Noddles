// The dining room painted behind story screens (same art as the game, softly dimmed).

import { useEffect, useRef } from 'react';
import type { Day } from '../game/data';
import { getLang } from '../game/i18n';
import { setPx } from '../art/common';
import {
  drawCounter,
  drawLanterns,
  drawSalonBg,
  drawWindowLife,
  salonLayout,
  skyFor,
} from '../art/salon';
import { drawInky } from '../art/people';
import { loadSave } from '../game/save';

export default function Backdrop({ day }: { day: Day }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const decor = loadSave().equipped;
    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = cv.clientWidth;
      const ch = cv.clientHeight;
      const portrait = ch > cw;
      const scale = (portrait ? cw : ch) / 720;
      const W = portrait ? 720 : Math.round(cw / scale);
      const H = portrait ? Math.round(ch / scale) : 720;
      if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) {
        cv.width = Math.round(cw * dpr);
        cv.height = Math.round(ch * dpr);
      }
      const c = cv.getContext('2d')!;
      c.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
      setPx(dpr * scale);
      const t = (performance.now() - t0) / 1000;
      const L = salonLayout(W, H, portrait);
      drawSalonBg(c, L, day.time, day.rain, decor, getLang());
      drawWindowLife(c, L, t, day.time, day.rain);
      drawLanterns(c, L, t, skyFor(day.time, day.rain).lamps, decor.lamp);
      drawCounter(c, L);
      c.save();
      c.translate(L.inky.x, L.inky.y + L.inky.s * 0.45);
      drawInky(c, L.inky.s, t, 'idle');
      c.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [day]);
  return <canvas ref={ref} className="backdrop" />;
}
