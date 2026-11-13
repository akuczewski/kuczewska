import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { getFirestoreDb } from './firebase'

export type LeadSource = 'contact_form' | 'manual'
export type LeadStatus = 'new' | 'offer_sent' | 'accepted' | 'rejected' | 'archived'

export type Lead = {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  source: LeadSource
  status: LeadStatus
  clientUid?: string | null
}

export type NewLead = {
  name: string
  email: string
  phone?: string | null
  message?: string | null
}

export async function createManualLead(input: NewLead): Promise<string> {
  const ref = await addDoc(collection(getFirestoreDb(), 'leads'), {
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    message: input.message ?? null,
    source: 'manual',
    status: 'new',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export type ContactFormLead = {
  name: string
  email: string
  message: string
  phone?: string | null
}

export async function submitContactFormLead(input: ContactFormLead): Promise<void> {
  await addDoc(collection(getFirestoreDb(), 'leads'), {
    name: input.name,
    email: input.email,
    phone: input.phone?.trim() || null,
    message: input.message,
    source: 'contact_form',
    status: 'new',
    createdAt: serverTimestamp(),
  })
}

export async function listLeads(): Promise<Lead[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), 'leads'))
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Lead, 'id'>),
  }))
}

export async function listClients(): Promise<Lead[]> {
  const leadsCollection = collection(getFirestoreDb(), 'leads')
  const snapshot = await getDocs(query(leadsCollection, where('status', '==', 'accepted')))
  return snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Lead, 'id'>),
  }))
}

export async function setLeadStatus(leadId: string, status: LeadStatus): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), `leads/${leadId}`), { status })
}

export async function getLead(leadId: string): Promise<Lead | null> {
  const snapshot = await getDoc(doc(getFirestoreDb(), `leads/${leadId}`))
  if (!snapshot.exists()) {
    return null
  }
  return { id: snapshot.id, ...(snapshot.data() as Omit<Lead, 'id'>) }
}

export type LeadContactInfo = {
  phone: string | null
  message: string | null
}

export async function updateLeadContactInfo(leadId: string, input: LeadContactInfo): Promise<void> {
  await updateDoc(doc(getFirestoreDb(), `leads/${leadId}`), {
    phone: input.phone,
    message: input.message,
  })
}
