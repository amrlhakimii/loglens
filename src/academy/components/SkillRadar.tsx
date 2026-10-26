import { useId } from 'react'
import type * as React from 'react'
import type { AcademyModule, ModuleCategory } from '../types'

const CATEGORIES = ['Foundations', 'Defend', 'Investigate', 'Engineer', 'Operate'] as const satisfies readonly ModuleCategory[]
const CENTER_X = 260
const CENTER_Y = 190
const RADIUS = 124

function pointAt(axis: number, scale: number) {
  const angle = -Math.PI / 2 + (axis * Math.PI * 2) / CATEGORIES.length
  return {
    x: CENTER_X + Math.cos(angle) * RADIUS * scale,
    y: CENTER_Y + Math.sin(angle) * RADIUS * scale,
  }
}

function pointsAt(scale: number) {
  return CATEGORIES.map((_, axis) => {
    const point = pointAt(axis, scale)
    return `${point.x},${point.y}`
  }).join(' ')
}

const LABELS = [
  { x: 260, y: 26, anchor: 'middle' },
  { x: 430, y: 132, anchor: 'start' },
  { x: 388, y: 350, anchor: 'start' },
  { x: 132, y: 350, anchor: 'end' },
  { x: 90, y: 132, anchor: 'end' },
] as const

export function SkillRadar({ modules, completedModuleIds }: { modules: AcademyModule[]; completedModuleIds: string[] }): React.ReactElement {
  const titleId = useId()
  const descriptionId = useId()
  const completed = new Set(completedModuleIds)
  const values = CATEGORIES.map((category) => {
    const categoryModules = modules.filter((module) => module.category === category)
    const completedCount = categoryModules.filter((module) => completed.has(module.id)).length
    const percentage = categoryModules.length === 0 ? 0 : Math.round((completedCount / categoryModules.length) * 100)
    return { category, completedCount, total: categoryModules.length, percentage }
  })
  const dataPoints = values
    .map(({ percentage }, axis) => {
      const point = pointAt(axis, percentage / 100)
      return `${point.x},${point.y}`
    })
    .join(' ')

  return (
    <figure className="rounded-2xl border border-[#1e2a44] bg-[#0f1729] p-4 sm:p-5">
      <figcaption className="mb-3">
        <h3 className="font-display text-base font-semibold text-[#e6edf7]">Skill completion radar</h3>
        <p className="mt-1 text-sm text-[#e6edf7]/70">Completed learning by academy category</p>
      </figcaption>
      <svg
        viewBox="0 0 520 380"
        className="h-auto w-full"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
      >
        <title id={titleId}>Skill completion across five academy categories</title>
        <desc id={descriptionId}>A five-axis radar chart showing the percentage of modules completed in Foundations, Defend, Investigate, Engineer, and Operate.</desc>
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            key={level}
            points={pointsAt(level)}
            fill={level % 0.5 === 0 ? '#1e2a44' : 'none'}
            fillOpacity="0.18"
            stroke="#64748b"
            strokeOpacity="0.55"
            strokeWidth="1"
          />
        ))}
        {CATEGORIES.map((category, axis) => {
          const edge = pointAt(axis, 1)
          return (
            <line
              key={category}
              x1={CENTER_X}
              y1={CENTER_Y}
              x2={edge.x}
              y2={edge.y}
              stroke="#94a3b8"
              strokeOpacity="0.6"
              strokeWidth="1"
            />
          )
        })}
        <polygon
          points={dataPoints}
          fill="#4c8dff"
          fillOpacity="0.28"
          stroke="#67e8f9"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {values.map(({ category, percentage }, axis) => {
          const point = pointAt(axis, percentage / 100)
          return (
            <circle
              key={category}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#0f1729"
              stroke="#67e8f9"
              strokeWidth="3"
            />
          )
        })}
        {values.map(({ category, percentage }, axis) => {
          const label = LABELS[axis]
          return (
            <text
              key={category}
              x={label.x}
              y={label.y}
              textAnchor={label.anchor}
              fill="#e6edf7"
              fontSize="14"
              fontWeight="600"
            >
              <tspan x={label.x}>{category}</tspan>
              <tspan x={label.x} dy="19" fill="#67e8f9" fontSize="13">
                {percentage}%
              </tspan>
            </text>
          )
        })}
      </svg>
      <ul className="sr-only">
        {values.map(({ category, completedCount, total, percentage }) => (
          <li key={category}>
            {category}: {completedCount} of {total} modules completed, {percentage} percent.
          </li>
        ))}
      </ul>
    </figure>
  )
}
