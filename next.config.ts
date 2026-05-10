import type { NextConfig } from "next"

const config: NextConfig = {
  reactStrictMode: true,
  // /api/backend/[...path]/route.ts handles the proxy at runtime.
  // It forwards to GHOSTLOOP_BACKEND_URL if reachable, otherwise
  // falls back to demo fixtures so a Vercel deploy without a
  // configured backend is still interactive. No build-time rewrite
  // needed.
}

export default config
