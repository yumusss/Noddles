// Hand-drawn customer / story-character sprites (Canvas 2D, no external assets).
// Every character is composed from a seed: skin, hair, clothes, accessories,
// face shape and mood are drawn in a 100-unit "upper body" box and cached as a
// sprite per (look, mood, eating, talking, pose, quantised size); per frame the
// game does a single drawImage.
import { PAL, circle, ellipse, rng, roundRect, shade, sprite, type Ctx } from './common';

export type Mood = 'happy' | 'neutral' | 'worried' | 'angry' | 'love';
export type Special = 'hana' | 'baron' | 'lezzetova' | 'ruzgar' | 'sef';
export interface Look {
  seed: number;
  special?: Special;
  kid?: boolean;
}
export type Pose = 'stand' | 'sit' | 'queue';

// ---------- palettes ----------
const SKIN = ['#fbe3d3', '#f4d2bc', '#e9b995', '#cf9a72', '#a9704f', '#7a4d36'];
const HAIR_COL = [
  '#2b2320',
  '#4a2f24',
  '#6e452c',
  '#9b6b3f',
  '#c9955a',
  '#e0bf85',
  '#3a3a44',
  '#8c4a3a',
  '#b86a4a',
  '#5a3e3a',
];
const CLOTH = [
  '#9fc39a',
  '#e3a7a1',
  '#f2d58b',
  '#a9c4dc',
  '#b8a9d6',
  '#d98b6c',
  '#f3ead9',
  '#9a7b62',
  '#7fb3ad',
  '#f4c7b5',
  '#6f8fa8',
  '#e9a3b7',
  '#cfe3ec',
  '#b9c9a7',
  '#d6c4e3',
  '#e8b35a',
];
const EYE_COL = ['#3a2a22', '#5a3b2a', '#6e5a3a', '#4f6a7a', '#3f5a4a'];

type Hair =
  | 'short'
  | 'side'
  | 'curly'
  | 'afro'
  | 'bob'
  | 'long'
  | 'wavy'
  | 'bun'
  | 'pony'
  | 'braids'
  | 'hijab'
  | 'cap'
  | 'messy'
  | 'pigtails';
type Top =
  'tshirt' | 'hoodie' | 'sweater' | 'shirt' | 'dress' | 'apron' | 'kimono' | 'coat' | 'cardigan';

interface F {
  fem: boolean;
  kid: boolean;
  skin: string;
  hair: Hair;
  hairCol: string;
  top: Top;
  topCol: string;
  topCol2: string;
  eyeCol: string;
  chin: number; // 0.55..0.85 chin width factor
  glasses: 0 | 1 | 2;
  earrings: boolean;
  clip: boolean;
  scarf: boolean;
  freckles: boolean;
  beard: 0 | 1 | 2;
  blush: number;
  lips: boolean;
  wrinkles: boolean;
  makeup: boolean;
  special?: Special;
}

const FEM_HAIR: Hair[] = ['bob', 'long', 'wavy', 'bun', 'pony', 'braids', 'curly', 'short', 'side'];
const MASC_HAIR: Hair[] = [
  'short',
  'side',
  'curly',
  'afro',
  'messy',
  'cap',
  'bun',
  'short',
  'side',
];
const KID_HAIR: Hair[] = [
  'pigtails',
  'bob',
  'short',
  'messy',
  'braids',
  'curly',
  'cap',
  'pony',
  'afro',
];
const FEM_TOP: Top[] = [
  'tshirt',
  'hoodie',
  'sweater',
  'shirt',
  'dress',
  'apron',
  'kimono',
  'coat',
  'cardigan',
];
const MASC_TOP: Top[] = [
  'tshirt',
  'hoodie',
  'sweater',
  'shirt',
  'apron',
  'kimono',
  'coat',
  'cardigan',
];
const KID_TOP: Top[] = ['tshirt', 'hoodie', 'sweater', 'dress', 'shirt'];

function features(look: Look): F {
  const r = rng(look.seed * 13 + 7);
  const p = <T>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const kid = !!look.kid;
  const fem = r() < 0.5;
  const skin = p(SKIN);
  const hair = kid ? p(KID_HAIR) : fem ? p(FEM_HAIR) : p(MASC_HAIR);
  const hairCol = p(HAIR_COL);
  const top = kid ? p(KID_TOP) : fem ? p(FEM_TOP) : p(MASC_TOP);
  const topCol = p(CLOTH);
  let topCol2 = p(CLOTH);
  if (topCol2 === topCol) topCol2 = PAL.cream;
  const eyeCol = p(EYE_COL);
  const chin = 0.55 + r() * 0.3;
  const g = r();
  const glasses: 0 | 1 | 2 = g < 0.72 ? 0 : g < 0.86 ? 1 : 2;
  const earrings = fem && !kid && r() < 0.45;
  const clip = (fem || kid) && r() < 0.35;
  const scarf = !kid && (top === 'coat' || top === 'sweater') && r() < 0.4;
  const freckles = r() < 0.22;
  const b = r();
  const beard: 0 | 1 | 2 = fem || kid ? 0 : b < 0.65 ? 0 : b < 0.82 ? 1 : 2;
  const blush = 0.5 + r() * 0.6;
  const lips = fem && !kid && r() < 0.5;
  const f: F = {
    fem,
    kid,
    skin,
    hair,
    hairCol,
    top,
    topCol,
    topCol2,
    eyeCol,
    chin,
    glasses,
    earrings,
    clip,
    scarf,
    freckles,
    beard,
    blush,
    lips,
    wrinkles: false,
    makeup: false,
    special: look.special,
  };
  switch (look.special) {
    case 'hana':
      return {
        ...f,
        fem: true,
        kid: false,
        skin: '#f4d2bc',
        hair: 'bun',
        hairCol: '#d8d2cc',
        top: 'cardigan',
        topCol: '#c0443c',
        topCol2: '#f6efe2',
        eyeCol: '#4a3a30',
        chin: 0.72,
        glasses: 1,
        earrings: true,
        clip: false,
        scarf: false,
        freckles: false,
        beard: 0,
        blush: 0.7,
        lips: false,
        wrinkles: true,
      };
    case 'baron':
      return {
        ...f,
        fem: false,
        kid: false,
        skin: '#fbe3d3',
        hair: 'side',
        hairCol: '#2b2320',
        top: 'coat',
        topCol: '#5b3a78',
        topCol2: '#f3ead9',
        eyeCol: '#3a2a22',
        chin: 0.78,
        glasses: 0,
        earrings: false,
        clip: false,
        scarf: false,
        freckles: false,
        beard: 0,
        blush: 0.4,
        lips: false,
      };
    case 'lezzetova':
      return {
        ...f,
        fem: true,
        kid: false,
        skin: '#f4d2bc',
        hair: 'wavy',
        hairCol: '#2b2320',
        top: 'dress',
        topCol: '#2a2630',
        topCol2: '#3d3745',
        eyeCol: '#4f6a7a',
        chin: 0.62,
        glasses: 0,
        earrings: true,
        clip: false,
        scarf: false,
        freckles: false,
        beard: 0,
        blush: 0.6,
        lips: true,
        makeup: true,
      };
    case 'ruzgar':
      return {
        ...f,
        fem: false,
        kid: false,
        skin: '#cf9a72',
        hair: 'short',
        hairCol: '#4a2f24',
        top: 'hoodie',
        topCol: '#ef8a3c',
        topCol2: '#f3ead9',
        eyeCol: '#3a2a22',
        chin: 0.7,
        glasses: 0,
        earrings: false,
        clip: false,
        scarf: false,
        freckles: true,
        beard: 0,
        blush: 0.6,
        lips: false,
      };
    case 'sef':
      return {
        ...f,
        fem: false,
        kid: false,
        skin: '#e9b995',
        hair: 'short',
        hairCol: '#2b2320',
        top: 'shirt',
        topCol: '#fbf8f2',
        topCol2: '#d9573f',
        eyeCol: '#3a2a22',
        chin: 0.74,
        glasses: 0,
        earrings: false,
        clip: false,
        scarf: false,
        freckles: false,
        beard: 1,
        blush: 0.5,
        lips: false,
      };
  }
  return f;
}

/** Deterministic look from a seed; about 15% of customers are kids. */
export function randomLook(seed: number): Look {
  const r = rng(seed ^ 0x9e3779b9);
  return { seed, kid: r() < 0.15 };
}

/** Whether a look reads as a woman (used to give customers fitting names). */
export function isFeminine(look: Look): boolean {
  return features(look).fem;
}

// ---------- geometry (100-unit box: feet/bottom at y=100, centre x=50) ----------
const CX = 50;
const OUT = 'rgba(60,35,20,0.28)';
const LINE = 'rgba(60,35,20,0.55)';

interface G {
  top: number; // head top y
  bot: number; // chin y
  rw: number; // half width at the cheeks
  cy: number; // head centre y
  eyeY: number;
  eyeR: number;
  shoulder: number; // half shoulder width
  armW: number;
}

function geom(f: F): G {
  if (f.kid) {
    return { top: 4, bot: 46, rw: 19, cy: 26, eyeY: 29, eyeR: 1.35, shoulder: 25, armW: 9.5 };
  }
  return {
    top: 6,
    bot: 43,
    rw: f.fem ? 16.5 : 17.5,
    cy: 24.5,
    eyeY: 26.5,
    eyeR: 1,
    shoulder: f.fem ? 29 : 32,
    armW: f.fem ? 10.5 : 12,
  };
}

/** Rounded head outline, slightly narrower at the chin. */
function headPath(c: Ctx, g: G, chin: number, grow = 0) {
  const rw = g.rw + grow;
  const top = g.top - grow;
  const bot = g.bot + grow;
  const cy = g.cy;
  c.beginPath();
  c.moveTo(CX, top);
  c.bezierCurveTo(CX + rw * 0.6, top, CX + rw, top + (cy - top) * 0.45, CX + rw, cy);
  c.bezierCurveTo(CX + rw, cy + (bot - cy) * 0.55, CX + rw * chin, bot, CX, bot);
  c.bezierCurveTo(CX - rw * chin, bot, CX - rw, cy + (bot - cy) * 0.55, CX - rw, cy);
  c.bezierCurveTo(CX - rw, top + (cy - top) * 0.45, CX - rw * 0.6, top, CX, top);
  c.closePath();
}

