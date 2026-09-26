import argparse
import json
import os
# pyrefly: ignore [missing-import]
import cv2 
# pyrefly: ignore [missing-import]
import numpy as np
from datetime import datetime

import config
from detection import (
    load_detector, detect_persons, load_shelf_classifier, classify_shelf,
    load_shelf_gap_detector, detect_shelf_gaps
)
from tracking import create_tracker, update_tracks
from analytics import (
    create_analytics_engine, update_analytics, get_summary,
    estimate_shelf_gap_heuristic, analyze_shelf_rows, draw_shelf_visuals,
    create_shelf_tracker, update_shelf_temporal
)


def draw_visuals(frame, tracks, state, entrance_line, checkout_roi):
    annotated = frame.copy()

    # Draw checkout ROI
    cv2.polylines(annotated, [np.array(checkout_roi, dtype=np.int32)], isClosed=True, color=(255, 100, 0), thickness=2)
    roi_label_pos = checkout_roi[0]
    cv2.putText(annotated, "Checkout Area", (roi_label_pos[0], roi_label_pos[1] - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 100, 0), 2)

    # Draw entrance line
    p1, p2 = entrance_line
    cv2.line(annotated, p1, p2, color=(0, 255, 255), thickness=2)
    cv2.putText(annotated, "Entrance Line", (p1[0], p1[1] - 8),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

    # Draw person bounding boxes and track IDs
    for item in tracks:
        bbox = item["bbox"]
        track_id = item["track_id"]
        x1, y1, x2, y2 = [int(v) for v in bbox]

        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(annotated, f"ID: {track_id}", (x1, max(y1 - 6, 15)),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Draw HUD banner with verified prediction and status
    hud_bg = (30, 30, 30)
    cv2.rectangle(annotated, (10, 10), (380, 205), hud_bg, -1)
    cv2.rectangle(annotated, (10, 10), (380, 205), (120, 120, 120), 1)

    arr_str = f"{state['arrival_rate']:.1f}/min" if state.get("arrival_rate") is not None else "--"
    serv_str = f"{state['service_rate']:.1f}/min" if state.get("service_rate") is not None else "--"
    pred_str = str(state.get("predicted_queue_5m")) if state.get("predicted_queue_5m") is not None else "--"
    status_str = state.get("prediction_status", "INSUFFICIENT_DATA")

    cv2.putText(annotated, f"Store Occupancy : {state['occupancy']}", (20, 32),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1)
    cv2.putText(annotated, f"Queue           : {state['queue_length']}", (20, 56),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 220, 255), 1)
    cv2.putText(annotated, f"Arrival         : {arr_str}", (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 255), 1)
    cv2.putText(annotated, f"Service         : {serv_str}", (20, 104),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 255), 1)
    cv2.putText(annotated, f"Pred 5m         : {pred_str}", (20, 128),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (100, 255, 255), 1)

    status_color = (120, 255, 120) if status_str == "VALID" else (180, 180, 180)
    cv2.putText(annotated, f"Status          : {status_str}", (20, 152),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, status_color, 1)

    rec_color = (0, 140, 255) if "opening" in state.get("recommendation", "") else (120, 255, 120)
    if status_str != "VALID":
        rec_color = (160, 160, 160)
    cv2.putText(annotated, f"Rec: {state.get('recommendation', 'Insufficient data for prediction.')}", (20, 174),
                cv2.FONT_HERSHEY_SIMPLEX, 0.44, rec_color, 1)

    cv2.putText(annotated, f"Entries / Exits : {state['entry_count']} / {state['exit_count']}", (20, 196),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 255, 180), 1)

    return annotated


