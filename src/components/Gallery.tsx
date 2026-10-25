import { INGREDIENTS } from '../data';
import { BowlCanvas, BowlSide, Tray } from './FoodCanvas';
import type { BowlDraw } from '../food';

const P = (id: string, x: number, y: number, k: number, s = 0.85) => ({
  id,
  x,
  y,
  r: k * 47,
  s,
  k,
});

export default function Gallery() {
  const ramen: BowlDraw = {
    noodle: 'ramen',
    thick: 'orta',
    liquid: 'tonkotsu',
    fill: 0.9,
    pieces: [
      P('chashu', 110, 115, 1),
      P('chashu', 135, 100, 2),
      P('yumurta', 190, 140, 3),
      P('nori', 205, 200, 4),
      P('naruto', 120, 195, 5),
      P('yesil', 155, 160, 6),
      P('yesil', 175, 110, 7),
      P('bambu', 90, 165, 8),
    ],
  };
  const dry: BowlDraw = {
    noodle: 'udon',
    thick: 'kalin',
    liquid: 'teriyaki',
    fill: 0.85,
    pieces: [
      P('karides', 120, 130, 1),
      P('karides', 170, 150, 2),
      P('susam', 150, 110, 3),
      P('yesil', 130, 180, 4),
      P('pakchoi', 200, 190, 5),
    ],
  };
  const spicy: BowlDraw = {
    noodle: 'ramen',
    thick: 'ince',
    liquid: 'acili',
    fill: 0.85,
    pieces: [
      P('kimchi', 120, 120, 1),
      P('aciyag', 170, 160, 2),
      P('biber', 140, 190, 3),
      P('tofu', 190, 110, 4),
      P('tofu', 205, 135, 5),
      P('filiz', 100, 170, 6),
      P('misir', 160, 120, 7),
      P('mantar', 120, 210, 8),
      P('lime', 210, 190, 9),
      P('citir', 150, 150, 10),
    ],
  };
  return (
    <div
      style={{
        background: '#2a1a12',
        minHeight: '100%',
        padding: 12,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        overflow: 'auto',
        height: '100%',
      }}>
      <BowlCanvas bowl={ramen} size={340} />
      <BowlCanvas bowl={dry} size={340} />
      <BowlCanvas bowl={spicy} size={340} />
      <BowlCanvas
        bowl={{ noodle: 'soba', thick: 'ince', liquid: 'miso', fill: 0.4, pieces: [] }}
        size={200}
      />
      <BowlCanvas bowl={{ noodle: 'pirinc', thick: 'orta', fill: 0, pieces: [] }} size={200} />
      <div style={{ padding: 30 }}>
        <BowlSide bowl={ramen} width={220} />
      </div>
      <div style={{ padding: 30 }}>
        <BowlSide bowl={{ ...dry, takeaway: true }} width={220} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, width: '100%' }}>
        {Object.keys(INGREDIENTS).map((id) => (
          <div key={id} style={{ color: '#fff', font: '11px sans-serif' }}>
            <Tray id={id} width={120} />
            <div>{INGREDIENTS[id].name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
