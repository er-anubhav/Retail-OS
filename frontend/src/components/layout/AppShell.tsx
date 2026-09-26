import { Outlet } from 'react-router-dom';
import { RefreshCw, ServerCrash } from 'lucide-react';
import { Navbar } from './Navbar';
import { BrutalButton, BrutalCard } from '@/components/brutal';
import { useData } from '@/lib/data';

/** Shown until the first REST load lands, or when the backend cannot be reached. */
function DataGate({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-12">
      <BrutalCard tone={error ? 'coral' : 'blue'} padding="lg" shadow="md">
        <div className="flex flex-col items-center gap-4 text-center font-mono">
          <span className="grid size-16 place-items-center rounded-2xl border-2 border-ink bg-white hard-shadow-xs text-ink">
            {error ? (
              <ServerCrash className="size-8 stroke-[2.5] text-coral" />
            ) : (
              <RefreshCw className="size-8 stroke-[2.5] animate-spin text-ink" />
            )}
          </span>

          <h1 className="font-grotesk text-2xl sm:text-3xl font-black uppercase tracking-tight text-ink">
            {error ? 'Backend unreachable' : 'Loading store data'}
          </h1>

          <p className="max-w-md text-xs sm:text-sm leading-relaxed text-ink/75">
            {error
              ? error
              : `Fetching active store telemetry from the REST API. Polling every ${
                  loading ? 'few seconds' : 'moment'
                }.`}
          </p>

          {error && (
            <div className="max-w-md rounded-xl border-2 border-ink bg-amber/30 p-3.5 text-xs uppercase leading-relaxed font-bold text-ink">
              Check that mongod is running on port 27017 and FastAPI is active on :8000, then retry.
            </div>
          )}

          <BrutalButton
            variant="primary"
            icon={<RefreshCw strokeWidth={3} />}
            onClick={onRetry}
          >
            Retry now
          </BrutalButton>
        </div>
      </BrutalCard>
    </div>
  );
}

export function AppShell() {
  const { overview, loading, error, refresh } = useData();

  return (
    <div className="min-h-screen bg-background text-foreground font-grotesk selection:bg-coral selection:text-cream">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 pt-4 pb-2">
        <Navbar />
      </div>
      <main className="mx-auto w-full max-w-[1400px] px-4 py-4 sm:px-6 sm:py-6">
        {overview ? (
          <Outlet />
        ) : (
          <DataGate loading={loading} error={error} onRetry={refresh} />
        )}
      </main>
    </div>
  );
}
