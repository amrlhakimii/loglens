import type { Rule } from '../types'
import { EVENT_PROCESS_CREATE, RISKY_PARENTS, endsWithAny, field, includesAny, lower, suspiciousPath } from './util'

/** Software deployment agents that create scheduled tasks as part of normal operation. Tune per environment. */
export const SCHTASKS_PARENT_ALLOWLIST = ['\\ccmexec.exe', '\\msiexec.exe', '\\trustedinstaller.exe'] as const

function isRisky(e: Parameters<Rule['match']>[0]): boolean {
  const cmd = lower(field(e, 'CommandLine'))
  return cmd.includes('/ru system') || suspiciousPath(cmd) || endsWithAny(field(e, 'ParentImage'), RISKY_PARENTS)
}

export const schtasksCreate: Rule = {
  id: 'schtasks-create',
  version: '1.0.0',
  title: 'Scheduled Task Created via schtasks',
  attack: { id: 'T1053.005', name: 'Scheduled Task/Job: Scheduled Task' },
  severity: 'medium',
  explanation: 'schtasks.exe was run with /create. Severity rises to high when the task runs as SYSTEM, points into a user-writable folder, or was launched by a script host, Office or a shell.',
  whyItMatters:
    'Scheduled tasks let Windows run a program on a timer or at logon. Attackers create them so their program keeps coming back after a reboot, and sometimes to run it with SYSTEM rights. Admins and installers create tasks too, so the rule looks at who launched it, what it runs and where that program lives. A task that launches something from a temp or public folder as SYSTEM deserves a close look. A plain query of existing tasks does not trigger this rule.',
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
    const risky = isRisky(e)
    return {
      summary: risky ? 'A scheduled task was created in a risky way (SYSTEM, user-writable path, or risky parent).' : 'A scheduled task was created.',
      fields: ['Image', 'CommandLine', 'ParentImage'],
      severity: risky ? 'high' : 'medium',
    }
  },
}
