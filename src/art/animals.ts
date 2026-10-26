// The animal folk of Snowy Harbor: penguins, seals, otters, bears, foxes, hares, puffins,
// red pandas, tanuki, reindeer, an owl, a walrus and a gull. Drawn in code, with winter
// clothes, five moods, a talking mouth or beak, and paws resting on the window sill.

import type { Species, Speaker } from '../game/data';
import type { Mood } from '../game/session';
import { type Ctx, darken, ellipse, lighten, lin, rad, rgba, rr, sheen, srand } from './common';

export type Hat =
  'none' | 'beanie' | 'earmuff' | 'cap' | 'beret' | 'captain' | 'bandana' | 'flower';

export interface AnimalLook {
  species: Species;
  fur: string;
  fur2: string;
  outfit: number;
  top: string;
  top2: string;
  hat: Hat;
  hatCol: string;
  scarf: boolean;
  glasses: boolean;
  monocle?: boolean;
  kid: boolean;
}

interface SpeciesInfo {
  fur: string[];
  fur2: string;
  ears: 'none' | 'round' | 'pointy' | 'long' | 'small' | 'deer';
  bird?: boolean;
  /** head proportions */
  w: number;
  h: number;
}

const SP: Record<Species, SpeciesInfo> = {
  penguin: { fur: ['#2f3644', '#3a3f52'], fur2: '#fbf8f2', ears: 'none', bird: true, w: 1, h: 1 },
  puffin: { fur: ['#2b2d36'], fur2: '#f6f3ee', ears: 'none', bird: true, w: 1, h: 1 },
  owl: { fur: ['#f5f2ec'], fur2: '#ffffff', ears: 'none', bird: true, w: 1.05, h: 1 },
  gull: { fur: ['#fbfbf8'], fur2: '#c9ced6', ears: 'none', bird: true, w: 0.98, h: 1 },
  seal: { fur: ['#a7b1bd', '#8f9cab', '#c3c9cf'], fur2: '#e7eaee', ears: 'none', w: 1.06, h: 0.96 },
  walrus: { fur: ['#b98a72'], fur2: '#d9b39b', ears: 'none', w: 1.1, h: 0.95 },
  otter: {
    fur: ['#8b5e3c', '#9a6a45', '#7a5034'],
    fur2: '#e1c4a2',
    ears: 'small',
    w: 1.04,
    h: 0.96,
  },
  bear: { fur: ['#f6f2ea', '#efe9dd'], fur2: '#fffdf8', ears: 'round', w: 1.08, h: 0.98 },
  arcticfox: { fur: ['#f7f4ef', '#e9e3da'], fur2: '#ffffff', ears: 'pointy', w: 1.02, h: 0.95 },
  fox: { fur: ['#e2763a'], fur2: '#fff6ec', ears: 'pointy', w: 1.02, h: 0.95 },
  hare: { fur: ['#f8f6f2', '#efe7dd', '#d9c9b6'], fur2: '#ffffff', ears: 'long', w: 1, h: 0.98 },
  redpanda: { fur: ['#c8642c', '#b5582a'], fur2: '#fff7ee', ears: 'pointy', w: 1.06, h: 0.95 },
  tanuki: { fur: ['#9b8a76', '#8a7864'], fur2: '#efe6d8', ears: 'round', w: 1.06, h: 0.96 },
  reindeer: { fur: ['#9a6b47', '#8a5e3e'], fur2: '#e9d6bf', ears: 'deer', w: 0.98, h: 1 },
};

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
  '#c95d5d',
];

export function lookFor(species: Species, seed: number, kid: boolean): AnimalLook {
  const r = srand(seed);
  const pick = <T>(a: T[]) => a[Math.floor(r() * a.length)];
  const info = SP[species];
  const hats: Hat[] =
    info.ears === 'long' || info.ears === 'deer' || info.ears === 'pointy'
      ? ['none', 'none', 'flower', 'earmuff']
      : ['none', 'beanie', 'beanie', 'earmuff', 'cap', 'beret', 'flower'];
  return {
    species,
    fur: pick(info.fur),
    fur2: info.fur2,
    outfit: Math.floor(r() * 6),
    top: pick(TOPS),
    top2: pick(TOPS),
    hat: pick(hats),
    hatCol: pick(TOPS),
    scarf: r() < 0.55,
    glasses: !kid && r() < 0.15,
    kid,
  };
}

export const CHAR_LOOKS: Record<Speaker, AnimalLook> = {
  tusk: {
    species: 'walrus',
    fur: '#b98a72',
    fur2: '#d9b39b',
    outfit: 6,
    top: '#56638c',
    top2: '#f4efe3',
    hat: 'beanie',
    hatCol: '#c95d5d',
    scarf: false,
    glasses: true,
    kid: false,
  },
  pip: {
    species: 'penguin',
    fur: '#2f3644',
    fur2: '#fbf8f2',
    outfit: 7,
    top: '#f4efe3',
    top2: '#ef8f7a',
    hat: 'bandana',
    hatCol: '#ef8f7a',
    scarf: false,
    glasses: false,
    kid: true,
  },
  hazel: {
    species: 'fox',
    fur: '#e2763a',
    fur2: '#fff6ec',
    outfit: 1,
    top: '#9fc39a',
    top2: '#f0c46c',
    hat: 'beret',
    hatCol: '#5d6f99',
    scarf: true,
    glasses: false,
    kid: false,
  },
  squawk: {
    species: 'gull',
    fur: '#fbfbf8',
    fur2: '#c9ced6',
    outfit: 8,
    top: '#2f3a4e',
    top2: '#e9b45c',
    hat: 'captain',
    hatCol: '#2f3a4e',
    scarf: false,
    glasses: false,
    kid: false,
  },
  bulut: {
    species: 'bear',
    fur: '#f6f2ea',
    fur2: '#fffdf8',
    outfit: 4,
    top: '#f0c46c',
    top2: '#3e4a5e',
    hat: 'cap',
    hatCol: '#d9573f',
    scarf: true,
    glasses: false,
    kid: false,
  },
  hoot: {
    species: 'owl',
    fur: '#f5f2ec',
    fur2: '#ffffff',
    outfit: 8,
    top: '#6b4a6e',
    top2: '#e9b45c',
    hat: 'none',
    hatCol: '#000',
    scarf: false,
    glasses: false,
    monocle: true,
    kid: false,
  },
};

