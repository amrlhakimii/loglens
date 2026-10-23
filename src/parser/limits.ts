/** Defensive limits (PRD SR-4). All are enforced in the parser or the client. */
export const MAX_FILE_BYTES = 25 * 1024 * 1024
export const MAX_LINE_CHARS = 64 * 1024
export const MAX_EVENTS = 250_000
export const WORKER_TIMEOUT_MS = 45_000
export const PROGRESS_BAR_MIN_BYTES = 2 * 1024 * 1024
/** Findings with many matching lines only keep this many ids. */
export const MAX_FINDING_EVENTS = 500
