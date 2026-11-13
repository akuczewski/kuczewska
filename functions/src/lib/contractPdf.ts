import { formatGrosze, type OfferLine } from './pricing.js'
import { DRAFT_CONTRACT_TERMS } from './contractTerms.js'

export type ContractPdfContent = {
  title: string
  leadName: string
  lines: Array<{ text: string }>
  totalLine: string
  termsText: string
}

export type BuildContractPdfContentInput = {
  leadName: string
  lines: OfferLine[]
  totalPriceGrosze: number
}

export function buildContractPdfContent(input: BuildContractPdfContentInput): ContractPdfContent {
  return {
    title: 'Umowa o świadczenie usług fotograficznych — Kuczewska Fotografia',
    leadName: input.leadName,
    lines: input.lines.map((line) => ({ text: `${line.name} — ${formatGrosze(line.priceGrosze)}` })),
    totalLine: `Wynagrodzenie łącznie: ${formatGrosze(input.totalPriceGrosze)}`,
    termsText: DRAFT_CONTRACT_TERMS,
  }
}
