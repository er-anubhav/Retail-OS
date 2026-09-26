# pyrefly: ignore [missing-import]
from ultralytics import YOLO
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from transformers import pipeline
# pyrefly: ignore [missing-import]
from huggingface_hub import hf_hub_download

import config


def load_detector(model_name: str = "yolo11n.pt"):
    return YOLO(model_name)


def detect_persons(model, frame, conf_threshold: float = 0.4):
    results = model(frame, conf=conf_threshold, classes=[0], verbose=False)[0]
    boxes = results.boxes.xyxy.cpu().numpy() if results.boxes is not None else np.empty((0, 4))
    confidences = results.boxes.conf.cpu().numpy() if results.boxes is not None else np.empty((0,))
    return boxes, confidences


def load_shelf_gap_detector(repo_id: str = config.SHELF_GAP_MODEL_REPO, filename: str = config.SHELF_GAP_MODEL_FILE):
    model_path = hf_hub_download(repo_id=repo_id, filename=filename)
    return YOLO(model_path)


def detect_shelf_gaps(model, image_path: str, conf_threshold: float = config.SHELF_GAP_CONF_THRESHOLD):
    results = model(image_path, conf=conf_threshold, verbose=False)[0]
    boxes = results.boxes.xyxy.cpu().numpy() if results.boxes is not None else np.empty((0, 4))
    confidences = results.boxes.conf.cpu().numpy() if results.boxes is not None else np.empty((0,))
    return boxes, confidences


def load_shelf_classifier(model_name: str = config.SHELF_MODEL_NAME):
    return pipeline("zero-shot-image-classification", model=model_name)


def classify_shelf(classifier, image_path: str, candidate_labels=config.SHELF_LABELS, threshold=config.SHELF_CONFIDENCE_THRESHOLD):
    raw_results = classifier(image_path, candidate_labels=candidate_labels)

    # Normalize sigmoid outputs across candidate labels
    total = sum(float(r["score"]) for r in raw_results) or 1.0
    normalized_scores = {r["label"]: round(float(r["score"]) / total, 4) for r in raw_results}

    top_label = max(normalized_scores, key=normalized_scores.get)
    top_confidence = normalized_scores[top_label]

    if top_confidence >= threshold:
        final_state = config.LABEL_TO_STATE.get(top_label, "UNKNOWN")
    else:
        final_state = "UNKNOWN"

    return {
        "event_type": "SHELF_STATE",
        "state": final_state,
        "confidence": top_confidence,
        "predicted_label": top_label,
        "scores": normalized_scores
    }
