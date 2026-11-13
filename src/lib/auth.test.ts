import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuthInstance = { __brand: 'auth' }

vi.mock('./firebase', () => ({
  getFirebaseAuth: () => mockAuthInstance,
}))

const signInWithEmailAndPassword = vi.fn()
const signOut = vi.fn()
const onAuthStateChanged = vi.fn()

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: (...args: unknown[]) => signInWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => signOut(...args),
  onAuthStateChanged: (...args: unknown[]) => onAuthStateChanged(...args),
}))

const { signIn, signOutUser, getCurrentUser, isAdmin, AuthError } = await import('./auth')

describe('signIn', () => {
  beforeEach(() => {
    signInWithEmailAndPassword.mockReset()
  })

  it('returns the signed-in user on success', async () => {
    const fakeUser = { uid: 'client-1' }
    signInWithEmailAndPassword.mockResolvedValue({ user: fakeUser })

    const user = await signIn('client@example.com', 'secret123')

    expect(user).toBe(fakeUser)
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      mockAuthInstance,
      'client@example.com',
      'secret123',
    )
  })

  it('throws a friendly AuthError on invalid credentials', async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error('auth/wrong-password'))

    await expect(signIn('client@example.com', 'wrong')).rejects.toBeInstanceOf(AuthError)
  })
})

describe('signOutUser', () => {
  it('delegates to firebase signOut', async () => {
    signOut.mockResolvedValue(undefined)
    await signOutUser()
    expect(signOut).toHaveBeenCalledWith(mockAuthInstance)
  })
})

describe('getCurrentUser', () => {
  it('resolves with the first auth state and unsubscribes', async () => {
    const fakeUser = { uid: 'client-1' }
    const unsubscribe = vi.fn()
    onAuthStateChanged.mockImplementation((_auth: unknown, callback: (u: unknown) => void) => {
      callback(fakeUser)
      return unsubscribe
    })

    const user = await getCurrentUser()

    expect(user).toBe(fakeUser)
    expect(unsubscribe).toHaveBeenCalled()
  })
})

describe('isAdmin', () => {
  it('returns true when the admin custom claim is set', async () => {
    const user = {
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: { admin: true } }),
    } as any

    await expect(isAdmin(user)).resolves.toBe(true)
  })

  it('returns false when the admin custom claim is missing', async () => {
    const user = {
      getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
    } as any

    await expect(isAdmin(user)).resolves.toBe(false)
  })
})
