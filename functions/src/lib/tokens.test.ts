import { describe, expect, it } from 'vitest'
import { generatePublicToken, isValidToken } from './tokens.js'

describe('generatePublicToken', () => {
  it('generates a long random hex string', () => {
    const token = generatePublicToken()
    expect(token).toMatch(/^[0-9a-f]{48}$/)
  })

  it('generates a different token on each call', () => {
    expect(generatePublicToken()).not.toBe(generatePublicToken())
  })
})

describe('isValidToken', () => {
  it('returns true when the provided token matches the stored one', () => {
    expect(isValidToken('abc123', 'abc123')).toBe(true)
  })

  it('returns false when tokens differ', () => {
    expect(isValidToken('abc123', 'def456')).toBe(false)
  })

  it('returns false when either token is missing', () => {
    expect(isValidToken(undefined, 'abc123')).toBe(false)
    expect(isValidToken('abc123', null)).toBe(false)
    expect(isValidToken('', 'abc123')).toBe(false)
  })
})
