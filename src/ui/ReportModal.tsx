import { useMemo } from 'react'
import { buildReport } from '../report'
import type { Analysis, Exclusion, Finding, TriageMap } from '../types'
import { Button, Modal } from './primitives'

interface Props {
  analysis: Analysis
  findings: Finding[]
  triage: TriageMap
  exclusions: Exclusion[]
  generatedAt: string
  onClose: () => void
  onToast: (msg: string) => void
}

export function ReportModal({ analysis, findings, triage, exclusions, generatedAt, onClose, onToast }: Props) {
  const markdown = useMemo(() => buildReport({ analysis, findings, triage, exclusions, generatedAt }), [analysis, findings, triage, exclusions, generatedAt])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      onToast('Report copied to clipboard')
    } catch {
      onToast('Copy was blocked by the browser. Use Download instead.')
    }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `loglens-report-${analysis.hash.slice(0, 8)}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    onToast('Report downloaded')
  }

  return (
    <Modal title="Report preview" onClose={onClose} wide>
      <p className="text-xs text-[#EEEEEE]/60 mb-3">Markdown, built in your browser. Matched log lines are included, so check it for anything sensitive before sharing.</p>
      <div className="flex gap-2 mb-3">
        <Button onClick={copy}>Copy Markdown</Button>
        <Button variant="secondary" onClick={download}>
          Download .md
        </Button>
      </div>
      <pre tabIndex={0} aria-label="Report Markdown" className="max-h-[50dvh] overflow-auto rounded-xl bg-[#222831] border border-[#393E46] p-3 font-mono text-xs whitespace-pre-wrap break-words">
        {markdown}
      </pre>
    </Modal>
  )
}
