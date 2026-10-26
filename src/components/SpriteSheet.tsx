import { useEffect, useRef } from 'react';
import { sprite } from '../food';
import { TOPPINGS } from '../toppings';

/** Dev view (?sprites): every topping illustration, large, on a broth-coloured backdrop. */
export default function SpriteSheet() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 8, background: '#b77a4a' }}>
      {Object.keys(TOPPINGS).map((id) => (
        <One key={id} id={id} />
      ))}
    </div>
  );
}
function One({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!.getContext('2d')!;
    c.drawImage(sprite(id, 1), 0, 0, 220, 220);
  }, [id]);
  return <canvas ref={ref} width={220} height={220} title={id} />;
}
