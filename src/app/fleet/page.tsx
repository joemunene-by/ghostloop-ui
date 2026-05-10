"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bot, ExternalLink, Loader2, Plug, Sparkles } from "lucide-react"
import { backend, type FleetSnapshot, type RobotSnapshot } from "@/lib/backend"

export default function FleetPage() {
  const [fleet, setFleet] = useState<FleetSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const f = await backend.fleet()
        if (!cancelled) {
          setFleet(f)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (error && !fleet) {
    return <EmptyFleet hint="The backend is up, but no fleet has been registered yet." />
  }

  if (!fleet) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading fleet…
      </div>
    )
  }

  if (fleet.robots.length === 0) {
    return <EmptyFleet hint="No robots are connected yet. Walk through Connect a robot to get one online." />
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
    </div>
  )
}

function EmptyFleet({ hint }: { hint: string }) {
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold mb-1 flex items-center gap-2">
          <Bot className="w-7 h-7 text-[var(--color-primary)]" />
          Fleet
        </h1>
        <p className="text-[var(--color-text-muted)]">{hint}</p>
      </header>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-semibold mb-2">Get a robot showing here</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-5 max-w-xl">
          The fastest path is the live demo: six different robots are
          waiting in your browser, all pre-wired through the safety pipeline.
          Or follow the local-setup guide to point this UI at your own backend.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/connect"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-black font-medium text-sm hover:opacity-90"
          >
            <Plug className="w-4 h-4" />
            Connect a robot
          </Link>
          <a
            href="https://huggingface.co/spaces/Ghostgim/ghostloop-demo"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--color-border)] text-sm hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <Sparkles className="w-4 h-4" />
            Try the live demo
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="text-sm font-medium mb-2">What shows up on this page?</h3>
        <p className="text-sm text-[var(--color-text-muted)]">
          Every robot registered with the backend&apos;s{" "}
          <code>FleetRegistry</code> appears as a card. Cards show live
          status (idle, busy, offline, error), labels, backend type, and
          link to a per-robot detail page with primitives, current pose,
          and recent traces.
        </p>
      </div>
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
