import { useEffect, useRef, type ReactNode } from 'react'
import type { Severity } from '../types'

const GLASS = { background: 'rgba(57,62,70,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(238,238,238,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' } as const

export function Card({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }) {
  return (
    <Tag className={`rounded-2xl p-5 ${className}`} style={GLASS}>
      {children}
    </Tag>
  )
}

export function Eyebrow({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return (
    <p id={id} className={`text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 ${className}`}>
      {children}
    </p>
  )
}

const BUTTON_VARIANTS = {
  primary: 'bg-gradient-to-r from-[#00ADB5] to-[#008f96] hover:from-[#00c2cb] hover:to-[#00ADB5] text-[#222831] font-semibold shadow-[0_4px_14px_rgba(0,173,181,0.3)]',
  secondary: 'bg-[#393E46]/80 hover:bg-[#44494f] text-[#EEEEEE] border border-white/8 focus:border-[#00ADB5]',
  danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/20',
  ghost: 'bg-transparent hover:bg-white/5 text-[#EEEEEE]/60 hover:text-[#EEEEEE]',
} as const
const BUTTON_SIZES = {
  sm: 'px-3 py-1.5 min-h-11 sm:min-h-0 text-sm rounded-lg',
  md: 'px-4 py-2 min-h-11 sm:min-h-0 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
} as const

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...rest
}: { variant?: keyof typeof BUTTON_VARIANTS; size?: keyof typeof BUTTON_SIZES } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
    />
  )
}

const BADGE_VARIANTS = {
  accent: 'bg-[#00ADB5]/20 text-[#00ADB5]',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-yellow-500/20 text-yellow-400',
  danger: 'bg-red-500/20 text-red-400',
  muted: 'bg-[#EEEEEE]/10 text-[#EEEEEE]/70',
} as const

export function Badge({ children, variant = 'muted' }: { children: ReactNode; variant?: keyof typeof BADGE_VARIANTS }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_VARIANTS[variant]}`}>{children}</span>
}

export function EmptyState({ icon, title, description, children }: { icon?: ReactNode; title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center select-none">
      {icon && (
        <div className="text-5xl mb-4 w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(0,173,181,0.08)', border: '1px solid rgba(0,173,181,0.12)' }} aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-[#EEEEEE]/80 font-semibold text-base mb-1">{title}</p>
      {description && <p className="text-[#EEEEEE]/60 text-sm max-w-xs">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}

export interface TabDef {
  id: string
  label: string
}

export function Tabs({ tabs, active, onChange, label }: { tabs: TabDef[]; active: string; onChange: (id: string) => void; label: string }) {
  return (
    <div className="flex gap-1 bg-[#222831] rounded-xl p-1 overflow-x-auto" role="tablist" aria-label={label}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={active === tab.id}
          aria-controls={`panel-${tab.id}`}
          onClick={() => onChange(tab.id)}
          className={`shrink-0 flex-1 px-3 py-2 min-h-11 sm:min-h-0 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
            active === tab.id ? 'bg-[#00ADB5] text-[#222831]' : 'text-[#EEEEEE]/70 hover:text-[#EEEEEE]'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => previous?.focus?.()
  }, [])
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    } else if (e.key === 'Tab' && sheetRef.current) {
      const focusables = sheetRef.current.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, summary, [tabindex]:not([tabindex="-1"])')
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
  return (
    <div className="fixed inset-0 flex items-end md:items-center justify-center md:p-6" style={{ zIndex: 9999 }} onKeyDown={onKeyDown}>
      <div className="absolute inset-0" style={{ background: 'rgba(10,14,20,0.6)', backdropFilter: 'blur(6px)' }} onClick={onClose} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${wide ? 'md:max-w-3xl' : 'md:max-w-md'} max-h-[90dvh] flex flex-col rounded-t-[20px] md:rounded-[20px] animate-sheet-in md:animate-modal-in`}
        style={{ background: '#2d3440', border: '1px solid rgba(0,173,181,0.2)', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)', overflow: 'hidden' }}
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-[#EEEEEE]/70 hover:text-[#EEEEEE] hover:bg-white/10 cursor-pointer transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div role="status" className="fixed top-5 left-1/2 -translate-x-1/2 rounded-full px-5 py-3 text-sm text-[#EEEEEE] backdrop-blur-md" style={{ zIndex: 10000, background: 'rgba(20,20,24,0.85)', border: '1px solid rgba(255,255,255,0.08)', animation: 'toast-in 0.2s ease-out' }}>
      {message}
    </div>
  )
}

const SEVERITY_STYLE: Record<Severity, { cls: string; label: string }> = {
  critical: { cls: 'bg-red-500/25 text-red-300', label: 'Critical' },
  high: { cls: 'bg-orange-500/20 text-orange-300', label: 'High' },
  medium: { cls: 'bg-yellow-500/20 text-yellow-400', label: 'Medium' },
  low: { cls: 'bg-sky-500/20 text-sky-300', label: 'Low' },
}

/** Distinct shapes so severity is never conveyed by colour alone. */
export function SeverityIcon({ severity, size = 12 }: { severity: Severity; size?: number }) {
  const shape = {
    critical: <path d="M6 0.5 11.5 6 6 11.5 0.5 6Z" fill="currentColor" />,
    high: <path d="M6 1 11.5 11H0.5Z" fill="currentColor" />,
    medium: <circle cx="6" cy="6" r="5" fill="currentColor" />,
    low: <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />,
  }[severity]
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      {shape}
    </svg>
  )
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_STYLE[severity]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      <SeverityIcon severity={severity} />
      {s.label}
    </span>
  )
}

export function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs text-[#EEEEEE]/60 mb-1 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  )
}

