import { useEffect, useState } from 'react';
import { CHARS, type Line } from '../data';
import { Portrait } from '../avatar';
import { sfx } from '../audio';
import { ShopWall } from './Scenery';

const TONE: Record<string, string> = {
  hana: 'var(--clay)',
  sef: 'var(--indigo2)',
  miso: 'var(--walnut)',
  ruzgar: 'var(--matcha)',
  baron: '#4b3a5e',
  lezzetova: 'var(--gold2)',
  mahalle: '#8a8f93',
};

export default function Story({
  heading,
  title,
  lines,
  onDone,
}: {
  heading: string;
  title: string;
  lines: Line[];
  onDone: () => void;
}) {
  const [i, setI] = useState(-1);
  const [shown, setShown] = useState(0);
  const line = i >= 0 ? lines[i] : null;

  useEffect(() => {
    if (!line) return;
    setShown(0);
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= line.text.length) {
          window.clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 22);
    return () => window.clearInterval(id);
  }, [line]);

  const advance = () => {
    if (i === -1) {
      sfx('whoosh');
      setI(0);
      return;
    }
    if (line && shown < line.text.length) {
      setShown(line.text.length);
      return;
    }
    sfx('tap');
    if (i + 1 >= lines.length) onDone();
    else setI(i + 1);
  };

  const ch = line ? CHARS[line.who] : null;
  const right = line && (line.who === 'sef' || line.who === 'ruzgar');
  const done = !!line && shown >= line.text.length;

  return (
    <div className="screen story story-v2" onClick={advance}>
      <div className="story-bg">
        <ShopWall />
      </div>
      <div className="story-veil" />
      {i === -1 ? (
        <div className="chapter-card paper-card">
          <div className="chapter-heading">{heading}</div>
          <div className="chapter-title">{title}</div>
          <div className="chapter-rule" />
          <div className="tap-hint">Dokun ve başla</div>
        </div>
      ) : (
        line &&
        ch && (
          <>
            <div key={i + line.who} className={`story-portrait ${right ? 'right' : 'left'}`}>
              <div className="portrait-halo" style={{ background: TONE[line.who] }} />
              <Portrait
                who={line.who}
                mood={line.who === 'baron' ? 'neutral' : 'happy'}
                size={210}
              />
            </div>
            <div className={`dialog paper-card ${right ? 'from-right' : 'from-left'}`}>
              <div className="dialog-name" style={{ background: TONE[line.who] }}>
                {ch.name}
              </div>
              <div className="dialog-text">
                {line.text.slice(0, shown)}
                {!done && <span className="caret" />}
              </div>
              <div className="dialog-foot">
                <span className="dialog-dots">
                  {lines.map((_, k) => (
                    <i key={k} className={k <= i ? 'on' : ''} />
                  ))}
                </span>
                <span className={`dialog-next ${done ? 'ready' : ''}`}>
                  {i + 1 >= lines.length ? 'Bitir' : 'Devam'} ▸
                </span>
              </div>
            </div>
          </>
        )
      )}
      <button
        className="skip skip-v2"
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}>
        Geç
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="M5 5l9 7-9 7zM16 5h3v14h-3z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
