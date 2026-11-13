import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import './firebaseAdmin.js'
import { getOrCreateClientAccount } from './lib/clientAccount.js'
import { buildPasswordSetupEmail } from './lib/emailTemplates.js'
import { sendEmailViaResend } from './lib/resend.js'

export const createClient = onCall({ region: 'europe-west1', secrets: ['RESEND_API_KEY'] }, async (request) => {
  if (request.auth?.token?.admin !== true) {
    throw new HttpsError('permission-denied', 'Tylko admin może dodawać klientów.')
  }

  const { name, email, phone } = (request.data ?? {}) as {
    name?: unknown
    email?: unknown
    phone?: unknown
  }

  if (typeof name !== 'string' || name.length === 0 || typeof email !== 'string' || email.length === 0) {
    throw new HttpsError('invalid-argument', 'Imię i e-mail są wymagane.')
  }
  const phoneValue = typeof phone === 'string' && phone.length > 0 ? phone : null

  const { uid: clientUid, isNew } = await getOrCreateClientAccount(email, name)

  const db = getFirestore()
  const leadRef = db.collection('leads').doc()
  await leadRef.set({
    name,
    email,
    phone: phoneValue,
    message: null,
    source: 'manual',
    status: 'accepted',
    clientUid,
    createdAt: FieldValue.serverTimestamp(),
  })

  if (isNew) {
    const auth = getAuth()
    const resetLink = await auth.generatePasswordResetLink(email)
    const emailContent = buildPasswordSetupEmail({ leadName: name, resetLink })
    await sendEmailViaResend({ to: email, subject: emailContent.subject, html: emailContent.html })
  }

  return { leadId: leadRef.id, clientUid }
})
