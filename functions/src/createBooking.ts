import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import './firebaseAdmin.js'
import { getOrCreateClientAccount } from './lib/clientAccount.js'
import { buildPasswordSetupEmail } from './lib/emailTemplates.js'
import { sendEmailViaResend } from './lib/resend.js'
import { isValidToken } from './lib/tokens.js'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const createBooking = onCall({ region: 'europe-west1', secrets: ['RESEND_API_KEY'] }, async (request) => {
  const { contractId, token, date } = (request.data ?? {}) as {
    contractId?: unknown
    token?: unknown
    date?: unknown
  }

  if (
    typeof contractId !== 'string' ||
    contractId.length === 0 ||
    typeof token !== 'string' ||
    typeof date !== 'string' ||
    !DATE_PATTERN.test(date)
  ) {
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
  if (contract.status !== 'signed') {
    throw new HttpsError('failed-precondition', 'Umowa musi być podpisana przed rezerwacją terminu.')
  }

  const leadRef = db.doc(`leads/${contract.leadId}`)
  const leadSnap = await leadRef.get()
  const lead = leadSnap.data()!
  const offerSnap = await db.doc(`offers/${contract.offerId}`).get()
  const offer = offerSnap.data()
  const sessionTitle =
    (offer?.lines as Array<{ name: string }> | undefined)?.map((line) => line.name).join(', ') ??
    'Sesja zdjęciowa'

  const { uid: clientUid, isNew: isNewUser } = await getOrCreateClientAccount(lead.email, lead.name)

  const bookingRef = db.doc(`bookings/${date}`)
  const sessionRef = db.collection('sessions').doc()

  await db.runTransaction(async (tx) => {
    const existingBooking = await tx.get(bookingRef)
    if (existingBooking.exists) {
      throw new HttpsError('already-exists', 'Ten termin jest już zajęty. Wybierz inny.')
    }

    tx.set(bookingRef, {
      contractId,
      leadId: contract.leadId,
      sessionId: sessionRef.id,
      createdAt: FieldValue.serverTimestamp(),
    })

    tx.set(sessionRef, {
      clientUid,
      title: sessionTitle,
      status: 'raw',
      createdAt: FieldValue.serverTimestamp(),
    })

    tx.update(leadRef, { clientUid })
  })

  if (isNewUser) {
    const auth = getAuth()
    const resetLink = await auth.generatePasswordResetLink(lead.email)
    const email = buildPasswordSetupEmail({ leadName: lead.name, resetLink })
    await sendEmailViaResend({ to: lead.email, subject: email.subject, html: email.html })
  }

  return { sessionId: sessionRef.id, bookingDate: date }
})