const ink = (L: AnimalLook) =>
  darken(L.fur === '#2f3644' || L.fur === '#2b2d36' ? '#4a3a40' : L.fur, 0.5);

// ---------- ears & antlers (behind the head) ----------

function ears(c: Ctx, L: AnimalLook, R: number, t: number) {
  const info = SP[L.species];
  const col = L.fur;
  const inner =
    L.species === 'hare'
      ? '#f4b9c0'
      : L.species === 'fox' || L.species === 'redpanda'
        ? '#fff3e6'
        : lighten(col, 0.35);
  const wig = Math.sin(t * 1.3) * 0.04;
  for (const s of [-1, 1]) {
    c.save();
    switch (info.ears) {
      case 'round':
      case 'small': {
        const k = info.ears === 'small' ? 0.28 : 0.36;
        const x = s * R * 0.72;
        const y = -R * 0.7;
        ellipse(c, x, y, R * k, R * k);
        c.fillStyle = col;
        c.fill();
        ellipse(c, x, y + R * 0.03, R * k * 0.55, R * k * 0.55);
        c.fillStyle = L.species === 'tanuki' ? '#4a3a30' : inner;
        c.fill();
        break;
      }
      case 'pointy': {
        c.translate(s * R * 0.6, -R * 0.62);
        c.rotate(s * (0.3 + wig));
        c.beginPath();
        c.moveTo(-R * 0.3, R * 0.15);
        c.quadraticCurveTo(-R * 0.12, -R * 0.55, 0, -R * 0.7);
        c.quadraticCurveTo(R * 0.12, -R * 0.55, R * 0.3, R * 0.15);
        c.closePath();
        c.fillStyle = col;
        c.fill();
        c.beginPath();
        c.moveTo(-R * 0.17, R * 0.08);
        c.quadraticCurveTo(-R * 0.06, -R * 0.4, 0, -R * 0.5);
        c.quadraticCurveTo(R * 0.06, -R * 0.4, R * 0.17, R * 0.08);
        c.closePath();
        c.fillStyle = inner;
        c.fill();
        if (L.species === 'fox') {
          // dark ear tips
          c.beginPath();
          c.moveTo(-R * 0.12, -R * 0.42);
          c.quadraticCurveTo(0, -R * 0.75, R * 0.12, -R * 0.42);
          c.quadraticCurveTo(0, -R * 0.5, -R * 0.12, -R * 0.42);
          c.fillStyle = '#4a3026';
          c.fill();
        }
        break;
      }
      case 'long': {
        c.translate(s * R * 0.35, -R * 0.75);
        c.rotate(s * (0.18 + wig * 1.5));
        ellipse(c, 0, -R * 0.62, R * 0.24, R * 0.75);
        c.fillStyle = col;
        c.fill();
        ellipse(c, 0, -R * 0.58, R * 0.12, R * 0.58);
        c.fillStyle = inner;
        c.fill();
        break;
      }
      case 'deer': {
        // antlers
        c.strokeStyle = '#c9a77a';
        c.lineCap = 'round';
        c.lineWidth = R * 0.11;
        c.beginPath();
        c.moveTo(s * R * 0.35, -R * 0.75);
        c.quadraticCurveTo(s * R * 0.55, -R * 1.25, s * R * 0.4, -R * 1.65);
        c.moveTo(s * R * 0.47, -R * 1.15);
        c.lineTo(s * R * 0.85, -R * 1.35);
        c.moveTo(s * R * 0.45, -R * 1.4);
        c.lineTo(s * R * 0.2, -R * 1.62);
        c.stroke();
        // side ears
        c.translate(s * R * 0.95, -R * 0.35);
        c.rotate(s * 1.1);
        ellipse(c, 0, 0, R * 0.32, R * 0.15);
        c.fillStyle = col;
        c.fill();
        ellipse(c, 0, 0, R * 0.2, R * 0.08);
        c.fillStyle = inner;
        c.fill();
        break;
      }
    }
    c.restore();
  }
}

// ---------- eyes ----------

