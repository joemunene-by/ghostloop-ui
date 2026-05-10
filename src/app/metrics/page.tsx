"use client"

import { useEffect, useState } from "react"
import { Activity, Loader2 } from "lucide-react"
import { backend } from "@/lib/backend"

export default function MetricsPage() {
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const t = await backend.metrics()
        if (!cancelled) setText(t)
      } catch (e) {
        if (!cancelled) setError(String(e))
      }
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  if (error) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold mb-2">Metrics</h1>
        <p className="text-[var(--color-text-muted)] mb-3">
          Couldn&apos;t fetch <code>/metrics</code>:
        </p>
        <pre className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3 text-sm">
          {error}
        </pre>
      </div>
    )
  }

  if (text === null) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading metrics…
      </div>
    )
  }

  const lines = text.split("\n")
  const samples = lines.filter((l) => l && !l.startsWith("#"))

  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold mb-1 flex items-center gap-2">
          <Activity className="w-6 h-6 text-[var(--color-primary)]" />
          Metrics
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Prometheus-format counters from the dashboard backend. Refreshes every 5 seconds.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {samples.map((line, i) => {
          const [name, value] = line.split(/\s+/, 2)
          return (
            <div key={i} className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-4">
              <p className="text-xs text-[var(--color-text-muted)] font-mono break-all">{name}</p>
              <p className="text-2xl font-semibold mt-1">{value}</p>
            </div>
          )
        })}
      </div>

      <details className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-4">
        <summary className="cursor-pointer text-sm text-[var(--color-text-muted)]">
          Raw Prometheus output ({lines.length} lines)
        </summary>
        <pre className="mt-3 text-xs overflow-x-auto">{text}</pre>
      </details>
    </div>
  )
}
