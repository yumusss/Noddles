// Small compatibility shims for older WebKit (iPadOS/iOS < 16.4).
const proto =
  typeof CanvasRenderingContext2D !== 'undefined' ? CanvasRenderingContext2D.prototype : null;
if (proto && typeof (proto as { roundRect?: unknown }).roundRect !== 'function') {
  (
    proto as unknown as {
      roundRect: (x: number, y: number, w: number, h: number, r?: number | number[]) => void;
    }
  ).roundRect = function (
    this: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number | number[] = 0
  ) {
    const rad = Array.isArray(r) ? (r[0] ?? 0) : r;
    const rr = Math.max(0, Math.min(rad, Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y, x + w, y + h, rr);
    this.arcTo(x + w, y + h, x, y + h, rr);
    this.arcTo(x, y + h, x, y, rr);
    this.arcTo(x, y, x + w, y, rr);
    this.closePath();
  };
}

// Show fatal errors on screen so they can be reported from a phone.
export function installErrorOverlay() {
  const show = (msg: string) => {
    let el = document.getElementById('fatal');
    if (!el) {
      el = document.createElement('pre');
      el.id = 'fatal';
      el.style.cssText =
        'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;max-height:40vh;overflow:auto;background:#fff0ec;color:#8a2b1e;border:2px solid #d9573f;border-radius:12px;padding:10px;font:12px/1.4 monospace;white-space:pre-wrap;';
      document.body.appendChild(el);
    }
    el.textContent += msg + '\n';
  };
  window.addEventListener('error', (e) =>
    show(`${e.message} (${e.filename?.split('/').pop()}:${e.lineno})`)
  );
  window.addEventListener('unhandledrejection', (e) => show(String(e.reason)));
}
