import { describe, expect, it } from 'vitest'
import { wrapText } from './textWrap.js'

describe('wrapText', () => {
  it('keeps a short line as a single element', () => {
    expect(wrapText('Krótki tekst', 80)).toEqual(['Krótki tekst'])
  })

  it('wraps long text into multiple lines not exceeding the limit', () => {
    const text = 'To jest dość długi akapit tekstu który powinien zostać podzielony na kilka linii.'
    const lines = wrapText(text, 20)

    expect(lines.length).toBeGreaterThan(1)
    for (const line of lines) {
      expect(line.length).toBeLessThanOrEqual(20)
    }
  })

  it('preserves word order when lines are joined back together', () => {
    const text = 'jeden dwa trzy cztery pięć sześć siedem osiem'
    const lines = wrapText(text, 12)

    expect(lines.join(' ')).toBe(text)
  })

  it('returns an empty array for empty input', () => {
    expect(wrapText('', 20)).toEqual([])
  })
})
