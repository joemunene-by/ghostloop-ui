"use client"

import { useEffect, useState } from "react"
import { Chapter, CodeBlock, PageHeader } from "@/components/ui"

const TOKEN_KEY = "ghostloop_token"

export default function SettingsPage() {
  const [token, setToken] = useState("")
  const [saved, setSaved] = useState<"saved" | "cleared" | "failed" | null>(null)

  useEffect(() => {
    try {
      setToken(window.localStorage.getItem(TOKEN_KEY) || "")
    } catch {}
  }, [])

  function flash(state: "saved" | "cleared" | "failed") {
    setSaved(state)
    setTimeout(() => setSaved(null), 2000)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    try {
      window.localStorage.setItem(TOKEN_KEY, token)
      flash("saved")
    } catch {
      flash("failed")
    }
  }

  function clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY)
      setToken("")
      flash("cleared")
    } catch {
      flash("failed")
    }
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      <PageHeader
        title="Settings"
        description="Most visitors have nothing to set here. These only apply if you run your own ghostloop backend with auth turned on."
      />

      <Chapter title="Bearer token" note="Optional">
        <p className="text-body text-ink-2 prose-muted">
          Only needed if your backend has <code>GHOSTLOOP_DASHBOARD_TOKEN</code> set. The public
          demo leaves auth open.
        </p>
        <form onSubmit={save} className="mt-4">
          <label htmlFor="token" className="text-small font-medium text-ink">
            Token
          </label>
          <input
            id="token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Leave blank if auth is off"
            className="input mt-2 font-mono"
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="submit" className="btn btn-primary">
              Save token
            </button>
            <button type="button" onClick={clear} className="btn btn-secondary">
              Clear
            </button>
            <span role="status" className="ml-2 text-small text-ink-2">
              {saved === "saved" && "Saved"}
              {saved === "cleared" && "Cleared"}
              {saved === "failed" && "Your browser blocked local storage, so the token wasn't stored."}
            </span>
          </div>
        </form>
        <p className="mt-4 text-small text-ink-3 prose-muted">
          Stored in <code>localStorage</code> and only sent to your configured backend. Match it to{" "}
          <code>StaticTokenAuth.from_env()</code> on the backend side.
        </p>
      </Chapter>

      <Chapter title="Backend URL">
        <p className="text-body text-ink-2 prose-muted">
          Set <code>GHOSTLOOP_BACKEND_URL</code> to a deployed ghostloop FastAPI server. When it&apos;s unset,
          this UI serves demo fixtures so the Vercel deploy stays interactive without a backend.
        </p>
        <CodeBlock className="mt-3" code="GHOSTLOOP_BACKEND_URL=https://your-server.example.com" />
        <p className="mt-2 text-small text-ink-3">
          On Vercel: Project Settings, then Environment Variables, then Add. Then redeploy.
        </p>
      </Chapter>

      <Chapter title="Deploy the backend">
        <p className="text-body text-ink-2 prose-muted">
          The backend is a 30-line FastAPI server wrapping{" "}
          <code>ghostloop.dashboard.create_production_app</code>. Run it anywhere with a public HTTPS URL
          (Railway, Fly, Render, your own VPS), then paste the URL into your Vercel env vars. A
          ready-to-deploy version lives in this repo at <code>backend/</code>. On Railway:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-body text-ink-2 marker:text-ink-3 prose-muted">
          <li>
            New Project, then Deploy from GitHub repo, then <code>joemunene-by/ghostloop-ui</code>.
          </li>
          <li>
            <span className="font-semibold text-ink">Settings, then Root Directory: </span>
            <code>backend</code>.{" "}
            <span className="font-semibold text-ink">
              This is the key step. The default (repo root) tries to build the Next.js app and fails.
            </span>
          </li>
          <li>
            Variables, then <code>GHOSTLOOP_DASHBOARD_TOKEN</code> (a random string) and{" "}
            <code>CORS_ORIGINS</code> (your Vercel URL).
          </li>
          <li>Deploy, then Settings, then Networking, then Generate Domain.</li>
        </ol>
        <p className="mt-4 text-body text-ink-2">
          Full guide in{" "}
          <a
            className="link"
            href="https://github.com/joemunene-by/ghostloop-ui/blob/main/backend/README.md"
            target="_blank"
            rel="noreferrer"
          >
            backend/README.md
          </a>
          . Or roll your own:
        </p>
        <CodeBlock
          className="mt-3"
          code={`# backend/server.py: 10 lines of glue
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
        />
        <p className="mt-3 text-small text-ink-3 prose-muted">
          Set <code>GHOSTLOOP_DASHBOARD_TOKEN</code> on the server and paste the same value into the
          Bearer token field above.
        </p>
      </Chapter>
    </div>
  )
}
