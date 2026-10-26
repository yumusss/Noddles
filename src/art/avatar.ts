// Customer / story-character portraits.
// Base heads come from DiceBear's "Toon Head" style by Johan Melin (CC BY 4.0),
// rendered through @dicebear/core (MIT) into an <img> that we cache per look+mood.
// Story characters get hand-drawn canvas accessory overlays (hats, glasses, helmet).
import { createAvatar } from '@dicebear/core';
import * as toonHead from '@dicebear/toon-head';
import { PAL, circle, ellipse, rng, roundRect, type Ctx } from './common';

export type Mood = 'happy' | 'neutral' | 'worried' | 'angry' | 'love';
export type Special = 'hana' | 'baron' | 'lezzetova' | 'ruzgar' | 'sef';
export interface Look {
  seed: number;
  special?: Special;
  kid?: boolean;
}

type Opts = Record<string, unknown>;

const HAIR = ['sideComed', 'undercut', 'spiky', 'bun'] as const;
const REAR = ['longStraight', 'longWavy', 'shoulderHigh', 'neckHigh'] as const;
const CLOTHES = ['turtleNeck', 'openJacket', 'dress', 'shirt', 'tShirt'] as const;
// soft, cohesive "café" palette so every customer looks like they belong in the same picture
const CLOTH_COL = [
  '9cb89a',
  'e3a7a1',
  'f2d58b',
  'a9c4dc',
  'b8a9d6',
  'd98b6c',
  'f3ead9',
  '9a7b62',
  '7fb3ad',
  'f4c7b5',
  '6f8fa8',
];
const KID_COL = ['f2d58b', 'a9c4dc', 'f4c7b5', '9fc39a', 'e9a3b7', 'cfe3ec'];
const SKIN = ['f6d5c0', 'eec3a5', 'd9a27f', 'b98163', '8a5a44', 'f9e0d0'];
const HAIR_COL = ['3b2a24', '6b4630', 'a0704a', 'd9b07a', '2a2a2e', '8a5a44', 'c98f6a'];
const BEARD = ['moustacheTwirl', 'fullBeard', 'chin', 'chinMoustache', 'longBeard'] as const;

function face(mood: Mood | 'eating'): Opts {
  switch (mood) {
    case 'love':
      return { eyes: ['bow'], eyebrows: ['happy'], mouth: ['laugh'] };
    case 'happy':
      return { eyes: ['happy'], eyebrows: ['happy'], mouth: ['smile'] };
    case 'neutral':
      return { eyes: ['wide'], eyebrows: ['neutral'], mouth: ['smile'] };
    case 'worried':
      return { eyes: ['humble'], eyebrows: ['sad'], mouth: ['sad'] };
    case 'angry':
      return { eyes: ['wide'], eyebrows: ['angry'], mouth: ['angry'] };
    case 'eating':
      return { eyes: ['bow'], eyebrows: ['raised'], mouth: ['agape'] };
  }
}

function base(seed: number, kid: boolean) {
  const r = rng(seed * 13 + 7);
  const p = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const fem = r() < 0.5;
  const opts: Opts = {
    hair: [fem ? p(['bun', 'sideComed'] as const) : p(HAIR)],
    rearHair: [p(REAR)],
    rearHairProbability: fem ? 100 : 0,
    hairColor: [p(HAIR_COL)],
    skinColor: [p(SKIN)],
    clothes: [fem ? p(CLOTHES) : p(['turtleNeck', 'openJacket', 'shirt', 'tShirt'] as const)],
    clothesColor: [p(kid ? KID_COL : CLOTH_COL)],
    beard: [p(BEARD)],
    beardProbability: !fem && !kid && r() < 0.35 ? 100 : 0,
  };
  if (kid) opts.clothes = [p(['tShirt', 'shirt', 'dress'] as const)];
  return { fem, opts };
}

/** Deterministic look from a seed; about 15% of customers are kids. */
export function randomLook(seed: number): Look {
  const r = rng(seed ^ 0x9e3779b9);
  return { seed, kid: r() < 0.15 };
}

/** Whether a look reads as a woman (used to give customers fitting names). */
export function isFeminine(look: Look): boolean {
  if (look.special) return look.special === 'hana' || look.special === 'lezzetova';
  return base(look.seed, !!look.kid).fem;
}

