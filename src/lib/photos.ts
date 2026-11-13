import { addDoc, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { getBlob, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { getFirebaseStorage, getFirestoreDb } from './firebase'
import { watermarkImage } from './watermark'

export type PhotoType = 'raw' | 'finished'

export type Photo = {
  id: string
  type: PhotoType
  storagePath: string
  selectedByClient: boolean
  /** File name on the photographer's disk at upload time — lets her find the picked frames. */
  originalName?: string | null
  /** Retouching note the client left on a picked frame. */
  clientNote?: string | null
}

function fileNameOf(file: Blob): string | null {
  return typeof File !== 'undefined' && file instanceof File && file.name ? file.name : null
}

export type UploadRawPhotoDeps = {
  watermark?: (blob: Blob) => Promise<Blob>
  newPhotoId?: () => string
}

export async function uploadRawPhoto(
  sessionId: string,
  file: Blob,
  deps: UploadRawPhotoDeps = {},
): Promise<string> {
  const watermark = deps.watermark ?? watermarkImage
  const newPhotoId = deps.newPhotoId ?? (() => crypto.randomUUID())

  const watermarkedBlob = await watermark(file)

  const photoId = newPhotoId()
  const storagePath = `sessions/${sessionId}/raw/${photoId}.jpg`
  await uploadBytes(ref(getFirebaseStorage(), storagePath), watermarkedBlob)

  await addDoc(collection(getFirestoreDb(), `sessions/${sessionId}/photos`), {
    type: 'raw' satisfies PhotoType,
    storagePath,
    selectedByClient: false,
    originalName: fileNameOf(file),
    clientNote: null,
  })

  return photoId
}

export type UploadFinishedPhotoDeps = {
  newPhotoId?: () => string
}

export async function uploadFinishedPhoto(
  sessionId: string,
  file: Blob,
  deps: UploadFinishedPhotoDeps = {},
): Promise<string> {
  const newPhotoId = deps.newPhotoId ?? (() => crypto.randomUUID())

  const photoId = newPhotoId()
  const storagePath = `sessions/${sessionId}/finished/${photoId}.jpg`
  await uploadBytes(ref(getFirebaseStorage(), storagePath), file)

  await addDoc(collection(getFirestoreDb(), `sessions/${sessionId}/photos`), {
    type: 'finished' satisfies PhotoType,
    storagePath,
    selectedByClient: false,
    originalName: fileNameOf(file),
    clientNote: null,
  })

  return photoId
}

export async function listSessionPhotos(sessionId: string, type?: PhotoType): Promise<Photo[]> {
  const photosCollection = collection(getFirestoreDb(), `sessions/${sessionId}/photos`)
  const target = type ? query(photosCollection, where('type', '==', type)) : photosCollection
  const snapshot = await getDocs(target)

  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Photo, 'id'>),
  }))
}

export async function getPhotoDownloadUrl(storagePath: string): Promise<string> {
  return getDownloadURL(ref(getFirebaseStorage(), storagePath))
}

export function selectPhotosMarkedByClient(photos: Photo[]): Photo[] {
  return photos.filter((photo) => photo.type === 'raw' && photo.selectedByClient)
}

export async function setPhotoSelection(
  sessionId: string,
  photoId: string,
  selected: boolean,
): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), `sessions/${sessionId}/photos/${photoId}`), {
    selectedByClient: selected,
  })
}

export async function setPhotoNote(sessionId: string, photoId: string, note: string): Promise<void> {
  const trimmed = note.trim()
  await updateDoc(doc(getFirestoreDb(), `sessions/${sessionId}/photos/${photoId}`), {
    clientNote: trimmed.length > 0 ? trimmed : null,
  })
}

/** Full file as a Blob — needed for real downloads (a cross-origin <a download> only opens a tab). */
export async function getPhotoBlob(storagePath: string): Promise<Blob> {
  return getBlob(ref(getFirebaseStorage(), storagePath))
}
