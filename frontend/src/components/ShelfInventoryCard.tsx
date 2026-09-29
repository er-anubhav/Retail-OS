import React, { useState } from 'react';
import { Boxes, CheckCircle, ArrowRight } from 'lucide-react';
import { ShelfSummary, ShelfItem } from '../types';

interface ShelfInventoryCardProps {
  shelves: ShelfSummary;
}

export const ShelfInventoryCard: React.FC<ShelfInventoryCardProps> = ({ shelves }) => {
  const [restockedBays, setRestockedBays] = useState<Record<string, boolean>>({});

  const items: ShelfItem[] = shelves.items && shelves.items.length > 0
    ? shelves.items.slice(0, 9)
    : [
        { shelf_id: 'sh-06', store_id: 'BLR-014', camera_id: 'CAM-06', status: 'empty', confidence: 0.89, last_detected: '3m ago' },
        { shelf_id: 'sh-09', store_id: 'BLR-014', camera_id: 'CAM-02', status: 'empty', confidence: 0.92, last_detected: '4m ago' },
        { shelf_id: 'sh-03', store_id: 'BLR-014', camera_id: 'CAM-06', status: 'low', confidence: 0.81, last_detected: '2m ago' },
        { shelf_id: 'sh-05', store_id: 'BLR-014', camera_id: 'CAM-07', status: 'low', confidence: 0.76, last_detected: 'Just now' },
        { shelf_id: 'sh-01', store_id: 'BLR-014', camera_id: 'CAM-02', status: 'normal', confidence: 0.94, last_detected: 'Just now' },
        { shelf_id: 'sh-02', store_id: 'BLR-014', camera_id: 'CAM-05', status: 'normal', confidence: 0.88, last_detected: 'Just now' },
        { shelf_id: 'sh-04', store_id: 'BLR-014', camera_id: 'CAM-07', status: 'normal', confidence: 0.91, last_detected: 'Just now' },
        { shelf_id: 'sh-07', store_id: 'BLR-014', camera_id: 'CAM-05', status: 'normal', confidence: 0.85, last_detected: 'Just now' },
        { shelf_id: 'sh-08', store_id: 'BLR-014', camera_id: 'CAM-07', status: 'normal', confidence: 0.93, last_detected: 'Just now' },
      ];

  const handleRestock = (bayId: string) => {
    setRestockedBays((prev) => ({ ...prev, [bayId]: true }));
  };

  const handleRestockAll = () => {
    const updated: Record<string, boolean> = { ...restockedBays };
    items.forEach((bay) => {
      if (bay.status !== 'normal') {
        updated[bay.shelf_id] = true;
      }
    });
    setRestockedBays(updated);
  };

  const pendingAttentionCount = items.filter(
    (bay) => bay.status !== 'normal' && !restockedBays[bay.shelf_id]
  ).length;

  const availability = shelves.availability_percentage ?? 72.5;

  const shelfCategories: Record<string, { name: string; aisle: string }> = {
    'sh-01': { name: 'Rice & Grains', aisle: 'Aisle 1' },
    'sh-02': { name: 'Cooking Spices', aisle: 'Aisle 1' },
    'sh-03': { name: 'Packaged Snacks', aisle: 'Aisle 2' },
    'sh-04': { name: 'Cold Drinks', aisle: 'Aisle 2' },
    'sh-05': { name: 'Cooking Oils', aisle: 'Aisle 2' },
    'sh-06': { name: 'Milk & Dairy', aisle: 'Aisle 3' },
    'sh-07': { name: 'Soaps & Shampoos', aisle: 'Aisle 3' },
    'sh-08': { name: 'Home Cleaning', aisle: 'Aisle 4' },
    'sh-09': { name: 'Fresh Bakery', aisle: 'Aisle 4' },
    'BAY-01': { name: 'Rice & Grains', aisle: 'Aisle 1' },
    'BAY-02': { name: 'Cooking Spices', aisle: 'Aisle 1' },
    'BAY-03': { name: 'Packaged Snacks', aisle: 'Aisle 2' },
    'BAY-04': { name: 'Cold Drinks', aisle: 'Aisle 2' },
    'BAY-05': { name: 'Cooking Oils', aisle: 'Aisle 2' },
    'BAY-06': { name: 'Milk & Dairy', aisle: 'Aisle 3' },
    'BAY-07': { name: 'Soaps & Shampoos', aisle: 'Aisle 3' },
    'BAY-08': { name: 'Home Cleaning', aisle: 'Aisle 4' },
    'BAY-09': { name: 'Fresh Bakery', aisle: 'Aisle 4' },
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover h-full flex flex-col justify-between">
      <div className="space-y-3">
        {/* Module Title */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8.5 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
              <Boxes className="size-4.5 stroke-[2]" />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 text-sm">Shelf Stock & Refill Alerts</h3>
              <p className="text-[11px] text-slate-500 font-medium">Live Shelf Monitor & Restock Tasks</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500">Overall:</span>
            <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
              {availability.toFixed(0)}% Stocked
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex justify-between text-[11px] text-slate-600 mb-1.5 font-medium">
            <span>Store Shelves Status</span>
            <span className="font-medium text-slate-800">{shelves.normal} Full · {shelves.low} Low · {shelves.empty} Empty</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden flex">
            <div className="bg-emerald-500 h-full" style={{ width: `${(shelves.normal / (shelves.total_shelves || 9)) * 100}%` }} />
            <div className="bg-amber-400 h-full" style={{ width: `${(shelves.low / (shelves.total_shelves || 9)) * 100}%` }} />
            <div className="bg-rose-500 h-full" style={{ width: `${(shelves.empty / (shelves.total_shelves || 9)) * 100}%` }} />
          </div>
        </div>

        {/* 9-Bay Matrix Grid */}
        <div className="grid grid-cols-3 gap-2">
          {items.map((bay) => {
            const isRestocked = restockedBays[bay.shelf_id];
            const status = isRestocked ? 'normal' : bay.status;

            const isNormal = status === 'normal';
            const isLow = status === 'low';
            const isEmpty = status === 'empty';

            const shelfInfo = shelfCategories[bay.shelf_id] || { name: 'General', aisle: 'Aisle 1' };
            const stockLevelText = isRestocked ? '100% full' : isEmpty ? '0% left' : isLow ? '15% left' : '95% full';

            return (
              <div
                key={bay.shelf_id}
                className={`rounded-xl border p-2.5 flex flex-col justify-between transition-all ${
                  isNormal
                    ? 'border-slate-200 bg-white hover:border-slate-300'
                    : isLow
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-rose-300 bg-rose-50/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-500">{shelfInfo.aisle}</span>
                    <span
                      className={`size-2 rounded-full ${
                        isNormal ? 'bg-emerald-500' : isLow ? 'bg-amber-500' : 'bg-rose-500 animate-pulse'
                      }`}
                    />
                  </div>
                  <h4 className="text-xs font-medium text-slate-900 truncate mt-0.5">
                    {shelfInfo.name}
                  </h4>
                </div>

                <div className="mt-2 pt-1 border-t border-slate-100/80">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9.5px] font-medium uppercase tracking-wider ${
                        isNormal ? 'text-emerald-700' : isLow ? 'text-amber-700' : 'text-rose-700'
                      }`}
                    >
                      {isRestocked ? 'Refilled' : isNormal ? 'Full' : isLow ? 'Low' : 'Empty'}
                    </span>
                    <span className="text-[9.5px] font-medium text-slate-500">
                      {stockLevelText}
                    </span>
                  </div>

                  {!isNormal && !isRestocked && (
                    <button
                      onClick={() => handleRestock(bay.shelf_id)}
                      className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 py-1 text-[10px] font-medium text-slate-800 transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Refill Shelf</span>
                      <ArrowRight className="size-2.5 text-slate-400" />
                    </button>
                  )}

                  {isRestocked && (
                    <div className="mt-1.5 flex items-center justify-center gap-1 py-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                      <CheckCircle className="size-3" />
                      <span>Refill Done</span>
                    </div>
                  )}

                  {isNormal && !isRestocked && (
                    <div className="mt-1.5 text-center py-1 text-[10px] text-slate-400 font-medium">
                      Stock OK
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Restock Dispatch Status Callout */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <span className="text-slate-700 font-medium">
            {pendingAttentionCount > 0 
              ? `${pendingAttentionCount} shelves need refill from stockroom` 
              : 'All 9 store aisles fully stocked'}
          </span>
          <span className={`text-[11px] font-medium ${pendingAttentionCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {pendingAttentionCount > 0 ? 'Restock Needed' : '✓ Stock Healthy'}
          </span>
        </div>
      </div>

      {/* Immediate Restock Dispatcher */}
      <div className="pt-2">
        {pendingAttentionCount > 0 ? (
          <button
            onClick={handleRestockAll}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-3.5 py-2.5 text-xs font-medium text-white shadow-xs transition-colors cursor-pointer"
          >
            <Boxes className="size-3.5" />
            <span>Restock All {pendingAttentionCount} Shelves Now</span>
          </button>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs text-emerald-800 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="size-4 text-emerald-600" />
              <span>All Shelves Restocked · Stockroom Updated</span>
            </div>
            <button
              onClick={() => setRestockedBays({})}
              className="text-xs underline text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
