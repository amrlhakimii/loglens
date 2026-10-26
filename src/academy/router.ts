import { useSyncExternalStore } from 'react'

export type AcademyRoute =
  | { kind: 'dashboard' }
  | { kind: 'curriculum' }
  | { kind: 'module'; moduleId: string }
  | { kind: 'resources' }
  | { kind: 'glossary' }
  | { kind: 'readiness' }
  | { kind: 'lab' }
  | { kind: 'not-found' }

const serverRoute: AcademyRoute = { kind: 'dashboard' }
let snapshotHash: string | undefined
let snapshotRoute: AcademyRoute = serverRoute

export function parseAcademyHash(hash: string): AcademyRoute {
  const trimmed = hash.trim()
  const withoutHash = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  const queryIndex = withoutHash.indexOf('?')
  let path = (queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex)).trim()

  if (path === '' || path === '/') return { kind: 'dashboard' }
  if (!path.startsWith('/')) return { kind: 'not-found' }

  path = path.replace(/\/+$/, '')

  switch (path) {
    case '':
      return { kind: 'dashboard' }
    case '/curriculum':
      return { kind: 'curriculum' }
    case '/resources':
      return { kind: 'resources' }
    case '/glossary':
      return { kind: 'glossary' }
    case '/readiness':
      return { kind: 'readiness' }
    case '/lab':
      return { kind: 'lab' }
  }

  const modulePrefix = '/module/'
  if (!path.startsWith(modulePrefix)) return { kind: 'not-found' }

  const encodedModuleId = path.slice(modulePrefix.length)
  if (encodedModuleId === '' || encodedModuleId.includes('/')) return { kind: 'not-found' }

  try {
    const moduleId = decodeURIComponent(encodedModuleId)
    return moduleId === '' ? { kind: 'not-found' } : { kind: 'module', moduleId }
  } catch {
    return { kind: 'not-found' }
  }
}

export function hrefFor(route: Exclude<AcademyRoute, { kind: 'not-found' }>): string {
  switch (route.kind) {
    case 'dashboard':
      return '#/'
    case 'curriculum':
      return '#/curriculum'
    case 'module':
      return `#/module/${encodeURIComponent(route.moduleId)}`
    case 'resources':
      return '#/resources'
    case 'glossary':
      return '#/glossary'
    case 'readiness':
      return '#/readiness'
    case 'lab':
      return '#/lab'
  }
}

export function navigateTo(route: Exclude<AcademyRoute, { kind: 'not-found' }>): void {
  window.location.hash = hrefFor(route)
  window.scrollTo(0, 0)
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener('hashchange', onStoreChange)
  window.addEventListener('popstate', onStoreChange)
  return () => {
    window.removeEventListener('hashchange', onStoreChange)
    window.removeEventListener('popstate', onStoreChange)
  }
}

function getSnapshot(): AcademyRoute {
  const hash = window.location.hash
  if (snapshotHash !== hash) {
    snapshotHash = hash
    snapshotRoute = parseAcademyHash(hash)
  }
  return snapshotRoute
}

function getServerSnapshot(): AcademyRoute {
  return serverRoute
}

export function useAcademyRoute(): AcademyRoute {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
