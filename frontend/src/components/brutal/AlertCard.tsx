import { BellRing, Camera, Check, ShieldAlert } from 'lucide-react';
import { cn, clock, relativeTime } from '@/lib/utils';
import { LEVEL_LABEL, LEVEL_TONE, TONE_BG, TONE_TEXT } from '@/lib/tone';
import type { AlertItem } from '@/lib/types';
import { BrutalButton } from './BrutalButton';
import { MicroLabel, StatusBadge } from './StatusBadge';

export interface AlertCardProps {
  alert: AlertItem;
  onAcknowledge?: (id: string) => void;
  onResolve?: (id: string) => void;
  compact?: boolean;
  className?: string;
}

export function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  compact = false,
  className,
}: AlertCardProps) {
  const tone = LEVEL_TONE[alert.level];
  const critical = alert.level === 'critical';
  const resolved = alert.level === 'resolved';

  return (
    <article
      className={cn(
        'relative flex overflow-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-ink bg-white hard-shadow-sm text-ink transition-all',
        alert.isNew && 'animate-pop',
        critical && 'hard-shadow',
        className,
      )}
    >
      {/* Accent strip */}
      <div
        className={cn(
          'w-3.5 shrink-0 border-r-2 border-ink',
          critical ? 'bg-coral' : TONE_BG[tone],
        )}
        aria-hidden="true"
      />

      <div className={cn('min-w-0 flex-1', compact ? 'p-3.5' : 'p-5 sm:p-6')}>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge tone={tone} size="sm" dot={critical} pulse={critical}>
            {LEVEL_LABEL[alert.level]}
          </StatusBadge>

          {alert.isNew && (
            <span className="inline-flex items-center rounded-full border-2 border-ink bg-coral px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-cream hard-shadow-xs">
              NEW
            </span>
          )}

          <span className="ml-auto flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink/70">
            <span className="tnum font-bold text-ink">{clock(alert.at)}</span>
            <span className="text-ink/30">/</span>
            <span>{relativeTime(alert.at)}</span>
          </span>
        </div>

        <h3
          className={cn(
            'mt-2.5 font-grotesk font-black uppercase tracking-tight text-ink',
            compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl md:text-2xl',
            resolved && 'text-ink/50 line-through decoration-2',
          )}
        >
          {alert.title}
        </h3>

        <p className={cn('mt-1 flex items-center gap-1.5', TONE_TEXT[tone])}>
          <span className="font-mono text-xs font-bold uppercase tracking-wider">
            {alert.location}
          </span>
        </p>

        {!compact && (
          <p className="mt-2 max-w-2xl font-mono text-xs sm:text-sm leading-relaxed text-ink/80">
            {alert.detail}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5 border-t-2 border-dashed border-ink/20 pt-3">
          <MicroLabel className="flex items-center gap-1.5">
            <Camera className="size-4 stroke-[2.5]" />
            {alert.camera}
          </MicroLabel>

          <span className="flex items-center gap-2">
            <MicroLabel>CONF:</MicroLabel>
            <span className="flex h-3 w-16 rounded-full border border-ink overflow-hidden bg-sand">
              <span
                className={cn('h-full', TONE_BG[tone].split(' ')[0])}
                style={{ width: `${Math.round(alert.confidence * 100)}%` }}
              />
            </span>
            <span className="font-mono text-xs font-bold text-ink tnum">
              {Math.round(alert.confidence * 100)}%
            </span>
          </span>

          {!compact && (onAcknowledge || onResolve) && (
            <span className="ml-auto flex items-center gap-2.5">
              {onAcknowledge && (
                <BrutalButton
                  size="sm"
                  variant={alert.acknowledged ? 'secondary' : 'primary'}
                  icon={<Check strokeWidth={3} />}
                  disabled={alert.acknowledged}
                  onClick={() => onAcknowledge(alert.id)}
                >
                  {alert.acknowledged ? 'ACKED' : 'ACKNOWLEDGE'}
                </BrutalButton>
              )}
              {onResolve && (
                <BrutalButton
                  size="sm"
                  variant="success"
                  icon={<ShieldAlert strokeWidth={3} />}
                  disabled={alert.level === 'resolved'}
                  onClick={() => onResolve(alert.id)}
                >
                  RESOLVE
                </BrutalButton>
              )}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/** One-line alert used in tight side panels. */
export function AlertLine({
  alert,
  onClick,
  className,
}: {
  alert: AlertItem;
  onClick?: () => void;
  className?: string;
}) {
  const tone = LEVEL_TONE[alert.level];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border-2 border-ink/15 px-3 py-2.5 text-left transition-colors hover:bg-sand/60 cursor-pointer',
        className,
      )}
    >
      <span
        className={cn('size-3 rounded-full border-2 border-ink shrink-0', TONE_BG[tone].split(' ')[0])}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 font-mono">
        <span className="block truncate text-xs font-bold uppercase tracking-wider text-ink">
          {alert.title}
        </span>
        <span className="block truncate text-[11px] text-ink/70">{alert.location}</span>
      </span>
      <span className="shrink-0 font-mono text-[11px] text-ink/65 tnum">
        {relativeTime(alert.at)}
      </span>
      {alert.level === 'critical' && !alert.acknowledged && (
        <BellRing className="size-4 shrink-0 animate-pulse text-coral stroke-[2.5]" />
      )}
    </button>
  );
}
