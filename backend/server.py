"""ghostloop production dashboard — deployable FastAPI server.

This is what Railway / Fly / Render runs. The Next.js UI in this repo
(deployed separately to Vercel) talks to this server's HTTPS URL.

Configuration (env vars):

  GHOSTLOOP_DB                   path to the SQLite store
                                 (default: ./ghostloop.db, but on
                                  Railway the filesystem is ephemeral
                                  — point at a persistent volume if
                                  you need durability)
  GHOSTLOOP_DASHBOARD_TOKEN      bearer token clients must send. Set
                                 it on Railway; paste the same value
                                 into the UI's Settings page.
                                 Unset = open (NOT recommended for any
                                 non-loopback deployment).
  CORS_ORIGINS                   comma-separated list of UI origins
                                 allowed to call the API. e.g.
                                 https://ghostloop-ui.vercel.app,
                                 http://localhost:3000

Run:

  uvicorn server:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import os

from ghostloop import GhostloopStore
from ghostloop.dashboard import (
    ProductionConfig,
    StaticTokenAuth,
    create_production_app,
)
from ghostloop.fleet import FleetRegistry


def _origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS", "")
    return [o.strip() for o in raw.split(",") if o.strip()]


db_path = os.environ.get("GHOSTLOOP_DB", "./ghostloop.db")
store = GhostloopStore(db_path)

# An empty fleet is fine — your runtime registers RobotHandle instances
# at runtime via `fleet.register(handle)`. For a public demo you can
# pre-register a couple of MockBackend-backed handles here.
fleet = FleetRegistry()

config = ProductionConfig(
    title="ghostloop dashboard",
    auth=StaticTokenAuth.from_env(),  # reads GHOSTLOOP_DASHBOARD_TOKEN
    cors_origins=_origins(),
    rate_limit_rps=int(os.environ.get("RATE_LIMIT_RPS", "120")),
    rate_limit_window_s=float(os.environ.get("RATE_LIMIT_WINDOW_S", "60")),
)

app, alarms = create_production_app(store=store, fleet=fleet, config=config)
