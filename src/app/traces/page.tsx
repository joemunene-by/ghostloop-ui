"use client"

import { useEffect, useState } from "react"
import { clsx } from "clsx"
import { backend, type Episode } from "@/lib/backend"
import { EpisodeChart, episodeResult } from "@/components/episode-chart"
import { clock, Loading, Notice, PageHeader, plural, Section, UpdatedAt } from "@/components/ui"

function duration(ep: Episode) {
  return ep.duration_s ? `${ep.duration_s.toFixed(2)} s` : "-"
}

function day(epochSeconds: number) {
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(new Date(epochSeconds * 1000))
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
          setEpisodes([...r.episodes].sort((a, b) => b.started_at - a.started_at))
          setUpdatedAt(Date.now())
        }
      } catch {
        if (!cancelled) setEpisodes((prev) => prev ?? [])
      }
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [])

  if (episodes === null) return <Loading label="Loading episodes" />

  const graded = episodes.filter((e) => e.passed !== undefined)
  const failed = graded.filter((e) => !e.passed).length
  const title = episodes.length
    ? `${plural(episodes.length, "episode")} recorded.${graded.length ? ` ${failed} failed.` : ""}`
    : "No episodes recorded yet."

  return (
    <div className="space-y-12">
      <PageHeader
        title={title}
        description="Every episode the runner wrote to the SQLite store, with its event count, length and result."
        aside={<UpdatedAt at={updatedAt} every="5 s" />}
      />

      {episodes.length === 0 ? (
        <Notice title="Nothing in the store">
          Run an episode through <code>EpisodeRunner</code> with a <code>GhostloopStore</code> attached and it appears
          here.
        </Notice>
      ) : (
        <>
          <Section
            title="When they ran"
            aside={
              <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-2">
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block h-3 w-[3px] bg-ink" />
                  Passed
                </span>
                <span className="inline-flex items-center gap-2">
                  <span aria-hidden="true" className="inline-block h-3 w-[3px] bg-idle" />
                  Failed
                </span>
                <span>Bar height is the event count</span>
              </span>
            }
          >
            <div className="border-t border-rule pt-10">
              <EpisodeChart episodes={episodes} nowS={(updatedAt ?? Date.now()) / 1000} height={120} />
            </div>
          </Section>

          <Section title="Episodes" aside={<span className="font-mono tnum">{episodes.length}</span>}>
            <table className="hidden w-full text-[14px] md:table">
              <thead>
                <tr className="border-t border-rule">
                  <th className="colhead h-10 pr-6 text-left">Started</th>
                  <th className="colhead h-10 pr-6 text-left">Episode</th>
                  <th className="colhead h-10 pr-6 text-left">Backend</th>
                  <th className="colhead h-10 pr-6 text-right">Events</th>
                  <th className="colhead h-10 pr-6 text-right">Duration</th>
                  <th className="colhead h-10 text-right">Result</th>
                </tr>
              </thead>
              <tbody>
                {episodes.map((ep) => (
                  <tr key={ep.episode_id} className="border-t border-rule transition-colors hover:bg-sheet">
                    <td className="h-11 whitespace-nowrap pr-6 font-mono text-mono tnum">
                      {clock(ep.started_at)} <span className="text-ink-3">{day(ep.started_at)}</span>
                    </td>
                    <td className="h-11 max-w-[320px] truncate pr-6 font-mono text-mono" title={ep.episode_id}>
                      {ep.episode_id}
                    </td>
                    <td className="h-11 pr-6 font-mono text-mono text-ink-2">{ep.backend}</td>
                    <td className="h-11 pr-6 text-right font-mono text-mono tnum">{ep.n_events}</td>
                    <td className="h-11 pr-6 text-right font-mono text-mono text-ink-2 tnum">{duration(ep)}</td>
                    <td className={clsx("h-11 text-right", ep.passed === false ? "font-semibold" : "text-ink-2")}>
                      {episodeResult(ep)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="border-b border-rule md:hidden">
              {episodes.map((ep) => (
                <li key={ep.episode_id} className="border-t border-rule py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-mono tnum">
                      {clock(ep.started_at)} <span className="text-ink-3">{day(ep.started_at)}</span>
                    </span>
                    <span className={clsx("text-small", ep.passed === false ? "font-semibold" : "text-ink-2")}>
                      {episodeResult(ep)}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-mono text-ink-2" title={ep.episode_id}>
                    {ep.episode_id}
                  </p>
                  <p className="mt-1 flex justify-between gap-3 font-mono text-mono-sm text-ink-3 tnum">
                    <span className="truncate">{ep.backend}</span>
                    <span className="shrink-0">
                      {ep.n_events} events · {duration(ep)}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </div>
  )
}
