import { useMemo, useState } from 'react'
import type * as React from 'react'
import type { AcademyLevel, LearningResource, ResourceAccess } from '../types'
import { Badge, EmptyState, PageIntro, Panel, SearchIcon, fieldClass, focusRing, secondaryAction } from './AcademyUI'

const levels: Array<'All' | AcademyLevel> = ['All', 'Foundation', 'Core', 'Advanced']
const accessOptions: Array<'All' | ResourceAccess> = ['All', 'Free', 'Free account', 'Employer access', 'Paid']

export function ResourceLibrary({ resources }: { resources: LearningResource[] }): React.ReactElement {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [level, setLevel] = useState<'All' | AcademyLevel>('All')
  const [access, setAccess] = useState<'All' | ResourceAccess>('All')
  const categories = useMemo(() => ['All', ...Array.from(new Set(resources.flatMap((resource) => resource.categories))).sort()], [resources])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const filteredResources = resources.filter((resource) => {
    const searchable = [resource.title, resource.provider, resource.description, ...resource.categories].join(' ').toLocaleLowerCase()
    return (
      (normalizedQuery === '' || searchable.includes(normalizedQuery)) &&
      (category === 'All' || resource.categories.includes(category)) &&
      (level === 'All' || resource.level === level) &&
      (access === 'All' || resource.access === access)
    )
  })

  const reset = () => {
    setQuery('')
    setCategory('All')
    setLevel('All')
    setAccess('All')
  }

  return (
    <div>
      <PageIntro
        eyebrow="Curated library"
        title="Resources for deliberate practice"
        description="Find standards, documentation, courses, and hands-on learning from reputable providers. Access terms can change, so review each provider before signing up."
      />

      <Panel className="mb-7 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,1fr)_repeat(3,minmax(10rem,0.42fr))]">
          <div>
            <label htmlFor="resource-search" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#e6edf7]/55">Search resources</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e6edf7]/45"><SearchIcon /></span>
              <input
                id="resource-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, provider, or topic"
                className={`${fieldClass} pl-10`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="resource-category" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#e6edf7]/55">Category</label>
            <select id="resource-category" value={category} onChange={(event) => setCategory(event.target.value)} className={fieldClass}>
              {categories.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="resource-level" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#e6edf7]/55">Level</label>
            <select id="resource-level" value={level} onChange={(event) => setLevel(event.target.value as 'All' | AcademyLevel)} className={fieldClass}>
              {levels.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="resource-access" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#e6edf7]/55">Access</label>
            <select id="resource-access" value={access} onChange={(event) => setAccess(event.target.value as 'All' | ResourceAccess)} className={fieldClass}>
              {accessOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
        </div>
      </Panel>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-[#e6edf7]/60" aria-live="polite">
          <strong className="text-[#f5f8ff]">{filteredResources.length}</strong> {filteredResources.length === 1 ? 'resource' : 'resources'} shown
        </p>
        {(query || category !== 'All' || level !== 'All' || access !== 'All') && (
          <button type="button" onClick={reset} className={`text-sm font-semibold text-[#8ab4ff] hover:text-[#67e8f9] ${focusRing}`}>Clear filters</button>
        )}
      </div>

      {filteredResources.length === 0 ? (
        <EmptyState
          title="No resources match those filters"
          description="Try a broader search, choose All in one of the filters, or reset the library."
          action={<button type="button" onClick={reset} className={secondaryAction}>Reset resource filters</button>}
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <li key={resource.id} className="h-full">
              <Panel as="article" className="flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-[#4c8dff]/35 motion-reduce:transform-none motion-reduce:transition-none">
                <div className="flex flex-wrap items-center gap-2">
                  {resource.official && <Badge tone="green">Official source</Badge>}
                  <Badge tone="blue">{resource.level}</Badge>
                  <Badge>{resource.access}</Badge>
                </div>
                <h2 className="mt-4 font-display text-lg font-bold leading-6 text-[#f5f8ff]">{resource.title}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#67e8f9]">{resource.provider}</p>
                <p className="mt-3 flex-1 text-sm leading-6 text-[#e6edf7]/68">{resource.description}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {resource.categories.map((item) => <Badge key={item}>{item}</Badge>)}
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#4c8dff]/30 bg-[#4c8dff]/10 px-4 py-2 text-sm font-bold text-[#8ab4ff] transition hover:border-[#67e8f9]/50 hover:text-[#67e8f9] motion-reduce:transition-none ${focusRing}`}
                >
                  Open resource
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <path d="M11 4h5v5M9 11l7-7M16 12v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </Panel>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
