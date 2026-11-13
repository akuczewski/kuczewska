import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import './firebaseAdmin.js'
import { buildNewLeadEmail } from './lib/emailTemplates.js'
import { sendEmailViaResend } from './lib/resend.js'

/**
 * E-mails the photographer the moment someone sends the booking form.
 * Leads she adds by hand in the panel (source: 'manual') are skipped —
 * she already knows about those.
 */
export const notifyNewLead = onDocumentCreated(
  { document: 'leads/{leadId}', region: 'europe-west1', secrets: ['RESEND_API_KEY', 'ADMIN_NOTIFY_EMAIL'] },
  async (event) => {
    const lead = event.data?.data() as
      | { name?: unknown; email?: unknown; phone?: unknown; message?: unknown; source?: unknown }
      | undefined
    if (!lead || lead.source !== 'contact_form') return
    if (typeof lead.name !== 'string' || typeof lead.email !== 'string') return

    const appUrl = process.env.PUBLIC_APP_URL ?? 'https://kuczewska.com'
    const email = buildNewLeadEmail({
      name: lead.name,
      email: lead.email,
      phone: typeof lead.phone === 'string' && lead.phone ? lead.phone : null,
      message: typeof lead.message === 'string' ? lead.message : null,
      leadUrl: `${appUrl}/#/admin/leads/${event.params.leadId}`,
    })

    await sendEmailViaResend({
      to: process.env.ADMIN_NOTIFY_EMAIL ?? 'anna@kuczewska.com',
      subject: email.subject,
      html: email.html,
      // Only a syntactically plain address may become Reply-To.
      replyTo: /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(lead.email) ? lead.email : undefined,
    })
  },
)
