import type * as React from 'react'

export function ProgressRing({
  value,
  completed,
  total,
  size = 'large',
}: {
  value: number
  completed: number
  total: number
  size?: 'small' | 'large'
}): React.ReactElement {
  const bounded = Math.min(100, Math.max(0, value))
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (bounded / 100) * circumference
  const dimensions = size === 'large' ? 'h-40 w-40' : 'h-24 w-24'

  return (
    <div
      className={`relative shrink-0 ${dimensions}`}
      role="progressbar"
      aria-label="Academy completion"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={bounded}
      aria-valuetext={`${completed} of ${total} modules completed`}
    >
      <svg viewBox="0 0 100 100" className="-rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(230,237,247,0.08)" strokeWidth="7" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#academy-progress-gradient)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <defs>
          <linearGradient id="academy-progress-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4c8dff" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <strong className={`${size === 'large' ? 'text-3xl' : 'text-xl'} font-display text-[#f5f8ff]`}>{bounded}%</strong>
        <span className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#e6edf7]/55">complete</span>
      </div>
    </div>
  )
}
