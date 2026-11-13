import type { Lead } from '../../lib/leads'
import { type NewSession, type SessionStatus, sessionStatusLabel } from '../../lib/sessions'

export type AdminSession = {
  id: string
  clientUid: string
  title: string
  status: SessionStatus
}

export type SessionsListDeps = {
  sessions: AdminSession[]
  clients: Lead[]
  createSession: (input: NewSession) => Promise<string>
  onSessionCreated: (sessionId: string) => void
  preselectedClientUid?: string
}

export function renderSessionsListView(container: HTMLElement, deps: SessionsListDeps): void {
  const items = deps.sessions
    .map(
      (session) => `
        <li data-session-id="${session.id}">
          <a href="#/admin/session/${session.id}">${session.title}</a>
          <span class="status-badge status-badge--${session.status}">${sessionStatusLabel(session.status)}</span>
        </li>
      `,
    )
    .join('')

  const clientOptions = deps.clients
    .map(
      (client) => `
        <option value="${client.clientUid}" ${client.clientUid === deps.preselectedClientUid ? 'selected' : ''}>
          ${client.name} — ${client.email}
        </option>
      `,
    )
    .join('')

  container.innerHTML = `
    <section class="admin-sessions">
      <h1>Sesje klientów</h1>
      <ul class="admin-sessions-list">${items}</ul>
      <form class="admin-new-session" novalidate>
        <h2>Nowa sesja</h2>
        <label>
          Klient
          <select name="clientUid" required>
            <option value="">Wybierz klienta</option>
            ${clientOptions}
          </select>
        </label>
        <label>
          Tytuł sesji
          <input type="text" name="title" required />
        </label>
        <label>
          Liczba zdjęć w pakiecie (opcjonalnie)
          <input type="number" name="selectionLimit" min="1" step="1" inputmode="numeric" />
        </label>
        <button type="submit">Utwórz sesję</button>
      </form>
    </section>
  `

  const form = container.querySelector<HTMLFormElement>('form.admin-new-session')!

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(form)
    const clientUid = String(formData.get('clientUid') ?? '')
    const title = String(formData.get('title') ?? '')

    const limit = Number.parseInt(String(formData.get('selectionLimit') ?? ''), 10)
    const input: NewSession = { clientUid, title }
    if (Number.isFinite(limit) && limit > 0) input.selectionLimit = limit

    deps.createSession(input).then((sessionId) => {
      deps.onSessionCreated(sessionId)
    })
  })
}
