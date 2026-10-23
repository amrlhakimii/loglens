import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { analyze } from '../src/analysis/client'
import { SAMPLES, SAMPLE_YEAR } from '../src/samples'
import App from '../src/ui/App'

const calls: string[] = []
const spies: Array<() => void> = []

function trap(target: object, name: string) {
  const original = (target as Record<string, unknown>)[name]
  Object.defineProperty(target, name, {
    configurable: true,
    writable: true,
    value: (...args: unknown[]) => {
      calls.push(`${name}(${String(args[0] ?? '')})`)
      throw new Error(`Network call attempted: ${name}`)
    },
  })
  spies.push(() => Object.defineProperty(target, name, { configurable: true, writable: true, value: original }))
}

beforeEach(() => {
  calls.length = 0
  trap(globalThis, 'fetch')
  trap(XMLHttpRequest.prototype, 'open')
  trap(XMLHttpRequest.prototype, 'send')
  trap(navigator, 'sendBeacon')
  vi.stubGlobal(
    'WebSocket',
    class {
      constructor(url: string) {
        calls.push(`WebSocket(${url})`)
        throw new Error('Network call attempted: WebSocket')
      }
    },
  )
  vi.stubGlobal(
    'EventSource',
    class {
      constructor(url: string) {
        calls.push(`EventSource(${url})`)
        throw new Error('Network call attempted: EventSource')
      }
    },
  )
})

afterEach(() => {
  spies.splice(0).forEach((restore) => restore())
  vi.unstubAllGlobals()
})

describe('privacy: no network during analysis (SR-1)', () => {
  it('analysing the sample makes no fetch / XHR / beacon / socket calls', async () => {
    const data = new TextEncoder().encode(SAMPLES.all.text).buffer as ArrayBuffer
    const result = await analyze({ fileName: 'x', data, defaultYear: SAMPLE_YEAR })
    expect(result.findings.length).toBe(6)
    expect(calls).toEqual([])
  })

  it('the full UI flow (load, browse, triage, export) makes no network calls', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Load sample' }))
    const list = await screen.findByRole('listbox', { name: 'Alerts' })
    await user.click(within(list).getByText('Registry Run Key Persistence'))
    await user.click(screen.getByRole('tab', { name: 'Timeline' }))
    await user.click(screen.getByRole('tab', { name: 'Raw events' }))
    await user.click(screen.getByRole('button', { name: 'Export report' }))
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(calls).toEqual([])
  })

  it('the trap works: a fetch call is recorded and throws', () => {
    expect(() => fetch('https://example.invalid/')).toThrow(/Network call attempted/)
    expect(calls).toHaveLength(1)
  })
})

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.(ts|tsx)$/.test(name) ? [p] : []
  })
}

describe('source hygiene', () => {
  const ROOT = process.cwd()
  const files = sourceFiles(join(ROOT, 'src'))
  it('src never uses network APIs or raw HTML injection', () => {
    for (const f of files) {
      const text = readFileSync(f, 'utf8')
      expect(text, f).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|sendBeacon|new WebSocket|EventSource|dangerouslySetInnerHTML|\binnerHTML\b|\beval\s*\(|new Function\s*\(/)
    }
  })
  it('src has no hard-coded external URLs except the MITRE ATT&CK link', () => {
    for (const f of files) {
      const urls = readFileSync(f, 'utf8').match(/https?:\/\/[^\s'"`)]+/g) ?? []
      for (const u of urls) expect(u, f).toMatch(/^https:\/\/attack\.mitre\.org\/|^http:\/\/www\.w3\.org\//)
    }
  })
  it('public/_headers carries a strict CSP and the required hardening headers', () => {
    const h = readFileSync(join(ROOT, 'public', '_headers'), 'utf8')
    expect(h).toContain("default-src 'self'")
    expect(h).toContain("connect-src 'none'")
    expect(h).toContain('X-Content-Type-Options: nosniff')
    expect(h).toContain('Referrer-Policy: no-referrer')
    expect(h).not.toMatch(/unsafe-inline|unsafe-eval|https?:\/\//)
  })
  it('index.html loads no third-party assets', () => {
    const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
    expect(html).not.toMatch(/(src|href)="https?:/)
  })
})
