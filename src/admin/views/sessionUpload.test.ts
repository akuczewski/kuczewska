import { describe, expect, it, vi } from 'vitest'
import { renderSessionUploadView } from './sessionUpload'

function setInputFiles(input: HTMLInputElement, files: File[]) {
  Object.defineProperty(input, 'files', { value: files, configurable: true })
  input.dispatchEvent(new Event('change'))
}

describe('renderSessionUploadView', () => {
  it('calls onUploadRaw with the files selected in the RAW input', () => {
    const container = document.createElement('div')
    const onUploadRaw = vi.fn()

    renderSessionUploadView(container, {
      sessionTitle: 'Sesja Mokotów',
      sessionStatus: 'raw',
      onUploadRaw,
      onUploadFinished: vi.fn(),
      onMarkFinished: vi.fn(),
    })

    const file = new File(['abc'], 'zdjecie.jpg', { type: 'image/jpeg' })
    setInputFiles(container.querySelector('.admin-upload-raw')!, [file])

    expect(onUploadRaw).toHaveBeenCalledTimes(1)
    expect(Array.from(onUploadRaw.mock.calls[0]![0] as File[])).toEqual([file])
  })

  it('calls onUploadFinished with the files selected in the finished input', () => {
    const container = document.createElement('div')
    const onUploadFinished = vi.fn()

    renderSessionUploadView(container, {
      sessionTitle: 'Sesja Mokotów',
      sessionStatus: 'selection_done',
      onUploadRaw: vi.fn(),
      onUploadFinished,
      onMarkFinished: vi.fn(),
    })

    const file = new File(['abc'], 'gotowe.jpg', { type: 'image/jpeg' })
    setInputFiles(container.querySelector('.admin-upload-finished')!, [file])

    expect(onUploadFinished).toHaveBeenCalledTimes(1)
    expect(Array.from(onUploadFinished.mock.calls[0]![0] as File[])).toEqual([file])
  })

  it('calls onMarkFinished when the "mark as finished" button is clicked', () => {
    const container = document.createElement('div')
    const onMarkFinished = vi.fn()

    renderSessionUploadView(container, {
      sessionTitle: 'Sesja Mokotów',
      sessionStatus: 'selection_done',
      onUploadRaw: vi.fn(),
      onUploadFinished: vi.fn(),
      onMarkFinished,
    })

    container.querySelector<HTMLButtonElement>('.admin-mark-finished')!.click()

    expect(onMarkFinished).toHaveBeenCalledOnce()
  })

  it('does not call the upload callbacks when the file input is cleared', () => {
    const container = document.createElement('div')
    const onUploadRaw = vi.fn()

    renderSessionUploadView(container, {
      sessionTitle: 'Sesja Mokotów',
      sessionStatus: 'raw',
      onUploadRaw,
      onUploadFinished: vi.fn(),
      onMarkFinished: vi.fn(),
    })

    setInputFiles(container.querySelector('.admin-upload-raw')!, [])

    expect(onUploadRaw).not.toHaveBeenCalled()
  })

  it('reports upload progress while files are being sent', async () => {
    const container = document.createElement('div')
    let finish!: () => void
    const onUploadRaw = vi.fn((_files: FileList, onProgress: (done: number, total: number) => void) => {
      onProgress(1, 2)
      return new Promise<void>((resolve) => {
        finish = () => {
          onProgress(2, 2)
          resolve()
        }
      })
    })

    renderSessionUploadView(container, {
      sessionTitle: 'Sesja Mokotów',
      sessionStatus: 'raw',
      onUploadRaw,
      onUploadFinished: vi.fn(),
      onMarkFinished: vi.fn(),
    })

    const files = [new File(['a'], 'a.jpg'), new File(['b'], 'b.jpg')]
    setInputFiles(container.querySelector('.admin-upload-raw')!, files)

    const progress = container.querySelector('.admin-upload-progress')!
    expect(progress.textContent).toBe('Wgrywanie 1 z 2…')

    finish()
    expect(progress.textContent).toBe('Wgrano 2 z 2.')
  })

  it('offers to reopen the selection only after the client confirmed it', () => {
    const container = document.createElement('div')
    const onReopenSelection = vi.fn()
    const base = {
      sessionTitle: 'Sesja Mokotów',
      onUploadRaw: vi.fn(),
      onUploadFinished: vi.fn(),
      onMarkFinished: vi.fn(),
      onReopenSelection,
    }

    renderSessionUploadView(container, { ...base, sessionStatus: 'raw' })
    expect(container.querySelector('.admin-reopen-selection')).toBeNull()

    renderSessionUploadView(container, { ...base, sessionStatus: 'selection_done' })
    container.querySelector<HTMLButtonElement>('.admin-reopen-selection')!.click()

    expect(onReopenSelection).toHaveBeenCalledOnce()
  })
})
