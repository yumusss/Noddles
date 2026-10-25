import { useEffect, useState } from 'react';
import { CHARS, type Line } from '../data';
import { Portrait } from '../art';
import { sfx } from '../audio';
import { ShopWall } from './Scenery';

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

  return (
    <div className="screen story" onClick={advance}>
      <div className="story-bg">
        <ShopWall />
      </div>
      {i === -1 ? (
        <div className="chapter-card">
          <div className="chapter-heading">{heading}</div>
          <div className="chapter-title">{title}</div>
          <div className="tap-hint">Dokun ve başla</div>
        </div>
      ) : (
        line &&
        ch && (
          <>
            <div key={i + line.who} className={`story-portrait ${right ? 'right' : 'left'}`}>
              <Portrait
                who={line.who}
                mood={line.who === 'baron' ? 'neutral' : 'happy'}
                size={190}
              />
            </div>
            <div className="dialog">
              <div className="dialog-name" style={{ background: ch.color }}>
                {ch.name}
              </div>
              <div className="dialog-text">{line.text.slice(0, shown)}</div>
              <div className="dialog-next">
                {i + 1}/{lines.length} ▸
              </div>
            </div>
          </>
        )
      )}
      <button
        className="skip"
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}>
        Geç ⏭
      </button>
    </div>
  );
}
