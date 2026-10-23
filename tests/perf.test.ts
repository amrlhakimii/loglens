import { describe, expect, it } from 'vitest'
import { analyzeBuffer } from '../src/analysis/run'
import { SAMPLES } from '../src/samples'

/** Manual performance check: `PERF=1 npx vitest run tests/perf.test.ts`. Skipped in normal runs. */
function build(targetBytes: number): ArrayBuffer {
  const lines = SAMPLES.sysmon.text.trim().split('\n')
  const auth = SAMPLES.auth.text.trim().split('\n')
  const out: string[] = []
  let size = 0
  let i = 0
  while (size < targetBytes) {
    const l = i % 5 === 0 ? auth[i % auth.length] : lines[i % lines.length]
    out.push(l)
    size += l.length + 1
    i++
  }
  return new TextEncoder().encode(out.join('\n')).buffer as ArrayBuffer
}

describe.skipIf(!process.env.PERF)('performance (manual)', () => {
  for (const mb of [5, 25]) {
    it(`${mb} MB file analyses in under 15 s`, async () => {
      const data = build(mb * 1024 * 1024 - 1024)
      const t0 = performance.now()
      const r = await analyzeBuffer({ fileName: `${mb}mb.log`, data, defaultYear: 2026 })
      const ms = performance.now() - t0
      console.log(`${mb} MB: ${r.events.length} events, ${r.findings.length} findings, ${Math.round(ms)} ms`)
      expect(ms).toBeLessThan(15_000)
    }, 60_000)
  }
})
