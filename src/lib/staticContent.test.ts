import { describe, expect, it } from 'vitest'
import { translations } from '../translations'
import { buildStaticSections, buildStructuredData, faqSection } from './staticContent'

const tr = translations.pl

describe('faqSection', () => {
  it('renders every question with its answer', () => {
    const html = faqSection(tr)

    expect(tr.faq.items.length).toBeGreaterThanOrEqual(5)
    for (const item of tr.faq.items) {
      expect(html).toContain(item.q)
    }
    expect(html).not.toContain('reveal')
  })

  it('adds scroll animation classes only for the live app', () => {
    expect(faqSection(tr, { animated: true })).toContain('faq-item reveal')
  })
})

describe('buildStaticSections', () => {
  const html = buildStaticSections({
    tr,
    projects: [
      { title: 'Apartament w Centrum', location: 'Białystok', slug: 'apartament-bialystok' },
      { title: '<b>Hotel</b>', location: null, slug: 'hotel esperanto' },
    ],
    bio: [],
  })

  it('states where the photographer works and how to reach her', () => {
    expect(html).toContain('Białystok · Warszawa · Ełk')
    expect(html).toContain('tel:+48511017427')
    expect(html).toContain('mailto:anna@kuczewska.com')
  })

  it('lists the projects as links', () => {
    expect(html).toContain('<a href="#project/apartament-bialystok">Apartament w Centrum</a> — Białystok')
    expect(html).toContain('#project/hotel%20esperanto')
  })

  it('escapes CMS text', () => {
    expect(html).not.toContain('<b>Hotel</b>')
    expect(html).toContain('&lt;b&gt;Hotel&lt;/b&gt;')
  })

  it('falls back to the built-in bio when the CMS has none', () => {
    expect(html).toContain(tr.about.bio[0])
  })

  it('never hides text behind scroll animations', () => {
    expect(html).not.toContain('reveal')
  })
})

describe('buildStructuredData', () => {
  const scripts = buildStructuredData({ tr, imageUrl: 'https://cdn.sanity.io/x.jpg' })
  const blocks = scripts
    .split('</script>')
    .filter((part) => part.includes('{'))
    .map((part) => JSON.parse(part.slice(part.indexOf('{'))))

  it('describes the business with its service area and contact details', () => {
    const business = blocks[0]

    expect(business['@type']).toBe('ProfessionalService')
    expect(business.areaServed.map((city: any) => city.name)).toEqual(['Białystok', 'Warszawa', 'Ełk'])
    expect(business.telephone).toBe('+48511017427')
    expect(business.hasOfferCatalog.itemListElement.length).toBe(tr.services.length)
  })

  it('publishes the FAQ exactly as shown on the page', () => {
    const faq = blocks[1]

    expect(faq['@type']).toBe('FAQPage')
    expect(faq.mainEntity.map((q: any) => q.name)).toEqual(tr.faq.items.map((item: any) => item.q))
  })

  it('cannot break out of the script element', () => {
    const risky = { ...tr, faq: { title: 'x', items: [{ q: '</script><b>', a: 'a' }] } }

    expect(buildStructuredData({ tr: risky, imageUrl: null })).not.toContain('</script><b>')
  })
})
