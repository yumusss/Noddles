// One screen, no swiping: the window with the customer on top, the work table below.
// Every position is computed from the logical screen size (short side = 720).

import type { IngId, PlateId } from '../game/data';
import type { Box } from './kit';

export interface Tray {
  ing: IngId;
  x: number;
  y: number;
  s: number;
}
export interface Tool {
  id: 'mat' | 'knife' | 'torch';
  x: number;
  y: number;
  s: number;
}

export interface Layout {
  W: number;
  H: number;
  portrait: boolean;
  /** reserved for the HUD */
  hud: number;
  win: Box;
  sillY: number;
  sillH: number;
  cust: { x: number; R: number };
  card: Box;
  register: { x: number; y: number; w: number };
  jar: { x: number; y: number; w: number };
  pip: { x: number; y: number; s: number };
  work: Box;
  plate: { x: number; y: number; u: number };
  trays: Tray[];
  tools: Tool[];
  rack: { id: PlateId; x: number; y: number; s: number }[];
  trash: { x: number; y: number; s: number };
  serve: { x: number; y: number; w: number; h: number };
  panel: Box;
  float: { x: number; y: number };
}

export function computeLayout(
  W: number,
  H: number,
  portrait: boolean,
  trays: IngId[],
  plates: PlateId[],
  tools: Tool['id'][]
): Layout {
  const hud = 58;
  if (!portrait) {
    const sillY = 318;
    const sillH = 30;
    const win = { x: W * 0.17, y: hud + 4, w: W * 0.66, h: sillY - hud - 4 };
    const workTop = sillY + sillH;
    const rowY = H - 46;
    const work = { x: 0, y: workTop, w: W, h: H - workTop };
    const plateU = Math.min(400, W * 0.33);
    const plateY = workTop + (rowY - 46 - workTop) / 2 + 4;
    const left = trays.filter((i) => ['rice', 'salmon', 'tuna', 'tamago', 'ebi'].includes(i));
    const right = trays.filter((i) => !left.includes(i));
    const out: Tray[] = [];
    const zoneTop = workTop + 8;
    const zoneBot = rowY - 52;
    const place = (list: IngId[], x0: number, x1: number) => {
      if (!list.length) return;
      const zw = x1 - x0;
      const zh = zoneBot - zoneTop;
      let best = { cols: 1, rows: list.length, T: 0 };
      for (let cols = 1; cols <= list.length; cols++) {
        const rows = Math.ceil(list.length / cols);
        const T = Math.min(118, zw / cols / 1.06, zh / rows / 1.0);
        if (T > best.T) best = { cols, rows, T };
      }
      const { cols, rows, T } = best;
      const gw = cols * T * 1.06;
      const gh = rows * T;
      list.forEach((ing, i) => {
        const r = Math.floor(i / cols);
        const k = i % cols;
        const inRow = Math.min(cols, list.length - r * cols);
        const rowW = inRow * T * 1.06;
        out.push({
          ing,
          x: x0 + zw / 2 - rowW / 2 + T * 0.53 + k * T * 1.06,
          y: zoneTop + (zh - gh) / 2 + T * 0.5 + r * T,
          s: T,
        });
        void gw;
      });
    };
    place(left, 14, W / 2 - plateU * 0.62);
    place(right, W / 2 + plateU * 0.62, W - 14);
    const ts = 76;
    const toolsOut: Tool[] = tools.map((id, i) => ({
      id,
      x: 24 + ts / 2 + i * (ts + 10),
      y: rowY,
      s: ts,
    }));
    const rx0 = 24 + tools.length * (ts + 10) + (tools.length ? 22 : 0);
    return {
      W,
      H,
      portrait,
      hud,
      win,
      sillY,
      sillH,
      cust: { x: W * 0.37, R: 50 },
      card: { x: W * 0.5, y: hud + 16, w: Math.min(W * 0.3, 380), h: sillY - hud - 30 },
      register: { x: W * 0.085, y: sillY + 8, w: 150 },
      jar: { x: W * 0.875, y: sillY + 8, w: 64 },
      pip: { x: W * 0.94, y: sillY + 10, s: 64 },
      work,
      plate: { x: W / 2, y: plateY, u: plateU },
      trays: out,
      tools: toolsOut,
      rack:
        plates.length > 1
          ? plates.map((id, i) => ({ id, x: rx0 + 30 + i * 70, y: rowY, s: 60 }))
          : [],
      trash: { x: W - 250, y: rowY, s: 64 },
      serve: { x: W - 112, y: rowY, w: 190, h: 64 },
      panel: { x: 14, y: hud + 46, w: W - 28, h: H - hud - 56 },
      float: { x: W / 2 - plateU * 0.38, y: plateY - plateU * 0.36 },
    };
  }
  // portrait
  const sillY = Math.round(Math.min(H * 0.39, 540));
  const sillH = 30;
  const win = { x: 26, y: hud + 4, w: W - 52, h: sillY - hud - 4 };
  const workTop = sillY + sillH;
  const rowY = H - 52;
  const work = { x: 0, y: workTop, w: W, h: H - workTop };
  const plateU = Math.min(W * 0.78, 560);
  const plateY = workTop + 18 + plateU * 0.3;
  const gridTop = plateY + plateU * 0.3 + 14;
  const gridBot = rowY - 52;
  const N = trays.length;
  let best = { cols: 4, rows: Math.ceil(N / 4), T: 0 };
  for (let cols = 3; cols <= 7; cols++) {
    const rows = Math.ceil(N / cols);
    const T = Math.min(140, (W - 24) / cols / 1.05, (gridBot - gridTop) / rows);
    if (T > best.T) best = { cols, rows, T };
  }
  const { cols, rows, T } = best;
  const out: Tray[] = [];
  const gh = rows * T;
  trays.forEach((ing, i) => {
    const r = Math.floor(i / cols);
    const k = i % cols;
    const inRow = Math.min(cols, N - r * cols);
    const rowW = inRow * T * 1.05;
    out.push({
      ing,
      x: W / 2 - rowW / 2 + T * 0.525 + k * T * 1.05,
      y: gridTop + (gridBot - gridTop - gh) / 2 + T * 0.5 + r * T,
      s: T,
    });
  });
  const ts = 70;
  const toolsOut: Tool[] = tools.map((id, i) => ({
    id,
    x: 18 + ts / 2 + i * (ts + 6),
    y: rowY,
    s: ts,
  }));
  const rx0 = 18 + tools.length * (ts + 6) + 10;
  return {
    W,
    H,
    portrait,
    hud,
    win,
    sillY,
    sillH,
    cust: { x: W * 0.3, R: 52 },
    card: { x: W * 0.52, y: hud + 14, w: W * 0.45, h: sillY - hud - 26 },
    register: { x: 92, y: sillY + 8, w: 130 },
    jar: { x: W - 150, y: sillY + 8, w: 56 },
    pip: { x: W - 62, y: sillY + 10, s: 58 },
    work,
    plate: { x: W / 2, y: plateY, u: plateU },
    trays: out,
    tools: toolsOut,
    rack:
      plates.length > 1
        ? plates.map((id, i) => ({ id, x: rx0 + 26 + i * 58, y: rowY, s: 52 }))
        : [],
    trash: { x: W - 200, y: rowY, s: 58 },
    serve: { x: W - 86, y: rowY, w: 150, h: 60 },
    panel: { x: 10, y: workTop - 10, w: W - 20, h: H - workTop - 90 },
    float: { x: W / 2 - plateU * 0.4, y: plateY - plateU * 0.3 },
  };
}
