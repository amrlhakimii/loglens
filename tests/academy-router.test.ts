import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  hrefFor,
  navigateTo,
  parseAcademyHash,
  useAcademyRoute,
  type AcademyRoute,
} from '../src/academy/router'

afterEach(() => {
  window.history.replaceState(null, '', '/')
  vi.restoreAllMocks()
})

describe('academy hash parsing', () => {
  it.each<[string, AcademyRoute]>([
    ['#/', { kind: 'dashboard' }],
    ['#/curriculum', { kind: 'curriculum' }],
    ['#/resources', { kind: 'resources' }],
    ['#/glossary', { kind: 'glossary' }],
    ['#/readiness', { kind: 'readiness' }],
    ['#/lab', { kind: 'lab' }],
    ['#/module/security-basics', { kind: 'module', moduleId: 'security-basics' }],
  ])('parses canonical hash %s', (hash, expected) => {
    expect(parseAcademyHash(hash)).toEqual(expected)
  })

  it('trims hashes and tolerates a missing leading hash', () => {
    expect(parseAcademyHash('  /curriculum  ')).toEqual({ kind: 'curriculum' })
    expect(parseAcademyHash('  #/resources  ')).toEqual({ kind: 'resources' })
    expect(parseAcademyHash('')).toEqual({ kind: 'dashboard' })
    expect(parseAcademyHash('#')).toEqual({ kind: 'dashboard' })
  })

  it('ignores query strings and trailing slashes', () => {
    expect(parseAcademyHash('#/curriculum/?tab=core')).toEqual({ kind: 'curriculum' })
    expect(parseAcademyHash('/readiness///?from=dashboard')).toEqual({ kind: 'readiness' })
    expect(parseAcademyHash('#/?welcome=true')).toEqual({ kind: 'dashboard' })
    expect(parseAcademyHash('#/module/intro/?step=2')).toEqual({ kind: 'module', moduleId: 'intro' })
  })

  it('safely decodes encoded module IDs', () => {
    expect(parseAcademyHash('#/module/network%2Fsecurity%20101%3Fpart%3D1%23lab%25')).toEqual({
      kind: 'module',
      moduleId: 'network/security 101?part=1#lab%',
    })
  })

  it.each([
    '#/unknown',
    '#/module',
    '#/module/',
    '#/module/intro/extra',
    '#/module/%E0%A4%A',
    'curriculum',
    '##/curriculum',
  ])('maps unknown or malformed path %s to not-found', (hash) => {
    expect(parseAcademyHash(hash)).toEqual({ kind: 'not-found' })
  })
})

describe('academy route hrefs and navigation', () => {
  it.each<[Exclude<AcademyRoute, { kind: 'not-found' }>, string]>([
    [{ kind: 'dashboard' }, '#/'],
    [{ kind: 'curriculum' }, '#/curriculum'],
    [{ kind: 'resources' }, '#/resources'],
    [{ kind: 'glossary' }, '#/glossary'],
    [{ kind: 'readiness' }, '#/readiness'],
    [{ kind: 'lab' }, '#/lab'],
  ])('creates canonical hashes', (route, expected) => {
    expect(hrefFor(route)).toBe(expected)
  })

  it('encodes module IDs and round-trips them through parsing', () => {
    const route = { kind: 'module', moduleId: 'network/security 101?part=1#lab%' } as const

    const href = hrefFor(route)

    expect(href).toBe('#/module/network%2Fsecurity%20101%3Fpart%3D1%23lab%25')
    expect(parseAcademyHash(href)).toEqual(route)
  })

  it('navigates to the canonical hash and scrolls to the top', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)

    navigateTo({ kind: 'glossary' })

    expect(window.location.hash).toBe('#/glossary')
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })
})

describe('useAcademyRoute', () => {
  it('updates on hashchange events', () => {
    window.history.replaceState(null, '', '#/')
    const { result } = renderHook(() => useAcademyRoute())

    expect(result.current).toEqual({ kind: 'dashboard' })

    act(() => {
      window.history.replaceState(null, '', '#/module/incident%20response')
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })

    expect(result.current).toEqual({ kind: 'module', moduleId: 'incident response' })
  })

  it('updates on popstate events', () => {
    window.history.replaceState(null, '', '#/curriculum')
    const { result } = renderHook(() => useAcademyRoute())

    expect(result.current).toEqual({ kind: 'curriculum' })

    act(() => {
      window.history.replaceState(null, '', '#/lab')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    expect(result.current).toEqual({ kind: 'lab' })
  })
})
