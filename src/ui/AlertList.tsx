import { formatTime } from '../lib/summary'
import { STATUS_LABEL } from '../lib/triage'
import { RULES_BY_ID } from '../rules'
import type { Finding, TriageMap } from '../types'
import { Badge, EmptyState, Field, SeverityBadge } from './primitives'
import { INPUT_CLASS } from './styles'

export type SortKey = 'severity' | 'time'

interface Props {
  findings: Finding[]
  total: number
  selectedId: string | null
  onSelect: (id: string) => void
  triage: TriageMap
  ruleFilter: string
  hostFilter: string
  sort: SortKey
  onRuleFilter: (v: string) => void
  onHostFilter: (v: string) => void
  onSort: (v: SortKey) => void
  ruleOptions: string[]
  hostOptions: string[]
}

export function AlertList(p: Props) {
  const move = (e: React.KeyboardEvent, i: number) => {
    let next: number
    if (e.key === 'ArrowDown') next = Math.min(p.findings.length - 1, i + 1)
    else if (e.key === 'ArrowUp') next = Math.max(0, i - 1)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = p.findings.length - 1
    else return
    e.preventDefault()
    const f = p.findings[next]
    p.onSelect(f.id)
    document.getElementById(`alert-${f.id}`)?.focus()
  }

  return (
    <section aria-labelledby="alerts-heading" className="min-w-0">
      <h2 id="alerts-heading" className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mb-3">
        Alerts ({p.findings.length}
        {p.findings.length !== p.total ? ` of ${p.total}` : ''})
      </h2>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Field label="Rule" htmlFor="f-rule">
          <select id="f-rule" className={INPUT_CLASS} value={p.ruleFilter} onChange={(e) => p.onRuleFilter(e.target.value)}>
            <option value="">All</option>
            {p.ruleOptions.map((id) => (
              <option key={id} value={id}>
                {RULES_BY_ID[id].title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Host" htmlFor="f-host">
          <select id="f-host" className={INPUT_CLASS} value={p.hostFilter} onChange={(e) => p.onHostFilter(e.target.value)}>
            <option value="">All</option>
            {p.hostOptions.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sort" htmlFor="f-sort">
          <select id="f-sort" className={INPUT_CLASS} value={p.sort} onChange={(e) => p.onSort(e.target.value as SortKey)}>
            <option value="severity">Severity</option>
            <option value="time">Time</option>
          </select>
        </Field>
      </div>
      {p.findings.length === 0 ? (
        <EmptyState icon="🎉" title={p.total ? 'Nothing matches those filters' : 'No alerts. Either all clear, or the rules missed it.'} description={p.total ? 'Clear a filter to see the rest.' : 'These rules are heuristics, so absence of alerts is not proof of safety.'} />
      ) : (
        <ul role="listbox" aria-label="Alerts" className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {p.findings.map((f, i) => {
            const rule = RULES_BY_ID[f.ruleId]
            const status = p.triage[f.id]?.status ?? 'new'
            const selected = f.id === p.selectedId
            return (
              <li key={f.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  id={`alert-${f.id}`}
                  aria-selected={selected}
                  tabIndex={selected || (!p.selectedId && i === 0) ? 0 : -1}
                  onClick={() => p.onSelect(f.id)}
                  onKeyDown={(e) => move(e, i)}
                  className={`w-full text-left rounded-2xl p-3 border transition-all cursor-pointer focus:outline-none ${selected ? 'border-[#00ADB5] bg-[#00ADB5]/10' : 'border-white/[0.06] bg-[#393E46]/60 hover:border-[#00ADB5]/40 focus:border-[#00ADB5]'}`}
                >
                  <span className="flex items-center justify-between gap-2 mb-1.5">
                    <SeverityBadge severity={f.severity} />
                    <Badge variant={status === 'new' ? 'muted' : status === 'closed' ? 'success' : status === 'escalated' ? 'danger' : 'accent'}>{STATUS_LABEL[status]}</Badge>
                  </span>
                  <span className="block font-semibold text-sm">{rule.title}</span>
                  <span className="block text-xs text-[#EEEEEE]/70 mt-0.5 line-clamp-2 break-words">{f.summary}</span>
                  <span className="block text-xs text-[#EEEEEE]/60 mt-1.5 truncate">
                    {f.host ?? 'unknown host'} · {f.user ?? 'unknown user'} · {formatTime(f.time)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
