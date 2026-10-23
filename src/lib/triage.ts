import type { TriageEntry, TriageMap, TriageStatus } from '../types'

const PREFIX = 'loglens:triage:v1:'
const STATUSES: TriageStatus[] = ['new', 'investigating', 'closed', 'escalated']

export const STATUS_LABEL: Record<TriageStatus, string> = {
  new: 'New',
  investigating: 'Investigating',
  closed: 'Closed (benign)',
  escalated: 'Escalated',
}

export function noteRequired(status: TriageStatus): boolean {
  return status === 'closed' || status === 'escalated'
}

/** Returns an error message when the decision is not allowed, otherwise null. */
export function validateDecision(status: TriageStatus, note: string): string | null {
  if (noteRequired(status) && !note.trim()) {
    return status === 'closed' ? 'Add a short note saying why this is benign before closing it.' : 'Add a short note saying why you are escalating this.'
  }
  return null
}

function isEntry(v: unknown): v is TriageEntry {
  if (typeof v !== 'object' || v === null) return false
  const e = v as Record<string, unknown>
  return typeof e.status === 'string' && STATUSES.includes(e.status as TriageStatus) && typeof e.updatedAt === 'string' && (e.note === undefined || typeof e.note === 'string')
}

/** Triage lives only in this browser's localStorage, keyed by the file's content hash. */
export function loadTriage(hash: string): TriageMap {
  try {
    const raw = localStorage.getItem(PREFIX + hash)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}
    const out: TriageMap = {}
    for (const [k, v] of Object.entries(parsed)) if (isEntry(v)) out[k] = v
    return out
  } catch {
    return {}
  }
}

export function saveTriage(hash: string, map: TriageMap): boolean {
  try {
    localStorage.setItem(PREFIX + hash, JSON.stringify(map))
    return true
  } catch {
    return false
  }
}
