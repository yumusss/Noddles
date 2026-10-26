// Screen flow: title → map → day intro → (how-to on day 1) → play → ledger → day outro → map.

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { DAYS, dayDef, PLAYABLE_DAYS, TOTAL_DAYS } from './game/data';
import { getLang, onLang } from './game/i18n';
import { loadSave, type Save, tipBonus, writeSave } from './game/save';
import { setMusic, setSfx, startMusic, unlockAudio } from './game/audio';
import type { Session } from './game/session';
import Title from './ui/Title';
import MapScreen from './ui/MapScreen';
import Story from './ui/Story';
import HowTo from './ui/HowTo';
import Play from './ui/Play';
import Ledger from './ui/Ledger';
import DecorShop from './ui/DecorShop';

type Screen =
  | { k: 'title' }
  | { k: 'map' }
  | { k: 'intro'; day: number }
  | { k: 'howto'; day: number }
  | { k: 'play'; day: number; key: number }
  | { k: 'ledger'; day: number; s: Session }
  | { k: 'outro'; day: number }
  | { k: 'decor' };

export function useLang() {
  return useSyncExternalStore(
    (f) => onLang(f),
    () => getLang()
  );
}

export default function App() {
  useLang();
  const [save, setSave] = useState<Save>(() => loadSave());
  const [screen, setScreen] = useState<Screen>({ k: 'title' });

  useEffect(() => {
    setSfx(save.sfx);
    setMusic(save.music);
  }, [save.sfx, save.music]);

  const update = useCallback((f: (s: Save) => Save) => {
    setSave((prev) => {
      const next = f(prev);
      writeSave(next);
      return next;
    });
  }, []);

  const startDay = (day: number) => {
    unlockAudio();
    startMusic();
    setScreen({ k: 'intro', day });
  };

  const finishDay = (s: Session) => {
    const day = s.n;
    update((sv) => {
      const stars = [...sv.stars];
      stars[day] = Math.max(stars[day] ?? 0, s.stars);
      return {
        ...sv,
        stars,
        wallet: Math.max(0, Math.round(sv.wallet + s.net)),
        unlocked: Math.min(PLAYABLE_DAYS, Math.max(sv.unlocked, day + 1), TOTAL_DAYS),
        reviews: [...sv.reviews, ...s.reviews].slice(-40),
        deliveries: [
          ...sv.deliveries,
          ...s.online
            .filter((o) => o.status === 'delivered' && o.stars)
            .map((o) => ({ day, name: s.name(o), summary: '', stars: o.stars ?? 0 })),
        ].slice(-40),
      };
    });
    setScreen({ k: 'ledger', day, s });
  };

  switch (screen.k) {
    case 'title':
      return (
        <div className="app">
          <Title onPlay={() => setScreen({ k: 'map' })} save={save} />
        </div>
      );
    case 'map':
      return (
        <div className="app">
          <MapScreen
            save={save}
            onDay={startDay}
            onDecor={() => setScreen({ k: 'decor' })}
            onTitle={() => setScreen({ k: 'title' })}
            onToggle={(k) => update((s) => ({ ...s, [k]: !s[k] }))}
          />
        </div>
      );
    case 'decor':
      return (
        <div className="app">
          <DecorShop save={save} update={update} onBack={() => setScreen({ k: 'map' })} />
        </div>
      );
    case 'intro': {
      const d = dayDef(screen.day);
      return (
        <div className="app">
          <Story
            day={d}
            lines={d.intro}
            mode="intro"
            onDone={() =>
              setScreen(
                screen.day === 1
                  ? { k: 'howto', day: 1 }
                  : { k: 'play', day: screen.day, key: Date.now() }
              )
            }
          />
        </div>
      );
    }
    case 'howto':
      return (
        <div className="app">
          <HowTo
            onDone={() => {
              update((s) => ({ ...s, seenHowTo: true }));
              setScreen({ k: 'play', day: screen.day, key: Date.now() });
            }}
          />
        </div>
      );
    case 'play':
      return (
        <div className="app">
          <Play
            key={screen.key}
            day={dayDef(screen.day)}
            save={save}
            tipBonus={tipBonus(save)}
            onDone={finishDay}
            onQuit={() => setScreen({ k: 'map' })}
            onRestart={() => setScreen({ k: 'play', day: screen.day, key: Date.now() })}
            onToggle={(k) => update((s) => ({ ...s, [k]: !s[k] }))}
          />
        </div>
      );
    case 'ledger':
      return (
        <div className="app">
          <Ledger
            s={screen.s}
            wallet={save.wallet}
            onNext={() => setScreen({ k: 'outro', day: screen.day })}
          />
        </div>
      );
    case 'outro': {
      const d = dayDef(screen.day);
      return (
        <div className="app">
          <Story day={d} lines={d.outro} mode="outro" onDone={() => setScreen({ k: 'map' })} />
        </div>
      );
    }
  }
}

export const _days = DAYS;
