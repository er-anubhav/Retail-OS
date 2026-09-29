import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  AlertTriangle,
  CheckCircle2,
  Users,
  Timer,
  Boxes,
  Activity,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Info,
  Footprints,
  ShieldCheck,
  Video as VideoIcon,
} from 'lucide-react';

interface SimulatedEvent {
  id: string;
  time: number;
  timeLabel: string;
  badge: 'EVENT' | 'CALCULATION' | 'PREDICTION' | 'RECOMMENDATION' | 'ACTION' | 'SHELF';
  title: string;
  detail: string;
}

export const AISimulationView: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(11.37);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [manualCounter4, setManualCounter4] = useState<boolean | null>(null);

  // Sync state with video playback
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
    setManualCounter4(null);
  };

  const changeSpeed = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  // -------------------------------------------------------------
  // DETERMINISTIC SIMULATION ENGINE (Synchronized to video.currentTime)
  // -------------------------------------------------------------
  const t = currentTime;

  // Phase 1: 0 - 2.5s (Baseline calm)
  // Phase 2: 2.5 - 5.5s (Rush enters, queue forms)
  // Phase 3: 5.5 - 8.2s (Threshold breached, critical prediction)
  // Phase 4: 8.2 - 11.4s (Counter 4 activated, queue stabilizing)

  let occupancy = 4;
  let totalEntries = 14;
  let totalExits = 10;
  let queueLength = 1;
  let arrivalRate = 1.0;
  let baseServiceRate = 1.2;
  let activeCounters = 3;
  let counter4Open = false;
  let phaseName = 'Baseline Operations';
  let activePipelineStage = 1; // 1: Detection, 2: Tracking, 3: Events, 4: Metrics, 5: Prediction, 6: Recommendation, 7: Action

  if (t < 2.5) {
    phaseName = '1. Baseline Flow';
    occupancy = 4;
    totalEntries = 14;
    totalExits = 10;
    queueLength = 1;
    arrivalRate = 1.0;
    baseServiceRate = 1.2;
    activeCounters = 3;
    counter4Open = false;
    activePipelineStage = 2; // Tracking
  } else if (t < 5.5) {
    phaseName = '2. Surge Arrivals & Queue Formation';
    const progress = (t - 2.5) / 3.0;
    occupancy = Math.round(4 + progress * 4); // 4 -> 8
    totalEntries = Math.round(14 + progress * 4);
    totalExits = 10;
    queueLength = Math.round(1 + progress * 3); // 1 -> 4
    arrivalRate = 2.1;
    baseServiceRate = 1.2;
    activeCounters = 3;
    counter4Open = false;
    activePipelineStage = 4; // Metrics
  } else if (t < 8.2) {
    phaseName = '3. Capacity Breach & Predictive Alert';
    const progress = (t - 5.5) / 2.7;
    occupancy = Math.round(8 + progress * 2); // 8 -> 10
    totalEntries = Math.round(18 + progress * 3);
    totalExits = 11;
    queueLength = Math.round(4 + progress * 2); // 4 -> 6
    arrivalRate = 2.4;
    baseServiceRate = 1.2;
    activeCounters = 3;
    counter4Open = false;
    activePipelineStage = 6; // Recommendation
  } else {
    phaseName = '4. Counter 4 Deployed & Load Re-balanced';
    const progress = (t - 8.2) / 3.2;
    counter4Open = true;
    activeCounters = 4;
    occupancy = 10;
    totalEntries = 21;
    totalExits = Math.round(11 + progress * 2);
    // Queue drops under 4 counters
    queueLength = Math.max(2, Math.round(6 - progress * 3)); // 6 -> 3
    arrivalRate = 1.6;
    baseServiceRate = 2.2; // 4 counters active
    activePipelineStage = 7; // Human Action executed
  }

  // Allow manual toggle override for interactive demo testing
  if (manualCounter4 !== null) {
    counter4Open = manualCounter4;
    activeCounters = counter4Open ? 4 : 3;
    baseServiceRate = counter4Open ? 2.2 : 1.2;
  }

  // Exact Rule-Based Little's Law Calculations
  const growthRate = Number((arrivalRate - baseServiceRate).toFixed(2));
  const predictedQueue5m = Math.max(0, Math.round(queueLength + growthRate * 5));
  const queueAlertThreshold = 8;
  const isSurgePredicted = predictedQueue5m >= queueAlertThreshold && growthRate > 0;
  const waitMinutes = (queueLength / baseServiceRate).toFixed(1);

  // Shelf simulation state (Aisle 3 Dairy Bay sh-03)
  let shelfRow2VoidRatio = 0.04;
  let shelfState: 'UNKNOWN' | 'EMPTY' | 'NORMAL' = 'UNKNOWN';
  let shelfAlertActive = false;
  let shelfMessage = 'Void ratio < 50%. Awaiting planogram verification.';

  if (t < 3.8) {
    shelfRow2VoidRatio = 0.04;
    shelfState = 'UNKNOWN';
    shelfAlertActive = false;
    shelfMessage = 'Void ratio 4% (conservative threshold: not empty, low unvalidated).';
  } else if (t < 8.5) {
    shelfRow2VoidRatio = 0.54;
    shelfState = 'EMPTY';
    shelfAlertActive = true;
    shelfMessage = 'Shelf sh-03 Row 2 empty (54% void > 50% threshold). Refill required.';
  } else {
    shelfRow2VoidRatio = 0.06;
    shelfState = 'NORMAL';
    shelfAlertActive = false;
    shelfMessage = 'Temporal filter (5-frame window) confirmed replenishment completed.';
  }

  // Chronological Event Stream based on current elapsed time
  const allEvents: SimulatedEvent[] = [
    {
      id: 'ev-01',
      time: 0.8,
      timeLabel: '00:00.8',
      badge: 'EVENT',
      title: 'Shopper #104 Entered Store',
      detail: 'Vector line intersection confirmed at Main Entrance.',
    },
    {
      id: 'ev-02',
      time: 2.2,
      timeLabel: '00:02.2',
      badge: 'CALCULATION',
      title: 'Occupancy Sample Updated',
      detail: 'Store Occupancy evaluated at 4 shoppers inside.',
    },
    {
      id: 'ev-03',
      time: 3.6,
      timeLabel: '00:03.6',
      badge: 'EVENT',
      title: 'Checkout Queue Buildup',
      detail: '3 shoppers entered Checkout ROI (CAM-03). Debounce passed.',
    },
    {
      id: 'ev-04',
      time: 4.8,
      timeLabel: '00:04.8',
      badge: 'SHELF',
      title: 'Shelf Void Detected (Aisle 3)',
      detail: 'Row 2 void ratio jumped to 54% (> 50% EMPTY threshold).',
    },
    {
      id: 'ev-05',
      time: 6.0,
      timeLabel: '00:06.0',
      badge: 'PREDICTION',
      title: "Little's Law Projection: 12 People in 5m",
      detail: 'Arrival (2.4/m) > Service (1.2/m). Net growth +1.2/min.',
    },
    {
      id: 'ev-06',
      time: 6.8,
      timeLabel: '00:06.8',
      badge: 'RECOMMENDATION',
      title: 'Directive Issued: Open Counter 4 Now',
      detail: 'Projected queue 12 exceeds threshold 8. High priority.',
    },
    {
      id: 'ev-07',
      time: 8.3,
      timeLabel: '00:08.3',
      badge: 'ACTION',
      title: 'Counter 4 Activated by Floor Associate',
      detail: 'Throughput increased from 1.2/min to 2.2/min (+83%).',
    },
    {
      id: 'ev-08',
      time: 9.8,
      timeLabel: '00:09.8',
      badge: 'CALCULATION',
      title: 'Queue Trend Stabilizing',
      detail: 'Net growth inverted to -0.4/min. Queue length clearing.',
    },
  ];

  const visibleEvents = allEvents.filter((ev) => ev.time <= t);

  return (
    <div className="w-full space-y-3.5 animate-in fade-in duration-150">
      {/* Simulation Banner Notice */}
      <div className="rounded-xl border border-amber-300 bg-amber-50/80 px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="size-2 rounded-full bg-amber-500 animate-ping" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Simulation Mode
              </span>
              <span className="rounded bg-amber-200/80 px-1.5 py-0.2 text-[10px] font-semibold text-amber-900 border border-amber-300">
                OFFLINE DEMONSTRATION
              </span>
            </div>
            <p className="text-[11px] text-amber-900/90 mt-0.5">
              Demonstrates the edge decision loop using deterministic signals synchronized with the local video playback. No external AI inference or cloud streaming is performed.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <span className="text-[11px] font-medium text-amber-800">
            Phase: <strong className="text-amber-950">{phaseName}</strong>
          </span>
        </div>
      </div>

      {/* Main Simulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Left Column: Video Feed with Visual Tracking Overlay & Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-card space-y-2.5">
            {/* Video Header & Mode */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VideoIcon className="size-4 text-purple-600" />
                <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                  Store Camera Feed #01 (Entrance & Checkout)
                </span>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                T = {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </span>
            </div>

            {/* Video Container with Simulated Tracking Overlays */}
            <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-300 select-none">
              <video
                ref={videoRef}
                src="/demo/supermarket-simulation.mp4"
                className="w-full h-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
              />

              {/* Prominent Overlay Notice */}
              <div className="absolute top-2 left-2 z-10">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/75 backdrop-blur-xs text-[9.5px] font-mono font-semibold text-emerald-400 border border-emerald-500/40">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  SIMULATED TRACKING — ILLUSTRATIVE DEMO
                </span>
              </div>

              {/* Virtual Entrance Line Overlay */}
              <div className="absolute top-10 left-4 right-1/2 border-b-2 border-dashed border-cyan-400/80 pointer-events-none">
                <span className="absolute -top-4 left-0 text-[8.5px] font-mono text-cyan-300 bg-cyan-950/80 px-1 rounded">
                  ENTRANCE LINE (VIRTUAL)
                </span>
              </div>

              {/* Virtual Checkout ROI Overlay */}
              <div className="absolute bottom-6 right-4 w-44 h-28 border-2 border-dashed border-amber-400/70 bg-amber-400/10 rounded pointer-events-none flex items-start justify-end p-1">
                <span className="text-[8.5px] font-mono text-amber-300 bg-amber-950/80 px-1 rounded">
                  CHECKOUT QUEUE ROI ({queueLength} in line)
                </span>
              </div>

              {/* Dynamic Simulated Person Bounding Boxes based on Time */}
              {/* Person 1: Walking shopper */}
              <div
                className="absolute border-2 border-emerald-400 bg-emerald-500/10 rounded transition-all duration-300 pointer-events-none"
                style={{
                  top: `${32 + Math.sin(t * 0.8) * 8}%`,
                  left: `${22 + (t * 4.5) % 55}%`,
                  width: '14%',
                  height: '42%',
                }}
              >
                <span className="absolute -top-4 left-0 text-[8.5px] font-mono text-emerald-300 bg-emerald-950/90 px-1 rounded">
                  ID: #104 (Shopper)
                </span>
              </div>

              {/* Person 2: Shopper with cart */}
              <div
                className="absolute border-2 border-emerald-400 bg-emerald-500/10 rounded transition-all duration-300 pointer-events-none"
                style={{
                  top: '36%',
                  left: `${58 - (t * 2.2) % 30}%`,
                  width: '16%',
                  height: '46%',
                }}
              >
                <span className="absolute -top-4 left-0 text-[8.5px] font-mono text-emerald-300 bg-emerald-950/90 px-1 rounded">
                  ID: #108 (Cart)
                </span>
              </div>

              {/* Person 3: In Queue area */}
              {t >= 3.0 && (
                <div
                  className="absolute border-2 border-amber-400 bg-amber-500/10 rounded transition-all duration-300 pointer-events-none animate-in fade-in"
                  style={{
                    bottom: '12%',
                    right: `${12 + (t % 3) * 4}%`,
                    width: '13%',
                    height: '38%',
                  }}
                >
                  <span className="absolute -top-4 left-0 text-[8.5px] font-mono text-amber-300 bg-amber-950/90 px-1 rounded">
                    ID: #115 (Queue)
                  </span>
                </div>
              )}

              {/* Timecode Watermark */}
              <div className="absolute bottom-2 left-2 z-10">
                <span className="text-[10px] font-mono text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">
                  CAM-01 · 25 FPS · LOCAL CACHE
                </span>
              </div>
            </div>

            {/* Video Player Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={togglePlay}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>

                <button
                  onClick={handleRestart}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium hover:bg-slate-200 transition"
                  title="Restart from Beginning"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Restart</span>
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                <span className="px-1.5 text-[10px] text-slate-500 uppercase font-semibold">Speed:</span>
                {[0.5, 1.0, 2.0].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changeSpeed(rate)}
                    className={`px-2 py-0.5 rounded text-[11px] transition ${
                      playbackRate === rate
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {/* Attribution Note */}
              <div className="w-full text-right">
                <span className="text-[10px] text-slate-400">
                  Asset: Pexels Supermarket Shopping (#10901926, Royalty-Free). Stored locally in /public/demo.
                </span>
              </div>
            </div>
          </div>

          {/* 7-Stage Intelligence Loop Step Indicator */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-card space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <span className="uppercase tracking-wider font-semibold text-[10px] text-slate-500">
                End-to-End Edge Decision Pipeline
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                Stage {activePipelineStage} of 7 Active
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium">
              {[
                { step: 1, label: 'Detection' },
                { step: 2, label: 'Tracking' },
                { step: 3, label: 'Events' },
                { step: 4, label: 'Metrics' },
                { step: 5, label: 'Prediction' },
                { step: 6, label: 'Directives' },
                { step: 7, label: 'Action' },
              ].map((s) => {
                const isActive = activePipelineStage === s.step;
                const isPassed = activePipelineStage > s.step;
                return (
                  <div
                    key={s.step}
                    className={`p-1.5 rounded-lg border transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs font-bold scale-102'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span className="block text-[9px] uppercase tracking-tighter opacity-80">
                      Step {s.step}
                    </span>
                    <span className="truncate block mt-0.5">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Stream Log */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-card space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Activity className="size-3.5 text-slate-500" />
                <span>Simulated Edge Telemetry Stream</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {visibleEvents.length} events emitted so far
              </span>
            </div>

            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {visibleEvents.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Starting video playback...</p>
              ) : (
                visibleEvents.slice(-4).reverse().map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                            ev.badge === 'ACTION'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : ev.badge === 'RECOMMENDATION'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : ev.badge === 'PREDICTION'
                              ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                              : ev.badge === 'SHELF'
                              ? 'bg-purple-100 text-purple-800 border-purple-300'
                              : 'bg-slate-200 text-slate-800 border-slate-300'
                          }`}
                        >
                          {ev.badge}
                        </span>
                        <span className="font-medium text-slate-800">{ev.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{ev.detail}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{ev.timeLabel}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Mathematical Panel & Actionable Directives (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Synchronized Metrics Card */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-card space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Live Store Telemetry
              </span>
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                  Occupancy
                </span>
                <span className="text-lg font-bold text-slate-900 block mt-0.5">{occupancy}</span>
                <span className="text-[9.5px] text-slate-500 block">shoppers inside</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                  Footfall
                </span>
                <span className="text-lg font-bold text-emerald-700 block mt-0.5">
                  {totalEntries} in / {totalExits} out
                </span>
                <span className="text-[9.5px] text-slate-500 block">line crossings</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                  Queue Length
                </span>
                <span className="text-lg font-bold text-amber-700 block mt-0.5">{queueLength}</span>
                <span className="text-[9.5px] text-slate-500 block">in checkout zone</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
                  Wait Estimate
                </span>
                <span className="text-lg font-bold text-blue-700 block mt-0.5">~{waitMinutes}m</span>
                <span className="text-[9.5px] text-slate-500 block">Little's Law W = L/λ</span>
              </div>
            </div>
          </div>

          {/* Mathematical Rule Explanation (Core Request) */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                <Sparkles className="size-3.5 text-blue-600" />
                <span>Explainable Little's Law Projection</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                Q(t+5m) = max(0, Q + Δ·5)
              </span>
            </div>

            {/* Arithmetic Formula Breakdown */}
            <div className="rounded-lg bg-white p-2.5 border border-blue-100 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-slate-700">
                <span>Arrival rate (λ):</span>
                <strong className="text-slate-900">{arrivalRate.toFixed(1)} / min</strong>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Service capacity (μ):</span>
                <strong className="text-slate-900">{baseServiceRate.toFixed(1)} / min</strong>
              </div>
              <div className="flex items-center justify-between text-slate-700 border-t border-slate-100 pt-1">
                <span>Net Growth (λ - μ):</span>
                <strong className={growthRate > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  {growthRate > 0 ? `+${growthRate.toFixed(2)}` : growthRate.toFixed(2)} / min
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                <span>5-Min Forecast:</span>
                <span className="text-sm text-indigo-700">
                  {queueLength} + ({growthRate > 0 ? `+${growthRate.toFixed(1)}` : growthRate.toFixed(1)} × 5) = {predictedQueue5m}
                </span>
              </div>
            </div>

            {/* Explanation Note */}
            <p className="text-[10.5px] text-blue-900/80 leading-relaxed">
              <strong>Rule Logic:</strong> IF predicted queue ≥ {queueAlertThreshold} AND growth rate &gt; 0, generate{' '}
              <code className="bg-blue-100 px-1 rounded text-blue-950 font-bold">OPEN_COUNTER_4</code> directive.
            </p>
          </div>

          {/* Action Simulation Card */}
          <div
            className={`rounded-xl border p-3 shadow-card space-y-2 transition-all duration-300 ${
              isSurgePredicted && !counter4Open
                ? 'border-red-300 bg-red-50/70'
                : counter4Open
                ? 'border-emerald-300 bg-emerald-50/70'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <AlertTriangle
                  className={`size-3.5 ${
                    isSurgePredicted && !counter4Open ? 'text-red-600 animate-bounce' : 'text-slate-400'
                  }`}
                />
                <span className="text-slate-800">Operational Counter Status</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  counter4Open
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : isSurgePredicted
                    ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {counter4Open ? '4 COUNTERS ONLINE' : '3 COUNTERS ONLINE'}
              </span>
            </div>

            {/* Simulated Counters Grid */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
              <div className="p-1.5 rounded bg-white border border-slate-200 font-medium">
                <span className="block text-slate-500">POS #1</span>
                <span className="text-emerald-700 font-bold">ACTIVE</span>
              </div>
              <div className="p-1.5 rounded bg-white border border-slate-200 font-medium">
                <span className="block text-slate-500">POS #2</span>
                <span className="text-emerald-700 font-bold">ACTIVE</span>
              </div>
              <div className="p-1.5 rounded bg-white border border-slate-200 font-medium">
                <span className="block text-slate-500">POS #3</span>
                <span className="text-emerald-700 font-bold">ACTIVE</span>
              </div>
              <div
                className={`p-1.5 rounded border font-medium transition-all ${
                  counter4Open
                    ? 'bg-emerald-600 text-white border-emerald-700 font-bold'
                    : 'bg-slate-100 text-slate-400 border-slate-200'
                }`}
              >
                <span className="block opacity-80">POS #4</span>
                <span>{counter4Open ? 'OPENED' : 'STANDBY'}</span>
              </div>
            </div>

            {/* Directive Action Banner */}
            {isSurgePredicted && !counter4Open && (
              <div className="p-2 rounded-lg bg-red-100/90 border border-red-200 text-xs flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="font-bold text-red-900">Queue Surge Directive Triggered</p>
                  <p className="text-[11px] text-red-800">
                    Predicted queue of {predictedQueue5m} will exceed threshold {queueAlertThreshold} in ~1.5 min.
                  </p>
                </div>
                <button
                  onClick={() => setManualCounter4(true)}
                  className="px-2.5 py-1 rounded bg-red-700 text-white font-bold text-[11px] hover:bg-red-800 shrink-0 transition"
                >
                  OPEN NOW
                </button>
              </div>
            )}

            {counter4Open && (
              <div className="p-2 rounded-lg bg-emerald-100/90 border border-emerald-200 text-xs flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="font-bold text-emerald-900">Counter 4 Deployed</p>
                  <p className="text-[11px] text-emerald-800">
                    Service rate increased to {baseServiceRate.toFixed(1)}/min. Queue forecast stabilized to {predictedQueue5m}.
                  </p>
                </div>
                <button
                  onClick={() => setManualCounter4(false)}
                  className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-medium hover:bg-emerald-300"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Shelf Camera Simulation (Separate Camera Event Stream) */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-950">
                <Boxes className="size-3.5 text-purple-700" />
                <span>Shelf Camera Simulation (Aisle 3 Dairy Bay sh-03)</span>
              </div>
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded border ${
                  shelfState === 'EMPTY'
                    ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
                    : shelfState === 'NORMAL'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                {shelfState}
              </span>
            </div>

            <div className="rounded-lg bg-white p-2.5 border border-purple-100 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-700">
                <span>Row 2 Empty-Space Ratio:</span>
                <strong className={shelfRow2VoidRatio >= 0.5 ? 'text-red-600 font-bold' : 'text-slate-800'}>
                  {(shelfRow2VoidRatio * 100).toFixed(0)}%
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Alert Status:</span>
                <span className="font-medium text-slate-900">
                  {shelfAlertActive ? 'ACTIVE REPLENISHMENT DIRECTIVE' : 'CLEAR'}
                </span>
              </div>
              <p className="text-[10.5px] text-slate-500 pt-1 border-t border-slate-100">
                {shelfMessage}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Architecture Explanation (Required Specification) */}
      <div className="rounded-xl border border-slate-200/90 bg-slate-100/80 p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
          <ShieldCheck className="size-4 text-emerald-600" />
          <span>RetailEdge Intelligence Architecture Loop</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono font-medium text-slate-700">
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">CAMERA</span>
          <ArrowRight className="size-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">DETECTION</span>
          <ArrowRight className="size-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">TRACKING</span>
          <ArrowRight className="size-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">EVENT EXTRACTION</span>
          <ArrowRight className="size-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">METRICS</span>
          <ArrowRight className="size-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">PREDICTION</span>
          <ArrowRight className="size-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-white border border-slate-200">RECOMMENDATION</span>
          <ArrowRight className="size-3 text-slate-400" />
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
            HUMAN ACTION
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-200/80">
          <strong>Note:</strong> Simulation Mode demonstrates the decision loop using deterministic rule-based signals synchronized with the demonstration video.
        </p>
      </div>
    </div>
  );
};
