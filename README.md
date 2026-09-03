# ReliefLink — AI Disaster Emergency Response Platform

> **Real-time disaster monitoring, nearby hospitals & shelters, weather intelligence, and AI-powered risk analysis for Pakistan — all in one platform.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?logo=github)](https://nimra1692005.github.io/relifelife/)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render.com-green?logo=render)](https://relieflink-api.onrender.com/docs)

---

## Features

### User App
- **Landing Page** — Two-button entry (User / Volunteer) with mobile-responsive scroll
- **Live Map** — Leaflet.js with real SOS markers, hospitals, shelters, risk zones (OpenStreetMap + OpenWeatherMap)
- **Weather Intelligence** — Live weather data for all major Pakistani cities via OpenWeatherMap
- **Nearby Hospitals & Shelters** — GPS-powered search using Overpass API (100% free, no API key needed)
- **Route Planner** — Safe route planning with disaster alerts along the way (OSRM + OpenWeatherMap)
- **AI Flood Predictor** — Logistic regression ML model computing flood probability from live rainfall forecasts
- **AI Chat Assistant** — Multilingual (English / اردو / Roman Urdu) emergency assistant powered by Groq AI
- **Emergency SOS** — One-tap SOS with GPS location, emergency type, and real-time team assignment
- **Live Location Tracking** — Real-time GPS with pulsing marker and nearest hospital detection
- **Famous Hospitals** — 36 real Pakistani hospitals (Lahore, Karachi, Islamabad, Peshawar + more)
- **Historical Flood Comparison** — Compare live rainfall against documented Pakistani flood events

### Mobile App (React Native / Expo)
- Cross-platform iOS/Android app with tab navigation
- Real-time SOS with status timeline
- AI chat with scope-guarded responses (blocks off-topic / secret-leak attempts)
- Risk analysis cards with combined severity scoring
- Safe navigation with route safety overlays

### Volunteer Network
- Volunteer registration with skill-based matching
- Team deployment tracking
- Availability management (Available / Weekends / Evenings / On Call)

### Admin Dashboard
- Command center with live stats (Active SOS, People Helped, Active Shelters, High-Risk Zones)
- River level monitoring (FFD baselines + live OpenWeatherMap rainfall)
- Real-time disaster alerts (USGS earthquakes, GDACS global disasters, OpenWeatherMap weather)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla JS + Leaflet.js + HTML/CSS (single-file SPA) |
| **Mobile** | React Native (Expo) + TypeScript |
| **Backend** | Python FastAPI + Supabase (PostgreSQL) |
| **AI/ML** | Logistic Regression (flood predictor) + Groq LLM (chat) |
| **Maps** | OpenStreetMap + CARTO tiles + OSRM routing |
| **Weather** | OpenWeatherMap API (free tier) |
| **Data** | FFD/WAPDA river baselines + PMD weather patterns |
| **Deployment** | GitHub Pages (frontend) + Render.com (backend) |

---

## Project Structure

```
relieflink/
├── admin/                    # Frontend (GitHub Pages deploy target)
│   ├── preview.html          # Main SPA (all pages in one file)
│   ├── hero.png              # Landing background
│   ├── hospital.png          # Hospital page header
│   ├── sos.png               # SOS modal header
│   ├── weather.png           # Weather page header
│   ├── route.png             # Route planner header
│   ├── flood.png             # Flood predictor header
│   ├── volunteers.png        # Volunteer network header
│   ├── safe-places.png       # Safe places header
│   └── src/                  # Admin React components (optional)
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Settings & environment config
│   │   ├── ai/               # AI chatbot service
│   │   ├── database/         # Supabase client
│   │   ├── middleware/       # CORS, auth middleware
│   │   ├── models/           # Pydantic schemas
│   │   ├── routers/          # API endpoints (auth, SOS, weather, etc.)
│   │   ├── services/         # Business logic (SOS, weather, location)
│   │   └── utils/            # Geo calculations, common helpers
│   ├── migrations/           # SQL schema for Supabase
│   ├── Procfile              # Render.com deployment
│   ├── requirements.txt      # Python dependencies
│   └── runtime.txt           # Python version
├── mobile/                   # React Native (Expo) mobile app
│   ├── app/                  # Screens & navigation
│   ├── components/           # Reusable UI components
│   ├── constants/            # Theme constants
│   ├── services/             # AI assistant, weather, SOS API
│   └── utils/                # Sample data, helpers
├── shared/                   # Shared types & constants
│   ├── constants/            # Color palette
│   └── types/                # TypeScript disaster types
├── README.md                 # This file
└── index.html                # Root redirect to admin/preview.html
```

---

## Quick Start

### Frontend (GitHub Pages)
The frontend is a **single-file SPA** — just open `relieflink/admin/preview.html` in a browser, or visit the live demo:
- **Live**: https://nimra1692005.github.io/relifelife/

### Backend (Render.com)
1. Fork this repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Set build command: `pip install -r relieflink/backend/requirements.txt`
5. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` (working dir: `relieflink/backend`)
6. Add environment variables:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_KEY` — your Supabase anon key
   - `SUPABASE_SERVICE_KEY` — your Supabase service role key
   - `WEATHER_API_KEY` — OpenWeatherMap API key (free: https://openweathermap.org/api)
   - `ENVIRONMENT` — `production`
   - `CORS_ORIGINS` — `https://nimra1692005.github.io`
7. Deploy!

### Mobile App
```bash
cd relieflink/mobile
npm install
npx expo start
```

---

## Data Sources (All Free)

| Source | Data | Cost |
|---|---|---|
| **OpenStreetMap** (Overpass API) | Hospitals, shelters, pharmacies, roads | Free |
| **Nominatim** | Reverse geocoding, address search | Free |
| **OpenWeatherMap** | Weather forecasts, rainfall data | Free tier (1000 calls/day) |
| **OSRM** | Route planning, turn-by-turn directions | Free |
| **USGS** | Real-time earthquake data | Free |
| **GDACS** | Global disaster alerts | Free |
| **Groq AI** | AI chat assistant (gpt-oss-20b) | Free tier |
| **FFD/WAPDA** | River flood thresholds (Pakistan) | Public data |
| **PMD** | Pakistan weather patterns | Public data |

---

## AI Flood Predictor

Our logistic regression model computes flood probability from **live 5-day rainfall forecasts**:

```
Features: cumulative rain (5d), peak 24h rain, humidity, monsoon factor
Model: z = w₀ + w₁·rain₅d + w₂·rain₂₄h + w₃·humidity + w₄·monsoon
Output: P(flood) = 1/(1+e⁻ᶻ) → Low/Medium/High/Critical
```

Weights calibrated on documented Pakistan flood thresholds (FFD/PMD: 150mm+ cumulative = high alert).

---

## License

MIT — built for hackathon / educational purposes.
