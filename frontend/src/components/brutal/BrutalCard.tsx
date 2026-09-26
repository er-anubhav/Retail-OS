import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_BORDER, TONE_SOLID } from '@/lib/tone';
import type { Tone } from '@/lib/types';

const PADDING = { none: '', sm: 'p-3 sm:p-4', md: 'p-5 sm:p-7', lg: 'p-6 sm:p-8' } as const;
const SHADOW = {
  none: 'shadow-none',
  xs: 'hard-shadow-xs',
  sm: 'hard-shadow-sm',
  md: 'hard-shadow',
  lg: 'hard-shadow',
} as const;

export interface BrutalCardProps {
  children?: ReactNode;
  className?: string;
  /** Adds a solid accent strip along the top edge. */
  tone?: Tone;
  padding?: keyof typeof PADDING;
  shadow?: keyof typeof SHADOW;
  /** Card lifts on hover. */
  interactive?: boolean;
  title?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  footer?: ReactNode;
  as?: 'div' | 'section' | 'article' | 'aside';
}

export function BrutalCard({
  children,
  className,
  tone,
  padding = 'md',
  shadow = 'md',
  interactive = false,
  title,
  subtitle,
  right,
  footer,
  as: Tag = 'div',
}: BrutalCardProps) {
  return (
    <Tag
      className={cn(
        'relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-3 border-ink bg-white text-ink transition-all',
        SHADOW[shadow],
        interactive && 'hover:-translate-y-1 cursor-pointer',
        className,
      )}
    >
      {tone && <div className={cn('h-2.5 w-full border-b-2 border-ink', TONE_SOLID[tone])} />}

      {(title || right) && (
        <div className="flex items-center justify-between gap-3 border-b-2 border-ink/20 px-5 sm:px-7 py-3.5 sm:py-4 bg-sand/40">
          <div className="min-w-0">
            {title && (
              <h3 className="truncate font-grotesk text-lg sm:text-xl font-bold uppercase tracking-tight text-ink">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 font-mono text-xs sm:text-sm uppercase tracking-wider text-ink/70">
                {subtitle}
              </p>
            )}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}

      <div className={PADDING[padding]}>{children}</div>

      {footer && (
        <div className="border-t-2 border-ink/20 px-5 sm:px-7 py-3 sm:py-4 bg-sand/30">
          {footer}
        </div>
      )}
    </Tag>
  );
}

/** Panel heading with a rule under it — used inside cards that need a mini header. */
export function PanelLabel({
  children,
  right,
  className,
}: {
  children: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-2 border-b border-ink/15 pb-1.5', className)}>
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/75">
        {children}
      </span>
      {right}
    </div>
  );
}

/** Left-ruled note block for secondary explanation text. */
export function Callout({
  tone = 'ink',
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border-2 border-ink/30 bg-sand/60 p-3 sm:p-4 font-mono text-xs sm:text-sm leading-relaxed text-ink/85 space-y-1',
        TONE_BORDER[tone],
        className,
      )}
    >
      {children}
    </div>
  );
}
