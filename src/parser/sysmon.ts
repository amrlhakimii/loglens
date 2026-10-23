import type { LogEvent } from '../types'
import { parseSysmonTime } from './time'

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function stringify(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return undefined
}

/** Turn an already-parsed JSON object into a Sysmon event. Returns null if it has no event code. */
export function sysmonFromObject(obj: unknown, id: number, raw: string): LogEvent | null {
  if (!isPlainObject(obj)) return null
  const flat: Record<string, unknown> = { ...obj }
  // Accept the common "Event.EventData" export shape by flattening one level.
  for (const key of ['EventData', 'Event']) {
    const nested = flat[key]
    if (isPlainObject(nested)) {
      for (const [k, v] of Object.entries(nested)) if (!(k in flat)) flat[k] = v
    }
  }
  const codeRaw = flat['EventCode'] ?? flat['EventID']
  const code = typeof codeRaw === 'number' ? codeRaw : typeof codeRaw === 'string' ? Number(codeRaw) : NaN
  if (!Number.isInteger(code)) return null

  const fields: Record<string, string> = {}
  for (const [k, v] of Object.entries(flat)) {
    const s = stringify(v)
    if (s !== undefined) fields[k] = s
  }
  fields['EventCode'] = String(code)
  const rawTime = fields['UtcTime'] ?? fields['TimeCreated'] ?? ''
  return {
    id,
    raw,
    time: parseSysmonTime(rawTime),
    host: fields['Computer'] || undefined,
    user: fields['User'] || undefined,
    fields,
    source: 'sysmon',
  }
}

export function parseSysmonLine(line: string, id: number): LogEvent | null {
  const trimmed = line.trim()
  if (trimmed.charCodeAt(0) !== 123 /* { */) return null
  let obj: unknown
  try {
    obj = JSON.parse(trimmed)
  } catch {
    return null
  }
  return sysmonFromObject(obj, id, line)
}
