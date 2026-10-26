// Hotspots: interactive regions registered while drawing, in world coordinates.
// Input reads the regions of the last frame, so layout and hit-testing never drift apart.

export interface Hot {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** circle hotspots hit by radius instead of the box */
  r?: number;
  hold?: boolean;
}

let cur: Hot[] = [];
let last: Hot[] = [];
let OX = 0;

/** world x of the station currently being drawn; hotspots are given in station-local x */
export function hsOrigin(x: number) {
  OX = x;
}

export function hsBegin() {
  cur = [];
}
export function hsEnd() {
  last = cur;
}
export function hs(id: string, x: number, y: number, w: number, h: number, hold = false) {
  cur.push({ id, x: x + OX, y, w, h, hold });
}
export function hsCircle(id: string, cx: number, cy: number, r: number, hold = false) {
  cur.push({ id, x: cx - r + OX, y: cy - r, w: r * 2, h: r * 2, r, hold });
}

/** topmost hotspot under a world point (later registrations win) */
export function hitTest(x: number, y: number): Hot | null {
  for (let i = last.length - 1; i >= 0; i--) {
    const h = last[i];
    if (h.r) {
      if (Math.hypot(x - (h.x + h.r), y - (h.y + h.r)) <= h.r) return h;
    } else if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h;
  }
  return null;
}

export function findHot(id: string): Hot | undefined {
  return last.find((h) => h.id === id);
}
