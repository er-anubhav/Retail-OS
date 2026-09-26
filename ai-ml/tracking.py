# pyrefly: ignore [missing-import]
import warnings
# pyrefly: ignore [missing-import]
import supervision as sv
# pyrefly: ignore [missing-import]
import numpy as np


def create_tracker():
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=FutureWarning)
        return sv.ByteTrack()


def update_tracks(tracker, boxes, confidences):
    if len(boxes) == 0:
        detections = sv.Detections.empty()
    else:
        detections = sv.Detections(xyxy=np.array(boxes), confidence=np.array(confidences))

    tracked = tracker.update_with_detections(detections)
    tracks = []
    if tracked.tracker_id is not None:
        for bbox, track_id in zip(tracked.xyxy, tracked.tracker_id):
            tracks.append({
                "track_id": int(track_id),
                "bbox": [float(bbox[0]), float(bbox[1]), float(bbox[2]), float(bbox[3])]
            })
    return tracks
