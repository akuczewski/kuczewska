import { describe, expect, it, vi } from 'vitest'
import { renderClientsListView } from './clientsList'

const client = {
  id: 'lead-1',
  name: 'Jan Kowalski',
  email: 'jan@example.com',
  phone: null,
  message: null,
  source: 'manual' as const,
  status: 'accepted' as const,
  clientUid: 'uid-1',
}

function submitNewClientForm(container: HTMLElement, name: string, email: string, phone: string) {
  container.querySelector<HTMLInputElement>('input[name="name"]')!.value = name
  container.querySelector<HTMLInputElement>('input[name="email"]')!.value = email
  container.querySelector<HTMLInputElement>('input[name="phone"]')!.value = phone
  container.querySelector<HTMLFormElement>('form.admin-new-client')!.dispatchEvent(
    new Event('submit', { cancelable: true }),
  )
}

describe('renderClientsListView', () => {
  it('renders a link per client pointing at their lead detail page', () => {
    const container = document.createElement('div')

    renderClientsListView(container, {
      clients: [client],
      createClient: vi.fn(),
      onClientCreated: vi.fn(),
      onCreateSession: vi.fn(),
    })

    const items = container.querySelectorAll('.admin-clients-list li')
    expect(items).toHaveLength(1)
    expect(items[0]!.textContent).toContain('Jan Kowalski')
    expect(items[0]!.textContent).toContain('jan@example.com')

    const link = items[0]!.querySelector<HTMLAnchorElement>('a')!
    expect(link.getAttribute('href')).toBe('#/admin/leads/lead-1')
  })

  it('shows a friendly message when there are no clients yet', () => {
    const container = document.createElement('div')

    renderClientsListView(container, {
      clients: [],
      createClient: vi.fn(),
      onClientCreated: vi.fn(),
      onCreateSession: vi.fn(),
    })

    expect(container.querySelector('.admin-clients-list')).toBeNull()
    expect(container.textContent).toContain('Brak jeszcze klientów')
  })

  it('creates a new client from the form and notifies onClientCreated', async () => {
    const container = document.createElement('div')
    const createClient = vi.fn().mockResolvedValue({ leadId: 'lead-2', clientUid: 'uid-2' })
    const onClientCreated = vi.fn()

    renderClientsListView(container, {
      clients: [],
      createClient,
      onClientCreated,
      onCreateSession: vi.fn(),
    })

    submitNewClientForm(container, 'Anna Nowak', 'anna@example.com', '500600700')

    await vi.waitFor(() =>
      expect(onClientCreated).toHaveBeenCalledWith({ leadId: 'lead-2', clientUid: 'uid-2' }),
    )
    expect(createClient).toHaveBeenCalledWith({
      name: 'Anna Nowak',
      email: 'anna@example.com',
      phone: '500600700',
    })
  })

  it('calls onCreateSession with the client when "Nowa sesja" is clicked', () => {
    const container = document.createElement('div')
    const onCreateSession = vi.fn()

    renderClientsListView(container, {
      clients: [client],
      createClient: vi.fn(),
      onClientCreated: vi.fn(),
      onCreateSession,
    })

    container.querySelector<HTMLButtonElement>('[data-action="new-session"]')!.click()
    expect(onCreateSession).toHaveBeenCalledWith(client)
  })
})