function eye(
  c: Ctx,
  x: number,
  y: number,
  s: number,
  mood: Mood,
  blink: boolean,
  side: number,
  col: string,
  iris?: string
) {
  c.lineCap = 'round';
  if (mood === 'love') {
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
    c.strokeStyle = col;
    c.lineWidth = s * 0.42;
    c.beginPath();
    if (blink) {
      c.moveTo(x - s * 0.8, y);
      c.lineTo(x + s * 0.8, y);
    } else c.arc(x, y + s * 0.45, s * 0.85, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
    return;
  }
  if (iris) {
    ellipse(c, x, y, s * 1.15, s * 1.15);
    c.fillStyle = iris;
    c.fill();
    ellipse(c, x, y, s * 0.6, s * 0.65);
    c.fillStyle = '#231a16';
    c.fill();
  } else {
    ellipse(c, x, y, s * 0.82, s);
    c.fillStyle = rad(c, x, y + s * 0.3, 0, s * 1.1, [
      [0, '#5a3a2c'],
      [1, '#1f1612'],
    ]);
    c.fill();
  }
  ellipse(c, x - s * 0.28, y - s * 0.35, s * 0.3, s * 0.32);
  c.fillStyle = '#fff';
  c.fill();
  ellipse(c, x + s * 0.3, y + s * 0.35, s * 0.13, s * 0.13);
  c.fill();
  // brows
  c.strokeStyle = col;
  c.lineWidth = s * 0.32;
  const by = y - s * 1.75;
  c.beginPath();
  if (mood === 'angry') {
    c.moveTo(x - side * s * 1.1, by - s * 0.35);
    c.lineTo(x + side * s * 0.8, by + s * 0.35);
  } else if (mood === 'worried') {
    c.moveTo(x - side * s * 1.0, by + s * 0.3);
    c.lineTo(x + side * s * 0.8, by - s * 0.3);
  } else {
    c.moveTo(x - s * 0.8, by);
    c.quadraticCurveTo(x, by - s * 0.35, x + s * 0.8, by);
  }
  c.stroke();
}

// ---------- head ----------

export function drawHead(c: Ctx, L: AnimalLook, R: number, mood: Mood, talk: number, t: number) {
  const info = SP[L.species];
  const sp = L.species;
  const k = L.kid ? 1.1 : 1;
  const hw = R * info.w;
  const hh = R * info.h;
  const outline = rgba(ink(L), 0.35);
  ears(c, L, R, t);
  if (sp === 'owl' || sp === 'gull' || sp === 'penguin' || sp === 'puffin') {
    // birds: a soft round head that blends into the body
  }
  // head shape
  const headPath = () => {
    c.beginPath();
    if (sp === 'arcticfox' || sp === 'fox' || sp === 'redpanda') {
      c.moveTo(-hw, -hh * 0.15);
      c.bezierCurveTo(-hw * 1.02, -hh * 1.15, hw * 1.02, -hh * 1.15, hw, -hh * 0.15);
      c.bezierCurveTo(hw * 1.05, hh * 0.45, hw * 0.55, hh * 0.85, 0, hh * 0.95);
      c.bezierCurveTo(-hw * 0.55, hh * 0.85, -hw * 1.05, hh * 0.45, -hw, -hh * 0.15);
    } else {
      c.ellipse(0, 0, hw, hh, 0, 0, Math.PI * 2);
    }
    c.closePath();
  };
  headPath();
  c.fillStyle = rad(c, -hw * 0.3, -hh * 0.4, hw * 0.1, hw * 1.5, [
    [0, lighten(L.fur, 0.14)],
    [0.7, L.fur],
    [1, darken(L.fur, 0.1)],
  ]);
  c.fill();
  c.strokeStyle = outline;
  c.lineWidth = R * 0.03;
  c.stroke();

  // face patterns
  c.save();
  headPath();
  c.clip();
  switch (sp) {
    case 'penguin':
      // white heart-shaped face
      c.beginPath();
      c.moveTo(0, -hh * 0.2);
      c.bezierCurveTo(-hw * 0.2, -hh * 0.65, -hw * 0.95, -hh * 0.55, -hw * 0.8, hh * 0.15);
      c.bezierCurveTo(-hw * 0.7, hh * 0.7, -hw * 0.3, hh * 1.05, 0, hh * 1.05);
      c.bezierCurveTo(hw * 0.3, hh * 1.05, hw * 0.7, hh * 0.7, hw * 0.8, hh * 0.15);
      c.bezierCurveTo(hw * 0.95, -hh * 0.55, hw * 0.2, -hh * 0.65, 0, -hh * 0.2);
      c.fillStyle = L.fur2;
      c.fill();
      break;
    case 'puffin':
      ellipse(c, 0, hh * 0.18, hw * 0.88, hh * 0.72);
      c.fillStyle = L.fur2;
      c.fill();
      break;
    case 'owl':
      for (let i = 0; i < 26; i++) {
        const r = srand(i + 5);
        const a = r() * Math.PI * 2;
        const d = 0.6 + r() * 0.4;
        c.beginPath();
        c.moveTo(Math.cos(a) * hw * d - 2, Math.sin(a) * hh * d);
        c.lineTo(Math.cos(a) * hw * d + 2, Math.sin(a) * hh * d - 1);
        c.strokeStyle = 'rgba(80,80,90,0.55)';
        c.lineWidth = R * 0.04;
        c.stroke();
      }
      for (const s of [-1, 1]) {
        ellipse(c, s * hw * 0.38, hh * 0.02, hw * 0.42, hh * 0.45);
        c.fillStyle = '#ffffff';
        c.fill();
      }
      break;
    case 'gull':
      // grey crown feathers on top and a little brow
      ellipse(c, 0, -hh * 1.0, hw * 0.9, hh * 0.32);
      c.fillStyle = '#e6e9ee';
      c.fill();
      break;
    case 'seal': {
      const r = srand(L.top.length * 7);
      for (let i = 0; i < 7; i++) {
        ellipse(c, (r() - 0.5) * hw * 1.6, -hh * 0.2 - r() * hh * 0.6, R * 0.05, R * 0.035, r());
        c.fillStyle = rgba(darken(L.fur, 0.25), 0.5);
        c.fill();
      }
      break;
    }
    case 'redpanda':
      // white eyebrows, cheeks and muzzle; dark tear marks
      for (const s of [-1, 1]) {
        ellipse(c, s * hw * 0.38, -hh * 0.28, hw * 0.16, hh * 0.08, s * 0.2);
        c.fillStyle = L.fur2;
        c.fill();
        ellipse(c, s * hw * 0.72, hh * 0.25, hw * 0.3, hh * 0.32);
        c.fill();
        c.beginPath();
        c.moveTo(s * hw * 0.38, hh * 0.1);
        c.quadraticCurveTo(s * hw * 0.42, hh * 0.45, s * hw * 0.3, hh * 0.7);
        c.strokeStyle = rgba('#5a2a14', 0.6);
        c.lineWidth = R * 0.09;
        c.stroke();
      }
      ellipse(c, 0, hh * 0.5, hw * 0.34, hh * 0.3);
      c.fillStyle = L.fur2;
      c.fill();
      break;
    case 'tanuki':
      for (const s of [-1, 1]) {
        ellipse(c, s * hw * 0.38, hh * 0.08, hw * 0.33, hh * 0.25, s * -0.35);
        c.fillStyle = '#4a3a30';
        c.fill();
      }
      ellipse(c, 0, hh * 0.52, hw * 0.4, hh * 0.32);
      c.fillStyle = L.fur2;
      c.fill();
      break;
    case 'fox':
    case 'arcticfox':
      c.beginPath();
      c.moveTo(-hw * 1.05, hh * 0.05);
      c.quadraticCurveTo(-hw * 0.4, hh * 0.15, 0, hh * 0.25);
      c.quadraticCurveTo(hw * 0.4, hh * 0.15, hw * 1.05, hh * 0.05);
      c.lineTo(hw, hh * 1.1);
      c.lineTo(-hw, hh * 1.1);
      c.closePath();
      c.fillStyle = L.fur2;
      c.fill();
      break;
    default:
      if (sp !== 'hare' && sp !== 'walrus') {
        ellipse(c, 0, hh * 0.5, hw * 0.42, hh * 0.34);
        c.fillStyle = L.fur2;
        c.fill();
      }
  }
  c.restore();

  // eyes
  const blink = Math.sin(t * 1.7 + L.outfit * 1.3) > 0.985;
  const es = R * (sp === 'owl' ? 0.13 : 0.11) * k;
  const ex = hw * (sp === 'owl' ? 0.38 : 0.36);
  const ey = sp === 'walrus' ? -hh * 0.15 : -hh * 0.02;
  const ecol = sp === 'penguin' || sp === 'puffin' ? '#2a2026' : ink(L);
  const iris = sp === 'owl' ? '#f2c230' : undefined;
  eye(c, -ex, ey, es, mood, blink, -1, ecol, iris);
  eye(c, ex, ey, es, mood, blink, 1, ecol, iris);
  if (sp === 'puffin') {
    for (const s of [-1, 1]) {
      c.strokeStyle = '#d9573f';
      c.lineWidth = R * 0.03;
      ellipse(c, s * ex, ey, es * 1.25, es * 1.35);
      c.stroke();
    }
  }

  // cheeks
  if (mood !== 'angry' && sp !== 'walrus') {
    for (const s of [-1, 1]) {
      ellipse(c, s * hw * 0.62, hh * 0.32, R * 0.16, R * 0.1);
      c.fillStyle = rgba('#f08f8a', mood === 'love' ? 0.6 : 0.35);
      c.fill();
    }
  }
  if (mood === 'angry') {
    headPath();
    c.fillStyle = 'rgba(230,80,60,0.13)';
    c.fill();
  }
  if (mood === 'worried') {
    c.beginPath();
    c.moveTo(hw * 0.92, -hh * 0.55);
    c.quadraticCurveTo(hw * 1.05, -hh * 0.3, hw * 0.92, -hh * 0.22);
    c.quadraticCurveTo(hw * 0.79, -hh * 0.3, hw * 0.92, -hh * 0.55);
    c.fillStyle = 'rgba(140,190,230,0.85)';
    c.fill();
  }

  // muzzle, nose, mouth / beak
  const open = talk > 0.05 ? talk : 0;
  if (sp === 'penguin' || sp === 'gull' || sp === 'owl') {
    const bw = R * (sp === 'gull' ? 0.26 : sp === 'owl' ? 0.12 : 0.2);
    const bl = R * (sp === 'gull' ? 0.42 : sp === 'owl' ? 0.2 : 0.28);
    const by = hh * (sp === 'owl' ? 0.25 : 0.28);
    const col = sp === 'gull' ? '#f2c230' : sp === 'owl' ? '#3a3236' : '#f0a23a';
    // lower beak
    c.beginPath();
    c.moveTo(-bw * 0.8, by + open * bl * 0.3);
    c.quadraticCurveTo(0, by + bl * 0.75 + open * bl * 0.5, bw * 0.8, by + open * bl * 0.3);
    c.closePath();
    c.fillStyle = darken(col, 0.12);
    c.fill();
    if (open) {
      ellipse(c, 0, by + open * bl * 0.25, bw * 0.55, open * bl * 0.25);
      c.fillStyle = '#9c3f3a';
      c.fill();
    }
    // upper beak
    c.beginPath();
    c.moveTo(-bw, by - bl * 0.15);
    c.quadraticCurveTo(0, by - bl * 0.35, bw, by - bl * 0.15);
    c.quadraticCurveTo(bw * 0.4, by + bl * 0.55, 0, by + bl * (sp === 'gull' ? 0.7 : 0.55));
    c.quadraticCurveTo(-bw * 0.4, by + bl * 0.55, -bw, by - bl * 0.15);
    c.fillStyle = lin(c, 0, by - bl * 0.3, 0, by + bl * 0.6, [
      [0, lighten(col, 0.25)],
      [1, col],
    ]);
    c.fill();
    if (sp === 'gull') {
      ellipse(c, bw * 0.15, by + bl * 0.45, bw * 0.16, bw * 0.12);
      c.fillStyle = '#d9473f';
      c.fill();
    }
    sheen(c, -bw * 0.3, by - bl * 0.05, bw * 0.3, bl * 0.08, 0.6);
  } else if (sp === 'puffin') {
    const by = hh * 0.25;
    const bw = R * 0.3;
    const bl = R * 0.5;
    c.beginPath();
    c.moveTo(-bw * 0.85, by + open * bl * 0.25);
    c.quadraticCurveTo(0, by + bl * 0.8 + open * bl * 0.4, bw * 0.85, by + open * bl * 0.25);
    c.closePath();
    c.fillStyle = '#e8763a';
    c.fill();
    if (open) {
      ellipse(c, 0, by + open * bl * 0.22, bw * 0.55, open * bl * 0.22);
      c.fillStyle = '#9c3f3a';
      c.fill();
    }
    c.beginPath();
    c.moveTo(-bw, by - bl * 0.3);
    c.quadraticCurveTo(0, by - bl * 0.5, bw, by - bl * 0.3);
    c.quadraticCurveTo(bw * 0.5, by + bl * 0.5, 0, by + bl * 0.62);
    c.quadraticCurveTo(-bw * 0.5, by + bl * 0.5, -bw, by - bl * 0.3);
    c.save();
    c.clip();
    c.fillStyle = '#5d6f8a';
    c.fillRect(-bw, by - bl * 0.6, bw * 2, bl * 0.35);
    c.fillStyle = '#f2c230';
    c.fillRect(-bw, by - bl * 0.25, bw * 2, bl * 0.12);
    c.fillStyle = '#ec6b33';
    c.fillRect(-bw, by - bl * 0.13, bw * 2, bl);
    c.restore();
    sheen(c, -bw * 0.3, by, bw * 0.3, bl * 0.08, 0.6);
  } else {
    const walrus = sp === 'walrus';
    const seal = sp === 'seal';
    const pad = walrus || seal || sp === 'otter';
    const ny = hh * (walrus ? 0.18 : sp === 'hare' ? 0.25 : 0.3);
    if (pad) {
      for (const s of [-1, 1]) {
        ellipse(
          c,
          s * R * (walrus ? 0.26 : 0.17),
          ny + R * 0.18,
          R * (walrus ? 0.32 : 0.2),
          R * (walrus ? 0.24 : 0.15)
        );
        c.fillStyle = walrus ? '#e7c4ac' : lighten(L.fur2, 0.1);
        c.fill();
        for (let i = 0; i < 6; i++) {
          c.beginPath();
          c.arc(
            s * R * (walrus ? 0.18 + (i % 3) * 0.08 : 0.1 + (i % 3) * 0.06),
            ny + R * (0.12 + Math.floor(i / 3) * 0.08),
            R * 0.018,
            0,
            Math.PI * 2
          );
          c.fillStyle = rgba('#5a3a2c', 0.5);
          c.fill();
        }
      }
      // whiskers
      c.strokeStyle = rgba(walrus ? '#8a6a52' : '#fffaf2', 0.85);
      c.lineWidth = R * 0.018;
      for (const s of [-1, 1])
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.moveTo(s * R * 0.3, ny + R * 0.15 + i * R * 0.06);
          c.quadraticCurveTo(
            s * R * 0.6,
            ny + R * 0.1 + i * R * 0.09,
            s * R * 0.85,
            ny + R * 0.05 + i * R * 0.14
          );
          c.stroke();
        }
    }
    if (walrus) {
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * R * 0.16, ny + R * 0.32);
        c.quadraticCurveTo(s * R * 0.22, ny + R * 0.75, s * R * 0.12, ny + R * 0.95);
        c.quadraticCurveTo(s * R * 0.06, ny + R * 0.7, s * R * 0.06, ny + R * 0.34);
        c.fillStyle = '#fffaf0';
        c.fill();
        c.strokeStyle = rgba('#b9a58a', 0.8);
        c.lineWidth = R * 0.02;
        c.stroke();
      }
    }
    // nose
    const nose =
      sp === 'hare'
        ? '#f19aa6'
        : sp === 'bear' || sp === 'arcticfox' || sp === 'fox'
          ? '#2a2026'
          : darken(L.fur, 0.55);
    c.beginPath();
    const nw = R * (sp === 'bear' ? 0.15 : sp === 'hare' ? 0.08 : 0.12);
    c.moveTo(-nw, ny - nw * 0.4);
    c.quadraticCurveTo(0, ny - nw * 0.8, nw, ny - nw * 0.4);
    c.quadraticCurveTo(nw * 0.6, ny + nw * 0.6, 0, ny + nw * 0.7);
    c.quadraticCurveTo(-nw * 0.6, ny + nw * 0.6, -nw, ny - nw * 0.4);
    c.fillStyle = nose;
    c.fill();
    sheen(c, -nw * 0.3, ny - nw * 0.3, nw * 0.4, nw * 0.2, 0.7);
    // mouth
    const my = ny + R * (walrus ? 0.4 : 0.2);
    const mc = darken(L.fur, 0.55);
    c.strokeStyle = sp === 'bear' || sp === 'arcticfox' || sp === 'hare' ? '#7a5a52' : mc;
    c.lineWidth = R * 0.045;
    c.lineCap = 'round';
    if (open) {
      ellipse(c, 0, my + R * 0.04, R * 0.12, R * (0.05 + open * 0.1));
      c.fillStyle = '#9c3f3a';
      c.fill();
      ellipse(c, 0, my + R * 0.08 + open * R * 0.04, R * 0.07, R * 0.035 * open);
      c.fillStyle = '#e07a74';
      c.fill();
    } else if (mood === 'happy' || mood === 'love') {
      c.beginPath();
      c.moveTo(-R * 0.18, my - R * 0.02);
      c.quadraticCurveTo(0, my + R * 0.28, R * 0.18, my - R * 0.02);
      c.closePath();
      c.fillStyle = '#9c3f3a';
      c.fill();
    } else if (mood === 'angry') {
      c.beginPath();
      c.arc(0, my + R * 0.14, R * 0.14, Math.PI * 1.2, Math.PI * 1.8);
      c.stroke();
    } else {
      // little "w"
      c.beginPath();
      c.moveTo(-R * 0.14, my - R * 0.02);
      c.quadraticCurveTo(-R * 0.07, my + R * 0.07, 0, my - R * 0.01);
      c.quadraticCurveTo(R * 0.07, my + R * 0.07, R * 0.14, my - R * 0.02);
      c.stroke();
    }
    if (sp === 'hare') {
      rr(c, -R * 0.06, my + R * 0.02, R * 0.12, R * 0.1, R * 0.02);
      c.fillStyle = '#fffaf2';
      c.fill();
    }
  }

  // hats & glasses
  if (L.glasses) {
    c.strokeStyle = '#6e4b32';
    c.lineWidth = R * 0.05;
    for (const s of [-1, 1]) {
      ellipse(c, s * ex, ey, R * 0.2, R * 0.18);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(-ex + R * 0.2, ey);
    c.lineTo(ex - R * 0.2, ey);
    c.stroke();
  }
  if (L.monocle) {
    c.strokeStyle = '#c9a050';
    c.lineWidth = R * 0.05;
    ellipse(c, ex, ey, R * 0.22, R * 0.22);
    c.stroke();
    c.beginPath();
    c.moveTo(ex + R * 0.15, ey + R * 0.18);
    c.quadraticCurveTo(ex + R * 0.4, ey + R * 0.6, ex + R * 0.2, hh * 1.1);
    c.lineWidth = R * 0.02;
    c.stroke();
  }
  drawHat(c, L, R, hw, hh);
}

