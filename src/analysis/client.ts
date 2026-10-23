import { WORKER_TIMEOUT_MS, MAX_FILE_BYTES } from '../parser/limits'
import type { Analysis } from '../types'
import { analyzeBuffer, AnalysisError, type AnalyzeInput } from './run'
import type { WorkerResponse } from './worker'

export interface AnalyzeOptions {
  onProgress?: (fraction: number) => void
  timeoutMs?: number
}

/**
 * Runs analysis in a Web Worker so the UI stays responsive. The worker is terminated after a timeout.
 * Where Workers do not exist (jsdom tests, very old browsers) it falls back to the same code in-thread.
 * Nothing in here touches the network.
 */
export function analyze(input: AnalyzeInput, opts: AnalyzeOptions = {}): Promise<Analysis> {
  if (input.data.byteLength > MAX_FILE_BYTES) {
    return Promise.reject(new AnalysisError('too_large', `That file is ${(input.data.byteLength / 1048576).toFixed(1)} MB. LogLens accepts files up to ${MAX_FILE_BYTES / 1048576} MB.`))
  }
  if (typeof Worker === 'undefined') return analyzeBuffer(input, opts.onProgress)

  return new Promise<Analysis>((resolve, reject) => {
    const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    const timer = setTimeout(() => {
      worker.terminate()
      reject(new AnalysisError('timeout', 'Analysis took too long and was stopped. Try a smaller file or trim it to the time range you care about.'))
    }, opts.timeoutMs ?? WORKER_TIMEOUT_MS)
    const finish = () => {
      clearTimeout(timer)
      worker.terminate()
    }
    worker.onmessage = (ev: MessageEvent<WorkerResponse>) => {
      const m = ev.data
      if (m.type === 'progress') opts.onProgress?.(m.fraction)
      else if (m.type === 'done') {
        finish()
        resolve(m.analysis)
      } else {
        finish()
        reject(new AnalysisError(m.code, m.message))
      }
    }
    worker.onerror = () => {
      finish()
      reject(new AnalysisError('failed', 'The analysis worker crashed. The file may be malformed.'))
    }
    worker.postMessage(input, [input.data])
  })
}
