import { describe, expect, it } from 'vitest'
import { formatGrosze, sumOfferLines } from './pricing.js'

describe('sumOfferLines', () => {
  it('sums the price of all lines', () => {
    expect(
      sumOfferLines([
        { packageId: 'p1', name: 'A', priceGrosze: 80000 },
        { packageId: 'p2', name: 'B', priceGrosze: 150000 },
      ]),
    ).toBe(230000)
  })

  it('returns 0 for an empty list', () => {
    expect(sumOfferLines([])).toBe(0)
  })
})

describe('formatGrosze', () => {
  it('formats whole złoty amounts with two decimal places and a comma', () => {
    expect(formatGrosze(80000)).toBe('800,00 zł')
  })

  it('formats fractional grosze correctly', () => {
    expect(formatGrosze(150050)).toBe('1500,50 zł')
  })

  it('formats zero', () => {
    expect(formatGrosze(0)).toBe('0,00 zł')
  })
})
