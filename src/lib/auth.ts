import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase'

export class AuthError extends Error {}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password)
    return credential.user
  } catch {
    throw new AuthError('Nieprawidłowy e-mail lub hasło.')
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth())
}

export function getCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    let unsubscribe: (() => void) | undefined
    let settled = false
    const stop = onAuthStateChanged(getFirebaseAuth(), (user) => {
      settled = true
      resolve(user)
      unsubscribe?.()
    })
    unsubscribe = stop
    if (settled) {
      stop()
    }
  })
}

export async function isAdmin(user: User): Promise<boolean> {
  const tokenResult = await user.getIdTokenResult()
  return tokenResult.claims.admin === true
}
