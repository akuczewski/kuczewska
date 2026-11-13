import { collection, getDocs, query, where } from 'firebase/firestore'
import { getFirestoreDb } from './firebase'

export type Booking = {
  date: string
  contractId: string
  leadId: string
  sessionId: string
}

export async function listBookingsForLead(leadId: string): Promise<Booking[]> {
  const bookingsCollection = collection(getFirestoreDb(), 'bookings')
  const snapshot = await getDocs(query(bookingsCollection, where('leadId', '==', leadId)))
  return snapshot.docs.map((docSnapshot) => ({
    date: docSnapshot.id,
    ...(docSnapshot.data() as Omit<Booking, 'date'>),
  }))
}
