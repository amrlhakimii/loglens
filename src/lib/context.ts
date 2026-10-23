import type { LogEvent } from '../types'

/** The events around index `idx`: up to `radius` before and after. */
export function surrounding(events: LogEvent[], idx: number, radius = 5): LogEvent[] {
  if (idx < 0) return []
  return events.slice(Math.max(0, idx - radius), Math.min(events.length, idx + radius + 1))
}

export interface ParentContext {
  parentImage: string
  /** Earlier process-create event for the parent image on the same host, if the file has one. */
  creator?: LogEvent
}

/** Sysmon only: describe the parent process and, when possible, find where it was started. */
export function parentContext(events: LogEvent[], idx: number): ParentContext | null {
  const e = events[idx]
  const parentImage = e?.fields.ParentImage
  if (!e || e.source !== 'sysmon' || !parentImage) return null
  const want = parentImage.toLowerCase()
  for (let i = idx - 1; i >= 0; i--) {
    const c = events[i]
    if (c.source === 'sysmon' && c.fields.EventCode === '1' && c.host === e.host && (c.fields.Image ?? '').toLowerCase() === want) return { parentImage, creator: c }
  }
  return { parentImage }
}
