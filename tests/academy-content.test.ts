import { beforeAll, describe, expect, it } from 'vitest'
import { loadAcademyContent } from '../src/academy/content'
import type { AcademyContent } from '../src/academy/types'

const expectedModuleIds = [
  'cyber-foundations',
  'enterprise-it',
  'network-fundamentals',
  'network-security',
  'telemetry-siem',
  'endpoint-edr',
  'incident-response',
  'threat-intelligence',
  'threat-hunting',
  'digital-forensics',
  'malware-analysis',
  'vulnerability-management',
  'application-security',
  'cloud-security',
  'detection-engineering',
  'automation',
  'security-engineering-operations',
  'critical-infrastructure-readiness',
]

const jdAreas = [
  { name: 'risk assessment and controls', pattern: /assess security risk|layered safeguards/i },
  { name: 'enterprise systems and ownership', pattern: /enterprise systems|infrastructure.*application.*identity/i },
  { name: 'network analysis', pattern: /analyze network telemetry|network security architecture/i },
  { name: 'external connections', pattern: /external connections|third-party access/i },
  { name: 'security monitoring and SIEM', pattern: /monitor security events|SIEM platforms/i },
  { name: 'endpoint detection and response', pattern: /endpoint alerts|endpoint detection and response/i },
  { name: 'incident response', pattern: /incident investigation and response|containment.*recovery/i },
  { name: 'threat intelligence', pattern: /threat intelligence/i },
  { name: 'threat hunting', pattern: /proactive threat hunts/i },
  { name: 'digital forensics', pattern: /digital evidence|forensic artifacts/i },
  { name: 'malware analysis', pattern: /suspicious files|malware identification/i },
  { name: 'vulnerability management', pattern: /vulnerability identification|vulnerability risk/i },
  { name: 'application security', pattern: /application security reviews|secure design and coding/i },
  { name: 'cloud security', pattern: /cloud security architecture|cloud identity.*network.*encryption/i },
  { name: 'detection engineering', pattern: /build, test, and maintain security detections|monitoring coverage/i },
  { name: 'security automation', pattern: /automate repetitive security|security data through APIs/i },
  { name: 'security engineering', pattern: /design, implement, validate, and operate security controls/i },
  { name: 'vendor management', pattern: /vendors and service providers|coordinate vendors/i },
  { name: 'operational issue resolution', pattern: /resolve security operational issues/i },
  { name: 'security awareness and stakeholder collaboration', pattern: /security awareness.*stakeholder collaboration/i },
  { name: 'critical infrastructure', pattern: /critical infrastructure.*safety and availability/i },
]

describe('academy content', () => {
  let content: AcademyContent

  beforeAll(async () => {
    content = await loadAcademyContent()
  })

  it('loads the exact ordered 18-module curriculum', () => {
    expect(content.modules).toHaveLength(18)
    expect(content.modules.map((module) => module.id)).toEqual(expectedModuleIds)
    expect(content.modules.map((module) => module.order)).toEqual(Array.from({ length: 18 }, (_, index) => index + 1))
    expect(new Set(content.modules.map((module) => module.id)).size).toBe(18)
    expect(new Set(content.modules.map((module) => module.order)).size).toBe(18)
  })

  it('provides substantial sections, valid quizzes, and referenced resources for every module', () => {
    const moduleIds = new Set(content.modules.map((module) => module.id))
    const resourceIds = new Set(content.resources.map((resource) => resource.id))

    for (const module of content.modules) {
      expect(module.sections.length, `${module.id} sections`).toBeGreaterThanOrEqual(5)
      expect(module.quiz, `${module.id} quiz`).toHaveLength(4)
      expect(module.objectives.length, `${module.id} objectives`).toBeGreaterThanOrEqual(4)
      expect(module.jdResponsibilities.length, `${module.id} JD responsibilities`).toBeGreaterThanOrEqual(4)
      expect(module.practice.tasks.length, `${module.id} practice tasks`).toBeGreaterThanOrEqual(4)
      expect(module.practice.answerGuide.length, `${module.id} answer guide`).toBeGreaterThanOrEqual(4)
      expect(module.resourceIds.length, `${module.id} resources`).toBeGreaterThanOrEqual(3)

      for (const check of module.quiz) {
        expect(check.options.length, `${module.id}: ${check.question}`).toBeGreaterThanOrEqual(3)
        expect(check.correctIndex, `${module.id}: ${check.question}`).toBeGreaterThanOrEqual(0)
        expect(check.correctIndex, `${module.id}: ${check.question}`).toBeLessThan(check.options.length)
        expect(check.explanation.trim(), `${module.id}: ${check.question}`).not.toBe('')
      }

      for (const resourceId of module.resourceIds) {
        expect(resourceIds.has(resourceId), `${module.id} references ${resourceId}`).toBe(true)
      }

      for (const prerequisiteId of module.prerequisites) {
        expect(moduleIds.has(prerequisiteId), `${module.id} requires ${prerequisiteId}`).toBe(true)
        expect(prerequisiteId, `${module.id} cannot require itself`).not.toBe(module.id)
      }
    }
  })

  it('provides at least 35 unique HTTPS learning resources', () => {
    expect(content.resources.length).toBeGreaterThanOrEqual(35)
    expect(new Set(content.resources.map((resource) => resource.id)).size).toBe(content.resources.length)
    expect(new Set(content.resources.map((resource) => resource.url)).size).toBe(content.resources.length)

    for (const resource of content.resources) {
      expect(resource.url, resource.id).toMatch(/^https:\/\//)
    }
  })

  it('provides at least 90 alphabetically sorted glossary terms with valid module links', () => {
    const moduleIds = new Set(content.modules.map((module) => module.id))
    const terms = content.glossary.map((entry) => entry.term)
    const sortedTerms = [...terms].sort((left, right) => left.localeCompare(right))

    expect(content.glossary.length).toBeGreaterThanOrEqual(90)
    expect(new Set(terms.map((term) => term.toLocaleLowerCase())).size).toBe(terms.length)
    expect(terms).toEqual(sortedTerms)

    for (const entry of content.glossary) {
      expect(entry.relatedModuleIds.length, entry.term).toBeGreaterThan(0)
      for (const moduleId of entry.relatedModuleIds) {
        expect(moduleIds.has(moduleId), `${entry.term} references ${moduleId}`).toBe(true)
      }
    }
  })

  it('covers every job-description responsibility area', () => {
    const responsibilities = content.modules.flatMap((module) => module.jdResponsibilities).join('\n')

    for (const area of jdAreas) {
      expect(responsibilities, area.name).toMatch(area.pattern)
    }
  })
})
