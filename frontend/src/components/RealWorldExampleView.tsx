import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Camera,
  Maximize2,
  Minimize2,
  Grid,
  Columns,
  Layers,
  Activity,
  Users,
  Timer,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Info,
  Footprints,
  Eye,
  EyeOff,
  Sliders,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Video,
  Store,
  ArrowUpRight,
  ShieldAlert,
  Radio
} from 'lucide-react';

interface DetectionItem {
  track_id?: number;
  class: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  in_queue?: boolean;
}

interface CameraFrame {
  t: number;
  frame_idx: number;
  persons: DetectionItem[];
  shelf_voids: DetectionItem[];
  occupancy: number;
  queue_length: number;
}

interface CameraMetadata {
  id: string;
  name: string;
  zone: string;
  type: 'entrance' | 'shelf' | 'checkout' | 'queue' | 'exit';
  shelf_id?: string | null;
  video_url: string;
  detections_url: string;
  duration: number;
  resolution: string;
  fps: number;
  summary: {
    peak_occupancy: number;
    peak_queue: number;
    entries: number;
    exits: number;
    avg_voids: number;
    status: string;
  };
  roi_config: {
    entrance_line?: [[number, number], [number, number]] | null;
    checkout_roi?: [number, number][] | null;
  };
}

interface MinuteStat {
  timestamp: string;
  time_label: string;
  store_occupancy: number;
  queue_length: number;
  predicted_queue_5m: number;
  arrival_rate: number;
  service_rate: number;
  estimated_wait_min: number;
  shelf_availability_pct: number;
  total_shelf_voids: number;
  alert: string | null;
  cameras_active: number;
  cameras_total: number;
}

