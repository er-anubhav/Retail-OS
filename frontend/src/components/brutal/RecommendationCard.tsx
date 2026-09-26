import { useState } from 'react';
import { ArrowRight, Check, Clock, User, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRIORITY_TONE, TONE_TEXT } from '@/lib/tone';
import type { Recommendation } from '@/lib/types';
import { BrutalButton } from './BrutalButton';
import { BrutalCard } from './BrutalCard';
import { StatusBadge } from './StatusBadge';

export interface RecommendationCardProps {
  recommendation: Recommendation;
  onApply?: (id: string) => void;
  className?: string;
}

export function RecommendationCard({ recommendation, onApply, className }: RecommendationCardProps) {
  const [state, setState] = useState<'open' | 'applied' | 'dismissed'>('open');
  const tone = PRIORITY_TONE[recommendation.priority];

  if (state === 'dismissed') {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-ink/40 bg-sand/40 px-5 py-4',
          className,
        )}
      >
        <span className="font-mono text-xs uppercase tracking-wider text-ink/60 line-through">
          {recommendation.title}
        </span>
        <BrutalButton size="sm" variant="secondary" onClick={() => setState('open')}>
          UNDO
        </BrutalButton>
      </div>
    );
  }

  return (
    <BrutalCard
      className={cn(className, state === 'applied' && 'shadow-none')}
      tone={tone}
      padding="none"
      interactive={state === 'open'}
    >
      <div className="flex flex-col gap-4 p-5 sm:p-6 font-mono text-ink">
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge tone={tone} size="sm" dot pulse={recommendation.priority === 'critical'}>
            {recommendation.priority.toUpperCase()} PRIORITY
          </StatusBadge>
          <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-0.5 text-xs font-bold uppercase tracking-wider hard-shadow-xs">
            <Clock className="size-3.5 stroke-[2.5]" />
            {recommendation.window}
          </span>
          {state === 'applied' && (
            <StatusBadge tone="lime" size="sm">
              ACTIONED
            </StatusBadge>
          )}
        </div>

        <h3 className="flex items-start gap-2.5 font-grotesk text-xl sm:text-2xl font-black uppercase tracking-tight text-ink">
          <Zap className="mt-0.5 size-5 shrink-0 stroke-[2.5] text-amber-500" />
          <span>{recommendation.title}</span>
        </h3>

        <div className="border-l-3 border-ink/30 pl-3.5 py-0.5">
          <p className="text-xs font-bold uppercase tracking-wider text-ink/75">
            Why the system recommends this:
          </p>
          <p className="mt-1 text-xs sm:text-sm text-ink/80 leading-relaxed font-sans">{recommendation.reason}</p>
        </div>

        <div
          className={cn(
            'rounded-xl border-2 border-ink/30 p-3 sm:p-4 transition-colors',
            state === 'applied' ? 'bg-lime/30 border-lime' : 'bg-sand/70',
          )}
        >
          <p className="text-[11px] font-black uppercase tracking-wider text-ink/70">
            Suggested Operational Action
          </p>
          <p className="mt-1 font-grotesk text-sm sm:text-base font-bold uppercase tracking-wide text-ink">
            {recommendation.action}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className={cn('text-xs font-bold uppercase tracking-wider', TONE_TEXT[tone])}>
            Impact: {recommendation.impact}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/70">
            <User className="size-3.5 stroke-[2.5]" />
            {recommendation.owner}
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2.5 border-t-2 border-ink/15 pt-3.5">
          <BrutalButton
            variant={state === 'applied' ? 'success' : 'primary'}
            size="md"
            icon={state === 'applied' ? <Check strokeWidth={3} /> : <ArrowRight strokeWidth={3} />}
            onClick={() => {
              setState(state === 'applied' ? 'open' : 'applied');
              onApply?.(recommendation.id);
            }}
          >
            {state === 'applied' ? 'ACTIONED' : 'APPLY ACTION'}
          </BrutalButton>
          {state === 'open' && (
            <BrutalButton
              variant="secondary"
              size="md"
              icon={<X strokeWidth={3} />}
              onClick={() => setState('dismissed')}
            >
              DISMISS
            </BrutalButton>
          )}
        </div>
      </div>

      {state === 'applied' && (
        <div
          className={cn('absolute inset-x-0 bottom-0 h-2 border-t-2 border-ink bg-lime')}
          aria-hidden="true"
        />
      )}
    </BrutalCard>
  );
}
