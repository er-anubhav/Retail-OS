# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import numpy as np

import config


def ccw(a, b, c):
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def intersect(p1, p2, p3, p4):
    d1 = ccw(p3, p4, p1)
    d2 = ccw(p3, p4, p2)
    d3 = ccw(p1, p2, p3)
    d4 = ccw(p1, p2, p4)
    return ((d1 > 0 and d2 < 0) or (d1 < 0 and d2 > 0)) and \
           ((d3 > 0 and d4 < 0) or (d3 < 0 and d4 > 0))


def create_analytics_engine(entrance_line, checkout_roi):
    return {
        "entrance_line": entrance_line,
        "checkout_roi": np.array(checkout_roi, dtype=np.int32),
        "track_history": {},
        "crossed_tracks": {},
        "entry_count": 0,
        "exit_count": 0,
        "last_occupancy": None,
        "last_queue_length": None,
        "peak_occupancy": 0,
        "max_queue_length": 0,
        "frame_count": 0,
        "occupancy_history": [],
        "queue_history": [],
        "track_queue_states": {},
        "arrival_times": [],
        "departure_times": [],
        "peak_predicted_queue": 0,
        "arrival_rate_history": [],
        "service_rate_history": []
    }


def compute_queue_intelligence(engine, current_queue_length, video_time_sec):
    window = config.QUEUE_RATE_WINDOW_SECONDS
    engine["arrival_times"] = [t for t in engine["arrival_times"] if video_time_sec - t <= window]
    engine["departure_times"] = [t for t in engine["departure_times"] if video_time_sec - t <= window]

    # Require minimum observation time before calculating rates
    if video_time_sec < config.QUEUE_MIN_OBSERVATION_SECONDS:
        return {
            "arrival_rate": None,
            "service_rate": None,
            "growth_rate": None,
            "predicted_queue_5m": None,
            "prediction_status": "INSUFFICIENT_DATA",
            "recommendation": "Insufficient data for prediction."
        }

    window_min = max(min(video_time_sec, window) / 60.0, 1e-4)
    arrival_rate = round(len(engine["arrival_times"]) / window_min, 2)

    # Require observed departures to compute reliable service rate
    if len(engine["departure_times"]) < config.QUEUE_MIN_DEPARTURES:
        return {
            "arrival_rate": arrival_rate,
            "service_rate": None,
            "growth_rate": None,
            "predicted_queue_5m": None,
            "prediction_status": "INSUFFICIENT_DATA",
            "recommendation": "Insufficient data for prediction."
        }

    service_rate = round(len(engine["departure_times"]) / window_min, 2)
    growth_rate = round(arrival_rate - service_rate, 2)
    predicted_queue_5m = max(0, int(round(current_queue_length + growth_rate * 5.0)))

    # Explainable recommendation logic based on verified data
    if predicted_queue_5m >= config.QUEUE_ALERT_THRESHOLD and growth_rate > 0:
        recommendation = "Consider opening another checkout counter."
    elif growth_rate > 0.5:
        recommendation = "Queue growing, monitor closely."
    elif growth_rate < 0 and current_queue_length > 0:
        recommendation = "Queue is clearing."
    elif predicted_queue_5m < current_queue_length:
        recommendation = "Queue is clearing."
    else:
        recommendation = "Queue is currently stable."

    return {
        "arrival_rate": arrival_rate,
        "service_rate": service_rate,
        "growth_rate": growth_rate,
        "predicted_queue_5m": predicted_queue_5m,
        "prediction_status": "VALID",
        "recommendation": recommendation
    }


