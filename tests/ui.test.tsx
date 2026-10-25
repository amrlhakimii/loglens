import { render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../src/ui/App'

async function loadSample(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Load sample' }))
  return screen.findByRole('listbox', { name: 'Alerts' })
}

describe('UI smoke', () => {
  it('shows the honest labelling and privacy line on the landing page', () => {
    render(<App />)
    expect(screen.getByText(/never leaves your browser/i)).toBeInTheDocument()
    expect(screen.getAllByText(/heuristic/i).length).toBeGreaterThan(0)
    expect(document.body.textContent).not.toMatch(/AI-powered/i)
  })

  it('load sample -> alerts appear with ATT&CK id, explanation, next steps and raw lines', async () => {
    const user = userEvent.setup()
    render(<App />)
    const list = await loadSample(user)
    const options = within(list).getAllByRole('option')
    expect(options.length).toBe(6) // 5 sysmon + 1 auth
    expect(within(list).getByText('SSH Brute Force')).toBeInTheDocument()

    // the detail panel for the selected (critical) alert
    expect(screen.getByRole('link', { name: /T1110/ })).toHaveAttribute('href', 'https://attack.mitre.org/techniques/T1110/')
    expect(screen.getByText(/Why does this matter/i)).toBeInTheDocument()
    expect(screen.getByText(/What to check next/i)).toBeInTheDocument()
    const matched = screen.getByRole('list', { name: 'Matched raw lines' })
    expect(within(matched).getAllByRole('listitem').length).toBeGreaterThanOrEqual(9)

    // sub-sample: a sysmon alert
    await user.click(within(list).getByText('Suspicious LSASS Memory Access'))
    expect(screen.getByRole('link', { name: /T1003\.001/ })).toBeInTheDocument()
    expect(within(screen.getByRole('list', { name: 'Matched raw lines' })).getByText(/dumper\.exe/)).toBeInTheDocument()
  })

  it('blocks closing without a note, then persists the decision across a reload', async () => {
    const user = userEvent.setup()
    const first = render(<App />)
    const list = await loadSample(user)
    await user.click(within(list).getByText('Scheduled Task Created via schtasks'))

    await user.click(screen.getByRole('radio', { name: 'Closed (benign)' }))
    await user.click(screen.getByRole('button', { name: 'Save decision' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/note/i)
    expect(Object.keys(localStorage)).toHaveLength(0)

    await user.type(screen.getByLabelText(/Note/), 'Planned maintenance task, confirmed with owner')
    await user.click(screen.getByRole('button', { name: 'Save decision' }))
    expect(Object.keys(localStorage).some((k) => k.startsWith('loglens:triage:v1:'))).toBe(true)
    const row = within(screen.getByRole('listbox', { name: 'Alerts' })).getByText('Scheduled Task Created via schtasks').closest('button')!
    expect(within(row).getByText('Closed (benign)')).toBeInTheDocument()

    // "reload": throw the app away and load the same content again
    first.unmount()
    render(<App />)
    const list2 = await loadSample(user)
    const row2 = within(list2).getByText('Scheduled Task Created via schtasks').closest('button')!
    expect(within(row2).getByText('Closed (benign)')).toBeInTheDocument()
    await user.click(row2)
    expect(screen.getByLabelText(/Note/)).toHaveValue('Planned maintenance task, confirmed with owner')
  })

  it('escalating also requires a note, investigating does not', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loadSample(user)
    await user.click(screen.getByRole('radio', { name: 'Escalated' }))
    await user.click(screen.getByRole('button', { name: 'Save decision' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Investigating' }))
    await user.click(screen.getByRole('button', { name: 'Save decision' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('arrow keys move through the alert list', async () => {
    const user = userEvent.setup()
    render(<App />)
    const list = await loadSample(user)
    const options = within(list).getAllByRole('option')
    options[0].focus()
    await user.keyboard('{ArrowDown}')
    await waitFor(() => expect(within(screen.getByRole('listbox', { name: 'Alerts' })).getAllByRole('option')[1]).toHaveAttribute('aria-selected', 'true'))
  })

  it('tune this rule: a session-only exclusion hides the alert', async () => {
    const user = userEvent.setup()
    render(<App />)
    const list = await loadSample(user)
    await user.click(within(list).getByText('Suspicious LSASS Memory Access'))
    await user.click(screen.getByText('Tune this rule'))
    await user.type(screen.getByLabelText(/session-only exclusion/i), 'SourceImage:dumper.exe')
    expect(screen.getByText(/would hide 1 alert/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add exclusion' }))
    expect(within(screen.getByRole('listbox', { name: 'Alerts' })).queryByText('Suspicious LSASS Memory Access')).not.toBeInTheDocument()
    expect(localStorage.length).toBe(0)
  })

  it('raw view search supports field:value', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loadSample(user)
    await user.click(screen.getByRole('tab', { name: 'Raw events' }))
    await user.type(screen.getByLabelText('Search raw events'), 'Image:powershell.exe')
    expect(await screen.findByText(/Showing 1 of/)).toBeInTheDocument()
  })

  it('timeline marks open the alert', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loadSample(user)
    await user.click(screen.getByRole('tab', { name: 'Timeline' }))
    await user.click(screen.getByRole('button', { name: /medium alert: PowerShell Encoded Command/i }))
    expect(screen.getByRole('heading', { level: 2, name: 'PowerShell Encoded Command' })).toBeInTheDocument()
  })

  it('shows the first lines for an unknown format instead of crashing', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByLabelText('Choose a log file') as HTMLInputElement
    await user.upload(input, new File(['hello\nthis is not a log\n'], 'weird.txt', { type: 'text/plain' }))
    expect(await screen.findByText(/no recognised events/i)).toBeInTheDocument()
    expect(screen.getByText(/this is not a log/)).toBeInTheDocument()
  })

  it('valid JSON without event ids shows the supported formats and the first lines seen', async () => {
    const user = userEvent.setup()
    render(<App />)
    const input = screen.getByLabelText('Choose a log file') as HTMLInputElement
    await user.upload(input, new File(['{"foo": "bar", "level": "info"}\n{"foo": "baz"}\n'], 'app.jsonl', { type: 'application/json' }))
    expect(await screen.findByText(/no recognised events/i)).toBeInTheDocument()
    for (const fmt of [/Winlogbeat \/ ECS/, /Get-WinEvent/, /Linux auth\.log/, /Sysmon JSON with flat fields/]) expect(screen.getByText(fmt)).toBeInTheDocument()
    expect(screen.getByText(/EVTX/)).toBeInTheDocument()
    expect(screen.getByText(/"foo": "baz"|"foo":"baz"/)).toBeInTheDocument()
  })

  it('rejects a file over the size cap with a clear message', async () => {
    const user = userEvent.setup()
    render(<App />)
    const big = new File(['x'], 'big.log')
    Object.defineProperty(big, 'size', { value: 26 * 1024 * 1024 })
    await user.upload(screen.getByLabelText('Choose a log file'), big)
    expect(await screen.findByRole('alert')).toHaveTextContent(/25 MB/)
  })

  it('exports a Markdown report that can be copied', async () => {
    const user = userEvent.setup()
    render(<App />)
    await loadSample(user)
    await user.click(screen.getByRole('button', { name: 'Export report' }))
    const dialog = await screen.findByRole('dialog', { name: 'Report preview' })
    expect(within(dialog).getByLabelText('Report Markdown')).toHaveTextContent('# LogLens report')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders attacker-controlled text as text, never as HTML', async () => {
    const user = userEvent.setup()
    render(<App />)
    const evil = '{"EventCode":1,"UtcTime":"2026-10-23 08:00:00","Computer":"<img src=x onerror=alert(1)>","Image":"C:\\\\Windows\\\\System32\\\\schtasks.exe","CommandLine":"schtasks /create <script>alert(1)</script>"}\n'
    await user.upload(screen.getByLabelText('Choose a log file'), new File([evil], 'evil.jsonl'))
    await screen.findByRole('listbox', { name: 'Alerts' })
    expect(document.querySelector('script')).toBeNull()
    expect(document.querySelector('img')).toBeNull()
    expect(document.body.textContent).toContain('<script>alert(1)</script>')
  })
})
