import { useEffect, useState } from 'react';
import type { Level } from '../data';
import { Star } from '../art';
import { fmt, net } from '../money';
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
      void p;
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
        <Ledger result={result} />
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

function Ledger({ result }: { result: DayResult }) {
  const l = result.ledger;
  const n = net(l);
  const income: [string, number][] = [
    [`Satışlar (${l.bowls - l.unpaid} kase)`, l.sales],
    ['Bahşiş kavanozu', l.tips],
  ];
  if (l.bonus) income.push(['Özel misafir bonusu', l.bonus]);
  const costs: [string, number][] = [['Malzeme gideri', l.ingredients]];
  if (l.waste) costs.push(['Çöpe giden kaseler', l.waste]);
  if (l.overChange) costs.push(['Fazla verilen para üstü', l.overChange]);
  costs.push(['Dükkân kirası', l.rent], ['Elektrik, su & gaz', l.utilities]);
  return (
    <div className="ledger">
      <div className="lg-title">Günlük hesap defteri</div>
      {income.map(([k, v]) => (
        <div key={k} className="lg-row in">
          <span>{k}</span>
          <b>+{fmt(v)}</b>
        </div>
      ))}
      {costs.map(([k, v]) => (
        <div key={k} className="lg-row out">
          <span>{k}</span>
          <b>−{fmt(v)}</b>
        </div>
      ))}
      {l.unpaid > 0 && <div className="lg-note">{l.unpaid} müşteri beğenmediği için ödemedi.</div>}
      {l.changeMistakes > 0 && (
        <div className="lg-note">Para üstünde {l.changeMistakes} hata yaptın.</div>
      )}
      <div className={`lg-row total ${n >= 0 ? 'pos' : 'neg'}`}>
        <span>{n >= 0 ? 'Günlük kâr' : 'Günlük zarar'}</span>
        <b>
          {n >= 0 ? '+' : ''}
          {fmt(n)}
        </b>
      </div>
      {result.cashAfter !== undefined && (
        <div className="lg-cash">
          <span>Kasadaki para</span>
          <b>
            {fmt(result.cashBefore ?? 0)} →{' '}
            <em className={n >= 0 ? 'pos' : 'neg'}>{fmt(result.cashAfter)}</em>
          </b>
        </div>
      )}
    </div>
  );
}
