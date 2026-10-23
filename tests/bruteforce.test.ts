import { describe, expect, it } from 'vitest'
import { detect } from '../src/engine'
import { parseLog } from '../src/parser'
import { findingsFor, sshFail, sshOk } from './helpers'

const run = (lines: string[]) => detect(parseLog(lines.join('\n'), { defaultYear: 2026 }).events).findings.filter((f) => f.ruleId === 'ssh-brute-force')
const fails = (n: number, src = '203.0.113.45', start = 0, gap = 3) =>
  Array.from({ length: n }, (_, i) => {
    const s = start + i * gap
    return sshFail(`10:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, src)
  })

describe('ssh brute force (default threshold 5 in 120s)', () => {
  it('threshold - 1 failures then a success: no alert', () => {
    expect(run([...fails(4), sshOk('10:00:20')])).toHaveLength(0)
  })
  it('exactly threshold failures, no success: medium alert', () => {
    const f = run(fails(5))
    expect(f).toHaveLength(1)
    expect(f[0].severity).toBe('medium')
    expect(f[0].eventIds).toHaveLength(5)
  })
  it('threshold failures then a success from the same source: critical, success line included', () => {
    const f = run([...fails(5), sshOk('10:00:20')])
    expect(f).toHaveLength(1)
    expect(f[0].severity).toBe('critical')
    expect(f[0].eventIds).toHaveLength(6)
    expect(f[0].summary).toContain('successful login')
  })
  it('a success from a different source does not escalate', () => {
    const f = run([...fails(5), sshOk('10:00:20', '198.51.100.9')])
    expect(f[0].severity).toBe('medium')
  })
  it('failures spread wider than the window do not count', () => {
    expect(run(fails(5, '203.0.113.45', 0, 60))).toHaveLength(0)
  })
  it('separate sources are counted separately', () => {
    const lines = [...fails(3, '203.0.113.1'), ...fails(3, '203.0.113.2', 1)]
    expect(run(lines)).toHaveLength(0)
  })
  it('two bursts from one source far apart give two alerts', () => {
    const second = Array.from({ length: 5 }, (_, i) => sshFail(`11:00:${String(i * 3).padStart(2, '0')}`))
    expect(run([...fails(5), ...second])).toHaveLength(2)
  })
  it('the sample: slow typo then success from 198.51.100.23 is not flagged, the burst from 203.0.113.45 is', () => {
    const f = findingsFor('auth').filter((x) => x.ruleId === 'ssh-brute-force')
    expect(f).toHaveLength(1)
    expect(f[0].summary).toContain('203.0.113.45')
    expect(f[0].summary).toContain('labuser')
  })
})
