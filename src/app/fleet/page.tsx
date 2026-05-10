"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bot, Loader2 } from "lucide-react"
import { backend, type FleetSnapshot, type RobotSnapshot } from "@/lib/backend"

export default function FleetPage() {
  const [fleet, setFleet] = useState<FleetSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const f = await backend.fleet()
        if (!cancelled) setFleet(f)
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (error) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold mb-2">Fleet</h1>
        <p className="text-[var(--color-text-muted)] mb-3">
          The backend doesn&apos;t have a fleet attached yet.
        </p>
        <pre className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 text-sm overflow-x-auto">
          {error}
        </pre>
      </div>
    )
  }

  if (!fleet) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading fleet…
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold mb-1">Fleet</h1>
        <p className="text-[var(--color-text-muted)]">
          {fleet.n_total} robots · {fleet.n_idle} idle · {fleet.n_busy} busy ·
          {" "}{fleet.n_offline} offline · {fleet.n_error} error
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fleet.robots.map((r) => <RobotCard key={r.name} robot={r} />)}
      </div>

      {fleet.robots.length === 0 && (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 text-sm text-[var(--color-text-muted)]">
          No robots registered. Add some to your <code>FleetRegistry</code>{" "}
          and they&apos;ll appear here on the next refresh.
        </div>
      )}
    </div>
  )
}

function RobotCard({ robot }: { robot: RobotSnapshot }) {
  const tone: Record<string, string> = {
    idle: "border-[var(--color-ok)]/40",
    busy: "border-[var(--color-primary)]/40",
    offline: "border-[var(--color-text-muted)]/40",
    error: "border-[var(--color-error)]/40",
  }
  return (
    <Link
      href={`/fleet/${encodeURIComponent(robot.name)}`}
      className={`block bg-[var(--color-bg-card)] border ${tone[robot.status] || tone.offline} rounded-xl p-5 hover:border-[var(--color-primary)] transition-colors`}
    >
      <div className="flex items-center gap-2 mb-3">
        <Bot className="w-4 h-4 text-[var(--color-primary)]" />
        <p className="font-mono text-sm">{robot.name}</p>
      </div>
      <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
        {robot.status}
      </p>
      {robot.backend && (
        <p className="mt-2 text-xs text-[var(--color-text-muted)] font-mono">
          {robot.backend}
        </p>
      )}
      {robot.labels && robot.labels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {robot.labels.map((l) => (
            <span
              key={l}
              className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </Link>
  )
}
