import { compareFindings } from './engine'
import { SEVERITY_LABEL, formatTime, summarize } from './lib/summary'
import { STATUS_LABEL } from './lib/triage'
import { RULES, RULES_BY_ID } from './rules'
import type { Analysis, Exclusion, Finding, LogEvent, Severity, TriageMap } from './types'

export interface ReportInput {
  analysis: Analysis
  findings: Finding[]
  triage: TriageMap
  exclusions: Exclusion[]
  generatedAt: string
}

const MAX_LINES_PER_ALERT = 5
const MAX_LINE_CHARS = 300

function fence(text: string): string {
  const longest = Math.max(2, ...[...text.matchAll(/`+/g)].map((m) => m[0].length))
  return '`'.repeat(longest + 1)
}

function clip(s: string): string {
  return s.length > MAX_LINE_CHARS ? s.slice(0, MAX_LINE_CHARS) + ' ...[truncated]' : s
}

/** Escape characters that would break a Markdown table cell. */
function cell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

export function buildReport({ analysis, findings, triage, exclusions, generatedAt }: ReportInput): string {
  const byId = new Map<number, LogEvent>(analysis.events.map((e) => [e.id, e]))
  const sorted = [...findings].sort(compareFindings)
  const s = summarize(analysis.events, findings)
  const out: string[] = []

  out.push('# LogLens report', '')
  out.push('> LogLens rules are heuristics validated on invented sample data only. This report is a triage aid, not a verdict. Review every alert yourself.', '')
  out.push('## Summary', '')
  out.push(`- File: ${analysis.fileName}`)
  out.push(`- Content hash: ${analysis.hash}`)
  out.push(`- Generated: ${generatedAt}`)
  out.push(`- Format: ${analysis.stats.format}`)
  out.push(`- Events parsed: ${s.events} (lines skipped: ${analysis.stats.skippedLines})`)
  out.push(`- Time range: ${s.firstTime ? `${formatTime(s.firstTime)} to ${formatTime(s.lastTime)}` : 'unknown'}`)
  out.push(`- Hosts: ${s.hosts.join(', ') || 'none'}`)
  out.push(`- Users: ${s.users.join(', ') || 'none'}`)
  out.push(`- Alerts: ${s.alerts} (${(['critical', 'high', 'medium', 'low'] as Severity[]).map((k) => `${s.bySeverity[k]} ${k}`).join(', ')})`)
  const counts = { new: 0, investigating: 0, closed: 0, escalated: 0 }
  for (const f of sorted) counts[triage[f.id]?.status ?? 'new']++
  out.push(`- Triage: ${counts.new} new, ${counts.investigating} investigating, ${counts.closed} closed (benign), ${counts.escalated} escalated`, '')

  out.push('## Alerts', '')
  if (!sorted.length) out.push('No alerts.', '')
  sorted.forEach((f, i) => {
    const rule = RULES_BY_ID[f.ruleId]
    const t = triage[f.id]
    out.push(`### ${i + 1}. [${SEVERITY_LABEL[f.severity].toUpperCase()}] ${rule.title}`, '')
    out.push(`- ATT&CK: ${rule.attack.id} ${rule.attack.name}`)
    out.push(`- When: ${formatTime(f.time)}`)
    out.push(`- Host: ${f.host ?? 'unknown'}`)
    out.push(`- User: ${f.user ?? 'unknown'}`)
    out.push(`- Status: ${STATUS_LABEL[t?.status ?? 'new']}`)
    if (t?.note) out.push(`- Note: ${t.note.replace(/\r?\n/g, ' ')}`)
    out.push(`- Why it fired: ${f.summary}`)
    if (f.detail) out.push(`- Detail: ${f.detail}`)
    out.push('', 'Matched lines:', '')
    // Long alerts (brute force) keep the last line, which is usually the success that matters most.
    const shown = f.eventIds.length > MAX_LINES_PER_ALERT ? [...f.eventIds.slice(0, MAX_LINES_PER_ALERT - 1), f.eventIds[f.eventIds.length - 1]] : f.eventIds
    const lines = shown.map((id) => {
      const ev = byId.get(id)
      return `${id}: ${clip(ev ? ev.raw : '(line not available)')}`
    })
    if (f.eventIds.length > MAX_LINES_PER_ALERT) lines.splice(MAX_LINES_PER_ALERT - 1, 0, `... ${f.eventIds.length - MAX_LINES_PER_ALERT} more lines omitted ...`)
    const block = lines.join('\n')
    const fnc = fence(block)
    out.push(fnc + 'text', block, fnc, '')
    out.push('Next steps:', '', ...rule.nextSteps.map((n) => `- ${n}`), '')
  })

  if (exclusions.length) {
    out.push('## Session exclusions applied', '', 'These were added in this session with "Tune this rule" and are not saved:', '')
    out.push(...exclusions.map((x) => `- ${x.ruleId}: \`${x.query.replace(/`/g, "'")}\``), '')
  }

  out.push('## Rules used', '', '| Rule | Version | ATT&CK | Default severity |', '| --- | --- | --- | --- |')
  out.push(...RULES.map((r) => `| ${cell(r.title)} (${r.id}) | ${r.version} | ${r.attack.id} | ${r.severity} |`), '')
  out.push('_Generated locally in the browser by LogLens. Nothing was uploaded._', '')
  return out.join('\n')
}

