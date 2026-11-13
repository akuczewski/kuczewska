import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { getFirestoreDb } from './firebase'

export type SessionStatus = 'raw' | 'selection_done' | 'finished'

export type NewSession = {
  clientUid: string
  title: string
  /** How many retouched photos the client's package includes; null = no stated limit. */
  selectionLimit?: number | null
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  raw: 'Wybór zdjęć',
  selection_done: 'Wybór zatwierdzony — w obróbce',
  finished: 'Gotowe do pobrania',
}

export function sessionStatusLabel(status: SessionStatus): string {
  return STATUS_LABELS[status] ?? status
}

export type Session = {
  id: string
  clientUid: string
  title: string
  status: SessionStatus
  selectionLimit?: number | null
}

export async function createSession(input: NewSession): Promise<string> {
  const ref = await addDoc(collection(getFirestoreDb(), 'sessions'), {
    clientUid: input.clientUid,
    title: input.title,
    status: 'raw',
    selectionLimit: input.selectionLimit ?? null,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function setSessionStatus(sessionId: string, status: SessionStatus): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), `sessions/${sessionId}`), { status })
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const snapshot = await getDoc(doc(getFirestoreDb(), `sessions/${sessionId}`))
  if (!snapshot.exists()) {
    return null
  }
  return { id: snapshot.id, ...(snapshot.data() as Omit<Session, 'id'>) }
}

export async function listSessionsForClient(clientUid: string): Promise<Session[]> {
  const sessionsCollection = collection(getFirestoreDb(), 'sessions')
  const snapshot = await getDocs(query(sessionsCollection, where('clientUid', '==', clientUid)))
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Session, 'id'>),
  }))
}

export async function listAllSessions(): Promise<Session[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), 'sessions'))
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Session, 'id'>),
  }))
}
