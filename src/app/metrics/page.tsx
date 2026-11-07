"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { backend } from "@/lib/backend"
import { CodeBlock, Loading, Notice, PageHeader, Section, UpdatedAt } from "@/components/ui"

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

function breakable(name: string) {
  return name.split("_").map((part, i) => (
    <Fragment key={i}>
      {i > 0 && (
        <>
          _<wbr />
        </>
      )}
      {part}
    </Fragment>
  ))
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
      <div className="max-w-3xl space-y-10">
        <PageHeader title="Can't read metrics." />
        <Notice title="The backend didn't return /metrics">
          This page tries again every 5 seconds. Check that the backend is running and that the token in Settings
          matches it.
        </Notice>
      </div>
    )
  }
  if (text === null) return <Loading label="Loading metrics" />

  const value = (name: string) => {
    const s = samples.find((x) => x.name === name)
    return s ? Number(s.value) : null
  }
  const requests = value("ghostloop_requests_total")
  const limited = value("ghostloop_rate_limited_total")
  const authFail = value("ghostloop_auth_failures_total")
  const title =
    requests !== null
      ? `${requests.toLocaleString()} requests handled.${limited !== null ? ` ${limited.toLocaleString()}\u00a0rate\u00a0limited.` : ""}${authFail ? ` ${authFail.toLocaleString()}\u00a0failed\u00a0auth.` : ""}`
      : `${samples.length} metrics reported.`

  return (
    <div className="space-y-12">
      <PageHeader
        title={title}
        description="Prometheus counters and gauges from the dashboard backend, read from /metrics."
        aside={<UpdatedAt at={updatedAt} every="5 s" />}
      />

      <Section title="Samples" aside={<span className="font-mono tnum">{samples.length}</span>}>
        {samples.length === 0 ? (
          <Notice title="No samples yet">The backend returned an empty metrics page.</Notice>
        ) : (
          <table className="w-full table-fixed border-b border-rule text-[14px]">
            <thead>
              <tr className="border-t border-rule">
                <th className="colhead h-10 pr-6 text-left">Metric</th>
                <th className="colhead hidden h-10 w-28 pr-6 text-left sm:table-cell">Type</th>
                <th className="colhead h-10 w-20 text-right sm:w-28">Value</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((s, i) => (
                <tr key={`${s.name}-${i}`} className="border-t border-rule">
                  <td className="py-3 pr-6 align-top">
                    <p className="break-words font-mono text-mono text-ink">{breakable(s.name)}</p>
                    {s.help && <p className="mt-1 text-small text-ink-2">{s.help}</p>}
                  </td>
                  <td className="hidden py-3 pr-6 align-top text-ink-2 sm:table-cell">{s.type ?? "-"}</td>
                  <td className="py-3 text-right align-top font-mono text-[17px] font-medium leading-6 tnum">
                    {formatValue(s.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <details className="group">
        <summary className="inline-flex h-10 cursor-pointer items-center text-[14px] text-ink-2 hover:text-ink">
          Raw Prometheus output, {text.split("\n").length} lines
        </summary>
        <CodeBlock code={text} className="mt-2" />
      </details>
    </div>
  )
}
