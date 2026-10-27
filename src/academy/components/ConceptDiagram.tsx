import { useId, type ReactNode } from 'react'
import type * as React from 'react'
import type { AcademyModule } from '../types'

interface DiagramFrameProps {
  title: string
  description: string
  legend: ReactNode
  children: (arrowId: string) => ReactNode
}

function DiagramFrame({ title, description, legend, children }: DiagramFrameProps) {
  const baseId = useId().replace(/:/g, '')
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`
  const arrowId = `${baseId}-arrow`

  return (
    <figure className="overflow-hidden rounded-2xl border border-[#1e2a44] bg-[#0f1729]">
      <figcaption className="border-b border-[#1e2a44] px-4 py-3 sm:px-5">
        <h3 className="font-display text-base font-semibold text-[#e6edf7]">{title}</h3>
        <p className="mt-1 text-sm text-[#e6edf7]/70">{description}</p>
      </figcaption>
      <div className="overflow-x-auto p-3 sm:p-5">
        <svg
          viewBox="0 0 720 400"
          className="h-auto min-w-[620px] w-full"
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
        >
          <title id={titleId}>{title}</title>
          <desc id={descriptionId}>{description}</desc>
          <defs>
            <marker id={arrowId} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#67e8f9" />
            </marker>
          </defs>
          {children(arrowId)}
        </svg>
      </div>
      <div className="border-t border-[#1e2a44] bg-[#1e2a44]/35 px-4 py-3 text-sm text-[#e6edf7]/80 sm:px-5">
        {legend}
      </div>
    </figure>
  )
}

function Legend({ items }: { items: string[] }) {
  return (
    <ol className="grid gap-2 sm:grid-cols-2">
      {items.map((item, index) => (
        <li key={item} className="flex gap-2">
          <span className="font-mono font-bold text-[#67e8f9]">{index + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function CiaDiagram() {
  return (
    <DiagramFrame
      title="The CIA triad"
      description="Security balances confidentiality, integrity, and availability; weakening any side weakens the whole system."
      legend={
        <Legend
          items={[
            'Confidentiality limits information to authorized people and systems.',
            'Integrity keeps information accurate and protects it from unauthorized change.',
            'Availability keeps information and services usable when they are needed.',
          ]}
        />
      }
    >
      {() => (
        <>
          <polygon points="360,46 100,332 620,332" fill="#1e2a44" stroke="#4c8dff" strokeWidth="4" />
          <polygon points="360,113 183,305 537,305" fill="#0f1729" stroke="#67e8f9" strokeWidth="2" strokeDasharray="8 7" />
          <circle cx="360" cy="70" r="31" fill="#23406c" stroke="#67e8f9" strokeWidth="3" />
          <circle cx="118" cy="316" r="31" fill="#23406c" stroke="#86efac" strokeWidth="3" />
          <circle cx="602" cy="316" r="31" fill="#23406c" stroke="#fde047" strokeWidth="3" />
          <text x="360" y="77" textAnchor="middle" fill="#e6edf7" fontSize="20" fontWeight="700">1</text>
          <text x="118" y="323" textAnchor="middle" fill="#e6edf7" fontSize="20" fontWeight="700">2</text>
          <text x="602" y="323" textAnchor="middle" fill="#e6edf7" fontSize="20" fontWeight="700">3</text>
          <text x="360" y="154" textAnchor="middle" fill="#e6edf7" fontSize="16" fontWeight="700">CONFIDENTIALITY</text>
          <text x="206" y="282" textAnchor="middle" fill="#e6edf7" fontSize="16" fontWeight="700">INTEGRITY</text>
          <text x="514" y="282" textAnchor="middle" fill="#e6edf7" fontSize="16" fontWeight="700">AVAILABILITY</text>
          <text x="360" y="226" textAnchor="middle" fill="#67e8f9" fontSize="18" fontWeight="700">SECURE</text>
          <text x="360" y="249" textAnchor="middle" fill="#67e8f9" fontSize="18" fontWeight="700">SYSTEMS</text>
        </>
      )}
    </DiagramFrame>
  )
}

function DefenseInDepthDiagram() {
  return (
    <DiagramFrame
      title="Defense in depth"
      description="Several independent safeguards surround an asset, so one failed control does not expose it by itself."
      legend={
        <Legend
          items={[
            'People and process set policy, training, and response expectations.',
            'Identity and network controls restrict who and what can connect.',
            'Host and application controls harden the systems closest to the asset.',
            'The protected asset is the data or service every layer is defending.',
          ]}
        />
      }
    >
      {() => (
        <>
          <rect x="35" y="28" width="650" height="344" rx="54" fill="#17233a" stroke="#4c8dff" strokeWidth="4" strokeDasharray="16 7" />
          <rect x="102" y="76" width="516" height="248" rx="46" fill="#142b3a" stroke="#67e8f9" strokeWidth="4" />
          <rect x="176" y="121" width="368" height="158" rx="38" fill="#183229" stroke="#86efac" strokeWidth="4" strokeDasharray="8 6" />
          <rect x="268" y="164" width="184" height="72" rx="20" fill="#3f3519" stroke="#fde047" strokeWidth="4" />
          <circle cx="65" cy="58" r="20" fill="#0f1729" stroke="#4c8dff" strokeWidth="3" />
          <circle cx="132" cy="106" r="20" fill="#0f1729" stroke="#67e8f9" strokeWidth="3" />
          <circle cx="206" cy="151" r="20" fill="#0f1729" stroke="#86efac" strokeWidth="3" />
          <circle cx="298" cy="194" r="20" fill="#0f1729" stroke="#fde047" strokeWidth="3" />
          <text x="65" y="65" textAnchor="middle" fill="#e6edf7" fontSize="18" fontWeight="700">1</text>
          <text x="132" y="113" textAnchor="middle" fill="#e6edf7" fontSize="18" fontWeight="700">2</text>
          <text x="206" y="158" textAnchor="middle" fill="#e6edf7" fontSize="18" fontWeight="700">3</text>
          <text x="298" y="201" textAnchor="middle" fill="#e6edf7" fontSize="18" fontWeight="700">4</text>
          <text x="360" y="60" textAnchor="middle" fill="#e6edf7" fontSize="15" fontWeight="700">PEOPLE &amp; PROCESS</text>
          <text x="360" y="108" textAnchor="middle" fill="#e6edf7" fontSize="15" fontWeight="700">IDENTITY &amp; NETWORK</text>
          <text x="360" y="153" textAnchor="middle" fill="#e6edf7" fontSize="15" fontWeight="700">HOST &amp; APPLICATION</text>
          <text x="376" y="195" textAnchor="middle" fill="#e6edf7" fontSize="14" fontWeight="700">PROTECTED</text>
          <text x="376" y="214" textAnchor="middle" fill="#e6edf7" fontSize="14" fontWeight="700">ASSET</text>
        </>
      )}
    </DiagramFrame>
  )
}

function PacketJourneyDiagram() {
  const stages = [
    { x: 18, width: 112, label: ['DEVICE'] },
    { x: 158, width: 104, label: ['DNS'] },
    { x: 290, width: 140, label: ['ROUTER /', 'FIREWALL'] },
    { x: 458, width: 112, label: ['SERVER'] },
    { x: 598, width: 104, label: ['RESPONSE'] },
  ]

  return (
    <DiagramFrame
      title="A packet's journey"
      description="A request leaves a device, resolves a destination, crosses network controls, reaches a server, and returns as a response."
      legend={
        <Legend
          items={[
            'The device creates a request for a named destination.',
            'DNS translates the destination name into an IP address.',
            'The router and firewall choose a path and apply traffic rules.',
            'The server receives the allowed request and processes it.',
            'The response follows a permitted route back to the device.',
          ]}
        />
      }
    >
      {(arrowId) => (
        <>
          <path d="M650 282 C540 356, 180 356, 74 282" fill="none" stroke="#67e8f9" strokeWidth="3" strokeDasharray="9 7" markerEnd={`url(#${arrowId})`} />
          <text x="360" y="355" textAnchor="middle" fill="#e6edf7" fontSize="14" fontWeight="600">Return path to the device</text>
          {stages.slice(0, -1).map((stage, index) => {
            const next = stages[index + 1]
            return (
              <line
                key={`${stage.x}-${next.x}`}
                x1={stage.x + stage.width}
                y1="187"
                x2={next.x - 12}
                y2="187"
                stroke="#67e8f9"
                strokeWidth="3"
                markerEnd={`url(#${arrowId})`}
              />
            )
          })}
          {stages.map((stage, index) => (
            <g key={stage.x}>
              <rect x={stage.x} y="133" width={stage.width} height="108" rx="18" fill="#1e2a44" stroke={index % 2 === 0 ? '#4c8dff' : '#86efac'} strokeWidth="3" />
              <circle cx={stage.x + stage.width / 2} cy="113" r="19" fill="#0f1729" stroke="#67e8f9" strokeWidth="3" />
              <text x={stage.x + stage.width / 2} y="120" textAnchor="middle" fill="#e6edf7" fontSize="17" fontWeight="700">{index + 1}</text>
              <text x={stage.x + stage.width / 2} y={stage.label.length === 1 ? 193 : 181} textAnchor="middle" fill="#e6edf7" fontSize="14" fontWeight="700">
                {stage.label.map((line, lineIndex) => (
                  <tspan key={line} x={stage.x + stage.width / 2} dy={lineIndex === 0 ? 0 : 19}>{line}</tspan>
                ))}
              </text>
            </g>
          ))}
        </>
      )}
    </DiagramFrame>
  )
}

