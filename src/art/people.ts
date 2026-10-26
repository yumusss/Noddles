// Customers and story characters: hand-drawn in code with bodies, many hair styles,
// outfits and skin tones; five moods, talking mouth, sitting / walking / eating poses.

import type { Speaker } from '../game/data';
import type { Mood } from '../game/session';
import { type Ctx, darken, ellipse, lighten, lin, rad, rgba, rr, sheen, srand } from './common';

export interface Look {
  skin: string;
  hair: number;
  hairCol: string;
  outfit: number;
  top: string;
  top2: string;
  bottom: string;
  acc:
    | 'none'
    | 'glasses'
    | 'beanie'
    | 'cap'
    | 'earring'
    | 'scarf'
    | 'beret'
    | 'captain'
    | 'hood'
    | 'shades';
  kid: boolean;
  female: boolean;
  blush: boolean;
  freckles: boolean;
  beard?: boolean;
  wrinkles?: boolean;
}

const SKINS = ['#f9dcc4', '#f3cba8', '#e8b48a', '#d49a6d', '#b87a50', '#8f5a38', '#6e4128'];
const HAIRS = [
  '#2e221b',
  '#4a3226',
  '#6b4a2e',
  '#9a6a3a',
  '#c99a5a',
  '#e2c17c',
  '#b65a32',
  '#8c8c8c',
  '#3a2a3e',
];
const TOPS = [
  '#e98d7a',
  '#9fc39a',
  '#f0c46c',
  '#7f93c6',
  '#e7a3b6',
  '#78b3b0',
  '#d98852',
  '#b9a3d6',
  '#f4efe3',
  '#5d6f99',
];
const BOTTOMS = ['#4f5a7a', '#6b5143', '#3e4a5e', '#7a6a58', '#2f3a4e', '#8a6f8e'];

export const HAIR_STYLES = 12;
export const OUTFITS = 10;

export function lookFromSeed(seed: number, kid: boolean, female: boolean): Look {
  const r = srand(seed);
  const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const femStyles = [1, 2, 3, 4, 6, 8, 9, 10, 11];
  const maleStyles = [0, 5, 6, 7, 9, 10, 0, 5];
  const accs: Look['acc'][] = [
    'none',
    'none',
    'none',
    'glasses',
    'beanie',
    'cap',
    'earring',
    'scarf',
  ];
  return {
    skin: pick(SKINS),
    hair: female ? pick(femStyles) : pick(maleStyles),
    hairCol: kid ? pick(HAIRS.slice(0, 7)) : pick(HAIRS),
    outfit: Math.floor(r() * OUTFITS),
    top: pick(TOPS),
    top2: pick(TOPS),
    bottom: pick(BOTTOMS),
    acc: kid ? pick(['none', 'none', 'cap', 'beanie'] as Look['acc'][]) : pick(accs),
    kid,
    female,
    blush: r() < 0.6,
    freckles: r() < 0.2,
    beard: !female && !kid && r() < 0.18,
  };
}

export const SPECIAL_LOOKS: Partial<Record<Speaker, Look>> = {
  ume: {
    skin: '#f3cba8',
    hair: 10,
    hairCol: '#c9c4bd',
    outfit: 4,
    top: '#56638c',
    top2: '#f4efe3',
    bottom: '#3d4770',
    acc: 'glasses',
    kid: false,
    female: true,
    blush: true,
    freckles: false,
    wrinkles: true,
  },
  tuna: {
    skin: '#d49a6d',
    hair: 0,
    hairCol: '#8c8c8c',
    outfit: 8,
    top: '#f0c46c',
    top2: '#e9e0cf',
    bottom: '#3e4a5e',
    acc: 'captain',
    kid: false,
    female: false,
    blush: true,
    freckles: false,
    beard: true,
    wrinkles: true,
  },
  gleam: {
    skin: '#f3cba8',
    hair: 6,
    hairCol: '#2e221b',
    outfit: 7,
    top: '#f4efe3',
    top2: '#d9573f',
    bottom: '#f4efe3',
    acc: 'shades',
    kid: false,
    female: false,
    blush: false,
    freckles: false,
  },
  mina: {
    skin: '#e8b48a',
    hair: 4,
    hairCol: '#2e221b',
    outfit: 5,
    top: '#e7a3b6',
    top2: '#fff6e9',
    bottom: '#78b3b0',
    acc: 'none',
    kid: true,
    female: true,
    blush: true,
    freckles: true,
  },
  stranger: {
    skin: '#d49a6d',
    hair: 0,
    hairCol: '#4a3226',
    outfit: 8,
    top: '#5d6f99',
    top2: '#3e4a5e',
    bottom: '#2f3a4e',
    acc: 'hood',
    kid: false,
    female: false,
    blush: false,
    freckles: false,
    beard: true,
  },
  critic: {
    skin: '#f9dcc4',
    hair: 1,
    hairCol: '#b65a32',
    outfit: 7,
    top: '#3a2a3e',
    top2: '#d9573f',
    bottom: '#3a2a3e',
    acc: 'beret',
    kid: false,
    female: true,
    blush: false,
    freckles: false,
  },
};

const OUT = (skin: string) => darken(skin, 0.45);

// ---------- head ----------

