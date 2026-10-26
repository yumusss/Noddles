// Pause menu: resume, how-to, language, sound, restart, back to map.

import { useState } from 'react';
import { setLang, t, type Lang } from '../game/i18n';
import type { Save } from '../game/save';
import HowTo from './HowTo';

export function LangToggle({ lang }: { lang: Lang }) {
  return (
    <div className="lang-toggle" role="group">
      {(['tr', 'en'] as Lang[]).map((l) => (
        <button
          key={l}
          className={lang === l ? 'on' : ''}
          onClick={(e) => {
            e.stopPropagation();
            setLang(l);
          }}>
          {l === 'tr' ? 'Türkçe' : 'English'}
        </button>
      ))}
    </div>
  );
}

export default function PauseMenu({
  save,
  lang,
  onResume,
  onQuit,
  onRestart,
  onToggle,
}: {
  save: Save;
  lang: Lang;
  onResume: () => void;
  onQuit: () => void;
  onRestart: () => void;
  onToggle: (k: 'sfx' | 'music') => void;
}) {
  const [howto, setHowto] = useState(false);
  if (howto)
    return (
      <div className="modal solid">
        <HowTo onDone={() => setHowto(false)} />
      </div>
    );
  return (
    <div className="modal" onClick={onResume}>
      <div className="paper-card pause" onClick={(e) => e.stopPropagation()}>
        <h2>{t('pause')}</h2>
        <button className="btn coral big" onClick={onResume}>
          {t('resume')}
        </button>
        <button className="btn ghost" onClick={() => setHowto(true)}>
          {t('howto')}
        </button>
        <div className="row">
          <span>{t('language')}</span>
          <LangToggle lang={lang} />
        </div>
        <div className="row">
          <span>{t('sound')}</span>
          <button className="btn small ghost" onClick={() => onToggle('sfx')}>
            {save.sfx ? t('on') : t('off')}
          </button>
          <span>{t('music')}</span>
          <button className="btn small ghost" onClick={() => onToggle('music')}>
            {save.music ? t('on') : t('off')}
          </button>
        </div>
        <div className="row">
          <button className="btn ghost" onClick={onRestart}>
            {t('restart')}
          </button>
          <button className="btn ghost" onClick={onQuit}>
            {t('quit')}
          </button>
        </div>
      </div>
    </div>
  );
}