function outline(c: Ctx, w = 1.1) {
  c.strokeStyle = OUT;
  c.lineWidth = w;
  c.stroke();
}

function heart(c: Ctx, x: number, y: number, r: number) {
  c.beginPath();
  c.moveTo(x, y + r);
  c.bezierCurveTo(x - r * 1.4, y - r * 0.2, x - r * 0.6, y - r * 1.2, x, y - r * 0.4);
  c.bezierCurveTo(x + r * 0.6, y - r * 1.2, x + r * 1.4, y - r * 0.2, x, y + r);
  c.closePath();
}

function hairGrad(c: Ctx, f: F, y0: number, y1: number) {
  const gr = c.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, shade(f.hairCol, 0.14));
  gr.addColorStop(1, shade(f.hairCol, -0.18));
  return gr;
}

function clothGrad(c: Ctx, col: string, y0: number, y1: number) {
  const gr = c.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, shade(col, 0.1));
  gr.addColorStop(1, shade(col, -0.16));
  return gr;
}

// ---------- hair: back layer ----------
function hairBack(c: Ctx, f: F, g: G) {
  const { top, rw, cy } = g;
  c.fillStyle = hairGrad(c, f, top, 90);
  switch (f.hair) {
    case 'afro': {
      c.beginPath();
      const R = rw + 9;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const rr = R + (i % 2 ? 2.2 : 0);
        c.arc(
          CX + Math.cos(a) * (R - 4),
          cy - 3 + Math.sin(a) * (R - 4),
          rr * 0.36,
          0,
          Math.PI * 2
        );
      }
      c.fill();
      circle(c, CX, cy - 3, R);
      c.fill();
      outline(c);
      break;
    }
    case 'bob': {
      c.beginPath();
      c.moveTo(CX - rw - 4, cy + 2);
      c.bezierCurveTo(CX - rw - 5, top - 3, CX + rw + 5, top - 3, CX + rw + 4, cy + 2);
      c.lineTo(CX + rw + 3.5, g.bot + 3);
      c.quadraticCurveTo(CX + rw, g.bot + 7, CX + rw - 5, g.bot + 6);
      c.lineTo(CX - rw + 5, g.bot + 6);
      c.quadraticCurveTo(CX - rw, g.bot + 7, CX - rw - 3.5, g.bot + 3);
      c.closePath();
      c.fill();
      outline(c);
      break;
    }
    case 'long':
    case 'wavy': {
      const wavy = f.hair === 'wavy';
      c.beginPath();
      c.moveTo(CX - rw - 4, cy);
      c.bezierCurveTo(CX - rw - 5, top - 3, CX + rw + 5, top - 3, CX + rw + 4, cy);
      // right side down
      if (wavy) {
        c.bezierCurveTo(CX + rw + 9, cy + 16, CX + rw + 3, cy + 26, CX + rw + 10, cy + 40);
        c.quadraticCurveTo(CX + rw + 12, cy + 50, CX + rw + 6, cy + 54);
      } else {
        c.bezierCurveTo(CX + rw + 6, cy + 20, CX + rw + 8, cy + 36, CX + rw + 8, cy + 52);
      }
      c.lineTo(CX - rw - 8, cy + 52);
      if (wavy) {
        c.quadraticCurveTo(CX - rw - 12, cy + 50, CX - rw - 10, cy + 40);
        c.bezierCurveTo(CX - rw - 3, cy + 26, CX - rw - 9, cy + 16, CX - rw - 4, cy);
      } else {
        c.bezierCurveTo(CX - rw - 8, cy + 36, CX - rw - 6, cy + 20, CX - rw - 4, cy);
      }
      c.closePath();
      c.fill();
      outline(c);
      // strand lines
      c.strokeStyle = shade(f.hairCol, -0.25, 0.35);
      c.lineWidth = 0.9;
      for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(CX + s * (rw + 1), cy + 10);
        if (wavy)
          c.bezierCurveTo(
            CX + s * (rw + 7),
            cy + 22,
            CX + s * (rw - 1),
            cy + 32,
            CX + s * (rw + 5),
            cy + 46
          );
        else c.quadraticCurveTo(CX + s * (rw + 4), cy + 30, CX + s * (rw + 3), cy + 46);
        c.stroke();
      }
      break;
    }
    case 'pony': {
      c.beginPath();
      c.moveTo(CX + 8, top + 2);
      c.bezierCurveTo(CX + 24, top + 4, CX + 30, cy + 10, CX + 26, cy + 28);
      c.quadraticCurveTo(CX + 24, cy + 36, CX + 20, cy + 34);
      c.quadraticCurveTo(CX + 23, cy + 20, CX + 16, cy + 8);
      c.quadraticCurveTo(CX + 12, cy, CX + 4, top + 6);
      c.closePath();
      c.fill();
      outline(c);
      break;
    }
    case 'bun':
    case 'pigtails':
    case 'braids':
    case 'curly':
    case 'short':
    case 'side':
    case 'messy':
    case 'cap':
    case 'hijab':
      break;
  }
  // small hair mass behind the ears for short styles so the head doesn't look bald from the side
  if (
    f.hair === 'short' ||
    f.hair === 'side' ||
    f.hair === 'messy' ||
    f.hair === 'curly' ||
    f.hair === 'cap'
  ) {
    c.fillStyle = shade(f.hairCol, -0.1);
    c.beginPath();
    c.moveTo(CX - rw - 1.5, cy - 2);
    c.bezierCurveTo(CX - rw - 2, top - 2, CX + rw + 2, top - 2, CX + rw + 1.5, cy - 2);
    c.lineTo(CX + rw + 1, cy + 6);
    c.lineTo(CX - rw - 1, cy + 6);
    c.closePath();
    c.fill();
  }
}

/** Hijab wraps the head and drapes over the shoulders (drawn after the torso, before the head). */
function hijabDrape(c: Ctx, f: F, g: G) {
  const { top, rw, cy, bot } = g;
  const col = f.topCol2 === PAL.cream ? PAL.sage : f.topCol2;
  c.fillStyle = clothGrad(c, col, top, 100);
  c.beginPath();
  c.moveTo(CX - rw - 4, cy);
  c.bezierCurveTo(CX - rw - 5, top - 5, CX + rw + 5, top - 5, CX + rw + 4, cy);
  c.bezierCurveTo(CX + rw + 8, cy + 16, CX + 33, cy + 26, CX + 30, cy + 40);
  c.quadraticCurveTo(CX, cy + 46, CX - 30, cy + 40);
  c.bezierCurveTo(CX - 33, cy + 26, CX - rw - 8, cy + 16, CX - rw - 4, cy);
  c.closePath();
  c.fill();
  outline(c);
  // face frame ring and under-chin wrap (the head is drawn over the inner half)
  c.strokeStyle = shade(col, 0.06);
  c.lineWidth = 7;
  c.lineJoin = 'round';
  headPath(c, g, f.chin, 0.5);
  c.stroke();
  c.fillStyle = shade(col, -0.04);
  roundRect(c, CX - 15, bot - 8, 30, 20, 9);
  c.fill();
  // fold lines
  c.strokeStyle = shade(col, -0.25, 0.35);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(CX + rw + 2, cy + 14);
  c.quadraticCurveTo(CX + 24, cy + 26, CX + 22, cy + 40);
  c.moveTo(CX - rw - 2, cy + 14);
  c.quadraticCurveTo(CX - 24, cy + 26, CX - 22, cy + 40);
  c.stroke();
}

// ---------- hair: front layer ----------
function capPath(c: Ctx, g: G, sideY: number, bulge: number, fringe: (c: Ctx) => void) {
  const { top, rw } = g;
  c.beginPath();
  c.moveTo(CX - rw - 1.5, sideY);
  c.bezierCurveTo(CX - rw - 2, top - 3, CX - 10, top - 4 - bulge, CX, top - 4 - bulge);
  c.bezierCurveTo(CX + 10, top - 4 - bulge, CX + rw + 2, top - 3, CX + rw + 1.5, sideY);
  fringe(c);
  c.closePath();
}

