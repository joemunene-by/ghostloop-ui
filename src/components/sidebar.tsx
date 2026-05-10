"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  Bot,
  History,
  LayoutDashboard,
  Repeat,
  Settings2,
  Workflow,
} from "lucide-react"
import { clsx } from "clsx"

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/fleet", label: "Fleet", icon: Bot },
  { href: "/missions", label: "Missions", icon: Workflow },
  { href: "/traces", label: "Traces", icon: History },
  { href: "/alarms", label: "Alarms", icon: AlertTriangle },
  { href: "/metrics", label: "Metrics", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings2 },
]

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="w-60 border-r border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col">
      <div className="px-5 py-6 border-b border-[var(--color-border)]">
        <Link href="/" className="text-xl font-bold tracking-tight flex items-center gap-2">
          <Repeat className="w-5 h-5 text-[var(--color-primary)]" />
          ghostloop
        </Link>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">control plane</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)]",
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
        <a
          href="https://github.com/joemunene-by/ghostloop"
          target="_blank"
          rel="noreferrer"
          className="hover:text-[var(--color-primary)]"
        >
          github.com/joemunene-by/ghostloop
        </a>
        <p className="mt-1">backend: <code>{process.env.NEXT_PUBLIC_BACKEND_LABEL || "/api/backend"}</code></p>
      </div>
    </aside>
  )
}
