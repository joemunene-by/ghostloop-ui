"use client"

import { useEffect, useState } from "react"
import {
  Activity,
  AlertTriangle,
  Bot,
  CircleCheck,
  CircleX,
  History,
  Loader2,
} from "lucide-react"
import { backend, type FleetSnapshot, type Alarm, type StoreStats } from "@/lib/backend"
import { StatCard } from "@/components/stat-card"

export default function OverviewPage() {
  const [fleet, setFleet] = useState<FleetSnapshot | null>(null)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [reachable, setReachable] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        await backend.health()
        if (cancelled) return
        setReachable(true)
        const [f, a, s] = await Promise.all([
          backend.fleet().catch(() => null),
          backend.listAlarms(false, 50).catch(() => ({ alarms: [], n: 0 })),
          backend.storeStats().catch(() => null),
        ])
        if (cancelled) return
        setFleet(f)
        setAlarms(a.alarms)
        setStats(s)
      } catch {
        if (!cancelled) setReachable(false)
      }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (reachable === null) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Connecting to backend…
      </div>
    )
  }

  if (reachable === false) {
    return <BackendUnreachable />
  }

  return (
    <div className="max-w-6xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold mb-2">Overview</h1>
        <p className="text-[var(--color-text-muted)]">
          Live status from the ghostloop production-dashboard backend.
          Refreshes every 5 seconds.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Robots"
          value={fleet?.n_total ?? 0}
          hint={fleet ? `${fleet.n_idle} idle · ${fleet.n_busy} busy` : "fleet not attached"}
          icon={Bot}
        />
        <StatCard
          label="Offline / errored"
          value={fleet ? fleet.n_offline + fleet.n_error : 0}
          hint={fleet ? `${fleet.n_offline} offline · ${fleet.n_error} error` : "-"}
          icon={CircleX}
          tone={fleet && fleet.n_offline + fleet.n_error > 0 ? "error" : "default"}
        />
        <StatCard
          label="Active alarms"
          value={alarms.length}
          hint={alarms.length === 0 ? "none, clear" : "ack on the Alarms page"}
          icon={AlertTriangle}
          tone={alarms.length > 0 ? "warn" : "ok"}
        />
        <StatCard
          label="Episodes recorded"
          value={stats?.n_episodes ?? "-"}
          hint={stats ? `${stats.n_runs} runs · ${stats.n_comparisons} comparisons` : "store empty"}
          icon={History}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--color-primary)]" />
            Fleet status
          </h2>
          {fleet?.robots.length ? (
            <table className="w-full text-sm">
              <thead className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Backend</th>
                </tr>
              </thead>
              <tbody>
                {fleet.robots.map((r) => (
                  <tr key={r.name} className="border-t border-[var(--color-border)]">
                    <td className="py-2 font-mono">{r.name}</td>
                    <td className="py-2"><StatusPill status={r.status} /></td>
                    <td className="py-2 text-[var(--color-text-muted)] font-mono text-xs">
                      {r.backend ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-[var(--color-text-muted)]">
              No fleet attached. Construct your <code>create_production_app</code> with a{" "}
              <code>FleetRegistry</code> populated to see robots here.
            </p>
          )}
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[var(--color-warn)]" />
            Active alarms
          </h2>
          {alarms.length === 0 ? (
            <div className="text-sm text-[var(--color-text-muted)] flex items-center gap-2">
              <CircleCheck className="w-4 h-4 text-[var(--color-ok)]" />
              All clear.
            </div>
          ) : (
            <ul className="space-y-2 text-sm">
              {alarms.slice(0, 6).map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 p-2 rounded-lg border border-[var(--color-border)]"
                >
                  <SeverityDot severity={a.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{a.kind}{a.robot ? `: ${a.robot}` : ""}</p>
                    <p className="text-[var(--color-text-muted)] text-xs">{a.message}</p>
                  </div>
                  <button
                    className="text-xs text-[var(--color-primary)] hover:underline"
                    onClick={() => backend.ackAlarm(a.id, "operator")}
                  >
                    ack
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function BackendUnreachable() {
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold">Backend not reachable</h1>
      <p className="text-[var(--color-text-muted)]">
        The Next.js app couldn&apos;t talk to your ghostloop production
        dashboard. Set <code>GHOSTLOOP_BACKEND_URL</code> in your env and
        restart.
      </p>
      <pre className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4 text-sm overflow-x-auto">
{`# in your ghostloop project:
from ghostloop import GhostloopStore
from ghostloop.fleet import FleetRegistry
from ghostloop.dashboard import create_production_app, ProductionConfig

store = GhostloopStore("./ghostloop.db")
fleet = FleetRegistry()  # register your RobotHandle instances
app, alarms = create_production_app(store=store, fleet=fleet)

# uvicorn server:app --host 0.0.0.0 --port 8000
`}
      </pre>
      <p className="text-sm text-[var(--color-text-muted)]">
        Then start this UI with{" "}
        <code>GHOSTLOOP_BACKEND_URL=http://localhost:8000 npm run dev</code>.
      </p>
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    idle: "bg-[var(--color-ok)]/10 text-[var(--color-ok)] border-[var(--color-ok)]/30",
    busy: "bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/30",
    offline: "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border-[var(--color-text-muted)]/30",
    error: "bg-[var(--color-error)]/10 text-[var(--color-error)] border-[var(--color-error)]/30",
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${tone[status] || tone.offline}`}>
      {status}
    </span>
  )
}

function SeverityDot({ severity }: { severity: string }) {
  const tone: Record<string, string> = {
    info: "bg-[var(--color-primary)]",
    warn: "bg-[var(--color-warn)]",
    error: "bg-[var(--color-error)]",
  }
  return <span className={`w-2 h-2 rounded-full mt-1.5 ${tone[severity] || tone.info}`} />
}
