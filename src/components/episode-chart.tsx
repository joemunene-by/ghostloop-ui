"use client"

import { useState } from "react"
import { clsx } from "clsx"
import type { Episode } from "@/lib/backend"
import { ticks } from "@/lib/timeline"
import { clock } from "@/components/ui"

export function episodeResult(ep: Episode): string {
  return ep.passed === undefined ? "Not graded" : ep.passed ? "Passed" : "Failed"
}

export function episodeSpan(episodes: Episode[], nowS: number): { from: number; to: number; step: number } {
  const oldest = Math.min(nowS, ...episodes.map((e) => e.started_at))
  const hours = Math.max(1, Math.ceil((nowS - oldest) / 3600))
  const step = hours <= 2 ? 15 * 60 : hours <= 6 ? 3600 : hours <= 24 ? 2 * 3600 : 6 * 3600
  return { from: nowS - hours * 3600 - step / 2, to: nowS, step }
}

export function EpisodeChart({
  episodes,
  nowS,
  height = 96,
  labelEvery = 1,
}: {
  episodes: Episode[]
  nowS: number
  height?: number
  labelEvery?: number
}) {
  const [hover, setHover] = useState<{ x: number; ep: Episode } | null>(null)
  const { from, to, step } = episodeSpan(episodes, nowS)
  const span = to - from
  const max = Math.max(1, ...episodes.map((e) => e.n_events))
  const pct = (t: number) => ((t - from) / span) * 100
  const tickList = ticks(from, to, step)

  function read(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let best: Episode | null = null
    let dist = 10
    for (const ep of episodes) {
      const d = Math.abs((pct(ep.started_at) / 100) * rect.width - x)
      if (d < dist) {
        dist = d
        best = ep
      }
    }
    setHover(best ? { x: pct(best.started_at), ep: best } : null)
  }

  return (
    <div>
      <div
        className="relative cursor-crosshair touch-pan-y border-b border-ink"
        style={{ height }}
        onPointerMove={read}
        onPointerDown={read}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${episodes.length} episodes over the last ${Math.round(span / 3600)} hours. Bar height is the number of events.`}
      >
        {tickList.map((t) => (
          <span key={t} aria-hidden="true" className="absolute inset-y-0 w-px bg-rule" style={{ left: `${pct(t)}%` }} />
        ))}
        {episodes.map((ep) => (
          <span
            key={ep.episode_id}
            aria-hidden="true"
            className={clsx(
              "absolute bottom-0 w-[3px] -translate-x-1/2",
              ep.passed === false ? "bg-idle" : "bg-ink",
              hover?.ep.episode_id === ep.episode_id && "outline outline-2 outline-offset-1 outline-ink",
            )}
            style={{ left: `${pct(ep.started_at)}%`, height: `${Math.max(6, (ep.n_events / max) * 100)}%` }}
          />
        ))}
        {hover && (
          <p
            className="pointer-events-none absolute -top-2 z-20 whitespace-nowrap rounded-r bg-ink px-2 py-1 font-mono text-mono-sm text-paper shadow-float"
            style={{
              left: `${hover.x}%`,
              transform: `translateY(-100%) ${hover.x < 20 ? "" : hover.x > 80 ? "translateX(-100%)" : "translateX(-50%)"}`,
            }}
          >
            {clock(hover.ep.started_at, false)} · {hover.ep.n_events} events · {hover.ep.duration_s.toFixed(1)} s ·{" "}
            {episodeResult(hover.ep)}
          </p>
        )}
      </div>
      <div className="relative h-6" aria-hidden="true">
        {tickList.map((t, i) => {
          const x = pct(t)
          if (x > 90 || x < 3 || i % labelEvery !== 0) return null
          return (
            <span
              key={t}
              className="absolute top-1 -translate-x-1/2 font-mono text-mono-sm text-ink-3 tnum"
              style={{ left: `${x}%` }}
            >
              {clock(t, false)}
            </span>
          )
        })}
        <span className="absolute right-0 top-1 font-mono text-mono-sm font-medium text-ink">now</span>
      </div>
    </div>
  )
}
