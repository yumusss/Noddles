// The harbor map: 50 day nodes along a winding path, grouped by act.

import { useEffect, useRef } from 'react';
import { ACTS, DAYS, PLAYABLE_DAYS, TOTAL_DAYS } from '../game/data';
import { money, t, tx } from '../game/i18n';
import type { Save } from '../game/save';
import { sfx } from '../game/audio';
import { Lock, Star } from './icons';
import { LangToggle } from './PauseMenu';
import { useLang } from '../App';

const STEP = 116;

export default function MapScreen({
  save,
  onDay,
  onDecor,
  onTitle,
  onToggle,
}: {
  save: Save;
  onDay: (n: number) => void;
  onDecor: () => void;
  onTitle: () => void;
  onToggle: (k: 'sfx' | 'music') => void;
}) {
  const lang = useLang();
  const scroller = useRef<HTMLDivElement>(null);
  const total = TOTAL_DAYS;
  const height = total * STEP + 260;
  const pos = (n: number) => {
    const y = height - 140 - (n - 1) * STEP;
    const x = 50 + Math.sin(n * 0.9) * 26;
    return { x, y };
  };
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const { y } = pos(save.unlocked);
    el.scrollTop = y - el.clientHeight * 0.6;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const starSum = save.stars.reduce((a, b) => a + b, 0);
  let path = '';
  for (let n = 1; n <= total; n++) {
    const p = pos(n);
    path += (n === 1 ? 'M' : 'L') + ` ${p.x} ${p.y}`;
  }
  return (
    <div className="screen map">
      <header className="map-head">
        <button className="btn ghost small" onClick={onTitle}>
          ←
        </button>
        <div className="map-stats">
          <span className="pill">
            <Star on size={18} /> {starSum}/{TOTAL_DAYS * 3}
          </span>
          <span className="pill">
            {t('wallet')}: {money(save.wallet)}
          </span>
        </div>
        <div className="map-tools">
          <button className="btn small" onClick={onDecor}>
            {t('decor')}
          </button>
          <button className="btn small ghost" onClick={() => onToggle('sfx')}>
            {t('sound')}: {save.sfx ? t('on') : t('off')}
          </button>
          <LangToggle lang={lang} />
        </div>
      </header>
      <div className="map-scroll" ref={scroller}>
        <div className="map-world" style={{ height }}>
          <svg className="map-path" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
            <path d={path} />
          </svg>
          {ACTS.map((a, i) => {
            const first = i * 10 + 1;
            const p = pos(first);
            return (
              <div key={i} className="act-label" style={{ top: p.y + 46 }}>
                <span>
                  {t('act', { n: i + 1 })} · {tx(a)}
                </span>
              </div>
            );
          })}
          {Array.from({ length: total }, (_, k) => {
            const n = k + 1;
            const p = pos(n);
            const playable = n <= PLAYABLE_DAYS;
            const open = playable && n <= save.unlocked;
            const today = n === save.unlocked && playable;
            const d = DAYS[n - 1];
            return (
              <div key={n} className="node-wrap" style={{ left: p.x + '%', top: p.y }}>
                <button
                  className={
                    'node' +
                    (open ? ' open' : '') +
                    (today ? ' today' : '') +
                    (d?.rain ? ' rain' : '')
                  }
                  disabled={!open}
                  onClick={() => {
                    sfx('tap');
                    onDay(n);
                  }}>
                  {open ? n : <Lock />}
                </button>
                <div className="node-stars">
                  {[1, 2, 3].map((s) => (
                    <Star key={s} on={save.stars[n] >= s} size={14} />
                  ))}
                </div>
                {open && d && <div className="node-title">{tx(d.title)}</div>}
                {!playable && n === PLAYABLE_DAYS + 1 && (
                  <div className="node-title soon">{t('soon')}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
