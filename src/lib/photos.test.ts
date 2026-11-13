import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockDbInstance = { __brand: 'db' }
const mockStorageInstance = { __brand: 'storage' }
const mockCollectionRef = { __brand: 'collectionRef' }
const mockStorageRef = { __brand: 'storageRef' }
const mockDocRef = { __brand: 'docRef' }

vi.mock('./firebase', () => ({
  getFirestoreDb: () => mockDbInstance,
  getFirebaseStorage: () => mockStorageInstance,
}))

const mockQueryRef = { __brand: 'queryRef' }
const mockWhereClause = { __brand: 'whereClause' }

const addDoc = vi.fn()
const collection = vi.fn((..._args: unknown[]) => mockCollectionRef)
const query = vi.fn((..._args: unknown[]) => mockQueryRef)
const where = vi.fn((..._args: unknown[]) => mockWhereClause)
const getDocs = vi.fn()
const doc = vi.fn((..._args: unknown[]) => mockDocRef)
const updateDoc = vi.fn()
const ref = vi.fn((..._args: unknown[]) => mockStorageRef)
const uploadBytes = vi.fn()
const getDownloadURL = vi.fn()
const getBlob = vi.fn()

vi.mock('firebase/firestore', () => ({
  addDoc: (...args: unknown[]) => addDoc(...args),
  collection: (...args: unknown[]) => collection(...args),
  query: (...args: unknown[]) => query(...args),
  where: (...args: unknown[]) => where(...args),
  getDocs: (...args: unknown[]) => getDocs(...args),
  doc: (...args: unknown[]) => doc(...args),
  updateDoc: (...args: unknown[]) => updateDoc(...args),
}))

vi.mock('firebase/storage', () => ({
  ref: (...args: unknown[]) => ref(...args),
  uploadBytes: (...args: unknown[]) => uploadBytes(...args),
  getDownloadURL: (...args: unknown[]) => getDownloadURL(...args),
  getBlob: (...args: unknown[]) => getBlob(...args),
}))

const {
  uploadRawPhoto,
  uploadFinishedPhoto,
  listSessionPhotos,
  getPhotoDownloadUrl,
  setPhotoSelection,
  setPhotoNote,
  getPhotoBlob,
  selectPhotosMarkedByClient,
} = await import('./photos')

describe('uploadRawPhoto', () => {
  beforeEach(() => {
    addDoc.mockReset()
    collection.mockClear()
    ref.mockClear()
    uploadBytes.mockReset()
    addDoc.mockResolvedValue({ id: 'photo-doc-1' })
    uploadBytes.mockResolvedValue(undefined)
  })

  it('watermarks the file before uploading it, never the original', async () => {
    const original = new Blob(['raw-bytes'], { type: 'image/jpeg' })
    const watermarked = new Blob(['watermarked-bytes'], { type: 'image/jpeg' })
    const watermark = vi.fn().mockResolvedValue(watermarked)

    await uploadRawPhoto('session-1', original, { watermark })

    expect(watermark).toHaveBeenCalledWith(original)
    expect(uploadBytes).toHaveBeenCalledWith(mockStorageRef, watermarked)
  })

  it('stores the raw photo under sessions/{sessionId}/raw/ and records a Firestore doc', async () => {
    const watermark = vi.fn().mockResolvedValue(new Blob(['x']))

    await uploadRawPhoto('session-1', new Blob(['x']), { watermark })

    const storagePath = ref.mock.calls[0]![1] as string
    expect(storagePath).toMatch(/^sessions\/session-1\/raw\/.+\.jpg$/)

    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'sessions/session-1/photos')
    expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, {
      type: 'raw',
      storagePath,
      selectedByClient: false,
      originalName: null,
      clientNote: null,
    })
  })

  it('records the original file name so the photographer can find the frame on disk', async () => {
    const watermark = vi.fn().mockResolvedValue(new Blob(['x']))
    const file = new File(['x'], 'DSC_0412.jpg', { type: 'image/jpeg' })

    await uploadRawPhoto('session-1', file, { watermark })

    expect(addDoc).toHaveBeenCalledWith(
      mockCollectionRef,
      expect.objectContaining({ originalName: 'DSC_0412.jpg' }),
    )
  })
})

describe('uploadFinishedPhoto', () => {
  beforeEach(() => {
    addDoc.mockReset()
    collection.mockClear()
    ref.mockClear()
    uploadBytes.mockReset()
    addDoc.mockResolvedValue({ id: 'photo-doc-2' })
    uploadBytes.mockResolvedValue(undefined)
  })

  it('uploads the file as-is (no watermark) under sessions/{sessionId}/finished/', async () => {
    const finished = new Blob(['retouched-bytes'], { type: 'image/jpeg' })

    await uploadFinishedPhoto('session-1', finished)

    const storagePath = ref.mock.calls[0]![1] as string
    expect(storagePath).toMatch(/^sessions\/session-1\/finished\/.+\.jpg$/)
    expect(uploadBytes).toHaveBeenCalledWith(mockStorageRef, finished)

    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'sessions/session-1/photos')
    expect(addDoc).toHaveBeenCalledWith(mockCollectionRef, {
      type: 'finished',
      storagePath,
      selectedByClient: false,
      originalName: null,
      clientNote: null,
    })
  })
})

