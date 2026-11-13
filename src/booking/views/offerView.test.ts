import { describe, expect, it, vi } from 'vitest'
import { renderOfferView } from './offerView'

describe('renderOfferView', () => {
  it('renders the offer lines and total, with accept/reject buttons when status is "sent"', () => {
    const container = document.createElement('div')

    renderOfferView(container, {
      offer: {
        leadName: 'Jan Kowalski',
        lines: [{ packageId: 'p1', name: 'Sesja mieszkanie', priceGrosze: 80000 }],
        totalPriceGrosze: 80000,
        status: 'sent',
      },
      onAccept: vi.fn(),
      onReject: vi.fn(),
    })

    expect(container.textContent).toContain('Jan Kowalski')
    expect(container.textContent).toContain('800,00 zł')
    expect(container.querySelector('.offer-view__accept')).not.toBeNull()
    expect(container.querySelector('.offer-view__reject')).not.toBeNull()
  })

  it('calls onAccept when the accept button is clicked', () => {
    const container = document.createElement('div')
    const onAccept = vi.fn()

    renderOfferView(container, {
      offer: { leadName: 'Jan', lines: [], totalPriceGrosze: 0, status: 'sent' },
      onAccept,
      onReject: vi.fn(),
    })

    container.querySelector<HTMLButtonElement>('.offer-view__accept')!.click()
    expect(onAccept).toHaveBeenCalledOnce()
  })

  it('calls onReject when the reject button is clicked', () => {
    const container = document.createElement('div')
    const onReject = vi.fn()

    renderOfferView(container, {
      offer: { leadName: 'Jan', lines: [], totalPriceGrosze: 0, status: 'sent' },
      onAccept: vi.fn(),
      onReject,
    })

    container.querySelector<HTMLButtonElement>('.offer-view__reject')!.click()
    expect(onReject).toHaveBeenCalledOnce()
  })

  it('hides the action buttons and shows a status message when already responded to', () => {
    const container = document.createElement('div')

    renderOfferView(container, {
      offer: { leadName: 'Jan', lines: [], totalPriceGrosze: 0, status: 'accepted' },
      onAccept: vi.fn(),
      onReject: vi.fn(),
    })

    expect(container.querySelector('.offer-view__accept')).toBeNull()
    expect(container.querySelector('.offer-view__reject')).toBeNull()
    expect(container.textContent).toContain('zaakceptowana')
  })
})
