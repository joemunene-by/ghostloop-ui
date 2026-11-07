import Link from "next/link"

const GHOST_PATH =
  "M6 36 a26 26 0 0 1 52 0 L58 64 a6.5 6.5 0 0 1 -13 0 a6.5 6.5 0 0 1 -13 0 a6.5 6.5 0 0 1 -13 0 a6.5 6.5 0 0 1 -13 0 Z M27.6 33 a3.6 3.6 0 1 0 -7.2 0 a3.6 3.6 0 1 0 7.2 0 M43.6 33 a3.6 3.6 0 1 0 -7.2 0 a3.6 3.6 0 1 0 7.2 0"

export function GhostMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="4 8 56 64"
      width={size}
      height={(size * 64) / 56}
      aria-hidden="true"
      className="shrink-0"
    >
      <path fill="currentColor" fillRule="evenodd" d={GHOST_PATH} />
    </svg>
  )
}

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-fg" aria-label="ghostloop, overview">
      <GhostMark size={18} />
      <span className="text-[17px] leading-6 tracking-[-0.01em]">
        <span className="font-normal">ghost</span>
        <span className="font-bold">loop</span>
      </span>
    </Link>
  )
}
