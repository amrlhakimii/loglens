export type AcademyLevel = 'Foundation' | 'Core' | 'Advanced'

export type ModuleCategory = 'Foundations' | 'Defend' | 'Investigate' | 'Engineer' | 'Operate'

export type ResourceAccess = 'Free' | 'Free account' | 'Employer access' | 'Paid'

export interface ModuleSection {
  title: string
  paragraphs: string[]
  keyPoints: string[]
  analogy?: string
  howTo?: string[]
  callout?: {
    kind: 'remember' | 'warning' | 'field-note'
    text: string
  }
}

export interface CodeExample {
  title: string
  language: 'text' | 'spl' | 'kql' | 'python' | 'powershell' | 'sigma' | 'bash'
  code: string
  explanation: string
}

export interface KnowledgeCheck {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface PracticeScenario {
  title: string
  brief: string
  tasks: string[]
  answerGuide: string[]
  safety: string
}

export interface AcademyModule {
  id: string
  order: number
  title: string
  shortTitle: string
  category: ModuleCategory
  level: AcademyLevel
  durationMinutes: number
  summary: string
  roleConnection: string
  objectives: string[]
  jdResponsibilities: string[]
  prerequisites: string[]
  sections: ModuleSection[]
  workflow?: string[]
  commands?: CodeExample[]
  quiz: KnowledgeCheck[]
  practice: PracticeScenario
  resourceIds: string[]
  diagram?: 'cia' | 'defense-in-depth' | 'packet-journey' | 'incident-lifecycle' | 'vulnerability-priority' | 'cloud-responsibility' | 'detection-pipeline'
}

export interface LearningResource {
  id: string
  title: string
  provider: string
  url: string
  description: string
  categories: string[]
  level: AcademyLevel
  access: ResourceAccess
  official: boolean
}

export interface GlossaryTerm {
  term: string
  definition: string
  plainEnglish: string
  relatedModuleIds: string[]
}

export interface AcademyContent {
  modules: AcademyModule[]
  resources: LearningResource[]
  glossary: GlossaryTerm[]
}
