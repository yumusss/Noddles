// Day intro / outro dialogue with typewriter text.

import { useEffect, useState } from 'react';
import { type Day, type Line, SPEAKERS, ACTS } from '../game/data';
import { t, tx } from '../game/i18n';
import { sfx } from '../game/audio';
import Portrait from './Portrait';
import Backdrop from './Backdrop';
import { useLang } from '../App';

export default function Story({
  day,
  lines,
  mode,
  onDone,
}: {
  day: Day;
  lines: Line[];
  mode: 'intro' | 'outro';
  onDone: () => void;
}) {
  useLang();
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const line = lines[i];
  const full = line ? tx(line.text) : '';
  useEffect(() => {
    setN(0);
  }, [i]);
  useEffect(() => {
    if (n >= full.length) return;
    const id = setTimeout(() => {
      setN((x) => x + 2);
      if (n % 6 === 0) sfx('type');
    }, 22);
    return () => clearTimeout(id);
  }, [n, full]);
  useEffect(() => {
    if (!line) onDone();
  }, [line, onDone]);
  if (!line) return null;
  const next = () => {
    if (n < full.length) setN(full.length);
    else if (i + 1 < lines.length) {
      sfx('tap');
      setI(i + 1);
    } else onDone();
  };
  return (
    <div className={'screen story ' + day.time + (day.rain ? ' rain' : '')} onClick={next}>
      <Backdrop day={day} />
      <div className="story-veil" />
      <div className="story-head">
        {mode === 'intro' && (
          <>
            <small>
              {t('act', { n: day.act })} · {tx(ACTS[day.act - 1])}
            </small>
            <h1>
              {t('day', { n: day.n })} — {tx(day.title)}
            </h1>
          </>
        )}
      </div>
      <div className="story-card">
        <Portrait who={line.who} size={200} talking={n < full.length} />
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
