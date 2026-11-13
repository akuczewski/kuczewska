import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { ContractPdfContent } from './contractPdf.js'
import { wrapText } from './textWrap.js'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN_TOP = 780
const MARGIN_BOTTOM = 50
const CHARS_PER_LINE = 90

/**
 * Impure rendering step (pdf-lib) — intentionally not unit tested, same
 * exception as renderOfferPdf()/watermarkImage(): the content is a pure,
 * tested function (buildContractPdfContent); only the drawing is untested.
 */
export async function renderContractPdf(content: ContractPdfContent): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = MARGIN_TOP

  const newPageIfNeeded = () => {
    if (y < MARGIN_BOTTOM) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = MARGIN_TOP
    }
  }

  const drawLine = (text: string, size = 11, useFont = font) => {
    newPageIfNeeded()
    page.drawText(text, { x: 50, y, size, font: useFont, color: rgb(0, 0, 0) })
    y -= size + 8
  }

  drawLine(content.title, 18, boldFont)
  y -= 10
  drawLine(`Klient: ${content.leadName}`, 13)
  y -= 10
  content.lines.forEach((line) => drawLine(line.text))
  y -= 6
  drawLine(content.totalLine, 13, boldFont)
  y -= 16

  for (const paragraph of content.termsText.split('\n')) {
    if (paragraph.trim().length === 0) {
      y -= 8
      continue
    }
    for (const wrapped of wrapText(paragraph, CHARS_PER_LINE)) {
      drawLine(wrapped, 10)
    }
  }

  return pdfDoc.save()
}
