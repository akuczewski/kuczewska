import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import './firebaseAdmin.js'
import { buildContractEmail } from './lib/emailTemplates.js'
import { buildContractPdfContent } from './lib/contractPdf.js'
import { renderContractPdf } from './lib/contractPdfRender.js'
import { sendEmailViaResend } from './lib/resend.js'
import { generatePublicToken, isValidToken } from './lib/tokens.js'

export const respondToOffer = onCall({ region: 'europe-west1', secrets: ['RESEND_API_KEY'] }, async (request) => {
  const { offerId, token, decision } = (request.data ?? {}) as {
    offerId?: unknown
    token?: unknown
    decision?: unknown
  }

  if (
    typeof offerId !== 'string' ||
    offerId.length === 0 ||
    typeof token !== 'string' ||
    (decision !== 'accept' && decision !== 'reject')
  ) {
    throw new HttpsError('invalid-argument', 'Nieprawidłowe dane żądania.')
  }

  const db = getFirestore()
  const offerRef = db.doc(`offers/${offerId}`)
  const offerSnap = await offerRef.get()
  if (!offerSnap.exists) {
    throw new HttpsError('not-found', 'Nie znaleziono oferty.')
  }
  const offer = offerSnap.data()!

  if (!isValidToken(token, offer.publicToken)) {
    throw new HttpsError('permission-denied', 'Nieprawidłowy token.')
  }
  if (offer.status !== 'sent') {
    throw new HttpsError('failed-precondition', 'Ta oferta została już rozpatrzona.')
  }

  const leadRef = db.doc(`leads/${offer.leadId}`)

  if (decision === 'reject') {
    await offerRef.update({ status: 'rejected', respondedAt: FieldValue.serverTimestamp() })
    await leadRef.update({ status: 'rejected' })
    return { status: 'rejected' as const }
  }

  await offerRef.update({ status: 'accepted', respondedAt: FieldValue.serverTimestamp() })
  await leadRef.update({ status: 'accepted' })

  const leadSnap = await leadRef.get()
  const lead = leadSnap.data()!

  const contractToken = generatePublicToken()
  const contractContent = buildContractPdfContent({
    leadName: lead.name,
    lines: offer.lines,
    totalPriceGrosze: offer.totalPriceGrosze,
  })
  const pdfBytes = await renderContractPdf(contractContent)

  const contractRef = db.collection('contracts').doc()
  const storagePath = `contracts/${contractRef.id}.pdf`
  await getStorage().bucket().file(storagePath).save(Buffer.from(pdfBytes), {
    contentType: 'application/pdf',
  })

  await contractRef.set({
    offerId,
    leadId: offer.leadId,
    publicToken: contractToken,
    status: 'pending',
    pdfStoragePath: storagePath,
    contentSnapshot: JSON.stringify(contractContent),
    signedAt: null,
    signedIp: null,
    signedUserAgent: null,
    createdAt: FieldValue.serverTimestamp(),
  })

  const appUrl = process.env.PUBLIC_APP_URL ?? 'https://kuczewska.com'
  const contractUrl = `${appUrl}/#/contract/${contractRef.id}?token=${contractToken}`
  const email = buildContractEmail({ leadName: lead.name, contractUrl })
  await sendEmailViaResend({ to: lead.email, subject: email.subject, html: email.html })

  return { status: 'accepted' as const, contractId: contractRef.id }
})
