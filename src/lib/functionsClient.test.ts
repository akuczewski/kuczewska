import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFunctionsInstance = { __brand: 'functions' }

vi.mock('./firebase', () => ({
  getFirebaseFunctions: () => mockFunctionsInstance,
}))

const httpsCallable = vi.fn()
const callableFn = vi.fn()

vi.mock('firebase/functions', () => ({
  httpsCallable: (...args: unknown[]) => httpsCallable(...args),
}))

const {
  sendOfferEmail,
  fetchOfferByToken,
  respondToOffer,
  fetchContractByToken,
  signContract,
  fetchAvailableDates,
  bookDate,
  createClientAccount,
  submitSelection,
} = await import('./functionsClient')

describe('sendOfferEmail', () => {
  beforeEach(() => {
    httpsCallable.mockReset()
    callableFn.mockReset()
    httpsCallable.mockReturnValue(callableFn)
    callableFn.mockResolvedValue({ data: { ok: true } })
  })

  it('calls the "sendOffer" callable with the offerId', async () => {
    await sendOfferEmail('offer-1')

    expect(httpsCallable).toHaveBeenCalledWith(mockFunctionsInstance, 'sendOffer')
    expect(callableFn).toHaveBeenCalledWith({ offerId: 'offer-1' })
  })
})

describe('fetchOfferByToken', () => {
  beforeEach(() => {
    httpsCallable.mockReset()
    callableFn.mockReset()
    httpsCallable.mockReturnValue(callableFn)
    callableFn.mockResolvedValue({
      data: { leadName: 'Jan', lines: [], totalPriceGrosze: 1000, status: 'sent' },
    })
  })

  it('calls the "getOfferByToken" callable and returns its data', async () => {
    const result = await fetchOfferByToken('offer-1', 'tok123')

    expect(httpsCallable).toHaveBeenCalledWith(mockFunctionsInstance, 'getOfferByToken')
    expect(callableFn).toHaveBeenCalledWith({ offerId: 'offer-1', token: 'tok123' })
    expect(result).toEqual({ leadName: 'Jan', lines: [], totalPriceGrosze: 1000, status: 'sent' })
  })
})

describe('respondToOffer', () => {
  beforeEach(() => {
    httpsCallable.mockReset()
    callableFn.mockReset()
    httpsCallable.mockReturnValue(callableFn)
    callableFn.mockResolvedValue({ data: { status: 'accepted', contractId: 'contract-1' } })
  })

  it('calls the "respondToOffer" callable with offerId, token and decision', async () => {
    const result = await respondToOffer('offer-1', 'tok123', 'accept')

    expect(httpsCallable).toHaveBeenCalledWith(mockFunctionsInstance, 'respondToOffer')
    expect(callableFn).toHaveBeenCalledWith({ offerId: 'offer-1', token: 'tok123', decision: 'accept' })
    expect(result).toEqual({ status: 'accepted', contractId: 'contract-1' })
  })
})

describe('fetchContractByToken', () => {
  beforeEach(() => {
    httpsCallable.mockReset()
    callableFn.mockReset()
    httpsCallable.mockReturnValue(callableFn)
    callableFn.mockResolvedValue({
      data: {
        title: 'Umowa',
        leadName: 'Jan',
        lines: [],
        totalLine: 'Razem: 0,00 zł',
        termsText: '...',
        status: 'pending',
      },
    })
  })

  it('calls the "getContractByToken" callable and returns its data', async () => {
    const result = await fetchContractByToken('contract-1', 'tok456')

    expect(httpsCallable).toHaveBeenCalledWith(mockFunctionsInstance, 'getContractByToken')
    expect(callableFn).toHaveBeenCalledWith({ contractId: 'contract-1', token: 'tok456' })
    expect(result.leadName).toBe('Jan')
    expect(result.status).toBe('pending')
  })
})

describe('signContract', () => {
  beforeEach(() => {
    httpsCallable.mockReset()
    callableFn.mockReset()
    httpsCallable.mockReturnValue(callableFn)
    callableFn.mockResolvedValue({ data: { status: 'signed' } })
  })

  it('calls the "signContract" callable with contractId and token', async () => {
    const result = await signContract('contract-1', 'tok456')

    expect(httpsCallable).toHaveBeenCalledWith(mockFunctionsInstance, 'signContract')
    expect(callableFn).toHaveBeenCalledWith({ contractId: 'contract-1', token: 'tok456' })
    expect(result).toEqual({ status: 'signed' })
  })
})

describe('fetchAvailableDates', () => {
  beforeEach(() => {
    httpsCallable.mockReset()
    callableFn.mockReset()
    httpsCallable.mockReturnValue(callableFn)
    callableFn.mockResolvedValue({ data: { bookedDates: ['2026-08-15', '2026-08-16'] } })
  })

  it('calls the "getAvailableDates" callable and returns the booked dates', async () => {
    const dates = await fetchAvailableDates()

    expect(httpsCallable).toHaveBeenCalledWith(mockFunctionsInstance, 'getAvailableDates')
    expect(callableFn).toHaveBeenCalledWith({})
    expect(dates).toEqual(['2026-08-15', '2026-08-16'])
  })
})

describe('bookDate', () => {
  beforeEach(() => {
    httpsCallable.mockReset()
    callableFn.mockReset()
    httpsCallable.mockReturnValue(callableFn)
    callableFn.mockResolvedValue({ data: { sessionId: 'session-1', bookingDate: '2026-09-01' } })
  })

  it('calls the "createBooking" callable with contractId, token and date', async () => {
    const result = await bookDate('contract-1', 'tok456', '2026-09-01')

    expect(httpsCallable).toHaveBeenCalledWith(mockFunctionsInstance, 'createBooking')
    expect(callableFn).toHaveBeenCalledWith({ contractId: 'contract-1', token: 'tok456', date: '2026-09-01' })
    expect(result).toEqual({ sessionId: 'session-1', bookingDate: '2026-09-01' })
  })
})

describe('createClientAccount', () => {
  beforeEach(() => {
    httpsCallable.mockReset()
    callableFn.mockReset()
    httpsCallable.mockReturnValue(callableFn)
    callableFn.mockResolvedValue({ data: { leadId: 'lead-1', clientUid: 'uid-1' } })
  })

  it('calls the "createClient" callable with name, email and phone', async () => {
    const result = await createClientAccount({ name: 'Jan Kowalski', email: 'jan@example.com', phone: '600700800' })

    expect(httpsCallable).toHaveBeenCalledWith(mockFunctionsInstance, 'createClient')
    expect(callableFn).toHaveBeenCalledWith({
      name: 'Jan Kowalski',
      email: 'jan@example.com',
      phone: '600700800',
    })
    expect(result).toEqual({ leadId: 'lead-1', clientUid: 'uid-1' })
  })
})

describe('submitSelection', () => {
  beforeEach(() => {
    httpsCallable.mockReset()
    callableFn.mockReset()
    httpsCallable.mockReturnValue(callableFn)
    callableFn.mockResolvedValue({ data: { selectedCount: 12 } })
  })

  it('calls the "submitSelection" callable with the sessionId', async () => {
    const result = await submitSelection('session-1')

    expect(httpsCallable).toHaveBeenCalledWith(mockFunctionsInstance, 'submitSelection')
    expect(callableFn).toHaveBeenCalledWith({ sessionId: 'session-1' })
    expect(result).toEqual({ selectedCount: 12 })
  })
})
