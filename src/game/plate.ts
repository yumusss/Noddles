// What sits on a plate, and what the player is holding.

import type { IngId, PlateId } from './data';

export type RiceQ = 'less' | 'just' | 'more';
export type RollQ = 'tight' | 'loose' | 'squashed';
export type CutQ = 'clean' | 'crooked';
export type Thick = 'thin' | 'normal' | 'thick';
export type Done = 'raw' | 'done' | 'over' | 'burnt';
export type MakiStyle = 'hoso' | 'futo' | 'ura';

export interface NigiriP {
  kind: 'nigiri';
  rice: RiceQ;
  neta?: IngId;
  /** for cooked neta (unagi) */
  done?: Done;
  band?: boolean;
  /** seared with the torch (aburi) */
  aburi?: Done;
}
export interface MakiP {
  kind: 'maki';
  style: MakiStyle;
  fill: IngId[];
  coat?: IngId;
  rice: RiceQ;
  roll: RollQ;
  cut: CutQ;
  /** worst doneness among cooked fillings */
  done?: Done;
  /** index of the slice along the roll, for drawing variety */
  idx: number;
}
export interface SashimiP {
  kind: 'sashimi';
  fish: IngId;
  thick: Thick;
  cut: CutQ;
  idx: number;
}
export interface TemakiP {
  kind: 'temaki';
  fill: IngId[];
  rice: RiceQ;
  done?: Done;
}
export interface SideP {
  kind: 'side';
  ing: IngId; // wasabi | ginger | soy
}

export type PieceBody = NigiriP | MakiP | SashimiP | TemakiP | SideP;
export type Piece = PieceBody & {
  uid: number;
  /** plate-local position, plate is ~ 1 unit wide */
  x: number;
  y: number;
  rot: number;
  tops: IngId[];
  /** spawn time for the little drop animation */
  born: number;
};

export interface PlateState {
  id: PlateId;
  pieces: Piece[];
}

export type Hand =
  | { k: 'tub'; ing: IngId }
  | { k: 'rice'; q: RiceQ }
  | { k: 'batch'; pieces: PieceBody[]; label: IngId | 'maki' | 'temaki' }
  | { k: 'plate' }
  | { k: 'torch' };

let uidCounter = 1;
export function newUid() {
  return uidCounter++;
}

export const sameSet = (a: IngId[], b: IngId[]) =>
  a.length === b.length && a.every((x) => b.includes(x)) && b.every((x) => a.includes(x));

/** rough footprint radius of a piece in plate units, used to keep pieces from stacking */
export function pieceRadius(p: PieceBody): number {
  switch (p.kind) {
    case 'nigiri':
      return 0.085;
    case 'maki':
      return p.style === 'hoso' ? 0.06 : 0.075;
    case 'sashimi':
      return 0.07;
    case 'temaki':
      return 0.1;
    case 'side':
      return p.ing === 'soy' ? 0.08 : 0.055;
  }
}
