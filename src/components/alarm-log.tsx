"use client"

import { useState } from "react"
import { clsx } from "clsx"
import { backend, type Alarm } from "@/lib/backend"
import { clock, Severity, timeAgo } from "@/components/ui"

export function AlarmLog({
  alarms,
  now,
  onAcked,
}: {
  alarms: Alarm[]
  now: number
  onAcked: (alarm: Alarm) => void | Promise<void>
}) {
  return (
    <ol className="border-b border-rule">
      {alarms.map((a) => (
        <AlarmRow key={a.id} alarm={a} now={now} onAcked={onAcked} />
      ))}
    </ol>
  )
}

function AlarmRow({
  alarm,
  now,
  onAcked,
}: {
  alarm: Alarm
  now: number
  onAcked: (alarm: Alarm) => void | Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  async function ack() {
    if (busy) return
    setBusy(true)
    setFailed(false)
    try {
      await backend.ackAlarm(alarm.id, "operator")
      await onAcked(alarm)
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li
      className={clsx(
        "grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-rule py-4 md:grid-cols-[88px_76px_minmax(0,1fr)_auto] md:gap-x-6",
        alarm.acked && "text-ink-3",
      )}
    >
      <p className="font-mono text-mono text-ink tnum" title={new Date(alarm.raised_at * 1000).toLocaleString()}>
        {clock(alarm.raised_at)}
        <span className="hidden text-small font-sans text-ink-3 md:block">{timeAgo(alarm.raised_at, now)}</span>
      </p>
      <p className="text-[14px] leading-5">
        <Severity severity={alarm.severity} muted={alarm.acked} />
        <span className="text-small text-ink-3 md:hidden"> · {timeAgo(alarm.raised_at, now)}</span>
      </p>
      <div className="col-span-2 min-w-0 md:col-span-1">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-mono">
          <span className={clsx("font-medium", alarm.acked ? "text-ink-2" : "text-ink")}>{alarm.kind}</span>
          <span className="text-ink-2">{alarm.robot ?? "whole fleet"}</span>
        </p>
        <p className="mt-1 max-w-[84ch] text-[14px] leading-5 text-ink-2">{alarm.message}</p>
        {failed && (
          <p role="alert" className="mt-2 text-small font-semibold text-alarm">
            Couldn&apos;t acknowledge. Check the backend and try again.
          </p>
        )}
      </div>
      <div className="col-span-2 md:col-span-1 md:text-right">
        {alarm.acked ? (
          <p className="text-small text-ink-3">
            Acknowledged
            {alarm.acked_at ? (
              <>
                {" "}
                <span className="font-mono tnum">{clock(alarm.acked_at, false)}</span>
              </>
            ) : null}
            {alarm.acked_by ? <span className="block">by {alarm.acked_by}</span> : null}
          </p>
        ) : (
          <button type="button" className="btn btn-secondary btn-row" disabled={busy} aria-busy={busy} onClick={ack}>
            {busy ? "Acknowledging" : "Acknowledge"}
          </button>
        )}
      </div>
    </li>
  )
}

const TICK: Record<Alarm["severity"], string> = {
  error: "bg-alarm h-full",
  warn: "bg-ink h-2/3",
  info: "bg-ink-3 h-1/3",
}

export function trackHours(alarms: Alarm[], nowS: number): number {
  const oldest = Math.min(nowS, ...alarms.map((a) => a.raised_at))
  return [1, 6, 24].find((h) => nowS - oldest < h * 3600 * 0.95) ?? 24
}

export function AlarmTrack({ alarms, nowS, hours = 24 }: { alarms: Alarm[]; nowS: number; hours?: number }) {
  const [hover, setHover] = useState<Alarm | null>(null)
  const from = nowS - hours * 3600
  const pct = (t: number) => ((t - from) / (nowS - from)) * 100
  const inRange = alarms.filter((a) => a.raised_at >= from)
  const step = (hours * 3600) / 6
  const grid: number[] = []
  for (let t = Math.ceil(from / step) * step; t <= nowS; t += step) grid.push(t)

  function read(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let best: Alarm | null = null
    let dist = 10
    for (const a of inRange) {
      const d = Math.abs((pct(a.raised_at) / 100) * rect.width - x)
      if (d < dist) {
        dist = d
        best = a
      }
    }
    setHover(best)
  }

  return (
    <div>
      <div
        className="relative h-14 cursor-crosshair touch-pan-y border-b border-ink"
        onPointerMove={read}
        onPointerDown={read}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`${inRange.length} alarms raised in the last ${hours} hours`}
      >
        {grid.map((t) => (
          <span key={t} aria-hidden="true" className="absolute inset-y-0 w-px bg-rule" style={{ left: `${pct(t)}%` }} />
        ))}
        <span aria-hidden="true" className="absolute inset-y-0 right-0 w-px bg-ink" />
        {inRange.map((a) => (
          <span
            key={a.id}
            aria-hidden="true"
            className={clsx("absolute bottom-0 w-0.5 -translate-x-1/2", TICK[a.severity], a.acked && "opacity-50")}
            style={{ left: `${pct(a.raised_at)}%` }}
          />
        ))}
        {hover && (
          <p
            className="pointer-events-none absolute -top-2 z-20 whitespace-nowrap rounded-r bg-ink px-2 py-1 font-mono text-mono-sm text-paper shadow-float"
            style={{
              left: `${pct(hover.raised_at)}%`,
              transform: `translateY(-100%) ${pct(hover.raised_at) > 80 ? "translateX(-100%)" : pct(hover.raised_at) < 20 ? "" : "translateX(-50%)"}`,
            }}
          >
            {clock(hover.raised_at)} · {hover.kind}
            {hover.robot ? ` · ${hover.robot}` : ""}
            {hover.acked ? " · acknowledged" : ""}
          </p>
        )}
      </div>
      <div className="relative h-6" aria-hidden="true">
        {grid.map((t, i) => {
          const x = pct(t)
          if (x > 92 || x < 3) return null
          return (
            <span
              key={t}
              className={clsx("absolute top-1 -translate-x-1/2 font-mono text-mono-sm text-ink-3 tnum", i % 2 === 1 && "hidden sm:block")}
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