export const RealWorldExampleView: React.FC = () => {
  const [manifest, setManifest] = useState<{
    store_id: string;
    store_name: string;
    brand: string;
    cameras: CameraMetadata[];
    minute_timeline: MinuteStat[];
  } | null>(null);

  const [cameraFramesMap, setCameraFramesMap] = useState<Record<string, CameraFrame[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [maxDuration, setMaxDuration] = useState<number>(31.5);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [loopEnabled, setLoopEnabled] = useState<boolean>(true);

  // View state (light theme by default)
  const [layoutMode, setLayoutMode] = useState<'grid' | 'split' | 'focus'>('grid');
  const [focusedCameraId, setFocusedCameraId] = useState<string | null>(null);

  // Overlay layer filters
  const [showBBoxes, setShowBBoxes] = useState<boolean>(true);
  const [showVoids, setShowVoids] = useState<boolean>(true);
  const [showTrackIds, setShowTrackIds] = useState<boolean>(true);
  const [showROIs, setShowROIs] = useState<boolean>(true);
  const [showHUD, setShowHUD] = useState<boolean>(true);

  // Video elements refs
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Fetch real data manifest & per-camera detection JSONs
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const manifestRes = await fetch('/real-world/manifest.json');
        if (!manifestRes.ok) {
          throw new Error('Could not load DMart Beta 2 camera manifest');
        }
        const manifestJson = await manifestRes.json();
        if (!isMounted) return;
        setManifest(manifestJson);

        const maxDur = Math.max(...manifestJson.cameras.map((c: CameraMetadata) => c.duration || 30.0));
        setMaxDuration(maxDur);

        // Fetch actual detection JSON for each camera
        const framesMap: Record<string, CameraFrame[]> = {};
        await Promise.all(
          manifestJson.cameras.map(async (cam: CameraMetadata) => {
            try {
              const detRes = await fetch(cam.detections_url);
              if (detRes.ok) {
                const detJson = await detRes.json();
                framesMap[cam.id] = detJson.frames || [];
              }
            } catch (e) {
              console.warn(`Could not load real detections for ${cam.id}`, e);
            }
          })
        );

        if (!isMounted) return;
        setCameraFramesMap(framesMap);
        setLoading(false);
      } catch (err: any) {
        console.error('Failed to load DMart real-world data:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load video feeds');
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Time tracker animation loop
  useEffect(() => {
    let animId: number;
    let lastTs = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTs) / 1000;
      lastTs = now;

      if (isPlaying) {
        setCurrentTime((prev) => {
          let next = prev + delta * playbackSpeed;
          if (next >= maxDuration) {
            if (loopEnabled) {
              next = 0;
              Object.values(videoRefs.current).forEach((v) => {
                if (v) v.currentTime = 0;
              });
            } else {
              next = maxDuration;
              setIsPlaying(false);
            }
          }
          return next;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, maxDuration, playbackSpeed, loopEnabled]);

  // Synchronize play/pause across all videos
  const togglePlayAll = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      Object.values(videoRefs.current).forEach((v) => {
        if (!v) return;
        if (next) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
      return next;
    });
  }, []);

  // Handle master timeline seek
  const handleSeek = (newTime: number) => {
    setCurrentTime(newTime);
    Object.values(videoRefs.current).forEach((v) => {
      if (v) {
        v.currentTime = newTime % (v.duration || maxDuration);
      }
    });
  };

  // Change playback speed
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    Object.values(videoRefs.current).forEach((v) => {
      if (v) v.playbackRate = speed;
    });
  };

  // Reset playback
  const handleReset = () => {
    handleSeek(0);
    if (!isPlaying) {
      togglePlayAll();
    }
  };

  // Deduplicate overlapping person detections on the same physical individual (IoU / overlap suppression)
  const deduplicatePersons = useCallback((persons: DetectionItem[]): DetectionItem[] => {
    if (!persons || persons.length <= 1) return persons || [];
    const sorted = [...persons].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const kept: DetectionItem[] = [];

    for (const p of sorted) {
      const [x1, y1, x2, y2] = p.bbox;
      const area = Math.max(1, (x2 - x1) * (y2 - y1));
      let isDuplicate = false;

      for (const kp of kept) {
        const [kx1, ky1, kx2, ky2] = kp.bbox;
        const karea = Math.max(1, (kx2 - kx1) * (ky2 - ky1));

        const ix1 = Math.max(x1, kx1);
        const iy1 = Math.max(y1, ky1);
        const ix2 = Math.min(x2, kx2);
        const iy2 = Math.min(y2, ky2);

        const iw = Math.max(0, ix2 - ix1);
        const ih = Math.max(0, iy2 - iy1);
        const interArea = iw * ih;

        const minArea = Math.min(area, karea);
        const unionArea = area + karea - interArea;

        const iou = unionArea > 0 ? interArea / unionArea : 0;
        const ios = minArea > 0 ? interArea / minArea : 0;

        // If boxes overlap by > 35% IoU or > 50% of the smaller box, it is the same person!
        if (iou > 0.35 || ios > 0.50) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        kept.push(p);
      }
    }
    return kept;
  }, []);

  // Get nearest frame from real inference detections for a given camera & time
  const getNearestFrame = useCallback(
    (camId: string, timeSec: number): CameraFrame | null => {
      const frames = cameraFramesMap[camId];
      if (!frames || frames.length === 0) return null;

      const duration = manifest?.cameras.find((c) => c.id === camId)?.duration || maxDuration;
      const modTime = timeSec % duration;

      let best = frames[0];
      let minDiff = Math.abs(best.t - modTime);
      for (let i = 1; i < frames.length; i++) {
        const diff = Math.abs(frames[i].t - modTime);
        if (diff < minDiff) {
          minDiff = diff;
          best = frames[i];
        } else if (frames[i].t > modTime) {
          break;
        }
      }

      if (!best) return null;

      // Ensure zero duplicate person counts in any frame
      const dedupedPersons = deduplicatePersons(best.persons);
      const queueCount = dedupedPersons.filter((p) => p.in_queue).length;

      return {
        ...best,
        persons: dedupedPersons,
        occupancy: dedupedPersons.length,
        queue_length: queueCount,
      };
    },
    [cameraFramesMap, manifest, maxDuration, deduplicatePersons]
  );

  // Active camera list
  const cameras: CameraMetadata[] = manifest?.cameras || [];
  const focusedCamera = cameras.find((c) => c.id === focusedCameraId) || cameras[0] || null;

  // Pure real-world counts aggregated strictly from active frames at currentTime
  const liveFrameMetrics = useMemo(() => {
    let totalPersons = 0;
    let totalQueue = 0;
    let totalVoids = 0;

    cameras.forEach((cam) => {
      const frame = getNearestFrame(cam.id, currentTime);
      if (frame) {
        totalPersons += frame.persons.length;
        totalQueue += frame.queue_length;
        totalVoids += frame.shelf_voids.length;
      }
    });

    return {
      totalPersons,
      totalQueue,
      totalVoids,
      onlineFeeds: cameras.length,
    };
  }, [cameras, currentTime, getNearestFrame]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/90 shadow-card min-h-[420px]">
        <div className="relative flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-[#008248] mb-3">
          <RefreshCw className="size-6 animate-spin" />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-[#008248] text-white px-2 py-0.5 rounded font-black text-xs">
            <span className="text-amber-300">D</span>Mart
          </span>
          <h3 className="text-sm  text-slate-800">Connecting DMart Beta 2 Camera Network...</h3>
        </div>
        <p className="text-xs text-slate-500">Loading 7 synchronized live store camera channels & real model detection feeds</p>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <AlertTriangle className="size-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm  text-rose-900">Failed to load DMart Beta 2 feeds</h3>
        <p className="text-xs text-rose-600 mt-1">{error || 'Manifest not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* 1. Surveillance Stream Control Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Stream Information */}
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className=" text-xs text-slate-900 tracking-tight uppercase">
              STORE · Greater Noida
            </span>
            <span className="text-slate-300">·</span>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px]  text-[#008248] border border-emerald-200">
              7 Live IP Feeds
            </span>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
              YOLO11n + Shelf-Gap Model
            </span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className=" text-[10px] text-slate-500 hidden sm:inline">
              848x478 @ 60 FPS
            </span>
          </div>

          {/* Master Video Playback Controls in Light Mode */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Speed Selector */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] border border-slate-200">
              {[0.5, 1.0, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`px-2.5 py-1 rounded-md  font-medium transition-all ${
                    playbackSpeed === s
                      ? 'bg-white text-slate-900 shadow-xs '
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Play/Pause & Reset */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-0.5 rounded-lg">
              <button
                onClick={handleReset}
                title="Rewind to start"
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              >
                <RotateCcw className="size-4" />
              </button>

              <button
                onClick={togglePlayAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#008248] hover:bg-[#00703d] text-white font-medium text-xs shadow-xs transition-all"
              >
                {isPlaying ? (
                  <>
                    <Pause className="size-3.5 fill-current" />
                    <span>Pause Feeds</span>
                  </>
                ) : (
                  <>
                    <Play className="size-3.5 fill-current" />
                    <span>Sync Play All (7)</span>
                  </>
                )}
              </button>
            </div>

            {/* View Mode */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 text-[11px] border border-slate-200">
              <button
                onClick={() => {
                  setLayoutMode('grid');
                  setFocusedCameraId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                  layoutMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs '
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="size-3.5" />
                <span>Matrix</span>
              </button>

              <button
                onClick={() => {
                  setLayoutMode('split');
                  setFocusedCameraId(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                  layoutMode === 'split'
                    ? 'bg-white text-slate-900 shadow-xs '
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="size-3.5" />
                <span>2-Col</span>
              </button>

              <button
                onClick={() => {
                  setLayoutMode('focus');
                  if (!focusedCameraId) setFocusedCameraId(cameras[0]?.id || 'CAM-01');
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                  layoutMode === 'focus'
                    ? 'bg-white text-slate-900 shadow-xs '
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Maximize2 className="size-3.5" />
                <span>Inspector</span>
              </button>
            </div>
          </div>
        </div>

        {/* Global Scrubbing Slider & Layer Toggles in Light Mode */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-3">
          {/* Synchronized Timeline Scrubber */}
          <div className="flex items-center gap-2.5 w-full md:w-5/12 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px]   text-slate-700 w-11 shrink-0">
              00:{Math.floor(currentTime).toString().padStart(2, '0')}
            </span>
            <input
              type="range"
              min="0"
              max={maxDuration}
              step="0.1"
              value={currentTime}
              onChange={(e) => handleSeek(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#008248] focus:outline-none"
            />
            <span className="text-[11px]  text-slate-500 w-11 shrink-0 text-right">
              00:{Math.floor(maxDuration).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Model Overlay Toggles in Light Mode */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-slate-500  text-[10px] uppercase tracking-wider mr-1">
              Active Layers:
            </span>

            <button
              onClick={() => setShowBBoxes(!showBBoxes)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                showBBoxes
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs '
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
              }`}
            >
              Shopper Boxes
            </button>

            <button
              onClick={() => setShowVoids(!showVoids)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                showVoids
                  ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs '
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
              }`}
            >
              Shelf Voids
            </button>

            <button
              onClick={() => setShowTrackIds(!showTrackIds)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                showTrackIds
                  ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs '
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
              }`}
            >
              ByteTrack IDs
            </button>

            <button
              onClick={() => setShowROIs(!showROIs)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                showROIs
                  ? 'bg-amber-50 border-amber-300 text-amber-800 shadow-2xs '
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
              }`}
            >
              ROI Boundaries
            </button>

            <button
              onClick={() => setShowHUD(!showHUD)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                showHUD
                  ? 'bg-purple-50 border-purple-300 text-purple-800 shadow-2xs '
                  : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
              }`}
            >
              CCTV HUD
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Telemetry Directly Computed from Active Frames */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Live Shoppers */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px]  text-slate-500 uppercase tracking-wider">Shoppers Detected</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-slate-900 ">{liveFrameMetrics.totalPersons}</span>
            <span className="text-xs text-slate-500 font-medium">in active frames</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-emerald-700 font-medium">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Real YOLO Detections</span>
          </div>
        </div>

        {/* Metric 2: Live Queue */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px]  text-slate-500 uppercase tracking-wider">Queue at Checkout</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-amber-700 ">{liveFrameMetrics.totalQueue}</span>
            <span className="text-xs text-slate-500 font-medium">in checkout ROI</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Register Area (CAM-05 / CAM-06)
          </p>
        </div>

        {/* Metric 3: Live Shelf Voids */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px]  text-slate-500 uppercase tracking-wider">Shelf Void Gaps</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-purple-700 ">{liveFrameMetrics.totalVoids}</span>
            <span className="text-xs text-slate-500 font-medium">gaps detected</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Aisle Shelves (CAM-02 / CAM-03 / CAM-04)
          </p>
        </div>

        {/* Metric 4: Active Synchronized Channels */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
          <p className="text-[10px]  text-slate-500 uppercase tracking-wider">Camera Feeds</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-[#008248] ">{cameras.length} / {cameras.length}</span>
            <span className="text-xs text-slate-500 font-medium">active streams</span>
          </div>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Online & Synchronized</span>
          </p>
        </div>
      </div>

      {/* 3. Multi-Camera Grid (Side-by-Side Light CCTV Frames) */}
      {layoutMode !== 'focus' ? (
        <div
          className={`grid gap-3.5 ${
            layoutMode === 'split'
              ? 'grid-cols-1 md:grid-cols-2'
              : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
          }`}
        >
          {cameras.map((cam) => {
            const frame = getNearestFrame(cam.id, currentTime);
            const persons = frame?.persons || [];
            const voids = frame?.shelf_voids || [];
            const occ = frame?.occupancy ?? 0;
            const q = frame?.queue_length ?? 0;

            return (
              <div
                key={cam.id}
                className="group relative rounded-2xl bg-white border border-slate-200/90 shadow-card hover:shadow-card-hover hover:border-emerald-500/80 transition-all flex flex-col overflow-hidden"
              >
                {/* Camera Top Light Header */}
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="  text-slate-900 tracking-tight">{cam.id}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px]  text-slate-400 font-medium">
                      {cam.resolution}
                    </span>
                    <button
                      onClick={() => {
                        setFocusedCameraId(cam.id);
                        setLayoutMode('focus');
                      }}
                      title="Inspect Camera in Full View"
                      className="p-1 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                    >
                      <Maximize2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Video Container with Overlaid Model Detections */}
                <div className="relative aspect-[848/478] bg-slate-900 overflow-hidden flex items-center justify-center">
                  <video
                    ref={(el) => (videoRefs.current[cam.id] = el)}
                    src={cam.video_url}
                    playsInline
                    muted
                    loop={loopEnabled}
                    className="w-full h-full object-cover"
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      v.playbackRate = playbackSpeed;
                      if (isPlaying) v.play().catch(() => {});
                    }}
                  />

                  {/* SVG Canvas for High-Precision Model Detections */}
                  <svg
                    viewBox="0 0 848 478"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    {/* 1. Entrance Tripwire Line */}
                    {showROIs && cam.roi_config?.entrance_line && (
                      <line
                        x1={cam.roi_config.entrance_line[0][0]}
                        y1={cam.roi_config.entrance_line[0][1]}
                        x2={cam.roi_config.entrance_line[1][0]}
                        y2={cam.roi_config.entrance_line[1][1]}
                        stroke="#0284c7"
                        strokeWidth="2.5"
                        strokeDasharray="6 3"
                      />
                    )}

                    {/* 2. Checkout Queue Polygon ROI */}
                    {showROIs && cam.roi_config?.checkout_roi && (
                      <polygon
                        points={cam.roi_config.checkout_roi.map((pt) => `${pt[0]},${pt[1]}`).join(' ')}
                        fill="rgba(245, 158, 11, 0.16)"
                        stroke="#d97706"
                        strokeWidth="2"
                        strokeDasharray="6 3"
                      />
                    )}

                    {/* 3. YOLO11n Person Bounding Boxes */}
                    {showBBoxes &&
                      persons.map((p, pIdx) => {
                        const [x1, y1, x2, y2] = p.bbox;
                        const w = Math.max(10, x2 - x1);
                        const h = Math.max(15, y2 - y1);
                        const inQ = p.in_queue;

                        return (
                          <g key={`p-${p.track_id || pIdx}`}>
                            <rect
                              x={x1}
                              y={y1}
                              width={w}
                              height={h}
                              fill={inQ ? 'rgba(217, 119, 6, 0.22)' : 'rgba(5, 150, 105, 0.2)'}
                              stroke={inQ ? '#d97706' : '#059669'}
                              strokeWidth="2"
                              rx="3"
                            />
                            {showTrackIds && (
                              <g transform={`translate(${x1}, ${Math.max(14, y1 - 4)})`}>
                                <rect
                                  x="0"
                                  y="-12"
                                  width={inQ ? 95 : 85}
                                  height="14"
                                  fill={inQ ? '#b45309' : '#047857'}
                                  rx="2"
                                />
                                <text
                                  x="4"
                                  y="-2"
                                  fill="#ffffff"
                                  fontSize="9.5"
                                  fontFamily="monospace"
                                  fontWeight="700"
                                >
                                  {inQ ? `Queue #${p.track_id}` : `Person #${p.track_id}`}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}

                    {/* 4. Localized Shelf Gap Void Detections */}
                    {showVoids &&
                      voids.map((v, vIdx) => {
                        const [x1, y1, x2, y2] = v.bbox;
                        const w = Math.max(10, x2 - x1);
                        const h = Math.max(10, y2 - y1);

                        return (
                          <g key={`v-${vIdx}`}>
                            <rect
                              x={x1}
                              y={y1}
                              width={w}
                              height={h}
                              fill="rgba(225, 29, 72, 0.25)"
                              stroke="#e11d48"
                              strokeWidth="2"
                              strokeDasharray="5 2.5"
                              rx="3"
                            />
                            <g transform={`translate(${x1}, ${Math.max(14, y1 - 4)})`}>
                              <rect x="0" y="-12" width="75" height="14" fill="#be123c" rx="2" />
                              <text
                                x="4"
                                y="-2"
                                fill="#ffffff"
                                fontSize="9"
                                fontFamily="monospace"
                                fontWeight="700"
                              >
                                SHELF VOID
                              </text>
                            </g>
                          </g>
                        );
                      })}
                  </svg>

                  {/* Clean Light-Frosted CCTV Watermark HUD Overlay */}
                  {showHUD && (
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-[10px]  text-slate-800 border border-slate-200/80 shadow-xs">
                      <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className=" text-rose-700">REC</span>
                      <span className="text-slate-400">·</span>
                      <span className="">
                        13:21:{(28 + Math.floor(currentTime)).toString().padStart(2, '0')} IST
                      </span>
                    </div>
                  )}

                  {/* Top-Right Light Frosted Camera Telemetry Badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] ">
                    <span className="px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-emerald-800  border border-slate-200 shadow-xs">
                      OCC: {occ}
                    </span>
                    {cam.type === 'queue' || cam.type === 'checkout' ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-amber-800  border border-slate-200 shadow-xs">
                        Q: {q}
                      </span>
                    ) : null}
                    {cam.type === 'shelf' && voids.length > 0 ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-md text-rose-700  border border-slate-200 shadow-xs">
                        VOIDS: {voids.length}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Camera Bottom Telemetry Strip in Light Mode */}
                <div className="px-3.5 py-2 bg-slate-50 text-slate-600 flex items-center justify-between text-xs  border-t border-slate-200/80">
                  <div className="flex items-center gap-3">
                    <span>
                      Detections: <strong className="text-slate-900">{persons.length}</strong> shoppers
                    </span>
                    {cam.type === 'shelf' && (
                      <span>
                        Shelf: <strong className="text-purple-700">{voids.length} voids</strong>
                      </span>
                    )}
                  </div>

                  <span className="text-slate-400 text-[10px]">
                    {cam.resolution} · {cam.fps} FPS
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 4. Single Camera Inspector Mode (Expanded Focus in Light Theme) */
        focusedCamera && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-slate-900 shadow-card flex flex-col lg:flex-row gap-4">
            {/* Left Column: Enlarged Video Stream */}
            <div className="w-full lg:w-2/3 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm  text-slate-900 tracking-tight">
                    {focusedCamera.id}
                  </h3>
                  <span className="text-xs text-slate-500 ">
                    {focusedCamera.resolution} · {focusedCamera.fps} FPS
                  </span>
                </div>

                <button
                  onClick={() => setLayoutMode('grid')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs  transition-colors"
                >
                  <Minimize2 className="size-3.5" />
                  <span>Exit Inspector</span>
                </button>
              </div>

              {/* Main Expanded Video */}
              <div className="relative aspect-[848/478] bg-slate-900 rounded-xl overflow-hidden mt-3 border border-slate-200 shadow-xs">
                <video
                  ref={(el) => (videoRefs.current[focusedCamera.id] = el)}
                  src={focusedCamera.video_url}
                  playsInline
                  muted
                  loop={loopEnabled}
                  className="w-full h-full object-cover"
                />

                {/* SVG Overlay */}
                <svg viewBox="0 0 848 478" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* ROI Lines */}
                  {showROIs && focusedCamera.roi_config?.entrance_line && (
                    <line
                      x1={focusedCamera.roi_config.entrance_line[0][0]}
                      y1={focusedCamera.roi_config.entrance_line[0][1]}
                      x2={focusedCamera.roi_config.entrance_line[1][0]}
                      y2={focusedCamera.roi_config.entrance_line[1][1]}
                      stroke="#0284c7"
                      strokeWidth="3"
                      strokeDasharray="6 3"
                    />
                  )}

                  {showROIs && focusedCamera.roi_config?.checkout_roi && (
                    <polygon
                      points={focusedCamera.roi_config.checkout_roi.map((pt) => `${pt[0]},${pt[1]}`).join(' ')}
                      fill="rgba(245, 158, 11, 0.2)"
                      stroke="#d97706"
                      strokeWidth="2.5"
                      strokeDasharray="6 3"
                    />
                  )}

                  {/* Active Persons */}
                  {showBBoxes &&
                    getNearestFrame(focusedCamera.id, currentTime)?.persons.map((p, idx) => {
                      const [x1, y1, x2, y2] = p.bbox;
                      return (
                        <g key={`focus-p-${p.track_id || idx}`}>
                          <rect
                            x={x1}
                            y={y1}
                            width={x2 - x1}
                            height={y2 - y1}
                            fill={p.in_queue ? 'rgba(217, 119, 6, 0.25)' : 'rgba(5, 150, 105, 0.22)'}
                            stroke={p.in_queue ? '#d97706' : '#059669'}
                            strokeWidth="2.5"
                            rx="4"
                          />
                          <g transform={`translate(${x1}, ${Math.max(18, y1 - 6)})`}>
                            <rect x="0" y="-14" width="105" height="16" fill="#047857" rx="3" />
                            <text x="6" y="-2" fill="#ffffff" fontSize="10.5" fontFamily="monospace" fontWeight="700">
                              {p.in_queue ? `Queue #${p.track_id}` : `Person #${p.track_id}`} ({(p.confidence * 100).toFixed(0)}%)
                            </text>
                          </g>
                        </g>
                      );
                    })}

                  {/* Active Voids */}
                  {showVoids &&
                    getNearestFrame(focusedCamera.id, currentTime)?.shelf_voids.map((v, idx) => {
                      const [x1, y1, x2, y2] = v.bbox;
                      return (
                        <g key={`focus-v-${idx}`}>
                          <rect
                            x={x1}
                            y={y1}
                            width={x2 - x1}
                            height={y2 - y1}
                            fill="rgba(225, 29, 72, 0.3)"
                            stroke="#e11d48"
                            strokeWidth="2.5"
                            strokeDasharray="5 3"
                            rx="4"
                          />
                          <g transform={`translate(${x1}, ${Math.max(18, y1 - 6)})`}>
                            <rect x="0" y="-14" width="85" height="16" fill="#be123c" rx="3" />
                            <text x="6" y="-2" fill="#ffffff" fontSize="10" fontFamily="monospace" fontWeight="700">
                              SHELF VOID
                            </text>
                          </g>
                        </g>
                      );
                    })}
                </svg>

                <div className="absolute bottom-2.5 left-2.5 px-3 py-1 rounded-md bg-white/90 backdrop-blur-md text-xs  text-slate-800 border border-slate-200/90 shadow-xs">
                  REC: 00:{Math.floor(currentTime).toString().padStart(2, '0')}.{Math.floor((currentTime % 1) * 100).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Camera Switcher Strip */}
              <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1">
                {cameras.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setFocusedCameraId(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      focusedCamera.id === c.id
                        ? 'bg-[#008248] text-white shadow-xs '
                        : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {c.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Hardware Specs & Live Telemetry Inspector in Light Mode */}
            <div className="w-full lg:w-1/3 flex flex-col justify-between space-y-3.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/90">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h4 className="text-xs  text-slate-900 uppercase tracking-wider">
                    Edge Model Telemetry
                  </h4>
                  <span className="text-[10px]   text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    LATENCY: 24ms
                  </span>
                </div>

                {/* Current Detections List */}
                <div className="space-y-2">
                  <p className="text-xs  text-slate-700">Real Detections In Current Frame:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1  text-xs">
                    {getNearestFrame(focusedCamera.id, currentTime)?.persons.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-900 ">DMart #{p.track_id}</span>
                          <span className="text-slate-500 text-[10px]">person</span>
                        </div>
                        <span className="text-emerald-700  text-[11px]">
                          {(p.confidence * 100).toFixed(0)}% conf
                        </span>
                      </div>
                    ))}

                    {getNearestFrame(focusedCamera.id, currentTime)?.shelf_voids.map((v, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 shadow-2xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-rose-500" />
                          <span className="text-rose-900 ">Shelf Gap Void</span>
                        </div>
                        <span className="text-rose-700  text-[11px]">
                          {(v.confidence * 100).toFixed(0)}% conf
                        </span>
                      </div>
                    ))}

                    {(!getNearestFrame(focusedCamera.id, currentTime)?.persons.length &&
                      !getNearestFrame(focusedCamera.id, currentTime)?.shelf_voids.length) && (
                      <div className="p-4 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
                        No active targets in view
                      </div>
                    )}
                  </div>
                </div>

                {/* Hardware Spec Card in Light Mode */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 text-xs  shadow-2xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Camera Model:</span>
                    <span className="text-slate-800 ">Sony IMX415 (DMart Overhead)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RTSP Stream:</span>
                    <span className="text-blue-700 font-medium truncate max-w-[170px]">rtsp://dmart-edge.ch{focusedCamera.id.slice(-2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resolution:</span>
                    <span className="text-slate-800 ">{focusedCamera.resolution} @ {focusedCamera.fps} FPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Model Pipeline:</span>
                    <span className="text-[#008248] ">YOLO11n + ByteTrack</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs text-slate-500">
                <p>
                  Zero raw video cloud upload. Only anonymous spatial telemetry is retained for operations.
                </p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
