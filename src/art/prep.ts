// Preparation station: layout, wooden counter background, slot coasters,
// gauge, cook-timer ring, locked covers and the tutorial pointer.
import {
  type Ctx,
  type Tod,
  PAL,
  TOD_LIGHT,
  shade,
  rgba,
  mix,
  rng,
  roundRect,
  ellipse,
  circle,
  softShadow,
  vGrad,
  gloss,
  speckle,
  sprite,
  blit,
  label,
  clamp,
  FONT_DISPLAY,
} from './common';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PrepLayout {
  bowl: { x: number; y: number; size: number };
  shelf: { x: number; y: number; w: number; h: number; slots: { x: number; y: number }[] };
  trays: Rect[];
  thickChips: Rect;
  pots: Rect[];
  tubs: Rect[];
  gauge: Rect;
  trash: Rect;
  /** height of the tiled wall strip (counter starts below it) */
  wallH: number;
  /** free counter areas where props are drawn (not touch targets) */
  props: Rect[];
}

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- layout

export interface SlotCounts {
  tubs: number;
  trays: number;
  pots: number;
}

/** Lay out only the unlocked slots (no empty coasters). Rows re-centre when partially filled. */
export function prepLayout(W: number, H: number, counts?: SlotCounts): PrepLayout {
  const full = H > W ? portrait(W, H) : landscape(W, H);
  if (!counts) return full;
  const n = {
    tubs: Math.min(counts.tubs, full.tubs.length),
    trays: Math.min(counts.trays, full.trays.length),
    pots: Math.min(counts.pots, full.pots.length),
  };
  let tubs = pickRows(full.tubs, n.tubs);
  // portrait with only the first row in use: the empty second row leaves room for bigger tubs
  if (H > W && n.tubs <= 6 && tubs.length) {
    const t0 = tubs[0].w;
    const big = Math.min(t0 * 1.4, (W - 24 - (n.tubs - 1) * 12) / n.tubs);
    const span = n.tubs * big + (n.tubs - 1) * 12;
    tubs = tubs.map((r, i) => ({ x: W / 2 - span / 2 + i * (big + 12), y: r.y, w: big, h: big }));
  }
  return {
    ...full,
    tubs,
    trays: pickRows(full.trays, n.trays),
    pots: pickRows(full.pots, n.pots),
  };
}

/** Keep the first n rects, then re-centre each horizontal row of the kept rects around the row's original centre. */
function pickRows(all: Rect[], n: number): Rect[] {
  const kept = all.slice(0, n);
  const rows = new Map<number, Rect[]>();
  for (const r of all) (rows.get(r.y) ?? rows.set(r.y, []).get(r.y)!).push(r);
  const out: Rect[] = [];
  for (const r of kept) {
    const row = rows.get(r.y)!;
    if (row.length <= 2 || row.every((q) => q.x === row[0].x)) {
      out.push(r);
      continue;
    }
    const keptRow = row.filter((q) => kept.includes(q));
    const minX = Math.min(...row.map((q) => q.x));
    const maxX = Math.max(...row.map((q) => q.x + q.w));
    const centre = (minX + maxX) / 2;
    const span = keptRow.length * r.w + (keptRow.length - 1) * (row[1].x - row[0].x - row[0].w);
    const idx = keptRow.indexOf(r);
    out.push({ ...r, x: centre - span / 2 + idx * (row[1].x - row[0].x) });
  }
  return out;
}

