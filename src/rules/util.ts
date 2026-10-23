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
