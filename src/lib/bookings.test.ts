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

const { listBookingsForLead } = await import('./bookings')

describe('listBookingsForLead', () => {
  beforeEach(() => {
    collection.mockClear()
    query.mockClear()
    where.mockClear()
    getDocs.mockReset()
  })

  it('returns bookings for the given lead, using the doc id as the date', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: '2026-09-01',
          data: () => ({ contractId: 'contract-1', leadId: 'lead-1', sessionId: 'session-1' }),
        },
      ],
    })

    const bookings = await listBookingsForLead('lead-1')

    expect(where).toHaveBeenCalledWith('leadId', '==', 'lead-1')
    expect(query).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause)
    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'bookings')
    expect(bookings).toEqual([
      { date: '2026-09-01', contractId: 'contract-1', leadId: 'lead-1', sessionId: 'session-1' },
    ])
  })
})
