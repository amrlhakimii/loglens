import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ACADEMY_PROGRESS_KEY,
  clearProgress,
  completionPercent,
  emptyProgress,
  loadProgress,
  recordQuizScore,
  saveProgress,
  setModuleCompleted,
  setReadinessCheck,
  type AcademyProgress,
} from '../src/academy/progress'

const startedAt = '2025-01-01T00:00:00.000Z'
const updatedAt = '2025-01-02T00:00:00.000Z'

function progress(overrides: Partial<AcademyProgress> = {}): AcademyProgress {
  return {
    completedModuleIds: [],
    quizScores: {},
    readinessChecks: {},
    startedAt,
    updatedAt: startedAt,
    ...overrides,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('academy progress storage', () => {
  it('creates empty progress with a shared ISO timestamp', () => {
    expect(emptyProgress(startedAt)).toEqual({
      completedModuleIds: [],
      quizScores: {},
      readinessChecks: {},
      startedAt,
      updatedAt: startedAt,
    })
    const generated = emptyProgress()
    expect(new Date(generated.startedAt).toISOString()).toBe(generated.startedAt)
  })

  it('saves and loads progress using the academy storage key', () => {
    const value = progress({
      completedModuleIds: ['intro'],
      quizScores: { intro: 88 },
      readinessChecks: { resume: true },
      updatedAt,
      lastModuleId: 'intro',
    })

    saveProgress(value)

    expect(localStorage.getItem(ACADEMY_PROGRESS_KEY)).toBe(JSON.stringify(value))
    expect(loadProgress()).toEqual(value)
  })

  it('deduplicates completed module IDs when saving and loading', () => {
    saveProgress(progress({ completedModuleIds: ['intro', 'intro', 'networking'] }))
    expect(loadProgress().completedModuleIds).toEqual(['intro', 'networking'])

    localStorage.setItem(
      ACADEMY_PROGRESS_KEY,
      JSON.stringify(progress({ completedModuleIds: ['networking', 'networking'] })),
    )
    expect(loadProgress().completedModuleIds).toEqual(['networking'])
  })

  it.each([
    'not json',
    'null',
    '{}',
    JSON.stringify(progress({ completedModuleIds: [1] as unknown as string[] })),
    JSON.stringify(progress({ quizScores: { intro: 101 } })),
    JSON.stringify(progress({ quizScores: { intro: 1.5 } })),
    JSON.stringify(progress({ readinessChecks: { resume: 'yes' as unknown as boolean } })),
    JSON.stringify(progress({ startedAt: 'yesterday' })),
    JSON.stringify({ ...progress(), unknown: true }),
  ])('returns empty progress for corrupt or unknown stored data', (stored) => {
    localStorage.setItem(ACADEMY_PROGRESS_KEY, stored)

    const loaded = loadProgress()

    expect(loaded.completedModuleIds).toEqual([])
    expect(loaded.quizScores).toEqual({})
    expect(loaded.readinessChecks).toEqual({})
    expect(loaded.startedAt).toBe(loaded.updatedAt)
  })

  it('does not throw when storage reads or writes are blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked')
    })
    expect(() => loadProgress()).not.toThrow()
    vi.restoreAllMocks()

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked')
    })
    expect(() => saveProgress(progress())).not.toThrow()
    vi.restoreAllMocks()

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Blocked')
    })
    expect(() => clearProgress()).not.toThrow()
  })

  it('clears only academy progress', () => {
    localStorage.setItem(ACADEMY_PROGRESS_KEY, '{}')
    localStorage.setItem('other', 'value')

    clearProgress()

    expect(localStorage.getItem(ACADEMY_PROGRESS_KEY)).toBeNull()
    expect(localStorage.getItem('other')).toBe('value')
  })
})

describe('academy progress updates', () => {
  it('completes and uncompletes modules immutably without duplicates', () => {
    const original = progress({ completedModuleIds: ['intro', 'intro', 'networking', 'networking'] })
    const completed = setModuleCompleted(original, 'intro', true, updatedAt)
    const uncompleted = setModuleCompleted(completed, 'intro', false, '2025-01-03T00:00:00.000Z')

    expect(original.completedModuleIds).toEqual(['intro', 'intro', 'networking', 'networking'])
    expect(completed).not.toBe(original)
    expect(completed.completedModuleIds).toEqual(['intro', 'networking'])
    expect(completed.updatedAt).toBe(updatedAt)
    expect(completed.lastModuleId).toBe('intro')
    expect(uncompleted.completedModuleIds).toEqual(['networking'])
    expect(uncompleted.updatedAt).toBe('2025-01-03T00:00:00.000Z')
  })

  it.each([
    [-10, 0],
    [0.49, 0],
    [49.5, 50],
    [100.4, 100],
    [Infinity, 100],
    [-Infinity, 0],
    [Number.NaN, 0],
  ])('clamps and rounds quiz score %s to %s', (score, expected) => {
    const original = progress({ quizScores: { earlier: 10 } })
    const updated = recordQuizScore(original, 'intro', score, updatedAt)

    expect(original.quizScores).toEqual({ earlier: 10 })
    expect(updated.quizScores).toEqual({ earlier: 10, intro: expected })
    expect(updated.updatedAt).toBe(updatedAt)
    expect(updated.lastModuleId).toBe('intro')
  })

  it('sets readiness checks immutably', () => {
    const original = progress({ readinessChecks: { resume: false } })
    const updated = setReadinessCheck(original, 'portfolio', true, updatedAt)

    expect(original.readinessChecks).toEqual({ resume: false })
    expect(updated.readinessChecks).toEqual({ resume: false, portfolio: true })
    expect(updated.updatedAt).toBe(updatedAt)
  })

  it.each<[AcademyProgress, number, number]>([
    [progress(), 5, 0],
    [progress({ completedModuleIds: ['a'] }), 3, 33],
    [progress({ completedModuleIds: ['a', 'a', 'b'] }), 3, 67],
    [progress({ completedModuleIds: ['a', 'b', 'c'] }), 2, 100],
    [progress({ completedModuleIds: ['a'] }), 0, 0],
    [progress({ completedModuleIds: ['a'] }), -1, 0],
    [progress({ completedModuleIds: ['a'] }), Number.NaN, 0],
  ])('calculates a bounded integer completion percentage', (value, total, expected) => {
    expect(completionPercent(value, total)).toBe(expected)
  })
})
