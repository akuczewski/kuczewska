import { httpsCallable } from 'firebase/functions'
import { getFirebaseFunctions } from './firebase'

export async function sendOfferEmail(offerId: string): Promise<void> {
  const callable = httpsCallable(getFirebaseFunctions(), 'sendOffer')
  await callable({ offerId })
}

export type OfferSummary = {
  leadName: string
  lines: Array<{ packageId: string; name: string; priceGrosze: number }>
  totalPriceGrosze: number
  status: string
}

export async function fetchOfferByToken(offerId: string, token: string): Promise<OfferSummary> {
  const callable = httpsCallable(getFirebaseFunctions(), 'getOfferByToken')
  const result = await callable({ offerId, token })
  return result.data as OfferSummary
}

export type OfferResponseResult = {
  status: 'accepted' | 'rejected'
  contractId?: string
}

export async function respondToOffer(
  offerId: string,
  token: string,
  decision: 'accept' | 'reject',
): Promise<OfferResponseResult> {
  const callable = httpsCallable(getFirebaseFunctions(), 'respondToOffer')
  const result = await callable({ offerId, token, decision })
  return result.data as OfferResponseResult
}

export type ContractSummary = {
  title: string
  leadName: string
  lines: Array<{ text: string }>
  totalLine: string
  termsText: string
  status: string
}

export async function fetchContractByToken(contractId: string, token: string): Promise<ContractSummary> {
  const callable = httpsCallable(getFirebaseFunctions(), 'getContractByToken')
  const result = await callable({ contractId, token })
  return result.data as ContractSummary
}

export type SignContractResult = {
  status: 'signed'
}

export async function signContract(contractId: string, token: string): Promise<SignContractResult> {
  const callable = httpsCallable(getFirebaseFunctions(), 'signContract')
  const result = await callable({ contractId, token })
  return result.data as SignContractResult
}

export async function fetchAvailableDates(): Promise<string[]> {
  const callable = httpsCallable(getFirebaseFunctions(), 'getAvailableDates')
  const result = await callable({})
  return (result.data as { bookedDates: string[] }).bookedDates
}

export type BookDateResult = {
  sessionId: string
  bookingDate: string
}

export async function bookDate(contractId: string, token: string, date: string): Promise<BookDateResult> {
  const callable = httpsCallable(getFirebaseFunctions(), 'createBooking')
  const result = await callable({ contractId, token, date })
  return result.data as BookDateResult
}

export type NewClientInput = {
  name: string
  email: string
  phone?: string
}

export type CreateClientResult = {
  leadId: string
  clientUid: string
}

export async function createClientAccount(input: NewClientInput): Promise<CreateClientResult> {
  const callable = httpsCallable(getFirebaseFunctions(), 'createClient')
  const result = await callable(input)
  return result.data as CreateClientResult
}

export type SubmitSelectionResult = {
  selectedCount: number
}

/** Client confirms their picks: locks the selection and notifies the photographer by e-mail. */
export async function submitSelection(sessionId: string): Promise<SubmitSelectionResult> {
  const callable = httpsCallable(getFirebaseFunctions(), 'submitSelection')
  const result = await callable({ sessionId })
  return result.data as SubmitSelectionResult
}
