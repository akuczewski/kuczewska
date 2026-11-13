import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import './firebaseAdmin.js'
import { isValidToken } from './lib/tokens.js'

export const signContract = onCall({ region: 'europe-west1' }, async (request) => {
  const { contractId, token } = (request.data ?? {}) as { contractId?: unknown; token?: unknown }

  if (typeof contractId !== 'string' || contractId.length === 0 || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Nieprawidłowe dane żądania.')
  }

  const db = getFirestore()
  const contractRef = db.doc(`contracts/${contractId}`)
  const contractSnap = await contractRef.get()
  if (!contractSnap.exists) {
    throw new HttpsError('not-found', 'Nie znaleziono umowy.')
  }
  const contract = contractSnap.data()!

  if (!isValidToken(token, contract.publicToken)) {
    throw new HttpsError('permission-denied', 'Nieprawidłowy token.')
  }
  if (contract.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Ta umowa została już podpisana.')
  }

  const ip = request.rawRequest?.ip ?? 'unknown'
  const userAgent = request.rawRequest?.headers['user-agent'] ?? 'unknown'

  await contractRef.update({
    status: 'signed',
    signedAt: FieldValue.serverTimestamp(),
    signedIp: ip,
    signedUserAgent: userAgent,
  })

  return { status: 'signed' as const }
})
