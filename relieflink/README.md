# ReliefLink — AI-Powered Disaster Emergency Response Platform

<div align="center">

**Connecting those in need with those who can help — in real time.**

An emergency response platform built for Pakistan's disaster management ecosystem, featuring AI risk analysis, weather intelligence, route safety, and real-time SOS coordination.

[Architecture](#architecture) · [Features](#features) · [Getting Started](#getting-started) · [API Docs](#api-documentation)

</div>

---

## Architecture

ReliefLink is a full-stack platform with three interconnected codebases:

```
relieflink/
├── mobile/          # React Native (Expo) — citizen-facing app
├── admin/           # React + Vite + Tailwind — admin command center
├── backend/         # Python FastAPI — REST API + AI engine
└── shared/          # Shared types & constants
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Mobile** | React Native, Expo Router, TypeScript, StyleSheet |
| **Admin** | React 18, Vite 5, Tailwind CSS 3, TypeScript |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2, Supabase |
| **AI** | OpenAI GPT-4o (or mock engine), multi-language NLP |
| **Database** | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| **Maps** | MapLibre GL JS |

---

## Features

### Mobile App

| Feature | Description |
|---------|-------------|
| **SOS Emergency** | One-tap distress signal with GPS, status tracking, and timeline |
| **Live Map** | Hazard zones, shelters, blocked roads, and responder locations |
| **Weather Intelligence** | Current weather, 24hr forecast, 5-day outlook, rain/wind/humidity |
| **Route Safety** | Primary + alternative route analysis with hazard & weather scoring |
| **Combined Risk** | AI-powered risk combining weather + hazards + roads + shelters |
| **AI Assistant** | Multi-language emergency chatbot (English, Urdu, Roman Urdu) |
| **Safe Navigation** | Turn-by-turn routing avoiding active disaster zones |
| **Find Safe Place** | Nearest shelters ranked by safety score and distance |
| **Nearby Help** | Hospitals, rescue teams, and volunteers sorted by proximity |
| **Smart Alerts** | Severity-coded weather and disaster notifications |

### Admin Dashboard

| Feature | Description |
|---------|-------------|
| **Command Center** | Live metrics bar, stats cards, command map, emergency feed |
| **Weather Intelligence** | Weather monitoring panel with forecasts, warnings, regional risk |
| **AI Risk Intelligence** | Multi-hazard risk scoring with visual breakdown bars |
| **SOS Center** | Active distress signal management and responder coordination |
| **Alert Composer** | Create and broadcast severity-coded disaster alerts |
| **Shelter Management** | Track shelters, capacity, and aid distribution |

### Backend API

| Module | Endpoints | Description |
|--------|-----------|-------------|
| **Auth** | `/api/v1/auth` | Supabase authentication (email/password, OTP) |
| **SOS** | `/api/v1/sos` | Full SOS lifecycle: create → assign → dispatch → resolve |
| **Locations** | `/api/v1/locations` | GPS tracking, nearby resources search |
| **Shelters** | `/api/v1/shelters` | Shelter CRUD, capacity, accessibility |
| **Hospitals** | `/api/v1/hospitals` | Hospital registry and proximity search |
| **Teams** | `/api/v1/teams` | Rescue team management and dispatch |
| **Volunteers** | `/api/v1/volunteers` | Volunteer coordination |
| **Risk Zones** | `/api/v1/risk-zones` | AI-powered hazard zone mapping |
| **Alerts** | `/api/v1/alerts` | Disaster alert creation and broadcast |
| **AI** | `/api/v1/ai` | Chatbot, risk analysis, recommendations |
| **Safe Routes** | `/api/v1/safe-route` | Navigation avoiding disaster zones |
| **Analytics** | `/api/v1/analytics` | Dashboard stats and response metrics |
| **Notifications** | `/api/v1/notifications` | Push notification management |
| **Weather** | `/api/v1/weather` | Weather data, combined risk, route safety |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm 9+
- **Python** 3.11+ and pip
- **Expo CLI** (`npm install -g expo-cli`)
- (Optional) **Supabase** project for production database

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase and OpenAI keys (or leave empty for mock mode)

# Start the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` with interactive docs at `http://localhost:8000/docs`.

> **Mock Mode:** Without Supabase/OpenAI credentials, the backend runs entirely in-memory with realistic mock data — no external services required.

### Admin Dashboard

```bash
cd admin

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` to access the admin command center.

### Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Scan the QR code with **Expo Go** (Android) or the Camera app (iOS) to preview on your device.

---

## Project Structure

```
mobile/
├── app/
│   ├── (tabs)/           # Tab screens (Home, Map, Weather, SOS, AI, Profile)
│   ├── (modals)/         # Modal screens (Route Safety, Find Safe Place, etc.)
│   ├── _layout.tsx       # Root navigation (Splash → Onboarding → Main)
│   ├── splash.tsx
│   ├── onboarding.tsx
│   └── permissions.tsx
├── components/
│   ├── alerts/           # AlertCard
│   ├── chat/             # AIChatUI
│   ├── risk/             # RiskAnalysisCard
│   ├── shared/           # SharedComponents
│   └── sos/              # SOSButton, StatusTimeline
├── constants/
│   └── theme.ts          # Design tokens (colors, typography, shadows)
├── services/
│   ├── weatherService.ts # Provider-agnostic weather (mock → real API)
│   ├── combinedRisk.ts   # Weighted multi-factor risk engine
│   ├── routeSafety.ts    # Route analysis with alternatives
│   ├── riskAnalysis.ts   # Hazard proximity scoring
│   ├── sosApi.ts         # SOS lifecycle API client
│   └── aiAssistant.ts    # Multi-language chatbot client
└── utils/
    └── sampleData.ts     # Realistic Islamabad monsoon mock data

admin/
├── src/
│   ├── components/
│   │   ├── layout/       # Sidebar, Header, CommandCenter
│   │   ├── dashboard/    # StatsCard
│   │   ├── map/          # CommandMap (MapLibre)
│   │   ├── alerts/       # AlertComposer
│   │   └── ui/           # Button, Card, Input, Modal, Skeleton, etc.
│   ├── pages/
│   │   └── Dashboard.tsx # Main dashboard with all panels
│   ├── styles/
│   │   └── globals.css   # Tailwind base + custom utilities
│   └── App.tsx           # Root component with page routing
└── tailwind.config.ts    # Custom theme (brand, severity, glass effects)

backend/
├── app/
│   ├── routers/          # 14 API route modules
│   ├── services/         # Business logic (auth, sos, location, risk, weather)
│   ├── models/
│   │   └── schemas.py    # 60+ Pydantic models (TypeScript-compatible)
│   ├── database/
│   │   └── supabase.py   # Supabase client + mock fallback
│   ├── ai/
│   │   └── chatbot.py    # AI chatbot engine (OpenAI or mock)
│   ├── utils/            # Geospatial helpers, error handlers
│   ├── config.py         # Pydantic Settings (env-driven)
│   └── main.py           # App factory, CORS, router registration
└── migrations/
    └── 001_initial_schema.sql  # Supabase database schema
```

---

## API Documentation

Once the backend is running, visit:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

### Key Endpoints

```
GET  /api/v1/weather/current          Current weather + forecasts + warnings
POST /api/v1/weather/risk             Combined risk analysis (weather + hazards)
POST /api/v1/weather/route-safety     Route safety check with alternatives

POST /api/v1/sos                      Create SOS emergency request
GET  /api/v1/sos/active               List active SOS signals

POST /api/v1/ai/chat                  Send message to AI assistant
POST /api/v1/ai/risk-analysis         AI-powered risk assessment

GET  /api/v1/shelters                 List nearby shelters
GET  /api/v1/safe-route               Safe navigation routing

GET  /api/v1/analytics/dashboard      Admin dashboard statistics
```

---

## Weather Intelligence & Route Safety

The Weather Intelligence module provides a comprehensive risk assessment layer:

| Component | Description |
|-----------|-------------|
| **Weather Service** | Provider-agnostic architecture — swap mock data for OpenWeatherMap or WeatherAPI via env var |
| **Combined Risk Engine** | Weighted scoring: weather (25%) + hazard proximity (15%) + blocked roads + shelter distance |
| **Route Safety** | Primary + alternative route analysis, automatic safer-route suggestion (5-point threshold) |
| **Risk Levels** | 5-tier severity: SAFE → LOW → MEDIUM → HIGH → CRITICAL |
| **Smart Alerts** | Severity-coded weather warnings with actionable guidance |

> **Important:** All risk assessments are AI-assisted and not predictive. Results should be verified by trained emergency personnel.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | `development` or `production` | `development` |
| `SUPABASE_URL` | Supabase project URL | _(empty = mock mode)_ |
| `SUPABASE_KEY` | Supabase anon/public key | _(empty)_ |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | _(empty)_ |
| `OPENAI_API_KEY` | OpenAI API key for AI features | _(empty = mock AI)_ |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o` |
| `WEATHER_PROVIDER` | `mock`, `openweathermap`, or `weatherapi` | `mock` |
| `WEATHER_API_KEY` | Weather API key | _(empty)_ |

---

## Design System

### Severity Scale

| Level | Color | Usage |
|-------|-------|-------|
| **Safe** | `#10B981` (Emerald) | No threats detected |
| **Low** | `#22C55E` (Green) | Minor risk, stay informed |
| **Medium** | `#EAB308` (Yellow) | Moderate risk, exercise caution |
| **High** | `#F97316` (Orange) | Significant risk, prepare to act |
| **Critical** | `#EF4444` (Red) | Imminent danger, take action |

### UI Patterns

- **Mobile:** Dark theme with glassmorphism cards, `StyleSheet`-based styling
- **Admin:** Dark theme with Tailwind CSS, glass-card effects, live data feeds
- **Consistent tokens:** Shared color constants across mobile and admin

---

## License

This project is built for disaster management in Pakistan. Feel free to adapt it for other regions.
