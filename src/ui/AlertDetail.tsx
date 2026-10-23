import { useState } from 'react'
import { parentContext, surrounding } from '../lib/context'
import { formatTime } from '../lib/summary'
import { STATUS_LABEL, noteRequired, validateDecision } from '../lib/triage'
import { RULES_BY_ID } from '../rules'
import type { Exclusion, Finding, LogEvent, TriageEntry, TriageStatus } from '../types'
import { Badge, Button, Card, Eyebrow, Field, SeverityBadge } from './primitives'
import { INPUT_CLASS, MONO } from './styles'

const SHOWN_MATCHED = 20

interface Props {
  finding: Finding
  events: LogEvent[]
  eventIndex: Map<number, number>
  entry?: TriageEntry
  onSave: (status: TriageStatus, note: string) => void
  exclusions: Exclusion[]
  onAddExclusion: (query: string) => void
  onRemoveExclusion: (x: Exclusion) => void
  previewHidden: (query: string) => number
  onClose: () => void
}

function RawLine({ id, raw, marked }: { id: number; raw: string; marked?: boolean }) {
  return (
    <li className={`flex gap-3 px-2 py-1 rounded-lg ${marked ? 'bg-[#00ADB5]/15' : ''}`}>
      <span className="shrink-0 w-12 text-right text-[#EEEEEE]/60 tabular-nums">{id}</span>
      <span className={`${MONO} break-all whitespace-pre-wrap min-w-0`}>{raw}</span>
    </li>
  )
}

