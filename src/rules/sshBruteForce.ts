import type { LogEvent, Rule, RuleContext, WindowHit } from '../types'

export const DEFAULT_BRUTE_FORCE = { threshold: 5, windowSeconds: 120 } as const
/** Source addresses never flagged. Empty by default: use "Tune this rule" for your own scanners or bastions. */
export const SSH_SOURCE_ALLOWLIST: readonly string[] = []

interface Stamped {
  e: LogEvent
  t: number
}

/**
 * For each source address: find bursts of at least `threshold` failed logins inside `windowSeconds`.
 * A burst is extended while the next failure arrives within `windowSeconds` of the previous one.
 * A success from the same source within `windowSeconds` after the burst escalates it to critical.
 */
export function detectSshBruteForce(events: LogEvent[], ctx: RuleContext): WindowHit[] {
  const { threshold, windowSeconds } = ctx.bruteForce
  const windowMs = windowSeconds * 1000
  const bySource = new Map<string, { fails: Stamped[]; successes: Stamped[] }>()

  for (const e of events) {
    if (e.source !== 'auth' || !e.time) continue
    const kind = e.fields.event
    if (kind !== 'ssh_failed' && kind !== 'ssh_accepted') continue
    const src = e.fields.src
    if (!src || SSH_SOURCE_ALLOWLIST.includes(src)) continue
    const t = Date.parse(e.time)
    if (Number.isNaN(t)) continue
    let bucket = bySource.get(src)
    if (!bucket) bucket = { fails: [], successes: [] }
    bySource.set(src, bucket)
    ;(kind === 'ssh_failed' ? bucket.fails : bucket.successes).push({ e, t })
  }

  const hits: WindowHit[] = []
  for (const [src, { fails, successes }] of bySource) {
    fails.sort((a, b) => a.t - b.t)
    successes.sort((a, b) => a.t - b.t)
    let i = 0
    while (i < fails.length) {
      // Is there a window of `threshold` failures starting at i?
      if (i + threshold - 1 >= fails.length || fails[i + threshold - 1].t - fails[i].t > windowMs) {
        i++
        continue
      }
      let end = i + threshold - 1
      while (end + 1 < fails.length && fails[end + 1].t - fails[end].t <= windowMs) end++
      const burst = fails.slice(i, end + 1)
      const lastFail = burst[burst.length - 1].t
      const success = successes.find((s) => s.t >= lastFail && s.t - lastFail <= windowMs)
      const users = [...new Set(burst.map((b) => b.e.fields.user))]
      const eventIds = burst.map((b) => b.e.id)
      if (success) eventIds.push(success.e.id)
      const base = `${burst.length} failed SSH logins from ${src} in ${Math.max(1, Math.round((lastFail - burst[0].t) / 1000))}s across ${users.length} account${users.length === 1 ? '' : 's'}`
      hits.push({
        eventIds,
        summary: success ? `${base}, then a successful login as ${success.e.fields.user}.` : `${base}, no success seen.`,
        fields: ['src', 'user', 'event'],
        severity: success ? 'critical' : 'medium',
        host: burst[0].e.host,
        user: success ? success.e.fields.user : users.length === 1 ? users[0] : undefined,
        time: burst[0].e.time,
        detail: `Accounts tried: ${users.slice(0, 10).join(', ')}${users.length > 10 ? ', ...' : ''}`,
      })
      i = end + 1
    }
  }
  return hits
}

export const sshBruteForce: Rule = {
  id: 'ssh-brute-force',
  version: '1.0.0',
  title: 'SSH Brute Force',
  attack: { id: 'T1110', name: 'Brute Force' },
  severity: 'high',
  explanation: `${DEFAULT_BRUTE_FORCE.threshold} or more failed SSH logins from one source address within ${DEFAULT_BRUTE_FORCE.windowSeconds} seconds. Medium if it never succeeded; critical if the same source then logged in successfully.`,
  whyItMatters:
    'Anyone who can reach an SSH port can keep guessing passwords. A burst of failures from one address in a short time is a guessing attack, and the internet is full of these. The failures alone are mostly noise, but a success right after a burst means a guess may have worked and the attacker is now inside. That is why this rule rates a burst followed by a login as critical.',
  nextSteps: [
    'Check whether the successful login (if any) was a real user: ask them, or look for the same user logging in from their usual address earlier.',
    'If the login was not expected, end that session, disable the account and reset its credentials.',
    'Review what the session did next: sudo use, new files, new users, outbound connections.',
    'Reduce exposure: disable password logins, use keys, restrict the source range, add rate limiting or fail2ban.',
  ],
  allowlist: ['No source is allowlisted by default. Add a known scanner or bastion with "Tune this rule" (for example src:198.51.100.10).'],
  appliesTo: ['auth'],
  match: () => false,
  detectWindow: detectSshBruteForce,
}
