MODEL_NAME = "yolo11n.pt"
CONFIDENCE_THRESHOLD = 0.4

# Start and end coordinates (x, y) of the entrance line
ENTRANCE_LINE = ((100, 300), (540, 300))

# Polygon points [(x, y), ...] defining checkout area
CHECKOUT_ROI = [(50, 320), (320, 320), (320, 470), (50, 470)]

# Output paths
OUTPUT_DIR = "outputs"
OUTPUT_VIDEO_NAME = "processed_video.mp4"
OUTPUT_EVENTS_NAME = "events.json"
OUTPUT_SUMMARY_NAME = "summary.json"
OUTPUT_SHELF_NAME = "shelf_result.json"
OUTPUT_SHELF_EVAL_NAME = "shelf_eval.json"
DEFAULT_SHELF_EVAL_DIR = "/tmp/retail_eval_cache"

# Queue intelligence settings
QUEUE_RATE_WINDOW_SECONDS = 60.0
QUEUE_MIN_OBSERVATION_SECONDS = 20.0
QUEUE_MIN_DEPARTURES = 1
QUEUE_DEBOUNCE_FRAMES = 3
QUEUE_ALERT_THRESHOLD = 5

# Localized shelf gap detection settings
SHELF_GAP_MODEL_REPO = "akul-29/Retail-Shelf-Gap-Detection_Model"
SHELF_GAP_MODEL_FILE = "best.pt"
SHELF_GAP_CONF_THRESHOLD = 0.25
SHELF_ROW_CLUSTER_THRESHOLD = 0.10

# Fixed-camera shelf area and row geometry (None = automatic image-based estimation)
SHELF_ROI = None  # [x1, y1, x2, y2]
SHELF_ROWS = None  # [[y1, y2], [y1, y2], ...]
SHELF_EMPTY_THRESHOLD = 0.50
SHELF_LOW_THRESHOLD = None
SHELF_STATE_WINDOW = 5
OUTPUT_SHELF_IMAGE_NAME = "shelf_annotated.jpg"

# SigLIP zero-shot shelf intelligence settings (for comparison)
SHELF_MODEL_NAME = "google/siglip-base-patch16-224"
SHELF_CONFIDENCE_THRESHOLD = 0.45
SHELF_LABELS = [
    "a fully stocked retail shelf",
    "a low-stock retail shelf",
    "an empty retail shelf"
]
LABEL_TO_STATE = {
    "a fully stocked retail shelf": "NORMAL",
    "a low-stock retail shelf": "LOW",
    "an empty retail shelf": "EMPTY"
}
