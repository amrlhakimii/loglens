import { formatTime } from '../lib/summary'
import { RULES_BY_ID } from '../rules'
import type { Finding, LogEvent, Severity } from '../types'
import { EmptyState, SeverityIcon } from './primitives'

const BUCKETS = 80
const MARK_COLOR: Record<Severity, string> = { critical: 'text-red-300 border-red-400', high: 'text-orange-300 border-orange-400', medium: 'text-yellow-400 border-yellow-500', low: 'text-sky-300 border-sky-400' }

interface Props {
  events: LogEvent[]
  findings: Finding[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function Timeline({ events, findings, selectedId, onSelect }: Props) {
  let min = Infinity
  let max = -Infinity
  const times: number[] = []
  for (const e of events) {
    if (!e.time) continue
    const t = Date.parse(e.time)
    if (Number.isNaN(t)) continue
    times.push(t)
    if (t < min) min = t
    if (t > max) max = t
  }
  if (!times.length) {
    return <EmptyState icon="🕳️" title="No timestamps to plot" description="None of the parsed events carried a time I could read, so there is no timeline." />
  }
  const span = Math.max(1, max - min)
  const pos = (t: number) => ((t - min) / span) * 100
  const counts = new Array<number>(BUCKETS).fill(0)
  for (const t of times) counts[Math.min(BUCKETS - 1, Math.floor(((t - min) / span) * BUCKETS))]++
  const peak = Math.max(...counts)

  const lanes = [...new Set(findings.map((f) => f.ruleId))]
  const untimed = findings.filter((f) => !f.time).length

  return (
    <section aria-labelledby="timeline-heading" className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(57,62,70,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(238,238,238,0.06)' }}>
      <h2 id="timeline-heading" className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mb-1">
        Timeline
      </h2>
      <p className="text-xs text-[#EEEEEE]/60 mb-4">Left to right is time. Bars show how many events happened; marks are alerts. Select a mark to open it.</p>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[9rem_1fr] gap-3 items-end">
            <span className="text-xs text-[#EEEEEE]/70">All events ({times.length})</span>
            <div className="flex items-end gap-px h-16" role="img" aria-label={`Event density from ${formatTime(new Date(min).toISOString())} to ${formatTime(new Date(max).toISOString())}`}>
              {counts.map((c, i) => (
                <div key={i} className="flex-1 rounded-t bg-[#00ADB5]/50" style={{ height: c ? `${Math.max(6, (c / peak) * 100)}%` : '2px', opacity: c ? 1 : 0.25 }} />
              ))}
            </div>
          </div>
          {lanes.map((ruleId) => {
            const rule = RULES_BY_ID[ruleId]
            return (
              <div key={ruleId} className="grid grid-cols-[9rem_1fr] gap-3 items-center mt-3">
                <span className="text-xs text-[#EEEEEE]/80 truncate" title={rule.title}>
                  {rule.title}
                </span>
                <div className="relative h-8 rounded-lg bg-[#222831]">
                  {findings
                    .filter((f) => f.ruleId === ruleId && f.time)
                    .map((f) => {
                      const selected = f.id === selectedId
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => onSelect(f.id)}
                          aria-label={`${f.severity} alert: ${rule.title} at ${formatTime(f.time)}`}
                          title={`${rule.title} - ${formatTime(f.time)}`}
                          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full border bg-[#222831] transition-all cursor-pointer hover:scale-110 ${MARK_COLOR[f.severity]} ${selected ? 'border-2 bg-[#393E46]' : ''}`}
                          style={{ left: `${Math.min(98, Math.max(2, pos(Date.parse(f.time!))))}%` }}
                        >
                          <SeverityIcon severity={f.severity} size={12} />
                        </button>
                      )
                    })}
                </div>
              </div>
            )
          })}
          <div className="grid grid-cols-[9rem_1fr] gap-3 mt-2">
            <span />
            <div className="flex justify-between text-xs text-[#EEEEEE]/60">
              <span>{formatTime(new Date(min).toISOString())}</span>
              <span>{formatTime(new Date(max).toISOString())}</span>
            </div>
          </div>
        </div>
      </div>
      {lanes.length === 0 && <p className="mt-4 text-sm text-[#EEEEEE]/70">No alerts to mark. 🎉</p>}
      {untimed > 0 && <p className="mt-3 text-xs text-[#EEEEEE]/60">{untimed} alerts have no timestamp and are not shown here.</p>}
    </section>
  )
}
