"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react"
import { clsx } from "clsx"
import { Logo } from "@/components/logo"
import { backend, isDemoMode, onDemoModeChange } from "@/lib/backend"

const LINKS = [
  { href: "/", label: "Overview" },
  { href: "/fleet", label: "Fleet" },
  { href: "/alarms", label: "Alarms" },
  { href: "/traces", label: "Traces" },
  { href: "/metrics", label: "Metrics" },
  { href: "/missions", label: "Missions" },
  { href: "/connect", label: "Connect" },
]

export const HF_DEMO_URL = "https://huggingface.co/spaces/Ghostgim/ghostloop-demo"
export const GITHUB_URL = "https://github.com/joemunene-by/ghostloop"
const THEME_KEY = "ghostloop_theme"

function isActive(path: string, href: string) {
  return href === "/" ? path === "/" : path.startsWith(href)
}

type Mode = "checking" | "live" | "demo" | "unreachable"

function useBackendMode(): Mode {
  const [state, setState] = useState<Mode>("checking")
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
  return state
}

function BackendWord({ mode }: { mode: Mode }) {
  const label = { checking: "Checking", live: "Live", demo: "Demo data", unreachable: "Unreachable" }[mode]
  return (
    <p className="text-small text-ink-3" title={process.env.NEXT_PUBLIC_BACKEND_LABEL || "/api/backend"}>
      Backend{" "}
      <span className={clsx("font-medium", mode === "unreachable" ? "font-semibold text-alarm" : "text-ink")}>
        {label}
      </span>
    </p>
  )
}

function currentTheme(): "light" | "dark" {
  const set = document.documentElement.dataset.theme
  if (set === "light" || set === "dark") return set
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null)
  useEffect(() => setTheme(currentTheme()), [])

  function toggle() {
    const next = currentTheme() === "dark" ? "light" : "dark"
    document.documentElement.dataset.theme = next
    try {
      window.localStorage.setItem(THEME_KEY, next)
    } catch {}
    setTheme(next)
  }

  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-r text-ink-2 transition-colors hover:bg-sheet hover:text-ink active:translate-y-px"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
    </button>
  )
}

export function TopBar() {
  const path = usePathname()
  const mode = useBackendMode()
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

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-paper">
      <div className="mx-auto flex h-14 max-w-[1440px] items-stretch gap-8 px-4 sm:px-6 xl:px-10">
        <div className="flex items-center">
          <Logo />
        </div>
        <nav aria-label="Main" className="hidden items-stretch gap-6 lg:flex">
          {LINKS.map((l) => {
            const active = isActive(path, l.href)
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "-mb-px flex items-center border-b-2 text-[14px] transition-colors",
                  active ? "border-ink font-medium text-ink" : "border-transparent text-ink-2 hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            )
          })}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden sm:block">
            <BackendWord mode={mode} />
          </div>
          <Link
            href="/settings"
            aria-current={isActive(path, "/settings") ? "page" : undefined}
            className={clsx(
              "hidden h-10 items-center text-[14px] lg:flex",
              isActive(path, "/settings") ? "font-medium text-ink underline underline-offset-[6px]" : "text-ink-2 hover:text-ink",
            )}
          >
            Settings
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-r text-ink-2 hover:bg-sheet hover:text-ink lg:hidden"
            aria-label="Open navigation"
            aria-expanded={open}
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-[300px] max-w-[85vw] flex-col bg-paper shadow-float">
            <div className="flex h-14 items-center justify-between border-b border-rule pl-6 pr-2">
              <BackendWord mode={mode} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-r text-ink-2 hover:bg-sheet hover:text-ink"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <nav aria-label="Main" className="flex-1 overflow-y-auto px-6 py-4">
              {[...LINKS, { href: "/settings", label: "Settings" }].map((l) => {
                const active = isActive(path, l.href)
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "flex h-12 items-center justify-between border-b border-rule text-[17px]",
                      active ? "font-semibold text-ink" : "text-ink-2",
                    )}
                  >
                    {l.label}
                    {active && <span className="text-small font-normal text-ink-3">Current</span>}
                  </Link>
                )
              })}
            </nav>
            <div className="space-y-1 px-6 pb-6">
              <ExternalLinks />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function ExternalLinks() {
  return (
    <>
      <a href={HF_DEMO_URL} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 text-small text-ink-2 hover:text-ink">
        Live demo on Hugging Face
        <ArrowUpRight className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
      </a>
      <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex h-10 items-center gap-2 text-small text-ink-2 hover:text-ink">
        Source on GitHub
        <ArrowUpRight className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
      </a>
    </>
  )
}

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 xl:px-10">
      <div className="flex flex-col gap-2 border-t border-rule py-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-ink-3">
          ghostloop runs every robot command through five safety gates and records what happened.
        </p>
        <div className="flex gap-6">
          <ExternalLinks />
        </div>
      </div>
    </footer>
  )
}