function hairBack(c: Ctx, L: Look, R: number) {
  const col = L.hairCol;
  c.fillStyle = lin(c, 0, -R, 0, R * 2, [
    [0, lighten(col, 0.12)],
    [1, darken(col, 0.15)],
  ]);
  switch (L.hair) {
    case 2: // long straight
    case 11: // long wavy
      c.beginPath();
      c.moveTo(-R * 1.02, -R * 0.2);
      if (L.hair === 11) {
        c.bezierCurveTo(-R * 1.35, R * 0.8, -R * 0.9, R * 1.3, -R * 1.15, R * 2.1);
        c.lineTo(R * 1.15, R * 2.1);
        c.bezierCurveTo(R * 0.9, R * 1.3, R * 1.35, R * 0.8, R * 1.02, -R * 0.2);
      } else {
        c.lineTo(-R * 1.08, R * 1.9);
        c.quadraticCurveTo(0, R * 2.1, R * 1.08, R * 1.9);
        c.lineTo(R * 1.02, -R * 0.2);
      }
      c.closePath();
      c.fill();
      break;
    case 3: // ponytail
      ellipse(c, R * 0.9, R * 0.3, R * 0.35, R * 0.8, -0.4);
      c.fill();
      break;
    case 8: // braid over shoulder
      for (let i = 0; i < 5; i++) {
        ellipse(c, R * (0.75 + i * 0.05), R * (0.6 + i * 0.32), R * 0.22, R * 0.2);
        c.fill();
      }
      break;
    case 1: // bob
      c.beginPath();
      c.moveTo(-R * 1.08, -R * 0.3);
      c.quadraticCurveTo(-R * 1.25, R * 0.75, -R * 0.7, R * 0.85);
      c.lineTo(R * 0.7, R * 0.85);
      c.quadraticCurveTo(R * 1.25, R * 0.75, R * 1.08, -R * 0.3);
      c.closePath();
      c.fill();
      break;
  }
}

function hairFront(c: Ctx, L: Look, R: number) {
  const col = L.hairCol;
  const grad = lin(c, 0, -R * 1.3, 0, R * 0.3, [
    [0, lighten(col, 0.15)],
    [1, darken(col, 0.08)],
  ]);
  c.fillStyle = grad;
  const cap = (fringe: number) => {
    c.beginPath();
    c.moveTo(-R * 1.02, R * 0.1);
    c.bezierCurveTo(-R * 1.15, -R * 1.25, R * 1.15, -R * 1.25, R * 1.02, R * 0.1);
    c.bezierCurveTo(R * 0.7, -R * fringe, -R * 0.3, -R * (fringe + 0.25), -R * 1.02, R * 0.1);
    c.closePath();
    c.fill();
  };
  switch (L.hair) {
    case 0: // short crop
      cap(0.55);
      break;
    case 1: // bob with bangs
      cap(0.35);
      c.beginPath();
      c.moveTo(-R * 0.85, -R * 0.5);
      c.quadraticCurveTo(0, -R * 0.15, R * 0.85, -R * 0.5);
      c.lineTo(R * 0.8, -R * 0.75);
      c.lineTo(-R * 0.8, -R * 0.75);
      c.fill();
      break;
    case 2:
    case 11:
      cap(0.45);
      break;
    case 3:
      cap(0.5);
      break;
    case 4: // two buns
      cap(0.5);
      ellipse(c, -R * 0.78, -R * 0.85, R * 0.36, R * 0.34);
      c.fill();
      ellipse(c, R * 0.78, -R * 0.85, R * 0.36, R * 0.34);
      c.fill();
      break;
    case 5: {
      // curly
      const r = srand(7);
      for (let i = 0; i < 16; i++) {
        const a = Math.PI + (i / 15) * Math.PI;
        ellipse(
          c,
          Math.cos(a) * R * 0.95,
          Math.sin(a) * R * 0.95 - R * 0.1,
          R * (0.32 + r() * 0.08),
          R * 0.3
        );
        c.fill();
      }
      ellipse(c, 0, -R * 0.6, R * 0.9, R * 0.45);
      c.fill();
      break;
    }
    case 6: // side part sweep
      c.beginPath();
      c.moveTo(-R * 1.03, R * 0.0);
      c.bezierCurveTo(-R * 1.1, -R * 1.3, R * 1.2, -R * 1.2, R * 1.03, R * 0.05);
      c.bezierCurveTo(R * 0.6, -R * 0.65, -R * 0.2, -R * 0.4, -R * 0.55, -R * 0.75);
      c.quadraticCurveTo(-R * 0.8, -R * 0.3, -R * 1.03, R * 0.0);
      c.fill();
      break;
    case 7: {
      // spiky
      c.beginPath();
      c.moveTo(-R * 1.0, R * 0.0);
      const n = 7;
      for (let i = 0; i <= n; i++) {
        const a = Math.PI + (i / n) * Math.PI;
        const rr0 = i % 2 ? R * 1.2 : R * 1.0;
        c.lineTo(Math.cos(a) * rr0, Math.sin(a) * rr0 - R * 0.1);
      }
      c.lineTo(R * 1.0, R * 0.0);
      c.quadraticCurveTo(0, -R * 0.55, -R * 1.0, 0);
      c.fill();
      break;
    }
    case 8:
      cap(0.5);
      break;
    case 9: // pixie
      cap(0.6);
      c.beginPath();
      c.moveTo(-R * 0.9, -R * 0.4);
      c.quadraticCurveTo(-R * 0.2, -R * 0.2, R * 0.2, -R * 0.75);
      c.lineTo(-R * 0.6, -R * 0.9);
      c.fill();
      break;
    case 10: // top bun (grandma-style or modern)
      cap(0.55);
      ellipse(c, 0, -R * 1.2, R * 0.42, R * 0.34);
      c.fill();
      c.strokeStyle = rgba(darken(col, 0.3), 0.6);
      c.lineWidth = 1;
      c.beginPath();
      c.arc(0, -R * 1.2, R * 0.25, 0.4, 2.6);
      c.stroke();
      break;
  }
  // a soft highlight in the hair
  sheen(c, -R * 0.3, -R * 0.85, R * 0.45, R * 0.12, 0.25, -0.3);
}

