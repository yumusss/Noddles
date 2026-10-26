// Title screen with a living little scene.

import { useEffect, useRef } from 'react';
import { t } from '../game/i18n';
import type { Save } from '../game/save';
import { setPx } from '../art/common';
import { drawInky } from '../art/people';
import { drawPiece } from '../art/food';
import { LangToggle } from './PauseMenu';
import { useLang } from '../App';

export default function Title({ onPlay, save }: { onPlay: () => void; save: Save }) {
  const lang = useLang();
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    let raf = 0;
    const t0 = performance.now();
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      const c = cv.getContext('2d')!;
      const tt = (performance.now() - t0) / 1000;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      setPx(dpr);
      c.clearRect(0, 0, w, h);
      const s = Math.min(w, h) / 3.2;
      const u = s * 2.2;
      const pieces = [
        { kind: 'nigiri', rice: 'just', neta: 'salmon', tops: [] },
        {
          kind: 'maki',
          style: 'ura',
          fill: ['crab', 'avocado'],
          coat: 'tobiko',
          rice: 'just',
          roll: 'tight',
          cut: 'clean',
          idx: 0,
          tops: [],
        },
        { kind: 'nigiri', rice: 'just', neta: 'tuna', tops: [] },
        {
          kind: 'maki',
          style: 'hoso',
          fill: ['cucumber'],
          rice: 'just',
          roll: 'tight',
          cut: 'clean',
          idx: 1,
          tops: [],
        },
        { kind: 'nigiri', rice: 'just', neta: 'tamago', band: true, tops: [] },
      ] as never[];
      pieces.forEach((p, i) => {
        const x = w / 2 + (i - 2) * s * 0.62;
        const y = h * 0.66 + Math.sin(tt * 1.4 + i) * 5;
        c.save();
        c.translate(x, y);
        drawPiece(c, u, p, i + 1);
        c.restore();
      });
      c.save();
      c.translate(w / 2 + s * 1.7, h * 0.86);
      drawInky(c, s * 0.7, tt, 'wave');
      c.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="screen title">
      <div className="title-sun" />
      <div className="title-waves" />
      <canvas ref={ref} className="title-canvas" />
      <div className="title-logo">
        <span className="kanji">波屋</span>
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </div>
      <div className="title-actions">
        <button className="btn coral big" onClick={onPlay}>
          {save.unlocked > 1 ? t('continue') : t('play')}
        </button>
        <LangToggle lang={lang} />
      </div>
    </div>
  );
}
