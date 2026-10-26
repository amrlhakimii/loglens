import { useId, useState } from 'react'
import type * as React from 'react'
import type { KnowledgeCheck } from '../types'
import { CheckIcon, Panel, primaryAction, secondaryAction } from './AcademyUI'

export function Quiz({
  questions,
  previousScore,
  onScore,
}: {
  questions: KnowledgeCheck[]
  previousScore?: number
  onScore: (score: number) => void
}): React.ReactElement {
  const headingId = useId()
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [score, setScore] = useState<number | null>(null)
  const activeQuestions = questions.slice(0, 4)
  const allAnswered = activeQuestions.length === 4 && activeQuestions.every((_, index) => answers[index] !== undefined)

  const submit = () => {
    if (!allAnswered) return
    const correct = activeQuestions.reduce((total, question, index) => total + (answers[index] === question.correctIndex ? 1 : 0), 0)
    const nextScore = Math.round((correct / activeQuestions.length) * 100)
    setScore(nextScore)
    onScore(nextScore)
  }

  const retry = () => {
    setAnswers({})
    setScore(null)
  }

  return (
    <Panel className="overflow-hidden" as="section">
      <div className="border-b border-white/[0.08] bg-gradient-to-r from-[#4c8dff]/15 to-cyan-300/[0.04] px-5 py-5 sm:px-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#67e8f9]">Knowledge check</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id={headingId} className="font-display text-2xl font-bold text-[#f5f8ff]">Four-question quiz</h2>
            <p className="mt-1 text-sm text-[#e6edf7]/65">Answer every question before submitting. Explanations appear with your result.</p>
          </div>
          {previousScore !== undefined && score === null && (
            <p className="rounded-full border border-white/10 bg-[#081120]/60 px-3 py-1.5 text-xs font-semibold text-[#e6edf7]/70">
              Saved attempt: {previousScore}%
            </p>
          )}
        </div>
      </div>

      <div className="space-y-8 px-5 py-6 sm:px-7" aria-labelledby={headingId}>
        {activeQuestions.map((question, questionIndex) => {
          const selected = answers[questionIndex]
          const answeredCorrectly = selected === question.correctIndex
          return (
            <fieldset key={question.question} className="min-w-0">
              <legend className="text-base font-semibold leading-6 text-[#f5f8ff]">
                <span className="mr-2 text-[#67e8f9]">{questionIndex + 1}.</span>
                {question.question}
              </legend>
              <div className="mt-3 grid gap-2">
                {question.options.map((option, optionIndex) => {
                  const optionId = `${headingId}-${questionIndex}-${optionIndex}`
                  const checked = selected === optionIndex
                  const correctAfterSubmit = score !== null && optionIndex === question.correctIndex
                  const incorrectAfterSubmit = score !== null && checked && !correctAfterSubmit
                  return (
                    <label
                      key={option}
                      htmlFor={optionId}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 transition motion-reduce:transition-none ${
                        correctAfterSubmit
                          ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
                          : incorrectAfterSubmit
                            ? 'border-amber-300/40 bg-amber-300/10 text-amber-100'
                            : checked
                              ? 'border-[#4c8dff]/60 bg-[#4c8dff]/10 text-[#f5f8ff]'
                              : 'border-white/[0.08] bg-[#081120]/45 text-[#e6edf7]/75 hover:border-white/20'
                      }`}
                    >
                      <input
                        id={optionId}
                        type="radio"
                        name={`${headingId}-${questionIndex}`}
                        value={optionIndex}
                        checked={checked}
                        disabled={score !== null}
                        onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#4c8dff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#67e8f9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#081120]"
                      />
                      <span>{option}</span>
                      {correctAfterSubmit && <CheckIcon className="ml-auto mt-1 h-4 w-4 shrink-0 text-emerald-300" />}
                    </label>
                  )
                })}
              </div>
              {score !== null && (
                <div className={`mt-3 rounded-xl border px-4 py-3 text-sm leading-6 ${answeredCorrectly ? 'border-emerald-400/20 bg-emerald-400/[0.07]' : 'border-amber-300/20 bg-amber-300/[0.07]'}`}>
                  <p className="font-semibold text-[#f5f8ff]">{answeredCorrectly ? 'Correct' : 'Review this one'}</p>
                  <p className="mt-1 text-[#e6edf7]/70">{question.explanation}</p>
                </div>
              )}
            </fieldset>
          )
        })}

        {activeQuestions.length !== 4 && (
          <p role="alert" className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            This module’s four-question quiz is not available yet.
          </p>
        )}

        {score === null ? (
          <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.08] pt-5">
            <button type="button" onClick={submit} disabled={!allAnswered} className={`${primaryAction} disabled:cursor-not-allowed disabled:opacity-40`}>
              Submit answers
            </button>
            <p className="text-sm text-[#e6edf7]/60" aria-live="polite">
              {Object.keys(answers).length} of 4 answered
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-[#67e8f9]/20 bg-[#67e8f9]/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between" role="status" aria-live="polite">
            <div>
              <p className="text-sm font-semibold text-[#67e8f9]">Attempt saved in this browser</p>
              <p className="mt-1 font-display text-3xl font-extrabold text-[#f5f8ff]">{score}%</p>
              <p className="mt-1 text-sm text-[#e6edf7]/65">{score >= 75 ? 'Strong result. Review the explanations, then keep going.' : 'Review each explanation and retry when you are ready.'}</p>
            </div>
            <button type="button" onClick={retry} className={secondaryAction}>Retry quiz</button>
          </div>
        )}
      </div>
    </Panel>
  )
}
