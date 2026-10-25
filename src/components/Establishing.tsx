import { useState } from 'react';
import { sfx } from '../audio';
import { Rain } from './Scenery';
import type { DayTime, Weather } from '../data';

/** Opening shot of each day: the shop from the street, then the camera pushes in through the door. */
export default function Establishing({
  day,
  title,
  subtitle,
  meta,
  time = 'night',
  weather = 'clear',
  onDone,
}: {
  day: number;
  title: string;
  subtitle: string;
  meta: string;
  time?: DayTime;
  weather?: Weather;
  onDone: () => void;
}) {
  const [push, setPush] = useState(false);
  return (
    <div className={`establish t-${time} w-${weather} ${push ? 'push' : ''}`}>
      <div className="est-scene">
        <div className="est-sky" />
        <div className="est-moon" />
        <div className="est-buildings" />
        <div className="est-shop">
          <div className="est-roof" />
          <div className="est-sign">
            <span>NODDLES</span>
          </div>
          <div className="est-front">
            <div className="est-window">
              <div className="est-silhouette s1" />
              <div className="est-silhouette s2" />
              <div className="est-steam" />
            </div>
            <div className="est-door">
              <div className="est-noren">
                <i>麺</i>
                <i>屋</i>
              </div>
            </div>
            <div className="est-window">
              <div className="est-silhouette s3" />
            </div>
          </div>
          <div className="est-lantern l" />
          <div className="est-lantern r" />
        </div>
        <div className="est-street" />
        {weather === 'rain' && <Rain count={50} />}
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
