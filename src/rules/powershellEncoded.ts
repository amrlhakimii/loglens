import type { Rule } from '../types'
import { EVENT_PROCESS_CREATE, endsWithAny, field } from './util'

/** Parent processes of enterprise management agents that legitimately send encoded PowerShell. Tune per environment. */
export const POWERSHELL_PARENT_ALLOWLIST = ['\\ccmexec.exe', '\\agentexecutor.exe', '\\microsoft.management.services.intunewindowsagent.exe'] as const
const POWERSHELL_IMAGES = ['\\powershell.exe', '\\pwsh.exe'] as const
const FULL_FLAG = 'encodedcommand'
const BASE64 = /^[A-Za-z0-9+/]{8,}={0,2}$/

export interface EncodedFlag {
  flag: string
  value: string
}

/** PowerShell accepts any prefix of -EncodedCommand plus -ec. Linear scan with a lookahead so the value is not consumed. */
export function findEncodedFlag(cmd: string): EncodedFlag | null {
  const re = /\s[-/]([a-z]+)(?=\s+(\S+))/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(cmd)) !== null) {
    const flag = m[1].toLowerCase()
    if ((flag === 'ec' || FULL_FLAG.startsWith(flag)) && BASE64.test(m[2])) return { flag: m[1], value: m[2] }
  }
  return null
}

export function decodePowerShell(b64: string): string {
  try {
    const bin = atob(b64)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const text = new TextDecoder('utf-16le', { fatal: true }).decode(bytes)
    return text.length > 2000 ? text.slice(0, 2000) + '...' : text
  } catch {
    return ''
  }
}

export const powershellEncoded: Rule = {
  id: 'powershell-encoded-command',
  version: '1.0.0',
  title: 'PowerShell Encoded Command',
  attack: { id: 'T1059.001', name: 'Command and Scripting Interpreter: PowerShell' },
  severity: 'medium',
  explanation: 'powershell.exe or pwsh.exe started with -EncodedCommand (or -enc / -ec), which hides the real command inside base64.',
  whyItMatters:
    'PowerShell can run a command that has been turned into base64 text. Administrators almost never need to do this by hand, but attackers love it because it hides what the command does from a quick glance and from simple keyword filters. Seeing it is not proof of an attack, since some management tools do it too. It is a good reason to decode the text and read what the command actually does.',
  nextSteps: [
    'Decode the payload (LogLens shows a best-effort decode) and read what it does.',
    'Check the parent process: was it launched by Office, a browser, a script host or a management agent?',
    'Look for network connections and file writes from the same process just after this event.',
    'Confirm with the user or system owner whether this was expected.',
  ],
  allowlist: POWERSHELL_PARENT_ALLOWLIST.map((p) => `ParentImage ends with ${p}`),
  appliesTo: ['sysmon'],
  match(e) {
    if (field(e, 'EventCode') !== EVENT_PROCESS_CREATE) return false
    if (!endsWithAny(field(e, 'Image'), POWERSHELL_IMAGES)) return false
    if (endsWithAny(field(e, 'ParentImage'), POWERSHELL_PARENT_ALLOWLIST)) return false
    return findEncodedFlag(field(e, 'CommandLine')) !== null
  },
  describe(e) {
    const hit = findEncodedFlag(field(e, 'CommandLine'))
    const decoded = hit ? decodePowerShell(hit.value) : ''
    return {
      summary: decoded ? `PowerShell ran an encoded command that decodes to: ${decoded.slice(0, 80)}` : 'PowerShell ran an encoded command (payload could not be decoded as UTF-16LE).',
      fields: ['Image', 'CommandLine', 'ParentImage'],
      detail: decoded ? `Decoded payload: ${decoded}` : undefined,
    }
  },
}
