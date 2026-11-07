"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  History,
  LayoutDashboard,
  Menu,
  Plug,
  Settings2,
  Workflow,
  X,
} from "lucide-react"
import { clsx } from "clsx"
import { Logo } from "@/components/logo"
import { backend, isDemoMode, onDemoModeChange } from "@/lib/backend"

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard }

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Monitor",
    items: [
      { href: "/", label: "Overview", icon: LayoutDashboard },
      { href: "/fleet", label: "Fleet", icon: Bot },
      { href: "/alarms", label: "Alarms", icon: AlertTriangle },
      { href: "/traces", label: "Traces", icon: History },
      { href: "/metrics", label: "Metrics", icon: Activity },
    ],
  },
  {
    label: "Operate",
    items: [
      { href: "/missions", label: "Missions", icon: Workflow },
      { href: "/connect", label: "Connect a robot", icon: Plug },
    ],
  },
]

const HF_DEMO_URL = "https://huggingface.co/spaces/Ghostgim/ghostloop-demo"
const GITHUB_URL = "https://github.com/joemunene-by/ghostloop"

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href)
}

function NavLink({ item, path, onNavigate }: { item: NavItem; path: string; onNavigate?: () => void }) {
  const active = isActive(path, item.href)
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex h-11 items-center gap-3 rounded-md px-3 text-body transition-colors md:h-9",
        active ? "bg-active font-medium text-fg" : "text-fg-muted hover:bg-raised hover:text-fg",
      )}
    >
      <Icon className={clsx("h-4 w-4", active ? "text-fg" : "text-fg-faint")} strokeWidth={1.75} />
      {item.label}
    </Link>
  )
}

function ConnectionMode() {
  const [state, setState] = useState<"checking" | "live" | "demo" | "unreachable">("checking")
  useEffect(() => {
    let checked = false
    const off = onDemoModeChange((demo) => {
      if (checked) setState(demo ? "demo" : "live")
    })
    backend
      .health()
      .then(() => {
        checked = true
        setState(isDemoMode() ? "demo" : "live")
      })
      .catch(() => setState("unreachable"))
    return off
  }, [])
  const label = { checking: "Checking", live: "Live", demo: "Demo data", unreachable: "Unreachable" }[state]
  return (
    <div className="px-3 text-small">
      <p className="label">Backend</p>
      <p className={clsx("mt-1", state === "unreachable" ? "font-semibold text-critical" : "text-fg")}>{label}</p>
      <p className="truncate font-mono text-code text-fg-faint">
        {process.env.NEXT_PUBLIC_BACKEND_LABEL || "/api/backend"}
      </p>
    </div>
  )
}

function NavBody({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main">
        {GROUPS.map((g) => (
          <div key={g.label}>
            <p className="label mb-2 px-3">{g.label}</p>
            <div className="space-y-1">
              {g.items.map((item) => (
                <NavLink key={item.href} item={item} path={path} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-4 border-t border-line px-3 py-4">
        <div className="space-y-1">
          <NavLink item={{ href: "/settings", label: "Settings", icon: Settings2 }} path={path} onNavigate={onNavigate} />
          <a
            href={HF_DEMO_URL}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center gap-3 rounded-md px-3 text-body text-fg-muted transition-colors hover:bg-raised hover:text-fg md:h-9"
          >
            <ArrowUpRight className="h-4 w-4 text-fg-faint" strokeWidth={1.75} />
            Live demo
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex h-11 items-center gap-3 rounded-md px-3 text-body text-fg-muted transition-colors hover:bg-raised hover:text-fg md:h-9"
          >
            <ArrowUpRight className="h-4 w-4 text-fg-faint" strokeWidth={1.75} />
            Source on GitHub
          </a>
        </div>
        <ConnectionMode />
      </div>
    </>
  )
}

export function Sidebar() {
  const path = usePathname()
  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface md:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex h-14 items-center px-6">
          <Logo />
        </div>
        <NavBody path={path} />
      </div>
    </aside>
  )
}

export function MobileNav() {
  const path = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open])

  const current = [...GROUPS.flatMap((g) => g.items), { href: "/settings", label: "Settings" }].find((i) =>
    isActive(path, i.href),
  )

  return (
    <div className="sticky top-0 z-30 md:hidden">
      <div className="flex h-14 items-center justify-between border-b border-line bg-surface pl-4 pr-2">
        <Logo />
        <div className="flex items-center gap-2">
          {current && <span className="text-small text-fg-faint">{current.label}</span>}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-fg-muted hover:bg-raised hover:text-fg"
            aria-label="Open navigation"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-surface shadow-float">
            <div className="flex h-14 items-center justify-between pl-6 pr-2">
              <Logo />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md text-fg-muted hover:bg-raised hover:text-fg"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <NavBody path={path} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
