import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/brutal';
import type { Tone } from '@/lib/types';
import { DATE_FILTERS, useAppState } from '@/lib/app-state';

export interface PageProps {
  index?: string;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  tone?: Tone;
  size?: 'md' | 'lg' | 'xl';
  children: ReactNode;
  className?: string;
}

export function Page({
  index,
  eyebrow,
  title,
  description,
  actions,
  tone,
  size = 'lg',
  children,
  className,
}: PageProps) {
  return (
    <div className={cn('flex flex-col gap-6 sm:gap-8 font-mono', className)}>
      <SectionHeading
        index={index}
        eyebrow={eyebrow}
        title={title}
        description={description}
        right={actions}
        tone={tone}
        size={size}
      />
      {children}
    </div>
  );
}

/** TODAY / 7 DAYS / 30 DAYS — maps onto the backend's `window` query param. */
export function DateFilterBar({ className }: { className?: string }) {
  const { dateFilter, setDateFilter } = useAppState();
  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-1.5 rounded-full border-2 border-ink bg-white p-1 hard-shadow-xs',
        className,
      )}
      role="group"
      aria-label="Date range"
    >
      {DATE_FILTERS.map((filter) => {
        const active = filter === dateFilter;
        return (
          <button
            key={filter}
            type="button"
            onClick={() => setDateFilter(filter)}
            aria-pressed={active}
            className={cn(
              'rounded-full px-3.5 py-1 text-xs font-mono font-bold uppercase transition-all cursor-pointer',
              active ? 'bg-lime text-ink hard-shadow-xs' : 'text-ink/75 hover:bg-black/5 hover:text-ink',
            )}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Progressive disclosure with SIH26008 rounded-2xl and hard shadows.
 */
export function Disclosure({
  summary,
  hint,
  children,
  className,
}: {
  summary: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details
      className={cn('group rounded-2xl border-2 border-ink bg-white hard-shadow-xs transition-all overflow-hidden', className)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3.5 marker:hidden bg-sand/30 hover:bg-sand/60 transition-colors">
        <ChevronRight
          className="size-4 shrink-0 transition-transform duration-150 group-open:rotate-90 stroke-[2.5]"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1 font-mono text-xs font-bold uppercase tracking-wider text-ink">
          {summary}
        </span>
        {hint && (
          <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-ink/65">
            {hint}
          </span>
        )}
      </summary>
      <div className="border-t-2 border-ink/20 px-5 py-5 bg-white">{children}</div>
    </details>
  );
}

/** Uniform vertical rhythm for stacked card sections. */
export function Stack({
  children,
  className,
  gap = 'md',
}: {
  children: ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}) {
  const GAP = { sm: 'gap-3 sm:gap-4', md: 'gap-5 sm:gap-6', lg: 'gap-7 sm:gap-8' } as const;
  return <div className={cn('flex flex-col', GAP[gap], className)}>{children}</div>;
}

/** Responsive card grid with SIH26008 spacing */
export function Grid({
  children,
  cols = 3,
  className,
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const COLS = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  } as const;
  return <div className={cn('grid gap-4 sm:gap-6', COLS[cols], className)}>{children}</div>;
}

/** Editorial block sub-heading used to label major sections inside a page. */
export function BlockHeading({
  title,
  children,
  subtitle,
  right,
  className,
}: {
  title?: ReactNode;
  children?: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  const heading = title ?? children;
  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-b-2 border-ink/20 pb-2.5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div>
        <h3 className="font-grotesk text-xl sm:text-2xl font-black uppercase tracking-tight text-ink">
          {heading}
        </h3>
        {subtitle && (
          <p className="mt-0.5 font-mono text-xs sm:text-sm uppercase tracking-wider text-ink/70">
            {subtitle}
          </p>
        )}
      </div>
      {right && <div className="mt-2 shrink-0 sm:mt-0">{right}</div>}
    </div>
  );
}
