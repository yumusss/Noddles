// Screen flow: title → map → day intro → (how-to on day 1 only) → play → ledger → outro → map.

import { useCallback, useState, useSyncExternalStore } from 'react';
import { dayDef, type DecorSlot, finaleLines, TOTAL_DAYS } from './game/data';
import { getLang, onLang } from './game/i18n';
import {
  applyReply,
  loadSave,
  ratingOf,
  type ReplyKind,
  type Save,
  tipBonus,
  writeSave,
} from './game/save';
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
  | { k: 'ledger'; day: number; s: Session; before: number; after: number }
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

  const update = useCallback((f: (s: Save) => Save) => {
    setSave((prev) => {
      const next = f(prev);
      setSfx(next.sfx);
      setMusic(next.music);
      writeSave(next);
      return next;
    });
  }, []);

  const replySaved = useCallback(
    (id: string, kind: ReplyKind) =>
      update((s) => {
        const reviews = s.reviews.map((r) => ({ ...r }));
        const r = reviews.find((x) => x.id === id);
        if (r) applyReply(r, kind);
        return { ...s, reviews };
      }),
    [update]
  );

  const startDay = (day: number) => {
    unlockAudio();
    startMusic();
    setScreen({ k: 'intro', day });
  };

  const finishDay = (s: Session) => {
    const day = s.n;
    const before = ratingOf(save.reviews);
    const reviews = [...save.reviews, ...s.reviews];
    const after = ratingOf(reviews);
    update((sv) => {
      const stars = [...sv.stars];
      stars[day] = Math.max(stars[day] ?? 0, s.stars);
      const history = [...sv.history];
      history[day] = {
        net: Math.round(s.net),
        served: s.ledger.served,
        stars: s.stars,
        dayRating: s.dayRating,
        rating: after,
      };
      return {
        ...sv,
        stars,
        history,
        wallet: Math.max(0, Math.round(sv.wallet + s.net)),
        unlocked: Math.min(TOTAL_DAYS, Math.max(sv.unlocked, day + 1)),
        reviews: [...sv.reviews, ...s.reviews].slice(-120),
      };
    });
    setScreen({ k: 'ledger', day, s, before, after });
  };

  const decor = save.equipped as Record<DecorSlot, string>;
  const wrap = (el: React.ReactNode) => <div className="app">{el}</div>;

  switch (screen.k) {
    case 'title':
      return wrap(<Title onPlay={() => setScreen({ k: 'map' })} save={save} />);
    case 'map':
      return wrap(
        <MapScreen
          save={save}
          onDay={startDay}
          onDecor={() => setScreen({ k: 'decor' })}
          onTitle={() => setScreen({ k: 'title' })}
          onReply={replySaved}
        />
      );
    case 'decor':
      return wrap(<DecorShop save={save} update={update} onBack={() => setScreen({ k: 'map' })} />);
    case 'intro': {
      const d = dayDef(screen.day);
      return wrap(
        <Story
          key={'i' + d.n}
          day={d}
          lines={d.intro}
          mode="intro"
          decor={decor}
          onDone={() =>
            setScreen(d.n === 1 ? { k: 'howto', day: 1 } : { k: 'play', day: d.n, key: Date.now() })
          }
        />
      );
    }
    case 'howto':
      return wrap(
        <HowTo
          onDone={() => {
            update((s) => ({ ...s, seenHowTo: true }));
            setScreen({ k: 'play', day: screen.day, key: Date.now() });
          }}
        />
      );
    case 'play':
      return wrap(
        <Play
          key={screen.key}
          day={dayDef(screen.day)}
          save={save}
          tipBonus={tipBonus(save)}
          onDone={finishDay}
          onQuit={() => setScreen({ k: 'map' })}
          onRestart={() => setScreen({ k: 'play', day: screen.day, key: Date.now() })}
          onToggle={(k) => update((s) => ({ ...s, [k]: !s[k] }))}
          onReplySaved={replySaved}
        />
      );
    case 'ledger':
      return wrap(
        <Ledger
          s={screen.s}
          wallet={save.wallet}
          history={save.history}
          ratingBefore={screen.before}
          ratingAfter={screen.after}
          onNext={() => setScreen({ k: 'outro', day: screen.day })}
        />
      );
    case 'outro': {
      const d = dayDef(screen.day);
      const lines = d.n === TOTAL_DAYS ? finaleLines(ratingOf(save.reviews)) : d.outro;
      return wrap(
        <Story
          key={'o' + d.n}
          day={d}
          lines={lines}
          mode="outro"
          decor={decor}
          onDone={() => setScreen({ k: 'map' })}
        />
      );
    }
  }
}
