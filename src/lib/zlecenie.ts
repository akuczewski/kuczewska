import type { Contract } from './contracts'
import type { Lead } from './leads'
import type { Offer } from './offers'
import type { SessionStatus } from './sessions'

export type BookingSessionInfo = {
  date: string
  sessionId: string
  sessionStatus: SessionStatus | null
}

export type OverallStage =
  | 'nowe_zapytanie'
  | 'oferta_wyslana'
  | 'oferta_odrzucona'
  | 'oferta_zaakceptowana'
  | 'umowa_do_podpisu'
  | 'umowa_podpisana'
  | 'sesja_zarezerwowana'
  | 'zdjecia_do_wyboru'
  | 'zdjecia_gotowe'
  | 'zarchiwizowane'

export const OVERALL_STAGE_LABELS: Record<OverallStage, string> = {
  nowe_zapytanie: 'Nowe zapytanie',
  oferta_wyslana: 'Oferta wysłana — czeka na odpowiedź',
  oferta_odrzucona: 'Oferta odrzucona',
  oferta_zaakceptowana: 'Oferta zaakceptowana — czeka na umowę',
  umowa_do_podpisu: 'Umowa wysłana — czeka na podpis',
  umowa_podpisana: 'Umowa podpisana — czeka na wybór terminu',
  sesja_zarezerwowana: 'Sesja zarezerwowana — trwa realizacja zdjęć',
  zdjecia_do_wyboru: 'Klient wybiera zdjęcia do obróbki',
  zdjecia_gotowe: 'Zdjęcia gotowe — zlecenie zakończone',
  zarchiwizowane: 'Zarchiwizowane',
}

export function computeOverallStage(
  lead: Lead,
  offers: Offer[],
  contracts: Contract[],
  bookings: BookingSessionInfo[],
): OverallStage {
  if (bookings.some((b) => b.sessionStatus === 'finished')) {
    return 'zdjecia_gotowe'
  }
  if (bookings.some((b) => b.sessionStatus === 'selection_done')) {
    return 'zdjecia_do_wyboru'
  }
  if (bookings.length > 0) {
    return 'sesja_zarezerwowana'
  }
  if (contracts.some((c) => c.status === 'signed')) {
    return 'umowa_podpisana'
  }
  if (contracts.some((c) => c.status === 'pending')) {
    return 'umowa_do_podpisu'
  }
  if (offers.some((o) => o.status === 'accepted')) {
    return 'oferta_zaakceptowana'
  }
  if (lead.status === 'archived') {
    return 'zarchiwizowane'
  }
  if (offers.some((o) => o.status === 'sent')) {
    return 'oferta_wyslana'
  }
  if (offers.length > 0 && offers.every((o) => o.status === 'rejected' || o.status === 'expired')) {
    return 'oferta_odrzucona'
  }
  return 'nowe_zapytanie'
}
