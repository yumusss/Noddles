// Title screen: the hut window at dusk with snow falling, the cast peeking in.

import { t } from '../game/i18n';
import type { DecorSlot } from '../game/data';
import type { Save } from '../game/save';
import Backdrop from './Backdrop';
import { Portrait } from './Avatar';
import { LangToggle } from './PauseMenu';
import { useLang } from '../App';

export default function Title({ onPlay, save }: { onPlay: () => void; save: Save }) {
  const lang = useLang();
  return (
    <div className="screen title">
      <Backdrop time="sunset" snow="light" decor={save.equipped as Record<DecorSlot, string>} />
      <div className="title-logo">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </div>
      <div className="title-cast">
        <Portrait who="tusk" size={170} />
        <Portrait who="pip" size={130} />
        <Portrait who="hazel" size={160} />
      </div>
      <div className="title-actions">
        <button className="btn coral big" onClick={onPlay}>
          {save.unlocked > 1 ? t('continue') : t('play')}
        </button>
        <LangToggle lang={lang} />
      </div>
    </div>
  );
}
