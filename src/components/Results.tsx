import { useEffect, useState } from 'react';
import type { Level } from '../data';
import { Coin, Star } from '../art';
import { sfx } from '../audio';
import type { DayResult } from './Play';

export default function Results({
  level,
  result,
  onRetry,
  onNext,
  onMap,
}: {
  level: Level;
  result: DayResult;
  onRetry: () => void;
  onNext: () => void;
  onMap: () => void;
}) {
  const [shown, setShown] = useState(0);
  const [coins, setCoins] = useState(0);
  useEffect(() => {
    const timers: number[] = [];
    for (let i = 1; i <= result.stars; i++)
      timers.push(
        window.setTimeout(
          () => {
            setShown(i);
            sfx('star');
          },
          500 + i * 450
        )
      );
    const start = performance.now();
    const id = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - start) / 1200);
      setCoins(Math.round(result.coins * p));
      if (p >= 1) window.clearInterval(id);
    }, 30);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearInterval(id);
    };
  }, [result]);
  const pass = result.stars > 0;
  return (
    <div className="screen results">
      {pass && (
        <div className="confetti" aria-hidden="true">
          {Array.from({ length: 40 }, (_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 29) % 100}%`,
                animationDelay: `${(i % 10) * 0.15}s`,
                background: ['#ffd166', '#ef476f', '#06d6a0', '#3ba7ff', '#ff9f1c'][i % 5],
              }}
            />
          ))}
        </div>
      )}
      <div className="card results-card">
        <div className="chapter-heading">
          Bölüm {level.id} • {level.title}
        </div>
        <h2>
          {pass ? (result.stars === 3 ? 'Efsane bir gün!' : 'Gün tamam!') : 'Hedefe ulaşamadın'}
        </h2>
        <div className="big-stars">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`bs ${shown >= i ? 'pop' : ''}`}>
              <Star on={shown >= i} size={i === 2 ? 72 : 56} />
            </div>
          ))}
        </div>
        <div className="res-coins">
          <Coin size={28} /> {coins}
        </div>
        <div className="res-targets">
          {level.targets.map((t, i) => (
            <span key={i} className={result.coins >= t ? 'hit' : ''}>
              {'★'.repeat(i + 1)} {t}
            </span>
          ))}
        </div>
        <div className="res-stats">
          <div>
            <b>{result.served}</b>
            <span>servis</span>
          </div>
          <div>
            <b>{result.perfect}</b>
            <span>mükemmel</span>
          </div>
          <div>
            <b>{result.bestCombo}</b>
            <span>en iyi seri</span>
          </div>
          <div>
            <b>{result.lost}</b>
            <span>kaçan</span>
          </div>
        </div>
        {pass ? (
          <>
            <button className="btn big primary" onClick={onNext}>
              {level.id === 10 ? 'Finali izle' : 'Hikayeye devam'}
            </button>
            <button className="btn ghost" onClick={onRetry}>
              Tekrar oyna (daha çok yıldız)
            </button>
          </>
        ) : (
          <>
            <p className="res-tip">
              İpucu: Erişteyi yeşil bölgede çıkar, fazla malzeme koyma, sabırsız müşterilere öncelik
              ver.
            </p>
            <button className="btn big primary" onClick={onRetry}>
              Tekrar dene
            </button>
          </>
        )}
        <button className="btn ghost" onClick={onMap}>
          Harita
        </button>
      </div>
    </div>
  );
}