function IncidentLifecycleDiagram() {
  const stages = [
    { x: 360, y: 62, label: 'PREPARE' },
    { x: 568, y: 151, label: 'DETECT' },
    { x: 500, y: 323, label: 'RESPOND' },
    { x: 220, y: 323, label: 'RECOVER' },
    { x: 152, y: 151, label: 'IMPROVE' },
  ]

  return (
    <DiagramFrame
      title="Incident response lifecycle"
      description="Incident response is a continuous learning cycle: prepare, detect, respond, recover, then improve before the next event."
      legend={
        <Legend
          items={[
            'Prepare plans, people, tools, and safe practice exercises.',
            'Detect and validate signs that an incident may be occurring.',
            'Respond by containing harm, preserving evidence, and communicating.',
            'Recover services safely and verify that the threat is removed.',
            'Improve controls and plans using lessons from the incident.',
          ]}
        />
      }
    >
      {(arrowId) => (
        <>
          <path d="M397 77 L526 132" fill="none" stroke="#67e8f9" strokeWidth="3" markerEnd={`url(#${arrowId})`} />
          <path d="M573 191 L520 282" fill="none" stroke="#67e8f9" strokeWidth="3" markerEnd={`url(#${arrowId})`} />
          <path d="M456 323 L264 323" fill="none" stroke="#67e8f9" strokeWidth="3" markerEnd={`url(#${arrowId})`} />
          <path d="M200 282 L147 191" fill="none" stroke="#67e8f9" strokeWidth="3" markerEnd={`url(#${arrowId})`} />
          <path d="M194 132 L323 77" fill="none" stroke="#67e8f9" strokeWidth="3" markerEnd={`url(#${arrowId})`} />
          <circle cx="360" cy="200" r="75" fill="#142b3a" stroke="#4c8dff" strokeWidth="3" strokeDasharray="8 6" />
          <text x="360" y="192" textAnchor="middle" fill="#e6edf7" fontSize="18" fontWeight="700">CONTINUOUS</text>
          <text x="360" y="218" textAnchor="middle" fill="#67e8f9" fontSize="18" fontWeight="700">LEARNING</text>
          {stages.map((stage, index) => (
            <g key={stage.label}>
              <circle cx={stage.x} cy={stage.y} r="48" fill="#1e2a44" stroke={index % 2 === 0 ? '#4c8dff' : '#86efac'} strokeWidth="3" />
              <text x={stage.x} y={stage.y - 5} textAnchor="middle" fill="#67e8f9" fontSize="15" fontWeight="700">{index + 1}</text>
              <text x={stage.x} y={stage.y + 17} textAnchor="middle" fill="#e6edf7" fontSize="13" fontWeight="700">{stage.label}</text>
            </g>
          ))}
        </>
      )}
    </DiagramFrame>
  )
}

