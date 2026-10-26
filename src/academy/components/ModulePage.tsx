import { useState } from 'react'
import type * as React from 'react'
import { hrefFor } from '../router'
import type { AcademyModule, LearningResource, ModuleSection } from '../types'
import { ConceptDiagram } from './ConceptDiagram'
import { Quiz } from './Quiz'
import { ArrowIcon, Badge, CheckIcon, Eyebrow, Panel, focusRing, primaryAction, secondaryAction } from './AcademyUI'
import { followAcademyLink } from './navigation'

function LessonSection({ section, index }: { section: ModuleSection; index: number }): React.ReactElement {
  const calloutStyles = {
    remember: 'border-[#4c8dff]/25 bg-[#4c8dff]/[0.08] text-[#dce8ff]',
    warning: 'border-amber-300/25 bg-amber-300/[0.07] text-amber-50',
    'field-note': 'border-emerald-300/25 bg-emerald-300/[0.07] text-emerald-50',
  }
  const calloutLabels = {
    remember: 'Remember',
    warning: 'Use caution',
    'field-note': 'Field note',
  }

  return (
    <section aria-labelledby={`lesson-section-${index}`} className="scroll-mt-24">
      <div className="flex gap-4">
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#67e8f9]/30 bg-[#67e8f9]/10 font-mono text-xs font-bold text-[#67e8f9]">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <h2 id={`lesson-section-${index}`} className="font-display text-2xl font-extrabold leading-8 text-[#f5f8ff]">{section.title}</h2>
          <div className="mt-4 space-y-4">
            {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-base leading-8 text-[#e6edf7]/74">{paragraph}</p>)}
          </div>

          {section.analogy && (
            <aside className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.06] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Think of it this way</p>
              <p className="mt-2 text-sm leading-7 text-[#e6edf7]/78">{section.analogy}</p>
            </aside>
          )}

          {section.callout && (
            <aside className={`mt-5 rounded-2xl border px-5 py-4 ${calloutStyles[section.callout.kind]}`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]">{calloutLabels[section.callout.kind]}</p>
              <p className="mt-2 text-sm leading-7 opacity-85">{section.callout.text}</p>
            </aside>
          )}

          {section.howTo && section.howTo.length > 0 && (
            <div className="mt-6">
              <h3 className="font-display text-base font-bold text-[#f5f8ff]">How to apply it</h3>
              <ol className="mt-3 space-y-3">
                {section.howTo.map((step, stepIndex) => (
                  <li key={step} className="flex gap-3 text-sm leading-7 text-[#e6edf7]/72">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4c8dff]/15 font-mono text-xs font-bold text-[#8ab4ff]">{stepIndex + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {section.keyPoints.length > 0 && (
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#081120]/45 p-5">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#e6edf7]/50">Key points</h3>
              <ul className="mt-3 space-y-2.5">
                {section.keyPoints.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-6 text-[#e6edf7]/72">
                    <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export function ModulePage({
  module,
  allModules,
  resources,
  completed,
  previousQuizScore,
  onCompletedChange,
  onQuizScore,
}: {
  module: AcademyModule
  allModules: AcademyModule[]
  resources: LearningResource[]
  completed: boolean
  previousQuizScore?: number
  onCompletedChange: (completed: boolean) => void
  onQuizScore: (score: number) => void
}): React.ReactElement {
  const [answerVisible, setAnswerVisible] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const orderedModules = [...allModules].sort((a, b) => a.order - b.order)
  const moduleIndex = orderedModules.findIndex((item) => item.id === module.id)
  const previousModule = moduleIndex > 0 ? orderedModules[moduleIndex - 1] : undefined
  const nextModule = moduleIndex >= 0 && moduleIndex < orderedModules.length - 1 ? orderedModules[moduleIndex + 1] : undefined
  const moduleResources = module.resourceIds.map((resourceId) => resources.find((resource) => resource.id === resourceId)).filter((resource): resource is LearningResource => resource !== undefined)
  const prerequisites = module.prerequisites.map((prerequisite) => ({
    label: prerequisite,
    module: allModules.find((item) => item.id === prerequisite || item.title === prerequisite || item.shortTitle === prerequisite),
  }))

  const copyCode = async (title: string, code: string) => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(code)
      setCopyStatus(`${title} copied to the clipboard.`)
    } catch {
      setCopyStatus(`Could not copy ${title}. Select the text and copy it manually.`)
    }
  }

  return (
    <article>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm text-[#e6edf7]/55">
          <li>
            <a href={hrefFor({ kind: 'dashboard' })} onClick={(event) => followAcademyLink(event, { kind: 'dashboard' })} className={`rounded text-[#8ab4ff] hover:text-[#67e8f9] ${focusRing}`}>Dashboard</a>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <a href={hrefFor({ kind: 'curriculum' })} onClick={(event) => followAcademyLink(event, { kind: 'curriculum' })} className={`rounded text-[#8ab4ff] hover:text-[#67e8f9] ${focusRing}`}>Curriculum</a>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="max-w-full truncate text-[#e6edf7]/72">{module.shortTitle}</li>
        </ol>
      </nav>

      <header className="grid gap-7 border-b border-white/[0.08] pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="max-w-4xl">
          <div className="flex flex-wrap gap-2">
            <Badge tone="cyan">Module {module.order}</Badge>
            <Badge tone="blue">{module.category}</Badge>
            <Badge>{module.level}</Badge>
            <Badge>{module.durationMinutes} minutes</Badge>
            <Badge tone={completed ? 'green' : 'neutral'}>{completed ? 'Completed' : 'In progress'}</Badge>
          </div>
          <h1 className="mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight text-[#f5f8ff] sm:text-5xl">{module.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#e6edf7]/72">{module.summary}</p>
        </div>
        <button
          type="button"
          onClick={() => onCompletedChange(!completed)}
          className={completed ? secondaryAction : primaryAction}
        >
          {completed && <CheckIcon />}
          {completed ? 'Undo completion' : 'Mark module complete'}
        </button>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel className="p-5 sm:p-7">
          <Eyebrow>Why this matters in the role</Eyebrow>
          <p className="mt-3 text-base leading-8 text-[#e6edf7]/76">{module.roleConnection}</p>
          {module.jdResponsibilities.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {module.jdResponsibilities.map((responsibility) => <Badge key={responsibility} tone="blue">{responsibility}</Badge>)}
            </div>
          )}
        </Panel>
        <Panel className="p-5 sm:p-7">
          <Eyebrow>Learning objectives</Eyebrow>
          <ul className="mt-3 space-y-2.5">
            {module.objectives.map((objective) => (
              <li key={objective} className="flex gap-3 text-sm leading-6 text-[#e6edf7]/72">
                <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
          {module.prerequisites.length > 0 && (
            <div className="mt-5 border-t border-white/[0.08] pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#e6edf7]/45">Recommended first</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {prerequisites.map(({ label, module: prerequisiteModule }) => (
                  prerequisiteModule ? (
                    <a
                      key={label}
                      href={hrefFor({ kind: 'module', moduleId: prerequisiteModule.id })}
                      onClick={(event) => followAcademyLink(event, { kind: 'module', moduleId: prerequisiteModule.id })}
                      className={`rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-[#8ab4ff] hover:border-[#4c8dff]/40 ${focusRing}`}
                    >
                      {prerequisiteModule.order}. {prerequisiteModule.shortTitle}
                    </a>
                  ) : (
                    <span key={label} className={`rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-[#8ab4ff] hover:border-[#4c8dff]/40 ${focusRing}`}>
                      {label}
                    </span>
                  )
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      {module.diagram && <div className="mt-8"><ConceptDiagram type={module.diagram} /></div>}

      <div className="mx-auto mt-12 max-w-4xl space-y-12">
        {module.sections.map((section, index) => <LessonSection key={`${section.title}-${index}`} section={section} index={index} />)}
      </div>

      {module.workflow && module.workflow.length > 0 && (
        <section className="mt-12" aria-labelledby="workflow-heading">
          <Eyebrow>Repeatable practice</Eyebrow>
          <h2 id="workflow-heading" className="mt-2 font-display text-2xl font-extrabold text-[#f5f8ff]">Workflow stepper</h2>
          <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {module.workflow.map((step, index) => (
              <li key={step} className="relative rounded-2xl border border-white/[0.08] bg-[#111d33]/70 p-5">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#67e8f9]">Step {index + 1}</span>
                <p className="mt-3 text-sm leading-6 text-[#e6edf7]/74">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {module.commands && module.commands.length > 0 && (
        <section className="mt-12" aria-labelledby="examples-heading">
          <Eyebrow>Defensive examples</Eyebrow>
          <h2 id="examples-heading" className="mt-2 font-display text-2xl font-extrabold text-[#f5f8ff]">Code and query examples</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#e6edf7]/65">Read and adapt these examples only in an approved learning or defensive environment. Validate scope, data handling, and expected impact before running anything.</p>
          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {module.commands.map((example) => (
              <Panel key={example.title} className="min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-4 border-b border-white/[0.08] px-4 py-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-sm font-bold text-[#f5f8ff]">{example.title}</h3>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-[#67e8f9]">{example.language}</p>
                  </div>
                  <button type="button" aria-label={`Copy ${example.title}`} onClick={() => void copyCode(example.title, example.code)} className={`shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-[#e6edf7]/75 hover:border-[#4c8dff]/45 hover:text-[#f5f8ff] ${focusRing}`}>
                    Copy
                  </button>
                </div>
                <pre className="max-h-96 overflow-auto bg-[#060d18] p-4 text-xs leading-6 text-cyan-100"><code>{example.code}</code></pre>
                <p className="border-t border-white/[0.08] px-4 py-4 text-sm leading-6 text-[#e6edf7]/65">{example.explanation}</p>
              </Panel>
            ))}
          </div>
          <p className="sr-only" role="status" aria-live="polite">{copyStatus}</p>
          {copyStatus && <p className="mt-3 text-sm text-[#67e8f9]" aria-hidden="true">{copyStatus}</p>}
        </section>
      )}

      <section className="mt-12" aria-labelledby="scenario-heading">
        <Panel className="overflow-hidden">
          <div className="border-b border-white/[0.08] bg-gradient-to-r from-amber-300/[0.08] to-transparent px-5 py-5 sm:px-7">
            <Eyebrow>Safe practice scenario</Eyebrow>
            <h2 id="scenario-heading" className="mt-2 font-display text-2xl font-extrabold text-[#f5f8ff]">{module.practice.title}</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[#e6edf7]/72">{module.practice.brief}</p>
          </div>
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <h3 className="font-display text-base font-bold text-[#f5f8ff]">Your tasks</h3>
              <ol className="mt-3 space-y-3">
                {module.practice.tasks.map((task, index) => (
                  <li key={task} className="flex gap-3 text-sm leading-7 text-[#e6edf7]/72">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-300/10 font-mono text-xs font-bold text-amber-200">{index + 1}</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ol>
            </div>
            <aside className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-200">Safety boundary</p>
              <p className="mt-2 text-sm leading-7 text-amber-50/78">{module.practice.safety}</p>
            </aside>
          </div>
          <div className="border-t border-white/[0.08] px-5 py-5 sm:px-7">
            <button type="button" aria-expanded={answerVisible} aria-controls="scenario-answer-guide" onClick={() => setAnswerVisible((visible) => !visible)} className={secondaryAction}>
              {answerVisible ? 'Hide answer guide' : 'Reveal answer guide'}
            </button>
            {answerVisible && (
              <div id="scenario-answer-guide" className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
                <h3 className="font-display text-base font-bold text-[#f5f8ff]">Answer guide</h3>
                <ol className="mt-3 space-y-3">
                  {module.practice.answerGuide.map((answer, index) => (
                    <li key={answer} className="flex gap-3 text-sm leading-7 text-[#e6edf7]/72">
                      <CheckIcon className="mt-1.5 h-4 w-4 shrink-0 text-emerald-300" />
                      <span><span className="sr-only">Answer {index + 1}: </span>{answer}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </Panel>
      </section>

      <div className="mt-12">
        <Quiz key={module.id} questions={module.quiz} previousScore={previousQuizScore} onScore={onQuizScore} />
      </div>

      {moduleResources.length > 0 && (
        <section className="mt-12" aria-labelledby="module-resources-heading">
          <Eyebrow>Keep learning</Eyebrow>
          <h2 id="module-resources-heading" className="mt-2 font-display text-2xl font-extrabold text-[#f5f8ff]">Module resources</h2>
          <ul className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {moduleResources.map((resource) => (
              <li key={resource.id}>
                <Panel className="flex h-full flex-col p-5">
                  <div className="flex flex-wrap gap-2">
                    {resource.official && <Badge tone="green">Official source</Badge>}
                    <Badge>{resource.access}</Badge>
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold text-[#f5f8ff]">{resource.title}</h3>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#67e8f9]">{resource.provider}</p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#e6edf7]/65">{resource.description}</p>
                  <a href={resource.url} target="_blank" rel="noreferrer" className={`mt-4 inline-flex items-center gap-2 rounded-lg text-sm font-bold text-[#8ab4ff] hover:text-[#67e8f9] ${focusRing}`}>
                    Open resource
                    <ArrowIcon />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </Panel>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Module navigation" className="mt-12 grid gap-4 border-t border-white/[0.08] pt-7 sm:grid-cols-2">
        {previousModule ? (
          <a
            href={hrefFor({ kind: 'module', moduleId: previousModule.id })}
            onClick={(event) => followAcademyLink(event, { kind: 'module', moduleId: previousModule.id })}
            className={`rounded-2xl border border-white/[0.08] bg-[#111d33]/70 p-5 transition hover:border-[#4c8dff]/40 motion-reduce:transition-none ${focusRing}`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-[#e6edf7]/45">Previous module</span>
            <span className="mt-2 block font-display text-base font-bold text-[#f5f8ff]">{previousModule.order}. {previousModule.shortTitle}</span>
          </a>
        ) : <span />}
        {nextModule ? (
          <a
            href={hrefFor({ kind: 'module', moduleId: nextModule.id })}
            onClick={(event) => followAcademyLink(event, { kind: 'module', moduleId: nextModule.id })}
            className={`rounded-2xl border border-white/[0.08] bg-[#111d33]/70 p-5 text-right transition hover:border-[#4c8dff]/40 motion-reduce:transition-none ${focusRing}`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-[#e6edf7]/45">Next module</span>
            <span className="mt-2 block font-display text-base font-bold text-[#f5f8ff]">{nextModule.order}. {nextModule.shortTitle}</span>
          </a>
        ) : (
          <a
            href={hrefFor({ kind: 'readiness' })}
            onClick={(event) => followAcademyLink(event, { kind: 'readiness' })}
            className={`rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.06] p-5 text-right transition hover:border-emerald-300/40 motion-reduce:transition-none ${focusRing}`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Path complete</span>
            <span className="mt-2 block font-display text-base font-bold text-[#f5f8ff]">Open the readiness plan</span>
          </a>
        )}
      </nav>

      <div className="mt-7 flex justify-center">
        <button type="button" onClick={() => onCompletedChange(!completed)} className={completed ? secondaryAction : primaryAction}>
          {completed && <CheckIcon />}
          {completed ? 'Undo completion' : 'Mark module complete'}
        </button>
      </div>
    </article>
  )
}
