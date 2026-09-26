# RetailEdge AI — SIH MVP/POC Scope (Edge-AI on Jetson)

**Goal:** A working demo of all 3 analytics modules + dashboard, running **on a Jetson Orin Nano** in the SIH finale. Development happens on a laptop with identical code; the Jetson port is a TensorRT swap, not a rewrite. No cloud anywhere.

---

## 1. Hardware

| Item | Qty | Role |
|---|---|---|
| **Jetson Orin Nano 8GB** (borrowed) | 1 | The demo edge box. ~20–40 TOPS; with TensorRT runs YOLO11n at 30+ FPS and 4–6 camera streams |
| Laptop | 1 | Development machine + **fallback demo device** if the Jetson doesn't arrive |
| USB webcam / phone-as-webcam | 1–2 | Demo "cameras"; USB works on Jetson out of the box |
| PoE IP cameras (optional) | 2–3 | If the borrowed kit includes them; connect via RTSP — otherwise webcams are fine |
| Recorded store clips | 2–3 × 2–5 min | Entrance, shelf, checkout — record at a real store with permission |

**Dev strategy that de-risks the demo (critical):**
```
Days 1–8:  Build 100% on laptop  →  PyTorch YOLO + supervision (same Python code the Jetson runs)
Days 9–11: Port to Jetson       →  yolo export format=engine (TensorRT INT8) + swap the model load
Fallback:  If the Jetson never arrives, the identical pipeline demos on the laptop (say "runs on Jetson"; nothing changes in the demo script)
```
The port is ~10 lines of code: `model = YOLO("yolo11n.engine")` instead of `YOLO("yolo11n.pt")`. Everything else (tracking, zones, alerts, dashboard) is identical because supervision/OpenCV/Streamlit run the same on both.

---

## 2. Tech stack (free, same on laptop and Jetson)

| Layer | Choice | Notes |
|---|---|---|
| Detection | Ultralytics **YOLO11n** → TensorRT INT8 engine on Jetson | COCO-pretrained, person class; no training needed |
| Tracking/zones | **Supervision** (ByteTrack, LineZone, PolygonZone, heatmap) | Same library everywhere — no porting pain |
| Queue math | M/M/c predictor (pure Python) | From the blueprint |
| Shelf OOS | Heuristic gap detection (edge/color per planogram slot) | Zero training data, works on any shelf video |
| Storage | SQLite (events table) | Runs on the Jetson itself |
| Dashboard | **Streamlit** served from the Jetson over LAN | Judges view it on any phone/laptop browser |
| Cameras | OpenCV `VideoCapture` (USB or RTSP) | Same code path for webcam, phone cam, or IP cam |
| Accelerated runtime (Jetson only) | JetPack + TensorRT engine | Skip DeepStream — added complexity with zero demo value |

Do **not** add: DeepStream pipelines, MQTT, Docker, FastAPI, React, cloud anything. All slides, not build items.

---

## 3. Build plan (3 modules → 1 dashboard)

### A. Shopper Analytics (entrance camera)
- YOLO person detect → ByteTrack → **LineZone** entry/exit counting
- **PolygonZone** per area → dwell time
- Heatmap accumulator (Supervision `HeatmapAnnotator`)
- Output: live counts, occupancy, dwell seconds, heatmap

### B. Shelf OOS (shelf camera)
- Planogram slots as a simple JSON of bboxes on a saved shelf frame (hardcode for the demo)
- Per slot: "facing occupancy" via edge density / background-color ratio
- 30-frame debounce → `LOW_STOCK` / `OUT_OF_STOCK` alert with blurred snapshot
- Output: shelf overlay + alert feed

### C. Queue Intelligence (checkout camera)
- Head count inside checkout polygon, EMA smoothing
- M/M/c predictor → predicted wait at 10-min horizon → "Open counter +1" recommendation
- Output: queue strip, predicted wait, recommendation

### D. Dashboard (Streamlit, served from the edge box)
- KPI cards: footfall, occupancy, OOS alerts, avg queue, predicted wait
- Live alert feed (stock/queue)
- Heatmap / shelf / queue tabs
- **Privacy controls in the UI**: "processing on-device, no video stored" badge + kill-switch toggle

---

## 4. Edge-AI demo narrative (what judges hear)

1. "All inference runs on this $~15k–45k edge box inside the store — zero cloud dependency."
2. Live: show entry/exit counting reacting to people walking past the camera.
3. "Even with the network cable pulled, the system keeps working" — optionally do this in the demo if time allows (it genuinely keeps running; there is no network call).
4. "Only anonymized JSON events leave the box — DPDP-compliant by construction."
5. Close: "This exact stack scales from a kirana (1 cam) to a chain; the Qualcomm/QCS roadmap and Jetson are interchangeable tiers."

---

## 5. What to CUT (slide-only for SIH)

- ❌ DeepStream, TensorRT hand-optimization beyond `format=engine`
- ❌ OTA / fleet management / multi-store console
- ❌ POS, Tally, Zoho, SAP integration (roadmap slide)
- ❌ Mobile staff app (alerts in dashboard only)
- ❌ Cloud dashboard / anything that needs internet

---

## 6. Timeline (with Jetson arriving mid-way)

| Time | Milestone | Exit check |
|---|---|---|
| Days 1–2 | People counting + entry/exit on laptop webcam | Counts a person walking past within ±1 |
| Days 3–4 | Dwell + heatmap on entrance clip | Heatmap matches where people linger |
| Days 5–7 | Queue predictor + shelf OOS on clips | Alerts fire on scripted footage |
| Days 8 | Streamlit dashboard + privacy controls | All 3 modules in one UI |
| Days 9–10 | Jetson bring-up: JetPack, `yolo export format=engine`, camera sanity | Engine loads, 30+ FPS, same outputs as laptop |
| Days 11–12 | Full demo on the Jetson; record real-store clips | 5-min run-through on the edge box, no laptop |
| Days 13+ | Rehearse narrative + fallback test on laptop | Demo works on EITHER device |

---

## 7. Fallbacks

- **Jetson doesn't arrive:** laptop runs the identical pipeline (same code, PyTorch engine). Slide says "TensorRT on Jetson Orin Nano." Nothing in the demo script changes.
- **No real-store clips:** webcam at the desk; teammates act as shoppers/queue.
- **Jetson thermal-throttles:** set `nvpmodel` to 15W mode, or process every 2nd frame — still demoable.
- **No camera at all:** loop pre-recorded clips through the same `VideoCapture` path (identical code).

---

*Hardware tiers beyond the demo (RPi5+Hailo / Qualcomm QCS6490 / Jetson Orin NX) live in the pitch deck as the deployment roadmap — the Jetson is the reference mid-tier and the sponsor-aligned Qualcomm tier stays a slide.*