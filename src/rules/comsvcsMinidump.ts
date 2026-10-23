import type { Rule } from '../types'
import { EVENT_PROCESS_CREATE, field, lower } from './util'

export const comsvcsMinidump: Rule = {
  id: 'comsvcs-minidump',
  version: '1.0.0',
  title: 'LSASS Dump via comsvcs.dll MiniDump',
  attack: { id: 'T1003.001', name: 'OS Credential Dumping: LSASS Memory' },
  severity: 'high',
  explanation: 'A command line that calls the MiniDump export of comsvcs.dll (usually through rundll32.exe), a built-in way to write a process memory dump.',
  whyItMatters:
    'Windows ships with a library called comsvcs.dll that can save the memory of any process to a file. Attackers use it to dump lsass.exe, the process that holds password hashes, without bringing their own tools. Because it uses only built-in Windows parts, it can slip past tools that look for known malware files. Normal software has almost no reason to call it from a command line.',
  nextSteps: [
    'Check the process ID in the command line: is it lsass.exe?',
    'Look for the dump file path (the last argument) and whether the file was created or copied elsewhere.',
    'Review the parent process and the logged-on user that ran it.',
    'Treat credentials on the host as exposed if the dump target was lsass.exe.',
  ],
  allowlist: [],
  appliesTo: ['sysmon'],
  match(e) {
    if (field(e, 'EventCode') !== EVENT_PROCESS_CREATE) return false
    const cmd = lower(field(e, 'CommandLine'))
    if (!cmd.includes('comsvcs')) return false
    // "MiniDump" by name, or by ordinal #24 which attackers use to dodge keyword filters.
    return cmd.includes('minidump') || cmd.includes('#24') || cmd.includes('#+000024')
  },
  describe() {
    return { summary: 'comsvcs.dll MiniDump was called, a known way to dump process memory.', fields: ['Image', 'CommandLine', 'ParentImage'] }
  },
}
