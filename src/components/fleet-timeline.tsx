"use client"

import { useState } from "react"
import { clsx } from "clsx"
import type { Alarm, RobotSnapshot } from "@/lib/backend"
import {
  clip,
  currentSince,
  formatDuration,
  segmentAt,
  ticks,
  totals,
  WINDOW_S,
  type RobotState,
  type Segment,
} from "@/lib/timeline"
import { clock, SEVERITY, StateWord, stateLabel } from "@/components/ui"

const FILL: Record<RobotState, string> = {
  busy: "fill-busy",
  idle: "fill-idle",
  offline: "fill-offline",
  error: "fill-error",
}

const MARKER: Record<Alarm["severity"], string> = {
  error: "bg-alarm",
  warn: "bg-ink",
  info: "bg-ink-3",
}

const GRID = "md:grid-cols-[minmax(150px,200px)_80px_minmax(0,1fr)_88px]"

type Readout = { x: number; text: string }

function pct(t: number, from: number, span: number) {
  return ((t - from) / span) * 100
}

export function Legend() {
  const items: [RobotState, string][] = [
    ["busy", "Busy"],
    ["idle", "Idle"],
    ["offline", "Offline"],
    ["error", "Error"],
  ]
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-small text-ink-2">
      {items.map(([s, label]) => (
        <li key={s} className="inline-flex items-center gap-2">
          <span aria-hidden="true" className={clsx("inline-block h-2 w-4", FILL[s])} />
          {label}
        </li>
      ))}
      <li className="inline-flex items-center gap-2">
        <span aria-hidden="true" className="inline-block h-3 w-0.5 bg-ink" />
        Alarm
      </li>
    </ul>
  )
}

export function Strip({
  segments,
  alarms,
  from,
  to,
  height = "h-4 md:h-5",
  gridTicks = [],
}: {
  segments: Segment[]
  alarms: Alarm[]
  from: number
  to: number
  height?: string
  gridTicks?: number[]
}) {
  const [readout, setReadout] = useState<Readout | null>(null)
  const span = to - from
  const visible = clip(segments, from, to)
  const markers = alarms.filter((a) => a.raised_at >= from && a.raised_at <= to)

  function read(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const t = from + frac * span
    const near = markers.find((a) => Math.abs(pct(a.raised_at, from, span) / 100 - frac) * rect.width < 6)
    if (near) {
      setReadout({ x: frac * 100, text: `${SEVERITY[near.severity].label} ${near.kind} at ${clock(near.raised_at)}` })
      return
    }
    const seg = segmentAt(visible, t)
    if (!seg) {
      setReadout({ x: frac * 100, text: `Not recorded at ${clock(t, false)}` })
      return
    }
    const end = seg.end >= to - 1 ? "now" : clock(seg.end, false)
    setReadout({
      x: frac * 100,
      text: `${stateLabel(seg.state)} ${clock(seg.start, false)} to ${end}, ${formatDuration(seg.end - seg.start)}`,
    })
  }

  const t = totals(visible)
  const summary =
    (Object.keys(t) as RobotState[]).map((s) => `${stateLabel(s)} ${formatDuration(t[s] ?? 0)}`).join(", ") ||
    "No state recorded"

  return (
    <div
      className="relative h-full min-h-10 cursor-crosshair touch-pan-y"
      onPointerMove={read}
      onPointerDown={read}
      onPointerLeave={() => setReadout(null)}
      role="img"
      aria-label={`Last ${Math.round(span / 60)} minutes: ${summary}. ${markers.length} alarms.`}
    >
      {gridTicks.map((tk) => (
        <span
          key={tk}
          aria-hidden="true"
          className="absolute inset-y-0 w-px bg-rule"
          style={{ left: `${pct(tk, from, span)}%` }}
        />
      ))}
      <span aria-hidden="true" className="absolute inset-y-0 right-0 w-px bg-ink" />
      <div className={clsx("absolute inset-x-0 top-1/2 -translate-y-1/2 fill-none", height)}>
        {visible.map((s, i) => (
          <span
            key={i}
            className={clsx("absolute inset-y-0", FILL[s.state])}
            style={{ left: `${pct(s.start, from, span)}%`, width: `${Math.max(0.2, ((s.end - s.start) / span) * 100)}%` }}
          />
        ))}
        {markers.map((a) => (
          <span
            key={a.id}
            aria-hidden="true"
            className={clsx("absolute -top-2 bottom-0 w-0.5 outline outline-2 outline-paper", MARKER[a.severity])}
            style={{ left: `calc(${pct(a.raised_at, from, span)}% - 1px)` }}
          />
        ))}
      </div>
      {readout && (
        <p
          className="pointer-events-none absolute bottom-[calc(50%+16px)] z-20 whitespace-nowrap rounded-r bg-ink px-2 py-1 font-mono text-mono-sm text-paper shadow-float"
          style={{
            left: `${readout.x}%`,
            transform: readout.x < 20 ? "none" : readout.x > 80 ? "translateX(-100%)" : "translateX(-50%)",
          }}
        >
          {readout.text}
        </p>
      )}
    </div>
  )
}

export function FleetTimeline({
  robots,
  history,
  alarms,
  now,
}: {
  robots: RobotSnapshot[]
  history: Record<string, Segment[]>
  alarms: Alarm[]
  now: number
}) {
  const to = now / 1000
  const from = to - WINDOW_S
  const tickList = ticks(from, to, 5 * 60)

  return (
    <div>
      <div role="list" className="border-b border-rule">
        {robots.map((r) => {
          const segs = history[r.name] ?? []
          const since = currentSince(clip(segs, from - 6 * 3600, to))
          return (
            <div
              role="listitem"
              key={r.name}
              className={clsx("grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 border-t border-rule md:min-h-16 md:items-center", GRID)}
            >
              <p className="truncate pt-3 font-mono text-mono font-medium text-ink md:pt-0">{r.name}</p>
              <p className="pt-3 text-right text-[14px] md:pt-0 md:text-left">
                <StateWord status={r.status} />
              </p>
              <div className="col-span-2 md:col-span-1 md:self-stretch">
                <Strip
                  segments={segs}
                  alarms={alarms.filter((a) => a.robot === r.name)}
                  from={from}
                  to={to}
                  gridTicks={tickList}
                />
              </div>
              <p className="col-span-2 pb-3 font-mono text-mono-sm text-ink-3 tnum md:col-span-1 md:pb-0 md:text-right">
                {since !== null ? `for ${formatDuration(to - since)}` : "no record"}
              </p>
            </div>
          )
        })}
      </div>
      <div className={clsx("grid grid-cols-1 gap-x-4", GRID)}>
        <span className="hidden md:block" />
        <span className="hidden md:block" />
        <div className="relative h-6" aria-hidden="true">
          {tickList.map((tk, i) => {
            const x = pct(tk, from, WINDOW_S)
            if (x > 92) return null
            return (
              <span
                key={tk}
                className={clsx(
                  "absolute top-1 -translate-x-1/2 font-mono text-mono-sm text-ink-3 tnum",
                  i % 2 === 1 && "hidden sm:block",
                )}
                style={{ left: `${x}%` }}
              >
                {clock(tk, false)}
              </span>
            )
          })}
          <span className="absolute right-0 top-1 font-mono text-mono-sm font-medium text-ink">now</span>
        </div>
        <span className="hidden md:block" />
      </div>
    </div>
  )
}
