import { useRef, useState } from 'react'
import { RULES } from '../rules'
import { MAX_FILE_BYTES } from '../parser/limits'
import type { SampleKey } from '../samples'
import { Button, Card, Eyebrow } from './primitives'

interface Props {
  onFile: (file: File) => void
  onSample: (key: SampleKey) => void
  error?: string | null
}

export function Landing({ onFile, onSample, error }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <section
      aria-labelledby="landing-title"
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const f = e.dataTransfer.files[0]
        if (f) onFile(f)
      }}
      className="mx-auto max-w-3xl animate-fade-up"
    >
      <div className="text-center pt-6 md:pt-12 pb-8">
        <Eyebrow className="mb-3">Browser log analyzer</Eyebrow>
        <h1 id="landing-title" className="font-display text-3xl md:text-5xl font-extrabold tracking-tight">
          Drop in a log. See what looks wrong, <span className="text-[#4c8dff]">and why.</span>
        </h1>
        <p className="mt-4 text-[#e6edf7]/70 max-w-xl mx-auto">
          LogLens runs a handful of explainable detection rules over a Sysmon or Linux auth log, shows a timeline, and lets you practise the real SOC decision: close, investigate or escalate.
        </p>
      </div>

      <div
        className={`rounded-2xl border-2 border-dashed p-8 md:p-10 text-center transition-colors ${over ? 'border-[#4c8dff] bg-[#4c8dff]/10' : 'border-[#1e2a44] bg-[#1e2a44]/20'}`}
      >
        <p className="text-4xl mb-3" aria-hidden="true">
          🔍
        </p>
        <p className="text-[#e6edf7]/80 font-semibold mb-1">{over ? 'Drop it like it’s hot' : 'Drag a log file here'}</p>
        <p className="text-sm text-[#e6edf7]/60 mb-5">.json, .jsonl, .log or .txt, up to {MAX_FILE_BYTES / 1048576} MB</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button size="lg" onClick={() => onSample('all')}>
            Load sample
          </Button>
          <Button size="lg" variant="secondary" onClick={() => input.current?.click()}>
            Choose file
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          aria-label="Choose a log file"
          accept=".json,.jsonl,.log,.txt,application/json,text/plain"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onFile(f)
            e.target.value = ''
          }}
        />
        <p className="mt-5 text-xs text-[#e6edf7]/60">
          Just want one format?{' '}
          <button type="button" className="underline text-[#4c8dff] cursor-pointer" onClick={() => onSample('sysmon')}>
            Sysmon sample
          </button>{' '}
          or{' '}
          <button type="button" className="underline text-[#4c8dff] cursor-pointer" onClick={() => onSample('auth')}>
            auth.log sample
          </button>
          . All sample data is invented.
        </p>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          😵 {error}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-[#e6edf7]/80">
        <span aria-hidden="true">🔒 </span>Your file never leaves your browser. Parsing and detection run locally in a Web Worker; there are no uploads and no analytics on file content.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <Card as="section">
          <Eyebrow className="mb-2">Supported formats</Eyebrow>
          <ul className="text-sm text-[#e6edf7]/80 space-y-1 list-disc pl-5">
            <li>Sysmon events as JSON lines (EventCode, Image, CommandLine ...)</li>
            <li>A JSON array of Sysmon events</li>
            <li>Linux auth.log / secure (syslog style, sshd and sudo)</li>
          </ul>
        </Card>
        <Card as="section">
          <Eyebrow className="mb-2">Rules in this version</Eyebrow>
          <ul className="text-sm text-[#e6edf7]/80 space-y-1">
            {RULES.map((r) => (
              <li key={r.id} className="flex justify-between gap-3">
                <span>{r.title}</span>
                <span className="text-[#e6edf7]/60 shrink-0">{r.attack.id}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="mt-6 text-center text-xs text-[#e6edf7]/60">
        Honest labelling: these rules are heuristics, validated on invented sample data only. They will miss things and they will flag harmless things. LogLens is a learning tool, not a SIEM or an EDR.
      </p>
    </section>
  )
}
