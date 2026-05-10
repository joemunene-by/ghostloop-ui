"use client"

import { useEffect, useState } from "react"
import { History, Loader2 } from "lucide-react"
import { backend, type Episode } from "@/lib/backend"

export default function TracesPage() {
  const [episodes, setEpisodes] = useState<Episode[] | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const r = await backend.listEpisodes(100)
        if (!cancelled) setEpisodes(r.episodes)
      } catch {
        if (!cancelled) setEpisodes([])
      }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (episodes === null) {
    return (
      <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading episodes…
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold mb-1">Traces</h1>
        <p className="text-[var(--color-text-muted)]">
          Recorded episodes from the SQLite store. Click an episode for the
          per-step trace timeline.
        </p>
      </header>

      {episodes.length === 0 ? (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-8 text-center">
          <History className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2" />
          <p className="font-medium">No episodes yet</p>
          <p className="text-sm text-[var(--color-text-muted)]">
            Run an Episode through <code>EpisodeRunner</code> with a{" "}
            <code>GhostloopStore</code> attached and they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-[var(--color-text-muted)] text-xs uppercase tracking-wider bg-[var(--color-border)]/40">
              <tr>
                <th className="text-left px-4 py-3">Episode ID</th>
                <th className="text-left px-4 py-3">Backend</th>
                <th className="text-right px-4 py-3">Events</th>
                <th className="text-right px-4 py-3">Duration</th>
                <th className="text-left px-4 py-3">Started</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((ep) => (
                <tr
                  key={ep.episode_id}
                  className="border-t border-[var(--color-border)] hover:bg-[var(--color-border)]/30"
                >
                  <td className="px-4 py-2 font-mono text-xs">{ep.episode_id.slice(0, 8)}…</td>
                  <td className="px-4 py-2 font-mono text-xs">{ep.backend}</td>
                  <td className="px-4 py-2 text-right">{ep.n_events}</td>
                  <td className="px-4 py-2 text-right text-[var(--color-text-muted)]">
                    {ep.duration_s ? `${ep.duration_s.toFixed(2)}s` : "-"}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-text-muted)]">
                    {new Date(ep.started_at * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
