import { getAuth } from 'firebase-admin/auth'

export type ClientAccount = {
  uid: string
  isNew: boolean
}

/**
 * Impure (Admin SDK) — intentionally not unit tested, same exception as
 * other Admin SDK/network boundaries in this codebase.
 */
export async function getOrCreateClientAccount(email: string, name: string): Promise<ClientAccount> {
  const auth = getAuth()
  try {
    const existing = await auth.getUserByEmail(email)
    return { uid: existing.uid, isNew: false }
  } catch {
    const created = await auth.createUser({ email, displayName: name })
    return { uid: created.uid, isNew: true }
  }
}
