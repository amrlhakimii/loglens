export interface AcademyProgress {
  completedModuleIds: string[]
  quizScores: Record<string, number>
  readinessChecks: Record<string, boolean>
  startedAt: string
  updatedAt: string
  lastModuleId?: string
}

export const ACADEMY_PROGRESS_KEY = 'loglens:academy:progress:v1'

const progressKeys = new Set([
  'completedModuleIds',
  'quizScores',
  'readinessChecks',
  'startedAt',
  'updatedAt',
  'lastModuleId',
])

function timestamp(now?: string): string {
  if (now !== undefined) {
    const value = new Date(now)
    if (!Number.isNaN(value.getTime())) return value.toISOString()
  }
  return new Date().toISOString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value
}

function parseProgress(value: unknown): AcademyProgress | null {
  if (!isRecord(value) || Object.keys(value).some((key) => !progressKeys.has(key))) return null

  const { completedModuleIds, quizScores, readinessChecks, startedAt, updatedAt, lastModuleId } = value
  if (!Array.isArray(completedModuleIds) || !completedModuleIds.every((id) => typeof id === 'string')) return null
  if (!isRecord(quizScores)) return null
  if (
    !Object.values(quizScores).every(
      (score) => typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 100,
    )
  ) {
    return null
  }
  if (!isRecord(readinessChecks) || !Object.values(readinessChecks).every((checked) => typeof checked === 'boolean')) {
    return null
  }
  if (!isIsoTimestamp(startedAt) || !isIsoTimestamp(updatedAt)) return null
  if (lastModuleId !== undefined && typeof lastModuleId !== 'string') return null

  return {
    completedModuleIds: [...new Set(completedModuleIds)],
    quizScores: { ...quizScores } as Record<string, number>,
    readinessChecks: { ...readinessChecks } as Record<string, boolean>,
    startedAt,
    updatedAt,
    ...(lastModuleId === undefined ? {} : { lastModuleId }),
  }
}

export function emptyProgress(now?: string): AcademyProgress {
  const createdAt = timestamp(now)
  return {
    completedModuleIds: [],
    quizScores: {},
    readinessChecks: {},
    startedAt: createdAt,
    updatedAt: createdAt,
  }
}

export function loadProgress(): AcademyProgress {
  try {
    const stored = localStorage.getItem(ACADEMY_PROGRESS_KEY)
    if (stored === null) return emptyProgress()
    return parseProgress(JSON.parse(stored)) ?? emptyProgress()
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress: AcademyProgress): void {
  try {
    localStorage.setItem(
      ACADEMY_PROGRESS_KEY,
      JSON.stringify({
        ...progress,
        completedModuleIds: [...new Set(progress.completedModuleIds)],
      }),
    )
  } catch {
    return
  }
}

export function setModuleCompleted(
  progress: AcademyProgress,
  moduleId: string,
  completed: boolean,
  now?: string,
): AcademyProgress {
  const completedModuleIds = new Set(progress.completedModuleIds)
  if (completed) completedModuleIds.add(moduleId)
  else completedModuleIds.delete(moduleId)

  return {
    ...progress,
    completedModuleIds: [...completedModuleIds],
    updatedAt: timestamp(now),
    lastModuleId: moduleId,
  }
}

export function recordQuizScore(
  progress: AcademyProgress,
  moduleId: string,
  score: number,
  now?: string,
): AcademyProgress {
  const quizScore = Number.isNaN(score) ? 0 : Math.min(100, Math.max(0, Math.round(score)))
  return {
    ...progress,
    quizScores: {
      ...progress.quizScores,
      [moduleId]: quizScore,
    },
    updatedAt: timestamp(now),
    lastModuleId: moduleId,
  }
}

export function setReadinessCheck(
  progress: AcademyProgress,
  itemId: string,
  checked: boolean,
  now?: string,
): AcademyProgress {
  return {
    ...progress,
    readinessChecks: {
      ...progress.readinessChecks,
      [itemId]: checked,
    },
    updatedAt: timestamp(now),
  }
}

export function completionPercent(progress: AcademyProgress, totalModules: number): number {
  if (!Number.isFinite(totalModules) || totalModules <= 0) return 0
  const completedModules = new Set(progress.completedModuleIds).size
  return Math.min(100, Math.max(0, Math.round((completedModules / totalModules) * 100)))
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(ACADEMY_PROGRESS_KEY)
  } catch {
    return
  }
}
