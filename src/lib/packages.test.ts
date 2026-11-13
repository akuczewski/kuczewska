import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDbInstance = { __brand: 'db' }
const mockCollectionRef = { __brand: 'collectionRef' }
const mockDocRef = { __brand: 'docRef' }

vi.mock('./firebase', () => ({
  getFirestoreDb: () => mockDbInstance,
}))

const addDoc = vi.fn()
const collection = vi.fn((..._args: unknown[]) => mockCollectionRef)
const getDocs = vi.fn()
const doc = vi.fn((..._args: unknown[]) => mockDocRef)
const updateDoc = vi.fn()
const deleteDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDoc(...args),
  collection: (...args: unknown[]) => collection(...args),
  getDocs: (...args: unknown[]) => getDocs(...args),
  doc: (...args: unknown[]) => doc(...args),
  updateDoc: (...args: unknown[]) => updateDoc(...args),
  deleteDoc: (...args: unknown[]) => deleteDoc(...args),
}))

const { createPackage, listPackages, setPackageActive, deletePackageById, updatePackageDetails } =
  await import('./packages')

describe('createPackage', () => {
  beforeEach(() => {
    addDoc.mockReset()
    collection.mockClear()
    addDoc.mockResolvedValue({ id: 'package-1' })
  })

  it('writes a new package as active with a price in grosze', async () => {
    const id = await createPackage({
      name: 'Sesja mieszkanie do 100m²',
      description: 'Do 25 zdjęć, czas realizacji 3 dni robocze',
      priceGrosze: 80000,
    })

    expect(id).toBe('package-1')
    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'packages')
    expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, {
      name: 'Sesja mieszkanie do 100m²',
      description: 'Do 25 zdjęć, czas realizacji 3 dni robocze',
      priceGrosze: 80000,
      active: true,
    })
  })
})

describe('listPackages', () => {
  beforeEach(() => {
    collection.mockClear()
    getDocs.mockReset()
  })

  it('returns all packages mapped from Firestore docs', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'package-1',
          data: () => ({ name: 'A', description: 'a', priceGrosze: 80000, active: true }),
        },
        {
          id: 'package-2',
          data: () => ({ name: 'B', description: 'b', priceGrosze: 150000, active: false }),
        },
      ],
    })

    const packages = await listPackages()

    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'packages')
    expect(packages).toEqual([
      { id: 'package-1', name: 'A', description: 'a', priceGrosze: 80000, active: true },
      { id: 'package-2', name: 'B', description: 'b', priceGrosze: 150000, active: false },
    ])
  })
})

describe('setPackageActive', () => {
  beforeEach(() => {
    doc.mockClear()
    updateDoc.mockReset()
    updateDoc.mockResolvedValue(undefined)
  })

  it('updates only the active field', async () => {
    await setPackageActive('package-1', false)

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'packages/package-1')
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { active: false })
  })
})

describe('updatePackageDetails', () => {
  beforeEach(() => {
    doc.mockClear()
    updateDoc.mockReset()
    updateDoc.mockResolvedValue(undefined)
  })

  it('updates name, description and priceGrosze', async () => {
    await updatePackageDetails('package-1', {
      name: 'Nowa nazwa',
      description: 'Nowy opis',
      priceGrosze: 90000,
    })

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'packages/package-1')
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, {
      name: 'Nowa nazwa',
      description: 'Nowy opis',
      priceGrosze: 90000,
    })
  })
})

describe('deletePackageById', () => {
  beforeEach(() => {
    doc.mockClear()
    deleteDoc.mockReset()
    deleteDoc.mockResolvedValue(undefined)
  })

  it('deletes the package doc', async () => {
    await deletePackageById('package-1')

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'packages/package-1')
    expect(deleteDoc).toHaveBeenCalledWith(mockDocRef)
  })
})