function hairFront(c: Ctx, f: F, g: G) {
  const { top, rw, cy } = g;
  const hl = top + 8; // hairline
  c.fillStyle = hairGrad(c, f, top - 6, cy + 10);
  c.lineJoin = 'round';
  const shine = () => {
    c.strokeStyle = 'rgba(255,255,255,0.28)';
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(CX - 11, top + 2.5);
    c.quadraticCurveTo(CX - 6, top - 1.5, CX + 1, top - 1.5);
    c.stroke();
  };
  switch (f.hair) {
    case 'short':
      capPath(c, g, cy - 1, 0, (c) => {
        c.quadraticCurveTo(CX + rw - 1, hl - 3, CX + 7, hl - 2);
        c.quadraticCurveTo(CX, hl + 1, CX - 7, hl - 2);
        c.quadraticCurveTo(CX - rw + 1, hl - 3, CX - rw - 1.5, cy - 1);
      });
      c.fill();
      outline(c);
      shine();
      break;
    case 'side':
      capPath(c, g, cy - 1, 0.5, (c) => {
        c.quadraticCurveTo(CX + rw - 2, hl - 4, CX + 9, hl - 4);
        c.bezierCurveTo(CX + 2, hl - 1, CX - 4, hl + 4, CX - 13, hl + 5);
        c.quadraticCurveTo(CX - rw, hl + 2, CX - rw - 1.5, cy - 1);
      });
      c.fill();
      outline(c);
      shine();
      break;
    case 'messy':
      capPath(c, g, cy, 1.5, (c) => {
        const pts = [
          [CX + 15, hl + 1],
          [CX + 11, hl - 3],
          [CX + 6, hl + 2],
          [CX + 1, hl - 3],
          [CX - 5, hl + 2.5],
          [CX - 11, hl - 2],
          [CX - 16, hl + 2],
        ];
        for (const [x, y] of pts) c.lineTo(x, y);
        c.lineTo(CX - rw - 1.5, cy);
      });
      c.fill();
      outline(c);
      // tufts
      c.beginPath();
      c.moveTo(CX - 8, top - 3);
      c.quadraticCurveTo(CX - 10, top - 10, CX - 2, top - 7);
      c.quadraticCurveTo(CX + 2, top - 12, CX + 7, top - 6);
      c.quadraticCurveTo(CX + 12, top - 8, CX + 11, top - 2);
      c.closePath();
      c.fill();
      outline(c);
      break;
    case 'curly':
      capPath(c, g, cy + 1, 2.5, (c) => {
        for (let i = 0; i < 6; i++) {
          const x0 = CX + rw - (i * (2 * rw)) / 5.5;
          c.quadraticCurveTo(x0 - rw / 6, hl + 3, x0 - rw / 3, hl - 1);
        }
        c.lineTo(CX - rw - 1.5, cy + 1);
      });
      c.fill();
      outline(c);
      c.fillStyle = hairGrad(c, f, top - 8, cy);
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.1 + (0.8 * i) / 8);
        circle(c, CX - Math.cos(a) * (rw + 1), top + 10 - Math.sin(a) * 11, 4.3);
        c.fill();
        outline(c, 0.8);
      }
      break;
    case 'afro':
      capPath(c, g, cy, 0, (c) => {
        c.quadraticCurveTo(CX + 8, hl - 1, CX, hl - 1);
        c.quadraticCurveTo(CX - 8, hl - 1, CX - rw - 1.5, cy);
      });
      c.fill();
      break;
    case 'bob':
      capPath(c, g, g.bot + 2, 1, (c) => {
        // right side strand down over the cheek
        c.quadraticCurveTo(CX + rw + 1, cy + 8, CX + rw - 4, g.bot + 1);
        c.quadraticCurveTo(CX + rw - 3, cy + 4, CX + rw - 3, hl + 1);
        c.quadraticCurveTo(CX + 8, hl + 3, CX + 2, hl + 2);
        c.quadraticCurveTo(CX - 6, hl + 4, CX - rw + 3, hl + 1);
        c.quadraticCurveTo(CX - rw + 3, cy + 4, CX - rw + 4, g.bot + 1);
        c.quadraticCurveTo(CX - rw - 1, cy + 8, CX - rw - 1.5, g.bot + 2);
      });
      c.fill();
      outline(c);
      shine();
      break;
    case 'long':
    case 'wavy':
      capPath(c, g, cy + 4, 1, (c) => {
        c.quadraticCurveTo(CX + rw, cy, CX + rw - 2, hl + 5);
        c.quadraticCurveTo(CX + rw - 6, hl - 3, CX + 1, hl - 2.5);
        c.quadraticCurveTo(CX - rw + 6, hl - 3, CX - rw + 2, hl + 5);
        c.quadraticCurveTo(CX - rw, cy, CX - rw - 1.5, cy + 4);
      });
      c.fill();
      outline(c);
      // parting line
      c.strokeStyle = shade(f.hairCol, -0.3, 0.4);
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(CX + 1, hl - 2.5);
      c.lineTo(CX + 1, top - 2);
      c.stroke();
      shine();
      break;
    case 'bun':
      capPath(c, g, cy, 0, (c) => {
        c.quadraticCurveTo(CX + rw - 2, hl - 3, CX + 6, hl - 3);
        c.bezierCurveTo(CX, hl - 1, CX - 5, hl + 2, CX - 12, hl + 3);
        c.quadraticCurveTo(CX - rw, hl + 1, CX - rw - 1.5, cy);
      });
      c.fill();
      outline(c);
      c.fillStyle = hairGrad(c, f, top - 14, top);
      circle(c, CX + 1, top - 5, f.kid ? 6 : 7.5);
      c.fill();
      outline(c);
      c.strokeStyle = shade(f.hairCol, -0.3, 0.4);
      c.lineWidth = 0.8;
      c.beginPath();
      c.arc(CX + 1, top - 5, 4, Math.PI * 0.9, Math.PI * 1.9);
      c.stroke();
      shine();
      break;
    case 'pony':
      capPath(c, g, cy, 0, (c) => {
        c.quadraticCurveTo(CX + rw - 1, hl - 3, CX + 8, hl - 2);
        c.quadraticCurveTo(CX, hl + 1, CX - 8, hl - 2);
        c.quadraticCurveTo(CX - rw + 1, hl - 3, CX - rw - 1.5, cy);
      });
      c.fill();
      outline(c);
      // hair tie
      c.fillStyle = PAL.coral;
      ellipse(c, CX + 12, top + 2, 2.6, 2);
      c.fill();
      shine();
      break;
    case 'braids':
      capPath(c, g, cy, 0, (c) => {
        c.quadraticCurveTo(CX + rw, hl, CX + rw - 3, hl + 4);
        c.quadraticCurveTo(CX + 4, hl - 3, CX + 0.5, hl - 1);
        c.quadraticCurveTo(CX - 4, hl - 3, CX - rw + 3, hl + 4);
        c.quadraticCurveTo(CX - rw, hl, CX - rw - 1.5, cy);
      });
      c.fill();
      outline(c);
      c.strokeStyle = shade(f.hairCol, -0.3, 0.4);
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(CX + 0.5, hl - 1);
      c.lineTo(CX + 0.5, top - 2);
      c.stroke();
      for (const s of [-1, 1]) {
        const x0 = CX + s * (rw + 1.5);
        c.fillStyle = hairGrad(c, f, cy, cy + 40);
        for (let i = 0; i < 6; i++) {
          const y = cy + 2 + i * 6;
          const x = x0 + s * (1.5 + i * 0.6);
          ellipse(c, x, y, 4.2 - i * 0.2, 4);
          c.fill();
          outline(c, 0.8);
        }
        c.fillStyle = PAL.rose;
        ellipse(c, x0 + s * 5.5, cy + 38, 2.4, 2);
        c.fill();
      }
      shine();
      break;
    case 'pigtails':
      capPath(c, g, cy, 0.5, (c) => {
        c.quadraticCurveTo(CX + rw - 1, hl - 2, CX + 8, hl - 1);
        c.quadraticCurveTo(CX + 2, hl + 3, CX - 3, hl - 1);
        c.quadraticCurveTo(CX - 10, hl + 2, CX - rw - 1.5, cy);
      });
      c.fill();
      outline(c);
      for (const s of [-1, 1]) {
        c.fillStyle = hairGrad(c, f, top, cy + 14);
        c.beginPath();
        c.moveTo(CX + s * (rw - 2), top + 8);
        c.bezierCurveTo(
          CX + s * (rw + 14),
          top + 2,
          CX + s * (rw + 16),
          cy + 10,
          CX + s * (rw + 8),
          cy + 16
        );
        c.quadraticCurveTo(CX + s * (rw + 4), cy + 6, CX + s * (rw + 1), top + 12);
        c.closePath();
        c.fill();
        outline(c);
        c.fillStyle = PAL.butter;
        circle(c, CX + s * (rw + 1), top + 10, 2.4);
        c.fill();
      }
      shine();
      break;
    case 'cap': {
      capPath(c, g, cy - 2, 0, (c) => {
        c.quadraticCurveTo(CX + 8, hl - 1, CX, hl - 1);
        c.quadraticCurveTo(CX - 8, hl - 1, CX - rw - 1.5, cy - 2);
      });
      c.fill();
      const col = f.topCol2 === PAL.cream ? PAL.blue : f.topCol2;
      c.fillStyle = clothGrad(c, col, top - 7, hl);
      c.beginPath();
      c.moveTo(CX - rw - 2.5, hl - 1);
      c.bezierCurveTo(CX - rw - 3, top - 7, CX + rw + 3, top - 7, CX + rw + 2.5, hl - 1);
      c.closePath();
      c.fill();
      outline(c);
      // brim
      c.fillStyle = shade(col, -0.18);
      c.beginPath();
      c.moveTo(CX - rw - 2.5, hl - 1);
      c.quadraticCurveTo(CX, hl + 7, CX + rw + 2.5, hl - 1);
      c.quadraticCurveTo(CX, hl + 2.5, CX - rw - 2.5, hl - 1);
      c.closePath();
      c.fill();
      outline(c);
      c.fillStyle = shade(col, -0.25);
      circle(c, CX, top - 6, 1.6);
      c.fill();
      break;
    }
    case 'hijab':
      break;
  }
}

// ---------- body ----------
type Arm = { s: [number, number]; e: [number, number]; h: [number, number] | null };

function arms(g: G, pose: Pose, eating: boolean): { l: Arm; r: Arm } {
  const sw = g.shoulder;
  const sy = 60;
  const ax = sw - g.armW * 0.5 + 1;
  const l: Arm = { s: [CX - ax, sy], e: [CX - sw - 1, 82], h: [CX - 15, 93] };
  const r: Arm = { s: [CX + ax, sy], e: [CX + sw + 1, 82], h: [CX + 15, 93] };
  if (pose === 'queue') {
    l.e = [CX - sw - 1, 82];
    l.h = null;
    r.e = [CX + sw + 1, 82];
    r.h = null;
  } else if (pose === 'sit') {
    l.e = [CX - sw - 4, 84];
    l.h = [CX - 17, 89];
    r.e = [CX + sw + 4, 84];
    r.h = [CX + 17, 89];
  }
  if (eating) {
    r.e = [CX + sw + 12, 72];
    r.h = [CX + g.rw + 9, g.cy + 13];
  }
  return { l, r };
}

function armPath(c: Ctx, a: Arm, to: [number, number]) {
  c.beginPath();
  c.moveTo(a.s[0], a.s[1]);
  c.quadraticCurveTo(a.e[0], a.e[1] - 6, to[0], to[1]);
}