function eye(
  c: Ctx,
  x: number,
  y: number,
  R: number,
  mood: Mood,
  blink: boolean,
  side: number,
  ink: string
) {
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.lineWidth = R * 0.08;
  if (mood === 'love') {
    const s = R * 0.17;
    c.fillStyle = '#e2475a';
    c.beginPath();
    c.moveTo(x, y + s * 0.9);
    c.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.5, y - s * 1.4, x, y - s * 0.4);
    c.bezierCurveTo(x + s * 0.5, y - s * 1.4, x + s * 1.6, y - s * 0.2, x, y + s * 0.9);
    c.fill();
    sheen(c, x - s * 0.4, y - s * 0.5, s * 0.35, s * 0.2, 0.8);
    return;
  }
  if (mood === 'happy' || blink) {
    c.beginPath();
    if (blink) {
      c.moveTo(x - R * 0.13, y);
      c.lineTo(x + R * 0.13, y);
    } else c.arc(x, y + R * 0.06, R * 0.13, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
    return;
  }
  ellipse(c, x, y, R * 0.1, R * 0.13);
  c.fill();
  ellipse(c, x - R * 0.03, y - R * 0.05, R * 0.035, R * 0.04);
  c.fillStyle = '#fff';
  c.fill();
  // brows
  c.strokeStyle = ink;
  c.lineWidth = R * 0.065;
  c.beginPath();
  const by = y - R * 0.28;
  if (mood === 'angry') {
    c.moveTo(x - side * R * 0.18, by - R * 0.06);
    c.lineTo(x + side * R * 0.14, by + R * 0.06);
  } else if (mood === 'worried') {
    c.moveTo(x - side * R * 0.16, by + R * 0.05);
    c.lineTo(x + side * R * 0.14, by - R * 0.05);
  } else {
    c.moveTo(x - R * 0.15, by);
    c.quadraticCurveTo(x, by - R * 0.06, x + R * 0.15, by);
  }
  c.stroke();
}