function lookOpts(look: Look): Opts {
  switch (look.special) {
    case 'hana':
      return {
        hair: ['bun'],
        hairColor: ['dcdce3'],
        rearHairProbability: 0,
        skinColor: ['f1c3a5'],
        clothes: ['turtleNeck'],
        clothesColor: ['b11f1f'],
        beardProbability: 0,
      };
    case 'baron':
      return {
        hair: ['sideComed'],
        hairColor: ['2c1b18'],
        rearHairProbability: 0,
        skinColor: ['f7d7c4'],
        clothes: ['openJacket'],
        clothesColor: ['4a235a'],
        beard: ['moustacheTwirl'],
        beardProbability: 100,
      };
    case 'lezzetova':
      return {
        hair: ['bun'],
        hairColor: ['2c1b18'],
        rearHair: ['longWavy'],
        rearHairProbability: 100,
        skinColor: ['f1c3a5'],
        clothes: ['dress'],
        clothesColor: ['151613'],
        beardProbability: 0,
      };
    case 'ruzgar':
      return {
        hair: ['spiky'],
        hairColor: ['724133'],
        rearHairProbability: 0,
        skinColor: ['b98e6a'],
        clothes: ['openJacket'],
        clothesColor: ['2a9d8f'],
        beardProbability: 0,
      };
    case 'sef':
      return {
        hair: ['undercut'],
        hairColor: ['2c1b18'],
        rearHairProbability: 0,
        skinColor: ['c68e7a'],
        clothes: ['shirt'],
        clothesColor: ['e8e9e6'],
        beard: ['chin'],
        beardProbability: 100,
      };
  }
  return base(look.seed, !!look.kid).opts;
}

// ---------- image cache ----------
interface Entry {
  img: HTMLImageElement;
  ready: boolean;
}
const imgs = new Map<string, Entry>();

function key(look: Look, mood: Mood, eating: boolean) {
  return `${look.special ?? ''}|${look.seed}|${look.kid ? 1 : 0}|${mood}|${eating ? 1 : 0}`;
}

function entry(look: Look, mood: Mood, eating: boolean): Entry {
  const k = key(look, mood, eating);
  let e = imgs.get(k);
  if (e) return e;
  const uri = createAvatar(toonHead, {
    seed: String(look.seed),
    backgroundColor: ['transparent'],
    ...lookOpts(look),
    ...face(eating ? 'eating' : mood),
  } as never).toDataUri();
  const img = new Image();
  e = { img, ready: false };
  img.onload = () => {
    e!.ready = true;
  };
  img.src = uri;
  imgs.set(k, e);
  return e;
}

/** Cached <img> for a look+mood; null until the SVG has decoded (the game redraws every frame). */
export function avatarImage(look: Look, mood: Mood, eating = false): HTMLImageElement | null {
  const e = entry(look, mood, eating);
  return e.ready ? e.img : null;
}

/** Start decoding the images a customer will need so they appear instantly. */
export function preloadAvatar(look: Look, moods: Mood[]): void {
  for (const m of moods) entry(look, m, false);
  entry(look, 'happy', true);
}

// ---------- drawing ----------
const OUT = 'rgba(60,35,20,0.3)';

function placeholder(c: Ctx) {
  // soft silhouette in a 100x100 box
  c.fillStyle = PAL.sand;
  circle(c, 50, 42, 24);
  c.fill();
  c.beginPath();
  c.moveTo(10, 100);
  c.quadraticCurveTo(12, 70, 50, 68);
  c.quadraticCurveTo(88, 70, 90, 100);
  c.closePath();
  c.fill();
}

function heart(c: Ctx, x: number, y: number, r: number) {
  c.beginPath();
  c.moveTo(x, y + r);
  c.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4);
  c.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r);
  c.closePath();
}

