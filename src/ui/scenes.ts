// Ready-made scene drawers for menus and story screens.
import { drawSalonBack, drawSalonFront, drawSalonLight, salonLayout, type Diner } from '../art/salon';
import { avatarImage, randomLook } from '../art/avatar';
import { drawCat } from '../art/cat';
import type { Tod } from '../art/common';
import type { DecorState } from '../game/decor';
import type { SceneDraw } from './SceneCanvas';

const diners: (Diner & { seed: number })[] = [
  { seat: 0, img: null, bob: 0, eating: true, seed: 101 },
  { seat: 1, img: null, bob: 1, eating: false, seed: 202 },
  { seat: 3, img: null, bob: 2, eating: true, seed: 303 },
];

export function salonScene(decor: DecorState, tod: Tod, rain = false, withCat = true): SceneDraw {
  return (c, W, H, t) => {
    const L = salonLayout(W, H, decor);
    for (const d of diners) {
      if (!d.img) d.img = avatarImage(randomLook(d.seed), 'happy', d.eating);
      d.bob = t * 2 + d.seed;
    }
    const ds = diners.filter((d) => d.seat < L.seats.length);
    const o = { rain, diners: ds, tipCoins: 6, lampsOn: tod === 'aksam' || tod === 'gunbatimi' };
    drawSalonBack(c, W, H, decor, tod, t, o);
    if (withCat) drawCat(c, L.catSpots[0].x, L.catSpots[0].y, 64, 'loaf', t, false);
    drawSalonFront(c, W, H, decor, tod, t, o);
    drawSalonLight(c, W, H, decor, tod);
  };
}