function landscape(W: number, H: number): PrepLayout {
  const m = 24; // outer margin
  const narrow = W < 1200; // 4:3 tablets
  // wide phones get a taller wall so the order ticket hanging on the rail never covers the counter
  const wallH = narrow ? 150 : 196;
  // trays: 2×2 on wide screens, a single column of 4 on narrow ones
  const trW = narrow ? 100 : 110;
  const trH = narrow ? 66 : 74;
  const trCols = narrow ? 1 : 2;
  const traysW = trCols * trW + (trCols - 1) * 14;
  // pots: always 2 columns × 5
  const pgap = 8;
  const pot = Math.min(narrow ? 82 : 100, Math.floor((H - 14 - (wallH + 10)) / 5 - pgap));
  const potsW = 2 * pot + pgap;
  // middle region for the bowl + tubs
  const mx0 = m + traysW + 14;
  const mx1 = W - m - potsW - 14;
  const M = mx1 - mx0;
  const bowlSize = narrow ? 280 : 300;
  const gaugeW = 64;
  const trashW = 72;
  const gap = 10;
  // vertical budget: top row + side column (3 tubs) + bottom row must fit between the wall and the bottom edge
  const vertMax = (H - 14 - (wallH + 16) - 4 * gap) / 5;
  const tub1 = Math.round(
    Math.max(
      80,
      Math.min(
        110,
        vertMax,
        (M - 5 * gap) / 6,
        (M - bowlSize - 44 - (gaugeW + 20) - (narrow ? 0 : trashW + 26)) / 2
      )
    )
  );
  // wide phones: two tub columns on each side of the bowl → only 4 tubs tall, so every tub can be bigger
  const tub2 = Math.floor(
    Math.min(
      124,
      (H - 14 - (wallH + 16) - 3 * gap) / 4,
      (M - 5 * gap) / 6,
      (M - bowlSize - 44 - 2 * gap) / 4 // gauge + trash move to the left column in this mode
    )
  );
  const twoCol = !narrow && tub2 > tub1 + 8;
  const tub = twoCol ? tub2 : tub1;
  // centre the bowl so the gauge (left) and trash (right) both fit beside the tub columns
  const extraL = twoCol ? 0 : gaugeW + 20;
  const extraR = twoCol || narrow ? 0 : trashW + 26;
  const sideBlock = (twoCol ? 2 * tub + gap : tub) + 22 + bowlSize / 2;
  const slack = Math.max(0, M - 2 * sideBlock - extraL - extraR);
  const mcx = mx0 + extraL + sideBlock + slack / 2;
  // shelf with 6 bowl slots — on the left half of the wall (the ticket rail hangs on the right)
  const slotSp = Math.min(100, (W * 0.5 - 2 * m) / 6);
  const shelfW = 6 * slotSp + 20;
  const shelf = {
    x: m,
    y: wallH - 4,
    w: shelfW,
    h: 14,
    slots: Array.from({ length: 6 }, (_, i) => ({ x: m + 10 + (i + 0.5) * slotSp, y: wallH - 36 })),
  };
  // top & bottom tub rows (6 each), centred on the middle region
  const rowW = 6 * tub + 5 * gap;
  const rowX = Math.max(mx0, Math.min(mx1 - rowW, mcx - rowW / 2));
  const topY = wallH + 16;
  const botY = H - 14 - tub;
  const tubs: Rect[] = [];
  for (let i = 0; i < 6; i++) tubs.push({ x: rowX + i * (tub + gap), y: topY, w: tub, h: tub });
  const bowlY = (topY + tub + botY) / 2;
  const bowl = { x: mcx, y: bowlY, size: bowlSize };
  const cols = twoCol ? 2 : 1;
  const sideRows = twoCol ? 2 : 3;
  const colH = sideRows * tub + (sideRows - 1) * gap;
  const colY = bowlY - colH / 2;
  const sideW = cols * tub + (cols - 1) * gap;
  const lx = mcx - bowlSize / 2 - 22 - sideW;
  const rx = mcx + bowlSize / 2 + 22;
  // (the right block sits 0.01 lower so each side forms its own row for re-centring)
  for (const [x0, dy] of [
    [lx, 0],
    [rx, 0.01],
  ])
    for (let r = 0; r < sideRows; r++)
      for (let k = 0; k < cols; k++)
        tubs.push({ x: x0 + k * (tub + gap), y: colY + r * (tub + gap) + dy, w: tub, h: tub });
  for (let i = 0; i < 6; i++) tubs.push({ x: rowX + i * (tub + gap), y: botY, w: tub, h: tub });
  // trays at the left
  const trays: Rect[] = [];
  const trX = m;
  const trY = wallH + 16;
  for (let i = 0; i < 4; i++)
    trays.push({
      x: trX + (i % trCols) * (trW + 14),
      y: trY + Math.floor(i / trCols) * (trH + 12),
      w: trW,
      h: trH,
    });
  const trRows = Math.ceil(4 / trCols);
  const thickChips = narrow
    ? { x: trX, y: trY + trRows * (trH + 12) + 2, w: traysW, h: 3 * 34 + 8 }
    : { x: trX, y: trY + trRows * (trH + 12) + 2, w: traysW, h: 44 };
  // pots at the right
  const pots: Rect[] = [];
  const px0 = W - m - potsW;
  const py0 = wallH + 10;
  for (let i = 0; i < 10; i++)
    pots.push({
      x: px0 + (i % 2) * (pot + pgap),
      y: py0 + Math.floor(i / 2) * (pot + pgap),
      w: pot,
      h: pot,
    });
  const propsY = thickChips.y + thickChips.h + 18;
  if (twoCol) {
    // gauge and trash share the left column under the noodle trays
    const gh = Math.min(270, H - 16 - propsY);
    const gauge = { x: m + 8, y: propsY, w: gaugeW, h: gh };
    const trash = { x: m + 8 + gaugeW + 36, y: propsY + gh - 90, w: trashW, h: 84 };
    return { bowl, shelf, trays, thickChips, pots, tubs, gauge, trash, wallH, props: [] };
  }
  // gauge between the trays and the left tub column
  const gauge = { x: lx - 20 - gaugeW, y: bowlY - 135, w: gaugeW, h: 270 };
  // trash between the right tub column and the pots
  const trash = narrow
    ? { x: trX + (traysW - trashW) / 2, y: thickChips.y + thickChips.h + 16, w: trashW, h: 84 }
    : { x: rx + sideW + 26, y: bowlY + 40, w: trashW, h: 84 };
  const props: Rect[] = narrow
    ? []
    : [{ x: m, y: propsY, w: Math.max(0, gauge.x - 16 - m), h: H - propsY - 16 }];
  return { bowl, shelf, trays, thickChips, pots, tubs, gauge, trash, wallH, props };
}

function portrait(W: number, H: number): PrepLayout {
  const cx = W / 2;
  // tall phones: a taller wall leaves room for the order ticket on the rail
  const wallH = Math.max(170, Math.min(340, H - 1120));
  const tub = H > 1300 ? 108 : 88;
  const gap = 8;
  const slotSp = Math.min(104, (W - 80) / 6);
  const shelfW = 6 * slotSp + 16;
  const shelf = {
    x: cx - shelfW / 2,
    y: wallH - 18,
    w: shelfW,
    h: 14,
    slots: Array.from({ length: 6 }, (_, i) => ({ x: cx - (2.5 - i) * slotSp, y: wallH - 52 })),
  };
  // trays: 4 in a row
  const trW = 110;
  const trH = 74;
  const trays: Rect[] = [];
  const trRow = 4 * trW + 3 * 12;
  const trX = cx - trRow / 2;
  const trY = wallH + 18;
  for (let i = 0; i < 4; i++) trays.push({ x: trX + i * (trW + 12), y: trY, w: trW, h: trH });
  const thickChips = { x: trX, y: trY + trH + 12, w: trRow, h: 42 };
  // tubs: 2 rows above the bowl, 1 below
  const rowW = 6 * tub + 5 * gap;
  const rowX = cx - rowW / 2;
  const r1 = thickChips.y + thickChips.h + 18;
  const r2 = r1 + tub + gap;
  const tubs: Rect[] = [];
  for (let i = 0; i < 6; i++) tubs.push({ x: rowX + i * (tub + gap), y: r1, w: tub, h: tub });
  for (let i = 0; i < 6; i++) tubs.push({ x: rowX + i * (tub + gap), y: r2, w: tub, h: tub });
  const bowlSize = 280;
  const bowlTop = r2 + tub + 34;
  const bowl = { x: cx, y: bowlTop + bowlSize / 2, size: bowlSize };
  const r3 = bowlTop + bowlSize + 32;
  for (let i = 0; i < 6; i++) tubs.push({ x: rowX + i * (tub + gap), y: r3, w: tub, h: tub });
  // pots: 2 rows × 5
  const pot = 100;
  const pgap = 12;
  const potRow = 5 * pot + 4 * pgap;
  const px0 = cx - potRow / 2;
  const py0 = r3 + tub + 20;
  const pots: Rect[] = [];
  for (let i = 0; i < 10; i++)
    pots.push({
      x: px0 + (i % 5) * (pot + pgap),
      y: py0 + Math.floor(i / 5) * (pot + pgap),
      w: pot,
      h: pot,
    });
  const gauge = { x: 34, y: bowl.y - 135, w: 64, h: 270 };
  const trash = { x: W - 34 - 66, y: bowl.y + 36, w: 66, h: 78 };
  const bottom = py0 + 2 * pot + pgap + 12;
  const props: Rect[] = [{ x: 30, y: bottom, w: W - 60, h: Math.max(0, H - bottom - 20) }];
  return { bowl, shelf, trays, thickChips, pots, tubs, gauge, trash, wallH, props };
}