export function drawHead(
  c: Ctx,
  L: Look,
  R: number,
  mood: Mood,
  talk: number,
  t: number,
  back = true
) {
  const ink = OUT(L.skin);
  // back hair (normally drawn earlier, behind the torso)
  if (back) hairBack(c, L, R);
  if (L.acc === 'hood') {
    ellipse(c, 0, -R * 0.05, R * 1.3, R * 1.3);
    c.fillStyle = lin(c, 0, -R * 1.3, 0, R, [
      [0, lighten(L.top, 0.1)],
      [1, darken(L.top, 0.2)],
    ]);
    c.fill();
  }
  // ears
  for (const s of [-1, 1]) {
    ellipse(c, s * R * 0.98, R * 0.05, R * 0.18, R * 0.24);
    c.fillStyle = darken(L.skin, 0.05);
    c.fill();
    if (L.acc === 'earring') {
      c.beginPath();
      c.arc(s * R * 1.0, R * 0.32, R * 0.07, 0, Math.PI * 2);
      c.fillStyle = '#e9b45c';
      c.fill();
    }
  }
  // face
  c.beginPath();
  const jaw = L.kid ? 1.0 : 0.95;
  c.moveTo(-R, -R * 0.1);
  c.bezierCurveTo(-R * 1.02, -R * 1.25, R * 1.02, -R * 1.25, R, -R * 0.1);
  c.bezierCurveTo(R * 0.98, R * 0.7 * jaw, R * 0.45, R * 1.02 * jaw, 0, R * 1.02 * jaw);
  c.bezierCurveTo(-R * 0.45, R * 1.02 * jaw, -R * 0.98, R * 0.7 * jaw, -R, -R * 0.1);
  c.closePath();
  c.fillStyle = rad(c, -R * 0.3, -R * 0.35, R * 0.1, R * 1.4, [
    [0, lighten(L.skin, 0.12)],
    [0.7, L.skin],
    [1, darken(L.skin, 0.1)],
  ]);
  c.fill();
  c.strokeStyle = rgba(ink, 0.35);
  c.lineWidth = R * 0.03;
  c.stroke();
  if (mood === 'angry') {
    c.fillStyle = 'rgba(230,80,60,0.18)';
    c.fill();
  }
  // blush & freckles
  if (L.blush || mood === 'love' || mood === 'happy') {
    for (const s of [-1, 1]) {
      ellipse(c, s * R * 0.55, R * 0.38, R * 0.2, R * 0.12);
      c.fillStyle = rgba('#ef8f8a', mood === 'love' ? 0.55 : 0.32);
      c.fill();
    }
  }
  if (L.freckles) {
    c.fillStyle = rgba(darken(L.skin, 0.35), 0.5);
    for (const s of [-1, 1])
      for (let i = 0; i < 3; i++)
        c.fillRect(s * R * (0.45 + i * 0.08) - 0.5, R * (0.25 + (i % 2) * 0.06), 1.1, 1.1);
  }
  if (L.wrinkles) {
    c.strokeStyle = rgba(ink, 0.25);
    c.lineWidth = R * 0.03;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.arc(
        s * R * 0.62,
        R * 0.02,
        R * 0.12,
        s > 0 ? -0.6 : Math.PI - 0.6,
        s > 0 ? 0.6 : Math.PI + 0.6
      );
      c.stroke();
    }
  }
  // eyes
  const blink = Math.sin(t * 1.7 + L.outfit) > 0.985;
  const ey = R * 0.05;
  eye(c, -R * 0.38, ey, R, mood, blink, -1, ink);
  eye(c, R * 0.38, ey, R, mood, blink, 1, ink);
  if (mood === 'worried') {
    // sweat drop
    c.beginPath();
    c.moveTo(R * 0.85, -R * 0.55);
    c.quadraticCurveTo(R * 0.98, -R * 0.3, R * 0.85, -R * 0.22);
    c.quadraticCurveTo(R * 0.72, -R * 0.3, R * 0.85, -R * 0.55);
    c.fillStyle = 'rgba(140,190,230,0.85)';
    c.fill();
  }
  // nose
  c.strokeStyle = rgba(ink, 0.45);
  c.lineWidth = R * 0.05;
  c.beginPath();
  c.arc(0, R * 0.3, R * 0.07, 0.2, Math.PI - 0.2);
  c.stroke();
  // mouth
  const my = R * 0.6;
  c.lineWidth = R * 0.06;
  c.strokeStyle = ink;
  if (talk > 0.05) {
    ellipse(c, 0, my, R * 0.13, R * (0.05 + talk * 0.12));
    c.fillStyle = '#9c3f3a';
    c.fill();
    ellipse(c, 0, my + R * 0.06 * talk, R * 0.08, R * 0.04 * talk);
    c.fillStyle = '#e07a74';
    c.fill();
  } else if (mood === 'happy' || mood === 'love') {
    c.beginPath();
    c.moveTo(-R * 0.22, my - R * 0.04);
    c.quadraticCurveTo(0, my + R * 0.32, R * 0.22, my - R * 0.04);
    c.closePath();
    c.fillStyle = '#9c3f3a';
    c.fill();
    c.beginPath();
    c.moveTo(-R * 0.16, my);
    c.quadraticCurveTo(0, my + R * 0.06, R * 0.16, my);
    c.fillStyle = '#fff';
    c.fill();
  } else if (mood === 'angry') {
    c.beginPath();
    c.arc(0, my + R * 0.14, R * 0.16, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
  } else if (mood === 'worried') {
    c.beginPath();
    c.moveTo(-R * 0.15, my + R * 0.04);
    c.quadraticCurveTo(-R * 0.05, my - R * 0.04, 0, my + R * 0.02);
    c.quadraticCurveTo(R * 0.06, my + R * 0.08, R * 0.15, my);
    c.stroke();
  } else {
    c.beginPath();
    c.moveTo(-R * 0.12, my);
    c.quadraticCurveTo(0, my + R * 0.08, R * 0.12, my);
    c.stroke();
  }
  if (L.beard) {
    c.beginPath();
    c.moveTo(-R * 0.85, R * 0.2);
    c.quadraticCurveTo(-R * 0.75, R * 1.25, 0, R * 1.22);
    c.quadraticCurveTo(R * 0.75, R * 1.25, R * 0.85, R * 0.2);
    c.quadraticCurveTo(R * 0.4, R * 0.95, 0, R * 0.78);
    c.quadraticCurveTo(-R * 0.4, R * 0.95, -R * 0.85, R * 0.2);
    c.fillStyle = rgba(L.hairCol, 0.92);
    c.fill();
  }
  // hair over forehead
  if (L.acc !== 'hood') hairFront(c, L, R);
  // accessories
  switch (L.acc) {
    case 'glasses':
      c.strokeStyle = '#6e4b32';
      c.lineWidth = R * 0.06;
      for (const s of [-1, 1]) {
        rr(c, s * R * 0.38 - R * 0.22, ey - R * 0.17, R * 0.44, R * 0.34, R * 0.12);
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.18)';
        c.fill();
      }
      c.beginPath();
      c.moveTo(-R * 0.16, ey - R * 0.02);
      c.lineTo(R * 0.16, ey - R * 0.02);
      c.stroke();
      break;
    case 'shades':
      c.fillStyle = '#2e2a33';
      for (const s of [-1, 1]) {
        rr(c, s * R * 0.38 - R * 0.25, ey - R * 0.15, R * 0.5, R * 0.3, R * 0.1);
        c.fill();
        sheen(c, s * R * 0.38 - R * 0.08, ey - R * 0.07, R * 0.12, R * 0.05, 0.6);
      }
      c.fillRect(-R * 0.14, ey - R * 0.1, R * 0.28, R * 0.05);
      break;
    case 'beanie':
      c.beginPath();
      c.moveTo(-R * 1.08, -R * 0.35);
      c.bezierCurveTo(-R * 1.1, -R * 1.55, R * 1.1, -R * 1.55, R * 1.08, -R * 0.35);
      c.closePath();
      c.fillStyle = lin(c, 0, -R * 1.5, 0, -R * 0.3, [
        [0, lighten(L.top2, 0.15)],
        [1, darken(L.top2, 0.1)],
      ]);
      c.fill();
      rr(c, -R * 1.1, -R * 0.55, R * 2.2, R * 0.3, R * 0.12);
      c.fillStyle = darken(L.top2, 0.12);
      c.fill();
      c.beginPath();
      c.arc(0, -R * 1.45, R * 0.18, 0, Math.PI * 2);
      c.fillStyle = lighten(L.top2, 0.3);
      c.fill();
      break;
    case 'cap':
      c.beginPath();
      c.moveTo(-R * 1.02, -R * 0.4);
      c.bezierCurveTo(-R * 1.0, -R * 1.45, R * 1.0, -R * 1.45, R * 1.02, -R * 0.4);
      c.closePath();
      c.fillStyle = L.top2;
      c.fill();
      ellipse(c, R * 0.5, -R * 0.42, R * 0.8, R * 0.16, -0.1);
      c.fillStyle = darken(L.top2, 0.15);
      c.fill();
      break;
    case 'beret':
      ellipse(c, -R * 0.15, -R * 0.95, R * 1.0, R * 0.38, -0.2);
      c.fillStyle = '#d9573f';
      c.fill();
      c.beginPath();
      c.arc(-R * 0.1, -R * 1.33, R * 0.08, 0, Math.PI * 2);
      c.fill();
      break;
    case 'captain':
      rr(c, -R * 1.0, -R * 1.25, R * 2.0, R * 0.6, R * 0.25);
      c.fillStyle = '#f4efe3';
      c.fill();
      rr(c, -R * 1.05, -R * 0.75, R * 2.1, R * 0.22, R * 0.1);
      c.fillStyle = '#2f3a4e';
      c.fill();
      ellipse(c, 0, -R * 0.55, R * 0.95, R * 0.15);
      c.fillStyle = '#1f2838';
      c.fill();
      c.beginPath();
      c.arc(0, -R * 0.98, R * 0.14, 0, Math.PI * 2);
      c.fillStyle = '#e9b45c';
      c.fill();
      break;
    case 'hood':
      c.beginPath();
      c.moveTo(-R * 1.25, R * 0.4);
      c.bezierCurveTo(-R * 1.35, -R * 1.5, R * 1.35, -R * 1.5, R * 1.25, R * 0.4);
      c.bezierCurveTo(R * 1.0, -R * 0.9, -R * 1.0, -R * 0.9, -R * 1.25, R * 0.4);
      c.fillStyle = lin(c, 0, -R * 1.4, 0, R * 0.4, [
        [0, lighten(L.top, 0.15)],
        [1, darken(L.top, 0.1)],
      ]);
      c.fill();
      // shadow over the eyes
      c.fillStyle = 'rgba(30,30,50,0.25)';
      c.fillRect(-R * 0.95, -R * 0.75, R * 1.9, R * 0.55);
      break;
    case 'scarf':
      break;
  }
}

