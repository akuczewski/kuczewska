import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { OfferPdfContent } from './offerPdf.js'

/**
 * Impure rendering step (pdf-lib) — intentionally not unit tested, mirroring
 * the watermarkImage()/canvas exception in the web app: the content that goes
 * onto the page is a pure, tested function (buildOfferPdfContent); only the
 * actual drawing is left untested here.
 */
export async function renderOfferPdf(content: OfferPdfContent): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = 780
  const drawLine = (text: string, size = 12, useFont = font) => {
    page.drawText(text, { x: 50, y, size, font: useFont, color: rgb(0, 0, 0) })
    y -= size + 10
  }

  drawLine(content.title, 20, boldFont)
  y -= 10
  drawLine(`Dla: ${content.leadName}`, 14)
  y -= 10
  content.lines.forEach((line) => drawLine(line.text))
  y -= 10
  drawLine(content.totalLine, 14, boldFont)
  y -= 10
  drawLine(content.validUntilLine, 10)

  return pdfDoc.save()
}