function VulnerabilityPriorityDiagram() {
  return (
    <DiagramFrame
      title="Vulnerability priority matrix"
      description="Prioritize vulnerabilities using both exploitability and business impact instead of relying on severity alone."
      legend={
        <Legend
          items={[
            'Monitor: lower exploitability and lower business impact.',
            'Reduce exposure: higher exploitability but lower business impact.',
            'Plan remediation: lower exploitability but higher business impact.',
            'Act first: higher exploitability and higher business impact.',
          ]}
        />
      }
    >
      {() => (
        <>
          <rect x="148" y="40" width="500" height="300" fill="#111c31" stroke="#94a3b8" strokeWidth="2" />
          <rect x="148" y="190" width="250" height="150" fill="#1e2a44" stroke="#94a3b8" strokeWidth="2" />
          <rect x="398" y="190" width="250" height="150" fill="#183046" stroke="#94a3b8" strokeWidth="2" />
          <rect x="148" y="40" width="250" height="150" fill="#293044" stroke="#94a3b8" strokeWidth="2" />
          <rect x="398" y="40" width="250" height="150" fill="#3b321b" stroke="#94a3b8" strokeWidth="2" />
          <text x="273" y="244" textAnchor="middle" fill="#67e8f9" fontSize="20" fontWeight="700">1</text>
          <text x="273" y="272" textAnchor="middle" fill="#e6edf7" fontSize="17" fontWeight="700">MONITOR</text>
          <text x="523" y="244" textAnchor="middle" fill="#67e8f9" fontSize="20" fontWeight="700">2</text>
          <text x="523" y="272" textAnchor="middle" fill="#e6edf7" fontSize="17" fontWeight="700">REDUCE EXPOSURE</text>
          <text x="273" y="94" textAnchor="middle" fill="#67e8f9" fontSize="20" fontWeight="700">3</text>
          <text x="273" y="122" textAnchor="middle" fill="#e6edf7" fontSize="17" fontWeight="700">PLAN REMEDIATION</text>
          <text x="523" y="94" textAnchor="middle" fill="#fde047" fontSize="20" fontWeight="700">4</text>
          <text x="523" y="122" textAnchor="middle" fill="#e6edf7" fontSize="17" fontWeight="700">ACT FIRST</text>
          <text x="398" y="380" textAnchor="middle" fill="#e6edf7" fontSize="15" fontWeight="700">EXPLOITABILITY: LOW → HIGH</text>
          <text x="43" y="190" textAnchor="middle" fill="#e6edf7" fontSize="15" fontWeight="700" transform="rotate(-90 43 190)">BUSINESS IMPACT: LOW → HIGH</text>
        </>
      )}
    </DiagramFrame>
  )
}

