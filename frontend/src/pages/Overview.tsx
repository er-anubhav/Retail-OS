import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, TriangleAlert } from 'lucide-react';
import { AlertLine, BrutalCard, MetricCard, StatusBadge } from '@/components/brutal';
import { BlockHeading, Disclosure, Grid, Page, Stack } from '@/components/layout/Page';
import { useData } from '@/lib/data';
import { CAMERA_TONE, TONE_SOLID } from '@/lib/tone';
import { cn } from '@/lib/utils';
import type { ApiCameraStatus } from '@/lib/api';

const CAMERA_ORDER: ApiCameraStatus[] = ['online', 'warning', 'offline'];
const CAMERA_LABEL: Record<ApiCameraStatus, string> = {
  online: 'ONLINE',
  warning: 'DEGRADED',
  offline: 'OFFLINE',
};

export default function Overview() {
  const { store, kpis, alertItems, cameras, overview, lastUpdated } = useData();

  const activeAlerts = alertItems.filter((alert) => alert.level !== 'resolved').slice(0, 5);
  const counts = CAMERA_ORDER.map((status) => ({
    status,
    count: cameras.filter((camera) => camera.status === status).length,
  }));
  const attention = counts
    .filter((item) => item.status !== 'online' && item.count > 0)
    .map((item) => `${item.count} ${CAMERA_LABEL[item.status].toLowerCase()}`)
    .join(' · ');

  return (
    <Page
      index="01"
      eyebrow={store ? `${store.store_id} · ${store.city}` : 'STORE PULSE'}
      title="Overview"
      description="A real-time edge telemetry summary of the active store. Data is ingested from computer vision models and aggregated in MongoDB."
      tone="blue"
      actions={
        overview && (
          <StatusBadge tone="lime" size="md">
            {overview.cameras_online}/{overview.cameras_total} CAMERAS ONLINE
          </StatusBadge>
        )
      }
    >
      <Stack gap="lg">
        {/* Headline numbers */}
        <Grid cols={4}>
          {kpis.map((metric, index) => (
            <MetricCard
              key={metric.id}
              metric={metric}
              index={String(index + 1).padStart(2, '0')}
              emphasis
            />
          ))}
        </Grid>

        {/* Needs attention */}
        <Stack gap="sm">
          <BlockHeading
            right={
              <Link
                to="/alerts"
                className="flex items-center gap-2 rounded-full border-2 border-ink bg-white px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider hard-shadow-xs hover:-translate-y-0.5 transition-transform"
              >
                <span>ALL ALERTS</span>
                <ArrowRight className="size-3.5 stroke-[2.5]" />
              </Link>
            }
          >
            Needs Attention
          </BlockHeading>

          <BrutalCard padding="none" tone={activeAlerts.length > 0 ? 'coral' : 'lime'}>
            {activeAlerts.length > 0 ? (
              <div className="divide-y-2 divide-ink/15 p-2">
                {activeAlerts.map((alert) => (
                  <div key={alert.id} className="p-1">
                    <AlertLine alert={alert} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4 p-6 font-mono">
                <CheckCircle2 className="size-7 shrink-0 text-lime stroke-[2.5]" />
                <div>
                  <p className="font-grotesk text-xl font-bold uppercase tracking-tight text-ink">All Clear</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wider text-ink/70">
                    No active or unresolved alerts in this store
                  </p>
                </div>
              </div>
            )}
          </BrutalCard>
        </Stack>

        {/* Camera fleet */}
        <Stack gap="sm">
          <BlockHeading
            right={
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink/70">
                {attention || 'FULL COVERAGE'}
              </span>
            }
          >
            Camera Fleet Status
          </BlockHeading>

          <div className="grid gap-4 sm:grid-cols-3">
            {counts.map((item) => (
              <div
                key={item.status}
                className="flex items-center gap-3.5 rounded-2xl border-2 border-ink bg-white p-4 hard-shadow-xs"
              >
                <span
                  className={cn(
                    'h-10 w-2.5 rounded-full shrink-0 border border-ink',
                    TONE_SOLID[CAMERA_TONE[item.status]],
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-ink/70">
                    {CAMERA_LABEL[item.status]}
                  </p>
                  <p className="font-grotesk text-3xl font-black leading-none tracking-tight text-ink tnum mt-0.5">
                    {item.count}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Secondary detail */}
          <Disclosure summary="Camera-by-camera health breakdown" hint={`${cameras.length} cameras enrolled`}>
            {cameras.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {cameras.map((camera) => (
                  <li
                    key={camera.camera_id}
                    className="flex items-center justify-between gap-3 rounded-xl border-2 border-ink/20 bg-sand/50 px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-xs sm:text-sm font-bold uppercase tracking-wide text-ink">
                        {camera.camera_id} · {camera.name}
                      </span>
                      <span className="block truncate font-mono text-xs uppercase tracking-wider text-ink/65 mt-0.5">
                        {camera.zone}
                      </span>
                    </span>
                    <StatusBadge tone={CAMERA_TONE[camera.status]} size="sm">
                      {CAMERA_LABEL[camera.status]}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-mono text-xs uppercase tracking-wider text-ink/70">
                No cameras enrolled for this store.
              </p>
            )}
          </Disclosure>
        </Stack>

        {lastUpdated && (
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ink/60">
            <TriangleAlert className="size-4 stroke-[2.5]" />
            Live data polled from the REST API · Refreshed automatically every 5 seconds
          </p>
        )}
      </Stack>
    </Page>
  );
}