// ---------------------------------------------------------------- background

export function drawPrepBack(
  c: Ctx,
  W: number,
  H: number,
  tod: Tod,
  t: number,
  L: PrepLayout
): void {
  void t;
  const s = sprite(
    `prep:back:${W}x${H}:${tod}:${L.tubs.length}-${L.trays.length}-${L.pots.length}`,
    W,
    H,
    (g) => paintBack(g, W, H, tod, L),
    2
  );
  c.save();
  blit(c, s, 0, 0, W, H);
  c.restore();
}

function paintBack(c: Ctx, W: number, H: number, tod: Tod, L: PrepLayout) {
  const landscapeMode = W >= H;
  // ---- counter: warm wood planks
  const plank = landscapeMode ? 78 : 86;
  const r = rng(77);
  c.fillStyle = PAL.wood;
  c.fillRect(0, 0, W, H);
  const rows = Math.ceil((H - L.wallH) / plank) + 1;
  for (let i = 0; i < rows; i++) {
    const y = L.wallH + i * plank;
    const tone = (r() - 0.5) * 0.08;
    const base = shade(PAL.wood, tone);
    const gg = c.createLinearGradient(0, y, 0, y + plank);
    gg.addColorStop(0, shade(PAL.wood, tone + 0.06));
    gg.addColorStop(0.5, base);
    gg.addColorStop(1, shade(PAL.wood, tone - 0.05));
    c.fillStyle = gg;
    c.fillRect(0, y, W, plank);
    // grain lines
    c.strokeStyle = 'rgba(110,75,50,0.16)';
    c.lineWidth = 1;
    const n = 7 + Math.floor(r() * 5);
    for (let k = 0; k < n; k++) {
      const gy = y + 6 + r() * (plank - 12);
      const amp = 1.5 + r() * 3;
      const len = 180 + r() * 500;
      const sx = r() * W - 100;
      c.beginPath();
      for (let x = sx; x < sx + len; x += 24) {
        const yy = gy + Math.sin(x * 0.012 + k) * amp;
        if (x === sx) c.moveTo(x, yy);
        else c.lineTo(x, yy);
      }
      c.stroke();
    }
    // occasional knot
    if (r() < 0.45) {
      const kx = r() * W;
      const ky = y + plank * (0.3 + r() * 0.4);
      c.strokeStyle = 'rgba(110,75,50,0.22)';
      for (let q = 0; q < 3; q++) {
        ellipse(c, kx, ky, 6 + q * 5, 3 + q * 2.4);
        c.stroke();
      }
    }
    // plank seam
    c.fillStyle = 'rgba(90,55,30,0.28)';
    c.fillRect(0, y + plank - 1.5, W, 2);
    c.fillStyle = 'rgba(255,240,220,0.18)';
    c.fillRect(0, y + plank + 0.5, W, 1);
    // seam breaks
    const bx = r() * W;
    c.fillStyle = 'rgba(90,55,30,0.28)';
    c.fillRect(bx, y, 2, plank);
  }
  speckle(c, 0, L.wallH, W, H - L.wallH, 9, 900, 'rgba(60,35,20,0.05)');
  speckle(c, 0, L.wallH, W, H - L.wallH, 10, 500, 'rgba(255,235,210,0.08)');
  // vignette on the counter
  const vg = c.createRadialGradient(
    W / 2,
    H * 0.55,
    Math.min(W, H) * 0.3,
    W / 2,
    H * 0.55,
    Math.max(W, H) * 0.75
  );
  vg.addColorStop(0, 'rgba(60,35,20,0)');
  vg.addColorStop(1, 'rgba(60,35,20,0.22)');
  c.fillStyle = vg;
  c.fillRect(0, L.wallH, W, H - L.wallH);

  // ---- tiled wall strip
  const wallH = L.wallH;
  c.fillStyle = PAL.cream;
  c.fillRect(0, 0, W, wallH);
  const tile = landscapeMode ? 50 : 56;
  const tr = rng(31);
  for (let ty = -tile / 2; ty < wallH; ty += tile) {
    const off = Math.round(ty / tile) % 2 === 0 ? 0 : tile / 2;
    for (let tx = -tile + off; tx < W + tile; tx += tile) {
      const v = tr();
      const col =
        v < 0.12
          ? mix(PAL.cream, PAL.sage, 0.3)
          : v < 0.2
            ? mix(PAL.cream, PAL.blush, 0.25)
            : mix(PAL.cream, PAL.paper, v);
      const tg = c.createLinearGradient(tx, ty, tx, ty + tile);
      tg.addColorStop(0, '#fffdf8');
      tg.addColorStop(1, col);
      c.fillStyle = tg;
      roundRect(c, tx + 1.5, ty + 1.5, tile - 3, tile - 3, 4);
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)';
      roundRect(c, tx + 4, ty + 4, tile - 8, 5, 3);
      c.fill();
    }
  }
  // grout
  c.strokeStyle = 'rgba(190,160,130,0.45)';
  c.lineWidth = 1.2;
  for (let ty = -tile / 2; ty < wallH; ty += tile) {
    c.beginPath();
    c.moveTo(0, ty);
    c.lineTo(W, ty);
    c.stroke();
  }
  // wall shadow onto the counter + skirting
  const sg = c.createLinearGradient(0, wallH - 6, 0, wallH + 40);
  sg.addColorStop(0, 'rgba(60,35,20,0.35)');
  sg.addColorStop(1, 'rgba(60,35,20,0)');
  c.fillStyle = sg;
  c.fillRect(0, wallH - 6, W, 46);
  c.fillStyle = PAL.walnut;
  c.fillRect(0, wallH - 8, W, 10);
  c.fillStyle = shade(PAL.walnut, 0.25);
  c.fillRect(0, wallH - 8, W, 2);

  // ---- shelf
  const sh = L.shelf;
  // shadow under shelf on the wall
  const shg = c.createLinearGradient(0, sh.y + sh.h, 0, sh.y + sh.h + 26);
  shg.addColorStop(0, 'rgba(60,35,20,0.28)');
  shg.addColorStop(1, 'rgba(60,35,20,0)');
  c.fillStyle = shg;
  c.fillRect(sh.x - 6, sh.y + sh.h, sh.w + 12, 26);
  // brackets
  for (const bx of [sh.x + 26, sh.x + sh.w - 26]) {
    c.fillStyle = PAL.woodDark;
    c.beginPath();
    c.moveTo(bx - 7, sh.y + sh.h);
    c.lineTo(bx + 7, sh.y + sh.h);
    c.lineTo(bx + 2, sh.y + sh.h + 22);
    c.lineTo(bx - 2, sh.y + sh.h + 22);
    c.closePath();
    c.fill();
  }
  // board
  c.fillStyle = vGrad(c, sh.y, sh.y + sh.h, shade(PAL.wood, 0.18), PAL.woodDark);
  roundRect(c, sh.x, sh.y, sh.w, sh.h, 4);
  c.fill();
  c.fillStyle = 'rgba(255,245,225,0.35)';
  roundRect(c, sh.x + 2, sh.y + 1, sh.w - 4, 3, 2);
  c.fill();
  c.strokeStyle = 'rgba(110,75,50,0.25)';
  c.lineWidth = 1;
  for (let k = 0; k < 4; k++) {
    c.beginPath();
    c.moveTo(sh.x + 12 + k * 7, sh.y + 5 + k * 2.3);
    c.lineTo(sh.x + sh.w - 30 - k * 11, sh.y + 5 + k * 2.3);
    c.stroke();
  }
  // soft shadow under each shelf slot (bowl stands here)
  for (const sl of sh.slots) softShadow(c, sl.x, sh.y + 2, 40, 7, 0.28);

  // ---- slot coasters
  for (const tb of L.tubs) coaster(c, tb.x, tb.y, tb.w, tb.h, 20, 'square');
  for (const tr of L.trays) coaster(c, tr.x, tr.y, tr.w, tr.h, 16, 'square');
  for (const p of L.pots) coaster(c, p.x, p.y, p.w, p.h, p.w / 2, 'round');
  // thickness chips backing: a little paper strip
  {
    const ch = L.thickChips;
    softShadow(c, ch.x + ch.w / 2, ch.y + ch.h / 2 + 4, ch.w * 0.55, ch.h * 0.7, 0.2);
    c.fillStyle = PAL.paper;
    roundRect(c, ch.x, ch.y, ch.w, ch.h, ch.h / 2);
    c.fill();
    c.strokeStyle = 'rgba(60,35,20,0.18)';
    c.lineWidth = 1.2;
    c.stroke();
  }

  // ---- gauge wooden backing
  {
    const g = L.gauge;
    softShadow(c, g.x + g.w / 2, g.y + g.h / 2 + 8, g.w * 0.9, g.h * 0.55, 0.26);
    c.fillStyle = vGrad(c, g.y, g.y + g.h, shade(PAL.latte, 0.12), PAL.latte);
    roundRect(c, g.x - 8, g.y - 14, g.w + 16, g.h + 28, 16);
    c.fill();
    c.strokeStyle = 'rgba(60,35,20,0.22)';
    c.lineWidth = 1.5;
    c.stroke();
    // two tiny nails
    for (const ny of [g.y - 4, g.y + g.h + 4]) {
      c.fillStyle = PAL.inkSoft;
      circle(c, g.x + g.w / 2, ny, 2.2);
      c.fill();
    }
  }

  // ---- trash bin
  drawBin(c, L.trash);

  // ---- props
  for (const area of L.props) drawProps(c, area, landscapeMode);

  // ---- time of day tint & lamp
  const tl = TOD_LIGHT[tod];
  if (tl.alpha > 0) {
    c.fillStyle = rgba(tl.tint, tl.alpha);
    c.fillRect(0, 0, W, H);
  }
  if (tl.lamp > 0) {
    const lg = c.createRadialGradient(
      W / 2,
      L.bowl.y - 80,
      40,
      W / 2,
      L.bowl.y - 80,
      Math.max(W, H) * 0.65
    );
    lg.addColorStop(0, `rgba(255,214,150,${0.32 * tl.lamp})`);
    lg.addColorStop(0.5, `rgba(255,200,130,${0.12 * tl.lamp})`);
    lg.addColorStop(1, 'rgba(255,200,130,0)');
    c.fillStyle = lg;
    c.fillRect(0, 0, W, H);
  }
}

