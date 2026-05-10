/**
 * Mock fixtures used when no real ghostloop backend is reachable.
 *
 * These are returned by the /api/backend/* route handlers when
 * GHOSTLOOP_BACKEND_URL is unset OR the configured URL doesn't
 * respond. Keeps the deployed Vercel demo interactive for visitors
 * without requiring them (or you) to host a FastAPI server.
 *
 * Set GHOSTLOOP_BACKEND_URL=https://your-server in Vercel's env
 * settings to override and hit a real backend instead.
 */

export const DEMO_FLEET = {
  n_total: 3,
  n_idle: 1,
  n_busy: 1,
  n_offline: 0,
  n_error: 1,
  robots: [
    {
      name: "franka-lab-01",
      status: "idle" as const,
      labels: ["arm", "lab", "calibrated"],
      last_seen: Date.now() / 1000,
      backend: "mujoco<franka_panda>",
      position: [0.2, 0.0, 0.4],
    },
    {
      name: "spot-roof-01",
      status: "busy" as const,
      labels: ["quadruped", "outdoor", "inspection"],
      last_seen: Date.now() / 1000,
      backend: "ros2",
      position: [3.4, -1.2, 0.5],
    },
    {
      name: "tello-aerial-01",
      status: "error" as const,
      labels: ["drone", "indoor"],
      last_seen: Date.now() / 1000 - 60,
      backend: "ros2",
      position: [0, 0, 0],
    },
  ],
}

export const DEMO_ALARMS = [
  {
    id: "demo-alarm-001",
    kind: "force_cap_violation",
    severity: "error" as const,
    robot: "tello-aerial-01",
    message:
      "Force cap exceeded on the most recent rollout: applied=18.4 N, max=15.0 N. Likely cause: gripper close attempted on a rigid object.",
    raised_at: Date.now() / 1000 - 120,
    acked: false,
    acked_at: null,
    acked_by: null,
  },
  {
    id: "demo-alarm-002",
    kind: "deadline_missed",
    severity: "warn" as const,
    robot: "spot-roof-01",
    message:
      "Control loop missed 3 consecutive 10 Hz deadlines (overrun ratio 1.4x). Falling back to safe-hold.",
    raised_at: Date.now() / 1000 - 240,
    acked: false,
    acked_at: null,
    acked_by: null,
  },
  {
    id: "demo-alarm-003",
    kind: "property_violation",
    severity: "info" as const,
    robot: null,
    message:
      "Mined property `move_to followed by scan within 5s` failed in 2 of last 50 episodes. Promotion still recommended.",
    raised_at: Date.now() / 1000 - 600,
    acked: true,
    acked_at: Date.now() / 1000 - 480,
    acked_by: "demo-operator",
  },
]

export const DEMO_EPISODES = Array.from({ length: 24 }).map((_, i) => ({
  episode_id: `demo-${(i + 1).toString().padStart(4, "0")}-${Math.random()
    .toString(36)
    .slice(2, 10)}`,
  backend: i % 3 === 0 ? "mujoco<franka_panda>" : i % 3 === 1 ? "ros2" : "mock",
  n_events: 10 + Math.floor(Math.random() * 80),
  started_at: Date.now() / 1000 - i * 1800,
  duration_s: 2 + Math.random() * 30,
  passed: Math.random() > 0.25,
}))

export const DEMO_STATS = {
  n_episodes: DEMO_EPISODES.length,
  n_runs: 8,
  n_comparisons: 3,
}

export const DEMO_METRICS = [
  "# HELP ghostloop_requests_total Total HTTP requests handled.",
  "# TYPE ghostloop_requests_total counter",
  "ghostloop_requests_total 1247",
  "# HELP ghostloop_auth_failures_total Auth failures.",
  "# TYPE ghostloop_auth_failures_total counter",
  "ghostloop_auth_failures_total 0",
  "# HELP ghostloop_rate_limited_total 429 responses.",
  "# TYPE ghostloop_rate_limited_total counter",
  "ghostloop_rate_limited_total 4",
  "# HELP ghostloop_alarms_active Currently active alarms.",
  "# TYPE ghostloop_alarms_active gauge",
  "ghostloop_alarms_active 2",
  "# HELP ghostloop_fleet_robots_total Robots in fleet.",
  "# TYPE ghostloop_fleet_robots_total gauge",
  "ghostloop_fleet_robots_total 3",
  "ghostloop_fleet_robots_idle 1",
  "ghostloop_fleet_robots_busy 1",
  "ghostloop_fleet_robots_offline 0",
  "ghostloop_fleet_robots_error 1",
  "",
].join("\n")

export const DEMO_HEALTH = { ok: true, fleet_attached: true }
