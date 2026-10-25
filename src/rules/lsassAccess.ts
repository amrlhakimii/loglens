import type { Rule } from '../types'
import { EVENT_PROCESS_ACCESS, field, isTrustedBinary, lower } from './util'

/** GrantedAccess masks commonly requested when dumping LSASS memory. */
export const LSASS_DUMP_ACCESS = ['0x1010', '0x1410', '0x1438', '0x143a', '0x1f0fff', '0x1f1fff', '0x1f2fff', '0x1f3fff', '0x1fffff'] as const
/**
 * Paths a trusted source must live under. Matching on the file name alone would let malware
 * named csfalconservice.exe in a temp folder through, so both name and location are required.
 */
export const LSASS_PROTECTED_PATHS = ['c:\\program files\\', 'c:\\program files (x86)\\', 'c:\\windows\\system32\\', 'c:\\programdata\\microsoft\\windows defender\\'] as const
/** Processes that legitimately open LSASS (examples; tune per environment). Grouped by product. */
export const LSASS_SOURCE_ALLOWLIST = [
  // Windows
  '\\svchost.exe', '\\csrss.exe', '\\wininit.exe', '\\lsm.exe', '\\wmiprvse.exe', '\\services.exe', '\\taskmgr.exe', '\\werfault.exe',
  // Microsoft Defender
  '\\msmpeng.exe', '\\mssense.exe', '\\msssense.exe', '\\nissrv.exe', '\\securityhealthservice.exe',
  // CrowdStrike, SentinelOne, Carbon Black, Cylance
  '\\csfalconservice.exe', '\\sentinelagent.exe', '\\sentinelstaticengine.exe', '\\cb.exe', '\\repmgr.exe', '\\cylancesvc.exe',
  // Sophos, Trellix/McAfee, Symantec, Tanium, Bitdefender
  '\\sophosfs.exe', '\\sophoshealth.exe', '\\mfemms.exe', '\\mcshield.exe', '\\ccsvchst.exe', '\\smc.exe', '\\taniumclient.exe', '\\bdservicehost.exe', '\\bdagent.exe',
] as const

export const lsassAccess: Rule = {
  id: 'lsass-memory-access',
  version: '1.1.0',
  title: 'Suspicious LSASS Memory Access',
  attack: { id: 'T1003.001', name: 'OS Credential Dumping: LSASS Memory' },
  severity: 'high',
  explanation: 'A process that is not on the allowlist opened lsass.exe with access rights used by credential dumping tools (Sysmon event 10).',
  whyItMatters:
    'lsass.exe is the Windows process that holds logon secrets in memory, such as password hashes and tickets. If a program can read that memory, it can steal credentials and use them to move to other machines. A few trusted system and security-product processes open lsass.exe all the time, so this rule ignores those when they run from a protected folder such as Program Files or System32. An unknown program doing it, especially from a temp or user folder, is a classic sign of credential theft.',
  nextSteps: [
    'Identify SourceImage: is it a known security product, backup agent or a file in a user-writable folder?',
    'Check whether the file is signed and how long it has existed on the host.',
    'Look for a dump file written to disk (for example .dmp) shortly afterwards.',
    'If suspicious, treat accounts that were logged on to this host as exposed and reset their credentials.',
  ],
  allowlist: [
    `SourceImage file name is one of: ${LSASS_SOURCE_ALLOWLIST.map((n) => n.slice(1)).join(', ')}`,
    `...and only when it is located under: ${LSASS_PROTECTED_PATHS.join(', ')} (same name in a user-writable folder still alerts)`,
  ],
  appliesTo: ['sysmon'],
  match(e) {
    if (field(e, 'EventCode') !== EVENT_PROCESS_ACCESS) return false
    if (!lower(field(e, 'TargetImage')).endsWith('\\lsass.exe')) return false
    if (isTrustedBinary(field(e, 'SourceImage'), LSASS_SOURCE_ALLOWLIST, LSASS_PROTECTED_PATHS)) return false
    return (LSASS_DUMP_ACCESS as readonly string[]).includes(lower(field(e, 'GrantedAccess')))
  },
  describe(e) {
    return {
      summary: `${field(e, 'SourceImage')} opened lsass.exe with access ${field(e, 'GrantedAccess')}`,
      fields: ['SourceImage', 'TargetImage', 'GrantedAccess'],
    }
  },
}
