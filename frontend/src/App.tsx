import React, { useState, useEffect, useCallback } from 'react';
import { ShopperAnalyticsCard } from './components/ShopperAnalyticsCard';
import { QueueIntelligenceCard } from './components/QueueIntelligenceCard';
import { ShelfInventoryCard } from './components/ShelfInventoryCard';
import { DirectivesFeed } from './components/DirectivesFeed';
import { AISimulationView } from './components/AISimulationView';
import { RealWorldExampleView } from './components/RealWorldExampleView';
import { fetchStoreOverview, FALLBACK_OVERVIEW } from './api';
import { StoreOverview } from './types';
import { Users, Timer, Boxes, Footprints, AlertTriangle, Activity, Sparkles, Video, Camera, FileText, ExternalLink, Play, Github } from 'lucide-react';

export const App: React.FC = () => {
  const [data, setData] = useState<StoreOverview>(FALLBACK_OVERVIEW);
  const [activeTab, setActiveTab] = useState<'operations' | 'directives' | 'simulation' | 'real-world'>(() => {
    const param = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
    if (param === 'simulation' || param === 'directives' || param === 'real-world' || param === 'real-world-example') {
      return param === 'real-world-example' ? 'real-world' : (param as any);
    }
    return 'real-world'; // default to real-world feeds as requested
  });

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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-3.5 space-y-3.5 flex-1 flex flex-col">
        {/* DMart Beta 2 Top Brand Header */}
        <header className="flex items-center justify-between pb-2 border-b border-slate-200/80 bg-white px-4 py-2.5 rounded-2xl shadow-card border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl bg-[#008248] text-white px-3 py-1.5 shadow-xs border border-emerald-700">
              <div className="flex items-center tracking-tight font-black text-sm leading-none">
                <span className="text-amber-300 font-black text-base mr-0.5">D</span>
                <span className=" tracking-tight">Mart</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm  text-slate-900 tracking-tight">DMart Beta 2</h1>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px]  text-[#008248] border border-emerald-200">
                  STORE · Greater Noida
                </span>
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px]  text-amber-800 border border-amber-200">
                  BETA 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                On-Device Computer Vision & Little's Law Retail-OS Platform
              </p>
            </div>
          </div>

          {/* SIH 2026 Resource Quick Links */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href="https://drive.google.com/file/d/18sxWiuMnWPeHrGkHLboR7Ilf_cLvF4tA/view"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors shadow-2xs"
              title="Watch Prototype Video on Google Drive"
            >
              <Play className="size-3 text-amber-600 fill-amber-600" />
              <span>Video Demo</span>
            </a>

            <a
              href="/docs/SIH26179_Idea_Presentation.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
              title="View SIH 2026 Idea Presentation (PDF)"
            >
              <FileText className="size-3 text-emerald-700" />
              <span>SIH Pitch (PDF)</span>
            </a>

            <a
              href="https://docs.google.com/document/d/1KF_REZteJivsuR9ufB4jvx7c8vcf6goF/edit?usp=sharing&ouid=102527121718092635333&rtpof=true&sd=true"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors shadow-2xs"
              title="View Detailed System & Engineering Report"
            >
              <ExternalLink className="size-3 text-blue-700" />
              <span>Detailed Report</span>
            </a>

            <a
              href="https://github.com/er-anubhav/Retail-OS"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors shadow-2xs"
              title="View GitHub Repository"
            >
              <Github className="size-3 text-slate-800" />
              <span>GitHub</span>
            </a>
          </div>
        </header>

        {/* Compact Ambient KPI Bar (Shown on operations & simulation tabs) */}
        {activeTab !== 'real-world' && (
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
              <div className="size-9 rounded-lg bg-emerald-50 text-[#008248] flex items-center justify-center shrink-0">
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
        )}

        {/* 4-Tab Segmented Switcher - Centered */}
        <div className="flex items-center justify-center py-0.5 shrink-0">
          <div className="inline-flex rounded-xl bg-slate-200/70 p-1 shadow-2xs">
            <button
              onClick={() => setActiveTab('real-world')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'real-world'
                  ? 'bg-white text-slate-900 shadow-2xs '
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="size-3.5 text-[#008248]" />
              <span>DMart Beta 2 Feeds</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[9px]  ${
                activeTab === 'real-world'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-300/80 text-slate-700'
              }`}>
                REAL DATA
              </span>
            </button>

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

            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
                activeTab === 'simulation'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Video className="size-3.5 text-purple-600" />
              <span>Simulation</span>
              <span className={`rounded-full px-1.5 py-0.2 text-[9px]  ${
                activeTab === 'simulation'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-slate-300/80 text-slate-700'
              }`}>
                DEMO
              </span>
            </button>
          </div>
        </div>

        {/* Tab 0: Real-World Example Multi-Camera Grid & Minute Stats */}
        {activeTab === 'real-world' && (
          <div className="animate-in fade-in duration-150 w-full flex-1">
            <RealWorldExampleView />
          </div>
        )}

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

        {/* Tab 3: AI Simulation Console */}
        {activeTab === 'simulation' && (
          <div className="animate-in fade-in duration-150 w-full">
            <AISimulationView />
          </div>
        )}
      </main>
    </div>
  );
};