function torsoPath(c: Ctx, g: G, pose: Pose) {
  const sw = g.shoulder;
  const sh = pose === 'queue' ? 0.92 : 1;
  c.beginPath();
  c.moveTo(CX - sw * sh, 100);
  c.lineTo(CX - sw * sh, 66);
  c.bezierCurveTo(CX - sw * sh, 54, CX - sw * sh + 8, 50, CX - 14, 48);
  c.lineTo(CX - 7, 47);
  c.lineTo(CX + 7, 47);
  c.lineTo(CX + 14, 48);
  c.bezierCurveTo(CX + sw * sh - 8, 50, CX + sw * sh, 54, CX + sw * sh, 66);
  c.lineTo(CX + sw * sh, 100);
  c.closePath();
}

function drawArm(c: Ctx, f: F, g: G, a: Arm, shortSleeve: boolean, sleeveCol: string) {
  if (!a.h) {
    // arm straight down (queue)
    c.strokeStyle = sleeveCol;
    c.lineWidth = g.armW;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(a.s[0], a.s[1]);
    c.quadraticCurveTo(a.e[0], a.e[1], a.e[0] + (a.e[0] < CX ? -1 : 1), 100);
    c.stroke();
    c.strokeStyle = OUT;
    c.lineWidth = g.armW + 1.6;
    c.globalCompositeOperation = 'destination-over';
    c.stroke();
    c.globalCompositeOperation = 'source-over';
    return;
  }
  // outline (slightly thicker, drawn first under the sleeve)
  c.lineCap = 'round';
  c.lineJoin = 'round';
  armPath(c, a, a.h);
  c.strokeStyle = OUT;
  c.lineWidth = g.armW + 1.8;
  c.stroke();
  armPath(c, a, a.h);
  c.strokeStyle = sleeveCol;
  c.lineWidth = g.armW;
  c.stroke();
  if (shortSleeve) {
    // forearm in skin from midway
    const mx = (a.e[0] + a.h[0]) / 2;
    const my = (a.e[1] - 6 + a.h[1]) / 2;
    c.beginPath();
    c.moveTo(mx, my);
    c.quadraticCurveTo((mx + a.h[0]) / 2, (my + a.h[1]) / 2 + 2, a.h[0], a.h[1]);
    c.strokeStyle = OUT;
    c.lineWidth = g.armW * 0.78 + 1.6;
    c.stroke();
    c.strokeStyle = f.skin;
    c.lineWidth = g.armW * 0.78;
    c.stroke();
  } else {
    // cuff
    c.strokeStyle = shade(sleeveCol, -0.2, 0.5);
    c.lineWidth = 1.2;
    const t = 0.82;
    const px = a.e[0] + (a.h[0] - a.e[0]) * t;
    const py = a.e[1] - 6 + (a.h[1] - a.e[1] + 6) * t;
    c.beginPath();
    c.arc(px, py, g.armW / 2 + 0.3, 0, Math.PI * 2);
    c.stroke();
  }
  // hand
  const hr = g.armW * 0.56;
  c.fillStyle = f.skin;
  ellipse(c, a.h[0], a.h[1], hr * 1.05, hr);
  c.fill();
  outline(c, 1);
  c.strokeStyle = shade(f.skin, -0.3, 0.4);
  c.lineWidth = 0.8;
  c.beginPath();
  const dir = a.h[0] < CX ? 1 : -1;
  c.moveTo(a.h[0] + dir * hr * 0.1, a.h[1] - hr * 0.1);
  c.lineTo(a.h[0] + dir * hr * 0.1, a.h[1] + hr * 0.75);
  c.moveTo(a.h[0] + dir * hr * 0.55, a.h[1] - hr * 0.05);
  c.lineTo(a.h[0] + dir * hr * 0.55, a.h[1] + hr * 0.65);
  c.stroke();
}

function body(c: Ctx, f: F, g: G, pose: Pose, eating: boolean) {
  const { l, r } = arms(g, pose, eating);
  const sw = g.shoulder;
  const shortSleeve = f.top === 'tshirt' || (f.top === 'dress' && !f.kid);
  const sleeveCol = f.top === 'apron' ? f.topCol2 : f.topCol;

  // neck
  c.fillStyle = f.skin;
  roundRect(c, CX - 6, g.bot - 6, 12, 16, 4);
  c.fill();
  const ng = c.createLinearGradient(0, g.bot - 4, 0, g.bot + 7);
  ng.addColorStop(0, shade(f.skin, -0.35, 0.45));
  ng.addColorStop(1, shade(f.skin, -0.35, 0));
  c.fillStyle = ng;
  roundRect(c, CX - 6, g.bot - 6, 12, 16, 4);
  c.fill();

  // hood behind the neck
  if (f.top === 'hoodie') {
    c.fillStyle = shade(f.topCol, -0.12);
    c.beginPath();
    c.moveTo(CX - 20, 54);
    c.bezierCurveTo(CX - 20, 42, CX - 8, 38, CX, 40);
    c.bezierCurveTo(CX + 8, 38, CX + 20, 42, CX + 20, 54);
    c.closePath();
    c.fill();
    outline(c);
  }

  // torso
  const base = f.top === 'apron' ? f.topCol2 : f.topCol;
  torsoPath(c, g, pose);
  c.fillStyle = clothGrad(c, base, 46, 100);
  c.fill();
  outline(c);
  // side shading on the torso
  c.save();
  torsoPath(c, g, pose);
  c.clip();
  const sg = c.createLinearGradient(CX - sw, 0, CX + sw, 0);
  sg.addColorStop(0, 'rgba(60,35,20,0.16)');
  sg.addColorStop(0.3, 'rgba(60,35,20,0)');
  sg.addColorStop(0.7, 'rgba(60,35,20,0)');
  sg.addColorStop(1, 'rgba(60,35,20,0.16)');
  c.fillStyle = sg;
  c.fillRect(0, 40, 100, 60);
  // shadow under the chin on the clothing
  const cg = c.createRadialGradient(CX, g.bot + 2, 2, CX, g.bot + 2, 16);
  cg.addColorStop(0, 'rgba(60,35,20,0.22)');
  cg.addColorStop(1, 'rgba(60,35,20,0)');
  c.fillStyle = cg;
  c.fillRect(CX - 20, g.bot, 40, 20);
  c.restore();

  clothesDetail(c, f, g);

  // arms (over the torso)
  drawArm(c, f, g, l, shortSleeve, sleeveCol);
  if (!eating) drawArm(c, f, g, r, shortSleeve, sleeveCol);
  return { r, shortSleeve, sleeveCol };
}

