"use client"

import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"
import { clsx } from "clsx"
import type { Alarm, RobotSnapshot } from "@/lib/backend"

export function PageHeader({
  title,
  description,
  aside,
  display = false,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  aside?: React.ReactNode
  display?: boolean
}) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className={display ? "display" : "title"}>{title}</h1>
        {description && <div className="mt-3 max-w-[68ch] text-body text-ink-2">{description}</div>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  )
}

export function Section({
  title,
  aside,
  children,
  className,
  id,
}: {
  title: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section className={clsx("min-w-0 border-t border-ink", className)} aria-labelledby={id}>
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
        <h2 id={id} className="text-heading font-semibold">
          {title}
        </h2>
        {aside && <div className="text-small text-ink-3">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

const clockFmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(undefined, { hourCycle: "h23", ...opts })

export function clock(epochSeconds: number, seconds = true): string {
  return clockFmt({ hour: "2-digit", minute: "2-digit", ...(seconds ? { second: "2-digit" } : {}) }).format(
    new Date(epochSeconds * 1000),
  )
}

export function dateLine(epochMs: number): string {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(epochMs),
  )
}

export function UpdatedAt({ at, every }: { at: number | null; every?: string }) {
  if (!at) return null
  return (
    <p className="text-small text-ink-3">
      Updated <span className="font-mono text-ink-2 tnum">{clock(at / 1000)}</span>
      {every && <span>, every {every}</span>}
    </p>
  )
}

const STATE_STYLE: Record<RobotSnapshot["status"], string> = {
  error: "text-alarm font-semibold",
  busy: "text-ink font-semibold",
  idle: "text-ink-2",
  offline: "text-ink-3",
}

export function stateLabel(status: RobotSnapshot["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export function StateWord({ status, className }: { status: RobotSnapshot["status"]; className?: string }) {
  return <span className={clsx(STATE_STYLE[status] ?? STATE_STYLE.offline, className)}>{stateLabel(status)}</span>
}

export const SEVERITY: Record<Alarm["severity"], { label: string; className: string }> = {
  error: { label: "Critical", className: "text-alarm font-semibold" },
  warn: { label: "Warning", className: "text-ink font-semibold" },
  info: { label: "Info", className: "text-ink-2" },
}

export function Severity({ severity, muted = false }: { severity: Alarm["severity"]; muted?: boolean }) {
  const s = SEVERITY[severity] ?? SEVERITY.info
  return <span className={clsx(muted ? "text-ink-3" : s.className)}>{s.label}</span>
}

export function severityCounts(alarms: Alarm[]): string {
  const parts: string[] = []
  const n = (s: Alarm["severity"]) => alarms.filter((a) => a.severity === s).length
  if (n("error")) parts.push(`${n("error")}\u00a0critical`)
  if (n("warn")) parts.push(`${n("warn")}\u00a0warning`)
  if (n("info")) parts.push(`${n("info")}\u00a0info`)
  return parts.join(", ")
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString()}\u00a0${n === 1 ? one : many}`
}

export function timeAgo(epochSeconds: number, now = Date.now()): string {
  const s = Math.max(0, Math.round(now / 1000 - epochSeconds))
  if (s < 45) return "just now"
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  return `${Math.round(h / 24)} d ago`
}

export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className={clsx("relative min-w-0", className)}>
      <pre className="overflow-x-auto rounded-r border border-rule bg-sheet py-3 pl-4 pr-12 font-mono text-mono text-ink">
        {code}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-px top-px inline-flex h-10 w-10 items-center justify-center rounded-r text-ink-3 transition-colors hover:text-ink"
        aria-label={copied ? "Copied" : "Copy to clipboard"}
        title={copied ? "Copied" : "Copy"}
      >
        {copied ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
      </button>
    </div>
  )
}

export function Notice({
  title,
  children,
  action,
}: {
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="border-y border-rule py-8">
      <p className="text-heading font-semibold">{title}</p>
      {children && <div className="mt-2 max-w-[64ch] text-body text-ink-2 prose-muted">{children}</div>}
      {action && <div className="mt-6 flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}

export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={clsx("divide-y divide-rule", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="py-4">
          <div className="skeleton h-4" style={{ width: `${88 - i * 14}%` }} />
        </div>
      ))}
    </div>
  )
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="space-y-12" role="status" aria-label={label}>
      <div className="space-y-3">
        <div className="skeleton h-9 w-72 max-w-full" />
        <div className="skeleton h-4 w-96 max-w-full" />
      </div>
      <div className="border-t border-ink">
        <SkeletonRows rows={4} />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function Chapter({
  title,
  note,
  children,
}: {
  title: React.ReactNode
  note?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="grid grid-cols-1 gap-x-10 gap-y-4 border-t border-ink pt-4 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <h2 className="text-heading font-semibold">{title}</h2>
        {note && <p className="mt-1 text-small text-ink-3">{note}</p>}
      </div>
      <div className="min-w-0 max-w-[72ch] lg:col-span-8">{children}</div>
    </section>
  )
}
