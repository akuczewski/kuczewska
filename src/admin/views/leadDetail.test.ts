import { describe, expect, it, vi } from 'vitest'
import { renderLeadDetailView } from './leadDetail'

const baseLead = {
  id: 'lead-1',
  name: 'Jan Kowalski',
  email: 'jan@example.com',
  phone: '600700800',
  message: 'Sesja domu',
  source: 'manual' as const,
  status: 'new' as const,
}

describe('renderLeadDetailView', () => {
  it('shows the lead status and contact info', () => {
    const container = document.createElement('div')

    renderLeadDetailView(container, {
      lead: baseLead,
      offers: [],
      contracts: [],
      bookings: [],
      onSaveContactInfo: vi.fn(),
      onArchive: vi.fn(),
      onCreateOffer: vi.fn(),
      onSendOffer: vi.fn(),
      onViewSession: vi.fn(),
    })

    expect(container.textContent).toContain('Jan Kowalski')
    expect(container.textContent).toContain('jan@example.com')
    expect(container.querySelector<HTMLInputElement>('input[name="phone"]')!.value).toBe('600700800')
    expect(container.querySelector<HTMLTextAreaElement>('textarea[name="message"]')!.value).toBe(
      'Sesja domu',
    )
  })

  it('shows a single overall "Zlecenie" stage computed from how far things have progressed', () => {
    const container = document.createElement('div')

    renderLeadDetailView(container, {
      lead: { ...baseLead, status: 'accepted' },
      offers: [
        {
          id: 'offer-1',
          leadId: 'lead-1',
          lines: [{ packageId: 'p1', name: 'Sesja mieszkanie', priceGrosze: 80000 }],
          totalPriceGrosze: 80000,
          status: 'accepted',
          publicToken: 'tok',
          pdfStoragePath: 'offers/offer-1.pdf',
        },
      ],
      contracts: [
        { id: 'contract-1', offerId: 'offer-1', leadId: 'lead-1', status: 'signed', pdfStoragePath: null },
      ],
      bookings: [{ date: '2026-09-01', sessionId: 'session-1', sessionStatus: 'selection_done' }],
      onSaveContactInfo: vi.fn(),
      onArchive: vi.fn(),
      onCreateOffer: vi.fn(),
      onSendOffer: vi.fn(),
      onViewSession: vi.fn(),
    })

    expect(container.querySelector('.lead-detail__overall-stage')!.textContent).toContain(
      'Klient wybiera zdjęcia',
    )
  })

  it('shows each stage with a status badge: offer, contract, booking/session', () => {
    const container = document.createElement('div')

    renderLeadDetailView(container, {
      lead: { ...baseLead, status: 'accepted' },
      offers: [
        {
          id: 'offer-1',
          leadId: 'lead-1',
          lines: [{ packageId: 'p1', name: 'Sesja mieszkanie', priceGrosze: 80000 }],
          totalPriceGrosze: 80000,
          status: 'accepted',
          publicToken: 'tok',
          pdfStoragePath: 'offers/offer-1.pdf',
        },
      ],
      contracts: [
        { id: 'contract-1', offerId: 'offer-1', leadId: 'lead-1', status: 'signed', pdfStoragePath: null },
      ],
      bookings: [{ date: '2026-09-01', sessionId: 'session-1', sessionStatus: 'raw' }],
      onSaveContactInfo: vi.fn(),
      onArchive: vi.fn(),
      onCreateOffer: vi.fn(),
      onSendOffer: vi.fn(),
      onViewSession: vi.fn(),
    })

    expect(container.textContent).toContain('800,00 zł')
    expect(container.textContent).toContain('Zaakceptowana')
    expect(container.textContent).toContain('Podpisana')
    expect(container.textContent).toContain('2026-09-01')
  })

  it('shows a "Wyślij" button only for draft offers, calling onSendOffer with the offer id', () => {
    const container = document.createElement('div')
    const onSendOffer = vi.fn()

    renderLeadDetailView(container, {
      lead: baseLead,
      offers: [
        {
          id: 'offer-draft',
          leadId: 'lead-1',
          lines: [],
          totalPriceGrosze: 0,
          status: 'draft',
          publicToken: null,
          pdfStoragePath: null,
        },
      ],
      contracts: [],
      bookings: [],
      onSaveContactInfo: vi.fn(),
      onArchive: vi.fn(),
      onCreateOffer: vi.fn(),
      onSendOffer,
      onViewSession: vi.fn(),
    })

    const sendBtn = container.querySelector<HTMLButtonElement>('[data-action="send-offer"]')!
    sendBtn.click()
    expect(onSendOffer).toHaveBeenCalledWith('offer-draft')
  })

  it('calls onSaveContactInfo with the edited phone and message', () => {
    const container = document.createElement('div')
    const onSaveContactInfo = vi.fn()

    renderLeadDetailView(container, {
      lead: baseLead,
      offers: [],
      contracts: [],
      bookings: [],
      onSaveContactInfo,
      onArchive: vi.fn(),
      onCreateOffer: vi.fn(),
      onSendOffer: vi.fn(),
      onViewSession: vi.fn(),
    })

    container.querySelector<HTMLInputElement>('input[name="phone"]')!.value = '111222333'
    container.querySelector<HTMLTextAreaElement>('textarea[name="message"]')!.value = 'Nowa wiadomość'
    container.querySelector<HTMLFormElement>('form.lead-detail__contact-form')!.dispatchEvent(
      new Event('submit', { cancelable: true }),
    )

    expect(onSaveContactInfo).toHaveBeenCalledWith({ phone: '111222333', message: 'Nowa wiadomość' })
  })

  it('calls onCreateOffer when the "Nowa oferta" button is clicked', () => {
    const container = document.createElement('div')
    const onCreateOffer = vi.fn()

    renderLeadDetailView(container, {
      lead: baseLead,
      offers: [],
      contracts: [],
      bookings: [],
      onSaveContactInfo: vi.fn(),
      onArchive: vi.fn(),
      onCreateOffer,
      onSendOffer: vi.fn(),
      onViewSession: vi.fn(),
    })

    container.querySelector<HTMLButtonElement>('[data-action="new-offer"]')!.click()
    expect(onCreateOffer).toHaveBeenCalledOnce()
  })

  it('calls onViewSession with the session id when "Zobacz sesję" is clicked', () => {
    const container = document.createElement('div')
    const onViewSession = vi.fn()

    renderLeadDetailView(container, {
      lead: baseLead,
      offers: [],
      contracts: [],
      bookings: [{ date: '2026-09-01', sessionId: 'session-9', sessionStatus: 'raw' }],
      onSaveContactInfo: vi.fn(),
      onArchive: vi.fn(),
      onCreateOffer: vi.fn(),
      onSendOffer: vi.fn(),
      onViewSession,
    })

    container.querySelector<HTMLButtonElement>('[data-action="view-session"]')!.click()
    expect(onViewSession).toHaveBeenCalledWith('session-9')
  })
})
