# RetailEdge AI — Intelligent Retail Analytic System
**SIH 2026 Problem Statement 26179**

An edge-to-dashboard intelligence platform for physical retail operations. The system processes existing in-store camera streams on-device to track footfall, project checkout queue bottlenecks, and detect shelf void depletion without transmitting or recording raw video.

---

## 1. Project Overview

The system operates across a clear 5-stage data flow:

```
[In-Store Camera Feed]
        │  (RTSP / MP4 / Video Stream)
        ▼
[Edge AI Engine (ai-ml/)]
        │  - YOLO11n person detection & ByteTrack tracking
        │  - Checkout ROI polygon testing & Little's Law queue projection
        │  - Row-relative retail shelf-gap void detection
        ▼
[Structured Telemetry Events]
        │  - person_entered / person_exited
        │  - queue_update (queue length, arrival & service rates)
        │  - shelf_empty / shelf_low / shelf_normal
        ▼
[Backend API (backend/)]
        │  - FastAPI event ingestion (POST /api/events)
        │  - Privacy validator (token-level rejection of facial/biometric data)
        │  - MongoDB state persistence & deterministic recommendation engine
        ▼
[Operations Dashboard (frontend/)]
           - Live occupancy, rush hours, queue projections, shelf status & staff directives
```

---

## 2. Requirements

- **Python**: Version 3.10, 3.11, or 3.12
- **Node.js**: Version 18.x or 20.x (with `npm` 9+)
- **Database**: MongoDB 6.0+ (running locally on `mongodb://localhost:27017`)
- **Key Dependencies**:
  - **Backend**: `fastapi`, `uvicorn`, `motor`, `pydantic`, `pydantic-settings`, `pymongo`
  - **Frontend**: `react`, `react-dom`, `recharts`, `lucide-react`, `tailwindcss`, `vite`
  - **AI / ML**: `torch`, `torchvision`, `ultralytics`, `opencv-python`, `transformers`, `huggingface-hub`, `numpy`

---

## 3. System Startup (Terminal by Terminal)

Open separate terminals for each subsystem:

### Terminal 1: MongoDB Service
Ensure MongoDB is running locally on port 27017:
```bash
# On Linux (systemd):
sudo systemctl start mongod

# Or via Docker:
docker run -d --name mongo-retail -p 27017:27017 mongo:latest
```

### Terminal 2: Backend API
```bash
cd backend

# Create and activate virtual environment (or use project root .venv)
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install dependencies and start server
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*API will be available at `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.*

### Terminal 3: Frontend Operations Dashboard
```bash
cd frontend

# Install packages and start Vite dev server
npm install
npm run dev
```
*Dashboard will be available at `http://localhost:5173` (proxies `/api` requests to backend at `http://127.0.0.1:8000`).*

### Terminal 4: Edge AI Pipeline Demo
```bash
cd ai-ml

# Activate virtual environment
source ../.venv/bin/activate   # or local .venv

# Optional: configure backend bridge URL to send live events to the dashboard
export BACKEND_EVENT_URL="http://127.0.0.1:8000/api/events"
export STORE_ID="BLR-014"
```

---

## 4. AI Verification & Demo Commands

Run these commands from the `ai-ml/` directory:

### 1. Synthetic Temporal Smoothing Validation
```bash
python main.py --shelf-test
```
*Demonstrates 8 unit test cases verifying state transition smoothing and duplicate alert suppression.*

### 2. Retail Shelf-Gap Void Analysis
```bash
python main.py --shelf outputs/shelf_annotated.jpg
```
*Demonstrates row-relative void detection, bounding boxes, empty-space ratio calculation, and automatic state evaluation.*

### 3. Shopper Tracking & Queue Intelligence
```bash
python main.py --input outputs/processed_video.mp4
```
*Demonstrates YOLO11n person detection, ByteTrack anonymous tracking, entrance line crossing footfall counters, checkout ROI queue estimation, and Little's Law queue prediction.*

### 4. CLI Argument Reference
```bash
python main.py --help
```

---

## 5. Model Weights & Artifact Management

- **YOLO11n Weights**: Downloaded automatically by Ultralytics into `ai-ml/yolo11n.pt` on first run (5.6 MB).
- **Shelf-Gap Model**: Pretrained void detector `akul-29/Retail-Shelf-Gap-Detection_Model` (`best.pt`) downloaded directly via Hugging Face Hub cache (`~/.cache/huggingface/hub/`).
- **SigLIP Classifier**: Downloaded via Hugging Face Transformers cache (`google/siglip-base-patch16-224`).
- **Repository Hygiene**: Model weights (`*.pt`, `*.bin`, `*.onnx`), video files (`*.mp4`), and `.env` credentials are strictly excluded via `.gitignore` and are not committed.

---

## 6. Privacy & Edge Principles

- **Local Video Processing**: Video frames are analyzed in volatile memory (`numpy.ndarray`) at the edge. No raw video is streamed to or stored in the cloud.
- **Anonymous Tracking**: ByteTrack assigns temporary integer IDs (`1, 2, ...`). No facial recognition, biometric embeddings, or person identities are created.
- **Strict Data Contracts**: The backend validates every event payload using token-level inspection and rejects any payload containing personal or biometric fields (`face`, `biometric`, `name`, etc.).
- **Minimal Cloud Surface**: Only anonymous structured telemetry (`person_entered`, `queue_length: 5`, `shelf_empty`) is transmitted upstream.
