import { describe, expect, it } from 'vitest'
import { applyExclusions } from '../src/engine'
import { compileQuery } from '../src/lib/query'
import { findingsFor, parseSample } from './helpers'

describe('search query', () => {
  const events = parseSample('all').events
  const count = (q: string) => events.filter(compileQuery(q)!).length

  it('empty query matches nothing special (null)', () => {
    expect(compileQuery('  ')).toBeNull()
  })
  it('substring is case-insensitive', () => {
    expect(count('POWERSHELL')).toBeGreaterThan(0)
  })
  it('field:value matches the field only', () => {
    expect(count('Image:powershell.exe')).toBe(1)
    expect(count('image:notepad')).toBe(1)
    expect(count('src:203.0.113.45')).toBeGreaterThan(5)
  })
  it('falls back to substring when the "field" is not a field (times like 09:21)', () => {
    expect(count('09:21')).toBeGreaterThan(5)
  })
})

describe('session exclusions', () => {
  it('hides only the chosen rule, and only matching findings', () => {
    const { events } = parseSample('all')
    const byId = new Map(events.map((e) => [e.id, e]))
    const all = findingsFor('all')
    const kept = applyExclusions(all, byId, [{ ruleId: 'lsass-memory-access', query: 'SourceImage:dumper.exe' }])
    expect(kept).toHaveLength(all.length - 1)
    const same = applyExclusions(all, byId, [{ ruleId: 'lsass-memory-access', query: 'SourceImage:nothing-like-this' }])
    expect(same).toHaveLength(all.length)
    const otherRule = applyExclusions(all, byId, [{ ruleId: 'schtasks-create', query: 'dumper.exe' }])
    expect(otherRule).toHaveLength(all.length)
  })
  it('can exclude a brute-force source', () => {
    const { events } = parseSample('all')
    const byId = new Map(events.map((e) => [e.id, e]))
    const kept = applyExclusions(findingsFor('all'), byId, [{ ruleId: 'ssh-brute-force', query: 'src:203.0.113.45' }])
    expect(kept.some((f) => f.ruleId === 'ssh-brute-force')).toBe(false)
  })
})