function clothesDetail(c: Ctx, f: F, g: G) {
  const sw = g.shoulder;
  const col = f.topCol;
  const nb = g.bot + 6; // neck base
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const neckline = (depth: number, w: number) => {
    c.fillStyle = f.skin;
    c.beginPath();
    c.moveTo(CX - w, nb - 2);
    c.quadraticCurveTo(CX, nb + depth, CX + w, nb - 2);
    c.closePath();
    c.fill();
    c.strokeStyle = shade(col, -0.3, 0.5);
    c.lineWidth = 1.3;
    c.beginPath();
    c.moveTo(CX - w, nb - 2);
    c.quadraticCurveTo(CX, nb + depth, CX + w, nb - 2);
    c.stroke();
  };
  switch (f.top) {
    case 'tshirt':
      neckline(5, 9);
      c.strokeStyle = shade(col, -0.2, 0.25);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(CX - sw + 6, 74);
      c.quadraticCurveTo(CX - sw + 10, 84, CX - sw + 6, 96);
      c.stroke();
      break;
    case 'hoodie':
      neckline(7, 10);
      c.strokeStyle = PAL.cream;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(CX - 6, nb + 2);
      c.lineTo(CX - 7, nb + 20);
      c.moveTo(CX + 6, nb + 2);
      c.lineTo(CX + 7, nb + 20);
      c.stroke();
      c.strokeStyle = shade(col, -0.3, 0.4);
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(CX - 16, 86);
      c.lineTo(CX - 14, 100);
      c.moveTo(CX + 16, 86);
      c.lineTo(CX + 14, 100);
      c.stroke();
      break;
    case 'sweater': {
      // ribbed collar
      c.fillStyle = shade(col, 0.12);
      roundRect(c, CX - 11, nb - 7, 22, 8, 4);
      c.fill();
      outline(c, 0.9);
      c.strokeStyle = shade(col, -0.25, 0.4);
      c.lineWidth = 0.8;
      for (let i = -3; i <= 3; i++) {
        c.beginPath();
        c.moveTo(CX + i * 3, nb - 6);
        c.lineTo(CX + i * 3, nb);
        c.stroke();
      }
      // knit texture
      c.strokeStyle = shade(col, -0.22, 0.22);
      c.lineWidth = 0.9;
      for (let y = nb + 10; y < 100; y += 6) {
        c.beginPath();
        for (let x = CX - sw + 4; x <= CX + sw - 4; x += 4) {
          c.lineTo(x, y + ((x / 4) % 2 ? 1.2 : -1.2));
        }
        c.stroke();
      }
      break;
    }
    case 'shirt': {
      neckline(6, 7);
      // collar
      c.fillStyle = shade(col, 0.08);
      c.beginPath();
      c.moveTo(CX - 8, nb - 6);
      c.lineTo(CX - 14, nb + 4);
      c.lineTo(CX - 1, nb + 7);
      c.lineTo(CX, nb);
      c.closePath();
      c.fill();
      outline(c, 0.9);
      c.beginPath();
      c.moveTo(CX + 8, nb - 6);
      c.lineTo(CX + 14, nb + 4);
      c.lineTo(CX + 1, nb + 7);
      c.lineTo(CX, nb);
      c.closePath();
      c.fill();
      outline(c, 0.9);
      // button placket
      c.strokeStyle = shade(col, -0.25, 0.35);
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(CX, nb + 7);
      c.lineTo(CX, 100);
      c.stroke();
      c.fillStyle = f.special === 'sef' ? f.topCol2 : shade(col, -0.35);
      const dbl = f.special === 'sef';
      for (let y = nb + 13; y < 100; y += 10) {
        if (dbl) {
          circle(c, CX - 5, y, 1.5);
          c.fill();
          circle(c, CX + 5, y, 1.5);
          c.fill();
        } else {
          circle(c, CX, y, 1.3);
          c.fill();
        }
      }
      if (f.special === 'sef') {
        // chef jacket: red piping, folded collar
        c.strokeStyle = f.topCol2;
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(CX - 8, nb - 6);
        c.lineTo(CX - 14, nb + 4);
        c.moveTo(CX + 8, nb - 6);
        c.lineTo(CX + 14, nb + 4);
        c.stroke();
      }
      break;
    }
    case 'dress': {
      // scoop neckline with a light collar band and tiny bow
      neckline(9, 12);
      c.strokeStyle = f.special === 'lezzetova' ? shade(col, 0.15) : f.topCol2;
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(CX - 12, nb - 2);
      c.quadraticCurveTo(CX, nb + 9.5, CX + 12, nb - 2);
      c.stroke();
      if (f.special !== 'lezzetova') {
        c.fillStyle = f.topCol2;
        ellipse(c, CX - 2.6, nb + 7.5, 2.4, 1.5);
        c.fill();
        ellipse(c, CX + 2.6, nb + 7.5, 2.4, 1.5);
        c.fill();
        c.fillStyle = shade(f.topCol2, -0.2);
        circle(c, CX, nb + 7.5, 1.1);
        c.fill();
      }
      break;
    }
    case 'apron': {
      neckline(5, 8);
      // bib
      c.fillStyle = clothGrad(c, col, 56, 100);
      c.beginPath();
      c.moveTo(CX - 14, 62);
      c.lineTo(CX + 14, 62);
      c.lineTo(CX + 18, 78);
      c.lineTo(CX + sw - 2, 82);
      c.lineTo(CX + sw - 2, 100);
      c.lineTo(CX - sw + 2, 100);
      c.lineTo(CX - sw + 2, 82);
      c.lineTo(CX - 18, 78);
      c.closePath();
      c.fill();
      outline(c);
      // straps
      c.strokeStyle = shade(col, -0.08);
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(CX - 12, 62);
      c.quadraticCurveTo(CX - 9, nb - 4, CX - 5, nb - 4);
      c.moveTo(CX + 12, 62);
      c.quadraticCurveTo(CX + 9, nb - 4, CX + 5, nb - 4);
      c.stroke();
      // pocket
      c.fillStyle = shade(col, -0.1);
      roundRect(c, CX - 8, 84, 16, 11, 2);
      c.fill();
      outline(c, 0.8);
      break;
    }
    case 'kimono': {
      // haori-style crossed collar: two cream bands meet at the chest, then run down to the obi
      const bandW = 4.5;
      const vx = CX;
      const vy = nb + 15;
      const obiY = 84;
      c.fillStyle = f.skin;
      c.beginPath();
      c.moveTo(CX - 8, nb - 6);
      c.lineTo(vx, vy - 4);
      c.lineTo(CX + 8, nb - 6);
      c.closePath();
      c.fill();
      c.fillStyle = f.topCol2;
      // right band (under)
      c.beginPath();
      c.moveTo(CX + 9, nb - 7);
      c.lineTo(vx + bandW * 0.5, vy);
      c.lineTo(vx + bandW * 0.5, obiY);
      c.lineTo(vx - bandW * 0.5, obiY);
      c.lineTo(vx - bandW * 0.5, vy);
      c.lineTo(CX + 9 - bandW, nb - 7);
      c.closePath();
      c.fill();
      outline(c, 0.9);
      // left band (over)
      c.beginPath();
      c.moveTo(CX - 9, nb - 7);
      c.lineTo(vx + bandW * 0.5, vy);
      c.lineTo(vx + bandW * 0.5, obiY);
      c.lineTo(vx - bandW * 0.5 - 0.5, obiY);
      c.lineTo(vx - bandW * 0.5 - 0.5, vy + 1);
      c.lineTo(CX - 9 + bandW, nb - 7);
      c.closePath();
      c.fill();
      outline(c, 0.9);
      // obi
      const obi = f.topCol2 === PAL.cream ? PAL.indigo : shade(f.topCol2, -0.3);
      c.fillStyle = clothGrad(c, obi, obiY, obiY + 9);
      roundRect(c, CX - sw + 1, obiY, sw * 2 - 2, 9, 1.5);
      c.fill();
      outline(c, 0.8);
      c.fillStyle = shade(obi, 0.3);
      roundRect(c, CX - 5, obiY + 1.5, 10, 6, 1.5);
      c.fill();
      outline(c, 0.7);
      break;
    }
    case 'coat': {
      c.fillStyle = f.topCol2;
      c.beginPath();
      c.moveTo(CX - 6, nb - 5);
      c.lineTo(CX, nb + 6);
      c.lineTo(CX + 6, nb - 5);
      c.closePath();
      c.fill();
      // lapels
      c.fillStyle = shade(col, -0.14);
      c.beginPath();
      c.moveTo(CX - 7, nb - 6);
      c.lineTo(CX - 16, nb + 10);
      c.lineTo(CX - 2, nb + 16);
      c.lineTo(CX, nb + 6);
      c.closePath();
      c.fill();
      outline(c, 0.9);
      c.beginPath();
      c.moveTo(CX + 7, nb - 6);
      c.lineTo(CX + 16, nb + 10);
      c.lineTo(CX + 2, nb + 16);
      c.lineTo(CX, nb + 6);
      c.closePath();
      c.fill();
      outline(c, 0.9);
      c.strokeStyle = shade(col, -0.3, 0.4);
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(CX, nb + 16);
      c.lineTo(CX, 100);
      c.stroke();
      c.fillStyle = f.special === 'baron' ? '#d7b35a' : shade(col, -0.35);
      for (let y = nb + 22; y < 100; y += 11) {
        circle(c, CX - 6, y, 1.6);
        c.fill();
        circle(c, CX + 6, y, 1.6);
        c.fill();
      }
      if (f.special === 'baron') {
        // cravat
        c.fillStyle = '#f3ead9';
        c.beginPath();
        c.moveTo(CX - 5, nb - 4);
        c.quadraticCurveTo(CX, nb + 1, CX + 5, nb - 4);
        c.quadraticCurveTo(CX + 4, nb + 10, CX, nb + 12);
        c.quadraticCurveTo(CX - 4, nb + 10, CX - 5, nb - 4);
        c.closePath();
        c.fill();
        outline(c, 0.8);
        c.fillStyle = '#d7b35a';
        circle(c, CX, nb + 3, 1.5);
        c.fill();
      }
      break;
    }
    case 'cardigan': {
      // inner blouse
      c.fillStyle = f.topCol2;
      c.beginPath();
      c.moveTo(CX - 12, nb - 5);
      c.lineTo(CX - 10, 100);
      c.lineTo(CX + 10, 100);
      c.lineTo(CX + 12, nb - 5);
      c.closePath();
      c.fill();
      neckline(5, 7);
      // cardigan fronts
      c.fillStyle = clothGrad(c, col, 46, 100);
      c.beginPath();
      c.moveTo(CX - sw, 66);
      c.bezierCurveTo(CX - sw, 54, CX - sw + 8, 50, CX - 13, 48);
      c.lineTo(CX - 9, 100);
      c.lineTo(CX - sw, 100);
      c.closePath();
      c.fill();
      outline(c, 0.9);
      c.beginPath();
      c.moveTo(CX + sw, 66);
      c.bezierCurveTo(CX + sw, 54, CX + sw - 8, 50, CX + 13, 48);
      c.lineTo(CX + 9, 100);
      c.lineTo(CX + sw, 100);
      c.closePath();
      c.fill();
      outline(c, 0.9);
      c.fillStyle = shade(col, -0.3);
      for (let y = nb + 16; y < 100; y += 12) {
        circle(c, CX - 11, y, 1.3);
        c.fill();
      }
      // blouse buttons
      c.fillStyle = shade(f.topCol2, -0.3);
      for (let y = nb + 10; y < 100; y += 12) {
        circle(c, CX, y, 1);
        c.fill();
      }
      break;
    }
  }
  if (f.scarf) {
    const sc = f.topCol2 === PAL.cream ? PAL.coral : f.topCol2;
    c.fillStyle = clothGrad(c, sc, nb - 8, nb + 10);
    roundRect(c, CX - 14, nb - 8, 28, 10, 5);
    c.fill();
    outline(c, 0.9);
    c.beginPath();
    c.moveTo(CX - 2, nb);
    c.lineTo(CX - 8, nb + 22);
    c.lineTo(CX + 1, nb + 23);
    c.lineTo(CX + 5, nb);
    c.closePath();
    c.fill();
    outline(c, 0.9);
    c.strokeStyle = shade(sc, -0.3, 0.4);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(CX - 10, nb - 4);
    c.lineTo(CX + 10, nb - 2);
    c.stroke();
  }
}

