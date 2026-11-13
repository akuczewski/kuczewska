export type OfferLine = {
  packageId: string
  name: string
  priceGrosze: number
}

export function sumOfferLines(lines: OfferLine[]): number {
  return lines.reduce((total, line) => total + line.priceGrosze, 0)
}

export function formatGrosze(priceGrosze: number): string {
  return `${(priceGrosze / 100).toFixed(2).replace('.', ',')} zł`
}
