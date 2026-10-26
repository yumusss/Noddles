// Day intro / outro: the cast talks through the hut window, with typewriter text.

import { useEffect, useState } from 'react';
import { type Day, type DecorSlot, type Line, SPEAKERS } from '../game/data';
import { t, tx } from '../game/i18n';
import { sfx } from '../game/audio';
import { Portrait } from './Avatar';
import Backdrop from './Backdrop';
import { useLang } from '../App';

export default function Story({
  day,
  lines,
  mode,
  decor,
  onDone,
}: {
  day: Day;
  lines: Line[];
  mode: 'intro' | 'outro';
  decor: Record<DecorSlot, string>;
  onDone: () => void;
}) {
  useLang();
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const line = lines[i];
  const full = line ? tx(line.text) : '';
  useEffect(() => {
    if (!line) onDone();
  }, [line, onDone]);
  useEffect(() => {
    if (n >= full.length) return;
    const id = setTimeout(() => {
      setN((x) => x + 2);
      if (n % 6 === 0) sfx('type');
    }, 22);
    return () => clearTimeout(id);
  }, [n, full]);
  if (!line) return null;
  const next = () => {
    if (n < full.length) setN(full.length);
    else if (i + 1 < lines.length) {
      sfx('tap');
      setN(0);
      setI(i + 1);
    } else onDone();
  };
  return (
    <div className="screen story" onClick={next}>
      <Backdrop time={day.time} snow={day.snow} decor={decor} aurora={day.n === 10} />
      <div className="story-veil" />
      <div className="story-head">
        <small>{t('day', { n: day.n })}</small>
        <h1>{tx(day.title)}</h1>
      </div>
      <div className="story-card">
        <div className="story-portrait">
          <Portrait who={line.who} size={220} talking={n < full.length} />
        </div>
        <div className="story-text">
          <b>{tx(SPEAKERS[line.who])}</b>
          <p>{full.slice(0, n)}</p>
          <div className="story-nav">
            <span>
              {i + 1}/{lines.length}
            </span>
            <button className="btn coral" onClick={(e) => (e.stopPropagation(), next())}>
              {i + 1 < lines.length || n < full.length
                ? t('next')
                : mode === 'intro'
                  ? t('start')
                  : t('continue')}
            </button>
          </div>
        </div>
      </div>
      <button className="skip" onClick={(e) => (e.stopPropagation(), onDone())}>
        {t('skip')}
      </button>
    </div>
  );
}