def process_video(video_path: str, output_dir: str = config.OUTPUT_DIR):
    os.makedirs(output_dir, exist_ok=True)
    video_out_path = os.path.join(output_dir, config.OUTPUT_VIDEO_NAME)
    events_out_path = os.path.join(output_dir, config.OUTPUT_EVENTS_NAME)
    summary_out_path = os.path.join(output_dir, config.OUTPUT_SUMMARY_NAME)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Unable to open video source {video_path}")
        return

    fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(video_out_path, fourcc, fps, (width, height))

    print(f"Loading detector: {config.MODEL_NAME}")
    detector = load_detector(config.MODEL_NAME)
    tracker = create_tracker()
    analytics_engine = create_analytics_engine(config.ENTRANCE_LINE, config.CHECKOUT_ROI)

    all_events = []
    frame_idx = 0

    print(f"Processing video: {video_path} ({width}x{height} @ {fps:.1f} fps)")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        timestamp_str = datetime.now().isoformat()
        video_time_sec = frame_idx / fps

        # Person detection
        boxes, confidences = detect_persons(detector, frame, config.CONFIDENCE_THRESHOLD)

        # Anonymous tracking
        tracks = update_tracks(tracker, boxes, confidences)

        # Footfall, occupancy, and queue analytics using video time
        events, state = update_analytics(analytics_engine, tracks, timestamp_str, video_time_sec)
        all_events.extend(events)

        # Annotation and video writing
        visual_frame = draw_visuals(frame, tracks, state, config.ENTRANCE_LINE, config.CHECKOUT_ROI)
        out.write(visual_frame)

        frame_idx += 1
        if frame_idx % 30 == 0:
            print(f"Frame {frame_idx} ({video_time_sec:.1f}s): Occ={state['occupancy']} Queue={state['queue_length']} Status={state['prediction_status']} Rec={state['recommendation']}")

    cap.release()
    out.release()

    # Save JSON events
    with open(events_out_path, "w") as f:
        json.dump(all_events, f, indent=2)

    # Save and display summary
    summary = get_summary(analytics_engine)
    with open(summary_out_path, "w") as f:
        json.dump(summary, f, indent=2)

    print("\n--- Analytics Summary ---")
    for k, v in summary.items():
        print(f"{k}: {v}")

    print(f"\nOutputs generated:")
    print(f"- Processed video: {video_out_path}")
    print(f"- JSON events:     {events_out_path}")
    print(f"- Summary JSON:    {summary_out_path}")


def process_shelf(shelf_image_path: str, output_dir: str = config.OUTPUT_DIR):
    os.makedirs(output_dir, exist_ok=True)
    shelf_out_path = os.path.join(output_dir, config.OUTPUT_SHELF_NAME)
    shelf_img_path = os.path.join(output_dir, config.OUTPUT_SHELF_IMAGE_NAME)

    if not os.path.isfile(shelf_image_path):
        print(f"Error: Shelf image file not found: {shelf_image_path}")
        return

    img = cv2.imread(shelf_image_path)
    if img is None:
        print(f"Error: Could not read image: {shelf_image_path}")
        return

    # 1. Localized shelf gap detection with row-level analysis
    print(f"Loading pretrained localized shelf gap detector: {config.SHELF_GAP_MODEL_REPO}")
    gap_detector = load_shelf_gap_detector(config.SHELF_GAP_MODEL_REPO, config.SHELF_GAP_MODEL_FILE)
    print(f"Detecting shelf gaps: {shelf_image_path}")
    gap_boxes, gap_confs = detect_shelf_gaps(gap_detector, shelf_image_path, config.SHELF_GAP_CONF_THRESHOLD)
    gap_analysis = analyze_shelf_rows(img, gap_boxes, gap_confs)

    # 2. Whole-image SigLIP classification (for comparison)
    print(f"Loading zero-shot vision-language model: {config.SHELF_MODEL_NAME}")
    classifier = load_shelf_classifier(config.SHELF_MODEL_NAME)
    siglip_result = classify_shelf(classifier, shelf_image_path, config.SHELF_LABELS, config.SHELF_CONFIDENCE_THRESHOLD)

    # 3. OpenCV visual gap / edge heuristic baseline
    heuristic_result = estimate_shelf_gap_heuristic(shelf_image_path)

    # 4. Draw visual annotation with temporal & alert status
    annotated = draw_shelf_visuals(
        img,
        gap_analysis["shelf_roi"],
        gap_analysis["rows"],
        gap_boxes,
        gap_confs,
        gap_analysis["overall"],
        gap_analysis["state"],
        temporal_state=gap_analysis["temporal_state"],
        alert=gap_analysis["alert"]
    )
    cv2.imwrite(shelf_img_path, annotated)

    output_data = {
        "event_type": "SHELF_ANALYSIS",
        "state": gap_analysis["state"],
        "temporal_state": gap_analysis["temporal_state"],
        "alert": gap_analysis["alert"],
        "overall": gap_analysis["overall"],
        "rows": gap_analysis["rows"],
        "shelf_roi": gap_analysis["shelf_roi"],
        "image": shelf_image_path,
        "method": "localized_row_relative_void_detector",
        "model": config.SHELF_GAP_MODEL_REPO,
        "siglip_comparison": {
            "method": "whole_image_siglip_zeroshot",
            "model": config.SHELF_MODEL_NAME,
            "state": siglip_result["state"],
            "confidence": siglip_result["confidence"],
            "scores": siglip_result["scores"]
        },
        "heuristic_comparison": {
            "method": "opencv_edge_density",
            "state": heuristic_result["state"],
            "confidence": heuristic_result["confidence"],
            "edge_density": heuristic_result["edge_density"]
        }
    }

    with open(shelf_out_path, "w") as f:
        json.dump(output_data, f, indent=2)

    print("\n=== Localized Shelf Gap Analysis (Row-Relative & Temporal) ===")
    print(f"Image:                 {shelf_image_path}")
    print(f"Instantaneous State:   {gap_analysis['state']}")
    print(f"Temporal State:        {gap_analysis['temporal_state']}")
    alert_info = gap_analysis["alert"]
    alert_label = f"ACTIVE ({alert_info['severity']})" if alert_info["active"] else "CLEAR"
    print(f"Alert Status:          {alert_label}")
    if alert_info["active"]:
        print(f"Alert Message:         {alert_info['message']}")
        print(f"Affected Rows:         {alert_info['affected_rows']}")
    print(f"Shelf ROI:             {gap_analysis['shelf_roi']}")
    print(f"Overall Empty Ratio:   {gap_analysis['overall']['empty_space_ratio']:.4f}")
    print(f"Overall Occupied Ratio:{gap_analysis['overall']['occupied_space_ratio']:.4f}")
    print(f"Total Void Count:      {gap_analysis['overall']['void_count']}")

    print(f"\nShelf Rows ({len(gap_analysis['rows'])} rows evaluated):")
    for r in gap_analysis["rows"]:
        e_pct = r["empty_space_ratio"] * 100.0
        o_pct = r["occupied_space_ratio"] * 100.0
        r_st = r.get("state", "UNKNOWN")
        print(f"  - Row {r['row_index']} [{r_st}]: {r['void_count']} voids | Empty: {e_pct:.1f}% | Occ: {o_pct:.1f}% | Avg Conf: {r['avg_confidence']:.2f}")

    print("\nComparison with Whole-Image SigLIP:")
    print(f"  SigLIP State:        {siglip_result['state']} (Top Score: {siglip_result['confidence']:.4f})")
    for label, score in siglip_result["scores"].items():
        print(f"    - {label:<28}: {score:.4f}")

    print("\nComparison with OpenCV Visual Gap Heuristic:")
    print(f"  Heuristic State:     {heuristic_result['state']} (Edge Density: {heuristic_result['edge_density']:.4f})")

    print(f"\nSaved shelf analysis result to: {shelf_out_path}")
    print(f"Saved annotated shelf visual to: {shelf_img_path}")


