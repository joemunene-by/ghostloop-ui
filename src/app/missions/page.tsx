"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { CodeBlock, PageHeader } from "@/components/ui"

const HF_DEMO_URL = "https://huggingface.co/spaces/Ghostgim/ghostloop-demo"

const CONCEPTS = [
  { term: "Step", body: "One robot action, for example goto(x, y) or pick(object). Every Step runs through the safety pipeline." },
  { term: "Depends on", body: "Step B only starts after Step A finishes successfully." },
  { term: "Required", body: "If a required Step fails, the Mission aborts. Optional Steps log the failure and continue." },
]

export default function MissionsPage() {
  return (
    <div className="max-w-3xl space-y-10">
      <PageHeader
        title="Missions"
        description={'Chain steps into a recipe the robot follows, like "go to the kitchen, pick up the cup, bring it back".'}
      />

      <section>
        <h2 className="text-heading font-semibold">What a Mission is</h2>
        <p className="mt-2 text-body text-fg-muted">
          A small graph of Steps. Steps can depend on each other, retry on failure, and be marked
          required or optional.
        </p>
        <dl className="mt-4 divide-y divide-line border-y border-line">
          {CONCEPTS.map((c) => (
            <div key={c.term} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[160px_1fr] sm:gap-6">
              <dt className="text-body font-semibold">{c.term}</dt>
              <dd className="text-body text-fg-muted">{c.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="text-heading font-semibold">Visual Mission builder</h2>
        <p className="mt-1 text-small text-fg-faint">Planned for v0.2, not built yet</p>
        <p className="mt-3 text-body text-fg-muted">
          The builder will let you drag Step tiles onto a canvas and draw dependency arrows. Until it
          ships there are two ways to drive Missions:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-body text-fg-muted marker:text-fg-faint">
          <li>
            <span className="font-medium text-fg">The live demo.</span> The HuggingFace Space dispatches
            primitives one at a time and shows the trace, which is close to a single-Step Mission.
          </li>
          <li>
            <span className="font-medium text-fg">The Python API.</span> Build and submit Missions from code,
            as in the example below.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/connect" className="btn btn-primary">
            Set up the local stack
          </Link>
          <a href={HF_DEMO_URL} target="_blank" rel="noreferrer" className="btn btn-secondary">
            Open the live demo
            <ArrowUpRight className="h-4 w-4 text-fg-faint" strokeWidth={1.75} />
          </a>
        </div>
      </section>

      <section>
        <h2 className="text-heading font-semibold">Python API example</h2>
        <CodeBlock
          className="mt-3"
          code={`from ghostloop.missions import Mission, Step, MissionRunner
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
        />
        <p className="mt-3 text-small text-fg-muted prose-muted">
          Submit it to a running backend by POSTing the serialized Mission to{" "}
          <code>/v1/missions/run</code>.
        </p>
      </section>
    </div>
  )
}
