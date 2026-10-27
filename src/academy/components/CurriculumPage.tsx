import { useState } from 'react'
import type * as React from 'react'
import type { AcademyLevel, AcademyModule, ModuleCategory } from '../types'
import { EmptyState, PageIntro, Panel, SearchIcon, fieldClass, focusRing, secondaryAction } from './AcademyUI'
import { ModuleCard } from './ModuleCard'

const levels: Array<'All' | AcademyLevel> = ['All', 'Foundation', 'Core', 'Advanced']
const categories: Array<'All' | ModuleCategory> = ['All', 'Foundations', 'Defend', 'Investigate', 'Engineer', 'Operate']

export function CurriculumPage({
  modules,
  completedModuleIds,
}: {
  modules: AcademyModule[]
  completedModuleIds: string[]
}): React.ReactElement {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<'All' | AcademyLevel>('All')
  const [category, setCategory] = useState<'All' | ModuleCategory>('All')
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const completed = new Set(completedModuleIds)
  const filteredModules = [...modules]
    .sort((a, b) => a.order - b.order)
    .filter((module) => {
      const searchable = [module.title, module.shortTitle, module.summary, ...module.objectives, ...module.jdResponsibilities].join(' ').toLocaleLowerCase()
      return (
        (normalizedQuery === '' || searchable.includes(normalizedQuery)) &&
        (level === 'All' || module.level === level) &&
        (category === 'All' || module.category === category)
      )
    })

  const reset = () => {
    setQuery('')
    setLevel('All')
    setCategory('All')
  }

  return (
    <div>
      <PageIntro
        eyebrow="18-module pathway"
        title="Curriculum built from zero"
        description="Move in order for the strongest foundation, or filter by role area when you need targeted review. Search includes titles, summaries, objectives, and linked role responsibilities."
      />

      <Panel className="mb-7 p-4 sm:p-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(18rem,1fr)_auto] xl:items-end">
          <div>
            <label htmlFor="curriculum-search" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#e6edf7]/55">Search curriculum</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e6edf7]/45"><SearchIcon /></span>
              <input
                id="curriculum-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search skills, objectives, or responsibilities"
                className={`${fieldClass} pl-10`}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:min-w-[42rem]">
            <fieldset>
              <legend className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#e6edf7]/55">Level</legend>
              <div className="flex flex-wrap gap-1.5">
                {levels.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLevel(item)}
                    aria-pressed={level === item}
                    className={`min-h-10 rounded-lg border px-3 text-xs font-bold transition motion-reduce:transition-none ${focusRing} ${level === item ? 'border-[#67e8f9]/40 bg-[#67e8f9]/15 text-[#67e8f9]' : 'border-white/10 bg-white/[0.04] text-[#e6edf7]/60 hover:border-white/20'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#e6edf7]/55">Category</legend>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    aria-pressed={category === item}
                    className={`min-h-10 rounded-lg border px-3 text-xs font-bold transition motion-reduce:transition-none ${focusRing} ${category === item ? 'border-[#4c8dff]/45 bg-[#4c8dff]/15 text-[#8ab4ff]' : 'border-white/10 bg-white/[0.04] text-[#e6edf7]/60 hover:border-white/20'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </Panel>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[#e6edf7]/60" aria-live="polite">
          <strong className="text-[#f5f8ff]">{filteredModules.length}</strong> of {modules.length} modules shown
        </p>
        {(query || level !== 'All' || category !== 'All') && (
          <button type="button" onClick={reset} className={`text-sm font-semibold text-[#8ab4ff] hover:text-[#67e8f9] ${focusRing}`}>Clear filters</button>
        )}
      </div>

      {filteredModules.length === 0 ? (
        <EmptyState
          title="No modules match that search"
          description="Try a broader skill, remove a filter, or return to the complete curriculum."
          action={<button type="button" onClick={reset} className={secondaryAction}>Show all modules</button>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredModules.map((module) => <ModuleCard key={module.id} module={module} completed={completed.has(module.id)} />)}
        </div>
      )}
    </div>
  )
}
