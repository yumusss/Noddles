import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';
import { CatArt, type Look, type Mood } from './art';

// Character art: "Avataaars" by Pablo Stanley (free for personal and commercial use),
// rendered through DiceBear. Options are hand-picked for a grounded, non-cartoony cast.

const SKIN = ['614335', 'd08b5b', 'ae5d29', 'edb98a', 'ffdbb4'];
const HAIR = ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'd6b370', 'e8e1e1'];
const CLOTHES = [
  '262e33',
  '3c4f5c',
  '25557c',
  '5199e4',
  '929598',
  'e6e6e6',
  'ff5c5c',
  'a7ffc4',
  'ffafb9',
  'ffffff',
];
const TOPS = [
  'bob',
  'bun',
  'curly',
  'curvy',
  'frida',
  'fro',
  'longButNotTooLong',
  'miaWallace',
  'shavedSides',
  'straight02',
  'straight01',
  'straightAndStrand',
  'dreads01',
  'frizzle',
  'shaggy',
  'shortCurly',
  'shortFlat',
  'shortRound',
  'shortWaved',
  'sides',
  'theCaesar',
  'theCaesarAndSidePart',
  'bigHair',
  'hijab',
  'winterHat1',
  'hat',
] as const;
const CLOTHING = [
  'blazerAndShirt',
  'blazerAndSweater',
  'collarAndSweater',
  'hoodie',
  'overall',
  'shirtCrewNeck',
  'shirtScoopNeck',
  'shirtVNeck',
] as const;
const GLASSES = ['prescription01', 'prescription02', 'round', 'wayfarers'] as const;
const BEARDS = ['beardLight', 'beardMedium', 'moustacheFancy', 'beardMajestic'] as const;

type Opts = Record<string, unknown>;

function face(mood: Mood | 'eating'): Opts {
  switch (mood) {
    case 'love':
      return { eyes: ['hearts'], eyebrows: ['raisedExcitedNatural'], mouth: ['smile'] };
    case 'happy':
      return { eyes: ['happy'], eyebrows: ['defaultNatural'], mouth: ['smile'] };
    case 'neutral':
      return { eyes: ['default'], eyebrows: ['defaultNatural'], mouth: ['default'] };
    case 'worried':
      return { eyes: ['side'], eyebrows: ['sadConcernedNatural'], mouth: ['concerned'] };
    case 'angry':
      return { eyes: ['squint'], eyebrows: ['angryNatural'], mouth: ['serious'] };
    case 'eating':
      return { eyes: ['closed'], eyebrows: ['raisedExcitedNatural'], mouth: ['eating'] };
  }
}

function seeded(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a ^= a << 13;
    a ^= a >>> 17;
    a ^= a << 5;
    return ((a >>> 0) % 100000) / 100000;
  };
}

const FEM_TOPS = new Set([
  'bob',
  'bun',
  'curly',
  'curvy',
  'frida',
  'longButNotTooLong',
  'miaWallace',
  'straight01',
  'straight02',
  'straightAndStrand',
  'bigHair',
  'hijab',
]);

function pickTop(seed: number) {
  const r = seeded(seed);
  return TOPS[Math.floor(r() * TOPS.length)];
}

/** Whether a random look reads as a woman (used to give customers fitting names). */
export function isFeminine(look: Look) {
  return FEM_TOPS.has(pickTop(look.seed ?? 1));
}

function lookOpts(look: Look): Opts {
  switch (look.special) {
    case 'hana':
      return {
        top: ['bun'],
        hairColor: ['e8e1e1'],
        accessories: ['round'],
        accessoriesProbability: 100,
        accessoriesColor: ['3c4f5c'],
        clothing: ['collarAndSweater'],
        clothesColor: ['c0392b'],
        skinColor: ['edb98a'],
        facialHairProbability: 0,
      };
    case 'baron':
      return {
        top: ['hat'],
        hatColor: ['262e33'],
        facialHair: ['moustacheMagnum'],
        facialHairColor: ['4a312c'],
        facialHairProbability: 100,
        accessories: ['round'],
        accessoriesProbability: 100,
        accessoriesColor: ['929598'],
        clothing: ['blazerAndShirt'],
        clothesColor: ['5a2a6e'],
        skinColor: ['ffdbb4'],
      };
    case 'lezzetova':
      return {
        top: ['miaWallace'],
        hairColor: ['2c1b18'],
        accessories: ['wayfarers'],
        accessoriesProbability: 100,
        accessoriesColor: ['262e33'],
        clothing: ['blazerAndSweater'],
        clothesColor: ['262e33'],
        skinColor: ['edb98a'],
        facialHairProbability: 0,
      };
    case 'ruzgar':
      return {
        top: ['winterHat02'],
        hatColor: ['2ec4b6'],
        clothing: ['hoodie'],
        clothesColor: ['25557c'],
        skinColor: ['d08b5b'],
        facialHairProbability: 0,
        accessoriesProbability: 0,
      };
    case 'sef':
      return {
        top: ['shortFlat'],
        hairColor: ['2c1b18'],
        clothing: ['shirtCrewNeck'],
        clothesColor: ['ffffff'],
        skinColor: ['d08b5b'],
        facialHair: ['beardLight'],
        facialHairColor: ['2c1b18'],
        facialHairProbability: 100,
        accessoriesProbability: 0,
      };
  }
  const top = pickTop(look.seed ?? 1);
  const fem = FEM_TOPS.has(top);
  const r = seeded((look.seed ?? 1) * 7 + 3);
  const p = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  return {
    top: [top],
    hairColor: [p(HAIR)],
    hatColor: [p(CLOTHES)],
    skinColor: [p(SKIN)],
    clothing: [p(CLOTHING)],
    clothesColor: [p(CLOTHES)],
    accessories: [p(GLASSES)],
    accessoriesProbability: r() < 0.28 ? 100 : 0,
    accessoriesColor: ['262e33'],
    facialHair: [p(BEARDS)],
    facialHairColor: [p(HAIR)],
    facialHairProbability: !fem && r() < 0.3 ? 100 : 0,
  };
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
      createAvatar(avataaars, {
        seed: String(look.seed ?? 1),
        style: ['default'],
        backgroundColor: ['transparent'],
        ...lookOpts(look),
        ...face(eating ? 'eating' : mood),
      } as never).toDataUri(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  return <img src={uri} width={size} height={size} alt="" className="avatar" draggable={false} />;
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
