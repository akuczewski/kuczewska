import { describe, expect, it, vi } from 'vitest'
import { type AlbumPhoto, renderSessionAlbumView } from './sessionAlbum'

function twoPhotos(): AlbumPhoto[] {
  return [
    { id: 'photo-1', url: 'https://example.com/photo-1.jpg', name: 'DSC_0001.jpg', selectedByClient: false },
    { id: 'photo-2', url: 'https://example.com/photo-2.jpg', name: 'DSC_0002.jpg', selectedByClient: true, note: 'Usunąć kabel' },
  ]
}

function hearts(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLButtonElement>('.album-heart'))
}

describe('renderSessionAlbumView', () => {
  it('renders one grid item with an image and a heart per photo', () => {
    const container = document.createElement('div')

    renderSessionAlbumView(container, { title: 'Sesja Mokotów', photos: twoPhotos(), onToggleSelection: () => {} })

    const items = container.querySelectorAll('.portal-album-grid li')
    expect(items).toHaveLength(2)
    expect(items[0]!.querySelector('img')!.src).toBe('https://example.com/photo-1.jpg')

    expect(hearts(container).map((h) => h.getAttribute('aria-pressed'))).toEqual(['false', 'true'])
    expect(items[1]!.classList.contains('is-selected')).toBe(true)
  })

  it('shows the session title as the heading', () => {
    const container = document.createElement('div')

    renderSessionAlbumView(container, { title: 'Sesja Mokotów', photos: [], onToggleSelection: () => {} })

    expect(container.querySelector('h1')!.textContent).toBe('Sesja Mokotów')
  })

  it('calls onToggleSelection and flips the heart when it is clicked', () => {
    const container = document.createElement('div')
    const calls: Array<[string, boolean]> = []

    renderSessionAlbumView(container, {
      title: 'Sesja Mokotów',
      photos: twoPhotos(),
      onToggleSelection: (photoId, selected) => calls.push([photoId, selected]),
    })

    hearts(container)[0]!.click()
    hearts(container)[1]!.click()

    expect(calls).toEqual([['photo-1', true], ['photo-2', false]])
    expect(hearts(container).map((h) => h.getAttribute('aria-pressed'))).toEqual(['true', 'false'])
  })

  it('counts picked photos against the package limit and flags the surplus', () => {
    const container = document.createElement('div')

    renderSessionAlbumView(container, {
      title: 'Sesja Mokotów',
      photos: twoPhotos(),
      selectionLimit: 1,
      onToggleSelection: () => {},
    })

    const count = container.querySelector('.album-count')!
    expect(count.textContent).toContain('Wybrano 1 z 1 w pakiecie')
    expect(count.querySelector('.album-over')).toBeNull()

    hearts(container)[0]!.click()

    expect(count.textContent).toContain('Wybrano 2 z 1 w pakiecie')
    expect(count.querySelector('.album-over')!.textContent).toContain('1 ponad pakiet')
  })

  it('shows a plain count when the session has no package limit', () => {
    const container = document.createElement('div')

    renderSessionAlbumView(container, { title: 'Sesja', photos: twoPhotos(), onToggleSelection: () => {} })

    expect(container.querySelector('.album-count')!.textContent).toBe('Wybrano: 1')
  })

  it('keeps the confirm button disabled until at least one photo is picked', () => {
    const container = document.createElement('div')
    const photos = twoPhotos().map((p) => ({ ...p, selectedByClient: false }))

    renderSessionAlbumView(container, { title: 'Sesja', photos, onToggleSelection: () => {}, onSubmit: vi.fn() })

    const submit = container.querySelector<HTMLButtonElement>('.album-submit')!
    expect(submit.disabled).toBe(true)

    hearts(container)[0]!.click()
    expect(submit.disabled).toBe(false)
  })

  it('asks for confirmation, then submits and locks the album', async () => {
    const container = document.createElement('div')
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    renderSessionAlbumView(container, { title: 'Sesja', photos: twoPhotos(), onToggleSelection: () => {}, onSubmit })

    container.querySelector<HTMLButtonElement>('.album-submit')!.click()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(container.querySelector<HTMLElement>('.album-confirm')!.hidden).toBe(false)
    expect(container.querySelector('.album-confirm-text')!.textContent).toContain('1 zdjęcie')

    container.querySelector<HTMLButtonElement>('.album-confirm-yes')!.click()

    await vi.waitFor(() => expect(container.querySelector('.portal-album--locked')).not.toBeNull())
    expect(onSubmit).toHaveBeenCalledOnce()
    expect(container.querySelector('.album-submit')).toBeNull()
    expect(hearts(container).every((h) => h.disabled)).toBe(true)
  })

  it('uses the right Polish plural in the confirmation question', () => {
    const container = document.createElement('div')
    const photos = Array.from({ length: 23 }, (_, i) => ({
      id: `p${i}`,
      url: `https://example.com/${i}.jpg`,
      selectedByClient: i < 3,
    }))

    renderSessionAlbumView(container, { title: 'Sesja', photos, onToggleSelection: () => {}, onSubmit: vi.fn() })
    const submit = container.querySelector<HTMLButtonElement>('.album-submit')!
    const text = container.querySelector('.album-confirm-text')!

    submit.click()
    expect(text.textContent).toContain('3 zdjęcia')

    for (let i = 3; i < 12; i++) hearts(container)[i]!.click()
    submit.click()
    expect(text.textContent).toContain('12 zdjęć')
  })

  it('keeps the selection editable and explains when submitting fails', async () => {
    const container = document.createElement('div')
    const onSubmit = vi.fn().mockRejectedValue(new Error('offline'))

    renderSessionAlbumView(container, { title: 'Sesja', photos: twoPhotos(), onToggleSelection: () => {}, onSubmit })

    container.querySelector<HTMLButtonElement>('.album-submit')!.click()
    container.querySelector<HTMLButtonElement>('.album-confirm-yes')!.click()

    const error = container.querySelector<HTMLElement>('.album-error')!
    await vi.waitFor(() => expect(error.hidden).toBe(false))
    expect(error.textContent).toContain('Nie udało się')
    expect(container.querySelector('.portal-album--locked')).toBeNull()
  })

  it('does not toggle anything once the selection is locked', () => {
    const container = document.createElement('div')
    const onToggleSelection = vi.fn()

    renderSessionAlbumView(container, { title: 'Sesja', photos: twoPhotos(), locked: true, onToggleSelection, onSubmit: vi.fn() })

    hearts(container)[0]!.click()

    expect(onToggleSelection).not.toHaveBeenCalled()
    expect(container.querySelector('.album-submit')).toBeNull()
    expect(container.querySelector('.album-intro')!.textContent).toContain('zatwierdzony')
  })

  it('opens the enlarged view on the clicked photo and steps to the next one', () => {
    const container = document.createElement('div')

    renderSessionAlbumView(container, { title: 'Sesja', photos: twoPhotos(), onToggleSelection: () => {} })

    const lightbox = container.querySelector<HTMLElement>('.album-lightbox')!
    expect(lightbox.hidden).toBe(true)

    container.querySelectorAll<HTMLButtonElement>('.album-open')[0]!.click()

    expect(lightbox.hidden).toBe(false)
    expect(lightbox.querySelector<HTMLImageElement>('.lightbox-img')!.src).toBe('https://example.com/photo-1.jpg')
    expect(lightbox.querySelector('.lightbox-name')!.textContent).toBe('DSC_0001.jpg · 1 z 2')

    lightbox.querySelector<HTMLButtonElement>('.lightbox-next')!.click()
    expect(lightbox.querySelector('.lightbox-name')!.textContent).toBe('DSC_0002.jpg · 2 z 2')

    lightbox.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(lightbox.hidden).toBe(true)
  })

  it('offers the note field only for picked photos and saves the note', () => {
    const container = document.createElement('div')
    const onSaveNote = vi.fn()

    renderSessionAlbumView(container, { title: 'Sesja', photos: twoPhotos(), onToggleSelection: () => {}, onSaveNote })

    const lightbox = container.querySelector<HTMLElement>('.album-lightbox')!
    const noteLabel = lightbox.querySelector<HTMLElement>('.lightbox-note')!
    const noteField = lightbox.querySelector<HTMLTextAreaElement>('textarea')!

    container.querySelectorAll<HTMLButtonElement>('.album-open')[0]!.click()
    expect(noteLabel.hidden).toBe(true)

    lightbox.querySelector<HTMLButtonElement>('.lightbox-heart')!.click()
    expect(noteLabel.hidden).toBe(false)

    noteField.value = ' Wyprostować obraz na ścianie '
    noteField.dispatchEvent(new Event('change'))

    expect(onSaveNote).toHaveBeenCalledWith('photo-1', 'Wyprostować obraz na ścianie')
    expect(container.querySelectorAll<HTMLElement>('.album-note-flag')[0]!.hidden).toBe(false)
  })

  it('shows an existing note when the photo is enlarged', () => {
    const container = document.createElement('div')

    renderSessionAlbumView(container, { title: 'Sesja', photos: twoPhotos(), onToggleSelection: () => {} })
    container.querySelectorAll<HTMLButtonElement>('.album-open')[1]!.click()

    expect(container.querySelector<HTMLTextAreaElement>('.album-lightbox textarea')!.value).toBe('Usunąć kabel')
  })
})
