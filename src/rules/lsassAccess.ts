import type { Rule } from '../types'
import { EVENT_PROCESS_ACCESS, endsWithAny, field, lower } from './util'

/** GrantedAccess masks commonly requested when dumping LSASS memory. */
export const LSASS_DUMP_ACCESS = ['0x1010', '0x1410', '0x1438', '0x143a', '0x1f0fff', '0x1f1fff', '0x1f2fff', '0x1f3fff', '0x1fffff'] as const
/** Processes that legitimately open LSASS. */
export const LSASS_SOURCE_ALLOWLIST = ['\\svchost.exe', '\\csrss.exe', '\\wininit.exe', '\\lsm.exe', '\\msmpeng.exe', '\\wmiprvse.exe'] as const

export const lsassAccess: Rule = {
  id: 'lsass-memory-access',
  version: '1.0.0',
  title: 'Suspicious LSASS Memory Access',
  attack: { id: 'T1003.001', name: 'OS Credential Dumping: LSASS Memory' },
  severity: 'high',
  explanation: 'A process that is not on the allowlist opened lsass.exe with access rights used by credential dumping tools (Sysmon event 10).',
  whyItMatters:
    'lsass.exe is the Windows process that holds logon secrets in memory, such as password hashes and tickets. If a program can read that memory, it can steal credentials and use them to move to other machines. A few trusted system and antivirus processes open lsass.exe all the time, so this rule ignores those. An unknown program doing it, especially from a temp or user folder, is a classic sign of credential theft.',
  nextSteps: [
    'Identify SourceImage: is it a known security product, backup agent or a file in a user-writable folder?',
    'Check whether the file is signed and how long it has existed on the host.',
    'Look for a dump file written to disk (for example .dmp) shortly afterwards.',
    'If suspicious, treat accounts that were logged on to this host as exposed and reset their credentials.',
  ],
  allowlist: LSASS_SOURCE_ALLOWLIST.map((p) => `SourceImage ends with ${p}`),
  appliesTo: ['sysmon'],
  match(e) {
    if (field(e, 'EventCode') !== EVENT_PROCESS_ACCESS) return false
    if (!lower(field(e, 'TargetImage')).endsWith('\\lsass.exe')) return false
    if (endsWithAny(field(e, 'SourceImage'), LSASS_SOURCE_ALLOWLIST)) return false
    return (LSASS_DUMP_ACCESS as readonly string[]).includes(lower(field(e, 'GrantedAccess')))
  },
  describe(e) {
    return {
      summary: `${field(e, 'SourceImage')} opened lsass.exe with access ${field(e, 'GrantedAccess')}`,
      fields: ['SourceImage', 'TargetImage', 'GrantedAccess'],
    }
  },
}
