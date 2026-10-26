import type * as React from 'react'
import { hrefFor } from '../router'
import type { AcademyModule } from '../types'
import { ArrowIcon, Badge, CheckIcon, Panel, focusRing } from './AcademyUI'
import { followAcademyLink } from './navigation'

export function ModuleCard({
  module,
  completed,
}: {
  module: AcademyModule
  completed: boolean
}): React.ReactElement {
  return (
    <Panel as="article" className="group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:border-[#4c8dff]/40 motion-reduce:transform-none motion-reduce:transition-none">
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="cyan">Module {module.order}</Badge>
          <Badge tone="blue">{module.category}</Badge>
          <Badge>{module.level}</Badge>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${completed ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-[#e6edf7]/55'}`}>
          {completed && <CheckIcon />}
          {completed ? 'Complete' : 'Not complete'}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-5 py-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e6edf7]/45">
          <span>{module.durationMinutes} minutes</span>
          <span aria-hidden="true">·</span>
          <span>{module.objectives.length} objectives</span>
        </div>
        <h2 className="mt-3 font-display text-xl font-extrabold leading-7 text-[#f5f8ff]">
          <a href={hrefFor({ kind: 'module', moduleId: module.id })} onClick={(event) => followAcademyLink(event, { kind: 'module', moduleId: module.id })} className={`rounded-md ${focusRing}`}>
            {module.title}
          </a>
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#e6edf7]/65">{module.summary}</p>
        <div className="mt-5 rounded-xl border border-[#4c8dff]/15 bg-[#4c8dff]/[0.06] p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-[#8ab4ff]">Role connection</p>
          <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-[#e6edf7]/68">{module.roleConnection}</p>
        </div>
        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[#e6edf7]/45">Objectives preview</p>
          <ul className="mt-2 space-y-2">
            {module.objectives.slice(0, 2).map((objective) => (
              <li key={objective} className="flex gap-2 text-sm leading-5 text-[#e6edf7]/65">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#67e8f9]" aria-hidden="true" />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm font-bold text-[#8ab4ff]">
          <span>{completed ? 'Review module' : 'Open module'}</span>
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
        </div>
      </div>
    </Panel>
  )
}