describe('listSessionPhotos', () => {
  beforeEach(() => {
    collection.mockClear()
    query.mockClear()
    where.mockClear()
    getDocs.mockReset()
  })

  it('returns photos of the session mapped from Firestore docs', async () => {
    getDocs.mockResolvedValue({
      docs: [
        {
          id: 'photo-1',
          data: () => ({ type: 'raw', storagePath: 'sessions/session-1/raw/photo-1.jpg', selectedByClient: false }),
        },
        {
          id: 'photo-2',
          data: () => ({ type: 'raw', storagePath: 'sessions/session-1/raw/photo-2.jpg', selectedByClient: true }),
        },
      ],
    })

    const photos = await listSessionPhotos('session-1')

    expect(collection).toHaveBeenCalledWith(mockDbInstance, 'sessions/session-1/photos')
    expect(photos).toEqual([
      { id: 'photo-1', type: 'raw', storagePath: 'sessions/session-1/raw/photo-1.jpg', selectedByClient: false },
      { id: 'photo-2', type: 'raw', storagePath: 'sessions/session-1/raw/photo-2.jpg', selectedByClient: true },
    ])
  })

  it('filters by photo type when provided', async () => {
    getDocs.mockResolvedValue({ docs: [] })

    await listSessionPhotos('session-1', 'raw')

    expect(where).toHaveBeenCalledWith('type', '==', 'raw')
    expect(query).toHaveBeenCalledWith(mockCollectionRef, mockWhereClause)
    expect(getDocs).toHaveBeenCalledWith(mockQueryRef)
  })
})

describe('getPhotoDownloadUrl', () => {
  it('resolves a download URL for the given storage path', async () => {
    getDownloadURL.mockResolvedValue('https://example.com/photo-1.jpg')

    const url = await getPhotoDownloadUrl('sessions/session-1/raw/photo-1.jpg')

    expect(ref).toHaveBeenCalledWith(mockStorageInstance, 'sessions/session-1/raw/photo-1.jpg')
    expect(url).toBe('https://example.com/photo-1.jpg')
  })
})

describe('setPhotoSelection', () => {
  beforeEach(() => {
    doc.mockClear()
    updateDoc.mockReset()
    updateDoc.mockResolvedValue(undefined)
  })

  it('updates only the selectedByClient field on the given photo doc', async () => {
    await setPhotoSelection('session-1', 'photo-1', true)

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'sessions/session-1/photos/photo-1')
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { selectedByClient: true })
  })
})

describe('selectPhotosMarkedByClient', () => {
  it('keeps only raw photos the client has selected', () => {
    const photos = [
      { id: 'photo-1', type: 'raw' as const, storagePath: 'a', selectedByClient: true },
      { id: 'photo-2', type: 'raw' as const, storagePath: 'b', selectedByClient: false },
      { id: 'photo-3', type: 'finished' as const, storagePath: 'c', selectedByClient: true },
    ]

    expect(selectPhotosMarkedByClient(photos)).toEqual([
      { id: 'photo-1', type: 'raw', storagePath: 'a', selectedByClient: true },
    ])
  })
})

describe('setPhotoNote', () => {
  beforeEach(() => {
    doc.mockClear()
    updateDoc.mockReset()
  })

  it('saves the trimmed note on the photo doc', async () => {
    await setPhotoNote('session-1', 'photo-1', '  Usunąć kabel przy lampie ')

    expect(doc).toHaveBeenCalledWith(mockDbInstance, 'sessions/session-1/photos/photo-1')
    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { clientNote: 'Usunąć kabel przy lampie' })
  })

  it('clears the note when the client empties the field', async () => {
    await setPhotoNote('session-1', 'photo-1', '   ')

    expect(updateDoc).toHaveBeenCalledWith(mockDocRef, { clientNote: null })
  })
})

describe('getPhotoBlob', () => {
  it('fetches the file from Storage as a Blob', async () => {
    const blob = new Blob(['bytes'])
    getBlob.mockResolvedValue(blob)

    await expect(getPhotoBlob('sessions/session-1/finished/a.jpg')).resolves.toBe(blob)
    expect(ref).toHaveBeenCalledWith(mockStorageInstance, 'sessions/session-1/finished/a.jpg')
  })
})
