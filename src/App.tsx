import { useCallback, useEffect, useState } from 'react';
import { LEVELS } from './game/data';
import { setMusic, setSfx, sfx, startMusic, stopMusic, unlockAudio } from './game/audio';
import { DEFAULT_DECOR, DEFAULT_OWNED, withDefaults, type DecorState } from './game/decor';
import type { DayResult } from './game/session';
import Title from './ui/Title';
import LevelMap from './ui/LevelMap';
import Story from './ui/Story';
import Unlock from './ui/Unlock';
import Play from './ui/Play';
import Results from './ui/Results';
import DecorShop from './ui/DecorShop';
import Ending from './ui/Ending';

export interface Save {
  reached: number; // highest unlocked level (1..11)
  cash: number;
  decor: DecorState;
  owned: string[];
  stars: number[];
  best: number[];
  tipCoins: number;
  sfx: boolean;
  music: boolean;
}

const KEY = 'noddles-save-v2';
const fresh: Save = {
  reached: 1,
  cash: 600,
  decor: DEFAULT_DECOR,
  owned: DEFAULT_OWNED,
  stars: Array(10).fill(0),
  best: Array(10).fill(0),
  tipCoins: 0,
  sfx: true,
  music: true,
};

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = { ...fresh, ...JSON.parse(raw) } as Save;
      s.decor = withDefaults(s.decor);
      return s;
    }
  } catch {
    /* storage unavailable */
  }
  return fresh;
}

type Screen =
  | { s: 'title' }
  | { s: 'map' }
  | { s: 'intro'; level: number }
  | { s: 'unlock'; level: number }
  | { s: 'play'; level: number; key: number }
  | { s: 'results'; level: number; result: DayResult }
  | { s: 'outro'; level: number }
  | { s: 'ending' }
  | { s: 'decor' };

export default function App() {
  const [save, setSave] = useState<Save>(load);
  const [screen, setScreen] = useState<Screen>({ s: 'title' });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(save));
    } catch {
      /* ignore */
    }
    setSfx(save.sfx);
    setMusic(save.music);
  }, [save]);

  const toggle = useCallback((k: 'sfx' | 'music') => {
    setSave((s) => {
      const n = { ...s, [k]: !s[k] };
      if (k === 'music') {
        setMusic(n.music);
        if (n.music) startMusic();
        else stopMusic();
      }
      return n;
    });
  }, []);

  const startLevel = (level: number) => {
    unlockAudio();
    if (save.music) startMusic();
    setScreen({ s: 'intro', level });
  };

  const finishDay = (level: number, result: DayResult, tipCoins: number) => {
    setSave((s) => {
      const stars = [...s.stars];
      const best = [...s.best];
      stars[level - 1] = Math.max(stars[level - 1], result.stars);
      best[level - 1] = Math.max(best[level - 1], Math.round(result.avg));
      let reached = s.reached;
      if (result.stars > 0) reached = Math.max(reached, Math.min(11, level + 1));
      return { ...s, cash: result.cashAfter, stars, best, reached, tipCoins };
    });
    setScreen({ s: 'results', level, result });
  };

  const reset = () => {
    setSave(fresh);
    setScreen({ s: 'title' });
  };

  return (
    <div className="app">
      {screen.s === 'title' && (
        <Title
          hasSave={save.reached > 1 || save.stars[0] > 0}
          onPlay={() => {
            unlockAudio();
            sfx('door');
            if (save.music) startMusic();
            if (save.reached === 1 && save.stars[0] === 0) startLevel(1);
            else setScreen({ s: 'map' });
          }}
        />
      )}
      {screen.s === 'map' && (
        <LevelMap
          save={save}
          onPick={startLevel}
          onBack={() => setScreen({ s: 'title' })}
          onToggle={toggle}
          onReset={reset}
          onEnding={() => setScreen({ s: 'ending' })}
          onDecor={() => setScreen({ s: 'decor' })}
        />
      )}
      {screen.s === 'decor' && (
        <DecorShop
          save={save}
          onChange={(cash, decor, owned) => setSave((s) => ({ ...s, cash, decor, owned }))}
          onBack={() => setScreen({ s: 'map' })}
        />
      )}
      {screen.s === 'intro' && (
        <Story
          key={'i' + screen.level}
          heading={`${screen.level}. Gün`}
          title={LEVELS[screen.level - 1].title}
          lines={LEVELS[screen.level - 1].intro}
          decor={save.decor}
          tod={LEVELS[screen.level - 1].time}
          rain={LEVELS[screen.level - 1].rain}
          onDone={() => setScreen({ s: 'unlock', level: screen.level })}
        />
      )}
      {screen.s === 'unlock' && (
        <Unlock
          level={LEVELS[screen.level - 1]}
          onDone={() => setScreen({ s: 'play', level: screen.level, key: Date.now() })}
        />
      )}
      {screen.s === 'play' && (
        <Play
          key={screen.key}
          levelId={screen.level}
          save={save}
          onToggle={toggle}
          onDone={(r, coins) => finishDay(screen.level, r, coins)}
          onQuit={() => setScreen({ s: 'map' })}
          onRestart={() => setScreen({ s: 'play', level: screen.level, key: Date.now() })}
        />
      )}
      {screen.s === 'results' && (
        <Results
          level={LEVELS[screen.level - 1]}
          result={screen.result}
          onRetry={() => setScreen({ s: 'play', level: screen.level, key: Date.now() })}
          onNext={() => setScreen({ s: 'outro', level: screen.level })}
          onMap={() => setScreen({ s: 'map' })}
        />
      )}
      {screen.s === 'outro' && (
        <Story
          key={'o' + screen.level}
          heading="Gün sonu"
          title={LEVELS[screen.level - 1].title}
          lines={LEVELS[screen.level - 1].outro}
          decor={save.decor}
          tod="gunbatimi"
          onDone={() => {
            if (screen.level === 10) setScreen({ s: 'ending' });
            else setScreen({ s: 'map' });
          }}
        />
      )}
      {screen.s === 'ending' && <Ending save={save} onMap={() => setScreen({ s: 'map' })} />}
    </div>
  );
}
