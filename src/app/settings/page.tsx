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
          For most visitors there is nothing to set here. The bearer token
          and backend URL fields below only apply if you are running your
          own ghostloop backend with auth turned on.
        </p>
      </header>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            Bearer token (optional)
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Only needed if your backend has{" "}
            <code>GHOSTLOOP_DASHBOARD_TOKEN</code> set. The public demo
            leaves auth open, so most visitors can ignore this.
          </p>
        </div>
        <label className="block text-sm">
          <span className="block text-[var(--color-text-muted)] mb-1">
            Token
          </span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="paste your bearer token, or leave blank"
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
              {saved === "saved" ? "saved" : "cleared"}
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
          On Vercel: Project Settings, then Environment Variables, then Add. Then redeploy.
        </p>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Deploy the backend
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          The backend is a 30-line FastAPI server wrapping{" "}
          <code>ghostloop.dashboard.create_production_app</code>. Run it
          anywhere with a public HTTPS URL (Railway, Fly, Render, your own
          VPS), then paste the URL into your Vercel env vars.
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          A ready-to-deploy version lives in this repo at{" "}
          <code>backend/</code>. On Railway:
        </p>
        <ol className="text-sm text-[var(--color-text-muted)] list-decimal list-inside space-y-1.5 mb-3">
          <li>New Project, then Deploy from GitHub repo, then <code>joemunene-by/ghostloop-ui</code></li>
          <li>
            <strong className="text-[var(--color-text)]">
              Settings, then Root Directory:
            </strong>{" "}
            <code>backend</code>{" "}
            <span className="text-[var(--color-warn)]">
              (this is the key step. Default (repo root) tries to build the
              Next.js app and fails.)
            </span>
          </li>
          <li>
            Variables, then <code>GHOSTLOOP_DASHBOARD_TOKEN</code> (random string)
            and <code>CORS_ORIGINS</code> (your Vercel URL)
          </li>
          <li>Deploy, then Settings, then Networking, then Generate Domain</li>
        </ol>
        <p className="text-sm text-[var(--color-text-muted)] mb-3">
          Full guide at{" "}
          <a
            className="text-[var(--color-primary)] hover:underline"
            href="https://github.com/joemunene-by/ghostloop-ui/blob/main/backend/README.md"
            target="_blank"
            rel="noreferrer"
          >
            backend/README.md
          </a>
          . Or roll your own:
        </p>
        <pre className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 text-xs overflow-x-auto">
{`# backend/server.py: ~10 lines of glue
from ghostloop import GhostloopStore
from ghostloop.fleet import FleetRegistry
from ghostloop.dashboard import (
    create_production_app, ProductionConfig, StaticTokenAuth,
)

app, alarms = create_production_app(
    store=GhostloopStore("./ghostloop.db"),
    fleet=FleetRegistry(),
    config=ProductionConfig(
        auth=StaticTokenAuth.from_env(),
        cors_origins=["https://your-ui.vercel.app"],
    ),
)

# requirements.txt: ghostloop[dashboard]>=1.0.3
# run:              uvicorn server:app --host 0.0.0.0 --port $PORT`}
        </pre>
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          Set <code>GHOSTLOOP_DASHBOARD_TOKEN</code> on the server side and
          paste the same value into the Bearer token field above.
        </p>
      </div>
    </div>
  )
}
