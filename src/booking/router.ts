import {
  bookDate,
  fetchAvailableDates,
  fetchContractByToken,
  fetchOfferByToken,
  respondToOffer,
  signContract,
} from '../lib/functionsClient'
import { renderBookingCalendarView } from './views/bookingCalendar'
import { renderContractView } from './views/contractView'
import { renderOfferView } from './views/offerView'

function getToken(path: string): string {
  const queryString = path.split('?')[1] ?? ''
  return new URLSearchParams(queryString).get('token') ?? ''
}

function renderMessage(container: HTMLElement, title: string, message: string): void {
  container.innerHTML = `
    <section class="booking-message">
      <h1>${title}</h1>
      <p>${message}</p>
    </section>
  `
}

async function renderOfferRoute(offerId: string, token: string, container: HTMLElement): Promise<void> {
  try {
    const offer = await fetchOfferByToken(offerId, token)
    renderOfferView(container, {
      offer,
      onAccept: async () => {
        await respondToOffer(offerId, token, 'accept')
        renderMessage(
          container,
          'Dziękujemy za akceptację!',
          'Wysłaliśmy Ci mailem link do umowy — sprawdź swoją skrzynkę.',
        )
      },
      onReject: async () => {
        await respondToOffer(offerId, token, 'reject')
        renderMessage(container, 'Oferta odrzucona', 'Dziękujemy za odpowiedź.')
      },
    })
  } catch {
    renderMessage(container, 'Nie znaleziono oferty', 'Sprawdź, czy link jest poprawny.')
  }
}

async function renderContractRoute(
  contractId: string,
  token: string,
  container: HTMLElement,
): Promise<void> {
  try {
    const contract = await fetchContractByToken(contractId, token)
    renderContractView(container, {
      contract,
      onSign: async () => {
        await signContract(contractId, token)
        await renderBookingRoute(contractId, token, container)
      },
    })
  } catch {
    renderMessage(container, 'Nie znaleziono umowy', 'Sprawdź, czy link jest poprawny.')
  }
}

async function renderBookingRoute(contractId: string, token: string, container: HTMLElement): Promise<void> {
  const bookedDates = await fetchAvailableDates()
  renderBookingCalendarView(container, {
    bookedDates,
    onBookDate: async (date) => {
      await bookDate(contractId, token, date)
      renderMessage(
        container,
        'Termin zarezerwowany!',
        'Wysłaliśmy Ci mailem link do ustawienia hasła do Twojego konta klienta — tam znajdziesz zdjęcia z sesji.',
      )
    },
  })
}

export async function renderBookingRouterRoute(path: string, container: HTMLElement): Promise<void> {
  const token = getToken(path)

  const offerMatch = path.match(/^#\/offer\/([^?]+)/)
  if (offerMatch) {
    await renderOfferRoute(offerMatch[1]!, token, container)
    return
  }

  const contractMatch = path.match(/^#\/contract\/([^?]+)/)
  if (contractMatch) {
    await renderContractRoute(contractMatch[1]!, token, container)
    return
  }
}
