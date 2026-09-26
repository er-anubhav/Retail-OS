import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_BG } from '@/lib/tone';
import type { Tone } from '@/lib/types';

export interface SectionHeadingProps {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  tone?: Tone;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
  outline?: boolean;
}

const SIZE = {
  md: 'text-xl sm:text-2xl md:text-3xl',
  lg: 'text-2xl sm:text-3xl md:text-4xl',
  xl: 'text-3xl sm:text-4xl md:text-5xl',
} as const;

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  right,
  tone = 'ink',
  size = 'lg',
  className,
}: SectionHeadingProps) {
  return (
    <header className={cn('flex flex-col gap-3 md:flex-row md:items-end md:justify-between', className)}>
      <div className="min-w-0 max-w-3xl">
        {(eyebrow || index) && (
          <div className="mb-2 flex items-center gap-2.5">
            <span
              className={cn('size-3.5 shrink-0 rounded-full border-2 border-ink', TONE_BG[tone].split(' ')[0])}
              aria-hidden="true"
            />
            {eyebrow && (
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/75">
                {eyebrow}
              </span>
            )}
            {index && (
              <span className="rounded-full border-2 border-ink bg-ink px-2.5 py-0.5 font-mono text-xs font-bold tracking-wider text-white hard-shadow-xs">
                {index}
              </span>
            )}
          </div>
        )}

        <h2 className={cn('font-grotesk font-black uppercase tracking-tight text-ink', SIZE[size])}>
          {title}
        </h2>

        {description && (
          <p className="mt-1.5 max-w-2xl text-sm sm:text-base leading-relaxed text-ink/80 font-medium">
            {description}
          </p>
        )}
      </div>

      {right && <div className="flex shrink-0 flex-wrap items-center gap-2.5 pt-1">{right}</div>}
    </header>
  );
}

/** Thin section divider with a clean ink line */
export function Rule({ className }: { className?: string }) {
  return <div className={cn('h-[2px] w-full bg-ink/15 my-2', className)} />;
}