function drawHat(c: Ctx, L: AnimalLook, R: number, hw: number, hh: number) {
  const col = L.hatCol;
  switch (L.hat) {
    case 'beanie': {
      c.beginPath();
      c.moveTo(-hw * 0.98, -hh * 0.45);
      c.bezierCurveTo(-hw * 1.0, -hh * 1.5, hw * 1.0, -hh * 1.5, hw * 0.98, -hh * 0.45);
      c.closePath();
      c.fillStyle = lin(c, 0, -hh * 1.4, 0, -hh * 0.4, [
        [0, lighten(col, 0.15)],
        [1, darken(col, 0.08)],
      ]);
      c.fill();
      c.strokeStyle = rgba(darken(col, 0.3), 0.35);
      c.lineWidth = R * 0.035;
      for (let i = -4; i <= 4; i++) {
        c.beginPath();
        c.moveTo(i * hw * 0.2, -hh * 0.55);
        c.quadraticCurveTo(i * hw * 0.17, -hh * 1.0, i * hw * 0.1, -hh * 1.25);
        c.stroke();
      }
      rr(c, -hw * 1.02, -hh * 0.62, hw * 2.04, hh * 0.28, hh * 0.12);
      c.fillStyle = darken(col, 0.1);
      c.fill();
      c.beginPath();
      c.arc(0, -hh * 1.38, R * 0.2, 0, Math.PI * 2);
      c.fillStyle = rad(c, -R * 0.05, -hh * 1.43, 0, R * 0.25, [
        [0, '#fffaf2'],
        [1, lighten(col, 0.5)],
      ]);
      c.fill();
      break;
    }
    case 'earmuff':
      c.strokeStyle = darken(col, 0.2);
      c.lineWidth = R * 0.1;
      c.beginPath();
      c.arc(0, -hh * 0.05, hw * 1.0, Math.PI * 1.12, Math.PI * 1.88);
      c.stroke();
      for (const s of [-1, 1]) {
        ellipse(c, s * hw * 0.98, hh * 0.02, R * 0.24, R * 0.28);
        c.fillStyle = rad(c, s * hw * 0.95, -hh * 0.05, 0, R * 0.3, [
          [0, lighten(col, 0.4)],
          [1, col],
        ]);
        c.fill();
      }
      break;
    case 'cap':
      c.beginPath();
      c.moveTo(-hw * 0.95, -hh * 0.5);
      c.bezierCurveTo(-hw * 0.95, -hh * 1.4, hw * 0.95, -hh * 1.4, hw * 0.95, -hh * 0.5);
      c.closePath();
      c.fillStyle = col;
      c.fill();
      ellipse(c, hw * 0.35, -hh * 0.52, hw * 0.75, hh * 0.15, -0.08);
      c.fillStyle = darken(col, 0.18);
      c.fill();
      break;
    case 'beret':
      ellipse(c, -hw * 0.15, -hh * 0.92, hw * 0.95, hh * 0.32, -0.18);
      c.fillStyle = lin(c, 0, -hh * 1.2, 0, -hh * 0.6, [
        [0, lighten(col, 0.15)],
        [1, col],
      ]);
      c.fill();
      c.beginPath();
      c.arc(-hw * 0.1, -hh * 1.24, R * 0.07, 0, Math.PI * 2);
      c.fill();
      break;
    case 'captain':
      rr(c, -hw * 0.9, -hh * 1.32, hw * 1.8, hh * 0.55, hh * 0.22);
      c.fillStyle = '#f4efe3';
      c.fill();
      rr(c, -hw * 0.95, -hh * 0.85, hw * 1.9, hh * 0.22, hh * 0.1);
      c.fillStyle = col;
      c.fill();
      ellipse(c, 0, -hh * 0.62, hw * 0.88, hh * 0.13);
      c.fillStyle = '#1f2838';
      c.fill();
      c.beginPath();
      c.arc(0, -hh * 1.02, R * 0.13, 0, Math.PI * 2);
      c.fillStyle = '#e9b45c';
      c.fill();
      break;
    case 'bandana':
      c.beginPath();
      c.moveTo(-hw * 1.0, -hh * 0.35);
      c.bezierCurveTo(-hw * 0.9, -hh * 1.2, hw * 0.9, -hh * 1.2, hw * 1.0, -hh * 0.35);
      c.quadraticCurveTo(0, -hh * 0.55, -hw * 1.0, -hh * 0.35);
      c.fillStyle = col;
      c.fill();
      for (let i = 0; i < 7; i++) {
        c.beginPath();
        c.arc(-hw * 0.6 + i * hw * 0.2, -hh * 0.75 + (i % 2) * hh * 0.12, R * 0.04, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.fill();
      }
      ellipse(c, hw * 0.95, -hh * 0.45, R * 0.14, R * 0.1, 0.5);
      c.fillStyle = darken(col, 0.1);
      c.fill();
      break;
    case 'flower':
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ellipse(
          c,
          hw * 0.55 + Math.cos(a) * R * 0.13,
          -hh * 0.7 + Math.sin(a) * R * 0.13,
          R * 0.11,
          R * 0.11
        );
        c.fillStyle = lighten(col, 0.25);
        c.fill();
      }
      ellipse(c, hw * 0.55, -hh * 0.7, R * 0.07, R * 0.07);
      c.fillStyle = '#f2c230';
      c.fill();
      break;
  }
}

