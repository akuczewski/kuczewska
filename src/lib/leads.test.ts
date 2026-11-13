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
const getDocs = vi.fn()
const getDoc = vi.fn()
const doc = vi.fn((..._args: unknown[]) => mockDocRef)
const updateDoc = vi.fn()
const serverTimestamp = vi.fn(() => 'server-timestamp-sentinel')
const query = vi.fn((..._args: unknown[]) => mockQueryRef)
const where = vi.fn((..._args: unknown[]) => mockWhereClause)

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDoc(...args),
  collection: (...args: unknown[]) => collection(...args),
  getDocs: (...args: unknown[]) => getDocs(...args),
  getDoc: (...args: unknown[]) => getDoc(...args),
  doc: (...args: unknown[]) => doc(...args),
  updateDoc: (...args: unknown[]) => updateDoc(...args),
  serverTimestamp: () => serverTimestamp(),
  query: (...args: unknown[]) => query(...args),
  where: (...args: unknown[]) => where(...args),
}))

const {
  createManualLead,
  listLeads,
  listClients,
  getLead,
  setLeadStatus,
  updateLeadContactInfo,
  submitContactFormLead,
} = await import('./leads')

describe('createManualLead', () => {
  beforeEach(() => {
    addDoc.mockReset()
    collection.mockClear()
    addDoc.mockResolvedValue({ id: 'lead-1' })
  })

  it('writes a new lead with source "manual" and status "new"', async () => {
    const id = await createManualLead({
      name: 'Jan Kowalski',
      email: 'jan@example.com',
      phone: '500600700',
      message: 'Sesja mieszkania 60m2',
    })

    expect(id).toBe('lead-1')
    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'leads')
    expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, {
      name: 'Jan Kowalski',
      email: 'jan@example.com',
      phone: '500600700',
      message: 'Sesja mieszkania 60m2',
      source: 'manual',
      status: 'new',
      createdAt: 'server-timestamp-sentinel',
    })
  })

  it('defaults phone/message to null when omitted', async () => {
    await createManualLead({ name: 'Anna Nowak', email: 'anna@example.com' })

    expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, {
      name: 'Anna Nowak',
      email: 'anna@example.com',
      phone: null,
      message: null,
      source: 'manual',
      status: 'new',
      createdAt: 'server-timestamp-sentinel',
    })
  })
})

describe('listLeads', () => {
  beforeEach(() => {
    collection.mockClear()
    getDocs.mockReset()
  })

  it('returns all leads mapped from Firestore docs', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'lead-1',
          data: () => ({
            name: 'Jan',
            email: 'jan@example.com',
            phone: null,
            message: null,
            source: 'manual',
            status: 'new',
          }),
        },
      ],
    })

    const leads = await listLeads()

    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'leads')
    expect(leads).toEqual([
      {
        id: 'lead-1',
        name: 'Jan',
        email: 'jan@example.com',
        phone: null,
        message: null,
        source: 'manual',
        status: 'new',
      },
    ])
  })
})

describe('listClients', () => {
  beforeEach(() => {
    collection.mockClear()
    query.mockClear()
    where.mockClear()
    getDocs.mockReset()
  })

  it('returns only leads with status "accepted"', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'lead-1',
          data: () => ({
            name: 'Jan',
            email: 'jan@example.com',
            phone: null,
            message: null,
            source: 'manual',
            status: 'accepted',
          }),
        },
      ],
    })

    const clients = await listClients()

    expect(where).toHaveBeenCalledWith('status', '==', 'accepted')
    expect(query).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause)
    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'leads')
    expect(clients).toEqual([
      {
        id: 'lead-1',
        name: 'Jan',
        email: 'jan@example.com',
        phone: null,
        message: null,
        source: 'manual',
        status: 'accepted',
      },
    ])
  })
})

describe('submitContactFormLead', () => {
  beforeEach(() => {
    addDoc.mockReset()
    collection.mockClear()
    addDoc.mockResolvedValue({ id: 'lead-2' })
  })

  it('writes a lead with source "contact_form" and status "new"', async () => {
    await submitContactFormLead({
      name: 'Piotr Wiśniewski',
      email: 'piotr@example.com',
      message: 'Interesuje mnie sesja domu',
    })

    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'leads')
    expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, {
      name: 'Piotr Wiśniewski',
      email: 'piotr@example.com',
      phone: null,
      message: 'Interesuje mnie sesja domu',
      source: 'contact_form',
      status: 'new',
      createdAt: 'server-timestamp-sentinel',
    })
  })

  it('stores the phone number when the visitor provides one', async () => {
    await submitContactFormLead({
      name: 'Piotr Wiśniewski',
      email: 'piotr@example.com',
      phone: ' 500 600 700 ',
      message: 'Interesuje mnie sesja domu',
    })

    expect(addDoc).toHaveBeenCalledWith(
      mockCollectionRef,
      expect.objectContaining({ phone: '500 600 700' }),
    )
  })
})

describe('setLeadStatus', () => {
  beforeEach(() => {
    doc.mockClear()
    updateDoc.mockReset()
    updateDoc.mockResolvedValue(undefined)
  })

  it('updates only the status field', async () => {
    await setLeadStatus('lead-1', 'archived')

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'leads/lead-1')
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { status: 'archived' })
  })
})

describe('getLead', () => {
  beforeEach(() => {
    doc.mockClear()
    getDoc.mockReset()
  })

  it('returns the lead with its id when it exists', async () => {
    getDoc.mockResolvedValue({
      exists: () => true,
      id: 'lead-1',
      data: () => ({
        name: 'Jan',
        email: 'jan@example.com',
        phone: null,
        message: null,
        source: 'manual',
        status: 'new',
      }),
    })

    const lead = await getLead('lead-1')

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'leads/lead-1')
    expect(lead).toEqual({
      id: 'lead-1',
      name: 'Jan',
      email: 'jan@example.com',
      phone: null,
      message: null,
      source: 'manual',
      status: 'new',
    })
  })

  it('returns null when the lead does not exist', async () => {
    getDoc.mockResolvedValue({ exists: () => false })

    expect(await getLead('missing')).toBeNull()
  })
})

describe('updateLeadContactInfo', () => {
  beforeEach(() => {
    doc.mockClear()
    updateDoc.mockReset()
    updateDoc.mockResolvedValue(undefined)
  })

  it('updates only the phone and message fields', async () => {
    await updateLeadContactInfo('lead-1', { phone: '600700800', message: 'Zaktualizowana wiadomość' })

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'leads/lead-1')
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
      phone: '600700800',
      message: 'Zaktualizowana wiadomość',
    })
  })
})
