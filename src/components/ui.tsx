"use client"

import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"
import { clsx } from "clsx"
import type { Alarm, RobotSnapshot } from "@/lib/backend"

export function PageHeader({
  title,
  description,
  aside,
}: {
  title: string
  description?: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-title font-semibold">{title}</h1>
        {description && (
          <p className="mt-1 max-w-[80ch] text-body text-fg-muted">{description}</p>
        )}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  )
}

export function Panel({
  title,
  aside,
  children,
  className,
  flush = false,
}: {
  title?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
  flush?: boolean
}) {
  return (
    <section className={clsx("panel min-w-0", className)}>
      {title && (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-heading font-semibold">{title}</h2>
          {aside}
        </div>
      )}
      <div className={flush ? "" : "p-4"}>{children}</div>
    </section>
  )
}

export function UpdatedAt({ at }: { at: number | null }) {
  if (!at) return null
  return (
    <p className="text-small text-fg-faint">
      Updated <span className="tnum">{new Date(at).toLocaleTimeString()}</span>
    </p>
  )
}

const STATUS_STYLE: Record<RobotSnapshot["status"], string> = {
  error: "text-critical font-semibold",
  busy: "text-fg font-semibold",
  idle: "text-fg-muted",
  offline: "text-fg-faint",
}

export function RobotStatus({ status }: { status: RobotSnapshot["status"] }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  return <span className={clsx("text-small", STATUS_STYLE[status] ?? STATUS_STYLE.offline)}>{label}</span>
}

const SEVERITY: Record<Alarm["severity"], { label: string; className: string }> = {
  error: { label: "Critical", className: "text-critical" },
  warn: { label: "Warning", className: "text-fg" },
  info: { label: "Info", className: "text-fg-muted" },
}

export function Severity({ severity, muted = false }: { severity: Alarm["severity"]; muted?: boolean }) {
  const s = SEVERITY[severity] ?? SEVERITY.info
  return (
    <span
      className={clsx(
        "label",
        muted ? "text-fg-faint" : s.className,
        severity === "info" && "font-medium",
      )}
    >
      {s.label}
    </span>
  )
}

export function severityCounts(alarms: Alarm[]): string {
  const parts: string[] = []
  const n = (s: Alarm["severity"]) => alarms.filter((a) => a.severity === s).length
  if (n("error")) parts.push(`${n("error")} critical`)
  if (n("warn")) parts.push(`${n("warn")} warning`)
  if (n("info")) parts.push(`${n("info")} info`)
  return parts.join(" · ")
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
      <pre className="overflow-x-auto rounded-md border border-line bg-bg p-3 pr-12 font-mono text-code text-fg">
        {code}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-px top-px inline-flex h-9 w-10 items-center justify-center rounded-tr-md bg-bg text-fg-faint transition-colors hover:bg-raised hover:text-fg"
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
    <div className="panel px-4 py-8 sm:px-8">
      <p className="text-heading font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-[60ch] text-body text-fg-muted prose-muted">{children}</div>}
      {action && <div className="mt-4 flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}

export function SkeletonRows({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={clsx("space-y-3", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-5" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  )
}

export function Loading({ label }: { label: string }) {
  return (
    <div className="space-y-6" role="status" aria-label={label}>
      <div className="space-y-2">
        <div className="skeleton h-7 w-40" />
        <div className="skeleton h-4 w-72 max-w-full" />
      </div>
      <div className="panel p-4">
        <SkeletonRows rows={4} />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
