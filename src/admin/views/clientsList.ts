import type { NewClientInput, CreateClientResult } from '../../lib/functionsClient'
import type { Lead } from '../../lib/leads'

export type ClientsListDeps = {
  clients: Lead[]
  createClient: (input: NewClientInput) => Promise<CreateClientResult>
  onClientCreated: (result: CreateClientResult) => void
  onCreateSession: (client: Lead) => void
}

export function renderClientsListView(container: HTMLElement, deps: ClientsListDeps): void {
  const body =
    deps.clients.length === 0
      ? '<p class="lead-detail__empty">Brak jeszcze klientów — pojawią się tu zapytania po zaakceptowaniu oferty, albo dodaj klienta ręcznie poniżej.</p>'
      : `<ul class="admin-clients-list">${deps.clients
          .map(
            (client) => `
              <li data-lead-id="${client.id}">
                <a href="#/admin/leads/${client.id}"><strong>${client.name}</strong></a> — ${client.email}
                ${
                  client.clientUid
                    ? `<button type="button" data-action="new-session" data-lead-id="${client.id}">Nowa sesja</button>`
                    : ''
                }
              </li>
            `,
          )
          .join('')}</ul>`

  container.innerHTML = `
    <section class="admin-clients">
      <h1>Klienci</h1>
      ${body}
      <form class="admin-new-client" novalidate>
        <h2>Dodaj klienta ręcznie</h2>
        <label>
          Imię i nazwisko
          <input type="text" name="name" required />
        </label>
        <label>
          E-mail
          <input type="email" name="email" required />
        </label>
        <label>
          Telefon
          <input type="text" name="phone" />
        </label>
        <button type="submit">Dodaj klienta</button>
      </form>
    </section>
  `

  container.querySelectorAll<HTMLButtonElement>('[data-action="new-session"]').forEach((button) => {
    const client = deps.clients.find((candidate) => candidate.id === button.dataset.leadId)!
    button.addEventListener('click', () => deps.onCreateSession(client))
  })

  const form = container.querySelector<HTMLFormElement>('form.admin-new-client')!
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '')
    const email = String(formData.get('email') ?? '')
    const phone = String(formData.get('phone') ?? '')

    deps.createClient({ name, email, phone }).then((result) => {
      deps.onClientCreated(result)
    })
  })
}
