/**
 * Pure helpers that turn the client's picks into something the photographer
 * can paste straight into her file browser / Lightroom filter.
 */
export type NamedPhoto = {
  id: string
  storagePath?: string
  originalName?: string | null
}

/** Original file name, or — for photos uploaded before names were recorded — the stored file name. */
export function photoDisplayName(photo: NamedPhoto): string {
  if (photo.originalName) return photo.originalName
  const stored = photo.storagePath?.split('/').pop()
  return stored || photo.id
}

export function stripExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(0, dot) : fileName
}

const byName = new Intl.Collator('pl', { numeric: true, sensitivity: 'base' })

/** DSC_2 before DSC_10 — the order the photographer sees on disk. */
export function sortPhotosByName<T extends NamedPhoto>(photos: T[]): T[] {
  return [...photos].sort((a, b) => byName.compare(photoDisplayName(a), photoDisplayName(b)))
}

export type SelectionList = {
  /** One file name per line. */
  lines: string
  /** Names without extensions on a single line — matches RAW files too (DSC_0412 → DSC_0412.NEF). */
  searchQuery: string
}

export function buildSelectionList(photos: NamedPhoto[]): SelectionList {
  const names = sortPhotosByName(photos).map(photoDisplayName)
  return {
    lines: names.join('\n'),
    searchQuery: names.map(stripExtension).join(' '),
  }
}
