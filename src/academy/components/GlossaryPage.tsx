import { useMemo, useState } from 'react'
import type * as React from 'react'
import { hrefFor } from '../router'
import type { AcademyModule, GlossaryTerm } from '../types'
import { Badge, EmptyState, PageIntro, Panel, SearchIcon, fieldClass, focusRing, secondaryAction } from './AcademyUI'
import { followAcademyLink } from './navigation'

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function GlossaryPage({
  terms,
  modules,
}: {
  terms: GlossaryTerm[]
  modules: AcademyModule[]
}): React.ReactElement {
  const [query, setQuery] = useState('')
  const [letter, setLetter] = useState('All')
  const moduleById = useMemo(() => new Map(modules.map((module) => [module.id, module])), [modules])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const availableLetters = useMemo(() => new Set(terms.map((term) => term.term.charAt(0).toLocaleUpperCase())), [terms])
  const filteredTerms = terms.filter((term) => {
    const searchable = `${term.term} ${term.definition} ${term.plainEnglish}`.toLocaleLowerCase()
    return (letter === 'All' || term.term.toLocaleUpperCase().startsWith(letter)) && (normalizedQuery === '' || searchable.includes(normalizedQuery))
  })

  const reset = () => {
    setQuery('')
    setLetter('All')
  }

  return (
    <div>
      <PageIntro
        eyebrow="Plain-language reference"
        title="Cybersecurity glossary"
        description="Build fluency without memorizing jargon. Each definition is paired with a plain-English explanation and a path back into the curriculum."
      />

      <Panel className="mb-6 p-4 sm:p-5">
        <label htmlFor="glossary-search" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#e6edf7]/55">Search terms</label>
        <div className="relative max-w-2xl">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#e6edf7]/45"><SearchIcon /></span>
          <input
            id="glossary-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a term, definition, or explanation"
            className={`${fieldClass} pl-10`}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Filter glossary by first letter">
          <button
            type="button"
            onClick={() => setLetter('All')}
            aria-pressed={letter === 'All'}
            className={`min-h-9 rounded-lg border px-3 text-xs font-bold transition motion-reduce:transition-none ${focusRing} ${letter === 'All' ? 'border-[#67e8f9]/45 bg-[#67e8f9]/15 text-[#67e8f9]' : 'border-white/10 bg-white/[0.04] text-[#e6edf7]/60 hover:border-white/20'}`}
          >
            All
          </button>
          {letters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setLetter(item)}
              disabled={!availableLetters.has(item)}
              aria-pressed={letter === item}
              className={`h-9 w-9 rounded-lg border text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-25 motion-reduce:transition-none ${focusRing} ${letter === item ? 'border-[#67e8f9]/45 bg-[#67e8f9]/15 text-[#67e8f9]' : 'border-white/10 bg-white/[0.04] text-[#e6edf7]/60 hover:border-white/20'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </Panel>

      <p className="mb-4 text-sm text-[#e6edf7]/60" aria-live="polite">
        Showing <strong className="text-[#f5f8ff]">{filteredTerms.length}</strong> of {terms.length} terms
      </p>

      {filteredTerms.length === 0 ? (
        <EmptyState
          title="No glossary terms found"
          description="Try a different phrase or return to all letters."
          action={<button type="button" onClick={reset} className={secondaryAction}>Show all terms</button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredTerms.map((term) => (
            <Panel key={term.term} as="article" className="overflow-hidden">
              <div className="px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-xl font-extrabold text-[#f5f8ff]">{term.term}</h2>
                  <Badge tone="cyan">{term.term.charAt(0).toLocaleUpperCase()}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#e6edf7]/72">{term.definition}</p>
              </div>
              <div className="border-t border-white/[0.07] bg-[#4c8dff]/[0.05] px-5 py-4 sm:px-6">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#67e8f9]">In plain English</p>
                <p className="mt-2 text-sm leading-6 text-[#e6edf7]/78">{term.plainEnglish}</p>
              </div>
              {term.relatedModuleIds.length > 0 && (
                <div className="border-t border-white/[0.07] px-5 py-4 sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#e6edf7]/45">Related modules</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {term.relatedModuleIds.map((moduleId) => {
                      const module = moduleById.get(moduleId)
                      if (!module) return null
                      return (
                        <a
                          key={moduleId}
                          href={hrefFor({ kind: 'module', moduleId })}
                          onClick={(event) => followAcademyLink(event, { kind: 'module', moduleId })}
                          className={`rounded-lg border border-[#4c8dff]/25 bg-[#4c8dff]/10 px-2.5 py-1.5 text-xs font-semibold text-[#8ab4ff] hover:border-[#67e8f9]/40 hover:text-[#67e8f9] ${focusRing}`}
                        >
                          {module.order}. {module.shortTitle}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  )
}
