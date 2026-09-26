import { Activity, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RISK_TONE, TONE_BG, TONE_SOLID } from '@/lib/tone';
import type { Prediction } from '@/lib/types';
import { BrutalCard } from './BrutalCard';
import { StatusBadge } from './StatusBadge';

export function AIBadge({ className, label = 'YOLO EDGE' }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-magenta px-3 py-0.5 font-mono text-xs font-black uppercase tracking-wider text-cream hard-shadow-xs',
        className,
      )}
    >
      <Brain className="size-3.5 stroke-[2.5]" />
      {label}
    </span>
  );
}

export interface PredictionCardProps {
  prediction: Prediction;
  className?: string;
}

export function PredictionCard({ prediction, className }: PredictionCardProps) {
  const tone = RISK_TONE[prediction.level];
  const confidence = Math.round(prediction.confidence * 100);

  return (
    <BrutalCard
      className={cn('relative overflow-hidden', className)}
      tone={prediction.tone}
      interactive
      padding="none"
    >
      <div className="flex flex-col gap-3.5 p-5 sm:p-6 font-mono text-ink">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/75">
            <Activity className="size-4 stroke-[2.5]" />
            {prediction.kind}
          </span>
          <StatusBadge tone={tone} size="sm" dot pulse={prediction.level === 'high'}>
            {prediction.level.toUpperCase()} RISK
          </StatusBadge>
        </div>

        <div className="flex items-start justify-between gap-3">
          <h3 className="font-grotesk text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
            {prediction.subject}
          </h3>
          <span
            className={cn(
              'shrink-0 rounded-full border-2 border-ink px-3 py-1 font-mono text-xs font-black uppercase tracking-wider hard-shadow-xs',
              TONE_BG[prediction.tone],
            )}
          >
            {prediction.eta}
          </span>
        </div>

        <p className="font-mono text-xs sm:text-sm text-ink/80 leading-relaxed">
          {prediction.detail}
        </p>

        <div className="flex items-center gap-3 border-t-2 border-ink/15 pt-3">
          <span className="text-xs font-bold uppercase tracking-wider text-ink/70">
            CONFIDENCE:
          </span>
          <div className="flex h-3 flex-1 rounded-full border border-ink overflow-hidden bg-sand">
            <span
              className={cn('h-full', TONE_SOLID[prediction.tone])}
              style={{ width: `${confidence}%` }}
            />
          </div>
          <span className="text-xs font-bold text-ink tnum">{confidence}%</span>
        </div>
      </div>
    </BrutalCard>
  );
}
