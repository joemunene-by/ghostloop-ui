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
    <div className="border-b border-rule">
      <div className="mx-auto flex max-w-[1440px] items-start gap-3 py-2 pl-4 pr-2 sm:items-center sm:pl-6 xl:pl-10 xl:pr-8">
        <p className="min-w-0 flex-1 py-1 text-small text-ink-2">
          <span className="font-semibold text-ink">Demo mode.</span> Sample data, because{" "}
          <code className="code-inline">GHOSTLOOP_BACKEND_URL</code> isn&apos;t set. Point it at a running ghostloop
          backend to see your own robots.{" "}
          <Link href="/settings" className="link">
            Setup guide
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-r text-ink-3 hover:bg-sheet hover:text-ink"
          aria-label="Dismiss demo notice"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  )
}
