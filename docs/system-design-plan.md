# RetailEdge AI — System Design Plan

<div class="doc-meta">

| | |
|---|---|
| **Project** | RetailEdge AI — Intelligent Retail Analytics System |
| **Problem Statement** | SIH 26179 (Qualcomm Inc) — AI-powered retail intelligence: real-time shopper analytics, automated inventory visibility, proactive queue management |
| **Document Type** | System Design Plan (v1.0) |
| **Date** | September 10, 2026 |
| **Audience** | SIH judges, team, future engineers |
| **Status** | Approved for build — MVP targets Jetson Orin Nano demo with laptop fallback |

</div>

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals, Non-Goals & Success Metrics](#2-goals-non-goals--success-metrics)
3. [Users & Personas](#3-users--personas)
4. [High-Level System Architecture](#4-high-level-system-architecture)
5. [Module Designs](#5-module-designs)
6. [Edge AI Stack & Hardware Plan](#6-edge-ai-stack--hardware-plan)
7. [Privacy & DPDP Compliance by Design](#7-privacy--dpdp-compliance-by-design)
8. [Data Architecture](#8-data-architecture)
9. [APIs & Interfaces](#9-apis--interfaces)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Reliability, Observability & Failure Modes](#11-reliability-observability--failure-modes)
12. [Phased Execution Plan](#12-phased-execution-plan)
13. [Team, Cadence & Governance](#13-team-cadence--governance)
14. [Business Case & Commercial Model](#14-business-case--commercial-model)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Competitive Positioning & Moat](#16-competitive-positioning--moat)
17. [Roadmap & Future Enhancements](#17-roadmap--future-enhancements)
18. [Appendix A — Key Formulas](#appendix-a--key-formulas)
19. [Appendix B — Hardware BOM](#appendix-b--hardware-bom)
20. [Appendix C — References](#appendix-c--references)

---

## 1. Executive Summary

**RetailEdge AI** is an edge-native retail intelligence platform that converts existing CCTV feeds into real-time, privacy-safe business insights using three integrated modules — **Shopper Analytics**, **Inventory Monitoring**, and **Queue Intelligence** — running entirely **on an in-store edge device**. No video ever leaves the premises; only anonymized, structured events are stored locally and optionally synced to a central cloud for multi-store BI.

**One-line pitch:** *Cameras + edge compute run all vision AI inside the store; only anonymized events (counts, alerts, KPIs) cross the network — no video, no faces, no cloud dependency.*

### 1.1 Why this design wins on this problem statement

Qualcomm's PS 26179 explicitly demands: *"maintaining privacy and minimizing cloud dependency"*, *"operate even during internet disruptions"*, *"AI inference should happen locally on the edge devices"*, and *"convert video streams into actionable business insights."* Most teams will build a cloud dashboard with recorded clips and violate the core constraint. This system is **offline-first by construction**: full functionality with zero internet, proven live in the demo by pulling the network cable.

### 1.2 Design principles

| # | Principle | How the design achieves it |
|---|---|---|
| P1 | **Real-time** | Inference latency < 100 ms on-device; alert-to-dashboard < 2 s end-to-end |
| P2 | **Privacy by architecture** | No face recognition, no video retention, metadata-only storage & sync; kill-switch |
| P3 | **Offline-first** | Zero network calls anywhere in the pipeline; store-and-forward sync is optional |
| P4 | **Low cost** | ₹18k–₹60k per store hardware (BOM in Appendix B); one box serves 4–8 cameras |
| P5 | **Works with what stores have** | Ingests existing CCTV via RTSP; no POS/inventory system is a prerequisite |
| P6 | **Deployable day one** | COCO-pretrained YOLO11n + heuristics — no per-store model training required for MVP |
| P7 | **Calibration, not retraining** | Per-store tuning via `store_config.yaml` thresholds, never code changes |
| P8 | **Graceful degradation** | Every module independent; one failing camera or module never takes down the demo or the store |

### 1.3 Design sources

This plan consolidates four prior project artifacts: the full solution blueprint (`fusion-response 2026-09-09 (1).md`), the phased implementation plan (`fusion-response 2026-09-09.md`), the SIH MVP scope targeting the Jetson Orin Nano (`MVP-POC-Plan.md`), and the market/technology research brief (`retail-intelligence-market-research.md`). Market figures cited in §14 are sourced in Appendix C.

---

## 2. Goals, Non-Goals & Success Metrics

### 2.1 Goals (MoSCoW: Must-have)

| ID | Goal | Success Metric |
|---|---|---|
| G1 | Entry/exit people counting with real camera streams | Entry/exit count MAE ≤ 2% (pilot footage), ≤ 5% (MVP demo) |
| G2 | Zone dwell time + footfall heatmap | Heatmap spatially matches observed lingering; dwell error ≤ 15% |
| G3 | Out-of-stock / low-stock detection | OOS precision ≥ 0.85 (MVP) / 0.90 with recall ≥ 0.85 (pilot target) |
| G4 | Queue length measurement + congestion prediction | Predicted wait within ±20% of measured at 10-min horizon |
| G5 | Full on-device inference (edge demo box) | ≥ 30 FPS per stream on Jetson Orin Nano (TensorRT INT8) |
| G6 | Operates with zero internet | All modules functional with network cable pulled |
| G7 | Single-store operator dashboard | KPIs, alerts, heatmap visible in one UI served from the edge box |
| G8 | Privacy compliance by construction | No video written to disk; no PII in events or sync payload |

### 2.2 Non-goals (explicitly out of scope — Won't-have)

- ❌ Face recognition or any person re-identification across sessions
- ❌ Per-SKU product recognition in MVP (heuristic shelf-gap detection instead; 2-stage model is the production upgrade, §17)
- ❌ Cloud video storage, cloud inference, or any real-time cloud dependency
- ❌ POS/ERP/Tally/Zoho/SAP integration in MVP (roadmap slide, §17)
- ❌ Fleet management, OTA updates, multi-store console (post-SIH)
- ❌ Autonomous checkout (adjacent market — AiFi/Trigo territory)

### 2.3 Should-have (post-MVP) & Could-have (roadmap)

| MoSCoW | Item |
|---|---|
| Should | Daily PDF/HTML analytics report generator; replay harness for recorded footage; staff mobile alert push |
| Could | Gradient-boosted footfall forecaster (CPU-only, offline); planogram compliance module; chain-level cloud BI |

---

## 3. Users & Personas

| Persona | Role in system | Primary jobs-to-be-done | Interface |
|---|---|---|---|
| **Store owner/manager** (kirana, supermarket, pharmacy) | Primary buyer; consumes KPIs & alerts | "Are we losing sales to stockouts? Do I need another counter at 6 pm?" | Dashboard (LAN browser / phone) |
| **Floor staff / replenisher** | Alert responder | "Where do I go right now and what's empty?" | Alert feed with aisle location + blurred snapshot |
| **Chain operations lead** | Fleet-level consumer (Phase 4) | "Which stores underperform on footfall conversion / OOS SLA?" | Central BI (cloud-optional) |
| **Store IT / installer** | Deployment & maintenance | "Install, calibrate, and leave it running without babysitting" | Config tool, systemd services, watchdog |
| **The customer being observed** | Never sees the system; must remain anonymous | — | Protected by design: no faces, no identity, no stored video |

---

## 4. High-Level System Architecture

### 4.1 Component diagram (production form)

<div class="diagram">

```
┌───────────────────────────── STORE (Edge Zone) ─────────────────────────────┐
│                                                                              │
│  IP / USB Cameras (2–8)          Edge AI Box (Jetson Orin Nano / QCS6490 /   │
│  ├─ Entrance cam            │    RPi5+Hailo — Appendix B tiers)              │
│  ├─ Aisle/shelf cams        │  ┌────────────────────────────────────────┐    │
│  └─ Checkout cam            ├─►│  1. INGEST   OpenCV VideoCapture        │    │
│                             │  │              (USB / RTSP, auto-retry)   │    │
│                             │  ├────────────────────────────────────────┤    │
│                             │  │  2. INFER    YOLO11n (TensorRT INT8     │    │
│                             │  │              on Jetson / ONNX runtime)  │    │
│                             │  ├────────────────────────────────────────┤    │
│                             │  │  3. TRACK    ByteTrack (Kalman + IoU)   │    │
│                             │  ├────────────────────────────────────────┤    │
│                             │  │  4. REASON   store_config.yaml-driven   │    │
│                             │  │    LineZone counters · PolygonZone      │    │
│                             │  │    dwell · heatmap · shelf occupancy    │    │
│                             │  │    M/M/c queue predictor                │    │
│                             │  ├────────────────────────────────────────┤    │
│                             │  │  5. EMIT     anonymized JSON events     │    │
│                             │  └───────────────┬────────────────────────┘    │
│                             │                  │                              │
│  Staff mobile app  ◄────────┼──┐               ▼                              │
│  (alerts/tasks, P2)         │  │   ┌──────────────────────┐                   │
│                             │  │   │  Local Event Store    │                   │
│  Ops Dashboard     ◄────────┼──┤   │  SQLite (events,      │                   │
│  (LAN-only web)    ─────────┼──┘   │  aggregates, alerts)  │                   │
│                             │      └──────────┬───────────┘                   │
│                             │                 │ optional                      │
│  Kill-switch (UI + config)  │                 ▼                               │
└─────────────────────────────┼─────────────────────────────────────────────────┘
                              │            ┌───────────────────────────────┐
                              └── SYNC ──► │  Central Cloud (OPTIONAL)     │
                                           │  store-and-forward,           │
                                           │  metadata-only JSON over      │
                                           │  MQTT/TLS — fleet monitor,    │
                                           │  chain BI, model OTA          │
                                           └───────────────────────────────┘
```

</div>

**Key data flow:** `Camera frame → detect → track → business logic (zones/planogram/queue) → anonymized event → local DB → dashboard/alert`. Raw frames are processed in memory and **never written to disk** (enforced by pipeline design, not policy — see §7).

### 4.2 Why each layer lives at the edge

| Concern | Decision | Rationale |
|---|---|---|
| Inference | Edge box | PS requirement; < 100 ms latency; zero bandwidth cost (57 GB/day if cloud-video — see §4.3) |
| Event storage | Local SQLite | Full offline operation; single file, zero ops burden |
| Dashboard | LAN-served from the box | Judges/operators open it from any phone on store Wi-Fi — with no internet |
| Multi-store sync | Optional, store-and-forward, metadata-only | Internet outage never blocks the store; sync is a resume, not a dependency |
| Model updates | USB sideload / OTA when online | Offline-capable deployment lifecycle |

### 4.3 Bandwidth feasibility (the number that justifies edge)

Cloud-video approach for 6 streams × 14 h/day at 1.5 Mbps: `6 × 1.5 Mbps × 50,400 s ÷ 8 ≈ 57 GB/day` upload — impossible on Tier-2/3 links. The edge design sends **only events**: a full day of events for one store is < 5 MB (≈ 0.009% of the video payload).

---

## 5. Module Designs

### 5.1 Module M1 — Shopper Analytics (entrance/aisle cameras)

| Feature | Approach | Output |
|---|---|---|
| Entry/exit counting | YOLO11n `person` class → ByteTrack IDs → **LineZone** crossing with direction test | In/out counters, net occupancy |
| Footfall trends | Hourly + day-part aggregation of line-cross events → `footfall` table | Trends by time/day/zone |
| Dwell time | Track persists inside **PolygonZone** → `τ = t_exit − t_enter`, filtered for track fragmentation (< 3 s fragments dropped) | Per-zone dwell seconds |
| Heatmap | Accumulate Gaussian kernels at track centroids per zone (Supervision `HeatmapAnnotator`) | Live + hourly PNG heatmap |

Heatmap accumulation per frame:

<div class="formula">
H(x, y) = Σ<sub>i ∈ active tracks</sub> exp( −‖p<sub>i</sub> − (x, y)‖² / 2σ² )
</div>

**Design note:** one wide-angle aisle camera covers 2–3 zones via polygon definitions — keeps camera count (and store cost) low.

### 5.2 Module M2 — Inventory Monitoring (shelf cameras)

**MVP strategy (zero training):** shelf-gap heuristic. Products are a huge, store-specific label space — per-SKU recognition needs ~50–100 images/SKU, which is why the MVP uses:

| Stage | Method | Notes |
|---|---|---|
| Planogram definition | Slots as bboxes in `store_config.yaml` (drawn once per shelf from a reference frame) | Versioned per store |
| Facing occupancy | Per slot: edge density + background-color ratio (classic OpenCV) | Works for SKUs never trained on |
| Debounce | Alert only after **N consecutive frames** below threshold (N = 30) | Prevents shopper-occlusion false positives |
| Output | `LOW_STOCK` / `OUT_OF_STOCK` alert + **blurred** snapshot + aisle location → alert feed → staff task | Creates measurable replenishment SLA loop |

<div class="formula">
occupancy<sub>slot</sub> = ( Σ detection areas in slot ) / ( slot area ) &nbsp;→&nbsp; alert if &lt; θ<sub>min</sub> for N consecutive frames
</div>

**Production upgrade (post-SIH):** 2-stage model — generic product detector (category-level, trains once) + per-store lightweight classifier (CLIP-style head). Scales across stores without per-SKU retraining.

**Known hard problem:** shopper blocking shelf → false OOS; lighting shifts; reflective packaging; planogram drift. Mitigations: aggressive debounce, per-clip threshold calibration, controlled shelf-camera angles, isolatable module (its failure never degrades M1/M3).

### 5.3 Module M3 — Queue Intelligence (checkout cameras)

**Measurement:**
1. Count heads per checkout queue polygon each frame; EMA-smooth: `Q̂t = α·Qt + (1−α)·Q̂t−1`, α ≈ 0.3
2. Track queue-entry → billing-start → empirical service-time distribution; queue-entry → counter → wait time

**Prediction (fully offline math):** M/M/c queueing model with live arrival rate λ and measured service rate μ per counter:

<div class="formula">
ρ = λ / (c·μ) &nbsp;&nbsp;&nbsp;·&nbsp;&nbsp;&nbsp; W<sub>q</sub> ≈ λ/(c·μ)² · 1/(1 − ρ) &nbsp;&nbsp;&nbsp;(valid for ρ &lt; 1; wait predicted at 10-min horizon)
</div>

**Decision rule:** predicted 10-min wait > threshold (default 5 min) → **"Open counter +1"** recommendation on dashboard.

**Why M/M/c, not ML:** it needs no training data, runs in microseconds, and is transparent to judges/operators ("λ from today's footfall, μ from measured service times"). A gradient-boosted λ forecaster is the optional upgrade (§17) — still CPU-only at the edge.

**Engineering caution (known failure mode):** the hard part is feeding M/M/c clean λ and μ from noisy vision data. Mitigations: EMA smoothing, minimum-queue-standstill detection, and per-store μ calibration from measured events.

### 5.4 Module M4 — Store Operations Dashboard

Streamlit app served from the edge box over LAN:

- **KPI cards:** live footfall, occupancy, OOS alerts, avg queue length, predicted wait, staff efficiency
- **Alert feed:** stock shortages + queue build-up, newest first, with blurred snapshots
- **Tabs:** Heatmap view · Shelf view (overlay + slot status) · Queue strip
- **Reports:** daily/weekly analytics summary (Should-have; simple HTML→PDF)
- **Privacy controls (always visible):** "Processing on-device — no video stored" badge, kill-switch toggle, current retention clock status

---

## 6. Edge AI Stack & Hardware Plan

### 6.1 Software stack (identical code on laptop and edge box)

| Layer | Choice | Notes |
|---|---|---|
| Detection | Ultralytics **YOLO11n** → TensorRT INT8 engine (Jetson) / ONNX (others) | COCO-pretrained, `person` class; **no training needed** |
| Tracking / zones / heatmap | **Supervision** (ByteTrack, LineZone, PolygonZone, HeatmapAnnotator) | Same library everywhere — the port is painless |
| Queue math | M/M/c predictor (pure Python) | Deterministic, testable |
| Shelf OOS | Heuristic per planogram slot | Zero training data |
| Cameras | OpenCV `VideoCapture` (USB or RTSP) | One code path for webcam/phone/IP cam |
| Storage | SQLite | On the edge box |
| Dashboard | Streamlit | Served over LAN |
| Runtime (Jetson) | JetPack + TensorRT | DeepStream explicitly **skipped** — added complexity, zero demo value |

**The 10-line port trick:** `YOLO("yolo11n.pt")` (laptop/PyTorch) → `YOLO("yolo11n.engine")` (Jetson/TensorRT INT8). Everything else is unchanged, so development proceeds on a laptop while hardware is sourced — and the laptop is a permanent fallback demo device.

### 6.2 Hardware tiers (per store; detailed BOM in Appendix B)

| Tier | Hardware | AI capacity | Cameras | Cost | Best for |
|---|---|---|---|---|---|
| Entry | RPi 5 (8GB) + Hailo-8L (26 TOPS) + 64GB SSD | 2–4 streams @ 10–15 FPS | 2–3 | ₹18k–25k + cams | Kirana, small pharmacy |
| **Sponsor-aligned** | **Qualcomm QCS6490 Edge AI Box** (12 dense TOPS NPU, 30–50 AI threads) | 5 concurrent cameras, 4K60 decode | 5 | ₹30k–45k + cams | Supermarket — **maps onto Qualcomm's own Insight Platform roadmap** |
| Mid (demo tier) | **Jetson Orin Nano 8GB** + NVMe | 6–8 streams, YOLO11n > 30 FPS/stream (TensorRT) | 4–6 | ₹30k–45k + cams | Supermarket; **the SIH demo device** |
| Large | Jetson Orin NX or 2× Orin Nano | 8–12 streams | 8–12 | ₹60k+ + cams | Large-format |

**Sponsor-alignment rationale:** this is a Qualcomm problem statement. The QCS6490 tier is the deployment reference, cited alongside Qualcomm's Insight Platform (Dec 2025, edge-first VSaaS with exactly these retail analytics). The Jetson is the *demonstration* device; the Qualcomm tier is the *deployment* story — and ONNX export keeps the stack portable across both.

### 6.3 Performance budget (Jetson Orin Nano, TensorRT INT8)

| Stage | Budget |
|---|---|
| Decode (4 streams, 720p15) | ~1 ms/stream (NVDEC) |
| YOLO11n inference | ~8–15 ms/batch |
| ByteTrack + zone logic | < 5 ms/frame |
| Event emit + DB write | < 1 ms |
| **End-to-end latency target** | **< 100 ms; alerts < 2 s (includes debounce windows)** |

---

## 7. Privacy & DPDP Compliance by Design

### 7.1 Regulatory context

The **DPDP Act 2023 + DPDP Rules (finalized Nov 13, 2025)** explicitly cover AI-enabled CCTV. Full compliance is due **May 13, 2027**; penalties reach **₹250 Cr** for security-safeguard failures. Video of identifiable shoppers is personal data; there is no broad legitimate-interest escape hatch — consent + limited legitimate uses only.

### 7.2 Compliance by architecture (not policy)

| Threat / obligation | Design answer |
|---|---|
| Identifiable video captured | No face recognition anywhere in the pipeline; person = anonymous track ID (`track_42`), never a person |
| Video retention | Frames processed **in memory only** — no video write path exists in the pipeline code (enforced by design, verified in tests) |
| Data minimization | Events contain counts/durations/zones only — no imagery, no coordinates linked to identity, no biometric templates |
| Snapshots for alerts | Blurred at generation time (face/regions masked) |
| Breach exposure | Nothing sensitive stored → nothing sensitive to breach; sync payload is JSON metadata only |
| Consent / notice | Store signage template + one-page privacy notice provided with the product kit |
| Retention clocks | Aggregates auto-pruned after configurable window (default 90 days) |
| Kill-switch | One toggle in the dashboard (and config flag): halts all cameras + wipes in-flight buffers — demonstrate it live |

### 7.3 The privacy pitch beat

> *"Pull the network cable and the system keeps working. Open the database and every row is `{'event':'queue_alert','est_wait_min':6.2}` — no faces, no video, no PII. This is DPDP-compliant by construction, and it's the lowest-risk architecture available under the ₹250-Cr penalty regime."*

Less data leaving the store = less DPDP exposure — privacy hardens the offline-first moat instead of competing with it.

---

## 8. Data Architecture

### 8.1 Event schema (v1 — the contract between pipeline, DB, and dashboard)

```json
{
  "event_id": "evt_20260910_141233_00042",
  "store_id": "IN-BLR-014",
  "ts": "2026-09-10T14:12:33.512+05:30",
  "type": "entry_exit | dwell | low_stock | out_of_stock | queue_sample | queue_alert",
  "camera_id": "entrance_1",
  "payload": {
    "zone_id": "promo_endcap_A",
    "count": 3,
    "dwell_sec": 47.2,
    "slot_id": "shelf_a3#12",
    "occupancy": 0.11,
    "est_wait_min": 6.2,
    "recommendation": "open_counter_plus_1"
  },
  "privacy": { "video_retained": false, "pii": false }
}
```

### 8.2 Local storage model (SQLite, on the edge box)

| Table | Grain | Purpose | Retention |
|---|---|---|---|
| `events` | One row per emitted event | Audit trail, replay, debugging | 30 days |
| `footfall` | (store, zone, hour) | Entry/exit & occupancy aggregates | 90 days |
| `dwell_stats` | (zone, hour) | Mean/median dwell per zone | 90 days |
| `shelf_status` | (slot, ts) | Occupancy samples + alert timestamps | 90 days |
| `queue_stats` | (counter, minute) | Length, wait, service-time samples | 90 days |
| `alerts` | One row per alert | Alert feed + SLA (ack → resolved) | 90 days |
| `snapshots` | Blurred PNG paths | Alert evidence only — never raw video | 7 days |

### 8.3 Sync model (optional, store-and-forward)

- Queue: local outbox table → `mqtt/tls` publisher; exponential backoff; **causal ordering per store**
- Idempotency: `event_id` is the dedup key at the cloud sink
- Outage behavior: outbox grows on local disk (≈ 5 MB/day), sync resumes from cursor — **the store never waits for the cloud**
- Payload: JSON events only (§7); video never synced by design

---

## 9. APIs & Interfaces

### 9.1 Internal (process-internal interfaces, MVP)

| Interface | Type | Contract |
|---|---|---|
| Pipeline → DB | Function call / queue | Event JSON v1 (§8.1) |
| DB → Dashboard | Streamlit read queries | Tables §8.2 |
| Pipeline ↔ `store_config.yaml` | File (versioned per store) | Schema below |

```yaml
# store_config.yaml — the contract between modules; calibration-not-retraining lives here
store_id: "IN-BLR-014"
cameras:
  - { id: entrance_1, rtsp: "rtsp://192.168.1.10/ch1", role: entrance }
  - { id: shelf_a3,   rtsp: "rtsp://192.168.1.14/ch1", role: shelf }
  - { id: checkout,   rtsp: "rtsp://192.168.1.17/ch1", role: queue }
lines:
  - { id: entry_line, a: [100, 400], b: [900, 400], in_direction: down }
zones:
  - id: promo_endcap_A
    polygon: [[210, 300], [520, 300], [520, 640], [210, 640]]
    dwell_alert_sec: 45
planogram:
  shelf_a3:
    slots:
      - { sku: "SKU-88213", bbox: [40, 120, 180, 260] }
      - { sku: "SKU-90441", bbox: [190, 120, 330, 260] }
thresholds:
  out_of_stock_frames: 30
  queue_wait_min: 5.0
  occupancy_warn: 80
```

### 9.2 External (Phase 3+ — post-MVP roadmap)

| API | Consumer | Notes |
|---|---|---|
| REST `/events`, `/kpis`, `/alerts` | Chain BI cloud, future integrations | Read-only, local network or sync channel |
| Webhook `/alerts` | Staff mobile app / WhatsApp bot (roadmap) | Debounced |
| Connector adapters (Tally, Zoho, SAP) | POS/ERP | Roadmap slide — not MVP |

---

## 10. Deployment Architecture

### 10.1 SIH MVP deployment (the demo)

```
Laptop (dev, days 1–8) ──same code──► Jetson Orin Nano (days 9–12)
      │                                     │
      └── permanent fallback demo ◄─────────┘
              (swap yolo11n.pt ↔ yolo11n.engine; everything else identical)

USB webcam(s) → Jetson → pipeline (detect/track/reason/emit) → SQLite → Streamlit (LAN)
Judges' phones/browsers on store LAN → dashboard — no internet anywhere in the loop
```

### 10.2 Pilot deployment (3–5 stores)

- Pre-imaged SD/NVMe flash with systemd services (`ingest.service`, `pipeline.service`, `dashboard.service`) + watchdog auto-restart
- Camera placement per site survey (lighting day/night, mounting, FOV sketches)
- On-site calibration: draw lines/zones/planogram once → `store_config.yaml`
- Shadow mode first (all alerts logged, none pushed) → measured accuracy → live alerts
- Dashboard on store LAN; sync agent optional and off by default

### 10.3 Fleet deployment (Phase 4+)

- Per-store edge box identical; central cloud is **optional BI**, never a runtime dependency
- Model updates: signed model bundles via OTA when online, USB sideload when not

---

## 11. Reliability, Observability & Failure Modes

### 11.1 Failure-mode matrix

| Failure | Detection | Automated response | Degraded behavior |
|---|---|---|---|
| Camera stream drops | Frame-gap watchdog per camera | RTSP reconnect w/ backoff | Other cameras unaffected; dashboard shows camera-down chip |
| Model inference stall | Heartbeat between frames | Process restart (systemd), engine reload | Brief gap; counters resume from tracks |
| Disk full | Inode/space monitor | Rotate/prune per §8.2 retention | Events prioritized over snapshots |
| Edge box crash/power cut | systemd, watchdog timer | Auto-restart all services | Store reopens dashboard in < 60 s; no data beyond crash lost (WAL mode) |
| Internet outage | Sync agent fails | Buffer in outbox | **Zero functional impact — the core promise** |
| Thermal throttle (Jetson) | `nvpmodel`/temp telemetry | Drop to 15 W mode; process every 2nd frame | FPS halves, still demoable |
| Zone mis-calibration (drift) | Accuracy monitor vs shadow audit | Flag for recalibration | Conservative thresholds until recalibrated |

### 11.2 Observability (local-first)

- Per-stream FPS/latency counters exported to local Prometheus + Grafana (Phase 3+; MVP: dashboard status chips)
- Daily self-test: fake frame through full pipeline → expected event → alert on silence
- Chaos testing (Phase 3 gate): kill camera / fill disk / kill process / pull network → all recover < 5 min

---

## 12. Phased Execution Plan

### 12.1 Full program (5 phases, 30+ weeks)

| Phase | Weeks | Name | Goal | Hard Exit Gate (evidence, not opinion) |
|---|---|---|---|---|
| **P0** | 1–4 | Discovery & Foundation | Requirements frozen, pilot site secured, baseline model proven on real footage | Baseline person-detector mAP@50 ≥ 0.85 on real store footage; `PRD.md`, `PRIVACY.md`, site survey, dataset v0 |
| **P1** | 5–12 | Bench MVP | All 3 modules end-to-end on edge hardware in lab, dashboard v1 | 3 streams × 15 FPS sustained 24 h; entry/exit MAE ≤ 5%; Internal Demo Day |
| **P2** | 13–22 | Pilot Deployment | 3–5 live stores, shadow → live alerts, staff trained | Count MAE ≤ 2%; OOS P/R ≥ 0.90/0.85; uptime ≥ 98%; weekly shadow audits |
| **P3** | 23–30 | Hardening & Release 1.0 | Fault-proof, secure, fleet-managed, technician-installable | 72 h soak clean; all chaos faults recover < 5 min; OTA 100% |
| **P4** | 31+ | Scale & Commercialize | 10–20 stores, partner channel, chain BI | Unit economics proven; NPS ≥ 40 from store managers |

### 12.2 SIH MVP timeline (~2 weeks — the buildable subset)

| Days | Milestone | Exit check |
|---|---|---|
| 0 | Jetson borrow/PO in motion; repo + venv + `ultralytics/supervision/opencv/streamlit`; hello-world person count on laptop webcam | Stack proven in one command |
| 1–2 | People counting + entry/exit LineZone (laptop webcam) | Counts a walker within ±1 |
| 3–4 | Dwell + heatmap on entrance clip | Heatmap matches lingering spots |
| 5–7 | Queue predictor (M/M/c) + shelf OOS heuristic on clips | Alerts fire on scripted footage |
| 8 | Streamlit dashboard + privacy controls (badge, kill-switch) | All 3 modules in one UI |
| 9–10 | Jetson bring-up: JetPack, `yolo export format=engine`, camera sanity | Engine loads, ≥ 30 FPS, outputs match laptop |
| 11–12 | Full demo **on the Jetson**; record real-store clips | 5-min run-through on the edge box, no laptop |
| 13+ | Rehearse narrative (offline cable-pull, kill-switch, metadata JSON) + laptop fallback test | Demo works on EITHER device |

### 12.3 Demo narrative (10 minutes, moat-proofs built in)

1. (1 min) Problem with sourced numbers: ~8% stockout rate, ~4% of revenue lost, ₹ hardware tiers
2. (4 min) Live modules on the Jetson: counting reacting to people, shelf alert on scripted clip, queue "open counter +1"
3. (4 min) **Moat proofs:** pull the network cable → keeps working; open the DB → metadata-only JSON; kill-switch → cameras halt; ROI slide → every alert maps to a ₹ number
4. (1 min) Close: "Runs on QCS6490-class boxes today; designed alongside Qualcomm's own Insight Platform direction."

**Contingencies (rehearsed, not improvised):** Jetson absent → laptop runs identical code; no store clips → teammates act as shoppers on webcam; thermal throttle → 15 W mode or every-2nd-frame.

---

## 13. Team, Cadence & Governance

### 13.1 Core team (7–9)

| Role | Count | Responsibility | Phases |
|---|---|---|---|
| Product / Field Lead | 1 | Requirements, store partnerships, pilot ops, ROI story | All |
| CV/ML Lead | 1 | Model architecture, training strategy, accuracy sign-off | All |
| ML Engineer | 1 | Training, annotation ops, quantization, model registry | P0–P3 |
| Edge Engineer | 1 | Pipelines, Jetson/Hailo deployment, watchdogs | P1–P3 |
| Backend Engineer | 1 | Event bus, DB, APIs, sync agent, integrations | P1–P4 |
| Frontend Engineer | 1 | Dashboard, staff app, planogram tool | P1–P4 |
| QA / Field Ops | 1 | Test protocols, ground-truth audits, chaos testing, installs | P2–P4 |
| Data Annotators | 2 PT | Bounding boxes, SKU labels, audits | P0–P2 |

### 13.2 Cadence

- **Daily:** 15-min standup per workstream
- **Weekly:** cross-team demo (working software only) + metrics review
- **Phase gates:** formal review at close; exit criteria checked against evidence (test logs, audit reports). *A phase closes on data, not opinion.*
- **Tooling:** GitHub + Actions CI; W&B/MLflow registry; CVAT/Label Studio; Docker Compose; Prometheus + Grafana (local)

---

## 14. Business Case & Commercial Model

### 14.1 The problem economics (sourced — Appendix C)

| Problem | Benchmark | Source basis |
|---|---|---|
| Stockouts | ~8% average rate; ~4.1% of revenue lost; ~$1.2T/yr global lost sales | NetSuite, Retail Wire, Mirakl (2025–26) |
| Shrinkage | ~1.4–1.6% of sales; ~$132B global (2024) | NRF benchmark, Building Security |
| Queue wait | Direct conversion impact; vendor CV claims: 45% shorter waits (treat as marketing) | Category claims |
| India TAM | Retail ~$1.09T (2025) → $2.36T (2030); 12–15M kiranas; organized only ~18–20% | IBEF, Cornell, Invest India |
| Market size | In-store analytics $5.3B (2025) → ~$16B (2031); CV-in-retail → $12.6B (2033) | Mordor, Grand View (estimates — quote ranges) |

**→ The plan's targets (OOS ↓ ≥ 30%, wait ↓ ≥ 25%) are conservative against these benchmarks — credible to judges and store owners.**

### 14.2 Pricing & unit economics (directional)

| Tier | Hardware | SaaS (per store/mo) | Target segment |
|---|---|---|---|
| Kirana (1–2 cams) | ₹18–25k | ₹999 | Light module set: footfall + queue |
| Supermarket (4–6 cams) | ₹30–45k | ₹2,499 | Full 3 modules + reports |
| Chain (8+ cams / multi-store) | ₹60k+ | ₹5,999+ | Fleet BI, SLA dashboards, integrations |

Rough ROI story per supermarket: 4.1% revenue exposure to OOS → 30% reduction = **~1.2% of revenue recovered** against a ₹2,499/mo software cost — the hardware pays back in months, not years. (Present as a worked example with pilot data, not a promise.)

### 14.3 Go-to-market sequence

1. **Modern trade / small supermarkets first** (budget fits, workflows match, staff present) — 3–5 pilot stores
2. Pharmacy chains next (planogram-heavy, high SKU churn)
3. Kirana last (price-sensitive; share-hardware or subsidized model; footfall+queue light SKU)

---

## 15. Risks & Mitigations

| # | Risk | L×I | Mitigation | Owner |
|---|---|---|---|---|
| R1 | **Edge accuracy under Indian retail conditions** (low light, crowds, occlusion, mannequins) — the #1 technical risk | H×H | IR-capable cameras in placement; hard-example mining; per-store threshold tuning; honest targets + shadow-mode validation before live alerts | CV Lead |
| R2 | **Shelf OOS false positives** (shoppers blocking shelf, reflections, planogram drift) | H×M | 30-frame debounce; per-slot calibration; isolated module; controlled shelf angles; demo on scripted clip | Edge Eng |
| R3 | Jetson doesn't arrive / env setup friction on borrowed hardware | M×H | Laptop fallback is built into the plan (identical code); order/borrow early (Day 0 action) | Product |
| R4 | No real store footage | M×H | Permission letter for a local store in Week 0; teammates-as-shoppers fallback; public retail datasets | Field Lead |
| R5 | M/M/c polluted by noisy λ/μ from vision | M×M | EMA smoothing; standstill detection; μ calibration from measured events; conservative recommendation thresholds | ML Eng |
| R6 | Judge tests the offline claim and something silently phones home | L×H | Zero network calls by construction; demo checklist grep of egress; rehearsed cable-pull beat | Edge Eng |
| R7 | DPDP regime evolves before 2027 enforcement | L×M | Architecture is already minimal-exposure; monitor consent-manager framework (Nov 2026); legal review pre-pilot | Product |
| R8 | Well-funded competitors (Trax $1.07B) enter India offline-first niche | M×M | Speed-to-pilot, store-owner references, price moat (§16) | Product |
| R9 | Analyst market numbers vary widely → credibility hit if quoted as fact | L×L | Quote ranges + sources; use per-retailer percentages for defensibility | Product |
| R10 | Kirana price sensitivity limits TAM | H×L | Modern-trade-first GTM (§14.3); light kirana SKU | Product |

---

## 16. Competitive Positioning & Moat

### 16.1 Landscape

| Company | Focus | Funding/traction | Gap vs us |
|---|---|---|---|
| Trax | Shelf/planogram recognition | ~$1.07B raised | Cloud-centric, enterprise-priced, Western |
| Focal Systems | Edge shelf cameras | ~$28–42M | Edge but US-market, shelf-only |
| AiFi / Trigo / Zippin | Autonomous checkout | $65M+ (AiFi) | Adjacent market |
| Nodeflux | On-prem people counting | Indonesia | SE-Asia, security-centric |
| Wesense.ai | CCTV analytics | India | Cloud-assisted; no offline-first proof |

**The gap nobody occupies:** offline edge inference + DPDP-native privacy + Indian price point + all three modules in one box.

### 16.2 The moat stack (in hackathon terms: what we can *prove* in 10 minutes)

| # | Moat | Proof in the demo |
|---|---|---|
| 🥇 | Offline-first, proven live | Pull the network cable; system keeps counting |
| 🥈 | Privacy by architecture | Kill-switch click; no-video-written badge; show the metadata JSON |
| 🥉 | Business-insight closure | ROI slide: every alert maps to a ₹ number; OOS ↓ 30% / wait ↓ 25% targets |
| 4 | India-depth | Works with existing CCTV; no POS prerequisite (the camera **is** the inventory system); Tier-2/3 pricing |
| 5 | Qualcomm alignment | QCS6490 reference tier; ONNX portability; Insight Platform narrative |

### 16.3 What we deliberately do NOT compete on

- **Model accuracy races** — everyone has YOLO; it's a race to the middle
- **"We trained our own model"** — zero-training day-one deployment is the better story; fine-tuning is an option, not an identity

---

## 17. Roadmap & Future Enhancements

| Horizon | Item | Notes |
|---|---|---|
| Post-MVP | 2-stage product detector + per-store classifier | Replaces shelf heuristic; ~50–100 img/SKU via staff phone app |
| Post-MVP | Planogram compliance module | Misplaced-SKU flags from detected centroids vs grid |
| Post-MVP | Staff mobile app | Alert push + task completion → measurable replenishment SLA |
| Phase 3 | Fleet console + OTA | Signed model bundles; multi-store health |
| Phase 4 | Chain-level BI + POS connectors (Tally/Zoho/SAP) | Cross-store conversion, inventory reconciliation |
| Optional | Gradient-boosted λ forecaster | Rush-hour refinement of queue predictions; CPU-only at edge |
| Optional | Fine-tuned YOLO11n per archetype | Only if real footage shows pretrained misses; 1–2k frames, free Colab GPU, hours of work |

---

## Appendix A — Key Formulas

| Quantity | Formula | Notes |
|---|---|---|
| Heatmap accumulation | `H(x,y) = Σᵢ exp(−‖pᵢ − (x,y)‖² / 2σ²)` | Gaussian kernels at track centroids |
| Zone dwell | `τ = t_exit − t_enter` | Drop fragments < 3 s |
| Slot occupancy | `Σ detection areas in slot / slot area` | Alert if < θ_min for N frames |
| Queue smoothing | `Q̂t = α·Qt + (1−α)·Q̂t−1` | α ≈ 0.3 |
| M/M/c utilization | `ρ = λ / (c·μ)` | System unstable if ρ ≥ 1 |
| M/M/c expected wait | `Wq ≈ λ/(cμ)² · 1/(1−ρ)` | For ρ < 1; 10-min horizon |
| Recommendation rule | `Wq(t+10) > 5 min → open counter +1` | Threshold in `store_config.yaml` |
| Cloud-video bandwidth | `streams × Mbps × seconds ÷ 8` | 6×1.5×50400÷8 ≈ 57 GB/day — why edge wins |
| Edge event payload | < 5 MB/store/day | ≈ 0.009% of video payload |

## Appendix B — Hardware BOM (per store)

| Tier | Core | Add-ons | Cameras | Indicative cost |
|---|---|---|---|---|
| Entry (kirana/pharmacy) | RPi 5 8GB + Hailo-8L (26 TOPS) + 64GB SSD | PSU, case, mounts | 2–3 × 2MP PoE | ₹18k–25k + cams |
| Sponsor-aligned (supermarket) | **Qualcomm QCS6490** Edge AI Box (12 TOPS NPU; VVDN / Inventec / OnLogic builds) | NVMe | 5 × 2–4MP PoE | ₹30k–45k + cams |
| Mid / **SIH demo** | **Jetson Orin Nano 8GB** dev kit + NVMe | — | 4–6 (demo: USB webcam ×2) | ₹30k–45k + cams |
| Large | Jetson Orin NX or 2× Orin Nano | NVMe ×2 | 8–12 | ₹60k+ + cams |

Cameras spec: 2MP–4MP PoE, H.264/H.265 with sub-stream (720p/15fps) to analytics; full-res stream only to NVR if one exists — **never to our box's disk**.

## Appendix C — References (full list in research brief)

**Market:** Grand View Research (CV-in-retail 2025–33); Mordor Intelligence (In-Store Analytics, Aug 2026); DataIntelo; Fortune Business Insights; Research and Markets (2026). **India:** IBEF Retail; Cornell SC Johnson (May 2026, 13M kiranas); Invest India; ACR Journal (UPI adoption). **Problem economics:** Mirakl ($1.2T OOS); OpenSend; NetSuite (stockouts); vndly (4.1% revenue); NRF 2025; Building Security ($132B shrink); invue (1.4–1.6%). **Competition:** Trax ($640M Series E, traxretail.com); Bouncewatch (Focal vs Trax); TechCrunch (AiFi); StartUs (incl. Wesense.ai); nodeflux.ai. **Hardware/Qualcomm:** qualcomm.com/edge-ai-box; Qualcomm Insight Platform (Dec 2025 announcement + Retail PDF); Silex (QCS6490); Qualcomm IoT/Dragonwing; Hailo community + Ultralytics forum benchmarks (RPi5+Hailo, Jetson). **Privacy:** DPDP Act 2023; DPDP Rules (Nov 13, 2025) via Fisher Phillips (Feb 2026) and Linklaters; AI-enabled CCTV coverage confirmation (2025). Complete URLs: `retail-intelligence-market-research.md` §6.

---

*End of System Design Plan v1.0 — RetailEdge AI (SIH 26179). Build artifacts referenced: solution blueprint, phased implementation plan, MVP/POC plan (Jetson), market research brief.*
