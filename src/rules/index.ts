import type { Rule } from '../types'
import { comsvcsMinidump } from './comsvcsMinidump'
import { lsassAccess } from './lsassAccess'
import { powershellEncoded } from './powershellEncoded'
import { registryRunKey } from './registryRunKey'
import { schtasksCreate } from './schtasksCreate'
import { sshBruteForce } from './sshBruteForce'

export const RULES: Rule[] = [powershellEncoded, lsassAccess, comsvcsMinidump, schtasksCreate, registryRunKey, sshBruteForce]
export const RULES_BY_ID: Record<string, Rule> = Object.fromEntries(RULES.map((r) => [r.id, r]))
