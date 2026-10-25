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
          <div className="est-plant" aria-hidden="true">
            <svg viewBox="0 0 60 90">
              <ellipse cx="30" cy="87" rx="20" ry="3" fill="#2b2420" opacity=".3" />
              <path d="M30 60 q-14 -12 -20 -34 q16 4 22 30z" fill="#6f8f62" />
              <path d="M30 60 q14 -12 20 -34 q-16 4 -22 30z" fill="#7c9a6e" />
              <path d="M30 62 q-2 -22 0 -40 q8 20 2 40z" fill="#8fae80" />
              <path d="M16 58 h28 l-4 28 h-20z" fill="#b8664a" />
              <path d="M16 58 h28 l-1 6 h-26z" fill="#c8775a" />
              <path d="M40 58 l4 0 l-4 28 h-3z" fill="#2b2420" opacity=".18" />
            </svg>
          </div>
          <div className="est-board" aria-hidden="true">
            <svg viewBox="0 0 60 90">
              <ellipse cx="30" cy="87" rx="22" ry="3" fill="#2b2420" opacity=".3" />
              <path d="M12 10 h36 l6 76 h-8 l-4 -56 h-24 l-4 56 h-8z" fill="#7b4f2e" />
              <rect x="14" y="12" width="32" height="46" rx="2" fill="#3f4a44" />
              <rect x="16" y="14" width="28" height="42" rx="1.5" fill="#313b36" />
              <text x="30" y="30" textAnchor="middle" fontSize="9" fontWeight="700" fill="#f6efe4">
                MENÜ
              </text>
              <path
                d="M20 37 h20 M20 43 h16 M20 49 h18"
                stroke="#f6efe4"
                strokeWidth="1.6"
                opacity=".55"
                strokeLinecap="round"
              />
            </svg>
          </div>
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