function Triage({ finding, entry, onSave }: Pick<Props, 'finding' | 'entry' | 'onSave'>) {
  const [status, setStatus] = useState<TriageStatus>(entry?.status ?? 'new')
  const [note, setNote] = useState(entry?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(entry?.updatedAt ?? null)
  const options: TriageStatus[] = ['new', 'investigating', 'closed', 'escalated']

  const save = () => {
    const err = validateDecision(status, note)
    setError(err)
    if (err) return
    onSave(status, note.trim())
    setSavedAt(new Date().toISOString())
  }

  return (
    <Card as="section" className="!p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mb-3">Triage decision</h3>
      <fieldset>
        <legend className="sr-only">Status for this alert</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <label
              key={o}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 min-h-11 sm:min-h-0 text-sm cursor-pointer transition-colors ${status === o ? 'border-[#00ADB5] bg-[#00ADB5]/15' : 'border-[#393E46] hover:border-[#00ADB5]/40'}`}
            >
              <input
                type="radio"
                name={`status-${finding.id}`}
                value={o}
                checked={status === o}
                onChange={() => {
                  setStatus(o)
                  setError(null)
                }}
                className="accent-[#00ADB5] cursor-pointer"
              />
              {STATUS_LABEL[o]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="mt-3">
        <Field label={noteRequired(status) ? 'Note (required)' : 'Note'} htmlFor={`note-${finding.id}`}>
          <textarea
            id={`note-${finding.id}`}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `note-err-${finding.id}` : undefined}
            placeholder="What did you check, and why did you decide this?"
            className={`${INPUT_CLASS} resize-none ${error ? '!border-red-400' : ''}`}
          />
        </Field>
        {error && (
          <p id={`note-err-${finding.id}`} role="alert" className="mt-1 text-sm text-red-300">
            {error}
          </p>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button onClick={save}>Save decision</Button>
        {savedAt && !error && <span className="text-xs text-[#EEEEEE]/60">Saved in this browser only ({STATUS_LABEL[entry?.status ?? status]})</span>}
      </div>
    </Card>
  )
}

function Tune({ finding, exclusions, onAddExclusion, onRemoveExclusion, previewHidden }: Pick<Props, 'finding' | 'exclusions' | 'onAddExclusion' | 'onRemoveExclusion' | 'previewHidden'>) {
  const rule = RULES_BY_ID[finding.ruleId]
  const [query, setQuery] = useState('')
  const trimmed = query.trim()
  const preview = trimmed ? previewHidden(trimmed) : 0
  const mine = exclusions.filter((x) => x.ruleId === rule.id)
  return (
    <details className="rounded-2xl border border-white/[0.06] bg-[#393E46]/40 p-4">
      <summary className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 cursor-pointer">Tune this rule</summary>
      <div className="mt-3 space-y-3 text-sm">
        <div>
          <Eyebrow className="mb-1">Built-in allowlist</Eyebrow>
          {rule.allowlist.length ? (
            <ul className="list-disc pl-5 text-[#EEEEEE]/80 space-y-0.5">
              {rule.allowlist.map((a) => (
                <li key={a} className="break-words">
                  {a}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[#EEEEEE]/70">This rule has no allowlist.</p>
          )}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!trimmed) return
            onAddExclusion(trimmed)
            setQuery('')
          }}
        >
          <Field label="Add a session-only exclusion" htmlFor={`excl-${finding.id}`}>
            <input id={`excl-${finding.id}`} className={INPUT_CLASS} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. SourceImage:backup.exe or any text" autoComplete="off" spellCheck={false} />
          </Field>
          <p className="text-xs text-[#EEEEEE]/60 mt-1">Hides alerts of this rule where any matched line contains the text, or where field:value matches. Lasts until you reload; never saved.</p>
          {trimmed && <p className="text-xs text-[#EEEEEE]/80 mt-1">This would hide {preview} alert{preview === 1 ? '' : 's'} from this rule.</p>}
          <Button type="submit" variant="secondary" size="sm" className="mt-2" disabled={!trimmed}>
            Add exclusion
          </Button>
        </form>
        {mine.length > 0 && (
          <ul className="space-y-1" aria-label="Active exclusions">
            {mine.map((x) => (
              <li key={x.query} className="flex items-center justify-between gap-2 rounded-lg bg-[#222831] px-3 py-1.5">
                <code className="text-xs break-all">{x.query}</code>
                <Button variant="ghost" size="sm" onClick={() => onRemoveExclusion(x)} aria-label={`Remove exclusion ${x.query}`}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  )
}

export function AlertDetail(p: Props) {
  const { finding } = p
  const rule = RULES_BY_ID[finding.ruleId]
  const firstIdx = p.eventIndex.get(finding.eventIds[0]) ?? -1
  const primary = firstIdx >= 0 ? p.events[firstIdx] : undefined
  const ctx = surrounding(p.events, firstIdx, 5)
  const matchedSet = new Set(finding.eventIds)
  const parent = firstIdx >= 0 ? parentContext(p.events, firstIdx) : null
  const attackUrl = `https://attack.mitre.org/techniques/${rule.attack.id.replace('.', '/')}/`
  const matched = finding.eventIds.slice(0, SHOWN_MATCHED).map((id) => p.events[p.eventIndex.get(id) ?? -1]).filter(Boolean)

  return (
    <article aria-labelledby="detail-title" className="space-y-4">
      <Card className="!p-4 md:!p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <SeverityBadge severity={finding.severity} />
              <a href={attackUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00ADB5]/20 text-[#00ADB5] hover:bg-[#00ADB5]/30 transition-colors">
                {rule.attack.id} {rule.attack.name}
              </a>
              <Badge variant="muted">rule v{rule.version}</Badge>
            </div>
            <h2 id="detail-title" className="font-display text-xl md:text-2xl font-extrabold tracking-tight">
              {rule.title}
            </h2>
          </div>
          <Button variant="ghost" size="sm" className="md:hidden shrink-0" onClick={p.onClose} aria-label="Close alert details">
            Close
          </Button>
        </div>
        <p className="mt-2 text-sm text-[#EEEEEE]/90 break-words">{finding.summary}</p>
        {finding.detail && <p className={`mt-2 ${MONO} bg-[#222831] rounded-xl p-3 break-all whitespace-pre-wrap`}>{finding.detail}</p>}
        <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
          {[
            ['Host', finding.host ?? 'unknown'],
            ['User', finding.user ?? 'unknown'],
            ['Time', formatTime(finding.time)],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs uppercase tracking-wider text-[#EEEEEE]/60">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card as="section" className="!p-4 md:!p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mb-2">What this rule looks for</h3>
        <p className="text-sm text-[#EEEEEE]/90">{rule.explanation}</p>
        <details open className="mt-3">
          <summary className="text-sm font-semibold cursor-pointer">Why does this matter?</summary>
          <p className="mt-2 text-sm text-[#EEEEEE]/90 leading-relaxed">{rule.whyItMatters}</p>
        </details>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mt-4 mb-2">What to check next</h3>
        <ol className="list-decimal pl-5 space-y-1 text-sm text-[#EEEEEE]/90">
          {rule.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Card>

      <Card as="section" className="!p-4 md:!p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mb-2">Matched fields</h3>
        {primary ? (
          <table className="w-full text-sm">
            <caption className="sr-only">Fields of the first matched event; matched fields are marked</caption>
            <tbody>
              {Object.entries(primary.fields)
                .filter(([k]) => k !== 'message' || primary.source === 'auth')
                .map(([k, v]) => {
                  const hit = finding.highlight.includes(k)
                  return (
                    <tr key={k} className={hit ? 'bg-[#00ADB5]/15' : ''}>
                      <th scope="row" className="text-left align-top font-medium py-1 pr-3 whitespace-nowrap text-[#EEEEEE]/70">
                        {hit && <span aria-label="matched">▶ </span>}
                        {k}
                      </th>
                      <td className={`${MONO} py-1 break-all whitespace-pre-wrap`}>{v}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-[#EEEEEE]/70">Event not available.</p>
        )}
        {parent && (
          <div className="mt-3 text-sm">
            <Eyebrow className="mb-1">Parent process</Eyebrow>
            <p className={`${MONO} break-all`}>{parent.parentImage}</p>
            {parent.creator ? (
              <p className="text-xs text-[#EEEEEE]/70 mt-1 break-all">
                Started earlier on line {parent.creator.id}: <span className={MONO}>{parent.creator.fields.CommandLine}</span>
              </p>
            ) : (
              <p className="text-xs text-[#EEEEEE]/60 mt-1">No earlier event in this file shows how the parent was started.</p>
            )}
          </div>
        )}
      </Card>

      <Card as="section" className="!p-4 md:!p-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mb-2">Matched raw lines ({finding.eventIds.length})</h3>
        <ul className="space-y-0.5" aria-label="Matched raw lines">
          {matched.map((e) => (
            <RawLine key={e.id} id={e.id} raw={e.raw} marked />
          ))}
        </ul>
        {finding.eventIds.length > SHOWN_MATCHED && <p className="text-xs text-[#EEEEEE]/60 mt-2">+{finding.eventIds.length - SHOWN_MATCHED} more matched lines not shown.</p>}
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#EEEEEE]/60 mt-4 mb-2">Surrounding events (±5)</h3>
        <ul className="space-y-0.5" aria-label="Surrounding events">
          {ctx.map((e) => (
            <RawLine key={e.id} id={e.id} raw={e.raw} marked={matchedSet.has(e.id)} />
          ))}
        </ul>
      </Card>

      <Triage key={finding.id} finding={finding} entry={p.entry} onSave={p.onSave} />
      <Tune key={`tune-${finding.id}`} finding={finding} exclusions={p.exclusions} onAddExclusion={p.onAddExclusion} onRemoveExclusion={p.onRemoveExclusion} previewHidden={p.previewHidden} />
    </article>
  )
}
