"use client"

import { useEffect, useState } from "react"
import { Settings2 } from "lucide-react"

export default function SettingsPage() {
  const [token, setToken] = useState("")
  const [saved, setSaved] = useState<"saved" | "cleared" | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(window.localStorage.getItem("ghostloop_token") || "")
    }
  }, [])

  function save() {
    window.localStorage.setItem("ghostloop_token", token)
    setSaved("saved")
    setTimeout(() => setSaved(null), 2000)
  }

  function clear() {
    window.localStorage.removeItem("ghostloop_token")
    setToken("")
    setSaved("cleared")
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold mb-1 flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-[var(--color-primary)]" />
          Settings
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Bearer token used to authenticate every request to the
          <code className="mx-1">create_production_app</code> backend.
        </p>
      </header>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 space-y-3">
        <label className="block text-sm">
          <span className="block text-[var(--color-text-muted)] mb-1">
            GHOSTLOOP_DASHBOARD_TOKEN
          </span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="paste your bearer token"
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 font-mono text-sm focus:outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <div className="flex gap-2">
          <button
            onClick={save}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-black font-medium text-sm hover:opacity-90"
          >
            Save
          </button>
          <button
            onClick={clear}
            className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
          >
            Clear
          </button>
          {saved && (
            <span className="self-center text-sm text-[var(--color-ok)]">
              {saved === "saved" ? "✓ saved" : "✓ cleared"}
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          Stored in <code>localStorage</code>, never sent to any server but
          your configured backend. Match this to{" "}
          <code>StaticTokenAuth.from_env()</code> on the backend side.
        </p>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Backend URL
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">
          Set <code>GHOSTLOOP_BACKEND_URL</code> to a deployed ghostloop FastAPI server.
          When unset, this UI shows demo fixtures so the Vercel deploy stays
          interactive without a backend.
        </p>
        <pre className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 text-xs">
GHOSTLOOP_BACKEND_URL=https://your-server.example.com
        </pre>
        <p className="text-xs text-[var(--color-text-muted)] mt-2">
          On Vercel: Project Settings → Environment Variables → Add. Then redeploy.
        </p>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Deploy the backend
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          The backend is a 30-line FastAPI server wrapping{" "}
          <code>ghostloop.dashboard.create_production_app</code>. Run it
          anywhere with a public HTTPS URL — Railway, Fly, Render, your own
          VPS — then paste the URL into your Vercel env vars.
        </p>
        <pre className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 text-xs overflow-x-auto">
{`# server.py
from ghostloop import GhostloopStore
from ghostloop.fleet import FleetRegistry
from ghostloop.dashboard import (
    create_production_app, ProductionConfig, StaticTokenAuth,
)

store = GhostloopStore("./ghostloop.db")
fleet = FleetRegistry()  # register your RobotHandle instances here

app, alarms = create_production_app(
    store=store, fleet=fleet,
    config=ProductionConfig(
        auth=StaticTokenAuth.from_env(),
        cors_origins=["https://your-ui.vercel.app"],
        rate_limit_rps=120,
    ),
)

# requirements.txt: ghostloop[dashboard]
# run:              uvicorn server:app --host 0.0.0.0 --port $PORT`}
        </pre>
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          Cheapest path: Railway free tier or Fly.io. Both expose HTTPS out of
          the box. Don&apos;t bind to <code>0.0.0.0</code> without auth — set
          <code className="mx-1">GHOSTLOOP_DASHBOARD_TOKEN</code> on the server
          and paste the same value into the Bearer token field above.
        </p>
      </div>
    </div>
  )
}
