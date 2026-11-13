import type { OfferSummary } from '../../lib/functionsClient'

export type OfferViewDeps = {
  offer: OfferSummary
  onAccept: () => void
  onReject: () => void
}

function formatGrosze(priceGrosze: number): string {
  return `${(priceGrosze / 100).toFixed(2).replace('.', ',')} zł`
}

const STATUS_LABELS: Record<string, string> = {
  accepted: 'Ta oferta została już zaakceptowana.',
  rejected: 'Ta oferta została odrzucona.',
  expired: 'Ta oferta wygasła.',
}

export function renderOfferView(container: HTMLElement, deps: OfferViewDeps): void {
  const { offer } = deps
  const items = offer.lines
    .map((line) => `<li>${line.name} — ${formatGrosze(line.priceGrosze)}</li>`)
    .join('')

  const actions =
    offer.status === 'sent'
      ? `
        <div class="offer-view__actions">
          <button type="button" class="offer-view__accept">Akceptuję ofertę</button>
          <button type="button" class="offer-view__reject">Odrzucam ofertę</button>
        </div>
      `
      : `<p class="offer-view__status">${STATUS_LABELS[offer.status] ?? 'Ta oferta nie jest już aktywna.'}</p>`

  container.innerHTML = `
    <section class="offer-view">
      <h1>Oferta dla: ${offer.leadName}</h1>
      <ul class="offer-view__lines">${items}</ul>
      <p class="offer-view__total">Razem: ${formatGrosze(offer.totalPriceGrosze)}</p>
      ${actions}
    </section>
  `

  container.querySelector('.offer-view__accept')?.addEventListener('click', () => deps.onAccept())
  container.querySelector('.offer-view__reject')?.addEventListener('click', () => deps.onReject())
}
