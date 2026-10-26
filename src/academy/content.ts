import type { AcademyContent, AcademyModule, GlossaryTerm, LearningResource } from './types'

export async function loadAcademyContent(): Promise<AcademyContent> {
  const [curriculumImport, resourcesImport, glossaryImport] = await Promise.all([
    import('./data/curriculum.json'),
    import('./data/resources.json'),
    import('./data/glossary.json'),
  ])

  const modules: unknown = curriculumImport.default
  const resources: unknown = resourcesImport.default
  const glossary: unknown = glossaryImport.default

  if (!Array.isArray(modules) || !Array.isArray(resources) || !Array.isArray(glossary)) {
    throw new Error('Academy content could not be loaded.')
  }

  return {
    modules: modules as AcademyModule[],
    resources: resources as LearningResource[],
    glossary: glossary as GlossaryTerm[],
  }
}
