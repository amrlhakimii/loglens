import type { LogEvent } from '../types'

const FIELD_QUERY = /^([A-Za-z_][\w.-]*):(.+)$/

/**
 * Search syntax: plain text is a case-insensitive substring match on the raw line.
 * "field:value" matches events whose field contains value (case-insensitive).
 * If an event has no such field, the whole query is tried as plain text, so "09:21" still works.
 * Returns null for an empty query.
 */
export function compileQuery(query: string): ((e: LogEvent) => boolean) | null {
  const q = query.trim()
  if (!q) return null
  const lowerQ = q.toLowerCase()
  const m = FIELD_QUERY.exec(q)
  if (!m) return (e) => e.raw.toLowerCase().includes(lowerQ)
  const key = m[1].toLowerCase()
  const value = m[2].trim().toLowerCase()
  return (e) => {
    for (const k of Object.keys(e.fields)) {
      if (k.toLowerCase() === key) return e.fields[k].toLowerCase().includes(value)
    }
    return e.raw.toLowerCase().includes(lowerQ)
  }
}
