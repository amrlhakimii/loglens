import { describe, expect, it } from 'vitest'
import { DEFAULT_CONTEXT, detect } from '../src/engine'
import { RULES, RULES_BY_ID } from '../src/rules'
import { decodePowerShell, findEncodedFlag } from '../src/rules/powershellEncoded'
import { findingsFor, sysmonEvent } from './helpers'

const hit = (id: string, fields: Record<string, string>) => RULES_BY_ID[id].match(sysmonEvent(fields), DEFAULT_CONTEXT)
const ENC = 'VwByAGkAdABlAC0ASABvAHMAdAAgACcAbABhAGIAIAB0AGUAcwB0ACcA'
const PS = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'

describe('powershell-encoded-command', () => {
  it('true positive: -enc with a base64 payload, and decodes it', () => {
    expect(hit('powershell-encoded-command', { Image: PS, CommandLine: `powershell.exe -NoP -enc ${ENC}` })).toBe(true)
    expect(decodePowerShell(ENC)).toBe("Write-Host 'lab test'")
  })
  it('true positive: -EncodedCommand and -ec spellings', () => {
    expect(hit('powershell-encoded-command', { Image: PS, CommandLine: `powershell -EncodedCommand ${ENC}` })).toBe(true)
    expect(hit('powershell-encoded-command', { Image: PS, CommandLine: `powershell -ec ${ENC}` })).toBe(true)
  })
  it('false positive: ordinary flags and -Encoding are not encoded commands', () => {
    expect(hit('powershell-encoded-command', { Image: PS, CommandLine: 'powershell.exe -ExecutionPolicy Bypass -File C:\\x\\run.ps1' })).toBe(false)
    expect(hit('powershell-encoded-command', { Image: PS, CommandLine: 'powershell.exe Get-Content a.txt -Encoding UTF8' })).toBe(false)
  })
  it('false positive: -enc on a non-PowerShell image', () => {
    expect(hit('powershell-encoded-command', { Image: 'C:\\tools\\app.exe', CommandLine: `app.exe -enc ${ENC}` })).toBe(false)
  })
  it('false positive: allowlisted management agent parent', () => {
    expect(hit('powershell-encoded-command', { Image: PS, ParentImage: 'C:\\Windows\\CCM\\CcmExec.exe', CommandLine: `powershell.exe -enc ${ENC}` })).toBe(false)
  })
  it('finds the flag even after another flag', () => {
    expect(findEncodedFlag(`powershell -NoP -W Hidden -enc ${ENC}`)?.value).toBe(ENC)
  })
  it('returns empty text for an undecodable payload', () => {
    expect(decodePowerShell('!!!not base64')).toBe('')
  })
})

describe('lsass-memory-access', () => {
  const base = { EventCode: '10', TargetImage: 'C:\\Windows\\System32\\lsass.exe' }
  it('true positive: unknown source with a dump-capable mask', () => {
    expect(hit('lsass-memory-access', { ...base, SourceImage: 'C:\\Users\\labuser\\AppData\\Local\\Temp\\dumper.exe', GrantedAccess: '0x1fffff' })).toBe(true)
  })
  it('false positive: allowlisted source (svchost)', () => {
    expect(hit('lsass-memory-access', { ...base, SourceImage: 'C:\\Windows\\System32\\svchost.exe', GrantedAccess: '0x1410' })).toBe(false)
  })
  it('false positive: unknown source but a harmless access mask', () => {
    expect(hit('lsass-memory-access', { ...base, SourceImage: 'C:\\tools\\x.exe', GrantedAccess: '0x1000' })).toBe(false)
  })
  it('false positive: a different target process', () => {
    expect(hit('lsass-memory-access', { EventCode: '10', TargetImage: 'C:\\Windows\\notepad.exe', SourceImage: 'C:\\x.exe', GrantedAccess: '0x1fffff' })).toBe(false)
  })
})

describe('comsvcs-minidump', () => {
  it('true positive: rundll32 comsvcs.dll MiniDump', () => {
    expect(hit('comsvcs-minidump', { Image: 'C:\\Windows\\System32\\rundll32.exe', CommandLine: 'rundll32.exe C:\\windows\\System32\\comsvcs.dll, MiniDump 624 C:\\Temp\\out.dmp full' })).toBe(true)
  })
  it('true positive: ordinal #24 spelling', () => {
    expect(hit('comsvcs-minidump', { CommandLine: 'rundll32 comsvcs.dll,#24 624 c:\\o.dmp full' })).toBe(true)
  })
  it('false positive: comsvcs without MiniDump', () => {
    expect(hit('comsvcs-minidump', { CommandLine: 'regsvr32 /s comsvcs.dll' })).toBe(false)
  })
  it('false positive: the word minidump without comsvcs', () => {
    expect(hit('comsvcs-minidump', { CommandLine: 'notepad.exe C:\\minidump-notes.txt' })).toBe(false)
  })
})

