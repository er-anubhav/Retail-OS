export interface FootfallPoint {
  bucket_start: string;
  label: string;
  entries: number;
  exits: number;
  net: number;
}

export interface FootfallSummary {
  store_id: string;
  total_entries: number | null;
  total_exits: number | null;
  current_occupancy: number;
  peak_hour_label?: string | null;
  peak_hour_entries?: number;
  hourly?: FootfallPoint[];
}

export interface QueuePoint {
  timestamp: string;
  queue_length: number;
  arrival_rate: number;
  service_rate: number;
  open_counters: number;
}

export interface QueueSummary {
  store_id: string;
  current_queue: number;
  open_counters: number;
  arrival_rate: number;
  service_rate: number;
  estimated_wait_minutes: number;
  series?: QueuePoint[];
}

export interface QueuePrediction {
  store_id?: string;
  camera_id?: string;
  timestamp?: string;
  current_queue: number;
  arrival_rate: number;
  service_rate: number;
  open_counters: number;
  horizon_minutes: number;
  predicted_queue: number;
  net_growth_per_minute: number;
  trend: 'growing' | 'stable' | 'shrinking' | string;
  congestion_level: 'normal' | 'warning' | 'critical' | string;
  minutes_until_breach: number | null;
  estimated_wait_minutes: number;
  formula: string;
  explanation: string;
}

export interface ShelfItem {
  shelf_id: string;
  store_id: string;
  camera_id: string;
  status: 'normal' | 'low' | 'empty';
  confidence: number;
  last_detected: string;
}

export interface ShelfSummary {
  store_id: string;
  total_shelves: number;
  normal: number;
  low: number;
  empty: number;
  availability_percentage: number;
  shelves_needing_attention: number;
  items: ShelfItem[];
}

export interface AlertItem {
  alert_id?: string;
  id?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title?: string;
  message?: string;
  summary?: string;
  timestamp?: string;
  created_at?: string;
  acknowledged?: boolean;
}

export interface RecommendationItem {
  id?: string;
  recommendation_id?: string;
  type: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  title?: string;
  message?: string;
  rationale?: string;
  action?: string;
  impact?: string;
  context?: Record<string, any>;
  timestamp?: string;
}

export interface StoreOverview {
  store_id: string;
  generated_at: string;
  current_occupancy: number;
  footfall: FootfallSummary;
  queues: QueueSummary;
  queue_prediction: QueuePrediction | null;
  shelves: ShelfSummary;
  alerts: AlertItem[];
  recommendations: RecommendationItem[];
  cameras_online: number;
  cameras_total: number;
}
