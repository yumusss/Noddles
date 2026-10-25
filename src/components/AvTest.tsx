import { Avatar } from '../avatar';
import type { Look, Mood } from '../art';
export default function AvTest() {
  const sp = ['hana', 'baron', 'lezzetova', 'ruzgar', 'sef'] as const;
  const moods: Mood[] = ['love', 'happy', 'neutral', 'worried', 'angry'];
  return (
    <div
      style={{
        background: '#6e3a24',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: 6,
        height: '100%',
        overflow: 'auto',
      }}>
      {sp.map((s) => (
        <Avatar key={s} look={{ seed: 1, special: s } as Look} mood="happy" size={180} />
      ))}
      {moods.map((m, i) => (
        <Avatar key={m} look={{ seed: 100 + i } as Look} mood={m} size={140} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <Avatar key={i} look={{ seed: 900 + i * 31 } as Look} mood="happy" size={140} />
      ))}
    </div>
  );
}
