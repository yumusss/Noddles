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
          Gün {level.id} • {level.title}
        </div>
        <h2>
          {pass
            ? result.stars === 3
              ? 'Efsane bir gün!'
              : 'Gün tamam!'
            : 'Mahalle pek memnun kalmadı'}
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
          <span className={result.avg >= 55 ? 'hit' : ''}>★ %55</span>
          <span className={result.avg >= 75 ? 'hit' : ''}>★★ %75</span>
          <span className={result.avg >= 90 ? 'hit' : ''}>★★★ %90</span>
        </div>
        <div className="res-stats">
          <div>
            <b>%{result.avg}</b>
            <span>ort. memnuniyet</span>
          </div>
          <div>
            <b>{result.served}</b>
            <span>servis</span>
          </div>
          <div>
            <b>{result.perfect}</b>
            <span>mükemmel</span>
          </div>
          <div>
            <b>{result.unhappy}</b>
            <span>mutsuz</span>
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
              İpucu: Siparişi dikkatle oku. Adetleri tam tut, istenmeyen malzeme koyma, suyu çizgiye
              kadar doldur ve erişteyi tam kıvamında çıkar.
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
