# Retail Intelligence AI/ML POC

## What the POC Does
This POC implements the computer-vision processing layer for store intelligence:
- Video decoding (MP4)
- Pretrained person detection (YOLO11n)
- Anonymous multi-object tracking (ByteTrack)
- Retail analytics: store occupancy, entrance/exit line counting, and checkout queue detection
- Queue intelligence: video-time rate estimation, debounced state transitions, conditional 5-minute queue prediction, and explainable recommendations
- Shelf intelligence experiment: zero-shot vision-language shelf classification (SigLIP) and visual gap heuristic baseline
- Structured JSON event streams and annotated video output

## Prerequisites
- Linux / macOS / Windows
- Python 3.10+
- FFmpeg (for OpenCV video playback / write codecs)

## Installation
Create a virtual environment and install the required dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Pretrained Models and Caching
- **Person Detector**: Pretrained YOLO11n (`yolo11n.pt`) via Ultralytics. Downloaded automatically on first use and cached locally.
- **Shelf Classifier**: Pretrained SigLIP (`google/siglip-base-patch16-224`) via Hugging Face Transformers. Downloaded automatically to standard `~/.cache/huggingface/` on first use and reuses cache on subsequent runs.
- Model checkpoints, weights, and caches are excluded by `.gitignore` and are not committed to git.

## How to Run

### 1. Store Video & Queue Intelligence Pipeline
Run against any local MP4 video:

```bash
python main.py --input path/to/sample_video.mp4
```

Outputs written to `outputs/`:
- `processed_video.mp4`: Annotated video with bounding boxes, track IDs, entrance line, checkout ROI, and HUD overlay.
- `events.json`: Structured stream of events (`ENTRY`, `EXIT`, `OCCUPANCY_UPDATE`, `QUEUE_UPDATE`).
- `summary.json`: Cumulative metrics (total entries, exits, peak occupancy, max queue length, averages).

### 2. Shelf Intelligence Pipeline
Analyze a local shelf image using the localized row-relative retail shelf-gap detector:

```bash
python main.py --shelf path/to/shelf.jpg
```

Outputs written to `outputs/shelf_result.json`, visual annotation saved to `outputs/shelf_annotated.jpg`, and summary printed to terminal.

Example JSON output:
```json
{
  "event_type": "SHELF_ANALYSIS",
  "state": "UNKNOWN",
  "temporal_state": "UNKNOWN",
  "alert": {
    "active": false,
    "severity": null,
    "message": null,
    "affected_rows": []
  },
  "overall": {
    "empty_space_ratio": 0.0147,
    "occupied_space_ratio": 0.9853,
    "void_count": 5,
    "total_shelf_area": 2355200,
    "total_void_area": 34638
  },
  "rows": [
    {
      "row_index": 1,
      "y_span": [0, 710],
      "row_area": 816500,
      "void_area": 8040,
      "empty_space_ratio": 0.0098,
      "occupied_space_ratio": 0.9902,
      "void_count": 1,
      "state": "UNKNOWN",
      "avg_confidence": 0.4942
    },
    {
      "row_index": 2,
      "y_span": [710, 1264],
      "row_area": 637100,
      "void_area": 26397,
      "empty_space_ratio": 0.0414,
      "occupied_space_ratio": 0.9586,
      "void_count": 4,
      "state": "UNKNOWN",
      "avg_confidence": 0.5538
    },
    {
      "row_index": 3,
      "y_span": [1264, 1605],
      "row_area": 392150,
      "void_area": 0,
      "empty_space_ratio": 0.0,
      "occupied_space_ratio": 1.0,
      "void_count": 0,
      "state": "NORMAL",
      "avg_confidence": 0.0
    },
    {
      "row_index": 4,
      "y_span": [1605, 2048],
      "row_area": 509450,
      "void_area": 0,
      "empty_space_ratio": 0.0,
      "occupied_space_ratio": 1.0,
      "void_count": 0,
      "state": "NORMAL",
      "avg_confidence": 0.0
    }
  ]
}
```

Conservative classification & alert policy:
- `NORMAL`: 0 void detections (shelf appears full without visible gaps).
- `EMPTY`: Empty space ratio >= 0.50 (shelf area is predominantly void).
- `SHELF_LOW_THRESHOLD = None`: By default, intermediate states remain `UNKNOWN`. If a retailer configures a numerical threshold, intermediate ratios transition to `LOW`.
- `Temporal Smoothing`: Uses a rolling window of recent observations (`SHELF_STATE_WINDOW = 5`) with strict majority voting to prevent single-frame flickers or false alerts.
- `Replenishment Alert`: Emitted only when the stabilized temporal state is `EMPTY` (severity `HIGH`) or `LOW` (severity `MEDIUM`). `UNKNOWN` never generates an alert. If a specific row is substantially depleted, the alert message pinpoints it (e.g. `"Row 2 requires attention."`).
- `Duplicate Alert Prevention`: Alerts are emitted only on transition into an alert state; subsequent frames maintain `active: true` without emitting duplicate events until the shelf recovers and re-triggers.

