import { describe, expect, it } from 'vitest'
import { parseLog } from '../src/parser'
import { MAX_LINE_CHARS } from '../src/parser/limits'
import { parseSysmonLine } from '../src/parser/sysmon'
import { createAuthParser } from '../src/parser/auth'
import { parseSample, sshFail } from './helpers'

describe('sysmon parser', () => {
  it('parses all ten lines of the lab sample', () => {
    const r = parseSample('sysmon')
    expect(r.events).toHaveLength(10)
    expect(r.stats.format).toBe('sysmon')
    expect(r.events[1].host).toBe('WIN-LAB01')
    expect(r.events[1].time).toBe('2026-10-23T08:03:40.000Z')
    expect(r.events[1].fields.Image).toContain('powershell.exe')
  })

  it('ignores garbage lines (ported from the lab tests)', () => {
    expect(parseSysmonLine('not json', 1)).toBeNull()
    expect(parseSysmonLine('', 1)).toBeNull()
    expect(parseSysmonLine('[1, 2]', 1)).toBeNull()
    expect(parseSysmonLine('{"no": "code"}', 1)).toBeNull()
    expect(parseSysmonLine('{"EventCode": "abc"}', 1)).toBeNull()
  })

  it('accepts EventID as an alias and flattens EventData', () => {
    const e = parseSysmonLine('{"EventID": 1, "EventData": {"Image": "C:\\\\a.exe"}}', 1)
    expect(e?.fields.Image).toBe('C:\\a.exe')
    expect(e?.fields.EventCode).toBe('1')
  })

  it('parses a JSON array file', () => {
    const r = parseLog('[{"EventCode":1,"Image":"a"},{"EventCode":3},{"nope":1}]')
    expect(r.events).toHaveLength(2)
    expect(r.stats.skippedLines).toBe(1)
  })
})

describe('auth parser', () => {
  it('parses sshd failures and successes', () => {
    const r = parseLog(sshFail('09:00:00', '203.0.113.9', 'bob'), { defaultYear: 2026 })
    expect(r.events).toHaveLength(1)
    const e = r.events[0]
    expect(e.source).toBe('auth')
    expect(e.fields).toMatchObject({ event: 'ssh_failed', user: 'bob', src: '203.0.113.9', program: 'sshd' })
    expect(e.time).toBe('2026-10-23T09:00:00.000Z')
  })

  it('marks invalid users and parses sudo commands', () => {
    const r = parseLog(
      'Oct 23 09:21:05 h sshd[1]: Failed password for invalid user admin from 203.0.113.1 port 1 ssh2\nOct 23 09:25:02 h sudo:  labuser : TTY=pts/1 ; PWD=/ ; USER=root ; COMMAND=/bin/ls -l',
      { defaultYear: 2026 },
    )
    expect(r.events[0].fields.invalid_user).toBe('true')
    expect(r.events[0].fields.user).toBe('admin')
    expect(r.events[1].fields.command).toBe('/bin/ls -l')
    expect(r.events[1].user).toBe('labuser')
  })

  it('parses RFC 3339 timestamps with an offset', () => {
    const r = parseLog('2026-10-23T10:00:00.123456+02:00 h sshd[1]: Accepted publickey for u from 198.51.100.1 port 22 ssh2')
    expect(r.events[0].time).toBe('2026-10-23T08:00:00.123Z')
  })

  it('rolls the year over between December and January', () => {
    const p = createAuthParser(2026)
    const a = p.parse('Dec 31 23:59:59 h cron[1]: x', 1)
    const b = p.parse('Jan  1 00:00:01 h cron[1]: x', 2)
    expect(a?.time?.startsWith('2026-12-31')).toBe(true)
    expect(b?.time?.startsWith('2027-01-01')).toBe(true)
  })

  it('returns null for lines that are not syslog', () => {
    expect(createAuthParser(2026).parse('hello world', 1)).toBeNull()
  })
})

describe('parseLog robustness', () => {
  it('handles empty input', () => {
    const r = parseLog('')
    expect(r.events).toHaveLength(0)
    expect(r.stats.format).toBe('unknown')
  })

  it('shows the first 5 lines for an unknown format and never throws', () => {
    const text = Array.from({ length: 12 }, (_, i) => `just some text ${i}`).join('\n')
    const r = parseLog(text)
    expect(r.stats.format).toBe('unknown')
    expect(r.preview).toHaveLength(5)
    expect(r.preview[0]).toBe('just some text 0')
  })

  it('skips oversized lines and counts them', () => {
    const huge = '{"EventCode":1,"CommandLine":"' + 'A'.repeat(MAX_LINE_CHARS + 10) + '"}'
    const r = parseLog(huge + '\n{"EventCode":3}')
    expect(r.stats.oversizedLines).toBe(1)
    expect(r.events).toHaveLength(1)
  })

  it('parses a mixed sysmon and auth file', () => {
    const r = parseSample('all')
    expect(r.stats.format).toBe('mixed')
    expect(r.events.filter((e) => e.source === 'sysmon')).toHaveLength(10)
    expect(r.events.filter((e) => e.source === 'auth').length).toBeGreaterThan(20)
  })

  it('tolerates CRLF, a BOM and blank lines', () => {
    const r = parseLog('\ufeff{"EventCode":1}\r\n\r\n{"EventCode":3}\r\n')
    expect(r.events.map((e) => e.id)).toEqual([1, 3])
  })

  it('stops at the event cap', () => {
    const r = parseLog('{"EventCode":1}\n{"EventCode":1}\n{"EventCode":1}', { maxEvents: 2 })
    expect(r.events).toHaveLength(2)
    expect(r.stats.truncated).toBe(true)
  })

  it('does not blow up on pathological input (linear-time regexes)', () => {
    const evil = 'Oct 23 ' + ' '.repeat(50_000) + 'x'
    const evil2 = 'a'.repeat(60_000) + '['.repeat(1000)
    const t0 = performance.now()
    parseLog([evil, evil2, 'Oct 23 09:00:00 ' + 'h '.repeat(20_000)].join('\n'))
    expect(performance.now() - t0).toBeLessThan(1000)
  })
})
