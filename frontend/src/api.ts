import { StoreOverview } from './types';

export const FALLBACK_OVERVIEW: StoreOverview = {
  store_id: 'BLR-014',
  generated_at: new Date().toISOString(),
  current_occupancy: 28,
  footfall: {
    store_id: 'BLR-014',
    total_entries: 412,
    total_exits: 384,
    current_occupancy: 28,
    peak_hour_label: '18:00 - 19:00',
    peak_hour_entries: 86,
    hourly: [
      { bucket_start: '09:00', label: '09:00', entries: 24, exits: 12, net: 12 },
      { bucket_start: '11:00', label: '11:00', entries: 58, exits: 44, net: 14 },
      { bucket_start: '13:00', label: '13:00', entries: 72, exits: 68, net: 4 },
      { bucket_start: '15:00', label: '15:00', entries: 64, exits: 60, net: 4 },
      { bucket_start: '17:00', label: '17:00', entries: 98, exits: 86, net: 12 },
      { bucket_start: '19:00', label: '19:00', entries: 96, exits: 114, net: -18 },
    ],
  },
  queues: {
    store_id: 'BLR-014',
    current_queue: 6,
    open_counters: 3,
    arrival_rate: 2.4,
    service_rate: 1.8,
    estimated_wait_minutes: 3.3,
    series: [
      { timestamp: '12:00', queue_length: 3, arrival_rate: 1.5, service_rate: 1.8, open_counters: 2 },
      { timestamp: '12:05', queue_length: 4, arrival_rate: 2.0, service_rate: 1.8, open_counters: 2 },
      { timestamp: '12:10', queue_length: 6, arrival_rate: 2.4, service_rate: 1.8, open_counters: 3 },
      { timestamp: '12:15', queue_length: 5, arrival_rate: 2.2, service_rate: 2.0, open_counters: 3 },
      { timestamp: '12:20', queue_length: 6, arrival_rate: 2.4, service_rate: 1.8, open_counters: 3 },
    ],
  },
  queue_prediction: {
    store_id: 'BLR-014',
    current_queue: 6,
    arrival_rate: 2.4,
    service_rate: 1.8,
    open_counters: 3,
    horizon_minutes: 5,
    predicted_queue: 9,
    net_growth_per_minute: 0.6,
    trend: 'growing',
    congestion_level: 'warning',
    minutes_until_breach: 3.3,
    estimated_wait_minutes: 3.3,
    formula: 'max(0, 6 + (2.4 - 1.8) * 5) = 9',
    explanation: '6 shoppers waiting with 2.4/min arriving and 1.8/min served. Queue projected to reach 9 in 5 min.',
  },
  shelves: {
    store_id: 'BLR-014',
    total_shelves: 6,
    normal: 4,
    low: 1,
    empty: 1,
    availability_percentage: 72.5,
    shelves_needing_attention: 2,
    items: [
      { shelf_id: 'BAY-01', store_id: 'BLR-014', camera_id: 'CAM-01', status: 'normal', confidence: 0.96, last_detected: new Date().toISOString() },
      { shelf_id: 'BAY-02', store_id: 'BLR-014', camera_id: 'CAM-01', status: 'normal', confidence: 0.94, last_detected: new Date().toISOString() },
      { shelf_id: 'BAY-03', store_id: 'BLR-014', camera_id: 'CAM-01', status: 'low', confidence: 0.82, last_detected: new Date().toISOString() },
      { shelf_id: 'BAY-04', store_id: 'BLR-014', camera_id: 'CAM-01', status: 'normal', confidence: 0.91, last_detected: new Date().toISOString() },
      { shelf_id: 'BAY-05', store_id: 'BLR-014', camera_id: 'CAM-01', status: 'normal', confidence: 0.88, last_detected: new Date().toISOString() },
      { shelf_id: 'BAY-06', store_id: 'BLR-014', camera_id: 'CAM-01', status: 'empty', confidence: 0.95, last_detected: new Date().toISOString() },
    ],
  },
  alerts: [
    {
      alert_id: 'alt-01',
      type: 'shelf_stockout',
      severity: 'high',
      title: 'Beverage Rack Depleted (BAY-06)',
      message: 'Zero stock detected on Bay 06. Restock recommended immediately.',
      timestamp: '3m ago',
      acknowledged: false,
    },
    {
      alert_id: 'alt-02',
      type: 'queue_bottleneck',
      severity: 'medium',
      title: 'Checkout Queue Exceeding Baseline',
      message: 'Arrival rate (2.4/min) > service rate (1.8/min). Projected wait > 5 min.',
      timestamp: '6m ago',
      acknowledged: false,
    },
  ],
  recommendations: [
    {
      id: 'rec-01',
      type: 'queue',
      urgency: 'high',
      title: 'Open Checkout Counter #4',
      rationale: 'Arrival rate is 2.4/min vs 1.8/min processing. Queue will breach 8 shoppers within 3.3 minutes.',
      action: 'Dispatch associate to Counter #4',
      impact: 'Reduces projected wait from 5.1 min to 1.8 min',
    },
    {
      id: 'rec-02',
      type: 'shelf',
      urgency: 'medium',
      title: 'Restock Bay 06 (Dairy & Beverages)',
      rationale: 'Bay 06 empty for 12 minutes. High footfall aisle.',
      action: 'Restock 24 units from stockroom',
      impact: 'Recovers estimated ₹3,200 lost hourly basket revenue',
    },
  ],
  cameras_online: 1,
  cameras_total: 1,
};

export async function fetchStoreOverview(storeId = 'BLR-014'): Promise<StoreOverview> {
  try {
    const res = await fetch(`/api/stores/${storeId}/overview`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('Backend overview fetch failed, using fallback:', err);
    return FALLBACK_OVERVIEW;
  }
}
