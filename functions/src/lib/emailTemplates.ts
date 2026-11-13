export type EmailContent = {
  subject: string
  html: string
}

export function buildOfferEmail(input: { leadName: string; offerUrl: string }): EmailContent {
  return {
    subject: 'Twoja oferta sesji zdjęciowej — Kuczewska Fotografia',
    html: `
      <p>Cześć ${input.leadName},</p>
      <p>Przygotowałam dla Ciebie ofertę sesji zdjęciowej. Możesz ją zobaczyć i zaakceptować pod linkiem poniżej:</p>
      <p><a href="${input.offerUrl}">${input.offerUrl}</a></p>
      <p>Pozdrawiam,<br/>Anna Kuczewska</p>
    `,
  }
}

export function buildContractEmail(input: { leadName: string; contractUrl: string }): EmailContent {
  return {
    subject: 'Umowa do podpisania — Kuczewska Fotografia',
    html: `
      <p>Cześć ${input.leadName},</p>
      <p>Dziękuję za akceptację oferty! Poniżej znajdziesz link do umowy — zapoznaj się z jej treścią i potwierdź akceptację:</p>
      <p><a href="${input.contractUrl}">${input.contractUrl}</a></p>
      <p>Pozdrawiam,<br/>Anna Kuczewska</p>
    `,
  }
}

export function buildPasswordSetupEmail(input: { leadName: string; resetLink: string }): EmailContent {
  return {
    subject: 'Twoje konto klienta — Kuczewska Fotografia',
    html: `
      <p>Cześć ${input.leadName},</p>
      <p>Twoja sesja jest zarezerwowana! Utworzyłam dla Ciebie konto w portalu klienta, w którym zobaczysz zdjęcia z sesji.</p>
      <p>Ustaw hasło do swojego konta pod linkiem poniżej:</p>
      <p><a href="${input.resetLink}">${input.resetLink}</a></p>
      <p>Pozdrawiam,<br/>Anna Kuczewska</p>
    `,
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ))
}

/** To the photographer: the client confirmed their picks — file names ready to copy. */
export function buildSelectionSubmittedEmail(input: {
  sessionTitle: string
  clientEmail: string | null
  fileNames: string[]
  notes: Array<{ fileName: string; note: string }>
  selectionLimit: number | null
  sessionUrl: string
}): EmailContent {
  const count = input.fileNames.length
  const limitLine = input.selectionLimit !== null
    ? `<p>Wybrane zdjęcia: <strong>${count}</strong> z ${input.selectionLimit} w pakiecie${count > input.selectionLimit ? ` (${count - input.selectionLimit} ponad pakiet)` : ''}.</p>`
    : `<p>Wybrane zdjęcia: <strong>${count}</strong>.</p>`

  const notesBlock = input.notes.length === 0
    ? ''
    : `<p><strong>Uwagi klienta:</strong></p><ul>${input.notes
        .map((item) => `<li><strong>${escapeHtml(item.fileName)}</strong> — ${escapeHtml(item.note)}</li>`)
        .join('')}</ul>`

  return {
    subject: `Klient zatwierdził wybór zdjęć — ${input.sessionTitle}`,
    html: `
      <p>Klient${input.clientEmail ? ` (${escapeHtml(input.clientEmail)})` : ''} zatwierdził wybór zdjęć z sesji „${escapeHtml(input.sessionTitle)}".</p>
      ${limitLine}
      <p><strong>Nazwy plików:</strong></p>
      <pre style="font-family: monospace; font-size: 14px; line-height: 1.5;">${input.fileNames.map(escapeHtml).join('\n')}</pre>
      ${notesBlock}
      <p><a href="${input.sessionUrl}">Otwórz sesję w panelu</a></p>
    `,
  }
}

/** To the photographer: someone sent the booking form on the website. */
export function buildNewLeadEmail(input: {
  name: string
  email: string
  phone: string | null
  message: string | null
  leadUrl: string
}): EmailContent {
  const message = (input.message ?? '').trim()

  return {
    subject: `Nowe zapytanie o sesję — ${input.name}`,
    html: `
      <p><strong>${escapeHtml(input.name)}</strong> wysłał(a) zapytanie przez formularz na stronie.</p>
      <p>
        E-mail: <a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a><br/>
        Telefon: ${input.phone ? `<a href="tel:${escapeHtml(input.phone)}">${escapeHtml(input.phone)}</a>` : 'nie podano'}
      </p>
      ${message ? `<p style="white-space: pre-line;">${escapeHtml(message)}</p>` : ''}
      <p>Odpowiedz na tę wiadomość, żeby napisać bezpośrednio do tej osoby, albo <a href="${input.leadUrl}">otwórz zapytanie w panelu</a> i przygotuj ofertę.</p>
    `,
  }
}
