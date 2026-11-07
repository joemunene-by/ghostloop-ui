import type { Alarm, RobotSnapshot } from "@/lib/backend"
import { extendTo, observe, sampleHistory, type Segment } from "@/lib/timeline"

const STORAGE_KEY = "ghostloop_observed_history"
const KEEP_S = 2 * 60 * 60

const samples = new Map<string, Segment[]>()
let observed: Record<string, Segment[]> | null = null

function loadObserved(): Record<string, Segment[]> {
  if (observed) return observed
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    observed = raw ? (JSON.parse(raw) as Record<string, Segment[]>) : {}
  } catch {
    observed = {}
  }
  return observed
}

function saveObserved() {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(observed))
  } catch {}
}

/**
 * The backend keeps no state history, so live mode records what this browser has seen while polling.
 * Demo mode returns generated sample history instead; callers must label it as sample data.
 */
export function historyFor(
  robots: RobotSnapshot[],
  alarms: Alarm[],
  demo: boolean,
  now: number,
): Record<string, Segment[]> {
  const out: Record<string, Segment[]> = {}
  if (demo) {
    for (const r of robots) {
      let s = samples.get(r.name)
      if (!s) {
        s = sampleHistory(r, alarms, now)
        samples.set(r.name, s)
      }
      s = extendTo(s, r.status, now)
      samples.set(r.name, s)
      out[r.name] = s
    }
    return out
  }
  const store = loadObserved()
  for (const r of robots) {
    const next = observe(store[r.name] ?? [], r.status, now).filter((seg) => seg.end > now - KEEP_S)
    store[r.name] = next
    out[r.name] = next
  }
  saveObserved()
  return out
}

export function observedSince(history: Record<string, Segment[]>): number | null {
  let min: number | null = null
  for (const segs of Object.values(history)) {
    if (segs.length && (min === null || segs[0].start < min)) min = segs[0].start
  }
  return min
}
