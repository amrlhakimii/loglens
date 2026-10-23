import { DEFAULT_CONTEXT, detect } from '../src/engine'
import { parseLog } from '../src/parser'
import { SAMPLES, SAMPLE_YEAR } from '../src/samples'
import type { Finding, LogEvent } from '../src/types'

export function sysmonEvent(fields: Record<string, string>, id = 1): LogEvent {
  const all = { EventCode: '1', UtcTime: '2026-10-23 08:00:00', Computer: 'WIN-LAB01', User: 'WIN-LAB01\\labuser', ...fields }
  return { id, raw: JSON.stringify(all), time: '2026-10-23T08:00:00.000Z', host: all.Computer, user: all.User, fields: all, source: 'sysmon' }
}

export function parseSample(key: keyof typeof SAMPLES = 'all') {
  return parseLog(SAMPLES[key].text, { defaultYear: SAMPLE_YEAR })
}

export function findingsFor(key: keyof typeof SAMPLES = 'all'): Finding[] {
  return detect(parseSample(key).events).findings
}

export { DEFAULT_CONTEXT }

/** Build ssh log lines. `at` is "HH:MM:SS" on Oct 23. */
export function sshFail(at: string, src = '203.0.113.45', user = 'root'): string {
  return `Oct 23 ${at} lab-ubuntu01 sshd[100]: Failed password for ${user} from ${src} port 40000 ssh2`
}
export function sshOk(at: string, src = '203.0.113.45', user = 'labuser'): string {
  return `Oct 23 ${at} lab-ubuntu01 sshd[100]: Accepted password for ${user} from ${src} port 40000 ssh2`
}
