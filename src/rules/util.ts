import type { LogEvent } from '../types'

export const field = (e: LogEvent, key: string): string => e.fields[key] ?? ''
export const lower = (s: string): string => s.toLowerCase()
export const endsWithAny = (s: string, suffixes: readonly string[]): boolean => {
  const l = lower(s)
  return suffixes.some((x) => l.endsWith(x))
}
export const includesAny = (s: string, needles: readonly string[]): boolean => {
  const l = lower(s)
  return needles.some((x) => l.includes(x))
}

export const EVENT_PROCESS_CREATE = '1'
export const EVENT_PROCESS_ACCESS = '10'
export const EVENT_REGISTRY_VALUE_SET = '13'

/** Directories where legitimate software rarely persists; malware often does. */
export const SUSPICIOUS_PATHS = ['\\temp\\', '\\appdata\\', '\\users\\public\\', '\\programdata\\'] as const
export const suspiciousPath = (s: string): boolean => includesAny(s, SUSPICIOUS_PATHS)

/** Parents that are common launchers for attacker one-liners. */
export const RISKY_PARENTS = ['\\cmd.exe', '\\powershell.exe', '\\pwsh.exe', '\\wscript.exe', '\\cscript.exe', '\\mshta.exe', '\\rundll32.exe', '\\winword.exe', '\\excel.exe'] as const

/** Office apps, browsers and script hosts: parents that normally have no reason to spawn admin tooling. */
export const ATTACK_LAUNCHER_PARENTS = [
  '\\winword.exe', '\\excel.exe', '\\powerpnt.exe', '\\outlook.exe', '\\onenote.exe', '\\msaccess.exe', '\\mspub.exe',
  '\\chrome.exe', '\\msedge.exe', '\\firefox.exe', '\\iexplore.exe', '\\brave.exe',
  '\\wscript.exe', '\\cscript.exe', '\\mshta.exe',
] as const
export const isAttackLauncherParent = (parentImage: string): boolean => endsWithAny(parentImage, ATTACK_LAUNCHER_PARENTS)

/** Normalise a Windows path for comparison: lower case, forward slashes to backslashes. */
export const normPath = (s: string): string => lower(s).replace(/\//g, '\\').replace(/^"/, '')

/**
 * True when `path` ends with one of `fileNames` (e.g. "\\csfalconservice.exe") AND sits under one of
 * `protectedPrefixes`. Paths containing "\..\" are never trusted. Case-insensitive.
 */
export function isTrustedBinary(path: string, fileNames: readonly string[], protectedPrefixes: readonly string[]): boolean {
  const p = normPath(path)
  if (p.includes('\\..\\')) return false
  return fileNames.some((n) => p.endsWith(n)) && protectedPrefixes.some((x) => p.startsWith(x))
}