/** A lighter rounded "placemat" with inner shadow so an empty slot reads as a slot. */
function coaster(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
  kind: 'square' | 'round'
) {
  const path = () => {
    if (kind === 'round') circle(c, x + w / 2, y + h / 2, w / 2 - 2);
    else roundRect(c, x, y, w, h, rad);
  };
  // drop shadow
  softShadow(c, x + w / 2, y + h / 2 + 5, w * 0.62, h * 0.62, 0.2);
  c.save();
  path();
  c.fillStyle = vGrad(c, y, y + h, shade(PAL.sand, 0.12), shade(PAL.sand, -0.06));
  c.fill();
  c.clip();
  // inner shadow: dark along top-left, light along bottom-right
  const ig = c.createLinearGradient(x, y, x + w * 0.4, y + h * 0.5);
  ig.addColorStop(0, 'rgba(90,55,30,0.28)');
  ig.addColorStop(1, 'rgba(90,55,30,0)');
  c.fillStyle = ig;
  path();
  c.fill();
  const lg = c.createLinearGradient(x + w, y + h, x + w * 0.55, y + h * 0.5);
  lg.addColorStop(0, 'rgba(255,248,235,0.5)');
  lg.addColorStop(1, 'rgba(255,248,235,0)');
  c.fillStyle = lg;
  path();
  c.fill();
  // woven texture: faint cross lines (cork mat)
  c.strokeStyle = 'rgba(120,85,55,0.10)';
  c.lineWidth = 1;
  const step = 7;
  for (let k = -h; k < w; k += step) {
    c.beginPath();
    c.moveTo(x + k, y);
    c.lineTo(x + k + h, y + h);
    c.stroke();
  }
  speckle(c, x, y, w, h, Math.round(x * 7 + y), 50, 'rgba(90,55,30,0.08)');
  c.restore();
  c.strokeStyle = 'rgba(60,35,20,0.22)';
  c.lineWidth = 1.5;
  path();
  c.stroke();
}

