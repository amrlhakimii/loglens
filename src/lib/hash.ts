/** Content hash used only to key local triage state. SHA-256 when available, FNV-1a otherwise. */
export async function hashBuffer(buf: ArrayBuffer): Promise<string> {
  try {
    if (globalThis.crypto?.subtle) {
      const digest = await globalThis.crypto.subtle.digest('SHA-256', buf)
      return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
    }
  } catch {
    /* fall through */
  }
  const bytes = new Uint8Array(buf)
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < bytes.length; i++) {
    h1 = Math.imul(h1 ^ bytes[i], 0x01000193) >>> 0
    h2 = Math.imul(h2 + bytes[i], 0x85ebca6b) >>> 0
  }
  return 'f' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}
