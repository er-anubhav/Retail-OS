import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ai' | 'ghost' | 'info';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-lime text-ink',
  secondary: 'bg-white text-ink',
  danger: 'bg-coral text-cream',
  success: 'bg-lime text-ink',
  ai: 'bg-magenta text-cream',
  info: 'bg-sky text-cream',
  ghost: 'bg-transparent text-ink border-transparent shadow-none hover:bg-black/5',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
  lg: 'px-7 py-3 text-base gap-2.5',
};

const ICON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

/**
 * Signature SIH26008 button:
 * Pill rounded-full, 2px border, hard-shadow-xs, hover translateY -1px.
 */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(
    'inline-flex select-none items-center justify-center rounded-full border-2 border-ink font-mono font-bold uppercase tracking-wider hard-shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer',
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  full?: boolean;
  className?: string;
  children?: ReactNode;
}

export interface BrutalButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {}

export function BrutalButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  className,
  children,
  type = 'button',
  disabled,
  ...rest
}: BrutalButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        buttonClasses(variant, size, className),
        full && 'w-full',
        disabled && 'opacity-60 cursor-not-allowed hover:translate-y-0',
      )}
      {...rest}
    >
      {icon && <span className={cn('shrink-0', ICON_SIZE[size])}>{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className={cn('shrink-0', ICON_SIZE[size])}>{iconRight}</span>}
    </button>
  );
}

export interface BrutalLinkButtonProps extends BaseProps {
  to: string;
}

export type BrutalLinkProps = BrutalLinkButtonProps;

export function BrutalLinkButton({
  to,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  full,
  className,
  children,
}: BrutalLinkButtonProps) {
  return (
    <Link
      to={to}
      className={cn(buttonClasses(variant, size, className), full && 'w-full')}
    >
      {icon && <span className={cn('shrink-0', ICON_SIZE[size])}>{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className={cn('shrink-0', ICON_SIZE[size])}>{iconRight}</span>}
    </Link>
  );
}

export const BrutalLink = BrutalLinkButton;

/** Icon-only pill button */
export function BrutalIconButton({
  icon,
  label,
  size = 'md',
  variant = 'secondary',
  className,
  ...rest
}: Omit<BrutalButtonProps, 'children' | 'iconRight'> & { label: string }) {
  const SIZES: Record<ButtonSize, string> = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'grid place-items-center rounded-full border-2 border-ink font-bold hard-shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer',
        VARIANT[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      <span className={ICON_SIZE[size]}>{icon}</span>
    </button>
  );
}

export const IconButton = BrutalIconButton;
