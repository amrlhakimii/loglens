import type { LogEvent, Rule } from '../types'
import { EVENT_PROCESS_CREATE, endsWithAny, field, includesAny, isAttackLauncherParent, lower } from './util'

/** Software deployment agents that create scheduled tasks as part of normal operation. Tune per environment. */
export const SCHTASKS_PARENT_ALLOWLIST = ['\\ccmexec.exe', '\\msiexec.exe', '\\trustedinstaller.exe'] as const

/** Folders where a scheduled task target is suspicious: user-writable locations. */
const WRITABLE_TARGETS = ['\\users\\', '\\appdata\\', '\\temp\\', '\\programdata\\', '\\public\\'] as const

/** Count of independent risk signals: SYSTEM, user-writable target, Office/browser/script-host parent. Shells are not a signal. */
export function schtasksSignals(e: LogEvent): string[] {
  const cmd = lower(field(e, 'CommandLine'))
  const signals: string[] = []
  if (/\/ru\s+"?(?:nt authority\\)?system\b/.test(cmd)) signals.push('runs as SYSTEM')
  if (includesAny(cmd, WRITABLE_TARGETS)) signals.push('target in a user-writable folder')
  if (isAttackLauncherParent(field(e, 'ParentImage'))) signals.push('launched by Office, a browser or a script host')
  return signals
}

export const schtasksCreate: Rule = {
  id: 'schtasks-create',
  version: '1.1.0',
  title: 'Scheduled Task Created via schtasks',
  attack: { id: 'T1053.005', name: 'Scheduled Task/Job: Scheduled Task' },
  severity: 'low',
  explanation: 'schtasks.exe was run with /create. A plain create is low. Each risk signal raises it: medium with one signal, high with two or more. Signals are: runs as SYSTEM (/ru SYSTEM), task target in a user-writable folder (Users, AppData, Temp, ProgramData, Public), or launched by Office, a browser or a script host. A shell such as cmd.exe or PowerShell as parent is not a signal on its own.',
  whyItMatters:
    'Scheduled tasks let Windows run a program on a timer or at logon. Attackers create them so their program keeps coming back after a reboot, and sometimes to run it with SYSTEM rights. Admins and installers create tasks too, so the rule looks at who launched it, what it runs and where that program lives. A task that launches something from a temp or public folder as SYSTEM deserves a close look, while a plain task typed into a shell is usually routine. A plain query of existing tasks does not trigger this rule.',
  nextSteps: [
    'Read the /tr value: what program will run, and is that file in a user-writable folder?',
    'Check /ru: running as SYSTEM raises the stakes.',
    'Find the file on disk and check its signature, age and hash.',
    'If the task is not expected, delete it and look for how it was planted (parent process, user).',
  ],
  allowlist: SCHTASKS_PARENT_ALLOWLIST.map((p) => `ParentImage ends with ${p}`),
  appliesTo: ['sysmon'],
  match(e) {
    if (field(e, 'EventCode') !== EVENT_PROCESS_CREATE) return false
    if (!lower(field(e, 'Image')).endsWith('\\schtasks.exe')) return false
    if (!includesAny(field(e, 'CommandLine'), ['/create'])) return false
    return !endsWithAny(field(e, 'ParentImage'), SCHTASKS_PARENT_ALLOWLIST)
  },
  describe(e) {
    const signals = schtasksSignals(e)
    return {
      summary: signals.length ? `A scheduled task was created (${signals.join('; ')}).` : 'A scheduled task was created (no risk signals).',
      fields: ['Image', 'CommandLine', 'ParentImage'],
      severity: signals.length >= 2 ? 'high' : signals.length === 1 ? 'medium' : 'low',
    }
  },
}
