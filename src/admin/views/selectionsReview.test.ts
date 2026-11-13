import { describe, expect, it, vi } from 'vitest'
import { renderSelectionsReviewView } from './selectionsReview'

const selectedPhotos = [
  { id: 'photo-2', url: 'https://example.com/photo-2.jpg', name: 'DSC_0420.jpg', note: 'Usunąć kabel przy lampie' },
  { id: 'photo-1', url: 'https://example.com/photo-1.jpg', name: 'DSC_0412.jpg' },
]

describe('renderSelectionsReviewView', () => {
  it('renders one preview with its file name per selected photo', () => {
    const container = document.createElement('div')

    renderSelectionsReviewView(container, { sessionTitle: 'Sesja Mokotów', selectedPhotos })

    const items = container.querySelectorAll('.admin-selections-list li')
    expect(items).toHaveLength(2)
    expect(items[0]!.querySelector('img')!.src).toBe('https://example.com/photo-2.jpg')
    expect(items[0]!.querySelector('.admin-selections-name')!.textContent).toBe('DSC_0420.jpg')
  })

  it('lists the file names sorted, one per line', () => {
    const container = document.createElement('div')

    renderSelectionsReviewView(container, { sessionTitle: 'Sesja Mokotów', selectedPhotos })

    const names = container.querySelector<HTMLTextAreaElement>('.admin-selections-names')!
    expect(names.value).toBe('DSC_0412.jpg\nDSC_0420.jpg')
    expect(container.querySelector('.admin-selections-count')!.textContent).toContain('2')
  })

  it('copies the list as lines or as a one-line query without extensions', async () => {
    const container = document.createElement('div')
    const copyText = vi.fn().mockResolvedValue(undefined)

    renderSelectionsReviewView(container, { sessionTitle: 'Sesja Mokotów', selectedPhotos, copyText })

    container.querySelector<HTMLButtonElement>('.admin-copy-lines')!.click()
    container.querySelector<HTMLButtonElement>('.admin-copy-query')!.click()

    expect(copyText).toHaveBeenNthCalledWith(1, 'DSC_0412.jpg\nDSC_0420.jpg')
    expect(copyText).toHaveBeenNthCalledWith(2, 'DSC_0412 DSC_0420')
    await vi.waitFor(() =>
      expect(container.querySelector('.admin-copy-feedback')!.textContent).toBe('Skopiowano.'),
    )
  })

  it("shows the client's retouching notes next to the file name", () => {
    const container = document.createElement('div')

    renderSelectionsReviewView(container, { sessionTitle: 'Sesja Mokotów', selectedPhotos })

    const notes = container.querySelectorAll('.admin-selections-notes li')
    expect(notes).toHaveLength(1)
    expect(notes[0]!.textContent).toContain('DSC_0420.jpg')
    expect(notes[0]!.textContent).toContain('Usunąć kabel przy lampie')
  })

  it('says whether the client has confirmed the selection', () => {
    const container = document.createElement('div')

    renderSelectionsReviewView(container, { sessionTitle: 'Sesja', selectedPhotos, submitted: false })
    expect(container.querySelector('.admin-selections-status')!.textContent).toContain('jeszcze wybiera')

    renderSelectionsReviewView(container, { sessionTitle: 'Sesja', selectedPhotos, submitted: true })
    expect(container.querySelector('.admin-selections-status')!.textContent).toContain('zatwierdził')
  })

  it('shows a friendly message when the client has not selected anything yet', () => {
    const container = document.createElement('div')

    renderSelectionsReviewView(container, { sessionTitle: 'Sesja Mokotów', selectedPhotos: [] })

    expect(container.querySelector('.admin-selections-list')).toBeNull()
    expect(container.querySelector('.admin-selections-names')).toBeNull()
    expect(container.textContent).toContain('nie wybrał')
  })
})
