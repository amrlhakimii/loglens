import { MAX_FINDING_EVENTS } from './parser/limits'
import { compileQuery } from './lib/query'
import { RULES } from './rules'
import { DEFAULT_BRUTE_FORCE } from './rules/sshBruteForce'
import type { Exclusion, Finding, LogEvent, Rule, RuleContext, Severity } from './types'

export const DEFAULT_CONTEXT: RuleContext = { bruteForce: { ...DEFAULT_BRUTE_FORCE } }
/** Stops a pathological file (every line matching) from producing millions of alerts. */
export const MAX_FINDINGS_PER_RULE = 2000

export const SEVERITY_ORDER: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 }

export interface DetectResult {
  findings: Finding[]
  /** Rule ids that hit MAX_FINDINGS_PER_RULE. */
  cappedRules: string[]
}

export function detect(events: LogEvent[], rules: Rule[] = RULES, ctx: RuleContext = DEFAULT_CONTEXT): DetectResult {
  const findings: Finding[] = []
  const counts = new Map<string, number>()
  const capped = new Set<string>()

  const push = (rule: Rule, f: Omit<Finding, 'id' | 'ruleId'>) => {
    const n = counts.get(rule.id) ?? 0
    if (n >= MAX_FINDINGS_PER_RULE) {
      capped.add(rule.id)
      return
    }
    counts.set(rule.id, n + 1)
    const eventIds = f.eventIds.slice(0, MAX_FINDING_EVENTS)
    findings.push({ ...f, eventIds, id: `${rule.id}:${eventIds[0]}`, ruleId: rule.id })
  }

  const perEvent = rules.filter((r) => !r.detectWindow)
  for (const e of events) {
    for (const rule of perEvent) {
      if (!rule.appliesTo.includes(e.source) || !rule.match(e, ctx)) continue
      const hit = rule.describe?.(e, ctx) ?? { summary: rule.title, fields: [] }
      push(rule, {
        severity: hit.severity ?? rule.severity,
        eventIds: [e.id],
        summary: hit.summary,
        detail: hit.detail,
        highlight: hit.fields,
        host: e.host,
        user: e.user,
        time: e.time,
      })
    }
  }
  for (const rule of rules) {
    if (!rule.detectWindow) continue
    const scoped = events.filter((e) => rule.appliesTo.includes(e.source))
    for (const hit of rule.detectWindow(scoped, ctx)) {
      push(rule, {
        severity: hit.severity ?? rule.severity,
        eventIds: hit.eventIds,
        summary: hit.summary,
        detail: hit.detail,
        highlight: hit.fields,
        host: hit.host,
        user: hit.user,
        time: hit.time,
      })
    }
  }
  return { findings, cappedRules: [...capped] }
}

/** Session-only tuning: hide findings of a rule when any of their events matches the exclusion query. */
export function applyExclusions(findings: Finding[], eventsById: Map<number, LogEvent>, exclusions: Exclusion[]): Finding[] {
  if (!exclusions.length) return findings
  const compiled = exclusions.map((x) => ({ ruleId: x.ruleId, test: compileQuery(x.query) })).filter((x) => x.test)
  return findings.filter((f) => {
    for (const x of compiled) {
      if (x.ruleId !== f.ruleId) continue
      if (f.eventIds.some((id) => {
        const ev = eventsById.get(id)
        return ev ? x.test!(ev) : false
      })) return false
    }
    return true
  })
}

export function compareFindings(a: Finding, b: Finding): number {
  const sev = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity]
  if (sev) return sev
  return (a.time ?? '').localeCompare(b.time ?? '') || a.eventIds[0] - b.eventIds[0]
}