def update_analytics(engine, tracks, timestamp_str, video_time_sec=0.0):
    events = []
    current_occupancy = len(tracks)
    p1, p2 = engine["entrance_line"]
    roi_poly = engine["checkout_roi"]

    active_ids = set()

    for item in tracks:
        track_id = item["track_id"]
        bbox = item["bbox"]
        active_ids.add(track_id)

        # Bottom-center coordinate represents person floor position
        cx = (bbox[0] + bbox[2]) / 2.0
        cy = bbox[3]
        curr_pos = (cx, cy)

        # Debounced checkout queue state tracking
        is_in_roi = cv2.pointPolygonTest(roi_poly, (cx, cy), False) >= 0
        t_state = engine["track_queue_states"].setdefault(
            track_id, {"state": "OUTSIDE", "inside_count": 0, "outside_count": 0}
        )

        if is_in_roi:
            t_state["inside_count"] += 1
            t_state["outside_count"] = 0
            if t_state["state"] == "OUTSIDE" and t_state["inside_count"] >= config.QUEUE_DEBOUNCE_FRAMES:
                t_state["state"] = "INSIDE"
                engine["arrival_times"].append(video_time_sec)
        else:
            t_state["outside_count"] += 1
            t_state["inside_count"] = 0
            if t_state["state"] == "INSIDE" and t_state["outside_count"] >= config.QUEUE_DEBOUNCE_FRAMES:
                t_state["state"] = "DEPARTED"
                engine["departure_times"].append(video_time_sec)

        # Check entrance line crossing
        prev_pos = engine["track_history"].get(track_id)
        if prev_pos is not None:
            if intersect(prev_pos, curr_pos, p1, p2):
                if track_id not in engine["crossed_tracks"]:
                    side = ccw(p1, p2, curr_pos)
                    if side > 0:
                        engine["entry_count"] += 1
                        engine["crossed_tracks"][track_id] = "ENTRY"
                        events.append({
                            "timestamp": timestamp_str,
                            "event_type": "ENTRY",
                            "occupancy": current_occupancy,
                            "queue_length": 0
                        })
                    else:
                        engine["exit_count"] += 1
                        engine["crossed_tracks"][track_id] = "EXIT"
                        events.append({
                            "timestamp": timestamp_str,
                            "event_type": "EXIT",
                            "occupancy": current_occupancy,
                            "queue_length": 0
                        })

        engine["track_history"][track_id] = curr_pos

    # Handle tracks disappearing from camera while inside queue
    stale_ids = [tid for tid in engine["track_queue_states"] if tid not in active_ids]
    for tid in stale_ids:
        if engine["track_queue_states"][tid]["state"] == "INSIDE":
            engine["track_queue_states"][tid]["state"] = "DEPARTED"
            engine["departure_times"].append(video_time_sec)
        del engine["track_queue_states"][tid]

    # Clean up stale track positions
    stale_pos = [tid for tid in engine["track_history"] if tid not in active_ids]
    for tid in stale_pos:
        del engine["track_history"][tid]

    # Active queue members are tracks confirmed inside
    current_queue_length = sum(
        1 for tid in active_ids
        if engine["track_queue_states"].get(tid, {}).get("state") == "INSIDE"
    )

    q_intel = compute_queue_intelligence(engine, current_queue_length, video_time_sec)

    # Check occupancy changes
    if engine["last_occupancy"] is not None and current_occupancy != engine["last_occupancy"]:
        events.append({
            "timestamp": timestamp_str,
            "event_type": "OCCUPANCY_UPDATE",
            "occupancy": current_occupancy,
            "queue_length": current_queue_length
        })

    # Check queue length changes
    if engine["last_queue_length"] is not None and current_queue_length != engine["last_queue_length"]:
        events.append({
            "timestamp": timestamp_str,
            "event_type": "QUEUE_UPDATE",
            "occupancy": current_occupancy,
            "queue_length": current_queue_length,
            "arrival_rate": q_intel["arrival_rate"],
            "service_rate": q_intel["service_rate"],
            "growth_rate": q_intel["growth_rate"],
            "predicted_queue_5m": q_intel["predicted_queue_5m"],
            "prediction_status": q_intel["prediction_status"],
            "recommendation": q_intel["recommendation"]
        })

    engine["last_occupancy"] = current_occupancy
    engine["last_queue_length"] = current_queue_length
    engine["peak_occupancy"] = max(engine["peak_occupancy"], current_occupancy)
    engine["max_queue_length"] = max(engine["max_queue_length"], current_queue_length)
    if q_intel["predicted_queue_5m"] is not None:
        engine["peak_predicted_queue"] = max(engine["peak_predicted_queue"], q_intel["predicted_queue_5m"])
    engine["frame_count"] += 1
    engine["occupancy_history"].append(current_occupancy)
    engine["queue_history"].append(current_queue_length)
    engine["arrival_rate_history"].append(q_intel["arrival_rate"])
    engine["service_rate_history"].append(q_intel["service_rate"])

    state = {
        "occupancy": current_occupancy,
        "queue_length": current_queue_length,
        "entry_count": engine["entry_count"],
        "exit_count": engine["exit_count"],
        "arrival_rate": q_intel["arrival_rate"],
        "service_rate": q_intel["service_rate"],
        "growth_rate": q_intel["growth_rate"],
        "predicted_queue_5m": q_intel["predicted_queue_5m"],
        "prediction_status": q_intel["prediction_status"],
        "recommendation": q_intel["recommendation"]
    }
    return events, state


