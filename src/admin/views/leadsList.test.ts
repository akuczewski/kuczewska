import { describe, expect, it, vi } from 'vitest'
import { renderLeadsListView } from './leadsList'

function submitNewLeadForm(container: HTMLElement, name: string, email: string) {
  const nameInput = container.querySelector<HTMLInputElement>('input[name="name"]')!
  const emailInput = container.querySelector<HTMLInputElement>('input[name="email"]')!
  nameInput.value = name
  emailInput.value = email
  const form = container.querySelector<HTMLFormElement>('form.admin-new-lead')!
  form.dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('renderLeadsListView', () => {
  it('renders each lead with name, email and status', () => {
    const container = document.createElement('div')

    renderLeadsListView(container, {
      leads: [
        {
          id: 'lead-1',
          name: 'Jan Kowalski',
          email: 'jan@example.com',
          phone: null,
          message: null,
          source: 'manual',
          status: 'new',
        },
      ],
      createManualLead: vi.fn(),
      onLeadCreated: vi.fn(),
      onCreateOffer: vi.fn(),
    })

    const items = container.querySelectorAll('.admin-leads-list li')
    expect(items).toHaveLength(1)
    expect(items[0]!.textContent).toContain('Jan Kowalski')
    expect(items[0]!.textContent).toContain('jan@example.com')
    expect(items[0]!.textContent).toContain('new')
  })

  it('creates a manual lead from the form', async () => {
    const container = document.createElement('div')
    const createManualLead = vi.fn().mockResolvedValue('lead-42')
    const onLeadCreated = vi.fn()

    renderLeadsListView(container, {
      leads: [],
      createManualLead,
      onLeadCreated,
      onCreateOffer: vi.fn(),
    })

    submitNewLeadForm(container, 'Anna Nowak', 'anna@example.com')

    await vi.waitFor(() => expect(onLeadCreated).toHaveBeenCalledWith('lead-42'))
    expect(createManualLead).toHaveBeenCalledWith({ name: 'Anna Nowak', email: 'anna@example.com' })
  })

  it('calls onCreateOffer with the lead id when "Utwórz ofertę" is clicked', () => {
    const container = document.createElement('div')
    const onCreateOffer = vi.fn()

    renderLeadsListView(container, {
      leads: [
        {
          id: 'lead-1',
          name: 'Jan',
          email: 'jan@example.com',
          phone: null,
          message: null,
          source: 'manual',
          status: 'new',
        },
      ],
      createManualLead: vi.fn(),
      onLeadCreated: vi.fn(),
      onCreateOffer,
    })

    container.querySelector<HTMLButtonElement>('[data-action="create-offer"]')!.click()

    expect(onCreateOffer).toHaveBeenCalledWith('lead-1')
  })
})
