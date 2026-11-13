import { randomBytes } from 'node:crypto'

export function generatePublicToken(): string {
  return randomBytes(24).toString('hex')
}

export function isValidToken(
  provided: string | undefined | null,
  stored: string | undefined | null,
): boolean {
  return (
    typeof provided === 'string' &&
    provided.length > 0 &&
    typeof stored === 'string' &&
    stored.length > 0 &&
    provided === stored
  )
}
