"use client"

import { useEffect, useState } from "react"
import { backend, type Episode } from "@/lib/backend"
import { Loading, Notice, PageHeader, UpdatedAt } from "@/components/ui"

function duration(ep: Episode) {
  return ep.duration_s ? `${ep.duration_s.toFixed(2)} s` : "-"
}

export default function TracesPage() {
  const [episodes, setEpisodes] = useState<Episode[] | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function poll() {
      try {
        const r = await backend.listEpisodes(100)
        if (!cancelled) {
          setEpisodes(r.episodes)
          setUpdatedAt(Date.now())
        }
      } catch {
        if (!cancelled) setEpisodes((prev) => prev ?? [])
      }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  if (episodes === null) return <Loading label="Loading episodes" />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traces"
        description={
          episodes.length
            ? `${episodes.length} recorded episodes from the SQLite store.`
            : "Recorded episodes from the SQLite store."
        }
        aside={<UpdatedAt at={updatedAt} />}
      />

      {episodes.length === 0 ? (
        <Notice title="No episodes yet">
          Run an Episode through <code>EpisodeRunner</code> with a <code>GhostloopStore</code> attached
          and it appears here.
        </Notice>
      ) : (
        <section className="panel overflow-hidden">
          <table className="hidden w-full text-small md:table">
            <thead>
              <tr>
                <th className="label px-4 pb-2 pt-3 text-left">Episode</th>
                <th className="label px-4 pb-2 pt-3 text-left">Backend</th>
                <th className="label px-4 pb-2 pt-3 text-right">Events</th>
                <th className="label px-4 pb-2 pt-3 text-right">Duration</th>
                <th className="label px-4 pb-2 pt-3 text-right">Started</th>
              </tr>
            </thead>
            <tbody>
              {episodes.map((ep) => (
                <tr key={ep.episode_id} className="border-t border-line transition-colors hover:bg-raised">
                  <td className="h-11 max-w-[320px] truncate px-4 font-mono text-fg" title={ep.episode_id}>
                    {ep.episode_id}
                  </td>
                  <td className="h-11 px-4 font-mono text-fg-muted">{ep.backend}</td>
                  <td className="h-11 px-4 text-right text-fg tnum">{ep.n_events}</td>
                  <td className="h-11 px-4 text-right text-fg-muted tnum">{duration(ep)}</td>
                  <td className="h-11 px-4 text-right text-fg-muted tnum">
                    {new Date(ep.started_at * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="divide-y divide-line md:hidden">
            {episodes.map((ep) => (
              <li key={ep.episode_id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate font-mono text-body text-fg" title={ep.episode_id}>
                    {ep.episode_id}
                  </span>
                  <span className="shrink-0 text-small text-fg tnum">{ep.n_events} events</span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-3 text-small text-fg-muted">
                  <span className="truncate font-mono">{ep.backend}</span>
                  <span className="shrink-0 tnum">{duration(ep)}</span>
                </div>
                <p className="mt-1 text-small text-fg-faint tnum">
                  {new Date(ep.started_at * 1000).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