function drawBin(c: Ctx, r: Rect) {
  const cx = r.x + r.w / 2;
  const top = r.y + r.h * 0.2;
  softShadow(c, cx, r.y + r.h - 2, r.w * 0.7, r.w * 0.22, 0.3);
  // body (slightly tapered)
  c.beginPath();
  c.moveTo(r.x + 4, top);
  c.lineTo(r.x + r.w - 4, top);
  c.lineTo(r.x + r.w - 9, r.y + r.h - 6);
  c.lineTo(r.x + 9, r.y + r.h - 6);
  c.closePath();
  const bg = c.createLinearGradient(r.x, 0, r.x + r.w, 0);
  bg.addColorStop(0, shade(PAL.indigo, -0.1));
  bg.addColorStop(0.35, shade(PAL.indigo, 0.35));
  bg.addColorStop(0.7, PAL.indigo);
  bg.addColorStop(1, shade(PAL.indigo, -0.25));
  c.fillStyle = bg;
  c.fill();
  // ribs
  c.strokeStyle = 'rgba(255,255,255,0.14)';
  c.lineWidth = 2;
  for (let k = 1; k <= 3; k++) {
    const yy = top + (r.h * 0.8 - 6) * (k / 4);
    c.beginPath();
    c.moveTo(r.x + 5 + k * 1.2, yy);
    c.lineTo(r.x + r.w - 5 - k * 1.2, yy);
    c.stroke();
  }
  // bottom curve
  ellipse(c, cx, r.y + r.h - 6, r.w / 2 - 9, 4);
  c.fillStyle = shade(PAL.indigo, -0.3);
  c.fill();
  // rim + opening
  ellipse(c, cx, top, r.w / 2 - 2, r.h * 0.17);
  c.fillStyle = shade(PAL.indigo, 0.2);
  c.fill();
  c.strokeStyle = 'rgba(30,25,45,0.4)';
  c.lineWidth = 1.5;
  c.stroke();
  ellipse(c, cx, top + 1, r.w / 2 - 8, r.h * 0.12);
  c.fillStyle = '#2a2740';
  c.fill();
  // small paper scrap peeking
  c.fillStyle = PAL.paper;
  c.beginPath();
  c.moveTo(cx - 8, top + 2);
  c.lineTo(cx + 2, top - 3);
  c.lineTo(cx + 9, top + 3);
  c.closePath();
  c.fill();
  // label tag
  c.fillStyle = PAL.paper;
  roundRect(c, cx - 11, top + r.h * 0.33, 22, 12, 3);
  c.fill();
  c.strokeStyle = 'rgba(60,35,20,0.2)';
  c.lineWidth = 1;
  c.stroke();
  c.fillStyle = PAL.coral;
  c.fillRect(cx - 5, top + r.h * 0.33 + 5, 10, 2);
}

function drawProps(c: Ctx, a: Rect, landscapeMode: boolean) {
  if (a.w < 120 || a.h < 90) return;
  if (landscapeMode) {
    // cutting board with knife, towel, chopsticks cup stacked in the left-bottom corner
    const bw = Math.min(170, a.w - 10);
    const bh = Math.min(118, a.h * 0.46);
    board(c, a.x + 4, a.y + 6, bw, bh, -0.06);
    const ty = a.y + bh + 34;
    if (ty + 70 < a.y + a.h) towel(c, a.x + 10, ty, Math.min(120, a.w - 90), 62);
    if (ty + 80 < a.y + a.h) cup(c, a.x + Math.min(a.w - 36, 150), ty + 36, 30);
  } else {
    // a row: board, towel, cup
    const bw = Math.min(230, a.w * 0.42);
    const bh = Math.min(120, a.h - 10);
    board(c, a.x + 10, a.y + 6, bw, bh, -0.04);
    towel(c, a.x + bw + 60, a.y + 24, Math.min(170, a.w - bw - 170), Math.min(72, bh - 20));
    cup(c, a.x + a.w - 60, a.y + bh * 0.55, 32);
  }
}

function board(c: Ctx, x: number, y: number, w: number, h: number, rot: number) {
  c.save();
  c.translate(x + w / 2, y + h / 2);
  c.rotate(rot);
  softShadow(c, 0, 8, w * 0.6, h * 0.5, 0.3);
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, shade(PAL.latte, 0.1));
  g.addColorStop(1, shade(PAL.latte, -0.14));
  c.fillStyle = g;
  roundRect(c, -w / 2, -h / 2, w, h, 14);
  c.fill();
  // handle hole
  c.fillStyle = 'rgba(60,35,20,0.4)';
  circle(c, w / 2 - 16, 0, 5);
  c.fill();
  // grain
  c.strokeStyle = 'rgba(120,80,50,0.22)';
  c.lineWidth = 1;
  const r = rng(5);
  for (let k = 0; k < 9; k++) {
    const yy = -h / 2 + 10 + r() * (h - 20);
    c.beginPath();
    c.moveTo(-w / 2 + 8, yy);
    c.bezierCurveTo(
      -w / 6,
      yy + (r() - 0.5) * 6,
      w / 6,
      yy + (r() - 0.5) * 6,
      w / 2 - 28,
      yy + (r() - 0.5) * 4
    );
    c.stroke();
  }
  c.strokeStyle = 'rgba(60,35,20,0.25)';
  c.lineWidth = 1.5;
  roundRect(c, -w / 2, -h / 2, w, h, 14);
  c.stroke();
  // knife
  c.save();
  c.translate(-w * 0.1, -h * 0.05);
  c.rotate(0.28);
  const kl = w * 0.62;
  // blade
  c.beginPath();
  c.moveTo(-kl / 2, -5);
  c.lineTo(kl * 0.12, -5);
  c.lineTo(kl * 0.12, 7);
  c.quadraticCurveTo(-kl * 0.3, 9, -kl / 2, 0);
  c.closePath();
  const bg = c.createLinearGradient(0, -5, 0, 8);
  bg.addColorStop(0, '#f4f2ee');
  bg.addColorStop(0.5, '#cfcbc4');
  bg.addColorStop(1, '#e9e6e0');
  c.fillStyle = bg;
  c.fill();
  c.strokeStyle = 'rgba(60,35,20,0.3)';
  c.lineWidth = 1;
  c.stroke();
  // handle
  roundRect(c, kl * 0.12, -4, kl * 0.36, 9, 4);
  c.fillStyle = vGrad(c, -4, 5, PAL.walnut, shade(PAL.walnut, -0.3));
  c.fill();
  c.fillStyle = PAL.honey;
  c.fillRect(kl * 0.12 + 3, -4, 3, 9);
  c.restore();
  c.restore();
}

function towel(c: Ctx, x: number, y: number, w: number, h: number) {
  c.save();
  softShadow(c, x + w / 2, y + h / 2 + 6, w * 0.58, h * 0.55, 0.28);
  // folded cloth: two layers
  const col = PAL.sky;
  const draw = (ox: number, oy: number, ww: number, hh: number, light: number) => {
    roundRect(c, x + ox, y + oy, ww, hh, 8);
    c.fillStyle = vGrad(c, y + oy, y + oy + hh, shade(col, light + 0.12), shade(col, light - 0.02));
    c.fill();
    c.save();
    c.clip();
    c.strokeStyle = 'rgba(85,98,138,0.28)';
    c.lineWidth = 3;
    for (let k = 0; k < 4; k++) {
      const yy = y + oy + hh * (0.2 + k * 0.2);
      c.beginPath();
      c.moveTo(x + ox, yy);
      c.lineTo(x + ox + ww, yy);
      c.stroke();
    }
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 1;
    for (let k = 0; k < ww; k += 5) {
      c.beginPath();
      c.moveTo(x + ox + k, y + oy);
      c.lineTo(x + ox + k, y + oy + hh);
      c.stroke();
    }
    c.restore();
    c.strokeStyle = 'rgba(60,35,20,0.2)';
    c.lineWidth = 1.2;
    c.stroke();
  };
  draw(0, 0, w, h, -0.04);
  draw(6, -8, w - 14, h * 0.62, 0.08);
  c.restore();
}

