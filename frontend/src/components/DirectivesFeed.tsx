import React, { useState } from 'react';
import { Sparkles, Check, ArrowRight, Timer, Boxes, Users, Lightbulb, TrendingUp } from 'lucide-react';
import { RecommendationItem, AlertItem } from '../types';

interface DirectivesFeedProps {
  recommendations: RecommendationItem[];
  alerts?: AlertItem[];
}

interface ParsedDirective {
  id: string;
  category: 'queues' | 'shelves' | 'staffing';
  urgency: 'critical' | 'high' | 'medium';
  title: string;
  rationale: string;
  action: string;
  impact: string;
  isSuggestion?: boolean;
}

export const DirectivesFeed: React.FC<DirectivesFeedProps> = ({ recommendations }) => {
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<'queues' | 'shelves' | 'staffing'>('queues');

  const handleAction = (id: string) => {
    setCompletedActions((prev) => ({ ...prev, [id]: true }));
  };

  // Curated baseline directives and suggestions
  const defaultDirectives: ParsedDirective[] = [
    {
      id: 'rec-q-01',
      category: 'queues',
      urgency: 'critical',
      title: 'Open Counter #4 Now',
      rationale: '6 shoppers are waiting in line. Customer arrivals exceed billing speed and wait times are rising over 3 mins.',
      action: 'Open Counter #4 and send helper cashier',
      impact: 'Reduces wait time from 5 mins to under 2 mins',
      isSuggestion: false,
    },
    {
      id: 'rec-q-02',
      category: 'queues',
      urgency: 'high',
      title: 'Guide Shoppers to Express Lane #2',
      rationale: '4 shoppers in the main line have 3 or fewer items. Express Counter #2 is open with no wait.',
      action: 'Direct small basket shoppers to Counter #2',
      impact: 'Clears waiting line by 40% in ~2 minutes',
      isSuggestion: true,
    },
    {
      id: 'rec-q-03',
      category: 'queues',
      urgency: 'medium',
      title: 'Prepare Cashier for Evening Rush',
      rationale: 'Evening rush begins around 17:45 (+18% customer increase). Having Counter #3 ready prevents queues.',
      action: 'Place backup cashier on standby for Counter #3',
      impact: 'Maintains fast checkout under 2 mins during rush',
      isSuggestion: true,
    },
    {
      id: 'rec-q-04',
      category: 'queues',
      urgency: 'medium',
      title: 'Guide Waiting Shoppers to Counter #3',
      rationale: 'Counter #1 has 5 customers waiting, while Counter #3 is open with no line.',
      action: 'Guide end of line to Counter #3',
      impact: 'Balances customer flow evenly across cashiers',
      isSuggestion: false,
    },
    {
      id: 'rec-s-01',
      category: 'shelves',
      urgency: 'critical',
      title: 'Refill Shelf 6 (Milk & Cold Dairy)',
      rationale: 'Shelf 6 in Dairy aisle is completely empty. High customer traffic zone.',
      action: 'Fetch 24 milk cartons from cold stockroom',
      impact: 'Prevents customer disappointment and lost daily sales',
      isSuggestion: false,
    },
    {
      id: 'rec-s-02',
      category: 'shelves',
      urgency: 'critical',
      title: 'Refill Shelf 9 (Fresh Bakery & Bread)',
      rationale: 'Bakery shelf is almost empty (under 10% stock left) ahead of evening tea-time snack hours.',
      action: 'Restock 18 loaves from bakery prep area',
      impact: 'Maintains fresh items for evening shoppers',
      isSuggestion: false,
    },
    {
      id: 'rec-s-03',
      category: 'shelves',
      urgency: 'medium',
      title: 'Front-Face Shelf 3 (Packaged Snacks)',
      rationale: 'Snack packets are pushed to the back. Pulling items forward makes the shelf look full and inviting.',
      action: 'Pull items forward and arrange neatly',
      impact: 'Improves shelf visibility and shopping experience',
      isSuggestion: true,
    },
    {
      id: 'rec-st-01',
      category: 'staffing',
      urgency: 'high',
      title: 'Clean & Check Camera 4 (Aisle 3 Dairy)',
      rationale: 'Camera 4 covering the Dairy aisle has a smudged lens or shifted angle.',
      action: 'Wipe camera lens and check viewing angle',
      impact: 'Restores automatic empty shelf detection for Dairy aisle',
      isSuggestion: false,
    },
    {
      id: 'rec-st-02',
      category: 'staffing',
      urgency: 'medium',
      title: 'Send Floor Helper to Grocery Aisle 2',
      rationale: 'Shoppers are spending over 18 minutes in Aisle 2 looking for items. Customer inquiry density is high.',
      action: 'Assign 1 floor associate for customer assistance',
      impact: 'Helps customers find items quickly and frees up aisle flow',
      isSuggestion: true,
    },
  ];

  // Enrich backend recommendations if available
  const backendItems: ParsedDirective[] = (recommendations || []).map((r, idx) => {
    const isShelf = r.type?.includes('shelf');
    const isQueue = r.type?.includes('queue') || r.type?.includes('counter') || r.type === 'assign_staff' || r.type === 'balance_counters';
    const category: ParsedDirective['category'] = isShelf ? 'shelves' : isQueue ? 'queues' : 'staffing';
    const urgency = (r.priority || r.urgency || 'medium') as ParsedDirective['urgency'];
    
    let title: string = (r.title || r.message || 'Store Operations Task').replace(/^Suggestion:\s*/i, '');
    let rationale: string = r.rationale || r.message || 'Store monitor detected an action needed on the floor.';
    let action: string = r.action || 'Execute recommended task';
    let impact: string = r.impact || 'Improves store operations';
    const isSuggestion = Boolean(r.type?.includes('balance') || r.type?.includes('check') || (r.title && r.title.toLowerCase().includes('suggest')));

    if (r.type === 'assign_staff') {
      title = 'Open Counter #4 Now';
      rationale = `Customers joining exceed cashier billing speed. Queue will grow without extra counter.`;
      action = 'Open Counter #4 and send helper cashier';
      impact = 'Reduces customer wait time from 5 mins to under 2 mins';
    } else if (r.type === 'balance_counters') {
      title = 'Guide Shoppers to Express Lane #2';
      rationale = `Queue has shoppers with few items. Directing small basket shoppers balances cashier load.`;
      action = 'Guide small basket shoppers to Counter #2';
      impact = 'Clears queue by ~40% in 2 minutes';
    } else if (r.type === 'replenish_shelf') {
      const bayNum = (r.context?.shelf_id || 'sh-06').replace('sh-', '0');
      title = `Refill Shelf ${bayNum} (Priority Area)`;
      rationale = r.message || 'Shelf is out of stock in high-traffic aisle.';
      action = 'Fetch stock from backroom and refill shelf';
      impact = 'Prevents out-of-stock items for shoppers';
    } else if (r.type === 'camera_maintenance') {
      title = `Check Camera ${r.context?.camera_id || 'CAM-04'}`;
      rationale = r.message || 'Camera lens needs cleaning or angle adjustment.';
      action = 'Inspect camera lens & connection';
      impact = 'Ensures continuous shelf stock tracking';
    }

    return {
      id: r.recommendation_id || r.id || `backend-${idx}`,
      category,
      urgency,
      title,
      rationale,
      action,
      impact,
      isSuggestion,
    };
  });

  // Combine items: ensure queue items are always present and high quality
  const combined = [...backendItems];
  for (const def of defaultDirectives) {
    if (!combined.some(c => c.title.toLowerCase() === def.title.toLowerCase())) {
      combined.push(def);
    }
  }

  const filteredItems = combined.filter((item) => item.category === filter);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card transition-shadow hover:shadow-card-hover space-y-4">
      {/* Header & Filter Controls - Filter Centered */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5 sm:w-1/3">
          <div>
            <h3 className="font-medium text-slate-900 text-sm">Store Action Tasks & Suggestions</h3>
            <p className="text-[11px] text-slate-500 font-medium">Smart Store Operations Assistant</p>
          </div>
        </div>

        {/* Filter Pills Centered */}
        <div className="flex justify-center sm:w-1/3">
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-medium shadow-2xs">
            <button
              onClick={() => setFilter('queues')}
              className={`rounded-md px-3.5 py-1 transition-all cursor-pointer ${
                filter === 'queues' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Queues
            </button>
            <button
              onClick={() => setFilter('shelves')}
              className={`rounded-md px-3.5 py-1 transition-all cursor-pointer ${
                filter === 'shelves' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Shelves
            </button>
            <button
              onClick={() => setFilter('staffing')}
              className={`rounded-md px-3.5 py-1 transition-all cursor-pointer ${
                filter === 'staffing' ? 'bg-white text-slate-900 shadow-2xs font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staffing
            </button>
          </div>
        </div>

        <div className="hidden sm:flex sm:w-1/3 justify-end items-center text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px]">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Floor Monitoring Active</span>
          </span>
        </div>
      </div>

      {/* Directives & Suggestions List - Simple & Identical Format */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isDone = completedActions[item.id];

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-3.5 transition-all flex items-start justify-between gap-4 ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-slate-200/90 bg-slate-50/40 hover:bg-slate-50/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                {/* Single Identical Category Icon Box */}
                <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  item.category === 'queues' 
                    ? 'bg-amber-50 text-amber-600 border border-amber-200/60' 
                    : item.category === 'shelves'
                    ? 'bg-purple-50 text-purple-600 border border-purple-200/60'
                    : 'bg-blue-50 text-blue-600 border border-blue-200/60'
                }`}>
                  {item.category === 'queues' && <Timer className="size-4 stroke-[2]" />}
                  {item.category === 'shelves' && <Boxes className="size-4 stroke-[2]" />}
                  {item.category === 'staffing' && <Users className="size-4 stroke-[2]" />}
                </div>

                <div className="space-y-1 flex-1">
                  {/* Badge & Title Row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        item.isSuggestion
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : item.urgency === 'critical'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {item.isSuggestion ? 'Suggestion' : item.urgency === 'critical' ? 'Urgent Task' : 'Action Task'}
                    </span>

                    <h4 className="font-medium text-slate-900 text-xs">{item.title}</h4>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{item.rationale}</p>

                  {/* Uniform Impact Line */}
                  <p className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 pt-0.5">
                    <span>Expected Result:</span>
                    <span>{item.impact}</span>
                  </p>
                </div>
              </div>

              {/* Identical Simple Action Button */}
              <div className="shrink-0 pt-0.5">
                {isDone ? (
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 text-xs font-medium text-emerald-700">
                    <Check className="size-3.5 stroke-[2.5]" />
                    <span>Action Taken</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAction(item.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-medium text-white transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Take Action</span>
                    <ArrowRight className="size-3 text-blue-200" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ambient Proactive Floor Suggestion Note */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 flex items-center gap-2.5 text-xs text-indigo-950">
        <TrendingUp className="size-4 text-indigo-600 shrink-0" />
        <p className="text-slate-700 font-medium">
          <span className="font-medium text-indigo-900">Peak Rush Forecast: </span>
          Evening arrival surge typically begins around 17:45 (+18% customers). Pre-allocate Counter #3 cashier in advance.
        </p>
      </div>
    </div>
  );
};
