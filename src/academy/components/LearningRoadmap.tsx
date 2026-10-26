import { useId } from 'react'
import type * as React from 'react'
import type { AcademyModule } from '../types'

const WEEKS = [
  { week: 1, start: 0, end: 4, focus: 'Core foundations' },
  { week: 2, start: 4, end: 7, focus: 'Defensive practice' },
  { week: 3, start: 7, end: 11, focus: 'Investigation skills' },
  { week: 4, start: 11, end: 15, focus: 'Security engineering' },
  { week: 5, start: 15, end: 18, focus: 'Operations and readiness' },
] as const

export function LearningRoadmap({ modules, onOpenModule }: { modules: AcademyModule[]; onOpenModule: (moduleId: string) => void }): React.ReactElement {
  const baseId = useId().replace(/:/g, '')
  const headingId = `${baseId}-roadmap-heading`
  const orderedModules = [...modules].sort((a, b) => a.order - b.order)

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-5">
        <h2 id={headingId} className="font-display text-xl font-bold text-[#e6edf7]">
          Five-week learning roadmap
        </h2>
        <p className="mt-1 text-sm text-[#e6edf7]/70">Select any module to open its lesson and practical work.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {WEEKS.map(({ week, start, end, focus }) => {
          const weekModules = orderedModules.slice(start, end)
          return (
            <section
              key={week}
              aria-labelledby={`${baseId}-roadmap-week-${week}`}
              className="relative rounded-2xl border border-[#334155] bg-[#0f1729] p-4"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#67e8f9] bg-[#1e2a44] font-mono text-sm font-bold text-[#e6edf7]">
                  {week}
                </span>
                <div>
                  <h3 id={`${baseId}-roadmap-week-${week}`} className="font-display text-sm font-semibold text-[#e6edf7]">
                    Week {week}
                  </h3>
                  <p className="text-xs text-[#e6edf7]/65">{focus}</p>
                </div>
              </div>
              {weekModules.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#475569] px-3 py-5 text-center text-xs text-[#e6edf7]/65">
                  No modules scheduled
                </p>
              ) : (
                <ol className="space-y-3">
                  {weekModules.map((module) => (
                    <li key={module.id}>
                      <button
                        type="button"
                        onClick={() => onOpenModule(module.id)}
                        aria-label={`Open module ${module.order}: ${module.shortTitle}. ${module.level}, ${module.durationMinutes} minutes.`}
                        className="group w-full rounded-xl border border-[#334155] bg-[#1e2a44] p-3 text-left text-[#e6edf7] shadow-sm transition-colors hover:border-[#4c8dff] hover:bg-[#263654] focus-visible:border-[#67e8f9] focus-visible:shadow-[0_0_0_3px_rgba(103,232,249,0.35)]"
                      >
                        <span className="mb-1 block font-mono text-xs font-semibold uppercase tracking-wide text-[#67e8f9]">
                          Module {module.order}
                        </span>
                        <span className="block text-sm font-semibold leading-5">{module.shortTitle}</span>
                        <span className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#e6edf7]/70">
                          <span>{module.level}</span>
                          <span aria-hidden="true">·</span>
                          <span>{module.durationMinutes} min</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-[#22c55e] bg-[#12302b] p-4 text-[#e6edf7]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#86efac] font-mono text-sm font-bold" aria-hidden="true">
          ✓
        </span>
        <div>
          <h3 className="font-display text-sm font-semibold">Final capstone</h3>
          <p className="mt-0.5 text-sm text-[#e6edf7]/75">Bring the five weeks together in an end-to-end security scenario.</p>
        </div>
      </div>
    </section>
  )
}