// ---------- body ----------

/** torso from waist (y=0) up to the neck; R = head radius */
function torso(c: Ctx, L: Look, R: number, breathe: number) {
  const sh = L.kid ? 1.15 : 1.4;
  const top = -R * (L.kid ? 1.75 : 2.15) + breathe;
  const ink = rgba(darken(L.top, 0.4), 0.35);
  const body = () => {
    c.beginPath();
    c.moveTo(-R * sh * 0.82, 0);
    c.bezierCurveTo(-R * sh * 0.95, top * 0.4, -R * sh * 1.05, top * 0.85, -R * sh * 0.75, top);
    c.quadraticCurveTo(0, top - R * 0.25, R * sh * 0.75, top);
    c.bezierCurveTo(R * sh * 1.05, top * 0.85, R * sh * 0.95, top * 0.4, R * sh * 0.82, 0);
    c.closePath();
  };
  body();
  c.fillStyle = lin(c, -R * sh, top, R * sh, 0, [
    [0, lighten(L.top, 0.12)],
    [1, darken(L.top, 0.12)],
  ]);
  c.fill();
  c.save();
  body();
  c.clip();
  switch (L.outfit) {
    case 1: // hoodie: pocket + strings
      rr(c, -R * 0.7, top * 0.35, R * 1.4, R * 0.55, R * 0.2);
      c.fillStyle = darken(L.top, 0.08);
      c.fill();
      c.strokeStyle = lighten(L.top, 0.4);
      c.lineWidth = R * 0.05;
      c.beginPath();
      c.moveTo(-R * 0.2, top + R * 0.2);
      c.lineTo(-R * 0.22, top + R * 0.8);
      c.moveTo(R * 0.2, top + R * 0.2);
      c.lineTo(R * 0.22, top + R * 0.8);
      c.stroke();
      break;
    case 2: // stripes
    case 6: // fisherman sweater stripes (marine)
      for (let i = 0; i < 8; i++) {
        c.fillStyle = L.outfit === 6 ? rgba('#f4efe3', 0.9) : rgba(L.top2, 0.85);
        c.fillRect(-R * 2, top + i * R * 0.32, R * 4, R * 0.13);
      }
      break;
    case 3: // cardigan open over a shirt
      c.fillStyle = L.top2;
      c.beginPath();
      c.moveTo(-R * 0.35, top);
      c.lineTo(R * 0.35, top);
      c.lineTo(R * 0.2, 0);
      c.lineTo(-R * 0.2, 0);
      c.fill();
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.arc(R * 0.3, top * (0.75 - i * 0.25), R * 0.05, 0, Math.PI * 2);
        c.fillStyle = darken(L.top, 0.3);
        c.fill();
      }
      break;
    case 4: // haori / kimono collar crossing
      c.fillStyle = L.top2;
      c.beginPath();
      c.moveTo(-R * 0.5, top);
      c.lineTo(R * 0.25, top * 0.25);
      c.lineTo(R * 0.05, top * 0.18);
      c.lineTo(-R * 0.7, top * 0.9);
      c.fill();
      c.beginPath();
      c.moveTo(R * 0.5, top);
      c.lineTo(-R * 0.1, top * 0.35);
      c.lineTo(R * 0.1, top * 0.3);
      c.lineTo(R * 0.7, top * 0.9);
      c.fill();
      rr(c, -R * 2, top * 0.18, R * 4, R * 0.35, 0);
      c.fillStyle = darken(L.top, 0.25);
      c.fill();
      break;
    case 5: // overalls / apron bib
      rr(c, -R * 0.65, top * 0.65, R * 1.3, -top * 0.7, R * 0.15);
      c.fillStyle = L.top2;
      c.fill();
      c.fillStyle = darken(L.top2, 0.15);
      c.fillRect(-R * 0.6, top * 0.65, R * 0.15, -top * 0.4);
      c.strokeStyle = L.top2;
      c.lineWidth = R * 0.16;
      c.beginPath();
      c.moveTo(-R * 0.5, top * 0.65);
      c.lineTo(-R * 0.6, top);
      c.moveTo(R * 0.5, top * 0.65);
      c.lineTo(R * 0.6, top);
      c.stroke();
      break;
    case 7: // blazer with lapels and tie/scarf
      c.fillStyle = L.top2;
      c.beginPath();
      c.moveTo(-R * 0.15, top);
      c.lineTo(R * 0.15, top);
      c.lineTo(R * 0.08, top * 0.2);
      c.lineTo(0, 0);
      c.lineTo(-R * 0.08, top * 0.2);
      c.fill();
      c.fillStyle = darken(L.top, 0.1);
      c.beginPath();
      c.moveTo(-R * 0.6, top);
      c.lineTo(-R * 0.1, top * 0.3);
      c.lineTo(-R * 0.45, top * 0.15);
      c.fill();
      c.beginPath();
      c.moveTo(R * 0.6, top);
      c.lineTo(R * 0.1, top * 0.3);
      c.lineTo(R * 0.45, top * 0.15);
      c.fill();
      break;
    case 8: // raincoat with snaps and collar
      c.fillStyle = darken(L.top, 0.1);
      c.fillRect(-R * 0.04, top, R * 0.08, -top);
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(R * 0.18, top * (0.85 - i * 0.22), R * 0.05, 0, Math.PI * 2);
        c.fillStyle = '#e9e0cf';
        c.fill();
      }
      c.fillStyle = lighten(L.top, 0.15);
      c.beginPath();
      c.moveTo(-R * 0.8, top + R * 0.05);
      c.lineTo(0, top + R * 0.45);
      c.lineTo(R * 0.8, top + R * 0.05);
      c.lineTo(R * 0.6, top - R * 0.1);
      c.lineTo(-R * 0.6, top - R * 0.1);
      c.fill();
      break;
    case 9: // dress with a collar
      c.fillStyle = L.top2;
      ellipse(c, -R * 0.25, top + R * 0.1, R * 0.3, R * 0.16, 0.3);
      c.fill();
      ellipse(c, R * 0.25, top + R * 0.1, R * 0.3, R * 0.16, -0.3);
      c.fill();
      break;
    default: // t-shirt with a little print
      c.beginPath();
      c.arc(0, top * 0.45, R * 0.28, 0, Math.PI * 2);
      c.fillStyle = rgba(L.top2, 0.85);
      c.fill();
      break;
  }
  c.restore();
  body();
  c.strokeStyle = ink;
  c.lineWidth = R * 0.04;
  c.stroke();
  if (L.acc === 'scarf') {
    rr(c, -R * 0.75, top - R * 0.15, R * 1.5, R * 0.38, R * 0.18);
    c.fillStyle = L.top2;
    c.fill();
    rr(c, R * 0.15, top + R * 0.1, R * 0.3, R * 0.8, R * 0.1);
    c.fill();
  }
  return top;
}

