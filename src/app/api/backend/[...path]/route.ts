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
 * The response carries an X-Ghostloop-Demo header when fixtures are
 * used so the frontend can show a banner.
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

function demoFor(path: string, url: URL): Response | null {
  const route = `/${path}`
  if (route === "/healthz" || route === "/livez" || route === "/readyz") {
    return jsonDemo(DEMO_HEALTH)
  }
  if (route === "/v1/store/stats") {
    return jsonDemo(DEMO_STATS)
  }
  if (route === "/v1/store/episodes") {
    const limit = Number(url.searchParams.get("limit") ?? "50")
    return jsonDemo({ episodes: DEMO_EPISODES.slice(0, limit) })
  }
  if (route.startsWith("/v1/store/episodes/")) {
    const id = route.split("/").pop()
    const ep = DEMO_EPISODES.find((e) => e.episode_id === id)
    return ep
      ? jsonDemo(ep)
      : new NextResponse("episode not found", { status: 404 })
  }
  if (route === "/v1/fleet") {
    return jsonDemo(DEMO_FLEET)
  }
  if (route.startsWith("/v1/fleet/")) {
    const name = decodeURIComponent(route.split("/").pop() ?? "")
    const robot = DEMO_FLEET.robots.find((r) => r.name === name)
    return robot
      ? jsonDemo(robot)
      : new NextResponse("unknown robot", { status: 404 })
  }
  if (route === "/v1/alarms") {
    const includeAcked = url.searchParams.get("include_acked") === "true"
    const alarms = includeAcked
      ? DEMO_ALARMS
      : DEMO_ALARMS.filter((a) => !a.acked)
    return jsonDemo({ alarms, n: alarms.length })
  }
  if (route.endsWith("/ack")) {
    // Demo mode: pretend the ack succeeded.
    const id = route.split("/").slice(-2)[0]
    const alarm = DEMO_ALARMS.find((a) => a.id === id)
    if (!alarm) return new NextResponse("not found", { status: 404 })
    alarm.acked = true
    alarm.acked_at = Date.now() / 1000
    alarm.acked_by = "demo-operator"
    return jsonDemo(alarm)
  }
  if (route === "/metrics") {
    return new NextResponse(DEMO_METRICS, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Ghostloop-Demo": "1",
      },
    })
  }
  return null
}

function jsonDemo(body: unknown): Response {
  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Ghostloop-Demo": "1",
    },
  })
}

async function tryProxy(
  req: NextRequest,
  path: string,
  search: string,
): Promise<Response | null> {
  if (!BACKEND) return null
  const url = `${BACKEND.replace(/\/$/, "")}/${path}${search}`
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
      // Don't forward a body on GET/HEAD.
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : await req.text(),
      // 5-second timeout via AbortController.
      signal: AbortSignal.timeout(5000),
    }
    const upstream = await fetch(url, init)
    const text = await upstream.text()
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") || "application/json",
      },
    })
  } catch {
    return null
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

  // 1. Try the configured real backend first.
  const proxied = await tryProxy(req, joined, search)
  if (proxied) return proxied

  // 2. Fall back to demo fixtures.
  const demo = demoFor(joined, url)
  if (demo) return demo

  // 3. Truly unknown — 404.
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
      },
    },
  )
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
