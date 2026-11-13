import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import './firebaseAdmin.js'
import type { ContractPdfContent } from './lib/contractPdf.js'
import { isValidToken } from './lib/tokens.js'

export const getContractByToken = onCall({ region: 'europe-west1' }, async (request) => {
  const { contractId, token } = (request.data ?? {}) as { contractId?: unknown; token?: unknown }

  if (typeof contractId !== 'string' || contractId.length === 0 || typeof token !== 'string') {
    throw new HttpsError('invalid-argument', 'Nieprawidłowe dane żądania.')
  }

  const db = getFirestore()
  const contractSnap = await db.doc(`contracts/${contractId}`).get()
  if (!contractSnap.exists) {
    throw new HttpsError('not-found', 'Nie znaleziono umowy.')
  }
  const contract = contractSnap.data()!

  if (!isValidToken(token, contract.publicToken)) {
    throw new HttpsError('permission-denied', 'Nieprawidłowy token.')
  }

  const content = JSON.parse(contract.contentSnapshot) as ContractPdfContent

  return { ...content, status: contract.status as string }
})
