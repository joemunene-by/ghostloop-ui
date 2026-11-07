"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { onDemoModeChange } from "@/lib/backend"

const DISMISS_KEY = "ghostloop_demo_banner_dismissed"

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1"
  } catch {
    return false
  }
}

export function DemoBanner() {
  const [demo, setDemo] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(readDismissed())
    return onDemoModeChange(setDemo)
  }, [])

  if (!demo || dismissed) return null

  function dismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1")
    } catch {}
    setDismissed(true)
  }

  return (
    <div className="flex items-start gap-3 border-b border-line bg-surface py-3 pl-4 pr-2 sm:items-center sm:pl-8">
      <p className="min-w-0 flex-1 text-small text-fg-muted">
        <span className="font-semibold text-fg">Demo mode.</span>{" "}
        Showing sample data because <code className="code-inline">GHOSTLOOP_BACKEND_URL</code> isn&apos;t set.
        Point it at a real{" "}
        <a href="https://github.com/joemunene-by/ghostloop" className="link">
          ghostloop
        </a>{" "}
        backend to see live data.{" "}
        <Link href="/settings" className="link">
          Setup guide
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="-my-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-fg-faint hover:bg-raised hover:text-fg"
        aria-label="Dismiss demo notice"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  )
}
