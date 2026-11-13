import { describe, expect, it } from 'vitest'
import { localizedTitle, translateTitle } from './titleTranslation'

describe('translateTitle', () => {
  it('leaves Polish titles untouched for Polish visitors', () => {
    expect(translateTitle('Apartament w Centrum', 'pl')).toBe('Apartament w Centrum')
  })

  it('translates the kind of property and common phrases', () => {
    expect(translateTitle('Apartament w Centrum', 'en')).toBe('Apartment in the City Centre')
    expect(translateTitle('Apartament w Centrum', 'es')).toBe('Apartamento en el Centro')
    expect(translateTitle('Rezydencja nad Jeziorem', 'en')).toBe('Residence by the Lake')
    expect(translateTitle('Mieszkanie, Białystok', 'es')).toBe('Piso, Białystok')
  })

  it('keeps proper names exactly as written', () => {
    expect(translateTitle('Apartament Kocia Wyspa, Półwysep Kal', 'en')).toBe('Apartment Kocia Wyspa, Półwysep Kal')
    expect(translateTitle('Hotel Esperanto', 'es')).toBe('Hotel Esperanto')
    expect(translateTitle('KARO brow bar & beauty', 'en')).toBe('KARO brow bar & beauty')
  })

  it('never translates inside a longer word, such as a street name', () => {
    expect(translateTitle('Mieszkanie przy Domaniewskiej', 'en')).toBe('Flat przy Domaniewskiej')
    expect(translateTitle('Dom na Apartamentowej 5', 'en')).toBe('House na Apartamentowej 5')
  })

  it('follows the capitalisation of the original word', () => {
    expect(translateTitle('Nowoczesny apartament', 'en')).toBe('Nowoczesny apartment')
    expect(translateTitle('Lokal usługowy Karo', 'en')).toBe('Commercial space Karo')
  })
})

describe('localizedTitle', () => {
  it('prefers a translation entered in the CMS', () => {
    const item = { title: 'Apartament w Centrum', title_en: 'Downtown Apartment' }

    expect(localizedTitle(item, 'en')).toBe('Downtown Apartment')
    expect(localizedTitle(item, 'es')).toBe('Apartamento en el Centro')
    expect(localizedTitle(item, 'pl')).toBe('Apartament w Centrum')
  })
})
