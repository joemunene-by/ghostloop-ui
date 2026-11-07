"use client"

import { useCallback, useEffect, useState } from "react"
import { clsx } from "clsx"
import { backend, type Alarm } from "@/lib/backend"
import { AlarmLog, AlarmTrack, trackHours } from "@/components/alarm-log"
import { Loading, Notice, PageHeader, plural, Section, severityCounts, useNow } from "@/components/ui"

export default function AlarmsPage() {
  const [all, setAll] = useState<Alarm[]>([])
  const [includeAcked, setIncludeAcked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const now = useNow(5000)

  const refresh = useCallback(async () => {
    try {
      const r = await backend.listAlarms(true, 100)
      setAll([...r.alarms].sort((a, b) => b.raised_at - a.raised_at))
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
  }, [refresh])

  const active = all.filter((a) => !a.acked)
  const acked = all.filter((a) => a.acked)
  const alarms = includeAcked ? all : active
  const hours = trackHours(all, now / 1000)

  if (loading) return <Loading label="Loading alarms" />

  const title =
    active.length === 0
      ? "No open alarms."
      : `${plural(active.length, "open alarm")}. ${severityCounts(active).replace(/^./, (c) => c.toUpperCase())}.`

  return (
    <div className="space-y-12">
      <PageHeader
        title={title}
        description="Safety gate denials, missed deadlines and property violations, newest first. Acknowledging records who saw it and when."
      />

      <Section
        title={hours === 1 ? "Last hour" : `Last ${hours} hours`}
        aside={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-2">
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-3 w-0.5 bg-alarm" />
              Critical
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-2 w-0.5 bg-ink" />
              Warning
            </span>
            <span className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="inline-block h-1 w-0.5 bg-ink-3" />
              Info
            </span>
          </span>
        }
      >
        <div className="border-t border-rule pt-10">
          <AlarmTrack alarms={all} nowS={now / 1000} hours={hours} />
        </div>
      </Section>

      <Section
        title="Log"
        aside={
          <AckedToggle checked={includeAcked} onChange={setIncludeAcked} count={acked.length} />
        }
      >
        {failed && all.length === 0 ? (
          <Notice title="Couldn't load alarms">
            The backend didn&apos;t answer. This page tries again every 3 seconds. Check the backend word in the top bar,
            or the Settings page.
          </Notice>
        ) : alarms.length === 0 ? (
          <Notice title="Nothing open">
            Safety gate denials and property violations are logged here. Turn on Show acknowledged to see past ones.
          </Notice>
        ) : (
          <AlarmLog alarms={alarms} now={now} onAcked={refresh} />
        )}
      </Section>
    </div>
  )
}

function AckedToggle({
  checked,
  onChange,
  count,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  count: number | null
}) {
  return (
    <label className="inline-flex h-10 cursor-pointer select-none items-center gap-3 text-[14px] text-ink-2">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={clsx(
          "inline-flex h-4 w-4 items-center justify-center rounded-r border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
          checked ? "border-ink bg-ink" : "border-rule-strong bg-sheet",
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3 text-paper" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.5 6.2 5 8.5l4.5-5" />
          </svg>
        )}
      </span>
      Show acknowledged
      {count !== null && <span className="font-mono text-mono-sm text-ink-3 tnum">{count}</span>}
    </label>
  )
}
