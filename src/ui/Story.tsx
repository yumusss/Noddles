import { useEffect, useMemo, useState } from 'react';
import SceneCanvas from './SceneCanvas';
import { salonScene } from './scenes';
import { CHARS, type Line } from '../game/data';
import type { DecorState } from '../game/decor';
import type { Tod } from '../art/common';
import { sfx } from '../game/audio';
import Portrait from './Portrait';
import { L, T } from '../game/i18n';

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
  const text = L(line.text);
  const scene = useMemo(() => salonScene(decor, tod, rain), [decor, tod, rain]);

  useEffect(() => {
    setShown(0);
    const id = setInterval(() => {
      setShown((s) => {
        if (s >= text.length) {
          clearInterval(id);
          return s;
        }
        if (s % 3 === 0) sfx('type');
        return s + 1;
      });
    }, 22);
    return () => clearInterval(id);
  }, [i, text]);

  const advance = () => {
    if (shown < text.length) {
      setShown(text.length);
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
        <strong>{L(title)}</strong>
      </div>
      <button
        className="btn ghost small skip"
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}>
        {T('story.skip')}
      </button>
      <div className="dialog">
        <div className="portrait">
          <Portrait who={line.who} />
        </div>
        <div className="dialog-box">
          <span className="name" style={{ background: CHARS[line.who].color }}>
            {L(CHARS[line.who].name)}
          </span>
          <p>
            {text.slice(0, shown)}
            {shown < text.length && <span className="caret">▍</span>}
          </p>
          <span className="count">
            {i + 1}/{lines.length} ▸
          </span>
        </div>
      </div>
    </div>
  );
}