function arm(
  c: Ctx,
  L: Look,
  R: number,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
  hx: number,
  hy: number
) {
  const sleeve = L.outfit === 4 ? L.top : L.top;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = darken(sleeve, 0.08);
  c.lineWidth = R * (L.kid ? 0.48 : 0.55);
  c.beginPath();
  c.moveTo(sx, sy);
  c.quadraticCurveTo(ex, ey, hx, hy);
  c.stroke();
  c.strokeStyle = lighten(sleeve, 0.05);
  c.lineWidth = R * (L.kid ? 0.36 : 0.42);
  c.stroke();
  // hand
  ellipse(c, hx, hy, R * 0.24, R * 0.2);
  c.fillStyle = L.skin;
  c.fill();
  c.strokeStyle = rgba(OUT(L.skin), 0.3);
  c.lineWidth = R * 0.03;
  c.stroke();
}

export interface PoseOpts {
  mood: Mood;
  talk: number;
  t: number;
  /** eating bob 0..1 */
  eat?: number;
  scale?: number;
}

/**
 * Upper body sitting at the counter; origin = waist (hidden behind the counter top).
 * Hands rest forward on the counter at y ≈ +handY.
 */
export function drawSeated(c: Ctx, L: Look, R: number, o: PoseOpts, handY = R * 0.25) {
  const breathe = Math.sin(o.t * 2) * R * 0.03;
  c.save();
  const tTop = -R * (L.kid ? 1.75 : 2.15) + breathe;
  const eatBob0 = o.eat ? Math.sin(o.eat * Math.PI) * R * 0.15 : 0;
  c.save();
  c.translate(0, tTop - R * 1.1 + breathe + eatBob0);
  hairBack(c, L, R);
  c.restore();
  const top = torso(c, L, R, breathe);
  // neck
  rr(c, -R * 0.28, top - R * 0.45, R * 0.56, R * 0.6, R * 0.2);
  c.fillStyle = darken(L.skin, 0.08);
  c.fill();
  // head
  c.save();
  const tilt = o.mood === 'love' ? Math.sin(o.t * 3) * 0.06 : o.mood === 'angry' ? -0.04 : 0;
  const eatBob = o.eat ? Math.sin(o.eat * Math.PI) * R * 0.15 : 0;
  c.translate(0, top - R * 1.1 + breathe + eatBob);
  c.rotate(tilt);
  drawHead(c, L, R, o.mood, o.talk, o.t, false);
  c.restore();
  // arms resting on the counter
  const sw = R * (L.kid ? 1.0 : 1.2);
  if (o.eat !== undefined) {
    // one hand brings food (chopsticks) to the mouth
    const k = Math.sin(o.eat * Math.PI);
    arm(c, L, R, -sw, top + R * 0.3, -sw * 1.1, handY - R * 0.2, -R * 0.55, handY);
    const hx = R * (0.7 - k * 0.5);
    const hy = handY - k * R * 2.1;
    arm(c, L, R, sw, top + R * 0.3, sw * 1.2, top + R * 1.2, hx, hy);
    c.strokeStyle = '#b07a4a';
    c.lineWidth = R * 0.06;
    c.beginPath();
    c.moveTo(hx + R * 0.1, hy);
    c.lineTo(hx - R * 0.5, hy - R * 0.45);
    c.moveTo(hx + R * 0.16, hy + R * 0.05);
    c.lineTo(hx - R * 0.45, hy - R * 0.38);
    c.stroke();
  } else {
    arm(c, L, R, -sw, top + R * 0.3, -sw * 1.15, handY - R * 0.4, -R * 0.75, handY);
    arm(c, L, R, sw, top + R * 0.3, sw * 1.15, handY - R * 0.4, R * 0.75, handY);
  }
  c.restore();
}

