import { useId } from 'react'
import type * as React from 'react'
import type { AcademyModule } from '../types'

interface ResponsibilityCoverage {
  responsibility: string
  completed: number
  total: number
  percentage: number
}

export function RoleCoverageChart({ modules, completedModuleIds }: { modules: AcademyModule[]; completedModuleIds: string[] }): React.ReactElement {
  const headingId = useId()
  const completedIds = new Set(completedModuleIds)
  const responsibilityModules = new Map<string, Set<string>>()

  for (const module of modules) {
    for (const responsibility of new Set(module.jdResponsibilities)) {
      const moduleIds = responsibilityModules.get(responsibility) ?? new Set<string>()
      moduleIds.add(module.id)
      responsibilityModules.set(responsibility, moduleIds)
    }
  }

  const coverage: ResponsibilityCoverage[] = Array.from(responsibilityModules, ([responsibility, moduleIds]) => {
    const total = moduleIds.size
    const completed = Array.from(moduleIds).filter((moduleId) => completedIds.has(moduleId)).length
    return {
      responsibility,
      completed,
      total,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    }
  })
    .sort((a, b) => b.total - a.total || a.responsibility.localeCompare(b.responsibility))
    .slice(0, 10)

  return (
    <section aria-labelledby={headingId} className="rounded-2xl border border-[#1e2a44] bg-[#0f1729] p-4 sm:p-5">
      <div className="mb-5">
        <h3 id={headingId} className="font-display text-base font-semibold text-[#e6edf7]">
          Job responsibility coverage
        </h3>
        <p className="mt-1 text-sm text-[#e6edf7]/70">Progress across the responsibilities that appear most often in this academy</p>
      </div>
      {coverage.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#64748b] px-4 py-6 text-center text-sm text-[#e6edf7]/70">
          No job responsibilities are linked to these modules yet.
        </p>
      ) : (
        <ol className="space-y-4">
          {coverage.map(({ responsibility, completed, total, percentage }) => (
            <li key={responsibility}>
              <div className="mb-1.5 flex items-start justify-between gap-4 text-sm">
                <span className="font-medium leading-5 text-[#e6edf7]">{responsibility}</span>
                <span className="shrink-0 font-mono font-semibold tabular-nums text-[#67e8f9]">{percentage}%</span>
              </div>
              <div
                role="progressbar"
                aria-label={`${responsibility} completion`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percentage}
                aria-valuetext={`${completed} of ${total} linked modules completed`}
                className="h-3 overflow-hidden rounded-full border border-[#334155] bg-[#1e2a44]"
              >
                <div
                  className="h-full rounded-full bg-[#4c8dff]"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[#e6edf7]/65">
                {completed} of {total} linked {total === 1 ? 'module' : 'modules'} completed
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
