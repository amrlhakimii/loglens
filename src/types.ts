export type Source = 'sysmon' | 'auth'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type TriageStatus = 'new' | 'investigating' | 'closed' | 'escalated'

export interface LogEvent {
  /** 1-based line number in the input (array index + 1 for JSON arrays). */
  id: number
  raw: string
  /** ISO 8601, UTC. Absent when the line has no parseable timestamp. */
  time?: string
  host?: string
  user?: string
  fields: Record<string, string>
  source: Source
}

export interface RuleContext {
  /** Tunable numbers for windowed rules. */
  bruteForce: { threshold: number; windowSeconds: number }
}

export interface RuleHit {
  summary: string
  /** Field names to highlight in the detail panel. */
  fields: string[]
  /** Optional extra detail (for example a decoded payload). */
  detail?: string
  /** Overrides the rule's default severity for this hit. */
  severity?: Severity
}

export interface WindowHit extends RuleHit {
  eventIds: number[]
  host?: string
  user?: string
  time?: string
}

export interface Rule {
  id: string
  version: string
  title: string
  attack: { id: string; name: string }
  severity: Severity
  /** What the rule looks for, in one or two sentences. */
  explanation: string
  /** Beginner explanation, 3-5 sentences ("Why does this matter?"). */
  whyItMatters: string
  nextSteps: string[]
  /** Human-readable list of the built-in known-false-positive exclusions. */
  allowlist: string[]
  appliesTo: Source[]
  /** Per-event test. Windowed rules return false here and implement detectWindow. */
  match: (event: LogEvent, ctx: RuleContext) => boolean
  /** Describe an event that matched. */
  describe?: (event: LogEvent, ctx: RuleContext) => RuleHit
  /** Whole-file rules (for example brute force). */
  detectWindow?: (events: LogEvent[], ctx: RuleContext) => WindowHit[]
}

export interface Finding {
  /** Stable across reloads of the same file: ruleId + first event id. */
  id: string
  ruleId: string
  severity: Severity
  eventIds: number[]
  summary: string
  detail?: string
  highlight: string[]
  host?: string
  user?: string
  time?: string
}

export type DetectedFormat = 'sysmon' | 'auth' | 'mixed' | 'unknown'

export interface ParseStats {
  totalLines: number
  parsedEvents: number
  skippedLines: number
  oversizedLines: number
  truncated: boolean
  format: DetectedFormat
}

export interface ParseResult {
  events: LogEvent[]
  stats: ParseStats
  /** First lines of the input, shown when the format is unknown. */
  preview: string[]
}

export interface Analysis extends ParseResult {
  findings: Finding[]
  /** Rule ids whose alert count hit the per-rule cap. */
  cappedRules: string[]
  hash: string
  fileName: string
  bytes: number
  durationMs: number
}

export interface TriageEntry {
  status: TriageStatus
  note?: string
  updatedAt: string
}
export type TriageMap = Record<string, TriageEntry>

export interface Exclusion {
  ruleId: string
  /** Substring, or field:value. */
  query: string
}
