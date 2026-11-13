import { describe, expect, it } from 'vitest'
import {
  buildContractEmail,
  buildNewLeadEmail,
  buildOfferEmail,
  buildPasswordSetupEmail,
  buildSelectionSubmittedEmail,
} from './emailTemplates.js'

describe('buildOfferEmail', () => {
  it('includes the lead name and offer link', () => {
    const email = buildOfferEmail({ leadName: 'Jan Kowalski', offerUrl: 'https://kuczewska.com/#/offer/1?token=abc' })

    expect(email.subject).toContain('oferta')
    expect(email.html).toContain('Jan Kowalski')
    expect(email.html).toContain('https://kuczewska.com/#/offer/1?token=abc')
  })
})

describe('buildContractEmail', () => {
  it('includes the lead name and contract link', () => {
    const email = buildContractEmail({
      leadName: 'Jan Kowalski',
      contractUrl: 'https://kuczewska.com/#/contract/1?token=abc',
    })

    expect(email.subject.toLowerCase()).toContain('umow')
    expect(email.html).toContain('Jan Kowalski')
    expect(email.html).toContain('https://kuczewska.com/#/contract/1?token=abc')
  })
})

describe('buildPasswordSetupEmail', () => {
  it('includes the lead name and password reset link', () => {
    const email = buildPasswordSetupEmail({
      leadName: 'Jan Kowalski',
      resetLink: 'https://example.com/reset?oobCode=xyz',
    })

    expect(email.subject).toContain('konto')
    expect(email.html).toContain('Jan Kowalski')
    expect(email.html).toContain('https://example.com/reset?oobCode=xyz')
  })
})

describe('buildSelectionSubmittedEmail', () => {
  const base = {
    sessionTitle: 'Sesja Mokotów',
    clientEmail: 'jan@example.com',
    fileNames: ['DSC_0412.jpg', 'DSC_0420.jpg'],
    notes: [{ fileName: 'DSC_0420.jpg', note: 'Usunąć kabel przy lampie' }],
    selectionLimit: null,
    sessionUrl: 'https://kuczewska.com/#/admin/session/s1',
  }

  it('lists the picked file names, notes and a link to the session', () => {
    const email = buildSelectionSubmittedEmail(base)

    expect(email.subject).toContain('Sesja Mokotów')
    expect(email.html).toContain('DSC_0412.jpg\nDSC_0420.jpg')
    expect(email.html).toContain('Usunąć kabel przy lampie')
    expect(email.html).toContain('jan@example.com')
    expect(email.html).toContain('https://kuczewska.com/#/admin/session/s1')
  })

  it('says how many photos go beyond the package', () => {
    const email = buildSelectionSubmittedEmail({ ...base, selectionLimit: 1 })

    expect(email.html).toContain('z 1 w pakiecie')
    expect(email.html).toContain('1 ponad pakiet')
  })

  it('escapes text typed by the client', () => {
    const email = buildSelectionSubmittedEmail({
      ...base,
      notes: [{ fileName: 'a.jpg', note: '<img src=x onerror=alert(1)>' }],
    })

    expect(email.html).not.toContain('<img src=x')
    expect(email.html).toContain('&lt;img src=x')
  })
})

describe('buildNewLeadEmail', () => {
  const base = {
    name: 'Jan Kowalski',
    email: 'jan@example.com',
    phone: '500 600 700',
    message: 'Rodzaj nieruchomości: Dom\nMiejscowość: Ełk',
    leadUrl: 'https://kuczewska.com/#/admin/leads/lead-1',
  }

  it('gives the photographer the contact details, the message and a link to the lead', () => {
    const email = buildNewLeadEmail(base)

    expect(email.subject).toBe('Nowe zapytanie o sesję — Jan Kowalski')
    expect(email.html).toContain('mailto:jan@example.com')
    expect(email.html).toContain('tel:500 600 700')
    expect(email.html).toContain('Miejscowość: Ełk')
    expect(email.html).toContain('https://kuczewska.com/#/admin/leads/lead-1')
  })

  it('says so when no phone was given', () => {
    expect(buildNewLeadEmail({ ...base, phone: null }).html).toContain('nie podano')
  })

  it('escapes everything typed into the public form', () => {
    const email = buildNewLeadEmail({ ...base, name: '<b>x</b>', message: '<script>alert(1)</script>' })

    expect(email.html).not.toContain('<script>')
    expect(email.html).not.toContain('<b>x</b>')
  })
})
