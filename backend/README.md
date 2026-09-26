# Retail Intelligence Backend

FastAPI + MongoDB (Motor, async) backend for the Retail Intelligence Platform.

The backend accepts anonymous structured events from the edge AI device, runs deterministic (non-ML) rules over them, and serves both the dashboard's REST endpoints and live WebSocket feeds.

---

## Architecture

```
backend/
├── app/
│   ├── main.py                  FastAPI app, CORS, router mounting, /api/health
│   ├── core/
│   │   ├── config.py            env-driven Settings (single cached instance)
│   │   ├── database.py          Motor client, indexes, shared queries, utcnow()
│   │   └── seed.py              idempotent demo stores / cameras / shelves
│   ├── api/
│   │   ├── routes/              one module per resource (overview, alerts, queues, etc.)
│   │   └── websocket.py         per-store ConnectionManager + snapshot builder
│   ├── models/                  Pydantic request/response + document contracts
│   ├── services/                Mongo reads/writes + alert & metric derivation
│   └── intelligence/
│       ├── prediction.py        queue projection arithmetic
│       └── recommendations.py   deterministic rule engine
├── requirements.txt
└── .env.example
```

---

## Setup & Running

### Prerequisites
- Python 3.10+
- MongoDB instance running on `localhost:27017` (or remote URI)

### Quick Start

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```

- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **API Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
