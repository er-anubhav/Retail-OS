# Retail Intelligence Frontend

A unified store operations dashboard for the Retail Intelligence Platform (SIH 2026 Problem Statement 26179).

The frontend displays real-time telemetry, queue wait projections, inventory status, and actionable store directives received from the backend edge intelligence pipeline.

---

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite 6
- **Styling**: Tailwind CSS (clean, responsive operations dashboard)
- **Charts**: Recharts
- **Icons**: Lucide React

---

## Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── DirectivesFeed.tsx        # Actionable store directives and operational recommendations
│   │   ├── QueueIntelligenceCard.tsx # Real-time queue length, Little's Law prediction & counter status
│   │   ├── ShelfInventoryCard.tsx    # Shelf availability grid across store categories
│   │   └── ShopperAnalyticsCard.tsx  # Store occupancy, hourly footfall rush & flow charts
│   ├── api.ts                        # Polling REST client for /api/stores/{store_id}/overview
│   ├── types.ts                      # TypeScript data contracts & schema interfaces
│   ├── App.tsx                       # Root operations dashboard layout & polling lifecycle
│   ├── index.css                     # Tailwind styling directives & fonts
│   └── main.tsx                      # React root entrypoint
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Running Locally

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server with proxy to backend (http://localhost:5173)
npm run dev

# Typecheck and build production bundle
npm run build

# Preview production build locally
npm run preview
```

> **API Proxy**: In development, Vite proxies requests from `/api` to `http://127.0.0.1:8000`.
