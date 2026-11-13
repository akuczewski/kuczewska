import { describe, expect, it, vi } from 'vitest'
import { renderOfferBuilderView } from './offerBuilder'

const packageA = { id: 'p1', name: 'Sesja mieszkanie', description: 'a', priceGrosze: 80000, active: true }
const packageB = { id: 'p2', name: 'Premium', description: 'b', priceGrosze: 150000, active: true }

describe('renderOfferBuilderView', () => {
  it('renders a checkbox per available package', () => {
    const container = document.createElement('div')

    renderOfferBuilderView(container, {
      leadName: 'Jan Kowalski',
      availablePackages: [packageA, packageB],
      createOffer: vi.fn(),
      onOfferCreated: vi.fn(),
    })

    const checkboxes = container.querySelectorAll('input[type="checkbox"]')
    expect(checkboxes).toHaveLength(2)
    expect(container.querySelector('h1')!.textContent).toContain('Jan Kowalski')
  })

  it('updates the running total in złoty as packages are toggled', () => {
    const container = document.createElement('div')

    renderOfferBuilderView(container, {
      leadName: 'Jan Kowalski',
      availablePackages: [packageA, packageB],
      createOffer: vi.fn(),
      onOfferCreated: vi.fn(),
    })

    const totalEl = container.querySelector('.offer-builder__total')!
    expect(totalEl.textContent).toContain('0,00 zł')

    const firstCheckbox = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!
    firstCheckbox.checked = true
    firstCheckbox.dispatchEvent(new Event('change'))

    expect(totalEl.textContent).toContain('800,00 zł')
  })

  it('creates an offer with only the selected packages and notifies onOfferCreated', async () => {
    const container = document.createElement('div')
    const createOffer = vi.fn().mockResolvedValue('offer-42')
    const onOfferCreated = vi.fn()

    renderOfferBuilderView(container, {
      leadName: 'Jan Kowalski',
      availablePackages: [packageA, packageB],
      createOffer,
      onOfferCreated,
    })

    const checkboxes = container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    checkboxes[1]!.checked = true
    checkboxes[1]!.dispatchEvent(new Event('change'))

    container.querySelector<HTMLFormElement>('form.offer-builder')!.dispatchEvent(
      new Event('submit', { cancelable: true }),
    )

    await vi.waitFor(() => expect(onOfferCreated).toHaveBeenCalledWith('offer-42'))
    expect(createOffer).toHaveBeenCalledWith([packageB])
  })
})