def evaluate_shelves(eval_dir: str = config.DEFAULT_SHELF_EVAL_DIR, output_dir: str = config.OUTPUT_DIR):
    os.makedirs(output_dir, exist_ok=True)
    manifest_path = os.path.join(eval_dir, "manifest.json")

    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            items = json.load(f)
    else:
        image_exts = (".jpg", ".jpeg", ".png")
        filenames = [f for f in sorted(os.listdir(eval_dir)) if f.lower().endswith(image_exts)]
        items = [{
            "filename": f,
            "image_path": os.path.join(eval_dir, f),
            "source_dataset": "local_cache",
            "source_label": "unlabeled",
            "source_type": "unknown"
        } for f in filenames]

    if not items:
        print(f"No shelf images found in {eval_dir}")
        return

    print(f"Loading localized shelf gap detector: {config.SHELF_GAP_MODEL_REPO}")
    gap_detector = load_shelf_gap_detector(config.SHELF_GAP_MODEL_REPO, config.SHELF_GAP_MODEL_FILE)

    print(f"Loading zero-shot SigLIP classifier: {config.SHELF_MODEL_NAME}")
    siglip_classifier = load_shelf_classifier(config.SHELF_MODEL_NAME)

    eval_results = []
    print("\n" + "=" * 135)
    print(f"{'Image Identifier':<26} | {'Source Label':<18} | {'Voids':<6} | {'Rows':<5} | {'Empty Ratio':<12} | {'State':<9} | {'Alert':<12} | {'SigLIP State':<12}")
    print("-" * 135)

    gap_state_counts = {"NORMAL": 0, "LOW": 0, "EMPTY": 0, "UNKNOWN": 0}
    siglip_state_counts = {"NORMAL": 0, "LOW": 0, "EMPTY": 0, "UNKNOWN": 0}
    empty_ratios = []

    for item in items:
        img_path = item["image_path"]
        fname = item["filename"]
        source_label = item.get("source_label", "unlabeled")

        img = cv2.imread(img_path)
        if img is None:
            continue

        # 1. Localized gap detector with row-relative analysis
        gap_boxes, gap_confs = detect_shelf_gaps(gap_detector, img_path, config.SHELF_GAP_CONF_THRESHOLD)
        gap_analysis = analyze_shelf_rows(img, gap_boxes, gap_confs)

        # 2. SigLIP zero-shot classifier
        siglip = classify_shelf(siglip_classifier, img_path)

        # 3. OpenCV heuristic
        heuristic = estimate_shelf_gap_heuristic(img_path)

        g_state = gap_analysis["state"]
        s_state = siglip["state"]
        gap_state_counts[g_state] = gap_state_counts.get(g_state, 0) + 1
        siglip_state_counts[s_state] = siglip_state_counts.get(s_state, 0) + 1
        empty_ratios.append(gap_analysis["overall"]["empty_space_ratio"])

        short_fname = fname if len(fname) <= 26 else fname[:23] + "..."
        short_lbl = source_label if len(source_label) <= 18 else source_label[:15] + "..."
        num_rows = len(gap_analysis["rows"])
        v_count = gap_analysis["overall"]["void_count"]
        e_ratio = gap_analysis["overall"]["empty_space_ratio"]
        alert_label = f"ACTIVE ({gap_analysis['alert']['severity']})" if gap_analysis["alert"]["active"] else "CLEAR"
        print(f"{short_fname:<26} | {short_lbl:<18} | {v_count:<6} | {num_rows:<5} | {e_ratio:<12.4f} | {g_state:<9} | {alert_label:<12} | {s_state:<12}")

        eval_results.append({
            "identifier": fname,
            "source_dataset": item.get("source_dataset", "unknown"),
            "source_label": source_label,
            "source_type": item.get("source_type", "unknown"),
            "shelf_analysis": {
                "state": g_state,
                "temporal_state": gap_analysis["temporal_state"],
                "alert": gap_analysis["alert"],
                "overall": gap_analysis["overall"],
                "shelf_roi": gap_analysis["shelf_roi"],
                "rows": gap_analysis["rows"]
            },
            "siglip_zeroshot": {
                "state": s_state,
                "confidence": siglip["confidence"],
                "scores": siglip["scores"]
            },
            "heuristic": {
                "state": heuristic["state"],
                "confidence": heuristic["confidence"],
                "edge_density": heuristic["edge_density"]
            }
        })

    total_images = len(eval_results)
    mean_empty_ratio = round(float(np.mean(empty_ratios)), 4) if empty_ratios else 0.0

    print("=" * 135)
    print("\n=== Shelf Intelligence Benchmark Summary (Row-Relative) ===")
    print(f"Total Evaluated Images:           {total_images}")
    print(f"Mean Row-Relative Empty Ratio:    {mean_empty_ratio:.4f}")
    print(f"Shelf State Distribution:         NORMAL: {gap_state_counts['NORMAL']}, LOW: {gap_state_counts['LOW']}, EMPTY: {gap_state_counts['EMPTY']}, UNKNOWN: {gap_state_counts['UNKNOWN']}")
    print(f"SigLIP State Distribution:        NORMAL: {siglip_state_counts['NORMAL']}, LOW: {siglip_state_counts['LOW']}, EMPTY: {siglip_state_counts['EMPTY']}, UNKNOWN: {siglip_state_counts['UNKNOWN']}")

    summary_data = {
        "evaluation_timestamp": datetime.now().isoformat(),
        "total_images": total_images,
        "gap_model": config.SHELF_GAP_MODEL_REPO,
        "siglip_model": config.SHELF_MODEL_NAME,
        "mean_empty_space_ratio": mean_empty_ratio,
        "shelf_state_distribution": gap_state_counts,
        "siglip_state_distribution": siglip_state_counts,
        "results": eval_results
    }

    out_path = os.path.join(output_dir, config.OUTPUT_SHELF_EVAL_NAME)
    with open(out_path, "w") as f:
        json.dump(summary_data, f, indent=2)
    print(f"\nSaved benchmark results to: {out_path}\n")


