import { buildSelectionList } from '../../lib/selectionList'

export type SelectionReviewPhoto = {
  id: string
  url: string
  /** Original file name on the photographer's disk. */
  name?: string
  note?: string | null
}

export type SelectionsReviewDeps = {
  sessionTitle: string
  selectedPhotos: SelectionReviewPhoto[]
  /** True once the client pressed "Zatwierdzam wybór". */
  submitted?: boolean
  selectionLimit?: number | null
  copyText?: (text: string) => Promise<void>
}

function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!
  ))
}

export function renderSelectionsReviewView(container: HTMLElement, deps: SelectionsReviewDeps): void {
  const photos = deps.selectedPhotos.map((photo) => ({ ...photo, name: photo.name || photo.id }))
  const list = buildSelectionList(photos.map((photo) => ({ id: photo.id, originalName: photo.name })))
  const withNotes = photos.filter((photo) => photo.note)
  const copyText = deps.copyText ?? ((text: string) => navigator.clipboard.writeText(text))
  const limit = deps.selectionLimit ?? null

  const status = deps.submitted
    ? 'Klient zatwierdził wybór — lista jest ostateczna.'
    : 'Klient jeszcze wybiera — lista może się zmienić.'

  const body =
    photos.length === 0
      ? '<p>Klient nie wybrał jeszcze żadnych zdjęć do obróbki.</p>'
      : `
        <p class="admin-selections-count">Wybrane zdjęcia: <strong>${photos.length}</strong>${limit !== null ? ` z ${limit} w pakiecie` : ''}</p>

        <h2>Nazwy plików</h2>
        <textarea class="admin-selections-names" readonly rows="${Math.min(photos.length, 12)}">${esc(list.lines)}</textarea>
        <div class="admin-selections-actions">
          <button type="button" class="admin-copy-lines">Kopiuj listę plików</button>
          <button type="button" class="admin-copy-query">Kopiuj bez rozszerzeń, w jednej linii</button>
          <span class="admin-copy-feedback" role="status"></span>
        </div>
        <p class="admin-selections-hint">Wersję w jednej linii wklej w filtr tekstowy Lightrooma lub wyszukiwarkę plików — znajdzie też pliki RAW o tych samych nazwach.</p>

        ${withNotes.length === 0 ? '' : `
          <h2>Uwagi klienta</h2>
          <ul class="admin-selections-notes">
            ${withNotes.map((photo) => `<li data-photo-id="${esc(photo.id)}"><strong>${esc(photo.name)}</strong><p>${esc(photo.note)}</p></li>`).join('')}
          </ul>
        `}

        <h2>Podgląd</h2>
        <ul class="admin-selections-list">${photos
          .map(
            (photo) => `
              <li data-photo-id="${esc(photo.id)}">
                <img src="${esc(photo.url)}" alt="${esc(photo.name)}" loading="lazy" />
                <span class="admin-selections-name">${esc(photo.name)}</span>
              </li>`,
          )
          .join('')}</ul>
      `

  container.innerHTML = `
    <section class="admin-selections">
      <h1>Wybrane zdjęcia — ${esc(deps.sessionTitle)}</h1>
      <p class="admin-selections-status">${status}</p>
      ${body}
    </section>
  `

  const feedback = container.querySelector<HTMLElement>('.admin-copy-feedback')
  const copy = (text: string) => {
    copyText(text).then(
      () => { feedback!.textContent = 'Skopiowano.' },
      () => { feedback!.textContent = 'Nie udało się skopiować — zaznacz listę ręcznie.' },
    )
  }

  container.querySelector('.admin-copy-lines')?.addEventListener('click', () => copy(list.lines))
  container.querySelector('.admin-copy-query')?.addEventListener('click', () => copy(list.searchQuery))
}
