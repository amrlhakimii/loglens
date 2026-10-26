import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import RootApp from '../src/RootApp'
import { ACADEMY_PROGRESS_KEY } from '../src/academy/progress'

vi.mock('../src/analysis/client', () => ({
  analyze: vi.fn(() => new Promise(() => {})),
}))

function goTo(hash: string) {
  act(() => {
    window.location.hash = hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('RootApp', () => {
  it('shows the academy dashboard heading by default', async () => {
    render(<RootApp />)
    expect(
      await screen.findByRole('heading', { name: /from first principles to the incident bridge/i }),
    ).toBeInTheDocument()
  })

  it('renders all 18 module cards on the curriculum route', async () => {
    window.location.hash = '#/curriculum'
    render(<RootApp />)
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(18))
    expect(screen.getByText(/of 18 modules shown/i)).toBeInTheDocument()
  })

  it('embeds the analyzer under #/lab without a nested main landmark', async () => {
    window.location.hash = '#/lab'
    render(<RootApp />)
    expect(await screen.findByRole('button', { name: 'Load sample' })).toBeInTheDocument()
    expect(screen.getByLabelText('LogLens analyzer')).toBeInTheDocument()
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('shows the independent-study disclaimer', async () => {
    render(<RootApp />)
    await screen.findByRole('heading', { name: /from first principles/i })
    expect(screen.getByText(/not affiliated with or endorsed by exxonmobil/i)).toBeInTheDocument()
    expect(screen.getByText(/independent study companion based on the public role description/i)).toBeInTheDocument()
  })

  it('persists academy progress to localStorage after checking a readiness item', async () => {
    window.location.hash = '#/readiness'
    render(<RootApp />)
    const checkbox = await screen.findByRole('checkbox', {
      name: /confidentiality, integrity, and availability/i,
    })
    fireEvent.click(checkbox)
    await waitFor(() => {
      const stored = localStorage.getItem(ACADEMY_PROGRESS_KEY)
      expect(stored).toBeTruthy()
      const progress = JSON.parse(stored ?? '{}')
      expect(progress.readinessChecks?.['foundation-language']).toBe(true)
    })
  })

  it('renders a module title after the hash changes to its route', async () => {
    render(<RootApp />)
    await screen.findByRole('heading', { name: /from first principles/i })
    goTo('#/module/cyber-foundations')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cybersecurity Foundations' }),
    ).toBeInTheDocument()
  })
})
