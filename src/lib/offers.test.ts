import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Package } from './packages'
import { packagesToOfferLines, sumOfferLines } from './offers'

const mockDbInstance = { __brand: 'db' }
const mockCollectionRef = { __brand: 'collectionRef' }

vi.mock('./firebase', () => ({
  getFirestoreDb: () => mockDbInstance,
}))

const mockQueryRef = { __brand: 'queryRef' }
const mockWhereClause = { __brand: 'whereClause' }

const addDoc = vi.fn()
const collection = vi.fn((..._args: unknown[]) => mockCollectionRef)
const serverTimestamp = vi.fn(() => 'server-timestamp-sentinel')
const query = vi.fn((..._args: unknown[]) => mockQueryRef)
const where = vi.fn((..._args: unknown[]) => mockWhereClause)
const getDocs = vi.fn()

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDoc(...args),
  collection: (...args: unknown[]) => collection(...args),
  serverTimestamp: () => serverTimestamp(),
  query: (...args: unknown[]) => query(...args),
  where: (...args: unknown[]) => where(...args),
  getDocs: (...args: unknown[]) => getDocs(...args),
}))

const { createDraftOffer, listOffersForLead } = await import('./offers')

const packageA: Package = { id: 'p1', name: 'Sesja mieszkanie', description: 'a', priceGrosze: 80000, active: true }
const packageB: Package = { id: 'p2', name: 'Premium', description: 'b', priceGrosze: 150000, active: true }

describe('sumOfferLines', () => {
  it('sums the price of all lines', () => {
    expect(
      sumOfferLines([
        { packageId: 'p1', name: 'A', priceGrosze: 80000 },
        { packageId: 'p2', name: 'B', priceGrosze: 150000 },
      ]),
    ).toBe(230000)
  })

  it('returns 0 for an empty list', () => {
    expect(sumOfferLines([])).toBe(0)
  })
})

describe('packagesToOfferLines', () => {
  it('maps packages to snapshot lines, dropping "active"', () => {
    expect(packagesToOfferLines([packageA, packageB])).toEqual([
      { packageId: 'p1', name: 'Sesja mieszkanie', priceGrosze: 80000 },
      { packageId: 'p2', name: 'Premium', priceGrosze: 150000 },
    ])
  })
})

describe('createDraftOffer', () => {
  beforeEach(() => {
    addDoc.mockReset()
    collection.mockClear()
    addDoc.mockResolvedValue({ id: 'offer-1' })
  })

  it('writes a draft offer with a price snapshot of the selected packages', async () => {
    const id = await createDraftOffer({ leadId: 'lead-1', packages: [packageA, packageB] })

    expect(id).toBe('offer-1')
    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'offers')
    expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, {
      leadId: 'lead-1',
      lines: [
        { packageId: 'p1', name: 'Sesja mieszkanie', priceGrosze: 80000 },
        { packageId: 'p2', name: 'Premium', priceGrosze: 150000 },
      ],
      totalPriceGrosze: 230000,
      status: 'draft',
      publicToken: null,
      pdfStoragePath: null,
      createdAt: 'server-timestamp-sentinel',
      respondedAt: null,
    })
  })
})

describe('listOffersForLead', () => {
  beforeEach(() => {
    collection.mockClear()
    query.mockClear()
    where.mockClear()
    getDocs.mockReset()
  })

  it('returns offers for the given lead, mapped from Firestore docs', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'offer-1',
          data: () => ({
            leadId: 'lead-1',
            lines: [{ packageId: 'p1', name: 'A', priceGrosze: 80000 }],
            totalPriceGrosze: 80000,
            status: 'sent',
            publicToken: 'tok',
            pdfStoragePath: 'offers/offer-1.pdf',
          }),
        },
      ],
    })

    const offers = await listOffersForLead('lead-1')

    expect(where).toHaveBeenCalledWith('leadId', '==', 'lead-1')
    expect(query).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause)
    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'offers')
    expect(offers).toEqual([
      {
        id: 'offer-1',
        leadId: 'lead-1',
        lines: [{ packageId: 'p1', name: 'A', priceGrosze: 80000 }],
        totalPriceGrosze: 80000,
        status: 'sent',
        publicToken: 'tok',
        pdfStoragePath: 'offers/offer-1.pdf',
      },
    ])
  })
})
