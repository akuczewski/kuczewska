import { describe, expect, it } from 'vitest'
import { heroSrc, heroSrcset, isLandscape, pickHeroUrl } from './heroImage'

const portrait = 'https://cdn.sanity.io/images/p/production/aaa-3768x5644.jpg'
const landscape = 'https://cdn.sanity.io/images/p/production/bbb-2048x1367.jpg'

describe('isLandscape', () => {
  it('reads the orientation from the Sanity file name', () => {
    expect(isLandscape(landscape)).toBe(true)
    expect(isLandscape(portrait)).toBe(false)
    expect(isLandscape('/hero.png')).toBe(false)
    expect(isLandscape(null)).toBe(false)
  })
})

describe('pickHeroUrl', () => {
  it('prefers the hero set in the CMS', () => {
    expect(pickHeroUrl('https://cdn.sanity.io/x-10x5.jpg', [{ imageUrl: landscape }])).toBe(
      'https://cdn.sanity.io/x-10x5.jpg',
    )
  })

  it('otherwise takes the first landscape cover', () => {
    expect(pickHeroUrl(null, [{ imageUrl: portrait }, { imageUrl: landscape }])).toBe(landscape)
  })

  it('falls back to the first cover, or nothing', () => {
    expect(pickHeroUrl(undefined, [{ imageUrl: portrait }])).toBe(portrait)
    expect(pickHeroUrl(undefined, [{ imageUrl: null }, {}])).toBeNull()
  })
})

describe('hero sources', () => {
  it('offers several widths for CMS images', () => {
    const srcset = heroSrcset(landscape)

    expect(srcset.split(', ')).toHaveLength(4)
    expect(srcset).toContain(`${landscape}?auto=format&q=70&w=640 640w`)
    expect(heroSrc(landscape)).toBe(`${landscape}?auto=format&q=70&w=1280`)
  })

  it('leaves local fallback images alone', () => {
    expect(heroSrcset('/hero.png')).toBe('')
    expect(heroSrc('/hero.png')).toBe('/hero.png')
  })
})
