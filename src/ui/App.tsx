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

export default function App({ embedded = false }: { embedded?: boolean }) {
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

  const content = (
    <>
      {state.kind === 'idle' && <Landing onFile={onFile} onSample={onSample} error={error} headingAs={embedded ? 'h2' : 'h1'} />}
      {state.kind === 'loading' && (
        <div className="mx-auto max-w-2xl" role="status" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#e6edf7]/60 mb-2">Analysing locally</p>
          <p className="font-display text-xl font-bold mb-4 truncate">{state.name}</p>
          {state.bytes > PROGRESS_BAR_MIN_BYTES && (
            <div className="mb-4">
              <div className="h-2 rounded-full bg-[#1e2a44] overflow-hidden" role="progressbar" aria-label="Parsing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(state.progress * 100)}>
                <div className="h-full bg-[#4c8dff] transition-all" style={{ width: `${Math.round(state.progress * 100)}%` }} />
              </div>
              <p className="text-xs text-[#e6edf7]/60 mt-1">{Math.round(state.progress * 100)}%</p>
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
            <EmptyState icon="🤷" title="No recognised events in that file" description="LogLens could not read any events from it.">
              <div className="text-left max-w-xl">
                <p className="text-sm font-semibold mb-1">Supported formats</p>
                <ul className="list-disc pl-5 text-sm text-[#e6edf7]/80 mb-4 space-y-1">
                  <li>Sysmon JSON with flat fields (EventCode or EventID, Image, CommandLine, ...)</li>
                  <li>Winlogbeat / ECS Sysmon JSON (winlog.event_id and winlog.event_data)</li>
                  <li>Get-WinEvent | ConvertTo-Json (Id plus a Message with Key: value lines)</li>
                  <li>Linux auth.log (sshd and sudo, syslog or RFC 3339 timestamps)</li>
                </ul>
                <p className="text-xs text-[#e6edf7]/60 mb-3">JSON can be one object per line or a single array. EVTX files are not read directly: export them to JSON first.</p>
                <p className="text-sm font-semibold mb-1">First lines LogLens saw</p>
                <pre className="max-w-full overflow-x-auto rounded-xl bg-[#0f1729] border border-[#1e2a44] p-3 font-mono text-xs whitespace-pre-wrap break-all">{state.analysis.preview.join('\n') || '(the file is empty)'}</pre>
                <div className="mt-4 text-center">
                  <Button onClick={reset}>Try another file</Button>
                </div>
              </div>
            </EmptyState>
          </Card>
        </div>
      )}
      {state.kind === 'ready' && state.analysis.events.length > 0 && <Workspace key={state.analysis.hash} analysis={state.analysis} isSample={state.isSample} onReset={reset} />}
    </>
  )

  if (embedded) {
    return (
      <section aria-label="LogLens analyzer" className="w-full px-1 py-2 sm:px-2">
        {content}
      </section>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between">
          <button type="button" onClick={reset} className="font-display text-xl font-extrabold tracking-tight cursor-pointer" aria-label="LogLens home">
            <span className="text-[#4c8dff]">Log</span>
            <span>Lens</span>
          </button>
          <span className="rounded-full bg-[#4c8dff]/20 text-[#4c8dff] px-3 py-1 text-xs font-medium">
            <span aria-hidden="true">🔒 </span>Runs in your browser
          </span>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 md:px-6 py-6">{content}</main>

      <footer className="border-t border-white/[0.06] py-5 px-4 text-center text-xs text-[#e6edf7]/60">
        <p>
          Heuristic rules, validated on invented sample data only. Not a SIEM, not an EDR, not production-grade coverage. Your files are processed in this browser tab and never uploaded.
        </p>
        <p className="mt-1">MIT licensed. No analytics on file content.</p>
      </footer>
    </div>
  )
}
