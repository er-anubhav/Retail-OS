import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import type { Metric, Tone } from '@/lib/types';
import { BrutalCard } from './BrutalCard';
import { StatusBadge } from './StatusBadge';

/** Hard-edged bar sparkline. Solid blocks with hard borders. */
export function Sparkline({
  values,
  tone = 'ink',
  className,
  height = 36,
}: {
  values: number[];
  tone?: Tone;
  className?: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  return (
    <div
      className={cn('flex items-end gap-1', className)}
      style={{ height }}
      aria-hidden="true"
    >
      {values.map((v, i) => {
        const pct = 15 + ((v - min) / span) * 85;
        return (
          <span
            key={i}
            className={cn('flex-1 rounded-sm border-2 border-ink', TONE_SOLID[tone])}
            style={{ height: `${pct}%` }}
          />
        );
      })}
    </div>
  );
}

function TrendChip({ metric }: { metric: Metric }) {
  const { trend } = metric;
  if (!trend) return null;
  const Icon =
    trend.direction === 'up' ? ArrowUpRight : trend.direction === 'down' ? ArrowDownRight : ArrowRight;
  const good = trend.good;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border-2 border-ink px-2.5 py-0.5 font-mono text-xs font-black hard-shadow-xs tnum',
        good ? 'bg-lime text-ink' : 'bg-coral text-cream',
      )}
      title={trend.label}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={3} />
      {trend.value > 0 ? '+' : ''}
      {trend.value}%
    </span>
  );
}

export interface MetricCardProps {
  metric: Metric;
  spark?: number[];
  index?: string;
  className?: string;
  /** Fills the card with the accent colour for the primary KPI row. */
  emphasis?: boolean;
}

export function MetricCard({ metric, spark, index, className, emphasis }: MetricCardProps) {
  const decimals = metric.precision ?? 0;
  const display = metric.value.toFixed(decimals);

  return (
    <BrutalCard
      className={cn('group relative overflow-hidden', className)}
      tone={metric.tone}
      interactive
      padding="none"
    >
      {/* Editorial watermark index */}
      {index && (
        <span className="pointer-events-none absolute -right-2 top-0 select-none font-grotesk font-black leading-none text-ink/[0.05] text-8xl">
          {index}
        </span>
      )}

      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-ink/75">
            {metric.label}
          </span>
          {metric.trend && <TrendChip metric={metric} />}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-grotesk text-5xl sm:text-6xl font-black leading-none tracking-tight text-ink tnum">
            {display}
          </span>
          {metric.unit && (
            <span className={cn('text-xl font-bold font-mono opacity-85', TONE_TEXT[metric.tone])}>
              {metric.unit}
            </span>
          )}
        </div>

        {spark && <Sparkline values={spark} tone={metric.tone} height={34} />}

        {metric.footnote && (
          <div className="rounded-xl border-2 border-ink/25 bg-sand/80 p-2.5 font-mono text-xs text-ink/80 leading-relaxed">
            {metric.footnote}
          </div>
        )}
      </div>

      {emphasis && (
        <div
          className={cn('absolute inset-y-0 left-0 w-2 border-r-2 border-ink', TONE_SOLID[metric.tone])}
        />
      )}
    </BrutalCard>
  );
}

/** Wide, dense metric row used inside panels where a full card would be noise. */
export function MetricRow({ metric, className }: { metric: Metric; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-b-2 border-ink/15 py-3 last:border-b-0',
        className,
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-bold uppercase tracking-wider text-ink/75">
          {metric.label}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink/70 font-mono">{metric.footnote}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="font-grotesk text-2xl font-black leading-none tracking-tight text-ink tnum">
          {metric.value.toFixed(metric.precision ?? 0)}
          <span className="ml-1 text-sm font-mono font-bold text-ink/70">{metric.unit}</span>
        </span>
        {metric.trend && (
          <StatusBadge tone={metric.trend.good ? 'lime' : 'coral'} size="sm">
            {metric.trend.value > 0 ? '+' : ''}
            {metric.trend.value}%
          </StatusBadge>
        )}
      </div>
    </div>
  );
}
