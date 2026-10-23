/** Build an ISO string (UTC) from calendar parts, or undefined when out of range. */
export function isoFromParts(y: number, mo: number, d: number, h: number, mi: number, s: number): string | undefined {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 60) return undefined
  const ms = Date.UTC(y, mo - 1, d, h, mi, Math.min(s, 59))
  const date = new Date(ms)
  if (Number.isNaN(ms) || date.getUTCMonth() !== mo - 1) return undefined
  return date.toISOString()
}

const SYSMON_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/

/** Sysmon UtcTime ("2026-10-23 08:01:12.345") is already UTC. */
export function parseSysmonTime(value: string): string | undefined {
  const m = SYSMON_TIME.exec(value)
  if (!m) return undefined
  return isoFromParts(+m[1], +m[2], +m[3], +m[4], +m[5], +m[6])
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function monthIndex(abbr: string): number {
  return MONTHS.indexOf(abbr)
}
