import React, { useState, useEffect, useCallback } from 'react';
import { ShopperAnalyticsCard } from './components/ShopperAnalyticsCard';
import { QueueIntelligenceCard } from './components/QueueIntelligenceCard';
import { ShelfInventoryCard } from './components/ShelfInventoryCard';
import { DirectivesFeed } from './components/DirectivesFeed';
import { fetchStoreOverview, FALLBACK_OVERVIEW } from './api';
import { StoreOverview } from './types';
import { Users, Timer, Boxes, Footprints, AlertTriangle, Activity, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [data, setData] = useState<StoreOverview>(FALLBACK_OVERVIEW);
  const [activeTab, setActiveTab] = useState<'operations' | 'directives'>('operations');

  const loadData = useCallback(async () => {
    try {
      const overview = await fetchStoreOverview('BLR-014');
      setData(overview);
    } catch (err) {
      console.error('Failed to load overview:', err);
    }
  }, []);

  // Polling every 4 seconds in the background
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  const currentOccupancy = data.current_occupancy ?? 28;
  const currentQueue = data.queues?.current_queue ?? 6;
  const shelfAvailability = data.shelves?.availability_percentage ?? 72.5;
  const totalEntries = data.footfall?.total_entries ?? 412;
  const directivesCount = data.recommendations?.length || 5;

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-3.5 space-y-3 flex-1 flex flex-col">
        {/* Compact Ambient KPI Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          {/* Card 1: In-Store Occupancy */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Store Occupancy</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-medium text-slate-900">{currentOccupancy}</span>
                <span className="text-[11px] font-medium text-slate-500">people inside</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] font-medium text-emerald-700">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Normal Crowd (58%)</span>
              </div>
            </div>
            <div className="size-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="size-4.5 stroke-[2]" />
            </div>
          </div>

          {/* Card 2: Checkout Queue */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Checkout Line</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-medium text-amber-700">{currentQueue}</span>
                <span className="text-[11px] font-medium text-slate-500">waiting in line</span>
              </div>
              <p className="mt-0.5 text-[10px] font-medium text-amber-700 flex items-center gap-1">
                <AlertTriangle className="size-2.5" />
                <span>Wait Time: ~{data.queues?.estimated_wait_minutes?.toFixed(1) || '3.3'} mins</span>
              </p>
            </div>
            <div className="size-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Timer className="size-4.5 stroke-[2]" />
            </div>
          </div>

          {/* Card 3: Shelf Availability */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Shelves Stocked</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-medium text-purple-700">{shelfAvailability.toFixed(0)}%</span>
                <span className="text-[11px] font-medium text-slate-500">in stock</span>
              </div>
              <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                {data.shelves?.shelves_needing_attention ?? 2} shelves need refill
              </p>
            </div>
            <div className="size-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Boxes className="size-4.5 stroke-[2]" />
            </div>
          </div>

          {/* Card 4: Daily Footfall */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-card flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Visitors Today</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-medium text-slate-900">{totalEntries}</span>
                <span className="text-[11px] font-medium text-slate-500">shoppers entered</span>
              </div>
              <p className="mt-0.5 text-[10px] font-medium text-emerald-700">
                +18% vs yesterday
              </p>
            </div>
            <div className="size-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Footprints className="size-4.5 stroke-[2]" />
            </div>
          </div>
        </div>

        {/* 2-Tab Segmented Switcher - Centered */}
        <div className="flex items-center justify-center py-0.5 shrink-0">
          <div className="inline-flex rounded-xl bg-slate-200/70 p-1 shadow-2xs">
            <button
              onClick={() => setActiveTab('operations')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'operations'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="size-3.5 text-blue-600" />
              <span>Store Operations</span>
            </button>

            <button
              onClick={() => setActiveTab('directives')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'directives'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="size-3.5 text-indigo-600" />
              <span>Action Directives</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-medium ${
                activeTab === 'directives'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-slate-300/80 text-slate-700'
              }`}>
                {directivesCount}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Store Operations (All 3 modules in one row with identical heights) */}
        {activeTab === 'operations' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-4.5 items-stretch flex-1 animate-in fade-in duration-150">
            <ShopperAnalyticsCard
              footfall={data.footfall}
              occupancy={currentOccupancy}
            />

            <QueueIntelligenceCard
              queues={data.queues}
              prediction={data.queue_prediction}
            />

            <ShelfInventoryCard shelves={data.shelves} />
          </div>
        )}

        {/* Tab 2: Action Directives */}
        {activeTab === 'directives' && (
          <div className="animate-in fade-in duration-150 w-full">
            <DirectivesFeed
              recommendations={data.recommendations}
              alerts={data.alerts}
            />
          </div>
        )}
      </main>
    </div>
  );
};
