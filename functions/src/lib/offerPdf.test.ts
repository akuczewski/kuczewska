import { describe, expect, it } from 'vitest'
import { buildOfferPdfContent } from './offerPdf.js'

describe('buildOfferPdfContent', () => {
  it('builds a title, per-line text, total and validity date', () => {
    const content = buildOfferPdfContent({
      leadName: 'Jan Kowalski',
      lines: [
        { packageId: 'p1', name: 'Sesja mieszkanie', priceGrosze: 80000 },
        { packageId: 'p2', name: 'Premium', priceGrosze: 150000 },
      ],
      totalPriceGrosze: 230000,
      validUntil: new Date('2026-08-15T00:00:00Z'),
    })

    expect(content.title).toContain('Oferta')
    expect(content.leadName).toBe('Jan Kowalski')
    expect(content.lines).toEqual([
      { text: 'Sesja mieszkanie — 800,00 zł' },
      { text: 'Premium — 1500,00 zł' },
    ])
    expect(content.totalLine).toBe('Razem: 2300,00 zł')
    expect(content.validUntilLine).toContain('15.08.2026')
  })
})
