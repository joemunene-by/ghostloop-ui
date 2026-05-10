# ghostloop-ui — backend

This directory is the **FastAPI server** the ghostloop-ui frontend talks to. Deploy it separately (Railway / Fly / Render / your own host); deploy the Next.js part to Vercel.

## What's in here

- `server.py` — 30 lines of glue that mount `ghostloop.dashboard.create_production_app` with bearer-token auth, CORS, rate limit.
- `requirements.txt` — `ghostloop[dashboard]>=1.0.3`.
- `railway.json` — explicit Railway build/deploy/healthcheck config so Railpack doesn't have to guess.
- `Procfile` — Heroku-compat alternative for platforms that prefer it.

## Deploy to Railway (5 minutes)

1. Sign in at https://railway.com.
2. **New Project → Deploy from GitHub repo → joemunene-by/ghostloop-ui**.
3. After the service is created, open **Settings → Service**:
   - **Root Directory:** `backend` ← _this is the key step. Without it Railway tries to build the whole repo and fails because the root is a Next.js project_.
4. **Variables → Add:**
   - `GHOSTLOOP_DASHBOARD_TOKEN` = (paste a long random string; you'll paste the same string in the UI's Settings page)
   - `CORS_ORIGINS` = `https://your-ui.vercel.app,http://localhost:3000`
5. Click **Deploy**. Railway runs `pip install -r requirements.txt` then `uvicorn server:app --host 0.0.0.0 --port $PORT`. Healthcheck on `/livez`.
6. Once green, **Settings → Networking → Generate Domain** to get an HTTPS URL like `ghostloop-backend.up.railway.app`.

## Wire the UI to this backend

In Vercel → ghostloop-ui project → **Settings → Environment Variables**:

- `GHOSTLOOP_BACKEND_URL` = `https://ghostloop-backend.up.railway.app` (or your real Railway URL)

Redeploy the UI. The demo banner disappears; live data flows from the Railway-hosted backend.

## Deploy to Fly.io

Add a `backend/fly.toml` to taste, then:

```bash
cd backend
fly launch --copy-config --name ghostloop-backend
fly secrets set GHOSTLOOP_DASHBOARD_TOKEN=...
fly deploy
```

## Deploy to Render

New Web Service → connect this repo → set root directory to `backend` → build command `pip install -r requirements.txt` → start command `uvicorn server:app --host 0.0.0.0 --port $PORT`.

## Health endpoints

The backend exposes:

- `GET /livez` — process alive
- `GET /readyz` — process + fleet ready (returns false if any robot is OFFLINE)
- `GET /healthz` — combined health summary

Wire the platform's healthcheck to `/livez` so a brief fleet outage doesn't restart the server.

## Persistent storage

The SQLite store at `GHOSTLOOP_DB` (default `./ghostloop.db`) lives on the platform's local filesystem. On Railway / Fly / Render that filesystem is **ephemeral** — restarts wipe it.

If you want durable episodes / runs / comparisons across restarts:

- **Railway:** add a **Volume** mounted at `/data`, set `GHOSTLOOP_DB=/data/ghostloop.db`.
- **Fly:** `fly volumes create ghostloop_data --size 1`, mount at `/data`, same env var.
- **Render:** add a **Disk** at `/data`, same env var.

For a public demo where you don't care about durability, the default works fine — restarts give you a clean slate.

## Auth + CORS

`GHOSTLOOP_DASHBOARD_TOKEN` is the only required-for-non-loopback secret. Without it, the API is open and any origin in `CORS_ORIGINS` can read/ack alarms.

For production:

1. Set `GHOSTLOOP_DASHBOARD_TOKEN` to a long random string on the backend.
2. Paste the same string into the UI's Settings page (it's stored in `localStorage`, attached to every request as `Authorization: Bearer <token>`).
3. List **only** the UI's actual origin in `CORS_ORIGINS` — not `*`.

## Troubleshooting

- **Build error `Railpack could not determine how to build the app`** → Root Directory is wrong. It must be `backend` (not the repo root, not `src/app/api/backend`, not anything else).
- **`401 unauthorized` from the UI** → The UI's bearer token doesn't match `GHOSTLOOP_DASHBOARD_TOKEN`. Re-paste both ends.
- **`CORS error` in browser devtools** → Add the UI's exact origin to `CORS_ORIGINS`. Includes the protocol (`https://`).
- **`502` from `/api/backend/...` on the UI** → `GHOSTLOOP_BACKEND_URL` is wrong or the backend is down. Hit `https://<backend>/livez` directly in a browser — if that fails, the problem is the backend service, not the UI.