/** forearms resting on the counter top, drawn after the counter */
export function drawHands(c: Ctx, L: Look, R: number, cx: number, y: number, eatT: number) {
  for (const s of [-1, 1]) {
    const x = cx + s * R * 0.95;
    const lift = eatT && s > 0 ? Math.max(0, Math.sin(eatT * 1.3 * Math.PI * 2)) * R * 0.25 : 0;
    // sleeve
    c.save();
    c.translate(x, y - lift);
    c.rotate(-s * 0.25);
    rr(c, -R * 0.32, -R * 0.28, R * 0.64, R * 0.5, R * 0.22);
    c.fillStyle = lin(c, 0, -R * 0.3, 0, R * 0.25, [
      [0, lighten(L.top, 0.08)],
      [1, darken(L.top, 0.12)],
    ]);
    c.fill();
    // hand
    ellipse(c, s * -R * 0.05, R * 0.24, R * 0.26, R * 0.19);
    c.fillStyle = rad(c, -R * 0.08, R * 0.18, 0, R * 0.3, [
      [0, lighten(L.skin, 0.1)],
      [1, darken(L.skin, 0.06)],
    ]);
    c.fill();
    c.strokeStyle = rgba(OUT(L.skin), 0.3);
    c.lineWidth = R * 0.03;
    c.stroke();
    // a hint of fingers
    c.strokeStyle = rgba(OUT(L.skin), 0.25);
    for (let k = -1; k <= 1; k++) {
      c.beginPath();
      c.moveTo(s * -R * 0.05 + k * R * 0.08, R * 0.32);
      c.lineTo(s * -R * 0.05 + k * R * 0.08, R * 0.4);
      c.stroke();
    }
    c.restore();
  }
}

/** full body standing/walking; origin at the feet */
export function drawStanding(
  c: Ctx,
  L: Look,
  R: number,
  o: PoseOpts & { walk?: number; facing?: number }
) {
  const legLen = R * (L.kid ? 1.7 : 2.5);
  const w = o.walk ?? 0;
  const ph = Math.sin(w * Math.PI * 2);
  const bob = Math.abs(Math.cos(w * Math.PI * 2)) * R * 0.08 * (o.walk !== undefined ? 1 : 0);
  c.save();
  c.translate(0, -bob);
  // legs
  const hip = -legLen;
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    const swing = ph * s * R * 0.35;
    c.strokeStyle = darken(L.bottom, 0.05);
    c.lineWidth = R * (L.kid ? 0.42 : 0.5);
    c.beginPath();
    c.moveTo(s * R * 0.32, hip);
    c.lineTo(s * R * 0.32 + swing, -R * 0.1);
    c.stroke();
    // shoe
    ellipse(c, s * R * 0.32 + swing + R * 0.08 * (o.facing ?? 1), -R * 0.05, R * 0.3, R * 0.15);
    c.fillStyle = '#5a4434';
    c.fill();
  }
  if (L.outfit === 9 || (L.female && L.outfit === 4)) {
    // skirt / long robe
    c.beginPath();
    c.moveTo(-R * 1.0, hip + R * 0.1);
    c.lineTo(-R * 1.3, hip + legLen * 0.62);
    c.quadraticCurveTo(0, hip + legLen * 0.7, R * 1.3, hip + legLen * 0.62);
    c.lineTo(R * 1.0, hip + R * 0.1);
    c.closePath();
    c.fillStyle = L.outfit === 9 ? L.top : L.bottom;
    c.fill();
  }
  c.translate(0, hip + R * 0.2);
  const breathe = Math.sin(o.t * 2) * R * 0.02;
  c.save();
  c.translate(0, -R * (L.kid ? 1.75 : 2.15) + breathe - R * 1.1);
  hairBack(c, L, R);
  c.restore();
  const top = torso(c, L, R, breathe);
  rr(c, -R * 0.28, top - R * 0.45, R * 0.56, R * 0.6, R * 0.2);
  c.fillStyle = darken(L.skin, 0.08);
  c.fill();
  c.save();
  c.translate(0, top - R * 1.1);
  drawHead(c, L, R, o.mood, o.talk, o.t, false);
  c.restore();
  const sw = R * (L.kid ? 1.0 : 1.2);
  for (const s of [-1, 1]) {
    const swing = -ph * s * R * 0.5 * (o.walk !== undefined ? 1 : 0.2);
    arm(
      c,
      L,
      R,
      s * sw,
      top + R * 0.35,
      s * sw * 1.15 + swing * 0.5,
      top + R * 1.2,
      s * sw * 0.95 + swing,
      -R * 0.15
    );
  }
  c.restore();
}

/** small figure seated behind a table in the back (eating) */
export function drawAtTable(c: Ctx, L: Look, R: number, t: number, phase: number) {
  const k = (Math.sin(t * 1.3 + phase) + 1) / 2;
  drawSeated(
    c,
    L,
    R,
    { mood: k > 0.8 ? 'happy' : 'neutral', talk: 0, t, eat: k > 0.55 ? (k - 0.55) / 0.45 : 0 },
    R * 0.3
  );
}

// ---------- Inky the octopus (lives in a glass bowl on the counter) ----------

