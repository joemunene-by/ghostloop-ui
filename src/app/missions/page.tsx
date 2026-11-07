"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { HF_DEMO_URL } from "@/components/topbar"
import { Chapter, CodeBlock, PageHeader } from "@/components/ui"

const CONCEPTS = [
  { term: "Step", body: "One robot action, for example goto(x, y) or pick(object). Every Step runs through the safety pipeline." },
  { term: "Depends on", body: "Step B only starts after Step A finishes successfully." },
  { term: "Required", body: "If a required Step fails, the Mission aborts. Optional Steps log the failure and carry on." },
]

export default function MissionsPage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <PageHeader
        title="Missions"
        description={'Chain Steps into a recipe the robot follows, like "go to the kitchen, pick up the cup, bring it back".'}
      />

      <Chapter title="What a Mission is">
        <p className="text-body text-ink-2">
          A small graph of Steps. Steps can depend on each other, retry on failure, and be marked required or optional.
        </p>
        <dl className="mt-4 border-b border-rule">
          {CONCEPTS.map((c) => (
            <div key={c.term} className="grid grid-cols-1 gap-1 border-t border-rule py-3 sm:grid-cols-[140px_1fr] sm:gap-6">
              <dt className="font-mono text-mono font-medium">{c.term}</dt>
              <dd className="text-body text-ink-2">{c.body}</dd>
            </div>
          ))}
        </dl>
      </Chapter>

      <Chapter title="Visual Mission builder" note="Planned for v0.2, not built yet">
        <p className="text-body text-ink-2">
          The builder will let you drag Step tiles onto a canvas and draw the dependencies between them. Until it ships
          there are two ways to drive Missions:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-body text-ink-2 marker:font-mono marker:text-ink-3">
          <li>
            <span className="font-medium text-ink">The live demo.</span> The Hugging Face Space dispatches primitives one
            at a time and shows the trace, which is close to a single-Step Mission.
          </li>
          <li>
            <span className="font-medium text-ink">The Python API.</span> Build and submit Missions from code, as in the
            example below.
          </li>
        </ol>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/connect" className="btn btn-primary">
            Set up the local stack
          </Link>
          <a href={HF_DEMO_URL} target="_blank" rel="noreferrer" className="btn btn-secondary">
            Open the live demo
            <ArrowUpRight className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
          </a>
        </div>
      </Chapter>

      <Chapter title="Python API example">
        <CodeBlock
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
        <p className="mt-3 text-small text-ink-2 prose-muted">
          Submit it to a running backend by POSTing the serialized Mission to <code>/v1/missions/run</code>.
        </p>
      </Chapter>
    </div>
  )
}
