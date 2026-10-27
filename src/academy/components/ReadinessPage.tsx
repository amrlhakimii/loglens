import type * as React from 'react'
import { Badge, CheckIcon, PageIntro, Panel, focusRing } from './AcademyUI'

const studyWeeks = [
  {
    week: 'Week 1',
    title: 'Foundations and networking',
    description: 'Build the language of security, core risk thinking, operating-system basics, and a practical model of how network traffic moves.',
  },
  {
    week: 'Week 2',
    title: 'SIEM and EDR',
    description: 'Learn what endpoint and centralized telemetry can show, then practice turning raw signals into defensible triage decisions.',
  },
  {
    week: 'Week 3',
    title: 'IR, intel, hunting, forensics, and malware',
    description: 'Connect incident response, threat intelligence, structured hunting, evidence care, and safe malware analysis as one investigation workflow.',
  },
  {
    week: 'Week 4',
    title: 'Vulnerability, application, cloud, and detection',
    description: 'Prioritize exposure, understand application and cloud responsibility boundaries, and design detections that can be measured and improved.',
  },
  {
    week: 'Week 5',
    title: 'Automation, engineering, OT, and capstone',
    description: 'Use careful automation, engineering habits, operational technology context, and a capstone to rehearse end-to-end reasoning.',
  },
]

const checklistItems = [
  ['foundation-language', 'Explain confidentiality, integrity, and availability in your own words.'],
  ['network-path', 'Trace a web request through DNS, routing, filtering, and a destination service.'],
  ['log-baseline', 'Distinguish an event, alert, incident, indicator, and false positive.'],
  ['siem-triage', 'Describe a repeatable SIEM alert-triage workflow.'],
  ['edr-context', 'Identify useful endpoint context around a suspicious process.'],
  ['ir-lifecycle', 'Walk through preparation, detection, containment, recovery, and lessons learned.'],
  ['intel-confidence', 'State the source, confidence, age, and intended use of threat intelligence.'],
  ['hunt-hypothesis', 'Write a testable threat-hunting hypothesis and required data sources.'],
  ['evidence-care', 'Explain why evidence integrity and chain of custody matter.'],
  ['vulnerability-priority', 'Prioritize a vulnerability using exploitability, exposure, asset importance, and controls.'],
  ['cloud-boundary', 'Explain shared responsibility for one cloud-service example.'],
  ['detection-quality', 'Describe how to test, tune, document, and monitor a detection.'],
  ['automation-guardrails', 'Name validation, rollback, logging, and human-review guardrails for automation.'],
  ['ot-safety', 'Explain why safety and availability change security decisions in operational technology.'],
  ['policy-boundaries', 'Commit to using only approved tools, systems, accounts, and data.'],
] as const

const firstDayQuestions = [
  'Which systems, data sources, and queues should I learn first?',
  'What does a high-quality alert triage or investigation look like here?',
  'How are severity, escalation, and incident ownership decided?',
  'Where are runbooks, architecture diagrams, and approved query examples kept?',
  'Which actions require explicit approval, especially in production or operational environments?',
  'How does the team document decisions, uncertainty, and handoffs?',
]

const milestones = [
  {
    period: 'First 30 days',
    title: 'Learn the environment',
    items: ['Complete required training and access setup.', 'Shadow triage and incident workflows.', 'Map key data sources, owners, and escalation paths.', 'Ask for feedback on notes and low-risk practice work.'],
  },
  {
    period: 'By 60 days',
    title: 'Contribute with support',
    items: ['Handle scoped tasks with a reviewer.', 'Write or improve one runbook or knowledge note.', 'Validate assumptions against approved telemetry.', 'Share one measured improvement idea with the team.'],
  },
  {
    period: 'By 90 days',
    title: 'Own a defined outcome',
    items: ['Independently manage an agreed class of work.', 'Demonstrate reliable escalation and communication.', 'Deliver a small, reviewed quality or automation improvement.', 'Set the next learning goals with your manager.'],
  },
]

