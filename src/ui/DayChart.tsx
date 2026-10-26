// The day chart: profit bars and the Yumm rating line for each of the ten days,
// with the festival goal as a dashed line.

import { GOAL_RATING, TOTAL_DAYS } from '../game/data';
import { money, t } from '../game/i18n';
import type { DayStat } from '../game/save';

export default function DayChart({
  history,
  highlight,
  compact = false,
}: {
  history: (DayStat | null)[];
  highlight?: number;
  compact?: boolean;
}) {
  const W = 560;
  const H = compact ? 200 : 250;
  const padL = 44;
  const padR = 40;
  const padT = 22;
  const padB = 34;
  const cw = (W - padL - padR) / TOTAL_DAYS;
  const nets = history.slice(1).map((h) => h?.net ?? 0);
  const maxNet = Math.max(100, ...nets.map((n) => Math.abs(n)));
  const ph = H - padT - padB;
  const zeroY = padT + ph * (maxNet / (maxNet * 1.15)) * 0.85;
  const yNet = (v: number) => zeroY - (v / maxNet) * (zeroY - padT);
  const yRate = (r: number) => padT + ph - ((r - 1) / 4) * ph;
  const pts: string[] = [];
  history.slice(1).forEach((h, i) => {
    if (h) pts.push(`${padL + cw * (i + 0.5)},${yRate(h.rating)}`);
  });
  return (
    <figure className="day-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('chart')}>
        {/* rating grid (right axis) */}
        {[1, 2, 3, 4, 5].map((r) => (
          <g key={r}>
            <line x1={padL} x2={W - padR} y1={yRate(r)} y2={yRate(r)} className="grid" />
            <text x={W - padR + 8} y={yRate(r) + 4} className="axis">
              {r}★
            </text>
          </g>
        ))}
        <line
          x1={padL}
          x2={W - padR}
          y1={yRate(GOAL_RATING)}
          y2={yRate(GOAL_RATING)}
          className="goal"
        />
        <text x={W - padR - 4} y={yRate(GOAL_RATING) - 6} className="goal-label">
          {t('goal')} {GOAL_RATING.toFixed(1)}★
        </text>
        <line x1={padL} x2={W - padR} y1={zeroY} y2={zeroY} className="zero" />
        {history.slice(1).map((h, i) => {
          const x = padL + cw * i + cw * 0.18;
          const w = cw * 0.64;
          const n = h?.net ?? 0;
          const y0 = Math.min(yNet(n), zeroY);
          const hh = Math.abs(yNet(n) - zeroY);
          return (
            <g key={i}>
              {h ? (
                <rect
                  x={x}
                  y={y0}
                  width={w}
                  height={Math.max(2, hh)}
                  rx={4}
                  className={'bar' + (n < 0 ? ' neg' : '') + (highlight === i + 1 ? ' hl' : '')}>
                  <title>{money(n)}</title>
                </rect>
              ) : (
                <rect x={x} y={zeroY - 2} width={w} height={4} rx={2} className="bar empty" />
              )}
              <text
                x={padL + cw * (i + 0.5)}
                y={H - 12}
                className={'axis day' + (highlight === i + 1 ? ' hl' : '')}>
                {i + 1}
              </text>
            </g>
          );
        })}
        {pts.length > 1 && <polyline points={pts.join(' ')} className="line" />}
        {history
          .slice(1)
          .map((h, i) =>
            h ? (
              <circle
                key={i}
                cx={padL + cw * (i + 0.5)}
                cy={yRate(h.rating)}
                r={highlight === i + 1 ? 6 : 4.5}
                className="dot"
              />
            ) : null
          )}
        <text x={6} y={padT - 6} className="axis left">
          {t('profit')}
        </text>
      </svg>
      <figcaption>
        <span className="key bar-key" /> {t('profit')}
        <span className="key line-key" /> {t('rating')}
      </figcaption>
    </figure>
  );
}
