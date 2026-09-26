# Retail Intelligence Frontend

A neobrutalist React + TypeScript frontend for the Retail Intelligence Platform.

Existing store cameras feed an edge device that runs computer vision, turns people into anonymous tracks, and emits structured events — which become dashboards, alerts, predictions, and staff instructions.

---

## Tech Stack

- **Framework**: React 18 + TypeScript (strict)
- **Build**: Vite 6
- **Styling**: Tailwind CSS with custom neobrutalist tokens (high contrast, 3-4px borders, hard offset shadows)
- **Icons**: lucide-react
- **Routing**: react-router-dom
- **Typography**: Space Grotesk + IBM Plex Mono

---

## Directory Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── brutal/        # Neobrutalist design system primitives
│   │   ├── charts/        # Brutalist chart wrappers
│   │   └── layout/        # AppShell, Navbar, Sidebar, Page wrappers
│   ├── lib/
│   │   ├── api.ts         # REST API client & backend response types
│   │   ├── app-state.tsx  # Global state (time window, drawer, motion)
│   │   ├── auth.tsx       # Auth provider & session management
│   │   ├── data.tsx       # Polling provider & backend view-model adapters
│   │   ├── mock-data.ts   # Store map layout references
│   │   ├── tone.ts        # Semantic color tokens
│   │   ├── types.ts       # Domain & view model types
│   │   └── utils.ts       # Styling utilities
│   ├── pages/             # Overview, Queue, Inventory, Alerts, Recommendations, SignIn
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
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
