import type { NextConfig } from "next"

const config: NextConfig = {
  reactStrictMode: true,
  // The dashboard backend (ghostloop's create_production_app) lives on a
  // separate host. Configure GHOSTLOOP_BACKEND_URL at runtime; we proxy
  // /api/backend/* to it so the browser hits same-origin (avoids CORS).
  async rewrites() {
    const backend = process.env.GHOSTLOOP_BACKEND_URL || "http://localhost:8000"
    return [
      { source: "/api/backend/:path*", destination: `${backend}/:path*` },
    ]
  },
}

export default config
