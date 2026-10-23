import { useDeferredValue, useMemo, useState } from 'react'
import { compileQuery } from '../lib/query'
import type { Finding, LogEvent } from '../types'
import { EmptyState, Field, SeverityIcon } from './primitives'
import { INPUT_CLASS, MONO } from './styles'

const ROW_H = 28
const VIEW_H = 560
const RENDER_ROWS = Math.ceil(VIEW_H / ROW_H) + 12

export function RawView({ events, findings }: { events: LogEvent[]; findings: Finding[] }) {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const [scrollTop, setScrollTop] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)

  const alertBy = useMemo(() => {
    const m = new Map<number, Finding>()
    for (const f of findings) for (const id of f.eventIds) if (!m.has(id)) m.set(id, f)
    return m
  }, [findings])

  const test = useMemo(() => compileQuery(deferred), [deferred])
  const rows = useMemo(() => (test ? events.filter(test) : events), [events, test])

  const start = Math.min(Math.max(0, Math.floor(scrollTop / ROW_H) - 6), Math.max(0, rows.length - RENDER_ROWS))
  const visible = rows.slice(start, start + RENDER_ROWS)
  const selected = picked !== null ? events.find((e) => e.id === picked) : undefined

  return (
    <section aria-labelledby="raw-heading" className="space-y-3">
      <h2 id="raw-heading" className="sr-only">
        Raw events
      </h2>
      <Field label="Search raw events" htmlFor="raw-search">
        <input
          id="raw-search"
          type="search"
          className={INPUT_CLASS}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setScrollTop(0)
          }}
          placeholder="Text, or field:value such as Image:powershell.exe or src:203.0.113.45"
          autoComplete="off"
          spellCheck={false}
        />
      </Field>
      <p className="text-xs text-[#EEEEEE]/60" aria-live="polite">
        Showing {rows.length.toLocaleString('en-US')} of {events.length.toLocaleString('en-US')} events
      </p>
      {rows.length === 0 ? (
        <EmptyState icon="🔎" title="No events match that search" description="Try plain text, or field:value with a field name from the raw line." />
      ) : (
        <div
          className="overflow-y-auto rounded-2xl bg-[#222831] border border-[#393E46]"
          style={{ height: Math.min(VIEW_H, rows.length * ROW_H + 2) }}
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          tabIndex={0}
          role="region"
          aria-label="Raw event list"
        >
          <ul style={{ height: rows.length * ROW_H, position: 'relative' }}>
            {visible.map((e, i) => {
              const a = alertBy.get(e.id)
              return (
                <li key={e.id} style={{ position: 'absolute', top: (start + i) * ROW_H, height: ROW_H, left: 0, right: 0 }}>
                  <button
                    type="button"
                    onClick={() => setPicked(e.id)}
                    aria-pressed={picked === e.id}
                    className={`flex w-full items-center gap-3 px-3 h-full text-left cursor-pointer transition-colors ${picked === e.id ? 'bg-[#00ADB5]/15' : 'hover:bg-white/5'}`}
                  >
                    <span className="w-14 shrink-0 text-right text-xs tabular-nums text-[#EEEEEE]/60">{e.id}</span>
                    <span className="w-4 shrink-0 text-orange-300">{a && <SeverityIcon severity={a.severity} />}</span>
                    <span className={`${MONO} truncate`}>{a && <span className="sr-only">Alert: </span>}{e.raw}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {selected && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(57,62,70,0.6)', border: '1px solid rgba(238,238,238,0.06)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mb-2">Event on line {selected.id}</h3>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(selected.fields).map(([k, v]) => (
                <tr key={k}>
                  <th scope="row" className="text-left align-top font-medium py-0.5 pr-3 whitespace-nowrap text-[#EEEEEE]/70">
                    {k}
                  </th>
                  <td className={`${MONO} py-0.5 break-all whitespace-pre-wrap`}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
