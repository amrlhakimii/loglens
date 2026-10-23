import type { DetectedFormat, LogEvent, ParseResult } from '../types'
import { createAuthParser } from './auth'
import { MAX_EVENTS, MAX_LINE_CHARS } from './limits'
import { parseSysmonLine, sysmonFromObject } from './sysmon'

export interface ParseOptions {
  /** Year assumed for traditional syslog timestamps. */
  defaultYear?: number
  onProgress?: (fraction: number) => void
  maxEvents?: number
  maxLineChars?: number
}

function previewOf(lines: string[]): string[] {
  const out: string[] = []
  for (const l of lines) {
    if (l.trim()) out.push(l.length > 200 ? l.slice(0, 200) + '...' : l)
    if (out.length === 5) break
  }
  return out
}

function formatOf(sysmon: number, auth: number): DetectedFormat {
  if (sysmon && auth) return 'mixed'
  if (sysmon) return 'sysmon'
  if (auth) return 'auth'
  return 'unknown'
}

/** Parse a whole file's text. Never throws on malformed input. */
export function parseLog(text: string, opts: ParseOptions = {}): ParseResult {
  const maxEvents = opts.maxEvents ?? MAX_EVENTS
  const maxLine = opts.maxLineChars ?? MAX_LINE_CHARS
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)

  const events: LogEvent[] = []
  let skipped = 0
  let oversized = 0
  let truncated = false
  let sysmonCount = 0
  let authCount = 0

  // A .json file may hold one array of event objects instead of JSON lines.
  const head = text.trimStart()
  if (head.charCodeAt(0) === 91 /* [ */ && text.length <= 25 * 1024 * 1024) {
    try {
      const arr: unknown = JSON.parse(head)
      if (Array.isArray(arr)) {
        arr.forEach((el, i) => {
          if (events.length >= maxEvents) {
            truncated = true
            return
          }
          const raw = JSON.stringify(el)
          const ev = raw.length > maxLine ? null : sysmonFromObject(el, i + 1, raw)
          if (ev) {
            events.push(ev)
            sysmonCount++
          } else {
            skipped++
            if (raw && raw.length > maxLine) oversized++
          }
        })
        return {
          events,
          stats: { totalLines: arr.length, parsedEvents: events.length, skippedLines: skipped, oversizedLines: oversized, truncated, format: formatOf(sysmonCount, 0) },
          preview: previewOf([head.slice(0, 400)]),
        }
      }
    } catch {
      /* not a JSON array: fall through to line parsing */
    }
  }

  const lines = text.split(/\r?\n/)
  if (lines.length && lines[lines.length - 1] === '') lines.pop()
  const auth = createAuthParser(opts.defaultYear)

  for (let i = 0; i < lines.length; i++) {
    if (opts.onProgress && i % 5000 === 0) opts.onProgress(i / lines.length)
    const line = lines[i]
    if (!line.trim()) continue
    if (line.length > maxLine) {
      oversized++
      skipped++
      continue
    }
    if (events.length >= maxEvents) {
      truncated = true
      break
    }
    const first = line.trimStart().charCodeAt(0)
    const ev = first === 123 /* { */ ? parseSysmonLine(line, i + 1) : auth.parse(line, i + 1)
    if (!ev) {
      skipped++
      continue
    }
    events.push(ev)
    if (ev.source === 'sysmon') sysmonCount++
    else authCount++
  }
  opts.onProgress?.(1)

  const format = formatOf(sysmonCount, authCount)
  return {
    events,
    stats: { totalLines: lines.length, parsedEvents: events.length, skippedLines: skipped, oversizedLines: oversized, truncated, format },
    preview: format === 'unknown' ? previewOf(lines) : [],
  }
}
