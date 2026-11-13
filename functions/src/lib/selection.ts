/**
 * Pure helpers for the "client confirmed their picks" step — what the
 * photographer needs in her inbox to start retouching.
 */
export type SelectedPhotoDoc = {
  id: string
  storagePath?: string
  originalName?: string | null
  clientNote?: string | null
}

export type SelectionSummary = {
  /** File names in natural order (DSC_2 before DSC_10). */
  fileNames: string[]
  notes: Array<{ fileName: string; note: string }>
}

function displayName(photo: SelectedPhotoDoc): string {
  if (photo.originalName) return photo.originalName
  return photo.storagePath?.split('/').pop() || photo.id
}

const byName = new Intl.Collator('pl', { numeric: true, sensitivity: 'base' })

export function buildSelectionSummary(photos: SelectedPhotoDoc[]): SelectionSummary {
  const sorted = photos
    .map((photo) => ({ fileName: displayName(photo), note: (photo.clientNote ?? '').trim() }))
    .sort((a, b) => byName.compare(a.fileName, b.fileName))

  return {
    fileNames: sorted.map((photo) => photo.fileName),
    notes: sorted.filter((photo) => photo.note.length > 0),
  }
}

export type SubmitCheck = { ok: true } | { ok: false; code: 'permission-denied' | 'failed-precondition'; message: string }

/** Who may confirm a selection, and when. */
export function checkCanSubmitSelection(input: {
  callerUid: string | undefined
  session: { clientUid?: string; status?: string } | undefined
  selectedCount: number
}): SubmitCheck {
  if (!input.callerUid || !input.session || input.session.clientUid !== input.callerUid) {
    return { ok: false, code: 'permission-denied', message: 'Nie znaleziono sesji.' }
  }
  if (input.session.status !== 'raw') {
    return { ok: false, code: 'failed-precondition', message: 'Wybór został już zatwierdzony.' }
  }
  if (input.selectedCount === 0) {
    return { ok: false, code: 'failed-precondition', message: 'Wybierz przynajmniej jedno zdjęcie.' }
  }
  return { ok: true }
}
