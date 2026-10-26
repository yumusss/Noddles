// A small canvas portrait of a story character (or Inky).

import { useEffect, useRef } from 'react';
import type { Speaker } from '../game/data';
import { drawInky, drawSeated, SPECIAL_LOOKS } from '../art/people';
import { setPx } from '../art/common';

export default function Portrait({
  who,
  size = 150,
  talking = false,
}: {
  who: Speaker;
  size?: number;
  talking?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const talkRef = useRef(talking);
  talkRef.current = talking;
  useEffect(() => {
    const cv = ref.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = size * dpr;
    cv.height = size * dpr;
    const c = cv.getContext('2d')!;
    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const t = (performance.now() - t0) / 1000;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      setPx(dpr);
      c.clearRect(0, 0, size, size);
      if (who === 'inky') {
        c.save();
        c.translate(size / 2, size * 0.55);
        drawInky(c, size * 0.8, t, 'wave');
        c.restore();
      } else if (who !== 'me') {
        const L = SPECIAL_LOOKS[who];
        if (L) {
          c.save();
          c.translate(size / 2, size * 1.02);
          const talk = talkRef.current ? (Math.sin(t * 22) + 1) / 2 : 0;
          drawSeated(c, L, size * 0.2, { mood: 'happy', talk, t });
          c.restore();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [who, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} className="portrait" />;
}
