import { useMemo, useState } from 'react';
import { BellRing, Filter, ShieldAlert, TriangleAlert } from 'lucide-react';
import { AlertCard, BrutalCard, StatusBadge } from '@/components/brutal';
import { BlockHeading, Disclosure, Grid, Page, Stack } from '@/components/layout/Page';
import { useData } from '@/lib/data';
import { LEVEL_LABEL, LEVEL_TONE, TONE_SOLID } from '@/lib/tone';
import { cn } from '@/lib/utils';
import type { AlertLevel } from '@/lib/types';

type FilterId = AlertLevel | 'all';

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'critical', label: 'CRITICAL' },
  { id: 'warning', label: 'WARNING' },
  { id: 'info', label: 'INFO' },
  { id: 'resolved', label: 'RESOLVED' },
];

const SEVERITY_BANDS: { level: AlertLevel; rules: string[] }[] = [
  {
    level: 'critical',
    rules: ['EMPTY SHELF DETECTED', 'QUEUE ABOVE THRESHOLD', 'CONGESTION PREDICTED'],
  },
  {
    level: 'warning',
    rules: ['SHELF BELOW REORDER POINT', 'PREDICTED QUEUE ABOVE THRESHOLD'],
  },
  { level: 'info', rules: ['INFORMATIONAL DETECTIONS'] },
];

export default function Alerts() {
  const { alertItems, acknowledgeAlert, resolveAlert, store } = useData();
  const [filter, setFilter] = useState<FilterId>('all');
  const [actionError, setActionError] = useState<string | null>(null);

  const counts = useMemo(() => {
    const base: Record<FilterId, number> = { all: alertItems.length, critical: 0, warning: 0, info: 0, resolved: 0 };
    alertItems.forEach((alert) => {
      base[alert.level] += 1;
    });
    return base;
  }, [alertItems]);

  const list = filter === 'all' ? alertItems : alertItems.filter((alert) => alert.level === filter);

  /** Acknowledge / resolve both go straight to the REST endpoints. */
  async function run(action: (id: string) => Promise<void>, id: string) {
    setActionError(null);
    try {
      await action(id);
    } catch (cause: unknown) {
      setActionError(cause instanceof Error ? cause.message : 'Action failed.');
    }
  }

  const tiles = [
    { icon: TriangleAlert, label: 'TOTAL ALERTS', value: counts.all, tone: 'blue' as const },
    { icon: BellRing, label: 'CRITICAL', value: counts.critical, tone: 'coral' as const },
    { icon: TriangleAlert, label: 'WARNING', value: counts.warning, tone: 'yellow' as const },
    { icon: ShieldAlert, label: 'RESOLVED', value: counts.resolved, tone: 'lime' as const },
  ];

  return (
    <Page
      index="04"
      eyebrow={store ? `${store.store_id} · ESCALATIONS` : 'ESCALATIONS'}
      title="Alerts"
      description="Operational threshold violations detected by edge computer vision models. Staff can acknowledge ownership or resolve incidents directly."
      tone="coral"
      actions={
        <StatusBadge tone={counts.critical > 0 ? 'coral' : 'lime'} size="md" dot pulse={counts.critical > 0}>
          {counts.all - counts.resolved} ACTIVE ALERTS
        </StatusBadge>
      }
    >
      <Stack gap="lg">
        <Grid cols={4}>
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="relative overflow-hidden rounded-2xl border-2 sm:border-3 border-ink bg-white p-5 hard-shadow-xs"
            >
              <span
                className={cn('absolute inset-x-0 top-0 h-2 border-b-2 border-ink', TONE_SOLID[tile.tone])}
                aria-hidden="true"
              />
              <tile.icon className="size-6 stroke-[2.5] text-ink" />
              <p className="mt-3 font-mono text-xs font-bold uppercase tracking-wider text-ink/70">
                {tile.label}
              </p>
              <p className="mt-1 font-grotesk text-3xl sm:text-4xl font-black leading-none tracking-tight text-ink tnum">
                {tile.value}
              </p>
            </div>
          ))}
        </Grid>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <span className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-ink/75 mr-1">
            <Filter className="size-4 stroke-[2.5]" />
            Filter:
          </span>
          {FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border-2 border-ink px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider hard-shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 transition-transform cursor-pointer',
                filter === option.id ? 'bg-lime text-ink' : 'bg-white text-ink/75 hover:bg-sand',
              )}
            >
              <span>{option.label}</span>
              <span
                className={cn(
                  'rounded-full border border-ink px-1.5 py-0.2 font-mono text-[10px] font-black',
                  filter === option.id ? 'bg-white text-ink' : 'bg-sand text-ink',
                )}
              >
                {counts[option.id]}
              </span>
            </button>
          ))}
          <span className="ml-auto font-mono text-xs uppercase tracking-wider text-ink/65">
            Showing {list.length} alerts
          </span>
        </div>

        {actionError && (
          <div className="rounded-xl border-2 border-ink bg-coral/90 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-cream hard-shadow-xs">
            {actionError}
          </div>
        )}

        {/* List */}
        <Stack gap="sm">
          <BlockHeading>Alert Timeline</BlockHeading>

          {list.length === 0 ? (
            <BrutalCard padding="md">
              <div className="flex items-center gap-3 py-6 text-center justify-center font-mono">
                <p className="text-sm font-bold uppercase tracking-wider text-ink/70">
                  No alerts in this category.
                </p>
              </div>
            </BrutalCard>
          ) : (
            <div className="space-y-4">
              {list.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={(id) => run(acknowledgeAlert, id)}
                  onResolve={(id) => run(resolveAlert, id)}
                />
              ))}
            </div>
          )}
        </Stack>

        {/* Rules */}
        <Disclosure summary="Alert Generation Matrix" hint="Deterministic backend rules">
          <div className="space-y-3 font-mono">
            {SEVERITY_BANDS.map((band) => (
              <div key={band.level} className="flex flex-col sm:flex-row sm:items-center gap-2 border-b border-ink/15 pb-2 last:border-b-0">
                <span className="w-28">
                  <StatusBadge tone={LEVEL_TONE[band.level]} size="sm">
                    {LEVEL_LABEL[band.level]}
                  </StatusBadge>
                </span>
                <span className="text-xs text-ink/80">
                  {band.rules.join(' · ')}
                </span>
              </div>
            ))}
          </div>
        </Disclosure>
      </Stack>
    </Page>
  );
}
