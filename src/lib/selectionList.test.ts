import { describe, expect, it } from 'vitest'
import { buildSelectionList, photoDisplayName, sortPhotosByName, stripExtension } from './selectionList'

describe('photoDisplayName', () => {
  it('prefers the original file name', () => {
    expect(photoDisplayName({ id: 'p1', storagePath: 'sessions/s/raw/uuid.jpg', originalName: 'DSC_0412.jpg' })).toBe(
      'DSC_0412.jpg',
    )
  })

  it('falls back to the stored file name for photos uploaded before names were recorded', () => {
    expect(photoDisplayName({ id: 'p1', storagePath: 'sessions/s/raw/uuid.jpg' })).toBe('uuid.jpg')
    expect(photoDisplayName({ id: 'p1' })).toBe('p1')
  })
})

describe('stripExtension', () => {
  it('removes only the last extension', () => {
    expect(stripExtension('DSC_0412.jpg')).toBe('DSC_0412')
    expect(stripExtension('salon.v2.jpeg')).toBe('salon.v2')
    expect(stripExtension('bez-rozszerzenia')).toBe('bez-rozszerzenia')
  })
})

describe('sortPhotosByName', () => {
  it('orders numbered files naturally, like a file browser', () => {
    const sorted = sortPhotosByName([
      { id: 'a', originalName: 'DSC_10.jpg' },
      { id: 'b', originalName: 'DSC_2.jpg' },
      { id: 'c', originalName: 'DSC_1.jpg' },
    ])

    expect(sorted.map((p) => p.originalName)).toEqual(['DSC_1.jpg', 'DSC_2.jpg', 'DSC_10.jpg'])
  })
})

describe('buildSelectionList', () => {
  it('gives one name per line and a single-line query without extensions', () => {
    const list = buildSelectionList([
      { id: 'b', originalName: 'DSC_0420.jpg' },
      { id: 'a', originalName: 'DSC_0412.jpg' },
    ])

    expect(list.lines).toBe('DSC_0412.jpg\nDSC_0420.jpg')
    expect(list.searchQuery).toBe('DSC_0412 DSC_0420')
  })
})