function CloudResponsibilityDiagram() {
  const columns = [
    { x: 22, width: 212, number: 1, title: 'PROVIDER', lines: ['Facilities', 'Hardware', 'Core cloud services'], stroke: '#4c8dff' },
    { x: 254, width: 212, number: 2, title: 'SHARED', lines: ['Platform settings', 'Secure interfaces', 'Monitoring signals'], stroke: '#67e8f9' },
    { x: 486, width: 212, number: 3, title: 'CUSTOMER', lines: ['Data', 'Identities & access', 'Workload configuration'], stroke: '#86efac' },
  ]

  return (
    <DiagramFrame
      title="Cloud shared responsibility"
      description="Cloud security is divided between the provider and customer, with some controls requiring action and coordination from both."
      legend={
        <Legend
          items={[
            'The provider secures the physical infrastructure and core cloud services.',
            'Shared controls need clear ownership, secure configuration, and coordinated monitoring.',
            'The customer secures their data, identities, access, and workload configuration.',
          ]}
        />
      }
    >
      {() => (
        <>
          <path d="M128 78 H592" stroke="#94a3b8" strokeWidth="2" strokeDasharray="8 6" />
          <text x="360" y="53" textAnchor="middle" fill="#e6edf7" fontSize="15" fontWeight="700">ONE CLOUD SERVICE · THREE AREAS OF OWNERSHIP</text>
          {columns.map((column) => (
            <g key={column.title}>
              <rect x={column.x} y="102" width={column.width} height="248" rx="22" fill="#1e2a44" stroke={column.stroke} strokeWidth="4" />
              <circle cx={column.x + column.width / 2} cy="102" r="25" fill="#0f1729" stroke={column.stroke} strokeWidth="3" />
              <text x={column.x + column.width / 2} y="110" textAnchor="middle" fill="#e6edf7" fontSize="19" fontWeight="700">{column.number}</text>
              <text x={column.x + column.width / 2} y="163" textAnchor="middle" fill={column.stroke} fontSize="17" fontWeight="700">{column.title}</text>
              <line x1={column.x + 28} y1="183" x2={column.x + column.width - 28} y2="183" stroke="#64748b" strokeWidth="1" />
              {column.lines.map((line, index) => (
                <text key={line} x={column.x + column.width / 2} y={224 + index * 38} textAnchor="middle" fill="#e6edf7" fontSize="14" fontWeight="600">{line}</text>
              ))}
            </g>
          ))}
        </>
      )}
    </DiagramFrame>
  )
}

