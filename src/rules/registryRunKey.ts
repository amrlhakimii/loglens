import type { Rule } from '../types'
import { EVENT_REGISTRY_VALUE_SET, field, includesAny, lower, suspiciousPath } from './util'

const RUN_KEYS = ['\\currentversion\\run\\', '\\currentversion\\runonce\\'] as const
const RISKY_LAUNCHERS = ['powershell', 'cmd.exe', 'wscript', 'mshta']
/** Values that start with one of these paths look like ordinary installed software, if not otherwise risky. */
export const RUNKEY_VALUE_PATH_ALLOWLIST = ['c:\\program files\\', 'c:\\program files (x86)\\'] as const

function isRisky(value: string): boolean {
  return suspiciousPath(value) || includesAny(value, RISKY_LAUNCHERS)
}

function startsWithAllowedPath(value: string): boolean {
  const v = lower(value).replace(/^"/, '')
  return RUNKEY_VALUE_PATH_ALLOWLIST.some((p) => v.startsWith(p))
}

export const registryRunKey: Rule = {
  id: 'registry-run-key',
  version: '1.0.0',
  title: 'Registry Run Key Persistence',
  attack: { id: 'T1547.001', name: 'Boot or Logon Autostart Execution: Registry Run Keys' },
  severity: 'medium',
  explanation: 'A value was written under a CurrentVersion\\Run or RunOnce registry key (Sysmon event 13). Severity rises to high when the value uses a script host, shell or user-writable folder.',
  whyItMatters:
    'Windows starts every program listed in the Run registry keys each time a user logs in. Attackers add their own entry so their program restarts after every reboot without needing any special rights. Many real applications also use these keys, so the rule skips ordinary Program Files entries and flags the odd ones. Pay most attention to entries that launch PowerShell, a script, or a file in a temp or AppData folder.',
  nextSteps: [
    'Read the Details value: what program or script is launched, and from which folder?',
    'Check which process wrote the value and whether it belongs to a legitimate installer.',
    'Inspect the target file (signature, age, hash).',
    'Remove the value if it is not expected and look for the original infection point.',
  ],
  allowlist: RUNKEY_VALUE_PATH_ALLOWLIST.map((p) => `Details starts with ${p} (only when not otherwise risky)`),
  appliesTo: ['sysmon'],
  match(e) {
    if (field(e, 'EventCode') !== EVENT_REGISTRY_VALUE_SET) return false
    if (!includesAny(field(e, 'TargetObject'), RUN_KEYS)) return false
    const value = field(e, 'Details')
    return isRisky(value) || !startsWithAllowedPath(value)
  },
  describe(e) {
    const value = field(e, 'Details')
    const risky = isRisky(value)
    return {
      summary: `Run key set: ${field(e, 'TargetObject').split('\\').pop() ?? ''} = ${value}`,
      fields: ['TargetObject', 'Details'],
      severity: risky ? 'high' : 'medium',
    }
  },
}