function cup(c: Ctx, x: number, y: number, r: number) {
  c.save();
  softShadow(c, x, y + r * 0.9, r * 1.2, r * 0.5, 0.3);
  // chopsticks fanned out (drawn before the cup top)
  const rr = rng(21);
  c.lineCap = 'round';
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI / 2 + (k - 3) * 0.16 + (rr() - 0.5) * 0.08;
    const len = r * 2.1 + rr() * r * 0.4;
    c.strokeStyle = k % 3 === 0 ? PAL.tomato : k % 3 === 1 ? PAL.woodDark : PAL.walnut;
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r * 0.2, y + Math.sin(a) * r * 0.2);
    c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    c.stroke();
  }
  // cup body
  const g = c.createLinearGradient(x - r, 0, x + r, 0);
  g.addColorStop(0, shade(PAL.matcha, -0.1));
  g.addColorStop(0.4, shade(PAL.matcha, 0.3));
  g.addColorStop(1, shade(PAL.matcha, -0.2));
  c.fillStyle = g;
  roundRect(c, x - r, y - r * 0.3, r * 2, r * 1.25, r * 0.35);
  c.fill();
  c.strokeStyle = 'rgba(60,35,20,0.25)';
  c.lineWidth = 1.5;
  c.stroke();
  ellipse(c, x, y - r * 0.3, r, r * 0.38);
  c.fillStyle = shade(PAL.matcha, 0.15);
  c.fill();
  c.stroke();
  ellipse(c, x, y - r * 0.3, r * 0.82, r * 0.28);
  c.fillStyle = 'rgba(50,60,40,0.55)';
  c.fill();
  gloss(c, x - r * 0.45, y + r * 0.2, r * 0.45, 0.35);
  c.restore();
}

// ---------------------------------------------------------------- locked cover

export function drawSlotLocked(c: Ctx, x: number, y: number, w: number, h: number): void {
  const s = sprite(`prep:lock:${Math.round(w)}x${Math.round(h)}`, w + 16, h + 16, (g) => {
    g.translate(8, 8);
    // cloth draped over the slot: a rounded square with wavy bottom edge
    g.beginPath();
    g.moveTo(2, 8);
    g.quadraticCurveTo(2, 0, 10, 0);
    g.lineTo(w - 10, 0);
    g.quadraticCurveTo(w - 2, 0, w - 2, 8);
    g.lineTo(w + 2, h - 10);
    const n = 4;
    for (let i = 0; i <= n; i++) {
      const px = w + 2 - ((w + 4) / n) * i;
      const py = h - 4 + (i % 2 === 0 ? 4 : -2);
      g.quadraticCurveTo(px + (w + 4) / n / 2, h + 5, px, py);
    }
    g.lineTo(-2, h - 10);
    g.closePath();
    g.shadowColor = 'rgba(60,35,20,0.35)';
    g.shadowBlur = 8;
    g.shadowOffsetY = 4;
    const cg = g.createLinearGradient(0, 0, 0, h);
    cg.addColorStop(0, shade(PAL.sage, 0.28));
    cg.addColorStop(1, shade(PAL.sage, -0.04));
    g.fillStyle = cg;
    g.fill();
    g.shadowColor = 'transparent';
    g.save();
    g.clip();
    // gingham
    g.fillStyle = 'rgba(111,143,102,0.16)';
    const st = Math.max(8, w / 9);
    for (let k = -st; k < w + st; k += st * 2) g.fillRect(k, -4, st, h + 12);
    for (let k = -st; k < h + st; k += st * 2) g.fillRect(-4, k, w + 12, st);
    // folds
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.moveTo(w * (0.25 + k * 0.25), 2);
      g.quadraticCurveTo(w * (0.22 + k * 0.25) + 6, h / 2, w * (0.25 + k * 0.25) - 4, h);
      g.stroke();
    }
    const shd = g.createLinearGradient(0, 0, 0, h);
    shd.addColorStop(0, 'rgba(60,35,20,0)');
    shd.addColorStop(1, 'rgba(60,35,20,0.18)');
    g.fillStyle = shd;
    g.fillRect(-4, 0, w + 8, h + 8);
    g.restore();
    g.strokeStyle = 'rgba(60,35,20,0.22)';
    g.lineWidth = 1.5;
    g.stroke();
    // lock badge
    const bx = w / 2;
    const by = h / 2 + 2;
    const br = Math.min(w, h) * 0.2;
    softShadow(g, bx, by + 3, br * 1.3, br * 0.8, 0.3);
    g.fillStyle = vGrad(g, by - br, by + br, '#fff0c2', PAL.honey);
    circle(g, bx, by, br);
    g.fill();
    g.strokeStyle = 'rgba(120,70,20,0.4)';
    g.lineWidth = 1.5;
    g.stroke();
    // padlock
    const lw = br * 0.9;
    const lh = br * 0.7;
    g.strokeStyle = shade(PAL.walnut, -0.1);
    g.lineWidth = Math.max(2, br * 0.18);
    g.beginPath();
    g.arc(bx, by - lh * 0.35, lw * 0.32, Math.PI, 0);
    g.stroke();
    g.fillStyle = shade(PAL.walnut, -0.1);
    roundRect(g, bx - lw / 2, by - lh * 0.3, lw, lh, lw * 0.18);
    g.fill();
    g.fillStyle = PAL.butter;
    circle(g, bx, by + lh * 0.05, lw * 0.11);
    g.fill();
  });
  c.save();
  blit(c, s, x - 8, y - 8, w + 16, h + 16);
  c.restore();
}

// ---------------------------------------------------------------- gauge