// ---------- head & face ----------
function head(c: Ctx, f: F, g: G) {
  // ears
  c.fillStyle = f.skin;
  for (const s of [-1, 1]) {
    ellipse(c, CX + s * (g.rw + 0.5), g.cy + 2, 3.4, 4.2);
    c.fill();
    outline(c, 1);
    c.strokeStyle = shade(f.skin, -0.3, 0.45);
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(CX + s * (g.rw + 0.8), g.cy + 2, 1.8, Math.PI * 0.2, Math.PI * 1.1);
    c.stroke();
  }
  headPath(c, g, f.chin);
  c.fillStyle = f.skin;
  c.fill();
  c.save();
  headPath(c, g, f.chin);
  c.clip();
  // soft light from the upper left
  const hg = c.createRadialGradient(CX - 6, g.top + 10, 2, CX - 6, g.top + 10, 34);
  hg.addColorStop(0, 'rgba(255,255,255,0.22)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hg;
  c.fillRect(0, 0, 100, 100);
  // chin and side shadow
  const sg = c.createLinearGradient(0, g.bot - 11, 0, g.bot);
  sg.addColorStop(0, shade(f.skin, -0.35, 0));
  sg.addColorStop(1, shade(f.skin, -0.35, 0.28));
  c.fillStyle = sg;
  c.fillRect(0, g.bot - 12, 100, 14);
  const rg = c.createLinearGradient(CX + g.rw - 7, 0, CX + g.rw, 0);
  rg.addColorStop(0, shade(f.skin, -0.35, 0));
  rg.addColorStop(1, shade(f.skin, -0.35, 0.18));
  c.fillStyle = rg;
  c.fillRect(CX, 0, 60, 100);
  c.restore();
  headPath(c, g, f.chin);
  outline(c, 1.1);
}

type Expr = { mood: Mood; eating: boolean; talk: boolean };

function face(c: Ctx, f: F, g: G, e: Expr, turn: number) {
  const ey = g.eyeY;
  const ex = f.kid ? 7.2 : 6.8;
  const er = f.kid ? 4.2 : 3.1; // eye radius
  const dark = PAL.ink;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.save();
  c.translate(turn, 0);

  // blush
  const blushA = e.mood === 'angry' ? 0.55 : e.mood === 'love' ? 0.5 : 0.2 * f.blush;
  c.fillStyle = `rgba(239,120,110,${blushA})`;
  ellipse(c, CX - ex - 3.5, ey + 5.5, 4.4, 2.4);
  c.fill();
  ellipse(c, CX + ex + 3.5, ey + 5.5, 4.4, 2.4);
  c.fill();
  if (f.freckles) {
    c.fillStyle = shade(f.skin, -0.35, 0.5);
    const r = rng(7);
    for (let i = 0; i < 8; i++) {
      const s = i < 4 ? -1 : 1;
      circle(c, CX + s * (ex + 2 + r() * 5), ey + 4 + r() * 3.5, 0.55);
      c.fill();
    }
  }
  if (f.makeup) {
    c.fillStyle = 'rgba(120,80,150,0.35)';
    ellipse(c, CX - ex, ey - 2.2, er + 1.6, er * 0.7);
    c.fill();
    ellipse(c, CX + ex, ey - 2.2, er + 1.6, er * 0.7);
    c.fill();
  }

  // eyes
  const love = e.mood === 'love';
  const closed = e.eating;
  for (const s of [-1, 1]) {
    const x = CX + s * ex;
    if (love) {
      c.fillStyle = '#ee6f8c';
      heart(c, x, ey + 0.3, er * 1.15);
      c.fill();
      c.strokeStyle = 'rgba(160,50,80,0.5)';
      c.lineWidth = 0.7;
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      circle(c, x - er * 0.4, ey - er * 0.45, er * 0.28);
      c.fill();
      continue;
    }
    if (closed) {
      // happy closed eye ^
      c.strokeStyle = dark;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(x - er, ey + 0.5);
      c.quadraticCurveTo(x, ey - er * 1.1, x + er, ey + 0.5);
      c.stroke();
      continue;
    }
    const squint =
      e.mood === 'happy' ? 0.8 : e.mood === 'angry' ? 0.75 : e.mood === 'worried' ? 1.05 : 1;
    const ry = er * 1.12 * squint;
    // sclera
    c.fillStyle = '#fffdf9';
    ellipse(c, x, ey, er, ry);
    c.fill();
    c.save();
    ellipse(c, x, ey, er, ry);
    c.clip();
    // iris + pupil
    const ix = x + turn * 0.25;
    c.fillStyle = f.eyeCol;
    circle(c, ix, ey + 0.4, er * 0.72);
    c.fill();
    c.fillStyle = dark;
    circle(c, ix, ey + 0.6, er * 0.42);
    c.fill();
    // top shadow of the lid
    c.fillStyle = 'rgba(60,35,20,0.18)';
    ellipse(c, x, ey - ry * 0.95, er * 1.1, ry * 0.42);
    c.fill();
    c.restore();
    // highlights
    c.fillStyle = 'rgba(255,255,255,0.95)';
    circle(c, ix - er * 0.3, ey - er * 0.32, er * 0.24);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)';
    circle(c, ix + er * 0.3, ey + er * 0.35, er * 0.12);
    c.fill();
    // upper lid line
    c.strokeStyle = dark;
    c.lineWidth = f.fem && !f.kid ? 1.4 : 1.1;
    c.beginPath();
    c.moveTo(x - er * 1.05, ey - ry * 0.1);
    c.quadraticCurveTo(x, ey - ry * 1.6, x + er * 1.05, ey - ry * 0.1);
    c.stroke();
    if (f.fem && !f.kid) {
      // lash flick
      c.beginPath();
      c.moveTo(x + s * er * 1.0, ey - ry * 0.25);
      c.lineTo(x + s * er * 1.45, ey - ry * 0.75);
      c.stroke();
    }
    if (e.mood === 'happy') {
      // lower lid pushed up by the smile
      c.strokeStyle = shade(f.skin, -0.35, 0.5);
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(x - er * 0.9, ey + ry * 0.75);
      c.quadraticCurveTo(x, ey + ry * 0.35, x + er * 0.9, ey + ry * 0.75);
      c.stroke();
    }
  }

  // eyebrows
  const bcol = shade(f.hairCol === '#d8d2cc' ? '#8a8078' : f.hairCol, -0.15);
  c.strokeStyle = bcol;
  c.lineWidth = f.fem ? 1.4 : 1.9;
  const by = ey - er * 2.1;
  for (const s of [-1, 1]) {
    const x = CX + s * ex;
    c.beginPath();
    switch (e.mood) {
      case 'happy':
      case 'love':
        c.moveTo(x - s * er * 1.1, by + 0.5);
        c.quadraticCurveTo(x, by - 2.2, x + s * er * 1.1, by + 0.2);
        break;
      case 'neutral':
        c.moveTo(x - s * er * 1.1, by + 1);
        c.quadraticCurveTo(x, by - 0.8, x + s * er * 1.1, by + 0.6);
        break;
      case 'worried':
        // inner end raised
        c.moveTo(x - s * er * 1.1, by - 1.6);
        c.quadraticCurveTo(x, by - 1.2, x + s * er * 1.1, by + 1.4);
        break;
      case 'angry':
        // inner end lowered
        c.moveTo(x - s * er * 1.0, by + 2.4);
        c.quadraticCurveTo(x, by + 0.4, x + s * er * 1.1, by - 1);
        break;
    }
    c.stroke();
  }

  // nose
  c.strokeStyle = shade(f.skin, -0.4, 0.55);
  c.lineWidth = 1;
  const ny = ey + (f.kid ? 5.5 : 5);
  c.beginPath();
  c.moveTo(CX - 0.6, ny - 1.5);
  c.quadraticCurveTo(CX + 1.6, ny + 1.6, CX - 0.8, ny + 1.6);
  c.stroke();

  // mouth
  const my = ny + (f.kid ? 4.6 : 4.4);
  const mouthFill = '#8e3f45';
  const lipCol = f.lips ? (f.makeup ? '#c43a4f' : '#d9737f') : '';
  if (e.eating) {
    c.fillStyle = mouthFill;
    ellipse(c, CX, my + 0.6, 2.6, 3);
    c.fill();
    c.fillStyle = '#e07a82';
    ellipse(c, CX, my + 2.4, 1.6, 1.1);
    c.fill();
    c.strokeStyle = LINE;
    c.lineWidth = 0.9;
    ellipse(c, CX, my + 0.6, 2.6, 3);
    c.stroke();
  } else if (e.talk) {
    c.fillStyle = mouthFill;
    ellipse(c, CX, my + 0.4, 2.3, 1.7);
    c.fill();
    c.strokeStyle = LINE;
    c.lineWidth = 0.9;
    ellipse(c, CX, my + 0.4, 2.3, 1.7);
    c.stroke();
  } else {
    c.strokeStyle = f.lips ? lipCol : LINE;
    c.lineWidth = f.lips ? 1.8 : 1.2;
    switch (e.mood) {
      case 'happy':
      case 'love': {
        // open smile
        c.beginPath();
        c.moveTo(CX - 4.6, my - 1);
        c.quadraticCurveTo(CX, my + 4.5, CX + 4.6, my - 1);
        c.quadraticCurveTo(CX, my + 0.6, CX - 4.6, my - 1);
        c.closePath();
        c.fillStyle = mouthFill;
        c.fill();
        c.fillStyle = '#fffdf9';
        c.beginPath();
        c.moveTo(CX - 3.6, my - 0.6);
        c.quadraticCurveTo(CX, my + 1.4, CX + 3.6, my - 0.6);
        c.quadraticCurveTo(CX, my + 0.4, CX - 3.6, my - 0.6);
        c.fill();
        c.beginPath();
        c.moveTo(CX - 4.6, my - 1);
        c.quadraticCurveTo(CX, my + 4.5, CX + 4.6, my - 1);
        c.stroke();
        break;
      }
      case 'neutral':
        c.beginPath();
        c.moveTo(CX - 3.2, my);
        c.quadraticCurveTo(CX, my + 2.2, CX + 3.2, my);
        c.stroke();
        break;
      case 'worried':
        c.beginPath();
        c.moveTo(CX - 3.6, my + 0.6);
        c.bezierCurveTo(CX - 1.6, my - 1.6, CX + 0.4, my + 2.6, CX + 3.6, my + 0.2);
        c.stroke();
        break;
      case 'angry':
        c.beginPath();
        c.moveTo(CX - 3.6, my + 1.6);
        c.quadraticCurveTo(CX, my - 1.4, CX + 3.6, my + 1.6);
        c.stroke();
        break;
    }
    if (f.lips && (e.mood === 'neutral' || e.mood === 'worried')) {
      c.fillStyle = lipCol;
      ellipse(c, CX, my - 0.6, 3.2, 1.3);
      c.fill();
    }
  }

  // beard / stubble
  if (f.beard === 1) {
    c.fillStyle = shade(f.hairCol, 0, 0.18);
    c.beginPath();
    c.moveTo(CX - g.rw * 0.95, ey + 6);
    c.quadraticCurveTo(CX - g.rw * 0.9, g.bot, CX, g.bot);
    c.quadraticCurveTo(CX + g.rw * 0.9, g.bot, CX + g.rw * 0.95, ey + 6);
    c.quadraticCurveTo(CX + g.rw * 0.8, my + 5, CX, my + 6);
    c.quadraticCurveTo(CX - g.rw * 0.8, my + 5, CX - g.rw * 0.95, ey + 6);
    c.closePath();
    c.fill();
  } else if (f.beard === 2) {
    c.fillStyle = hairGrad(c, f, ey + 4, g.bot + 4);
    c.beginPath();
    c.moveTo(CX - g.rw, ey + 3);
    c.quadraticCurveTo(CX - g.rw * 0.95, g.bot + 4, CX, g.bot + 4);
    c.quadraticCurveTo(CX + g.rw * 0.95, g.bot + 4, CX + g.rw, ey + 3);
    c.quadraticCurveTo(CX + g.rw * 0.72, my + 1.5, CX + 5.2, my - 2.4);
    c.quadraticCurveTo(CX, my + 6, CX - 5.2, my - 2.4);
    c.quadraticCurveTo(CX - g.rw * 0.72, my + 1.5, CX - g.rw, ey + 3);
    c.closePath();
    c.fill();
    outline(c, 0.9);
  }
  if (f.special === 'baron') {
    // twirled moustache
    c.strokeStyle = '#2b2320';
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(CX, my - 2.2);
    c.bezierCurveTo(CX + 4, my - 5, CX + 8, my - 2, CX + 10, my - 6);
    c.moveTo(CX, my - 2.2);
    c.bezierCurveTo(CX - 4, my - 5, CX - 8, my - 2, CX - 10, my - 6);
    c.stroke();
    c.fillStyle = '#2b2320';
    circle(c, CX + 10, my - 6, 1.3);
    c.fill();
    circle(c, CX - 10, my - 6, 1.3);
    c.fill();
  }
  if (f.wrinkles) {
    c.strokeStyle = shade(f.skin, -0.4, 0.45);
    c.lineWidth = 0.7;
    for (const s of [-1, 1]) {
      const x = CX + s * (ex + er + 1.2);
      c.beginPath();
      c.moveTo(x, ey - 1);
      c.lineTo(x + s * 2, ey - 2);
      c.moveTo(x, ey + 1);
      c.lineTo(x + s * 2.2, ey + 1.6);
      c.stroke();
      c.beginPath();
      c.moveTo(CX + s * 3.5, ny + 1);
      c.quadraticCurveTo(CX + s * 6.5, my - 1, CX + s * 5.5, my + 2.5);
      c.stroke();
    }
  }
  c.restore();
}

