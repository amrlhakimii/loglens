import type { MouseEvent } from 'react'
import { navigateTo, type AcademyRoute } from '../router'

type NavigableRoute = Exclude<AcademyRoute, { kind: 'not-found' }>

export function followAcademyLink(event: MouseEvent<HTMLAnchorElement>, route: NavigableRoute): void {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  navigateTo(route)
}
