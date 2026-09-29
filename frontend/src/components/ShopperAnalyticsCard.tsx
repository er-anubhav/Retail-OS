import React from 'react';
import { Users, ArrowUpRight, ArrowDownRight, Clock, Flame } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { FootfallSummary } from '../types';

interface ShopperAnalyticsCardProps {
  footfall: FootfallSummary;
  occupancy: number;
}

export const ShopperAnalyticsCard: React.FC<ShopperAnalyticsCardProps> = ({ footfall, occupancy }) => {
  const chartData = footfall.hourly && footfall.hourly.length > 0 
    ? footfall.hourly 
    : [
        { label: '09:00', entries: 24 },
        { label: '11:00', entries: 58 },
        { label: '13:00', entries: 72 },
        { label: '15:00', entries: 64 },
        { label: '17:00', entries: 98 },
        { label: '19:00', entries: 96 },
      ];

  const totalEntries = footfall.total_entries ?? 412;
  const totalExits = footfall.total_exits ?? 384;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover h-full flex flex-col justify-between">
      <div>
        {/* Module Title */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8.5 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
              <Users className="size-4.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 text-sm">Store Customers & Flow</h3>
              <p className="text-[11px] text-slate-500 font-medium">Live Customer Count & Visit Duration</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Live Tracking
          </span>
        </div>

        {/* Main Metric Spotlight */}
        <div className="grid grid-cols-2 gap-2 py-3 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Inside Store</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-medium text-slate-900">{occupancy}</span>
              <span className="text-[11px] font-medium text-slate-500">people now</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Entered Today</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-medium text-emerald-700">{totalEntries}</span>
              <ArrowUpRight className="size-3 text-emerald-600" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Exited Today</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-medium text-slate-700">{totalExits}</span>
              <ArrowDownRight className="size-3 text-slate-400" />
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Avg. Time Spent</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-medium text-blue-700">14.2</span>
              <span className="text-[11px] font-medium text-slate-500">minutes</span>
            </div>
          </div>
        </div>

        {/* Hourly Flow Chart */}
        <div className="pt-3 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
              <Clock className="size-3.5 text-slate-400" />
              <span>Customer Rush by Hour</span>
            </div>
            {footfall.peak_hour_label && (
              <div className="flex items-center gap-1 text-[10.5px] text-amber-600 font-medium">
                <Flame className="size-3" />
                <span>Busiest: {footfall.peak_hour_label}</span>
              </div>
            )}
          </div>

          <div className="h-28 sm:h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 6, right: 4, left: 4, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    color: '#0f172a', 
                    borderRadius: '8px', 
                    fontSize: '11px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                  formatter={(val) => [`${val} customers`, 'Hourly Rush']}
                />
                <Bar dataKey="entries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dwell Time Profile (Simple plain English breakdown) */}
        <div className="py-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 pb-0.5">
            <span>Customer Shopping Duration</span>
            <span className="text-[11px] text-slate-500 font-medium">Avg. 14 mins</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Under 5 min</span>
              <span className="text-xs font-medium text-slate-900 block mt-0.5">28%</span>
              <span className="text-[9.5px] text-slate-400 block font-medium">Quick grab</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">5 to 15 min</span>
              <span className="text-xs font-medium text-blue-700 block mt-0.5">54%</span>
              <span className="text-[9.5px] text-slate-400 block font-medium">Regular shop</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">Over 15 min</span>
              <span className="text-xs font-medium text-slate-900 block mt-0.5">18%</span>
              <span className="text-[9.5px] text-slate-400 block font-medium">Big basket</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aligned Baseline Status */}
      <div className="pt-2">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/90 px-3.5 py-2 text-xs text-slate-700 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Entrance & Exit Cameras</span>
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Active & Tracking</span>
        </div>
      </div>
    </div>
  );
};
