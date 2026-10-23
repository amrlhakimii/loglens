import type { Summary } from '../lib/summary'
import { SEVERITY_LABEL, formatTime } from '../lib/summary'
import type { Analysis, Severity, TriageMap } from '../types'
import { Card, Eyebrow, SeverityIcon } from './primitives'

const ORDER: Severity[] = ['critical', 'high', 'medium', 'low']
const COLOR: Record<Severity, string> = { critical: 'text-red-300', high: 'text-orange-300', medium: 'text-yellow-400', low: 'text-sky-300' }

function Stat({ label, children, sub }: { label: string; children: React.ReactNode; sub?: string }) {
  return (
    <div className="min-w-0">
      <Eyebrow className="mb-1">{label}</Eyebrow>
      <div className="font-display text-xl font-bold truncate">{children}</div>
      {sub && <p className="text-xs text-[#EEEEEE]/60 truncate" title={sub}>{sub}</p>}
    </div>
  )
}

export function SummaryBar({ analysis, summary, triage, isSample }: { analysis: Analysis; summary: Summary; triage: TriageMap; isSample: boolean }) {
  const closed = Object.values(triage).filter((t) => t.status === 'closed').length
  return (
    <Card as="section" className="!p-4 md:!p-5">
      <h2 className="sr-only">Summary</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Events parsed" sub={`${analysis.stats.format} format${analysis.stats.skippedLines ? `, ${analysis.stats.skippedLines} lines skipped` : ''}`}>
          {summary.events.toLocaleString('en-US')}
        </Stat>
        <div className="min-w-0 col-span-2 md:col-span-1">
          <Eyebrow className="mb-1">Alerts: {summary.alerts}</Eyebrow>
          <ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm" aria-label="Alerts by severity">
            {ORDER.map((s) => (
              <li key={s} className={`inline-flex items-center gap-1.5 ${summary.bySeverity[s] ? COLOR[s] : 'text-[#EEEEEE]/50'}`}>
                <SeverityIcon severity={s} />
                <span>
                  {SEVERITY_LABEL[s]} {summary.bySeverity[s]}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#EEEEEE]/60 mt-1">{closed} closed as benign</p>
        </div>
        <Stat label="Time range" sub={summary.lastTime ? `to ${formatTime(summary.lastTime)}` : undefined}>
          <span className="text-base">{summary.firstTime ? formatTime(summary.firstTime) : 'unknown'}</span>
        </Stat>
        <Stat label="Hosts" sub={summary.hosts.join(', ')}>
          {summary.hosts.length}
        </Stat>
        <Stat label="Users" sub={summary.users.join(', ')}>
          {summary.users.length}
        </Stat>
      </div>
      {(isSample || analysis.stats.truncated || analysis.stats.oversizedLines > 0 || analysis.cappedRules.length > 0) && (
        <ul className="mt-3 space-y-1 text-xs text-[#EEEEEE]/70">
          {isSample && <li>🧪 Sample data: every host, user and address in it is invented.</li>}
          {analysis.stats.truncated && <li>⚠️ The file hit the event cap, so only the first events were analysed.</li>}
          {analysis.stats.oversizedLines > 0 && <li>⚠️ {analysis.stats.oversizedLines} very long lines were skipped.</li>}
          {analysis.cappedRules.length > 0 && <li>⚠️ Alert cap reached for: {analysis.cappedRules.join(', ')}. Tune the rule to reduce noise.</li>}
        </ul>
      )}
    </Card>
  )
}
