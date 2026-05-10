# ghostloop-ui

Web dashboard for [ghostloop](https://github.com/joemunene-by/ghostloop) — fleet view, mission control, trace timeline, alarm tray. Talks to a `ghostloop.dashboard.create_production_app` backend over HTTP/WebSocket.

[![ghostloop](https://img.shields.io/pypi/v/ghostloop?label=ghostloop&color=14B8A6)](https://pypi.org/project/ghostloop/)

## What's in here

| Route | Purpose |
|---|---|
| `/` | Overview — fleet status, active alarms, episode count |
| `/fleet` | Fleet — one card per robot, click to drill into details |
| `/missions` | Missions — submit Mission DAGs to the runtime (visual builder coming) |
| `/traces` | Traces — episode list from `GhostloopStore` |
| `/alarms` | Alarms — active + acked, with one-click acknowledge |
| `/metrics` | Metrics — Prometheus counters from `/metrics` |
| `/settings` | Settings — bearer token for `StaticTokenAuth` |

## Stack

- **Next.js 15** (App Router + Turbopack)
- **React 19** + **Tailwind CSS 4**
- **lucide-react** icons, **framer-motion** animations
- **zustand** state, **clsx**/**tailwind-merge** classname utilities
- TypeScript strict, ESLint + Next config

## Setup

```bash
git clone https://github.com/joemunene-by/ghostloop-ui
cd ghostloop-ui
npm install
```

You need a running ghostloop production-dashboard backend. Easiest path:

```python
# server.py (in any project that has ghostloop installed)
from ghostloop import GhostloopStore
from ghostloop.fleet import FleetRegistry
from ghostloop.dashboard import create_production_app

store = GhostloopStore("./ghostloop.db")
fleet = FleetRegistry()
app, alarms = create_production_app(store=store, fleet=fleet)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

```bash
# Then start the UI:
GHOSTLOOP_BACKEND_URL=http://localhost:8000 npm run dev
```

Open http://localhost:3000.

## Auth

If your backend is wrapped with `StaticTokenAuth` (recommended for any non-loopback bind), paste the token into the **Settings** page. It's stored in `localStorage` and attached to every request as a `Bearer` header. Match it to the `GHOSTLOOP_DASHBOARD_TOKEN` env var on the backend side.

## Deploying

Vercel works out of the box (App Router + Turbopack). Set:

- `GHOSTLOOP_BACKEND_URL` — your backend's public URL (must be HTTPS in production).

Or self-host:

```bash
npm run build
GHOSTLOOP_BACKEND_URL=https://api.your-fleet.com npm start
```

## Roadmap

- **v0.2** — visual mission builder (drag-and-drop DAG)
- **v0.3** — embedded MuJoCo viewer in the robot detail page (WebGL)
- **v0.4** — live trace timeline (WebSocket subscription to `/ws/v1/stream`)
- **v0.5** — counterfactual replay viewer (drop a recorded trace + run it through a different policy)

## License

MIT — see [LICENSE](LICENSE).

## See also

- **[ghostloop](https://github.com/joemunene-by/ghostloop)** — the runtime + library
- **[Live demo on HuggingFace](https://huggingface.co/spaces/Ghostgim/ghostloop-demo)** — Gradio control panel for the same backend
- **[GhostLM](https://github.com/joemunene-by/GhostLM)** — sibling project, the cybersecurity language model whose GhostAgent shape ghostloop borrows
