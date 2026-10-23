import { useCallback, useRef, useState } from 'react'
import { analyze } from '../analysis/client'
import { AnalysisError } from '../analysis/run'
import { MAX_FILE_BYTES, PROGRESS_BAR_MIN_BYTES } from '../parser/limits'
import { SAMPLES, SAMPLE_YEAR, type SampleKey } from '../samples'
import type { Analysis } from '../types'
import { Landing } from './Landing'
import { Workspace } from './Workspace'
import { Button, Card, EmptyState } from './primitives'

type State = { kind: 'idle' } | { kind: 'loading'; name: string; bytes: number; progress: number } | { kind: 'ready'; analysis: Analysis; isSample: boolean }

export default function App() {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const [error, setError] = useState<string | null>(null)
  const run = useRef(0)

  const start = useCallback(async (name: string, data: ArrayBuffer, isSample: boolean) => {
    const my = ++run.current
    setError(null)
    setState({ kind: 'loading', name, bytes: data.byteLength, progress: 0 })
    try {
      const analysis = await analyze({ fileName: name, data, defaultYear: isSample ? SAMPLE_YEAR : undefined }, { onProgress: (progress) => run.current === my && setState((s) => (s.kind === 'loading' ? { ...s, progress } : s)) })
      if (run.current === my) setState({ kind: 'ready', analysis, isSample })
    } catch (err) {
      if (run.current !== my) return
      setError(err instanceof AnalysisError ? err.message : 'Something went wrong while analysing that file.')
      setState({ kind: 'idle' })
    }
  }, [])

  const onFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        setError(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB. LogLens accepts files up to ${MAX_FILE_BYTES / 1048576} MB.`)
        return
      }
      try {
        void start(file.name, await file.arrayBuffer(), false)
      } catch {
        setError('That file could not be read.')
      }
    },
    [start],
  )

  const onSample = useCallback(
    (key: SampleKey) => {
      const s = SAMPLES[key]
      void start(s.name, new TextEncoder().encode(s.text).buffer as ArrayBuffer, true)
    },
    [start],
  )

  const reset = () => {
    run.current++
    setState({ kind: 'idle' })
    setError(null)
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between">
          <button type="button" onClick={reset} className="font-display text-xl font-extrabold tracking-tight cursor-pointer" aria-label="LogLens home">
            <span className="text-[#00ADB5]">Log</span>
            <span>Lens</span>
          </button>
          <span className="rounded-full bg-[#00ADB5]/20 text-[#00ADB5] px-3 py-1 text-xs font-medium">
            <span aria-hidden="true">🔒 </span>Runs in your browser
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 md:px-6 py-6">
        {state.kind === 'idle' && <Landing onFile={onFile} onSample={onSample} error={error} />}
        {state.kind === 'loading' && (
          <div className="mx-auto max-w-2xl" role="status" aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mb-2">Analysing locally</p>
            <p className="font-display text-xl font-bold mb-4 truncate">{state.name}</p>
            {state.bytes > PROGRESS_BAR_MIN_BYTES && (
              <div className="mb-4">
                <div className="h-2 rounded-full bg-[#393E46] overflow-hidden" role="progressbar" aria-label="Parsing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress * 100)}>
                  <div className="h-full bg-[#00ADB5] transition-all" style={{ width: `${Math.round(state.progress * 100)}%` }} />
                </div>
                <p className="text-xs text-[#EEEEEE]/60 mt-1">{Math.round(state.progress * 100)}%</p>
              </div>
            )}
            <div className="space-y-3">
              <div className="skeleton h-20 rounded-2xl" />
              <div className="skeleton h-40 rounded-2xl" />
            </div>
          </div>
        )}
        {state.kind === 'ready' && state.analysis.events.length === 0 && (
          <div className="mx-auto max-w-2xl">
            <Card>
              <EmptyState icon="🤷" title="I could not recognise that format" description="LogLens reads Sysmon JSON lines and Linux auth logs (syslog style). Here are the first lines it saw:">
                <div className="text-left">
                  <pre className="max-w-full overflow-x-auto rounded-xl bg-[#222831] border border-[#393E46] p-3 font-mono text-xs whitespace-pre-wrap break-all">{state.analysis.preview.join('\n') || '(the file is empty)'}</pre>
                  <div className="mt-4 text-center">
                    <Button onClick={reset}>Try another file</Button>
                  </div>
                </div>
              </EmptyState>
            </Card>
          </div>
        )}
        {state.kind === 'ready' && state.analysis.events.length > 0 && <Workspace key={state.analysis.hash} analysis={state.analysis} isSample={state.isSample} onReset={reset} />}
      </main>

      <footer className="border-t border-white/[0.06] py-5 px-4 text-center text-xs text-[#EEEEEE]/60">
        <p>
          Heuristic rules, validated on invented sample data only. Not a SIEM, not an EDR, not production-grade coverage. Your files are processed in this browser tab and never uploaded.
        </p>
        <p className="mt-1">MIT licensed. No analytics on file content.</p>
      </footer>
    </div>
  )
}
