"use client"

import { useEffect, useMemo, useState } from "react"
import { backend } from "@/lib/backend"
import { CodeBlock, Loading, Notice, PageHeader, UpdatedAt } from "@/components/ui"

type Sample = { name: string; value: string; help?: string; type?: string }

function parse(text: string): Sample[] {
  const help = new Map<string, string>()
  const type = new Map<string, string>()
  const samples: Sample[] = []
  for (const line of text.split("\n")) {
    if (!line) continue
    const meta = line.match(/^#\s+(HELP|TYPE)\s+(\S+)\s+(.*)$/)
    if (meta) {
      const target = meta[1] === "HELP" ? help : type
      target.set(meta[2], meta[3])
      continue
    }
    if (line.startsWith("#")) continue
    // label values may contain spaces, so match the {...} block before splitting
    const m = line.match(/^([^\s{]+(?:\{[^}]*\})?)\s+(\S+)/)
    if (m) samples.push({ name: m[1], value: m[2] })
  }
  return samples.map((s) => {
    const base = s.name.split("{")[0]
    return { ...s, help: help.get(base), type: type.get(base) }
  })
}

function formatValue(v: string) {
  const n = Number(v)
  if (!Number.isFinite(n)) return v
  return Number.isInteger(n) ? n.toLocaleString() : n.toLocaleString(undefined, { maximumFractionDigits: 3 })
}

export default function MetricsPage() {
  const [text, setText] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const t = await backend.metrics()
        if (!cancelled) {
          setText(t)
          setFailed(false)
          setUpdatedAt(Date.now())
        }
      } catch {
        if (!cancelled) setFailed(true)
      }
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  const samples = useMemo(() => (text ? parse(text) : []), [text])

  if (failed && text === null) {
    return (
      <div className="max-w-2xl space-y-6">
        <PageHeader title="Metrics" />
        <Notice title="Couldn't load metrics">
          The backend didn&apos;t return <code>/metrics</code>. This page retries every 5 seconds. Check
          that the backend is running and that the token in Settings matches it.
        </Notice>
      </div>
    )
  }

  if (text === null) return <Loading label="Loading metrics" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Metrics"
        description="Prometheus counters and gauges from the dashboard backend. Refreshes every 5 seconds."
        aside={<UpdatedAt at={updatedAt} />}
      />

      {samples.length === 0 ? (
        <Notice title="No samples yet">The backend returned an empty metrics page.</Notice>
      ) : (
        <section className="panel overflow-hidden">
          <table className="w-full table-fixed text-small">
            <thead>
              <tr>
                <th className="label px-4 pb-2 pt-3 text-left">Metric</th>
                <th className="label hidden w-24 px-4 pb-2 pt-3 text-left sm:table-cell">Type</th>
                <th className="label w-28 px-4 pb-2 pt-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s, i) => (
                <tr key={`${s.name}-${i}`} className="border-t border-line">
                  <td className="px-4 py-3 align-top">
                    <p className="break-all font-mono text-fg">{s.name}</p>
                    {s.help && <p className="mt-1 text-fg-faint">{s.help}</p>}
                  </td>
                  <td className="hidden px-4 py-3 align-top text-fg-muted sm:table-cell">{s.type ?? "-"}</td>
                  <td className="px-4 py-3 text-right align-top text-heading font-semibold tnum">
                    {formatValue(s.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <details className="group">
        <summary className="inline-flex h-10 cursor-pointer items-center text-body text-fg-muted hover:text-fg">
          Raw Prometheus output ({text.split("\n").length} lines)
        </summary>
        <CodeBlock code={text} className="mt-2" />
      </details>
    </div>
  )
}
