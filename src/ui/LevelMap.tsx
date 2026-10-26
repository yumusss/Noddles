import { useEffect, useMemo, useRef, useState } from 'react';
import { LEVELS } from '../game/data';
import type { Save } from '../App';
import SceneCanvas from './SceneCanvas';
import { salonScene } from './scenes';
import { fmt } from '../game/money';
import { sfx } from '../game/audio';
import { L, T } from '../game/i18n';

const TOD_ICON = { sabah: '🌅', ogle: '☀️', gunbatimi: '🌇', aksam: '🌙' } as const;

export default function LevelMap({
  save,
  onPick,
  onBack,
  onToggle,
  onReset,
  onEnding,
  onDecor,
  onLang,
}: {
  save: Save;
  onPick: (level: number) => void;
  onBack: () => void;
  onToggle: (k: 'sfx' | 'music') => void;
  onReset: () => void;
  onEnding: () => void;
  onDecor: () => void;
  onLang: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const scene = useMemo(() => salonScene(save.decor, 'ogle', false), [save.decor]);
  const total = save.stars.reduce((a, b) => a + b, 0);
  const curRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // 50 days is a long path — start scrolled to today
    curRef.current?.scrollIntoView({ block: 'center' });
  }, []);
  return (
    <div className="screen map">
      <SceneCanvas draw={scene} className="bg" animate={false} />
      <div className="map-veil" />
      <header className="bar">
        <button className="btn ghost small" onClick={onBack}>
          {T('map.back')}
        </button>
        <div className="bar-mid">
          <span className="chip gold">★ {total}/{LEVELS.length * 3}</span>
          <span className="chip">{fmt(save.cash)}</span>
        </div>
        <div className="bar-right">
          <button className="btn ghost small" onClick={() => onToggle('sfx')}>
            {save.sfx ? '🔊' : '🔇'}
          </button>
          <button className="btn ghost small" onClick={() => onToggle('music')}>
            {save.music ? '🎵' : '🎵̸'}
          </button>
          <button className="btn ghost small" onClick={onLang}>
            {T('map.lang')}
          </button>
        </div>
      </header>
      <div className="map-scroll">
        <div className="map-path">
          {LEVELS.map((l, i) => {
            const locked = l.id > save.reached;
            const stars = save.stars[i];
            return (
              <button
                key={l.id}
                ref={l.id === Math.min(save.reached, LEVELS.length) ? curRef : undefined}
                className={`node ${locked ? 'locked' : ''} ${l.id === save.reached ? 'current' : ''} ${i % 2 ? 'right' : 'left'}`}
                disabled={locked}
                onClick={() => {
                  sfx('tap');
                  onPick(l.id);
                }}>
                <span className="num">{locked ? '🔒' : l.id}</span>
                <span className="info">
                  <strong>{L(l.title)}</strong>
                  <small>
                    {TOD_ICON[l.time]} {l.rain ? '🌧 ' : ''}
                    {T('map.minutes', { n: l.minutes })}
                  </small>
                  <span className="stars">
                    {[0, 1, 2].map((k) => (
                      <i key={k} className={k < stars ? '' : 'off'}>
                        ★
                      </i>
                    ))}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="map-actions">
          <button className="btn primary" onClick={onDecor}>
            {T('map.decor')}
          </button>
          {save.reached > LEVELS.length && (
            <button className="btn" onClick={onEnding}>
              {T('map.ending')}
            </button>
          )}
          {!confirm ? (
            <button className="btn ghost small" onClick={() => setConfirm(true)}>
              {T('map.reset')}
            </button>
          ) : (
            <span className="confirm">
              {T('map.sure')}{' '}
              <button className="btn small danger" onClick={onReset}>
                {T('map.yesReset')}
              </button>{' '}
              <button className="btn small" onClick={() => setConfirm(false)}>
                {T('map.cancel')}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
