import { useEffect, useState } from 'react'
import type * as React from 'react'
import { loadAcademyContent } from './content'
import {
  completionPercent,
  loadProgress,
  recordQuizScore,
  saveProgress,
  setModuleCompleted,
  setReadinessCheck,
  type AcademyProgress,
} from './progress'
import { hrefFor, useAcademyRoute, type AcademyRoute } from './router'
import type { AcademyContent } from './types'
import { AcademyShell, type AcademyNavItem } from './components/AcademyShell'
import { CurriculumPage } from './components/CurriculumPage'
import { DashboardPage } from './components/DashboardPage'
import { GlossaryPage } from './components/GlossaryPage'
import { ModulePage } from './components/ModulePage'
import { ReadinessPage } from './components/ReadinessPage'
import { ResourceLibrary } from './components/ResourceLibrary'
import { ArrowIcon, EmptyState, PageIntro, Panel, primaryAction } from './components/AcademyUI'
import { followAcademyLink } from './components/navigation'

type NavigableRoute = Exclude<AcademyRoute, { kind: 'not-found' }>

function routeClick(route: NavigableRoute): AcademyNavItem['onClick'] {
  return (event) => {
    followAcademyLink(event, route)
  }
}

function LoadingPage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-4xl py-10" role="status" aria-live="polite" aria-busy="true">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#4c8dff]/25 bg-[#4c8dff]/10 text-[#67e8f9]">
        <svg viewBox="0 0 24 24" className="h-7 w-7 animate-spin motion-reduce:animate-none" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 3a9 9 0 1 1-8.5 6" strokeLinecap="round" />
        </svg>
      </div>
      <p className="mt-5 text-center font-display text-xl font-bold text-[#f5f8ff]">Loading your academy</p>
      <p className="mt-2 text-center text-sm text-[#e6edf7]/60">Preparing the curriculum and local progress view.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl border border-white/[0.07] bg-white/[0.04] motion-reduce:animate-none" />)}
      </div>
    </div>
  )
}

function ErrorPage({ onRetry }: { onRetry: () => void }): React.ReactElement {
  return (
    <div className="mx-auto max-w-2xl py-10" role="alert">
      <Panel className="px-6 py-10 text-center sm:px-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-300/10 text-amber-200" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 4 3 20h18L12 4Z" strokeLinejoin="round" />
            <path d="M12 9v5m0 3h.01" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-[#f5f8ff]">The academy content did not load</h1>
        <p className="mt-3 text-sm leading-6 text-[#e6edf7]/65">Nothing was sent to a server. Retry the bundled content, or return to the dashboard and try again.</p>
        <button type="button" onClick={onRetry} className={`${primaryAction} mt-6`}>Retry loading</button>
      </Panel>
    </div>
  )
}

function LabPage({ lab }: { lab: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <PageIntro
        eyebrow="Bundled defensive lab"
        title="Practice local log triage"
        description="The bundled LogLens analyzer uses invented samples for safe learning. It is a teaching aid, not a production SIEM or EDR, and its heuristic findings must not be treated as complete security coverage."
      />
      <aside className="mb-7 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-5 py-4 text-sm leading-6 text-emerald-50/80">
        Use invented samples or data you are explicitly authorized to handle. The analyzer runs in this browser and is designed for defensive exploration.
      </aside>
      <Panel className="overflow-hidden p-3 sm:p-5">{lab}</Panel>
    </div>
  )
}

function NotFoundPage(): React.ReactElement {
  return (
    <EmptyState
      title="That academy page was not found"
      description="The link may be outdated or the module may not exist. Return to the dashboard to continue your learning path."
      headingAs="h1"
      action={
        <a href={hrefFor({ kind: 'dashboard' })} onClick={routeClick({ kind: 'dashboard' })} className={primaryAction}>
          Return to dashboard
          <ArrowIcon />
        </a>
      }
    />
  )
}

export function AcademyApp({ lab }: { lab: React.ReactNode }): React.ReactElement {
  const route = useAcademyRoute()
  const [content, setContent] = useState<AcademyContent | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [progress, setProgress] = useState<AcademyProgress>(() => loadProgress())

  useEffect(() => {
    let active = true
    void loadAcademyContent()
      .then((loadedContent) => {
        if (active) setContent(loadedContent)
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => {
      active = false
    }
  }, [loadAttempt])

  const updateProgress = (update: (current: AcademyProgress) => AcademyProgress) => {
    setProgress((current) => {
      const next = update(current)
      saveProgress(next)
      return next
    })
  }

  const retryLoading = () => {
    setLoadError(false)
    setContent(null)
    setLoadAttempt((attempt) => attempt + 1)
  }

  const completion = completionPercent(progress, content?.modules.length ?? 0)
  const navRoutes: Array<{ label: string; route: NavigableRoute }> = [
    { label: 'Dashboard', route: { kind: 'dashboard' } },
    { label: 'Curriculum', route: { kind: 'curriculum' } },
    { label: 'Resources', route: { kind: 'resources' } },
    { label: 'Glossary', route: { kind: 'glossary' } },
    { label: 'Readiness', route: { kind: 'readiness' } },
    { label: 'SOC Lab', route: { kind: 'lab' } },
  ]
  const navItems: AcademyNavItem[] = navRoutes.map((item) => ({
    label: item.label,
    href: hrefFor(item.route),
    active: route.kind === item.route.kind || (route.kind === 'module' && item.route.kind === 'curriculum'),
    onClick: routeClick(item.route),
  }))

  let page: React.ReactNode
  if (loadError) {
    page = <ErrorPage onRetry={retryLoading} />
  } else if (!content) {
    page = <LoadingPage />
  } else {
    switch (route.kind) {
      case 'dashboard':
        page = <DashboardPage content={content} progress={progress} completion={completion} />
        break
      case 'curriculum':
        page = <CurriculumPage modules={content.modules} completedModuleIds={progress.completedModuleIds} />
        break
      case 'module': {
        const module = content.modules.find((item) => item.id === route.moduleId)
        page = module ? (
          <ModulePage
            key={module.id}
            module={module}
            allModules={content.modules}
            resources={content.resources}
            completed={progress.completedModuleIds.includes(module.id)}
            previousQuizScore={progress.quizScores[module.id]}
            onCompletedChange={(completed) => updateProgress((current) => setModuleCompleted(current, module.id, completed))}
            onQuizScore={(score) => updateProgress((current) => recordQuizScore(current, module.id, score))}
          />
        ) : <NotFoundPage />
        break
      }
      case 'resources':
        page = <ResourceLibrary resources={content.resources} />
        break
      case 'glossary':
        page = <GlossaryPage terms={content.glossary} modules={content.modules} />
        break
      case 'readiness':
        page = (
          <ReadinessPage
            checks={progress.readinessChecks}
            onToggle={(itemId, checked) => updateProgress((current) => setReadinessCheck(current, itemId, checked))}
          />
        )
        break
      case 'lab':
        page = <LabPage lab={lab} />
        break
      case 'not-found':
        page = <NotFoundPage />
        break
    }
  }

  return <AcademyShell items={navItems} completion={completion}>{page}</AcademyShell>
}