export function drawGauge(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number,
  color: string,
  target: [number, number]
): void {
  c.save();
  const tubeW = Math.min(28, w * 0.45);
  const tx = x + 6;
  const ty = y + 10;
  const th = h - 20;
  const MAXV = 1.2;
  const yOf = (v: number) => ty + th - (clamp(v, 0, MAXV) / MAXV) * th;
  // glass tube back
  roundRect(c, tx, ty, tubeW, th, tubeW / 2);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fill();
  c.save();
  c.clip();
  // overflow zone (above 1.0): faint red
  c.fillStyle = rgba(PAL.tomato, 0.14);
  c.fillRect(tx, ty, tubeW, yOf(1) - ty);
  // ideal band
  c.fillStyle = rgba(PAL.moss, 0.22);
  c.fillRect(tx, yOf(target[1]), tubeW, yOf(target[0]) - yOf(target[1]));
  // liquid
  const f = clamp(fill, 0, MAXV);
  if (f > 0.001) {
    const ly = yOf(f);
    const lg = c.createLinearGradient(tx, 0, tx + tubeW, 0);
    lg.addColorStop(0, shade(color, -0.15));
    lg.addColorStop(0.35, shade(color, 0.2));
    lg.addColorStop(1, shade(color, -0.2));
    c.fillStyle = lg;
    c.fillRect(tx, ly, tubeW, ty + th - ly + 2);
    // meniscus
    ellipse(c, tx + tubeW / 2, ly, tubeW / 2, 3);
    c.fillStyle = shade(color, 0.35);
    c.fill();
    // bubbles
    c.fillStyle = 'rgba(255,255,255,0.35)';
    circle(c, tx + tubeW * 0.3, ly + 14, 1.8);
    c.fill();
    circle(c, tx + tubeW * 0.62, ly + 26, 1.2);
    c.fill();
  }
  // glass shine
  c.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(c, tx + 3, ty + 6, tubeW * 0.18, th - 12, 3);
  c.fill();
  c.restore();
  // overflow: liquid spilling over the top
  if (fill > 1.0) {
    const spill = clamp((fill - 1) / 0.2, 0, 1);
    c.fillStyle = shade(color, 0.1);
    ellipse(c, tx + tubeW / 2, ty - 2, tubeW / 2 + 4 + spill * 4, 4 + spill * 3);
    c.fill();
    // drips
    for (const dx of [-0.35, 0.3]) {
      const dl = 6 + spill * 14;
      c.beginPath();
      c.moveTo(tx + tubeW / 2 + dx * tubeW - 2.5, ty);
      c.lineTo(tx + tubeW / 2 + dx * tubeW + 2.5, ty);
      c.lineTo(tx + tubeW / 2 + dx * tubeW, ty + dl);
      c.closePath();
      c.fill();
    }
  }
  // tube rim
  c.strokeStyle = 'rgba(60,35,20,0.3)';
  c.lineWidth = 1.5;
  roundRect(c, tx, ty, tubeW, th, tubeW / 2);
  c.stroke();
  // ticks + labels on the right
  const lx = tx + tubeW + 4;
  c.strokeStyle = 'rgba(60,35,20,0.4)';
  c.lineWidth = 1.2;
  for (let v = 0; v <= 1.2001; v += 0.1) {
    const yy = yOf(v);
    const major = Math.abs(v - Math.round(v)) < 0.01 || Math.abs(v - 0.5) < 0.01;
    c.beginPath();
    c.moveTo(lx, yy);
    c.lineTo(lx + (major ? 7 : 4), yy);
    c.stroke();
  }
  // target bracket
  c.strokeStyle = PAL.moss;
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(lx + 9, yOf(target[1]));
  c.lineTo(lx + 9, yOf(target[0]));
  c.stroke();
  const fs = Math.max(9, Math.min(11, w * 0.17));
  const gl = PREP_LABELS.gauge ?? ['az', 'tam', 'taşma'];
  label(c, gl[2], lx + 12, yOf(1.12), fs, PAL.tomato, 800, 'left');
  label(c, gl[1], lx + 12, yOf(1.0) + 1, fs, PAL.ink, 800, 'left');
  label(c, gl[0], lx + 12, yOf(0.3), fs, PAL.inkSoft, 800, 'left');
  c.restore();
}

// ---------------------------------------------------------------- cook ring

const COOK_ZONES: { to: number; name: string; col: string }[] = [
  { to: 40, name: 'Çiğ', col: '#efe4d3' },
  { to: 58, name: 'Diri', col: PAL.matcha },
  { to: 82, name: 'Tam kıvam', col: PAL.honey },
  { to: 102, name: 'Yumuşak', col: PAL.coral },
  { to: 120, name: 'Lapa', col: PAL.tomato },
];

/** Optional translated labels the game can set: cook zones (5) and gauge (az/tam/taşma). */
export const PREP_LABELS = {
  zones: null as string[] | null,
  gauge: null as [string, string, string] | null,
};

export function cookLabel(progress: number): string {
  for (let i = 0; i < COOK_ZONES.length; i++)
    if (progress < COOK_ZONES[i].to) return PREP_LABELS.zones?.[i] ?? COOK_ZONES[i].name;
  return 'Lapa';
}

const RING_START = Math.PI * 0.75; // bottom-left
const RING_SWEEP = Math.PI * 1.5;
const angOf = (p: number) => RING_START + (clamp(p, 0, 120) / 120) * RING_SWEEP;

