import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDbInstance = { __brand: 'db' }
const mockCollectionRef = { __brand: 'collectionRef' }
const mockQueryRef = { __brand: 'queryRef' }
const mockWhereClause = { __brand: 'whereClause' }

vi.mock('./firebase', () => ({
  getFirestoreDb: () => mockDbInstance,
}))

const collection = vi.fn((..._args: unknown[]) => mockCollectionRef)
const query = vi.fn((..._args: unknown[]) => mockQueryRef)
const where = vi.fn((..._args: unknown[]) => mockWhereClause)
const getDocs = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collection(...args),
  query: (...args: unknown[]) => query(...args),
  where: (...args: unknown[]) => where(...args),
  getDocs: (...args: unknown[]) => getDocs(...args),
}))

const { listContractsForLead } = await import('./contracts')

describe('listContractsForLead', () => {
  beforeEach(() => {
    collection.mockClear()
    query.mockClear()
    where.mockClear()
    getDocs.mockReset()
  })

  it('returns contracts for the given lead, mapped from Firestore docs', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'contract-1',
          data: () => ({
            offerId: 'offer-1',
            leadId: 'lead-1',
            status: 'signed',
            pdfStoragePath: 'contracts/contract-1.pdf',
          }),
        },
      ],
    })

    const contracts = await listContractsForLead('lead-1')

    expect(where).toHaveBeenCalledWith('leadId', '==', 'lead-1')
    expect(query).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause)
    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'contracts')
    expect(contracts).toEqual([
      {
        id: 'contract-1',
        offerId: 'offer-1',
        leadId: 'lead-1',
        status: 'signed',
        pdfStoragePath: 'contracts/contract-1.pdf',
      },
    ])
  })
})
