# ReliefLink — Disaster Response Platform (Pakistan)

> **Help requests, volunteer coordination, shelters & hospitals, admin command centre, and live disaster alerts — one deploy, zero cards.**

[![Live Site](https://img.shields.io/badge/Live-ReliefLink-blue?logo=vercel)](https://relieflink-neon.vercel.app)

---

## Architecture

```
Browser (static HTML)  →  Vercel Serverless Function  →  Supabase (PostgREST)
index.html + dashboards     api/dispatch.js                Postgres tables
```

- **Frontend** — plain HTML/CSS/JS (no build step). The root `index.html` is the citizen/volunteer entry; `dashboards/` holds the three role dashboards.
- **Backend** — a single Vercel serverless function, `api/dispatch.js`. Every `/api/v1/*` request is rewritten to it (see `vercel.json`); it talks to Supabase over the REST API with **zero external dependencies**.
- **Same-origin API** — `config.js` uses the relative `/api/v1` path on the deployed site, so there are no CORS issues at all.

---

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Landing + help request submission, volunteer signup, admin sign-in |
| `dashboards/help.html` | Citizen help tracker — submit requests, view nearby shelters/hospitals |
| `dashboards/volunteer.html` | Task marketplace — browse/claim tasks, log progress, live admin alerts as notifications |
| `dashboards/admin.html` | Command centre — live stats, real charts, volunteer verification, alert broadcast, disaster map (Leaflet) |

`dashboards/shared.css` / `shared.js` / `live.js` are the shared design system + helpers.

---

## API Endpoints (all served by `api/dispatch.js`)

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/help-requests` | Create a help request (with GPS) |
| GET | `/api/v1/help-requests` | List requests (`?user_id=`, `?limit=`) |
| POST | `/api/v1/auth/register-role` | Register citizen / volunteer |
| POST | `/api/v1/auth/admin-signin` | Admin sign-in (env credentials, demo fallback) |
| GET | `/api/v1/tasks` | Open volunteer tasks |
| GET | `/api/v1/tasks/my-assignments` | Tasks claimed by a volunteer |
| GET | `/api/v1/tasks/volunteer-stats` | Completed tasks + hours for a volunteer |
| POST | `/api/v1/tasks/:id/claim` | Claim a task |
| PATCH | `/api/v1/tasks/:id/progress` | Log task progress / completion |
| GET | `/api/v1/analytics/admin-overview` | Real admin stats: counts, 12-month volunteer growth, monthly hours, top volunteers, skill/availability distributions, active alerts |
| GET | `/api/v1/alerts` | List alerts (`?active=true`) |
| POST | `/api/v1/alerts` | Broadcast a new alert (appears in volunteer notifications + admin map) |
| GET | `/api/v1/volunteers` | Volunteer roster |
| POST | `/api/v1/volunteers/:id/verify` | Approve/verify a volunteer |
| GET | `/api/v1/shelters` | Shelters |
| GET | `/api/v1/hospitals` | Hospitals with free-bed counts |

Every response is `{ success, data, message }`. If a dashboard can't reach the API it keeps rendering its sample data — the UI never goes blank.

---

## Database

Supabase Postgres, schema in [`db/migrations/`](db/migrations) (run in Supabase SQL Editor):

- `001_initial_schema.sql` — users, volunteers, alerts, shelters, rescue teams, risk zones…
- `002_role_platform_tables.sql` — help_requests, volunteer_tasks
- `002_help_tasks.sql`, `supabase_setup.sql` — task seeding + RLS/service-key setup notes

---

## Deploy (free tier, no credit card)

1. Create a Supabase project → run `db/migrations/*.sql` in the SQL Editor.
2. `npm i -g vercel` → `cd relifelife` → `vercel` (framework: None, no build — `vercel.json` is ready).
3. Project Settings → Environment Variables:
   - `SUPABASE_URL` — project URL
   - `SUPABASE_SERVICE_KEY` — service-role key
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` — admin login credentials
4. `vercel --prod`

## Run locally

```bash
cd relifelife
npx serve .          # any static server; index.html + dashboards work as-is
```
`config.js` automatically points localhost requests at the deployed API, so local previews stay live without running a backend.

---

## Data Sources (all free)

OpenStreetMap + Overpass (places), Nominatim (addresses), Leaflet/CARTO (maps), OSRM (routing), USGS (earthquakes), GDACS (global disasters), OpenWeatherMap (weather).

---

## Legacy

The old Python FastAPI backend, React admin app, and single-file `preview.html` SPA are archived outside this repository (`archive/`) — the Vercel function + HTML dashboards fully replaced them.

## License

MIT — built for hackathon / educational purposes.
