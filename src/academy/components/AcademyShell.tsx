import { useState, type MouseEvent, type ReactNode } from 'react'
import type * as React from 'react'
import { focusRing } from './AcademyUI'

export interface AcademyNavItem {
  label: string
  href: string
  active: boolean
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void
}

export function AcademyShell({
  items,
  children,
  completion,
}: {
  items: AcademyNavItem[]
  children: ReactNode
  completion: number
}): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false)
  const home = items[0]

  return (
    <div className="min-h-dvh bg-[#081120] text-[#e6edf7] [background-image:radial-gradient(circle_at_15%_0%,rgba(76,141,255,0.16),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(34,211,238,0.08),transparent_28%)]">
      <a
        href="#academy-main"
        onClick={(event) => {
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
          event.preventDefault()
          const main = document.getElementById('academy-main')
          main?.focus()
          main?.scrollIntoView()
        }}
        className={`fixed left-4 top-3 z-[100] -translate-y-24 rounded-lg bg-[#67e8f9] px-4 py-2 text-sm font-bold text-[#07101f] transition focus:translate-y-0 motion-reduce:transition-none ${focusRing}`}
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#081120]/90 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a
            href={home.href}
            onClick={(event) => {
              setMenuOpen(false)
              home.onClick(event)
            }}
            className={`group inline-flex items-center gap-3 rounded-lg ${focusRing}`}
            aria-label="LogLens Academy dashboard"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#4c8dff]/35 bg-gradient-to-br from-[#4c8dff]/25 to-[#22d3ee]/10 text-[#67e8f9] shadow-[0_8px_30px_rgba(76,141,255,0.15)]" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 19V8l7-4 7 4v11" strokeLinejoin="round" />
                <path d="M8 19v-7h8v7M3 19h18" strokeLinecap="round" />
              </svg>
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-[#f5f8ff]">
              <span className="text-[#6fa4ff]">LogLens</span> Academy
            </span>
          </a>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Academy navigation">
            {items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={item.onClick}
                aria-current={item.active ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition motion-reduce:transition-none ${focusRing} ${
                  item.active ? 'bg-[#4c8dff]/15 text-[#8ab4ff]' : 'text-[#e6edf7]/65 hover:bg-white/[0.05] hover:text-[#f5f8ff]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-semibold text-emerald-200 md:flex">
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="4" y="8" width="12" height="9" rx="2" />
                <path d="M7 8V6a3 3 0 0 1 6 0v2" />
              </svg>
              Progress stays in this browser
            </div>
            <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-bold tabular-nums text-[#67e8f9] sm:inline">
              {completion}%
            </span>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-controls="academy-mobile-navigation"
              aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
              onClick={() => setMenuOpen((open) => !open)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-[#e6edf7] transition hover:bg-white/10 motion-reduce:transition-none xl:hidden ${focusRing}`}
            >
              {menuOpen ? (
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="m4 4 12 12M16 4 4 16" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="academy-mobile-navigation" className="border-t border-white/[0.07] px-4 py-4 xl:hidden" aria-label="Mobile academy navigation">
            <div className="mx-auto grid max-w-[90rem] gap-1 sm:grid-cols-2">
              {items.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(event) => {
                    setMenuOpen(false)
                    item.onClick(event)
                  }}
                  aria-current={item.active ? 'page' : undefined}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition motion-reduce:transition-none ${focusRing} ${
                    item.active ? 'border border-[#4c8dff]/25 bg-[#4c8dff]/15 text-[#8ab4ff]' : 'text-[#e6edf7]/75 hover:bg-white/[0.05]'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
            <p className="mx-auto mt-3 max-w-[90rem] text-xs text-[#e6edf7]/50 md:hidden">Progress stays in this browser.</p>
          </nav>
        )}
      </header>

      <main id="academy-main" tabIndex={-1} className="mx-auto min-h-[70dvh] w-full max-w-[90rem] px-4 py-8 focus:outline-none sm:px-6 lg:px-8 lg:py-12">
        {children}
      </main>

      <footer className="border-t border-white/[0.07] bg-[#07101f]/80">
        <div className="mx-auto grid max-w-[90rem] gap-6 px-4 py-8 text-sm text-[#e6edf7]/55 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <p className="font-display font-bold text-[#e6edf7]">Defensive learning only</p>
            <p className="mt-2 leading-6">Use these concepts only in environments where you have explicit permission. Follow law, policy, and responsible disclosure practices.</p>
          </div>
          <div>
            <p className="font-display font-bold text-[#e6edf7]">Private by design</p>
            <p className="mt-2 leading-6">Academy progress is stored in local browser storage. Learning content is bundled and makes no third-party or content-API requests.</p>
          </div>
          <div>
            <p className="font-display font-bold text-[#e6edf7]">Independent study companion</p>
            <p className="mt-2 leading-6">Independent study companion based on the public role description. Not affiliated with or endorsed by ExxonMobil. No internal information.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
