import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import './firebaseAdmin.js'
import { buildSelectionSubmittedEmail } from './lib/emailTemplates.js'
import { sendEmailViaResend } from './lib/resend.js'
import { type SelectedPhotoDoc, buildSelectionSummary, checkCanSubmitSelection } from './lib/selection.js'

/**
 * The logged-in client confirms their picks: the session leaves 'raw' (which
 * locks hearts and notes in firestore.rules) and the photographer gets the
 * list of file names by e-mail.
 */
export const submitSelection = onCall({ region: 'europe-west1', secrets: ['RESEND_API_KEY'] }, async (request) => {
  const { sessionId } = (request.data ?? {}) as { sessionId?: unknown }
  if (typeof sessionId !== 'string' || sessionId.length === 0 || sessionId.includes('/')) {
    throw new HttpsError('invalid-argument', 'Brak identyfikatora sesji.')
  }

  const db = getFirestore()
  const sessionRef = db.collection('sessions').doc(sessionId)
  const selectedQuery = sessionRef.collection('photos').where('type', '==', 'raw').where('selectedByClient', '==', true)

  // Transaction: two quick clicks must not confirm (and e-mail) twice.
  const { session, photos } = await db.runTransaction(async (tx) => {
    const sessionSnap = await tx.get(sessionRef)
    const selectedSnap = await tx.get(selectedQuery)
    const sessionData = sessionSnap.data() as
      | { clientUid?: string; status?: string; title?: string; selectionLimit?: number | null }
      | undefined

    const check = checkCanSubmitSelection({
      callerUid: request.auth?.uid,
      session: sessionData,
      selectedCount: selectedSnap.size,
    })
    if (!check.ok) {
      throw new HttpsError(check.code, check.message)
    }

    tx.update(sessionRef, { status: 'selection_done', selectionSubmittedAt: FieldValue.serverTimestamp() })

    return {
      session: sessionData!,
      photos: selectedSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<SelectedPhotoDoc, 'id'>) })),
    }
  })

  const summary = buildSelectionSummary(photos)

  // The selection is already saved; a mail hiccup must not make the client think it failed.
  try {
    const appUrl = process.env.PUBLIC_APP_URL ?? 'https://kuczewska.com'
    const email = buildSelectionSubmittedEmail({
      sessionTitle: session.title ?? 'Sesja',
      clientEmail: typeof request.auth?.token?.email === 'string' ? request.auth.token.email : null,
      fileNames: summary.fileNames,
      notes: summary.notes,
      selectionLimit: typeof session.selectionLimit === 'number' ? session.selectionLimit : null,
      sessionUrl: `${appUrl}/#/admin/session/${sessionId}`,
    })
    await sendEmailViaResend({
      to: process.env.ADMIN_NOTIFY_EMAIL ?? 'anna@kuczewska.com',
      subject: email.subject,
      html: email.html,
    })
  } catch (error) {
    console.error('submitSelection: notification e-mail failed', error)
  }

  return { selectedCount: summary.fileNames.length }
})
