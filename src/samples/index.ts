import authSample from './auth_sample.log?raw'
import sysmonSample from './sysmon_sample.jsonl?raw'

/** Invented data only: hosts, users and addresses (RFC 5737 documentation ranges) are made up. */
export const SAMPLES = {
  all: { name: 'sample-combined.log', text: sysmonSample.trimEnd() + '\n' + authSample },
  sysmon: { name: 'sysmon_sample.jsonl', text: sysmonSample },
  auth: { name: 'auth_sample.log', text: authSample },
} as const

/** Year of the invented samples; syslog lines carry no year. */
export const SAMPLE_YEAR = 2026
export type SampleKey = keyof typeof SAMPLES
