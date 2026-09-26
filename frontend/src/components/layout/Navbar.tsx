import { Link, NavLink } from 'react-router-dom';
import { LogOut, RefreshCw, Store } from 'lucide-react';
import { cn, clock } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/data';
import { ALL_NAV_ITEMS } from './navigation';

/**
 * Top navigation styled exactly like SIH26008 SiteNav:
 * Centered Brand Identity with Coral Badge, Rounded Pill Navigation Tabs with Hard Shadows,
 * and top-level utility controls for store switching, polling, and auth.
 */
export function Navbar() {
  const { user, signOut } = useAuth();
  const {
    stores,
    storeId,
    setStoreId,
    polling,
    setPolling,
    refresh,
    lastUpdated,
    error,
    unacknowledgedCount,
    recommendations,
  } = useData();

  const badgeFor = (kind?: 'alerts' | 'recommendations') => {
    if (kind === 'alerts') return unacknowledgedCount;
    if (kind === 'recommendations') return recommendations.length;
    return 0;
  };

  return (
    <header className="w-full space-y-4 pb-4 font-mono">
      {/* Top Utility Controls: Left = Store Selector, Right = Polling / Refresh / Sign Out */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b-2 border-ink/15 pb-3">
        {/* Top-Left: Store Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink/75">
            Store:
          </span>
          {stores.length > 0 ? (
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="bg-cream border-2 border-ink rounded-xl px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-ink focus:outline-none cursor-pointer hard-shadow-xs hover:-translate-y-0.5 transition-transform"
            >
              {stores.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_id} · {s.city}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-mono font-bold text-ink/70">Connecting...</span>
          )}
        </div>

        {/* Top-Right Utility Controls */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3.5">
          {/* Polling Toggle */}
          <button
            type="button"
            onClick={() => setPolling(!polling)}
            title={polling ? 'Pause live polling' : 'Resume live polling'}
            className={cn(
              'flex items-center gap-2 rounded-full border-2 border-ink px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-black uppercase tracking-wider hard-shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-transform',
              error
                ? 'bg-coral text-cream'
                : polling
                  ? 'bg-lime text-ink'
                  : 'bg-amber text-ink'
            )}
          >
            <span
              className={cn(
                'size-2 rounded-full border border-ink',
                polling && !error ? 'bg-ink animate-pulse' : 'bg-ink/50'
              )}
            />
            <span>{error ? 'OFFLINE' : polling ? 'LIVE 5s' : 'PAUSED'}</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={refresh}
            title="Refresh now"
            className="grid size-9 sm:size-10 place-items-center rounded-full border-2 border-ink bg-white text-ink hard-shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-transform"
          >
            <RefreshCw className="size-4 sm:size-4.5 stroke-[2.5]" />
          </button>

          {/* User Sign Out */}
          {user && (
            <button
              type="button"
              onClick={() => void signOut()}
              title={`Sign out ${user.email}`}
              className="flex items-center gap-2 rounded-full border-2 border-ink bg-white hover:bg-sand px-3.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-black uppercase tracking-wider hard-shadow-xs hover:-translate-y-0.5 active:translate-y-0.5 cursor-pointer transition-transform"
            >
              <LogOut className="size-3.5 sm:size-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Brand Identity — Centered with Generous Spacing Above and Below */}
      <div className="flex flex-col items-center text-center space-y-2.5 py-4 sm:py-7 my-1">
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <Link
            to="/"
            className="size-11 sm:size-14 shrink-0 rounded-full bg-coral outline-3 outline-ink grid place-items-center text-cream hard-shadow-xs hover:scale-105 transition-transform"
            aria-label="Home"
          >
            <Store className="size-6 sm:size-8 stroke-[3]" />
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-ink font-bold">
            Retail Intelligence System
          </h1>
        </div>
        <p className="text-xs sm:text-sm md:text-base text-ink/75 font-mono font-bold tracking-wide">
          Continuous Store Monitoring · Queue Intelligence · Automated Shelf Inventory
        </p>
      </div>

      {/* Navigation Tabs (Center Aligned with rounded pill buttons) */}
      <div className="flex justify-center pt-1">
        <nav className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
          {ALL_NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const badgeCount = badgeFor(tab.badge);
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-full border-2 border-ink px-4 sm:px-5 py-2 sm:py-2.5 font-mono text-xs sm:text-sm font-black uppercase tracking-wider transition-all cursor-pointer hard-shadow-xs',
                    isActive
                      ? 'bg-lime text-ink translate-x-[1px] translate-y-[1px]'
                      : 'bg-white text-ink hover:-translate-y-0.5 active:translate-y-0.5'
                  )
                }
              >
                <Icon className="size-4 sm:size-4.5 stroke-[2.5]" />
                <span>{tab.label}</span>
                {badgeCount > 0 && (
                  <span className="rounded-full border border-ink bg-coral px-2 py-0.2 font-mono text-[11px] font-black text-cream">
                    {badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Notifications / Errors */}
      {error && (
        <div className="rounded-2xl border-2 border-ink bg-coral/90 p-3 sm:p-4 text-center font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-cream hard-shadow-xs">
          Backend Unreachable — {error}
        </div>
      )}
      {lastUpdated && !error && (
        <p className="text-center font-mono text-[11px] uppercase tracking-wider text-ink/60">
          Edge Telemetry Stream Active · Polled every 5s · Last frame at {clock(lastUpdated)}
        </p>
      )}
    </header>
  );
}