describe('schtasks-create', () => {
  const img = { Image: 'C:\\Windows\\System32\\schtasks.exe' }
  it('true positive: create as SYSTEM from a public path is high', () => {
    const e = sysmonEvent({ ...img, ParentImage: 'C:\\Windows\\System32\\cmd.exe', CommandLine: 'schtasks /create /tn Updater /tr C:\\Users\\Public\\run.exe /sc minute /mo 5 /ru SYSTEM' })
    const r = detect([e]).findings
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('high')
  })
  it('true positive: plain create is low (still listed). Was medium before 1.1.0', () => {
    const e = sysmonEvent({ ...img, ParentImage: 'C:\\Windows\\explorer.exe', CommandLine: 'schtasks /create /tn Backup /tr "C:\\Program Files\\App\\b.exe" /sc daily' })
    const r = detect([e]).findings
    expect(r[0].severity).toBe('low')
  })
  const sev = (parent: string, cmd: string) => detect([sysmonEvent({ ...img, ParentImage: parent, CommandLine: cmd })]).findings[0]?.severity
  it('interactive shells and explorer as parent are not risk signals', () => {
    for (const p of ['cmd.exe', 'powershell.exe', 'pwsh.exe']) expect(sev(`C:\\Windows\\System32\\${p}`, 'schtasks /create /tn X /tr D:\\s\\b.cmd /sc daily')).toBe('low')
  })
  it('one signal is medium: SYSTEM, writable target, or Office/browser/script-host parent', () => {
    expect(sev('C:\\Windows\\System32\\cmd.exe', 'schtasks /create /tn X /tr D:\\s\\b.cmd /sc daily /ru SYSTEM')).toBe('medium')
    expect(sev('C:\\Windows\\System32\\cmd.exe', 'schtasks /create /tn X /tr C:\\Users\\bob\\AppData\\r.exe /sc daily')).toBe('medium')
    expect(sev('C:\\ProgramData\\x.exe', 'schtasks /create /tn X /tr C:\\ProgramData\\r.exe /sc daily')).toBe('medium')
    expect(sev('C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE', 'schtasks /create /tn X /tr D:\\s\\b.cmd /sc daily')).toBe('medium')
    expect(sev('C:\\Windows\\System32\\wscript.exe', 'schtasks /create /tn X /tr D:\\s\\b.cmd /sc daily')).toBe('medium')
  })
  it('two or more signals are high', () => {
    expect(sev('C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE', 'schtasks /create /tn X /tr C:\\Users\\Public\\r.exe /sc daily /ru "NT AUTHORITY\\SYSTEM"')).toBe('high')
  })
  it('false positive: query is not a create', () => {
    expect(hit('schtasks-create', { ...img, CommandLine: 'schtasks /query /fo LIST' })).toBe(false)
  })
  it('false positive: allowlisted installer parent', () => {
    expect(hit('schtasks-create', { ...img, ParentImage: 'C:\\Windows\\System32\\msiexec.exe', CommandLine: 'schtasks /create /tn Updater /tr x.exe' })).toBe(false)
  })
})

describe('registry-run-key', () => {
  const key = 'HKU\\S-1-5-21-1\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater'
  it('true positive: Run key launching powershell from AppData is high', () => {
    const r = detect([sysmonEvent({ EventCode: '13', TargetObject: key, Details: 'powershell.exe -w hidden C:\\Users\\labuser\\AppData\\Roaming\\u.ps1' })]).findings
    expect(r).toHaveLength(1)
    expect(r[0].severity).toBe('high')
  })
  it('true positive: RunOnce with an unusual path is medium', () => {
    const r = detect([sysmonEvent({ EventCode: '13', TargetObject: key.replace('\\Run\\', '\\RunOnce\\'), Details: 'D:\\tools\\sync.exe' })]).findings
    expect(r[0].severity).toBe('medium')
  })
  it('false positive: unrelated registry write (ported from the lab)', () => {
    expect(hit('registry-run-key', { EventCode: '13', TargetObject: 'HKU\\S-1\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\Start_TrackProgs', Details: 'DWORD (0x00000001)' })).toBe(false)
  })
  it('false positive: ordinary Program Files autostart', () => {
    expect(hit('registry-run-key', { EventCode: '13', TargetObject: key, Details: '"C:\\Program Files\\Vendor\\tray.exe" --minimized' })).toBe(false)
  })
  it('allowlist does not hide a risky value in Program Files', () => {
    expect(hit('registry-run-key', { EventCode: '13', TargetObject: key, Details: 'C:\\Program Files\\x.exe && powershell -c iex' })).toBe(true)
  })
})

describe('registry and lab sample', () => {
  it('every rule has an id, version, ATT&CK id, next steps and a 3-5 sentence explanation', () => {
    for (const r of RULES) {
      expect(r.id && r.version && r.attack.id).toBeTruthy()
      expect(r.nextSteps.length).toBeGreaterThan(0)
      const sentences = r.whyItMatters.split(/(?<=[.!?])\s+/).length
      expect(sentences, r.id).toBeGreaterThanOrEqual(3)
      expect(sentences, r.id).toBeLessThanOrEqual(5)
    }
  })

  it('finds exactly the five lab detections in the sysmon sample', () => {
    const f = findingsFor('sysmon')
    expect(f).toHaveLength(5)
    expect(f.map((x) => x.ruleId).sort()).toEqual(['comsvcs-minidump', 'lsass-memory-access', 'powershell-encoded-command', 'registry-run-key', 'schtasks-create'])
    expect(f.find((x) => x.ruleId === 'powershell-encoded-command')?.detail).toContain("Write-Host 'lab test'")
    expect(f.find((x) => x.ruleId === 'lsass-memory-access')?.summary).toContain('dumper.exe')
    expect(f.find((x) => x.ruleId === 'schtasks-create')?.severity).toBe('high')
    expect(f.find((x) => x.ruleId === 'registry-run-key')?.severity).toBe('high')
  })

  it('finds 5 sysmon alerts and 1 auth alert in the combined sample', () => {
    const f = findingsFor('all')
    expect(f.filter((x) => x.ruleId !== 'ssh-brute-force')).toHaveLength(5)
    const ssh = f.filter((x) => x.ruleId === 'ssh-brute-force')
    expect(ssh).toHaveLength(1)
    expect(ssh[0].severity).toBe('critical')
  })
})
