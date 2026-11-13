export function wrapText(text: string, maxCharsPerLine: number): string[] {
  if (text.trim().length === 0) {
    return []
  }

  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) {
    lines.push(current)
  }

  return lines
}
