/**
 * Hands a Blob to the browser as a file download. DOM side effect only —
 * intentionally not unit tested (same exception as watermarkImage()).
 */
export function saveBlobAs(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
