"use client"

import { ArrowUpRight } from "lucide-react"
import { GITHUB_URL, HF_DEMO_URL } from "@/components/topbar"
import { Chapter, CodeBlock, PageHeader } from "@/components/ui"

export default function ConnectPage() {
  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="grid grid-cols-1 items-end gap-x-10 gap-y-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <PageHeader
            title="Connect a robot"
            description="Three ways to start, easiest first. You can switch between them later. The first needs no code at all."
          />
          <ol className="mt-8 border-b border-rule text-[14px]">
            {[
              "Try the live demo, 30 seconds",
              "Run ghostloop on your laptop, 5 minutes",
              "Embed it in your robot stack",
            ].map((t, i) => (
              <li key={t} className="flex gap-4 border-t border-rule py-3">
                <span className="font-mono text-mono text-ink-3 tnum">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
        <figure className="overflow-hidden rounded-r border border-rule bg-sheet lg:col-span-7">
          <video
            className="block aspect-video w-full bg-sheet"
            controls
            playsInline
            preload="metadata"
            poster="/connect-poster.png"
            src="/ghostloop-connect.mp4"
          />
          <figcaption className="border-t border-rule bg-paper px-4 py-3 text-small text-ink-2">
            Connect any robot to ghostloop in 4 steps. 80 seconds.
          </figcaption>
        </figure>
      </div>

      <div className="space-y-12 sm:space-y-16">
        <PathOne />
        <PathTwo />
        <PathThree />
      </div>

      <FAQ />
    </div>
  )
}

function PathOne() {
  return (
    <PathCard
      number={1}
      tag="No setup"
      title="Try the live demo (30 seconds)"
      summary="Drive six different robots from your browser. Nothing to install, nothing to configure. Best for getting a feel for what the safety pipeline does."
    >
      <ul className="mb-6 list-disc space-y-2 pl-5 text-body text-ink-2 marker:text-ink-3">
        <li>
          Pick a robot profile (Franka arm, Spot quadruped, Tello drone, Stretch mobile arm, humanoid, TurtleBot).
        </li>
        <li>Use the on-screen joystick or one-click primitive buttons to dispatch commands.</li>
        <li>
          Watch the trace pane as every action goes through GeofenceGate, ForceCap, ActionSmoothing, RateLimit, and
          HITL.
        </li>
        <li>Hit Emergency Stop to see the runtime go fail-closed in real time.</li>
      </ul>
      <PrimaryLink href={HF_DEMO_URL} external>
        Open the live demo
      </PrimaryLink>
    </PathCard>
  )
}

function PathTwo() {
  return (
    <PathCard
      number={2}
      tag="5 minutes, one command"
      title="Run ghostloop locally on your laptop"
      summary="If you have Python installed, you can run the same control plane on your own machine. Good for hobbyists and anyone who wants to iterate offline before pointing at a real robot."
    >
      <Step n={1} label="Install ghostloop">
        <CodeBlock code="pip install 'ghostloop[dashboard]'" />
        <p className="mt-2 text-small text-ink-3">Requires Python 3.10 or newer.</p>
      </Step>

      <Step n={2} label="Start the dashboard">
        <CodeBlock code="python -m ghostloop.dashboard" />
        <p className="mt-2 text-small text-ink-3">
          Listens on http://localhost:8000 with a sample fleet of three MockBackend robots so you have something to
          click on right away.
        </p>
      </Step>

      <Step n={3} label="Open the UI in your browser" last>
        <p className="text-body text-ink-2">
          Visit <code className="code-inline">http://localhost:3000</code> (this UI, but pointed at your local backend
          instead of the public one).
        </p>
        <p className="mt-3 text-body text-ink-2">To run this UI locally:</p>
        <CodeBlock
          className="mt-2"
          code={`git clone ${GITHUB_URL}-ui\nGHOSTLOOP_BACKEND_URL=http://localhost:8000 npm run dev`}
        />
      </Step>
    </PathCard>
  )
}

function PathThree() {
  return (
    <PathCard
      number={3}
      tag="Advanced"
      title="Embed ghostloop in your existing robot stack"
      summary="If you already have a robot project (ROS 2, MuJoCo, PyBullet, your own driver), wrap it with the ghostloop runtime. Every command flows through the safety pipeline and shows up here automatically."
    >
      <p className="mb-3 text-body text-ink-2">Minimum viable wiring, about 10 lines:</p>
      <CodeBlock
        code={`from ghostloop import GhostloopStore, Runtime, MockBackend
from ghostloop.fleet import FleetRegistry, RobotHandle
from ghostloop.dashboard import create_production_app, ProductionConfig

store = GhostloopStore("./ghostloop.db")
fleet = FleetRegistry()
fleet.register(RobotHandle(name="my-robot", backend=MockBackend()))

app, alarms = create_production_app(
    store=store, fleet=fleet,
    config=ProductionConfig(),
)
# uvicorn yourfile:app --host 0.0.0.0 --port 8000`}
      />
      <p className="mt-4 text-body text-ink-2 prose-muted">
        Swap <code>MockBackend</code> for <code>MujocoBackend(&quot;franka_panda&quot;)</code>,{" "}
        <code>PyBulletBackend(&quot;humanoid&quot;)</code>, <code>Ros2Backend(&quot;/cmd_vel&quot;)</code>, or your own.
        Six backends ship in the box; full list at{" "}
        <PrimaryLink href={GITHUB_URL} external compact>
          the project repo
        </PrimaryLink>
        .
      </p>
    </PathCard>
  )
}

function FAQ() {
  return (
    <Chapter title="Common questions">
      <div className="divide-y divide-rule border-b border-rule">
        <FAQItem q="I don't have a robot. Can I still use this?">
          Yes. Path 1 (the live demo) gives you six simulated robots in your browser. Path 2 starts you with three more
          on your own machine. You can build, train, and bench against them indefinitely without ever touching hardware.
        </FAQItem>
        <FAQItem q="Is anything I do here permanent?">
          No. The public demo backend uses an ephemeral SQLite database that resets when the server restarts. Anyone can
          ack alarms and submit missions; nothing carries over. To keep state, run path 2 or path 3 with your own
          database.
        </FAQItem>
        <FAQItem q="Do I need to know Python?">
          For path 1, no. Python is only required for paths 2 and 3 because ghostloop itself is a Python library. If
          you&apos;re starting from zero, the live demo is enough to learn what the runtime does.
        </FAQItem>
        <FAQItem q="What kinds of robots does ghostloop support?">
          Anything with a Python-callable interface. Out of the box: arms (Franka, UR), quadrupeds (Spot, Anymal),
          drones (Tello, PX4), mobile bases (TurtleBot, Stretch), humanoids. Backends include MuJoCo, PyBullet, ROS 2,
          Gymnasium, and a randomized stress-test backend.
        </FAQItem>
        <FAQItem q="What does the safety pipeline actually do?">
          Every command (called an &quot;Intent&quot;) flows through a chain of gates before reaching the robot:
          GeofenceGate (workspace bounds), ForceCap (max applied force), ActionSmoothing (jerk limits), RateLimit
          (commands per second), HITL (human-in-the-loop approval for dangerous primitives). If any gate denies, the
          command never reaches the hardware and the denial is recorded in the trace.
        </FAQItem>
      </div>
    </Chapter>
  )
}

function PathCard({
  number,
  tag,
  title,
  summary,
  children,
}: {
  number: number
  tag: string
  title: string
  summary: string
  children: React.ReactNode
}) {
  return (
    <section className="grid grid-cols-1 gap-x-10 gap-y-4 border-t border-ink pt-4 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <p className="font-mono text-mono text-ink-3 tnum">
          {number} <span className="font-sans text-small">· {tag}</span>
        </p>
        <h2 className="mt-1 text-heading font-semibold">{title}</h2>
      </div>
      <div className="min-w-0 max-w-[72ch] lg:col-span-8">
        <p className="text-body text-ink-2">{summary}</p>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  )
}

function Step({
  n,
  label,
  children,
  last = false,
}: {
  n: number
  label: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={last ? "" : "mb-6"}>
      <p className="mb-2 text-body font-medium">
        <span className="mr-2 font-mono text-ink-3 tnum">{n}.</span>
        {label}
      </p>
      <div className="min-w-0 sm:pl-6">{children}</div>
    </div>
  )
}

function PrimaryLink({
  href,
  children,
  external,
  compact,
}: {
  href: string
  children: React.ReactNode
  external?: boolean
  compact?: boolean
}) {
  const ext = external ? { target: "_blank", rel: "noreferrer" } : {}
  if (compact) {
    return (
      <a href={href} {...ext} className="link">
        {children}
      </a>
    )
  }
  return (
    <a href={href} {...ext} className="btn btn-primary">
      {children}
      {external && <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />}
    </a>
  )
}

function FAQItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group py-1">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-body font-medium text-ink [&::-webkit-details-marker]:hidden">
        {q}
        <span className="font-mono text-ink-3 group-open:hidden" aria-hidden="true">
          +
        </span>
        <span className="hidden font-mono text-ink-3 group-open:inline" aria-hidden="true">
          -
        </span>
      </summary>
      <p className="pb-3 text-body text-ink-2">{children}</p>
    </details>
  )
}
