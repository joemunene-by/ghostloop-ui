/**
 * Catch-all backend proxy / demo fallback.
 *
 * Runtime decision tree:
 *   - If GHOSTLOOP_BACKEND_URL env var is set AND the upstream
 *     responds 2xx/3xx: proxy the response through (with bearer token
 *     forwarding from Authorization header).
 *   - Otherwise: serve mock fixtures for known endpoints so a Vercel
 *     deploy without a configured backend is still interactive.
 *
 * Demo fallback responses carry these headers for diagnosis:
 *   X-Ghostloop-Demo: 1                    always present on fixtures
 *   X-Ghostloop-Backend-Configured: 1|0    whether env var is set
 *   X-Ghostloop-Backend-Url: <host>        host the proxy tried (no path)
 *   X-Ghostloop-Backend-Error: <message>   why the proxy attempt failed
 */

import { NextRequest, NextResponse } from "next/server"
import {
  DEMO_ALARMS,
  DEMO_EPISODES,
  DEMO_FLEET,
  DEMO_HEALTH,
  DEMO_METRICS,
  DEMO_STATS,
} from "@/lib/demo-fixtures"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const BACKEND = process.env.GHOSTLOOP_BACKEND_URL

type ProxyAttempt =
  | { kind: "ok"; response: Response }
  | { kind: "no-backend" }
  | { kind: "error"; message: string; targetHost: string }

function diagHeaders(attempt: ProxyAttempt): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Ghostloop-Backend-Configured": BACKEND ? "1" : "0",
  }
  if (attempt.kind === "error") {
    headers["X-Ghostloop-Backend-Url"] = attempt.targetHost
    headers["X-Ghostloop-Backend-Error"] = attempt.message.slice(0, 200)
  }
  return headers
}

function demoFor(
  path: string,
  url: URL,
  attempt: ProxyAttempt,
): Response | null {
  const route = `/${path}`
  if (route === "/healthz" || route === "/livez" || route === "/readyz") {
    return jsonDemo(DEMO_HEALTH, attempt)
  }
  if (route === "/v1/store/stats") {
    return jsonDemo(DEMO_STATS, attempt)
  }
  if (route === "/v1/store/episodes") {
    const limit = Number(url.searchParams.get("limit") ?? "50")
    return jsonDemo({ episodes: DEMO_EPISODES.slice(0, limit) }, attempt)
  }
  if (route.startsWith("/v1/store/episodes/")) {
    const id = route.split("/").pop()
    const ep = DEMO_EPISODES.find((e) => e.episode_id === id)
    return ep
      ? jsonDemo(ep, attempt)
      : new NextResponse("episode not found", { status: 404 })
  }
  if (route === "/v1/fleet") {
    return jsonDemo(DEMO_FLEET, attempt)
  }
  if (route.startsWith("/v1/fleet/")) {
    const name = decodeURIComponent(route.split("/").pop() ?? "")
    const robot = DEMO_FLEET.robots.find((r) => r.name === name)
    return robot
      ? jsonDemo(robot, attempt)
      : new NextResponse("unknown robot", { status: 404 })
  }
  if (route === "/v1/alarms") {
    const includeAcked = url.searchParams.get("include_acked") === "true"
    const alarms = includeAcked
      ? DEMO_ALARMS
      : DEMO_ALARMS.filter((a) => !a.acked)
    return jsonDemo({ alarms, n: alarms.length }, attempt)
  }
  if (route.endsWith("/ack")) {
    const id = route.split("/").slice(-2)[0]
    const alarm = DEMO_ALARMS.find((a) => a.id === id)
    if (!alarm) return new NextResponse("not found", { status: 404 })
    alarm.acked = true
    alarm.acked_at = Date.now() / 1000
    alarm.acked_by = "demo-operator"
    return jsonDemo(alarm, attempt)
  }
  if (route === "/metrics") {
    return new NextResponse(DEMO_METRICS, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Ghostloop-Demo": "1",
        ...diagHeaders(attempt),
      },
    })
  }
  return null
}

function jsonDemo(body: unknown, attempt: ProxyAttempt): Response {
  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Ghostloop-Demo": "1",
      ...diagHeaders(attempt),
    },
  })
}

async function tryProxy(
  req: NextRequest,
  path: string,
  search: string,
): Promise<ProxyAttempt> {
  if (!BACKEND) return { kind: "no-backend" }
  const base = BACKEND.replace(/\/$/, "")
  const url = `${base}/${path}${search}`
  let host = ""
  try {
    host = new URL(base).host
  } catch {
    host = base
  }
  try {
    const headers = new Headers()
    const auth = req.headers.get("authorization")
    if (auth) headers.set("Authorization", auth)
    const op = req.headers.get("x-operator")
    if (op) headers.set("X-Operator", op)
    if (req.headers.get("content-type")) {
      headers.set("content-type", req.headers.get("content-type") as string)
    }
    const init: RequestInit = {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : await req.text(),
      signal: AbortSignal.timeout(5000),
    }
    const upstream = await fetch(url, init)
    const text = await upstream.text()
    return {
      kind: "ok",
      response: new NextResponse(text, {
        status: upstream.status,
        headers: {
          "Content-Type":
            upstream.headers.get("content-type") || "application/json",
        },
      }),
    }
  } catch (err) {
    const message =
      err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    return { kind: "error", message, targetHost: host }
  }
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await ctx.params
  const joined = path.join("/")
  const url = new URL(req.url)
  const search = url.search

  const attempt = await tryProxy(req, joined, search)
  if (attempt.kind === "ok") return attempt.response

  const demo = demoFor(joined, url, attempt)
  if (demo) return demo

  return new NextResponse(
    JSON.stringify({
      error: "no real backend configured AND no demo fixture for this path",
      hint: "Set GHOSTLOOP_BACKEND_URL in your Vercel env to point at a deployed FastAPI backend, OR add a demo fixture for this path.",
      path: `/${joined}`,
    }),
    {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "X-Ghostloop-Demo": "1",
        ...diagHeaders(attempt),
      },
    },
  )
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
