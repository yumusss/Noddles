import { useEffect, useState } from 'react';

type FsDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };

export function canFullscreen() {
  const el = document.documentElement as FsEl;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export function enterFullscreen() {
  const el = document.documentElement as FsEl;
  try {
    const p = el.requestFullscreen
      ? el.requestFullscreen({ navigationUI: 'hide' })
      : el.webkitRequestFullscreen?.();
    if (p && 'catch' in p) p.catch(() => undefined);
  } catch {
    /* not allowed here */
  }
}

export default function FullscreenButton({ className = '' }: { className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const h = () => {
      const d = document as FsDoc;
      setOn(!!(d.fullscreenElement || d.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', h);
    document.addEventListener('webkitfullscreenchange', h);
    return () => {
      document.removeEventListener('fullscreenchange', h);
      document.removeEventListener('webkitfullscreenchange', h);
    };
  }, []);
  if (!canFullscreen()) return null;
  return (
    <button
      className={`fs-btn ${className}`}
      aria-label={on ? 'Tam ekrandan çık' : 'Tam ekran'}
      onClick={() => {
        const d = document as FsDoc;
        if (on)
          (d.exitFullscreen ? d.exitFullscreen() : d.webkitExitFullscreen?.())?.catch?.(
            () => undefined
          );
        else enterFullscreen();
      }}>
      {on ? '⤡' : '⛶'}
      <span>{on ? 'Küçült' : 'Tam ekran'}</span>
    </button>
  );
}
