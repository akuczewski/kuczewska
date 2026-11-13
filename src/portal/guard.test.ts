import { describe, expect, it, vi } from 'vitest'
import { requireClient } from './guard'

describe('requireClient', () => {
  it('calls onUnauthenticated and returns null when no user is signed in', async () => {
    const onUnauthenticated = vi.fn()

    const result = await requireClient(async () => null, onUnauthenticated)

    expect(result).toBeNull()
    expect(onUnauthenticated).toHaveBeenCalledOnce()
  })

  it('returns the user and does not call onUnauthenticated when signed in', async () => {
    const onUnauthenticated = vi.fn()
    const user = { uid: 'client-1' }

    const result = await requireClient(async () => user, onUnauthenticated)

    expect(result).toBe(user)
    expect(onUnauthenticated).not.toHaveBeenCalled()
  })
})
