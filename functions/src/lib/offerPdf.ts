import { formatGrosze, type OfferLine } from './pricing.js'

export type OfferPdfContent = {
  title: string
  leadName: string
  lines: Array<{ text: string }>
  totalLine: string
  validUntilLine: string
}

function formatDatePl(date: Date): string {
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = date.getUTCFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export type BuildOfferPdfContentInput = {
  leadName: string
  lines: OfferLine[]
  totalPriceGrosze: number
  validUntil: Date
}

export function buildOfferPdfContent(input: BuildOfferPdfContentInput): OfferPdfContent {
  return {
    title: 'Oferta — Kuczewska Fotografia',
    leadName: input.leadName,
    lines: input.lines.map((line) => ({ text: `${line.name} — ${formatGrosze(line.priceGrosze)}` })),
    totalLine: `Razem: ${formatGrosze(input.totalPriceGrosze)}`,
    validUntilLine: `Oferta ważna do: ${formatDatePl(input.validUntil)}`,
  }
}