def get_summary(engine):
    avg_occ = float(np.mean(engine["occupancy_history"])) if engine["occupancy_history"] else 0.0
    avg_queue = float(np.mean(engine["queue_history"])) if engine["queue_history"] else 0.0

    valid_arr = [r for r in engine["arrival_rate_history"] if r is not None]
    valid_serv = [r for r in engine["service_rate_history"] if r is not None]

    avg_arr = round(float(np.mean(valid_arr)), 2) if valid_arr else None
    avg_serv = round(float(np.mean(valid_serv)), 2) if valid_serv else None

    return {
        "total_frames": engine["frame_count"],
        "total_entries": engine["entry_count"],
        "total_exits": engine["exit_count"],
        "peak_occupancy": engine["peak_occupancy"],
        "max_queue_length": engine["max_queue_length"],
        "peak_predicted_queue_5m": engine["peak_predicted_queue"] if engine["peak_predicted_queue"] > 0 else None,
        "avg_occupancy": round(avg_occ, 2),
        "avg_queue_length": round(avg_queue, 2),
        "avg_arrival_rate": avg_arr,
        "avg_service_rate": avg_serv
    }


def estimate_shelf_gap_heuristic(image_path: str):
    img = cv2.imread(image_path)
    if img is None:
        return {"event_type": "SHELF_STATE", "state": "UNKNOWN", "confidence": 0.0, "edge_density": 0.0}

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = float(np.count_nonzero(edges) / edges.size)

    # Heuristic thresholds based on visual edge density
    if edge_density >= 0.08:
        state = "NORMAL"
        confidence = min(1.0, edge_density / 0.15)
    elif edge_density >= 0.025:
        state = "LOW"
        confidence = 0.70
    else:
        state = "EMPTY"
        confidence = max(0.5, 1.0 - (edge_density / 0.025))

    return {
        "event_type": "SHELF_STATE",
        "state": state,
        "confidence": round(float(confidence), 4),
        "edge_density": round(edge_density, 4)
    }


def locate_shelf_rows(img, roi=None, target_rows=4):
    if config.SHELF_ROWS is not None and len(config.SHELF_ROWS) > 0:
        return config.SHELF_ROWS

    h, w = img.shape[:2]
    if roi is None:
        roi = config.SHELF_ROI or [0, 0, w, h]
    rx1, ry1, rx2, ry2 = [int(v) for v in roi]

    roi_h = max(1, ry2 - ry1)
    crop = img[ry1:ry2, rx1:rx2]
    if crop.size == 0:
        return [[ry1, ry2]]

    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    profile = np.sum(np.abs(sobel_y), axis=1)

    k = max(31, int(roi_h * 0.08) | 1)
    smoothed = cv2.GaussianBlur(profile.reshape(-1, 1), (1, k), 0).flatten()

    min_dist = max(30, int(roi_h / (target_rows + 2)))
    peaks = []
    indices = np.argsort(smoothed)[::-1]
    for idx in indices:
        if smoothed[idx] > np.mean(smoothed):
            if idx >= min_dist and idx <= (roi_h - min_dist):
                if all(abs(idx - p) >= min_dist for p in peaks):
                    peaks.append(int(idx))
        if len(peaks) >= target_rows - 1:
            break

    peaks = sorted(peaks)
    dividers = [0] + peaks + [roi_h]
    rows = []
    for i in range(len(dividers) - 1):
        y1 = int(ry1 + dividers[i])
        y2 = int(ry1 + dividers[i + 1])
        if y2 > y1:
            rows.append([y1, y2])

    if not rows:
        rows = [[ry1, ry2]]
    return rows