### 3. Verification & Benchmark Commands
- **Single Shelf Image**:
  ```bash
  python main.py --shelf path/to/shelf.jpg
  ```
- **Temporal & Alert Logic Validation (8 Synthetic Sequences)**:
  ```bash
  python main.py --shelf-test
  ```
- **Multi-Image Benchmark (24 Real Retail Images)**:
  ```bash
  python main.py --shelf-eval
  ```

## Shelf Intelligence: Row-Relative Void Detection vs Whole-Image Approaches

### 1. Why Full-Image Ratios Were Incorrect
In typical supermarket camera setups, raw camera frames contain non-shelf regions: floors, ceilings, walls, signage, shopping carts, and aisle traffic.
- Computing `empty_space_ratio = void_area / entire_image_area` artificially deflates the measured ratio and couples availability to camera mounting distance and viewing angle rather than shelf capacity.
- For example, on `ksaif_test_shelf.jpg`, void area was 34,638 pixels out of 2,355,200 total image pixels (ratio 0.0146). Whole-image vision-language classification (SigLIP) inverted this to `EMPTY` (0.5116) due to global attention pooling across empty upper aisle space.

### 2. Shelf ROI and Row Localization Approach
- **Fixed-Camera Support**: A manually configurable shelf bounding box `SHELF_ROI = [x1, y1, x2, y2]` in `config.py` restricts analysis exclusively to the shelf fixture.
- **Horizontal Row Estimation**: If `SHELF_ROWS` is configured in `config.py`, those explicit spans are used. Otherwise, within `SHELF_ROI`, horizontal shelf dividers are detected using Sobel-Y vertical gradient projection and Gaussian smoothing.
- **Void Assignment**: Each detected void box is assigned to a row based on its center point `(xc, yc)`. Voids outside `SHELF_ROI` are discarded.
- **Overlapping Box Mitigation**: 2D binary raster masks (`np.zeros(..., dtype=np.uint8)`) compute the exact union of void pixels per row and across the shelf ROI, preventing double-counting overlapping detections.
- **Clamping**: All per-row and overall empty space ratios are computed as `void_area / row_area` and clamped between `0.0` and `1.0`.

### 3. Pretrained Model Source, Cache Behavior & Licensing
- **Model Source**: `akul-29/Retail-Shelf-Gap-Detection_Model` via Hugging Face Hub (`best.pt`, 22.5 MB). Fine-tuned on the "Shelf Images for Planograms Dataset" (2,095 supermarket images) for detecting shelf voids (`{0: 'void'}`).
- **Model Cache Behavior**: Downloaded via `huggingface_hub.hf_hub_download` and cached locally in `~/.cache/huggingface/hub/models--akul-29--Retail-Shelf-Gap-Detection_Model/`. Future runs load directly from the local disk cache without network requests.
- **Licensing Note**: As documented on the source repository, the model author does not explicitly specify a license in the Hugging Face repository metadata or model card.

### 4. Quantitative Benchmark Summary (24 Real Retail Images)

| Metric | Localized Row-Relative Gap Detector (YOLOv8) | Whole-Image SigLIP Zero-Shot | OpenCV Edge Density Heuristic |
|---|---|---|---|
| **Underlying Approach** | Object detection bounding boxes for voids assigned to shelf rows | Global cross-attention image-text embedding | Pixel Canny edge count ratio |
| **Primary Output** | Row-level & overall `empty_space_ratio`, void counts | Normalized 3-prompt relative scores | Edge density score |
| **Mean Empty Ratio / Top Conf** | **0.0668** (mean visible empty ratio) | 0.5794 (mean top-1 score) | 0.0827 (mean edge density) |
| **State Distribution** | NORMAL: 1, LOW: 0, EMPTY: 0, UNKNOWN: 23 | NORMAL: 5, LOW: 15, EMPTY: 1, UNKNOWN: 3 | NORMAL: 10, LOW: 14, EMPTY: 0, UNKNOWN: 0 |
| **Obvious Empty Shelf** (`empty_shelve.jpg`) | 6 voids detected (void ratio: 0.0880) | **NORMAL (0.5272)** — False Normal | **NORMAL (0.1281)** — False Normal |
| **Stocked Shelf with Small Gaps** (`ksaif_test_shelf.jpg`) | **5 voids, Row 2: 4.1% empty, Row 1: 1.0% empty, Rows 3-4: 0% empty** | **EMPTY (0.5116)** — False Empty | NORMAL (0.1342) |
| **100% Full Shelf** (`planogram_15_51.jpg`) | **0 voids, 0.00% void ratio (NORMAL)** | **LOW (0.7408)** — False Low | NORMAL (0.0845) |

### 5. Current Limitations
- Automatic row detection relies on horizontal shelf dividers; oblique/angled views require configuring `SHELF_ROI` and `SHELF_ROWS` in `config.py`.
- Fixed-camera setup is assumed; moving/panning cameras require dynamic homography or SLAM.
- The void model detects unoccupied shelf spaces, but does not identify specific missing SKUs or product barcodes.
- Conservative state assignment flags partial voids as `UNKNOWN` rather than guessing arbitrary retailer replenishment rules.

