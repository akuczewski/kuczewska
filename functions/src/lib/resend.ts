/**
 * Thin wrapper around the Resend REST API — intentionally not unit tested
 * (network call). RESEND_API_KEY / RESEND_FROM_EMAIL come from Firebase
 * Functions config/secrets, never committed to the repo.
 */
export async function sendEmailViaResend(input: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured.')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'Anna Kuczewska <no-reply@kuczewska.com>',
      to: input.to,
      subject: input.subject,
      html: input.html,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend API error: ${response.status} ${body}`)
  }
}
