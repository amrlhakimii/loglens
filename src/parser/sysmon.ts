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

/** Read "a.b.c" either as a nested path or as a literal dotted key (Elastic flattened exports). */
function getPath(obj: Record<string, unknown>, path: string): unknown {
  if (path in obj) return obj[path]
  let cur: unknown = obj
  for (const part of path.split('.')) {
    if (!isPlainObject(cur)) return undefined
    cur = cur[part]
  }
  return cur
}

function firstString(obj: Record<string, unknown>, paths: string[]): string | undefined {
  for (const p of paths) {
    const s = stringify(getPath(obj, p))
    if (s) return s
  }
  return undefined
}

/** Event ids come as 1, "1", or { "#text": "1" } depending on the exporter. */
function toEventCode(v: unknown): number {
  let x = v
  if (isPlainObject(x)) x = x['#text'] ?? x['Value'] ?? x['value']
  const n = typeof x === 'number' ? x : typeof x === 'string' && x.trim() !== '' ? Number(x) : NaN
  return Number.isInteger(n) && n >= 0 ? n : NaN
}

const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/
const DOTNET_DATE = /^\/?\\?\/?Date\((-?\d+)(?:[+-]\d{4})?\)\\?\/?$/

/** Timestamps from @timestamp / TimeCreated. A zone offset is honoured; none means UTC. */
function parseAnyTime(value: string): string | undefined {
  const d = DOTNET_DATE.exec(value)
  if (d) {
    const ms = Number(d[1])
    return Number.isFinite(ms) && !Number.isNaN(new Date(ms).getTime()) ? new Date(ms).toISOString() : undefined
  }
  if (ISO_WITH_ZONE.test(value)) {
    const ms = Date.parse(value.replace(' ', 'T'))
    if (!Number.isNaN(ms)) return new Date(ms).toISOString()
  }
  return parseSysmonTime(value)
}

const MESSAGE_LINE = /^\s*([A-Za-z][A-Za-z0-9]{0,40}):\s+(.*)$/

/** Get-WinEvent "Message" text: first line is a title, the rest are "Key: value" lines. */
export function parseMessageFields(message: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of message.split(/\r?\n/)) {
    const m = MESSAGE_LINE.exec(line)
    if (!m) continue
    const value = m[2].trim()
    if (value && !(m[1] in out)) out[m[1]] = value
  }
  return out
}

/**
 * Turn an already-parsed JSON object into a Sysmon event. Returns null if it has no event id.
 * Accepts: flat Sysmon JSON (EventCode/EventID/event_id/event.code, string or number),
 * "Event"/"EventData" nesting, Winlogbeat/ECS (winlog.event_id + winlog.event_data),
 * and Get-WinEvent | ConvertTo-Json (Id + "Message" text with Key: value lines).
 */
export function sysmonFromObject(obj: unknown, id: number, raw: string): LogEvent | null {
  if (!isPlainObject(obj)) return null
  const flat: Record<string, unknown> = { ...obj }
  const add = (k: string, v: unknown) => {
    if (!(k in flat) && v !== undefined) flat[k] = v
  }
  // "Event.EventData" export shape: flatten one level.
  for (const key of ['EventData', 'Event']) {
    const nested = flat[key]
    if (isPlainObject(nested)) for (const [k, v] of Object.entries(nested)) add(k, v)
  }
  // Winlogbeat / ECS: winlog.event_data.* become the flat Sysmon fields.
  const winlog = getPath(obj, 'winlog')
  const eventData = getPath(obj, 'winlog.event_data')
  if (isPlainObject(eventData)) for (const [k, v] of Object.entries(eventData)) add(k, v)
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('winlog.event_data.')) add(k.slice('winlog.event_data.'.length), v)
  }
  if (winlog !== undefined || 'process.executable' in obj || isPlainObject(obj['process'])) {
    add('Image', getPath(obj, 'process.executable'))
    add('CommandLine', getPath(obj, 'process.command_line'))
    add('ParentImage', getPath(obj, 'process.parent.executable'))
  }

  // Get-WinEvent: Message holds the Key: value lines. Only trusted when the object looks like a WinEvent record.
  const looksLikeWinEvent = typeof flat['Message'] === 'string' && ('Id' in flat || 'EventId' in flat || 'ProviderName' in flat || 'MachineName' in flat)
  if (looksLikeWinEvent) for (const [k, v] of Object.entries(parseMessageFields(flat['Message'] as string))) add(k, v)

  const codeRaw =
    flat['EventCode'] ?? flat['EventID'] ?? flat['event_id'] ?? getPath(obj, 'event.code') ?? getPath(obj, 'winlog.event_id') ??
    (looksLikeWinEvent || 'ProviderName' in flat || 'MachineName' in flat ? (flat['Id'] ?? flat['EventId']) : undefined)
  const code = toEventCode(codeRaw)
  if (Number.isNaN(code)) return null

  const fields: Record<string, string> = {}
  for (const [k, v] of Object.entries(flat)) {
    const s = stringify(v)
    if (s !== undefined) fields[k] = s
  }
  fields['EventCode'] = String(code)

  const host = fields['Computer'] || firstString(obj, ['host.name', 'winlog.computer_name', 'MachineName', 'Hostname', 'host.hostname', 'host'])
  if (host && !fields['Computer']) fields['Computer'] = host
  const user =
    fields['User'] || firstString(obj, ['winlog.user.name', 'user.name']) || undefined
  if (user && !fields['User']) fields['User'] = user

  const rawTime = fields['UtcTime']
  const time = rawTime ? parseSysmonTime(rawTime) : undefined
  const alt = firstString(obj, ['@timestamp', 'TimeCreated', 'TimeGenerated', 'time', 'timestamp'])
  return {
    id,
    raw,
    time: time ?? (alt ? parseAnyTime(alt) : undefined),
    host: host || undefined,
    user: user || undefined,
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
