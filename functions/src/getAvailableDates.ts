import { getFirestore } from 'firebase-admin/firestore'
import { onCall } from 'firebase-functions/v2/https'
import './firebaseAdmin.js'

export const getAvailableDates = onCall({ region: 'europe-west1' }, async () => {
  const db = getFirestore()
  const snapshot = await db.collection('bookings').get()
  const bookedDates = snapshot.docs.map((doc) => doc.id)
  return { bookedDates }
})
