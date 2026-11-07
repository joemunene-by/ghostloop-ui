"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { backend, type FleetSnapshot } from "@/lib/backend"
import { Loading, Notice, PageHeader, RobotStatus, UpdatedAt, timeAgo, useNow } from "@/components/ui"

const HF_DEMO_URL = "https://huggingface.co/spaces/Ghostgim/ghostloop-demo"

export default function FleetPage() {
  const [fleet, setFleet] = useState<FleetSnapshot | null>(null)
  const [error, setError] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const now = useNow()

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const f = await backend.fleet()
        if (!cancelled) {
          setFleet(f)
          setError(false)
          setUpdatedAt(Date.now())
        }
      } catch {
        if (!cancelled) setError(true)
      }
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (error && !fleet) {
    return <EmptyFleet hint="The backend is up, but no fleet has been registered yet." />
  }

  if (!fleet) return <Loading label="Loading fleet" />

  if (fleet.robots.length === 0) {
    return <EmptyFleet hint="No robots are connected yet. Walk through Connect a robot to get one online." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet"
        description={
          <span className="tnum">
            {fleet.n_total} robots · {fleet.n_idle} idle · {fleet.n_busy} busy · {fleet.n_offline} offline ·{" "}
            {fleet.n_error} error
          </span>
        }
        aside={<UpdatedAt at={updatedAt} />}
      />

      <section className="panel overflow-hidden">
        <table className="hidden w-full text-small md:table">
          <thead>
            <tr className="text-left">
              <th className="label px-4 pb-2 pt-3">Robot</th>
              <th className="label px-4 pb-2 pt-3">Status</th>
              <th className="label px-4 pb-2 pt-3">Backend</th>
              <th className="label px-4 pb-2 pt-3">Labels</th>
              <th className="label px-4 pb-2 pt-3 text-right">Last seen</th>
            </tr>
          </thead>
          <tbody>
            {fleet.robots.map((r) => (
              <tr key={r.name} className="border-t border-line transition-colors hover:bg-raised">
                <td className="h-11 px-4">
                  <Link href={`/fleet/${encodeURIComponent(r.name)}`} className="font-mono text-fg hover:underline">
                    {r.name}
                  </Link>
                </td>
                <td className="h-11 px-4"><RobotStatus status={r.status} /></td>
                <td className="h-11 px-4 font-mono text-fg-muted">{r.backend ?? "-"}</td>
                <td className="h-11 px-4 text-fg-muted">{r.labels?.length ? r.labels.join(", ") : "-"}</td>
                <td className="h-11 px-4 text-right text-fg-muted tnum">{timeAgo(r.last_seen, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="divide-y divide-line md:hidden">
          {fleet.robots.map((r) => (
            <li key={r.name}>
              <Link
                href={`/fleet/${encodeURIComponent(r.name)}`}
                className="block px-4 py-3 transition-colors active:bg-raised"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-mono text-body text-fg">{r.name}</span>
                  <RobotStatus status={r.status} />
                </div>
                <p className="mt-1 truncate font-mono text-small text-fg-muted">{r.backend ?? "-"}</p>
                <p className="mt-1 text-small text-fg-faint">
                  {r.labels?.length ? `${r.labels.join(", ")} · ` : ""}
                  <span className="tnum">seen {timeAgo(r.last_seen, now)}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function EmptyFleet({ hint }: { hint: string }) {
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Fleet" description={hint} />
      <Notice
        title="Get a robot showing here"
        action={
          <>
            <Link href="/connect" className="btn btn-primary">
              Connect a robot
            </Link>
            <a href={HF_DEMO_URL} target="_blank" rel="noreferrer" className="btn btn-secondary">
              Try the live demo
              <ArrowUpRight className="h-4 w-4 text-fg-faint" strokeWidth={1.75} />
            </a>
          </>
        }
      >
        <p>
          The fastest path is the live demo: six different robots wait in your browser, all wired
          through the safety pipeline. Or follow the local setup guide to point this UI at your own
          backend.
        </p>
        <p className="mt-3">
          Every robot registered with the backend&apos;s <code>FleetRegistry</code> appears here with
          its live status (idle, busy, offline, error), labels and backend type.
        </p>
      </Notice>
    </div>
  )
}
