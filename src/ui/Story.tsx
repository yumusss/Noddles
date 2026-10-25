import { useEffect, useMemo, useState } from 'react';
import SceneCanvas from './SceneCanvas';
import { salonScene } from './scenes';
import { CHARS, type Line } from '../game/data';
import type { DecorState } from '../game/decor';
import type { Tod } from '../art/common';
import { sfx } from '../game/audio';
import Portrait from './Portrait';

export default function Story({
  heading,
  title,
  lines,
  decor,
  tod,
  rain,
  onDone,
}: {
  heading: string;
  title: string;
  lines: Line[];
  decor: DecorState;
  tod: Tod;
  rain?: boolean;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(0);
  const line = lines[i];
  const scene = useMemo(() => salonScene(decor, tod, rain), [decor, tod, rain]);

  useEffect(() => {
    setShown(0);
    const id = setInterval(() => {
      setShown((s) => {
        if (s >= line.text.length) {
          clearInterval(id);
          return s;
        }
        if (s % 3 === 0) sfx('type');
        return s + 1;
      });
    }, 22);
    return () => clearInterval(id);
  }, [i, line.text]);

  const advance = () => {
    if (shown < line.text.length) {
      setShown(line.text.length);
      return;
    }
    sfx('tap');
    if (i + 1 >= lines.length) onDone();
    else setI(i + 1);
  };

  return (
    <div className="screen story" onClick={advance}>
      <SceneCanvas draw={scene} className="bg" />
      <div className="story-veil" />
      <div className="story-head">
        <span className="chip">{heading}</span>
        <strong>{title}</strong>
      </div>
      <button
        className="btn ghost small skip"
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}>
        Geç ⏭
      </button>
      <div className="dialog">
        <div className="portrait">
          <Portrait who={line.who} />
        </div>
        <div className="dialog-box">
          <span className="name" style={{ background: CHARS[line.who].color }}>
            {CHARS[line.who].name}
          </span>
          <p>
            {line.text.slice(0, shown)}
            {shown < line.text.length && <span className="caret">▍</span>}
          </p>
          <span className="count">
            {i + 1}/{lines.length} ▸
          </span>
        </div>
      </div>
    </div>
  );
}
