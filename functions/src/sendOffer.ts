import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import './firebaseAdmin.js'
import { buildOfferEmail } from './lib/emailTemplates.js'
import { buildOfferPdfContent } from './lib/offerPdf.js'
import { renderOfferPdf } from './lib/offerPdfRender.js'
import { sendEmailViaResend } from './lib/resend.js'
import { generatePublicToken } from './lib/tokens.js'

const OFFER_VALIDITY_DAYS = 7

export const sendOffer = onCall({ region: 'europe-west1', secrets: ['RESEND_API_KEY'] }, async (request) => {
  if (request.auth?.token?.admin !== true) {
    throw new HttpsError('permission-denied', 'Tylko admin może wysyłać oferty.')
  }

  const offerId = request.data?.offerId
  if (typeof offerId !== 'string' || offerId.length === 0) {
    throw new HttpsError('invalid-argument', 'Brak offerId.')
  }

  const db = getFirestore()
  const offerRef = db.doc(`offers/${offerId}`)
  const offerSnap = await offerRef.get()
  if (!offerSnap.exists) {
    throw new HttpsError('not-found', 'Nie znaleziono oferty.')
  }
  const offer = offerSnap.data()!

  const leadRef = db.doc(`leads/${offer.leadId}`)
  const leadSnap = await leadRef.get()
  if (!leadSnap.exists) {
    throw new HttpsError('not-found', 'Nie znaleziono leada dla tej oferty.')
  }
  const lead = leadSnap.data()!

  const token = generatePublicToken()
  const validUntil = new Date(Date.now() + OFFER_VALIDITY_DAYS * 24 * 60 * 60 * 1000)

  const content = buildOfferPdfContent({
    leadName: lead.name,
    lines: offer.lines,
    totalPriceGrosze: offer.totalPriceGrosze,
    validUntil,
  })
  const pdfBytes = await renderOfferPdf(content)

  const storagePath = `offers/${offerId}.pdf`
  await getStorage().bucket().file(storagePath).save(Buffer.from(pdfBytes), {
    contentType: 'application/pdf',
  })

  const appUrl = process.env.PUBLIC_APP_URL ?? 'https://kuczewska.com'
  const offerUrl = `${appUrl}/#/offer/${offerId}?token=${token}`
  const email = buildOfferEmail({ leadName: lead.name, offerUrl })
  await sendEmailViaResend({ to: lead.email, subject: email.subject, html: email.html })

  await offerRef.update({
    status: 'sent',
    publicToken: token,
    pdfStoragePath: storagePath,
    validUntil,
  })
  await leadRef.update({ status: 'offer_sent' })

  return { ok: true }
})
