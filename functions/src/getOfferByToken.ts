import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import './firebaseAdmin.js'
import { isValidToken } from './lib/tokens.js'

export const getOfferByToken = onCall({ region: 'europe-west1' }, async (request) => {
  const { offerId, token } = (request.data ?? {}) as { offerId?: unknown; token?: unknown }

  if (typeof offerId !== 'string' || offerId.length === 0 || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Nieprawidłowe dane żądania.')
  }

  const db = getFirestore()
  const offerSnap = await db.doc(`offers/${offerId}`).get()
  if (!offerSnap.exists) {
    throw new HttpsError('not-found', 'Nie znaleziono oferty.')
  }
  const offer = offerSnap.data()!

  if (!isValidToken(token, offer.publicToken)) {
    throw new HttpsError('permission-denied', 'Nieprawidłowy token.')
  }

  const leadSnap = await db.doc(`leads/${offer.leadId}`).get()
  const lead = leadSnap.data()

  return {
    leadName: lead?.name ?? '',
    lines: offer.lines,
    totalPriceGrosze: offer.totalPriceGrosze,
    status: offer.status,
  }
})
