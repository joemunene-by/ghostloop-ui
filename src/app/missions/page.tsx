"use client"

import { Workflow } from "lucide-react"

export default function MissionsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold mb-1 flex items-center gap-2">
          <Workflow className="w-6 h-6 text-[var(--color-primary)]" />
          Missions
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Multi-step DAG missions for fleet robots.
        </p>
      </header>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          Mission control is a thin GUI over <code>ghostloop.missions.MissionRunner</code>.
          Each Mission is a Kahn-validated DAG of Steps with prerequisites,
          retry semantics, and required-vs-optional gating.
        </p>
        <p className="text-sm">
          To submit a Mission, POST it to{" "}
          <code className="bg-[var(--color-border)]/40 px-1.5 py-0.5 rounded">
            /v1/missions/run
          </code>{" "}
          on your dashboard backend (extend <code>create_production_app</code>{" "}
          with a route that accepts a Mission JSON).
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mt-3">
          A visual mission builder ships in v0.2 of this UI. For now use the
          Python API directly:
        </p>
        <pre className="mt-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 text-xs overflow-x-auto">
{`from ghostloop.missions import Mission, Step, MissionRunner
from ghostloop import Intent

mission = Mission(name="deliver", steps=[
    Step(name="goto_room", emit=lambda m, s: Intent("goto", {"x": 1.5, "y": 0, "theta": 0})),
    Step(name="dispense", emit=lambda m, s: Intent("dispense_pill", {"count": 1}),
         depends_on=["goto_room"]),
    Step(name="alert", emit=lambda m, s: Intent("alert_nurse", {"message": "delivered"}),
         depends_on=["dispense"]),
])
result = MissionRunner(runtime).run(mission)`}
        </pre>
      </div>
    </div>
  )
}
