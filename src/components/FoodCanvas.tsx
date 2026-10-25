import { useEffect, useRef } from 'react';
import { drawBowl, trayImage, type BowlDraw, type Thick } from '../food';
import { BOWLS, DEFAULT_BOWL } from '../bowls';

function useDpr() {
  return Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
}

/** Top-down bowl drawn on canvas in a 300x300 logical space. */
export function BowlCanvas({
  bowl,
  size,
  className,
  canvasRef,
  onDown,
  onMove,
  onUp,
}: {
  bowl: BowlDraw;
  size: number;
  className?: string;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  onDown?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onMove?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onUp?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
}) {
  const own = useRef<HTMLCanvasElement>(null);
  const ref = canvasRef ?? own;
  const dpr = useDpr();
  const px = Math.round(size * dpr);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext('2d')!;
    c.setTransform(px / 300, 0, 0, px / 300, 0, 0);
    drawBowl(c, bowl);
  }, [bowl, px, ref]);
  return (
    <canvas
      ref={ref}
      width={px}
      height={px}
      className={className}
      style={{ width: size, height: size, touchAction: 'none' }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onPointerLeave={onUp}
    />
  );
}

/** Bowl seen at a 3/4 angle: the top-down canvas tilted in 3D above a glazed body. */
export function BowlSide({
  bowl,
  width,
  steam = true,
}: {
  bowl: BowlDraw;
  width: number;
  steam?: boolean;
}) {
  const st = BOWLS[bowl.style ?? DEFAULT_BOWL] ?? BOWLS[DEFAULT_BOWL];
  return (
    <div
      className={`bowl-side ${bowl.takeaway ? 'kraft' : ''}`}
      style={
        {
          width,
          height: width * 0.78,
          '--g0': st.glaze[0],
          '--g1': st.glaze[1],
          '--g2': st.glaze[2],
        } as React.CSSProperties
      }>
      <div className="bs-shadow" />
      <div className="bs-body" />
      <div className="bs-top">
        <BowlCanvas bowl={bowl} size={width} />
      </div>
      {steam && bowl.liquid && (
        <div className="bs-steam">
          <i />
          <i />
          <i />
        </div>
      )}
    </div>
  );
}

export function Tray({ id, thick, width = 100 }: { id: string; thick?: Thick; width?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dpr = useDpr();
  const pw = Math.round(width * dpr);
  const ph = Math.round(((width * 170) / 240) * dpr);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const c = cv.getContext('2d')!;
    c.clearRect(0, 0, cv.width, cv.height);
    c.drawImage(trayImage(id, thick), 0, 0, cv.width, cv.height);
  }, [id, thick, pw, ph]);
  return (
    <canvas
      ref={ref}
      width={pw}
      height={ph}
      style={{ width, height: (width * 170) / 240 }}
      className="tray-cv"
    />
  );
}
