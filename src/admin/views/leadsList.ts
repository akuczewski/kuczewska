import type { Lead, NewLead } from '../../lib/leads'

export type LeadsListDeps = {
  leads: Lead[]
  createManualLead: (input: NewLead) => Promise<string>
  onLeadCreated: (leadId: string) => void
  onCreateOffer: (leadId: string) => void
}

export function renderLeadsListView(container: HTMLElement, deps: LeadsListDeps): void {
  const items = deps.leads
    .map(
      (lead) => `
        <li data-lead-id="${lead.id}">
          <a href="#/admin/leads/${lead.id}"><strong>${lead.name}</strong></a> — ${lead.email} (${lead.status})
          <button type="button" data-action="create-offer">Utwórz ofertę</button>
        </li>
      `,
    )
    .join('')

  container.innerHTML = `
    <section class="admin-leads">
      <h1>Zapytania</h1>
      <ul class="admin-leads-list">${items}</ul>
      <form class="admin-new-lead" novalidate>
        <h2>Dodaj zapytanie ręcznie</h2>
        <label>
          Imię i nazwisko
          <input type="text" name="name" required />
        </label>
        <label>
          E-mail
          <input type="email" name="email" required />
        </label>
        <button type="submit">Dodaj leada</button>
      </form>
    </section>
  `

  container.querySelectorAll<HTMLLIElement>('.admin-leads-list li').forEach((item, index) => {
    const lead = deps.leads[index]!
    item.querySelector<HTMLButtonElement>('[data-action="create-offer"]')!.addEventListener(
      'click',
      () => deps.onCreateOffer(lead.id),
    )
  })

  const form = container.querySelector<HTMLFormElement>('form.admin-new-lead')!
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(form)
    const name = String(formData.get('name') ?? '')
    const email = String(formData.get('email') ?? '')

    deps.createManualLead({ name, email }).then((leadId) => {
      deps.onLeadCreated(leadId)
    })
  })
}
