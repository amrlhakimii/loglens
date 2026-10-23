import type { Finding, LogEvent, Severity } from '../types'

export interface Summary {
  events: number
  bySeverity: Record<Severity, number>
  alerts: number
  firstTime?: string
  lastTime?: string
  hosts: string[]
  users: string[]
}

export function summarize(events: LogEvent[], findings: Finding[]): Summary {
  const hosts = new Set<string>()
  const users = new Set<string>()
  let first: string | undefined
  let last: string | undefined
  for (const e of events) {
    if (e.host) hosts.add(e.host)
    if (e.user) users.add(e.user)
    if (e.time) {
      if (!first || e.time < first) first = e.time
      if (!last || e.time > last) last = e.time
    }
  }
  const bySeverity: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const f of findings) bySeverity[f.severity]++
  return { events: events.length, bySeverity, alerts: findings.length, firstTime: first, lastTime: last, hosts: [...hosts].sort(), users: [...users].sort() }
}

export function formatTime(iso?: string): string {
  return iso ? iso.slice(0, 19).replace('T', ' ') + ' UTC' : 'unknown time'
}

export const SEVERITY_LABEL: Record<Severity, string> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }
