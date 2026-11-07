import { describe, expect, it } from "vitest"
import type { Alarm, RobotSnapshot } from "./backend"
import { clip, extendTo, formatDuration, observe, sampleHistory, segmentAt, ticks, totals } from "./timeline"

const robot = (name: string, status: RobotSnapshot["status"]): RobotSnapshot => ({
  name,
  status,
  labels: [],
  last_seen: 0,
})

const alarm = (robotName: string, raised_at: number): Alarm => ({
  id: "a1",
  kind: "force_cap_violation",
  severity: "error",
  robot: robotName,
  message: "",
  raised_at,
  acked: false,
  acked_at: null,
  acked_by: null,
})

describe("sampleHistory", () => {
  const anchor = 1_800_000_000

  it("covers the window without gaps and ends in the current status", () => {
    const segs = sampleHistory(robot("franka-lab-01", "idle"), [], anchor)
    expect(segs[0].start).toBe(anchor - 40 * 60)
    expect(segs[segs.length - 1]).toMatchObject({ state: "idle", end: anchor })
    for (let i = 1; i < segs.length; i++) expect(segs[i].start).toBe(segs[i - 1].end)
  })

  it("is deterministic per robot name", () => {
    const a = sampleHistory(robot("spot-roof-01", "busy"), [], anchor)
    const b = sampleHistory(robot("spot-roof-01", "busy"), [], anchor)
    expect(a).toEqual(b)
  })

  it("starts an errored robot's error at its critical alarm", () => {
    const raised = anchor - 120
    const segs = sampleHistory(robot("tello-aerial-01", "error"), [alarm("tello-aerial-01", raised)], anchor)
    const last = segs[segs.length - 1]
    expect(last).toMatchObject({ state: "error", start: raised, end: anchor })
    expect(segs[segs.length - 2].state).toBe("busy")
  })
})

describe("observe", () => {
  it("extends the open segment while the state holds", () => {
    let h = observe([], "idle", 100)
    h = observe(h, "idle", 105)
    expect(h).toEqual([{ state: "idle", start: 100, end: 105 }])
  })

  it("starts a new segment at the previous end when the state changes", () => {
    let h = observe([], "idle", 100)
    h = observe(h, "busy", 105)
    expect(h).toEqual([
      { state: "idle", start: 100, end: 100 },
      { state: "busy", start: 100, end: 105 },
    ])
  })

  it("leaves a gap when polling stopped for longer than the limit", () => {
    let h = observe([], "idle", 100)
    h = observe(h, "idle", 500)
    expect(h[1]).toEqual({ state: "idle", start: 500, end: 500 })
  })
})

describe("helpers", () => {
  const segs = [
    { state: "idle" as const, start: 0, end: 60 },
    { state: "busy" as const, start: 60, end: 200 },
  ]

  it("clips to a window", () => {
    expect(clip(segs, 30, 100)).toEqual([
      { state: "idle", start: 30, end: 60 },
      { state: "busy", start: 60, end: 100 },
    ])
  })

  it("finds the segment at a time", () => {
    expect(segmentAt(segs, 61)?.state).toBe("busy")
    expect(segmentAt(segs, 500)).toBeNull()
  })

  it("extends to now with the current state", () => {
    expect(extendTo(segs, "error", 260).at(-1)).toEqual({ state: "error", start: 200, end: 260 })
  })

  it("totals time per state", () => {
    expect(totals(segs)).toEqual({ idle: 60, busy: 140 })
  })

  it("places ticks on whole steps", () => {
    expect(ticks(110, 400, 100)).toEqual([200, 300, 400])
  })

  it("formats durations", () => {
    expect(formatDuration(42)).toBe("42 s")
    expect(formatDuration(600)).toBe("10 min")
    expect(formatDuration(5400)).toBe("1 h 30 min")
  })
})
