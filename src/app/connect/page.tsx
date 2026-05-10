"use client"

import {
  ArrowUpRight,
  CircleCheck,
  Copy,
  ExternalLink,
  Plug,
  Rocket,
  Terminal,
} from "lucide-react"
import { useState } from "react"

const HF_DEMO_URL = "https://huggingface.co/spaces/Ghostgim/ghostloop-demo"
const GITHUB_URL = "https://github.com/joemunene-by/ghostloop"

export default function ConnectPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold mb-2 flex items-center gap-2">
          <Plug className="w-7 h-7 text-[var(--color-primary)]" />
          Connect a robot
        </h1>
        <p className="text-[var(--color-text-muted)] max-w-2xl">
          Three ways to start, easiest first. You can switch between them
          later. No code experience needed for option one.
        </p>
      </header>

      <PathOne />
      <PathTwo />
      <PathThree />

      <FAQ />
    </div>
  )
}

function PathOne() {
  return (
    <PathCard
      number={1}
      icon={Rocket}
      tag="No setup"
      title="Try the live demo (30 seconds)"
      summary="Drive six different robots from your browser. Nothing to install, nothing to configure. Best for getting a feel for what the safety pipeline does."
    >
      <ul className="text-sm text-[var(--color-text-muted)] space-y-1.5 mb-5 ml-1">
        <Bullet>
          Pick a robot profile (Franka arm, Spot quadruped, Tello drone,
          Stretch mobile arm, humanoid, TurtleBot).
        </Bullet>
        <Bullet>
          Use the on-screen joystick or one-click primitive buttons to dispatch
          commands.
        </Bullet>
        <Bullet>
          Watch the trace pane as every action goes through GeofenceGate,
          ForceCap, ActionSmoothing, RateLimit, and HITL.
        </Bullet>
        <Bullet>
          Hit Emergency Stop to see the runtime go fail-closed in real time.
        </Bullet>
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
      icon={Terminal}
      tag="5 minutes, one command"
      title="Run ghostloop locally on your laptop"
      summary="If you have Python installed, you can run the same control plane on your own machine. Good for hobbyists and anyone who wants to iterate offline before pointing at a real robot."
    >
      <Step n={1} label="Install ghostloop">
        <CodeBlock code="pip install 'ghostloop[dashboard]'" />
        <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
          Requires Python 3.10 or newer.
        </p>
      </Step>

      <Step n={2} label="Start the dashboard">
        <CodeBlock code="python -m ghostloop.dashboard" />
        <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
          Listens on http://localhost:8000 with a sample fleet of three
          MockBackend robots so you have something to click on right away.
        </p>
      </Step>

      <Step n={3} label="Open the UI in your browser" last>
        <p className="text-sm">
          Visit{" "}
          <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-[var(--color-primary)]">
            http://localhost:3000
          </code>{" "}
          (this UI, but pointed at your local backend instead of the public
          one).
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mt-2">
          To run this UI locally:{" "}
          <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-xs">
            git clone {GITHUB_URL}-ui
          </code>
          , then{" "}
          <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-xs">
            GHOSTLOOP_BACKEND_URL=http://localhost:8000 npm run dev
          </code>
          .
        </p>
      </Step>
    </PathCard>
  )
}

