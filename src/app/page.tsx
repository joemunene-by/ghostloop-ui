"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { clsx } from "clsx"
import { backend, type Alarm, type FleetSnapshot, type StoreStats } from "@/lib/backend"
import {
  CodeBlock,
  PageHeader,
  Panel,
  RobotStatus,
  Severity,
  SkeletonRows,
  UpdatedAt,
  severityCounts,
  timeAgo,
  useNow,
} from "@/components/ui"

const HF_DEMO_URL = "https://huggingface.co/spaces/Ghostgim/ghostloop-demo"

export default function OverviewPage() {
  const [fleet, setFleet] = useState<FleetSnapshot | null>(null)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [reachable, setReachable] = useState<boolean | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const [acking, setAcking] = useState<Set<string>>(new Set())
  const now = useNow()

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
        setUpdatedAt(Date.now())
      } catch {
        if (!cancelled) setReachable(false)
      }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  async function ack(id: string) {
    setAcking((s) => new Set(s).add(id))
    try {
      await backend.ackAlarm(id, "operator")
      setAlarms((list) => list.filter((a) => a.id !== id))
    } catch {
      // the next poll shows the alarm again if the ack did not land
    } finally {
      setAcking((s) => {
        const next = new Set(s)
        next.delete(id)
        return next
      })
    }
  }

  if (reachable === false) return <BackendUnreachable />

  const loading = reachable === null
  const emptyFleet = !loading && (!fleet || fleet.n_total === 0)
  const down = fleet ? fleet.n_offline + fleet.n_error : 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        description="Fleet health, open alarms and recorded episodes from the ghostloop backend. Refreshes every 5 seconds."
        aside={<UpdatedAt at={updatedAt} />}
      />

      {emptyFleet && <GetStarted />}

      <section
        aria-label="Key figures"
        className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4"
      >
        <Figure
          label="Robots"
          value={fleet?.n_total ?? 0}
          context={fleet ? `${fleet.n_idle} idle · ${fleet.n_busy} busy` : "No fleet attached"}
          loading={loading}
        />
        <Figure
          label="Offline or errored"
          value={down}
          context={fleet ? `${fleet.n_offline} offline · ${fleet.n_error} error` : "No fleet attached"}
          critical={down > 0}
          loading={loading}
        />
        <Figure
          label="Open alarms"
          value={alarms.length}
          context={alarms.length ? severityCounts(alarms) : "None open"}
          critical={alarms.some((a) => a.severity === "error")}
          loading={loading}
        />
        <Figure
          label="Episodes recorded"
          value={stats?.n_episodes ?? "-"}
          context={stats ? `${stats.n_runs} runs · ${stats.n_comparisons} comparisons` : "Store empty"}
          loading={loading}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel
          className="lg:col-span-7"
          title="Open alarms"
          aside={
            <Link href="/alarms" className="text-small text-fg-muted hover:text-fg">
              View all
            </Link>
          }
          flush
        >
          {loading ? (
            <SkeletonRows rows={3} className="p-4" />
          ) : alarms.length === 0 ? (
            <div className="px-4 py-8">
              <p className="font-medium">No open alarms</p>
              <p className="mt-1 text-small text-fg-muted">
                Safety-gate denials and property violations show up here when they happen.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {alarms.slice(0, 6).map((a) => (
                <li key={a.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Severity severity={a.severity} />
                      <span className="font-mono text-small text-fg">{a.kind}</span>
                      {a.robot && <span className="font-mono text-small text-fg-muted">{a.robot}</span>}
                      <span className="text-small text-fg-faint tnum" title={new Date(a.raised_at * 1000).toLocaleString()}>
                        {timeAgo(a.raised_at, now)}
                      </span>
                    </div>
                    <p className="mt-1 text-small text-fg-muted">{a.message}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm self-start"
                    disabled={acking.has(a.id)}
                    onClick={() => ack(a.id)}
                  >
                    {acking.has(a.id) ? "Acknowledging" : "Acknowledge"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          className="lg:col-span-5"
          title="Fleet"
          aside={
            <Link href="/fleet" className="text-small text-fg-muted hover:text-fg">
              View fleet
            </Link>
          }
          flush
        >
          {loading ? (
            <SkeletonRows rows={3} className="p-4" />
          ) : fleet?.robots.length ? (
            <table className="w-full text-small">
              <thead>
                <tr className="text-left">
                  <th className="label px-4 pb-2 pt-3 font-semibold">Robot</th>
                  <th className="label px-4 pb-2 pt-3 font-semibold">Status</th>
                  <th className="label hidden px-4 pb-2 pt-3 font-semibold sm:table-cell">Backend</th>
                </tr>
              </thead>
              <tbody>
                {fleet.robots.map((r) => (
                  <tr key={r.name} className="border-t border-line">
                    <td className="h-11 whitespace-nowrap px-4 font-mono text-fg">{r.name}</td>
                    <td className="h-11 px-4"><RobotStatus status={r.status} /></td>
                    <td className="hidden h-11 px-4 font-mono text-fg-faint sm:table-cell">{r.backend ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-8 text-small text-fg-muted prose-muted">
              No fleet attached. Build <code>create_production_app</code> with a populated{" "}
              <code>FleetRegistry</code> to see robots here.
            </p>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Figure({
  label,
  value,
  context,
  critical = false,
  loading = false,
}: {
  label: string
  value: string | number
  context: string
  critical?: boolean
  loading?: boolean
}) {
  return (
    <div className="min-w-0 bg-surface p-4 sm:p-6">
      <p className="label">{label}</p>
      {loading ? (
        <>
          <div className="skeleton mt-2 h-8 w-12" />
          <div className="skeleton mt-2 h-4 w-24" />
        </>
      ) : (
        <>
          <p className={clsx("mt-2 text-display font-semibold tnum", critical && "text-critical")}>{value}</p>
          <p className="mt-1 truncate text-small text-fg-muted">{context}</p>
        </>
      )}
    </div>
  )
}

function GetStarted() {
  return (
    <section className="panel p-6 sm:p-8">
      <h2 className="text-heading font-semibold">No robots connected yet</h2>
      <p className="mt-2 max-w-[64ch] text-body text-fg-muted">
        ghostloop sends every robot command through five safety gates (geofence, force cap,
        action smoothing, rate limit, human approval) before it reaches the hardware, and records
        traces, alarms and metrics as it goes. Arms, quadrupeds, drones, mobile bases and humanoids
        are supported. Nothing to code to try it.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/connect" className="btn btn-primary">
          Connect a robot
        </Link>
        <a href={HF_DEMO_URL} target="_blank" rel="noreferrer" className="btn btn-secondary">
          Try the live demo
          <ArrowUpRight className="h-4 w-4 text-fg-faint" strokeWidth={1.75} />
        </a>
      </div>
    </section>
  )
}

function BackendUnreachable() {
  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Backend not reachable"
        description="This dashboard couldn't reach your ghostloop backend. Set GHOSTLOOP_BACKEND_URL in the environment and restart. The page retries every 5 seconds."
      />
      <div className="space-y-2">
        <p className="label">In your ghostloop project</p>
        <CodeBlock
          code={`from ghostloop import GhostloopStore
from ghostloop.fleet import FleetRegistry
from ghostloop.dashboard import create_production_app, ProductionConfig

store = GhostloopStore("./ghostloop.db")
fleet = FleetRegistry()  # register your RobotHandle instances
app, alarms = create_production_app(store=store, fleet=fleet)

# uvicorn server:app --host 0.0.0.0 --port 8000`}
        />
      </div>
      <div className="space-y-2">
        <p className="label">Then start this UI</p>
        <CodeBlock code="GHOSTLOOP_BACKEND_URL=http://localhost:8000 npm run dev" />
      </div>
    </div>
  )
}