export function drawInky(c: Ctx, s: number, t: number, mood: 'idle' | 'wave' | 'happy' = 'idle') {
  // glass bowl
  const bw = s;
  const bh = s * 0.82;
  ellipse(c, 0, bh * 0.48, bw * 0.55, bh * 0.1);
  c.fillStyle = 'rgba(70,40,20,0.22)';
  c.fill();
  c.save();
  ellipse(c, 0, 0, bw * 0.5, bh * 0.5);
  c.clip();
  // water
  c.fillStyle = lin(c, 0, -bh * 0.2, 0, bh * 0.5, [
    [0, 'rgba(170,215,225,0.55)'],
    [1, 'rgba(110,170,190,0.7)'],
  ]);
  c.fillRect(-bw, -bh * 0.18 + Math.sin(t * 1.5) * 1.5, bw * 2, bh);
  // pebbles
  for (let i = 0; i < 9; i++) {
    ellipse(c, -bw * 0.38 + i * bw * 0.095, bh * 0.4 + (i % 2) * 2, bw * 0.05, bw * 0.035);
    c.fillStyle = ['#e8d6bf', '#c9b499', '#f1b7a8'][i % 3];
    c.fill();
  }
  // octopus
  const bob = Math.sin(t * 2) * s * 0.02;
  c.translate(0, bob + bh * 0.05);
  const col = '#ee8a8a';
  for (let i = 0; i < 6; i++) {
    const a = -0.9 + i * 0.36;
    const wave =
      mood === 'wave' && i === 5 ? Math.sin(t * 8) * 0.6 - 0.8 : Math.sin(t * 2 + i) * 0.2;
    c.strokeStyle = col;
    c.lineWidth = s * 0.07;
    c.lineCap = 'round';
    c.beginPath();
    const x0 = Math.sin(a) * s * 0.14;
    c.moveTo(x0, s * 0.05);
    c.quadraticCurveTo(
      x0 + Math.sin(a) * s * 0.18,
      s * 0.22,
      x0 + Math.sin(a + wave) * s * 0.28,
      s * 0.25 - (wave < -0.5 ? s * 0.35 : 0)
    );
    c.stroke();
  }
  ellipse(c, 0, -s * 0.06, s * 0.2, s * 0.19);
  c.fillStyle = rad(c, -s * 0.06, -s * 0.12, 0, s * 0.25, [
    [0, '#f8b7b0'],
    [1, '#e27474'],
  ]);
  c.fill();
  for (const sx of [-1, 1]) {
    ellipse(c, sx * s * 0.07, -s * 0.04, s * 0.035, s * 0.045);
    c.fillStyle = '#5a2e2a';
    c.fill();
    ellipse(c, sx * s * 0.07 - s * 0.01, -s * 0.055, s * 0.012, s * 0.014);
    c.fillStyle = '#fff';
    c.fill();
  }
  if (mood === 'happy') {
    c.strokeStyle = '#5a2e2a';
    c.lineWidth = s * 0.015;
    c.beginPath();
    c.arc(0, s * 0.0, s * 0.04, 0.3, Math.PI - 0.3);
    c.stroke();
  }
  // bubbles
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.4 + i * 0.33) % 1;
    c.beginPath();
    c.arc(s * 0.12 + Math.sin(p * 6 + i) * 3, -s * 0.15 - p * bh * 0.35, s * 0.02, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(255,255,255,0.8)';
    c.lineWidth = 1;
    c.stroke();
  }
  c.restore();
  // glass rim and gloss
  ellipse(c, 0, 0, bw * 0.5, bh * 0.5);
  c.strokeStyle = 'rgba(255,255,255,0.65)';
  c.lineWidth = 1.5;
  c.stroke();
  ellipse(c, 0, -bh * 0.42, bw * 0.3, bh * 0.07);
  c.strokeStyle = 'rgba(255,255,255,0.8)';
  c.lineWidth = 2;
  c.stroke();
  sheen(c, -bw * 0.28, -bh * 0.18, bw * 0.08, bh * 0.22, 0.6, 0.3);
}

// ---------- courier on a scooter ----------

export function drawCourier(c: Ctx, s: number, t: number) {
  const L: Look = {
    skin: '#e8b48a',
    hair: 0,
    hairCol: '#2e221b',
    outfit: 0,
    top: '#ef8f7a',
    top2: '#fff6e9',
    bottom: '#3e4a5e',
    acc: 'cap',
    kid: false,
    female: false,
    blush: true,
    freckles: false,
  };
  // scooter
  c.save();
  c.fillStyle = '#5b6b8f';
  rr(c, -s * 0.9, -s * 0.55, s * 1.7, s * 0.3, s * 0.12);
  c.fill();
  for (const x of [-s * 0.65, s * 0.6]) {
    c.beginPath();
    c.arc(x, -s * 0.18, s * 0.2, 0, Math.PI * 2);
    c.fillStyle = '#3a3330';
    c.fill();
    c.beginPath();
    c.arc(x, -s * 0.18, s * 0.08, 0, Math.PI * 2);
    c.fillStyle = '#c9c1b5';
    c.fill();
  }
  rr(c, s * 0.55, -s * 1.15, s * 0.1, s * 0.65, 3);
  c.fillStyle = '#4a587a';
  c.fill();
  // delivery box
  rr(c, -s * 1.1, -s * 1.15, s * 0.6, s * 0.55, 6);
  c.fillStyle = '#ef8f7a';
  c.fill();
  c.fillStyle = '#fff6e9';
  c.font = `700 ${s * 0.18}px Fredoka, sans-serif`;
  c.textAlign = 'center';
  c.fillText('波', -s * 0.8, -s * 0.8);
  c.translate(-s * 0.05, -s * 0.5);
  drawSeated(c, L, s * 0.32, { mood: 'happy', talk: 0, t }, s * 0.1);
  c.restore();
}

export { ellipse as _e };