function PathThree() {
  return (
    <PathCard
      number={3}
      icon={ArrowUpRight}
      tag="Advanced"
      title="Embed ghostloop in your existing robot stack"
      summary="If you already have a robot project (ROS 2, MuJoCo, PyBullet, your own driver), wrap it with the ghostloop runtime. Every command flows through the safety pipeline and shows up here automatically."
    >
      <p className="text-sm text-[var(--color-text-muted)] mb-3">
        Minimum viable wiring, ~10 lines:
      </p>
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
      <p className="text-sm text-[var(--color-text-muted)] mt-4">
        Swap <code>MockBackend</code> for{" "}
        <code>MujocoBackend(&quot;franka_panda&quot;)</code>,{" "}
        <code>PyBulletBackend(&quot;humanoid&quot;)</code>,{" "}
        <code>Ros2Backend(&quot;/cmd_vel&quot;)</code>, or your own. Six
        backends ship in the box; full list at{" "}
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
    <details className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
      <summary className="cursor-pointer text-sm font-medium">
        Common questions
      </summary>
      <div className="mt-4 space-y-4 text-sm text-[var(--color-text-muted)]">
        <FAQItem q="I don't have a robot. Can I still use this?">
          Yes. Path 1 (the live demo) gives you six simulated robots in your
          browser. Path 2 starts you with three more on your own machine.
          You can build, train, and bench against them indefinitely without
          ever touching hardware.
        </FAQItem>
        <FAQItem q="Is anything I do here permanent?">
          No. The public demo backend uses an ephemeral SQLite database
          that resets when the server restarts. Anyone can ack alarms and
          submit missions; nothing carries over. To keep state, run path 2
          or path 3 with your own database.
        </FAQItem>
        <FAQItem q="Do I need to know Python?">
          For path 1, no. Python is only required for paths 2 and 3 because
          ghostloop itself is a Python library. If you're starting from
          zero, the live demo is enough to learn what the runtime does.
        </FAQItem>
        <FAQItem q="What kinds of robots does ghostloop support?">
          Anything with a Python-callable interface. Out of the box: arms
          (Franka, UR), quadrupeds (Spot, Anymal), drones (Tello, PX4),
          mobile bases (TurtleBot, Stretch), humanoids. Backends include
          MuJoCo, PyBullet, ROS 2, Gymnasium, and a randomized stress-test
          backend.
        </FAQItem>
        <FAQItem q="What does the safety pipeline actually do?">
          Every command (called an &quot;Intent&quot;) flows through a chain
          of gates before reaching the robot: GeofenceGate (workspace
          bounds), ForceCap (max applied force), ActionSmoothing (jerk
          limits), RateLimit (commands per second), HITL (human-in-the-loop
          approval for dangerous primitives). If any gate denies, the
          command never reaches the hardware and the denial is recorded in
          the trace.
        </FAQItem>
      </div>
    </details>
  )
}

function PathCard({
  number,
  icon: Icon,
  tag,
  title,
  summary,
  children,
}: {
  number: number
  icon: typeof Plug
  tag: string
  title: string
  summary: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8">
      <div className="flex items-start gap-4 mb-5">
        <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-semibold">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            <Icon className="w-3.5 h-3.5" />
            {tag}
          </div>
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-sm text-[var(--color-text-muted)] max-w-2xl">
            {summary}
          </p>
        </div>
      </div>
      <div className="ml-0 sm:ml-14">{children}</div>
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
    <div className={last ? "" : "mb-5 pb-5 border-b border-[var(--color-border)]"}>
      <p className="text-sm font-medium mb-2">
        <span className="text-[var(--color-primary)] font-mono mr-2">
          {n}.
        </span>
        {label}
      </p>
      <div className="ml-6">{children}</div>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CircleCheck className="w-4 h-4 text-[var(--color-primary)] mt-0.5 shrink-0" />
      <span>{children}</span>
    </li>
  )
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="relative group">
      <pre className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3 pr-12 text-xs overflow-x-auto font-mono">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)]/50"
        aria-label="Copy"
      >
        {copied ? (
          <CircleCheck className="w-3.5 h-3.5 text-[var(--color-ok)]" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
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
  if (compact) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noreferrer" : undefined}
        className="text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
      >
        {children}
        {external && <ExternalLink className="w-3 h-3" />}
      </a>
    )
  }
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-black font-medium text-sm hover:opacity-90 transition-opacity"
    >
      {children}
      {external && <ExternalLink className="w-4 h-4" />}
    </a>
  )
}

function FAQItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[var(--color-text)] font-medium mb-1">{q}</p>
      <p>{children}</p>
    </div>
  )
}
