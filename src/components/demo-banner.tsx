"use client"

import { useEffect, useState } from "react"
import { Sparkles, X } from "lucide-react"
import { onDemoModeChange } from "@/lib/backend"

const DISMISS_KEY = "ghostloop_demo_banner_dismissed"

export function DemoBanner() {
  const [demo, setDemo] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1")
    const off = onDemoModeChange(setDemo)
    return off
  }, [])

  if (!demo || dismissed) return null

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1")
    setDismissed(true)
  }

  return (
    <div className="bg-[var(--color-primary)]/10 border-b border-[var(--color-primary)]/30 px-6 py-3 flex items-center gap-3 text-sm">
      <Sparkles className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
      <div className="flex-1">
        <span className="font-medium">Demo mode</span>
        <span className="text-[var(--color-text-muted)] ml-2">
          showing fixtures because <code>GHOSTLOOP_BACKEND_URL</code> isn&apos;t
          set. Wire it to a real{" "}
          <a
            href="https://github.com/joemunene-by/ghostloop"
            className="text-[var(--color-primary)] hover:underline"
          >
            ghostloop
          </a>{" "}
          backend to see live data.{" "}
          <a href="/settings" className="text-[var(--color-primary)] hover:underline">
            Setup guide
          </a>
        </span>
      </div>
      <button
        onClick={dismiss}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