/** Accessories, drawn in a 100×100 box that matches the avatar square. */
function overlay(c: Ctx, who: Special) {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  switch (who) {
    case 'hana': {
      c.strokeStyle = '#6b3a1f';
      c.lineWidth = 1.6;
      c.fillStyle = 'rgba(255,255,255,0.18)';
      circle(c, 41, 44, 6.2);
      c.fill();
      c.stroke();
      circle(c, 59, 44, 6.2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(47, 44);
      c.lineTo(53, 44);
      c.stroke();
      // red hair stick through the bun
      c.strokeStyle = '#c0392b';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(42, 9);
      c.lineTo(60, 17);
      c.stroke();
      c.fillStyle = '#e74c3c';
      circle(c, 41.5, 8.6, 2.2);
      c.fill();
      break;
    }
    case 'baron': {
      // top hat
      c.fillStyle = '#1b1b1f';
      roundRect(c, 32, -4, 36, 24, 2.5);
      c.fill();
      c.fillStyle = '#7d3c98';
      c.fillRect(32, 13, 36, 5);
      c.fillStyle = '#1b1b1f';
      ellipse(c, 50, 20, 28, 4.5);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.12)';
      roundRect(c, 36, -1, 5, 14, 2);
      c.fill();
      // monocle
      c.strokeStyle = '#c9a227';
      c.lineWidth = 1.5;
      c.fillStyle = 'rgba(255,255,255,0.2)';
      circle(c, 60, 44, 6.2);
      c.fill();
      c.stroke();
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(66, 45);
      c.quadraticCurveTo(70, 53, 68, 62);
      c.stroke();
      break;
    }
    case 'lezzetova': {
      c.save();
      c.translate(53, 15);
      c.rotate(-0.14);
      c.fillStyle = '#1a1a1e';
      ellipse(c, 0, 0, 29, 7);
      c.fill();
      c.fillStyle = '#2a2a30';
      ellipse(c, 0, -6, 14, 7);
      c.fill();
      c.restore();
      // rose
      c.fillStyle = '#c0392b';
      circle(c, 70, 10, 3.6);
      c.fill();
      c.fillStyle = '#e74c3c';
      circle(c, 69.2, 9.2, 2);
      c.fill();
      c.fillStyle = '#6f8f66';
      ellipse(c, 74.5, 12, 2.6, 1.3);
      c.fill();
      // pearls
      c.fillStyle = '#fbf7ef';
      c.strokeStyle = 'rgba(120,100,80,0.35)';
      c.lineWidth = 0.5;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.18 + (0.64 * i) / 8);
        const px = 50 + Math.cos(a) * 15;
        const py = 70 + Math.sin(a) * 6;
        circle(c, px, py, 1.7);
        c.fill();
        c.stroke();
      }
      break;
    }
    case 'ruzgar': {
      // helmet
      c.fillStyle = '#1f8a80';
      c.beginPath();
      c.moveTo(25, 35);
      c.quadraticCurveTo(25, 7, 50, 7);
      c.quadraticCurveTo(75, 7, 75, 35);
      c.lineTo(70, 35);
      c.quadraticCurveTo(68, 20, 50, 20);
      c.quadraticCurveTo(32, 20, 30, 35);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.beginPath();
      c.moveTo(31, 24);
      c.quadraticCurveTo(50, 13, 69, 24);
      c.lineTo(67, 19);
      c.quadraticCurveTo(50, 11, 33, 19);
      c.closePath();
      c.fill();
      c.strokeStyle = '#f4a259';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(40, 10);
      c.lineTo(60, 10);
      c.stroke();
      // orange jacket collar
      c.fillStyle = '#f08a3c';
      c.beginPath();
      c.moveTo(28, 100);
      c.lineTo(31, 78);
      c.lineTo(42, 72);
      c.lineTo(50, 86);
      c.lineTo(58, 72);
      c.lineTo(69, 78);
      c.lineTo(72, 100);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.6)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(33, 84);
      c.lineTo(67, 84);
      c.stroke();
      break;
    }
    case 'sef': {
      c.fillStyle = '#ffffff';
      c.strokeStyle = 'rgba(140,130,120,0.5)';
      c.lineWidth = 1.1;
      roundRect(c, 29, 17, 42, 8, 3);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(29, 21);
      c.lineTo(22, 26);
      c.lineTo(31, 24);
      c.closePath();
      c.fill();
      c.stroke();
      break;
    }
  }
}

export function drawAvatar(
  c: Ctx,
  look: Look,
  mood: Mood,
  x: number,
  y: number,
  size: number,
  opts?: { eating?: boolean; flip?: boolean; bob?: number }
): void {
  const s = look.kid ? size * 0.78 : size;
  const bob = opts?.bob ?? 0;
  const img = avatarImage(look, mood, !!opts?.eating);
  c.save();
  c.translate(x, y - bob);
  if (opts?.flip) c.scale(-1, 1);
  c.translate(-s / 2, -s);
  if (img) c.drawImage(img, 0, 0, s, s);
  else {
    c.save();
    c.scale(s / 100, s / 100);
    placeholder(c);
    c.restore();
  }
  if (look.special) {
    c.save();
    c.scale(s / 100, s / 100);
    overlay(c, look.special);
    c.restore();
  }
  if (mood === 'love' && !opts?.eating) {
    c.save();
    c.scale(s / 100, s / 100);
    c.fillStyle = '#ef6f8a';
    c.strokeStyle = OUT;
    c.lineWidth = 0.8;
    const hs: [number, number, number][] = [
      [84, 30, 5],
      [93, 18, 3.6],
      [78, 14, 2.8],
    ];
    for (const [hx, hy, r] of hs) {
      heart(c, hx, hy, r);
      c.fill();
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}