def analyze_shelf_rows(img, boxes, confidences, roi=None, rows=None, tracker=None):
    h, w = img.shape[:2]
    if roi is None:
        roi = config.SHELF_ROI or [0, 0, w, h]
    rx1, ry1, rx2, ry2 = [int(v) for v in roi]
    rx1, rx2 = max(0, rx1), min(w, rx2)
    ry1, ry2 = max(0, ry1), min(h, ry2)

    total_shelf_area = max(1, (rx2 - rx1) * (ry2 - ry1))

    if rows is None:
        rows = locate_shelf_rows(img, [rx1, ry1, rx2, ry2])

    row_data = []
    shelf_mask = np.zeros((ry2 - ry1, rx2 - rx1), dtype=np.uint8)
    valid_boxes = []
    valid_confs = []

    for idx, (y1, y2) in enumerate(rows, start=1):
        y1_clamped = max(ry1, y1)
        y2_clamped = min(ry2, y2)
        row_h = max(1, y2_clamped - y1_clamped)
        row_w = max(1, rx2 - rx1)
        row_area = row_h * row_w
        row_mask = np.zeros((row_h, row_w), dtype=np.uint8)
        row_boxes = []
        row_confs = []

        for b, c in zip(boxes, confidences):
            bx1, by1, bx2, by2 = b
            xc = (bx1 + bx2) / 2.0
            yc = (by1 + by2) / 2.0

            if rx1 <= xc <= rx2 and y1_clamped <= yc < y2_clamped:
                row_boxes.append(b)
                row_confs.append(float(c))
                valid_boxes.append(b)
                valid_confs.append(float(c))

                cx1 = max(0, int(bx1 - rx1))
                cx2 = min(row_w, int(bx2 - rx1))
                cy1 = max(0, int(by1 - y1_clamped))
                cy2 = min(row_h, int(by2 - y1_clamped))
                if cx2 > cx1 and cy2 > cy1:
                    row_mask[cy1:cy2, cx1:cx2] = 1

                sy1 = max(0, int(by1 - ry1))
                sy2 = min(ry2 - ry1, int(by2 - ry1))
                if cx2 > cx1 and sy2 > sy1:
                    shelf_mask[sy1:sy2, cx1:cx2] = 1

        v_area = int(np.count_nonzero(row_mask))
        e_ratio = round(min(1.0, v_area / row_area), 4)
        o_ratio = round(max(0.0, 1.0 - e_ratio), 4)
        avg_conf = round(float(np.mean(row_confs)), 4) if row_confs else 0.0

        if len(row_boxes) == 0:
            row_state = "NORMAL"
        elif e_ratio >= config.SHELF_EMPTY_THRESHOLD:
            row_state = "EMPTY"
        elif config.SHELF_LOW_THRESHOLD is not None and e_ratio >= config.SHELF_LOW_THRESHOLD:
            row_state = "LOW"
        else:
            row_state = "UNKNOWN"

        row_data.append({
            "row_index": idx,
            "y_span": [y1_clamped, y2_clamped],
            "row_area": row_area,
            "void_area": v_area,
            "empty_space_ratio": e_ratio,
            "occupied_space_ratio": o_ratio,
            "void_count": len(row_boxes),
            "state": row_state,
            "avg_confidence": avg_conf
        })

    total_void_area = int(np.count_nonzero(shelf_mask))
    overall_empty = round(min(1.0, total_void_area / total_shelf_area), 4)
    overall_occupied = round(max(0.0, 1.0 - overall_empty), 4)
    total_void_count = len(valid_boxes)

    if total_void_count == 0:
        state = "NORMAL"
    elif overall_empty >= config.SHELF_EMPTY_THRESHOLD:
        state = "EMPTY"
    elif config.SHELF_LOW_THRESHOLD is not None and overall_empty >= config.SHELF_LOW_THRESHOLD:
        state = "LOW"
    else:
        state = "UNKNOWN"

    if tracker is None:
        tracker = create_shelf_tracker(window_size=config.SHELF_STATE_WINDOW)

    temporal_state, alert_status, alert_event = update_shelf_temporal(tracker, state, row_data)

    return {
        "event_type": "SHELF_ANALYSIS",
        "state": state,
        "temporal_state": temporal_state,
        "alert": alert_status,
        "alert_event": alert_event,
        "overall": {
            "empty_space_ratio": overall_empty,
            "occupied_space_ratio": overall_occupied,
            "void_count": total_void_count,
            "total_shelf_area": total_shelf_area,
            "total_void_area": total_void_area
        },
        "shelf_roi": [rx1, ry1, rx2, ry2],
        "rows": row_data
    }


def create_shelf_tracker(window_size=config.SHELF_STATE_WINDOW):
    return {
        "window_size": window_size,
        "history": [],
        "current_temporal_state": "UNKNOWN",
        "last_alert_state": None
    }


