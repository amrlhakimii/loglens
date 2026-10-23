import type { LogEvent } from '../types'
import { isoFromParts, monthIndex } from './time'

// Every regex here is anchored and built from disjoint character classes, so matching is linear.
const SYSLOG_HEADER = /^([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+(\S+)\s+(.*)$/
const ISO_HEADER = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})?)\s+(\S+)\s+(.*)$/
const PROGRAM = /^([^\s:[]+)(?:\[(\d+)\])?:\s*(.*)$/
const SSH_AUTH = /^(Failed|Accepted) (\S+) for (invalid user )?(\S+) from (\S+) port (\d+)/
const SSH_INVALID = /^Invalid user (\S*) from (\S+)(?: port (\d+))?/

export interface AuthParser {
  parse: (line: string, id: number) => LogEvent | null
}

/**
 * Traditional syslog lines have no year, so one is assumed (default: the current year) and
 * bumped when the month number jumps backwards by more than six months (Dec -> Jan).
 * Timestamps without an offset are treated as UTC.
 */
export function createAuthParser(defaultYear: number = new Date().getUTCFullYear()): AuthParser {
  let year = defaultYear
  let lastMonth = -1

  function parse(line: string, id: number): LogEvent | null {
    let time: string | undefined
    let host: string
    let rest: string

    const iso = ISO_HEADER.exec(line)
    if (iso) {
      const ms = Date.parse(iso[1].includes('Z') || /[+-]\d{2}:\d{2}$/.test(iso[1]) ? iso[1] : iso[1] + 'Z')
      time = Number.isNaN(ms) ? undefined : new Date(ms).toISOString()
      host = iso[2]
      rest = iso[3]
    } else {
      const m = SYSLOG_HEADER.exec(line)
      if (!m) return null
      const mo = monthIndex(m[1])
      if (mo < 0) return null
      if (lastMonth >= 0 && mo + 1 < lastMonth - 6) year += 1
      lastMonth = mo + 1
      time = isoFromParts(year, mo + 1, +m[2], +m[3], +m[4], +m[5])
      host = m[6]
      rest = m[7]
    }

    const p = PROGRAM.exec(rest)
    const fields: Record<string, string> = { host }
    if (!p) {
      fields.program = ''
      fields.message = rest
      return { id, raw: line, time, host, fields, source: 'auth' }
    }
    fields.program = p[1]
    if (p[2]) fields.pid = p[2]
    const message = p[3]
    fields.message = message
    let user: string | undefined

    if (p[1] === 'sshd') {
      const a = SSH_AUTH.exec(message)
      if (a) {
        fields.event = a[1] === 'Failed' ? 'ssh_failed' : 'ssh_accepted'
        fields.method = a[2]
        if (a[3]) fields.invalid_user = 'true'
        fields.user = a[4]
        fields.src = a[5]
        fields.port = a[6]
        user = a[4]
      } else {
        const inv = SSH_INVALID.exec(message)
        if (inv) {
          fields.event = 'ssh_invalid_user'
          fields.user = inv[1]
          fields.src = inv[2]
          if (inv[3]) fields.port = inv[3]
          user = inv[1]
        }
      }
    } else if (p[1] === 'sudo') {
      const colon = message.indexOf(' : ')
      if (colon > 0) {
        user = message.slice(0, colon).trim()
        fields.user = user
        const cmdAt = message.indexOf('COMMAND=')
        if (cmdAt >= 0) fields.command = message.slice(cmdAt + 8)
        fields.event = 'sudo'
      }
    }
    return { id, raw: line, time, host, user, fields, source: 'auth' }
  }

  return { parse }
}
