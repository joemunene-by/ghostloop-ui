import type { Alarm, RobotSnapshot } from "@/lib/backend"

export type RobotState = RobotSnapshot["status"]
export type Segment = { state: RobotState; start: number; end: number }

export const WINDOW_S = 30 * 60

export function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function rng(seed: number) {
  let a = seed || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Plausible 40 minutes of history ending in the robot's current status, for demo mode only.
 * An errored robot with an open critical alarm turns to error at that alarm's raise time.
 */
export function sampleHistory(robot: RobotSnapshot, alarms: Alarm[], anchor: number): Segment[] {
  const rand = rng(hashString(robot.name))
  const from = anchor - 40 * 60
  const critical = alarms
    .filter((a) => a.robot === robot.name && a.severity === "error")
    .sort((a, b) => b.raised_at - a.raised_at)[0]

  let tailStart = anchor - (180 + Math.floor(rand() * 360))
  if (robot.status === "error" && critical && critical.raised_at > from && critical.raised_at < anchor) {
    tailStart = critical.raised_at
  }

  // a robot that faulted was working when it did
  const baseEnd = robot.status === "error" ? tailStart - 240 : tailStart
  const segments: Segment[] = []
  let t = from
  let state: RobotState = rand() > 0.5 ? "busy" : "idle"
  let usedOffline = false
  while (t < baseEnd) {
    const end = Math.min(t + 120 + Math.floor(rand() * 420), baseEnd)
    segments.push({ state, start: t, end })
    t = end
    if (!usedOffline && state === "idle" && rand() > 0.8) {
      state = "offline"
      usedOffline = true
    } else {
      state = state === "busy" ? "idle" : "busy"
    }
  }
  if (robot.status === "error") segments.push({ state: "busy", start: baseEnd, end: tailStart })
  segments.push({ state: robot.status, start: tailStart, end: anchor })
  return merge(segments)
}

function merge(segments: Segment[]): Segment[] {
  const out: Segment[] = []
  for (const s of segments) {
    if (s.end <= s.start) continue
    const prev = out[out.length - 1]
    if (prev && prev.state === s.state && Math.abs(prev.end - s.start) < 1) prev.end = s.end
    else out.push({ ...s })
  }
  return out
}

/** Extends the last segment if the state is unchanged, otherwise starts a new one at `now`. */
export function observe(history: Segment[], state: RobotState, now: number, maxGapS = 30): Segment[] {
  const last = history[history.length - 1]
  if (last && last.state === state && now - last.end <= maxGapS) {
    return [...history.slice(0, -1), { ...last, end: now }]
  }
  const start = last && now - last.end <= maxGapS ? last.end : now
  return [...history, { state, start, end: now }]
}

export function extendTo(segments: Segment[], state: RobotState, now: number): Segment[] {
  if (!segments.length) return segments
  const last = segments[segments.length - 1]
  if (now <= last.end) return segments
  if (last.state === state) return [...segments.slice(0, -1), { ...last, end: now }]
  return [...segments, { state, start: last.end, end: now }]
}

export function clip(segments: Segment[], from: number, to: number): Segment[] {
  return segments
    .filter((s) => s.end > from && s.start < to)
    .map((s) => ({ ...s, start: Math.max(s.start, from), end: Math.min(s.end, to) }))
}

export function segmentAt(segments: Segment[], t: number): Segment | null {
  return segments.find((s) => t >= s.start && t <= s.end) ?? null
}

export function currentSince(segments: Segment[]): number | null {
  return segments.length ? segments[segments.length - 1].start : null
}

export function ticks(from: number, to: number, stepS: number): number[] {
  const out: number[] = []
  for (let t = Math.ceil(from / stepS) * stepS; t <= to; t += stepS) out.push(t)
  return out
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  if (s < 60) return `${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} h ${rest} min` : `${h} h`
}

export function totals(segments: Segment[]): Partial<Record<RobotState, number>> {
  const out: Partial<Record<RobotState, number>> = {}
  for (const s of segments) out[s.state] = (out[s.state] ?? 0) + (s.end - s.start)
  return out
}
