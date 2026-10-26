// Canvas avatars of the animal folk: a round avatar for lists, and a talking portrait for dialogue.

import { useEffect, useRef } from 'react';
import type { Species, Speaker } from '../game/data';
import { CHAR_LOOKS, drawAvatar, drawBust, lookFor } from '../art/animals';
import { setPx } from '../art/common';
import type { Mood } from '../game/session';

export function Avatar({
  species,
  seed,
  special,
  size = 48,
  mood = 'happy',
}: {
  species: Species;
  seed: number;
  special?: Speaker;
  size?: number;
  mood?: Mood;
}) {
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
    drawAvatar(c, special ? CHAR_LOOKS[special] : lookFor(species, seed, false), size, mood);
  }, [species, seed, special, size, mood]);
  return <canvas ref={ref} className="avatar" style={{ width: size, height: size }} />;
}

export function Portrait({
  who,
  size = 200,
  talking = false,
  mood = 'happy',
}: {
  who: Speaker;
  size?: number;
  talking?: boolean;
  mood?: Mood;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const talk = useRef(talking);
  useEffect(() => {
    talk.current = talking;
  }, [talking]);
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
      c.translate(size / 2, size);
      drawBust(c, CHAR_LOOKS[who], size * 0.19, {
        mood,
        talk: talk.current ? (Math.sin(t * 22) + 1) / 2 : 0,
        t,
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [who, size, mood]);
  return <canvas ref={ref} className="portrait" style={{ width: size, height: size }} />;
}