// ---------- body ----------

/** torso from the sill (y = 0) up to the neck */
function torso(c: Ctx, L: AnimalLook, R: number, breathe: number) {
  const info = SP[L.species];
  const sh = L.kid ? 1.15 : L.species === 'bear' || L.species === 'walrus' ? 1.65 : 1.4;
  const top = -R * (L.kid ? 1.5 : 1.85) + breathe;
  const body = () => {
    c.beginPath();
    c.moveTo(-R * sh, 0);
    c.bezierCurveTo(-R * sh * 1.05, top * 0.45, -R * sh * 0.95, top * 0.95, -R * sh * 0.55, top);
    c.quadraticCurveTo(0, top - R * 0.25, R * sh * 0.55, top);
    c.bezierCurveTo(R * sh * 0.95, top * 0.95, R * sh * 1.05, top * 0.45, R * sh, 0);
    c.closePath();
  };
  // birds and seals: the body is their own feathers/fur
  const natural = info.bird && L.outfit !== 7 && L.outfit !== 8;
  const base = natural ? L.fur : L.top;
  body();
  c.fillStyle = lin(c, -R * sh, top, R * sh, 0, [
    [0, lighten(base, 0.12)],
    [1, darken(base, 0.12)],
  ]);
  c.fill();
  c.save();
  body();
  c.clip();
  if (natural) {
    // belly
    ellipse(c, 0, top * 0.25, R * sh * 0.62, -top * 0.85);
    c.fillStyle = L.species === 'penguin' || L.species === 'puffin' ? L.fur2 : lighten(L.fur, 0.1);
    c.fill();
    if (L.species === 'owl') {
      for (let i = 0; i < 30; i++) {
        const r = srand(i * 3 + 1);
        c.beginPath();
        const x = (r() - 0.5) * R * sh * 1.6;
        const y = top * r();
        c.moveTo(x - 3, y);
        c.quadraticCurveTo(x, y + 2, x + 3, y);
        c.strokeStyle = 'rgba(80,80,90,0.5)';
        c.lineWidth = R * 0.04;
        c.stroke();
      }
    }
    if (L.species === 'gull') {
      for (const s of [-1, 1]) {
        ellipse(c, s * R * sh * 0.85, top * 0.4, R * 0.5, -top * 0.6);
        c.fillStyle = L.fur2;
        c.fill();
      }
    }
  } else {
    switch (L.outfit) {
      case 0: // cable knit sweater
        c.strokeStyle = rgba(darken(L.top, 0.3), 0.4);
        c.lineWidth = R * 0.07;
        for (let i = -2; i <= 2; i++) {
          c.beginPath();
          for (let y = 0; y > top; y -= R * 0.18) {
            const x = i * R * 0.45 + Math.sin(y / (R * 0.18)) * R * 0.06;
            if (y === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.stroke();
        }
        rr(c, -R * 2, top - 2, R * 4, R * 0.3, 0);
        c.fillStyle = darken(L.top, 0.12);
        c.fill();
        break;
      case 1: // puffer jacket
        for (let i = 1; i < 6; i++) {
          c.strokeStyle = rgba(darken(L.top, 0.35), 0.4);
          c.lineWidth = R * 0.05;
          c.beginPath();
          c.moveTo(-R * 2, (top * i) / 6);
          c.quadraticCurveTo(0, (top * i) / 6 + R * 0.06, R * 2, (top * i) / 6);
          c.stroke();
        }
        sheen(c, -R * 0.6, top * 0.5, R * 0.5, R * 0.18, 0.35);
        c.fillStyle = darken(L.top, 0.25);
        c.fillRect(-R * 0.03, top, R * 0.06, -top);
        break;
      case 2: // hoodie
        rr(c, -R * 0.7, top * 0.42, R * 1.4, R * 0.5, R * 0.2);
        c.fillStyle = darken(L.top, 0.08);
        c.fill();
        c.strokeStyle = lighten(L.top, 0.45);
        c.lineWidth = R * 0.05;
        c.beginPath();
        c.moveTo(-R * 0.22, top + R * 0.15);
        c.lineTo(-R * 0.24, top + R * 0.75);
        c.moveTo(R * 0.22, top + R * 0.15);
        c.lineTo(R * 0.24, top + R * 0.75);
        c.stroke();
        break;
      case 3: // stripes
        for (let i = 0; i < 9; i++) {
          c.fillStyle = rgba(L.top2, 0.9);
          c.fillRect(-R * 2, top + i * R * 0.28, R * 4, R * 0.12);
        }
        break;
      case 4: // fisher raincoat
        c.fillStyle = darken(L.top, 0.15);
        c.fillRect(-R * 0.04, top, R * 0.08, -top);
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.arc(R * 0.2, top * (0.8 - i * 0.28), R * 0.06, 0, Math.PI * 2);
          c.fillStyle = '#3e4a5e';
          c.fill();
        }
        c.beginPath();
        c.moveTo(-R * 0.9, top + R * 0.05);
        c.lineTo(0, top + R * 0.5);
        c.lineTo(R * 0.9, top + R * 0.05);
        c.lineTo(R * 0.7, top - R * 0.1);
        c.lineTo(-R * 0.7, top - R * 0.1);
        c.fillStyle = lighten(L.top, 0.15);
        c.fill();
        break;
      case 5: // overalls
        rr(c, -R * 0.7, top * 0.6, R * 1.4, -top * 0.8, R * 0.18);
        c.fillStyle = L.top2;
        c.fill();
        c.strokeStyle = L.top2;
        c.lineWidth = R * 0.18;
        c.beginPath();
        c.moveTo(-R * 0.55, top * 0.6);
        c.lineTo(-R * 0.65, top);
        c.moveTo(R * 0.55, top * 0.6);
        c.lineTo(R * 0.65, top);
        c.stroke();
        break;
      case 6: // haori jacket
        c.fillStyle = L.top2;
        c.beginPath();
        c.moveTo(-R * 0.5, top);
        c.lineTo(R * 0.3, top * 0.2);
        c.lineTo(R * 0.08, top * 0.12);
        c.lineTo(-R * 0.75, top * 0.9);
        c.fill();
        c.beginPath();
        c.moveTo(R * 0.5, top);
        c.lineTo(-R * 0.08, top * 0.35);
        c.lineTo(R * 0.12, top * 0.3);
        c.lineTo(R * 0.75, top * 0.9);
        c.fill();
        for (let i = 0; i < 12; i++) {
          c.beginPath();
          c.arc(
            -R * 1.2 + (i % 4) * R * 0.25,
            top * (0.2 + Math.floor(i / 4) * 0.25),
            R * 0.05,
            0,
            Math.PI * 2
          );
          c.fillStyle = rgba('#f4efe3', 0.35);
          c.fill();
        }
        break;
      case 7: // chef apron (Pip): penguin body with a white apron
        c.fillStyle = L.fur;
        c.fillRect(-R * 3, top, R * 6, -top);
        ellipse(c, 0, top * 0.3, R * 0.9, -top * 0.75);
        c.fillStyle = L.fur2;
        c.fill();
        rr(c, -R * 0.6, top * 0.55, R * 1.2, -top * 0.6, R * 0.15);
        c.fillStyle = '#ffffff';
        c.fill();
        c.strokeStyle = L.top2;
        c.lineWidth = R * 0.06;
        c.stroke();
        break;
      case 8: // long coat with lapels
        c.fillStyle = darken(L.top, 0.12);
        c.beginPath();
        c.moveTo(-R * 0.7, top);
        c.lineTo(-R * 0.12, top * 0.3);
        c.lineTo(-R * 0.5, top * 0.15);
        c.fill();
        c.beginPath();
        c.moveTo(R * 0.7, top);
        c.lineTo(R * 0.12, top * 0.3);
        c.lineTo(R * 0.5, top * 0.15);
        c.fill();
        c.fillStyle = L.top2;
        c.beginPath();
        c.moveTo(-R * 0.18, top);
        c.lineTo(R * 0.18, top);
        c.lineTo(0, top * 0.45);
        c.fill();
        for (let i = 0; i < 3; i++) {
          c.beginPath();
          c.arc(R * 0.25, top * (0.3 - i * 0.12) + R * 0.1, R * 0.05, 0, Math.PI * 2);
          c.fillStyle = '#e9b45c';
          c.fill();
        }
        break;
    }
  }
  c.restore();
  body();
  c.strokeStyle = rgba(darken(base, 0.45), 0.3);
  c.lineWidth = R * 0.035;
  c.stroke();
  return top;
}

function scarf(c: Ctx, L: AnimalLook, R: number, top: number) {
  const col = L.top2 === L.top ? '#ef8f7a' : L.top2;
  rr(c, -R * 0.85, top - R * 0.22, R * 1.7, R * 0.42, R * 0.2);
  c.fillStyle = lin(c, 0, top - R * 0.22, 0, top + R * 0.2, [
    [0, lighten(col, 0.12)],
    [1, darken(col, 0.1)],
  ]);
  c.fill();
  c.strokeStyle = rgba(darken(col, 0.3), 0.35);
  c.lineWidth = R * 0.03;
  for (let i = -3; i <= 3; i++) {
    c.beginPath();
    c.moveTo(i * R * 0.22, top - R * 0.2);
    c.lineTo(i * R * 0.22 + R * 0.05, top + R * 0.18);
    c.stroke();
  }
  rr(c, R * 0.25, top + R * 0.05, R * 0.32, R * 0.85, R * 0.1);
  c.fillStyle = darken(col, 0.05);
  c.fill();
  for (let i = 0; i < 4; i++) {
    c.fillStyle = darken(col, 0.15);
    c.fillRect(R * 0.27 + i * R * 0.07, top + R * 0.88, R * 0.03, R * 0.12);
  }
}

export interface PoseOpts {
  mood: Mood;
  talk: number;
  t: number;
  eat?: number;
}

/**
 * A customer seen through the window: bust from the sill (y=0) upward.
 * Paws are drawn separately (after the sill) with drawPaws.
 */
export function drawBust(c: Ctx, L: AnimalLook, R: number, o: PoseOpts) {
  const breathe = Math.sin(o.t * 2) * R * 0.03;
  const top = torso(c, L, R, breathe);
  const neck = SP[L.species].bird ? 0.75 : 0.95;
  c.save();
  const tilt =
    o.mood === 'love'
      ? Math.sin(o.t * 3) * 0.06
      : o.mood === 'angry'
        ? -0.04
        : Math.sin(o.t * 0.9) * 0.02;
  const eatBob = o.eat ? Math.sin(o.eat * Math.PI) * R * 0.12 : 0;
  c.translate(0, top - R * neck + breathe + eatBob);
  c.rotate(tilt);
  drawHead(c, L, R, o.mood, o.talk, o.t);
  c.restore();
  if (L.scarf) scarf(c, L, R, top + R * 0.05);
}

/** forearms/flippers resting on the sill; y = sill top */
export function drawPaws(
  c: Ctx,
  L: AnimalLook,
  R: number,
  cx: number,
  y: number,
  t: number,
  eating: boolean
) {
  const info = SP[L.species];
  const sleeve =
    info.bird && L.outfit !== 7 && L.outfit !== 8 ? L.fur : L.outfit === 7 ? L.fur : L.top;
  for (const s of [-1, 1]) {
    const lift = eating && s > 0 ? Math.max(0, Math.sin(t * 8)) * R * 0.3 : 0;
    c.save();
    c.translate(cx + s * R * (L.kid ? 0.85 : 1.05), y - lift);
    if (info.bird) {
      // a flipper / wing tip resting forward
      c.rotate(s * 0.5);
      ellipse(c, 0, R * 0.05, R * 0.22, R * 0.42);
      c.fillStyle = lin(c, 0, -R * 0.3, 0, R * 0.4, [
        [0, lighten(sleeve, 0.08)],
        [1, darken(sleeve, 0.15)],
      ]);
      c.fill();
    } else {
      c.rotate(-s * 0.2);
      rr(c, -R * 0.3, -R * 0.3, R * 0.6, R * 0.48, R * 0.22);
      c.fillStyle = lin(c, 0, -R * 0.3, 0, R * 0.2, [
        [0, lighten(sleeve, 0.08)],
        [1, darken(sleeve, 0.14)],
      ]);
      c.fill();
      ellipse(c, 0, R * 0.2, R * 0.27, R * 0.2);
      c.fillStyle = rad(c, -R * 0.05, R * 0.14, 0, R * 0.3, [
        [0, lighten(L.fur, 0.12)],
        [1, darken(L.fur, 0.08)],
      ]);
      c.fill();
      c.strokeStyle = rgba(darken(L.fur, 0.5), 0.3);
      c.lineWidth = R * 0.025;
      for (let k = -1; k <= 1; k++) {
        c.beginPath();
        c.moveTo(k * R * 0.08, R * 0.28);
        c.lineTo(k * R * 0.08, R * 0.37);
        c.stroke();
      }
      // toe beans for the cuteness
      if (
        L.species === 'bear' ||
        L.species === 'otter' ||
        L.species === 'redpanda' ||
        L.species === 'tanuki'
      ) {
        ellipse(c, 0, R * 0.18, R * 0.07, R * 0.05);
        c.fillStyle = rgba('#3a2a28', 0.35);
        c.fill();
      }
    }
    c.restore();
  }
}

/** a round avatar for the Yumm app and the story screens */
export function drawAvatar(c: Ctx, L: AnimalLook, size: number, mood: Mood = 'happy', bg?: string) {
  c.save();
  c.beginPath();
  c.arc(0, 0, size / 2, 0, Math.PI * 2);
  c.fillStyle = bg ?? lighten(L.top, 0.6);
  c.fill();
  c.clip();
  const R = size * 0.3;
  c.translate(0, size * 0.92);
  drawBust(c, L, R, { mood, talk: 0, t: 0 });
  c.restore();
}

export function lookOf(
  species: Species,
  seed: number,
  kid: boolean,
  special?: Speaker
): AnimalLook {
  if (special) return CHAR_LOOKS[special];
  return lookFor(species, seed, kid);
}
