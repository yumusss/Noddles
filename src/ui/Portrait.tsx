import SceneCanvas from './SceneCanvas';
import { drawAvatar, randomLook, type Mood } from '../art/avatar';
import { drawCat } from '../art/cat';
import type { CharId } from '../game/data';

/** Canvas portrait of a story character (head & shoulders) that fills its container. */
export default function Portrait({ who, mood = 'happy' }: { who: CharId | string; mood?: Mood }) {
  return (
    <SceneCanvas
      draw={(c, W, H, t) => {
        c.clearRect(0, 0, W, H);
        const s = Math.min(W, H);
        if (who === 'mochi') {
          drawCat(c, W / 2, H / 2 + s * 0.42, s * 0.62, 'sit', t, false);
          return;
        }
        if (who === 'mahalle') {
          drawAvatar(c, randomLook(11), 'happy', W / 2 - s * 0.22, H / 2 + s * 0.45, s * 0.8, {
            bob: Math.sin(t * 2),
          });
          drawAvatar(c, randomLook(29), 'neutral', W / 2 + s * 0.22, H / 2 + s * 0.48, s * 0.8, {
            bob: Math.cos(t * 2),
          });
          return;
        }
        drawAvatar(
          c,
          { seed: 1, special: who as 'hana' },
          mood,
          W / 2,
          H / 2 + s * 0.48,
          s * 0.96,
          { bob: Math.sin(t * 2) * 2 }
        );
      }}
    />
  );
}
