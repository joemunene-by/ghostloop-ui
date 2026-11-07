"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { backend, isDemoMode, type Alarm, type FleetSnapshot } from "@/lib/backend"
import { historyFor } from "@/lib/history"
import { clip, totals, WINDOW_S, type RobotState, type Segment } from "@/lib/timeline"
import { Legend, Strip } from "@/components/fleet-timeline"
import { HF_DEMO_URL } from "@/components/topbar"
import { Loading, Notice, PageHeader, Section, StateWord, UpdatedAt, timeAgo } from "@/components/ui"

function position(p?: number[]) {
  if (!p || p.length === 0) return "-"
  return p.map((v) => v.toFixed(1)).join(", ")
}

const STATES: [RobotState, string][] = [
  ["busy", "Busy"],
  ["idle", "Idle"],
  ["offline", "Offline"],
  ["error", "Error"],
]

export default function FleetPage() {
  const [fleet, setFleet] = useState<FleetSnapshot | null>(null)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [history, setHistory] = useState<Record<string, Segment[]>>({})
  const [error, setError] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const [f, a] = await Promise.all([
          backend.fleet(),
          backend.listAlarms(true, 100).catch(() => ({ alarms: [] as Alarm[], n: 0 })),
        ])
        if (cancelled) return
        const at = Date.now()
        setFleet(f)
        setAlarms(a.alarms)
        setHistory(historyFor(f.robots, a.alarms, isDemoMode(), at / 1000))
        setError(false)
        setUpdatedAt(at)
      } catch {
        if (!cancelled) setError(true)
      }
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  if (error && !fleet) {
    return <EmptyFleet hint="The backend answered, but no fleet is registered with it yet." />
  }

  if (!fleet || updatedAt === null) return <Loading label="Loading fleet" />

  if (fleet.robots.length === 0) {
    return <EmptyFleet hint="No robots are connected yet. Connect walks you through getting one online." />
  }

  const now = updatedAt
  const to = now / 1000
  const from = to - WINDOW_S
  const parts = [
    fleet.n_busy && `${fleet.n_busy}\u00a0busy`,
    fleet.n_idle && `${fleet.n_idle}\u00a0idle`,
    fleet.n_offline && `${fleet.n_offline}\u00a0offline`,
    fleet.n_error && `${fleet.n_error}\u00a0in\u00a0error`,
  ].filter(Boolean)

  return (
    <div className="space-y-12">
      <PageHeader
        title={`${fleet.n_total} ${fleet.n_total === 1 ? "robot" : "robots"}. ${parts.join(", ")}.`}
        description="Every robot registered with the backend's FleetRegistry, with what it has been doing for the last 30 minutes."
        aside={<UpdatedAt at={updatedAt} every="3 s" />}
      />

      <Section title="Register" aside={<Legend />}>
        <table className="hidden w-full text-[14px] lg:table">
          <thead>
            <tr className="border-t border-rule text-left">
              <th className="colhead h-10 pr-6">Robot</th>
              <th className="colhead h-10 pr-6">State</th>
              <th className="colhead h-10 w-[32%] pr-6">Last 30 minutes</th>
              <th className="colhead h-10 pr-6">Backend</th>
              <th className="colhead h-10 pr-6">Labels</th>
              <th className="colhead h-10 pr-6 text-right">Position, m</th>
              <th className="colhead h-10 text-right">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {fleet.robots.map((r) => (
              <tr key={r.name} className="border-t border-rule">
                <td className="h-14 pr-6 font-mono text-mono font-medium">{r.name}</td>
                <td className="h-14 pr-6">
                  <StateWord status={r.status} />
                </td>
                <td className="h-14 pr-6">
                  <Strip
                    segments={history[r.name] ?? []}
                    alarms={alarms.filter((a) => a.robot === r.name)}
                    from={from}
                    to={to}
                    height="h-3"
                  />
                </td>
                <td className="h-14 pr-6 font-mono text-mono text-ink-2">{r.backend ?? "-"}</td>
                <td className="h-14 pr-6 text-ink-2">{r.labels?.length ? r.labels.join(", ") : "-"}</td>
                <td className="h-14 pr-6 text-right font-mono text-mono text-ink-2 tnum">{position(r.position)}</td>
                <td className="h-14 text-right font-mono text-mono text-ink-2 tnum">{timeAgo(r.last_seen, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="border-b border-rule lg:hidden">
          {fleet.robots.map((r) => (
            <li key={r.name} className="border-t border-rule py-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate font-mono text-mono font-medium">{r.name}</span>
                <StateWord status={r.status} className="text-[14px]" />
              </div>
              <Strip
                segments={history[r.name] ?? []}
                alarms={alarms.filter((a) => a.robot === r.name)}
                from={from}
                to={to}
                height="h-3"
              />
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-small">
                <dt className="text-ink-3">Backend</dt>
                <dd className="truncate text-right font-mono text-ink-2">{r.backend ?? "-"}</dd>
                <dt className="text-ink-3">Labels</dt>
                <dd className="text-right text-ink-2">{r.labels?.length ? r.labels.join(", ") : "-"}</dd>
                <dt className="text-ink-3">Position, m</dt>
                <dd className="text-right font-mono text-ink-2 tnum">{position(r.position)}</dd>
                <dt className="text-ink-3">Last seen</dt>
                <dd className="text-right font-mono text-ink-2 tnum">{timeAgo(r.last_seen, now)}</dd>
              </dl>
            </li>
          ))}
        </ul>
        {isDemoMode() && <p className="mt-3 text-small text-ink-3">State history is sample data in demo mode.</p>}
      </Section>

      <Section title="Minutes in each state, last 30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[340px] border-b border-rule text-[14px]">
            <thead>
              <tr className="border-t border-rule">
                <th className="colhead h-10 pr-4 text-left">Robot</th>
                {STATES.map(([s, label]) => (
                  <th key={s} className="colhead h-10 px-2 text-right sm:px-4">
                    {label}
                  </th>
                ))}
                <th className="colhead hidden h-10 pl-4 text-right sm:table-cell">Not recorded</th>
                <th className="colhead hidden h-10 pl-4 text-right md:table-cell">Alarms</th>
              </tr>
            </thead>
            <tbody>
              {fleet.robots.map((r) => {
                const t = totals(clip(history[r.name] ?? [], from, to))
                const recorded = STATES.reduce((sum, [s]) => sum + (t[s] ?? 0), 0)
                const n = alarms.filter((a) => a.robot === r.name && a.raised_at >= from).length
                return (
                  <tr key={r.name} className="border-t border-rule">
                    <td className="h-11 max-w-[40vw] truncate pr-4 font-mono text-mono font-medium">{r.name}</td>
                    {STATES.map(([s]) => (
                      <td
                        key={s}
                        className={`h-11 px-2 text-right font-mono text-mono tnum sm:px-4 ${t[s] ? (s === "error" ? "text-alarm" : "text-ink") : "text-ink-3"}`}
                      >
                        {t[s] ? Math.max(1, Math.round((t[s] ?? 0) / 60)) : "-"}
                      </td>
                    ))}
                    <td className="hidden h-11 pl-4 text-right font-mono text-mono text-ink-3 tnum sm:table-cell">
                      {WINDOW_S - recorded > 30 ? Math.round((WINDOW_S - recorded) / 60) : "-"}
                    </td>
                    <td className="hidden h-11 pl-4 text-right font-mono text-mono tnum md:table-cell">{n || "-"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  )
}

function EmptyFleet({ hint }: { hint: string }) {
  return (
    <div className="max-w-3xl space-y-10">
      <PageHeader title="No robots yet." description={hint} />
      <Notice
        title="Get a robot showing here"
        action={
          <>
            <Link href="/connect" className="btn btn-primary">
              Connect a robot
            </Link>
            <a href={HF_DEMO_URL} target="_blank" rel="noreferrer" className="btn btn-secondary">
              Try the live demo
              <ArrowUpRight className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
            </a>
          </>
        }
      >
        <p>
          The quickest way is the live demo: six robots wait in your browser, all wired through the safety pipeline.
          Or follow the local setup guide to point this UI at your own backend.
        </p>
        <p className="mt-3">
          Every robot registered with the backend&apos;s <code>FleetRegistry</code> appears here with its live state,
          labels and backend type.
        </p>
      </Notice>
    </div>
  )
}
