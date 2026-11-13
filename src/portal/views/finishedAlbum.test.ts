import { describe, expect, it, vi } from 'vitest'
import { renderFinishedAlbumView } from './finishedAlbum'

const photos = [
  { id: 'photo-1', url: 'https://example.com/finished-1.jpg', name: 'salon-01.jpg' },
  { id: 'photo-2', url: 'https://example.com/finished-2.jpg', name: 'salon-02.jpg' },
]

describe('renderFinishedAlbumView', () => {
  it('renders one item with an image and a download link per finished photo', () => {
    const container = document.createElement('div')

    renderFinishedAlbumView(container, { title: 'Sesja Mokotów', photos })

    const items = container.querySelectorAll('.portal-finished-grid li')
    expect(items).toHaveLength(2)

    const firstImg = items[0]!.querySelector('img')!
    const firstLink = items[0]!.querySelector<HTMLAnchorElement>('a[download]')!
    expect(firstImg.src).toBe('https://example.com/finished-1.jpg')
    expect(firstLink.href).toBe('https://example.com/finished-1.jpg')
  })

  it('shows a friendly message when there are no finished photos yet', () => {
    const container = document.createElement('div')

    renderFinishedAlbumView(container, { title: 'Sesja Mokotów', photos: [], onDownload: vi.fn() })

    expect(container.querySelector('.portal-finished-grid')).toBeNull()
    expect(container.querySelector('.finished-download-all')).toBeNull()
    expect(container.textContent).toContain('pojawią się tutaj')
  })

  it('downloads a single photo through onDownload', () => {
    const container = document.createElement('div')
    const onDownload = vi.fn().mockResolvedValue(undefined)

    renderFinishedAlbumView(container, { title: 'Sesja', photos, onDownload })
    container.querySelectorAll<HTMLButtonElement>('.finished-download')[1]!.click()

    expect(onDownload).toHaveBeenCalledWith(photos[1])
  })

  it('downloads every photo in order and reports progress', async () => {
    const container = document.createElement('div')
    const onDownload = vi.fn().mockResolvedValue(undefined)

    renderFinishedAlbumView(container, { title: 'Sesja', photos, onDownload })

    const button = container.querySelector<HTMLButtonElement>('.finished-download-all')!
    expect(button.textContent).toContain('(2)')
    button.click()

    const progress = container.querySelector('.finished-progress')!
    await vi.waitFor(() => expect(progress.textContent).toContain('Pobrano 2 z 2'))
    expect(onDownload.mock.calls.map((call) => call[0])).toEqual(photos)
    expect(button.disabled).toBe(false)
  })

  it('keeps going and says how many failed when a download breaks', async () => {
    const container = document.createElement('div')
    const onDownload = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue(undefined)

    renderFinishedAlbumView(container, { title: 'Sesja', photos, onDownload })
    container.querySelector<HTMLButtonElement>('.finished-download-all')!.click()

    const progress = container.querySelector('.finished-progress')!
    await vi.waitFor(() => expect(progress.textContent).toContain('Pobrano 1 z 2'))
    expect(onDownload).toHaveBeenCalledTimes(2)
  })
})
