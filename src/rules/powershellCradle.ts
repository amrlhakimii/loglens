import type { LogEvent, Rule } from '../types'
import { POWERSHELL_IMAGES, findEncodedFlag, isAllowlistedPowerShellParent } from './powershellEncoded'
import { EVENT_PROCESS_CREATE, endsWithAny, field, isAttackLauncherParent, lower } from './util'

// Word-ish boundaries written as negated classes so every pattern is linear.
const IEX = /(?:^|[^a-z0-9_-])(?:iex|invoke-expression)(?![a-z0-9_-])/
const DOWNLOAD = /(?:^|[^a-z0-9_-])(?:downloadstring|downloadfile|net\.webclient|invoke-webrequest|iwr)(?![a-z0-9_-])/
const HIDDEN = /\s[-/](?:w|win|window|windowstyle)\s+(?:hidden|1)(?![a-z0-9])/
const NOPROFILE = /\s[-/]no?p(?:r(?:o(?:f(?:i(?:l(?:e)?)?)?)?)?)?(?![a-z0-9])/
const URL = /https?:\/\//

/** Why the command line looks like a download-and-execute cradle (empty when it does not). */
export function cradleReasons(commandLine: string): string[] {
  const cmd = lower(commandLine)
  const reasons: string[] = []
  if (IEX.test(cmd) && DOWNLOAD.test(cmd)) reasons.push('Invoke-Expression/IEX combined with a download call')
  else if (HIDDEN.test(cmd) && NOPROFILE.test(cmd) && URL.test(cmd)) reasons.push('hidden window, no profile, and a URL')
  return reasons
}

function match(e: LogEvent): boolean {
  if (field(e, 'EventCode') !== EVENT_PROCESS_CREATE) return false
  if (!endsWithAny(field(e, 'Image'), POWERSHELL_IMAGES)) return false
  if (isAllowlistedPowerShellParent(field(e, 'ParentImage'))) return false
  const cmd = field(e, 'CommandLine')
  // Encoded commands are covered by the encoded-command rule.
  if (findEncodedFlag(cmd)) return false
  return cradleReasons(cmd).length > 0
}

export const powershellCradle: Rule = {
  id: 'powershell-download-cradle',
  version: '1.0.0',
  title: 'PowerShell Download-and-Execute Cradle',
  attack: { id: 'T1059.001', name: 'Command and Scripting Interpreter: PowerShell' },
  severity: 'medium',
  explanation:
    'powershell.exe or pwsh.exe, without -EncodedCommand, whose command line downloads content and runs it: IEX/Invoke-Expression together with DownloadString, DownloadFile, Net.WebClient, Invoke-WebRequest or iwr; or a hidden window with -NoProfile and a URL. Medium by default; high when launched by Office, a browser or a script host.',
  whyItMatters:
    'A download cradle is a one-line PowerShell command that fetches a script from the internet and runs it straight from memory. It is the most common way a malicious document or web page turns a click into a foothold, because nothing needs to be saved to disk first. Plain downloads that are only saved to a file, with nothing executing them, do not trigger this rule. A hidden window plus no profile plus a web address is a typical attacker pattern even without the explicit execute call. Check where the address points and what launched PowerShell.',
  nextSteps: [
    'Read the full command line: which URL is contacted and what is done with the response?',
    'Check the parent process: Office, a browser or a script host launching PowerShell is a strong warning sign.',
    'Look for network connections and files written by the same process just after this event.',
    'If the URL is unknown, block it and isolate the host while you investigate.',
  ],
  allowlist: ['Parents allowlisted for the encoded-command rule (management and cloud agents) are skipped here too.'],
  appliesTo: ['sysmon'],
  match,
  describe(e) {
    const reasons = cradleReasons(field(e, 'CommandLine'))
    const launcher = isAttackLauncherParent(field(e, 'ParentImage'))
    return {
      summary: `PowerShell command line looks like a download cradle (${reasons.join('; ')})${launcher ? ', launched by Office, a browser or a script host' : ''}.`,
      fields: ['Image', 'CommandLine', 'ParentImage'],
      severity: launcher ? 'high' : 'medium',
    }
  },
}
