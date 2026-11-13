import { describe, expect, it, vi } from 'vitest'
import { computeWatermarkPattern, drawWatermark } from './watermark'

function createFakeContext() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    fillText: vi.fn(),
    font: '',
    fillStyle: '',
    globalAlpha: 1,
    textAlign: 'start' as CanvasTextAlign,
  }
}

describe('computeWatermarkPattern', () => {
  it('covers the whole image with a regular grid of tiles, overscanning the edges', () => {
    const pattern = computeWatermarkPattern(1000, 800, 250)

    expect(pattern.tiles.length).toBeGreaterThan(6)
    for (const tile of pattern.tiles) {
      expect(tile.x).toBeGreaterThanOrEqual(-250)
      expect(tile.y).toBeGreaterThanOrEqual(-250)
      expect(tile.x).toBeLessThan(1000 + 250)
      expect(tile.y).toBeLessThan(800 + 250)
    }
  })

  it('rotates the watermark diagonally by -30 degrees', () => {
    const pattern = computeWatermarkPattern(1000, 800)
    expect(pattern.rotationRadians).toBeCloseTo(-Math.PI / 6, 5)
  })

  it('throws a RangeError for non-positive dimensions', () => {
    expect(() => computeWatermarkPattern(0, 100)).toThrow(RangeError)
    expect(() => computeWatermarkPattern(100, -5)).toThrow(RangeError)
  })
})

describe('drawWatermark', () => {
  it('draws the watermark text once per tile, rotated diagonally', () => {
    const ctx = createFakeContext()
    drawWatermark(ctx, 1000, 800, 'PODGLĄD')

    const pattern = computeWatermarkPattern(1000, 800)
    expect(ctx.fillText).toHaveBeenCalledTimes(pattern.tiles.length)
    expect(ctx.save).toHaveBeenCalledTimes(pattern.tiles.length)
    expect(ctx.restore).toHaveBeenCalledTimes(pattern.tiles.length)
    expect(ctx.rotate).toHaveBeenCalledWith(pattern.rotationRadians)

    for (const call of ctx.fillText.mock.calls) {
      expect(call[0]).toBe('PODGLĄD')
    }
  })

  it('sets a semi-transparent fill style so the watermark never fully hides the photo', () => {
    const ctx = createFakeContext()
    drawWatermark(ctx, 1000, 800)
    expect(ctx.fillStyle).toContain('rgba')
  })
})
