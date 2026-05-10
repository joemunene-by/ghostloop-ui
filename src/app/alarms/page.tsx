"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, CircleCheck, Loader2 } from "lucide-react"
import { backend, type Alarm } from "@/lib/backend"

export default function AlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [includeAcked, setIncludeAcked] = useState(false)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    try {
      const r = await backend.listAlarms(includeAcked, 100)
      setAlarms(r.alarms)
    } catch {
      // backend not reachable, handled by overview page
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeAcked])

  const active = alarms.filter((a) => !a.acked)
  const acked = alarms.filter((a) => a.acked)

  return (
    <div className="max-w-6xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-1">Alarms</h1>
          <p className="text-[var(--color-text-muted)]">
            {active.length} active · {acked.length} acknowledged
          </p>
        </div>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeAcked}
            onChange={(e) => setIncludeAcked(e.target.checked)}
          />
          Show acknowledged
        </label>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : alarms.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-8 text-center">
          <CircleCheck className="w-8 h-8 text-[var(--color-ok)] mx-auto mb-2" />
          <p className="font-medium">All clear</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            No active alarms. Property violations + safety-pipeline denials raise alarms here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alarms.map((a) => <AlarmRow key={a.id} alarm={a} onAck={refresh} />)}
        </div>
      )}
    </div>
  )
}

function AlarmRow({ alarm, onAck }: { alarm: Alarm; onAck: () => void }) {
  const tone: Record<string, string> = {
    info: "border-[var(--color-primary)]/40",
    warn: "border-[var(--color-warn)]/40",
    error: "border-[var(--color-error)]/40",
  }
  const dotTone: Record<string, string> = {
    info: "bg-[var(--color-primary)]",
    warn: "bg-[var(--color-warn)]",
    error: "bg-[var(--color-error)]",
  }
  return (
    <div
      className={`bg-[var(--color-bg-card)] border ${tone[alarm.severity] || tone.info} rounded-xl p-4 flex items-start gap-3`}
    >
      <span className={`w-2 h-2 rounded-full mt-2 ${dotTone[alarm.severity] || dotTone.info}`} />
      <div className="flex-1 min-w-0">
        <p className="font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[var(--color-warn)]" />
          {alarm.kind}
          {alarm.robot && (
            <span className="font-mono text-xs text-[var(--color-text-muted)]">
              · {alarm.robot}
            </span>
          )}
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">{alarm.message}</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          raised {new Date(alarm.raised_at * 1000).toLocaleString()}
          {alarm.acked && alarm.acked_by && ` · acked by ${alarm.acked_by}`}
        </p>
      </div>
      {!alarm.acked && (
        <button
          className="text-xs px-3 py-1 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          onClick={async () => {
            await backend.ackAlarm(alarm.id, "operator")
            onAck()
          }}
        >
          Acknowledge
        </button>
      )}
    </div>
  )
}
