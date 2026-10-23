import { describe, expect, it } from 'vitest'
import { analyzeBuffer } from '../src/analysis/run'
import { buildReport } from '../src/report'
import { SAMPLES, SAMPLE_YEAR } from '../src/samples'
import type { TriageMap } from '../src/types'

async function sampleAnalysis() {
  const a = await analyzeBuffer({ fileName: SAMPLES.all.name, data: new TextEncoder().encode(SAMPLES.all.text).buffer as ArrayBuffer, defaultYear: SAMPLE_YEAR })
  return { ...a, durationMs: 0 }
}

describe('markdown report', () => {
  it('matches the snapshot for the combined sample with triage decisions', async () => {
    const analysis = await sampleAnalysis()
    const triage: TriageMap = {
      [analysis.findings.find((f) => f.ruleId === 'schtasks-create')!.id]: { status: 'closed', note: 'Planned task | confirmed with owner', updatedAt: '2026-10-24T10:00:00.000Z' },
      [analysis.findings.find((f) => f.ruleId === 'ssh-brute-force')!.id]: { status: 'escalated', note: 'Login from unknown source after burst', updatedAt: '2026-10-24T10:01:00.000Z' },
    }
    const md = buildReport({
      analysis,
      findings: analysis.findings,
      triage,
      exclusions: [{ ruleId: 'registry-run-key', query: 'Details:`odd`' }],
      generatedAt: '2026-10-24T10:30:00.000Z',
    })
    expect(md).toMatchSnapshot()
  })

  it('states the heuristic caveat, lists rule versions and never says AI-powered', async () => {
    const analysis = await sampleAnalysis()
    const md = buildReport({ analysis, findings: analysis.findings, triage: {}, exclusions: [], generatedAt: 'x' })
    expect(md).toMatch(/heuristics validated on invented sample data only/)
    expect(md).toMatch(/\| SSH Brute Force \(ssh-brute-force\) \| 1\.0\.0 \| T1110 \|/)
    expect(md).not.toMatch(/AI-powered/i)
  })

  it('reports an empty file cleanly', async () => {
    const analysis = await analyzeBuffer({ fileName: 'empty.log', data: new ArrayBuffer(0) })
    const md = buildReport({ analysis, findings: [], triage: {}, exclusions: [], generatedAt: 'x' })
    expect(md).toContain('No alerts.')
  })

  it('uses a longer fence when a log line contains backticks', async () => {
    const line = '{"EventCode":1,"Image":"C:\\\\Windows\\\\System32\\\\schtasks.exe","CommandLine":"schtasks /create ```x```"}'
    const analysis = await analyzeBuffer({ fileName: 'b.jsonl', data: new TextEncoder().encode(line).buffer as ArrayBuffer })
    const md = buildReport({ analysis, findings: analysis.findings, triage: {}, exclusions: [], generatedAt: 'x' })
    expect(md).toContain('````text')
  })
})