export function ReadinessPage({
  checks,
  onToggle,
}: {
  checks: Record<string, boolean>
  onToggle: (itemId: string, checked: boolean) => void
}): React.ReactElement {
  const completed = checklistItems.filter(([id]) => checks[id]).length
  const percentage = Math.round((completed / checklistItems.length) * 100)

  return (
    <div>
      <PageIntro
        eyebrow="Pre-start preparation"
        title="Turn learning into day-one readiness"
        description="Use this five-week plan to organize your study, then carry a practical set of questions and milestones into your first conversations."
      />

      <section aria-labelledby="study-plan-heading">
        <div className="mb-5">
          <h2 id="study-plan-heading" className="font-display text-2xl font-bold text-[#f5f8ff]">Five-week pre-start plan</h2>
          <p className="mt-2 text-sm leading-6 text-[#e6edf7]/65">Aim for steady understanding, not rushed completion. Revisit weak areas and keep examples defensive.</p>
        </div>
        <ol className="grid gap-4 lg:grid-cols-5">
          {studyWeeks.map((item, index) => (
            <li key={item.week} className="relative">
              <Panel className="h-full p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#67e8f9]/35 bg-[#67e8f9]/10 font-mono text-sm font-bold text-[#67e8f9]">{index + 1}</span>
                  <Badge tone={index === 4 ? 'green' : 'blue'}>{item.week}</Badge>
                </div>
                <h3 className="mt-4 font-display text-base font-bold leading-6 text-[#f5f8ff]">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#e6edf7]/65">{item.description}</p>
              </Panel>
            </li>
          ))}
        </ol>
      </section>

      <Panel className="mt-8 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-white/[0.08] bg-gradient-to-r from-[#4c8dff]/15 to-emerald-300/[0.04] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#67e8f9]">Persistent checklist</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#f5f8ff]">Core readiness checks</h2>
            <p className="mt-1 text-sm text-[#e6edf7]/65">{completed} of {checklistItems.length} complete</p>
          </div>
          <div className="min-w-40">
            <div className="flex justify-between text-xs font-semibold text-[#e6edf7]/65">
              <span>Readiness</span>
              <span>{percentage}%</span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#081120]" role="progressbar" aria-label="Readiness checklist completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
              <div className="h-full rounded-full bg-gradient-to-r from-[#4c8dff] to-emerald-400" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        </div>
        <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-6">
          {checklistItems.map(([id, label]) => {
            const checked = Boolean(checks[id])
            return (
              <label key={id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 transition motion-reduce:transition-none ${checked ? 'border-emerald-400/25 bg-emerald-400/[0.07] text-[#f5f8ff]' : 'border-white/[0.08] bg-[#081120]/35 text-[#e6edf7]/72 hover:border-white/20'}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => onToggle(id, event.target.checked)}
                  className={`mt-1 h-4 w-4 shrink-0 accent-emerald-400 ${focusRing}`}
                />
                <span>{label}</span>
                {checked && <CheckIcon className="ml-auto mt-1 h-4 w-4 shrink-0 text-emerald-300" />}
              </label>
            )
          })}
        </div>
      </Panel>

      <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#67e8f9]">Bring curiosity</p>
          <h2 className="mt-2 font-display text-xl font-bold text-[#f5f8ff]">First-day questions</h2>
          <ol className="mt-5 space-y-3">
            {firstDayQuestions.map((question, index) => (
              <li key={question} className="flex gap-3 text-sm leading-6 text-[#e6edf7]/72">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4c8dff]/15 font-mono text-xs font-bold text-[#8ab4ff]">{index + 1}</span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </Panel>

        <section aria-labelledby="ninety-day-heading">
          <h2 id="ninety-day-heading" className="font-display text-xl font-bold text-[#f5f8ff]">30 / 60 / 90-day plan</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {milestones.map((milestone) => (
              <Panel key={milestone.period} className="p-5">
                <Badge tone="cyan">{milestone.period}</Badge>
                <h3 className="mt-3 font-display text-base font-bold text-[#f5f8ff]">{milestone.title}</h3>
                <ul className="mt-3 space-y-2">
                  {milestone.items.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-[#e6edf7]/68">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#67e8f9]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </section>
      </div>

      <aside className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-5 py-4 text-sm leading-6 text-amber-50">
        <p className="font-semibold">Respect policy and operational boundaries.</p>
        <p className="mt-1 text-amber-50/75">Follow employer policy and use approved tools and data only. Ask before running queries, changing controls, collecting evidence, or testing in any shared or production environment.</p>
      </aside>
    </div>
  )
}