function accessories(c: Ctx, f: F, g: G, turn: number) {
  const ey = g.eyeY;
  const ex = f.kid ? 7.2 : 6.8;
  const er = f.kid ? 4.2 : 3.1;
  c.lineCap = 'round';
  if (f.glasses) {
    c.save();
    c.translate(turn, 0);
    c.strokeStyle = f.special === 'hana' ? '#8a6a3a' : '#4a3a35';
    c.lineWidth = 1.2;
    c.fillStyle = 'rgba(255,255,255,0.18)';
    for (const s of [-1, 1]) {
      const x = CX + s * ex;
      if (f.glasses === 1) circle(c, x, ey + 0.2, er + 1.9);
      else roundRect(c, x - er - 1.8, ey - er - 1.2, (er + 1.8) * 2, (er + 1.4) * 2, 2.2);
      c.fill();
      c.stroke();
    }
    c.beginPath();
    c.moveTo(CX - ex + er + 1.9, ey);
    c.lineTo(CX + ex - er - 1.9, ey);
    c.moveTo(CX - ex - er - 1.9, ey);
    c.lineTo(CX - g.rw - 0.5, ey - 0.5);
    c.moveTo(CX + ex + er + 1.9, ey);
    c.lineTo(CX + g.rw + 0.5, ey - 0.5);
    c.stroke();
    // lens shine
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineWidth = 0.9;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(CX + s * ex - 2.2, ey - 2.4);
      c.lineTo(CX + s * ex - 0.6, ey - 3.4);
      c.stroke();
    }
    c.restore();
  }
  if (f.earrings && f.hair !== 'hijab') {
    c.fillStyle = f.special === 'lezzetova' ? '#fbf7ef' : PAL.honey;
    for (const s of [-1, 1]) {
      circle(c, CX + s * (g.rw + 0.6), g.cy + 6.6, 1.3);
      c.fill();
      outline(c, 0.6);
    }
  }
  if (f.clip && f.hair !== 'hijab' && f.hair !== 'cap') {
    c.fillStyle = PAL.rose;
    c.save();
    c.translate(CX - g.rw * 0.55, g.top + 6);
    c.rotate(-0.5);
    roundRect(c, -3.2, -1.1, 6.4, 2.2, 1.1);
    c.fill();
    outline(c, 0.7);
    c.restore();
    c.fillStyle = PAL.butter;
    circle(c, CX - g.rw * 0.55 + 1.6, g.top + 5.2, 1.1);
    c.fill();
  }
}

// ---------- special hats ----------
function hats(c: Ctx, f: F, g: G) {
  const { top, rw } = g;
  c.lineJoin = 'round';
  switch (f.special) {
    case 'baron': {
      c.fillStyle = '#23202a';
      ellipse(c, CX, top + 3, rw + 9, 4.5);
      c.fill();
      outline(c, 1);
      const tg = c.createLinearGradient(CX - 14, 0, CX + 14, 0);
      tg.addColorStop(0, '#34303d');
      tg.addColorStop(0.5, '#1d1a24');
      tg.addColorStop(1, '#2e2a36');
      c.fillStyle = tg;
      c.beginPath();
      c.moveTo(CX - 15, top + 3);
      c.lineTo(CX - 14, top - 26);
      c.quadraticCurveTo(CX, top - 29, CX + 14, top - 26);
      c.lineTo(CX + 15, top + 3);
      c.closePath();
      c.fill();
      outline(c, 1);
      c.fillStyle = '#7d4fa0';
      c.fillRect(CX - 15, top - 3, 30, 5);
      c.fillStyle = 'rgba(255,255,255,0.14)';
      roundRect(c, CX - 11, top - 23, 3.5, 17, 1.6);
      c.fill();
      // monocle
      c.strokeStyle = '#d7b35a';
      c.lineWidth = 1.4;
      c.fillStyle = 'rgba(255,255,255,0.22)';
      circle(c, CX + 6.8, g.eyeY + 0.2, 5.2);
      c.fill();
      c.stroke();
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(CX + 11.6, g.eyeY + 2);
      c.quadraticCurveTo(CX + 16, g.eyeY + 10, CX + 14, g.eyeY + 20);
      c.stroke();
      break;
    }
    case 'lezzetova': {
      c.save();
      c.translate(CX, top + 1);
      c.rotate(-0.1);
      c.fillStyle = '#211d22';
      ellipse(c, 0, 0, 36, 8);
      c.fill();
      outline(c, 1);
      const hg = c.createLinearGradient(0, -15, 0, 0);
      hg.addColorStop(0, '#3a343d');
      hg.addColorStop(1, '#211d22');
      c.fillStyle = hg;
      c.beginPath();
      c.moveTo(-16, 1);
      c.quadraticCurveTo(-15, -15, 0, -15);
      c.quadraticCurveTo(15, -15, 16, 1);
      c.closePath();
      c.fill();
      outline(c, 1);
      c.fillStyle = 'rgba(255,255,255,0.1)';
      ellipse(c, -10, 2, 20, 3);
      c.fill();
      // ribbon + rose
      c.fillStyle = '#5b2a3a';
      c.fillRect(-16, -4, 32, 4);
      c.fillStyle = '#c0392b';
      circle(c, 14, -4, 4.2);
      c.fill();
      c.fillStyle = '#e05a4a';
      c.beginPath();
      c.arc(13, -5, 2.6, 0, Math.PI * 1.5);
      c.fill();
      c.fillStyle = PAL.moss;
      ellipse(c, 19, -2, 3, 1.4);
      c.fill();
      c.restore();
      // pearls
      c.fillStyle = '#fbf7ef';
      c.strokeStyle = 'rgba(120,100,80,0.4)';
      c.lineWidth = 0.5;
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (0.15 + (0.7 * i) / 8);
        circle(c, CX + Math.cos(a) * 11, g.bot + 7 + Math.sin(a) * 5, 1.5);
        c.fill();
        c.stroke();
      }
      break;
    }
    case 'ruzgar': {
      const hg = c.createLinearGradient(CX - 22, 0, CX + 22, 0);
      hg.addColorStop(0, '#36b3a6');
      hg.addColorStop(0.45, '#1f8f85');
      hg.addColorStop(1, '#176a63');
      const dTop = top - 9;
      c.fillStyle = hg;
      c.beginPath();
      c.moveTo(CX - rw - 4, g.cy + 1);
      c.bezierCurveTo(CX - rw - 6, dTop + 2, CX - 12, dTop - 3, CX, dTop - 3);
      c.bezierCurveTo(CX + 12, dTop - 3, CX + rw + 6, dTop + 2, CX + rw + 4, g.cy + 1);
      c.lineTo(CX + rw + 2, g.cy + 4);
      c.quadraticCurveTo(CX + rw - 3, g.cy - 3, CX + 12, top + 6);
      c.quadraticCurveTo(CX, top + 4.5, CX - 12, top + 6);
      c.quadraticCurveTo(CX - rw + 3, g.cy - 3, CX - rw - 2, g.cy + 4);
      c.closePath();
      c.fill();
      outline(c, 1);
      // vents
      c.fillStyle = '#145a54';
      for (const dx of [-9, 0, 9]) {
        roundRect(c, CX + dx - 1.4, dTop + 2, 2.8, 7, 1.4);
        c.fill();
      }
      // gloss
      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.beginPath();
      c.moveTo(CX - 16, dTop + 7);
      c.quadraticCurveTo(CX - 8, dTop - 1, CX + 4, dTop - 0.5);
      c.quadraticCurveTo(CX - 6, dTop + 2, CX - 14, dTop + 9);
      c.fill();
      // visor peak
      c.fillStyle = '#f4a259';
      c.beginPath();
      c.moveTo(CX - rw - 1, top + 7);
      c.quadraticCurveTo(CX, top + 1.5, CX + rw + 1, top + 7);
      c.quadraticCurveTo(CX, top + 8.5, CX - rw - 1, top + 7);
      c.closePath();
      c.fill();
      outline(c, 0.8);
      // strap
      c.strokeStyle = '#176f68';
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(CX - rw - 1, g.cy + 3);
      c.quadraticCurveTo(CX - rw + 2, g.bot - 1, CX - 4, g.bot + 1);
      c.moveTo(CX + rw + 1, g.cy + 3);
      c.quadraticCurveTo(CX + rw - 2, g.bot - 1, CX + 4, g.bot + 1);
      c.stroke();
      // reflective stripe on the jacket
      c.strokeStyle = 'rgba(255,255,255,0.75)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(CX - g.shoulder + 2, 84);
      c.lineTo(CX + g.shoulder - 2, 84);
      c.stroke();
      break;
    }
    case 'sef': {
      c.fillStyle = '#fbf8f2';
      c.strokeStyle = 'rgba(120,100,90,0.45)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(CX - rw - 1.5, top + 9);
      c.quadraticCurveTo(CX, top + 4, CX + rw + 1.5, top + 9);
      c.lineTo(CX + rw + 1.5, top + 14);
      c.quadraticCurveTo(CX, top + 10, CX - rw - 1.5, top + 14);
      c.closePath();
      c.fill();
      c.stroke();
      c.strokeStyle = '#d9573f';
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(CX - rw, top + 11.5);
      c.quadraticCurveTo(CX, top + 7, CX + rw, top + 11.5);
      c.stroke();
      // knot tails
      c.fillStyle = '#fbf8f2';
      c.beginPath();
      c.moveTo(CX - rw - 1, top + 10);
      c.lineTo(CX - rw - 9, top + 15);
      c.lineTo(CX - rw - 2, top + 14);
      c.closePath();
      c.fill();
      c.strokeStyle = 'rgba(120,100,90,0.45)';
      c.lineWidth = 1;
      c.stroke();
      break;
    }
  }
}

