import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyExclusions, compareFindings } from '../engine'
import { SEVERITY_ORDER } from '../engine'
import { summarize } from '../lib/summary'
import { loadTriage, saveTriage } from '../lib/triage'
import { RULES_BY_ID } from '../rules'
import type { Analysis, Exclusion, LogEvent, TriageMap, TriageStatus } from '../types'
import { compileQuery } from '../lib/query'
import { AlertDetail } from './AlertDetail'
import { AlertList, type SortKey } from './AlertList'
import { RawView } from './RawView'
import { ReportModal } from './ReportModal'
import { SummaryBar } from './SummaryBar'
import { Timeline } from './Timeline'
import { Button, EmptyState, Tabs, Toast } from './primitives'

interface Props {
  analysis: Analysis
  isSample: boolean
  onReset: () => void
}

const TABS = [
  { id: 'alerts', label: 'Alerts' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'raw', label: 'Raw events' },
]

export function Workspace({ analysis, isSample, onReset }: Props) {
  const [tab, setTab] = useState('alerts')
  const [triage, setTriage] = useState<TriageMap>(() => loadTriage(analysis.hash))
  const [exclusions, setExclusions] = useState<Exclusion[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [ruleFilter, setRuleFilter] = useState('')
  const [hostFilter, setHostFilter] = useState('')
  const [sort, setSort] = useState<SortKey>('severity')
  const [report, setReport] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const { events } = analysis
  const eventIndex = useMemo(() => new Map(events.map((e, i) => [e.id, i])), [events])
  const eventsById = useMemo(() => new Map<number, LogEvent>(events.map((e) => [e.id, e])), [events])
  const active = useMemo(() => applyExclusions(analysis.findings, eventsById, exclusions), [analysis.findings, eventsById, exclusions])
  const summary = useMemo(() => summarize(events, active), [events, active])

  const visible = useMemo(() => {
    const list = active.filter((f) => (!ruleFilter || f.ruleId === ruleFilter) && (!hostFilter || f.host === hostFilter))
    return list.sort(sort === 'severity' ? compareFindings : (a, b) => (a.time ?? '').localeCompare(b.time ?? '') || SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity])
  }, [active, ruleFilter, hostFilter, sort])

  const selected = visible.find((f) => f.id === selectedId) ?? visible[0] ?? null

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    if (!sheetOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  const select = (id: string) => {
    setSelectedId(id)
    setSheetOpen(true)
  }

  const save = (status: TriageStatus, note: string) => {
    if (!selected) return
    const next: TriageMap = { ...triage, [selected.id]: { status, note: note || undefined, updatedAt: new Date().toISOString() } }
    setTriage(next)
    if (!saveTriage(analysis.hash, next)) showToast('Could not save to this browser (storage blocked). Decisions last until you reload.')
  }

  const ruleOptions = [...new Set(active.map((f) => f.ruleId))].sort((a, b) => RULES_BY_ID[a].title.localeCompare(RULES_BY_ID[b].title))
  const hostOptions = [...new Set(active.map((f) => f.host).filter((h): h is string => !!h))].sort()

  const previewHidden = (query: string) => {
    if (!selected) return 0
    const test = compileQuery(query)
    if (!test) return 0
    return active.filter((f) => f.ruleId === selected.ruleId && f.eventIds.some((id) => eventsById.get(id) && test(eventsById.get(id)!))).length
  }

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#e6edf7]/60">Analysing</p>
          <p className="font-display text-lg font-bold truncate">{analysis.fileName}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setReport(new Date().toISOString())}>Export report</Button>
          <Button variant="secondary" onClick={onReset}>
            Load another file
          </Button>
        </div>
      </div>

      <SummaryBar analysis={analysis} summary={summary} triage={triage} isSample={isSample} />
      <Tabs tabs={TABS} active={tab} onChange={setTab} label="Views" />

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'alerts' && (
          <div className="grid md:grid-cols-[minmax(300px,2fr)_3fr] gap-5 items-start">
            <AlertList
              findings={visible}
              total={active.length}
              selectedId={selected?.id ?? null}
              onSelect={select}
              triage={triage}
              ruleFilter={ruleFilter}
              hostFilter={hostFilter}
              sort={sort}
              onRuleFilter={setRuleFilter}
              onHostFilter={setHostFilter}
              onSort={setSort}
              ruleOptions={ruleOptions}
              hostOptions={hostOptions}
            />
            {selected ? (
              <>
                {sheetOpen && <div className="md:hidden fixed inset-0 z-30" style={{ background: 'rgba(10,14,20,0.6)' }} onClick={() => setSheetOpen(false)} aria-hidden="true" />}
                <div
                  className={`${sheetOpen ? '' : 'max-md:hidden'} max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:max-h-[85dvh] max-md:overflow-y-auto max-md:rounded-t-[20px] max-md:p-4 max-md:animate-sheet-in max-md:bg-[#1a2540] md:sticky md:top-4 md:max-h-[calc(100dvh-2rem)] md:overflow-y-auto min-w-0`}
                >
                  <AlertDetail
                    finding={selected}
                    events={events}
                    eventIndex={eventIndex}
                    entry={triage[selected.id]}
                    onSave={save}
                    exclusions={exclusions}
                    onAddExclusion={(query) => {
                      setExclusions((x) => [...x, { ruleId: selected.ruleId, query }])
                      showToast('Exclusion added for this session')
                    }}
                    onRemoveExclusion={(x) => setExclusions((all) => all.filter((y) => y !== x))}
                    previewHidden={previewHidden}
                    onClose={() => setSheetOpen(false)}
                  />
                </div>
              </>
            ) : (
              <div className="hidden md:block">
                <EmptyState icon="🕵️" title="Select an alert" description="Pick one on the left to see why it fired and what to check next." />
              </div>
            )}
          </div>
        )}
        {tab === 'timeline' && (
          <Timeline
            events={events}
            findings={active}
            selectedId={selected?.id ?? null}
            onSelect={(id) => {
              setSelectedId(id)
              setSheetOpen(true)
              setTab('alerts')
            }}
          />
        )}
        {tab === 'raw' && <RawView events={events} findings={active} />}
      </div>

      {report && <ReportModal analysis={analysis} findings={active} triage={triage} exclusions={exclusions} generatedAt={report} onClose={() => setReport(null)} onToast={showToast} />}
      <Toast message={toast} />
    </div>
  )
}
