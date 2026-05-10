import type { LucideIcon } from "lucide-react"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  tone?: "default" | "ok" | "warn" | "error"
}) {
  const toneColors: Record<string, string> = {
    default: "text-[var(--color-primary)]",
    ok: "text-[var(--color-ok)]",
    warn: "text-[var(--color-warn)]",
    error: "text-[var(--color-error)]",
  }
  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        {Icon && <Icon className={`w-4 h-4 ${toneColors[tone]}`} />}
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
}
