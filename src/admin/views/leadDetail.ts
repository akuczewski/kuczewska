import type { Contract } from '../../lib/contracts'
import type { Lead, LeadStatus } from '../../lib/leads'
import type { Offer, OfferStatus } from '../../lib/offers'
import type { SessionStatus } from '../../lib/sessions'
import { computeOverallStage, OVERALL_STAGE_LABELS, type BookingSessionInfo } from '../../lib/zlecenie'

export type LeadDetailDeps = {
  lead: Lead
  offers: Offer[]
  contracts: Contract[]
  bookings: BookingSessionInfo[]
  onSaveContactInfo: (input: { phone: string; message: string }) => void
  onArchive: () => void
  onCreateOffer: () => void
  onSendOffer: (offerId: string) => void
  onViewSession: (sessionId: string) => void
}

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Nowy',
  offer_sent: 'Oferta wysłana',
  accepted: 'Zaakceptowany',
  rejected: 'Odrzucony',
  archived: 'Zarchiwizowany',
}

const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  draft: 'Szkic',
  sent: 'Wysłana',
  accepted: 'Zaakceptowana',
  rejected: 'Odrzucona',
  expired: 'Wygasła',
}

const CONTRACT_STATUS_LABELS: Record<Contract['status'], string> = {
  pending: 'Oczekuje na podpis',
  signed: 'Podpisana',
}

const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  raw: 'Zdjęcia RAW w trakcie',
  selection_done: 'Klient wybrał zdjęcia',
  finished: 'Zdjęcia gotowe',
}

function formatGrosze(priceGrosze: number): string {
  return `${(priceGrosze / 100).toFixed(2).replace('.', ',')} zł`
}

export function renderLeadDetailView(container: HTMLElement, deps: LeadDetailDeps): void {
  const { lead, offers, contracts, bookings } = deps
  const overallStage = computeOverallStage(lead, offers, contracts, bookings)

  const offersHtml =
    offers.length === 0
      ? '<p class="lead-detail__empty">Brak jeszcze żadnej oferty.</p>'
      : `<ul class="lead-detail__offers">${offers
          .map(
            (offer) => `
              <li data-offer-id="${offer.id}">
                <span class="status-badge status-badge--${offer.status}">${OFFER_STATUS_LABELS[offer.status]}</span>
                ${formatGrosze(offer.totalPriceGrosze)}
                ${offer.status === 'draft' ? `<button type="button" data-action="send-offer" data-offer-id="${offer.id}">Wyślij ofertę</button>` : ''}
              </li>
            `,
          )
          .join('')}</ul>`

  const contractsHtml =
    contracts.length === 0
      ? '<p class="lead-detail__empty">Umowa pojawi się po zaakceptowaniu oferty przez klienta.</p>'
      : `<ul class="lead-detail__contracts">${contracts
          .map(
            (contract) => `
              <li data-contract-id="${contract.id}">
                <span class="status-badge status-badge--${contract.status}">${CONTRACT_STATUS_LABELS[contract.status]}</span>
              </li>
            `,
          )
          .join('')}</ul>`

  const bookingsHtml =
    bookings.length === 0
      ? '<p class="lead-detail__empty">Rezerwacja pojawi się po podpisaniu umowy.</p>'
      : `<ul class="lead-detail__bookings">${bookings
          .map(
            (booking) => `
              <li data-session-id="${booking.sessionId}">
                ${booking.date}
                ${
                  booking.sessionStatus
                    ? `<span class="status-badge status-badge--${booking.sessionStatus}">${SESSION_STATUS_LABELS[booking.sessionStatus]}</span>`
                    : ''
                }
                <button type="button" data-action="view-session" data-session-id="${booking.sessionId}">Zobacz sesję</button>
              </li>
            `,
          )
          .join('')}</ul>`

  container.innerHTML = `
    <section class="lead-detail">
      <header class="lead-detail__header">
        <h1>Zlecenie — ${lead.name}</h1>
        <p class="lead-detail__overall-stage">${OVERALL_STAGE_LABELS[overallStage]}</p>
        <span class="status-badge status-badge--${lead.status}">${LEAD_STATUS_LABELS[lead.status]}</span>
        <p>${lead.email}</p>
        <button type="button" class="lead-detail__archive">Archiwizuj leada</button>
      </header>

      <form class="lead-detail__contact-form">
        <label>
          Telefon
          <input type="text" name="phone" value="${lead.phone ?? ''}" />
        </label>
        <label>
          Wiadomość / notatki
          <textarea name="message">${lead.message ?? ''}</textarea>
        </label>
        <button type="submit">Zapisz</button>
      </form>

      <div class="lead-detail__stage">
        <h2>Etap 1 — Oferta</h2>
        ${offersHtml}
        <button type="button" data-action="new-offer">Nowa oferta</button>
      </div>

      <div class="lead-detail__stage">
        <h2>Etap 2 — Umowa</h2>
        ${contractsHtml}
      </div>

      <div class="lead-detail__stage">
        <h2>Etap 3 — Sesja i zdjęcia</h2>
        ${bookingsHtml}
      </div>
    </section>
  `

  container.querySelector('.lead-detail__archive')?.addEventListener('click', () => deps.onArchive())
  container.querySelector('[data-action="new-offer"]')?.addEventListener('click', () => deps.onCreateOffer())

  container.querySelectorAll<HTMLButtonElement>('[data-action="send-offer"]').forEach((button) => {
    button.addEventListener('click', () => {
      deps.onSendOffer(button.dataset.offerId!)
    })
  })

  container.querySelectorAll<HTMLButtonElement>('[data-action="view-session"]').forEach((button) => {
    button.addEventListener('click', () => {
      deps.onViewSession(button.dataset.sessionId!)
    })
  })

  const contactForm = container.querySelector<HTMLFormElement>('form.lead-detail__contact-form')!
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const phone = contactForm.querySelector<HTMLInputElement>('input[name="phone"]')!.value
    const message = contactForm.querySelector<HTMLTextAreaElement>('textarea[name="message"]')!.value
    deps.onSaveContactInfo({ phone, message })
  })
}