function DetectionPipelineDiagram() {
  const stages = [
    { x: 12, width: 118, label: 'TELEMETRY', detail: 'Collect' },
    { x: 154, width: 118, label: 'NORMALIZE', detail: 'Structure' },
    { x: 296, width: 118, label: 'DETECT', detail: 'Match' },
    { x: 438, width: 118, label: 'TRIAGE', detail: 'Decide' },
    { x: 580, width: 128, label: 'TUNE', detail: 'Improve' },
  ]

  return (
    <DiagramFrame
      title="Detection pipeline"
      description="Useful detections move telemetry through consistent processing and analyst decisions, then feed lessons back into tuning."
      legend={
        <Legend
          items={[
            'Telemetry collects relevant activity from systems and services.',
            'Normalize converts different records into consistent fields.',
            'Detect applies rules or analytics to identify suspicious activity.',
            'Triage adds context so an analyst can decide what needs action.',
            'Tune reduces noise, closes gaps, and improves the next detection cycle.',
          ]}
        />
      }
    >
      {(arrowId) => (
        <>
          {stages.slice(0, -1).map((stage, index) => (
            <line
              key={stage.label}
              x1={stage.x + stage.width}
              y1="183"
              x2={stages[index + 1].x - 12}
              y2="183"
              stroke="#67e8f9"
              strokeWidth="3"
              markerEnd={`url(#${arrowId})`}
            />
          ))}
          {stages.map((stage, index) => (
            <g key={stage.label}>
              <rect x={stage.x} y="116" width={stage.width} height="134" rx="18" fill="#1e2a44" stroke={index === stages.length - 1 ? '#86efac' : '#4c8dff'} strokeWidth="3" />
              <circle cx={stage.x + stage.width / 2} cy="105" r="21" fill="#0f1729" stroke="#67e8f9" strokeWidth="3" />
              <text x={stage.x + stage.width / 2} y="112" textAnchor="middle" fill="#e6edf7" fontSize="17" fontWeight="700">{index + 1}</text>
              <text x={stage.x + stage.width / 2} y="177" textAnchor="middle" fill="#e6edf7" fontSize="13" fontWeight="700">{stage.label}</text>
              <text x={stage.x + stage.width / 2} y="205" textAnchor="middle" fill="#67e8f9" fontSize="13" fontWeight="600">{stage.detail}</text>
            </g>
          ))}
          <path d="M644 273 C630 352, 368 368, 348 270" fill="none" stroke="#86efac" strokeWidth="3" strokeDasharray="9 7" markerEnd={`url(#${arrowId})`} />
          <text x="505" y="345" textAnchor="middle" fill="#e6edf7" fontSize="14" fontWeight="600">Tuning feeds improvements back into detection</text>
        </>
      )}
    </DiagramFrame>
  )
}

export function ConceptDiagram({ type }: { type: NonNullable<AcademyModule['diagram']> }): React.ReactElement {
  switch (type) {
    case 'cia':
      return <CiaDiagram />
    case 'defense-in-depth':
      return <DefenseInDepthDiagram />
    case 'packet-journey':
      return <PacketJourneyDiagram />
    case 'incident-lifecycle':
      return <IncidentLifecycleDiagram />
    case 'vulnerability-priority':
      return <VulnerabilityPriorityDiagram />
    case 'cloud-responsibility':
      return <CloudResponsibilityDiagram />
    case 'detection-pipeline':
      return <DetectionPipelineDiagram />
  }
}
