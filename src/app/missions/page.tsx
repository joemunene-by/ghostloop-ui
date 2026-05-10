"use client"

import Link from "next/link"
import { Construction, Plug, Workflow } from "lucide-react"

export default function MissionsPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold mb-1 flex items-center gap-2">
          <Workflow className="w-6 h-6 text-[var(--color-primary)]" />
          Missions
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Chain steps into a recipe the robot follows. Things like &quot;go
          to the kitchen, pick up the cup, bring it back&quot;.
        </p>
      </header>

      <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-7">
        <h2 className="text-lg font-semibold mb-3">What a Mission is</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          A Mission is a small graph of Steps. Each Step is one robot
          action (a primitive) that runs through the safety pipeline.
          Steps can depend on each other, retry on failure, and be marked
          required vs optional.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <Concept title="Step" body="One robot action, e.g. goto(x, y) or pick(object)." />
          <Concept title="Depends on" body="Step B only starts after Step A finishes successfully." />
          <Concept title="Required" body="If a required Step fails, the Mission aborts. Optional Steps log and continue." />
        </div>
      </section>

      <section className="bg-[var(--color-bg-card)] border border-[var(--color-warn)]/30 rounded-2xl p-6 sm:p-7">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Construction className="w-5 h-5 text-[var(--color-warn)]" />
          Drag-and-drop Mission builder: coming in v0.2
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          The visual editor lets you compose Missions by dragging Step
          tiles onto a canvas and drawing dependency arrows. Until that
          ships, you have two ways to drive missions:
        </p>
        <ul className="text-sm text-[var(--color-text-muted)] space-y-2 ml-1 mb-4">
          <li>
            <span className="text-[var(--color-text)] font-medium">
              Via the live demo:
            </span>{" "}
            the HuggingFace Space lets you dispatch primitives one at a
            time and watch the trace, which is close to running a
            single-Step Mission.
          </li>
          <li>
            <span className="text-[var(--color-text)] font-medium">
              Via the Python API:
            </span>{" "}
            for now, Missions are built and submitted from code. See the
            snippet below.
          </li>
        </ul>
        <Link
          href="/connect"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-black font-medium text-sm hover:opacity-90"
        >
          <Plug className="w-4 h-4" />
          Set up the local stack
        </Link>
      </section>

      <details className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
        <summary className="cursor-pointer text-sm font-medium">
          Python-API example (for now)
        </summary>
        <pre className="mt-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 text-xs overflow-x-auto font-mono">
{`from ghostloop.missions import Mission, Step, MissionRunner
from ghostloop import Intent

mission = Mission(name="deliver", steps=[
    Step(name="goto_room",
         emit=lambda m, s: Intent("goto", {"x": 1.5, "y": 0, "theta": 0})),
    Step(name="dispense",
         emit=lambda m, s: Intent("dispense_pill", {"count": 1}),
         depends_on=["goto_room"]),
    Step(name="alert",
         emit=lambda m, s: Intent("alert_nurse", {"message": "delivered"}),
         depends_on=["dispense"]),
])
result = MissionRunner(runtime).run(mission)`}
        </pre>
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          Submit it to a running backend by POSTing the serialized Mission
          to <code>/v1/missions/run</code>.
        </p>
      </details>
    </div>
  )
}

function Concept({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-[var(--color-bg)]/60 border border-[var(--color-border)] rounded-lg p-3">
      <p className="text-sm font-medium text-[var(--color-primary)] mb-1">
        {title}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
        {body}
      </p>
    </div>
  )
}