def test_shelf_temporal_logic():
    print("=== Shelf Temporal Smoothing & Alert Transition Synthetic Validation ===\n")
    test_cases = [
        ("1. NORMAL repeated", ["NORMAL", "NORMAL", "NORMAL", "NORMAL", "NORMAL", "NORMAL"], "NORMAL", 0),
        ("2. EMPTY repeated", ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY"], "EMPTY", 1),
        ("3. UNKNOWN repeated", ["UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN", "UNKNOWN"], "UNKNOWN", 0),
        ("4. NORMAL -> EMPTY", ["NORMAL", "NORMAL", "NORMAL", "EMPTY", "EMPTY", "EMPTY"], "EMPTY", 1),
        ("5. EMPTY -> NORMAL", ["EMPTY", "EMPTY", "EMPTY", "EMPTY", "EMPTY", "NORMAL", "NORMAL", "NORMAL", "NORMAL"], "NORMAL", 1),
        ("6. EMPTY -> EMPTY -> EMPTY without duplicate alerts", ["EMPTY", "EMPTY", "EMPTY"], "EMPTY", 1),
        ("7. UNKNOWN -> EMPTY", ["UNKNOWN", "UNKNOWN", "UNKNOWN", "EMPTY", "EMPTY", "EMPTY"], "EMPTY", 1),
        ("8. Mixed states where majority remains NORMAL", ["NORMAL", "NORMAL", "UNKNOWN", "NORMAL", "EMPTY", "NORMAL"], "NORMAL", 0),
    ]

    mock_rows = [
        {"row_index": 1, "state": "NORMAL", "empty_space_ratio": 0.0, "void_count": 0},
        {"row_index": 2, "state": "EMPTY", "empty_space_ratio": 0.65, "void_count": 4}
    ]

    all_passed = True
    for name, seq, expected_final_temp, expected_alerts in test_cases:
        tracker = create_shelf_tracker(window_size=config.SHELF_STATE_WINDOW)
        emitted_alerts = []
        print(f"Test Scenario: {name}")
        print(f"Sequence: {' -> '.join(seq)}")
        for step_idx, st in enumerate(seq, start=1):
            temp_st, alert_st, alert_ev = update_shelf_temporal(tracker, st, mock_rows)
            if alert_ev:
                emitted_alerts.append(alert_ev)
            ev_str = f"ALERT ({alert_ev['severity']})" if alert_ev else "NO"
            print(f"  Frame {step_idx}: input={st:<7} -> temporal={temp_st:<7} | alert_active={str(alert_st['active']):<5} | alert_emitted={ev_str}")

        final_temp = tracker["current_temporal_state"]
        num_alerts = len(emitted_alerts)
        passed = (final_temp == expected_final_temp and num_alerts == expected_alerts)
        if not passed:
            all_passed = False
            print(f"  --> RESULT: FAILED (expected final={expected_final_temp}, alerts={expected_alerts}; got final={final_temp}, alerts={num_alerts})\n")
        else:
            print(f"  --> RESULT: PASSED (final={final_temp}, alerts emitted={num_alerts})\n")

    if all_passed:
        print("All 8 synthetic temporal & alert transition tests PASSED.\n")
    return all_passed


def main():
    parser = argparse.ArgumentParser(description="Retail Intelligence AI/ML POC")
    parser.add_argument("--input", type=str, default=None, help="Path to input MP4 video")
    parser.add_argument("--shelf", type=str, default=None, help="Path to input shelf image")
    parser.add_argument("--shelf-eval", action="store_true", help="Evaluate shelf intelligence on cached real retail images")
    parser.add_argument("--shelf-test", action="store_true", help="Run temporal smoothing and alert logic synthetic validation")
    parser.add_argument("--eval-dir", type=str, default=config.DEFAULT_SHELF_EVAL_DIR, help="Path to evaluation images cache")
    parser.add_argument("--output-dir", type=str, default=config.OUTPUT_DIR, help="Path to output directory")
    args = parser.parse_args()

    if args.shelf_test:
        test_shelf_temporal_logic()
    elif args.shelf_eval:
        evaluate_shelves(args.eval_dir, args.output_dir)
    elif args.shelf:
        process_shelf(args.shelf, args.output_dir)
    elif args.input:
        process_video(args.input, args.output_dir)
    else:
        print("Please provide --input path/to/video.mp4, --shelf path/to/shelf.jpg, --shelf-eval, or --shelf-test")


if __name__ == "__main__":
    main()
