import { describe, expect, it, vi } from 'vitest'
import { hashBuffer } from '../src/lib/hash'
import { loadTriage, saveTriage, validateDecision } from '../src/lib/triage'

describe('triage rules', () => {
  it('requires a note to close or escalate, but not to investigate', () => {
    expect(validateDecision('closed', '')).toMatch(/note/)
    expect(validateDecision('closed', '   ')).toMatch(/note/)
    expect(validateDecision('escalated', '')).toMatch(/note/)
    expect(validateDecision('investigating', '')).toBeNull()
    expect(validateDecision('new', '')).toBeNull()
    expect(validateDecision('closed', 'benign: backup agent')).toBeNull()
  })
})

describe('triage persistence', () => {
  it('round-trips through localStorage keyed by hash', () => {
    const map = { 'a:1': { status: 'closed' as const, note: 'ok', updatedAt: '2026-10-24T00:00:00.000Z' } }
    expect(saveTriage('abc', map)).toBe(true)
    expect(loadTriage('abc')).toEqual(map)
    expect(loadTriage('other')).toEqual({})
  })
  it('ignores corrupt or malicious stored data', () => {
    localStorage.setItem('loglens:triage:v1:bad', '{"a:1":{"status":"pwned"},"b":5}')
    expect(loadTriage('bad')).toEqual({})
    localStorage.setItem('loglens:triage:v1:bad2', 'not json')
    expect(loadTriage('bad2')).toEqual({})
  })
  it('survives storage being blocked', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(saveTriage('x', {})).toBe(false)
    spy.mockRestore()
  })
})

describe('content hash', () => {
  it('is stable for equal content and different otherwise', async () => {
    const enc = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer
    expect(await hashBuffer(enc('same'))).toBe(await hashBuffer(enc('same')))
    expect(await hashBuffer(enc('same'))).not.toBe(await hashBuffer(enc('different')))
  })
})
