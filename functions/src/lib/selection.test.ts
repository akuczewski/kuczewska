import { describe, expect, it } from 'vitest'
import { buildSelectionSummary, checkCanSubmitSelection } from './selection.js'

describe('buildSelectionSummary', () => {
  it('lists file names in natural order', () => {
    const summary = buildSelectionSummary([
      { id: 'a', originalName: 'DSC_10.jpg' },
      { id: 'b', originalName: 'DSC_2.jpg' },
    ])

    expect(summary.fileNames).toEqual(['DSC_2.jpg', 'DSC_10.jpg'])
  })

  it('falls back to the stored file name when the original name was not recorded', () => {
    const summary = buildSelectionSummary([{ id: 'a', storagePath: 'sessions/s1/raw/uuid-1.jpg' }])

    expect(summary.fileNames).toEqual(['uuid-1.jpg'])
  })

  it('collects only non-empty notes, paired with their file', () => {
    const summary = buildSelectionSummary([
      { id: 'a', originalName: 'DSC_1.jpg', clientNote: '  Usunąć kabel ' },
      { id: 'b', originalName: 'DSC_2.jpg', clientNote: '   ' },
      { id: 'c', originalName: 'DSC_3.jpg' },
    ])

    expect(summary.notes).toEqual([{ fileName: 'DSC_1.jpg', note: 'Usunąć kabel' }])
  })
})

describe('checkCanSubmitSelection', () => {
  const session = { clientUid: 'client-1', status: 'raw' }

  it('accepts the assigned client with at least one pick on an open session', () => {
    expect(checkCanSubmitSelection({ callerUid: 'client-1', session, selectedCount: 3 })).toEqual({ ok: true })
  })

  it('rejects anonymous callers, other clients and unknown sessions without revealing which', () => {
    for (const input of [
      { callerUid: undefined, session, selectedCount: 3 },
      { callerUid: 'client-2', session, selectedCount: 3 },
      { callerUid: 'client-1', session: undefined, selectedCount: 3 },
    ]) {
      const result = checkCanSubmitSelection(input)
      expect(result).toMatchObject({ ok: false, code: 'permission-denied', message: 'Nie znaleziono sesji.' })
    }
  })

  it('rejects a second confirmation', () => {
    const result = checkCanSubmitSelection({
      callerUid: 'client-1',
      session: { clientUid: 'client-1', status: 'selection_done' },
      selectedCount: 3,
    })

    expect(result).toMatchObject({ ok: false, code: 'failed-precondition' })
  })

  it('rejects an empty selection', () => {
    const result = checkCanSubmitSelection({ callerUid: 'client-1', session, selectedCount: 0 })

    expect(result).toMatchObject({ ok: false, code: 'failed-precondition' })
  })
})
