import type * as React from 'react'
import { hrefFor, navigateTo } from '../router'
import type { AcademyProgress } from '../progress'
import type { AcademyContent } from '../types'
import { LearningRoadmap } from './LearningRoadmap'
import { followAcademyLink } from './navigation'
import { ProgressRing } from './ProgressRing'
import { RoleCoverageChart } from './RoleCoverageChart'
import { SkillRadar } from './SkillRadar'
import { ArrowIcon, Badge, Eyebrow, Panel, primaryAction } from './AcademyUI'

const roleAreas = [
  {
    title: 'Security operations and incident response',
    description: 'Triage signals, coordinate response, preserve evidence, communicate clearly, and improve after incidents.',
  },
  {
    title: 'Threat intelligence and hunting',
    description: 'Evaluate intelligence carefully, form testable hypotheses, and search approved telemetry for meaningful patterns.',
  },
  {
    title: 'Vulnerability, application, and cloud security',
    description: 'Prioritize risk in context and work across modern application and shared-responsibility environments.',
  },
  {
    title: 'Detection, automation, and security engineering',
    description: 'Design measurable controls, build dependable workflows, and automate with review and rollback guardrails.',
  },
  {
    title: 'Operational technology and collaboration',
    description: 'Balance security with safety and availability while partnering across technical and business teams.',
  },
]

export function DashboardPage({
  content,
  progress,
  completion,
}: {
  content: AcademyContent
  progress: AcademyProgress
  completion: number
}): React.ReactElement {
  const orderedModules = [...content.modules].sort((a, b) => a.order - b.order)
  const completed = new Set(progress.completedModuleIds)
  const lastModule = progress.lastModuleId ? orderedModules.find((module) => module.id === progress.lastModuleId) : undefined
  const nextModule = (lastModule && !completed.has(lastModule.id) ? lastModule : undefined) ?? orderedModules.find((module) => !completed.has(module.id)) ?? orderedModules[0]
  const hasStarted = progress.completedModuleIds.length > 0 || Object.keys(progress.quizScores).length > 0 || progress.lastModuleId !== undefined
  const totalMinutes = content.modules.reduce((sum, module) => sum + module.durationMinutes, 0)
  const estimatedHours = Math.max(1, Math.round(totalMinutes / 60))

  const openModule = (moduleId: string) => navigateTo({ kind: 'module', moduleId })

  return (
    <div>
      <Panel className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(34,211,238,0.16),transparent_28%),linear-gradient(125deg,rgba(76,141,255,0.12),transparent_55%)]" aria-hidden="true" />
        <div className="relative grid items-center gap-8 px-5 py-9 sm:px-8 sm:py-12 lg:grid-cols-[1fr_auto] lg:px-12 lg:py-16">
          <div className="max-w-4xl">
            <Eyebrow>Cybersecurity career academy</Eyebrow>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-[#f5f8ff] sm:text-5xl lg:text-6xl">
              From first principles to the incident bridge.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#e6edf7]/72 sm:text-lg sm:leading-8">
              The role title is advanced, but this guide starts from zero. Build durable foundations first, then connect them to defensive operations, investigation, engineering, and clear decision-making.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {nextModule && (
                <a
                  href={hrefFor({ kind: 'module', moduleId: nextModule.id })}
                  onClick={(event) => followAcademyLink(event, { kind: 'module', moduleId: nextModule.id })}
                  className={primaryAction}
                >
                  {hasStarted ? 'Resume learning' : 'Start the academy'}
                  <ArrowIcon />
                </a>
              )}
              <span className="text-sm text-[#e6edf7]/55">{nextModule ? `Next: ${nextModule.order}. ${nextModule.shortTitle}` : 'Curriculum coming soon'}</span>
            </div>
          </div>
          <div className="mx-auto rounded-full border border-[#67e8f9]/15 bg-[#081120]/55 p-3 shadow-[0_20px_70px_rgba(0,0,0,0.3)]">
            <ProgressRing value={completion} completed={progress.completedModuleIds.length} total={content.modules.length} />
          </div>
        </div>
        <div className="relative grid border-t border-white/[0.08] bg-[#081120]/35 sm:grid-cols-3">
          {[
            { value: content.modules.length, label: 'structured modules' },
            { value: `${estimatedHours}h`, label: 'estimated study' },
            { value: content.resources.length, label: 'curated resources' },
          ].map((stat) => (
            <div key={stat.label} className="border-b border-white/[0.08] px-5 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:px-7">
              <p className="font-display text-2xl font-extrabold text-[#f5f8ff]">{stat.value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-[#e6edf7]/45">{stat.label}</p>
            </div>
          ))}
        </div>
      </Panel>

      <section className="mt-10" aria-labelledby="progress-heading">
        <div className="mb-5">
          <Eyebrow>Your learning signal</Eyebrow>
          <h2 id="progress-heading" className="mt-2 font-display text-2xl font-bold text-[#f5f8ff]">See how the pieces connect</h2>
          <p className="mt-2 text-sm leading-6 text-[#e6edf7]/65">Completion is one signal, not a claim of mastery. Use the charts to choose what to review and practice next.</p>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <SkillRadar modules={content.modules} completedModuleIds={progress.completedModuleIds} />
          <RoleCoverageChart modules={content.modules} completedModuleIds={progress.completedModuleIds} />
        </div>
      </section>

      <Panel className="mt-10 overflow-hidden">
        <div className="border-b border-white/[0.08] px-5 py-6 sm:px-7">
          <Eyebrow>Role-description coverage</Eyebrow>
          <h2 className="mt-2 font-display text-2xl font-bold text-[#f5f8ff]">Major role areas, translated into learnable skills</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#e6edf7]/65">The public role description spans several disciplines. This academy makes that breadth visible without suggesting that a beginner must already be an expert in every area.</p>
        </div>
        <ul className="grid md:grid-cols-2 xl:grid-cols-5">
          {roleAreas.map((area, index) => (
            <li key={area.title} className="border-b border-white/[0.07] p-5 last:border-b-0 md:border-r md:[&:nth-child(2n)]:border-r-0 xl:border-b-0 xl:[&:nth-child(2n)]:border-r xl:last:border-r-0">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-sm font-bold text-[#67e8f9]">0{index + 1}</span>
                <Badge tone={index === 4 ? 'green' : 'blue'}>{index === 4 ? 'Capstone' : 'Role area'}</Badge>
              </div>
              <h3 className="mt-4 font-display text-base font-bold leading-6 text-[#f5f8ff]">{area.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#e6edf7]/62">{area.description}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-10">
        <LearningRoadmap modules={content.modules} onOpenModule={openModule} />
      </div>
    </div>
  )
}
