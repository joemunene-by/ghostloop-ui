/**
 * Thin client over the ghostloop production-dashboard FastAPI backend.
 *
 * All requests flow through the Next.js route at
 * `/api/backend/[...path]/route.ts`, which proxies to a real backend
 * when GHOSTLOOP_BACKEND_URL is set, OR returns demo fixtures so the
 * deployed Vercel app is interactive without a configured backend.
 * The route flags demo responses with an `X-Ghostloop-Demo` header;
 * `isDemoMode()` returns true after the most recent fetch sets it.
 */

const BACKEND = "/api/backend"

let lastIsDemo = false
let demoListeners = new Set<(v: boolean) => void>()

export function isDemoMode(): boolean { return lastIsDemo }

export function onDemoModeChange(cb: (v: boolean) => void): () => void {
  demoListeners.add(cb)
  cb(lastIsDemo)
  return () => { demoListeners.delete(cb) }
}

function setDemo(v: boolean) {
  if (lastIsDemo === v) return
  lastIsDemo = v
  demoListeners.forEach((cb) => { try { cb(v) } catch {} })
}

export type Health = { ok: boolean; fleet_attached: boolean }

export type RobotSnapshot = {
  name: string
  status: "idle" | "busy" | "offline" | "error"
  labels: string[]
  last_seen: number
  backend?: string
  position?: number[]
}

export type FleetSnapshot = {
  n_total: number
  n_idle: number
  n_busy: number
  n_offline: number
  n_error: number
  robots: RobotSnapshot[]
}

export type Alarm = {
  id: string
  kind: string
  severity: "info" | "warn" | "error"
  robot: string | null
  message: string
  raised_at: number
  acked: boolean
  acked_at: number | null
  acked_by: string | null
}

export type Episode = {
  episode_id: string
  backend: string
  n_events: number
  started_at: number
  duration_s: number
  passed?: boolean
}

export type StoreStats = {
  n_episodes: number
  n_runs: number
  n_comparisons: number
}

function token(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem("ghostloop_token")
}

async function backendFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers || {})
  const t = token()
  if (t) headers.set("Authorization", `Bearer ${t}`)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  const res = await fetch(`${BACKEND}${path}`, { ...init, headers })
  setDemo(res.headers.get("x-ghostloop-demo") === "1")
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export const backend = {
  health:        () => backendFetch<Health>("/healthz"),
  livez:         () => backendFetch<{ alive: boolean }>("/livez"),
  readyz:        () => backendFetch<{ ready: boolean }>("/readyz"),
  storeStats:    () => backendFetch<StoreStats>("/v1/store/stats"),
  listEpisodes:  (limit = 50) => backendFetch<{ episodes: Episode[] }>(`/v1/store/episodes?limit=${limit}`),
  getEpisode:    (id: string) => backendFetch<Episode>(`/v1/store/episodes/${id}`),
  fleet:         () => backendFetch<FleetSnapshot>("/v1/fleet"),
  robot:         (name: string) => backendFetch<RobotSnapshot>(`/v1/fleet/${name}`),
  listAlarms:    (includeAcked = false, limit = 100) =>
    backendFetch<{ alarms: Alarm[]; n: number }>(
      `/v1/alarms?include_acked=${includeAcked}&limit=${limit}`,
    ),
  ackAlarm:      (id: string, who?: string) =>
    backendFetch<Alarm>(`/v1/alarms/${id}/ack`, {
      method: "POST",
      headers: who ? { "X-Operator": who } : {},
    }),
  metrics:       () => fetch(`${BACKEND}/metrics`).then((r) => {
    setDemo(r.headers.get("x-ghostloop-demo") === "1")
    return r.text()
  }),
}
