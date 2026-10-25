import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as toonHead from '@dicebear/toon-head';
import { CatArt, type Look, type Mood } from './art';

// Character art: "Toon Head" by Johan Melin (CC BY 4.0), rendered through DiceBear (MIT).
// Story characters get hand-drawn accessory overlays (hats, glasses, helmet).

type Opts = Record<string, unknown>;

const HAIR = ['sideComed', 'undercut', 'spiky', 'bun'] as const;
const REAR = ['longStraight', 'longWavy', 'shoulderHigh', 'neckHigh'] as const;
const CLOTHES = ['turtleNeck', 'openJacket', 'dress', 'shirt', 'tShirt'] as const;
const CLOTH_COL = [
  '545454',
  'b11f1f',
  '0b3286',
  '147f3c',
  'eab308',
  '731ac3',
  'ec4899',
  'f97316',
  '2a9d8f',
  'e8e9e6',
  '6d4c41',
];
const SKIN = ['f1c3a5', 'c68e7a', 'b98e6a', 'a36b4f', '5c3829', 'f7d7c4'];
const HAIR_COL = ['2c1b18', 'a55728', 'b58143', 'd6b370', '724133', '111111', 'c0c0c0'];
const BEARD = ['moustacheTwirl', 'fullBeard', 'chin', 'chinMoustache', 'longBeard'] as const;

function seeded(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a ^= a << 13;
    a ^= a >>> 17;
    a ^= a << 5;
    return ((a >>> 0) % 100000) / 100000;
  };
}

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

function base(seed: number) {
  const r = seeded(seed * 13 + 7);
  const p = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const fem = r() < 0.5;
  return {
    fem,
    opts: {
      hair: [fem ? p(['bun', 'sideComed'] as const) : p(HAIR)],
      rearHair: [p(REAR)],
      rearHairProbability: fem ? 100 : 0,
      hairColor: [p(HAIR_COL)],
      skinColor: [p(SKIN)],
      clothes: [fem ? p(CLOTHES) : p(['turtleNeck', 'openJacket', 'shirt', 'tShirt'] as const)],
      clothesColor: [p(CLOTH_COL)],
      beard: [p(BEARD)],
      beardProbability: !fem && r() < 0.35 ? 100 : 0,
    } as Opts,
  };
}

/** Whether a random look reads as a woman (used to give customers fitting names). */
export function isFeminine(look: Look) {
  return base(look.seed ?? 1).fem;
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
  return base(look.seed ?? 1).opts;
}

function Overlay({ who }: { who: Look['special'] }) {
  switch (who) {
    case 'hana':
      return (
        <svg viewBox="0 0 100 100" className="av-over">
          <g fill="none" stroke="#6b3a1f" strokeWidth="1.6">
            <circle cx="41" cy="44" r="6.2" fill="#ffffff22" />
            <circle cx="59" cy="44" r="6.2" fill="#ffffff22" />
            <path d="M47 44h6" />
          </g>
          <path d="M44 10 l14 8" stroke="#c0392b" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case 'baron':
      return (
        <svg viewBox="0 0 100 100" className="av-over">
          <rect x="31" y="-2" width="38" height="22" rx="2" fill="#151515" />
          <rect x="31" y="14" width="38" height="5" fill="#8e44ad" />
          <ellipse cx="50" cy="20" rx="28" ry="4.5" fill="#151515" />
          <circle cx="60" cy="44" r="6" fill="#ffffff30" stroke="#c9a227" strokeWidth="1.4" />
          <path d="M66 44 q4 8 2 18" stroke="#c9a227" strokeWidth="0.8" fill="none" />
        </svg>
      );
    case 'lezzetova':
      return (
        <svg viewBox="0 0 100 100" className="av-over">
          <ellipse cx="54" cy="16" rx="26" ry="7" fill="#9b1c31" transform="rotate(-8 54 16)" />
          <circle cx="70" cy="9" r="2.6" fill="#9b1c31" />
          <g fill="#ffffff22" stroke="#d4a017" strokeWidth="1.6">
            <path d="M33 42 q8 -4 14 1 q-1 7 -7 7 q-7 0 -7 -8z" />
            <path d="M67 42 q-8 -4 -14 1 q1 7 7 7 q7 0 7 -8z" />
          </g>
        </svg>
      );
    case 'ruzgar':
      return (
        <svg viewBox="0 0 100 100" className="av-over">
          <path
            d="M26 34 Q26 8 50 8 Q74 8 74 34 L70 34 Q68 20 50 20 Q32 20 30 34z"
            fill="#0b7a70"
          />
          <path d="M30 26 Q50 16 70 26 L68 20 Q50 12 32 20z" fill="#a8f0e8" opacity=".85" />
          <path d="M40 10 h20" stroke="#ffd166" strokeWidth="3" />
        </svg>
      );
    case 'sef':
      return (
        <svg viewBox="0 0 100 100" className="av-over">
          <path
            d="M33 22 Q24 12 33 5 Q38 -3 48 1 Q55 -5 63 2 Q75 -1 73 10 Q80 17 69 23z"
            fill="#fff"
            stroke="#d6d6d6"
            strokeWidth="1.2"
          />
          <rect
            x="33"
            y="19"
            width="36"
            height="8"
            rx="2"
            fill="#fff"
            stroke="#d6d6d6"
            strokeWidth="1.2"
          />
        </svg>
      );
    default:
      return null;
  }
}

export function avatarUri(look: Look, mood: Mood, eating = false) {
  return createAvatar(toonHead, {
    seed: String(look.seed ?? 1),
    backgroundColor: ['transparent'],
    ...lookOpts(look),
    ...face(eating ? 'eating' : mood),
  } as never).toDataUri();
}

export function Avatar({
  look,
  mood,
  size = 200,
  eating = false,
}: {
  look: Look;
  mood: Mood;
  size?: number;
  eating?: boolean;
}) {
  const key = JSON.stringify([look.seed, look.special, mood, eating]);
  const uri = useMemo(
    () =>
      createAvatar(toonHead, {
        seed: String(look.seed ?? 1),
        backgroundColor: ['transparent'],
        ...lookOpts(look),
        ...face(eating ? 'eating' : mood),
      } as never).toDataUri(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  return (
    <div
      className={`avatar-wrap ${mood === 'love' ? 'love' : ''}`}
      style={{ width: size, height: size }}>
      <img src={uri} width={size} height={size} alt="" className="avatar" draggable={false} />
      <Overlay who={look.special} />
      {mood === 'love' && !eating && (
        <div className="av-hearts">
          <i>❤</i>
          <i>❤</i>
          <i>❤</i>
        </div>
      )}
    </div>
  );
}

export function Portrait({
  who,
  mood = 'happy',
  size = 120,
}: {
  who: string;
  mood?: Mood;
  size?: number;
}) {
  if (who === 'miso') return <CatArt size={size} />;
  if (who === 'mahalle')
    return (
      <div className="crowd" style={{ width: size * 1.3, height: size }}>
        <Avatar look={{ seed: 11 } as Look} mood="happy" size={size * 0.75} />
        <Avatar look={{ seed: 29 } as Look} mood="neutral" size={size * 0.75} />
      </div>
    );
  return (
    <Avatar look={{ seed: 1, special: who as Look['special'] } as Look} mood={mood} size={size} />
  );
}
