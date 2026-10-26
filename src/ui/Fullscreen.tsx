import { useEffect, useState } from 'react';

export default function Fullscreen() {
  const [on, setOn] = useState(false);
  const [can, setCan] = useState(false);
  useEffect(() => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    setCan(
      !!(el.requestFullscreen || el.webkitRequestFullscreen) &&
        !window.matchMedia('(display-mode: standalone)').matches
    );
    const h = () => setOn(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);
  if (!can) return null;
  const toggle = () => {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
    else el.webkitRequestFullscreen?.();
  };
  return (
    <button className="btn ghost small fs-btn" onClick={toggle} aria-label="Tam ekran">
      {on ? '⤢ Küçült' : '⤢ Tam ekran'}
    </button>
  );
}