// ---------- extras: chopsticks, hearts, sweat, anger ----------
function chopsticks(c: Ctx, hand: [number, number], my: number) {
  const tipX = CX + 1;
  const tipY = my + 0.5;
  c.lineCap = 'round';
  // sticks: held in the fist, tips meeting at the mouth
  c.strokeStyle = OUT;
  c.lineWidth = 2.6;
  c.beginPath();
  const sticks = () => {
    c.beginPath();
    c.moveTo(hand[0] + 3, hand[1] + 4);
    c.lineTo(tipX - 0.8, tipY);
    c.moveTo(hand[0] + 4.5, hand[1] + 0.5);
    c.lineTo(tipX + 1.6, tipY + 0.6);
    c.stroke();
  };
  sticks();
  c.strokeStyle = '#a06a44';
  c.lineWidth = 1.4;
  sticks();
  c.strokeStyle = 'rgba(255,255,255,0.4)';
  c.lineWidth = 0.5;
  c.beginPath();
  c.moveTo(hand[0] + 3, hand[1] + 3.4);
  c.lineTo(tipX - 0.7, tipY - 0.5);
  c.stroke();
  // noodles hanging from the tips, swinging a little
  for (const [dx, len] of [
    [-1.4, 11],
    [0.4, 13],
    [2, 10],
  ]) {
    c.strokeStyle = 'rgba(60,35,20,0.25)';
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(tipX + dx, tipY + 1);
    c.bezierCurveTo(
      tipX + dx + 2,
      tipY + len * 0.4,
      tipX + dx - 2,
      tipY + len * 0.7,
      tipX + dx + 0.6,
      tipY + len
    );
    c.stroke();
    c.strokeStyle = '#f3dfae';
    c.lineWidth = 1.5;
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.55)';
    c.lineWidth = 0.5;
    c.beginPath();
    c.moveTo(tipX + dx - 0.3, tipY + 2);
    c.bezierCurveTo(
      tipX + dx + 1.6,
      tipY + len * 0.4,
      tipX + dx - 2.2,
      tipY + len * 0.7,
      tipX + dx + 0.3,
      tipY + len - 1.5
    );
    c.stroke();
  }
}

function moodExtras(c: Ctx, f: F, g: G, e: Expr) {
  if (e.mood === 'love' && !e.eating) {
    c.fillStyle = '#ef6f8a';
    c.strokeStyle = 'rgba(160,50,80,0.45)';
    c.lineWidth = 0.7;
    const hs: [number, number, number][] = [
      [CX + g.rw + 10, g.top + 6, 4.2],
      [CX + g.rw + 18, g.top - 5, 3],
      [CX + g.rw + 5, g.top - 6, 2.2],
    ];
    for (const [x, y, r] of hs) {
      heart(c, x, y, r);
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.7)';
      circle(c, x - r * 0.35, y - r * 0.45, r * 0.22);
      c.fill();
      c.fillStyle = '#ef6f8a';
    }
  } else if (e.mood === 'worried') {
    // sweat drop
    const x = CX + g.rw + 2;
    const y = g.top + 10;
    c.fillStyle = '#9fd0e8';
    c.beginPath();
    c.moveTo(x, y - 4);
    c.quadraticCurveTo(x + 3.2, y + 1, x, y + 2.5);
    c.quadraticCurveTo(x - 3.2, y + 1, x, y - 4);
    c.closePath();
    c.fill();
    outline(c, 0.7);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    circle(c, x - 0.9, y, 0.7);
    c.fill();
  } else if (e.mood === 'angry') {
    // anger mark
    const x = CX + g.rw + 6;
    const y = g.top + 2;
    c.strokeStyle = '#d9573f';
    c.lineWidth = 1.4;
    c.lineCap = 'round';
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.6;
      c.moveTo(x + Math.cos(a) * 1.6, y + Math.sin(a) * 1.6);
      c.lineTo(x + Math.cos(a) * 4.6, y + Math.sin(a) * 4.6);
    }
    c.stroke();
  }
  void f;
}

// ---------- assembling a character in the 100-unit box ----------
function drawCharacter(c: Ctx, look: Look, e: Expr, pose: Pose) {
  const f = features(look);
  const g = geom(f);
  const turn = pose === 'queue' ? 2.2 : 0;
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (f.hair !== 'hijab') hairBack(c, f, g);
  const b = body(c, f, g, pose, e.eating);
  if (f.hair === 'hijab') hijabDrape(c, f, g);
  head(c, f, g);
  face(c, f, g, e, turn);
  hairFront(c, f, g);
  accessories(c, f, g, turn);
  hats(c, f, g);
  if (e.eating && b.r.h) {
    const my = g.eyeY + (f.kid ? 10.1 : 9.4);
    drawArm(c, f, g, b.r, b.shortSleeve, b.sleeveCol);
    chopsticks(c, b.r.h, my);
  }
  moodExtras(c, f, g, e);
  c.restore();
}

// ---------- sprite cache & public drawing API ----------
// sprite box in units: x from -40 to 140, y from -36 to 100
const BX = -40;
const BY = -36;
const BW = 180;
const BH = 136;

function qsize(size: number) {
  return Math.max(48, Math.ceil(size / 24) * 24);
}

function spriteFor(look: Look, e: Expr, pose: Pose, size: number): HTMLCanvasElement {
  const q = qsize(size);
  const k = `av|${look.special ?? ''}|${look.seed}|${look.kid ? 1 : 0}|${e.mood}|${e.eating ? 1 : 0}|${e.talk ? 1 : 0}|${pose}|${q}`;
  const s = q / 100;
  return sprite(
    k,
    BW * s,
    BH * s,
    (c) => {
      c.scale(s, s);
      c.translate(-BX, -BY);
      drawCharacter(c, look, e, pose);
    },
    2
  );
}

/** Standing sprite (canvas) for a look+mood; kept for old callers that drawImage it themselves. */
export function avatarImage(look: Look, mood: Mood, eating = false): HTMLCanvasElement {
  return spriteFor(look, { mood, eating, talk: false }, 'stand', 120);
}

/** Pre-render the sprites a customer will need so they appear instantly. */
export function preloadAvatar(look: Look, moods: Mood[]): void {
  for (const m of moods) spriteFor(look, { mood: m, eating: false, talk: false }, 'stand', 200);
  spriteFor(look, { mood: 'happy', eating: true, talk: false }, 'stand', 200);
}

/**
 * Draw a character with its bottom edge at y, centred on x. `size` is the height of
 * the upper body (head top to bottom edge); hats may extend above.
 */
export function drawAvatar(
  c: Ctx,
  look: Look,
  mood: Mood,
  x: number,
  y: number,
  size: number,
  opts?: { eating?: boolean; flip?: boolean; bob?: number; pose?: Pose; talking?: boolean }
): void {
  const pose = opts?.pose ?? 'stand';
  const eating = !!opts?.eating;
  const talk = !eating && !!opts?.talking && Math.floor(performance.now() / 300) % 2 === 0;
  const sp = spriteFor(look, { mood, eating, talk }, pose, size);
  const s = size / 100;
  c.save();
  c.translate(x, y - (opts?.bob ?? 0));
  if (opts?.flip) c.scale(-1, 1);
  c.drawImage(sp, (BX - 50) * s, (BY - 100) * s, BW * s, BH * s);
  c.restore();
}
