# Intelligent Retail Analytic System (RetailEdge AI)

An end-to-end edge-to-cloud intelligence platform for physical retail stores. Existing CCTV cameras feed an edge computer vision pipeline that tracks customer flows, predicts checkout queue bottlenecks, and detects shelf stock depletion. Anonymous, structured events are ingested by a high-throughput backend and displayed on a modern neobrutalist store manager dashboard.

---

## Repository Structure

The project is structured into three clean, decoupled subsystems:

```
.
├── frontend/                     # Neobrutalist Store Operations Dashboard
│   ├── src/                      # React 18 + TypeScript + Vite 6 + Tailwind CSS
│   ├── package.json              # Web dependencies & scripts
│   ├── vite.config.ts            # Vite config with API proxy to backend
│   └── README.md                 # Frontend architecture and setup guide
│
├── backend/                      # Event Ingestion, REST & WebSocket Services
│   ├── app/                      # FastAPI application
│   │   ├── api/                  # REST routes and per-store WebSockets
│   │   ├── core/                 # Config, MongoDB (Motor) connection & seeding
│   │   ├── intelligence/         # Queue projection math & recommendation engine
│   │   ├── models/               # Pydantic schema contracts & privacy rules
│   │   └── services/             # Mongo queries, alert lifecycles & metric rollup
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Environment template
│   └── README.md                 # Backend setup, API endpoints & edge contracts
│
├── ai-ml/                        # Computer Vision & Edge Intelligence
│   ├── main.py                   # CLI entrypoint for video & shelf pipelines
│   ├── detection.py              # YOLO11n person & localized shelf-gap detectors
│   ├── tracking.py               # ByteTrack anonymous multi-object tracker
│   ├── analytics.py              # Flow counting, queue metrics, temporal smoothing
│   ├── config.py                 # Edge ROI definitions & pipeline thresholds
│   ├── requirements.txt          # PyTorch, Ultralytics, OpenCV dependencies
│   └── README.md                 # CV pipeline documentation & evaluation benchmarks
│
├── docs/                         # Architecture, System Design & Planning Specs
│   ├── system-design-plan.md     # Full architectural specification
│   ├── MVP-POC-Plan.md           # Milestone & execution roadmap
│   ├── RetailEdge-AI-System-Design-Plan.pdf
│   └── retail-intelligence-market-research.md
│
└── ai -> ai-ml                   # Backward-compatibility symlink
```

---

## Subsystem Overviews

### 1. Frontend (`frontend/`)
- **Technology**: React 18, TypeScript, Vite 6, Tailwind CSS 3, Lucide icons.
- **Aesthetic**: Neobrutalist design system with high-contrast borders, solid offset shadows, and semantic color signaling (Lime: normal, Coral: critical, Yellow: warning, Blue: info, Purple: AI/analytics).
- **Functionality**:
  - Live store overview with key performance indicators and active alerts.
  - Queue analytics with real-time rate monitoring and projection formulas.
  - Shelf inventory health and bay-level stock indicators.
  - Actionable recommendation cards with one-click staff dispatch.
  - Zero-latency same-origin development proxy to the FastAPI backend.

### 2. Backend (`backend/`)
- **Technology**: FastAPI (Python 3.10+), Uvicorn, MongoDB with Motor (async PyMongo).
- **Functionality**:
  - **Edge Ingestion**: `POST /api/events` ingests anonymous structured event detections with deduplication and privacy validation.
  - **Privacy Enforcement**: Model-level validation rejects any payloads containing biometric or PII attributes (face, identity, images).
  - **Intelligence Engine**: Deterministic queue forecasting ($Q(t + \Delta t) = \max(0, Q(t) + (\lambda - \mu) \cdot \Delta t)$) and automatic recommendation generation.
  - **WebSockets & Polling**: Dual delivery mode supporting WebSocket broadcasts (`/api/ws/{store_id}`) and 5s polling REST endpoints for network resilience.

### 3. AI / ML (`ai-ml/`)
- **Technology**: PyTorch, Ultralytics YOLO11n, ByteTrack, Hugging Face Transformers.
- **Functionality**:
  - **Person Tracking**: Anonymous track persistence across video frames without storing facial or biometric identifiers.
  - **Queue Intelligence**: Virtual checkout ROI occupancy, video-time arrival/departure rate estimation, and debounced state transitions.
  - **Row-Relative Shelf Intelligence**: Multi-row shelf ROI estimation, localized void bounding-box detection, row-relative empty space calculation, and temporal smoothing to prevent flicker alerts.

---

## Quick Start Guide

### Step 1: Start the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```
*API will be available at `http://127.0.0.1:8000` with Swagger docs at `http://127.0.0.1:8000/docs`.*

### Step 2: Start the Frontend

```bash
cd frontend
npm install
npm run dev
```
*Frontend will be available at `http://localhost:5173`.*

### Step 3: Run AI/ML Pipeline or Synthetic Tests

```bash
cd ai-ml
# Or use the backward-compatibility alias: cd ai
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run synthetic shelf smoothing and alert transition tests:
python main.py --shelf-test

# Run video analytics on a store camera feed:
python main.py --input path/to/store_feed.mp4

# Run localized shelf-gap detection on a shelf image:
python main.py --shelf path/to/shelf_image.jpg
```

---

## Data Flow Contract

```
[Store Cameras]
      │
      ▼
┌──────────────┐      Structured Events (POST /api/events)      ┌──────────────┐
│  ai-ml/      │ ─────────────────────────────────────────────► │  backend/    │
│  (Edge CV)   │   - person_entered / person_exited             │  (FastAPI +  │
│              │   - queue_update (length, arrival/departure)   │   MongoDB)   │
│              │   - shelf_empty / shelf_low / shelf_normal     └──────┬───────┘
└──────────────┘                                                       │
                                                                       │ REST / WS
                                                                       ▼
                                                                ┌──────────────┐
                                                                │  frontend/   │
                                                                │  (React UI)  │
                                                                └──────────────┘
```

---

## License & Compliance

- **Privacy First**: Raw video frames are processed at the edge in volatile memory and never transmitted or persisted. Tracks are assigned ephemeral IDs.
- **Hackathon Demo Ready**: Pre-seeded demo stores (`BLR-014`, `BLR-021`, `HYD-007`, `MUM-032`) and credentials (`manager@retail.ai` / `password123`).
