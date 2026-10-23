/// <reference lib="webworker" />
import { analyzeBuffer, AnalysisError, type AnalyzeInput } from './run'
import type { Analysis } from '../types'

export type WorkerRequest = AnalyzeInput
export type WorkerResponse =
  | { type: 'progress'; fraction: number }
  | { type: 'done'; analysis: Analysis }
  | { type: 'error'; code: 'too_large' | 'failed'; message: string }

const ctx = self as unknown as DedicatedWorkerGlobalScope

ctx.onmessage = async (ev: MessageEvent<WorkerRequest>) => {
  const post = (m: WorkerResponse) => ctx.postMessage(m)
  try {
    const analysis = await analyzeBuffer(ev.data, (fraction) => post({ type: 'progress', fraction }))
    post({ type: 'done', analysis })
  } catch (err) {
    if (err instanceof AnalysisError && err.code === 'too_large') post({ type: 'error', code: 'too_large', message: err.message })
    else post({ type: 'error', code: 'failed', message: 'Something went wrong while analysing that file. It may be malformed or too unusual to parse.' })
  }
}
