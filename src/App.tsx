import { useCallback, useEffect, useState } from 'react';
import { LEVELS } from './data';
import { setMusic, setSfx, sfx, startMusic, stopMusic, unlockAudio } from './audio';
import Title from './components/Title';
import LevelMap from './components/LevelMap';
import Story from './components/Story';
import Unlock from './components/Unlock';
import Play, { type DayResult } from './components/Play';
import Results from './components/Results';
import Ending from './components/Ending';

export interface Save {
  reached: number;
  stars: number[];
  best: number[];
  sfx: boolean;
  music: boolean;
}

const KEY = 'noddles-save-v1';
const fresh: Save = {
  reached: 1,
  stars: Array(10).fill(0),
  best: Array(10).fill(0),
  sfx: true,
  music: true,
};

function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh, ...JSON.parse(raw) };
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
  | { s: 'ending' };

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

  const finishDay = (level: number, result: DayResult) => {
    setSave((s) => {
      const stars = [...s.stars];
      const best = [...s.best];
      stars[level - 1] = Math.max(stars[level - 1], result.stars);
      best[level - 1] = Math.max(best[level - 1], result.coins);
      const reached = result.stars > 0 ? Math.max(s.reached, Math.min(10, level + 1)) : s.reached;
      return { ...s, stars, best, reached: level === 10 && result.stars > 0 ? 11 : reached };
    });
    setScreen({ s: 'results', level, result });
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
          onEnding={() => setScreen({ s: 'ending' })}
        />
      )}
      {screen.s === 'intro' && (
        <Story
          key={'i' + screen.level}
          heading={`Bölüm ${screen.level}`}
          title={LEVELS[screen.level - 1].title}
          lines={LEVELS[screen.level - 1].intro}
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
          onDone={(r) => finishDay(screen.level, r)}
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
          onDone={() => {
            if (screen.level === 10) setScreen({ s: 'ending' });
            else startLevel(screen.level + 1);
          }}
        />
      )}
      {screen.s === 'ending' && <Ending save={save} onMap={() => setScreen({ s: 'map' })} />}
    </div>
  );
}
