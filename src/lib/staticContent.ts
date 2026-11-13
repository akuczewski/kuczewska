/**
 * Content that must be readable without running JavaScript.
 *
 * Search engines and most AI assistants' crawlers read the raw HTML only.
 * The home page is rendered by the app, so at build time (vite.config.ts) we
 * also write the same facts into index.html: what is offered, where, how
 * booking works, the FAQ, contact details and the list of projects — plus
 * schema.org data describing the business. The app replaces this markup with
 * the interactive page as soon as it starts.
 */

export const SITE_URL = 'https://kuczewska.com'
export const PHONE_E164 = '+48511017427'
export const PHONE_DISPLAY = '+48 511 017 427'
export const EMAIL = 'anna@kuczewska.com'
export const INSTAGRAM_URL = 'https://instagram.com/wnetrzanka'
export const SERVICE_CITIES = ['Białystok', 'Warszawa', 'Ełk']

export type FaqItem = { q: string; a: string }

export type StaticProject = {
  title: string
  location?: string | null
  slug: string
}

export function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ))
}

/** The FAQ block — used both by the app and by the static HTML. */
export function faqSection(tr: any, options: { animated?: boolean } = {}): string {
  const reveal = options.animated ? ' reveal' : ''
  const items: FaqItem[] = tr.faq.items
  return `
      <section id="faq" class="faq-section">
        <div class="container">
          <div class="section-head${reveal}">
            <h2>${esc(tr.faq.title)}</h2>
          </div>
          <div class="faq-list">
            ${items.map((item) => `
            <details class="faq-item${reveal}">
              <summary>${esc(item.q)}</summary>
              <p>${esc(item.a)}</p>
            </details>`).join('')}
          </div>
        </div>
      </section>`
}

/** Sections written into index.html below the hero, for readers without JavaScript. */
export function buildStaticSections(input: {
  tr: any
  projects: StaticProject[]
  bio: string[]
}): string {
  const { tr, projects } = input
  const bio = input.bio.length > 0 ? input.bio : (tr.about.bio as string[])
  const steps: Array<{ title: string; text: string }> = tr.process.steps
  const facts: Array<{ value: string; label: string }> = tr.facts

  return `
      <section class="static-facts">
        <div class="container">
          <ul>
            ${facts.map((fact) => `<li><strong>${esc(fact.value)}</strong> — ${esc(fact.label)}</li>`).join('')}
          </ul>
        </div>
      </section>

      <section id="portfolio" class="portfolio-section">
        <div class="container">
          <div class="section-head">
            <h2>${esc(tr.portfolio.title)}</h2>
            <p>${esc(tr.portfolio.subtitle)}</p>
          </div>
          <ul class="static-list">
            ${projects.map((project) => `<li><a href="#project/${encodeURIComponent(project.slug)}">${esc(project.title)}</a>${project.location ? ` — ${esc(project.location)}` : ''}</li>`).join('')}
          </ul>
        </div>
      </section>

      <section id="process" class="process-section">
        <div class="container">
          <div class="section-head">
            <h2>${esc(tr.process.title)}</h2>
            <p>${esc(tr.process.subtitle)}</p>
          </div>
          <ol class="steps">
            ${steps.map((step, i) => `
            <li>
              <span class="step-num" aria-hidden="true">${i + 1}</span>
              <h3>${esc(step.title)}</h3>
              <p>${esc(step.text)}</p>
            </li>`).join('')}
          </ol>
        </div>
      </section>
${faqSection(tr)}

      <section id="about" class="about-section">
        <div class="container">
          <div class="about-card">
            <h2>${esc(tr.about.title)}</h2>
            ${bio.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}
          </div>
        </div>
      </section>

      <section id="contact" class="contact-section">
        <div class="container">
          <div class="contact-info">
            <h2>${esc(tr.contact.title)}</h2>
            <p class="contact-lead">${esc(tr.contact.subtitle)}</p>
            <a class="contact-phone" href="tel:${PHONE_E164}">${PHONE_DISPLAY}</a>
            <a class="contact-mail" href="mailto:${EMAIL}">${EMAIL}</a>
            <a class="contact-mail" href="${INSTAGRAM_URL}">Instagram @wnetrzanka</a>
          </div>
        </div>
      </section>`
}

/** schema.org description of the business and its FAQ, as JSON-LD script tags. */
export function buildStructuredData(input: { tr: any; imageUrl: string | null }): string {
  const { tr } = input
  const faq: FaqItem[] = tr.faq.items
  const services: string[] = tr.services

  const business = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${SITE_URL}/#business`,
    name: 'Kuczewska Fotografia',
    alternateName: 'Anna Kuczewska — fotografia nieruchomości i wnętrz',
    description: tr.meta.description,
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo-kuczewska.png`,
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    telephone: PHONE_E164,
    email: EMAIL,
    address: { '@type': 'PostalAddress', addressCountry: 'PL' },
    areaServed: SERVICE_CITIES.map((city) => ({ '@type': 'City', name: city })),
    founder: {
      '@type': 'Person',
      name: 'Anna Kuczewska',
      jobTitle: 'Fotograf nieruchomości i wnętrz',
      sameAs: [INSTAGRAM_URL],
    },
    knowsLanguage: ['pl', 'en', 'es'],
    sameAs: [INSTAGRAM_URL],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Sesje zdjęciowe nieruchomości i wnętrz',
      itemListElement: services.map((service) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: service,
          areaServed: SERVICE_CITIES.map((city) => ({ '@type': 'City', name: city })),
        },
      })),
    },
    potentialAction: {
      '@type': 'ReserveAction',
      name: 'Umów sesję zdjęciową',
      target: `${SITE_URL}/#contact`,
    },
  }

  const faqPage = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  // "<" must not appear raw inside a script element.
  const toScript = (data: unknown) =>
    `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

  return `${toScript(business)}\n  ${toScript(faqPage)}`
}