export function drawCookRing(c: Ctx, x: number, y: number, r: number, progress: number): void {
  const R = Math.round(r);
  const face = sprite(`prep:ring:${R}`, R * 2.3, R * 2.3, (g) => {
    const cx = R * 1.15;
    const cy = R * 1.15;
    // shadow + wooden rim
    g.shadowColor = 'rgba(60,35,20,0.35)';
    g.shadowBlur = R * 0.18;
    g.shadowOffsetY = R * 0.06;
    circle(g, cx, cy, R);
    g.fillStyle = vGrad(g, cy - R, cy + R, shade(PAL.wood, 0.12), PAL.woodDark);
    g.fill();
    g.shadowColor = 'transparent';
    // grain on rim
    g.strokeStyle = 'rgba(110,75,50,0.25)';
    g.lineWidth = 1;
    for (let k = 0; k < 10; k++) {
      circle(g, cx, cy, R * (0.9 + (k % 3) * 0.028));
      g.stroke();
    }
    // cream face
    circle(g, cx, cy, R * 0.86);
    g.fillStyle = vGrad(g, cy - R, cy + R, PAL.cream, PAL.paper);
    g.fill();
    g.strokeStyle = 'rgba(60,35,20,0.25)';
    g.lineWidth = 1.5;
    g.stroke();
    speckle(g, cx - R, cy - R, R * 2, R * 2, 3, 120, 'rgba(60,35,20,0.04)');
    // zones
    const ro = R * 0.78;
    const ri = R * 0.58;
    let from = 0;
    for (const z of COOK_ZONES) {
      const a0 = angOf(from) + 0.012;
      const a1 = angOf(z.to) - 0.012;
      g.beginPath();
      g.arc(cx, cy, ro, a0, a1);
      g.arc(cx, cy, ri, a1, a0, true);
      g.closePath();
      const zg = g.createRadialGradient(cx, cy, ri, cx, cy, ro);
      zg.addColorStop(0, shade(z.col, 0.22));
      zg.addColorStop(1, shade(z.col, -0.04));
      g.fillStyle = zg;
      g.fill();
      g.strokeStyle = 'rgba(60,35,20,0.18)';
      g.lineWidth = 1;
      g.stroke();
      from = z.to;
    }
    // ticks
    g.strokeStyle = 'rgba(60,35,20,0.35)';
    for (let p = 0; p <= 120; p += 10) {
      const a = angOf(p);
      const major = p % 20 === 0;
      g.lineWidth = major ? 1.6 : 1;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * (ro + 2), cy + Math.sin(a) * (ro + 2));
      g.lineTo(
        cx + Math.cos(a) * (ro + (major ? 7 : 4)),
        cy + Math.sin(a) * (ro + (major ? 7 : 4))
      );
      g.stroke();
    }
    // tiny icons: a droplet at start (raw), a star at ideal middle
    const mid = angOf(70);
    g.fillStyle = PAL.honey;
    const sx = cx + Math.cos(mid) * (ro + 13);
    const sy = cy + Math.sin(mid) * (ro + 13);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2;
      const rr = i % 2 === 0 ? R * 0.07 : R * 0.03;
      const px = sx + Math.cos(a) * rr;
      const py = sy + Math.sin(a) * rr;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
    // inner glossy dish
    circle(g, cx, cy, ri - 3);
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.fill();
    gloss(g, cx - R * 0.25, cy - R * 0.3, R * 0.35, 0.35);
  });
  c.save();
  blit(c, face, x - R * 1.15, y - R * 1.15, R * 2.3, R * 2.3);
  // needle
  const a = angOf(progress);
  const ro = R * 0.78;
  const ri = R * 0.58;
  c.save();
  c.translate(x, y);
  c.rotate(a);
  c.fillStyle = 'rgba(60,35,20,0.25)';
  roundRect(c, ri - 8, -3 + 2, ro - ri + 16, 6, 3);
  c.fill();
  c.fillStyle = vGrad(c, -4, 4, shade(PAL.walnut, 0.25), PAL.walnut);
  roundRect(c, ri - 8, -3.5, ro - ri + 16, 7, 3.5);
  c.fill();
  c.fillStyle = PAL.cream;
  circle(c, ro + 4, 0, 2.2);
  c.fill();
  c.restore();
  // centre knob
  softShadow(c, x, y + 3, R * 0.14, R * 0.09, 0.3);
  circle(c, x, y - R * 0.18, R * 0.08);
  c.fillStyle = vGrad(c, y - R * 0.26, y - R * 0.1, shade(PAL.walnut, 0.3), PAL.walnut);
  c.fill();
  // zone label
  const name = cookLabel(progress);
  const zone = COOK_ZONES.find((z) => progress < z.to) ?? COOK_ZONES[4];
  const fs = Math.max(10, R * (name.length > 6 ? 0.16 : 0.2));
  c.font = `800 ${fs}px ${FONT_DISPLAY}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = 'rgba(60,35,20,0.12)';
  c.fillText(name, x, y + R * 0.12 + 1.5);
  c.fillStyle = mix(zone.col, PAL.ink, 0.45);
  c.fillText(name, x, y + R * 0.12);
  c.restore();
}

// ---------------------------------------------------------------- pointer hint

export function drawPointerHint(c: Ctx, x: number, y: number, t: number): void {
  const hand = sprite('prep:hand', 64, 72, (g) => {
    g.translate(32, 36);
    g.shadowColor = 'rgba(60,35,20,0.3)';
    g.shadowBlur = 6;
    g.shadowOffsetY = 3;
    const skin = '#f7cfb3';
    const line = 'rgba(120,70,45,0.45)';
    g.fillStyle = skin;
    g.strokeStyle = line;
    g.lineWidth = 1.6;
    g.lineJoin = 'round';
    // palm + curled fingers
    g.beginPath();
    g.moveTo(-6, -4);
    g.lineTo(-6, 18);
    g.quadraticCurveTo(-6, 30, 6, 30);
    g.lineTo(14, 30);
    g.quadraticCurveTo(24, 30, 24, 20);
    g.lineTo(24, 2);
    g.quadraticCurveTo(24, -4, 18, -4);
    g.closePath();
    g.fill();
    g.stroke();
    g.shadowColor = 'transparent';
    // finger separations
    g.strokeStyle = 'rgba(120,70,45,0.3)';
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.moveTo(2 + k * 7, 2 + k * 2);
      g.lineTo(2 + k * 7, 26);
      g.stroke();
    }
    // index finger pointing up
    g.fillStyle = skin;
    g.strokeStyle = line;
    roundRect(g, -6, -30, 12, 32, 6);
    g.fill();
    g.stroke();
    // thumb
    g.beginPath();
    g.moveTo(-6, 6);
    g.quadraticCurveTo(-20, 2, -16, 14);
    g.quadraticCurveTo(-13, 20, -6, 18);
    g.closePath();
    g.fill();
    g.stroke();
    // nail
    g.fillStyle = 'rgba(255,255,255,0.6)';
    roundRect(g, -3.5, -29, 7, 7, 3);
    g.fill();
    // sleeve
    g.fillStyle = PAL.coral;
    roundRect(g, -8, 26, 34, 10, 4);
    g.fill();
    g.strokeStyle = 'rgba(60,35,20,0.25)';
    g.stroke();
  });
  c.save();
  const bob = Math.sin(t * 5);
  const press = Math.max(0, -bob); // 0..1 at tap
  // pulsing ring at the target
  const ph = (t * 1.1) % 1;
  c.strokeStyle = `rgba(239,138,118,${0.7 * (1 - ph)})`;
  c.lineWidth = 3;
  circle(c, x, y, 10 + ph * 26);
  c.stroke();
  c.fillStyle = `rgba(239,138,118,${0.35 - press * 0.1})`;
  circle(c, x, y, 9 + press * 3);
  c.fill();
  // hand: fingertip sits at (x,y) when pressing, lifted otherwise
  const lift = (1 - press) * 14;
  blit(c, hand, x - 32, y - 6 + lift, 64, 72);
  c.restore();
}
