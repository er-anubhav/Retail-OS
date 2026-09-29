import React, { useState } from 'react';
import { Timer, CheckCircle2, TrendingUp, UserPlus } from 'lucide-react';
import { QueueSummary, QueuePrediction } from '../types';

interface QueueIntelligenceCardProps {
  queues: QueueSummary;
  prediction: QueuePrediction | null;
}

export const QueueIntelligenceCard: React.FC<QueueIntelligenceCardProps> = ({ queues, prediction }) => {
  const [counterOpened, setCounterOpened] = useState(false);

  const currentQueue = queues.current_queue ?? 6;
  const openCounters = counterOpened ? queues.open_counters + 1 : queues.open_counters || 3;
  const arrivalRate = queues.arrival_rate ?? 2.4;
  const serviceRate = counterOpened ? 2.6 : (queues.service_rate ?? 1.8);
  const waitMinutes = queues.estimated_wait_minutes ?? 3.3;

  const predictedQueue = prediction?.predicted_queue ?? 9;
  const isCongested = arrivalRate > serviceRate;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover h-full flex flex-col justify-between">
      <div className="space-y-3">
        {/* Module Title */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8.5 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
              <Timer className="size-4.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 text-sm">Checkout Lines & Counters</h3>
              <p className="text-[11px] text-slate-500 font-medium">Live Waiting Times & Cashier Flow</p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isCongested ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}>
            <span className={`size-1.5 rounded-full ${isCongested ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {isCongested ? 'Long Lines Warning' : 'Flowing Smoothly'}
          </span>
        </div>

        {/* Current State Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">People In Line</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-medium text-slate-900">{currentQueue}</span>
              <span className="text-[11px] font-medium text-slate-500">waiting</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Active Counters</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-medium text-blue-700">{openCounters}</span>
              <span className="text-[11px] font-medium text-slate-500">of 4 open</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Joining Queue</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-medium text-slate-700">{arrivalRate.toFixed(1)}</span>
              <span className="text-[11px] font-medium text-slate-500">cust / min</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Billing Speed</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-medium text-slate-700">{serviceRate.toFixed(1)}</span>
              <span className="text-[11px] font-medium text-slate-500">cust / min</span>
            </div>
          </div>
        </div>

        {/* 5-Min Queue Outlook Callout */}
        <div className={`rounded-xl border p-2.5 transition-colors ${
          counterOpened 
            ? 'border-emerald-200 bg-emerald-50/70' 
            : 'border-amber-200 bg-amber-50/70'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className={`size-4 shrink-0 ${counterOpened ? 'text-emerald-700' : 'text-amber-700'}`} />
              <span className={`font-medium text-xs ${counterOpened ? 'text-emerald-950' : 'text-amber-950'}`}>
                Next 5 Mins: {counterOpened ? `${currentQueue - 1} waiting` : `${predictedQueue} waiting`}
              </span>
            </div>
            <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded ${
              counterOpened ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              Wait Time: {counterOpened ? '~1.8 mins' : `~${waitMinutes.toFixed(1)} mins`}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-medium">
            <div className="rounded-lg bg-white/85 p-1.5 border border-slate-200/60">
              <span className="text-[9.5px] text-slate-500 uppercase tracking-wider block font-medium">Line Movement</span>
              <span className="text-slate-900 font-medium text-xs">
                {counterOpened ? 'Clearing steady (-0.2/m)' : 'Growing (+0.6/min)'}
              </span>
            </div>
            <div className="rounded-lg bg-white/85 p-1.5 border border-slate-200/60">
              <span className="text-[9.5px] text-slate-500 uppercase tracking-wider block font-medium">Target Wait Goal</span>
              <span className="text-slate-900 font-medium text-xs">Under 2.0 mins</span>
            </div>
          </div>

          <p className={`mt-2 text-xs leading-relaxed font-medium ${
            counterOpened ? 'text-emerald-900' : 'text-amber-900'
          }`}>
            {counterOpened 
              ? '✓ Counter #4 is open. Billing is faster than queue growth. Line is clearing smoothly.' 
              : 'Customers are joining faster than billing. Open Counter #4 now to prevent long wait times.'}
          </p>
        </div>

        {/* Live POS Counter Fleet Status */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 pb-0.5">
            <span>Cashier Counters Status</span>
            <span className="text-[11px] text-slate-500 font-medium">{openCounters} of 4 Open</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Counter 1 */}
            <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-900 block">Counter #1</span>
                <span className="text-[10px] text-slate-500 font-medium">Standard Lane</span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>2 in line</span>
                </span>
                <span className="text-[9.5px] text-slate-400 block font-medium">~1.2m wait</span>
              </div>
            </div>

            {/* Counter 2 */}
            <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-900 block">Counter #2</span>
                <span className="text-[10px] text-slate-500 font-medium">Express (≤ 3 items)</span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>1 in line</span>
                </span>
                <span className="text-[9.5px] text-slate-400 block font-medium">~0.8m wait</span>
              </div>
            </div>

            {/* Counter 3 */}
            <div className="p-2 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-slate-900 block">Counter #3</span>
                <span className="text-[10px] text-slate-500 font-medium">Regular Lane</span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700">
                  <span className="size-1.5 rounded-full bg-amber-500" />
                  <span>3 in line</span>
                </span>
                <span className="text-[9.5px] text-slate-400 block font-medium">~2.1m wait</span>
              </div>
            </div>

            {/* Counter 4 */}
            <div className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
              counterOpened 
                ? 'border-emerald-300 bg-emerald-50/70' 
                : 'border-dashed border-amber-300 bg-amber-50/40'
            }`}>
              <div>
                <span className="font-medium text-slate-900 block">Counter #4</span>
                <span className="text-[10px] text-slate-500 font-medium">Relief Lane</span>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                  counterOpened ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  <span className={`size-1.5 rounded-full ${
                    counterOpened ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                  }`} />
                  <span>{counterOpened ? 'Active' : 'Standby'}</span>
                </span>
                <span className="text-[9.5px] text-slate-400 block font-medium">
                  {counterOpened ? '~1.0m wait' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Immediate Action Dispatcher */}
      <div className="pt-2">
        {counterOpened ? (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs text-emerald-800 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>Counter #4 Open · Cashier Billing Now</span>
            </div>
            <button
              onClick={() => setCounterOpened(false)}
              className="text-xs underline text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
            >
              Close Counter
            </button>
          </div>
        ) : (
          <button
            onClick={() => setCounterOpened(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-2.5 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="size-3.5" />
            <span>Open Counter #4 Now (Call Helper Cashier)</span>
          </button>
        )}
      </div>
    </div>
  );
};
