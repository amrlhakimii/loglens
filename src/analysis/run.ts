import { detect } from '../engine'
import { hashBuffer } from '../lib/hash'
import { parseLog } from '../parser'
import { MAX_FILE_BYTES } from '../parser/limits'
import type { Analysis } from '../types'

export interface AnalyzeInput {
  fileName: string
  data: ArrayBuffer
  /** Year assumed for syslog timestamps that carry none. */
  defaultYear?: number
}

export class AnalysisError extends Error {
  readonly code: 'too_large' | 'timeout' | 'failed'
  constructor(code: 'too_large' | 'timeout' | 'failed', message: string) {
    super(message)
    this.code = code
  }
}

/** Pure analysis, no I/O. Used inside the worker, and directly where Workers are unavailable (tests). */
export async function analyzeBuffer(input: AnalyzeInput, onProgress?: (fraction: number) => void): Promise<Analysis> {
  if (input.data.byteLength > MAX_FILE_BYTES) {
    throw new AnalysisError('too_large', `That file is ${(input.data.byteLength / 1048576).toFixed(1)} MB. LogLens accepts files up to ${MAX_FILE_BYTES / 1048576} MB.`)
  }
  const t0 = performance.now()
  const hash = await hashBuffer(input.data)
  const text = new TextDecoder('utf-8').decode(input.data)
  const parsed = parseLog(text, { defaultYear: input.defaultYear, onProgress })
  const { findings, cappedRules } = detect(parsed.events)
  return {
    ...parsed,
    findings,
    cappedRules,
    hash,
    fileName: input.fileName,
    bytes: input.data.byteLength,
    durationMs: Math.round(performance.now() - t0),
  }
}
