# LogLens Academy

LogLens Academy is two integrated experiences in one browser app:

1. **Cybersecurity Technologist Academy** (default, `#/`) - an interactive, self-paced study companion for readiness toward a generalist cybersecurity technologist role.
2. **LogLens analyzer** (`#/lab`) - a privacy-first browser log analyzer that flags suspicious Sysmon/Linux auth events, explains why in plain language, and lets you practise SOC triage decisions.

**Everything runs in your browser.** Course content is bundled with the app and your log files are never uploaded.

> **Study aid, not certification or employment claim.** Completing the academy is not mastery, and the heuristics in the analyzer are not verdicts. Both are learning and portfolio tools.

## Contents

- [Cybersecurity Technologist Academy](#cybersecurity-technologist-academy)
  - [What it is (and isn't)](#what-it-is-and-isnt)
  - [Curriculum](#curriculum)
  - [Interactive features](#interactive-features)
  - [Hash routes](#hash-routes)
  - [Content counts](#content-counts)
  - [Privacy](#privacy-academy)
- [LogLens analyzer (`#/lab`)](#loglens-analyzer-lab)
  - [Features](#features)
  - [Rules and ATT&CK mapping](#rules-and-attck-mapping)
  - [Privacy model and how to verify it](#privacy-model-and-how-to-verify-it)
  - [Supported formats](#supported-formats)
  - [Limitations](#limitations)
  - [Sample data](#sample-data)
- [Development](#development)
- [Deployment](#deployment)
- [Tests](#tests)
- [License](#license)

## Cybersecurity Technologist Academy

### What it is (and isn't)

- An **independent study companion** built around the shape of a public, generic cybersecurity technologist job description.
- **Not affiliated with, endorsed by, or representative of ExxonMobil** or any specific employer. It contains no internal, proprietary, or confidential information from any organisation.
- A study aid for self-assessment and skill-building. Completing modules and quizzes is not mastery, is not a certification, and is not a guarantee of hiring outcomes. Linked external resources and their access terms can change at any time and are outside this project's control.
- All technical examples (malware-analysis concepts, scenarios, scripts) are **defensive and synthetic**, intended for learning only and never for use against production or real third-party systems.

### Curriculum

18 modules, beginner to advanced, covering:

1. Cybersecurity Foundations
2. Enterprise IT and Service Ownership
3. Network Fundamentals for Defenders
4. Network Security and External Connections
5. Security Telemetry and Security Information and Event Management
6. Endpoint Telemetry and Endpoint Detection and Response
7. Incident Response and Recovery
8. Cyber Threat Intelligence
9. Hypothesis-Driven Threat Hunting
10. Digital Forensics and Evidence Integrity
11. Safe Malware Analysis Concepts
12. Risk-Based Vulnerability Management
13. Application and Application Programming Interface Security
14. Cloud Security Across Amazon Web Services, Microsoft Azure, and Google Cloud
15. Detection Engineering
16. Safe Security Automation with Python and PowerShell
17. Security Engineering and Operations
18. Critical Infrastructure Career Readiness

Each module includes objectives, role-relevant context, several sections of written content, a short workflow or diagram, a four-question quiz, and a synthetic practice scenario with a safety note.

### Interactive features

- **Local progress tracking** per module and quiz, stored only in your browser (see [Privacy](#privacy-academy)).
- **Four-question quizzes** per module to self-check understanding.
- **Safe, synthetic scenarios** (one per module) for applied practice, explicitly scoped away from real systems or employer data.
- **Competency and role-coverage charts** (skill radar, role coverage) to visualise strengths and gaps across the curriculum.
- **Diagrams** illustrating workflows and concepts per module.
- **Searchable curriculum, resource library, and glossary** for quick lookup.
- A suggested **five-week study plan**, a **readiness checklist**, and a **30/60/90 day plan** for structuring preparation.
- An **embedded LogLens lab** so hands-on log analysis practice is one click away from the theory.

### Hash routes

The app is a single page using hash-based routing:

| Route | Page |
| --- | --- |
| `#/` | Academy dashboard (default) |
| `#/curriculum` | Full curriculum / module list |
| `#/module/<id>` | A single module (content, quiz, scenario) |
| `#/resources` | Searchable resource library |
| `#/glossary` | Searchable glossary |
| `#/readiness` | Readiness checklist and 30/60/90 plan |
| `#/lab` | Embedded LogLens analyzer |

### Content counts

- 18 modules
- 90 sections
- 72 quiz questions
- 18 practice scenarios
- 52 resources
- 118 glossary terms

### Privacy (academy)

- All course content (curriculum, resources metadata, glossary) is **bundled with the app at build time**. The browser loads these same-origin build chunks; the academy makes no third-party or content-API requests.
- Progress (module/quiz completion) is stored only in your browser's `localStorage`, under the key `loglens:academy:progress:v1`. It never leaves your device.
- The LogLens analyzer's own privacy guarantees (see below) are unchanged when accessed via `#/lab`.
- Links to external resources (articles, documentation, tools) in the resource library open only when you click them; the app does not pre-fetch or track them.

## LogLens analyzer (`#/lab`)

A browser log analyzer. Drop in a Sysmon or Linux auth log and LogLens flags the events that look suspicious, explains why in plain language, and lets you practise the real SOC decision: close, investigate or escalate, with a note.

**Everything runs in your browser. Your file is never uploaded.**

> **Heuristics, not verdicts.** The rules are simple heuristics validated on *invented* sample data only. They will miss real attacks and flag harmless activity. LogLens is a learning and portfolio project, not a SIEM, an EDR or production-grade coverage.

Analyzer / SOC-lab screenshots:

![Landing page](docs/screenshots/landing.png)

![Alerts with explanation](docs/screenshots/alerts.png)

![Timeline](docs/screenshots/timeline.png)

<img src="docs/screenshots/mobile.png" alt="Mobile layout" width="280">

Built on the rules from my [SOC Detection Lab](../soc-detection-lab) (Python + Sigma + SPL), ported to TypeScript.

### Features

- Load the bundled invented samples in one click, or drop in your own `.json`, `.jsonl`, `.log` or `.txt` (max 25 MB).
- Format auto-detection (see Supported formats below). If a file yields no recognised events, LogLens lists the supported formats and shows the first lines it saw instead of crashing.
- Parsing and detection run in a Web Worker, with a progress bar for files over 2 MB and a timeout.
- Summary bar, sortable/filterable alert list (keyboard navigable), alert detail with plain-language explanation, ATT&CK link, next steps, highlighted matched fields, parent-process context, matched raw lines and the surrounding +/-5 events.
- Timeline with per-rule lanes (click a mark to open the alert), virtualised raw event view with search (`text` or `field:value`, e.g. `Image:powershell.exe`).
- Triage: new / investigating / closed (benign) / escalated. Closing or escalating requires a note. Decisions are stored in `localStorage` keyed by a hash of the file content, so reloading the same file restores them. Never stored anywhere else.
- "Tune this rule": see the rule's allowlist and add a session-only exclusion (not saved) to practise cutting false positives.
- Markdown report export (preview, copy, download) with summary, alerts, triage decisions, notes and rule versions.

### Rules and ATT&CK mapping

| Rule | ATT&CK | Default severity | Built-in allowlist |
| --- | --- | --- | --- |
| PowerShell Encoded Command (`-enc`, `-ec`, `-EncodedCommand` and prefixes, base64 value required) | T1059.001 | medium; high if the decoded payload has IEX / Invoke-Expression / DownloadString / DownloadFile / Net.WebClient / FromBase64String, or the window is hidden (`-w hidden`) | parents `CcmExec.exe`, `AgentExecutor.exe`, Intune agent; Azure guest agent (`WaAppAgent.exe`, `WindowsAzureGuestAgent.exe` under `C:\WindowsAzure\` or `C:\Packages\`); Microsoft Monitoring Agent (`HealthService.exe`, `MonitoringHost.exe` under its Program Files folder) |
| PowerShell download-and-execute cradle, no `-enc` (IEX/Invoke-Expression with DownloadString/DownloadFile/Net.WebClient/Invoke-WebRequest/iwr, or hidden window + `-NoProfile` + a URL) | T1059.001 | medium; high if launched by Office, a browser or a script host | same agent parents as above. A plain `Invoke-WebRequest` download with nothing executing it does not alert |
| Suspicious LSASS Memory Access (Sysmon 10, dump-capable access masks) | T1003.001 | high | Windows (`svchost`, `csrss`, `wininit`, `lsm`, `wmiprvse`, `services`, `taskmgr`, `werfault`) and common security software (Defender, CrowdStrike, SentinelOne, Carbon Black, Cylance, Sophos, Trellix/McAfee, Symantec, Tanium, Bitdefender), **only when the file is under** `C:\Program Files\`, `C:\Program Files (x86)\`, `C:\Windows\System32\` or `C:\ProgramData\Microsoft\Windows Defender\`. The same file name in a user-writable folder still alerts |
| LSASS dump via `comsvcs.dll` MiniDump (also `#24`) | T1003.001 | high | none |
| Scheduled task created via `schtasks /create` | T1053.005 | low for a plain create; medium with one risk signal; high with two or more. Signals: `/ru SYSTEM`, task target under `\Users\`, `\AppData\`, `\Temp\`, `\ProgramData\` or `\Public\`, parent is Office, a browser or a script host. `cmd.exe`/`powershell.exe`/`explorer.exe` as parent is not a signal | parents `CcmExec.exe`, `msiexec.exe`, `TrustedInstaller.exe` |
| Registry Run / RunOnce key persistence (Sysmon 13; high if script host or user-writable path) | T1547.001 | medium / high | values under `C:\Program Files*\` when not otherwise risky |
| SSH brute force: 5+ failed logins from one source within 120 s; critical if followed by a success from the same source | T1110 | medium / critical | none by default |

Each rule carries an id, version, explanation, a 3 to 5 sentence "Why does this matter?", next steps and its allowlist. Five of the Sysmon rules are ported from the lab; the download-cradle rule, the severity tiers, the allowlists for PowerShell, schtasks, LSASS and Run keys, the `#24` variant and the SSH rule are additions. **The allowlists are examples, not a vetted list: tune them to your environment** (an attacker who can write under Program Files, or who runs as a trusted parent, is not caught by name-and-path matching). Sigma/SPL originals live in the lab repo.

### Privacy model and how to verify it

- No network requests are made while analysing. The only outbound link is the ATT&CK page, and only if you click it.
- Log content is rendered as text only. There is no `dangerouslySetInnerHTML` (ESLint forbids it and a test scans the source).
- `public/_headers` (Netlify) sets a strict CSP (`default-src 'self'`, `connect-src 'none'`, no inline script or style, no third-party origins), `X-Content-Type-Options: nosniff` and `Referrer-Policy: no-referrer`. The display font (Syne) is self-hosted through `@fontsource`, so there are no font requests to Google.
- Triage state lives in your browser's `localStorage` only.

Verify it yourself: open DevTools, go to the **Network** tab, clear it, then load a file or the sample. You should see no requests after the page assets. You can also open **Application > Local storage** to see the `loglens:triage:v1:<hash>` entry and delete it any time.

The test suite also fails if `fetch`, XHR, `sendBeacon`, WebSocket or EventSource is called during analysis or the UI flow.

Defensive limits: 25 MB file cap, 64 KB per line (longer lines are skipped and counted), 250,000 events, 500 alerts per rule, 45 s worker timeout. All regexes are anchored and linear-time, and there is a test with pathological input.

### Supported formats

Each can be JSON lines (one object per line) or a single JSON array. LogLens detects the format per record.

- **Sysmon JSON, flat**: `EventCode` (also `EventID`, `event_id`, `event.code`; number or string) plus the Sysmon fields as top-level keys (`Image`, `CommandLine`, `ParentImage`, `SourceImage`, `TargetImage`, `GrantedAccess`, `TargetObject`, `Details`, `UtcTime`, `Computer`, `User`). A one-level `Event`/`EventData` wrapper is flattened.
- **Winlogbeat / ECS Sysmon JSON**: `winlog.event_id`, `winlog.event_data.*`, `host.name` or `winlog.computer_name`, `@timestamp` (zone offsets are honoured), `winlog.user.name`; also accepted as flattened dotted keys. `process.executable`, `process.command_line` and `process.parent.executable` are used as fallbacks.
- **`Get-WinEvent | ConvertTo-Json`**: `Id`, `MachineName`, `TimeCreated` and a `Message` whose `Key: value` lines (Sysmon layouts for events 1, 10 and 13) are parsed into the same fields. A bare `Id` is only trusted when the record also has a `Message`, `MachineName` or `ProviderName`.
- **Linux `auth.log`**: sshd and sudo lines, syslog or RFC 3339 timestamps.

Only Sysmon event ids 1, 10 and 13 are used by the rules; other event ids are parsed and shown but never alert.

### Limitations

- Rules are heuristics validated on invented sample data only. Real environments will produce false positives and false negatives. Tune the rules before trusting them anywhere.
- Inputs are limited to the formats listed under Supported formats. No binary `.evtx` (export it to JSON first), no Windows Security-log detections, no non-Sysmon sources (Zeek, firewall, cloud logs), no syslog programs beyond sshd and sudo.
- Allowlists (security software, Azure/monitoring agents, deployment agents) are examples. They will not match every environment and must be tuned before you trust the output.
- The download-cradle rule matches command-line text only. Obfuscated or split-up cradles, and scripts that fetch code from inside a `.ps1` file, are not seen.
- Traditional syslog lines carry no year or time zone: LogLens assumes the current year (or Dec to Jan rollover) and treats times as UTC.
- Sysmon parent-process context is matched by image path within the file; there is no ProcessGuid tracking.
- Brute-force detection is per source address and uses a fixed 120 s window. A slow burn (for example 6 failures spread over 5 minutes) is deliberately not flagged, and distributed attacks (many sources, one account) are not detected.
- Whole file is held in memory. Very large files near the 25 MB cap are slow on low-end devices.
- Session exclusions are simple text or `field:value` matches and are not saved.
- Accessibility was built in (labels, roles, keyboard navigation, icon plus label for severity) but a Lighthouse score has not been measured yet.
- Not a replacement for a SIEM, EDR or an analyst.

### Sample data

All sample logs are invented: hosts (`WIN-LAB01`, `lab-ubuntu01`), users, and IP addresses from the documentation ranges 203.0.113.0/24 and 198.51.100.0/24. No employer data, no real incidents, no real personal data. This applies to both the analyzer samples and the academy's practice scenarios.

## Development

Requires Node 24 and npm 11.

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm test           # vitest
npm run lint       # eslint
```

Manual performance check (5 MB and 25 MB synthetic files): `PERF=1 npx vitest run tests/perf.test.ts --reporter=verbose`.

## Deployment

The production build is the static `dist/` folder (`npm run build`). **Pushing to GitHub does not, by itself, deploy anything to production.** Deployment happens through the configured Netlify workflow, which builds and publishes `dist/`; `public/_headers` is picked up automatically by Netlify for the security headers described above. If you fork or redeploy this project elsewhere, wire up your own build-and-publish step for `dist/` and carry over `_headers`.

## Tests

Vitest + Testing Library (jsdom): parser tests (valid, malformed, empty, huge line, mixed format, ECS and Get-WinEvent shapes), at least one true-positive and one false-positive test per rule (including the lab's original cases), regression tests for the false-positive/false-negative cases found with real inputs (`tests/accuracy.test.ts`), windowed brute-force tests at threshold-1, threshold and threshold+success (and a slow-burn test showing what is not flagged), a Markdown report snapshot, UI smoke tests (load sample, alerts appear, triage persists across reload, note required), the no-network test, and academy-specific tests covering content integrity, progress persistence, and routing.

## License

MIT, see [LICENSE](LICENSE).
