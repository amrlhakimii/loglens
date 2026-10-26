import type { ReactNode } from 'react'
import type * as React from 'react'

export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67e8f9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#081120]'

export const primaryAction = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4c8dff] to-[#22d3ee] px-5 py-2.5 text-sm font-bold text-[#07101f] shadow-[0_12px_32px_rgba(34,211,238,0.18)] transition hover:-translate-y-0.5 hover:brightness-110 motion-reduce:transform-none motion-reduce:transition-none ${focusRing}`

export const secondaryAction = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-[#e6edf7] transition hover:border-[#4c8dff]/60 hover:bg-[#4c8dff]/10 motion-reduce:transition-none ${focusRing}`

export const fieldClass = `min-h-11 w-full rounded-xl border border-white/10 bg-[#081120]/80 px-3.5 py-2.5 text-sm text-[#e6edf7] placeholder:text-[#e6edf7]/40 transition hover:border-white/20 focus:border-[#67e8f9] motion-reduce:transition-none ${focusRing}`

export function Panel({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'article' | 'div' | 'aside'
}): React.ReactElement {
  return (
    <Tag className={`rounded-2xl border border-white/[0.08] bg-[#111d33]/75 shadow-[0_22px_70px_rgba(0,0,0,0.2)] backdrop-blur-xl ${className}`}>
      {children}
    </Tag>
  )
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }): React.ReactElement {
  return <p className={`text-xs font-bold uppercase tracking-[0.2em] text-[#67e8f9] ${className}`}>{children}</p>
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'blue' | 'green' | 'cyan' | 'amber'
}): React.ReactElement {
  const tones = {
    neutral: 'border-white/10 bg-white/[0.06] text-[#e6edf7]/75',
    blue: 'border-[#4c8dff]/25 bg-[#4c8dff]/10 text-[#8ab4ff]',
    green: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
    cyan: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200',
    amber: 'border-amber-300/25 bg-amber-300/10 text-amber-200',
  }
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}): React.ReactElement {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-white/[0.07] pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-[#f5f8ff] sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[#e6edf7]/70">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  )
}

export function EmptyState({
  title,
  description,
  action,
  headingAs: Heading = 'h2',
}: {
  title: string
  description: string
  action?: ReactNode
  headingAs?: 'h1' | 'h2'
}): React.ReactElement {
  return (
    <Panel className="px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#67e8f9]/20 bg-[#67e8f9]/10 text-[#67e8f9]" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4M8.5 11h5" strokeLinecap="round" />
        </svg>
      </div>
      <Heading className="mt-4 font-display text-xl font-bold text-[#f5f8ff]">{title}</Heading>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#e6edf7]/65">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </Panel>
  )
}

export function CheckIcon({ className = 'h-4 w-4' }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m4 10 4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ArrowIcon({ className = 'h-4 w-4' }: { className?: string }): React.ReactElement {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10h12m-5-5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function SearchIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="m13 13 4 4" strokeLinecap="round" />
    </svg>
  )
}
