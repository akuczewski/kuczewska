import { describe, expect, it } from 'vitest'
import { buildContractPdfContent } from './contractPdf.js'

describe('buildContractPdfContent', () => {
  it('builds a title, per-line text, total and includes the terms text', () => {
    const content = buildContractPdfContent({
      leadName: 'Jan Kowalski',
      lines: [{ packageId: 'p1', name: 'Sesja mieszkanie', priceGrosze: 80000 }],
      totalPriceGrosze: 80000,
    })

    expect(content.title.toLowerCase()).toContain('umow')
    expect(content.leadName).toBe('Jan Kowalski')
    expect(content.lines).toEqual([{ text: 'Sesja mieszkanie — 800,00 zł' }])
    expect(content.totalLine).toContain('800,00 zł')
    expect(content.termsText.length).toBeGreaterThan(0)
  })
})
