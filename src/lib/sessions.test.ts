import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDbInstance = { __brand: 'db' }
const mockCollectionRef = { __brand: 'collectionRef' }
const mockDocRef = { __brand: 'docRef' }
const mockQueryRef = { __brand: 'queryRef' }
const mockWhereClause = { __brand: 'whereClause' }

vi.mock('./firebase', () => ({
  getFirestoreDb: () => mockDbInstance,
}))

const addDoc = vi.fn()
const collection = vi.fn((..._args: unknown[]) => mockCollectionRef)
const serverTimestamp = vi.fn(() => 'server-timestamp-sentinel')
const doc = vi.fn((..._args: unknown[]) => mockDocRef)
const updateDoc = vi.fn()
const getDoc = vi.fn()
const getDocs = vi.fn()
const query = vi.fn((..._args: unknown[]) => mockQueryRef)
const where = vi.fn((..._args: unknown[]) => mockWhereClause)

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDoc(...args),
  collection: (...args: unknown[]) => collection(...args),
  serverTimestamp: () => serverTimestamp(),
  doc: (...args: unknown[]) => doc(...args),
  updateDoc: (...args: unknown[]) => updateDoc(...args),
  getDoc: (...args: unknown[]) => getDoc(...args),
  getDocs: (...args: unknown[]) => getDocs(...args),
  query: (...args: unknown[]) => query(...args),
  where: (...args: unknown[]) => where(...args),
}))

const { createSession, setSessionStatus, getSession, listSessionsForClient, listAllSessions } =
  await import('./sessions')

describe('createSession', () => {
  beforeEach(() => {
    addDoc.mockReset()
    collection.mockClear()
  })

  it('writes a new session document with status "raw" and returns its id', async () => {
    addDoc.mockResolvedValue({ id: 'session-42' })

    const id = await createSession({ clientUid: 'client-1', title: 'Sesja Mokotów' })

    expect(id).toBe('session-42')
    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'sessions')
    expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, {
      clientUid: 'client-1',
      title: 'Sesja Mokotów',
      status: 'raw',
      selectionLimit: null,
      createdAt: 'server-timestamp-sentinel',
    })
  })

  it('stores the number of photos included in the package when given', async () => {
    addDoc.mockResolvedValue({ id: 'session-43' })

    await createSession({ clientUid: 'client-1', title: 'Sesja Mokotów', selectionLimit: 20 })

    expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, expect.objectContaining({ selectionLimit: 20 }))
  })
})

describe('setSessionStatus', () => {
  beforeEach(() => {
    doc.mockClear()
    updateDoc.mockReset()
    updateDoc.mockResolvedValue(undefined)
  })

  it('updates the status field on the session doc', async () => {
    await setSessionStatus('session-1', 'finished')

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'sessions/session-1')
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { status: 'finished' })
  })
})

describe('getSession', () => {
  beforeEach(() => {
    doc.mockClear()
    getDoc.mockReset()
  })

  it('returns the session with its id when it exists', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'session-1',
      data: () => ({ clientUid: 'client-1', title: 'Sesja Mokotów', status: 'raw' }),
    })

    const session = await getSession('session-1')

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'sessions/session-1')
    expect(session).toEqual({
      id: 'session-1',
      clientUid: 'client-1',
      title: 'Sesja Mokotów',
      status: 'raw',
    })
  })

  it('returns null when the session does not exist', async () => {
    getDoc.mockResolvedValue({ exists: () => false })

    const session = await getSession('missing')

    expect(session).toBeNull()
  })
})

describe('listSessionsForClient', () => {
  beforeEach(() => {
    collection.mockClear()
    query.mockClear()
    where.mockClear()
    getDocs.mockReset()
  })

  it('lists sessions filtered by clientUid', async () => {
    getDocs.mockResolvedValue({
      docs: [
        { id: 'session-1', data: () => ({ clientUid: 'client-1', title: 'A', status: 'raw' }) },
      ],
    })

    const sessions = await listSessionsForClient('client-1')

    expect(where).toHaveBeenCalledWith('clientUid', '==', 'client-1')
    expect(query).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause)
    expect(sessions).toEqual([{ id: 'session-1', clientUid: 'client-1', title: 'A', status: 'raw' }])
  })
})

describe('listAllSessions', () => {
  beforeEach(() => {
    collection.mockClear()
    getDocs.mockReset()
  })

  it('lists every session', async () => {
    getDocs.mockResolvedValue({
      docs: [
        { id: 'session-1', data: () => ({ clientUid: 'client-1', title: 'A', status: 'raw' }) },
        { id: 'session-2', data: () => ({ clientUid: 'client-2', title: 'B', status: 'finished' }) },
      ],
    })

    const sessions = await listAllSessions()

    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'sessions')
    expect(sessions).toHaveLength(2)
  })
})
