import { useState } from 'react';
import { sfx } from '../audio';
import { Rain } from './Scenery';
import Facade from './Facade';
import type { TimeOfDay } from './Restaurant';

/** Opening shot of each day: the shop from the street, then the camera pushes in through the door. */
export default function Establishing({
  day,
  title,
  subtitle,
  meta,
  rain,
  tod = 'ogle',
  onDone,
}: {
  day: number;
  title: string;
  subtitle: string;
  meta: string;
  rain: boolean;
  tod?: TimeOfDay;
  onDone: () => void;
}) {
  const [push, setPush] = useState(false);
  return (
    <div className={`establish est-${tod} ${push ? 'push' : ''}`}>
      <div className="est-scene">
        <Facade tod={tod} rain={rain} />
        {rain && <Rain count={50} />}
      </div>
      <div className="est-bars top" />
      <div className="est-bars bottom" />
      {!push && (
        <div className="est-text">
          <div className="est-day">GÜN {day}</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <small>{meta}</small>
          <button
            className="btn big primary"
            onClick={() => {
              setPush(true);
              sfx('door');
              window.setTimeout(onDone, 1500);
            }}>
            Kepengi kaldır
          </button>
        </div>
      )}
    </div>
  );
}
