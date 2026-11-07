"use client"

import { useCallback, useEffect, useState } from "react"
import { clsx } from "clsx"
import { backend, type Alarm } from "@/lib/backend"
import { Loading, Notice, PageHeader, Severity, timeAgo, useNow } from "@/components/ui"

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [includeAcked, setIncludeAcked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const now = useNow()

  const refresh = useCallback(async () => {
    try {
      const r = await backend.listAlarms(includeAcked, 100)
      setAlarms(r.alarms)
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [includeAcked])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
  }, [refresh])

  const active = alarms.filter((a) => !a.acked)
  const acked = alarms.filter((a) => a.acked)

  if (loading) return <Loading label="Loading alarms" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alarms"
        description={
          <span className="tnum">
            {active.length} open{includeAcked ? ` · ${acked.length} acknowledged` : ""}
          </span>
        }
        aside={<AckedToggle checked={includeAcked} onChange={setIncludeAcked} />}
      />

      {failed && alarms.length === 0 ? (
        <Notice title="Couldn't load alarms">
          The backend didn&apos;t answer. This page retries every 3 seconds; check the Backend status in
          the sidebar or the Settings page.
        </Notice>
      ) : alarms.length === 0 ? (
        <Notice title="No open alarms">
          Safety-gate denials and property violations raise alarms here. Turn on Show acknowledged to see
          past ones.
        </Notice>
      ) : (
        <section className="panel overflow-hidden">
          <ul className="divide-y divide-line">
            {alarms.map((a) => (
              <AlarmRow key={a.id} alarm={a} now={now} onAck={refresh} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function AckedToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex h-10 cursor-pointer select-none items-center gap-3 text-body text-fg-muted">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden="true"
        className={clsx(
          "relative h-5 w-9 rounded-full border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fg-muted",
          checked ? "border-fg bg-fg" : "border-line-strong bg-raised",
        )}
      >
        <span
          className={clsx(
            "absolute top-[2px] h-3.5 w-3.5 rounded-full transition-transform",
            checked ? "translate-x-[18px] bg-bg" : "translate-x-[2px] bg-fg-muted",
          )}
        />
      </span>
      Show acknowledged
    </label>
  )
}

function AlarmRow({ alarm, now, onAck }: { alarm: Alarm; now: number; onAck: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const raised = new Date(alarm.raised_at * 1000)

  async function ack() {
    setBusy(true)
    setFailed(false)
    try {
      await backend.ackAlarm(alarm.id, "operator")
      await onAck()
    } catch {
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-[96px_1fr_auto] md:gap-6">
      <div className="pt-px">
        <Severity severity={alarm.severity} muted={alarm.acked} />
      </div>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={clsx("font-mono text-body", alarm.acked ? "text-fg-muted" : "text-fg")}>
            {alarm.kind}
          </span>
          {alarm.robot && <span className="font-mono text-small text-fg-muted">{alarm.robot}</span>}
        </p>
        <p className="mt-1 max-w-[80ch] text-small text-fg-muted">{alarm.message}</p>
        <p className="mt-2 text-small text-fg-faint tnum">
          <span title={raised.toLocaleString()}>Raised {timeAgo(alarm.raised_at, now)}</span>
          <span className="hidden sm:inline"> · {raised.toLocaleString()}</span>
          {alarm.acked && alarm.acked_by && ` · acknowledged by ${alarm.acked_by}`}
        </p>
        {failed && (
          <p className="mt-2 text-small font-semibold text-critical">
            Couldn&apos;t acknowledge. Try again.
          </p>
        )}
      </div>
      <div className="md:text-right">
        {alarm.acked ? (
          <span className="text-small text-fg-faint">Acknowledged</span>
        ) : (
          <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={ack}>
            {busy ? "Acknowledging" : "Acknowledge"}
          </button>
        )}
      </div>
    </li>
  )
}
