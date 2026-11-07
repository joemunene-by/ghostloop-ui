"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import {
  backend,
  isDemoMode,
  onDemoModeChange,
  type Alarm,
  type Episode,
  type FleetSnapshot,
  type StoreStats,
} from "@/lib/backend"
import { historyFor, observedSince } from "@/lib/history"
import type { Segment } from "@/lib/timeline"
import { AlarmLog } from "@/components/alarm-log"
import { EpisodeChart } from "@/components/episode-chart"
import { FleetTimeline, Legend } from "@/components/fleet-timeline"
import { HF_DEMO_URL } from "@/components/topbar"
import {
  clock,
  CodeBlock,
  dateLine,
  PageHeader,
  plural,
  Section,
  severityCounts,
  SkeletonRows,
  timeAgo,
} from "@/components/ui"

export default function OverviewPage() {
  const [fleet, setFleet] = useState<FleetSnapshot | null>(null)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [history, setHistory] = useState<Record<string, Segment[]>>({})
  const [reachable, setReachable] = useState<boolean | null>(null)
  const [demo, setDemo] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  useEffect(() => onDemoModeChange(setDemo), [])

  async function poll(cancelled: () => boolean = () => false) {
    try {
      await backend.health()
      if (cancelled()) return
      setReachable(true)
      const [f, a, s, e] = await Promise.all([
        backend.fleet().catch(() => null),
        backend.listAlarms(true, 100).catch(() => ({ alarms: [] as Alarm[], n: 0 })),
        backend.storeStats().catch(() => null),
        backend.listEpisodes(100).catch(() => ({ episodes: [] as Episode[] })),
      ])
      if (cancelled()) return
      const at = Date.now()
      setFleet(f)
      setAlarms(a.alarms)
      setStats(s)
      setEpisodes(e.episodes)
      setHistory(f ? historyFor(f.robots, a.alarms, isDemoMode(), at / 1000) : {})
      setUpdatedAt(at)
    } catch {
      if (!cancelled()) setReachable(false)
    }
  }

  useEffect(() => {
    let stopped = false
    poll(() => stopped)
    const t = setInterval(() => poll(() => stopped), 5000)
    return () => {
      stopped = true
      clearInterval(t)
    }
  }, [])

  if (reachable === false) return <BackendUnreachable />

  const loading = reachable === null || updatedAt === null
  const now = updatedAt ?? Date.now()
  const open = alarms.filter((a) => !a.acked).sort((a, b) => b.raised_at - a.raised_at)
  const recentAcked = alarms
    .filter((a) => a.acked && a.raised_at > now / 1000 - 24 * 3600)
    .sort((a, b) => b.raised_at - a.raised_at)
  const log = [...open, ...recentAcked]
  const robots = fleet?.robots ?? []

  if (!loading && robots.length === 0) {
    return (
      <div className="space-y-12">
        <PageHeader display title="No robots connected yet." description={<GetStartedCopy />} />
        <GetStartedActions />
      </div>
    )
  }

  const attention = robots.filter(
    (r) =>
      r.status === "error" ||
      r.status === "offline" ||
      open.some((a) => a.robot === r.name && a.severity === "error"),
  )
  const since = observedSince(history)

  return (
    <div className="space-y-12 sm:space-y-16">
      {loading ? (
        <div className="space-y-4" role="status" aria-label="Loading overview">
          <div className="skeleton h-4 w-56" />
          <div className="skeleton h-11 w-[28rem] max-w-full" />
          <div className="skeleton h-5 w-[36rem] max-w-full" />
        </div>
      ) : (
        <header>
          <p className="font-mono text-mono-sm text-ink-3 tnum">
            {dateLine(now)} · as of {clock(now / 1000)}
            <span className="hidden sm:inline"> · refreshes every 5 s</span>
          </p>
          <h1 className="display mt-4">
            {plural(robots.length, "robot")}.{" "}
            {attention.length === 0
              ? "All running normally."
              : `${attention.length}\u00a0${attention.length === 1 ? "needs" : "need"} attention.`}
          </h1>
          <p className="mt-4 max-w-[72ch] text-body text-ink-2">
            <AttentionSentence robots={attention} />
            {open.length > 0 ? (
              <>
                {plural(open.length, "open alarm")}, {severityCounts(open)}. Latest is{" "}
                <span className="font-mono text-mono text-ink">{open[0].kind}</span>
                {open[0].robot ? (
                  <>
                    {" "}
                    on <span className="font-mono text-mono text-ink">{open[0].robot}</span>
                  </>
                ) : null}
                , {timeAgo(open[0].raised_at, now)}.
              </>
            ) : (
              "No open alarms."
            )}
          </p>
        </header>
      )}

      <Section id="timeline" title="Fleet, last 30 minutes" aside={<Legend />}>
        {loading ? (
          <SkeletonRows rows={3} />
        ) : (
          <>
            <p className="mb-3 text-small text-ink-3">
              {demo
                ? "Sample history made up for the demo. Alarm marks and current states are the demo backend's own."
                : `Recorded by this browser${since ? ` since ${clock(since, false)}` : ""}. The backend keeps no state history, so time before that shows as a dotted line.`}
            </p>
            <FleetTimeline robots={robots} history={history} alarms={alarms} now={now} />
          </>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
        <Section
          id="alarm-log"
          className="lg:col-span-8"
          title="Alarm log, last 24 hours"
          aside={
            <Link href="/alarms" className="link text-ink-2">
              All alarms
            </Link>
          }
        >
          {loading ? (
            <SkeletonRows rows={3} />
          ) : log.length === 0 ? (
            <div className="border-t border-rule py-8">
              <p className="font-medium">Nothing logged in the last 24 hours.</p>
              <p className="mt-1 text-small text-ink-2">
                Safety gate denials and property violations are logged here the moment they happen.
              </p>
            </div>
          ) : (
            <AlarmLog alarms={log} now={now} onAcked={() => poll()} />
          )}
        </Section>

        <Section
          id="recorder"
          className="lg:col-span-4"
          title="Recorder"
          aside={
            <Link href="/traces" className="link text-ink-2">
              Traces
            </Link>
          }
        >
          {loading ? <SkeletonRows rows={4} /> : <Recorder stats={stats} episodes={episodes} nowS={now / 1000} />}
        </Section>
      </div>
    </div>
  )
}

function AttentionSentence({ robots }: { robots: FleetSnapshot["robots"] }) {
  if (!robots.length) return null
  return (
    <>
      {robots.map((r, i) => (
        <span key={r.name}>
          <span className="font-mono text-mono text-ink">{r.name}</span>{" "}
          {r.status === "error" ? "is in error" : r.status === "offline" ? "is offline" : "has a critical alarm"}
          {i < robots.length - 1 ? ", " : ". "}
        </span>
      ))}
    </>
  )
}

function Recorder({ stats, episodes, nowS }: { stats: StoreStats | null; episodes: Episode[]; nowS: number }) {
  if (!stats && episodes.length === 0) {
    return (
      <div className="border-t border-rule py-8">
        <p className="font-medium">The store is empty.</p>
        <p className="mt-1 text-small text-ink-2">
          Episodes run through <code className="code-inline">EpisodeRunner</code> with a store attached show up here.
        </p>
      </div>
    )
  }
  const latest = [...episodes].sort((a, b) => b.started_at - a.started_at)[0]
  const graded = episodes.filter((e) => e.passed !== undefined)
  const passed = graded.filter((e) => e.passed).length
  const rows: [string, React.ReactNode][] = [
    ["Episodes recorded", (stats?.n_episodes ?? episodes.length).toLocaleString()],
    ["Runs", stats ? stats.n_runs.toLocaleString() : "-"],
    ["Comparisons", stats ? stats.n_comparisons.toLocaleString() : "-"],
    ["Passed", graded.length ? `${passed} of ${graded.length}` : "-"],
    ["Latest episode", latest ? `${clock(latest.started_at, false)}, ${latest.duration_s.toFixed(1)} s` : "-"],
  ]
  return (
    <div>
      {episodes.length > 0 && (
        <div className="border-t border-rule pb-2 pt-6">
          <EpisodeChart episodes={episodes} nowS={nowS} height={64} labelEvery={2} />
          <p className="text-small text-ink-3">Each bar is an episode, its height the event count. Grey bars failed.</p>
        </div>
      )}
      <dl className="mt-4">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-t border-rule py-3">
            <dt className="text-[14px] text-ink-2">{k}</dt>
            <dd className="font-mono text-mono text-ink tnum">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function GetStartedCopy() {
  return (
    <>
      ghostloop sends every robot command through five safety gates (geofence, force cap, action smoothing, rate
      limit, human approval) before it reaches the hardware, and records traces, alarms and metrics as it goes. Once a
      robot is registered, its state over the last 30 minutes shows here.
    </>
  )
}

function GetStartedActions() {
  return (
    <div className="flex flex-wrap gap-2 border-t border-ink pt-6">
      <Link href="/connect" className="btn btn-primary">
        Connect a robot
      </Link>
      <a href={HF_DEMO_URL} target="_blank" rel="noreferrer" className="btn btn-secondary">
        Try the live demo
        <ArrowUpRight className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
      </a>
    </div>
  )
}

function BackendUnreachable() {
  return (
    <div className="max-w-3xl space-y-10">
      <PageHeader
        display
        title="Can't reach the backend."
        description={
          <>
            This dashboard couldn&apos;t reach your ghostloop backend. Set{" "}
            <code className="code-inline">GHOSTLOOP_BACKEND_URL</code> and restart. The page tries again every 5
            seconds.
          </>
        }
      />
      <Section title="In your ghostloop project">
        <CodeBlock
          code={`from ghostloop import GhostloopStore
from ghostloop.fleet import FleetRegistry
from ghostloop.dashboard import create_production_app, ProductionConfig

store = GhostloopStore("./ghostloop.db")
fleet = FleetRegistry()  # register your RobotHandle instances
app, alarms = create_production_app(store=store, fleet=fleet)

# uvicorn server:app --host 0.0.0.0 --port 8000`}
        />
      </Section>
      <Section title="Then start this UI">
        <CodeBlock code="GHOSTLOOP_BACKEND_URL=http://localhost:8000 npm run dev" />
      </Section>
    </div>
  )
}
