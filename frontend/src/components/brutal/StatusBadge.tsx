import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_BG, TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import type { Tone } from '@/lib/types';

export interface StatusBadgeProps {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  outline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const BADGE_SIZE = {
  sm: 'px-2.5 py-0.5 text-[11px] gap-1.5',
  md: 'px-3.5 py-1 text-xs sm:text-sm gap-2',
  lg: 'px-4.5 py-1.5 text-sm sm:text-base gap-2.5',
} as const;

const PIP_SIZE = { sm: 'h-2 w-2', md: 'h-2.5 w-2.5', lg: 'h-3 w-3' } as const;

export function StatusBadge({
  children,
  tone = 'ink',
  dot = false,
  pulse = false,
  outline = false,
  size = 'md',
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border-2 border-ink font-mono font-black uppercase tracking-wider hard-shadow-xs',
        outline ? cn('bg-white', TONE_TEXT[tone]) : TONE_BG[tone],
        BADGE_SIZE[size],
        className,
      )}
    >
      {dot && <Pip tone={tone} pulse={pulse} size={size} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function Pip({
  tone = 'lime',
  pulse = false,
  size = 'md',
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const fill = TONE_SOLID[tone];
  return (
    <span className={cn('relative flex shrink-0', PIP_SIZE[size], className)} aria-hidden="true">
      {pulse && (
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-75 animate-ping',
            fill,
          )}
        />
      )}
      <span className={cn('relative inline-flex rounded-full border border-ink', PIP_SIZE[size], fill)} />
    </span>
  );
}

export function MicroLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-mono text-[11px] font-bold uppercase tracking-wider text-ink/75',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function AIBadge({ label = 'EDGE CV', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-magenta px-3 py-0.5 font-mono text-xs font-black uppercase tracking-wider text-cream hard-shadow-xs',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-cream animate-pulse" />
      {label}
    </span>
  );
}

export function Sticker({
  children,
  tone = 'yellow',
  rotate = '-1.5deg',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  rotate?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border-2 border-ink px-3 py-1 font-mono text-xs font-black uppercase tracking-wider hard-shadow-xs',
        TONE_BG[tone],
        className,
      )}
      style={{ transform: `rotate(${rotate})` }}
    >
      {children}
    </span>
  );
}
