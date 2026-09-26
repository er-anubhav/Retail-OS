import type { AlertLevel, Priority, RiskLevel, ShelfStatus, Tone } from './types';

/** Solid fill + the text colour that stays legible on it. */
export const TONE_BG: Record<Tone, string> = {
  ink: 'bg-ink text-cream',
  blue: 'bg-sky text-cream',
  lime: 'bg-lime text-ink',
  yellow: 'bg-amber text-ink',
  coral: 'bg-coral text-cream',
  purple: 'bg-magenta text-cream',
};

export const TONE_SOLID: Record<Tone, string> = {
  ink: 'bg-ink',
  blue: 'bg-sky',
  lime: 'bg-lime',
  yellow: 'bg-amber',
  coral: 'bg-coral',
  purple: 'bg-magenta',
};

export const TONE_TEXT: Record<Tone, string> = {
  ink: 'text-ink',
  blue: 'text-sky',
  lime: 'text-lime',
  yellow: 'text-amber-800',
  coral: 'text-coral',
  purple: 'text-magenta',
};

export const TONE_BORDER: Record<Tone, string> = {
  ink: 'border-ink',
  blue: 'border-sky',
  lime: 'border-lime',
  yellow: 'border-amber',
  coral: 'border-coral',
  purple: 'border-magenta',
};

/** Soft tint used behind text blocks. */
export const TONE_WASH: Record<Tone, string> = {
  ink: 'bg-ink/10',
  blue: 'bg-sky/20',
  lime: 'bg-lime/30',
  yellow: 'bg-amber/25',
  coral: 'bg-coral/20',
  purple: 'bg-magenta/20',
};

export const LEVEL_TONE: Record<AlertLevel, Tone> = {
  critical: 'coral',
  warning: 'yellow',
  info: 'blue',
  resolved: 'lime',
};

export const LEVEL_LABEL: Record<AlertLevel, string> = {
  critical: 'CRITICAL',
  warning: 'WARNING',
  info: 'INFO',
  resolved: 'RESOLVED',
};

export const PRIORITY_TONE: Record<Priority, Tone> = {
  critical: 'coral',
  high: 'yellow',
  medium: 'blue',
  low: 'lime',
};

export const RISK_TONE: Record<RiskLevel, Tone> = {
  high: 'coral',
  medium: 'yellow',
  low: 'lime',
};

export const SHELF_TONE: Record<ShelfStatus, Tone> = {
  empty: 'coral',
  critical: 'coral',
  low: 'yellow',
  healthy: 'lime',
};

export const SHELF_LABEL: Record<ShelfStatus, string> = {
  empty: 'EMPTY',
  critical: 'CRITICAL',
  low: 'LOW',
  healthy: 'HEALTHY',
};

export const CAMERA_TONE = {
  online: 'lime',
  warning: 'yellow',
  offline: 'coral',
} as const;

/* ============================================================
   CHART PALETTE (Matching SIH26008 OKLCH-aligned Hex)
   ============================================================ */
export interface ChartPalette {
  ink: string;
  paper: string;
  surface: string;
  muted: string;
  blue: string;
  lime: string;
  yellow: string;
  coral: string;
  purple: string;
}

export const CHART_PALETTE: ChartPalette = {
  ink: '#18181b',
  paper: '#ffffff',
  surface: '#ffffff',
  muted: '#71717a',
  blue: '#0284c7',
  lime: '#bef264',
  yellow: '#ffcc4e',
  coral: '#e11d48',
  purple: '#d946ef',
};

export function toneFromFill(fill: number): Tone {
  if (fill < 45) return 'coral';
  if (fill < 70) return 'yellow';
  if (fill < 85) return 'blue';
  return 'lime';
}