def update_shelf_temporal(tracker, instantaneous_state, rows=None):
    tracker["history"].append(instantaneous_state)
    if len(tracker["history"]) > tracker["window_size"]:
        tracker["history"].pop(0)

    n = len(tracker["history"])
    c_norm = tracker["history"].count("NORMAL")
    c_empty = tracker["history"].count("EMPTY")
    c_low = tracker["history"].count("LOW")

    # Majority voting across temporal window
    if c_norm > n / 2:
        temporal_state = "NORMAL"
    elif c_empty > n / 2:
        temporal_state = "EMPTY"
    elif config.SHELF_LOW_THRESHOLD is not None and c_low > n / 2:
        temporal_state = "LOW"
    else:
        temporal_state = "UNKNOWN"

    tracker["current_temporal_state"] = temporal_state

    # Alert condition evaluation
    is_alert_active = False
    severity = None
    base_msg = None
    affected_rows = []

    if temporal_state == "EMPTY":
        is_alert_active = True
        severity = "HIGH"
        base_msg = "Shelf requires replenishment."
    elif config.SHELF_LOW_THRESHOLD is not None and temporal_state == "LOW":
        is_alert_active = True
        severity = "MEDIUM"
        base_msg = "Shelf stock appears low."

    if is_alert_active and rows:
        prominent = [
            r["row_index"] for r in rows
            if r.get("void_count", 0) > 0 and r.get("empty_space_ratio", 0) >= 0.15
        ]
        if not prominent:
            max_row = max(rows, key=lambda r: r.get("empty_space_ratio", 0), default=None)
            if max_row and max_row.get("empty_space_ratio", 0) > 0 and max_row.get("void_count", 0) > 0:
                prominent = [max_row["row_index"]]
        affected_rows = prominent

    message = None
    if is_alert_active:
        if affected_rows:
            row_desc = f"Row {', '.join(str(r) for r in affected_rows)} requires attention."
            message = f"{base_msg} {row_desc}"
        else:
            message = base_msg

    # Duplicate alert prevention on state transitions
    alert_event = None
    if is_alert_active:
        if tracker["last_alert_state"] != temporal_state:
            tracker["last_alert_state"] = temporal_state
            alert_event = {
                "event_type": "SHELF_REPLENISHMENT_ALERT",
                "state": temporal_state,
                "severity": severity,
                "message": message,
                "affected_rows": affected_rows
            }
    else:
        tracker["last_alert_state"] = None

    alert_status = {
        "active": is_alert_active,
        "severity": severity,
        "message": message,
        "affected_rows": affected_rows
    }

    return temporal_state, alert_status, alert_event


def draw_shelf_visuals(img, roi, rows, boxes, confidences, overall, state, temporal_state=None, alert=None):
    annotated = img.copy()
    rx1, ry1, rx2, ry2 = [int(v) for v in roi]

    # Draw shelf ROI
    cv2.rectangle(annotated, (rx1, ry1), (rx2, ry2), (255, 200, 0), 2)
    cv2.putText(annotated, "Shelf ROI", (rx1 + 10, max(ry1 + 25, 25)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 200, 0), 2)

    # Draw horizontal rows
    for r in rows:
        y1, y2 = r["y_span"]
        idx = r["row_index"]
        r_state = r.get("state", "UNKNOWN")
        e_pct = r["empty_space_ratio"] * 100.0
        v_cnt = r["void_count"]

        cv2.line(annotated, (rx1, y1), (rx2, y1), (0, 255, 255), 1)
        cv2.line(annotated, (rx1, y2), (rx2, y2), (0, 255, 255), 1)
        row_txt = f"Row {idx} [{r_state}]: {v_cnt} voids ({e_pct:.1f}% empty)"
        cv2.putText(annotated, row_txt, (rx1 + 10, y1 + 22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)

    # Draw void bounding boxes
    for b, c in zip(boxes, confidences):
        bx1, by1, bx2, by2 = [int(v) for v in b]
        cv2.rectangle(annotated, (bx1, by1), (bx2, by2), (0, 0, 255), 2)
        cv2.putText(annotated, f"Void {c:.2f}", (bx1, max(by1 - 6, 15)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 255), 1)

    # Top summary banner with Alert Status
    t_state = temporal_state or state
    is_alert = alert.get("active", False) if alert else False
    alert_txt = f"ALERT: {alert.get('severity', 'ACTIVE')}" if is_alert else "ALERT: CLEAR"
    banner_color = (0, 0, 255) if is_alert else (0, 255, 0)

    banner_txt = f"Shelf: {state} (Temp: {t_state}) | {alert_txt} | Empty: {overall['empty_space_ratio']*100:.1f}% | Voids: {overall['void_count']}"
    cv2.rectangle(annotated, (0, 0), (annotated.shape[1], 36), (0, 0, 0), -1)
    cv2.putText(annotated, banner_txt, (15, 25),
                cv2.FONT_HERSHEY_SIMPLEX, 0.58, banner_color, 2)

    return annotated


# Backward compatibility alias
analyze_shelf_gaps = analyze_shelf_rows



