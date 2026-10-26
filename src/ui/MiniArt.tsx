// Tiny canvas illustrations for menus (how-to pages, tablet lists).

import { useEffect, useRef } from 'react';
import type { IngId } from '../game/data';
import { drawIngredient, drawPiece, drawPlateMini } from '../art/food';
import { drawCoin, drawTabletProp } from '../art/salon';
import { drawSeated, SPECIAL_LOOKS } from '../art/people';
import { setPx } from '../art/common';

export type MiniKind =
  | { k: 'ing'; ing: IngId }
  | { k: 'nigiri' }
  | { k: 'maki' }
  | { k: 'tempura' }
  | { k: 'coin' }
  | { k: 'tablet' }
  | { k: 'face' }
  | { k: 'plate' };

export default function MiniArt({ kind, size = 96 }: { kind: MiniKind; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    cv.width = size * dpr;
    cv.height = size * dpr;
    const c = cv.getContext('2d')!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    setPx(dpr);
    c.clearRect(0, 0, size, size);
    c.translate(size / 2, size / 2);
    const u = size * 2.6;
    switch (kind.k) {
      case 'ing':
        drawIngredient(c, kind.ing, size * 0.8, 3, 'done');
        break;
      case 'nigiri':
        drawPiece(c, u, { kind: 'nigiri', rice: 'just', neta: 'salmon', tops: [] }, 2);
        break;
      case 'maki':
        drawPiece(
          c,
          u,
          {
            kind: 'maki',
            style: 'ura',
            fill: ['crab', 'avocado'],
            coat: 'sesame',
            rice: 'just',
            roll: 'tight',
            cut: 'clean',
            idx: 0,
            tops: [],
          },
          3
        );
        break;
      case 'tempura':
        drawIngredient(c, 'tempura', size * 0.8, 2, 'done');
        break;
      case 'coin':
        drawCoin(c, -10, 8, size * 0.2, 0, 0);
        drawCoin(c, 8, 0, size * 0.2, 1, 1);
        drawCoin(c, 0, -10, size * 0.2, 2, 2);
        break;
      case 'tablet':
        drawTabletProp(c, 0, size * 0.36, size * 0.62, size * 0.46, false, 0, 0);
        break;
      case 'plate':
        drawPlateMini(c, 'geta', size * 0.8);
        break;
      case 'face':
        c.translate(0, size * 0.62);
        drawSeated(c, SPECIAL_LOOKS.ume!, size * 0.16, { mood: 'happy', talk: 0, t: 0 });
        break;
    }
  }, [kind, size]);
  return <canvas ref={ref} style={{ width: size, height: size }} />;
}
