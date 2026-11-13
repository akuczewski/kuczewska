import { describe, expect, it, vi } from 'vitest'
import { renderSessionsListView } from './sessionsList'

const clients = [
  {
    id: 'lead-1',
    name: 'Jan Kowalski',
    email: 'jan@example.com',
    phone: null,
    message: null,
    source: 'manual' as const,
    status: 'accepted' as const,
    clientUid: 'client-9',
  },
]

function submitNewSessionForm(container: HTMLElement, clientUid: string, title: string) {
  const clientSelect = container.querySelector<HTMLSelectElement>('select[name="clientUid"]')!
  const titleInput = container.querySelector<HTMLInputElement>('input[name="title"]')!
  clientSelect.value = clientUid
  titleInput.value = title
  const form = container.querySelector<HTMLFormElement>('form.admin-new-session')!
  form.dispatchEvent(new Event('submit', { cancelable: true }))
}

describe('renderSessionsListView', () => {
  it('renders the existing sessions passed in', () => {
    const container = document.createElement('div')

    renderSessionsListView(container, {
      sessions: [
        { id: 'session-1', clientUid: 'client-1', title: 'Sesja Mokotów', status: 'raw' },
        { id: 'session-2', clientUid: 'client-2', title: 'Sesja Wilanów', status: 'finished' },
      ],
      clients: [],
      createSession: vi.fn(),
      onSessionCreated: vi.fn(),
    })

    const items = container.querySelectorAll('.admin-sessions-list li')
    expect(items).toHaveLength(2)
    expect(items[0]!.textContent).toContain('Sesja Mokotów')
    expect(items[1]!.textContent).toContain('Sesja Wilanów')
  })

  it('renders a client picker populated from the clients list', () => {
    const container = document.createElement('div')

    renderSessionsListView(container, {
      sessions: [],
      clients,
      createSession: vi.fn(),
      onSessionCreated: vi.fn(),
    })

    const options = container.querySelectorAll<HTMLOptionElement>('select[name="clientUid"] option')
    const values = Array.from(options).map((o) => o.value)
    expect(values).toContain('client-9')
    expect(container.querySelector('select[name="clientUid"]')!.textContent).toContain('Jan Kowalski')
  })

  it('creates a new session from the form and notifies onSessionCreated', async () => {
    const container = document.createElement('div')
    const createSession = vi.fn().mockResolvedValue('session-42')
    const onSessionCreated = vi.fn()

    renderSessionsListView(container, {
      sessions: [],
      clients,
      createSession,
      onSessionCreated,
    })

    submitNewSessionForm(container, 'client-9', 'Sesja Praga')

    await vi.waitFor(() => expect(onSessionCreated).toHaveBeenCalledWith('session-42'))
    expect(createSession).toHaveBeenCalledWith({ clientUid: 'client-9', title: 'Sesja Praga' })
  })

  it('passes the package photo limit when the photographer fills it in', async () => {
    const container = document.createElement('div')
    const createSession = vi.fn().mockResolvedValue('session-43')

    renderSessionsListView(container, { sessions: [], clients, createSession, onSessionCreated: vi.fn() })

    container.querySelector<HTMLInputElement>('input[name="selectionLimit"]')!.value = '20'
    submitNewSessionForm(container, 'client-9', 'Sesja Praga')

    await vi.waitFor(() =>
      expect(createSession).toHaveBeenCalledWith({ clientUid: 'client-9', title: 'Sesja Praga', selectionLimit: 20 }),
    )
  })

  it('preselects the given client uid when provided', () => {
    const container = document.createElement('div')

    renderSessionsListView(container, {
      sessions: [],
      clients,
      createSession: vi.fn(),
      onSessionCreated: vi.fn(),
      preselectedClientUid: 'client-9',
    })

    expect(container.querySelector<HTMLSelectElement>('select[name="clientUid"]')!.value).toBe('client-9')
  })
})
